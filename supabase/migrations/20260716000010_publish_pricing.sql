-- ============================================================================
-- 0010 — Server-side publish pricing (Create Event session 3).
--
-- DECIDED 2026-07-16: the mock checkout publishes via a definer RPC that
-- prices the listing itself, so the client NEVER asserts a fee amount. The
-- full `orders` table + Stripe webhook publish path stay where the plan puts
-- them (SCHEMA_PLAN §7 / migration 0004_payments, BUILD_PLAN stage 6) — this
-- is deliberately the smaller half: pricing authority now, payment rails later.
--
-- SCOPE NOTE (deliberate, not an oversight): this migration does NOT add the
-- "clients may not set status → published on paid tiers" guard. That guard is
-- 0004's job and lands with real Stripe. Until then the RPC is the app's only
-- publish path for paid tiers, but it is not the DB's only one.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Fee guard — publish_fee_cents is priced at checkout, never by a client.
--
-- Two bypasses, both intentional:
--   * app.pricing_context — transaction-local flag set by the RPC below.
--   * postgres / service_role / supabase_admin — migrations, the seed script,
--     and any future server-side pipeline (the Stripe webhook in 0004).
-- INVOKER on purpose: current_role must resolve to the real caller, not the
-- function owner.
-- ---------------------------------------------------------------------------
create or replace function app.guard_publish_fee()
returns trigger
language plpgsql
security invoker
set search_path = public, app
as $$
begin
  if coalesce(current_setting('app.pricing_context', true), '') = 'on'
     or current_role in ('postgres', 'service_role', 'supabase_admin') then
    return new;
  end if;

  if tg_op = 'INSERT' and new.publish_fee_cents is not null then
    raise exception 'publish_fee_cents is priced server-side at checkout'
      using errcode = '42501';
  end if;

  if tg_op = 'UPDATE'
     and new.publish_fee_cents is distinct from old.publish_fee_cents then
    raise exception 'publish_fee_cents is priced server-side at checkout'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists events_guard_publish_fee on public.events;
create trigger events_guard_publish_fee
  before insert or update on public.events
  for each row execute function app.guard_publish_fee();

-- ---------------------------------------------------------------------------
-- Duration band — the pricing spine's Single / Multi (2–4) / Extended (5+).
--
-- Computed on the HOST'S WALL CLOCK, not UTC. starts_at/ends_at are the single
-- UTC source of truth (SCHEMA LOCK 5), but "how many days is this event" is a
-- local-calendar question: a 7pm Fri → 10am Mon event in Phoenix spans 4 local
-- days and only 3 UTC days, which would underprice it a whole band. So the
-- caller passes its IANA zone.
--
-- Tradeoff accepted (flagged): tz is client-supplied. It is a LOCALE input,
-- not a fee input — the amount still comes from tier_prices — and the worst a
-- spoofed zone can do is shift the band by one day at a boundary. Stage 6
-- revisits when Stripe prices the payment intent. An unknown zone falls back
-- to UTC rather than failing the publish.
-- ---------------------------------------------------------------------------
create or replace function app.duration_band(
  starts_at timestamptz,
  ends_at timestamptz,
  tz text
)
returns text
language plpgsql
stable
set search_path = public, app
as $$
declare
  zone text := coalesce(tz, 'UTC');
  days integer;
begin
  if not exists (select 1 from pg_timezone_names n where n.name = zone) then
    zone := 'UTC';
  end if;

  days := greatest(
    1,
    (date(coalesce(ends_at, starts_at) at time zone zone)
     - date(starts_at at time zone zone)) + 1
  );

  return case
    when days <= 1 then 'single'
    when days <= 4 then 'multi'
    else 'extended'
  end;
end;
$$;

-- ---------------------------------------------------------------------------
-- publish_paid_event — the mock checkout's "pay" action.
--
-- Definer: it must read tier_prices authoritatively and stamp a fee the client
-- is trigger-blocked from writing. Membership is re-checked by hand precisely
-- BECAUSE definer bypasses RLS.
-- ---------------------------------------------------------------------------
create or replace function public.publish_paid_event(event_id uuid, tz text default 'UTC')
returns table (id uuid, publish_fee_cents integer, duration_band text)
language plpgsql
security definer
set search_path = public, app, extensions
as $$
declare
  ev public.events%rowtype;
  band text;
  amount integer;
begin
  select * into ev from public.events e where e.id = publish_paid_event.event_id;
  if not found then
    raise exception 'event_not_found' using errcode = '42704';
  end if;

  -- Definer bypasses RLS — this check IS the authorization.
  if not app.is_member(ev.workspace_id, array['owner', 'editor']) then
    raise exception 'not_a_member' using errcode = '42501';
  end if;

  -- Curbside is free and publishes directly from the mini-form; routing it
  -- through paid checkout would be a bug worth surfacing loudly.
  if ev.tier_id = 'curbside' then
    raise exception 'curbside_publishes_free' using errcode = '22023';
  end if;

  if ev.status = 'published' then
    raise exception 'already_published' using errcode = '22023';
  end if;

  band := app.duration_band(ev.starts_at, ev.ends_at, tz);

  select tp.amount_cents into amount
  from public.tier_prices tp
  where tp.tier_id = ev.tier_id
    and tp.duration_band = band;

  if amount is null then
    raise exception 'no_price_for_tier_band' using errcode = '22023';
  end if;

  -- Transaction-local: lets THIS update through the fee guard and nothing else.
  perform set_config('app.pricing_context', 'on', true);

  update public.events e
     set publish_fee_cents = amount,
         status = 'published'
   where e.id = ev.id;

  return query select ev.id, amount, band;
end;
$$;

revoke all on function public.publish_paid_event(uuid, text) from public, anon;
grant execute on function public.publish_paid_event(uuid, text) to authenticated;

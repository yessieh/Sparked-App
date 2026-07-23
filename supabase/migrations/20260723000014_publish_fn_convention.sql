-- ============================================================================
-- 0014 — bring public.publish_paid_event (0010) onto the project's definer
-- convention, closing the OPEN item flagged in SCHEMA_PLAN §7.2 tradeoff 3.
--
-- WHY NOW: that item was deliberately deferred "past the live publish walk
-- rather than putting an untested change under the flow that most needs to
-- work". The walk is complete (Create Event arc closed 2026-07-23), so the
-- restructure is safe to take.
--
-- CONVENTION (set by 0008's curbside pair, followed by 0012's fee reader): the
-- SECURITY DEFINER body lives in `app` — a schema the Data API does not expose,
-- so the advisor never lints it — and `public` carries a thin SECURITY INVOKER
-- wrapper. 0010 shipped this as definer-and-client-callable, which is exactly
-- the shape the advisor flags as "Public/Signed-In Users Can Execute SECURITY
-- DEFINER Function".
--
-- BEHAVIOR IS UNCHANGED. Same membership gate, same rejections, same error
-- codes and messages (the checkout screen surfaces rpcError.message verbatim),
-- same transaction-local pricing_context bypass of the 0010 fee guard.
--
-- PARAMETER NAMES ARE LOAD-BEARING on the public wrapper: PostgREST calls RPCs
-- with NAMED arguments, and the app sends `{ event_id, tz }`
-- (create/checkout.tsx). They must stay `event_id` / `tz` or every publish
-- breaks. The app-schema body uses p_ prefixes instead — a bare `event_id`
-- would be ambiguous against events.id and a parameter cannot be
-- schema-qualified to disambiguate (same reasoning as 0012).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Internal body — definer. Membership is re-checked BY HAND precisely because
-- definer bypasses RLS. Moved verbatim from 0010 apart from the p_ prefixes.
-- ---------------------------------------------------------------------------
create or replace function app.publish_paid_event(p_event_id uuid, p_tz text default 'UTC')
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
  select * into ev from public.events e where e.id = p_event_id;
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

  band := app.duration_band(ev.starts_at, ev.ends_at, p_tz);

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

revoke all on function app.publish_paid_event(uuid, text) from public, anon;
grant execute on function app.publish_paid_event(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Public wrapper — INVOKER, so the API surface carries no definer lint. Keeps
-- 0010's exact signature and OUT column names (create or replace cannot change
-- them, and PostgREST depends on the argument names).
-- ---------------------------------------------------------------------------
create or replace function public.publish_paid_event(event_id uuid, tz text default 'UTC')
returns table (id uuid, publish_fee_cents integer, duration_band text)
language sql
security invoker
set search_path = public, app
as $$
  select * from app.publish_paid_event(event_id, tz);
$$;

revoke all on function public.publish_paid_event(uuid, text) from public, anon;
grant execute on function public.publish_paid_event(uuid, text) to authenticated;

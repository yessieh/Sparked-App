-- ============================================================================
-- 0020 — REPAIR: make 0019's soft-delete / archive filters actually reach the
-- read paths that bypass RLS.
--
-- WHAT WENT WRONG. 0019 added `deleted_at` / `archived_at`, rewrote
-- `events_select_public`, and shipped the delete/archive/unarchive RPCs — all of
-- that is live and correct. But the six functions that also needed filters were
-- "fixed" by EDITING THE ALREADY-APPLIED MIGRATION FILES (0009, 0010, 0012,
-- 0015, 0017). A migration runs once; editing its file afterwards changes
-- nothing in the database. Those five files have been restored to their
-- as-applied contents, and the filters land here instead — in a forward
-- migration, which is the only thing that can change a deployed function.
--
-- Note `supabase migration list` compares VERSION NUMBERS, never file contents,
-- so it reported a clean 19/19 the whole time this drift existed. It cannot
-- detect this class of error. See CLAUDE.md.
--
-- WHY RLS WAS NOT ENOUGH. 0019's policy carries `deleted_at is null`
-- unconditionally, so the two SECURITY INVOKER functions (feed, detail) already
-- inherited delete-hiding. The other four are SECURITY DEFINER and bypass RLS
-- entirely — they had no backstop at all. The live symptoms this repairs:
--   * workspace_stats counted deleted AND archived events, so deleting a
--     listing removed it from the Workspace list while the Active/Upcoming
--     tiles kept counting it — the list and the tiles disagreed on sight.
--   * workspace_event_stats returned engagement chips for deleted events.
--   * event_publish_fee_cents priced a deleted event.
--   * publish_paid_event would PAY FOR AND PUBLISH a soft-deleted event. The
--     most serious of the four: soft delete was not a barrier to publication.
--   * events_within_radius showed a host their OWN archived event on Explore,
--     because the policy's member branch permits archived by design.
--
-- THIS IS AN ADDITIVE FILTER, NOT A REWRITE. Every function below keeps its
-- exact signature, OUT column names, language, volatility, security mode and
-- search_path pinning. The only change in each body is the added predicate.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- PART A — app.workspace_stats (0015). Exclude deleted AND archived.
--
-- ARCHIVED IS EXCLUDED FROM ALL FOUR, deliberately: "Active listings" means
-- live on the storefront, and an archived event is by definition off it. A host
-- who archives everything should read 0 active — that is information, not a
-- bug. The engagement totals drop archived too, so all four numbers describe
-- the same set of events rather than two different ones.
-- ---------------------------------------------------------------------------
create or replace function app.workspace_stats(p_workspace_id uuid)
returns table (
  active_listings integer,
  upcoming_events integer,
  total_rsvps integer,
  total_saves integer
)
language sql
stable
security definer
set search_path = public, app
as $$
  select
    (select count(*)::int from public.events e
       where e.workspace_id = p_workspace_id
         and e.deleted_at is null
         and e.archived_at is null
         and e.status = 'published'
         and coalesce(e.ends_at, e.starts_at) >= now())      as active_listings,
    (select count(*)::int from public.events e
       where e.workspace_id = p_workspace_id
         and e.deleted_at is null
         and e.archived_at is null
         and e.status = 'published'
         and e.starts_at > now())                            as upcoming_events,
    (select count(*)::int from public.rsvps r
       join public.events e on e.id = r.event_id
       where e.workspace_id = p_workspace_id
         and e.deleted_at is null
         and e.archived_at is null)                          as total_rsvps,
    (select count(*)::int from public.saves s
       join public.events e on e.id = s.event_id
       where e.workspace_id = p_workspace_id
         and e.deleted_at is null
         and e.archived_at is null)                          as total_saves
  where app.is_member(p_workspace_id, array['owner', 'editor', 'viewer']);
$$;

-- ---------------------------------------------------------------------------
-- PART B — app.workspace_event_stats (0017). Exclude deleted ONLY.
--
-- ARCHIVED ROWS KEEP THEIR CHIPS: the Workspace screen renders archived events
-- in their own "Archived · N" section, and a row with no RSVP/save numbers
-- would look broken. Archive takes an event off the storefront; it does not
-- erase what it earned while it was up.
-- ---------------------------------------------------------------------------
create or replace function app.workspace_event_stats(p_workspace_id uuid)
returns table (event_id uuid, rsvp_count integer, save_count integer)
language sql
stable
security definer
set search_path = public, app
as $$
  select
    e.id,
    e.rsvp_count,
    (select count(*)::int from public.saves s where s.event_id = e.id)
  from public.events e
  where e.workspace_id = p_workspace_id
    and e.deleted_at is null
    and e.status = 'published'
    and app.is_member(p_workspace_id, array['owner', 'editor', 'viewer']);
$$;

-- ---------------------------------------------------------------------------
-- PART C — app.event_publish_fee_cents (0012). Exclude deleted.
-- Returns null for a deleted event, which is the same "nothing to see" shape
-- this function already uses for non-members.
-- ---------------------------------------------------------------------------
create or replace function app.event_publish_fee_cents(p_event_id uuid)
returns integer
language sql
stable
security definer
set search_path = public, app
as $$
  select e.publish_fee_cents
  from public.events e
  where e.id = p_event_id
    and e.deleted_at is null
    and app.is_member(e.workspace_id, array['owner', 'editor', 'viewer']);
$$;

-- ---------------------------------------------------------------------------
-- PART D — app.publish_paid_event. Reject a deleted event.
--
-- TARGET CORRECTED: the brief named `public.publish_paid_event`, but 0014 moved
-- the real body into `app.publish_paid_event(p_event_id, p_tz)` and left
-- `public` as a thin INVOKER wrapper that only delegates. Patching the wrapper
-- would have done nothing. (The earlier edit to 0010 was doubly inert: never
-- applied, AND aimed at a body 0014 had already superseded.) The wrapper is
-- untouched here — its signature and argument names are load-bearing for
-- PostgREST and nothing about it needs to change.
--
-- Filtered in the initial fetch rather than added as a separate guard, so a
-- deleted event reports `event_not_found` — which is exactly what it is from
-- the app's point of view. No new error code for the checkout screen to learn.
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
  select * into ev from public.events e
   where e.id = p_event_id
     and e.deleted_at is null;
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

-- ---------------------------------------------------------------------------
-- PART E — public.events_within_radius (0009). Explicit deleted AND archived.
--
-- The archived filter is the one that MATTERS here and cannot be delegated to
-- RLS: `events_select_public` deliberately lets members see their own archived
-- events (so the Workspace list and its tap-through work), which means without
-- this line a host browsing Explore finds their own archived listing sitting in
-- the feed. The storefront has no members — archive is absolute here.
--
-- The deleted filter is belt-and-braces: the policy already enforces it for
-- every caller of this INVOKER function. It is stated anyway so the rule is
-- visible at the read site instead of only in a policy three files away.
-- ---------------------------------------------------------------------------
create or replace function public.events_within_radius(
  origin_lat double precision,
  origin_lng double precision,
  radius_miles double precision
)
returns table (
  id uuid,
  title text,
  organizer_name text,
  tier_id text,
  starts_at timestamptz,
  ends_at timestamptz,
  venue_name text,
  entry_fee_cents integer,
  rsvp_count integer,
  categories text[],
  distance_miles double precision
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  with origin as (
    select st_setsrid(st_makepoint(origin_lng, origin_lat), 4326)::geography as pt
  )
  select
    e.id,
    e.title,
    case when e.curbside_anonymous then null else w.name end as organizer_name,
    e.tier_id,
    e.starts_at,
    e.ends_at,
    e.venue_name,
    e.entry_fee_cents,
    e.rsvp_count,
    (
      select array_agg(ec.category_id order by c.sort_order)
      from public.event_categories ec
      join public.categories c on c.id = ec.category_id
      where ec.event_id = e.id
    ) as categories,
    st_distance(e.location, o.pt) / 1609.344 as distance_miles
  from public.events e
  join public.workspaces w on w.id = e.workspace_id
  cross join origin o
  where e.deleted_at is null
    and e.archived_at is null
    and e.status = 'published'
    and e.location is not null
    and st_dwithin(e.location, o.pt, radius_miles * 1609.344)
  order by st_distance(e.location, o.pt) asc; -- distance ONLY, no other factors
$$;

-- ---------------------------------------------------------------------------
-- PART F — public.event_detail (0009). Explicit deleted only.
--
-- AGREED, with the reasoning stated so it is not mistaken for load-bearing
-- code: RLS already covers this completely for every caller (INVOKER function,
-- and the policy's `deleted_at is null` is unconditional). The line is added
-- for explicitness — this function has NO status filter of its own and is the
-- read path most dependent on the policy, so a reader should not have to know
-- the policy by heart to know a deleted event can't be fetched here.
--
-- ARCHIVED IS DELIBERATELY *NOT* FILTERED HERE, and this is the one place the
-- two public read paths differ. Archived must stay openable by its owner: the
-- Workspace "Archived · N" rows tap through to this screen, and hiding it would
-- make them dead links. RLS draws exactly that line already — public callers
-- get nothing, members get their own. Adding `archived_at is null` here would
-- break the host's own tap-through, so it is omitted on purpose.
-- ---------------------------------------------------------------------------
create or replace function public.event_detail(
  event_id uuid,
  origin_lat double precision,
  origin_lng double precision
)
returns table (
  id uuid,
  title text,
  description text,
  organizer_name text,
  tier_id text,
  status text,
  starts_at timestamptz,
  ends_at timestamptz,
  venue_name text,
  address text,
  entry_fee_cents integer,
  rsvp_count integer,
  categories text[],
  distance_miles double precision,
  cancelled_at timestamptz
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    e.id,
    e.title,
    e.description,
    case when e.curbside_anonymous then null else w.name end as organizer_name,
    e.tier_id,
    e.status,
    e.starts_at,
    e.ends_at,
    e.venue_name,
    e.address,
    e.entry_fee_cents,
    e.rsvp_count,
    (
      select array_agg(ec.category_id order by c.sort_order)
      from public.event_categories ec
      join public.categories c on c.id = ec.category_id
      where ec.event_id = e.id
    ) as categories,
    case
      when e.location is null then null
      else st_distance(
        e.location,
        st_setsrid(st_makepoint(origin_lng, origin_lat), 4326)::geography
      ) / 1609.344
    end as distance_miles,
    e.cancelled_at
  from public.events e
  join public.workspaces w on w.id = e.workspace_id
  where e.deleted_at is null
    and e.id = event_detail.event_id;
$$;

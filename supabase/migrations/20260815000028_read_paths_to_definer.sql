-- ============================================================================
-- 0028 — Move the two public read paths onto the app-definer / public-invoker
-- convention. Migration 1 of 2 in the Curbside anonymity arc.
--
-- WHAT THIS CHANGES FOR A CLIENT: nothing. No user-visible behavior, and no
-- privilege gained or lost on any EXISTING object. Both public wrappers keep
-- their signatures, argument names, return types, volatility and ACLs. The two
-- new app functions are new objects; anon and authenticated get EXECUTE on
-- them, which grants no reachability the public wrappers did not already carry.
--
-- WHY IT EXISTS. 0029 revokes anon SELECT on events.workspace_id. Both of these
-- functions touch that column — event_detail returns it (masked), and
-- events_within_radius uses it in a JOIN predicate. A SECURITY INVOKER function
-- body is the CALLER's own query, and Postgres privilege-checks every column it
-- touches, including ones that appear only in a join or a WHERE clause. An RLS
-- POLICY expression is evaluated internally and needs no such privilege, which
-- is why the policy has referenced these columns for anon since 0019 without
-- incident.
--
-- That asymmetry is exactly the 0020 -> 0021 outage: 0020 added
-- `deleted_at is null` to two invoker bodies, 0019 had granted those columns to
-- authenticated only, and the signed-out storefront returned
-- `42501 permission denied for table events` on both the feed and event detail.
-- Once these bodies run as owner they stop privilege-checking the caller's
-- column grants, and 0029's revoke becomes survivable. This migration is that
-- preparation and nothing else.
--
-- ---------------------------------------------------------------------------
-- ONE DELIBERATE NON-VERBATIM LINE, IN PART C. SECURITY DEFINER bypasses RLS
-- (0020 PART D, 0023 PART A). events_within_radius does not care — its own
-- filters are strictly narrower than every policy branch that could admit its
-- rows, so definer and invoker return the identical set. event_detail DOES
-- care: its only filters are `deleted_at is null` and the id match, and
-- everything else that hides a row comes from `events_select_public`. Moved
-- verbatim, it would hand drafts, pending_payment rows and archived events to
-- any caller holding the id — an archived event's id being precisely the id in
-- every share link from while it was live. That is the opposite of this arc's
-- purpose. PART C therefore transcribes the policy's three branches into the
-- body, which is what the convention requires of a definer ("the filters below
-- ARE the visibility rule and have to be complete on their own", 0023). The
-- returned set is unchanged for every caller; the enforcement moved from the
-- policy into the body because the body no longer runs under the policy.
--
-- GRANT SURFACE. Two new EXECUTE grants, both on new objects, both named in
-- PART B and PART D below with the surface that consumes them. Nothing existing
-- gains or loses a privilege. No revoke here — that is 0029.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- PART A — app.events_within_radius: the definer body.
--
-- Body transcribed from 0020 PART E (lines 213-265), which is what the catalog
-- holds today. Two differences, both required and neither behavioral:
--   * search_path gains `app`, so the nested app.* calls this convention adds
--     later resolve, and KEEPS `extensions` — st_dwithin, st_distance,
--     st_setsrid and st_makepoint all live there since 0003, and dropping it
--     returns an empty feed with no obvious cause. Matches
--     app.publish_paid_event, the other definer that touches PostGIS.
--   * parameters take the `p_` prefix, matching every other app definer.
--
-- language sql / stable / the 11 OUT columns in order are reproduced exactly. A
-- changed return type would force a DROP, and on the wrapper that would reset
-- the ACL.
--
-- RLS EQUIVALENCE, since this body no longer runs under a policy: the filter
-- below is `deleted_at is null and archived_at is null and status='published'`.
-- Every row matching that also matches the storefront branch of
-- events_select_public (`deleted_at is null and archived_at is null and
-- status in ('published','cancelled')`), so RLS was never removing a row this
-- body kept. The workspaces join is `using(true)`, and the event_categories
-- subquery's policy carries the same branches keyed on the parent event, which
-- has already passed. Definer and invoker return the identical set.
-- ---------------------------------------------------------------------------
create or replace function app.events_within_radius(
  p_origin_lat double precision,
  p_origin_lng double precision,
  p_radius_miles double precision
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
security definer
set search_path = public, app, extensions
as $$
  with origin as (
    select st_setsrid(st_makepoint(p_origin_lng, p_origin_lat), 4326)::geography as pt
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
    and st_dwithin(e.location, o.pt, p_radius_miles * 1609.344)
  order by st_distance(e.location, o.pt) asc; -- distance ONLY, no other factors
$$;

-- GRANT: anon + authenticated EXECUTE on app.events_within_radius.
-- CONSUMED BY: public.events_within_radius, which is SECURITY INVOKER — its
-- body runs as the caller, so the caller needs EXECUTE here or the signed-out
-- Explore feed fails. Same shape and same reason as app.organizer_profile
-- (0023) and app.has_attendance (0022); unlike the member-scoped definers
-- (0012/0015/0017), anon is REQUIRED, not merely tolerated.
-- The revoke removes the PUBLIC EXECUTE Postgres mints implicitly on CREATE.
revoke all on function app.events_within_radius(double precision, double precision, double precision) from public;
grant execute on function app.events_within_radius(double precision, double precision, double precision) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- PART B — public.events_within_radius: the thin invoker wrapper.
--
-- CREATE OR REPLACE, not drop + create. The signature and all 11 OUT columns
-- are byte-identical to what exists, so replace is legal, and it PRESERVES the
-- ACL — which today is PUBLIC:EXECUTE, postgres:EXECUTE, anon:EXECUTE,
-- authenticated:EXECUTE (audit section 4, 2026-08-15 baseline). A drop would
-- reset it and anonymous browse would depend on the PUBLIC default. 0027
-- proved this preservation on the three 0019 wrappers.
--
-- No defensive re-grant is written here, deliberately, for 0027's reason: the
-- post-arc diff can only answer "was the ACL preserved?" if nothing in this
-- file would paper over a reset.
--
-- The argument names are load-bearing — PostgREST routes RPCs by argument NAME
-- and the client sends { origin_lat, origin_lng, radius_miles }.
--
-- search_path moves `public, extensions` -> `public, app`, matching
-- public.workspace_stats and public.organizer_profile. This body touches no
-- PostGIS and no table; it calls one schema-qualified function. This is the
-- only cell of this wrapper the post-arc audit diff should show.
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
set search_path = public, app
as $$
  select * from app.events_within_radius(origin_lat, origin_lng, radius_miles);
$$;

-- ---------------------------------------------------------------------------
-- PART C — app.event_detail: the definer body.
--
-- Body transcribed from 0023 PART C (lines 212-276), which is what the catalog
-- holds today: all 16 OUT columns in order, language sql, stable, both masks
-- intact — organizer_name nulled on curbside_anonymous, and workspace_id nulled
-- on curbside_anonymous, the two written to mirror each other line-for-line so
-- they cannot diverge. 0029 closes the remaining direct-table-read gap; nothing
-- about the masking changes here.
--
-- NO archived_at OR status FILTER, exactly as 0020 PART F ruled: a cancelled or
-- archived event stays reachable by direct link for the people entitled to it,
-- or the Workspace "Archived - N" rows become dead links. Only `deleted_at` is
-- filtered, and unconditionally — AD 8: a deleted-and-ended row stays in the
-- attendee's Past as an INERT record, so the policy admits the row while this
-- function still refuses to serve the ticket. That asymmetry is intentional and
-- is preserved below.
--
-- THE VISIBILITY PREDICATE IS THE ONE NON-VERBATIM ADDITION IN THIS FILE.
-- As INVOKER this body was filtered by events_select_public; as DEFINER it is
-- not, and its own filters are not the visibility rule. Without this clause,
-- drafts, pending_payment rows, and archived events would be returned to any
-- caller holding the id. The three branches below are transcribed from
-- events_select_public (0022 PART B) term for term:
--   1. the host and their team;
--   2. the storefront - live listings only;
--   3. the attendee's own history, after the event ended.
-- ANDed with the body's own `deleted_at is null`, this admits exactly the rows
-- the invoker version admitted, for exactly the same callers.
--
-- THE ENDED-TEST EXPRESSION NOW LIVES IN FOUR PLACES, and they must not drift:
--   1. events_select_public (0022, this file's branch 3, the source of truth);
--   2. app.organizer_profile (0023);
--   3. app.event_detail — THIS function, branch 3 below;
--   4. eventCountdown (lib/eventTime.ts, the client).
-- All four compute coalesce(ends_at, starts_at + interval '3 hours') < now().
-- A change to the grace window or the fallback column has to land in all four
-- at once, or a row will read ENDED in one and not another — which is exactly
-- the class of bug AD 8 and the Saved "Past" section were built to prevent.
--
-- app.is_member and app.has_attendance both read auth.uid(), which comes from
-- the request JWT and is unaffected by definer context, so they still identify
-- the real caller from inside this function.
-- ---------------------------------------------------------------------------
create or replace function app.event_detail(
  p_event_id uuid,
  p_origin_lat double precision,
  p_origin_lng double precision
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
  cancelled_at timestamptz,
  workspace_id uuid
)
language sql
stable
security definer
set search_path = public, app, extensions
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
        st_setsrid(st_makepoint(p_origin_lng, p_origin_lat), 4326)::geography
      ) / 1609.344
    end as distance_miles,
    e.cancelled_at,
    -- THE ANONYMITY GUARD. Suppressed at the data layer, not by the client:
    -- a masked organizer_name beside a usable workspace_id would be no mask at
    -- all. Deliberately mirrors the organizer_name expression one line-for-one
    -- so the two can never diverge.
    case when e.curbside_anonymous then null else e.workspace_id end as workspace_id
  from public.events e
  join public.workspaces w on w.id = e.workspace_id
  where e.deleted_at is null
    and e.id = p_event_id
    -- events_select_public, transcribed. See the header block above: this body
    -- no longer runs under the policy, so it carries the policy.
    and (
      -- 1. The host and their team.
      app.is_member(e.workspace_id, array['owner', 'editor', 'viewer'])
      -- 2. The storefront: live listings only.
      or (
        e.archived_at is null
        and e.status in ('published', 'cancelled')
      )
      -- 3. The attendee's own history, after it ended.
      or (
        e.status in ('published', 'cancelled')
        and coalesce(e.ends_at, e.starts_at + interval '3 hours') < now()
        and app.has_attendance(e.id)
      )
    );
$$;

-- GRANT: anon + authenticated EXECUTE on app.event_detail.
-- CONSUMED BY: public.event_detail, SECURITY INVOKER, so the caller executes
-- this one directly. anon is required — signed-out event detail and every
-- shared listing link land here. Same reasoning as PART A.
revoke all on function app.event_detail(uuid, double precision, double precision) from public;
grant execute on function app.event_detail(uuid, double precision, double precision) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- PART D — public.event_detail: the thin invoker wrapper.
--
-- CREATE OR REPLACE. All 16 OUT columns and the argument list are identical to
-- 0023's, so replace is legal and the ACL survives — 0023 granted anon and
-- authenticated explicitly after its drop+create, and both are live today
-- alongside PUBLIC and postgres. A drop here would reset that; nothing about
-- this migration requires one.
--
-- Argument names event_id / origin_lat / origin_lng are load-bearing for
-- PostgREST routing. The body touches no table, so the column-privilege
-- exposure that took the storefront down in 0021 has nowhere to land — which
-- is the entire point of this migration.
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
  cancelled_at timestamptz,
  workspace_id uuid
)
language sql
stable
security invoker
set search_path = public, app
as $$
  select * from app.event_detail(event_id, origin_lat, origin_lng);
$$;

notify pgrst, 'reload schema';

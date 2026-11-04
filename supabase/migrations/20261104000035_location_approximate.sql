-- ============================================================================
-- 0035 — events.location_approximate: the flag that says a pin is a TOWN, not
-- the address. Schema + Event Detail read path only. Its own arc.
--
-- WHAT THIS DOES — and nothing else:
--     alter table  public.events add column location_approximate
--     grant insert, update (location_approximate) on public.events to authenticated
--     drop + create app.event_detail     (17 OUT columns; was 16)
--     drop + create public.event_detail  (17 OUT columns; was 16)
--     notify pgrst
-- No policy, no other function, no other column, no other grant is touched.
-- `app.is_member` is NOT modified (see "PUBLIC:EXECUTE" below).
--
-- ---------------------------------------------------------------------------
-- INTENT.
--
-- When a host's address cannot be found by the geocoder, the create flows (a
-- later stage — not this arc) will let them pin the event to a nearby TOWN. The
-- stored point is then the town's centre, and every distance measured from it
-- is approximate. Attendees must be told: Event Detail will read
-- "N mi (approximate)" with an explanation. This column is that fact, stored
-- once, at the row. `not null default false`: every existing row, and every
-- insert that does not mention the column, is a real address — which is true of
-- every row in the database today.
--
-- ---------------------------------------------------------------------------
-- GRANTS — exactly what the write paths need. Evidence, against `0ef0867`:
--
-- `public.events` is COLUMN-GATED for client roles. The only TABLE-level grant
-- either client role holds on it is `authenticated DELETE` (baseline
-- 2026-09-23-post-interests-blocks.md, Section 1 line 111); every SELECT /
-- INSERT / UPDATE is a per-column grant (same file, lines 43-102, from 0011 and
-- its successors). A new column therefore inherits NOTHING: no table-level
-- grant exposes it, and DELETE is a row privilege with no column to expose.
-- 0011's header states the rule this follows — "every future column added to
-- `events` must add its own grant here" (0011:23).
--
-- The column travels with `location`, so its write paths are location's:
--   * Wizard draft INSERT — apps/mobile/src/app/create/event.tsx:1168-1172,
--     `insert({ workspace_id, ...editable })`, where `editable` carries
--     `location` (event.tsx:1157).                         -> INSERT
--   * Wizard re-entry UPDATE — event.tsx:1164, `update(editable)` on the same
--     draft when the host returns to checkout; `location` is re-written there,
--     so a re-pinned draft must be able to change the flag.  -> UPDATE
--   * Curbside INSERT — apps/mobile/src/app/create/curbside.tsx:299-312,
--     carries `location` (curbside.tsx:308).                 -> INSERT
-- No other client path writes `location`: grep of apps/mobile/src for
-- `toWktPoint(` returns exactly two call sites, event.tsx:1157 (the shared
-- `editable` payload behind both the wizard insert and update) and
-- curbside.tsx:308. Server-side, no publish function writes `location`. So:
--     authenticated: INSERT, UPDATE on the column. CONSUMERS: the three sites
--     above, wired in the create-flow stage that follows this arc.
--     anon: NOTHING. anon never writes events.
--     SELECT: NOBODY. The flag is read only through event_detail (definer,
--     below). No client select of `events` needs it, and a direct-read grant
--     would be one more surface to keep in step with a read path that already
--     carries the visibility rule. Add one deliberately if a later surface
--     (e.g. Workspace's own listing) needs it.
-- Until the create-flow stage ships, no client sends the column; inserts and
-- updates that omit it need no privilege on it and get the default.
--
-- ---------------------------------------------------------------------------
-- EVENT DETAIL — DROP + CREATE, because adding an OUT column changes the return
-- type and CREATE OR REPLACE cannot do that.
--
-- Bodies are VERBATIM from their latest definitions apart from the one new
-- column:
--   * app.event_detail    — 0030 PART E (curbside_history_does_not_survive),
--                            the current body: the three transcribed
--                            events_select_public branches with the
--                            curbside_expired guard on branches 2 and 3.
--   * public.event_detail — 0028 PART D, the thin invoker wrapper.
-- `location_approximate` is appended LAST in both OUT lists so every existing
-- column keeps its position. Language, volatility, security mode, search_path
-- and argument names are unchanged. The visibility branches are unchanged
-- character for character — this arc adds a column to the SELECT list and
-- nothing to the WHERE clause.
--
-- PRE-APPLY CHECK (the STOP condition): before applying, the live bodies must
-- equal those definitions. For a `language sql` function `prosrc` is the text
-- between the dollar quotes, so:
--     app.event_detail    md5(prosrc) = 4459d9ae8c405f9e7c311b02d636a53c (2200 chars)
--     public.event_detail md5(prosrc) = 7c4969aebd532a9ac291452adc95dc0f (69 chars)
-- (computed from 0030 PART E / 0028 PART D as committed at `0924890`, LF line
-- endings). A mismatch means the repo does not describe the live function —
-- stop; do not apply this file over it.
--
-- Order: drop the wrapper first (it calls the definer), create the definer
-- first (the wrapper's body is validated against it).
--
-- ---------------------------------------------------------------------------
-- PUBLIC:EXECUTE — closes the event_detail half of the tracker item
-- "PRE-LAUNCH AUDIT: two functions still carry PUBLIC:EXECUTE".
--
-- 0023 dropped and recreated public.event_detail and re-minted PUBLIC EXECUTE
-- without a revoke; 0028's CREATE OR REPLACE preserved it; the 2026-09-23
-- baseline still shows `PUBLIC:EXECUTE, postgres:EXECUTE, anon:EXECUTE,
-- authenticated:EXECUTE` (Section 4, line 204). This drop resets both ACLs, so
-- each function gets `revoke all ... from public` and an explicit EXECUTE to
-- anon + authenticated — the house practice since 0025. End state for BOTH:
-- no PUBLIC; anon + authenticated EXECUTE (plus the owner, postgres).
-- anon is load-bearing: signed-out Event Detail and every shared listing link
-- call public.event_detail, and the invoker wrapper's caller executes the
-- definer directly. `app.is_member` keeps its PUBLIC:EXECUTE — the other half of
-- that tracker item, left for its own decision.
--
-- ---------------------------------------------------------------------------
-- EXPECTED POST-ARC DELTA (against a pre-arc baseline taken with the current
-- supabase/audits/privilege_audit.sql):
--   1. TABLE- AND COLUMN-LEVEL GRANTS — +2 rows, both
--      `public | events | column | location_approximate | authenticated |`
--      INSERT and UPDATE. 1A: 118 -> 120 (if the pre-arc 1A is 118).
--   2. RLS — no change (no policy added or removed on any table).
--   3. VIEWS AND MATVIEWS — no change (0 rows).
--   4. FUNCTIONS — row count unchanged; app.event_detail's grants unchanged in
--      content; public.event_detail loses `PUBLIC:EXECUTE` and reads
--      `postgres:EXECUTE, anon:EXECUTE, authenticated:EXECUTE`. Security mode,
--      owner, config and args unchanged for both (the return type is not a
--      column of this section).
--   5. DEFAULT PRIVILEGES — no change (5A unchanged).
--   6. ROLE INHERITANCE — no change.
--   7. SCHEMA-LEVEL PRIVILEGES — no change.
--   8. RLS POLICY DUMP — no change (no policy text or hash moves).
-- Any other row that moves is unexplained and blocks the commit.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- PART A — the column.
-- ---------------------------------------------------------------------------
alter table public.events
  add column location_approximate boolean not null default false;

comment on column public.events.location_approximate is
  'True when location is a TOWN centre the host picked because the address could not be geocoded; distances from it are approximate. 0035.';


-- ---------------------------------------------------------------------------
-- PART B — the grant. See the header: INSERT + UPDATE to authenticated only.
-- GRANT: authenticated INSERT (location_approximate) on public.events.
-- CONSUMED BY: the wizard draft insert (create/event.tsx:1168) and the Curbside
-- insert (create/curbside.tsx:299), in the create-flow stage.
-- GRANT: authenticated UPDATE (location_approximate) on public.events.
-- CONSUMED BY: the wizard's checkout re-entry update (create/event.tsx:1164).
-- ---------------------------------------------------------------------------
grant insert (location_approximate) on public.events to authenticated;
grant update (location_approximate) on public.events to authenticated;


-- ---------------------------------------------------------------------------
-- PART C — drop both event_detail functions. Wrapper first: it calls the
-- definer.
-- ---------------------------------------------------------------------------
drop function public.event_detail(uuid, double precision, double precision);
drop function app.event_detail(uuid, double precision, double precision);


-- ---------------------------------------------------------------------------
-- PART D — app.event_detail: the definer body.
--
-- Transcribed from 0030 PART E. The ONLY change: `location_approximate boolean`
-- appended to the OUT list and `e.location_approximate` appended to the SELECT
-- list. Everything else — both anonymity masks, the deleted_at filter, the
-- three transcribed events_select_public branches and the curbside_expired
-- guard on branches 2 and 3 — is unchanged. The ended-test expression
-- (coalesce(ends_at, starts_at + interval '3 hours') < now()) still lives in
-- the four places 0028's header lists, and still must move together.
-- ---------------------------------------------------------------------------
create function app.event_detail(
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
  workspace_id uuid,
  location_approximate boolean
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
    case when e.curbside_anonymous then null else e.workspace_id end as workspace_id,
    e.location_approximate
  from public.events e
  join public.workspaces w on w.id = e.workspace_id
  where e.deleted_at is null
    and e.id = p_event_id
    -- events_select_public, transcribed. See the header block above: this body
    -- no longer runs under the policy, so it carries the policy.
    and (
      -- 1. The host and their team. UNTOUCHED — a host opening their own ended
      --    Curbside listing from Workspace still resolves.
      app.is_member(e.workspace_id, array['owner', 'editor', 'viewer'])
      -- 2. The storefront: live listings only.
      or (
        e.archived_at is null
        and e.status in ('published', 'cancelled')
        and not app.curbside_expired(e.tier_id, e.starts_at, e.ends_at)
      )
      -- 3. The attendee's own history, after it ended. Same deliberate
      --    redundancy as PART B branch 3: only the tier half does work here.
      or (
        e.status in ('published', 'cancelled')
        and coalesce(e.ends_at, e.starts_at + interval '3 hours') < now()
        and not app.curbside_expired(e.tier_id, e.starts_at, e.ends_at)
        and app.has_attendance(e.id)
      )
    );
$$;

-- GRANT: anon + authenticated EXECUTE on app.event_detail; PUBLIC revoked.
-- CONSUMED BY: public.event_detail, SECURITY INVOKER, so the caller executes
-- this one directly. anon is required — signed-out Event Detail and every
-- shared listing link land here.
revoke all on function app.event_detail(uuid, double precision, double precision) from public;
grant execute on function app.event_detail(uuid, double precision, double precision) to anon, authenticated;


-- ---------------------------------------------------------------------------
-- PART E — public.event_detail: the thin invoker wrapper.
--
-- Transcribed from 0028 PART D; the only change is the appended OUT column.
-- Argument names event_id / origin_lat / origin_lng are load-bearing for
-- PostgREST routing.
-- ---------------------------------------------------------------------------
create function public.event_detail(
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
  workspace_id uuid,
  location_approximate boolean
)
language sql
stable
security invoker
set search_path = public, app
as $$
  select * from app.event_detail(event_id, origin_lat, origin_lng);
$$;

-- GRANT: anon + authenticated EXECUTE on public.event_detail; PUBLIC revoked
-- (it carried PUBLIC:EXECUTE since 0023 — see the header).
-- CONSUMED BY: (tabs)/event/[id].tsx, signed in and signed out.
revoke all on function public.event_detail(uuid, double precision, double precision) from public;
grant execute on function public.event_detail(uuid, double precision, double precision) to anon, authenticated;


notify pgrst, 'reload schema';

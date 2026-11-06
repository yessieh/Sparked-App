-- ============================================================================
-- 0036 — "(approx.)" on cards: the three attendee card read paths return
-- events.location_approximate (0035). Its own arc. PART 1 of the arc is this
-- file; the card UI is a later stage.
--
-- WHAT THIS DOES — and nothing else:
--     drop + create  app.events_within_radius    (5 args; 12 OUT columns, was 11)
--     drop + create  public.events_within_radius (5 args; 12 OUT columns, was 11)
--     create or replace app.organizer_profile    (OUT columns unchanged)
--     grant select (location_approximate) on public.events to authenticated
--     notify pgrst
-- No policy, no table, no other function, no other grant is touched.
-- public.organizer_profile is NOT replaced (its body is `select *` over the
-- definer, and its return type does not change).
--
-- ---------------------------------------------------------------------------
-- INTENT.
--
-- A town-pinned event (location_approximate = true) shows an exact-looking
-- distance on every card ("0.0 mi"). Cards will read "0.0 mi (approx.)" in the
-- same muted style — a later, SQL-free stage. This arc gets the flag to the
-- three paths cards are drawn from:
--   1. Explore feed + search  — public.events_within_radius (5 args), called
--      by (tabs)/(explore)/index.tsx:536 and components/ExploreSearch.tsx:554.
--   2. Organizer profile      — public.organizer_profile → app.organizer_profile,
--      called by organizer/[id].tsx:402; events arrive inside `upcoming` /
--      `past` jsonb arrays.
--   3. Saved                  — a DIRECT read of public.events
--      ((tabs)/(saved)/saved.tsx:185), so it needs a column grant.
--
-- ---------------------------------------------------------------------------
-- 1. THE FEED PAIR — DROP + CREATE.
--
-- Adding an OUT column changes the return type, which CREATE OR REPLACE cannot
-- do. Bodies are VERBATIM from 0031 PART A (definer) and PART B (wrapper) —
-- still the live definitions: 0032 dropped only the 3-argument pair, and no
-- later migration names the 5-argument one — apart from one appended column,
-- `location_approximate boolean`, LAST in both OUT lists so every existing
-- column keeps its position. The WHERE clause (deleted / archived / published /
-- has a location / 0030's Curbside guard / 0031's interval overlap / radius) and
-- the ORDER BY (distance only) are unchanged character for character.
--
-- CLIENT SAFETY, CHECKED 2026-11-06: both callers read rows BY NAME — PostgREST
-- returns JSON objects, and index.tsx:590-602 spreads `...r` then maps
-- `tier_id`; ExploreSearch.tsx:580-590 does the same and filters on
-- `r.distance_miles`. An extra key is inert to both.
--
-- Order: drop the wrapper first (its body calls the definer); create the
-- definer first (`check_function_bodies` parses the wrapper against it).
--
-- ACL: a drop resets it and CREATE mints EXECUTE to PUBLIC, so BOTH get
-- `revoke all … from public` and an explicit EXECUTE to anon + authenticated —
-- the end state they hold today (baseline 2026-11-04-post-location-approximate,
-- Section 4, lines 160 and 183: postgres / anon / authenticated, no PUBLIC).
-- anon is load-bearing: Explore browses signed out. 0031's header warns why
-- this is asserted rather than assumed: a reset ACL keeps the signed-out feed
-- working through PUBLIC, indistinguishably, until a later hardening breaks it.
--
-- ---------------------------------------------------------------------------
-- 2. app.organizer_profile — CREATE OR REPLACE, ACL PRESERVED.
--
-- NOT a return-type change. The 9 OUT columns stay exactly as they are; the
-- event objects inside `upcoming` / `past` are built by `to_jsonb(v)` over the
-- `visible` CTE (0030 PART F), so adding `e.location_approximate` to the CTE's
-- select list adds a "location_approximate" KEY to every object and changes no
-- column type. A legal replace, so the ACL survives untouched (Section 4
-- line 166: postgres / anon / authenticated, no PUBLIC). Body verbatim from
-- 0030 PART F apart from that one CTE line. The public wrapper is not touched.
--
-- ---------------------------------------------------------------------------
-- 3. SAVED — ONE COLUMN GRANT.
--
-- GRANT: authenticated SELECT (location_approximate) on public.events.
-- CONSUMED BY: Saved's direct read, (tabs)/(saved)/saved.tsx:185-194 — an
-- explicit select list, signed in only (the tab invites sign-up when signed
-- out). The client adds the column to that list in the UI stage; until then
-- nothing reads it.
-- anon: NOTHING. Saved is signed-in only, and every anon card path goes through
-- the two definer RPCs above, which read the column as postgres.
-- Workspace (the host's listing) does NOT need it and is not the reason for
-- this grant; it gets nothing of its own.
-- `events` carries no table-level SELECT for any client role (baseline
-- 2026-11-04-post, Section 1: the only table-level client grant on events is
-- `authenticated DELETE`), so this column grant is the whole of the new read.
-- Row visibility is unchanged — events_select_public still decides WHICH rows;
-- this only adds a column to rows the caller could already read.
--
-- ---------------------------------------------------------------------------
-- PRE-APPLY CHECK (the STOP condition). For `language sql`, prosrc is the text
-- between the dollar quotes. The live bodies must hash to the committed
-- definitions (computed from the files at `790fa6b`, LF line endings):
--     app.events_within_radius    (5 args) 9831f5266a3375f1969a8b805b1ca4f6 (1519 chars)
--     public.events_within_radius (5 args) ad585dad44115e5305dc139a2c5ba90b (113 chars)
--     app.organizer_profile                694d8257729b7615d238050d94139ec5 (2233 chars)
-- and none may carry PUBLIC EXECUTE. A mismatch means the repo does not
-- describe the live function — stop; do not apply this file over it.
--
-- ---------------------------------------------------------------------------
-- EXPECTED POST-ARC DELTA (against a pre-arc baseline taken with the current
-- supabase/audits/privilege_audit.sql):
--   1. TABLE- AND COLUMN-LEVEL GRANTS — +1 row:
--      `public | events | column | location_approximate | authenticated | SELECT`.
--      1A: 120 → 121 (if the pre-arc 1A is 120).
--   2. RLS — no change.
--   3. VIEWS AND MATVIEWS — no change (0 rows).
--   4. FUNCTIONS — row count unchanged (41). All four rows touched read the
--      same: security mode, owner, config, args and execute_grants
--      (`postgres:EXECUTE, anon:EXECUTE, authenticated:EXECUTE`) identical for
--      both events_within_radius rows (the return type is not a column of this
--      section) and for app.organizer_profile.
--   5. DEFAULT PRIVILEGES — no change (5A 268).
--   6. ROLE INHERITANCE — no change.
--   7. SCHEMA-LEVEL PRIVILEGES — no change.
--   8. RLS POLICY DUMP — no change.
-- Any other row that moves — including any new grantee on any of the three
-- functions — is unexplained and blocks the commit.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- PART A — drop the 5-argument feed pair. Wrapper first: it calls the definer.
-- ---------------------------------------------------------------------------
drop function public.events_within_radius(
  double precision, double precision, double precision, timestamptz, timestamptz
);
drop function app.events_within_radius(
  double precision, double precision, double precision, timestamptz, timestamptz
);


-- ---------------------------------------------------------------------------
-- PART B — app.events_within_radius, 5 arguments: the real body.
--
-- Transcribed from 0031 PART A. The ONLY change: `location_approximate boolean`
-- appended to the OUT list and `e.location_approximate` appended to the SELECT
-- list.
-- ---------------------------------------------------------------------------
create function app.events_within_radius(
  p_origin_lat double precision,
  p_origin_lng double precision,
  p_radius_miles double precision,
  p_from timestamptz,
  p_to timestamptz
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
  distance_miles double precision,
  location_approximate boolean
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
    st_distance(e.location, o.pt) / 1609.344 as distance_miles,
    e.location_approximate
  from public.events e
  join public.workspaces w on w.id = e.workspace_id
  cross join origin o
  where e.deleted_at is null
    and e.archived_at is null
    and e.status = 'published'
    and e.location is not null
    -- 0030: an ended Curbside post leaves the feed and the widened search read.
    and not app.curbside_expired(e.tier_id, e.starts_at, e.ends_at)
    -- 0031: INTERVAL OVERLAP. An event is in the window when it has not ended
    -- before the window opens and has not started after the window closes.
    -- NOT `starts_at >= p_from` — that drops a multi-day event still running,
    -- which is the one row a live feed most wants. See the header.
    and coalesce(e.ends_at, e.starts_at + interval '3 hours') >= p_from
    and e.starts_at <= p_to
    and st_dwithin(e.location, o.pt, p_radius_miles * 1609.344)
  order by st_distance(e.location, o.pt) asc; -- distance ONLY, no other factors
$$;

-- GRANT: anon + authenticated EXECUTE on the 5-argument app definer; PUBLIC
-- revoked. CONSUMED BY: public.events_within_radius (PART C), SECURITY INVOKER,
-- so the caller executes this one directly — anon for the signed-out feed.
revoke all on function app.events_within_radius(
  double precision, double precision, double precision, timestamptz, timestamptz
) from public;
grant execute on function app.events_within_radius(
  double precision, double precision, double precision, timestamptz, timestamptz
) to anon, authenticated;


-- ---------------------------------------------------------------------------
-- PART C — public.events_within_radius, 5 arguments: the thin invoker wrapper.
--
-- Transcribed from 0031 PART B; the only change is the appended OUT column.
-- Argument names are load-bearing — PostgREST routes RPCs by NAME.
-- ---------------------------------------------------------------------------
create function public.events_within_radius(
  origin_lat double precision,
  origin_lng double precision,
  radius_miles double precision,
  window_from timestamptz,
  window_to timestamptz
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
  distance_miles double precision,
  location_approximate boolean
)
language sql
stable
security invoker
set search_path = public, app
as $$
  select * from app.events_within_radius(
    origin_lat, origin_lng, radius_miles, window_from, window_to
  );
$$;

-- GRANT: anon + authenticated EXECUTE on the 5-argument wrapper; PUBLIC revoked.
-- CONSUMED BY: (tabs)/(explore)/index.tsx:536 and ExploreSearch.tsx:554. anon
-- is REQUIRED — Explore browses signed out.
revoke all on function public.events_within_radius(
  double precision, double precision, double precision, timestamptz, timestamptz
) from public;
grant execute on function public.events_within_radius(
  double precision, double precision, double precision, timestamptz, timestamptz
) to anon, authenticated;


-- ---------------------------------------------------------------------------
-- PART D — app.organizer_profile: CREATE OR REPLACE, ACL preserved.
--
-- Body transcribed from 0030 PART F. The ONLY change: `e.location_approximate`
-- added to the `visible` CTE, which `to_jsonb(v)` turns into a key on every
-- event object in `upcoming` and `past`. The 9 OUT columns, the argument,
-- language, volatility, security mode and search_path are unchanged, so this is
-- a legal replace and no grant is reissued.
-- ---------------------------------------------------------------------------
create or replace function app.organizer_profile(p_workspace_id uuid)
returns table (
  id uuid,
  name text,
  bio text,
  location_text text,
  website text,
  socials jsonb,
  logo_path text,
  upcoming jsonb,
  past jsonb
)
language sql
stable
security definer
set search_path = public, app
as $$
  with visible as (
    select
      e.id,
      e.title,
      e.tier_id,
      e.starts_at,
      e.ends_at,
      e.venue_name,
      e.entry_fee_cents,
      e.rsvp_count,
      (
        select coalesce(array_agg(ec.category_id order by c.sort_order), array[]::text[])
        from public.event_categories ec
        join public.categories c on c.id = ec.category_id
        where ec.event_id = e.id
      ) as categories,
      e.location_approximate,
      coalesce(e.ends_at, e.starts_at + interval '3 hours') < now() as ended
    from public.events e
    where e.workspace_id = p_workspace_id
      -- The explicit lifecycle filter. See the header: NOT inherited from RLS.
      and e.deleted_at is null
      and e.archived_at is null
      and e.status = 'published'
      -- 0009 mask, second direction: an anonymous post must not be findable by
      -- opening the profile of the person who posted it.
      and not e.curbside_anonymous
      -- 0030: and an ENDED Curbside post is not findable here at all, whether
      -- or not it was anonymous. A different test from the line above it.
      and not app.curbside_expired(e.tier_id, e.starts_at, e.ends_at)
  )
  select
    w.id,
    w.name,
    w.bio,
    w.location_text,
    w.website,
    w.socials,
    w.logo_path,
    -- UNCAPPED on purpose: you cannot have many events still ahead of you, and
    -- truncating the future would hide the one thing a visitor came to find.
    coalesce((
      select jsonb_agg(to_jsonb(v) - 'ended' order by v.starts_at asc)
      from visible v
      where not v.ended
    ), '[]'::jsonb) as upcoming,
    -- CAPPED at 50, most-recent-first: this is an anon-callable endpoint and an
    -- unbounded array on one is a payload nobody is holding the other end of.
    -- 50 is far above any realistic MVP organizer and the section is collapsed
    -- by default anyway; real pagination can arrive if the number ever does.
    coalesce((
      select jsonb_agg(t.row order by t.starts_at desc)
      from (
        select to_jsonb(v) - 'ended' as row, v.starts_at
        from visible v
        where v.ended
        order by v.starts_at desc
        limit 50
      ) t
    ), '[]'::jsonb) as past
  from public.workspaces w
  where w.id = p_workspace_id;
$$;


-- ---------------------------------------------------------------------------
-- PART E — the Saved column grant. See header section 3.
-- GRANT: authenticated SELECT (location_approximate) on public.events.
-- CONSUMED BY: (tabs)/(saved)/saved.tsx:185-194 (direct read, signed in).
-- ---------------------------------------------------------------------------
grant select (location_approximate) on public.events to authenticated;


notify pgrst, 'reload schema';

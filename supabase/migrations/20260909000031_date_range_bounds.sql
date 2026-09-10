-- ============================================================================
-- 0031 — Date range bounds on the Explore feed. Arc C PART 1.
--
-- PART NUMBER, SINCE 0030'S HEADER SAYS OTHERWISE AND CANNOT BE FIXED: the date
-- bounds are PART 1 and Curbside history (0030) is PART 2. Part 2 was BUILT
-- FIRST, by ruling — predicate-only work across five objects is lower risk than
-- a signature change, so the risky half happens last, carrying an
-- already-correct predicate. 0030 lines 87 and 233 label this migration "Arc C
-- Part 2"; that is wrong, and it is applied, so CLAUDE.md's immutability rule
-- forbids the correction there. This line is the current statement. 0030's line
-- 2, "Migration 1 of 2 in Arc C", is accurate — that is landing order.
--
-- WHAT THIS ADDS: two bounds on the feed, so Explore can answer "what is on
-- between these two instants" instead of only "what is on at all".
--
-- ---------------------------------------------------------------------------
-- THE PREDICATE IS AN INTERVAL OVERLAP, NOT A START COMPARISON. THIS IS THE
-- SINGLE MOST LIKELY WAY TO GET THIS WRONG.
--
--     coalesce(ends_at, starts_at + interval '3 hours') >= p_from
--     and starts_at <= p_to
--
-- The obvious form — `starts_at >= p_from` — silently drops a multi-day
-- festival that began yesterday and is STILL RUNNING. (tabs)/index.tsx states
-- the rule it would break, in a comment, in as many words: "An event in
-- PROGRESS stays — eventCountdown reads that as LIVE, never ENDED, and a live
-- event is the most useful thing a discovery feed can show." An event overlaps
-- the window when it has not yet ended by the window's start and has not yet
-- started by the window's end. Both halves are `>=` / `<=` on purpose: an event
-- ending exactly at p_from, or starting exactly at p_to, is inside.
--
-- THE END INSTANT IS THE SAME EXPRESSION AS EVERYWHERE ELSE —
-- `coalesce(ends_at, starts_at + interval '3 hours')`, the 3-hour grace for a
-- missing end time. It is INLINED here, which makes this its SIXTH occurrence
-- in SQL, and that is over the line.
--
-- WHY IT IS INLINED ANYWAY: the right fix is
-- `app.event_end_instant(starts_at, ends_at) returns timestamptz`, with this
-- bound AND `app.curbside_expired` both calling it — one definition of the
-- grace instead of six. That requires REPLACING curbside_expired, which this
-- arc's scope fence forbids. Tracked as its own item, and it should land
-- BEFORE a seventh occurrence rather than after.
--
-- `app.curbside_expired` CANNOT carry this bound, checked rather than assumed:
-- it returns `tier = 'curbside' AND end_instant < now()`. This needs
-- `end_instant >= p_from` — compared against a PARAMETER, not now(), and with
-- no tier test. What the two share is the end-instant expression, not the
-- predicate, which is exactly why the extraction above is the shape that works.
--
-- ---------------------------------------------------------------------------
-- timestamptz, NOT date — AND THE BUG THAT CHOICE AVOIDS.
--
-- A `date` argument resolves to midnight IN THE SESSION TIMEZONE, which for
-- PostgREST is UTC. A user in Arizona asking for "today" would get a window
-- running 5pm yesterday to 5pm today: it would miss the last seven hours of
-- their actual day, which on a discovery feed is the evening — the hours the
-- product exists for. Silently, with no error and a plausible-looking result.
--
-- Converting a local calendar date to an instant requires knowing the local
-- timezone, and the only place that knows it is the client. So these arguments
-- are instants and the client does the conversion.
--
-- ---------------------------------------------------------------------------
-- NO 3-ARGUMENT FUNCTION IS DROPPED, AND THAT IS A CHANGE OF PLAN THIS HEADER
-- OWES AN EXPLANATION FOR.
--
-- The arc was specified as a drop-and-recreate: adding two arguments is a new
-- function identity, CREATE OR REPLACE cannot do it, so DROP + CREATE with an
-- explicit re-grant — 0023's precedent. The recon had already established the
-- wrapper's ACL as this arc's headline risk, and the plan was built around
-- getting the re-grant right.
--
-- **NEITHER THE BRIEF NOR THE RECON COUNTED THE CALL SITES.** There are TWO,
-- and both send exactly three arguments:
--     (tabs)/index.tsx:230           the feed's load
--     components/ExploreSearch.tsx:403  the widened overflow read
-- The client change is deliberately sequenced AFTER this migration verifies
-- green. So a drop would have left both call sites resolving to nothing —
-- PostgREST finds no events_within_radius taking those three names — and the
-- signed-out feed AND search would have been down for the whole gap between two
-- commits. **That is the 0020 -> 0021 shape**: a migration that reads correct,
-- passes its own review, and takes the storefront down for anon.
--
-- What caught it was COUNTING THE CALL SITES, not reasoning about the change.
-- Recording that because the reasoning was careful and still missed it.
--
-- SO: the 5-argument pair is CREATED ALONGSIDE, and the 3-argument pair stays
-- until the client no longer calls it. A later migration drops it, deliberately,
-- once nothing points at it.
--
-- THE SECOND BENEFIT, WHICH IS THE LARGER ONE: not dropping the 3-argument
-- function means NOT RESETTING ITS ACL. This arc's headline risk stops being
-- "re-grant a reset ACL correctly" and becomes "grant a brand-new object
-- correctly", which is the smaller and far better-rehearsed problem.
--
-- NO AMBIGUITY (42725) FROM THE COEXISTENCE: neither 5-arg function carries a
-- DEFAULT, so a 3-name call can only match the 3-arg function and a 5-name call
-- can only match the 5-arg one. PostgREST routes on the exact set of argument
-- names in the body.
--
-- NO DEFAULTS, DELIBERATELY — 0018's precedent, which dropped the 1-argument
-- `curbside_posts_used` and called it load-bearing: "a stale client still
-- sending { ws } gets 'function not found' instead of a confidently wrong 0."
-- A default here would let a client that forgets a bound silently receive an
-- unbounded feed, and once (tabs)/index.tsx's hasEnded filter comes out that
-- unbounded feed INCLUDES ENDED EVENTS.
--
-- ---------------------------------------------------------------------------
-- GRANT SURFACE — TWO NEW OBJECTS, FOUR GRANTS, AND ONE WARNING.
--
--   * app.events_within_radius(double precision x3, timestamptz, timestamptz)
--     revoke all from public; grant execute to anon, authenticated.
--     CONSUMED BY: public.events_within_radius(5 args), which is INVOKER — its
--     body runs as the caller, so the caller needs EXECUTE here or the
--     signed-out feed fails. anon is REQUIRED, not tolerated.
--   * public.events_within_radius(double precision x3, timestamptz, timestamptz)
--     revoke all from public; grant execute to anon, authenticated.
--     CONSUMED BY: the client, once it sends the new arguments.
--
-- Both revokes exist because CREATE FUNCTION mints EXECUTE to PUBLIC
-- implicitly. Naming them is the standing grant check; issuing them is the fix.
--
-- ⚠️ A RESET ACL LOOKS LIKE IT WORKS, AND THAT IS WHY THE POST-ARC DIFF MUST
-- ASSERT THE ACL RATHER THAN OBSERVE THAT THE FEED STILL LOADS. A newly created
-- function gets EXECUTE to PUBLIC by default, and **PUBLIC includes anon** — so
-- a signed-out feed keeps working on the wrong basis, indistinguishably from a
-- correct one. It breaks later and silently, the first time anyone runs the
-- revoke-from-public hardening that 0025 and 0026 established as house
-- practice. 0028's own header says the same of this exact function: "A drop
-- would reset it and anonymous browse would depend on the PUBLIC default."
--
-- NOTHING ELSE CHANGES. The 3-argument pair keeps its existing ACL untouched
-- (PART E is CREATE OR REPLACE on an identical signature, which preserves it),
-- no policy is touched, no table is touched, and 0030's Curbside guard is
-- carried into the new body unchanged.
--
-- ENDS WITH `notify pgrst, 'reload schema'`, and here it is LOAD-BEARING rather
-- than hygiene: PostgREST must learn the new signature before the client can
-- call it, and once the client's own ENDED filter is removed a stale cache
-- SHOWS ENDED EVENTS rather than hiding them. 0030 needed no notify because it
-- changed no signature; this one does.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- PART A — app.events_within_radius, 5 arguments: the real body.
--
-- Transcribed from 0030 PART D with the two bounds added and NOTHING else
-- changed. Same 11 OUT columns, same volatility, same security mode, same
-- search_path — `extensions` included, because st_dwithin / st_distance /
-- st_setsrid / st_makepoint all live there since 0003 and dropping it returns
-- an empty feed with no obvious cause.
--
-- `p_` prefix on every argument, matching every other app definer.
-- ---------------------------------------------------------------------------
create or replace function app.events_within_radius(
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

-- GRANT: anon + authenticated EXECUTE on the 5-argument app definer.
-- CONSUMED BY: public.events_within_radius(5 args) in PART C, which is INVOKER
-- — its body runs as the caller, so the caller needs EXECUTE here or the
-- signed-out feed fails. Same shape and same reason as 0028 PART A.
-- The revoke removes the PUBLIC EXECUTE Postgres mints implicitly on CREATE.
revoke all on function app.events_within_radius(
  double precision, double precision, double precision, timestamptz, timestamptz
) from public;
grant execute on function app.events_within_radius(
  double precision, double precision, double precision, timestamptz, timestamptz
) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- PART B — public.events_within_radius, 5 arguments: the thin invoker wrapper.
--
-- CREATED AFTER PART A, and the order is load-bearing: `check_function_bodies`
-- is on by default, so this body is parsed at creation and the 5-argument app
-- function must already exist or this statement fails.
--
-- ARGUMENT NAMES ARE LOAD-BEARING — PostgREST routes RPCs by NAME. The three
-- existing names are unchanged so nothing about the current call is disturbed.
-- The two new ones are `window_from` / `window_to`, deliberately NOT
-- `starts_from` / `starts_to`: those would imply a filter on starts_at, which
-- is precisely the misreading that produces the broken predicate. Verified
-- 2026-09-09 that no client sends either name — both call sites send only
-- origin_lat, origin_lng, radius_miles.
--
-- search_path is `public, app`: this body touches no PostGIS and no table, it
-- calls one schema-qualified function. Matches the 3-argument wrapper.
-- ---------------------------------------------------------------------------
create or replace function public.events_within_radius(
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
  distance_miles double precision
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

-- GRANT: anon + authenticated EXECUTE on the 5-argument public wrapper.
-- CONSUMED BY: the client, once (tabs)/index.tsx and components/ExploreSearch
-- send the new arguments. anon is REQUIRED — Explore browses signed out.
revoke all on function public.events_within_radius(
  double precision, double precision, double precision, timestamptz, timestamptz
) from public;
grant execute on function public.events_within_radius(
  double precision, double precision, double precision, timestamptz, timestamptz
) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- PART C — the 3-argument app definer becomes a DELEGATION.
--
-- CREATE OR REPLACE on a BYTE-IDENTICAL SIGNATURE and return type, so this is a
-- legal replace and **the ACL is preserved** — no drop, no reset, no re-grant.
-- That preservation is the whole reason this arc no longer carries the risk it
-- was scoped around.
--
-- WHY DELEGATE RATHER THAN LEAVE THE BODY ALONE: leaving it would create a
-- SECOND COPY of the feed's filters, and the two would drift the first time
-- either is touched — the Curbside guard would have to be maintained twice, and
-- so would the lifecycle filters. One body, called two ways.
--
-- `-infinity` / `infinity` are the identity element for this predicate:
-- `end_instant >= '-infinity'` and `starts_at <= 'infinity'` are true for every
-- row, so a 3-argument call returns EXACTLY the set it returns today. This is
-- not a default value with a policy baked into it; it is "no bound".
--
-- THIS FUNCTION IS TEMPORARY. It exists so the two live client call sites keep
-- working across the gap between this migration and the client commit. A later
-- migration drops it — wrapper first, then this — once nothing calls it.
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
  select * from app.events_within_radius(
    p_origin_lat, p_origin_lng, p_radius_miles,
    '-infinity'::timestamptz, 'infinity'::timestamptz
  );
$$;

-- NO GRANT STATEMENT HERE, DELIBERATELY. CREATE OR REPLACE preserved this
-- function's existing ACL, and re-stating it would paper over a reset if one
-- ever happened — 0027's and 0028's reason for the same omission. The post-arc
-- diff is what confirms it survived; a defensive re-grant would make that diff
-- unable to answer the question.
--
-- The 3-argument PUBLIC wrapper is not touched at all: it still calls
-- app.events_within_radius(3 args), which now delegates. Its ACL is untouched
-- because the object is untouched.

-- ---------------------------------------------------------------------------
-- PostgREST caches the schema, including function signatures. Without this it
-- does not know the 5-argument form exists and the client's new call resolves
-- to nothing.
--
-- LOAD-BEARING, NOT HYGIENE: once (tabs)/index.tsx's hasEnded filter is removed
-- in the follow-up commit, the server predicate owns the floor — and a stale
-- cache then SHOWS ENDED EVENTS rather than hiding them.
-- ---------------------------------------------------------------------------
notify pgrst, 'reload schema';

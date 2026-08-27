-- ============================================================================
-- FIXTURE — one published event in Explore search's overflow band.
-- NOT a migration. NOT part of arc 2b-i. Run BY HAND, by the reviewer, in the
-- Supabase Dashboard → SQL Editor. Nothing in the app runs this file, and it is
-- deliberately not under supabase/migrations/.
--
-- WHY IT EXISTS. Explore search's "just past your radius" band renders only
-- when a title match sits BETWEEN the active radius and
-- min(radius * 1.5, radius + 15). At the seeded Sahuarita origin with radius 25
-- that window is 25 → 37.5 mi, and no published event occupies it — so the
-- divider, the "Nothing within 25 mi" note, the stepped-back card and the
-- "+X MI PAST" badge have never been drawn. docs/ACCESSIBILITY.md Entry 6
-- records that as UNVERIFIED. This row is what closes it.
--
-- GRANT SURFACE: UNTOUCHED. This is one INSERT of data. It creates and alters
-- no table, column, function, view, policy or default privilege, and it issues
-- no GRANT or REVOKE.
--
-- WHAT IT DELIBERATELY AVOIDS TRIPPING:
--   * tier_id 'standard', NOT 'curbside' — the curbside quota, 3-day-span and
--     ledger-consume triggers (0008 / 0016 / 0018) all key on that tier, and
--     none of them should fire for a display fixture.
--   * publish_fee_cents left NULL — app.guard_publish_fee (0010) raises 42501
--     on a non-null value at INSERT. (The Dashboard runs as `postgres`, which
--     the guard exempts anyway; leaving it NULL means the fixture does not
--     depend on that exemption.)
--   * category 'outdoors', NOT 'curbside' — app.check_event_category (0001)
--     reserves the curbside category for curbside-tier posts.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- STEP 1 — pick the workspace to hang it on, and SEE which one you picked.
--
-- Run this first, on its own, and read the result. The insert below takes the
-- oldest workspace; if that is not the one you want, note its id here and
-- replace the `select id from public.workspaces ...` subquery in STEP 2 with a
-- literal '...'::uuid.
-- ---------------------------------------------------------------------------
select id, name, created_by, created_at
from public.workspaces
order by created_at
limit 5;

-- ---------------------------------------------------------------------------
-- STEP 2 — the fixture row.
--
-- COORDINATES: 32.4087, -110.9556645 — the seeded origin's longitude, pushed
-- due north by 0.4512° ≈ 31 mi (1° latitude = 68.71 mi). That lands inside the
-- 25 → 37.5 band with ~6 mi of margin on both edges, so a rounding difference
-- in st_distance's spheroid math cannot push it out of the window.
-- DO NOT TRUST THAT ARITHMETIC — STEP 3 reads the distance back out of the
-- database, which is the number the app will actually render.
--
-- st_* are schema-qualified to `extensions` because 0003 relocated PostGIS out
-- of public; the SQL Editor's search_path does not include it.
--
-- TITLE: "Sabino Canyon Night Hike" is chosen so ONE row exercises both
-- branches — see STEP 4.
-- ---------------------------------------------------------------------------
insert into public.events (
  workspace_id,
  title,
  description,
  tier_id,
  status,
  starts_at,
  ends_at,
  venue_name,
  address,
  location,
  entry_fee_cents
)
values (
  (select id from public.workspaces order by created_at limit 1),
  'Sabino Canyon Night Hike',
  'Fixture row for Explore search overflow verification. Safe to delete.',
  'standard',
  'published',
  now() + interval '2 days',
  now() + interval '2 days' + interval '3 hours',
  'Sabino Canyon Trailhead',
  'Sabino Canyon, Tucson, AZ',
  extensions.st_setsrid(extensions.st_makepoint(-110.9556645, 32.4087), 4326)::geography,
  0
)
returning id, title, status, starts_at;

-- Give it a badge so the card renders like a real one. 'outdoors' is safe;
-- 'curbside' would be refused by app.check_event_category on a standard tier.
insert into public.event_categories (event_id, category_id)
select id, 'outdoors'
from public.events
where title = 'Sabino Canyon Night Hike';

-- ---------------------------------------------------------------------------
-- STEP 3 — CONFIRM THE DISTANCE FROM THE DATABASE, not from the arithmetic
-- above. This is the same expression `app.events_within_radius` uses (0028
-- PART A), measured from the seeded Sahuarita origin.
--
-- EXPECT: distance_miles strictly between 25 and 37.5. `in_overflow_band`
-- must be true. If it is false the fixture will not render and the nudge is
-- the latitude in STEP 2, not the app.
-- ---------------------------------------------------------------------------
select
  e.title,
  e.status,
  round(
    (extensions.st_distance(
      e.location,
      extensions.st_setsrid(extensions.st_makepoint(-110.9556645, 31.9575305), 4326)::geography
    ) / 1609.344)::numeric,
    2
  ) as distance_miles,
  (extensions.st_distance(
     e.location,
     extensions.st_setsrid(extensions.st_makepoint(-110.9556645, 31.9575305), 4326)::geography
   ) / 1609.344) between 25 and 37.5 as in_overflow_band
from public.events e
where e.title = 'Sabino Canyon Night Hike';

-- ---------------------------------------------------------------------------
-- STEP 4 — WHAT TO DO IN THE APP, and what each query proves.
--
-- Explore, signed out is fine, at Sahuarita / 25 mi. Tap the search icon
-- (top-right of the header) and type:
--
--   "sabino"  → 0 in-radius title matches, 1 overflow.
--               EXPECT: no "EVENTS" heading at all; the "JUST PAST YOUR RADIUS"
--               divider; the note reading "Nothing within 25 mi — but there is
--               1 just past it…"; one DIMMED card with a "+6.0 MI PAST" badge
--               (or whatever STEP 3 measured, minus 25) whose meta line also
--               shows the true total "· 31.0 mi". BOTH numbers, per the ruling.
--
--   "canyon"  → 1 in-radius ("Madera Canyon Stargazing") + 1 overflow.
--               EXPECT: an "EVENTS" section with the Madera card at full
--               opacity, THEN the divider, THEN the note reading "Only 1 within
--               25 mi. Here is 1 more a little farther out…", THEN the dimmed
--               Sabino card. This is the branch that proves the divider
--               actually separates two populated sections.
--
-- The announcement to check with a screen reader on: the live region should
-- read the FINAL count once ("1 event, 1 just past your radius"), not an
-- in-radius count that is then corrected a round trip later.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- STEP 5 — CLEANUP. **NOT RUN. THE FIXTURE ROW IS DELIBERATELY LEFT IN PLACE**
-- by reviewer ruling, 2026-08-25 — it is the only published event in the
-- 25 → 37.5 mi band and removing it would make the overflow band unverifiable
-- again the moment anyone needs to re-check it.
--
-- SO: if you find `Sabino Canyon Night Hike` in `public.events`, it is this
-- fixture, not production data. It is `status = 'published'` and WILL appear in
-- a real feed to anyone whose origin is within radius of 32.4087, -110.9556645.
--
-- A HARD DELETE when the time comes, not the app's soft delete: this row never
-- existed as far as the product is concerned, and `deleted_at` would leave it in
-- the table shaping future queries. event_categories cascades on the events FK,
-- so the child row goes with it.
-- ---------------------------------------------------------------------------
-- delete from public.events where title = 'Sabino Canyon Night Hike';

-- ---------------------------------------------------------------------------
-- STILL OWED — the both-populated divider case.
--
-- One far-out event can populate the overflow side OR, by moving the origin,
-- the in-radius side — never both at once. So the divider separating two
-- NON-EMPTY groups has never rendered, and neither has the copy that goes with
-- it ("Only N within X mi. Here is 1 more…") — which is the exact seam the
-- "Only 0 within 25 mi" bug was found in. docs/ACCESSIBILITY.md Entry 6 records
-- this as unverified.
--
-- To close it: add a SECOND row INSIDE the radius whose title shares a
-- substring with the first, then search that substring. With the fixture above
-- at ~31 mi, a row ~10 mi out titled e.g. 'Canyon Market Night' makes "canyon"
-- return one in-radius and one overflow result simultaneously.
-- ---------------------------------------------------------------------------

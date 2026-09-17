-- ============================================================================
-- RESEED FIXTURE DATES — re-anchor the seeded events to now(). Arc E, Part 0.
-- NOT a migration. Run BY HAND in the Supabase Dashboard → SQL Editor, against
-- the DEV project. Nothing in the app runs this file, and it is deliberately
-- not under supabase/migrations/. Never against prod.
--
-- WHY IT EXISTS. supabase/seed.sql anchors every fixture to now() AT SEED TIME,
-- and the seed has not been re-run since the fixtures were first inserted. By
-- 2026-09-17 every one of them had aged out: the feed RPC returned 11 rows in
-- the past 120 days and ZERO in the next 200 (docs/ACCESSIBILITY.md Entry 8),
-- so Explore rendered an empty feed for anyone testing, under the default
-- window or any pickable one. Timeline (Arc E) orders by starts_at ASC and had
-- nothing to order. This script gives the dev database future-dated events
-- again WITHOUT re-running the seed — the seed DELETEs and re-INSERTs, which
-- would wipe RSVPs, saves and the Curbside ledger rows that later arcs proved
-- things against.
--
-- HOW IT WORKS. Each row gets ITS OWN offset back — the one seed.sql declares
-- for that id — re-applied against a fresh now(). Not a blanket shift: seed.sql
-- stays the single source of truth for what each fixture MEANS ("this evening",
-- "in 3 days", "live right now"), this file consumes those meanings, and it can
-- be re-run at any future date without going stale. ONE now() per statement —
-- Postgres evaluates now() once per transaction, so every row is anchored to
-- the same instant and the relative spacing seed.sql describes is exact.
--
-- ---------------------------------------------------------------------------
-- PRIVILEGE GATE: N/A — STATED, NOT OMITTED.
--
-- This is the first arc to touch dev DATA rather than schema, so the reasoning
-- lives here at the file, not only in a report. This script writes no schema
-- object: no table, column, function, view, policy or default privilege is
-- created, altered or dropped, and it issues no GRANT or REVOKE. It is UPDATE
-- statements on two columns of existing rows. The pre/post baseline pair and
-- the qa-NNNN suite are N/A under CLAUDE.md's carve-out. GRANT SURFACE:
-- UNTOUCHED.
--
-- ---------------------------------------------------------------------------
-- THE SCOPE PREDICATE, exactly, on every statement below:
--
--     where id::text like '33333333-%'
--       and tier_id <> 'curbside'
--       and deleted_at is null
--
-- `33333333-%` is the seed's fixed-UUID prefix (seed.sql; qa-cleanup.sql
-- excludes the same prefix from the other direction). `deleted_at is null`
-- keeps a soft-deleted fixture where it is — resurrecting one into the future
-- is not this file's job.
--
-- `tier_id <> 'curbside'` IS LOAD-BEARING TWICE OVER, and the second reason is
-- the one that is easy to miss:
--   1. It is what preserves `33333333-0003` — see divergence 1.
--   2. It is what keeps this UPDATE from tripping the two Curbside triggers
--      that fire on UPDATE: `app.enforce_curbside_span` (0016, BEFORE INSERT OR
--      UPDATE, `new.tier_id = 'curbside'`) and `app.consume_curbside_credit`
--      (0018/0019, AFTER INSERT OR UPDATE, `WHEN new.tier_id = 'curbside'`).
--      Neither can fire for a row the predicate excludes. STANDING PROCEDURES
--      proves that re-dating a Curbside row consumes no credit because the
--      consume trigger's idempotency guard short-circuits — but this script
--      does not lean on that: it never touches a Curbside row at all.
--
-- ---------------------------------------------------------------------------
-- TWO DELIBERATE DIVERGENCES FROM seed.sql. A reader comparing this file to
-- the seed will otherwise read both as bugs.
--
--   1. `33333333-0003` (Neighborhood Yard Sale — Quail Creek) IS NOT TOUCHED.
--      seed.sql gives it now() + interval '2 days'. It is the CURBSIDE-HISTORY
--      FIXTURE: left ENDED where it started after migration 0030's behavioural
--      pass, it is the row that proves an ended Curbside post leaves the feed,
--      search, the detail page by direct link and the attendee's Saved → Past
--      (SPARKED_STATE.md, Architecture Decision 8, "Curbside history does not
--      survive"; tracker, STANDING PROCEDURES, CURBSIDE FIXTURES). Moving it
--      into the future destroys that proof. It is excluded by
--      `tier_id <> 'curbside'`, and THE EXCLUSION IS THE POINT — not an
--      accident of the predicate. It is also absent from the VALUES list, so
--      it is excluded twice; if either guard is ever loosened the other holds.
--
--   2. `33333333-0001` (Sahuarita Farmers Market) IS SET TO now() - interval
--      '2 days' (ending now() - interval '2 days' + interval '3 hours'), NOT its
--      seed offset of +6 hours. REASON: Saved → Past and Workspace → Past are
--      previously-verified surfaces whose only non-Curbside fixtures are ENDED
--      events. Re-anchoring all nine non-Curbside rows forward would leave zero
--      ended non-Curbside events and empty two surfaces as a side effect of
--      fixing a third. One row held back in the past preserves both. It is the
--      nearest fixture (0.37 mi), which is deliberate: it costs the LIVE feed
--      nothing it needs (see the Timeline note), and a Past row that sits at
--      the top of a distance-sorted Workspace list is the easiest one to find.
--      The 3-hour end matches the grace window every ENDED test uses, so the
--      row reads ENDED to every surface without relying on `ends_at` being
--      null.
--
-- EVERYTHING ELSE gets its seed.sql offset re-applied verbatim, including:
--   * `33333333-0007` (Downtown Food Truck Round-Up), the LIVE-NOW fixture:
--     now() - 1 hour → now() + 2 hours. Re-anchoring PRESERVES it as live. Its
--     negative start is the feature; do not "fix" it.
--   * `33333333-0010` (Draft Event), the DRAFT fixture: re-anchored to +1 day,
--     `status` left as 'draft'. A draft that is also stale is two problems;
--     this fixes one and leaves the other where the status filter can be
--     verified against it.
--   * `33333333-0008` / `-0009`, the OUT-OF-RADIUS controls (29.95 / 121.81
--     mi): re-anchored so they are live controls again — an out-of-radius
--     event that is also ended proves nothing about the radius filter.
--
-- ---------------------------------------------------------------------------
-- THE TIMELINE REQUIREMENT — why the offsets were checked and NOT changed.
--
-- Timeline's whole claim is that it orders by starts_at ASC instead of by
-- distance. If the soonest event were also the nearest, a Timeline that
-- silently kept distance ordering would produce correct-looking output and
-- verify itself for the wrong reason. So the fixture set must make TIME ORDER
-- AND DISTANCE ORDER DISAGREE.
--
-- They do, measured (haversine from the Sahuarita origin 31.9576, -110.9556;
-- agrees with seed.sql's own distance comments). In-radius, published,
-- non-Curbside, after this script:
--
--     id     distance   starts_at        time rank   distance rank
--     0002    1.20 mi   +1 day 3 hours       2           1
--     0004    7.48 mi   +3 days              3           2
--     0005   10.75 mi   +4 days              4           3
--     0006   16.63 mi   +5 days              5           4
--     0007   18.34 mi   -1 hour (LIVE)       1           5
--
-- The nearest (0002) is not the soonest (0007); the soonest is the farthest.
-- A distance-ordered Timeline would put 0007 LAST; a correct one puts it
-- FIRST. Falsifiable. Per the Part 0 brief: they already disagree, so no
-- offset was adjusted and seed.sql's meanings are intact.
--
-- ⚠️ THE WEAKNESS, RECORDED SO ARC E CAN DECIDE RATHER THAN DISCOVER: the
-- disagreement rests ENTIRELY on 0007, the live row. Among the strictly
-- UPCOMING rows (0002 → 0006) farther is later, monotonically — time order and
-- distance order are identical. If Timeline hoists live events into their own
-- group (the Saved tab's Tonight / This Weekend / Coming Up shape makes that a
-- plausible design), the upcoming group would verify itself for the wrong
-- reason. The two-row fix, if Arc E wants it, is to swap 0004 and 0006's
-- offsets (7.48 mi → +5 days, 16.63 mi → +3 days) in the VALUES list below and
-- record the divergence here beside the other two. Not done in Part 0; the
-- brief's rule was "if they disagree, change nothing", and they do.
--
-- ---------------------------------------------------------------------------
-- KNOWN TRAPS, before the steps that hit them:
--
--   * THE SQL EDITOR RUNS AS `postgres`. auth.uid() is NULL, so any check that
--     leans on RLS or on `app.is_member` returns EMPTY. That looks like a bug
--     and is not; nothing below depends on the caller's identity. It also
--     means `app.guard_publish_fee` (0010) exempts this session outright —
--     irrelevant here anyway, because `publish_fee_cents` is not in the SET
--     list and the UPDATE branch of that guard raises only when it changes.
--   * `starts_at` / `ends_at` ARE CLIENT-WRITABLE COLUMNS. They sit inside
--     0011's per-column UPDATE grant on `public.events`, which is the reason
--     0016's span trigger had to cover UPDATE and not only INSERT. Nobody
--     should read this script as touching RPC-only columns; a host can move
--     their own event's dates from the app, and this does the same thing to
--     nine rows as `postgres`.
--   * `events_set_updated_at` (0001, BEFORE UPDATE) WILL FIRE and stamp
--     `updated_at` on every touched row. That is the one column this script
--     changes that is not in its SET list. It is a trigger side effect, not a
--     write this file makes, and it is correct: the rows did change.
--   * "Success. No rows returned" is what an UPDATE returns in the SQL Editor.
--     It is not a sign that nothing matched. Phase 3 is how you confirm.
--
-- HOW TO USE: run phase 1, READ the rows, run phase 2, run phase 3. Safe to
-- re-run — every run re-anchors to the current now(), which is the point.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. PREVIEW — the rows that WILL change, old and new starts_at side by side.
--    Run this first, every time, and read it before running phase 2.
--
--    EXPECT: exactly 9 rows, ids 0001, 0002, 0004, 0005, 0006, 0007, 0008,
--    0009, 0010. NOT 0003. Every `current_starts_at` in the past (that is the
--    condition this script exists to fix); every `new_starts_at` in the future
--    except 0001 (about 2 days ago) and 0007 (about 1 hour ago, LIVE).
-- ---------------------------------------------------------------------------
select
  e.id,
  e.title,
  e.tier_id,
  e.status,
  e.starts_at                as current_starts_at,
  now() + v.start_off        as new_starts_at,
  now() + v.end_off          as new_ends_at,
  v.start_off                as seed_offset_applied
from public.events e
join (values
  ('33333333-0001-4000-8000-000000000001'::uuid, interval '-2 days',        interval '-2 days' + interval '3 hours'),
  ('33333333-0002-4000-8000-000000000002'::uuid, interval '1 day 3 hours',  interval '1 day 6 hours'),
  ('33333333-0004-4000-8000-000000000004'::uuid, interval '3 days',         interval '3 days 3 hours'),
  ('33333333-0005-4000-8000-000000000005'::uuid, interval '4 days',         interval '4 days 6 hours'),
  ('33333333-0006-4000-8000-000000000006'::uuid, interval '5 days',         interval '5 days 3 hours'),
  ('33333333-0007-4000-8000-000000000007'::uuid, interval '-1 hour',        interval '2 hours'),
  ('33333333-0008-4000-8000-000000000008'::uuid, interval '2 days',         interval '2 days 3 hours'),
  ('33333333-0009-4000-8000-000000000009'::uuid, interval '3 days',         interval '3 days 5 hours'),
  ('33333333-0010-4000-8000-000000000010'::uuid, interval '1 day',          interval '1 day 2 hours')
) as v(id, start_off, end_off) on v.id = e.id
where e.id::text like '33333333-%'
  and e.tier_id <> 'curbside'
  and e.deleted_at is null
order by e.id;

-- ---------------------------------------------------------------------------
-- 2. UPDATE — the re-anchor. Two columns, nine rows, one now().
--    Expect "Success. No rows returned". Phase 3 confirms.
--
--    The VALUES list is the SAME list as phase 1, byte for byte — the preview
--    shows exactly what this writes. If you change an offset, change it in
--    both places, and record the divergence in the header.
-- ---------------------------------------------------------------------------
update public.events e
set
  starts_at = now() + v.start_off,
  ends_at   = now() + v.end_off
from (values
  ('33333333-0001-4000-8000-000000000001'::uuid, interval '-2 days',        interval '-2 days' + interval '3 hours'),
  ('33333333-0002-4000-8000-000000000002'::uuid, interval '1 day 3 hours',  interval '1 day 6 hours'),
  ('33333333-0004-4000-8000-000000000004'::uuid, interval '3 days',         interval '3 days 3 hours'),
  ('33333333-0005-4000-8000-000000000005'::uuid, interval '4 days',         interval '4 days 6 hours'),
  ('33333333-0006-4000-8000-000000000006'::uuid, interval '5 days',         interval '5 days 3 hours'),
  ('33333333-0007-4000-8000-000000000007'::uuid, interval '-1 hour',        interval '2 hours'),
  ('33333333-0008-4000-8000-000000000008'::uuid, interval '2 days',         interval '2 days 3 hours'),
  ('33333333-0009-4000-8000-000000000009'::uuid, interval '3 days',         interval '3 days 5 hours'),
  ('33333333-0010-4000-8000-000000000010'::uuid, interval '1 day',          interval '1 day 2 hours')
) as v(id, start_off, end_off)
where e.id = v.id
  and e.id::text like '33333333-%'
  and e.tier_id <> 'curbside'
  and e.deleted_at is null;

-- ---------------------------------------------------------------------------
-- 3. VERIFY. Two result grids.
--
-- 3a. Every touched row's new starts_at, plus 0003 for the negative control.
--     EXPECT: 10 rows (every seed row; none has been soft-deleted as of
--     2026-09-17). `hours_from_now` positive for 0002, 0004–0006, 0008–0010;
--     about -48 for 0001; about -1 for 0007; and for 0003 a LARGE negative
--     number (it ended weeks ago and is untouched) with `touched_this_run` =
--     false. `updated_at` within the last minute on the nine touched rows.
-- ---------------------------------------------------------------------------
select
  e.id,
  e.title,
  e.tier_id,
  e.status,
  e.starts_at,
  e.ends_at,
  round((extract(epoch from (e.starts_at - now())) / 3600.0)::numeric, 1) as hours_from_now,
  e.updated_at > now() - interval '1 minute'                    as touched_this_run
from public.events e
where e.id::text like '33333333-%'
  and e.deleted_at is null
order by e.starts_at;

-- ---------------------------------------------------------------------------
-- 3b. The counts. This is the PASS/FAIL line.
--
--   published_non_curbside_future  — published, non-Curbside seed rows with
--                                    starts_at > now().          EXPECT 6:
--                                    0002, 0004, 0005, 0006, 0008, 0009.
--                                    NOT 0007 (started an hour ago, live) and
--                                    NOT 0010 (a draft, not published).
--   published_non_curbside_past    — same set, starts_at < now(). EXPECT 2:
--                                    0001 (held back) AND 0007 (LIVE — a live
--                                    event has a past start by construction).
--                                    ⚠️ The Part 0 brief said "expect exactly
--                                    1, row 0001"; that count did not account
--                                    for 0007's negative offset. TWO is the
--                                    correct pass. ONE means 0007 lost its
--                                    live state. `live_non_curbside` below is
--                                    what tells the two apart.
--   live_non_curbside              — starts_at <= now() < ends_at. EXPECT 1
--                                    (0007). This is the row that separates
--                                    "past" from "over".
--   curbside_history_starts_at     — 0003's starts_at. EXPECT a timestamp
--                                    WEEKS in the past (it was last moved in
--                                    early September 2026). If it is in the
--                                    future, the tier exclusion failed and the
--                                    Curbside-history proof is gone.
--   curbside_history_is_past       — EXPECT true.
--   seed_events                    — all seed rows. EXPECT 10, unchanged; this
--                                    script inserts and deletes nothing.
-- ---------------------------------------------------------------------------
select
  (select count(*) from public.events e
     where e.id::text like '33333333-%' and e.deleted_at is null
       and e.tier_id <> 'curbside' and e.status = 'published'
       and e.starts_at > now())                                  as published_non_curbside_future,
  (select count(*) from public.events e
     where e.id::text like '33333333-%' and e.deleted_at is null
       and e.tier_id <> 'curbside' and e.status = 'published'
       and e.starts_at < now())                                  as published_non_curbside_past,
  (select count(*) from public.events e
     where e.id::text like '33333333-%' and e.deleted_at is null
       and e.tier_id <> 'curbside' and e.status = 'published'
       and e.starts_at <= now() and e.ends_at > now())           as live_non_curbside,
  (select e.starts_at from public.events e
     where e.id = '33333333-0003-4000-8000-000000000003')        as curbside_history_starts_at,
  (select e.starts_at < now() from public.events e
     where e.id = '33333333-0003-4000-8000-000000000003')        as curbside_history_is_past,
  (select count(*) from public.events e
     where e.id::text like '33333333-%')                         as seed_events;

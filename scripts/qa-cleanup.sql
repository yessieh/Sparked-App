-- ============================================================================
-- QA CLEANUP — remove test events created during walk-throughs.
--
-- WHY THIS FILE EXISTS: cleanups used to be ad-hoc DELETEs typed into the SQL
-- editor from chat. That went wrong twice — once because a bare-street address
-- didn't match the fuller geocoded one (so a row survived and looked like the
-- delete had failed), and once because "Success. No rows returned" reads like
-- nothing happened when it is simply what a DELETE returns. A checked-in
-- script fixes both: the matching rule lives in one reviewed place, and the
-- verification step is part of the procedure instead of a follow-up question.
--
-- HOW TO USE: run section 1, eyeball the rows, run section 2, then run
-- section 3 to confirm. Safe to re-run — it is idempotent.
--
-- THE STANDING QA ADDRESS is '18680 S Nogales Hwy'. Use it for every test
-- listing so cleanup stays a one-liner. Matching is PREFIX-based (`like`)
-- because the geocoder rewrites what the host typed: the same test event has
-- shown up as both '18680 S Nogales Hwy' and
-- '18680 S Nogales Hwy, Green Valley, AZ 85614'. '123 Rainbow Road' is the
-- legacy QA address from earlier walks and is matched too.
--
-- SAFETY: seeded demo events (ids '33333333-…', supabase/seed.sql) are excluded
-- explicitly. They use real Tucson-area addresses and would not match these
-- patterns anyway — the exclusion is belt-and-braces, because this file's whole
-- job is to be the SAFE way to do this.
--
-- Deletes cascade to event_categories, event_vendors, saves and rsvps
-- (all FK `on delete cascade`), so this is the only statement needed.
--
-- NOTE: this is a DEV/STAGING tool. Once a separate production project exists
-- (see the tracker's dev/prod item) it must NEVER be run against prod.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. PREVIEW — what is about to be deleted. Run this first, every time.
-- ---------------------------------------------------------------------------
select
  e.id,
  e.title,
  e.status,
  e.address,
  e.starts_at,
  (select count(*) from public.event_vendors v where v.event_id = e.id) as vendors
from public.events e
where (e.address like '18680 S Nogales Hwy%' or e.address like '123 Rainbow Road%')
  and e.id::text not like '33333333-%'
order by e.starts_at;

-- ---------------------------------------------------------------------------
-- 2. DELETE. Cascades to categories / vendors / saves / rsvps.
--    Expect "Success. No rows returned" — that is what a DELETE returns, NOT a
--    sign that nothing matched. Section 3 is how you confirm.
-- ---------------------------------------------------------------------------
delete from public.events e
where (e.address like '18680 S Nogales Hwy%' or e.address like '123 Rainbow Road%')
  and e.id::text not like '33333333-%';

-- ---------------------------------------------------------------------------
-- 3. VERIFY — both numbers should be 0 and 9 respectively.
--    qa_rows_remaining: QA listings still present (must be 0).
--    seed_events: the seeded demo set, untouched (9 anon-visible today).
-- ---------------------------------------------------------------------------
select
  (select count(*) from public.events e
     where (e.address like '18680 S Nogales Hwy%' or e.address like '123 Rainbow Road%')
       and e.id::text not like '33333333-%') as qa_rows_remaining,
  (select count(*) from public.events e
     where e.id::text like '33333333-%') as seed_events;

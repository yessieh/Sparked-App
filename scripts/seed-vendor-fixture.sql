-- ============================================================================
-- FIXTURE — two vendor pins on the seeded Plus event 33333333-0002.
-- NOT a migration. Run BY HAND in the Supabase Dashboard → SQL Editor, on the
-- DEV project (Sparked-App). Nothing in the app runs this file, and it is
-- deliberately not under supabase/migrations/. Never against prod.
--
-- WHY IT EXISTS. supabase/seed.sql now carries these two rows (added
-- 2026-09-21), but the seed only runs on a `db reset` — editing it changes
-- nothing in the CURRENT database. This script inserts the same two rows,
-- with the same fixed ids, into the database that exists today.
--
-- WHY THE ROWS EXIST AT ALL. Vendor pins are a paid-tier feature that had no
-- seeded fixture. The only event_vendors rows in dev belonged to a hand-made
-- event (2adc4e91-…, "TEST EVENT") that was soft-deleted on 2026-08-15, so the
-- feature was unverifiable in the app from that day — which is part of why
-- migration 0029's breakage of the read (anon 42501 on event_vendors) went
-- unnoticed until 2026-09-21, and why 0033's fix has so far been verified in
-- SQL only. These rows are the first visual confirmation path.
--
-- IDEMPOTENT. `on conflict (id) do nothing` on the fixed ids: running it
-- twice is harmless, and running it after a `db reset` — where seed.sql has
-- already inserted them — is a no-op. Step 2 reads back what is actually
-- there, whichever path put it there.
--
-- GRANT SURFACE: UNTOUCHED. This is one INSERT of data. It creates and alters
-- no table, column, function, view, policy or default privilege, and it issues
-- no GRANT or REVOKE. The privilege gate is N/A and that is stated, not
-- omitted.
--
-- WHAT IT DELIBERATELY AVOIDS TRIPPING:
--   * The parent is 33333333-0002, tier_id 'plus' and status 'published',
--     which is the one tier the site map renders for and the one status the
--     storefront branch of event_vendors_select_public admits. A vendor row
--     on a Standard event would insert fine and never render; on a draft it
--     would render for the host only.
--   * event_vendors carries NO triggers (checked across every migration), so
--     nothing fires on this insert. The curbside quota / span / ledger
--     triggers (0008 / 0016 / 0018) are on `events`, not here, and 0002 is
--     not curbside anyway.
--   * No `events` row is written, so app.guard_publish_fee (0010) is not in
--     play at all.
--   * pin_x / pin_y are inside the 0..1 CHECK constraints (0013) with margin.
--   * logo_path NULL — the placeholder image, per lib/vendors.ts; a non-null
--     path would point at a storage bucket that does not exist yet.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- STEP 1 — the two rows. Same ids, same values as supabase/seed.sql.
-- ---------------------------------------------------------------------------
insert into public.event_vendors (id, event_id, name, vendor_type, logo_path, pin_x, pin_y, sort_order) values
  ('44444444-0001-4000-8000-000000000001', '33333333-0002-4000-8000-000000000002',
   'Lakeside Coffee Cart', 'Coffee', null, 0.28, 0.36, 1),
  ('44444444-0002-4000-8000-000000000002', '33333333-0002-4000-8000-000000000002',
   'Valley Vinyl & Merch', 'Merch', null, 0.71, 0.62, 2)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- STEP 2 — READ IT BACK, as `postgres` (RLS bypassed — this proves the rows
-- exist, not that anyone can see them).
--
-- EXPECT: 2 rows, sort_order 1 then 2, both event_id = 33333333-0002, parent
-- tier 'plus' and status 'published'.
-- ---------------------------------------------------------------------------
select v.id, v.name, v.vendor_type, v.pin_x, v.pin_y, v.sort_order,
       e.title, e.tier_id, e.status, e.deleted_at
from public.event_vendors v
join public.events e on e.id = v.event_id
where v.event_id = '33333333-0002-4000-8000-000000000002'
order by v.sort_order;

-- ---------------------------------------------------------------------------
-- STEP 3 — READ IT BACK AS `anon`. This is the 0033 check on real fixture
-- data rather than the suite's throwaway rows, and the query the app's
-- (tabs)/event/[id].tsx:109 read is equivalent to.
--
-- EXPECT: 2. Before 0033 this raised `42501 permission denied for table
-- events`; if it does again, the policy has regressed — see
-- docs/STACK_FACTS.md entry 1.
-- ---------------------------------------------------------------------------
begin;
set local role anon;
select count(*) as anon_visible_vendor_rows
from public.event_vendors
where event_id = '33333333-0002-4000-8000-000000000002';
rollback;

-- ---------------------------------------------------------------------------
-- STEP 4 — WHAT TO DO IN THE APP.
--
-- Signed OUT, at localhost:8081, Sahuarita / 25 mi, default window. Open
-- "Lakeside Songwriters Night" (it is tomorrow evening, so it is in the
-- default feed). EXPECT: the site-map section renders with TWO pins —
-- "Lakeside Coffee Cart" (Coffee) and "Valley Vinyl & Merch" (Merch) — and
-- the vendor directory lists both. Network tab: the event_vendors request
-- returns 200 with two rows, not 401. This is the first visual confirmation
-- that 0033's fix works in the app; docs/ACCESSIBILITY.md has no entry for
-- the site map yet, so anything odd about its rendering is a new finding,
-- not a regression.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- CLEANUP — NOT RUN, AND NOT NEEDED. These rows are seed fixtures now: they
-- live in supabase/seed.sql, they survive a reset by construction, and
-- qa-cleanup.sql cannot touch them (it deletes events by QA address prefix
-- and excludes the 33333333-% seed ids; these rows cascade only from their
-- seeded parent). If they ever need to go, delete by id:
-- ---------------------------------------------------------------------------
-- delete from public.event_vendors
--  where id in ('44444444-0001-4000-8000-000000000001', '44444444-0002-4000-8000-000000000002');

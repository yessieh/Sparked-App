-- ============================================================================
-- 0034 — public.category_preferences: the storage behind Settings →
-- "Interests & blocks" (Architecture Decision 7; RULINGS LOCKED 2026-09-22 in
-- SPARKED_STATE.md).
--
-- WHAT THIS DOES: creates ONE table, enables RLS on it, creates FOUR policies,
-- and issues TWO grant statements. Nothing else. No function is created, no
-- existing table, column, policy, grant or function is touched.
--
-- ---------------------------------------------------------------------------
-- THE SHAPE — three buckets, two stored.
--
-- AD 7's three mutually-exclusive buckets are I'm into / Undecided / Not for
-- me. Only two are STORED: a row with `stance = 'into'` or `stance =
-- 'blocked'`. **Undecided is the absence of a row**, not a third value — every
-- category starts there, and there is nothing to record about a category the
-- user has no opinion on. The primary key (user_id, category_id) is what makes
-- the buckets exclusive: one row per category per user, so a category can never
-- sit in two buckets at once.
--
-- `category_id` references `public.categories(id)`, the canonical 13-row
-- taxonomy (0001:172-196; SCHEMA LOCK 4). It stores the ID ('pop-ups'), never
-- the label ('Pop-Ups') — the feed RPC returns ids too (0031:194), so the
-- client's "is any of this event's categories blocked" test compares like with
-- like. ON DELETE CASCADE on both keys: a deleted profile takes its
-- preferences with it (the account-deletion cascade), and a category row is
-- never deleted in practice (retirement is `categories.active = false`), but if
-- one ever were, a preference about a category that no longer exists means
-- nothing.
--
-- NO EXTRA INDEX. Every read is user-keyed ("my preferences"), which the
-- primary key's leading column covers — the same reasoning 0006 gave for
-- `saves`. The one category-keyed path is the ON DELETE CASCADE from
-- `categories`, a 13-row table written only by migrations.
--
-- ---------------------------------------------------------------------------
-- THE WRITE PATH — three verbs, one per bucket move. No upsert.
--
--   Undecided → I'm into / Not for me   INSERT (user_id, category_id, stance)
--   I'm into  ↔ Not for me              UPDATE stance  (the only mutable column)
--   I'm into / Not for me → Undecided   DELETE
--
-- The client knows which bucket a category is in before it moves it, so it
-- always knows which of the three it is doing. An upsert would fold INSERT and
-- UPDATE into one call the client does not need, and would put the grant
-- surface in the hands of PostgREST's translation rather than this file.
-- UNVERIFIED: that a PostgREST `.upsert()` (INSERT … ON CONFLICT DO UPDATE)
-- needs UPDATE privilege on every column it sets, which `update (stance)` alone
-- would not satisfy. Check that would settle it: as `authenticated`, run an
-- `.upsert` against this table and look for 42501. It is not settled here
-- because nothing here depends on it — the path above never upserts.
--
-- ---------------------------------------------------------------------------
-- THE PRIVILEGE MODEL, WITH EVIDENCE FOR EVERY CLAIM (CLAUDE.md, "A comment
-- asserting a privilege property cites its evidence").
--
-- 1. THIS TABLE STARTS WITH NO PRIVILEGES FOR anon OR authenticated.
--    Evidence: `supabase/audits/baselines/2026-09-22-pre-interests-blocks.md`
--    Section 5 (captured 2026-09-22, 5A = 268): the only default-privilege
--    rows for schema `public`, object type `tables`, granting to anon or
--    authenticated have grantor `supabase_admin` (file lines 395-410). Grantor
--    `postgres` grants only to `postgres` and `service_role` (lines 211-222),
--    and there are no `(all schemas)` table rows. Table ownership by `postgres`
--    is VERIFIED 2026-09-22 (Jas, SQL Editor: `public.saves` and
--    `public.curbside_quota_ledger` are owned by postgres, and this migration
--    runs the same way). So the two grants below are the WHOLE grant surface.
--    Confirmation: scripts/qa-0034-category-preferences.sql catalog cases 1f
--    and 1j, behavioural cases 3a-3d (anon denied at the privilege layer) —
--    UNVERIFIED until that run is recorded.
--
-- 2. NO DEFENSIVE REVOKES, DELIBERATELY. A `revoke all ... from anon` here
--    would hide the evidence if claim 1 were ever wrong: an unexpected anon
--    grant must show up in the post-arc audit diff as an unexplained delta,
--    which blocks the commit. A revoke would make it vanish instead.
--
-- 3. THE POLICIES TEST ONLY THIS TABLE'S OWN `user_id`. No subquery, no other
--    table, no helper function. A policy's references to columns of its OWN
--    table are not privilege-checked; references to OTHER tables are, against
--    the caller (docs/STACK_FACTS.md entries 1 and 8, measured 2026-09-21 — the
--    `event_vendors` defect that 0033 fixed). Nothing here can fail that way.
--    The shape is 0006's `saves_*_own` policies, which the 2026-09-22 baseline
--    Section 8 records as `(user_id = auth.uid())` (lines 533-535).
--
-- 4. UPDATE IS GRANTED ON `stance` ONLY. `user_id` and `category_id` are the
--    row's identity: changing `user_id` would hand a preference to someone
--    else, and changing `category_id` is a different preference, which is a
--    DELETE plus an INSERT, not an edit. The column grant makes both
--    impossible at the privilege layer, before RLS is consulted. The UPDATE
--    policy's WITH CHECK is the second fence on `user_id` and is unreachable
--    while the column grant holds. Confirmation: qa-0034 catalog cases 1h-1i,
--    behavioural cases 4f-4g — UNVERIFIED until that run is recorded.
--
-- 5. NO ROW IS READABLE BY ANYONE BUT ITS OWNER. A signed-out visitor has no
--    blocks (the RULINGS), so anon has no reason to read this table and gets
--    no grant. A stranger (another authenticated user) reads, updates and
--    deletes zero of your rows and cannot insert one in your name — qa-0034
--    cases 5a-5g, UNVERIFIED until that run is recorded.
--
-- ---------------------------------------------------------------------------
-- GRANT SURFACE (CLAUDE.md, "Standing grant check"):
--   authenticated GAINS  SELECT, INSERT, DELETE on public.category_preferences
--                        UPDATE (stance)     on public.category_preferences
--   anon                 gains NOTHING
--   PUBLIC               gains NOTHING (no function is created, so no implicit
--                        EXECUTE is minted)
--   Every other object:  unchanged.
-- Consumers are named at each grant below.
-- ============================================================================

create table public.category_preferences (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  category_id text not null references public.categories (id) on delete cascade,
  stance      text not null check (stance in ('into', 'blocked')),
  primary key (user_id, category_id)
);

-- ---------------------------------------------------------------------------
-- RLS — own rows only, all four operations, `to authenticated`. Own-table
-- column only in every expression (claim 3 above).
-- ---------------------------------------------------------------------------
alter table public.category_preferences enable row level security;

create policy category_preferences_select_own on public.category_preferences
  for select to authenticated using (user_id = auth.uid());
create policy category_preferences_insert_own on public.category_preferences
  for insert to authenticated with check (user_id = auth.uid());
create policy category_preferences_update_own on public.category_preferences
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy category_preferences_delete_own on public.category_preferences
  for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- GRANTS — the whole surface (claim 1). No anon grant; no revokes (claim 2).
--
-- SELECT  — CONSUMED BY the Settings "Interests & blocks" screen (reading
--           which bucket each category is in) and by the Explore feed filter
--           (reading the signed-in user's blocked set to hide events).
-- INSERT  — CONSUMED BY a bucket move out of Undecided.
-- DELETE  — CONSUMED BY a bucket move back to Undecided.
-- UPDATE (stance) — CONSUMED BY a move between I'm into and Not for me.
--           Column-scoped on purpose (claim 4).
-- ---------------------------------------------------------------------------
grant select, insert, delete on public.category_preferences to authenticated;
grant update (stance) on public.category_preferences to authenticated;

-- A NEW TABLE is invisible to the REST API until PostgREST reloads its schema
-- cache (the same reason 0031 ends with this line). Load-bearing, not hygiene:
-- without it the client's first reads of this table fail until the next
-- reload. UNVERIFIED: the exact error PostgREST returns for a table missing
-- from its cache; irrelevant here because this line prevents the case.
notify pgrst, 'reload schema';

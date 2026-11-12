-- ============================================================================
-- 0037 — Account deletion, server side: the guard + workspace cleanup that the
-- stage-2 Edge Function calls BEFORE it deletes the login account.
--
-- WHAT THIS DOES — and nothing else:
--     alter table public.workspaces  created_by: DROP NOT NULL
--     replace FK  workspaces_created_by_fkey → ON DELETE SET NULL
--     create      app.delete_account_workspaces(p_user_id uuid)    (definer)
--     create      public.delete_account_workspaces(user_id uuid)   (invoker wrapper)
--     grant usage on schema app to service_role
--     notify pgrst
-- No policy, no table, no other function, no other column grant is touched.
--
-- ---------------------------------------------------------------------------
-- INTENT (locked by Jas, 2026-11-12).
--
-- Deletion is immediate, real erasure. Workspaces the user OWNS, and every
-- event in them (all statuses, soft-deleted included), are hard-deleted with
-- the account. Attendees lose those events from Saved → Past — accepted, the
-- same ruling as delete_workspace on 2026-07-30 (0017), and a deliberate
-- exception to 0022's attendee-history rule for this one path.
--
-- The sequence the Edge Function (stage 2, not in this file) runs:
--   1. verify the caller's JWT, take its user id;
--   2. call public.delete_account_workspaces(user_id) as service_role;
--   3. only if 2 succeeded, delete the login account (admin API). auth.users
--      → profiles cascades (0001), and profiles → memberships / saves / rsvps /
--      category_preferences cascade; curbside_quota_ledger.user_id is SET NULL
--      (0018) — the ledger row survives, anonymised.
-- Steps 2 and 3 are NOT one transaction. If 3 fails after 2 committed, the
-- user keeps their login with no workspaces; a retry of the whole sequence is
-- safe, because step 2 is idempotent (a second call deletes nothing and
-- returns 0 / 0).
--
-- ---------------------------------------------------------------------------
-- PART A — workspaces.created_by no longer blocks deletion.
--
-- 0001 created the FK with no ON DELETE clause (NO ACTION) and the column NOT
-- NULL, so deleting the profile of anyone who ever created a workspace raised
-- 23503 and rolled back the whole delete.
--
-- DRIFT, FOUND BY THE PRE-APPLY CHECK 2026-11-12 (baseline
-- 2026-11-12-pre-account-deletion.md): the DEV database already held this
-- part's end state — `ON DELETE SET NULL`, `attnotnull = false` — with no
-- 0037 in schema_migrations and no committed migration that made the change.
-- An all-FK comparison (18 rows) found no other drift. CAUSE (reported by
-- Jas, 2026-11-12): he ran this part's three ALTER TABLE statements by hand in
-- the SQL Editor, from the migration text in the PART 1 report, and stopped at
-- CREATE FUNCTION when Supabase warned him. Nothing else was run — consistent
-- with the check (both functions absent, no service_role USAGE on app).
-- Against dev, this part therefore re-states
-- the live state (DROP NOT NULL is a no-op; the FK is dropped and re-added
-- identically); it is kept so the repo describes the schema and a fresh
-- database built from these files gets it. created_by is attribution only —
-- ownership lives in memberships (SCHEMA_PLAN §3.2) — so SET NULL loses nothing
-- the app reads. 0015 already made the column unreadable by clients.
--
-- CONSEQUENCE, STATED: the FK no longer stops a profile delete that skips the
-- guard (e.g. a user deleted from the Supabase dashboard). Such a delete
-- cascades the owner's membership and leaves the workspace and its published
-- events in place with NO members and created_by NULL. The Edge Function is
-- the only sanctioned delete path; the guard must run first.
--
-- Column grants are UNCHANGED (ALTER … DROP NOT NULL and an FK swap do not
-- touch attacl). Clients still cannot read created_by (0015) and still cannot
-- WRITE NULL into it: authenticated's INSERT is gated by
-- workspaces_insert_auth `with check (created_by = auth.uid())`, and
-- NULL = uid is not true, so a NULL insert is refused (QA 2zc).
-- app.consume_curbside_credit falls back to created_by only when there is no
-- JWT (seed / admin tooling); on an orphaned workspace that fallback now finds
-- NULL and raises `curbside_poster_unknown` — the correct answer for a post
-- nobody can be attributed.
--
-- UNVERIFIED (Postgres naming): the existing constraint is named
-- `workspaces_created_by_fkey` (the default <table>_<column>_fkey). The
-- pre-apply check reads it; `drop constraint` carries no IF EXISTS, so a wrong
-- name fails the migration loudly rather than leaving the old FK in place.
--
-- ---------------------------------------------------------------------------
-- PART B — the guard + cleanup, app.delete_account_workspaces(p_user_id).
--
--   1. NULL user id → raise `user_id_required` (22004). Never "delete
--      nothing" silently on a malformed call.
--   2. LOCK every workspace the user owns (memberships.role = 'owner'),
--      FOR UPDATE, in id order.
--   3. If ANY of those workspaces has ANY other member (any role) → raise
--      `transfer_ownership_first` (P0001), DETAIL names the first such
--      workspace id. Nothing is deleted: the raise aborts the call's
--      transaction.
--   4. Otherwise count the events in them (every status, soft-deleted
--      included — they are hard-deleted here), delete the workspaces, and
--      return (workspaces_deleted, events_deleted). The FK cascade does the
--      rest, exactly as delete_workspace (0017) documents.
--   Memberships where the user is NOT the owner are left alone: they cascade
--   away with the profile in step 3 of the sequence above. The function never
--   touches profiles or auth.users.
--
-- WHY THE LOCK. Between "check for other members" and "delete", a member
-- could be added. No client path can add a membership today (0001: no INSERT
-- policy), but this is a destructive call and the check is cheap to make
-- airtight. UNVERIFIED (Postgres semantics): a membership INSERT takes FOR KEY
-- SHARE on the referenced workspaces row through its FK, which conflicts with
-- FOR UPDATE — so a concurrent add either commits before the lock is granted
-- (and the check, a later statement, sees it) or waits until this transaction
-- ends. Settled only by a two-session test; the single-session QA suite cannot
-- exercise it.
--
-- Callable by a user id rather than auth.uid(): the Edge Function calls it as
-- service_role, which carries no user JWT. The Edge Function is where the id
-- is verified; that is why NOTHING but service_role may execute this.
--
-- ---------------------------------------------------------------------------
-- PART C — placement and GRANTS.
--
-- WHY A PUBLIC WRAPPER. The Edge Function reaches the database through the
-- Data API (PostgREST, via supabase-js `.rpc()`), which serves only the exposed
-- schemas; `app` is deliberately not one of them. Exposing `app` would expose
-- every definer body in it. So the house convention applies (0012 → 0017): the
-- definer body lives in `app`, a thin SECURITY INVOKER wrapper in `public`.
-- Because the wrapper is INVOKER, the caller (service_role) executes the app
-- body itself, and therefore needs EXECUTE on both and USAGE on schema app.
--
-- GRANT SURFACE (CLAUDE.md, "Standing grant check"):
--   app.delete_account_workspaces(uuid)
--       PUBLIC          LOSES the implicit EXECUTE CREATE FUNCTION mints
--       anon            nothing (revoked explicitly)
--       authenticated   nothing (revoked explicitly)
--       service_role    GAINS EXECUTE
--         CONSUMED BY: public.delete_account_workspaces (invoker → caller runs it)
--   public.delete_account_workspaces(uuid)
--       PUBLIC / anon / authenticated   nothing (revoked explicitly)
--       service_role    GAINS EXECUTE
--         CONSUMED BY: the stage-2 account-deletion Edge Function (service key)
--   schema app
--       service_role    GAINS USAGE (no-op if it already holds it — the
--         pre-apply check records which)
--         CONSUMED BY: the wrapper's call into app.delete_account_workspaces
--         Exposure: service_role already bypasses RLS and is the master key;
--         USAGE lets it name objects in `app`, and only functions that grant it
--         EXECUTE (this one) or carry PUBLIC (the trigger functions, is_member)
--         become callable. It gains no capability it lacks over the tables.
--   public.workspaces.created_by — column grants UNCHANGED.
-- `postgres` keeps EXECUTE as owner (it shows in the ACL once one exists).
--
-- ---------------------------------------------------------------------------
-- EXPECTED POST-ARC DELTA (against a pre-arc baseline taken with the current
-- supabase/audits/privilege_audit.sql):
--   1. TABLE- AND COLUMN-LEVEL GRANTS — no change. 1A unchanged (121 if the
--      pre-arc 1A is 121).
--   2. RLS — no change.
--   3. VIEWS AND MATVIEWS — no change (0 rows).
--   4. FUNCTIONS — +2 rows, 41 → 43:
--      app    | delete_account_workspaces | p_user_id uuid | true  | postgres | search_path=public, app | postgres:EXECUTE, service_role:EXECUTE
--      public | delete_account_workspaces | user_id uuid   | false | postgres | search_path=public, app | postgres:EXECUTE, service_role:EXECUTE
--   5. DEFAULT PRIVILEGES — no change (5A 268).
--   6. ROLE INHERITANCE — no change.
--   7. SCHEMA-LEVEL PRIVILEGES — no change IN THE AUDIT. The service_role USAGE
--      grant on `app` is real but INVISIBLE to section 7, which filters to
--      anon / authenticated / PUBLIC. QA 1h is its evidence.
--   8. RLS POLICY DUMP — no change (workspaces_insert_auth with_check md5
--      987767fc803474751ce44a4235a12922 stays).
-- Also invisible to the audit: the created_by nullability and FK change (no
-- section reads constraints). QA 1a / 1b are their evidence.
-- Any other row that moves is unexplained and blocks the commit.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- PART A — workspaces.created_by: nullable, ON DELETE SET NULL.
-- ---------------------------------------------------------------------------
alter table public.workspaces
  alter column created_by drop not null;

alter table public.workspaces
  drop constraint workspaces_created_by_fkey;

alter table public.workspaces
  add constraint workspaces_created_by_fkey
  foreign key (created_by) references public.profiles (id) on delete set null;


-- ---------------------------------------------------------------------------
-- PART B — app.delete_account_workspaces: the guard + cleanup (definer).
-- ---------------------------------------------------------------------------
create function app.delete_account_workspaces(p_user_id uuid)
returns table (workspaces_deleted integer, events_deleted integer)
language plpgsql
security definer
set search_path = public, app
as $$
declare
  owned      uuid[];
  blocked_ws uuid;
  ws_n    integer;
  ev_n    integer;
begin
  if p_user_id is null then
    raise exception 'user_id_required' using errcode = '22004';
  end if;

  -- Lock every workspace this user owns, in a fixed order, before looking at
  -- who else belongs to them. See the header: WHY THE LOCK.
  perform 1
  from public.workspaces w
  where w.id in (
    select m.workspace_id from public.memberships m
    where m.user_id = p_user_id and m.role = 'owner'
  )
  order by w.id
  for update of w;

  -- Re-read under the lock: this statement's snapshot is taken after it.
  select coalesce(array_agg(m.workspace_id order by m.workspace_id), array[]::uuid[])
    into owned
  from public.memberships m
  where m.user_id = p_user_id and m.role = 'owner';

  -- GUARD: any other member, any role, in any owned workspace → refuse.
  select m.workspace_id into blocked_ws
  from public.memberships m
  where m.workspace_id = any (owned)
    and m.user_id <> p_user_id
  order by m.workspace_id
  limit 1;

  if blocked_ws is not null then
    raise exception 'transfer_ownership_first'
      using errcode = 'P0001',
            detail  = format('workspace %s has other members', blocked_ws),
            hint    = 'Transfer ownership of every shared workspace before deleting the account.';
  end if;

  select count(*)::int into ev_n
  from public.events e
  where e.workspace_id = any (owned);

  delete from public.workspaces w where w.id = any (owned);
  get diagnostics ws_n = row_count;

  workspaces_deleted := ws_n;
  events_deleted     := ev_n;
  return next;
end;
$$;

-- GRANT: service_role EXECUTE only; PUBLIC, anon, authenticated revoked.
-- CONSUMED BY: public.delete_account_workspaces (PART C), SECURITY INVOKER, so
-- the caller — service_role, from the Edge Function — executes this directly.
revoke all on function app.delete_account_workspaces(uuid) from public, anon, authenticated;
grant execute on function app.delete_account_workspaces(uuid) to service_role;


-- ---------------------------------------------------------------------------
-- PART C — public.delete_account_workspaces: the thin invoker wrapper.
-- Argument name is load-bearing: PostgREST routes RPCs by NAME, and the Edge
-- Function will send `{ user_id }`.
-- ---------------------------------------------------------------------------
create function public.delete_account_workspaces(user_id uuid)
returns table (workspaces_deleted integer, events_deleted integer)
language sql
security invoker
set search_path = public, app
as $$
  select * from app.delete_account_workspaces(user_id);
$$;

-- GRANT: service_role EXECUTE only; PUBLIC, anon, authenticated revoked.
-- CONSUMED BY: the stage-2 account-deletion Edge Function (service key).
revoke all on function public.delete_account_workspaces(uuid) from public, anon, authenticated;
grant execute on function public.delete_account_workspaces(uuid) to service_role;

-- GRANT: service_role USAGE on schema app (no-op if already held).
-- CONSUMED BY: the wrapper above calling into app as its invoker.
grant usage on schema app to service_role;


notify pgrst, 'reload schema';

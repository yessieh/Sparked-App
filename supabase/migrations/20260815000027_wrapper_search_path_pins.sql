-- ============================================================================
-- 0027 — Pin `search_path` on the three 0019 public wrappers.
--
-- Migration 3 of the privilege hardening arc (0025 -> 0026 -> 0027).
--
-- SCOPE, STATED AS A FENCE: three `create or replace function` statements on
-- `public.delete_event`, `public.archive_event` and `public.unarchive_event`,
-- each adding ONE line — `set search_path = public, app` — to the definition
-- migration 0019 shipped. No body is altered. No signature, return type,
-- language, security mode or volatility is altered. No grant or revoke appears
-- in this file. The `app.*` definer functions these wrappers call are not
-- touched; they were already pinned by 0019.
--
-- ---------------------------------------------------------------------------
-- THE BASELINE THIS WAS WRITTEN AGAINST
-- ---------------------------------------------------------------------------
-- `supabase/audits/baselines/2026-08-13-post-default-privileges.md`, the
-- post-arc run of `supabase/audits/privilege_audit.sql` for 0026. No migration
-- has been applied since, so it is also the live picture 0027 was authored
-- against and it is the PRE-ARC record for this arc. No separate
-- `pre-wrapper-search-path` export was taken or should be — the same reasoning
-- 0026 recorded: an export written after the fact under a "pre" name captures
-- the wrong moment and makes an empty diff read as a passing run.
--
--   * SECTION 4 is the evidence. `public.delete_event`, `public.archive_event`
--     and `public.unarchive_event` are the ONLY three functions in this
--     database whose `config` column reads `(NONE - INHERITS CALLER)`. Every
--     other function in `app` and `public` pins `search_path`. These three have
--     been unpinned since 0019 shipped on 2026-07-30.
--
-- The audit exports signature, security mode, owner, config and ACL — it does
-- NOT export function bodies. The bodies below were reproduced from
-- `supabase/migrations/20260730000019_soft_delete_and_archive.sql` PART F,
-- which is the only migration in this repo that defines them (0025 revokes on
-- them; nothing else names them). That establishes the repo's text, not the
-- live text. Confirm with `pg_get_functiondef` before applying if the two could
-- have diverged — that is the 0020 failure class.
--
-- ---------------------------------------------------------------------------
-- THE ACL QUESTION — ANSWERED BY THE POST-ARC DIFF, NOT GUARDED AGAINST HERE
-- ---------------------------------------------------------------------------
-- `create or replace function` PRESERVES the existing ACL. It does not re-run
-- the default `GRANT EXECUTE TO PUBLIC` that Postgres applies to a genuinely
-- NEW function. So 0025's `revoke all on function public.<fn>(uuid) from
-- public, anon` — statements 1-3 of that migration — should survive all three
-- replacements untouched, and section 4 of the post-arc export should still
-- read `postgres:EXECUTE, authenticated:EXECUTE` for each, with no PUBLIC.
--
-- NO DEFENSIVE REVOKES ARE WRITTEN IN THIS FILE, DELIBERATELY. Re-adding
-- 0025's revokes here would make the outcome unobservable: the diff would come
-- back clean whether the ACL was preserved or silently reset. If the post-arc
-- diff shows `PUBLIC:EXECUTE` back on any of the three, that is 0025 quietly
-- undoing itself, and it is a finding worth having rather than a hole worth
-- papering over.
--
-- VERIFY THIS EXPLICITLY IN THE POST-ARC DIFF — section 4, execute_grants
-- column, all three rows.
--
-- ---------------------------------------------------------------------------
-- GRANT SURFACE (standing grant check)
-- ---------------------------------------------------------------------------
-- UNCHANGED. This migration adds no grant and removes none. No role gains or
-- loses access to any object or column. The implicit-grant trap does not apply:
-- the default PUBLIC EXECUTE is minted on CREATE of a new function, and all
-- three of these already exist, so `create or replace` mints nothing. The
-- expected post-arc delta in section 4 is exactly three cells — the `config`
-- column moving from `(NONE - INHERITS CALLER)` to `search_path=public, app`
-- — and nothing else anywhere in the export.
--
-- ---------------------------------------------------------------------------
-- WHY THE PIN IS BEHAVIOR-NEUTRAL HERE
-- ---------------------------------------------------------------------------
-- These are SECURITY INVOKER functions, so an unpinned `search_path` is
-- inherited from the caller — PostgREST's session setting for an API call.
-- The bodies resolve exactly one identifier that a search_path could affect,
-- and it is already schema-qualified (`app.delete_event(...)`), so no name in
-- any of the three can resolve differently before and after. `uuid` resolves
-- from `pg_catalog`, which is implicitly on the path regardless.
--
-- The pin still matters: it is what stops a future caller-controlled path from
-- shadowing anything these bodies grow to reference, it is what the advisor's
-- `function_search_path_mutable` check reads, and it is the convention every
-- other function in this database already follows. `public, app` matches the
-- sibling wrappers (`public.delete_workspace`, `public.workspace_event_stats`,
-- `public.publish_paid_event`), not a value chosen fresh for this file.
--
-- ---------------------------------------------------------------------------
-- THIS ONE GETS A REAL BEHAVIORAL CHECK — 0025 AND 0026 DID NOT
-- ---------------------------------------------------------------------------
-- 0025 and 0026 were revokes only. They removed privileges and asserted no new
-- behavior, which is why both were exempted from a `qa-NNNN` script and
-- verified by the post-arc diff plus the audit's section 9 sweep.
--
-- 0027 IS NOT EXEMPT. It REPLACES three function definitions. A replacement can
-- fail in ways a revoke cannot — a body that drifted, a signature that no longer
-- matches the client call, an argument name PostgREST routes on. So this arc
-- runs a genuine host-side behavioral pass: archive an event, confirm it leaves
-- the storefront, unarchive it, confirm it returns, delete one, confirm it is
-- gone — signed in, as the owner, through the app.
--
-- THE DIRECT NUMERIC VERIFICATION IS THE ADVISOR COUNT. It currently reads
-- 0 errors / 6 warnings. After this migration it should read 0 errors /
-- 3 warnings: the two `rls_auto_enable` platform entries and the deferred
-- leaked-password protection (Pro-gated, DECIDED 2026-07-09 to enable at the
-- launch-prep upgrade). The three that disappear are the
-- `function_search_path_mutable` warnings on precisely the three functions
-- below.
--
-- THAT NUMBER HAS A HISTORY, WHICH IS WHY IT IS WRITTEN OUT HERE. SPARKED_STATE
-- recorded the advisor baseline as 0/3 from 2026-07-09 onward, and every
-- subsequent entry carried the 0/3 forward without rechecking it. It was
-- actually 0/6 from the moment 0019 shipped these three unpinned wrappers. The
-- correction landed in the 0025 arc. If the post-apply advisor reads anything
-- other than 0/3, do not adjust the expectation to match the reading — that is
-- the exact move that kept the wrong number alive for five weeks.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- The three wrappers, reproduced from 0019 PART F verbatim, with one line
-- added to each. Bodies, signatures, argument names (`event_id` — load-bearing
-- for PostgREST), return types, `language sql`, `security invoker` and the
-- absent volatility keyword (i.e. VOLATILE by default) are all unchanged.
-- ---------------------------------------------------------------------------
create or replace function public.delete_event(event_id uuid)
returns void
language sql
security invoker
set search_path = public, app
as $$
  select app.delete_event(event_id);
$$;

create or replace function public.archive_event(event_id uuid)
returns void
language sql
security invoker
set search_path = public, app
as $$
  select app.archive_event(event_id);
$$;

create or replace function public.unarchive_event(event_id uuid)
returns void
language sql
security invoker
set search_path = public, app
as $$
  select app.unarchive_event(event_id);
$$;


-- ---------------------------------------------------------------------------
-- RELOAD THE POSTGREST SCHEMA CACHE.
--
-- PostgREST caches function signatures, and three functions were just replaced.
-- The signatures are unchanged, so no route should move — which is precisely
-- why the reload is here rather than assumed unnecessary: the post-arc audit
-- reads the CATALOG while the behavioral pass reads the API, and the two must
-- not be allowed to describe different pictures at the same moment. Same
-- reasoning as 0026.
-- ---------------------------------------------------------------------------
notify pgrst, 'reload schema';

-- ============================================================================
-- 0033 — app.is_event_member: the two cross-table policies stop naming a
-- column the caller cannot read. Its own arc.
--
-- WHAT THIS DOES: creates ONE function and alters TWO policies. Nothing else.
--     app.is_event_member(p_event_id uuid, p_roles text[]) returns boolean
--     alter policy event_vendors_select_public    on public.event_vendors
--     alter policy event_categories_select_public on public.event_categories
-- No table, column, grant on a table, or existing function is touched.
-- `app.is_member` is NOT modified.
--
-- ---------------------------------------------------------------------------
-- THE DEFECT, ON RECORD — docs/STACK_FACTS.md entries 1 and 8; the tracker's
-- "ANON CANNOT READ public.event_categories" item, amended 2026-09-21.
--
-- Both `_select_public` policies read `events.workspace_id` through a
-- cross-table subquery: `exists (select 1 from public.events e where e.id =
-- event_id and (... app.is_member(e.workspace_id, ...)))`. A subquery inside a
-- policy is the caller's own query against `events`, privilege-checked per
-- column, and 0029 revoked `workspace_id` from `anon` on 2026-08-16. Since
-- that day every anonymous read of either table has raised
-- `42501 permission denied for table events`. `event_vendors` has a live
-- consumer path — `(tabs)/event/[id].tsx:109`, the Plus tier's vendor pins and
-- site map — and it fails SILENTLY: the caller takes only `data`, so the error
-- falls through `?? []` and renders as "no vendors". Every signed-out visitor
-- has seen that for five weeks. `event_categories` has the identical shape and
-- no consumer path yet; it fails the same way the moment one exists.
--
-- Measured 2026-09-21 as `anon`: `select e.id, e.status, e.archived_at from
-- events` returns a row; `select e.workspace_id from events` raises 42501. ONE
-- column. Not a missing table grant, not RLS, not the policy's shape in
-- general — `events_select_public` reads the same column on its OWN table and
-- works, because a policy's references to columns of the table it guards are
-- not privilege-checked (STACK_FACTS entry 8). References to OTHER tables are.
--
-- ---------------------------------------------------------------------------
-- THE FIX SHAPE — and the two fixes this is NOT.
--
-- `app.is_member` is already SECURITY DEFINER. The leak is its ARGUMENT:
-- `e.workspace_id` is evaluated by the CALLER, before the definer runs. So the
-- helper below takes the EVENT id — a column every role can read — and
-- resolves `workspace_id` inside its own definer body, then delegates to
-- `app.is_member` unchanged. "Definer body, invoker argument" is the seam; the
-- fix moves the read across it.
--
-- NOT: `grant select (workspace_id) on public.events to anon`. That reverses
-- 0029's privacy ruling — the whole correlation class it closed — and
-- Postgres's own hint on the error (`GRANT SELECT ON public.events TO anon`)
-- proposes a still wider version of the same mistake.
-- NOT: moving `event_vendors` behind an RPC. That is 0028-pattern tidy-up and a
-- separate decision; this defect is in the policy, and the policy is where it
-- is fixed.
--
-- ---------------------------------------------------------------------------
-- ALTER, NOT DROP + CREATE. A policy cannot be `create or replace`d, and a drop
-- would leave the table unprotected between statements and show as remove +
-- add in the diff. `alter policy ... using (...)` replaces the qual in place.
--
-- EXACTLY ONE EXPRESSION CHANGES IN EACH POLICY:
--     app.is_member(e.workspace_id, array['owner', 'editor', 'viewer'])
--  -> app.is_event_member(e.id,     array['owner', 'editor', 'viewer'])
-- EVERY OTHER TOKEN OF BOTH PREDICATES IS REPRODUCED VERBATIM from the
-- migration that last created each — 0019 (vendors) and 0030 PART C
-- (categories). The two public branches DIFFER — categories carries
-- `deleted_at`, `app.curbside_expired` and the attendee-history branch;
-- vendors carries none of them, by 0022's and 0030's rulings — and they are
-- not unified, tidied or aligned here. This arc fixes a privilege bug and
-- changes no visibility semantics. There is no shared whole-predicate helper
-- BECAUSE the predicates differ; the helper is the one call they share.
--
-- ---------------------------------------------------------------------------
-- GRANT SURFACE — ONE NEW FUNCTION, TWO GRANTS, NO PUBLIC. Named with its
-- consumers, per the standing grant check.
--
--   * app.is_event_member(uuid, text[]) is NEW. Postgres mints EXECUTE to
--     PUBLIC implicitly on CREATE FUNCTION, so it is REVOKED from public first,
--     then GRANTED to anon and authenticated. The revoke is not boilerplate:
--     `app.is_member` itself still carries PUBLIC:EXECUTE as a tracked
--     pre-launch item, and this arc must not add a second instance of the
--     thing that item exists to remove.
--     CONSUMED BY: both altered policies. An RLS policy expression calling a
--     function requires the CALLER to hold EXECUTE on it (0001's `is_member`,
--     0022's `has_attendance`, 0030's `curbside_expired` — same rule). anon
--     is REQUIRED, not tolerated: the storefront browses signed out, and the
--     member branch is evaluated for anon too (it returns false; it must not
--     raise).
--   * Policies carry no ACL; ALTER POLICY is not a grant event.
--   * NOTHING ELSE. No existing grant added or removed.
--
-- ESCALATION SURFACE, STATED — a definer called from a policy is one. This
-- function returns a boolean, takes an event id, and discloses exactly one
-- bit: whether the CALLER (auth.uid()) is a member of that event's workspace
-- in one of the named roles. A member already knows that; a non-member learns
-- `false`, which is what they would learn from any read that returned nothing.
-- No row data crosses the boundary; `workspace_id` is resolved and consumed
-- inside the body and never returned.
--
-- EXPECTED POST-ARC DELTA against 2026-09-17-post-drop-3arg.md (the pre-arc
-- baseline — no migration ran between): Section 4 gains ONE row,
-- `app.is_event_member`, definer=true, `search_path=public, app`,
-- execute_grants `postgres, anon, authenticated` and NO PUBLIC; Section 8
-- shows TWO policies with a changed qual/md5 and no policy added or removed;
-- Sections 1, 2, 3, 5, 6, 7 identical. Anything else is a finding.
--
-- ---------------------------------------------------------------------------
-- THE SIX SIBLINGS — RECORDED, NOT CHANGED, AND ONE REVOKE FROM THE SAME
-- FAILURE. `event_categories_{insert,update,delete}_members` and
-- `event_vendors_{insert,update,delete}_members` read `e.workspace_id` the
-- same way, for `authenticated`. They are NOT broken today because
-- `authenticated` retains SELECT on that column (0029 revoked it from anon
-- only). The day someone revokes `events.workspace_id` from `authenticated` —
-- which the tracker names as the anonymity arc's remaining gap — all six
-- break exactly as these two did, and every audit will read clean while they
-- do. That revoke must land AFTER those six are moved onto this helper (or a
-- sibling), and this header is the warning 0029 did not have.
--
-- ENDS WITH NO `notify pgrst`: no signature, argument name or return type
-- reachable from PostgREST changed. Policies and a new app-schema function are
-- not in PostgREST's schema cache.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- PART A — app.is_event_member. The event id in, the membership answer out;
-- the workspace id never leaves the body.
--
-- STABLE (reads tables, no side effects; matches app.is_member). SECURITY
-- DEFINER: the read of `events.workspace_id` runs as the owner, which is the
-- whole point. search_path pinned per 0027 — `public, app` because it calls
-- `app.is_member` and reads `public.events`, both schema-qualified anyway.
-- ---------------------------------------------------------------------------
create or replace function app.is_event_member(p_event_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, app
as $$
  select app.is_member(e.workspace_id, p_roles)
  from public.events e
  where e.id = p_event_id;
$$;

-- The implicit PUBLIC EXECUTE that CREATE FUNCTION mints, removed. Then the
-- two roles the policies run as. See GRANT SURFACE in the header.
revoke all on function app.is_event_member(uuid, text[]) from public;
grant execute on function app.is_event_member(uuid, text[]) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- PART B — event_vendors_select_public. Predicate from 0019, one call changed.
-- ---------------------------------------------------------------------------
alter policy event_vendors_select_public on public.event_vendors
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and (
          (e.status in ('published', 'cancelled') and e.archived_at is null)
          or app.is_event_member(e.id, array['owner', 'editor', 'viewer'])
        )
    )
  );

-- ---------------------------------------------------------------------------
-- PART C — event_categories_select_public. Predicate from 0030 PART C, one
-- call changed. Branch comments carried over so the three branches stay
-- greppable as the three branches.
-- ---------------------------------------------------------------------------
alter policy event_categories_select_public on public.event_categories
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and (
          -- 1. Member.
          (
            e.deleted_at is null
            and app.is_event_member(e.id, array['owner', 'editor', 'viewer'])
          )
          -- 2. Storefront.
          or (
            e.deleted_at is null
            and e.archived_at is null
            and e.status in ('published', 'cancelled')
            and not app.curbside_expired(e.tier_id, e.starts_at, e.ends_at)
          )
          -- 3. Attendee history.
          or (
            e.status in ('published', 'cancelled')
            and coalesce(e.ends_at, e.starts_at + interval '3 hours') < now()
            and not app.curbside_expired(e.tier_id, e.starts_at, e.ends_at)
            and app.has_attendance(e.id)
          )
        )
    )
  );

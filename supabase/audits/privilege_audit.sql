-- =============================================================================
-- privilege_audit.sql — Sparked per-arc privilege audit
-- Location: supabase/audits/privilege_audit.sql
-- Run in: Supabase Dashboard -> SQL Editor, in a NEW tab (tab-hygiene rule:
--         never reuse a tab that may still hold a seed or destructive script).
-- Read-only. Every statement below is a SELECT against system catalogs.
-- First run: 2026-08-05, after migration 0024 (Organizer Profile arc).
-- =============================================================================
--
-- WHY THIS FILE EXISTS
-- Four privilege incidents in this build traced to one root cause: grants were
-- written at table creation and never re-audited as features changed. All four
-- were found incidentally. This file is layer 2 of three:
--   1. standing per-prompt grant check in CLAUDE.md
--   2. this per-arc audit  <-- you are here
--   3. pre-launch full security audit (final gate)
--
-- SCOPE: this audits the GRANT SURFACE — who can touch what. It deliberately
-- does NOT audit RLS policy LOGIC (whether a policy's USING clause is correct).
-- That is the pre-launch gate's job. Section 8 dumps policies for exposure
-- context only.
--
-- -----------------------------------------------------------------------------
-- SCOPING BUG, 2026-08-05 — READ BEFORE EDITING ANY QUERY BELOW
-- -----------------------------------------------------------------------------
-- The first version of this audit scoped the function query to
-- `nspname = 'public'` and concluded the database had NO SECURITY DEFINER
-- functions. That conclusion was wrong and would have inverted the entire
-- remediation plan.
--
-- Sparked uses an `app`-definer / `public`-invoker convention (migration 0012):
-- the privilege boundary lives in the `app` schema, and `public` holds thin
-- invoker wrappers. Auditing `public` alone audits the half of the system that
-- carries no privilege at all.
--
-- RULE: every query in this file sweeps ALL non-system schemas by EXCLUDING a
-- known system list — never by naming an inclusion list. A new schema must show
-- up in this audit by default, not by someone remembering to add it. If you add
-- a schema to the exclusion list, write down why.
--
-- The same reasoning applies to roles: exclude `postgres` and `service_role`
-- (they are privileged by design), include everything else, so a newly created
-- role appears without anyone updating this file.
-- -----------------------------------------------------------------------------
--
-- -----------------------------------------------------------------------------
-- WHAT THIS FILE DOES NOT COVER — FOUNDER-OWNED CHECKS
-- -----------------------------------------------------------------------------
-- This audit sees only what is inside the database. Three things sit outside it
-- and are checked by Jas directly, not by any query here and not by an agent:
--
--   1. Vercel environment variables — confirm SUPABASE_SERVICE_ROLE_KEY is not
--      present in any client-exposed variable (anything NEXT_PUBLIC_*, EXPO_
--      PUBLIC_*, VITE_*, or otherwise bundled). Vercel Dashboard -> Project ->
--      Settings -> Environment Variables.
--   2. Supabase API key rotation — Dashboard -> Settings -> API. Rotate on any
--      suspected exposure and before production cutover.
--   3. The "Automatically expose new tables and functions" toggle — Dashboard ->
--      Settings -> API. Must be OFF in the production project (see section 5:
--      it is the source of the default-privilege residue).
--
-- Why this matters more than anything below: the service_role key bypasses RLS
-- entirely (section 6 confirms bypasses_rls = true). If it is reachable from a
-- client, every grant, policy and definer boundary in this file is decoration.
-- Never paste key material into a chat, a prompt, or this repo.
-- -----------------------------------------------------------------------------
--
-- HOW TO READ RESULTS
-- Results are FACTS, not findings. A finding is a fact that disagrees with
-- documented intent (SPARKED_STATE.md migration log). Known accepted risks are
-- listed at the bottom of this file — check there before raising anything.
--
-- The SQL Editor connects as `postgres`, so auth.uid() is NULL. No query here
-- depends on it. Behavioral verification (section 9) does — run those with a
-- real session, not here.
-- =============================================================================


-- =============================================================================
-- 1. TABLE- AND COLUMN-LEVEL GRANTS TO CLIENT ROLES
-- -----------------------------------------------------------------------------
-- Deliberately reads pg_class.relacl and pg_attribute.attacl rather than
-- information_schema.column_privileges: information_schema reports a column
-- privilege whether it was granted at COLUMN or TABLE level and cannot tell
-- them apart. That distinction is the point of this audit — two of the four
-- incidents were table-level grants where a column grant was intended.
--
-- FINDINGS TO LOOK FOR:
--   * object_type='table' with INSERT/UPDATE/DELETE for a client role
--     -> no column gating; RLS restricts the row, nothing restricts the column
--   * grantee='PUBLIC' -> cascades to anon AND authenticated
--   * any anon grant on a column carrying identity or internal attribution
-- =============================================================================
select
  n.nspname as schema,
  c.relname as object_name,
  case c.relkind
    when 'r' then 'table' when 'p' then 'partitioned_table'
    when 'v' then 'view'  when 'm' then 'matview'
    when 'S' then 'sequence' when 'f' then 'foreign_table'
  end as object_type,
  '(table-level)' as column_name,
  case when acl.grantee = 0 then 'PUBLIC' else pg_get_userbyid(acl.grantee) end as grantee,
  acl.privilege_type
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
cross join lateral aclexplode(c.relacl) as acl
where n.nspname not in ('pg_catalog','information_schema','extensions','graphql',
                        'graphql_public','storage','auth','realtime','vault',
                        'supabase_functions','pgbouncer','cron','net')
  and n.nspname !~ '^pg_'
  and c.relkind in ('r','p','v','m','S','f')
  and (case when acl.grantee = 0 then 'PUBLIC' else pg_get_userbyid(acl.grantee) end)
      not in ('postgres','service_role','supabase_admin','supabase_auth_admin',
              'supabase_storage_admin','dashboard_user','authenticator')

union all

select
  n.nspname, c.relname, 'column', a.attname,
  case when acl.grantee = 0 then 'PUBLIC' else pg_get_userbyid(acl.grantee) end,
  acl.privilege_type
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
cross join lateral aclexplode(a.attacl) as acl
where n.nspname not in ('pg_catalog','information_schema','extensions','graphql',
                        'graphql_public','storage','auth','realtime','vault',
                        'supabase_functions','pgbouncer','cron','net')
  and n.nspname !~ '^pg_'
  and (case when acl.grantee = 0 then 'PUBLIC' else pg_get_userbyid(acl.grantee) end)
      not in ('postgres','service_role','supabase_admin','supabase_auth_admin',
              'supabase_storage_admin','dashboard_user','authenticator')

order by 1, 2, 3, 4, 5;
-- NOTE: this returns 200+ rows and the SQL Editor truncates around 100 on copy.
-- Export as markdown/CSV rather than copying the rendered grid, or the tail is
-- silently lost. The 2026-08-05 run lost `workspaces` entirely to this.


-- =============================================================================
-- 2. RLS ENABLED / FORCED / POLICY COUNT
-- -----------------------------------------------------------------------------
-- FINDINGS:
--   * rls_enabled=false on any table appearing in section 1 -> grant with no gate
--   * rls_enabled=true with policy_count=0 -> deny-all; either dead or broken
-- NOT a finding: rls_forced=false. FORCE only affects the table OWNER
-- (postgres); client roles never connect as the owner.
-- =============================================================================
select
  n.nspname as schema,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced,
  (select count(*) from pg_policy p where p.polrelid = c.oid) as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname not in ('pg_catalog','information_schema','extensions','graphql',
                        'graphql_public','storage','auth','realtime','vault',
                        'supabase_functions','pgbouncer','cron','net')
  and n.nspname !~ '^pg_'
  and c.relkind in ('r','p')
order by c.relrowsecurity, n.nspname, c.relname;


-- =============================================================================
-- 3. VIEWS AND MATVIEWS
-- -----------------------------------------------------------------------------
-- A view without security_invoker=true executes with its OWNER's rights and
-- bypasses the underlying tables' RLS entirely. It is the widest single hole
-- available in Postgres and it is invisible in a grant listing.
-- Matviews support NEITHER security_invoker NOR RLS — any matview with a client
-- grant in section 1 is a finding by definition.
--
-- 2026-08-05: zero rows. Sparked has no views. Keep this query anyway — the
-- first view someone adds is exactly when this needs to already be here.
-- =============================================================================
select
  n.nspname as schema,
  c.relname as view_name,
  case c.relkind when 'v' then 'view' when 'm' then 'matview' end as kind,
  pg_get_userbyid(c.relowner) as owner,
  coalesce(array_to_string(c.reloptions, ', '), '(none)') as reloptions
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname not in ('pg_catalog','information_schema','extensions','graphql',
                        'graphql_public','storage','auth','realtime','vault',
                        'supabase_functions','pgbouncer','cron','net')
  and n.nspname !~ '^pg_'
  and c.relkind in ('v','m')
order by 1, 2;


-- =============================================================================
-- 4. FUNCTIONS — SECURITY MODE, search_path PIN, EXECUTE GRANTS
-- -----------------------------------------------------------------------------
-- THE MOST IMPORTANT QUERY IN THIS FILE. See the scoping-bug note at the top:
-- it MUST sweep all non-system schemas. Sparked's definer bodies live in `app`.
--
-- FINDINGS:
--   * security_definer=true AND config='(NONE)' -> escalation primitive.
--     A definer runs as postgres; unpinned search_path lets resolution be
--     influenced. Top severity, always.
--   * security_definer=false AND config='(NONE)' -> convention break. Lower
--     severity (PostgREST controls search_path) but it means a function shipped
--     without the house pattern, which is what this audit exists to catch.
--   * execute_grants containing PUBLIC -> anon can call it. Sometimes CORRECT
--     and load-bearing (see accepted list below); confirm against intent.
--   * 'PUBLIC (default - no explicit grants)' and 'PUBLIC:EXECUTE, ...' mean
--     the SAME THING for PUBLIC: Postgres grants EXECUTE to PUBLIC by default,
--     and granting to a named role materialises the ACL without removing it.
--     Explicit grants do NOT imply the default was revoked.
-- =============================================================================
select
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as args,
  p.prosecdef as security_definer,
  pg_get_userbyid(p.proowner) as owner,
  coalesce(array_to_string(p.proconfig, ', '), '(NONE - INHERITS CALLER)') as config,
  case
    when p.proacl is null then 'PUBLIC (default - no explicit grants)'
    else (select string_agg(
            (case when acl.grantee = 0 then 'PUBLIC' else pg_get_userbyid(acl.grantee) end)
            || ':' || acl.privilege_type, ', ')
          from aclexplode(p.proacl) as acl)
  end as execute_grants
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname not in ('pg_catalog','information_schema','extensions','graphql',
                        'graphql_public','storage','auth','realtime','vault',
                        'supabase_functions','pgbouncer','cron','net')
  and n.nspname !~ '^pg_'
order by n.nspname, p.prosecdef desc, p.proname;


-- =============================================================================
-- 5. DEFAULT PRIVILEGES
-- -----------------------------------------------------------------------------
-- The mechanism behind Supabase's "Automatically expose new tables and
-- functions" toggle. Rows here are EXPECTED; the finding is WHAT they grant.
-- Anything here explains grants in section 1 that no migration created — those
-- are auto-exposure residue and recur on EVERY new object until fixed HERE.
-- Fixing them per-table is treating symptoms.
--
-- REMINDER: RLS does not apply to TRUNCATE. A TRUNCATE privilege that ever
-- becomes reachable wipes the table regardless of policy — including
-- curbside_quota_ledger, which is the immutable fraud-prevention record.
-- =============================================================================
select
  pg_get_userbyid(d.defaclrole) as granting_role,
  coalesce(n.nspname, '(all schemas)') as schema,
  case d.defaclobjtype
    when 'r' then 'tables' when 'S' then 'sequences'
    when 'f' then 'functions' when 'T' then 'types' when 'n' then 'schemas'
  end as object_type,
  case when acl.grantee = 0 then 'PUBLIC' else pg_get_userbyid(acl.grantee) end as grantee,
  acl.privilege_type
from pg_default_acl d
left join pg_namespace n on n.oid = d.defaclnamespace
cross join lateral aclexplode(d.defaclacl) as acl
order by 1, 2, 3, 4;


-- =============================================================================
-- 6. ROLE INHERITANCE AND RLS BYPASS
-- -----------------------------------------------------------------------------
-- PASS: anon and authenticated -> member_of '(none)', bypasses_rls false.
-- NOT a finding: authenticator is a member of all three (that is how PostgREST
-- switches roles), and service_role bypasses RLS by design.
-- If anon or authenticated inherits ANYTHING, every other section is moot and
-- this is the only finding that matters.
-- =============================================================================
select
  r.rolname as role,
  coalesce(string_agg(m.rolname, ', ' order by m.rolname), '(none)') as member_of,
  r.rolbypassrls as bypasses_rls,
  r.rolsuper as is_superuser
from pg_roles r
left join pg_auth_members am on am.member = r.oid
left join pg_roles m on m.oid = am.roleid
where r.rolname in ('anon','authenticated','service_role','authenticator')
group by r.rolname, r.rolbypassrls, r.rolsuper
order by 1;


-- =============================================================================
-- 7. SCHEMA-LEVEL PRIVILEGES
-- -----------------------------------------------------------------------------
-- PASS: USAGE only. A CREATE grant to anon, authenticated or PUBLIC on `public`
-- or `app` promotes the section-5 TRIGGER/TRUNCATE residue from latent to live,
-- because the role could then create objects to attach them to.
-- =============================================================================
select
  n.nspname as schema,
  case when acl.grantee = 0 then 'PUBLIC' else pg_get_userbyid(acl.grantee) end as grantee,
  acl.privilege_type
from pg_namespace n
cross join lateral aclexplode(n.nspacl) as acl
where (case when acl.grantee = 0 then 'PUBLIC' else pg_get_userbyid(acl.grantee) end)
      in ('anon','authenticated','PUBLIC')
order by 1, 2, 3;


-- =============================================================================
-- 8. RLS POLICY DUMP — EXPOSURE CONTEXT ONLY
-- -----------------------------------------------------------------------------
-- NOT a policy-logic audit (that is the pre-launch gate). Read this only to
-- answer: given the grants in section 1, what can a client actually REACH?
-- A grant is only live if a policy admits the row; a policy is only live if a
-- grant admits the column. Both halves are needed to judge either.
--
-- Read the full USING expression, not the grid's truncated preview — click the
-- cell to expand. The 2026-08-05 run nearly misread events_select_public
-- because the OR branches were cut off mid-expression.
-- =============================================================================
select
  n.nspname as schema,
  c.relname as table_name,
  p.polname as policy_name,
  case p.polcmd when 'r' then 'SELECT' when 'a' then 'INSERT'
    when 'w' then 'UPDATE' when 'd' then 'DELETE' when '*' then 'ALL' end as command,
  coalesce((select string_agg(case when r = 0 then 'PUBLIC' else pg_get_userbyid(r) end, ', ')
            from unnest(p.polroles) as r), 'PUBLIC') as roles,
  pg_get_expr(p.polqual, p.polrelid) as using_expr,
  pg_get_expr(p.polwithcheck, p.polrelid) as with_check_expr
from pg_policy p
join pg_class c on c.oid = p.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname not in ('pg_catalog','information_schema','extensions','graphql',
                        'graphql_public','storage','auth','realtime','vault',
                        'supabase_functions','pgbouncer','cron','net')
  and n.nspname !~ '^pg_'
order by n.nspname, c.relname, p.polname;


-- =============================================================================
-- 9. BEHAVIORAL VERIFICATION — NOT RUNNABLE HERE
-- -----------------------------------------------------------------------------
-- The catalog cannot tell you whether a revoke broke the app. The 0020 -> 0021
-- outage is the standing lesson: an RLS POLICY expression is evaluated
-- internally and needs no caller column privilege, but a SECURITY INVOKER
-- function body is the caller's own query and every column it touches is
-- privilege-checked — INCLUDING columns that appear only in a WHERE clause.
-- A revoke can therefore be catalog-clean and still 42501 the storefront.
--
-- After ANY revoke, verify signed-out first (it fails first and loudest):
--   1. localhost:8081 in a private/incognito window (no session)
--      -> Explore feed loads with events
--      -> open one event -> detail renders
--      -> open an organizer profile from a paid event
--   2. Signed in as a host: Workspace stats, publish, archive, unarchive,
--      delete, and edit public profile
--   3. A Curbside post with "Post without my name" ON still renders
--      "Local host" and exposes no workspace link
--
-- Every revoke line in a remediation migration must name the surface that
-- breaks if it is wrong. A revoke with no named consumer surface is unreviewed.
-- =============================================================================


-- =============================================================================
-- ACCEPTED / DELIBERATE — check here before raising a finding
-- Last reconciled: 2026-08-05, post-0024
-- =============================================================================
-- * app.is_member and app.has_attendance are EXECUTE-able by anon. LOAD-BEARING,
--   not drift: the events_select_public policy carries no TO clause, so an anon
--   caller without EXECUTE reproduces the 0021 outage. Do not "tighten" these.
--
-- * public.event_detail and public.events_within_radius are EXECUTE-able by
--   anon. Required for anonymous browse (Architecture Decision 2).
--
-- * anon holds SELECT on events.archived_at and events.deleted_at (0021).
--   Leaks nothing: RLS restricts anon to rows where both are NULL. The grant
--   exists because the invoker function bodies filter on them.
--
-- * events.status is client-writable, so a client can set status='published'
--   directly on a paid tier without passing publish_paid_event. DELIBERATE and
--   documented — the RPC is the app's publish path, not the DB's. Tracked to
--   the payments batch. Re-confirm each audit that it is still a conscious hold.
--
-- * rls_forced=false everywhere. Correct; see section 2.
--
-- * public.rls_auto_enable is a Supabase platform function and one of the three
--   accepted advisor warnings (with the second rls_auto_enable entry and the
--   deferred leaked-password protection). Baseline is 0 errors / 3 warnings.
--
-- NO LONGER ACCEPTED as of 2026-08-05 — was accepted, now scheduled:
-- * anon SELECT on events.workspace_id. Previously logged in SPARKED_STATE.md
--   as "the workspace_id -> workspaces join is still API-visible; true
--   column-level privacy is later hardening." Re-opened because it does not
--   meet the stated intent for Curbside anonymity: a poster who selects "Post
--   without my name" is anonymous in the UI and attributed over the REST API.
--   Closing it requires moving events_within_radius and event_detail onto the
--   app-definer / public-invoker convention BEFORE the revoke — reversed, it is
--   the 0020 outage exactly.
-- =============================================================================

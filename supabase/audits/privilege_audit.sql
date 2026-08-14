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
-- THIS FILE'S OWN DEFECT HISTORY — READ BEFORE SIMPLIFYING ANY QUERY BELOW
-- -----------------------------------------------------------------------------
-- Three defects in this audit have been caught by RUNNING it, never by reading
-- it. Every one of them produced a result that looked clean and complete:
--
--   1. SCOPING (2026-08-05, first run). The function query was scoped to
--      nspname = 'public' and reported that the database had NO SECURITY
--      DEFINER functions — missing every definer body in the `app` schema,
--      which is where this project's entire privilege boundary lives. It would
--      have inverted the remediation plan. Detail, and the RULE it produced,
--      are in the block immediately below.
--
--   2. SILENT TRUNCATION (2026-08-05, and three more times on 2026-08-10).
--      The SQL Editor caps a result at 100 rows in EVERY export format. The
--      2026-08-05 run lost `workspaces` from section 1 entirely. The
--      2026-08-10 pre-grant-hardening run truncated section 1 three separate
--      times before anyone noticed, and section 5 once. A capped export is a
--      well-formed table with no error, no warning and no marker.
--
--   3. NON-TOTAL ORDERING (2026-08-10). Sections 1 and 5 each ordered by fewer
--      columns than they selected, so tied rows came back in arbitrary order.
--      Paging over an arbitrary order silently skips and duplicates rows: the
--      first paged re-export of section 1 returned 200 rows containing two
--      duplicates, against a true 215.
--
-- WHAT THIS HISTORY IS FOR. Each defect made the audit report LESS than the
-- truth while looking like a complete, passing run — the exact failure mode
-- this audit exists to catch elsewhere. The verbosity below IS the fix. A
-- future reader who finds these queries over-specified — the long exclusion
-- lists, the ORDER BY that names every selected column, the paging
-- instructions, the count(*) companions — is looking at three recorded
-- incidents, not at ceremony. Simplify none of them without first reproducing
-- the run that proves the simpler form returns the same rows.
-- -----------------------------------------------------------------------------
--
-- -----------------------------------------------------------------------------
-- EVERY RUN OF SECTIONS 1 AND 5 IS A PAGED RUN — PRE-ARC AND POST-ARC ALIKE
-- -----------------------------------------------------------------------------
-- Sections 1 and 5 exceed the 100-row cap and MUST be paged and concatenated
-- per the instructions in each section. This is not optional on a post-arc run,
-- and a post-arc run is where skipping it does the real damage: that export is
-- DIFFED against the pre-arc baseline, and a diff cannot tell a truncated page
-- from a removed grant. One uncorrected post-arc run of section 1 returns 100
-- rows against a 215-row baseline, and the diff reads the 115 absent rows as
-- 115 privileges the arc revoked — a false green that also buries any real
-- delta inside the noise. The baseline file in supabase/audits/baselines/
-- records, in its own header, the page count and row total each of these two
-- sections required. Match them.
-- -----------------------------------------------------------------------------
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

-- 1A. ROW COUNT — RUN THIS FIRST AND WRITE THE NUMBER DOWN.
-- The target the pages must sum to. Returns one row, so it can never truncate.
--
-- This wraps 1B's FROM/WHERE and nothing else. A row count depends only on
-- FROM/WHERE, and UNION ALL does not de-duplicate, so `select 1` counts exactly
-- the rows 1B projects. EDIT BOTH TOGETHER: a WHERE clause changed in 1B and
-- not here turns the completeness check into a lie that reads as a failure.
select count(*) as expected_rows from (
  select 1
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
  select 1
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
) t;


-- 1B. THE GRANT LISTING ITSELF — PAGED. See the run instructions below it.
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

order by 1, 2, 3, 4, 5, 6
limit 100 offset 0;
-- -----------------------------------------------------------------------------
-- SECTION 1 IS PAGED — RUN IT MORE THAN ONCE.   (215 rows on 2026-08-10)
-- -----------------------------------------------------------------------------
-- THE CAP: the SQL Editor returns at most 100 rows in EVERY export format —
-- Markdown, CSV and JSON alike. It is NOT a display limit you can escape by
-- exporting instead of copying the grid, which is what the note that used to
-- sit here claimed. Exporting truncates too.
--
-- HOW TO RUN THIS SECTION:
--   1. Run 1A. Write the number down. That is the target.
--   2. Run 1B as written (`offset 0`) and save the result.
--   3. Re-run it with `offset 100`, then `offset 200`, then `offset 300`,
--      raising the offset by exactly 100 each time. Save every page.
--   4. TERMINATING CONDITION: stop after the first page that returns FEWER
--      THAN 100 rows. That page is the last one. A page returning EXACTLY 100
--      rows is NEVER the last page — run the next offset even when you are
--      certain the table is exhausted, and accept an empty final page as the
--      answer. 215 rows is three pages: 100, 100, 15.
--   5. Concatenate the pages IN OFFSET ORDER into ONE block under ONE header:
--      no per-page headers, no separators, no repeated column row.
--   6. COMPLETENESS IS ARITHMETIC, NOT JUDGMENT. The concatenated row count
--      must EQUAL 1A's number. If it does not, the run is void. Do not
--      reconcile by eye and do not patch the gap — re-page the whole section.
--
-- WHY THE ORDER BY NAMES ALL SIX SELECTED COLUMNS, AND WHY THAT IS THE SAFETY
-- PROPERTY: LIMIT/OFFSET has no memory between pages. Each page re-runs the
-- query and slices the result. Where the sort leaves rows tied, the engine may
-- order that tied group differently on each run, and a row can cross a page
-- boundary in either direction — appearing in both pages, or in neither. That
-- is exactly what `order by 1,2,3,4,5` did on 2026-08-10, and the result still
-- exported as a clean table. Six columns leave no DISTINGUISHABLE ties: rows
-- equal in all six are identical in the output, so whichever side of a boundary
-- they fall on cannot change the concatenated block.
-- -----------------------------------------------------------------------------


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
order by n.nspname, p.prosecdef desc, p.proname,
         pg_get_function_identity_arguments(p.oid);
-- -----------------------------------------------------------------------------
-- THE FOURTH SORT KEY IS A TIEBREAKER FOR A PAGING RUN THIS SECTION DOES NOT
-- DO YET. Section 4 returned 37 rows on 2026-08-10, comfortably under the
-- 100-row cap, so it exports in one piece and its ties are harmless today.
--
-- It is here anyway. Overloads share proname, so `p.proname` alone leaves them
-- tied, and schema + name + identity arguments is what actually identifies a
-- function. Every new RPC adds roughly two rows — the public invoker wrapper
-- and its `app` definer body — so this section crosses 100 within an arc or
-- two. The run that first needs paging is the run where a missing tiebreaker
-- costs rows, and it costs them silently. Adding the key now is free; adding it
-- later requires noticing first, which is precisely what defects 2 and 3 in the
-- header prove nobody does.
--
-- WHEN THIS SECTION DOES CROSS 100: page it exactly as sections 1 and 5 are
-- paged, and give it a count(*) companion in the same edit. Do not page it
-- without the count.
-- -----------------------------------------------------------------------------


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

-- 5A. ROW COUNT — RUN THIS FIRST AND WRITE THE NUMBER DOWN.
-- Same contract as 1A: wraps 5B's FROM and nothing else, returns one row.
-- Section 5 has no WHERE clause; that is not an omission, it is the point —
-- every default-privilege entry in the database is in scope. EDIT WITH 5B.
select count(*) as expected_rows
from pg_default_acl d
left join pg_namespace n on n.oid = d.defaclnamespace
cross join lateral aclexplode(d.defaclacl) as acl;


-- 5B. THE DEFAULT-PRIVILEGE LISTING ITSELF — PAGED.
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
order by 1, 2, 3, 4, 5
limit 100 offset 0;
-- -----------------------------------------------------------------------------
-- SECTION 5 IS PAGED — RUN IT MORE THAN ONCE.   (276 rows on 2026-08-10)
-- -----------------------------------------------------------------------------
-- Identical procedure to section 1: run 5A for the target, then 5B at
-- `offset 0`, `offset 100`, `offset 200`, ... raising by exactly 100.
--
-- TERMINATING CONDITION: stop after the first page returning FEWER THAN 100
-- rows; a page of exactly 100 is never the last. 276 rows is three pages:
-- 100, 100, 76. Concatenate in offset order under one header, and the total
-- must EQUAL 5A. A short section 5 is the easiest miss in this file, because
-- default privileges are residue nobody has a mental model of — there is no
-- "wait, where did `workspaces` go?" instinct to catch it the way there was in
-- section 1. The count is the only thing that catches it.
--
-- The fifth ORDER BY column is privilege_type, and it is not decoration: this
-- section is mostly ties. One granting_role/schema/object_type/grantee group
-- routinely carries seven or more privilege rows, so almost every row here sat
-- inside a tied group under the old four-column sort.
-- -----------------------------------------------------------------------------


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

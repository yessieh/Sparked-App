-- ============================================================================
-- BEHAVIORAL SUITE — app.is_event_member and the two cross-table policies
-- (migration 0033).
--
-- WHERE TO RUN: Supabase Dashboard → SQL Editor, on the DEV project
-- (`Sparked-App`). Never against prod. The editor runs as `postgres`; every
-- behavioural case below switches role explicitly inside the transaction,
-- because RLS does not apply to the table owner and a check run as postgres
-- proves nothing.
--
-- HOW TO RUN: two numbered sections, one at a time, top to bottom; paste each
-- result grid back. Section 1 is READ-ONLY. Section 2 is wrapped in
-- BEGIN … ROLLBACK and creates its own throwaway workspace, events, vendors
-- and category rows — **nothing it does persists.** Every row of both grids
-- should read pass = true.
--
-- ---------------------------------------------------------------------------
-- WHAT THIS SUITE IS, AND WHY IT IS SHAPED DIFFERENTLY FROM THE ONES BEFORE IT.
--
-- It is the first suite written against CLAUDE.md's "Catalog-verified is not
-- behaviour-verified": `anon` held SELECT on `event_vendors` in eleven
-- baselines, the policy was a permissive PUBLIC SELECT, every audit was clean,
-- and anonymous users could not read the table. So this suite tests PER ROLE
-- AND PER POLICY BRANCH, not per table:
--
--   anon, public branch     — published Plus event → ROWS. The defect inverted.
--   anon, member branch     — a DRAFT event, where the public branch is false
--                             and the member branch MUST be evaluated for
--                             anon: 0 rows and, crucially, NO ERROR. An error
--                             here is the original bug. (Short-circuit: on a
--                             published event the OR never reaches the member
--                             branch, so the published case cannot prove this.)
--   stranger (authenticated, no membership)
--                           — public branch yes; member branch false, no error.
--   member (authenticated host)
--                           — sees the DRAFT's rows, which only the member
--                             branch admits. This is the case that proves the
--                             definer helper still resolves the caller and
--                             delegates to app.is_member — rather than that the
--                             member branch was simply bypassed. It also cannot
--                             pass on a NULL auth.uid().
--   control                 — the draft stays INVISIBLE to anon and to the
--                             stranger. Without this the suite passes if the
--                             fix accidentally made everything world-readable.
--
-- Every case is run for BOTH tables.
--
-- ---------------------------------------------------------------------------
-- HOW THE AUTHENTICATED CASES GET AN IDENTITY, AND HOW A REGRESSION IS LOUD.
--
-- `auth.uid()` is Supabase-provided (not defined in this repo) and reads the
-- `sub` claim of `request.jwt.claims`. Every prior suite drives it with
-- `set_config('request.jwt.claims', '{"sub": "<uuid>", "role": "authenticated"}', true)`
-- followed by `set local role authenticated`, and three recorded runs passed
-- member-branch cases that a NULL uid would have failed (qa-0019 27/27,
-- qa-0028-0029, qa-0030 45/45). Corroborated by those runs, not proven from a
-- session — so step 2a below asserts `auth.uid()` equals the fixture user
-- directly, BEFORE any member case, and the member-sees-draft cases are
-- constructed so a NULL uid fails them rather than passing them. If 2a fails,
-- every "member" row after it is meaningless and says so by failing too.
--
-- IDENTITY DRIFT: the helper restores the prior claim after every call
-- (qa-0019's 2026-08-02 fix); no case runs as the wrong person.
-- ============================================================================


-- ############################################################################
-- SECTION 1 — Privilege and catalog state. READ-ONLY. Run this first.
--
-- EXPECTED: every row pass = true. 1e is the assertion a behavioural test
-- cannot make (PUBLIC is a pseudo-role; has_function_privilege cannot be asked
-- about it), so the catalog is read directly: an aclitem with an EMPTY grantee
-- is PUBLIC and renders as `=X/owner`.
-- ############################################################################
select * from (values
    ('1a. app.is_event_member(uuid, text[]) exists',
     'true',
     (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'app' and p.proname = 'is_event_member'
         and pg_get_function_identity_arguments(p.oid) = 'p_event_id uuid, p_roles text[]')::text,
     (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'app' and p.proname = 'is_event_member'
         and pg_get_function_identity_arguments(p.oid) = 'p_event_id uuid, p_roles text[]') = 1),

    ('1b. it is SECURITY DEFINER, stable, search_path=public, app',
     'true | s | search_path=public, app',
     (select p.prosecdef::text || ' | ' || p.provolatile || ' | ' || coalesce(array_to_string(p.proconfig, ', '), '(NONE)')
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'app' and p.proname = 'is_event_member'),
     (select p.prosecdef and p.provolatile = 's' and array_to_string(p.proconfig, ', ') = 'search_path=public, app'
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'app' and p.proname = 'is_event_member')),

    ('1c. anon can execute app.is_event_member',
     'true',
     has_function_privilege('anon', 'app.is_event_member(uuid, text[])', 'execute')::text,
     has_function_privilege('anon', 'app.is_event_member(uuid, text[])', 'execute') = true),

    ('1d. authenticated can execute app.is_event_member',
     'true',
     has_function_privilege('authenticated', 'app.is_event_member(uuid, text[])', 'execute')::text,
     has_function_privilege('authenticated', 'app.is_event_member(uuid, text[])', 'execute') = true),

    ('1e. TARGET: PUBLIC does NOT execute app.is_event_member (no =X/ aclitem)',
     'false',
     (select coalesce(bool_or(a.item::text like '=%'), false)
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        cross join lateral unnest(coalesce(p.proacl, '{}'::aclitem[])) as a(item)
       where n.nspname = 'app' and p.proname = 'is_event_member')::text,
     (select coalesce(bool_or(a.item::text like '=%'), false)
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        cross join lateral unnest(coalesce(p.proacl, '{}'::aclitem[])) as a(item)
       where n.nspname = 'app' and p.proname = 'is_event_member') = false),

    ('1f. app.is_member is UNCHANGED (still 0001''s ws uuid, text[] signature)',
     'true',
     (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'app' and p.proname = 'is_member'
         and pg_get_function_identity_arguments(p.oid) = 'ws uuid, roles text[]')::text,
     (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'app' and p.proname = 'is_member'
         and pg_get_function_identity_arguments(p.oid) = 'ws uuid, roles text[]') = 1),

    ('1g. event_vendors_select_public calls is_event_member(e.id, …) and no longer names workspace_id',
     'true',
     (select (q like '%is_event_member(e.id%')::text || ' / no workspace_id: ' || (q not like '%workspace_id%')::text
        from (select pg_get_expr(pol.polqual, pol.polrelid) q from pg_policy pol
               where pol.polname = 'event_vendors_select_public') s),
     (select q like '%is_event_member(e.id%' and q not like '%workspace_id%'
        from (select pg_get_expr(pol.polqual, pol.polrelid) q from pg_policy pol
               where pol.polname = 'event_vendors_select_public') s)),

    ('1h. event_categories_select_public calls is_event_member(e.id, …) and no longer names workspace_id',
     'true',
     (select (q like '%is_event_member(e.id%')::text || ' / no workspace_id: ' || (q not like '%workspace_id%')::text
        from (select pg_get_expr(pol.polqual, pol.polrelid) q from pg_policy pol
               where pol.polname = 'event_categories_select_public') s),
     (select q like '%is_event_member(e.id%' and q not like '%workspace_id%'
        from (select pg_get_expr(pol.polqual, pol.polrelid) q from pg_policy pol
               where pol.polname = 'event_categories_select_public') s)),

    -- Verbatim-reproduction guards: the parts that were NOT supposed to change.
    ('1i. vendors public branch intact: status in (published,cancelled) AND archived_at is null',
     'true',
     (select (q like '%archived_at IS NULL%' and q like '%''published''%' and q like '%''cancelled''%'
              and q not like '%deleted_at%' and q not like '%curbside_expired%')::text
        from (select pg_get_expr(pol.polqual, pol.polrelid) q from pg_policy pol
               where pol.polname = 'event_vendors_select_public') s),
     (select q like '%archived_at IS NULL%' and q like '%''published''%' and q like '%''cancelled''%'
              and q not like '%deleted_at%' and q not like '%curbside_expired%'
        from (select pg_get_expr(pol.polqual, pol.polrelid) q from pg_policy pol
               where pol.polname = 'event_vendors_select_public') s)),

    ('1j. categories three branches intact: deleted_at, curbside_expired ×2, has_attendance, 3-hour grace',
     'true',
     (select (q like '%deleted_at IS NULL%' and (length(q) - length(replace(q, 'curbside_expired', ''))) / length('curbside_expired') = 2
              and q like '%has_attendance(e.id)%' and q like '%03:00:00%')::text
        from (select pg_get_expr(pol.polqual, pol.polrelid) q from pg_policy pol
               where pol.polname = 'event_categories_select_public') s),
     (select q like '%deleted_at IS NULL%' and (length(q) - length(replace(q, 'curbside_expired', ''))) / length('curbside_expired') = 2
              and q like '%has_attendance(e.id)%' and q like '%03:00:00%'
        from (select pg_get_expr(pol.polqual, pol.polrelid) q from pg_policy pol
               where pol.polname = 'event_categories_select_public') s)),

    ('1k. the six _members siblings are UNTOUCHED (all six still name e.workspace_id)',
     '6',
     (select count(*) from pg_policy pol
       where pol.polname in ('event_vendors_insert_members','event_vendors_update_members','event_vendors_delete_members',
                             'event_categories_insert_members','event_categories_update_members','event_categories_delete_members')
         and coalesce(pg_get_expr(pol.polqual, pol.polrelid), '') || coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '')
             like '%workspace_id%')::text,
     (select count(*) from pg_policy pol
       where pol.polname in ('event_vendors_insert_members','event_vendors_update_members','event_vendors_delete_members',
                             'event_categories_insert_members','event_categories_update_members','event_categories_delete_members')
         and coalesce(pg_get_expr(pol.polqual, pol.polrelid), '') || coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '')
             like '%workspace_id%') = 6),

    ('1l. anon still does NOT hold events.workspace_id (0029 intact — the fix was not a re-grant)',
     'false',
     has_column_privilege('anon', 'public.events', 'workspace_id', 'select')::text,
     has_column_privilege('anon', 'public.events', 'workspace_id', 'select') = false)
) as t(step, expected, actual, pass);


-- ############################################################################
-- SECTION 2 — The behavioural suite. BEGIN … ROLLBACK; nothing persists.
--
-- Fixtures: one workspace owned by the HOST, one PUBLISHED Plus event and one
-- DRAFT Plus event, each with two vendor rows and two category rows. Two
-- vantage points with an account — the HOST (owner membership, seeded by
-- 0001's trigger) and a STRANGER (no membership) — plus `anon`.
--
-- Roles are switched for real with SET LOCAL ROLE. Every read goes through a
-- helper that returns EITHER a row count OR the SQLSTATE it raised, so a
-- 42501 shows up in the grid as `ERR 42501` against an expected count — the
-- original bug is a visible FAIL, never a silent 0.
-- ############################################################################
begin;

create temp table qa_results (
  seq       int generated always as identity,
  step      text,
  expected  text,
  actual    text,
  pass      boolean
) on commit drop;

create function pg_temp.rec(p_step text, p_expected text, p_actual text, p_pass boolean)
returns void language plpgsql as $fn$
begin
  insert into qa_results (step, expected, actual, pass)
  values (p_step, p_expected, p_actual, p_pass);
  raise notice '[%] % | expected: % | actual: %',
    case when p_pass then 'PASS' else 'FAIL' end, p_step, p_expected, p_actual;
end;
$fn$;

-- Count rows of `p_table` for `p_event` as `p_role`, optionally as user
-- `p_user` (NULL for anon). Returns 'n=<count>' or 'ERR <sqlstate>'. Restores
-- role and the prior claim on every path.
create function pg_temp.read_as(p_role text, p_user uuid, p_table text, p_event uuid)
returns text language plpgsql as $fn$
declare
  n     integer;
  prior text := current_setting('request.jwt.claims', true);
  out   text;
begin
  if p_user is not null then
    perform set_config('request.jwt.claims',
      json_build_object('sub', p_user::text, 'role', p_role)::text, true);
  else
    perform set_config('request.jwt.claims', '', true);
  end if;
  execute format('set local role %I', p_role);
  begin
    execute format('select count(*) from public.%I where event_id = $1', p_table)
      into n using p_event;
    out := 'n=' || n::text;
  exception when others then
    out := 'ERR ' || sqlstate;
  end;
  execute 'reset role';
  perform set_config('request.jwt.claims', coalesce(prior, ''), true);
  return out;
exception when others then
  execute 'reset role';
  perform set_config('request.jwt.claims', coalesce(prior, ''), true);
  raise;
end;
$fn$;

-- What auth.uid() resolves to as `authenticated` with a claim set. Returns the
-- uuid as text, or 'NULL', or 'ERR <sqlstate>'.
create function pg_temp.uid_as(p_user uuid)
returns text language plpgsql as $fn$
declare
  u     uuid;
  prior text := current_setting('request.jwt.claims', true);
  out   text;
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_user::text, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  begin
    select auth.uid() into u;
    out := coalesce(u::text, 'NULL');
  exception when others then
    out := 'ERR ' || sqlstate;
  end;
  execute 'reset role';
  perform set_config('request.jwt.claims', coalesce(prior, ''), true);
  return out;
exception when others then
  execute 'reset role';
  perform set_config('request.jwt.claims', coalesce(prior, ''), true);
  raise;
end;
$fn$;

do $$
declare
  u_host      uuid;
  u_stranger  uuid;
  ws          uuid;
  ev_pub      uuid;
  ev_draft    uuid;
  n           integer;
  r           text;
  qa_addr     constant text := '18680 S Nogales Hwy';
begin
  ---------------------------------------------------------------------------
  -- Fixtures.
  ---------------------------------------------------------------------------
  select id into u_host     from public.profiles order by created_at limit 1;
  select id into u_stranger from public.profiles where id <> u_host order by created_at limit 1;
  if u_host is null or u_stranger is null then
    perform pg_temp.rec('00. fixtures', 'at least two profiles exist', 'fewer than two — cannot run', false);
    return;
  end if;

  insert into public.workspaces (name, created_by)
  values ('QA 0033 workspace', u_host) returning id into ws;

  select count(*) into n from public.memberships
   where workspace_id = ws and user_id = u_host and role = 'owner';
  perform pg_temp.rec('00a. fixture: owner membership auto-seeded (0001 trigger)', '1', n::text, n = 1);

  select count(*) into n from public.memberships where workspace_id = ws and user_id = u_stranger;
  perform pg_temp.rec('00b. fixture: stranger holds NO membership', '0', n::text, n = 0);

  -- Two Plus events: one published (public branch true), one draft (public
  -- branch false, so only the member branch can admit its child rows).
  -- publish_fee_cents left NULL — guard_publish_fee exempts postgres anyway.
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address)
  values (ws, 'QA 0033 published plus', 'plus', 'published', now() + interval '1 day', now() + interval '1 day 3 hours', qa_addr)
  returning id into ev_pub;
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address)
  values (ws, 'QA 0033 draft plus', 'plus', 'draft', now() + interval '2 days', now() + interval '2 days 3 hours', qa_addr)
  returning id into ev_draft;

  insert into public.event_vendors (event_id, name, vendor_type, pin_x, pin_y, sort_order) values
    (ev_pub,   'QA vendor A', 'food',  0.25, 0.25, 1),
    (ev_pub,   'QA vendor B', 'craft', 0.75, 0.75, 2),
    (ev_draft, 'QA vendor C', 'food',  0.25, 0.25, 1),
    (ev_draft, 'QA vendor D', 'craft', 0.75, 0.75, 2);
  -- 'music'/'art', never 'curbside' — app.check_event_category reserves that.
  insert into public.event_categories (event_id, category_id) values
    (ev_pub, 'music'), (ev_pub, 'art'), (ev_draft, 'music'), (ev_draft, 'art');

  -- Ground truth as postgres (RLS bypassed): 2 rows per event per table.
  select count(*) into n from public.event_vendors where event_id in (ev_pub, ev_draft);
  perform pg_temp.rec('00c. fixture: 4 vendor rows exist (postgres, no RLS)', '4', n::text, n = 4);
  select count(*) into n from public.event_categories where event_id in (ev_pub, ev_draft);
  perform pg_temp.rec('00d. fixture: 4 category rows exist (postgres, no RLS)', '4', n::text, n = 4);

  ---------------------------------------------------------------------------
  -- 2a. THE IDENTITY CHECK. If this fails, every member case below is void.
  ---------------------------------------------------------------------------
  r := pg_temp.uid_as(u_host);
  perform pg_temp.rec('2a. auth.uid() as authenticated with sub=<host> resolves to the host',
                      u_host::text, r, r = u_host::text);

  ---------------------------------------------------------------------------
  -- 2b–2c. ANON, PUBLIC BRANCH — the defect inverted. This is the arc.
  ---------------------------------------------------------------------------
  r := pg_temp.read_as('anon', null, 'event_vendors', ev_pub);
  perform pg_temp.rec('2b. anon reads a PUBLISHED Plus event''s vendors (was ERR 42501 since 0029)', 'n=2', r, r = 'n=2');
  r := pg_temp.read_as('anon', null, 'event_categories', ev_pub);
  perform pg_temp.rec('2c. anon reads a PUBLISHED event''s categories (was ERR 42501 since 0029)', 'n=2', r, r = 'n=2');

  ---------------------------------------------------------------------------
  -- 2d–2e. ANON, MEMBER BRANCH — evaluated (the draft's public branch is
  -- false, so the OR reaches it), returns false, and RAISES NOTHING. `ERR
  -- 42501` here is the original bug. This is also the CONTROL: a draft's rows
  -- stay invisible to anon, so the fix did not make everything world-readable.
  ---------------------------------------------------------------------------
  r := pg_temp.read_as('anon', null, 'event_vendors', ev_draft);
  perform pg_temp.rec('2d. anon on a DRAFT: member branch evaluated, false, NO ERROR — and 0 rows (control)', 'n=0', r, r = 'n=0');
  r := pg_temp.read_as('anon', null, 'event_categories', ev_draft);
  perform pg_temp.rec('2e. anon on a DRAFT (categories): member branch false, NO ERROR — 0 rows (control)', 'n=0', r, r = 'n=0');

  ---------------------------------------------------------------------------
  -- 2f–2i. AUTHENTICATED STRANGER — public branch yes, member branch false.
  ---------------------------------------------------------------------------
  r := pg_temp.read_as('authenticated', u_stranger, 'event_vendors', ev_pub);
  perform pg_temp.rec('2f. stranger reads the PUBLISHED event''s vendors (public branch)', 'n=2', r, r = 'n=2');
  r := pg_temp.read_as('authenticated', u_stranger, 'event_categories', ev_pub);
  perform pg_temp.rec('2g. stranger reads the PUBLISHED event''s categories (public branch)', 'n=2', r, r = 'n=2');
  r := pg_temp.read_as('authenticated', u_stranger, 'event_vendors', ev_draft);
  perform pg_temp.rec('2h. stranger on the DRAFT: member branch false, no error, 0 rows (control)', 'n=0', r, r = 'n=0');
  r := pg_temp.read_as('authenticated', u_stranger, 'event_categories', ev_draft);
  perform pg_temp.rec('2i. stranger on the DRAFT (categories): member branch false, no error, 0 rows (control)', 'n=0', r, r = 'n=0');

  ---------------------------------------------------------------------------
  -- 2j–2k. AUTHENTICATED MEMBER sees the DRAFT — only the member branch admits
  -- it. Proves is_event_member resolved the caller and delegated to
  -- app.is_member rather than the branch being bypassed. Cannot pass on a
  -- NULL auth.uid(): is_member would find no membership row.
  ---------------------------------------------------------------------------
  r := pg_temp.read_as('authenticated', u_host, 'event_vendors', ev_draft);
  perform pg_temp.rec('2j. HOST reads the DRAFT''s vendors (member branch, through the definer helper)', 'n=2', r, r = 'n=2');
  r := pg_temp.read_as('authenticated', u_host, 'event_categories', ev_draft);
  perform pg_temp.rec('2k. HOST reads the DRAFT''s categories (member branch, through the definer helper)', 'n=2', r, r = 'n=2');

  ---------------------------------------------------------------------------
  -- 2l. The helper's answer directly, both ways, as authenticated.
  ---------------------------------------------------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', u_host::text, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select app.is_event_member(ev_draft, array['owner','editor','viewer'])::text into r;
  execute 'reset role';
  perform pg_temp.rec('2l. app.is_event_member(draft) as HOST', 'true', r, r = 'true');
  perform set_config('request.jwt.claims', json_build_object('sub', u_stranger::text, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select app.is_event_member(ev_draft, array['owner','editor','viewer'])::text into r;
  execute 'reset role';
  perform pg_temp.rec('2m. app.is_event_member(draft) as STRANGER', 'false', r, r = 'false');
  perform set_config('request.jwt.claims', '', true);
  execute 'set local role anon';
  select coalesce(app.is_event_member(ev_draft, array['owner','editor','viewer'])::text, 'NULL') into r;
  execute 'reset role';
  perform pg_temp.rec('2n. app.is_event_member(draft) as anon — false, and no 42501', 'false', r, r = 'false');
end $$;

select seq, step, expected, actual, pass from qa_results order by seq;

rollback;

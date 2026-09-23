-- ============================================================================
-- BEHAVIORAL SUITE — public.category_preferences (migration 0034).
--
-- WHERE TO RUN: Supabase Dashboard → SQL Editor, on the DEV project
-- (`Sparked-App`). Never against prod. The editor runs as `postgres`; every
-- behavioural case below switches role explicitly inside the transaction,
-- because RLS does not apply to the table owner and a check run as postgres
-- proves nothing.
--
-- HOW TO RUN: two numbered sections, one at a time, top to bottom; paste each
-- result grid back. Section 1 is READ-ONLY. Section 2 is wrapped in
-- BEGIN … ROLLBACK and writes only preference rows plus ONE profile delete
-- (the cascade case) — **nothing it does persists.** Every row of both grids
-- should read pass = true, and each grid ends with a TOTAL row.
--
--   Section 1: 12 cases + TOTAL  → "12 cases, 12 PASS"
--   Section 2: 30 cases + TOTAL  → "30 cases, 30 PASS"
--   Suite:     42 cases, 42 expected PASS.
--
-- ---------------------------------------------------------------------------
-- WHAT THIS SUITE PROVES, AND AT WHICH LAYER.
--
-- CLAUDE.md, "Catalog-verified is not behaviour-verified": Section 1 proves the
-- grants and policies EXIST with the right shape; Section 2 proves each role
-- actually gets the outcome it should, per role AND per policy branch. The two
-- deny layers are told apart in the grid, because both raise SQLSTATE 42501:
--
--   `ERR 42501 priv` — "permission denied for table …": the PRIVILEGE layer.
--                      No grant (anon), or a column not granted (UPDATE of
--                      user_id / category_id). RLS is never reached.
--   `ERR 42501 rls`  — "new row violates row-level security policy …": the
--                      RLS layer. The grant allowed the statement; a policy's
--                      WITH CHECK refused the row.
--   `n=0` / `rows=0` — RLS USING filtered the rows out silently. Not an error,
--                      by design: a stranger's UPDATE / DELETE / SELECT of
--                      someone else's rows touches nothing.
--
-- Roles: `anon`; OWNER A (authenticated, the rows' owner); STRANGER B
-- (authenticated, someone else). A stranger and an owner are both
-- `authenticated` and get different RLS results — that is the per-branch half.
--
-- PROBES COUNT A COLUMN, NEVER `count(*)` (docs/STACK_FACTS.md entry 2: the
-- 2026-09-18 `count(*)` anomaly is unexplained, and `count(<column>)` is
-- correct either way). This table has no `id`, so the probe column is
-- `category_id`.
--
-- ---------------------------------------------------------------------------
-- HOW THE AUTHENTICATED CASES GET AN IDENTITY — qa-0033's mechanism, unchanged.
--
-- `auth.uid()` is Supabase-provided (not defined in this repo) and reads the
-- `sub` claim of `request.jwt.claims`. Prior suites drive it with
-- `set_config('request.jwt.claims', '{"sub": "<uuid>", "role": "authenticated"}', true)`
-- followed by `set local role authenticated` (qa-0033 12/12, 18/18). Steps 2a
-- and 2b assert `auth.uid()` resolves to each user directly, BEFORE any
-- authenticated case; if either fails, every case after it is void.
-- The helpers restore the prior claim and role on every path.
--
-- FIXTURE REQUIREMENT: OWNER A must be a profile that has created NO workspace.
-- `workspaces.created_by` references profiles with no ON DELETE action
-- (0001:88), so the cascade case (7b) could not delete a profile that owns a
-- workspace. 00a records whether such a profile exists.
-- ============================================================================


-- ############################################################################
-- SECTION 1 — Catalog state. READ-ONLY. Run this first.
--
-- EXPECTED: every row pass = true, then "12 cases, 12 PASS".
-- ############################################################################
with t(step, expected, actual, pass) as (values
    ('1a. table exists and is owned by postgres',
     'postgres',
     (select pg_get_userbyid(c.relowner) from pg_class c where c.oid = 'public.category_preferences'::regclass),
     (select pg_get_userbyid(c.relowner) from pg_class c where c.oid = 'public.category_preferences'::regclass) = 'postgres'),

    ('1b. RLS enabled / not forced',
     'true / false',
     (select c.relrowsecurity::text || ' / ' || c.relforcerowsecurity::text
        from pg_class c where c.oid = 'public.category_preferences'::regclass),
     (select c.relrowsecurity and not c.relforcerowsecurity
        from pg_class c where c.oid = 'public.category_preferences'::regclass)),

    ('1c. exactly four policies: INSERT, DELETE, SELECT, UPDATE (polcmd a,d,r,w)',
     'adrw',
     (select string_agg(pol.polcmd::text, '' order by pol.polcmd::text) from pg_policy pol
       where pol.polrelid = 'public.category_preferences'::regclass),
     (select string_agg(pol.polcmd::text, '' order by pol.polcmd::text) from pg_policy pol
       where pol.polrelid = 'public.category_preferences'::regclass) = 'adrw'),

    ('1d. all four policies are TO authenticated only',
     '4',
     (select count(pol.polname) from pg_policy pol
       where pol.polrelid = 'public.category_preferences'::regclass
         and pol.polroles = array['authenticated'::regrole::oid])::text,
     (select count(pol.polname) from pg_policy pol
       where pol.polrelid = 'public.category_preferences'::regclass
         and pol.polroles = array['authenticated'::regrole::oid]) = 4),

    -- Own-table only (STACK_FACTS entries 1/8): every expression is exactly
    -- `(user_id = auth.uid())` — no subquery, no other table. Five expressions
    -- in total: SELECT using, INSERT check, UPDATE using + check, DELETE using.
    ('1e. every policy expression is exactly (user_id = auth.uid()); 5 expressions',
     'exact=4 / exprs=5',
     (select 'exact=' || count(pol.polname) filter (where
               coalesce(pg_get_expr(pol.polqual, pol.polrelid), '(user_id = auth.uid())') = '(user_id = auth.uid())'
           and coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '(user_id = auth.uid())') = '(user_id = auth.uid())')
             || ' / exprs=' || (count(pol.polqual) + count(pol.polwithcheck))
        from pg_policy pol where pol.polrelid = 'public.category_preferences'::regclass),
     (select count(pol.polname) filter (where
               coalesce(pg_get_expr(pol.polqual, pol.polrelid), '(user_id = auth.uid())') = '(user_id = auth.uid())'
           and coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '(user_id = auth.uid())') = '(user_id = auth.uid())') = 4
         and count(pol.polqual) + count(pol.polwithcheck) = 5
        from pg_policy pol where pol.polrelid = 'public.category_preferences'::regclass)),

    -- has_any_column_privilege is true for a table-level OR any column-level
    -- grant, so false here rules out both.
    ('1f. anon holds NOTHING: select/insert/update (any column), delete/truncate/references/trigger',
     'f f f f f f f',
     (select concat_ws(' ',
        has_any_column_privilege('anon', 'public.category_preferences', 'select'),
        has_any_column_privilege('anon', 'public.category_preferences', 'insert'),
        has_any_column_privilege('anon', 'public.category_preferences', 'update'),
        has_table_privilege('anon', 'public.category_preferences', 'delete'),
        has_table_privilege('anon', 'public.category_preferences', 'truncate'),
        has_table_privilege('anon', 'public.category_preferences', 'references'),
        has_table_privilege('anon', 'public.category_preferences', 'trigger'))),
     not (has_any_column_privilege('anon', 'public.category_preferences', 'select')
       or has_any_column_privilege('anon', 'public.category_preferences', 'insert')
       or has_any_column_privilege('anon', 'public.category_preferences', 'update')
       or has_table_privilege('anon', 'public.category_preferences', 'delete')
       or has_table_privilege('anon', 'public.category_preferences', 'truncate')
       or has_table_privilege('anon', 'public.category_preferences', 'references')
       or has_table_privilege('anon', 'public.category_preferences', 'trigger'))),

    ('1g. authenticated holds table-level SELECT, INSERT, DELETE',
     't t t',
     concat_ws(' ',
        has_table_privilege('authenticated', 'public.category_preferences', 'select'),
        has_table_privilege('authenticated', 'public.category_preferences', 'insert'),
        has_table_privilege('authenticated', 'public.category_preferences', 'delete')),
     has_table_privilege('authenticated', 'public.category_preferences', 'select')
       and has_table_privilege('authenticated', 'public.category_preferences', 'insert')
       and has_table_privilege('authenticated', 'public.category_preferences', 'delete')),

    ('1h. authenticated does NOT hold table-level UPDATE',
     'false',
     has_table_privilege('authenticated', 'public.category_preferences', 'update')::text,
     has_table_privilege('authenticated', 'public.category_preferences', 'update') = false),

    ('1i. authenticated UPDATE by column: stance yes, user_id no, category_id no',
     't f f',
     concat_ws(' ',
        has_column_privilege('authenticated', 'public.category_preferences', 'stance', 'update'),
        has_column_privilege('authenticated', 'public.category_preferences', 'user_id', 'update'),
        has_column_privilege('authenticated', 'public.category_preferences', 'category_id', 'update')),
     has_column_privilege('authenticated', 'public.category_preferences', 'stance', 'update')
       and not has_column_privilege('authenticated', 'public.category_preferences', 'user_id', 'update')
       and not has_column_privilege('authenticated', 'public.category_preferences', 'category_id', 'update')),

    -- The catalog half of the migration's claim 1: no default privilege
    -- reached this table. 0026 stripped these four from every EXISTING table;
    -- a new table would regain them only through a default, and there is none.
    ('1j. authenticated holds NO truncate / references / trigger (no default privileges applied)',
     'f f f',
     concat_ws(' ',
        has_table_privilege('authenticated', 'public.category_preferences', 'truncate'),
        has_table_privilege('authenticated', 'public.category_preferences', 'references'),
        has_table_privilege('authenticated', 'public.category_preferences', 'trigger')),
     not (has_table_privilege('authenticated', 'public.category_preferences', 'truncate')
       or has_table_privilege('authenticated', 'public.category_preferences', 'references')
       or has_table_privilege('authenticated', 'public.category_preferences', 'trigger'))),

    -- PUBLIC is a pseudo-role has_*_privilege cannot be asked about, so the ACLs
    -- are read directly: an aclitem with an EMPTY grantee is PUBLIC (`=X/owner`).
    ('1k. PUBLIC holds nothing on the table or any column (no =X/ aclitem)',
     'false',
     (select (coalesce(bool_or(a.item::text like '=%'), false))::text
        from (select unnest(coalesce(c.relacl, '{}'::aclitem[])) as item from pg_class c
               where c.oid = 'public.category_preferences'::regclass
              union all
              select unnest(coalesce(at.attacl, '{}'::aclitem[])) from pg_attribute at
               where at.attrelid = 'public.category_preferences'::regclass and at.attnum > 0) a),
     (select coalesce(bool_or(a.item::text like '=%'), false) = false
        from (select unnest(coalesce(c.relacl, '{}'::aclitem[])) as item from pg_class c
               where c.oid = 'public.category_preferences'::regclass
              union all
              select unnest(coalesce(at.attacl, '{}'::aclitem[])) from pg_attribute at
               where at.attrelid = 'public.category_preferences'::regclass and at.attnum > 0) a)),

    ('1l. both foreign keys ON DELETE CASCADE / one CHECK constraint',
     'fk_cascade=2 / check=1',
     (select 'fk_cascade=' || count(con.conname) filter (where con.contype = 'f' and con.confdeltype = 'c')
             || ' / check=' || count(con.conname) filter (where con.contype = 'c')
        from pg_constraint con where con.conrelid = 'public.category_preferences'::regclass),
     (select count(con.conname) filter (where con.contype = 'f' and con.confdeltype = 'c') = 2
         and count(con.conname) filter (where con.contype = 'c') = 1
        from pg_constraint con where con.conrelid = 'public.category_preferences'::regclass))
)
select step, expected, actual, pass from t
union all
select '1z. TOTAL — section 1',
       '12 cases, 12 PASS',
       count(step) || ' cases, ' || count(step) filter (where pass) || ' PASS',
       count(step) = 12 and bool_and(pass)
  from t;


-- ############################################################################
-- SECTION 2 — The behavioural suite. BEGIN … ROLLBACK; nothing persists.
--
-- Every statement runs through pg_temp.run_as, which returns EITHER a count
-- (`n=` for a probe, `rows=` for a write) OR the SQLSTATE it raised, tagged
-- with the deny layer for 42501. An unexpected success is a visible FAIL,
-- never a silent pass.
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

-- Run `p_sql` as `p_role`, optionally as user `p_user` (NULL for anon).
--   p_probe = true  → `p_sql` is a single-value count query; returns 'n=<value>'.
--   p_probe = false → `p_sql` is a write; returns 'rows=<rows affected>'.
-- On error returns 'ERR <sqlstate>', and for 42501 appends the layer:
-- ' priv' (permission denied — no grant) or ' rls' (row-level security
-- WITH CHECK). The failed statement is rolled back to its own subtransaction.
-- Restores role and the prior claim on every path.
create function pg_temp.run_as(p_role text, p_user uuid, p_sql text, p_probe boolean)
returns text language plpgsql as $fn$
declare
  n     bigint;
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
    if p_probe then
      execute p_sql into n;
      out := 'n=' || n::text;
    else
      execute p_sql;
      get diagnostics n = row_count;
      out := 'rows=' || n::text;
    end if;
  exception when others then
    out := 'ERR ' || sqlstate ||
      case
        when sqlstate = '42501' and sqlerrm like 'permission denied%' then ' priv'
        when sqlstate = '42501' and sqlerrm like 'new row violates row-level security%' then ' rls'
        when sqlstate = '42501' then ' other: ' || sqlerrm
        else ''
      end;
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

-- What auth.uid() resolves to as `authenticated` with a claim set.
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
  u_a   uuid;   -- OWNER A
  u_b   uuid;   -- STRANGER B
  n     bigint;
  r     text;
  -- Probe: how many of A's rows the caller can see.
  q_a_count text;
begin
  ---------------------------------------------------------------------------
  -- Fixtures. A = the earliest profile that has created no workspace (the
  -- cascade case needs to delete it); B = any other profile.
  ---------------------------------------------------------------------------
  select p.id into u_a from public.profiles p
   where not exists (select 1 from public.workspaces w where w.created_by = p.id)
   order by p.created_at limit 1;
  select p.id into u_b from public.profiles p
   where p.id is distinct from u_a
   order by p.created_at limit 1;

  perform pg_temp.rec('00a. fixture: an OWNER A with no created workspace, and a STRANGER B, both exist',
                      'both found',
                      case when u_a is null then 'no profile without a workspace'
                           when u_b is null then 'fewer than two profiles'
                           else 'both found' end,
                      u_a is not null and u_b is not null);
  if u_a is null or u_b is null then
    return;
  end if;

  q_a_count := format('select count(category_id) from public.category_preferences where user_id = %L', u_a);

  -- As postgres (RLS bypassed): the table is new, so neither user has rows.
  select count(category_id) into n from public.category_preferences where user_id in (u_a, u_b);
  perform pg_temp.rec('00b. fixture: no preference rows exist for A or B (postgres, no RLS)', '0', n::text, n = 0);

  ---------------------------------------------------------------------------
  -- 2. THE IDENTITY CHECK. If either fails, every authenticated case is void.
  ---------------------------------------------------------------------------
  r := pg_temp.uid_as(u_a);
  perform pg_temp.rec('2a. auth.uid() as authenticated with sub=<A> resolves to A', u_a::text, r, r = u_a::text);
  r := pg_temp.uid_as(u_b);
  perform pg_temp.rec('2b. auth.uid() as authenticated with sub=<B> resolves to B', u_b::text, r, r = u_b::text);

  ---------------------------------------------------------------------------
  -- 3. ANON — denied at the PRIVILEGE layer on all four verbs (no grant).
  --    RLS is never reached; the policies are `to authenticated` anyway.
  ---------------------------------------------------------------------------
  r := pg_temp.run_as('anon', null, q_a_count, true);
  perform pg_temp.rec('3a. anon SELECT → privilege denied (no grant)', 'ERR 42501 priv', r, r = 'ERR 42501 priv');
  r := pg_temp.run_as('anon', null,
         format('insert into public.category_preferences (user_id, category_id, stance) values (%L, ''music'', ''into'')', u_a), false);
  perform pg_temp.rec('3b. anon INSERT → privilege denied (no grant)', 'ERR 42501 priv', r, r = 'ERR 42501 priv');
  r := pg_temp.run_as('anon', null,
         format('update public.category_preferences set stance = ''blocked'' where user_id = %L', u_a), false);
  perform pg_temp.rec('3c. anon UPDATE → privilege denied (no grant)', 'ERR 42501 priv', r, r = 'ERR 42501 priv');
  r := pg_temp.run_as('anon', null,
         format('delete from public.category_preferences where user_id = %L', u_a), false);
  perform pg_temp.rec('3d. anon DELETE → privilege denied (no grant)', 'ERR 42501 priv', r, r = 'ERR 42501 priv');

  ---------------------------------------------------------------------------
  -- 4. OWNER A — the write path into a bucket, and every constraint.
  ---------------------------------------------------------------------------
  r := pg_temp.run_as('authenticated', u_a,
         format('insert into public.category_preferences (user_id, category_id, stance) values (%L, ''music'', ''into'')', u_a), false);
  perform pg_temp.rec('4a. A INSERTs (music, into) — Undecided → I''m into', 'rows=1', r, r = 'rows=1');
  r := pg_temp.run_as('authenticated', u_a, q_a_count, true);
  perform pg_temp.rec('4b. A SELECTs own rows — sees it (select_own USING)', 'n=1', r, r = 'n=1');
  r := pg_temp.run_as('authenticated', u_a,
         format('insert into public.category_preferences (user_id, category_id, stance) values (%L, ''music'', ''blocked'')', u_a), false);
  perform pg_temp.rec('4c. A duplicate INSERT (music again) → unique violation (PK: one bucket per category)', 'ERR 23505', r, r = 'ERR 23505');
  r := pg_temp.run_as('authenticated', u_a,
         format('insert into public.category_preferences (user_id, category_id, stance) values (%L, ''art'', ''maybe'')', u_a), false);
  perform pg_temp.rec('4d. A INSERT with stance ''maybe'' → CHECK violation', 'ERR 23514', r, r = 'ERR 23514');
  r := pg_temp.run_as('authenticated', u_a,
         format('insert into public.category_preferences (user_id, category_id, stance) values (%L, ''qa-no-such-category'', ''into'')', u_a), false);
  perform pg_temp.rec('4e. A INSERT with an unknown category_id → FK violation', 'ERR 23503', r, r = 'ERR 23503');
  r := pg_temp.run_as('authenticated', u_a,
         format('update public.category_preferences set category_id = ''art'' where user_id = %L and category_id = ''music''', u_a), false);
  perform pg_temp.rec('4f. A UPDATE of category_id → privilege denied (column not granted)', 'ERR 42501 priv', r, r = 'ERR 42501 priv');
  r := pg_temp.run_as('authenticated', u_a,
         format('update public.category_preferences set user_id = %L where user_id = %L and category_id = ''music''', u_b, u_a), false);
  perform pg_temp.rec('4g. A UPDATE of user_id → privilege denied (column not granted)', 'ERR 42501 priv', r, r = 'ERR 42501 priv');

  ---------------------------------------------------------------------------
  -- 5. STRANGER B, against A's live (music, into) row — the other branch of
  --    every policy. USING filters silently (0 rows, no error); WITH CHECK
  --    refuses an insert in A's name at the RLS layer.
  ---------------------------------------------------------------------------
  r := pg_temp.run_as('authenticated', u_b, q_a_count, true);
  perform pg_temp.rec('5a. B SELECTs A''s rows → 0 (select_own USING filters)', 'n=0', r, r = 'n=0');
  r := pg_temp.run_as('authenticated', u_b,
         format('update public.category_preferences set stance = ''blocked'' where user_id = %L', u_a), false);
  perform pg_temp.rec('5b. B UPDATEs A''s row → 0 rows affected (update_own USING)', 'rows=0', r, r = 'rows=0');
  r := pg_temp.run_as('authenticated', u_b,
         format('delete from public.category_preferences where user_id = %L', u_a), false);
  perform pg_temp.rec('5c. B DELETEs A''s row → 0 rows affected (delete_own USING)', 'rows=0', r, r = 'rows=0');
  r := pg_temp.run_as('authenticated', u_b,
         format('insert into public.category_preferences (user_id, category_id, stance) values (%L, ''food'', ''into'')', u_a), false);
  perform pg_temp.rec('5d. B INSERTs with user_id = A → RLS WITH CHECK violation', 'ERR 42501 rls', r, r = 'ERR 42501 rls');

  -- CONTROL: B's attempts changed nothing. Read as postgres (RLS bypassed).
  select count(category_id)::text || ' / ' || coalesce(max(stance), 'none') into r
    from public.category_preferences where user_id = u_a;
  perform pg_temp.rec('5e. CONTROL: A''s rows after B''s attempts — still exactly (music, into) (postgres)',
                      '1 / into', r, r = '1 / into');

  -- CONTROL: B is not simply broken — B can write and read B's OWN row. Without
  -- this, 5a-5c would pass for a user who could do nothing at all.
  r := pg_temp.run_as('authenticated', u_b,
         format('insert into public.category_preferences (user_id, category_id, stance) values (%L, ''music'', ''blocked'')', u_b), false);
  perform pg_temp.rec('5f. CONTROL: B INSERTs B''s own (music, blocked)', 'rows=1', r, r = 'rows=1');
  r := pg_temp.run_as('authenticated', u_b,
         format('select count(category_id) from public.category_preferences where user_id = %L', u_b), true);
  perform pg_temp.rec('5g. CONTROL: B SELECTs B''s own rows → 1', 'n=1', r, r = 'n=1');

  ---------------------------------------------------------------------------
  -- 6. OWNER A — the rest of the write path: between buckets, then back to
  --    Undecided.
  ---------------------------------------------------------------------------
  r := pg_temp.run_as('authenticated', u_a,
         format('update public.category_preferences set stance = ''blocked'' where user_id = %L and category_id = ''music''', u_a), false);
  perform pg_temp.rec('6a. A UPDATEs stance to blocked — I''m into → Not for me (column grant + update_own)', 'rows=1', r, r = 'rows=1');
  r := pg_temp.run_as('authenticated', u_a,
         format('select count(category_id) from public.category_preferences where user_id = %L and stance = ''blocked''', u_a), true);
  perform pg_temp.rec('6b. A reads it back as blocked', 'n=1', r, r = 'n=1');
  r := pg_temp.run_as('authenticated', u_a,
         format('delete from public.category_preferences where user_id = %L and category_id = ''music''', u_a), false);
  perform pg_temp.rec('6c. A DELETEs it — Not for me → Undecided (delete_own)', 'rows=1', r, r = 'rows=1');
  r := pg_temp.run_as('authenticated', u_a, q_a_count, true);
  perform pg_temp.rec('6d. A SELECTs own rows → 0 (Undecided = no row)', 'n=0', r, r = 'n=0');

  ---------------------------------------------------------------------------
  -- 7. CASCADE — deleting A's profile removes A's preferences, and only A's.
  --    Run as postgres: this is the account-deletion path, not a client verb.
  ---------------------------------------------------------------------------
  insert into public.category_preferences (user_id, category_id, stance)
  values (u_a, 'music', 'into'), (u_a, 'food', 'blocked');
  select count(category_id) into n from public.category_preferences where user_id = u_a;
  perform pg_temp.rec('7a. setup: A holds 2 preference rows (postgres)', '2', n::text, n = 2);

  begin
    delete from public.profiles where id = u_a;
    get diagnostics n = row_count;
    r := 'rows=' || n::text;
  exception when others then
    r := 'ERR ' || sqlstate || ': ' || sqlerrm;
  end;
  perform pg_temp.rec('7b. delete A''s profile (postgres)', 'rows=1', r, r = 'rows=1');

  select count(category_id) into n from public.category_preferences where user_id = u_a;
  perform pg_temp.rec('7c. A''s preference rows after the profile delete → 0 (ON DELETE CASCADE)', '0', n::text, n = 0);
  select count(category_id) into n from public.category_preferences where user_id = u_b;
  perform pg_temp.rec('7d. CONTROL: B''s row survives A''s delete → 1', '1', n::text, n = 1);
end $$;

insert into qa_results (step, expected, actual, pass)
select '99. TOTAL — section 2',
       '30 cases, 30 PASS',
       count(seq) || ' cases, ' || count(seq) filter (where pass) || ' PASS',
       count(seq) = 30 and bool_and(pass)
  from qa_results;

select seq, step, expected, actual, pass from qa_results order by seq;

rollback;

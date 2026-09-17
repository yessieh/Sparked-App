-- ============================================================================
-- BEHAVIORAL SUITE — drop the 3-argument events_within_radius pair
-- (migration 0032).
--
-- WHERE TO RUN: Supabase dashboard → SQL Editor, on the DEV project
-- (`Sparked-App`, ref kzynvvdggooqgtnprhrm). Never against prod.
--
-- HOW TO RUN: three numbered sections, one at a time, top to bottom; paste the
-- result grids back. Sections 1 and 2 are READ-ONLY. Section 3 is wrapped in
-- BEGIN … ROLLBACK and creates its own throwaway workspace and event —
-- **nothing it does persists.** Section 4 is a terminal step, not SQL.
--
-- RUN IT AFTER 0032 IS APPLIED. Before that, Section 1 reads "2 rows remain"
-- as 4 and every 1x row fails — which is the correct pre-state, not a defect.
--
-- ---------------------------------------------------------------------------
-- WHAT THIS ARC RISKED, AND WHAT THE SUITE THEREFORE HAS TO PROVE.
--
-- 0032 is drop-only: two functions gone, nothing created, nothing granted. The
-- risks of a drop are all subtractive — it takes too much, or it takes the
-- wrong thing, or a stale cache keeps advertising what it took. So the suite
-- asks four questions and nothing else:
--   1. Are BOTH 3-argument objects gone?                          (Section 1)
--   2. Are BOTH 5-argument objects still there, with the ACL 0031 gave them
--      and NOT the PUBLIC default a re-creation would mint?       (Section 2)
--   3. Does the 5-argument path still return rows for anon AND authenticated —
--      i.e. did the drop take a dependency with it?               (Section 3)
--   4. Has PostgREST stopped routing the 3-name call?             (Section 4)
--
-- THE 3-ARGUMENT SIGNATURE IS NEVER PASSED TO has_function_privilege HERE. On
-- a missing function that call raises 42883 and takes the whole VALUES grid
-- down with it — which is exactly what happens to qa-0031's Section 1 now.
-- Absence is asserted through pg_proc counts and to_regprocedure, both of
-- which answer "not there" without raising.
--
-- ⚠️ WHY SECTION 2 ASSERTS THE ACL AS AN EXACT GRANTEE SET rather than "anon can
-- execute". A function that was silently dropped and re-created would carry
-- PUBLIC:EXECUTE by default, PUBLIC includes anon, and every behavioral test
-- would pass on the wrong basis. 2e–2h read the catalog and compare it to the
-- exact set the pre-arc baseline recorded: {anon, authenticated, postgres}.
-- ============================================================================


-- ############################################################################
-- SECTION 1 — The catalog after 0032. Read-only. Run this first.
--
-- Every row should read pass = true.
-- ############################################################################
select * from (
  values
    -- ---- THE TWO DROPPED OBJECTS: ABSENT ---------------------------------
    ('1a. TARGET: app.events_within_radius(3 args) is gone from pg_proc',
     '0',
     (select count(*)::text
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'app' and p.proname = 'events_within_radius'
         and p.pronargs = 3),
     (select count(*)
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'app' and p.proname = 'events_within_radius'
         and p.pronargs = 3) = 0),

    ('1b. TARGET: public.events_within_radius(3 args) is gone from pg_proc',
     '0',
     (select count(*)::text
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.proname = 'events_within_radius'
         and p.pronargs = 3),
     (select count(*)
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.proname = 'events_within_radius'
         and p.pronargs = 3) = 0),

    -- A second route to the same fact. to_regprocedure returns NULL for a
    -- signature that does not resolve, where a ::regprocedure cast would raise.
    ('1c. TARGET: app 3-arg signature does not resolve (to_regprocedure)',
     'null',
     coalesce(to_regprocedure('app.events_within_radius(double precision, double precision, double precision)')::text, 'null'),
     to_regprocedure('app.events_within_radius(double precision, double precision, double precision)') is null),

    ('1d. TARGET: public 3-arg signature does not resolve (to_regprocedure)',
     'null',
     coalesce(to_regprocedure('public.events_within_radius(double precision, double precision, double precision)')::text, 'null'),
     to_regprocedure('public.events_within_radius(double precision, double precision, double precision)') is null),

    -- ---- EXACTLY TWO REMAIN, AND BOTH TAKE FIVE --------------------------
    -- "2" and not ">= 2": a leftover overload with a different type spelling
    -- (numeric, float8 vs double precision) would be a third row.
    ('1e. exactly two events_within_radius functions remain across app + public',
     '2',
     (select count(*)::text
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname in ('app', 'public') and p.proname = 'events_within_radius'),
     (select count(*)
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname in ('app', 'public') and p.proname = 'events_within_radius') = 2),

    ('1f. both survivors take 5 arguments',
     '{5,5}',
     (select array_agg(p.pronargs order by n.nspname)::text
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname in ('app', 'public') and p.proname = 'events_within_radius'),
     (select bool_and(p.pronargs = 5)
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname in ('app', 'public') and p.proname = 'events_within_radius') = true)
) as t(step, expected, actual, pass);


-- ############################################################################
-- SECTION 2 — Privilege state of the survivors. Read-only.
--
-- Every row should read pass = true. 2g/2h are the ones that matter: they
-- compare the ACL to the exact grantee set the pre-arc baseline recorded.
-- ############################################################################
select * from (
  values
    -- ---- anon + authenticated STILL EXECUTE THE 5-ARG PAIR ---------------
    ('2a. anon executes app.events_within_radius(5 args)',
     'true',
     has_function_privilege('anon', 'app.events_within_radius(double precision, double precision, double precision, timestamptz, timestamptz)', 'execute')::text,
     has_function_privilege('anon', 'app.events_within_radius(double precision, double precision, double precision, timestamptz, timestamptz)', 'execute') = true),

    ('2b. anon executes public.events_within_radius(5 args)',
     'true',
     has_function_privilege('anon', 'public.events_within_radius(double precision, double precision, double precision, timestamptz, timestamptz)', 'execute')::text,
     has_function_privilege('anon', 'public.events_within_radius(double precision, double precision, double precision, timestamptz, timestamptz)', 'execute') = true),

    ('2c. authenticated executes app.events_within_radius(5 args)',
     'true',
     has_function_privilege('authenticated', 'app.events_within_radius(double precision, double precision, double precision, timestamptz, timestamptz)', 'execute')::text,
     has_function_privilege('authenticated', 'app.events_within_radius(double precision, double precision, double precision, timestamptz, timestamptz)', 'execute') = true),

    ('2d. authenticated executes public.events_within_radius(5 args)',
     'true',
     has_function_privilege('authenticated', 'public.events_within_radius(double precision, double precision, double precision, timestamptz, timestamptz)', 'execute')::text,
     has_function_privilege('authenticated', 'public.events_within_radius(double precision, double precision, double precision, timestamptz, timestamptz)', 'execute') = true),

    -- ---- NO PUBLIC ON EITHER SURVIVOR ------------------------------------
    -- An aclitem with an EMPTY grantee is PUBLIC and renders as `=X/owner`.
    -- has_function_privilege cannot be asked this (PUBLIC is a pseudo-role),
    -- so the catalog is read directly. Same expression as qa-0031 1c/1f.
    ('2e. PUBLIC does NOT execute app.events_within_radius(5 args)',
     'false',
     (select coalesce(bool_or(a.item::text like '=%'), false)
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        cross join lateral unnest(coalesce(p.proacl, '{}'::aclitem[])) as a(item)
       where n.nspname = 'app' and p.proname = 'events_within_radius')::text,
     (select coalesce(bool_or(a.item::text like '=%'), false)
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        cross join lateral unnest(coalesce(p.proacl, '{}'::aclitem[])) as a(item)
       where n.nspname = 'app' and p.proname = 'events_within_radius') = false),

    ('2f. PUBLIC does NOT execute public.events_within_radius(5 args)',
     'false',
     (select coalesce(bool_or(a.item::text like '=%'), false)
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        cross join lateral unnest(coalesce(p.proacl, '{}'::aclitem[])) as a(item)
       where n.nspname = 'public' and p.proname = 'events_within_radius')::text,
     (select coalesce(bool_or(a.item::text like '=%'), false)
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        cross join lateral unnest(coalesce(p.proacl, '{}'::aclitem[])) as a(item)
       where n.nspname = 'public' and p.proname = 'events_within_radius') = false),

    -- ---- THE EXACT GRANTEE SET, vs the pre-arc baseline ------------------
    -- Baseline Section 4 recorded postgres, anon, authenticated on each 5-arg
    -- function. "Unchanged" is asserted as set equality, not inferred from
    -- 2a–2f passing. Sorted so array order cannot produce a false fail.
    ('2g. app(5) EXECUTE grantees are exactly {anon,authenticated,postgres}',
     '{anon,authenticated,postgres}',
     (select array_agg(g order by g)::text
        from (select case when a.grantee = 0 then 'PUBLIC'
                          else pg_get_userbyid(a.grantee)::text end as g
                from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                cross join lateral aclexplode(p.proacl) as a
               where n.nspname = 'app' and p.proname = 'events_within_radius'
                 and a.privilege_type = 'EXECUTE') s),
     (select array_agg(g order by g)
        from (select case when a.grantee = 0 then 'PUBLIC'
                          else pg_get_userbyid(a.grantee)::text end as g
                from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                cross join lateral aclexplode(p.proacl) as a
               where n.nspname = 'app' and p.proname = 'events_within_radius'
                 and a.privilege_type = 'EXECUTE') s)
       = array['anon', 'authenticated', 'postgres']),

    ('2h. public(5) EXECUTE grantees are exactly {anon,authenticated,postgres}',
     '{anon,authenticated,postgres}',
     (select array_agg(g order by g)::text
        from (select case when a.grantee = 0 then 'PUBLIC'
                          else pg_get_userbyid(a.grantee)::text end as g
                from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                cross join lateral aclexplode(p.proacl) as a
               where n.nspname = 'public' and p.proname = 'events_within_radius'
                 and a.privilege_type = 'EXECUTE') s),
     (select array_agg(g order by g)
        from (select case when a.grantee = 0 then 'PUBLIC'
                          else pg_get_userbyid(a.grantee)::text end as g
                from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                cross join lateral aclexplode(p.proacl) as a
               where n.nspname = 'public' and p.proname = 'events_within_radius'
                 and a.privilege_type = 'EXECUTE') s)
       = array['anon', 'authenticated', 'postgres']),

    -- ---- UNRELATED CONTROLS, asserted because a silent change here would
    -- ---- be invisible and would belong to no arc ------------------------
    ('2i. CONTROL: anon still executes app.curbside_expired (0030)',
     'true',
     has_function_privilege('anon', 'app.curbside_expired(text, timestamptz, timestamptz)', 'execute')::text,
     has_function_privilege('anon', 'app.curbside_expired(text, timestamptz, timestamptz)', 'execute') = true),

    ('2j. CONTROL: anon still executes app.event_detail (0028)',
     'true',
     has_function_privilege('anon', 'app.event_detail(uuid, double precision, double precision)', 'execute')::text,
     has_function_privilege('anon', 'app.event_detail(uuid, double precision, double precision)', 'execute') = true),

    ('2k. CONTROL: anon still cannot read events.workspace_id (0029)',
     'false', has_column_privilege('anon', 'public.events', 'workspace_id', 'select')::text,
     has_column_privilege('anon', 'public.events', 'workspace_id', 'select') = false)
) as t(step, expected, actual, pass);


-- ############################################################################
-- SECTION 3 — The behavioral suite. BEGIN … ROLLBACK; nothing persists.
--
-- One fixture event, three days out, standard tier, at the Sahuarita
-- coordinates every other suite uses. The questions are "does the 5-argument
-- path still return it for both roles" and "does the 3-argument path now raise
-- 42883 and nothing else". Every row of the output grid should read pass = true.
--
-- The 3-argument calls in 3c/3d are issued through EXECUTE so that the failure
-- is a runtime 42883 caught by the block's handler, and cannot become a parse
-- error that aborts the whole DO before the grid is written.
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

do $$
declare
  u_host   uuid;
  ws       uuid;
  ev_fx    uuid;
  n        integer;
  w_from   constant timestamptz := now();
  w_to     constant timestamptz := now() + interval '7 days';
  qa_addr  constant text := '18680 S Nogales Hwy';
  qa_lat   constant double precision := 31.9600;
  qa_lng   constant double precision := -110.9700;
begin
  select id into u_host from public.profiles order by created_at limit 1;
  if u_host is null then
    perform pg_temp.rec('00. fixtures', 'at least one profile', 'none', false);
    return;
  end if;

  perform set_config('request.jwt.claims',
    json_build_object('sub', u_host::text, 'role', 'authenticated')::text, true);

  insert into public.workspaces (name, created_by)
  values ('QA 0032 workspace', u_host) returning id into ws;

  insert into public.events
    (workspace_id, title, tier_id, status, starts_at, ends_at, address, location)
  values
    (ws, 'QA 0032 fixture', 'standard', 'published',
     now() + interval '3 days', now() + interval '3 days 2 hours', qa_addr,
     extensions.st_setsrid(extensions.st_makepoint(qa_lng, qa_lat), 4326)::extensions.geography)
  returning id into ev_fx;

  ---------------------------------------------------------------------------
  -- 3A — anon still reaches the fixture through the 5-argument wrapper.
  -- The signed-out feed is the reason anon EXECUTE is required; if the drop
  -- took a dependency with it, this is where it shows.
  ---------------------------------------------------------------------------
  begin
    perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
    execute 'set local role anon';
    select count(*) into n
      from public.events_within_radius(qa_lat, qa_lng, 25, w_from, w_to)
     where id = ev_fx;
    execute 'reset role';
    perform pg_temp.rec('3a. anon calls the 5-arg wrapper and gets the fixture',
      '1 row', n::text || ' row(s)', n = 1);
  exception when others then
    execute 'reset role';
    perform pg_temp.rec('3a. anon calls the 5-arg wrapper and gets the fixture',
      '1 row', 'RAISED: ' || sqlstate || ' ' || sqlerrm, false);
  end;

  ---------------------------------------------------------------------------
  -- 3B — authenticated, same call, same row.
  ---------------------------------------------------------------------------
  begin
    perform set_config('request.jwt.claims',
      json_build_object('sub', u_host::text, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    select count(*) into n
      from public.events_within_radius(qa_lat, qa_lng, 25, w_from, w_to)
     where id = ev_fx;
    execute 'reset role';
    perform pg_temp.rec('3b. authenticated calls the 5-arg wrapper and gets the fixture',
      '1 row', n::text || ' row(s)', n = 1);
  exception when others then
    execute 'reset role';
    perform pg_temp.rec('3b. authenticated calls the 5-arg wrapper and gets the fixture',
      '1 row', 'RAISED: ' || sqlstate || ' ' || sqlerrm, false);
  end;

  ---------------------------------------------------------------------------
  -- 3C / 3D — the 3-argument forms RAISE 42883 (undefined_function), and
  -- nothing else. PASS is recorded only on that SQLSTATE: a 42501 would mean
  -- the object still exists and the role was refused; a success would mean
  -- the drop did not happen. Both are FAIL.
  ---------------------------------------------------------------------------
  begin
    execute 'select count(*) from public.events_within_radius($1, $2, 25)'
       into n using qa_lat, qa_lng;
    perform pg_temp.rec('3c. public 3-arg call raises 42883',
      '42883 undefined_function', 'returned ' || n::text || ' row(s) — still exists', false);
  exception
    when undefined_function then
      perform pg_temp.rec('3c. public 3-arg call raises 42883',
        '42883 undefined_function', sqlstate, true);
    when others then
      perform pg_temp.rec('3c. public 3-arg call raises 42883',
        '42883 undefined_function', 'RAISED: ' || sqlstate || ' ' || sqlerrm, false);
  end;

  begin
    execute 'select count(*) from app.events_within_radius($1, $2, 25)'
       into n using qa_lat, qa_lng;
    perform pg_temp.rec('3d. app 3-arg call raises 42883',
      '42883 undefined_function', 'returned ' || n::text || ' row(s) — still exists', false);
  exception
    when undefined_function then
      perform pg_temp.rec('3d. app 3-arg call raises 42883',
        '42883 undefined_function', sqlstate, true);
    when others then
      perform pg_temp.rec('3d. app 3-arg call raises 42883',
        '42883 undefined_function', 'RAISED: ' || sqlstate || ' ' || sqlerrm, false);
  end;

  ---------------------------------------------------------------------------
  -- 3E — the unbounded 5-argument call, which is what the dropped 3-arg
  -- definer delegated to, still returns the fixture. This is the path any
  -- future "no bound" caller takes; it must not have gone with the wrapper.
  ---------------------------------------------------------------------------
  select count(*) into n
    from public.events_within_radius(qa_lat, qa_lng, 25,
           '-infinity'::timestamptz, 'infinity'::timestamptz)
   where id = ev_fx;
  perform pg_temp.rec('3e. unbounded 5-arg call (-infinity, infinity) returns the fixture',
    '1 row', n::text || ' row(s)', n = 1);

  ---------------------------------------------------------------------------
  -- 3F — after every call above, both 5-argument objects are still in the
  -- catalog. Belt to Section 1's braces: proves nothing cascaded.
  ---------------------------------------------------------------------------
  perform pg_temp.rec('3f. both 5-arg signatures still resolve after the calls',
    'both non-null',
    format('app=%s public=%s',
      coalesce(to_regprocedure('app.events_within_radius(double precision, double precision, double precision, timestamptz, timestamptz)')::text, 'null'),
      coalesce(to_regprocedure('public.events_within_radius(double precision, double precision, double precision, timestamptz, timestamptz)')::text, 'null')),
    to_regprocedure('app.events_within_radius(double precision, double precision, double precision, timestamptz, timestamptz)') is not null
    and to_regprocedure('public.events_within_radius(double precision, double precision, double precision, timestamptz, timestamptz)') is not null);
end;
$$;

select seq, step, expected, actual, pass from qa_results order by seq;

-- Uncomment to see only what failed on a long grid:
-- select seq, step, expected, actual from qa_results where not pass order by seq;

rollback;


-- ############################################################################
-- SECTION 4 — NOT RUNNABLE HERE: PostgREST has stopped routing the 3-name call.
--
-- The catalog cannot tell you what PostgREST is advertising. It caches function
-- signatures, 0032 ends with `notify pgrst, 'reload schema'`, and the only
-- proof the reload took is an HTTP call. Run BOTH from a terminal — the second
-- is the assertion this migration exists for:
--
--   # 5-argument form — must return 200 and rows (or [] if nothing is on)
--   curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/events_within_radius" \
--     -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
--     -d '{"origin_lat":31.9576,"origin_lng":-110.9556,"radius_miles":25,
--          "window_from":"2026-09-16T00:00:00Z","window_to":"2026-09-18T00:00:00Z"}'
--
--   # 3-argument form — must return 404 with code PGRST202
--   curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/events_within_radius" \
--     -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
--     -d '{"origin_lat":31.9576,"origin_lng":-110.9556,"radius_miles":25}'
--
-- PASS: first is 200, second is 404 `{"code":"PGRST202", ...}`.
--
-- If the SECOND returns 200 with rows, the drop did not apply. If it returns a
-- 404 whose body is NOT PGRST202 but a Postgres 42883 text — "function
-- public.events_within_radius(double precision, double precision, double
-- precision) does not exist" — PostgREST's cache is STALE: it routed the call
-- and Postgres refused it. The notify has not been picked up. Re-issue
-- `notify pgrst, 'reload schema';` in the SQL Editor and try again.
-- ############################################################################

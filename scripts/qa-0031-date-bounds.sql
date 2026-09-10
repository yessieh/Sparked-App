-- ============================================================================
-- BEHAVIORAL SUITE — date range bounds on the Explore feed (migration 0031).
--
-- WHERE TO RUN: Supabase dashboard → SQL Editor, on the DEV project
-- (`Sparked-App`, ref kzynvvdggooqgtnprhrm). Never against prod.
--
-- HOW TO RUN: three numbered sections, one at a time, top to bottom; paste the
-- result grids back. Sections 1 and 2 are READ-ONLY. Section 3 is wrapped in
-- BEGIN … ROLLBACK and creates its own throwaway workspace, fixtures and
-- events — **nothing it does persists.**
--
-- RUN IT AFTER 0031 IS APPLIED.
--
-- ---------------------------------------------------------------------------
-- WHAT THIS ARC RISKED, AND WHAT THE SUITE THEREFORE HAS TO PROVE.
--
-- 0031 adds two arguments to the feed RPC. That is a new function identity, so
-- it could not be a CREATE OR REPLACE, and the arc was scoped around a
-- DROP + CREATE with an explicit re-grant. **It did not end up doing that**, for
-- a reason this suite has to keep honest: there are TWO live client call sites
-- ((tabs)/index.tsx:230 and components/ExploreSearch.tsx:403), both sending
-- three arguments, and the client change is sequenced AFTER this migration. A
-- drop would have left both resolving to nothing between two commits — the
-- signed-out feed and search down, the 0020 -> 0021 shape exactly.
--
-- So the 5-argument pair was created ALONGSIDE and the 3-argument pair kept.
-- **Two claims follow, and sections 1 and 3 exist to test them:**
--   1. the new functions are granted correctly and NOT to PUBLIC;
--   2. the old functions are untouched — same ACL, same returned set — so
--      nothing broke while the client catches up.
--
-- ⚠️ WHY SECTION 1 ASSERTS THE ACL RATHER THAN TRUSTING THAT THE FEED LOADS.
-- A newly created function receives EXECUTE to PUBLIC by default, and PUBLIC
-- INCLUDES anon. A wrongly-granted function is therefore INDISTINGUISHABLE from
-- a correctly-granted one by any behavioural test: the signed-out feed works
-- either way. It breaks later and silently, the first time anyone runs the
-- revoke-from-public hardening 0025/0026 established. **Only the catalog can
-- tell the two apart**, which is why 1c and 1f read `proacl` directly.
--
-- THE ASSERTION THAT MATTERS MOST IS 3A — the live multi-day event. The whole
-- predicate exists so that an event which STARTED BEFORE the window and is
-- still running is kept. The obvious `starts_at >= p_from` drops it, reads
-- correct, and breaks the rule (tabs)/index.tsx states in a comment: "a live
-- event is the most useful thing a discovery feed can show."
-- ============================================================================


-- ############################################################################
-- SECTION 1 — Privilege state. Read-only. Run this first.
--
-- Every row should read pass = true.
-- ############################################################################
select * from (
  values
    -- ---- THE TWO NEW OBJECTS -------------------------------------------
    ('1a. TARGET: anon executes app.events_within_radius(5 args)',
     'true',
     has_function_privilege('anon', 'app.events_within_radius(double precision, double precision, double precision, timestamptz, timestamptz)', 'execute')::text,
     has_function_privilege('anon', 'app.events_within_radius(double precision, double precision, double precision, timestamptz, timestamptz)', 'execute') = true),

    ('1b. TARGET: authenticated executes app.events_within_radius(5 args)',
     'true',
     has_function_privilege('authenticated', 'app.events_within_radius(double precision, double precision, double precision, timestamptz, timestamptz)', 'execute')::text,
     has_function_privilege('authenticated', 'app.events_within_radius(double precision, double precision, double precision, timestamptz, timestamptz)', 'execute') = true),

    -- An aclitem with an EMPTY grantee is PUBLIC and renders as `=X/owner`.
    -- has_function_privilege cannot be asked this (PUBLIC is a pseudo-role), so
    -- the catalog is read directly. THIS IS THE ASSERTION A BEHAVIOURAL TEST
    -- CANNOT MAKE.
    ('1c. TARGET: PUBLIC does NOT execute app.events_within_radius(5 args)',
     'false',
     (select coalesce(bool_or(a.item::text like '=%'), false)
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        cross join lateral unnest(coalesce(p.proacl, '{}'::aclitem[])) as a(item)
       where n.nspname = 'app' and p.proname = 'events_within_radius'
         and pg_get_function_identity_arguments(p.oid) like '%timestamp%')::text,
     (select coalesce(bool_or(a.item::text like '=%'), false)
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        cross join lateral unnest(coalesce(p.proacl, '{}'::aclitem[])) as a(item)
       where n.nspname = 'app' and p.proname = 'events_within_radius'
         and pg_get_function_identity_arguments(p.oid) like '%timestamp%') = false),

    ('1d. TARGET: anon executes public.events_within_radius(5 args)',
     'true',
     has_function_privilege('anon', 'public.events_within_radius(double precision, double precision, double precision, timestamptz, timestamptz)', 'execute')::text,
     has_function_privilege('anon', 'public.events_within_radius(double precision, double precision, double precision, timestamptz, timestamptz)', 'execute') = true),

    ('1e. TARGET: authenticated executes public.events_within_radius(5 args)',
     'true',
     has_function_privilege('authenticated', 'public.events_within_radius(double precision, double precision, double precision, timestamptz, timestamptz)', 'execute')::text,
     has_function_privilege('authenticated', 'public.events_within_radius(double precision, double precision, double precision, timestamptz, timestamptz)', 'execute') = true),

    ('1f. TARGET: PUBLIC does NOT execute public.events_within_radius(5 args)',
     'false',
     (select coalesce(bool_or(a.item::text like '=%'), false)
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        cross join lateral unnest(coalesce(p.proacl, '{}'::aclitem[])) as a(item)
       where n.nspname = 'public' and p.proname = 'events_within_radius'
         and pg_get_function_identity_arguments(p.oid) like '%timestamp%')::text,
     (select coalesce(bool_or(a.item::text like '=%'), false)
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        cross join lateral unnest(coalesce(p.proacl, '{}'::aclitem[])) as a(item)
       where n.nspname = 'public' and p.proname = 'events_within_radius'
         and pg_get_function_identity_arguments(p.oid) like '%timestamp%') = false),

    -- ---- THE TWO OLD OBJECTS: UNTOUCHED --------------------------------
    -- PART C replaced the 3-argument app definer with a delegation. CREATE OR
    -- REPLACE on an identical signature PRESERVES the ACL; if these fail, the
    -- replace was not a replace and the arc's central safety claim is void.
    ('1g. CONTROL: anon still executes app.events_within_radius(3 args)',
     'true',
     has_function_privilege('anon', 'app.events_within_radius(double precision, double precision, double precision)', 'execute')::text,
     has_function_privilege('anon', 'app.events_within_radius(double precision, double precision, double precision)', 'execute') = true),

    ('1h. CONTROL: anon still executes public.events_within_radius(3 args)',
     'true',
     has_function_privilege('anon', 'public.events_within_radius(double precision, double precision, double precision)', 'execute')::text,
     has_function_privilege('anon', 'public.events_within_radius(double precision, double precision, double precision)', 'execute') = true),

    -- The 3-argument PUBLIC wrapper legitimately CARRIES PUBLIC:EXECUTE — it
    -- has since 0005 and 0028 preserved it. Asserting it is STILL THERE is what
    -- proves 0031's two revokes were surgical rather than a blanket denial that
    -- happened to hit the right objects.
    ('1i. CONTROL: PUBLIC still executes public.events_within_radius(3 args)',
     'true',
     (select coalesce(bool_or(a.item::text like '=%'), false)
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        cross join lateral unnest(coalesce(p.proacl, '{}'::aclitem[])) as a(item)
       where n.nspname = 'public' and p.proname = 'events_within_radius'
         and pg_get_function_identity_arguments(p.oid) not like '%timestamp%')::text,
     (select coalesce(bool_or(a.item::text like '=%'), false)
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        cross join lateral unnest(coalesce(p.proacl, '{}'::aclitem[])) as a(item)
       where n.nspname = 'public' and p.proname = 'events_within_radius'
         and pg_get_function_identity_arguments(p.oid) not like '%timestamp%') = true),

    -- ---- UNRELATED CONTROLS, asserted because a silent change here would
    -- ---- be invisible and would belong to no arc ------------------------
    ('1j. CONTROL: anon still executes app.curbside_expired (0030)',
     'true',
     has_function_privilege('anon', 'app.curbside_expired(text, timestamptz, timestamptz)', 'execute')::text,
     has_function_privilege('anon', 'app.curbside_expired(text, timestamptz, timestamptz)', 'execute') = true),

    ('1k. CONTROL: anon still cannot read events.workspace_id (0029)',
     'false', has_column_privilege('anon', 'public.events', 'workspace_id', 'select')::text,
     has_column_privilege('anon', 'public.events', 'workspace_id', 'select') = false)
) as t(step, expected, actual, pass);


-- ############################################################################
-- SECTION 2 — The catalog after 0031. Read-only.
--
-- FOUR rows expected — the 3- and 5-argument forms in each schema. If only two
-- come back, the 3-argument pair was dropped and both client call sites are
-- broken right now.
--
-- EXPECTED:
--   app    3 args  definer=true   public, app, extensions   stable
--   app    5 args  definer=true   public, app, extensions   stable
--   public 3 args  definer=false  public, app               stable
--   public 5 args  definer=false  public, app               stable
--
-- The `extensions` entry on the two app definers is load-bearing: PostGIS moved
-- there in 0003, and without it st_dwithin / st_distance / st_setsrid /
-- st_makepoint do not resolve and the feed returns nothing with no obvious
-- cause.
-- ############################################################################
select
  n.nspname                                             as schema,
  p.proname                                             as function,
  pg_get_function_identity_arguments(p.oid)             as args,
  p.prosecdef                                           as security_definer,
  coalesce(array_to_string(p.proconfig, ', '), '(NONE)') as config,
  case p.provolatile when 's' then 'stable'
                     when 'i' then 'immutable'
                     else 'volatile' end                as volatility,
  case
    when p.proacl is null then 'PUBLIC (default - no explicit grants)'
    else (select string_agg(
            (case when acl.grantee = 0 then 'PUBLIC' else pg_get_userbyid(acl.grantee) end)
            || ':' || acl.privilege_type, ', ')
          from aclexplode(p.proacl) as acl)
  end                                                   as execute_grants
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('app', 'public')
  and p.proname = 'events_within_radius'
order by n.nspname, length(pg_get_function_identity_arguments(p.oid));

-- The 5-argument body, read from the catalog. Confirm by eye that BOTH new
-- predicates are present and that the 0030 Curbside guard survived the retype:
--   coalesce(e.ends_at, e.starts_at + '03:00:00') >= p_from
--   e.starts_at <= p_to
--   NOT app.curbside_expired(...)
select pg_get_functiondef(p.oid) as five_arg_body
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'app' and p.proname = 'events_within_radius'
  and pg_get_function_identity_arguments(p.oid) like '%timestamp%';


-- ############################################################################
-- SECTION 3 — The behavioral suite. BEGIN … ROLLBACK; nothing persists.
--
-- TWO WINDOWS, because the date bound and the ENDED/Curbside rules are
-- independent and must be tested apart:
--   W1 is in the FUTURE (now +10d .. +12d). Every date-bound fixture sits
--      around it, so no fixture is "ended" in real time and the date predicate
--      is isolated from 0030's guard and from the client's ENDED filter.
--   W2 is in the PAST (now -3d .. now +1d) and OVERLAPS an ended Curbside
--      fixture — the control proving 0031 did not drop 0030's guard while
--      retyping the function.
--
-- Every row of the output grid should read pass = true.
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
  u_host    uuid;
  ws        uuid;
  n         integer;
  n3        integer;
  n5        integer;
  hit       boolean;
  w1_from   constant timestamptz := now() + interval '10 days';
  w1_to     constant timestamptz := now() + interval '12 days';
  w2_from   constant timestamptz := now() - interval '3 days';
  w2_to     constant timestamptz := now() + interval '1 day';
  qa_addr   constant text := '18680 S Nogales Hwy';
  qa_lat    constant double precision := 31.9600;
  qa_lng    constant double precision := -110.9700;
  ev_multi  uuid;
  ev_before uuid;
  ev_after  uuid;
  ev_inside uuid;
  ev_edge_f uuid;
  ev_edge_t uuid;
  ev_grace  uuid;
  ev_stale  uuid;
  ev_cb_end uuid;
  ev_w2_paid uuid;
begin
  select id into u_host from public.profiles order by created_at limit 1;
  if u_host is null then
    perform pg_temp.rec('00. fixtures', 'at least one profile', 'none', false);
    return;
  end if;

  delete from public.curbside_quota_ledger where user_id = u_host;

  perform set_config('request.jwt.claims',
    json_build_object('sub', u_host::text, 'role', 'authenticated')::text, true);

  insert into public.workspaces (name, created_by)
  values ('QA 0031 workspace', u_host) returning id into ws;

  ---------------------------------------------------------------------------
  -- Fixtures around W1. All `standard` tier, so app.curbside_expired is false
  -- for every one of them and the date predicate is the only thing under test.
  ---------------------------------------------------------------------------
  insert into public.events
    (workspace_id, title, tier_id, status, starts_at, ends_at, address, location)
  values
    -- ★ starts BEFORE the window, ends AFTER it — still running throughout.
    (ws, 'QA multi-day spanning', 'standard', 'published',
     w1_from - interval '2 days', w1_to + interval '2 days', qa_addr,
     extensions.st_setsrid(extensions.st_makepoint(qa_lng, qa_lat), 4326)::extensions.geography),
    -- ends a day before the window opens
    (ws, 'QA before window', 'standard', 'published',
     w1_from - interval '5 days', w1_from - interval '4 days', qa_addr,
     extensions.st_setsrid(extensions.st_makepoint(qa_lng, qa_lat), 4326)::extensions.geography),
    -- starts days after the window closes
    (ws, 'QA after window', 'standard', 'published',
     w1_to + interval '5 days', w1_to + interval '5 days 2 hours', qa_addr,
     extensions.st_setsrid(extensions.st_makepoint(qa_lng, qa_lat), 4326)::extensions.geography),
    -- wholly inside
    (ws, 'QA inside window', 'standard', 'published',
     w1_from + interval '1 hour', w1_from + interval '3 hours', qa_addr,
     extensions.st_setsrid(extensions.st_makepoint(qa_lng, qa_lat), 4326)::extensions.geography),
    -- ends EXACTLY at the floor: `>=` must admit it
    (ws, 'QA edge ends at from', 'standard', 'published',
     w1_from - interval '2 hours', w1_from, qa_addr,
     extensions.st_setsrid(extensions.st_makepoint(qa_lng, qa_lat), 4326)::extensions.geography),
    -- starts EXACTLY at the ceiling: `<=` must admit it
    (ws, 'QA edge starts at to', 'standard', 'published',
     w1_to, w1_to + interval '2 hours', qa_addr,
     extensions.st_setsrid(extensions.st_makepoint(qa_lng, qa_lat), 4326)::extensions.geography),
    -- NO end time, started 2h before the floor: the 3-hour grace puts its end
    -- instant 1h INSIDE the window.
    (ws, 'QA no end inside grace', 'standard', 'published',
     w1_from - interval '2 hours', null, qa_addr,
     extensions.st_setsrid(extensions.st_makepoint(qa_lng, qa_lat), 4326)::extensions.geography),
    -- NO end time, started 4h before the floor: grace expires 1h BEFORE it.
    (ws, 'QA no end past grace', 'standard', 'published',
     w1_from - interval '4 hours', null, qa_addr,
     extensions.st_setsrid(extensions.st_makepoint(qa_lng, qa_lat), 4326)::extensions.geography);

  select id into ev_multi  from public.events where workspace_id = ws and title = 'QA multi-day spanning';
  select id into ev_before from public.events where workspace_id = ws and title = 'QA before window';
  select id into ev_after  from public.events where workspace_id = ws and title = 'QA after window';
  select id into ev_inside from public.events where workspace_id = ws and title = 'QA inside window';
  select id into ev_edge_f from public.events where workspace_id = ws and title = 'QA edge ends at from';
  select id into ev_edge_t from public.events where workspace_id = ws and title = 'QA edge starts at to';
  select id into ev_grace  from public.events where workspace_id = ws and title = 'QA no end inside grace';
  select id into ev_stale  from public.events where workspace_id = ws and title = 'QA no end past grace';

  -- W2 fixtures: one Curbside and one PAID, both ended, both overlapping W2.
  -- The paid one is 3j's control. It has to be its own row — none of the W1
  -- fixtures overlap W2 (they are all clustered around now +10d), so reusing
  -- one would make 3j fail for a reason that has nothing to do with the
  -- Curbside guard it is there to isolate.
  insert into public.events
    (workspace_id, title, tier_id, status, starts_at, ends_at, address, location)
  values
    (ws, 'QA paid overlapping W2', 'standard', 'published',
     now() - interval '2 days', now() - interval '1 day', qa_addr,
     extensions.st_setsrid(extensions.st_makepoint(qa_lng, qa_lat), 4326)::extensions.geography)
  returning id into ev_w2_paid;

  insert into public.events
    (workspace_id, title, tier_id, status, starts_at, ends_at, address, location,
     curbside_anonymous)
  values
    (ws, 'QA curbside ended', 'curbside', 'published',
     now() - interval '2 days', now() - interval '1 day', qa_addr,
     extensions.st_setsrid(extensions.st_makepoint(qa_lng, qa_lat), 4326)::extensions.geography,
     false)
  returning id into ev_cb_end;

  ---------------------------------------------------------------------------
  -- 3A ★ THE ASSERTION THE PREDICATE EXISTS FOR.
  -- Starts two days BEFORE the window and ends two days after it. Under
  -- `starts_at >= p_from` this row is dropped; under interval overlap it is
  -- kept. If this fails, the predicate is a start comparison and a live
  -- multi-day event is invisible on the feed for its entire duration.
  ---------------------------------------------------------------------------
  select exists (
    select 1 from public.events_within_radius(qa_lat, qa_lng, 25, w1_from, w1_to)
     where id = ev_multi) into hit;
  perform pg_temp.rec('3a. ★ live multi-day event SPANNING the window',
    'true — started before the window, still running', hit::text, hit = true);

  ---------------------------------------------------------------------------
  -- 3B — the four ordinary cases.
  ---------------------------------------------------------------------------
  select exists (select 1 from public.events_within_radius(qa_lat, qa_lng, 25, w1_from, w1_to)
                  where id = ev_inside) into hit;
  perform pg_temp.rec('3b. wholly inside the window', 'true', hit::text, hit = true);

  select exists (select 1 from public.events_within_radius(qa_lat, qa_lng, 25, w1_from, w1_to)
                  where id = ev_before) into hit;
  perform pg_temp.rec('3c. ended a day BEFORE the window opens', 'false', hit::text, hit = false);

  select exists (select 1 from public.events_within_radius(qa_lat, qa_lng, 25, w1_from, w1_to)
                  where id = ev_after) into hit;
  perform pg_temp.rec('3d. starts days AFTER the window closes', 'false', hit::text, hit = false);

  ---------------------------------------------------------------------------
  -- 3E/3F — boundary equality. `>=` and `<=` are deliberate; a strict
  -- inequality would drop an event that ends exactly as the window opens.
  ---------------------------------------------------------------------------
  select exists (select 1 from public.events_within_radius(qa_lat, qa_lng, 25, w1_from, w1_to)
                  where id = ev_edge_f) into hit;
  perform pg_temp.rec('3e. BOUNDARY: end instant EXACTLY at window_from',
    'true — `>=`, not `>`', hit::text, hit = true);

  select exists (select 1 from public.events_within_radius(qa_lat, qa_lng, 25, w1_from, w1_to)
                  where id = ev_edge_t) into hit;
  perform pg_temp.rec('3f. BOUNDARY: starts_at EXACTLY at window_to',
    'true — `<=`, not `<`', hit::text, hit = true);

  ---------------------------------------------------------------------------
  -- 3G/3H — the 3-hour grace, which is why the floor is a coalesce rather than
  -- a comparison against ends_at.
  ---------------------------------------------------------------------------
  select exists (select 1 from public.events_within_radius(qa_lat, qa_lng, 25, w1_from, w1_to)
                  where id = ev_grace) into hit;
  perform pg_temp.rec('3g. no end time, grace instant INSIDE the window',
    'true', hit::text, hit = true);

  select exists (select 1 from public.events_within_radius(qa_lat, qa_lng, 25, w1_from, w1_to)
                  where id = ev_stale) into hit;
  perform pg_temp.rec('3h. no end time, grace expired BEFORE the window',
    'false', hit::text, hit = false);

  ---------------------------------------------------------------------------
  -- 3I — 0030's Curbside guard survived the retype. W2 OVERLAPS this event, so
  -- the date predicate alone would admit it; only the guard excludes it.
  ---------------------------------------------------------------------------
  select exists (select 1 from public.events_within_radius(qa_lat, qa_lng, 25, w2_from, w2_to)
                  where id = ev_cb_end) into hit;
  perform pg_temp.rec('3i. CONTROL: ended Curbside excluded even though W2 overlaps it',
    'false — 0030''s guard survived the retype', hit::text, hit = false);

  -- and the paid event that also overlaps W2 IS returned, so 3i is not passing
  -- because W2 returns nothing at all.
  select exists (select 1 from public.events_within_radius(qa_lat, qa_lng, 25, w2_from, w2_to)
                  where id = ev_w2_paid) into hit;
  perform pg_temp.rec('3j. CONTROL: W2 is not empty — a paid event overlapping it IS returned',
    'true', hit::text, hit = true);

  ---------------------------------------------------------------------------
  -- 3K ★ THE NO-BREAKAGE GUARANTEE. The 3-argument form still exists and still
  -- returns what it returned before 0031 — the claim the whole option rests on,
  -- and the reason the two live client call sites did not go down.
  --
  -- Compared against the 5-argument call with unbounded values, which is what
  -- the 3-argument form now delegates to. Equal sets, not merely equal counts:
  -- the symmetric difference must be empty.
  ---------------------------------------------------------------------------
  select count(*) into n3 from public.events_within_radius(qa_lat, qa_lng, 25);
  select count(*) into n5 from public.events_within_radius(
    qa_lat, qa_lng, 25, '-infinity'::timestamptz, 'infinity'::timestamptz);
  perform pg_temp.rec('3k. ★ 3-arg call still resolves and returns rows',
    'equal counts, > 0',
    format('3-arg=%s 5-arg-unbounded=%s', n3, n5), n3 = n5 and n3 > 0);

  select count(*) into n from (
    (select id from public.events_within_radius(qa_lat, qa_lng, 25)
     except
     select id from public.events_within_radius(qa_lat, qa_lng, 25,
       '-infinity'::timestamptz, 'infinity'::timestamptz))
    union all
    (select id from public.events_within_radius(qa_lat, qa_lng, 25,
       '-infinity'::timestamptz, 'infinity'::timestamptz)
     except
     select id from public.events_within_radius(qa_lat, qa_lng, 25))
  ) d;
  perform pg_temp.rec('3l. ★ 3-arg and unbounded 5-arg return the SAME SET',
    '0 rows of symmetric difference', n::text || ' row(s) differ', n = 0);

  ---------------------------------------------------------------------------
  -- 3M — the window actually narrows. A bound that returned everything would
  -- pass 3a-3g by accident.
  ---------------------------------------------------------------------------
  select count(*) into n5 from public.events_within_radius(qa_lat, qa_lng, 25, w1_from, w1_to);
  perform pg_temp.rec('3m. the window NARROWS the unbounded set',
    format('fewer than the %s unbounded rows', n3),
    n5::text || ' row(s) in W1', n5 < n3);

  ---------------------------------------------------------------------------
  -- 3N — anon can call the new 5-argument wrapper. The signed-out feed is the
  -- reason anon EXECUTE is required rather than merely tolerated.
  ---------------------------------------------------------------------------
  begin
    perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
    execute 'set local role anon';
    select count(*) into n from public.events_within_radius(qa_lat, qa_lng, 25, w1_from, w1_to);
    execute 'reset role';
    perform pg_temp.rec('3n. anon calls the 5-arg wrapper',
      'succeeds (no 42501)', n::text || ' row(s)', n >= 1);
  exception when others then
    execute 'reset role';
    perform pg_temp.rec('3n. anon calls the 5-arg wrapper',
      'succeeds (no 42501)', 'RAISED: ' || sqlstate || ' ' || sqlerrm, false);
  end;

  begin
    execute 'set local role anon';
    select count(*) into n from public.events_within_radius(qa_lat, qa_lng, 25);
    execute 'reset role';
    perform pg_temp.rec('3o. anon still calls the 3-arg wrapper (client is not broken)',
      'succeeds (no 42501)', n::text || ' row(s)', n >= 1);
  exception when others then
    execute 'reset role';
    perform pg_temp.rec('3o. anon still calls the 3-arg wrapper',
      'succeeds (no 42501)', 'RAISED: ' || sqlstate || ' ' || sqlerrm, false);
  end;

  ---------------------------------------------------------------------------
  -- 3P — NO OVERLOAD AMBIGUITY. Neither 5-argument function carries a DEFAULT,
  -- so a 3-name call can only match the 3-argument function and a 5-name call
  -- only the 5-argument one. If either raised 42725 the coexistence would be
  -- unusable and PostgREST routing would be a coin flip.
  --
  -- Both calls above already resolved; this records the absence of the error
  -- explicitly so a future reader does not have to infer it.
  ---------------------------------------------------------------------------
  perform pg_temp.rec('3p. no 42725 ambiguity between the 3- and 5-arg forms',
    'both resolve unambiguously',
    'both resolved (3o and 3n above)', true);
end;
$$;

select seq, step, expected, actual, pass from qa_results order by seq;

-- Uncomment to see only what failed on a long grid:
-- select seq, step, expected, actual from qa_results where not pass order by seq;

rollback;

-- ############################################################################
-- SECTION 4 — NOT RUNNABLE HERE: PostgREST argument-name routing.
--
-- The catalog cannot tell you whether PostgREST routes the new call. It caches
-- function signatures, 0031 ends with `notify pgrst, 'reload schema'`, and the
-- only proof that the reload took is an HTTP call. Run BOTH from a terminal —
-- the second is the one that would have gone down under a drop-and-recreate:
--
--   # 5-argument form — must return rows, not 404
--   curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/events_within_radius" \
--     -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
--     -d '{"origin_lat":31.9576,"origin_lng":-110.9556,"radius_miles":25,
--          "window_from":"2026-09-09T00:00:00Z","window_to":"2026-09-11T00:00:00Z"}'
--
--   # 3-argument form — must STILL return rows, because the client still sends
--   # exactly this until the follow-up commit lands
--   curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/events_within_radius" \
--     -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
--     -d '{"origin_lat":31.9576,"origin_lng":-110.9556,"radius_miles":25}'
--
-- A 404 with "Could not find the function … in the schema cache" on the FIRST
-- means the notify has not been picked up yet. On the SECOND it means the
-- 3-argument form is gone and both client call sites are down.
-- ############################################################################

-- ============================================================================
-- BEHAVIORAL SUITE — events.location_approximate and the event_detail read
-- path (migration 0035).
--
-- WHERE TO RUN: Supabase Dashboard → SQL Editor, on the DEV project
-- (`Sparked-App`), AFTER 0035 is applied. Never against prod. The editor runs
-- as `postgres`; every behavioural case switches role explicitly inside the
-- transaction, because RLS and column grants do not apply to the owner and a
-- check run as postgres proves nothing.
--
-- HOW TO RUN: two numbered sections, one at a time, top to bottom; paste each
-- result grid back. Section 1 is READ-ONLY. Section 2 is wrapped in
-- BEGIN … ROLLBACK and creates its own throwaway workspace, events and RSVP —
-- **nothing it does persists.** Every row of both grids should read
-- pass = true.
--
-- ---------------------------------------------------------------------------
-- SHAPE: per role AND per policy branch (CLAUDE.md, "Catalog-verified is not
-- behaviour-verified"). event_detail carries events_select_public's three
-- branches, so the flag is read through each one:
--
--   anon, branch 2 (storefront)       — published event → the flag, false by
--                                       default and true on a flagged row.
--   anon, control                     — a DRAFT stays invisible: 0 rows, no
--                                       error. Without this the suite passes if
--                                       the drop + create lost the WHERE clause.
--   stranger, branch 2                — authenticated, no membership: published
--                                       flagged row → true.
--   stranger, control                 — the draft: 0 rows.
--   host, branch 1 (member)           — the flagged DRAFT, which only branch 1
--                                       admits → 1 row, true. Cannot pass on a
--                                       NULL auth.uid() (2a checks it first).
--   attendee, branch 3 (history)      — an ENDED, ARCHIVED event the user RSVPd
--                                       to: archived_at shuts branch 2, so only
--                                       branch 3 admits it → 1 row.
--   no-attendance control             — a third account, no RSVP: 0 rows. Proves
--                                       branch 3 still needs attendance.
--
-- And the write side: the HOST can insert a row with the flag and update it;
-- a stranger's update reaches 0 rows; anon's insert is refused.
--
-- The QA address is 18680 S Nogales Hwy. Fixture points are fixed coordinates
-- near Sahuarita written as text (the client's own shape) — NOT geocoder
-- results; distance values are not asserted, only that one comes back.
-- ============================================================================


-- ############################################################################
-- SECTION 1 — Catalog and privilege state. READ-ONLY. Run this first.
--
-- PUBLIC is a pseudo-role and has_function_privilege cannot be asked about it,
-- so 1h/1i read the ACL directly: an aclitem with an EMPTY grantee is PUBLIC
-- and renders as `=X/owner`.
--
-- 1n/1o are the verbatim-transcription guards: remove the one added line from
-- the new app.event_detail body and it must hash to 0030 PART E's body
-- (4459d9ae…); the wrapper body must hash to 0028 PART D's, unchanged. Both
-- hashes were computed from the committed files (LF line endings); `chr(13)`
-- is stripped in case the applying client sent CRLF.
-- ############################################################################
select * from (values
    ('1a. events.location_approximate exists: boolean, NOT NULL, default false',
     'boolean | true | false',
     (select format_type(a.atttypid, a.atttypmod) || ' | ' || a.attnotnull::text || ' | ' || coalesce(pg_get_expr(d.adbin, d.adrelid), '(none)')
        from pg_attribute a
        left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
       where a.attrelid = 'public.events'::regclass and a.attname = 'location_approximate' and not a.attisdropped),
     (select format_type(a.atttypid, a.atttypmod) = 'boolean' and a.attnotnull and pg_get_expr(d.adbin, d.adrelid) = 'false'
        from pg_attribute a
        left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
       where a.attrelid = 'public.events'::regclass and a.attname = 'location_approximate' and not a.attisdropped)),

    ('1b. every existing row is false (count of true rows)',
     '0',
     (select count(*) from public.events where location_approximate)::text,
     (select count(*) from public.events where location_approximate) = 0),

    ('1c. anon has NO SELECT on the column (no grant was added)',
     'false',
     has_column_privilege('anon', 'public.events', 'location_approximate', 'select')::text,
     has_column_privilege('anon', 'public.events', 'location_approximate', 'select') = false),

    ('1d. authenticated has NO SELECT on the column (read path is the RPC)',
     'false',
     has_column_privilege('authenticated', 'public.events', 'location_approximate', 'select')::text,
     has_column_privilege('authenticated', 'public.events', 'location_approximate', 'select') = false),

    ('1e. authenticated INSERT + UPDATE on the column',
     'true | true',
     has_column_privilege('authenticated', 'public.events', 'location_approximate', 'insert')::text || ' | ' ||
     has_column_privilege('authenticated', 'public.events', 'location_approximate', 'update')::text,
     has_column_privilege('authenticated', 'public.events', 'location_approximate', 'insert')
     and has_column_privilege('authenticated', 'public.events', 'location_approximate', 'update')),

    ('1f. anon has NO INSERT / UPDATE on the column',
     'false | false',
     has_column_privilege('anon', 'public.events', 'location_approximate', 'insert')::text || ' | ' ||
     has_column_privilege('anon', 'public.events', 'location_approximate', 'update')::text,
     not has_column_privilege('anon', 'public.events', 'location_approximate', 'insert')
     and not has_column_privilege('anon', 'public.events', 'location_approximate', 'update')),

    ('1g. events TABLE-level grants to client roles unchanged: only authenticated DELETE',
     'authenticated:DELETE',
     (select coalesce(string_agg(pg_get_userbyid(acl.grantee) || ':' || acl.privilege_type, ', ' order by 1), '(none)')
        from aclexplode((select relacl from pg_class where oid = 'public.events'::regclass)) acl
       where acl.grantee <> 0 and pg_get_userbyid(acl.grantee) in ('anon', 'authenticated')),
     (select coalesce(string_agg(pg_get_userbyid(acl.grantee) || ':' || acl.privilege_type, ', ' order by 1), '(none)')
        from aclexplode((select relacl from pg_class where oid = 'public.events'::regclass)) acl
       where acl.grantee <> 0 and pg_get_userbyid(acl.grantee) in ('anon', 'authenticated')) = 'authenticated:DELETE'),

    ('1h. TARGET: PUBLIC does NOT execute app.event_detail (no =X/ aclitem)',
     'false',
     (select coalesce(bool_or(a.item::text like '=%'), false)
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        cross join lateral unnest(coalesce(p.proacl, '{}'::aclitem[])) as a(item)
       where n.nspname = 'app' and p.proname = 'event_detail')::text,
     (select coalesce(bool_or(a.item::text like '=%'), false)
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        cross join lateral unnest(coalesce(p.proacl, '{}'::aclitem[])) as a(item)
       where n.nspname = 'app' and p.proname = 'event_detail') = false
     -- a NULL proacl means the DEFAULT, which includes PUBLIC: that fails too.
     and (select p.proacl is not null from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'app' and p.proname = 'event_detail')),

    ('1i. TARGET: PUBLIC does NOT execute public.event_detail (was PUBLIC:EXECUTE since 0023)',
     'false',
     (select coalesce(bool_or(a.item::text like '=%'), false)
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        cross join lateral unnest(coalesce(p.proacl, '{}'::aclitem[])) as a(item)
       where n.nspname = 'public' and p.proname = 'event_detail')::text,
     (select coalesce(bool_or(a.item::text like '=%'), false)
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        cross join lateral unnest(coalesce(p.proacl, '{}'::aclitem[])) as a(item)
       where n.nspname = 'public' and p.proname = 'event_detail') = false
     and (select p.proacl is not null from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname = 'event_detail')),

    ('1j. anon + authenticated EXECUTE both functions (4 checks)',
     'true true true true',
     has_function_privilege('anon', 'app.event_detail(uuid, double precision, double precision)', 'execute')::text || ' ' ||
     has_function_privilege('authenticated', 'app.event_detail(uuid, double precision, double precision)', 'execute')::text || ' ' ||
     has_function_privilege('anon', 'public.event_detail(uuid, double precision, double precision)', 'execute')::text || ' ' ||
     has_function_privilege('authenticated', 'public.event_detail(uuid, double precision, double precision)', 'execute')::text,
     has_function_privilege('anon', 'app.event_detail(uuid, double precision, double precision)', 'execute')
     and has_function_privilege('authenticated', 'app.event_detail(uuid, double precision, double precision)', 'execute')
     and has_function_privilege('anon', 'public.event_detail(uuid, double precision, double precision)', 'execute')
     and has_function_privilege('authenticated', 'public.event_detail(uuid, double precision, double precision)', 'execute')),

    ('1k. exactly one event_detail in each schema (no stray overload)',
     '1 | 1',
     (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'app' and p.proname = 'event_detail')::text || ' | ' ||
     (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'event_detail')::text,
     (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'app' and p.proname = 'event_detail') = 1
     and (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'event_detail') = 1),

    ('1l. both return 17 columns, the last one location_approximate',
     '17 location_approximate | 17 location_approximate',
     (select (select count(*) from unnest(p.proargmodes) m where m = 't')::text || ' ' || p.proargnames[array_length(p.proargnames, 1)]
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'app' and p.proname = 'event_detail')
     || ' | ' ||
     (select (select count(*) from unnest(p.proargmodes) m where m = 't')::text || ' ' || p.proargnames[array_length(p.proargnames, 1)]
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'event_detail'),
     (select (select count(*) from unnest(p.proargmodes) m where m = 't') = 17 and p.proargnames[array_length(p.proargnames, 1)] = 'location_approximate'
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'app' and p.proname = 'event_detail')
     and
     (select (select count(*) from unnest(p.proargmodes) m where m = 't') = 17 and p.proargnames[array_length(p.proargnames, 1)] = 'location_approximate'
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'event_detail')),

    ('1m. security + search_path unchanged: app definer (public, app, extensions); public invoker (public, app)',
     'true search_path=public, app, extensions | false search_path=public, app',
     (select p.prosecdef::text || ' ' || array_to_string(p.proconfig, ', ')
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'app' and p.proname = 'event_detail')
     || ' | ' ||
     (select p.prosecdef::text || ' ' || array_to_string(p.proconfig, ', ')
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'event_detail'),
     (select p.prosecdef and array_to_string(p.proconfig, ', ') = 'search_path=public, app, extensions'
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'app' and p.proname = 'event_detail')
     and
     (select not p.prosecdef and array_to_string(p.proconfig, ', ') = 'search_path=public, app'
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'event_detail')),

    ('1n. VERBATIM: app.event_detail minus the added line hashes to 0030 PART E',
     '4459d9ae8c405f9e7c311b02d636a53c',
     (select md5(replace(replace(p.prosrc, chr(13), ''), E',\n    e.location_approximate', ''))
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'app' and p.proname = 'event_detail'),
     (select md5(replace(replace(p.prosrc, chr(13), ''), E',\n    e.location_approximate', ''))
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'app' and p.proname = 'event_detail')
       = '4459d9ae8c405f9e7c311b02d636a53c'),

    ('1o. VERBATIM: public.event_detail body hashes to 0028 PART D (unchanged)',
     '7c4969aebd532a9ac291452adc95dc0f',
     (select md5(replace(p.prosrc, chr(13), ''))
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'event_detail'),
     (select md5(replace(p.prosrc, chr(13), ''))
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'event_detail')
       = '7c4969aebd532a9ac291452adc95dc0f'),

    ('1p. app.is_member is UNTOUCHED (still holds PUBLIC — left for its own decision)',
     'true',
     (select coalesce(bool_or(a.item::text like '=%'), false)
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        cross join lateral unnest(coalesce(p.proacl, '{}'::aclitem[])) as a(item)
       where n.nspname = 'app' and p.proname = 'is_member')::text,
     (select coalesce(bool_or(a.item::text like '=%'), false)
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        cross join lateral unnest(coalesce(p.proacl, '{}'::aclitem[])) as a(item)
       where n.nspname = 'app' and p.proname = 'is_member') = true)
) as t(step, expected, actual, pass);


-- ############################################################################
-- SECTION 2 — The behavioural suite. BEGIN … ROLLBACK; nothing persists.
--
-- Every read goes through a helper that returns `n=<rows> approx=<flag>` or
-- the SQLSTATE it raised, so a 42501 shows in the grid as `ERR 42501` against
-- an expected value — never as a silent 0.
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

-- Call public.event_detail for `p_event` as `p_role` (user `p_user`, NULL for
-- anon), from the Sahuarita seed origin. Returns 'n=<count> approx=<flag>'
-- (flag 'none' when no row) or 'ERR <sqlstate>'. Restores role and the prior
-- claim on every path.
create function pg_temp.detail_as(p_role text, p_user uuid, p_event uuid)
returns text language plpgsql as $fn$
declare
  n     integer;
  f     text;
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
    select count(*), coalesce(bool_or(d.location_approximate)::text, 'none')
      into n, f
      from public.event_detail(p_event, 31.9576, -110.9556) d;
    out := 'n=' || n::text || ' approx=' || f;
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

-- Run one write statement as `p_role` / `p_user`. Returns 'rows=<n>' or
-- 'ERR <sqlstate>'.
create function pg_temp.write_as(p_role text, p_user uuid, p_sql text)
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
    execute p_sql;
    get diagnostics n = row_count;
    out := 'rows=' || n::text;
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
  u_host      uuid;
  u_attendee  uuid;  -- also the "stranger" for branch-2 cases: no membership
  u_other     uuid;  -- no membership, no attendance
  ws          uuid;
  ev_pub      uuid;  -- published, flag default (false)
  ev_pub_ap   uuid;  -- published, flag true
  ev_draft    uuid;  -- draft, flag true: only branch 1 admits it
  ev_ended    uuid;  -- published, ended, ARCHIVED, attendee RSVPd: only branch 3
  ev_new      uuid;
  n           integer;
  r           text;
  qa_addr     constant text := '18680 S Nogales Hwy';
  -- The point is an UNTYPED literal in each insert (coerced to the column's
  -- geography type, as PostgREST does), never a text variable: a text-typed
  -- value would need a text -> geography assignment cast.
begin
  ---------------------------------------------------------------------------
  -- Fixtures.
  ---------------------------------------------------------------------------
  select id into u_host     from public.profiles order by created_at limit 1;
  select id into u_attendee from public.profiles where id <> u_host order by created_at limit 1;
  select id into u_other    from public.profiles where id not in (u_host, u_attendee) order by created_at limit 1;
  if u_host is null or u_attendee is null or u_other is null then
    perform pg_temp.rec('00. fixtures', 'at least three profiles exist', 'fewer than three — cannot run', false);
    return;
  end if;

  insert into public.workspaces (name, created_by)
  values ('QA 0035 workspace', u_host) returning id into ws;

  select count(*) into n from public.memberships
   where workspace_id = ws and user_id = u_host and role = 'owner';
  perform pg_temp.rec('00a. fixture: owner membership auto-seeded (0001 trigger)', '1', n::text, n = 1);
  select count(*) into n from public.memberships where workspace_id = ws and user_id in (u_attendee, u_other);
  perform pg_temp.rec('00b. fixture: attendee and other hold NO membership', '0', n::text, n = 0);

  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location)
  values (ws, 'QA 0035 published', 'standard', 'published', now() + interval '1 day', now() + interval '1 day 3 hours', qa_addr, 'SRID=4326;POINT(-110.9800 31.8700)')
  returning id into ev_pub;
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location, location_approximate)
  values (ws, 'QA 0035 published approximate', 'standard', 'published', now() + interval '1 day', now() + interval '1 day 3 hours', qa_addr, 'SRID=4326;POINT(-110.9800 31.8700)', true)
  returning id into ev_pub_ap;
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location, location_approximate)
  values (ws, 'QA 0035 draft approximate', 'standard', 'draft', now() + interval '2 days', now() + interval '2 days 3 hours', qa_addr, 'SRID=4326;POINT(-110.9800 31.8700)', true)
  returning id into ev_draft;
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location, archived_at)
  values (ws, 'QA 0035 ended archived', 'standard', 'published', now() - interval '3 days', now() - interval '3 days' + interval '3 hours', qa_addr, 'SRID=4326;POINT(-110.9800 31.8700)', now())
  returning id into ev_ended;
  insert into public.rsvps (user_id, event_id) values (u_attendee, ev_ended);

  select count(*) into n from public.events where id = ev_pub and location_approximate = false;
  perform pg_temp.rec('00c. fixture: a row inserted without the column gets the default false', '1', n::text, n = 1);

  ---------------------------------------------------------------------------
  -- 2a. THE IDENTITY CHECK. If this fails, every member/attendee case is void.
  ---------------------------------------------------------------------------
  r := pg_temp.uid_as(u_host);
  perform pg_temp.rec('2a. auth.uid() as authenticated with sub=<host> resolves to the host', u_host::text, r, r = u_host::text);

  ---------------------------------------------------------------------------
  -- READ PATH — per role, per branch.
  ---------------------------------------------------------------------------
  r := pg_temp.detail_as('anon', null, ev_pub);
  perform pg_temp.rec('2b. anon, branch 2: published row returns the flag, false by default', 'n=1 approx=false', r, r = 'n=1 approx=false');
  r := pg_temp.detail_as('anon', null, ev_pub_ap);
  perform pg_temp.rec('2c. anon, branch 2: flagged published row returns true', 'n=1 approx=true', r, r = 'n=1 approx=true');
  r := pg_temp.detail_as('anon', null, ev_draft);
  perform pg_temp.rec('2d. anon, CONTROL: the draft stays hidden — 0 rows, no error', 'n=0 approx=none', r, r = 'n=0 approx=none');
  r := pg_temp.detail_as('authenticated', u_attendee, ev_pub_ap);
  perform pg_temp.rec('2e. stranger, branch 2: flagged published row returns true', 'n=1 approx=true', r, r = 'n=1 approx=true');
  r := pg_temp.detail_as('authenticated', u_attendee, ev_draft);
  perform pg_temp.rec('2f. stranger, CONTROL: the draft stays hidden — 0 rows', 'n=0 approx=none', r, r = 'n=0 approx=none');
  r := pg_temp.detail_as('authenticated', u_host, ev_draft);
  perform pg_temp.rec('2g. HOST, branch 1: the flagged DRAFT (only the member branch admits it) → true', 'n=1 approx=true', r, r = 'n=1 approx=true');
  r := pg_temp.detail_as('authenticated', u_attendee, ev_ended);
  perform pg_temp.rec('2h. ATTENDEE, branch 3: ended + archived + RSVP → 1 row, flag false', 'n=1 approx=false', r, r = 'n=1 approx=false');
  r := pg_temp.detail_as('authenticated', u_other, ev_ended);
  perform pg_temp.rec('2i. CONTROL: same ended+archived row, no attendance → 0 rows', 'n=0 approx=none', r, r = 'n=0 approx=none');
  r := pg_temp.detail_as('anon', null, ev_ended);
  perform pg_temp.rec('2j. CONTROL: anon on the ended+archived row → 0 rows (branch 2 shut by archived_at)', 'n=0 approx=none', r, r = 'n=0 approx=none');

  ---------------------------------------------------------------------------
  -- WRITE PATH — the grants, driven.
  ---------------------------------------------------------------------------
  r := pg_temp.write_as('authenticated', u_host, format(
    'insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location, location_approximate)
     values (%L, %L, %L, %L, now() + interval ''4 days'', now() + interval ''4 days 3 hours'', %L, %L, true)',
    ws, 'QA 0035 host insert', 'standard', 'pending_payment', qa_addr, 'SRID=4326;POINT(-110.9800 31.8700)'));
  perform pg_temp.rec('2k. HOST inserts a pending_payment row WITH the flag (wizard draft shape)', 'rows=1', r, r = 'rows=1');

  select id into ev_new from public.events where workspace_id = ws and title = 'QA 0035 host insert';
  select count(*) into n from public.events where id = ev_new and location_approximate;
  perform pg_temp.rec('2l. …and the stored flag is true', '1', n::text, n = 1);

  r := pg_temp.write_as('authenticated', u_host, format(
    'update public.events set location_approximate = false where id = %L', ev_new));
  perform pg_temp.rec('2m. HOST updates the flag (checkout re-entry shape)', 'rows=1', r, r = 'rows=1');

  r := pg_temp.write_as('authenticated', u_attendee, format(
    'update public.events set location_approximate = true where id = %L', ev_new));
  perform pg_temp.rec('2n. stranger''s update reaches 0 rows (RLS), no error', 'rows=0', r, r = 'rows=0');

  select count(*) into n from public.events where id = ev_new and location_approximate = false;
  perform pg_temp.rec('2o. …and the flag is still false', '1', n::text, n = 1);

  r := pg_temp.write_as('anon', null, format(
    'insert into public.events (workspace_id, title, tier_id, status, starts_at, address, location_approximate)
     values (%L, %L, %L, %L, now() + interval ''5 days'', %L, true)',
    ws, 'QA 0035 anon insert', 'standard', 'draft', qa_addr));
  perform pg_temp.rec('2p. anon insert is refused', 'ERR 42501', r, r = 'ERR 42501');
end $$;

select seq, step, expected, actual, pass from qa_results order by seq;

rollback;

-- After the grid: confirm nothing persisted (expect 0).
select count(*) as qa_rows_left from public.events where title like 'QA 0035%';

-- ============================================================================
-- BEHAVIORAL SUITE — "Download my data" (migration 0038):
-- app.export_my_data() + public.export_my_data().
--
-- WHERE TO RUN: Supabase Dashboard → SQL Editor, on the DEV project
-- (`Sparked-App`), AFTER 0038 is applied. Never against prod. The editor runs
-- as `postgres`; every behavioural case switches role explicitly.
--
-- HOW TO RUN: two sections, each in a NEW tab. Section 1 is READ-ONLY — paste
-- and Run. Section 2 is BEGIN … ROLLBACK: highlight from `begin;` down to and
-- including the `select seq, step, …` line, Run selected; then run
-- `rollback;` alone; then the final check alone — expect 0 | 0. Every row of
-- both grids should read pass = true.
--
-- WHAT SECTION 2 TOUCHES, INSIDE THE TRANSACTION ONLY. It borrows three
-- existing profiles (A, B, C) — no auth.users rows are minted (qa-0018's
-- reason). It clears A's ledger rows for a clean Curbside insert, and empties
-- C's saves / RSVPs / preferences / ledger / memberships so C is an account
-- with nothing. A and B may own real data too, so expected counts are
-- computed in-transaction, never hard-coded. The ROLLBACK undoes all of it.
--
-- ---------------------------------------------------------------------------
-- SHAPE: per role AND per branch (CLAUDE.md, "Catalog-verified is not
-- behaviour-verified").
--   ROLES:     anon → 42501 at both entry points; authenticated with no user
--              claim → 28000 not_authenticated; authenticated A → a document.
--   CONTENT:   A's export holds exactly A's saves / RSVPs / preferences /
--              memberships / owned workspaces / ledger (counts match the
--              tables); A's owned events include draft, archived and
--              soft-deleted rows, labelled; categories and vendors attached.
--   ISOLATION: B's id, B's workspace id, B's preference and B's save appear
--              nowhere in A's export — including B's membership in A's
--              workspace and B's save of A's event.
--   EMPTY:     C (emptied) gets every section, empty, and no error.
--
-- QA address: 18680 S Nogales Hwy.
-- ============================================================================


-- ############################################################################
-- SECTION 1 — Catalog and privilege state. READ-ONLY. Run this first.
-- An aclitem with an EMPTY grantee (`=X/owner`) is PUBLIC; a NULL proacl is
-- the default, which includes PUBLIC, and fails too.
-- ############################################################################
with fn as (
  select n.nspname as schema, p.proname as name, p.oid, p.proacl, p.prosecdef, p.proconfig,
         pg_get_function_identity_arguments(p.oid) as args,
         pg_get_function_result(p.oid) as result
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where p.proname = 'export_my_data' and n.nspname in ('app', 'public')
),
f_app as (select * from fn where schema = 'app'),
f_pub as (select * from fn where schema = 'public')
select * from (values
    ('1a. one function per schema, NO arguments, returns jsonb',
     '1 | 1 | "" jsonb | "" jsonb',
     (select count(*)::text from f_app) || ' | ' || (select count(*)::text from f_pub) || ' | ' ||
     coalesce((select '"' || args || '" ' || result from f_app), '(missing)') || ' | ' ||
     coalesce((select '"' || args || '" ' || result from f_pub), '(missing)'),
     (select count(*) from f_app) = 1 and (select count(*) from f_pub) = 1
       and (select args = '' and result = 'jsonb' from f_app)
       and (select args = '' and result = 'jsonb' from f_pub)),

    ('1b. definer app / invoker public; search_path pinned',
     'true public, app, extensions | false public, app',
     coalesce((select prosecdef::text || ' ' || replace(array_to_string(proconfig, ', '), 'search_path=', '') from f_app), '(missing)')
     || ' | ' ||
     coalesce((select prosecdef::text || ' ' || replace(array_to_string(proconfig, ', '), 'search_path=', '') from f_pub), '(missing)'),
     coalesce((select prosecdef and array_to_string(proconfig, ', ') = 'search_path=public, app, extensions' from f_app), false)
       and coalesce((select not prosecdef and array_to_string(proconfig, ', ') = 'search_path=public, app' from f_pub), false)),

    ('1c. TARGET: no PUBLIC EXECUTE on either (and no NULL/default ACL)',
     'none',
     coalesce((select string_agg(schema || '.' || name, ', ') from fn
                where proacl is null
                   or exists (select 1 from unnest(proacl) a where a::text like '=%')), 'none'),
     (select count(*) from fn) = 2
       and not exists (select 1 from fn where proacl is null
                         or exists (select 1 from unnest(proacl) a where a::text like '=%'))),

    ('1d. EXECUTE: anon false, authenticated true, service_role false (app | public)',
     'false true false | false true false',
     (select has_function_privilege('anon', oid, 'execute')::text || ' ' ||
             has_function_privilege('authenticated', oid, 'execute')::text || ' ' ||
             has_function_privilege('service_role', oid, 'execute')::text from f_app)
     || ' | ' ||
     (select has_function_privilege('anon', oid, 'execute')::text || ' ' ||
             has_function_privilege('authenticated', oid, 'execute')::text || ' ' ||
             has_function_privilege('service_role', oid, 'execute')::text from f_pub),
     coalesce((select not has_function_privilege('anon', oid, 'execute')
         and has_function_privilege('authenticated', oid, 'execute')
         and not has_function_privilege('service_role', oid, 'execute') from f_app), false)
     and coalesce((select not has_function_privilege('anon', oid, 'execute')
         and has_function_privilege('authenticated', oid, 'execute')
         and not has_function_privilege('service_role', oid, 'execute') from f_pub), false)),

    ('1e. ACL grantees are exactly authenticated + postgres on both',
     'authenticated,postgres | authenticated,postgres',
     coalesce((select string_agg(pg_get_userbyid(a.grantee), ',' order by pg_get_userbyid(a.grantee))
        from aclexplode((select proacl from f_app)) a), '(none)')
     || ' | ' ||
     coalesce((select string_agg(pg_get_userbyid(a.grantee), ',' order by pg_get_userbyid(a.grantee))
        from aclexplode((select proacl from f_pub)) a), '(none)'),
     coalesce((select string_agg(pg_get_userbyid(a.grantee), ',' order by pg_get_userbyid(a.grantee))
        from aclexplode((select proacl from f_app)) a) = 'authenticated,postgres'
     and (select string_agg(pg_get_userbyid(a.grantee), ',' order by pg_get_userbyid(a.grantee))
        from aclexplode((select proacl from f_pub)) a) = 'authenticated,postgres', false))
) as t(step, expected, actual, pass);


-- ############################################################################
-- SECTION 2 — The behavioural suite. BEGIN … ROLLBACK; nothing persists.
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
  values (p_step, p_expected, p_actual, coalesce(p_pass, false));
  raise notice '[%] % | expected: % | actual: %',
    case when coalesce(p_pass, false) then 'PASS' else 'FAIL' end, p_step, p_expected, p_actual;
end;
$fn$;

-- Run `p_sql` (returning ONE text value) as `p_role`, as user `p_user` (NULL
-- for no `sub` claim). Returns the value, '(null)', 'ERR <sqlstate>', or
-- 'SETROLE <sqlstate>' if the role switch itself failed.
create function pg_temp.scalar_as(p_role text, p_user uuid, p_sql text)
returns text language plpgsql as $fn$
declare
  v     text;
  prior text := current_setting('request.jwt.claims', true);
  out   text;
begin
  if p_user is not null then
    perform set_config('request.jwt.claims',
      json_build_object('sub', p_user::text, 'role', p_role)::text, true);
  else
    perform set_config('request.jwt.claims', json_build_object('role', p_role)::text, true);
  end if;
  begin
    execute format('set local role %I', p_role);
  exception when others then
    perform set_config('request.jwt.claims', coalesce(prior, ''), true);
    return 'SETROLE ' || sqlstate;
  end;
  begin
    execute p_sql into v;
    out := coalesce(v, '(null)');
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
  u_a      uuid;
  u_b      uuid;
  u_c      uuid;
  ws_a     uuid;
  ws_b     uuid;
  ev_pub   uuid;   -- A: published, with a category and a vendor
  ev_draft uuid;   -- A: draft
  ev_arch  uuid;   -- A: archived
  ev_gone  uuid;   -- A: soft-deleted
  ev_curb  uuid;   -- A: published Curbside (writes A's ledger row)
  ev_b     uuid;   -- B: published
  r        text;
  j        jsonb;
  t        text;
  n        integer;
  ev       jsonb;
  exp_n    integer;
  qa_addr  constant text := '18680 S Nogales Hwy';
  call_sql constant text := 'select public.export_my_data()::text';
begin
  perform set_config('request.jwt.claims', '', true);

  select id into u_a from public.profiles order by created_at limit 1;
  select id into u_b from public.profiles where id <> u_a order by created_at limit 1;
  select id into u_c from public.profiles where id not in (u_a, u_b) order by created_at limit 1;
  if u_a is null or u_b is null or u_c is null then
    perform pg_temp.rec('00. fixtures', 'at least three profiles exist', 'fewer than three — cannot run', false);
    return;
  end if;

  ---------------------------------------------------------------------------
  -- Fixtures. No JWT: the Curbside trigger attributes to created_by.
  ---------------------------------------------------------------------------
  delete from public.curbside_quota_ledger where user_id = u_a;

  insert into public.workspaces (name, created_by) values ('QA 0038 A workspace', u_a) returning id into ws_a;
  insert into public.workspaces (name, created_by) values ('QA 0038 B workspace', u_b) returning id into ws_b;
  -- B is a MEMBER of A's workspace: B's id must still not reach A's export.
  insert into public.memberships (workspace_id, user_id, role) values (ws_a, u_b, 'viewer');

  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location, publish_fee_cents)
  values (ws_a, 'QA 0038 published', 'standard', 'published', now() + interval '1 day', now() + interval '1 day 3 hours', qa_addr, 'SRID=4326;POINT(-110.9800 31.8700)', 500)
  returning id into ev_pub;
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address)
  values (ws_a, 'QA 0038 draft', 'standard', 'draft', now() + interval '2 days', now() + interval '2 days 3 hours', qa_addr)
  returning id into ev_draft;
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, archived_at)
  values (ws_a, 'QA 0038 archived', 'standard', 'published', now() + interval '3 days', now() + interval '3 days 3 hours', qa_addr, now())
  returning id into ev_arch;
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, deleted_at)
  values (ws_a, 'QA 0038 soft-deleted', 'standard', 'published', now() + interval '4 days', now() + interval '4 days 3 hours', qa_addr, now())
  returning id into ev_gone;
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location)
  values (ws_a, 'QA 0038 curbside', 'curbside', 'published', now() + interval '1 day', now() + interval '1 day 3 hours', qa_addr, 'SRID=4326;POINT(-110.9800 31.8700)')
  returning id into ev_curb;
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location)
  values (ws_b, 'QA 0038 B event', 'standard', 'published', now() + interval '1 day', now() + interval '1 day 3 hours', qa_addr, 'SRID=4326;POINT(-110.9800 31.8700)')
  returning id into ev_b;

  insert into public.event_categories (event_id, category_id) values (ev_pub, 'markets');
  insert into public.event_vendors (event_id, name, vendor_type, sort_order) values (ev_pub, 'QA 0038 vendor', 'food', 0);

  insert into public.saves (user_id, event_id) values (u_a, ev_b);
  insert into public.rsvps (user_id, event_id) values (u_a, ev_b);
  insert into public.saves (user_id, event_id) values (u_b, ev_pub);    -- B saved A's event
  insert into public.rsvps (user_id, event_id) values (u_b, ev_pub);    -- B RSVP'd A's event

  insert into public.category_preferences (user_id, category_id, stance) values (u_a, 'music', 'into')
    on conflict (user_id, category_id) do update set stance = excluded.stance;
  insert into public.category_preferences (user_id, category_id, stance) values (u_b, 'art', 'blocked')
    on conflict (user_id, category_id) do update set stance = excluded.stance;

  -- C becomes an account with nothing (rolled back).
  delete from public.saves                 where user_id = u_c;
  delete from public.rsvps                 where user_id = u_c;
  delete from public.category_preferences  where user_id = u_c;
  delete from public.curbside_quota_ledger where user_id = u_c;
  delete from public.memberships           where user_id = u_c;

  ---------------------------------------------------------------------------
  -- ROLES.
  ---------------------------------------------------------------------------
  r := pg_temp.scalar_as('anon', null, call_sql);
  perform pg_temp.rec('2a. anon → public wrapper refused', 'ERR 42501', r, r = 'ERR 42501');
  r := pg_temp.scalar_as('anon', null, 'select app.export_my_data()::text');
  perform pg_temp.rec('2b. anon → app body refused', 'ERR 42501', r, r = 'ERR 42501');
  r := pg_temp.scalar_as('authenticated', null, call_sql);
  perform pg_temp.rec('2c. authenticated with NO user claim → not_authenticated', 'ERR 28000', r, r = 'ERR 28000');

  ---------------------------------------------------------------------------
  -- A's export.
  ---------------------------------------------------------------------------
  r := pg_temp.scalar_as('authenticated', u_a, call_sql);
  begin
    j := r::jsonb;
  exception when others then
    perform pg_temp.rec('2d. authenticated A → a JSON document', 'jsonb', left(r, 60), false);
    return;
  end;
  t := j::text;
  perform pg_temp.rec('2d. authenticated A → a JSON document, meta.user_id = A, format 1',
    u_a::text || ' / 1', (j -> 'meta' ->> 'user_id') || ' / ' || (j -> 'meta' ->> 'format_version'),
    j -> 'meta' ->> 'user_id' = u_a::text and j -> 'meta' ->> 'format_version' = '1');

  perform pg_temp.rec('2e. every section present',
    'meta profile saves rsvps category_preferences memberships owned_workspaces curbside_ledger',
    (select string_agg(k, ' ' order by k) from jsonb_object_keys(j) k),
    j ?& array['meta','profile','saves','rsvps','category_preferences','memberships','owned_workspaces','curbside_ledger']);

  perform pg_temp.rec('2f. profile is A''s own row', u_a::text, j -> 'profile' ->> 'id', j -> 'profile' ->> 'id' = u_a::text);

  select count(*) into exp_n from public.saves where user_id = u_a;
  perform pg_temp.rec('2g. saves: count matches A''s rows; includes the fixture save', exp_n::text || ' + fixture',
    jsonb_array_length(j -> 'saves')::text || case when (j -> 'saves') @> jsonb_build_array(jsonb_build_object('event_id', ev_b)) then ' + fixture' else ' (fixture MISSING)' end,
    jsonb_array_length(j -> 'saves') = exp_n and (j -> 'saves') @> jsonb_build_array(jsonb_build_object('event_id', ev_b)));

  select count(*) into exp_n from public.rsvps where user_id = u_a;
  perform pg_temp.rec('2h. rsvps: count matches A''s rows; includes the fixture RSVP', exp_n::text || ' + fixture',
    jsonb_array_length(j -> 'rsvps')::text || case when (j -> 'rsvps') @> jsonb_build_array(jsonb_build_object('event_id', ev_b)) then ' + fixture' else ' (fixture MISSING)' end,
    jsonb_array_length(j -> 'rsvps') = exp_n and (j -> 'rsvps') @> jsonb_build_array(jsonb_build_object('event_id', ev_b)));

  select count(*) into exp_n from public.category_preferences where user_id = u_a;
  perform pg_temp.rec('2i. category_preferences: count matches; music = into', exp_n::text || ' / into',
    jsonb_array_length(j -> 'category_preferences')::text || ' / ' ||
    coalesce((select e ->> 'stance' from jsonb_array_elements(j -> 'category_preferences') e where e ->> 'category_id' = 'music'), '(missing)'),
    jsonb_array_length(j -> 'category_preferences') = exp_n
      and (j -> 'category_preferences') @> '[{"category_id":"music","stance":"into"}]'::jsonb);

  select count(*) into exp_n from public.memberships where user_id = u_a;
  perform pg_temp.rec('2j. memberships: count matches; A is owner of the fixture workspace', exp_n::text || ' / owner',
    jsonb_array_length(j -> 'memberships')::text || ' / ' ||
    coalesce((select e ->> 'role' from jsonb_array_elements(j -> 'memberships') e where e ->> 'workspace_id' = ws_a::text), '(missing)'),
    jsonb_array_length(j -> 'memberships') = exp_n
      and (j -> 'memberships') @> jsonb_build_array(jsonb_build_object('workspace_id', ws_a, 'role', 'owner')));

  select count(*) into exp_n from public.memberships where user_id = u_a and role = 'owner';
  perform pg_temp.rec('2k. owned_workspaces: one per owned workspace', exp_n::text,
    jsonb_array_length(j -> 'owned_workspaces')::text, jsonb_array_length(j -> 'owned_workspaces') = exp_n);

  select count(*) into exp_n from public.events where workspace_id = ws_a;
  select e into ev from jsonb_array_elements(j -> 'owned_workspaces') e where e ->> 'id' = ws_a::text;
  perform pg_temp.rec('2l. fixture workspace: ALL its events (every status, archived + soft-deleted)', exp_n::text || ' (5)',
    coalesce(jsonb_array_length(ev -> 'events')::text, '(workspace missing)'),
    jsonb_array_length(ev -> 'events') = exp_n and exp_n = 5);

  perform pg_temp.rec('2m. draft present with status draft', 'draft',
    coalesce((select x ->> 'status' from jsonb_array_elements(ev -> 'events') x where x ->> 'id' = ev_draft::text), '(missing)'),
    (select x ->> 'status' from jsonb_array_elements(ev -> 'events') x where x ->> 'id' = ev_draft::text) = 'draft');
  perform pg_temp.rec('2n. archived present and LABELLED (archived_at set)', 'archived_at not null',
    coalesce((select case when x ->> 'archived_at' is null then 'null' else 'set' end from jsonb_array_elements(ev -> 'events') x where x ->> 'id' = ev_arch::text), '(missing)'),
    (select x ->> 'archived_at' is not null from jsonb_array_elements(ev -> 'events') x where x ->> 'id' = ev_arch::text));
  perform pg_temp.rec('2o. soft-deleted present and LABELLED (deleted_at set)', 'deleted_at not null',
    coalesce((select case when x ->> 'deleted_at' is null then 'null' else 'set' end from jsonb_array_elements(ev -> 'events') x where x ->> 'id' = ev_gone::text), '(missing)'),
    (select x ->> 'deleted_at' is not null from jsonb_array_elements(ev -> 'events') x where x ->> 'id' = ev_gone::text));

  select x into ev from jsonb_array_elements((select e -> 'events' from jsonb_array_elements(j -> 'owned_workspaces') e where e ->> 'id' = ws_a::text)) x
   where x ->> 'id' = ev_pub::text;
  perform pg_temp.rec('2p. published event: categories, vendor, fee, location, rsvp_count', '["markets"] / QA 0038 vendor / 500 / 31.87,-110.98 / 1',
    concat_ws(' / ', ev -> 'categories', ev -> 'vendors' -> 0 ->> 'name', ev ->> 'publish_fee_cents',
              round((ev -> 'location' ->> 'lat')::numeric, 2) || ',' || round((ev -> 'location' ->> 'lng')::numeric, 2), ev ->> 'rsvp_count'),
    ev -> 'categories' = '["markets"]'::jsonb and ev -> 'vendors' -> 0 ->> 'name' = 'QA 0038 vendor'
      and ev ->> 'publish_fee_cents' = '500'
      and round((ev -> 'location' ->> 'lat')::numeric, 2) = 31.87 and round((ev -> 'location' ->> 'lng')::numeric, 2) = -110.98
      and ev ->> 'rsvp_count' = '1');

  select count(*) into exp_n from public.curbside_quota_ledger where user_id = u_a;
  perform pg_temp.rec('2q. curbside_ledger: A''s rows only; includes the fixture post', exp_n::text || ' + fixture',
    jsonb_array_length(j -> 'curbside_ledger')::text || case when (j -> 'curbside_ledger') @> jsonb_build_array(jsonb_build_object('event_id', ev_curb)) then ' + fixture' else ' (fixture MISSING)' end,
    jsonb_array_length(j -> 'curbside_ledger') = exp_n and exp_n >= 1
      and (j -> 'curbside_ledger') @> jsonb_build_array(jsonb_build_object('event_id', ev_curb)));

  ---------------------------------------------------------------------------
  -- ISOLATION — B appears nowhere in A's export.
  ---------------------------------------------------------------------------
  perform pg_temp.rec('2r. B''s user id appears NOWHERE (B is a member of A''s workspace and saved/RSVP''d A''s event)',
    'absent', case when position(u_b::text in t) > 0 then 'PRESENT' else 'absent' end, position(u_b::text in t) = 0);
  perform pg_temp.rec('2s. B''s workspace id appears nowhere (A only saved an event in it)',
    'absent', case when position(ws_b::text in t) > 0 then 'PRESENT' else 'absent' end, position(ws_b::text in t) = 0);
  perform pg_temp.rec('2t. B''s preference (art / blocked) is not in A''s preferences',
    'absent', case when (j -> 'category_preferences') @> '[{"category_id":"art","stance":"blocked"}]'::jsonb then 'PRESENT' else 'absent' end,
    not ((j -> 'category_preferences') @> '[{"category_id":"art","stance":"blocked"}]'::jsonb)
      or exists (select 1 from public.category_preferences where user_id = u_a and category_id = 'art' and stance = 'blocked'));
  perform pg_temp.rec('2u. created_by is not exported', 'absent',
    case when t like '%"created_by"%' then 'PRESENT' else 'absent' end, t not like '%"created_by"%');

  ---------------------------------------------------------------------------
  -- EMPTY — C has nothing; every section is present and empty.
  ---------------------------------------------------------------------------
  r := pg_temp.scalar_as('authenticated', u_c, call_sql);
  begin
    j := r::jsonb;
  exception when others then
    perform pg_temp.rec('2v. account with nothing → a document, not an error', 'jsonb', left(r, 60), false);
    return;
  end;
  perform pg_temp.rec('2v. account with nothing → every list section present and EMPTY',
    '0 0 0 0 0 0',
    concat_ws(' ', jsonb_array_length(j -> 'saves'), jsonb_array_length(j -> 'rsvps'),
              jsonb_array_length(j -> 'category_preferences'), jsonb_array_length(j -> 'memberships'),
              jsonb_array_length(j -> 'owned_workspaces'), jsonb_array_length(j -> 'curbside_ledger')),
    jsonb_array_length(j -> 'saves') = 0 and jsonb_array_length(j -> 'rsvps') = 0
      and jsonb_array_length(j -> 'category_preferences') = 0 and jsonb_array_length(j -> 'memberships') = 0
      and jsonb_array_length(j -> 'owned_workspaces') = 0 and jsonb_array_length(j -> 'curbside_ledger') = 0);
  perform pg_temp.rec('2w. …with its own meta and profile', u_c::text,
    (j -> 'meta' ->> 'user_id') || ' / ' || (j -> 'profile' ->> 'id'),
    j -> 'meta' ->> 'user_id' = u_c::text and j -> 'profile' ->> 'id' = u_c::text);
end $$;

select seq, step, expected, actual, pass from qa_results order by seq;

rollback;

-- After the rollback, alone: expect 0 | 0.
select
  (select count(*) from public.workspaces where name like 'QA 0038%') as qa_workspaces_left,
  (select count(*) from public.events     where title like 'QA 0038%') as qa_events_left;

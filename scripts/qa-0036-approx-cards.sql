-- ============================================================================
-- BEHAVIORAL SUITE — the three card read paths return
-- events.location_approximate (migration 0036).
--
-- WHERE TO RUN: Supabase Dashboard → SQL Editor, on the DEV project
-- (`Sparked-App`), AFTER 0036 is applied. Never against prod. The editor runs
-- as `postgres`; every behavioural case switches role explicitly inside the
-- transaction, because RLS and column grants do not apply to the owner.
--
-- HOW TO RUN: two sections, one at a time. Section 1 is READ-ONLY — paste it
-- and Run. Section 2 is BEGIN … ROLLBACK: highlight from `begin;` down to and
-- including the `select seq, step, …` line, Run selected (the editor shows only
-- the LAST statement's result, and the grid must be last); then run
-- `rollback;` alone; then the final `select count(*) …` alone — expect 0.
-- Every row of both grids should read pass = true.
--
-- ---------------------------------------------------------------------------
-- SHAPE: per role AND per branch (CLAUDE.md, "Catalog-verified is not
-- behaviour-verified").
--
--   FEED (events_within_radius, definer — no RLS branches; its own WHERE):
--     anon and authenticated each get the flag — false by default, true on a
--     flagged row — and the visibility controls still hold: a draft, an
--     archived event and an ENDED Curbside post are absent.
--   ORGANIZER PROFILE (definer): anon gets the key on every event object,
--     false / true; a draft and an archived event are still absent.
--   SAVED (direct read of public.events under events_select_public): the new
--     column grant, read through each policy branch that admits a row:
--       branch 2 (storefront)  — a stranger reads a flagged published row;
--       branch 3 (history)     — an attendee reads an ended + ARCHIVED row
--                                (archived shuts branch 2, so only 3 admits);
--       branch 1 (member)      — the host reads the flagged DRAFT;
--       control                — a third account with no attendance gets 0 rows
--                                on the ended + archived row;
--       anon                   — the column raises 42501 (no grant), while a
--                                read WITHOUT the column still succeeds, so the
--                                error is the column, not a lost table grant.
--
-- The QA address is 18680 S Nogales Hwy; fixture points are fixed coordinates
-- near Sahuarita written as untyped literals (the client's own shape).
-- ============================================================================


-- ############################################################################
-- SECTION 1 — Catalog and privilege state. READ-ONLY. Run this first.
--
-- PUBLIC is a pseudo-role, so 1c reads the ACL directly: an aclitem with an
-- EMPTY grantee is PUBLIC (`=X/owner`). A NULL proacl is the default, which
-- includes PUBLIC, and fails too.
--
-- 1g–1i are the verbatim-transcription guards: strip the one added line from
-- each new body and it must hash to the committed definition (0031 PART A /
-- 0031 PART B / 0030 PART F). `chr(13)` is stripped in case of CRLF.
-- ############################################################################
with fn as (
  select n.nspname as schema, p.proname as name, p.oid, p.prosrc, p.proacl, p.prosecdef, p.proconfig,
         p.proargmodes, p.proargnames, pg_get_function_identity_arguments(p.oid) as args
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where p.proname in ('events_within_radius', 'organizer_profile') and n.nspname in ('app', 'public')
),
ewr_app as (select * from fn where schema = 'app' and name = 'events_within_radius'),
ewr_pub as (select * from fn where schema = 'public' and name = 'events_within_radius'),
org_app as (select * from fn where schema = 'app' and name = 'organizer_profile'),
org_pub as (select * from fn where schema = 'public' and name = 'organizer_profile')
select * from (values
    ('1a. exactly one events_within_radius per schema (5 args; the 3-arg pair stays gone)',
     '1 | 1',
     (select count(*) from ewr_app)::text || ' | ' || (select count(*) from ewr_pub)::text,
     (select count(*) from ewr_app) = 1 and (select count(*) from ewr_pub) = 1
       and (select args from ewr_pub) = 'origin_lat double precision, origin_lng double precision, radius_miles double precision, window_from timestamp with time zone, window_to timestamp with time zone'),

    ('1b. both feed functions return 12 columns, the last location_approximate',
     '12 location_approximate | 12 location_approximate',
     (select (select count(*) from unnest(proargmodes) m where m = 't')::text || ' ' || proargnames[array_length(proargnames, 1)] from ewr_app)
     || ' | ' ||
     (select (select count(*) from unnest(proargmodes) m where m = 't')::text || ' ' || proargnames[array_length(proargnames, 1)] from ewr_pub),
     (select (select count(*) from unnest(proargmodes) m where m = 't') = 12 and proargnames[array_length(proargnames, 1)] = 'location_approximate' from ewr_app)
     and (select (select count(*) from unnest(proargmodes) m where m = 't') = 12 and proargnames[array_length(proargnames, 1)] = 'location_approximate' from ewr_pub)),

    ('1c. TARGET: no PUBLIC EXECUTE on any of the four (and no NULL/default ACL)',
     'none',
     coalesce((select string_agg(schema || '.' || name, ', ') from fn
                where proacl is null
                   or exists (select 1 from unnest(proacl) a where a::text like '=%')), 'none'),
     not exists (select 1 from fn where proacl is null
                   or exists (select 1 from unnest(proacl) a where a::text like '=%'))),

    ('1d. anon + authenticated EXECUTE all four',
     'true ×8',
     (select string_agg(r::text, ' ') from (values
        (has_function_privilege('anon', (select oid from ewr_app), 'execute')),
        (has_function_privilege('authenticated', (select oid from ewr_app), 'execute')),
        (has_function_privilege('anon', (select oid from ewr_pub), 'execute')),
        (has_function_privilege('authenticated', (select oid from ewr_pub), 'execute')),
        (has_function_privilege('anon', (select oid from org_app), 'execute')),
        (has_function_privilege('authenticated', (select oid from org_app), 'execute')),
        (has_function_privilege('anon', (select oid from org_pub), 'execute')),
        (has_function_privilege('authenticated', (select oid from org_pub), 'execute'))) v(r)),
     (select bool_and(r) from (values
        (has_function_privilege('anon', (select oid from ewr_app), 'execute')),
        (has_function_privilege('authenticated', (select oid from ewr_app), 'execute')),
        (has_function_privilege('anon', (select oid from ewr_pub), 'execute')),
        (has_function_privilege('authenticated', (select oid from ewr_pub), 'execute')),
        (has_function_privilege('anon', (select oid from org_app), 'execute')),
        (has_function_privilege('authenticated', (select oid from org_app), 'execute')),
        (has_function_privilege('anon', (select oid from org_pub), 'execute')),
        (has_function_privilege('authenticated', (select oid from org_pub), 'execute'))) v(r))),

    ('1e. security + search_path unchanged (ewr app / ewr public / org app)',
     'true public, app, extensions | false public, app | true public, app',
     (select prosecdef::text || ' ' || replace(array_to_string(proconfig, ', '), 'search_path=', '') from ewr_app) || ' | ' ||
     (select prosecdef::text || ' ' || replace(array_to_string(proconfig, ', '), 'search_path=', '') from ewr_pub) || ' | ' ||
     (select prosecdef::text || ' ' || replace(array_to_string(proconfig, ', '), 'search_path=', '') from org_app),
     (select prosecdef and array_to_string(proconfig, ', ') = 'search_path=public, app, extensions' from ewr_app)
     and (select not prosecdef and array_to_string(proconfig, ', ') = 'search_path=public, app' from ewr_pub)
     and (select prosecdef and array_to_string(proconfig, ', ') = 'search_path=public, app' from org_app)),

    ('1f. organizer_profile still returns its 9 columns (app + public): no return-type change',
     '9 | 9',
     (select (select count(*) from unnest(proargmodes) m where m = 't')::text from org_app) || ' | ' ||
     (select (select count(*) from unnest(proargmodes) m where m = 't')::text from org_pub),
     (select (select count(*) from unnest(proargmodes) m where m = 't') = 9 from org_app)
     and (select (select count(*) from unnest(proargmodes) m where m = 't') = 9 from org_pub)),

    ('1g. VERBATIM: app.events_within_radius minus the added line hashes to 0031 PART A',
     '9831f5266a3375f1969a8b805b1ca4f6',
     (select md5(replace(replace(prosrc, chr(13), ''), E',\n    e.location_approximate', '')) from ewr_app),
     (select md5(replace(replace(prosrc, chr(13), ''), E',\n    e.location_approximate', '')) from ewr_app)
       = '9831f5266a3375f1969a8b805b1ca4f6'),

    ('1h. VERBATIM: public.events_within_radius body hashes to 0031 PART B (unchanged)',
     'ad585dad44115e5305dc139a2c5ba90b',
     (select md5(replace(prosrc, chr(13), '')) from ewr_pub),
     (select md5(replace(prosrc, chr(13), '')) from ewr_pub) = 'ad585dad44115e5305dc139a2c5ba90b'),

    ('1i. VERBATIM: app.organizer_profile minus the added CTE line hashes to 0030 PART F',
     '694d8257729b7615d238050d94139ec5',
     (select md5(replace(replace(prosrc, chr(13), ''), E'\n      e.location_approximate,', '')) from org_app),
     (select md5(replace(replace(prosrc, chr(13), ''), E'\n      e.location_approximate,', '')) from org_app)
       = '694d8257729b7615d238050d94139ec5'),

    ('1j. public.organizer_profile NOT replaced: body still 0023 PART B',
     '6f9545b7b2c33d393e72c4ae940f9a0e',
     (select md5(replace(prosrc, chr(13), '')) from org_pub),
     (select md5(replace(prosrc, chr(13), '')) from org_pub) = '6f9545b7b2c33d393e72c4ae940f9a0e'),

    ('1k. authenticated SELECT on events.location_approximate (the new grant)',
     'true',
     has_column_privilege('authenticated', 'public.events', 'location_approximate', 'select')::text,
     has_column_privilege('authenticated', 'public.events', 'location_approximate', 'select')),

    ('1l. anon has NO SELECT / INSERT / UPDATE on the column',
     'false false false',
     has_column_privilege('anon', 'public.events', 'location_approximate', 'select')::text || ' ' ||
     has_column_privilege('anon', 'public.events', 'location_approximate', 'insert')::text || ' ' ||
     has_column_privilege('anon', 'public.events', 'location_approximate', 'update')::text,
     not has_column_privilege('anon', 'public.events', 'location_approximate', 'select')
     and not has_column_privilege('anon', 'public.events', 'location_approximate', 'insert')
     and not has_column_privilege('anon', 'public.events', 'location_approximate', 'update')),

    ('1m. 0035 grants intact: authenticated INSERT + UPDATE on the column',
     'true true',
     has_column_privilege('authenticated', 'public.events', 'location_approximate', 'insert')::text || ' ' ||
     has_column_privilege('authenticated', 'public.events', 'location_approximate', 'update')::text,
     has_column_privilege('authenticated', 'public.events', 'location_approximate', 'insert')
     and has_column_privilege('authenticated', 'public.events', 'location_approximate', 'update')),

    ('1n. events TABLE-level grants to client roles unchanged: only authenticated DELETE',
     'authenticated:DELETE',
     (select coalesce(string_agg(pg_get_userbyid(acl.grantee) || ':' || acl.privilege_type, ', '), '(none)')
        from aclexplode((select relacl from pg_class where oid = 'public.events'::regclass)) acl
       where acl.grantee <> 0 and pg_get_userbyid(acl.grantee) in ('anon', 'authenticated')),
     (select coalesce(string_agg(pg_get_userbyid(acl.grantee) || ':' || acl.privilege_type, ', '), '(none)')
        from aclexplode((select relacl from pg_class where oid = 'public.events'::regclass)) acl
       where acl.grantee <> 0 and pg_get_userbyid(acl.grantee) in ('anon', 'authenticated')) = 'authenticated:DELETE')
) as t(step, expected, actual, pass);


-- ############################################################################
-- SECTION 2 — The behavioural suite. BEGIN … ROLLBACK; nothing persists.
--
-- Every read goes through one helper that runs a scalar query as a role and
-- returns its value as text, or `ERR <sqlstate>` — a 42501 shows in the grid,
-- never as a silent empty result.
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

-- Run `p_sql` (a query returning ONE text value) as `p_role`, as user `p_user`
-- (NULL for anon). Returns the value, '(null)', or 'ERR <sqlstate>'. Restores
-- role and the prior claim on every path.
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
    perform set_config('request.jwt.claims', '', true);
  end if;
  execute format('set local role %I', p_role);
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
  u_host     uuid;
  u_attendee uuid;   -- no membership: the "stranger" for branch 2 as well
  u_other    uuid;   -- no membership, no attendance
  ws         uuid;
  ev_pub     uuid;   -- published, future, flag default (false)
  ev_ap      uuid;   -- published, future, flag TRUE
  ev_draft   uuid;   -- draft, flag true: only branch 1 admits it
  ev_arch    uuid;   -- published, future, ARCHIVED: out of the feed and profile
  ev_hist    uuid;   -- published, ENDED, ARCHIVED, attendee RSVPd: only branch 3
  ev_curb    uuid;   -- an existing ENDED Curbside post (fixture; never inserted)
  feed_sql   text;
  prof_sql   text;
  n          integer;
  r          text;
  j          jsonb;
  qa_addr    constant text := '18680 S Nogales Hwy';
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

  insert into public.workspaces (name, created_by) values ('QA 0036 workspace', u_host) returning id into ws;
  select count(*) into n from public.memberships where workspace_id = ws and user_id = u_host and role = 'owner';
  perform pg_temp.rec('00a. fixture: owner membership auto-seeded (0001 trigger)', '1', n::text, n = 1);

  -- Standard tier throughout: a Curbside insert would consume a quota credit.
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location)
  values (ws, 'QA 0036 published', 'standard', 'published', now() + interval '1 day', now() + interval '1 day 3 hours', qa_addr, 'SRID=4326;POINT(-110.9800 31.8700)')
  returning id into ev_pub;
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location, location_approximate)
  values (ws, 'QA 0036 approximate', 'standard', 'published', now() + interval '1 day', now() + interval '1 day 3 hours', qa_addr, 'SRID=4326;POINT(-110.9800 31.8700)', true)
  returning id into ev_ap;
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location, location_approximate)
  values (ws, 'QA 0036 draft', 'standard', 'draft', now() + interval '2 days', now() + interval '2 days 3 hours', qa_addr, 'SRID=4326;POINT(-110.9800 31.8700)', true)
  returning id into ev_draft;
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location, archived_at)
  values (ws, 'QA 0036 archived', 'standard', 'published', now() + interval '1 day', now() + interval '1 day 3 hours', qa_addr, 'SRID=4326;POINT(-110.9800 31.8700)', now())
  returning id into ev_arch;
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location, archived_at)
  values (ws, 'QA 0036 ended archived', 'standard', 'published', now() - interval '3 days', now() - interval '3 days' + interval '3 hours', qa_addr, 'SRID=4326;POINT(-110.9800 31.8700)', now())
  returning id into ev_hist;
  insert into public.rsvps (user_id, event_id) values (u_attendee, ev_hist);

  -- An ENDED Curbside post that would otherwise qualify for the feed (published,
  -- live lifecycle, has a location) — 0030's guard is what must keep it out.
  select e.id into ev_curb from public.events e
   where e.tier_id = 'curbside' and e.status = 'published' and e.deleted_at is null
     and e.archived_at is null and e.location is not null
     and app.curbside_expired(e.tier_id, e.starts_at, e.ends_at)
   order by e.starts_at desc limit 1;
  perform pg_temp.rec('00b. fixture: an ended, otherwise-feed-eligible Curbside post exists',
                      'an id', coalesce(ev_curb::text, 'NONE — 2f cannot run'), ev_curb is not null);

  r := pg_temp.scalar_as('authenticated', u_host, 'select auth.uid()::text');
  perform pg_temp.rec('2a. auth.uid() as authenticated with sub=<host> resolves to the host', u_host::text, r, r = u_host::text);

  ---------------------------------------------------------------------------
  -- FEED — the 5-arg wrapper, as anon and as authenticated. A 100-mile radius
  -- and an unbounded window so every fixture is a candidate and only the WHERE
  -- clause decides. Returns {id: flag} for our fixtures.
  ---------------------------------------------------------------------------
  feed_sql := format(
    'select coalesce(jsonb_object_agg(f.id, f.location_approximate), ''{}''::jsonb)::text
       from public.events_within_radius(31.8700, -110.9800, 100, ''-infinity'', ''infinity'') f
      where f.id in (%L, %L, %L, %L, %L, %L)',
    ev_pub, ev_ap, ev_draft, ev_arch, ev_hist, coalesce(ev_curb, ev_pub));

  r := pg_temp.scalar_as('anon', null, feed_sql);
  j := case when r like 'ERR%' then null else r::jsonb end;
  perform pg_temp.rec('2b. FEED anon: published row → flag false (default)', 'false', coalesce(j ->> ev_pub::text, r), j ->> ev_pub::text = 'false');
  perform pg_temp.rec('2c. FEED anon: flagged row → true', 'true', coalesce(j ->> ev_ap::text, r), j ->> ev_ap::text = 'true');
  perform pg_temp.rec('2d. FEED anon: draft, archived, ended+archived all ABSENT (visibility unchanged)', 'absent',
    case when j is null then r else concat_ws(' ', nullif(j ? ev_draft::text, false)::text, nullif(j ? ev_arch::text, false)::text, nullif(j ? ev_hist::text, false)::text) end,
    j is not null and not (j ? ev_draft::text) and not (j ? ev_arch::text) and not (j ? ev_hist::text));
  perform pg_temp.rec('2e. FEED anon: exactly the two published fixtures returned', '2',
    coalesce((select count(*) from jsonb_object_keys(j) k where k in (ev_pub::text, ev_ap::text, ev_draft::text, ev_arch::text, ev_hist::text))::text, r),
    (select count(*) from jsonb_object_keys(j) k where k in (ev_pub::text, ev_ap::text, ev_draft::text, ev_arch::text, ev_hist::text)) = 2);
  perform pg_temp.rec('2f. FEED anon: the ended Curbside fixture is ABSENT (0030 guard intact)', 'absent',
    case when ev_curb is null then 'no fixture' when j is null then r when j ? ev_curb::text then 'PRESENT' else 'absent' end,
    ev_curb is not null and j is not null and not (j ? ev_curb::text));

  r := pg_temp.scalar_as('authenticated', u_attendee, feed_sql);
  j := case when r like 'ERR%' then null else r::jsonb end;
  perform pg_temp.rec('2g. FEED authenticated: flagged true, default false', 'true / false',
    coalesce((j ->> ev_ap::text) || ' / ' || (j ->> ev_pub::text), r),
    j ->> ev_ap::text = 'true' and j ->> ev_pub::text = 'false');
  perform pg_temp.rec('2h. FEED authenticated: draft, archived, ended+archived, ended Curbside ABSENT', 'absent',
    case when j is null then r else 'checked' end,
    j is not null and not (j ? ev_draft::text) and not (j ? ev_arch::text) and not (j ? ev_hist::text)
      and (ev_curb is null or not (j ? ev_curb::text)));

  ---------------------------------------------------------------------------
  -- ORGANIZER PROFILE — as anon. {id: flag-or-"MISSING"} over upcoming + past.
  ---------------------------------------------------------------------------
  prof_sql := format(
    'select coalesce(jsonb_object_agg(o ->> ''id'', coalesce(o -> ''location_approximate'', ''"MISSING"''::jsonb)), ''{}''::jsonb)::text
       from public.organizer_profile(%L) p,
            lateral jsonb_array_elements(p.upcoming || p.past) o',
    ws);
  r := pg_temp.scalar_as('anon', null, prof_sql);
  j := case when r like 'ERR%' then null else r::jsonb end;
  perform pg_temp.rec('2i. PROFILE anon: published object carries the key, false', 'false', coalesce(j ->> ev_pub::text, r), j ->> ev_pub::text = 'false');
  perform pg_temp.rec('2j. PROFILE anon: flagged object carries the key, true', 'true', coalesce(j ->> ev_ap::text, r), j ->> ev_ap::text = 'true');
  perform pg_temp.rec('2k. PROFILE anon: no object is missing the key', '0',
    coalesce((select count(*) from jsonb_each(j) e where e.value = '"MISSING"'::jsonb)::text, r),
    (select count(*) from jsonb_each(j) e where e.value = '"MISSING"'::jsonb) = 0);
  perform pg_temp.rec('2l. PROFILE anon: draft and archived still ABSENT (visibility unchanged)', 'absent',
    case when j is null then r else 'checked' end,
    j is not null and not (j ? ev_draft::text) and not (j ? ev_arch::text) and not (j ? ev_hist::text));

  ---------------------------------------------------------------------------
  -- SAVED — the direct read and the new column grant, per policy branch.
  ---------------------------------------------------------------------------
  r := pg_temp.scalar_as('authenticated', u_attendee,
         format('select string_agg(location_approximate::text, '','') from public.events where id = %L', ev_ap));
  perform pg_temp.rec('2m. SAVED stranger, branch 2: reads the flagged published row', 'true', r, r = 'true');

  r := pg_temp.scalar_as('authenticated', u_attendee,
         format('select string_agg(location_approximate::text, '','') from public.events where id = %L', ev_hist));
  perform pg_temp.rec('2n. SAVED attendee, branch 3: ended + archived + RSVP → 1 row, false', 'false', r, r = 'false');

  r := pg_temp.scalar_as('authenticated', u_other,
         format('select count(*)::text from public.events where id = %L', ev_hist));
  perform pg_temp.rec('2o. CONTROL: no attendance → 0 rows on the ended + archived row', '0', r, r = '0');

  r := pg_temp.scalar_as('authenticated', u_host,
         format('select string_agg(location_approximate::text, '','') from public.events where id = %L', ev_draft));
  perform pg_temp.rec('2p. host, branch 1: reads the flagged DRAFT', 'true', r, r = 'true');

  r := pg_temp.scalar_as('anon', null,
         format('select string_agg(location_approximate::text, '','') from public.events where id = %L', ev_pub));
  perform pg_temp.rec('2q. anon: selecting the column is refused', 'ERR 42501', r, r = 'ERR 42501');

  r := pg_temp.scalar_as('anon', null,
         format('select count(*)::text from public.events where id = %L', ev_pub));
  perform pg_temp.rec('2r. CONTROL anon: the same row WITHOUT the column still reads (1)', '1', r, r = '1');
end $$;

select seq, step, expected, actual, pass from qa_results order by seq;

rollback;

-- After the rollback, alone: expect 0.
select count(*) as qa_rows_left from public.events where title like 'QA 0036%';

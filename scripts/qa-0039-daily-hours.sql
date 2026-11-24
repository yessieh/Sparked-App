-- ============================================================================
-- BEHAVIORAL SUITE — daily hours (migration 0039): events.hours, its
-- validation trigger, and the read paths that carry it.
--
-- WHERE TO RUN: Supabase Dashboard → SQL Editor, on the DEV project
-- (`Sparked-App`, ref kzynvvdggooqgtnprhrm), AFTER 0039 is applied. Never
-- against prod. The editor runs as `postgres`; every role case switches role
-- explicitly inside the transaction.
--
-- HOW TO RUN: two sections, each in a NEW tab. Section 1 is READ-ONLY — paste
-- and Run. Section 2 is BEGIN … ROLLBACK: highlight from `begin;` down to and
-- including the `select seq, step, …` line, Run selected; then run `rollback;`
-- alone; then the final check alone — expect 0 | 0. Every row of both grids
-- should read pass = true. Rows marked INFO record what Postgres does with an
-- UNVERIFIED premise: read `actual` against `expected`, nothing depends on it.
--
-- WHAT SECTION 2 TOUCHES, INSIDE THE TRANSACTION ONLY. It borrows three
-- existing profiles (host, attendee, other — no auth.users rows are minted,
-- qa-0018's reason) and clears the host's and the attendee's ledger rows so
-- Curbside fixtures cannot hit the quota. The ROLLBACK undoes all of it.
--
-- ---------------------------------------------------------------------------
-- SHAPE: per role AND per branch (CLAUDE.md, "Catalog-verified is not
-- behaviour-verified").
--   VALIDATION  every named error, plus the accepted shapes.
--   WRITES      authenticated host inserts / updates hours with the trigger
--               firing; a non-member is refused; a Curbside post WITH hours is
--               one statement, and a refused one spends no free credit.
--   FEED        anon AND authenticated: closed day hidden, between windows
--               shown, no-hours unchanged, exclusions hold.
--   DETAIL      anon storefront, stranger, host draft, attendee history.
--   PROFILE     anon.    EXPORT  the host.
--   DIRECT READ member (branch 1), stranger (branch 2), attendee history
--               (branch 3), a no-attendance control, anon refused.
--
-- QA address: 18680 S Nogales Hwy.
-- ============================================================================


-- ############################################################################
-- SECTION 1 — Catalog and privilege state. READ-ONLY. Run this first.
-- An aclitem with an EMPTY grantee (`=X/owner`) is PUBLIC; a NULL proacl is
-- the default, which includes PUBLIC, and fails too. CR is stripped before
-- hashing.
-- ############################################################################
with fn as (
  select n.nspname || '.' || p.proname as name, p.oid, p.proacl, p.prosecdef,
         replace(coalesce(array_to_string(p.proconfig, ', '), ''), 'search_path=', '') as path,
         md5(replace(p.prosrc, chr(13), '')) as hash,
         p.proargnames[array_length(p.proargnames, 1)] as last_arg,
         (select count(*) from unnest(p.proargmodes) m where m::text = 't') as out_cols
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('app', 'public')
    and p.proname in ('events_within_radius', 'event_detail', 'organizer_profile', 'export_my_data',
                      'validate_event_hours', 'enforce_curbside_span', 'curbside_expired', 'duration_band')
),
grantees as (
  select f.name,
         string_agg(case when a.grantee = 0 then 'PUBLIC' else pg_get_userbyid(a.grantee)::text end, ','
                    order by case when a.grantee = 0 then 'PUBLIC' else pg_get_userbyid(a.grantee)::text end) as who
  from fn f cross join lateral aclexplode(f.proacl) a
  group by f.name
),
want(name, hash) as (values
  ('app.events_within_radius',    '9a202499ac3526bf02ececd46dba6bbd'),
  ('public.events_within_radius', 'ad585dad44115e5305dc139a2c5ba90b'),
  ('app.event_detail',            '0bd68212c87c9f186ace12ff7eea865a'),
  ('public.event_detail',         '7c4969aebd532a9ac291452adc95dc0f'),
  ('app.organizer_profile',       'efaf088be723100255b9108fbb8e6300'),
  ('app.export_my_data',          'e7a375e37214a0fee0a3819428375575')
),
same(name, hash) as (values
  ('app.enforce_curbside_span', 'c5cb9c3cfb2f09908ff146672230ab96'),
  ('app.curbside_expired',      'd26cbf90da7abf1b3fa7c03256aa21e3'),
  ('app.duration_band',         'fb035c761475923f6dc64c65c1e1fde8'),
  ('public.organizer_profile',  '6f9545b7b2c33d393e72c4ae940f9a0e'),
  ('public.export_my_data',     '226b7f07593424f08d36d171e389df89')
),
trg as (
  select pg_get_triggerdef(t.oid) as def, t.tgenabled::text as enabled,
         (select string_agg(a.attname::text, ',' order by a.attname::text) from pg_attribute a
           where a.attrelid = t.tgrelid and a.attnum = any (t.tgattr::int2[])) as cols
  from pg_trigger t
  where t.tgrelid = 'public.events'::regclass and t.tgname = 'events_validate_hours'
)
select * from (values
    ('1a. events.hours: jsonb, nullable, no default',
     'jsonb | nullable | no default',
     coalesce((select format_type(a.atttypid, a.atttypmod)
                      || case when a.attnotnull then ' | not null' else ' | nullable' end
                      || case when a.atthasdef then ' | default' else ' | no default' end
                 from pg_attribute a where a.attrelid = 'public.events'::regclass and a.attname = 'hours'), '(missing)'),
     coalesce((select format_type(a.atttypid, a.atttypmod) = 'jsonb' and not a.attnotnull and not a.atthasdef
                 from pg_attribute a where a.attrelid = 'public.events'::regclass and a.attname = 'hours'), false)),

    ('1b. trigger: BEFORE INSERT OR UPDATE OF hours, starts_at, ends_at, FOR EACH ROW, enabled',
     'BEFORE INSERT OR UPDATE OF hours, starts_at, ends_at … | O',
     coalesce((select def || ' | ' || enabled from trg), '(missing)'),
     coalesce((select def like '%BEFORE INSERT OR UPDATE OF % ON public.events FOR EACH ROW%'
                      and cols = 'ends_at,hours,starts_at'
                      and def like '%app.validate_event_hours()%' and enabled = 'O' from trg), false)),

    ('1c. app.validate_event_hours: invoker, pinned, EXECUTE owner only',
     'false | pg_catalog | postgres',
     coalesce((select f.prosecdef::text || ' | ' || f.path || ' | ' || coalesce(g.who, '(default ACL)')
                 from fn f left join grantees g on g.name = f.name where f.name = 'app.validate_event_hours'), '(missing)'),
     coalesce((select not f.prosecdef and f.path = 'pg_catalog' and g.who = 'postgres'
                 from fn f left join grantees g on g.name = f.name where f.name = 'app.validate_event_hours'), false)),

    ('1d. the six recreated / replaced bodies are exactly 0039''s',
     'all 6 match',
     coalesce((select string_agg(w.name || ' ' || coalesce(f.hash, 'MISSING'), '; ')
                 from want w left join fn f on f.name = w.name where f.hash is distinct from w.hash), 'all 6 match'),
     not exists (select 1 from want w left join fn f on f.name = w.name where f.hash is distinct from w.hash)),

    ('1e. UNTOUCHED: Curbside span, curbside_expired, duration_band, two wrappers',
     'all 5 match',
     coalesce((select string_agg(s.name || ' ' || coalesce(f.hash, 'MISSING'), '; ')
                 from same s left join fn f on f.name = s.name where f.hash is distinct from s.hash), 'all 5 match'),
     not exists (select 1 from same s left join fn f on f.name = s.name where f.hash is distinct from s.hash)),

    ('1f. TARGET: no PUBLIC EXECUTE (and no default ACL) on the six + the validator',
     'none',
     coalesce((select string_agg(f.name, ', ') from fn f
                where (f.name in (select name from want) or f.name = 'app.validate_event_hours')
                  and (f.proacl is null or exists (select 1 from unnest(f.proacl) a where a::text like '=%'))), 'none'),
     not exists (select 1 from fn f
                  where (f.name in (select name from want) or f.name = 'app.validate_event_hours')
                    and (f.proacl is null or exists (select 1 from unnest(f.proacl) a where a::text like '=%')))),

    ('1g. grantees: feed, detail, profile = anon,authenticated,postgres; export = authenticated,postgres',
     'all 6 as expected',
     coalesce((select string_agg(w.name || ' ' || coalesce(g.who, '(none)'), '; ')
                 from want w left join grantees g on g.name = w.name
                where g.who is distinct from case when w.name = 'app.export_my_data'
                        then 'authenticated,postgres' else 'anon,authenticated,postgres' end), 'all 6 as expected'),
     not exists (select 1 from want w left join grantees g on g.name = w.name
                  where g.who is distinct from case when w.name = 'app.export_my_data'
                          then 'authenticated,postgres' else 'anon,authenticated,postgres' end)),

    ('1h. one function per name; security and search_path as before',
     '6 | 0 differences',
     (select count(*) from fn f join want w on w.name = f.name)::text || ' | ' ||
     (select count(*) from fn f join want w on w.name = f.name
       where f.prosecdef is distinct from (f.name like 'app.%')
          or f.path is distinct from case
               when f.name in ('app.organizer_profile') or f.name like 'public.%' then 'public, app'
               else 'public, app, extensions' end)::text || ' differences',
     (select count(*) from fn f join want w on w.name = f.name) = 6
     and not exists (select 1 from fn f join want w on w.name = f.name
       where f.prosecdef is distinct from (f.name like 'app.%')
          or f.path is distinct from case
               when f.name in ('app.organizer_profile') or f.name like 'public.%' then 'public, app'
               else 'public, app, extensions' end)),

    ('1i. OUT columns: feed pair 13, detail pair 18, all ending in hours',
     '13 13 18 18 | hours',
     (select string_agg(out_cols::text, ' ' order by case when name like '%radius' then 0 else 1 end, name)
        from fn where name like '%events_within_radius' or name like '%event_detail')
     || ' | ' || (select string_agg(distinct last_arg, ',') from fn where name like '%events_within_radius' or name like '%event_detail'),
     (select bool_and(last_arg = 'hours' and out_cols = case when name like '%radius' then 13 else 18 end)
        from fn where name like '%events_within_radius' or name like '%event_detail')),

    ('1j. grants on events.hours: authenticated SELECT INSERT UPDATE; anon none',
     'true true true | false false false',
     has_column_privilege('authenticated', 'public.events', 'hours', 'select')::text || ' ' ||
     has_column_privilege('authenticated', 'public.events', 'hours', 'insert')::text || ' ' ||
     has_column_privilege('authenticated', 'public.events', 'hours', 'update')::text || ' | ' ||
     has_column_privilege('anon', 'public.events', 'hours', 'select')::text || ' ' ||
     has_column_privilege('anon', 'public.events', 'hours', 'insert')::text || ' ' ||
     has_column_privilege('anon', 'public.events', 'hours', 'update')::text,
     has_column_privilege('authenticated', 'public.events', 'hours', 'select')
     and has_column_privilege('authenticated', 'public.events', 'hours', 'insert')
     and has_column_privilege('authenticated', 'public.events', 'hours', 'update')
     and not has_column_privilege('anon', 'public.events', 'hours', 'select')
     and not has_column_privilege('anon', 'public.events', 'hours', 'insert')
     and not has_column_privilege('anon', 'public.events', 'hours', 'update')),

    ('1k. INFO: text→timestamptz conversion volatility (premise: not immutable)',
     's (stable)',
     (select provolatile::text from pg_proc where oid = 'pg_catalog.timestamptz_in'::regproc),
     true)
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

-- Record a plain text comparison.
create function pg_temp.eq(p_step text, p_expected text, p_actual text)
returns void language sql as $fn$
  select pg_temp.rec(p_step, p_expected, p_actual, p_actual is not distinct from p_expected);
$fn$;

-- One window, written the way the client writes it (UTC, trailing Z).
create function pg_temp.win(p_opens timestamptz, p_closes timestamptz)
returns jsonb language sql as $fn$
  select jsonb_build_object(
    'opens_at',  to_char(p_opens  at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'closes_at', to_char(p_closes at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'));
$fn$;

-- Try to insert a draft Standard event as postgres with these hours. Returns
-- 'ok' or the error's message. Triggers fire for the owner too.
create function pg_temp.try_hours(p_ws uuid, p_starts timestamptz, p_ends timestamptz, p_hours jsonb)
returns text language plpgsql as $fn$
begin
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, hours)
  values (p_ws, 'QA 0039 validation', 'standard', 'draft', p_starts, p_ends, '18680 S Nogales Hwy', p_hours);
  return 'ok';
exception when others then
  return sqlerrm;
end;
$fn$;

-- Run `p_sql` (returning ONE text value) as `p_role`, as user `p_user` (NULL
-- for no `sub` claim). Returns the value, '(null)', 'ERR <sqlstate>' (with the
-- message for 23514, so a named error is readable), or 'SETROLE <sqlstate>' if
-- the role switch itself failed.
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
    out := 'ERR ' || sqlstate || case when sqlstate = '23514' then ' ' || sqlerrm else '' end;
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
  u_host  uuid;
  u_att   uuid;   -- attendee: RSVPd ev_hist; owner of ws_att; never in ws
  u_other uuid;   -- no membership, no attendance
  ws      uuid;
  ws_att  uuid;
  ev_h    uuid;   -- published WITH hours: windows A, B (one day), C (two days on)
  ev_n    uuid;   -- published, NO hours, same span
  ev_draft uuid;  -- draft with the same hours
  ev_arch uuid;   -- archived with the same hours
  ev_hist uuid;   -- ended + archived, with hours; attendee RSVPd
  ev_curb uuid;   -- ENDED Curbside with hours
  ev_auth text;   -- inserted by the host as `authenticated`
  ev_cb   text;   -- Curbside posted by the host as `authenticated`
  t0      timestamptz := date_trunc('hour', now()) + interval '2 days';
  hrs     jsonb;
  hist    jsonb;
  many    jsonb;
  r       text;
  j       jsonb;
  n       integer;
  role_   text;
  who     uuid;
  feed    text;
  ids     text;
  qa_addr constant text := '18680 S Nogales Hwy';
  -- Typed as the column: a text variable is not coerced to geography in static SQL.
  pt      constant public.events.location%type := 'SRID=4326;POINT(-110.9800 31.8700)';
begin
  perform set_config('request.jwt.claims', '', true);

  select id into u_host  from public.profiles order by created_at limit 1;
  select id into u_att   from public.profiles where id <> u_host order by created_at limit 1;
  select id into u_other from public.profiles where id not in (u_host, u_att) order by created_at limit 1;
  if u_host is null or u_att is null or u_other is null then
    perform pg_temp.rec('00. fixtures', 'at least three profiles exist', 'fewer than three — cannot run', false);
    return;
  end if;

  delete from public.curbside_quota_ledger where user_id in (u_host, u_att);
  insert into public.workspaces (name, created_by) values ('QA 0039 workspace', u_host) returning id into ws;
  insert into public.workspaces (name, created_by) values ('QA 0039 attendee workspace', u_att) returning id into ws_att;

  ---------------------------------------------------------------------------
  -- PREMISES (INFO rows).
  ---------------------------------------------------------------------------
  begin
    create temp table qa_check_cast (h jsonb, check ((h ->> 'a')::timestamptz is not null)) on commit drop;
    r := 'accepted';
  exception when others then
    r := 'refused ' || sqlstate;
  end;
  perform pg_temp.rec('2a. INFO: a CHECK holding a text→timestamptz cast', 'accepted (prompt premise says refused)', r, r is not null);

  begin
    create temp table qa_check_sub (h jsonb, check ((select count(*) from jsonb_array_elements(h)) > 0)) on commit drop;
    r := 'accepted';
  exception when others then
    r := 'refused ' || sqlstate;
  end;
  perform pg_temp.rec('2b. INFO: a CHECK holding a subquery over the array', 'refused 0A000', r, r is not null);

  select case when x.hours is null then 'SQL NULL' else 'jsonb ' || jsonb_typeof(x.hours) end into r
    from json_to_record('{"hours": null}'::json) as x(hours jsonb);
  perform pg_temp.rec('2c. INFO: JSON null through a Postgres record conversion', 'SQL NULL', r, r is not null);

  ---------------------------------------------------------------------------
  -- VALIDATION — each rule refused with its named error.
  ---------------------------------------------------------------------------
  perform pg_temp.eq('2d. not an array → refused', 'hours_malformed',
    pg_temp.try_hours(ws, t0, t0 + interval '4 hours', '{"opens_at":"x"}'::jsonb));
  perform pg_temp.eq('2e. empty array → refused', 'hours_malformed',
    pg_temp.try_hours(ws, t0, t0 + interval '4 hours', '[]'::jsonb));
  perform pg_temp.eq('2f. jsonb null (not SQL NULL) → refused', 'hours_malformed',
    pg_temp.try_hours(ws, t0, t0 + interval '4 hours', 'null'::jsonb));
  perform pg_temp.eq('2g. an extra key → refused', 'hours_malformed',
    pg_temp.try_hours(ws, t0, t0 + interval '4 hours',
      jsonb_build_array(pg_temp.win(t0, t0 + interval '4 hours') || '{"note":"x"}'::jsonb)));
  perform pg_temp.eq('2g2. a missing key → refused', 'hours_malformed',
    pg_temp.try_hours(ws, t0, t0 + interval '4 hours',
      jsonb_build_array(pg_temp.win(t0, t0 + interval '4 hours') - 'closes_at')));
  perform pg_temp.eq('2g3. an element that is not an object → refused', 'hours_malformed',
    pg_temp.try_hours(ws, t0, t0 + interval '4 hours', '["2026-12-01T10:00:00Z"]'::jsonb));
  perform pg_temp.eq('2h. a timestamp with no zone → refused', 'hours_malformed',
    pg_temp.try_hours(ws, t0, t0 + interval '4 hours',
      '[{"opens_at":"2026-12-01T10:00:00","closes_at":"2026-12-01T14:00:00Z"}]'::jsonb));
  perform pg_temp.eq('2h2. the word "now" → refused', 'hours_malformed',
    pg_temp.try_hours(ws, t0, t0 + interval '4 hours',
      '[{"opens_at":"now","closes_at":"2026-12-01T14:00:00Z"}]'::jsonb));
  perform pg_temp.eq('2i. an impossible date → refused', 'hours_malformed',
    pg_temp.try_hours(ws, t0, t0 + interval '4 hours',
      '[{"opens_at":"2026-02-30T10:00:00Z","closes_at":"2026-03-01T14:00:00Z"}]'::jsonb));

  select jsonb_agg(pg_temp.win(t0 + make_interval(days => d), t0 + make_interval(days => d, hours => 4)) order by d)
    into many from generate_series(0, 31) d;
  perform pg_temp.eq('2j. 32 windows → refused', 'hours_too_many',
    pg_temp.try_hours(ws, t0, t0 + interval '31 days 4 hours', many));
  perform pg_temp.eq('2k. closes before it opens → refused', 'hours_window_order',
    pg_temp.try_hours(ws, t0, t0 + interval '4 hours',
      jsonb_build_array(pg_temp.win(t0 + interval '4 hours', t0))));
  perform pg_temp.eq('2k2. zero-length window → refused', 'hours_window_order',
    pg_temp.try_hours(ws, t0, t0, jsonb_build_array(pg_temp.win(t0, t0))));
  perform pg_temp.eq('2l. a window over 24 hours → refused', 'hours_window_too_long',
    pg_temp.try_hours(ws, t0, t0 + interval '24 hours 1 minute',
      jsonb_build_array(pg_temp.win(t0, t0 + interval '24 hours 1 minute'))));
  perform pg_temp.eq('2m. out of order → refused', 'hours_not_sorted',
    pg_temp.try_hours(ws, t0, t0 + interval '28 hours', jsonb_build_array(
      pg_temp.win(t0 + interval '24 hours', t0 + interval '28 hours'), pg_temp.win(t0, t0 + interval '4 hours'))));
  perform pg_temp.eq('2n. overlapping windows → refused', 'hours_overlap',
    pg_temp.try_hours(ws, t0, t0 + interval '6 hours', jsonb_build_array(
      pg_temp.win(t0, t0 + interval '4 hours'), pg_temp.win(t0 + interval '3 hours', t0 + interval '6 hours'))));
  perform pg_temp.eq('2o. first opens_at <> starts_at → refused', 'hours_span_mismatch',
    pg_temp.try_hours(ws, t0 - interval '1 hour', t0 + interval '4 hours',
      jsonb_build_array(pg_temp.win(t0, t0 + interval '4 hours'))));
  perform pg_temp.eq('2p. last closes_at <> ends_at → refused', 'hours_span_mismatch',
    pg_temp.try_hours(ws, t0, t0 + interval '5 hours',
      jsonb_build_array(pg_temp.win(t0, t0 + interval '4 hours'))));
  perform pg_temp.eq('2p2. hours with a NULL ends_at → refused', 'hours_span_mismatch',
    pg_temp.try_hours(ws, t0, null, jsonb_build_array(pg_temp.win(t0, t0 + interval '4 hours'))));

  ---------------------------------------------------------------------------
  -- WRITES and accepted shapes.
  ---------------------------------------------------------------------------
  hrs := jsonb_build_array(
    pg_temp.win(t0,                        t0 + interval '4 hours'),
    pg_temp.win(t0 + interval '6 hours',   t0 + interval '10 hours'),
    pg_temp.win(t0 + interval '48 hours',  t0 + interval '52 hours'));

  ev_auth := pg_temp.scalar_as('authenticated', u_host, format(
    'insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location, hours)
     values (%L, ''QA 0039 auth'', ''standard'', ''draft'', %L, %L, %L, %L, %L) returning id::text',
    ws, t0, t0 + interval '52 hours', qa_addr, pt, hrs));
  perform pg_temp.rec('2q. authenticated HOST inserts hours (trigger fires with its EXECUTE revoked)', 'an id', ev_auth, ev_auth ~ '^[0-9a-f-]{36}$');

  perform pg_temp.eq('2r. 31 windows → accepted', 'ok',
    pg_temp.try_hours(ws, t0, t0 + interval '30 days 4 hours', many - 31));
  perform pg_temp.eq('2s. windows past midnight → accepted', 'ok',
    pg_temp.try_hours(ws, date_trunc('day', t0) + interval '20 hours', date_trunc('day', t0) + interval '49 hours', jsonb_build_array(
      pg_temp.win(date_trunc('day', t0) + interval '20 hours', date_trunc('day', t0) + interval '25 hours'),
      pg_temp.win(date_trunc('day', t0) + interval '44 hours', date_trunc('day', t0) + interval '49 hours'))));
  perform pg_temp.eq('2s2. exactly 24 hours, touching windows → accepted', 'ok',
    pg_temp.try_hours(ws, t0, t0 + interval '28 hours', jsonb_build_array(
      pg_temp.win(t0, t0 + interval '24 hours'), pg_temp.win(t0 + interval '24 hours', t0 + interval '28 hours'))));
  perform pg_temp.eq('2s3. the same instants with a +hh:mm offset → accepted', 'ok',
    pg_temp.try_hours(ws, '2026-12-01T17:00:00Z', '2026-12-01T21:00:00Z',
      '[{"opens_at":"2026-12-01T10:00:00-07:00","closes_at":"2026-12-01T14:00:00-07:00"}]'::jsonb));
  perform pg_temp.eq('2t. SQL NULL, and NULL with a NULL ends_at → accepted', 'ok ok',
    pg_temp.try_hours(ws, t0, t0 + interval '4 hours', null) || ' ' || pg_temp.try_hours(ws, t0, null, null));

  perform pg_temp.eq('2u. host moves starts_at alone on an event with hours → refused', 'ERR 23514 hours_span_mismatch',
    pg_temp.scalar_as('authenticated', u_host, format(
      'update public.events set starts_at = starts_at - interval ''1 hour'' where id::text = %L returning ''updated''', ev_auth)));
  perform pg_temp.eq('2v. host clears hours, then sets them again → both work', 'cleared / 3',
    coalesce(pg_temp.scalar_as('authenticated', u_host, format(
      'update public.events set hours = null where id::text = %L returning case when hours is null then ''cleared'' end', ev_auth)), '?')
    || ' / ' ||
    pg_temp.scalar_as('authenticated', u_host, format(
      'update public.events set hours = %L where id::text = %L returning jsonb_array_length(hours)::text', hrs, ev_auth)));
  perform pg_temp.eq('2w. a NON-member updating hours changes nothing', '(null)',
    pg_temp.scalar_as('authenticated', u_other, format(
      'update public.events set hours = null where id::text = %L returning ''updated''', ev_auth)));
  perform pg_temp.eq('2x. a NON-member inserting an event with hours → refused by RLS', 'ERR 42501',
    pg_temp.scalar_as('authenticated', u_other, format(
      'insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, hours)
       values (%L, ''QA 0039 intruder'', ''standard'', ''draft'', %L, %L, %L, %L) returning ''inserted''',
      ws, t0, t0 + interval '52 hours', qa_addr, hrs)));
  perform pg_temp.eq('2y. anon updating hours → refused', 'ERR 42501',
    pg_temp.scalar_as('anon', null, format(
      'update public.events set hours = null where id::text = %L returning ''updated''', ev_auth)));

  -- Curbside: the refused post first, so the ledger check means something.
  r := pg_temp.scalar_as('authenticated', u_host, format(
    'insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location, hours)
     values (%L, ''QA 0039 curbside bad'', ''curbside'', ''published'', %L, %L, %L, %L, %L) returning ''inserted''',
    ws, t0, t0 + interval '53 hours', qa_addr, pt, hrs));
  select count(*) into n from public.curbside_quota_ledger where user_id = u_host;
  perform pg_temp.eq('2z. Curbside with BAD hours → refused, and no free credit spent', 'ERR 23514 hours_span_mismatch / 0', r || ' / ' || n::text);

  ev_cb := pg_temp.scalar_as('authenticated', u_host, format(
    'insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location, hours)
     values (%L, ''QA 0039 curbside'', ''curbside'', ''published'', %L, %L, %L, %L, %L) returning id::text',
    ws, t0, t0 + interval '52 hours', qa_addr, pt, hrs));
  select count(*) into n from public.curbside_quota_ledger where user_id = u_host and event_id::text = ev_cb;
  perform pg_temp.rec('2aa. Curbside WITH hours → ONE statement, one credit spent', 'an id / 1', ev_cb || ' / ' || n::text,
    ev_cb ~ '^[0-9a-f-]{36}$' and n = 1);

  begin
    insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, hours)
    values (ws_att, 'QA 0039 curbside long', 'curbside', 'draft', t0, t0 + interval '73 hours', qa_addr,
            jsonb_build_array(pg_temp.win(t0, t0 + interval '4 hours'),
                              pg_temp.win(t0 + interval '70 hours', t0 + interval '73 hours')));
    r := 'ok';
  exception when others then
    r := sqlerrm;
  end;
  perform pg_temp.eq('2ab. Curbside over 72 hours with valid hours → still 0016''s error', 'curbside_span_too_long', r);

  ---------------------------------------------------------------------------
  -- Read fixtures.
  ---------------------------------------------------------------------------
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location, hours)
  values (ws, 'QA 0039 hours', 'standard', 'published', t0, t0 + interval '52 hours', qa_addr, pt, hrs) returning id into ev_h;
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location)
  values (ws, 'QA 0039 no hours', 'standard', 'published', t0, t0 + interval '52 hours', qa_addr, pt) returning id into ev_n;
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location, hours)
  values (ws, 'QA 0039 draft', 'standard', 'draft', t0, t0 + interval '52 hours', qa_addr, pt, hrs) returning id into ev_draft;
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location, hours, archived_at)
  values (ws, 'QA 0039 archived', 'standard', 'published', t0, t0 + interval '52 hours', qa_addr, pt, hrs, now()) returning id into ev_arch;
  hist := jsonb_build_array(pg_temp.win(now() - interval '3 days', now() - interval '3 days' + interval '3 hours'));
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location, hours, archived_at)
  values (ws, 'QA 0039 ended archived', 'standard', 'published', now() - interval '3 days', now() - interval '3 days' + interval '3 hours', qa_addr, pt, hist, now())
  returning id into ev_hist;
  insert into public.rsvps (user_id, event_id) values (u_att, ev_hist);
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location, hours)
  values (ws_att, 'QA 0039 ended curbside', 'curbside', 'published', now() - interval '6 hours', now() - interval '2 hours', qa_addr, pt,
          jsonb_build_array(pg_temp.win(now() - interval '6 hours', now() - interval '2 hours')))
  returning id into ev_curb;

  ---------------------------------------------------------------------------
  -- FEED — as anon, then as authenticated. `ids` is every fixture, so each
  -- answer is exactly which of them the window returned.
  ---------------------------------------------------------------------------
  ids := format('%L, %L, %L, %L, %L, %L', ev_h, ev_n, ev_draft, ev_arch, ev_hist, ev_curb);
  feed := 'select coalesce(string_agg(case f.id'
    || format(' when %L then ''hours'' when %L then ''none'' when %L then ''DRAFT'' when %L then ''ARCHIVED'' when %L then ''HIST'' else ''CURBSIDE'' end', ev_h, ev_n, ev_draft, ev_arch, ev_hist)
    || ', '' '' order by f.title), ''-'') from public.events_within_radius(31.8700, -110.9800, 100, %L, %L) f where f.id in (' || ids || ')';

  foreach role_ in array array['anon', 'authenticated'] loop
    who := case when role_ = 'authenticated' then u_other end;

    perform pg_temp.eq('3a. FEED ' || role_ || ': CLOSED day → hours event hidden, no-hours event shown', 'none',
      pg_temp.scalar_as(role_, who, format(feed, t0 + interval '24 hours', t0 + interval '47 hours')));
    perform pg_temp.eq('3b. FEED ' || role_ || ': same day, BETWEEN windows → shown', 'hours none',
      pg_temp.scalar_as(role_, who, format(feed, t0 + interval '5 hours', t0 + interval '20 hours')));
    perform pg_temp.eq('3c. FEED ' || role_ || ': window wholly inside the gap → hidden', 'none',
      pg_temp.scalar_as(role_, who, format(feed, t0 + interval '4 hours 1 minute', t0 + interval '5 hours 59 minutes')));
    perform pg_temp.eq('3d. FEED ' || role_ || ': closes_at = window_from, and opens_at = window_to → both shown', 'hours none | hours none',
      pg_temp.scalar_as(role_, who, format(feed, t0 + interval '4 hours', t0 + interval '5 hours')) || ' | ' ||
      pg_temp.scalar_as(role_, who, format(feed, t0 + interval '5 hours', t0 + interval '6 hours')));
    perform pg_temp.eq('3e. FEED ' || role_ || ': after the last close → both gone', '-',
      pg_temp.scalar_as(role_, who, format(feed, t0 + interval '52 hours 1 minute', t0 + interval '60 hours')));
    perform pg_temp.eq('3f. FEED ' || role_ || ': unbounded → draft, archived, ended and ended Curbside all absent', 'hours none',
      pg_temp.scalar_as(role_, who, format(feed, '-infinity', 'infinity')));
    perform pg_temp.eq('3g. FEED ' || role_ || ': returns hours (3 windows / null)', '3 / null',
      pg_temp.scalar_as(role_, who, format(
        'select string_agg(coalesce(jsonb_array_length(f.hours)::text, ''null''), '' / '' order by f.title)
           from public.events_within_radius(31.8700, -110.9800, 100, ''-infinity'', ''infinity'') f where f.id in (%L, %L)', ev_h, ev_n)));
  end loop;

  ---------------------------------------------------------------------------
  -- EVENT DETAIL, per branch.
  ---------------------------------------------------------------------------
  feed := 'select coalesce(string_agg(coalesce(jsonb_array_length(d.hours)::text, ''null''), '',''), ''no row'') from public.event_detail(%L, 31.8700, -110.9800) d';
  perform pg_temp.eq('4a. DETAIL anon (storefront): hours / no hours', '3 / null',
    pg_temp.scalar_as('anon', null, format(feed, ev_h)) || ' / ' || pg_temp.scalar_as('anon', null, format(feed, ev_n)));
  perform pg_temp.eq('4b. DETAIL authenticated stranger (storefront)', '3',
    pg_temp.scalar_as('authenticated', u_other, format(feed, ev_h)));
  perform pg_temp.eq('4c. DETAIL host (member branch): their draft', '3',
    pg_temp.scalar_as('authenticated', u_host, format(feed, ev_draft)));
  perform pg_temp.eq('4d. DETAIL attendee (history branch): ended + archived', '1',
    pg_temp.scalar_as('authenticated', u_att, format(feed, ev_hist)));
  perform pg_temp.eq('4e. CONTROL: anon on the draft / no-attendance account on the history row', 'no row / no row',
    pg_temp.scalar_as('anon', null, format(feed, ev_draft)) || ' / ' || pg_temp.scalar_as('authenticated', u_other, format(feed, ev_hist)));

  ---------------------------------------------------------------------------
  -- ORGANIZER PROFILE (anon) and EXPORT (the host).
  ---------------------------------------------------------------------------
  perform pg_temp.eq('5a. PROFILE anon: every event object has an hours key; 3 windows / null', '3 null / 0 missing',
    pg_temp.scalar_as('anon', null, format(
      'select string_agg(case when jsonb_typeof(o -> ''hours'') = ''array'' then jsonb_array_length(o -> ''hours'')::text else ''null'' end, '' '' order by o ->> ''title'')
              filter (where o ->> ''id'' in (%L, %L))
              || '' / '' || count(*) filter (where not o ? ''hours'')::text || '' missing''
         from public.organizer_profile(%L) p, lateral jsonb_array_elements(p.upcoming || p.past) o', ev_h, ev_n, ws)));

  r := pg_temp.scalar_as('authenticated', u_host, 'select public.export_my_data()::text');
  j := case when r like 'ERR%' or r like 'SETROLE%' then null else r::jsonb end;
  select string_agg(case when jsonb_typeof(e -> 'hours') = 'array' then jsonb_array_length(e -> 'hours')::text else coalesce(jsonb_typeof(e -> 'hours'), 'missing') end, ' ' order by e ->> 'title')
    into r
    from jsonb_array_elements(coalesce(j -> 'owned_workspaces', '[]'::jsonb)) w, lateral jsonb_array_elements(w -> 'events') e
   where e ->> 'id' in (ev_h::text, ev_n::text, ev_hist::text);
  perform pg_temp.eq('6a. EXPORT host: ended 1 / hours 3 / no hours null', '1 3 null', r);

  ---------------------------------------------------------------------------
  -- DIRECT READ (Saved / Workspace / Me), per events_select_public branch.
  ---------------------------------------------------------------------------
  feed := 'select coalesce(string_agg(coalesce(jsonb_array_length(hours)::text, ''null''), '',''), ''no row'') from public.events where id = %L';
  perform pg_temp.eq('7a. DIRECT host (branch 1): their draft', '3', pg_temp.scalar_as('authenticated', u_host, format(feed, ev_draft)));
  perform pg_temp.eq('7b. DIRECT stranger (branch 2): published', '3', pg_temp.scalar_as('authenticated', u_other, format(feed, ev_h)));
  perform pg_temp.eq('7c. DIRECT attendee (branch 3): ended + archived', '1', pg_temp.scalar_as('authenticated', u_att, format(feed, ev_hist)));
  perform pg_temp.eq('7d. CONTROL: no attendance → no row', 'no row', pg_temp.scalar_as('authenticated', u_other, format(feed, ev_hist)));
  perform pg_temp.eq('7e. anon: selecting hours is refused', 'ERR 42501', pg_temp.scalar_as('anon', null, format(feed, ev_h)));
  perform pg_temp.eq('7f. CONTROL anon: the same row without the column still reads', '1',
    pg_temp.scalar_as('anon', null, format('select count(*)::text from public.events where id = %L', ev_h)));
end $$;

select seq, step, expected, actual, pass from qa_results order by seq;

rollback;

-- After the rollback, alone: expect 0 | 0.
select
  (select count(*) from public.workspaces where name like 'QA 0039%') as qa_workspaces_left,
  (select count(*) from public.events     where title like 'QA 0039%') as qa_events_left;

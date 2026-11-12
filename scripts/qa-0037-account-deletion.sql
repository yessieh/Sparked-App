-- ============================================================================
-- BEHAVIORAL SUITE — account deletion, server side (migration 0037):
-- workspaces.created_by SET NULL + app/public.delete_account_workspaces.
--
-- WHERE TO RUN: Supabase Dashboard → SQL Editor, on the DEV project
-- (`Sparked-App`), AFTER 0037 is applied. Never against prod. The editor runs
-- as `postgres`; every role case switches role explicitly inside the
-- transaction.
--
-- HOW TO RUN: two sections, one at a time, each in a NEW tab. Section 1 is
-- READ-ONLY — paste it and Run. Section 2 is BEGIN … ROLLBACK: highlight from
-- `begin;` down to and including the `select seq, step, …` line, Run selected
-- (the editor shows only the LAST statement's result, and the grid must be
-- last); then run `rollback;` alone; then the final check alone — expect
-- 0 | 0. Every row of both grids should read pass = true.
--
-- WHAT SECTION 2 TOUCHES, INSIDE THE TRANSACTION ONLY. It borrows three
-- existing profiles (no auth.users rows are minted — same reason as
-- qa-0018). It deletes two of those profiles, and the guard deletes EVERY
-- workspace the "solo" profile owns, real ones included, so expected counts
-- are computed in-transaction rather than hard-coded. All of it — and the
-- ledger rows cleared for a clean slate — is undone by the ROLLBACK.
--
-- ---------------------------------------------------------------------------
-- SHAPE: per role AND per branch (CLAUDE.md, "Catalog-verified is not
-- behaviour-verified").
--
--   GUARD, by role:   anon → 42501, authenticated → 42501 (wrapper AND app
--                     body), service_role → runs (the Edge Function's path).
--   GUARD, by branch: solo owner → deletes; owner with another member →
--                     refused, nothing deleted; NULL id → refused; second
--                     call → 0 / 0 (idempotent).
--   NON-OWNER MEMBER: the guard leaves their membership; deleting their
--                     profile cascades it; the workspace stays.
--   created_by:       deleting a creator's profile sets it NULL and no longer
--                     raises 23503; a client still cannot INSERT a NULL one.
--   LEDGER:           survives both deletes, event_id NULL then user_id NULL.
--
-- QA address: 18680 S Nogales Hwy.
-- ============================================================================


-- ############################################################################
-- SECTION 1 — Catalog and privilege state. READ-ONLY. Run this first.
--
-- PUBLIC is a pseudo-role, so 1e reads the ACL directly: an aclitem with an
-- EMPTY grantee (`=X/owner`) is PUBLIC; a NULL proacl is the default, which
-- includes PUBLIC, and fails too.
-- ############################################################################
with fn as (
  select n.nspname as schema, p.proname as name, p.oid, p.proacl, p.prosecdef, p.proconfig,
         p.proargmodes, p.proargnames, pg_get_function_identity_arguments(p.oid) as args
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where p.proname = 'delete_account_workspaces' and n.nspname in ('app', 'public')
),
f_app as (select * from fn where schema = 'app'),
f_pub as (select * from fn where schema = 'public'),
fk as (
  select c.conname::text as conname, c.confdeltype::text as confdeltype, c.confrelid::regclass::text as ref,
         pg_get_constraintdef(c.oid) as def
  from pg_constraint c
  where c.conrelid = 'public.workspaces'::regclass and c.contype::text = 'f'
    and c.conkey = array[(select attnum from pg_attribute
                           where attrelid = 'public.workspaces'::regclass and attname = 'created_by')]
)
select * from (values
    ('1a. workspaces.created_by is NULLABLE',
     'false',
     (select attnotnull::text from pg_attribute
       where attrelid = 'public.workspaces'::regclass and attname = 'created_by'),
     (select not attnotnull from pg_attribute
       where attrelid = 'public.workspaces'::regclass and attname = 'created_by')),

    ('1b. exactly one FK on created_by → profiles, ON DELETE SET NULL',
     '1 | workspaces_created_by_fkey | profiles | n',
     (select count(*)::text from fk) || ' | ' ||
     coalesce((select string_agg(conname || ' | ' || ref || ' | ' || confdeltype, '; ') from fk), '(none)'),
     (select count(*) from fk) = 1
       and (select confdeltype from fk) = 'n'
       and (select ref from fk) in ('profiles', 'public.profiles')),

    ('1c. created_by column grants unchanged: anon SELECT, auth SELECT, auth INSERT, auth UPDATE',
     'false false true false',
     has_column_privilege('anon',          'public.workspaces', 'created_by', 'select')::text || ' ' ||
     has_column_privilege('authenticated', 'public.workspaces', 'created_by', 'select')::text || ' ' ||
     has_column_privilege('authenticated', 'public.workspaces', 'created_by', 'insert')::text || ' ' ||
     has_column_privilege('authenticated', 'public.workspaces', 'created_by', 'update')::text,
     not has_column_privilege('anon',          'public.workspaces', 'created_by', 'select')
     and not has_column_privilege('authenticated', 'public.workspaces', 'created_by', 'select')
     and     has_column_privilege('authenticated', 'public.workspaces', 'created_by', 'insert')
     and not has_column_privilege('authenticated', 'public.workspaces', 'created_by', 'update')),

    ('1d. one function per schema; args; definer app / invoker public; search_path pinned',
     'p_user_id uuid true public, app | user_id uuid false public, app',
     coalesce((select args || ' ' || prosecdef::text || ' ' || replace(array_to_string(proconfig, ', '), 'search_path=', '') from f_app), '(missing)')
     || ' | ' ||
     coalesce((select args || ' ' || prosecdef::text || ' ' || replace(array_to_string(proconfig, ', '), 'search_path=', '') from f_pub), '(missing)'),
     (select count(*) from f_app) = 1 and (select count(*) from f_pub) = 1
       and (select args = 'p_user_id uuid' and prosecdef and array_to_string(proconfig, ', ') = 'search_path=public, app' from f_app)
       and (select args = 'user_id uuid' and not prosecdef and array_to_string(proconfig, ', ') = 'search_path=public, app' from f_pub)),

    ('1e. TARGET: no PUBLIC EXECUTE on either (and no NULL/default ACL)',
     'none',
     coalesce((select string_agg(schema || '.' || name, ', ') from fn
                where proacl is null
                   or exists (select 1 from unnest(proacl) a where a::text like '=%')), 'none'),
     (select count(*) from fn) = 2
       and not exists (select 1 from fn where proacl is null
                         or exists (select 1 from unnest(proacl) a where a::text like '=%'))),

    ('1f. EXECUTE: anon false, authenticated false, service_role true (app | public)',
     'false false true | false false true',
     (select has_function_privilege('anon', oid, 'execute')::text || ' ' ||
             has_function_privilege('authenticated', oid, 'execute')::text || ' ' ||
             has_function_privilege('service_role', oid, 'execute')::text from f_app)
     || ' | ' ||
     (select has_function_privilege('anon', oid, 'execute')::text || ' ' ||
             has_function_privilege('authenticated', oid, 'execute')::text || ' ' ||
             has_function_privilege('service_role', oid, 'execute')::text from f_pub),
     (select not has_function_privilege('anon', oid, 'execute')
         and not has_function_privilege('authenticated', oid, 'execute')
         and     has_function_privilege('service_role', oid, 'execute') from f_app)
     and
     (select not has_function_privilege('anon', oid, 'execute')
         and not has_function_privilege('authenticated', oid, 'execute')
         and     has_function_privilege('service_role', oid, 'execute') from f_pub)),

    ('1g. ACL grantees are exactly postgres + service_role on both',
     'postgres,service_role | postgres,service_role',
     (select string_agg(pg_get_userbyid(a.grantee), ',' order by pg_get_userbyid(a.grantee))
        from aclexplode((select proacl from f_app)) a)
     || ' | ' ||
     (select string_agg(pg_get_userbyid(a.grantee), ',' order by pg_get_userbyid(a.grantee))
        from aclexplode((select proacl from f_pub)) a),
     coalesce((select string_agg(pg_get_userbyid(a.grantee), ',' order by pg_get_userbyid(a.grantee))
        from aclexplode((select proacl from f_app)) a) = 'postgres,service_role'
     and (select string_agg(pg_get_userbyid(a.grantee), ',' order by pg_get_userbyid(a.grantee))
        from aclexplode((select proacl from f_pub)) a) = 'postgres,service_role', false)),

    ('1h. schema app USAGE: service_role true; anon + authenticated unchanged (true true)',
     'true | true true',
     has_schema_privilege('service_role', 'app', 'usage')::text || ' | ' ||
     has_schema_privilege('anon', 'app', 'usage')::text || ' ' ||
     has_schema_privilege('authenticated', 'app', 'usage')::text,
     has_schema_privilege('service_role', 'app', 'usage')
       and has_schema_privilege('anon', 'app', 'usage')
       and has_schema_privilege('authenticated', 'app', 'usage')),

    ('1i. workspaces_insert_auth unchanged (with_check md5, audit-file normalisation)',
     '987767fc803474751ce44a4235a12922',
     (select md5(btrim(regexp_replace(pg_get_expr(p.polwithcheck, p.polrelid), '[[:space:]]+', ' ', 'g')))
        from pg_policy p where p.polrelid = 'public.workspaces'::regclass and p.polname = 'workspaces_insert_auth'),
     (select md5(btrim(regexp_replace(pg_get_expr(p.polwithcheck, p.polrelid), '[[:space:]]+', ' ', 'g')))
        from pg_policy p where p.polrelid = 'public.workspaces'::regclass and p.polname = 'workspaces_insert_auth')
       = '987767fc803474751ce44a4235a12922'),

    ('1j. ledger FK on profiles still ON DELETE SET NULL (0018 untouched)',
     'n',
     (select string_agg(confdeltype::text, ',') from pg_constraint
       where conrelid = 'public.curbside_quota_ledger'::regclass and contype::text = 'f'
         and confrelid = 'public.profiles'::regclass),
     (select bool_and(confdeltype::text = 'n') from pg_constraint
       where conrelid = 'public.curbside_quota_ledger'::regclass and contype::text = 'f'
         and confrelid = 'public.profiles'::regclass))
) as t(step, expected, actual, pass);


-- ############################################################################
-- SECTION 2 — The behavioural suite. BEGIN … ROLLBACK; nothing persists.
--
-- Every role read goes through one helper that runs a scalar query as a role
-- and returns its value as text, or `ERR <sqlstate>` — a 42501 shows in the
-- grid, never as a silent empty result.
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
-- (NULL for no user claim). Returns the value, '(null)', or 'ERR <sqlstate>'.
-- A failure to SWITCH to the role is reported as 'SETROLE <sqlstate>', so it
-- can never be mistaken for the function refusing the caller.
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
    perform set_config('request.jwt.claims',
      json_build_object('role', p_role)::text, true);
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
  u_solo      uuid;   -- owns ws_solo alone; also a VIEWER of ws_shared
  u_owner     uuid;   -- owns ws_shared, which has other members
  u_member    uuid;   -- EDITOR of ws_shared; creator of ws_by_member
  ws_solo     uuid;
  ws_shared   uuid;
  ws_by_member uuid;
  ev_curb     uuid;   -- ws_solo: published Curbside (consumes a ledger row)
  ev_pub      uuid;   -- ws_solo: published standard, RSVPd by u_owner
  ev_draft    uuid;   -- ws_solo: draft
  ev_gone     uuid;   -- ws_solo: soft-deleted (deleted_at set)
  ev_shared   uuid;   -- ws_shared: published standard
  ledger_id   uuid;
  exp_ws      integer;
  exp_ev      integer;
  n           integer;
  r           text;
  err         text;
  call_sql    text;
  qa_addr     constant text := '18680 S Nogales Hwy';
begin
  ---------------------------------------------------------------------------
  -- Fixtures. No JWT set: the Curbside trigger attributes to created_by.
  ---------------------------------------------------------------------------
  perform set_config('request.jwt.claims', '', true);

  select id into u_solo   from public.profiles order by created_at limit 1;
  select id into u_owner  from public.profiles where id <> u_solo order by created_at limit 1;
  select id into u_member from public.profiles where id not in (u_solo, u_owner) order by created_at limit 1;
  if u_solo is null or u_owner is null or u_member is null then
    perform pg_temp.rec('00. fixtures', 'at least three profiles exist', 'fewer than three — cannot run', false);
    return;
  end if;

  -- PRECONDITION: the real data must not already block the solo user (the
  -- pre-apply check expects no multi-member workspace anywhere).
  select count(*) into n from public.memberships m
   where m.role = 'owner' and m.user_id = u_solo
     and exists (select 1 from public.memberships o where o.workspace_id = m.workspace_id and o.user_id <> u_solo);
  perform pg_temp.rec('00a. precondition: u_solo owns no real multi-member workspace', '0', n::text, n = 0);

  -- Clean ledger slate for u_solo so the Curbside insert cannot hit quota.
  delete from public.curbside_quota_ledger where user_id = u_solo;

  insert into public.workspaces (name, created_by) values ('QA 0037 solo', u_solo) returning id into ws_solo;
  insert into public.workspaces (name, created_by) values ('QA 0037 shared', u_owner) returning id into ws_shared;
  insert into public.workspaces (name, created_by) values ('QA 0037 by member', u_member) returning id into ws_by_member;
  insert into public.memberships (workspace_id, user_id, role) values (ws_shared, u_member, 'editor');
  insert into public.memberships (workspace_id, user_id, role) values (ws_shared, u_solo, 'viewer');

  select count(*) into n from public.memberships where workspace_id in (ws_solo, ws_shared, ws_by_member) and role = 'owner';
  perform pg_temp.rec('00b. fixture: three owner memberships auto-seeded (0001 trigger)', '3', n::text, n = 3);

  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location)
  values (ws_solo, 'QA 0037 curbside', 'curbside', 'published', now() + interval '1 day', now() + interval '1 day 3 hours', qa_addr, 'SRID=4326;POINT(-110.9800 31.8700)')
  returning id into ev_curb;
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location)
  values (ws_solo, 'QA 0037 published', 'standard', 'published', now() + interval '2 days', now() + interval '2 days 3 hours', qa_addr, 'SRID=4326;POINT(-110.9800 31.8700)')
  returning id into ev_pub;
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address)
  values (ws_solo, 'QA 0037 draft', 'standard', 'draft', now() + interval '3 days', now() + interval '3 days 3 hours', qa_addr)
  returning id into ev_draft;
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, deleted_at)
  values (ws_solo, 'QA 0037 soft-deleted', 'standard', 'published', now() + interval '4 days', now() + interval '4 days 3 hours', qa_addr, now())
  returning id into ev_gone;
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location)
  values (ws_shared, 'QA 0037 shared event', 'standard', 'published', now() + interval '2 days', now() + interval '2 days 3 hours', qa_addr, 'SRID=4326;POINT(-110.9800 31.8700)')
  returning id into ev_shared;
  insert into public.rsvps (user_id, event_id) values (u_owner, ev_pub);

  select id into ledger_id from public.curbside_quota_ledger where event_id = ev_curb and user_id = u_solo;
  perform pg_temp.rec('00c. fixture: the Curbside post wrote one ledger row for u_solo', 'an id',
                      coalesce(ledger_id::text, 'NONE'), ledger_id is not null);

  ---------------------------------------------------------------------------
  -- ROLES — anon and authenticated are refused at BOTH entry points.
  ---------------------------------------------------------------------------
  r := pg_temp.scalar_as('anon', null,
         format('select workspaces_deleted::text from public.delete_account_workspaces(%L)', u_solo));
  perform pg_temp.rec('2a. anon → public wrapper refused', 'ERR 42501', r, r = 'ERR 42501');

  r := pg_temp.scalar_as('anon', null,
         format('select workspaces_deleted::text from app.delete_account_workspaces(%L)', u_solo));
  perform pg_temp.rec('2b. anon → app body refused', 'ERR 42501', r, r = 'ERR 42501');

  r := pg_temp.scalar_as('authenticated', u_solo,
         format('select workspaces_deleted::text from public.delete_account_workspaces(%L)', u_solo));
  perform pg_temp.rec('2c. authenticated (deleting ITSELF) → public wrapper refused', 'ERR 42501', r, r = 'ERR 42501');

  r := pg_temp.scalar_as('authenticated', u_solo,
         format('select workspaces_deleted::text from app.delete_account_workspaces(%L)', u_owner));
  perform pg_temp.rec('2d. authenticated (targeting ANOTHER user) → app body refused', 'ERR 42501', r, r = 'ERR 42501');

  select count(*) into n from public.workspaces where id in (ws_solo, ws_shared, ws_by_member);
  perform pg_temp.rec('2e. CONTROL: the refused calls deleted nothing', '3', n::text, n = 3);

  ---------------------------------------------------------------------------
  -- GUARD — owner with another member: refused, nothing deleted.
  ---------------------------------------------------------------------------
  r := pg_temp.scalar_as('service_role', null,
         format('select workspaces_deleted::text from public.delete_account_workspaces(%L)', u_owner));
  perform pg_temp.rec('2f. service_role, owner of a shared workspace → refused (P0001)', 'ERR P0001', r, r = 'ERR P0001');

  begin
    perform app.delete_account_workspaces(u_owner);
    err := 'CALL SUCCEEDED';
  exception when others then
    get stacked diagnostics err = message_text;
  end;
  perform pg_temp.rec('2g. …and the message is the named error', 'transfer_ownership_first', err, err = 'transfer_ownership_first');

  select count(*) into n from public.workspaces where id = ws_shared;
  perform pg_temp.rec('2h. refused: ws_shared still exists', '1', n::text, n = 1);
  select count(*) into n from public.events where id = ev_shared;
  perform pg_temp.rec('2i. refused: its event still exists', '1', n::text, n = 1);
  select count(*) into n from public.memberships where workspace_id = ws_shared;
  perform pg_temp.rec('2j. refused: all three ws_shared memberships intact', '3', n::text, n = 3);

  begin
    perform app.delete_account_workspaces(null);
    err := 'CALL SUCCEEDED';
  exception when others then
    get stacked diagnostics err = message_text;
  end;
  perform pg_temp.rec('2k. NULL user id → refused, not a silent no-op', 'user_id_required', err, err = 'user_id_required');

  ---------------------------------------------------------------------------
  -- GUARD — solo owner, through the Edge Function's path (service_role →
  -- public wrapper → app body). Expected counts computed BEFORE the call:
  -- u_solo may own real workspaces too, and those go as well (rolled back).
  ---------------------------------------------------------------------------
  select count(*) into exp_ws from public.memberships where user_id = u_solo and role = 'owner';
  select count(*) into exp_ev from public.events e
   where e.workspace_id in (select workspace_id from public.memberships where user_id = u_solo and role = 'owner');

  call_sql := format(
    'select workspaces_deleted::text || '' / '' || events_deleted::text from public.delete_account_workspaces(%L)', u_solo);
  r := pg_temp.scalar_as('service_role', null, call_sql);
  perform pg_temp.rec('2l. service_role, solo owner → deletes; returns workspaces / events',
                      exp_ws::text || ' / ' || exp_ev::text, r, r = exp_ws::text || ' / ' || exp_ev::text);

  select count(*) into n from public.workspaces where id = ws_solo;
  perform pg_temp.rec('2m. ws_solo is gone', '0', n::text, n = 0);
  select count(*) into n from public.events where id in (ev_curb, ev_pub, ev_draft, ev_gone);
  perform pg_temp.rec('2n. all four of its events are gone (published, Curbside, draft, soft-deleted)', '0', n::text, n = 0);
  select count(*) into n from public.memberships where user_id = u_solo and role = 'owner';
  perform pg_temp.rec('2o. u_solo owns nothing now', '0', n::text, n = 0);

  select coalesce((select coalesce(event_id::text, 'null') || ' ' || coalesce(user_id::text, 'null')
                     from public.curbside_quota_ledger where id = ledger_id), 'ROW GONE') into r;
  perform pg_temp.rec('2p. LEDGER row kept, event_id NULL, user still attached', 'null ' || u_solo::text, r, r = 'null ' || u_solo::text);

  select count(*) into n from public.rsvps where event_id = ev_pub;
  perform pg_temp.rec('2q. another user''s RSVP on the deleted event is gone (accepted ruling)', '0', n::text, n = 0);

  select count(*) into n from public.memberships where workspace_id = ws_shared and user_id = u_solo and role = 'viewer';
  perform pg_temp.rec('2r. NON-OWNER membership left alone by the guard (viewer of ws_shared)', '1', n::text, n = 1);
  select count(*) into n from public.profiles where id = u_solo;
  perform pg_temp.rec('2s. the guard never touches the profile', '1', n::text, n = 1);

  r := pg_temp.scalar_as('service_role', null, call_sql);
  perform pg_temp.rec('2t. second call is idempotent (retry-safe)', '0 / 0', r, r = '0 / 0');

  ---------------------------------------------------------------------------
  -- PROFILE DELETE (what the auth.users cascade does in stage 2).
  ---------------------------------------------------------------------------
  begin
    delete from public.profiles where id = u_solo;
    err := 'ok';
  exception when others then
    err := 'ERR ' || sqlstate;
  end;
  perform pg_temp.rec('2u. deleting u_solo''s profile succeeds', 'ok', err, err = 'ok');

  select count(*) into n from public.memberships where user_id = u_solo;
  perform pg_temp.rec('2v. NON-OWNER membership cascaded away with the profile', '0', n::text, n = 0);
  select count(*) into n from public.workspaces where id = ws_shared;
  perform pg_temp.rec('2w. …and the workspace it belonged to stays', '1', n::text, n = 1);

  select coalesce((select coalesce(event_id::text, 'null') || ' ' || coalesce(user_id::text, 'null')
                     from public.curbside_quota_ledger where id = ledger_id), 'ROW GONE') into r;
  perform pg_temp.rec('2x. LEDGER row still kept, now anonymised (both NULL)', 'null null', r, r = 'null null');

  -- created_by SET NULL: delete the profile of ws_by_member's creator (who is
  -- also an editor of ws_shared). Before 0037 this raised 23503.
  begin
    delete from public.profiles where id = u_member;
    err := 'ok';
  exception when others then
    err := 'ERR ' || sqlstate;
  end;
  perform pg_temp.rec('2y. deleting a workspace CREATOR''s profile no longer raises 23503', 'ok', err, err = 'ok');

  select coalesce((select coalesce(created_by::text, 'null') from public.workspaces where id = ws_by_member), 'ROW GONE') into r;
  perform pg_temp.rec('2z. created_by is set NULL; the workspace row remains', 'null', r, r = 'null');

  select count(*) into n from public.memberships where workspace_id = ws_by_member;
  perform pg_temp.rec('2za. ORPHAN (expected, flagged in 0037 header): it now has no members', '0', n::text, n = 0);

  select count(*) into n from public.memberships where workspace_id = ws_shared and user_id = u_member;
  perform pg_temp.rec('2zb. the editor''s ws_shared membership cascaded; owner''s stays',
                      '0 | 1', n::text || ' | ' || (select count(*) from public.memberships where workspace_id = ws_shared and user_id = u_owner and role = 'owner')::text,
                      n = 0 and exists (select 1 from public.memberships where workspace_id = ws_shared and user_id = u_owner and role = 'owner'));

  ---------------------------------------------------------------------------
  -- created_by NULL is not a new CLIENT write path (workspaces_insert_auth).
  ---------------------------------------------------------------------------
  r := pg_temp.scalar_as('authenticated', u_owner,
         'insert into public.workspaces (name) values (''QA 0037 null creator'') returning id::text');
  perform pg_temp.rec('2zc. authenticated INSERT with created_by NULL is refused by RLS', 'ERR 42501', r, r = 'ERR 42501');

  r := pg_temp.scalar_as('authenticated', u_owner,
         format('insert into public.workspaces (name, created_by) values (''QA 0037 own creator'', %L) returning ''inserted''', u_owner));
  perform pg_temp.rec('2zd. CONTROL: the same INSERT with created_by = self succeeds', 'inserted', r, r = 'inserted');
end $$;

select seq, step, expected, actual, pass from qa_results order by seq;

rollback;

-- After the rollback, alone: expect 0 | 0.
select
  (select count(*) from public.workspaces where name like 'QA 0037%') as qa_workspaces_left,
  (select count(*) from public.events     where title like 'QA 0037%') as qa_events_left;

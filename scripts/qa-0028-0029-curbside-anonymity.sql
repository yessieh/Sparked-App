-- ============================================================================
-- BEHAVIORAL SUITE — the Curbside anonymity arc (migrations 0028 + 0029).
--
-- WHERE TO RUN: Supabase dashboard → SQL Editor, on the DEV project
-- (`Sparked-App`, ref kzynvvdggooqgtnprhrm). Never against prod.
--
-- HOW TO RUN: three numbered sections. Run them one at a time, top to bottom,
-- and paste the result grids back. Sections 1 and 2 are READ-ONLY. Section 3 is
-- wrapped in BEGIN … ROLLBACK and creates its own throwaway workspace, users'
-- fixtures and events — **nothing it does persists.**
--
-- WHY THIS ARC GETS A SUITE AND 0025/0026 DID NOT. Those were revokes only,
-- exempt because they add no behavior to assert. **This arc is not exempt on two
-- counts:** 0028 REPLACED function definitions (which fails in ways a revoke
-- cannot — drifted body, changed signature, an argument name PostgREST routes
-- on), and more importantly it **moved a visibility rule out of an RLS policy
-- and into a function body**. That transcription is the single most dangerous
-- thing in the arc: if it is wrong, the database hands out drafts and archived
-- events to strangers and every catalog check still reads clean.
--
-- SECTION 3 IS THEREFORE BUILT AROUND ONE IDEA — **EQUIVALENCE**. It does not
-- merely assert that the transcribed predicate does what we think. It switches
-- to the real `anon` / `authenticated` roles, asks the RLS policy directly what
-- it admits, asks `app.event_detail` the same question, and fails if the two
-- ever disagree. The policy remains the source of truth; the body is checked
-- against it.
--
-- IT ALSO COVERS WHAT THE UI CANNOT. Drafts and `pending_payment` rows are not
-- reachable through the app (no draft id is ever surfaced — the wizard's URL is
-- `/create/event` throughout and a row id exists only after insert), so the
-- signed-out click-through pass could not test them. They are exactly the rows
-- a verbatim definer move would have leaked. Here they are testable.
-- ============================================================================


-- ############################################################################
-- SECTION 1 — Privilege state. Read-only. Run this first.
--
-- THE ONE-LINE SUMMARY OF THE ARC: anon must NOT hold select on
-- events.workspace_id, and authenticated must still hold it. Everything else
-- here is the control set that proves the revoke was surgical rather than a
-- blanket denial — the failure mode where the storefront breaks is a
-- controls-fail, not a target-fail.
--
-- Every row should read pass = true.
-- ############################################################################
select * from (
  values
    ('1a. TARGET: anon cannot read events.workspace_id',
     'false', has_column_privilege('anon', 'public.events', 'workspace_id', 'select')::text,
     has_column_privilege('anon', 'public.events', 'workspace_id', 'select') = false),

    ('1b. DELIBERATE GAP: authenticated still can',
     'true', has_column_privilege('authenticated', 'public.events', 'workspace_id', 'select')::text,
     has_column_privilege('authenticated', 'public.events', 'workspace_id', 'select') = true),

    ('1c. CONTROL: anon still reads events.title',
     'true', has_column_privilege('anon', 'public.events', 'title', 'select')::text,
     has_column_privilege('anon', 'public.events', 'title', 'select') = true),

    ('1d. CONTROL: anon still reads events.curbside_anonymous',
     'true', has_column_privilege('anon', 'public.events', 'curbside_anonymous', 'select')::text,
     has_column_privilege('anon', 'public.events', 'curbside_anonymous', 'select') = true),

    -- 0021's columns. If these ever come off, the storefront 42501s again.
    ('1e. CONTROL: anon still reads events.deleted_at (0021)',
     'true', has_column_privilege('anon', 'public.events', 'deleted_at', 'select')::text,
     has_column_privilege('anon', 'public.events', 'deleted_at', 'select') = true),

    ('1f. CONTROL: anon still reads events.archived_at (0021)',
     'true', has_column_privilege('anon', 'public.events', 'archived_at', 'select')::text,
     has_column_privilege('anon', 'public.events', 'archived_at', 'select') = true),

    -- Still host-only. Unrelated to this arc; asserted because it is the other
    -- column-privacy ruling on this table and a re-grant would be silent.
    ('1g. CONTROL: publish_fee_cents still hidden from anon (0011)',
     'false', has_column_privilege('anon', 'public.events', 'publish_fee_cents', 'select')::text,
     has_column_privilege('anon', 'public.events', 'publish_fee_cents', 'select') = false),

    -- The 0028 conversion. anon EXECUTE on the app definers is load-bearing:
    -- the public wrappers are INVOKER, so their bodies run as the caller.
    ('1h. anon can execute app.events_within_radius',
     'true', has_function_privilege('anon', 'app.events_within_radius(double precision, double precision, double precision)', 'execute')::text,
     has_function_privilege('anon', 'app.events_within_radius(double precision, double precision, double precision)', 'execute') = true),

    ('1i. anon can execute app.event_detail',
     'true', has_function_privilege('anon', 'app.event_detail(uuid, double precision, double precision)', 'execute')::text,
     has_function_privilege('anon', 'app.event_detail(uuid, double precision, double precision)', 'execute') = true),

    ('1j. anon can execute public.events_within_radius',
     'true', has_function_privilege('anon', 'public.events_within_radius(double precision, double precision, double precision)', 'execute')::text,
     has_function_privilege('anon', 'public.events_within_radius(double precision, double precision, double precision)', 'execute') = true),

    ('1k. anon can execute public.event_detail',
     'true', has_function_privilege('anon', 'public.event_detail(uuid, double precision, double precision)', 'execute')::text,
     has_function_privilege('anon', 'public.event_detail(uuid, double precision, double precision)', 'execute') = true)
) as t(step, expected, actual, pass);


-- ############################################################################
-- SECTION 2 — The 0028 conversion, as the catalog sees it. Read-only.
--
-- security_definer, search_path and volatility on all four functions. The
-- `extensions` entry on the two app definers is the load-bearing one: PostGIS
-- moved to that schema in 0003, and without it st_dwithin / st_distance /
-- st_setsrid / st_makepoint do not resolve and the feed returns nothing with no
-- obvious cause.
--
-- EXPECTED, all four rows:
--   app.events_within_radius     definer=true   search_path=public, app, extensions   stable
--   app.event_detail             definer=true   search_path=public, app, extensions   stable
--   public.events_within_radius  definer=false  search_path=public, app               stable
--   public.event_detail          definer=false  search_path=public, app               stable
-- ############################################################################
select
  n.nspname                                              as schema,
  p.proname                                              as function,
  p.prosecdef                                            as security_definer,
  coalesce(array_to_string(p.proconfig, ', '), '(NONE)')  as config,
  case p.provolatile when 's' then 'stable'
                     when 'i' then 'immutable'
                     else 'volatile' end                 as volatility,
  pg_get_function_identity_arguments(p.oid)              as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('app', 'public')
  and p.proname in ('events_within_radius', 'event_detail')
order by n.nspname, p.proname;


-- ############################################################################
-- SECTION 3 — The behavioral suite. BEGIN … ROLLBACK; nothing persists.
--
-- Fixtures: one workspace owned by user A, one event in each lifecycle state,
-- and three vantage points — the HOST (a member), a STRANGER (no membership, no
-- attendance) and an ATTENDEE (no membership, but an RSVP on the ended event).
--
-- Roles are switched for real with SET LOCAL ROLE, because RLS does not apply
-- to the table owner and a check run as postgres would prove nothing. Results
-- are captured into plpgsql variables while the role is switched and recorded
-- only after RESET ROLE, so nothing writes to the temp table as anon.
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

-- Records to the grid AND to the Messages pane, so results survive even if a
-- later statement aborts the transaction outright.
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
  u_host      uuid;
  u_stranger  uuid;
  u_attendee  uuid;
  ws          uuid;
  ws_name     text;
  ev_live     uuid;
  ev_arch_fut uuid;
  ev_arch_end uuid;
  ev_del_end  uuid;
  ev_draft    uuid;
  ev_pending  uuid;
  ev_anon     uuid;
  n           integer;
  n_rls       integer;
  n_fn        integer;
  r           record;
  ev          uuid;
  lbl         text;
  qa_addr     constant text := '18680 S Nogales Hwy';
  qa_lat      constant double precision := 31.9600;
  qa_lng      constant double precision := -110.9700;
begin
  ---------------------------------------------------------------------------
  -- Fixtures. Three distinct profiles are required for the three vantage
  -- points; the attendee must NOT be a member or branch 3 is untested (branch
  -- 1 would admit them first and the check would pass for the wrong reason).
  ---------------------------------------------------------------------------
  select id into u_host     from public.profiles order by created_at limit 1;
  select id into u_stranger from public.profiles where id <> u_host order by created_at limit 1;
  select id into u_attendee from public.profiles where id not in (u_host, u_stranger)
    order by created_at limit 1;

  if u_host is null or u_stranger is null or u_attendee is null then
    perform pg_temp.rec('00. fixtures', 'at least three profiles exist',
                        'fewer than three — cannot run', false);
    return;
  end if;

  -- Clear the ledger for the host so the curbside fixture's quota trigger does
  -- not reject it. Rolled back with everything else.
  delete from public.curbside_quota_ledger where user_id = u_host;

  perform set_config('request.jwt.claims',
    json_build_object('sub', u_host::text, 'role', 'authenticated')::text, true);

  insert into public.workspaces (name, created_by)
  values ('QA 0028/0029 workspace', u_host)
  returning id, name into ws, ws_name;

  -- NO explicit membership insert: 0001's `on_workspace_created` trigger seeds
  -- the owner row from `created_by`, and inserting it again violates the
  -- memberships PK. Branch 1 keys on that row via `app.is_member`; it is
  -- asserted rather than assumed, because every E-check depends on it.
  select count(*) into n from public.memberships
   where workspace_id = ws and user_id = u_host and role = 'owner';
  perform pg_temp.rec('00. fixture: owner membership auto-seeded (0001 trigger)',
    '1 row', n::text || ' row(s)', n = 1);

  -- One event per lifecycle state. `location` is set on all of them so the feed
  -- test exercises the real PostGIS path rather than skipping on a null.
  insert into public.events
    (workspace_id, title, tier_id, status, starts_at, ends_at, address, location)
  values
    (ws, 'QA live',            'standard', 'published',
     now() + interval '1 day',  now() + interval '1 day 4 hours',  qa_addr,
     extensions.st_setsrid(extensions.st_makepoint(qa_lng, qa_lat), 4326)::extensions.geography),
    (ws, 'QA archived future', 'standard', 'published',
     now() + interval '2 days', now() + interval '2 days 4 hours', qa_addr,
     extensions.st_setsrid(extensions.st_makepoint(qa_lng, qa_lat), 4326)::extensions.geography),
    (ws, 'QA archived ended',  'standard', 'published',
     now() - interval '2 days', now() - interval '1 day',          qa_addr,
     extensions.st_setsrid(extensions.st_makepoint(qa_lng, qa_lat), 4326)::extensions.geography),
    (ws, 'QA deleted ended',   'standard', 'published',
     now() - interval '2 days', now() - interval '1 day',          qa_addr,
     extensions.st_setsrid(extensions.st_makepoint(qa_lng, qa_lat), 4326)::extensions.geography),
    (ws, 'QA draft',           'standard', 'draft',
     now() + interval '3 days', now() + interval '3 days 4 hours', qa_addr,
     extensions.st_setsrid(extensions.st_makepoint(qa_lng, qa_lat), 4326)::extensions.geography),
    (ws, 'QA pending',         'standard', 'pending_payment',
     now() + interval '4 days', now() + interval '4 days 4 hours', qa_addr,
     extensions.st_setsrid(extensions.st_makepoint(qa_lng, qa_lat), 4326)::extensions.geography);

  select id into ev_live     from public.events where workspace_id = ws and title = 'QA live';
  select id into ev_arch_fut from public.events where workspace_id = ws and title = 'QA archived future';
  select id into ev_arch_end from public.events where workspace_id = ws and title = 'QA archived ended';
  select id into ev_del_end  from public.events where workspace_id = ws and title = 'QA deleted ended';
  select id into ev_draft    from public.events where workspace_id = ws and title = 'QA draft';
  select id into ev_pending  from public.events where workspace_id = ws and title = 'QA pending';

  update public.events set archived_at = now() where id in (ev_arch_fut, ev_arch_end);
  update public.events set deleted_at  = now() where id = ev_del_end;

  -- The anonymity fixture. Real curbside tier, so the masking is exercised on
  -- the row shape it was written for.
  insert into public.events
    (workspace_id, title, tier_id, status, starts_at, ends_at, address, location,
     curbside_anonymous)
  values
    (ws, 'QA anonymous curbside', 'curbside', 'published',
     now() + interval '1 day', now() + interval '1 day 4 hours', qa_addr,
     extensions.st_setsrid(extensions.st_makepoint(qa_lng, qa_lat), 4326)::extensions.geography,
     true)
  returning id into ev_anon;

  -- The attendee's claim on the ended archived event. Branch 3 keys on this.
  insert into public.rsvps (event_id, user_id) values (ev_arch_end, u_attendee);

  ---------------------------------------------------------------------------
  -- (A) THE 0021 REGRESSION GUARD. Can anon call the two public read paths at
  -- all, now that the column grant behind them is gone? This is the check that
  -- would have caught the 0020 -> 0021 outage, and the whole reason 0028 had to
  -- land before 0029.
  ---------------------------------------------------------------------------
  begin
    perform set_config('request.jwt.claims',
      json_build_object('role', 'anon')::text, true);
    execute 'set local role anon';

    select count(*) into n from public.events_within_radius(qa_lat, qa_lng, 25);
    execute 'reset role';
    perform pg_temp.rec('A1. anon calls public.events_within_radius',
      'succeeds (no 42501), >= 1 row',
      n::text || ' row(s)', n >= 1);
  exception when others then
    execute 'reset role';
    perform pg_temp.rec('A1. anon calls public.events_within_radius',
      'succeeds (no 42501)', 'RAISED: ' || sqlstate || ' ' || sqlerrm, false);
  end;

  begin
    execute 'set local role anon';
    select count(*) into n from public.event_detail(ev_live, qa_lat, qa_lng);
    execute 'reset role';
    perform pg_temp.rec('A2. anon calls public.event_detail',
      'succeeds (no 42501), exactly 1 row',
      n::text || ' row(s)', n = 1);
  exception when others then
    execute 'reset role';
    perform pg_temp.rec('A2. anon calls public.event_detail',
      'succeeds (no 42501)', 'RAISED: ' || sqlstate || ' ' || sqlerrm, false);
  end;

  ---------------------------------------------------------------------------
  -- (B) THE 0029 REVOKE, from the role it names. A direct read of the column
  -- must fail; a read without it must succeed.
  ---------------------------------------------------------------------------
  begin
    execute 'set local role anon';
    execute 'select workspace_id from public.events where id = $1' using ev_anon;
    execute 'reset role';
    perform pg_temp.rec('B1. anon reads events.workspace_id directly',
      'denied 42501', 'SUCCEEDED — THE REVOKE IS NOT IN EFFECT', false);
  exception when insufficient_privilege then
    execute 'reset role';
    perform pg_temp.rec('B1. anon reads events.workspace_id directly',
      'denied 42501', 'denied 42501', true);
  when others then
    execute 'reset role';
    perform pg_temp.rec('B1. anon reads events.workspace_id directly',
      'denied 42501', 'RAISED: ' || sqlstate || ' ' || sqlerrm, false);
  end;

  begin
    execute 'set local role anon';
    execute 'select id, title from public.events where id = $1' using ev_live;
    execute 'reset role';
    perform pg_temp.rec('B2. CONTROL: anon reads events without that column',
      'succeeds', 'succeeds', true);
  exception when others then
    execute 'reset role';
    perform pg_temp.rec('B2. CONTROL: anon reads events without that column',
      'succeeds', 'RAISED: ' || sqlstate || ' ' || sqlerrm, false);
  end;

  begin
    perform set_config('request.jwt.claims',
      json_build_object('sub', u_host::text, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    execute 'select workspace_id from public.events where id = $1' using ev_live;
    execute 'reset role';
    perform pg_temp.rec('B3. DELIBERATE GAP: authenticated still reads it',
      'succeeds — deferred, tracked, not closed', 'succeeds', true);
  exception when others then
    execute 'reset role';
    perform pg_temp.rec('B3. DELIBERATE GAP: authenticated still reads it',
      'succeeds — deferred, tracked, not closed',
      'RAISED: ' || sqlstate || ' ' || sqlerrm || ' — Saved and Workspace are broken', false);
  end;

  ---------------------------------------------------------------------------
  -- (C) THE MASK, both directions. An anonymous post must return neither the
  -- organizer name nor the id that would resolve to it; a named one must return
  -- both, or the mask is just a broken function.
  ---------------------------------------------------------------------------
  select count(*) into n from app.event_detail(ev_anon, qa_lat, qa_lng) d
   where d.organizer_name is null and d.workspace_id is null;
  perform pg_temp.rec('C1. anonymous post masks name AND workspace_id',
    '1 row with both null', n::text || ' row(s) matching', n = 1);

  select count(*) into n from app.event_detail(ev_live, qa_lat, qa_lng) d
   where d.organizer_name = ws_name and d.workspace_id = ws;
  perform pg_temp.rec('C2. named post returns both (mask is not blanket)',
    '1 row with both populated', n::text || ' row(s) matching', n = 1);

  select count(*) into n from app.events_within_radius(qa_lat, qa_lng, 25) f
   where f.id = ev_anon and f.organizer_name is null;
  perform pg_temp.rec('C3. feed masks the anonymous post too',
    '1 masked row', n::text || ' row(s) matching', n = 1);

  ---------------------------------------------------------------------------
  -- (D) THE TRANSCRIBED PREDICATE — what 0028 moved out of the policy.
  -- Vantage: STRANGER. No membership, no attendance. Sees the storefront only.
  --
  -- D3 and D4 ARE THE ROWS THE UI CANNOT REACH and the exact rows a verbatim
  -- definer move would have leaked.
  ---------------------------------------------------------------------------
  perform set_config('request.jwt.claims',
    json_build_object('sub', u_stranger::text, 'role', 'authenticated')::text, true);

  select count(*) into n from app.event_detail(ev_live, qa_lat, qa_lng);
  perform pg_temp.rec('D1. stranger sees a live published event',
    '1 row (branch 2)', n::text || ' row(s)', n = 1);

  select count(*) into n from app.event_detail(ev_arch_fut, qa_lat, qa_lng);
  perform pg_temp.rec('D2. stranger CANNOT see an archived event',
    '0 rows — archive means off the storefront', n::text || ' row(s)', n = 0);

  select count(*) into n from app.event_detail(ev_draft, qa_lat, qa_lng);
  perform pg_temp.rec('D3. stranger CANNOT see a DRAFT (untestable via UI)',
    '0 rows', n::text || ' row(s)', n = 0);

  select count(*) into n from app.event_detail(ev_pending, qa_lat, qa_lng);
  perform pg_temp.rec('D4. stranger CANNOT see a pending_payment row (untestable via UI)',
    '0 rows', n::text || ' row(s)', n = 0);

  select count(*) into n from app.event_detail(ev_del_end, qa_lat, qa_lng);
  perform pg_temp.rec('D5. stranger CANNOT see a deleted event',
    '0 rows', n::text || ' row(s)', n = 0);

  select count(*) into n from app.event_detail(ev_arch_end, qa_lat, qa_lng);
  perform pg_temp.rec('D6. stranger CANNOT see the ENDED archived event',
    '0 rows — branch 3 needs attendance, not just an ended event',
    n::text || ' row(s)', n = 0);

  ---------------------------------------------------------------------------
  -- (E) Vantage: HOST (branch 1). Everything they own except what they deleted.
  ---------------------------------------------------------------------------
  perform set_config('request.jwt.claims',
    json_build_object('sub', u_host::text, 'role', 'authenticated')::text, true);

  select count(*) into n from app.event_detail(ev_arch_fut, qa_lat, qa_lng);
  perform pg_temp.rec('E1. host CAN see their own archived event',
    '1 row (branch 1) — Workspace archived rows must stay tappable',
    n::text || ' row(s)', n = 1);

  select count(*) into n from app.event_detail(ev_draft, qa_lat, qa_lng);
  perform pg_temp.rec('E2. host CAN see their own draft',
    '1 row (branch 1)', n::text || ' row(s)', n = 1);

  select count(*) into n from app.event_detail(ev_del_end, qa_lat, qa_lng);
  perform pg_temp.rec('E3. host CANNOT see their own DELETED event',
    '0 rows — deleted_at is filtered unconditionally, above the branches',
    n::text || ' row(s)', n = 0);

  ---------------------------------------------------------------------------
  -- (F) Vantage: ATTENDEE (branch 3). The narrow exception — AD 8's rule that
  -- a host may withdraw what has not happened but may not rewrite what has.
  ---------------------------------------------------------------------------
  perform set_config('request.jwt.claims',
    json_build_object('sub', u_attendee::text, 'role', 'authenticated')::text, true);

  select count(*) into n from app.event_detail(ev_arch_end, qa_lat, qa_lng);
  perform pg_temp.rec('F1. attendee CAN see the ended archived event they RSVPd',
    '1 row (branch 3)', n::text || ' row(s)', n = 1);

  select count(*) into n from app.event_detail(ev_arch_fut, qa_lat, qa_lng);
  perform pg_temp.rec('F2. attendee CANNOT see an archived event that has NOT ended',
    '0 rows — the exception requires the event to be over',
    n::text || ' row(s)', n = 0);

  ---------------------------------------------------------------------------
  -- (G) THE FEED. Storefront-only, no member branch, no history branch.
  ---------------------------------------------------------------------------
  perform set_config('request.jwt.claims',
    json_build_object('sub', u_host::text, 'role', 'authenticated')::text, true);

  select count(*) into n from app.events_within_radius(qa_lat, qa_lng, 25) f
   where f.id = ev_live;
  perform pg_temp.rec('G1. feed includes the live event', '1', n::text, n = 1);

  select count(*) into n from app.events_within_radius(qa_lat, qa_lng, 25) f
   where f.id in (ev_arch_fut, ev_arch_end, ev_del_end, ev_draft, ev_pending);
  perform pg_temp.rec('G2. feed excludes archived / deleted / draft / pending',
    '0 — even for the HOST, who can see them elsewhere', n::text, n = 0);

  ---------------------------------------------------------------------------
  -- (H) EQUIVALENCE — the assertion this whole suite exists for.
  --
  -- 0028 claimed the definer returns the identical set the invoker returned
  -- under RLS. Here that claim is tested rather than trusted: switch to the real
  -- role, ask the POLICY what it admits, ask the FUNCTION the same question, and
  -- fail on any disagreement. The policy stays the source of truth.
  --
  -- The RLS-side probe mirrors the function's own unconditional `deleted_at is
  -- null`, so the two are answering the same question.
  ---------------------------------------------------------------------------
  for r in
    select * from (values
      (u_stranger, 'stranger'),
      (u_host,     'host'),
      (u_attendee, 'attendee')
    ) as v(uid, who)
  loop
    foreach ev in array array[ev_live, ev_arch_fut, ev_arch_end, ev_del_end, ev_draft, ev_pending, ev_anon]
    loop
      perform set_config('request.jwt.claims',
        json_build_object('sub', r.uid::text, 'role', 'authenticated')::text, true);

      execute 'set local role authenticated';
      select count(*) into n_rls
        from public.events e
       where e.id = ev and e.deleted_at is null;
      select count(*) into n_fn
        from app.event_detail(ev, qa_lat, qa_lng);
      execute 'reset role';

      select title into lbl from public.events where id = ev;

      perform pg_temp.rec(
        format('H. equivalence — %s viewing "%s"', r.who, lbl),
        format('policy and function agree (policy says %s)',
               case when n_rls > 0 then 'visible' else 'hidden' end),
        format('policy=%s function=%s',
               case when n_rls > 0 then 'visible' else 'hidden' end,
               case when n_fn  > 0 then 'visible' else 'hidden' end),
        (n_rls > 0) = (n_fn > 0));
    end loop;
  end loop;
end;
$$;

select seq, step, expected, actual, pass from qa_results order by seq;

-- Uncomment to see only what failed on a long grid:
-- select seq, step, expected, actual from qa_results where not pass order by seq;

rollback;

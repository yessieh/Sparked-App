-- ============================================================================
-- BEHAVIORAL SUITE — Curbside history does not survive (migration 0030).
--
-- WHERE TO RUN: Supabase dashboard → SQL Editor, on the DEV project
-- (`Sparked-App`, ref kzynvvdggooqgtnprhrm). Never against prod.
--
-- HOW TO RUN: three numbered sections, one at a time, top to bottom; paste the
-- result grids back. Sections 1 and 2 are READ-ONLY. Section 3 is wrapped in
-- BEGIN … ROLLBACK and creates its own throwaway workspace, fixtures and
-- events — **nothing it does persists.**
--
-- RUN IT AFTER 0030 IS APPLIED. Before that, Section 1 fails on the helper's
-- grants and Section 3 fails every target assertion, which is the correct
-- result and not informative.
--
-- ---------------------------------------------------------------------------
-- WHAT 0030 CLAIMS, AND WHAT THIS SUITE HAS TO DISPROVE.
--
-- An ended CURBSIDE event leaves public reach entirely — feed, search, detail
-- by direct link, and the attendee's own Saved → Past — while the host keeps it
-- in Workspace and while ended PAID events are untouched.
--
-- That is one rule with two edges, and a suite that only proves the first edge
-- is worthless: "hide ended Curbside" is trivially satisfied by hiding
-- everything. **Half the assertions below are negative controls** whose job is
-- to fail loudly if the change was broader than the ruling.
--
-- ASSERTION 2 IS THE ONE THE RULING RESTS ON. An ended Curbside post that the
-- CALLER THEMSELVES saved or RSVP'd to must still be invisible to them. That is
-- the Saved → Past closure, it is the branch 0022 wrote specifically to admit
-- such a row, and it is the only assertion here that contradicts a previously
-- locked rule rather than extending one. Assertion 4 is its mirror — the same
-- row shape with the tier flipped to paid, which MUST stay visible. If 2 and 4
-- ever both pass or both fail, the change is not keyed on tier and nothing else
-- in this file matters.
--
-- ---------------------------------------------------------------------------
-- THE SIX, AND WHICH DIRECTION EACH ONE GUARDS:
--
--   1. Ended Curbside → invisible to a stranger, on all four read paths.   TARGET
--   2. Ended Curbside → invisible to the ATTENDEE who claimed it.          TARGET ★
--   3. Ended Curbside → VISIBLE to the host (member branch).               CONTROL
--   4. Ended PAID with attendance → still VISIBLE.                         CONTROL
--   5. LIVE Curbside → still visible everywhere it was.                    CONTROL
--   6. event_categories rows follow the parent in every case above.        COHERENCE
--
-- Plus EQUIVALENCE, inherited from qa-0028-0029: for every (viewer, event)
-- pair, ask the RLS policy and `app.event_detail` the same question and fail if
-- they ever disagree. 0030 edits BOTH a policy and three transcribed definer
-- bodies, so a copy that drifts from the other is this arc's characteristic
-- failure — and it is invisible to every catalog check.
--
-- ---------------------------------------------------------------------------
-- ONE FIXTURE DETAIL THAT IS LOAD-BEARING: the Curbside fixtures are created
-- with `curbside_anonymous = false`, deliberately.
--
-- `app.organizer_profile` has filtered `not e.curbside_anonymous` since 0009.
-- If the fixture were anonymous, every organizer-profile assertion would pass
-- on the OLD filter and prove nothing about the new one. A NAMED Curbside post
-- is admitted by the 0009 mask and must be refused by 0030's test — which is
-- the only way to show the two are different rules.
--
-- ---------------------------------------------------------------------------
-- READ THIS BEFORE CONCLUDING THE LEDGER DANCE BELOW IS EVIDENCE OF A BUG.
--
-- The Curbside fixture setup deletes a `curbside_quota_ledger` row and then
-- puts it back. Anyone tracing that will find that
-- `app.consume_curbside_credit` is an AFTER INSERT **OR UPDATE** trigger which
-- raises `curbside_quota_exhausted` when the poster's credits are spent — and
-- will reasonably conclude that RSVPing on a Curbside post blows up in
-- production, because `app.bump_rsvp_count` UPDATEs `events.rsvp_count` on
-- every RSVP. **IT DOES NOT, AND THE REASON IS THE FUNCTION'S FIRST FIVE
-- LINES:**
--
--     if exists (select 1 from public.curbside_quota_ledger l
--                 where l.event_id = new.id)
--     then return null; end if;
--
-- A real published Curbside post KEEPS its own ledger row, so every UPDATE to
-- it short-circuits on that guard and never reaches the quota check. (0019
-- added `new.deleted_at is null` to the trigger's WHEN clause for the same
-- class of problem on soft delete.)
--
-- The hazard exists only inside this file, and only because the fixture needs
-- TWO Curbside posts for one poster — a state the quota forbids. Clearing the
-- ledger to get the second one in also strips the first one's short-circuit,
-- which is why the row is restored immediately afterwards and why an invariant
-- check enforces it. That is a fixture problem with a fixture fix; nothing in
-- migration 0030 was changed to accommodate it.
-- ============================================================================


-- ############################################################################
-- SECTION 1 — Privilege state. Read-only. Run this first.
--
-- 0030's entire grant delta is one new function and its two grants. Everything
-- else here is a control set proving the three CREATE OR REPLACE statements
-- PRESERVED the ACLs they were supposed to preserve — the failure mode being a
-- signature or return-type drift that silently turned a replace into a
-- drop-and-create and reset them.
--
-- Every row should read pass = true.
-- ############################################################################
select * from (
  values
    ('1a. TARGET: helper exists and anon can execute it',
     'true',
     has_function_privilege('anon', 'app.curbside_expired(text, timestamptz, timestamptz)', 'execute')::text,
     has_function_privilege('anon', 'app.curbside_expired(text, timestamptz, timestamptz)', 'execute') = true),

    ('1b. TARGET: authenticated can execute it',
     'true',
     has_function_privilege('authenticated', 'app.curbside_expired(text, timestamptz, timestamptz)', 'execute')::text,
     has_function_privilege('authenticated', 'app.curbside_expired(text, timestamptz, timestamptz)', 'execute') = true),

    -- The implicit PUBLIC EXECUTE that CREATE FUNCTION mints. 0030 revokes it.
    -- If this reads true the revoke did not run, and the standing grant check
    -- has been violated by omission rather than by intent.
    -- An aclitem with an EMPTY grantee is PUBLIC, and renders as `=X/owner`.
    -- has_function_privilege cannot be asked this — PUBLIC is a pseudo-role and
    -- passing 'public' as a role name errors — so the catalog is read directly.
    ('1c. TARGET: PUBLIC does NOT hold execute on the helper',
     'false',
     (select coalesce(bool_or(a.item::text like '=%'), false)
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        cross join lateral unnest(coalesce(p.proacl, '{}'::aclitem[])) as a(item)
       where n.nspname = 'app' and p.proname = 'curbside_expired')::text,
     (select coalesce(bool_or(a.item::text like '=%'), false)
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        cross join lateral unnest(coalesce(p.proacl, '{}'::aclitem[])) as a(item)
       where n.nspname = 'app' and p.proname = 'curbside_expired') = false),

    -- ACL SURVIVAL. All three read paths were CREATE OR REPLACE with identical
    -- signatures, so these must be exactly what they were before 0030.
    ('1d. CONTROL: anon still executes app.events_within_radius',
     'true',
     has_function_privilege('anon', 'app.events_within_radius(double precision, double precision, double precision)', 'execute')::text,
     has_function_privilege('anon', 'app.events_within_radius(double precision, double precision, double precision)', 'execute') = true),

    ('1e. CONTROL: anon still executes app.event_detail',
     'true',
     has_function_privilege('anon', 'app.event_detail(uuid, double precision, double precision)', 'execute')::text,
     has_function_privilege('anon', 'app.event_detail(uuid, double precision, double precision)', 'execute') = true),

    ('1f. CONTROL: anon still executes app.organizer_profile',
     'true',
     has_function_privilege('anon', 'app.organizer_profile(uuid)', 'execute')::text,
     has_function_privilege('anon', 'app.organizer_profile(uuid)', 'execute') = true),

    ('1g. CONTROL: anon still executes public.events_within_radius',
     'true',
     has_function_privilege('anon', 'public.events_within_radius(double precision, double precision, double precision)', 'execute')::text,
     has_function_privilege('anon', 'public.events_within_radius(double precision, double precision, double precision)', 'execute') = true),

    ('1h. CONTROL: anon still executes public.event_detail',
     'true',
     has_function_privilege('anon', 'public.event_detail(uuid, double precision, double precision)', 'execute')::text,
     has_function_privilege('anon', 'public.event_detail(uuid, double precision, double precision)', 'execute') = true),

    ('1i. CONTROL: anon still executes public.organizer_profile',
     'true',
     has_function_privilege('anon', 'public.organizer_profile(uuid)', 'execute')::text,
     has_function_privilege('anon', 'public.organizer_profile(uuid)', 'execute') = true),

    -- 0021's columns and 0029's revoke, asserted because a re-grant or a
    -- re-revoke here would be silent and unrelated to this arc.
    ('1j. CONTROL: anon still reads events.deleted_at (0021)',
     'true', has_column_privilege('anon', 'public.events', 'deleted_at', 'select')::text,
     has_column_privilege('anon', 'public.events', 'deleted_at', 'select') = true),

    ('1k. CONTROL: anon still cannot read events.workspace_id (0029)',
     'false', has_column_privilege('anon', 'public.events', 'workspace_id', 'select')::text,
     has_column_privilege('anon', 'public.events', 'workspace_id', 'select') = false)
) as t(step, expected, actual, pass);


-- ############################################################################
-- SECTION 2 — The catalog after 0030. Read-only.
--
-- THE POINT OF THIS SECTION: 0030 replaced three function bodies. A replace
-- that accidentally changed volatility, security or search_path would keep
-- working in most tests and fail somewhere far away — the `extensions` entry in
-- particular, because PostGIS moved schemas in 0003 and without it the feed
-- returns nothing with no obvious cause.
--
-- EXPECTED:
--   app.curbside_expired      definer=false  search_path=public, app               stable
--   app.event_detail          definer=true   search_path=public, app, extensions   stable
--   app.events_within_radius  definer=true   search_path=public, app, extensions   stable
--   app.organizer_profile     definer=true   search_path=public, app               stable
--
-- The helper is the one INVOKER in the list, deliberately: it reads no table
-- and needs no elevation, so granting it definer rights would be privilege for
-- nothing.
-- ############################################################################
select
  n.nspname                                             as schema,
  p.proname                                             as function,
  p.prosecdef                                           as security_definer,
  coalesce(array_to_string(p.proconfig, ', '), '(NONE)') as config,
  case p.provolatile when 's' then 'stable'
                     when 'i' then 'immutable'
                     else 'volatile' end                as volatility,
  pg_get_function_identity_arguments(p.oid)             as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'app'
  and p.proname in ('curbside_expired', 'event_detail',
                    'events_within_radius', 'organizer_profile')
order by p.proname;

-- The two policies, as the catalog holds them. Read the `using_expr` and
-- confirm by eye that `curbside_expired` appears TWICE in each (branches 2 and
-- 3) and that the `is_member` branch does NOT mention it — that branch is what
-- keeps the host's ended Curbside posts in Workspace, and it is the one edit
-- this migration must not have made.
select
  c.relname                       as table_name,
  pol.polname                     as policy_name,
  pg_get_expr(pol.polqual, pol.polrelid) as using_expr
from pg_policy pol
join pg_class c on c.oid = pol.polrelid
where pol.polname in ('events_select_public', 'event_categories_select_public')
order by c.relname;


-- ############################################################################
-- SECTION 3 — The behavioral suite. BEGIN … ROLLBACK; nothing persists.
--
-- Fixtures: one workspace owned by the HOST, four events (Curbside ended,
-- Curbside live, Paid ended, Paid live), and three vantage points — the HOST
-- (a member), a STRANGER (no membership, no attendance) and an ATTENDEE (no
-- membership, but an RSVP on BOTH ended events).
--
-- The attendee holding a claim on both ended events is the design: assertions 2
-- and 4 then differ in exactly one variable, the tier. Any result where they
-- agree means the rule is not keyed on tier.
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
  ev_cb_end   uuid;
  ev_cb_live  uuid;
  ev_pd_end   uuid;
  ev_pd_live  uuid;
  n           integer;
  n_rls       integer;
  n_fn        integer;
  n_cat       integer;
  b           boolean;
  r           record;
  ev          uuid;
  lbl         text;
  qa_addr     constant text := '18680 S Nogales Hwy';
  qa_lat      constant double precision := 31.9600;
  qa_lng      constant double precision := -110.9700;
begin
  ---------------------------------------------------------------------------
  -- Fixtures. Three distinct profiles for the three vantage points; the
  -- attendee must NOT be a member or branch 3 is untested (branch 1 would
  -- admit them first and every check would pass for the wrong reason).
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

  delete from public.curbside_quota_ledger where user_id = u_host;

  perform set_config('request.jwt.claims',
    json_build_object('sub', u_host::text, 'role', 'authenticated')::text, true);

  insert into public.workspaces (name, created_by)
  values ('QA 0030 workspace', u_host)
  returning id into ws;

  -- 0001's on_workspace_created trigger seeds the owner membership. Branch 1
  -- keys on it through app.is_member, and assertion 3 depends on it entirely.
  select count(*) into n from public.memberships
   where workspace_id = ws and user_id = u_host and role = 'owner';
  perform pg_temp.rec('00. fixture: owner membership auto-seeded (0001 trigger)',
    '1 row', n::text || ' row(s)', n = 1);

  ---------------------------------------------------------------------------
  -- The two PAID fixtures. Inserted first because they trip no curbside
  -- trigger at all — the quota trigger's WHEN clause gates on tier.
  ---------------------------------------------------------------------------
  insert into public.events
    (workspace_id, title, tier_id, status, starts_at, ends_at, address, location)
  values
    (ws, 'QA paid ended', 'standard', 'published',
     now() - interval '2 days', now() - interval '1 day', qa_addr, extensions.st_setsrid(extensions.st_makepoint(qa_lng, qa_lat), 4326)::extensions.geography),
    (ws, 'QA paid live',  'standard', 'published',
     now() + interval '1 day', now() + interval '1 day 4 hours', qa_addr, extensions.st_setsrid(extensions.st_makepoint(qa_lng, qa_lat), 4326)::extensions.geography);

  select id into ev_pd_end  from public.events where workspace_id = ws and title = 'QA paid ended';
  select id into ev_pd_live from public.events where workspace_id = ws and title = 'QA paid live';

  ---------------------------------------------------------------------------
  -- The two CURBSIDE fixtures.
  --
  -- curbside_anonymous = FALSE on both, deliberately — see the header. An
  -- anonymous fixture would be hidden from organizer_profile by 0009's mask and
  -- every profile assertion would pass without touching 0030's rule.
  --
  -- THE LEDGER IS CLEARED BETWEEN THEM AND RESTORED IMMEDIATELY AFTER. Both
  -- halves are load-bearing and the second one is not obvious.
  --
  -- WHY THE DELETE: `consume_curbside_credit` writes one ledger row per
  -- Curbside post and refuses at used >= 1 — one free post per rolling 100
  -- days. Two Curbside fixtures for one poster would raise
  -- `curbside_quota_exhausted` on the second insert.
  --
  -- WHY THE RESTORE: the trigger is AFTER INSERT **OR UPDATE**, and the only
  -- thing that stops it re-running the quota check on an UPDATE is the
  -- idempotency guard at the top of the function — "already paid for … this is
  -- an edit" — which fires when a ledger row exists FOR THAT EVENT. Delete the
  -- row and the event stops short-circuiting. The very next UPDATE to it then
  -- falls through to the quota check and raises. In this suite that UPDATE is
  -- `bump_rsvp_count` firing on the attendee's RSVP, roughly forty lines below,
  -- and the abort surfaces there with no visible connection to this delete.
  --
  -- THE WINDOW BETWEEN THE DELETE AND THE RESTORE MUST CONTAIN NO UPDATE TO A
  -- CURBSIDE ROW. Today it contains exactly one statement: the second insert.
  -- The invariant check below is what enforces that going forward.
  --
  -- The poster ends on used = 2, which the quota would never permit in life.
  -- That is deliberate and inert: `curbside_quota_ledger` appears nowhere in
  -- `events_select_public` or in any of the three definers, so nothing this
  -- suite asserts can see it. This file tests visibility, not quota — quota is
  -- qa-0018's job.
  --
  -- Span stays under the 3-day cap 0016 enforces.
  ---------------------------------------------------------------------------
  insert into public.events
    (workspace_id, title, tier_id, status, starts_at, ends_at, address, location,
     curbside_anonymous)
  values
    (ws, 'QA curbside ended', 'curbside', 'published',
     now() - interval '2 days', now() - interval '1 day', qa_addr, extensions.st_setsrid(extensions.st_makepoint(qa_lng, qa_lat), 4326)::extensions.geography,
     false)
  returning id into ev_cb_end;

  delete from public.curbside_quota_ledger where user_id = u_host;

  insert into public.events
    (workspace_id, title, tier_id, status, starts_at, ends_at, address, location,
     curbside_anonymous)
  values
    (ws, 'QA curbside live', 'curbside', 'published',
     now() + interval '1 day', now() + interval '1 day 4 hours', qa_addr, extensions.st_setsrid(extensions.st_makepoint(qa_lng, qa_lat), 4326)::extensions.geography,
     false)
  returning id into ev_cb_live;

  -- THE RESTORE. Puts `ev_cb_end` back into the state every real published
  -- Curbside post is in — holding its own ledger row — so the idempotency guard
  -- short-circuits every later UPDATE to it, exactly as it does in production.
  insert into public.curbside_quota_ledger (user_id, event_id, consumed_at)
  values (u_host, ev_cb_end, now());

  -- THE CHECKED INVARIANT. Not decoration: the failure this replaces was an
  -- abort forty lines downstream with a quota error and no visible cause. If a
  -- future edit reorders the fixture, moves the restore, or adds a third
  -- Curbside row, this fails HERE, labelled, before any assertion runs.
  select count(*) into n
    from public.events e
    left join public.curbside_quota_ledger l on l.event_id = e.id
   where e.workspace_id = ws
     and e.tier_id = 'curbside'
     and l.event_id is null;
  perform pg_temp.rec(
    '00. INVARIANT: every curbside fixture holds a ledger row',
    '0 without one — or the next UPDATE to it raises curbside_quota_exhausted',
    n::text || ' curbside row(s) with no ledger row', n = 0);

  -- Assert the fixture is what the assertions assume. If auto_tag_curbside ever
  -- stops firing, assertion 6 would pass vacuously.
  select count(*) into n from public.event_categories
   where event_id = ev_cb_end and category_id = 'curbside';
  perform pg_temp.rec('00. fixture: curbside category auto-tagged (0001 trigger)',
    '1 row', n::text || ' row(s)', n = 1);

  -- A category on the paid ended event, so assertion 6's control has something
  -- to follow. 'music' is arbitrary and non-curbside (the event_categories
  -- guard reserves 'curbside' for the curbside tier).
  insert into public.event_categories (event_id, category_id)
  values (ev_pd_end, 'music');

  -- The attendee's claim on BOTH ended events. One variable between
  -- assertions 2 and 4.
  insert into public.rsvps (event_id, user_id) values (ev_cb_end, u_attendee);
  insert into public.rsvps (event_id, user_id) values (ev_pd_end, u_attendee);

  -- And the attendee must not be a member, or branch 1 admits them first.
  select count(*) into n from public.memberships
   where workspace_id = ws and user_id = u_attendee;
  perform pg_temp.rec('00. fixture: attendee is NOT a member',
    '0 rows', n::text || ' row(s)', n = 0);

  -- The helper itself, in isolation, before anything depends on it.
  select app.curbside_expired('curbside', now() - interval '2 days', now() - interval '1 day')
    into b;
  perform pg_temp.rec('00. helper: ended curbside → true', 'true', b::text, b = true);
  select app.curbside_expired('curbside', now() + interval '1 day', now() + interval '1 day 4 hours')
    into b;
  perform pg_temp.rec('00. helper: live curbside → false', 'false', b::text, b = false);
  select app.curbside_expired('standard', now() - interval '2 days', now() - interval '1 day')
    into b;
  perform pg_temp.rec('00. helper: ended PAID → false', 'false', b::text, b = false);
  -- The no-end-time grace, which is the whole reason the expression is a
  -- coalesce rather than a comparison against ends_at.
  select app.curbside_expired('curbside', now() - interval '4 hours', null) into b;
  perform pg_temp.rec('00. helper: curbside, no end time, started 4h ago → true (3h grace)',
    'true', b::text, b = true);
  select app.curbside_expired('curbside', now() - interval '1 hour', null) into b;
  perform pg_temp.rec('00. helper: curbside, no end time, started 1h ago → false (inside grace)',
    'false', b::text, b = false);

  ---------------------------------------------------------------------------
  -- ASSERTION 1 — TARGET. Ended Curbside is invisible to a STRANGER on all
  -- four read paths. anon is used for the three public ones; the RLS check runs
  -- as the stranger profile because a signed-in non-attendee is the same case.
  ---------------------------------------------------------------------------
  begin
    perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
    execute 'set local role anon';
    select count(*) into n from public.events where id = ev_cb_end;
    execute 'reset role';
    perform pg_temp.rec('1a. TARGET anon · RLS policy · ended curbside',
      '0 rows', n::text || ' row(s)', n = 0);
  exception when others then
    execute 'reset role';
    perform pg_temp.rec('1a. TARGET anon · RLS policy · ended curbside',
      '0 rows', 'RAISED: ' || sqlstate || ' ' || sqlerrm, false);
  end;

  begin
    execute 'set local role anon';
    select count(*) into n from public.events_within_radius(qa_lat, qa_lng, 25)
     where id = ev_cb_end;
    execute 'reset role';
    perform pg_temp.rec('1b. TARGET anon · feed (events_within_radius) · ended curbside',
      '0 rows', n::text || ' row(s)', n = 0);
  exception when others then
    execute 'reset role';
    perform pg_temp.rec('1b. TARGET anon · feed · ended curbside',
      '0 rows', 'RAISED: ' || sqlstate || ' ' || sqlerrm, false);
  end;

  begin
    execute 'set local role anon';
    select count(*) into n from public.event_detail(ev_cb_end, qa_lat, qa_lng);
    execute 'reset role';
    perform pg_temp.rec('1c. TARGET anon · event_detail (DIRECT LINK) · ended curbside',
      '0 rows', n::text || ' row(s)', n = 0);
  exception when others then
    execute 'reset role';
    perform pg_temp.rec('1c. TARGET anon · event_detail · ended curbside',
      '0 rows', 'RAISED: ' || sqlstate || ' ' || sqlerrm, false);
  end;

  begin
    execute 'set local role anon';
    select count(*) into n
      from public.organizer_profile(ws) p,
           lateral jsonb_array_elements(p.past) as e
     where (e ->> 'id')::uuid = ev_cb_end;
    execute 'reset role';
    perform pg_temp.rec('1d. TARGET anon · organizer_profile past[] · ended curbside (NAMED, not anonymous)',
      '0 rows', n::text || ' row(s)', n = 0);
  exception when others then
    execute 'reset role';
    perform pg_temp.rec('1d. TARGET anon · organizer_profile · ended curbside',
      '0 rows', 'RAISED: ' || sqlstate || ' ' || sqlerrm, false);
  end;

  -- WITHOUT THIS, 1d PASSES VACUOUSLY. An organizer_profile that returned
  -- nothing at all — a broken CTE, a workspace with no visible events, a
  -- function that errored into an empty array — would give `past = []` and
  -- read as "the curbside post is absent". This proves the array is populated
  -- and that the ONE thing missing from it is the ended Curbside post.
  begin
    execute 'set local role anon';
    select count(*) into n
      from public.organizer_profile(ws) p,
           lateral jsonb_array_elements(p.past) as e
     where (e ->> 'id')::uuid = ev_pd_end;
    execute 'reset role';
    perform pg_temp.rec('1e. CONTROL anon · organizer_profile past[] · ended PAID (1d is not vacuous)',
      '1 row', n::text || ' row(s)', n = 1);
  exception when others then
    execute 'reset role';
    perform pg_temp.rec('1e. CONTROL anon · organizer_profile past[] · ended PAID',
      '1 row', 'RAISED: ' || sqlstate || ' ' || sqlerrm, false);
  end;

  -- And the live Curbside post in upcoming[], which proves 1d's absence is
  -- about ENDING rather than about the tier being filtered wholesale here.
  begin
    execute 'set local role anon';
    select count(*) into n
      from public.organizer_profile(ws) p,
           lateral jsonb_array_elements(p.upcoming) as e
     where (e ->> 'id')::uuid = ev_cb_live;
    execute 'reset role';
    perform pg_temp.rec('1f. CONTROL anon · organizer_profile upcoming[] · LIVE curbside (named)',
      '1 row', n::text || ' row(s)', n = 1);
  exception when others then
    execute 'reset role';
    perform pg_temp.rec('1f. CONTROL anon · organizer_profile upcoming[] · LIVE curbside',
      '1 row', 'RAISED: ' || sqlstate || ' ' || sqlerrm, false);
  end;

  ---------------------------------------------------------------------------
  -- ASSERTION 2 ★ — THE ONE THE RULING RESTS ON.
  --
  -- The ATTENDEE holds an RSVP on this event. Under 0022 branch 3 that is
  -- precisely what admitted an ended, archived or deleted event into their
  -- record. 0030 withdraws that for Curbside, and this is the only assertion in
  -- the file that contradicts a previously locked rule.
  --
  -- If this fails, the Saved → Past leak the ruling exists to close is open,
  -- and the arc has not landed regardless of what else passes.
  ---------------------------------------------------------------------------
  begin
    perform set_config('request.jwt.claims',
      json_build_object('sub', u_attendee::text, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    select count(*) into n from public.events where id = ev_cb_end;
    execute 'reset role';
    perform pg_temp.rec('2a. ★ TARGET attendee (has RSVP) · RLS policy · ended curbside',
      '0 rows — branch 3 must REFUSE', n::text || ' row(s)', n = 0);
  exception when others then
    execute 'reset role';
    perform pg_temp.rec('2a. ★ TARGET attendee · RLS policy · ended curbside',
      '0 rows', 'RAISED: ' || sqlstate || ' ' || sqlerrm, false);
  end;

  begin
    execute 'set local role authenticated';
    select count(*) into n from public.event_detail(ev_cb_end, qa_lat, qa_lng);
    execute 'reset role';
    perform pg_temp.rec('2b. ★ TARGET attendee (has RSVP) · event_detail · ended curbside',
      '0 rows — the saved row must not be tappable either',
      n::text || ' row(s)', n = 0);
  exception when others then
    execute 'reset role';
    perform pg_temp.rec('2b. ★ TARGET attendee · event_detail · ended curbside',
      '0 rows', 'RAISED: ' || sqlstate || ' ' || sqlerrm, false);
  end;

  ---------------------------------------------------------------------------
  -- ASSERTION 3 — CONTROL. The host keeps it. Branch 1, untouched by 0030.
  -- If this fails, the guard was hoisted above the branches and the retention
  -- half of the ruling is gone.
  ---------------------------------------------------------------------------
  begin
    perform set_config('request.jwt.claims',
      json_build_object('sub', u_host::text, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    select count(*) into n from public.events where id = ev_cb_end;
    execute 'reset role';
    perform pg_temp.rec('3a. CONTROL host (member) · RLS policy · ended curbside',
      '1 row — Workspace retention', n::text || ' row(s)', n = 1);
  exception when others then
    execute 'reset role';
    perform pg_temp.rec('3a. CONTROL host · RLS policy · ended curbside',
      '1 row', 'RAISED: ' || sqlstate || ' ' || sqlerrm, false);
  end;

  begin
    execute 'set local role authenticated';
    select count(*) into n from public.event_detail(ev_cb_end, qa_lat, qa_lng);
    execute 'reset role';
    perform pg_temp.rec('3b. CONTROL host (member) · event_detail · ended curbside',
      '1 row — still openable from Workspace', n::text || ' row(s)', n = 1);
  exception when others then
    execute 'reset role';
    perform pg_temp.rec('3b. CONTROL host · event_detail · ended curbside',
      '1 row', 'RAISED: ' || sqlstate || ' ' || sqlerrm, false);
  end;

  ---------------------------------------------------------------------------
  -- ASSERTION 4 — CONTROL, and assertion 2's mirror. Same row shape, same
  -- attendee, same RSVP; tier flipped to paid. MUST stay visible: 0022's rule
  -- is unchanged for Standard and Plus.
  --
  -- 2 and 4 differ in exactly one variable. If they agree, the change is not
  -- keyed on tier.
  ---------------------------------------------------------------------------
  begin
    perform set_config('request.jwt.claims',
      json_build_object('sub', u_attendee::text, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    select count(*) into n from public.events where id = ev_pd_end;
    execute 'reset role';
    perform pg_temp.rec('4a. CONTROL attendee (has RSVP) · RLS policy · ended PAID',
      '1 row — 0022 branch 3 still holds for paid', n::text || ' row(s)', n = 1);
  exception when others then
    execute 'reset role';
    perform pg_temp.rec('4a. CONTROL attendee · RLS policy · ended PAID',
      '1 row', 'RAISED: ' || sqlstate || ' ' || sqlerrm, false);
  end;

  begin
    execute 'set local role authenticated';
    select count(*) into n from public.event_detail(ev_pd_end, qa_lat, qa_lng);
    execute 'reset role';
    perform pg_temp.rec('4b. CONTROL attendee (has RSVP) · event_detail · ended PAID',
      '1 row — still tappable from Saved → Past', n::text || ' row(s)', n = 1);
  exception when others then
    execute 'reset role';
    perform pg_temp.rec('4b. CONTROL attendee · event_detail · ended PAID',
      '1 row', 'RAISED: ' || sqlstate || ' ' || sqlerrm, false);
  end;

  ---------------------------------------------------------------------------
  -- ASSERTION 5 — CONTROL. A LIVE Curbside post is untouched. This is not a
  -- blanket ban on the tier; it is a rule about time.
  ---------------------------------------------------------------------------
  begin
    perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
    execute 'set local role anon';
    select count(*) into n from public.events where id = ev_cb_live;
    execute 'reset role';
    perform pg_temp.rec('5a. CONTROL anon · RLS policy · LIVE curbside',
      '1 row', n::text || ' row(s)', n = 1);
  exception when others then
    execute 'reset role';
    perform pg_temp.rec('5a. CONTROL anon · RLS policy · LIVE curbside',
      '1 row', 'RAISED: ' || sqlstate || ' ' || sqlerrm, false);
  end;

  begin
    execute 'set local role anon';
    select count(*) into n from public.events_within_radius(qa_lat, qa_lng, 25)
     where id = ev_cb_live;
    execute 'reset role';
    perform pg_temp.rec('5b. CONTROL anon · feed · LIVE curbside',
      '1 row', n::text || ' row(s)', n = 1);
  exception when others then
    execute 'reset role';
    perform pg_temp.rec('5b. CONTROL anon · feed · LIVE curbside',
      '1 row', 'RAISED: ' || sqlstate || ' ' || sqlerrm, false);
  end;

  begin
    execute 'set local role anon';
    select count(*) into n from public.event_detail(ev_cb_live, qa_lat, qa_lng);
    execute 'reset role';
    perform pg_temp.rec('5c. CONTROL anon · event_detail · LIVE curbside',
      '1 row', n::text || ' row(s)', n = 1);
  exception when others then
    execute 'reset role';
    perform pg_temp.rec('5c. CONTROL anon · event_detail · LIVE curbside',
      '1 row', 'RAISED: ' || sqlstate || ' ' || sqlerrm, false);
  end;

  -- And the paid feed control, so a feed returning nothing at all cannot make
  -- 1b and 5b look like a pass and a fail respectively for the wrong reason.
  begin
    execute 'set local role anon';
    select count(*) into n from public.events_within_radius(qa_lat, qa_lng, 25)
     where id = ev_pd_live;
    execute 'reset role';
    perform pg_temp.rec('5d. CONTROL anon · feed · LIVE paid (feed is alive at all)',
      '1 row', n::text || ' row(s)', n = 1);
  exception when others then
    execute 'reset role';
    perform pg_temp.rec('5d. CONTROL anon · feed · LIVE paid',
      '1 row', 'RAISED: ' || sqlstate || ' ' || sqlerrm, false);
  end;

  ---------------------------------------------------------------------------
  -- ASSERTION 6 — COHERENCE. event_categories rows follow their parent.
  --
  -- Without PART C the event would vanish while its category rows stayed
  -- readable — the record half-erased in the opposite direction from the one
  -- 0022 was fixing. Checked on direct table reads, which is what saved.tsx and
  -- workspace.tsx do when they embed event_categories(category_id).
  ---------------------------------------------------------------------------
  begin
    perform set_config('request.jwt.claims',
      json_build_object('sub', u_attendee::text, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    select count(*) into n_cat from public.event_categories where event_id = ev_cb_end;
    execute 'reset role';
    perform pg_temp.rec('6a. TARGET attendee · event_categories · ended curbside',
      '0 rows — follows the parent', n_cat::text || ' row(s)', n_cat = 0);
  exception when others then
    execute 'reset role';
    perform pg_temp.rec('6a. TARGET attendee · event_categories · ended curbside',
      '0 rows', 'RAISED: ' || sqlstate || ' ' || sqlerrm, false);
  end;

  begin
    execute 'set local role authenticated';
    select count(*) into n_cat from public.event_categories where event_id = ev_pd_end;
    execute 'reset role';
    perform pg_temp.rec('6b. CONTROL attendee · event_categories · ended PAID',
      '1 row — the paid record keeps its chips', n_cat::text || ' row(s)', n_cat = 1);
  exception when others then
    execute 'reset role';
    perform pg_temp.rec('6b. CONTROL attendee · event_categories · ended PAID',
      '1 row', 'RAISED: ' || sqlstate || ' ' || sqlerrm, false);
  end;

  -- THE STRANGER, NOT ANON — and that is an improvement, not a workaround.
  --
  -- The stranger is authenticated, holds no membership (branch 1 cannot fire)
  -- and has no save or RSVP (branch 3 cannot fire), so this row can ONLY be
  -- admitted by BRANCH 2 — the branch 0030 edited. The anon version this
  -- replaced left the admitting branch ambiguous.
  --
  -- It is also no longer near-redundant with 6b: that is a PAID, ENDED event
  -- admitted via branch 3; this is a CURBSIDE, LIVE one admitted via branch 2.
  --
  -- It reads as anon originally, and could not: see 6d.
  begin
    perform set_config('request.jwt.claims',
      json_build_object('sub', u_stranger::text, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    select count(*) into n_cat from public.event_categories where event_id = ev_cb_live;
    execute 'reset role';
    perform pg_temp.rec('6c. CONTROL stranger (no membership, no attendance) · event_categories · LIVE curbside',
      '1 row — admitted by branch 2, the branch 0030 edited',
      n_cat::text || ' row(s)', n_cat = 1);
  exception when others then
    execute 'reset role';
    perform pg_temp.rec('6c. CONTROL stranger · event_categories · LIVE curbside',
      '1 row', 'RAISED: ' || sqlstate || ' ' || sqlerrm, false);
  end;

  ---------------------------------------------------------------------------
  -- 6d — A KNOWN GAP THAT BELONGS TO 0029, RECORDED RATHER THAN HIDDEN.
  --
  -- READ THE PASS AS A STATEMENT ABOUT COVERAGE, NOT JUST ABOUT THE BUG:
  -- **while this row passes, THIS SUITE HAS NO ANON ASSERTION ON
  -- event_categories AT ALL.** Nothing here proves a signed-out visitor can see
  -- a live Curbside post's category chips, because that read is refused before
  -- any policy runs. That missing coverage is the thing 0031 restores — this
  -- row is where it is visible, not only in the tracker.
  --
  -- THE GAP: `event_categories_select_public` is a policy on event_categories
  -- whose body is `exists (select 1 from public.events e …)`. 0021's exemption
  -- covers a policy referencing columns of the table the policy is ON; a
  -- CROSS-TABLE subquery inside a policy is an ordinary read and is
  -- privilege-checked against the caller. Branch 1 passes `e.workspace_id` to
  -- app.is_member, and 0029 revoked that column from anon.
  --
  -- NOT A 0030 DEFECT. Confirmed by discriminating query: as anon,
  -- `is_member(e.workspace_id, …)` raises 42501 while
  -- `curbside_expired(e.tier_id, e.starts_at, e.ends_at)` succeeds — and
  -- assertion 1a already reads public.events as anon THROUGH the new guard and
  -- passes. 0030 added no ungranted column reference.
  --
  -- WHEN THIS ROW STARTS FAILING, 0031 HAS LANDED. Delete it and restore 6c to
  -- anon. Do not "fix" it by re-granting workspace_id — that undoes the whole
  -- Curbside anonymity arc. Tracker: "ANON CANNOT READ public.event_categories".
  ---------------------------------------------------------------------------
  begin
    perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
    execute 'set local role anon';
    select count(*) into n_cat from public.event_categories where event_id = ev_cb_live;
    -- RESET BEFORE RECORDING. pg_temp.rec INSERTs into qa_results, and the
    -- file's rule is that nothing writes to the temp table while a role is
    -- switched — see the Section 3 header.
    execute 'reset role';
    -- Reaching here means the read SUCCEEDED, so the gap is gone.
    perform pg_temp.rec(
      '6d. KNOWN GAP (0029) · anon · event_categories — pass = gap still present = NO anon coverage here',
      '42501 permission denied for table events',
      n_cat::text || ' row(s) — READ SUCCEEDED: 0031 has landed, delete 6d and restore 6c to anon',
      false);
  exception when sqlstate '42501' then
    execute 'reset role';
    perform pg_temp.rec(
      '6d. KNOWN GAP (0029) · anon · event_categories — pass = gap still present = NO anon coverage here',
      '42501 permission denied for table events',
      '42501 as expected — pre-existing, not caused by 0030', true);
  when others then
    execute 'reset role';
    perform pg_temp.rec(
      '6d. KNOWN GAP (0029) · anon · event_categories',
      '42501 permission denied for table events',
      'RAISED SOMETHING ELSE: ' || sqlstate || ' ' || sqlerrm, false);
  end;

  ---------------------------------------------------------------------------
  -- EQUIVALENCE — inherited from qa-0028-0029, and the reason that suite
  -- existed. 0030 edits a policy AND three transcribed definer bodies. A copy
  -- that drifts from the others is this arc's characteristic failure, it is
  -- invisible to every catalog check, and it is exactly what this loop is for.
  --
  -- The policy remains the source of truth; app.event_detail is checked
  -- against it, for every viewer and every fixture.
  ---------------------------------------------------------------------------
  for r in
    -- ::text on the first branch is not decoration: every branch here is a
    -- bare literal, so without it the union's first column is `unknown` and
    -- the resolution is left to the planner's default.
    select 'anon'::text          as who, null::uuid as uid union all
    select 'stranger'::text,     u_stranger              union all
    select 'attendee'::text,     u_attendee              union all
    select 'host (member)'::text, u_host
  loop
    foreach ev in array array[ev_cb_end, ev_cb_live, ev_pd_end, ev_pd_live]
    loop
      select title into lbl from public.events where id = ev;

      begin
        if r.uid is null then
          perform set_config('request.jwt.claims',
            json_build_object('role', 'anon')::text, true);
          execute 'set local role anon';
        else
          perform set_config('request.jwt.claims',
            json_build_object('sub', r.uid::text, 'role', 'authenticated')::text, true);
          execute 'set local role authenticated';
        end if;

        select count(*) into n_rls from public.events where id = ev;
        select count(*) into n_fn  from public.event_detail(ev, qa_lat, qa_lng);
        execute 'reset role';

        perform pg_temp.rec(
          format('E. equivalence — %s viewing "%s"', r.who, lbl),
          format('policy and function agree (policy says %s)',
                 case when n_rls > 0 then 'visible' else 'hidden' end),
          format('policy=%s function=%s',
                 case when n_rls > 0 then 'visible' else 'hidden' end,
                 case when n_fn  > 0 then 'visible' else 'hidden' end),
          (n_rls > 0) = (n_fn > 0));
      exception when others then
        execute 'reset role';
        perform pg_temp.rec(
          format('E. equivalence — %s viewing "%s"', r.who, lbl),
          'policy and function agree',
          'RAISED: ' || sqlstate || ' ' || sqlerrm, false);
      end;
    end loop;
  end loop;
end;
$$;

select seq, step, expected, actual, pass from qa_results order by seq;

-- Uncomment to see only what failed on a long grid:
-- select seq, step, expected, actual from qa_results where not pass order by seq;

rollback;

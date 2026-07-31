-- ============================================================================
-- BEHAVIORAL SUITE — soft delete + archive (migration 0019, read-path filters
-- repaired by 0020, attendee-history exception added by 0022).
--
-- Section (g) covers the amended Architecture Decision 8 rule: what already
-- happened stays in the attendee's record, what hasn't yet is the host's to
-- withdraw. Sections (a)–(f) are the original 0019/0020 contract, unchanged.
--
-- WHERE TO RUN: Supabase dashboard → SQL Editor, on the DEV project
-- (`Sparked-App`, ref kzynvvdggooqgtnprhrm). Never against prod.
--
-- HOW TO RUN: three sections, one at a time. Section 2 is the suite, wrapped in
-- BEGIN … ROLLBACK — nothing it does persists, including the ledger rows it
-- clears to get a clean slate. Section 3 should reproduce section 1 exactly.
--
-- ---------------------------------------------------------------------------
-- REWRITTEN 2026-07-30. The first version of this file could not run and, where
-- it did run, proved less than it claimed. Five faults, all fixed here:
--
--  1. `event_detail` was called with FOUR arguments; it takes three
--     (event_id, origin_lat, origin_lng). Hard error, outside any exception
--     handler, so the transaction aborted and the result grid never rendered.
--  2. PostGIS was called as `public.st_setsrid` / `public.st_makepoint`, but
--     migration 0003 relocated PostGIS to the `extensions` schema. Also a hard
--     error. Fixed by pinning search_path once, below.
--  3. `tier_id = 'paid'` is not a tier. The three are curbside / standard /
--     plus (0001). FK violation. Now uses 'standard'.
--  4. **The visibility assertions proved nothing.** This script runs as
--     `postgres`, which BYPASSES RLS, and several assertions hardcoded
--     `deleted_at is null` / `archived_at is null` in their own WHERE clause —
--     so they asserted their own predicate, not the server's. Every
--     RLS-dependent assertion now runs through a helper that switches to the
--     `authenticated` ROLE, which is the only way the policy actually engages.
--     The test queries carry NO delete/archive predicate of their own.
--  5. Only delete was checked against the quota ledger; archive was not.
--
-- WHAT THE REPAIR CHANGED IN THE RESULTS: a2, a3 and b2 exercise the function
-- bodies that 0020 fixed. Before 0020 they FAILED (the filters lived only in
-- edited migration files that had never been applied). They should pass now.
-- ============================================================================


-- ############################################################################
-- SECTION 1 — baseline, read-only. Run first.
-- ############################################################################
select
  (select count(*) from public.events where status = 'published')      as published_events,
  (select count(*) from public.events where deleted_at is not null)    as deleted_events,
  (select count(*) from public.events where archived_at is not null)   as archived_events,
  (select count(*) from public.curbside_quota_ledger)                  as ledger_rows;


-- ############################################################################
-- SECTION 2 — the suite. BEGIN … ROLLBACK; nothing persists.
-- Every row of the output grid should read pass = true.
-- ############################################################################
begin;

-- Pinned once so PostGIS (extensions) and the definer bodies (app) resolve
-- unqualified, exactly the way the real functions pin themselves.
set local search_path = public, extensions, app;

create temp table qa_results (
  seq      int generated always as identity,
  step     text,
  expected text,
  actual   text,
  pass     boolean
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

-- ---------------------------------------------------------------------------
-- THE TWO HELPERS THAT MAKE THE VISIBILITY ASSERTIONS REAL.
--
-- Fixtures need postgres privileges; RLS needs a non-superuser role. So each
-- read assertion hops into `authenticated` for the duration of one query and
-- hops straight back. Neither helper filters on deleted_at or archived_at —
-- the POLICY is what is under test, and a test that restates the rule it is
-- checking is not a test.
-- ---------------------------------------------------------------------------

-- Direct table read, as p_user. This is the shape workspace.tsx uses.
create function pg_temp.visible_to(p_user uuid, p_event uuid)
returns integer language plpgsql as $fn$
declare n integer;
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_user::text, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(e.id) into n from public.events e where e.id = p_event;
  execute 'reset role';
  return n;
exception when others then
  execute 'reset role';
  raise;
end;
$fn$;

-- The Saved read path, as p_user: their OWN saves joined to events they can
-- see. Mirrors saved.tsx (`.in('id', ids).eq('status','published')`).
create function pg_temp.saved_visible_to(p_user uuid, p_event uuid)
returns integer language plpgsql as $fn$
declare n integer;
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_user::text, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(e.id) into n
  from public.saves s
  join public.events e on e.id = s.event_id
  where s.user_id = p_user
    and e.id = p_event
    and e.status = 'published';
  execute 'reset role';
  return n;
exception when others then
  execute 'reset role';
  raise;
end;
$fn$;

-- The ticket, as p_user. Proves an attendee can still OPEN their history row
-- (0022), and that a stranger cannot.
create function pg_temp.detail_visible_to(p_user uuid, p_event uuid)
returns integer language plpgsql as $fn$
declare n integer;
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_user::text, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.event_detail(p_event, 32.0, -111.0);
  execute 'reset role';
  return n;
exception when others then
  execute 'reset role';
  raise;
end;
$fn$;

-- The storefront, as p_user. The history exception must NEVER reach this.
create function pg_temp.feed_visible_to(p_user uuid, p_event uuid)
returns integer language plpgsql as $fn$
declare n integer;
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_user::text, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n
    from public.events_within_radius(32.0, -111.0, 25.0) f where f.id = p_event;
  execute 'reset role';
  return n;
exception when others then
  execute 'reset role';
  raise;
end;
$fn$;

do $$
declare
  u_a     uuid;  -- the host
  u_b     uuid;  -- a consumer / non-member
  u_c     uuid;  -- (0022) a STRANGER: neither host nor attendee. May be null.
  ws_a    uuid;
  ws_b    uuid;
  ev_del  uuid;
  ev_arch uuid;
  ev_curb uuid;
  ev_saved uuid;
  ev_past_arch   uuid;  -- (0022)
  ev_past_del    uuid;  -- (0022)
  ev_future_arch uuid;  -- (0022)
  n       integer;
  err     text;
  qa_addr constant text := '18680 S Nogales Hwy';
  qa_pt   constant extensions.geography :=
            st_setsrid(st_makepoint(-111.0, 32.0), 4326)::extensions.geography;
begin
  ---------------------------------------------------------------------------
  -- Fixtures
  ---------------------------------------------------------------------------
  select id into u_a from public.profiles order by created_at limit 1;
  select id into u_b from public.profiles where id <> u_a order by created_at limit 1;
  -- A third identity for the 0022 stranger checks. Optional: if the dev project
  -- only has two profiles, g6–g8 report as skipped rather than failing.
  select id into u_c from public.profiles
   where id not in (u_a, u_b) order by created_at limit 1;

  if u_a is null or u_b is null then
    perform pg_temp.rec('00. fixtures', 'at least two profiles exist',
                        'fewer than two profiles — cannot run', false);
    return;
  end if;

  -- Clean quota slate for both (rolled back with everything else).
  delete from public.curbside_quota_ledger where user_id in (u_a, u_b);

  insert into public.workspaces (name, created_by)
  values ('QA 0019 — host A', u_a) returning id into ws_a;
  insert into public.workspaces (name, created_by)
  values ('QA 0019 — host B', u_b) returning id into ws_b;

  ---------------------------------------------------------------------------
  -- (a) DELETE hides from every read path — including from the owner.
  ---------------------------------------------------------------------------
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location)
  values (ws_a, 'QA 0019 delete target', 'standard', 'published',
          now() + interval '10 days', now() + interval '10 days 3 hours', qa_addr, qa_pt)
  returning id into ev_del;

  perform set_config('request.jwt.claims',
    json_build_object('sub', u_a::text, 'role', 'authenticated')::text, true);
  perform app.delete_event(ev_del);

  n := pg_temp.visible_to(u_a, ev_del);
  perform pg_temp.rec('a1. delete hides from the OWNER''s own table read',
    '0 (RLS, as role authenticated)', n::text, n = 0);

  select count(*) into n from public.events_within_radius(32.0, -111.0, 10.0) f where f.id = ev_del;
  perform pg_temp.rec('a2. delete hides from events_within_radius  [0020]',
    '0 rows', n::text || ' row(s)', n = 0);

  select count(*) into n from public.event_detail(ev_del, 32.0, -111.0);
  perform pg_temp.rec('a3. delete hides from event_detail  [0020]',
    '0 rows', n::text || ' row(s)', n = 0);

  ---------------------------------------------------------------------------
  -- (b) ARCHIVE hides from the public but NOT from the host.
  ---------------------------------------------------------------------------
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location)
  values (ws_a, 'QA 0019 archive target', 'standard', 'published',
          now() + interval '11 days', now() + interval '11 days 3 hours', qa_addr, qa_pt)
  returning id into ev_arch;

  -- A consumer saves it BEFORE it is archived.
  insert into public.saves (user_id, event_id) values (u_b, ev_arch);

  perform app.archive_event(ev_arch);

  n := pg_temp.visible_to(u_a, ev_arch);
  perform pg_temp.rec('b1. archived stays VISIBLE to its host',
    '1 (member branch of the policy)', n::text, n = 1);

  select count(*) into n from public.events_within_radius(32.0, -111.0, 10.0) f where f.id = ev_arch;
  perform pg_temp.rec('b2. archived hidden from events_within_radius  [0020]',
    '0 rows', n::text || ' row(s)', n = 0);

  n := pg_temp.saved_visible_to(u_b, ev_arch);
  perform pg_temp.rec('b3. archived drops out of a consumer''s Saved',
    '0 (RLS public branch)', n::text, n = 0);

  ---------------------------------------------------------------------------
  -- (c) UNARCHIVE restores it everywhere it was removed from.
  ---------------------------------------------------------------------------
  perform app.unarchive_event(ev_arch);

  select count(*) into n from public.events_within_radius(32.0, -111.0, 10.0) f where f.id = ev_arch;
  perform pg_temp.rec('c1. unarchive restores it to the feed',
    '1 row', n::text || ' row(s)', n = 1);

  n := pg_temp.saved_visible_to(u_b, ev_arch);
  perform pg_temp.rec('c2. unarchive restores it to the consumer''s Saved',
    '1', n::text, n = 1);

  ---------------------------------------------------------------------------
  -- (d) THE QUOTA LEDGER IS IMMUNE TO BOTH VERBS (0018 × 0019).
  ---------------------------------------------------------------------------
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address)
  values (ws_a, 'QA 0019 curbside ledger', 'curbside', 'published',
          now() + interval '1 day', now() + interval '1 day 4 hours', qa_addr)
  returning id into ev_curb;

  select count(*) into n from public.curbside_quota_ledger
   where user_id = u_a and event_id = ev_curb;
  perform pg_temp.rec('d1. publishing curbside consumed a credit',
    '1 ledger row linked to the event', n::text || ' row(s)', n = 1);

  perform app.archive_event(ev_curb);
  select count(*) into n from public.curbside_quota_ledger
   where user_id = u_a and event_id = ev_curb;
  perform pg_temp.rec('d2. ARCHIVE does not touch the ledger',
    '1 row, still linked to the event', n::text || ' row(s)', n = 1);

  perform app.delete_event(ev_curb);
  select count(*) into n from public.curbside_quota_ledger
   where user_id = u_a and event_id is null;
  perform pg_temp.rec('d3. DELETE leaves the ledger row orphaned, not removed',
    '1 row with event_id NULL', n::text || ' row(s)', n = 1);

  perform pg_temp.rec('d4. the credit is still spent after both verbs',
    'app.curbside_credits_used = 1',
    app.curbside_credits_used(u_a)::text,
    app.curbside_credits_used(u_a) = 1);

  ---------------------------------------------------------------------------
  -- (e) A NON-MEMBER cannot delete or archive someone else's event.
  ---------------------------------------------------------------------------
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address)
  values (ws_a, 'QA 0019 authz target', 'standard', 'published',
          now() + interval '12 days', now() + interval '12 days 3 hours', qa_addr)
  returning id into ev_saved;

  -- Act as B, who has no membership in ws_a.
  perform set_config('request.jwt.claims',
    json_build_object('sub', u_b::text, 'role', 'authenticated')::text, true);

  begin
    perform app.delete_event(ev_saved);
    perform pg_temp.rec('e1. non-member delete',
      'rejected: not_an_editor', 'SUCCEEDED — AUTHZ BYPASSED', false);
  exception when others then
    get stacked diagnostics err = message_text;
    perform pg_temp.rec('e1. non-member delete',
      'rejected: not_an_editor', err, err = 'not_an_editor');
  end;

  begin
    perform app.archive_event(ev_saved);
    perform pg_temp.rec('e2. non-member archive',
      'rejected: not_an_editor', 'SUCCEEDED — AUTHZ BYPASSED', false);
  exception when others then
    get stacked diagnostics err = message_text;
    perform pg_temp.rec('e2. non-member archive',
      'rejected: not_an_editor', err, err = 'not_an_editor');
  end;

  ---------------------------------------------------------------------------
  -- (f) A DELETED **FUTURE** EVENT LEAVES OTHER PEOPLE'S SAVED LISTS.
  -- Host B publishes, consumer A saves it, host B deletes it. Both assertions
  -- run as A through the real Saved join with no filter of their own.
  --
  -- This IS case (c) of the amended rule (0022): what has not happened yet is
  -- the host's to withdraw, so a future deletion takes it out of the attendee's
  -- list completely. Section (g) covers the cases where it must NOT.
  ---------------------------------------------------------------------------
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address)
  values (ws_b, 'QA 0019 saved-by-someone-else', 'standard', 'published',
          now() + interval '13 days', now() + interval '13 days 3 hours', qa_addr)
  returning id into ev_saved;

  insert into public.saves (user_id, event_id) values (u_a, ev_saved);

  n := pg_temp.saved_visible_to(u_a, ev_saved);
  perform pg_temp.rec('f1. consumer sees the saved event beforehand',
    '1', n::text, n = 1);

  perform set_config('request.jwt.claims',
    json_build_object('sub', u_b::text, 'role', 'authenticated')::text, true);
  perform app.delete_event(ev_saved);

  n := pg_temp.saved_visible_to(u_a, ev_saved);
  perform pg_temp.rec('f2. host''s delete removes it from the consumer''s Saved',
    '0', n::text, n = 0);

  ---------------------------------------------------------------------------
  -- (g) THE ATTENDEE-HISTORY EXCEPTION (0022).
  --
  -- A host may withdraw what has not happened. They may not rewrite what has.
  -- Every event below is in the PAST (ended ~10 days ago), which is the hinge
  -- the whole rule turns on.
  ---------------------------------------------------------------------------

  -- (g1/g2) ARCHIVE a past event that someone attended.
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location)
  values (ws_b, 'QA 0022 past + archived', 'standard', 'published',
          now() - interval '10 days', now() - interval '10 days' + interval '3 hours',
          qa_addr, qa_pt)
  returning id into ev_past_arch;

  insert into public.saves (user_id, event_id) values (u_a, ev_past_arch);

  perform set_config('request.jwt.claims',
    json_build_object('sub', u_b::text, 'role', 'authenticated')::text, true);
  perform app.archive_event(ev_past_arch);

  n := pg_temp.saved_visible_to(u_a, ev_past_arch);
  perform pg_temp.rec('g1. archived PAST event stays in the attendee''s Saved',
    '1 — history is theirs, not the host''s', n::text, n = 1);

  n := pg_temp.feed_visible_to(u_a, ev_past_arch);
  perform pg_temp.rec('g2. …and is still gone from that same attendee''s feed',
    '0', n::text, n = 0);

  n := pg_temp.detail_visible_to(u_a, ev_past_arch);
  perform pg_temp.rec('g3. …and the attendee can still OPEN it',
    '1 — the history row must not be a dead link', n::text, n = 1);

  -- (g4/g5) DELETE a past event that someone attended.
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location)
  values (ws_b, 'QA 0022 past + deleted', 'standard', 'published',
          now() - interval '10 days', now() - interval '10 days' + interval '3 hours',
          qa_addr, qa_pt)
  returning id into ev_past_del;

  -- RSVP rather than a save, so has_attendance is proven on both tables.
  insert into public.rsvps (user_id, event_id) values (u_a, ev_past_del);

  perform app.delete_event(ev_past_del);

  n := pg_temp.visible_to(u_a, ev_past_del);
  perform pg_temp.rec('g4. deleted PAST event stays visible to its ATTENDEE (via RSVP)',
    '1 — has_attendance covers rsvps, not just saves', n::text, n = 1);

  n := pg_temp.feed_visible_to(u_a, ev_past_del);
  perform pg_temp.rec('g5. …and is absent from the feed for that attendee',
    '0', n::text, n = 0);

  -- (g6–g8) A STRANGER — no save, no RSVP, not a member — sees it on NO path.
  -- This is the assertion that keeps the exception an EXCEPTION.
  if u_c is null then
    perform pg_temp.rec('g6-g8. non-attendee checks',
      'a third profile to test with',
      'SKIPPED — only two profiles exist in this project', true);
  else
    n := pg_temp.visible_to(u_c, ev_past_arch);
    perform pg_temp.rec('g6. non-attendee: archived past event, direct read',
      '0', n::text, n = 0);

    n := pg_temp.visible_to(u_c, ev_past_del);
    perform pg_temp.rec('g7. non-attendee: deleted past event, direct read',
      '0', n::text, n = 0);

    n := pg_temp.detail_visible_to(u_c, ev_past_arch);
    perform pg_temp.rec('g8. non-attendee: archived past event, ticket',
      '0', n::text, n = 0);
  end if;

  -- (g9) The exception is gated on ENDED, not merely on attendance: a FUTURE
  -- archived event the attendee saved must still disappear from their Saved.
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location)
  values (ws_b, 'QA 0022 future + archived', 'standard', 'published',
          now() + interval '20 days', now() + interval '20 days 3 hours', qa_addr, qa_pt)
  returning id into ev_future_arch;

  insert into public.saves (user_id, event_id) values (u_a, ev_future_arch);
  perform app.archive_event(ev_future_arch);

  n := pg_temp.saved_visible_to(u_a, ev_future_arch);
  perform pg_temp.rec('g9. archived FUTURE event is withdrawn from Saved',
    '0 — not yet history, so still the host''s to pull', n::text, n = 0);
end;
$$;

select seq, step, expected, actual, pass from qa_results order by seq;

rollback;


-- ############################################################################
-- SECTION 3 — confirm the rollback was clean. Must match Section 1 exactly.
-- ############################################################################
select
  (select count(*) from public.events where status = 'published')      as published_events,
  (select count(*) from public.events where deleted_at is not null)    as deleted_events,
  (select count(*) from public.events where archived_at is not null)   as archived_events,
  (select count(*) from public.curbside_quota_ledger)                  as ledger_rows;

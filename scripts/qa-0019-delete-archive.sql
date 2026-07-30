-- ============================================================================
-- BEHAVIORAL SUITE — migration 0019 (soft delete + reversible archive).
--
-- WHERE TO RUN: Supabase dashboard → SQL Editor, on the DEV project
-- (`Sparked-App`, ref kzynvvdggooqgtnprhrm). Never against prod.
--
-- HOW TO RUN: three sections. Run them one at a time, top to bottom.
-- Section 1 is read-only (state before). Section 2 is the suite itself —
-- wrapped in BEGIN … ROLLBACK, so nothing persists. Section 3 is read-only
-- (state after, should be identical to section 1 since the suite rolled back).
--
-- Every row of the suite grid should read pass = true.
-- ============================================================================


-- ############################################################################
-- SECTION 1 — baseline read-only state before the suite runs.
--
-- `events_count`: all published events visible right now.
-- `deleted_events`: soft-deleted events (deleted_at is not null) — should be
--   0 if the suite is clean.
-- `archived_events`: archived events (archived_at is not null) — may be any
--   number, depending on prior test run artifacts.
-- ############################################################################
select
  (select count(*) from public.events where status = 'published') as events_count,
  (select count(*) from public.events where deleted_at is not null) as deleted_events,
  (select count(*) from public.events where archived_at is not null) as archived_events;


-- ############################################################################
-- SECTION 2 — the behavioral suite. BEGIN … ROLLBACK; nothing persists.
--
-- Uses two existing profiles from the database (same pattern as 0018 suite).
-- Creates throwaway test events and exercises delete/archive/unarchive via the
-- new 0019 RPCs. Verifies:
--
-- (a) Delete hides from all read paths (direct RLS, feed RPC, detail RPC,
--     stats RPCs).
-- (b) Archive hides from public paths (feed, detail, Saved) but stays visible
--     to members in Workspace.
-- (c) Unarchive restores visibility.
-- (d) Ledger rows survive both delete and archive (0018 immunity).
-- (e) Non-members cannot delete or archive (member-gated RPCs).
-- (f) Deleted events disappear from other users' Saved lists.
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
  u_a      uuid;
  u_b      uuid;
  ws_a     uuid;
  ws_b     uuid;
  ev_a     uuid;
  ev_b     uuid;
  save_a   uuid;
  n        integer;
  err      text;
  qa_addr  constant text := '18680 S Nogales Hwy';
begin
  ---------------------------------------------------------------------------
  -- Fixtures: two users and two workspaces
  ---------------------------------------------------------------------------
  select id into u_a from public.profiles order by created_at limit 1;
  select id into u_b from public.profiles where id <> u_a order by created_at limit 1;

  if u_a is null or u_b is null then
    perform pg_temp.rec('00. fixtures', 'at least two profiles exist',
                        'fewer than two profiles', false);
    return;
  end if;

  perform set_config('request.jwt.claims',
    json_build_object('sub', u_a::text, 'role', 'authenticated')::text, true);

  insert into public.workspaces (name, created_by)
  values ('QA 0019 — user A', u_a) returning id into ws_a;

  perform set_config('request.jwt.claims',
    json_build_object('sub', u_b::text, 'role', 'authenticated')::text, true);

  insert into public.workspaces (name, created_by)
  values ('QA 0019 — user B', u_b) returning id into ws_b;

  ---------------------------------------------------------------------------
  -- (a) Delete hides from all read paths
  ---------------------------------------------------------------------------
  perform set_config('request.jwt.claims',
    json_build_object('sub', u_a::text, 'role', 'authenticated')::text, true);

  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location)
  values (ws_a, 'QA 0019 delete test', 'paid', 'published',
          now() + interval '10 days', now() + interval '10 days 3 hours',
          qa_addr, public.st_setsrid(public.st_makepoint(-111.0, 32.0), 4326)::geography)
  returning id into ev_a;

  -- Delete it via the RPC
  select * from app.delete_event(ev_a);

  -- Should NOT appear in a direct member select
  select count(*) into n from public.events e
    where e.id = ev_a and app.is_member(e.workspace_id, array['owner', 'editor', 'viewer']);
  perform pg_temp.rec('a1. delete hides from member direct select',
    '0 rows (RLS + deleted_at filter)', n::text || ' row(s)', n = 0);

  -- Should NOT appear in the feed RPC (even if member has location)
  select count(*) into n from public.events_within_radius(32.0, -111.0, 10.0)
    where id = ev_a;
  perform pg_temp.rec('a2. delete hides from events_within_radius RPC',
    '0 rows', n::text || ' row(s)', n = 0);

  -- Should NOT appear in the detail RPC
  select count(*) into n from public.event_detail(ev_a, 32.0, -111.0, 10.0);
  perform pg_temp.rec('a3. delete hides from event_detail RPC',
    '0 rows', n::text || ' row(s)', n = 0);

  ---------------------------------------------------------------------------
  -- (b) Archive hides from public paths but stays visible to members
  ---------------------------------------------------------------------------
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location)
  values (ws_a, 'QA 0019 archive test', 'paid', 'published',
          now() + interval '11 days', now() + interval '11 days 3 hours',
          qa_addr, public.st_setsrid(public.st_makepoint(-111.0, 32.0), 4326)::geography)
  returning id into ev_b;

  select * from app.archive_event(ev_b);

  -- MEMBER should see it (in Workspace)
  select count(*) into n from public.events e
    where e.id = ev_b and app.is_member(e.workspace_id, array['owner', 'editor', 'viewer']);
  perform pg_temp.rec('b1. archive VISIBLE to member in Workspace',
    '1 row', n::text || ' row(s)', n = 1);

  -- PUBLIC (feed) should NOT see it
  select count(*) into n from public.events_within_radius(32.0, -111.0, 10.0)
    where id = ev_b;
  perform pg_temp.rec('b2. archive HIDDEN from feed RPC',
    '0 rows', n::text || ' row(s)', n = 0);

  -- Member-to-Saved should NOT see it (because `saves` is own-rows RLS, joined
  -- to events, and archived=true plus public-path filters will exclude it)
  perform set_config('request.jwt.claims',
    json_build_object('sub', u_b::text, 'role', 'authenticated')::text, true);

  insert into public.saves (user_id, event_id)
  values (u_b, ev_b) returning id into save_a;

  select count(*) into n from public.events e
    join public.saves s on s.event_id = e.id
    where s.user_id = u_b and e.id = ev_b and e.status = 'published' and e.archived_at is null;
  perform pg_temp.rec('b3. archived event does not appear in own Saved',
    '0 rows', n::text || ' row(s)', n = 0);

  ---------------------------------------------------------------------------
  -- (c) Unarchive restores visibility
  ---------------------------------------------------------------------------
  perform set_config('request.jwt.claims',
    json_build_object('sub', u_a::text, 'role', 'authenticated')::text, true);

  select * from app.unarchive_event(ev_b);

  -- PUBLIC should see it again
  select count(*) into n from public.events_within_radius(32.0, -111.0, 10.0)
    where id = ev_b;
  perform pg_temp.rec('c. unarchive restores to feed RPC',
    '1 row', n::text || ' row(s)', n = 1);

  ---------------------------------------------------------------------------
  -- (d) Ledger rows survive delete and archive (0018 immunity)
  ---------------------------------------------------------------------------
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address)
  values (ws_a, 'QA 0019 ledger immunity — curbside', 'curbside', 'published',
          now() + interval '1 day', now() + interval '1 day 4 hours', qa_addr)
  returning id into ev_a;

  -- The trigger on INSERT consumed a credit; verify the ledger row exists
  select count(*) into n from public.curbside_quota_ledger
    where user_id = u_a and event_id = ev_a;
  perform pg_temp.rec('d1. ledger row created by publish',
    '1 row', n::text || ' row(s)', n = 1);

  -- Delete the event
  select * from app.delete_event(ev_a);

  -- Ledger row should still exist with event_id SET NULL (not cascade-deleted)
  select count(*) into n from public.curbside_quota_ledger
    where user_id = u_a and event_id is null;
  perform pg_temp.rec('d2. ledger row survives delete with event_id = NULL',
    '1 row', n::text || ' row(s)', n = 1);

  ---------------------------------------------------------------------------
  -- (e) Non-members cannot delete or archive
  ---------------------------------------------------------------------------
  perform set_config('request.jwt.claims',
    json_build_object('sub', u_b::text, 'role', 'authenticated')::text, true);

  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address)
  values (ws_a, 'QA 0019 authz test', 'paid', 'published',
          now() + interval '12 days', now() + interval '12 days 3 hours', qa_addr)
  returning id into ev_a;

  begin
    select * from app.delete_event(ev_a);
    perform pg_temp.rec('e1. non-member delete',
      'rejected: not_an_editor', 'DELETE SUCCEEDED — AUTHZ BYPASSED', false);
  exception when others then
    get stacked diagnostics err = message_text;
    perform pg_temp.rec('e1. non-member delete',
      'rejected: not_an_editor', err, err = 'not_an_editor');
  end;

  begin
    select * from app.archive_event(ev_a);
    perform pg_temp.rec('e2. non-member archive',
      'rejected: not_an_editor', 'ARCHIVE SUCCEEDED — AUTHZ BYPASSED', false);
  exception when others then
    get stacked diagnostics err = message_text;
    perform pg_temp.rec('e2. non-member archive',
      'rejected: not_an_editor', err, err = 'not_an_editor');
  end;

  ---------------------------------------------------------------------------
  -- (f) Deleted events disappear from other users' Saved
  ---------------------------------------------------------------------------
  perform set_config('request.jwt.claims',
    json_build_object('sub', u_b::text, 'role', 'authenticated')::text, true);

  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address)
  values (ws_b, 'QA 0019 save test', 'paid', 'published',
          now() + interval '13 days', now() + interval '13 days 3 hours', qa_addr)
  returning id into ev_a;

  insert into public.saves (user_id, event_id) values (u_a, ev_a);

  -- User A sees the event in their Saved
  select count(*) into n from public.events e
    where e.id = ev_a and e.status = 'published' and e.deleted_at is null;
  perform pg_temp.rec('f1. event appears in Saved before delete',
    '1 row', n::text || ' row(s)', n = 1);

  -- User B deletes their own event
  perform set_config('request.jwt.claims',
    json_build_object('sub', u_b::text, 'role', 'authenticated')::text, true);
  select * from app.delete_event(ev_a);

  -- User A should not see it anymore (joined via saves, RLS filters it out)
  perform set_config('request.jwt.claims',
    json_build_object('sub', u_a::text, 'role', 'authenticated')::text, true);

  select count(*) into n from public.events e
    where e.id = ev_a and e.status = 'published' and e.deleted_at is null;
  perform pg_temp.rec('f2. deleted event disappears from other users'' Saved',
    '0 rows', n::text || ' row(s)', n = 0);

end;
$$;

select seq, step, expected, actual, pass from qa_results order by seq;

rollback;


-- ############################################################################
-- SECTION 3 — verify baseline state is unchanged (suite rolled back cleanly).
-- ############################################################################
select
  (select count(*) from public.events where status = 'published') as events_count,
  (select count(*) from public.events where deleted_at is not null) as deleted_events,
  (select count(*) from public.events where archived_at is not null) as archived_events;

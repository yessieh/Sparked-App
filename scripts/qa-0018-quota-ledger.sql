-- ============================================================================
-- BEHAVIORAL SUITE — migration 0018 (Curbside quota consumption ledger).
--
-- WHERE TO RUN: Supabase dashboard → SQL Editor, on the DEV project
-- (`Sparked-App`, ref kzynvvdggooqgtnprhrm). Never against prod.
--
-- HOW TO RUN: three numbered sections. Run them one at a time, top to bottom,
-- and paste the result grid back. Section 3 is wrapped in BEGIN … ROLLBACK and
-- creates its own throwaway workspaces and events — **nothing it does
-- persists**, including the ledger rows it clears to get a clean slate.
--
-- WHY A SCRIPT AND NOT A ONE-OFF: same reason qa-cleanup.sql exists. The
-- assertions live in one reviewed place, and "what did we actually verify" is
-- answerable later instead of being a scrollback question.
-- ============================================================================


-- ############################################################################
-- SECTION 1 — Backfill state. Read-only. Run this first.
--
-- EXPECTED at the time 0018 was applied: 4 curbside events existed (1 seed,
-- 3 QA), all published, no drafts — so ledger_rows_total = 4 and
-- linked_to_an_event = 4. `curbside_events` must EQUAL `linked_to_an_event`:
-- any gap means a post exists that consumed nothing.
-- ############################################################################
select
  (select count(*) from public.curbside_quota_ledger)                        as ledger_rows_total,
  (select count(*) from public.curbside_quota_ledger where event_id is not null) as linked_to_an_event,
  (select count(*) from public.curbside_quota_ledger where event_id is null)     as orphaned_by_deletion,
  (select count(*) from public.events
     where tier_id = 'curbside' and status <> 'draft')                       as curbside_events,
  (select count(distinct user_id) from public.curbside_quota_ledger)         as distinct_posters;


-- ############################################################################
-- SECTION 2 — Who is at quota right now, and when they come off it.
-- Read-only. This is the honest carry-over the backfill produced: anyone
-- showing consumed_in_window >= 1 sees the conversion screen until `frees_up`.
-- ############################################################################
select
  coalesce(p.display_name, '(erased user)')        as poster,
  count(*)                                         as consumed_in_window,
  min(l.consumed_at)                               as first_consumed,
  min(l.consumed_at) + interval '100 days'         as frees_up
from public.curbside_quota_ledger l
left join public.profiles p on p.id = l.user_id
where l.consumed_at > now() - interval '100 days'
group by 1
order by 2 desc, 3;


-- ############################################################################
-- SECTION 3 — The behavioral suite. BEGIN … ROLLBACK; nothing persists.
--
-- Borrows two existing profiles rather than minting auth.users rows, so the
-- script doesn't depend on the shape of Supabase's auth schema. Their ledger
-- rows are cleared inside the transaction to get a clean slate, and restored
-- by the ROLLBACK.
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
  u_a      uuid;
  u_b      uuid;
  ws_a     uuid;
  ws_a2    uuid;
  ws_b     uuid;
  ev_a     uuid;
  ev_b     uuid;
  ev_draft uuid;
  n        integer;
  err      text;
  qa_addr  constant text := '18680 S Nogales Hwy';
begin
  ---------------------------------------------------------------------------
  -- Fixtures
  ---------------------------------------------------------------------------
  select id into u_a from public.profiles order by created_at limit 1;
  select id into u_b from public.profiles where id <> u_a order by created_at limit 1;

  if u_a is null or u_b is null then
    perform pg_temp.rec('00. fixtures', 'at least two profiles exist',
                        'fewer than two profiles — cannot run', false);
    return;
  end if;

  -- Clean slate for both test users (rolled back with everything else).
  delete from public.curbside_quota_ledger where user_id in (u_a, u_b);

  -- Act as user A. The triggers read auth.uid(), which reads this GUC — no
  -- role switch needed, and none wanted (fixtures need postgres privileges).
  perform set_config('request.jwt.claims',
    json_build_object('sub', u_a::text, 'role', 'authenticated')::text, true);

  insert into public.workspaces (name, created_by)
  values ('QA 0018 — user A', u_a) returning id into ws_a;

  ---------------------------------------------------------------------------
  -- (a) Publishing a free Curbside post CONSUMES one credit.
  ---------------------------------------------------------------------------
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address)
  values (ws_a, 'QA 0018 post 1', 'curbside', 'published',
          now() + interval '1 day', now() + interval '1 day 4 hours', qa_addr)
  returning id into ev_a;

  select count(*) into n from public.curbside_quota_ledger
   where user_id = u_a and event_id = ev_a;
  perform pg_temp.rec('a. publish consumes',
    '1 ledger row, linked to the new event', n::text || ' row(s)', n = 1);

  perform pg_temp.rec('a2. count function agrees',
    'app.curbside_credits_used = 1',
    app.curbside_credits_used(u_a)::text,
    app.curbside_credits_used(u_a) = 1);

  ---------------------------------------------------------------------------
  -- (b) A second post inside the window is REJECTED.
  ---------------------------------------------------------------------------
  begin
    insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address)
    values (ws_a, 'QA 0018 post 2', 'curbside', 'published',
            now() + interval '2 days', now() + interval '2 days 4 hours', qa_addr);
    perform pg_temp.rec('b. second post in window',
      'rejected: curbside_quota_exhausted', 'INSERT SUCCEEDED', false);
  exception when others then
    get stacked diagnostics err = message_text;
    perform pg_temp.rec('b. second post in window',
      'rejected: curbside_quota_exhausted', err, err = 'curbside_quota_exhausted');
  end;

  ---------------------------------------------------------------------------
  -- (c) THE EXPLOIT. Delete the event; the credit must NOT come back.
  ---------------------------------------------------------------------------
  delete from public.events where id = ev_a;

  select count(*) into n from public.curbside_quota_ledger where user_id = u_a;
  perform pg_temp.rec('c1. ledger survives event delete',
    '1 row remains (event_id set to NULL)', n::text || ' row(s)', n = 1);

  select count(*) into n from public.curbside_quota_ledger
   where user_id = u_a and event_id is null;
  perform pg_temp.rec('c2. surviving row is orphaned, not removed',
    'event_id IS NULL', n::text || ' orphaned row(s)', n = 1);

  begin
    insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address)
    values (ws_a, 'QA 0018 post 3 (after delete)', 'curbside', 'published',
            now() + interval '3 days', now() + interval '3 days 4 hours', qa_addr);
    perform pg_temp.rec('c3. repost after deleting the event',
      'still rejected — exploit closed', 'INSERT SUCCEEDED — EXPLOIT IS OPEN', false);
  exception when others then
    get stacked diagnostics err = message_text;
    perform pg_temp.rec('c3. repost after deleting the event',
      'still rejected — exploit closed', err, err = 'curbside_quota_exhausted');
  end;

  ---------------------------------------------------------------------------
  -- (c4) THE SECOND DOOR. Delete the whole WORKSPACE via the real 0017 RPC and
  -- post from a brand-new one. This is what workspace-keying leaked.
  ---------------------------------------------------------------------------
  perform app.delete_workspace(ws_a);

  insert into public.workspaces (name, created_by)
  values ('QA 0018 — user A, second workspace', u_a) returning id into ws_a2;

  begin
    insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address)
    values (ws_a2, 'QA 0018 post 4 (new workspace)', 'curbside', 'published',
            now() + interval '4 days', now() + interval '4 days 4 hours', qa_addr);
    perform pg_temp.rec('c4. repost from a NEW workspace after deleting the old',
      'still rejected — second door closed', 'INSERT SUCCEEDED — EXPLOIT IS OPEN', false);
  exception when others then
    get stacked diagnostics err = message_text;
    perform pg_temp.rec('c4. repost from a NEW workspace after deleting the old',
      'still rejected — second door closed', err, err = 'curbside_quota_exhausted');
  end;

  ---------------------------------------------------------------------------
  -- (d) A DIFFERENT user is unaffected — the quota is per person, not global.
  ---------------------------------------------------------------------------
  perform set_config('request.jwt.claims',
    json_build_object('sub', u_b::text, 'role', 'authenticated')::text, true);

  insert into public.workspaces (name, created_by)
  values ('QA 0018 — user B', u_b) returning id into ws_b;

  begin
    insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address)
    values (ws_b, 'QA 0018 user B post', 'curbside', 'published',
            now() + interval '5 days', now() + interval '5 days 4 hours', qa_addr)
    returning id into ev_b;
    select count(*) into n from public.curbside_quota_ledger where user_id = u_b;
    perform pg_temp.rec('d. different user posts freely',
      'allowed, consumes exactly 1', 'allowed, ' || n::text || ' row(s)', n = 1);
  exception when others then
    get stacked diagnostics err = message_text;
    perform pg_temp.rec('d. different user posts freely',
      'allowed, consumes exactly 1', 'REJECTED: ' || err, false);
  end;

  ---------------------------------------------------------------------------
  -- (e) Editing a post that ALREADY consumed must not re-charge or reject.
  -- This is the case 0016 cited as its reason to skip UPDATE entirely; the
  -- per-event ledger row is what makes checking on UPDATE safe.
  ---------------------------------------------------------------------------
  begin
    update public.events set title = 'QA 0018 user B post (edited)' where id = ev_b;
    select count(*) into n from public.curbside_quota_ledger where user_id = u_b;
    perform pg_temp.rec('e. editing a consumed post',
      'succeeds, still exactly 1 row', 'succeeded, ' || n::text || ' row(s)', n = 1);
  exception when others then
    get stacked diagnostics err = message_text;
    perform pg_temp.rec('e. editing a consumed post',
      'succeeds, still exactly 1 row', 'REJECTED: ' || err, false);
  end;

  ---------------------------------------------------------------------------
  -- (f) Draft promotion cannot smuggle a free post past the gate. Under the
  -- old INSERT-only trigger this was two requests to an unlimited free lane.
  ---------------------------------------------------------------------------
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address)
  values (ws_b, 'QA 0018 draft', 'curbside', 'draft',
          now() + interval '6 days', now() + interval '6 days 4 hours', qa_addr)
  returning id into ev_draft;

  select count(*) into n from public.curbside_quota_ledger where user_id = u_b;
  perform pg_temp.rec('f1. inserting a DRAFT consumes nothing',
    'still 1 row (the published post only)', n::text || ' row(s)', n = 1);

  begin
    update public.events set status = 'published' where id = ev_draft;
    perform pg_temp.rec('f2. promoting the draft to published',
      'rejected — user B is already at quota', 'UPDATE SUCCEEDED — GATE BYPASSED', false);
  exception when others then
    get stacked diagnostics err = message_text;
    perform pg_temp.rec('f2. promoting the draft to published',
      'rejected — user B is already at quota', err, err = 'curbside_quota_exhausted');
  end;

  ---------------------------------------------------------------------------
  -- (g) Privileges: the ledger is readable by its owner and writable by nobody.
  ---------------------------------------------------------------------------
  perform pg_temp.rec('g. table grants',
    'anon select=f, authenticated select=t insert=f update=f delete=f',
    format('anon select=%s, authenticated select=%s insert=%s update=%s delete=%s',
      has_table_privilege('anon',          'public.curbside_quota_ledger', 'select'),
      has_table_privilege('authenticated', 'public.curbside_quota_ledger', 'select'),
      has_table_privilege('authenticated', 'public.curbside_quota_ledger', 'insert'),
      has_table_privilege('authenticated', 'public.curbside_quota_ledger', 'update'),
      has_table_privilege('authenticated', 'public.curbside_quota_ledger', 'delete')),
    has_table_privilege('anon',          'public.curbside_quota_ledger', 'select') = false
    and has_table_privilege('authenticated', 'public.curbside_quota_ledger', 'select') = true
    and has_table_privilege('authenticated', 'public.curbside_quota_ledger', 'insert') = false
    and has_table_privilege('authenticated', 'public.curbside_quota_ledger', 'update') = false
    and has_table_privilege('authenticated', 'public.curbside_quota_ledger', 'delete') = false);

  ---------------------------------------------------------------------------
  -- (h) The old workspace-keyed functions are gone, not merely unused.
  ---------------------------------------------------------------------------
  select count(*) into n from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
   where p.proname = 'curbside_posts_used'
     and ns.nspname in ('app', 'public')
     and pg_get_function_identity_arguments(p.oid) = 'uuid';
  perform pg_temp.rec('h. old workspace-keyed signature dropped',
    '0 functions named curbside_posts_used(uuid)', n::text || ' found', n = 0);
end;
$$;

select seq, step, expected, actual, pass from qa_results order by seq;

rollback;

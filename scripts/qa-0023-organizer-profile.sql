-- ============================================================================
-- BEHAVIORAL SUITE — migration 0023 (public Organizer Profile read path).
--
-- WHERE TO RUN: Supabase dashboard → SQL Editor, on the DEV project
-- (`Sparked-App`, ref kzynvvdggooqgtnprhrm). Never against prod.
--
-- HOW TO RUN: three sections, one at a time. Section 2 is the suite, wrapped in
-- BEGIN … ROLLBACK — nothing persists. Section 3 must reproduce Section 1.
--
-- Every row of the output grid should read pass = true.
--
-- ---------------------------------------------------------------------------
-- DISCIPLINE CARRIED FROM THE REPAIRED 0019 SUITE — these are not stylistic:
--
--   * Every privileged call is preceded by `pg_temp.act_as(...)`. Nothing
--     infers the actor from context; five calls in the 0019 suite ran as the
--     wrong person because a read helper had quietly reassigned the identity.
--   * Every helper SAVES AND RESTORES `request.jwt.claims`, so reading as
--     someone can never change who is acting.
--   * No assertion restates the predicate it is testing. Anything that depends
--     on RLS runs through a helper that switches to the `authenticated` ROLE,
--     because this script runs as `postgres`, which bypasses RLS entirely — an
--     assertion that runs as postgres and hardcodes its own filter proves
--     nothing.
--
-- THE POINT OF (d) AND (e): 0023's whole reason for existing is that
-- `events_select_public` is WRONG for a public surface. Its member branch and
-- its 0022 attendee-history branch would each put an archived event on a public
-- page. Those two assertions are the ones that would catch a regression to
-- "just use RLS".
-- ============================================================================


-- ############################################################################
-- SECTION 1 — baseline, read-only. Run first.
-- ############################################################################
select
  (select count(*) from public.events where status = 'published')      as published_events,
  (select count(*) from public.events where archived_at is not null)   as archived_events,
  (select count(*) from public.events where deleted_at is not null)    as deleted_events,
  (select count(*) from public.workspaces)                             as workspaces;


-- ############################################################################
-- SECTION 2 — the suite. BEGIN … ROLLBACK; nothing persists.
-- ############################################################################
begin;

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

-- The ONLY thing that changes who is acting.
create function pg_temp.act_as(p_user uuid)
returns void language plpgsql as $fn$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_user::text, 'role', 'authenticated')::text, true);
end;
$fn$;

-- Drop to a real anon session for one call, then restore both role and claims.
create function pg_temp.profile_as_anon(p_ws uuid)
returns jsonb language plpgsql as $fn$
declare
  out_row jsonb;
  prior   text := current_setting('request.jwt.claims', true);
begin
  perform set_config('request.jwt.claims', '', true);
  execute 'set local role anon';
  select to_jsonb(p) into out_row from public.organizer_profile(p_ws) p;
  execute 'reset role';
  perform set_config('request.jwt.claims', coalesce(prior, ''), true);
  return out_row;
exception when others then
  execute 'reset role';
  perform set_config('request.jwt.claims', coalesce(prior, ''), true);
  raise;
end;
$fn$;

-- The same call as a signed-in person. Used for (d) and (e), where the whole
-- question is whether that person's own relationship to an event leaks it onto
-- a public page.
create function pg_temp.profile_as(p_user uuid, p_ws uuid)
returns jsonb language plpgsql as $fn$
declare
  out_row jsonb;
  prior   text := current_setting('request.jwt.claims', true);
begin
  perform pg_temp.act_as(p_user);
  execute 'set local role authenticated';
  select to_jsonb(p) into out_row from public.organizer_profile(p_ws) p;
  execute 'reset role';
  perform set_config('request.jwt.claims', coalesce(prior, ''), true);
  return out_row;
exception when others then
  execute 'reset role';
  perform set_config('request.jwt.claims', coalesce(prior, ''), true);
  raise;
end;
$fn$;

-- Does this profile payload mention the event at all, in EITHER section?
create function pg_temp.profile_has(p_profile jsonb, p_event uuid)
returns boolean language sql immutable as $fn$
  select exists (
    select 1
    from jsonb_array_elements(coalesce(p_profile -> 'upcoming', '[]'::jsonb)
                              || coalesce(p_profile -> 'past', '[]'::jsonb)) x
    where (x ->> 'id')::uuid = p_event
  );
$fn$;

do $$
declare
  u_host    uuid;
  u_visitor uuid;
  ws        uuid;
  ev_up     uuid;  -- plain upcoming
  ev_past   uuid;  -- plain past
  ev_arch   uuid;  -- archived, and saved by the visitor
  ev_del    uuid;  -- deleted
  ev_anon   uuid;  -- curbside_anonymous
  ws_from_detail uuid;
  prof      jsonb;
  n         integer;
  qa_addr   constant text := '18680 S Nogales Hwy';
  qa_pt     constant extensions.geography :=
              st_setsrid(st_makepoint(-111.0, 32.0), 4326)::extensions.geography;
begin
  ---------------------------------------------------------------------------
  -- Fixtures. One workspace owned by u_host; u_visitor is a stranger to it.
  ---------------------------------------------------------------------------
  select id into u_host    from public.profiles order by created_at limit 1;
  select id into u_visitor from public.profiles where id <> u_host order by created_at limit 1;

  if u_host is null or u_visitor is null then
    perform pg_temp.rec('00. fixtures', 'at least two profiles exist',
                        'fewer than two profiles — cannot run', false);
    return;
  end if;

  delete from public.curbside_quota_ledger where user_id in (u_host, u_visitor);

  insert into public.workspaces (name, bio, location_text, website, created_by)
  values ('QA 0023 — Nogales Night Market', 'We run a night market.',
          'Green Valley, AZ', 'https://example.test', u_host)
  returning id into ws;

  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location)
  values (ws, 'QA 0023 upcoming', 'standard', 'published',
          now() + interval '9 days', now() + interval '9 days 3 hours', qa_addr, qa_pt)
  returning id into ev_up;

  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location)
  values (ws, 'QA 0023 past', 'standard', 'published',
          now() - interval '9 days', now() - interval '9 days' + interval '3 hours', qa_addr, qa_pt)
  returning id into ev_past;

  ---------------------------------------------------------------------------
  -- (a) An ANONYMOUS visitor can read the profile at all.
  ---------------------------------------------------------------------------
  prof := pg_temp.profile_as_anon(ws);

  perform pg_temp.rec('a1. anon can read the profile',
    'one row, workspace name returned',
    coalesce(prof ->> 'name', '(null row)'),
    (prof ->> 'name') = 'QA 0023 — Nogales Night Market');

  perform pg_temp.rec('a2. public workspace fields are present',
    'bio + location_text + website all returned',
    format('bio=%s loc=%s web=%s', prof ->> 'bio', prof ->> 'location_text', prof ->> 'website'),
    (prof ->> 'bio') is not null
      and (prof ->> 'location_text') is not null
      and (prof ->> 'website') is not null);

  perform pg_temp.rec('a3. upcoming / past split correctly',
    'upcoming holds the future event, past holds the ended one',
    format('upcoming=%s past=%s',
           prof -> 'upcoming' -> 0 ->> 'title', prof -> 'past' -> 0 ->> 'title'),
    (prof -> 'upcoming' -> 0 ->> 'id')::uuid = ev_up
      and (prof -> 'past' -> 0 ->> 'id')::uuid = ev_past);

  ---------------------------------------------------------------------------
  -- (b) ARCHIVED is absent from BOTH sections.
  ---------------------------------------------------------------------------
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location)
  values (ws, 'QA 0023 archived past', 'standard', 'published',
          now() - interval '8 days', now() - interval '8 days' + interval '3 hours', qa_addr, qa_pt)
  returning id into ev_arch;

  -- The visitor saves it BEFORE it is archived — this is what arms (d).
  insert into public.saves (user_id, event_id) values (u_visitor, ev_arch);

  perform pg_temp.act_as(u_host);                    -- ws owner
  perform app.archive_event(ev_arch);

  prof := pg_temp.profile_as_anon(ws);
  perform pg_temp.rec('b. archived event absent from both sections',
    'not present',
    case when pg_temp.profile_has(prof, ev_arch) then 'PRESENT — leak' else 'absent' end,
    not pg_temp.profile_has(prof, ev_arch));

  ---------------------------------------------------------------------------
  -- (c) DELETED is absent from BOTH sections.
  ---------------------------------------------------------------------------
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, location)
  values (ws, 'QA 0023 deleted past', 'standard', 'published',
          now() - interval '7 days', now() - interval '7 days' + interval '3 hours', qa_addr, qa_pt)
  returning id into ev_del;

  perform pg_temp.act_as(u_host);                    -- ws owner
  perform app.delete_event(ev_del);

  prof := pg_temp.profile_as_anon(ws);
  perform pg_temp.rec('c. deleted event absent from both sections',
    'not present',
    case when pg_temp.profile_has(prof, ev_del) then 'PRESENT — leak' else 'absent' end,
    not pg_temp.profile_has(prof, ev_del));

  ---------------------------------------------------------------------------
  -- (d) THE 0022 BRANCH MUST NOT REACH THIS SURFACE.
  -- u_visitor saved ev_arch before it was archived. Under
  -- `events_select_public` they can still see that event (ended + attendance),
  -- and that is CORRECT for their own Saved history. It must NOT follow them
  -- onto the organizer's public page.
  ---------------------------------------------------------------------------
  prof := pg_temp.profile_as(u_visitor, ws);
  perform pg_temp.rec('d. attendee who saved the archived event still cannot see it here',
    'absent — history exception must not reach a public surface',
    case when pg_temp.profile_has(prof, ev_arch) then 'PRESENT — 0022 branch leaked' else 'absent' end,
    not pg_temp.profile_has(prof, ev_arch));

  -- Sanity: that same person genuinely CAN still see it in their own history,
  -- so (d) is proving the profile filter, not a broken 0022.
  perform pg_temp.act_as(u_visitor);
  execute 'set local role authenticated';
  select count(*) into n from public.events e where e.id = ev_arch;
  execute 'reset role';
  perform pg_temp.rec('d2. …while 0022 still works for them elsewhere',
    '1 — the attendee can see it via the events policy', n::text, n = 1);

  ---------------------------------------------------------------------------
  -- (e) THE HOST'S OWN ARCHIVED EVENTS ARE NOT ON THEIR PUBLIC PAGE.
  -- The member branch of the policy would show them; the explicit filter must
  -- win. A public page is public even when its owner is looking at it.
  ---------------------------------------------------------------------------
  prof := pg_temp.profile_as(u_host, ws);
  perform pg_temp.rec('e. host viewing own profile does not see their archived event',
    'absent — member branch must not reach a public surface',
    case when pg_temp.profile_has(prof, ev_arch) then 'PRESENT — member branch leaked' else 'absent' end,
    not pg_temp.profile_has(prof, ev_arch));

  perform pg_temp.rec('e2. …nor their deleted one',
    'absent',
    case when pg_temp.profile_has(prof, ev_del) then 'PRESENT — leak' else 'absent' end,
    not pg_temp.profile_has(prof, ev_del));

  ---------------------------------------------------------------------------
  -- (f) event_detail: workspace_id present normally, NULL when anonymous.
  ---------------------------------------------------------------------------
  select d.workspace_id into ws_from_detail from public.event_detail(ev_up, 32.0, -111.0) d;
  perform pg_temp.rec('f1. event_detail returns workspace_id for a normal event',
    'the owning workspace id',
    coalesce(ws_from_detail::text, '(null)'),
    ws_from_detail = ws);

  -- act_as BEFORE the curbside insert: 0018's consume trigger attributes the
  -- credit to coalesce(auth.uid(), created_by), and leaving the previous
  -- section's identity in place is exactly how the 0019 suite charged the
  -- wrong person and made the ledger look broken.
  perform pg_temp.act_as(u_host);                    -- ws owner
  insert into public.events (workspace_id, title, tier_id, status, starts_at, ends_at, address, curbside_anonymous)
  values (ws, 'QA 0023 anonymous curbside', 'curbside', 'published',
          now() + interval '2 days', now() + interval '2 days 4 hours', qa_addr, true)
  returning id into ev_anon;

  select count(*) into n
    from public.event_detail(ev_anon, 32.0, -111.0) d
   where d.workspace_id is null and d.organizer_name is null;
  perform pg_temp.rec('f2. event_detail suppresses BOTH id and name when anonymous',
    'workspace_id NULL and organizer_name NULL',
    case when n = 1 then 'both null' else 'one or both LEAKED' end, n = 1);

  -- And the same event must not appear on its own poster's profile, or the
  -- mask is undone from the other direction.
  prof := pg_temp.profile_as_anon(ws);
  perform pg_temp.rec('f3. anonymous curbside post absent from its own workspace profile',
    'absent — listing it under the organizer name would deanonymize it',
    case when pg_temp.profile_has(prof, ev_anon) then 'PRESENT — mask bypassed' else 'absent' end,
    not pg_temp.profile_has(prof, ev_anon));

  ---------------------------------------------------------------------------
  -- (g) publish_fee_cents is unreachable on both surfaces.
  ---------------------------------------------------------------------------
  perform pg_temp.rec('g1. organizer_profile payload carries no fee',
    'no publish_fee key anywhere in the JSON',
    case when prof::text like '%publish_fee%' then 'FOUND — leak' else 'absent' end,
    prof::text not like '%publish_fee%');

  -- The DECLARED return signature, not information_schema.columns — a function
  -- is not a table, so that view would have returned 0 vacuously and proved
  -- nothing.
  select count(*) into n from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname in ('public', 'app')
     and p.proname in ('organizer_profile', 'event_detail')
     and pg_get_function_result(p.oid) like '%publish_fee%';
  perform pg_temp.rec('g2. neither function DECLARES a fee column',
    '0 return signatures mentioning publish_fee', n::text, n = 0);

  select count(*) into n from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname in ('public', 'app')
     and p.proname in ('organizer_profile', 'event_detail')
     and pg_get_functiondef(p.oid) like '%publish_fee_cents%';
  perform pg_temp.rec('g3. neither function body even mentions it',
    '0 function bodies referencing publish_fee_cents', n::text, n = 0);
end;
$$;

select seq, step, expected, actual, pass from qa_results order by seq;

rollback;


-- ############################################################################
-- SECTION 3 — confirm the rollback was clean. Must match Section 1 exactly.
-- ############################################################################
select
  (select count(*) from public.events where status = 'published')      as published_events,
  (select count(*) from public.events where archived_at is not null)   as archived_events,
  (select count(*) from public.events where deleted_at is not null)    as deleted_events,
  (select count(*) from public.workspaces)                             as workspaces;

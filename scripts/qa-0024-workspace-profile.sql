-- ============================================================================
-- BEHAVIORAL SUITE — migration 0024 (host-editable public profile).
--
-- WHERE TO RUN: Supabase dashboard → SQL Editor, DEV project
-- (`Sparked-App`, ref kzynvvdggooqgtnprhrm). Never against prod.
--
-- HOW TO RUN: three sections, one at a time. Section 2 is BEGIN … ROLLBACK;
-- nothing persists. Section 3 must reproduce Section 1.
--
-- Every row of the output grid should read pass = true.
--
-- ---------------------------------------------------------------------------
-- DISCIPLINE (carried from the repaired 0019 and 0023 suites):
--   * every privileged call is preceded by `pg_temp.act_as(...)` — nothing
--     infers the actor from context;
--   * helpers SAVE AND RESTORE `request.jwt.claims`, so reading as someone can
--     never change who is acting;
--   * this script runs as `postgres`, which BYPASSES RLS and column grants, so
--     the grant assertion (g) inspects the catalog rather than trying and
--     failing to write — a postgres UPDATE would succeed and prove nothing.
--
-- THE POINT OF (g): 0024's validation only means something because the direct
-- write path is closed. If UPDATE is ever re-granted to `authenticated`, every
-- rule in (e) becomes advisory and this assertion is what notices.
-- ============================================================================


-- ############################################################################
-- SECTION 1 — baseline, read-only. Run first.
-- ############################################################################
select
  (select count(*) from public.workspaces)                                  as workspaces,
  has_table_privilege('authenticated', 'public.workspaces', 'update')       as auth_can_update,
  has_table_privilege('authenticated', 'public.workspaces', 'insert')       as auth_can_insert,
  has_table_privilege('anon',          'public.workspaces', 'update')       as anon_can_update;


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

create function pg_temp.act_as(p_user uuid)
returns void language plpgsql as $fn$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_user::text, 'role', 'authenticated')::text, true);
end;
$fn$;

-- Attempt an update AS p_user and report either 'ok' or the error message.
-- Restores the prior identity either way, so one call cannot silently reassign
-- who the next one runs as.
create function pg_temp.try_update(p_user uuid, p_ws uuid, p_name text, p_socials jsonb default '{}'::jsonb)
returns text language plpgsql as $fn$
declare
  prior text := current_setting('request.jwt.claims', true);
  msg   text;
begin
  perform pg_temp.act_as(p_user);
  begin
    perform app.update_workspace_profile(
      p_ws, p_name, 'bio text', 'Somewhere, AZ', 'https://example.test', p_socials
    );
    msg := 'ok';
  exception when others then
    get stacked diagnostics msg = message_text;
  end;
  perform set_config('request.jwt.claims', coalesce(prior, ''), true);
  return msg;
end;
$fn$;

do $$
declare
  u_owner   uuid;
  u_editor  uuid;
  u_viewer  uuid;
  u_stranger uuid;
  ws        uuid;
  res       text;
  n         integer;
  prof      jsonb;
begin
  ---------------------------------------------------------------------------
  -- Fixtures. One workspace, three membership roles, one outsider.
  -- The owner row comes from the 0001 trigger; editor and viewer are inserted
  -- directly, which is the only way they can exist — no client path writes
  -- memberships, which is exactly why 'editor' has never been exercised.
  ---------------------------------------------------------------------------
  select id into u_owner    from public.profiles order by created_at limit 1;
  select id into u_editor   from public.profiles where id <> u_owner order by created_at limit 1;
  select id into u_viewer   from public.profiles where id not in (u_owner, u_editor) order by created_at limit 1;
  select id into u_stranger from public.profiles where id not in (u_owner, u_editor, coalesce(u_viewer, u_owner))
                            order by created_at limit 1;

  if u_owner is null or u_editor is null then
    perform pg_temp.rec('00. fixtures', 'at least two profiles', 'fewer than two', false);
    return;
  end if;

  insert into public.workspaces (name, created_by)
  values ('QA 0024 original name', u_owner) returning id into ws;

  insert into public.memberships (workspace_id, user_id, role)
  values (ws, u_editor, 'editor');

  if u_viewer is not null then
    insert into public.memberships (workspace_id, user_id, role)
    values (ws, u_viewer, 'viewer');
  end if;

  ---------------------------------------------------------------------------
  -- (a) OWNER can update.
  ---------------------------------------------------------------------------
  res := pg_temp.try_update(u_owner, ws, 'QA 0024 owner edit',
                            '{"instagram":"  @nightmarket  "}'::jsonb);
  perform pg_temp.rec('a1. owner can update', 'ok', res, res = 'ok');

  select name into res from public.workspaces where id = ws;
  perform pg_temp.rec('a2. …and the write landed', 'QA 0024 owner edit', res,
                      res = 'QA 0024 owner edit');

  select socials ->> 'instagram' into res from public.workspaces where id = ws;
  perform pg_temp.rec('a3. social values are TRIMMED server-side',
    '@nightmarket (no surrounding spaces)', quote_literal(res), res = '@nightmarket');

  ---------------------------------------------------------------------------
  -- (b) EDITOR can update. First function in the codebase to exercise the role.
  ---------------------------------------------------------------------------
  res := pg_temp.try_update(u_editor, ws, 'QA 0024 editor edit');
  perform pg_temp.rec('b. EDITOR can update', 'ok', res, res = 'ok');

  ---------------------------------------------------------------------------
  -- (c) VIEWER rejected — membership is not permission.
  ---------------------------------------------------------------------------
  if u_viewer is null then
    perform pg_temp.rec('c. viewer rejected', 'a third profile to test with',
                        'SKIPPED — fewer than three profiles', true);
  else
    res := pg_temp.try_update(u_viewer, ws, 'QA 0024 viewer edit');
    perform pg_temp.rec('c. VIEWER rejected despite being a member',
      'not_an_editor', res, res = 'not_an_editor');
  end if;

  ---------------------------------------------------------------------------
  -- (d) NON-MEMBER rejected.
  ---------------------------------------------------------------------------
  if u_stranger is null then
    perform pg_temp.rec('d. non-member rejected', 'a fourth profile to test with',
                        'SKIPPED — fewer than four profiles', true);
  else
    res := pg_temp.try_update(u_stranger, ws, 'QA 0024 stranger edit');
    perform pg_temp.rec('d. non-member rejected', 'not_an_editor', res,
                        res = 'not_an_editor');
  end if;

  ---------------------------------------------------------------------------
  -- (e) VALIDATION. Name is the only required field — it is the organizer's
  -- identity on every card, so an empty one would render a nameless listing.
  ---------------------------------------------------------------------------
  res := pg_temp.try_update(u_owner, ws, '');
  perform pg_temp.rec('e1. empty name rejected', 'name_required', res, res = 'name_required');

  res := pg_temp.try_update(u_owner, ws, '     ');
  perform pg_temp.rec('e2. whitespace-only name rejected (trimmed BEFORE the check)',
    'name_required', res, res = 'name_required');

  res := pg_temp.try_update(u_owner, ws, repeat('x', 81));
  perform pg_temp.rec('e3. over-long name rejected', 'name_too_long', res,
                      res = 'name_too_long');

  res := pg_temp.try_update(u_owner, ws, 'QA 0024 ok', '{"youtube":"nope"}'::jsonb);
  perform pg_temp.rec('e4. unknown social key REJECTED, not silently dropped',
    'invalid_social_key', res, res = 'invalid_social_key');

  res := pg_temp.try_update(u_owner, ws, 'QA 0024 ok',
                            jsonb_build_object('x', repeat('y', 101)));
  perform pg_temp.rec('e5. over-long social value rejected', 'social_value_too_long',
                      res, res = 'social_value_too_long');

  res := pg_temp.try_update(u_owner, ws, 'QA 0024 ok', '"not an object"'::jsonb);
  perform pg_temp.rec('e6. non-object socials rejected', 'socials_must_be_object',
                      res, res = 'socials_must_be_object');

  -- Emptied fields drop their key rather than storing "" and rendering a blank
  -- button on the public profile.
  res := pg_temp.try_update(u_owner, ws, 'QA 0024 ok',
                            '{"instagram":"@keep","facebook":"   "}'::jsonb);
  select socials::text into res from public.workspaces where id = ws;
  perform pg_temp.rec('e7. blanked social key is DROPPED, not stored empty',
    'instagram only', res, res::jsonb ? 'instagram' and not (res::jsonb ? 'facebook'));

  ---------------------------------------------------------------------------
  -- (f) The edit is what the PUBLIC profile serves.
  ---------------------------------------------------------------------------
  perform pg_temp.try_update(u_owner, ws, 'QA 0024 public name',
                             '{"tiktok":"@market"}'::jsonb);
  select to_jsonb(p) into prof from public.organizer_profile(ws) p;
  perform pg_temp.rec('f1. organizer_profile serves the new name',
    'QA 0024 public name', prof ->> 'name', (prof ->> 'name') = 'QA 0024 public name');
  perform pg_temp.rec('f2. …and the new socials',
    'tiktok present', (prof -> 'socials')::text,
    (prof -> 'socials') ? 'tiktok');

  ---------------------------------------------------------------------------
  -- (g) THE DIRECT WRITE PATH IS CLOSED. Catalog inspection, not a write
  -- attempt: this script runs as postgres, whose UPDATE would succeed and
  -- prove nothing about what a CLIENT can do.
  ---------------------------------------------------------------------------
  perform pg_temp.rec('g1. authenticated has NO update on workspaces',
    'false',
    has_table_privilege('authenticated', 'public.workspaces', 'update')::text,
    has_table_privilege('authenticated', 'public.workspaces', 'update') = false);

  perform pg_temp.rec('g2. …and no column-level update either',
    'false on name/created_by',
    format('name=%s created_by=%s',
      has_column_privilege('authenticated', 'public.workspaces', 'name', 'update'),
      has_column_privilege('authenticated', 'public.workspaces', 'created_by', 'update')),
    has_column_privilege('authenticated', 'public.workspaces', 'name', 'update') = false
      and has_column_privilege('authenticated', 'public.workspaces', 'created_by', 'update') = false);

  perform pg_temp.rec('g3. INSERT and DELETE survive (getOrCreateWorkspace + owner teardown)',
    'both true',
    format('insert=%s delete=%s',
      has_table_privilege('authenticated', 'public.workspaces', 'insert'),
      has_table_privilege('authenticated', 'public.workspaces', 'delete')),
    has_table_privilege('authenticated', 'public.workspaces', 'insert')
      and has_table_privilege('authenticated', 'public.workspaces', 'delete'));

  perform pg_temp.rec('g4. anon can neither update nor execute the RPC',
    'update=false, execute=false',
    format('update=%s execute=%s',
      has_table_privilege('anon', 'public.workspaces', 'update'),
      has_function_privilege('anon',
        'public.update_workspace_profile(uuid,text,text,text,text,jsonb)', 'execute')),
    has_table_privilege('anon', 'public.workspaces', 'update') = false
      and has_function_privilege('anon',
        'public.update_workspace_profile(uuid,text,text,text,text,jsonb)', 'execute') = false);
end;
$$;

select seq, step, expected, actual, pass from qa_results order by seq;

rollback;


-- ############################################################################
-- SECTION 3 — confirm the rollback was clean. Must match Section 1 exactly.
-- ############################################################################
select
  (select count(*) from public.workspaces)                                  as workspaces,
  has_table_privilege('authenticated', 'public.workspaces', 'update')       as auth_can_update,
  has_table_privilege('authenticated', 'public.workspaces', 'insert')       as auth_can_insert,
  has_table_privilege('anon',          'public.workspaces', 'update')       as anon_can_update;

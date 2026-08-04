-- ============================================================================
-- 0024 — Host-editable public profile: update_workspace_profile + closing the
-- direct client write path to `workspaces`.
--
-- TWO THINGS HAPPEN HERE, and the second is the one that makes the first mean
-- anything.
--
-- 1. A definer RPC lets an owner OR AN EDITOR update the public profile fields,
--    with validation that cannot be skipped.
-- 2. `update` is REVOKED from `authenticated` on public.workspaces, so the RPC
--    is the only write path that exists.
--
-- WHY (2) IS NOT OPTIONAL. Since 0002 the table has carried
-- `grant insert, update, delete on public.workspaces to authenticated`, and
-- 0001's `workspaces_update_owner` policy admits owners. An owner could
-- therefore already PATCH the table directly from the client — no RPC, and
-- crucially no validation. Shipping (1) without (2) would mean a non-empty-name
-- rule that the people most likely to hit it can walk straight around.
--
-- IT ALSO CLOSES A REACHABILITY NOBODY INTENDED. That grant was TABLE-level, so
-- it covered every column — including `created_by`, a `profiles.id` and
-- therefore an `auth.users.id`. An owner could reassign their workspace's
-- creator to another user, which is the row the seed/ledger/backfill logic
-- treats as the responsible party. Nothing in the app ever did this and no
-- exploit is known; the point is that the capability existed and now does not.
-- 0015 revoked SELECT on that column for privacy and explicitly left the write
-- grants alone; this is the other half of that job.
--
-- WHAT STAYS: INSERT (getOrCreateWorkspace still creates a host's first
-- workspace from the client) and DELETE (owner teardown, ruled 2026-07-30 to
-- remain a hard cascade). Only UPDATE goes.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- PART A — the definer body.
--
-- OWNER **OR EDITOR**, matching delete_event / archive_event / unarchive_event
-- exactly. `memberships.role` has carried 'editor' since 0001 and nothing has
-- ever read it; this is the first function that does, and it is deliberately
-- the right shape for the Backstage/teams rollout rather than an owner-only
-- stopgap that would need rewriting then. A viewer is a member and still gets
-- rejected — membership is not permission.
--
-- VALIDATION LIVES HERE, not in the client, and after (2) below there is no
-- other door. Trimming happens server-side too, so what is stored cannot differ
-- from what was checked.
-- ---------------------------------------------------------------------------
create or replace function app.update_workspace_profile(
  p_workspace_id  uuid,
  p_name          text,
  p_bio           text,
  p_location_text text,
  p_website       text,
  p_socials       jsonb
)
returns void
language plpgsql
security definer
set search_path = public, app
as $$
declare
  v_name    text := btrim(coalesce(p_name, ''));
  v_bio     text := nullif(btrim(coalesce(p_bio, '')), '');
  v_loc     text := nullif(btrim(coalesce(p_location_text, '')), '');
  v_site    text := nullif(btrim(coalesce(p_website, '')), '');
  v_socials jsonb;
begin
  -- Definer bypasses RLS, so this check IS the authorization. It runs first, so
  -- a non-member learns nothing about whether the workspace exists.
  if not app.is_member(p_workspace_id, array['owner', 'editor']) then
    raise exception 'not_an_editor'
      using errcode = '42501',
            hint = 'Only workspace editors and owners may edit the public profile.';
  end if;

  ---------------------------------------------------------------------------
  -- Scalars. Name is the only required field: it IS the organizer's identity
  -- on every card and the profile header, and an empty one would render a
  -- nameless listing on the public feed.
  ---------------------------------------------------------------------------
  if v_name = '' then
    raise exception 'name_required'
      using errcode = '22023', hint = 'A workspace name is required.';
  end if;
  if length(v_name) > 80 then
    raise exception 'name_too_long' using errcode = '22023';
  end if;
  if length(coalesce(v_bio, '')) > 500 then
    raise exception 'bio_too_long' using errcode = '22023';
  end if;
  if length(coalesce(v_loc, '')) > 120 then
    raise exception 'location_too_long' using errcode = '22023';
  end if;
  if length(coalesce(v_site, '')) > 200 then
    raise exception 'website_too_long' using errcode = '22023';
  end if;

  ---------------------------------------------------------------------------
  -- Socials. A FIXED key set, not free-form: the public profile renders
  -- `Object.entries(socials)` and uses the KEY as the visible button label, so
  -- an arbitrary key is arbitrary copy on a public page. Unknown keys are
  -- rejected rather than silently dropped — a caller sending `youtube` should
  -- learn it is unsupported, not watch it vanish.
  ---------------------------------------------------------------------------
  if p_socials is null or jsonb_typeof(p_socials) <> 'object' then
    raise exception 'socials_must_be_object' using errcode = '22023';
  end if;

  if exists (
    select 1 from jsonb_object_keys(p_socials) k
    where k not in ('instagram', 'facebook', 'tiktok', 'x')
  ) then
    raise exception 'invalid_social_key'
      using errcode = '22023',
            hint = 'Allowed keys: instagram, facebook, tiktok, x.';
  end if;

  if exists (
    select 1 from jsonb_each_text(p_socials) where length(btrim(value)) > 100
  ) then
    raise exception 'social_value_too_long' using errcode = '22023';
  end if;

  -- Trim every value and drop the empties, so clearing a field in the editor
  -- removes the key rather than storing "" and rendering a blank button.
  select coalesce(jsonb_object_agg(t.k, t.v), '{}'::jsonb)
    into v_socials
  from (
    select key as k, btrim(value) as v from jsonb_each_text(p_socials)
  ) t
  where t.v <> '';

  update public.workspaces w
     set name          = v_name,
         bio           = v_bio,
         location_text = v_loc,
         website       = v_site,
         socials       = v_socials
   where w.id = p_workspace_id;

  if not found then
    raise exception 'workspace_not_found' using errcode = '42704';
  end if;
end;
$$;

revoke all on function app.update_workspace_profile(uuid, text, text, text, text, jsonb) from public, anon;
grant execute on function app.update_workspace_profile(uuid, text, text, text, text, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- PART B — public wrapper. INVOKER, so the API surface carries no definer lint.
-- Its body touches no tables. Parameter names are load-bearing: PostgREST calls
-- RPCs by NAME and the client sends these exact keys.
-- ---------------------------------------------------------------------------
create or replace function public.update_workspace_profile(
  workspace_id  uuid,
  name          text,
  bio           text,
  location_text text,
  website       text,
  socials       jsonb
)
returns void
language sql
security invoker
set search_path = public, app
as $$
  select app.update_workspace_profile(
    workspace_id, name, bio, location_text, website, socials
  );
$$;

revoke all on function public.update_workspace_profile(uuid, text, text, text, text, jsonb) from public, anon;
grant execute on function public.update_workspace_profile(uuid, text, text, text, text, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- PART C — close the direct write path.
--
-- INSERT and DELETE stay: getOrCreateWorkspace creates a host's first workspace
-- from the client, and owner teardown is a ruled hard cascade. Only UPDATE was
-- ever a bypass.
-- ---------------------------------------------------------------------------
revoke update on public.workspaces from authenticated;

-- `workspaces_update_owner` (0001) is deliberately LEFT IN PLACE and is now
-- dead: a policy only filters rows for a role that already holds the privilege,
-- and `authenticated` no longer holds UPDATE, so the policy can never be
-- reached from the API. It is kept rather than dropped for two reasons — it
-- documents the original intent at the place a reader looks for it, and if a
-- future migration ever re-grants UPDATE the owner restriction is already
-- there rather than having to be remembered. Dropping it would make a
-- re-grant silently permit every authenticated user to edit every workspace.
comment on policy workspaces_update_owner on public.workspaces is
  'DEAD as of 0024: UPDATE is revoked from authenticated, so this policy is unreachable from the API. Kept deliberately — it is the safety net if UPDATE is ever re-granted. All profile writes go through app.update_workspace_profile.';

notify pgrst, 'reload schema';

-- ============================================================================
-- 0008 — Curbside quota enforcement (SCHEMA_PLAN §6.4, pulled forward from
-- the plan's "host content" batch because the mini-form ships now).
-- The quota is COMPUTED from the rolling 100-day window — never a stored
-- counter (locked pattern: store what only transactions change, compute what
-- time changes). Two layers: the before-insert trigger is the real gate; the
-- public wrapper serves the UI's "N of 3" display (members only).
-- ============================================================================

-- Internal count — definer so the trigger sees every row regardless of the
-- caller's RLS view. app schema: not API-exposed, no advisor lint.
create or replace function app.curbside_posts_used(ws uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.events
  where workspace_id = ws
    and tier_id = 'curbside'
    and status <> 'draft'
    and created_at > now() - interval '100 days';
$$;

grant execute on function app.curbside_posts_used(uuid) to authenticated;

-- UI display: members of the workspace only; null for anyone else.
create or replace function public.curbside_posts_used(ws uuid)
returns integer
language sql
stable
security invoker
set search_path = public
as $$
  select app.curbside_posts_used(ws)
  where app.is_member(ws, array['owner', 'editor', 'viewer']);
$$;

grant execute on function public.curbside_posts_used(uuid) to authenticated;

-- The gate: reject the 4th non-draft curbside post in the window. The client
-- renders the conversion screen (not an error state) on this failure.
create or replace function app.enforce_curbside_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.tier_id = 'curbside' and new.status <> 'draft' then
    if app.curbside_posts_used(new.workspace_id) >= 3 then
      raise exception 'curbside_quota_exhausted'
        using hint = '3 free Curbside posts per rolling 100 days';
    end if;
  end if;
  return new;
end;
$$;

create trigger events_curbside_quota
  before insert on public.events
  for each row execute function app.enforce_curbside_quota();

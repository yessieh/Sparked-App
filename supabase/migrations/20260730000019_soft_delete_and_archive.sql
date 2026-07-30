-- ============================================================================
-- 0019 — Soft delete + reversible archive. Implements SPARKED_STATE
-- Architecture Decision 8 (data lifecycle).
--
-- THE DESIGN. Two columns, two meanings:
-- - `deleted_at`: irreversible to the host. Hidden from everywhere (all read
--   paths filter it out). Survives 90 days for auditing, then hard-purged by a
--   job. THE EVENT IS GONE.
-- - `archived_at`: reversible. Visible to the owner in Workspace but hidden
--   from all PUBLIC surfaces (feed, search, detail, Saved, Organizer Profile).
--   Timestamps record WHEN, which states don't. The RLS policy and every definer
--   function distinguishes between "member" visibility (archived is visible) and
--   "public" (archived is hidden). THE EVENT IS OFF THE STOREFRONT.
--
-- THREE RPCs: `delete_event` (host only, irreversible), `archive_event` /
-- `unarchive_event` (host only, reversible). Column grants (0011's pattern) keep
-- these unwritable by clients — clients can READ both columns (Workspace needs
-- to render an "Archived" badge) but cannot INSERT/UPDATE them. The RPCs are
-- the only way to write them.
--
-- THE QUOTA LEDGER: 0018 is immune. Both delete and archive leave the
-- consumption row intact (because the point of the ledger is that consumption
-- survives event deletion). The `consume_curbside_credit` trigger checks
-- `when (new.tier_id = 'curbside' and new.status <> 'draft' and new.deleted_at
-- is null)` so deleting an event cannot re-fire consumption.
--
-- COLUMN GRANTS are the fail-closed keystone: `deleted_at` and `archived_at`
-- are SELECT-only for authenticated. No INSERT, no UPDATE, no direct write path.
-- Every new column is UNGRANTED until named, so they default to silent failure.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- PART A — the columns.
-- ---------------------------------------------------------------------------
alter table public.events
  add column deleted_at timestamptz,
  add column archived_at timestamptz;

-- ---------------------------------------------------------------------------
-- PART B — the RLS policy that chooses what the public sees.
--
-- BEFORE: status = 'published' OR is_member. Kept that shape, added two new
-- predicates:
-- - deleted_at is null: ABSOLUTE. Deleted events are gone everywhere, even
--   from their owner. (The owner still sees them in Workspace via the definer
--   RPCs; the client SELECT on the events table sees nothing.)
-- - (status in ('published','cancelled') AND archived_at is null) OR is_member:
--   PUBLIC vs MEMBER path, both respecting delete. Public path requires both
--   published/cancelled AND not archived. Member path sees everything deleted
--   (already filtered) allows archived.
--
-- So the table-level RLS is the "safe by default" safety net. Definer functions
-- still add explicit filters as defence-in-depth; a new path is safe without
-- remembering to add them by hand.
-- ---------------------------------------------------------------------------
drop policy if exists events_select_public on public.events;

create policy events_select_public on public.events
  for select using (
    deleted_at is null
    and (
      (status in ('published', 'cancelled') and archived_at is null)
      or app.is_member(workspace_id, array['owner', 'editor', 'viewer'])
    )
  );

-- ---------------------------------------------------------------------------
-- PART C — column grants. SELECT only for authenticated; no INSERT/UPDATE.
-- Clients can read `deleted_at` and `archived_at` (Workspace needs them), but
-- cannot write them. That is what makes the RPCs load-bearing.
-- ---------------------------------------------------------------------------
grant select (deleted_at, archived_at) on public.events to authenticated;

-- ---------------------------------------------------------------------------
-- PART D — the delete RPC. Irreversible to the host.
-- ---------------------------------------------------------------------------
create or replace function app.delete_event(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public, app
as $$
declare
  ws_id uuid;
begin
  select e.workspace_id into ws_id
  from public.events e
  where e.id = p_event_id;

  if ws_id is null then
    raise exception 'event_not_found'
      using errcode = '42P01';
  end if;

  -- Membership check. Raises if not a member.
  if not app.is_member(ws_id, array['owner', 'editor']) then
    raise exception 'not_an_editor'
      using errcode = '42501',
            hint = 'Only workspace editors and owners may delete events.';
  end if;

  update public.events
  set deleted_at = now()
  where id = p_event_id;
end;
$$;

revoke all on function app.delete_event(uuid) from public, anon;
grant execute on function app.delete_event(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- PART E — the archive RPCs. Reversible.
-- ---------------------------------------------------------------------------
create or replace function app.archive_event(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public, app
as $$
declare
  ws_id uuid;
begin
  select e.workspace_id into ws_id
  from public.events e
  where e.id = p_event_id;

  if ws_id is null then
    raise exception 'event_not_found'
      using errcode = '42P01';
  end if;

  if not app.is_member(ws_id, array['owner', 'editor']) then
    raise exception 'not_an_editor'
      using errcode = '42501',
            hint = 'Only workspace editors and owners may archive events.';
  end if;

  update public.events
  set archived_at = now()
  where id = p_event_id
    and archived_at is null; -- idempotent: already archived, do nothing
end;
$$;

revoke all on function app.archive_event(uuid) from public, anon;
grant execute on function app.archive_event(uuid) to authenticated;

create or replace function app.unarchive_event(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public, app
as $$
declare
  ws_id uuid;
begin
  select e.workspace_id into ws_id
  from public.events e
  where e.id = p_event_id;

  if ws_id is null then
    raise exception 'event_not_found'
      using errcode = '42P01';
  end if;

  if not app.is_member(ws_id, array['owner', 'editor']) then
    raise exception 'not_an_editor'
      using errcode = '42501',
            hint = 'Only workspace editors and owners may unarchive events.';
  end if;

  update public.events
  set archived_at = null
  where id = p_event_id
    and archived_at is not null; -- idempotent: already unarchived, do nothing
end;
$$;

revoke all on function app.unarchive_event(uuid) from public, anon;
grant execute on function app.unarchive_event(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- PART F — public invoker wrappers. Same pattern as 0008/0012/0015/0017.
-- Clients call these; they call the definer functions above.
-- ---------------------------------------------------------------------------
create or replace function public.delete_event(event_id uuid)
returns void
language sql
security invoker
as $$
  select app.delete_event(event_id);
$$;

grant execute on function public.delete_event(uuid) to authenticated;

create or replace function public.archive_event(event_id uuid)
returns void
language sql
security invoker
as $$
  select app.archive_event(event_id);
$$;

grant execute on function public.archive_event(uuid) to authenticated;

create or replace function public.unarchive_event(event_id uuid)
returns void
language sql
security invoker
as $$
  select app.unarchive_event(event_id);
$$;

grant execute on function public.unarchive_event(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- PART G — fix the 0018 curbside consume trigger to NOT fire on delete.
-- Deleting an event should NEVER trigger a new consume (the ledger row already
-- exists, and the advisory-lock short-circuit handles UPDATE anyway). Adding
-- `new.deleted_at is null` to the WHEN clause prevents the trigger from firing
-- when the UPDATE sets deleted_at.
-- ---------------------------------------------------------------------------
drop trigger if exists events_curbside_consume on public.events;

create trigger events_curbside_consume
  after insert or update on public.events
  for each row
  when (
    new.tier_id = 'curbside'
    and new.status <> 'draft'
    and new.deleted_at is null
  )
  execute function app.consume_curbside_credit();

-- ---------------------------------------------------------------------------
-- PART H — update the child-table SELECT policies to respect delete + archive.
--
-- BEFORE: status in ('published','cancelled') OR is_member(). The inline
-- predicate already filters deleted via the events FK (the events policy is
-- applied by the join), but archive is new. Add the same member vs public
-- logic: public sees archived=false, members see everything.
-- ---------------------------------------------------------------------------
drop policy if exists event_categories_select_public on public.event_categories;

create policy event_categories_select_public on public.event_categories
  for select using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and (
          (e.status in ('published', 'cancelled') and e.archived_at is null)
          or app.is_member(e.workspace_id, array['owner', 'editor', 'viewer'])
        )
    )
  );

drop policy if exists event_vendors_select_public on public.event_vendors;

create policy event_vendors_select_public on public.event_vendors
  for select using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and (
          (e.status in ('published', 'cancelled') and e.archived_at is null)
          or app.is_member(e.workspace_id, array['owner', 'editor', 'viewer'])
        )
    )
  );

-- ============================================================================
-- 0017 — Workspace host screen: per-event engagement counts + workspace delete.
--
-- The listings themselves need NO server work: `events_select_public` (0001)
-- already lets a member SELECT every row their workspace owns, and 0011's
-- per-column grants cover every field the host card renders (publish_fee_cents
-- is excluded on purpose — the EventStub is consumer-facing data only, and the
-- fee has its own member-scoped reader in 0012). The screen reads events
-- straight off the table, filtered to status='published'.
--
-- Two things it CANNOT do from the client, hence this migration.
--
-- CONVENTION (0008 → 0012 → 0014 → 0015): the SECURITY DEFINER body lives in
-- `app` — a schema the Data API does not expose, so the advisor never lints it
-- — with a thin SECURITY INVOKER wrapper in `public`. Membership is re-checked
-- BY HAND in every definer body precisely because definer bypasses RLS.
--
-- PARAMETER NAMES ON THE PUBLIC WRAPPERS ARE LOAD-BEARING: PostgREST calls RPCs
-- with NAMED arguments and the app sends `{ workspace_id }`. The app-schema
-- bodies use p_ prefixes so a bare `event_id` can never be ambiguous against a
-- column reference (same reasoning as 0012/0014).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- PART A — workspace_event_stats: RSVP + save counts, one row per published
-- event, for the host's own listing rows.
--
-- WHY NOT AN EXTENSION OF workspace_stats (0015): that function returns exactly
-- ONE aggregate row and the dormant multi-workspace picker depends on that
-- shape. These are per-event numbers — a different cardinality — so they get a
-- sibling function rather than a contorted one. One call covers a whole
-- workspace, so the screen still makes a single round trip.
--
-- DEFINER is not a preference, it is the only thing that works for SAVES:
-- `saves` is own-rows RLS (0006), so a client counting saves on its own events
-- sees only its own save. RSVPs are the opposite case — `events.rsvp_count` is
-- the trigger-maintained counter every consumer card already renders, and it is
-- readable by clients — but it is returned HERE anyway so the host's two chips
-- come from one read, and so the host's RSVP number is byte-identical to the
-- one the public card shows. No new counter, no new column.
--
-- Non-members get ZERO ROWS, never an error — "not yours to see" is not a
-- failure (same shape as workspace_stats / curbside_posts_used).
-- ---------------------------------------------------------------------------
create or replace function app.workspace_event_stats(p_workspace_id uuid)
returns table (event_id uuid, rsvp_count integer, save_count integer)
language sql
stable
security definer
set search_path = public, app
as $$
  select
    e.id,
    e.rsvp_count,
    (select count(*)::int from public.saves s where s.event_id = e.id)
  from public.events e
  where e.workspace_id = p_workspace_id
    and e.deleted_at is null
    and e.status = 'published'
    and app.is_member(p_workspace_id, array['owner', 'editor', 'viewer']);
$$;

revoke all on function app.workspace_event_stats(uuid) from public, anon;
grant execute on function app.workspace_event_stats(uuid) to authenticated;

create or replace function public.workspace_event_stats(workspace_id uuid)
returns table (event_id uuid, rsvp_count integer, save_count integer)
language sql
stable
security invoker
set search_path = public, app
as $$
  select * from app.workspace_event_stats(workspace_id);
$$;

revoke all on function public.workspace_event_stats(uuid) from public, anon;
grant execute on function public.workspace_event_stats(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- PART B — delete_workspace: the host's "Delete event(s) & Workspace" action.
--
-- OWNER ONLY. Editors can write events; ending the business is not theirs.
-- Unlike the read paths above this RAISES for a non-owner rather than returning
-- nothing: a destructive call that silently does nothing is the wrong shape,
-- and the screen surfaces the message. Same posture and errcode as
-- publish_paid_event's `not_a_member` (0014).
--
-- The body deletes ONE row. Everything else is the existing FK cascade, which
-- is exactly what the confirm dialog promises the host:
--   workspaces → memberships          (0001, on delete cascade)
--   workspaces → events               (0001, on delete cascade)
--     events   → event_categories     (0001)
--     events   → saves                (0006)  ← "removed from everyone's
--     events   → rsvps                (0006)      Saved lists"
--     events   → event_vendors        (0013)
-- Nothing here needs to know that list; it is asserted by the schema. Returns
-- the number of events that went with it (ALL statuses — drafts and
-- pending_payment included, counted before the delete) so the caller can report
-- accurately if it ever wants to.
--
-- NOTE for a future 0004_payments: once real orders/charges exist, a workspace
-- with settled payments should be soft-deleted or blocked here rather than
-- cascaded. At MVP there are no financial rows to orphan.
-- ---------------------------------------------------------------------------
create or replace function app.delete_workspace(p_workspace_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, app
as $$
declare
  event_count integer;
begin
  -- Definer bypasses RLS — this check IS the authorization. It runs first, so
  -- a non-owner learns nothing about whether the workspace exists.
  if not app.is_member(p_workspace_id, array['owner']) then
    raise exception 'not_an_owner' using errcode = '42501';
  end if;

  select count(*)::int into event_count
  from public.events e
  where e.workspace_id = p_workspace_id;

  delete from public.workspaces w where w.id = p_workspace_id;
  if not found then
    raise exception 'workspace_not_found' using errcode = '42704';
  end if;

  return event_count;
end;
$$;

revoke all on function app.delete_workspace(uuid) from public, anon;
grant execute on function app.delete_workspace(uuid) to authenticated;

create or replace function public.delete_workspace(workspace_id uuid)
returns integer
language sql
security invoker
set search_path = public, app
as $$
  select app.delete_workspace(workspace_id);
$$;

revoke all on function public.delete_workspace(uuid) from public, anon;
grant execute on function public.delete_workspace(uuid) to authenticated;

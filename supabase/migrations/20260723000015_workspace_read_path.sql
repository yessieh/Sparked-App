-- ============================================================================
-- 0015 — Workspace read path: member-scoped stats RPC + created_by privacy.
-- Feeds the Me hub + Workspace screens (UI is a later prompt). No new counters,
-- no new columns — every number is computed from existing rows.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- PART A — workspaces.created_by privacy (folded in from the stats-job QA).
--
-- workspaces held TABLE-level SELECT for anon + authenticated (0002), so every
-- column was readable — including `created_by`, which is a `profiles.id` and
-- therefore an `auth.users.id`. That mapped every organizer to a real user
-- UUID for any anonymous caller (verified live on the seed + a test workspace).
--
-- The Organizer Profile is deliberately PUBLIC (`workspaces_select_public`
-- using(true)), so RLS can't hide ONE column of an otherwise-public row —
-- per-column grants are the only mechanism, exactly as with
-- events.publish_fee_cents in 0011. Revoke the table grant FIRST (a bare column
-- revoke is a no-op while a table grant stands — a table grant implies all
-- columns and outranks it), then re-grant every column EXCEPT created_by.
-- Ownership already lives in `memberships` (own-rows RLS), which is where the
-- app reads it — nothing consumer-side reads workspaces.created_by (the feed
-- and detail RPCs only derive organizer_name from w.name; the client only ever
-- WRITES created_by, in the silent-create path).
--
-- Deliberate fail-closed consequence: a future workspaces column is unreadable
-- by clients until it is granted here. INSERT/UPDATE/DELETE (0002) are left
-- untouched, so created_by stays INSERTABLE (the silent-create path writes it
-- and the insert policy checks `created_by = auth.uid()`) — just not readable.
-- ---------------------------------------------------------------------------
revoke select on public.workspaces from anon;
grant select (
  id, name, bio, location_text, website, socials, logo_path, created_at, updated_at
) on public.workspaces to anon;

revoke select on public.workspaces from authenticated;
grant select (
  id, name, bio, location_text, website, socials, logo_path, created_at, updated_at
) on public.workspaces to authenticated;

-- ---------------------------------------------------------------------------
-- PART B — workspace_stats: four member-scoped numbers, computed server-side.
--
-- DEFINER is not a preference, it is the only thing that works: `saves` and
-- `rsvps` are own-rows RLS (a caller sees only their OWN engagement), so a
-- workspace-wide total is impossible without bypassing RLS. Membership is
-- therefore re-checked BY HAND (definer bypasses RLS) — a non-member gets ZERO
-- rows, never an error, matching curbside_posts_used and the fee reader.
--
-- Definer body in `app` (a schema the Data API does not expose, so the advisor
-- never lints it), thin INVOKER wrapper in `public` — the 0008/0012/0014
-- convention, so this adds no advisor lint.
--
-- The four numbers:
--   active_listings — published AND not yet ended (coalesce(ends_at,starts_at)).
--   upcoming_events — published AND not yet started (starts_at in the future).
--   total_rsvps     — every rsvp on any event this workspace owns.
--   total_saves     — every save on any event this workspace owns.
-- All derived from events.status / starts_at / ends_at and the rsvps / saves
-- rows — no stored counter is read or added.
-- ---------------------------------------------------------------------------
create or replace function app.workspace_stats(p_workspace_id uuid)
returns table (
  active_listings integer,
  upcoming_events integer,
  total_rsvps integer,
  total_saves integer
)
language sql
stable
security definer
set search_path = public, app
as $$
  select
    (select count(*)::int from public.events e
       where e.workspace_id = p_workspace_id
         and e.deleted_at is null
         and e.archived_at is null
         and e.status = 'published'
         and coalesce(e.ends_at, e.starts_at) >= now())      as active_listings,
    (select count(*)::int from public.events e
       where e.workspace_id = p_workspace_id
         and e.deleted_at is null
         and e.archived_at is null
         and e.status = 'published'
         and e.starts_at > now())                            as upcoming_events,
    (select count(*)::int from public.rsvps r
       join public.events e on e.id = r.event_id
       where e.workspace_id = p_workspace_id
         and e.deleted_at is null)                           as total_rsvps,
    (select count(*)::int from public.saves s
       join public.events e on e.id = s.event_id
       where e.workspace_id = p_workspace_id
         and e.deleted_at is null)                           as total_saves
  where app.is_member(p_workspace_id, array['owner', 'editor', 'viewer']);
$$;

revoke all on function app.workspace_stats(uuid) from public, anon;
grant execute on function app.workspace_stats(uuid) to authenticated;

-- Public wrapper — INVOKER, so the API surface carries no definer lint. The
-- parameter name `workspace_id` is load-bearing: PostgREST calls RPCs by NAME
-- and the hook sends `{ workspace_id }`. Non-members get an empty result set.
create or replace function public.workspace_stats(workspace_id uuid)
returns table (
  active_listings integer,
  upcoming_events integer,
  total_rsvps integer,
  total_saves integer
)
language sql
stable
security invoker
set search_path = public, app
as $$
  select * from app.workspace_stats(workspace_id);
$$;

revoke all on function public.workspace_stats(uuid) from public, anon;
grant execute on function public.workspace_stats(uuid) to authenticated;

-- `saves` had no event-keyed index (0006: "all reads are user-keyed"); the
-- total_saves count above is the first event-keyed read of it. Mirror
-- rsvps_event_id_idx so the dashboard query doesn't seq-scan as saves grows.
-- Index only — not a counter, not a column.
create index if not exists saves_event_id_idx on public.saves (event_id);

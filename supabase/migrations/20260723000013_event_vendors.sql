-- ============================================================================
-- 0013 — event_vendors (SCHEMA_PLAN §6.3, the Plus tier's site-map/vendor-pins
-- feature). Pulled forward from the never-applied 0003_host_content batch, the
-- same way 0008 (curbside quota) and 0009 (attribution) were, because the paid
-- wizard's final Create-Event session ships the section now.
--
-- SCOPE (matches the build): vendors are EVENT-OWNED structured rows — never
-- user accounts/profiles. Pins are RELATIVE coordinates on the site-map image
-- (0..1 x/y), NOT geography — the map is a diagram, not a location map, so no
-- PostGIS here. logo_path is reserved for the real-uploads stage (stage 5); the
-- image itself is a placeholder for now (same pattern as event photos), so no
-- storage bucket lands with this migration.
--
-- The site-map IMAGE is not persisted (ephemeral placeholder). The consumer
-- section's visibility is therefore driven by "tier = plus AND >=1 vendor"
-- (ruled 2026-07-23) — an empty map has no pins to show. event_photos
-- (kind='site_map') stays deferred to the real-uploads stage.
--
-- RLS mirrors event_categories (0001 §3.5) exactly: a child of events, publicly
-- readable whenever its parent event is publicly visible, writable only by
-- members of the parent's workspace (owner/editor). Grants are least-privilege,
-- matching the 0002 posture. No SECURITY DEFINER function is added (membership
-- goes through the existing app.is_member helper), so the advisor baseline
-- (0 errors / 3 accepted warnings) is unchanged.
-- ============================================================================

create table public.event_vendors (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null,
  vendor_type text,
  logo_path text,
  -- Relative 0..1 position on the site-map image; null = placed but unpinned.
  pin_x real check (pin_x is null or (pin_x >= 0 and pin_x <= 1)),
  pin_y real check (pin_y is null or (pin_y >= 0 and pin_y <= 1)),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Child lookup is always by event (detail read, wizard re-save delete).
create index event_vendors_event_idx on public.event_vendors (event_id);

-- ---------------------------------------------------------------------------
-- RLS — identical shape to event_categories: parent-visibility for reads,
-- parent-workspace membership for writes (via the definer app.is_member helper,
-- so no policy recursion into events).
-- ---------------------------------------------------------------------------
alter table public.event_vendors enable row level security;

create policy event_vendors_select_public on public.event_vendors
  for select using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and (
          e.status in ('published', 'cancelled')
          or app.is_member(e.workspace_id, array['owner', 'editor', 'viewer'])
        )
    )
  );
create policy event_vendors_insert_members on public.event_vendors
  for insert to authenticated
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and app.is_member(e.workspace_id, array['owner', 'editor'])
    )
  );
create policy event_vendors_update_members on public.event_vendors
  for update to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and app.is_member(e.workspace_id, array['owner', 'editor'])
    )
  )
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and app.is_member(e.workspace_id, array['owner', 'editor'])
    )
  );
create policy event_vendors_delete_members on public.event_vendors
  for delete to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and app.is_member(e.workspace_id, array['owner', 'editor'])
    )
  );

-- Least-privilege grants (0002 posture): anon reads (anonymous browse), the
-- owning member writes. RLS is the row-level enforcement layer.
grant select on public.event_vendors to anon;
grant select, insert, update, delete on public.event_vendors to authenticated;

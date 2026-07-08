-- ============================================================================
-- 0003 — relocate PostGIS out of the public schema.
-- The bare `create extension postgis` in 0001 installed it into public, where
-- spatial_ref_sys (owned by supabase_admin) inherited blanket default
-- privileges: anon had full DML on it through the Data API, and we lack the
-- ownership to enable RLS or revoke. Standard fix: PostGIS lives in the
-- `extensions` schema, which PostgREST does not expose. PostGIS is
-- non-relocatable, so this is a drop + recreate — free while events is empty
-- and events.location is the only dependent object.
--
-- NOTE for future migrations: SQL functions that call PostGIS (e.g. the feed
-- RPC) must include `extensions` in their search_path:
--   set search_path = public, extensions
-- ============================================================================

alter table public.events drop column location; -- also drops events_location_gix

drop extension postgis;

create extension postgis with schema extensions;

alter table public.events
  add column location extensions.geography(point, 4326);

create index events_location_gix on public.events using gist (location);

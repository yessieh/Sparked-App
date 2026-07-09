-- ============================================================================
-- 0005 — the anonymous feed RPC.
-- Returns published events within radius_miles of the origin, with
-- PostGIS-COMPUTED distance (never stored), ordered by distance ASC and
-- NOTHING else — distance-pure is the locked brand promise. Strictly
-- in-radius (radius-overflow is a separate, search-only feature; not here).
-- SECURITY INVOKER: runs as the caller, so events RLS applies on top of the
-- explicit status filter. search_path includes extensions per SCHEMA_PLAN
-- §3.0 (PostGIS lives there).
-- ============================================================================

create or replace function public.events_within_radius(
  origin_lat double precision,
  origin_lng double precision,
  radius_miles double precision
)
returns table (
  id uuid,
  title text,
  organizer_name text,
  tier_id text,
  starts_at timestamptz,
  ends_at timestamptz,
  venue_name text,
  entry_fee_cents integer,
  rsvp_count integer,
  categories text[],
  distance_miles double precision
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  with origin as (
    select st_setsrid(st_makepoint(origin_lng, origin_lat), 4326)::geography as pt
  )
  select
    e.id,
    e.title,
    w.name as organizer_name, -- derived from the workspace, never stored on the event
    e.tier_id,
    e.starts_at,
    e.ends_at,
    e.venue_name,
    e.entry_fee_cents,
    e.rsvp_count,
    (
      select array_agg(ec.category_id order by c.sort_order)
      from public.event_categories ec
      join public.categories c on c.id = ec.category_id
      where ec.event_id = e.id
    ) as categories,
    st_distance(e.location, o.pt) / 1609.344 as distance_miles
  from public.events e
  join public.workspaces w on w.id = e.workspace_id
  cross join origin o
  where e.status = 'published'
    and e.location is not null
    and st_dwithin(e.location, o.pt, radius_miles * 1609.344)
  order by st_distance(e.location, o.pt) asc; -- distance ONLY, no other factors
$$;

grant execute on function public.events_within_radius(double precision, double precision, double precision)
  to anon, authenticated;

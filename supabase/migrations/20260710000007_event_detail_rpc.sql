-- ============================================================================
-- 0007 — single-event read for the Event Detail screen.
-- Same posture as the feed RPC (0005): SECURITY INVOKER so events RLS applies
-- (anon sees published/cancelled; members additionally see their drafts),
-- PostGIS-computed distance (never stored), organizer name derived from the
-- workspace (SCHEMA LOCK 3), consumer-facing columns only — no publish_fee.
-- ============================================================================

create or replace function public.event_detail(
  event_id uuid,
  origin_lat double precision,
  origin_lng double precision
)
returns table (
  id uuid,
  title text,
  description text,
  organizer_name text,
  tier_id text,
  status text,
  starts_at timestamptz,
  ends_at timestamptz,
  venue_name text,
  address text,
  entry_fee_cents integer,
  rsvp_count integer,
  categories text[],
  distance_miles double precision,
  cancelled_at timestamptz
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    e.id,
    e.title,
    e.description,
    w.name as organizer_name,
    e.tier_id,
    e.status,
    e.starts_at,
    e.ends_at,
    e.venue_name,
    e.address,
    e.entry_fee_cents,
    e.rsvp_count,
    (
      select array_agg(ec.category_id order by c.sort_order)
      from public.event_categories ec
      join public.categories c on c.id = ec.category_id
      where ec.event_id = e.id
    ) as categories,
    case
      when e.location is null then null
      else st_distance(
        e.location,
        st_setsrid(st_makepoint(origin_lng, origin_lat), 4326)::geography
      ) / 1609.344
    end as distance_miles,
    e.cancelled_at
  from public.events e
  join public.workspaces w on w.id = e.workspace_id
  where e.id = event_detail.event_id;
$$;

grant execute on function public.event_detail(uuid, double precision, double precision)
  to anon, authenticated;

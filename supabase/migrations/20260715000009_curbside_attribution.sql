-- ============================================================================
-- 0009 — Curbside attribution: display-only anonymity.
-- Ruling (2026-07-15): curbside posts show "Posted by {first name} ·
-- community member" on the detail ticket; the poster may flip "Post without
-- my name", after which public surfaces read "Posted by a verified neighbor".
-- DISPLAY ONLY: the row stays fully attributed to the workspace internally —
-- quota, moderation, and reports are untouched. The read RPCs mask
-- organizer_name server-side so the name never reaches an anonymized
-- surface. Known limit (accepted): the events.workspace_id -> workspaces
-- join remains API-visible; column-level privacy is a later hardening.
-- ============================================================================

alter table public.events
  add column curbside_anonymous boolean not null default false;

-- Feed RPC (0005) — organizer_name masked when the poster opted out.
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
    case when e.curbside_anonymous then null else w.name end as organizer_name,
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

-- Detail RPC (0007) — same mask, plus the tier drives the client's
-- attribution layout (curbside row vs full ORGANIZER block).
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
    case when e.curbside_anonymous then null else w.name end as organizer_name,
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

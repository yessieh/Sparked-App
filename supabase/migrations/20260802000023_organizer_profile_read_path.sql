-- ============================================================================
-- 0023 — Public Organizer Profile read path.
--
-- The anonymous-browse backlink target: one anon-callable RPC returning a
-- workspace's public fields plus its published events split upcoming / past,
-- and the `workspace_id` Event Detail needs in order to link here at all.
--
-- UI is a later prompt. This is the server side only.
--
-- ---------------------------------------------------------------------------
-- THE PATTERN THIS IS THE SECOND INSTANCE OF, stated once so the third one does
-- not have to rediscover it:
--
--   A PUBLIC SURFACE MUST NOT INHERIT `events_select_public`. It has to filter
--   `deleted_at is null and archived_at is null` for itself.
--
-- The policy has three branches and two of them are wrong for a storefront:
--   * the MEMBER branch would show a host their own archived events on their
--     own public page;
--   * the 0022 ATTENDEE-HISTORY branch would resurface an archived or deleted
--     event to any visitor who happens to have saved it — the history exception
--     leaking onto a public surface, which is exactly what it must never do.
--
-- `events_within_radius` learned this in 0020. The organizer profile learns it
-- here. Any future public read of `events` starts from the same assumption:
-- RLS is the floor, not the filter.
--
-- ---------------------------------------------------------------------------
-- ANONYMITY (0009) IS ENFORCED TWICE HERE, IN TWO DIRECTIONS:
--
--   1. `event_detail` returns NULL for `workspace_id` on a `curbside_anonymous`
--      row. Handing back the id would make the mask a formality — anyone could
--      follow it straight to the profile that posted the "anonymous" listing.
--      The client is not trusted to withhold it; the database never sends it.
--
--   2. **The profile EXCLUDES `curbside_anonymous` events entirely** (both
--      sections). This one was not in the brief and is the same bypass running
--      the other way: listing an anonymous post under the organizer's name and
--      logo deanonymizes it just as completely as leaking the id would. 0009
--      says the row stays "fully attributed to the workspace INTERNALLY" —
--      internally is the operative word. Flagged for review; reversing it means
--      accepting that "post without my name" does not survive someone opening
--      the poster's profile.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- PART A — app.organizer_profile: the definer body.
--
-- SHAPE: scalar workspace columns + two jsonb arrays, deliberately. A
-- `returns table` of events would yield ZERO rows for a workspace with no
-- published events, leaving the client unable to tell "new organizer" from "no
-- such workspace". This returns exactly one row for a real workspace and zero
-- rows for a bad id, so absence means 404 and nothing else.
--
-- DEFINER for the usual reason (0008 → 0012 → 0015 → 0017 → 0022): the body
-- reads `events` and `workspaces` past RLS, so the filters below ARE the
-- visibility rule and have to be complete on their own.
--
-- NEVER `publish_fee_cents`. Consumer-facing data only — the locked EventStub
-- rule. The fee has its own member-scoped reader (0012) and no business on a
-- public page.
--
-- `status = 'published'` only, matching `events_within_radius`. Cancelled
-- events are deliberately absent: Cancel is not built, and a cancelled listing
-- needs a greyed treatment this surface does not have yet.
--
-- ENDED is `coalesce(ends_at, starts_at + interval '3 hours') < now()`, the
-- same expression 0022's policy branch uses and the same rule `eventCountdown`
-- applies on the client. Three places, one definition; they must not drift.
-- ---------------------------------------------------------------------------
create or replace function app.organizer_profile(p_workspace_id uuid)
returns table (
  id uuid,
  name text,
  bio text,
  location_text text,
  website text,
  socials jsonb,
  logo_path text,
  upcoming jsonb,
  past jsonb
)
language sql
stable
security definer
set search_path = public, app
as $$
  with visible as (
    select
      e.id,
      e.title,
      e.tier_id,
      e.starts_at,
      e.ends_at,
      e.venue_name,
      e.entry_fee_cents,
      e.rsvp_count,
      (
        select coalesce(array_agg(ec.category_id order by c.sort_order), array[]::text[])
        from public.event_categories ec
        join public.categories c on c.id = ec.category_id
        where ec.event_id = e.id
      ) as categories,
      coalesce(e.ends_at, e.starts_at + interval '3 hours') < now() as ended
    from public.events e
    where e.workspace_id = p_workspace_id
      -- The explicit lifecycle filter. See the header: NOT inherited from RLS.
      and e.deleted_at is null
      and e.archived_at is null
      and e.status = 'published'
      -- 0009 mask, second direction: an anonymous post must not be findable by
      -- opening the profile of the person who posted it.
      and not e.curbside_anonymous
  )
  select
    w.id,
    w.name,
    w.bio,
    w.location_text,
    w.website,
    w.socials,
    w.logo_path,
    -- UNCAPPED on purpose: you cannot have many events still ahead of you, and
    -- truncating the future would hide the one thing a visitor came to find.
    coalesce((
      select jsonb_agg(to_jsonb(v) - 'ended' order by v.starts_at asc)
      from visible v
      where not v.ended
    ), '[]'::jsonb) as upcoming,
    -- CAPPED at 50, most-recent-first: this is an anon-callable endpoint and an
    -- unbounded array on one is a payload nobody is holding the other end of.
    -- 50 is far above any realistic MVP organizer and the section is collapsed
    -- by default anyway; real pagination can arrive if the number ever does.
    coalesce((
      select jsonb_agg(t.row order by t.starts_at desc)
      from (
        select to_jsonb(v) - 'ended' as row, v.starts_at
        from visible v
        where v.ended
        order by v.starts_at desc
        limit 50
      ) t
    ), '[]'::jsonb) as past
  from public.workspaces w
  where w.id = p_workspace_id;
$$;

-- ANON-CALLABLE, unlike the member-scoped definers that revoke from anon. This
-- is the whole point of the surface: an anonymous visitor following a backlink.
revoke all on function app.organizer_profile(uuid) from public;
grant execute on function app.organizer_profile(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- PART B — the public wrapper. INVOKER, so the API surface carries no definer
-- lint. Its body touches NO tables, only the definer above, so there is no
-- caller-column-privilege exposure of the kind that took the storefront down in
-- 0021. The parameter name is load-bearing: PostgREST calls RPCs by NAME.
-- ---------------------------------------------------------------------------
create or replace function public.organizer_profile(workspace_id uuid)
returns table (
  id uuid,
  name text,
  bio text,
  location_text text,
  website text,
  socials jsonb,
  logo_path text,
  upcoming jsonb,
  past jsonb
)
language sql
stable
security invoker
set search_path = public, app
as $$
  select * from app.organizer_profile(workspace_id);
$$;

revoke all on function public.organizer_profile(uuid) from public;
grant execute on function public.organizer_profile(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- PART C — event_detail gains `workspace_id`.
--
-- DROP + CREATE, not CREATE OR REPLACE: Postgres will not let you change a
-- function's return type in place, and adding an OUT column is a return-type
-- change. Both statements run inside this migration's single transaction, so
-- no other session ever observes the function missing.
--
-- The real window is PostgREST's schema cache: until it reloads it does not
-- know the new column exists. The ARGUMENT list is unchanged, so calls keep
-- routing correctly throughout — the only symptom is `workspace_id` absent from
-- the response for a moment. `notify pgrst` at the end of this file closes it;
-- in practice it is sub-second and no client is asking for the column yet.
--
-- Grants: dropping a function drops its privileges, so they are re-stated
-- below. The original relied on the PUBLIC default; the explicit grants keep
-- behavior identical and make it legible.
--
-- COLUMN-PRIVILEGE AUDIT (this function is INVOKER, so every column its body
-- touches is checked against the CALLER's grants — the 0021 lesson):
--   e.workspace_id       — anon ✓ (0011 grant list)
--   e.curbside_anonymous — anon ✓ (0011)
--   e.deleted_at         — anon ✓ (0021)
--   all other e.*        — anon ✓ (0011)
--   w.name, w.id         — anon ✓ (0015)
--   event_categories, categories — table-level select to anon ✓ (0002)
-- Nothing new is referenced that anon cannot read.
-- ---------------------------------------------------------------------------
drop function if exists public.event_detail(uuid, double precision, double precision);

create function public.event_detail(
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
  cancelled_at timestamptz,
  workspace_id uuid
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
    e.cancelled_at,
    -- THE ANONYMITY GUARD. Suppressed at the data layer, not by the client:
    -- a masked organizer_name beside a usable workspace_id would be no mask at
    -- all. Deliberately mirrors the organizer_name expression one line-for-one
    -- so the two can never diverge.
    case when e.curbside_anonymous then null else e.workspace_id end as workspace_id
  from public.events e
  join public.workspaces w on w.id = e.workspace_id
  where e.deleted_at is null
    and e.id = event_detail.event_id;
$$;

grant execute on function public.event_detail(uuid, double precision, double precision)
  to anon, authenticated;

-- Tell PostgREST about the new OUT column immediately rather than waiting for
-- its periodic refresh.
notify pgrst, 'reload schema';

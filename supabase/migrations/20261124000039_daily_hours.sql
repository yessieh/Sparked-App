-- ============================================================================
-- 0039 — Daily hours: events.hours, its validation, and the read paths.
--
-- WHAT THIS DOES — and nothing else:
--     alter table public.events add column hours jsonb (NULL, no default)
--     create        app.validate_event_hours()           (trigger function)
--     create trigger events_validate_hours on public.events
--     grant select, insert, update (hours) on public.events to authenticated
--     drop + create app/public.events_within_radius      (5 args; +1 OUT column)
--     drop + create app/public.event_detail              (+1 OUT column)
--     create or replace app.organizer_profile            (OUT columns unchanged)
--     create or replace app.export_my_data               (return type unchanged)
--     notify pgrst
-- Not touched: every policy, app.enforce_curbside_span and its trigger,
-- app.curbside_expired, app.duration_band (NO pricing change), the
-- public.organizer_profile and public.export_my_data wrappers.
--
-- ---------------------------------------------------------------------------
-- INTENT (locked by Jas, 2026-11-24).
--
-- starts_at / ends_at stay the overall span: first opening → last closing. All
-- "ended" logic keeps reading the span, unchanged. hours adds the open windows
-- inside it. hours NULL = open the whole span, which is every existing row.
--
-- EXPLORE RULE: an event WITH hours is returned only if at least one window
-- overlaps the feed window: closes_at >= window_from AND opens_at <=
-- window_to. An event without hours keeps 0031's test, character for
-- character. Search uses the same RPC, so it follows the same rule.
--
-- ---------------------------------------------------------------------------
-- THE SHAPE. A jsonb array of 1 to 31 objects, each holding exactly two
-- strings: {"opens_at": "...", "closes_at": "..."}. Each is an ISO timestamp
-- with an EXPLICIT zone (Z or +hh:mm). A zone-less value would mean whatever
-- the reading session's time zone is, and words Postgres also accepts ('now',
-- 'tomorrow', 'infinity') would be re-read later with a different meaning.
-- Extra keys are refused: this value is served to anonymous visitors.
--
-- NAMED ERRORS (all errcode 23514), checked in this order:
--     hours_malformed         not an array, empty, wrong keys or types, or a
--                             value that is not a valid zoned timestamp
--     hours_too_many          more than 31 windows
--     hours_window_order      opens_at >= closes_at
--     hours_window_too_long   a window longer than 24 hours
--     hours_not_sorted        a window opens before the previous one opens
--     hours_overlap           a window opens before the previous one closes
--                             (touching, close = next open, is allowed)
--     hours_span_mismatch     first opens_at <> starts_at, or last
--                             closes_at <> ends_at (NULL ends_at included)
-- hours NULL skips every check. Windows past midnight are ordinary instants.
--
-- BEFORE INSERT OR UPDATE OF hours, starts_at, ends_at: moving the span of an
-- event with hours without moving its hours is refused. BEFORE, so a refused
-- Curbside post never reaches the AFTER trigger that spends the free credit
-- (0019's events_curbside_consume).
--
-- WHY A TRIGGER AND NOT A CHECK. UNVERIFIED (Postgres): the arc prompt says a
-- CHECK cannot hold a text→timestamptz cast because it is not immutable.
-- Postgres documents immutability as an ASSUMPTION for CHECK, not something it
-- enforces (it enforces it for indexes and generated columns). What a CHECK
-- cannot hold is the SUBQUERY these rules need to walk the array, and it could
-- not raise one named error per rule. The trigger stands either way; QA steps
-- 2a and 2b test both claims.
--
-- UNVERIFIED (Postgres): firing a trigger does not need EXECUTE on its
-- function (checked when the trigger is created). So PUBLIC is revoked from
-- app.validate_event_hours; QA 2q and 2aa insert as authenticated, with it
-- firing.
-- UNVERIFIED (PostgREST): a JSON null sent for hours arrives as SQL NULL, not
-- as the jsonb value null (which would be refused as hours_malformed). QA 2c
-- tests the Postgres record conversion; the HTTP path is checked in the forms
-- stage.
--
-- ---------------------------------------------------------------------------
-- READ PATHS. Feed pair from 0036 PARTs B/C, event_detail pair from 0035 PARTs
-- D/E, organizer_profile from 0036 PART D, export_my_data from 0038 PART A:
-- still the latest definitions (no later migration names them). Generated from
-- those files by script; the only differences are the lines named at each part.
--
-- Adding an OUT column changes a return type, so the feed and event_detail
-- pairs are dropped and recreated (wrapper first). organizer_profile builds
-- its events with to_jsonb over a CTE, and export_my_data returns jsonb, so
-- both are legal replaces and keep their ACLs. format_version stays 1: the
-- export gains a key and loses nothing.
--
-- A drop resets an ACL, and CREATE can mint EXECUTE to PUBLIC, so each
-- recreated function is revoked from public and granted to the roles it had
-- (baseline 2026-11-23-post-data-export, Section 4): anon + authenticated.
--
-- CLIENT SAFETY: the feed and detail callers read rows by name
-- ((explore)/index.tsx, ExploreSearch.tsx, event/[id].tsx); an extra key is
-- inert until the display stage.
--
-- ---------------------------------------------------------------------------
-- GRANT SURFACE (CLAUDE.md, "Standing grant check"):
--   public.events.hours
--       authenticated  GAINS SELECT — CONSUMED BY the direct reads in Saved
--                      (saved.tsx), Workspace (workspace.tsx) and Me (me.tsx)
--       authenticated  GAINS INSERT — CONSUMED BY the wizard's draft insert
--                      (create/event.tsx) and the Curbside post
--                      (create/curbside.tsx)
--       authenticated  GAINS UPDATE — CONSUMED BY the wizard's re-entry update
--                      of its unpaid draft (create/event.tsx)
--       anon           nothing: every anon path is a definer RPC
--     Rows are unchanged: events' existing policies decide which rows. As with
--     starts_at / ends_at, a member can also UPDATE hours on a published event
--     through the API; the validation applies there too.
--   app.validate_event_hours()
--       PUBLIC, anon, authenticated  nothing (revoked); postgres keeps EXECUTE
--   app/public.events_within_radius, app/public.event_detail
--       anon, authenticated EXECUTE, as before; PUBLIC revoked
--   app.organizer_profile, app.export_my_data
--       ACL preserved by the replace; nothing reissued
--
-- ---------------------------------------------------------------------------
-- PRE-APPLY CHECK (the STOP condition): the live bodies, with any CR removed,
-- must hash to the committed ones:
--     app.events_within_radius     1dd10878083e967e610432eb6e92dc15 (1547 chars)
--     public.events_within_radius  ad585dad44115e5305dc139a2c5ba90b (113 chars)
--     app.event_detail             01a2f5fe00f3249e88c2333ee73eea03 (2228 chars)
--     public.event_detail          7c4969aebd532a9ac291452adc95dc0f (69 chars)
--     app.organizer_profile        1e84c56bb0c9392d25067d30386680d0 (2263 chars)
--     app.export_my_data           fc6f5374a2e69b5053d7770b6d9f3c9b (4762 chars)
-- and events.hours, app.validate_event_hours() and the trigger must not exist.
--
-- ---------------------------------------------------------------------------
-- EXPECTED POST-ARC DELTA (against a pre-arc baseline taken with the current
-- supabase/audits/privilege_audit.sql):
--   1. TABLE- AND COLUMN-LEVEL GRANTS — +3 rows, 1A 121 → 124:
--      public | events | column | hours | authenticated | INSERT / SELECT / UPDATE
--   2. RLS — no change.   3. VIEWS AND MATVIEWS — no change (0 rows).
--   4. FUNCTIONS — +1 row, 45 → 46:
--      app | validate_event_hours | (no args) | false | postgres |
--      search_path=pg_catalog | postgres:EXECUTE
--      The six functions recreated or replaced read exactly as before (OUT
--      columns are not shown by this section).
--   5. DEFAULT PRIVILEGES — no change (5A 268).
--   6, 7, 8 — no change.
-- Invisible to the audit: the trigger and the column itself (QA Section 1).
-- Any other row that moves is unexplained and blocks the commit.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- PART A — the column.
-- ---------------------------------------------------------------------------
alter table public.events
  add column hours jsonb;

comment on column public.events.hours is
  'Open windows inside starts_at..ends_at: jsonb array of {opens_at, closes_at}. NULL = open the whole span. Validated by events_validate_hours (0039).';

-- GRANT: authenticated SELECT, INSERT, UPDATE (hours). Consumers: header.
grant select (hours), insert (hours), update (hours) on public.events to authenticated;


-- ---------------------------------------------------------------------------
-- PART B — validation. SECURITY INVOKER: it reads only NEW, no table.
-- ---------------------------------------------------------------------------
create function app.validate_event_hours()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
declare
  iso constant text :=
    '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}(:[0-9]{2}([.][0-9]{1,6})?)?(Z|[+-][0-9]{2}:[0-9]{2})$';
  item        jsonb;
  opens       timestamptz;
  closes      timestamptz;
  prev_opens  timestamptz;
  prev_closes timestamptz;
  first_opens timestamptz;
begin
  if new.hours is null then
    return new;
  end if;

  if jsonb_typeof(new.hours) <> 'array' then
    raise exception 'hours_malformed' using errcode = '23514';
  end if;
  if jsonb_array_length(new.hours) = 0 then
    raise exception 'hours_malformed' using errcode = '23514';
  end if;
  if jsonb_array_length(new.hours) > 31 then
    raise exception 'hours_too_many' using errcode = '23514';
  end if;

  for item in
    select t.value
    from jsonb_array_elements(new.hours) with ordinality as t(value, n)
    order by t.n
  loop
    if jsonb_typeof(item) <> 'object' then
      raise exception 'hours_malformed' using errcode = '23514';
    end if;
    if jsonb_typeof(item -> 'opens_at') is distinct from 'string'
       or jsonb_typeof(item -> 'closes_at') is distinct from 'string'
       or (item - 'opens_at' - 'closes_at') <> '{}'::jsonb
       or (item ->> 'opens_at') !~ iso
       or (item ->> 'closes_at') !~ iso then
      raise exception 'hours_malformed' using errcode = '23514';
    end if;

    -- The pattern admits impossible dates (2026-02-30T25:00Z); the cast does
    -- not. Any failure here means the same thing to the caller.
    begin
      opens  := (item ->> 'opens_at')::timestamptz;
      closes := (item ->> 'closes_at')::timestamptz;
    exception when others then
      raise exception 'hours_malformed' using errcode = '23514';
    end;

    if opens >= closes then
      raise exception 'hours_window_order' using errcode = '23514';
    end if;
    if closes - opens > interval '24 hours' then
      raise exception 'hours_window_too_long' using errcode = '23514';
    end if;

    if first_opens is null then
      first_opens := opens;
    else
      if opens < prev_opens then
        raise exception 'hours_not_sorted' using errcode = '23514';
      end if;
      if opens < prev_closes then
        raise exception 'hours_overlap' using errcode = '23514';
      end if;
    end if;
    prev_opens  := opens;
    prev_closes := closes;
  end loop;

  if first_opens is distinct from new.starts_at
     or prev_closes is distinct from new.ends_at then
    raise exception 'hours_span_mismatch' using errcode = '23514';
  end if;

  return new;
end;
$$;

-- GRANT: nobody but the owner. CONSUMED BY: the trigger below.
revoke all on function app.validate_event_hours() from public, anon, authenticated;

create trigger events_validate_hours
  before insert or update of hours, starts_at, ends_at on public.events
  for each row execute function app.validate_event_hours();


-- ---------------------------------------------------------------------------
-- PART C — drop the two pairs. Wrappers first: they call the definers.
-- ---------------------------------------------------------------------------
drop function public.events_within_radius(
  double precision, double precision, double precision, timestamptz, timestamptz
);
drop function app.events_within_radius(
  double precision, double precision, double precision, timestamptz, timestamptz
);
drop function public.event_detail(uuid, double precision, double precision);
drop function app.event_detail(uuid, double precision, double precision);


-- ---------------------------------------------------------------------------
-- PART D — app.events_within_radius. From 0036 PART B. Changes: `hours jsonb`
-- in the OUT list, `e.hours` in the SELECT list, and the two window-test
-- lines wrapped in the Explore rule's CASE.
-- ---------------------------------------------------------------------------
create function app.events_within_radius(
  p_origin_lat double precision,
  p_origin_lng double precision,
  p_radius_miles double precision,
  p_from timestamptz,
  p_to timestamptz
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
  distance_miles double precision,
  location_approximate boolean,
  hours jsonb
)
language sql
stable
security definer
set search_path = public, app, extensions
as $$
  with origin as (
    select st_setsrid(st_makepoint(p_origin_lng, p_origin_lat), 4326)::geography as pt
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
    st_distance(e.location, o.pt) / 1609.344 as distance_miles,
    e.location_approximate,
    e.hours
  from public.events e
  join public.workspaces w on w.id = e.workspace_id
  cross join origin o
  where e.deleted_at is null
    and e.archived_at is null
    and e.status = 'published'
    and e.location is not null
    -- 0030: an ended Curbside post leaves the feed and the widened search read.
    and not app.curbside_expired(e.tier_id, e.starts_at, e.ends_at)
    -- 0031: INTERVAL OVERLAP. An event is in the window when it has not ended
    -- before the window opens and has not started after the window closes.
    -- NOT `starts_at >= p_from` — that drops a multi-day event still running,
    -- which is the one row a live feed most wants. See the header.
    -- 0039: an event WITH hours is in the window only if one of its OPEN
    -- windows overlaps it; without hours, 0031's span test is unchanged.
    and case
      when e.hours is null then
        coalesce(e.ends_at, e.starts_at + interval '3 hours') >= p_from
        and e.starts_at <= p_to
      else exists (
        select 1
        from jsonb_array_elements(e.hours) as h(value)
        where (h.value ->> 'closes_at')::timestamptz >= p_from
          and (h.value ->> 'opens_at')::timestamptz <= p_to
      )
    end
    and st_dwithin(e.location, o.pt, p_radius_miles * 1609.344)
  order by st_distance(e.location, o.pt) asc; -- distance ONLY, no other factors
$$;
-- GRANT: anon + authenticated EXECUTE; PUBLIC revoked.
-- CONSUMED BY: public.events_within_radius (PART E), SECURITY INVOKER.
revoke all on function app.events_within_radius(
  double precision, double precision, double precision, timestamptz, timestamptz
) from public;
grant execute on function app.events_within_radius(
  double precision, double precision, double precision, timestamptz, timestamptz
) to anon, authenticated;


-- ---------------------------------------------------------------------------
-- PART E — public.events_within_radius. From 0036 PART C. Change: the OUT
-- column. Argument names are load-bearing (PostgREST routes by name).
-- ---------------------------------------------------------------------------
create function public.events_within_radius(
  origin_lat double precision,
  origin_lng double precision,
  radius_miles double precision,
  window_from timestamptz,
  window_to timestamptz
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
  distance_miles double precision,
  location_approximate boolean,
  hours jsonb
)
language sql
stable
security invoker
set search_path = public, app
as $$
  select * from app.events_within_radius(
    origin_lat, origin_lng, radius_miles, window_from, window_to
  );
$$;
-- GRANT: anon + authenticated EXECUTE; PUBLIC revoked. anon is required.
-- CONSUMED BY: (explore)/index.tsx and ExploreSearch.tsx (Explore browses
-- signed out).
revoke all on function public.events_within_radius(
  double precision, double precision, double precision, timestamptz, timestamptz
) from public;
grant execute on function public.events_within_radius(
  double precision, double precision, double precision, timestamptz, timestamptz
) to anon, authenticated;


-- ---------------------------------------------------------------------------
-- PART F — app.event_detail. From 0035 PART D. Changes: the OUT column and
-- `e.hours` in the SELECT list.
-- ---------------------------------------------------------------------------
create function app.event_detail(
  p_event_id uuid,
  p_origin_lat double precision,
  p_origin_lng double precision
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
  workspace_id uuid,
  location_approximate boolean,
  hours jsonb
)
language sql
stable
security definer
set search_path = public, app, extensions
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
        st_setsrid(st_makepoint(p_origin_lng, p_origin_lat), 4326)::geography
      ) / 1609.344
    end as distance_miles,
    e.cancelled_at,
    -- THE ANONYMITY GUARD. Suppressed at the data layer, not by the client:
    -- a masked organizer_name beside a usable workspace_id would be no mask at
    -- all. Deliberately mirrors the organizer_name expression one line-for-one
    -- so the two can never diverge.
    case when e.curbside_anonymous then null else e.workspace_id end as workspace_id,
    e.location_approximate,
    e.hours
  from public.events e
  join public.workspaces w on w.id = e.workspace_id
  where e.deleted_at is null
    and e.id = p_event_id
    -- events_select_public, transcribed. See the header block above: this body
    -- no longer runs under the policy, so it carries the policy.
    and (
      -- 1. The host and their team. UNTOUCHED — a host opening their own ended
      --    Curbside listing from Workspace still resolves.
      app.is_member(e.workspace_id, array['owner', 'editor', 'viewer'])
      -- 2. The storefront: live listings only.
      or (
        e.archived_at is null
        and e.status in ('published', 'cancelled')
        and not app.curbside_expired(e.tier_id, e.starts_at, e.ends_at)
      )
      -- 3. The attendee's own history, after it ended. Same deliberate
      --    redundancy as PART B branch 3: only the tier half does work here.
      or (
        e.status in ('published', 'cancelled')
        and coalesce(e.ends_at, e.starts_at + interval '3 hours') < now()
        and not app.curbside_expired(e.tier_id, e.starts_at, e.ends_at)
        and app.has_attendance(e.id)
      )
    );
$$;
-- GRANT: anon + authenticated EXECUTE; PUBLIC revoked.
-- CONSUMED BY: public.event_detail (PART G), SECURITY INVOKER.
revoke all on function app.event_detail(uuid, double precision, double precision) from public;
grant execute on function app.event_detail(uuid, double precision, double precision) to anon, authenticated;


-- ---------------------------------------------------------------------------
-- PART G — public.event_detail. From 0035 PART E. Change: the OUT column.
-- ---------------------------------------------------------------------------
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
  workspace_id uuid,
  location_approximate boolean,
  hours jsonb
)
language sql
stable
security invoker
set search_path = public, app
as $$
  select * from app.event_detail(event_id, origin_lat, origin_lng);
$$;
-- GRANT: anon + authenticated EXECUTE; PUBLIC revoked. anon is required.
-- CONSUMED BY: event/[id].tsx, signed in and signed out.
revoke all on function public.event_detail(uuid, double precision, double precision) from public;
grant execute on function public.event_detail(uuid, double precision, double precision) to anon, authenticated;


-- ---------------------------------------------------------------------------
-- PART H — app.organizer_profile: CREATE OR REPLACE, ACL preserved. From 0036
-- PART D. Change: `e.hours` in the `visible` CTE, so every event object in
-- `upcoming` and `past` carries an "hours" key.
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
      e.location_approximate,
      e.hours,
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
      -- 0030: and an ENDED Curbside post is not findable here at all, whether
      -- or not it was anonymous. A different test from the line above it.
      and not app.curbside_expired(e.tier_id, e.starts_at, e.ends_at)
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

-- ---------------------------------------------------------------------------
-- PART I — app.export_my_data: CREATE OR REPLACE, ACL preserved. From 0038
-- PART A. Change: 'hours' on each owned event.
-- ---------------------------------------------------------------------------
create or replace function app.export_my_data()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, app, extensions
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  return jsonb_build_object(
    'meta', jsonb_build_object(
      'format_version', 1,
      'generated_at', now(),
      'user_id', uid
    ),

    'profile', (
      select jsonb_build_object(
        'id', p.id,
        'display_name', p.display_name,
        'avatar_path', p.avatar_path,
        'created_at', p.created_at,
        'updated_at', p.updated_at
      )
      from public.profiles p
      where p.id = uid
    ),

    'saves', coalesce((
      select jsonb_agg(jsonb_build_object(
        'event_id', e.id,
        'title', e.title,
        'starts_at', e.starts_at,
        'ends_at', e.ends_at,
        'saved_at', s.created_at
      ) order by s.created_at)
      from public.saves s
      join public.events e on e.id = s.event_id
      where s.user_id = uid
    ), '[]'::jsonb),

    'rsvps', coalesce((
      select jsonb_agg(jsonb_build_object(
        'event_id', e.id,
        'title', e.title,
        'starts_at', e.starts_at,
        'ends_at', e.ends_at,
        'rsvped_at', r.created_at
      ) order by r.created_at)
      from public.rsvps r
      join public.events e on e.id = r.event_id
      where r.user_id = uid
    ), '[]'::jsonb),

    'category_preferences', coalesce((
      select jsonb_agg(jsonb_build_object(
        'category_id', cp.category_id,
        'label', c.label,
        'stance', cp.stance
      ) order by c.sort_order)
      from public.category_preferences cp
      join public.categories c on c.id = cp.category_id
      where cp.user_id = uid
    ), '[]'::jsonb),

    'memberships', coalesce((
      select jsonb_agg(jsonb_build_object(
        'workspace_id', w.id,
        'workspace_name', w.name,
        'role', m.role,
        'joined_at', m.created_at
      ) order by m.created_at)
      from public.memberships m
      join public.workspaces w on w.id = m.workspace_id
      where m.user_id = uid
    ), '[]'::jsonb),

    'owned_workspaces', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', w.id,
        'name', w.name,
        'bio', w.bio,
        'location_text', w.location_text,
        'website', w.website,
        'socials', w.socials,
        'logo_path', w.logo_path,
        'created_at', w.created_at,
        'updated_at', w.updated_at,
        'events', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', e.id,
            'title', e.title,
            'description', e.description,
            'tier_id', e.tier_id,
            'status', e.status,
            'starts_at', e.starts_at,
            'ends_at', e.ends_at,
            'hours', e.hours,
            'venue_name', e.venue_name,
            'address', e.address,
            'location', case when e.location is null then null else jsonb_build_object(
              'lat', st_y(e.location::geometry),
              'lng', st_x(e.location::geometry)
            ) end,
            'location_approximate', e.location_approximate,
            'entry_fee_cents', e.entry_fee_cents,
            'publish_fee_cents', e.publish_fee_cents,
            'socials', e.socials,
            'rsvp_count', e.rsvp_count,
            'curbside_anonymous', e.curbside_anonymous,
            'cancelled_at', e.cancelled_at,
            'archived_at', e.archived_at,
            'deleted_at', e.deleted_at,
            'created_at', e.created_at,
            'updated_at', e.updated_at,
            'categories', coalesce((
              select jsonb_agg(ec.category_id order by ec.category_id)
              from public.event_categories ec
              where ec.event_id = e.id
            ), '[]'::jsonb),
            'vendors', coalesce((
              select jsonb_agg(jsonb_build_object(
                'name', v.name,
                'vendor_type', v.vendor_type,
                'logo_path', v.logo_path,
                'pin_x', v.pin_x,
                'pin_y', v.pin_y,
                'sort_order', v.sort_order
              ) order by v.sort_order, v.name)
              from public.event_vendors v
              where v.event_id = e.id
            ), '[]'::jsonb)
          ) order by e.starts_at)
          from public.events e
          where e.workspace_id = w.id
        ), '[]'::jsonb)
      ) order by w.created_at)
      from public.workspaces w
      join public.memberships m
        on m.workspace_id = w.id and m.user_id = uid and m.role = 'owner'
    ), '[]'::jsonb),

    'curbside_ledger', coalesce((
      select jsonb_agg(jsonb_build_object(
        'event_id', l.event_id,
        'consumed_at', l.consumed_at
      ) order by l.consumed_at)
      from public.curbside_quota_ledger l
      where l.user_id = uid
    ), '[]'::jsonb)
  );
end;
$$;

notify pgrst, 'reload schema';

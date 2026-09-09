-- ============================================================================
-- 0030 — Curbside history does not survive. Migration 1 of 2 in Arc C.
--
-- THE RULING (SPARKED_STATE.md, "Curbside history does not survive", LOCKED
-- 2026-08-25). An ended CURBSIDE event leaves public reach ENTIRELY at end: the
-- feed, search, the detail page BY DIRECT LINK, and the attendee's Saved ->
-- Past. The host keeps it in Workspace. Anonymity holds through time, not only
-- at the moment of posting.
--
-- THIS AMENDS the attendee-history rule ("what already happened stays in the
-- attendee's record", 0022) for Curbside ONLY. The paid rule is untouched and
-- still governs Standard and Plus exactly as 0022 wrote it, including the
-- archived/deleted exception and its three conditions.
--
-- WHY THE 0022 RULE DOES NOT FIT CURBSIDE. It was written for paid events,
-- where the host is a business operating publicly and an attendee's record of a
-- concert is their own history to keep. Curbside is the opposite case in every
-- particular: a neighbour posting a yard sale, from a home address, under the
-- "Local host" mask 0028/0029 closed at the API layer. An ended Curbside post
-- sitting in a stranger's Saved -> Past is a persistent trace of that
-- neighbour's activity at their home — the same leak that arc closed, displaced
-- in time rather than in surface.
--
-- ---------------------------------------------------------------------------
-- THE ENDED EXPRESSION LIVES IN FIVE PLACES, NOT FOUR:
--   1. events_select_public                 (0022)
--   2. app.organizer_profile                (0023)
--   3. app.event_detail                     (0028)
--   4. eventCountdown                       (lib/eventTime.ts, the client)
--   5. me.tsx:576's client-built `graceISO`  (the "Next saved" PostgREST filter)
--
-- 0028's own comment says FOUR and IS STALE — it predates the me.tsx path. 0028
-- is applied, and CLAUDE.md's immutability rule covers comments as well as
-- code, so it is corrected HERE rather than edited THERE. **This file is the
-- current count**; a reader comparing the two should not assume the older one
-- is authoritative.
--
-- PART A introduces `app.curbside_expired` so this migration does not make that
-- problem worse, and the arithmetic is worth stating because it is larger than
-- it looks. The guard lands at EIGHT call sites across FIVE objects — three of
-- the five carry it in two branches each. The raw ENDED expression appears in
-- FOUR live SQL locations today (both policy branch 3s, app.event_detail's
-- branch 3, and app.organizer_profile's `ended` column). Inlining would have
-- taken that from 4 to 12. One function called eight times takes it to 5, and
-- keeps the Curbside rule greppable as a single thing — which Arc C's second
-- half and the wizard arc both have to reason about.
--
-- ---------------------------------------------------------------------------
-- TWO TRAPS, NAMED SO THEY ARE NOT WALKED INTO LATER:
--
-- 1. BRANCH 1 OF BOTH POLICIES IS DELIBERATELY UNTOUCHED. It is the member
--    branch, and it is the only thing preserving the host's own ended Curbside
--    posts in Workspace — which the ruling explicitly requires. Hoisting the
--    guard ABOVE the three branches is the tidier-looking edit and it would
--    silently delete the retention half of the ruling.
--
-- 2. `curbside_anonymous` IS NOT `tier_id = 'curbside'`. The former is a
--    per-post boolean — the "Post without my name" choice (0009). The latter is
--    the tier. `app.organizer_profile` already filters the former; that filter
--    is NOT this rule and does not cover a Curbside post whose host chose to
--    show their name. Both tests now sit side by side in PART F.
--
-- ---------------------------------------------------------------------------
-- GRANT SURFACE — ONE ADDITION, NAMED WITH ITS CONSUMERS.
--
--   * `app.curbside_expired(text, timestamptz, timestamptz)` is a NEW function.
--     Postgres grants EXECUTE to PUBLIC implicitly on CREATE, so PART A revokes
--     that and grants explicitly to anon + authenticated. CONSUMED BY: both
--     policies in PARTS B and C (an RLS policy expression calling a function
--     requires the CALLER to hold EXECUTE on it — the same reason 0001 granted
--     `app.is_member` and 0022 granted `app.has_attendance`), and the three
--     definer bodies in PARTS D, E and F.
--
--   * NOTHING ELSE. No other object is created or dropped. All three functions
--     below are CREATE OR REPLACE with byte-identical signatures, argument
--     names, return types and volatility, so every existing ACL is PRESERVED —
--     no drop, therefore no reset, therefore no re-grant. No `public.*` wrapper
--     is touched at all.
--
--   * Policies carry no ACL; dropping and recreating one is not a grant event.
--
-- VISIBILITY IS NOT PRIVILEGE, and the post-arc report keeps them apart: anon
-- and authenticated lose read access to ended CURBSIDE ROWS. No role gains or
-- loses access to any object or column.
--
-- NO `notify pgrst`. Nothing here changes a signature, an argument name or a
-- return type, so PostgREST's schema cache is not stale. (Arc C Part 2 — the
-- date bounds — DOES change a signature, and there the notify is load-bearing
-- rather than hygiene.)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- PART A — app.curbside_expired: the one definition of the rule.
--
-- STABLE, not IMMUTABLE: it calls now().
-- SECURITY INVOKER, not DEFINER: it reads no table and needs no elevation. The
-- three scalars are passed in so the same function serves a policy (where the
-- columns are unqualified) and a definer body (where they are aliased).
-- ---------------------------------------------------------------------------
create or replace function app.curbside_expired(
  p_tier_id text,
  p_starts_at timestamptz,
  p_ends_at timestamptz
)
returns boolean
language sql
stable
security invoker
set search_path = public, app
as $$
  select p_tier_id = 'curbside'
     and coalesce(p_ends_at, p_starts_at + interval '3 hours') < now();
$$;

-- SAME GRACE WINDOW AS EVERY OTHER ENDED TEST, BY RULING — no Curbside-specific
-- branch. A sixth definition of "ended" would cost more than it solves, because
-- every surface would then have to know which one applies to the row in front
-- of it. The consequence is accepted and routed upstream rather than patched
-- here: a no-end-time Curbside post disappears three hours after it starts,
-- which may be too fast for a Saturday yard sale, and the fix is for the
-- Curbside form to require or default an end time. That is a wizard arc.

revoke all on function app.curbside_expired(text, timestamptz, timestamptz) from public;
grant execute on function app.curbside_expired(text, timestamptz, timestamptz)
  to anon, authenticated;

-- ---------------------------------------------------------------------------
-- PART B — events_select_public.
--
-- Transcribed from 0022 with the guard added to branches 2 and 3 and NOTHING
-- else changed. drop + create is the house pattern for this policy (0019,
-- 0022); a policy has no ACL, so nothing is at risk in the drop.
-- ---------------------------------------------------------------------------
drop policy if exists events_select_public on public.events;

create policy events_select_public on public.events
  for select using (
    -- 1. The host and their team: everything they own except what they deleted.
    --    UNTOUCHED BY THIS MIGRATION — see trap 1 in the header. This branch is
    --    what keeps the host's ended Curbside posts in Workspace.
    (
      deleted_at is null
      and app.is_member(workspace_id, array['owner', 'editor', 'viewer'])
    )
    -- 2. The storefront: live listings only — and no longer an ended Curbside
    --    post. Paid listings are unaffected: this branch has no date test of
    --    its own and still does not have one.
    or (
      deleted_at is null
      and archived_at is null
      and status in ('published', 'cancelled')
      and not app.curbside_expired(tier_id, starts_at, ends_at)
    )
    -- 3. The attendee's own history: an event they saved or RSVP'd to, after it
    --    ended, stays in their record even once the host archives or deletes
    --    it. A host may withdraw what has not happened; they may not rewrite
    --    what has. CURBSIDE IS NOW EXCLUDED FROM THAT PROMISE.
    --
    --    NOTE THE REDUNDANCY, DELIBERATELY: this branch ALREADY requires the
    --    event to have ended, so only the TIER half of `curbside_expired` does
    --    any work here — the ENDED half is always true by the time it is
    --    evaluated. `tier_id <> 'curbside'` would be exactly equivalent. The
    --    call is written in full anyway so the rule is greppable as one thing,
    --    but a future change to the helper's grace window must not be read as
    --    changing THIS branch: it cannot, and if it ever appears to, the bug is
    --    elsewhere.
    or (
      status in ('published', 'cancelled')
      and coalesce(ends_at, starts_at + interval '3 hours') < now()
      and not app.curbside_expired(tier_id, starts_at, ends_at)
      and app.has_attendance(id)
    )
  );

-- ---------------------------------------------------------------------------
-- PART C — event_categories_select_public gets the identical treatment.
--
-- COHERENCE, NOT DUPLICATION. saved.tsx and workspace.tsx both embed
-- `event_categories(category_id)` on DIRECT table reads, which are governed by
-- this policy rather than by any definer. Without the matching change an ended
-- Curbside post would vanish while its category rows stayed readable — the
-- record half-erased in the other direction from the one 0022 was fixing.
--
-- event_vendors_select_public is again NOT changed, for 0022's reason: vendors
-- describe who will be at a live market, and Curbside posts have none.
-- ---------------------------------------------------------------------------
drop policy if exists event_categories_select_public on public.event_categories;

create policy event_categories_select_public on public.event_categories
  for select using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and (
          -- 1. Member. Untouched, mirroring PART B.
          (
            e.deleted_at is null
            and app.is_member(e.workspace_id, array['owner', 'editor', 'viewer'])
          )
          -- 2. Storefront.
          or (
            e.deleted_at is null
            and e.archived_at is null
            and e.status in ('published', 'cancelled')
            and not app.curbside_expired(e.tier_id, e.starts_at, e.ends_at)
          )
          -- 3. Attendee history. Same deliberate redundancy as PART B branch 3.
          or (
            e.status in ('published', 'cancelled')
            and coalesce(e.ends_at, e.starts_at + interval '3 hours') < now()
            and not app.curbside_expired(e.tier_id, e.starts_at, e.ends_at)
            and app.has_attendance(e.id)
          )
        )
    )
  );

-- ---------------------------------------------------------------------------
-- PART D — app.events_within_radius.
--
-- Body transcribed from 0028 PART A with ONE added predicate. Signature, all 11
-- OUT columns, language, volatility, security and search_path are unchanged, so
-- CREATE OR REPLACE is legal and the ACL survives.
--
-- THIS IS THE OBJECT A PATCH WOULD MISS. 0028 moved the feed OUT from under
-- events_select_public — this function is SECURITY DEFINER and carries its own
-- filters, so PART B alone would fix Saved and change nothing on Explore. It
-- also backs Explore search's widened overflow read, which calls the same
-- function at a larger radius.
--
-- Note this body has no date predicate and still does not gain a general one:
-- ended PAID events continue to be returned and filtered on the client. That
-- changes in Arc C Part 2, not here.
-- ---------------------------------------------------------------------------
create or replace function app.events_within_radius(
  p_origin_lat double precision,
  p_origin_lng double precision,
  p_radius_miles double precision
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
    st_distance(e.location, o.pt) / 1609.344 as distance_miles
  from public.events e
  join public.workspaces w on w.id = e.workspace_id
  cross join origin o
  where e.deleted_at is null
    and e.archived_at is null
    and e.status = 'published'
    and e.location is not null
    -- 0030: an ended Curbside post leaves the feed and the widened search read.
    and not app.curbside_expired(e.tier_id, e.starts_at, e.ends_at)
    and st_dwithin(e.location, o.pt, p_radius_miles * 1609.344)
  order by st_distance(e.location, o.pt) asc; -- distance ONLY, no other factors
$$;

-- ---------------------------------------------------------------------------
-- PART E — app.event_detail.
--
-- Body transcribed from 0028 PART C with the guard added to the two transcribed
-- policy branches that admit a stranger or an attendee. All 16 OUT columns, the
-- argument list, language, volatility, security and search_path are unchanged.
--
-- THIS IS THE "BY DIRECT LINK" CLOSURE the ruling names explicitly. A link that
-- still resolves after the row has left every listing is the leak with extra
-- steps — and an ended Curbside post's id is precisely the id in every share
-- link from while it was live.
-- ---------------------------------------------------------------------------
create or replace function app.event_detail(
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
  workspace_id uuid
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
    case when e.curbside_anonymous then null else e.workspace_id end as workspace_id
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

-- ---------------------------------------------------------------------------
-- PART F — app.organizer_profile.
--
-- Body transcribed from 0023 with one predicate added to the `visible` CTE. All
-- 9 OUT columns, the argument, language, volatility, security and search_path
-- are unchanged.
--
-- THE TWO CURBSIDE TESTS NOW SIT SIDE BY SIDE, and they are not the same test —
-- see trap 2 in the header. `not e.curbside_anonymous` (0009) hides a post whose
-- host chose anonymity, for as long as it exists. `not app.curbside_expired(…)`
-- hides ANY Curbside post once it has ended, anonymous or not. Neither
-- subsumes the other: a named yard sale is admitted by the first and refused by
-- the second the moment it is over.
--
-- The CTE feeds both `upcoming` and `past`, so an ended Curbside post leaves the
-- profile's Past section — which is this surface's half of "removed from public
-- reach entirely".
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

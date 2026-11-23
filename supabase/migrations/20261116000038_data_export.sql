-- ============================================================================
-- 0038 — "Download my data": one JSON document of the caller's own data.
--
-- WHAT THIS DOES — and nothing else:
--     create  app.export_my_data()      (definer, no arguments)
--     create  public.export_my_data()   (invoker wrapper)
--     notify pgrst
-- No table, column, policy or other function is touched.
--
-- ---------------------------------------------------------------------------
-- INTENT (locked by Jas, 2026-11-16). One JSON export, instant download, web
-- first. This is the server half; the Privacy-screen button is a later stage.
-- It exports auth.uid()'s data ONLY — there is no argument, so no caller can
-- name anyone else. A NULL uid raises `not_authenticated` (28000).
--
-- WHY DEFINER. The export reads rows the caller cannot read directly: their
-- own soft-deleted events (events_select_public's leading `deleted_at is
-- null`), `publish_fee_cents` (no client grant, 0011), their ledger's
-- `event_id`, and their own memberships' workspaces' non-public fields.
-- Definer skips column grants and RLS, so EVERY column below is picked by
-- hand, and every row is filtered by the caller's own id.
--
-- ---------------------------------------------------------------------------
-- CONTENTS AND COLUMN CHOICES.
--
--   meta        format_version (1), generated_at, user_id (the caller's own).
--   profile     id, display_name, avatar_path, created_at, updated_at — the
--               whole row; all of it is theirs.
--   saves       event_id, title, starts_at, ends_at, saved_at.
--   rsvps       event_id, title, starts_at, ends_at, rsvped_at.
--               Event fields are the minimum to recognise the event; the
--               OTHER organizer's details are not this user's data.
--   category_preferences   category_id, label, stance.
--   memberships workspace_id, workspace_name, role, joined_at — for every
--               workspace they belong to, owned or not. No other member.
--   owned_workspaces (role = 'owner' only):
--     workspace  id, name, bio, location_text, website, socials, logo_path,
--                created_at, updated_at.
--                LEFT OUT: created_by — an auth id, redundant with ownership,
--                and after 0037 possibly a deleted user's NULL.
--     events     EVERY status, archived and soft-deleted included and labelled
--                by archived_at / deleted_at: id, title, description, tier_id,
--                status, starts_at, ends_at, venue_name, address,
--                location {lat, lng} (from the geography point),
--                location_approximate, entry_fee_cents, publish_fee_cents
--                (the host's own fee), socials, rsvp_count (a COUNT — never
--                who), curbside_anonymous, cancelled_at, archived_at,
--                deleted_at, created_at, updated_at, categories [ids],
--                vendors [name, vendor_type, logo_path, pin_x, pin_y,
--                sort_order].
--                LEFT OUT: workspace_id (implied by nesting); vendor id and
--                created_at (internal).
--   curbside_ledger  event_id, consumed_at — rows where user_id = caller.
--                LEFT OUT: the row id (internal).
--
-- NOT INCLUDED, BY DESIGN: other users' identities — no other members of the
-- caller's workspaces, no list of who saved / RSVP'd their events (rsvp_count
-- only), no organizer ids. Email and sign-in method come from the client
-- session, not auth.users.
--
-- Every section is present even when empty ([] / null), so an account with
-- nothing gets a well-formed document, never an error.
--
-- ---------------------------------------------------------------------------
-- PLACEMENT AND GRANTS (CLAUDE.md, "Standing grant check").
--
-- House convention (0012 → 0017): definer body in `app` (not exposed by the
-- Data API), thin SECURITY INVOKER wrapper in `public`, called by the app as
-- `rpc('export_my_data')`. The wrapper is invoker, so the caller executes the
-- app body itself and needs EXECUTE on both.
--
--   app.export_my_data()
--       PUBLIC          LOSES the implicit EXECUTE CREATE FUNCTION mints
--       anon            nothing (revoked explicitly)
--       authenticated   GAINS EXECUTE
--         CONSUMED BY: public.export_my_data (invoker → caller runs it)
--   public.export_my_data()
--       PUBLIC / anon   nothing (revoked explicitly)
--       authenticated   GAINS EXECUTE
--         CONSUMED BY: the Privacy screen's "Download my data" (later stage)
-- `postgres` keeps EXECUTE as owner. No schema grant: authenticated already
-- has USAGE on `app` (0001).
--
-- ---------------------------------------------------------------------------
-- EXPECTED POST-ARC DELTA (against a pre-arc baseline taken with the current
-- supabase/audits/privilege_audit.sql):
--   1. TABLE- AND COLUMN-LEVEL GRANTS — no change (1A 121).
--   2. RLS — no change.
--   3. VIEWS AND MATVIEWS — no change (0 rows).
--   4. FUNCTIONS — +2 rows, 43 → 45:
--      app    | export_my_data | (no args) | true  | postgres | search_path=public, app, extensions | postgres:EXECUTE, authenticated:EXECUTE
--      public | export_my_data | (no args) | false | postgres | search_path=public, app            | postgres:EXECUTE, authenticated:EXECUTE
--   5. DEFAULT PRIVILEGES — no change (5A 268).
--   6. ROLE INHERITANCE — no change.
--   7. SCHEMA-LEVEL PRIVILEGES — no change.
--   8. RLS POLICY DUMP — no change.
-- Any other row that moves is unexplained and blocks the commit.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- PART A — app.export_my_data(): the export (definer).
-- `extensions` on the search_path for st_x / st_y (PostGIS lives there, 0003).
-- ---------------------------------------------------------------------------
create function app.export_my_data()
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

-- GRANT: authenticated EXECUTE only; PUBLIC and anon revoked.
-- CONSUMED BY: public.export_my_data (PART B), SECURITY INVOKER, so the
-- signed-in caller executes this body directly.
revoke all on function app.export_my_data() from public, anon;
grant execute on function app.export_my_data() to authenticated;


-- ---------------------------------------------------------------------------
-- PART B — public.export_my_data(): the thin invoker wrapper.
-- ---------------------------------------------------------------------------
create function public.export_my_data()
returns jsonb
language sql
stable
security invoker
set search_path = public, app
as $$
  select app.export_my_data();
$$;

-- GRANT: authenticated EXECUTE only; PUBLIC and anon revoked.
-- CONSUMED BY: the Privacy screen's "Download my data" (later stage).
revoke all on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;


notify pgrst, 'reload schema';

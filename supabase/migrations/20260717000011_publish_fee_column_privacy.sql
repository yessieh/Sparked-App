-- ============================================================================
-- 0011 — publish_fee_cents is host-only (SCHEMA_PLAN §7.2 ruling, 2026-07-17).
--
-- RULING: the publish fee is excluded from every anonymous/consumer read path.
-- The feed (0005) and detail (0007) RPCs already neither select nor return it;
-- this migration closes the remaining hole — the Data API let ANY caller read
-- `events.publish_fee_cents` straight off the table (verified pre-migration:
-- role anon could read the fee on 8 seeded events).
--
-- WHY COLUMN GRANTS AND NOT RLS: RLS is row-level. The events select policy
-- deliberately exposes every published row to everyone (anonymous browse), so
-- no policy can hide ONE column of an otherwise-public row. Column privileges
-- are the only mechanism at the right granularity.
--
-- WHY REVOKE-THEN-REGRANT: a bare `revoke select (col)` is a NO-OP while the
-- role holds table-level SELECT — in Postgres a table grant implies all
-- columns and outranks a column-level revoke. The table grant (0002) must come
-- off first, then every column EXCEPT the fee is granted back explicitly.
--
-- Deliberate consequence: this is FAIL-CLOSED. Columns added to `events` in
-- future migrations will be unreadable by clients until explicitly granted.
-- That is the safer default for a table carrying host economics — but it means
-- **every future column added to `events` must add its own grant here.**
--
-- Deliberate consequence 2: an anonymous `?select=*` on events now returns a
-- permission error instead of rows. No app path does this (feed and detail go
-- through the RPCs; Saved and checkout use explicit column lists), so there is
-- no user-visible change — but a raw API explorer will see the denial.
--
-- Writes are locked at the same time, so the fee is structurally unwritable by
-- clients as well as unreadable. The 0010 guard trigger stays as the
-- behavioral layer (it produces a clear error message); these grants are the
-- structural one. Belt and braces, on purpose: the fee is money.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- anon — read-only, minus the fee.
-- ---------------------------------------------------------------------------
revoke select on public.events from anon;

grant select (
  id, workspace_id, title, description, tier_id, status,
  starts_at, ends_at, venue_name, address, entry_fee_cents,
  socials, rsvp_count, cancelled_at, created_at, updated_at,
  location, curbside_anonymous
) on public.events to anon;

-- ---------------------------------------------------------------------------
-- authenticated — same read set, and writes minus the fee.
--
-- A signed-in user is NOT automatically entitled to the fee either: the events
-- select policy lets any authenticated caller read any published row, so
-- granting them the column would leak every host's economics to every user.
-- Hosts reach their own fee through the member-scoped function below.
-- ---------------------------------------------------------------------------
revoke select, insert, update on public.events from authenticated;

grant select (
  id, workspace_id, title, description, tier_id, status,
  starts_at, ends_at, venue_name, address, entry_fee_cents,
  socials, rsvp_count, cancelled_at, created_at, updated_at,
  location, curbside_anonymous
) on public.events to authenticated;

grant insert (
  id, workspace_id, title, description, tier_id, status,
  starts_at, ends_at, venue_name, address, entry_fee_cents,
  socials, rsvp_count, cancelled_at, created_at, updated_at,
  location, curbside_anonymous
) on public.events to authenticated;

grant update (
  title, description, tier_id, status,
  starts_at, ends_at, venue_name, address, entry_fee_cents,
  socials, cancelled_at, updated_at,
  location, curbside_anonymous
) on public.events to authenticated;

-- delete is table-wide (no column granularity); 0002's grant stands.

-- ---------------------------------------------------------------------------
-- The host's own read path — members of the owning workspace ONLY.
--
-- Definer so it can read the column the caller no longer can; the membership
-- check IS the authorization (definer bypasses RLS). Non-members and anon get
-- null rather than an error — "not yours to see" is not a failure, and this
-- matches the shape of `public.curbside_posts_used` (0008).
--
-- Consumed by Review/checkout when a host revisits a published event, and by
-- the Workspace listings screen when it lands.
-- ---------------------------------------------------------------------------
create or replace function public.event_publish_fee_cents(event_id uuid)
returns integer
language sql
stable
security definer
set search_path = public, app
as $$
  select e.publish_fee_cents
  from public.events e
  where e.id = event_publish_fee_cents.event_id
    and app.is_member(e.workspace_id, array['owner', 'editor', 'viewer']);
$$;

revoke all on function public.event_publish_fee_cents(uuid) from public, anon;
grant execute on function public.event_publish_fee_cents(uuid) to authenticated;

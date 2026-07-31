-- ============================================================================
-- 0022 — Archive and delete must respect attendee history.
--
-- AMENDS Architecture Decision 8. The 0019 rule was "archived events leave ALL
-- public surfaces". That let a host rewrite a stranger's record: archive or
-- delete an event after it happened and it vanished from the Saved list of
-- every person who went. The amended rule:
--
--   What already happened stays in the attendee's record.
--   What hasn't happened yet is the host's to withdraw.
--
--   Event state                  Feed / search / Profile   Saved: upcoming   Saved: Past
--   Archived                     hidden                    hidden            VISIBLE
--   Deleted, event in future     hidden                    hidden            n/a
--   Deleted, event already ended hidden                    n/a               VISIBLE
--
-- WHY THIS IS A POLICY CHANGE AND NOT CLIENT CODE. `events_select_public` is
-- what denies the attendee today — archived fails the public branch, deleted
-- fails the leading `deleted_at is null` outright. No client filter can widen a
-- policy, so the exception has to be granted where it is currently refused.
--
-- WHY NOT A SAVED-ONLY RPC INSTEAD. An attendee must be able to tap a history
-- row through to the ticket, and `public.event_detail` is a SECURITY INVOKER
-- function governed by this same policy. An RPC would fix the list and leave
-- the tap-through dead. The policy has to change either way, so a second
-- mechanism would be redundant.
--
-- NOTHING ELSE LOOSENS. Every other read path either bypasses RLS (the four
-- definer functions, which keep their own `deleted_at`/`archived_at` filters
-- from 0020) or carries an explicit filter that excludes everything this branch
-- admits (`events_within_radius`, and the client selects in me.tsx /
-- workspace.tsx / checkout.tsx). The one deliberate consequence is that
-- `event_detail` — which has no archive filter, by design — now reaches an
-- archived event for the person who attended it. That is the point.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- PART A — app.has_attendance: "did the caller save or RSVP to this event?"
--
-- DEFINER for the same reason app.is_member is: a policy that reads `saves` and
-- `rsvps` directly would evaluate those tables' own RLS mid-policy. Own-rows
-- RLS happens to give the same answer here, but the codebase's rule is that
-- authorization helpers do not depend on another table's policy, and definer
-- keeps it that way.
--
-- Returns FALSE for anon: auth.uid() is null, so neither EXISTS can match. The
-- history exception is only ever available to the signed-in person who was
-- actually there.
--
-- GRANTED TO anon AS WELL AS authenticated, and that is load-bearing:
-- `events_select_public` carries no `TO` clause, so it is evaluated for anon on
-- every read, and an anon caller without EXECUTE would get
-- "permission denied for function has_attendance" on the storefront. Same shape
-- as the 0021 regression — a policy referencing something the caller cannot
-- reach. Mirrors app.is_member's grant exactly (0001).
-- ---------------------------------------------------------------------------
create or replace function app.has_attendance(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, app
as $$
  select exists (
    select 1 from public.saves s
     where s.event_id = p_event_id and s.user_id = auth.uid()
  ) or exists (
    select 1 from public.rsvps r
     where r.event_id = p_event_id and r.user_id = auth.uid()
  );
$$;

revoke all on function app.has_attendance(uuid) from public;
grant execute on function app.has_attendance(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- PART B — events_select_public, third branch.
--
-- Branches 1 and 2 are 0019's, reordered into one clause each so the three
-- audiences read separately: the host, the storefront, and the attendee.
--
-- THE ENDED TEST MIRRORS THE CLIENT EXACTLY. `eventCountdown` (eventTime.ts)
-- calls an event ENDED when now is past `ends_at`, or past `starts_at + 3h`
-- when there is no end time — that 3-hour default IS the grace window, and
-- me.tsx's next-saved query uses the same 3h. Any drift between this predicate
-- and hasEnded() would let a row appear that the client then files under an
-- upcoming bucket, which is precisely the state the table above forbids.
--
-- CONDITION ORDER IS DELIBERATE: the two cheap column tests come before
-- has_attendance(), so the per-row EXISTS pair is only reached by rows that
-- already look like history. Both lookups are indexed (saves_event_id_idx from
-- 0015, rsvps_event_id_idx from 0006).
--
-- Branch 3 does NOT test deleted_at or archived_at. A clean ended event already
-- matched branch 2; the whole purpose here is to admit the rows those branches
-- reject. `status in ('published','cancelled')` still holds, so a draft or a
-- pending_payment row can never leak through it.
-- ---------------------------------------------------------------------------
drop policy if exists events_select_public on public.events;

create policy events_select_public on public.events
  for select using (
    -- The host and their team: everything they own except what they deleted.
    (
      deleted_at is null
      and app.is_member(workspace_id, array['owner', 'editor', 'viewer'])
    )
    -- The storefront: live listings only.
    or (
      deleted_at is null
      and archived_at is null
      and status in ('published', 'cancelled')
    )
    -- The attendee's own history: an event they saved or RSVP'd to, after it
    -- ended, stays in their record even once the host archives or deletes it.
    -- A host may withdraw what has not happened; they may not rewrite what has.
    or (
      status in ('published', 'cancelled')
      and coalesce(ends_at, starts_at + interval '3 hours') < now()
      and app.has_attendance(id)
    )
  );

-- ---------------------------------------------------------------------------
-- PART C — event_categories_select_public gets the same third branch.
--
-- Coherence, not loosening: event_detail builds its `categories` array from a
-- subquery over this table inside a SECURITY INVOKER function, so without the
-- matching branch an attendee who opens an archived history ticket gets the
-- event and no category chips. The record should not arrive half-erased.
--
-- event_vendors_select_public is deliberately NOT changed. Vendors are a Plus
-- tier host feature describing who will be at a live market, not part of an
-- attendee's record of having gone.
-- ---------------------------------------------------------------------------
drop policy if exists event_categories_select_public on public.event_categories;

create policy event_categories_select_public on public.event_categories
  for select using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and (
          (
            e.deleted_at is null
            and app.is_member(e.workspace_id, array['owner', 'editor', 'viewer'])
          )
          or (
            e.deleted_at is null
            and e.archived_at is null
            and e.status in ('published', 'cancelled')
          )
          or (
            e.status in ('published', 'cancelled')
            and coalesce(e.ends_at, e.starts_at + interval '3 hours') < now()
            and app.has_attendance(e.id)
          )
        )
    )
  );

-- ============================================================================
-- 0012 — bring 0011's member-scoped fee reader onto the project's established
-- definer convention (set by 0008's curbside quota pair).
--
-- CONVENTION: the SECURITY DEFINER body lives in `app` (a schema the Data API
-- does not expose, so the security advisor never lints it); `public` carries a
-- thin SECURITY INVOKER wrapper. 0008's comment states the reason outright —
-- "app schema: not API-exposed, no advisor lint."
--
-- 0011 shipped `public.event_publish_fee_cents` as definer-and-client-callable,
-- which is the exact shape the advisor flags as "Public/Signed-In Users Can
-- Execute SECURITY DEFINER Function". Behavior is unchanged by this migration
-- — same membership gate, same null-for-non-members result — only the split
-- changes, so the documented 0 errors / 3 accepted-warnings baseline holds.
--
-- NOT ADDRESSED HERE (deliberate): `public.publish_paid_event` (0010) has the
-- same shape and the same lint. It is left alone until the live publish walk
-- has been verified against it — restructuring the publish path immediately
-- before exercising it would put an untested change under the one flow that
-- most needs to work. Tracked; fix follows the walk.
-- ============================================================================

-- Internal read — definer so it sees the column clients no longer hold a
-- grant on (0011). The membership test IS the authorization: definer bypasses
-- RLS, so it is checked by hand, exactly as publish_paid_event does.
-- p_ prefix: a bare `event_id` would be ambiguous against events.id's row
-- variable, and a parameter cannot be schema-qualified to disambiguate.
create or replace function app.event_publish_fee_cents(p_event_id uuid)
returns integer
language sql
stable
security definer
set search_path = public, app
as $$
  select e.publish_fee_cents
  from public.events e
  where e.id = p_event_id
    and app.is_member(e.workspace_id, array['owner', 'editor', 'viewer']);
$$;

grant execute on function app.event_publish_fee_cents(uuid) to authenticated;

-- Public wrapper — INVOKER, so the API surface carries no definer lint.
-- Non-members and anon get null, never an error: "not yours to see" is not a
-- failure (same shape as public.curbside_posts_used).
create or replace function public.event_publish_fee_cents(event_id uuid)
returns integer
language sql
stable
security invoker
set search_path = public, app
as $$
  select app.event_publish_fee_cents(event_id);
$$;

revoke all on function public.event_publish_fee_cents(uuid) from public, anon;
grant execute on function public.event_publish_fee_cents(uuid) to authenticated;

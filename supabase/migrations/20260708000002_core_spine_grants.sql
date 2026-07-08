-- ============================================================================
-- 0001 companion — table privileges for the core spine.
-- This project has no default grants for anon/authenticated (the
-- "auto-expose new tables OFF" posture SCHEMA_PLAN assumes), so the RLS
-- policies in 0001 had nothing to mediate. Grants below are least-privilege:
-- exactly the operations the per-table policies allow. RLS remains the
-- row-level enforcement layer; service role bypasses both.
-- ============================================================================

-- anon: read-only on the public surfaces (anonymous browse lock).
-- Deliberately NO anon access to profiles/memberships — their policies can
-- never match an anonymous request.
grant select on
  public.categories,
  public.tiers,
  public.tier_prices,
  public.workspaces,
  public.events,
  public.event_categories
to anon;

-- authenticated: reads everywhere a policy can allow…
grant select on
  public.profiles,
  public.memberships,
  public.categories,
  public.tiers,
  public.tier_prices,
  public.workspaces,
  public.events,
  public.event_categories
to authenticated;

-- …and writes only where 0001 defined write policies.
grant update on public.profiles to authenticated;
grant insert, update, delete on public.workspaces to authenticated;
grant insert, update, delete on public.events to authenticated;
grant insert, update, delete on public.event_categories to authenticated;

-- No client writes to memberships (definer trigger only) or to the
-- categories / tiers / tier_prices reference tables (migrations only).

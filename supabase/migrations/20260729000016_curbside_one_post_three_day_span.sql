-- ============================================================================
-- 0016 — Curbside free-tier rules change: ONE post per rolling 100 days,
-- spanning up to THREE consecutive days (was: three posts, single-day each).
--
-- Two separate gates, deliberately not one trigger:
--   * quota — BEFORE INSERT only. On UPDATE the row being updated is itself
--     inside the window, so a combined trigger would count it and reject every
--     edit a host ever makes to their own post.
--   * span  — BEFORE INSERT **OR UPDATE**, because `starts_at` and `ends_at`
--     both sit in the authenticated UPDATE column grant (0011). An
--     insert-only span check is trivially bypassed: insert a compliant
--     one-day post, then widen it to a fortnight.
--
-- The count function is unchanged — it was always "posts in the window", and
-- only the threshold moved. Still computed on demand, never a stored counter
-- (locked: store what only transactions change, compute what time changes).
--
-- No data migration: because the quota is computed, every workspace holding a
-- curbside post from the last 100 days is simply at quota from now until that
-- post ages out. Verified at write time: both existing workspaces (one seed,
-- one QA) hold exactly 1, so both are at quota immediately. That is the
-- intended behavior, not a defect.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- RULE 1 — one free post per rolling 100-day window (was 3).
-- Same error code as before (`curbside_quota_exhausted`), so the client's
-- existing branch keeps rendering the CONVERSION screen rather than an error.
-- ---------------------------------------------------------------------------
create or replace function app.enforce_curbside_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.tier_id = 'curbside' and new.status <> 'draft' then
    if app.curbside_posts_used(new.workspace_id) >= 1 then
      raise exception 'curbside_quota_exhausted'
        using hint = '1 free Curbside post per rolling 100 days';
    end if;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- RULE 2 — span cap of 3 consecutive days.
--
-- Expressed as a DURATION, not as a count of calendar days, because a trigger
-- has no client timezone with which to bucket timestamptz into local dates —
-- the same limitation that made publish_paid_event take an explicit `tz`
-- argument for its duration band. `now()`/session TimeZone would be the
-- server's zone, not the host's, so a calendar-day rule enforced here would be
-- wrong by up to a day depending on who posted.
--
-- What the mini form actually sends, and why 3 days is the right bound:
--   widest legal post = start 00:00 local on day 1 → end 23:59:59 local on
--   day 3 = 71:59:59. Comfortably inside the cap.
-- Accepted looseness, stated plainly: a hand-crafted request could touch four
-- calendar days while staying under 72 hours (e.g. Fri 23:00 → Mon 22:00).
-- The cap's PURPOSE is to stop the free lane from carrying week-long listings
-- that belong on a paid tier, and a hard 72-hour ceiling does that. The
-- calendar-day framing is the host-facing expression of it, enforced in the
-- picker (end ≤ start + 2 days).
--
-- Fires for any curbside row regardless of status: a draft with a 10-day span
-- has no legitimate future, and checking unconditionally means there is no
-- status transition that can smuggle one in.
-- ---------------------------------------------------------------------------
create or replace function app.enforce_curbside_span()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.tier_id = 'curbside'
     and new.ends_at is not null
     and new.ends_at - new.starts_at > interval '3 days' then
    raise exception 'curbside_span_too_long'
      using hint = 'Curbside posts may span at most 3 consecutive days';
  end if;
  return new;
end;
$$;

create trigger events_curbside_span
  before insert or update on public.events
  for each row execute function app.enforce_curbside_span();

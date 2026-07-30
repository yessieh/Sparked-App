-- ============================================================================
-- 0018 — Curbside quota counts an immutable consumption LEDGER, not live event
-- rows. Implements SPARKED_STATE Architecture Decision 8.
--
-- THE EXPLOIT THIS CLOSES. 0008 counted `public.events` in a rolling window and
-- 0016 only moved the threshold, so the quota was computed over rows the host
-- controls. Deleting the post refunded the free lane. Worse, the count was keyed
-- on `workspace_id`, and 0017 shipped a button that deletes a workspace — so
-- delete-and-recreate handed out a fresh quota through a second door.
--
-- THE FIX, in one sentence: consumption is recorded once, keyed on the PERSON,
-- and nothing a host can delete ever removes it.
--
-- WHAT DOES NOT CHANGE: the rolling window is still COMPUTED — a 100-day window
-- can never be a stored integer. The locked pattern gains a third clause rather
-- than losing one (see SCHEMA LOCK 8, amended): time decides store-vs-compute,
-- MUTABILITY decides what you are allowed to compute over. Threshold stays 1.
-- The error code stays `curbside_quota_exhausted`, so the client keeps rendering
-- the CONVERSION screen rather than an error state.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- PART A — the ledger.
--
-- Minimal BY DESIGN: who, when, and (best-effort) which event. No title, no
-- address, no content of any kind. It is retained under legitimate-interest
-- fraud prevention, and the smaller it is the easier that is to defend.
--
-- `event_id` is nullable with ON DELETE SET NULL — the row MUST outlive its
-- event, which is the entire point. A purged or deleted event leaves a ledger
-- row that still says "this person used their free post on this date".
--
-- `user_id` is nullable with ON DELETE SET NULL for the same structural reason,
-- applied to account erasure: AD 8 says the row survives with the identifier
-- anonymized, and SET NULL *is* that anonymization. ON DELETE CASCADE would
-- destroy it instead. Residual accepted at MVP and stated plainly: deleting the
-- account and signing up again yields a new `auth.users.id` and therefore a
-- fresh quota. That is far higher-friction than "delete the post", and closing
-- it needs a hashed-email identifier — a different column, tracked, not here.
-- ---------------------------------------------------------------------------
create table public.curbside_quota_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  event_id uuid references public.events (id) on delete set null,
  consumed_at timestamptz not null default now()
);

comment on table public.curbside_quota_ledger is
  'Immutable record of consumed free Curbside posts. One row per post, keyed on the PERSON. Never deleted by event or workspace deletion — that is the point. See SPARKED_STATE Architecture Decision 8.';

-- The quota read: "rows for this user inside the window."
create index curbside_quota_ledger_user_idx
  on public.curbside_quota_ledger (user_id, consumed_at);

-- One ledger row per event, so a re-fired trigger or a re-run backfill can
-- never double-charge. PARTIAL, because many rows legitimately share a NULL
-- event_id once their events are gone, and NULLs must not collide.
create unique index curbside_quota_ledger_event_key
  on public.curbside_quota_ledger (event_id)
  where event_id is not null;

-- RLS: a user may read their OWN consumption (so a future "your next free post
-- opens on <date>" line has something to read). No insert/update/delete policy
-- and no write grant at all — the ledger is written by the definer trigger
-- below and by nothing else. Immutability is structural, not a convention.
alter table public.curbside_quota_ledger enable row level security;

create policy curbside_quota_ledger_select_own on public.curbside_quota_ledger
  for select to authenticated using (user_id = auth.uid());

grant select on public.curbside_quota_ledger to authenticated;
-- Deliberately nothing for anon: their policy could never match, and a free-tier
-- consumption record is not public information.

-- ---------------------------------------------------------------------------
-- PART B — the count. ONE definition, shared by the gate and the UI, so the
-- conversion screen and the server can never disagree about whether a post is
-- available.
--
-- Renamed from `curbside_posts_used(ws uuid)` on purpose. The old name took a
-- uuid too, so `create or replace` would have silently changed the MEANING of
-- the argument from workspace to user and any stale caller would have quietly
-- received 0 — a wrong answer that opens the gate. A new name makes a stale
-- caller fail loudly instead.
-- ---------------------------------------------------------------------------
create or replace function app.curbside_credits_used(p_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = public, app
as $$
  select count(*)::int
  from public.curbside_quota_ledger l
  where l.user_id = p_user_id
    and l.consumed_at > now() - interval '100 days';
$$;

revoke all on function app.curbside_credits_used(uuid) from public, anon;
grant execute on function app.curbside_credits_used(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- PART C — the gate, rebuilt.
--
-- MOVED FROM `BEFORE INSERT` TO `AFTER INSERT OR UPDATE`. Three reasons, each
-- of which was a hole in the old shape:
--
--  1. BEFORE INSERT could not write the ledger row at all. The FK to
--     `events(id)` is unsatisfiable before the event row exists, and splitting
--     check-in-BEFORE from write-in-AFTER breaks on a MULTI-ROW insert: every
--     BEFORE fires before any AFTER, so two curbside rows in one statement
--     would both see an empty ledger and both pass. Checking AND writing in the
--     same AFTER trigger means the second row sees the first row's ledger entry.
--     (The old code was accidentally safe here only because it counted `events`,
--     which is already populated by then.)
--
--  2. `OR UPDATE` closes draft-promotion. The old trigger fired on INSERT with
--     `status <> 'draft'`, so inserting a curbside DRAFT and then UPDATEing it
--     to published consumed nothing — and `status` sits in the authenticated
--     UPDATE grant (0011). Free posts forever, in two requests.
--
--  3. 0016 gave a good reason NOT to check on UPDATE: the row being edited is
--     itself inside the window, so it would count itself and reject every edit
--     a host makes to their own post. **The ledger dissolves that reason.**
--     Consumption is identified per EVENT, so the function asks "does this event
--     already hold a ledger row?" first — an edit short-circuits, and only a row
--     that has never consumed can consume.
--
-- Raising from an AFTER trigger still aborts the transaction, so the event is
-- not inserted and the client sees the same error it always did.
-- ---------------------------------------------------------------------------
create or replace function app.consume_curbside_credit()
returns trigger
language plpgsql
security definer
set search_path = public, app
as $$
declare
  poster uuid;
  used   integer;
begin
  -- Already paid for. This is an edit (or a re-published draft that consumed on
  -- some earlier transition), not a new post.
  if exists (
    select 1 from public.curbside_quota_ledger l where l.event_id = new.id
  ) then
    return null;
  end if;

  -- Whose quota. `auth.uid()` for a real request; the owning workspace's
  -- creator when there is no JWT at all (the seed, migrations, admin tooling) —
  -- those posts are real posts and should consume like any other. Definer
  -- bypasses RLS, which is what lets this read created_by (0015 revoked the
  -- column grant from clients).
  select coalesce(auth.uid(), w.created_by) into poster
  from public.workspaces w
  where w.id = new.workspace_id;

  if poster is null then
    raise exception 'curbside_poster_unknown'
      using errcode = '23502',
            hint = 'A Curbside post must be attributable to a user.';
  end if;

  -- Serialize per person. Without this, two concurrent inserts (a double-tapped
  -- "Post it — free", or a client retry) both read a count of 0 under READ
  -- COMMITTED and both consume. The window is narrow but this is a fraud gate,
  -- and an advisory lock costs one hash. Released at transaction end.
  perform pg_advisory_xact_lock(hashtextextended(poster::text, 0));

  -- The SAME function the UI reads, deliberately — one definition of "used".
  used := app.curbside_credits_used(poster);

  -- Threshold 1 mirrors CURBSIDE_QUOTA in lib/workspace.ts, which is DISPLAY
  -- only; this line is the enforcement.
  if used >= 1 then
    raise exception 'curbside_quota_exhausted'
      using hint = '1 free Curbside post per rolling 100 days';
  end if;

  insert into public.curbside_quota_ledger (user_id, event_id, consumed_at)
  values (poster, new.id, now());

  return null; -- AFTER ROW: return value is ignored.
end;
$$;

-- Out with the workspace-keyed gate.
drop trigger if exists events_curbside_quota on public.events;
drop function if exists app.enforce_curbside_quota();

-- The WHEN clause IS the tier/status gate, so the function body never has to
-- re-check it and paid inserts never call it at all.
create trigger events_curbside_consume
  after insert or update on public.events
  for each row
  when (new.tier_id = 'curbside' and new.status <> 'draft')
  execute function app.consume_curbside_credit();

-- ---------------------------------------------------------------------------
-- PART D — the UI read, repointed and re-signatured.
--
-- ZERO arguments now: there is no workspace to scope by and no membership to
-- check, because you can only ever be asking about yourself. Dropping the
-- 1-argument form is load-bearing — PostgREST resolves RPCs by argument NAME,
-- so a stale client still sending `{ ws }` gets "function not found" instead of
-- a confidently wrong 0.
-- ---------------------------------------------------------------------------
drop function if exists public.curbside_posts_used(uuid);
drop function if exists app.curbside_posts_used(uuid);

create or replace function public.curbside_posts_used()
returns integer
language sql
stable
security invoker
set search_path = public, app
as $$
  select app.curbside_credits_used(auth.uid());
$$;

revoke all on function public.curbside_posts_used() from public, anon;
grant execute on function public.curbside_posts_used() to authenticated;

-- ---------------------------------------------------------------------------
-- PART E — backfill, so current quota state carries over honestly.
--
-- Every existing non-draft Curbside post gets a ledger row stamped at the
-- event's OWN created_at, attributed to the owning workspace's creator (at MVP
-- every workspace has exactly one member, its owner, so this is exact).
-- Stamping the original date rather than now() is the honest choice: it means
-- these posts age out of the window on their real anniversary instead of having
-- their clock reset by this migration.
--
-- Consequence, stated rather than discovered later: anyone who posted more than
-- once in the last 100 days across DIFFERENT workspaces was never at quota
-- before and is now. That is the exploit being closed, applied retroactively —
-- correct, and deliberate.
-- ---------------------------------------------------------------------------
do $$
declare
  inserted integer;
begin
  insert into public.curbside_quota_ledger (user_id, event_id, consumed_at)
  select w.created_by, e.id, e.created_at
  from public.events e
  join public.workspaces w on w.id = e.workspace_id
  where e.tier_id = 'curbside'
    and e.status <> 'draft'
  on conflict (event_id) where event_id is not null do nothing;

  get diagnostics inserted = row_count;
  raise notice '0018 backfill: % ledger row(s) created from existing Curbside events', inserted;
end;
$$;

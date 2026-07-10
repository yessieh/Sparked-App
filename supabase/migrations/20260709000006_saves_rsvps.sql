-- ============================================================================
-- 0006 — saves + RSVPs (SCHEMA_PLAN §5.1 / §11, decided: two independent
-- tables — an event can be saved AND going at once).
-- rsvp_count on events is a trigger-maintained denormalized counter (store
-- what only transactions change; §10.2). Per-operation RLS: own rows only —
-- no update policies because the rows have no mutable columns (PK + created_at).
-- Grants follow the 0002 least-privilege posture: exactly what policies allow;
-- nothing for anon (their policies could never match).
-- ============================================================================

create table public.saves (
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

create table public.rsvps (
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

-- rsvp_count trigger reads by event; saves needs no event index at MVP
-- (all reads are user-keyed, covered by the PK).
create index rsvps_event_id_idx on public.rsvps (event_id);

-- ---------------------------------------------------------------------------
-- rsvp_count maintenance. Definer: the RSVP writer is not a workspace member,
-- so the counter update must bypass the events policies. Same-transaction
-- increment/decrement cannot drift. In app schema — not API-exposed, so the
-- advisor's definer-function lint (the two accepted rls_auto_enable warnings)
-- does not re-fire.
-- ---------------------------------------------------------------------------
create or replace function app.bump_rsvp_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.events set rsvp_count = rsvp_count + 1 where id = new.event_id;
    return new;
  end if;
  update public.events set rsvp_count = greatest(rsvp_count - 1, 0) where id = old.event_id;
  return old;
end;
$$;

create trigger rsvps_count_insert
  after insert on public.rsvps
  for each row execute function app.bump_rsvp_count();
create trigger rsvps_count_delete
  after delete on public.rsvps
  for each row execute function app.bump_rsvp_count();

-- ---------------------------------------------------------------------------
-- RLS — own rows only, all operations. rsvp_count is public via the events
-- row; the rsvps rows themselves are never publicly readable.
-- ---------------------------------------------------------------------------
alter table public.saves enable row level security;

create policy saves_select_own on public.saves
  for select to authenticated using (user_id = auth.uid());
create policy saves_insert_own on public.saves
  for insert to authenticated with check (user_id = auth.uid());
create policy saves_delete_own on public.saves
  for delete to authenticated using (user_id = auth.uid());

alter table public.rsvps enable row level security;

create policy rsvps_select_own on public.rsvps
  for select to authenticated using (user_id = auth.uid());
create policy rsvps_insert_own on public.rsvps
  for insert to authenticated with check (user_id = auth.uid());
create policy rsvps_delete_own on public.rsvps
  for delete to authenticated using (user_id = auth.uid());

grant select, insert, delete on public.saves to authenticated;
grant select, insert, delete on public.rsvps to authenticated;

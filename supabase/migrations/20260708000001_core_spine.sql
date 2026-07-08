-- ============================================================================
-- 0001_core_spine — SCHEMA_PLAN.md §3 + §4
-- Extensions, helpers, profiles (+signup trigger), workspaces (+owner-
-- membership trigger), memberships, categories (seeded), tiers + tier_prices
-- (seeded), events, event_categories. Explicit per-operation RLS on every
-- table ("auto-expose new tables" assumed OFF; service role bypasses RLS).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 3.0 Extensions & helpers
-- ---------------------------------------------------------------------------
create extension if not exists postgis;
create extension if not exists pgcrypto; -- gen_random_uuid guard (built-in >= PG13)

create schema if not exists app;
grant usage on schema app to anon, authenticated;

-- Shared updated_at maintenance
create or replace function app.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3.1 profiles — 1:1 with auth.users (no standalone users table)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function app.set_updated_at();

-- Signup trigger: populate profiles from auth.users metadata.
create or replace function app.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'New user'
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_new_user();

alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles
  for select using (id = auth.uid());
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
-- insert: signup trigger only (definer). delete: auth admin cascade only.

-- ---------------------------------------------------------------------------
-- 3.2 workspaces — the organizer; owns events (SCHEMA LOCK 3)
-- ---------------------------------------------------------------------------
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bio text,
  location_text text,
  website text,
  socials jsonb not null default '{}'::jsonb,
  logo_path text,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index workspaces_created_by_idx on public.workspaces (created_by);

create trigger workspaces_set_updated_at
  before update on public.workspaces
  for each row execute function app.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3.3 memberships — users <-> workspaces with role
-- ---------------------------------------------------------------------------
create table public.memberships (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index memberships_user_id_idx on public.memberships (user_id);

-- Membership check helper (security definer avoids RLS recursion).
create or replace function app.is_member(ws uuid, roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.workspace_id = ws
      and m.user_id = auth.uid()
      and m.role = any (roles)
  );
$$;

grant execute on function app.is_member(uuid, text[]) to anon, authenticated;

-- Workspace creation silently seeds the owner membership row.
create or replace function app.handle_new_workspace()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.memberships (workspace_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

create trigger on_workspace_created
  after insert on public.workspaces
  for each row execute function app.handle_new_workspace();

alter table public.workspaces enable row level security;

create policy workspaces_select_public on public.workspaces
  for select using (true); -- anonymous Organizer Profile
create policy workspaces_insert_auth on public.workspaces
  for insert to authenticated with check (created_by = auth.uid());
create policy workspaces_update_owner on public.workspaces
  for update to authenticated
  using (app.is_member(id, array['owner']))
  with check (app.is_member(id, array['owner']));
create policy workspaces_delete_owner on public.workspaces
  for delete to authenticated using (app.is_member(id, array['owner']));

alter table public.memberships enable row level security;

create policy memberships_select_own on public.memberships
  for select using (user_id = auth.uid());
-- insert/update/delete: none for clients at MVP (owner row via definer
-- trigger; role management is post-MVP — deliberate, additive later).

-- ---------------------------------------------------------------------------
-- 4.1 categories — ONE canonical taxonomy (table, not enum; SCHEMA LOCK 4)
-- ---------------------------------------------------------------------------
create table public.categories (
  id text primary key,
  label text not null,
  sort_order int not null,
  show_in_onboarding boolean not null default false,
  active boolean not null default true
);

-- Reconciled 13-item canonical list. 'Live' is dropped (was never a
-- category). curbside first in every lineup (locked). The 9-item onboarding
-- subset survives only as show_in_onboarding.
insert into public.categories (id, label, sort_order, show_in_onboarding) values
  ('curbside',  'Curbside',  0,  true),
  ('markets',   'Markets',   1,  true),
  ('music',     'Music',     2,  true),
  ('art',       'Art',       3,  true),
  ('food',      'Food',      4,  true),
  ('community', 'Community', 5,  true),
  ('pop-ups',   'Pop-Ups',   6,  true),
  ('outdoors',  'Outdoors',  7,  true),
  ('family',    'Family',    8,  true),
  ('wellness',  'Wellness',  9,  false),
  ('nightlife', 'Nightlife', 10, false),
  ('sports',    'Sports',    11, false),
  ('tech',      'Tech',      12, false);

alter table public.categories enable row level security;

create policy categories_select_public on public.categories
  for select using (true);
-- writes: migrations / service role only.

-- ---------------------------------------------------------------------------
-- 4.2 tiers — id 'curbside', never 'popup' (SCHEMA LOCK 2). Backstage is NOT
-- a row (SCHEMA LOCK 7).
-- ---------------------------------------------------------------------------
create table public.tiers (
  id text primary key,
  label text not null,
  sort_order int not null,
  max_photos int not null,
  allows_paid_entry_display boolean not null,
  allows_site_map boolean not null,
  single_day_only boolean not null
);

-- allows_paid_entry_display all true under the ALL-TIER decision (kept as
-- data so a future flip is content, not code).
insert into public.tiers
  (id, label, sort_order, max_photos, allows_paid_entry_display, allows_site_map, single_day_only)
values
  ('curbside', 'Curbside', 0, 1,  true, false, true),
  ('standard', 'Standard', 1, 3,  true, false, false),
  ('plus',     'Plus',     2, 10, true, true,  false);

alter table public.tiers enable row level security;

create policy tiers_select_public on public.tiers
  for select using (true);

-- ---------------------------------------------------------------------------
-- 4.3 tier_prices — server-side pricing source (client price = display only)
-- ---------------------------------------------------------------------------
create table public.tier_prices (
  tier_id text not null references public.tiers (id),
  duration_band text not null check (duration_band in ('single', 'multi', 'extended')),
  amount_cents integer not null,
  primary key (tier_id, duration_band)
);

-- No curbside rows (free).
insert into public.tier_prices (tier_id, duration_band, amount_cents) values
  ('standard', 'single',   500),
  ('standard', 'multi',    1200),
  ('standard', 'extended', 2000),
  ('plus',     'single',   1500),
  ('plus',     'multi',    2900),
  ('plus',     'extended', 4900);

alter table public.tier_prices enable row level security;

create policy tier_prices_select_public on public.tier_prices
  for select using (true);

-- ---------------------------------------------------------------------------
-- 3.4 events — workspace-owned, single UTC timeline, computed distance
-- ---------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  title text not null,
  description text,
  tier_id text not null references public.tiers (id),
  status text not null default 'draft'
    check (status in ('draft', 'pending_payment', 'published', 'cancelled')),
  starts_at timestamptz not null,
  ends_at timestamptz check (ends_at is null or ends_at >= starts_at),
  venue_name text,
  address text,
  location geography(point, 4326),
  entry_fee_cents integer not null default 0 check (entry_fee_cents >= 0),
  publish_fee_cents integer,
  socials jsonb not null default '{}'::jsonb,
  rsvp_count integer not null default 0,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index events_location_gix on public.events using gist (location);
create index events_workspace_id_idx on public.events (workspace_id);
create index events_feed_idx on public.events (status, starts_at)
  where status in ('published', 'cancelled');
-- Supports the curbside trailing-100-day quota count (computed, never stored).
create index events_curbside_quota_idx on public.events (workspace_id, tier_id, created_at);

create trigger events_set_updated_at
  before update on public.events
  for each row execute function app.set_updated_at();

alter table public.events enable row level security;

-- Cancelled stays publicly readable (same-day greyed card); feed-visibility
-- windows are the client's display rule. Members also see drafts/pending.
create policy events_select_public on public.events
  for select using (
    status in ('published', 'cancelled')
    or app.is_member(workspace_id, array['owner', 'editor', 'viewer'])
  );
create policy events_insert_members on public.events
  for insert to authenticated
  with check (app.is_member(workspace_id, array['owner', 'editor']));
create policy events_update_members on public.events
  for update to authenticated
  using (app.is_member(workspace_id, array['owner', 'editor']))
  with check (app.is_member(workspace_id, array['owner', 'editor']));
create policy events_delete_owner on public.events
  for delete to authenticated
  using (app.is_member(workspace_id, array['owner']));

-- ---------------------------------------------------------------------------
-- 3.5 event_categories — join to the canonical taxonomy
-- ---------------------------------------------------------------------------
create table public.event_categories (
  event_id uuid not null references public.events (id) on delete cascade,
  category_id text not null references public.categories (id),
  primary key (event_id, category_id)
);

create index event_categories_category_idx on public.event_categories (category_id);

-- Curbside rules (created here, hardened in 0003):
-- paid tiers may never carry the curbside category…
create or replace function app.check_event_category()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ev_tier text;
begin
  select tier_id into ev_tier from public.events where id = new.event_id;
  if new.category_id = 'curbside' and ev_tier is distinct from 'curbside' then
    raise exception 'The curbside category is reserved for Curbside posts';
  end if;
  return new;
end;
$$;

create trigger event_categories_guard
  before insert or update on public.event_categories
  for each row execute function app.check_event_category();

-- …and curbside posts are auto-tagged with exactly the curbside category.
create or replace function app.auto_tag_curbside()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.tier_id = 'curbside' then
    insert into public.event_categories (event_id, category_id)
    values (new.id, 'curbside')
    on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger events_auto_tag_curbside
  after insert on public.events
  for each row execute function app.auto_tag_curbside();

alter table public.event_categories enable row level security;

create policy event_categories_select_public on public.event_categories
  for select using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and (
          e.status in ('published', 'cancelled')
          or app.is_member(e.workspace_id, array['owner', 'editor', 'viewer'])
        )
    )
  );
create policy event_categories_insert_members on public.event_categories
  for insert to authenticated
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and app.is_member(e.workspace_id, array['owner', 'editor'])
    )
  );
create policy event_categories_update_members on public.event_categories
  for update to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and app.is_member(e.workspace_id, array['owner', 'editor'])
    )
  )
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and app.is_member(e.workspace_id, array['owner', 'editor'])
    )
  );
create policy event_categories_delete_members on public.event_categories
  for delete to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and app.is_member(e.workspace_id, array['owner', 'editor'])
    )
  );

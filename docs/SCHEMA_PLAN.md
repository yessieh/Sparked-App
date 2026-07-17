# SPARKED — MVP SCHEMA PLAN (staged Supabase migrations)

*Spec of record: SPARKED_STATE.md (incl. SCHEMA LOCKS) + SPARKED_CODE_STAGE_TRACKER.md +
docs/BUILD_PLAN.md. Prototype = frozen reference; its known bugs are ignored.
Plan only — no SQL has been executed. Migrations are Supabase CLI versioned files
checked into `supabase/migrations/`.*

---

## 1. Conventions (apply to every table)

1. PKs: `id uuid primary key default gen_random_uuid()` unless composite.
2. Timestamps: `created_at timestamptz not null default now()`; `updated_at
   timestamptz` maintained by a shared `set_updated_at()` trigger where the row
   is mutable. All timestamps UTC `timestamptz` — **no stored date/time display
   strings anywhere** (SCHEMA LOCK 5); clients derive all display from
   `starts_at`/`ends_at`.
3. Money: integer cents (`*_cents integer`), never numeric dollars.
   `entry_fee_cents` and `publish_fee_cents` are **distinct columns** (SCHEMA
   LOCK 1); no column named `price` exists in the schema.
4. Constrained text over Postgres enums everywhere (stays additive without
   `ALTER TYPE`): `text` + `CHECK (col in (...))`, or a lookup-table FK where the
   set feeds UI (categories, tiers).
5. RLS enabled + forced on every table in the same migration that creates it;
   "auto-expose new tables" assumed OFF, so every access path below is an
   explicit policy. Service role bypasses RLS (used for moderation review,
   notification pipeline, webhooks).
6. Membership checks use one `security definer` helper to avoid RLS recursion:
   `app.is_member(ws uuid, roles text[]) returns boolean` — true when
   `auth.uid()` has a membership row in `ws` with `role = any(roles)`.
7. Read-heavy workload: prefer denormalized trigger-maintained counters over
   COUNT-on-read where a count is public (see `events.rsvp_count`, flagged §10).

---

## 2. Migration sequence (overview)

| Migration | Contents | Unblocks (BUILD_PLAN stage) |
|---|---|---|
| `0001_core_spine` | extensions, helpers, `profiles` (+signup trigger), `workspaces` (+owner-membership trigger), `memberships`, `categories` (seeded), `tiers` + `tier_prices` (seeded), `events`, `event_categories` | Stage 2–3: one real end-to-end anonymous read (feed → detail → organizer) |
| `0002_engagement_prefs` | `saves` / `rsvps` (open decision §11), `user_interests`, `notification_prefs`, `user_notification_settings`, `reports` | Stage 3 (report write) + Stage 4 |
| `0003_host_content` | `event_photos`, `event_amenities`, `event_vendors`, curbside quota function + enforcement triggers, storage buckets | Stage 5 |
| `0004_payments` | `orders`, publish-pipeline status transitions, refund fields | Stage 6 |
| **`0010_publish_pricing`** *(APPLIED 2026-07-16)* | `app.duration_band`, `publish_paid_event` definer RPC, publish_fee_cents guard trigger — the **pricing-authority half of 0004**, pulled forward for the mock checkout (§7.2) | Stage 5 (mock publish) |
| `0005_notifications_infra` | `push_tokens`, `notification_sends` (throttle ledger), `notification_event_overrides` | Stage 7 |
| `0006_moderation_feedback` | `feedback`, report review columns/indexes | Stage 8 |

Dev seed of the 13 Phoenix demo events = a seed **script** (`supabase/seed.sql`
or ts script), never a migration.

---

## 3. Migration 0001 — core spine

### 3.0 Extensions & helpers
- `create extension postgis with schema extensions;` (SCHEMA LOCK: geo in
  migration 1). **Never install PostGIS into `public`** — its
  `spatial_ref_sys` table is extension-owned (can't RLS/revoke it) and picks
  up blanket grants there, exposing it read-write through the Data API.
  Applied as migration 0003 after 0001 installed it bare.
  **search_path rule:** any SQL function that calls PostGIS (the feed RPC,
  distance computations) must set `search_path = public, extensions`, or the
  geography types/functions won't resolve.
- `pgcrypto` if needed for `gen_random_uuid()` (built-in ≥ PG13, include guard).
- `app` schema for helper functions; `app.is_member(...)` (§1.6),
  `app.set_updated_at()` trigger fn.

### 3.1 `profiles` — 1:1 with auth.users (no standalone users table)
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | **FK → `auth.users(id)` on delete cascade** |
| `display_name` | `text not null` | |
| `avatar_path` | `text` | storage object path |
| `created_at` / `updated_at` | `timestamptz` | |

- Populated by `on auth.users after insert` trigger (security definer) copying
  `raw_user_meta_data->>'name'` / email-derived fallback.
- Indexes: PK only.
- RLS: **select** own row (`id = auth.uid()`); **insert** none (trigger only,
  definer); **update** own row; **delete** none (account deletion = auth admin
  cascade, stage 8 privacy wiring). Consumer identity is not public at MVP.

### 3.2 `workspaces` — the organizer; owns events (SCHEMA LOCK 3)
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `name` | `text not null` | THE organizer display name — events never store one |
| `bio` | `text` | |
| `location_text` | `text` | e.g. "Phoenix, AZ" (freeform place label, not geo) |
| `website` | `text` | |
| `socials` | `jsonb not null default '{}'` | `{instagram, twitter, facebook}` (flagged §10) |
| `logo_path` | `text` | storage path |
| `created_by` | `uuid not null` FK → `profiles(id)` | audit only — ownership lives in memberships |
| `created_at` / `updated_at` | | |

- `after insert` trigger creates the owner `memberships` row for `auth.uid()`
  (matches "workspace created silently on first create").
- Indexes: PK; `(created_by)`.
- RLS: **select** public (`true`) — anonymous Organizer Profile; **insert**
  authenticated (`auth.uid() = created_by`); **update** `app.is_member(id,
  '{owner}')`; **delete** owner only (MVP delete-cascade path).

### 3.3 `memberships` — users ↔ workspaces with role
| Column | Type | Notes |
|---|---|---|
| `workspace_id` | `uuid` FK → workspaces on delete cascade | |
| `user_id` | `uuid` FK → profiles on delete cascade | |
| `role` | `text not null check (role in ('owner','editor','viewer'))` | |
| `created_at` | | |

- PK: `(workspace_id, user_id)`.
- Indexes: PK; `(user_id)` (Me-hub "my workspaces" lookup).
- MVP invariant (one owner, no invites) enforced by absence of any insert path
  besides the workspace trigger — teams = Deferred.
- RLS: **select** own rows (`user_id = auth.uid()`); **insert/update/delete**
  none for `authenticated` (owner-row created by definer trigger; role
  management is post-MVP). Flag: policies exist but are deny-all beyond select —
  intentional, additive later.

### 3.4 `events` — workspace-owned (SCHEMA LOCK 3), single UTC timeline (LOCK 5)
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `workspace_id` | `uuid not null` FK → workspaces on delete cascade | never a user FK |
| `title` | `text not null` | |
| `description` | `text` | markdown subset (bold/italic/bullets) — flagged §10 |
| `tier_id` | `text not null` FK → tiers | `'curbside'`, never `'popup'` (LOCK 2) |
| `status` | `text not null default 'draft' check (status in ('draft','pending_payment','published','cancelled'))` | |
| `starts_at` | `timestamptz not null` | THE single source of time truth |
| `ends_at` | `timestamptz` | `check (ends_at is null or ends_at >= starts_at)`; duration band derived, never stored |
| `venue_name` | `text` | |
| `address` | `text` | |
| `location` | `geography(Point,4326)` | distance always computed — no `mi` column ever |
| `entry_fee_cents` | `integer not null default 0 check (entry_fee_cents >= 0)` | 0 = free; ALL-TIER display (STATE decision); consumer surfaces read ONLY this |
| `publish_fee_cents` | `integer` | host economics; set server-side at checkout; null for curbside |
| `socials` | `jsonb not null default '{}'` | per-event links (Standard+ feature) |
| `rsvp_count` | `integer not null default 0` | trigger-maintained denormalized counter (flagged §10) |
| `cancelled_at` | `timestamptz` | |
| `created_at` / `updated_at` | | |

- Indexes: PK; `gist(location)`; `(workspace_id)`; partial
  `(status, starts_at)` where `status in ('published','cancelled')` (feed);
  `(workspace_id, tier_id, created_at)` (curbside quota count, §5.3).
- Feed query = RPC `events_within_radius(origin geography, radius_m int, ...)`
  ordering strictly by `ST_Distance` — no ranking input of any kind.
- RLS: **select** `status in ('published','cancelled')` for `anon` +
  `authenticated` (cancelled stays readable; feed-visibility windows are the
  client's display rule per REFUNDS & CANCELLATION), OR
  `app.is_member(workspace_id,'{owner,editor,viewer}')` (drafts/pending visible
  to members); **insert** `app.is_member(workspace_id,'{owner,editor}')`;
  **update** same; **delete** owner only. Publish-state transitions for paid
  tiers additionally guarded in 0004 (only the payment webhook / definer fn may
  set `published` on paid tiers).

### 3.5 `event_categories` — join to the canonical taxonomy
| Column | Type |
|---|---|
| `event_id` | `uuid` FK → events on delete cascade |
| `category_id` | `text` FK → categories |

- PK `(event_id, category_id)`. Index `(category_id)` (filter counts).
- Curbside rules enforced by trigger (created here, hardened in 0003):
  `tier_id='curbside'` ⇒ exactly the `curbside` row auto-inserted;
  paid tiers ⇒ reject `curbside` category.
- RLS: **select** public where parent event passes the events select rule (via
  `exists` subquery); **insert/update/delete** members of the parent event's
  workspace (`owner,editor`).

---

## 4. Lookup tables (all in 0001, seeded by migration, service-role writable only)

### 4.1 `categories` — ONE canonical taxonomy (SCHEMA LOCK 4; table, not enum)
| Column | Type | Notes |
|---|---|---|
| `id` | `text` PK | slug: `curbside`, `markets`, `music`, `art`, `food`, `community`, `pop-ups`, `outdoors`, `family`, `wellness`, `nightlife`, `sports`, `tech` |
| `label` | `text not null` | display: "Curbside", "Pop-Ups", … |
| `sort_order` | `int not null` | `curbside` = 0 — first in every lineup (locked) |
| `show_in_onboarding` | `boolean not null default false` | the 9-item distilled subset (prototype's INTERESTS list) |
| `active` | `boolean not null default true` | additive retirement without deletes |

- Seed = the reconciled **13-item** CREATE_CATEGORIES list; `'Live'` is dropped
  (was never a category). The prototype's 9-item list survives only as the
  `show_in_onboarding` flag. Feeds Create Event, Explore filters, Settings
  interests, and onboarding — one source.
- RLS: **select** public; **insert/update/delete** none (migrations/service
  role only).

### 4.2 `tiers`
| Column | Type | Notes |
|---|---|---|
| `id` | `text` PK | `curbside`, `standard`, `plus` — **`curbside`, never `popup`** (LOCK 2) |
| `label` | `text not null` | |
| `sort_order` | `int not null` | |
| `max_photos` | `int not null` | 1 / 3 / 10 |
| `allows_paid_entry_display` | `boolean not null` | all `true` under the ALL-TIER decision; kept as data so a future flip is content, not code |
| `allows_site_map` | `boolean not null` | plus only |
| `single_day_only` | `boolean not null` | curbside true |

- Backstage is **not** a row (SCHEMA LOCK 7 — teaser card is content, not a tier).
- RLS: **select** public; writes none.

### 4.3 `tier_prices` — server-side pricing source (client price = display only)
| Column | Type | Notes |
|---|---|---|
| `tier_id` | `text` FK → tiers | |
| `duration_band` | `text check (duration_band in ('single','multi','extended'))` | |
| `amount_cents` | `integer not null` | seed: standard 500/1200/2000; plus 1500/2900/4900 |

- PK `(tier_id, duration_band)`. No curbside rows (free).
- Band is computed from `starts_at`/`ends_at` at checkout by the pricing edge
  function reading THIS table.
- RLS: **select** public (Pricing screen); writes none.

---

## 5. Migration 0002 — engagement & preferences

### 5.1 `saves` and `rsvps` — two independent tables (decided; shape in §11)

### 5.2 `user_interests` — Interests & blocks (3 exclusive buckets)
| Column | Type | Notes |
|---|---|---|
| `user_id` | `uuid` FK → profiles on delete cascade | |
| `category_id` | `text` FK → categories | |
| `bucket` | `text not null check (bucket in ('into','blocked'))` | "undecided" = row absent |

- PK `(user_id, category_id)` — a category mathematically lives in exactly one
  bucket (the mutual-exclusivity rule enforced by the PK, not app code).
- Index: PK covers user lookups; `(category_id)` only if fit-matching batch jobs
  need it (add in 0005 if measured).
- RLS: all four ops own-rows-only (`user_id = auth.uid()`); no public read
  (notification pipeline reads via service role).

### 5.3 `notification_prefs` — structured (category, channel, frequency) — LOCK, no loose booleans
| Column | Type | Notes |
|---|---|---|
| `user_id` | `uuid` FK → profiles on delete cascade | |
| `category` | `text check (category in ('event_reminders','nearby_events','weekly_digest'))` | pref category (≠ event taxonomy) |
| `channel` | `text check (channel in ('push','email'))` | |
| `enabled` | `boolean not null default false` | |
| `frequency_value` | `smallint` | the `[#]` |
| `frequency_unit` | `text check (frequency_unit in ('minute','hour'))` | the `[unit]` |
| `radius_miles` | `smallint` | nearby only |
| `digest_day` | `smallint check (digest_day between 0 and 6)` | digest only |
| `updated_at` | | |

- PK `(user_id, category, channel)` — the channel×category grid without
  migration when either axis grows.
- Fit-gate is enforced in the send pipeline (0005) by joining `user_interests`,
  not by a flag here — the pref row records intent; eligibility is computed.
- RLS: all ops own-rows-only.

### 5.4 `user_notification_settings` — one row per user (quiet hours + override)
| Column | Type | Notes |
|---|---|---|
| `user_id` | `uuid` PK, FK → profiles on delete cascade | |
| `quiet_start` | `time not null default '21:00'` | time-of-day pref, not a display string |
| `quiet_end` | `time not null default '09:00'` | |
| `late_night_override` | `text not null default 'ask' check (late_night_override in ('never','ask','always'))` | |
| `updated_at` | | |

- RLS: all ops own-row-only.

### 5.5 `reports` — created here so the Stage-3 detail screen can write it
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `event_id` | `uuid not null` FK → events on delete cascade | |
| `reporter_id` | `uuid` FK → profiles, **nullable** | guests can report (anonymous browse extends to the App-Store-gated report path) — flagged §10 |
| `reason` | `text not null check (reason in ('spam','wrong_info','inappropriate','other'))` | |
| `details` | `text` | |
| `status` | `text not null default 'open' check (status in ('open','reviewed','dismissed'))` | review columns finished in 0006 |
| `created_at` | | |

- Indexes: `(event_id)`, partial `(status)` where `status='open'`.
- RLS: **insert** `anon` + `authenticated` (with `reporter_id` null or
  `= auth.uid()` check); **select/update/delete** none — review path is service
  role (stage 8). Abuse throttling at the edge, not the DB.

---

## 6. Migration 0003 — host content & curbside enforcement

### 6.1 `event_photos`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `event_id` | `uuid not null` FK → events on delete cascade | |
| `kind` | `text not null default 'gallery' check (kind in ('gallery','site_map'))` | cover = `sort_order 0` gallery photo (first image = cover, locked) |
| `storage_path` | `text not null` | |
| `sort_order` | `int not null default 0` | |
| `created_at` | | |

- Index `(event_id, kind, sort_order)`. Tier photo caps (`tiers.max_photos`,
  site map Plus-only) enforced by insert trigger reading the event's tier.
- RLS: **select** public where parent event is publicly visible (exists
  subquery); **insert/update/delete** parent-workspace members (owner/editor).

### 6.2 `event_amenities`
`id uuid PK · event_id FK cascade · label text not null · sort_order int` —
custom entries pass the shared blocklist at the edge/client (blocklist is app
code, not schema). Index `(event_id)`. RLS mirrors `event_photos`.

### 6.3 `event_vendors`
`id uuid PK · event_id FK cascade · name text not null · vendor_type text ·
logo_path text · pin_x real · pin_y real` (site-map pin as 0–1 relative coords,
null when unpinned). Index `(event_id)`. RLS mirrors `event_photos`.

### 6.4 Curbside quota — computed, never a counter (LOCK)
- Function `app.curbside_posts_used(ws uuid) returns int`: count of `events`
  where `workspace_id = ws and tier_id = 'curbside' and status <> 'draft' and
  created_at > now() - interval '100 days'`. Served to the client for the quota
  display AND used by a `before insert` trigger that rejects the 4th post
  (client renders the conversion screen on that error).
- Supporting index already created in 0001 (§3.4).
- **APPLIED as migration 0008 (2026-07-15)** — pulled forward from this
  planned `0003_host_content` batch (which was never applied) because the
  Curbside mini-form shipped in Create session 1. Definer
  `app.curbside_posts_used` backs both the trigger and a member-scoped
  public wrapper `public.curbside_posts_used` (null for non-members).
  Behavioral suite **9/9 PASS** (fills to 3 via the RLS path, 4th rejected
  with `curbside_quota_exhausted`, paid tiers unaffected, auto-tag intact,
  post visible in the anon feed RPC, member/non-member UI counts, net-zero
  cleanup).

### 6.6 Curbside attribution — display-only anonymity (APPLIED 0009)
- `events.curbside_anonymous boolean not null default false` (additive).
- The feed RPC (0005) and detail RPC (0007) mask `organizer_name` →
  `null` when the flag is set, so an anonymized poster's workspace name
  never leaves the DB through a read path. Display only: the row stays
  fully attributed to the workspace — quota, moderation, reports unchanged.
- Accepted limit: the `events.workspace_id` → `workspaces` join is still
  API-visible; column-level privacy is later hardening. Full display rules
  in SPARKED_STATE "CREATE EVENT — CURBSIDE" lock.

### 6.5 Storage buckets (declared alongside)
`event-photos`, `workspace-logos`, `avatars` — public read; write policies keyed
to path prefix = workspace/user id, membership-checked. (Bucket policies live in
this migration; object-level rules mirror the tables above.)

---

## 7. Migration 0004 — payments

### 7.1 `orders`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `event_id` | `uuid not null` FK → events | one paid publish per event: `unique (event_id)` (repricing/retry reuses the row until paid) |
| `workspace_id` | `uuid not null` FK → workspaces | denormalized for RLS + reporting |
| `payer_id` | `uuid not null` FK → profiles | |
| `tier_id` | `text not null` FK → tiers | |
| `duration_band` | `text not null check (... in ('single','multi','extended'))` | band AT PURCHASE (audit — event dates may later shift) |
| `amount_cents` | `integer not null` | priced server-side from `tier_prices` |
| `currency` | `text not null default 'usd'` | |
| `stripe_payment_intent_id` | `text unique` | |
| `status` | `text not null default 'pending' check (status in ('pending','paid','refunded_partial','refunded_full','failed'))` | |
| `refund_amount_cents` | `integer` | 100% / 50% / 0 policy computed off `events.starts_at` at cancel time |
| `created_at` / `paid_at` / `refunded_at` | `timestamptz` | |

- Indexes: `(workspace_id)`, `(event_id)` unique, `(stripe_payment_intent_id)` unique.
- RLS: **select** workspace members; **insert** `app.is_member(workspace_id,
  '{owner,editor}')` with `payer_id = auth.uid()` (row created pending; amount
  overwritten server-side); **update/delete** none for clients — paid/refund
  transitions are webhook/edge-function (service role) only.
- Also in 0004: definer function `app.mark_event_published(event uuid)` called
  by the payment webhook; client `update` policy on `events` amended to exclude
  direct `status → published` on paid tiers (curbside publishes directly).

### 7.2 Pricing authority landed early — migration 0010 (APPLIED 2026-07-16)

The mock checkout shipped with Create session 3, which forced the question of
who prices a listing. DECIDED: split 0004 in half and take the pricing side
now, leaving the payment rails for stage 6.

**Applied in 0010:**
- `app.duration_band(starts_at, ends_at, tz) → 'single'|'multi'|'extended'`.
  Computed on the **host's wall clock** via a caller-supplied IANA zone, not
  UTC: a 7pm Fri → 10am Mon event spans 4 local days and 3 UTC days, and the
  band is the price. Unknown zone falls back to UTC rather than failing.
- `public.publish_paid_event(event_id, tz)` — definer. Re-checks membership by
  hand (definer bypasses RLS), rejects curbside and double-publish, derives the
  band, reads `tier_prices`, stamps `publish_fee_cents`, sets `published`.
  Executable by `authenticated` only (verified: anon → 42501).
- `app.guard_publish_fee()` trigger on `events` — rejects ANY client write to
  `publish_fee_cents`. Bypassed only by the RPC's transaction-local
  `app.pricing_context` flag and by postgres/service_role (migrations, seed,
  and the future webhook).

**Still 0004's job (deliberately NOT in 0010):** the `orders` table, and the
policy amendment blocking clients from setting `status='published'` directly on
a paid tier. The RPC is the app's only publish path today, not the DB's.

**Flagged tradeoffs:**
1. **`tz` is client-supplied.** It is a locale input, not a fee input — the
   amount always comes from `tier_prices` — and a spoofed zone can shift the
   band by at most one day at a boundary. Revisit when Stripe prices the intent.
2. **`events.publish_fee_cents` is readable by `anon` through the Data API**
   (verified by direct REST probe). No consumer *screen* can show it — the feed
   and detail RPCs don't select it, and neither does EventDetailView — but the
   column itself is not column-privacy-protected. Same class as the 0009
   workspace-join note. One-line fix if wanted:
   `revoke select (publish_fee_cents) on public.events from anon;` — the
   feed/detail RPCs are unaffected (neither selects the column). Note this
   only closes the ANONYMOUS path: `authenticated` must keep the grant so
   hosts can read their own fee, and the events RLS select policy lets any
   signed-in user read any published row. Closing it fully means either a
   column-privacy pass or moving host economics off `events` onto `orders`
   (workspace-scoped RLS) when 0004 lands — which is the real fix.
   **OPEN — needs a ruling, not yet applied.**

---

## 8. Migration 0005 — notifications infrastructure

### 8.1 `push_tokens`
`user_id uuid FK cascade · token text · platform text check (platform in
('ios','android','web')) · created_at · last_seen_at` — PK `(user_id, token)`.
RLS: all ops own-rows.

### 8.2 `notification_sends` — the throttle ledger (the #1 behavioral guardrail)
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid not null` FK cascade | |
| `category` | `text not null` | same set as notification_prefs.category + `'cancellation'` |
| `channel` | `text not null check (channel in ('push','email'))` | |
| `event_id` | `uuid` FK → events, nullable | |
| `sent_at` | `timestamptz not null default now()` | |

- Index `(user_id, channel, sent_at desc)` — the frequency-cap check
  (`count since now() - frequency window`) and quiet-hours release queue both
  read this. Rate limit = computed from the ledger, same philosophy as the
  curbside quota: no counters.
- RLS: no client policies at all — service-role pipeline only.

### 8.3 `notification_event_overrides` — late-night per-event grants
`user_id FK cascade · event_id FK cascade · granted boolean not null ·
created_at` — PK `(user_id, event_id)`. Standing choice lives in
`user_notification_settings.late_night_override`; this table is only the
per-event "Ask each time" answers. RLS: all ops own-rows.

---

## 9. Migration 0006 — moderation & feedback

### 9.1 `feedback`
`id uuid PK · user_id uuid FK nullable · kind text check (kind in
('suggestion','issue')) · message text not null · created_at` —
RLS: **insert** authenticated (`user_id = auth.uid()` or null); **select/
update/delete** service role only.

### 9.2 `reports` hardening
Add `reviewed_at timestamptz`, `reviewed_note text`; decide + document the
auto-hide threshold (tracker open item — an `events.hidden_by_reports boolean`
flipped by a definer function when open-report count crosses N; N is stage-8's
decision, the column ships here).

---

## 10. Locked-constraint tradeoffs (flagged, not broken)

1. **Cancelled events publicly selectable indefinitely** — the "vanish by event
   day" rule is client display logic (client-side-time lock forbids a
   server-side date filter baked into the policy, since "today" is a device
   concept). Cost: stale cancelled rows remain readable by direct id; acceptable
   — they render as greyed stamps anyway.
2. **`rsvp_count` denormalized on events** — a stored counter looks like the
   banned curbside-counter pattern, but the lock bans a *decrementing quota*
   counter specifically; a trigger-maintained count is the right trade for a
   read-heavy public number (avoids exposing `rsvps` rows publicly or a
   definer-count on every card). Flagging the resemblance for the record.
3. **`socials` as jsonb** (workspaces + events) — the structured-prefs lock is
   scoped to notification prefs; a jsonb bag keeps the three known networks
   additive. If socials ever need per-network moderation, promote to a table.
4. **Anonymous report inserts** — anonymous browse + App-Store report gate imply
   guests can report; that's an anon INSERT surface (spam risk, mitigated at the
   edge). If you'd rather auth-gate reporting, it's a one-policy change.
5. **Memberships are select-only at MVP** — deny-all writes means "one owner
   forever" until a future migration adds invite paths. Deliberate, additive.
6. **`description` as markdown text** — bold/italic/bullets only; sanitization
   is an app/edge concern. A JSON rich-text AST would be stricter but heavier
   than three formatting marks justify.
7. **Accepted advisor noise (do not re-litigate):** the two security-advisor
   warnings on `public.rls_auto_enable()` ("Public/Signed-In Users Can Execute
   SECURITY DEFINER Function") are Supabase platform noise — it returns
   `event_trigger`, which Postgres cannot invoke directly (verified: anon RPC
   → `0A000`), and its body only ever ENABLES RLS on new public tables from
   DDL-event context. Inert for any client; leave it alone.
   **Third accepted warning (2026-07-09): "Leaked Password Protection
   Disabled."** The HaveIBeenPwned check is Pro-plan-gated (verified: toggle
   save silently rejected on Free — badge stays DISABLED). DECIDED: defer;
   enable it with the launch-prep Pro upgrade, at which point the baseline
   returns to 0 errors / 2 accepted. Current baseline: **0 errors / 3
   accepted warnings.**

---

## 11. saves + RSVPs — DECIDED: two independent tables

**`saves`** and **`rsvps`**, identical shape:
`user_id uuid FK cascade · event_id uuid FK cascade · created_at` —
PK `(user_id, event_id)`, index `(event_id)` on rsvps (counts trigger).
RLS both: all ops own-rows; rsvps insert/delete fires the `rsvp_count` trigger.

Why two: the states are independent — an event can be saved AND going at once
(prototype sample data sets both flags), which a single status column can't
represent without row duplication. Cost accepted: the Saved page reads a
two-way join/UNION instead of one query — trivial at MVP scale.

Pattern note (deliberate contrast, not inconsistency): `rsvp_count` is STORED
because it changes only at write moments — the trigger updates it in the same
transaction, so it cannot drift. The curbside quota is COMPUTED because it
changes with no write at all (posts age out of the rolling 100-day window);
a stored counter would need a decay job and would drift on any missed run.
Store what only transactions change; compute what time changes.

---

## 12. Deferred (listed, deliberately not designed)

- Ticketing rails / take-rate (display `entry_fee_cents` only at MVP)
- Teams beyond the single owner membership (invites, editor/viewer issuance,
  task assignment, Backstage permissions)
- Follow-organizer + workspace URL slugs
- Custom user interests / custom categories joining the taxonomy (parked;
  `user_interests` FK to `categories` intentionally blocks it until decided)
- Multi-post packs, QR flyers, digest sponsorship, host analytics
- Account handoff / workspace transfer-before-delete (the membership model
  already makes it a row swap — no schema work needed now)
- Advertising/sponsored content (distinct card anatomy — distinct tables later)
- Text search (no tsvector/embedding columns at MVP)

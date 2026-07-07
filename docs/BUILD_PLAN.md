# SPARKED — STAGED BUILD PLAN (Code Stage)

*Spec of record: SPARKED_STATE.md + SPARKED_CODE_STAGE_TRACKER.md. Prototype in
`/design-reference/` is frozen visual reference; its known bugs are ignored — where
prototype and docs disagree, the docs win.*

---

## 1. Inventory — prototype vs. repo

**1.1 Repo today:** four docs at root (`SPARKED_STATE.md`, `SPARKED_CODE_STAGE_TRACKER.md`,
`SPARKED_TERMS_OF_SERVICE.md`, `SPARKED_PRIVACY_POLICY.md`) + `design-reference/`.
No production code exists. Everything below is greenfield except what ports from
`design-reference/`.

**1.2 Ports verbatim (pure JS/data — copy, convert to TS, unit-test):**
- `PRICING_TIERS` + duration-band helpers (`_eventDays`, `_durationBand`, `_eventPrice`)
  from `ui_kits/mobile-app/AppScreens.jsx` (drop the non-canonical `ENTERPRISE_TIER`;
  rename tier id `popup` → `curbside` at port time)
- Canonical category taxonomy (`CREATE_CATEGORIES`, 13 items, Curbside first) — becomes
  THE single exported list; the 9-item `INTERESTS` subset and the stray `Live` tag do
  not port (docs: one shared vocabulary)
- Filter registry + matcher + highlight logic from `FilterFinder.jsx`
- Countdown/grouping logic (`eventCountdown`, Tonight/Weekend bucketing) from `Screens.jsx`
- Filter presets (PRICE/WHEN/DIST), radius-overflow cap rule `min(r×1.5, r+15)`
- Custom-entry blocklist + substring/dedupe matcher
- Shared FAQ content (landing + Help & feedback)
- Theme token VALUES from `APP_THEME_VARS` (Components.jsx) + `colors_and_type.css`
  → a TS theme module (CSS custom properties don't exist in RN)
- `SAMPLE_EVENTS` (13 events) → Supabase seed script, with real lat/lngs replacing the
  hardcoded `mi` field and a single `starts_at` replacing the literal date/time strings

**1.3 Ports with light adaptation:**
- `SparkedLogo.tsx` + `assets/*.svg` → `react-native-svg` (same paths/props)
- `mockups/landings/` (near-me, tonight, `faq.js`, `_partials`, `_shared.css`) — already
  plain web HTML; reused nearly as-is for the static funnel site (stage 9)
- 1024 app icon / favicon SVGs → Expo app icon + splash assets

**1.4 Rebuilt in React Native (prototype = visual spec, not source):**
- `EventStub` (all 3 variants) — rebuild to the DOCS' locked anatomy: category-color
  stripe on all variants, perforation, countdown column, price line reading `entryFee`
  with green-$-icon/bright-amount rules. Prototype's brand-gradient stripe, green
  Curbside category color, and `isPlus` price gate are known bugs — do not carry over.
- Every screen in `Screens.jsx` / `AppScreens.jsx` / `Onboarding.jsx` (DOM JSX + inline
  CSS + window globals — not RN-compatible)
- All form primitives, pills/badges, toggles, bottom sheets, PhoneFrame (dies entirely —
  prototype scaffolding only)
- Date/time pickers → NATIVE controls (`@react-native-community/datetimepicker`), which
  also closes the 3×-failed date-range fix and the quiet-hours stepper replacement

**1.5 Not ported (scraps/iterations):** `mockups/*.jsx` (design-canvas, feedback,
variations, shared), `preview/*` (token reference only), `screenshots/`, `uploads/`,
`scraps/`, `_ds_bundle.js`, `Sparked App.html` / `Sparked Demo.html` (kept frozen for
side-by-side visual verification), `_adherence.oxlintrc.json`, `SKILL.md`.

---

## 2. Stage 0 — Scaffold & guardrails (no features)

1. Expo app (TypeScript, Expo Router) targeting iOS + Android + web; `apps/mobile` or
   root-level — keep `design-reference/` untouched alongside.
2. Fonts (Montserrat 700–900, Inter 400–600 via `expo-font`), theme module from 1.2,
   dark/light/system via `Appearance` + context (System default; light-mode keep-rules
   from the state doc encoded as tokens).
3. `SparkedLogo` port; app icon + splash from existing SVG assets.
4. CLAUDE.md at repo root encoding the locked decisions (workspace-owns-events, anonymous
   browse, client-side time, gradient/green/perforation rules, EventStub price-line spec,
   canonical taxonomy, entry-fee naming: `entry_fee` = attendee fee vs `publish_fee` =
   host checkout total — never one `price` field for both).
5. Lint/format/test harness; EAS project init (builds come later).

## 3. Stage 1 — Design system core

1. Primitives per locked CTA hierarchy: gradient primary, secondary outline, solid-white
   (landing-only), filter pills (gradient when active) vs category badges (outlined,
   never gradient), status chips (semantic green), form fields, eyebrow/text scale.
2. `EventStub` — photo / compact / expanded variants, category stripe (category-color
   map defined off the canonical taxonomy; green excluded), perforation, live countdown
   (minute tick, on-device only), price line per locked spec, radius-overflow stepped-back
   style, cancelled greyed state (used in stage 7).
3. In-app gallery route (dev-only) rendering every primitive + all EventStub states for
   side-by-side eyeballing against `design-reference/` screenshots. Verification gate:
   screenshots compared before any screen work starts.

## 4. Stage 2 — Supabase foundation (schema first, all guardrails land here)

1. Supabase project; enable PostGIS. Migrations in-repo from day one.
2. Migration 1 — identity & ownership: `profiles` (user), `workspaces`,
   `memberships` (user↔workspace + role owner/editor/viewer). Events will FK to
   `workspace_id` — never to a user. *(Tracker: Workspace-owns-events guardrail.)*
3. Migration 2 — events: `events` (workspace_id, title, description, categories[] from
   canonical taxonomy, `starts_at`/`ends_at` timestamptz UTC only — no display strings,
   venue/address, `location geography(Point)` + GIST index, `entry_fee` nullable,
   `tier`, `publish_fee`, `status` draft/published/cancelled, `cancelled_at`), photo
   metadata table. *(Tracker: client-side-time guardrail — schema stores one timestamp.)*
4. Migration 3 — consumer state: `saves`, `rsvps`, `interests` + `blocks` (bucketed,
   mutually exclusive), `notification_prefs` structured (channel × category × frequency
   + quiet-hours window + late-night override enum — NOT loose booleans),
   `curbside_ledger` (workspace_id, posted_at — rolling-window quota computed by query),
   `reports`, `feedback`, `push_tokens`. *(Tracker: structured-prefs guardrail;
   ledger/report/feedback tables now, logic later.)*
5. RLS: anonymous SELECT on published events/organizer public profile; all writes
   authenticated; workspace writes gated by membership. *(Tracker: anonymous-browse
   guardrail.)*
6. Seed script from `SAMPLE_EVENTS` with real coordinates around Phoenix (85001).
7. **Decision gates closed at this stage (schema shapes depend on them):**
   entry-fee tier gating (Plus-only vs all-tier — tracker open item; schema stays
   permissive either way, enforcement lands stage 6) and email provider pick
   (Resend/Postmark — tracker says pick early; only the pick, wiring in stage 8).

## 5. Stage 3 — Consumer read path (anonymous, read-heavy first)

1. Explore feed: PostGIS RPC `events_within_radius(point, radius)` ordered strictly by
   distance — no ranking of any kind. Zip/radius inline-edit header. Refetch only on
   pull-to-refresh / screen focus / cache expiry (TanStack Query). *(Tracker: replace
   hardcoded `mi` with computed distance.)*
2. Event detail: expanded ticket, 1–3 photo gallery, outlined category badges, address +
   directions link, organizer name → Organizer Profile (public, read-only), report link
   (sheet UI now, submits to `reports` in stage 8... UI + write can land here since the
   table exists — do the write now, review path later).
3. Filter finder + registry (ported logic), live in-radius counts; radius overflow on
   search results only, cap rule + stepped-back cards + "+X mi past radius".
4. Cold-start empty state (feed with zero events in radius). *(Tracker item.)*
5. Web build sanity pass: discovery surfaces centered ~560px column on desktop.

## 6. Stage 4 — Accounts, personal identity, persistence

1. Supabase Auth: email + Google; guest browsing remains the default entry —
   signup gates saving/prefs/creating only. Logged-out "Me" = signup invitation screen.
2. Onboarding: interests → blocks → confirm w/ live feed preview (distilled subset of the
   canonical taxonomy).
3. Settings: Interests & blocks home (3 exclusive buckets, peek/expand caps) persisted to
   Supabase — the single source of truth. *(Tracker: persist interests/blocks; taxonomy
   enforcement — one exported list drives onboarding, Settings, Create Event, Explore.)*
4. Fit-matching util: interests ∩ event categories (shared lib; consumed by
   notifications in stage 8). *(Tracker item.)*
5. Saves + RSVPs (writes; RSVP stamp interaction on detail; counts refresh on focus,
   no Realtime). Saved page with Tonight/This Weekend/Coming Up grouping.
6. Appearance screen (System/Dark/Light). Notification-prefs SCREEN (editable fields,
   fit-gate lock UI reading real interests, quiet hours w/ native picker, late-night
   override control) — stores structured prefs; zero firing logic yet.
7. **Decision gate: custom interests** (parked in docs — default answer is "not built
   for MVP"; only decide if it's being pulled in).

## 7. Stage 5 — Host side: workspace, creation flows, uploads

1. Me-hub workspace slot (non-host invitation vs host stats card); first create silently
   creates the workspace; multi-workspace picker built but dormant at 2+.
2. Entry fork ("What are you posting?") → Curbside mini form (no category picker,
   auto-tagged Curbside, "Post it — free") or Event wizard.
3. Curbside credit ledger enforcement: 3 per rolling 100 days, decrement on post,
   block-at-0 renders the CONVERSION screen. Server-side: auto-tag Curbside on free
   posts, reject Curbside category on paid events. *(Tracker: ledger + category
   enforcement.)*
4. Create Event wizard (4 steps, live collapsible EventStub preview, desktop 60/40 at
   ≥1024px): native date pickers with separately-bound Start/End (End ≥ Start) —
   **demo gate: record a date actually changing** *(tracker: date-range item)*;
   duration-band pricing from ported `PRICING_TIERS`; Standard↔Plus switch preserves
   data; categories uncapped w/ 4th-selection warning; custom entry blocklist;
   site map / amenities / vendors section.
5. Real image uploads (cover/gallery/vendor logos → Supabase Storage; first image =
   cover). *(Tracker item.)*
6. Review step: price on the preview card (per locked price-line spec), gallery swipe +
   social links rendering, site-map toggle. *(Tracker: gallery/socials on Review.)*
7. Publish pipeline (behind stage 6 payment for paid tiers; Curbside publishes free):
   published events appear in Workspace listings AND the public feed. *(Tracker item.)*
8. Organizer Profile: public view (consumer-facing data only) + Workspace editor;
   Share button via device share sheet (`expo-sharing` / `Share` API) on detail +
   workspace. *(Tracker: share item.)*
9. Pricing screen from canonical `PRICING_TIERS` (3 tiers only; Backstage/Enterprise is
   NOT in the locked model — roadmap, feature-pulled).

## 8. Stage 6 — Payments (Stripe)

1. Stripe account + `@stripe/stripe-react-native` Payment Sheet (real Apple Pay / Google
   Pay / Link / Card — replaces every hand-drawn mock mark). *(Tracker: real checkout.)*
2. Edge functions: create-payment-intent priced server-side from tier + duration band
   (client price is display-only), webhook → mark event paid/published.
3. Entry-fee tier gating enforced per the stage-2 decision (display + validation).
   *(Tracker item closes here.)*
4. Refund enforcement off `starts_at`: 100% at 72+ hrs, 50% under 72, none same-day;
   host cancel flow. *(Tracker item.)*
5. Cancellation display rules: greyed card + "Cancelled" stamp, address/time stripped;
   advance cancellations drop from feed by event day, same-day stays visible greyed.
   (Notify-on-cancel completes in stage 8 when push/email exist.) *(Tracker item, part 1.)*
6. Stripe receipts configured (deliberate: acceptable as payment-receipt email).

## 9. Stage 7 — Notifications & email (highest-risk; needs everything above)

1. Expo push tokens registered + stored; permission requested in context, never at boot.
2. Server-side send pipeline (edge functions + `pg_cron`/scheduled functions) with a
   send-ledger table. **Throttle enforcing the user's `[#]•[unit]` cap server-side —
   the single most important behavioral guardrail.** *(Tracker item #1.)*
3. Push fires ONLY for user-requested events (saves/RSVPs) — no discovery firehose.
   *(Tracker item.)*
4. Fit-gate enforced server-side: no push/nearby sends when interests = 0, matching the
   locked UI state. *(Tracker item.)*
5. Nearby-events delivery honoring the stored radius, batched not per-event.
   *(Tracker item.)*
6. Quiet-hours suppression (hold + release window). Late-night override firing: 8:59PM
   permission prompt for quiet-hours events honoring Never/Ask/Always, per-event
   temporary grants stored, revoke path for "Always". *(Tracker items.)*
7. Email service (provider picked in stage 2): auth emails, weekly digest on the user's
   chosen day (fallback channel — works with zero interests, area top events,
   weekend-weighted), cancellation notices. *(Tracker: digest + email items; completes
   the stage-6 cancellation-notify item for push + email.)*

## 10. Stage 8 — Launch infrastructure & compliance

1. Report backend completion: review path + auto-hide threshold decision. *(Tracker.)*
2. Feedback form → Supabase table. *(Tracker.)*
3. Privacy wiring: location toggle mirrors OS permission (deep-link to system settings
   on OS-deny), analytics opt-in actually gates analytics, "Download my data" export,
   "Delete account & data" cascade (solo workspace + events die with account).
   *(Tracker.)*
4. ToS + Privacy Policy: the two repo documents rendered in-app + hosted at public URLs
   (App Store gate). *(Tracker — documents now exist; this is the wiring.)*
5. In-context App Store rating prompt (`expo-store-review`) fired at happy moments
   (e.g. after RSVP). *(Tracker.)*
6. Help & feedback screen w/ shared FAQ source.

## 11. Stage 9 — Web funnels, responsive batch, release

1. Landing funnels: reuse the static HTML template from `mockups/landings/`; build the
   remaining 7 variants (/host, /free, /weekend, /markets, /no-algorithm, /local,
   /whats-on); /free + /markets deep-link the correct fork lane; funnel cold-start
   empty state.
2. ONE responsive batch pass per the per-surface strategy: discovery = centered column,
   coordinator surfaces = real multi-column desktop layouts (verified in a real browser).
3. Light-mode QA sweep on real devices (expect stragglers from the 3-pass token
   conversion). *(Tracker.)*
4. EAS builds (dev → preview → production), store listings, TestFlight/Play internal
   testing; beta with seeded Phoenix events.

---

## 12. Tracker-item → stage map (every open checkbox)

| Tracker item | Stage |
|---|---|
| Push rate-limiting/throttling | 7 |
| Push = user-requested only | 7 |
| Fit-gate enforcement | 7 (UI lock: 4) |
| Nearby delivery (radius, batched) | 7 |
| Weekly digest scheduling | 7 |
| Quiet-hours suppression | 7 |
| Late-night override firing | 7 |
| Quiet-hours native time picker | 4 |
| Persist interests/blocks | 4 |
| Shared taxonomy enforcement | 0 (port) + 4 (wired) |
| Custom interests decision | gate at 4 (default: not built) |
| Fit-matching logic | 4 |
| Date range editable (+ demo gate) | 5 |
| Real image uploads | 5 |
| Entry-fee tier gating decision | decided 2, enforced 6 |
| Share button | 5 |
| Gallery swipe + socials on Review | 5 |
| Published events in Workspace | 5 |
| Real Stripe checkout | 6 |
| Curbside credit ledger | schema 2, enforcement 5 |
| Curbside category enforcement | 5 |
| Refund enforcement | 6 |
| Cancellation flow | 6 (display) + 7 (notify) |
| Report backend | 3 (write) + 8 (review path) |
| Email service | picked 2, wired 7 |
| App Store rating prompt | 8 |
| Privacy wiring | 8 |
| Real ToS + Privacy docs | written (repo root); wired 8 |
| Feedback backend | 8 |
| Light-mode QA sweep | 9 |
| Cold-start empty state | 3 (app) + 9 (funnels) |
| PostGIS distances | 2 (schema) + 3 (feed) |
| Workspace-owns-events | 2 |
| Anonymous browse | 2 (RLS) + 3 (UX) |
| Client-side time | 2 (schema) + 1/3 (render) |
| Structured notification prefs | 2 |

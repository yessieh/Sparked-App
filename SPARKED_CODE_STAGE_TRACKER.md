# SPARKED — CODE-STAGE TRACKER
*The prototype proves CONTROLS. This tracks the BEHAVIOR that only exists for real in code.*
*Purpose: nothing built visually gets left behaviorally stubbed at rollout.*
*Read alongside SPARKED_STATE.md. This is the "what still has to actually work" list.*

---

## HOW TO READ THIS
Every item below is something the Design prototype SHOWS but does not DO. The
UI is proven; the wiring is not. Grouped by area. Check off as each is wired
and verified in Cursor/Claude Code.

---

## NOTIFICATIONS (highest-risk area — the re-engagement channel)

- [ ] **Push rate-limiting / throttling.** OS gives NO automatic rate limit.
      Enforce the user's `[#]•[unit]` frequency cap server-side. Over-notifying
      permanently kills the notification permission. This is the single most
      important behavioral guardrail in the app.
- [ ] **Push fires for user-requested events ONLY** (bookmarks/RSVPs). Never
      auto-push discovery/nearby as a firehose.
- [ ] **Fit-gate enforcement.** Push + Nearby must actually stay disabled until
      the user has ≥1 interest. Prototype shows the locked state; code must
      enforce that notifications don't send when no fit exists.
- [ ] **Nearby-events delivery** honors the editable radius and (ideally)
      batches rather than firing per-event. Prototype only stores the radius.
- [ ] **Weekly digest scheduling.** Actually send the digest on the user's
      chosen day. Digest is the fallback channel for no-interest users — must
      work independently of the fit-gate.
- [ ] **Quiet-hours suppression.** Hold notifications during the user's window
      (default 9PM–9AM). Prototype only stores the window.
- [ ] **Late-night override firing logic.** Implement the 8:59PM permission
      prompt for events in quiet hours, honoring Never / Ask each time / Always.
      Store the user's standing choice + any per-event temporary grants. Build
      the OFF-switch path (user can revoke "Always" later). Prototype has the
      control only, zero firing logic.
- [ ] **Quiet-hours time picker → NATIVE control.** Prototype uses a custom
      up/down stepper popover (throwaway proof-of-concept; had overflow +
      re-anchor bugs). Production MUST use the native time control already used
      elsewhere in the app, for consistency. Replacing it also removes the
      popover-positioning problems wholesale.

---

## INTERESTS & BLOCKS

- [ ] **Persist interests/blocks** to real storage (currently app-state only).
      This is the source of truth the fit-gate + fit-based matching read from.
- [ ] **Interest taxonomy = canonical event-category list.** Enforce ONE shared
      vocabulary across onboarding, Settings interests, Create Event categories,
      and Explore filters. Divergence breaks fit-matching.
- [ ] **Custom interests decision** (PARKED — decide here). Per-user-private
      tags (safe) vs. joining the shared taxonomy (pollutes matching/filtering,
      needs moderation + blocklist). Same concern as Create Event custom
      categories. Not built until decided.
- [ ] **Fit-matching logic.** "Fit" = user interests ∩ event categories. Feeds
      nearby/push relevance. Needs the shared taxonomy above to function.

---

## CREATE EVENT (carried from prior Bucket 3 + this session)

> **ARC COMPLETE 2026-07-23.** Fork, Curbside + quota (0008/0009), the 5-step
> wizard, tier/band pricing, server-priced fees (0010–0012), mock checkout,
> publish, and the Plus site map + vendor pins + directory (0013) are all
> built and walked. Full inventory + the locks made along the way live in
> SPARKED_STATE "CREATE EVENT — ARC COMPLETE". The unchecked items below are
> what remains in this area — none of them block the arc.

- [x] **Date range editable** — DONE. Two independently-controlled Start/End
      `DateField`s in the wizard's When/Where step: Start bumps End when it
      passes it, End takes `min=Start` so earlier days render disabled. Closes
      the control that failed 3× in Design.
- [ ] **Real image uploads** — cover, gallery, vendor logos (Supabase Storage).
      **Designs `event_photos` here, against real storage** (SCHEMA_PLAN §6.1,
      deliberately deferred at the 0013 site-map/vendors session): `kind` in
      ('gallery','site_map'), the Plus-only site-map insert trigger, and the
      storage buckets all land with actual uploads rather than as a placeholder
      row. Two loose ends to reconnect when it does: (1) the site-map IMAGE
      becomes a real `event_photos(kind='site_map')` row — the consumer section,
      currently gated on `tier=plus AND >=1 vendor`, can then also show a map
      with zero vendors; (2) `event_vendors.logo_path` (nullable placeholder in
      0013) starts carrying a real storage path for vendor logos. So the two
      stages find each other — this item OWNS `event_photos`; 0013 owns vendors.
- [ ] **Entry-fee display: RESOLVED — ALL-TIER.** Any tier with paid entry on
      shows the fee. The prototype's `isPlus` gate is a known frozen-reference
      bug (AppScreens.jsx:404, :1009) — production ignores it.
- [ ] **Share button** (device share sheet).
- [ ] **Gallery swipe + social links rendering** on Review.
- [ ] **Published events appear in Workspace** (real write + read-back).
- [ ] **Real Stripe checkout** — replace the mock Apple Pay / Google Pay / Link
      / Card screen. Payment marks in prototype are hand-drawn approximations;
      production uses real SDK-rendered buttons under brand guidelines.
- [ ] **Vendor/category type plurality collapsing — revisit with real host
      feedback.** Custom types now title-case on save and dedupe
      case-insensitively against the seed list + types already on the event, so
      "drink" reuses an existing "Drink". Plurality is deliberately NOT
      handled: "Drink" and "Drinks" remain two entries. Collapsing them needs a
      stemming rule, and a wrong one is worse than none ("Crafts"→"Craft" reads
      fine, but naive stemming mangles real words) — so wait for evidence that
      hosts actually create the duplicate pairs before picking a rule.
- [ ] **Wizard exit affordance** — persistent X/close on all wizard + checkout
      steps with a discard-draft confirmation. Pairs with the in-tabs success
      screen restructure (round-2 walk): the create flow is a focused,
      chrome-less stack, so leaving it mid-way currently relies on Back/Cancel
      only — a clear, always-present exit (that warns before dropping an
      unsaved draft) closes the loop the success-screen redirect opened.

---

## PRICING & CURBSIDE (strategy RESOLVED in Design — see SPARKED_STATE.md; wiring below)

- [x] Canonical `PRICING_TIERS`, per-day killed, prices locked (Curbside free /
      Standard 5-12-20 / Plus 15-29-49), socials moved to Standard. DONE in prototype.
- [ ] **Curbside credit ledger.** Per-workspace counter, rolling 100-day window,
      decrement on post, block at 0. The block-at-0 moment is a CONVERSION screen
      ("you've used your 3 free posts — Standard is $5"), not an error. Prototype
      shows the quota copy only.
- [ ] **Curbside category enforcement server-side** — auto-tag on free posts,
      reject Curbside on paid events (prototype only hides the picker options).
- [ ] **Refund enforcement** off the event's `starts_at`: 100% at 72+ hrs, 50%
      under 72, none same-day. Note: Stripe keeps its processing fee on refunds.
- [ ] **Cancellation flow:** greyed "Cancelled" card state, advance cancellations
      drop from feed by event day, same-day stays visible greyed; PUSH/EMAIL
      notification to bookmarked/RSVP'd users on cancel.

---

## LAUNCH INFRASTRUCTURE (new — from the pre-launch gate list)

- [ ] **Report backend.** Report sheet exists in UI (App Store gate); wire a
      reports table + review path + auto-hide threshold decision.
- [ ] **Email service** (Resend/Postmark or similar): weekly digest, payment
      receipts (Stripe receipts OK if configured — deliberate), auth emails,
      cancellation notices. Pick early — digest is a core retention channel.
- [ ] **In-context App Store rating prompt** (OS API, fire at happy moments,
      e.g. after an RSVP). The Settings "Rate Sparked" row was removed on purpose.
- [ ] **Privacy wiring:** Location toggle MIRRORS the OS permission (deep-link to
      system settings when OS says no); analytics opt-in enforced; "Download my
      data" export; "Delete account & data" cascade (MVP: solo workspace + its
      events die with the account).
- [ ] **Real ToS + Privacy Policy documents** (App Store gate — links exist,
      documents don't).
- [ ] **Feedback form backend** (Supabase table).
- [ ] **Light-mode QA sweep** on real devices — token conversion was 3-pass;
      expect stragglers.
- [ ] **Cold-start empty state** (if not closed in Design) — feed + funnels.
- [ ] **Explore zip/radius inline-edit + onboarding — MUST PRECEDE LAUNCH.**
      The feed origin is still the hardcoded `TEST_ORIGIN` (Sahuarita) in
      `lib/devOrigin.ts`; the header's "Sahuarita, AZ · within 25 mi" is not
      yet editable. Without it every user sees one fixed neighbourhood's
      events — the distance promise only means something once the user can
      say where they are. Onboarding sets the initial value.
- [ ] **Web funnels deploy (Vercel) — launch prep.** The landing variants under
      `design-reference/mockups/landings/` are static HTML and need a real
      host + domain. Blocked on the app-store link, which the CTAs point at,
      so sequence it after store submission is underway.
- [ ] **Pre-launch: full Security Advisor sweep**, resolve or document every
      warning (baseline: 0 errors / 3 accepted, see SCHEMA_PLAN §10.7).
- [ ] **Create the PRODUCTION Supabase project at launch prep — STRATEGY
      DECIDED 2026-07-23.** The current project (`Sparked-App`,
      `kzynvvdggooqgtnprhrm`) is **dev/staging PERMANENTLY** — it keeps the
      seeded demo events, the QA walk-throughs, and every experiment. It never
      becomes production.
      **Production is a NEW, EMPTY project**, stood up at launch prep by
      running `supabase/migrations/` **0001 → N fresh** against it. There is
      **no data migration and no dump/restore**: nothing from dev crosses over,
      so none of the QA cruft, test listings, throwaway accounts, or
      hand-applied drift can land in front of real users. The migration files
      are the contract — if the schema can't be rebuilt from them alone, that's
      the bug to fix before launch, and this is the moment it gets proven.
      At cutover:
      - **App env vars repoint.** `EXPO_PUBLIC_SUPABASE_URL` /
        `EXPO_PUBLIC_SUPABASE_ANON_KEY` swap to the prod project, scoped per
        EAS build profile so dev builds keep pointing at dev. Verify a release
        build actually reads the prod values before shipping.
      - **Auth is reconfigured on prod, not inherited:** Google OAuth client +
        callback, the redirect allowlist, and email confirmations all have to
        be set up again on the new project.
      - **These all attach to the NEW prod project, not this one:** the Pro
        upgrade, custom SMTP (replacing the 2 emails/hr built-in mailer), and
        leaked-password protection (the third accepted advisor warning — see
        below; enabling it there is what returns the baseline to 0 errors /
        2 accepted **on prod**).
      - **Seed data stays dev-only.** `supabase/seed.sql` and
        `scripts/qa-cleanup.sql` must never run against prod.
      Consequence worth stating: until this exists, there is exactly one
      database and every destructive query is one typo from mattering. That's
      acceptable now precisely BECAUSE there are no real users — it stops being
      acceptable the day there are.
- [ ] **Business-email Supabase org — CREATE PROD INSIDE IT** (billing attaches
      to the org, not the project). **Superseded in shape by the dev/prod
      strategy above:** since production is a NEW project, it should simply be
      *created in* the business-email org — no transfer of the existing project
      is needed, and the dev project can stay where it is. Prep: create the
      business-email Supabase account/org anytime; do it before launch prep so
      prod is born in the right org and the Pro upgrade bills correctly.
- [ ] **Google Cloud cleanup:** delete the Firebase browser key +
      firebase-adminsdk service account from `sparked-dedd9` (old-rendition
      residue) — after confirming the old build is fully dead. Store accounts
      (Apple / Google Play) register under the business identity — decide
      business structure before enrollment.
- [x] **Leaked-password protection: DECIDED — deferred to launch prep.**
      Confirmed Pro-gated (2026-07-09: toggle save silently rejected on Free;
      advisor badge stays DISABLED). Documented as the third accepted advisor
      warning. Enable it with the launch-prep Pro upgrade (folds into the
      pre-launch advisor sweep above), restoring baseline to 0 / 2 accepted.
      **Applies to the NEW PROD project** (see the dev/prod strategy above) —
      dev/staging stays on Free and keeps this warning permanently, which is
      fine and expected. "0 / 2 accepted" is a PROD statement.

## GEO / MAPS (carried from prior state doc)

- [ ] **Replace hardcoded `mi` distances with PostGIS-computed distance** from
      real user location. All demo distances (Art Walk 1.2mi, etc.) are
      illustrative. Feed = strict in-radius; search = radius-overflow rules.
- [ ] **Geocoder: Nominatim → paid provider at scale.** Curbside address
      geocoding uses OpenStreetMap Nominatim (no key, ~1 req/s usage policy,
      identify via User-Agent) — fine for dev/MVP volume. Swap to a paid
      geocoder (Google/Mapbox) before real traffic; the mini-form's `geocode`
      helper is the single swap point.
- [ ] **Geocode confirmation step in both create flows — PRE-LAUNCH.** Show the
      host the RESOLVED location and make them confirm or correct it before
      publish. Today the geocode is silent and trusted: a typo'd or fictional
      address still returns a confident match, and the event publishes pinned
      wherever that landed. Observed 2026-07-21 during Create session-3 QA —
      "123 Rainbow Road" resolved to Colorado and published **632 miles** from
      the intended Sahuarita location, invisible in the feed with no error and
      no clue why. A host would read that as "publishing is broken." Affects
      the paid wizard and the Curbside mini form equally (one shared
      `lib/geocode.ts`). Pairs naturally with the paid-geocoder swap below.
- [ ] **Check-in / geofence (ROADMAP).** On-site check-in / proximity arrival
      confirmation for events. Not MVP — parked as a distinct capability that
      builds on the PostGIS point already stored per event.

---

## DATA MODEL GUARDRAILS (protect these at schema time)

- [x] **Workspace-owns-events.** Events belong to a workspace, not a user.
      Membership table links users→workspaces with a role. Enables teams +
      account handoff with no migration. Do NOT shortcut to user-owned events.
      ✅ Schema applied (migration 0001: workspaces, memberships,
      events.workspace_id FK, RLS by role).
- [x] **Anonymous browse.** Explore/detail/share open to guests; saving,
      persisting prefs, creating events are account-gated.
      ✅ DB layer applied (0001–0002: anon SELECT on published events/
      workspaces/categories, writes auth-gated by policy + grants). App-side
      UX lands at stages 3–4.
- [x] **Client-side time.** Countdowns/grouping computed on-device from a single
      UTC `starts_at`. No polling/subscriptions to keep time current. No
      Realtime in MVP; RSVP counts refresh on screen focus.
      ✅ Schema applied (0001: single `starts_at`/`ends_at` timestamptz, no
      stored display strings). On-device rendering rules land with the app.
- [ ] **Notification prefs stored structured** (category, channel, frequency),
      NOT as loose booleans — anticipates the channel×category grid without a
      later migration.

---

## CREATE EVENT — SESSION 1 (applied 2026-07-15)

- [x] **Curbside quota gate — migration 0008.** SCHEMA_PLAN §6.4; the plan
      batched this under `0003_host_content`, which was NEVER applied, so
      Create session 1 pulled it forward as 0008. Computed rolling-100-day
      count (never a stored counter), before-insert trigger rejects the 4th
      post, member-scoped UI-count RPC. Behavioral suite **9/9 PASS**. At
      quota the form shows the CONVERSION screen (invitation, not an error).
- [x] **Curbside attribution — migration 0009.** `events.curbside_anonymous`
      display-only flag; feed + detail RPCs mask `organizer_name` server-side.
      Full model in SPARKED_STATE "CREATE EVENT — CURBSIDE" lock.
- [x] **Entry fork + Curbside mini-form + typeable pickers built** (Event
      lane = next-build stub). Silent workspace creation on first post.

## CREATE EVENT — SESSION 2 (wizard structure, 2026-07-16)

- [x] **Paid wizard structure built** — 4 steps, both-direction persistence,
      working date range (Start/End independently controlled, End ≥ Start),
      live EventStub preview, Review CTA = checkout placeholder. No tier
      selection / checkout / publish yet.
- [x] **Review renders the formatted description** via shared
      `components/MarkdownText.tsx` (locked subset only).
- [ ] **Review "Preview full listing" action** — render the draft through the
      real Event Detail component in preview mode (formatted description,
      photos, fee line; NO live actions; clear PREVIEW marker). See
      SPARKED_STATE lock. Next session.
- [x] **Category soft-cap warning — confirmed live (2026-07-22).** The gentle
      "Most events use 2–3 categories" nudge fires at the 4th selection
      (uncapped) as specified. Verified in the round-2 walk.
- [x] **Live markdown preview in description editor — SHIPPED (round-2 walk,
      2026-07-22).** A labelled **Preview** under the field renders the typed
      markdown through the SAME `components/MarkdownText.tsx` as Review + the
      live listing, so the host sees the formatted outcome (marker layer
      absorbed) and the preview can't drift from what publishes. Literal
      `**markers**` stay in the input by design — markdown is saved as typed.
- [ ] **Rich text editor (WYSIWYG) — host-experience polish, replaces the
      marker input.** Web `contentEditable` per the design reference
      (`AppScreens.jsx` `_RichText`: live B / I / •, no visible markers);
      native later — RN `TextInput` can't render inline formatting while
      editing, so native needs a webview-based editor or a later solution.
      Storage stays the locked markdown subset: the editor serializes down to
      the same bold/italic/bullets, so `MarkdownText` and the DB are unchanged.
      Supersedes the live-preview above once it lands.

## MEDIA & REAL-DEVICE (pre-store)

- [ ] **Real-device test pass (Expo Go) before store prep.** Exercise the
      touch/native paths automation can't reach: gallery swipe + edge-peek +
      dots + thumbnails, the RSVP stamp motion, and the Google auth
      deep-link return — on a PHYSICAL device. Web preview + machine checks
      do not cover these; they are the standing human feel-list carried
      across sessions. **Site map adds to this list:** tap-to-place pin
      accuracy under a finger (not a mouse), the selected-pin breath (2 slow
      cycles, ~1.1s, must SETTLE — never loop), the unselected-pin dim level,
      and callout placement at real phone widths, where the surface is far
      narrower than desktop and collisions get tighter.
- [ ] **Gallery counter ↔ bookmark collision check at ALL scroll offsets.**
      Event Detail floats the back/bookmark chips ABSOLUTELY over the hero
      gallery, which also carries its own "1/3" counter and dot indicators.
      Verify they never overlap or obscure each other — at every scroll offset
      (the header does not scroll away), every photo count (1 vs 3 vs the Plus
      10-photo gallery), and every width from small phone to desktop, in both
      themes. Suspect combination: a wide counter + the bookmark chip at the
      same top-right corner on a narrow screen. Machine checks miss it because
      both elements exist and only their RECTS conflict — compare bounding
      boxes, or eyeball on device.
- [ ] **Site-map directory scroll-into-view on NATIVE.** Tapping a pin selects
      its directory row on every platform, but the "scroll that row into view"
      half is **web-only** today (`Platform.OS === 'web'` → `scrollIntoView`).
      React Native has no DOM equivalent: revealing it needs a handle on the
      PARENT scroll view (Event Detail's `ScrollView`), which the shared
      `SiteMap` component deliberately doesn't own. Fix shape: measure the row
      (`onLayout` / `measureLayout`) and expose an `onRevealRow` callback the
      parent screen wires to its `scrollTo` — or pass a scroll ref down.
      Until then, on a phone a pin tap highlights a row that may be off-screen
      (selection is still CORRECT, just not revealed). Verify during the
      real-device pass above.
- [ ] **Image-delivery egress strategy.** Real event photos (Code-stage
      uploads) pull image bytes on every feed scroll — decide the delivery
      path (Supabase Storage CDN vs. a transform/resize layer vs. external
      CDN) and its egress cost model BEFORE uploads ship. Feed is
      read-heavy; unbounded full-size delivery is the cost risk.

---

## STANDING PROCEDURES (not TODOs — how this project operates)

- [x] **Migrations apply FROM FILES via the CLI — never pasted.** The repo's
      `supabase/migrations/` is the source of truth; the remote's
      `schema_migrations` history must always match it.
      Workflow: write the file → `npx supabase db push --linked` → confirm with
      `npx supabase migration list --linked` (every row `local == remote`).
      The CLI is not on PATH; `npx supabase` resolves it (v2.109.1), the
      project is linked (`supabase/.temp/linked-project.json` → ref
      `kzynvvdggooqgtnprhrm`) and authenticated.
      *History:* 0013 was pasted into the dashboard, so its SQL ran but the
      history never recorded it — repaired 2026-07-23 with
      `supabase migration repair --status applied 20260723000013`. That is the
      remedy for a pasted migration; **never** `db push` a migration whose
      objects already exist — it re-runs and fails. 0011/0012 were fine.
- [x] **QA cleanup runs from `scripts/qa-cleanup.sql`** — not ad-hoc DELETEs.
      The standing QA address is **`18680 S Nogales Hwy`**; use it for every
      test listing. The script previews, deletes (prefix-matched, because the
      geocoder rewrites the address — the same test event has appeared as both
      the bare street and the full `…, Green Valley, AZ 85614` form), then
      verifies. Seeded demo events are excluded explicitly. Deletes cascade to
      categories / vendors / saves / rsvps. DEV ONLY — never against prod.

---

## VERIFICATION REMINDER
For each item: wire it, then VERIFY behavior directly (don't trust "done").
Reconcile edited-file counts against the work log. Commit to git after each
verified change (production = Cursor/Claude Code, so commits belong there).

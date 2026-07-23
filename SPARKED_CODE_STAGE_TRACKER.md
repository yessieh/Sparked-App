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

- [ ] **Date range editable** — moved to Code stage (was 3× failed in Design).
      Spec: two separately-tappable Start/End fields, each a controlled input
      bound to its own state, each opening a picker; End ≥ Start. Demo gate:
      show a date actually changing.
- [ ] **Real image uploads** — cover, gallery, vendor logos (Supabase Storage).
- [ ] **Entry-fee display: RESOLVED — ALL-TIER.** Any tier with paid entry on
      shows the fee. The prototype's `isPlus` gate is a known frozen-reference
      bug (AppScreens.jsx:404, :1009) — production ignores it.
- [ ] **Share button** (device share sheet).
- [ ] **Gallery swipe + social links rendering** on Review.
- [ ] **Published events appear in Workspace** (real write + read-back).
- [ ] **Real Stripe checkout** — replace the mock Apple Pay / Google Pay / Link
      / Card screen. Payment marks in prototype are hand-drawn approximations;
      production uses real SDK-rendered buttons under brand guidelines.

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
- [ ] **Transfer Supabase project to business-email org — MUST precede the
      Pro upgrade** (billing attaches to the org, not the project). Built-in
      transfer, zero downtime. Prep: create the business-email Supabase
      account/org anytime.
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
      across sessions.
- [ ] **Image-delivery egress strategy.** Real event photos (Code-stage
      uploads) pull image bytes on every feed scroll — decide the delivery
      path (Supabase Storage CDN vs. a transform/resize layer vs. external
      CDN) and its egress cost model BEFORE uploads ship. Feed is
      read-heavy; unbounded full-size delivery is the cost risk.

---

## VERIFICATION REMINDER
For each item: wire it, then VERIFY behavior directly (don't trust "done").
Reconcile edited-file counts against the work log. Commit to git after each
verified change (production = Cursor/Claude Code, so commits belong there).

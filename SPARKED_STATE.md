# SPARKED — Project State & Decision Record
*Handoff document. Captures brand, architecture, proven screens, build habits, and open work.*
*Read this first before working on Sparked.*

---

## WHAT SPARKED IS
A local-events discovery + hosting app. Mobile-first (the rebuild was triggered because the
original code wasn't written mobile-optimized). Two-sided:
- **Consumers** discover events near them, ranked **by distance, not by algorithm.** Core brand
  promise: "by distance, honestly — no feed fatigue, no algorithmic manipulation."
- **Hosts / event coordinators** (the paying customers) create and manage event listings.

Future vision (NOT MVP): advertising for local dining, shopping, and contractors/services.

Builder context: solo founder, newer to development, building in **Claude Design** (proving
screens visually) before handing to **Claude Code / Cursor** (production build). Stack target:
React + Vite frontend; **Supabase** (Postgres + PostGIS, Auth, Storage) backend; deploy to
iOS + Android via Expo/EAS. Read-heavy workload (far more reads than writes).

---

## BRAND SYSTEM (locked)

### Colors
- **Page base navy:** `#14213D`
- **Deep navy** (nav, shadows): `#0f1a30`
- **Card/surface fill:** `rgba(255,255,255,0.04)`; borders `rgba(255,255,255,0.08)`
- **Spark gradient (signature):** `linear-gradient(135deg, #ff5f4e 0%, #ff8c38 50%, #ffca3a 100%)`
  coral → orange → gold.
  **RULE: the spark gradient is reserved for ACTIONABLE elements only** — primary CTAs, host/
  monetization actions, active filter pills, countdowns, logo. Never decorative.
- **Accent stops:** `#ff5f4e` coral (energy/live/alerts), `#ff8c38` orange (eyebrows/icons/hover),
  `#ffca3a` gold (links/stat numbers/countdowns)
- **Green `#4ade80`:** SEMANTIC only — free / going / confirmed states. Not a brand accent, not a
  category color. (Documented so it doesn't cause drift.)
- **Text:** `#eef0ff` primary, `rgba(238,240,255,0.5)` muted, `rgba(238,240,255,0.25)` hint

### Light mode
Base `#f4f5f8`, cards `#ffffff`. Gradient stays UNCHANGED from dark mode. Wordmark goes flat navy
`#14213D` in light mode (gradient text is dark-mode only).

### Typography
- **Montserrat** (700–900): display, headings, countdowns
- **Inter** (400–600): body, UI

### Logo
**Twin Flames** — two opposing flame strokes (coral base rising, gold tip descending) forming an
implied S. Chosen for scalability, distinctiveness, and accessibility (high contrast, no fine
detail). Component built as `SparkedLogo.tsx` (props: mode dark/light, variant lockup/icon, size).

---

## CARD SYSTEM (locked) — the core of the visual identity

### The ticket stub is the universal event card
ONE `EventStub` component, multiple variants via a `variant` prop:
- **`photo`** — Explore / discovery feed (photo header + price badge overlaid)
- **`compact`** — Saved / logistics (no photo; status chips + countdown)
- **`expanded`** — event detail page (full-width ticket)

Constant across ALL variants:
- **Category stripe** (left edge, color = event category)
- **Perforated divider** (dashed vertical line)
- **Right utility column** with the Montserrat countdown ("STARTS IN 4h", "IN 2 DAYS")

### Hard rules
- **The perforation is EVENTS-ONLY.** Future sponsored content (dining/shopping/services) uses
  DISTINCT card anatomies with the same tokens — never the perforation — and is always labeled
  "Sponsored." This protects feed trust, which is the whole "no algorithm" pitch.
- **Two badge languages, kept distinct:** *filter pills* (interactive, gradient when active) vs.
  *category badges* (informational, outlined/tinted, NEVER gradient).
- **Stripe color = category.** Green stripe/chip = semantic (free/going), not a category.

### EventStub price line (LOCKED — resolved over a long debugging thread)
- **The card shows the ATTENDEE ENTRY FEE only — never the host publish fee.**
  The card is the consumer-facing artifact; host economics (publish fee, tier)
  live only in the Review overview + checkout, never on the card. General rule:
  the EventStub displays consumer-facing data only (also applies to the public
  Organizer Profile).
- **Value binding:** card price reads `entryFee` (attendee fee), NOT the derived
  publish `price`. **DECIDED: entry-fee display is ALL-TIER** (customer trust —
  a Standard event charging at the door must not imply "free"). The prototype's
  `isPlus &&` gate (AppScreens.jsx:404, :1009) is a KNOWN BUG in frozen
  reference — production ignores it. Plus differentiates via gallery + site
  map/vendors.
- **Stripe rule (DECIDED):** the card stripe is the CATEGORY COLOR on ALL
  variants. The prototype's gradient stripe (photo variant, Event Detail,
  EventStub.tsx) was undecided drift — production removes ALL decorative
  gradients; gradient = actionable only.
- **Free state:** green semantic pill ("Free" + ticket icon). `#4ade80`
  (light mode: `#16a34a`), never gradient.
- **Paid state:** inline "$N per person" — `$` ICON green `#4ade80`, amount text
  `#eef0ff` at weight 600 (bright, not washed out). Amount text NOT green. One
  `$` only (early bug double-rendered icon + `$` in string). Never gradient.
- **Placement:** in the card body under the location row, in the icon column.
- Shared component: Basics live preview and Review card render the same line.

### CTA hierarchy (locked)
- **Spark gradient** = primary + host/monetization actions everywhere (List an Event, tier
  signups, Publish, I'm Going).
- **Solid white** = consumer-entry actions on LANDING surfaces only (Browse Local Events). Never
  used in-app.
- **Secondary actions** = transparent + `rgba(255,255,255,0.12)` border (e.g. Share event).
- Apply this primary/secondary pattern to ANY screen with stacked actions.

---

## NAVIGATION & ENGAGEMENT SURFACES (LOCKED 2026-07-09)

- **Tab bar = Explore / Saved / Me (top-level).** SUPERSEDES the design
  reference's Me→Saved card placement. (Ruled after the fact — this class of
  user-visible deviation from the reference is stop-and-ask going forward.)
- **Saved screen = UNION of saved OR going.** Unsaving an event the user is
  still Going to never removes it — a commitment outranks a tidied bookmark.
  A card drops off only when NEITHER state holds. Chips render per-state:
  Going (semantic green, full weight) survives unsave; Saved (muted)
  survives un-RSVP.
- **Going gets structural priority, never hiding:** within each Tonight /
  This Weekend / Coming Up group, Going events sort first; saved-only cards
  follow. "All / Going" filter pill row at top (locked pill language,
  gradient when active). All is the DEFAULT — nothing is ever hidden by
  default.
- **Feed photo cards show social proof:** muted "N going" beside the price
  line, only when N > 0. A signal, not a shout — never bold, never gradient.
- **Card action-button affordance:** bookmark + going buttons show a small
  label chip pre-use — hover on desktop, press on mobile ("Save" /
  "I'm going"; "Saved" / "Going" when active). AMENDED same day: the chip
  gets a small pop (~180ms scale-in, settles fast) on appearance AND on
  every click/tap — chip feedback ONLY; the stamp celebration stays
  reserved for Event Detail. Chips right-anchor to their button (buttons
  sit at the card's clipping edge; center-anchoring cut off wider labels).
  Both buttons render on BOTH variants (Saved is where plans firm up —
  promoting to Going must work there). Going-count is optimistic: it moves
  with the toggle, never waits for a focus change, vanishes entirely at 0.
- **Card tap-through → Event Detail: CONFIRMED WANTED from both Explore and
  Saved** — lands with the Event Detail stage, not before.

### ME HUB LAYOUT (BUILT 2026-07-29)

Signed-in Me, top to bottom — **logo → profile header → workspace slot →
Saved preview card → five settings rows → Sign out.** Signed-out Me is
untouched (still the signup invitation).

- **There is NO settings gear, anywhere. The rows ARE settings.** Deliberate
  divergence from the frozen reference, which routes them through a separate
  `SettingsScreen` behind a gear — one less hop to a five-row list. Rows, in
  locked order: Interests & blocks · Notifications · Privacy · Appearance ·
  Help & feedback. Each is label + chevron on card/surface tokens, no
  gradient, no icon chip (the reference's `LinkRow` is transparent with an
  icon chip and dividers — also deliberately not followed). All five open
  STUBS (title + "Coming soon") at `settings/*`; the real screens are a later
  arc.
- **Workspace slot** — three states, 2 tiles. See the proven-screens table row.
- **Saved preview card** — the workspace card's anatomy applied to the
  consumer side: bookmark chip + "SAVED" eyebrow + chevron, whole card taps to
  the Saved tab. Body is a ticket fragment — **title | perforation |
  Montserrat countdown** — through the shared `Perforation` and
  `eventCountdown`, so it cannot drift from the EventStub.
  - **Shows the next upcoming-OR-LIVE saved event**, from the union of
    saved/going. "Next" = soonest event that hasn't ENDED, so a multi-day
    festival already under way reads NOW/LIVE rather than being skipped for
    something further out. Matches how the Saved tab's Past split treats live
    events.
  - **Empty state forks its destinations** (the copy promised Explore while
    the card delivered Saved): the header still taps to Saved, and the body
    becomes its own link, "Explore events near you →", to Explore. Split
    STRUCTURALLY — the container is a plain View holding two SIBLING
    Pressables, because a nested Pressable behaves differently per platform
    (RN's responder system lets the inner win; on web the DOM click bubbles
    and BOTH fire).
  - Loading holds a muted body — never flashes "nothing coming up" at someone
    who has something coming up. This required a `loaded` flag on the
    engagement provider: an empty saved-set before the first read resolves is
    indistinguishable from "nothing saved".

### SAVED GROUPING — PAST SECTION (LOCKED 2026-07-29)

- **Ended events collapse into a "Past · N" section at the bottom**, chevron
  to expand, **collapse state session-only** (in-memory, nothing persisted —
  reopening Saved starts collapsed). Rows are the same compact EventStub in
  their existing ENDED state, sorted **most-recent-first**. No Going-first
  partition inside Past — that rule surfaces commitments you still have to
  keep, and a finished event has none.
- **The bug it fixes:** `savedBucket` reads `starts_at` against two
  forward-looking windows only, so every past event fell through its default
  `return 'coming'` — a card stamped ENDED sitting under a header promising it
  hadn't happened yet. Measured on real data before the fix: **7 of the 10
  events in "Coming Up" had already ended.**
- **"Ended" derives from `eventCountdown`, the same util the card's chip
  renders from** (locked client-side-time rule), so the section split and the
  chip can never disagree. This also gets live events right for free: started
  but not ended reads LIVE, **not** past, and stays in its upcoming bucket.
- **Subtitle counts UPCOMING only**; Past carries its own count. This forced a
  split of the old single `unionTotal`, which was also gating the filter pills
  and the empty state — without it, a user whose events had all ended would
  lose their pills and be told to go bookmark something while their history
  sat right below.



---

## CREATE EVENT — CURBSIDE + SHARED FORM PATTERNS (LOCKED 2026-07-15)

- **US-first formatting, ALL user-facing surfaces.** Dates display as
  "Jul 15, 2026" (or MM/DD/YYYY in compact contexts); times as 12-hour
  "h:mm am/pm". NEVER ISO or 24-hour/military in front of the user. Storage
  is unchanged — a single UTC `starts_at`/`ends_at`; formatting is
  display-only (`formatUSDate` / `format12h` in components/pickers.tsx).
- **Typeable time input = THE shared time-entry pattern.** A forgiving text
  field ("1" / "130" / "9:30" / "18" → normalized to h:mm on blur; AM/PM
  chips; unparseable reverts to last-good) + a "Starts h:mm am/pm"
  confirmation line. Built on the Curbside form; the paid wizard's
  When/Where step INHERITS this exact input when built — it SUPERSEDES the
  design-reference's segment-highlight time picker (that pending reference
  fix is closed by this decision). The calendar date picker (month grid,
  gradient-selected day, min=today) is the parallel shared date pattern.
  Both live in `components/pickers.tsx` for reuse.
- **Curbside attribution — minimized display, full internal accountability.**
  NAMED curbside posts show NO ORGANIZER section; attribution folds into the
  ticket info card as "Posted by {first name} · community member" (first
  name = first token of the profile display name). The Curbside form carries
  a "Post without my name" toggle. DISPLAY ONLY — the row stays fully
  attributed to the workspace/account internally; quota, moderation, and
  reports NEVER change. Implemented via `events.curbside_anonymous` (0009)
  with server-side name-masking in the feed + detail RPCs (an anonymized name
  never leaves the DB). Accepted limit: the workspace_id→workspaces join is
  still API-visible; true column-level privacy is later hardening.
- **Anonymous Curbside identity = "Local host" — DECIDED 2026-07-29,
  supersedes "verified neighbor" entirely.** An anonymous post renders the
  STANDARD Organizer section (eyebrow + avatar chip + name) reading
  **"Local host"**, with a neutral non-gradient chip and NO tap-through —
  there is no profile behind it. Cards fall back to "Local host" on the venue
  line for the same reason.
  **Why the old copy had to go: we verify nothing.** "Verified neighbor"
  asserted a check Sparked does not perform, on the app's most-seen surface.
  That is a consumer-representation risk that sits OUTSIDE Section 230 — 230
  shields us from liability for what users post, not for claims *we* make
  about them in our own UI. The toggle's helper copy states the trade plainly:
  "Your post will show 'Local host' instead of your name. It stays tied to
  your account — you keep full access to this listing."
  **Standing rule: no "verified" language anywhere in the product** until
  something is actually verified.
- **Paid events keep the full ORGANIZER block** (name, avatar, tap-through
  when the Organizer Profile stage lands) — the minimized attribution model
  is Curbside-ONLY.
- **Curbside address geocoding = Nominatim** (OpenStreetMap, no key, plain
  fetch) for dev/MVP. Swap to a paid geocoder at scale — tracked. Shared by
  both create flows via `lib/geocode.ts` — ONE geocode interface.
- **Curbside free-tier rules — CHANGED 2026-07-29 (migration 0016).
  ONE free post per rolling 100-day window, spanning up to THREE consecutive
  days.** Supersedes "3 free single-day posts per 100 days" everywhere in this
  document. Still COMPUTED on demand from
  `created_at > now() - interval '100 days'` — never a stored counter (the
  locked principle: store what only transactions change, compute what time
  changes). At 1, the mini form renders the CONVERSION screen ("You've used
  your free post — Standard is $5"), an invitation, not an error.
  **Two triggers, deliberately not one:**
  - `events_curbside_quota` — BEFORE **INSERT** only. On UPDATE the row being
    edited is itself inside the window, so a combined trigger would count it
    and reject every edit a host makes to their own post.
  - `events_curbside_span` — BEFORE **INSERT OR UPDATE**, because `starts_at`
    and `ends_at` both sit in the authenticated UPDATE column grant (0011).
    Insert-only would be trivially bypassed: post one compliant day, then
    widen it to a fortnight.
  The mini form's date field is now Start + optional End, the End picker
  capped at start + 2 days (`max` prop on the shared `DateField`), so the
  picker cannot offer a span the server rejects. Copy: "Up to 3 consecutive
  days — perfect for a weekend sale."
- **ACCEPTED at MVP: the span cap is a 72-HOUR DURATION, not a calendar-day
  count.** A trigger has no client timezone with which to bucket `timestamptz`
  into local dates — the same limitation that made `publish_paid_event` take
  an explicit `tz` argument for its duration band; the server's own zone would
  be wrong for the host. Consequence, stated plainly: a hand-crafted request
  could touch FOUR calendar days while staying under 72 hours (e.g. Fri 23:00
  → Mon 22:00). **The mini form cannot produce this** — its widest legal post
  is 00:00 day 1 → 23:59:59 day 3 = 71:59:59. The cap's purpose is to keep
  week-long listings off the free lane, and a hard 72-hour ceiling does that.
  Fix if it ever matters: pass the client tz through the insert path (RPC
  instead of a bare insert) and bucket local dates there.

### Paid wizard (tier + checkout + publish built 2026-07-16; LOCKED rulings)

- **The wizard is FIVE steps: Basics → When/Where → Tier → Details → Review**
  → mock checkout. Tier is its own step (ruled 2026-07-16), NOT a field
  inside Details as the frozen reference has it. Every earlier "4-step
  wizard" note in this document is superseded by this line.
  **Tier's position is LOAD-BEARING (session-3 QA fix, same day):** it sits
  between When/Where and Details because its band price needs the dates
  behind it AND Details' photo cap needs the tier ahead of it. With Tier
  after Details, a host picked photos under Standard's cap of 3, upgraded
  to Plus, and was never shown the 7 slots they just bought.
- **Tier step shows ONE clean total per tier** for the draft's actual band
  ("4-day event · $12"). Per-day math appears nowhere.
- **Standard↔Plus preserves everything, by construction:** all wizard state
  lives in the parent and `selectTier` writes ONLY `tier` — no field can be
  lost because nothing else is touched. Photo cap tracks the tier live
  (Standard 3 / Plus 10).
- **Plus→Standard over cap: the switch is REFUSED, never a silent drop.**
  The intent is remembered, a trim panel opens inline, and the switch
  completes by itself the moment the host is under cap. "Never mind — stay
  on Plus" backs out with all photos intact.
- **Plus does NOT advertise "paid entry"** (ruled 2026-07-16). Entry-fee
  display is ALL-TIER and `tiers.allows_paid_entry_display` is seeded true
  for every tier, so selling it as a Plus unlock would advertise something
  Standard already does. Plus sells the 10-photo gallery + site map/vendor
  pins; socials sit at Standard. The reference's Plus bullet is dropped.
- **Publish fee is priced SERVER-SIDE (migration 0010, applied).** The
  client may not write `publish_fee_cents` at all — a guard trigger rejects
  it — and `publish_paid_event(event_id, tz)` re-derives the band, re-reads
  `tier_prices`, stamps the fee, and flips status to published. The price on
  screen is display-only. DECIDED 2026-07-16 over the full `orders` table:
  pricing authority now, payment rails with real Stripe at stage 6.
  **Not yet guarded (deliberate, 0004's job):** clients can still set
  `status='published'` directly on a paid tier; the RPC is the app's only
  publish path, not the DB's.
- **Duration band is computed on the HOST'S WALL CLOCK, not UTC** — the
  client passes its IANA zone to the RPC. A 7pm Fri → 10am Mon event spans 4
  local days but only 3 UTC days, which would underprice it a whole band.
  Flagged tradeoff: tz is client-supplied (a locale input, not a fee input —
  worst case shifts the band one day at a boundary). Revisit at stage 6.
- **Checkout = mock.** Stripe-style screen (Apple Pay / Google Pay / Link /
  Card, approximated marks), "Pay to publish · $X", 1.4s settle, no charge.
  Real SDK buttons + payment intents = stage 6 tracker item.
- **Address is REQUIRED to publish a paid event** (the reference allows
  venue-name-only). It's what geocodes, and without coordinates the event
  can never appear on a distance-ranked feed.
- **Event Detail is now `components/EventDetailView.tsx`**; the route
  (`app/event/[id].tsx`) is a data loader over it. The wizard's "Preview
  full listing" renders THAT component in `preview` mode — same pixels,
  every consumer action inert, persistent PREVIEW bar. Preview drift is
  structurally impossible.
- **Event Detail renders its description through `MarkdownText`** (shared
  with Review) — landed with publish, since published events now carry
  markdown.

### CREATE EVENT — ARC COMPLETE (2026-07-23)

The whole creation path is built and walked end to end. What exists, in the
order a host meets it:

1. **Entry fork** — "What are you posting?" → Curbside (free) or Event (paid).
2. **Curbside mini-form + quota** — auto-tagged; **1 free post per rolling
   100 days, up to 3 consecutive days** (**0016**, superseding 0008's
   3-single-day rule; computed never counted), block-at-quota renders the
   CONVERSION screen. Display-only anonymity via `curbside_anonymous`
   (**0009**) with RPC name-masking; anonymous posts read **"Local host"**.
3. **5-step paid wizard** — Basics → When/Where → **Tier** → Details → Review.
   All state parent-owned, so back-nav and tier switches never lose a field.
4. **Tier + band pricing** — ONE clean total per tier for the draft's band,
   read from `tier_prices`; per-day math exists nowhere.
5. **Server-priced publish fee** (**0010**, SCHEMA_PLAN §7.2) — the client may
   not write `publish_fee_cents` (guard trigger); `publish_paid_event` re-reads
   `tier_prices` and stamps it. Fee is host-only: per-column grants (**0011**)
   exclude it from every consumer read, member-scoped reader on the
   `app`-definer/`public`-invoker convention (**0012**).
6. **Mock checkout → publish** — Stripe-style screen, 1.4s settle, no charge;
   real Stripe is stage 6.
7. **Plus site map + vendor pins + directory** (**0013**) — placeholder map
   image, event-owned vendor rows with relative 0..1 pins, read-only directory
   beneath the map on every consumer surface.

**Still open for this area (all tracked, none blocking):** real Stripe, real
image uploads, WYSIWYG description editor, wizard exit affordance, geocode
confirmation, published events in Workspace.

### Workspace creation happens at PUBLISH, not at entry (LOCKED 2026-07-29)

- **Becoming a host is earned by publishing.** Opening the create flow creates
  nothing. Previously `getOrCreateWorkspace()` fired from three places —
  including the Me hub invitation tap, which *discarded the returned id
  entirely* — so anyone who tapped "Create your first event" and backed out
  owned an empty workspace and stared at a 0/0 stats card forever.
- **The two publish-time call sites:**
  - **Curbside** — inside `post()`, immediately before the event insert.
  - **Paid wizard** — top of `toCheckout()`, the Review CTA
    "Continue to payment", immediately before the draft insert.
  Both are `workspaceId ?? await getOrCreateWorkspace(...)`, sequential with
  the insert in the same action. Existing hosts are unaffected:
  `getOrCreateWorkspace` fetches first and returns early, so it is a no-op
  beyond one read.
- **Why the wizard lands at the Review CTA and not at checkout success:**
  the event row is written at `toCheckout()` as `status='pending_payment'`;
  the checkout screen only calls `publish_paid_event` on a row that already
  exists. `workspace_id` is set once at insert and is immutable (0011
  withholds it from the UPDATE grant), so this is the LAST moment it can be
  decided without restructuring the publish pipeline.
- **Residual, accepted:** a host who completes all five steps, taps
  "Continue to payment", then abandons checkout still becomes a host with a
  0/0 card — `workspace_stats` counts only `status='published'`, so the
  `pending_payment` draft doesn't register. Far narrower than the old
  entry-time leak (it costs a full wizard of intent), and closing it needs the
  deferred-insert rework tracked separately.
- **Nothing mid-flow needs the workspace to exist**, verified when this moved:
  the Curbside quota needs the COUNT (no workspace ⇒ provably zero posts), and
  the wizard preview needs the NAME (a workspace is named from the profile
  display name at creation, so a not-yet-host sees the identical string). Both
  entry-time reads are now fetch-only `getOwnWorkspaceId()`.
- **Failure state, accepted at MVP:** if the event insert fails after the
  workspace is created, the user owns an empty workspace and sees the 0/0
  card. Nothing rolls back; their next publish reuses that same workspace. No
  cleanup built.

### Paid wizard (structure built 2026-07-16; LOCKED rulings)

- **Live preview rail: collapsed by default on steps 1–3** (Basics,
  When/Where, Details) — it's a reassurance, not the main event there. The
  preview **earns full presence at Review**, rendered as the real EventStub.
- **Description markdown display rule.** Literal `**markers**` stay in the
  Basics input (markdown is saved as typed), but a labelled **Preview** now
  renders live UNDER the field (shipped 2026-07-22) through the SAME
  `MarkdownText` as Review and the live listing — so the host sees the
  formatted outcome, and preview cannot drift from what publishes. This
  supersedes the earlier "no live rendering" note. A true WYSIWYG editor that
  removes the markers entirely is the tracked follow-up.
  **Review MUST render the description FORMATTED** — Review is a "what
  buyers see" surface and raw asterisks break it. Shared renderer:
  `components/MarkdownText.tsx` (the locked subset only — **bold**,
  *italic*, "- " bullets; anything else renders literal, no HTML).
  **Pairing is BALANCE-AWARE with CommonMark flanking rules** (fixed
  2026-07-17): a delimiter opens a run only when a same-width delimiter
  closes it, an opener may not be followed by whitespace, a closer may not
  be preceded by one. The original regex paired greedily, so a stray `**`
  stole the next marker and formatted the span between it — "note: ** real
  text **bold** here" bolded " real text " and destroyed the host's real
  run, on live Event Detail as much as on Review. Tested invariant: real
  content is never dropped or invented, and markers only ever disappear in
  balanced pairs. The Basics toolbar additionally refuses to insert a
  marker adjacent to an existing one, so it cannot author that soup.
- **Review gains a "Preview full listing" action (BUILD NEXT SESSION).**
  Renders the DRAFT through the real Event Detail component in a preview
  mode — formatted description, photos, fee line — with NO live actions
  (no RSVP/save/share firing) and a clear PREVIEW marker. Rationale:
  coordinators must see BOTH consumer surfaces — the card (EventStub) and
  the full detail page — before they pay. Reuses the real component, never
  a lookalike, so preview drift is impossible.
- **Date range = two independently-controlled fields** (the control that
  failed 3× in Design): Start bumps End when it passes it; End takes
  `min=Start`, so earlier days render disabled and inert.
- **Wizard step content:** description lives on **Basics** (not the
  reference's Details), entry fee on **Details**. Deliberate divergence
  from the frozen reference's split, ruled 2026-07-16.

### Site map & vendors + create-flow chrome (LOCKED 2026-07-23)

- **Site-map section visibility = `tier = plus` AND `>= 1 vendor`.** The map
  IMAGE is an ephemeral placeholder (same pattern as photos — real uploads are
  stage 5), so only the vendor rows persist; an empty map has no pins worth
  showing. Consequence to revisit when uploads land: a Plus event with a map
  and zero vendors currently shows nothing. Standard events show the section
  NOWHERE, and the wizard shows no in-form upsell — the tier card is the only
  pitch.
- **Vendors are EVENT-OWNED data, never accounts.** Name + type + a pin as
  RELATIVE 0..1 coords on the image (never geography — it's a diagram, not a
  location map). Custom vendor types title-case on save and dedupe
  case-insensitively against the seed list plus types already on the event.
  Plurality ("Drink" vs "Drinks") is deliberately NOT collapsed — tracked.
- **Vendor directory (read-only surfaces): peek at 5 + "Show all (N)"**, with
  ONE shared bidirectional selection — tapping a row highlights its pin,
  tapping a pin highlights its row. Selected pin takes a gold `#ffca3a` ring +
  a 2-cycle settling breath (never a loop), unselected pins dim, selected row
  takes a matching border; reduced motion applies end-states instantly. The
  pin callout is NAME ONLY and collision-aware so it never covers another pin.
  All of it renders through the shared `components/SiteMap.tsx`, which the
  Event Detail, the full-listing preview, AND the Review map toggle all use —
  drift is structurally impossible. The wizard's Details step uses the SAME
  component in interactive mode (tap-to-place) and shows no directory, because
  that step has its own editing list.
- **"Better on desktop" banner shows only below `breakpoints.desktop` (1024).**
  Nothing is gated at any width — the section stays fully usable on mobile.
- **Tab bar: hidden through the wizard AND checkout, RESTORED at the success
  screen and everywhere after.** The create flow is a deliberate chrome-less
  focus mode; the moment the listing goes live the host is back in the app. It
  is implemented by making "You're live" an `href: null` route INSIDE the
  `(tabs)` group, so the tab bar returns structurally rather than being
  redrawn. Checkout `router.replace()`s there on success, which also drops the
  finished create stack out from under the Back gesture.

---

## ARCHITECTURE DECISIONS (locked — protect these)

### 1. Workspace-owns-events data model (THE most important decision)
- A **`user`** is a person (login).
- A **`workspace`** (organizer) is the thing that OWNS events — separate from the user.
- A **`membership`** table links users → workspaces with a **`role`** (owner/editor/viewer).
- **Events belong to a WORKSPACE, not directly to a user.**
- At MVP: every host workspace has exactly ONE membership (the owner). The UI shows none of this
  complexity — it feels like "one account."
- **Why:** makes teams, task assignment, and **account handoff (selling a business)** additive
  later with NO migration. Selling a business = swap membership rows; the workspace and its events
  persist. If events belonged to a *user*, all of that would require painful migration.
- This is a **Claude Code / schema / CLAUDE.md decision.** Lock it at build time.

### 2. Anonymous browse / progressive signup
- Browse WITHOUT an account (Explore, event detail, share links all open to guests).
- **Gated behind an account:** saving events, persisting filters/preferences, creating events.
- Logged-out "Me" = a signup invitation, NOT an empty profile shell. (This is the single best
  conversion moment.)

### 3. Personal ↔ Host = two levels, both progressive disclosure
- **Me hub** = personal/discovery identity (Saved, profile). **Workspace** = host identity
  (listings, RSVPs, reach). The "toggle" is just the existing Me→Workspace tap — no separate
  top-level switch needed.
- **Multi-workspace:** a host with 2+ workspaces taps Workspace → sees a PICKER (one row per
  business, isolated stats). Inside a workspace, a header switcher chip hops between them. A solo
  host (every MVP user) NEVER sees any multi-business UI — it appears only when earned.
- Full multi-workspace richness + teams = **desktop-first roadmap.**

### 4. Time is derived client-side (cost + correctness)
- Countdowns, "NOW" badges, Tonight/Weekend grouping are computed ON-DEVICE from a single
  immutable `starts_at` timestamp. Zero backend cost.
- **NEVER poll or subscribe to keep time displays current.** Refetch only on pull-to-refresh,
  screen focus, or cache expiry.
- Supabase Realtime is NOT used in MVP. RSVP counts refresh on screen focus.
- Store UTC (`timestamptz`), render device-local.

### 5. Responsive strategy (per-surface, not uniform)
- **Discovery surfaces** (Explore, detail, Saved, finder, radius overflow): mobile-first;
  desktop = responsive-clean (centered ~560px max-width column, don't stretch cards). Consumers
  are on phones.
- **Coordinator surfaces** (Create Event, Workspace, Pricing, organizer view): desktop-WORTHY —
  real multi-column layouts. Paying customers work at desks.
- Build mobile first, tag each screen's desktop decision as you go, run ONE responsive batch at
  the end. (Claude Code/Design preview only has a mobile toggle; verify desktop by resizing a
  real browser.)
- **Desktop pass EXECUTED (prototype):** at ≥1024px, coordinator surfaces render OUTSIDE the
  PhoneFrame as full-bleed responsive pages (Option 1; bezel disappears — prototype scaffolding
  only, production Expo web has no PhoneFrame). Create Event = 60/40 two-column wizard w/ sticky
  EventStub preview, site-map section expands full-width; fork centered ~640px; checkout +
  Curbside mini form centered ~560px; Workspace = 4-across stats + listings table; Pricing =
  3-column matrix from canonical PRICING_TIERS; Organizer Profile centered ~720px w/ 2-across
  event grid; Event Detail centered ~640px. Below 1024px everything stays in the phone frame.

### 6. Notifications = channel/category/frequency, fit-gated (design locked, behavior = Code stage)
- **Push fires only for USER-REQUESTED events** (bookmarks/RSVPs), never a discovery firehose.
  OS platforms do NOT rate-limit; over-notifying permanently kills the notification permission.
  Throttling is the app's job, built at Code stage.
- **User-controlled frequency** via inline-editable fields (mirroring Explore's zip/radius
  inline-edit pattern): Push "Event reminders & RSVPs [#]•[unit]" (number + min/hr toggle);
  Nearby "New events within [##] miles"; Weekly digest "A [day] roundup email" (Mon–Sun picker).
  Fields greyed/non-interactive when the row toggle is OFF.
- **Fit-gate:** Push + Nearby auto-disable and LOCK until ≥1 interest is selected. Locked state
  is visually DISTINCT from user-toggled-off and shows a tappable "Add interests to enable →"
  deep-link to the Me hub's Interests & blocks row. Weekly digest is NOT gated — it's the fallback for
  no-interest users (area's top events, weekend-weighted).
- **Quiet hours:** default 9PM–9AM, user-editable. Reached via a subordinate "Quiet hours" link
  under Push (not its own row); link stays visible even when Push is fit-gate-locked.
- **Late-night override control** (design only, firing = Code stage): Never / Ask each time /
  Always (default Ask). Intent: bookmarked/RSVP'd event in quiet hours → 8:59PM permission
  prompt for temporary/permanent override.

### 7. Interests & blocks (Settings home)
- **Persistent home:** the FIRST of the five settings rows on the Me hub (production has no
  Settings screen and no gear — see "ME HUB LAYOUT"; the reference's "Settings → Account"
  grouping does not exist). Previously onboarding-only; this screen is the source of truth
  (real storage = Code stage; the route is a stub as of 2026-07-29).
- **Three mutually-exclusive buckets:** I'm into / Undecided / Not for me — a category lives in
  exactly ONE. Tapping moves it live; counts update.
- **Peek + expand caps:** I'm into 5 / Undecided 6 / Not for me 3; "Show more (N)" only past cap.
- **Taxonomy = the canonical event-category list** (same vocabulary as Create Event categories
  and Explore filters). Onboarding shows a distilled subset; Settings exposes the fuller list.
- **Custom interests: PARKED to Code stage** (taxonomy-pollution/moderation decision).

---

## PROVEN SCREENS (Design-verified, ready for Claude Code handoff)

| Screen | State | Notes |
|---|---|---|
| **Filter finder** (Explore) | ✅ Proven | Inline expanding field; overlays dimmed feed (NOT full-screen). Matches filters only (interests/price/when/distance) via a **filter registry** array — new filters auto-searchable. Exact substring-on-label match (no fuzzy/keyword). Live "N nearby" counts computed from real events. Contiguous-only highlight. |
| **Radius overflow** | ✅ Proven | SEARCH results only — feed stays strict in-radius. Triggers when in-radius matches < 3. Expansion cap `min(radius×1.5, radius+15mi)`. Overflow cards stepped-back, show BOTH "+X mi past radius" AND true total distance. Respects active filters. Finder counts stay strictly in-radius. **Demo distances are a hardcoded `mi` field — production MUST compute from real geography (PostGIS).** |
| **Event detail** | ✅ Proven | Info card = full-width ticket (stripe/perforation/countdown). Category pills → outlined badges. RSVP "stamp" interaction (stripe turns green, Going chip + count, STAMPED mark animates in, CTA → confirmed). 1–3 photo gallery (swipeable hero w/ peek, gradient-pill dots, "1/3" counter, thumbnail strip w/ gold ring). "I'm Going" gradient primary; "Share" secondary outline. |
| **Saved page** | ✅ Proven · **PAST SECTION ADDED 2026-07-29** | Ticket stubs grouped Tonight / This Weekend / Coming Up (section renders only if populated). Compact EventStub variant. Green "Going" / muted "Saved" chips + RSVP count. **Ended events now collapse into a "Past · N" section at the bottom** — see the Saved grouping lock below. |
| **Logged-out "Me"** | ✅ Proven | Signup invitation (not empty shell). Lists what an account unlocks. Browse + share stay open to guests. |
| **Workspace slot** (Me hub) | ✅ Proven · **WIRED 2026-07-23 · REVISED 2026-07-29** | Three states off the real 0015 read path (`me.tsx`): non-host (`useMyWorkspace()` → null) = dashed "+ Create your first event" invitation (**navigates only — no workspace is created**, see the publish-time lock above); host = solid stats card — workspace name + **2 tiles (Active / Upcoming)** from `useWorkspaceStats()`, no gradient, taps `/workspace`; skeleton holds while the membership read resolves (never flashes the invitation, and its silhouette matches the 2-tile card so the slot doesn't reflow). **RSVPs / Saves were REMOVED from this card** — they are per-event numbers, and an aggregate "saves across everything" answered a question no host asks; they move to per-event display on the Workspace screen, zero-suppressed. The RPC still returns all four. At 2+ workspaces the slot shows ONE card — the most recently created (picker still DORMANT). `app/workspace.tsx` is a **STUB** (header + name only). |
| **Create Event** | ✅ **ARC COMPLETE (2026-07-23)** | Mobile-first **5-step** wizard (Basics → When/Where → **Tier** → Details → Review → mock Stripe checkout). Live collapsible EventStub preview + "Preview full listing" through the real Event Detail. Transactional per-event duration-band pricing (NO subscription), publish fee stamped server-side by 0010. Plus site map + vendor pins + directory (0013). See "Paid wizard" locks + the arc summary below. |

### Create Event — pricing spine (LOCKED)
- Transactional, per-event, NO subscription. Price scales by **duration band**: Single-day /
  Multi-day (2–4) / Extended (5+), shown as ONE clean total (no per-day math).
- Two tiers, each priced by band: **Standard** (lower) and **Plus** (higher, unlocks features).
- Modest at launch (fills feed + spam filter), raise as audience is proven. **Charge for features
  + duration, NEVER for feed position** (selling feed rank would break the "no algorithm" brand).
- Real revenue ambition lives in **premium add-on services** built later from community feedback —
  not the base listing fee.
- Price shown at tier-selection AND on Review. Checkout = Stripe-style screen (Apple Pay / Google
  Pay / Link / Card), mock pay now, real Stripe at Code stage.

### Create Event — locked design decisions (today)
- **Unified image experience:** ONE photo section on the Details step. First image = cover by
  default. (Removed the separate cover-image step from Basics — it fragmented the experience.)
- **Map toggle on Review** shows the uploaded **SITE MAP** (amenity/vendor diagram), NOT a Google
  location map.
- Categories uncapped; gentle fade-in warning at the 4th selection; card shows 2–3 badges + "+N".
- Custom category/amenity entry: substring match + dedupe + **blocklist** on hate/harmful terms.
- Site map / amenities / vendors: collapsible section with a "better on desktop" banner — fully
  usable on mobile, nothing gated.
- "Venue Type" removed (didn't surface on card). Toolbar: Bold / Italic / bullet list only.
  "AI Draft" removed. CTA: "Continue to payment" → checkout; pay button "Pay to publish · $X".

### Create Event — OPEN fixes (Bucket 1 + 2, next Design prompt)
- **DATE RANGE still not editable — THIRD failed fix.** Needs a different implementation + the
  agent must DEMONSTRATE changing a date, not just claim it.
- Category popup: reposition under Categories (over the pills); trigger ONCE.
- Time picker: highlight active segment (hour, then minute) like AM/PM; STACK "Start → End".
- Details: restyle the ugly up/down stepper arrows.
- Vendor row: stack Type under Logo + Vendor name.
- Review: the "$X" price isn't showing on the card — make it appear.
- Checkout: real brand names/logos for Apple Pay/Google Pay/Link; debit-card icon for Card.

### Create Event — Code-stage requirements (Bucket 3, NOT fixable in Design)
Real image uploads (cover/gallery/vendor logo), Share button, gallery swipe + social links
rendering on Review, and published events appearing in Workspace. All need real backend/APIs
(Supabase + Stripe + device share). Wire at Code stage.
| **Logo** (Twin Flames) | ✅ Proven | `SparkedLogo.tsx` + favicon SVG + 1024 app icon. |
| **Pricing tiers** | ⚠️ Needs revisit | Built (Standard $10/day, Plus $30/day Recommended, Enterprise Custom). "Everything in X, plus" additive structure. Three checkmark states (orange-outline = included, solid-orange = new in tier, faded = coming soon). **MUST re-sync with Create Event's tier step now that Create is built.** |

---

## PRICING MODEL (LOCKED — full overhaul, supersedes every earlier pricing note)

Strategic frame: Sparked sells LOCAL ADVERTISING/DISTRIBUTION to businesses, not ticketing.
Community-events forum, not a StubHub. No ticket rails at MVP (display entry fee only;
ticketing take-rate = named roadmap item once density exists).

Three tiers, ONE canonical `PRICING_TIERS` source rendered by BOTH the Pricing screen and
Create Event's tier step (per-day model is DEAD everywhere):

| Tier | Single-day | Multi (2–4) | Extended (5+) |
|---|---|---|---|
| **Curbside** (free) | Free | — (up to 3 consecutive days, one span) | — |
| **Standard** | $5 | $12 | $20 |
| **Plus** | $15 | $29 | $49 |

- **Curbside** (rebranded from "Pop-up" tier — the CONSUMER CATEGORY "Pop-Ups" still exists
  separately for businesses): community lane. 1 photo, description, address,
  **up to 3 consecutive days**.
  **1 free post per rolling 100 days** (CHANGED 2026-07-29, migration 0016 — supersedes the
  original 3-single-day-posts rule; casual neighbors free, every-weekend posters graduate to
  Standard). Computed on demand, never a stored counter; enforced by two triggers (quota on
  INSERT, span on INSERT OR UPDATE) — full rules in "Curbside free-tier rules" above.
  $1 gate held in reserve if spam materializes (free→$1 is an easy story; don't launch with it).
- **Curbside category rules:** auto-tagged "Curbside" (mini form has NO category picker),
  Curbside category is FIRST in every category lineup (new-term exposure), EXCLUDED from the
  paid Event wizard's picker. Consumer side: filterable/blockable like any category; feed stays
  distance-pure — NO re-ranking/"balance" (would break the no-algorithm promise). Disclosed
  display-collapse rule = roadmap only if overwhelm materializes.
- **Entry fork** (start of creation): "What are you posting?" → Curbside (free mini form:
  photo/title/description/address/date, "Post it — free", no checkout) or Event (4-step wizard).
  Standard↔Plus switching mid-wizard preserves entered data (fields lock, never clear).
- **Socials moved from Plus to STANDARD** (the Organizer Profile gives links away free —
  charging for them on the card would read as a scam). Plus keeps: 10-photo gallery, paid-entry
  display, site map + vendor pins.
- Multi-post packs (e.g. 10 Standard/$40), QR flyer generator, digest sponsorship, host
  analytics = revenue roadmap. Third paid tier = feature-pulled, post-MVP.

## REFUNDS & CANCELLATION (LOCKED)
- Host cancels 72+ hrs before event: 100% refund. <72 hrs: 50%. Same-day: none.
  (Stripe keeps its processing fee on refunds — absorbed.)
- Consumer display: cancelled event = fully greyed card, address/time stripped, light
  "Cancelled" stamp. Advance cancellations vanish from the feed by event day; SAME-DAY
  cancellations stay visible (greyed) so day-of attendees aren't confused.
- Cancellation must notify bookmarked/RSVP'd users (push/email) — Code stage.

## SCHEMA LOCKS (from the Code-stage conflict report — production rules; prototype is frozen reference and its bugs are IGNORED)

1. **entry_fee vs publish_fee are distinct columns.** Never one `price` field —
   the prototype overloads `price` two ways (feed events = entry fee; wizard =
   publish fee). Card/profile surfaces only ever read `entry_fee`.
2. **Curbside tier id = `curbside`** (prototype still uses `popup` — do not carry
   it into the schema; the consumer category "Pop-Ups" continues to exist
   separately).
3. **events.workspace_id is a foreign key.** Organizer display name is DERIVED
   from the workspace — never a free-text string on the event (prototype's
   organizer strings are a demo shim; sample data even mismatches ws_aurora).
4. **One canonical category taxonomy** feeding Create Event, Explore filters,
   Settings interests, onboarding. Prototype drift to fix in production: 'Live'
   is not a category (kill it); Explore's 9-item INTERESTS list vs the 13-item
   CREATE_CATEGORIES is the exact divergence that breaks fit-matching.
5. **All display dates/times derive from the single UTC `starts_at`.** The
   prototype's hardcoded `date`/`time` strings alongside startISO are a demo shim
   (same trap class as the hardcoded `mi` field).
6. **Curbside category color: NOT green** (green stays semantic-only for
   free/going/confirmed; prototype's `Curbside: '#4ade80'` violates this — pick a
   distinct hue at Code stage; give Outdoors' lime a squint at the same time).
7. **Backstage is NOT a pricing tier.** It's a demand-capture teaser card,
   deliberately outside PRICING_TIERS. Copy spec (LOCKED): vague deliverables —
   "We're building new event and collaboration tools for teams and audiences."
   REMOVE all AR references for now. Keep the interest/beta checkboxes and ADD a
   suggestion box (free-text) under them to collect feedback on this growth area.
8. **saves + rsvps = two independent tables** (an event can be saved AND going
   at once). Pattern rule that decided it: STORE what only transactions change
   (rsvp_count via trigger), COMPUTE what time changes (curbside quota =
   trailing-100-day count). See SCHEMA_PLAN §11.
9. **Extensions install `with schema extensions` — never public.** PostGIS in
   public exposed spatial_ref_sys read-write through the Data API
   (extension-owned: can't RLS/revoke it). Fixed by relocation in 0003;
   applies to every future extension.

**Applied migrations (Sparked-App project):** 0001 core spine (+0002 grants),
0003 PostGIS → extensions schema, 0004 search_path pin, 0005 feed RPC,
0006 saves+rsvps (13/13 behavioral), 0007 event_detail RPC, 0008 curbside
quota gate (9/9 behavioral — SCHEMA_PLAN §6.4, pulled forward from the plan's
never-applied 0003_host_content batch), 0009 curbside attribution
(`curbside_anonymous` flag + RPC name-masking), 0010 publish pricing
(`publish_paid_event` definer RPC + `app.duration_band` + the
publish_fee_cents guard trigger — pricing authority pulled forward from the
never-applied 0004_payments batch), 0011 publish-fee column privacy
(per-column grants on `events` excluding `publish_fee_cents` from both
read and write; member-scoped reader — SCHEMA_PLAN §7.2 ruling, 10/10
behavioral), 0012 reader onto the `app`-definer/`public`-invoker
convention, 0013 `event_vendors` (the Plus site-map/vendor-pins feature —
name/type/logo_path/`pin_x`,`pin_y` as 0..1 relative coords/sort_order, pulled
forward from the never-applied `0003_host_content`; RLS cloned from
`event_categories`, anon read where the parent event is visible, owner/editor
write via `app.is_member`; APPLIED 2026-07-23, verified anon read = 200 empty
and anon insert = 42501), 0014 `publish_paid_event` onto the
`app`-definer/`public`-invoker convention (closes SCHEMA_PLAN §7.2 tradeoff 3;
behavior/signature/error codes unchanged — the public wrapper's `event_id`/`tz`
argument NAMES are load-bearing for PostgREST), 0015 workspace read path
(member-scoped `workspace_stats` RPC — 4 computed numbers, `app`-definer /
`public`-invoker — plus `workspaces.created_by` column-privacy lockdown closing
an organizer→auth-user-id leak on the public Organizer-Profile grant, plus a
`saves(event_id)` index; consumed by `lib/workspace.ts` `useMyWorkspace()` /
`useWorkspaceStats()` — **UI SHIPPED 2026-07-29**, Me hub reads 2 of the 4
stats), 0016 curbside rule change (**1 free post per rolling 100 days, span
≤ 3 days**: `app.enforce_curbside_quota` retargeted 3 → 1, new
`app.enforce_curbside_span` on BEFORE INSERT **OR UPDATE** because
`starts_at`/`ends_at` sit in 0011's UPDATE grant; 6/6 behavioral —
first-post allowed, second rejected `curbside_quota_exhausted`, widest legal
71:59:59 span allowed, 4-day rejected `curbside_span_too_long`,
insert-then-widen-via-UPDATE rejected, paid-tier 14-day span still allowed).
**Migrations apply from files via `npx supabase db push --linked`, never
pasted** — remote history verified matching the repo 2026-07-29, all 16 rows
`local == remote` (0013 had drifted from a dashboard paste and was repaired
with `migration repair --status applied`). Advisor baseline steady at
0 errors / 3 accepted warnings (SCHEMA_PLAN §10.7 — two rls_auto_enable
platform warnings + leaked-password protection, Pro-gated on the Free plan;
DECIDED 2026-07-09: enable with the launch-prep Pro upgrade).

**Auth backend configured (2026-07-09, dashboard only — no app code):**
email confirmations ON; Google OAuth provider ENABLED (GCP web client,
callback `<project>.supabase.co/auth/v1/callback`; secret lives only in the
dashboard, never in repo/chat); redirect allowlist = `sparked://**` (app.json
scheme, standalone builds), `exp://127.0.0.1:8081/--/**` +
`exp://192.168.*.*:8081/--/**` (Expo Go dev), `http://localhost:8081/**`
(Expo web dev). Rate limits left at defaults — NOTE: built-in mailer caps at
2 emails/hr until custom SMTP lands with the email-provider pick.

**App-side auth built (2026-07-09):** tab shell (Explore + Me; Me = the only
auth entry, browsing fully anonymous), persisted sessions (AsyncStorage /
localStorage + AppState token refresh), Google OAuth (web redirect + native
in-app browser w/ deep-link session exchange), auth screen
(signup/login/forgot per design reference), reset-password route, logged-out
Me invitation + signed-in hub (profile name from DB, STATIC workspace
invitation — creation = stage 5). Verified live: Google end-to-end (profiles
trigger fired, 4 real users), persistence across reload, sign-out.
Gotcha for reuse: SVG gradient ids must be useId-generated — url(#id) is
document-global on web and screens stay mounted behind modals.
**Pending: email-confirmation in-app return test** (2/hr built-in mailer cap
hit during testing; retest when the window resets).

**Saves + RSVPs built (2026-07-09):** migration 0006 (saves + rsvps as two
independent tables per the lock, trigger-maintained events.rsvp_count in the
app schema, own-rows RLS — 13/13 behavioral checks PASS via `supabase db
query` role simulation; security advisor baseline intact 0/3). App: engagement
provider (focus-refresh, optimistic toggles), EventStub compact variant +
save/going card buttons, Saved tab (Tonight/This Weekend/Coming Up client-side
grouping), anonymous engagement taps gate to auth. Perf note for the
pre-launch advisor sweep: CLI flags auth_rls_initplan (bare auth.uid()) on
ALL own-rows policies, 0001 + 0006 alike — perf-only, fix in one batch
migration then.

## SCREENS ADDED SINCE THE TABLE ABOVE (all Design-proven)
- **Organizer Profile (public, workspace-owned):** logo/name/bio/location, website + social
  buttons (secondary outline, not gradient), upcoming events as bookmarkable compact EventStubs,
  past events collapsed. Anonymous-browse applies — THE backlink target. Entry: organizer name
  on Event Detail + "View public profile" in Workspace. Consumer-facing data only (no tier/fee).
  Editor lives IN WORKSPACE ("Public profile": logo/name/bio/website/socials + preview).
  Personal Edit Profile vs organizer page disambiguated via subtitles + a one-way cross-link on
  the personal side. Follow-organizer button + URL slugs = roadmap.
- **Privacy (rebuilt, compliance-lean):** Location toggle ("used live, never stored", default ON,
  mirrors OS permission at Code stage) + Usage analytics toggle (default OFF — GDPR opt-in).
  "Download my data" + "Delete account & data" (confirm dialog). ToS + Privacy Policy cards.
  No "cookies" language (native app). Delete cascade at MVP: solo workspace + its events die
  with the account; transfer-before-delete = roadmap.
- **Help & feedback:** FAQ accordion (shared content source w/ landing FAQ) above a
  Suggestion/Issue feedback form (backend = Code stage). "Rate Sparked" row removed — App Store
  rating happens via in-context OS prompt at happy moments (Code stage).
- **Appearance:** System / Dark / Light (default System). Light mode spec: base #f4f5f8, cards
  #ffffff, gradient unchanged, wordmark flat navy. Theme = CSS custom properties
  (APP_THEME_VARS cascading from PhoneFrame); all screens converted to var(--app-*) tokens in a
  3-pass sweep. Keep-rules: text ON photos/gradients stays light; #14213D as brand navy stays
  literal; semantic green becomes #16a34a in light mode.
- **Report event:** muted "Report this event" link at Event Detail bottom → 4-reason bottom
  sheet (Spam/Wrong info/Inappropriate/Other + details) → toast. App Store REQUIRES a visible
  report mechanism; moderation backend = Code stage.
- **Entry fork + Curbside mini form** (see pricing above).
- **Landing funnels (web):** 9 variants planned (/near-me, /tonight built; /host, /free,
  /weekend, /markets, /no-algorithm, /local, /whats-on pending) — ONE shared template, swapped
  copy/hero/filter preset. Shared 10-item FAQ accordion renders at ALL widths. /free + /markets
  CTAs must deep-link the correct fork lane.

## OPEN WORK (in order)

1. **Remaining funnel variants** (7 of 9) from the shared template.
2. **Cold-start empty state** — feed + funnels with zero events in radius (the most common
   real screen at launch; matters MOST on the web funnels).
3. **Apple Developer enrollment — start WEEKS before App Store submission.**
   Identity verification (and D-U-N-S if enrolling as an organization) has
   multi-week lead time; it gates TestFlight and EAS iOS builds. Kick it off
   early, it runs in parallel with build work.
4. **Roadmap (NOT MVP):** teams/roles/task assignment + Backstage permissions (covers the
   multi-business social-manager persona); multi-workspace richness; account handoff;
   advertising content (distinct card anatomy, always "Sponsored"); consumer
   momentum/light-gamification (deferred — contradicts "no algorithm"; NO streaks);
   follow-organizer; text search; ticketing take-rate; third paid tier (feature-pulled).

---

## BUILD HABITS (these have been working — keep them)

- **Demo/mockup as spec of record:** hand the agent the actual proven visual, not just prose. Kills
  ambiguity. Every problem this project hit came from the agent resolving ambiguity on its own.
- **Scope fence in prompts:** explicitly list what NOT to add; "if something seems missing, it's
  intentionally out of scope." The agent over-builds when not fenced.
- **One-sentence confirm tripwire:** end build prompts with "Before coding, confirm in one
  sentence: [X]?" Catches misalignment before code is written.
- **Screen / element / problem anchoring** for UI fixes: name the screen, the element, the problem.
  Removes the agent's need to guess where you're looking.
- **One job per prompt:** don't stack a new feature onto a bug fix. Separate passes stay clean.
- **Verify, don't trust "done":** eyeball the actual screens; reconcile the "edited N files" count
  against the files named in the work log. The agent's edits sometimes partially fail and it
  retries — verification catches silent misses.
- **Answer-consistency check:** when the agent asks several related questions, verify your answers
  are consistent WITH EACH OTHER, not just individually reasonable.
- **Session limits:** when you hit one mid-task, start a NEW chat if the next step needs only the
  spec (most builds/fixes do). Continue-here only when the work needs nuanced back-and-forth.
  Files persist across the new chat. (Stale "Plan · N/4" boxes carrying old todos are just leftover
  context — ignore them.)
- **Git commits** belong in Cursor/Claude Code (production), not Claude Design (prototype). Commit
  after each verified screen once building for real.
- **Manifest habit:** keep the proven-vs-still-building list current (above). It's your handoff
  map — and it's not a tool action, just notes you maintain by judgment.

---

## KEY FILES (Claude Design prototype)
- `AppScreens.jsx` / `Screens.jsx` — screen components
- `FilterFinder.jsx` — filter registry + matcher + highlight
- `Sparked App.html` — app shell / routing / state
- `SparkedLogo.tsx` — logo component
- Canonical data: `PRICING_TIERS` (single source — Pricing screen + tier step + fork card all
  read it, incl. Curbside desc/limit), `SAMPLE_EVENTS`, filter presets (PRICE/WHEN/DIST),
  shared FAQ content (landing + Help & feedback), APP_THEME_VARS (Components.jsx) + 
  colors_and_type.css (theme tokens)
- Screens added late: Settings (Interests & blocks, Notifications editable fields + fit-gate,
  Quiet hours, Privacy, Feedback, Appearance), entry fork + Curbside mini form, Organizer
  Profile (public view + Workspace editor), Report sheet, landing funnels under
  mockups/landings/ (near-me, tonight, shared faq.js/_partials/_shared.css)

## DEMO EVENT DATA (13 events, distances hardcoded from zip 85001 — illustrative only)
In-radius (≤25mi): Art Walk (1.2), Farmers Market (3.8), Riverside Food Trucks (4), Sunset
Songwriters (6.5), Pop-Up Print Fair (12), Indie Film Night (18).
Just past (25–37.5mi overflow zone): Gilbert Night Market (28), Desert Sky Music Fest (31), Cave
Creek Pop-Up (32), Desert Amphitheater (34), Highlands Art Fair (34), Mountain Town Market (36).
Beyond cap (never shows): Far Valley Rodeo (52).
**Production: replace hardcoded `mi` with PostGIS-computed distance from user location.**

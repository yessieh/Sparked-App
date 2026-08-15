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
- [ ] **Blocking a PERSON — PARKED, post-MVP.** Today's blocks are CATEGORY
      blocks: a filter over a taxonomy this user controls. Blocking a person is
      a different kind of thing — a social graph — and it is a whole surface,
      not a toggle: a blocked-users list in Settings, enforcement across the
      feed, event detail AND the organizer profile, and an unblock flow. Every
      one of those is another read path that has to agree with the others, and
      read-path consistency is the thing this project has repeatedly had to
      repair.
      Design it alongside the moderation backend, and **build it only if abuse
      actually materializes.** At launch scale, in one town, with reporting
      already in place, a person-block is speculative infrastructure — and the
      wrong moment to add a fourth axis to event visibility is before there is
      anyone to hide from.

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
- [x] **Published events appear in Workspace — DONE 2026-07-30.** The stub is
      replaced by the real host screen: stats tiles, "+ New event", the
      workspace's PUBLISHED listings (ended ones collapsed into "Past · N"
      through the newly shared `hasEnded()` util), per-event RSVP + Save chips
      (zero-suppressed, via `workspace_event_stats` in **0017** — saves are
      own-rows RLS so the count has to be a server read), an owner-only
      destructive delete, and the dormant multi-workspace picker.
      Listings need no read RPC — member RLS + 0011's column grants already
      cover them.
      **Still open, deliberately out of that scope:** drafts /
      `pending_payment` never appear on this screen; event editing and
      cancellation; the Organizer Profile EDITOR; stats drill-downs. (The
      public Organizer Profile itself shipped 2026-08-02, and Workspace now
      carries a "View public profile" row to it.)
- [x] **Workspace read path + stats RPC — DONE (0015, 2026-07-23).**
      Member-scoped `workspace_stats` (4 computed numbers,
      `app`-definer/`public`-invoker), `workspaces.created_by` column-privacy
      lockdown (closed an organizer→auth-user-id leak on the public Organizer
      Profile grant), `saves(event_id)` index. Consumed by `useMyWorkspace()` /
      `useWorkspaceStats()`.
- [x] **Workspace creation moved to PUBLISH time — DONE 2026-07-29.**
      No longer created on create-flow entry. Curbside creates inside `post()`;
      the paid wizard creates at the top of `toCheckout()` (the Review CTA
      "Continue to payment"). The Me hub invitation now navigates only — it
      previously created a workspace and threw the id away, so tap-and-abandon
      users became hosts with an empty 0/0 card.
- [ ] **Paid wizard writes the event row at the REVIEW CTA, not at checkout
      success** — `status='pending_payment'`, before the checkout screen
      renders; checkout only calls `publish_paid_event` on the existing row.
      `workspace_id` is immutable after insert (0011 withholds it from the
      UPDATE grant), so that insert is the last moment a workspace can be
      created. **Consequence:** abandoning AT checkout still leaves a host with
      an empty 0/0 card (`workspace_stats` counts only `published`).
      **Known possible rework if checkout abandonment materializes:** defer the
      draft insert until after payment — checkout would take the whole draft
      instead of an `eventId`, and `publish_paid_event`'s contract (takes an
      existing event id) would need reworking. Not worth doing on speculation.
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
- [x] **Entry fork keeps the tab bar; the forms hide it — DONE 2026-08-02.**
      `create/index.tsx` moved to `(tabs)/create.tsx` with `href: null`, the same
      treatment as `published.tsx` and `workspace.tsx`. `(tabs)` is a route
      group, so the URL stays `/create` and all three callers were untouched.
      The rule held as written — chrome-less **once there is input to lose** —
      so the Curbside form, every wizard step and checkout stay in the root
      Stack and stay chrome-less.
      Two things the move surfaced, worth remembering for the next one: the root
      Stack's stale `create/index` declaration had to be removed (the identical
      omission during the `workspace.tsx` move produced a loud
      `No route named "workspace"` warning), and `SubHeader` — a shared
      component that lived as a named export of the fork's route file — broke all
      three wizard screens, so it was extracted to `components/SubHeader.tsx`.
      **A shared component living in a route file only works while every
      consumer sits in the same directory.**
- [x] **CHROME RULE AMENDED — public DESTINATION screens keep the tab bar too
      (2026-08-02).** `event/[id]` and `organizer/[id]` moved into `(tabs)` with
      `href: null`. This resolves the cold-arrival dead end that was parked when
      the fork ruling landed.
      **The rule is about unsaved INPUT, not depth.** Both are public content
      and backlink/share targets, so a first-time visitor can arrive with no
      history behind them; without the bar their only control was a Back button
      pointing nowhere. Nothing on either screen can be lost by leaving.
      **Unchanged: the create flow stays chrome-less** — Curbside form, every
      wizard step, checkout. Those hold input, and a stray tab tap losing a
      half-filled event is worse than one extra back-tap.
      Registration note that settles an earlier open question: **a nested
      dynamic route needs no `_layout.tsx` and no workaround.** A directory
      without a layout file is flattened into its parent navigator and addressed
      by slashed name — `<Tabs.Screen name="event/[id]" />` — exactly as the
      root Stack had always declared it, alongside nine other slashed routes.
      The mechanism is navigator-agnostic. Both stale root Stack declarations
      were removed; leaving them reproduced the same `No route named X` warning
      the workspace move hit, for both routes.
- [x] **Back-button alignment across the two public screens — DONE 2026-08-02.**
      Organizer Profile's chip moved to Event Detail's geometry (40×40 r12, top
      12, inset 20 inside an alignSelf-centred 640 container). Event Detail's
      could not move — it floats over the photo hero, paired with the Save chip.
      **Matching the inset alone was not enough**: measured on desktop the two
      still sat 320px apart (left 20 vs left 340), because Event Detail's header
      is centred in a 640 column and Organizer's was full-width. Aligned only on
      phones is not aligned. Chip STYLE stays different on purpose — Event
      Detail's is translucent dark for legibility over a photograph, which would
      be a dark blob on a plain background.
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
- [x] **Curbside quota — DONE (0008), RULES CHANGED 2026-07-29 (0016).**
      Now **1 free post per rolling 100-day window, spanning up to 3
      consecutive days** (was 3 single-day posts). The rolling window is
      computed on demand, never a stored integer. **What it counts was
      repointed 2026-07-30 (0018)** from live `events` rows keyed by workspace
      to an immutable user-keyed consumption ledger — see the Data Lifecycle
      section. Two triggers: consume on AFTER INSERT **OR UPDATE** (0018 — the
      `OR UPDATE` closes draft-promotion), span on BEFORE INSERT **OR UPDATE**
      (`starts_at`/`ends_at` are in 0011's UPDATE grant, so insert-only was
      bypassable). At quota the mini form renders the
      CONVERSION screen ("You've used your free post — Standard is $5"), an
      invitation, not an error. 6/6 behavioral PASS.
      **Accepted:** the span cap is a 72-HOUR duration, not a calendar-day
      count — a trigger has no client tz. A hand-crafted request could touch 4
      calendar days under 72h; the mini form cannot. Fix if it matters: pass tz
      through the insert path.
- [ ] **Curbside category enforcement server-side** — auto-tag on free posts,
      reject Curbside on paid events (prototype only hides the picker options).
- [ ] **Refund enforcement** off the event's `starts_at`: 100% at 72+ hrs, 50%
      under 72, none same-day. Note: Stripe keeps its processing fee on refunds.
- [ ] **Cancellation flow:** greyed "Cancelled" card state, advance cancellations
      drop from feed by event day, same-day stays visible greyed; PUSH/EMAIL
      notification to bookmarked/RSVP'd users on cancel.

---

## PRE-LAUNCH COMPLIANCE GATE (data-lifecycle promises we have not kept yet)

> Everything here is a promise the product or the schema already makes and the
> implementation does not yet honor. Each one is individually small; together
> they are the difference between a defensible retention story and a stated
> policy that is simply untrue. **None of it blocks development — all of it
> blocks real signups.**

- [ ] **BLOCKER — 90-day hard-purge job is UNBUILT.** AD 8 states a 90-day
      retention window on soft-deleted events, and nothing enforces it: today
      `deleted_at` rows live forever. **A stated retention window that isn't
      enforced is worse than none** — it is a claim we would have to defend
      without evidence, and it converts an honest "we keep this indefinitely for
      dispute resolution" into a false statement. Either build the job or change
      the stated window; do not ship the gap. Needs a scheduler decision
      (pg_cron vs. an edge function on a timer) and an explicit rule that the
      purge **must not** take the quota-ledger rows with it — the FK's
      `on delete set null` is what preserves consumption, and this is the path
      that actually exercises it.
- [ ] **BLOCKER — privacy policy must name what we actually retain.** Four
      things it has to cover, none of which are in any draft yet:
      1. **The Curbside quota ledger as a retained category**, held under
         **legitimate-interest fraud prevention** — that is the lawful basis
         that lets it survive an erasure request, and it only works if it is
         disclosed. Minimal by design (identifier + timestamp, no post content),
         which is what makes the interest proportionate.
      2. **The soft-delete retention window** — that a deleted listing is
         retained for up to 90 days before permanent removal, and why (dispute
         resolution, support recovery, ledger integrity).
      3. **Soft-deleted listings** as a category distinct from live ones: a host
         deleting a listing is not erasure, and the copy in-product must not
         imply it is.
      4. **The attendee-history exception** — that a listing you saved or RSVP'd
         to may remain in your own history after the host withdraws it.
      Goes to the pre-launch legal consult together with the retention windows.
- [ ] **"Download my data" export — UNBUILT.** No self-serve export exists.
      Needs to cover profile, saves, RSVPs, workspaces, events, and the quota
      ledger. Pairs with the erasure path, which IS specced (real cascade) but
      has no UI either.
- [ ] **Re-enable "Confirm email" + real SMTP** — see the detailed item in
      LAUNCH INFRASTRUCTURE below. Listed here too because it is the same gate:
      a signup flow that cannot verify an address is a compliance problem, not
      just a deliverability one.

---

## ARC: Privilege hardening (migrations 1-3 — the arc the Curbside anonymity arc waits on)

> **Why this arc exists:** four privilege incidents in this build traced to one
> root cause — a grant written once at object creation and never re-read as the
> features changed around it. All four were found incidentally. The per-arc
> audit gate (CLAUDE.md) is the process fix; these three migrations are the
> backlog that gate surfaced.
>
> **STATUS 2026-08-15: all three migrations are applied, audited and green.**
> The Curbside anonymity arc below, which waited on that, is unblocked. The
> 0023/0024 log backfill remains open under this heading and does not gate it.

- [x] **1 — `0025_grant_hardening_revokes`** (file
      `supabase/migrations/20260810000025_grant_hardening_revokes.sql`, APPLIED
      2026-08-10, audited and committed 2026-08-13). Nine revokes, zero grants.
      Post-arc diff clean — nine deltas, all nine named, zero additions:
      `supabase/audits/baselines/2026-08-13-post-grant-hardening.md`.
- [x] **2 — `0026_default_privilege_revokes`** (file
      `supabase/migrations/20260813000026_default_privilege_revokes.sql`,
      APPLIED 2026-08-13, behaviorally verified and committed 2026-08-15).
      Revokes only, in two parts: PART A stops NEW tables inheriting the
      residue (`alter default privileges for role postgres`), PART B clears
      what the twelve existing tables carry. Post-arc diff clean — section 1
      211 → 115 (−96), section 5 276 → 268 (−8), zero additions, sections
      2/3/4/6/7/8 byte-identical:
      `supabase/audits/baselines/2026-08-13-post-default-privileges.md`.
      Section 9 signed-out + host-side sweep passed 2026-08-15, no behavior
      change. **The source is NOT closed.** "Automatically expose new tables
      and functions" is still ON, a migration cannot turn it off, and while it
      is on this residue can return — PART A is a repair, not a seal, and
      section 5 of the per-arc audit is what catches a reappearance. Turning
      it off stays a FOUNDER-OWNED step. Also still open by design: the
      `supabase_admin` default-privilege entry, which needs membership in that
      role to alter and would fail 42501 from a migration (reasoning in the
      0026 header and the SPARKED_STATE.md entry).
- [x] **3 — `0027_wrapper_search_path_pins`** (file
      `supabase/migrations/20260815000027_wrapper_search_path_pins.sql`,
      APPLIED 2026-08-15, verified and committed the same day). Pinned
      `search_path = public, app` on `public.delete_event`,
      `public.archive_event` and `public.unarchive_event` — the three 0019
      wrappers, and the last three functions in the database whose `config`
      read `(NONE - INHERITS CALLER)`. Bodies reproduced from 0019 verbatim; the
      pin is the only difference. Post-arc diff clean — three `config` cells
      changed, zero rows added or removed, sections 1/2/3/5/6/7/8
      byte-identical: `supabase/audits/baselines/2026-08-15-post-wrapper-search-path.md`.
      **Advisor 6 → 3**, the direct behavioral verification, leaving only the
      two `rls_auto_enable` platform entries and the Pro-gated leaked-password
      protection. **The ACL question came back PRESERVED** — `create or replace`
      kept 0025's PUBLIC revoke on all three, verified in section 4 and in
      `proacl`; no defensive revokes were written into 0027 precisely so the
      diff could answer it. Unlike 0025 and 0026 this one replaced definitions
      rather than only removing privileges, so it got a real host-side pass:
      archive → unarchive → delete, all three working, no behavior change.
- [ ] **Backfill the 0023 and 0024 migration-log entries in SPARKED_STATE.md.**
      Both are APPLIED — 0023 organizer profile read path (2026-08-02), 0024
      update_workspace_profile (2026-08-03) — and neither has a log entry; the
      log jumps 0022 → 0025. Noticed 2026-08-13 while adding the 0025 entry. A
      marker line sits in SPARKED_STATE.md so the gap stays visible in place;
      this is the tracked job to close it. Wants whoever built those two arcs
      rather than a reconstruction from the diffs — the log records INTENT and
      the reasoning behind each ruling, which the SQL does not carry.

**Numbering:** 0026 and 0027 are the expected next file numbers. If another
migration lands between, the NAME is the anchor, not the number.

---

## ARC: Curbside anonymity — column-level privacy (own arc, after migrations 1-3 verify green)

> **The intent this serves:** a Curbside poster who selects "Post without my name"
> must be anonymous to the public **including over the REST API**, remain identified
> in our records for moderation and lawful request, and stay anonymous against
> someone querying PostgREST with the anon key.

- [ ] **The gap.** `events.workspace_id` carries an anon SELECT grant, so
      `/rest/v1/events?select=workspace_id,curbside_anonymous` resolves an anonymous
      poster to their workspace, and `workspaces_select_public` (USING true) plus
      anon's SELECT on `workspaces.name` completes the deanonymization. The RPCs mask
      the name and 0023 nulls `workspace_id` in RPC output; **the direct table read is
      the uncovered path.**
- [ ] **Required order — NON-NEGOTIABLE.** Convert `public.events_within_radius` and
      `public.event_detail` to the `app`-definer / `public`-invoker convention FIRST,
      verify the signed-out storefront, THEN revoke anon SELECT on
      `events.workspace_id`. Reversed, this reproduces the 0020 → 0021 outage: an RLS
      policy expression needs no caller column privilege, but a SECURITY INVOKER
      function body privilege-checks every column it touches, including ones that
      appear only in a WHERE clause.
- [ ] **Mini-form toggle copy ships in THIS arc, not after.** Today "Your post will
      show 'Local host' instead of your name" is display-true and API-false. The
      schema change and the copy must land together or we are making a claim we do not
      back — the same reasoning that removed "verified neighbor."

---

## LAUNCH INFRASTRUCTURE (new — from the pre-launch gate list)

- [ ] **Report backend.** Report sheet exists in UI (App Store gate); wire a
      reports table + review path + auto-hide threshold decision.
- [ ] **Report reasons — Curbside expansion.** The existing 4-reason sheet
      (Spam / Wrong info / Inappropriate / Other, spec in SPARKED_STATE) gains
      two Curbside-specific options: **"Not as advertised"** and **"No longer
      available."** An ADDITION to the existing design, not a new feature — the
      sheet, the link and the toast all stay as they are. It matters because the
      generic four have nowhere to put the two things that actually go wrong
      with a curbside post: the items were not what the photo showed, or they
      were gone before you arrived. Backend still unbuilt either way, so this
      lands with the report backend above rather than ahead of it.
- [ ] **Notify the poster when their listing is reported — PARKED, needs abuse
      thresholds first.** Superficially kind and genuinely useful: a poster
      whose listing has a wrong address wants to know. But wiring reports
      straight through to poster notifications is an abuse vector in both
      directions — one spiteful stranger can nag a poster repeatedly by
      re-reporting, and a live listing can be pressured off the feed by someone
      who simply does not want it there. Needs **report thresholds, dedup per
      reporter, and rate limits** before any notification fires, which means it
      is a piece of the moderation backend, not a precursor to it. Design the
      two together; do not ship the notification half early.
- [ ] **Email service** (Resend/Postmark or similar): weekly digest, payment
      receipts (Stripe receipts OK if configured — deliberate), auth emails,
      cancellation notices. Pick early — digest is a core retention channel.
- [ ] **PRE-LAUNCH BLOCKER — re-enable "Confirm email" + configure real SMTP.**
      Two halves of one gate, both required before real signups:
      1. **Confirm email is currently OFF** in Supabase Auth (turned off for
         dev convenience so test accounts don't need a round-trip). It must go
         back ON — without it anyone can register an address they don't own.
      2. **The built-in mailer caps at 2 emails/hour** and is explicitly not
         for production. It cannot carry live signups, let alone the weekly
         digest. Custom SMTP (Resend/Postmark, same pick as above) has to be
         configured on the **new PROD project** before the confirm toggle is
         worth flipping — otherwise confirmations silently rate-limit and
         signups appear broken.
      Sequence: pick provider → configure SMTP on prod → enable confirm email →
      verify a real signup round-trip on a release build.
- [ ] **Pricing screen isn't built yet.** BUILD_PLAN stage 5 item 9. When it
      lands, its Curbside description MUST read the new rule — **1 free post
      per rolling 100 days, up to 3 consecutive days** — not the original
      3-single-day copy that still lives in the frozen `design-reference`
      `PRICING_TIERS`. There is no `description` column on `tiers`, so this
      copy has no production home yet and can't drift until it does.
- [x] **Lint setup — LANDED 2026-07-30.** `eslint ^9.39.5` +
      `eslint-config-expo ^57.0.0` are declared in `apps/mobile` devDependencies,
      `package-lock.json` is synced, and `eslint.config.js` is committed. The
      2026-07-29 "Cannot find module 'eslint'" failure was the half-finished
      bootstrap, not a broken config — `npx expo lint` runs fine now and
      survives a fresh `npm install`.
- [ ] **Work the lint baseline down: 58 problems (55 errors, 3 warnings).**
      NOT a regression — this is the first time the repo could see its own lint
      output. Standing baseline as of 2026-07-30, by rule:
      **24 `react-hooks/refs`** (reading/writing `Animated.Value` refs during
      render — `EventDetailView` 16, `SiteMap` 4, `EventStub` 4; these are the
      animation paths, so changes here need the human feel-pass, never a
      screenshot check);
      **21 `react/no-unescaped-entities`** (raw apostrophes in JSX copy — the
      codebase does this deliberately and everywhere, so the honest fix is
      probably to disable the rule, not to escape 21 strings);
      **5 `react-hooks/set-state-in-effect`** (the data-fetch hooks in
      `lib/workspace.ts`, `lib/engagement.tsx`, `me.tsx`);
      3 `react-hooks/static-components`, 2 `react-hooks/immutability`,
      2 `react-hooks/exhaustive-deps`.
      Do this as its own pass — mixing it into a feature session would bury
      real changes under formatting churn. **Start by disabling
      `react/no-unescaped-entities`, which is very likely the right call and
      clears 21 of the 55 errors in one line.** The codebase writes raw
      apostrophes deliberately and everywhere; escaping 21 strings to satisfy a
      rule nobody wants makes the copy harder to read for no gain. Re-baseline
      after that and the remaining ~34 become a tractable list.
      Confirmed still accurate 2026-08-02: lint runs, 55 errors, none introduced
      by the 0018–0022 work.
- [ ] **`useWorkspaceStats` double-fetches on Workspace open.** The hook has its
      own mount effect AND the screen's focus effect calls `refresh`, so opening
      Workspace fires two `workspace_stats` calls back to back. Harmless — it is
      a cheap member-scoped read and the second overwrites identical state — and
      deliberately not fixed inside a feature session, since the hook is shared
      with the Me hub. Collapse it during a cleanup pass: either drop the hook's
      internal effect and let callers own the trigger, or have the focus effect
      skip the first fire.
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

## ORGANIZER PROFILE (public surface — built 2026-08-02/03)

- [x] **Read path — DONE (migration 0023).** `organizer_profile(workspace_id)`,
      definer body in `app` + thin invoker wrapper, executable by **anon**
      because this is the anonymous-browse backlink target. Returns the
      workspace's public fields as scalars plus `upcoming`/`past` as jsonb
      arrays — a returns-table of events would yield zero rows for an organizer
      with nothing published, leaving the client unable to tell "new organizer"
      from "no such workspace". One row means found; zero means 404.
      **Lifecycle filters are EXPLICIT, not inherited** — the second surface to
      need this, after `events_within_radius` in 0020, and the migration states
      it as a pattern. `events_select_public` is wrong for a public page twice
      over: its member branch would show a host their own archived events on
      their own public page, and its 0022 attendee-history branch would
      resurface an archived event to a visitor who happened to have saved it.
      Also added `workspace_id` to `event_detail` (drop + create — adding an OUT
      column is a return-type change), **nulled for `curbside_anonymous` rows**:
      a masked name beside a usable id is not a mask.
      Suite: `scripts/qa-0023-organizer-profile.sql`.
- [x] **Anonymous Curbside excluded from the profile — DONE (0023), not in the
      brief.** The same bypass running the other way: listing an anonymous post
      under the organizer's name and logo deanonymizes it as completely as
      leaking the id would. 0009 says the row stays "fully attributed to the
      workspace INTERNALLY" — internally being the operative word. Reversing
      this means accepting that "post without my name" does not survive someone
      opening the poster's profile.
- [x] **Public profile screen + both entry points — DONE 2026-08-02.**
      `app/(tabs)/organizer/[id].tsx`: gradient-initials header (logo is a
      placeholder always — `logo_path` has no bucket behind it), bio, location,
      website/socials as secondary outline buttons, upcoming as compact
      EventStubs, past collapsed behind "Past · N". The screen sorts and filters
      NOTHING — 0023 already did it, and re-deriving would be a second copy of a
      rule that must not drift.
      Entry points: the Event Detail organizer block taps through (gated on
      `workspace_id === null`, never on a client-side re-derivation of
      anonymity), and Workspace gained a secondary "View public profile" row.
- [ ] **Organizer Profile EDITOR — not built.** The host-facing side: editing
      name, bio, location, website and socials from inside Workspace. Logo
      upload is a separate arc and needs Supabase Storage, which does not exist
      (no bucket, no picker dependency, no upload path anywhere in the app).
- [ ] **Verify the Workspace "View public profile" row against a signed-in
      host.** It typechecks and routes correctly, but every verification pass so
      far has run signed out, so the row itself is unexercised. Part of the
      standing signed-in walk backlog.

---

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

## DATA LIFECYCLE — soft delete / archive / quota ledger (LOCKED 2026-07-30)

> Rulings live in SPARKED_STATE "Architecture Decision 8" (amended 2026-08-02 by
> the attendee-history rule). **Most of this section is now BUILT** — 0019
> (columns, RPC trio, RLS rewrite), 0020 (read-path repair), 0021 (anon grants),
> 0022 (attendee-history exception). What remains unbuilt is the 90-day purge,
> the hashed-identifier fallback, and Cancel.

- [x] **Soft-delete read-path enforcement — DONE (0019 + 0020 + 0022).** The
      item that made soft delete real. **The docs said eight read paths; the code
      had twelve** — re-enumerating instead of trusting the count was the whole
      job, and three of the extras were the ones that mattered.
      Client table reads: `saved.tsx`, `me.tsx` next-saved preview,
      `workspace.tsx` listings, and **`checkout.tsx`** (missed by the doc list).
      Functions: `public.events_within_radius` (0009 — **INVOKER**, not the
      `app.events_feed` the old list named), `public.event_detail` (0009 —
      INVOKER, and it has NO status filter of its own, so it is the path most
      dependent on the policy), `app.workspace_stats`, `app.workspace_event_stats`,
      and **`app.event_publish_fee_cents` + `app.publish_paid_event`** (both
      missed by the doc list; the second would have published a deleted event).
      Policies: `event_categories_select_public`, `event_vendors_select_public`.
      Organizer Profile was a future path when this was written; it shipped
      2026-08-02 as a THIRTEENTH read path and is covered — see its own item
      below. There is no separate search path (search is client-side over the
      feed).
      **The structural defence was taken**, as this item hoped: the rewritten
      `events_select_public` is the chokepoint, so a NEW direct read or invoker
      function is safe without remembering. Only the four DEFINER functions,
      which bypass RLS, carry hand-written filters — and getting those wrong is
      exactly what 0020 had to repair.
- [x] **Per-event delete / archive / un-archive — DONE (0019, UI + RPCs).**
      Workspace rows carry a `⋯` overflow menu offering Archive (immediate,
      reversible) or Delete (confirm dialog, no undo offered — the recovery
      window is ours, not the host's). Archived events collapse into an
      "Archived · N" section below Past with un-archive on each row; deleted
      events vanish from the host's view entirely. `archived_at` is a TIMESTAMP,
      not a status flag — see AD 8 for the four reasons.
- [x] **Attendee-history exception — DONE (0022).** What already happened stays
      in the attendee's record; what hasn't yet is the host's to withdraw. Third
      branch on `events_select_public` gated on ended + `app.has_attendance`,
      plus a client-side guard that forces any lifecycle-flagged row into Past
      regardless of countdown math (server decides admission, client decides
      section, and the two clocks can disagree). Deleted-ended rows render inert;
      archived rows keep their tap. Full table in AD 8.
- [x] **Behavioral suite — DONE, 27 assertions** (`scripts/qa-0019-delete-archive.sql`).
      Covers delete/archive/un-archive across every read path, ledger immunity to
      both host verbs AND to a hard delete, non-member authorization, and the
      attendee-history matrix including the stranger case that keeps the
      exception an exception. **Ran 24/25 on first execution**; the one failure
      was a stale assertion, not a product bug (it asserted 0018's hard-delete
      orphaning against 0019's soft delete). Worth knowing for the next suite:
      three separate faults in this file surfaced only at paste time, because
      nothing here can execute SQL against the project — see the dev-connection
      note in Standing Procedures.
- [ ] **90-day hard-purge trailing job (ROADMAP).** Permanently removes rows
      past `deleted_at + 90 days`. Deliberately a trailing job and not a
      cascade-on-delete: the 90 days ARE the dispute-resolution and
      fat-finger window. Needs a scheduler decision (pg_cron vs. an edge
      function on a timer) and a rule for what happens to a purged event's
      ledger rows and any financial records pointing at it — the ledger is
      immutable and must SURVIVE the purge.
- [x] **Curbside quota ledger — DONE (migration 0018, 2026-07-30).**
      `public.curbside_quota_ledger` (`user_id` + `consumed_at` + a nullable
      `event_id`, no content columns), written only by a definer trigger, read
      by `app.curbside_credits_used(user)` which now backs BOTH the gate and the
      UI. `public.curbside_posts_used()` is zero-argument; the workspace-keyed
      1-arg forms are dropped so a stale caller 404s rather than silently
      getting 0. Client repointed (`lib/workspace.ts`, `create/curbside.tsx`) —
      including the `no workspace ⇒ used = 0` shortcut, which was half the
      exploit on its own. Backfilled every existing non-draft Curbside post at
      its own `created_at`.
      **Closed a live exploit**: 0008/0016 counted live `events` rows by
      workspace, so deleting the post refunded the free lane and deleting the
      workspace refunded it again. Soft delete would NOT have closed it — a
      soft-deleted row still counts, but only until the 90-day purge, at which
      point the quota silently returns. Only the ledger makes consumption
      permanent.
      **Two things went beyond the literal repoint, both deliberate:** the gate
      moved to `AFTER INSERT OR UPDATE` (a BEFORE trigger can't satisfy the
      ledger's FK, and in a multi-row insert every BEFORE fires before any
      AFTER), and `OR UPDATE` closes draft-promotion — `status` is in the
      authenticated UPDATE grant, so insert-as-draft → update-to-published used
      to consume nothing. A per-user advisory lock closes the concurrent
      double-tap race that existed under 0008 too.
      GDPR posture: minimal data under legitimate-interest fraud prevention;
      `user_id` is `on delete set null`, which IS the anonymization AD 8
      describes. **Residual accepted:** delete the account, sign up again, get a
      new `auth.users.id` and a fresh quota — closing that needs a hashed-email
      identifier, tracked below. Retention window → pre-launch legal consult.
- [ ] **Hashed-identifier ledger key (ROADMAP, low priority).** The one quota
      door still open: account deletion + re-signup mints a new `auth.users.id`,
      so consumption doesn't follow the person across accounts. Needs a stable
      hashed identifier (email, normalized) stored alongside `user_id` and
      counted as a fallback. Far higher friction than the doors 0018 closed, and
      it collides with erasure semantics — do not build on speculation.
- [x] **RESOLVED — "Delete event(s) & Workspace" STAYS a hard cascade**
      (ruled 2026-07-30). Workspace teardown is the business ending, not
      housekeeping, so it sits with account erasure rather than with per-event
      soft delete. `delete_workspace` is unchanged and now documented as a
      deliberate exception rather than an inherited one. The ledger side is moot
      — consumption survives via `on delete set null` — and this is the single
      path where an attendee's history row does disappear, because the event row
      itself is gone. Accepted.
- [ ] **Cancel — the third verb, NOT BUILT.** Distinct from both: the event was
      going to happen and isn't, so the card stays VISIBLE, greyed and stamped,
      and everyone holding a save or RSVP gets told. Needs the notification
      channel, so it is gated behind the email/push work in LAUNCH
      INFRASTRUCTURE. `cancelled_at` already exists and `event_detail` already
      returns it; nothing writes it yet.

---

## DATA MODEL GUARDRAILS (protect these at schema time)

- [x] **Workspace-owns-events.** Events belong to a workspace, not a user.
      Membership table links users→workspaces with a role. Enables teams +
      account handoff with no migration. Do NOT shortcut to user-owned events.
      ✅ Schema applied (migration 0001: workspaces, memberships,
      events.workspace_id FK, RLS by role).
      **Teams / roles (ROADMAP) — the architecture is already there; what's
      left is UI.** `memberships` carries owner/editor/viewer, `app.is_member`
      takes a role array, and every events policy plus every definer RPC
      already gates on it (0017's `delete_workspace` is owner-only precisely
      because the check was available). Remaining work is therefore
      interface-side: invites, role assignment, and owner-gating the actions
      an editor shouldn't see. **No schema change anticipated** — which is the
      payoff this guardrail was bought for. Two things to expect at build time
      anyway: an invite/pending-membership representation (memberships has no
      client write path at MVP — owner rows come from a definer trigger), and
      a decision on what `viewer` actually sees, since nothing reads that role
      today.
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
      count (never a stored counter), before-insert trigger, member-scoped
      UI-count RPC. Behavioral suite **9/9 PASS**. At quota the form shows the
      CONVERSION screen (invitation, not an error).
      *Two things on this line are now historical, not current:* it rejected
      the **4th** post (0016 retargeted that to the 2nd), and it counts live
      `events` rows (2026-07-30 locks a user-keyed ledger — Data Lifecycle
      section). Left as a record of what 0008 shipped.
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
- [x] **Review "Preview full listing" action — DONE.** Renders the draft
      through the REAL `EventDetailView` in `preview` mode (formatted
      description, photos, fee line, site map for Plus), every consumer action
      inert, persistent PREVIEW bar (`create/event.tsx`, `showPreview`). Reuses
      the real component, so preview drift is structurally impossible.
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

## ME HUB & SAVED (built 2026-07-29)

- [x] **Me hub layout — DONE.** Signed-in Me is logo → profile header →
      workspace slot (3 states) → Saved preview card → five settings rows →
      Sign out. **No settings gear anywhere — the rows ARE settings**
      (Interests & blocks · Notifications · Privacy · Appearance · Help &
      feedback), each opening a STUB at `settings/*`. Signed-out Me untouched.
- [x] **Workspace stats card trimmed to ACTIVE + UPCOMING — DONE.** RSVPs /
      Saves removed; they move to per-event display on the Workspace screen
      (tracked above). Skeleton silhouette updated to match so the slot
      doesn't reflow when stats land.
- [x] **Saved preview card on the Me hub — DONE.** Workspace-card anatomy
      (bookmark chip + SAVED eyebrow + chevron) over a ticket-fragment body:
      title | perforation | countdown, through the shared `Perforation` +
      `eventCountdown` so it can't drift from the EventStub. Previews the next
      upcoming-**or-live** saved event. Empty state forks its two
      destinations — header → Saved tab, "Explore events near you →" →
      Explore — as SIBLING Pressables, not nested (nested behaves differently
      on RN vs web: web bubbles and fires both).
- [x] **Saved tab "Past" grouping — DONE.** Ended events collapse into
      "Past · N" at the bottom, chevron to expand, **collapse state
      session-only**, sorted most-recent-first. "Ended" derives from
      `eventCountdown` — the same util the card's chip renders — so the split
      and the chip can never disagree; live/in-progress events are NOT past.
      Fixed a real bug: 7 of the 10 events under "Coming Up" had already ended,
      because `savedBucket` only ever looked forward from `starts_at`.
      Subtitle now counts upcoming only.
- [x] **Anonymous Curbside identity copy — DONE (see PRICING & CURBSIDE).**
      "Verified neighbor" is gone from every surface; anonymous posts render
      the standard Organizer section reading **"Local host"**. **Standing
      rule: no "verified" language in the product until something is actually
      verified** — claiming a check we don't perform is a
      consumer-representation risk that sits outside Section 230, which covers
      what USERS post, not claims WE make about them.

---

## RESPONSIVE BATCH (one pass, at the end — per SPARKED_STATE §5)

> Screens are built mobile-first with their desktop decision TAGGED, not taken.
> This is where the tags get cashed in. Nothing here is a bug on a phone.

- [ ] **Organizer Profile — back chip sits in a 640 column beside 560 content.**
      On desktop the chip lands ~40px left of where the content column starts.
      Not an accident: aligning it to Event Detail's floating back chip was the
      explicit instruction, and Event Detail's header is centred at 640 while
      the profile's content is 560. Widening the profile's content column to 640
      resolves it and would also close the gap with the recorded desktop target
      (SPARKED_STATE §5 specifies ~720px with a 2-across event grid, which the
      built screen does not yet do). Invisible below 1024px — the chip and the
      content share an edge on a phone. Defer to this batch rather than
      hand-tuning one screen.

---

## POST-LAUNCH POLISH (not blockers — revisit once real usage exists)

- [ ] **Saved preview card on the Me hub — more festive / engaging visual
      treatment.** The card is correct and consistent with the workspace card,
      but it is restrained where it could carry some delight: this is the surface
      that tells someone their weekend has something in it. Deliberately not
      designed further pre-launch — worth doing once there's real saved-event
      behavior to design against.
- [ ] **`Delete ""?` empty-title flash.** Cancelling the per-event delete dialog
      clears `eventToDelete` before the modal finishes its fade, so the title
      renders `Delete ""?` for a frame on the way out. Cosmetic and brief, but
      it looks like a bug. Fix by holding the last title through the exit
      animation (a ref, or keep the object and drive visibility off a separate
      boolean) rather than by shortening the animation.
- [ ] **"Removed by host" chip on inert deleted rows in Saved.** Deleted-and-ended
      events stay in an attendee's Past (0022) rendered dimmed with no tap
      target. That reads as "history" but does not say WHY it can't be opened.
      A small chip would close the gap. Deliberately not invented during the
      0022 build — the dimming is the minimal honest treatment and the label is
      a copy/design decision, not an implementation detail.

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
      **Applied through 0022** (0019 soft delete + archive, 0020 read-path
      repair, 0021 anon lifecycle-column grants, 0022 attendee-history
      exception). Full per-migration detail lives in SPARKED_STATE's
      "Applied migrations" paragraph — that list is the authoritative one; keep
      it current rather than duplicating it here.
      **NEVER edit an applied migration** — see CLAUDE.md. This is not
      theoretical: six read-path filters were "fixed" by editing 0009/0010/0012/
      0015/0017 after they had run, so none of them reached the database and the
      repo described a schema no database had. `migration list` compares VERSION
      NUMBERS, never file contents, and reported a clean all-green the entire
      time. Repaired by 0020.
- [ ] **No way to execute SQL against the dev project from a session.** There is
      no `psql`, no `pg` client, no service-role key, and `supabase/.temp/pooler-url`
      carries no password; `db push` is the only SQL channel, and abusing it as a
      test harness would violate the migration-history rule above. The
      consequence is real and repeated: **every QA suite is written blind and
      first executes when Jas pastes it into the dashboard.** The 0019/0022 suite
      took three round-trips that way — a wrong function arity, then identity
      drift across sections, then a stale assertion. Worth deciding whether a
      dev-only connection string is cheaper than the loop. Dev project only,
      never prod.
- [x] **QA cleanup runs from `scripts/qa-cleanup.sql`** — not ad-hoc DELETEs.
      The standing QA address is **`18680 S Nogales Hwy`**; use it for every
      test listing. The script previews, deletes (prefix-matched, because the
      geocoder rewrites the address — the same test event has appeared as both
      the bare street and the full `…, Green Valley, AZ 85614` form), then
      verifies. Seeded demo events are excluded explicitly. Deletes cascade to
      categories / vendors / saves / rsvps. DEV ONLY — never against prod.
      **Exempt from the soft-delete lock, deliberately:** this is a
      service-role maintenance tool for removing QA cruft, not a host action.
      It hard-deletes on purpose and should keep doing so — a soft-deleted test
      listing is still a row in the way.
      **Clears the quota ledger too, as of 2026-07-30 (ruled with 0018).** New
      section 2a deletes `curbside_quota_ledger` rows for the matched events
      **before** the events themselves — once they're gone their `event_id` is
      already NULL (SET NULL, not cascade, on purpose) and there is no way left
      to identify them. Without this, every QA Curbside post would burn its
      poster's one free post for 100 days and the next walk would meet the
      conversion screen instead of the form. Dev-only exemption; nothing in the
      app may ever delete a ledger row.

---

## VERIFICATION REMINDER
For each item: wire it, then VERIFY behavior directly (don't trust "done").
Reconcile edited-file counts against the work log. Commit to git after each
verified change (production = Cursor/Claude Code, so commits belong there).

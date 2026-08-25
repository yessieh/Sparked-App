# Sparked — Accessibility record

**This file accumulates.** One entry per UI arc that changes color, contrast,
focus, motion, labelling or assistive-tech exposure. It is the record a reviewer
reads later, so each entry states **what was measured, against which surface, and
what the measurement does not establish** — the same discipline CLAUDE.md's
"Name the verification baseline" rule applies to schema work.

## Method, applied to every entry below

- **Ratios are WCAG 2.x relative-luminance contrast**, sRGB, computed from the
  hex values in `apps/mobile/src/theme/colors.ts`.
- **Non-text elements are held to WCAG 1.4.11 — 3:1.** Stripes, borders, icons,
  chips and focus rings are non-text. Body copy is held to 1.4.3 (4.5:1) and is
  measured separately when an entry touches it.
- **Translucent surfaces are COMPOSITED before measuring, never approximated.**
  Dark cards are `rgba(255,255,255,0.04)` over `#14213D`, which composites to
  **`#1d2a45`** — measuring against raw `#14213D` instead flatters every value by
  roughly 0.5–0.7 and is wrong. Light cards are opaque `#ffffff`.
- **Both the card surface and the page background are reported**, because cards
  and full-bleed surfaces both exist and a value has to clear the harder one.

### Reference surfaces

| Surface | Dark | Light |
| ------- | ---- | ----- |
| Page background | `#14213D` | `#f4f5f8` |
| Card (composited) | **`#1d2a45`** | `#ffffff` |

---

# Entry 1 — 2026-08-16 — EventStub / Event Detail stripe: category → lane

**The arc:** the card stripe stopped encoding CATEGORY (13 ids, 9 assigned hues)
and started encoding LANE — free community post (Curbside) vs paid listing
(Standard / Plus). Two values per mode instead of ten.

## THE HEADLINE: light mode was failing 1.4.11 on every card, and had been since the palette shipped

Not a footnote and not a side effect of this arc — a live defect the arc was
measured into finding. **All ten stripe values failed 3:1 against `#ffffff`
cards.** They passed comfortably in dark mode, which is why nobody caught it: the
palette was authored dark-first and light mode inherited the same hexes unchanged.

| Category | Hex | Dark vs `#1d2a45` | **Light vs `#ffffff`** |
| -------- | --- | ----------------- | ---------------------- |
| curbside | `#818cf8` | 4.79:1 ✅ | **2.98:1 ❌** |
| markets | `#2dd4bf` | 7.68:1 ✅ | **1.86:1 ❌** |
| music | `#f472b6` | 5.40:1 ✅ | **2.65:1 ❌** |
| art | `#a78bfa` | 5.25:1 ✅ | **2.72:1 ❌** |
| food | `#fbbf24` | 8.56:1 ✅ | **1.67:1 ❌** |
| community | `#fb923c` | 6.31:1 ✅ | **2.26:1 ❌** |
| pop-ups | `#38bdf8` | 6.67:1 ✅ | **2.14:1 ❌** |
| outdoors | `#84cc16` | 7.23:1 ✅ | **1.98:1 ❌** |
| family | `#fb7185` | 5.31:1 ✅ | **2.69:1 ❌** |
| *fallback* (wellness / nightlife / sports / tech) | `#FCA311` | 7.07:1 ✅ | **2.02:1 ❌** |

Worst case `#fbbf24` at **1.67:1** — less than half the required ratio.

**The generalisable lesson, recorded because it will recur:** these were Tailwind
`*-400` defaults, a scale tuned for use ON dark backgrounds. Dropping that family
into a light theme unchanged fails by construction. **A dark-first palette does
not become a light palette by reusing its hexes** — every non-text color needs
its own light value, which is exactly what the semantic-green precedent
(`#4ade80` → `#16a34a`) already established and what this map skipped.

## After — all four values pass

| Lane | Mode | Hex | vs card | vs page |
| ---- | ---- | --- | ------- | ------- |
| Free (Curbside) | dark | `#E8964A` | **6.05:1** ✅ | 6.76:1 ✅ |
| Paid (Standard/Plus) | dark | `#E86F52` | **4.65:1** ✅ | 5.19:1 ✅ |
| Free (Curbside) | light | `#C4762E` | **3.51:1** ✅ | 3.22:1 ✅ |
| Paid (Standard/Plus) | light | `#C4472C` | **4.90:1** ✅ | 4.50:1 ✅ |

No hex needed correcting — the proposed light pair cleared 3:1 as specified. The
tightest is light Curbside at **3.51:1**, still ahead of the semantic-green
precedent it was modelled on (`#16a34a` on white = 3.30:1).

Ten failing values in light mode became **zero**.

## The two stripes are 1.30:1 / 1.40:1 apart, and that is deliberate

**Dark `#E8964A` vs `#E86F52` = 1.30:1. Light `#C4762E` vs `#C4472C` = 1.40:1.**

Stated plainly rather than buried: **at that separation the two lanes are not
reliably distinguishable from each other** — not for a user with a colour-vision
deficiency, and not for anyone on a dim screen or in sunlight. The stripe is
subtle reinforcement, not a signal anyone is asked to decode.

**That is acceptable only because the stripe is never the sole carrier**, and
that property is structural rather than incidental:

1. A Curbside post is auto-tagged `curbside` by 0001's `auto_tag_curbside`
   trigger — the mini form has no category picker, so the tag cannot be omitted.
2. `curbside` is `sort_order = 0` in `public.categories`, and every read path
   orders categories by `sort_order`.
3. `CategoryBadges` caps at 2 with `+N` overflow — and because curbside sorts
   first, **it can never be the badge pushed into the overflow.**

So the CURBSIDE badge renders the lane **as text, always**, and colour adds
emphasis to a distinction already stated in words. If any of those three
properties changes, this justification lapses and the pair needs re-deciding.

**WCAG 1.4.1 (Use of Colour) is satisfied for the same reason** — no information
is conveyed by the stripe alone.

## Assistive technology

**Fixed this pass:** the stripe was a bare `<View>` with no role and no label, so
screen readers could surface it as an unlabelled element carrying nothing. It is
decorative — the lane is in the badge text — so it is now hidden rather than
described, at all three sites:

- `components/EventStub.tsx` — compact variant
- `components/EventStub.tsx` — photo / expanded variant
- `components/EventDetailView.tsx` — the animated ticket stripe

Each carries **three** props: `aria-hidden`, `accessibilityElementsHidden` (iOS)
and `importantForAccessibility="no"` (Android).

**The third one was added because a DOM check caught its absence, and that is
worth recording as a pattern.** The arc originally shipped only the two native
props — which typecheck cleanly, read correctly, and **do nothing on web.**
Querying the rendered page showed `aria-hidden` absent on all ten stripes: on
react-native-web, `accessibilityElementsHidden` is iOS-only and
`importantForAccessibility` is Android-only, so every stripe was still exposed to
assistive tech in the browser — which is also the surface used for review.

`aria-hidden` is a typed `View` prop in React Native 0.86
(`ViewAccessibility.d.ts`) and is forwarded by react-native-web 0.21
(`forwardedProps/index.js`), so one prop covers all three platforms.

**Standing rule for future entries: an accessibility prop is not verified by the
typechecker.** Both native props compiled, were spelled correctly, and were
inert on the platform being looked at. Assert the rendered output.

### Verified in the DOM, not just in source

| Check | Result |
| ----- | ------ |
| Distinct stripe colours rendered | **exactly 2** — `rgb(232,150,74)` and `rgb(232,111,82)` |
| Stripes with `aria-hidden="true"` | **10 of 10** |
| Free-lane stripes vs CURBSIDE badges | **4 = 4** |

The last row is the meaningful one: the number of free-lane stripes was compared
against an **independent** signal — the count of rendered CURBSIDE badges — so
the lane derivation is confirmed end to end (`tier_id` → `laneFor` → palette →
painted pixel) rather than merely confirmed to be self-consistent.

The Event Detail stripe also animates lane-colour → semantic green on RSVP. That
state change is announced by the Going chip and the CTA label, so hiding the
stripe removes no information.

## STATUS OF THE LIGHT PAIR: COMPUTED, NEVER RENDERED

**`#C4762E` and `#C4472C` have never been drawn on a screen.** Their ratios are
arithmetic from the hex values, and that arithmetic settles the contrast
question — but no human and no tool has seen these two colours in place.

**The reason is structural, not an oversight: light mode is unreachable through
the app today.** The Appearance screen (System / Dark / Light) is one of the five
Me-hub settings rows that currently open a "Coming soon" stub, so
`setPreference` has no caller and the theme preference is permanently `'system'`.
That leaves the OS-reported scheme as the only path in, and dark is the
dark-first default for anything the OS does not report as light.

Attempted during this arc and recorded as a negative result: forcing
`prefers-color-scheme: light` in the browser flipped the media query
(`matchMedia('(prefers-color-scheme: light)').matches === true`) while **all ten
stripes kept rendering the dark pair** — `useColorScheme()` did not propagate the
emulated change to the provider. So even the emulated route did not exercise the
light palette.

**What this owes, and when:** a real device check of both light values — and of
every other `lightPalette` token, since none of them have been rendered either —
**at the moment the Appearance screen is built.** That is the first point at
which light mode becomes reachable by a user, and it should not ship without one.
Until then, treat every light-mode ratio in this file as verified-by-computation
only.

## What this entry does NOT establish

- **Nothing about the category badges.** They remain flat `#FCA311` on
  `rgba(15,26,48,0.72)` regardless of category, and were explicitly out of scope.
  **Unmeasured — badge text is small (8.5px, weight 800) and is TEXT, so it owes
  4.5:1 under 1.4.3, not 3:1.** Next UI arc that touches them should measure
  first; it is the most likely place for the next failure of this class.
- **Nothing about SiteMap**, which carries **two open items**, both owing work
  this entry does not do:
  1. **SiteMap needs its own accent decision.** Its `tint` still resolves from
     the legacy category map (quarantined in `theme/categoryColors.ts`),
     deliberately unchanged this pass — pointing it at the lane would render
     every site map one colour, since site maps are Plus-only and Plus is never
     Curbside. The likely answer is a fixed brand colour, at which point the
     legacy map is deleted outright.
  2. **Those tints are UNMEASURED here and carry the same light-mode failure**
     documented in the table above — they are the identical nine hexes, so
     against `#ffffff` they land in the same 1.86:1–2.98:1 band. They were left
     in place knowingly. **Whichever colour the decision above picks owes a
     contrast measurement in both modes before it ships**, and it must not
     inherit a value from that table.
- **No rendered verification of the dark pair beyond the browser.** The DOM
  checks above confirm the correct hexes reach the painted element in Expo web.
  They do not establish appearance on real iOS/Android hardware, colour-profile
  behaviour, or how the pair reads in sunlight. Per CLAUDE.md's
  verification-budget rule that is a human feel-pass. **Dark mode passed that
  review on 2026-08-16; light mode has not had one and cannot yet have one — see
  the section above.**
- **No audit of focus rings, touch-target sizes, or reduced-motion behaviour**
  on the surfaces touched. Not regressed by this arc; simply not measured.

## Reproducing these numbers

The ratios come from a throwaway script, not a committed tool — a standard
WCAG 2.x relative-luminance implementation over the hexes in
`apps/mobile/src/theme/colors.ts`, compositing `rgba(255,255,255,0.04)` over
`#14213D` for the dark card surface. Any conforming contrast checker reproduces
them, provided it is given the **composited** `#1d2a45` rather than the raw navy.

---

# Entry 2 — 2026-08-19 — The two "nothing to show you" states

**The arc:** cold-start empty feed (Explore) and event-not-found (event detail).
They shipped together because they are one problem — a screen with no content
and no explanation — and they share one component, `components/EmptyState.tsx`,
which exists to own the ANNOUNCEMENT rather than to save duplicated markup.

Before: the empty feed rendered one muted sentence with no control and no
announcement; event detail **spun forever** on any id the caller could not see,
because a successful RPC returning zero rows left `event === null` and
`error === null`, and the only branch that could catch that was unreachable
(`!event && error !== null` is implied by the `error` test above it).

## THE HEADLINE: a live region that mounts with its text does not announce

`aria-live` announces content that changes **after** the region is already in
the tree. A region mounted together with its message is unreliable across
screen readers — the failure is silent, and it looks correct in source, in a
DOM snapshot, and to the typechecker. Both screens were restructured around it:

- **Explore** — `ListEmptyComponent` already mounts while `events === null`, so
  the region wraps that whole phase and only its children swap.
- **Event detail** — previously two separate `return`s (spinner, then content),
  which mount different subtrees. Now **one returned subtree spans loading and
  missing**, so the region node survives the transition. This is the reason the
  spinner moved inside `EmptyState` instead of staying a branch of its own.

`ListEmptyComponent` is passed as an **element**, never as an inline
`() => <…>`. An inline arrow is a new component type on every render, which
would remount the region and break the announcement it exists to make.

### Verified in the DOM, including node identity

Sampled every 50ms across the real transition (react-native-web 0.21.2, Expo
web dev server, dark mode, signed out):

| Check | Result |
| ----- | ------ |
| `[aria-live="polite"]` on the empty feed | **1** |
| `[role="status"]` on the empty feed | **1** |
| Region text == shipped copy, both screens | **exact match** |
| Event detail: distinct region nodes across loading to missing | **1** |
| Phase 1 (~1500ms, forced delay) | node 0, empty text — spinner inside the region |
| Phase 2 | node 0 — **same node**, text swapped in |
| Explore widen: same node before / after resolve | **true**, text changed |
| Regions left visible in the DOM after leaving a state | 0 |

**The node-identity row is the meaningful one.** Asserting only that
`aria-live="polite"` is present would have passed against a region that
re-mounts on every transition and therefore never announces. The attribute
check confirms the prop reaches the DOM; only node identity confirms the
mechanism works.

An independent positive check on the widen path: the recorded RPC payload was
`{ origin_lat: 31.9576, origin_lng: -110.9556, radius_miles: 50 }`, so the
control reaches the server rather than only repainting the header.

**Baseline:** checked against the running Expo web dev server at
`localhost:8081` on 2026-08-19, against `main` @ `8ec6f4a` plus this arc's
working tree. Empty results were produced by intercepting `window.fetch` in the
page — no source and no database was modified. **This does not establish native
behaviour** (see the platform table below), nor appearance on real hardware.

### Platform coverage of the announcement, traced not assumed

| Platform | Mechanism | Evidence |
| -------- | --------- | -------- |
| web | `aria-live` forwarded to the DOM attribute | rnw 0.21.2 `forwardedProps/index.js:47`, `createDOMProps/index.js:460` |
| Android | RN maps `aria-live` to `accessibilityLiveRegion` | rn 0.86 `View.js:66-68` |
| iOS | **neither of the above does anything** — covered by `AccessibilityInfo.announceForAccessibility`, gated to iOS so Android does not announce twice | rnw compiles it to an explicit no-op on web (`AccessibilityInfo/index.js:79`) |

`aria-live` is a typed View prop in RN 0.86 (`ViewAccessibility.d.ts:255`) and
`role="status"` is a valid `Role` value (`:406`), so one spelling covers all
three platforms. **`accessibilityLiveRegion` and `accessibilityRole` both log
deprecation warnings in rnw 0.21.2** (`createDOMProps/index.js:456`, `:605`) —
prefer `aria-live` and `role`. Per Entry 1's standing rule the iOS path is
written but **NOT verified**; it is on the human list.

## A second inert-prop finding, same class as Entry 1's

**The two shared CTA components rendered as `div[tabindex="0"]` with no role.**
`GradientButton` and `SecondaryButton` (`components/AuthControls.tsx`) set no
role, so react-native-web emitted a bare focusable div and screen readers
announced focusable text, not a button — **WCAG 4.1.2**. Found by querying the
rendered DOM, not by reading source: it typechecks clean and looks correct in
JSX, because the defect is an ABSENCE.

Fixed by adding `role="button"` to both. **This is a shared-component change
beyond the arc's stated file list**, taken because shipping two new buttons that
screen readers do not announce as buttons is not defensible. It also repairs the
auth screen and the Me hub, which use the same two components. No visual change.

**Standing rule, restated because this is the second time: an accessibility prop
is not verified by the typechecker, and its ABSENCE is not caught by source
review either.** Assert the rendered output.

## Contrast — measured against the real composited surfaces

Body copy is held to **1.4.3 (4.5:1)**, not the 3:1 Entry 1's stripes were held
to. Dark mode is the rendered surface; light is computed-never-rendered.

### Dark — all pass

| Element | Colour | Surface | Ratio |
| ------- | ------ | ------- | ----- |
| Headline | `text` `#eef0ff` | bg `#14213D` | **14.11:1** |
| Body / subline | `textMuted` composites to `#81899e` | bg `#14213D` | **4.57:1** |
| Primary CTA label | `brand.navy` on spark gradient | worst stop `#ff5f4e` | **5.32:1** |
| Secondary CTA label | `text` `#eef0ff` | `cardBg` `#1d2a45` | **12.62:1** |

### BINDING CONSTRAINT: these states must stay on the bare page background

**`textMuted` clears 4.5:1 by 0.07 on the page background (4.57:1) and FAILS at
4.32:1 on a card surface (`#1d2a45`).** That is not just a measurement, it is a
constraint on future edits: moving either state into a card — the obvious
"make it feel less bare" change — silently drops the body copy below 1.4.3.
**Any future move onto a card requires a different body colour.** For the same
reason `textFaint` cannot carry any of this: 2.92:1 on the background and
2.85:1 on a card, below even the 3:1 non-text floor.

### Light — COMPUTED, NEVER RENDERED, and the body line FAILS

Same status as Entry 1's stripe pair, and unreachable for the same structural
reason (the Appearance screen is still a "Coming soon" stub, so the theme
preference is permanently `'system'`).

| Element | Colour | Surface | Ratio |
| ------- | ------ | ------- | ----- |
| Headline | `#1c2840` | bg `#f4f5f8` | 13.50:1 |
| **Body / subline** | `textMuted` `#7a849e` | bg `#f4f5f8` | **3.43:1 — FAILS** |
| Primary CTA label | `brand.navy` on gradient | `#ff5f4e` | 5.32:1 (mode-independent) |
| Secondary CTA label | `#1c2840` | `cardBg` `#ffffff` | 14.72:1 |

**The failure is the token, not this arc.** `lightPalette.textMuted` is used as
body copy on every screen in the app; at 3.43:1 it is below 1.4.3 everywhere it
appears in light mode. It could not be fixed inside this arc's "no new colours"
constraint. **Owner: the Appearance arc**, at the same moment Entry 1's light
stripe pair gets its first real render.

### STANDING RULE — the only two mode-safe label treatments

Discovered while computing the above, and recorded because it will recur:

> **Navy-on-spark-gradient and `colors.text`-on-card are the only two label
> treatments in the app that pass 4.5:1 in BOTH modes.** Accent-coloured text
> does not: `brightOrange` is **1.85:1** and `sparkOrange` **2.13:1** against the
> light background. Any new CTA uses one of the two, or owes a measurement.

Same root cause as Entry 1's headline finding — a dark-first palette whose
accents were never given light values.

## Touch targets — WCAG 2.5.5

Measured with `getBoundingClientRect()` rather than inferred from padding, at
both 1280x800 and 375x812:

| Control | Desktop | Mobile |
| ------- | ------- | ------ |
| Widen to 50 miles | 300 x **51** | 295 x **51** |
| Post something yourself | 300 x **48** | 295 x **48** |
| Back to Explore | 300 x **46** | 300 x **48** |

`minHeight: 44` is set explicitly on all three rather than left to padding
arithmetic. No horizontal overflow at 375px.

## The not-found message distinguishes NOTHING, and that is load-bearing

`app.event_detail` (0028 PART C) returns zero rows **and no error** for
archived, deleted, draft, `pending_payment`, never-existed, and
exists-but-not-entitled alike. The indistinguishability is enforced at the data
layer; the UI's only job is not to break it.

One neutral message covers all of them. The copy is deliberately disjunctive
("may have expired, or it may not be public") and deliberately incomplete. It
does not say archived, removed, deleted, private, "no longer", or "was" — each
would confirm a hidden row exists. **There is no "contact the organizer" line,
because that implies there is an organizer.** A `LoadState` comment in
`event/[id].tsx` states this so a future branch is not added casually.

Malformed ids route to the same state (shape-checked client-side, with a `22P02`
fallback), which also keeps a raw Postgres `invalid input syntax for type uuid`
off a stranger's screen.

**Verified:** rendered `innerText` for a malformed id and for a well-formed
nonexistent id is **byte-identical**, and a scan of the rendered page for
archiv / delet / remov / private / "no longer" / organizer / draft / cancel
returned **zero** hits. **Not verified: the archived case** — it needs a real
archived event id, which the test data no longer provides — the event was
un-archived before the check ran. Still on the human list.

## What this entry does NOT establish

- **No screenshots from the build session.** The Browser pane could not
  composite frames while the arc was being built, so layout and contrast were
  computed and DOM-measured only. **Partially closed since, on device, dark
  mode: the NOT-FOUND state was confirmed rendering correctly for a
  nonexistent uuid, and reads fine without the icon tile** (the element
  dropped by ruling — see the header note in `components/EmptyState.tsx`).
  That is the human feel-pass CLAUDE.md's verification budget calls for, and
  it covers ONE of the two states.
- ~~**The COLD-START EMPTY FEED has never been seen rendering from a genuinely
  empty result.**~~ **CLOSED 2026-08-20, on device.** Every check up to this
  point reached the empty state by intercepting `window.fetch` in the browser,
  which proves the component renders given an empty array but not that the
  empty array arrives the way production delivers it — that gap was the
  weakest link named at the time. **Closed by a real device pass against
  Phoenix, AZ**, an origin with no seeded events in radius, so the empty
  result came from the live RPC returning zero rows rather than from an
  intercepted response. Confirmed visually correct. This is the human
  feel-pass CLAUDE.md's verification budget calls for; it was performed by
  the reviewer on device, not reproduced in this session, so it establishes
  appearance and behavior on that device and run, not a repeatable DOM
  assertion this file can re-check on the next change.
- **Nothing about iOS.** The `announceForAccessibility` call is written and
  gated to iOS; it has never run.
- **Nothing about the archived-event path**, only never-existed and malformed.
  **Named because the reason matters: the test event was UN-ARCHIVED before
  that check ran**, so the archived case was never rendered. It rests on the
  RPC filter (`app.event_detail` returns zero rows for it, same as every other
  unreachable id) and on the QA suite — not on a rendered confirmation. The
  indistinguishability argument is structural and still holds; what is missing
  is the empirical leg.
- **`saved.tsx`'s empty state is a live 1.4.3 FAILURE and was left alone.** Its
  body sentence renders in `textFaint` at 12px — **2.92:1 against a 4.5:1
  requirement** — and its icon sits below the 3:1 non-text floor too. Out of
  scope this arc; **open item.**
- **`me.tsx:440` is a latent light-mode failure.** "Explore events near you →"
  is `brightOrange` text, **1.85:1** on the light background. Invisible today
  because light mode is unreachable; it fails the moment Appearance ships.
  **Open item**, and the reason the standing rule above is written down.
- **No audit of focus rings or reduced-motion** on these surfaces. This arc adds
  no motion. Not regressed; simply not measured.
- **Navigating event to event still shows the previous event's content while the
  next one loads** — the route component is reused, so the screen does not
  return to its loading phase. Pre-existing (the old code held the stale `event`
  the same way), unchanged here, and out of scope: this arc is about the empty
  result, not the wait.
- **Backgrounded screens were checked, not assumed:** a departed route's live
  region stays in the DOM, but its container carries `aria-hidden="true"`, so it
  is out of the accessibility tree. Confirmed, not inferred.

---

# Entry 3 — 2026-08-20 — Explore header: editable location + radius (Stage 2a)

**The arc:** the Explore header's `"Sahuarita, AZ · within 25 mi"` stopped being
a literal string and became two controls. Both values are user-set, both persist
device-locally (`lib/origin.tsx`), and a typed place must be **confirmed against
a resolved candidate list** before it becomes the feed's origin. The
`TEST_ORIGIN` constant and `lib/devOrigin.ts` are retired.

## THE HEADLINE: a 44px-tall target that was 29px wide

The radius control set `minHeight: TARGET` and no `minWidth`. Height passed at
exactly 44; the rendered box measured **29 wide** around a two-digit number — a
**WCAG 2.5.5 failure that a height-only assertion reports as green.**

Found by measuring `getBoundingClientRect()` on both axes. Entry 2 established
measuring rather than inferring from padding; this entry adds the narrower
lesson: **measure BOTH axes.** `44 x 29` and `44 x 44` are one property apart in
source and indistinguishable in a checklist that records only "minHeight set".

Fixed with `minWidth: TARGET` + `alignItems: 'center'`. Re-measured: 44 x 44.

| Control | Rendered | Pass |
| ------- | -------- | ---- |
| Change location | 94 x 44 | OK |
| Change search radius (before) | **29 x 44** | FAIL |
| Change search radius (after) | 44 x 44 | OK |
| Town/zip input | full-width x 44 | OK |
| Each candidate row | 490 x 44 | OK |

## The live region is REUSED, not reinvented — and it is the subline itself

Entry 2's mechanism, applied to a second surface. The subline `View` carries
`role="status"` + `aria-live="polite"`, is mounted from first paint **including
through the pre-load placeholder**, and only its children swap.

**Verified by node identity across a real location change**, which is the check
that separates a working region from a present attribute:

| Check | Result |
| ----- | ------ |
| `[role="status"]` on Explore | **1** (EmptyState's is absent while the feed has rows) |
| `aria-live` | `polite` |
| Text before | `Sahuarita, AZ · within 25 mi` |
| Text after picking Springfield MA | `Springfield, MA · within 25 mi` |
| **Same region node across the change** | **true** |
| Confirm panel inside the region | **false** |

**One deliberate departure from Entry 2**, recorded so it is not read as drift:
Entry 2 keeps CTAs *outside* the region because a region re-announces everything
it contains. Here the region's contents **are** the two control labels — and the
combined string is exactly the announcement wanted. There is no other chrome
inside it. The confirm panel, which is a form, stays outside.

## The text input has a real label, by both mechanisms

A placeholder is not a label: it vanishes on first keystroke and is not reliably
exposed. Asserted in the DOM, not in source:

| Check | Result |
| ----- | ------ |
| `aria-label` | `"Town or zip code"` |
| `aria-labelledby` | `sparked-place-label` |
| That id resolves to a real node | **true**, text `"Town or zip code"` |
| Placeholder (decorative only) | `"Green Valley, AZ"` |

## Contrast — measured off the PAINTED element, not the token

Read back with `getComputedStyle` and composited by walking to the first opaque
ancestor, which resolved to `#14213d`. Hand-computed values agreed to rounding
(8.98 / 4.04 predicted, 8.95 / 4.03 measured).

### Dark — rendered

| Element | Colour | Surface | Ratio | Held to |
| ------- | ------ | ------- | ----- | ------- |
| Editable value (`ignitionGold` `#F7B731`) | painted `rgb(247,183,49)` | `#14213D` | **8.95:1** OK | 4.5:1 |
| Dotted underline (`rgba(247,183,49,0.6)` composites `#9C7B36`) | composited | `#14213D` | **4.03:1** OK | 3:1 |
| Connective words (`within`, `·`, `mi`) | `textMuted` composites `#81899e` | `#14213D` | 4.57:1 OK | 4.5:1 |
| Confirm panel body + candidate rows | `text` `#eef0ff` | card `#1d2a45` | 12.62:1 OK | 4.5:1 |

### THE CARD CONSTRAINT WAS APPLIED, NOT REDISCOVERED

Entry 2 recorded that `textMuted` **fails at 4.32:1 on a card** while clearing
4.57:1 on the page background. The confirm panel **is** a card, so every text
line on it is `colors.text`. A comment in `LocationControl.tsx` states this at
the point of edit, because "soften that line to textMuted" is the obvious future
change and it is the one that breaks it.

### Light — COMPUTED, NEVER RENDERED, and the affordance FAILS

| Element | Colour | Surface | Ratio |
| ------- | ------ | ------- | ----- |
| **Editable value** | `ignitionGold` `#F7B731` | `#f4f5f8` | **1.64:1 — FAILS** |
| **Connective words** | `lightPalette.textMuted` `#7a849e` | `#f4f5f8` | **3.43:1 — FAILS** (pre-existing) |
| Confirm panel body | `#1c2840` | `#ffffff` | 14.72:1 OK |

**The gold failure is a KNOWN, RULED trade, not an oversight.** It was measured
and put to the reviewer before the code was written; the ruling (2026-08-20) was
to keep the frozen reference's affordance token
(`design-reference/ui_kits/mobile-app/Screens.jsx:190`) and log the failure. It
is **latent, not live**: light mode is unreachable while the Appearance screen is
a stub, so nothing fails for a user today.

**This is now the THIRD inherited light-mode failure owned by the Appearance
arc**, and they must be fixed together:

1. `lightPalette.textMuted` at 3.43:1 — body copy on every screen (Entry 2)
2. `me.tsx:440` `brightOrange` at 1.85:1 (Entry 2)
3. **`ignitionGold` inline-edit affordance at 1.64:1 — the worst of the three**

Same root cause all three times, and Entry 1 named it: **a dark-first palette
does not become a light palette by reusing its hexes.**

## Correctness findings, because each one is a path to a WRONG value shown confidently

Not contrast matters, but they belong in the same record.

- **Confirmation is enforced for a SINGLE hit, not only ambiguous ones.**
  Verified: with the confirm list open, storage still held the previous origin.
  Nothing moves until a pick. The 2026-07-21 incident (632 miles off, no error)
  *was* a single confident hit.
- **Ambiguity is surfaced, never resolved silently.** `85614` renders all three
  candidates — Arizona, Bavaria, Poland — which the live API returns with
  **byte-identical importance scores**, so `limit=1` was picking a country on an
  uncontrolled tie-break. Verified end to end: picking Massachusetts for
  `Springfield` stored Massachusetts, **not** Illinois, which ranked first.
- **Stored state is validated on READ.** On web this store is `localStorage` —
  writable by any script on the origin and by devtools. A poisoned blob
  (`lat: 999`, `lng: -99999`, `radius: 100000`, a `NaN` history entry) was
  written and the page reloaded: the app fell back to the seed, `"Pwned"` never
  rendered, and the out-of-range coordinate never reached an RPC. This matters
  because an invalid coordinate reaches Postgres as `null`, and
  `events_within_radius` answers a null origin with an **empty feed and no
  error** — indistinguishable from "nothing near you".
- **Place names are NOT run through `lib/moderation.ts`.** A decision, not an
  omission: it is a blunt substring blocklist and it rejects real US towns —
  *Killeen* contains "kill", *Gunnison* contains "gun", *Bombay Beach* contains
  "bomb". Length caps at the network boundary are the guard instead.
- **No XSS path**, stated so it is not re-litigated: `display_name` is
  third-party community-editable data, but it renders through `<Text>`, which
  sets text content and never markup, on every platform.

## What this entry does NOT establish

- **No screenshots. Again.** The Browser pane could not composite frames during
  this arc — the identical limitation Entry 2 recorded, now seen twice, so treat
  it as the normal condition of this environment rather than a one-off. Layout,
  contrast and targets were DOM-measured. **Visual feel is on the human list.**
- **Nothing about light mode**, unreachable for the same structural reason as
  Entries 1 and 2.
- **Nothing about iOS.** This arc adds no `announceForAccessibility` call of its
  own; it relies on the `EmptyState` path Entry 2 wrote, which has still never
  run on an iOS device.
- **Nothing about native at all.** Every measurement is Expo web. The
  AsyncStorage path in particular is exercised here as `localStorage`; the native
  bridge implementation is untested by this pass.
- **THE PRE-LOAD PLACEHOLDER HAS NEVER RENDERED, and the reason matters.**
  `"Finding your area…"` exists to cover the async-storage gap. On web there is
  effectively no gap — `localStorage` resolves inside a microtask, and sampling
  the live region every 50ms from first paint caught the resolved text at
  **6ms** and the placeholder never once. So the branch is written, typechecked
  and **unexercised**. It is the NATIVE path that actually needs it (a real
  bridge call), and native is untested by this pass. Same weakest-link shape as
  Entry 2's cold-start empty feed.
- **"No flash of the seed town" is argued structurally and confirmed AFTER the
  fact, not captured sub-frame.** A `MutationObserver` cannot survive the
  reload it is meant to observe, so no frame-by-frame capture exists. What IS
  verified: a stored `Green Valley, AZ @ 40mi` survived a reload intact, the
  seed did not overwrite it, and the string `"Sahuarita, AZ ·"` appeared
  nowhere in the rendered page. The structural argument is that the seed is
  written ONLY when the read returns nothing, so it cannot be rendered as a
  pre-load default — but that is an argument, and the empirical leg is
  post-hoc.
- **The `focusout` caveat on radius commit.** Radius commit was verified by
  dispatching `focusout` (React's `onBlur`); a synthetic `blur` event and an
  element `.blur()` call both failed to reach the handler. The commit path is
  proven, but **a real keyboard/tap blur on device has not been exercised** —
  human list.
- **No focus-ring audit and no reduced-motion audit.** This arc adds no motion.
  Not regressed; simply not measured.
- **The 30 bare `div[tabindex="0"]` elements still in the feed** were counted and
  are NOT from this arc — every control it adds carries `role`. They are Entry
  1/2's defect class surviving elsewhere (`saved.tsx`'s `FilterPill` is one
  confirmed instance, with a sub-44px target as well). **Open item.**

---

# Entry 4 — 2026-08-21 — Explore drops ended events (feed ENDED filter)

**The arc:** `events_within_radius` has no date predicate, so every published
event stayed in Explore forever, sorted by distance, wearing an `ENDED`
countdown chip. Last month's concert was in the feed. This arc filters ended
events out client-side, at fetch time, in `app/(tabs)/index.tsx`.

**No new interactive elements.** This was an accessibility *light* pass by
design: the arc adds no control, no label, no target, no motion. Two things
needed checking — that the existing live region still announces when the filter
empties the feed, and that Entry 2's same-node property survives a transition
this arc makes common.

## THE HEADLINE: the filter turned a silent path into the likely one, so the path got fixed

Entry 2's finding is that `aria-live` announces content changing **after** the
region is in the tree; a region mounted together with its message is silent.
`ListEmptyComponent` is unmounted whenever cards are rendering, so **cards →
empty** mounts the region and its text together — silent.

That path was theoretical before: a refresh that returned zero rows after
returning some. The ENDED filter makes it ordinary — the feed can now empty
without the RPC returning anything different. `onWiden` already solved this by
calling `setEvents(null)` first, putting the region back into its pending phase
so the message lands as a *change* to a node that already exists. **`onRefresh`
now does the same.** The brief empty beneath the refresh spinner is what the
pull gesture means; silence at the moment the app has something to say is not.

## Verified in the DOM, including node identity

Sampled every 50ms across the real cards to empty transition, driving the
**shipped `onRefresh` handler** (pulled off the FlatList's `refreshControl`
prop via the React fiber, so this is the real callback, not a reimplementation):

| Check | Result |
| ----- | ------ |
| Pre-state: cards rendered, EmptyState region **absent** | `regionCount 1` (LocationControl only), cards present |
| Region mounts EMPTY first (spinner phase) | **true** |
| Same node every frame once mounted | **true** |
| Message lands in **that same node** | **true** |
| Mount to message | 559ms, 12 samples |
| `[aria-live="polite"]` after | **2** — LocationControl (Entry 3) + EmptyState |
| `[role="status"]` after | **2**, same two |
| `ENDED` chips in the feed, clean state | **0** (previously the common case) |
| `[tabindex]` nodes added by this arc | **0** |

**The node-identity row is again the meaningful one.** Asserting only that the
message appears would pass against a region that mounts with its text and never
announces — which is exactly what this path did before the fix.

An earlier run of this same test reported the region "never receiving text."
That was a **probe defect, not an app defect**: the selector excluded any region
containing the word "within", and the empty-state body copy is "…what's
actually **within** your radius…". Recorded because a wrong probe that
disproves a working fix is the same failure class as a wrong probe that
confirms a broken one.

## The filter was proven by what it KEEPS, not only by what it removes

At the seeded origin every row has ended (see counts below), so the feed empties
completely — and **an empty feed cannot distinguish a correct filter from
`filter(() => false)`**. A positive check was required rather than optional.

Five synthetic rows covering every branch of `hasEnded` were injected into the
RPC **response** (page-side `fetch` wrapper — no source edit, no database
write), then read back out of the rendered DOM:

| Case | `starts_at` / `ends_at` | Expected | Rendered |
| ---- | ----------------------- | -------- | -------- |
| 1 — future | +2d / +2d3h | keep | **kept**, chip `2 DAYS` |
| 2 — in progress | −1h / +6h | keep | **kept**, chip `NOW LIVE` |
| 3 — just ended | −5h / −1h | drop | **dropped** |
| 4 — null end, inside 3h grace | −1h / `null` | keep | **kept**, chip `NOW LIVE` |
| 5 — null end, past 3h grace | −5h / `null` | drop | **dropped** |

19 rows in, 3 rendered. Case 2 is the one the rule turns on: a live event is
the most useful thing a discovery feed can show, and `eventCountdown` reads an
in-progress event as `LIVE`, never `ENDED`.

## Survivor counts at the seeded origin — zero, at every radius

Read from the app's own RPC responses at 31.9576 / −110.9556, 2026-08-21
~19:00Z:

| Radius | RPC returned | Survived the filter |
| ------ | ------------ | ------------------- |
| 25 mi (default) | 13 | **0** |
| 50 mi | 14 | **0** |
| 100 mi (MAX) | 14 | **0** |

The latest `ends_at` anywhere in the set is `2026-08-20T05:00:00Z` — about 38
hours before the measurement. **Every seeded event has ended, so Explore is the
empty state at every radius.** That is the filter working and the 1b empty state
doing its job, not a regression.

Side effect worth recording: at 100 mi the widen CTA correctly disappears
(`canWiden` false at `MAX_RADIUS`). Entry 2 noted that branch had never been
seen render; it has now.

## What this entry does NOT establish

- **No screenshots. Third arc running.** The pattern from Entries 2 and 3 holds —
  treat it as the normal condition of this environment. Everything here is
  DOM-measured. **Visual feel is on the human list.**
- **The pull GESTURE is unproven, only the handler it calls.** `onRefresh` was
  invoked directly off the fiber. Whether react-native-web wires a real pull to
  it on a touch device, and whether the native `RefreshControl` does, is
  untested. Same class as Entry 3's `focusout` caveat.
- **The pre-state was captured in a separate observation**, immediately before
  the sampled series, not inside it — by the first 50ms sample `setEvents(null)`
  had already applied. So "cards were on screen" and "the region mounted empty"
  are two adjacent measurements, not one continuous capture.
- **Nothing about native or iOS.** Expo web only. This arc adds no
  `announceForAccessibility` call of its own; it relies on the `EmptyState` path
  Entry 2 wrote, which has still never run on an iOS device.
- **Nothing about light mode**, unreachable for the same structural reason as
  Entries 1–3.
- **No contrast, target or focus measurements.** The arc paints nothing new and
  adds no control. Not regressed; deliberately not measured.
- **A never-empty feed was never observed**, because the seed data cannot produce
  one. Every "cards rendering" state in this entry was synthetic. The
  filter-keeps-things evidence is real but injected.
- **THE FOCUS-REFETCH PATH IS STILL SILENT ON cards to empty, and this arc did
  not close it.** `onWiden` and `onRefresh` blank to `null` first; the
  `useFocusEffect` refetch does not. Return to Explore from another tab after the
  last card ended and the region mounts with its text — silent, by Entry 2's own
  finding. Left open deliberately: blanking on every focus return would flash a
  spinner each time the user switches tabs back, which is a visible regression
  traded for a rare case. **Partly mitigated:** a location or radius change also
  routes through that effect, but LocationControl owns its own live region
  (Entry 3) and announces the change itself, so only the plain tab-return case
  is unannounced. **Open item.**
- **`[tabindex]` count is 7 here versus Entry 3's 30 — that is not progress.**
  The bare `div[tabindex="0"]` defect lives on the event cards, and this feed has
  no cards to render. Entry 1/2's defect class is unchanged and still open.

**Baseline:** checked against the running Expo web dev server at
`localhost:8081` on 2026-08-21, against `main` @ `d9df9df` plus this arc's
working tree (`CLAUDE.md`, `app/(tabs)/index.tsx`). `npx tsc --noEmit` clean.
`npx expo lint` reports one error in `index.tsx` (`react/no-unescaped-entities`,
the `Couldn't load events` apostrophe) which is **pre-existing at `d9df9df`
line 205** and simply moved to line 244; this arc adds no new lint finding.
Synthetic rows were injected into the `fetch` response in the page — **no source
file and no database row was modified to produce any measurement here.**

---

# Entry 5 — 2026-08-25 — Date & time pickers: three shipped defects

**The arc:** `components/pickers.tsx` — the shared `DateField` / `TimeField`
used by the paid wizard and Curbside. Three defects found in the 2026-08-21
date-surface recon, fixed together because they are one file and one DOM
measurement. **No SQL, no schema, no migration, no RPC** — the privilege-audit
gate is N/A under CLAUDE.md's carve-out, stated rather than omitted, and the
grant surface is provably untouched because no file under `supabase/` was
written and no `GRANT` / `CREATE` / `ALTER` statement was executed.

## THE HEADLINE: the recurring live-region shape, and the rule that stops it

**This is the fourth consecutive arc in which the same defect has been
re-derived from scratch** — Entry 2 (both empty states), Entry 3 (Explore
header), Entry 4 (`onRefresh`), and now this arc's validation message. It was
re-discovered each time and the avoidance rule was never written down. Writing
it down is the point of this section.

**The shape.** `aria-live` announces content that changes *after* the region is
already in the accessibility tree. A region that mounts *together with* its
text announces nothing. The failure is silent, and it is invisible to the
typechecker, to source review, and to a DOM snapshot taken after the fact —
because at that moment the attribute IS present and the text IS in it.

**The rule, and it is mechanical:**

> **The live-region node is mounted unconditionally. Only its CHILDREN swap.**
> Never `{cond && <View role="status">…</View>}` — that is a conditional NODE.
> Write `<View role="status">{cond ? <Text>…</Text> : null}</View>`.
> **Style the absence, never unmount it:** conditional margin, conditional
> padding, conditional height — never a conditional node.

This arc's validation message was first written in the wrong shape and caught
in review before it shipped. That is the first time this defect has been caught
rather than re-discovered, and the rule above is why it should be the last.

**The corollary for the check:** asserting that the message *appears* proves
nothing — it passes against a region that remounts every time and therefore
never announces. **Assert node identity across the transition.** Every entry
since Entry 2 has done this; this one does it below.

## Defect 1 — the calendar opened on the wrong month

`DateField` seeded `viewYear` / `viewMonth` with `useState` from `value` and
never synced them again. When `value` changed from OUTSIDE — the wizard's Start
bumping End (`create/event.tsx`), or Curbside's `changeStart` clamp — the
calendar kept its MOUNT-time month.

**It typechecks, never throws, and reads to the host as "the date didn't
change."** Three attempts in Design failed to reproduce it, which is why this
entry carries a before/after rather than an assertion of success.

### Reproduced, then fixed, by the identical drive

`pickers.tsx` was reverted to `615a427` with `git stash`, the drive re-run
click-for-click, then the fix restored. Both runs: open Start, five real clicks
on the month chevron to Dec 2026, click `Dec 3, 2026`, then open **End's**
calendar and read the DOM.

| Assertion (End's calendar, after Start moved to Dec 3) | Pre-fix `615a427` | Post-fix |
| --- | --- | --- |
| Month header | **`Aug 2026`** | **`Dec 2026`** |
| `Dec 3, 2026` cell present | **false** | **true** |
| Day cells rendered | 31 | 31 |
| Cells DISABLED by `min` | **31 of 31** | **2 of 31** (Dec 1–2) |
| Cells ENABLED | **0** | **29** |
| Cells showing the selected treatment | **0** | **1** — `Dec 3, 2026` |

**The enabled-cell count is the discriminating number.** A December header
alone could come from something other than this fix; `0 enabled` → `29 enabled`
is the defect itself — a calendar on which every day was inert.

### Selection was asserted from the PAINTED element, and the reason matters

**`accessibilityState` is inert on web.** rnw 0.21.2 has no handler for it in
`forwardedProps/index.js`, `createDOMProps/index.js`, or
`exports/Pressable/index.js` — so `accessibilityState={{ selected }}` reaches
no DOM attribute at all. (`disabled` survives independently: `Pressable`
emits `aria-disabled` and `tabindex="-1"` at `Pressable/index.js:125`.) There
is therefore **no `aria-selected` to assert**, and selection was read off the
painted treatment instead:

| Treatment | Count | Meaning |
| --- | --- | --- |
| weight 900, `rgb(20,33,61)`, extra child node (`GradientFill`) | **1** | selected — `Dec 3, 2026` |
| weight 600, `rgb(238,240,255)` | **28** | enabled, unselected |
| weight 600, `rgba(238,240,255,0.25)`, `aria-disabled="true"` | **2** | disabled by `min` |

1 + 28 + 2 = 31. `Dec 4, 2026` was read as an explicit negative control.

This is **Entry 1's standing rule, third instance**: an accessibility prop is
not verified by the typechecker, and here it was not verified by the
platform either. **OPEN ITEM** — the durable fix is `role="gridcell"` +
`aria-selected` inside a `role="grid"`, which is calendar structure and was out
of scope for this arc.

### The mechanism, and what it deliberately does not do

Two mechanisms, because neither subsumes the other:

- **`toggleCalendar` re-derives the view on OPEN**, so a browse to November that
  was closed without picking does not persist into the next open.
- **A render-phase sync** (`syncedTo` state compared against `value` during
  render) catches `value` changing while the calendar is ALREADY open.

**Not a `useEffect`**: an effect runs after commit, so the wrong month paints
for a frame before correcting — and that frame is exactly what a screenshot
would capture. Adjusting state during render re-renders before paint.

**The guard is the VALUE, not the render.** An unrelated re-render — theme,
parent state, a sibling field — fails the `value !== syncedTo` comparison and
changes nothing, so a user who browsed to November stays on November. The only
re-syncs are their own pick (which closes the calendar in the same handler) and
a real external change, where jumping is the correct behaviour.

## Defect 2 — labels, verified as real DOM attributes

`TimeField` hardcoded `accessibilityLabel="Start time"`, so the wizard's **End**
time field announced itself as "Start time" — a live 4.1.2 defect on a shipped
control. `DateField`'s shell had no role, no label and no disclosure state.

| Element | Before | After (read from the DOM) |
| --- | --- | --- |
| Start time input | `aria-label="Start time"` | `aria-label="Start time"` |
| **End time input** | **`aria-label="Start time"`** | **`aria-label="End time"`** |
| Date shell (Starts) | no role, no label | `role="button"`, `aria-label="Starts, Aug 25, 2026"` |
| Date shell (Ends) | no role, no label | `role="button"`, `aria-label="Ends, Aug 26, 2026"` |
| Disclosure state | absent | `aria-expanded` `false` → **`true`** on open, on that field only |
| AM/PM pair | `"AM"` `"PM"` ×2 fields = 4 identical | `"Start time AM/PM"`, `"End time AM/PM"` |
| Month chevrons | `"Previous month"` ×2 = 4 identical | `"Previous month, Starts"` / `", Ends"` |
| Chevron role | **`generic`** (labelled div, not a button) | `role="button"` |

The chevrons' `generic` reading was found by the accessibility-tree read, not by
source — the label was present and correct while the element was not a button.
Entry 2's `div[tabindex="0"]` finding, same shape.

**All `accessibility*` spellings were converted to `aria-*` / `role`.** rnw
0.21.2 logs a deprecation for EVERY one of them, `accessibilityLabel`
included (`createDOMProps/index.js:417`, `:605`, `:339`) — not only the three
Entry 2 named. The `aria-` form is a typed View prop in RN 0.86
(`ViewAccessibility.d.ts:39, :58, :100`) and `TextInputProps extends ViewProps`,
so one spelling covers web, iOS and Android.

## Defect 3 — single-day events now require End time after Start time

7:00pm → 10:00am on one day produced `ends_at < starts_at`, passed every client
check, reached `.insert()`, and came back as the column check violation —
surfaced raw, so the host read a Postgres constraint string.

Blocked at **step 1**, where both offending fields are on screen, not only at
Review three steps later. `canPublish` carries the same guard so `.insert()`
stays unreachable either way.

**Deliberately stricter than the database.** The column check is
`ends_at is null or ends_at >= starts_at`
(`20260708000001_core_spine.sql:268`), which ACCEPTS a zero-length event. The
client blocks `<=`, so 7pm → 7pm is refused here. This is a client rule tighter
than the constraint, not a mirror of it.

### Verified by driving the real control

| Check | Result |
| --- | --- |
| Valid state (7:00 PM → 10:00 PM, same day) | region present, **text empty**; Continue `tabindex="0"` |
| Flip End to AM (7:00 PM → 10:00 AM, same day) | message renders; Continue **`aria-disabled="true"`, `tabindex="-1"`** |
| Click Continue while invalid | **still `STEP 2 OF 5`** — the `next()` guard, not just the attribute |
| **Same region node across valid → invalid → valid → invalid** | **true** |
| Region count on the step | 1 |
| Multi-day: End date → next day, times unchanged | message **cleared**, Continue re-enabled, **same node** |

The multi-day row is the one the rule turns on: 7:00 PM day 1 → 10:00 AM day 2
is inverted CLOCK time and a perfectly valid EVENT, and it stays allowed.

### CONTRAST: THE NEW MESSAGE FAILS 1.4.3, AND THE TOKEN IS THE CAUSE

Measured off the painted element per Entry 3's method, compositing to the first
opaque ancestor:

| Element | Painted | Surface | Ratio | Held to |
| --- | --- | --- | --- | --- |
| **Validation message** | `danger` `rgb(239,68,68)` | `#14213D` | **4.24:1 — FAILS** | 4.5:1 (12px / 400) |

**The failure is the token, not this message.** `darkPalette.danger` `#ef4444`
is **4.24:1 on the page background and 3.80:1 on a card**, and it is already
used at 12px for the wizard's existing `{error}` line (`create/event.tsx`) —
so this arc's message inherits a live failure rather than creating one.
Candidates computed against `#14213D` / `#1d2a45`:

| Token | hue | on `#14213D` | on card `#1d2a45` |
| --- | --- | --- | --- |
| `danger` `#ef4444` (current) | 0.0° | 4.24 ❌ | 3.80 ❌ |
| `brand.flameRed` `#ff6348` | 8.9° | 5.42 ✅ | 4.85 ✅ |
| `red-400` `#f87171` | 0.0° | **5.77** ✅ | **5.17** ✅ |

`lightPalette.danger` `#b91c1c` on `#f4f5f8` is **5.93:1** and passes, so this
is a dark-mode-only failure — the mirror image of Entries 1–3, where the
light palette was the broken one.

#### `flameRed` WAS PROPOSED, AUDITED, AND REJECTED — record the reason

`brand.flameRed` was the obvious swap because it clears 4.5:1 and adds no new
colour. **The audit that preceded the change killed it**, and the finding is
recorded here because "use the existing token" will be proposed again:

> **`flameRed` `#ff6348` and `sparkCoral` `#ff5f4e` are 3.1° apart in hue with a
> contrast ratio of 1.019:1 between them — they are the same colour.**

`sparkCoral` is **stop 0 of the spark gradient** (`colors.ts:31`), which
`colors.ts:24` reserves for "ACTIONABLE elements only (CTAs, host/monetization
actions…)". Painting `danger` with it would give every error message and every
destructive-action label the colour of the primary CTA — and
`(tabs)/workspace.tsx:423` states the opposing rule explicitly at the point of
edit: *"Destructive confirm — danger-tinted, NEVER gradient. The gradient is
reserved for actions a host wants to take."* The swap would have satisfied
1.4.3 by breaking 1.4.1's neighbour — the meaning carried by colour.

**`red-400` `#f87171` is the surviving candidate**: hue 0.0°, identical to
today's `danger`, so it stays red-red; 5.77:1 / 5.17:1, clearing 4.5:1 on both
surfaces; and 5.8° from `sparkCoral` on the far side, away from the gradient.
It does introduce a new hex.

#### The token is never a fill — but the same red IS, hardcoded, 11 times

Audited before proposing any change. `theme.colors.danger` resolves only to
text `color`, `Ionicons` `color`, and `ActivityIndicator` `color` — **never a
`backgroundColor` and never a fill.** However **11 hardcoded
`rgba(239,68,68, α)` literals** carry the same red as backgrounds and borders:

| Site | Use |
| --- | --- |
| `create/event.tsx:428` | photo-cap slot border |
| `create/event.tsx:1373, :1375` | "Trim your photos" panel background + border |
| `(tabs)/workspace.tsx:346, :348` | delete-workspace panel background + border |
| `(tabs)/workspace.tsx:433, :434` | **destructive confirm button** border + pressed/idle fill |
| `(tabs)/workspace.tsx:1037, :1038` | delete-event row border + pressed fill |
| `(tabs)/workspace.tsx:1154, :1155` | delete-event confirm border + fill |

**Changing the token alone desynchronises these**: the panel keeps a red-red
tint while its label text moves hue, on the two most safety-critical surfaces in
the app. Any `danger` change must move these eleven literals in the same commit,
or convert them to alpha derivations of the token. **OPEN ITEM** — the contrast
failure is real and still live; the fix is a token change plus eleven literals,
and it is deliberately NOT part of this arc.

## Touch targets — WCAG 2.5.5, measured on both axes

`getBoundingClientRect()`, calendar open, per Entry 3's measure-both-axes rule:

| Control | Rendered | |
| --- | --- | --- |
| Date field shell | 592 x 56 | OK |
| Time field (padded container — the real target) | 592 x 48 | OK |
| `<input>` element inside it | 404 x 21 | — see note |
| **Month chevron** (×2 per calendar) | **24 x 26** | **FAIL** |
| **Calendar day cell** | **77 x 30** | **FAIL** |
| **AM/PM segment** | **37 x 21** | **FAIL** |

No horizontal overflow.

**The three failures are pre-existing, were RULED not-fixed on 2026-08-25, and
the reason is recorded so it is not re-litigated:** the day-cell fix reflows the
calendar grid, which is the visual-design change this arc was fenced against,
and doing it here would mean the demo gate tested a layout that changed
underneath it.

**`hitSlop` DOES NOT APPLY ON WEB, and this is the detail that gets "fixed"
twice.** The chevrons carry `hitSlop={8}`, which on native expands the touch
area to roughly 40 x 42 — still short of 44, and on react-native-web it does
nothing at all. A future pass that reads the source, sees `hitSlop`, and
concludes the target is already handled will have fixed nothing. **The fix is
`minWidth: 44` + `minHeight: 44` + centring**, which is Entry 3's 44x29 remedy.

The `<input>` row is listed for completeness, not as a failure: its target is
the 592 x 48 padded container that receives the tap, not the text box.

## What this entry does NOT establish

- **NOT MEASURED AT 375 OR 1280.** Every number above was taken at a viewport
  of **3822 x 1412** (`devicePixelRatio` 0.9, 3440px display). `resize_window`
  reported success but `outerWidth` stayed at 3440 — the window is maximised
  and the resize is a no-op, confirmed by re-measuring after requesting both
  1280x800 and 420x800. **What IS established:** the wizard column is
  `maxWidth: 640, width: '100%'` (`create/event.tsx:1248`) and step 1 contains
  no viewport branch — the only `breakpoints` use in the file is inside the
  vendor editor on the Details step — so the column renders at its 640 cap
  (measured 592 inside padding) at any viewport ≥ 688, and the desktop numbers
  are the 1280 numbers. **At 375 the column narrows to ~327 and the day-cell
  WIDTH changes; that is unmeasured and still owed.**
- **CURBSIDE'S `TimeField` LABEL IS UNVERIFIED IN THE DOM, and stays that way
  deliberately.** The `label="Start time"` prop is the same one-line change
  verified twice over in the wizard — where both `aria-label`s were read
  straight off the rendered inputs — but the Curbside instance itself was never
  rendered. The account is at its Curbside quota, so `/create/curbside` returns
  the conversion screen and the form, and therefore the `TimeField`, never
  mounts. **Clearing the quota means writing to the ledger, which is exactly
  what the reseed declined to do**, so this is left open rather than bought with
  a ledger edit. Per Entry 1's standing rule the wizard evidence does not
  transfer: an accessibility prop is verified where it renders, not where an
  identical call site renders. **Recorded as unverified — not as a pass.**
- **No screenshots. Fourth arc running.** `Page.captureScreenshot` timed out at
  30s on every attempt, in real Chrome this time rather than the Browser pane —
  so treat it as the environment, not the surface. Entries 2, 3 and 4 recorded
  the same. **Visual feel is on the human list**, and this arc's fence forbade
  visual change, so there should be none to feel.
- **Nothing about native or iOS.** Expo web only. `accessibilityState` is left
  in place on the day cells and AM/PM segments precisely because native honours
  it, and that native path has never run.
- **Nothing about light mode**, unreachable for the same structural reason as
  Entries 1–4. The `danger` contrast finding above is dark-mode-only; the light
  value passes.
- **The `syncedTo` render-phase sync is unexercised under React StrictMode
  double-rendering.** It is idempotent by construction (the second pass finds
  `value === syncedTo`), but that is an argument, not a measurement.
- **No focus-ring audit, no reduced-motion audit.** This arc adds no motion.
- **Day cells and AM/PM segments are still role-less `generic` elements** with
  labels — 31 of them per open calendar. Only the shells and chevrons were given
  `role`. Entry 1/2's defect class, still open, and the biggest remaining item
  in this file.

**Baseline:** checked against the running Expo web dev server at
`localhost:8081` on 2026-08-25, against `main` @ `615a427` plus this arc's
working tree (`components/pickers.tsx`, `app/create/event.tsx`,
`app/create/curbside.tsx`). Driven in Chrome under a real signed-in session.
`npx tsc --noEmit` exits 0. `npx expo lint` reports **64 problems (59 errors, 5
warnings)** both before and after — the baseline was taken by stashing the three
files back to `615a427`, re-running, and popping — so **this arc adds no lint
finding**; none of the 64 are in `pickers.tsx`. The pre-fix reproduction was
produced by `git stash` on `pickers.tsx` alone, and the fix restored and
re-confirmed by grep for its markers. **No source file was edited to produce a
measurement, and no database row was read or written by this arc.**

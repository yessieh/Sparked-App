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

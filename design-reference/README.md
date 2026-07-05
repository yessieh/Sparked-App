# Sparked Design System

> **Get out of the algorithm and into your community.**

Sparked is a local-event discovery and hosting platform built around proximity, not engagement loops. Browsers find what's near them; organizers and small businesses publish in minutes and get an immediately-shareable event page. The brand is **premium-but-approachable**, dark-mode first, anchored by a single signature moment: the **Spark Gradient** (coral → orange → gold).

This folder is a portable design system: tokens, fonts, copy guidelines, brand assets, and a UI kit you can drop into any prototype or production surface and stay on-brand.

---

## Sources

- **Codebase** (mounted): `Sparked/Sparked/` — React 19 + Vite + Tailwind 4. Key reads:
  - `index.html` — Tailwind theme, CSS variables, gradient utilities
  - `docs/brand/voice-and-tone.md` — voice, tone, color usage rules
  - `src/shared/components/SparkedLogo.tsx` — twin-flames mark + gradient stops
  - `src/pages/landing/LandingPage.tsx` — hero, pricing, about marketing surfaces
  - `src/pages/explore/*` — patron-facing app shell (list/map/timeline + dock)
  - `src/features/events/EventCard.tsx`, `EventDetails.tsx` — core feed unit + detail modal
  - `src/pages/auth/AuthEntryPage.tsx`, `src/pages/workspace/WorkspacePage.tsx` — auth, "Workspace" preview
- **GitHub repo** (private): `yessieh/Sparked` — same source, attached for reference.

If a future agent picks this up, expect the codebase to disappear — copies of the most useful files are vendored under `source/` and assets under `assets/`.

---

## What's in this folder

| Path | What it is |
|---|---|
| `colors_and_type.css` | All color + type CSS custom properties (dark + light mode), plus base `h1/h2/p/a` rules and the `.spark-gradient` / `.spark-text-gradient` / `.eyebrow` / `.glass-card` utilities. |
| `assets/` | SVG logos, app icons, Google G icon. The twin-flames lockup lives in two specimen files (`sparked-icon.svg`, `sparked-app-icon-1024.svg`); the 1024 file doubles as the rounded-square app tile. |pp_icon_v2.svg`. |
| `source/` | Vendored source-of-truth: original `voice-and-tone.md` and the `SparkedLogo.tsx` component. |
| `components/` | Typed, registered DS components (each is `<Name>.tsx` + `<Name>.d.ts` + a `@dsCard` thumbnail). `EventStub/` — the universal ticket-stub event card (photo + compact variants). |
| `preview/` | HTML cards rendered in the Design System tab — colors, type, components, spacing, brand. |
| `ui_kits/mobile-app/` | High-fidelity recreation of the patron-facing app shell. `index.html` is a click-thru prototype; JSX components are modular and cosmetic. |
| `SKILL.md` | Agent Skill manifest for using this system in another project / Claude Code. |

---

## CONTENT FUNDAMENTALS

Sparked's voice is **confident, warm, elevated, and trustworthy** — premium-but-approachable. Copy reads like a thoughtful friend who knows the city, not a corporate marketer.

### Casing
- **Sentence case** for body, descriptions, and most CTAs (`Browse Local Events`, `List Your First Event In Minutes`).
- **Uppercase + black-weight + 0.20em tracking** for *eyebrows*, metadata labels, and short microcopy ("EVENT BROWSING", "TONIGHT", "RECOMMENDED", "FREE", "EVENT DATE"). This is the single most distinctive type pattern in the brand. Every section lead-in uses it.
- **Display headlines** use Montserrat Black with `font-weight: 900` and tight tracking. Stack short, punchy lines over full sentences:
  > YOUR CITY. / YOUR EVENTS. / NO ALGORITHM.
- Never use ALL CAPS for body text or long sentences.

### Pronouns & framing
- **You / your** ("Your local scene is waiting for you", "Choose your Spark"). Second-person, never first-person plural ("we"), except in the about page where "Sparked" is the actor.
- Community-first phrasing: "neighbors", "organizers", "your area", "what's actually near you".

### Vibe & rhythm
- **Short, action-oriented lines.** Most CTA labels are 3–5 words and start with a verb (`List an Event`, `Browse Local Events`, `Send magic link`, `Compare in full flow →`).
- **Two-beat headlines** — a punchy claim followed by a contrast. "Built for local discovery, **not feed fatigue.**" "Your city. Your events. **No algorithm.**"
- **Quality framing over hype.** "Curated local experiences." "Real local experiences by proximity and timing."

### Disallowed patterns (from `voice-and-tone.md`)
- No manipulative urgency (`last chance`, `guaranteed sellout`, `act now`).
- No unverified superlatives (`best in city`, `guaranteed outcomes`).
- No protected-class targeting or polarizing political framing.
- No safety/legal/medical advice.
- AI-generated descriptions stay short and factual.

### Emoji & punctuation
- **No emoji.** Sparked uses Lucide icons exclusively for symbolic accents.
- **Em-dash and pipe** are the brand's separators of choice — `Sparked, find local events | Get out of the algorithm and into your community.`
- Curly quotes/apostrophes everywhere ("don't", not "don't"; "let's spark.").
- Lowercase "or" between two CTAs, set in `text-white/25` at 10px — visually a whisper.

### Specific examples lifted from product

| Surface | Copy |
|---|---|
| Marketing hero | "YOUR CITY. / YOUR EVENTS. / NO ALGORITHM." |
| Hero sub | "Sparked helps you discover and publish local events by distance, not by feed." |
| Primary CTA | "List Your First Event In Minutes" |
| Secondary CTA | "Browse Local Events" + tiny gradient "FREE" tag |
| About eyebrow | "ABOUT SPARKED" |
| About headline | "Built for local discovery, not feed fatigue." |
| Pricing headline | "Choose your Spark" |
| Auth login | "Welcome back — let's spark." / "Your local scene is waiting for you." |
| Auth signup | "Create your Sparked account" / "Start browsing and hosting in minutes." |
| Empty state | "No events found matching your criteria." |
| Footer | "© 2026 Sparked. All rights reserved." |

---

## VISUAL FOUNDATIONS

### Backgrounds
- **Dark-mode default.** Page bg is `#14213D` (Deep Night). Light mode swaps to `#f4f5f8` (cool gray) — never pure white as a canvas, white is reserved for cards in light mode.
- **Ambient heat.** Two large blurred radial gradients sit behind hero and auth pages — a coral blob top-left (`bg-flameRed/25`, blur 120–160px) and an ignition-gold blob bottom-right (`bg-ignitionGold/15`, blur 200px). On light mode they drop to `0.03–0.05` opacity. They are the only decorative gradient use.
- **No textures, no patterns, no illustrations.** Imagery is real photography (events, people, food, art) — never hand-drawn, never iconographic illustrations beyond the twin-flames logo.

### Color rules (the Spark Gradient is the brand)
- The `linear-gradient(135deg, #ff5f4e, #ff8c38, #ffca3a)` — coral → orange → gold — is the brand's signature. **Reserve it for three things only:**
  1. The **wordmark** (logo lockup)
  2. The **primary CTA** on the screen (one per viewport — see "Primary action" rule below)
  3. **Active state** — currently-selected pill, current tab, "Recommended" badge
- That's it. **No gradient on**: feature-card top-bars, About-section left-bars, decorative dividers, hover halos, eyebrow accents, hero-headline word emphasis on *every* page (use it on at most one word per viewport, and only when it correlates to the CTA action).
- Single stops are pulled out for single-color use: **coral** for live/alerts, **orange** for eyebrows/icons/hover borders, **gold** for links/stat numbers/secondary-CTA text.
- Gold (`#ffca3a` / `#F7B731`) is for accents, never primary body text.
- Coral on white can feel harsh — prefer orange (`#ff8c38`) for single-color icons in light mode.

**Why the restraint:** when the gradient appears 5–6 times in one viewport (logo + headline word + CTA + active pill + top-bar + left-bar) it stops reading as "this is the action" and starts reading as decoration. Each appearance dilutes the rest. The voice doc already says the gradient should mark *actionable elements only* — this rule operationalizes that.

### Primary action
- **One primary CTA per viewport.** It gets the filled spark gradient. Every other action is outline, ghost, or text-link.
- If you find yourself wanting a second gradient button, you have an audience-hierarchy problem — fix that first (see V5 "Two doors" pattern for the rare case where audiences genuinely split).

### Contrast & accessibility (non-negotiable)
- Text contrast meets **WCAG AA**: 4.5:1 for body, 3:1 for large display text.
- **Decorative-muted display text** uses `var(--text-muted-display)` = `#5a6378` (3.1:1 on Deep Night) — *not* `#414657` (1.3:1, fails even decorative thresholds).
- The faded third line in display stacks ("NO ALGORITHM." pattern) either uses the compliant muted token, or drops to a separate subhead in `var(--muted-text)`. Never re-use the broken `#414657` value.
- All focus states use `var(--focus-ring)` and a visible 2px ring. Don't strip it for visual cleanliness.

### Typography
- **Inter** for everything sans (300, 400, 500, 600, 700).
- **Montserrat** for display headings (700, 800, 900). Black weight is the dominant choice — Sparked uses 900 even on small headlines.
- Letter-spacing: tight on display (`-0.01em`), generous on uppercase eyebrows (`0.18–0.25em`).

### Spacing & rhythm
- Built on Tailwind's 4px base. Cards typically use `p-6` (24px) interior, `p-8` to `p-12` on modal/large surfaces, `gap-6` to `gap-8` on grids.
- Generous outer padding on hero (`px-4 md:px-8`, max-w `1200px`).
- Hit targets are large — buttons are `py-3.5` to `py-4` (≥44px).

### Corner radii (very rounded)
Sparked is one of the more rounded systems out there. Reach for the larger end of the scale.
- `rounded-md` 12px — micro buttons, social icon tiles
- `rounded-xl` 16px — buttons, fields, small badges
- `rounded-2xl` 24px — surface cards, tab pills
- `rounded-3xl` 28–32px — feed cards, info blocks
- `rounded-[2.5rem]` (40px) — modal shells, the floating dock
- `rounded-[3rem]` (48px) — fullscreen modals (event details, profile)
- `rounded-full` — interest pills, avatar wells, the floating + FAB

### Borders
- Default border: `1px solid rgba(255,255,255,0.08)` (dark) or `rgba(28,40,64,0.08)` (light).
- Hover border: bumps to `rgba(255,255,255,0.10)`, or onto an `ignitionGold/35` accent for active items.
- "Gradient-stroke" buttons: 1px outer wrapper with `spark-gradient`, 1px inner button on `bg-appBg`. Reserved for the most important secondary CTA on a screen (Auth "Continue with Google" / "Send magic link").
- Top-edge accent line: a 2px gradient bar across the top of feature cards (`absolute inset-x-0 top-0 h-[2px] spark-gradient`).
- Left-edge accent line: a 4px vertical gradient bar `gradient-bar-left` for major feature blocks.

### Shadow / elevation
- **Dark mode** uses *glass* (translucent surface + backdrop-blur(12px) + 0.08 white border) and a soft warm glow for elevation — `0 0 60px rgba(252,163,17,0.12), 0 0 120px rgba(255,99,72,0.06)`.
- **Light mode** uses real shadows: resting `0 2px 12px rgba(28,40,64,0.05)`, lifted `0 4px 24px rgba(28,40,64,0.07)`, hovered `0 20px 48px rgba(28,40,64,0.10)`.
- CTA glow: `0 6px 22px rgba(255,95,78,0.24)` resting → `0 10px 30px rgba(255,95,78,0.34)` on hover. The coral haze under primary buttons is a brand signature.
- No inner shadows.

### Transparency & blur
- Glass surfaces (cards, dock, modal headers) use `rgba(255,255,255,0.03–0.05)` over the navy bg + `backdrop-filter: blur(12px)`.
- Bottom dock uses `color-mix(in srgb, var(--bg-color) 85%, transparent)` — explicitly *more* opaque than glass cards, because long lists of events sit underneath and readability matters on phones.
- Modal veils: `bg-black/60` + `backdrop-blur-sm` for profile/workspace; `bg-appBg/90 + backdrop-blur-md` for event details.

### Hover & press states
- **Buttons:** `transition-transform duration-200 ease-out hover:scale-[1.02]` (subtle lift). Primary CTA gets shadow-glow bump. Active/press: `active:scale-95` on the FAB.
- **Cards:** `hover:scale-[1.01]` + border shifts to `ignitionGold/35`. Pricing/feature cards add `transform: translateY(-6px)` and a 3D tilt: `rotateX(2deg) rotateY(-2deg)`.
- **Pills (interest tags):** active = full gradient + `scale-105` + coral shadow. Inactive = outline + 30% muted, lifts to full opacity on hover.
- **Icon tiles:** outline → on-brand colored fill (e.g. Instagram hover → pink-500; website → emerald-500).
- **Links:** `hover:underline`, color stays gold.
- No bouncy easings; no spring physics. Sparked motion is **smooth, ease-out, 200–400ms**.

### Animation
- All transitions: `transition-all duration-200–400 ease-out`. Theme switches use `0.5s` for bg-color/color cross-fade.
- Page entrances: `animate-in fade-in slide-in-from-bottom-4 duration-300–500`.
- Live event badge: subtle `animate-pulse` and a `ping` ring on the dot.
- The floating "Personalized feed" nudge fades in over 300ms then out after 4s.
- **No bounces, no springs, no parallax, no scroll-driven anims.** Sparked stays restrained.

### Cards (the dominant container)
A "Sparked card" usually has:
- Generous radius (`rounded-3xl` or larger)
- 1px translucent border
- Glass fill OR solid `#0f1a30` bg
- Optional 2px top-edge gradient bar
- Optional warm glow shadow
- Hover: scale up 1%, border flips to `ignitionGold/35`, shadow grows
- Internal padding: `p-6` to `p-12` depending on prominence

**The EventStub ticket card** (`components/EventStub/`) is the universal event unit — one component, two variants: `photo` (Explore/discovery) and `compact` (Saved/logistics). Shared anatomy across both: a left brand **stripe**, a **perforated divider**, and a right **utility column** with a live countdown (`Starts in 4h` → `less than an hour`; `2 Days`). Price shows top-right (`Free` / `$5`). The perforation is reserved for events only.

### Layout rules
- Max content width: `1200px` for marketing, `7xl` (1280px) for app shells.
- Sticky top header (`sticky top-0`) with a thin `border-b border-appText/5` and `backdrop-blur-md` over an 80% bg.
- Bottom nav floats — not docked. `fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md` with a 40px-radius pill, and the FAB sticks out the top by `-mt-10`.
- Mobile-first; desktop is `md:` and `lg:` breakpoints layered on top.

---

## ICONOGRAPHY

Sparked uses **[Lucide React](https://lucide.dev) v0.563** as its sole icon system — `import { Calendar, MapPin, Sparkles, ... } from 'lucide-react'`. Icons are stroke-based at `strokeWidth={2}` (or `3` on the FAB plus icon), and sized in increments: `12, 14, 16, 18, 20, 22, 24`.

For HTML prototypes in this folder we load Lucide directly from CDN:
```html
<script type="module">
  import { createIcons, icons } from 'https://unpkg.com/lucide@0.563.0/dist/esm/lucide.js';
  createIcons({ icons });
</script>
```
Or the simpler attribute API:
```html
<script src="https://unpkg.com/lucide@latest"></script>
<i data-lucide="map-pin"></i>
<script>lucide.createIcons();</script>
```

### Color rules for icons
- **Coral** (`flameRed`) — Calendar, Clock, time-related metadata; live indicators.
- **Orange** (`brightOrange` / `bg-orange-600`) — MapPin, location-related metadata.
- **Gold** (`ignitionGold`) — checks, sparkles, navigation hints, eyebrow accents.
- **Muted** (`mutedText`) — non-active icons, social links resting state.
- Social-platform icons get the platform's brand color *only on hover* (Instagram → pink-500, Twitter → blue-400, Facebook → blue-600, Globe → emerald-500). Resting they stay muted.
- Icon background tile pattern (event details): `p-3` square, `bg-{color}/20` fill, `text-{color}` stroke, `rounded-2xl`.

### Logos & marks
- **Twin-flames icon** — two interlocking flame paths, one base gradient (coral→orange) and one tip gradient (orange→gold) at 0.9 opacity. Aspect 56×76. Used solo in tight headers and as the favicon (`assets/sparked-icon.svg`).
- **Lockup** — twin-flames + "Sparked" wordmark in Montserrat Black 900, gradient-clipped on dark backgrounds, solid Deep Night `#14213D` on light.
- **App icon** — `assets/sparked-app-icon-1024.svg`. Rounded square (220px radius on a 1024 grid), Deep Night `#14213D` bg, with the twin-flames mark centered. Same brand mark as the lockup — do not substitute a different glyph.ntered with a small gold dot accent.
- **Never** stretch or recolor the gradient. Spacing around the lockup ≥ 30% of icon size.

### No emoji, no unicode glyphs
The brand explicitly avoids emoji as a visual language. The only special chars in product copy are em-dash, pipe `|`, and curly quotes. Even decorative bullets in lists are Lucide `Check` or `CheckCircle2`.

---

## Index — what to read next

1. `colors_and_type.css` — drop into any HTML page for tokens.
2. `preview/` — every card you see in the Design System tab is here.
3. `ui_kits/mobile-app/index.html` — interactive recreation of the patron app.
4. `SKILL.md` — for using this folder as an Agent Skill.

### Caveats / known substitutions
- **Fonts** are loaded from Google Fonts CDN (Inter + Montserrat). Sparked's product loads them the same way; no .ttf files were checked into the source repo. **Ask the user to provide self-hosted font files if shipping production code that needs offline fonts.**
- **Icons** ship via Lucide CDN — same library the codebase uses, so no substitution.
- **Spark gradient** is calibrated as-is for both light and dark modes; do not adjust stops for perceived contrast.

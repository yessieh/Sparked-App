# Sparked Voice And Tone Guide

## Brand Position
Sparked is premium but approachable. It helps communities discover quality events without hype or clutter.

## Voice Pillars
- **Confident:** clear and concise, no overexplaining.
- **Warm:** community-first language and inclusive phrasing.
- **Elevated:** polished wording without sounding corporate.
- **Trustworthy:** factual claims, no misleading promises.

## Approved Tone Patterns
- Action-oriented lines: "Discover what's happening nearby."
- Quality framing: "Curated local experiences."
- Community framing: "Built for organizers and neighbors."

## Disallowed Patterns
- Manipulative urgency ("last chance", "guaranteed sellout", "act now").
- Unsupported claims ("best in city", "guaranteed outcomes").
- Sensitive targeting or discriminatory phrasing.
- Safety, legal, or medical advice wording.

## AI Copy Rules
- Keep generated descriptions short and factual.
- Avoid absolute claims or unverifiable superlatives.
- Avoid references to protected classes or polarizing political framing.
- Refuse to generate disallowed, unsafe, or abusive content.
- Strip HTML and unsafe markup before persistence/rendering.

## UX Copy Guidelines
- Use sentence case for body text and concise CTA labels.
- Use uppercase sparingly for metadata labels and microcopy.
- Prefer plain language over internal jargon.

## Brand Colors

### Background Scale
- `#14213D` — Page background. The default canvas for all surfaces.
- `#0f1a30` — Deep navy. Used for nav, overlays, and shadow layers.
- `#192847` — Mid navy. Used for card fills and elevated surfaces.

### The Spark Gradient
The signature brand moment. Applied at 135° from coral to gold.
```css
background: linear-gradient(135deg, #ff5f4e 0%, #ff8c38 50%, #ffca3a 100%);
```

Use on: primary CTAs, logo, active headings, icon fills, gradient borders,
numbered labels, and checked states. Never use as pure decoration — the
gradient signals something actionable every time it appears.

### Accent Stops
Individual stops pulled from the gradient for single-color contexts.

- `#ff5f4e` — Coral. Energy, alerts, live badges, hover glows.
- `#ff8c38` — Orange. Eyebrow labels, icons, hover border states.
- `#ffca3a` — Gold. Links, stat numbers, secondary CTA text.

### Text Scale
- `#eef0ff` — Primary. Headings and body copy.
- `rgba(238, 240, 255, 0.50)` — Muted. Descriptions and secondary labels.
- `rgba(238, 240, 255, 0.25)` — Hint. Dividers, placeholders, "or" separators.

### Glass & Surface
- `rgba(255, 255, 255, 0.04)` — Card background fill.
- `rgba(255, 255, 255, 0.08)` — Default border.
- `rgba(255, 255, 255, 0.09)` — Hover border.

### Color Usage Rules
- The spark gradient is reserved for actionable elements only. Do not apply
  it to backgrounds, decorative shapes, or non-interactive illustrations.
- Never place muted text on a card fill without sufficient contrast. Test at
  the `0.50` opacity level minimum for body copy.
- Gold (`#ffca3a`) is a link and highlight color, not a primary text color.
  Use it sparingly so it retains signal value.
- Coral (`#ff5f4e`) carries urgency. Reserve it for live indicators, alerts,
  and the leading stop of the gradient — not general accent use.

  ## Light Mode Colors

Sparked's light mode uses a cool gray canvas with the same spark gradient
unchanged. Shadows replace glass surfaces, and the navy text scale replaces
the light text scale. The gradient is the only element shared between modes.

### Background Scale
- `#f4f5f8` — Page background. The default canvas for all light mode surfaces.
- `#ffffff` — White. Used for cards, nav, stats bar, and elevated surfaces.
- `#eceef3` — Subtle. Used for tag rows, pill fills, hover states, and footer.
- `#e6e8ef` — Deeper. Used for dividers and pressed states.

### The Spark Gradient
Identical to dark mode — do not adjust stops or angle for light mode.
```css
background: linear-gradient(135deg, #ff5f4e 0%, #ff8c38 50%, #ffca3a 100%);
```

The same usage rules apply. The gradient signals something actionable every
time it appears. Never use it as a background wash or decorative fill.

### Accent Stops
Same stops as dark mode. Behavior is consistent across both themes.

- `#ff5f4e` — Coral. Energy, alerts, live badges, hover glows.
- `#ff8c38` — Orange. Eyebrow labels, icons, hover border states.
- `#ffca3a` — Gold. Links, stat numbers, secondary CTA text.

### Text Scale
- `#1c2840` — Primary. Headings and body copy.
- `#7a849e` — Muted. Descriptions and secondary labels.
- `#b0b8cc` — Hint. Dividers, placeholders, "or" separators.

### Borders
- `rgba(28, 40, 64, 0.08)` — Default border.
- `rgba(28, 40, 64, 0.13)` — Mid border. Used for CTA outlines and emphasis.

### Shadows
Light mode uses shadows instead of glass surfaces to convey elevation.

- `0 2px 12px rgba(28, 40, 64, 0.05)` — Card resting state.
- `0 4px 24px rgba(28, 40, 64, 0.07)` — Event preview and about card.
- `0 20px 48px rgba(28, 40, 64, 0.10)` — Card hover / lifted state.
- `0 6px 22px rgba(255, 95, 78, 0.24)` — Gradient CTA button resting glow.
- `0 10px 30px rgba(255, 95, 78, 0.34)` — Gradient CTA button hover glow.

### Color Usage Rules
- The spark gradient is unchanged from dark mode. Never adjust it for
  perceived contrast on light backgrounds — it is calibrated as-is.
- White (`#ffffff`) is the card surface, not the page background. Do not
  use it as the base canvas or the hierarchy between page and card collapses.
- Muted text (`#7a849e`) is the minimum for body copy on light surfaces.
  Do not go lighter than this for readable descriptions or feature text.
- Coral (`#ff5f4e`) at full opacity can feel harsh on white. Prefer the
  orange stop (`#ff8c38`) for single-color icon fills and borders in light mode.
- Icon fills use `rgba(255, 140, 56, 0.08–0.12)` wash, not the full gradient,
  to avoid competing with gradient headings and CTAs in the same section.
- Ambient heat gradients are reduced to `0.03–0.05` opacity in light mode.
  They provide warmth without making the background feel tinted or unclean.

## Component & CTA Rules

### Card Anatomy Rules
- The ticket stub is the universal event card. One component, two variants:
  photo (Explore/discovery) and compact (Saved/logistics). Stripe, perforated
  divider, and right utility column are constant across both.
- The perforated divider is reserved for events only. Future sponsored
  content (dining, shopping, services) uses distinct card anatomies with
  the same tokens — never the perforation.
- Stripe color encodes event category. Green (#4ade80) is a semantic color
  for free / going / confirmed states — not a category or brand accent.

### CTA Color Rules
- Spark gradient: host and monetization actions everywhere
  (List an Event, tier signups, publishing).
- Solid white: consumer entry actions on landing surfaces only
  (Browse Local Events). Never used in-app.
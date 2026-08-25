// Sparked color tokens.
// Values sourced from SPARKED_STATE.md "Brand System" (spec of record) and the
// frozen prototype's APP_THEME_VARS / colors_and_type.css. Where the prototype
// drifted from the Brand System lock (card fill 0.03 vs locked 0.04, card
// border 0.10 vs locked 0.08), the locked values win.
//
// The category color map is deliberately NOT here — it has locked changes
// pending (Curbside ≠ green) and lands with the taxonomy at schema stage.

/**
 * `#rrggbb` + alpha → an `rgba()` string.
 *
 * Exists so a tint is DERIVED from its token rather than hardcoded beside it.
 * `danger` previously had twelve hardcoded `rgba(239,68,68, α)` copies across
 * two files; when the token moved, every one of them would have stayed at the
 * old hue. On a delete confirmation a panel whose wash disagrees with its own
 * label is worse than either being wrong alone — so the wash is computed from
 * the same value the label reads.
 *
 * Second effect, and it is a fix rather than a side effect: those literals were
 * dark-mode reds hardcoded into components that render in BOTH modes. Deriving
 * from `theme.colors.danger` makes the tints mode-aware for the first time.
 *
 * Expects a 7-character `#rrggbb`; it is only ever fed palette tokens.
 */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Mode-independent brand constants. #14213D stays literal in both modes. */
export const brand = {
  navy: '#14213D',
  deepNavy: '#0f1a30',
  sparkCoral: '#ff5f4e',
  sparkOrange: '#ff8c38',
  sparkGold: '#ffca3a',
  flameRed: '#ff6348',
  brightOrange: '#FCA311',
  ignitionGold: '#F7B731',
} as const;

/**
 * The Spark gradient — signature brand moment, 135° coral→orange→gold.
 * Reserved for ACTIONABLE elements only (CTAs, host/monetization actions,
 * active filter pills, countdowns, logo). Never decorative. Identical in
 * light mode.
 */
export const sparkGradient = {
  angleDeg: 135,
  stops: [
    { offset: 0, color: brand.sparkCoral },
    { offset: 0.5, color: brand.sparkOrange },
    { offset: 1, color: brand.sparkGold },
  ],
  /** For web/SVG contexts that accept CSS. */
  css: `linear-gradient(135deg, ${brand.sparkCoral} 0%, ${brand.sparkOrange} 50%, ${brand.sparkGold} 100%)`,
} as const;

export interface Palette {
  bg: string;
  /** Deep navy — nav, overlays, heavy shadows (light mode: white). */
  bgDeep: string;
  cardBg: string;
  cardBorder: string;
  borderSoft: string;
  borderStrong: string;
  divider: string;
  surfaceHover: string;
  iconChipBg: string;
  tabbarBg: string;
  text: string;
  textMuted: string;
  textFaint: string;
  textHint: string;
  /** SEMANTIC only — free / going / confirmed. Never a brand accent or category color. */
  green: string;
  danger: string;
  focusRing: string;
  /**
   * EventStub / Event Detail stripe. Encodes the LANE — free community post vs
   * paid listing — NOT the category. See theme/categoryColors.ts for the
   * reversal of the old "stripe = category color" rule.
   *
   * The two are deliberately close: the CURBSIDE badge already states the lane
   * in text, and the stripe only reinforces it. Do not widen the gap between
   * them. Each pair IS held to WCAG 1.4.11 (3:1) against its own card surface —
   * ratios recorded in docs/ACCESSIBILITY.md.
   */
  stripeFree: string;
  stripePaid: string;
}

export const darkPalette: Palette = {
  bg: brand.navy,
  bgDeep: brand.deepNavy,
  cardBg: 'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(255,255,255,0.08)',
  borderSoft: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.20)',
  divider: 'rgba(255,255,255,0.06)',
  surfaceHover: 'rgba(255,255,255,0.12)',
  iconChipBg: 'rgba(255,255,255,0.04)',
  tabbarBg: 'rgba(15,26,48,0.85)',
  text: '#eef0ff',
  textMuted: 'rgba(238,240,255,0.50)',
  textFaint: 'rgba(238,240,255,0.35)',
  textHint: 'rgba(238,240,255,0.25)',
  green: '#4ade80',
  // #ef4444 was 4.24:1 on the page and 3.80:1 on a card — a live 1.4.3 failure
  // on every error surface. #f87171 is 5.77 / 5.17 and holds hue 0.0°, so
  // danger still reads red-red. brand.flameRed was the obvious candidate and
  // was REJECTED: it is 3.1° from sparkCoral, stop 0 of the spark gradient,
  // which would paint destructive labels the colour of the primary CTA. See
  // docs/ACCESSIBILITY.md Entry 5.
  danger: '#f87171',
  focusRing: brand.ignitionGold,
  // 6.05:1 and 4.65:1 against the composited card surface (#1d2a45).
  stripeFree: '#E8964A',
  stripePaid: '#E86F52',
};

export const lightPalette: Palette = {
  bg: '#f4f5f8',
  bgDeep: '#ffffff',
  cardBg: '#ffffff',
  cardBorder: 'rgba(28,40,64,0.08)',
  borderSoft: 'rgba(28,40,64,0.08)',
  borderStrong: 'rgba(28,40,64,0.13)',
  divider: 'rgba(28,40,64,0.10)',
  surfaceHover: 'rgba(28,40,64,0.08)',
  iconChipBg: '#eceef3',
  tabbarBg: 'rgba(255,255,255,0.85)',
  text: '#1c2840',
  textMuted: '#7a849e',
  textFaint: '#9aa3ba',
  textHint: '#b0b8cc',
  green: '#16a34a',
  danger: '#b91c1c',
  focusRing: brand.sparkOrange,
  // Darker than the dark-mode pair, same hue — the semantic-green precedent
  // (#4ade80 -> #16a34a). 3.51:1 and 4.90:1 against #ffffff cards.
  stripeFree: '#C4762E',
  stripePaid: '#C4472C',
};

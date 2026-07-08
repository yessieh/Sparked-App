// Sparked color tokens.
// Values sourced from SPARKED_STATE.md "Brand System" (spec of record) and the
// frozen prototype's APP_THEME_VARS / colors_and_type.css. Where the prototype
// drifted from the Brand System lock (card fill 0.03 vs locked 0.04, card
// border 0.10 vs locked 0.08), the locked values win.
//
// The category color map is deliberately NOT here — it has locked changes
// pending (Curbside ≠ green) and lands with the taxonomy at schema stage.

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
  danger: '#ef4444',
  focusRing: brand.ignitionGold,
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
};

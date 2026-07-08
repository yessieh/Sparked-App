// Sparked typography tokens.
// Montserrat (700–900) = display/headings/countdowns; Inter (400–600) = body/UI.
// Font families are the @expo-google-fonts registered names, loaded in
// src/app/_layout.tsx. Sizes are the prototype type scale's base (mobile)
// values — the CSS clamp() upscaling was web-viewport behavior, not a token.

export const fontFamilies = {
  displayBold: 'Montserrat_700Bold',
  displayExtraBold: 'Montserrat_800ExtraBold',
  displayBlack: 'Montserrat_900Black',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
} as const;

export const fontSizes = {
  display: 56,
  h1: 36,
  h2: 28,
  h3: 20,
  body: 16,
  bodySm: 14,
  caption: 12,
  eyebrow: 10,
  tick: 9,
} as const;

/** Multipliers — multiply by fontSize for RN lineHeight (which is absolute). */
export const lineHeights = {
  tight: 1.0,
  snug: 1.1,
  normal: 1.5,
  relaxed: 1.7,
} as const;

/** Tracking in em. RN letterSpacing is absolute px — use tracking() below. */
export const trackingEm = {
  tight: -0.01,
  normal: 0,
  wide: 0.18,
  widest: 0.2,
  eyebrow: 0.25,
} as const;

/** Convert an em tracking value to RN letterSpacing for a given font size. */
export const tracking = (em: number, fontSize: number): number => em * fontSize;

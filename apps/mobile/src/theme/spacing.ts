// Sparked spacing & radii tokens.
// Radii come straight from the prototype's colors_and_type.css. The spacing
// scale is a 4pt ladder formalizing the prototype's ad-hoc paddings.

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radii = {
  sm: 8, // pills, micro-tags
  md: 12, // small buttons
  lg: 16, // buttons, fields
  xl: 24, // surface card
  xxl: 28, // elevated card
  xxxl: 32, // modal blocks
  huge: 40, // modal shells / dock
  pill: 9999,
} as const;

/**
 * Layout breakpoints. `desktop` is the width at which COORDINATOR surfaces
 * (Create Event, Workspace, Pricing) earn real multi-column desktop layouts —
 * the per-surface responsive lock in SPARKED_STATE ("Responsive strategy").
 * Below it, treat the viewport as a phone.
 */
export const breakpoints = {
  desktop: 1024,
} as const;

/** boxShadow strings (RN 0.76+ supports the CSS boxShadow style prop). */
export interface Shadows {
  card: string;
  elevated: string;
  cta: string;
  ctaHover: string;
}

export const darkShadows: Shadows = {
  card: '0 4px 24px rgba(0,0,0,0.20)',
  elevated: '0 20px 50px rgba(0,0,0,0.30)',
  cta: '0 6px 22px rgba(255,95,78,0.24)',
  ctaHover: '0 10px 30px rgba(255,95,78,0.34)',
};

export const lightShadows: Shadows = {
  card: '0 2px 12px rgba(28,40,64,0.05)',
  elevated: '0 4px 24px rgba(28,40,64,0.07)',
  cta: '0 6px 22px rgba(255,95,78,0.24)',
  ctaHover: '0 10px 30px rgba(255,95,78,0.34)',
};

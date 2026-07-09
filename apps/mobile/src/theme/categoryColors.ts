// Category color map — stripe + badge colors keyed by canonical category id
// (see supabase categories table / SCHEMA LOCK 4).
// Ported from the prototype WITH the locked fixes:
//   • Curbside = #818cf8 indigo (decided 2026-07-08; prototype's green
//     violated "green is semantic-only", and Pop-Ups keeps its #38bdf8)
//   • no 'Live' entry ('Live' was never a category)
// Wellness/Nightlife/Sports/Tech fall back to brand orange PENDING a design
// pass — assign real hues before those categories ship in the feed.

import { brand } from './colors';

export const CATEGORY_COLORS: Record<string, string> = {
  curbside: '#818cf8',
  markets: '#2dd4bf',
  music: '#f472b6',
  art: '#a78bfa',
  food: '#fbbf24',
  community: '#fb923c',
  'pop-ups': '#38bdf8',
  outdoors: '#84cc16',
  family: '#fb7185',
};

/** Stripe/badge color for an event: first category wins; brand-orange fallback. */
export function categoryColor(categoryIds: string[] | null | undefined): string {
  for (const id of categoryIds ?? []) {
    const c = CATEGORY_COLORS[id];
    if (c) return c;
  }
  return brand.brightOrange;
}

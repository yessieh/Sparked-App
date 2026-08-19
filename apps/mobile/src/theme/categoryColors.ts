// Stripe color — LANE, not category.
//
// THIS REVERSES THE EARLIER "stripe = category color" LOCK, deliberately. The
// stripe now encodes the LANE: a free community post (Curbside) vs a paid
// listing (Standard / Plus). Three reasons the old rule did not survive
// contact:
//
//   1. It was never a complete system. Only 9 of the 13 categories ever got a
//      hue — Wellness, Nightlife, Sports and Tech fell through to brand orange,
//      so for those four the stripe already carried no category information at
//      all, and rendered the same color as the badge beside it.
//   2. The badges render flat #FCA311 regardless of category, so color was
//      doing only half the job even where a hue existed.
//   3. The nine hues were Tailwind defaults (#818cf8 indigo-400, #2dd4bf
//      teal-400, and so on), which is why they read as off-brand.
//
// AND THE ONE THAT MATTERS MOST: all ten of those values FAILED WCAG 1.4.11
// (3:1 for non-text) against #ffffff light-mode cards — measured 1.67:1 to
// 2.98:1. They passed only in dark mode, which is why it went unnoticed. Full
// measurements in docs/ACCESSIBILITY.md.
//
// NO INFORMATION IS LOST. The category is still conveyed as TEXT in the badges
// (all 13 labels, CATEGORY_LABELS in EventStub.tsx). The stripe was redundant
// with text where it worked and misleading where it did not.
//
// THE STRIPE IS NEVER THE SOLE CARRIER OF THE LANE EITHER: a Curbside post is
// auto-tagged `curbside` (0001's auto_tag_curbside trigger), that category is
// sort_order 0 and the RPCs order by sort_order, so the CURBSIDE badge sorts
// first and cannot be pushed into the `+N` overflow by the 2-badge cap. The
// lane is always stated in words; the stripe only reinforces it.

import type { Palette } from './colors';
import { brand } from './colors';

/** Free community post (Curbside) vs paid listing (Standard / Plus). */
export type EventLane = 'free' | 'paid';

/**
 * THE ONE DEFINITION OF THE RULE. Five call sites derive `lane` from their own
 * data; they all come through here so the rule cannot drift between surfaces.
 *
 * Keyed on `tier_id`, because the lane is what tier names — NOT on the
 * `curbside` category id, which is a consequence of the tier rather than the
 * thing itself.
 *
 * `tier_id` deliberately does NOT travel on FeedEvent: the locked EventStub
 * rule is consumer-facing data only, and tier is host economics (see
 * organizer/[id].tsx). Callers hold the tier and pass the derived lane, so the
 * card never carries it. Standard and Plus are indistinguishable here by
 * design — the only bit exposed is one the CURBSIDE badge already shows.
 */
export const laneFor = (tierId: string | null | undefined): EventLane =>
  tierId === 'curbside' ? 'free' : 'paid';

/** Stripe color for a lane, resolved against the active palette. */
export const laneStripeColor = (lane: EventLane, colors: Palette): string =>
  lane === 'free' ? colors.stripeFree : colors.stripePaid;

// ---------------------------------------------------------------------------
// LEGACY — SITE MAP TINT ONLY. Not used by any stripe.
//
// KEPT DELIBERATELY, and only because deleting it would have changed a surface
// this pass is not allowed to touch. `SiteMap` takes a `tint` and three call
// sites feed it from here (EventDetailView, and the wizard's Details + Review
// steps). Pointing those at the lane color would make every site map render
// the SAME single color, because site maps are a Plus feature and a Plus event
// is never Curbside — a degenerate result nobody chose.
//
// OPEN ITEM: SiteMap needs its own accent decision, most likely a fixed brand
// color rather than anything category- or lane-derived. When that lands, this
// whole block goes with it and the file is purely a lane resolver.
//
// Nothing else may use these. New code wants laneStripeColor above.
// ---------------------------------------------------------------------------
const LEGACY_SITEMAP_TINTS: Record<string, string> = {
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

/** @deprecated SiteMap tint only — pending SiteMap's own accent decision. */
export function categoryColor(categoryIds: string[] | null | undefined): string {
  for (const id of categoryIds ?? []) {
    const c = LEGACY_SITEMAP_TINTS[id];
    if (c) return c;
  }
  return brand.brightOrange;
}

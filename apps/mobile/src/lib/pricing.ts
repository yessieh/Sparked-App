// Pricing spine — duration bands + tier copy. Transactional, per-event, NO
// subscription; price scales by DURATION BAND and is shown as ONE clean total.
// Per-day pricing is dead everywhere (locked).
//
// Where each fact lives, deliberately:
//   * PRICES        → `tier_prices` (DB). SCHEMA_PLAN §4.3 calls this the
//                     server-side pricing source and the client's copy
//                     "display only" — publish_paid_event (0010) re-reads it
//                     and stamps publish_fee_cents itself, so nothing here is
//                     load-bearing for money.
//   * CAPS / FLAGS  → `tiers` (DB): max_photos, allows_site_map.
//   * MARKETING COPY→ TIER_COPY below (ported from the frozen reference's
//                     PRICING_TIERS, which has no DB home).
// One canonical source per fact — the Pricing screen and this wizard both read
// these, so a price change is a data change, never a code change.
//
// This module is intentionally pure (no react-native imports) so it can be
// unit-run outside the bundler.

export type TierId = 'curbside' | 'standard' | 'plus';
export type DurationBand = 'single' | 'multi' | 'extended';

export interface Tier {
  id: TierId;
  label: string;
  sort_order: number;
  max_photos: number;
  allows_site_map: boolean;
  single_day_only: boolean;
}

export interface TierPrice {
  tier_id: string;
  duration_band: DurationBand;
  amount_cents: number;
}

/** Tiers offered INSIDE the paid wizard. Curbside is its own free lane. */
export const WIZARD_TIERS: TierId[] = ['standard', 'plus'];

/**
 * Marketing copy, ported from the reference's PRICING_TIERS.
 *
 * Plus's "Paid entry" bullet is deliberately DROPPED (ruled 2026-07-16):
 * entry-fee display is ALL-TIER per SPARKED_STATE — `tiers`
 * .allows_paid_entry_display is seeded true for every tier — so advertising it
 * as a Plus unlock would sell something Standard already does. Plus
 * differentiates on the 10-photo gallery and the site map / vendor pins.
 */
export const TIER_COPY: Record<'standard' | 'plus', {
  desc: string;
  features: string[];
  inheritsFrom?: string;
}> = {
  standard: {
    desc: 'A clean, linkable event page on the local feed — with your social links. Everything you need to get the word out.',
    features: [
      'Up to 3 photos',
      'Clean, linkable event page',
      'Social links',
      'Shows on the distance feed',
      'Any event duration',
    ],
  },
  plus: {
    desc: 'Unlocks a 10-photo gallery and a site map with vendor pins — for events that need the extra reach.',
    inheritsFrom: 'Standard',
    features: ['10-photo gallery', 'Interactive site map with vendor pins'],
  },
};

/** Inclusive day span of a local YMD range. "2026-07-16"→"2026-07-19" = 4. */
export function eventDays(startYMD: string, endYMD?: string | null): number {
  const a = new Date(`${startYMD}T00:00:00`).getTime();
  const b = new Date(`${endYMD || startYMD}T00:00:00`).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 1;
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

/** Single-day / Multi-day (2–4) / Extended (5+) — the locked bands. */
export function durationBand(days: number): DurationBand {
  if (days <= 1) return 'single';
  if (days <= 4) return 'multi';
  return 'extended';
}

/** The band's own name: "Single day" / "Multi-day" / "Extended". */
export function bandName(days: number): string {
  return { single: 'Single day', multi: 'Multi-day', extended: 'Extended' }[durationBand(days)];
}

/** The span in the host's words: "Single-day event" / "4-day event". */
export function bandLabel(days: number): string {
  return days <= 1 ? 'Single-day event' : `${days}-day event`;
}

/** Whole-dollar display for whole-dollar prices; cents only when they exist. */
export function formatUSD(cents: number): string {
  return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`;
}

/** The ONE clean total for a tier at a draft's actual band. */
export function priceCents(
  prices: TierPrice[],
  tierId: string,
  days: number,
): number | null {
  const band = durationBand(days);
  const row = prices.find((p) => p.tier_id === tierId && p.duration_band === band);
  return row ? row.amount_cents : null;
}

/** "4-day event · $20" — the tier card's single price statement. */
export function bandPriceLabel(prices: TierPrice[], tierId: string, days: number): string {
  const cents = priceCents(prices, tierId, days);
  return cents === null ? bandLabel(days) : `${bandLabel(days)} · ${formatUSD(cents)}`;
}

/**
 * The host's IANA zone, passed to publish_paid_event so the band is computed
 * on their wall clock rather than UTC (a 7pm Fri → 10am Mon event spans 4
 * local days but only 3 UTC days — a whole band of mispricing). Falls back to
 * UTC, which the RPC also does for an unknown zone.
 */
export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

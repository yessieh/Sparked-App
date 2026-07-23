// Custom-entry moderation — the ported "blocklist + substring/dedupe matcher"
// primitive (BUILD_PLAN §1.2). Shared by any free-text custom entry so the
// pattern stays identical everywhere: today the paid wizard's custom VENDOR
// TYPES, tomorrow custom categories/amenities/interests if they ever ship.
//
// Pure (no react-native imports) so it unit-runs outside the bundler.

/** Hate/harmful substring blocklist (ported from the reference's
 * CATEGORY_BLOCKLIST). Substring match, case-insensitive — deliberately blunt:
 * it guards free-text entries that would otherwise reach public surfaces. */
export const BLOCKLIST = [
  'hate', 'nazi', 'racist', 'slur', 'kill', 'terror', 'bomb', 'porn', 'drugs', 'weapon', 'gun', 'assault',
];

export function isBlocked(s: string): boolean {
  const v = s.toLowerCase();
  return BLOCKLIST.some((b) => v.includes(b));
}

/**
 * Substring suggestions from a known option set for the current query,
 * excluding anything already used (dedupe). Empty query → no suggestions.
 */
export function suggestMatches(query: string, options: string[], used: string[] = [], limit = 4): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const usedLower = used.map((u) => u.toLowerCase());
  return options
    .filter((o) => o.toLowerCase().includes(q) && !usedLower.includes(o.toLowerCase()))
    .slice(0, limit);
}

/**
 * Case-insensitive canonicalization against a known set: if the entry matches
 * an existing option ignoring case, snap to that option's casing (dedupe by
 * case); otherwise keep the trimmed input as a genuinely custom entry.
 */
export function canonicalize(query: string, options: string[]): string {
  const v = query.trim();
  return options.find((o) => o.toLowerCase() === v.toLowerCase()) ?? v;
}

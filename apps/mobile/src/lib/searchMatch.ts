// Explore search — the pure matcher, ported from the design reference's
// `ffMatch` / `Highlight` (design-reference/ui_kits/mobile-app/FilterFinder.jsx
// :48-71). Pure (no react-native imports) so it unit-runs outside the bundler,
// same posture as lib/moderation.ts.
//
// THE SEMANTICS ARE THE REFERENCE'S, DELIBERATELY AND EXACTLY:
//   • EXACT case-insensitive SUBSTRING against the visible text. No fuzzy
//     matching, no edit distance, no synonyms, no keyword expansion. If it is
//     not literally in the string, it does not match.
//   • Results sort by WHERE the match starts (prefix matches first), then by
//     length so the shortest of two equal-offset matches wins.
//   • The highlight covers ONE contiguous span — the FIRST occurrence only. A
//     second occurrence in the same string is left unmarked. That is the
//     reference's behaviour (it takes a single `indexOf`), kept rather than
//     "improved", because a multi-span highlight is a different visual language
//     and this arc is not the place to invent one.
//
// WHAT THE CALLER MUST NOT INFER FROM THIS FILE: nothing here reaches a
// database. Tier 2 (event titles) is a scan over rows the feed has ALREADY
// fetched — see the note in components/ExploreSearch.tsx.

/** One hit: the matched item plus where in its label the query begins. */
export interface LabelMatch<T> {
  item: T;
  /** 0-based index into the label at which the query starts. */
  at: number;
}

/**
 * Substring-match `query` against each item's label.
 *
 * An empty or whitespace-only query matches NOTHING (returns `[]`) rather than
 * everything — a search box that has not been typed into yet has no opinion,
 * and returning the full set would make the panel flash its entire contents on
 * first focus.
 */
export function matchLabels<T>(
  query: string,
  items: readonly T[],
  labelOf: (item: T) => string,
): LabelMatch<T>[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: LabelMatch<T>[] = [];
  for (const item of items) {
    const at = labelOf(item).toLowerCase().indexOf(q);
    if (at >= 0) hits.push({ item, at });
  }
  return hits.sort(
    (a, b) => a.at - b.at || labelOf(a.item).length - labelOf(b.item).length,
  );
}

/** The three pieces a highlighted label renders as. `match` is the span to
 *  emphasise; either side may be empty. */
export interface HighlightParts {
  before: string;
  match: string;
  after: string;
}

/**
 * Split `text` around the first case-insensitive occurrence of `query`.
 * Returns null when there is no match (or no query), so the caller renders the
 * plain string rather than a three-part one with two empty pieces.
 *
 * The slice uses the ORIGINAL text, not the lowercased copy, so the label keeps
 * its own casing — "Pop-Ups" typed as "pop" highlights "Pop", not "pop".
 */
export function highlightParts(text: string, query: string): HighlightParts | null {
  const q = query.trim();
  if (!q) return null;
  const at = text.toLowerCase().indexOf(q.toLowerCase());
  if (at < 0) return null;
  return {
    before: text.slice(0, at),
    match: text.slice(at, at + q.length),
    after: text.slice(at + q.length),
  };
}

/**
 * The overflow band's outer edge: `min(radius * 1.5, radius + 15)`.
 *
 * Ported verbatim from the reference (Screens.jsx:737). The two terms matter at
 * different scales — at a 5 mi radius the multiplier wins (7.5 mi) and at 60 mi
 * the additive term does (75 mi) — so a small radius is not expanded absurdly
 * far in proportional terms and a large one is not expanded absurdly far in
 * absolute ones.
 */
export const overflowCap = (radius: number): number =>
  Math.min(radius * 1.5, radius + 15);

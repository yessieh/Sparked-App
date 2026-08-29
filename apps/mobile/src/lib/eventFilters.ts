// What a filter MEANS — the one definition, shared by the two surfaces that
// filter events.
//
// WHY THIS FILE EXISTS RATHER THAN AN EXPORT FROM ExploreSearch. `matchesFilter`
// was module-local in components/ExploreSearch.tsx, and the obvious move was to
// export it from there. That inverts the dependency: (tabs)/index.tsx is the
// FEED, and having the feed import its filtering out of a panel component means
// the next person restructuring the panel takes the feed with them. The
// predicate belongs to neither surface, so it lives under neither.
//
// The rule it enforces is that the header pills and the search panel can never
// disagree about what "Music" means. Two implementations of one predicate drift
// the moment either is touched, and the drift is silent — both keep compiling
// and both keep returning events.
//
// Pure (no react-native imports) so it unit-runs outside the bundler, same
// posture as lib/moderation.ts and lib/searchMatch.ts.

import type { FeedEvent } from '../components/EventStub';

export type FilterKind = 'category' | 'price';

export interface SearchFilter {
  /** Category id (`pop-ups`) or the price pseudo-id (`free`). */
  id: string;
  /** What the user SEES, and what the search matcher matches against — the
   *  table's `label`, never its id. "Pop-Ups", not "pop-ups". */
  label: string;
  kind: FilterKind;
}

/** The one non-category filter. Free is a price test, not a taxonomy row, so it
 *  is declared here rather than faked into the categories list. */
export const FREE_FILTER: SearchFilter = { id: 'free', label: 'Free', kind: 'price' };

/**
 * THE predicate. A filter's count, the pill row's contents, the feed's filtered
 * view and the search panel's results all resolve through this one function, so
 * a filter that says "3 nearby" cannot then show 2.
 *
 * `categories` is `string[] | NULL`, not `string[]` — `array_agg` returns NULL
 * for zero rows, so an event carrying no categories arrives as null rather than
 * an empty array. The `?? []` is load-bearing, not defensive.
 */
export function matchesFilter(filter: SearchFilter, event: FeedEvent): boolean {
  return filter.kind === 'price'
    ? event.entry_fee_cents === 0
    : (event.categories ?? []).includes(filter.id);
}

/**
 * Every filter's count, in ONE pass over the events.
 *
 * Keyed by FILTER id, so `free` sits in the same map as the 13 category ids and
 * both consumers read one structure.
 *
 * The shape is the point. The search panel previously computed
 * `events.filter(...).length` inline per row per render — 14 passes over the
 * array every time the panel re-rendered — and the pill row needs a count for
 * every category at once to decide which pills exist at all. Done the same way
 * twice that is ~26 passes per render across two surfaces; done here it is one
 * pass whose cost is the number of category tags in the feed.
 *
 * COUNTS ARE OVER THE UNFILTERED FEED, always. The caller must pass the full
 * event array, never the filtered view: counting the filtered view would make
 * every pill except the selected ones drop to zero the moment anything was
 * selected, and — under the "a pill exists only if it has events" rule — the
 * rest of the row would vanish on first tap.
 */
export function buildFilterCounts(events: readonly FeedEvent[]): Map<string, number> {
  const counts = new Map<string, number>();
  const bump = (key: string) => counts.set(key, (counts.get(key) ?? 0) + 1);
  for (const event of events) {
    for (const id of event.categories ?? []) bump(id);
    if (event.entry_fee_cents === 0) bump(FREE_FILTER.id);
  }
  return counts;
}

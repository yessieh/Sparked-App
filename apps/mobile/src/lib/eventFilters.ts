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
import { matchLabels } from './searchMatch';

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

// ===========================================================================
// CATEGORY BLOCKS (Architecture Decision 7; RULINGS LOCKED 2026-09-22, as
// amended for the Explore arc). Pure, like everything above, so the rules run
// outside the bundler — and so Explore and its search panel cannot disagree
// about what "blocked" means.
//
// SCOPE: Explore and Explore search ONLY. Saved, Organizer Profile and
// /event/[id] never call these — a block narrows discovery, it does not hide
// what the user chose or was sent.
// ===========================================================================

/**
 * The event's categories that are blocked, in TAXONOMY order (`order` maps a
 * category id to its sort_order; ids missing from it sort last, stably).
 *
 * THE RULE: an event is blocked if ANY of its categories is blocked. NULL
 * categories (an uncategorised event — `array_agg` over zero rows) are never
 * blocked. An empty `blocked` set blocks nothing, which is also how "signed
 * out" and "the read failed" arrive here.
 */
export function blockingCategories(
  event: FeedEvent,
  blocked: ReadonlySet<string>,
  order?: ReadonlyMap<string, number>,
): string[] {
  if (blocked.size === 0 || !event.categories) return [];
  const hits = event.categories.filter((id) => blocked.has(id));
  if (order && hits.length > 1) {
    const rank = (id: string) => order.get(id) ?? Number.MAX_SAFE_INTEGER;
    hits.sort((a, b) => rank(a) - rank(b));
  }
  return hits;
}

/** True when ANY of the event's categories is blocked. */
export function isBlocked(event: FeedEvent, blocked: ReadonlySet<string>): boolean {
  return blocked.size > 0 && (event.categories ?? []).some((id) => blocked.has(id));
}

/**
 * The card chip's label: the FIRST blocking category's label by taxonomy
 * order, plus "+N" when more than one blocks it. `undefined` when the event is
 * not blocked — which is what keeps the card's blocked treatment off.
 */
export function blockedByLabel(
  event: FeedEvent,
  blocked: ReadonlySet<string>,
  order: ReadonlyMap<string, number>,
  labelOf: (id: string) => string,
): string | undefined {
  const hits = blockingCategories(event, blocked, order);
  if (hits.length === 0) return undefined;
  return hits.length > 1 ? `${labelOf(hits[0])} +${hits.length - 1}` : labelOf(hits[0]);
}

export interface BlockedFeed {
  /** What the feed is built from: every event if revealed, else the
   *  unblocked ones. The status line's "m"; the pill counts come from this. */
  base: FeedEvent[];
  /** `base` narrowed by the active pills (OR) — what is on screen. The
   *  status line's "n". */
  visible: FeedEvent[];
  /**
   * The Blocked pill's N: how many DISTINCT blocked categories are hiding at
   * least one event the current pills would otherwise show. Counts
   * CATEGORIES, not events. Independent of `reveal` — revealing changes what
   * is shown, not what is blocked — so the pill keeps its number when on.
   */
  blockedCategoryCount: number;
}

/**
 * The whole Explore pipeline after the server: blocks, then pills.
 *
 *   base     = reveal ? events : events − blocked
 *   visible  = pills lit ? base ∩ (any pill matches) : base
 *   N        = |{ blocking categories of every blocked event that the pills
 *                would otherwise show }|
 *
 * Pills are OR'd (matchesFilter), exactly as the feed always has.
 */
export function applyBlocks(
  events: readonly FeedEvent[],
  opts: { blocked: ReadonlySet<string>; reveal: boolean; filters: readonly SearchFilter[] },
): BlockedFeed {
  const { blocked, reveal, filters } = opts;
  const pillMatch = (e: FeedEvent) => filters.length === 0 || filters.some((f) => matchesFilter(f, e));

  const hiding = new Set<string>();
  const base: FeedEvent[] = [];
  for (const e of events) {
    const hits = blockingCategories(e, blocked);
    if (hits.length > 0 && pillMatch(e)) for (const id of hits) hiding.add(id);
    if (reveal || hits.length === 0) base.push(e);
  }
  return { base, visible: base.filter(pillMatch), blockedCategoryCount: hiding.size };
}

/**
 * The ONE "is this event hidden from Explore right now?" predicate, or
 * `undefined` when nothing is hidden (revealed, or an empty blocked set — signed
 * out / read failed). Explore search applies it to EVERY path an event can
 * reach its results by — in-radius title matches, applied-filter results and
 * the overflow read — so search never depends on its caller having passed an
 * already-filtered list.
 */
export function hiddenFromExplore(
  blocked: ReadonlySet<string>,
  reveal: boolean,
): ((event: FeedEvent) => boolean) | undefined {
  if (reveal || blocked.size === 0) return undefined;
  return (event) => isBlocked(event, blocked);
}

/**
 * Split a list into what search SHOWS and what blocks HIDE, preserving order.
 * `isHidden` absent (revealed, signed out, nothing blocked) ⇒ everything is
 * shown and `hidden` is empty. Explore search runs EVERY result path through
 * this — the in-radius pool and the overflow read — and renders `shown`;
 * `hidden` is kept so a later change can say what was held back.
 */
export function partitionHidden<T extends FeedEvent>(
  events: readonly T[],
  isHidden?: (event: FeedEvent) => boolean,
): { shown: T[]; hidden: T[] } {
  if (!isHidden) return { shown: [...events], hidden: [] };
  const shown: T[] = [];
  const hidden: T[] = [];
  for (const e of events) (isHidden(e) ? hidden : shown).push(e);
  return { shown, hidden };
}

// ---------------------------------------------------------------------------
// SEARCH: with reveal OFF, blocked matches go to ONE collapsed dropdown at the
// bottom; with reveal ON they render inline, in their normal place, carrying
// the blocked treatment (RULING 2026-09-27, reversing 2026-09-26's "whatever
// the reveal state"). These shape the dropdown and search's copy.
//
// TWO STRIKES (RULING 2026-09-27, Jas): with reveal OFF, an event that is
// BOTH blocked AND past the radius appears nowhere in search. The just-past
// band holds only unblocked events that miss on distance; the dropdown holds
// only blocked events inside the radius. With reveal ON a blocked event is
// treated as unblocked, so a blocked past-radius one sits in the band.
// ---------------------------------------------------------------------------

export interface HiddenMatchGroup<T extends FeedEvent = FeedEvent> {
  /** The FIRST blocking interest (by taxonomy order) — the group's key. */
  categoryId: string;
  label: string;
  items: T[];
}

export interface GroupedHiddenMatches<T extends FeedEvent = FeedEvent> {
  /** Every held-back match — the row's "N". All in range (two strikes). */
  total: number;
  /** Groups over the first `limit` matches, in order of first appearance. */
  groups: HiddenMatchGroup<T>[];
  /** How many matches `limit` left out — the "+N more" link's N. */
  remaining: number;
}

/**
 * Group held-back matches under their FIRST blocking interest, over at most
 * `limit` matches (default 3 — the collapsed view; pass Infinity for "+N
 * more"). Input order is kept — search's order. A match with no blocking
 * category (cannot happen via search, which only passes blocked events) is
 * grouped under its own id "".
 */
export function groupHiddenMatches<T extends FeedEvent>(
  matches: readonly T[],
  opts: {
    blocked: ReadonlySet<string>;
    order: ReadonlyMap<string, number>;
    labelOf: (id: string) => string;
    limit?: number;
  },
): GroupedHiddenMatches<T> {
  const limit = opts.limit ?? 3;
  const taken = matches.slice(0, limit);
  const groups: HiddenMatchGroup<T>[] = [];
  const byId = new Map<string, HiddenMatchGroup<T>>();
  for (const m of taken) {
    const id = blockingCategories(m, opts.blocked, opts.order)[0] ?? '';
    let g = byId.get(id);
    if (!g) {
      g = { categoryId: id, label: id ? opts.labelOf(id) : '', items: [] };
      byId.set(id, g);
      groups.push(g);
    }
    g.items.push(m);
  }
  return {
    total: matches.length,
    groups,
    remaining: Math.max(0, matches.length - taken.length),
  };
}

/**
 * TYPED SEARCH OVER EVENTS (RULING 2026-09-27, Jas): an event matches when the
 * query is in its TITLE or in the LABEL of any of its categories — so
 * "community" shows Lakeside Songwriters Night (Music + Community) right away,
 * with no filter tap in between. Same substring semantics as `matchLabels`.
 *
 * ORDER: title hits first, in `matchLabels` order (match offset, then the
 * shorter title); then category-only hits, in input order. A title hit is the
 * stronger signal — the user typed words from the event's own name.
 */
export function searchEvents<T extends FeedEvent>(
  query: string,
  events: readonly T[],
  labelOf: (categoryId: string) => string,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const byTitle = matchLabels(q, events, (e) => e.title).map((m) => m.item);
  const titled = new Set(byTitle);
  const byCategory = events.filter(
    (e) =>
      !titled.has(e) &&
      (e.categories ?? []).some((id) => labelOf(id).toLowerCase().includes(q)),
  );
  return [...byTitle, ...byCategory];
}

/** A Filters row's count line (RULING 2026-09-27) — "1 event matches within
 *  25 mi", plus " · M hidden by your blocks" only when M > 0. */
export function filterRowCount(shown: number, hidden: number, radius: number): string {
  const head = `${shown} ${shown === 1 ? 'event matches' : 'events match'} within ${radius} mi`;
  return hidden > 0 ? `${head} · ${hidden} hidden by your blocks` : head;
}

/** The collapsed row's label — "1 match hidden by your blocks". */
export const hiddenMatchesLabel = (n: number): string =>
  `${n} ${n === 1 ? 'match' : 'matches'} hidden by your blocks`;

/**
 * The expanded panel's top line (PROVISIONAL copy, 2026-09-27) — count-aware.
 * No distance clause: under two strikes every match in the panel is in range,
 * so "a little outside your range" can never be true there.
 */
export const hiddenMatchesTopLine = (total: number): string =>
  total === 1
    ? 'This matches your search, but it’s in an interest you’ve blocked.'
    : 'These match your search, but they’re in interests you’ve blocked.';

/** The distance hint's zero branch (PROVISIONAL copy, 2026-09-27). With
 *  blocked matches inside the radius, "Nothing within X mi" alone would be
 *  false — something IS there, held back — so the line says so. With none,
 *  the copy is the band's original, character for character (straight
 *  apostrophe included — it was `&apos;` in the JSX it came from). */
export function nothingWithinLine(radius: number, overflow: number, blockedInRange: number): string {
  if (blockedInRange > 0) {
    const verb = overflow === 1 ? 'there\'s' : 'there are';
    return `Nothing within ${radius} mi except what you've blocked — but ${verb} ${overflow} just past it, so you don't miss something good.`;
  }
  const verb = overflow === 1 ? 'there is' : 'there are';
  return `Nothing within ${radius} mi — but ${verb} ${overflow} just past it, so you don't miss something good.`;
}

/** The status line's screen-reader tail when every match is blocked. */
export const allBlockedAnnouncement = (n: number): string =>
  `No matches shown. ${hiddenMatchesLabel(n)}, below.`;

/**
 * Curbside auto-join guard (the Explore pill row adds Curbside to a user's
 * first topical selection). It must not add a category the feed is hiding:
 * blocked Curbside with reveal OFF → no auto-join.
 */
export function canAutoJoinCurbside(blocked: ReadonlySet<string>, reveal: boolean): boolean {
  return reveal || !blocked.has('curbside');
}

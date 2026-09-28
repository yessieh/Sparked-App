// Explore search — collapsed icon in the header, expanding to a two-tier
// finder. Interaction pattern ported from the design reference's finder
// overlay (design-reference/ui_kits/mobile-app/Screens.jsx:870-940); its
// PLUMBING was deliberately NOT ported, for reasons recorded below.
//
// ============================================================================
// WHAT IT SEARCHES, AND — MORE IMPORTANTLY — WHAT IT CANNOT
// ============================================================================
//
// TIER 1 — FILTER NAMES. The 13 rows of `public.categories` (lib/categories.ts)
// plus "Free". These are SUGGESTIONS, not results: tapping one applies it and
// the panel shows that filter's events.
//
// TIER 2 — EVENTS BY TITLE OR CATEGORY LABEL, AND ONLY ONES ALREADY FETCHED.
// (Category labels since 2026-09-27: typing "community" shows every Community
// event at once — the Tier-1 row above them is an optional shortcut, never a
// required step. lib/eventFilters.ts `searchEvents`.)
// This is an in-memory `String.includes` over the array the feed is currently
// holding. THERE IS NO SERVER-SIDE SEARCH BEHIND IT AND NOTHING HERE CAN FIND
// AN EVENT THE FEED HAS NOT ALREADY LOADED. Two independent reasons, both
// verified rather than assumed, because someone will otherwise expect this to
// behave like a search engine and file a bug when it does not:
//
//   1. THERE IS NO TEXT INDEX ANYWHERE IN THE SCHEMA. Across all 29 migrations
//      there is not one tsvector, to_tsquery, pg_trgm, GIN index or ILIKE. The
//      only non-btree index in `public` is `events_location_gix`, a GiST index
//      on the geography column. A server-side title search would have to build
//      that index first.
//   2. `description` NEVER REACHES THIS SCREEN. `events_within_radius` returns
//      11 columns and description is not among them (only `event_detail` has
//      it). So description search is not merely unimplemented here — it is not
//      possible client-side at all, at any effort, without a schema change.
//
// Adding a text argument to `events_within_radius` would change its signature,
// which forces a DROP, which resets the wrapper's ACL — a grant-surface change
// and a full privilege-audit arc. (tabs)/index.tsx:12-15 records that reasoning
// for the date predicate; it applies here unchanged. Hence: client-side.
//
// ============================================================================
// PORTED FROM THE REFERENCE — AND THE THREE THINGS THAT WERE NOT
// ============================================================================
//
// The reference's Explore finder is real where it counts (the matcher, the
// live counts, the overflow arithmetic all compute over its sample array) but
// carries three dead or degenerate pieces. Recon 2026-08-25 established each;
// none is reproduced here:
//
//   • ITS THREE FEED-LEVEL `ActiveFilterPill`s ARE DEAD CODE. `setPriceFilter`,
//     `setWhenLabel` and `setDistLabel` are never called with a non-null value
//     anywhere in the reference, so `hasActiveExtras` is permanently false and
//     that entire block never renders (Screens.jsx:660-662, 832-834).
//   • ITS DISTANCE FILTER'S PREDICATE IS `() => true` (Screens.jsx:685) — it
//     matches every event and only the radius does any work.
//   • ITS "RECENT" CHIPS AND INTEREST TILES ARE HARDCODED LITERALS
//     (Screens.jsx:646-648) — the tiles' comment claims "those with events
//     nearby" while the list is four fixed strings.
//
// DIVERGENCES FROM THE REFERENCE, EACH A RULING, EACH RECORDED:
//   • OVERFLOW — NO LONGER A DIVERGENCE (RULING 2026-09-27, Jas). It was
//     title-only here, applied filters strictly in-radius; it now covers
//     category matches and applied filters too, as the reference does
//     (Screens.jsx:682-684). The reach is unchanged: overflowCap.
//   • APPLIED FILTERS SHOW A "Music · Clear" ROW, NOT A PILL. The reference's
//     ActiveFilterPill is a static label with a nested remove button — a
//     different control wearing a pill shape, and a nested pressable this arc
//     would then own. components/Pill.tsx is the selectable pill; this is not
//     one, so it is not one.
//   • NO PER-CATEGORY ICONS. The reference keys an icon per interest off
//     INTEREST_ICON_MAP (9 entries for its 9 interests). Building a 13-icon map
//     is a taxonomy-presentation decision that belongs with the interest-pill
//     arc, not smuggled in here.

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';

import { useCategories } from '../lib/categories';
import {
  FREE_FILTER,
  allBlockedAnnouncement,
  blockedByLabel,
  buildFilterCounts,
  filterRowCount,
  groupHiddenMatches,
  hiddenFromExplore,
  hiddenMatchesLabel,
  hiddenMatchesTopLine,
  matchesFilter,
  nothingWithinLine,
  partitionHidden,
  searchEvents,
  type FilterKind,
  type GroupedHiddenMatches,
  type SearchFilter,
} from '../lib/eventFilters';
import { hasEnded } from '../lib/eventTime';
import type { Place } from '../lib/origin';
import { highlightParts, matchLabels, overflowCap } from '../lib/searchMatch';
import { supabase } from '../lib/supabase';
import { brand, tracking, trackingEm, useTheme, withAlpha } from '../theme';
import { laneFor } from '../theme/categoryColors';
import type { FeedEvent } from './EventStub';

/** WCAG 2.5.5, explicit on both axes — LocationControl.tsx:39-41's house rule,
 *  and Entry 3's `44 x 29` is why the width half is never omitted. */
const TARGET = 44;

/** Debounce before matching. Long enough that a fast typist does not trigger a
 *  match (and, at <3 hits, an RPC) per keystroke; short enough to feel live. */
const DEBOUNCE_MS = 200;

/** The reference's threshold, kept: overflow appears only when the in-radius
 *  set is thin enough that widening is a service rather than noise. */
const OVERFLOW_THRESHOLD = 3;

/** Every match blocked (PROVISIONAL, 2026-09-27): the empty state's headline,
 *  body-less, and the status line's visible text. */
const ALL_BLOCKED_HEADLINE = 'Nothing matches your criteria';
const ALL_BLOCKED_STATUS = 'No matches shown';

/** Visually hidden but in the accessibility tree — settings/interests.tsx's
 *  `srOnly`, same shape. */
const srOnly = {
  position: 'absolute' as const,
  width: 1,
  height: 1,
  overflow: 'hidden' as const,
  opacity: 0,
};

const LABEL_ID = 'sparked-explore-search-label';
const PANEL_ID = 'sparked-explore-search';

// `SearchFilter`, `FREE_FILTER` and `matchesFilter` MOVED to lib/eventFilters.ts
// when the header pills landed. Both surfaces filter events, and two copies of
// one predicate drift silently — both keep compiling and both keep returning
// events. The panel is not the owner of that rule, so it imports it like
// everyone else. KIND_LABEL stays here: it is this panel's presentation of a
// filter, not part of what a filter means.
const KIND_LABEL: Record<FilterKind, string> = {
  category: 'Category',
  price: 'Price',
};

// ---------------------------------------------------------------------------
// The collapsed affordance — lives in the Explore header.
// ---------------------------------------------------------------------------

export function SearchTrigger({ open, onPress }: { open: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      role="button"
      aria-label="Search filters and events"
      aria-expanded={open}
      // Names the panel this control discloses. rnw 0.21.2 forwards
      // aria-controls (forwardedProps/index.js); RN types it on ViewProps.
      aria-controls={PANEL_ID}
      style={{
        width: TARGET,
        height: TARGET,
        borderRadius: theme.radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.iconChipBg,
        borderWidth: 1,
        borderColor: theme.colors.cardBorder,
      }}
    >
      <Ionicons name="search" size={17} color={theme.colors.text} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Result rows
// ---------------------------------------------------------------------------

/** Label with ONLY the contiguous matched span lifted into the accent.
 *
 *  1.4.1 LIMITATION, RECORDED NOT DESIGNED AROUND: the match is marked by
 *  colour plus a weight bump (900 against the label's 800), which is the
 *  reference's own treatment. The weight bump is a weak non-colour cue at this
 *  size. If the highlight is ever asked to CARRY meaning rather than decorate
 *  it, it needs a real second channel — that is a design decision, not
 *  something to invent mid-arc. See Entry 6. */
function Highlighted({ text, query }: { text: string; query: string }) {
  const theme = useTheme();
  const parts = highlightParts(text, query);
  const base = {
    fontFamily: theme.fonts.bodySemiBold,
    fontWeight: '800',
    fontSize: theme.fontSizes.bodySm,
    color: theme.colors.text,
  } as const;
  if (!parts) return <Text style={base}>{text}</Text>;
  return (
    <Text style={base} numberOfLines={1}>
      {parts.before}
      <Text style={{ color: brand.brightOrange, fontWeight: '900' }}>{parts.match}</Text>
      {parts.after}
    </Text>
  );
}

function FilterRow({
  filter,
  query,
  count,
  hidden,
  radius,
  onApply,
}: {
  filter: SearchFilter;
  query: string;
  count: number;
  /** In-range matches blocks are holding back (0 when revealed). */
  hidden: number;
  radius: number;
  onApply: () => void;
}) {
  const theme = useTheme();
  const countLine = filterRowCount(count, hidden, radius);
  return (
    <Pressable
      onPress={onApply}
      role="button"
      // The visible label carries the filter name; the count and kind are
      // announced with it so "Music" is not read alone out of context.
      aria-label={`${filter.label}, ${KIND_LABEL[filter.kind]} filter, ${countLine}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: TARGET,
        paddingVertical: 6,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Highlighted text={filter.label} query={query} />
        {/* THE RADIUS QUALIFIER IS EXPLICIT, and zeros are shown rather than
            hidden. "5 nearby" would be a claim this screen cannot make — the
            count is over the events loaded for the CURRENT radius and nothing
            else. A zero row is kept because typing an exact category name and
            getting nothing back reads as a broken search; the empty result
            that follows the tap is the honest answer. */}
        <Text
          style={{
            fontFamily: theme.fonts.bodyMedium,
            fontSize: theme.fontSizes.caption,
            // Not truncated: the blocks clause makes this line long enough
            // to wrap at 375pt, and a cut-off "hidden by your bl…" says less
            // than nothing. 4.5:1+ on the panel background. These rows are deliberately
            // UNFILLED — Entry 2 measured textMuted at 4.32:1 on a card, which
            // fails, and passing on the bare background is the reason the
            // reference's `rgba(255,255,255,0.03)` row fill was not ported.
            color: theme.colors.textMuted,
            marginTop: 3,
          }}
        >
          {countLine}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={15} color={theme.colors.textFaint} />
    </Pressable>
  );
}

/** Small uppercase section heading. Rendered by the caller ONLY when its
 *  section has rows — an empty tier renders nothing, heading included. */
function SectionHeading({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <Text
      style={{
        fontFamily: theme.fonts.bodySemiBold,
        fontSize: theme.fontSizes.eyebrow,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: tracking(trackingEm.eyebrow, theme.fontSizes.eyebrow),
        color: theme.colors.textMuted,
        marginBottom: 8,
      }}
    >
      {children}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// The panel
// ---------------------------------------------------------------------------

export interface ExploreSearchProps {
  /** The feed's result set BEFORE blocks — radius-bounded and ENDED-filtered by
   *  (tabs)/index.tsx, not yet split by blocks. This panel splits it itself
   *  (see `blocked`). Read-only here: this component never writes it and never
   *  changes how the feed itself filters. */
  events: FeedEvent[];
  radius: number;
  place: Place | null;
  /**
   * The feed's date window, passed down so the widened read asks the SAME
   * question the feed asked.
   *
   * NOT OPTIONAL, and the reason is the shape of this component: the overflow
   * read is a SECOND call to `events_within_radius` at a larger radius. Left on
   * the 3-argument form it would be unbounded in time while the feed is
   * bounded, so search would surface events the feed had already excluded —
   * search contradicting the feed on the same screen, from the same data.
   *
   * Exactly the class of thing the Curbside guard had to be taught about this
   * same read in 0030: a second call at a wider radius re-admits whatever the
   * feed excluded unless it is told not to.
   */
  dateWindow: { from: string; to: string };
  onClose: () => void;
  /** Supplied by the feed so search results carry the same save/going wiring
   *  and the same gating as feed cards, without this component knowing
   *  anything about engagement or auth. `blockedBy` = the chip label ("Music
   *  +1") for the blocked treatment — computed HERE from this panel's own
   *  `blocked` set, so the card's treatment and the decision to hide it can
   *  never come from two different sets. */
  renderEvent: (event: FeedEvent, pastRadiusMi?: number, blockedBy?: string) => ReactNode;
  /**
   * CATEGORY BLOCKS (RULING 2026-09-27, reversing 2026-09-26's "whatever the
   * reveal state"). Reveal OFF: every path (in-radius matches, applied-filter
   * results, the overflow read) is split by lib/eventFilters.ts
   * `partitionHidden`, and the blocked side goes to ONE dropdown at the
   * bottom, ALWAYS collapsed by default. Reveal ON: nothing is split — blocked
   * matches render inline in their normal place (in range, or in the just-past
   * band) with the dashed border + chip, and there is no dropdown. Applied at
   * RENDER, not in the fetch, so blocking or unblocking needs no refetch.
   * Empty (signed out, read failed, nothing blocked) ⇒ every path untouched.
   */
  blocked: ReadonlySet<string>;
  /** The feed's reveal state ("Showing blocked"). */
  reveal: boolean;
}

export default function ExploreSearch({
  events,
  radius,
  place,
  dateWindow,
  onClose,
  renderEvent,
  blocked,
  reveal,
}: ExploreSearchProps) {
  const theme = useTheme();
  const categories = useCategories();

  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [applied, setApplied] = useState<SearchFilter | null>(null);

  /**
   * The widened read's result, TAGGED WITH THE QUERY IT ANSWERS.
   *
   * Keyed rather than reset, deliberately. The obvious shape — clear the rows
   * at the top of the effect, refill them when the response lands — needs a
   * synchronous setState inside an effect body, which cascades renders, and it
   * lets a slow response for an old query land on top of a new one. Tagging the
   * result makes staleness a comparison instead of a race: anything whose key
   * is not the current key simply is not this query's answer.
   *
   * `fetched` records whether the read actually COMPLETED. The no-results copy
   * claims the search reached past the radius; that claim is asserted from this
   * flag rather than assumed from the fact that a fetch was scheduled.
   */
  const [overflowState, setOverflowState] = useState<{
    key: string;
    rows: FeedEvent[];
    fetched: boolean;
  }>({ key: '', rows: [], fetched: false });

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [q]);

  const query = debouncedQ.trim();
  const lowerQuery = query.toLowerCase();
  const cap = overflowCap(radius);

  /** Tier 1 — the searchable filter set. 13 categories + Free. */
  const registry = useMemo<SearchFilter[]>(
    () => [
      ...categories.map((c) => ({ id: c.id, label: c.label, kind: 'category' as const })),
      FREE_FILTER,
    ],
    [categories],
  );

  const filterMatches = useMemo(
    () => matchLabels(query, registry, (f) => f.label),
    [query, registry],
  );

  const categoryOrder = useMemo(() => new Map(categories.map((c, i) => [c.id, i])), [categories]);
  const labelOf = useCallback(
    (id: string) => categories.find((c) => c.id === id)?.label ?? id,
    [categories],
  );
  /** The card chip's label, from THIS panel's blocked set. `undefined` for an
   *  unblocked event — so passing it for every card is safe, and with reveal
   *  OFF no shown card is blocked, so none carries it. */
  const chipFor = useCallback(
    (e: FeedEvent) => blockedByLabel(e, blocked, categoryOrder, labelOf),
    [blocked, categoryOrder, labelOf],
  );

  /** Hidden from search's results: blocked AND reveal off — the FEED's own
   *  predicate, so search and feed cannot disagree about what "revealed"
   *  means. `undefined` (revealed, or nothing blocked) leaves every path
   *  unsplit. */
  const isHidden = useMemo(() => hiddenFromExplore(blocked, reveal), [blocked, reveal]);

  /** The in-radius pool, SPLIT into shown and hidden-by-blocks. Both Tier-2
   *  paths read `shown`; the dropdown reads `hidden`. */
  const inRadius = useMemo(() => partitionHidden(events, isHidden), [events, isHidden]);
  const pool = inRadius.shown;

  /** Tier-1 counts over what search can actually SHOW — built here, not taken
   *  from the feed — plus what blocks hold back, for the row's "· M hidden by
   *  your blocks" (always 0 when revealed: nothing is held back). */
  const counts = useMemo(() => buildFilterCounts(pool), [pool]);
  const hiddenCounts = useMemo(() => buildFilterCounts(inRadius.hidden), [inRadius]);

  /** Tier 2 — in-radius events whose TITLE or a CATEGORY LABEL matches.
   *  Rendered at once; no filter tap is needed to see them. */
  const eventMatches = useMemo(
    () => (query ? searchEvents(query, pool, labelOf) : []),
    [query, pool, labelOf],
  );

  /** Results for an applied filter, in range. The just-past band below
   *  extends them, as it does typed matches. */
  const appliedResults = useMemo(
    () => (applied ? pool.filter((e) => matchesFilter(applied, e)) : []),
    [applied, pool],
  );

  /** Whichever in-range set is on screen — the band's "Only N within". */
  const inRangeResults = applied ? appliedResults : eventMatches;

  /** The SAME two questions asked of the blocked side — what the dropdown
   *  lists from in range. */
  const hiddenInRange = useMemo(
    () =>
      applied
        ? inRadius.hidden.filter((e) => matchesFilter(applied, e))
        : query
          ? searchEvents(query, inRadius.hidden, labelOf)
          : [],
    [applied, query, inRadius, labelOf],
  );

  // --- The widened read ----------------------------------------------------
  // A SECOND events_within_radius CALL, at the expanded radius, ON DEMAND —
  // not one wide fetch split client-side. The trade was decided deliberately:
  // a wide fetch would have made every feed load carry rows the feed must never
  // display, which means either changing how the feed filters (out of scope, on
  // purpose) or holding a second shadow array whose rows are not feed rows —
  // a correctness hazard that outlives this arc. This taxes only the sparse
  // search. The cost is honest and it is latency: the overflow block lands one
  // round trip after the in-radius results.
  //
  // NO NEW ARGUMENT, NO NEW GRANT. This calls the existing RPC with a different
  // `radius_miles`. Nothing about the signature, the ACL, or the grant surface
  // changes.
  // Widening is not applicable when: nothing typed and no filter applied, no
  // origin to measure from, or the in-range set is already thick enough that
  // widening would be noise. Typed matches AND applied filters both widen
  // (RULING 2026-09-27); the reach is unchanged (overflowCap).
  const overflowNeeded =
    (query.length > 0 || !!applied) && !!place && inRangeResults.length < OVERFLOW_THRESHOLD;
  // THE KEY IS THE READ, NOT THE QUESTION (2026-09-27). The band holds EVERY
  // event between radius and cap for this origin and window; the query or
  // filter is matched against it below, client-side, like the in-range pool.
  // So a new keystroke or filter reuses the rows instead of re-reading them,
  // and matching title-or-category here cannot drift from matching it there.
  // The window is in the key since 0031 (a result fetched under another date
  // range would be a stale answer that looks fresh); the origin is in it now
  // too, so a location change cannot reuse the old place's band.
  const overflowKey = `${place?.lat},${place?.lng}|${radius}|${dateWindow.from}|${dateWindow.to}`;
  const overflowCurrent =
    overflowNeeded && overflowState.key === overflowKey ? overflowState : null;
  /** The band's matches — the same question asked of the in-range pool,
   *  nearest first (the reference's ordering for the band). */
  const overflowMatches = useMemo(() => {
    const rows = overflowCurrent?.rows ?? [];
    const hits = applied
      ? rows.filter((e) => matchesFilter(applied, e))
      : searchEvents(query, rows, labelOf);
    return [...hits].sort((a, b) => (a.distance_miles ?? 0) - (b.distance_miles ?? 0));
  }, [overflowCurrent, applied, query, labelOf]);
  // The overflow band, filtered the same way. TWO STRIKES (2026-09-27): with
  // reveal OFF, a band match that is also blocked is DROPPED — it goes
  // nowhere, not to the dropdown. With reveal ON `isHidden` is undefined, so
  // blocked band matches stay in the band and carry their chip.
  const overflow = useMemo(
    () => partitionHidden(overflowMatches, isHidden).shown,
    [overflowMatches, isHidden],
  );

  // --- The blocked-matches dropdown ----------------------------------------
  // In-range blocked matches ONLY (two strikes), in the order search found
  // them. Grouping, the cap of 3 and the top line are pure
  // (lib/eventFilters.ts); this only holds the two pieces of UI state.
  const hiddenMatches = hiddenInRange;
  /** ALWAYS collapsed by default (RULING 2026-09-27) — even when it is the
   *  only thing to show. It exists only with reveal OFF, so there is no
   *  "revealed ⇒ start open" case left. Session state of this panel only. */
  const [hiddenOpen, setHiddenOpen] = useState(false);
  /** "+N more" is keyed to the question it answered, so a new query or filter
   *  starts capped again without an effect resetting it. */
  const resultKey = `${applied ? `f:${applied.id}` : `q:${lowerQuery}`}`;
  const [showAllFor, setShowAllFor] = useState<string | null>(null);
  const showAllHidden = showAllFor === resultKey;
  const hiddenGroups = useMemo(
    () =>
      groupHiddenMatches(hiddenMatches, {
        blocked,
        order: categoryOrder,
        labelOf,
        limit: showAllHidden ? Infinity : 3,
      }),
    [hiddenMatches, blocked, categoryOrder, labelOf, showAllHidden],
  );
  const overflowFetched = overflowCurrent?.fetched ?? false;
  /** DERIVED, not stored: a widening is wanted and its answer is not in yet.
   *  A second source of truth for "in flight" is a second thing to get wrong. */
  const overflowPending = overflowNeeded && overflowCurrent === null;

  useEffect(() => {
    if (!overflowNeeded || !place || overflowState.key === overflowKey) return;

    let cancelled = false;

    supabase
      .rpc('events_within_radius', {
        origin_lat: place.lat,
        origin_lng: place.lng,
        radius_miles: cap,
        // THE SAME WINDOW THE FEED ASKED FOR. Without these two the widened
        // read would be unbounded in time while the feed is bounded, and search
        // would surface events the feed had already excluded — search
        // contradicting the feed on one screen, from one dataset.
        window_from: dateWindow.from,
        window_to: dateWindow.to,
      })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          // Degrades to "no overflow" rather than an error state. The panel
          // still shows Tier 1 and the in-radius Tier 2. The key is still
          // recorded — so the read is SETTLED and nothing spins forever — but
          // `fetched: false` makes the no-results copy drop its claim about
          // having looked past the radius.
          setOverflowState({ key: overflowKey, rows: [], fetched: false });
          return;
        }
        // ONE instant for the whole response, for (tabs)/index.tsx's reason: a
        // fresh Date per row would judge cards on the ENDED boundary against
        // as many clocks as there are rows.
        const now = new Date();
        const rows = (data ?? [])
          .filter((r: FeedEvent) => !hasEnded(r.starts_at, r.ends_at, now))
          .map((r: FeedEvent & { tier_id?: string | null }) => ({
            ...r,
            lane: laneFor(r.tier_id),
          }))
          .filter(
            (r: FeedEvent) =>
              typeof r.distance_miles === 'number' &&
              r.distance_miles > radius &&
              r.distance_miles <= cap,
          );
        // No query filter here: the band is matched in `overflowMatches`.
        setOverflowState({ key: overflowKey, rows, fetched: true });
      });

    return () => {
      cancelled = true;
    };
    // `place` is destructured into its two scalars so a new object identity
    // with identical coordinates does not refetch. `overflowState.key` is read
    // as a guard rather than a trigger — including the whole object would
    // re-run the effect with the result it just stored.
    // `dateWindow` is already folded into `overflowKey`, which IS in this list,
    // so a window change re-runs through the key rather than through a second
    // dependency that could disagree with it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overflowNeeded, overflowKey, place?.lat, place?.lng, radius, cap]);

  const apply = useCallback((filter: SearchFilter) => {
    setApplied(filter);
    setQ('');
    setDebouncedQ('');
  }, []);

  const onKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (e.nativeEvent.key === 'Escape') onClose();
    },
    [onClose],
  );

  // --- The announcement ----------------------------------------------------
  // HELD UNTIL OVERFLOW SETTLES, so a sparse search announces its final count
  // once instead of announcing an in-radius count and then correcting itself a
  // round trip later.
  //
  // EVERY MATCH BLOCKED (2026-09-27, replacing 2026-09-26's line, which
  // appeared three times on one screen): the headline is the plain
  // ALL_BLOCKED_HEADLINE with no body, the visible status line is only "No
  // matches shown", and the explanation lives ONLY in the dropdown. Screen
  // readers get one extra clause in the live region — the dropdown's count —
  // because they cannot glance down to see it. Same for query and filter.
  const someBlocked = hiddenMatches.length > 0;
  let announce: string | null = null;
  /** True when the status line is the every-match-blocked one — its tail is
   *  rendered screen-reader-only. */
  let allBlocked = false;
  if (applied && !overflowPending) {
    const n = appliedResults.length;
    if (n === 0 && overflow.length === 0 && someBlocked) allBlocked = true;
    else {
      announce = `${n} ${n === 1 ? 'event' : 'events'} for ${applied.label}`;
      if (overflow.length > 0) announce += `, ${overflow.length} just past your radius`;
    }
  } else if (!applied && query && !overflowPending) {
    const nF = filterMatches.length;
    const nE = eventMatches.length;
    if (nF === 0 && nE === 0 && overflow.length === 0) {
      if (someBlocked) allBlocked = true;
      else announce = 'No matches';
    } else {
      const parts: string[] = [];
      if (nF > 0) parts.push(`${nF} ${nF === 1 ? 'filter' : 'filters'}`);
      if (nE > 0) parts.push(`${nE} ${nE === 1 ? 'event' : 'events'}`);
      if (overflow.length > 0) parts.push(`${overflow.length} just past your radius`);
      announce = parts.join(', ');
    }
  }

  const showNoResults =
    !applied &&
    query.length > 0 &&
    !overflowPending &&
    filterMatches.length === 0 &&
    eventMatches.length === 0 &&
    overflow.length === 0;
  /** The applied filter's empty state — only once the band has settled, so it
   *  cannot flash "Nothing tagged" and then be contradicted by the band. */
  const appliedEmpty =
    !!applied && !overflowPending && appliedResults.length === 0 && overflow.length === 0;

  const capLabel = Math.round(cap * 10) / 10;

  const statusStyle = {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: theme.fontSizes.caption,
    color: theme.colors.textMuted,
  } as const;

  const eyebrowStyle = {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: theme.fontSizes.eyebrow,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: tracking(trackingEm.eyebrow, theme.fontSizes.eyebrow),
    color: brand.brightOrange,
  } as const;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }}>
      {/* Scrim. Decorative and pointer-only: the keyboard/AT path out of the
          panel is the Cancel button and the Escape key, both real controls. */}
      <Pressable
        onPress={onClose}
        aria-hidden
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: withAlpha(brand.deepNavy, 0.72),
        }}
      />

      {/* `bottom: 0` IS LOAD-BEARING, not symmetry. The panel's `maxHeight:
          '100%'` resolves against THIS box, and with only top/left/right set
          the box is auto-height — so the cap resolved to nothing and a long
          result list ran off the bottom of the screen with its ScrollView
          unable to scroll (measured 861pt of panel in an 812pt viewport at
          375x812). Giving the container a definite height gives the cap
          something to be a percentage OF.

          `pointerEvents="box-none"` is the other half: a full-screen container
          would otherwise swallow the taps meant for the scrim behind it, and
          tap-outside-to-close would silently stop working. box-none lets the
          container itself be transparent to touches while its children stay
          interactive. */}
      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center' }}
      >
        <View
          nativeID={PANEL_ID}
          style={{
            width: '100%',
            // Matches the feed's centred discovery column so the panel does not
            // sprawl on desktop.
            maxWidth: 560,
            maxHeight: '100%',
            backgroundColor: theme.colors.bgDeep,
            borderBottomLeftRadius: theme.radii.xxl,
            borderBottomRightRadius: theme.radii.xxl,
            borderBottomWidth: 1,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: theme.colors.cardBorder,
            boxShadow: theme.shadows.elevated,
          }}
        >
          {/* --- Field ------------------------------------------------------ */}
          <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 10 }}>
            {/* A REAL, VISIBLE LABEL. A placeholder is not a label — it
                disappears on the first keystroke and is not reliably exposed.
                Entry 3's precedent is both mechanisms at once: aria-label for
                the flat string, aria-labelledby tying the field to this node. */}
            <Text nativeID={LABEL_ID} style={eyebrowStyle}>
              Search
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 9 }}>
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 9,
                  minHeight: TARGET,
                  paddingLeft: 13,
                  paddingRight: 4,
                  backgroundColor: theme.colors.cardBg,
                  borderWidth: 1,
                  borderColor: theme.colors.borderStrong,
                  borderRadius: theme.radii.lg - 2,
                }}
              >
                <Ionicons name="search" size={15} color={theme.colors.textMuted} />
                <TextInput
                  autoFocus
                  value={q}
                  onChangeText={setQ}
                  onKeyPress={onKeyPress}
                  placeholder="Free, Music, or an event name"
                  placeholderTextColor={theme.colors.textHint}
                  aria-label="Search filters and events"
                  aria-labelledby={LABEL_ID}
                  returnKeyType="search"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    minHeight: TARGET,
                    fontFamily: theme.fonts.bodyMedium,
                    fontSize: theme.fontSizes.bodySm,
                    color: theme.colors.text,
                  }}
                />
                {q.length > 0 && (
                  <Pressable
                    onPress={() => setQ('')}
                    role="button"
                    aria-label="Clear search"
                    style={{
                      width: TARGET,
                      height: TARGET,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="close" size={15} color={theme.colors.textMuted} />
                  </Pressable>
                )}
              </View>

              <Pressable
                onPress={onClose}
                role="button"
                aria-label="Close search"
                style={{
                  minHeight: TARGET,
                  minWidth: TARGET,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 6,
                }}
              >
                <Text
                  style={{
                    fontFamily: theme.fonts.bodySemiBold,
                    fontWeight: '800',
                    fontSize: theme.fontSizes.bodySm,
                    color: brand.sparkGold,
                  }}
                >
                  Cancel
                </Text>
              </Pressable>
            </View>
          </View>

          {/* --- THE LIVE REGION -------------------------------------------
              Mounted UNCONDITIONALLY for the panel's whole lifetime; only its
              CHILDREN swap, and the absence is STYLED (padding) rather than
              unmounted. docs/ACCESSIBILITY.md Entry 5 records this rule after
              four consecutive arcs re-derived the same defect: a region that
              mounts together with its text announces nothing, silently.

              THE RESULT ROWS ARE DELIBERATELY OUTSIDE IT. A live region
              re-announces everything it contains, so rows inside would read the
              entire list aloud on every keystroke. Entry 2's CTA rule, same
              reason. Only the count summary lives here. */}
          <View
            role="status"
            aria-live="polite"
            style={{
              paddingHorizontal: 20,
              paddingBottom: announce || allBlocked ? 10 : 0,
            }}
          >
            {allBlocked ? (
              <>
                {/* Sighted users read the short line; the region's text is
                    the srOnly sentence, which carries the dropdown's count.
                    The visible copy is aria-hidden so it is not read twice. */}
                <Text aria-hidden style={statusStyle}>
                  {ALL_BLOCKED_STATUS}
                </Text>
                <Text style={srOnly}>{allBlockedAnnouncement(hiddenMatches.length)}</Text>
              </>
            ) : announce ? (
              <Text style={statusStyle}>{announce}</Text>
            ) : null}
          </View>

          {/* --- Results ---------------------------------------------------- */}
          <ScrollView
            style={{ flexShrink: 1 }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 26 }}
            keyboardShouldPersistTaps="handled"
          >
            {applied ? (
              <>
                {/* Applied-filter row. Not a pill — see the header note. */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: theme.fonts.displayBlack,
                      fontWeight: '900',
                      fontSize: theme.fontSizes.h3,
                      letterSpacing: -0.2,
                      color: theme.colors.text,
                    }}
                  >
                    {applied.label}
                  </Text>
                  <Text
                    style={{
                      fontFamily: theme.fonts.bodyMedium,
                      fontSize: theme.fontSizes.bodySm,
                      color: theme.colors.textMuted,
                    }}
                  >
                    ·
                  </Text>
                  <Pressable
                    onPress={() => setApplied(null)}
                    role="button"
                    aria-label={`Clear the ${applied.label} filter`}
                    style={{
                      minHeight: TARGET,
                      minWidth: TARGET,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: theme.fonts.bodySemiBold,
                        fontWeight: '800',
                        fontSize: theme.fontSizes.bodySm,
                        color: brand.sparkGold,
                      }}
                    >
                      Clear
                    </Text>
                  </Pressable>
                </View>

                {appliedResults.length > 0 && (
                  <View style={{ gap: 14, marginBottom: 18 }}>
                    {appliedResults.map((e) => (
                      <View key={e.id}>{renderEvent(e, undefined, chipFor(e))}</View>
                    ))}
                  </View>
                )}
                {appliedEmpty && someBlocked && <NoResults headline={ALL_BLOCKED_HEADLINE} />}
                {appliedEmpty && !someBlocked && (
                  <NoResults
                    headline={`Nothing tagged ${applied.label} within ${radius} mi`}
                    body="Clear the filter to see everything nearby, or widen your radius."
                  />
                )}
              </>
            ) : (
              <>
                {/* TIER 1. Renders nothing at all — heading included — when
                    empty, rather than an empty heading. */}
                {filterMatches.length > 0 && (
                  <View style={{ marginBottom: 18 }}>
                    <SectionHeading>Filters</SectionHeading>
                    {filterMatches.map((m) => (
                      <FilterRow
                        key={`${m.item.kind}-${m.item.id}`}
                        filter={m.item}
                        query={query}
                        count={counts.get(m.item.id) ?? 0}
                        hidden={hiddenCounts.get(m.item.id) ?? 0}
                        radius={radius}
                        onApply={() => apply(m.item)}
                      />
                    ))}
                  </View>
                )}

                {/* TIER 2, in-radius — title OR category matches, shown at
                    once. With reveal ON a blocked match is here too, with its
                    chip + dashed border (chipFor is undefined otherwise). */}
                {eventMatches.length > 0 && (
                  <View style={{ marginBottom: 18 }}>
                    <SectionHeading>Events</SectionHeading>
                    <View style={{ gap: 14 }}>
                      {eventMatches.map((e) => (
                        <View key={e.id}>{renderEvent(e, undefined, chipFor(e))}</View>
                      ))}
                    </View>
                  </View>
                )}

                {showNoResults && someBlocked && <NoResults headline={ALL_BLOCKED_HEADLINE} />}
                {showNoResults && !someBlocked && (
                  <NoResults
                    headline={`No matches within ${radius} mi`}
                    // THE {cap} CLAIM IS ASSERTED, NOT ASSUMED. It is only made
                    // when the widened read actually completed; if it failed or
                    // never ran, the copy says only what the search can prove.
                    body={
                      overflowFetched
                        ? `We looked at every event title and interest out to ${capLabel} mi. Try a shorter word, or widen your radius.`
                        : `We looked at every event title and interest within ${radius} mi. Try a shorter word, or widen your radius.`
                    }
                  />
                )}
              </>
            )}

            {/* TIER 2, overflow — shared by typed matches and applied filters
                (2026-09-27), so it sits outside the branch. */}
            {overflow.length > 0 && (
                  <View>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom: 14,
                      }}
                    >
                      <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.divider }} />
                      <Text
                        style={{
                          fontFamily: theme.fonts.bodySemiBold,
                          fontSize: theme.fontSizes.eyebrow,
                          fontWeight: '900',
                          textTransform: 'uppercase',
                          letterSpacing: tracking(trackingEm.eyebrow, theme.fontSizes.eyebrow),
                          color: theme.colors.textMuted,
                        }}
                      >
                        Just past your radius
                      </Text>
                      <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.divider }} />
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        gap: 11,
                        padding: 13,
                        borderRadius: theme.radii.lg,
                        backgroundColor: theme.colors.cardBg,
                        borderWidth: 1,
                        borderColor: theme.colors.cardBorder,
                        marginBottom: 16,
                      }}
                    >
                      <Ionicons name="time-outline" size={16} color={brand.brightOrange} />
                      <Text
                        style={{
                          flex: 1,
                          fontFamily: theme.fonts.bodyMedium,
                          fontSize: theme.fontSizes.caption,
                          lineHeight: 19,
                          // `text`, not `textMuted`: this note sits ON A CARD,
                          // and Entry 2 measured textMuted at 4.32:1 there —
                          // a 1.4.3 failure. 12.62:1 on the same surface.
                          color: theme.colors.text,
                        }}
                      >
                        {/* The zero branch is the reference's own
                            (Screens.jsx:797) and it earns its place: "Only 0
                            within 25 mi" is technically true and reads like a
                            bug. With blocked matches in range, "Nothing
                            within" would itself be false — see
                            nothingWithinLine. */}
                        {inRangeResults.length === 0 ? (
                          nothingWithinLine(radius, overflow.length, hiddenInRange.length)
                        ) : (
                          <>
                            Only {inRangeResults.length} within {radius} mi. Here{' '}
                            {overflow.length === 1 ? 'is' : 'are'} {overflow.length} more a little
                            farther out, so you don&apos;t miss something good.
                          </>
                        )}
                      </Text>
                    </View>

                    <View style={{ gap: 14 }}>
                      {overflow.map((e) => (
                        <View key={e.id}>
                          {renderEvent(e, (e.distance_miles ?? radius) - radius, chipFor(e))}
                        </View>
                      ))}
                    </View>
                  </View>
                )}

            {/* BLOCKED MATCHES — the very bottom, below every result and the
                distance band, in both branches (query and applied filter). */}
            {hiddenMatches.length > 0 && (
              <BlockedMatches
                grouped={hiddenGroups}
                chipFor={chipFor}
                open={hiddenOpen}
                onToggle={() => setHiddenOpen((o) => !o)}
                onShowAll={() => setShowAllFor(resultKey)}
                renderEvent={renderEvent}
                onEditBlocks={() => {
                  onClose();
                  router.push('/settings/interests');
                }}
              />
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

/**
 * "N matches hidden by your blocks" — ONE collapsed row at the bottom of
 * search, styled like the distance hint (card surface, icon, text), plus what
 * it opens. Viewing the events is the main action: they are ordinary tappable
 * cards, carrying the blocked treatment. "Edit blocks" is deliberately QUIET —
 * the point is to make the choice visible, not to funnel anyone into Settings.
 *
 * ACCESSIBILITY: the row, "+N more" and "Edit blocks" are all Pressables —
 * `Text.onPress` has no keyboard activation on rnw (docs/STACK_FACTS.md). The
 * row carries `aria-expanded`; its accessible name is its visible text, which
 * includes the count.
 */
function BlockedMatches({
  grouped,
  chipFor,
  open,
  onToggle,
  onShowAll,
  renderEvent,
  onEditBlocks,
}: {
  grouped: GroupedHiddenMatches;
  /** The card chip's label, from the panel's own blocked set. */
  chipFor: (event: FeedEvent) => string | undefined;
  open: boolean;
  onToggle: () => void;
  onShowAll: () => void;
  renderEvent: (event: FeedEvent, pastRadiusMi?: number, blockedBy?: string) => ReactNode;
  onEditBlocks: () => void;
}) {
  const theme = useTheme();
  const label = hiddenMatchesLabel(grouped.total);
  // Inside the border, less the border itself — so the row's fill meets it.
  const inner = theme.radii.lg - 1;
  return (
    // CONTAINMENT (2026-09-27): ONE bordered panel holds the row AND, when
    // open, everything it discloses — so the hidden set reads as a unit apart
    // from the real results. Only the ROW carries the card fill; the body sits
    // on the bare panel background, which keeps the textMuted headings and
    // "Edit blocks" at their measured contrast (Entry 2: textMuted fails ON a
    // card) and keeps the cards inside from dissolving into a same-colour
    // fill. No `overflow: hidden` for the corners: it would clip the row's
    // focus ring — the row rounds its own top (and, closed, bottom) corners.
    // marginTop 24, up from 18: clear air between the last real result and
    // the panel, so the border does not read as belonging to that card.
    <View
      style={{
        marginTop: 24,
        borderRadius: theme.radii.lg,
        borderWidth: 1,
        borderColor: theme.colors.cardBorder,
      }}
    >
      <Pressable
        onPress={onToggle}
        role="button"
        aria-expanded={open}
        aria-label={label}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 11,
          minHeight: TARGET,
          paddingHorizontal: 13,
          paddingVertical: 10,
          borderTopLeftRadius: inner,
          borderTopRightRadius: inner,
          borderBottomLeftRadius: open ? 0 : inner,
          borderBottomRightRadius: open ? 0 : inner,
          // The distance hint's surface (see the overflow band above).
          backgroundColor: pressed ? theme.colors.surfaceHover : theme.colors.cardBg,
        })}
      >
        <Ionicons name="eye-off-outline" size={16} color={theme.colors.text} />
        <Text
          style={{
            flex: 1,
            fontFamily: theme.fonts.bodyMedium,
            fontSize: theme.fontSizes.caption,
            lineHeight: 19,
            // `text`, not textMuted: this sits ON A CARD (Entry 2: textMuted
            // is 4.32:1 there). Same call as the distance hint.
            color: theme.colors.text,
          }}
        >
          {label}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={theme.colors.text} />
      </Pressable>

      {open && (
        <View
          style={{
            gap: 14,
            paddingHorizontal: 13,
            paddingTop: 14,
            paddingBottom: 4,
            borderTopWidth: 1,
            borderTopColor: theme.colors.cardBorder,
          }}
        >
          <Text
            style={{
              fontFamily: theme.fonts.bodyMedium,
              fontSize: theme.fontSizes.caption,
              lineHeight: 19,
              color: theme.colors.text,
            }}
          >
            {hiddenMatchesTopLine(grouped.total)}
          </Text>

          {grouped.groups.map((g) => (
            <View key={g.categoryId}>
              <SectionHeading>{g.label}</SectionHeading>
              <View style={{ gap: 14 }}>
                {g.items.map((event) => (
                  <View key={event.id}>{renderEvent(event, undefined, chipFor(event))}</View>
                ))}
              </View>
            </View>
          ))}

          {grouped.remaining > 0 && (
            <Pressable
              onPress={onShowAll}
              role="button"
              aria-label={`Show ${grouped.remaining} more hidden ${grouped.remaining === 1 ? 'match' : 'matches'}`}
              style={{ alignSelf: 'flex-start', minHeight: TARGET, minWidth: TARGET, justifyContent: 'center' }}
            >
              <Text
                style={{
                  fontFamily: theme.fonts.bodySemiBold,
                  fontWeight: '800',
                  fontSize: theme.fontSizes.caption,
                  color: theme.colors.text,
                  textDecorationLine: 'underline',
                }}
              >
                +{grouped.remaining} more
              </Text>
            </Pressable>
          )}

          {/* QUIET by design: small, muted, underlined, last. A link to a
              screen — role="link" — not a promoted action. */}
          <Pressable
            onPress={onEditBlocks}
            role="link"
            aria-label="Edit blocks in Settings"
            style={{ alignSelf: 'flex-start', minHeight: TARGET, minWidth: TARGET, justifyContent: 'center' }}
          >
            <Text
              style={{
                fontFamily: theme.fonts.bodyMedium,
                fontSize: 11.5,
                // Bare panel background: 4.57:1 dark; the known light-mode
                // textMuted shortfall (3.43:1) applies, parked for the
                // light-mode sweep (docs/ACCESSIBILITY.md Entry 12).
                color: theme.colors.textMuted,
                textDecorationLine: 'underline',
              }}
            >
              Edit blocks
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

/** Inline empty state. NOT components/EmptyState — that one owns its own live
 *  region, and a second region inside this panel would double-announce against
 *  the one above. This is plain text; the announcement is the panel's. */
function NoResults({ headline, body }: { headline: string; body?: string }) {
  const theme = useTheme();
  return (
    <View style={{ paddingVertical: 30, alignItems: 'center' }}>
      <Text
        style={{
          fontFamily: theme.fonts.displayBlack,
          fontWeight: '900',
          fontSize: 15,
          letterSpacing: -0.15,
          color: theme.colors.text,
          textAlign: 'center',
        }}
      >
        {headline}
      </Text>
      {body ? (
        <Text
          style={{
            fontFamily: theme.fonts.bodyMedium,
            fontSize: 12.5,
            lineHeight: 19,
            // Bare panel background, not a card — see FilterRow's note.
            color: theme.colors.textMuted,
            textAlign: 'center',
            marginTop: 6,
            maxWidth: 320,
          }}
        >
          {body}
        </Text>
      ) : null}
    </View>
  );
}

// Explore — the anonymous distance-pure feed, now with save/going toggles on
// each card. Anonymous taps on either route to the auth screen (progressive
// gating); the feed itself never gates.
// Location and radius are USER-SET and PERSISTED (lib/origin.tsx) — the
// hardcoded Sahuarita origin retired 2026-08-20 along with lib/devOrigin.ts.
// Device geolocation is Stage 2b and is deliberately not here: nothing in this
// screen reads device position (the typed-vs-sensed privacy boundary).
// Refetch on pull-to-refresh + screen focus only (no polling; architecture
// lock #4) — focus refetch keeps rsvp_count and saved state current after
// actions elsewhere.
// ENDED EVENTS ARE FILTERED OUT BY THE SERVER, NOT HERE — CHANGED 2026-09-10.
//
// This file used to carry a client-side `hasEnded` filter over the RPC
// response, and a comment saying events_within_radius "has no date predicate
// and deliberately does not gain one" because a new argument forces a DROP that
// resets the wrapper's ACL. Migration 0031 gained the predicate; the drop was
// avoided by CREATING THE 5-ARGUMENT FORM ALONGSIDE the 3-argument one rather
// than replacing it, so no ACL was ever reset.
//
// The client filter is gone because the server's floor replaced it: the window
// this screen sends starts at `now`, so anything already over is excluded
// before it reaches us. `hasEnded` itself is untouched and still drives the
// countdown chip and the Saved / Workspace Past splits — only the feed's filter
// CALL went.
//
// THE COST, STATED: a stale PostgREST schema cache or a failed migration now
// SHOWS ended events rather than hiding them. That is why 0031 ends with
// `notify pgrst, 'reload schema'`, and why that line is load-bearing rather
// than hygiene.

import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  Text,
  View,
} from 'react-native';

import { GradientButton, SecondaryButton } from '../../components/AuthControls';
import EmptyState from '../../components/EmptyState';
import EventStub, { type FeedEvent } from '../../components/EventStub';
import ExploreSearch, { SearchTrigger } from '../../components/ExploreSearch';
import InterestPills from '../../components/InterestPills';
import LocationControl from '../../components/LocationControl';
import SparkedLogo from '../../components/SparkedLogo';
import { useAuth } from '../../lib/auth';
import { useEngagement } from '../../lib/engagement';
import { useCategories } from '../../lib/categories';
import { buildFilterCounts, matchesFilter, type SearchFilter } from '../../lib/eventFilters';
import { MAX_RADIUS, useOrigin } from '../../lib/origin';
import { supabase } from '../../lib/supabase';
import { brand, tracking, trackingEm, useTheme } from '../../theme';
import { laneFor } from '../../theme/categoryColors';

/**
 * The empty-feed escape hatch — a SHORTCUT now, no longer the only control.
 *
 * It was a one-shot 25->50 widen because there was no radius control and the
 * 1b ruling refused to build a "ladder" inside an empty state. The header
 * control IS that ladder now, so this button doubles the current radius (capped
 * at MAX_RADIUS) rather than jumping to a fixed 50 — at the seeded 25 that is
 * still exactly 25->50, and at 60 a fixed target would have NARROWED the feed.
 * It writes the persisted radius, same as the header, so there is one value and
 * one path. Hidden at MAX_RADIUS, where there is nothing further to offer.
 */
const widenTargetFor = (radius: number) => Math.min(radius * 2, MAX_RADIUS);

/** The free community lane. Auto-joins a user's first topical selection — see
 *  `togglePill`. Its `sort_order` of 0 already puts it leftmost in the row. */
const CURBSIDE = 'curbside';

/**
 * The date window the feed asks for, as INSTANTS.
 *
 * ==========================================================================
 * THE DEFAULT FLOOR IS `now`, NOT MIDNIGHT, AND THAT IS LOAD-BEARING.
 *
 * Read this before changing it. The feed's ENDED filter used to live in
 * `load` and is gone; the server's floor replaced it. So THIS VALUE now
 * decides whether a rule this screen has always had survives:
 *
 *   "an event that ended at 11am is out by 4pm, so nobody scrolls past this
 *    morning to reach tonight"
 *
 * A floor of local midnight today would return every event that finished
 * earlier today — the server admits them, nothing downstream removes them,
 * and this morning's finished events reappear on the feed at 4pm. That
 * regression would arrive as a side effect of a change that looks unrelated
 * to it, which is why the rule is restated here rather than only in a doc.
 *
 * SO THE DEFAULT IS NOT A DATE RANGE AT ALL. It is "from now through the end
 * of tomorrow". An explicitly PICKED start date is different and means local
 * midnight of that date — someone asking for a past Saturday means the whole
 * Saturday, not Saturday-from-this-hour. That asymmetry is deliberate: the
 * default answers "what is on from now", a chosen range answers "what is on
 * during these days".
 * ==========================================================================
 *
 * THE CEILING is the start of the day after tomorrow MINUS ONE MILLISECOND.
 * The server predicate is `starts_at <= window_to`, so passing the start of
 * day+2 would admit an event beginning at exactly 00:00:00.000 on day+2 — a
 * day-after-tomorrow event inside a "today and tomorrow" window. Subtracting a
 * millisecond makes the interval effectively half-open, [from, to), which is
 * what "through tomorrow" means.
 *
 * Known and accepted: `timestamptz` is microsecond-precision and JS `Date` is
 * millisecond, so an event starting in the final 999µs of tomorrow falls
 * outside. Not worth code.
 *
 * BOTH BOUNDS ARE LOCAL. `new Date()` and the date arithmetic below resolve in
 * the device's timezone, and `toISOString()` converts to the instant that
 * actually is. This is the reason 0031 takes `timestamptz` and not `date`: a
 * `date` argument resolves at midnight in the SESSION timezone, which for
 * PostgREST is UTC, and an Arizona user asking for "today" would silently get
 * 5pm yesterday to 5pm today.
 */
function defaultWindow(): { from: string; to: string } {
  const now = new Date();
  const dayAfterTomorrow = new Date(now);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  dayAfterTomorrow.setHours(0, 0, 0, 0);
  return {
    from: now.toISOString(),
    to: new Date(dayAfterTomorrow.getTime() - 1).toISOString(),
  };
}

/**
 * How the filtered-empty state names what the user picked.
 *
 * Two pills are named outright; three or more collapse to "those filters",
 * because a headline listing five categories stops being a headline. Ordered by
 * the row's own order (taxonomy `sort_order`) rather than tap order, so the
 * sentence matches what the eye sees above it.
 */
function describeSelection(labels: string[]): string {
  if (labels.length === 1) return `Nothing tagged ${labels[0]} right now`;
  if (labels.length === 2) return `Nothing tagged ${labels[0]} or ${labels[1]} right now`;
  return 'Nothing matches those filters right now';
}

export default function Explore() {
  const theme = useTheme();
  const { session } = useAuth();
  const { savedIds, goingIds, toggleSave, toggleRsvp, refresh, rsvpDelta } = useEngagement();
  const [events, setEvents] = useState<FeedEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // Search is a pure OVERLAY over this feed. It reads `events`, `place` and
  // `radius`; it never writes them, and nothing below this line changed when it
  // was added. The feed's own filtering — the radius passed to the RPC and the
  // ENDED filter in `load` — is exactly what it was.
  const [searchOpen, setSearchOpen] = useState(false);

  // --- Interest pills ------------------------------------------------------
  //
  // PLAIN useState, AND THAT IS THE WHOLE MECHANISM. The requirement is that
  // active pills survive a trip to an event and back but reset when the app is
  // closed — and that is exactly what component state does here, because this
  // screen never unmounts on that trip. Measured, not assumed: `event/[id]` is
  // a Tabs.Screen in the SAME navigator as this file ((tabs)/_layout.tsx:85),
  // and after a real card tap and Back the header's DOM nodes were IDENTICAL
  // (docs/ACCESSIBILITY.md Entry 7). No context, no AsyncStorage — the origin's
  // persistence is longer-lived than this on purpose, and nothing here belongs
  // in it.
  //
  // ONE CAVEAT, RECORDED IN ENTRY 7: on native, backgrounding the app does not
  // clear JS state, so "resets when the app is closed" means a real
  // termination. A resumed app still holds the user's pills.
  const [selected, setSelected] = useState<string[]>([]);
  /**
   * "The user has an opinion about Curbside" — NOT "auto-join has run".
   *
   * The distinction is the whole rule. Curbside is not lit on open (a lit pill
   * with no filter applied is phantom state), and it joins the FIRST topical
   * selection so the free community lane arrives with the user's choice instead
   * of vanishing behind it. After that it is an ordinary pill.
   *
   * The flag is set by EITHER path, and both are opinions:
   *   • auto-join fires — the question is now settled, so it never fires again;
   *   • the user taps Curbside directly, at any point, in either direction.
   *
   * The second is why the flag is not called `autoJoinUsed`. Someone who turns
   * Curbside OFF before touching any topical pill has said something, and
   * silently re-adding it on their next tap would contradict the rule this flag
   * exists to enforce.
   */
  const [curbsideDecided, setCurbsideDecided] = useState(false);
  const categories = useCategories();

  /**
   * The date window, SESSION-ONLY — plain useState, exactly like the pills
   * above and for the same measured reason: this screen never unmounts on a
   * trip to an event and back (docs/ACCESSIBILITY.md Entry 7 proved it by node
   * identity), so the window survives that and resets when the app is killed.
   *
   * NOT persisted to lib/origin.tsx, deliberately, and the contrast with radius
   * is the argument: how far someone will travel is a stable preference, so it
   * persists. A date range is a QUERY. A stored "last week" would silently
   * answer a question nobody asked on the next launch.
   *
   * SAME NATIVE CAVEAT AS THE PILLS: backgrounding does not clear JS state, so
   * "resets each session" means a real termination, not a return from the
   * app switcher.
   *
   * Computed once at mount. It is not re-derived on every render — a window
   * whose floor crept forward under a paused thumb would refetch the feed for
   * no reason the user can see.
   */
  // NO SETTER YET, deliberately — the picker UI is a later arc and this commit
  // is fenced out of it. Destructured without one rather than carrying a dead
  // `setDateWindow`: an unused setter reads as an oversight, and the next
  // person would either delete it or wire it somewhere it does not belong.
  const [dateWindow] = useState(defaultWindow);
  // PERSISTED, reversing the 1b ruling that lived here.
  //
  // That comment argued radius must be session-only because "a stored 100mi
  // radius silently breaks the hyperlocal promise for someone who set it once
  // and forgot." The location lock AMENDED 2026-08-21 overrules it: a radius is
  // a user-DECLARED preference, in the same class as a typed town, and the
  // amendment says those persist so returning users and travellers do not
  // re-enter them. The forgetting risk is real and is answered by the header
  // control stating the current radius on every visit, which the old one-shot
  // widen never did.
  const { place, radius, loaded, setRadius } = useOrigin();
  const canWiden = radius < MAX_RADIUS;

  // --- Derived: counts, the pill set, and the filtered view ----------------
  //
  // OVER `events`, THE UNFILTERED FEED — never over `visibleEvents`. Counting
  // the filtered view would zero every unselected category on first tap, and
  // since a pill exists only when its count is > 0, the rest of the row would
  // disappear the moment anyone used it.
  const counts = useMemo(() => buildFilterCounts(events ?? []), [events]);

  /**
   * Which pills exist: a category with at least one event in the current feed,
   * PLUS anything currently selected.
   *
   * THE SECOND CLAUSE IS A DELIBERATE EXCEPTION TO THE EXISTENCE RULE — do not
   * "fix" it into consistency. Without it, a feed refresh that drops the last
   * Music event would unmount the lit Music pill while it was still filtering,
   * leaving the user looking at a short feed with no visible cause and no way
   * to release it. Dropping it from `selected` instead would silently change
   * what they asked for. So it stays, lit and at zero, until they let go of it.
   */
  const pillCategories = useMemo(
    () => categories.filter((c) => (counts.get(c.id) ?? 0) > 0 || selected.includes(c.id)),
    [categories, counts, selected],
  );

  /** Selected ids as filters, so the feed runs the SAME predicate the search
   *  panel runs (lib/eventFilters.ts) rather than a second inline `includes`. */
  const activeFilters = useMemo<SearchFilter[]>(
    () => selected.map((id) => ({ id, label: id, kind: 'category' as const })),
    [selected],
  );

  /**
   * OR, not AND: Music + Food shows events tagged either.
   *
   * KNOWN AND ACCEPTED (recorded in the tracker, not fixed here): an event with
   * NO categories matches nothing and therefore leaves the feed whenever any
   * pill is active. Categories are optional at publish — create/event.tsx's
   * `missing` list requires only a title and an address — so such events exist.
   * The fix is upstream in the wizard; a fallback here would put unmatched
   * events into a filtered view, which contradicts what the filter says.
   */
  const visibleEvents = useMemo(() => {
    if (events === null) return null;
    if (activeFilters.length === 0) return events;
    return events.filter((e) => activeFilters.some((f) => matchesFilter(f, e)));
  }, [events, activeFilters]);

  /** Labels of the active pills, in row order (taxonomy sort_order). */
  const selectedLabels = useMemo(
    () => categories.filter((c) => selected.includes(c.id)).map((c) => c.label),
    [categories, selected],
  );

  /**
   * The feed has events, and the pills excluded all of them.
   *
   * THIS IS RARE BY CONSTRUCTION, and the reason is worth stating so nobody
   * reads it as dead code. A pill only exists when its count is > 0, so tapping
   * one can never empty the feed on its own, and OR-ing more pills only ever
   * widens the result. It fires when the feed CHANGES UNDERNEATH an active
   * filter — a focus refetch, a pull-to-refresh, a radius or location change,
   * or the ENDED filter retiring the last matching event — which is also
   * exactly the case the zero-count pill exception above keeps releasable.
   */
  const filteredEmpty =
    events !== null && events.length > 0 && (visibleEvents?.length ?? 0) === 0;

  const togglePill = useCallback(
    (id: string) => {
      const adding = !selected.includes(id);

      // A direct tap on Curbside settles the question in either direction.
      if (id === CURBSIDE) {
        setCurbsideDecided(true);
        setSelected(adding ? [...selected, id] : selected.filter((x) => x !== id));
        return;
      }

      let next = adding ? [...selected, id] : selected.filter((x) => x !== id);
      // THE AUTO-JOIN. Fires at most once, because firing sets the flag.
      if (adding && !curbsideDecided) {
        setCurbsideDecided(true);
        if (!next.includes(CURBSIDE)) next = [...next, CURBSIDE];
      }
      setSelected(next);
    },
    [selected, curbsideDecided],
  );

  /** Filtered-empty's one action. Releases the pills but NOT `curbsideDecided`:
   *  the user's opinion about Curbside outlives a clear, so auto-join does not
   *  come back and surprise them on the next tap. */
  const clearFilters = useCallback(() => setSelected([]), []);

  const load = useCallback(
    async (
      origin: { lat: number; lng: number },
      miles: number,
      window: { from: string; to: string },
    ) => {
      // FIVE ARGUMENTS since 0031. The 3-argument form still exists and still
      // works — 0031 created this one alongside rather than replacing it, which
      // is why nothing broke in the gap between that migration and this commit.
      // Nothing should call the 3-argument form after this; dropping it is its
      // own migration, once that is confirmed.
      const { data, error: rpcError } = await supabase.rpc('events_within_radius', {
        origin_lat: origin.lat,
        origin_lng: origin.lng,
        radius_miles: miles,
        window_from: window.from,
        window_to: window.to,
      });
      if (rpcError) {
        setError(rpcError.message);
      } else {
        setError(null);
        // THE CLIENT ENDED FILTER IS GONE — the server owns the floor now.
        //
        // What stood here filtered `hasEnded` over the response, and its
        // comment explained that the floor was `now` rather than midnight so
        // that "an event that ended at 11am is out by 4pm". That rule is not
        // retired; it MOVED. It now lives in `defaultWindow()` at the top of
        // this file, which is the value that enforces it, and it is spelled out
        // there because the next person to change the default is the person who
        // could undo it without noticing.
        //
        // `hasEnded` itself is untouched — the countdown chip and the Saved and
        // Workspace Past splits still call it. Only this filter went.
        //
        // The single-`now` care that used to be here went with it: the server
        // evaluates its predicate against one transaction clock, so the whole
        // response is judged against a single instant by construction rather
        // than by us remembering to pass one.
        //
        // Mapped rather than cast: the RPC returns tier_id, FeedEvent
        // deliberately has no such field, and `lane` is derived from it here. A
        // blanket cast would have compiled while leaving every stripe undefined.
        setEvents(
          (data ?? []).map((r: FeedEvent & { tier_id?: string | null }) => ({
            ...r,
            lane: laneFor(r.tier_id),
          })),
        );
      }
    },
    [],
  );

  // Focus = initial mount + every return to this tab (covers RSVP counts and
  // saved state changed elsewhere). Never a poll.
  // `place` and `radius` are dependencies so a location or radius change
  // refetches through this same path rather than a second one — one place
  // where the feed is read.
  //
  // GATED ON `loaded`: AsyncStorage is async and this screen loads on mount.
  // Firing before the stored origin resolves would read the feed against the
  // seed and then re-read against the real value — a visible swap and a wasted
  // round trip. Until then `events` stays null, which is already the
  // EmptyState pending phase, so the existing spinner covers the gap.
  // `dateWindow` joins the dependency list for the same reason `place` and
  // `radius` are in it: a change to any of the three is a different question
  // for the feed, and all three refetch through this one path rather than
  // growing a second.
  useFocusEffect(
    useCallback(() => {
      if (!loaded || !place) return;
      load(place, radius, dateWindow);
      refresh();
    }, [load, refresh, loaded, place, radius, dateWindow]),
  );

  // Clears to null FIRST, the same move onWiden makes below and for the same
  // reason: the live region only announces content that changes AFTER it is
  // already in the tree (docs/ACCESSIBILITY.md Entry 2). Going from cards to an
  // empty feed would otherwise mount the region together with its text, which
  // is silent — and the ENDED filter above turns cards→empty from a theoretical
  // path into a common one. Blanking puts the region back into its pending
  // phase so the message that lands is a CHANGE to a node that already exists.
  // The brief empty beneath the refresh spinner is what the gesture means.
  const onRefresh = useCallback(async () => {
    if (!place) return;
    setRefreshing(true);
    setEvents(null);
    await Promise.all([load(place, radius, dateWindow), refresh()]);
    setRefreshing(false);
  }, [load, refresh, place, radius, dateWindow]);

  // Clearing `events` first puts the shared live region back into its pending
  // phase, so the message that eventually lands is a CHANGE to the region
  // rather than a silent in-place edit of identical text.
  const onWiden = useCallback(() => {
    setEvents(null);
    setRadius(widenTargetFor(radius));
  }, [radius, setRadius]);

  // Progressive gating: anonymous engagement taps invite an account; the
  // auth screen is a modal, so dismissing/finishing lands right back here.
  const gated = useCallback(
    (action: () => void) => () => {
      if (session) action();
      else router.push({ pathname: '/auth', params: { mode: 'signup' } });
    },
    [session],
  );

  /**
   * One card, rendered identically wherever it appears. Search results get the
   * same save/going wiring, the same anonymous gating and the same rsvp delta
   * as feed cards because they come through here — rather than ExploreSearch
   * learning anything about engagement or auth.
   *
   * A tap CLOSES the panel before navigating, so returning from a detail screen
   * lands on the feed rather than under a stale overlay.
   */
  const renderSearchEvent = useCallback(
    (item: FeedEvent, pastRadiusMi?: number) => (
      <EventStub
        event={
          typeof item.rsvp_count === 'number'
            ? { ...item, rsvp_count: item.rsvp_count + rsvpDelta(item.id) }
            : item
        }
        saved={savedIds.has(item.id)}
        going={goingIds.has(item.id)}
        pastRadiusMi={pastRadiusMi}
        onToggleSave={gated(() => toggleSave(item.id))}
        onToggleGoing={gated(() => toggleRsvp(item.id))}
        onTap={() => {
          setSearchOpen(false);
          router.push({ pathname: '/event/[id]', params: { id: item.id } });
        }}
      />
    ),
    [savedIds, goingIds, rsvpDelta, gated, toggleSave, toggleRsvp],
  );

  const header = (
    <View style={{ paddingTop: 24, paddingBottom: 16, gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <SparkedLogo mode={theme.mode} variant="lockup" size={34} />
        <View style={{ flex: 1 }} />
        <SearchTrigger open={searchOpen} onPress={() => setSearchOpen((v) => !v)} />
      </View>
      <View>
        <Text
          style={{
            fontFamily: theme.fonts.bodySemiBold,
            fontSize: theme.fontSizes.eyebrow,
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: tracking(trackingEm.eyebrow, theme.fontSizes.eyebrow),
            color: brand.brightOrange,
          }}
        >
          Near you · by distance, honestly
        </Text>
        <Text
          style={{
            fontFamily: theme.fonts.displayBlack,
            fontWeight: '900',
            fontSize: theme.fontSizes.h2,
            letterSpacing: -0.28,
            color: theme.colors.text,
            marginTop: 6,
          }}
        >
          Explore
        </Text>
        {/* Was the literal string "Sahuarita, AZ · within {radius} mi". Both
            halves are controls now, and the component owns the live region
            that announces a change to either. */}
        <LocationControl />
      </View>

      {/* ===== FILTER STATUS — THE LIVE REGION FOR PILL CHANGES ==============
          MOUNTED HERE, UNCONDITIONALLY, AND NOT INSIDE THE PILL ROW. This is
          the fifth instance of the shape Entry 5 wrote the rule for, and the
          FIRST where the rule alone was not enough: "unconditional node,
          children swap" assumes a node exists to change, and the obvious place
          to announce a filter result — EmptyState — is only in the tree WHEN
          THE LIST IS EMPTY. Going from cards to filtered-empty therefore mounts
          that region together with its text, which is silent.

          The row itself is gated on load (below), so a region inside it would
          be conditional for a second reason. Hence: here, one level up, in a
          header that always renders. Only the children swap; the absence is
          styled with padding rather than unmounted. ===== */}
      <View
        role="status"
        aria-live="polite"
        style={{ paddingBottom: selected.length > 0 ? 2 : 0 }}
      >
        {selected.length > 0 && visibleEvents ? (
          <Text
            style={{
              fontFamily: theme.fonts.bodyMedium,
              fontSize: theme.fontSizes.caption,
              color: theme.colors.textMuted, // 4.57:1 on the page background
            }}
          >
            {visibleEvents.length === 0
              ? `No events match ${selectedLabels.join(', ')}`
              : `Showing ${visibleEvents.length} of ${events?.length ?? 0} · ${selectedLabels.join(', ')}`}
          </Text>
        ) : null}
      </View>

      {/* GATED, NOT HEIGHT-RESERVED. Two async reads feed this row — the
          taxonomy (lib/categories.ts) and the feed itself — and it renders
          nothing until both have landed. Reserving a height instead would mean
          guessing one, and the row's height is genuinely unknowable in advance:
          it wraps to one line or two depending on how many categories have
          events at the current radius, so a reserved height would be wrong as
          often as right and would leave a hole on a thin feed.
          The residual, recorded rather than hidden: the taxonomy read is a tiny
          indexed table select and the feed read is a PostGIS radius query, so
          categories normally win and the row appears in the same frame as the
          cards. If that order ever inverts, the row lands one frame late. */}
      {categories.length > 0 && events !== null && pillCategories.length > 0 && (
        <InterestPills
          categories={pillCategories}
          selected={selected}
          onToggle={togglePill}
        />
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <FlatList
        // The FILTERED view. `events` stays the unfiltered feed — the ENDED
        // filter still runs once at fetch time inside `load` and writes it, and
        // this is a pure derivation downstream that never writes back. The two
        // do not contend: one is a fetch-time filter on the response, the other
        // a render-time filter on the result.
        data={visibleEvents ?? []}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => (
          <EventStub
            event={
              typeof item.rsvp_count === 'number'
                ? { ...item, rsvp_count: item.rsvp_count + rsvpDelta(item.id) }
                : item
            }
            saved={savedIds.has(item.id)}
            going={goingIds.has(item.id)}
            onToggleSave={gated(() => toggleSave(item.id))}
            onToggleGoing={gated(() => toggleRsvp(item.id))}
            onTap={() => router.push({ pathname: '/event/[id]', params: { id: item.id } })}
          />
        )}
        ListHeaderComponent={header}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 48,
          maxWidth: 560, // discovery surface: centered column on desktop
          width: '100%',
          alignSelf: 'center',
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brand.brightOrange} />}
        // Passed as an ELEMENT, not an inline `() => <…>` component. An inline
        // arrow is a new component type on every render, which would remount
        // the live region inside EmptyState and break the announcement it
        // exists to make.
        ListEmptyComponent={
          error ? (
            <View style={{ paddingVertical: 48, alignItems: 'center', gap: 10 }}>
              <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 13, color: theme.colors.danger, textAlign: 'center' }}>
                Couldn't load events: {error}
              </Text>
            </View>
          ) : (
            // ONE EmptyState ELEMENT, TWO BRANCHES — not two elements. Swapping
            // in a different component for filtered-empty would swap the live
            // region node with it, and a region that arrives already holding
            // its text announces nothing (Entry 2). Same element, same
            // position, only props change, so the node survives the branch.
            //
            // WIDENING IS NOT OFFERED WHEN A FILTER IS WHAT EMPTIED THE FEED.
            // That was the whole hazard here: "Widen to 50 miles" as the remedy
            // for a Music filter is an action that cannot work, and a user who
            // takes it ends up further from what they wanted with more distance
            // between them and it.
            <EmptyState
              pending={events === null}
              headline={
                filteredEmpty ? describeSelection(selectedLabels) : 'Nothing nearby right now'
              }
              // The non-filtered second sentence is dropped at MAX_RADIUS:
              // there is no further control behind it, and an instruction with
              // nothing to act on is a dead end. The condition used to be "has
              // already widened once"; with a persisted, user-set radius that
              // test stopped meaning anything (anyone sitting at 50 would have
              // lost the sentence permanently), so it now tracks whether
              // widening is still POSSIBLE.
              body={
                filteredEmpty
                  ? `Everything else within ${radius} mi is still here — clearing your filters brings it back.`
                  : canWiden
                    ? "Sparked only shows what's actually within your radius — no filler from other cities. Try looking a little further out."
                    : "Sparked only shows what's actually within your radius — no filler from other cities."
              }
            >
              {filteredEmpty ? (
                <GradientButton
                  onPress={clearFilters}
                  style={{ minHeight: 44, alignSelf: 'stretch', maxWidth: 300 }}
                >
                  Clear filters
                </GradientButton>
              ) : (
                <>
                  {canWiden && (
                    <GradientButton onPress={onWiden} style={{ minHeight: 44, alignSelf: 'stretch', maxWidth: 300 }}>
                      Widen to {widenTargetFor(radius)} miles
                    </GradientButton>
                  )}
                  {/* Host path, secondary. gated() rather than letting /create
                      self-gate with router.replace: someone who taps from an
                      empty feed and decides not to sign up lands back HERE, not
                      stranded with no back path. */}
                  <SecondaryButton
                    onPress={gated(() => router.push('/create'))}
                    style={{ minHeight: 44, alignSelf: 'stretch', maxWidth: 300 }}
                  >
                    Post something yourself
                  </SecondaryButton>
                  <Text
                    style={{
                      fontFamily: theme.fonts.bodyMedium,
                      fontSize: 12.5,
                      lineHeight: 19,
                      color: theme.colors.textMuted, // 4.57:1 on #14213D
                      textAlign: 'center',
                      maxWidth: 300,
                    }}
                  >
                    Yard sale, block party, or a full event listing.
                  </Text>
                </>
              )}
            </EmptyState>
          )
        }
      />

      {/* Mounted only while open, so the panel's live region enters the tree
          EMPTY and its first result count is a change to a node already there
          (docs/ACCESSIBILITY.md Entry 5). Gating inside the component instead
          would have meant an early return before its hooks. */}
      {searchOpen && (
        <ExploreSearch
          // The UNFILTERED feed and the counts built from it. Search is not
          // narrowed by the header pills, deliberately: its Tier-1 rows offer
          // filters, so showing them counts already reduced by another filter
          // would state a number that is true of neither surface.
          events={events ?? []}
          counts={counts}
          radius={radius}
          place={place}
          dateWindow={dateWindow}
          onClose={() => setSearchOpen(false)}
          renderEvent={renderSearchEvent}
        />
      )}
    </View>
  );
}

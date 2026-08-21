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
// ENDED EVENTS ARE FILTERED OUT HERE, client-side, at fetch time — see `load`.
// events_within_radius has no date predicate and deliberately does not gain
// one: a new argument means a signature change, which forces a DROP and resets
// the wrapper's ACL. That is a grant-surface change, and it belongs to the
// date-range arc, which needs server-side bounds for its own reasons.

import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  Text,
  View,
} from 'react-native';

import { GradientButton, SecondaryButton } from '../../components/AuthControls';
import EmptyState from '../../components/EmptyState';
import EventStub, { type FeedEvent } from '../../components/EventStub';
import LocationControl from '../../components/LocationControl';
import SparkedLogo from '../../components/SparkedLogo';
import { useAuth } from '../../lib/auth';
import { useEngagement } from '../../lib/engagement';
import { hasEnded } from '../../lib/eventTime';
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

export default function Explore() {
  const theme = useTheme();
  const { session } = useAuth();
  const { savedIds, goingIds, toggleSave, toggleRsvp, refresh, rsvpDelta } = useEngagement();
  const [events, setEvents] = useState<FeedEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
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

  const load = useCallback(async (origin: { lat: number; lng: number }, miles: number) => {
    const { data, error: rpcError } = await supabase.rpc('events_within_radius', {
      origin_lat: origin.lat,
      origin_lng: origin.lng,
      radius_miles: miles,
    });
    if (rpcError) {
      setError(rpcError.message);
    } else {
      setError(null);
      // ONE instant for the whole response. hasEnded defaults `now` to a fresh
      // Date per call, so without this a long response would be judged against
      // as many slightly different clocks as it has rows, and a card sitting on
      // the boundary could survive or not depending on its index.
      const now = new Date();
      // THE ENDED FILTER. `hasEnded` is the shared verdict — the same util the
      // countdown chip renders from, so the feed and the card can never
      // disagree about whether something is over. It carries the 3-hour grace
      // for a missing ends_at; this file states no time constant of its own.
      //
      // The floor is `now`, not midnight: an event that ended at 11am is out by
      // 4pm, so nobody scrolls past this morning to reach tonight. An event in
      // PROGRESS stays — eventCountdown reads that as LIVE, never ENDED, and a
      // live event is the most useful thing a discovery feed can show.
      //
      // Filtered HERE, once, where the response is handled — not derived at
      // render. EventStub ticks every 60s to keep countdowns current, and that
      // tick must never remove a card: an event vanishing under a thumb
      // mid-scroll is worse than one that briefly reads ENDED until the next
      // refresh. This runs on every fetch path (focus, pull-to-refresh, widen)
      // because they all route through `load`.
      //
      // Mapped rather than cast: the RPC returns tier_id, FeedEvent deliberately
      // has no such field, and `lane` is derived from it here. A blanket cast
      // would have compiled while leaving every stripe undefined.
      setEvents(
        (data ?? [])
          .filter((r: FeedEvent) => !hasEnded(r.starts_at, r.ends_at, now))
          .map((r: FeedEvent & { tier_id?: string | null }) => ({
            ...r,
            lane: laneFor(r.tier_id),
          })),
      );
    }
  }, []);

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
  useFocusEffect(
    useCallback(() => {
      if (!loaded || !place) return;
      load(place, radius);
      refresh();
    }, [load, refresh, loaded, place, radius]),
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
    await Promise.all([load(place, radius), refresh()]);
    setRefreshing(false);
  }, [load, refresh, place, radius]);

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

  const header = (
    <View style={{ paddingTop: 24, paddingBottom: 16, gap: 14 }}>
      <SparkedLogo mode={theme.mode} variant="lockup" size={34} />
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
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <FlatList
        data={events ?? []}
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
            <EmptyState
              pending={events === null}
              headline="Nothing nearby right now"
              // The second sentence is dropped at MAX_RADIUS: there is no
              // further control behind it, and an instruction with nothing to
              // act on is a dead end. The condition used to be "has already
              // widened once"; with a persisted, user-set radius that test
              // stopped meaning anything (anyone sitting at 50 would have lost
              // the sentence permanently), so it now tracks whether widening
              // is still POSSIBLE.
              body={
                canWiden
                  ? "Sparked only shows what's actually within your radius — no filler from other cities. Try looking a little further out."
                  : "Sparked only shows what's actually within your radius — no filler from other cities."
              }
            >
              {canWiden && (
                <GradientButton onPress={onWiden} style={{ minHeight: 44, alignSelf: 'stretch', maxWidth: 300 }}>
                  Widen to {widenTargetFor(radius)} miles
                </GradientButton>
              )}
              {/* Host path, secondary. gated() rather than letting /create
                  self-gate with router.replace: someone who taps from an empty
                  feed and decides not to sign up lands back HERE, not stranded
                  with no back path. */}
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
            </EmptyState>
          )
        }
      />
    </View>
  );
}

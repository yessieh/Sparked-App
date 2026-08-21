// Explore — the anonymous distance-pure feed, now with save/going toggles on
// each card. Anonymous taps on either route to the auth screen (progressive
// gating); the feed itself never gates.
// Location is HARDCODED to Sahuarita, AZ for now — device geolocation is a
// later stage. Refetch on pull-to-refresh + screen focus only (no polling;
// architecture lock #4) — focus refetch keeps rsvp_count and saved state
// current after actions elsewhere.

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
import SparkedLogo from '../../components/SparkedLogo';
import { useAuth } from '../../lib/auth';
import { TEST_ORIGIN } from '../../lib/devOrigin';
import { useEngagement } from '../../lib/engagement';
import { supabase } from '../../lib/supabase';
import { brand, tracking, trackingEm, useTheme } from '../../theme';
import { laneFor } from '../../theme/categoryColors';

const RADIUS_MILES = 25;
/** The empty-feed escape hatch — ONE step, not a ladder. A ladder is a
 *  control and controls belong to the Stage 2 filter work; this is the single
 *  action that can resolve an empty radius. 50mi from Sahuarita reaches
 *  Tucson, so it resolves the problem rather than deflecting it. */
const WIDE_RADIUS_MILES = 50;

export default function Explore() {
  const theme = useTheme();
  const { session } = useAuth();
  const { savedIds, goingIds, toggleSave, toggleRsvp, refresh, rsvpDelta } = useEngagement();
  const [events, setEvents] = useState<FeedEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // SESSION STATE, never persisted. A stored 100mi radius silently breaks the
  // hyperlocal promise for someone who set it once and forgot — persistence is
  // a preference and belongs in Settings. Plain component state, so it resets
  // when the app restarts and survives a trip to event detail and back (which
  // is the whole point of an escape hatch).
  const [radius, setRadius] = useState(RADIUS_MILES);
  const widened = radius !== RADIUS_MILES;

  const load = useCallback(async (miles: number) => {
    const { data, error: rpcError } = await supabase.rpc('events_within_radius', {
      origin_lat: TEST_ORIGIN.lat,
      origin_lng: TEST_ORIGIN.lng,
      radius_miles: miles,
    });
    if (rpcError) {
      setError(rpcError.message);
    } else {
      setError(null);
      // Mapped rather than cast: the RPC returns tier_id, FeedEvent deliberately
      // has no such field, and `lane` is derived from it here. A blanket cast
      // would have compiled while leaving every stripe undefined.
      setEvents(
        (data ?? []).map((r: FeedEvent & { tier_id?: string | null }) => ({
          ...r,
          lane: laneFor(r.tier_id),
        })),
      );
    }
  }, []);

  // Focus = initial mount + every return to this tab (covers RSVP counts and
  // saved state changed elsewhere). Never a poll.
  // `radius` is a dependency so widening refetches through this same path
  // rather than a second one — one place where the feed is read.
  useFocusEffect(
    useCallback(() => {
      load(radius);
      refresh();
    }, [load, refresh, radius]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([load(radius), refresh()]);
    setRefreshing(false);
  }, [load, refresh, radius]);

  // One-shot widen. Clearing `events` first puts the shared live region back
  // into its pending phase, so the message that eventually lands is a CHANGE
  // to the region rather than a silent in-place edit of identical text.
  const onWiden = useCallback(() => {
    setEvents(null);
    setRadius(WIDE_RADIUS_MILES);
  }, []);

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
        <Text
          style={{
            fontFamily: theme.fonts.bodyMedium,
            fontSize: theme.fontSizes.bodySm,
            color: theme.colors.textMuted,
            marginTop: 4,
          }}
        >
          Sahuarita, AZ · within {radius} mi
        </Text>
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
              // The second sentence is dropped once widened: there is no
              // further control behind it, and an instruction with nothing to
              // act on is a dead end. See the arc report — this variant is the
              // one copy slot still awaiting a ruling.
              body={
                widened
                  ? "Sparked only shows what's actually within your radius — no filler from other cities."
                  : "Sparked only shows what's actually within your radius — no filler from other cities. Try looking a little further out."
              }
            >
              {!widened && (
                <GradientButton onPress={onWiden} style={{ minHeight: 44, alignSelf: 'stretch', maxWidth: 300 }}>
                  Widen to {WIDE_RADIUS_MILES} miles
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

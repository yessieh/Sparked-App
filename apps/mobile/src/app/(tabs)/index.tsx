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
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from 'react-native';

import EventStub, { type FeedEvent } from '../../components/EventStub';
import SparkedLogo from '../../components/SparkedLogo';
import { useAuth } from '../../lib/auth';
import { useEngagement } from '../../lib/engagement';
import { supabase } from '../../lib/supabase';
import { brand, tracking, trackingEm, useTheme } from '../../theme';

// Dev test location: Sahuarita, AZ. Device geolocation lands at a later stage.
const TEST_ORIGIN = { lat: 31.9576, lng: -110.9556 };
const RADIUS_MILES = 25;

export default function Explore() {
  const theme = useTheme();
  const { session } = useAuth();
  const { savedIds, goingIds, toggleSave, toggleRsvp, refresh } = useEngagement();
  const [events, setEvents] = useState<FeedEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data, error: rpcError } = await supabase.rpc('events_within_radius', {
      origin_lat: TEST_ORIGIN.lat,
      origin_lng: TEST_ORIGIN.lng,
      radius_miles: RADIUS_MILES,
    });
    if (rpcError) {
      setError(rpcError.message);
    } else {
      setError(null);
      setEvents((data ?? []) as FeedEvent[]);
    }
  }, []);

  // Focus = initial mount + every return to this tab (covers RSVP counts and
  // saved state changed elsewhere). Never a poll.
  useFocusEffect(
    useCallback(() => {
      load();
      refresh();
    }, [load, refresh]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([load(), refresh()]);
    setRefreshing(false);
  }, [load, refresh]);

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
          Sahuarita, AZ · within {RADIUS_MILES} mi
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
            event={item}
            saved={savedIds.has(item.id)}
            going={goingIds.has(item.id)}
            onToggleSave={gated(() => toggleSave(item.id))}
            onToggleGoing={gated(() => toggleRsvp(item.id))}
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
        ListEmptyComponent={
          <View style={{ paddingVertical: 48, alignItems: 'center', gap: 10 }}>
            {error ? (
              <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 13, color: theme.colors.danger, textAlign: 'center' }}>
                Couldn't load events: {error}
              </Text>
            ) : events === null ? (
              <ActivityIndicator color={brand.brightOrange} />
            ) : (
              <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 13, color: theme.colors.textMuted }}>
                No events within {RADIUS_MILES} miles yet.
              </Text>
            )}
          </View>
        }
      />
    </View>
  );
}

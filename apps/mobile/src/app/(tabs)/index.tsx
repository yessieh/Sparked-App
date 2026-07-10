// Explore — the anonymous distance-pure feed. Read path only at this stage:
// no auth, no saving, no detail screen, no filters.
// Location is HARDCODED to Sahuarita, AZ for now — device geolocation is a
// later stage. Refetch on pull-to-refresh only (no polling; architecture
// lock #4).

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from 'react-native';

import EventStub, { type FeedEvent } from '../../components/EventStub';
import SparkedLogo from '../../components/SparkedLogo';
import { supabase } from '../../lib/supabase';
import { brand, tracking, trackingEm, useTheme } from '../../theme';

// Dev test location: Sahuarita, AZ. Device geolocation lands at a later stage.
const TEST_ORIGIN = { lat: 31.9576, lng: -110.9556 };
const RADIUS_MILES = 25;

export default function Explore() {
  const theme = useTheme();
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

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

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
        renderItem={({ item }) => <EventStub event={item} />}
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

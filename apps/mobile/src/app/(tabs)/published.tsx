// "You're live" — the publish success screen (design-reference ConfirmScreen).
//
// Lives INSIDE the (tabs) group (registered href:null in _layout, so it has no
// tab button) on purpose: the tab bar is hidden through the focused create
// flow — wizard + checkout — and RESTORED here, the moment the listing goes
// live, and on every screen after (ruling, publish-walk round 2). The mock
// checkout router.replace()s here on a successful publish, which also drops the
// create stack, so the host lands back in the normal tab-bar'd app.

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

import { GradientButton, GradientFill, SecondaryButton } from '../../components/AuthControls';
import { brand, useTheme } from '../../theme';

export default function PublishedScreen() {
  const theme = useTheme();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      <View
        style={{
          width: 84,
          height: 84,
          borderRadius: 9999,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 26,
          boxShadow: '0 14px 40px rgba(255,95,78,0.35)',
        }}
      >
        <GradientFill />
        <Ionicons name="checkmark" size={38} color={brand.navy} />
      </View>
      <Text style={{ fontFamily: theme.fonts.displayBlack, fontWeight: '900', fontSize: 28, lineHeight: 31, letterSpacing: -0.28, color: theme.colors.text, textAlign: 'center', marginBottom: 12 }}>
        You're live
      </Text>
      <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 14, lineHeight: 22, color: theme.colors.textMuted, textAlign: 'center', marginBottom: 32, maxWidth: 300 }}>
        Your event is on the local feed now — neighbours will see it ranked by how close they
        are, never by an algorithm.
      </Text>
      <View style={{ width: '100%', maxWidth: 300, gap: 12 }}>
        {/* push (not replace) so the tab-bar'd app stays underneath and Back
            returns here / to the feed, never into the finished create flow. */}
        <GradientButton onPress={() => eventId && router.push({ pathname: '/event/[id]', params: { id: eventId } })}>
          View your listing
        </GradientButton>
        <SecondaryButton onPress={() => router.replace('/(tabs)')}>Back to the feed</SecondaryButton>
      </View>
    </View>
  );
}

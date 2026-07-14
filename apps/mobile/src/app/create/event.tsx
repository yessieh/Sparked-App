// Event lane placeholder — the 4-step paid wizard lands in the next build
// session. This stub is also the conversion screen's tier CTA target.

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import { brand, useTheme } from '../../theme';
import { SubHeader } from './index';

export default function EventWizardStub() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
        <SubHeader crumb="New event" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(252,163,17,0.12)',
              borderWidth: 1,
              borderColor: 'rgba(252,163,17,0.30)',
            }}
          >
            <Ionicons name="sparkles" size={22} color={brand.brightOrange} />
          </View>
          <Text
            style={{
              fontFamily: theme.fonts.displayBlack,
              fontWeight: '900',
              fontSize: 20,
              letterSpacing: -0.2,
              color: theme.colors.text,
              textAlign: 'center',
            }}
          >
            The Event wizard lands in the next build
          </Text>
          <Text
            style={{
              fontFamily: theme.fonts.bodyMedium,
              fontSize: theme.fontSizes.bodySm,
              lineHeight: 20,
              color: theme.colors.textMuted,
              textAlign: 'center',
              maxWidth: 300,
            }}
          >
            Categories, schedule, venue, photos, Standard & Plus tiers — the full 4-step flow is
            the next Create Event session.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

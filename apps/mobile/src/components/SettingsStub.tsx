// Placeholder shell for the settings screens reached from the Me hub.
// Title + "Coming soon" only — the real screens (interests & blocks,
// notification prefs, privacy, appearance, help & feedback) are a later arc.
// Header anatomy matches app/workspace.tsx so the stubs don't read as a
// different app while they wait.

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { brand, useTheme } from '../theme';

export default function SettingsStub({ title }: { title: string }) {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 12,
        }}
      >
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/me'))}
          accessibilityLabel="Back"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.iconChipBg,
            borderWidth: 1,
            borderColor: theme.colors.cardBorder,
          }}
        >
          <Ionicons name="arrow-back" size={16} color={theme.colors.text} />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              fontFamily: theme.fonts.bodySemiBold,
              fontSize: theme.fontSizes.eyebrow,
              fontWeight: '900',
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: brand.brightOrange,
            }}
          >
            Settings
          </Text>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: theme.fonts.displayBlack,
              fontWeight: '900',
              fontSize: 22,
              letterSpacing: -0.22,
              color: theme.colors.text,
              marginTop: 2,
            }}
          >
            {title}
          </Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
        <Text
          style={{
            fontFamily: theme.fonts.bodyMedium,
            fontSize: theme.fontSizes.bodySm,
            color: theme.colors.textMuted,
          }}
        >
          Coming soon
        </Text>
      </View>
    </View>
  );
}

// Placeholder shell for the settings screens reached from the Me hub.
// Title + "Coming soon" only — the real screens (interests & blocks,
// notification prefs, privacy, appearance, help & feedback) are a later arc.
// Header anatomy matches app/workspace.tsx so the stubs don't read as a
// different app while they wait.

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { backOr } from '../lib/navigation';
import { brand, useTheme } from '../theme';

/** The settings header — back chip, "Settings" eyebrow, level-1 title. Shared
 *  with the first real settings screen (Privacy) so it keeps the same back
 *  control; the chip's tracked defects are fixed here, for all of them, or not
 *  at all. */
export function SettingsHeader({ title }: { title: string }) {
  const theme = useTheme();
  return (
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
        onPress={() => backOr('me')}
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
          role="heading"
          aria-level={1}
          accessibilityRole="header"
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
  );
}

export default function SettingsStub({ title }: { title: string }) {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <SettingsHeader title={title} />

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

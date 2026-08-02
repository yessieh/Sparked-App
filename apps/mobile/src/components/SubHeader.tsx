// Back chip + eyebrow crumb (reference SubHeader). Shared by the create entry
// fork and all three input screens (Curbside, the Event wizard, checkout).
//
// EXTRACTED 2026-08-02. It used to be a named export of `create/index.tsx`, so
// three route files imported a component out of a fourth route file. That held
// together only while all four sat in the same directory — moving the fork into
// `(tabs)` so it keeps the tab bar broke every one of them. A shared component
// belongs in components/, not in whichever route happened to define it first.

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { brand, useTheme } from '../theme';

export function SubHeader({ crumb }: { crumb: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 }}>
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
        {crumb}
      </Text>
    </View>
  );
}

export default SubHeader;

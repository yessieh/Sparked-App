// Workspace screen — STUB. Header ("Workspace" + the workspace name) only; the
// real host surface (listings, RSVPs, public-profile editor) is the next
// prompt. Reached from the Me hub's host stats card.

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useMyWorkspace } from '../lib/workspace';
import { brand, useTheme } from '../theme';

export default function WorkspaceScreen() {
  const theme = useTheme();
  // Most-recently-created workspace (the hook orders ascending → last entry),
  // matching what the Me hub card taps through from. No picker this stage.
  const { workspaces } = useMyWorkspace();
  const workspace = workspaces && workspaces.length ? workspaces[workspaces.length - 1] : null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
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
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: theme.fontSizes.eyebrow, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', color: brand.brightOrange }}>
            Workspace
          </Text>
          <Text numberOfLines={1} style={{ fontFamily: theme.fonts.displayBlack, fontWeight: '900', fontSize: 22, letterSpacing: -0.22, color: theme.colors.text, marginTop: 2 }}>
            {workspace?.name ?? '…'}
          </Text>
        </View>
      </View>
    </View>
  );
}

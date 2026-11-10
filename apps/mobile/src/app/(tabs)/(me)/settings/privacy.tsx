// Privacy — the first real settings screen. Scope, locked 2026-11-10 (Jas):
// the location note and the recent-places list, nothing else (no toggles, no
// export / delete account, no legal links).
//
// Recent places are DEVICE-LOCAL for everyone, signed in or out
// (lib/origin.tsx, `sparked.origin.v1`). They are removable here and inline in
// Explore's location picker; signing out clears them. Removing or clearing
// NEVER changes the current town the feed measures from.
//
// Focus and status after a removal follow lib/recentRemoval.ts — the same
// rules as the picker. With no search field on this screen, the fallback when
// the list empties is the "Recent places" heading.

import React, { useRef } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { SettingsHeader } from '../../../../components/SettingsStub';
import { useOrigin } from '../../../../lib/origin';
import { srOnly, useRecentRemoval } from '../../../../lib/recentRemoval';
import { useTheme } from '../../../../theme';

const TARGET = 44;

export default function PrivacySettings() {
  const theme = useTheme();
  const { history, removeRecent, clearRecent } = useOrigin();
  const headingRef = useRef<Text>(null);
  const removal = useRecentRemoval({ history, removeRecent, clearRecent, fallback: headingRef });

  // `colors.text` throughout: rows sit on a CARD surface, where textMuted
  // composites to 4.32:1 and fails 1.4.3 (docs/ACCESSIBILITY.md Entry 2).
  const body = {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: theme.fontSizes.bodySm,
    lineHeight: 20,
    color: theme.colors.text,
  } as const;
  const action = {
    fontFamily: theme.fonts.displayExtraBold,
    fontWeight: '800',
    fontSize: 13,
    color: theme.colors.text,
  } as const;
  const button = (pressed: boolean) => ({
    minHeight: TARGET,
    minWidth: TARGET,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 14,
    borderRadius: theme.radii.lg - 4,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    backgroundColor: pressed ? theme.colors.surfaceHover : 'transparent',
  });

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <SettingsHeader title="Privacy" />

      {/* Mounted from first render, never re-mounted (a11y Entry 2). */}
      <View role="status" aria-live="polite" style={srOnly}>
        {removal.announcement ? <Text>{removal.announcement}</Text> : null}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32, gap: 24 }}>
        <Text style={body}>
          Sparked uses the town you type to find nearby events. We never track your device&apos;s location.
        </Text>

        <View style={{ gap: 12 }}>
          <Text
            ref={headingRef}
            role="heading"
            aria-level={2}
            accessibilityRole="header"
            // Focusable only from script: where focus lands when the list empties.
            tabIndex={-1}
            style={{
              fontFamily: theme.fonts.displayBlack,
              fontWeight: '900',
              fontSize: 17,
              color: theme.colors.text,
            }}
          >
            Recent places
          </Text>

          {history.length === 0 ? (
            <Text style={body}>No recent places.</Text>
          ) : (
            <>
              <View
                style={{
                  borderRadius: theme.radii.lg,
                  backgroundColor: theme.colors.cardBg,
                  borderWidth: 1,
                  borderColor: theme.colors.cardBorder,
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                }}
              >
                {history.map((h, i) => (
                  <View
                    key={h.label}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingVertical: 8,
                      borderTopWidth: i === 0 ? 0 : 1,
                      borderTopColor: theme.colors.cardBorder,
                    }}
                  >
                    <Text style={[body, { flex: 1, minWidth: 0 }]}>{h.label}</Text>
                    <Pressable
                      ref={removal.register(h.label)}
                      role="button"
                      aria-label={`Remove ${h.label} from recent places`}
                      accessibilityLabel={`Remove ${h.label} from recent places`}
                      onPress={() => removal.remove(h)}
                      style={({ pressed }) => button(pressed)}
                    >
                      <Text style={action}>Remove</Text>
                    </Pressable>
                  </View>
                ))}
              </View>

              <Pressable
                role="button"
                onPress={removal.clearAll}
                style={({ pressed }) => [button(pressed), { alignSelf: 'flex-start' }]}
              >
                <Text style={action}>Clear all</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

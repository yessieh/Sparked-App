// "Leave" header for the two create FORMS — the paid Event wizard and the
// Curbside form. Replaces SubHeader's arrow chip on those screens only.
//
// WHY A SEPARATE COMPONENT. Ruling (Jas, 2026-10-09): on a screen that holds
// unsaved input, the top-left control is an ESCAPE HATCH, not a step back —
// so it is a door-exit icon labelled "leave" instead of a plain arrow that
// reads as "previous step". Stepping back is the footer button's job.
// SubHeader stays the arrow chip on every screen with nothing to lose (the
// create fork, checkout, workspace/edit, settings/interests, Curbside's quota
// screen).
//
// `onLeave` is the caller's: today it navigates exactly as SubHeader's chip
// does; the discard confirmation wraps it next.

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '../theme';

export function FormExitHeader({ onLeave }: { onLeave: () => void }) {
  const theme = useTheme();
  return (
    // 16 + the button's 8px inset puts the icon on the 24px gutter. 14 + 44 +
    // 14 keeps the header 72px tall, so nothing below it moves.
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 }}>
      {/* ONE control: icon + "leave", either half leaves. No border at any
          state (ruling 2026-10-09); colors.surfaceHover fills it while
          pressed. Height 44 is the WCAG 2.5.5 target.
          NAME: `accessibilityLabel` ("Leave") is the accessible name, so the
          visible "leave" inside is not announced a second time — a button's
          children are presentational to assistive tech. The visible word is
          contained in the name, so speech users can say it (WCAG 2.5.3). */}
      <Pressable
        onPress={onLeave}
        role="button"
        accessibilityRole="button"
        accessibilityLabel="Leave"
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          minHeight: 44,
          paddingHorizontal: 8,
          borderRadius: theme.radii.md,
          backgroundColor: pressed ? theme.colors.surfaceHover : 'transparent',
        })}
      >
        {/* Ionicons `log-out-outline` mirrored: the glyph's arrow exits its
            door frame to the RIGHT; flipped, it leaves to the left, the
            direction this control sits on. */}
        <Ionicons name="log-out-outline" size={24} color={theme.colors.text} style={{ transform: [{ scaleX: -1 }] }} />
        <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 12.5, color: theme.colors.textMuted }}>leave</Text>
      </Pressable>
    </View>
  );
}

export default FormExitHeader;

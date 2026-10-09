// "Leave this event/post?" — the discard confirmation for the two create
// FORMS (the paid Event wizard and the Curbside form). Asked only when
// something was entered; a form left untouched is left instantly.
//
// WHY NOT REUSE WORKSPACE'S DeleteConfirm ((tabs)/workspace.tsx:288): it is
// file-private, its copy and trash icon are hard-wired, and it carries
// busy/error states a navigation-only confirm never has. This copies its LOOK
// — sheet, danger-tinted icon chip, secondary + muted-destructive buttons —
// and leaves the Workspace dialogs untouched.
//
// A custom Modal, NOT Alert.alert: multi-button Alert is a no-op on
// react-native-web.
//
// FOCUS (react-native-web 0.21.2, exports/Modal):
// - Escape calls onRequestClose (ModalContent.js:24-36) → Keep editing.
// - The focus trap focuses the FIRST focusable descendant on open and keeps
//   Tab inside (ModalFocusTrap.js:70-106) — so "Keep editing" is the first
//   focusable thing in the tree. The backdrop renders AFTER the sheet:
//   attemptFocus() (:33-41) succeeds even on tabindex -1, so a backdrop first
//   in the DOM would take the initial focus.
// - On close the trap refocuses whatever was focused when it opened
//   (:111-121) — the control that asked. Nothing here moves focus by hand:
//   doing it from a child effect would run BEFORE the trap records that
//   element, and it would record the dialog's own button instead.

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { useTheme, withAlpha } from '../theme';

/** True once any value differs from what it was on the first render. Values
 *  are compared as JSON, so arrays (categories, photos, vendors) compare by
 *  content. Untouched defaults (today's date, 19:00/22:00) are the snapshot,
 *  so they do not count; changing them does. */
export function useEdited(values: Record<string, unknown>): boolean {
  const current = JSON.stringify(values);
  const [initial] = useState(current);
  return current !== initial;
}

export function LeaveConfirm({
  visible,
  title,
  onKeepEditing,
  onLeave,
}: {
  visible: boolean;
  /** "Leave this event?" / "Leave this post?" */
  title: string;
  onKeepEditing: () => void;
  onLeave: () => void;
}) {
  const theme = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onKeepEditing}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View
          style={{
            zIndex: 1,
            width: '100%',
            maxWidth: 400,
            backgroundColor: theme.colors.bgDeep,
            borderWidth: 1,
            borderColor: theme.colors.cardBorder,
            borderRadius: theme.radii.xxxl,
            padding: 22,
            boxShadow: theme.shadows.elevated,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: withAlpha(theme.colors.danger, 0.1),
                borderWidth: 1,
                borderColor: withAlpha(theme.colors.danger, 0.28),
              }}
            >
              {/* The same mirrored exit glyph as the Leave control. */}
              <Ionicons name="log-out-outline" size={18} color={theme.colors.danger} style={{ transform: [{ scaleX: -1 }] }} />
            </View>
            <Text
              style={{
                flex: 1,
                fontFamily: theme.fonts.displayBlack,
                fontWeight: '900',
                fontSize: 18,
                letterSpacing: -0.18,
                color: theme.colors.text,
              }}
            >
              {title}
            </Text>
          </View>

          <Text
            style={{
              fontFamily: theme.fonts.bodyMedium,
              fontSize: 13,
              lineHeight: 20,
              color: theme.colors.textMuted,
              marginTop: 16,
            }}
          >
            What you&apos;ve entered won&apos;t be saved.
          </Text>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            {/* FIRST focusable element — the trap's initial focus. */}
            <Pressable
              onPress={onKeepEditing}
              accessibilityRole="button"
              style={({ pressed }) => ({
                flex: 1,
                borderRadius: theme.radii.lg,
                borderWidth: 1,
                borderColor: theme.colors.borderStrong,
                backgroundColor: pressed ? theme.colors.surfaceHover : 'transparent',
                paddingVertical: 14,
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <Text style={{ fontFamily: theme.fonts.displayExtraBold, fontWeight: '800', fontSize: 14, color: theme.colors.text }}>
                Keep editing
              </Text>
            </Pressable>
            {/* Muted destructive — danger-tinted, NEVER gradient. Same
                treatment and press feedback as Workspace's delete confirm:
                the border, not the fill, changes on press, so the label holds
                its contrast through the press. */}
            <Pressable
              onPress={onLeave}
              accessibilityRole="button"
              style={({ pressed }) => ({
                flex: 1,
                borderRadius: theme.radii.lg,
                borderWidth: 1,
                borderColor: withAlpha(theme.colors.danger, pressed ? 0.75 : 0.55),
                backgroundColor: withAlpha(theme.colors.danger, 0.16),
                paddingVertical: 14,
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <Text style={{ fontFamily: theme.fonts.displayExtraBold, fontWeight: '800', fontSize: 14, color: theme.colors.danger }}>
                Leave
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Backdrop: AFTER the sheet in the tree (see the header note), under
            it by zIndex. A sibling, not a wrapper — RN-web clicks bubble to
            parent Pressables, so a wrapping backdrop would dismiss on every
            tap inside the sheet. Pointer-only and out of the tab order: the
            keyboard path is Keep editing / Escape. */}
        <Pressable
          onPress={onKeepEditing}
          tabIndex={-1}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(3,8,20,0.72)',
          }}
        />
      </View>
    </Modal>
  );
}

export default LeaveConfirm;

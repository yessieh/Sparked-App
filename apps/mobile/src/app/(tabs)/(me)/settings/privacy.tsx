// Privacy — the first real settings screen. Scope, locked 2026-11-10 (Jas):
// the location note and the recent-places list (no toggles, no export, no
// legal links). Delete account added 2026-11-12 (stage 3 of account deletion),
// signed in only.
//
// Recent places are DEVICE-LOCAL for everyone, signed in or out
// (lib/origin.tsx, `sparked.origin.v1`). They are removable here and inline in
// Explore's location picker; signing out clears them. Removing or clearing
// NEVER changes the current town the feed measures from.
//
// Focus and status after a removal follow lib/recentRemoval.ts — the same
// rules as the picker. With no search field on this screen, the fallback when
// the list empties is the "Recent places" heading.
//
// DELETE ACCOUNT — lib/deleteAccount.ts calls the delete-account Edge Function
// with the user's own session. A custom Modal, not Alert.alert (multi-button
// Alert is a no-op on react-native-web) — same anatomy as Workspace's
// DeleteConfirm. On web, RN-web's Modal supplies role="dialog", aria-modal,
// the focus trap, Esc → onRequestClose and focus restore to the opener
// (react-native-web Modal/ModalContent.js:26-44, ModalFocusTrap.js:111-118);
// this screen adds focus-to-heading on open and an explicit return to the
// Delete account button on Cancel. The dialog's errors go to a status region
// INSIDE the dialog: aria-modal hides everything outside it, this screen's own
// region included. The success message outlives the screen, so it goes
// through lib/announce.ts.

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { SettingsHeader } from '../../../../components/SettingsStub';
import { announceAcrossNavigation } from '../../../../lib/announce';
import { useAuth } from '../../../../lib/auth';
import { deleteAccount } from '../../../../lib/deleteAccount';
import { useGoToMain } from '../../../../lib/navigation';
import { useOrigin } from '../../../../lib/origin';
import { srOnly, useRecentRemoval } from '../../../../lib/recentRemoval';
import { supabase } from '../../../../lib/supabase';
import { useTheme, withAlpha, type Theme } from '../../../../theme';

const TARGET = 44;
const CONFIRM_WORD = 'DELETE';
const MSG_TRANSFER =
  'You own a workspace with other members. Transfer ownership before deleting your account.';
const MSG_FAILED = "Couldn't delete your account. Try again.";

export default function PrivacySettings() {
  const theme = useTheme();
  const { session } = useAuth();
  const goToMain = useGoToMain();
  const { history, removeRecent, clearRecent } = useOrigin();
  const headingRef = useRef<Text>(null);
  const removal = useRecentRemoval({ history, removeRecent, clearRecent, fallback: headingRef });

  const deleteButtonRef = useRef<View>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [typed, setTyped] = useState('');
  const inFlight = useRef(false);

  const openConfirm = () => {
    setDeleteError('');
    setTyped('');
    setConfirmOpen(true);
  };

  const closeConfirm = useCallback(() => {
    if (inFlight.current) return; // never close mid-call
    setConfirmOpen(false);
    // RN-web restores focus to the opener itself; this makes it explicit and
    // covers native, where nothing else does.
    requestAnimationFrame(() => deleteButtonRef.current?.focus());
  }, []);

  const confirmDelete = useCallback(async () => {
    if (inFlight.current) return; // double-tap guard
    inFlight.current = true;
    setDeleting(true);
    setDeleteError('');
    const result = await deleteAccount();
    if (result.ok) {
      // Close BEFORE navigating: RN-web portals the Modal onto document.body,
      // so a navigator hiding this screen would not hide the dialog
      // (workspace.tsx onConfirmDelete, same fault).
      inFlight.current = false;
      setDeleting(false);
      setConfirmOpen(false);
      clearRecent();
      // Local only: the user no longer exists, so a server sign-out has
      // nothing to revoke.
      await supabase.auth.signOut({ scope: 'local' });
      goToMain('explore');
      announceAcrossNavigation('Your account has been deleted.');
      return;
    }
    inFlight.current = false;
    setDeleting(false);
    setDeleteError(result.reason === 'transfer_ownership_first' ? MSG_TRANSFER : MSG_FAILED);
  }, [clearRecent, goToMain]);

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

        {/* Delete account — signed in only. Muted destructive, trash icon,
            never gradient (workspace.tsx's delete row). */}
        {session ? (
          <View>
            <View style={{ height: 1, backgroundColor: theme.colors.divider, marginBottom: 18 }} />
            <Pressable
              ref={deleteButtonRef}
              role="button"
              accessibilityRole="button"
              onPress={openConfirm}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                minHeight: TARGET,
                borderWidth: 1,
                borderColor: withAlpha(theme.colors.danger, 0.22),
                backgroundColor: pressed ? withAlpha(theme.colors.danger, 0.08) : 'transparent',
                borderRadius: theme.radii.lg,
                paddingHorizontal: 16,
                paddingVertical: 12,
              })}
            >
              <Ionicons name="trash-outline" size={16} color={theme.colors.danger} />
              <Text
                style={{
                  flex: 1,
                  fontFamily: theme.fonts.bodySemiBold,
                  fontSize: theme.fontSizes.bodySm,
                  fontWeight: '700',
                  color: theme.colors.danger,
                }}
              >
                Delete account
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <DeleteAccountConfirm
        theme={theme}
        visible={confirmOpen}
        busy={deleting}
        error={deleteError}
        typed={typed}
        setTyped={setTyped}
        onCancel={closeConfirm}
        onConfirm={confirmDelete}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// The confirmation dialog. Anatomy from workspace.tsx DeleteConfirm: backdrop
// as a SIBLING (RN-web clicks bubble to parent Pressables), danger-tinted
// confirm with the border carrying press feedback (fill held at 0.16 keeps the
// label at 4.62:1 through the press).
// ---------------------------------------------------------------------------
function DeleteAccountConfirm({
  theme,
  visible,
  busy,
  error,
  typed,
  setTyped,
  onCancel,
  onConfirm,
}: {
  theme: Theme;
  visible: boolean;
  busy: boolean;
  error: string;
  typed: string;
  setTyped: (text: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const titleRef = useRef<Text>(null);
  // Any capitalisation, surrounding spaces ignored (Jas, 2026-11-13).
  const armed = typed.trim().toUpperCase() === CONFIRM_WORD;
  const confirmDisabled = !armed || busy;

  // Focus goes to the heading on every opening. (The field is emptied by the
  // parent's openConfirm.)
  useEffect(() => {
    if (!visible) return;
    const id = requestAnimationFrame(() => titleRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [visible]);

  const body = {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 20,
    color: theme.colors.textMuted,
  } as const;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
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
              <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
            </View>
            <Text
              ref={titleRef}
              role="heading"
              aria-level={2}
              accessibilityRole="header"
              tabIndex={-1}
              style={{
                flex: 1,
                fontFamily: theme.fonts.displayBlack,
                fontWeight: '900',
                fontSize: 18,
                letterSpacing: -0.18,
                color: theme.colors.text,
              }}
            >
              Delete your account?
            </Text>
          </View>

          <Text style={[body, { marginTop: 16 }]}>
            This permanently deletes your profile, saved events, RSVPs and interests. Any
            workspace you own is deleted with all of its events, and they are removed from
            everyone&apos;s Saved lists. This can&apos;t be undone.
          </Text>

          <Text
            nativeID="delete-account-confirm-label"
            style={{
              fontFamily: theme.fonts.bodySemiBold,
              fontWeight: '700',
              fontSize: 13,
              color: theme.colors.text,
              marginTop: 18,
              marginBottom: 8,
            }}
          >
            Type DELETE to confirm
          </Text>
          <TextInput
            value={typed}
            onChangeText={setTyped}
            editable={!busy}
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            aria-labelledby="delete-account-confirm-label"
            accessibilityLabelledBy="delete-account-confirm-label"
            onSubmitEditing={confirmDisabled ? undefined : onConfirm}
            style={{
              minHeight: TARGET,
              borderRadius: theme.radii.lg - 4,
              borderWidth: 1,
              borderColor: theme.colors.borderStrong,
              paddingHorizontal: 12,
              fontFamily: theme.fonts.bodyMedium,
              fontSize: 15,
              color: theme.colors.text,
            }}
          />

          {/* Status region INSIDE the dialog, mounted with it, so an error
              written after opening is announced (a11y Entry 2). */}
          <View role="status" aria-live="polite">
            {error ? (
              <Text
                style={{
                  fontFamily: theme.fonts.bodyMedium,
                  fontSize: 12.5,
                  lineHeight: 18,
                  color: theme.colors.danger,
                  marginTop: 12,
                }}
              >
                {error}
              </Text>
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            <Pressable
              onPress={onCancel}
              disabled={busy}
              role="button"
              accessibilityRole="button"
              style={({ pressed }) => ({
                flex: 1,
                minHeight: TARGET,
                borderRadius: theme.radii.lg,
                borderWidth: 1,
                borderColor: theme.colors.borderStrong,
                backgroundColor: pressed ? theme.colors.surfaceHover : 'transparent',
                paddingVertical: 12,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: busy ? 0.5 : 1,
              })}
            >
              <Text
                style={{
                  fontFamily: theme.fonts.displayExtraBold,
                  fontWeight: '800',
                  fontSize: 14,
                  color: theme.colors.text,
                }}
              >
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={confirmDisabled}
              role="button"
              accessibilityRole="button"
              // Fixed name: the label swaps to a spinner while busy.
              aria-label="Delete account"
              accessibilityLabel="Delete account"
              aria-disabled={confirmDisabled}
              accessibilityState={{ disabled: confirmDisabled, busy }}
              aria-busy={busy}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: TARGET,
                borderRadius: theme.radii.lg,
                borderWidth: 1,
                borderColor: withAlpha(theme.colors.danger, pressed && armed ? 0.75 : 0.55),
                backgroundColor: withAlpha(theme.colors.danger, 0.16),
                paddingVertical: 12,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: armed || busy ? 1 : 0.45,
              })}
            >
              {busy ? (
                <ActivityIndicator color={theme.colors.danger} accessibilityLabel="Deleting your account" />
              ) : (
                <Text
                  style={{
                    fontFamily: theme.fonts.displayExtraBold,
                    fontWeight: '800',
                    fontSize: 14,
                    color: theme.colors.danger,
                  }}
                >
                  Delete account
                </Text>
              )}
            </Pressable>
          </View>
        </View>
        {/* Backdrop: a SIBLING (RN-web clicks bubble to parent Pressables),
            drawn beneath the card by zIndex, and NOT a Pressable. RN-web's
            focus trap wraps Tab by calling .focus() on the dialog's first /
            last descendant until one takes it (ModalFocusTrap.js:33-61), and
            any element with a tabindex — even -1 — takes it. A Pressable
            backdrop always renders one, so the wrap landed on an invisible
            "Dismiss" (measured 2026-11-12, both directions). A plain View
            with responder handlers has no tabindex and closes on tap; keyboard
            users close with Esc or Cancel. */}
        <View
          aria-hidden
          onStartShouldSetResponder={() => true}
          onResponderRelease={busy ? undefined : onCancel}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            backgroundColor: 'rgba(3,8,20,0.72)',
          }}
        />
      </View>
    </Modal>
  );
}

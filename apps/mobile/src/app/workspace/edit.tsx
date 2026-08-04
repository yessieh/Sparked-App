// Public profile editor — the host-facing side of the Organizer Profile.
// Reached from the edit control ON the public profile itself, which is the only
// entry: a profile page with its own edit affordance is the internet-native
// shape, and the second Workspace row that used to sit beside "View public
// profile" made a menu out of what should be one page.
//
// CHROME-LESS BY THE RULE, NOT BY EXCEPTION: this screen holds unsaved input,
// so it lives in the root Stack with no tab bar. The rule is "chrome-less once
// there is input to lose" — Workspace and the public profile are destinations
// and keep the bar; this is a form and does not. Same reasoning as the Curbside
// mini form and the wizard steps.
//
// URL is /workspace/edit. `workspace` exists as a leaf in (tabs) AND as a
// directory prefix here, the same shape `create.tsx` + `create/` already uses:
// no _layout.tsx, so this flattens into the root Stack as "workspace/edit".
//
// SAVE-THEN-VIEW, not live preview. On success this returns to Workspace, whose
// "View public profile" row IS the preview — one public rendering, no second
// implementation of the profile to drift.
//
// LOGO IS NOT EDITABLE. There is no storage bucket, no picker dependency and no
// upload path anywhere in the app, so the avatar renders the same
// initials-fallback the public profile uses, with NO edit affordance on it — an
// inert-looking control a host taps and nothing happens is worse than a control
// that was never offered.

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { FormField, GradientButton, GradientFill, SecondaryButton } from '../../components/AuthControls';
import { SubHeader } from '../../components/SubHeader';
import { socialUrl, type SocialPlatform } from '../../lib/socialLinks';
import {
  SOCIAL_FIELDS,
  updateWorkspaceProfile,
  useMyWorkspace,
} from '../../lib/workspace';
import { brand, useTheme } from '../../theme';

/** Mirrors the server's caps (0024) so a host is stopped at the field rather
 * than by a round trip. The SERVER is the enforcement — this is courtesy. */
const LIMITS = { name: 80, bio: 500, location: 120, website: 200, social: 100 };

/** The cap message. `maxLength` means a host cannot actually exceed a limit by
 * typing — the keystrokes just stop landing, silently, which reads as a broken
 * keyboard. This says why. It is a HINT, not an error: nothing is blocked. */
function capHint(value: string, limit: number): string | null {
  return value.length >= limit ? `Maximum ${limit} characters.` : null;
}

/**
 * "Open this link" beside a social field. Inactive (and genuinely inert, not
 * merely faded) until the value resolves to a URL — a control that looks live
 * and does nothing is the thing this whole session is removing.
 *
 * Opens in a new context rather than navigating away: the host is mid-form with
 * unsaved input, and checking a link must never cost them the edit.
 */
function SocialTestButton({
  label,
  value,
  url,
  theme,
}: {
  label: string;
  value: string;
  url: string | null;
  theme: ReturnType<typeof useTheme>;
}) {
  const active = url !== null;
  // Two different reasons to be off, and a screen reader should get the right
  // one: nothing typed yet, versus typed something we cannot turn into a link.
  const inactiveLabel =
    value.trim().length === 0
      ? `Test ${label} link — enter a handle first`
      : `Test ${label} link — not a handle or link we can open`;
  return (
    <Pressable
      onPress={() => url && Linking.openURL(url)}
      disabled={!active}
      accessibilityRole="button"
      accessibilityState={{ disabled: !active }}
      // Worded to dodge the article: "a Instagram" / "an X" cannot both be
      // right from one template, and this string is read aloud.
      accessibilityLabel={active ? `Open ${label} link` : inactiveLabel}
      hitSlop={4}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: theme.radii.lg - 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? 'rgba(252,163,17,0.12)' : theme.colors.cardBg,
        borderWidth: 1,
        borderColor: active ? 'rgba(252,163,17,0.32)' : theme.colors.cardBorder,
        opacity: active ? (pressed ? 0.6 : 1) : 0.45,
      })}
    >
      <Ionicons
        name="open-outline"
        size={17}
        color={active ? brand.brightOrange : theme.colors.textHint}
      />
    </Pressable>
  );
}

export default function EditWorkspaceProfile() {
  const theme = useTheme();
  // The profile page passes the workspace it is showing. Falls back to the
  // first membership for a cold/deep-link arrival — identical at MVP, where
  // every host has exactly one workspace, and correct if the dormant
  // multi-workspace picker ever wakes up.
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { workspaces, loading } = useMyWorkspace();
  const workspace = (id ? workspaces?.find((w) => w.id === id) : null) ?? workspaces?.[0] ?? null;

  const [name, setName] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [socials, setSocials] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill once from the hook — it already returns every editable field, so
  // this screen needs no read of its own. `name === null` is the "not yet
  // hydrated" flag; after that the host's edits own the state.
  if (workspace && name === null) {
    setName(workspace.name);
    setBio(workspace.bio ?? '');
    setLocation(workspace.location_text ?? '');
    setWebsite(workspace.website ?? '');
    setSocials({ ...(workspace.socials ?? {}) });
  }

  const trimmedName = (name ?? '').trim();
  const canSave = trimmedName.length > 0 && !saving;

  const initials = useMemo(
    () =>
      (workspace?.name ?? '')
        .split(/\s+/)
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase(),
    [workspace?.name],
  );

  const onSave = async () => {
    if (!workspace || !canSave) return;
    setSaving(true);
    setError(null);
    try {
      await updateWorkspaceProfile(workspace.id, {
        name: trimmedName,
        bio: bio.trim() || null,
        location_text: location.trim() || null,
        website: website.trim() || null,
        // Empty values are dropped server-side too; sending them is harmless
        // and keeps this simple.
        socials,
      });
      // Back to Workspace, which refetches its workspace read on focus so the
      // renamed header is correct on arrival.
      if (router.canGoBack()) router.back();
      else router.replace('/workspace');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  };

  if (loading && !workspace) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={brand.brightOrange} />
      </View>
    );
  }

  if (!workspace) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <SubHeader crumb="Public profile" />
        <Text
          style={{
            fontFamily: theme.fonts.bodyMedium,
            fontSize: 13,
            color: theme.colors.textMuted,
            paddingHorizontal: 24,
            paddingTop: 8,
          }}
        >
          You don&apos;t have a workspace yet.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SubHeader crumb="Public profile" />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 48,
          maxWidth: 560,
          width: '100%',
          alignSelf: 'center',
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar — display only. No press target, no camera badge, nothing
            that implies an upload exists. */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: theme.shadows.cta,
            }}
          >
            <GradientFill />
            <Text
              style={{
                fontFamily: theme.fonts.displayBlack,
                fontWeight: '900',
                fontSize: 24,
                letterSpacing: -0.24,
                color: brand.navy,
              }}
            >
              {initials || '·'}
            </Text>
          </View>
          <Text
            style={{
              flex: 1,
              fontFamily: theme.fonts.bodyMedium,
              fontSize: theme.fontSizes.caption,
              lineHeight: 17,
              color: theme.colors.textFaint,
            }}
          >
            Your initials stand in for a logo for now — image uploads are coming.
          </Text>
        </View>

        <View style={{ height: 1, backgroundColor: theme.colors.divider, marginVertical: 18 }} />

        {/* Name is the ONE required field, and the only inline message here
            that is an error rather than a hint — it is the exact condition
            holding Save shut, said at the field it is about. The server rule
            (0024 `name_required`) is unchanged and still the enforcement; this
            surfaces it, it does not re-decide it. */}
        <FormField
          label="Name"
          value={name ?? ''}
          onChangeText={setName}
          placeholder="Desert Nights Collective"
          maxLength={LIMITS.name}
          autoCapitalize="words"
          message={
            trimmedName.length === 0
              ? 'Name is required — it’s how you appear on every listing.'
              : capHint(name ?? '', LIMITS.name)
          }
          messageTone={trimmedName.length === 0 ? 'error' : 'hint'}
        />
        <FormField
          label="Bio"
          value={bio}
          onChangeText={setBio}
          placeholder="What you run, in a sentence or two."
          maxLength={LIMITS.bio}
          multiline
          numberOfLines={4}
          style={{ minHeight: 96, textAlignVertical: 'top' }}
          message={capHint(bio, LIMITS.bio)}
          messageTone="hint"
        />
        <FormField
          label="Location"
          value={location}
          onChangeText={setLocation}
          placeholder="Sahuarita, AZ"
          maxLength={LIMITS.location}
          message={capHint(location, LIMITS.location)}
          messageTone="hint"
        />
        <FormField
          label="Website"
          value={website}
          onChangeText={setWebsite}
          placeholder="https://example.com"
          maxLength={LIMITS.website}
          autoCapitalize="none"
          keyboardType="url"
          message={capHint(website, LIMITS.website)}
          messageTone="hint"
        />

        <Text
          style={{
            fontFamily: theme.fonts.bodySemiBold,
            fontSize: theme.fontSizes.eyebrow,
            fontWeight: '900',
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: brand.brightOrange,
            marginTop: 12,
            marginBottom: 12,
          }}
        >
          Social links
        </Text>
        {SOCIAL_FIELDS.map(({ key, label }) => {
          const value = socials[key] ?? '';
          const url = socialUrl(key as SocialPlatform, value);
          return (
            <FormField
              key={key}
              label={label}
              value={value}
              onChangeText={(v: string) => setSocials((s) => ({ ...s, [key]: v }))}
              placeholder={`Your ${label} link or handle`}
              maxLength={LIMITS.social}
              autoCapitalize="none"
              accessory={<SocialTestButton label={label} value={value} url={url} theme={theme} />}
              // Only ever a HINT. The server stores any string inside the
              // length cap, so an unopenable value is still perfectly saveable
              // — turning this into an error would invent a rule the database
              // does not have.
              message={
                value.trim().length > 0 && url === null
                  ? 'Can’t open this one — use a handle (@name) or a full link.'
                  : capHint(value, LIMITS.social)
              }
              messageTone="hint"
            />
          );
        })}

        {!!error && (
          <Text
            style={{
              fontFamily: theme.fonts.bodyMedium,
              fontSize: 13,
              lineHeight: 19,
              color: theme.colors.danger,
              marginTop: 6,
              marginBottom: 10,
            }}
          >
            Couldn&apos;t save: {error}
          </Text>
        )}

        {/* Save is the host action, so it carries the gradient. Cancel is
            secondary and simply discards — nothing is written until Save.
            The reason Save is shut now lives UNDER THE NAME FIELD, not here:
            a note below the button explains a control the host has already
            given up on, and on a form this long it is off-screen anyway. */}
        <View style={{ marginTop: 18, gap: 10 }}>
          <GradientButton onPress={onSave} disabled={!canSave} busy={saving}>
            Save profile
          </GradientButton>
          <SecondaryButton
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/workspace'))}
            disabled={saving}
          >
            Cancel
          </SecondaryButton>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

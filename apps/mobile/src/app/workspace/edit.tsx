// Public profile editor — the host-facing side of the Organizer Profile.
// Reached from a row in Workspace, beside "View public profile".
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
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { FormField, GradientButton, GradientFill, SecondaryButton } from '../../components/AuthControls';
import { SubHeader } from '../../components/SubHeader';
import {
  SOCIAL_FIELDS,
  updateWorkspaceProfile,
  useMyWorkspace,
} from '../../lib/workspace';
import { brand, useTheme } from '../../theme';

/** Mirrors the server's caps (0024) so a host is stopped at the field rather
 * than by a round trip. The SERVER is the enforcement — this is courtesy. */
const LIMITS = { name: 80, bio: 500, location: 120, website: 200, social: 100 };

export default function EditWorkspaceProfile() {
  const theme = useTheme();
  const { workspaces, loading } = useMyWorkspace();
  const workspace = workspaces?.[0] ?? null;

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

        <FormField
          label="Name"
          value={name ?? ''}
          onChangeText={setName}
          placeholder="Desert Nights Collective"
          maxLength={LIMITS.name}
          autoCapitalize="words"
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
        />
        <FormField
          label="Location"
          value={location}
          onChangeText={setLocation}
          placeholder="Sahuarita, AZ"
          maxLength={LIMITS.location}
        />
        <FormField
          label="Website"
          value={website}
          onChangeText={setWebsite}
          placeholder="https://example.com"
          maxLength={LIMITS.website}
          autoCapitalize="none"
          keyboardType="url"
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
        {SOCIAL_FIELDS.map(({ key, label }) => (
          <FormField
            key={key}
            label={label}
            value={socials[key] ?? ''}
            onChangeText={(v: string) => setSocials((s) => ({ ...s, [key]: v }))}
            placeholder={`Your ${label} link or handle`}
            maxLength={LIMITS.social}
            autoCapitalize="none"
          />
        ))}

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
            secondary and simply discards — nothing is written until Save. */}
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

        {trimmedName.length === 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
            <Ionicons name="alert-circle-outline" size={14} color={theme.colors.textFaint} />
            <Text
              style={{
                fontFamily: theme.fonts.bodyMedium,
                fontSize: 12,
                color: theme.colors.textFaint,
              }}
            >
              A name is required — it&apos;s how you appear on every listing.
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

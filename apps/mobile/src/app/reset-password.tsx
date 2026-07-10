// Reset password — target of the recovery email's deep link
// (authRedirectUri('reset-password') is passed to resetPasswordForEmail).
// The link carries recovery tokens: web is handled by detectSessionInUrl,
// native by createSessionFromUrl below. Once the recovery session exists the
// user sets a new password via updateUser.

import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, Text } from 'react-native';

import { FormField, GradientButton } from '../components/AuthControls';
import SparkedLogo from '../components/SparkedLogo';
import { createSessionFromUrl, useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useTheme } from '../theme';

export default function ResetPassword() {
  const theme = useTheme();
  const { session, loading } = useAuth();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const linkUrl = Linking.useLinkingURL();
  useEffect(() => {
    if (linkUrl && Platform.OS !== 'web') {
      createSessionFromUrl(linkUrl).catch((e: Error) => setError(e.message));
    }
  }, [linkUrl]);

  const onSave = async () => {
    setError(null);
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) setError(err.message);
    else {
      setDone(true);
      setTimeout(() => router.replace('/(tabs)/me'), 1200);
    }
  };

  const body = theme.fonts.bodyMedium;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{
        padding: 24,
        paddingTop: 48,
        maxWidth: 560,
        width: '100%',
        alignSelf: 'center',
      }}
      keyboardShouldPersistTaps="handled"
    >
      <SparkedLogo mode={theme.mode} variant="lockup" size={26} />
      <Text
        style={{
          fontFamily: theme.fonts.displayBlack,
          fontWeight: '900',
          fontSize: 30,
          letterSpacing: -0.3,
          color: theme.colors.text,
          marginTop: 22,
          marginBottom: 6,
        }}
      >
        Choose a new password.
      </Text>

      {!session && !loading ? (
        <Text
          style={{
            fontFamily: body,
            fontSize: theme.fontSizes.bodySm,
            lineHeight: 21,
            color: theme.colors.textMuted,
            marginTop: 8,
          }}
        >
          This page only works from the reset link in your email. Request one from the log-in
          screen, then open it on this device.
        </Text>
      ) : (
        <>
          <Text
            style={{
              fontFamily: body,
              fontSize: theme.fontSizes.bodySm,
              lineHeight: 21,
              color: theme.colors.textMuted,
              marginBottom: 24,
            }}
          >
            You're verified — set the new password for {session?.user.email}.
          </Text>
          <FormField
            label="New password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoComplete="new-password"
          />
          {error && (
            <Text
              style={{
                fontFamily: body,
                fontSize: theme.fontSizes.caption,
                color: theme.colors.danger,
                marginBottom: 12,
              }}
            >
              {error}
            </Text>
          )}
          {done && (
            <Text
              style={{
                fontFamily: body,
                fontSize: theme.fontSizes.caption,
                color: theme.colors.green,
                marginBottom: 12,
              }}
            >
              Password updated — taking you to your profile.
            </Text>
          )}
          <GradientButton onPress={onSave} busy={busy} disabled={password.length < 6 || done}>
            Save new password
          </GradientButton>
        </>
      )}
    </ScrollView>
  );
}

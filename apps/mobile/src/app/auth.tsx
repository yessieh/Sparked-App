// Auth screen — signup / login / forgot-password in one surface, per the
// proven AuthScreen design (design-reference AppScreens.jsx). Reached ONLY
// from the Me tab; browsing never routes here (architecture lock #2).
//
// Email signup sends a confirmation link (dashboard: Confirm email ON) —
// there's no session until the user taps it, so signup resolves to a
// "check your email" notice, not a signed-in state.

import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import {
  FormField,
  GoogleButton,
  GradientButton,
  GradientFill,
} from '../components/AuthControls';
import SparkedLogo from '../components/SparkedLogo';
import {
  authRedirectUri,
  createSessionFromUrl,
  signInWithGoogle,
  useAuth,
} from '../lib/auth';
import { supabase } from '../lib/supabase';
import { brand, useTheme } from '../theme';

type Mode = 'signup' | 'login' | 'forgot';

/** Pop back to wherever auth was invoked from; fall back to the Me tab when
 * this screen is the whole history (direct load / post-reload). */
const dismiss = () => {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)/me');
};

export default function AuthScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<Mode>(params.mode === 'login' ? 'login' : 'signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'google' | 'email' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Native: email confirmation / magic links deep-link back while this
  // screen is open. Web is covered by detectSessionInUrl.
  const linkUrl = Linking.useLinkingURL();
  useEffect(() => {
    if (linkUrl && Platform.OS !== 'web') {
      createSessionFromUrl(linkUrl).catch((e: Error) => setError(e.message));
    }
  }, [linkUrl]);

  // Signed in (any path) → this screen is done. When there's no history to
  // pop (page reloaded straight onto /auth), land on Me instead of looping
  // failed GO_BACKs.
  useEffect(() => {
    if (session) dismiss();
  }, [session]);

  const run = async (kind: 'google' | 'email', fn: () => Promise<void>) => {
    setError(null);
    setNotice(null);
    setBusy(kind);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const onGoogle = () => run('google', signInWithGoogle);

  const onSubmit = () =>
    run('email', async () => {
      if (mode === 'signup') {
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { name: fullName.trim() },
            emailRedirectTo: authRedirectUri(),
          },
        });
        if (err) throw err;
        if (!data.session) {
          setNotice(
            'Almost there — we sent a confirmation link to your email. Tap it, then log in.',
          );
        }
      } else if (mode === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: authRedirectUri('reset-password'),
        });
        if (err) throw err;
        setNotice('Reset link sent — check your email.');
      }
    });

  const isSignup = mode === 'signup';
  const isForgot = mode === 'forgot';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          padding: 24,
          paddingBottom: 48,
          maxWidth: 560,
          width: '100%',
          alignSelf: 'center',
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* blurred coral blob per the prototype (RN 0.76+ filter support) */}
        <View
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            top: -80,
            right: -100,
            width: 260,
            height: 260,
            borderRadius: 130,
            backgroundColor: 'rgba(255,99,72,0.22)',
            filter: 'blur(85px)',
          }}
        />

        <Pressable
          onPress={dismiss}
          accessibilityLabel="Back"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: theme.colors.iconChipBg,
            borderWidth: 1,
            borderColor: theme.colors.cardBorder,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 12,
            marginBottom: 28,
          }}
        >
          <Ionicons name="chevron-back" size={16} color={theme.colors.text} />
        </Pressable>

        <SparkedLogo mode={theme.mode} variant="lockup" size={26} />
        <Text
          style={{
            fontFamily: theme.fonts.displayBlack,
            fontWeight: '900',
            fontSize: 30,
            letterSpacing: -0.3,
            lineHeight: 32,
            color: theme.colors.text,
            marginTop: 22,
            marginBottom: 6,
          }}
        >
          {isForgot ? 'Reset password.' : isSignup ? 'Join your city.' : 'Welcome back.'}
        </Text>
        <Text
          style={{
            fontFamily: theme.fonts.bodyMedium,
            fontSize: theme.fontSizes.bodySm,
            lineHeight: 21,
            color: theme.colors.textMuted,
            marginBottom: 24,
          }}
        >
          {isForgot
            ? "Enter your email and we'll send you a reset link."
            : isSignup
              ? 'Discover and publish local events — no algorithm, just your neighborhood.'
              : 'Pick up where you left off.'}
        </Text>

        {!isForgot && (
          <>
            {/* Sign Up / Log In toggle — gradient marks the active tab */}
            <View
              style={{
                flexDirection: 'row',
                gap: 6,
                padding: 6,
                borderRadius: 14,
                backgroundColor: theme.colors.iconChipBg,
                borderWidth: 1,
                borderColor: theme.colors.cardBorder,
                marginBottom: 22,
              }}
            >
              {(
                [
                  ['signup', 'Sign Up'],
                  ['login', 'Log In'],
                ] as const
              ).map(([id, label]) => {
                const active = mode === id;
                return (
                  <Pressable
                    key={id}
                    onPress={() => setMode(id)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      overflow: 'hidden',
                      alignItems: 'center',
                    }}
                  >
                    {active && <GradientFill />}
                    <Text
                      style={{
                        fontFamily: theme.fonts.bodySemiBold,
                        fontWeight: '900',
                        fontSize: theme.fontSizes.caption,
                        letterSpacing: 1.2,
                        textTransform: 'uppercase',
                        color: active ? brand.navy : theme.colors.textMuted,
                      }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <GoogleButton onPress={onGoogle} busy={busy === 'google'} disabled={busy !== null} />

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                marginVertical: 16,
              }}
            >
              <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.borderSoft }} />
              <Text
                style={{
                  fontFamily: theme.fonts.bodySemiBold,
                  fontSize: theme.fontSizes.eyebrow,
                  letterSpacing: 1.8,
                  color: theme.colors.textHint,
                }}
              >
                OR
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.borderSoft }} />
            </View>
          </>
        )}

        {isSignup && (
          <FormField
            label="Full name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Jordan Chen"
            autoCapitalize="words"
            autoComplete="name"
          />
        )}
        <FormField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@email.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
        />
        {!isForgot && (
          <FormField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoComplete={isSignup ? 'new-password' : 'current-password'}
          />
        )}

        {mode === 'login' && (
          <Pressable onPress={() => setMode('forgot')} style={{ marginBottom: 14 }}>
            <Text
              style={{
                fontFamily: theme.fonts.bodySemiBold,
                fontSize: theme.fontSizes.caption,
                color: brand.sparkGold,
              }}
            >
              Forgot password?
            </Text>
          </Pressable>
        )}

        {error && (
          <Text
            style={{
              fontFamily: theme.fonts.bodyMedium,
              fontSize: theme.fontSizes.caption,
              color: theme.colors.danger,
              marginBottom: 12,
            }}
          >
            {error}
          </Text>
        )}
        {notice && (
          <Text
            style={{
              fontFamily: theme.fonts.bodyMedium,
              fontSize: theme.fontSizes.caption,
              color: theme.colors.green,
              marginBottom: 12,
            }}
          >
            {notice}
          </Text>
        )}

        <GradientButton
          onPress={onSubmit}
          busy={busy === 'email'}
          disabled={busy !== null || !email || (!isForgot && !password)}
        >
          {isForgot ? 'Send reset link' : isSignup ? 'Create Account' : 'Log In'}
        </GradientButton>

        {isForgot ? (
          <Pressable onPress={() => setMode('login')} style={{ marginTop: 18 }}>
            <Text
              style={{
                fontFamily: theme.fonts.bodySemiBold,
                fontSize: 13,
                color: theme.colors.textMuted,
                textAlign: 'center',
              }}
            >
              Back to log in
            </Text>
          </Pressable>
        ) : (
          <Pressable onPress={dismiss} style={{ marginTop: 18 }}>
            <Text
              style={{
                fontFamily: theme.fonts.bodySemiBold,
                fontSize: 13,
                color: theme.colors.textMuted,
                textAlign: 'center',
              }}
            >
              Skip — browse as guest
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

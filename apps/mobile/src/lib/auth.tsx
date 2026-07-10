// Auth plumbing — one provider the whole app reads.
//
// Anonymous browse is the default (architecture lock #2): nothing here gates
// rendering. Screens read useAuth() and decide what to show; only the Me tab
// and auth screens ever care.
//
// OAuth return path (native): signInWithOAuth builds the provider URL, an
// in-app browser runs the consent flow, and Supabase redirects back to the
// app scheme (sparked:// in standalone, exp:// in Expo Go — both are in the
// project's redirect allowlist). The tokens ride the fragment of that URL;
// createSessionFromUrl hands them to setSession. On web the redirect returns
// to the site itself and detectSessionInUrl does the same job.

import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';

import { supabase } from './supabase';

import type { Session } from '@supabase/supabase-js';

// Closes the web popup / finishes the pending auth session after redirect.
WebBrowser.maybeCompleteAuthSession();

/** exp://…:8081/--/<path> in Expo Go, sparked://<path> in builds, origin URL on web. */
export const authRedirectUri = (path?: string) => makeRedirectUri({ path });

/** Parse tokens out of an auth deep link and establish the session. */
export async function createSessionFromUrl(url: string): Promise<Session | null> {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);
  const { access_token, refresh_token } = params;
  if (!access_token) return null;
  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (error) throw error;
  return data.session;
}

/** Google sign-in. Resolves once the session exists (or the user backs out). */
export async function signInWithGoogle(): Promise<void> {
  if (Platform.OS === 'web') {
    // Full-page redirect; detectSessionInUrl completes it on return.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: authRedirectUri() },
    });
    if (error) throw error;
    return;
  }
  const redirectTo = authRedirectUri();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type === 'success') await createSessionFromUrl(result.url);
}

interface AuthContextValue {
  session: Session | null;
  /** true until the persisted session (if any) has been restored. */
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextValue => useContext(AuthContext);

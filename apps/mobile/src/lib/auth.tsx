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

//
// SERVER CHECK OF THE STORED SESSION (2026-11-13). getSession() only reads the
// device's copy; it never asks the server. A user deleted on another device or
// tab therefore looked signed in here until the access token expired (up to an
// hour). validateSession() asks the server (getUser) on start and whenever the
// app returns to the foreground, at most once per 60 s.
//
// What supabase-js 2.110.1 already does, read in the installed auth-js:
//   - network failure / 5xx → AuthRetryableFetchError (lib/fetch.js:32-42,
//     :124). We do NOTHING: an offline user is never signed out.
//   - server says `session_not_found` → AuthSessionMissingError
//     (lib/fetch.js:78-82), and getUser() itself removes the session and emits
//     SIGNED_OUT (GoTrueClient.js:2668-2676 → _removeSession :4312-4329).
//   - a non-retryable refresh failure removes the session (+ SIGNED_OUT) ONLY
//     when the access token has already expired (GoTrueClient.js:4185-4208).
//   - any other 401/403 (e.g. `user_not_found`) is a plain AuthApiError and
//     supabase-js does NOT sign out — so we do, locally.
// Whichever path removed the session, the app then clears recent places and
// announces once; it never signs out a second time.

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
import { AppState, Platform } from 'react-native';

import { announceAcrossNavigation } from './announce';
import { supabase } from './supabase';

import { isAuthApiError, isAuthRetryableFetchError, type Session } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// "The server says this session is dead" — a tiny event, because the device's
// recent places live in OriginProvider, which sits INSIDE AuthProvider
// (app/_layout.tsx) and so cannot be reached from here. origin.tsx subscribes.
// ---------------------------------------------------------------------------
const invalidatedListeners = new Set<() => void>();

/** Subscribe to server-detected session loss. Returns the unsubscribe. */
export function onSessionInvalidated(listener: () => void): () => void {
  invalidatedListeners.add(listener);
  return () => {
    invalidatedListeners.delete(listener);
  };
}

const CHECK_INTERVAL_MS = 60_000;
let lastCheckAt = 0;
let checking = false;

/** Ask the server whether the stored session is still valid. Throttled to once
 *  per CHECK_INTERVAL_MS; a no-op with no stored session. */
async function validateSession(): Promise<void> {
  if (checking || Date.now() - lastCheckAt < CHECK_INTERVAL_MS) return;
  const { data: before } = await supabase.auth.getSession();
  if (!before.session) return;
  checking = true;
  lastCheckAt = Date.now();
  try {
    const { error } = await supabase.auth.getUser();
    if (!error || isAuthRetryableFetchError(error)) return; // valid, or offline / 5xx
    if (isAuthApiError(error) && (error.status === 401 || error.status === 403)) {
      // Local only: there is no server session left to revoke.
      await supabase.auth.signOut({ scope: 'local' });
    }
    // Act only if the session is actually gone now (our sign-out, or
    // supabase-js's own on session_not_found / dead refresh). Any other
    // error leaves the user signed in.
    const { data: after } = await supabase.auth.getSession();
    if (after.session) return;
    invalidatedListeners.forEach((fn) => fn());
    announceAcrossNavigation("You've been signed out.");
  } catch {
    // Unexpected throw (e.g. storage): never sign anyone out on it.
  } finally {
    checking = false;
  }
}

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
      // App start: once a stored session is restored, ask the server.
      if (data.session) void validateSession();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Back to the foreground: web tab visible again / native app active again.
  useEffect(() => {
    if (Platform.OS === 'web') {
      if (typeof document === 'undefined') return;
      const onVisible = () => {
        if (document.visibilityState === 'visible') void validateSession();
      };
      document.addEventListener('visibilitychange', onVisible);
      return () => document.removeEventListener('visibilitychange', onVisible);
    }
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void validateSession();
    });
    return () => sub.remove();
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

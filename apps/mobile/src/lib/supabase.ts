// Supabase client — ANON KEY ONLY. The service_role key must never appear in
// the app. Config comes from the gitignored .env (see .env.example).
//
// Sessions persist across restarts: AsyncStorage on native (localStorage is
// the supabase-js default on web). detectSessionInUrl is web-only — it picks
// the OAuth/confirmation tokens out of the callback URL; on native the deep
// link is handled explicitly (see lib/auth.tsx createSessionFromUrl).

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY — copy apps/mobile/.env.example to .env and fill it in.',
  );
}

const isWeb = Platform.OS === 'web';

export const supabase = createClient(url, anonKey, {
  auth: {
    ...(isWeb ? {} : { storage: AsyncStorage }),
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: isWeb,
  },
});

// Native has no page lifecycle for supabase-js to hook: pause token refresh
// in the background, resume on foreground (per the Supabase Expo guide).
if (!isWeb) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
  Montserrat_900Black,
} from '@expo-google-fonts/montserrat';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { AuthProvider, createSessionFromUrl } from '../lib/auth';
import { EngagementProvider } from '../lib/engagement';
import { OriginProvider } from '../lib/origin';
import { ThemeProvider, useTheme } from '../theme';

SplashScreen.preventAutoHideAsync();

// Native: auth links (email confirmation, recovery) can arrive with any
// screen open — establish the session from wherever we are. URLs without
// auth tokens fall through harmlessly. Web is handled by detectSessionInUrl.
function AuthDeepLinkHandler() {
  const url = Linking.useLinkingURL();
  useEffect(() => {
    if (url && Platform.OS !== 'web') {
      createSessionFromUrl(url).catch(() => {
        // Not an auth link (or expired tokens) — routing still proceeds.
      });
    }
  }, [url]);
  return null;
}

function ThemedStack() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth" options={{ presentation: 'modal' }} />
      {/* event/[id] and organizer/[id] moved into (tabs) so both keep the tab
          bar — they are public CONTENT pages and backlink targets, and a cold
          arrival needs a way into the app rather than a Back button pointing at
          nothing. Declared there with href:null, not here. */}
      {/* workspace moved into (tabs) so it keeps the tab bar — it is a
          destination, not a flow with input to lose. It is declared there with
          href:null, not here. */}
      {/* create/index moved into (tabs) as create.tsx so the fork keeps the tab
          bar — nothing is entered yet, so leaving costs nothing. Declared there
          with href:null, not here. The three screens below hold unsaved input
          and stay in this chrome-less Stack. */}
      {/* Public-profile editor — chrome-less BY THE RULE: it holds unsaved
          input, so it stays in this Stack while Workspace itself sits in
          (tabs). Same split as the create fork vs its forms. */}
      <Stack.Screen name="workspace/edit" />
      <Stack.Screen name="create/curbside" />
      <Stack.Screen name="create/event" />
      <Stack.Screen name="create/checkout" />
      {/* Settings — reached from the Me hub rows (no gear). Stubs this stage. */}
      <Stack.Screen name="settings/interests" />
      <Stack.Screen name="settings/notifications" />
      <Stack.Screen name="settings/privacy" />
      <Stack.Screen name="settings/appearance" />
      <Stack.Screen name="settings/help" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Montserrat_900Black,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <AuthProvider>
        <EngagementProvider>
          {/* Browsing origin + radius. Above the Stack because BOTH Explore
              and Event Detail measure distance from it, and they must agree —
              the same reason the retired TEST_ORIGIN was a shared constant. */}
          <OriginProvider>
            <AuthDeepLinkHandler />
            <ThemedStack />
          </OriginProvider>
        </EngagementProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

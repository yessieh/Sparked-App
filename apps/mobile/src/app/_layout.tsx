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
        <AuthDeepLinkHandler />
        <ThemedStack />
      </AuthProvider>
    </ThemeProvider>
  );
}

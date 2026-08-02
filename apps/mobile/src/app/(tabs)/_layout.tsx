// Tab shell — Explore + Saved + Me. Browsing is anonymous by default: no
// auth checks here or in Explore; auth is invoked only from Me and from
// engagement taps (save/going), never as a wall (architecture lock #2).

import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { brand, useTheme } from '../../theme';

export default function TabsLayout() {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.colors.bg },
        tabBarStyle: {
          backgroundColor: theme.colors.bgDeep,
          borderTopColor: theme.colors.divider,
        },
        tabBarActiveTintColor: brand.brightOrange,
        tabBarInactiveTintColor: theme.colors.textFaint,
        tabBarLabelStyle: {
          fontFamily: theme.fonts.bodySemiBold,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bookmark-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: 'Me',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Publish success ("You're live"). Inside the tab group so the tab bar
          is restored the moment the listing goes live, but href:null keeps it
          off the tab bar itself — it's reached only by the checkout redirect. */}
      <Tabs.Screen name="published" options={{ href: null }} />
      {/* Workspace — the host surface, reached from the Me hub's stats card.
          Same href:null treatment, for the reason the create-fork ruling gives:
          chrome goes away only once there is INPUT TO LOSE. Workspace is a
          destination, not a flow — a host who lands here by mistake should be
          able to leave the way they came, so it keeps the tab bar. The Curbside
          form and every wizard step still hide it. */}
      <Tabs.Screen name="workspace" options={{ href: null }} />
      {/* The create ENTRY FORK ("What are you posting?"). Same href:null
          treatment, same reason: the ruling is chrome-less once there is INPUT
          TO LOSE, and the fork is a browsing decision with nothing entered — a
          user who opened it by mistake should not have the back button as their
          only exit.
          ONLY the fork lives here. create/curbside, create/event and
          create/checkout stay in the root Stack and stay chrome-less, because
          they hold unsaved input and a stray tab tap losing a half-filled event
          is worse than one extra back-tap. */}
      <Tabs.Screen name="create" options={{ href: null }} />
    </Tabs>
  );
}

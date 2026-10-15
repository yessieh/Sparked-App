// Tab shell — Explore + Saved + Me. Browsing is anonymous by default: no
// auth checks here or in Explore; auth is invoked only from Me and from
// engagement taps (save/going), never as a wall (architecture lock #2).

import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import ScreenFocus from '../../components/ScreenFocus';
import { brand, useTheme } from '../../theme';

export default function TabsLayout() {
  const theme = useTheme();
  return (
    <Tabs
      // Web only, in effect: every non-focused screen renders inside an
      // `inert` subtree so Tab and screen readers stop walking it. Screens
      // stay mounted — see components/ScreenFocus.tsx.
      screenLayout={({ children }) => <ScreenFocus>{children}</ScreenFocus>}
      // Back inside a tab walks that tab's Stack. When a tab's Stack is at its
      // main page, 'history' sends Back to the previously used TAB; the
      // library default, 'firstRoute' (react-navigation/routers/TabRouter.js:96
      // in expo-router 57.0.4), would send it to Explore.
      backBehavior="history"
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
      {/* Each tab is a Stack (components/TabStack.tsx) — the screens that used
          to sit here with href:null (published, workspace, the create fork,
          event/[id], organizer/[id]) now live inside the tab Stacks, so the
          bar lists exactly these three. Group segments never reach the URL:
          /event/<id>, /workspace, /create stay as they were. */}
      <Tabs.Screen
        name="(explore)"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(saved)"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bookmark-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(me)"
        options={{
          title: 'Me',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Why each moved screen keeps the tab bar (the chrome rule: chrome goes
          away only once there is INPUT TO LOSE) — unchanged by the move:
          - published ("You're live"): the bar returns the moment the listing
            goes live; reached only by the checkout redirect.
          - workspace: a destination, not a flow.
          - the create ENTRY FORK: a browsing decision with nothing entered.
            create/curbside, create/event and create/checkout stay in the root
            Stack, chrome-less, because they hold unsaved input.
          - event/[id], organizer/[id]: public content and deep-link targets; a
            cold arrival needs a way into the app, not a Back to nowhere. */}
    </Tabs>
  );
}

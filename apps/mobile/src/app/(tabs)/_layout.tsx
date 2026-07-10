// Tab shell — Explore + Me only at this stage (Saved lands with saves/RSVPs).
// Browsing is anonymous by default: no auth checks here or in Explore; the Me
// tab is the single place auth is ever invoked (architecture lock #2).

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
        name="me"
        options={{
          title: 'Me',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

// Takes a NON-FOCUSED (tabs) screen out of the tab order and the
// accessibility tree on web, by rendering it inside an `inert` subtree.
//
// WHY. On web the tabs navigator leaves every visited screen mounted at
// display:flex / z-index -1 with only `aria-hidden` on it — react-navigation's
// BottomTabView falls back to a plain View because react-native-screens is
// disabled off-native, so its display:none branch never runs. aria-hidden
// hides nothing from Tab, so keyboard users walked the PREVIOUS screens and
// Chrome logged "Blocked aria-hidden". Read from expo-router 57.0.4's
// vendored copy (bottom-tabs/views/ScreenFallback.js:21-26) and observed
// live, 2026-09-28, against 6eb3da3.
//
// NOT UNMOUNTED, NOT display:none: session-only state (Explore's filters and
// date window, Saved's Past collapse, …) lives in these screens and must
// survive a tab switch.
//
// Injected ONCE, via the (tabs) navigator's `screenLayout` prop. That layout
// is rendered inside the route's NavigationProvider
// (react-navigation/core/useDescriptors.js:121-138), so useIsFocused()
// reads THIS route, not the navigator's.

import { useIsFocused } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';

/** Spread, never written inline — RN 0.86's ViewProps has no `inert`, but rnw
 *  forwards it to the DOM (forwardedProps accessibilityProps) and React 19
 *  treats it as a boolean attribute. Pill.tsx's aria-pressed shim, same
 *  reason. */
const inertProps = (inert: boolean): Record<string, boolean> => ({ inert });

export default function ScreenFocus({ children }: { children: React.ReactNode }) {
  const focused = useIsFocused();
  if (Platform.OS !== 'web') return <>{children}</>;
  return (
    <View style={{ flex: 1 }} {...inertProps(!focused)}>
      {children}
    </View>
  );
}

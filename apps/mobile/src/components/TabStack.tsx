// The Stack inside each tab — Explore, Saved, Me. Back walks the trail inside
// the tab (event → organizer → event…) instead of the tab navigator's
// de-duplicated history, which skipped to Explore two levels deep inside one
// reused route (docs/STACK_FACTS.md, TabRouter 'history').
//
// screenLayout carries ScreenFocus to every screen of the Stack. Without it
// the focus controller finds no container for the screen it navigated to and
// gives up silently (components/ScreenFocus.tsx, settle()) — the per-tab
// stacks recon, section F.
//
// Each group's _layout.tsx sets its own `anchor`, so a cold deep link opens
// with that tab's main page underneath.
//
// LEAKED PARAMS — cleared here, once, for all three tabs. On a cold deep link
// (/event/<id>) expo-router hands the link's params to more routes than the
// one they belong to (expo-router 57.0.4, measured 2026-10-15):
//   - the ANCHOR gets them: `{ name: initialRoute, params: route.params }`
//     (build/fork/getStateFromPath.js:474, :488), so Back landed on /?id=<id>;
//   - the TAB's group route gets them too, and the tab bar builds the tab's
//     href from that route's params (react-navigation/bottom-tabs/views/
//     BottomTabBar.js:288), so the Explore tab read /?id=<id>.
// The main pages own no params (none of index / saved / me reads one), so a
// main page keeps none; the group route keeps only the keys React Navigation
// uses to address a nested screen.

import { Stack, useNavigation, useRoute } from 'expo-router';
import React, { useEffect } from 'react';

import { useTheme } from '../theme';
import ScreenFocus from './ScreenFocus';

/** Each tab's main page — the file each group's _layout anchors. */
const MAIN_PAGES = new Set(['index', 'saved', 'me']);
/** Keys React Navigation reads off a navigator's route to reach a child. */
const NESTING_KEYS = new Set(['screen', 'params', 'initial', 'state', 'path', 'merge', 'pop']);

type Params = Record<string, unknown> | undefined;
type Nav = { dispatch: (action: object) => void };

/** REPLACE_PARAMS (react-navigation/routers/BaseRouter.js:13-30) when `params`
 *  holds a key `keep` rejects. Internal expo-router keys ('__…') always stay. */
function useStripParams(nav: Nav, routeKey: string, params: Params, keep: (key: string) => boolean) {
  useEffect(() => {
    if (!params) return;
    const kept = Object.fromEntries(Object.entries(params).filter(([k]) => k.startsWith('__') || keep(k)));
    if (Object.keys(kept).length === Object.keys(params).length) return;
    nav.dispatch({ type: 'REPLACE_PARAMS', payload: { params: kept }, source: routeKey });
  }, [nav, routeKey, params, keep]);
}

const keepNone = () => false;
const keepNesting = (k: string) => NESTING_KEYS.has(k);

/** Mounted with every screen — including the anchor, which renders (hidden)
 *  under a cold deep link before it is ever focused, so its params are gone
 *  before Back can reach it. */
function MainPageParams({ name, routeKey, params, nav }: { name: string; routeKey: string; params: Params; nav: Nav }) {
  useStripParams(nav, routeKey, MAIN_PAGES.has(name) ? params : undefined, keepNone);
  return null;
}

export default function TabStack() {
  const theme = useTheme();
  // This layout's own route is the TAB's group route, e.g. (explore).
  const route = useRoute();
  const navigation = useNavigation() as unknown as Nav;
  useStripParams(navigation, route.key, route.params as Params, keepNesting);

  return (
    <Stack
      screenLayout={({ children, route: screen, navigation: screenNav }) => (
        <ScreenFocus>
          <MainPageParams
            name={screen.name}
            routeKey={screen.key}
            params={screen.params as Params}
            nav={screenNav as unknown as Nav}
          />
          {children}
        </ScreenFocus>
      )}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.bg },
      }}
    />
  );
}

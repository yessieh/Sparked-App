// Landing jumps — every "go to a screen that sits at the bottom of a trail"
// call goes through here. Measured by console probe against expo-router
// 57.0.4 (paths under build/): 2026-10-14 against d2de327, 2026-10-15 on the
// per-tab Stacks working tree.
//
// backOr — the "nothing to go back to" fallback is replace, as it always was.
//   Inside a tab's Stack a replace swaps the sole screen; from a (tabs) route
//   the Tabs router handles REPLACE as JUMP_TO
//   (react-navigation/routers/TabRouter.js:325-345).
//
// useGoToMain — a tab's MAIN page, with nothing duplicated:
//   1. pop that tab's Stack to its bottom screen (POP_TO_TOP aimed at the
//      Stack's key). Without it, every jump below reaches the tab's Stack as a
//      NAVIGATE without `pop` (react-navigation/core/useNavigationBuilder.js:
//      415-433), which pushes a second main page on top of whatever the tab
//      was left on (routers/StackRouter.js:186-195).
//   2. jump. From a ROOT-STACK screen (Curbside, reset-password) dismissTo,
//      because navigate and replace from there each mounted a SECOND (tabs)
//      navigator (2026-10-14 probe); dismissTo pops back to the existing one
//      (StackRouter.js:334-376). From inside (tabs) navigate, because the Tabs
//      router has no POP_TO case — dismissTo across tabs did nothing.

import { router, useNavigationContainerRef, type Href } from 'expo-router';
import { useCallback } from 'react';

// Public URLs, not group paths: since the per-tab Stacks, '/(tabs)' and
// '/(tabs)/me' are no longer typed routes (expo-router's generated
// .expo/types/router.d.ts), though they still resolved at runtime.
const LANDINGS = {
  explore: '/',
  me: '/me',
  workspace: '/workspace',
  create: '/create',
} as const;

export type Landing = keyof typeof LANDINGS;

/** Back if there is anywhere to go back to; otherwise land on `to`. */
export function backOr(to: Landing) {
  if (router.canGoBack()) router.back();
  else router.replace(LANDINGS[to]);
}

const MAIN_PAGES = {
  explore: { group: '(explore)', href: '/' },
  saved: { group: '(saved)', href: '/saved' },
  me: { group: '(me)', href: '/me' },
} as const;

export type MainPage = keyof typeof MAIN_PAGES;

type NavState = { key: string; index: number; routes: { name: string; state?: NavState }[] };

/** Returns goToMain(tab): land on that tab's main page (see header). */
export function useGoToMain() {
  const nav = useNavigationContainerRef();
  return useCallback(
    (tab: MainPage) => {
      const { group, href } = MAIN_PAGES[tab];
      // The container's root is expo-router's own '__root' slot, wrapping
      // app/_layout's Stack (ExpoRoot.js:137-149) — step into it first.
      const container = nav.getRootState() as unknown as NavState;
      const slot = container.routes[container.index];
      const root = slot.name === '__root' && slot.state ? slot.state : container;
      const top = root.routes[root.index];
      // The focused (tabs) when the caller is inside it; else the one beneath
      // the root-Stack screen calling this.
      const tabs = top.name === '(tabs)' ? top.state : [...root.routes].reverse().find((r) => r.name === '(tabs)')?.state;
      const stack = tabs?.routes.find((r) => r.name === group)?.state;
      if (stack && stack.routes.length > 1) {
        nav.dispatch({ type: 'POP_TO_TOP', target: stack.key });
      }
      if (top.name === '(tabs)') router.navigate(href);
      else router.dismissTo(href);
    },
    [nav],
  );
}

/**
 * Returns openOnMain(tab, href): land on that tab's main page (goToMain — so a
 * root-Stack caller pops back to the EXISTING (tabs), never a second one),
 * then push `href` on top of it. The main page sits underneath, so Back and
 * leaving the tab (popToTopOnBlur) both return to it.
 *
 * Name the tab's group in `href` (e.g. '/(tabs)/(me)/published') when the
 * screen is shared by several tabs: the push resolves a shared route by the
 * CURRENT segments (expo-router 57.0.4, getLinkingConfig.js:90-91 →
 * fork/getStateFromPath-forks.js:267-279), and right after a jump those can
 * still be the caller's, so a bare '/published' could land in Explore.
 */
export function useOpenOnMain() {
  const goToMain = useGoToMain();
  return useCallback(
    (tab: MainPage, href: Href) => {
      goToMain(tab);
      // withAnchor: if the tab's Stack was never opened this session, a plain
      // push builds it as [href] ALONE — no main page beneath, the tab's href
      // reading the pushed screen (measured 2026-11-02). withAnchor loads the
      // group's anchor (its main page) underneath (expo-router 57.0.4,
      // global-state/getNavigationAction.js:60-80).
      router.push(href, { withAnchor: true });
    },
    [goToMain],
  );
}

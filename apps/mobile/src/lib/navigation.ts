// Landing jumps — every "go to a screen that sits at the bottom of a trail"
// call goes through here, so the per-tab Stacks arc changes ONE place.
// Measured 2026-10-14 against d2de327 by console probe, expo-router 57.0.4
// (paths under build/):
//
// backOr — the "nothing to go back to" fallback is replace, as it always was.
//   From a (tabs) screen, replace is a tab jump: the Tabs router handles
//   REPLACE as JUMP_TO (react-navigation/routers/TabRouter.js:325-345).
//   dismissTo is NOT a substitute there: that router has no POP_TO case, so
//   dismissTo('/(tabs)') from a cold /event/<id> did nothing at all.
//
// popTo — dismissTo, for ROOT-STACK screens with (tabs) beneath them. It is
//   POP_TO (global-state/router.js:77-78): pop back to the target if it is in
//   the Stack, else replace the current screen (routers/StackRouter.js:334-376).
//   From settings/* over (tabs), replace('/(tabs)/me') and navigate('/(tabs)')
//   each mounted a SECOND (tabs) navigator; popTo reused the first, same key.
//
// Neither is right for a target in ANOTHER tab once tabs have their own
// Stacks: replace/navigate jump to the tab and its Stack receives a NAVIGATE
// without `pop`, which pushes a duplicate (routers/StackRouter.js:186-195).
// Those call sites are deferred to the restructure prompt.

import { router } from 'expo-router';

const LANDINGS = {
  explore: '/(tabs)',
  me: '/(tabs)/me',
  workspace: '/workspace',
  create: '/create',
} as const;

export type Landing = keyof typeof LANDINGS;

/** Back if there is anywhere to go back to; otherwise land on `to`. */
export function backOr(to: Landing) {
  if (router.canGoBack()) router.back();
  else router.replace(LANDINGS[to]);
}

/** From a root-Stack screen: return to `to`, reusing the (tabs) beneath. */
export function popTo(to: Landing) {
  router.dismissTo(LANDINGS[to]);
}

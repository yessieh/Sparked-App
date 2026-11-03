// One-time pass for the "You're live" screen (app/(tabs)/(me,explore)/
// published.tsx). Checkout grants it the moment a publish completes; the
// screen takes it on mount. Any other arrival — Chrome ←/→, reload, a typed
// URL or deep link — finds no pass and goes to Me's main page instead.
//
// Why: after a publish, Chrome → reaches a stale pre-publish history entry and
// Chrome ← then rebuilds /published from its URL, where the shared route
// resolves to the EXPLORE copy — the success screen stuck in Explore
// (measured 2026-11-03).
//
// In memory on purpose: a reload starts with no pass.

let pending: string | null = null;
/** The route key of the screen holding the pass — so a second render of the
 *  SAME screen (dev StrictMode calls state initialisers twice) still sees it,
 *  while a new screen built for the same URL does not. */
let holder: string | null = null;

/** Checkout: a publish of `eventId` just completed. */
export function grantPublishPass(eventId: string) {
  pending = eventId;
  holder = null;
}

/** published: true once, for the screen that arrives right after the grant. */
export function takePublishPass(routeKey: string, eventId: string | undefined): boolean {
  if (holder === routeKey) return true;
  if (pending === null || pending !== eventId) return false;
  pending = null;
  holder = routeKey;
  return true;
}

/** published, on unmount: the pass is spent. */
export function releasePublishPass(routeKey: string) {
  if (holder === routeKey) holder = null;
}

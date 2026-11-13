// announceAcrossNavigation — a status message that must still be read AFTER
// the screen that raised it has gone.
//
// Every other announcement in the app lives in a role="status" View the
// screen mounts on first render (a11y Entry 2). That breaks for one case:
// a message raised just before navigating away. The screen's region is then
// unmounted, or kept mounted but hidden by the navigator (display:none), and a
// hidden live region is not read. First caller: account deletion, which lands
// on Explore and must say "Your account has been deleted."
//
//   web     — ONE visually hidden role="status" / aria-live="polite" node on
//             document.body, created when this module is first imported (so it
//             is in the tree well before any message is written to it), never
//             removed. Same rule as Entry 2: cleared, then set a frame later,
//             so a repeated message is announced again.
//   native  — AccessibilityInfo.announceForAccessibility (iOS and Android).
//             On web react-native-web compiles that call to a no-op
//             (dist/exports/AccessibilityInfo/index.js:79), hence the node.

import { AccessibilityInfo, Platform } from 'react-native';

let region: HTMLElement | null = null;

function ensureRegion(): HTMLElement | null {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return null;
  if (region && document.body.contains(region)) return region;
  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.setAttribute('data-sparked-announcer', '');
  Object.assign(el.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    margin: '-1px',
    padding: '0',
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
    border: '0',
  });
  document.body.appendChild(el);
  region = el;
  return el;
}

// Mount at import time — see the header.
ensureRegion();

export function announceAcrossNavigation(message: string): void {
  if (Platform.OS !== 'web') {
    AccessibilityInfo.announceForAccessibility(message);
    return;
  }
  const el = ensureRegion();
  if (!el) return;
  el.textContent = '';
  requestAnimationFrame(() => {
    el.textContent = message;
  });
}

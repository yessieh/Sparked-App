// Per-screen focus wrapper, web only. Two jobs:
//
// 1. INERT. A NON-FOCUSED screen renders inside an `inert` subtree, so Tab and
//    screen readers stop walking it. On web the tabs navigator leaves every
//    visited screen mounted at display:flex / z-index -1 with only
//    `aria-hidden` on it — react-navigation's BottomTabView falls back to a
//    plain View because react-native-screens is disabled off-native, so its
//    display:none branch never runs (expo-router 57.0.4's vendored copy,
//    bottom-tabs/views/ScreenFallback.js:21-26; observed live 2026-09-28
//    against 6eb3da3). NOT unmounted, NOT display:none: session-only state
//    (Explore's filters and date window, Saved's Past collapse, …) lives in
//    these screens.
//
// 2. FOCUS ON NAVIGATION. One controller for the whole app (installed once,
//    below) decides where focus goes after each navigation:
//      content navigation (a card, row, link, button)  → the new screen's h1
//      tab-bar press                                   → stays on the tab
//      Back (chip, Leave, footer, Chrome ←)            → the element that
//        opened the screen, if still in the DOM and live; else the h1
//      same route, new params (event A → B)            → the h1
//      first load / refresh / cold deep link           → nothing moves
//    The h1 is FOUND, not registered: every screen carries exactly one
//    level-1 heading (prompt 3, 8c870fe). It gets tabindex -1 (script-focusable,
//    never a Tab stop) and no focus ring. workspace/edit has no h1 by ruling,
//    so the screen's own container is focused instead.
//
// Injected via `screenLayout` on BOTH navigators — (tabs) and the root Stack.
// That layout renders inside the route's NavigationProvider
// (react-navigation/core/useDescriptors.js:121-138), so useIsFocused() and
// useRoute() read THIS route, not the navigator's.
//
// HOW EACH SIGNAL IS DETECTED (expo-router 57.0.4, build/):
//   tab press  — at action time the focused element is inside the tab bar,
//                `role="tablist"` (react-navigation/bottom-tabs/views/
//                BottomTabBar.js:258). A click focuses the tab <a>; Enter
//                keeps it there.
//   back       — the container's `__unsafe_action__` event carries the action
//                type, emitted BEFORE the new state is set
//                (react-navigation/core/useOnAction.js:72-79). Chrome's ←
//                fires popstate, then expo-router's linking calls resetRoot()
//                (fork/useLinking.js:148-222), which dispatches a RESET
//                (core/BaseNavigationContainer.js:135-145) — so popstate marks
//                it, and a RESET right after a popstate stays 'back'. An
//                in-app Back is echoed by a popstate of the app's own
//                (history.go, fork/useLinking.js:342, :348), which is ignored.
//                Chrome's → also fires popstate and is treated the same way
//                (opener if recorded, else h1).
//   params     — same focused route key, different params, after a forward
//                action.

import { useIsFocused, useNavigationContainerRef, useRoute } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { Platform, View } from 'react-native';

/** Spread, never written inline — RN 0.86's ViewProps has no `inert`, but rnw
 *  forwards it to the DOM (forwardedProps accessibilityProps) and React 19
 *  treats it as a boolean attribute. Pill.tsx's aria-pressed shim, same
 *  reason. */
const inertProps = (inert: boolean): Record<string, boolean> => ({ inert });

// ---------------------------------------------------------------------------
// The controller — module state, installed once.
// ---------------------------------------------------------------------------

type Intent = 'forward' | 'back' | 'tab';

const BACK_ACTIONS = new Set(['GO_BACK', 'POP', 'POP_TO_TOP']);
const FORWARD_ACTIONS = new Set(['NAVIGATE', 'NAVIGATE_DEPRECATED', 'PUSH', 'REPLACE', 'JUMP_TO', 'RESET']);
/** Marks the element focus was moved to, for the no-ring rule. */
const TARGET_ATTR = 'data-screen-focus-target';
/** How long a heading-focus stays "pending" for a screen still loading its h1
 *  (Event Detail fetches before it renders its title). */
const HEADING_WAIT_MS = 2500;

/** routeKey → that screen's container element. */
const containers = new Map<string, HTMLElement>();
/** routeKey → the element that was focused when the user navigated AWAY from
 *  that screen by content. Restored when they come Back to it. */
const openers = new Map<string, HTMLElement>();
let installed = false;
let intent: Intent | null = null;
/** Focus was taken off this element before the old screen was hidden. Put
 *  back if the action turns out not to have changed screens. */
let blurred: HTMLElement | null = null;
/** Nothing moves until the person has pressed or clicked something: the
 *  first load, a refresh and a cold deep link are not navigations by them. */
let userActed = false;
let lastLeaf: { key: string; params: string } | null = null;
/** When the last navigation action was dispatched, and how long after it a
 *  popstate is treated as the app's own URL sync rather than Chrome's ←. */
let lastActionAt = -Infinity;
/** When the last browser traversal (Chrome ←/→) began. */
let lastPopstateAt = -Infinity;
const POPSTATE_ECHO_MS = 1000;

function isLive(el: Element): boolean {
  return el.isConnected && !el.closest('[inert]') && !el.closest('[aria-hidden="true"]');
}

function focusQuietly(el: HTMLElement) {
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  el.setAttribute(TARGET_ATTR, '');
  el.focus({ preventScroll: false });
}

function findHeading(container: HTMLElement): HTMLElement | null {
  const all = container.querySelectorAll<HTMLElement>('h1, [role="heading"][aria-level="1"]');
  for (const h of all) if (isLive(h)) return h;
  return null;
}

/** Focus the h1 in `container`; if it is not rendered yet, wait for it, and
 *  fall back to the container itself (workspace/edit has no h1). Keeps
 *  watching briefly so a heading REPLACED while loading (event A → B) still
 *  gets focus, but never takes focus back from something the person moved
 *  it to. */
function focusHeading(container: HTMLElement) {
  const settled = () => {
    const ae = document.activeElement;
    return ae && ae !== document.body && ae !== container && !ae.hasAttribute(TARGET_ATTR);
  };
  const tryFocus = () => {
    if (settled()) return true;
    const h = findHeading(container);
    if (h && document.activeElement !== h) focusQuietly(h);
    return !!h;
  };
  tryFocus();
  const obs = new MutationObserver(() => {
    tryFocus();
  });
  obs.observe(container, { childList: true, subtree: true });
  setTimeout(() => {
    obs.disconnect();
    if (!settled() && !findHeading(container) && isLive(container)) focusQuietly(container);
  }, HEADING_WAIT_MS);
}

function settle(key: string, it: 'forward' | 'back', attempt = 0) {
  const container = containers.get(key);
  // The new screen may still be mounting, or still inert for a frame.
  if (!container || !isLive(container)) {
    if (attempt < 30) requestAnimationFrame(() => settle(key, it, attempt + 1));
    return;
  }
  if (it === 'back') {
    const opener = openers.get(key);
    if (opener) {
      restoreOpener(opener, container);
      return;
    }
  }
  focusHeading(container);
}

/** How long Back waits for a re-rendered opener before settling for the
 *  heading. */
const OPENER_WAIT_MS = 600;

function restoreOpener(opener: HTMLElement, container: HTMLElement, startedAt = performance.now()) {
  const target = resolveOpener(opener, container);
  if (target) {
    target.focus();
    return;
  }
  if (performance.now() - startedAt < OPENER_WAIT_MS) {
    requestAnimationFrame(() => restoreOpener(opener, container, startedAt));
    return;
  }
  focusHeading(container);
}

/** The opener itself if it is still live in this screen; otherwise the
 *  element that REPLACED it. Some screens re-render a control as a new DOM
 *  node when they regain focus (Me re-fetches on focus and remounts its
 *  Workspace card), and "the element that opened the screen" means the
 *  control the person sees, not the node. Matched by role + accessible name
 *  + text, at the same position among matches. */
const signatures = new WeakMap<HTMLElement, { sig: string; index: number }>();

/** Role + accessible name. The aria-label when there is one — it is stable
 *  while a card re-fetches; its visible text is not (Me's Workspace card
 *  reads "—" while loading). Visible text only when there is no label. */
function signatureOf(el: HTMLElement): string {
  const label = el.getAttribute('aria-label');
  return [el.tagName, el.getAttribute('role') ?? '', label ?? (el.textContent ?? '').trim()].join('␟');
}

function candidates(container: HTMLElement, sig: string): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>('[tabindex], a[href], button')].filter(
    (el) => isLive(el) && signatureOf(el) === sig,
  );
}

function rememberOpener(source: string, el: HTMLElement) {
  openers.set(source, el);
  const container = containers.get(source);
  if (!container) return;
  const sig = signatureOf(el);
  signatures.set(el, { sig, index: Math.max(0, candidates(container, sig).indexOf(el)) });
}

function resolveOpener(opener: HTMLElement, container: HTMLElement): HTMLElement | null {
  if (container.contains(opener) && isLive(opener)) return opener;
  const remembered = signatures.get(opener);
  if (!remembered) return null;
  return candidates(container, remembered.sig)[remembered.index] ?? null;
}

type NavRef = ReturnType<typeof useNavigationContainerRef>;

/** The focused leaf route. Typed `never` under expo-router's typed routes, so
 *  read through this one narrow cast. */
function currentRoute(nav: NavRef): { key: string; params?: object } | undefined {
  return (nav.getCurrentRoute as unknown as () => { key: string; params?: object } | undefined).call(nav);
}

/** Where the INSTALLED controller keeps its teardown, outside this module.
 *  Fast Refresh loads a new copy of this module with fresh module state but
 *  leaves the old copy's listeners attached to the page — so an old, even
 *  broken, handler keeps running beside the new one (2026-10-14: a
 *  mid-edit version threw "lastActionAt is not defined" on every
 *  navigation). The new copy removes the old one's listeners first. Dev
 *  only in effect: production loads the module once. */
const TEARDOWN_KEY = '__sparkedScreenFocusTeardown';
type GlobalWithTeardown = typeof globalThis & { [TEARDOWN_KEY]?: () => void };

function install(nav: NavRef) {
  if (installed || typeof document === 'undefined') return;
  installed = true;

  const g = globalThis as GlobalWithTeardown;
  g[TEARDOWN_KEY]?.();
  const cleanups: (() => void)[] = [];
  g[TEARDOWN_KEY] = () => {
    for (const c of cleanups) c();
    cleanups.length = 0;
  };

  const style = document.createElement('style');
  style.textContent = `[${TARGET_ATTR}]:focus { outline: none; }`;
  document.head.appendChild(style);
  cleanups.push(() => style.remove());

  const markActed = () => {
    userActed = true;
  };
  document.addEventListener('pointerdown', markActed, true);
  document.addEventListener('keydown', markActed, true);
  cleanups.push(() => {
    document.removeEventListener('pointerdown', markActed, true);
    document.removeEventListener('keydown', markActed, true);
  });

  const stepOut = () => {
    // Take focus off the element BEFORE its screen is hidden, so the new
    // aria-hidden never lands on an ancestor of the focused element.
    const ae = document.activeElement as HTMLElement | null;
    if (ae && ae !== document.body && !ae.closest('[role="tablist"]')) {
      blurred = ae;
      ae.blur();
    }
  };

  // The event exists on the container ref at runtime but is not in its
  // public event map, hence the cast.
  const addListener = nav.addListener as unknown as (
    type: string,
    cb: (e: { data?: { action?: { type?: string }; noop?: boolean } }) => void,
  ) => () => void;

  const offAction = addListener('__unsafe_action__', (e) => {
    lastActionAt = performance.now();
    if (!userActed || e.data?.noop) return;
    const type = e.data?.action?.type ?? '';
    const ae = document.activeElement as HTMLElement | null;
    if (ae?.closest('[role="tablist"]')) {
      intent = 'tab';
      return;
    }
    // Chrome ←/→: popstate fires first, then expo-router's linking applies
    // the remembered state with resetRoot(), which dispatches a RESET
    // (react-navigation/core/BaseNavigationContainer.js:135-145). That RESET
    // is the traversal itself — keep it as 'back', record no opener.
    if (type === 'RESET' && performance.now() - lastPopstateAt < POPSTATE_ECHO_MS) {
      intent = 'back';
      return;
    }
    if (BACK_ACTIONS.has(type)) {
      intent = 'back';
    } else if (FORWARD_ACTIONS.has(type)) {
      intent = 'forward';
      const source = currentRoute(nav)?.key;
      if (source && ae && ae !== document.body) rememberOpener(source, ae);
    } else {
      return;
    }
    stepOut();
  });
  cleanups.push(offAction);

  const onPopstate = () => {
    // An in-app Back dispatches GO_BACK and THEN syncs the URL with
    // history.go() (fork/useLinking.js:342, :348), which fires popstate after
    // focus has already been restored. That popstate is the app's own echo,
    // not Chrome's ← — ignore anything that closely follows an action.
    if (!userActed || performance.now() - lastActionAt < POPSTATE_ECHO_MS) return;
    lastPopstateAt = performance.now();
    const ae = document.activeElement as HTMLElement | null;
    if (ae?.closest('[role="tablist"]')) return;
    intent = 'back';
    stepOut();
  };
  window.addEventListener('popstate', onPopstate);
  cleanups.push(() => window.removeEventListener('popstate', onPopstate));

  const offState = nav.addListener('state', () => {
    const route = currentRoute(nav);
    if (!route) return;
    const leaf = { key: route.key, params: JSON.stringify(route.params ?? {}) };
    const prev = lastLeaf;
    lastLeaf = leaf;
    const it = intent;
    intent = null;
    const toRestore = blurred;
    blurred = null;
    if (!it || it === 'tab') return;
    const moved = !prev || prev.key !== leaf.key || prev.params !== leaf.params;
    if (!moved) {
      // The action did not change screens — give focus back.
      if (toRestore && isLive(toRestore)) toRestore.focus();
      return;
    }
    requestAnimationFrame(() => settle(leaf.key, it));
  });
  cleanups.push(offState);

  const route = currentRoute(nav);
  if (route) lastLeaf = { key: route.key, params: JSON.stringify(route.params ?? {}) };
}

// ---------------------------------------------------------------------------
// The wrapper.
// ---------------------------------------------------------------------------

const ContainerContext = createContext<React.RefObject<HTMLElement | null> | null>(null);

export default function ScreenFocus({ children }: { children: React.ReactNode }) {
  const focused = useIsFocused();
  const route = useRoute();
  const nav = useNavigationContainerRef();
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') install(nav);
  }, [nav]);

  const setContainer = useCallback(
    (node: View | null) => {
      const el = node as unknown as HTMLElement | null;
      const prev = containerRef.current;
      containerRef.current = el;
      if (el) containers.set(route.key, el);
      else if (prev && containers.get(route.key) === prev) containers.delete(route.key);
    },
    [route.key],
  );

  useEffect(
    () => () => {
      containers.delete(route.key);
      openers.delete(route.key);
    },
    [route.key],
  );

  if (Platform.OS !== 'web') return <>{children}</>;
  return (
    <ContainerContext.Provider value={containerRef}>
      <View ref={setContainer} style={{ flex: 1 }} {...inertProps(!focused)}>
        {children}
      </View>
    </ContainerContext.Provider>
  );
}

/** For an in-screen change that is not a navigation but replaces the
 *  heading — the Event wizard's steps. Focuses the screen's h1 whenever
 *  `value` changes (not on first render). Web only. */
export function useFocusHeadingOnChange(value: unknown) {
  const containerRef = useContext(ContainerContext);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (Platform.OS !== 'web' || !containerRef?.current) return;
    const container = containerRef.current;
    requestAnimationFrame(() => {
      const h = findHeading(container);
      if (h) focusQuietly(h);
    });
  }, [value, containerRef]);
}

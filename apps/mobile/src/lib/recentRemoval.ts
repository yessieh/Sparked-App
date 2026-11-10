// Removing recent places — the focus and announcement rules, in ONE place, for
// the two surfaces that offer it: Explore's location picker (inline ✕) and the
// Privacy screen (Remove / Clear all). Locked 2026-11-10 (Jas): recent places
// are device-local for everyone and removable from both.
//
// FOCUS. A removed row unmounts, which on its own drops focus to the document.
// Instead, after the commit: the NEXT row's remove control; if the removed row
// was last, the PREVIOUS row's; if the list is now empty, the surface's
// fallback (the picker's search field, Privacy's section heading). Same
// mechanism as interests.tsx: a ref map plus a pending target that an effect
// resolves after the row has gone.
//
// STATUS. "Removed <place>" / "Cleared recent places" go to ONE visually
// hidden role="status" node the caller mounts on first render and never
// re-mounts (a11y Entry 2's rule). The text is cleared and set a frame later,
// so removing two places with the same label in a row is still announced.
//
// Nothing here touches the current origin — removeRecent / clearRecent never do.

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { View } from 'react-native';

import type { Place } from './origin';

type Focusable = { focus: () => void };

export function useRecentRemoval({
  history,
  removeRecent,
  clearRecent,
  fallback,
}: {
  history: Place[];
  removeRecent: (place: Place) => void;
  clearRecent: () => void;
  fallback: RefObject<Focusable | null>;
}) {
  const buttons = useRef(new Map<string, View>());
  const register = useCallback(
    (label: string) =>
      (node: View | null): (() => void) | undefined => {
        if (!node) return undefined;
        buttons.current.set(label, node);
        return () => {
          if (buttons.current.get(label) === node) buttons.current.delete(label);
        };
      },
    [],
  );

  const [announcement, setAnnouncement] = useState('');
  const frame = useRef<number | null>(null);
  const announce = useCallback((message: string) => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    setAnnouncement('');
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      setAnnouncement(message);
    });
  }, []);
  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );

  const pending = useRef<{ label: string } | 'fallback' | null>(null);
  // Runs after every commit; acts only when a removal is pending.
  useEffect(() => {
    const target = pending.current;
    if (!target) return;
    const node = target === 'fallback' ? fallback.current : buttons.current.get(target.label);
    if (node) {
      pending.current = null;
      node.focus();
    }
  });

  const remove = useCallback(
    (place: Place) => {
      const i = history.findIndex((h) => h.label === place.label);
      const neighbour = history[i + 1] ?? history[i - 1];
      pending.current = neighbour && neighbour.label !== place.label ? { label: neighbour.label } : 'fallback';
      removeRecent(place);
      announce(`Removed ${place.label}`);
    },
    [history, removeRecent, announce],
  );

  const clearAll = useCallback(() => {
    pending.current = 'fallback';
    clearRecent();
    announce('Cleared recent places');
  }, [clearRecent, announce]);

  return { register, remove, clearAll, announcement };
}

/** Visually hidden but in the accessibility tree (interests.tsx's srOnly). */
export const srOnly = {
  position: 'absolute' as const,
  width: 1,
  height: 1,
  overflow: 'hidden' as const,
  opacity: 0,
};

// Saves + RSVPs client state — one provider, read by cards everywhere.
//
// Refresh model per architecture lock #4: loaded on sign-in and re-pulled on
// screen focus (screens call refresh() in useFocusEffect) — never polled, no
// Realtime. Toggles are optimistic with revert-on-error; a 23505 duplicate
// (same tap raced from another device) converges on the next refresh.
// Anonymous sessions hold empty sets — gating to the auth screen is the
// SCREEN's job (it owns navigation), not this provider's.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from './auth';
import { supabase } from './supabase';

interface EngagementContextValue {
  savedIds: ReadonlySet<string>;
  goingIds: ReadonlySet<string>;
  /** Re-pull both sets (screens call this on focus). No-op when signed out. */
  refresh: () => Promise<void>;
  toggleSave: (eventId: string) => Promise<void>;
  toggleRsvp: (eventId: string) => Promise<void>;
}

const EngagementContext = createContext<EngagementContextValue>({
  savedIds: new Set(),
  goingIds: new Set(),
  refresh: async () => {},
  toggleSave: async () => {},
  toggleRsvp: async () => {},
});

const flip = (set: ReadonlySet<string>, id: string): Set<string> => {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
};

export function EngagementProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [savedIds, setSavedIds] = useState<ReadonlySet<string>>(new Set());
  const [goingIds, setGoingIds] = useState<ReadonlySet<string>>(new Set());
  // Stale-response guard: a refresh started before sign-out must not
  // resurrect rows after the sets were cleared.
  const generation = useRef(0);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const gen = ++generation.current;
    const [saves, rsvps] = await Promise.all([
      supabase.from('saves').select('event_id'),
      supabase.from('rsvps').select('event_id'),
    ]);
    if (gen !== generation.current) return;
    if (!saves.error) setSavedIds(new Set(saves.data.map((r) => r.event_id)));
    if (!rsvps.error) setGoingIds(new Set(rsvps.data.map((r) => r.event_id)));
  }, [userId]);

  useEffect(() => {
    if (userId) {
      refresh();
    } else {
      generation.current++;
      setSavedIds(new Set());
      setGoingIds(new Set());
    }
  }, [userId, refresh]);

  const toggle = useCallback(
    async (
      table: 'saves' | 'rsvps',
      current: ReadonlySet<string>,
      setState: React.Dispatch<React.SetStateAction<ReadonlySet<string>>>,
      eventId: string,
    ) => {
      if (!userId) return;
      const had = current.has(eventId);
      setState((prev) => flip(prev, eventId));
      const { error } = had
        ? await supabase.from(table).delete().match({ user_id: userId, event_id: eventId })
        : await supabase.from(table).insert({ user_id: userId, event_id: eventId });
      // 23505 = duplicate insert (already saved elsewhere) — optimistic state
      // is already correct; anything else reverts.
      if (error && error.code !== '23505') setState((prev) => flip(prev, eventId));
    },
    [userId],
  );

  const value = useMemo<EngagementContextValue>(
    () => ({
      savedIds,
      goingIds,
      refresh,
      toggleSave: (eventId) => toggle('saves', savedIds, setSavedIds, eventId),
      toggleRsvp: (eventId) => toggle('rsvps', goingIds, setGoingIds, eventId),
    }),
    [savedIds, goingIds, refresh, toggle],
  );

  return <EngagementContext.Provider value={value}>{children}</EngagementContext.Provider>;
}

export const useEngagement = (): EngagementContextValue => useContext(EngagementContext);

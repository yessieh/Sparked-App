// Interests & blocks client state — one provider, read by the Settings screen
// and the Explore feed filter (Architecture Decision 7; RULINGS LOCKED
// 2026-09-22 in SPARKED_STATE.md).
//
// Same shape as lib/engagement.tsx, deliberately (one structural difference,
// explained at `Snapshot` below): loaded on sign-in and
// re-pulled on screen focus (screens call refresh() in useFocusEffect) — never
// polled, no Realtime. Anonymous sessions hold empty sets, which is the ruling
// ("signed-out users have no blocks"), not a placeholder.
//
// STORAGE: public.category_preferences (migration 0034). One row per category
// the user has an opinion on; Undecided is the ABSENCE of a row. Reads are
// scoped to the caller by RLS (`category_preferences_select_own`), so the
// select below carries no user filter. Anon holds no grant on the table at all
// (0034; post-arc baseline 2026-09-23-post-interests-blocks.md, no anon row),
// which is why the signed-out path never queries it.
//
// THE WRITE PATH IS THREE VERBS, NEVER AN UPSERT (0034's header explains why):
//   none → X   insert { user_id, category_id, stance }
//   X → Y      update { stance }            — the only column authenticated
//                                              may update (0034, `update
//                                              (stance)`; qa-0034 4f-4g)
//   X → none   delete
// The verb is chosen from LOCAL state, so local state can be wrong — another
// device moved the category in between. The server says so in two ways, and
// both mean "re-pull, don't revert": a 23505 on insert (a row already exists),
// or an update/delete that matched 0 rows (the row is gone). Any other error is
// a real failure and the optimistic change is reverted.

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

/** A stored bucket. Undecided is `null` — no row. */
export type Stance = 'into' | 'blocked';

interface InterestsContextValue {
  /** Category ids in "I'm into". */
  into: ReadonlySet<string>;
  /** Category ids in "Not for me". */
  blocked: ReadonlySet<string>;
  /**
   * False until the first load for the current user resolves — same contract
   * as engagement's. The feed filter must hold on this: an empty `blocked` set
   * means "not loaded yet" just as easily as "blocks nothing", and treating the
   * first as the second would flash blocked events in and then out.
   */
  loaded: boolean;
  /** Re-pull both sets (screens call this on focus). No-op when signed out. */
  refresh: () => Promise<void>;
  /** Move a category to a bucket; `null` = back to Undecided. */
  setStance: (categoryId: string, next: Stance | null) => Promise<void>;
}

const InterestsContext = createContext<InterestsContextValue>({
  into: new Set(),
  blocked: new Set(),
  loaded: false,
  refresh: async () => {},
  setStance: async () => {},
});

/** `set` with `id` present iff `present`. Returns the same set when unchanged. */
const withMember = (set: ReadonlySet<string>, id: string, present: boolean): ReadonlySet<string> => {
  if (set.has(id) === present) return set;
  const next = new Set(set);
  if (present) next.add(id);
  else next.delete(id);
  return next;
};

const EMPTY: ReadonlySet<string> = new Set();

/** The one read. RLS (`category_preferences_select_own`) scopes it to the
 *  caller, so it carries no user filter. */
const readPrefs = () => supabase.from('category_preferences').select('category_id, stance');
type PrefsResult = Awaited<ReturnType<typeof readPrefs>>;

/**
 * The last resolved load, TAGGED WITH THE USER IT BELONGS TO. `loaded` and the
 * exposed sets are DERIVED from the tag rather than reset by an effect — the
 * one structural difference from lib/engagement.tsx, and the reason for it:
 * engagement's effect calls setLoaded(false) synchronously, which is one of
 * the baselined `react-hooks/set-state-in-effect` findings; copying it here
 * would have added another. The rules are engagement's, unchanged:
 *   • `loaded` goes false only when the USER changes (the tag no longer
 *     matches), so a focus refresh never drops consumers into a loading state;
 *   • signed out, the empty sets ARE the resolved answer — `loaded` is true
 *     immediately, not one render later.
 */
interface Snapshot {
  user: string | null;
  into: ReadonlySet<string>;
  blocked: ReadonlySet<string>;
}

export function InterestsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [snap, setSnap] = useState<Snapshot>({ user: null, into: EMPTY, blocked: EMPTY });
  // Stale-response guard: a refresh started before sign-out (or before a user
  // switch) must not resurrect rows under the new state.
  const generation = useRef(0);

  const snapIsMine = snap.user === userId && userId !== null;
  const into = snapIsMine ? snap.into : EMPTY;
  const blocked = snapIsMine ? snap.blocked : EMPTY;
  const loaded = userId === null || snap.user === userId;

  /** Land one read's answer for `uid`, unless a newer read (or a sign-out)
   *  has started since generation `gen` was taken. */
  const settle = useCallback((gen: number, uid: string, result: PrefsResult) => {
    if (gen !== generation.current) return;
    if (result.error) {
      // Resolved, even on failure — engagement's rule. Keeps the sets already
      // held for this user; a first load that fails resolves to empty.
      setSnap((prev) => (prev.user === uid ? prev : { user: uid, into: EMPTY, blocked: EMPTY }));
      return;
    }
    const nextInto = new Set<string>();
    const nextBlocked = new Set<string>();
    for (const row of result.data) {
      if (row.stance === 'into') nextInto.add(row.category_id);
      else if (row.stance === 'blocked') nextBlocked.add(row.category_id);
    }
    setSnap({ user: uid, into: nextInto, blocked: nextBlocked });
  }, []);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const gen = ++generation.current;
    settle(gen, userId, await readPrefs());
  }, [userId, settle]);

  // Load on USER change. Nothing is set synchronously here — `loaded` is
  // derived above, and the answer lands in a `.then` callback. Bumping the
  // generation on EVERY change is what drops a stale response after sign-out.
  useEffect(() => {
    const gen = ++generation.current;
    if (!userId) return;
    readPrefs().then((result) => settle(gen, userId, result));
  }, [userId, settle]);

  /**
   * Put `categoryId` in exactly the bucket `stance` names (none for null).
   * Applies only to the CURRENT user's loaded snapshot: before the first load
   * resolves there is nothing to be optimistic about, and the write itself
   * still goes out — its answer lands with that load.
   */
  const apply = useCallback(
    (categoryId: string, stance: Stance | null) => {
      setSnap((prev) =>
        prev.user !== userId
          ? prev
          : {
              user: prev.user,
              into: withMember(prev.into, categoryId, stance === 'into'),
              blocked: withMember(prev.blocked, categoryId, stance === 'blocked'),
            },
      );
    },
    [userId],
  );

  const setStance = useCallback(
    async (categoryId: string, next: Stance | null) => {
      if (!userId) return;
      const current: Stance | null = into.has(categoryId)
        ? 'into'
        : blocked.has(categoryId)
          ? 'blocked'
          : null;
      if (current === next) return;

      apply(categoryId, next);

      // `stale` = local state disagreed with the server; re-pull, don't revert.
      let stale = false;
      let failed = false;
      if (current === null) {
        const { error } = await supabase
          .from('category_preferences')
          .insert({ user_id: userId, category_id: categoryId, stance: next });
        if (error) {
          if (error.code === '23505') stale = true;
          else failed = true;
        }
      } else if (next !== null) {
        const { data, error } = await supabase
          .from('category_preferences')
          .update({ stance: next })
          .eq('user_id', userId)
          .eq('category_id', categoryId)
          .select('category_id');
        if (error) failed = true;
        else if (data.length === 0) stale = true;
      } else {
        const { data, error } = await supabase
          .from('category_preferences')
          .delete()
          .eq('user_id', userId)
          .eq('category_id', categoryId)
          .select('category_id');
        if (error) failed = true;
        else if (data.length === 0) stale = true;
      }

      if (stale) await refresh();
      else if (failed) apply(categoryId, current);
    },
    [userId, into, blocked, apply, refresh],
  );

  const value = useMemo<InterestsContextValue>(
    () => ({ into, blocked, loaded, refresh, setStance }),
    [into, blocked, loaded, refresh, setStance],
  );

  return <InterestsContext.Provider value={value}>{children}</InterestsContext.Provider>;
}

export const useInterests = (): InterestsContextValue => useContext(InterestsContext);

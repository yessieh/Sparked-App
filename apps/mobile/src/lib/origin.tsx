// The browsing origin — where the Explore feed measures distance FROM — plus
// the radius, plus a short history of places the user has typed. Device-local
// (AsyncStorage), never a `profiles` column: it never leaves the phone, so
// there is nothing to purge server-side and no data-export obligation.
//
// PRIVACY BOUNDARY — the location lock as AMENDED 2026-08-21 (typed vs sensed).
// Everything stored here is USER-DECLARED: a town or zip somebody typed and
// then confirmed. That is a preference, no different in kind from a saved
// filter. A coordinate read from the DEVICE is a position trace and a history
// of those traces is exactly what the lock forbids — nothing in this file
// reads device position, and nothing in this arc may. The device locator is
// Stage 2b and resolves ONE sensed reading to a town name, discarding the
// coordinate immediately.
//
// The coordinates stored beside each label are the GEOCODER'S answer for a
// typed place, not a reading of where anyone was.

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/** A confirmed place. `lat`/`lng` (not `lon`) to match the RPC's argument
 *  names — lib/geocode.ts speaks `lon` and converts at its boundary. */
export interface Place {
  /** Header label — "Sahuarita, AZ", or "85614, AZ" for a zip (Nominatim
   *  returns no town for a bare postcode; see geocodePlaces). */
  label: string;
  /** The full display_name the user actually confirmed. Kept so the history
   *  row can prove which "Springfield" this was. */
  detail: string;
  lat: number;
  lng: number;
}

export const MIN_RADIUS = 1;
export const MAX_RADIUS = 100;
/** Seeded default before the user has set anything. */
export const DEFAULT_RADIUS = 25;

/**
 * TEMPORARY SCAFFOLDING — NOT A PRODUCT DECISION.
 *
 * A brand-new user should be ASKED where they are; they are not, yet, because
 * Onboarding does not exist. Until it does, the feed has to measure from
 * somewhere, so it measures from the beachhead town. This is the retired
 * `TEST_ORIGIN` from lib/devOrigin.ts, and the coordinates are what Nominatim
 * returns for "Sahuarita, AZ" (verified 2026-08-20: 31.9575305 / -110.9556645,
 * agreeing with the old constant to four decimals).
 *
 * Onboarding is the first FLOW that sets this value through the same control a
 * user edits it with — one control, two callers. When it ships, this seed stops
 * being reachable by a new user and exists only as the fallback for a corrupt
 * stored blob. Do not read it as "Sparked defaults to Arizona."
 */
const SEED_PLACE: Place = {
  label: 'Sahuarita, AZ',
  detail: 'Sahuarita, Pima County, Arizona, United States',
  lat: 31.9576,
  lng: -110.9556,
};

/** Namespaced so it cannot collide with the supabase-js session entry, which
 *  shares this store (AsyncStorage on native, localStorage on web). */
const KEY = 'sparked.origin.v1';

/** History cap, per the 2026-08-21 lock. */
const HISTORY_MAX = 5;

/** Defensive cap on a third-party string. See isPlace. */
const LABEL_MAX = 80;
const DETAIL_MAX = 200;

interface Stored {
  v: 1;
  place: Place;
  radius: number;
  history: Place[];
}

export function clampRadius(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_RADIUS;
  return Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, Math.round(n)));
}

/**
 * STORAGE IS UNTRUSTED INPUT, and this guard is the reason.
 *
 * On web this store is localStorage: readable AND writable by any script on the
 * origin, and by anyone with devtools open. On native it survives app upgrades
 * that may have written an older shape. So a stored blob is validated on READ,
 * never merely on write — a tampered or stale entry must fall back to the seed
 * rather than propagate into an RPC argument.
 *
 * The range checks are not decoration: an out-of-range or NaN coordinate
 * reaches Postgres as `null` (JSON.stringify(NaN) === 'null'), and
 * events_within_radius answers a null origin with an EMPTY FEED AND NO ERROR.
 * That is the same silently-wrong failure class as the 632-mile geocode.
 */
function isPlace(v: unknown): v is Place {
  if (typeof v !== 'object' || v === null) return false;
  const p = v as Record<string, unknown>;
  return (
    typeof p.label === 'string' &&
    p.label.length > 0 &&
    p.label.length <= LABEL_MAX &&
    typeof p.detail === 'string' &&
    p.detail.length <= DETAIL_MAX &&
    typeof p.lat === 'number' &&
    Number.isFinite(p.lat) &&
    p.lat >= -90 &&
    p.lat <= 90 &&
    typeof p.lng === 'number' &&
    Number.isFinite(p.lng) &&
    p.lng >= -180 &&
    p.lng <= 180
  );
}

function parseStored(raw: string | null): Stored | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null; // corrupt or hand-edited — fall back to the seed.
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const s = parsed as Record<string, unknown>;
  if (s.v !== 1) return null; // a future/older shape is not ours to interpret.
  if (!isPlace(s.place)) return null;
  const history = Array.isArray(s.history) ? s.history.filter(isPlace).slice(0, HISTORY_MAX) : [];
  return {
    v: 1,
    place: s.place,
    radius: clampRadius(typeof s.radius === 'number' ? s.radius : DEFAULT_RADIUS),
    history,
  };
}

/** Most-recent-first, deduped on label, capped. */
function pushHistory(history: Place[], place: Place): Place[] {
  const rest = history.filter((h) => h.label !== place.label);
  return [place, ...rest].slice(0, HISTORY_MAX);
}

export interface OriginContextValue {
  /** null ONLY while `loaded` is false — see the loaded note. */
  place: Place | null;
  radius: number;
  history: Place[];
  /**
   * False until the stored value has resolved.
   *
   * CALLERS MUST HOLD ON THIS BEFORE READING THE FEED. AsyncStorage is async
   * and the feed loads on mount, so there is a gap; the seed is deliberately
   * NOT rendered during it. Rendering Sahuarita first would flash the wrong
   * town at a traveller AND fire a wasted RPC against the wrong origin. Same
   * flag and same reasoning as EngagementProvider's `loaded`, which exists so
   * the Me hub never flashes "nothing coming up" at someone who has something.
   */
  loaded: boolean;
  setPlace: (place: Place) => void;
  setRadius: (miles: number) => void;
}

const OriginContext = createContext<OriginContextValue>({
  place: null,
  radius: DEFAULT_RADIUS,
  history: [],
  loaded: false,
  setPlace: () => {},
  setRadius: () => {},
});

export function OriginProvider({ children }: { children: ReactNode }) {
  // ONE state object, not three. place/radius/history are written together and
  // persisted together, so splitting them means a setter has to read its
  // siblings — and reading one setter's value from inside another's updater is
  // exactly the pattern React double-invokes in StrictMode.
  const [state, setState] = useState<Stored | null>(null);

  // First run seeds from Sahuarita and WRITES it, so the seed is only ever
  // rendered from storage — never as a pre-load default. See `loaded`.
  useEffect(() => {
    let alive = true;
    (async () => {
      let stored: Stored | null = null;
      try {
        stored = parseStored(await AsyncStorage.getItem(KEY));
      } catch {
        stored = null; // storage unavailable (private mode, quota) — seed.
      }
      if (!alive) return;
      const next: Stored = stored ?? { v: 1, place: SEED_PLACE, radius: DEFAULT_RADIUS, history: [] };
      setState(next);
      if (!stored) void persist(next);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const setPlace = useCallback((place: Place) => {
    setState((prev) => {
      if (!prev) return prev; // pre-load; the control is not reachable yet.
      const next: Stored = { ...prev, place, history: pushHistory(prev.history, place) };
      void persist(next);
      return next;
    });
  }, []);

  const setRadius = useCallback((miles: number) => {
    setState((prev) => {
      if (!prev) return prev;
      const radius = clampRadius(miles);
      if (radius === prev.radius) return prev; // no write, no refetch.
      const next: Stored = { ...prev, radius };
      void persist(next);
      return next;
    });
  }, []);

  const value = useMemo<OriginContextValue>(
    () => ({
      place: state?.place ?? null,
      radius: state?.radius ?? DEFAULT_RADIUS,
      history: state?.history ?? [],
      loaded: state !== null,
      setPlace,
      setRadius,
    }),
    [state, setPlace, setRadius],
  );

  return React.createElement(OriginContext.Provider, { value }, children);
}

/** Fire-and-forget. A failed write costs the user their preference next launch,
 *  which is not worth interrupting a working session over.
 *
 *  Called from inside a setState updater, which StrictMode double-invokes —
 *  deliberate and safe, because the write is idempotent (same key, same bytes).
 *  Hoisting it into an effect would cost a redundant write-back of the value
 *  just READ on load, for no gain. */
async function persist(next: Stored): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage full or unavailable — the in-memory value still drives this session.
  }
}

export const useOrigin = (): OriginContextValue => useContext(OriginContext);

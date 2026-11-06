// Geocoding. Nominatim (OpenStreetMap): no key, plain fetch, ~1 req/s usage
// policy — dev/MVP only; swap for a paid geocoder at scale (tracked). This
// file is the single swap-point.
//
// The silent `geocode()` (one point, limit=1, no confirmation) was REMOVED
// 2026-11-06 once its last caller, the Curbside form, moved to the confirm
// step (components/AddressConfirm.tsx). It is the function that published
// "123 Rainbow Road" 632 miles away; every create flow now confirms.

export interface GeoPoint {
  lat: number;
  lon: number;
}

/** `SRID=4326;POINT(lon lat)` WKT for an events.location insert. */
export function toWktPoint({ lat, lon }: GeoPoint): string {
  return `SRID=4326;POINT(${lon} ${lat})`;
}

// ---------------------------------------------------------------------------
// PLACE lookup — the Explore browsing origin (town/state or zip).
//
// Answers "which place did you mean" and returns CANDIDATES the user chooses
// between. Also the create flows' town fallback ("Which town or zip is it
// near?", AddressConfirm), US-only there via `usOnly`.
//
// WHY CANDIDATES AND NOT limit=1: a place query is frequently ambiguous, and
// the ambiguity does not announce itself. Measured against the live API on
// 2026-08-20: `85614` returns Arizona, Bavaria and Poland with BYTE-IDENTICAL
// importance scores (0.12000999999999995), so limit=1 picks a country on a tie
// break nobody controls. `Springfield` returns five real US cities. The
// confirmation step is what makes that safe, and it is why this returns a list.
// ---------------------------------------------------------------------------

export interface PlaceCandidate {
  /** Short header label — "Green Valley, AZ", or "85614, AZ" for a bare zip. */
  label: string;
  /** Nominatim's full display_name, verbatim. THE string the user confirms. */
  detail: string;
  lat: number;
  lng: number;
}

/** Nominatim caps display_name well below this; the cap exists because the
 *  response is third-party data and an unbounded string reaches a layout. */
const DETAIL_MAX = 200;
const LABEL_MAX = 80;

interface NominatimHit {
  lat?: unknown;
  lon?: unknown;
  name?: unknown;
  display_name?: unknown;
  address?: { 'ISO3166-2-lvl4'?: unknown; state?: unknown } | null;
}

/**
 * Coordinate validation at the network boundary.
 *
 * Not defensive decoration: an absent or malformed lat/lon becomes NaN through
 * parseFloat, JSON.stringify turns NaN into `null`, and events_within_radius
 * answers a null origin with an EMPTY FEED AND NO ERROR — indistinguishable
 * from "nothing near you". A bad candidate is dropped here rather than rendered
 * as a choosable option.
 */
function toCoord(v: unknown, limit: number): number | null {
  if (typeof v !== 'string' && typeof v !== 'number') return null;
  const n = typeof v === 'number' ? v : parseFloat(v);
  if (!Number.isFinite(n) || n < -limit || n > limit) return null;
  return n;
}

/** "Green Valley" + "US-AZ" -> "Green Valley, AZ". Falls back to the full
 *  display_name's leading segment when the ISO code is absent (non-US, or a
 *  hit with no addressdetails). */
function toLabel(hit: NominatimHit, detail: string): string {
  const name = typeof hit.name === 'string' && hit.name.trim() ? hit.name.trim() : detail.split(',')[0].trim();
  const iso = hit.address?.['ISO3166-2-lvl4'];
  const code = typeof iso === 'string' && /^[A-Z]{2}-[A-Z0-9]{1,3}$/.test(iso) ? iso.split('-')[1] : null;
  const label = code ? `${name}, ${code}` : name;
  return label.slice(0, LABEL_MAX);
}

/**
 * Place candidates for a typed town/state or zip, best match first.
 *
 * NO COUNTRY FILTER, by ruling (2026-08-20). `countrycodes=us` would erase the
 * cross-country zip tie above, but a filter that silently discards results is
 * the same class of hidden decision as the geocode this arc exists to make
 * visible. Every candidate is shown; the user picks.
 *
 * Place names are NOT run through lib/moderation.ts's blocklist, and that is a
 * decision rather than an oversight: it is a blunt SUBSTRING list built for
 * user-authored category text, and it rejects real US towns — "Killeen, TX"
 * contains "kill", "Gunnison, CO" contains "gun", "Bombay Beach, CA" contains
 * "bomb". Filtering the geocoder's answers through it would break the feature
 * for the people who live there. The length caps above are the real guard.
 */
// ---------------------------------------------------------------------------
// ADDRESS candidates — the create flows' confirm step (components/
// AddressConfirm.tsx), used by the event wizard and the Curbside form. Replaced
// the old silent limit=1 geocode() (removed 2026-11-06).
//
// Measured against the live API on 2026-11-04 (format=jsonv2, addressdetails=1,
// limit=5, countrycodes=us): "18680 S Nogales Hwy, Green Valley, AZ" returns
// two HOUSE-level hits (place_rank 30, address.house_number "18680" — a
// Walmart and a Coinstar inside it); "123 Rainbow Road" returns five
// house-level hits in PA, CT and CA, two of them sharing one display_name.
// So a hit CAN be the exact door; one without a house number is a street or an
// area, and the confirm wording says "near" for those (`exact`).
//
// countrycodes=us HERE, unlike geocodePlaces: an event address is a US street
// address by product scope, and a foreign hit is never the right one.
// viewbox + bounded=0 BIASES toward the host's Explore origin without
// excluding anything, so a correct match 300 miles away still appears.
// ---------------------------------------------------------------------------

export interface AddressCandidate {
  /** Nominatim's full display_name, verbatim — the string the host confirms. */
  detail: string;
  lat: number;
  lng: number;
  /** True when the hit carries a house number: the pin is the address itself.
   *  False = a street or area; the UI says "near". */
  exact: boolean;
}

/** Half-width of the bias box around the origin, in degrees (~50 mi). */
const BIAS_DEG = 0.75;

/**
 * Address candidates for a typed street address, best match first. ONE request
 * per call — the caller fires it on an explicit Find tap, never per keystroke
 * (Nominatim's usage policy forbids autocomplete).
 */
export async function geocodeAddresses(
  query: string,
  near?: { lat: number; lng: number } | null,
): Promise<AddressCandidate[]> {
  const q = query.trim();
  if (!q) return [];
  let url =
    `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=us` +
    `&q=${encodeURIComponent(q)}`;
  if (near) {
    // viewbox = left,top,right,bottom (lon,lat,lon,lat).
    const box = [near.lng - BIAS_DEG, near.lat + BIAS_DEG, near.lng + BIAS_DEG, near.lat - BIAS_DEG];
    url += `&viewbox=${box.map((n) => n.toFixed(4)).join(',')}&bounded=0`;
  }
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Address lookup failed (${res.status}) — try again in a moment.`);
  const body: unknown = await res.json();
  if (!Array.isArray(body)) return [];
  const out: AddressCandidate[] = [];
  const seen = new Set<string>();
  for (const raw of body as (NominatimHit & { address?: { house_number?: unknown } | null })[]) {
    const lat = toCoord(raw?.lat, 90);
    const lng = toCoord(raw?.lon, 180);
    if (lat === null || lng === null) continue;
    const detail = typeof raw?.display_name === 'string' ? raw.display_name.slice(0, DETAIL_MAX) : '';
    // Two hits with one display_name read as the same choice twice — keep the first.
    if (!detail || seen.has(detail)) continue;
    seen.add(detail);
    const house = raw?.address?.house_number;
    out.push({ detail, lat, lng, exact: typeof house === 'string' && house.trim().length > 0 });
  }
  return out;
}

export async function geocodePlaces(
  query: string,
  limit = 5,
  /** US only (countrycodes=us). The CREATE flows' "Which town or zip is it
   *  near?" fallback sets it: an event is pinned to a US town by product scope
   *  (ruled 2026-11-06). Explore's place picker leaves it off — the ruling
   *  above stands there unchanged. */
  usOnly = false,
): Promise<PlaceCandidate[]> {
  const q = query.trim();
  if (!q) return [];
  const url =
    `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1` +
    `&limit=${encodeURIComponent(String(limit))}` +
    (usOnly ? '&countrycodes=us' : '') +
    `&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Location lookup failed (${res.status}) — try again in a moment.`);
  const body: unknown = await res.json();
  if (!Array.isArray(body)) return [];
  const out: PlaceCandidate[] = [];
  for (const raw of body as NominatimHit[]) {
    const lat = toCoord(raw?.lat, 90);
    const lng = toCoord(raw?.lon, 180);
    if (lat === null || lng === null) continue;
    const detail = typeof raw?.display_name === 'string' ? raw.display_name.slice(0, DETAIL_MAX) : '';
    if (!detail) continue;
    out.push({ label: toLabel(raw, detail), detail, lat, lng });
  }
  return out;
}


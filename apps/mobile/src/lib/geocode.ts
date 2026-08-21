// Address → PostGIS point. Nominatim (OpenStreetMap): no key, plain fetch,
// ~1 req/s usage policy — dev/MVP only; swap for a paid geocoder at scale
// (tracked). Shared by every create flow so there is ONE geocode interface
// (Curbside mini-form + paid wizard).

export interface GeoPoint {
  lat: number;
  lon: number;
}

export async function geocode(address: string): Promise<GeoPoint> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(address)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Address lookup failed (${res.status}) — try again in a moment.`);
  const hits = (await res.json()) as { lat: string; lon: string }[];
  if (!hits.length) throw new Error("Couldn't find that address — check it and try again.");
  return { lat: parseFloat(hits[0].lat), lon: parseFloat(hits[0].lon) };
}

/** `SRID=4326;POINT(lon lat)` WKT for an events.location insert. */
export function toWktPoint({ lat, lon }: GeoPoint): string {
  return `SRID=4326;POINT(${lon} ${lat})`;
}

// ---------------------------------------------------------------------------
// PLACE lookup — the Explore browsing origin (town/state or zip).
//
// SEPARATE FROM geocode() ABOVE, DELIBERATELY. That one answers "where is this
// street address" for a create flow and returns ONE point; this one answers
// "which place did you mean" and returns CANDIDATES the user chooses between.
// Same file and same provider, so lib/geocode.ts is still the single swap-point
// for the tracked paid-geocoder migration — but the create flows' behaviour is
// untouched by this arc.
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
export async function geocodePlaces(query: string, limit = 5): Promise<PlaceCandidate[]> {
  const q = query.trim();
  if (!q) return [];
  const url =
    `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1` +
    `&limit=${encodeURIComponent(String(limit))}&q=${encodeURIComponent(q)}`;
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


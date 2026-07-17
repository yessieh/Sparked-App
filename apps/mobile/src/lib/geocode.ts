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

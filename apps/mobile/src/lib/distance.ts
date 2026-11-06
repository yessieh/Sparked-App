// Great-circle distance on the device, for cues shown BEFORE anything is stored
// (the create flows' address confirm step). Everything an attendee sees is
// still measured server-side by PostGIS (events_within_radius / event_detail);
// this is an estimate for the host, and the two can differ by a fraction of a
// mile (sphere vs. spheroid).

const EARTH_RADIUS_MI = 3958.8;

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Haversine distance in miles between two lat/lng points. */
export function milesBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.min(1, Math.sqrt(h)));
}

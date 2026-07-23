// Site-map vendors — the Plus tier's vendor-pin data. Vendors are EVENT-OWNED
// structured rows (never user accounts), persisted in public.event_vendors
// (migration 0013). Pins are RELATIVE 0..1 coordinates on the site-map image,
// not geography — the map is a diagram. The image itself is a placeholder for
// now (real uploads = stage 5), so logo is an ephemeral wizard-only flag and
// logo_path stays null on write.
//
// Pure module (no react-native imports) — the DB row shape, the client shape,
// and the seed type list live here so the wizard, the shared SiteMap view, and
// the detail read all agree.

/** A common vendor-type starter set for the substring/dedupe suggestions.
 * Custom types are allowed (free text) — this only powers autocomplete. */
export const VENDOR_TYPES = [
  'Food', 'Drinks', 'Coffee', 'Bakery', 'Crafts', 'Art', 'Jewelry', 'Apparel',
  'Music', 'Merch', 'Books', 'Plants', 'Nonprofit', 'Community', 'Kids',
  'Services', 'Wellness', 'Vintage',
];

/** Fallback display type when the host leaves it blank (reference parity). */
export const DEFAULT_VENDOR_TYPE = 'Vendor';

/** Client shape used by the wizard + the shared SiteMap view. */
export interface Vendor {
  /** Present once persisted; absent for a freshly-added draft vendor. */
  id?: string;
  name: string;
  vendorType: string;
  /** 0..1 relative position on the site-map image; null = not yet pinned. */
  pinX: number | null;
  pinY: number | null;
  /** Placeholder logo toggle — ephemeral (no real upload this stage). */
  logo?: boolean;
}

/** public.event_vendors row as PostgREST returns it. */
export interface VendorRow {
  id: string;
  name: string;
  vendor_type: string | null;
  logo_path: string | null;
  pin_x: number | null;
  pin_y: number | null;
  sort_order: number;
}

export function vendorFromRow(r: VendorRow): Vendor {
  return {
    id: r.id,
    name: r.name,
    vendorType: r.vendor_type ?? DEFAULT_VENDOR_TYPE,
    pinX: r.pin_x,
    pinY: r.pin_y,
    logo: !!r.logo_path,
  };
}

/** Client vendor → an event_vendors insert payload (logo_path stays null:
 * placeholder image this stage). sort_order preserves the host's order. */
export function vendorInsert(v: Vendor, eventId: string, index: number) {
  return {
    event_id: eventId,
    name: v.name,
    vendor_type: v.vendorType || DEFAULT_VENDOR_TYPE,
    logo_path: null as string | null,
    pin_x: v.pinX,
    pin_y: v.pinY,
    sort_order: index,
  };
}

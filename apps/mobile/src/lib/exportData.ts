// "Download my data" — the client half of migration 0038.
//
// The server document (public.export_my_data → app.export_my_data) carries
// everything Sparked stores about the caller, keyed on auth.uid(). Two things
// it deliberately does NOT read are added here from the client:
//   - account: email and sign-in method(s), from the current session (0038
//     never reads auth.users);
//   - recent_places: the device-local history (lib/origin.tsx,
//     `sparked.origin.v1`), labelled as stored on this device only.
//
// Web only for now: the file is a Blob download. The native share sheet is a
// tracked follow-up (it needs packages this app does not have yet).

import type { Session } from '@supabase/supabase-js';

import type { Place } from './origin';
import { supabase } from './supabase';

export type ExportResult = { ok: true; filename: string } | { ok: false };

/** Local date as YYYY-MM-DD — the user's calendar day, not UTC's. */
function localYMD(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Fetch the server export, add the client-only sections, and download it as
 *  pretty-printed JSON. Any failure (network, server, no session) → ok:false;
 *  nothing here signs anyone out. */
export async function downloadMyData(session: Session, history: Place[]): Promise<ExportResult> {
  try {
    const { data, error } = await supabase.rpc('export_my_data');
    if (error || !data || typeof data !== 'object') return { ok: false };

    const user = session.user;
    const providers =
      (user.app_metadata?.providers as string[] | undefined) ??
      (user.app_metadata?.provider ? [user.app_metadata.provider as string] : []);

    const document = {
      ...(data as Record<string, unknown>),
      account: {
        email: user.email ?? null,
        sign_in_methods: providers,
        source: 'Your current session on this device.',
      },
      recent_places: {
        stored: 'On this device only. Sparked never sends these to its servers.',
        places: history.map((p) => ({ label: p.label, detail: p.detail, lat: p.lat, lng: p.lng })),
      },
    };

    const filename = `sparked-data-${localYMD()}.json`;
    const blob = new Blob([JSON.stringify(document, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    window.document.body.appendChild(a);
    a.click();
    a.remove();
    // Give the browser a moment to start the download before releasing it.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return { ok: true, filename };
  } catch {
    return { ok: false };
  }
}

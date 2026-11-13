// Delete account — the client half of the delete-account Edge Function
// (supabase/functions/delete-account, stage 2; its guard is migration 0037).
//
// The function identifies the caller from THEIR OWN session token, which
// supabase.functions.invoke attaches; nothing here sends a user id.
//
// Outcomes the UI distinguishes:
//   ok                         200 — account and owned workspaces are gone.
//   transfer_ownership_first   409 — an owned workspace has other members;
//                              nothing was deleted.
//   failed                     anything else, including a network failure and
//                              the function's retry-safe 500s. Retrying is safe:
//                              the workspace step is idempotent.
//
// Non-2xx detection: functions-js throws FunctionsHttpError with the raw
// Response as `context` (@supabase/functions-js FunctionsClient.js:268-269,
// types.js:17-20 — checked in the installed package 2026-11-12).

import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from './supabase';

export type DeleteAccountResult =
  | { ok: true; workspacesDeleted: number; eventsDeleted: number }
  | { ok: false; reason: 'transfer_ownership_first' | 'failed' };

export async function deleteAccount(): Promise<DeleteAccountResult> {
  try {
    const { data, error } = await supabase.functions.invoke<{
      workspaces_deleted: number;
      events_deleted: number;
    }>('delete-account', { method: 'POST' });

    if (!error) {
      return {
        ok: true,
        workspacesDeleted: data?.workspaces_deleted ?? 0,
        eventsDeleted: data?.events_deleted ?? 0,
      };
    }

    if (error instanceof FunctionsHttpError) {
      const res = error.context as Response;
      if (res.status === 409) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        if (body?.error === 'transfer_ownership_first') {
          return { ok: false, reason: 'transfer_ownership_first' };
        }
      }
    }
    return { ok: false, reason: 'failed' };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}

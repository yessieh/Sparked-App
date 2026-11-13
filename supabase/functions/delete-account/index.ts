// delete-account — account deletion, stage 2 (stage 1 is migration 0037).
//
// SEQUENCE (locked by Jas, 2026-11-12):
//   1. Identify the caller from THEIR OWN access token, verified server-side
//      by Supabase Auth (auth.getUser). A user id in the body is never read.
//   2. As service_role: public.delete_account_workspaces({ user_id }) — the
//      0037 guard. Refuses with `transfer_ownership_first` if an owned
//      workspace has other members (→ 409, nothing else done); otherwise
//      hard-deletes every owned workspace and its events.
//   3. Only after 2 succeeded: auth.admin.deleteUser(user_id). auth.users →
//      profiles cascades (0001); profiles → memberships / saves / rsvps /
//      category_preferences cascade; the Curbside ledger row survives with
//      user_id NULL (0018). created_by on any workspace the user created but
//      no longer owns is SET NULL (0037).
//   Steps 2 and 3 are not one transaction. If 3 fails, the caller gets a 500
//   telling them to retry: step 2 is idempotent (a second call returns 0 / 0).
//
// PRIVACY: logs carry an outcome code only — never a token, an email, a user
// id or the request body.
//
// ENV (provided by the Edge runtime, not set by us):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY — UNVERIFIED that this project's runtime still
//     injects the legacy service-role key under this name (Supabase is moving
//     to `sb_secret_…` API keys). Settled by the first deployed call: a missing
//     key returns 500 `server_misconfigured` and logs that code.
//
// CORS: only http://localhost:8081 today. The production origin is a tracked
// follow-up — never a wildcard on an endpoint that deletes accounts.

import { createClient } from 'npm:@supabase/supabase-js@2.110.1';

const ALLOWED_ORIGINS = new Set(['http://localhost:8081']);

function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    Vary: 'Origin',
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

function respond(
  status: number,
  body: Record<string, unknown>,
  origin: string | null,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });
}

function logOutcome(outcome: string): void {
  console.log(JSON.stringify({ fn: 'delete-account', outcome }));
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== 'POST') {
    logOutcome('method_not_allowed');
    return respond(405, { error: 'method_not_allowed' }, origin);
  }

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) {
    logOutcome('server_misconfigured');
    return respond(500, { error: 'server_misconfigured' }, origin);
  }

  // 1. WHO IS CALLING — from their own token, verified by Supabase Auth.
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : '';
  if (!token) {
    logOutcome('unauthorized_no_token');
    return respond(401, { error: 'unauthorized' }, origin);
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  const userId = userData?.user?.id;
  if (userError || !userId) {
    logOutcome('unauthorized_invalid_token');
    return respond(401, { error: 'unauthorized' }, origin);
  }

  // 2. THE GUARD + WORKSPACE CLEANUP (0037), as service_role.
  const { data: summary, error: guardError } = await admin
    .rpc('delete_account_workspaces', { user_id: userId })
    .single<{ workspaces_deleted: number; events_deleted: number }>();

  if (guardError) {
    if (guardError.message === 'transfer_ownership_first') {
      logOutcome('refused_transfer_ownership_first');
      return respond(409, { error: 'transfer_ownership_first' }, origin);
    }
    logOutcome('guard_failed');
    return respond(500, { error: 'delete_failed', retry: true }, origin);
  }

  // 3. THE LOGIN ACCOUNT — only after the guard succeeded.
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    logOutcome('auth_delete_failed');
    return respond(
      500,
      {
        error: 'delete_incomplete',
        retry: true,
        message: 'Your workspaces were removed but the account was not. Please try again.',
      },
      origin,
    );
  }

  logOutcome('deleted');
  return respond(
    200,
    {
      workspaces_deleted: summary?.workspaces_deleted ?? 0,
      events_deleted: summary?.events_deleted ?? 0,
    },
    origin,
  );
});

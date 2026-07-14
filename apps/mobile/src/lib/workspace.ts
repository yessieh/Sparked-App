// Workspace plumbing for the create flows.
// Locked architecture: events belong to a WORKSPACE; every host workspace
// starts with exactly one owner membership, created silently — the UI never
// shows any of this. The workspace name defaults to the user's display name
// (it IS the organizer name on their posts; the Workspace editor lets hosts
// rename it later).

import { supabase } from './supabase';

export const CURBSIDE_QUOTA = 3;

export async function getOwnWorkspaceId(): Promise<string | null> {
  const { data, error } = await supabase
    .from('memberships')
    .select('workspace_id')
    .limit(1);
  if (error) throw new Error(error.message);
  return data[0]?.workspace_id ?? null;
}

/** Returns the user's workspace id, creating workspace + owner membership
 * (via the 0001 trigger) on first use. */
export async function getOrCreateWorkspace(userId: string, displayName: string): Promise<string> {
  const existing = await getOwnWorkspaceId();
  if (existing) return existing;
  const { data, error } = await supabase
    .from('workspaces')
    .insert({ name: displayName, created_by: userId })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

/** Non-draft Curbside posts in the rolling 100-day window (0008 RPC;
 * member-scoped — null from the server means "not yours to see"). */
export async function curbsidePostsUsed(workspaceId: string): Promise<number> {
  const { data, error } = await supabase.rpc('curbside_posts_used', { ws: workspaceId });
  if (error) throw new Error(error.message);
  return (data as number | null) ?? 0;
}

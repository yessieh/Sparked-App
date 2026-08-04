// Workspace plumbing for the create flows + the host read path (Me hub /
// Workspace screens consume it; those screens are a later prompt).
// Locked architecture: events belong to a WORKSPACE; every host workspace
// starts with exactly one owner membership, created silently — the UI never
// shows any of this. The workspace name defaults to the user's display name
// (it IS the organizer name on their posts; the Workspace editor lets hosts
// rename it later).

import { useCallback, useEffect, useState } from 'react';

import { useAuth } from './auth';
import { supabase } from './supabase';

/** Free Curbside posts per rolling 100-day window. Mirrors the server gate in
 * migration 0016 — this constant is DISPLAY ONLY; `app.enforce_curbside_quota`
 * is the enforcement. Changing it here changes copy, not rules. */
export const CURBSIDE_QUOTA = 1;

/** Max consecutive calendar days a Curbside post may span (0016). The picker
 * caps the end date at start + CURBSIDE_MAX_DAYS - 1. */
export const CURBSIDE_MAX_DAYS = 3;

export type WorkspaceRole = 'owner' | 'editor' | 'viewer';

/** A workspace the signed-in user belongs to. `role` comes from the membership
 * row. Host-facing fields only — NEVER `created_by` (a raw auth user id, and
 * unreadable by clients as of 0015 anyway). */
export interface Workspace {
  id: string;
  name: string;
  role: WorkspaceRole;
  bio: string | null;
  location_text: string | null;
  website: string | null;
  socials: Record<string, string>;
  logo_path: string | null;
}

/** The four numbers `workspace_stats` (0015) returns. */
export interface WorkspaceStats {
  active_listings: number;
  upcoming_events: number;
  total_rsvps: number;
  total_saves: number;
}

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

/**
 * Free Curbside posts the SIGNED-IN USER has consumed in the rolling 100-day
 * window (0018 RPC — no arguments, because you can only ever be asking about
 * yourself).
 *
 * Reads the immutable consumption ledger, NOT live event rows, and is keyed on
 * the person rather than a workspace. Both halves matter: counting events let a
 * host delete the post to refund the free lane, and workspace-keying let them
 * delete the whole workspace and get another one (Architecture Decision 8).
 * This calls the same `app.curbside_credits_used` the insert trigger enforces
 * with, so the conversion screen and the server cannot disagree.
 */
export async function curbsidePostsUsed(): Promise<number> {
  const { data, error } = await supabase.rpc('curbside_posts_used');
  if (error) throw new Error(error.message);
  return (data as number | null) ?? 0;
}

// PostgREST embed row: memberships (own-rows RLS → only mine) joined to its
// workspace. Explicit column list, so created_by never rides along.
interface MembershipRow {
  role: WorkspaceRole;
  workspace: Omit<Workspace, 'role'> | null;
}

/**
 * The signed-in user's workspace(s), read through `memberships` (own-rows RLS —
 * the membership table IS the authorization, so no workspace the user doesn't
 * belong to can appear). Returns an ARRAY even though every MVP user has
 * exactly one: the dormant multi-workspace picker depends on this shape. `null`
 * means none (signed out, or signed in with no workspace yet).
 */
export function useMyWorkspace(): {
  workspaces: Workspace[] | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [workspaces, setWorkspaces] = useState<Workspace[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setWorkspaces(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: err } = await supabase
      .from('memberships')
      .select('role, workspace:workspaces(id,name,bio,location_text,website,socials,logo_path)')
      .order('created_at', { ascending: true });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    const rows = ((data ?? []) as unknown as MembershipRow[])
      .filter((m): m is MembershipRow & { workspace: Omit<Workspace, 'role'> } => m.workspace !== null)
      .map((m) => ({ ...m.workspace, role: m.role }));
    setError(null);
    setWorkspaces(rows.length ? rows : null); // null when none (per the read contract)
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { workspaces, loading, error, refresh };
}

/**
 * The four workspace stats (0015 `workspace_stats` RPC). Returns `null` when
 * the caller is not a member of `workspaceId` — the RPC yields an empty result
 * set for non-members (member-scoped by design), never an error.
 */
export async function fetchWorkspaceStats(workspaceId: string): Promise<WorkspaceStats | null> {
  const { data, error } = await supabase.rpc('workspace_stats', { workspace_id: workspaceId });
  if (error) throw new Error(error.message);
  return (data as WorkspaceStats[] | null)?.[0] ?? null;
}

/** Per-event RSVP + save counts for one workspace's PUBLISHED events (0017).
 * Keyed by event id. Server-side by necessity: `saves` is own-rows RLS, so a
 * client can only ever count its own save. Non-members get an empty map, never
 * an error — same contract as {@link fetchWorkspaceStats}. */
export async function fetchWorkspaceEventStats(
  workspaceId: string,
): Promise<Map<string, { rsvps: number; saves: number }>> {
  const { data, error } = await supabase.rpc('workspace_event_stats', {
    workspace_id: workspaceId,
  });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as { event_id: string; rsvp_count: number; save_count: number }[];
  return new Map(rows.map((r) => [r.event_id, { rsvps: r.rsvp_count, saves: r.save_count }]));
}

/**
 * Permanently deletes a workspace and, by FK cascade, every event it owns plus
 * those events' saves, RSVPs, categories and vendors (0017). OWNER ONLY — the
 * RPC raises `not_an_owner` rather than silently doing nothing, because a
 * destructive call that no-ops is worse than one that complains.
 *
 * Returns the number of events deleted (all statuses, drafts included).
 * There is no undo and nothing is soft-deleted.
 */
export async function deleteWorkspace(workspaceId: string): Promise<number> {
  const { data, error } = await supabase.rpc('delete_workspace', {
    workspace_id: workspaceId,
  });
  if (error) throw new Error(error.message);
  return (data as number | null) ?? 0;
}

/** The four social platforms the public profile offers, in display order.
 * FIXED SET, not free-form: the profile renders the KEY as a visible button
 * label, so an arbitrary key would be arbitrary copy on a public page. The RPC
 * rejects anything outside this list (0024). */
export const SOCIAL_FIELDS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'x', label: 'X' },
] as const;

/** Editable public-profile fields. `logo_path` is absent on purpose — there is
 * no storage bucket behind it, so it is not editable yet. */
export interface WorkspaceProfileInput {
  name: string;
  bio: string | null;
  location_text: string | null;
  website: string | null;
  socials: Record<string, string>;
}

/**
 * Updates the workspace's PUBLIC profile (0024). OWNER or EDITOR — a viewer is
 * a member and is still rejected, with `not_an_editor`.
 *
 * This is the ONLY write path to `workspaces` that exists: 0024 revoked UPDATE
 * from `authenticated`, so validation (name required, length caps, the fixed
 * social key set) cannot be bypassed by PATCHing the table directly the way an
 * owner could before.
 */
export async function updateWorkspaceProfile(
  workspaceId: string,
  input: WorkspaceProfileInput,
): Promise<void> {
  const { error } = await supabase.rpc('update_workspace_profile', {
    workspace_id: workspaceId,
    name: input.name,
    bio: input.bio,
    location_text: input.location_text,
    website: input.website,
    socials: input.socials,
  });
  if (error) throw new Error(error.message);
}

/**
 * Soft-deletes a single event (0019 — Architecture Decision 8). Irreversible
 * to the host. The event is hidden from all read paths and survives 90 days for
 * auditing, then hard-purged by a job.
 *
 * MEMBER ONLY (owner/editor).
 */
export async function deleteEvent(eventId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_event', { event_id: eventId });
  if (error) throw new Error(error.message);
}

/**
 * Archive a single event (0019 — reversible). The event disappears from all
 * PUBLIC surfaces (feed, search, detail, Saved, Organizer Profile) but remains
 * visible to the workspace members in Workspace.
 *
 * MEMBER ONLY (owner/editor).
 */
export async function archiveEvent(eventId: string): Promise<void> {
  const { error } = await supabase.rpc('archive_event', { event_id: eventId });
  if (error) throw new Error(error.message);
}

/**
 * Unarchive a single event (0019 — reversible archive).
 *
 * MEMBER ONLY (owner/editor).
 */
export async function unarchiveEvent(eventId: string): Promise<void> {
  const { error } = await supabase.rpc('unarchive_event', { event_id: eventId });
  if (error) throw new Error(error.message);
}

/** Hook form of {@link fetchWorkspaceStats}. Pass `null` to hold off (e.g.
 * before the workspace id is known); re-fetches when the id changes. */
export function useWorkspaceStats(workspaceId: string | null): {
  stats: WorkspaceStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!workspaceId) {
      setStats(null);
      return;
    }
    setLoading(true);
    try {
      setStats(await fetchWorkspaceStats(workspaceId));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, loading, error, refresh };
}

// Workspace — the host surface. Reached from the Me hub's stats card.
//
// Top to bottom: header (back + WORKSPACE eyebrow + name, carried over from the
// stub) · ACTIVE/UPCOMING stat tiles · "+ New event" · the workspace's PUBLISHED
// listings, ended ones collapsed into "Past · N" · a muted destructive
// "Delete event(s) & Workspace" row.
//
// COORDINATOR SURFACE (responsive lock): built mobile-first, structured
// desktop-worthy — the column widens past `breakpoints.desktop` and the
// listings go two-across. Nothing is gated at any width; the full desktop batch
// runs once, at the end, across all coordinator screens.
//
// DATA (0017 + existing spine):
//   • Listings — a direct `events` select. No RPC needed: events_select_public
//     (0001) already exposes every row of a workspace to its members, and
//     0011's column grants cover everything the card renders. Filtered to
//     status='published' — drafts and pending_payment are out of scope here.
//   • Per-event RSVP/save chips — `workspace_event_stats` (0017), because
//     `saves` is own-rows RLS and a client can only count its own save.
//   • Delete — `delete_workspace` (0017), definer + owner-only; the FK cascade
//     is what actually removes the events from everyone's Saved lists.
//
// Anonymous curbside posts appear here under the real workspace name: the 0009
// mask is a CONSUMER display rule, and hiding a host's own listing from them
// would be a bug, not privacy.

import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { GradientButton } from '../../components/AuthControls';
import EventStub, { type FeedEvent } from '../../components/EventStub';
import { hasEnded } from '../../lib/eventTime';
import { supabase } from '../../lib/supabase';
import {
  archiveEvent,
  deleteEvent,
  deleteWorkspace,
  fetchWorkspaceEventStats,
  unarchiveEvent,
  useMyWorkspace,
  useWorkspaceStats,
  type Workspace,
} from '../../lib/workspace';
import { brand, breakpoints, useTheme } from '../../theme';

type Theme = ReturnType<typeof useTheme>;

/** The host-facing columns of one of the workspace's own events. No
 * `workspaces(name)` join — we already hold the workspace. No
 * `publish_fee_cents` — the card is consumer-facing data only (locked). */
interface WorkspaceEventRow {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  venue_name: string | null;
  entry_fee_cents: number;
  rsvp_count: number;
  deleted_at: string | null;
  archived_at: string | null;
  event_categories: { category_id: string }[];
}

const EVENT_COLUMNS =
  'id,title,starts_at,ends_at,venue_name,entry_fee_cents,rsvp_count,deleted_at,archived_at,event_categories(category_id)';

type Counts = Map<string, { rsvps: number; saves: number }>;

// ---------------------------------------------------------------------------
// Header — back chip + eyebrow + title. Carried over from the stub unchanged
// except for `onBack`, which the picker needs (see the multi-workspace note).
// ---------------------------------------------------------------------------
function Header({ theme, title, onBack }: { theme: Theme; title: string; onBack: () => void }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 12,
      }}
    >
      <Pressable
        onPress={onBack}
        accessibilityLabel="Back"
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.iconChipBg,
          borderWidth: 1,
          borderColor: theme.colors.cardBorder,
        }}
      >
        <Ionicons name="arrow-back" size={16} color={theme.colors.text} />
      </Pressable>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontFamily: theme.fonts.bodySemiBold,
            fontSize: theme.fontSizes.eyebrow,
            fontWeight: '900',
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: brand.brightOrange,
          }}
        >
          Workspace
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: theme.fonts.displayBlack,
            fontWeight: '900',
            fontSize: 22,
            letterSpacing: -0.22,
            color: theme.colors.text,
            marginTop: 2,
          }}
        >
          {title}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stats — the Me hub card's two numbers (`workspace_stats`, 0015), given a
// full screen's worth of room: one surface per stat instead of two tiles
// sharing a card. Informational, so no gradient. Both always render, zero
// included — a real 0 is information, and a new host should see the shape of
// what they're working toward.
// ---------------------------------------------------------------------------
function StatTile({
  theme,
  value,
  label,
  loading,
}: {
  theme: Theme;
  value: number | null;
  label: string;
  loading: boolean;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.cardBg,
        borderWidth: 1,
        borderColor: theme.colors.cardBorder,
        borderRadius: 20,
        paddingVertical: 20,
        paddingHorizontal: 16,
        alignItems: 'center',
      }}
    >
      {loading || value === null ? (
        <View
          style={{ width: 38, height: 34, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)' }}
        />
      ) : (
        <Text
          style={{
            fontFamily: theme.fonts.displayBlack,
            fontWeight: '900',
            fontSize: 34,
            lineHeight: 34,
            letterSpacing: -0.5,
            color: theme.colors.text,
          }}
        >
          {value}
        </Text>
      )}
      <Text
        style={{
          fontFamily: theme.fonts.bodySemiBold,
          fontSize: 10,
          fontWeight: '800',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: theme.colors.textFaint,
          marginTop: 9,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Multi-workspace picker — WIRED BUT DORMANT. Every MVP host has exactly one
// workspace, and at exactly 1 this never renders: the single workspace loads
// directly and a solo host never learns the concept exists (architecture lock
// #3). It appears only when earned.
//
// Each row pulls its OWN stats, so the counts are per-workspace isolated. That
// is N calls for N workspaces — acceptable precisely because N is 2 or 3 by
// the time anyone sees this, and the alternative (a multi-workspace stats RPC)
// would be a schema addition for a dormant path.
// ---------------------------------------------------------------------------
function PickerRow({
  theme,
  workspace,
  onPress,
}: {
  theme: Theme;
  workspace: Workspace;
  onPress: () => void;
}) {
  const { stats, loading } = useWorkspaceStats(workspace.id);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={workspace.name}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: pressed ? theme.colors.surfaceHover : theme.colors.cardBg,
        borderWidth: 1,
        borderColor: theme.colors.cardBorder,
        borderRadius: theme.radii.lg,
        paddingHorizontal: 16,
        paddingVertical: 15,
      })}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: theme.fonts.displayBlack,
            fontWeight: '900',
            fontSize: 15,
            letterSpacing: -0.15,
            color: theme.colors.text,
          }}
        >
          {workspace.name}
        </Text>
        <Text
          style={{
            fontFamily: theme.fonts.bodyMedium,
            fontSize: 12,
            color: theme.colors.textMuted,
            marginTop: 3,
          }}
        >
          {loading || !stats
            ? '—'
            : `${stats.active_listings} active · ${stats.upcoming_events} upcoming`}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.colors.textFaint} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Delete confirmation.
//
// A custom Modal, NOT Alert.alert: multi-button Alert is a no-op on
// react-native-web, and this app runs Expo web. The copy states the three
// consequences plainly — every event, everyone's Saved lists, no undo — because
// the FK cascade behind it really is that wide.
// ---------------------------------------------------------------------------
function DeleteConfirm({
  theme,
  workspaceName,
  visible,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  theme: Theme;
  workspaceName: string;
  visible: boolean;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        {/* Backdrop is a SIBLING behind the dialog, not a wrapper around it.
            Nesting would have made every tap inside the dialog dismiss it on
            web — RN-web clicks bubble to parent Pressables (native's responder
            system doesn't), the same platform split the Me hub's Saved card
            hit. A sibling has nothing to bubble into. */}
        <Pressable
          onPress={busy ? undefined : onCancel}
          accessibilityLabel="Dismiss"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(3,8,20,0.72)',
          }}
        />
        <View
          style={{
            width: '100%',
            maxWidth: 400,
            backgroundColor: theme.colors.bgDeep,
            borderWidth: 1,
            borderColor: theme.colors.cardBorder,
            borderRadius: theme.radii.xxxl,
            padding: 22,
            boxShadow: theme.shadows.elevated,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(239,68,68,0.10)',
                borderWidth: 1,
                borderColor: 'rgba(239,68,68,0.28)',
              }}
            >
              <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
            </View>
            <Text
              style={{
                flex: 1,
                fontFamily: theme.fonts.displayBlack,
                fontWeight: '900',
                fontSize: 18,
                letterSpacing: -0.18,
                color: theme.colors.text,
              }}
            >
              Delete this workspace?
            </Text>
          </View>

          <Text
            style={{
              fontFamily: theme.fonts.bodyMedium,
              fontSize: 13,
              lineHeight: 20,
              color: theme.colors.textMuted,
              marginTop: 16,
            }}
          >
            This permanently deletes {workspaceName} and all of its events, including any
            drafts. They will be removed from everyone's Saved lists. This cannot be
            undone.
          </Text>

          {error && (
            <Text
              style={{
                fontFamily: theme.fonts.bodyMedium,
                fontSize: 12.5,
                lineHeight: 18,
                color: theme.colors.danger,
                marginTop: 12,
              }}
            >
              Couldn't delete: {error}
            </Text>
          )}

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            <Pressable
              onPress={onCancel}
              disabled={busy}
              accessibilityRole="button"
              style={({ pressed }) => ({
                flex: 1,
                borderRadius: theme.radii.lg,
                borderWidth: 1,
                borderColor: theme.colors.borderStrong,
                backgroundColor: pressed ? theme.colors.surfaceHover : 'transparent',
                paddingVertical: 14,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: busy ? 0.5 : 1,
              })}
            >
              <Text
                style={{
                  fontFamily: theme.fonts.displayExtraBold,
                  fontWeight: '800',
                  fontSize: 14,
                  color: theme.colors.text,
                }}
              >
                Cancel
              </Text>
            </Pressable>
            {/* Destructive confirm — danger-tinted, NEVER gradient. The
                gradient is reserved for actions a host wants to take. */}
            <Pressable
              onPress={onConfirm}
              disabled={busy}
              accessibilityRole="button"
              style={({ pressed }) => ({
                flex: 1,
                borderRadius: theme.radii.lg,
                borderWidth: 1,
                borderColor: 'rgba(239,68,68,0.55)',
                backgroundColor: pressed ? 'rgba(239,68,68,0.26)' : 'rgba(239,68,68,0.16)',
                paddingVertical: 14,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: busy ? 0.6 : 1,
              })}
            >
              {busy ? (
                <ActivityIndicator color={theme.colors.danger} />
              ) : (
                <Text
                  style={{
                    fontFamily: theme.fonts.displayExtraBold,
                    fontWeight: '800',
                    fontSize: 14,
                    color: theme.colors.danger,
                  }}
                >
                  Delete everything
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// The selected workspace's content.
// ---------------------------------------------------------------------------
function WorkspaceDetail({
  workspace,
  onBackToPicker,
}: {
  workspace: Workspace;
  onBackToPicker: (() => void) | null;
}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= breakpoints.desktop;

  const { stats, loading: statsLoading, refresh: refreshStats } = useWorkspaceStats(workspace.id);
  const [rows, setRows] = useState<WorkspaceEventRow[] | null>(null);
  const [counts, setCounts] = useState<Counts>(new Map());
  const [error, setError] = useState<string | null>(null);
  // Session-only, collapsed by default — the same contract as Saved's Past
  // section. Nothing is persisted; reopening the screen starts collapsed.
  const [pastOpen, setPastOpen] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // Event action menu — which event (if any) is showing the ⋯ menu.
  const [actionEventId, setActionEventId] = useState<string | null>(null);
  // Delete confirmation — which event (if any) is being deleted.
  const [eventToDelete, setEventToDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleteEventLoading, setDeleteEventLoading] = useState(false);

  const workspaceId = workspace.id;

  const load = useCallback(async () => {
    // Listings and their counts are two reads, fired together: the events rows
    // come straight off the table (member RLS), the counts must come from the
    // definer RPC. A counts failure degrades to no chips rather than no
    // listings — the tally is secondary to the list itself.
    const [eventsRes, countsRes] = await Promise.all([
      supabase
        .from('events')
        .select(EVENT_COLUMNS)
        .eq('workspace_id', workspaceId)
        .eq('status', 'published')
        .is('deleted_at', null)
        .order('starts_at', { ascending: true }),
      fetchWorkspaceEventStats(workspaceId).catch((e: unknown) =>
        e instanceof Error ? e : new Error(String(e)),
      ),
    ]);
    if (eventsRes.error) {
      setError(eventsRes.error.message);
      return;
    }
    setRows(eventsRes.data as unknown as WorkspaceEventRow[]);
    if (countsRes instanceof Error) {
      setCounts(new Map());
      setError(countsRes.message);
    } else {
      setCounts(countsRes);
      setError(null);
    }
  }, [workspaceId]);

  // Focus refresh, never polling (architecture lock #4): a host lands back here
  // straight from publishing, and the new listing has to be there.
  useFocusEffect(
    useCallback(() => {
      load();
      refreshStats();
    }, [load, refreshStats]),
  );

  const { upcoming, past, archived } = useMemo(() => {
    const up: FeedEvent[] = [];
    const done: FeedEvent[] = [];
    const arch: FeedEvent[] = [];
    for (const r of rows ?? []) {
      const event: FeedEvent = {
        id: r.id,
        title: r.title,
        // The host's own view is never anonymized — 0009's mask is a consumer
        // rule. Their curbside posts read under their own workspace name here.
        organizer_name: workspace.name,
        starts_at: r.starts_at,
        ends_at: r.ends_at,
        venue_name: r.venue_name,
        entry_fee_cents: r.entry_fee_cents,
        // Carried so the chips can fall back to the public counter if the
        // stats RPC is the thing that failed (see `renderStubs`).
        rsvp_count: r.rsvp_count,
        categories: r.event_categories.map((c) => c.category_id),
      };
      // Archived events go into their own section (0019).
      if (r.archived_at) {
        arch.push(event);
      } else if (hasEnded(r.starts_at, r.ends_at)) {
        // Same util the card's countdown chip renders from, so the Past header
        // and the chip inside it can never disagree. Live events are NOT past.
        done.push(event);
      } else {
        up.push(event);
      }
    }
    // Rows arrive starts_at ASCENDING: upcoming is already soonest-first, and
    // the reverse puts "just finished" at the top of Past. Matches Saved.
    // Archived stays in arrival order.
    return { upcoming: up, past: done.reverse(), archived: arch };
  }, [rows, workspace.name]);

  const onConfirmDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteWorkspace(workspaceId);
      // Me refetches its workspace read on focus, so it shows the dashed
      // invitation again on arrival. replace(), not push() — the workspace this
      // stack was showing no longer exists to go back to.
      router.replace('/(tabs)/me');
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : String(e));
      setDeleting(false);
    }
  };

  const onArchiveEvent = async (eventId: string) => {
    setActionEventId(null);
    try {
      await archiveEvent(eventId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const onUnarchiveEvent = async (eventId: string) => {
    setActionEventId(null);
    try {
      await unarchiveEvent(eventId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const onConfirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    setDeleteEventLoading(true);
    try {
      await deleteEvent(eventToDelete.id);
      setEventToDelete(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setDeleteEventLoading(false);
    }
  };

  // Listings go two-across on a desktop-width coordinator screen; one column on
  // a phone. Below the breakpoint this resolves to the plain stacked list.
  const listRow = {
    flexDirection: isDesktop ? ('row' as const) : ('column' as const),
    flexWrap: 'wrap' as const,
    gap: 16,
  };
  const listItem = { width: isDesktop ? ('48%' as const) : ('100%' as const) };

  const renderStubs = (items: FeedEvent[], isArchived: boolean = false) => (
    <View style={listRow}>
      {items.map((e) => (
        <View key={e.id} style={[listItem, { position: 'relative' }]}>
          <EventStub
            event={e}
            variant="compact"
            counts={counts.get(e.id) ?? { rsvps: e.rsvp_count ?? 0, saves: 0 }}
            onTap={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })}
          />
          {/* Overflow menu button — top-right corner. */}
          <Pressable
            onPress={() => setActionEventId(actionEventId === e.id ? null : e.id)}
            accessibilityLabel="Event actions"
            accessibilityRole="button"
            // bgDeep, not a translucent black: this button sits on card art,
            // and the palette names bgDeep as the overlay token precisely
            // because it is OPAQUE in both modes (#0f1a30 / #ffffff). The
            // previous rgba(0,0,0,0.5) was both a raw color and unreadable over
            // a light image. borderStrong gives it an edge against busy art.
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: theme.colors.bgDeep,
              borderWidth: 1,
              borderColor: theme.colors.borderStrong,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: 'bold' }}>⋯</Text>
          </Pressable>
          {/* Action menu — appears when the event's action button is pressed. */}
          {actionEventId === e.id && (
            <View
              // Same reasoning as the button, and this is the one that was
              // actually broken: cardBg is rgba(255,255,255,0.04) in dark mode
              // — 4% white, which over card art is a menu you can see straight
              // through. A floating surface needs an opaque one.
              style={{
                position: 'absolute',
                top: 44,
                right: 8,
                backgroundColor: theme.colors.bgDeep,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: theme.colors.borderStrong,
                zIndex: 10,
                minWidth: 140,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              {isArchived ? (
                <Pressable
                  onPress={() => onUnarchiveEvent(e.id)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.divider,
                  }}
                >
                  <Text style={{ fontSize: 13, color: theme.colors.text }}>Unarchive</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => onArchiveEvent(e.id)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.divider,
                  }}
                >
                  <Text style={{ fontSize: 13, color: theme.colors.text }}>Archive</Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => {
                  setEventToDelete({ id: e.id, title: e.title });
                  setActionEventId(null);
                }}
                style={{ paddingHorizontal: 12, paddingVertical: 10 }}
              >
                <Text style={{ fontSize: 13, color: theme.colors.danger }}>Delete</Text>
              </Pressable>
            </View>
          )}
        </View>
      ))}
    </View>
  );

  return (
    <>
      <Header
        theme={theme}
        title={workspace.name}
        onBack={() => {
          if (onBackToPicker) onBackToPicker();
          else if (router.canGoBack()) router.back();
          else router.replace('/(tabs)/me');
        }}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: 48,
          maxWidth: isDesktop ? 880 : 560,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <StatTile
            theme={theme}
            value={stats?.active_listings ?? null}
            label="Active"
            loading={statsLoading}
          />
          <StatTile
            theme={theme}
            value={stats?.upcoming_events ?? null}
            label="Upcoming"
            loading={statsLoading}
          />
        </View>

        {/* Primary host action — gradient, per the CTA hierarchy. */}
        <View style={{ marginTop: 16 }}>
          <GradientButton onPress={() => router.push('/create')}>+ New event</GradientButton>
        </View>

        {/* Listings */}
        <View style={{ marginTop: 30 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Text
              style={{
                fontFamily: theme.fonts.displayBlack,
                fontWeight: '900',
                fontSize: 13,
                letterSpacing: 1.8,
                textTransform: 'uppercase',
                color: brand.brightOrange,
              }}
            >
              Listings
            </Text>
            {upcoming.length > 0 && (
              <Text
                style={{
                  fontFamily: theme.fonts.displayExtraBold,
                  fontSize: 11,
                  color: theme.colors.textFaint,
                }}
              >
                {upcoming.length}
              </Text>
            )}
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(252,163,17,0.25)' }} />
          </View>

          {error && (
            <Text
              style={{
                fontFamily: theme.fonts.bodyMedium,
                fontSize: 13,
                lineHeight: 19,
                color: theme.colors.danger,
                marginBottom: 14,
              }}
            >
              Couldn't load your listings: {error}
            </Text>
          )}

          {rows === null ? (
            <View style={{ paddingVertical: 36, alignItems: 'center' }}>
              <ActivityIndicator color={brand.brightOrange} />
            </View>
          ) : rows.length === 0 ? (
            // Empty state — stats and CTA stay above, the delete row stays
            // below. Only the list itself goes quiet.
            <Text
              style={{
                fontFamily: theme.fonts.bodyMedium,
                fontSize: 13,
                color: theme.colors.textFaint,
                paddingVertical: 8,
              }}
            >
              No published events yet.
            </Text>
          ) : (
            <View style={{ gap: 26 }}>
              {upcoming.length > 0 && renderStubs(upcoming)}

              {/* PAST — always last, collapsed by default, muted rather than
                  brand-orange: an archive drawer, not a section competing for
                  attention. Same pattern as Saved. */}
              {past.length > 0 && (
                <View>
                  <Pressable
                    onPress={() => setPastOpen((o) => !o)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: pastOpen }}
                    accessibilityLabel={`Past, ${past.length} ${past.length === 1 ? 'event' : 'events'}`}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      paddingVertical: 6,
                      marginBottom: pastOpen ? 13 : 0,
                      opacity: pressed ? 0.6 : 1,
                    })}
                  >
                    <Text
                      style={{
                        fontFamily: theme.fonts.displayBlack,
                        fontWeight: '900',
                        fontSize: 13,
                        letterSpacing: 1.8,
                        textTransform: 'uppercase',
                        color: theme.colors.textMuted,
                      }}
                    >
                      Past
                    </Text>
                    <Text
                      style={{
                        fontFamily: theme.fonts.displayExtraBold,
                        fontSize: 11,
                        color: theme.colors.textFaint,
                      }}
                    >
                      {past.length}
                    </Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.divider }} />
                    <Ionicons
                      name={pastOpen ? 'chevron-up' : 'chevron-down'}
                      size={15}
                      color={theme.colors.textFaint}
                    />
                  </Pressable>
                  {pastOpen && renderStubs(past)}
                </View>
              )}

              {/* ARCHIVED (0019) — reversible archive. Same collapse pattern as Past.
                  Archived events have their own section after Past. */}
              {archived.length > 0 && (
                <View>
                  <Pressable
                    onPress={() => setArchivedOpen((o) => !o)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: archivedOpen }}
                    accessibilityLabel={`Archived, ${archived.length} ${archived.length === 1 ? 'event' : 'events'}`}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      paddingVertical: 6,
                      marginBottom: archivedOpen ? 13 : 0,
                      opacity: pressed ? 0.6 : 1,
                    })}
                  >
                    <Text
                      style={{
                        fontFamily: theme.fonts.displayBlack,
                        fontWeight: '900',
                        fontSize: 13,
                        letterSpacing: 1.8,
                        textTransform: 'uppercase',
                        color: theme.colors.textMuted,
                      }}
                    >
                      Archived
                    </Text>
                    <Text
                      style={{
                        fontFamily: theme.fonts.displayExtraBold,
                        fontSize: 11,
                        color: theme.colors.textFaint,
                      }}
                    >
                      {archived.length}
                    </Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.divider }} />
                    <Ionicons
                      name={archivedOpen ? 'chevron-up' : 'chevron-down'}
                      size={15}
                      color={theme.colors.textFaint}
                    />
                  </Pressable>
                  {archivedOpen && renderStubs(archived, true)}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Delete — muted destructive, trash icon, never gradient. Renders in
            every state including the empty one. Owner-only: editors can write
            events, but ending the business is not theirs (the RPC enforces it
            too; this just doesn't offer what it would refuse). */}
        {workspace.role === 'owner' && (
          <View style={{ marginTop: 34 }}>
            <View style={{ height: 1, backgroundColor: theme.colors.divider, marginBottom: 18 }} />
            <Pressable
              onPress={() => {
                setDeleteError(null);
                setConfirmOpen(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Delete events and workspace"
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                borderWidth: 1,
                borderColor: 'rgba(239,68,68,0.22)',
                backgroundColor: pressed ? 'rgba(239,68,68,0.08)' : 'transparent',
                borderRadius: theme.radii.lg,
                paddingHorizontal: 16,
                paddingVertical: 14,
              })}
            >
              <Ionicons name="trash-outline" size={16} color={theme.colors.danger} />
              <Text
                style={{
                  flex: 1,
                  fontFamily: theme.fonts.bodySemiBold,
                  fontSize: theme.fontSizes.bodySm,
                  fontWeight: '700',
                  color: theme.colors.danger,
                }}
              >
                Delete event(s) & Workspace
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <DeleteConfirm
        theme={theme}
        workspaceName={workspace.name}
        visible={confirmOpen}
        busy={deleting}
        error={deleteError}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={onConfirmDelete}
      />

      {/* Delete event confirmation (0019) — same pattern as workspace delete but
          for a single event. Irreversible soft delete. */}
      <Modal
        animationType="fade"
        transparent
        visible={eventToDelete !== null}
        onRequestClose={() => setEventToDelete(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 16,
          }}
        >
          <View
            style={{
              backgroundColor: theme.colors.cardBg,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.colors.cardBorder,
              padding: 24,
              maxWidth: 360,
              width: '100%',
            }}
          >
            <Text
              style={{
                fontFamily: theme.fonts.displayBlack,
                fontWeight: '900',
                fontSize: 18,
                color: theme.colors.text,
                marginBottom: 12,
              }}
            >
              Delete "{eventToDelete?.title}"?
            </Text>
            <Text
              style={{
                fontFamily: theme.fonts.bodyMedium,
                fontSize: 13,
                lineHeight: 19,
                color: theme.colors.textFaint,
                marginBottom: 24,
              }}
            >
              This event will be hidden from all views and cannot be recovered. Your consumption credit will remain.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={() => setEventToDelete(null)}
                disabled={deleteEventLoading}
                style={{
                  flex: 1,
                  borderRadius: theme.radii.lg,
                  borderWidth: 1,
                  borderColor: theme.colors.cardBorder,
                  paddingVertical: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: deleteEventLoading ? 0.6 : 1,
                }}
              >
                <Text
                  style={{
                    fontFamily: theme.fonts.displayExtraBold,
                    fontWeight: '800',
                    fontSize: 14,
                    color: theme.colors.text,
                  }}
                >
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={onConfirmDeleteEvent}
                disabled={deleteEventLoading}
                style={{
                  flex: 1,
                  borderRadius: theme.radii.lg,
                  borderWidth: 1,
                  borderColor: 'rgba(239,68,68,0.55)',
                  backgroundColor: 'rgba(239,68,68,0.16)',
                  paddingVertical: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: deleteEventLoading ? 0.6 : 1,
                }}
              >
                {deleteEventLoading ? (
                  <ActivityIndicator color={theme.colors.danger} />
                ) : (
                  <Text
                    style={{
                      fontFamily: theme.fonts.displayExtraBold,
                      fontWeight: '800',
                      fontSize: 14,
                      color: theme.colors.danger,
                    }}
                  >
                    Delete
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ---------------------------------------------------------------------------
export default function WorkspaceScreen() {
  const theme = useTheme();
  const { workspaces, loading } = useMyWorkspace();
  // Only ever set on the dormant multi-workspace path. At exactly 1 workspace
  // this stays null forever and the picker is never rendered — invisible to
  // solo hosts, which is every MVP host.
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const multi = (workspaces?.length ?? 0) > 1;
  const selected = !workspaces
    ? null
    : multi
      ? (workspaces.find((w) => w.id === selectedId) ?? null)
      : workspaces[0];

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/me'));

  if (selected) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <WorkspaceDetail
          key={selected.id}
          workspace={selected}
          // Inside a picked workspace, Back returns to the picker rather than
          // leaving the screen — the picker is where the host came from.
          onBackToPicker={multi ? () => setSelectedId(null) : null}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <Header
        theme={theme}
        title={loading ? '…' : multi ? 'Your workspaces' : 'No workspace'}
        onBack={back}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: 48,
          maxWidth: 560,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        {loading ? (
          <View style={{ paddingVertical: 48, alignItems: 'center' }}>
            <ActivityIndicator color={brand.brightOrange} />
          </View>
        ) : multi && workspaces ? (
          <View style={{ gap: 10 }}>
            {workspaces.map((w) => (
              <PickerRow
                key={w.id}
                theme={theme}
                workspace={w}
                onPress={() => setSelectedId(w.id)}
              />
            ))}
          </View>
        ) : (
          // No workspace at all. Not normally reachable — the Me hub shows the
          // dashed invitation instead of a card in that state — but a direct
          // visit or a just-deleted workspace can land here.
          <Text
            style={{
              fontFamily: theme.fonts.bodyMedium,
              fontSize: 13,
              lineHeight: 19,
              color: theme.colors.textFaint,
              paddingVertical: 8,
            }}
          >
            You don't have a workspace yet. Publish an event and one is created for you.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

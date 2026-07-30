// Me tab — the ONLY auth entry point (architecture lock #2).
// Logged out: a signup invitation, never an empty profile shell — ported from
// the proven MeSignupPrompt (design-reference Screens.jsx).
// Signed in: the personal hub — profile header, the workspace slot (three
// states off the 0015 read path), a Saved pointer row, the settings rows, and
// sign-out.
//
// There is NO settings gear anywhere: the rows ARE settings. This diverges
// deliberately from the frozen reference, which routes them through a separate
// SettingsScreen behind a gear — ruled 2026-07-27, one less hop to a five-row
// list. Each row opens a STUB (title + "Coming soon"); the real screens are a
// later arc.

import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import {
  GradientButton,
  GradientFill,
  SecondaryButton,
} from '../../components/AuthControls';
import { Perforation } from '../../components/EventStub';
import SparkedLogo from '../../components/SparkedLogo';
import { useAuth } from '../../lib/auth';
import { useEngagement } from '../../lib/engagement';
import { eventCountdown } from '../../lib/eventTime';
import { supabase } from '../../lib/supabase';
import {
  useMyWorkspace,
  useWorkspaceStats,
  type Workspace,
  type WorkspaceStats,
} from '../../lib/workspace';
import { brand, useTheme } from '../../theme';

type Theme = ReturnType<typeof useTheme>;

// What an account unlocks — copy from the proven design.
const ME_UNLOCKS = [
  {
    icon: 'bookmark' as const,
    title: 'Save events',
    sub: 'Bookmark anything and find it again in one tap.',
  },
  {
    icon: 'list' as const,
    title: 'Keep your filters',
    sub: "Your feed remembers the categories you're into.",
  },
  {
    icon: 'sparkles' as const,
    title: 'Host events',
    sub: 'Publish and manage your own nights out.',
  },
] as const;

interface Profile {
  display_name: string;
  created_at: string;
}

function SignedOutMe() {
  const theme = useTheme();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{
        flexGrow: 1,
        padding: 24,
        paddingBottom: 40,
        maxWidth: 560,
        width: '100%',
        alignSelf: 'center',
      }}
    >
      <View style={{ paddingTop: 12, marginBottom: 4 }}>
        <SparkedLogo mode={theme.mode} variant="lockup" size={22} />
      </View>

      <View style={{ marginTop: 16 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: theme.shadows.cta,
          }}
        >
          <GradientFill />
          <Ionicons name="bookmark" size={24} color={brand.navy} />
        </View>
        <Text
          style={{
            fontFamily: theme.fonts.displayBlack,
            fontWeight: '900',
            fontSize: 30,
            letterSpacing: -0.3,
            lineHeight: 32,
            color: theme.colors.text,
            marginTop: 20,
          }}
        >
          Make Sparked yours
        </Text>
        <Text
          style={{
            fontFamily: theme.fonts.bodyMedium,
            fontSize: theme.fontSizes.bodySm,
            lineHeight: 21,
            color: theme.colors.textMuted,
            marginTop: 10,
            maxWidth: 300,
          }}
        >
          Browsing is always free. An account just lets you keep what you find — and run your
          own nights out.
        </Text>
      </View>

      <View style={{ marginTop: 24, gap: 2 }}>
        {ME_UNLOCKS.map((u) => (
          <View
            key={u.title}
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 13, paddingVertical: 12 }}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                backgroundColor: 'rgba(252,163,17,0.10)',
                borderWidth: 1,
                borderColor: 'rgba(252,163,17,0.25)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={u.icon} size={17} color={brand.brightOrange} />
            </View>
            <View style={{ flex: 1, paddingTop: 1 }}>
              <Text
                style={{
                  fontFamily: theme.fonts.displayBlack,
                  fontWeight: '900',
                  fontSize: 15,
                  letterSpacing: -0.15,
                  color: theme.colors.text,
                }}
              >
                {u.title}
              </Text>
              <Text
                style={{
                  fontFamily: theme.fonts.bodyMedium,
                  fontSize: 12.5,
                  lineHeight: 17.5,
                  color: theme.colors.textMuted,
                  marginTop: 2,
                }}
              >
                {u.sub}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ marginTop: 'auto', paddingTop: 26, gap: 11 }}>
        <GradientButton
          onPress={() => router.push({ pathname: '/auth', params: { mode: 'signup' } })}
        >
          Create free account
        </GradientButton>
        <SecondaryButton
          onPress={() => router.push({ pathname: '/auth', params: { mode: 'login' } })}
        >
          Log in
        </SecondaryButton>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            marginTop: 4,
          }}
        >
          <Ionicons name="search" size={12} color={theme.colors.textFaint} />
          <Text
            style={{
              fontFamily: theme.fonts.bodyMedium,
              fontSize: 11.5,
              color: theme.colors.textFaint,
            }}
          >
            Keep browsing Explore without an account.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

// One stat in the host card — big number over a small uppercase label. Shows a
// muted block instead of a number while stats resolve (never a flash of 0).
function StatTile({ theme, value, label, loading }: { theme: Theme; value: number | null; label: string; loading: boolean }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      {loading || value === null ? (
        <View style={{ width: 24, height: 22, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.06)' }} />
      ) : (
        <Text style={{ fontFamily: theme.fonts.displayBlack, fontWeight: '900', fontSize: 22, letterSpacing: -0.3, color: theme.colors.text }}>
          {value}
        </Text>
      )}
      <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 9.5, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', color: theme.colors.textFaint, marginTop: 5 }}>
        {label}
      </Text>
    </View>
  );
}

// HOST state — solid, informational (no gradient; that's reserved for actions).
// Card/surface fill + border tokens per the reference host card. Taps to
// /workspace.
//
// TWO tiles only — Active + Upcoming (ruled 2026-07-27). RSVPs and Saves are
// PER-EVENT numbers; aggregating them here answered a question no host asks
// ("how many saves across everything?"). They move to per-event display on the
// Workspace screen. Both tiles always render, zero included — a host with no
// listings should see the shape of the card they're working toward, and a real
// 0 is information. `useWorkspaceStats` still returns all four; this card just
// reads two of them.
function WorkspaceStatsCard({ theme, workspace, stats, loading, onPress }: {
  theme: Theme;
  workspace: Workspace;
  stats: WorkspaceStats | null;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`Workspace: ${workspace.name}`}
      style={({ pressed }) => ({
        backgroundColor: pressed ? 'rgba(255,255,255,0.06)' : theme.colors.cardBg,
        borderWidth: 1,
        borderColor: theme.colors.cardBorder,
        borderRadius: 22,
        padding: 18,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,99,72,0.10)', borderWidth: 1, borderColor: 'rgba(255,99,72,0.25)', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="sparkles" size={18} color={brand.flameRed} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 9, fontWeight: '900', letterSpacing: 1.6, textTransform: 'uppercase', color: theme.colors.textFaint }}>
            Workspace
          </Text>
          <Text numberOfLines={1} style={{ fontFamily: theme.fonts.displayBlack, fontWeight: '900', fontSize: 16, letterSpacing: -0.16, color: theme.colors.text, marginTop: 2 }}>
            {workspace.name}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textFaint} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
        <StatTile theme={theme} value={stats?.active_listings ?? null} label="Active" loading={loading} />
        <StatTile theme={theme} value={stats?.upcoming_events ?? null} label="Upcoming" loading={loading} />
      </View>
    </Pressable>
  );
}

// LOADING state — the card's silhouette in muted blocks, so the workspace read
// never flashes the "Create your first event" invitation before it resolves.
function WorkspaceSkeleton({ theme }: { theme: Theme }) {
  const block = (width: number, height: number) => (
    <View style={{ width, height, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.05)' }} />
  );
  return (
    <View style={{ backgroundColor: theme.colors.cardBg, borderWidth: 1, borderColor: theme.colors.cardBorder, borderRadius: 22, padding: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' }} />
        <View style={{ flex: 1, gap: 7 }}>
          {block(70, 9)}
          {block(150, 15)}
        </View>
      </View>
      {/* Two tiles — the silhouette has to match the real card (Active +
          Upcoming) or the slot visibly reflows when stats land. */}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
        {[0, 1].map((i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
            {block(24, 22)}
            {block(34, 8)}
          </View>
        ))}
      </View>
    </View>
  );
}

// The hub's one row anatomy — label + chevron on the card/surface tokens, no
// gradient (gradient is actionable-only, and a nav row is not a CTA). Both the
// Saved pointer and every settings row render through this, so the list below
// the workspace slot reads as one uniform stack.
function HubRow({ theme, label, onPress }: { theme: Theme; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
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
      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          fontFamily: theme.fonts.bodySemiBold,
          fontSize: theme.fontSizes.bodySm,
          fontWeight: '700',
          color: theme.colors.text,
        }}
      >
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={theme.colors.textFaint} />
    </Pressable>
  );
}

/** The one saved event the hub previews. Four columns, nothing else. */
interface NextSavedEvent {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
}

// SAVED — the workspace card's anatomy (icon chip + eyebrow + chevron, then a
// body) applied to the consumer side, previewing what's up next. Taps to the
// Saved tab. The body is a ticket fragment: title | perforation | countdown,
// the same three-part reading the EventStub gives everywhere else.
//
// Countdown derives on-device from starts_at at render time (architecture lock
// #4 — no polling, no ticking timer), so it re-reads whenever the hub is
// focused. Same as EventStub: neither surface ticks.
function SavedPreviewCard({ theme, event, loading, onPress, onExplore }: {
  theme: Theme;
  event: NextSavedEvent | null;
  loading: boolean;
  onPress: () => void;
  onExplore: () => void;
}) {
  const cd = event ? eventCountdown(event.starts_at, event.ends_at) : null;
  const block = (width: number, height: number) => (
    <View style={{ width, height, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.05)' }} />
  );

  const cardSurface = {
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 22,
    padding: 18,
  } as const;

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,99,72,0.10)', borderWidth: 1, borderColor: 'rgba(255,99,72,0.25)', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="bookmark" size={18} color={brand.flameRed} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 9, fontWeight: '900', letterSpacing: 1.6, textTransform: 'uppercase', color: theme.colors.textFaint }}>
          Saved
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.colors.textFaint} />
    </View>
  );

  // EMPTY — two destinations, so the card stops being one tap target. The copy
  // offers Explore while the chevron still points at Saved, and a card that
  // sent both taps to Saved made the sentence a lie.
  //
  // The split is STRUCTURAL, not a propagation guard: the container is a plain
  // View holding two SIBLING Pressables, so there is no outer press handler for
  // an inner tap to bubble into. (Nesting would have behaved differently per
  // platform — RN's responder system lets the inner view win, but on web the
  // DOM click bubbles and BOTH would fire.) A 12px gap sits between the two hit
  // areas, and the link carries minHeight 44 so it's a full-size target rather
  // than the height of 12pt text.
  if (!loading && !event) {
    return (
      <View style={[cardSurface, { backgroundColor: theme.colors.cardBg }]}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel="Saved"
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          {header}
        </Pressable>

        <Pressable
          onPress={onExplore}
          accessibilityRole="link"
          accessibilityLabel="Explore events near you"
          style={({ pressed }) => ({
            alignSelf: 'flex-start',
            marginTop: 12,
            marginLeft: -9,
            paddingHorizontal: 9,
            minHeight: 44,
            justifyContent: 'center',
            borderRadius: 10,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text
            style={{
              fontFamily: theme.fonts.bodySemiBold,
              fontSize: 12,
              fontWeight: '800',
              color: brand.brightOrange,
            }}
          >
            Explore events near you →
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={event ? `Saved. Next up: ${event.title}` : 'Saved'}
      style={({ pressed }) => ({
        ...cardSurface,
        backgroundColor: pressed ? 'rgba(255,255,255,0.06)' : theme.colors.cardBg,
      })}
    >
      {header}

      {loading ? (
        // Held body — the card must never flash "nothing coming up" at a user
        // who has something coming up.
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, minHeight: 64 }}>
          <View style={{ flex: 1, gap: 7 }}>
            {block(170, 14)}
            {block(110, 14)}
          </View>
          <View style={{ width: 78, alignItems: 'center', gap: 6 }}>
            {block(28, 22)}
            {block(38, 8)}
          </View>
        </View>
      ) : event && cd ? (
        <View style={{ flexDirection: 'row', alignItems: 'stretch', marginTop: 16, minHeight: 64 }}>
          <View style={{ flex: 1, minWidth: 0, justifyContent: 'center', paddingRight: 14 }}>
            <Text
              numberOfLines={2}
              style={{
                fontFamily: theme.fonts.displayBlack,
                fontWeight: '900',
                fontSize: 15,
                lineHeight: 19,
                letterSpacing: -0.15,
                color: theme.colors.text,
              }}
            >
              {event.title}
            </Text>
          </View>
          <Perforation />
          <View style={{ width: 78, alignItems: 'center', justifyContent: 'center', paddingLeft: 6 }}>
            <Text
              style={{
                fontFamily: theme.fonts.displayBlack,
                fontWeight: '900',
                fontSize: 22,
                lineHeight: 24,
                color: cd.live ? brand.flameRed : brand.sparkGold,
              }}
            >
              {cd.big}
            </Text>
            <Text
              style={{
                fontFamily: theme.fonts.bodySemiBold,
                fontSize: 8,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: theme.colors.textMuted,
                marginTop: 4,
              }}
            >
              {cd.label}
            </Text>
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}

// Settings rows, in locked order. Each opens a stub this stage.
const SETTINGS_ROWS = [
  { label: 'Interests & blocks', route: '/settings/interests' },
  { label: 'Notifications', route: '/settings/notifications' },
  { label: 'Privacy', route: '/settings/privacy' },
  { label: 'Appearance', route: '/settings/appearance' },
  { label: 'Help & feedback', route: '/settings/help' },
] as const;

function SignedInMe() {
  const theme = useTheme();
  const { session, signOut } = useAuth();
  // The engagement provider holds the user's saved/going IDS but no event
  // rows, so the preview needs titles + timestamps from somewhere: one events
  // read, below.
  const {
    savedIds,
    goingIds,
    loaded: engagementLoaded,
    refresh: refreshEngagement,
  } = useEngagement();

  // Union per the locked Saved rule (saved OR going), as a stable STRING. The
  // sets get fresh identities on every focus refresh even when their contents
  // are unchanged, so keying the effect on them directly would re-query on
  // every focus — and, since the effect feeds state the provider re-reads,
  // loop. Keying on the content makes the query fire only when the set really
  // changed.
  const savedKey = useMemo(
    () => [...new Set([...savedIds, ...goingIds])].sort().join(','),
    [savedIds, goingIds],
  );

  const [nextSaved, setNextSaved] = useState<NextSavedEvent | null>(null);
  const [nextSavedLoading, setNextSavedLoading] = useState(true);

  useEffect(() => {
    // Hold: an empty set before the provider's first read resolves is
    // indistinguishable from "nothing saved", and guessing shows the empty
    // state to users who have events coming up.
    if (!engagementLoaded) return;
    const ids = savedKey ? savedKey.split(',') : [];
    if (ids.length === 0) {
      setNextSaved(null);
      setNextSavedLoading(false);
      return;
    }
    let cancelled = false;
    setNextSavedLoading(true);
    (async () => {
      const now = new Date();
      const nowISO = now.toISOString();
      // Mirrors eventCountdown's assumption for a missing end time.
      const graceISO = new Date(now.getTime() - 3 * 3600000).toISOString();
      // "Next" = soonest event that hasn't ENDED — so a multi-day festival
      // that started days ago still reads as LIVE rather than being skipped
      // for something further out. Three cases: not started yet, still
      // running, or running under the no-end-time grace window.
      const { data, error } = await supabase
        .from('events')
        .select('id,title,starts_at,ends_at')
        .in('id', ids)
        .eq('status', 'published')
        .or(
          `starts_at.gte.${nowISO},ends_at.gte.${nowISO},and(ends_at.is.null,starts_at.gte.${graceISO})`,
        )
        .order('starts_at', { ascending: true })
        .limit(5);
      if (cancelled) return;
      // Confirm with the same util that RENDERS the countdown, so the row we
      // pick and the countdown we draw can never disagree about "ended".
      const rows = (data ?? []) as NextSavedEvent[];
      const next = error
        ? null
        : (rows.find((r) => eventCountdown(r.starts_at, r.ends_at).label !== 'ENDED') ?? null);
      setNextSaved(next);
      setNextSavedLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [savedKey, engagementLoaded]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // The workspace read path (0015). Most-recently-created workspace only — the
  // hook orders memberships by created_at ASCENDING, so that's the LAST entry
  // (item 4: one card, no picker). null = no workspace yet.
  const { workspaces, loading: wsLoading, refresh: refreshWorkspaces } = useMyWorkspace();
  const workspace = workspaces && workspaces.length ? workspaces[workspaces.length - 1] : null;
  const { stats, loading: statsLoading, refresh: refreshStats } = useWorkspaceStats(workspace?.id ?? null);

  // Re-pull on focus so the slot flips to the host card after a workspace is
  // created elsewhere (e.g. tapping the invitation), rather than showing stale
  // state until this screen remounts. Consumes the hooks' refresh — doesn't
  // modify them.
  useFocusEffect(
    useCallback(() => {
      refreshWorkspaces();
      refreshStats();
      // Same focus-refresh contract for the Saved count — saving happens on
      // Explore/detail, so the number is stale by the time Me is reopened.
      refreshEngagement();
    }, [refreshWorkspaces, refreshStats, refreshEngagement]),
  );

  // Tapping the invitation NAVIGATES ONLY — it does not create anything.
  // Becoming a host is earned by PUBLISHING, not by opening the create flow:
  // creating here left everyone who wandered in and backed out owning an empty
  // workspace and staring at a 0/0 stats card forever. The two publish paths
  // (curbside post, wizard checkout) each ensure the workspace themselves.
  const startCreate = () => {
    if (!session) return;
    router.push('/create');
  };

  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;
    supabase
      .from('profiles')
      .select('display_name, created_at')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (error) setProfileError(error.message);
        else setProfile(data);
      });
  }, [userId]);

  const name = profile?.display_name ?? session?.user.email ?? '';
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const memberSince = profile ? new Date(profile.created_at).getFullYear() : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{
        padding: 24,
        paddingBottom: 40,
        maxWidth: 560,
        width: '100%',
        alignSelf: 'center',
      }}
    >
      <View style={{ paddingTop: 12, marginBottom: 28 }}>
        <SparkedLogo mode={theme.mode} variant="lockup" size={22} />
      </View>

      {/* Profile header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: theme.shadows.cta,
          }}
        >
          <GradientFill />
          <Text
            style={{
              fontFamily: theme.fonts.displayBlack,
              fontWeight: '900',
              fontSize: 24,
              letterSpacing: -0.24,
              color: brand.navy,
            }}
          >
            {initials || '·'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: theme.fonts.displayBlack,
              fontWeight: '900',
              fontSize: 20,
              letterSpacing: -0.2,
              color: theme.colors.text,
            }}
          >
            {name || '…'}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: theme.fonts.bodyMedium,
              fontSize: theme.fontSizes.caption,
              color: theme.colors.textMuted,
              marginTop: 2,
            }}
          >
            {memberSince ? `Member since ${memberSince}` : session?.user.email}
          </Text>
        </View>
      </View>

      {profileError && (
        <Text
          style={{
            fontFamily: theme.fonts.bodyMedium,
            fontSize: theme.fontSizes.caption,
            color: theme.colors.danger,
            marginBottom: 16,
          }}
        >
          Couldn't load your profile: {profileError}
        </Text>
      )}

      {/* Workspace slot — three states off useMyWorkspace. The skeleton holds
          while the membership read resolves, so the invitation never flashes
          for a host who already has a workspace. */}
      {wsLoading ? (
        <WorkspaceSkeleton theme={theme} />
      ) : workspace ? (
        <WorkspaceStatsCard
          theme={theme}
          workspace={workspace}
          stats={stats}
          loading={statsLoading}
          onPress={() => router.push('/workspace')}
        />
      ) : (
        // No workspace — the dashed invitation (unchanged treatment). The tap
        // just opens the create fork; the workspace is born at publish.
        <Pressable
          onPress={startCreate}
          accessibilityLabel="Create your first event"
          style={({ pressed }) => ({
            backgroundColor: pressed ? 'rgba(255,140,56,0.09)' : 'rgba(255,140,56,0.04)',
            borderWidth: 1.5,
            borderStyle: 'dashed',
            borderColor: 'rgba(255,140,56,0.50)',
            borderRadius: 22,
            paddingVertical: 22,
            paddingHorizontal: 18,
            alignItems: 'center',
          })}
        >
          <Text
            style={{
              fontFamily: theme.fonts.displayBlack,
              fontWeight: '900',
              fontSize: 17,
              letterSpacing: -0.17,
              color: brand.sparkOrange,
            }}
          >
            + Create your first event
          </Text>
          <Text
            style={{
              fontFamily: theme.fonts.bodyMedium,
              fontSize: 12.5,
              lineHeight: 18,
              color: theme.colors.textMuted,
              marginTop: 7,
              maxWidth: 260,
              textAlign: 'center',
            }}
          >
            Host your own events and reach people nearby.
          </Text>
        </Pressable>
      )}

      {/* Saved — previews what's up next; the list itself lives in the tab. */}
      <View style={{ marginTop: 14 }}>
        <SavedPreviewCard
          theme={theme}
          event={nextSaved}
          loading={nextSavedLoading}
          onPress={() => router.navigate('/(tabs)/saved')}
          onExplore={() => router.navigate('/(tabs)')}
        />
      </View>

      {/* Settings — the rows ARE settings; there is no gear. */}
      <View style={{ marginTop: 14, gap: 8 }}>
        {SETTINGS_ROWS.map((row) => (
          <HubRow
            key={row.route}
            theme={theme}
            label={row.label}
            onPress={() => router.push(row.route)}
          />
        ))}
      </View>

      <View style={{ marginTop: 30 }}>
        <SecondaryButton onPress={() => signOut()}>Sign out</SecondaryButton>
      </View>
    </ScrollView>
  );
}

export default function Me() {
  const theme = useTheme();
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={brand.brightOrange} />
      </View>
    );
  }

  return session ? <SignedInMe /> : <SignedOutMe />;
}

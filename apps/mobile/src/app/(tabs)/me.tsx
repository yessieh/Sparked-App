// Me tab — the ONLY auth entry point (architecture lock #2).
// Logged out: a signup invitation, never an empty profile shell — ported from
// the proven MeSignupPrompt (design-reference Screens.jsx).
// Signed in: minimal hub this stage — profile header (display name from the
// profiles row, proving the 0001 signup trigger fired), the dashed workspace
// invitation (STATIC placeholder; creation flow = stage 5), and sign-out.
// Saved card is deliberately absent — saves land in a later session.

import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import {
  GradientButton,
  GradientFill,
  SecondaryButton,
} from '../../components/AuthControls';
import SparkedLogo from '../../components/SparkedLogo';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import {
  getOrCreateWorkspace,
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
// /workspace. The four numbers come from useWorkspaceStats.
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
        <StatTile theme={theme} value={stats?.total_rsvps ?? null} label="RSVPs" loading={loading} />
        <StatTile theme={theme} value={stats?.total_saves ?? null} label="Saves" loading={loading} />
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
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
            {block(24, 22)}
            {block(34, 8)}
          </View>
        ))}
      </View>
    </View>
  );
}

function SignedInMe() {
  const theme = useTheme();
  const { session, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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
    }, [refreshWorkspaces, refreshStats]),
  );

  const startCreate = async () => {
    if (!session) return;
    setCreating(true);
    setCreateError(null);
    try {
      await getOrCreateWorkspace(
        session.user.id,
        profile?.display_name ?? session.user.email ?? 'My workspace',
      );
      router.push('/create');
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
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
        // silently ensures the workspace (one owner membership, invisible to
        // the UI — locked architecture) and opens the create fork.
        <Pressable
          onPress={startCreate}
          disabled={creating}
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
            opacity: creating ? 0.6 : 1,
          })}
        >
          {creating ? (
            <ActivityIndicator color={brand.sparkOrange} />
          ) : (
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
          )}
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
      {createError && (
        <Text
          style={{
            fontFamily: theme.fonts.bodyMedium,
            fontSize: theme.fontSizes.caption,
            color: theme.colors.danger,
            marginTop: 10,
          }}
        >
          Couldn't start: {createError}
        </Text>
      )}

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

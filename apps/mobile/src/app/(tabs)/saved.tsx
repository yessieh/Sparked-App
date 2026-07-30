// Saved — bookmarked events grouped by WHEN they happen (design-reference
// SavedScreen): Tonight / This Weekend / Coming Up, sections render only when
// populated, grouping computed on-device from starts_at (architecture lock
// #4). Compact EventStub variant with Going/Saved chips + RSVP counts.
// Signed-out state is a small sign-in invitation (progressive gating) — the
// tab itself stays reachable so the gate is an invitation, not a wall.
// Data refreshes on screen focus — no polling, no Realtime.

import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { GradientButton, GradientFill } from '../../components/AuthControls';
import EventStub, { type FeedEvent } from '../../components/EventStub';
import SparkedLogo from '../../components/SparkedLogo';
import { useAuth } from '../../lib/auth';
import { useEngagement } from '../../lib/engagement';
import { hasEnded, savedBucket, type SavedBucket } from '../../lib/eventTime';
import { supabase } from '../../lib/supabase';
import { brand, useTheme } from '../../theme';

const BUCKET_LABELS: Record<SavedBucket, string> = {
  tonight: 'Tonight',
  weekend: 'This Weekend',
  coming: 'Coming Up',
};
const BUCKET_ORDER: SavedBucket[] = ['tonight', 'weekend', 'coming'];

interface SavedEventRow {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  venue_name: string | null;
  entry_fee_cents: number;
  rsvp_count: number;
  curbside_anonymous: boolean;
  workspaces: { name: string } | null;
  event_categories: { category_id: string }[];
}

/** Filter pill per the locked pill language — gradient when active. */
function FilterPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityState={{ selected: active }}
      style={{
        borderRadius: theme.radii.pill,
        overflow: 'hidden',
        paddingHorizontal: 16,
        paddingVertical: 7,
        backgroundColor: active ? undefined : theme.colors.iconChipBg,
        borderWidth: active ? 0 : 1,
        borderColor: theme.colors.cardBorder,
      }}
    >
      {active && <GradientFill />}
      <Text
        style={{
          fontFamily: theme.fonts.bodySemiBold,
          fontWeight: '800',
          fontSize: theme.fontSizes.caption,
          color: active ? brand.navy : theme.colors.textMuted,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SignedOutSaved() {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.bg,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <View style={{ maxWidth: 320, width: '100%', alignItems: 'center', gap: 12 }}>
        <Ionicons name="bookmark-outline" size={26} color={theme.colors.textFaint} />
        <Text
          style={{
            fontFamily: theme.fonts.displayBlack,
            fontWeight: '900',
            fontSize: 20,
            letterSpacing: -0.2,
            color: theme.colors.text,
            textAlign: 'center',
          }}
        >
          Keep what you find
        </Text>
        <Text
          style={{
            fontFamily: theme.fonts.bodyMedium,
            fontSize: theme.fontSizes.bodySm,
            lineHeight: 20,
            color: theme.colors.textMuted,
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          Saved events live here. Create a free account to start bookmarking.
        </Text>
        <GradientButton
          onPress={() => router.push({ pathname: '/auth', params: { mode: 'signup' } })}
          style={{ alignSelf: 'stretch' }}
        >
          Create free account
        </GradientButton>
      </View>
    </View>
  );
}

export default function Saved() {
  const theme = useTheme();
  const { session } = useAuth();
  const { savedIds, goingIds, toggleSave, toggleRsvp, refresh, rsvpDelta } = useEngagement();
  const [rows, setRows] = useState<SavedEventRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // All is the default — nothing is ever hidden by default (locked ruling).
  const [filter, setFilter] = useState<'all' | 'going'>('all');
  // Past is collapsed by default and the state is session-only, deliberately:
  // this screen is about what's ahead, and a finished event is reference, not
  // a plan. Nothing persisted — reopening Saved starts collapsed again.
  const [pastOpen, setPastOpen] = useState(false);

  const userId = session?.user.id ?? null;

  const load = useCallback(async () => {
    if (!userId) return;
    // UNION of saved OR going (ruling: unsaving an event you're still Going
    // to must never remove it — a commitment outranks a tidied bookmark).
    // Events may sit outside the feed radius, so this reads events directly
    // (published-only per RLS) rather than the feed RPC.
    await refresh();
    const [saveRows, rsvpRows] = await Promise.all([
      supabase.from('saves').select('event_id'),
      supabase.from('rsvps').select('event_id'),
    ]);
    const fetchError = saveRows.error ?? rsvpRows.error;
    if (fetchError) {
      setError(fetchError.message);
      return;
    }
    const ids = [
      ...new Set(
        [...(saveRows.data ?? []), ...(rsvpRows.data ?? [])].map((r) => r.event_id),
      ),
    ];
    if (ids.length === 0) {
      setError(null);
      setRows([]);
      return;
    }
    const { data, error: eventsError } = await supabase
      .from('events')
      .select(
        'id,title,starts_at,ends_at,venue_name,entry_fee_cents,rsvp_count,curbside_anonymous,workspaces(name),event_categories(category_id)',
      )
      .in('id', ids)
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('starts_at', { ascending: true });
    if (eventsError) setError(eventsError.message);
    else {
      setError(null);
      setRows(data as unknown as SavedEventRow[]);
    }
  }, [userId, refresh]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // The live sets drive visibility so toggles reflect instantly without a
  // refetch: a card stays while EITHER state holds and drops only at neither.
  // Within each time bucket, Going events sort first (structural priority —
  // rows arrive starts_at-ordered, and the stable partition preserves that
  // inside each half). The Going pill narrows the list; All hides nothing.
  const grouped = useMemo(() => {
    if (!rows) return null;
    const visible = rows.filter((r) =>
      filter === 'going' ? goingIds.has(r.id) : savedIds.has(r.id) || goingIds.has(r.id),
    );
    const buckets: Record<SavedBucket, FeedEvent[]> = { tonight: [], weekend: [], coming: [] };
    const past: FeedEvent[] = [];
    for (const r of visible) {
      const event: FeedEvent = {
        id: r.id,
        title: r.title,
        // Same mask the RPCs apply server-side (this path reads the table
        // directly, so the client honors the display-only anonymity here).
        organizer_name: r.curbside_anonymous ? null : (r.workspaces?.name ?? ''),
        starts_at: r.starts_at,
        ends_at: r.ends_at,
        venue_name: r.venue_name,
        entry_fee_cents: r.entry_fee_cents,
        rsvp_count: r.rsvp_count + rsvpDelta(r.id),
        categories: r.event_categories.map((c) => c.category_id),
      };
      // Ended events split off BEFORE bucketing. savedBucket reads starts_at
      // against two forward-looking windows only, so anything in the past fell
      // through its default and landed in "Coming Up" — a card stamped ENDED
      // sitting under a header promising it hadn't happened yet.
      //
      // The test is hasEnded — eventCountdown's own verdict, the SAME util the
      // card's chip renders from (locked client-side-time rule), so the section
      // split and the chip cannot disagree. It also gets live events right for
      // free: an event that has started but not ended reads LIVE, not ENDED, so
      // it stays in its upcoming bucket exactly as the Me hub's Saved card
      // treats it. Shared with the Workspace listings' Past section.
      if (hasEnded(r.starts_at, r.ends_at)) past.push(event);
      else buckets[savedBucket(r.starts_at)].push(event);
    }
    return {
      upcoming: BUCKET_ORDER.map((key) => ({
        key,
        label: BUCKET_LABELS[key],
        items: [
          ...buckets[key].filter((e) => goingIds.has(e.id)),
          ...buckets[key].filter((e) => !goingIds.has(e.id)),
        ],
      })).filter((s) => s.items.length > 0),
      // Most-recent-first: rows arrive starts_at ASCENDING, so the reverse is
      // "just finished" at the top. No Going-first partition here — that rule
      // exists to surface commitments you still have to keep, and a finished
      // event has none.
      past: [...past].reverse(),
    };
  }, [rows, savedIds, goingIds, filter, rsvpDelta]);

  const sections = grouped?.upcoming ?? null;
  const past = grouped?.past ?? [];

  if (!session) return <SignedOutSaved />;

  // Two counts, because they answer different questions and Past made them
  // diverge:
  //   inventoryTotal — everything saved/going regardless of filter or whether
  //     it has happened. Gates the filter pills and the true-empty state, so a
  //     user whose events have all ended keeps their pills and doesn't get
  //     told to go bookmark something while their history sits below.
  //   upcomingTotal — what the subtitle counts. Past carries its own count in
  //     its header, so counting it twice would overstate what's ahead.
  const inventoryTotal = rows
    ? rows.filter((r) => savedIds.has(r.id) || goingIds.has(r.id)).length
    : 0;
  const upcomingTotal = sections?.reduce((n, s) => n + s.items.length, 0) ?? 0;
  const filteredTotal = upcomingTotal + past.length;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{
        padding: 20,
        paddingBottom: 48,
        maxWidth: 560,
        width: '100%',
        alignSelf: 'center',
      }}
    >
      <View style={{ paddingTop: 4, paddingBottom: 16 }}>
        <SparkedLogo mode={theme.mode} variant="lockup" size={22} />
      </View>
      <Text
        style={{
          fontFamily: theme.fonts.displayBlack,
          fontWeight: '900',
          fontSize: theme.fontSizes.h2,
          letterSpacing: -0.28,
          color: theme.colors.text,
        }}
      >
        Saved
      </Text>
      <Text
        style={{
          fontFamily: theme.fonts.bodyMedium,
          fontSize: 13,
          color: theme.colors.textMuted,
          marginTop: 4,
          marginBottom: 22,
        }}
      >
        {inventoryTotal === 0
          ? 'Bookmark events from the feed to see them here.'
          : upcomingTotal === 0
            ? 'Nothing coming up — your past events are below.'
            : `${upcomingTotal} ${upcomingTotal === 1 ? 'event' : 'events'}, sorted by when they happen.`}
      </Text>

      {inventoryTotal > 0 && (
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          <FilterPill label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
          <FilterPill
            label="Going"
            active={filter === 'going'}
            onPress={() => setFilter('going')}
          />
        </View>
      )}

      {error ? (
        <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 13, color: theme.colors.danger }}>
          Couldn't load saved events: {error}
        </Text>
      ) : sections === null ? (
        <View style={{ paddingVertical: 48, alignItems: 'center' }}>
          <ActivityIndicator color={brand.brightOrange} />
        </View>
      ) : filteredTotal === 0 ? (
        <View
          style={{
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: 'rgba(255,255,255,0.12)',
            borderRadius: 18,
            paddingVertical: 28,
            paddingHorizontal: 18,
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Ionicons
            name={filter === 'going' ? 'checkmark-circle-outline' : 'bookmark-outline'}
            size={22}
            color={theme.colors.textFaint}
          />
          <Text
            style={{
              fontFamily: theme.fonts.bodyMedium,
              fontSize: theme.fontSizes.caption,
              lineHeight: 18,
              color: theme.colors.textFaint,
              textAlign: 'center',
            }}
          >
            {filter === 'going'
              ? "Nothing marked Going yet — tap the check on any event you're attending."
              : 'Tap the bookmark icon on any event to save it.'}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 26 }}>
          {sections.map((sec) => (
            <View key={sec.key}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 13 }}>
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
                  {sec.label}
                </Text>
                <Text
                  style={{
                    fontFamily: theme.fonts.displayExtraBold,
                    fontSize: 11,
                    color: theme.colors.textFaint,
                  }}
                >
                  {sec.items.length}
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(252,163,17,0.25)' }} />
              </View>
              <View style={{ gap: 16 }}>
                {sec.items.map((e) => (
                  <EventStub
                    key={e.id}
                    event={e}
                    variant="compact"
                    saved={savedIds.has(e.id)}
                    going={goingIds.has(e.id)}
                    onToggleSave={() => toggleSave(e.id)}
                    onToggleGoing={() => toggleRsvp(e.id)}
                    onTap={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })}
                  />
                ))}
              </View>
            </View>
          ))}

          {/* PAST — always last, collapsed by default. Muted rather than
              brand-orange like the upcoming headers: it's an archive drawer,
              not a section competing for attention. */}
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
              {pastOpen && (
                <View style={{ gap: 16 }}>
                  {past.map((e) => (
                    <EventStub
                      key={e.id}
                      event={e}
                      variant="compact"
                      saved={savedIds.has(e.id)}
                      going={goingIds.has(e.id)}
                      onToggleSave={() => toggleSave(e.id)}
                      onToggleGoing={() => toggleRsvp(e.id)}
                      onTap={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })}
                    />
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

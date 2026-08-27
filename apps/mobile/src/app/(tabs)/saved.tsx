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

import { GradientButton } from '../../components/AuthControls';
import EventStub, { type FeedEvent } from '../../components/EventStub';
import Pill from '../../components/Pill';
import SparkedLogo from '../../components/SparkedLogo';
import { useAuth } from '../../lib/auth';
import { useEngagement } from '../../lib/engagement';
import { hasEnded, savedBucket, type SavedBucket } from '../../lib/eventTime';
import { supabase } from '../../lib/supabase';
import { brand, useTheme } from '../../theme';
import { laneFor } from '../../theme/categoryColors';

const BUCKET_LABELS: Record<SavedBucket, string> = {
  tonight: 'Tonight',
  weekend: 'This Weekend',
  coming: 'Coming Up',
};
const BUCKET_ORDER: SavedBucket[] = ['tonight', 'weekend', 'coming'];

interface SavedEventRow {
  id: string;
  title: string;
  /** Stripe lane only — never rendered. See the select list below. */
  tier_id: string | null;
  starts_at: string;
  ends_at: string | null;
  venue_name: string | null;
  entry_fee_cents: number;
  rsvp_count: number;
  curbside_anonymous: boolean;
  /** Set once the host withdrew the listing (0019). Read-only to clients; the
   * server decides whether such a row reaches us at all (0022 attendee-history
   * branch), these two only decide how it is filed and rendered. */
  archived_at: string | null;
  deleted_at: string | null;
  workspaces: { name: string } | null;
  event_categories: { category_id: string }[];
}

// The local `FilterPill` that lived here was REPLACED BY components/Pill.tsx —
// the same control had been written twice (here and in the wizard's category
// picker) and both copies carried the same two defects: no `role`, so RNW
// rendered a bare div[tabindex="0"] (WCAG 4.1.2), and a height left to padding
// arithmetic that measured ~30pt against 2.5.5's 44. Both are fixed in the one
// component. `accessibilityState={{selected}}` went with it — inert on web per
// docs/ACCESSIBILITY.md Entry 5, replaced by `aria-pressed`.

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
    // NO deleted_at / archived_at filter here, deliberately (0022). Saved is
    // the ONE read path where a withdrawn listing may still appear: what
    // already happened stays in the attendee's record. The RLS policy is what
    // decides admission — it hands back an archived or deleted event only when
    // it has ENDED and this user has a save or RSVP on it. Filtering here would
    // simply re-close the exception the policy exists to open.
    const { data, error: eventsError } = await supabase
      .from('events')
      .select(
        // tier_id is read ONLY to derive the stripe lane (laneFor) — it is never
        // rendered and never reaches FeedEvent, per the locked consumer-facing
        // rule that keeps tier off the card.
        'id,title,tier_id,starts_at,ends_at,venue_name,entry_fee_cents,rsvp_count,curbside_anonymous,archived_at,deleted_at,workspaces(name),event_categories(category_id)',
      )
      .in('id', ids)
      .eq('status', 'published')
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
    // Events the host DELETED. They stay in the attendee's history (0022) but
    // event_detail still filters deleted_at, so their rows must not offer a tap
    // that would land on an empty screen. Archived events are NOT in here —
    // event_detail has no archive filter, so those still open normally.
    const inert = new Set<string>();
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
        lane: laneFor(r.tier_id),
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
      //
      // WITHDRAWN LISTINGS ARE ALWAYS HISTORY. The policy only returns an
      // archived or deleted row once the SERVER's clock says it ended, but the
      // section split runs on the DEVICE's clock. At the boundary — or on a
      // skewed device — hasEnded could disagree and file a withdrawn listing
      // under Tonight, which is exactly the state the amended rule forbids.
      // The flag wins: the server already ruled this is history, so it can only
      // ever be Past.
      if (r.deleted_at) inert.add(r.id);
      if (r.archived_at || r.deleted_at || hasEnded(r.starts_at, r.ends_at)) past.push(event);
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
      inert,
    };
  }, [rows, savedIds, goingIds, filter, rsvpDelta]);

  const sections = grouped?.upcoming ?? null;
  const past = grouped?.past ?? [];
  const inert = grouped?.inert ?? new Set<string>();

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
          <Pill label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
          <Pill
            label="Going"
            selected={filter === 'going'}
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
                    // A host-deleted event stays in this list — it happened,
                    // and that is the attendee's to keep — but it is a RECORD,
                    // not a listing: no tap target (the ticket is gone) and
                    // dimmed so it reads as history rather than something still
                    // on offer. Archived events keep their tap; only deleted
                    // ones go inert.
                    <View key={e.id} style={{ opacity: inert.has(e.id) ? 0.55 : 1 }}>
                      <EventStub
                        event={e}
                        variant="compact"
                        saved={savedIds.has(e.id)}
                        going={goingIds.has(e.id)}
                        onToggleSave={() => toggleSave(e.id)}
                        onToggleGoing={() => toggleRsvp(e.id)}
                        onTap={
                          inert.has(e.id)
                            ? undefined
                            : () => router.push({ pathname: '/event/[id]', params: { id: e.id } })
                        }
                      />
                    </View>
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

// Event Detail route — data loading only. Everything a consumer sees lives in
// components/EventDetailView, which the Create wizard's "Preview full listing"
// also renders (locked: reuse the real component, never a lookalike).
//
// Public to anonymous users (architecture lock #2); only the RSVP/save writes
// are gated to auth. Distance is PostGIS-computed by the event_detail RPC.
// Still later: report sheet; organizer tap-through lands with the Organizer
// Profile stage — name renders as plain text for now.

import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Animated, Platform, Text, View } from 'react-native';

import { SecondaryButton } from '../../../components/AuthControls';
import EmptyState from '../../../components/EmptyState';
import EventDetailView, { type EventDetailData } from '../../../components/EventDetailView';
import { useAuth } from '../../../lib/auth';
import { useEngagement } from '../../../lib/engagement';
import { useOrigin } from '../../../lib/origin';
import { supabase } from '../../../lib/supabase';
import { vendorFromRow, type Vendor, type VendorRow } from '../../../lib/vendors';
import { brand, useTheme } from '../../../theme';

/** Shape check only — never a claim that the row exists. A malformed id can be
 *  answered without a round trip, and routing it to the same neutral state as
 *  every other unreachable id keeps a raw Postgres 22P02 ("invalid input
 *  syntax for type uuid") off a stranger's screen. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `missing` is ONE state on purpose and must stay one.
 *
 * app.event_detail returns zero rows — and NO error — for archived, deleted,
 * draft, pending_payment, never-existed, and exists-but-you-are-not-entitled
 * alike (20260815000028 PART C). The indistinguishability is enforced at the
 * data layer; this screen's only job is not to break it. Do not add a branch,
 * a code, or a helpful-sounding variant that tells these apart — naming any
 * one of them confirms a hidden row exists.
 */
type LoadState = 'loading' | 'found' | 'missing' | 'error';

export default function EventDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const { savedIds, goingIds, toggleSave, toggleRsvp, refresh, rsvpDelta } = useEngagement();
  // The SAME origin Explore measures from — one shared value is what keeps the
  // feed's distance and this screen's distance line agreeing, which is the job
  // the retired TEST_ORIGIN constant used to do.
  // `place` is null until the stored origin resolves, which is the gate itself
  // — no separate `loaded` read needed here.
  const { place } = useOrigin();
  const [event, setEvent] = useState<EventDetailData | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [toast, setToast] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastOpacity = useRef(new Animated.Value(1)).current;

  /** True only while a user press is what turned RSVP on — the view reads
   * this to decide celebration vs. static stamped state. */
  const stampPressed = useRef(false);

  const load = useCallback(async () => {
    // No id, or an id that is not a uuid: nothing to ask the server about, and
    // both are the never-existed case in practice (a garbled shared link).
    // Previously `!id` returned early and left the screen spinning forever.
    if (!id || !UUID_RE.test(id)) {
      setError(null);
      setEvent(null);
      setVendors([]);
      setState('missing');
      return;
    }
    if (!place) return; // held by the focus effect's gate; see below.
    const { data, error: rpcError } = await supabase.rpc('event_detail', {
      event_id: id,
      origin_lat: place.lat,
      origin_lng: place.lng,
    });
    if (rpcError) {
      // 22P02 = invalid text representation. Unreachable behind the shape
      // check above, kept so a future param change cannot leak the raw
      // database string onto the screen.
      if (rpcError.code === '22P02') {
        setError(null);
        setEvent(null);
        setVendors([]);
        setState('missing');
        return;
      }
      setError(rpcError.message);
      setState('error');
    } else {
      setError(null);
      const ev = ((data ?? []) as EventDetailData[])[0] ?? null;
      setEvent(ev);
      // Zero rows is the whole not-found surface. See the LoadState note.
      setState(ev ? 'found' : 'missing');
      // Vendors are a Plus-only feature — skip the extra read for every other
      // event (the common feed→detail path). event_vendors RLS lets anon read
      // rows of any publicly-visible event, so no RPC is needed.
      if (ev && ev.tier_id === 'plus') {
        const { data: vRows } = await supabase
          .from('event_vendors')
          .select('id,name,vendor_type,logo_path,pin_x,pin_y,sort_order')
          .eq('event_id', id)
          .order('sort_order');
        setVendors(((vRows ?? []) as VendorRow[]).map(vendorFromRow));
      } else {
        setVendors([]);
      }
    }
  }, [id, place]);

  // `load` closes over `place`, so this re-fires when the stored origin
  // resolves — no separate effect. The malformed-id branch inside `load` runs
  // BEFORE the origin gate on purpose: it needs no origin, and making a
  // garbled link wait on storage would put the forever-spinner back.
  useFocusEffect(
    useCallback(() => {
      load();
      refresh();
    }, [load, refresh]),
  );

  const saved = id ? savedIds.has(id) : false;
  const going = id ? goingIds.has(id) : false;

  const gated = (action: () => void) => () => {
    if (session) action();
    else router.push({ pathname: '/auth', params: { mode: 'signup' } });
  };

  const onShare = async () => {
    // Placeholder per scope: copy the URL. Native share sheet is a tracked
    // Code-stage item (expo-sharing / Share API).
    const url =
      Platform.OS === 'web' && typeof window !== 'undefined'
        ? window.location.href
        : Linking.createURL(`/event/${id}`);
    try {
      await Clipboard.setStringAsync(url);
    } catch {
      // Web clipboard API can reject (focus/permission) — legacy fallback.
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const ta = document.createElement('textarea');
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
    }
    // ~1.8s life ending in a ~250ms opacity fade (no abrupt vanish).
    setToast(true);
    toastOpacity.setValue(1);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setToast(false));
    }, 1550);
  };

  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  if (state === 'error') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 13, color: theme.colors.danger, textAlign: 'center' }}>
          Couldn't load this event: {error}
        </Text>
      </View>
    );
  }

  // ONE returned subtree spans loading AND missing, so the live region inside
  // EmptyState is the same node before and after the transition. Two separate
  // `return`s (which is what this screen had) mount the region together with
  // its text, and a region that arrives with its content does not reliably
  // announce. This is the reason the spinner moved inside EmptyState instead
  // of staying a branch of its own.
  if (state !== 'found' || !event) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <EmptyState
          pending={state === 'loading'}
          headline="This event isn't available"
          // Deliberately disjunctive and deliberately incomplete. It must not
          // resolve to archived / deleted / private / never-existed — naming
          // any one of them confirms a hidden event exists. No "contact the
          // organizer" line either: it implies there is an organizer.
          body="The link may have expired, or it may not be public. Nothing else to go on — try Explore for what's happening near you."
        >
          <SecondaryButton
            // replace, not back(): the label names Explore, so the action has
            // to be Explore regardless of where the dead link was opened from,
            // and the unreachable event should not stay in history behind it.
            onPress={() => router.replace('/(tabs)')}
            style={{ minHeight: 44, alignSelf: 'stretch', maxWidth: 300 }}
          >
            Back to Explore
          </SecondaryButton>
        </EmptyState>
      </View>
    );
  }

  return (
    <>
      <EventDetailView
        event={event}
        vendors={vendors}
        saved={saved}
        going={going}
        goingCount={event.rsvp_count + rsvpDelta(event.id)}
        stampPressed={stampPressed}
        onBack={back}
        onToggleSave={gated(() => toggleSave(event.id))}
        onToggleRsvp={gated(() => {
          if (!going) stampPressed.current = true;
          toggleRsvp(event.id);
        })}
        onShare={onShare}
      />

      {/* "Link copied" toast per the reference's share confirmation. */}
      {toast && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: 24,
            alignSelf: 'center',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: 'rgba(15,26,48,0.92)',
            borderWidth: 1,
            borderColor: 'rgba(252,163,17,0.35)',
            borderRadius: 9999,
            paddingHorizontal: 18,
            paddingVertical: 12,
            boxShadow: '0 12px 28px rgba(0,0,0,0.35)',
            opacity: toastOpacity,
          }}
        >
          <Ionicons name="checkmark" size={14} color={brand.brightOrange} />
          <Text style={{ fontFamily: theme.fonts.displayBlack, fontWeight: '900', fontSize: 12, letterSpacing: 0.24, color: '#ffffff' }}>
            Link copied
          </Text>
        </Animated.View>
      )}
    </>
  );
}

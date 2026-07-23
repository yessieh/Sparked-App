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
import { ActivityIndicator, Animated, Platform, Text, View } from 'react-native';

import EventDetailView, { type EventDetailData } from '../../components/EventDetailView';
import { useAuth } from '../../lib/auth';
import { TEST_ORIGIN } from '../../lib/devOrigin';
import { useEngagement } from '../../lib/engagement';
import { supabase } from '../../lib/supabase';
import { vendorFromRow, type Vendor, type VendorRow } from '../../lib/vendors';
import { brand, useTheme } from '../../theme';

export default function EventDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const { savedIds, goingIds, toggleSave, toggleRsvp, refresh, rsvpDelta } = useEngagement();
  const [event, setEvent] = useState<EventDetailData | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastOpacity = useRef(new Animated.Value(1)).current;

  /** True only while a user press is what turned RSVP on — the view reads
   * this to decide celebration vs. static stamped state. */
  const stampPressed = useRef(false);

  const load = useCallback(async () => {
    if (!id) return;
    const { data, error: rpcError } = await supabase.rpc('event_detail', {
      event_id: id,
      origin_lat: TEST_ORIGIN.lat,
      origin_lng: TEST_ORIGIN.lng,
    });
    if (rpcError) setError(rpcError.message);
    else {
      setError(null);
      const ev = ((data ?? []) as EventDetailData[])[0] ?? null;
      setEvent(ev);
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
  }, [id]);

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

  if (error || (!event && error !== null)) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 13, color: theme.colors.danger, textAlign: 'center' }}>
          Couldn't load this event: {error}
        </Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={brand.brightOrange} />
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

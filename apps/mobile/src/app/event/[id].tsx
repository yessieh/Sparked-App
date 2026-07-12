// Event Detail — session A: structure + wiring, per the design-reference
// visual spec with the doc-locks applied (category-color stripe — NOT the
// prototype's gradient stripe; entry-fee line per the locked spec; organizer
// name derived from the workspace; consumer-facing data only).
// Public to anonymous users (architecture lock #2); only the RSVP write is
// gated to auth. Distance is PostGIS-computed by the event_detail RPC.
// Session B (this session): 1–3 photo gallery (EventGallery) + the RSVP
// stamp interaction. Still later: report sheet; organizer tap-through lands
// with the Organizer Profile stage — name renders as plain text here.

import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { GradientButton, GradientFill, SecondaryButton } from '../../components/AuthControls';
import EventGallery, { type GalleryPhoto } from '../../components/EventGallery';
import { CategoryBadges, Perforation, PriceLine } from '../../components/EventStub';
import { useAuth } from '../../lib/auth';
import { TEST_ORIGIN } from '../../lib/devOrigin';
import { useEngagement } from '../../lib/engagement';
import { eventCountdown, eventDateLabel, eventTimeLabel } from '../../lib/eventTime';
import { supabase } from '../../lib/supabase';
import { brand, useTheme } from '../../theme';
import { categoryColor } from '../../theme/categoryColors';

interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  organizer_name: string;
  tier_id: string;
  status: string;
  starts_at: string;
  ends_at: string | null;
  venue_name: string | null;
  address: string | null;
  entry_fee_cents: number;
  rsvp_count: number;
  categories: string[] | null;
  distance_miles: number | null;
  cancelled_at: string | null;
}

/** Ticket-row icons (prototype _SIcon paths). */
function RowIcon({ kind, color }: { kind: 'cal' | 'clock' | 'pin'; color: string }) {
  const p = { stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      {kind === 'cal' && (
        <>
          <Rect x={3} y={4} width={18} height={18} rx={2} {...p} />
          <Path d="M16 2v4M8 2v4M3 10h18" {...p} />
        </>
      )}
      {kind === 'clock' && (
        <>
          <Path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" {...p} />
          <Path d="M12 6v6l4 2" {...p} />
        </>
      )}
      {kind === 'pin' && (
        <>
          <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" {...p} />
          <Path d="M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" {...p} />
        </>
      )}
    </Svg>
  );
}

/** Placeholder photo set until real uploads (Code-stage item): Curbside
 * carries 1 image, paid tiers demo the full 3-image gallery. Real rows from
 * event_photos will map to the same GalleryPhoto shape with url set. */
function placeholderPhotos(eventId: string, tierId: string, tint: string): GalleryPhoto[] {
  const count = tierId === 'curbside' ? 1 : 3;
  return Array.from({ length: count }, (_, i) => ({ key: `${eventId}-${i}`, tint }));
}

/** Translucent 40×40 header icon chip (back / bookmark). */
function HeaderChip({
  label,
  active,
  onPress,
  children,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      hitSlop={4}
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? 'rgba(252,163,17,0.16)' : 'rgba(15,26,48,0.85)',
        borderWidth: 1,
        borderColor: active ? 'rgba(252,163,17,0.40)' : 'rgba(255,255,255,0.12)',
      }}
    >
      {children}
    </Pressable>
  );
}

export default function EventDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const { savedIds, goingIds, toggleSave, toggleRsvp, refresh, rsvpDelta } = useEngagement();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastOpacity = useRef(new Animated.Value(1)).current;

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
      setEvent(((data ?? []) as EventDetail[])[0] ?? null);
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

  const cats = event.categories ?? [];
  const stripe = categoryColor(cats);
  const cd = eventCountdown(event.starts_at, event.ends_at);
  const goingCount = event.rsvp_count + rsvpDelta(event.id);
  const photos = placeholderPhotos(event.id, event.tier_id, stripe);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <View style={{ maxWidth: 640, width: '100%', alignSelf: 'center' }}>
          <EventGallery photos={photos} bg={theme.colors.bg} showArrows={Platform.OS === 'web'} />

          <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
            <CategoryBadges categories={cats} max={3} />

            <Text
              style={{
                fontFamily: theme.fonts.displayBlack,
                fontWeight: '900',
                fontSize: 32,
                lineHeight: 34,
                letterSpacing: -0.32,
                color: theme.colors.text,
                marginTop: 14,
                marginBottom: 18,
              }}
            >
              {event.title}
            </Text>

            {/* Full-width ticket — stripe = category color (locked; the
                prototype's gradient stripe was drift), perforation,
                countdown column, fee line under the location row. */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'stretch',
                backgroundColor: theme.colors.cardBg,
                borderWidth: 1,
                borderColor: theme.colors.cardBorder,
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: theme.shadows.elevated,
                marginBottom: 22,
              }}
            >
              <View style={{ width: 5, backgroundColor: stripe }} />
              <View style={{ flex: 1, minWidth: 0, paddingHorizontal: 14, paddingVertical: 17, gap: 11, justifyContent: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
                  <RowIcon kind="cal" color={brand.flameRed} />
                  <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 13.5, color: theme.colors.textMuted }}>
                    {eventDateLabel(event.starts_at)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
                  <RowIcon kind="clock" color={brand.flameRed} />
                  <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 13.5, color: theme.colors.textMuted }}>
                    {eventTimeLabel(event.starts_at, event.ends_at)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 11 }}>
                  <View style={{ marginTop: 1 }}>
                    <RowIcon kind="pin" color={brand.brightOrange} />
                  </View>
                  <Text
                    style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 13, lineHeight: 17.5, color: theme.colors.textMuted, flex: 1 }}
                    numberOfLines={2}
                  >
                    {event.venue_name ?? event.organizer_name}
                    {typeof event.distance_miles === 'number'
                      ? ` · ${event.distance_miles.toFixed(1)} mi`
                      : ''}
                  </Text>
                </View>
                <PriceLine cents={event.entry_fee_cents} />
              </View>
              <Perforation />
              <View style={{ width: 84, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 16 }}>
                <Text
                  style={{
                    fontFamily: theme.fonts.displayBlack,
                    fontWeight: '900',
                    fontSize: 30,
                    lineHeight: 31,
                    color: cd.live ? brand.flameRed : brand.sparkGold,
                  }}
                >
                  {cd.big}
                </Text>
                <Text
                  style={{
                    fontFamily: theme.fonts.bodySemiBold,
                    fontSize: 8.5,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    color: theme.colors.textMuted,
                    marginTop: 7,
                  }}
                >
                  {cd.label}
                </Text>
              </View>
            </View>

            {event.description && (
              <Text
                style={{
                  fontFamily: theme.fonts.bodyMedium,
                  fontSize: 15,
                  lineHeight: 24,
                  color: theme.colors.textMuted,
                  marginBottom: 22,
                }}
              >
                {event.description}
              </Text>
            )}

            {event.address && (
              <View style={{ borderTopWidth: 1, borderTopColor: theme.colors.divider, paddingTop: 18, marginBottom: 22 }}>
                <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: theme.fontSizes.eyebrow, fontWeight: '900', letterSpacing: 2.2, textTransform: 'uppercase', color: brand.ignitionGold }}>
                  Location
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 12 }}>
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      backgroundColor: 'rgba(252,163,17,0.14)',
                      borderWidth: 1,
                      borderColor: 'rgba(252,163,17,0.28)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <RowIcon kind="pin" color={brand.brightOrange} />
                  </View>
                  <View style={{ flex: 1 }}>
                    {event.venue_name && (
                      <Text style={{ fontFamily: theme.fonts.displayBlack, fontWeight: '900', fontSize: 14, letterSpacing: -0.14, color: theme.colors.text }}>
                        {event.venue_name}
                      </Text>
                    )}
                    <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 13, lineHeight: 19, color: theme.colors.textMuted, marginTop: 3 }}>
                      {event.address}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Organizer — name derived from the workspace; plain text this
                session (tap-through arrives with the Organizer Profile stage). */}
            <View style={{ borderTopWidth: 1, borderTopColor: theme.colors.divider, paddingTop: 18, marginBottom: 26 }}>
              <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: theme.fontSizes.eyebrow, fontWeight: '900', letterSpacing: 2.2, textTransform: 'uppercase', color: brand.ignitionGold }}>
                Organizer
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 }}>
                <View style={{ width: 38, height: 38, borderRadius: 19, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                  <GradientFill />
                  <Ionicons name="sparkles" size={17} color={brand.navy} />
                </View>
                <Text style={{ fontFamily: theme.fonts.displayBlack, fontWeight: '900', fontSize: 15, letterSpacing: -0.15, color: theme.colors.text }}>
                  {event.organizer_name}
                </Text>
              </View>
            </View>

            {/* Action row — locked CTA hierarchy: gradient primary +
                secondary outline. Plain state change; stamp = session B. */}
            <GradientButton onPress={gated(() => toggleRsvp(event.id))}>
              {going ? 'Going ✓' : "I'm Going"}
            </GradientButton>
            {goingCount > 0 && (
              <Text
                style={{
                  fontFamily: theme.fonts.bodyMedium,
                  fontSize: 11.5,
                  color: theme.colors.textFaint,
                  textAlign: 'center',
                  marginTop: 10,
                }}
              >
                {goingCount} going
              </Text>
            )}
            <View style={{ marginTop: 11 }}>
              <SecondaryButton onPress={onShare}>Share event</SecondaryButton>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating header — back + save, translucent chips over the hero. */}
      <View
        style={{
          // left/right + maxWidth conflict on absolute elements (the box
          // resolves anchored left) — center via alignSelf + width instead.
          position: 'absolute',
          top: 12,
          alignSelf: 'center',
          width: '100%',
          maxWidth: 640,
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
        }}
      >
        <HeaderChip label="Back" onPress={back}>
          <Ionicons name="arrow-back" size={18} color="#ffffff" />
        </HeaderChip>
        <HeaderChip
          label={saved ? 'Saved' : 'Save'}
          active={saved}
          onPress={gated(() => toggleSave(event.id))}
        >
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={16}
            color={saved ? brand.brightOrange : '#ffffff'}
          />
        </HeaderChip>
      </View>

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
    </View>
  );
}

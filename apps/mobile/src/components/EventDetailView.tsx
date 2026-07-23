// Event Detail — THE view. Extracted from app/event/[id].tsx so the Create
// wizard's "Preview full listing" renders the real consumer surface rather
// than a lookalike (locked 2026-07-16: "Reuses the real component, never a
// lookalike, so preview drift is impossible"). The route owns data loading;
// this file owns everything a consumer sees.
//
// Visual spec = the design-reference, with the doc-locks applied: category-
// color stripe (NOT the prototype's gradient stripe), entry-fee line per the
// locked spec, organizer name derived from the workspace, consumer-facing
// data only — the host's publish fee NEVER appears here, in preview or live.
//
// preview mode: same pixels, no live actions. RSVP / save / share are inert
// (the draft has no id to write against), and a persistent PREVIEW bar marks
// the surface.

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { useReducedMotion } from '../lib/useReducedMotion';
import { eventCountdown, eventDateLabel, eventTimeLabel } from '../lib/eventTime';
import { brand, useTheme } from '../theme';
import { categoryColor } from '../theme/categoryColors';
import { GradientButton, GradientFill, SecondaryButton } from './AuthControls';
import EventGallery, { type GalleryPhoto } from './EventGallery';
import { CategoryBadges, Perforation, PriceLine } from './EventStub';
import MarkdownText from './MarkdownText';
import SiteMap from './SiteMap';
import type { Vendor } from '../lib/vendors';

/** Consumer-facing event shape. Note what is ABSENT: publish_fee_cents and
 * tier pricing never reach this surface (SCHEMA LOCK 1 — card/detail read
 * entry_fee_cents only). tier_id is here purely to pick the attribution
 * layout, never to gate the fee display (that's ALL-TIER). */
export interface EventDetailData {
  id: string;
  title: string;
  description: string | null;
  /** Masked (null) server-side when the poster chose "Post without my name". */
  organizer_name: string | null;
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
 * carries 1 image, paid tiers demo the full gallery. Real rows from
 * event_photos will map to the same GalleryPhoto shape with url set. */
export function placeholderPhotos(eventId: string, tierId: string, tint: string, count?: number): GalleryPhoto[] {
  const n = count ?? (tierId === 'curbside' ? 1 : 3);
  return Array.from({ length: Math.max(1, n) }, (_, i) => ({ key: `${eventId}-${i}`, tint }));
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

export interface EventDetailViewProps {
  event: EventDetailData;
  /** Draft preview: identical surface, every consumer action inert. */
  preview?: boolean;
  photos?: GalleryPhoto[];
  /** Plus site-map vendors (with relative pins). Section shows only for a Plus
   * event that has >=1 vendor; absent (or empty) everywhere else. */
  vendors?: Vendor[];
  saved?: boolean;
  going?: boolean;
  goingCount?: number;
  /** True only when THIS press started the RSVP — drives the stamp animation. */
  stampPressed?: React.MutableRefObject<boolean>;
  onBack: () => void;
  onToggleSave?: () => void;
  onToggleRsvp?: () => void;
  onShare?: () => void;
}

export default function EventDetailView({
  event,
  preview = false,
  photos,
  vendors,
  saved = false,
  going = false,
  goingCount = 0,
  stampPressed,
  onBack,
  onToggleSave,
  onToggleRsvp,
  onShare,
}: EventDetailViewProps) {
  const theme = useTheme();

  // ---- RSVP stamp (the signature moment — fires ONLY on this screen) ----
  // stampAnim drives stripe color (category → semantic green) and the Going
  // chip; the STAMPED mark slams in with a back-eased scale. The animation
  // plays only on a user press: arriving already-going (reload, deep link)
  // renders the stamped state statically, and un-RSVP is an instant state
  // return — no reverse celebration. Reduced motion: everything instant.
  const reducedMotion = useReducedMotion();
  const stampAnim = useRef(new Animated.Value(0)).current;
  const markScale = useRef(new Animated.Value(1)).current;
  const markOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (going) {
      if (stampPressed?.current && !reducedMotion) {
        stampAnim.setValue(0);
        markOpacity.setValue(0);
        markScale.setValue(1.6);
        // Decisive, ≤600ms total: stripe/chip sweep 300ms; the mark lands
        // harder — 260ms scale with a back overshoot, like a rubber stamp.
        Animated.parallel([
          Animated.timing(stampAnim, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(markOpacity, {
            toValue: 1,
            duration: 160,
            useNativeDriver: false,
          }),
          Animated.timing(markScale, {
            toValue: 1,
            duration: 260,
            easing: Easing.out(Easing.back(2.4)),
            useNativeDriver: false,
          }),
        ]).start();
      } else {
        stampAnim.setValue(1);
        markOpacity.setValue(1);
        markScale.setValue(1);
      }
    } else {
      stampAnim.setValue(0);
      markOpacity.setValue(0);
      markScale.setValue(1);
    }
    if (stampPressed) stampPressed.current = false;
  }, [going, reducedMotion, stampAnim, markOpacity, markScale, stampPressed]);

  const cats = event.categories ?? [];
  const stripe = categoryColor(cats);
  const cd = eventCountdown(event.starts_at, event.ends_at);
  const shots = photos ?? placeholderPhotos(event.id, event.tier_id, stripe);
  const stripeColor = stampAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [stripe, theme.colors.green],
  });

  // Preview: consumer actions render (the host must SEE them) but never fire.
  const noop = () => {};
  const fire = (fn?: () => void) => (preview || !fn ? noop : fn);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: preview ? 108 : 48 }}>
        <View style={{ maxWidth: 640, width: '100%', alignSelf: 'center' }}>
          <EventGallery photos={shots} bg={theme.colors.bg} showArrows={Platform.OS === 'web'} />

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
              {/* stripe sweeps category color → semantic green on stamp */}
              <Animated.View style={{ width: 5, backgroundColor: stripeColor }} />
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
                    {event.venue_name ?? event.organizer_name ?? event.address ?? ''}
                    {typeof event.distance_miles === 'number'
                      ? ` · ${event.distance_miles.toFixed(1)} mi`
                      : ''}
                  </Text>
                </View>
                {/* Curbside attribution lives IN the ticket — minimized
                    display, full internal accountability (ruling 2026-07-15).
                    Paid tiers keep the ORGANIZER block below instead. */}
                {event.tier_id === 'curbside' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
                    <Ionicons name="person-circle-outline" size={15} color={theme.colors.textFaint} />
                    <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 12, color: theme.colors.textFaint }}>
                      {event.organizer_name
                        ? `Posted by ${event.organizer_name.split(/\s+/)[0]} · community member`
                        : 'Posted by a verified neighbor'}
                    </Text>
                  </View>
                )}
                {/* ATTENDEE entry fee — all tiers. The publish fee has no
                    representation on this surface by design. */}
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

              {/* STAMPED mark — rubber-stamp slam over the ticket. */}
              {going && (
                <Animated.View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: markOpacity,
                    transform: [{ rotate: '-8deg' }, { scale: markScale }],
                  }}
                >
                  <View
                    style={{
                      borderWidth: 2.5,
                      borderColor: theme.colors.green,
                      borderRadius: 9,
                      paddingHorizontal: 12,
                      paddingVertical: 5,
                      backgroundColor: 'rgba(74,222,128,0.10)',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: theme.fonts.displayBlack,
                        fontWeight: '900',
                        fontSize: 15,
                        letterSpacing: 3,
                        color: theme.colors.green,
                      }}
                    >
                      STAMPED
                    </Text>
                  </View>
                </Animated.View>
              )}
            </View>

            {/* Going chip + count — arrives with the stamp, holds while going. */}
            {going && (
              <Animated.View
                style={{
                  opacity: stampAnim,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 9,
                  marginTop: -10,
                  marginBottom: 22,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    paddingHorizontal: 9,
                    paddingVertical: 4,
                    borderRadius: 9999,
                    backgroundColor: 'rgba(74,222,128,0.12)',
                    borderWidth: 1,
                    borderColor: 'rgba(74,222,128,0.36)',
                  }}
                >
                  <Ionicons name="checkmark" size={11} color={theme.colors.green} />
                  <Text
                    style={{
                      fontFamily: theme.fonts.bodySemiBold,
                      fontSize: 10.5,
                      fontWeight: '800',
                      color: theme.colors.green,
                    }}
                  >
                    Going
                  </Text>
                </View>
                {goingCount > 0 && (
                  <Text
                    style={{
                      fontFamily: theme.fonts.bodyMedium,
                      fontSize: 11.5,
                      color: theme.colors.textFaint,
                    }}
                  >
                    {goingCount} going
                  </Text>
                )}
              </Animated.View>
            )}

            {/* Description renders through the SHARED markdown renderer — the
                same component the wizard's Review uses, so a published event's
                **bold** never leaks raw asterisks onto the consumer surface
                (locked subset: bold / italic / "- " bullets). */}
            {event.description ? (
              <View style={{ marginBottom: 22 }}>
                <MarkdownText value={event.description} size={15} />
              </View>
            ) : null}

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

            {/* Site map & vendors — the Plus tier's second feature. Shows only
                for a Plus event that actually has vendors (ruling 2026-07-23:
                Plus + >=1 vendor); the map surface is a placeholder this stage,
                pins are the vendors' relative coords, tap a pin for name/type.
                Same SiteMap component the wizard uses, so preview can't drift. */}
            {event.tier_id === 'plus' && vendors && vendors.length > 0 && (
              <View style={{ borderTopWidth: 1, borderTopColor: theme.colors.divider, paddingTop: 18, marginBottom: 26 }}>
                <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: theme.fontSizes.eyebrow, fontWeight: '900', letterSpacing: 2.2, textTransform: 'uppercase', color: brand.ignitionGold }}>
                  Site map &amp; vendors
                </Text>
                <View style={{ marginTop: 12 }}>
                  <SiteMap vendors={vendors} tint={stripe} />
                </View>
                <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 11.5, color: theme.colors.textFaint, marginTop: 8 }}>
                  Tap a pin or a vendor to highlight it · {vendors.length} vendor{vendors.length === 1 ? '' : 's'}
                </Text>
              </View>
            )}

            {/* Organizer — PAID tiers only (curbside attribution lives in the
                ticket). Name derived from the workspace; plain text until the
                Organizer Profile stage brings tap-through. */}
            {event.tier_id !== 'curbside' && event.organizer_name && (
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
            )}

            {/* Action row — locked CTA hierarchy: gradient primary +
                secondary outline. Going flips the CTA to its confirmed
                state (semantic green — the one green exception); pressing
                it un-RSVPs as a plain state return. */}
            {going ? (
              <Pressable
                onPress={fire(onToggleRsvp)}
                accessibilityLabel="You're going — tap to undo"
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 9,
                  borderRadius: theme.radii.lg,
                  borderWidth: 1.5,
                  borderColor: 'rgba(74,222,128,0.45)',
                  backgroundColor: pressed && !preview ? 'rgba(74,222,128,0.20)' : 'rgba(74,222,128,0.12)',
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                })}
              >
                <Ionicons name="checkmark-circle" size={18} color={theme.colors.green} />
                <Text
                  style={{
                    fontFamily: theme.fonts.displayBlack,
                    fontWeight: '900',
                    fontSize: 16,
                    letterSpacing: -0.16,
                    color: theme.colors.green,
                  }}
                >
                  You're going
                </Text>
              </Pressable>
            ) : (
              <GradientButton onPress={fire(onToggleRsvp)}>I'm Going</GradientButton>
            )}
            {!going && goingCount > 0 && (
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
              <SecondaryButton onPress={fire(onShare)}>Share event</SecondaryButton>
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
        <HeaderChip label={preview ? 'Close preview' : 'Back'} onPress={onBack}>
          <Ionicons name={preview ? 'close' : 'arrow-back'} size={18} color="#ffffff" />
        </HeaderChip>
        <HeaderChip
          label={saved ? 'Saved' : 'Save'}
          active={saved}
          onPress={fire(onToggleSave)}
        >
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={16}
            color={saved ? brand.brightOrange : '#ffffff'}
          />
        </HeaderChip>
      </View>

      {/* PREVIEW marker — persistent, and the way back out. Deliberately not
          gradient: this is a scaffold around the listing, not an action on it
          (the "Back to review" button carries the gradient). */}
      {preview && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 16,
            borderTopWidth: 1,
            borderTopColor: 'rgba(252,163,17,0.35)',
            backgroundColor: 'rgba(15,26,48,0.94)',
          }}
        >
          <View style={{ width: '100%', maxWidth: 640, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <Ionicons name="eye-outline" size={13} color={brand.brightOrange} />
                <Text
                  style={{
                    fontFamily: theme.fonts.displayBlack,
                    fontWeight: '900',
                    fontSize: 10.5,
                    letterSpacing: 1.8,
                    color: brand.brightOrange,
                  }}
                >
                  PREVIEW
                </Text>
              </View>
              <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 11.5, lineHeight: 16, color: 'rgba(238,240,255,0.6)', marginTop: 3 }}>
                Exactly what attendees see. Nothing here is live yet.
              </Text>
            </View>
            <View style={{ minWidth: 132 }}>
              <GradientButton onPress={onBack}>Back to review</GradientButton>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

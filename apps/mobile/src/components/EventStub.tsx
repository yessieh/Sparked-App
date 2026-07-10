// EventStub — the universal event card (photo + compact variants).
// Rebuilt native from the design-reference visual spec, with the LOCKED rules:
//   • category stripe (left edge) = category color, all variants
//   • perforated divider + right utility column with Montserrat countdown
//   • price line = ATTENDEE ENTRY FEE only, in the card body under the
//     location row: Free = green semantic pill; paid = green $ icon +
//     bright #eef0ff amount at 600, ONE $ only, never gradient
//   • category badges = informational, outlined/tinted, never gradient
//   • Going chip/button = SEMANTIC green; Saved = gold bookmark tint
// No photos table yet — the photo header renders a category-tinted gradient
// placeholder until real uploads land (stage 5).
// Save/Going buttons only render when handlers are passed; anonymous gating
// (route to auth) is the calling screen's decision.

import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { eventCountdown, eventDateLabel, eventTimeLabel } from '../lib/eventTime';
import { brand, useTheme } from '../theme';
import { categoryColor } from '../theme/categoryColors';

export interface FeedEvent {
  id: string;
  title: string;
  organizer_name: string;
  starts_at: string;
  ends_at: string | null;
  venue_name: string | null;
  entry_fee_cents: number;
  categories: string[] | null;
  /** Present on feed RPC rows; absent on Saved-screen fetches (no origin). */
  distance_miles?: number;
  rsvp_count?: number;
}

export interface EventStubProps {
  event: FeedEvent;
  variant?: 'photo' | 'compact';
  saved?: boolean;
  going?: boolean;
  onToggleSave?: () => void;
  onToggleGoing?: () => void;
  onTap?: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  curbside: 'Curbside',
  markets: 'Markets',
  music: 'Music',
  art: 'Art',
  food: 'Food',
  community: 'Community',
  'pop-ups': 'Pop-Ups',
  outdoors: 'Outdoors',
  family: 'Family',
  wellness: 'Wellness',
  nightlife: 'Nightlife',
  sports: 'Sports',
  tech: 'Tech',
};

/** Outlined informational category badges — max 2 + "+N", never gradient. */
function CategoryBadges({ categories }: { categories: string[] }) {
  const shown = categories.slice(0, 2);
  const extra = categories.length - shown.length;
  return (
    <View style={{ flexDirection: 'row', gap: 5 }}>
      {shown.map((c) => (
        <View key={c} style={styles.badge}>
          <Text style={styles.badgeText}>{(CATEGORY_LABELS[c] ?? c).toUpperCase()}</Text>
        </View>
      ))}
      {extra > 0 && (
        <View style={[styles.badge, { borderColor: 'rgba(255,255,255,0.20)' }]}>
          <Text style={[styles.badgeText, { color: '#eef0ff', letterSpacing: 0.4 }]}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}

/** Bookmark / check icons — prototype's icon paths (event-stub.jsx _SIcon). */
function BookmarkIcon({ size = 13, color, fill = false }: { size?: number; color: string; fill?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? color : 'none'}>
      <Path
        d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckIcon({ size = 13, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6 9 17l-5-5" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** 28×28 utility-column action button (prototype _stubBtn). `tint` colors the
 * active state: gold for save, semantic green for going. */
function StubButton({
  active,
  tint,
  label,
  onPress,
  children,
}: {
  active: boolean;
  tint: 'gold' | 'green';
  label: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  const activeBg = tint === 'gold' ? 'rgba(252,163,17,0.14)' : 'rgba(74,222,128,0.14)';
  const activeBorder = tint === 'gold' ? 'rgba(252,163,17,0.35)' : 'rgba(74,222,128,0.36)';
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      hitSlop={6}
      style={{
        width: 28,
        height: 28,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? activeBg : 'rgba(255,255,255,0.07)',
        borderWidth: 1,
        borderColor: active ? activeBorder : 'rgba(255,255,255,0.12)',
      }}
    >
      {children}
    </Pressable>
  );
}

/** Going (semantic green) / Saved (muted) status chip — compact variant. */
function StatusChip({ going, saved }: { going: boolean; saved: boolean }) {
  const theme = useTheme();
  if (!going && !saved) return null;
  const c = going ? theme.colors.green : 'rgba(238,240,255,0.62)';
  const bg = going ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.05)';
  const bd = going ? 'rgba(74,222,128,0.36)' : 'rgba(238,240,255,0.16)';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 9999,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: bd,
      }}
    >
      {going ? <CheckIcon size={11} color={c} /> : <BookmarkIcon size={11} color={c} fill />}
      <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 10.5, fontWeight: '800', color: c }}>
        {going ? 'Going' : 'Saved'}
      </Text>
    </View>
  );
}

/** Dashed perforation with the ticket notches biting top & bottom edges. */
function Perforation() {
  const theme = useTheme();
  return (
    <View style={{ width: 2, marginVertical: 14, alignItems: 'center' }}>
      <View
        style={{
          flex: 1,
          width: 0,
          borderLeftWidth: 2,
          borderStyle: 'dotted',
          borderLeftColor: theme.colors.textHint,
        }}
      />
      <View style={[styles.notch, { top: -21, backgroundColor: theme.colors.bg }]} />
      <View style={[styles.notch, { bottom: -21, backgroundColor: theme.colors.bg }]} />
    </View>
  );
}

/** Entry-fee line per the LOCKED price spec. */
function PriceLine({ cents }: { cents: number }) {
  const theme = useTheme();
  if (cents <= 0) {
    return (
      <View style={[styles.freePill, { borderColor: 'rgba(74,222,128,0.35)', backgroundColor: 'rgba(74,222,128,0.14)' }]}>
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 9.5V7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2.5a2.5 2.5 0 0 0 0 5V17a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2.5a2.5 2.5 0 0 0 0-5Z"
            stroke={theme.colors.green}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path d="M14.5 6v12" stroke={theme.colors.green} strokeWidth={2} strokeDasharray="2 2.5" />
        </Svg>
        <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 11.5, color: theme.colors.green }}>Free</Text>
      </View>
    );
  }
  const dollars = cents / 100;
  const amount = Number.isInteger(dollars) ? `${dollars}` : dollars.toFixed(2);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 }}>
      <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 13, lineHeight: 13, color: theme.colors.green }}>$</Text>
      {/* amount = bright theme text (locked: #eef0ff in dark), 600, NOT green */}
      <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 11.5, color: theme.colors.text }}>
        {amount} per person
      </Text>
    </View>
  );
}

export default function EventStub({
  event,
  variant = 'photo',
  saved = false,
  going = false,
  onToggleSave,
  onToggleGoing,
  onTap,
}: EventStubProps) {
  const theme = useTheme();
  // Minute tick so the countdown stays current — local re-render only, never
  // a backend poll (architecture lock #4).
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const cats = event.categories ?? [];
  const stripe = categoryColor(cats);
  const cd = eventCountdown(event.starts_at, event.ends_at);

  const actionButtons = (onToggleSave || onToggleGoing) && (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {onToggleSave && (
        <StubButton active={saved} tint="gold" label={saved ? 'Saved' : 'Save'} onPress={onToggleSave}>
          <BookmarkIcon color={saved ? brand.brightOrange : '#ffffff'} fill={saved} />
        </StubButton>
      )}
      {onToggleGoing && (
        <StubButton active={going} tint="green" label={going ? 'Going' : "I'm going"} onPress={onToggleGoing}>
          <CheckIcon color={going ? theme.colors.green : '#ffffff'} />
        </StubButton>
      )}
    </View>
  );

  if (variant === 'compact') {
    return (
      <Pressable
        onPress={onTap}
        style={{
          flexDirection: 'row',
          alignItems: 'stretch',
          backgroundColor: theme.colors.cardBg,
          borderWidth: 1,
          borderColor: theme.colors.cardBorder,
          borderRadius: theme.radii.xl,
          overflow: 'hidden',
          boxShadow: theme.shadows.card,
        }}
      >
        <View style={{ width: 5, backgroundColor: stripe }} />
        <View style={{ flex: 1, minWidth: 0, paddingHorizontal: 15, paddingVertical: 13 }}>
          <CategoryBadges categories={cats} />
          <Text
            numberOfLines={1}
            style={{
              fontFamily: theme.fonts.displayBlack,
              fontWeight: '900',
              fontSize: 16,
              letterSpacing: -0.16,
              color: theme.colors.text,
              marginTop: 9,
            }}
          >
            {event.title}
          </Text>
          <Text numberOfLines={1} style={[styles.metaLine, { color: theme.colors.textMuted, fontFamily: theme.fonts.bodyMedium }]}>
            {eventDateLabel(event.starts_at)} · {eventTimeLabel(event.starts_at, event.ends_at)}
          </Text>
          <Text numberOfLines={1} style={[styles.metaLine, { color: theme.colors.textMuted, fontFamily: theme.fonts.bodyMedium }]}>
            {event.venue_name ?? event.organizer_name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 10 }}>
            <StatusChip going={going} saved={saved} />
            {typeof event.rsvp_count === 'number' && event.rsvp_count > 0 && (
              <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 11, color: theme.colors.textFaint }}>
                {event.rsvp_count} {event.rsvp_count === 1 ? 'RSVP' : 'RSVPs'}
              </Text>
            )}
          </View>
        </View>
        <Perforation />
        <View
          style={{
            width: 78,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            paddingHorizontal: 6,
            paddingVertical: 12,
          }}
        >
          <View style={{ alignItems: 'center' }}>
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
          {actionButtons}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onTap}
      style={{
        flexDirection: 'row',
        alignItems: 'stretch',
        backgroundColor: theme.colors.cardBg,
        borderWidth: 1,
        borderColor: theme.colors.cardBorder,
        borderRadius: theme.radii.xl,
        overflow: 'hidden',
        boxShadow: theme.shadows.card,
      }}
    >
      {/* category stripe — locked: stripe color = category, ALL variants */}
      <View style={{ width: 5, backgroundColor: stripe }} />

      <View style={{ flex: 1, minWidth: 0 }}>
        {/* photo header — gradient placeholder until real uploads (stage 5) */}
        <View style={{ height: 132 }}>
          <Svg width="100%" height="132">
            <Defs>
              <LinearGradient id={`ph-${event.id}`} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={brand.deepNavy} />
                <Stop offset="1" stopColor={stripe} stopOpacity={0.55} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="132" fill={`url(#ph-${event.id})`} />
          </Svg>
          <View style={{ position: 'absolute', top: 10, left: 10 }}>
            <CategoryBadges categories={cats} />
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
          <View style={{ flex: 1, minWidth: 0, paddingHorizontal: 14, paddingVertical: 12 }}>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: theme.fonts.displayBlack,
                fontWeight: '900',
                fontSize: 17,
                letterSpacing: -0.17,
                color: theme.colors.text,
              }}
            >
              {event.title}
            </Text>
            <Text numberOfLines={1} style={[styles.metaLine, { color: theme.colors.textMuted, fontFamily: theme.fonts.bodyMedium }]}>
              {eventDateLabel(event.starts_at)} · {eventTimeLabel(event.starts_at, event.ends_at)}
            </Text>
            <Text numberOfLines={1} style={[styles.metaLine, { color: theme.colors.textMuted, fontFamily: theme.fonts.bodyMedium }]}>
              {event.venue_name ?? event.organizer_name}
              {typeof event.distance_miles === 'number' ? ` · ${event.distance_miles.toFixed(1)} mi` : ''}
            </Text>
            <PriceLine cents={event.entry_fee_cents} />
          </View>

          <Perforation />

          {/* right utility column — Montserrat countdown + save/going actions */}
          <View
            style={{
              width: 78,
              alignItems: 'center',
              justifyContent: actionButtons ? 'space-between' : 'center',
              paddingHorizontal: 6,
              paddingVertical: actionButtons ? 12 : 0,
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <Text
                style={{
                  fontFamily: theme.fonts.displayBlack,
                  fontWeight: '900',
                  fontSize: 24,
                  lineHeight: 26,
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
            {actionButtons}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    backgroundColor: 'rgba(15,26,48,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(252,163,17,0.30)',
  },
  badgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: '#FCA311',
  },
  metaLine: { fontSize: 11.5, marginTop: 4 },
  freePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
  },
  notch: { position: 'absolute', width: 14, height: 14, borderRadius: 7, left: -6 },
});

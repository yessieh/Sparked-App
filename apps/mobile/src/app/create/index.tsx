// Create entry fork — "What are you posting?" (design-reference
// CreateForkScreen, proven). Two lanes: Curbside (free mini-form) vs Event
// (paid wizard — STUBBED this session). Green on the Curbside card is the
// free-lane SEMANTIC (free/going/confirmed), not the dead green Curbside
// category color; the category stripe everywhere stays indigo.
// Reached signed-in from the Me hub (workspace already ensured); a direct
// anonymous visit gates to auth.

import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { brand, useTheme } from '../../theme';

/** Back chip + eyebrow crumb (reference SubHeader). */
export function SubHeader({ crumb }: { crumb: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 }}>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/me'))}
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
        {crumb}
      </Text>
    </View>
  );
}

interface LaneProps {
  onPress: () => void;
  tint: 'green' | 'gold';
  badge: string;
  icon: 'pin' | 'sparkles';
  title: string;
  copy: string;
  subline: string;
}

function LaneCard({ onPress, tint, badge, icon, title, copy, subline }: LaneProps) {
  const theme = useTheme();
  const c =
    tint === 'green'
      ? { bg: 'rgba(74,222,128,0.06)', border: 'rgba(74,222,128,0.32)', tileBg: 'rgba(74,222,128,0.12)', tileBorder: 'rgba(74,222,128,0.30)', accent: theme.colors.green, badgeBg: 'rgba(74,222,128,0.14)', badgeBorder: 'rgba(74,222,128,0.35)' }
      : { bg: theme.colors.cardBg, border: 'rgba(252,163,17,0.30)', tileBg: 'rgba(252,163,17,0.12)', tileBorder: 'rgba(252,163,17,0.30)', accent: brand.brightOrange, badgeBg: 'rgba(252,163,17,0.10)', badgeBorder: 'rgba(252,163,17,0.32)' };
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: 22,
        padding: 20,
        backgroundColor: c.bg,
        borderWidth: 1.5,
        borderColor: c.border,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          position: 'absolute',
          top: 18,
          right: 18,
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 6,
          backgroundColor: c.badgeBg,
          borderWidth: 1,
          borderColor: c.badgeBorder,
        }}
      >
        <Text
          style={{
            fontFamily: theme.fonts.bodySemiBold,
            fontSize: 9.5,
            fontWeight: '900',
            letterSpacing: tint === 'green' ? 1.3 : 0,
            textTransform: tint === 'green' ? 'uppercase' : 'none',
            color: c.accent,
          }}
        >
          {badge}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: c.tileBg,
            borderWidth: 1,
            borderColor: c.tileBorder,
          }}
        >
          <Ionicons name={icon === 'pin' ? 'location-outline' : 'sparkles'} size={19} color={c.accent} />
        </View>
        <Text style={{ fontFamily: theme.fonts.displayBlack, fontWeight: '900', fontSize: 22, letterSpacing: -0.44, color: theme.colors.text }}>
          {title}
        </Text>
      </View>
      <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 13, lineHeight: 19.5, color: theme.colors.textMuted, marginBottom: 12 }}>
        {copy}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <Ionicons name="calendar-outline" size={13} color={theme.colors.textFaint} />
        <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 11, fontWeight: '800', color: theme.colors.textFaint }}>
          {subline}
        </Text>
      </View>
    </Pressable>
  );
}

export default function CreateFork() {
  const theme = useTheme();
  const { session, loading } = useAuth();
  const [eventFrom, setEventFrom] = useState<number | null>(null);

  // Creation is signed-in territory (progressive gating) — direct visits gate.
  useFocusEffect(
    useCallback(() => {
      if (!loading && !session) router.replace({ pathname: '/auth', params: { mode: 'signup' } });
    }, [loading, session]),
  );

  // "from $X" reads the canonical server pricing (tier_prices), never a
  // hardcoded number.
  useEffect(() => {
    supabase
      .from('tier_prices')
      .select('amount_cents')
      .eq('tier_id', 'standard')
      .eq('duration_band', 'single')
      .single()
      .then(({ data }) => {
        if (data) setEventFrom(data.amount_cents / 100);
      });
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
        <SubHeader crumb="List an event" />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -40,
            right: -50,
            width: 210,
            height: 210,
            borderRadius: 105,
            backgroundColor: 'rgba(255,99,72,0.14)',
            filter: 'blur(70px)',
          }}
        />
        <View style={{ paddingHorizontal: 24 }}>
          <Text
            style={{
              fontFamily: theme.fonts.displayBlack,
              fontWeight: '900',
              fontSize: 27,
              lineHeight: 29,
              letterSpacing: -0.54,
              color: theme.colors.text,
              marginTop: 6,
              marginBottom: 6,
            }}
          >
            What are you posting?
          </Text>
          <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 13.5, lineHeight: 21, color: theme.colors.textMuted, marginBottom: 22 }}>
            Two ways to get on the local feed — pick the one that fits.
          </Text>

          <View style={{ gap: 14 }}>
            <LaneCard
              onPress={() => router.push('/create/curbside')}
              tint="green"
              badge="Free"
              icon="pin"
              title="Curbside"
              copy="Yard sales, free pickup items, block celebrations. One photo, a description, and an address."
              subline="Single-day · 3 free posts every 100 days"
            />
            <LaneCard
              onPress={() => router.push('/create/event')}
              tint="gold"
              badge={eventFrom !== null ? `from $${eventFrom}` : 'paid'}
              icon="sparkles"
              title="Event"
              copy="A full listing on the local feed — categories, schedule, venue, photos. For businesses and organizers."
              subline="Standard or Plus · multi-day available"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

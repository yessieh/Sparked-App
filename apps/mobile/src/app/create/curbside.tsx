// Curbside mini-form (design-reference CreatePopupScreen, proven) — one
// screen, free, no tier step, no checkout. Doc-locks honored: tier id
// 'curbside', server auto-tags the Curbside category (NO picker here),
// single-day only, quota copy "N of 3 free posts".
// Quota is enforced twice: the 0008 before-insert trigger is the real gate;
// this screen reads the computed count and, at 3, renders the CONVERSION
// screen (an invitation, not an error state).
// Geocoding: Nominatim (decided this session — no key, plain fetch; swap for
// a paid provider at scale). Photo slot is visual-only until real uploads
// (Code-stage tracker item; event_photos table isn't applied yet either).
// Date/time are validated text fields this session — native pickers arrive
// with the wizard session per BUILD_PLAN.

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';

import { FormField, GradientButton, SecondaryButton } from '../../components/AuthControls';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import {
  CURBSIDE_QUOTA,
  curbsidePostsUsed,
  getOrCreateWorkspace,
} from '../../lib/workspace';
import { brand, useTheme } from '../../theme';
import { SubHeader } from './index';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;

function todayYMD(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Local wall-clock date(+time) → the single UTC starts_at / ends_at pair.
 * All-day posts run midnight → end of that day (LIVE all day in the feed). */
function toTimestamps(date: string, time: string | null) {
  const starts = new Date(`${date}T${time ?? '00:00'}:00`);
  const ends = time ? null : new Date(`${date}T23:59:59`);
  return { starts_at: starts.toISOString(), ends_at: ends ? ends.toISOString() : null };
}

async function geocode(address: string): Promise<{ lat: number; lon: number }> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(address)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Address lookup failed (${res.status}) — try again in a moment.`);
  const hits = (await res.json()) as { lat: string; lon: string }[];
  if (!hits.length) throw new Error("Couldn't find that address — check it and try again.");
  return { lat: parseFloat(hits[0].lat), lon: parseFloat(hits[0].lon) };
}

/** Visual-only single photo slot (real uploads = Code-stage tracker item). */
function PhotoSlot({ filled, onToggle }: { filled: boolean; onToggle: () => void }) {
  const theme = useTheme();
  if (filled) {
    return (
      <View
        style={{
          height: 132,
          borderRadius: 16,
          overflow: 'hidden',
          backgroundColor: 'rgba(129,140,248,0.18)',
          borderWidth: 1,
          borderColor: theme.colors.cardBorder,
          justifyContent: 'flex-end',
          padding: 10,
        }}
      >
        <Pressable
          onPress={onToggle}
          accessibilityLabel="Remove photo"
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 24,
            height: 24,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(7,11,20,0.72)',
          }}
        >
          <Ionicons name="close" size={12} color="#ffffff" />
        </Pressable>
        <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 9, color: theme.colors.textMuted }}>
          photo 1 · placeholder
        </Text>
      </View>
    );
  }
  return (
    <Pressable
      onPress={onToggle}
      accessibilityLabel="Add one photo"
      style={{
        height: 132,
        borderRadius: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.20)',
        backgroundColor: 'rgba(255,95,78,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      <Ionicons name="image-outline" size={22} color={brand.brightOrange} />
      <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 12, fontWeight: '800', color: theme.colors.textMuted }}>
        Add one photo
      </Text>
    </Pressable>
  );
}

/** Conversion screen — quota exhausted is an upgrade invitation, never an
 * error state. */
function ConversionScreen() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
        <SubHeader crumb="New Curbside post" />
        <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12 }}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(74,222,128,0.12)',
              borderWidth: 1,
              borderColor: 'rgba(74,222,128,0.30)',
            }}
          >
            <Ionicons name="checkmark-done" size={22} color={theme.colors.green} />
          </View>
          <Text style={{ fontFamily: theme.fonts.displayBlack, fontWeight: '900', fontSize: 24, lineHeight: 27, letterSpacing: -0.24, color: theme.colors.text }}>
            You've used your 3 free posts
          </Text>
          <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: theme.fontSizes.bodySm, lineHeight: 21, color: theme.colors.textMuted, marginBottom: 10 }}>
            Curbside covers 3 free posts every rolling 100 days — your next free slot opens as
            older posts age out. Posting more than that? That's exactly what Event listings are
            for — Standard is $5.
          </Text>
          <GradientButton onPress={() => router.push('/create/event')}>
            See Event listings — from $5
          </GradientButton>
          <SecondaryButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/me'))}>
            Maybe later
          </SecondaryButton>
        </View>
      </ScrollView>
    </View>
  );
}

export default function CurbsideForm() {
  const theme = useTheme();
  const { session, loading } = useAuth();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [used, setUsed] = useState<number | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);

  const [photo, setPhoto] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState(todayYMD());
  const [timeOn, setTimeOn] = useState(false);
  const [time, setTime] = useState('18:00');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Signed-in territory; also ensures the workspace exists (silent creation
  // covers deep links that skip the Me-hub entry point).
  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace({ pathname: '/auth', params: { mode: 'signup' } });
      return;
    }
    (async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', session.user.id)
          .single();
        const ws = await getOrCreateWorkspace(
          session.user.id,
          profile?.display_name ?? session.user.email ?? 'My workspace',
        );
        setWorkspaceId(ws);
        setUsed(await curbsidePostsUsed(ws));
      } catch (e) {
        setSetupError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [loading, session]);

  const dateValid = DATE_RE.test(date) && !Number.isNaN(new Date(`${date}T00:00:00`).getTime()) && date >= todayYMD();
  const timeValid = !timeOn || TIME_RE.test(time);
  const canPost = Boolean(title.trim() && address.trim() && dateValid && timeValid && !busy);

  const post = useCallback(async () => {
    if (!workspaceId || !canPost) return;
    setBusy(true);
    setError(null);
    try {
      const { lat, lon } = await geocode(address.trim());
      const { starts_at, ends_at } = toTimestamps(date, timeOn ? time : null);
      const { error: insertError } = await supabase.from('events').insert({
        workspace_id: workspaceId,
        title: title.trim(),
        description: desc.trim() || null,
        tier_id: 'curbside',
        status: 'published',
        starts_at,
        ends_at,
        address: address.trim(),
        location: `SRID=4326;POINT(${lon} ${lat})`,
      });
      if (insertError) {
        // The DB gate is the real quota layer — flip to conversion, not error.
        if (insertError.message.includes('curbside_quota_exhausted')) {
          setUsed(CURBSIDE_QUOTA);
          return;
        }
        throw new Error(insertError.message);
      }
      // Publish means live — land on the feed, focus refetch shows the post.
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [workspaceId, canPost, address, date, timeOn, time, title, desc]);

  if (setupError) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 13, color: theme.colors.danger, textAlign: 'center' }}>
          Couldn't set up posting: {setupError}
        </Text>
      </View>
    );
  }

  if (used === null) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={brand.brightOrange} />
      </View>
    );
  }

  if (used >= CURBSIDE_QUOTA) return <ConversionScreen />;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24, maxWidth: 640, width: '100%', alignSelf: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 24 }}>
          <SubHeader crumb="New Curbside post" />
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 6,
              backgroundColor: 'rgba(74,222,128,0.14)',
              borderWidth: 1,
              borderColor: 'rgba(74,222,128,0.35)',
            }}
          >
            <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 9.5, fontWeight: '900', letterSpacing: 1.3, textTransform: 'uppercase', color: theme.colors.green }}>
              Free
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 24 }}>
          <Text style={{ fontFamily: theme.fonts.displayBlack, fontWeight: '900', fontSize: 20, letterSpacing: -0.2, color: theme.colors.text, marginBottom: 4 }}>
            Quick post
          </Text>
          <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 12.5, lineHeight: 19, color: theme.colors.textMuted, marginBottom: 6 }}>
            The essentials only. Your post goes straight to the local feed.
          </Text>
          {/* Quota display reads the computed server count (locked copy). */}
          <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 11.5, fontWeight: '800', color: brand.sparkGold, marginBottom: 18 }}>
            {used} of {CURBSIDE_QUOTA} free posts used
          </Text>

          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: theme.fontSizes.caption, color: theme.colors.textMuted, marginBottom: 7 }}>
              Photo · optional
            </Text>
            <PhotoSlot filled={photo} onToggle={() => setPhoto((p) => !p)} />
          </View>

          <FormField label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Corner Yard Sale" />
          <FormField
            label="Description"
            value={desc}
            onChangeText={setDesc}
            placeholder="What is it? Anything people should know before they show up."
            multiline
            numberOfLines={3}
            style={{ minHeight: 84, textAlignVertical: 'top' }}
          />
          <FormField label="Address" value={address} onChangeText={setAddress} placeholder="Street address" autoComplete="street-address" />
          <FormField
            label="Date · single day only"
            value={date}
            onChangeText={setDate}
            placeholder={todayYMD()}
            autoCapitalize="none"
          />
          {!dateValid && date.length >= 10 && (
            <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: theme.fontSizes.caption, color: theme.colors.danger, marginTop: -8, marginBottom: 12 }}>
              Use YYYY-MM-DD, today or later.
            </Text>
          )}

          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: theme.fontSizes.caption, color: theme.colors.textMuted, marginBottom: 7 }}>
              Start time · optional
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Switch
                value={timeOn}
                onValueChange={setTimeOn}
                trackColor={{ false: 'rgba(255,255,255,0.10)', true: brand.sparkOrange }}
                thumbColor="#ffffff"
              />
              {timeOn ? (
                <View style={{ flex: 1 }}>
                  <FormField label="" value={time} onChangeText={setTime} placeholder="18:00" autoCapitalize="none" />
                </View>
              ) : (
                <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 12.5, color: theme.colors.textFaint }}>
                  All-day post
                </Text>
              )}
            </View>
            {timeOn && !timeValid && time.length >= 4 && (
              <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: theme.fontSizes.caption, color: theme.colors.danger, marginTop: 4 }}>
                Use 24h HH:MM, e.g. 18:00.
              </Text>
            )}
          </View>

          {error && (
            <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: theme.fontSizes.caption, lineHeight: 17, color: theme.colors.danger, marginBottom: 12 }}>
              {error}
            </Text>
          )}

          <GradientButton onPress={post} busy={busy} disabled={!canPost}>
            Post it — free
          </GradientButton>
          <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 11, color: theme.colors.textFaint, textAlign: 'center', marginTop: 10 }}>
            No checkout · expires after your date
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

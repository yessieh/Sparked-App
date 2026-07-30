// Curbside mini-form (design-reference CreatePopupScreen, proven) — one
// screen, free, no tier step, no checkout. Doc-locks honored: tier id
// 'curbside', server auto-tags the Curbside category (NO picker here).
//
// FREE-TIER RULES (changed 2026-07-29, migration 0016): ONE post per rolling
// 100-day window, spanning up to THREE consecutive days. Supersedes the
// original "3 single-day posts per 100 days".
// Both rules are enforced twice: the triggers are the real gates; this screen
// reads the count and, at 1, renders the CONVERSION screen (an invitation, not
// an error state), and caps the end-date picker at start + 2 days so it can't
// offer a span the server would reject.
// QUOTA SOURCE CHANGED 2026-07-30 (migration 0018): the count comes from an
// immutable, USER-keyed consumption ledger, not from live event rows keyed on
// the workspace. Deleting the post — or the whole workspace — no longer refunds
// the free lane. Client and server call the same count function.
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
import { DateField, TimeField, format12h } from '../../components/pickers';
import { useAuth } from '../../lib/auth';
import { geocode, toWktPoint } from '../../lib/geocode';
import { supabase } from '../../lib/supabase';
import {
  CURBSIDE_MAX_DAYS,
  CURBSIDE_QUOTA,
  curbsidePostsUsed,
  getOrCreateWorkspace,
  getOwnWorkspaceId,
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

/** `ymd` shifted by whole calendar days, via local noon so a DST boundary
 * can't roll the result into the neighbouring day. */
function shiftYMD(ymd: string, days: number): string {
  const d = new Date(`${ymd}T12:00:00`);
  d.setDate(d.getDate() + days);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Local wall-clock dates(+time) → the single UTC starts_at / ends_at pair.
 *
 * - Multi-day (end > start): midnight on the start day → end of the LAST day,
 *   so the post stays live across the whole span. Widest legal case is
 *   71:59:59, inside 0016's 3-day cap.
 * - Single day, all-day: midnight → end of that day (unchanged).
 * - Single day, timed: starts at the given time, ends_at null (unchanged) —
 *   the feed derives its own end for timed posts.
 */
function toTimestamps(date: string, endDate: string, time: string | null) {
  const multiDay = endDate > date;
  const starts = new Date(`${date}T${time ?? '00:00'}:00`);
  const ends = multiDay
    ? new Date(`${endDate}T23:59:59`)
    : time
      ? null
      : new Date(`${date}T23:59:59`);
  return { starts_at: starts.toISOString(), ends_at: ends ? ends.toISOString() : null };
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
            You've used your free post
          </Text>
          <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: theme.fontSizes.bodySm, lineHeight: 21, color: theme.colors.textMuted, marginBottom: 10 }}>
            Curbside covers one free post every rolling 100 days — your next free post opens as
            that one ages out. Posting more often than that? That's exactly what Event listings
            are for — Standard is $5.
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
  // Optional end date. Equal to `date` means a single-day post — the default,
  // so the casual lane still opens as a one-tap single-day form.
  const [endDate, setEndDate] = useState(todayYMD());
  const [timeOn, setTimeOn] = useState(false);
  const [time, setTime] = useState('18:00');
  const [anonPost, setAnonPost] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Signed-in territory. READ-ONLY setup: this no longer creates a workspace —
  // opening the form must not make anyone a host (that happens at "Post it").
  //
  // The quota read is now USER-KEYED and independent of the workspace (0018).
  // It used to short-circuit to 0 when the user had no workspace, on the
  // reasoning that they had "provably never posted" — which stopped being true
  // the moment the Workspace screen shipped a delete button. That shortcut WAS
  // half the exploit: delete the workspace, and the client handed you a fresh
  // form before the server was even asked. The count now comes from the
  // consumption ledger every time.
  //
  // getOwnWorkspaceId() still runs, but only to pre-fill the id `post()` needs
  // — it no longer has anything to do with the quota.
  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace({ pathname: '/auth', params: { mode: 'signup' } });
      return;
    }
    (async () => {
      try {
        const [ws, consumed] = await Promise.all([getOwnWorkspaceId(), curbsidePostsUsed()]);
        setWorkspaceId(ws);
        setUsed(consumed);
      } catch (e) {
        setSetupError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [loading, session]);

  const dateValid = DATE_RE.test(date) && !Number.isNaN(new Date(`${date}T00:00:00`).getTime()) && date >= todayYMD();
  // Last legal end day — start + 2 for a 3-day span. Passed to the picker as
  // `max` so out-of-range days render disabled rather than erroring on submit.
  const maxEnd = shiftYMD(date, CURBSIDE_MAX_DAYS - 1);
  const endValid = DATE_RE.test(endDate) && endDate >= date && endDate <= maxEnd;
  const timeValid = !timeOn || TIME_RE.test(time);
  const canPost = Boolean(title.trim() && address.trim() && dateValid && endValid && timeValid && !busy);

  /** Start moves → drag the end with it, exactly as the wizard's Start bumps
   * its End. Keeps the pair legal without ever silently shortening a span the
   * host deliberately set (a still-in-range end is left alone). */
  const changeStart = (ymd: string) => {
    setDate(ymd);
    const span = shiftYMD(ymd, CURBSIDE_MAX_DAYS - 1);
    setEndDate((prev) => (prev < ymd ? ymd : prev > span ? span : prev));
  };

  const post = useCallback(async () => {
    if (!session || !canPost) return;
    setBusy(true);
    setError(null);
    try {
      const point = await geocode(address.trim());
      const { starts_at, ends_at } = toTimestamps(date, endDate, timeOn ? time : null);
      // THE moment someone becomes a host: create/fetch the workspace, then
      // insert — sequential, same action. Existing hosts fall through to a
      // plain fetch (getOrCreateWorkspace short-circuits on an existing
      // membership), so this is a no-op for them beyond one extra read.
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', session.user.id)
        .single();
      const ws =
        workspaceId ??
        (await getOrCreateWorkspace(
          session.user.id,
          profile?.display_name ?? session.user.email ?? 'My workspace',
        ));
      setWorkspaceId(ws);
      const { error: insertError } = await supabase.from('events').insert({
        workspace_id: ws,
        title: title.trim(),
        description: desc.trim() || null,
        tier_id: 'curbside',
        status: 'published',
        starts_at,
        ends_at,
        address: address.trim(),
        location: toWktPoint(point),
        // Display-only anonymity (0009): the row stays attributed to the
        // workspace — quota, moderation, reports unchanged.
        curbside_anonymous: anonPost,
      });
      if (insertError) {
        // The DB gate is the real quota layer — flip to conversion, not error.
        if (insertError.message.includes('curbside_quota_exhausted')) {
          setUsed(CURBSIDE_QUOTA);
          return;
        }
        // Span gate (0016). The picker's `max` should make this unreachable, so
        // it means the two layers disagree — say something a host can act on
        // rather than leaking a Postgres string.
        if (insertError.message.includes('curbside_span_too_long')) {
          throw new Error(
            `A Curbside post can cover at most ${CURBSIDE_MAX_DAYS} consecutive days. Shorten the end date and try again.`,
          );
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
  }, [session, workspaceId, canPost, address, date, endDate, timeOn, time, title, desc, anonPost]);

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
          {/* Quota display reads the ledger count for THIS USER (0018). At
              quota this screen isn't reachable (the conversion screen renders
              instead), so this only ever states the one free post is still
              available. */}
          <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 11.5, fontWeight: '800', color: brand.sparkGold, marginBottom: 18 }}>
            {used} of {CURBSIDE_QUOTA} free post used · resets 100 days after posting
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
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: theme.fontSizes.caption, color: theme.colors.textMuted, marginBottom: 7 }}>
              Dates
            </Text>
            <DateField value={date} onChange={changeStart} min={todayYMD()} label="Starts" />
            <View style={{ marginTop: 8 }}>
              {/* End is capped at start + 2 by `max`, so the 3-day rule is a
                  property of the picker rather than a validation message the
                  host only meets after being told off. Leaving it on the start
                  day = a single-day post. */}
              <DateField value={endDate} onChange={setEndDate} min={date} max={maxEnd} label="Ends" />
            </View>
            <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 11.5, lineHeight: 16, color: theme.colors.textFaint, marginTop: 7 }}>
              Up to 3 consecutive days — perfect for a weekend sale.
            </Text>
          </View>

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
                <TimeField value={time} onChange={setTime} />
              ) : (
                <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 12.5, color: theme.colors.textFaint }}>
                  All-day post
                </Text>
              )}
            </View>
            {timeOn && (
              <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: theme.fontSizes.caption, color: theme.colors.textFaint, marginTop: 6 }}>
                Starts {format12h(time)}
              </Text>
            )}
          </View>

          <View style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Switch
                value={anonPost}
                onValueChange={setAnonPost}
                trackColor={{ false: 'rgba(255,255,255,0.10)', true: brand.sparkOrange }}
                thumbColor="#ffffff"
              />
              <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 12.5, color: theme.colors.text }}>
                Post without my name
              </Text>
            </View>
            {/* No verification is claimed here or anywhere — Sparked verifies
                nobody, so the anonymous label says only "Local host". */}
            <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: theme.fontSizes.caption, lineHeight: 16, color: theme.colors.textFaint, marginTop: 6 }}>
              {anonPost
                ? 'Your post will show "Local host" instead of your name. It stays tied to your account — you keep full access to this listing.'
                : "Your post shows your first name. It stays tied to your account — free-post count and accountability don't change."}
            </Text>
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

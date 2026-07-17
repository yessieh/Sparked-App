// Mock checkout — the Stripe-style screen per the design-reference
// (CheckoutScreen). MOCK ONLY: no card data is transmitted, stored, or
// validated against anything; "paying" calls publish_paid_event and nothing
// else. Real Stripe (Payment Sheet + payment intents + webhook) is BUILD_PLAN
// stage 6, where these hand-drawn wallet marks are replaced by the SDK's own
// buttons — tracked, deliberately not attempted here.
//
// The price shown is DISPLAY ONLY, read from tier_prices for the draft's band.
// publish_paid_event re-derives the band from the event's own timestamps and
// re-reads tier_prices server-side, so what the host is charged never depends
// on what this screen renders (and the 0010 guard trigger blocks the client
// from writing publish_fee_cents at all).

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { GradientButton, GradientFill, SecondaryButton } from '../../components/AuthControls';
import {
  type TierPrice,
  bandLabel,
  deviceTimeZone,
  eventDays,
  formatUSD,
  priceCents,
} from '../../lib/pricing';
import { supabase } from '../../lib/supabase';
import { brand, useTheme } from '../../theme';
import { SubHeader } from './index';

type Method = 'applepay' | 'googlepay' | 'link' | 'card';

interface DraftOrder {
  id: string;
  title: string;
  tier_id: string;
  status: string;
  starts_at: string;
  ends_at: string | null;
}

/** UTC instant → the device's local calendar date, so the band we DISPLAY is
 * the same one publish_paid_event computes from the device's tz. */
function localYMD(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Wallet marks — approximations of the real brands (locked as acceptable;
 * real SDK buttons are a stage-6 tracker item). */
function PayMark({ id }: { id: Method }) {
  const theme = useTheme();
  if (id === 'applepay') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Ionicons name="logo-apple" size={15} color={theme.colors.text} />
        <Text style={{ fontFamily: theme.fonts.displayBlack, fontWeight: '700', fontSize: 13, color: theme.colors.text }}>Pay</Text>
      </View>
    );
  }
  if (id === 'googlepay') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Svg width={15} height={15} viewBox="0 0 48 48">
          <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </Svg>
        <Text style={{ fontFamily: theme.fonts.displayBlack, fontWeight: '600', fontSize: 13, color: theme.colors.text }}>Pay</Text>
      </View>
    );
  }
  if (id === 'link') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <View style={{ width: 18, height: 18, borderRadius: 5, backgroundColor: '#00D66F', alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
            <Path d="M7 6l6 6-6 6M13 6l5 6-5 6" stroke="#053d24" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
        <Text style={{ fontFamily: theme.fonts.displayBlack, fontWeight: '800', fontSize: 13, color: '#00D66F' }}>Link</Text>
      </View>
    );
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
      <Ionicons name="card-outline" size={16} color={theme.colors.text} />
      <Text style={{ fontFamily: theme.fonts.displayBlack, fontWeight: '800', fontSize: 13, color: theme.colors.text }}>Card</Text>
    </View>
  );
}

/** Generic success screen — the reference's ConfirmScreen. */
function PublishedScreen({ eventId }: { eventId: string }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      <View
        style={{
          width: 84,
          height: 84,
          borderRadius: 9999,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 26,
          boxShadow: '0 14px 40px rgba(255,95,78,0.35)',
        }}
      >
        <GradientFill />
        <Ionicons name="checkmark" size={38} color={brand.navy} />
      </View>
      <Text style={{ fontFamily: theme.fonts.displayBlack, fontWeight: '900', fontSize: 28, lineHeight: 31, letterSpacing: -0.28, color: theme.colors.text, textAlign: 'center', marginBottom: 12 }}>
        You're live
      </Text>
      <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 14, lineHeight: 22, color: theme.colors.textMuted, textAlign: 'center', marginBottom: 32, maxWidth: 300 }}>
        Your event is on the local feed now — neighbours will see it ranked by how close they
        are, never by an algorithm.
      </Text>
      <View style={{ width: '100%', maxWidth: 300, gap: 12 }}>
        <GradientButton onPress={() => router.replace({ pathname: '/event/[id]', params: { id: eventId } })}>
          View your listing
        </GradientButton>
        <SecondaryButton onPress={() => router.replace('/(tabs)')}>Back to the feed</SecondaryButton>
      </View>
    </View>
  );
}

export default function CheckoutScreen() {
  const theme = useTheme();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();

  const [order, setOrder] = useState<DraftOrder | null>(null);
  const [prices, setPrices] = useState<TierPrice[]>([]);
  const [method, setMethod] = useState<Method>('card');
  const [card, setCard] = useState('');
  const [exp, setExp] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [paying, setPaying] = useState(false);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    (async () => {
      const [{ data: ev, error: evError }, { data: tp }] = await Promise.all([
        supabase.from('events').select('id,title,tier_id,status,starts_at,ends_at').eq('id', eventId).single(),
        supabase.from('tier_prices').select('tier_id,duration_band,amount_cents'),
      ]);
      if (evError) setError(evError.message);
      else setOrder(ev as DraftOrder);
      if (tp) setPrices(tp as TierPrice[]);
    })();
  }, [eventId]);

  const pay = useCallback(async () => {
    if (!order || paying) return;
    setPaying(true);
    setError(null);
    // Mock settle delay — the reference's 1.4s "Processing…" beat.
    await new Promise((r) => setTimeout(r, 1400));
    const { error: rpcError } = await supabase.rpc('publish_paid_event', {
      event_id: order.id,
      tz: deviceTimeZone(),
    });
    if (rpcError) {
      setError(rpcError.message);
      setPaying(false);
      return;
    }
    setPublished(true);
  }, [order, paying]);

  if (published && order) return <PublishedScreen eventId={order.id} />;

  if (!order) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        {error ? (
          <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 13, color: theme.colors.danger, textAlign: 'center' }}>
            Couldn't load your order: {error}
          </Text>
        ) : (
          <ActivityIndicator color={brand.brightOrange} />
        )}
      </View>
    );
  }

  const days = eventDays(localYMD(order.starts_at), order.ends_at ? localYMD(order.ends_at) : null);
  const totalCents = priceCents(prices, order.tier_id, days);
  const total = totalCents === null ? '—' : formatUSD(totalCents);
  const tierLabel = order.tier_id === 'plus' ? 'Plus' : 'Standard';

  const cardValid = card.replace(/\s/g, '').length >= 15 && exp.length >= 4 && cvc.length >= 3 && name.trim().length > 0;
  const valid = (method === 'card' ? cardValid : true) && totalCents !== null;
  const payLabel = {
    card: 'Pay to publish',
    applepay: 'Pay with Apple Pay',
    googlepay: 'Pay with Google Pay',
    link: 'Pay with Link',
  }[method];

  const fmtCard = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const fmtExp = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  const lbl = {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 10,
    fontWeight: '900' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
    color: theme.colors.textFaint,
    marginBottom: 6,
  };
  const field = {
    backgroundColor: theme.colors.cardBg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radii.lg - 2,
    paddingVertical: 13,
    paddingHorizontal: 14,
    fontFamily: theme.fonts.bodyMedium,
    fontSize: theme.fontSizes.bodySm,
    color: theme.colors.text,
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SubHeader crumb="Checkout · Secure payment" />
      <ScrollView contentContainerStyle={{ paddingBottom: 28, maxWidth: 560, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
        <View style={{ paddingHorizontal: 24 }}>
          <Text style={{ fontFamily: theme.fonts.displayBlack, fontWeight: '900', fontSize: 26, letterSpacing: -0.26, color: theme.colors.text, marginBottom: 18 }}>
            Pay to publish
          </Text>

          {/* Order summary — the host's economics, stated plainly. This is one
              of only two surfaces where the publish fee legitimately appears. */}
          <View style={{ padding: 18, borderRadius: 18, backgroundColor: theme.colors.cardBg, borderWidth: 1, borderColor: theme.colors.cardBorder, marginBottom: 22 }}>
            <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 9, fontWeight: '900', letterSpacing: 1.8, textTransform: 'uppercase', color: theme.colors.textFaint, marginBottom: 10 }}>
              Order summary
            </Text>
            <Text style={{ fontFamily: theme.fonts.displayBlack, fontWeight: '900', fontSize: 15, color: theme.colors.text, marginBottom: 6 }}>
              {order.title}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 13, color: theme.colors.textMuted }}>
                {tierLabel} · {bandLabel(days)}
              </Text>
              <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 13, fontWeight: '800', color: theme.colors.text }}>{total}</Text>
            </View>
            <View style={{ height: 1, backgroundColor: theme.colors.divider, marginVertical: 14 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 13, fontWeight: '800', color: theme.colors.text }}>Total due today</Text>
              <Text style={{ fontFamily: theme.fonts.displayBlack, fontWeight: '900', fontSize: 22, color: brand.brightOrange }}>{total}</Text>
            </View>
            <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 10.5, color: theme.colors.textFaint, marginTop: 8 }}>
              One-time charge · not a subscription
            </Text>
          </View>

          <Text style={lbl}>Payment method</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
            {(['applepay', 'googlepay', 'link', 'card'] as Method[]).map((id) => {
              const sel = method === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => setMethod(id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: sel }}
                  accessibilityLabel={id}
                  style={{
                    width: '48%',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 9,
                    paddingVertical: 13,
                    paddingHorizontal: 14,
                    borderRadius: 13,
                    borderWidth: 1.5,
                    borderColor: sel ? 'rgba(252,163,17,0.5)' : theme.colors.cardBorder,
                    backgroundColor: sel ? 'rgba(252,163,17,0.08)' : theme.colors.cardBg,
                  }}
                >
                  <View
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 9999,
                      borderWidth: 2,
                      borderColor: sel ? brand.brightOrange : theme.colors.borderStrong,
                      backgroundColor: sel ? brand.brightOrange : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {sel && <Ionicons name="checkmark" size={9} color={brand.navy} />}
                  </View>
                  <PayMark id={id} />
                </Pressable>
              );
            })}
          </View>

          {method === 'card' ? (
            <View>
              <Text style={lbl}>Card number</Text>
              <TextInput
                value={card}
                onChangeText={(v) => setCard(fmtCard(v))}
                inputMode="numeric"
                placeholder="4242 4242 4242 4242"
                placeholderTextColor={theme.colors.textHint}
                style={field}
              />
              <View style={{ flexDirection: 'row', gap: 12, marginVertical: 14 }}>
                <View style={{ flex: 1 }}>
                  <Text style={lbl}>Expiry</Text>
                  <TextInput
                    value={exp}
                    onChangeText={(v) => setExp(fmtExp(v))}
                    inputMode="numeric"
                    placeholder="MM/YY"
                    placeholderTextColor={theme.colors.textHint}
                    style={field}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={lbl}>CVC</Text>
                  <TextInput
                    value={cvc}
                    onChangeText={(v) => setCvc(v.replace(/\D/g, '').slice(0, 4))}
                    inputMode="numeric"
                    placeholder="123"
                    placeholderTextColor={theme.colors.textHint}
                    style={field}
                  />
                </View>
              </View>
              <Text style={lbl}>Name on card</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Jordan Chen"
                placeholderTextColor={theme.colors.textHint}
                style={field}
              />
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, padding: 16, borderRadius: 14, backgroundColor: theme.colors.cardBg, borderWidth: 1, borderColor: theme.colors.cardBorder }}>
              <Ionicons name="checkmark" size={16} color={theme.colors.green} />
              <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 12.5, lineHeight: 17.5, color: theme.colors.textMuted, flex: 1 }}>
                You'll confirm with {payLabel.replace('Pay with ', '')} on the next tap. No card
                details needed.
              </Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 18 }}>
            <Ionicons name="lock-closed-outline" size={12} color={theme.colors.textFaint} />
            <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 11, color: theme.colors.textFaint }}>
              Payments are encrypted · test mode
            </Text>
          </View>

          {error && (
            <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 12, lineHeight: 17, color: theme.colors.danger, marginTop: 14, textAlign: 'center' }}>
              {error}
            </Text>
          )}

          <View style={{ marginTop: 20 }}>
            <GradientButton onPress={pay} busy={paying} disabled={!valid}>
              {`${payLabel} · ${total}`}
            </GradientButton>
          </View>
          <View style={{ marginTop: 11 }}>
            <SecondaryButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/create/event'))}>
              Back to review
            </SecondaryButton>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

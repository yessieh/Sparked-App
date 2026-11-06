// Address field + confirm step for the create flows. The event wizard's
// "When & Where" uses it now; Curbside adopts it in stage 3.
//
// WHY A CONFIRM STEP: the old path geocoded silently and took the first hit.
// On 2026-07-21 "123 Rainbow Road" published 632 miles from Sahuarita with no
// error. Here the host SEES every match — its full address and how far it is
// from their Explore location — and picks one, exactly like Explore's place
// picker (LocationControl's PlacePanel), whose states, 44px targets and
// full-contrast card text this reuses.
//
// THE TOWN FALLBACK: an address OpenStreetMap does not know (rural, new
// builds) must not block publishing. "Confirm address anyway" pins the event to
// a town the host picks and marks it approximate (events.location_approximate,
// migration 0035) — Event Detail then says so. The address TEXT is always the
// host's own, stored exactly as typed; only the point comes from the geocoder.
//
// ONE request per Find tap, guarded against double taps; no autocomplete —
// Nominatim's usage policy forbids it, and enforcement is an IP ban on the app.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { milesBetween } from '../lib/distance';
import { geocodeAddresses, geocodePlaces, type AddressCandidate, type PlaceCandidate } from '../lib/geocode';
import { useOrigin } from '../lib/origin';
import { useTheme } from '../theme';
import { FormField } from './AuthControls';

/** The point the event will be pinned to, as the host confirmed it. */
export interface ConfirmedLocation {
  lat: number;
  lng: number;
  /** True = pinned to a TOWN centre because the address was not found. */
  approximate: boolean;
  /** What the host confirmed: the full matched address, or "Town, ST". */
  label: string;
  /** For an exact pin: whether the match was the house itself (false = a
   *  street or area, worded "near"). Always false when approximate. */
  exact: boolean;
}

const TARGET = 44;

/** Visually hidden but in the accessibility tree (interests.tsx's srOnly). */
const srOnly = {
  position: 'absolute' as const,
  width: 1,
  height: 1,
  overflow: 'hidden' as const,
  opacity: 0,
};

type Lookup<T> =
  | { kind: 'idle' }
  | { kind: 'searching' }
  | { kind: 'results'; results: T[] }
  | { kind: 'empty' }
  | { kind: 'failed'; message: string };

/** "0.4 mi", "12 mi", "2,214 mi". */
function formatMiles(mi: number): string {
  return mi < 10 ? `${mi.toFixed(1)} mi` : `${Math.round(mi).toLocaleString('en-US')} mi`;
}

export default function AddressConfirm({
  value,
  onChangeText,
  confirmed,
  onConfirm,
}: {
  value: string;
  onChangeText: (text: string) => void;
  confirmed: ConfirmedLocation | null;
  onConfirm: (location: ConfirmedLocation | null) => void;
}) {
  const theme = useTheme();
  const { place: origin } = useOrigin();
  const [mode, setMode] = useState<'address' | 'town'>('address');
  const [lookup, setLookup] = useState<Lookup<AddressCandidate>>({ kind: 'idle' });
  const [townQuery, setTownQuery] = useState('');
  const [towns, setTowns] = useState<Lookup<PlaceCandidate>>({ kind: 'idle' });
  const busy = useRef(false);

  // ONE status region, mounted from the first render and never re-mounted —
  // only its text changes (a11y Entry 2). Cleared then set a frame later so a
  // repeated message is announced again (interests.tsx's announce()).
  const [announcement, setAnnouncement] = useState('');
  const frame = useRef<number | null>(null);
  const announce = useCallback((message: string) => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    setAnnouncement('');
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      setAnnouncement(message);
    });
  }, []);
  useEffect(() => () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
  }, []);

  const distanceCue = (p: { lat: number; lng: number }) =>
    origin ? `${formatMiles(milesBetween(origin, p))} from ${origin.label} (your Explore location)` : null;

  const findAddress = useCallback(async () => {
    const q = value.trim();
    if (!q || busy.current) return;
    busy.current = true;
    setLookup({ kind: 'searching' });
    announce('Looking that up');
    try {
      const results = await geocodeAddresses(q, origin);
      setLookup(results.length ? { kind: 'results', results } : { kind: 'empty' });
      announce(
        results.length
          ? `${results.length} ${results.length === 1 ? 'match' : 'matches'}. Pick your event's address.`
          : "No match for that address. You can confirm it anyway and pin it to a nearby town.",
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : "Couldn't reach the map service.";
      setLookup({ kind: 'failed', message });
      announce(message);
    } finally {
      busy.current = false;
    }
  }, [value, origin, announce]);

  const findTown = useCallback(async () => {
    const q = townQuery.trim();
    if (!q || busy.current) return;
    busy.current = true;
    setTowns({ kind: 'searching' });
    announce('Looking that up');
    try {
      const results = await geocodePlaces(q);
      setTowns(results.length ? { kind: 'results', results } : { kind: 'empty' });
      announce(results.length ? `${results.length} ${results.length === 1 ? 'place matches' : 'places match'}.` : 'No match for that town.');
    } catch (e) {
      const message = e instanceof Error ? e.message : "Couldn't reach the map service.";
      setTowns({ kind: 'failed', message });
      announce(message);
    } finally {
      busy.current = false;
    }
  }, [townQuery, announce]);

  const reset = () => {
    setMode('address');
    setLookup({ kind: 'idle' });
    setTowns({ kind: 'idle' });
  };

  // Editing the text after confirming clears the confirmation: the pin
  // belonged to the old text.
  const changeText = (t: string) => {
    onChangeText(t);
    if (confirmed) {
      onConfirm(null);
      announce('Address changed. Find it again to confirm.');
    }
    if (lookup.kind !== 'idle' || mode !== 'address') reset();
  };

  const body = { fontFamily: theme.fonts.bodyMedium, fontSize: 12.5, lineHeight: 18, color: theme.colors.text } as const;
  const strong = { ...body, fontFamily: theme.fonts.bodySemiBold, fontWeight: '700' as const };
  // Card surface: every line is colors.text (12.62:1). textMuted composites to
  // 4.32:1 on a card and fails 1.4.3 (a11y Entry 2) — do not soften these.
  const card = {
    padding: 14,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.cardBg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    gap: 10,
  } as const;
  const row = (pressed: boolean) => ({
    minHeight: TARGET,
    justifyContent: 'center' as const,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: theme.radii.lg - 4,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    backgroundColor: pressed ? theme.colors.surfaceHover : 'transparent',
    gap: 3,
  });
  const button = (disabled: boolean) => ({
    minHeight: TARGET,
    minWidth: TARGET,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    borderRadius: theme.radii.lg - 4,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    opacity: disabled ? 0.5 : 1,
  });
  const buttonText = { fontFamily: theme.fonts.displayExtraBold, fontWeight: '800' as const, fontSize: 13, color: theme.colors.text };
  const linkText = { fontFamily: theme.fonts.bodySemiBold, fontWeight: '700' as const, fontSize: 13, color: theme.colors.text, textDecorationLine: 'underline' as const };

  const searching = lookup.kind === 'searching' || towns.kind === 'searching';
  const pinNote = (town: string) =>
    `We'll pin your event to ${town}. Attendees will see your address with "(approximate)", and distances are measured from the town's center.`;

  return (
    <View>
      <View role="status" aria-live="polite" style={srOnly}>
        {announcement ? <Text>{announcement}</Text> : null}
      </View>

      <FormField
        label="Address"
        value={value}
        onChangeText={changeText}
        placeholder="Street address, city, state"
        autoComplete="street-address"
        returnKeyType="search"
        onSubmitEditing={confirmed ? undefined : findAddress}
        accessory={
          confirmed ? undefined : (
            <Pressable
              role="button"
              accessibilityLabel="Find this address on the map"
              onPress={findAddress}
              disabled={!value.trim() || searching}
              style={button(!value.trim() || searching)}
            >
              <Text style={buttonText}>Find</Text>
            </Pressable>
          )
        }
      />

      {confirmed ? (
        <View style={[card, { marginTop: -4, marginBottom: 14 }]}>
          <Text style={strong}>
            {confirmed.approximate
              ? `Pinned to ${confirmed.label} (approximate)`
              : confirmed.exact
                ? 'Pinned to this address'
                : 'Pinned near this address'}
          </Text>
          {!confirmed.approximate && <Text style={body}>{confirmed.label}</Text>}
          {distanceCue(confirmed) && <Text style={body}>{distanceCue(confirmed)}</Text>}
          {confirmed.approximate && <Text style={body}>{pinNote(confirmed.label)}</Text>}
          <Pressable
            role="button"
            accessibilityLabel="Change the pinned location"
            onPress={() => {
              onConfirm(null);
              reset();
              announce('Pin cleared. Find the address again to confirm.');
            }}
            style={{ alignSelf: 'flex-start', minHeight: TARGET, justifyContent: 'center' }}
          >
            <Text style={linkText}>Change</Text>
          </Pressable>
        </View>
      ) : mode === 'address' ? (
        <View style={{ marginTop: -4, marginBottom: 14, gap: 10 }}>
          {lookup.kind === 'idle' && (
            <Text style={body}>{"Tap Find to check the address on the map. You can continue once it's confirmed."}</Text>
          )}
          {lookup.kind === 'searching' && <Text style={body}>Looking that up…</Text>}
          {lookup.kind === 'failed' && <Text style={body}>{lookup.message}</Text>}
          {lookup.kind === 'empty' && <Text style={body}>{"We couldn't find that address on the map."}</Text>}
          {lookup.kind === 'results' && (
            <View style={card}>
              <Text style={body}>
                {lookup.results.length === 1
                  ? 'Is this your event’s address? Tap it to confirm.'
                  : `${lookup.results.length} places match. Tap your event’s address to confirm.`}
              </Text>
              {lookup.results.map((r) => (
                <Pressable
                  key={`${r.lat},${r.lng},${r.detail}`}
                  role="button"
                  accessibilityLabel={`Use ${r.exact ? '' : 'near '}${r.detail}${distanceCue(r) ? `, ${distanceCue(r)}` : ''}`}
                  onPress={() => {
                    onConfirm({ lat: r.lat, lng: r.lng, approximate: false, label: r.detail, exact: r.exact });
                    announce(`Pinned ${r.exact ? 'to' : 'near'} ${r.detail}`);
                  }}
                  style={({ pressed }) => row(pressed)}
                >
                  {/* display_name VERBATIM — the string being confirmed. */}
                  <Text style={body}>{r.exact ? r.detail : `Near: ${r.detail}`}</Text>
                  {distanceCue(r) && <Text style={strong}>{distanceCue(r)}</Text>}
                </Pressable>
              ))}
            </View>
          )}
          {(lookup.kind === 'results' || lookup.kind === 'empty') && (
            <Pressable
              role="button"
              onPress={() => {
                setMode('town');
                setTowns({ kind: 'idle' });
                announce('Which town or zip is it near?');
              }}
              style={{ alignSelf: 'flex-start', minHeight: TARGET, justifyContent: 'center' }}
            >
              <Text style={linkText}>Confirm address anyway</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <View style={[card, { marginTop: -4, marginBottom: 14 }]}>
          <Text nativeID="sparked-town-label" style={strong}>
            Which town or zip is it near?
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TextInput
              autoFocus
              value={townQuery}
              onChangeText={setTownQuery}
              onSubmitEditing={findTown}
              returnKeyType="search"
              autoCapitalize="words"
              autoCorrect={false}
              placeholder="Green Valley, AZ"
              placeholderTextColor={theme.colors.textHint}
              aria-label="Town or zip code"
              accessibilityLabel="Town or zip code"
              aria-labelledby="sparked-town-label"
              style={{
                flex: 1,
                backgroundColor: theme.colors.bg,
                borderWidth: 1,
                borderColor: theme.colors.cardBorder,
                borderRadius: theme.radii.lg - 2,
                paddingVertical: 12,
                paddingHorizontal: 14,
                minHeight: TARGET,
                fontFamily: theme.fonts.bodyMedium,
                fontSize: theme.fontSizes.bodySm,
                color: theme.colors.text,
              }}
            />
            <Pressable
              role="button"
              accessibilityLabel="Find this town"
              onPress={findTown}
              disabled={!townQuery.trim() || searching}
              style={button(!townQuery.trim() || searching)}
            >
              <Text style={buttonText}>Find</Text>
            </Pressable>
          </View>
          {towns.kind === 'searching' && <Text style={body}>Looking that up…</Text>}
          {towns.kind === 'failed' && <Text style={body}>{towns.message}</Text>}
          {towns.kind === 'empty' && (
            <Text style={body}>{'No match for that. Try a town and state ("Green Valley, AZ") or a zip code.'}</Text>
          )}
          {towns.kind === 'results' &&
            towns.results.map((t) => (
              <Pressable
                key={`${t.lat},${t.lng},${t.detail}`}
                role="button"
                accessibilityLabel={`Pin to ${t.detail}${distanceCue(t) ? `, ${distanceCue(t)}` : ''}`}
                onPress={() => {
                  onConfirm({ lat: t.lat, lng: t.lng, approximate: true, label: t.label, exact: false });
                  announce(pinNote(t.label));
                }}
                style={({ pressed }) => row(pressed)}
              >
                <Text style={strong}>{t.label}</Text>
                <Text style={body}>{t.detail}</Text>
                {distanceCue(t) && <Text style={body}>{distanceCue(t)}</Text>}
              </Pressable>
            ))}
          <Pressable
            role="button"
            onPress={() => {
              setMode('address');
              announce('Back to the address results.');
            }}
            style={{ alignSelf: 'flex-start', minHeight: TARGET, justifyContent: 'center' }}
          >
            <Text style={linkText}>Cancel</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

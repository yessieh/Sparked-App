// The Explore header's location + radius control — "Sahuarita, AZ · within 25 mi",
// where both values are editable and both persist (lib/origin.tsx).
//
// TWO INTERACTION MODELS, AND THE SPLIT IS THE POINT:
//   RADIUS edits IN PLACE — tap the number, it becomes a small numeric field,
//   blur or Enter commits it clamped to 1-100. This is the frozen reference's
//   affordance verbatim (design-reference/ui_kits/mobile-app/Screens.jsx:164-233),
//   which is also what Notifications' "New events within [##] miles" is locked
//   to mirror (AppScreens.jsx:1296). A number needs no confirmation.
//
//   LOCATION opens a PANEL — because a typed place DOES need confirmation, and
//   the reference has no affordance for that at all (it edits a 5-digit zip in
//   place and trusts the result). A confirm list needs room the inline slot
//   does not have, and a text input needs a real label. See the panel below.
//
// GEOCODE CONFIRMATION IS NOT OPTIONAL. A silent resolution moves someone's
// entire feed without telling them: on 2026-07-21 a typo'd address resolved
// 632 miles off with no error and published there. Even a SINGLE confident hit
// is confirmed here — that incident was a single confident hit.

import React, { useCallback, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { geocodePlaces, type PlaceCandidate } from '../lib/geocode';
import { MAX_RADIUS, MIN_RADIUS, useOrigin, type Place } from '../lib/origin';
import { brand, useTheme } from '../theme';

/** The reference's inline-edit affordance token. KNOWN LIGHT-MODE FAILURE,
 *  kept by ruling 2026-08-20: 8.98:1 on #14213D, 1.64:1 on #f4f5f8 — below
 *  1.4.3. It is LATENT, not live: light mode is unreachable while the
 *  Appearance screen is a stub, and it is logged as that arc's third inherited
 *  failure alongside lightPalette.textMuted and me.tsx:440.
 *  docs/ACCESSIBILITY.md Entry 3. */
const AFFORDANCE = brand.ignitionGold;
/** Composites to #9C7B36 over #14213D = 4.04:1, clearing the 3:1 non-text
 *  floor (WCAG 1.4.11) on its own. */
const UNDERLINE = 'rgba(247,183,49,0.6)';

/** WCAG 2.5.5. Set explicitly rather than left to padding arithmetic — Entry 2
 *  measured these with getBoundingClientRect for exactly that reason. */
const TARGET = 44;

type Phase = 'idle' | 'radius' | 'place';

export default function LocationControl() {
  const theme = useTheme();
  const { place, radius, history, loaded, setPlace, setRadius } = useOrigin();
  const [phase, setPhase] = useState<Phase>('idle');
  const [draftRadius, setDraftRadius] = useState('');

  const commitRadius = useCallback(() => {
    const n = parseInt(draftRadius, 10);
    setRadius(Number.isNaN(n) ? radius : n);
    setPhase('idle');
  }, [draftRadius, radius, setRadius]);

  const connective = {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: theme.fontSizes.bodySm,
    // 4.57:1 on the page background. Its LIGHT value is a pre-existing
    // token-level 1.4.3 failure (3.43:1) owned by the Appearance arc —
    // inherited here, not introduced.
    color: theme.colors.textMuted,
  } as const;

  const value = {
    fontFamily: theme.fonts.bodySemiBold,
    fontWeight: '800',
    fontSize: theme.fontSizes.bodySm,
    color: AFFORDANCE,
  } as const;

  return (
    <View style={{ marginTop: 2 }}>
      {/*
        THE LIVE REGION — mounted from first paint, through the pre-load
        placeholder, and never re-mounted. Entry 2's finding: a region that
        mounts together with its text does not announce, and the failure is
        silent. Only its CHILDREN swap, so a committed location or radius is a
        CHANGE to a region already in the tree.

        Its contents are the two control labels, which is the departure from
        Entry 2's "CTAs sit outside the region" note. Deliberate: here the
        labels ARE the state worth announcing ("Green Valley, AZ, within 25
        miles"), and there is no other chrome inside to be read out.
      */}
      <View
        role="status"
        aria-live="polite"
        style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', minHeight: TARGET }}
      >
        {!loaded ? (
          // NEVER the seed town. Rendering "Sahuarita" here would flash the
          // wrong place at someone whose stored location is elsewhere, and fire
          // a wasted RPC against it. See OriginContextValue.loaded.
          <Text style={connective}>Finding your area…</Text>
        ) : (
          <>
            <Pressable
              role="button"
              accessibilityLabel={`Change location. Currently ${place?.label ?? 'not set'}`}
              onPress={() => setPhase(phase === 'place' ? 'idle' : 'place')}
              style={{ minHeight: TARGET, justifyContent: 'center', paddingRight: 2 }}
            >
              <View style={{ borderBottomWidth: 1.5, borderStyle: 'dotted', borderColor: UNDERLINE }}>
                <Text style={value}>{place?.label}</Text>
              </View>
            </Pressable>

            <Text style={[connective, { paddingHorizontal: 6 }]}>·</Text>
            <Text style={connective}>within</Text>

            {phase === 'radius' ? (
              <TextInput
                autoFocus
                inputMode="numeric"
                maxLength={3}
                value={draftRadius}
                onChangeText={(t) => setDraftRadius(t.replace(/[^0-9]/g, '').slice(0, 3))}
                onBlur={commitRadius}
                onSubmitEditing={commitRadius}
                aria-label="Search radius in miles"
                accessibilityLabel="Search radius in miles"
                style={{
                  marginHorizontal: 6,
                  minWidth: 46,
                  minHeight: TARGET - 10,
                  paddingHorizontal: 8,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: UNDERLINE,
                  backgroundColor: 'rgba(247,183,49,0.14)',
                  fontFamily: theme.fonts.bodySemiBold,
                  fontWeight: '800',
                  fontSize: theme.fontSizes.bodySm,
                  color: AFFORDANCE,
                }}
              />
            ) : (
              <Pressable
                role="button"
                accessibilityLabel={`Change search radius. Currently ${radius} miles`}
                onPress={() => {
                  setDraftRadius(String(radius));
                  setPhase('radius');
                }}
                // minWidth as well as minHeight: 2.5.5 is 44x44, and a
                // two-digit number in a 6pt-padded box measured 29 wide in the
                // DOM. Height alone passing is exactly the half-check that
                // makes this look done.
                style={{
                  minHeight: TARGET,
                  minWidth: TARGET,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 6,
                }}
              >
                <View style={{ borderBottomWidth: 1.5, borderStyle: 'dotted', borderColor: UNDERLINE }}>
                  <Text style={value}>{radius}</Text>
                </View>
              </Pressable>
            )}

            <Text style={connective}>mi</Text>
          </>
        )}
      </View>

      {/* The panel sits OUTSIDE the live region — it is a form, and a region
          re-announces everything it contains on every transition. */}
      {phase === 'place' && (
        <PlacePanel
          history={history}
          onPick={(p) => {
            setPlace(p);
            setPhase('idle');
          }}
          onClose={() => setPhase('idle')}
        />
      )}
    </View>
  );
}

type PanelState =
  | { kind: 'input' }
  | { kind: 'searching' }
  | { kind: 'results'; results: PlaceCandidate[] }
  | { kind: 'empty' }
  | { kind: 'failed'; message: string };

/**
 * The confirm panel. Typed query -> candidates -> the user picks one.
 *
 * CONTRAST CONSTRAINT, from docs/ACCESSIBILITY.md Entry 2 and binding here:
 * this is a CARD surface, and `textMuted` composites to 4.32:1 against a card
 * (#1d2a45) — a 1.4.3 FAILURE. So every text line on this panel is
 * `colors.text` (12.62:1). Do not "soften" a line here to textMuted or
 * textFaint without re-measuring; that is precisely the edit the constraint
 * was written to catch.
 */
function PlacePanel({
  history,
  onPick,
  onClose,
}: {
  history: Place[];
  onPick: (place: Place) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [state, setState] = useState<PanelState>({ kind: 'input' });
  /** In-flight guard. Nominatim's policy is ~1 req/s and enforcement is an IP
   *  ban on the whole app, so requests fire on SUBMIT only, one at a time —
   *  never per keystroke. */
  const busy = useRef(false);

  const search = useCallback(async () => {
    const q = query.trim();
    if (!q || busy.current) return;
    busy.current = true;
    setState({ kind: 'searching' });
    try {
      const results = await geocodePlaces(q);
      setState(results.length ? { kind: 'results', results } : { kind: 'empty' });
    } catch (e) {
      setState({
        kind: 'failed',
        message: e instanceof Error ? e.message : "Couldn't reach the location service.",
      });
    } finally {
      busy.current = false;
    }
  }, [query]);

  const body = {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 12.5,
    lineHeight: 18,
    color: theme.colors.text, // see the card-surface constraint above
  } as const;

  return (
    <View
      style={{
        marginTop: 10,
        padding: 14,
        borderRadius: theme.radii.lg,
        backgroundColor: theme.colors.cardBg,
        borderWidth: 1,
        borderColor: theme.colors.cardBorder,
        gap: 10,
      }}
    >
      <Text
        nativeID="sparked-place-label"
        style={{
          fontFamily: theme.fonts.bodySemiBold,
          fontSize: theme.fontSizes.caption,
          color: theme.colors.text,
        }}
      >
        Town or zip code
      </Text>

      <TextInput
        autoFocus
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={search}
        returnKeyType="search"
        autoCapitalize="words"
        autoCorrect={false}
        placeholder="Green Valley, AZ"
        placeholderTextColor={theme.colors.textHint}
        // A placeholder is not a label — it disappears on first keystroke and
        // is not reliably exposed. aria-label covers web, accessibilityLabel
        // covers native; aria-labelledby ties it to the visible text above.
        aria-label="Town or zip code"
        accessibilityLabel="Town or zip code"
        aria-labelledby="sparked-place-label"
        style={{
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

      {state.kind === 'searching' && <Text style={body}>Looking that up…</Text>}

      {state.kind === 'empty' && (
        <Text style={body}>
          No match for that. Try a town and state ("Green Valley, AZ") or a zip code.
        </Text>
      )}

      {state.kind === 'failed' && <Text style={body}>{state.message}</Text>}

      {state.kind === 'results' && (
        <>
          {/* The confirmation sentence. It names what will change, because what
              changes is the whole feed. */}
          <Text style={body}>
            {state.results.length === 1
              ? 'Is this the right place? Your feed will measure distance from here.'
              : `${state.results.length} places match. Pick the right one — your feed will measure distance from it.`}
          </Text>
          {state.results.map((r) => (
            <Pressable
              key={`${r.lat},${r.lng},${r.detail}`}
              role="button"
              accessibilityLabel={`Use ${r.detail}`}
              onPress={() => onPick(r)}
              style={({ pressed }) => ({
                minHeight: TARGET,
                justifyContent: 'center',
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: theme.radii.lg - 4,
                borderWidth: 1,
                borderColor: theme.colors.cardBorder,
                backgroundColor: pressed ? theme.colors.surfaceHover : 'transparent',
              })}
            >
              {/* display_name VERBATIM — this is the string the user is being
                  asked to confirm, so it is never trimmed to the short label.
                  Third-party (OpenStreetMap is community-editable) and length-
                  capped at the network boundary; it renders through <Text>,
                  which sets text content and never markup, on every platform. */}
              <Text style={body}>{r.detail}</Text>
            </Pressable>
          ))}
        </>
      )}

      {state.kind === 'input' && history.length > 0 && (
        <>
          <Text style={body}>Recent</Text>
          {history.map((h) => (
            <Pressable
              key={h.label}
              role="button"
              accessibilityLabel={`Use ${h.detail}`}
              // No geocode round trip — these coordinates were confirmed once
              // already and are stored with the label.
              onPress={() => onPick(h)}
              style={({ pressed }) => ({
                minHeight: TARGET,
                justifyContent: 'center',
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: theme.radii.lg - 4,
                borderWidth: 1,
                borderColor: theme.colors.cardBorder,
                backgroundColor: pressed ? theme.colors.surfaceHover : 'transparent',
              })}
            >
              <Text style={body}>{h.label}</Text>
            </Pressable>
          ))}
          {/* THE HISTORY HAS NO DELETE CONTROL, AND THAT IS A KNOWN GAP.
              It ships with the Privacy screen (app/settings/privacy.tsx), a
              7-line stub today, which is a hard dependency for it rather than
              an optional nicety. Recorded in SPARKED_STATE.md and the tracker
              so it is visible rather than implied. Do not add a delete here —
              it belongs on the screen that owns data controls. */}
        </>
      )}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          role="button"
          onPress={state.kind === 'results' || state.kind === 'empty' ? () => setState({ kind: 'input' }) : search}
          disabled={state.kind === 'searching'}
          style={{
            minHeight: TARGET,
            justifyContent: 'center',
            paddingHorizontal: 16,
            borderRadius: theme.radii.lg - 4,
            borderWidth: 1,
            borderColor: theme.colors.borderStrong,
            opacity: state.kind === 'searching' ? 0.5 : 1,
          }}
        >
          <Text style={{ fontFamily: theme.fonts.displayExtraBold, fontWeight: '800', fontSize: 13, color: theme.colors.text }}>
            {state.kind === 'results' || state.kind === 'empty' ? 'Re-enter' : 'Search'}
          </Text>
        </Pressable>
        <Pressable
          role="button"
          onPress={onClose}
          style={{ minHeight: TARGET, justifyContent: 'center', paddingHorizontal: 16 }}
        >
          <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 13, color: theme.colors.text }}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

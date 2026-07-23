// Shared site-map view — a placeholder map surface with vendor pins at their
// RELATIVE 0..1 coordinates, plus (read-only) a vendor directory beneath it.
// ONE component for every surface so they can't drift (same lock as
// EventDetailView reuse):
//   • read-only (Event Detail, full-listing preview, Review map toggle):
//     map + directory, with ONE shared selection state linking them both ways —
//     tap a pin to highlight its row, tap a row to highlight its pin.
//   • interactive (the wizard's Details step): tapping the surface places /
//     moves the SELECTED vendor's pin; pins are inert so every tap reaches the
//     surface, and there is no directory (that step has its own editor list).
//
// The image is a placeholder this stage (no real uploads) — a tinted, bordered
// box with a faint map glyph. Pins are positioned with PERCENTAGES (robust);
// placement + callout collision math use the onLayout-measured pixel size.

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  GestureResponderEvent,
  LayoutChangeEvent,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';

import { useReducedMotion } from '../lib/useReducedMotion';
import { brand, useTheme } from '../theme';
import type { Vendor } from '../lib/vendors';

const PIN = 26; // marker diameter
const PEEK = 5; // directory rows shown before "Show all (N)"
const REST_SCALE = 1.14; // selected pin settles here
const PULSE_SCALE = 1.3; // peak of the brief 2-cycle pulse
const DIM = 0.42; // unselected pin opacity while a selection is active

export interface SiteMapProps {
  vendors: Vendor[];
  /** Placeholder tint (category color) for the map surface. */
  tint?: string;
  height?: number;
  /** Interactive mode: called with 0..1 coords when the surface is tapped. */
  onPlace?: (x: number, y: number) => void;
  /** Interactive mode: index of the vendor currently being pinned (highlighted). */
  selectedIndex?: number | null;
}

/**
 * Where the selected pin's callout goes: centred over the pin, clamped inside
 * the surface, and flipped above/below to avoid COVERING another pin. Scores
 * both candidates by (fits vertically, collisions) and takes the best.
 */
function calloutPlacement(
  sel: { x: number; y: number },
  others: { x: number; y: number }[],
  w: number,
  h: number,
  cw: number,
  ch: number,
) {
  const cx = sel.x * w;
  const cy = sel.y * h;
  const left = Math.min(Math.max(cx - cw / 2, 2), Math.max(2, w - cw - 2));
  const gap = 6;
  const candidates = [cy - PIN / 2 - gap - ch, cy + PIN / 2 + gap];

  const score = (top: number) => {
    const fits = top >= 2 && top + ch <= h - 2;
    let hits = 0;
    for (const o of others) {
      const ox = o.x * w;
      const oy = o.y * h;
      const overlap =
        left < ox + PIN / 2 &&
        left + cw > ox - PIN / 2 &&
        top < oy + PIN / 2 &&
        top + ch > oy - PIN / 2;
      if (overlap) hits += 1;
    }
    return { fits, hits };
  };

  let bestTop = candidates[0];
  let best = { fits: false, hits: Number.POSITIVE_INFINITY };
  for (const top of candidates) {
    const s = score(top);
    const better =
      (s.fits && !best.fits) || (s.fits === best.fits && s.hits < best.hits);
    if (better) {
      best = s;
      bestTop = top;
    }
  }
  // Last resort: never let it leave the surface.
  const top = Math.min(Math.max(bestTop, 2), Math.max(2, h - ch - 2));
  return { left, top };
}

export default function SiteMap({
  vendors,
  tint,
  height = 190,
  onPlace,
  selectedIndex = null,
}: SiteMapProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const interactive = typeof onPlace === 'function';
  const surfaceRef = useRef<View>(null);
  const rowRefs = useRef<Record<number, View | null>>({});
  // Size lives in STATE (not just a ref) because the callout's collision math
  // runs at render time and must re-run once the surface is measured.
  const [box, setBox] = useState({ w: 0, h: 0 });
  /** THE shared selection: drives pin highlight AND directory row highlight. */
  const [selected, setSelected] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  // A BREATH that settles: 2 slow cycles, never a continuous loop. Timing is
  // deliberately unhurried (260ms in / 300ms out ≈ 1.1s total) with inOut
  // easing — the earlier 160ms out/in cadence read as a twitch rather than a
  // breath. Rising slightly faster than it falls is what makes it feel drawn
  // rather than mechanical.
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (interactive || selected === null) return;
    if (reducedMotion) {
      pulse.setValue(0); // end state instantly, no motion
      return;
    }
    pulse.setValue(0);
    const cycle = () => [
      Animated.timing(pulse, { toValue: 1, duration: 260, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      Animated.timing(pulse, { toValue: 0, duration: 300, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
    ];
    const anim = Animated.sequence([...cycle(), ...cycle()]);
    anim.start();
    return () => anim.stop();
  }, [selected, reducedMotion, interactive, pulse]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height: hh } = e.nativeEvent.layout;
    setBox((b) => (b.w === width && b.h === hh ? b : { w: width, h: hh }));
  };

  // onLayout is unreliable on react-native-web for this surface (observed
  // reporting 0×0), and the callout's collision math needs real pixels — so on
  // web we also measure the DOM node into state. Native keeps using onLayout.
  useEffect(() => {
    const node = surfaceRef.current as unknown as { clientWidth?: number; clientHeight?: number } | null;
    const w = node?.clientWidth ?? 0;
    const h = node?.clientHeight ?? 0;
    if (w && h && (w !== box.w || h !== box.h)) setBox({ w, h });
  }, [selected, expanded, vendors.length, box.w, box.h]);

  // Prefer the measured size; fall back to the DOM node on web (onLayout can
  // lag a frame behind the very first tap).
  const measure = () => {
    if (box.w && box.h) return box;
    const node = surfaceRef.current as unknown as { clientWidth?: number; clientHeight?: number } | null;
    if (node && node.clientWidth) return { w: node.clientWidth, h: node.clientHeight ?? 0 };
    return box;
  };

  // Responder release (not Pressable.onPress) — it carries locationX/locationY
  // relative to the surface on both native and web; Pressable's onPress strips
  // them on react-native-web.
  const place = (e: GestureResponderEvent) => {
    if (!interactive) return;
    const { w, h } = measure();
    if (!w || !h) return;
    const x = Math.min(1, Math.max(0, e.nativeEvent.locationX / w));
    const y = Math.min(1, Math.max(0, e.nativeEvent.locationY / h));
    onPlace!(x, y);
  };

  /** Shared selection toggle. `fromPin` also reveals the row in the directory.
   * Effect stays OUT of the state updater (React may invoke updaters twice). */
  const select = (i: number, fromPin: boolean) => {
    const next = selected === i ? null : i;
    setSelected(next);
    if (next !== null && fromPin && Platform.OS === 'web') {
      // Web: bring the matching directory row into view. Native needs a
      // parent-scroll handle it doesn't have here — tracked as a follow-up.
      const node = rowRefs.current[i] as unknown as {
        scrollIntoView?: (o: { block: string; behavior: string }) => void;
      } | null;
      node?.scrollIntoView?.({ block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
    }
  };

  const surfaceStyle = {
    height,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    backgroundColor: tint ? `${tint}14` : theme.colors.cardBg,
    overflow: 'hidden' as const,
  };

  const pins = vendors
    .map((v, i) => ({ v, i }))
    .filter(({ v }) => v.pinX !== null && v.pinY !== null);

  // ---- selected pin's callout: NAME ONLY, edge + collision aware ----
  const selPin = !interactive && selected !== null ? pins.find((p) => p.i === selected) : undefined;
  let callout: { left: number; top: number; width: number; label: string } | null = null;
  if (selPin && box.w && box.h) {
    const label = selPin.v.name;
    const cw = Math.min(150, Math.max(52, 18 + label.length * 6.4));
    const ch = 24;
    const others = pins
      .filter((p) => p.i !== selPin.i)
      .map((p) => ({ x: p.v.pinX as number, y: p.v.pinY as number }));
    const pos = calloutPlacement(
      { x: selPin.v.pinX as number, y: selPin.v.pinY as number },
      others,
      box.w,
      box.h,
      cw,
      ch,
    );
    callout = { ...pos, width: cw, label };
  }

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [REST_SCALE, PULSE_SCALE] });

  const map = (
    <View
      ref={surfaceRef}
      onLayout={onLayout}
      accessibilityLabel={interactive ? "Site map — tap to place the selected vendor's pin" : undefined}
      onStartShouldSetResponder={interactive ? () => true : undefined}
      onResponderRelease={interactive ? place : undefined}
      style={surfaceStyle}
    >
      {/* Faint placeholder watermark — a diagram stand-in, not a real uploaded
          image (real uploads = stage 5, where event_photos gets designed). */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="map-outline" size={30} color={theme.colors.textFaint} />
        <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 10, letterSpacing: 0.4, color: theme.colors.textFaint, marginTop: 6 }}>
          {interactive ? 'Tap to place a pin' : 'Site map'}
        </Text>
      </View>

      {pins.map(({ v, i }) => {
        const isSel = interactive ? selectedIndex === i : selected === i;
        const dimmed = !interactive && selected !== null && !isSel;
        return (
          <View
            key={v.id ?? i}
            // Interactive pins are inert so taps reach the surface; read-mode
            // pins are their own tap targets.
            pointerEvents={interactive ? 'none' : 'auto'}
            style={{
              position: 'absolute',
              left: `${(v.pinX ?? 0) * 100}%`,
              top: `${(v.pinY ?? 0) * 100}%`,
              transform: [{ translateX: -PIN / 2 }, { translateY: -PIN / 2 }],
            }}
          >
            {interactive ? (
              <Pin v={v} active={isSel} theme={theme} />
            ) : (
              <Pressable
                accessibilityLabel={v.name}
                accessibilityState={{ selected: isSel }}
                onPress={() => select(i, true)}
              >
                <Animated.View
                  style={{
                    opacity: dimmed ? DIM : 1,
                    transform: isSel ? [{ scale }] : [{ scale: 1 }],
                  }}
                >
                  <Pin v={v} active={false} selected={isSel} theme={theme} />
                </Animated.View>
              </Pressable>
            )}
          </View>
        );
      })}

      {/* Callout — NAME ONLY, placed so it never covers another pin. */}
      {callout && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: callout.left,
            top: callout.top,
            width: callout.width,
            paddingHorizontal: 8,
            paddingVertical: 5,
            borderRadius: 8,
            backgroundColor: 'rgba(15,26,48,0.96)',
            borderWidth: 1,
            borderColor: brand.sparkGold,
          }}
        >
          <Text numberOfLines={1} style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 11.5, fontWeight: '800', color: '#ffffff' }}>
            {callout.label}
          </Text>
        </View>
      )}
    </View>
  );

  if (interactive) return map;

  // ---- vendor directory (read-only surfaces only) ----
  const shown = expanded ? vendors : vendors.slice(0, PEEK);
  const overflow = vendors.length - PEEK;

  return (
    <View>
      {map}
      <View style={{ marginTop: 12 }}>
        {shown.map((v, i) => {
          const isSel = selected === i;
          return (
            <Pressable
              key={v.id ?? i}
              ref={(n) => {
                rowRefs.current[i] = n;
              }}
              onPress={() => select(i, false)}
              accessibilityLabel={`${v.name} · ${v.vendorType}`}
              accessibilityState={{ selected: isSel }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 8,
                paddingHorizontal: 9,
                marginBottom: 4,
                borderRadius: 11,
                borderWidth: 1,
                borderColor: isSel ? brand.sparkGold : 'transparent',
                backgroundColor: isSel ? 'rgba(255,202,58,0.08)' : 'transparent',
              }}
            >
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(252,163,17,0.12)',
                  borderWidth: 1,
                  borderColor: isSel ? brand.sparkGold : 'rgba(252,163,17,0.28)',
                }}
              >
                <Text style={{ fontFamily: theme.fonts.displayBlack, fontWeight: '900', fontSize: 12, color: brand.brightOrange }}>
                  {(v.name?.[0] ?? '?').toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 13, fontWeight: '700', color: theme.colors.text }}>
                  {v.name}
                </Text>
                <Text numberOfLines={1} style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 11, color: theme.colors.textFaint, marginTop: 1 }}>
                  {v.vendorType}
                </Text>
              </View>
            </Pressable>
          );
        })}

        {/* Peek + expand — same shape as Interests & blocks' "Show more (N)". */}
        {overflow > 0 && (
          <Pressable
            onPress={() => setExpanded((e) => !e)}
            accessibilityLabel={expanded ? 'Show fewer vendors' : `Show all ${vendors.length} vendors`}
            style={{ paddingVertical: 8, paddingHorizontal: 9 }}
          >
            <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 12, fontWeight: '800', color: brand.brightOrange }}>
              {expanded ? 'Show less' : `Show all (${vendors.length})`}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function Pin({
  v,
  active,
  selected = false,
  theme,
}: {
  v: Vendor;
  active: boolean;
  selected?: boolean;
  theme: ReturnType<typeof useTheme>;
}) {
  // `active` = the wizard's placement target (white ring). `selected` = the
  // read-mode directory selection (gold accent ring).
  const ring = selected ? brand.sparkGold : active ? '#ffffff' : 'rgba(255,255,255,0.6)';
  return (
    <View
      style={{
        width: PIN,
        height: PIN,
        borderRadius: PIN / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active || selected ? brand.brightOrange : 'rgba(252,163,17,0.9)',
        borderWidth: selected ? 2.5 : 2,
        borderColor: ring,
        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
      }}
    >
      <Text style={{ fontFamily: theme.fonts.displayBlack, fontWeight: '900', fontSize: 12, color: brand.navy }}>
        {(v.name?.[0] ?? '?').toUpperCase()}
      </Text>
    </View>
  );
}

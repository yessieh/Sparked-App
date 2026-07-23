// Shared site-map view — a placeholder map surface with vendor pins at their
// RELATIVE 0..1 coordinates. ONE component for both surfaces so they can't
// drift (same lock as EventDetailView reuse):
//   • read-only (Event Detail, full-listing preview, Review map toggle):
//     tapping a pin reveals its name/type.
//   • interactive (the wizard's Details step): tapping the surface places /
//     moves the SELECTED vendor's pin; pins themselves are inert so every tap
//     reaches the surface.
//
// The image is a placeholder this stage (no real uploads) — a tinted, bordered
// box with a faint map glyph. Pins are positioned with PERCENTAGES (robust, no
// measurement needed to render); placement math converts a tap's locationX/Y
// against the onLayout-measured size into 0..1.

import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { GestureResponderEvent, LayoutChangeEvent, Pressable, Text, View } from 'react-native';

import { brand, useTheme } from '../theme';
import type { Vendor } from '../lib/vendors';

const PIN = 26; // marker diameter

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

export default function SiteMap({ vendors, tint, height = 190, onPlace, selectedIndex = null }: SiteMapProps) {
  const theme = useTheme();
  const interactive = typeof onPlace === 'function';
  const surfaceRef = useRef<View>(null);
  const size = useRef({ w: 0, h: 0 });
  // Read-only: which pin's label is open (tap to toggle). One at a time.
  const [openPin, setOpenPin] = useState<number | null>(null);

  const onLayout = (e: LayoutChangeEvent) => {
    size.current = { w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height };
  };

  // Prefer the onLayout size; fall back to the DOM node on web (onLayout can lag
  // a frame behind the first tap). Native always has the onLayout size by press.
  const measure = () => {
    if (size.current.w && size.current.h) return size.current;
    const node = surfaceRef.current as unknown as { clientWidth?: number; clientHeight?: number } | null;
    if (node && node.clientWidth) return { w: node.clientWidth, h: node.clientHeight ?? 0 };
    return size.current;
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

  const Marker = ({ v, i }: { v: Vendor; i: number }) => {
    const active = interactive ? selectedIndex === i : openPin === i;
    return (
      <View
        // In interactive mode pins are inert so taps reach the surface; in
        // read mode each pin is its own tap target for its label.
        pointerEvents={interactive ? 'none' : 'auto'}
        style={{
          position: 'absolute',
          left: `${(v.pinX ?? 0) * 100}%`,
          top: `${(v.pinY ?? 0) * 100}%`,
          transform: [{ translateX: -PIN / 2 }, { translateY: -PIN / 2 }],
          alignItems: 'center',
        }}
      >
        {/* Read-mode label callout above the pin. */}
        {!interactive && active && (
          <View
            style={{
              position: 'absolute',
              bottom: PIN + 4,
              minWidth: 88,
              maxWidth: 160,
              paddingHorizontal: 9,
              paddingVertical: 6,
              borderRadius: 9,
              backgroundColor: 'rgba(15,26,48,0.96)',
              borderWidth: 1,
              borderColor: 'rgba(252,163,17,0.4)',
            }}
          >
            <Text numberOfLines={1} style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 11.5, fontWeight: '800', color: '#ffffff' }}>
              {v.name}
            </Text>
            <Text numberOfLines={1} style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 10, color: 'rgba(238,240,255,0.6)', marginTop: 1 }}>
              {v.vendorType}
            </Text>
          </View>
        )}
        {interactive ? (
          <Pin v={v} i={i} active={active} theme={theme} />
        ) : (
          <Pressable accessibilityLabel={`${v.name} · ${v.vendorType}`} onPress={() => setOpenPin((p) => (p === i ? null : i))}>
            <Pin v={v} i={i} active={active} theme={theme} />
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <View
      ref={surfaceRef}
      onLayout={onLayout}
      accessibilityLabel={interactive ? "Site map — tap to place the selected vendor's pin" : undefined}
      onStartShouldSetResponder={interactive ? () => true : undefined}
      onResponderRelease={interactive ? place : undefined}
      style={surfaceStyle}
    >
      {/* Faint placeholder watermark — this is a diagram stand-in, not a real
          uploaded image (real uploads = stage 5). */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="map-outline" size={30} color={theme.colors.textFaint} />
        <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 10, letterSpacing: 0.4, color: theme.colors.textFaint, marginTop: 6 }}>
          {interactive ? 'Tap to place a pin' : 'Site map'}
        </Text>
      </View>
      {pins.map(({ v, i }) => (
        <Marker key={v.id ?? i} v={v} i={i} />
      ))}
    </View>
  );
}

function Pin({ v, i, active, theme }: { v: Vendor; i: number; active: boolean; theme: ReturnType<typeof useTheme> }) {
  return (
    <View
      style={{
        width: PIN,
        height: PIN,
        borderRadius: PIN / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? brand.brightOrange : 'rgba(252,163,17,0.9)',
        borderWidth: 2,
        borderColor: active ? '#ffffff' : 'rgba(255,255,255,0.6)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
      }}
    >
      <Text style={{ fontFamily: theme.fonts.displayBlack, fontWeight: '900', fontSize: 12, color: brand.navy }}>
        {(v.name?.[0] ?? '?').toUpperCase()}
      </Text>
    </View>
  );
}

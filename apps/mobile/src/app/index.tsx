// ============================================================================
// TEMPORARY TOKEN GALLERY — throwaway proof screen for the design-system
// stage. Verifies every theme token, both logo modes, and the font loading.
// DELETE THIS SCREEN when the first real screen lands. Not a real app surface.
// ============================================================================

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import SparkedLogo from '../components/SparkedLogo';
import {
  brand,
  darkPalette,
  lightPalette,
  sparkGradient,
  tracking,
  trackingEm,
  useTheme,
  useThemePreference,
  type Palette,
  type ThemePreference,
} from '../theme';

const PREFERENCES: ThemePreference[] = ['system', 'dark', 'light'];

function SectionTitle({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text
      style={{
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSizes.eyebrow,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: tracking(trackingEm.eyebrow, theme.fontSizes.eyebrow),
        color: brand.brightOrange,
        marginTop: theme.spacing.xxxl,
        marginBottom: theme.spacing.md,
      }}
    >
      {children}
    </Text>
  );
}

function Swatch({ name, value, border }: { name: string; value: string; border?: string }) {
  const theme = useTheme();
  return (
    <View style={{ width: 148, marginBottom: theme.spacing.md }}>
      <View
        style={{
          height: 56,
          borderRadius: theme.radii.md,
          backgroundColor: value,
          borderWidth: 1,
          borderColor: border ?? theme.colors.cardBorder,
        }}
      />
      <Text style={[styles.swatchName, { color: theme.colors.text, fontFamily: theme.fonts.bodySemiBold }]}>
        {name}
      </Text>
      <Text style={[styles.swatchValue, { color: theme.colors.textMuted, fontFamily: theme.fonts.body }]}>
        {value}
      </Text>
    </View>
  );
}

function PaletteGrid({ palette }: { palette: Palette }) {
  return (
    <View style={styles.row}>
      {(Object.keys(palette) as (keyof Palette)[]).map((key) => (
        <Swatch key={key} name={key} value={palette[key]} />
      ))}
    </View>
  );
}

export default function TokenGallery() {
  const theme = useTheme();
  const { preference, setPreference } = useThemePreference();

  const typeSamples: {
    label: string;
    family: string;
    size: number;
    weight?: '700' | '800' | '900';
  }[] = [
    { label: 'Display / Montserrat Black 56', family: theme.fonts.displayBlack, size: theme.fontSizes.display, weight: '900' },
    { label: 'H1 / Montserrat Black 36', family: theme.fonts.displayBlack, size: theme.fontSizes.h1, weight: '900' },
    { label: 'H2 / Montserrat ExtraBold 28', family: theme.fonts.displayExtraBold, size: theme.fontSizes.h2, weight: '800' },
    { label: 'H3 / Montserrat Bold 20', family: theme.fonts.displayBold, size: theme.fontSizes.h3, weight: '700' },
    { label: 'Body / Inter Regular 16', family: theme.fonts.body, size: theme.fontSizes.body },
    { label: 'Body small / Inter Medium 14', family: theme.fonts.bodyMedium, size: theme.fontSizes.bodySm },
    { label: 'Caption / Inter Regular 12', family: theme.fonts.body, size: theme.fontSizes.caption },
    { label: 'Eyebrow / Inter SemiBold 10', family: theme.fonts.bodySemiBold, size: theme.fontSizes.eyebrow },
    { label: 'Tick / Inter Regular 9', family: theme.fonts.body, size: theme.fontSizes.tick },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ padding: theme.spacing.xxl, paddingBottom: 80, maxWidth: 760, width: '100%', alignSelf: 'center' }}
    >
      {/* ---- temporary banner ---- */}
      <View
        style={{
          borderRadius: theme.radii.md,
          borderWidth: 1,
          borderColor: theme.colors.borderStrong,
          borderStyle: 'dashed',
          padding: theme.spacing.md,
          marginBottom: theme.spacing.lg,
        }}
      >
        <Text
          style={{
            fontFamily: theme.fonts.bodySemiBold,
            fontSize: theme.fontSizes.caption,
            color: theme.colors.textMuted,
          }}
        >
          TEMPORARY TOKEN GALLERY — design-system proof screen. Delete when real
          screens land.
        </Text>
      </View>

      {/* ---- theme preference toggle ---- */}
      <View style={[styles.row, { gap: theme.spacing.sm }]}>
        {PREFERENCES.map((p) => {
          const active = preference === p;
          return (
            <Pressable
              key={p}
              onPress={() => setPreference(p)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: theme.radii.pill,
                borderWidth: 1,
                borderColor: active ? brand.brightOrange : theme.colors.cardBorder,
                backgroundColor: active ? theme.colors.surfaceHover : theme.colors.cardBg,
              }}
            >
              <Text
                style={{
                  fontFamily: theme.fonts.bodySemiBold,
                  fontSize: theme.fontSizes.bodySm,
                  color: active ? theme.colors.text : theme.colors.textMuted,
                  textTransform: 'capitalize',
                }}
              >
                {p}
              </Text>
            </Pressable>
          );
        })}
        <Text
          style={{
            alignSelf: 'center',
            fontFamily: theme.fonts.body,
            fontSize: theme.fontSizes.caption,
            color: theme.colors.textFaint,
          }}
        >
          resolved: {theme.mode}
        </Text>
      </View>

      {/* ---- logo ---- */}
      <SectionTitle>Logo — Twin Flames (lockup + icon, both modes)</SectionTitle>
      <View style={[styles.row, { gap: theme.spacing.lg }]}>
        <View style={[styles.logoTile, { backgroundColor: brand.navy }]}>
          <SparkedLogo mode="dark" variant="lockup" size={48} />
          <Text style={[styles.tileLabel, { fontFamily: theme.fonts.body }]}>dark / lockup</Text>
        </View>
        <View style={[styles.logoTile, { backgroundColor: lightPalette.bg, borderWidth: 1, borderColor: lightPalette.cardBorder }]}>
          <SparkedLogo mode="light" variant="lockup" size={48} />
          <Text style={[styles.tileLabel, { color: lightPalette.textMuted, fontFamily: theme.fonts.body }]}>light / lockup</Text>
        </View>
        <View style={[styles.logoTile, { backgroundColor: brand.navy }]}>
          <SparkedLogo mode="dark" variant="icon" size={48} />
          <Text style={[styles.tileLabel, { fontFamily: theme.fonts.body }]}>icon</Text>
        </View>
      </View>

      {/* ---- spark gradient ---- */}
      <SectionTitle>Spark gradient — 135° coral→orange→gold (actionable only)</SectionTitle>
      <View style={{ borderRadius: theme.radii.lg, overflow: 'hidden', height: 64 }}>
        <Svg width="100%" height="64">
          <Defs>
            <LinearGradient id="spark-swatch" x1="0" y1="0" x2="1" y2="1">
              {sparkGradient.stops.map((s) => (
                <Stop key={s.offset} offset={`${s.offset}`} stopColor={s.color} />
              ))}
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="64" fill="url(#spark-swatch)" />
        </Svg>
      </View>
      <View style={[styles.row, { marginTop: theme.spacing.md }]}>
        <Swatch name="sparkCoral" value={brand.sparkCoral} />
        <Swatch name="sparkOrange" value={brand.sparkOrange} />
        <Swatch name="sparkGold" value={brand.sparkGold} />
      </View>

      {/* ---- brand constants ---- */}
      <SectionTitle>Brand constants (mode-independent)</SectionTitle>
      <View style={styles.row}>
        <Swatch name="navy" value={brand.navy} />
        <Swatch name="deepNavy" value={brand.deepNavy} />
        <Swatch name="flameRed" value={brand.flameRed} />
        <Swatch name="brightOrange" value={brand.brightOrange} />
        <Swatch name="ignitionGold" value={brand.ignitionGold} />
      </View>

      {/* ---- active palette ---- */}
      <SectionTitle>{`Active palette (${theme.mode})`}</SectionTitle>
      <PaletteGrid palette={theme.colors} />

      {/* ---- opposite palette, for reference ---- */}
      <SectionTitle>{`Opposite palette (${theme.mode === 'dark' ? 'light' : 'dark'}) — reference values`}</SectionTitle>
      <PaletteGrid palette={theme.mode === 'dark' ? lightPalette : darkPalette} />

      {/* ---- type scale ---- */}
      <SectionTitle>Type scale</SectionTitle>
      {typeSamples.map((t) => (
        <View key={t.label} style={{ marginBottom: theme.spacing.lg }}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: t.family,
              fontSize: t.size,
              fontWeight: t.weight,
              color: theme.colors.text,
              letterSpacing: t.weight ? tracking(trackingEm.tight, t.size) : undefined,
            }}
          >
            Local, honestly.
          </Text>
          <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.caption, color: theme.colors.textFaint }}>
            {t.label}
          </Text>
        </View>
      ))}
      <Text
        style={{
          fontFamily: theme.fonts.bodySemiBold,
          fontSize: theme.fontSizes.eyebrow,
          fontWeight: '900',
          textTransform: 'uppercase',
          letterSpacing: tracking(trackingEm.eyebrow, theme.fontSizes.eyebrow),
          color: brand.brightOrange,
        }}
      >
        Eyebrow sample — 0.25em tracking
      </Text>

      {/* ---- radii ---- */}
      <SectionTitle>Radii</SectionTitle>
      <View style={[styles.row, { alignItems: 'flex-end' }]}>
        {(Object.entries(theme.radii) as [string, number][]).map(([name, r]) => (
          <View key={name} style={{ alignItems: 'center', marginRight: theme.spacing.md, marginBottom: theme.spacing.md }}>
            <View
              style={{
                width: 72,
                height: 56,
                borderRadius: r,
                backgroundColor: theme.colors.cardBg,
                borderWidth: 1,
                borderColor: theme.colors.borderStrong,
              }}
            />
            <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.caption, color: theme.colors.textMuted, marginTop: 4 }}>
              {name} {r === 9999 ? '' : r}
            </Text>
          </View>
        ))}
      </View>

      {/* ---- spacing ---- */}
      <SectionTitle>Spacing</SectionTitle>
      {(Object.entries(theme.spacing) as [string, number][]).map(([name, s]) => (
        <View key={name} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <View style={{ width: s, height: 14, backgroundColor: brand.sparkOrange, borderRadius: 2 }} />
          <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.caption, color: theme.colors.textMuted, marginLeft: 10 }}>
            {name} = {s}
          </Text>
        </View>
      ))}

      {/* ---- shadows ---- */}
      <SectionTitle>Shadows</SectionTitle>
      <View style={[styles.row, { gap: theme.spacing.xxl }]}>
        {(Object.entries(theme.shadows) as [string, string][]).map(([name, shadow]) => (
          <View key={name} style={{ alignItems: 'center', marginBottom: theme.spacing.md }}>
            <View
              style={{
                width: 120,
                height: 72,
                borderRadius: theme.radii.lg,
                backgroundColor: theme.colors.cardBg,
                borderWidth: 1,
                borderColor: theme.colors.cardBorder,
                boxShadow: shadow,
              }}
            />
            <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.caption, color: theme.colors.textMuted, marginTop: 6 }}>
              {name}
            </Text>
          </View>
        ))}
      </View>

      {/* ---- semantic green ---- */}
      <SectionTitle>Semantic green (free / going / confirmed — never a category color)</SectionTitle>
      <View style={styles.row}>
        <Swatch name={`green (${theme.mode})`} value={theme.colors.green} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  swatchName: { fontSize: 12, marginTop: 6 },
  swatchValue: { fontSize: 11, marginTop: 1 },
  logoTile: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  tileLabel: { fontSize: 11, color: 'rgba(238,240,255,0.5)' },
});

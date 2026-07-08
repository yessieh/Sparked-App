// SparkedLogo — react-native-svg port of design-reference/source/SparkedLogo.tsx.
// Same props (mode, variant, size); className dropped (RN uses style).
// Twin Flames: two opposing flame strokes (coral base rising, gold tip
// descending) forming an implied S. Wordmark: Montserrat Black — spark-
// gradient text in dark mode, flat brand navy in light mode (gradient text is
// dark-mode only, per Brand System).

import React, { useId } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { brand } from '../theme/colors';
import { fontFamilies } from '../theme/typography';

export type LogoMode = 'dark' | 'light';
export type LogoVariant = 'lockup' | 'icon';

export interface SparkedLogoProps {
  mode?: LogoMode;
  variant?: LogoVariant;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

const ICON_ASPECT = 56 / 76;

const TwinFlamesIcon: React.FC<{ size: number; idPrefix: string }> = ({
  size,
  idPrefix,
}) => {
  const width = Math.round(size * ICON_ASPECT);
  return (
    <Svg width={width} height={size} viewBox="0 0 56 76" fill="none">
      <Defs>
        <LinearGradient id={`${idPrefix}-base`} x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor={brand.sparkCoral} />
          <Stop offset="1" stopColor={brand.sparkOrange} />
        </LinearGradient>
        <LinearGradient id={`${idPrefix}-tip`} x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor={brand.sparkOrange} />
          <Stop offset="1" stopColor={brand.sparkGold} />
        </LinearGradient>
      </Defs>
      <Path
        d="M28 68
           C16 58 8 46 10 32
           C12 20 20 12 28 10
           C24 16 22 24 24 32
           C26 40 32 44 32 52
           C32 60 30 66 28 68Z"
        fill={`url(#${idPrefix}-base)`}
      />
      <Path
        d="M28 8
           C38 16 46 26 44 38
           C42 50 34 58 28 60
           C32 54 34 46 32 38
           C30 30 24 26 24 18
           C24 12 26 9 28 8Z"
        fill={`url(#${idPrefix}-tip)`}
        opacity={0.9}
      />
    </Svg>
  );
};

const Wordmark: React.FC<{ mode: LogoMode; fontSize: number; idPrefix: string }> = ({
  mode,
  fontSize,
  idPrefix,
}) => {
  // SVG text so the dark-mode gradient fill works identically on iOS/Android/web.
  const width = Math.ceil(fontSize * 4.6);
  const height = Math.ceil(fontSize * 1.25);
  const gradientId = `${idPrefix}-word`;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {mode === 'dark' && (
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={brand.sparkCoral} />
            <Stop offset="0.5" stopColor={brand.sparkOrange} />
            <Stop offset="1" stopColor={brand.sparkGold} />
          </LinearGradient>
        </Defs>
      )}
      <SvgText
        x={0}
        y={fontSize}
        fontFamily={fontFamilies.displayBlack}
        fontSize={fontSize}
        fontWeight="900"
        letterSpacing={-0.01 * fontSize}
        fill={mode === 'dark' ? `url(#${gradientId})` : brand.navy}
      >
        Sparked
      </SvgText>
    </Svg>
  );
};

const SparkedLogo: React.FC<SparkedLogoProps> = ({
  mode = 'dark',
  variant = 'lockup',
  size = 32,
  style,
}) => {
  // Unique, SVG-safe gradient ids so multiple instances never collide on web.
  const idPrefix = `sparked-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  if (variant === 'icon') {
    return (
      <View style={[{ flexDirection: 'row' }, style]}>
        <TwinFlamesIcon size={size} idPrefix={idPrefix} />
      </View>
    );
  }

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: Math.round(size * 0.3),
        },
        style,
      ]}
    >
      <TwinFlamesIcon size={size} idPrefix={idPrefix} />
      <Wordmark mode={mode} fontSize={Math.round(size * 0.6)} idPrefix={idPrefix} />
    </View>
  );
};

export default SparkedLogo;

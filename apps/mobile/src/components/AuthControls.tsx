// Shared controls for the auth surfaces (auth screen, Me tab).
// CTA hierarchy per SPARKED_STATE: spark gradient = primary actions;
// secondary = transparent + soft border. The white Google button follows the
// proven AuthScreen design (design-reference AppScreens.jsx) — provider
// sign-in affordance, not a landing CTA.

import React, { useId, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { brand, sparkGradient, useTheme } from '../theme';

/** Absolute-fill 135° spark gradient (SVG — the repo's gradient idiom).
 * The gradient id is useId-generated: SVG url(#id) lookups are
 * document-global on web, and screens stay mounted behind modals — a
 * hard-coded id collides with its twin on the covered screen and the fill
 * silently fails. */
export function GradientFill() {
  const id = useId();
  return (
    <Svg
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          {sparkGradient.stops.map((s) => (
            <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100" height="100" fill={`url(#${id})`} />
    </Svg>
  );
}

interface ButtonProps {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Primary CTA — spark gradient, navy label. */
export function GradientButton({ children, onPress, disabled, busy, style }: ButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        {
          borderRadius: theme.radii.lg,
          overflow: 'hidden',
          paddingVertical: 16,
          paddingHorizontal: 20,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          boxShadow: theme.shadows.cta,
        },
        style,
      ]}
    >
      <GradientFill />
      {busy ? (
        <ActivityIndicator color={brand.navy} />
      ) : (
        <Text
          style={{
            fontFamily: theme.fonts.displayBlack,
            fontWeight: '900',
            fontSize: 16,
            letterSpacing: -0.16,
            color: brand.navy,
          }}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}

/** Secondary action — transparent, soft border. */
export function SecondaryButton({ children, onPress, disabled, busy, style }: ButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        {
          borderRadius: theme.radii.lg,
          borderWidth: 1,
          borderColor: theme.colors.borderStrong,
          backgroundColor: pressed ? theme.colors.surfaceHover : theme.colors.cardBg,
          paddingVertical: 14,
          paddingHorizontal: 20,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={theme.colors.text} />
      ) : (
        <Text
          style={{
            fontFamily: theme.fonts.displayExtraBold,
            fontWeight: '800',
            fontSize: 14,
            color: theme.colors.text,
          }}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}

/** Official multicolor Google "G". */
export function GoogleG({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <Path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  );
}

/** White provider button — "Continue with Google" per the proven design. */
export function GoogleButton({ onPress, disabled, busy }: Omit<ButtonProps, 'children'>) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#ffffff',
        borderRadius: theme.radii.lg,
        paddingVertical: 13,
        paddingHorizontal: 18,
        opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
      })}
    >
      {busy ? (
        <ActivityIndicator color={brand.navy} />
      ) : (
        <>
          <GoogleG />
          <Text
            style={{
              fontFamily: theme.fonts.displayExtraBold,
              fontWeight: '800',
              fontSize: 14,
              color: brand.navy,
            }}
          >
            Continue with Google
          </Text>
        </>
      )}
    </Pressable>
  );
}

interface FormFieldProps extends TextInputProps {
  label: string;
}

/** Labeled input matching the prototype's field styling. */
export function FormField({ label, ...inputProps }: FormFieldProps) {
  const theme = useTheme();
  return (
    <View style={{ marginBottom: 14 }}>
      <Text
        style={{
          fontFamily: theme.fonts.bodySemiBold,
          fontSize: theme.fontSizes.caption,
          color: theme.colors.textMuted,
          marginBottom: 7,
        }}
      >
        {label}
      </Text>
      <TextInput
        placeholderTextColor={theme.colors.textHint}
        style={{
          backgroundColor: theme.colors.cardBg,
          borderWidth: 1,
          borderColor: theme.colors.cardBorder,
          borderRadius: theme.radii.lg - 2,
          paddingVertical: 13,
          paddingHorizontal: 15,
          fontFamily: theme.fonts.bodyMedium,
          fontSize: theme.fontSizes.bodySm,
          color: theme.colors.text,
        }}
        {...inputProps}
      />
    </View>
  );
}

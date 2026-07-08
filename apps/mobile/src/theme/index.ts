// Sparked theme — assembly + provider.
// Honors a System / Dark / Light preference (System default; dark-first when
// the OS reports nothing). Persistence of the preference is a later stage —
// this session state only.

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

import { brand, darkPalette, lightPalette, sparkGradient, type Palette } from './colors';
import { darkShadows, lightShadows, radii, spacing, type Shadows } from './spacing';
import {
  fontFamilies,
  fontSizes,
  lineHeights,
  tracking,
  trackingEm,
} from './typography';

export {
  brand,
  darkPalette,
  lightPalette,
  sparkGradient,
  fontFamilies,
  fontSizes,
  lineHeights,
  tracking,
  trackingEm,
  radii,
  spacing,
};
export type { Palette, Shadows };

export type ThemeMode = 'dark' | 'light';
export type ThemePreference = 'system' | ThemeMode;

export interface Theme {
  mode: ThemeMode;
  colors: Palette;
  shadows: Shadows;
  spacing: typeof spacing;
  radii: typeof radii;
  fonts: typeof fontFamilies;
  fontSizes: typeof fontSizes;
}

const darkTheme: Theme = {
  mode: 'dark',
  colors: darkPalette,
  shadows: darkShadows,
  spacing,
  radii,
  fonts: fontFamilies,
  fontSizes,
};

const lightTheme: Theme = {
  mode: 'light',
  colors: lightPalette,
  shadows: lightShadows,
  spacing,
  radii,
  fonts: fontFamilies,
  fontSizes,
};

interface ThemeContextValue {
  theme: Theme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: darkTheme,
  preference: 'system',
  setPreference: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');

  // Dark-first: anything the OS reports other than 'light' resolves to dark.
  const mode: ThemeMode =
    preference === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : preference;

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: mode === 'light' ? lightTheme : darkTheme,
      preference,
      setPreference,
    }),
    [mode, preference],
  );

  return React.createElement(ThemeContext.Provider, { value }, children);
}

export const useTheme = (): Theme => useContext(ThemeContext).theme;

export const useThemePreference = (): Pick<
  ThemeContextValue,
  'preference' | 'setPreference'
> => {
  const { preference, setPreference } = useContext(ThemeContext);
  return { preference, setPreference };
};

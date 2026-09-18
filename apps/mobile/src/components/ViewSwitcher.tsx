// Explore's view switcher — list / map / timeline. Three icon segments taken
// from the reference mockup; nothing else from that mockup's header order is.
//
// THREE `role="button"`s WITH `aria-pressed`, NOT A `role="tablist"`. React
// Native Web's tablist support is thin, and Pill.tsx already established
// aria-pressed as this app's selected-control pattern — consistency with a
// shipped, verified pattern beats theoretical correctness here. The selected
// treatment is Pill's, read from that file rather than invented: spark
// gradient + navy glyph when on, no fill + 1px cardBorder + textMuted when
// off. Same native limitation as Pill: RN maps no trait for aria-pressed, so
// on iOS/Android the state is carried by the gradient alone.

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';

import { brand, useTheme } from '../theme';
import { GradientFill } from './AuthControls';

export type ViewMode = 'list' | 'map' | 'timeline';

/** Same shim as Pill.tsx: RN 0.86 does not type `aria-pressed`, rnw forwards
 *  it. Spread, never inline. */
const ariaPressed = (pressed: boolean): Record<string, boolean> => ({
  'aria-pressed': pressed,
});

/** WCAG 2.5.5 on BOTH axes — an icon-only segment is exactly the control that
 *  passes height and fails width when the target is left to padding
 *  (LocationControl.tsx's 44 × 29). */
const TARGET = 44;

const SEGMENTS: { mode: ViewMode; icon: 'list-outline' | 'map-outline' | 'time-outline'; label: string }[] = [
  { mode: 'list', icon: 'list-outline', label: 'List view' },
  { mode: 'map', icon: 'map-outline', label: 'Map view' },
  { mode: 'timeline', icon: 'time-outline', label: 'Timeline view' },
];

export default function ViewSwitcher({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (next: ViewMode) => void;
}) {
  const theme = useTheme();
  return (
    <View role="group" aria-label="Explore view" style={{ flexDirection: 'row', gap: 6 }}>
      {SEGMENTS.map(({ mode, icon, label }) => {
        const selected = value === mode;
        return (
          <Pressable
            key={mode}
            role="button"
            aria-label={label}
            {...ariaPressed(selected)}
            onPress={() => onChange(mode)}
            style={{
              minHeight: TARGET,
              minWidth: TARGET,
              borderRadius: theme.radii.pill,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
              // Pill.tsx's binding constraint applies verbatim: NO FILL when
              // unselected. textMuted on the bare page clears 4.5:1 by 0.05;
              // on any composited chip it does not.
              borderWidth: selected ? 0 : 1,
              borderColor: theme.colors.cardBorder,
            }}
          >
            {selected && <GradientFill />}
            <Ionicons name={icon} size={18} color={selected ? brand.navy : theme.colors.textMuted} />
          </Pressable>
        );
      })}
    </View>
  );
}

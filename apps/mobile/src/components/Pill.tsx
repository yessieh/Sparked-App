// THE selectable pill. One component, three call sites.
//
// WHY IT WAS EXTRACTED. Two near-identical copies had been written
// independently — `FilterPill` in (tabs)/saved.tsx and the `CategoryPicker`
// pill in create/event.tsx. Same shape, same gradient-when-active language,
// same interface under different prop names, and BOTH carried the same two
// defects:
//
//   1. NO ROLE. react-native-web renders a bare `div[tabindex="0"]`, which a
//      screen reader announces as focusable text rather than a button (WCAG
//      4.1.2). Same finding as Entry 2's, and the same fix GradientButton
//      already carries.
//   2. UNDER TARGET. Height was left to padding arithmetic — `paddingVertical:
//      7` around 12px text measured ~30pt against WCAG 2.5.5's 44. The house
//      rule is LocationControl.tsx:39-41: set the target EXPLICITLY, and set it
//      on BOTH axes, because Entry 3 shipped a control that was 44 tall and 29
//      wide and a height-only assertion called it green.
//
// A third copy was about to be written for Explore search. This is that third
// copy, written once.
//
// SELECTION STATE IS `aria-pressed`, and the reasoning is recorded because the
// obvious alternatives are wrong here:
//   • `accessibilityState={{selected}}` is INERT ON WEB. rnw 0.21.2 has no
//     handler for it in forwardedProps / createDOMProps / Pressable, so it
//     reaches no DOM attribute at all (docs/ACCESSIBILITY.md Entry 5). Every
//     `accessibility*` spelling also logs a deprecation.
//   • `aria-selected` IS typed by RN 0.86, but it is not valid ARIA on
//     `role="button"` — it belongs to option/tab/row.
//   • `aria-pressed` is the correct attribute for a toggle button AND rnw 0.21.2
//     forwards it (dist/modules/forwardedProps/index.js lists it in
//     `accessibilityProps`) — but RN 0.86 does not TYPE it. Hence the shim
//     below rather than an inline prop, which would not compile.
//
// NATIVE LIMITATION, STATED RATHER THAN PAPERED OVER: RN maps no native trait
// for `aria-pressed`, so on iOS/Android the pressed state is carried by the
// label and the gradient alone. Web is the platform this arc can verify and the
// platform it is verified on. Logged as an open item in Entry 6.

import React from 'react';
import { Pressable, Text, type StyleProp, type ViewStyle } from 'react-native';

import { brand, useTheme } from '../theme';
import { GradientFill } from './AuthControls';

/** See the header note. Spread, never written inline — RN 0.86's ViewProps has
 *  no `aria-pressed`, so the inline form is a compile error even though the
 *  attribute reaches the DOM perfectly well on web. */
const ariaPressed = (pressed: boolean): Record<string, boolean> => ({
  'aria-pressed': pressed,
});

/** WCAG 2.5.5, set explicitly on both axes. Not inferred from padding — see
 *  the header note and docs/ACCESSIBILITY.md Entry 3. */
const TARGET = 44;

export interface PillProps {
  label: string;
  /** Drives the gradient fill AND `aria-pressed`. */
  selected: boolean;
  onPress: () => void;
  /** Merged ON TOP of the base style, never replacing it. */
  style?: StyleProp<ViewStyle>;
}

export default function Pill({ label, selected, onPress, style }: PillProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      role="button"
      {...ariaPressed(selected)}
      style={[
        {
          borderRadius: theme.radii.pill,
          overflow: 'hidden',
          // Horizontal padding still drives WIDTH for ordinary labels; minWidth
          // is the floor for a short one ("Art", "All") that would otherwise
          // render narrower than the target.
          paddingHorizontal: 16,
          minHeight: TARGET,
          minWidth: TARGET,
          alignItems: 'center',
          justifyContent: 'center',
          // NO FILL WHEN UNSELECTED, AND THIS IS A BINDING CONSTRAINT — see
          // docs/ACCESSIBILITY.md Entry 7. Painting `iconChipBg` here put the
          // label on a composited #1D2A45 and measured 4.32:1, a live 1.4.3
          // failure; on the bare page background the same token measures
          // 4.55:1. THAT CLEARS THE FLOOR BY 0.05. Any fill behind this label,
          // any darkening of the page beneath it, or any move of the label off
          // `textMuted` re-breaks it, and the breakage is invisible to the
          // typechecker and to a geometry probe.
          borderWidth: selected ? 0 : 1,
          borderColor: theme.colors.cardBorder,
        },
        style,
      ]}
    >
      {/* The spark gradient on an active filter pill is an explicitly
          sanctioned use — theme/colors.ts:44-48 reserves it for actionable
          elements and names active filter pills among them. */}
      {selected && <GradientFill />}
      <Text
        style={{
          fontFamily: theme.fonts.bodySemiBold,
          fontWeight: '800',
          fontSize: theme.fontSizes.caption,
          // Selected: navy on the spark gradient — 5.32:1 against its darkest
          // stop, 10.47:1 against its lightest. Unselected: textMuted on the
          // BARE page background at 4.55:1, which is the constraint recorded
          // above and clears 4.5:1 by 0.05.
          color: selected ? brand.navy : theme.colors.textMuted,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

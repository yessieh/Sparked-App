// Enter activates a role="link" Pressable — web only.
//
// react-native-web 0.21.2 does NOT call onPress on Enter for an element whose
// role is "link": on key-up it treats it as a native interactive element and
// skips onPress, expecting a real <a href> whose browser default turns Enter
// into a click (dist/modules/usePressEvents/PressResponder.js:217-221). A
// Pressable with role="link" renders a <div role="link"> with no href, so
// without this it is focusable and inert to the keyboard. Measured 2026-11-01
// (polish batch, prompt 3). Mouse clicks are unaffected — they reach onPress
// through the native click (:302-315), which Enter on a <div> never produces,
// so this cannot double-fire.
//
// Enter only: links take Enter, Space is for buttons. Spread it onto the
// Pressable — RN 0.86 does not type onKeyDown on Pressable (rnw forwards it),
// hence the untyped props object, EventStub's titleLinkProps precedent.

import { Platform } from 'react-native';

type KeyEvent = { key?: string; preventDefault?: () => void };

/** Props that make Enter fire `onPress` on a role="link" Pressable. Pass
 *  null/undefined when the link is inactive: nothing is attached. Returns
 *  nothing on native. */
export function enterActivates(onPress: (() => unknown) | null | undefined): Record<string, unknown> {
  if (Platform.OS !== 'web' || !onPress) return {};
  return {
    onKeyDown: (e: KeyEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault?.();
        onPress();
      }
    },
  };
}

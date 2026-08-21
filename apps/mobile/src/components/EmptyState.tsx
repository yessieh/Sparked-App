// The shared "nothing to show you" shell — cold-start empty feed and event
// not-found both render through here.
//
// IT EXISTS TO OWN THE ANNOUNCEMENT, not to save duplicated markup. A live
// region only announces content that changes AFTER the region is already in
// the tree; mounting the region and its text together is unreliable across
// screen readers. So this component spans BOTH phases — `pending` renders the
// spinner INSIDE the same region node that later holds the message — and the
// caller must render it for the wait as well as for the result. Two copies of
// that wiring would have drifted; one cannot.
//
// The CTAs sit OUTSIDE the region deliberately. A live region re-announces
// everything it contains, so button labels inside it would be read out on
// every transition.
//
// Platform coverage of the announcement, verified in the installed packages
// rather than assumed (docs/ACCESSIBILITY.md Entry 2 records the evidence):
//   web     — `aria-live` is forwarded to the DOM attribute by
//             react-native-web 0.21.2 (forwardedProps/index.js:47).
//   Android — react-native 0.86 maps `aria-live` to accessibilityLiveRegion
//             (View.js:66-68), which is the Android-only native mechanism.
//   iOS     — neither of the above does anything, so the imperative
//             announcement below covers it. It is gated to iOS so Android
//             does not announce twice; on web RNW compiles
//             announceForAccessibility to an explicit no-op anyway.
//
// NO ICON TILE. The design reference's empty state (Screens.jsx:784) opens
// with a 52x52 icon tile; it was dropped by ruling — it carries no
// information and it is the most error-page-shaped element available.

import React, { useEffect, type ReactNode } from 'react';
import { AccessibilityInfo, ActivityIndicator, Platform, Text, View } from 'react-native';

import { brand, useTheme } from '../theme';

interface Props {
  /** True while the underlying read is still in flight. Renders the spinner
   *  inside the live region so the region node itself never re-mounts. */
  pending: boolean;
  headline: string;
  body: string;
  /** CTAs. Rendered outside the live region — see the header note. */
  children?: ReactNode;
}

export default function EmptyState({ pending, headline, body, children }: Props) {
  const theme = useTheme();

  // iOS only — see the header note on double announcements.
  useEffect(() => {
    if (pending) return;
    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(`${headline}. ${body}`);
    }
  }, [pending, headline, body]);

  return (
    <View style={{ paddingVertical: 48, paddingHorizontal: 20, alignItems: 'center' }}>
      {/* THE LIVE REGION. Mounted in both phases; only its children swap. */}
      <View
        role="status"
        aria-live="polite"
        style={{ alignItems: 'center', minHeight: 64, justifyContent: 'center' }}
      >
        {pending ? (
          <ActivityIndicator color={brand.brightOrange} />
        ) : (
          <>
            <Text
              style={{
                fontFamily: theme.fonts.displayBlack,
                fontWeight: '900',
                fontSize: 15,
                letterSpacing: -0.15,
                // 14.11:1 on the page background. NOT on a card: textMuted
                // below clears 4.5:1 by 0.07 on the bare background and FAILS
                // at 4.32:1 on a card surface. These states stay on the
                // background — see docs/ACCESSIBILITY.md Entry 2.
                color: theme.colors.text,
                textAlign: 'center',
              }}
            >
              {headline}
            </Text>
            <Text
              style={{
                fontFamily: theme.fonts.bodyMedium,
                fontSize: 12.5,
                lineHeight: 19,
                color: theme.colors.textMuted, // 4.57:1 on #14213D
                textAlign: 'center',
                marginTop: 6,
                maxWidth: 300,
              }}
            >
              {body}
            </Text>
          </>
        )}
      </View>

      {!pending && children ? (
        <View style={{ marginTop: 22, alignSelf: 'stretch', alignItems: 'center', gap: 10 }}>
          {children}
        </View>
      ) : null}
    </View>
  );
}

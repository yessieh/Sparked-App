// "You're live" — the publish success screen (design-reference ConfirmScreen).
//
// Lives INSIDE the (tabs) group (in the Explore and Me Stacks, so it has no
// tab button) on purpose: the tab bar is hidden through the focused create
// flow — wizard + checkout — and RESTORED here, the moment the listing goes
// live, and on every screen after (ruling, publish-walk round 2). Checkout
// opens it in the ME tab on top of Me's main page (useOpenOnMain), dropping the
// create stack, so the host lands back in the normal tab-bar'd app.

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';

import { GradientButton, GradientFill, SecondaryButton } from '../../../components/AuthControls';
import { useGoToMain } from '../../../lib/navigation';
import { brand, useTheme } from '../../../theme';

export default function PublishedScreen() {
  const theme = useTheme();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const goToMain = useGoToMain();
  const navigation = useNavigation();

  // The push that opened this screen leaves its address on the TAB's group
  // route ({ screen: 'published', … }), and the tab bar builds the tab's href
  // from those params (react-navigation/bottom-tabs/views/BottomTabBar.js:288)
  // — so the Me tab read /published even after Back and after leaving Me
  // (measured 2026-11-02). The Stack is mounted by now and no longer reads
  // them; clearing them puts the href back on /me.
  // Deferred a tick: when Me's Stack mounts in the same commit, TabStack's own
  // param strip runs AFTER this effect (parents' effects follow children's)
  // and wrote the old params back (measured 2026-11-02).
  useEffect(() => {
    const parent = navigation.getParent();
    const t = setTimeout(() => parent?.replaceParams({} as never), 0);
    return () => clearTimeout(t);
  }, [navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      <View
        style={{
          width: 84,
          height: 84,
          borderRadius: 9999,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 26,
          boxShadow: '0 14px 40px rgba(255,95,78,0.35)',
        }}
      >
        <GradientFill />
        <Ionicons name="checkmark" size={38} color={brand.navy} />
      </View>
      <Text role="heading" aria-level={1} accessibilityRole="header" style={{ fontFamily: theme.fonts.displayBlack, fontWeight: '900', fontSize: 28, lineHeight: 31, letterSpacing: -0.28, color: theme.colors.text, textAlign: 'center', marginBottom: 12 }}>
        You're live
      </Text>
      <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 14, lineHeight: 22, color: theme.colors.textMuted, textAlign: 'center', marginBottom: 32, maxWidth: 300 }}>
        Your event is on the local feed now — neighbours will see it ranked by how close they
        are, never by an algorithm.
      </Text>
      <View style={{ width: '100%', maxWidth: 300, gap: 12 }}>
        {/* replace (not push): the listing takes this screen's place, so Back
            from it lands on Me's main page, not back here (ruled by Jas
            2026-11-02). Me's main page sits underneath — openOnMain in
            create/checkout.tsx. */}
        <GradientButton onPress={() => eventId && router.replace({ pathname: '/event/[id]', params: { id: eventId } })}>
          View your listing
        </GradientButton>
        <SecondaryButton onPress={() => goToMain('explore')}>Back to the feed</SecondaryButton>
      </View>
    </View>
  );
}

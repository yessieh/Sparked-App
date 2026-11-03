// "You're live" — the publish success screen (design-reference ConfirmScreen).
//
// Lives INSIDE the (tabs) group (in the Explore and Me Stacks, so it has no
// tab button) on purpose: the tab bar is hidden through the focused create
// flow — wizard + checkout — and RESTORED here, the moment the listing goes
// live, and on every screen after (ruling, publish-walk round 2). Checkout
// opens it in the ME tab on top of Me's main page (useOpenOnMain), dropping the
// create stack, so the host lands back in the normal tab-bar'd app.

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useNavigation, useRoute } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { GradientButton, GradientFill, SecondaryButton } from '../../../components/AuthControls';
import { useGoToMain } from '../../../lib/navigation';
import { releasePublishPass, takePublishPass } from '../../../lib/publishPass';
import { brand, useTheme } from '../../../theme';

export default function PublishedScreen() {
  const theme = useTheme();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const goToMain = useGoToMain();
  const navigation = useNavigation();
  const { key: routeKey } = useRoute();
  // Decided in render, so a denied arrival never paints the success content.
  const [allowed] = useState(() => takePublishPass(routeKey, eventId));

  // No pass — Chrome ←/→, reload, a typed URL, a deep link: not right after a
  // publish (lib/publishPass.ts). Me's main page instead, REPLACING this
  // history entry (ruled by Jas 2026-11-03).
  useEffect(() => {
    if (allowed) return () => releasePublishPass(routeKey);
    // A RESET of the tab navigator, not goToMain's jump: the jump PUSHED a
    // history entry over /published, so every Chrome ← landed back here and
    // bounced to Me again — Back could never get past it (measured
    // 2026-11-03). A reset gives the tab navigator a new key, which
    // expo-router's history sync treats as a replace (expo-router 57.0.4,
    // build/fork/useLinking.js:21-45 findMatchingState, :357-359). Each tab
    // starts again on its main page — on every arrival measured here (cold,
    // reload, Chrome ←/→) the tabs were rebuilt from the URL already.
    // Deferred a tick: arriving by Chrome ←, a navigation dispatched in this
    // effect was dropped and the blank screen stayed (measured 2026-11-03).
    const t = setTimeout(() => {
      const tabs = navigation.getParent();
      const routes = tabs?.getState()?.routes.map((r) => ({ name: r.name })) ?? [];
      const me = routes.findIndex((r) => r.name === '(me)');
      if (tabs && me !== -1) tabs.dispatch({ type: 'RESET', payload: { index: me, routes } });
    }, 0);
    return () => clearTimeout(t);
  }, [allowed, routeKey, navigation]);

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

  if (!allowed) return <View style={{ flex: 1, backgroundColor: theme.colors.bg }} />;

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

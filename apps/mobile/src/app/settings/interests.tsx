// Settings → Interests & blocks (Architecture Decision 7; RULINGS LOCKED
// 2026-09-22 in SPARKED_STATE.md). Reference: design-reference/ui_kits/
// mobile-app/AppScreens.jsx:1986-2113 — three exclusive buckets.
//
// STATE lives in lib/interests.tsx (table: public.category_preferences, 0034).
// This screen only renders it and calls setStance; it never touches Supabase.
//
// WHERE THIS DIVERGES FROM THE REFERENCE, AND WHY (locked rules win):
//   • TABS, not three stacked sections (PROVISIONAL): Undecided · I'm into ·
//     Not for me, Undecided selected on every open, every tile shown — no peek
//     caps, no "Show more". The selected tab is NOT gradient: a tab is
//     navigation, not an action, and the spark gradient is reserved for
//     actionable elements (theme/colors.ts:44-48). It takes an underline.
//   • No gradient on any tile, and no green anywhere — green is semantic
//     free/going only.
//   • The reference's coral "Not for me" heading (#ff8a72) is 6.94:1 on the
//     dark page but 2.11:1 on the light page — a 1.4.3 failure. All text here
//     is `colors.text` (14.11 / 13.50), including UNSELECTED tab labels:
//     light-mode `textMuted` (#7a849e) is 3.43:1 on the page. Selection is
//     carried by the underline and the weight, never by colour. Numbers in
//     docs/ACCESSIBILITY.md Entry 12.
//   • Every button is 44×44, not the reference's 26×26 (WCAG 2.5.5, the house
//     rule at components/Pill.tsx:53-55).
//
// INTERACTION — DIRECT MOVES (PROVISIONAL). Every tile is the category name
// plus two buttons, one per OTHER bucket; each destination has ONE symbol:
//     ✓  → I'm into      −  → Not for me      ✕  → Undecided
//     I'm into tile:    −  ✕
//     Undecided tile:   ✓  −
//     Not for me tile:  ✓  ✕
// The tile body is not a control. I'm into ↔ Not for me is the provider's
// UPDATE path (0034: `update (stance)`).
//
// AFTER A MOVE the category leaves the visible tab, so focus goes to the NEXT
// tile's first button in the same tab, else the previous one, else — tab now
// empty — the selected tab itself; and the live region announces the move,
// even when the message repeats. Both in docs/ACCESSIBILITY.md Entry 12.

import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { GradientButton, SecondaryButton } from '../../components/AuthControls';
import { SubHeader } from '../../components/SubHeader';
import { useAuth } from '../../lib/auth';
import { useCategories, type Category } from '../../lib/categories';
import { useInterests, type Stance } from '../../lib/interests';
import { brand, useTheme } from '../../theme';

/** WCAG 2.5.5, set explicitly on both axes (docs/ACCESSIBILITY.md Entry 3). */
const TARGET = 44;

const CRUMB = 'Settings · Interests & blocks';

type Bucket = Stance | 'undecided';

/** Tab order, left to right. Undecided first and selected on every open. */
const TABS: Bucket[] = ['undecided', 'into', 'blocked'];

/** Bucket names as the tabs and the announcements say them. */
const BUCKET_NAME: Record<Bucket, string> = {
  into: 'I’m into',
  undecided: 'Undecided',
  blocked: 'Not for me',
};

/** Empty-tab copy (PROVISIONAL). */
const EMPTY_COPY: Record<Bucket, string> = {
  undecided: 'Everything’s sorted.',
  into: 'Nothing here yet — tap ✓ on a category to add it.',
  blocked: 'Nothing blocked.',
};

/** Bucket → the stance setStance takes (Undecided is no row). */
const STANCE_OF: Record<Bucket, Stance | null> = { into: 'into', undecided: null, blocked: 'blocked' };

/** ONE symbol per destination, everywhere on the screen. */
const ICON_TO: Record<Bucket, 'checkmark' | 'remove' | 'close'> = {
  into: 'checkmark',
  blocked: 'remove',
  undecided: 'close',
};

/** Each tile's two buttons, in order — the two buckets it is NOT in. */
const DESTINATIONS: Record<Bucket, [Bucket, Bucket]> = {
  into: ['blocked', 'undecided'],
  undecided: ['into', 'blocked'],
  blocked: ['into', 'undecided'],
};

/** The button's accessible name: the category AND the result. */
const actionLabel = (label: string, to: Bucket): string =>
  to === 'into'
    ? `Add ${label} to I’m into`
    : to === 'blocked'
      ? `Block ${label}`
      : `Move ${label} to Undecided`;

/** DOM ids for the tabs pattern's aria-controls / aria-labelledby. */
const tabId = (b: Bucket) => `interests-tab-${b}`;
const PANEL_ID = 'interests-panel';

/** Visually hidden but in the accessibility tree — for the live region and
 *  the loading label, whose content is already carried visually. */
const srOnly = {
  position: 'absolute' as const,
  width: 1,
  height: 1,
  overflow: 'hidden' as const,
  opacity: 0,
};

// ---------------------------------------------------------------------------
// Signed out — an in-place invitation, Saved's pattern ((tabs)/saved.tsx:60-107,
// :279). The provider never queries while signed out (anon holds no grant on
// category_preferences — 0034; post-arc baseline 2026-09-23), and neither does
// this branch.
// ---------------------------------------------------------------------------
function SignedOutInterests() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <SubHeader crumb={CRUMB} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={{ maxWidth: 320, width: '100%', alignItems: 'center', gap: 12 }}>
          {/* COPY IS PROVISIONAL. Headline styled exactly as Saved's
              signed-out headline ((tabs)/saved.tsx:74-85), plus a heading
              role Saved's does not carry. */}
          <Text
            role="heading"
            aria-level={1}
            accessibilityRole="header"
            style={{
              fontFamily: theme.fonts.displayBlack,
              fontWeight: '900',
              fontSize: 20,
              letterSpacing: -0.2,
              color: theme.colors.text,
              textAlign: 'center',
            }}
          >
            Make your feed yours
          </Text>
          {/* `colors.text`, not textMuted — see header. */}
          <Text
            style={{
              fontFamily: theme.fonts.bodyMedium,
              fontSize: theme.fontSizes.bodySm,
              lineHeight: 20,
              color: theme.colors.text,
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            Tune what shows up in your feed. Create a free account to save your interests and blocks.
          </Text>
          <GradientButton
            onPress={() => router.push({ pathname: '/auth', params: { mode: 'signup' } })}
            style={{ alignSelf: 'stretch', minHeight: TARGET }}
          >
            Create free account
          </GradientButton>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

/**
 * The WAI-ARIA tab props rnw forwards but RN 0.86 does not all TYPE on
 * Pressable — `id`, `aria-selected`, `aria-controls`, `tabIndex` (and the
 * tab's `onKeyDown`, spread inline at the call site) — hence the untyped
 * spread (EventStub's titleLinkProps and Pill's aria-pressed shim, same
 * reason). Verified against rnw 0.21.2:
 *   • `role="tab"` passes through untouched — 'tab' is not in
 *     propsToAriaRole's remap table (AccessibilityUtil/propsToAriaRole.js);
 *   • aria-selected / aria-controls / aria-labelledby are forwarded
 *     (createDOMProps/index.js:271-273, 434-436, 673-675);
 *   • Pressable activates on ENTER for any role but on SPACE only for
 *     role="button" or a <button> (usePressEvents/PressResponder.js:70-71) —
 *     so Space and the arrow keys are wired here by hand. Native ignores all
 *     of it.
 * Roving tabindex: only the selected tab is in the Tab sequence; arrows move
 * between tabs (automatic activation — the panel swap is instant).
 */
function tabProps(bucket: Bucket, selected: boolean): Record<string, unknown> {
  return {
    id: tabId(bucket),
    'aria-selected': selected,
    'aria-controls': PANEL_ID,
    tabIndex: selected ? 0 : -1,
  };
}

/** Minimal shape of the web keydown event rnw passes to onKeyDown. */
type KeyEvent = { key?: string; preventDefault?: () => void };

/** One square 44×44 action on a tile. `buttonRef` lets the screen focus it. */
function TileButton({
  icon,
  label,
  onPress,
  buttonRef,
}: {
  icon: 'checkmark' | 'remove' | 'close';
  label: string;
  onPress: () => void;
  buttonRef?: React.Ref<View>;
}) {
  const theme = useTheme();
  return (
    <Pressable
      ref={buttonRef}
      onPress={onPress}
      role="button"
      aria-label={label}
      style={({ pressed }) => ({
        width: TARGET,
        height: TARGET,
        borderRadius: theme.radii.pill,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.borderStrong,
        backgroundColor: pressed ? theme.colors.surfaceHover : 'transparent',
      })}
    >
      <Ionicons name={icon} size={18} color={theme.colors.text} />
    </Pressable>
  );
}

/**
 * A category in `bucket`: its name, then one button for each of the other two
 * buckets. The tile itself is not a control — only its two buttons are.
 * `firstButtonRef` is attached to the first button: that is where focus lands
 * when a move elsewhere in the tab makes this the next tile.
 */
function Tile({
  category,
  bucket,
  onMove,
  firstButtonRef,
}: {
  category: Category;
  bucket: Bucket;
  onMove: (to: Bucket) => void;
  firstButtonRef: React.Ref<View>;
}) {
  const theme = useTheme();
  const [first, second] = DESTINATIONS[bucket];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 6,
        paddingLeft: 14,
        paddingRight: 6,
        borderRadius: theme.radii.lg,
        borderWidth: 1,
        borderColor: theme.colors.borderStrong,
      }}
    >
      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          minWidth: 0,
          fontFamily: theme.fonts.displayBlack,
          fontWeight: '900',
          fontSize: 13,
          letterSpacing: -0.13,
          color: theme.colors.text,
        }}
      >
        {category.label}
      </Text>
      <TileButton
        buttonRef={firstButtonRef}
        icon={ICON_TO[first]}
        label={actionLabel(category.label, first)}
        onPress={() => onMove(first)}
      />
      <TileButton
        icon={ICON_TO[second]}
        label={actionLabel(category.label, second)}
        onPress={() => onMove(second)}
      />
    </View>
  );
}

/** Muted placeholder blocks while the read is in flight. No controls exist in
 *  this state at all, so nothing can be tapped before the buckets are known. */
function Skeleton() {
  const theme = useTheme();
  const bar = (w: number | `${number}%`, h: number) => (
    <View style={{ width: w, height: h, borderRadius: theme.radii.sm, backgroundColor: theme.colors.iconChipBg }} />
  );
  return (
    <View style={{ marginTop: 24, gap: 10 }}>
      <Text style={srOnly}>Loading your interests</Text>
      {bar('100%', TARGET)}
      <View style={{ height: 6 }} />
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i}>{bar('100%', 56)}</View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Signed in
// ---------------------------------------------------------------------------
function SignedInInterests() {
  const theme = useTheme();
  const { into, blocked, loaded, readFailed, refresh, setStance } = useInterests();
  const categories = useCategories();

  // Focus = mount + every return. Never a poll (architecture lock #4).
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  /** The selected tab. Plain component state: Undecided on every open. */
  const [tab, setTab] = useState<Bucket>('undecided');

  // --- The live region -----------------------------------------------------
  // The NODE is mounted unconditionally below and only its child changes
  // (docs/ACCESSIBILITY.md Entry 2). A REPEATED message is still announced:
  // the text is cleared first and set on the next frame, so the region sees
  // a removal and then an addition rather than an unchanged string.
  const [announcement, setAnnouncement] = useState('');
  const announceFrame = useRef<number | null>(null);
  const announce = useCallback((message: string) => {
    if (announceFrame.current !== null) cancelAnimationFrame(announceFrame.current);
    setAnnouncement('');
    announceFrame.current = requestAnimationFrame(() => {
      announceFrame.current = null;
      setAnnouncement(message);
    });
  }, []);
  useEffect(
    () => () => {
      if (announceFrame.current !== null) cancelAnimationFrame(announceFrame.current);
    },
    [],
  );

  // --- Focus targets ---------------------------------------------------------
  // Each tile's FIRST button and each tab register themselves here. Ref
  // callbacks with cleanup (React 19); the cleanup deletes only an entry that
  // still points at its own node.
  const firstButtons = useRef(new Map<string, View>());
  const registerFirstButton = useCallback(
    (id: string) =>
      (node: View | null): (() => void) | undefined => {
        if (!node) return undefined;
        firstButtons.current.set(id, node);
        return () => {
          if (firstButtons.current.get(id) === node) firstButtons.current.delete(id);
        };
      },
    [],
  );
  const tabNodes = useRef(new Map<Bucket, View>());
  const registerTab = useCallback(
    (b: Bucket) =>
      (node: View | null): (() => void) | undefined => {
        if (!node) return undefined;
        tabNodes.current.set(b, node);
        return () => {
          if (tabNodes.current.get(b) === node) tabNodes.current.delete(b);
        };
      },
    [],
  );

  /** Where focus goes after the next commit: a tile's first button, or a tab. */
  const pendingFocus = useRef<{ tile: string } | { tab: Bucket } | null>(null);
  // Runs after every commit; does nothing unless a move is pending. It runs
  // AFTER the moved tile has unmounted, so focus is placed on the survivor
  // rather than lost to the document. No state is set here.
  useEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    const node = 'tile' in target ? firstButtons.current.get(target.tile) : tabNodes.current.get(target.tab);
    if (node) {
      pendingFocus.current = null;
      node.focus();
    }
  });

  const bucketOf = useCallback(
    (id: string): Bucket => (into.has(id) ? 'into' : blocked.has(id) ? 'blocked' : 'undecided'),
    [into, blocked],
  );

  // Taxonomy order (sort_order), active only, Curbside included — the
  // useCategories contract (lib/categories.ts:43-63).
  const lists = useMemo(() => {
    const out: Record<Bucket, Category[]> = { into: [], undecided: [], blocked: [] };
    for (const c of categories) out[bucketOf(c.id)].push(c);
    return out;
  }, [categories, bucketOf]);

  const move = useCallback(
    (c: Category, to: Bucket) => {
      // THE FOCUS RULE. The category leaves this tab, so focus goes to the
      // next tile in it; the previous one if it was last; the tab itself if
      // the tab is now empty.
      const list = lists[tab];
      const i = list.findIndex((x) => x.id === c.id);
      const neighbour = list[i + 1] ?? list[i - 1];
      pendingFocus.current = neighbour ? { tile: neighbour.id } : { tab };
      announce(`${c.label} moved to ${BUCKET_NAME[to]}`);
      setStance(c.id, STANCE_OF[to]);
    },
    [lists, tab, announce, setStance],
  );

  /** Select `b` and move focus to its tab (arrow keys, Home / End). */
  const selectAndFocus = useCallback((b: Bucket) => {
    setTab(b);
    tabNodes.current.get(b)?.focus();
  }, []);

  /** Keyboard on a tab. Returns true when the key was handled. */
  const onTabKey = useCallback(
    (from: Bucket, key: string): boolean => {
      const i = TABS.indexOf(from);
      if (key === 'ArrowRight') selectAndFocus(TABS[(i + 1) % TABS.length]);
      else if (key === 'ArrowLeft') selectAndFocus(TABS[(i - 1 + TABS.length) % TABS.length]);
      else if (key === 'Home') selectAndFocus(TABS[0]);
      else if (key === 'End') selectAndFocus(TABS[TABS.length - 1]);
      // Enter already activates through Pressable; Space does not on
      // role="tab" (see tabProps), so it is handled here.
      else if (key === ' ' || key === 'Spacebar') setTab(from);
      else return false;
      return true;
    },
    [selectAndFocus],
  );

  // Both reads must have landed. `categories` is [] until the taxonomy
  // arrives, and rendering tabs against an empty taxonomy would show
  // "Undecided (0)" with nothing to pick from.
  const ready = loaded && categories.length > 0;

  let body: ReactNode;
  if (readFailed) {
    body = (
      <View style={{ marginTop: 30, gap: 14, alignItems: 'flex-start' }}>
        <Text
          style={{
            fontFamily: theme.fonts.bodySemiBold,
            fontSize: theme.fontSizes.bodySm,
            color: theme.colors.text,
          }}
        >
          Couldn’t load your interests
        </Text>
        <SecondaryButton onPress={() => refresh()} style={{ minHeight: TARGET, minWidth: 120 }}>
          Retry
        </SecondaryButton>
      </View>
    );
  } else if (!ready) {
    body = <Skeleton />;
  } else {
    const items = lists[tab];
    body = (
      <>
        {/* THE TABLIST. Selected = underline + weight, never gradient and
            never colour: every label is colors.text. */}
        <View
          role="tablist"
          aria-label="Interest buckets"
          style={{
            flexDirection: 'row',
            marginTop: 24,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.divider,
          }}
        >
          {TABS.map((b) => {
            const selected = b === tab;
            return (
              <Pressable
                key={b}
                ref={registerTab(b)}
                role="tab"
                onPress={() => setTab(b)}
                {...tabProps(b, selected)}
                // Inline, not built inside tabProps: an event handler must
                // be visibly a handler, or the React compiler lint reads the
                // ref it reaches (tab focus) as a read during render.
                {...({
                  onKeyDown: (e: KeyEvent) => {
                    if (e.key && onTabKey(b, e.key)) e.preventDefault?.();
                  },
                } as Record<string, unknown>)}
                style={{
                  flex: 1,
                  minHeight: TARGET,
                  minWidth: TARGET,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 4,
                  // The selection mark: a 3px bar in colors.text. Unselected
                  // tabs keep a transparent bar so labels never shift.
                  borderBottomWidth: 3,
                  borderBottomColor: selected ? theme.colors.text : 'transparent',
                  marginBottom: -1,
                }}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: selected ? theme.fonts.bodySemiBold : theme.fonts.bodyMedium,
                    fontWeight: selected ? '800' : '500',
                    fontSize: 13,
                    color: theme.colors.text,
                  }}
                >
                  {`${BUCKET_NAME[b]} (${lists[b].length})`}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* THE PANEL — one node; its label follows the selected tab. */}
        <View
          role="tabpanel"
          id={PANEL_ID}
          aria-labelledby={tabId(tab)}
          style={{ marginTop: 16, gap: 10 }}
        >
          {items.length === 0 ? (
            <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 13, color: theme.colors.text }}>
              {EMPTY_COPY[tab]}
            </Text>
          ) : (
            items.map((c) => (
              <View key={c.id}>
                <Tile
                  category={c}
                  bucket={tab}
                  onMove={(to) => move(c, to)}
                  firstButtonRef={registerFirstButton(c.id)}
                />
              </View>
            ))
          )}
        </View>
      </>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <SubHeader crumb={CRUMB} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 60,
          maxWidth: 560,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        {/* THE LIVE REGION — mounted with the screen, before any move, in
            every state (loading, failed, ready), so each announcement is a
            CHANGE to a node already in the tree. Visually hidden: the move
            itself is what sighted users see. */}
        <View role="status" aria-live="polite" style={srOnly}>
          {announcement ? <Text>{announcement}</Text> : null}
        </View>

        <Text
          role="heading"
          aria-level={1}
          accessibilityRole="header"
          style={{
            fontFamily: theme.fonts.displayBlack,
            fontWeight: '900',
            fontSize: theme.fontSizes.h2,
            letterSpacing: -0.28,
            color: theme.colors.text,
            marginBottom: 8,
          }}
        >
          {'Interests & blocks'}
        </Text>
        <Text
          style={{
            fontFamily: theme.fonts.bodyMedium,
            fontSize: 13.5,
            lineHeight: 20,
            color: theme.colors.text,
            maxWidth: 320,
          }}
        >
          Tune what shapes your feed. Every category sits in one bucket — into it, undecided, or blocked.
        </Text>

        {body}
      </ScrollView>
    </View>
  );
}

export default function InterestsSettings() {
  const theme = useTheme();
  const { session, loading } = useAuth();

  // Auth still resolving: neither branch yet (me.tsx's pattern), so a
  // signed-in user never sees the invitation flash first.
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={brand.brightOrange} />
      </View>
    );
  }

  return session ? <SignedInInterests /> : <SignedOutInterests />;
}

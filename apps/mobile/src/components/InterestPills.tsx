// The Explore header's interest pills — a wrapped row that filters the feed.
//
// WRAPPED, NOT HORIZONTALLY SCROLLING, and the reasoning is recorded because
// the design reference does the opposite (Screens.jsx:826 scrolls the row with
// `scrollbarWidth: 'none'`). Two reasons wrap wins here:
//   • It is the HOUSE IDIOM. The paid wizard's category picker already lays 12
//     of these same pills out with `flexWrap: 'wrap'`; the app's only
//     horizontal ScrollView is EventGallery's paged photo carousel.
//   • A hidden-scrollbar row is a discoverability problem at desktop width. The
//     feed column is capped at 560 and centred, so the row overflows on DESKTOP
//     too, not only on phones — and on a trackpad, with scrollbars hidden by
//     the OS, an overflowing row with no drag affordance reads as a complete
//     row that happens to end.
//
// THIS COMPONENT DOES NOT OWN THE LIVE REGION, deliberately. See the note in
// (tabs)/index.tsx: the row is GATED on load, so a region inside it would be a
// conditional node — the exact defect the standing rule exists to prevent. The
// announcement lives in the header, unconditionally, one level up.

import React from 'react';
import { View } from 'react-native';

import type { Category } from '../lib/categories';
import Pill from './Pill';

export interface InterestPillsProps {
  /** Already filtered to the pills that should exist — see `pillCategories` in
   *  (tabs)/index.tsx. This component renders what it is given and decides
   *  nothing about membership. */
  categories: Category[];
  selected: string[];
  onToggle: (id: string) => void;
}

export default function InterestPills({ categories, selected, onToggle }: InterestPillsProps) {
  return (
    <View
      // Without this a screen reader meets a bare run of toggle buttons with no
      // statement of what they do. `role="group"` is typed by RN 0.86
      // (ViewAccessibility.d.ts:375) and forwarded to the DOM by rnw 0.21.2,
      // which is why it is used rather than a visually-hidden heading.
      role="group"
      aria-label="Filter the feed by interest"
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
    >
      {categories.map((c) => (
        <Pill
          key={c.id}
          label={c.label}
          selected={selected.includes(c.id)}
          onPress={() => onToggle(c.id)}
        />
      ))}
    </View>
  );
}

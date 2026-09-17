// The Explore header's date-range control — "Now through Tomorrow", where both
// ends are editable and the window is SESSION-ONLY (a query, not a preference;
// see the state's comment in (tabs)/index.tsx). Structurally a copy of
// LocationControl: a live region holding the sentence, a panel mounted outside
// it, one phase at a time.
//
// It emits INSTANTS, never dates. The RPC takes timestamptz for the reason
// index.tsx's defaultWindow() spells out — a `date` argument resolves at
// midnight in the SESSION timezone (UTC under PostgREST), and an Arizona user
// asking for "today" would silently get 5pm yesterday to 5pm today. Both
// bounds here resolve in the device timezone and toISOString() converts them
// to the instant that actually is.
//
// THE PICKER NEVER LEARNS THAT THE 3-HOUR GRACE EXISTS. It emits bounds; the
// server owns that predicate. No copy of it lives here.

import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { brand, useTheme } from '../theme';
import { DateField } from './pickers';

/** Same tokens as LocationControl, same latent light-mode note — Entry 3. */
const AFFORDANCE = brand.ignitionGold;
/** Composites to #9C7B36 over #14213D = 4.04:1, clearing 1.4.11's 3:1. */
const UNDERLINE = 'rgba(247,183,49,0.6)';
/** WCAG 2.5.5, set explicitly on BOTH axes — see the segment note below. */
const TARGET = 44;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n: number) => String(n).padStart(2, '0');

/** A Date's LOCAL calendar day as 'YYYY-MM-DD' — the shape DateField speaks. */
const ymdOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** 'YYYY-MM-DD' → local midnight of that day. The three-argument Date
 *  constructor resolves in the device timezone; `new Date('YYYY-MM-DD')` would
 *  parse as UTC midnight, which is yesterday evening in Arizona. */
function localMidnight(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** 'YYYY-MM-DD' → 'Sep 20'. Short by design: the sentence is one line. */
function shortDate(ymd: string): string {
  const [, m, d] = ymd.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}

/**
 * The window's two ends as local calendar days. The default window's `from` is
 * `now`, whose local day is today; its `to` is a millisecond before the day
 * after tomorrow, whose local day is tomorrow. So this reads the SAME days off
 * a default window and a picked one.
 */
function daysOf(value: { from: string; to: string }): { start: string; end: string } {
  return { start: ymdOf(new Date(value.from)), end: ymdOf(new Date(value.to)) };
}

/**
 * The short range the status line and the empty state name: "Sep 20" for one
 * day, "Sep 20–22" inside a month, "Sep 30 – Oct 2" across one.
 */
export function formatWindowLabel(value: { from: string; to: string }): string {
  const { start, end } = daysOf(value);
  if (start === end) return shortDate(start);
  const [sy, sm] = start.split('-').map(Number);
  const [ey, em, ed] = end.split('-').map(Number);
  if (sy === ey && sm === em) return `${shortDate(start)}–${ed}`;
  return `${shortDate(start)} – ${shortDate(end)}`;
}

/**
 * Picked days → the instants the RPC takes.
 *
 *   START, today  → `new Date()`, the `now` floor. A midnight floor on a
 *                   picked "today" would resurrect this morning's ended
 *                   events — the regression defaultWindow() exists to prevent,
 *                   re-entered through the front door. index.tsx records the
 *                   ruling this retired.
 *   START, later  → local midnight of that day.
 *   END, any day  → local midnight of the day AFTER it, minus 1ms — the same
 *                   half-open [from, to) that defaultWindow() uses, because the
 *                   server predicate is `starts_at <= window_to` and the start
 *                   of the next day would admit an event at exactly 00:00:00.000
 *                   on a day outside the range.
 */
function windowFor(startYmd: string, endYmd: string): { from: string; to: string } {
  const from = startYmd === ymdOf(new Date()) ? new Date() : localMidnight(startYmd);
  const dayAfterEnd = localMidnight(endYmd);
  dayAfterEnd.setDate(dayAfterEnd.getDate() + 1);
  return { from: from.toISOString(), to: new Date(dayAfterEnd.getTime() - 1).toISOString() };
}

type Phase = 'idle' | 'start' | 'end';

export default function DateControl({
  value,
  isDefault,
  onChange,
  onReset,
}: {
  value: { from: string; to: string };
  isDefault: boolean;
  onChange: (next: { from: string; to: string }) => void;
  onReset: () => void;
}) {
  const theme = useTheme();
  // ONE PANEL AT A TIME. Tapping a segment opens its phase; tapping the same
  // segment again returns to idle. Two month grids are never open together.
  const [phase, setPhase] = useState<Phase>('idle');
  const { start, end } = daysOf(value);
  const today = ymdOf(new Date());

  const connective = {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: theme.fontSizes.bodySm,
    // 4.57:1 on the page background; LIGHT value is the Appearance arc's
    // inherited token failure, as in LocationControl.
    color: theme.colors.textMuted,
  } as const;

  const value_ = {
    fontFamily: theme.fonts.bodySemiBold,
    fontWeight: '800',
    fontSize: theme.fontSizes.bodySm,
    color: AFFORDANCE,
  } as const;

  // minWidth AS WELL AS minHeight. 2.5.5 is 44x44, and LocationControl's
  // two-digit radius measured 29 wide with height alone — height passing is
  // the half-check that makes this look done. "Now" is three characters and
  // fails width without this.
  const segment = {
    minHeight: TARGET,
    minWidth: TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  } as const;

  const toggle = (p: Exclude<Phase, 'idle'>) => setPhase(phase === p ? 'idle' : p);

  const commitStart = (ymd: string) => {
    // A start moved past the end drags the end with it, so the window never
    // inverts. The same clamp the wizard's Start applies to its End.
    onChange(windowFor(ymd, ymd > end ? ymd : end));
    setPhase('idle');
  };

  const commitEnd = (ymd: string) => {
    onChange(windowFor(start, ymd));
    setPhase('idle');
  };

  return (
    <View>
      {/*
        THE LIVE REGION — in the tree from first paint and never re-mounted;
        only its children swap. A region that mounts together with its text
        does not announce, and the failure is silent (Entry 2), so a committed
        range must be a CHANGE to a node already here. Its contents are the
        segment labels, as in LocationControl: the labels ARE the state worth
        announcing ("Sep 20 through Sep 22").
      */}
      <View
        role="status"
        aria-live="polite"
        style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', minHeight: TARGET }}
      >
        <Pressable
          role="button"
          aria-expanded={phase === 'start'}
          accessibilityLabel={`Change start date. Currently ${isDefault ? 'now' : shortDate(start)}`}
          onPress={() => toggle('start')}
          style={segment}
        >
          <View style={{ borderBottomWidth: 1.5, borderStyle: 'dotted', borderColor: UNDERLINE }}>
            <Text style={value_}>{isDefault ? 'Now' : shortDate(start)}</Text>
          </View>
        </Pressable>

        <Text style={[connective, { paddingHorizontal: 6 }]}>through</Text>

        <Pressable
          role="button"
          aria-expanded={phase === 'end'}
          accessibilityLabel={`Change end date. Currently ${isDefault ? 'tomorrow' : shortDate(end)}`}
          onPress={() => toggle('end')}
          style={segment}
        >
          <View style={{ borderBottomWidth: 1.5, borderStyle: 'dotted', borderColor: UNDERLINE }}>
            <Text style={value_}>{isDefault ? 'Tomorrow' : shortDate(end)}</Text>
          </View>
        </Pressable>

        {/* The ONLY reset on the screen. Rendered only for a picked window — a
            reset with nothing to reset is phantom state, like a lit pill with
            no filter. */}
        {!isDefault && (
          <>
            <Text style={[connective, { paddingHorizontal: 6 }]}>·</Text>
            <Pressable
              role="button"
              accessibilityLabel="Reset dates to now through tomorrow"
              onPress={() => {
                setPhase('idle');
                onReset();
              }}
              style={segment}
            >
              <View style={{ borderBottomWidth: 1.5, borderStyle: 'dotted', borderColor: UNDERLINE }}>
                <Text style={value_}>Reset</Text>
              </View>
            </Pressable>
          </>
        )}
      </View>

      {/* The panel sits OUTSIDE the live region, exactly as PlacePanel does —
          it is a form, and a region re-announces everything it contains on
          every transition, which makes a month grid inside one unusable. */}
      {phase !== 'idle' && (
        <DatePanel
          phase={phase}
          start={start}
          end={end}
          today={today}
          onPick={phase === 'start' ? commitStart : commitEnd}
          onClose={() => setPhase('idle')}
        />
      )}
    </View>
  );
}

/**
 * One DateField on a card, consumed AS IS from components/pickers.tsx.
 *
 * CONTRAST CONSTRAINT, inherited from PlacePanel and binding here: this is a
 * CARD surface, and `textMuted` composites to 4.32:1 against a card (#1d2a45)
 * — a 1.4.3 FAILURE. Every text line this panel authors is `colors.text`
 * (12.62:1). Do not soften a line here to textMuted or textFaint.
 *
 * PAST DATES ARE NOT SELECTABLE — `min` is today on the start field, and the
 * start day on the end field (which is itself never before today). Not a
 * precaution: index.tsx retired a ruling on the strength of it.
 */
function DatePanel({
  phase,
  start,
  end,
  today,
  onPick,
  onClose,
}: {
  phase: Exclude<Phase, 'idle'>;
  start: string;
  end: string;
  today: string;
  onPick: (ymd: string) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        marginTop: 10,
        padding: 14,
        borderRadius: theme.radii.lg,
        backgroundColor: theme.colors.cardBg,
        borderWidth: 1,
        borderColor: theme.colors.cardBorder,
        gap: 10,
      }}
    >
      {phase === 'start' ? (
        <DateField label="From" value={start} min={today} onChange={onPick} />
      ) : (
        <DateField label="Through" value={end} min={start} onChange={onPick} />
      )}

      <View style={{ flexDirection: 'row' }}>
        <Pressable
          role="button"
          onPress={onClose}
          style={{ minHeight: TARGET, minWidth: TARGET, justifyContent: 'center', paddingHorizontal: 16 }}
        >
          <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 13, color: theme.colors.text }}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

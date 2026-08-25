// Date & time pickers — ported from the design-reference wizard's When/Where
// step (_DateField chrome + _TimePicker segments) so Curbside and the paid
// wizard feel like one product. One RN implementation everywhere (the
// reference leaned on the browser's native date input; a custom calendar
// keeps web/native identical and testable).
// US display formats ONLY (Jul 15, 2026 · h:mm am/pm) — internal values stay
// 'YYYY-MM-DD' / 24h 'HH:MM' and storage stays UTC, unchanged.

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { useTheme } from '../theme';
import { GradientFill } from './AuthControls';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const pad = (n: number) => String(n).padStart(2, '0');
const toYMD = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

/** 'YYYY-MM-DD' → 'Jul 15, 2026' (US display, locked for this form). */
export function formatUSDate(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return ymd;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** 24h 'HH:MM' → 'h:mm am/pm'. */
export function format12h(hhmm: string): string {
  const [h24, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h24) || Number.isNaN(m)) return hhmm;
  const ap = h24 >= 12 ? 'pm' : 'am';
  const h12 = h24 % 12 || 12;
  return `${h12}:${pad(m)} ${ap}`;
}

/** Reference field shell: icon · eyebrow label · value. */
function FieldShell({
  icon,
  label,
  children,
  onPress,
  a11yLabel,
  expanded,
}: {
  icon: 'calendar-outline' | 'time-outline';
  label?: string;
  children: React.ReactNode;
  onPress?: () => void;
  /** Accessible name. Separate from `label`, which is the 9px eyebrow only —
   *  "STARTS" alone does not tell a screen-reader user what the field holds. */
  a11yLabel?: string;
  /** Disclosure state of whatever this shell opens. */
  expanded?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      // `role` / `aria-*`, never `accessibilityRole` / `accessibilityState`:
      // rnw 0.21.2 logs a deprecation for EVERY accessibility* spelling
      // (createDOMProps/index.js:605, :417, :339) and the aria form is a typed
      // View prop in RN 0.86 (ViewAccessibility.d.ts:100, :39, :58), so one
      // prop covers web, iOS and Android. ACCESSIBILITY.md Entry 2 established
      // this; it is not a web-only choice.
      // A shell with no onPress is inert chrome and must NOT announce as a
      // button, hence the conditionals rather than unconditional props.
      role={onPress ? 'button' : undefined}
      aria-label={onPress ? a11yLabel : undefined}
      aria-expanded={onPress ? expanded : undefined}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
        backgroundColor: theme.colors.iconChipBg,
        borderWidth: 1,
        borderColor: theme.colors.cardBorder,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
      }}
    >
      <Ionicons name={icon} size={15} color="#F7B731" />
      <View style={{ flex: 1, minWidth: 0 }}>
        {label ? (
          <Text
            style={{
              fontFamily: theme.fonts.bodySemiBold,
              fontSize: 9,
              fontWeight: '900',
              letterSpacing: 1.1,
              textTransform: 'uppercase',
              color: theme.colors.textFaint,
              marginBottom: 2,
            }}
          >
            {label}
          </Text>
        ) : null}
        {children}
      </View>
    </Pressable>
  );
}

/**
 * Calendar date field. Tapping the field expands a month grid below it;
 * selected day wears the spark gradient; days outside [`min`, `max`] are
 * disabled and inert.
 *
 * `max` exists for Curbside's 3-consecutive-day cap (end ≤ start + 2), so the
 * picker cannot offer a day the server would reject. Optional — the paid
 * wizard passes only `min` and is unaffected.
 */
export function DateField({
  value,
  onChange,
  label = 'On',
  min,
  max,
}: {
  value: string;
  onChange: (ymd: string) => void;
  label?: string;
  min?: string;
  max?: string;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [vy, vm] = value.split('-').map(Number);
  const valueYear = vy || new Date().getFullYear();
  const valueMonth = (vm || new Date().getMonth() + 1) - 1;
  const [viewYear, setViewYear] = useState(valueYear);
  const [viewMonth, setViewMonth] = useState(valueMonth);

  // ---------------------------------------------------------------------
  // THE CALENDAR ALWAYS SHOWS THE MONTH THE CURRENT VALUE LIVES IN.
  //
  // Two mechanisms, because they cover different paths and neither one
  // subsumes the other:
  //
  //   (a) `toggleCalendar` re-derives the view at the moment it OPENS, so a
  //       browse to November that was closed without picking does not persist
  //       into the next open.
  //   (b) the render-phase sync below catches `value` changing while the
  //       calendar is ALREADY open.
  //
  // (b) is the shipped defect. In a linked pair — the wizard's Start bumping
  // End (create/event.tsx), or Curbside's `changeStart` clamp — End's value
  // moves from outside. Without this, End kept its MOUNT-time month: move
  // Start from August to December and End's calendar opened on AUGUST, with
  // no selected day and every day disabled by `min`. It typechecks, never
  // throws, and reads to the host as "the date didn't change". A range picker
  // moves the two fields against each other constantly, so it fires at once.
  //
  // Deliberately NOT a useEffect: an effect runs after commit, so the wrong
  // month paints for a frame before correcting. Adjusting state during render
  // re-renders before the browser paints anything.
  //
  // The guard is the VALUE, not the render. An unrelated re-render — theme,
  // parent state, a sibling field — fails the comparison and changes nothing,
  // so a user who browsed to November stays on November. The only re-syncs are
  // their own pick (which closes the calendar in the same handler) and a real
  // external change, where jumping IS the correct behaviour.
  const [syncedTo, setSyncedTo] = useState(value);
  if (value !== syncedTo) {
    setSyncedTo(value);
    setViewYear(valueYear);
    setViewMonth(valueMonth);
  }

  const toggleCalendar = () => {
    if (!open) {
      setViewYear(valueYear);
      setViewMonth(valueMonth);
    }
    setOpen((o) => !o);
  };

  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const shiftMonth = (dir: -1 | 1) => {
    const next = new Date(viewYear, viewMonth + dir, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  return (
    <View>
      <FieldShell
        icon="calendar-outline"
        label={label}
        onPress={toggleCalendar}
        a11yLabel={`${label}, ${formatUSDate(value)}`}
        expanded={open}
      >
        <Text style={{ fontFamily: theme.fonts.bodySemiBold, fontSize: 14, fontWeight: '700', color: theme.colors.text }}>
          {formatUSDate(value)}
        </Text>
      </FieldShell>

      {open && (
        <View
          style={{
            marginTop: 8,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: theme.colors.cardBorder,
            backgroundColor: theme.colors.cardBg,
            padding: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            {/* Qualified by the field, same reason as TimeField's AM/PM pair:
                two DateFields on one screen otherwise put four buttons called
                "Previous month"/"Next month" in the tree with nothing to tell
                them apart (WCAG 4.1.2). Action first, so first-letter scanning
                still works. */}
            <Pressable onPress={() => shiftMonth(-1)} role="button" aria-label={`Previous month, ${label}`} hitSlop={8} style={{ padding: 4 }}>
              <Ionicons name="chevron-back" size={16} color={theme.colors.textMuted} />
            </Pressable>
            <Text style={{ fontFamily: theme.fonts.displayBlack, fontWeight: '900', fontSize: 14, letterSpacing: -0.14, color: theme.colors.text }}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <Pressable onPress={() => shiftMonth(1)} role="button" aria-label={`Next month, ${label}`} hitSlop={8} style={{ padding: 4 }}>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row' }}>
            {WEEKDAYS.map((w, i) => (
              <Text
                key={`${w}-${i}`}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontFamily: theme.fonts.bodySemiBold,
                  fontSize: 9,
                  fontWeight: '900',
                  letterSpacing: 1,
                  color: theme.colors.textHint,
                  marginBottom: 6,
                }}
              >
                {w}
              </Text>
            ))}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {cells.map((day, i) => {
              if (day === null) return <View key={`pad-${i}`} style={{ width: `${100 / 7}%`, height: 34 }} />;
              const ymd = toYMD(viewYear, viewMonth, day);
              const disabled = Boolean((min && ymd < min) || (max && ymd > max));
              const selected = ymd === value;
              return (
                <View key={ymd} style={{ width: `${100 / 7}%`, height: 34, padding: 2 }}>
                  <Pressable
                    onPress={() => {
                      if (disabled) return;
                      onChange(ymd);
                      setOpen(false);
                    }}
                    disabled={disabled}
                    aria-label={formatUSDate(ymd)}
                    // accessibilityState is honoured on iOS/Android and is
                    // INERT on web — rnw 0.21.2 has no handler for it in
                    // forwardedProps, createDOMProps or Pressable. `disabled`
                    // still reaches the DOM as aria-disabled (Pressable
                    // /index.js:125); `selected` does not reach it at all.
                    // Left in place because native reads it. See Entry 5.
                    accessibilityState={{ selected, disabled }}
                    style={{
                      flex: 1,
                      borderRadius: 8,
                      overflow: 'hidden',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {selected && <GradientFill />}
                    <Text
                      style={{
                        fontFamily: theme.fonts.bodySemiBold,
                        fontSize: 12.5,
                        fontWeight: selected ? '900' : '600',
                        color: selected ? '#14213D' : disabled ? theme.colors.textHint : theme.colors.text,
                      }}
                    >
                      {day}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

/**
 * Parse forgiving 12-hour text into { h12, m, ampmOverride }:
 * "1" → 1:00 · "1:00" → 1:00 · "130" → 1:30 · "1030" → 10:30 ·
 * "1:3" → 1:30 · "18" / "1830" → 6:00/6:30 with an auto PM override ·
 * "0"/"0:xx" → 12 with an auto AM override. Null when unparseable.
 * THE shared time-entry pattern (SPARKED_STATE lock 2026-07-15) — the paid
 * wizard's When/Where step adopts this same input when built.
 */
export function parseTimeText(
  raw: string,
): { h12: number; m: number; ampmOverride: 'AM' | 'PM' | null } | null {
  const s = raw.replace(/[^\d:]/g, '');
  if (!s) return null;
  let hour: number;
  let minute: number;
  if (s.includes(':')) {
    const [hPart, mPart = ''] = s.split(':');
    hour = parseInt(hPart, 10);
    minute = mPart.length === 0 ? 0 : mPart.length === 1 ? parseInt(mPart, 10) * 10 : parseInt(mPart.slice(0, 2), 10);
  } else if (s.length <= 2) {
    hour = parseInt(s, 10);
    minute = 0;
  } else {
    hour = parseInt(s.slice(0, s.length - 2), 10);
    minute = parseInt(s.slice(-2), 10);
  }
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  minute = Math.max(0, Math.min(59, minute));
  let ampmOverride: 'AM' | 'PM' | null = null;
  if (hour >= 13 && hour <= 23) {
    hour -= 12;
    ampmOverride = 'PM'; // typed 24h — honor it
  } else if (hour === 0) {
    hour = 12;
    ampmOverride = 'AM';
  } else if (hour > 23) {
    return null;
  }
  return { h12: Math.max(1, Math.min(12, hour)), m: minute, ampmOverride };
}

/**
 * Typeable 12-hour time input + AM/PM pair (SPARKED_STATE shared spec).
 * The user types freely ("1", "9:30", "130"); the value normalizes to h:mm
 * on blur/submit. Grid and segment pickers are dead — typing won QA.
 * Emits 24h 'HH:MM'.
 *
 * `label` is the accessible name and it is NOT optional in practice. It was
 * hardcoded "Start time", so the wizard's END time field announced itself as
 * "Start time" (WCAG 4.1.2, live on a shipped control). It also disambiguates
 * the AM/PM pair: two TimeFields on one screen otherwise put four buttons
 * called "AM"/"PM" in the accessibility tree with nothing to tell them apart.
 * The default is deliberately neutral rather than "Start time" — a future call
 * site that forgets to pass one should announce something vague, never
 * something WRONG.
 */
export function TimeField({
  value,
  onChange,
  label = 'Time',
}: {
  value: string;
  onChange: (hhmm: string) => void;
  label?: string;
}) {
  const theme = useTheme();
  const [h24, m] = (value || '18:00').split(':').map(Number);
  const ampm: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 || 12;
  const normalized = `${h12}:${pad(m)}`;
  const [text, setText] = useState(normalized);
  const [focused, setFocused] = useState(false);

  const emit = (nh12: number, nm: number, nap: 'AM' | 'PM') => {
    let h = nh12 % 12;
    if (nap === 'PM') h += 12;
    onChange(`${pad(h)}:${pad(nm)}`);
  };

  const commitText = () => {
    const parsed = parseTimeText(text);
    if (parsed) {
      emit(parsed.h12, parsed.m, parsed.ampmOverride ?? ampm);
      setText(`${parsed.h12}:${pad(parsed.m)}`);
    } else {
      setText(normalized); // unparseable — revert, never hold garbage
    }
  };

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: theme.colors.iconChipBg,
        borderWidth: 1,
        borderColor: focused ? theme.colors.focusRing : theme.colors.cardBorder,
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 9,
      }}
    >
      <Ionicons name="time-outline" size={15} color={theme.colors.textFaint} />
      <TextInput
        value={focused ? text : normalized}
        onChangeText={setText}
        onFocus={() => {
          setText(normalized);
          setFocused(true);
        }}
        onBlur={() => {
          setFocused(false);
          commitText();
        }}
        onSubmitEditing={commitText}
        inputMode="numeric"
        maxLength={5}
        selectTextOnFocus
        aria-label={label}
        placeholder="6:00"
        placeholderTextColor={theme.colors.textHint}
        style={{
          flex: 1,
          fontFamily: theme.fonts.displayBlack,
          fontWeight: '900',
          fontSize: 17,
          color: theme.colors.text,
          padding: 0,
        }}
      />
      <View style={{ flexDirection: 'row', gap: 3, padding: 3, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.22)' }}>
        {(['AM', 'PM'] as const).map((p) => {
          const active = ampm === p;
          return (
            <Pressable
              key={p}
              onPress={() => emit(h12, m, p)}
              aria-label={`${label} ${p}`}
              // Inert on web, honoured on native — same note as the day cells.
              accessibilityState={{ selected: active }}
              style={{ borderRadius: 6, overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 4 }}
            >
              {active && <GradientFill />}
              <Text
                style={{
                  fontFamily: theme.fonts.displayBlack,
                  fontWeight: '900',
                  fontSize: 11,
                  color: active ? '#14213D' : theme.colors.textMuted,
                }}
              >
                {p}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}


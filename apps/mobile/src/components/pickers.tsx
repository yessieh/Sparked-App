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
}: {
  icon: 'calendar-outline' | 'time-outline';
  label?: string;
  children: React.ReactNode;
  onPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
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
 * selected day wears the spark gradient; days before `min` are disabled
 * (single-day Curbside keeps min = today).
 */
export function DateField({
  value,
  onChange,
  label = 'On',
  min,
}: {
  value: string;
  onChange: (ymd: string) => void;
  label?: string;
  min?: string;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [vy, vm] = value.split('-').map(Number);
  const [viewYear, setViewYear] = useState(vy || new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState((vm || new Date().getMonth() + 1) - 1);

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
      <FieldShell icon="calendar-outline" label={label} onPress={() => setOpen((o) => !o)}>
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
            <Pressable onPress={() => shiftMonth(-1)} accessibilityLabel="Previous month" hitSlop={8} style={{ padding: 4 }}>
              <Ionicons name="chevron-back" size={16} color={theme.colors.textMuted} />
            </Pressable>
            <Text style={{ fontFamily: theme.fonts.displayBlack, fontWeight: '900', fontSize: 14, letterSpacing: -0.14, color: theme.colors.text }}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <Pressable onPress={() => shiftMonth(1)} accessibilityLabel="Next month" hitSlop={8} style={{ padding: 4 }}>
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
              const disabled = Boolean(min && ymd < min);
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
                    accessibilityLabel={formatUSDate(ymd)}
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
 */
export function TimeField({ value, onChange }: { value: string; onChange: (hhmm: string) => void }) {
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
        accessibilityLabel="Start time"
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
              accessibilityLabel={p}
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


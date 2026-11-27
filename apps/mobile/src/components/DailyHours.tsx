// Daily hours for a multi-day event — shared by the wizard's When & Where step
// and the Curbside form. Two blocks around the form's own START / END fields:
//
//   <HoursChoice>  above them: "Daily hours" / "Open the whole time"
//   <DayHours>     below them: what they mean, and "Customize a day"
//
// Both render nothing for a single-day event. The values themselves come from
// lib/eventHours.ts buildHours; nothing here computes an instant.

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

import {
  HOURS_MAX_DAYS,
  clockRange,
  closesNextDay,
  dayLabel,
  effectiveDays,
  effectiveMode,
  type DayOverride,
  type DayOverrides,
  type EffectiveDay,
  type HoursInput,
  type HoursMode,
} from '../lib/eventHours';
import { brand, useTheme } from '../theme';
import Pill from './Pill';
import { TimeField } from './pickers';

const TARGET = 44;

const useStyles = () => {
  const theme = useTheme();
  return {
    body: {
      fontFamily: theme.fonts.bodyMedium,
      fontSize: 12,
      lineHeight: 17,
      color: theme.colors.text,
    },
    strong: {
      fontFamily: theme.fonts.bodySemiBold,
      fontSize: 12.5,
      fontWeight: '700' as const,
      color: theme.colors.text,
    },
    // Day list rows: the day + date leads (bold, primary), the hours read as
    // ordinary text, and "Closed" steps back. The word itself carries the
    // state; the muted colour only adds to it (1.4.1).
    rowDay: {
      fontFamily: theme.fonts.bodySemiBold,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '700' as const,
      color: theme.colors.text,
    },
    rowTimes: {
      fontFamily: theme.fonts.body,
      fontSize: 13,
      color: theme.colors.text,
    },
    // textMuted holds 4.5:1 only on the bare dark page (4.57:1), not on a card
    // (4.32:1) and not in light mode (3.43:1) — ACCESSIBILITY.md Entry 2 / 12.
    rowClosed: {
      fontFamily: theme.fonts.body,
      fontSize: 13,
      color: theme.colors.textMuted,
    },
    tag: {
      width: 48,
      fontFamily: theme.fonts.bodySemiBold,
      fontSize: 10,
      fontWeight: '900' as const,
      letterSpacing: 1,
      color: theme.colors.text,
    },
  };
};

/** The two-way choice. A range over the cap offers only "Open the whole time". */
export function HoursChoice({
  input,
  onChange,
}: {
  input: HoursInput;
  onChange: (mode: HoursMode) => void;
}) {
  const s = useStyles();
  if (input.startDate === input.endDate) return null;
  const mode = effectiveMode(input);
  const tooLong = mode === 'open' && input.mode === 'daily';
  // Over the cap whatever is selected: probe with 'daily'.
  const capped = effectiveMode({ ...input, mode: 'daily' }) === 'open';
  return (
    <View style={{ marginBottom: 14 }}>
      <View role="group" aria-label="Opening hours" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {capped ? null : <Pill label="Daily hours" selected={mode === 'daily'} onPress={() => onChange('daily')} />}
        <Pill label="Open the whole time" selected={mode === 'open'} onPress={() => onChange('open')} />
      </View>
      <Text style={[s.body, { marginTop: 8 }]}>
        {capped
          ? `Daily hours can cover up to ${HOURS_MAX_DAYS} days. ${tooLong ? 'This event will show as open the whole time.' : ''}`.trim()
          : mode === 'daily'
            ? 'Opens and closes every day at the times below.'
            : 'Open from the start time on the first day to the end time on the last day.'}
      </Text>
    </View>
  );
}

function DayRow({
  day,
  position,
  open,
  onToggle,
  onChange,
  onClosed,
}: {
  day: EffectiveDay;
  position: 'first' | 'last' | 'middle';
  /** One row is open at a time; DayHours holds which. */
  open: boolean;
  onToggle: () => void;
  /** null = back to the daily hours. */
  onChange: (next: DayOverride | null) => void;
  onClosed: (closed: boolean) => void;
}) {
  const theme = useTheme();
  const s = useStyles();
  const label = dayLabel(day.ymd);
  const value = day.closed ? 'Closed' : clockRange(day.open, day.close);
  const setTimes = (patch: { open?: string; close?: string }) =>
    onChange({ open: day.open, close: day.close, ...patch });

  return (
    <View style={{ borderTopWidth: 1, borderTopColor: theme.colors.cardBorder }}>
      {/* One summary line: "Fri, Nov 27 · 7:00pm–10:00pm". */}
      <Pressable
        onPress={onToggle}
        role="button"
        aria-expanded={open}
        aria-label={`${label}, ${value}`}
        style={{ minHeight: TARGET, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}
      >
        <Text style={[s.rowTimes, { flex: 1 }]}>
          <Text style={s.rowDay}>{label}</Text>
          {' · '}
          <Text style={day.closed ? s.rowClosed : s.rowTimes}>{value}</Text>
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={theme.colors.text} />
      </Pressable>

      {open ? (
        // The open day's editor, hung under its summary row: 8px below it,
        // indented, with a solid brand-orange rule down the left edge (the
        // approved mockup). Decorative only — the open state is the row's
        // aria-expanded and its chevron, never this colour.
        <View
          style={{
            gap: 8,
            marginTop: 8,
            marginBottom: 12,
            marginLeft: 12,
            paddingLeft: 12,
            borderLeftWidth: 2,
            borderLeftColor: brand.sparkOrange,
          }}
        >
          {day.closed ? null : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={s.tag}>OPENS</Text>
                <TimeField value={day.open} onChange={(v) => setTimes({ open: v })} label={`${label} opening time`} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={s.tag}>CLOSES</Text>
                <TimeField value={day.close} onChange={(v) => setTimes({ close: v })} label={`${label} closing time`} />
              </View>
              {closesNextDay(day.open, day.close) ? <Text style={s.body}>Closes the next day.</Text> : null}
            </>
          )}

          {position === 'middle' ? (
            <View style={{ minHeight: TARGET, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Switch
                value={day.closed}
                onValueChange={onClosed}
                aria-label={`Closed on ${label}`}
                trackColor={{ false: 'rgba(255,255,255,0.10)', true: brand.sparkOrange }}
                thumbColor="#ffffff"
              />
              <Text style={s.strong}>Closed this day</Text>
            </View>
          ) : (
            <Text style={s.body}>
              {`The ${position} day can't be closed. To leave it out, change the ${position === 'first' ? 'start' : 'end'} date instead.`}
            </Text>
          )}

          {day.customized ? (
            <Pressable
              onPress={() => onChange(null)}
              role="button"
              aria-label={`Use the daily hours on ${label}`}
              style={{ minHeight: TARGET, justifyContent: 'center', alignSelf: 'flex-start' }}
            >
              <Text style={[s.strong, { textDecorationLine: 'underline' }]}>Use the daily hours</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function DayHours({
  input,
  onChange,
  problem,
}: {
  input: HoursInput;
  onChange: (overrides: DayOverrides) => void;
  /** Any message that blocks the form for its hours (buildHours, or the
   *  form's own limit). */
  problem: string | null;
}) {
  const theme = useTheme();
  const s = useStyles();
  const [listOpen, setListOpen] = useState(false);
  // The one day whose editor is open; null = all collapsed (the default).
  const [openDay, setOpenDay] = useState<string | null>(null);
  const daily = effectiveMode(input) === 'daily';
  const days = daily ? effectiveDays(input) : [];
  const customized = days.filter((d) => d.customized).length;

  const setDay = (ymd: string, next: DayOverride | null) => {
    const rest = { ...input.overrides };
    if (next) rest[ymd] = next;
    else delete rest[ymd];
    onChange(rest);
  };

  return (
    <View style={{ marginBottom: daily || problem ? 14 : 0 }}>
      {daily ? (
        <>
          <Text style={s.body}>Every day {clockRange(input.startTime, input.endTime)}</Text>
          <Pressable
            onPress={() => {
              setListOpen((o) => !o);
              setOpenDay(null);
            }}
            role="button"
            aria-expanded={listOpen}
            style={{ minHeight: TARGET, flexDirection: 'row', alignItems: 'center', gap: 8 }}
          >
            <Text style={s.strong}>
              {customized ? `Customize a day · ${customized} changed` : 'Customize a day'}
            </Text>
            <Ionicons name={listOpen ? 'chevron-up' : 'chevron-down'} size={16} color={theme.colors.text} />
          </Pressable>
          {listOpen
            ? days.map((d, i) => (
                <DayRow
                  key={d.ymd}
                  day={d}
                  position={i === 0 ? 'first' : i === days.length - 1 ? 'last' : 'middle'}
                  open={openDay === d.ymd}
                  onToggle={() => setOpenDay((cur) => (cur === d.ymd ? null : d.ymd))}
                  onChange={(next) => setDay(d.ymd, next)}
                  onClosed={(closed) => setDay(d.ymd, { ...input.overrides[d.ymd], closed })}
                />
              ))
            : null}
        </>
      ) : null}
      {/* Mounted unconditionally; only its children swap (ACCESSIBILITY.md
          Entries 2–4). */}
      <View role="status" aria-live="polite" style={{ marginTop: problem ? 8 : 0 }}>
        {problem ? <Text style={[s.body, { color: theme.colors.danger }]}>{problem}</Text> : null}
      </View>
    </View>
  );
}

// Daily hours — what the create forms send as events.hours (0039).
//
// hours = null means open for the whole span. Otherwise it is one window per
// open day, and starts_at / ends_at are the FIRST opening and the LAST closing:
// app.validate_event_hours refuses any other pair (hours_span_mismatch). So
// both forms take all three values from buildHours and never compute them
// separately.
//
// Every instant is built from a calendar day plus a wall-clock time in the
// DEVICE time zone. Days are stepped with setDate, never by adding 24 hours,
// so a clock change inside the event does not move anyone's opening time.
//
// Pure: no React, no Supabase.

export type HoursMode = 'daily' | 'open';

/** One customized day. Times are 24h 'HH:MM', both set or neither: a day that
 *  was only closed keeps following the daily hours if it reopens. */
export interface DayOverride {
  open?: string;
  close?: string;
  closed?: boolean;
}

export type DayOverrides = Record<string, DayOverride>;

export interface HoursWindow {
  opens_at: string;
  closes_at: string;
}

export interface HoursInput {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  mode: HoursMode;
  overrides: DayOverrides;
}

export interface BuiltHours {
  hours: HoursWindow[] | null;
  starts_at: string;
  ends_at: string;
  /** Plain message when the times cannot be sent; null when they can. */
  problem: string | null;
  /** "Fri–Sun · 8:00am–4:00pm · Sun closes 12:00pm", read back from `hours`
   *  itself, so Review describes exactly what is sent. Null when hours is. */
  summary: string | null;
}

export interface EffectiveDay {
  ymd: string;
  open: string;
  close: string;
  closed: boolean;
  /** First and last day: can have their own times, can never be closed. */
  edge: boolean;
  customized: boolean;
}

/** The server's cap on windows (0039 hours_too_many). */
export const HOURS_MAX_DAYS = 31;

const HOUR_MS = 3_600_000;
const pad = (n: number) => String(n).padStart(2, '0');

function ymdOf(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** `ymd` moved by whole calendar days, via local noon (DST-safe). */
function addDays(ymd: string, n: number): string {
  const d = new Date(`${ymd}T12:00:00`);
  d.setDate(d.getDate() + n);
  return ymdOf(d);
}

/** Every calendar day from start to end, inclusive. Stops one past the cap: a
 *  longer range is never listed, only refused. */
function dayList(startDate: string, endDate: string): string[] {
  const out: string[] = [];
  for (let d = startDate; d <= endDate && out.length <= HOURS_MAX_DAYS; d = addDays(d, 1)) out.push(d);
  return out;
}

/** Device-local wall clock → ISO with an explicit offset
 *  ("2026-11-27T08:00:00-05:00"), the zone 0039 requires. */
function zoned(ymd: string, hhmm: string): string {
  const d = new Date(`${ymd}T${hhmm}:00`);
  const off = -d.getTimezoneOffset();
  const abs = Math.abs(off);
  // Read back from the Date, not from the inputs: a time skipped by a clock
  // change is moved forward, and the text must name that same instant.
  return `${ymdOf(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:00${off < 0 ? '-' : '+'}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

/** The device-local calendar day of an ISO instant. */
export function localYMD(iso: string): string {
  return ymdOf(new Date(iso));
}

/** A closing time at or before its opening time is the NEXT day's. */
export function closesNextDay(open: string, close: string): boolean {
  return close <= open;
}

/** Any 12:xx time names which twelve it is (Jas, 2026-11-27): 12am and 12pm
 *  are the two times people misread. */
function twelve(hhmm: string): string | null {
  const h = Number(hhmm.slice(0, 2));
  return h === 12 ? 'noon' : h === 0 ? 'midnight' : null;
}

function bare(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${pad(m)}${h >= 12 ? 'pm' : 'am'}`;
}

/** 'HH:MM' → "8:00am", "12:00pm (noon)", "12:30am (midnight)". */
export function clock(hhmm: string): string {
  const t = twelve(hhmm);
  return t ? `${bare(hhmm)} (${t})` : bare(hhmm);
}

/** "8:00am–4:00pm", "7:00pm–2:00am (next day)",
 *  "7:00pm–12:00am (midnight, next day)" — one bracket, never two. */
export function clockRange(open: string, close: string): string {
  return `${clock(open)}–${closing(open, close)}`;
}

/** A closing time with its notes: "4:00pm", "2:00am (next day)",
 *  "12:00am (midnight, next day)". */
function closing(open: string, close: string): string {
  const notes = [twelve(close), closesNextDay(open, close) ? 'next day' : null].filter(Boolean);
  return `${bare(close)}${notes.length ? ` (${notes.join(', ')})` : ''}`;
}

/** "Fri, Nov 27". */
export function dayLabel(ymd: string): string {
  return new Date(`${ymd}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/** The mode in force: daily hours exist only for 2–31 day events. */
export function effectiveMode(i: Pick<HoursInput, 'startDate' | 'endDate' | 'mode'>): HoursMode {
  if (i.startDate === i.endDate) return 'open';
  return dayList(i.startDate, i.endDate).length > HOURS_MAX_DAYS ? 'open' : i.mode;
}

/** Each day with the hours it will actually get. An edge day is never closed,
 *  even if it was closed while it was still a middle day. */
export function effectiveDays(i: HoursInput): EffectiveDay[] {
  return dayList(i.startDate, i.endDate).map((ymd) => {
    const o = i.overrides[ymd];
    const edge = ymd === i.startDate || ymd === i.endDate;
    const open = o?.open ?? i.startTime;
    const close = o?.close ?? i.endTime;
    const closed = !edge && Boolean(o?.closed);
    return { ymd, edge, open, close, closed, customized: closed || open !== i.startTime || close !== i.endTime };
  });
}

export function buildHours(i: HoursInput): BuiltHours {
  if (effectiveMode(i) === 'open') {
    return {
      hours: null,
      starts_at: new Date(`${i.startDate}T${i.startTime}:00`).toISOString(),
      ends_at: new Date(`${i.endDate}T${i.endTime}:00`).toISOString(),
      problem: null,
      summary: null,
    };
  }

  const all = effectiveDays(i);
  const days = all.filter((d) => !d.closed);
  const hours = days.map((d) => ({
    opens_at: zoned(d.ymd, d.open),
    closes_at: zoned(closesNextDay(d.open, d.close) ? addDays(d.ymd, 1) : d.ymd, d.close),
  }));

  let problem: string | null = null;
  for (let n = 0; n < hours.length && !problem; n++) {
    const opens = Date.parse(hours[n].opens_at);
    const closes = Date.parse(hours[n].closes_at);
    const label = dayLabel(days[n].ymd);
    if (closes <= opens) {
      // Only a clock change can do this: closesNextDay settles every other pair.
      problem = `The clocks change on ${label}, so those hours don't work that day. Customize that day's times.`;
    } else if (closes - opens > 24 * HOUR_MS) {
      problem = `${label} would be open for more than 24 hours. Set an earlier closing time.`;
    } else if (n + 1 < hours.length && Date.parse(hours[n + 1].opens_at) < closes) {
      problem = `${label} closes after ${dayLabel(days[n + 1].ymd)} opens. Change one of those times.`;
    }
  }

  // The summary reads each day's clocks back from the window text (zoned()
  // writes the device wall clock), not from the inputs: a time a clock change
  // skips is sent moved, and Review must show the moved time.
  let w = 0;
  const sent = all.map((d) => {
    if (d.closed) return d;
    const win = hours[w++];
    return { ...d, open: win.opens_at.slice(11, 16), close: win.closes_at.slice(11, 16) };
  });

  return {
    hours,
    starts_at: hours[0].opens_at,
    ends_at: hours[hours.length - 1].closes_at,
    problem,
    summary: summarize(i, sent),
  };
}

/** "Fri–Sun · 8:00am–4:00pm · Sun closes 12:00pm". A range longer than a week
 *  uses dates, because weekday names would repeat. Only buildHours calls it,
 *  with the clocks it actually sent. */
function summarize(i: HoursInput, days: Pick<EffectiveDay, 'ymd' | 'open' | 'close' | 'closed'>[]): string {
  const short = (ymd: string) =>
    new Date(`${ymd}T12:00:00`).toLocaleDateString(
      undefined,
      days.length <= 7 ? { weekday: 'short' } : { month: 'short', day: 'numeric' },
    );
  const parts = days
    .filter((d) => d.closed || d.open !== i.startTime || d.close !== i.endTime)
    .map((d) => {
      const name = short(d.ymd);
      if (d.closed) return `${name} closed`;
      const next = closesNextDay(d.open, d.close);
      // "closes 12:00pm" alone only reads right while the opening is unchanged.
      if (d.open === i.startTime) return `${name} closes ${closing(d.open, d.close)}`;
      if (d.close === i.endTime && next === closesNextDay(i.startTime, i.endTime)) {
        return `${name} opens ${clock(d.open)}`;
      }
      return `${name} ${clockRange(d.open, d.close)}`;
    });
  const shown = parts.slice(0, 4);
  if (parts.length > 4) shown.push(`${parts.length - 4} more`);
  return [
    `${short(i.startDate)}–${short(i.endDate)}`,
    clockRange(i.startTime, i.endTime),
    ...shown,
  ].join(' · ');
}

/** 0039's named errors in plain words. The forms should never reach these.
 *  Null when the message is not one of them. */
export function hoursErrorMessage(message: string): string | null {
  const known: Record<string, string> = {
    hours_malformed: "We couldn't read the daily hours. Check each day's times and try again.",
    hours_too_many: `Daily hours can cover at most ${HOURS_MAX_DAYS} days. Choose "Open the whole time" instead.`,
    hours_window_order: 'A day closes before it opens. Check the daily hours and try again.',
    hours_window_too_long: 'A day is open for more than 24 hours. Set an earlier closing time.',
    hours_not_sorted: 'The days are out of order. Check the daily hours and try again.',
    hours_overlap: "One day's hours run into the next day's. Change one of those times.",
    hours_span_mismatch: "The daily hours don't match the event's start and end. Check the dates and times and try again.",
  };
  const key = Object.keys(known).find((k) => message.includes(k));
  return key ? known[key] : null;
}

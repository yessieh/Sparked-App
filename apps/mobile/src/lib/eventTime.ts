// Client-side time derivation — EVERYTHING displayed about an event's time is
// computed on-device from the single UTC starts_at/ends_at (architecture lock:
// no stored display strings, no polling/subscriptions to keep time current).
// Ported from the prototype's eventCountdown logic.

export interface Countdown {
  /** Big Montserrat value, e.g. "4h", "2", "NOW" */
  big: string;
  /** Small caps label under it, e.g. "STARTS IN", "DAYS", "LIVE NOW" */
  label: string;
  live: boolean;
}

export function eventCountdown(
  startsAtISO: string,
  endsAtISO?: string | null,
  now: Date = new Date(),
): Countdown {
  const start = new Date(startsAtISO);
  const end = endsAtISO ? new Date(endsAtISO) : new Date(start.getTime() + 3 * 3600000);

  if (now >= start && now <= end) {
    return { big: 'NOW', label: 'LIVE', live: true };
  }
  const ms = start.getTime() - now.getTime();
  if (ms <= 0) return { big: '—', label: 'ENDED', live: false };

  const mins = Math.round(ms / 60000);
  if (mins < 60) return { big: `${mins}m`, label: 'STARTS IN', live: false };
  const hours = Math.round(mins / 60);
  if (hours < 24) return { big: `${hours}h`, label: 'STARTS IN', live: false };
  const days = Math.round(hours / 24);
  return { big: `${days}`, label: days === 1 ? 'DAY' : 'DAYS', live: false };
}

/**
 * THE ended-test. Every "Past" split in the app goes through this, and it is
 * defined as eventCountdown's own verdict rather than a second comparison
 * against starts_at — so a section header and the chip on the card inside it
 * can never disagree. Live events (started, not finished) are NOT ended: they
 * read LIVE and stay in their upcoming bucket.
 *
 * Used by the Saved tab's Past section and the Workspace listings' Past
 * section. Adding a third caller is the point.
 */
export function hasEnded(
  startsAtISO: string,
  endsAtISO?: string | null,
  now?: Date,
): boolean {
  return eventCountdown(startsAtISO, endsAtISO, now).label === 'ENDED';
}

export type SavedBucket = 'tonight' | 'weekend' | 'coming';

/**
 * Saved-screen grouping (ported from the prototype's SavedScreen):
 * Tonight = starts today; This Weekend = the coming Sat/Sun; Coming Up =
 * everything later. Computed on-device from starts_at (architecture lock #4).
 */
export function savedBucket(startsAtISO: string, now: Date = new Date()): SavedBucket {
  const s = new Date(startsAtISO);
  const sameDay =
    s.getFullYear() === now.getFullYear() &&
    s.getMonth() === now.getMonth() &&
    s.getDate() === now.getDate();
  if (sameDay) return 'tonight';
  const satOffset = (6 - now.getDay() + 7) % 7; // days until the coming Saturday (0 if today)
  const satStart = new Date(now);
  satStart.setDate(now.getDate() + satOffset);
  satStart.setHours(0, 0, 0, 0);
  const sunEnd = new Date(satStart);
  sunEnd.setDate(satStart.getDate() + 1);
  sunEnd.setHours(23, 59, 59, 999);
  const t = s.getTime();
  if (t >= satStart.getTime() && t <= sunEnd.getTime()) return 'weekend';
  return 'coming';
}

/**
 * The LOCAL calendar day an instant falls on, as 'YYYY-MM-DD'. The grouping key
 * for Explore's timeline (Arc E).
 *
 * LOCAL IS LOAD-BEARING. Seed event 0002 starts 02:45 UTC on Sep 20, which is
 * the evening of Sep 19 in Phoenix. `iso.slice(0, 10)` — the UTC day — files it
 * under the wrong header, and the bug is invisible to anyone testing in UTC+0.
 * `getFullYear`/`getMonth`/`getDate` resolve in the device timezone.
 */
export function localDayKey(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * The header a timeline day wears: "Today", "Tomorrow", the weekday name for
 * the five days after that, then "Sat, Sep 26" beyond. Days BEFORE today (a
 * multi-day event still running from yesterday) fall through to the dated
 * form rather than inventing "Yesterday" — a date is truthful, a relative word
 * for the past reads as an error on a discovery feed.
 *
 * Day distance is counted in LOCAL calendar days, not 24-hour spans, so an
 * event at 11pm tonight and one at 1am tomorrow are one day apart.
 */
export function dayLabel(iso: string, now: Date = new Date()): string {
  const day = new Date(iso);
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((startOf(day) - startOf(now)) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff >= 2 && diff <= 6) return day.toLocaleDateString(undefined, { weekday: 'long' });
  return eventDateLabel(iso);
}

/** "Sat, Jul 12" — device-local. */
export function eventDateLabel(startsAtISO: string): string {
  return new Date(startsAtISO).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/** "6:00 – 9:00pm" (or "6:00pm" when no end) — device-local. */
export function eventTimeLabel(startsAtISO: string, endsAtISO?: string | null): string {
  const fmt = (d: Date) =>
    d
      .toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
      .toLowerCase()
      .replace(/\s/g, '');
  const start = new Date(startsAtISO);
  if (!endsAtISO) return fmt(start);
  return `${fmt(start)} – ${fmt(new Date(endsAtISO))}`;
}

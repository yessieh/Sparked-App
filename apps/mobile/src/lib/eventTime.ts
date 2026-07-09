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

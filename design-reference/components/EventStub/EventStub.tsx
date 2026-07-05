import React from 'react';

/**
 * EventStub — Sparked's universal ticket-stub event card.
 *
 * One component, two variants sharing a single anatomy:
 *   • "photo"   — Explore / discovery. A photo header sells the unknown.
 *   • "compact" — Saved / logistics. No photo; status + countdown lead.
 *
 * Constant across both variants: the left stripe, the perforated divider,
 * and the right-hand utility column carrying a live countdown. The stripe is
 * a single brand bar — it encodes nothing (no category color, no semantic
 * green) per the current voice-and-tone rules. The perforated divider is
 * reserved for events only; other content types reuse the tokens, never the
 * perforation.
 */

export interface EventStubEvent {
  title: string;
  date?: string;
  time?: string;
  location?: string;
  tags?: string[];
  gradient?: string;
  /** Ticket price in whole dollars. 0 / undefined renders as "Free". */
  price?: number;
  /** ISO start timestamp — drives the countdown in the utility column. */
  startISO?: string;
  /** Distance from the user, in miles (photo variant only). */
  mi?: number;
  saved?: boolean;
  going?: boolean;
  rsvps?: number;
}

export interface EventStubProps {
  event: EventStubEvent;
  variant?: 'photo' | 'compact';
  onTap?: () => void;
  onSave?: (event: EventStubEvent) => void;
  onShare?: (event: EventStubEvent) => void;
}

export interface Countdown {
  value: string;
  label: string;
  sub: string;
  urgent?: boolean;
  live?: boolean;
}

const STUB_STRIPE = 'linear-gradient(180deg,#ff6348,#FCA311,#F7B731)';

const twoTags = (tags?: string[]) => (tags || []).slice(0, 2).join(' · ').toUpperCase();

const timeStr = (d: Date) => {
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return m ? `${h}:${String(m).padStart(2, '0')}${ap}` : `${h}${ap}`;
};

const shortDate = (d: Date) => {
  const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
  const wd = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
  return `${wd} ${mo} ${d.getDate()}`;
};

/**
 * Derive the countdown shown in the utility column.
 *  • Same-day events tick hourly; inside the final hour → "less than an hour".
 *  • Future events count whole days ("2 Days", "1 Day").
 *  • Anything already started reads "Now / Happening".
 */
export function eventCountdown(startISO?: string): Countdown {
  if (!startISO) return { value: '—', label: '', sub: '' };
  const start = new Date(startISO).getTime();
  const diff = start - Date.now();
  if (diff <= 0) return { value: 'Now', label: 'Happening', sub: '', live: true };
  const mins = diff / 60000;
  const sd = new Date(startISO);
  const nd = new Date();
  const sameDay = sd.getFullYear() === nd.getFullYear() && sd.getMonth() === nd.getMonth() && sd.getDate() === nd.getDate();
  if (sameDay) {
    if (mins < 60) return { value: '<1h', label: 'Starts in', sub: 'less than an hour', urgent: true };
    return { value: Math.floor(mins / 60) + 'h', label: 'Starts in', sub: timeStr(sd) };
  }
  const days = Math.ceil(diff / 86400000);
  return { value: String(days), label: days === 1 ? 'Day' : 'Days', sub: shortDate(sd) };
}

type IconProps = { name: string; size?: number; color?: string; fill?: string };
const SIcon: React.FC<IconProps> = ({ name, size = 13, color = 'currentColor', fill = 'none' }) => {
  const p: any = { width: size, height: size, viewBox: '0 0 24 24', fill, stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'cal': return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
    case 'clock': return <svg {...p}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;
    case 'pin': return <svg {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
    case 'bookmark': return <svg {...p}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>;
    case 'bookmark-fill': return <svg {...p} fill={color}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>;
    case 'share': return <svg {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;
    case 'check': return <svg {...p}><path d="M20 6 9 17l-5-5"/></svg>;
    default: return null;
  }
};

const Perf: React.FC = () => (
  <div style={{ position: 'relative', width: 2, alignSelf: 'stretch', margin: '12px 0', display: 'flex', justifyContent: 'center' }}>
    <div style={{ width: 0, borderLeft: '2px dotted rgba(238,240,255,0.22)', height: '100%' }}></div>
    <div style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', width: 14, height: 14, borderRadius: '50%', background: '#14213D' }}></div>
    <div style={{ position: 'absolute', bottom: -18, left: '50%', transform: 'translateX(-50%)', width: 14, height: 14, borderRadius: '50%', background: '#14213D' }}></div>
  </div>
);

const UtilCol: React.FC<{ cd: Countdown; center?: boolean; children?: React.ReactNode }> = ({ cd, center, children }) => (
  <div style={{ width: 84, flexShrink: 0, padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: center ? 'center' : 'space-between', gap: 12, textAlign: 'center' }}>
    <div>
      <div style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: cd.urgent ? 15 : 22, lineHeight: 1, color: cd.live ? '#ff6348' : '#FCA311' }}>{cd.value}</div>
      <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(238,240,255,0.45)', marginTop: 5, lineHeight: 1.3, whiteSpace: 'nowrap' }}>{cd.label}</div>
      {cd.sub ? <div style={{ fontSize: 8, color: 'rgba(238,240,255,0.40)', marginTop: 4, lineHeight: 1.2, whiteSpace: 'nowrap' }}>{cd.sub}</div> : null}
    </div>
    {children}
  </div>
);

const MetaLine: React.FC<{ icon: string; iconColor: string; children: React.ReactNode }> = ({ icon, iconColor, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, minWidth: 0 }}>
    <SIcon name={icon} size={12} color={iconColor} />
    <span style={{ fontSize: 11.5, color: 'rgba(238,240,255,0.60)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{children}</span>
  </div>
);

const CatPill: React.FC<{ tags?: string[]; style?: React.CSSProperties }> = ({ tags, style }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 9px', borderRadius: 9999, background: 'rgba(15,26,48,0.72)', backdropFilter: 'blur(6px)', border: '1px solid rgba(252,163,17,0.30)', fontSize: 9, fontWeight: 900, letterSpacing: '0.14em', color: '#FCA311', whiteSpace: 'nowrap', ...style }}>{twoTags(tags)}</span>
);

const PriceChip: React.FC<{ price?: number; style?: React.CSSProperties }> = ({ price, style }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 9999, background: 'rgba(15,26,48,0.72)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.16)', fontSize: 11, fontWeight: 800, color: '#fff', ...style }}>{!price ? 'Free' : '$' + price}</span>
);

const StatusChip: React.FC<{ going?: boolean; saved?: boolean }> = ({ going, saved }) => {
  if (!going && !saved) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 9999, background: 'rgba(252,163,17,0.12)', border: '1px solid rgba(252,163,17,0.32)', fontSize: 10.5, fontWeight: 800, color: '#FCA311' }}>
      <SIcon name={going ? 'check' : 'bookmark-fill'} size={11} color="#FCA311" />
      {going ? 'Going' : 'Saved'}
    </span>
  );
};

const stubBtn = (active: boolean): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 9, cursor: 'pointer', padding: 0,
  background: active ? 'rgba(252,163,17,0.14)' : 'rgba(255,255,255,0.07)',
  border: `1px solid ${active ? 'rgba(252,163,17,0.35)' : 'rgba(255,255,255,0.12)'}`,
});

export const EventStub: React.FC<EventStubProps> = ({ event, variant = 'photo', onTap, onSave, onShare }) => {
  // Live tick — re-render each minute so the countdown stays accurate
  // (covers the hourly cadence and the final-hour "less than an hour" flip).
  const [, force] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => force((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);
  const [saved, setSaved] = React.useState(!!event.saved);
  const cd = eventCountdown(event.startISO);

  const shell: React.CSSProperties = {
    display: 'flex', alignItems: 'stretch', width: '100%', textAlign: 'left',
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(238,240,255,0.10)',
    borderRadius: 24, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.20)',
  };
  const stripe = <div style={{ width: 5, flexShrink: 0, background: STUB_STRIPE }}></div>;

  if (variant === 'compact') {
    return (
      <div onClick={onTap} style={shell}>
        {stripe}
        <div style={{ flex: 1, minWidth: 0, padding: '13px 15px' }}>
          <CatPill tags={event.tags} />
          <h3 style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 16, letterSpacing: '-0.01em', margin: '9px 0 0', lineHeight: 1.15, color: '#eef0ff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</h3>
          <MetaLine icon="clock" iconColor="#ff6348">{event.time}</MetaLine>
          <MetaLine icon="pin" iconColor="#FCA311">{event.location}</MetaLine>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 10 }}>
            <StatusChip going={event.going} saved={saved} />
            {typeof event.rsvps === 'number' ? <span style={{ fontSize: 11, color: 'rgba(238,240,255,0.45)' }}>{event.rsvps} RSVPs</span> : null}
          </div>
        </div>
        <Perf />
        <UtilCol cd={cd} center>
          <button onClick={(e) => { e.stopPropagation(); setSaved((s) => !s); onSave && onSave(event); }} aria-label={saved ? 'Saved' : 'Save'} style={stubBtn(saved)}>
            <SIcon name={saved ? 'bookmark-fill' : 'bookmark'} size={13} color={saved ? '#FCA311' : '#fff'} />
          </button>
        </UtilCol>
      </div>
    );
  }

  return (
    <div onClick={onTap} style={shell}>
      {stripe}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 150, position: 'relative', background: event.gradient || 'linear-gradient(135deg,#5b3220,#a8551d 60%,#e09c3a)' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(20,33,61,0.78), transparent 60%)' }}></div>
          <CatPill tags={event.tags} style={{ position: 'absolute', top: 12, left: 12 }} />
          <PriceChip price={event.price} style={{ position: 'absolute', top: 12, right: 12 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          <div style={{ flex: 1, minWidth: 0, padding: '13px 15px' }}>
            <h3 style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 18, letterSpacing: '-0.01em', margin: 0, lineHeight: 1.12, color: '#eef0ff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</h3>
            <MetaLine icon="cal" iconColor="#ff6348">{event.date} · {event.time}</MetaLine>
            <MetaLine icon="pin" iconColor="#FCA311">{event.location}{typeof event.mi === 'number' ? ` · ${event.mi} mi` : ''}</MetaLine>
          </div>
          <Perf />
          <UtilCol cd={cd}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={(e) => { e.stopPropagation(); setSaved((s) => !s); onSave && onSave(event); }} aria-label={saved ? 'Saved' : 'Save'} style={stubBtn(saved)}>
                <SIcon name={saved ? 'bookmark-fill' : 'bookmark'} size={13} color={saved ? '#FCA311' : '#fff'} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onShare && onShare(event); }} aria-label="Share" style={stubBtn(false)}>
                <SIcon name="share" size={13} color="#fff" />
              </button>
            </div>
          </UtilCol>
        </div>
      </div>
    </div>
  );
};

export default EventStub;

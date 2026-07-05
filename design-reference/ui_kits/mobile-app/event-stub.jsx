// Sparked — EventStub: the universal ticket-stub event card (prototype copy).
// Mirrors the typed DS component at components/EventStub/EventStub.tsx, but
// authored for the in-page Babel runtime (global React, window-exposed).
//
// Two variants share one anatomy:
//   • 'photo'   — Explore / discovery (photo header sells the unknown)
//   • 'compact' — Saved / logistics (no photo; status + countdown lead)
// Constant across both: left stripe, perforated divider, right utility column
// with a live countdown. Stripe is a single brand bar — it encodes nothing
// (no category color, no green) per the current voice-and-tone rules.

const STUB_STRIPE = 'linear-gradient(180deg,#ff6348,#FCA311,#F7B731)';
const STUB_SPARK = 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)';

// Per-category stripe colors for the compact (Saved) stub. The photo stub keeps
// the single brand bar; the Saved view leans on category color to scan a list
// fast. Distinct hues, shared chroma/lightness — green is reserved for status.
const CATEGORY_COLOR = {
  Curbside: '#4ade80',
  Markets: '#2dd4bf', Music: '#f472b6', Art: '#a78bfa', Food: '#fbbf24',
  Community: '#fb923c', 'Pop-Ups': '#38bdf8', Outdoors: '#84cc16',
  Family: '#fb7185', Live: '#ff6348',
};
function _catColor(tags) {
  for (const t of (tags || [])) { if (CATEGORY_COLOR[t]) return CATEGORY_COLOR[t]; }
  return '#FCA311';
}

function _twoTags(tags) { return (tags || []).slice(0, 2).join(' · ').toUpperCase(); }
function _timeStr(d) {
  let h = d.getHours(); const m = d.getMinutes(); const ap = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12; return m ? `${h}:${String(m).padStart(2, '0')}${ap}` : `${h}${ap}`;
}
function _shortDate(d) {
  const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
  const wd = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
  return `${wd} ${mo} ${d.getDate()}`;
}

// Derive the countdown shown in the utility column.
//  • Same-day events tick hourly; inside the final hour → "less than an hour".
//  • Future events count whole days ("2 Days", "1 Day").
//  • Anything already started reads "Now / Happening".
function eventCountdown(startISO) {
  if (!startISO) return { value: '—', label: '', sub: '' };
  const start = new Date(startISO).getTime();
  const diff = start - Date.now();
  if (diff <= 0) return { value: 'Now', label: 'Happening', sub: '', live: true };
  const mins = diff / 60000;
  const sd = new Date(startISO); const nd = new Date();
  const sameDay = sd.getFullYear() === nd.getFullYear() && sd.getMonth() === nd.getMonth() && sd.getDate() === nd.getDate();
  if (sameDay) {
    if (mins < 60) return { value: '<1h', label: 'Starts in', sub: 'less than an hour', urgent: true };
    return { value: Math.floor(mins / 60) + 'h', label: 'Starts in', sub: _timeStr(sd) };
  }
  const days = Math.ceil(diff / 86400000);
  return { value: String(days), label: days === 1 ? 'Day' : 'Days', sub: _shortDate(sd) };
}

const _SIcon = ({ name, size = 13, color = 'currentColor', fill = 'none' }) => {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill, stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
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

// Perforated vertical divider with ticket notches top & bottom.
const _Perf = () => (
  <div style={{ position: 'relative', width: 2, alignSelf: 'stretch', margin: '12px 0', display: 'flex', justifyContent: 'center' }}>
    <div style={{ width: 0, borderLeft: '2px dotted var(--app-text-hint, rgba(238,240,255,0.22))', height: '100%' }}></div>
    <div style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', width: 14, height: 14, borderRadius: '50%', background: 'var(--app-bg)' }}></div>
    <div style={{ position: 'absolute', bottom: -18, left: '50%', transform: 'translateX(-50%)', width: 14, height: 14, borderRadius: '50%', background: 'var(--app-bg)' }}></div>
  </div>
);

const _UtilCol = ({ cd, center, gradient, children }) => {
  // Countdown numeral: spark gradient on compact (Saved) stubs, solid amber on
  // the photo stub. Live ('Now') always burns coral.
  const bigStyle = { fontFamily: 'Montserrat', fontWeight: 900, fontSize: cd.urgent ? 15 : 22, lineHeight: 1 };
  if (gradient && !cd.live) {
    Object.assign(bigStyle, { backgroundImage: STUB_SPARK, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' });
  } else {
    bigStyle.color = cd.live ? '#ff6348' : '#FCA311';
  }
  return (
    <div style={{ width: 84, flexShrink: 0, padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: center ? 'center' : 'space-between', gap: 12, textAlign: 'center' }}>
      <div>
        <div style={bigStyle}>{cd.value}</div>
        <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--app-text-faint)', marginTop: 5, lineHeight: 1.3, whiteSpace: 'nowrap' }}>{cd.label}</div>
        {cd.sub && <div style={{ fontSize: 8, color: 'var(--app-text-faint)', marginTop: 4, lineHeight: 1.2, whiteSpace: 'nowrap' }}>{cd.sub}</div>}
      </div>
      {children}
    </div>
  );
};

const _MetaLine = ({ icon, iconColor, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, minWidth: 0 }}>
    <_SIcon name={icon} size={12} color={iconColor} />
    <span style={{ fontSize: 11.5, color: 'var(--app-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{children}</span>
  </div>
);

// Up to `max` category badges, then a "+N" overflow chip so the card never
// visually breaks no matter how many categories an organizer selects.
const _CatPill = ({ tags, max = 3, style }) => {
  const list = (tags || []).filter(Boolean);
  const shown = list.slice(0, max);
  const extra = list.length - shown.length;
  const base = { display: 'inline-flex', alignItems: 'center', padding: '4px 9px', borderRadius: 9999, background: 'rgba(15,26,48,0.72)', backdropFilter: 'blur(6px)', border: '1px solid rgba(252,163,17,0.30)', fontSize: 9, fontWeight: 900, letterSpacing: '0.14em', color: '#FCA311', whiteSpace: 'nowrap' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, ...style }}>
      {shown.map((t, i) => <span key={i} style={base}>{String(t).toUpperCase()}</span>)}
      {extra > 0 && <span style={{ ...base, color: '#eef0ff', border: '1px solid rgba(255,255,255,0.20)', letterSpacing: '0.04em' }}>+{extra}</span>}
    </span>
  );
};

const _PriceChip = ({ price, style, hide }) => (
  hide ? null : <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 9999, background: 'rgba(15,26,48,0.72)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.16)', fontSize: 11, fontWeight: 800, color: '#fff', ...style }}>{!price ? 'Free' : '$' + price}</span>
);

const _StatusChip = ({ going, saved }) => {
  if (!going && !saved) return null;
  // Going burns green (#4ade80, committed). Saved is a muted, unfilled state.
  const c = going ? '#4ade80' : 'rgba(238,240,255,0.62)';
  const bg = going ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.05)';
  const bd = going ? 'rgba(74,222,128,0.36)' : 'rgba(238,240,255,0.16)';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 9999, background: bg, border: `1px solid ${bd}`, fontSize: 10.5, fontWeight: 800, color: c }}>
      <_SIcon name={going ? 'check' : 'bookmark-fill'} size={11} color={c} />
      {going ? 'Going' : 'Saved'}
    </span>
  );
};

function _stubBtn(active) {
  return { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 9, cursor: 'pointer', padding: 0, background: active ? 'rgba(252,163,17,0.14)' : 'rgba(255,255,255,0.07)', border: `1px solid ${active ? 'rgba(252,163,17,0.35)' : 'rgba(255,255,255,0.12)'}` };
}

const EventStubCard = ({ event, variant = 'photo', onTap, onSave, onShare, pastRadius = null, hidePrice = false, priceInBody = false }) => {
  // Live tick — re-render each minute so the countdown stays accurate
  // (covers the hourly cadence and the final-hour "less than an hour" flip).
  const [, force] = React.useState(0);
  React.useEffect(() => { const id = setInterval(() => force(t => t + 1), 60000); return () => clearInterval(id); }, []);
  const [saved, setSaved] = React.useState(!!event.saved);
  const cd = eventCountdown(event.startISO);
  // Overflow ("just past your radius") cards reuse this exact stub but step
  // back: the whole card is desaturated + dimmed and the stripe goes muted.
  const stepped = pastRadius != null;

  const shell = {
    display: 'flex', alignItems: 'stretch', width: '100%', textAlign: 'left',
    background: 'var(--app-card-bg)', border: '1px solid var(--app-card-border)',
    borderRadius: 24, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.20)',
    opacity: stepped ? 0.82 : 1, filter: stepped ? 'saturate(0.55)' : 'none',
  };
  const stripe = <div style={{ width: 5, flexShrink: 0, background: stepped ? 'linear-gradient(180deg,#5b5650,#6a6358,#5b5650)' : STUB_STRIPE }}></div>;

  if (variant === 'compact') {
    return (
      <div onClick={onTap} style={shell}>
        <div style={{ width: 5, flexShrink: 0, background: _catColor(event.tags) }}></div>
        <div style={{ flex: 1, minWidth: 0, padding: '13px 15px' }}>
          <_CatPill tags={event.tags} />
          <h3 style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 16, letterSpacing: '-0.01em', margin: '9px 0 0', lineHeight: 1.15, color: 'var(--app-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</h3>
          <_MetaLine icon="clock" iconColor="#ff6348">{event.time}</_MetaLine>
          <_MetaLine icon="pin" iconColor="#FCA311">{event.location}</_MetaLine>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 10 }}>
            <_StatusChip going={event.going} saved={saved} />
            {typeof event.rsvps === 'number' && <span style={{ fontSize: 11, color: 'var(--app-text-faint)' }}>{event.rsvps} RSVPs</span>}
          </div>
        </div>
        <_Perf />
        <_UtilCol cd={cd} center gradient>
          <button onClick={(e) => { e.stopPropagation(); setSaved(s => !s); onSave && onSave(event); }} aria-label={saved ? 'Saved' : 'Save'} style={_stubBtn(saved)}>
            <_SIcon name={saved ? 'bookmark-fill' : 'bookmark'} size={13} color={saved ? '#FCA311' : '#fff'} />
          </button>
        </_UtilCol>
      </div>
    );
  }

  return (
    <div onClick={onTap} style={shell}>
      {stripe}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 150, position: 'relative', background: event.gradient || 'linear-gradient(135deg,#5b3220,#a8551d 60%,#e09c3a)' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(20,33,61,0.78), transparent 60%)' }}></div>
          <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <_CatPill tags={event.tags} />
            {stepped && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '4px 9px 4px 7px', borderRadius: 9999, background: 'linear-gradient(135deg,#ff8c38,#ffca3a)', color: '#14213D', fontSize: 9.5, fontWeight: 900, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                <_SIcon name="pin" size={10} color="#14213D" />+{pastRadius} mi
              </span>
            )}
          </div>
          <_PriceChip price={event.price} hide={hidePrice || priceInBody} style={{ position: 'absolute', top: 12, right: 12 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          <div style={{ flex: 1, minWidth: 0, padding: '13px 15px' }}>
            <h3 style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 18, letterSpacing: '-0.01em', margin: 0, lineHeight: 1.12, color: 'var(--app-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</h3>
            <_MetaLine icon="cal" iconColor="#ff6348">{event.date} · {event.time}</_MetaLine>
            <_MetaLine icon="pin" iconColor="#FCA311">{event.location}{typeof event.mi === 'number' ? ` · ${event.mi} mi` : ''}</_MetaLine>
            {priceInBody && (
              event.price ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, minWidth: 0 }}>
                  <span style={{ width: 12, height: 12, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter', fontWeight: 600, fontSize: 13, lineHeight: 1, color: 'var(--app-green)' }}>$</span>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--app-text)', whiteSpace: 'nowrap', flexShrink: 0 }}>{event.price} per person</span>
                </div>
              ) : (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(74,222,128,0.14)', border: '1px solid rgba(74,222,128,0.35)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--app-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M4 9.5V7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2.5a2.5 2.5 0 0 0 0 5V17a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2.5a2.5 2.5 0 0 0 0-5Z" />
                    <path d="M14.5 6v12" strokeDasharray="2 2.5" />
                  </svg>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--app-green)', whiteSpace: 'nowrap', flexShrink: 0 }}>Free</span>
                </div>
              )
            )}
          </div>
          <_Perf />
          <_UtilCol cd={cd}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={(e) => { e.stopPropagation(); setSaved(s => !s); onSave && onSave(event); }} aria-label={saved ? 'Saved' : 'Save'} style={_stubBtn(saved)}>
                <_SIcon name={saved ? 'bookmark-fill' : 'bookmark'} size={13} color={saved ? '#FCA311' : '#fff'} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onShare && onShare(event); }} aria-label="Share" style={_stubBtn(false)}>
                <_SIcon name="share" size={13} color="#fff" />
              </button>
            </div>
          </_UtilCol>
        </div>
      </div>
    </div>
  );
};

// Expose under the runtime-global name the screens reference. The canonical,
// typed component lives at components/EventStub/EventStub.tsx (DS registry);
// this is its Babel-runtime twin for the in-page prototype.
window.EventStub = EventStubCard;
window.eventCountdown = eventCountdown;

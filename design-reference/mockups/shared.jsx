// Shared primitives for Sparked landing-page mockups.
// Phone frame ~280×600 (scaled to feel like a real device in the canvas).
// Each variation renders inside a Phone, no external scroll logic.

const Phone = ({ children, label }) => (
  <div style={{
    width: 340, height: 720, borderRadius: 44, padding: 8,
    background: '#0a0a0a', boxShadow: '0 16px 50px rgba(0,0,0,0.32), 0 2px 6px rgba(0,0,0,0.18)',
    position: 'relative',
  }}>
    <div style={{
      width: '100%', height: '100%', borderRadius: 36, overflow: 'hidden',
      background: '#14213D', position: 'relative', display: 'flex', flexDirection: 'column',
    }}>{children}</div>
    {/* notch */}
    <div style={{
      position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
      width: 96, height: 26, background: '#000', borderRadius: 9999, zIndex: 5,
    }}></div>
  </div>
);

const PStatus = ({ tint = 'light' }) => (
  <div style={{
    height: 36, padding: '12px 22px 0', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
    color: tint === 'dark' ? '#14213D' : '#fff', fontSize: 11, fontWeight: 700, fontFamily: 'Inter, sans-serif',
  }}>
    <span>9:41</span>
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
      <svg width="12" height="9" viewBox="0 0 16 11" fill={tint === 'dark' ? '#14213D' : 'white'}><rect x="0" y="7" width="3" height="4"/><rect x="4" y="5" width="3" height="6"/><rect x="8" y="2" width="3" height="9"/><rect x="12" y="0" width="3" height="11"/></svg>
      <svg width="18" height="9" viewBox="0 0 24 11" fill="none" stroke={tint === 'dark' ? '#14213D' : 'white'} strokeWidth="1"><rect x="1" y="1" width="20" height="9" rx="2"/></svg>
    </span>
  </div>
);

const SparkWord = ({ size = 18, gradient = true, color = '#fff' }) => (
  <span style={{
    fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: size,
    letterSpacing: '-0.01em', lineHeight: 1,
    ...(gradient ? {
      backgroundImage: 'linear-gradient(135deg,#ff5f4e 0%,#ff8c38 50%,#ffca3a 100%)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    } : { color }),
  }}>Sparked</span>
);

const SparkLogoMini = ({ size = 22 }) => {
  const w = Math.round(size * 0.74);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <svg width={w} height={size} viewBox="0 0 56 76" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="tfb" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#ff5f4e"/><stop offset="100%" stopColor="#ff8c38"/></linearGradient>
          <linearGradient id="tft" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#ff8c38"/><stop offset="100%" stopColor="#ffca3a"/></linearGradient>
        </defs>
        <path d="M28 68 C16 58 8 46 10 32 C12 20 20 12 28 10 C24 16 22 24 24 32 C26 40 32 44 32 52 C32 60 30 66 28 68Z" fill="url(#tfb)"/>
        <path d="M28 8 C38 16 46 26 44 38 C42 50 34 58 28 60 C32 54 34 46 32 38 C30 30 24 26 24 18 C24 12 26 9 28 8Z" fill="url(#tft)" opacity="0.9"/>
      </svg>
      <SparkWord size={Math.round(size * 0.62)} />
    </span>
  );
};

const PrimaryCTA = ({ children, onClick, full = true, size = 'md' }) => {
  const padding = size === 'lg' ? '14px 22px' : '12px 18px';
  const fs = size === 'lg' ? 14 : 13;
  return (
    <button onClick={onClick} style={{
      backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
      color: '#14213D', fontWeight: 900, fontSize: fs,
      padding, borderRadius: 14, border: 'none', cursor: 'pointer',
      boxShadow: '0 6px 22px rgba(255,95,78,0.24)',
      width: full ? '100%' : 'auto',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    }}>{children}</button>
  );
};

const OutlineCTA = ({ children, onClick, full = true }) => (
  <button onClick={onClick} style={{
    background: 'rgba(255,255,255,0.05)', color: '#fff',
    border: '1px solid rgba(255,255,255,0.20)', fontWeight: 800, fontSize: 13,
    padding: '11px 18px', borderRadius: 14, cursor: 'pointer',
    width: full ? '100%' : 'auto',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  }}>{children}</button>
);

const TextLink = ({ children, color = '#F7B731' }) => (
  <span style={{ color, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>{children}</span>
);

const Eye = ({ children, color = '#FCA311', size = 9 }) => (
  <span style={{ fontSize: size, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.20em', color }}>{children}</span>
);

const TinyPill = ({ children, active }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', padding: '4px 9px',
    borderRadius: 9999, fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 8.5,
    textTransform: 'uppercase', letterSpacing: '0.18em',
    color: active ? '#14213D' : 'rgba(238,240,255,0.65)',
    background: active ? 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' : 'rgba(255,255,255,0.05)',
    border: active ? 'none' : '1px solid rgba(255,255,255,0.10)',
    whiteSpace: 'nowrap',
  }}>{children}</span>
);

const LiveDot = ({ size = 8 }) => (
  <span style={{
    width: size, height: size, background: '#ff5f4e',
    borderRadius: 9999, display: 'inline-block',
    boxShadow: `0 0 0 ${size/2}px rgba(255,95,78,0.35), 0 0 12px rgba(255,95,78,0.6)`,
  }}></span>
);

// ===== iconography (Lucide-style stroke icons, hand-traced)
const I = ({ name, size = 14, color = 'currentColor', strokeWidth = 2 }) => {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'pin':     return <svg {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
    case 'cal':     return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
    case 'clock':   return <svg {...p}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;
    case 'search':  return <svg {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
    case 'plus':    return <svg {...p}><path d="M5 12h14M12 5v14"/></svg>;
    case 'arrow':   return <svg {...p}><path d="M5 12h14M13 5l7 7-7 7"/></svg>;
    case 'arrow-down': return <svg {...p}><path d="M12 5v14M5 13l7 7 7-7"/></svg>;
    case 'sparkles':return <svg {...p}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></svg>;
    case 'mic':     return <svg {...p}><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>;
    case 'palette': return <svg {...p}><path d="M12 22a10 10 0 1 1 0-20c5 0 9 3 9 7 0 3-3 4-5 4h-2a2 2 0 0 0 0 4 2 2 0 0 1-2 5z"/></svg>;
    case 'store':   return <svg {...p}><path d="M3 9 4 4h16l1 5M3 9v11h18V9M3 9h18M9 14h6"/></svg>;
    case 'tent':    return <svg {...p}><path d="M3 20 12 4l9 16M9 20v-4h6v4"/></svg>;
    case 'map':     return <svg {...p}><polygon points="3 6 9 4 15 6 21 4 21 18 15 20 9 18 3 20"/><line x1="9" y1="4" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="20"/></svg>;
    case 'compass': return <svg {...p}><circle cx="12" cy="12" r="10"/><polygon points="16 8 14 14 8 16 10 10"/></svg>;
    case 'flame':   return <svg {...p}><path d="M14 4c0 6-4 4-4 9a4 4 0 0 0 8 0c0-4-4-4-4-9z"/><path d="M9 11c-2 2-2 6 1 8"/></svg>;
    case 'megaphone': return <svg {...p}><path d="M3 11v2l16 6V5L3 11z"/><path d="M3 11h2v2H3z"/></svg>;
    case 'check':   return <svg {...p}><path d="M20 6 9 17l-5-5"/></svg>;
    case 'user':    return <svg {...p}><circle cx="12" cy="7" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/></svg>;
    case 'eye':     return <svg {...p}><path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'heart':   return <svg {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
    default: return null;
  }
};

// Sample event seed used across variations so the "feel" is consistent
const EVENTS = [
  { id: 1, name: 'Sunset Songwriters Round', loc: 'The Rebel Lounge', dist: '0.4 mi',
    time: 'Tonight · 7:30pm', tags: ['Music', 'Live'], live: true,
    grad: 'linear-gradient(135deg,#3a1a3e,#7a2a6a 55%,#ff8c38)' },
  { id: 2, name: 'Roosevelt Saturday Market', loc: 'Roosevelt Park', dist: '1.2 mi',
    time: 'Sat 8:00am', tags: ['Markets', 'Food'], live: false,
    grad: 'linear-gradient(135deg,#1d4d2c,#3a8e5c 55%,#a8d68b)' },
  { id: 3, name: 'First Friday Art Walk', loc: 'Roosevelt Row', dist: '0.8 mi',
    time: 'Fri 6:00pm', tags: ['Art', 'Community'], live: false,
    grad: 'linear-gradient(135deg,#5b3220,#a8551d 55%,#e09c3a)' },
  { id: 4, name: 'Phx Print Fair', loc: 'Warehouse 23', dist: '2.1 mi',
    time: 'Sun 11:00am', tags: ['Art', 'Markets'], live: false,
    grad: 'linear-gradient(135deg,#26384b,#5d7a98 55%,#ffca3a)' },
  { id: 5, name: 'Bike-In Movie: Goonies', loc: 'Civic Space Park', dist: '1.5 mi',
    time: 'Sat 8:30pm', tags: ['Family', 'Outdoor'], live: false,
    grad: 'linear-gradient(135deg,#1a2b4a,#3a5a8c 55%,#ff8c38)' },
];

Object.assign(window, {
  Phone, PStatus, SparkWord, SparkLogoMini,
  PrimaryCTA, OutlineCTA, TextLink, Eye, TinyPill, LiveDot, I, EVENTS,
});

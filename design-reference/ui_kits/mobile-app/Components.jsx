// Reusable Sparked components — small, mainly cosmetic.
// Compiled inline by Babel; expects React in scope.

// Theme context — 'dark' (default) | 'light'. Set once at the app root
// (PhoneFrame) via CSS custom properties; a few elements that can't be
// expressed as a plain var() swap (e.g. the gradient-text wordmark) read
// this context directly.
const ThemeContext = React.createContext('dark');

// App-chrome theme tokens — page bg, surfaces, text. Mirrors colors_and_type.css
// (:root / .theme-light) so the in-app screens and the marketing site agree.
const APP_THEME_VARS = {
  dark: {
    '--app-bg': '#14213D',
    '--app-card-bg': 'rgba(255,255,255,0.03)',
    '--app-card-border': 'rgba(255,255,255,0.10)',
    '--app-border-soft': 'rgba(255,255,255,0.08)',
    '--app-divider': 'rgba(255,255,255,0.06)',
    '--app-surface-hover': 'rgba(255,255,255,0.12)',
    '--app-icon-chip-bg': 'rgba(255,255,255,0.04)',
    '--app-text': '#ffffff',
    '--app-text-muted': 'rgba(238,240,255,0.55)',
    '--app-text-faint': 'rgba(238,240,255,0.35)',
    '--app-text-hint': 'rgba(238,240,255,0.25)',
    '--app-tabbar-bg': 'rgba(15,26,48,0.85)',
    '--app-border-strong': 'rgba(255,255,255,0.20)',
    '--app-green': '#4ade80',
  },
  light: {
    '--app-bg': '#f4f5f8',
    '--app-card-bg': '#ffffff',
    '--app-card-border': 'rgba(28,40,64,0.08)',
    '--app-border-soft': 'rgba(28,40,64,0.08)',
    '--app-divider': 'rgba(28,40,64,0.10)',
    '--app-surface-hover': 'rgba(28,40,64,0.08)',
    '--app-icon-chip-bg': '#eceef3',
    '--app-text': '#1c2840',
    '--app-text-muted': '#7a849e',
    '--app-text-faint': '#9aa3ba',
    '--app-text-hint': '#b0b8cc',
    '--app-tabbar-bg': 'rgba(255,255,255,0.85)',
    '--app-border-strong': 'rgba(28,40,64,0.13)',
    '--app-green': '#16a34a',
  },
};

const SparkLogo = ({ size = 38 }) => {
  const theme = React.useContext(ThemeContext);
  const isLight = theme === 'light';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <img src="assets/sparked-icon.svg" width={size * 0.74} height={size} alt="" />
      <span style={{
        fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: size * 0.74,
        letterSpacing: '-0.01em', lineHeight: 1,
        ...(isLight
          ? { color: '#14213D' }
          : {
              backgroundImage: 'linear-gradient(135deg,#ff5f4e 0%,#ff8c38 50%,#ffca3a 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }),
      }}>Sparked</span>
    </span>
  );
};

const SparkButton = ({ children, onClick, size = 'md', kind = 'primary', icon }) => {
  const sizes = {
    sm: { padding: '10px 18px', fontSize: 13, radius: 12 },
    md: { padding: '14px 24px', fontSize: 14, radius: 16 },
    lg: { padding: '18px 32px', fontSize: 16, radius: 20 },
  };
  const s = sizes[size];
  if (kind === 'primary') {
    return <button onClick={onClick} style={{
      backgroundImage: 'linear-gradient(135deg,#ff5f4e 0%,#ff8c38 50%,#ffca3a 100%)',
      color: '#14213D', fontWeight: 900, fontSize: s.fontSize,
      padding: s.padding, borderRadius: s.radius, border: 'none', cursor: 'pointer',
      boxShadow: '0 6px 22px rgba(255,95,78,0.24)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    }}>{children}{icon}</button>;
  }
  return <button onClick={onClick} style={{
    background: 'var(--app-card-bg)', color: 'var(--app-text)',
    border: '2px solid var(--app-border-strong)', fontWeight: 900, fontSize: s.fontSize,
    padding: s.padding, borderRadius: s.radius, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  }}>{children}{icon}</button>;
};

const Eyebrow = ({ children, color = '#FCA311' }) => (
  <span style={{
    fontSize: 10, fontWeight: 900, textTransform: 'uppercase',
    letterSpacing: '0.20em', color
  }}>{children}</span>
);

const InterestPill = ({ children, active, onClick }) => (
  <button onClick={onClick} style={{
    display: 'inline-flex', alignItems: 'center', padding: '8px 16px',
    borderRadius: 9999, fontFamily: 'Inter', fontWeight: 900, fontSize: 11,
    textTransform: 'uppercase', letterSpacing: '0.20em', border: '1px solid var(--app-card-border)',
    color: active ? '#14213D' : 'var(--app-text-muted)',
    background: active ? 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' : 'transparent',
    transform: active ? 'scale(1.05)' : 'scale(1)',
    transition: 'all .2s ease', cursor: 'pointer', whiteSpace: 'nowrap',
    boxShadow: active ? '0 6px 18px rgba(255,99,72,0.25)' : 'none',
  }}>{children}</button>
);

// Pulsating red dot that "breathes" — replaces the old LIVE pill.
// Keyframes live in index.html (sparked-breathe).
const LiveDot = ({ size = 9 }) => (
  <span
    className="sparked-live-dot"
    aria-label="Live"
    style={{ width: size, height: size }}
  ></span>
);
// Back-compat alias so any older call sites still render something.
const LiveBadge = LiveDot;

const Tag = ({ children }) => (
  <span style={{
    display: 'inline-flex', padding: '3px 10px', borderRadius: 9999,
    fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em',
    backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)', color: '#14213D',
  }}>{children}</span>
);

// Small ghost icon button used in card headers (bookmark, share, etc.)
const CardIconButton = ({ icon, active, accent = '#FCA311', label, onClick }) => (
  <button
    aria-label={label}
    onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
    style={{
      background: active ? 'rgba(252,163,17,0.12)' : 'var(--app-card-bg)',
      border: `1px solid ${active ? 'rgba(252,163,17,0.35)' : 'var(--app-card-border)'}`,
      width: 34, height: 34, borderRadius: 11, cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      color: active ? accent : 'var(--app-text-muted)',
      flexShrink: 0,
    }}
  >
    <Icon name={icon} size={15} color="currentColor" />
  </button>
);

const EventCard = ({ event, onTap, onSave, onShare }) => (
  <div onClick={onTap} style={{
    background: 'var(--app-card-bg)',
    border: '1px solid var(--app-card-border)',
    borderRadius: 28, overflow: 'hidden', cursor: 'pointer',
    boxShadow: '0 4px 24px rgba(0,0,0,0.20)',
  }}>
    <div style={{
      height: 184, position: 'relative',
      background: event.gradient || 'linear-gradient(135deg,#5b3220,#a8551d 60%,#e09c3a)',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(20,33,61,0.85), transparent)' }}></div>
      {event.live && (
        <div style={{
          position: 'absolute', top: 16, right: 18, zIndex: 2,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 22, height: 22, borderRadius: 9999,
          background: 'rgba(20,33,61,0.55)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.10)',
        }}>
          <LiveDot />
        </div>
      )}
    </div>
    <div style={{ padding: 24 }}>
      {/* Title row with bookmark + share actions on the right.
          Bookmark fills + colors when event.saved is true. */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <h3 style={{
          fontFamily: 'Montserrat', fontSize: 22, fontWeight: 900,
          letterSpacing: '-0.01em', margin: 0, lineHeight: 1.1, color: 'var(--app-text)', flex: 1, minWidth: 0,
        }}>{event.title}</h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <CardIconButton
            icon={event.saved ? 'bookmark-fill' : 'bookmark'}
            active={event.saved}
            label={event.saved ? 'Saved' : 'Save'}
            onClick={onSave}
          />
          <CardIconButton icon="share" label="Share" onClick={onShare} />
        </div>
      </div>
      <MetaRow icon="cal" iconColor="#ff6348">{event.date}</MetaRow>
      <MetaRow icon="clock" iconColor="#ff6348">{event.time}</MetaRow>
      <MetaRow icon="pin" iconColor="#FCA311">{event.location}</MetaRow>
      <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
        {event.tags.map(t => <Tag key={t}>{t}</Tag>)}
      </div>
    </div>
  </div>
);

const Icon = ({ name, size = 14, color = 'currentColor' }) => {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'cal': return <svg {...props}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
    case 'clock': return <svg {...props}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;
    case 'pin': return <svg {...props}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
    case 'search': return <svg {...props}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
    case 'plus': return <svg {...props}><path d="M5 12h14M12 5v14"/></svg>;
    case 'user': return <svg {...props}><circle cx="12" cy="7" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/></svg>;
    case 'home': return <svg {...props}><path d="M3 9.5 12 3l9 6.5V21H3V9.5Z"/><path d="M9 21V12h6v9"/></svg>;
    case 'list': return <svg {...props}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>;
    case 'map': return <svg {...props}><polygon points="3 6 9 4 15 6 21 4 21 18 15 20 9 18 3 20"/><line x1="9" y1="4" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="20"/></svg>;
    case 'check': return <svg {...props}><path d="M20 6 9 17l-5-5"/></svg>;
    case 'arrow': return <svg {...props}><path d="M5 12h14M13 5l7 7-7 7"/></svg>;
    case 'sparkles': return <svg {...props}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></svg>;
    case 'mic': return <svg {...props}><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>;
    case 'palette': return <svg {...props}><path d="M12 22a10 10 0 1 1 0-20c5 0 9 3 9 7 0 3-3 4-5 4h-2a2 2 0 0 0 0 4 2 2 0 0 1-2 5z"/></svg>;
    case 'store': return <svg {...props}><path d="M3 9 4 4h16l1 5M3 9v11h18V9M3 9h18M9 14h6"/></svg>;
    case 'tent': return <svg {...props}><path d="M3 20 12 4l9 16M9 20v-4h6v4"/></svg>;
    case 'bookmark': return <svg {...props}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>;
    case 'bookmark-fill': return <svg {...props} fill={color}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>;
    case 'share': return <svg {...props}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;
    case 'lock': return <svg {...props}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
    case 'chev-right': return <svg {...props}><path d="M9 18l6-6-6-6"/></svg>;
    case 'gear': return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
    case 'chev-left': return <svg {...props}><path d="M15 18l-6-6 6-6"/></svg>;
    case 'x': return <svg {...props}><path d="M18 6 6 18M6 6l12 12"/></svg>;
    case 'mail': return <svg {...props}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>;
    case 'bell': return <svg {...props}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
    case 'image': return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>;
    case 'edit': return <svg {...props}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>;
    case 'ticket': return <svg {...props}><path d="M3 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"/><path d="M13 5v14"/></svg>;
    case 'logout': return <svg {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>;
    case 'globe': return <svg {...props}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20"/></svg>;
    case 'shield': return <svg {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
    case 'heart': return <svg {...props}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/></svg>;
    case 'star': return <svg {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
    case 'text': return <svg {...props}><path d="M4 7V5h16v2M9 19h6M12 5v14"/></svg>;
    case 'food': return <svg {...props}><path d="M4 3v7a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3M6 3v18M18 3c-1.7 1.2-2.5 3.3-2.5 6 0 2 1 3 2.5 3v9"/></svg>;
    case 'users': return <svg {...props}><circle cx="9" cy="7" r="3"/><path d="M3 21v-1a6 6 0 0 1 12 0v1"/><path d="M16 3.6a3 3 0 0 1 0 6.8M21 21v-1a6 6 0 0 0-4-5.7"/></svg>;
    case 'minus': return <svg {...props}><path d="M5 12h14"/></svg>;
    case 'monitor': return <svg {...props}><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>;
    case 'creditcard': return <svg {...props}><rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20M6 15h4"/></svg>;
    case 'ban': return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/></svg>;
    case 'bolt': return <svg {...props} fill={color} stroke="none"><path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12z"/></svg>;
    case 'thumbs-up': return <svg {...props}><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88z"/></svg>;
    case 'fire': return <svg {...props}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>;
    case 'leaf': return <svg {...props}><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/></svg>;
    case 'moon': return <svg {...props}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>;
    case 'dumbbell': return <svg {...props}><path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/></svg>;
    case 'download': return <svg {...props}><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>;
    case 'trash': return <svg {...props}><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>;
    case 'sliders': return <svg {...props}><line x1="21" y1="4" x2="14" y2="4"/><line x1="10" y1="4" x2="3" y2="4"/><line x1="21" y1="12" x2="12" y2="12"/><line x1="8" y1="12" x2="3" y2="12"/><line x1="21" y1="20" x2="16" y2="20"/><line x1="12" y1="20" x2="3" y2="20"/><line x1="14" y1="2" x2="14" y2="6"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="16" y1="18" x2="16" y2="22"/></svg>;
    default: return null;
  }
};

const MetaRow = ({ icon, iconColor, children }) => (
  <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--app-text-muted)', marginBottom: 6 }}>
    <Icon name={icon} color={iconColor} />
    <span>{children}</span>
  </div>
);

const PhoneFrame = ({ children, label, theme = 'dark' }) => (
  <ThemeContext.Provider value={theme}>
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
    <div style={{
      width: 390, height: 844, borderRadius: 56, padding: 8,
      background: '#000', boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
      position: 'relative',
    }}>
      <div style={{
        ...APP_THEME_VARS[theme],
        width: '100%', height: '100%', borderRadius: 48, overflow: 'hidden',
        background: 'var(--app-bg)', color: 'var(--app-text)', position: 'relative',
      }}>{children}</div>
      <div style={{
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
        width: 122, height: 32, background: '#000', borderRadius: 9999, zIndex: 5,
      }}></div>
    </div>
    {label && <div style={{
      fontSize: 10, fontWeight: 900, color: 'var(--app-text-muted, rgba(238,240,255,0.50))',
      textTransform: 'uppercase', letterSpacing: '0.25em',
    }}>{label}</div>}
  </div>
  </ThemeContext.Provider>
);

const StatusBar = () => (
  <div style={{
    height: 50, padding: '14px 28px 0', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center',
    color: 'var(--app-text, #fff)', fontSize: 14, fontWeight: 700, fontFamily: 'Inter',
  }}>
    <span>9:41</span>
    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
      <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><rect x="0" y="7" width="3" height="4"/><rect x="4" y="5" width="3" height="6"/><rect x="8" y="2" width="3" height="9"/><rect x="12" y="0" width="3" height="11"/></svg>
      <svg width="24" height="11" viewBox="0 0 24 11" fill="none" stroke="currentColor" strokeWidth="1"><rect x="1" y="1" width="20" height="9" rx="2"/><rect x="2" y="2" width="14" height="7" rx="1" fill="currentColor"/></svg>
    </span>
  </div>
);

// Two-tab bar — Explore | Me. No gradient FAB; the "Create Event" CTA
// lives inside Me → Workspace per the locked-in design decision.
const TabBar = ({ active, onChange }) => {
  const tabs = [
    { id: 'home', label: 'Explore', icon: 'home' },
    { id: 'profile', label: 'Me', icon: 'user' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: 'var(--app-tabbar-bg)', backdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--app-divider)',
      padding: '14px 48px 32px', display: 'flex', justifyContent: 'space-between',
    }}>
      {tabs.map(t => {
        const isActive = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            color: isActive ? '#FCA311' : 'var(--app-text-faint)',
          }}>
            <Icon name={t.icon} size={24} />
            <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
};

Object.assign(window, {
  SparkLogo, SparkButton, Eyebrow, InterestPill, LiveBadge, LiveDot, Tag,
  EventCard, CardIconButton, Icon, MetaRow, PhoneFrame, StatusBar, TabBar,
  ThemeContext, APP_THEME_VARS,
});

// Sparked screens - Landing, Explore feed, Event detail, Me (Saved / Workspace / Backstage).

// Real start timestamps so EventStub's countdown is accurate + live. Computed
// relative to "now" at load: today-relative for live events, day-offset for the rest.
function _todayPlusHoursISO(hrs) { return new Date(Date.now() + hrs * 3600000).toISOString(); }
function _futureISO(daysFromNow, h, m) { const d = new Date(); d.setDate(d.getDate() + daysFromNow); d.setHours(h, m || 0, 0, 0); return d.toISOString(); }

const SAMPLE_EVENTS = [
  { id: 1, title: 'Art Walk Downtown', date: 'Today, May 8', time: '6:00 – 9:00pm',
    location: 'Downtown Arts District', tags: ['Art', 'Music', 'Community'], live: true, saved: true,
    gradient: 'linear-gradient(135deg,#5b3220,#a8551d 60%,#e09c3a)',
    photos: ['linear-gradient(135deg,#5b3220,#a8551d 60%,#e09c3a)', 'linear-gradient(160deg,#3a1f12,#8a4a22 55%,#ffb24d)', 'linear-gradient(120deg,#46271a,#b5642a 60%,#ffd56b)'],
    address: '215 E Roosevelt St, Phoenix, AZ 85004',
    desc: 'A curated stroll past 14 galleries, three live murals in progress, and four open-air sets from local artists. Ends with a community fire pit at the courtyard.',
    organizer: 'Downtown Arts Coalition', tier: 'Plus', rsvps: 84, startISO: _todayPlusHoursISO(4), price: 0, mi: 1.2, going: true },
  { id: 2, title: 'Saturday Farmers Market', date: 'Sat, May 10', time: '8:00am – 1:00pm',
    location: 'Roosevelt Park', tags: ['Markets', 'Food'], live: false, saved: false,
    gradient: 'linear-gradient(135deg,#1d4d2c,#3a8e5c 60%,#a8d68b)',
    address: '9802 N 7th St, Phoenix, AZ 85020',
    desc: '40+ vendors, 12 farms, live folk music, breakfast tacos, and a kids corner.',
    organizer: 'Roosevelt Park Association', tier: 'Standard', rsvps: 42, startISO: _futureISO(2, 8), price: 5, mi: 3.8 },
  { id: 3, title: 'Sunset Songwriters Round', date: 'Fri, May 9', time: '7:30 – 10:00pm',
    location: 'The Rebel Lounge', tags: ['Music', 'Live'], live: false, saved: true,
    gradient: 'linear-gradient(135deg,#3a1a3e,#7a2a6a 60%,#ff8c38)',
    address: '1019 E Indian School Rd, Phoenix, AZ 85014',
    desc: 'Four local writers, one mic, no opening act. $12 cover at the door.',
    organizer: 'Rebel Lounge', tier: 'Standard', rsvps: 20, startISO: _futureISO(1, 19, 30), price: 12, mi: 6.5 },
  { id: 4, title: 'Pop-Up Print Fair', date: 'Sun, May 11', time: '11:00am – 5:00pm',
    location: 'Phestival Warehouse', tags: ['Art', 'Markets', 'Pop-Ups'], live: false, saved: false,
    gradient: 'linear-gradient(135deg,#26384b,#5d7a98 60%,#ffca3a)',
    desc: '22 printmakers, screenprinting demos every hour, and a free poster for the first 100.',
    organizer: 'Print Society AZ', tier: 'Plus', rsvps: 31, startISO: _futureISO(3, 11), price: 0, mi: 12 },
  // --- Farther-out events (beyond the 25mi default) — these surface ONLY in the
  // search-results "Just past your radius" overflow; they never appear in the
  // strict browse feed or in the finder's in-radius counts. ---
  { id: 5, title: 'Gilbert Night Market', date: 'Fri, May 16', time: '5:00 – 10:00pm',
    location: 'Gilbert Heritage District', tags: ['Markets', 'Food'], live: false, saved: false,
    gradient: 'linear-gradient(135deg,#2a3a24,#5a7a3a 60%,#cfe08b)',
    address: '45 W Page Ave, Gilbert, AZ 85233',
    desc: 'Open-air night market: 60 makers, food trucks, and a beer garden.',
    organizer: 'Gilbert Maker Collective', tier: 'Standard', rsvps: 58, startISO: _futureISO(1, 17), price: 0, mi: 28 },
  { id: 6, title: 'Cave Creek Pop-Up Market', date: 'Sun, May 18', time: '10:00am – 4:00pm',
    location: 'Cave Creek Town Center', tags: ['Markets', 'Pop-Ups', 'Art'], live: false, saved: false,
    gradient: 'linear-gradient(135deg,#4a2f1a,#9c5a28 60%,#ffca3a)',
    address: '6140 E Cave Creek Rd, Cave Creek, AZ 85331',
    desc: 'A roaming maker market: ceramics, leather, and desert botanicals.',
    organizer: 'Desert Makers Guild', tier: 'Plus', rsvps: 24, startISO: _futureISO(5, 10), price: 0, mi: 32 },
  { id: 7, title: 'Desert Amphitheater Night', date: 'Sat, May 17', time: '7:00 – 11:00pm',
    location: 'Far East Mesa', tags: ['Music', 'Outdoors'], live: false, saved: false,
    gradient: 'linear-gradient(135deg,#2a1a3e,#6a2a7a 60%,#ff8c38)',
    address: '2700 N Ellsworth Rd, Mesa, AZ 85207',
    desc: 'Three touring acts under the stars, gates at 6. Lawn seating.',
    organizer: 'Mesa Live', tier: 'Plus', rsvps: 140, startISO: _futureISO(4, 19), price: 18, mi: 34 },
  // --- Test fixtures for radius overflow (distances from zip 85001) ---
  // In-radius (≤25mi): exercise the strict browse feed.
  { id: 8, title: 'Riverside Food Trucks', date: 'Thu, May 15', time: '5:00 – 9:00pm',
    location: 'Rio Salado Riverfront', tags: ['Food'], live: false, saved: false,
    gradient: 'linear-gradient(135deg,#3a2a14,#9c7a28 60%,#ffd56b)',
    address: '80 W Rio Salado Pkwy, Tempe, AZ 85281',
    desc: 'A dozen food trucks along the water, plus live acoustic sets.',
    organizer: 'Valley Eats', tier: 'Standard', rsvps: 72, startISO: _futureISO(2, 17), price: 0, mi: 4 },
  { id: 9, title: 'Indie Film Night', date: 'Wed, May 14', time: '7:30 – 10:00pm',
    location: 'Roosevelt Row Cinema', tags: ['Art'], live: false, saved: false,
    gradient: 'linear-gradient(135deg,#241a3a,#5a3a7a 60%,#c89bff)',
    address: '1212 N 2nd St, Phoenix, AZ 85004',
    desc: 'Four short films from local directors, Q&A after the screening.',
    organizer: 'Phoenix Film Co-op', tier: 'Plus', rsvps: 44, startISO: _futureISO(1, 19, 30), price: 8, mi: 18 },
  // Just past radius (25–37.5mi): surface in the overflow section.
  { id: 10, title: 'Desert Sky Music Fest', date: 'Sat, May 17', time: '4:00 – 11:00pm',
    location: 'North Scottsdale Fields', tags: ['Music'], live: false, saved: false,
    gradient: 'linear-gradient(135deg,#2a1a3e,#7a2a6a 60%,#ff8c38)',
    address: '17900 N Hayden Rd, Scottsdale, AZ 85255',
    desc: 'Two stages, eight acts, food and craft vendors all afternoon.',
    organizer: 'Desert Sky Presents', tier: 'Plus', rsvps: 210, startISO: _futureISO(4, 16), price: 25, mi: 31 },
  { id: 11, title: 'Highlands Art Fair', date: 'Sun, May 18', time: '9:00am – 3:00pm',
    location: 'Anthem Community Park', tags: ['Art'], live: false, saved: false,
    gradient: 'linear-gradient(135deg,#3a1f12,#8a4a22 55%,#ffb24d)',
    address: '41703 N Gavilan Peak Pkwy, Anthem, AZ 85086',
    desc: 'Juried fine-art fair: painters, printmakers, and sculptors.',
    organizer: 'Highlands Arts Council', tier: 'Standard', rsvps: 63, startISO: _futureISO(5, 9), price: 0, mi: 34 },
  { id: 12, title: 'Mountain Town Market', date: 'Sat, May 17', time: '8:00am – 1:00pm',
    location: 'Cave Creek Foothills', tags: ['Markets'], live: false, saved: false,
    gradient: 'linear-gradient(135deg,#2a3a24,#5a7a3a 60%,#cfe08b)',
    address: '6710 E Cave Creek Rd, Cave Creek, AZ 85331',
    desc: 'Foothills farmers market: produce, honey, and handmade goods.',
    organizer: 'Mountain Town Collective', tier: 'Standard', rsvps: 38, startISO: _futureISO(4, 8), price: 0, mi: 36 },
  // Beyond expansion (>37.5mi): must never appear, even in overflow.
  { id: 13, title: 'Far Valley Rodeo', date: 'Sat, May 17', time: '6:00 – 10:00pm',
    location: 'Wickenburg Arena', tags: ['Outdoors'], live: false, saved: false,
    gradient: 'linear-gradient(135deg,#3a2414,#8a5a28 60%,#e0a85a)',
    address: '935 Constellation Rd, Wickenburg, AZ 85390',
    desc: 'Bull riding, barrel racing, and a chuckwagon dinner.',
    organizer: 'Wickenburg Rodeo Assn', tier: 'Standard', rsvps: 95, startISO: _futureISO(4, 18), price: 15, mi: 52 },
];

// Workspace listings include a past, locked event so the lock state is visible.
const ORGANIZER_LISTINGS = [
  { ...SAMPLE_EVENTS[0], past: false },
  { ...SAMPLE_EVENTS[1], past: false },
  { id: 99, title: 'First Friday · April', date: 'Fri, Apr 4', tier: 'Plus', past: true, rsvps: 312,
    gradient: 'linear-gradient(135deg,#1a2b4a,#3a5a8c 55%,#ff8c38)' },
];

const INTERESTS = ['Curbside', 'Markets', 'Music', 'Art', 'Food', 'Community', 'Pop-Ups', 'Outdoors', 'Family'];

// Workspaces the signed-in host belongs to. One seeded by default — so the
// multi-workspace picker stays dormant and Workspace opens straight in. Stats
// mirror the Workspace surface (live · RSVPs · reach). A non-host has zero.
const WORKSPACES = [
  { id: 'ws_aurora', name: 'Aurora Collective', initials: 'AC',
    gradient: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
    live: 2, rsvps: 146, reach: '2.1k',
    // Public-profile fields — consumer-facing only, nothing tier/economics related.
    bio: 'Independent arts programming for downtown Phoenix — markets, walks, and late-night sets.',
    location: 'Phoenix, AZ',
    website: 'auroracollective.co',
    socials: { instagram: '@auroracollective', twitter: '@auroracollective', facebook: 'Aurora Collective' },
    eventIds: [1, 2],
    pastEvents: [
      { id: 'ws_past_1', title: 'First Friday · April', time: '6:00 – 10:00pm', location: 'Downtown Arts District',
        tags: ['Art', 'Music'], gradient: 'linear-gradient(135deg,#1a2b4a,#3a5a8c 55%,#ff8c38)',
        rsvps: 312, price: 0, startISO: _futureISO(-40, 18) },
      { id: 'ws_past_2', title: 'Winter Night Market', time: '5:00 – 9:00pm', location: 'Roosevelt Park',
        tags: ['Markets', 'Community'], gradient: 'linear-gradient(135deg,#2b1a3a,#6a3a8c 55%,#ffca3a)',
        rsvps: 198, price: 0, startISO: _futureISO(-96, 17) },
    ] },
];
const _wsStatLine = (ws) => `${ws.live} live · ${ws.rsvps} RSVPs · ${ws.reach} reach`;

// Local YYYY-MM-DD (matches the codebase's getLocalYYYYMMDD utility)
const todayLocalYMD = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Brand-styled <input type="date"> pill. Native picker on tap — the right
// pattern for mobile. Mirrors the desktop ExploreDateAndViewControls layout:
// two date inputs separated by an arrow, both default to today.
const DateInputPill = ({ value, onChange, ariaLabel }) => (
  <label style={{
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: 'var(--app-card-bg)', border: '1px solid var(--app-card-border)',
    borderRadius: 12, padding: '8px 10px', cursor: 'pointer',
    flex: 1, minWidth: 0,
  }}>
    <Icon name="cal" size={13} color="#F7B731" />
    <input
      type="date"
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: 'transparent', border: 'none', outline: 'none', padding: 0,
        color: 'var(--app-text)', fontFamily: 'Inter', fontSize: 12, fontWeight: 700,
        colorScheme: 'dark', width: '100%', minWidth: 0,
        appearance: 'none', WebkitAppearance: 'none',
      }}
    />
  </label>
);

// Date-range bar — twin date inputs with arrow between, plus ZIP attribution.
// Recreates the desktop's date-and-view controls pattern in mobile form.
const DateRangeBar = ({ start, end, onStartChange, onEndChange, zip = '85001', onZipChange, radius = 25, onRadiusChange }) => {
  const [editing, setEditing] = React.useState(null); // 'zip' | 'radius' | null
  const [tempZip, setTempZip] = React.useState(zip);
  const [tempRadius, setTempRadius] = React.useState(String(radius));
  const beginZip = () => { setTempZip(zip); setEditing('zip'); };
  const beginRadius = () => { setTempRadius(String(radius)); setEditing('radius'); };
  const commitZip = () => {
    const v = (tempZip || '').replace(/[^0-9]/g, '').slice(0, 5);
    if (v.length === 5 && onZipChange) onZipChange(v);
    setEditing(null);
  };
  const commitRadius = () => {
    let n = parseInt(tempRadius, 10);
    if (isNaN(n)) n = radius;
    n = Math.max(1, Math.min(100, n));
    onRadiusChange && onRadiusChange(n);
    setEditing(null);
  };
  const editInput = {
    background: 'rgba(247,183,49,0.14)', border: '1px solid rgba(247,183,49,0.45)',
    borderRadius: 6, padding: '1px 5px', color: '#F7B731',
    fontSize: 10, fontWeight: 900, letterSpacing: '0.10em', fontFamily: 'inherit',
    outline: 'none', appearance: 'textfield', MozAppearance: 'textfield',
  };
  const editLink = {
    all: 'unset', cursor: 'pointer', color: '#F7B731',
    letterSpacing: '0.10em', borderBottom: '1.5px dotted rgba(247,183,49,0.55)', lineHeight: 1.15,
  };
  return (
  <div>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: 6,
      borderRadius: 16, background: 'var(--app-card-bg)',
      border: '1px solid var(--app-card-border)',
    }}>
      <DateInputPill value={start} onChange={onStartChange} ariaLabel="Start date" />
      <Icon name="arrow" size={14} color="var(--app-text-faint)" />
      <DateInputPill value={end} onChange={onEndChange} ariaLabel="End date" />
    </div>
    <div style={{
      marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '0 6px',
      fontSize: 10, fontWeight: 900, letterSpacing: '0.22em',
      textTransform: 'uppercase', color: 'var(--app-text-faint)',
    }}>
      <Icon name="pin" size={10} color="#F7B731" />
      <span>Showing events near</span>
      {editing === 'zip' ? (
        <input
          autoFocus type="text" inputMode="numeric" maxLength={5} value={tempZip}
          onChange={(e) => setTempZip(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
          onBlur={commitZip}
          onKeyDown={(e) => { if (e.key === 'Enter') commitZip(); }}
          style={{ ...editInput, width: 50 }}
        />
      ) : (
        <button onClick={beginZip} style={editLink}>{zip}</button>
      )}
      <span style={{ color: 'rgba(247,183,49,0.55)' }}>•</span>
      {editing === 'radius' ? (
        <input
          autoFocus type="text" inputMode="numeric" maxLength={3} value={tempRadius}
          onChange={(e) => setTempRadius(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
          onBlur={commitRadius}
          onKeyDown={(e) => { if (e.key === 'Enter') commitRadius(); }}
          style={{ ...editInput, width: 36 }}
        />
      ) : (
        <button onClick={beginRadius} style={editLink}>{radius}MI</button>
      )}
    </div>
  </div>
  );
};

// YYYY-MM-DD for the coming Sunday (never same-day; Sundays get +7).
const getNextSunday = () => {
  const d = new Date();
  const offset = 7 - d.getDay() || 7;
  const sun = new Date(d.getTime() + offset * 86400000);
  return `${sun.getFullYear()}-${String(sun.getMonth()+1).padStart(2,'0')}-${String(sun.getDate()).padStart(2,'0')}`;
};

// Interest id → Icon name (mirrors ONB_INTERESTS from Onboarding.jsx).
const INTEREST_ICON_MAP = {
  Curbside: 'pin',
  Markets: 'store', Music: 'mic', Art: 'palette', Food: 'sparkles',
  Community: 'heart', 'Pop-Ups': 'sparkles', Outdoors: 'tent', Family: 'heart',
};

const LandingScreen = ({ onSignup, onBrowse, onBrowseToday, onBrowseWithInterest, onLogin, onPricing, onEventTap }) => {
  // Shuffle interests randomly on every mount so the pill order varies each visit.
  const shuffled = React.useMemo(() => [...INTERESTS].sort(() => Math.random() - 0.5), []);
  const preview = SAMPLE_EVENTS[0];
  // Editable location (mirrors the Feed Ready screen). Defaults Phoenix / 25MI.
  const [town, setTown] = React.useState('Phoenix');
  const [radius, setRadius] = React.useState(25);
  const [editing, setEditing] = React.useState(null); // 'town' | 'radius' | null
  const [tempTown, setTempTown] = React.useState('Phoenix');
  const [tempRadius, setTempRadius] = React.useState('25');
  const beginEditTown = () => { setTempTown(town); setEditing('town'); };
  const beginEditRadius = () => { setTempRadius(String(radius)); setEditing('radius'); };
  const commitTown = () => { const v = (tempTown || '').trim(); if (v) setTown(v); setEditing(null); };
  const commitRadius = () => {
    let n = parseInt(tempRadius, 10);
    if (isNaN(n)) n = radius;
    n = Math.max(1, Math.min(100, n));
    setRadius(n); setEditing(null);
  };
  return (
    <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
      {/* Ambient glow */}
      <div style={{ position: 'absolute', top: -50, left: -70, width: 270, height: 270, borderRadius: '50%', background: 'rgba(255,99,72,0.22)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 80, right: -70, width: 220, height: 220, borderRadius: '50%', background: 'rgba(247,183,49,0.13)', filter: 'blur(75px)', pointerEvents: 'none' }} />

      <StatusBar />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 20px 10px', position: 'relative' }}>
        <SparkLogo size={24} />
        <button onClick={onLogin} style={{ background: 'none', border: '1px solid var(--app-border-strong)', borderRadius: 9999, padding: '7px 16px', color: 'var(--app-text-muted)', fontSize: 12, fontWeight: 800, cursor: 'pointer', letterSpacing: '0.02em' }}>Log In</button>
      </div>

      {/* Location — editable, mirrors the Feed Ready screen styling */}
      <div style={{ padding: '0 20px 12px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, color: 'var(--app-text-muted)', fontWeight: 600 }}>
          <Icon name="pin" size={14} color="#FCA311" />
          <span>Near</span>
          <EditableField
            editing={editing === 'town'} value={editing === 'town' ? tempTown : town}
            onStart={beginEditTown} onChange={setTempTown} onCommit={commitTown} width={94}
          />
          <span style={{ color: 'rgba(252,163,17,0.7)', fontWeight: 800 }}>•</span>
          <EditableField
            editing={editing === 'radius'} value={editing === 'radius' ? tempRadius : radius}
            onStart={beginEditRadius} onChange={setTempRadius} onCommit={commitRadius}
            width={44} suffix="MI" numeric
          />
        </div>
      </div>

      {/* Interest pills — 1 scrollable row, random order each visit */}
      <div style={{ overflowX: 'auto', scrollbarWidth: 'none', padding: '0 0 16px' }}>
        <div style={{ display: 'flex', gap: 8, padding: '0 20px', width: 'max-content' }}>
          {shuffled.map(id => (
            <button key={id} onClick={() => onBrowseWithInterest && onBrowseWithInterest(id)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'var(--app-icon-chip-bg)', border: '1px solid var(--app-card-border)',
              borderRadius: 9999, padding: '7px 14px', cursor: 'pointer', whiteSpace: 'nowrap',
              color: 'var(--app-text-muted)', fontSize: 12, fontWeight: 800,
              transition: 'background .15s ease, border-color .15s ease',
            }}>
              <Icon name={INTEREST_ICON_MAP[id] || 'sparkles'} size={12} color="#FCA311" />
              {id}
            </button>
          ))}
        </div>
      </div>

      {/* Hero headline */}
      <div style={{ padding: '0 24px', position: 'relative' }}>
        <h1 style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 50, letterSpacing: '-0.02em', lineHeight: 0.92, margin: '0 0 18px' }}>
          <span style={{ display: 'block', color: 'var(--app-text)' }}>YOUR CITY.</span>
          <span style={{ display: 'block', backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>YOUR</span>
          <span style={{ display: 'block', backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>EVENTS.</span>
          <span style={{ display: 'block', color: 'var(--app-text-hint)' }}>NO</span>
          <span style={{ display: 'block', color: 'var(--app-text-hint)' }}>ALGORITHM.</span>
        </h1>
        <p style={{ fontSize: 14, color: 'var(--app-text-muted)', lineHeight: 1.55, margin: '0 0 24px', maxWidth: 290 }}>
          Sparked helps you discover and publish local events by distance, not by feed.
        </p>
      </div>

      {/* CTA Cards */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Going Out — gradient wash card */}
        <div style={{ background: 'linear-gradient(160deg, rgba(255,95,78,0.20) 0%, rgba(255,140,56,0.11) 38%, rgba(255,255,255,0.03) 78%)', borderRadius: 22, padding: 20, border: '1px solid rgba(252,163,17,0.35)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, flexWrap: 'nowrap' }}>
            <Icon name="pin" size={11} color="#FCA311" />
            <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.20em', color: '#FCA311', whiteSpace: 'nowrap' }}>Going out</span>
          </div>
          <div style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 20, color: 'var(--app-text)', letterSpacing: '-0.01em', lineHeight: 1.15, marginBottom: 8 }}>Find something tonight</div>
          <p style={{ fontSize: 13, color: 'var(--app-text-muted)', margin: '0 0 16px', lineHeight: 1.5 }}>Real events near you, ranked by distance. No account needed to look.</p>
          <button onClick={onBrowseToday} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', background: '#fff', borderRadius: 14, padding: '13px 18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#14213D', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 14, letterSpacing: '-0.01em', boxShadow: '0 6px 20px rgba(0,0,0,0.25)' }}>
            Browse Local Events
          </button>
          <div style={{ marginTop: 10, textAlign: 'center', fontSize: 10, color: 'var(--app-text-hint)', fontWeight: 700, letterSpacing: '0.08em' }}>No login · no algorithm · just what's near you</div>
        </div>

        {/* Live ticker — taps through to the feed with the current defaults */}
        <button onClick={onBrowseToday} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', background: 'var(--app-icon-chip-bg)', border: '1px solid var(--app-card-border)', borderRadius: 16, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <LiveDot size={8} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 12.5, fontWeight: 800, color: 'var(--app-text)' }}>{SAMPLE_EVENTS.length} events near Phoenix right now</span>
            <span style={{ display: 'block', fontSize: 11, color: 'var(--app-text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Closest: {preview.title} · 1.2 mi · tonight</span>
          </span>
          <Icon name="chev-right" size={15} color="var(--app-text-faint)" />
        </button>

        {/* Hosting Something */}
        <div style={{ background: 'var(--app-card-bg)', borderRadius: 22, padding: 20, border: '1px solid var(--app-card-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, flexWrap: 'nowrap' }}>
            <Icon name="sparkles" size={11} color="#FCA311" />
            <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.20em', color: '#FCA311', whiteSpace: 'nowrap' }}>Hosting something</span>
          </div>
          <div style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 20, color: 'var(--app-text)', letterSpacing: '-0.01em', lineHeight: 1.15, marginBottom: 8 }}>Put your event on the map</div>
          <p style={{ fontSize: 13, color: 'var(--app-text-muted)', margin: '0 0 16px', lineHeight: 1.5 }}>Publish in minutes and reach the neighborhood around your venue.</p>
          <button onClick={onSignup} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', background: '#fff', borderRadius: 14, padding: '13px 18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#14213D', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 14, letterSpacing: '-0.01em', boxShadow: '0 6px 20px rgba(0,0,0,0.25)' }}>
            List Your First Event
          </button>
        </div>
      </div>

      {/* Event preview card */}
      <div style={{ padding: '20px 20px 0' }}>
        <button onClick={() => onEventTap && onEventTap(preview)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', background: 'var(--app-card-bg)', border: '1px solid var(--app-card-border)', borderRadius: 20, padding: 16, display: 'block' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(252,163,17,0.12)', border: '1px solid rgba(252,163,17,0.28)', borderRadius: 9999, padding: '4px 10px', fontSize: 9, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#FCA311' }}>
              <Icon name="fire" size={9} color="#FCA311" /> Tue · Tonight
            </span>
            <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--app-text-muted)' }}>1.2 mi</span>
          </div>
          <div style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 18, color: 'var(--app-text)', letterSpacing: '-0.01em', marginBottom: 8 }}>{preview.title}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--app-text-muted)' }}><Icon name="clock" size={12} color="var(--app-text-faint)" />{preview.time}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--app-text-muted)' }}><Icon name="pin" size={12} color="var(--app-text-faint)" />{preview.location}</div>
          </div>
        </button>
      </div>

      {/* About Sparked */}
      <div style={{ padding: '36px 24px 0', marginTop: 16, position: 'relative', paddingTop: '44px' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(252,163,17,0.50) 50%, transparent 100%)' }} />
        <Eyebrow>About Sparked</Eyebrow>
        <h2 style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 26, letterSpacing: '-0.02em', lineHeight: 1.1, margin: '10px 0 14px', color: 'var(--app-text)' }}>
          Built for local discovery,<br />not{' '}
          <span style={{ backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>feed fatigue.</span>
        </h2>
        <p style={{ fontSize: 13.5, color: 'var(--app-text-muted)', lineHeight: 1.6, margin: '0 0 24px' }}>
          Organizers, local businesses, and neighbors publish quickly — and attendees browse what's actually near them without fighting an engagement algorithm.
        </p>
      </div>

      {/* Feature cards */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: 'var(--app-card-bg)', border: '1.5px solid rgba(252,163,17,0.40)', borderRadius: 22, padding: 20 }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, marginBottom: 14, background: 'rgba(252,163,17,0.10)', border: '1px solid rgba(252,163,17,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="search" size={20} color="#FCA311" />
          </div>
          <div style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 18, color: 'var(--app-text)', letterSpacing: '-0.01em', marginBottom: 12 }}>Event Browsing</div>
          {["Events ranked by distance — what's nearby shows first", 'Filter by category, date, and radius', 'No login required to browse'].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
              <Icon name="check" size={13} color="#FCA311" />
              <span style={{ fontSize: 13, color: 'var(--app-text-muted)', lineHeight: 1.4 }}>{item}</span>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--app-card-bg)', border: '1.5px solid rgba(252,163,17,0.40)', borderRadius: 22, padding: 20 }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, marginBottom: 14, background: 'rgba(252,163,17,0.10)', border: '1px solid rgba(252,163,17,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="ticket" size={20} color="#FCA311" />
          </div>
          <div style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 18, color: 'var(--app-text)', letterSpacing: '-0.01em', marginBottom: 12 }}>Event Hosting</div>
          {['Publish your event in minutes — no design skills needed', 'Every listing gets a clean, linkable event page', 'Share to social, email, or embed on your website'].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
              <Icon name="check" size={13} color="#FCA311" />
              <span style={{ fontSize: 13, color: 'var(--app-text-muted)', lineHeight: 1.4 }}>{item}</span>
            </div>
          ))}
          <button onClick={onPricing} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', marginTop: 8, background: 'var(--app-card-bg)', border: '1px solid var(--app-card-border)', borderRadius: 14, padding: '13px 18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--app-text)', fontWeight: 800, fontSize: 14 }}>
            See plans &amp; pricing
            <Icon name="chev-right" size={15} color="#FCA311" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '36px 24px 44px', marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><SparkLogo size={18} /></div>
        <p style={{ fontSize: 11, color: 'var(--app-text-hint)', lineHeight: 1.7, margin: 0 }}>
          By continuing you agree to our{' '}
          <span style={{ color: 'var(--app-text-muted)', textDecoration: 'underline', cursor: 'pointer' }}>Terms of Service</span>
          {' '}and{' '}
          <span style={{ color: 'var(--app-text-muted)', textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>
          . I confirm I am at least 13 years old.
        </p>
        <p style={{ fontSize: 10, color: 'var(--app-text-hint)', margin: '8px 0 0' }}>© 2026 Sparked. All rights reserved.</p>
      </div>
    </div>
  );
};

// Three browsing modes for the Explore screen: list, map, time-ranked.
const VIEW_LABELS = { list: 'This week · 4 events', map: 'Near you · 4 pins', time: 'Time-ranked · 4 events' };

const ViewSwitcher = ({ value, onChange }) => {
  const options = [
    { id: 'list', icon: 'list' },
    { id: 'map',  icon: 'map' },
    { id: 'time', icon: 'clock' },
  ];
  return (
    <div style={{
      display: 'inline-flex', gap: 6, padding: 6, borderRadius: 14,
      background: 'var(--app-tabbar-bg)', border: '1px solid var(--app-card-border)',
      backdropFilter: 'blur(8px)',
    }}>
      {options.map(o => {
        const isActive = value === o.id;
        return (
          <button key={o.id} onClick={() => onChange(o.id)} aria-label={o.id} style={{
            width: 36, height: 32, borderRadius: 10, border: 'none', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: isActive
              ? 'linear-gradient(135deg,#ffca3a 0%,#FCA311 100%)'
              : 'transparent',
            boxShadow: isActive ? '0 4px 14px rgba(252,163,17,0.35)' : 'none',
            transition: 'background .2s ease, box-shadow .2s ease',
          }}>
            <Icon
              name={o.icon}
              size={16}
              color={isActive ? '#14213D' : 'var(--app-text-muted)'}
            />
          </button>
        );
      })}
    </div>
  );
};

// Compact row for the time-ranked view — time leads, then title + location.
const TimeRow = ({ event, onTap }) => (
  <div onClick={onTap} style={{
    display: 'flex', gap: 14, alignItems: 'center', cursor: 'pointer',
    padding: '12px 14px',
    background: 'var(--app-card-bg)', border: '1px solid var(--app-card-border)',
    borderRadius: 20,
  }}>
    <div style={{
      width: 56, flexShrink: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(255,99,72,0.10)', border: '1px solid rgba(255,99,72,0.25)',
      borderRadius: 14, padding: '8px 4px',
    }}>
      <span style={{ fontFamily: 'Montserrat', fontSize: 18, fontWeight: 900, color: '#ff6348', lineHeight: 1 }}>
        {event.time.split(' ')[0].replace(/[^0-9:apm]/gi, '').replace(':00','')}
      </span>
      <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,99,72,0.85)', textTransform: 'uppercase', letterSpacing: '0.18em', marginTop: 2 }}>
        {event.time.toLowerCase().includes('am') ? 'AM' : 'PM'}
      </span>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontFamily: 'Montserrat', fontWeight: 900, color: 'var(--app-text)', fontSize: 15, lineHeight: 1.15 }}>{event.title}</span>
        {event.live && <LiveDot size={7} />}
      </div>
      <div style={{ fontSize: 12, color: 'var(--app-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name="pin" size={11} color="#FCA311" />{event.location}
      </div>
    </div>
    <div style={{ width: 44, height: 44, borderRadius: 12, background: event.gradient, flexShrink: 0 }}></div>
  </div>
);

// Time-ranked view — groups events into temporal buckets.
const TimeView = ({ events, onSelect }) => {
  const groups = [
    { label: 'Happening now',  items: events.filter(e => e.live) },
    { label: 'Later tonight',  items: events.filter(e => /tonight|today/i.test(e.date) && !e.live) },
    { label: 'This weekend',   items: events.filter(e => /sat|sun/i.test(e.date)) },
    { label: 'Next week',      items: events.filter(e => /^fri|fri,/i.test(e.date) && !/this/i.test(e.date)) },
  ].filter(g => g.items.length);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {groups.map(g => (
        <div key={g.label}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Eyebrow>{g.label}</Eyebrow>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(252,163,17,0.30), transparent)' }}></div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--app-text-faint)' }}>{g.items.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {g.items.map(e => <TimeRow key={e.id} event={e} onTap={() => onSelect(e)} />)}
          </div>
        </div>
      ))}
    </div>
  );
};

// Map view — stylized navy map with gradient pins and a sheet of nearby events.
const MapView = ({ events, onSelect }) => {
  // Hand-placed pin positions so the layout looks intentional.
  const pins = [
    { x: '28%', y: '22%' }, { x: '64%', y: '34%' },
    { x: '42%', y: '58%' }, { x: '74%', y: '70%' },
  ];
  return (
    <div style={{
      position: 'relative', borderRadius: 24, overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.08)',
      background: '#0c1528',
      boxShadow: '0 4px 24px rgba(0,0,0,0.30)',
    }}>
      {/* Faux map: grid lines + soft glow blobs */}
      <div style={{
        position: 'relative', height: 320,
        backgroundImage:
          'radial-gradient(circle at 30% 30%, rgba(255,99,72,0.12), transparent 50%),' +
          'radial-gradient(circle at 75% 70%, rgba(247,183,49,0.10), transparent 55%),' +
          'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),' +
          'linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: 'auto, auto, 32px 32px, 32px 32px',
      }}>
        {/* Faux "roads" */}
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, opacity: 0.18 }}>
          <path d="M0,55 Q40,40 60,55 T100,50" stroke="white" strokeWidth="0.6" fill="none"/>
          <path d="M30,0 Q35,40 25,70 T20,100" stroke="white" strokeWidth="0.4" fill="none"/>
          <path d="M65,0 Q70,30 80,55 T85,100" stroke="white" strokeWidth="0.4" fill="none"/>
        </svg>
        {/* "You" dot */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
          width: 14, height: 14, borderRadius: 9999,
          background: '#3a86ff', boxShadow: '0 0 0 6px rgba(58,134,255,0.20), 0 0 0 14px rgba(58,134,255,0.08)',
        }}></div>
        {/* Event pins */}
        {events.map((e, i) => {
          const pos = pins[i % pins.length];
          return (
            <button key={e.id} onClick={() => onSelect(e)} style={{
              position: 'absolute', left: pos.x, top: pos.y, transform: 'translate(-50%,-100%)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50% 50% 50% 0',
                transform: 'rotate(-45deg)',
                backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
                boxShadow: '0 4px 14px rgba(255,99,72,0.45)',
                border: '2px solid rgba(255,255,255,0.85)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {e.live && (
                  <span style={{ transform: 'rotate(45deg)', display: 'inline-flex' }}>
                    <LiveDot size={7} />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      {/* Selected-card sheet */}
      <div style={{
        padding: 14, display: 'flex', gap: 12, alignItems: 'center',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(15,26,48,0.75)', backdropFilter: 'blur(10px)',
      }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: events[0].gradient, flexShrink: 0, position: 'relative' }}>
          {events[0].live && (
            <span style={{ position: 'absolute', top: 6, right: 6 }}>
              <LiveDot size={7} />
            </span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Montserrat', fontWeight: 900, color: '#fff', fontSize: 14 }}>{events[0].title}</div>
          <div style={{ fontSize: 11, color: 'rgba(238,240,255,0.55)', marginTop: 2 }}>{events[0].location}</div>
        </div>
        <button onClick={() => onSelect(events[0])} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
          color: '#FCA311', fontWeight: 900, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
          padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
        }}>View →</button>
      </div>
    </div>
  );
};

// Recents seed the finder query — filter terms, not event names (MVP is a
// filter finder, so recents are filters you reached for before).
const FINDER_RECENTS = ['Free', 'Music', 'This week', 'Within 5 mi'];
// Interest tiles shown in the empty state (those with events nearby).
const FINDER_TILES = ['Markets', 'Music', 'Art', 'Food'];

const ExploreScreen = ({ onSelect, onCreate, onTab, initialInterests, initialStart, initialEnd, initialRadius, initialZip, blocked = [], userEvents = [] }) => {
  const [active, setActive] = React.useState(initialInterests && initialInterests.length ? initialInterests : ['Markets', 'Music']);
  const [view, setView] = React.useState('list');
  const [start, setStart] = React.useState(initialStart || todayLocalYMD());
  const [end, setEnd] = React.useState(initialEnd || todayLocalYMD());
  const [radius, setRadius] = React.useState(initialRadius || 25);
  const [zip, setZip] = React.useState(initialZip || '85001');
  // Finder + non-interest filter state.
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const [priceFilter, setPriceFilter] = React.useState(null); // PRICE_PRESETS entry | null
  const [whenLabel, setWhenLabel] = React.useState(null);      // applied When preset label | null
  const [distLabel, setDistLabel] = React.useState(null);      // applied Distance preset label | null
  // A finder "Apply" opens a DISTINCT search-results view (separate from the
  // browse feed). null = browsing; otherwise { type, label, test, effRadius }.
  const [searchResult, setSearchResult] = React.useState(null);

  const toggle = (i) => setActive(a => a.includes(i) ? a.filter(x => x !== i) : [...a, i]);

  // Blocked categories never appear in the feed (set in onboarding).
  const blockedSet = new Set(blocked);
  const base = SAMPLE_EVENTS.filter(e => !e.tags.some(t => blockedSet.has(t)));
  const within = (e, miMax) => e.mi == null || e.mi <= miMax;

  const closeSearch = () => { setSearchOpen(false); setQ(''); };

  // --- Apply actions: a finder match opens the DISTINCT search-results view.
  // The browse feed's own filter state is intentionally NOT touched, so
  // browsing stays strictly in-radius. effRadius drives the overflow math:
  // the user's preferred radius for most filters, the chosen mileage for a
  // Distance filter. ---
  const openResult = (sr) => { setSearchResult(sr); closeSearch(); };
  const applyInterest = (i) => openResult({ type: 'Interest', label: i, test: (e) => e.tags.includes(i), effRadius: radius });
  const applyPrice = (p) => openResult({ type: 'Price', label: p.label, test: (e) => p.test(e.price), effRadius: radius });
  const applyWhen = (w) => openResult({ type: 'When', label: w.label, test: (e) => ffInWhen(e, w), effRadius: radius });
  const applyDist = (d) => openResult({ type: 'Distance', label: d.label, test: () => true, effRadius: d.mi });

  // --- Filter registry: label + type + icon + live count + apply-action ------
  // Adding a filter here makes it instantly searchable. Every `count` is
  // computed LIVE from the current event list — the number of events that
  // would remain if this filter were applied (honoring the active radius).
  const registry = [
    ...INTERESTS.map(i => ({
      id: 'int-' + i, type: 'Interest', label: i, icon: INTEREST_ICON_MAP[i] || 'store',
      count: base.filter(e => e.tags.includes(i) && within(e, radius)).length,
      apply: () => applyInterest(i),
    })),
    ...PRICE_PRESETS.map(p => ({
      id: 'price-' + p.id, type: 'Price', label: p.label, icon: 'ticket',
      count: base.filter(e => p.test(e.price) && within(e, radius)).length,
      apply: () => applyPrice(p),
    })),
    ...WHEN_PRESETS.map(w => ({
      id: 'when-' + w.id, type: 'When', label: w.label, icon: 'cal',
      count: base.filter(e => ffInWhen(e, w) && within(e, radius)).length,
      apply: () => applyWhen(w),
    })),
    ...DIST_PRESETS.map(d => ({
      id: 'dist-' + d.id, type: 'Distance', label: d.label, icon: 'pin',
      count: base.filter(e => within(e, d.mi)).length,
      apply: () => applyDist(d),
    })),
  ];
  const matches = ffMatch(q, registry);

  // --- Feed: respects active interests, price, distance, and any When preset -
  // The user's freshly-posted pop-ups are pinned on top, unfiltered — they're
  // the poster's own listings, so they always show in the browse feed.
  const feed = [...userEvents, ...base.filter(e => {
    const interestOk = active.length === 0 || e.tags.some(t => active.includes(t));
    const priceOk = !priceFilter || priceFilter.test(e.price);
    const distOk = within(e, radius);
    const whenOk = !whenLabel || (() => { const y = ffEventYMD(e); return y && y >= start && y <= end; })();
    return interestOk && priceOk && distOk && whenOk;
  })];

  const hasActiveExtras = priceFilter || whenLabel || distLabel;

  // --- Search results: in-radius set + "just past your radius" overflow ------
  // Overflow appears ONLY when fewer than 3 match in-radius, capped at
  // min(radius × 1.5, radius + 15) of the searched radius, and is drawn from
  // the SAME matching set so it always respects the active filter.
  let srData = null;
  if (searchResult) {
    const sr = searchResult;
    const matching = base.filter(sr.test);
    const inRadius = matching.filter(e => e.mi == null || e.mi <= sr.effRadius);
    const cap = Math.min(sr.effRadius * 1.5, sr.effRadius + 15);
    const overflow = matching
      .filter(e => e.mi != null && e.mi > sr.effRadius && e.mi <= cap)
      .sort((a, b) => a.mi - b.mi);
    srData = { sr, inRadius, cap, overflow, showOverflow: inRadius.length < 3 && overflow.length > 0 };
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowX: 'hidden', position: 'relative', background: 'var(--app-bg)' }}>
      <StatusBar />
      {/* Header — back+logo in results, logo in browse; search icon always present. */}
      <div style={{ padding: '4px 20px 0', display: 'flex', alignItems: 'center', gap: 10, minHeight: 44 }}>
        {searchResult && (
          <button onClick={() => setSearchResult(null)} aria-label="Back to browse" style={{ background: 'var(--app-icon-chip-bg, rgba(255,255,255,0.06))', border: '1px solid var(--app-card-border, rgba(255,255,255,0.12))', borderRadius: 10, padding: 8, cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--app-text, #fff)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
        )}
        <SparkLogo size={22} />
        <div style={{ flex: 1 }}></div>
        <button onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))} aria-label="Find a filter" style={{
          background: searchOpen ? 'linear-gradient(135deg,#ff8c38,#ffca3a)' : 'var(--app-icon-chip-bg, rgba(255,255,255,0.06))',
          border: searchOpen ? '1px solid rgba(255,140,56,0.5)' : '1px solid var(--app-card-border, rgba(255,255,255,0.12))',
          borderRadius: 12, padding: 10, cursor: 'pointer', flexShrink: 0, transition: 'background .2s ease',
        }}>
          <Icon name="search" size={16} color={searchOpen ? '#14213D' : 'var(--app-text, #fff)'} />
        </button>
      </div>

      {searchResult ? (
        // ===== SEARCH RESULTS — distinct view; the browse feed is not rendered here =====
        <React.Fragment>
          <div style={{ padding: '14px 20px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, fontWeight: 900, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'rgba(238,240,255,0.50)' }}>
              <Icon name="pin" size={13} color="#FCA311" />
              Showing events near {zip} · {srData.sr.effRadius}mi
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 11, flexWrap: 'wrap' }}>
              <ActiveFilterPill label={srData.sr.label} onRemove={() => setSearchResult(null)} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(238,240,255,0.45)' }}>{srData.sr.type} filter</span>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px 100px' }}>
            {srData.inRadius.length === 0 && srData.overflow.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                <div style={{ width: 52, height: 52, borderRadius: 15, margin: '0 auto 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="pin" size={20} color="rgba(238,240,255,0.40)" />
                </div>
                <div style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 15, color: '#fff', marginBottom: 6 }}>No events within {Math.round(srData.cap * 10) / 10} mi</div>
                <div style={{ fontSize: 12.5, color: 'rgba(238,240,255,0.50)', lineHeight: 1.5 }}>Try widening your radius to see more of “{srData.sr.label}.”</div>
              </div>
            ) : (
              <React.Fragment>
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.04em', color: 'rgba(238,240,255,0.55)', marginBottom: 14 }}>
                  Within your radius · {srData.inRadius.length} event{srData.inRadius.length === 1 ? '' : 's'}
                </div>
                {srData.inRadius.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {srData.inRadius.map(e => <EventStub variant="photo" key={e.id} event={e} onTap={() => onSelect(e)} />)}
                  </div>
                ) : (
                  <div style={{ fontSize: 12.5, color: 'rgba(238,240,255,0.50)', lineHeight: 1.5 }}>Nothing within {srData.sr.effRadius} mi — but there's a little more just past it.</div>
                )}
                {srData.showOverflow && (
                  <React.Fragment>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '26px 0 14px' }}>
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.10)' }}></div>
                      <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'rgba(238,240,255,0.55)' }}>Just past your radius</span>
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.10)' }}></div>
                    </div>
                    <div style={{ display: 'flex', gap: 11, padding: '13px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16 }}>
                      <span style={{ flexShrink: 0, lineHeight: 0, marginTop: 1 }}><Icon name="clock" size={16} color="#FCA311" /></span>
                      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'rgba(238,240,255,0.65)' }}>
                        Only <b style={{ color: '#fff' }}>{srData.inRadius.length}</b> within <b style={{ color: '#FCA311' }}>{srData.sr.effRadius} mi</b>. Here {srData.overflow.length === 1 ? 'is' : 'are'} <b style={{ color: '#FCA311' }}>{srData.overflow.length} more</b> a little farther out, so you don&apos;t miss something good.
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {srData.overflow.map(e => <EventStub variant="photo" key={e.id} event={e} onTap={() => onSelect(e)} pastRadius={Math.round(e.mi - srData.sr.effRadius)} />)}
                    </div>
                  </React.Fragment>
                )}
              </React.Fragment>
            )}
          </div>
        </React.Fragment>
      ) : (
        // ===== EXPLORE FEED (browse) — unchanged; the finder overlays on top of it =====
        <React.Fragment>
          <div style={{ padding: '20px 20px 0' }}>
            <Eyebrow>Explore Interests</Eyebrow>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 0 4px', scrollbarWidth: 'none' }}>
              {INTERESTS.map(i => <InterestPill key={i} active={active.includes(i)} onClick={() => toggle(i)}>{i}</InterestPill>)}
            </div>
          </div>
          {hasActiveExtras && (
            <div style={{ padding: '12px 20px 0', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {priceFilter && <ActiveFilterPill label={priceFilter.label} onRemove={() => setPriceFilter(null)} />}
              {whenLabel && <ActiveFilterPill label={whenLabel} onRemove={() => { setWhenLabel(null); setStart(todayLocalYMD()); setEnd(todayLocalYMD()); }} />}
              {distLabel && <ActiveFilterPill label={distLabel} onRemove={() => { setDistLabel(null); setRadius(25); }} />}
            </div>
          )}
          <div style={{ padding: '14px 20px 0' }}>
            <Eyebrow>When</Eyebrow>
            <div style={{ marginTop: 10 }}>
              <DateRangeBar start={start} end={end} onStartChange={setStart} onEndChange={setEnd} zip={zip} onZipChange={setZip} radius={radius} onRadiusChange={setRadius} />
            </div>
          </div>
          <div style={{ padding: '14px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'rgba(238,240,255,0.55)', fontWeight: 700 }}>{
              (view === 'map' ? `Near you · ${feed.length} pin${feed.length === 1 ? '' : 's'}`
               : view === 'time' ? `Time-ranked · ${feed.length} event${feed.length === 1 ? '' : 's'}`
               : `${whenLabel || 'This week'} · ${feed.length} event${feed.length === 1 ? '' : 's'}`)
            }</span>
            <ViewSwitcher value={view} onChange={setView} />
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px 100px' }}>
            {view === 'list' && (
              feed.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {feed.map(e => <EventStub variant="photo" key={e.id} event={e} onTap={() => onSelect(e)} />)}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 18px', color: 'rgba(238,240,255,0.50)' }}>
                <div style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 15, color: 'var(--app-text)', marginBottom: 6 }}>Nothing matches those filters</div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>Loosen a filter above to see more events nearby.</div>
                </div>
              )
            )}
            {view === 'map' && <MapView events={feed} onSelect={onSelect} />}
            {view === 'time' && <TimeView events={feed} onSelect={onSelect} />}
          </div>
        </React.Fragment>
      )}

      {/* ===== FINDER OVERLAY — scrim dims the feed; panel drops from the top ===== */}
      {searchOpen && (
        <div style={{ position: 'absolute', top: 50, left: 0, right: 0, bottom: 0, zIndex: 40 }}>
          <div onClick={closeSearch} style={{
            position: 'absolute', inset: 0, background: 'rgba(13,21,37,0.6)', cursor: 'pointer',
          }}></div>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, maxHeight: '100%',
            display: 'flex', flexDirection: 'column', background: '#14213D',
            borderBottom: '1px solid rgba(255,255,255,0.08)', borderRadius: '0 0 22px 22px',
            boxShadow: '0 24px 50px -12px rgba(0,0,0,0.55)', animation: 'ffPanelDrop .26s ease',
          }}>
            {/* Expanded search field */}
            <div style={{ padding: '14px 18px 12px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 9,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,140,56,0.40)',
                borderRadius: 13, padding: '10px 13px',
              }}>
                <Icon name="search" size={15} color="rgba(238,240,255,0.50)" />
                <input
                  autoFocus value={q} onChange={(e) => setQ(e.target.value)}
                  placeholder="Find a filter — Free, Music, This week…"
                  style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', outline: 'none', color: '#eef0ff', fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit' }}
                />
                {q && (
                  <button onClick={() => setQ('')} aria-label="Clear" style={{
                    background: 'rgba(255,255,255,0.10)', border: 'none', borderRadius: 9999,
                    width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon name="x" size={11} color="#fff" />
                  </button>
                )}
              </div>
              <button onClick={closeSearch} style={{
                background: 'none', border: 'none', color: '#ffca3a', fontWeight: 800, fontSize: 13, cursor: 'pointer', flexShrink: 0,
              }}>Cancel</button>
            </div>
            {/* Finder body */}
            <div style={{ overflowY: 'auto', padding: '2px 18px 20px' }}>
              {!q.trim() ? (
                <div style={{ background: 'rgba(31,44,72,0.72)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 18, padding: 16, boxShadow: '0 8px 24px -10px rgba(0,0,0,0.4)' }}>
                  <Eyebrow>Recent</Eyebrow>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '12px 0 24px' }}>
                    {FINDER_RECENTS.map(r => <RecentChip key={r} label={r} onClick={() => setQ(r)} />)}
                  </div>
                  <Eyebrow>Browse by Interest</Eyebrow>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                    {FINDER_TILES.map(label => (
                      <InterestTile key={label} label={label} icon={INTEREST_ICON_MAP[label] || 'store'} onClick={() => applyInterest(label)} />
                    ))}
                  </div>
                </div>
              ) : matches.length > 0 ? (
                <React.Fragment>
                  <div style={{ fontSize: 11.5, color: 'rgba(238,240,255,0.45)', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '6px 0 12px' }}>
                    Matching filters
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {matches.map(m => <FilterMatchRow key={m.f.id} match={m} query={q} onApply={m.f.apply} />)}
                  </div>
                </React.Fragment>
              ) : (
                <div style={{ textAlign: 'center', padding: '34px 18px' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, margin: '0 auto 12px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name="search" size={19} color="rgba(238,240,255,0.40)" />
                  </div>
                  <div style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 14.5, color: '#fff', marginBottom: 6 }}>No filters match “{q.trim()}”</div>
                  <div style={{ fontSize: 12, color: 'rgba(238,240,255,0.50)', lineHeight: 1.5 }}>
                    Try an interest, a price like “Free”, a day, or a distance.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <TabBar active="home" onChange={(t) => onTab && onTab(t)} />
    </div>
  );
};

// Photo hero — swipeable 1–3 image gallery. A single photo renders as a
// static hero with no controls; multiples get page dots, a counter, and a
// thumbnail strip (active thumb ringed in gold). Images are gradient panels
// in this prototype, but the gallery treats them as photos.
const PhotoHero = ({ event }) => {
  const photos = (event.photos && event.photos.length) ? event.photos : [event.gradient];
  const multi = photos.length > 1;
  const [idx, setIdx] = React.useState(0);
  const scrollerRef = React.useRef(null);
  const onScroll = (e) => {
    const w = e.target.clientWidth || 1;
    const i = Math.round(e.target.scrollLeft / w);
    if (i !== idx) setIdx(i);
  };
  const goTo = (i) => {
    const el = scrollerRef.current; if (!el) return;
    // behavior:'smooth' is unreliable inside the transform-scaled phone frame,
    // so animate scrollLeft by hand for a dependable, smooth jump.
    const start = el.scrollLeft;
    const end = i * el.clientWidth;
    if (Math.abs(end - start) < 1) return;
    const t0 = performance.now();
    const dur = 320;
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const step = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      el.scrollLeft = start + (end - start) * ease(t);
      if (t < 1) requestAnimationFrame(step); else setIdx(i);
    };
    requestAnimationFrame(step);
  };
  return (
    <div>
      <div style={{ height: 280, marginTop: -54, position: 'relative', overflow: 'hidden' }}>
        <div ref={scrollerRef} onScroll={multi ? onScroll : undefined} style={{
          position: 'absolute', inset: 0, display: 'flex',
          overflowX: multi ? 'auto' : 'hidden', overflowY: 'hidden',
          scrollSnapType: 'x mandatory', scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}>
          {photos.map((g, i) => (
            <div key={i} style={{ flex: '0 0 100%', width: '100%', height: '100%', background: g, scrollSnapAlign: 'start' }}></div>
          ))}
        </div>
        {/* Bottom fade into the navy canvas so the title reads over any photo. */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #14213D 0%, transparent 60%)', pointerEvents: 'none' }}></div>
        {event.live && (
          <div style={{
            position: 'absolute', bottom: 24, left: 24,
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 10px 6px 8px', borderRadius: 9999,
            background: 'rgba(15,26,48,0.55)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.10)',
          }}>
            <LiveDot />
            <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.22em', color: '#fff' }}>NOW</span>
          </div>
        )}
        {multi && (
          <React.Fragment>
            {/* Gradient-pill page dots, bottom-center. */}
            <div style={{ position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 6 }}>
              {photos.map((_, i) => (
                <button key={i} onClick={() => goTo(i)} aria-label={`Photo ${i + 1}`} style={{
                  height: 6, width: i === idx ? 20 : 6, borderRadius: 9999, border: 'none', cursor: 'pointer', padding: 0,
                  background: i === idx ? 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' : 'rgba(255,255,255,0.45)',
                  transition: 'width .25s ease',
                }}></button>
              ))}
            </div>
            {/* "1/3" counter, bottom-right. */}
            <div style={{
              position: 'absolute', bottom: 16, right: 16,
              padding: '4px 9px', borderRadius: 9999, fontSize: 11, fontWeight: 800,
              color: '#fff', background: 'rgba(15,26,48,0.62)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.12)', letterSpacing: '0.02em',
            }}>{idx + 1}/{photos.length}</div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
};

const EventDetailScreen = ({ event, onBack, onRSVP, onOrganizerTap, desktop }) => {
  const [shareToast, setShareToast] = React.useState(false);
  const [saved, setSaved] = React.useState(!!event.saved);
  // Report sheet — prototype-only, no backend.
  const [reportOpen, setReportOpen] = React.useState(false);
  const [reportReason, setReportReason] = React.useState('Spam or scam');
  const [reportDetails, setReportDetails] = React.useState('');
  const [reportToast, setReportToast] = React.useState(false);
  const REPORT_REASONS = ['Spam or scam', 'Wrong information', 'Inappropriate content', 'Other'];
  const handleSubmitReport = () => {
    setReportOpen(false);
    setReportDetails('');
    setReportToast(true);
    window.setTimeout(() => setReportToast(false), 2400);
  };
  // Re-tick every minute so the ticket countdown stays honest.
  const [, _tick] = React.useState(0);
  React.useEffect(() => { const id = setInterval(() => _tick(t => t + 1), 60000); return () => clearInterval(id); }, []);
  const handleShare = () => {
    setShareToast(true);
    window.setTimeout(() => setShareToast(false), 1800);
  };
  // Countdown shown in the ticket's right-hand stub.
  const cd = (() => {
    if (!event.startISO) return { big: '—', label: '', sub: '' };
    const diff = new Date(event.startISO).getTime() - Date.now();
    if (diff <= 0) return { big: 'Now', label: 'Happening', sub: '', live: true };
    const totalMin = Math.floor(diff / 60000);
    if (totalMin >= 1440) { const d = Math.ceil(diff / 86400000); return { big: String(d), label: d === 1 ? 'Day' : 'Days', sub: '' }; }
    const h = Math.floor(totalMin / 60); const m = totalMin % 60;
    if (h >= 1) return { big: h + 'h', label: 'Starts in', sub: m > 0 ? m + ' min' : 'on time' };
    return { big: m + 'm', label: 'Starts in', sub: 'soon' };
  })();
  return (
  <div style={{ height: '100%', overflow: 'auto', overflowX: 'hidden', position: 'relative', background: desktop ? 'var(--app-bg)' : undefined }}>
    <div style={desktop ? { maxWidth: 640, margin: '0 auto' } : undefined}>
    <div style={{ position: 'sticky', top: 0, zIndex: 10 }}>
      {!desktop && <StatusBar />}
      <div style={{ padding: '0 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onBack} aria-label="Back" style={{
          background: 'rgba(15,26,48,0.85)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.12)', color: '#fff',
          width: 40, height: 40, borderRadius: 12, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setSaved(s => !s)} aria-label={saved ? 'Saved' : 'Save'} style={{
            background: saved ? 'rgba(252,163,17,0.12)' : 'rgba(15,26,48,0.85)',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${saved ? 'rgba(252,163,17,0.35)' : 'rgba(255,255,255,0.12)'}`,
            color: saved ? '#FCA311' : '#fff',
            width: 40, height: 40, borderRadius: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name={saved ? 'bookmark-fill' : 'bookmark'} size={16} color={saved ? '#FCA311' : '#fff'} />
          </button>
          <button onClick={handleShare} aria-label="Share" style={{
            background: 'rgba(15,26,48,0.85)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.12)', color: '#fff',
            width: 40, height: 40, borderRadius: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="share" size={16} color="#fff" />
          </button>
        </div>
      </div>
    </div>
    <PhotoHero event={event} />
    <div style={{ padding: '0 24px 60px', marginTop: 16, position: 'relative' }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {event.tags.map(t => <Tag key={t}>{t}</Tag>)}
      </div>
      <h1 style={{ fontFamily: 'Montserrat', fontSize: 32, fontWeight: 900, letterSpacing: '-0.01em', lineHeight: 1.05, margin: '0 0 18px', color: 'var(--app-text)' }}>{event.title}</h1>
      {/* Ticket stub — brand stripe, perforated tear, live countdown column. */}
      <div style={{
        position: 'relative', display: 'flex', alignItems: 'stretch',
        background: 'var(--app-card-bg)', border: '1px solid var(--app-card-border)',
        borderRadius: 20, overflow: 'hidden', marginBottom: 22,
        boxShadow: '0 10px 32px rgba(0,0,0,0.24)',
      }}>
        <div style={{ width: 5, flexShrink: 0, background: 'linear-gradient(180deg,#ff6348,#ff8c38,#ffca3a)' }}></div>        <div style={{ flex: 1, minWidth: 0, padding: '17px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 11 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, fontSize: 13.5 }}>
            <Icon name="cal" size={15} color="#ff6348" /><span style={{ color: 'var(--app-text-muted)', fontWeight: 600 }}>{event.date}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, fontSize: 13.5 }}>
            <Icon name="clock" size={15} color="#ff6348" /><span style={{ color: 'var(--app-text-muted)', fontWeight: 600 }}>{event.time}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, fontSize: 13 }}>
            <span style={{ marginTop: 1, flexShrink: 0, lineHeight: 0 }}><Icon name="pin" size={15} color="#FCA311" /></span><span style={{ color: 'var(--app-text-muted)', fontWeight: 600, lineHeight: 1.35 }}>{event.location}{typeof event.mi === 'number' ? <span style={{ whiteSpace: 'nowrap' }}>{' · '}{event.mi}&nbsp;mi</span> : ''}</span>
          </div>
        </div>
        {/* perforated tear with notches biting the top & bottom edges */}
        <div style={{ position: 'relative', width: 2, alignSelf: 'stretch', margin: '15px 0', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 0, height: '100%', borderLeft: '2px dotted var(--app-text-hint)' }}></div>
          <div style={{ position: 'absolute', top: -15, left: '50%', width: 14, height: 14, borderRadius: '50%', background: 'var(--app-bg)', transform: 'translate(-50%,-50%)' }}></div>
          <div style={{ position: 'absolute', bottom: -15, left: '50%', width: 14, height: 14, borderRadius: '50%', background: 'var(--app-bg)', transform: 'translate(-50%,50%)' }}></div>
        </div>
        <div style={{ width: 84, flexShrink: 0, padding: '16px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 30, lineHeight: 1, color: cd.live ? '#ff6348' : '#ffca3a' }}>{cd.big}</div>
          {cd.label && <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--app-text-muted)', marginTop: 7, whiteSpace: 'nowrap' }}>{cd.label}</div>}
          {cd.sub && <div style={{ fontSize: 10, color: 'var(--app-text-faint)', marginTop: 4, whiteSpace: 'nowrap' }}>{cd.sub}</div>}
        </div>
      </div>
      <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--app-text-muted)', lineHeight: 1.6, margin: '32px 0 22px' }}>{event.desc}</p>
      {/* Full street address lives down here, next to a (future) directions link
         — the ticket only carries venue + distance. */}
      {event.address && (
        <div style={{ borderTop: '1px solid var(--app-divider)', paddingTop: 18, marginBottom: 22 }}>
          <Eyebrow color="#F7B731">Location</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginTop: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0, background: 'rgba(252,163,17,0.14)', border: '1px solid rgba(252,163,17,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="pin" size={16} color="#FCA311" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'Montserrat', fontWeight: 900, color: 'var(--app-text)', fontSize: 14, letterSpacing: '-0.01em' }}>{event.location}</div>
              <div style={{ fontSize: 13, color: 'var(--app-text-muted)', marginTop: 3, lineHeight: 1.45 }}>{event.address}</div>
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent((event.location ? event.location + ', ' : '') + event.address)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 9, fontSize: 12.5, fontWeight: 800, color: '#FCA311', cursor: 'pointer', textDecoration: 'none' }}>
                Get directions
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FCA311" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </a>
            </div>
          </div>
        </div>
      )}
      <div style={{ borderTop: '1px solid var(--app-divider)', paddingTop: 18, marginBottom: 22 }}>
        <Eyebrow color="#F7B731">Organizer</Eyebrow>
        <button onClick={() => onOrganizerTap && onOrganizerTap(event)} style={{
          all: 'unset', boxSizing: 'border-box', cursor: onOrganizerTap ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, width: '100%',
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 9999, flexShrink: 0,
            background: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(255,95,78,0.30)',
          }}>
            <Icon name="sparkles" size={17} color="#14213D" />
          </div>
          <span style={{ fontFamily: 'Montserrat', fontWeight: 900, color: 'var(--app-text)', fontSize: 15, letterSpacing: '-0.01em', flex: 1 }}>{event.organizer}</span>
          {onOrganizerTap && <Icon name="chev-right" size={16} color="var(--app-text-faint)" />}
        </button>
      </div>
      {/* Single primary action — full spark gradient. Sharing lives in the
          top-right header icon, so there's no secondary button here. */}
      <button onClick={() => onRSVP ? onRSVP(event) : alert('RSVP recorded')} style={{
        width: '100%',
        backgroundImage: 'linear-gradient(135deg,#ff5f4e 0%,#ff8c38 50%,#ffca3a 100%)',
        border: 'none',
        color: '#14213D', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 16, letterSpacing: '-0.01em',
        padding: '17px 20px', borderRadius: 16, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        boxShadow: '0 12px 30px -8px rgba(255,95,78,0.55)',
      }}>I&apos;m Going</button>

      {/* Low-attention report action — standard bottom placement. */}
      <div style={{ textAlign: 'center', marginTop: 22 }}>
        <button onClick={() => setReportOpen(true)} style={{
          all: 'unset', boxSizing: 'border-box', cursor: 'pointer',
          fontSize: 12.5, fontWeight: 600, color: 'var(--app-text-faint)',
        }}>Report this event</button>
      </div>
    </div>
    </div>

    {/* Tiny confirmation toast — confirms the share action without
        navigating away. Fades in/out via inline style + setTimeout above. */}
    {shareToast && (
      <div style={{
        position: 'absolute', left: '50%', bottom: 24, transform: 'translateX(-50%)',
        zIndex: 20, display: 'inline-flex', alignItems: 'center', gap: 10,
        background: 'rgba(15,26,48,0.92)', border: '1px solid rgba(252,163,17,0.35)',
        backdropFilter: 'blur(12px)',
        padding: '12px 18px', borderRadius: 9999,
        boxShadow: '0 12px 28px rgba(0,0,0,0.35)',
      }}>
        <Icon name="check" size={14} color="#FCA311" />
        <span style={{ fontSize: 12, fontWeight: 900, color: '#fff', letterSpacing: '0.02em' }}>Link copied</span>
      </div>
    )}

    {/* Report sheet — prototype-only, single-select reason + optional details. */}
    {reportOpen && (
      <React.Fragment>
        <div onClick={() => setReportOpen(false)} style={{
          position: 'absolute', inset: 0, background: 'rgba(6,10,20,0.65)', zIndex: 40,
        }}></div>
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 41,
          background: 'var(--app-bg)', borderTop: '1px solid var(--app-card-border)',
          borderRadius: '24px 24px 0 0', padding: '20px 24px 28px',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.45)',
        }}>
          <div style={{ width: 36, height: 4, borderRadius: 9999, background: 'var(--app-card-border)', margin: '0 auto 18px' }}></div>
          <div style={{ fontFamily: 'Montserrat', fontSize: 18, fontWeight: 900, color: 'var(--app-text)', marginBottom: 16 }}>Report this event</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {REPORT_REASONS.map((r) => (
              <button key={r} onClick={() => setReportReason(r)} style={{
                all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%',
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                borderRadius: 12, background: reportReason === r ? 'rgba(252,163,17,0.10)' : 'var(--app-card-bg)',
                border: `1px solid ${reportReason === r ? 'rgba(252,163,17,0.40)' : 'var(--app-card-border)'}`,
              }}>
                <span style={{
                  width: 18, height: 18, borderRadius: 9999, flexShrink: 0,
                  border: `2px solid ${reportReason === r ? '#FCA311' : 'var(--app-border-strong)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {reportReason === r && <span style={{ width: 9, height: 9, borderRadius: 9999, background: '#FCA311' }}></span>}
                </span>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--app-text)' }}>{r}</span>
              </button>
            ))}
          </div>
          <textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)}
            placeholder="Add details (optional)"
            style={{
              width: '100%', minHeight: 70, boxSizing: 'border-box', resize: 'none',
              background: 'var(--app-card-bg)', border: '1px solid var(--app-card-border)',
              borderRadius: 12, padding: '11px 13px', fontSize: 13, fontFamily: 'Inter',
              color: 'var(--app-text)', marginBottom: 18,
            }}></textarea>
          <button onClick={handleSubmitReport} style={{
            all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', textAlign: 'center',
            background: 'var(--app-icon-chip-bg)', border: '1px solid var(--app-border-strong)',
            borderRadius: 14, padding: '14px 18px', fontFamily: 'Montserrat', fontWeight: 900,
            fontSize: 14.5, color: 'var(--app-text)',
          }}>Submit report</button>
        </div>
      </React.Fragment>
    )}

    {/* Report confirmation toast */}
    {reportToast && (
      <div style={{
        position: 'absolute', left: '50%', bottom: 24, transform: 'translateX(-50%)',
        zIndex: 50, display: 'inline-flex', alignItems: 'center', gap: 10,
        background: 'rgba(15,26,48,0.92)', border: '1px solid rgba(252,163,17,0.35)',
        backdropFilter: 'blur(12px)',
        padding: '12px 18px', borderRadius: 9999,
        boxShadow: '0 12px 28px rgba(0,0,0,0.35)',
      }}>
        <Icon name="check" size={14} color="#FCA311" />
        <span style={{ fontSize: 12, fontWeight: 900, color: '#fff', letterSpacing: '0.02em' }}>Thanks — we&apos;ll review this event.</span>
      </div>
    )}
  </div>
  );
};

// =============================================================
// ME SCREEN — top-level for the Me tab. Profile header + Saved card
// + Workspace card. Both cards drill into their own screens.
// =============================================================
// What an account unlocks — shown on the logged-out Me tab.
const ME_UNLOCKS = [
  { icon: 'bookmark-fill', title: 'Save events', sub: 'Bookmark anything and find it again in one tap.' },
  { icon: 'list', title: 'Keep your filters', sub: 'Your feed remembers the categories you’re into.' },
  { icon: 'sparkles', title: 'Host events', sub: 'Publish and manage your own nights out.' },
];

// Logged-out Me — a signup invitation in place of the profile shell. Browsing,
// event detail, and share links stay open to anonymous users; only saving,
// filter persistence, and hosting live behind an account.
const MeSignupPrompt = ({ onSignup, onLogin, onTab }) => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
    <StatusBar />
    <div style={{ padding: '4px 24px 8px', display: 'flex', alignItems: 'center' }}>
      <SparkLogo size={22} />
    </div>
    <div style={{ flex: 1, overflow: 'auto', padding: '8px 24px 100px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginTop: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 22px rgba(255,95,78,0.24)' }}>
          <Icon name="bookmark-fill" size={24} color="#14213D" />
        </div>
        <h1 style={{ fontFamily: 'Montserrat', fontSize: 30, fontWeight: 900, letterSpacing: '-0.01em', lineHeight: 1.04, margin: '20px 0 0', color: '#fff' }}>Make Sparked yours</h1>
        <p style={{ fontSize: 14, color: 'rgba(238,240,255,0.60)', lineHeight: 1.5, margin: '10px 0 0', maxWidth: 300 }}>
          Browsing is always free. An account just lets you keep what you find — and run your own nights out.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 24 }}>
        {ME_UNLOCKS.map(u => (
          <div key={u.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 13, padding: '12px 0' }}>
            <div style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 11, background: 'rgba(252,163,17,0.10)', border: '1px solid rgba(252,163,17,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={u.icon} size={17} color="#FCA311" />
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
              <div style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 15, letterSpacing: '-0.01em', color: '#fff' }}>{u.title}</div>
              <div style={{ fontSize: 12.5, color: 'rgba(238,240,255,0.50)', marginTop: 2, lineHeight: 1.4 }}>{u.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 26, display: 'flex', flexDirection: 'column', gap: 11 }}>
        <button onClick={onSignup} style={{
          width: '100%', backgroundImage: 'linear-gradient(135deg,#ff5f4e 0%,#ff8c38 50%,#ffca3a 100%)', border: 'none',
          color: '#14213D', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 16, letterSpacing: '-0.01em',
          padding: '16px 20px', borderRadius: 16, cursor: 'pointer', boxShadow: '0 12px 30px -8px rgba(255,95,78,0.55)',
        }}>Create free account</button>
        <button onClick={onLogin} style={{
          width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
          color: '#fff', fontFamily: 'Montserrat', fontWeight: 800, fontSize: 14, padding: '14px 20px', borderRadius: 16, cursor: 'pointer',
        }}>Log in</button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 4, fontSize: 11.5, color: 'rgba(238,240,255,0.42)' }}>
          <Icon name="search" size={12} color="rgba(238,240,255,0.42)" />
          Keep browsing Explore without an account.
        </div>
      </div>
    </div>
    <TabBar active="profile" onChange={(t) => onTab && onTab(t)} />
  </div>
);

const MeScreen = ({ onOpenSaved, onOpenWorkspace, onCreateFirst, onSettings, onTab, signedIn = true, onSignup, onLogin, workspaces = WORKSPACES }) => {
  if (!signedIn) return <MeSignupPrompt onSignup={onSignup} onLogin={onLogin} onTab={onTab} />;
  return (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
    <StatusBar />
    <div style={{ padding: '4px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <SparkLogo size={22} />
      <button onClick={onSettings} aria-label="Settings" style={{
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 12, padding: 10, cursor: 'pointer',
      }}>
        <Icon name="gear" size={16} color="#fff" />
      </button>
    </div>

    <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 100px' }}>
      {/* Profile header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28, minWidth: 0 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 9999, flexShrink: 0,
          background: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#14213D', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 24, letterSpacing: '-0.01em',
          boxShadow: '0 6px 22px rgba(255,95,78,0.24)',
        }}>JC</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Montserrat', fontWeight: 900, color: '#fff', fontSize: 20, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Jordan Chen</div>
          <div style={{ fontSize: 12, color: 'rgba(238,240,255,0.55)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Phoenix, AZ · Member since 2026</div>
        </div>
      </div>

      {/* Saved card */}
      <button onClick={onOpenSaved} style={{
        all: 'unset', boxSizing: 'border-box', display: 'block', width: '100%', cursor: 'pointer',
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 22, padding: 18, marginBottom: 30,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(252,163,17,0.10)', border: '1px solid rgba(252,163,17,0.25)',
            color: '#FCA311', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon name="bookmark-fill" size={18} color="#FCA311" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Montserrat', fontWeight: 900, color: '#fff', fontSize: 16, letterSpacing: '-0.01em' }}>Saved</div>
            <div style={{ fontSize: 12, color: 'rgba(238,240,255,0.55)', marginTop: 2 }}>2 events · 1 happening this week</div>
          </div>
          <Icon name="chev-right" size={16} color="rgba(238,240,255,0.45)" />
        </div>
        {/* Mini thumbnail strip of saved events */}
        <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
          {SAMPLE_EVENTS.filter(e => e.saved).slice(0, 3).map(e => (
            <div key={e.id} style={{ flex: 1, height: 38, borderRadius: 8, background: e.gradient }}></div>
          ))}
        </div>
      </button>

      {/* Workspace slot — two states. NON-HOST (no workspace): a dashed
          invitation that drops straight into event creation (workspace is
          spun up silently behind the scenes). HOST (≥1 workspace): the solid
          stats card that opens the Workspace (or the picker, at 2+). */}
      {(workspaces && workspaces.length > 0) ? (
      <button onClick={onOpenWorkspace} style={{
        all: 'unset', boxSizing: 'border-box', display: 'block', width: '100%', cursor: 'pointer',
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 22, padding: 18,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(255,99,72,0.10)', border: '1px solid rgba(255,99,72,0.25)',
            color: '#ff6348', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon name="sparkles" size={18} color="#ff6348" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Montserrat', fontWeight: 900, color: '#fff', fontSize: 16, letterSpacing: '-0.01em' }}>Workspace</div>
            <div style={{ fontSize: 12, color: 'rgba(238,240,255,0.55)', marginTop: 2 }}>{_wsStatLine(workspaces[0])}</div>
          </div>
          <Icon name="chev-right" size={16} color="rgba(238,240,255,0.45)" />
        </div>
        <div style={{ marginTop: 12, fontSize: 11.5, color: 'rgba(238,240,255,0.45)', lineHeight: 1.5 }}>
          Create + manage your events. Backstage preview inside.
        </div>
      </button>
      ) : (
      <button onClick={onCreateFirst} style={{
        all: 'unset', boxSizing: 'border-box', display: 'block', width: '100%', cursor: 'pointer',
        background: 'rgba(255,140,56,0.04)', border: '1.5px dashed rgba(255,140,56,0.50)',
        borderRadius: 22, padding: '22px 18px', textAlign: 'center',
      }}>
        <div style={{
          fontFamily: 'Montserrat', fontWeight: 900, fontSize: 17, letterSpacing: '-0.01em',
          backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
          WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent',
        }}>+ Create your first event</div>
        <div style={{ fontSize: 12.5, color: 'rgba(238,240,255,0.55)', marginTop: 7, lineHeight: 1.45, maxWidth: 260, marginLeft: 'auto', marginRight: 'auto' }}>
          Host your own events and reach people nearby.
        </div>
      </button>
      )}
    </div>

    <TabBar active="profile" onChange={(t) => onTab && onTab(t)} />
  </div>
  );
};

// =============================================================
// SAVED SCREEN — events the user has bookmarked.
// =============================================================
const SavedScreen = ({ onBack, onSelect, onTab }) => {
  const savedEvents = SAMPLE_EVENTS.filter(e => e.saved);

  // Group saved events by WHEN they happen — the ticket-stub language read as a
  // timeline. Tonight = today; This Weekend = the coming Sat/Sun; Coming Up =
  // everything later. A section renders only when it holds events.
  const _now = new Date();
  const _dow = _now.getDay();                  // 0 Sun … 6 Sat
  const _satOffset = (6 - _dow + 7) % 7;       // days until the coming Saturday (0 if today)
  const _satStart = new Date(_now); _satStart.setDate(_now.getDate() + _satOffset); _satStart.setHours(0, 0, 0, 0);
  const _sunEnd = new Date(_satStart); _sunEnd.setDate(_satStart.getDate() + 1); _sunEnd.setHours(23, 59, 59, 999);
  const _sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const _bucketOf = (e) => {
    if (!e.startISO) return 'coming';
    const s = new Date(e.startISO);
    if (_sameDay(s, _now)) return 'tonight';
    const t = s.getTime();
    if (t >= _satStart.getTime() && t <= _sunEnd.getTime()) return 'weekend';
    return 'coming';
  };
  const _groups = { tonight: [], weekend: [], coming: [] };
  savedEvents.forEach(e => _groups[_bucketOf(e)].push(e));
  const sections = [
    { key: 'tonight', label: 'Tonight', items: _groups.tonight },
    { key: 'weekend', label: 'This Weekend', items: _groups.weekend },
    { key: 'coming', label: 'Coming Up', items: _groups.coming },
  ].filter(s => s.items.length);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      <StatusBar />
      <div style={{ padding: '4px 24px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} aria-label="Back" style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)',
          color: '#fff', width: 36, height: 36, borderRadius: 10, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <Eyebrow>Me · Saved</Eyebrow>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 100px' }}>
        <h1 style={{ fontFamily: 'Montserrat', fontSize: 28, fontWeight: 900, letterSpacing: '-0.01em', lineHeight: 1.05, margin: '0 0 6px', color: '#fff' }}>Saved</h1>
        <p style={{ fontSize: 13, color: 'rgba(238,240,255,0.55)', margin: '0 0 22px' }}>
          {savedEvents.length === 0
            ? "Bookmark events from the feed to see them here."
            : `${savedEvents.length} ${savedEvents.length === 1 ? 'event' : 'events'}, sorted by when they happen.`}
        </p>

        {savedEvents.length === 0 ? (
          <div style={{
            border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 18,
            padding: '28px 18px', textAlign: 'center',
          }}>
            <Icon name="bookmark" size={22} color="rgba(238,240,255,0.35)" />
            <div style={{ fontSize: 12, color: 'rgba(238,240,255,0.45)', marginTop: 10, lineHeight: 1.5 }}>
              Tap the bookmark icon on any event to save it.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
            {sections.map(sec => (
              <div key={sec.key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 13px' }}>
                  <span style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 13, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#FCA311', whiteSpace: 'nowrap' }}>{sec.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(238,240,255,0.40)' }}>{sec.items.length}</span>
                  <span style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(252,163,17,0.25), transparent)' }}></span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {sec.items.map(e => <EventStub variant="compact" key={e.id} event={e} onTap={() => onSelect(e)} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TabBar active="profile" onChange={(t) => onTab && onTab(t)} />
    </div>
  );
};

// =============================================================
// BACKSTAGE DEMO - new feature release framing.
// Positioned as "we're shipping more event-running tools" with
// vendor maps + AR navigation. KPI capture via the two checkboxes.
// =============================================================
const BackstageDemo = () => {
  const [open, setOpen] = React.useState(false);
  const [interested, setInterested] = React.useState(false);
  const [beta, setBeta] = React.useState(false);
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 22, overflow: 'hidden', marginTop: 22,
    }}>
      <button onClick={() => setOpen(!open)} style={{
        all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', padding: '16px 18px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(255,99,72,0.10)', border: '1px solid rgba(255,99,72,0.25)',
          color: '#ff6348', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon name="sparkles" size={15} color="#ff6348" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'Montserrat', fontWeight: 900, color: '#fff', fontSize: 14, letterSpacing: '-0.01em' }}>Backstage</span>
            <span style={{
              fontSize: 8.5, fontWeight: 900, letterSpacing: '0.20em', textTransform: 'uppercase',
              color: '#FCA311', background: 'rgba(252,163,17,0.10)',
              border: '1px solid rgba(252,163,17,0.30)', padding: '2px 7px', borderRadius: 9999,
            }}>Coming soon</span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(238,240,255,0.55)', marginTop: 2 }}>New event tools - vendor maps + AR navigation</div>
        </div>
        <Icon name="chev-right" size={14} color="rgba(238,240,255,0.45)" />
      </button>

      {open && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: 12, color: 'rgba(238,240,255,0.70)', lineHeight: 1.6, margin: '14px 0 14px' }}>
            We&apos;re building more ways to make every event easier to navigate. Vendors maintain their own profiles, drop a pin on the site map, and your attendees can follow an AR arrow straight to the booth they want.
          </p>

          {/* Feature highlights - replaces the old role pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
            {['Vendor profiles', 'AR booth navigation', 'Live booth updates'].map(f => (
              <span key={f} style={{
                fontSize: 8.5, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'rgba(238,240,255,0.75)', background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.10)', padding: '4px 9px', borderRadius: 9999,
              }}>{f}</span>
            ))}
          </div>

          {/* KPI capture */}
          <div style={{ fontSize: 9.5, fontWeight: 900, letterSpacing: '0.20em', textTransform: 'uppercase', color: '#FCA311', marginBottom: 10 }}>Help shape it</div>
          <BackstageCheckbox checked={interested} onChange={setInterested} label="I'm interested in Backstage" sub="Track demand and waitlist position" />
          <BackstageCheckbox checked={beta} onChange={setBeta} label="I'd like to beta test" sub="Pilot Backstage with your next event" />
        </div>
      )}
    </div>
  );
};

const BackstageCheckbox = ({ checked, onChange, label, sub }) => (
  <button onClick={() => onChange(!checked)} style={{
    all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12,
    padding: '10px 0', width: '100%',
  }}>
    <div style={{
      width: 22, height: 22, borderRadius: 7, flexShrink: 0,
      background: checked ? 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${checked ? 'transparent' : 'rgba(255,255,255,0.20)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
    }}>
      {checked && <Icon name="check" size={14} color="#14213D" />}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff' }}>{label}</div>
      <div style={{ fontSize: 11, color: 'rgba(238,240,255,0.50)', marginTop: 2 }}>{sub}</div>
    </div>
  </button>
);
const WorkspaceScreen = ({ onBack, onCreate, onEditProfile, onViewProfile, onSelectEvent, onTab, desktop }) => {
  const stats = [
    { label: 'Live now', value: '2', color: '#ff6348' },
    { label: 'This week', value: '4', color: '#FCA311' },
    { label: 'Total RSVPs', value: '146', color: '#F7B731' },
    { label: 'Reach', value: '2.1k', color: '#FCA311' },
  ];

  if (desktop) {
    return (
      <div style={{ minHeight: '100%', boxSizing: 'border-box', background: 'var(--app-bg)', color: 'var(--app-text)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '40px 40px 80px' }}>
          {/* Header row: back + title/subtitle, profile actions, Create Event */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
            <button onClick={onBack} aria-label="Back" style={{
              all: 'unset', cursor: 'pointer', width: 38, height: 38, borderRadius: 12,
              background: 'var(--app-icon-chip-bg)', border: '1px solid var(--app-card-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontFamily: 'Montserrat', fontSize: 26, fontWeight: 900, letterSpacing: '-0.01em', margin: 0, color: 'var(--app-text)' }}>Your Workspace</h1>
              <p style={{ fontSize: 12.5, color: 'var(--app-text-muted)', margin: '4px 0 0' }}>Create, manage, and track every event you run.</p>
            </div>
            <button onClick={onEditProfile} style={{
              all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '11px 18px', borderRadius: 12, background: 'var(--app-icon-chip-bg)', border: '1px solid var(--app-card-border)',
              color: 'var(--app-text)', fontWeight: 700, fontSize: 13, flexShrink: 0,
            }}>
              <Icon name="edit" size={14} color="#FCA311" />
              Edit profile
            </button>
            <button onClick={onViewProfile} style={{
              all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '11px 18px', borderRadius: 12, background: 'var(--app-icon-chip-bg)', border: '1px solid var(--app-card-border)',
              color: 'var(--app-text)', fontWeight: 700, fontSize: 13, flexShrink: 0,
            }}>
              <Icon name="user" size={14} color="#FCA311" />
              View profile
            </button>
            <button onClick={onCreate} style={{
              all: 'unset', cursor: 'pointer', boxSizing: 'border-box', flexShrink: 0,
              backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
              color: '#14213D', fontWeight: 900, fontSize: 13.5,
              padding: '13px 20px', borderRadius: 12,
              boxShadow: '0 6px 22px rgba(255,95,78,0.24)',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              <Icon name="plus" size={16} color="#14213D" />
              Create Event
            </button>
          </div>

          {/* Stats — 4-across */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
            {stats.map(s => (
              <div key={s.label} style={{ background: 'var(--app-card-bg)', border: '1px solid var(--app-card-border)', borderRadius: 18, padding: 20 }}>
                <div style={{ fontFamily: 'Montserrat', fontSize: 32, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 10.5, fontWeight: 900, color: 'var(--app-text-muted)', textTransform: 'uppercase', letterSpacing: '0.18em', marginTop: 8 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Your Listings — table */}
          <Eyebrow>Your Listings</Eyebrow>
          <div style={{ marginTop: 12, borderRadius: 18, border: '1px solid var(--app-card-border)', background: 'var(--app-card-bg)', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 0.8fr 0.8fr 1fr', gap: 12, padding: '12px 18px', borderBottom: '1px solid var(--app-divider)' }}>
              {['Event', 'Date', 'Tier', 'RSVPs', 'Status'].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--app-text-faint)' }}>{h}</div>
              ))}
            </div>
            {ORGANIZER_LISTINGS.map(e => (
              <div key={e.id} onClick={() => onSelectEvent && onSelectEvent(e)} style={{
                display: 'grid', gridTemplateColumns: '1.8fr 1fr 0.8fr 0.8fr 1fr', gap: 12, padding: '14px 18px',
                alignItems: 'center', cursor: 'pointer', borderBottom: '1px solid var(--app-divider)',
                opacity: e.past ? 0.65 : 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: e.gradient, flexShrink: 0 }}></div>
                  <span style={{ fontFamily: 'Montserrat', fontWeight: 800, color: 'var(--app-text)', fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</span>
                  {e.live && <LiveDot />}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--app-text-muted)' }}>{e.date}</div>
                <div style={{ fontSize: 12.5, color: 'var(--app-text-muted)' }}>{e.tier}</div>
                <div style={{ fontSize: 12.5, color: 'var(--app-text-muted)' }}>{typeof e.rsvps === 'number' ? e.rsvps : '—'}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: e.past ? 'var(--app-text-faint)' : e.live ? '#ff6348' : 'var(--app-green)' }}>
                  {e.past ? 'Past' : e.live ? 'Live' : 'Upcoming'}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 32 }}>
            <BackstageDemo />
          </div>
        </div>
      </div>
    );
  }

  return (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
    <StatusBar />
    <div style={{ padding: '4px 24px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <button onClick={onBack} aria-label="Back" style={{
        background: 'var(--app-icon-chip-bg)', border: '1px solid var(--app-card-border)',
        color: 'var(--app-text)', width: 36, height: 36, borderRadius: 10, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      </button>
      <Eyebrow>Me · Workspace</Eyebrow>
    </div>
    <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 100px' }}>
      <h1 style={{ fontFamily: 'Montserrat', fontSize: 28, fontWeight: 900, letterSpacing: '-0.01em', lineHeight: 1.05, margin: '0 0 6px', color: 'var(--app-text)' }}>
        Your Workspace
      </h1>
      <p style={{ fontSize: 13, color: 'var(--app-text-muted)', margin: '0 0 18px', lineHeight: 1.5 }}>
        Create, manage, and track every event you run.
      </p>

      {/* Primary action - the Create Event CTA that used to live in the tab bar */}
      <button onClick={onCreate} style={{
        all: 'unset', cursor: 'pointer', boxSizing: 'border-box', width: '100%',
        backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
        color: '#14213D', fontWeight: 900, fontSize: 14,
        padding: '14px 18px', borderRadius: 14,
        boxShadow: '0 6px 22px rgba(255,95,78,0.24)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        marginBottom: 22,
      }}>
        <Icon name="plus" size={16} color="#14213D" />
        <span>Create Event</span>
      </button>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'var(--app-card-bg)', border: '1px solid var(--app-card-border)', borderRadius: 18, padding: 16 }}>
            <div style={{ fontFamily: 'Montserrat', fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--app-text-muted)', textTransform: 'uppercase', letterSpacing: '0.18em', marginTop: 6 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Public profile section — edit the fields shown on the public
          Organizer Profile, or jump straight to viewing it. */}
      <Eyebrow>Public Profile</Eyebrow>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12, marginBottom: 22 }}>
        <button onClick={onEditProfile} style={{
          all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%',
          display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
          background: 'var(--app-card-bg)', border: '1px solid var(--app-card-border)', borderRadius: 16,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: 'var(--app-icon-chip-bg)', border: '1px solid var(--app-card-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="edit" size={14} color="#FCA311" />
          </div>
          <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: 'var(--app-text)' }}>Edit public profile</span>
          <Icon name="chev-right" size={15} color="var(--app-text-faint)" />
        </button>
        <button onClick={onViewProfile} style={{
          all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%',
          display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
          background: 'var(--app-card-bg)', border: '1px solid var(--app-card-border)', borderRadius: 16,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: 'var(--app-icon-chip-bg)', border: '1px solid var(--app-card-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="user" size={15} color="#FCA311" />
          </div>
          <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: 'var(--app-text)' }}>View public profile</span>
          <Icon name="chev-right" size={15} color="var(--app-text-faint)" />
        </button>
      </div>

      <Eyebrow>Your Listings</Eyebrow>
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ORGANIZER_LISTINGS.map(e => (
          <div key={e.id} style={{
            display: 'flex', gap: 14, padding: 12, alignItems: 'center', minWidth: 0,
            background: 'var(--app-card-bg)', border: '1px solid var(--app-card-border)', borderRadius: 18,
            opacity: e.past ? 0.78 : 1,
          }}>
            <div style={{ width: 60, height: 60, borderRadius: 14, background: e.gradient, flexShrink: 0, position: 'relative' }}>
              {e.past && (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 14,
                  background: 'rgba(20,33,61,0.55)', backdropFilter: 'blur(2px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="lock" size={18} color="#fff" />
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Montserrat', fontWeight: 900, color: 'var(--app-text)', fontSize: 14, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</div>
              <div style={{ fontSize: 11, color: 'var(--app-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {e.date} · {e.tier}
                {typeof e.rsvps === 'number' && <span> · {e.rsvps} RSVPs</span>}
              </div>
              {e.past && (
                <div style={{ fontSize: 10, color: 'rgba(255,99,72,0.85)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="lock" size={10} color="rgba(255,99,72,0.85)" />
                  <span>Locked · event has passed</span>
                </div>
              )}
            </div>
            {e.live && <LiveDot />}
          </div>
        ))}
      </div>

      {/* Backstage demo - KPI capture for the future enterprise tier */}
      <BackstageDemo />
    </div>
    <TabBar active="profile" onChange={(t) => onTab && onTab(t)} />
  </div>
  );
};

// =============================================================
// WORKSPACE PICKER — shown only when a host belongs to 2+ workspaces.
// One row per workspace (logo · name · stats) + a Create button. With one
// workspace seeded this stays dormant: Workspace opens straight in.
// =============================================================
const WorkspacePickerScreen = ({ workspaces = WORKSPACES, onPick, onCreate, onBack, onTab }) => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
    <StatusBar />
    <div style={{ padding: '4px 24px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <button onClick={onBack} aria-label="Back" style={{
        background: 'var(--app-icon-chip-bg)', border: '1px solid var(--app-card-border)',
        color: 'var(--app-text)', width: 36, height: 36, borderRadius: 10, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      </button>
      <Eyebrow>Me · Workspaces</Eyebrow>
    </div>
    <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 100px' }}>
      <h1 style={{ fontFamily: 'Montserrat', fontSize: 28, fontWeight: 900, letterSpacing: '-0.01em', lineHeight: 1.05, margin: '0 0 6px', color: 'var(--app-text)' }}>
        Your Workspaces
      </h1>
      <p style={{ fontSize: 13, color: 'var(--app-text-muted)', margin: '0 0 20px', lineHeight: 1.5 }}>
        Pick a workspace to manage.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {workspaces.map(ws => (
          <button key={ws.id} onClick={() => onPick(ws)} style={{
            all: 'unset', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 14, width: '100%', cursor: 'pointer',
            background: 'var(--app-card-bg)', border: '1px solid var(--app-card-border)',
            borderRadius: 18, padding: 16,
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: 13, flexShrink: 0,
              backgroundImage: ws.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Montserrat', fontWeight: 900, fontSize: 16, color: '#14213D', letterSpacing: '-0.02em',
            }}>{ws.initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Montserrat', fontWeight: 900, color: 'var(--app-text)', fontSize: 15, letterSpacing: '-0.01em' }}>{ws.name}</div>
              <div style={{ fontSize: 12, color: 'var(--app-text-muted)', marginTop: 2 }}>{_wsStatLine(ws)}</div>
            </div>
            <Icon name="chev-right" size={16} color="var(--app-text-faint)" />
          </button>
        ))}

        <button onClick={onCreate} style={{
          all: 'unset', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', cursor: 'pointer',
          background: 'rgba(255,140,56,0.04)', border: '1.5px dashed rgba(255,140,56,0.50)',
          borderRadius: 18, padding: '16px 18px', marginTop: 2,
        }}>
          <span style={{
            fontFamily: 'Montserrat', fontWeight: 900, fontSize: 14.5, letterSpacing: '-0.01em',
            backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent',
          }}>+ Create a workspace</span>
        </button>
      </div>
    </div>
    <TabBar active="profile" onChange={(t) => onTab && onTab(t)} />
  </div>
);

// =============================================================
// ORGANIZER PROFILE — public, workspace-owned profile page. Viewable by
// guests (anonymous-browse applies, no account needed). Consumer-facing
// only: no tier badges, publish fees, or host economics anywhere here.
// =============================================================
const OrganizerProfileScreen = ({ workspace = WORKSPACES[0], onBack, onSelect, onTab, desktop }) => {
  const [pastOpen, setPastOpen] = React.useState(false);
  const upcoming = SAMPLE_EVENTS
    .filter(e => (workspace.eventIds || []).includes(e.id))
    .slice()
    .sort((a, b) => new Date(a.startISO) - new Date(b.startISO));
  const past = workspace.pastEvents || [];
  const links = [
    workspace.website && { key: 'website', label: workspace.website },
    workspace.socials?.instagram && { key: 'instagram', label: workspace.socials.instagram },
    workspace.socials?.twitter && { key: 'twitter', label: workspace.socials.twitter },
    workspace.socials?.facebook && { key: 'facebook', label: workspace.socials.facebook },
  ].filter(Boolean);

  if (desktop) {
    return (
      <div style={{ minHeight: '100%', boxSizing: 'border-box', background: 'var(--app-bg)', color: 'var(--app-text)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 40px 80px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            <button onClick={onBack} aria-label="Back" style={{
              all: 'unset', cursor: 'pointer', width: 38, height: 38, borderRadius: 12,
              background: 'var(--app-card-bg)', border: '1px solid var(--app-card-border)',
              color: 'var(--app-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <Eyebrow>Organizer Profile</Eyebrow>
          </div>

          {/* Header row: logo left, name/bio/links right. */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 22, marginBottom: 30 }}>
            <div style={{
              width: 84, height: 84, borderRadius: 9999, flexShrink: 0,
              backgroundImage: workspace.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Montserrat', fontWeight: 900, fontSize: 28, color: '#14213D', letterSpacing: '-0.02em',
              boxShadow: '0 6px 22px rgba(255,95,78,0.24)',
            }}>{workspace.initials}</div>
            <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
              <h1 style={{ fontFamily: 'Montserrat', fontSize: 26, fontWeight: 900, letterSpacing: '-0.01em', lineHeight: 1.08, margin: '0 0 8px', color: 'var(--app-text)' }}>{workspace.name}</h1>
              {workspace.bio && <p style={{ fontSize: 13.5, color: 'var(--app-text-muted)', lineHeight: 1.55, margin: '0 0 10px' }}>{workspace.bio}</p>}
              {workspace.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                  <Icon name="pin" size={13} color="#FCA311" />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--app-text-muted)' }}>{workspace.location}</span>
                </div>
              )}
              {links.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {links.map(l => (
                    <a key={l.key} href="#" onClick={(e) => e.preventDefault()} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7, textDecoration: 'none',
                      padding: '8px 14px', borderRadius: 9999,
                      border: '1px solid var(--app-border-strong)', background: 'transparent',
                    }}>
                      <Icon name="globe" size={13} color="var(--app-text-muted)" />
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--app-text)' }}>{l.label}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 14px' }}>
            <span style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 13, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#FCA311', whiteSpace: 'nowrap' }}>Upcoming Events</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--app-text-faint)' }}>{upcoming.length}</span>
            <span style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(252,163,17,0.25), transparent)' }}></span>
          </div>
          {upcoming.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 30 }}>
              {upcoming.map(e => <EventStub variant="compact" key={e.id} event={e} onTap={() => onSelect && onSelect(e)} />)}
            </div>
          ) : (
            <div style={{ border: '1px dashed var(--app-card-border)', borderRadius: 18, padding: '22px 18px', textAlign: 'center', marginBottom: 30 }}>
              <div style={{ fontSize: 12, color: 'var(--app-text-faint)', lineHeight: 1.5 }}>No upcoming events right now — check back soon.</div>
            </div>
          )}

          {/* Past events — collapsed by default, count on the header. */}
          <div style={{ borderRadius: 18, border: '1px solid var(--app-card-border)', background: 'var(--app-card-bg)', overflow: 'hidden' }}>
            <button onClick={() => setPastOpen(o => !o)} style={{
              all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%',
              display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
            }}>
              <span style={{ flex: 1, fontFamily: 'Montserrat', fontWeight: 900, fontSize: 13, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--app-text)' }}>Past Events</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--app-text-faint)' }}>{past.length}</span>
              <span style={{ transform: pastOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s ease', display: 'flex' }}>
                <Icon name="chev-right" size={15} color="var(--app-text-faint)" />
              </span>
            </button>
            {pastOpen && (
              <div style={{ padding: '0 16px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {past.length > 0 ? past.map(e => <EventStub variant="compact" key={e.id} event={e} onTap={() => onSelect && onSelect(e)} />) : (
                  <div style={{ fontSize: 12, color: 'var(--app-text-faint)' }}>No past events yet.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      <StatusBar />
      <div style={{ padding: '4px 24px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} aria-label="Back" style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)',
          color: '#fff', width: 36, height: 36, borderRadius: 10, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <Eyebrow>Organizer Profile</Eyebrow>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 100px' }}>
        {/* Header: avatar, name, bio, location — no tier / stats language. */}
        <div style={{
          width: 72, height: 72, borderRadius: 9999, flexShrink: 0,
          backgroundImage: workspace.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Montserrat', fontWeight: 900, fontSize: 24, color: '#14213D', letterSpacing: '-0.02em',
          boxShadow: '0 6px 22px rgba(255,95,78,0.24)', marginBottom: 16,
        }}>{workspace.initials}</div>
        <h1 style={{ fontFamily: 'Montserrat', fontSize: 26, fontWeight: 900, letterSpacing: '-0.01em', lineHeight: 1.08, margin: '0 0 8px', color: '#fff' }}>{workspace.name}</h1>
        {workspace.bio && <p style={{ fontSize: 13.5, color: 'rgba(238,240,255,0.65)', lineHeight: 1.55, margin: '0 0 10px' }}>{workspace.bio}</p>}
        {workspace.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 18 }}>
            <Icon name="pin" size={13} color="#FCA311" />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(238,240,255,0.55)' }}>{workspace.location}</span>
          </div>
        )}

        {/* Link row — outbound links, so secondary/outline style, never the
            primary gradient treatment used for in-app actions. */}
        {links.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
            {links.map(l => (
              <a key={l.key} href="#" onClick={(e) => e.preventDefault()} style={{
                display: 'inline-flex', alignItems: 'center', gap: 7, textDecoration: 'none',
                padding: '8px 14px', borderRadius: 9999,
                border: '1px solid rgba(255,255,255,0.18)', background: 'transparent',
              }}>
                <Icon name="globe" size={13} color="rgba(238,240,255,0.70)" />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(238,240,255,0.80)' }}>{l.label}</span>
              </a>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 13px' }}>
          <span style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 13, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#FCA311', whiteSpace: 'nowrap' }}>Upcoming Events</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(238,240,255,0.40)' }}>{upcoming.length}</span>
          <span style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(252,163,17,0.25), transparent)' }}></span>
        </div>
        {upcoming.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 30 }}>
            {upcoming.map(e => <EventStub variant="compact" key={e.id} event={e} onTap={() => onSelect && onSelect(e)} />)}
          </div>
        ) : (
          <div style={{ border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 18, padding: '22px 18px', textAlign: 'center', marginBottom: 30 }}>
            <div style={{ fontSize: 12, color: 'rgba(238,240,255,0.45)', lineHeight: 1.5 }}>No upcoming events right now — check back soon.</div>
          </div>
        )}

        {/* Past events — collapsed by default, count on the header. */}
        <div style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
          <button onClick={() => setPastOpen(o => !o)} style={{
            all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%',
            display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
          }}>
            <span style={{ flex: 1, fontFamily: 'Montserrat', fontWeight: 900, fontSize: 13, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#fff' }}>Past Events</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(238,240,255,0.40)' }}>{past.length}</span>
            <span style={{ transform: pastOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s ease', display: 'flex' }}>
              <Icon name="chev-right" size={15} color="rgba(238,240,255,0.45)" />
            </span>
          </button>
          {pastOpen && (
            <div style={{ padding: '0 16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {past.length > 0 ? past.map(e => <EventStub variant="compact" key={e.id} event={e} onTap={() => onSelect && onSelect(e)} />) : (
                <div style={{ fontSize: 12, color: 'rgba(238,240,255,0.45)' }}>No past events yet.</div>
              )}
            </div>
          )}
        </div>
      </div>

      <TabBar active="profile" onChange={(t) => onTab && onTab(t)} />
    </div>
  );
};

// =============================================================
// EDIT PUBLIC PROFILE — Workspace-housed editor for the fields that render
// on the public Organizer Profile: logo, name, bio, website, socials.
// Every field patches workspace state directly, so changes are live the
// moment the public profile is (re)opened. Nothing here touches the
// personal Edit Profile, events, or pricing.
// =============================================================
const EditOrganizerProfileScreen = ({ workspace = WORKSPACES[0], onBack, onChange, onPreview, onTab }) => {
  const setField = (key, val) => onChange({ [key]: val });
  const setSocial = (key, val) => onChange((w) => ({ socials: { ...(w.socials || {}), [key]: val } }));

  const label = { display: 'block', fontSize: 10, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(238,240,255,0.45)', marginBottom: 8 };
  const input = { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '12px 14px', color: '#eef0ff', fontFamily: 'Inter', fontSize: 14, fontWeight: 600, outline: 'none' };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      <StatusBar />
      <div style={{ padding: '4px 24px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} aria-label="Back" style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)',
          color: '#fff', width: 36, height: 36, borderRadius: 10, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <Eyebrow>Workspace · Public Profile</Eyebrow>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 40px' }}>
        <h1 style={{ fontFamily: 'Montserrat', fontSize: 26, fontWeight: 900, letterSpacing: '-0.01em', margin: '0 0 6px', color: '#fff' }}>Edit Public Profile</h1>
        <p style={{ fontSize: 12.5, color: 'rgba(238,240,255,0.55)', lineHeight: 1.5, margin: '0 0 4px' }}>Your organizer page — what the public sees.</p>
        <p style={{ fontSize: 12.5, color: 'rgba(238,240,255,0.55)', lineHeight: 1.5, margin: '0 0 22px' }}>Changes here update your public Organizer Profile immediately.</p>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 26 }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 88, height: 88, borderRadius: 9999,
              backgroundImage: workspace.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#14213D', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 30,
            }}>{workspace.initials}</div>
            <button aria-label="Change logo" style={{
              all: 'unset', boxSizing: 'border-box', cursor: 'pointer',
              position: 'absolute', bottom: 0, right: 0,
              width: 30, height: 30, borderRadius: 9999, background: '#14213D',
              border: '2px solid #14213D', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: '100%', height: '100%', borderRadius: 9999, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="image" size={14} color="#FCA311" />
              </div>
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <span style={label}>Workspace name</span>
          <input style={input} value={workspace.name || ''} onChange={(e) => setField('name', e.target.value)} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <span style={label}>Bio</span>
          <textarea style={{ ...input, resize: 'none', lineHeight: 1.5 }} rows={3} value={workspace.bio || ''} onChange={(e) => setField('bio', e.target.value)}></textarea>
        </div>
        <div style={{ marginBottom: 22 }}>
          <span style={label}>Website</span>
          <input style={input} placeholder="yoursite.com" value={workspace.website || ''} onChange={(e) => setField('website', e.target.value)} />
        </div>

        <span style={label}>Social links</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          <input style={input} placeholder="Instagram" value={workspace.socials?.instagram || ''} onChange={(e) => setSocial('instagram', e.target.value)} />
          <input style={input} placeholder="Twitter / X" value={workspace.socials?.twitter || ''} onChange={(e) => setSocial('twitter', e.target.value)} />
          <input style={input} placeholder="Facebook" value={workspace.socials?.facebook || ''} onChange={(e) => setSocial('facebook', e.target.value)} />
        </div>

        <button onClick={onPreview} style={{
          all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '13px 18px', borderRadius: 14,
          border: '1px solid rgba(252,163,17,0.40)', background: 'rgba(252,163,17,0.08)',
        }}>
          <Icon name="user" size={14} color="#FCA311" />
          <span style={{ fontSize: 13.5, fontWeight: 800, color: '#FCA311' }}>Preview public profile</span>
        </button>
      </div>

      <TabBar active="profile" onChange={(t) => onTab && onTab(t)} />
    </div>
  );
};

Object.assign(window, {
  LandingScreen, ExploreScreen, EventDetailScreen, WorkspaceScreen, WorkspacePickerScreen,
  MeScreen, SavedScreen, BackstageDemo, WORKSPACES, OrganizerProfileScreen, EditOrganizerProfileScreen,
  // Exposed for the demo walkthrough so it can pin Explore to a specific view.
  SAMPLE_EVENTS, INTERESTS, VIEW_LABELS, ViewSwitcher, MapView, TimeView,
  DateRangeBar, DateInputPill, todayLocalYMD,
});

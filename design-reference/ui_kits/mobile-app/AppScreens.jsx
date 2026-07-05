// Sparked — additional app screens for the full clickable prototype.
// Auth, Search, Create Event, Settings, and an RSVP confirmation.
// Expects React + Components.jsx + Screens.jsx symbols in scope (via window).

// ---- Small form primitives -------------------------------------------------

const Field = ({ label, hint, children }) =>
<label style={{ display: 'block', marginBottom: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
      <Eyebrow>{label}</Eyebrow>
      {hint && <span style={{ fontSize: 10, color: 'var(--app-text-hint, rgba(238,240,255,0.40))', fontWeight: 700 }}>{hint}</span>}
    </div>
    {children}
  </label>;


const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: 'var(--app-icon-chip-bg, rgba(255,255,255,0.04))', border: '1px solid var(--app-card-border, rgba(255,255,255,0.12))',
  borderRadius: 14, padding: '14px 16px',
  color: 'var(--app-text, #eef0ff)', fontFamily: 'Inter', fontSize: 14, fontWeight: 600,
  outline: 'none'
};

const TextField = ({ value, onChange, placeholder, type = 'text', icon }) =>
<div style={{ position: 'relative' }}>
    {icon &&
  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
        <Icon name={icon} size={16} color="var(--app-text-muted, rgba(238,240,255,0.45))" />
      </span>
  }
    <input
    type={type}
    value={value}
    placeholder={placeholder}
    onChange={(e) => onChange && onChange(e.target.value)}
    style={{ ...inputStyle, paddingLeft: icon ? 42 : 16 }} />
  
  </div>;


// Sub-screen header with a back chevron + eyebrow crumb.
const SubHeader = ({ crumb, onBack, right }) =>
<div style={{ padding: '4px 24px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
    <button onClick={onBack} aria-label="Back" style={{
    background: 'var(--app-icon-chip-bg, rgba(255,255,255,0.05))', border: '1px solid var(--app-card-border, rgba(255,255,255,0.10))',
    color: 'var(--app-text, #fff)', width: 36, height: 36, borderRadius: 10, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
  }}>
      <Icon name="chev-left" size={16} color="currentColor" />
    </button>
    <Eyebrow>{crumb}</Eyebrow>
    <div style={{ flex: 1 }}></div>
    {right}
  </div>;


// ===========================================================================
// AUTH — login / signup toggle. Google SSO + email. "Browse as guest" exit.
// ===========================================================================
const AuthScreen = ({ mode = 'signup', onAuth, onBrowse, onBack }) => {
  const [tab, setTab] = React.useState(mode); // 'signup' | 'login'
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');
  const isSignup = tab === 'signup';
  return (
    <div style={{ height: '100%', overflow: 'auto', position: 'relative' }}>
      <StatusBar />
      <div style={{ position: 'absolute', top: -60, right: -80, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,99,72,0.22)', filter: 'blur(85px)', pointerEvents: 'none' }}></div>

      <div style={{ padding: '4px 24px 40px', position: 'relative' }}>
        <button onClick={onBack} aria-label="Back" style={{
          background: 'var(--app-icon-chip-bg)', border: '1px solid var(--app-card-border)',
          color: 'var(--app-text)', width: 36, height: 36, borderRadius: 10, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28
        }}>
          <Icon name="chev-left" size={16} color="#fff" />
        </button>

        <SparkLogo size={26} />
        <h1 style={{ fontFamily: 'Montserrat', fontSize: 30, fontWeight: 900, letterSpacing: '-0.01em', lineHeight: 1.05, margin: '22px 0 6px', color: 'var(--app-text)' }}>
          {isSignup ? 'Join your city.' : 'Welcome back.'}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--app-text-muted)', margin: '0 0 24px', lineHeight: 1.5 }}>
          {isSignup ? 'Discover and publish local events — no algorithm, just your neighborhood.' : 'Pick up where you left off.'}
        </p>

        {/* Tab toggle */}
        <div style={{ display: 'flex', gap: 6, padding: 6, borderRadius: 14, background: 'var(--app-icon-chip-bg)', border: '1px solid var(--app-card-border)', marginBottom: 22 }}>
          {[['signup', 'Sign Up'], ['login', 'Log In']].map(([id, label]) =>
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontFamily: 'Inter', fontWeight: 900, fontSize: 12, letterSpacing: '0.10em', textTransform: 'uppercase',
            background: tab === id ? 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' : 'transparent',
            color: tab === id ? '#14213D' : 'var(--app-text-muted)',
            transition: 'all .2s ease'
          }}>{label}</button>
          )}
        </div>

        {/* Google SSO */}
        <button onClick={() => onAuth(tab)} style={{
          all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          background: '#fff', color: '#14213D', fontWeight: 800, fontSize: 14,
          padding: '13px 18px', borderRadius: 14, marginBottom: 16
        }}>
          <img src="assets/google-g.svg" width="18" height="18" alt="" />
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 0 16px' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }}></div>
          <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.18em', color: 'var(--app-text-hint)' }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }}></div>
        </div>

        {isSignup &&
        <Field label="Full name">
            <TextField value={''} onChange={() => {}} placeholder="Jordan Chen" icon="user" />
          </Field>
        }
        <Field label="Email">
          <TextField value={email} onChange={setEmail} placeholder="you@email.com" type="email" icon="mail" />
        </Field>
        <Field label="Password">
          <TextField value={pw} onChange={setPw} placeholder="••••••••" type="password" icon="lock" />
        </Field>

        <SparkButton size="lg" onClick={() => onAuth(tab)}>
          {isSignup ? 'Create Account' : 'Log In'}
        </SparkButton>

        <button onClick={onBrowse} style={{
          all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', textAlign: 'center',
          marginTop: 18, fontSize: 13, fontWeight: 700, color: 'var(--app-text-muted)'
        }}>
          Skip — browse as guest
        </button>
      </div>
    </div>);

};


// ===========================================================================
// CREATE EVENT — single scrollable form → publish → success state.
// ===========================================================================
const CREATE_CATEGORIES = ['Curbside', 'Markets', 'Music', 'Art', 'Food', 'Community', 'Pop-Ups', 'Outdoors', 'Family', 'Wellness', 'Nightlife', 'Sports', 'Tech'];
// Paid-event wizard picker excludes Curbside — that category is reserved for
// free Curbside posts, which are auto-tagged and never run through this picker.
const EVENT_CATEGORIES = CREATE_CATEGORIES.filter((c) => c !== 'Curbside');

// ===========================================================================
// CANONICAL PRICING — THE single source of truth for tiers, prices, copy, and
// feature lists. BOTH the standalone Pricing screen AND Create Event's tier
// step render from this object; no screen hardcodes tier names, prices, or
// feature text anywhere.
//
// Pricing is transactional (pay ONCE per event, no subscription) and scaled by
// the event's DURATION BAND — a single clean total per band, never per-day:
//   • single   — single-day
//   • multi    — 2–4 days
//   • extended — 5+ days
// A `free` tier has no band pricing. `bands` lists which bands a tier supports
// (Pop-up is single-day only). `inWizard` gates whether the tier appears in the
// Create Event tier step (Pop-up has its own upcoming creation flow).
// ===========================================================================
const DURATION_BANDS = [
{ id: 'single', label: 'Single-day' },
{ id: 'multi', label: '2–4 days' },
{ id: 'extended', label: '5+ days' }];

const PRICING_TIERS = [
{
  id: 'popup', name: 'Curbside', free: true, bands: ['single'], inWizard: false,
  desc: 'Yard sales, free pickup items, block celebrations. One photo, a description, and an address.',
  photos: 1,
  features: ['1 photo', 'Description & address', 'One category'],
  limit: '3 free posts every 100 days'
},
{
  id: 'standard', name: 'Standard', bands: ['single', 'multi', 'extended'], inWizard: true,
  prices: { single: 5, multi: 12, extended: 20 },
  desc: 'A clean, linkable event page on the local feed — with your social links. Everything you need to get the word out.',
  photos: 3,
  features: ['Up to 3 photos', 'Clean, linkable event page', 'Social links', 'Shows on the distance feed', 'Any event duration']
},
{
  id: 'plus', name: 'Plus', bands: ['single', 'multi', 'extended'], inWizard: true, highlight: true,
  prices: { single: 15, multi: 29, extended: 49 },
  desc: 'Unlocks a 10-photo gallery, paid entry, and a site map with vendor pins — for events that need the extra reach.',
  photos: 10,
  inheritsFrom: 'Standard',
  features: ['10-photo gallery', 'Paid entry', 'Interactive site map with vendor pins']
}];

// Enterprise / early-access tier — shown on the Pricing screen unchanged. Not
// band-priced and not part of the transactional canonical flow.
const ENTERPRISE_TIER = {
  id: 'backstage', name: 'Backstage', price: 'Coming soon', tag: 'Early access', tagColor: 'var(--app-text-faint)',
  desc: 'Built for venues, festivals, and recurring event operators.',
  features: ['Everything in Plus', 'Custom branding on event pages', 'Bulk event creation & management', 'Dedicated organizer support', 'Venue profile & calendar page'],
  border: 'rgba(255,255,255,0.12)'
};

const _tierById = (id) => PRICING_TIERS.find((t) => t.id === id);

const _eventDays = (start, end) => {
  if (!start) return 1;
  const a = new Date(start + 'T00:00:00');
  const b = new Date((end || start) + 'T00:00:00');
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
};
const _durationBand = (days) => days <= 1 ? 'single' : days <= 4 ? 'multi' : 'extended';
const _bandLabel = (days) => days <= 1 ? 'Single-day event' : `${days}-day event`;
const _bandName = (days) => ({ single: 'Single day', multi: 'Multi-day', extended: 'Extended' })[_durationBand(days)];
const _eventPrice = (tier, days) => _tierById(tier).prices[_durationBand(days)];

// Custom-category screening. Reject hate/harmful submissions outright; the
// list is deliberately blunt — substring match, case-insensitive.
const CATEGORY_BLOCKLIST = ['hate', 'nazi', 'racist', 'slur', 'kill', 'terror', 'bomb', 'porn', 'drugs', 'weapon', 'gun', 'assault'];
const _isBlocked = (s) => {const v = s.toLowerCase();return CATEGORY_BLOCKLIST.some((b) => v.includes(b));};

const CREATE_STEPS = ['Basics', 'When & Where', 'Details', 'Review'];

// Parse the free-text time field into an hour/min so the preview countdown is
// real. Falls back to 7:00pm when nothing parses.
function _parsePreviewISO(ymd, timeStr) {
  if (!ymd) return null;
  const [y, m, d] = ymd.split('-').map(Number);
  let hr = 19,min = 0;
  const tm = (timeStr || '').match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (tm) {
    hr = parseInt(tm[1], 10);min = tm[2] ? parseInt(tm[2], 10) : 0;
    const ap = (tm[3] || '').toLowerCase();
    if (ap === 'pm' && hr < 12) hr += 12;
    if (ap === 'am' && hr === 12) hr = 0;
  }
  return new Date(y, m - 1, d, hr, min, 0, 0).toISOString();
}

// Collapsible live preview pinned above the form. Expanded → the full-glory
// EventStub (photo variant). Collapsed → a one-line ticket bar that still
// updates live. Reuses the canonical EventStub — no new card.
const _PreviewRail = ({ event, open, onToggle }) => {
  const cd = window.eventCountdown ? window.eventCountdown(event.startISO) : { value: '—' };
  return (
    <div style={{ borderRadius: 18, border: '1px solid var(--app-card-border)', background: 'var(--app-card-bg)', overflow: 'hidden' }}>
      <button onClick={onToggle} style={{
        all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%',
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px'
      }}>
        <span style={{ width: 4, height: 26, borderRadius: 9999, background: 'linear-gradient(180deg,#ff6348,#FCA311,#F7B731)', flexShrink: 0 }}></span>
        <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
          <span style={{ display: 'block', fontSize: 9, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--app-text-faint)' }}>Live preview</span>
          <span style={{ display: 'block', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 13, color: 'var(--app-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</span>
        </span>
        {!open && <span style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 15, color: '#FCA311', flexShrink: 0 }}>{cd.value}</span>}
        <span style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease', display: 'flex' }}>
          <Icon name="chev-right" size={15} color="var(--app-text-faint)" />
        </span>
      </button>
      {open && <div style={{ padding: '2px 12px 14px' }}><EventStub variant="photo" event={event} hidePrice onTap={() => {}} /></div>}
    </div>);

};

// Minimal rich-text editor — Bold, Italic, bullet list only. Uncontrolled:
// we seed innerHTML once on mount and never re-feed it, so the caret never
// jumps while typing. Emits HTML on input.
const _RichText = ({ html, onChange, placeholder }) => {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (html || '')) ref.current.innerHTML = html || '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const exec = (cmd) => {
    document.execCommand(cmd, false, null);
    if (ref.current) onChange(ref.current.innerHTML);
    ref.current && ref.current.focus();
  };
  const Tool = ({ cmd, label, style }) =>
  <button type="button" onMouseDown={(e) => {e.preventDefault();exec(cmd);}} style={{
    all: 'unset', cursor: 'pointer', minWidth: 30, height: 30, padding: '0 8px', borderRadius: 8,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--app-icon-chip-bg)', border: '1px solid var(--app-card-border)',
    color: 'var(--app-text)', fontSize: 13, ...style
  }}>{label}</button>;

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <Tool cmd="bold" label="B" style={{ fontWeight: 900 }} />
        <Tool cmd="italic" label="I" style={{ fontStyle: 'italic', fontFamily: 'Georgia, serif' }} />
        <Tool cmd="insertUnorderedList" label={<Icon name="list" size={14} color="var(--app-text)" />} />
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        data-ph={placeholder}
        style={{ ...inputStyle, minHeight: 96, lineHeight: 1.5, textAlign: 'left', cursor: 'text', overflowWrap: 'anywhere' }}>fsdfasdfasd  d awdfwe dwlwd wd w edkjn awdkmnf wkjwnd test thing
      </div>
    </div>);

};

// Dedicated create-flow date range — reliably editable, no discovery/zip UI.
// Tapping anywhere on a field opens the native picker (showPicker fallback to
// focus). Kept separate from the shared discovery DateRangeBar on purpose.
const _DateField = ({ value, onChange, label, min }) => {
  const ref = React.useRef(null);
  const open = () => {const el = ref.current;if (!el) return;try {el.showPicker();} catch (e) {el.focus();}};
  return (
    <div onClick={open} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 9, background: 'var(--app-icon-chip-bg)', border: '1px solid var(--app-card-border)', borderRadius: 14, padding: '12px 14px', cursor: 'pointer' }}>
      <Icon name="cal" size={15} color="#F7B731" />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--app-text-faint)' }}>{label}</div>
        <input ref={ref} type="date" value={value} min={min} onChange={(e) => onChange(e.target.value)}
        style={{ background: 'transparent', border: 'none', outline: 'none', padding: 0, marginTop: 2, color: 'var(--app-text)', fontFamily: 'Inter', fontSize: 14, fontWeight: 700, colorScheme: 'dark', width: '100%', minWidth: 0 }} />
      </div>
    </div>);

};
const _DateRangeField = ({ start, end, onStart, onEnd }) =>
<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <_DateField value={start} onChange={onStart} label="Starts" />
    <Icon name="arrow" size={14} color="var(--app-text-faint)" />
    <_DateField value={end} onChange={onEnd} label="Ends" min={start} />
  </div>;


const CreateEventScreen = ({ onBack, onCheckout, desktop }) => {
  const [step, setStep] = React.useState(0);
  const [previewOpen, setPreviewOpen] = React.useState(true);
  const [title, setTitle] = React.useState('');
  const [cats, setCats] = React.useState(['Music']);
  const [customCat, setCustomCat] = React.useState('');
  const [custError, setCustError] = React.useState('');
  const [catWarn, setCatWarn] = React.useState(false);
  const catWarnedRef = React.useRef(false); // popup fires exactly once per session
  const [cover, setCover] = React.useState(false);
  const [start, setStart] = React.useState(todayLocalYMD());
  const [end, setEnd] = React.useState(todayLocalYMD());
  const [startTime, setStartTime] = React.useState('19:00');
  const [endTime, setEndTime] = React.useState('22:00');
  const [venueName, setVenueName] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [gallery, setGallery] = React.useState([]);
  const [desc, setDesc] = React.useState('');
  const [tier, setTier] = React.useState('standard');
  const [entryFeeOn, setEntryFeeOn] = React.useState(false);
  const [entryFee, setEntryFee] = React.useState('10');
  const [amenities, setAmenities] = React.useState([]);
  const [vendors, setVendors] = React.useState([]);
  const [vName, setVName] = React.useState('');
  const [vType, setVType] = React.useState('');
  const [socials, setSocials] = React.useState({ instagram: '', twitter: '', facebook: '', website: '' });
  // Site-map section state — lifted here (rather than local to _PlusDetails) so
  // the desktop layout can render its collapsible body as a separate
  // full-width row below the two-column grid.
  const [mapOpen, setMapOpen] = React.useState(false);
  const [amenQuery, setAmenQuery] = React.useState('');
  const [vLogo, setVLogo] = React.useState(false);

  const isPlus = tier === 'plus';
  const days = _eventDays(start, end);
  const price = _eventPrice(tier, days);
  const maxPhotos = _tierById(tier).photos;

  // Collapse the preview automatically once past the teaching step.
  React.useEffect(() => {setPreviewOpen(step === 0);}, [step]);
  // Plus-only fields shouldn't silently carry into a Standard checkout.
  React.useEffect(() => {if (!isPlus) {setEntryFeeOn(false);setGallery((g) => g.slice(0, 3));}}, [isPlus]);

  const toggleCat = (c) => setCats((a) => {
    if (a.includes(c)) return a.filter((x) => x !== c);
    const next = [...a, c];
    if (next.length >= 4 && !catWarnedRef.current) {catWarnedRef.current = true;setCatWarn(true);}
    return next;
  });
  const addCustom = () => {
    const raw = customCat.trim();
    if (!raw) return;
    if (_isBlocked(raw)) {setCustError('That category isn’t allowed.');return;}
    const canon = EVENT_CATEGORIES.find((c) => c.toLowerCase() === raw.toLowerCase()) || raw;
    if (cats.some((c) => c.toLowerCase() === canon.toLowerCase())) {setCustError('Already added.');setCustomCat('');return;}
    setCats((a) => {const next = [...a, canon];if (next.length >= 4 && !catWarnedRef.current) {catWarnedRef.current = true;setCatWarn(true);}return next;});
    setCustomCat('');setCustError('');
  };
  const suggestions = customCat.trim() ?
  EVENT_CATEGORIES.filter((c) => c.toLowerCase().includes(customCat.toLowerCase()) && !cats.some((x) => x.toLowerCase() === c.toLowerCase())).slice(0, 4) :
  [];

  const previewEvent = {
    id: 'preview',
    title: title.trim() || 'Your event title',
    tags: cats.length ? cats : ['Event'],
    date: start ? new Date(start + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Add a date',
    time: startTime ? _fmtTime(startTime) + (endTime ? ' – ' + _fmtTime(endTime) : '') : 'Add a time',
    location: venueName.trim() || address.trim() || 'Add a venue',
    price: isPlus && entryFeeOn ? Number(entryFee) || 0 : 0,
    startISO: _parsePreviewISO(start, startTime)
  };

  const canPublish = !!(title.trim() && start && (venueName.trim() || address.trim()));
  const missing = [!title.trim() && 'title', !start && 'date', !(venueName.trim() || address.trim()) && 'venue'].filter(Boolean);

  const goNext = () => setStep((s) => Math.min(CREATE_STEPS.length - 1, s + 1));
  const goBack = () => step === 0 ? onBack() : setStep((s) => s - 1);
  const publish = () => canPublish && onCheckout({
    title: title.trim() || 'Your Event', tier, days, price,
    bandName: _bandName(days), bandLabel: _bandLabel(days)
  });

  const sectionLabelStyle = { fontFamily: 'Montserrat', fontWeight: 900, fontSize: 20, letterSpacing: '-0.01em', color: 'var(--app-text)', margin: '0 0 16px' };
  const plusProps = { isPlus, entryFeeOn, setEntryFeeOn, entryFee, setEntryFee, amenities, setAmenities, vendors, setVendors, vName, setVName, vType, setVType, socials, setSocials, mapOpen, setMapOpen, amenQuery, setAmenQuery, vLogo, setVLogo };

  // ---- DESKTOP (≥1024px) — two-column shell: form left, sticky live
  // preview right. Site map & vendors expands full-width below when open.
  // Same state/components/validation as mobile; layout only.
  if (desktop) {
    const stepTitles = ['Basics', 'When & Where', 'Details', 'Review'];
    return (
      <div style={{ minHeight: '100%', boxSizing: 'border-box', background: 'var(--app-bg)', color: 'var(--app-text)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '40px 40px 80px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <button onClick={goBack} aria-label="Back" style={{ all: 'unset', cursor: 'pointer', width: 38, height: 38, borderRadius: 12, background: 'var(--app-icon-chip-bg)', border: '1px solid var(--app-card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ display: 'flex', transform: 'rotate(180deg)' }}><Icon name="chev-right" size={16} color="var(--app-text)" /></span>
            </button>
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--app-text-faint)' }}>Create · Step {step + 1} of {CREATE_STEPS.length}</div>
              <div style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 22, color: 'var(--app-text)', marginTop: 2 }}>{stepTitles[step]}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
            {CREATE_STEPS.map((s, i) =>
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 9999, background: i <= step ? 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' : 'var(--app-divider)', transition: 'background .2s ease' }}></div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 44, alignItems: 'start' }}>
            <div>
              {step === 0 &&
              <div>
                  <h2 style={sectionLabelStyle}>Basics</h2>
                  <Field label="Event title">
                    <TextField value={title} onChange={setTitle} placeholder="e.g. Sunset Songwriters Round" icon="text" />
                  </Field>

                  <Field label="Categories" hint={`${cats.length} selected`}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {cats.filter((c) => !EVENT_CATEGORIES.includes(c)).map((c) =>
                      <_Pill key={c} active label={c} onClick={() => toggleCat(c)} removable />
                      )}
                        {EVENT_CATEGORIES.map((c) =>
                      <_Pill key={c} active={cats.includes(c)} label={c} onClick={() => toggleCat(c)} />
                      )}
                      </div>
                      {catWarn &&
                    <div onAnimationEnd={() => setCatWarn(false)} style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 6, display: 'flex', alignItems: 'center', gap: 8, padding: '11px 13px', borderRadius: 12, background: 'rgba(28,24,18,0.97)', backdropFilter: 'blur(8px)', border: '1px solid rgba(252,163,17,0.45)', boxShadow: '0 14px 32px -10px rgba(0,0,0,0.65)', fontSize: 11.5, color: '#FCA311', fontWeight: 700, lineHeight: 1.4, animation: 'ceFadeWarn 4.2s ease forwards' }}>
                          <Icon name="sparkles" size={13} color="#FCA311" />
                          <span>Most events use 2–3 categories. More may crowd your card.</span>
                        </div>
                    }
                    </div>
                  </Field>

                  <Field label="Add your own" hint="Optional">
                    <div style={{ position: 'relative' }} onKeyDown={(e) => {if (e.key === 'Enter') {e.preventDefault();addCustom();}}}>
                      <TextField value={customCat} onChange={(v) => {setCustomCat(v);setCustError('');}} placeholder="Type a category, press Enter" icon="plus" />
                    </div>
                    {suggestions.length > 0 &&
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                        {suggestions.map((s) => <_Pill key={s} label={s} onClick={() => {toggleCat(s);setCustomCat('');}} subtle />)}
                      </div>
                  }
                    {customCat.trim() && <button onClick={addCustom} style={{ all: 'unset', cursor: 'pointer', marginTop: 8, fontSize: 12, fontWeight: 800, color: '#FCA311' }}>+ Add “{customCat.trim()}”</button>}
                    {custError && <div style={{ marginTop: 8, fontSize: 11.5, fontWeight: 700, color: '#ff8a72' }}>{custError}</div>}
                  </Field>

                  <Field label="Cover image" hint="Optional">
                    <button onClick={() => setCover((c) => !c)} style={{
                    all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', height: 130, borderRadius: 18,
                    border: cover ? '1px solid rgba(252,163,17,0.45)' : '1px dashed rgba(255,255,255,0.18)',
                    background: cover ? 'linear-gradient(135deg,#5b3220,#a8551d 60%,#e09c3a)' : 'linear-gradient(135deg, rgba(255,95,78,0.10), rgba(255,202,58,0.06))',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, position: 'relative', overflow: 'hidden'
                  }}>
                      <Icon name="image" size={22} color={cover ? '#14213D' : '#FCA311'} />
                      <span style={{ fontSize: 12, fontWeight: 800, color: cover ? '#14213D' : 'var(--app-text-muted)' }}>{cover ? 'Cover added · tap to remove' : 'Add a cover image'}</span>
                      {!cover && <span style={{ fontSize: 10, color: 'var(--app-text-faint)' }}>Recommended 1200×600</span>}
                    </button>
                  </Field>
                </div>
              }

              {step === 1 &&
              <div>
                  <h2 style={sectionLabelStyle}>When &amp; Where</h2>
                  <Field label="Date range" hint={_bandLabel(days)}>
                    <_DateRangeField start={start} end={end} onStart={(v) => {setStart(v);if (v > end) setEnd(v);}} onEnd={setEnd} />
                  </Field>
                  <Field label="Time" hint="Start → end">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[['Start', startTime, setStartTime], ['End', endTime, setEndTime]].map(([lbl, val, set]) =>
                    <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ width: 38, flexShrink: 0, fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--app-text-faint)' }}>{lbl}</span>
                          <_TimePicker value={val} onChange={set} />
                        </div>
                    )}
                    </div>
                  </Field>
                  <Field label="Venue name">
                    <TextField value={venueName} onChange={setVenueName} placeholder="e.g. The Lola Loft" icon="store" />
                  </Field>
                  <Field label="Street address">
                    <TextField value={address} onChange={setAddress} placeholder="123 Roosevelt St, Phoenix" icon="pin" />
                  </Field>
                </div>
              }

              {step === 2 &&
              <div>
                  <h2 style={sectionLabelStyle}>Details</h2>

                  <Field label="Tier" hint="Per-event · pay once">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {PRICING_TIERS.filter((t) => t.inWizard).map((t) => {
                      const sel = tier === t.id;
                      const tp = _eventPrice(t.id, days);
                      return (
                        <button key={t.id} onClick={() => setTier(t.id)} style={{
                          all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', padding: 16, borderRadius: 16,
                          border: `1.5px solid ${sel ? t.id === 'plus' ? 'rgba(255,99,72,0.45)' : 'rgba(252,163,17,0.40)' : 'rgba(255,255,255,0.10)'}`,
                          background: sel ? t.id === 'plus' ? 'rgba(255,99,72,0.08)' : 'rgba(252,163,17,0.07)' : 'rgba(255,255,255,0.03)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 16, color: sel ? '#FCA311' : '#fff' }}>{t.name}</span>
                              {t.id === 'plus' && <Icon name="sparkles" size={13} color="#FCA311" />}
                              <span style={{ flex: 1 }}></span>
                              <span style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 18, color: 'var(--app-text)' }}>${tp}</span>
                              <span style={{ width: 20, height: 20, borderRadius: 9999, flexShrink: 0, border: `2px solid ${sel ? '#FCA311' : 'rgba(255,255,255,0.25)'}`, background: sel ? '#FCA311' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{sel && <Icon name="check" size={11} color="#14213D" />}</span>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--app-text-muted)', marginTop: 6, lineHeight: 1.45 }}>{t.desc}</div>
                            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.04em', color: 'var(--app-text-faint)', marginTop: 8 }}>{_bandName(days)} · {_bandLabel(days)} · ${tp} total</div>
                          </button>);

                    })}
                    </div>
                  </Field>

                  <Field label="Photo gallery" hint={`${gallery.length} / ${maxPhotos}`}>
                    <_GalleryGrid gallery={gallery} max={maxPhotos} onChange={setGallery} />
                    {!isPlus && <div style={{ fontSize: 11, color: 'var(--app-text-faint)', marginTop: 8 }}>Standard fits {maxPhotos} photos. Plus unlocks up to {_tierById('plus').photos}.</div>}
                  </Field>

                  <Field label="Description">
                    <_RichText html={desc} onChange={setDesc} placeholder="What should people know? Vendors, lineup, parking…" />
                  </Field>

                  <_PlusDetails {...plusProps} section="main" />
                </div>
              }

              {step === 3 &&
              <_ReviewStep {...{ previewEvent, title, start, end, days, startTime, endTime, venueName, address, desc, cats, tier, price, isPlus, entryFeeOn, entryFee, amenities, vendors, socials, canPublish, missing }} />
              }
            </div>

            <div style={{ position: 'sticky', top: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--app-text-faint)', marginBottom: 10 }}>Live preview</div>
              <EventStub variant="photo" event={previewEvent} priceInBody onTap={() => {}} />
            </div>
          </div>

          {step === 2 && isPlus && mapOpen &&
          <div style={{ marginTop: 32 }}>
              <_PlusDetails {...plusProps} section="mapBody" />
            </div>
          }

          <div style={{ display: 'flex', gap: 12, marginTop: 40, maxWidth: 480 }}>
            <button onClick={goBack} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', padding: '16px 26px', borderRadius: 16, background: 'var(--app-icon-chip-bg)', border: '1px solid var(--app-card-border)', color: 'var(--app-text)', fontFamily: 'Montserrat', fontWeight: 800, fontSize: 14, textAlign: 'center' }}>{step === 0 ? 'Cancel' : 'Back'}</button>
            {step < CREATE_STEPS.length - 1 ?
            <button onClick={goNext} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', flex: 1, padding: '16px 26px', borderRadius: 16, backgroundImage: 'linear-gradient(135deg,#ff5f4e 0%,#ff8c38 50%,#ffca3a 100%)', color: '#14213D', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 15, textAlign: 'center', boxShadow: '0 10px 26px -8px rgba(255,95,78,0.55)' }}>Continue</button> :

            <button onClick={publish} disabled={!canPublish} style={{
              all: 'unset', boxSizing: 'border-box', cursor: canPublish ? 'pointer' : 'not-allowed', flex: 1, padding: '16px 26px', borderRadius: 16, textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 15,
              ...(canPublish ? { backgroundImage: 'linear-gradient(135deg,#ff5f4e 0%,#ff8c38 50%,#ffca3a 100%)', color: '#14213D', boxShadow: '0 10px 26px -8px rgba(255,95,78,0.55)' } : { background: 'var(--app-card-bg)', color: 'var(--app-text-hint)' })
            }}>Continue to payment</button>
            }
          </div>
        </div>
      </div>);

  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      <StatusBar />
      <SubHeader crumb={`Create · Step ${step + 1} of ${CREATE_STEPS.length}`} onBack={goBack} />

      <div style={{ padding: '0 24px 14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {CREATE_STEPS.map((s, i) =>
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 9999, background: i <= step ? 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' : 'rgba(255,255,255,0.10)', transition: 'background .2s ease' }}></div>
          )}
        </div>
        {step < 3 && <_PreviewRail event={previewEvent} open={previewOpen} onToggle={() => setPreviewOpen((o) => !o)} />}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '6px 24px 28px' }}>
        {step === 0 &&
        <div>
            <h2 style={sectionLabelStyle}>Basics</h2>
            <Field label="Event title">
              <TextField value={title} onChange={setTitle} placeholder="e.g. Sunset Songwriters Round" icon="text" />
            </Field>

            <Field label="Categories" hint={`${cats.length} selected`}>
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {cats.filter((c) => !EVENT_CATEGORIES.includes(c)).map((c) =>
                <_Pill key={c} active label={c} onClick={() => toggleCat(c)} removable />
                )}
                  {EVENT_CATEGORIES.map((c) =>
                <_Pill key={c} active={cats.includes(c)} label={c} onClick={() => toggleCat(c)} />
                )}
                </div>
                {catWarn &&
              <div onAnimationEnd={() => setCatWarn(false)} style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 6, display: 'flex', alignItems: 'center', gap: 8, padding: '11px 13px', borderRadius: 12, background: 'rgba(28,24,18,0.97)', backdropFilter: 'blur(8px)', border: '1px solid rgba(252,163,17,0.45)', boxShadow: '0 14px 32px -10px rgba(0,0,0,0.65)', fontSize: 11.5, color: '#FCA311', fontWeight: 700, lineHeight: 1.4, animation: 'ceFadeWarn 4.2s ease forwards' }}>
                    <Icon name="sparkles" size={13} color="#FCA311" />
                    <span>Most events use 2–3 categories. More may crowd your card.</span>
                  </div>
              }
              </div>
            </Field>

            <Field label="Add your own" hint="Optional">
              <div style={{ position: 'relative' }} onKeyDown={(e) => {if (e.key === 'Enter') {e.preventDefault();addCustom();}}}>
                <TextField value={customCat} onChange={(v) => {setCustomCat(v);setCustError('');}} placeholder="Type a category, press Enter" icon="plus" />
              </div>
              {suggestions.length > 0 &&
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {suggestions.map((s) => <_Pill key={s} label={s} onClick={() => {toggleCat(s);setCustomCat('');}} subtle />)}
                </div>
            }
              {customCat.trim() && <button onClick={addCustom} style={{ all: 'unset', cursor: 'pointer', marginTop: 8, fontSize: 12, fontWeight: 800, color: '#FCA311' }}>+ Add “{customCat.trim()}”</button>}
              {custError && <div style={{ marginTop: 8, fontSize: 11.5, fontWeight: 700, color: '#ff8a72' }}>{custError}</div>}
            </Field>

            <Field label="Cover image" hint="Optional">
              <button onClick={() => setCover((c) => !c)} style={{
              all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', height: 130, borderRadius: 18,
              border: cover ? '1px solid rgba(252,163,17,0.45)' : '1px dashed rgba(255,255,255,0.18)',
              background: cover ? 'linear-gradient(135deg,#5b3220,#a8551d 60%,#e09c3a)' : 'linear-gradient(135deg, rgba(255,95,78,0.10), rgba(255,202,58,0.06))',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, position: 'relative', overflow: 'hidden'
            }}>
                <Icon name="image" size={22} color={cover ? '#14213D' : '#FCA311'} />
                <span style={{ fontSize: 12, fontWeight: 800, color: cover ? '#14213D' : 'var(--app-text-muted)' }}>{cover ? 'Cover added · tap to remove' : 'Add a cover image'}</span>
                {!cover && <span style={{ fontSize: 10, color: 'var(--app-text-faint)' }}>Recommended 1200×600</span>}
              </button>
            </Field>
          </div>
        }

        {step === 1 &&
        <div>
            <h2 style={sectionLabelStyle}>When &amp; Where</h2>
            <Field label="Date range" hint={_bandLabel(days)}>
              <_DateRangeField start={start} end={end} onStart={(v) => {setStart(v);if (v > end) setEnd(v);}} onEnd={setEnd} />
            </Field>
            <Field label="Time" hint="Start → end">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[['Start', startTime, setStartTime], ['End', endTime, setEndTime]].map(([lbl, val, set]) =>
              <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 38, flexShrink: 0, fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--app-text-faint)' }}>{lbl}</span>
                    <_TimePicker value={val} onChange={set} />
                  </div>
              )}
              </div>
            </Field>
            <Field label="Venue name">
              <TextField value={venueName} onChange={setVenueName} placeholder="e.g. The Lola Loft" icon="store" />
            </Field>
            <Field label="Street address">
              <TextField value={address} onChange={setAddress} placeholder="123 Roosevelt St, Phoenix" icon="pin" />
            </Field>
          </div>
        }

        {step === 2 &&
        <div>
            <h2 style={sectionLabelStyle}>Details</h2>

            <Field label="Tier" hint="Per-event · pay once">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {PRICING_TIERS.filter((t) => t.inWizard).map((t) => {
                const sel = tier === t.id;
                const tp = _eventPrice(t.id, days);
                return (
                  <button key={t.id} onClick={() => setTier(t.id)} style={{
                    all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', padding: 16, borderRadius: 16,
                    border: `1.5px solid ${sel ? t.id === 'plus' ? 'rgba(255,99,72,0.45)' : 'rgba(252,163,17,0.40)' : 'rgba(255,255,255,0.10)'}`,
                    background: sel ? t.id === 'plus' ? 'rgba(255,99,72,0.08)' : 'rgba(252,163,17,0.07)' : 'rgba(255,255,255,0.03)'
                  }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 16, color: sel ? '#FCA311' : '#fff' }}>{t.name}</span>
                        {t.id === 'plus' && <Icon name="sparkles" size={13} color="#FCA311" />}
                        <span style={{ flex: 1 }}></span>
                        <span style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 18, color: 'var(--app-text)' }}>${tp}</span>
                        <span style={{ width: 20, height: 20, borderRadius: 9999, flexShrink: 0, border: `2px solid ${sel ? '#FCA311' : 'rgba(255,255,255,0.25)'}`, background: sel ? '#FCA311' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{sel && <Icon name="check" size={11} color="#14213D" />}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--app-text-muted)', marginTop: 6, lineHeight: 1.45 }}>{t.desc}</div>
                      <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.04em', color: 'var(--app-text-faint)', marginTop: 8 }}>{_bandName(days)} · {_bandLabel(days)} · ${tp} total</div>
                    </button>);

              })}
              </div>
            </Field>

            <Field label="Photo gallery" hint={`${gallery.length} / ${maxPhotos}`}>
              <_GalleryGrid gallery={gallery} max={maxPhotos} onChange={setGallery} />
              {!isPlus && <div style={{ fontSize: 11, color: 'var(--app-text-faint)', marginTop: 8 }}>Standard fits {maxPhotos} photos. Plus unlocks up to {_tierById('plus').photos}.</div>}
            </Field>

            <Field label="Description">
              <_RichText html={desc} onChange={setDesc} placeholder="What should people know? Vendors, lineup, parking…" />
            </Field>

            <_PlusDetails {...plusProps} section="all" />
          </div>
        }

        {step === 3 &&
        <_ReviewStep {...{ previewEvent, title, start, end, days, startTime, endTime, venueName, address, desc, cats, tier, price, isPlus, entryFeeOn, entryFee, amenities, vendors, socials, canPublish, missing }} />
        }
      </div>

      <div style={{ flexShrink: 0, padding: '14px 24px calc(14px + env(safe-area-inset-bottom))', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(20,33,61,0.55)', display: 'flex', gap: 12 }}>
        <button onClick={goBack} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', padding: '16px 22px', borderRadius: 16, background: 'var(--app-icon-chip-bg)', border: '1px solid var(--app-card-border)', color: 'var(--app-text)', fontFamily: 'Montserrat', fontWeight: 800, fontSize: 14, textAlign: 'center' }}>{step === 0 ? 'Cancel' : 'Back'}</button>
        {step < CREATE_STEPS.length - 1 ?
        <button onClick={goNext} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', flex: 1, padding: '16px 22px', borderRadius: 16, backgroundImage: 'linear-gradient(135deg,#ff5f4e 0%,#ff8c38 50%,#ffca3a 100%)', color: '#14213D', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 15, textAlign: 'center', boxShadow: '0 10px 26px -8px rgba(255,95,78,0.55)' }}>Continue</button> :

        <button onClick={publish} disabled={!canPublish} style={{
          all: 'unset', boxSizing: 'border-box', cursor: canPublish ? 'pointer' : 'not-allowed', flex: 1, padding: '16px 22px', borderRadius: 16, textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 15,
          ...(canPublish ? { backgroundImage: 'linear-gradient(135deg,#ff5f4e 0%,#ff8c38 50%,#ffca3a 100%)', color: '#14213D', boxShadow: '0 10px 26px -8px rgba(255,95,78,0.55)' } : { background: 'var(--app-card-bg)', color: 'var(--app-text-hint)' })
        }}>Continue to payment</button>
        }
      </div>
    </div>);

};

// ---- Create-flow helper widgets -------------------------------------------

function _fmtTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const ap = h >= 12 ? 'pm' : 'am';
  const hr = h % 12 || 12;
  return m ? `${hr}:${String(m).padStart(2, '0')}${ap}` : `${hr}${ap}`;
}

// Selectable pill — categories, venue types, suggestions.
const _Pill = ({ label, active, onClick, removable, subtle }) =>
<button onClick={onClick} style={{
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9999, cursor: 'pointer',
  boxSizing: 'border-box', border: 'none',
  fontFamily: 'Inter', fontWeight: 800, fontSize: 12,
  boxShadow: active ? 'none' : subtle ? 'inset 0 0 0 1px rgba(252,163,17,0.30)' : 'inset 0 0 0 1px rgba(255,255,255,0.12)',
  background: active ? 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' : subtle ? 'rgba(252,163,17,0.08)' : 'rgba(255,255,255,0.04)',
  color: active ? '#14213D' : subtle ? '#FCA311' : 'var(--app-text-muted)',
  transition: 'all .15s ease'
}}>{label}{removable && active && <Icon name="x" size={11} color="#14213D" />}</button>;


// Modern time entry — segmented hour : minute with an AM/PM toggle. No native
// column-wheel; type or step, reads cleaner. Value is 24h "HH:MM".
const _TimePicker = ({ value, onChange }) => {
  const [h24, m] = (value || '19:00').split(':').map(Number);
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 || 12;
  const [editing, setEditing] = React.useState(null); // highlight only the segment being edited
  const emit = (nh12, nm, nap) => {
    let H = nh12 % 12;if (nap === 'PM') H += 12;
    onChange(`${String(H).padStart(2, '0')}:${String(nm).padStart(2, '0')}`);
  };
  const setHour = (v) => {let n = parseInt(v.replace(/\D/g, ''), 10);if (isNaN(n)) n = 12;n = Math.max(1, Math.min(12, n));emit(n, m, ampm);};
  const setMin = (v) => {let n = parseInt(v.replace(/\D/g, ''), 10);if (isNaN(n)) n = 0;n = Math.max(0, Math.min(59, n));emit(h12, n, ampm);};
  const segBox = (on) => ({ borderRadius: 7, padding: '2px 2px', background: on ? 'linear-gradient(135deg,#ff8c38,#ffca3a)' : 'transparent', transition: 'background .15s ease' });
  const segInput = (on) => ({ width: 30, textAlign: 'center', background: 'transparent', border: 'none', outline: 'none', color: on ? '#14213D' : 'var(--app-text-muted)', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 17, padding: 0, MozAppearance: 'textfield' });
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--app-icon-chip-bg)', border: '1px solid var(--app-card-border)', borderRadius: 14, padding: '9px 12px' }}>
      <Icon name="clock" size={15} color="var(--app-text-faint)" />
      <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 2 }}>
        <span style={segBox(editing === 'hour')}><input inputMode="numeric" value={String(h12)} onChange={(e) => setHour(e.target.value)} onFocus={(e) => {setEditing('hour');e.target.select();}} onBlur={() => setEditing(null)} style={segInput(editing === 'hour')} /></span>
        <span style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 17, color: 'var(--app-text-faint)' }}>:</span>
        <span style={segBox(editing === 'min')}><input inputMode="numeric" value={String(m).padStart(2, '0')} onChange={(e) => setMin(e.target.value)} onFocus={(e) => {setEditing('min');e.target.select();}} onBlur={() => setEditing(null)} style={segInput(editing === 'min')} /></span>
      </div>
      <div style={{ display: 'flex', gap: 3, padding: 3, borderRadius: 9, background: 'rgba(0,0,0,0.22)' }}>
        {['AM', 'PM'].map((p) =>
        <button key={p} onClick={() => emit(h12, m, p)} style={{ all: 'unset', cursor: 'pointer', padding: '4px 9px', borderRadius: 6, fontFamily: 'Montserrat', fontWeight: 900, fontSize: 11, color: ampm === p ? '#14213D' : 'var(--app-text-muted)', background: ampm === p ? 'linear-gradient(135deg,#ff8c38,#ffca3a)' : 'transparent' }}>{p}</button>
        )}
      </div>
    </div>);

};

// Photo gallery slots — striped placeholders the user "fills"; capped by tier.
const _GalleryGrid = ({ gallery, max, onChange }) => {
  const add = () => onChange([...gallery, gallery.length]);
  const remove = (i) => onChange(gallery.filter((_, idx) => idx !== i));
  const slot = { borderRadius: 12, height: 78, position: 'relative', overflow: 'hidden' };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
      {gallery.map((g, i) =>
      <div key={i} style={{ ...slot, background: 'repeating-linear-gradient(135deg,#3a2d24,#3a2d24 6px,#46362b 6px,#46362b 12px)', border: '1px solid var(--app-card-border)' }}>
          <button onClick={() => remove(i)} aria-label="Remove" style={{ all: 'unset', cursor: 'pointer', position: 'absolute', top: 5, right: 5, width: 20, height: 20, borderRadius: 9999, background: 'rgba(7,11,20,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={11} color="#fff" />
          </button>
          <span style={{ position: 'absolute', bottom: 5, left: 6, fontSize: 8, fontFamily: 'monospace', color: 'rgba(238,240,255,0.5)' }}>photo {i + 1}</span>
        </div>
      )}
      {gallery.length < max &&
      <button onClick={add} style={{ ...slot, all: 'unset', cursor: 'pointer', boxSizing: 'border-box', border: '1px dashed rgba(255,255,255,0.20)', background: 'var(--app-card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="plus" size={18} color="#FCA311" />
        </button>
      }
    </div>);

};

const SITE_AMENITIES = ['Restrooms', 'Parking', 'Food', 'Entry', 'Stage', 'First Aid', 'ATM', 'Accessible'];
const SOCIAL_FIELDS = [['instagram', 'Instagram', 'ig'], ['twitter', 'Twitter / X', 'x'], ['facebook', 'Facebook', 'fb'], ['website', 'Website', 'globe']];

// Plus-only details: paid entry, site map. Socials are available from Standard
// up — rendered unconditionally below the (possibly locked) Plus section.
const _PlusDetails = ({ isPlus, entryFeeOn, setEntryFeeOn, entryFee, setEntryFee, amenities, setAmenities, vendors, setVendors, vName, setVName, vType, setVType, socials, setSocials, mapOpen, setMapOpen, amenQuery, setAmenQuery, vLogo, setVLogo, section = 'all' }) => {
  // `section` lets the desktop layout split this component across two spots:
  // 'main' renders everything except the map's expanded body (which desktop
  // instead renders full-width below the two-column grid, via 'mapBody').
  // Mobile always uses the default 'all', identical to the original layout.
  const socialsField =
  <Field label="Socials" hint="Shown on card when present">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {SOCIAL_FIELDS.map(([key, label]) =>
      <input key={key} value={socials[key]} onChange={(e) => setSocials((s) => ({ ...s, [key]: e.target.value }))} placeholder={label + ' link'} style={{ ...inputStyle, padding: '11px 14px' }} />
      )}
      </div>
    </Field>;

  if (!isPlus) {
    if (section === 'mapBody') return null;
    return (
      <div>
        <div style={{ marginTop: 8, marginBottom: 20, padding: 16, borderRadius: 16, border: '1px dashed rgba(255,255,255,0.14)', background: 'var(--app-card-bg)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="lock" size={16} color="var(--app-text-faint)" />
          <span style={{ fontSize: 12.5, color: 'var(--app-text-muted)', lineHeight: 1.4 }}>Paid entry &amp; site map unlock with the <b style={{ color: '#FCA311' }}>Plus</b> tier.</span>
        </div>
        {socialsField}
      </div>);

  }
  const toggleAmenity = (a) => setAmenities((arr) => arr.includes(a) ? arr.filter((x) => x !== a) : [...arr, a]);
  const addAmenity = () => {
    const v = amenQuery.trim();if (!v) return;
    const canon = SITE_AMENITIES.find((a) => a.toLowerCase() === v.toLowerCase()) || v;
    if (!amenities.some((a) => a.toLowerCase() === canon.toLowerCase())) setAmenities((arr) => [...arr, canon]);
    setAmenQuery('');
  };
  const amenSuggestions = amenQuery.trim() ?
  SITE_AMENITIES.filter((a) => a.toLowerCase().includes(amenQuery.toLowerCase()) && !amenities.some((x) => x.toLowerCase() === a.toLowerCase())).slice(0, 4) :
  [];
  const customAmenities = amenities.filter((a) => !SITE_AMENITIES.includes(a));
  const addVendor = () => {if (!vName.trim()) return;setVendors((v) => [...v, { name: vName.trim(), type: vType.trim() || 'Vendor', logo: vLogo }]);setVName('');setVType('');setVLogo(false);};
  const sub = { fontSize: 10, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--app-text-faint)' };
  const stepBtn = { all: 'unset', cursor: 'pointer', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FCA311', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 18, background: 'var(--app-icon-chip-bg)' };
  const bumpFee = (d) => setEntryFee((v) => String(Math.max(0, (parseInt(v, 10) || 0) + d)));

  const mapBodyInner = (
    <div style={{ padding: section === 'mapBody' ? 0 : '0 16px 18px' }}>
      {section !== 'mapBody' &&
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '10px 12px', borderRadius: 12, background: 'rgba(252,163,17,0.08)', border: '1px solid rgba(252,163,17,0.22)', marginBottom: 16 }}>
          <Icon name="monitor" size={14} color="#FCA311" />
          <span style={{ fontSize: 11.5, color: '#ffd9a0', lineHeight: 1.45 }}>These tools work best on desktop — finish on a computer anytime.</span>
        </div>
      }

      <button style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', height: 100, borderRadius: 14, border: '1px dashed rgba(255,255,255,0.18)', background: 'repeating-linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0.03) 8px,rgba(255,255,255,0.05) 8px,rgba(255,255,255,0.05) 16px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Icon name="map" size={20} color="#FCA311" />
        <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(238,240,255,0.6)' }}>Upload site map image</span>
      </button>

      <div style={{ ...sub, margin: '16px 0 8px' }}>Amenity markers</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {SITE_AMENITIES.map((a) => <_Pill key={a} active={amenities.includes(a)} label={a} onClick={() => toggleAmenity(a)} />)}
        {customAmenities.map((a) => <_Pill key={a} active label={a} onClick={() => toggleAmenity(a)} removable />)}
      </div>
      <div style={{ position: 'relative', marginTop: 10 }} onKeyDown={(e) => {if (e.key === 'Enter') {e.preventDefault();addAmenity();}}}>
        <TextField value={amenQuery} onChange={setAmenQuery} placeholder="Add an amenity" icon="plus" />
      </div>
      {amenSuggestions.length > 0 &&
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {amenSuggestions.map((s) => <_Pill key={s} label={s} onClick={() => {toggleAmenity(s);setAmenQuery('');}} subtle />)}
        </div>
      }
      {amenQuery.trim() && <button onClick={addAmenity} style={{ all: 'unset', cursor: 'pointer', marginTop: 8, fontSize: 12, fontWeight: 800, color: '#FCA311' }}>+ Add “{amenQuery.trim()}”</button>}

      <div style={{ ...sub, margin: '18px 0 8px' }}>Vendors</div>
      {vendors.map((v, i) =>
      <div key={i} style={{ padding: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 12, color: '#FCA311', ...(v.logo ? { background: 'repeating-linear-gradient(135deg,#3a2d24,#3a2d24 4px,#46362b 4px,#46362b 8px)', border: '1px solid var(--app-card-border)' } : { background: 'rgba(252,163,17,0.12)', border: '1px solid rgba(252,163,17,0.28)' }) }}>{v.logo ? <Icon name="image" size={13} color="rgba(238,240,255,0.6)" /> : v.name[0].toUpperCase()}</span>
            <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: 'var(--app-text)' }}>{v.name}</span>
            <button onClick={() => setVendors((arr) => arr.filter((_, idx) => idx !== i))} aria-label="Remove vendor" style={{ all: 'unset', cursor: 'pointer', display: 'flex' }}><Icon name="x" size={13} color="var(--app-text-faint)" /></button>
          </div>
          <div style={{ marginLeft: 40, marginTop: 3, fontSize: 11, fontWeight: 600, color: 'rgba(238,240,255,0.5)' }}>{v.type}</div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'stretch' }} onKeyDown={(e) => {if (e.key === 'Enter') {e.preventDefault();addVendor();}}}>
        <button onClick={() => setVLogo((l) => !l)} aria-label="Add vendor logo" style={{ all: 'unset', cursor: 'pointer', width: 42, flexShrink: 0, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, ...(vLogo ? { background: 'rgba(252,163,17,0.16)', border: '1px solid rgba(252,163,17,0.4)' } : { background: 'var(--app-icon-chip-bg)', border: '1px dashed rgba(255,255,255,0.2)' }) }}>
          <Icon name={vLogo ? 'check' : 'image'} size={15} color="#FCA311" />
          <span style={{ fontSize: 7, fontWeight: 800, color: 'rgba(238,240,255,0.5)' }}>logo</span>
        </button>
        <input value={vName} onChange={(e) => setVName(e.target.value)} placeholder="Vendor name" style={{ ...inputStyle, padding: '10px 12px', flex: 1 }} />
        <input value={vType} onChange={(e) => setVType(e.target.value)} placeholder="Type" style={{ ...inputStyle, padding: '10px 12px', width: 80 }} />
        <button onClick={addVendor} style={{ all: 'unset', cursor: 'pointer', width: 42, flexShrink: 0, borderRadius: 12, background: 'rgba(252,163,17,0.14)', border: '1px solid rgba(252,163,17,0.32)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" size={16} color="#FCA311" /></button>
      </div>
    </div>
  );

  if (section === 'mapBody') {
    return mapOpen ? (
      <div style={{ borderRadius: 16, border: '1px solid var(--app-card-border)', background: 'var(--app-card-bg)', padding: '18px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Icon name="map" size={16} color="#FCA311" />
          <span style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 15, color: 'var(--app-text)' }}>Site map &amp; vendors</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--app-text-muted)', marginBottom: 16 }}>{amenities.length} amenities · {vendors.length} vendors</div>
        {mapBodyInner}
      </div>
    ) : null;
  }

  return (
    <div>
      <Field label="Entry fee" hint="Plus">
        <div style={{ borderRadius: 14, border: '1px solid var(--app-card-border)', background: 'var(--app-icon-chip-bg)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px' }}>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: 'var(--app-text)' }}>{entryFeeOn ? 'Paid entry' : 'Free entry'}</span>
            <button onClick={() => setEntryFeeOn((v) => !v)} aria-label="Toggle paid entry" style={{ all: 'unset', cursor: 'pointer', flexShrink: 0, width: 46, height: 28, borderRadius: 9999, padding: 3, boxSizing: 'border-box', background: entryFeeOn ? 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' : 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: entryFeeOn ? 'flex-end' : 'flex-start', transition: 'all .2s ease' }}>
              <div style={{ width: 22, height: 22, borderRadius: 9999, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}></div>
            </button>
          </div>
          {entryFeeOn &&
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(238,240,255,0.6)' }}>Amount per person</span>
              <div style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--app-card-border)', borderRadius: 10, overflow: 'hidden' }}>
                <button onClick={() => bumpFee(-1)} aria-label="Decrease" style={stepBtn}>–</button>
                <label style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '4px 8px', margin: '4px 2px', borderRadius: 7, background: 'var(--app-card-bg)', cursor: 'text' }}>
                  <span style={{ color: '#FCA311', fontWeight: 900, fontSize: 13 }}>$</span>
                  <input inputMode="numeric" pattern="[0-9]*" value={entryFee} onChange={(e) => setEntryFee(e.target.value.replace(/\D/g, ''))} onFocus={(e) => e.target.select()} onBlur={(e) => {if (e.target.value === '') setEntryFee('0');}} style={{ width: 42, textAlign: 'center', background: 'transparent', border: 'none', outline: 'none', color: 'var(--app-text)', fontFamily: 'Inter', fontSize: 15, fontWeight: 800 }} />
                </label>
                <button onClick={() => bumpFee(1)} aria-label="Increase" style={stepBtn}>+</button>
              </div>
            </div>
          }
        </div>
      </Field>

      {/* Site map + amenities + vendors — collapsible. At desktop (section="main")
          the expanded body renders elsewhere (see "mapBody" above); mobile shows
          it inline, right below the toggle, with the "works best on desktop" note. */}
      <div style={{ marginBottom: 16, borderRadius: 16, border: '1px solid var(--app-card-border)', background: 'var(--app-card-bg)', overflow: 'hidden' }}>
        <button onClick={() => setMapOpen((o) => !o)} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '14px 16px' }}>
          <Icon name="map" size={17} color="#FCA311" />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 14, color: 'var(--app-text)' }}>Site map &amp; vendors</span>
            <span style={{ display: 'block', fontSize: 11, color: 'rgba(238,240,255,0.5)', marginTop: 1 }}>{amenities.length} amenities · {vendors.length} vendors</span>
          </span>
          <span style={{ ...sub, color: '#FCA311', flexShrink: 0 }}>Plus</span>
          <span style={{ flexShrink: 0, transform: mapOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s ease', display: 'flex' }}><Icon name="chev-right" size={16} color="var(--app-text-faint)" /></span>
        </button>

        {section === 'all' && mapOpen && mapBodyInner}
      </div>

      {socialsField}
    </div>);

};

// Review — full-glory stub with Card/Map toggle, detail overview, Plus
// callout, and ONE clean price line. Publish lives in the footer.
const _ReviewStep = ({ previewEvent, start, end, days, startTime, endTime, venueName, address, desc, cats, tier, price, isPlus, entryFeeOn, entryFee, amenities, vendors, socials, canPublish, missing }) => {
  const [view, setView] = React.useState('card');
  const tierName = isPlus ? 'Plus' : 'Standard';
  const dateLabel = start === end ? new Date(start + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : `${start} → ${end}`;
  const timeLabel = _fmtTime(startTime) + (endTime ? ' – ' + _fmtTime(endTime) : '');
  const activeSocials = SOCIAL_FIELDS.filter(([k]) => (socials[k] || '').trim());
  const rows = [
  ['When', `${dateLabel} · ${timeLabel}`],
  ['Where', venueName.trim() && address.trim() ? `${venueName.trim()} · ${address.trim()}` : venueName.trim() || address.trim() || '—'],
  ['Entry', isPlus && entryFeeOn ? `$${Number(entryFee) || 0} per person` : 'Free entry'],
  ['Price', `$${price} · ${tierName} · ${_bandLabel(days)}`]];

  return (
    <div>
      <h2 style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 20, letterSpacing: '-0.01em', color: 'var(--app-text)', margin: '0 0 16px' }}>Review</h2>

      <div style={{ display: 'inline-flex', gap: 4, padding: 4, borderRadius: 12, background: 'var(--app-icon-chip-bg)', border: '1px solid var(--app-card-border)', marginBottom: 14 }}>
        {[['card', 'Card'], ['map', 'Map']].map(([id, lbl]) =>
        <button key={id} onClick={() => setView(id)} style={{ all: 'unset', cursor: 'pointer', padding: '7px 18px', borderRadius: 9, fontFamily: 'Montserrat', fontWeight: 900, fontSize: 12, color: view === id ? '#14213D' : 'rgba(238,240,255,0.6)', background: view === id ? 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' : 'transparent' }}>{lbl}</button>
        )}
      </div>

      {view === 'card' ?
      <EventStub variant="photo" event={previewEvent} priceInBody onTap={() => {}} /> :

      <div style={{ position: 'relative', height: 200, borderRadius: 18, overflow: 'hidden', border: '1px solid var(--app-card-border)', background: 'repeating-linear-gradient(0deg,#16233f,#16233f 22px,#1a2a49 22px,#1a2a49 44px), repeating-linear-gradient(90deg,transparent,transparent 22px,rgba(255,255,255,0.04) 22px,rgba(255,255,255,0.04) 44px)' }}>
          <div style={{ position: 'absolute', top: '46%', left: '50%', transform: 'translate(-50%,-100%)' }}>
            <Icon name="pin" size={34} color="#ff6348" />
          </div>
          <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, padding: '10px 12px', borderRadius: 12, background: 'rgba(7,11,20,0.78)', backdropFilter: 'blur(6px)' }}>
            <div style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 13, color: 'var(--app-text)' }}>{venueName.trim() || 'Your venue'}</div>
            <div style={{ fontSize: 11, color: 'rgba(238,240,255,0.6)', marginTop: 2 }}>{address.trim() || 'Map location'}</div>
          </div>
        </div>
      }

      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--app-card-bg)', border: '1px solid var(--app-card-border)', borderRadius: 18, overflow: 'hidden', marginTop: 16 }}>
        {rows.map(([k, v]) =>
        <div key={k} style={{ display: 'flex', gap: 12, padding: '13px 16px', background: 'rgba(255,255,255,0.015)' }}>
            <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--app-text-faint)', width: 64, flexShrink: 0, paddingTop: 2 }}>{k}</span>
            <span style={{ fontSize: 14, fontWeight: k === 'Price' ? 800 : 600, color: k === 'Price' ? '#FCA311' : 'var(--app-text)', lineHeight: 1.4, minWidth: 0 }}>{v}</span>
          </div>
        )}
      </div>

      {desc.trim() && desc.replace(/<[^>]*>/g, '').trim() &&
      <div style={{ fontSize: 13, color: 'var(--app-text-muted)', lineHeight: 1.55, margin: '14px 2px 0' }} dangerouslySetInnerHTML={{ __html: desc }}></div>
      }

      {isPlus &&
      <div style={{ marginTop: 16, padding: 16, borderRadius: 16, background: 'rgba(255,99,72,0.07)', border: '1px solid rgba(255,99,72,0.30)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Icon name="sparkles" size={15} color="#ff8a72" />
            <span style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 13, color: '#ff8a72', letterSpacing: '0.02em' }}>Plus features active</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {entryFeeOn && <_Chip label={`Paid entry · $${Number(entryFee) || 0}`} />}
            {amenities.length > 0 && <_Chip label={`Site map · ${amenities.length} amenities`} />}
            {vendors.length > 0 && <_Chip label={`${vendors.length} vendor${vendors.length > 1 ? 's' : ''}`} />}
            {activeSocials.map(([k, lbl]) => <_Chip key={k} label={lbl} icon="globe" />)}
            {!entryFeeOn && amenities.length === 0 && vendors.length === 0 && activeSocials.length === 0 && <span style={{ fontSize: 12, color: 'rgba(238,240,255,0.5)' }}>Add details on the previous step to use them.</span>}
          </div>
        </div>
      }

      {!canPublish &&
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, padding: '11px 14px', borderRadius: 12, background: 'rgba(255,99,72,0.08)', border: '1px solid rgba(255,99,72,0.30)' }}>
          <Icon name="pin" size={13} color="#ff8a72" />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#ffb5a3' }}>Add {missing.join(', ')} to publish.</span>
        </div>
      }
    </div>);

};

const _Chip = ({ label, icon }) =>
<span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 9999, background: 'var(--app-icon-chip-bg)', border: '1px solid var(--app-card-border)', fontSize: 11.5, fontWeight: 700, color: 'var(--app-text)' }}>
    {icon && <Icon name={icon} size={12} color="#FCA311" />}{label}
  </span>;


// ===========================================================================
// CHECKOUT — Stripe-style screen. Order summary → card fields → mock pay →
// success. No real charge; production wires the real PSP.
// ===========================================================================
// Payment-brand marks — recognizable wordmarks (not pixel-copied logos).
const _PayMark = ({ id }) => {
  if (id === 'applepay') return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      <svg width="13" height="16" viewBox="0 0 17 20" fill="#fff" aria-hidden="true"><path d="M11.2 3.2c.6-.8 1-1.8.9-2.9-.9 0-2 .6-2.6 1.3-.6.7-1.1 1.7-.9 2.7 1 .1 2-.5 2.6-1.1zM12.1 5.2c-1.4-.1-2.6.8-3.3.8-.7 0-1.7-.8-2.8-.7-1.5 0-2.8.9-3.6 2.2-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.7 2.1 1.1 0 1.5-.7 2.8-.7 1.3 0 1.6.7 2.8.7 1.2 0 1.9-1 2.6-2.1.8-1.2 1.2-2.3 1.2-2.4-.1 0-2.3-.9-2.3-3.4 0-2.1 1.7-3.1 1.8-3.1-1-1.5-2.5-1.6-3-1.7z" /></svg>
      <span style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: 13, color: 'var(--app-text)' }}>Pay</span>
    </span>);

  if (id === 'googlepay') return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <svg width="15" height="15" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </svg>
      <span style={{ fontFamily: 'Montserrat', fontWeight: 600, fontSize: 13, color: 'var(--app-text)' }}>Pay</span>
    </span>);

  if (id === 'link') return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 18, height: 18, borderRadius: 5, background: '#00D66F', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#053d24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M7 6l6 6-6 6M13 6l5 6-5 6" /></svg>
      </span>
      <span style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: 13, color: '#00D66F' }}>Link</span>
    </span>);

  return null;
};

const CheckoutScreen = ({ order, onBack, onPaid, desktop }) => {
  const [method, setMethod] = React.useState('card');
  const [card, setCard] = React.useState('');
  const [exp, setExp] = React.useState('');
  const [cvc, setCvc] = React.useState('');
  const [name, setName] = React.useState('');
  const [paying, setPaying] = React.useState(false);
  const cardValid = card.replace(/\s/g, '').length >= 15 && exp.length >= 4 && cvc.length >= 3 && name.trim();
  const valid = method === 'card' ? cardValid : true;
  const payLabel = { card: 'Pay to publish', applepay: 'Pay with Apple Pay', googlepay: 'Pay with Google Pay', link: 'Pay with Link' }[method];
  const pay = () => {
    if (!valid || paying) return;
    setPaying(true);
    setTimeout(() => onPaid(), 1400);
  };
  const fmtCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const fmtExp = (v) => {const d = v.replace(/\D/g, '').slice(0, 4);return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d;};
  const lbl = { fontSize: 10, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--app-text-faint)', marginBottom: 6, display: 'block' };
  const fieldBox = { ...inputStyle, padding: '13px 14px' };
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      {!desktop && <StatusBar />}
      <SubHeader crumb="Checkout · Secure payment" onBack={onBack} />
      <div style={{ flex: 1, overflow: 'auto', padding: desktop ? '40px 24px 60px' : '4px 24px 28px' }}>
        <div style={desktop ? { maxWidth: 560, margin: '0 auto' } : undefined}>
        <h1 style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 26, letterSpacing: '-0.01em', margin: '0 0 18px', color: 'var(--app-text)' }}>Pay to publish</h1>

        {/* Order summary */}
        <div style={{ padding: 18, borderRadius: 18, background: 'var(--app-card-bg)', border: '1px solid var(--app-card-border)', marginBottom: 22 }}>
          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--app-text-faint)', marginBottom: 10 }}>Order summary</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 15, color: 'var(--app-text)' }}>{order.title}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--app-text-muted)' }}>
            <span>{order.tier === 'plus' ? 'Plus' : 'Standard'} · {order.bandLabel}</span>
            <span style={{ fontWeight: 800, color: 'var(--app-text)' }}>${order.price}.00</span>
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '14px 0' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontWeight: 800, color: 'var(--app-text)' }}>Total due today</span>
            <span style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 22, color: '#FCA311' }}>${order.price}.00</span>
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--app-text-faint)', marginTop: 8 }}>One-time charge · not a subscription</div>
        </div>

        {/* Payment method — the full Stripe wallet set. Mock only. */}
        <div style={{ ...lbl, marginBottom: 8 }}>Payment method</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 18 }}>
          {[['applepay', 'Apple Pay', ' Pay'], ['googlepay', 'Google Pay', 'G Pay'], ['link', 'Link', 'Link'], ['card', 'Card', null]].map(([id, label, wordmark]) => {
            const sel = method === id;
            return (
              <button key={id} onClick={() => setMethod(id)} style={{
                all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, padding: '13px 14px', borderRadius: 13,
                border: `1.5px solid ${sel ? 'rgba(252,163,17,0.5)' : 'rgba(255,255,255,0.1)'}`,
                background: sel ? 'rgba(252,163,17,0.08)' : 'rgba(255,255,255,0.03)'
              }}>
                <span style={{ width: 16, height: 16, borderRadius: 9999, flexShrink: 0, border: `2px solid ${sel ? '#FCA311' : 'rgba(255,255,255,0.25)'}`, background: sel ? '#FCA311' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{sel && <Icon name="check" size={9} color="#14213D" />}</span>
                {id === 'card' ?
                <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Icon name="creditcard" size={16} color="var(--app-text)" /><span style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: 13, color: 'var(--app-text)' }}>Card</span></span> :
                <_PayMark id={id} />}
              </button>);

          })}
        </div>

        {method === 'card' ?
        <React.Fragment>
            <label><span style={lbl}>Card number</span><input value={card} onChange={(e) => setCard(fmtCard(e.target.value))} inputMode="numeric" placeholder="4242 4242 4242 4242" style={fieldBox} /></label>
            <div style={{ display: 'flex', gap: 12, margin: '14px 0' }}>
              <label style={{ flex: 1 }}><span style={lbl}>Expiry</span><input value={exp} onChange={(e) => setExp(fmtExp(e.target.value))} inputMode="numeric" placeholder="MM/YY" style={fieldBox} /></label>
              <label style={{ flex: 1 }}><span style={lbl}>CVC</span><input value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" placeholder="123" style={fieldBox} /></label>
            </div>
            <label><span style={lbl}>Name on card</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan Chen" style={fieldBox} /></label>
          </React.Fragment> :

        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '16px 16px', borderRadius: 14, background: 'var(--app-card-bg)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Icon name="check" size={16} color="#4ade80" />
            <span style={{ fontSize: 12.5, color: 'rgba(238,240,255,0.7)', lineHeight: 1.4 }}>You’ll confirm with {payLabel.replace('Pay with ', '')} on the next tap. No card details needed.</span>
          </div>
        }

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 18, fontSize: 11, color: 'var(--app-text-faint)' }}>
          <Icon name="lock" size={12} color="var(--app-text-faint)" />
          Payments are encrypted · test mode
        </div>
        </div>
      </div>

      <div style={{ flexShrink: 0, padding: '14px 24px calc(14px + env(safe-area-inset-bottom))', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(20,33,61,0.55)' }}>
        <div style={desktop ? { maxWidth: 560, margin: '0 auto' } : undefined}>
        <button onClick={pay} disabled={!valid || paying} style={{
          all: 'unset', boxSizing: 'border-box', cursor: valid && !paying ? 'pointer' : 'not-allowed', width: '100%', padding: '17px 22px', borderRadius: 16, textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 15,
          ...(valid && !paying ? { backgroundImage: 'linear-gradient(135deg,#ff5f4e 0%,#ff8c38 50%,#ffca3a 100%)', color: '#14213D', boxShadow: '0 10px 26px -8px rgba(255,95,78,0.55)' } : { background: 'var(--app-card-bg)', color: 'rgba(238,240,255,0.4)' })
        }}>{paying ? 'Processing…' : `${payLabel} · $${order.price}.00`}</button>
        </div>
      </div>
    </div>);

};

// Generic success/confirmation screen — used for publish + RSVP.
const ConfirmScreen = ({ icon = 'check', title, body, primaryLabel, onPrimary, secondaryLabel, onSecondary }) =>
<div style={{ height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
    <StatusBar />
    <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,99,72,0.20)', filter: 'blur(90px)', pointerEvents: 'none' }}></div>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', position: 'relative', textAlign: 'center' }}>
      <div style={{
      width: 84, height: 84, borderRadius: 9999, marginBottom: 26,
      background: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 14px 40px rgba(255,95,78,0.35)'
    }}>
        <Icon name={icon} size={38} color="#14213D" />
      </div>
      <h1 style={{ fontFamily: 'Montserrat', fontSize: 28, fontWeight: 900, letterSpacing: '-0.01em', lineHeight: 1.1, margin: '0 0 12px', color: 'var(--app-text)' }}>{title}</h1>
      <p style={{ fontSize: 14, color: 'var(--app-text-muted)', lineHeight: 1.6, margin: '0 0 32px', maxWidth: 280 }}>{body}</p>
      <div style={{ width: '100%', maxWidth: 300 }}>
        <SparkButton size="lg" onClick={onPrimary}>{primaryLabel}</SparkButton>
        {secondaryLabel &&
      <button onClick={onSecondary} style={{
        all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', textAlign: 'center',
        marginTop: 16, fontSize: 13, fontWeight: 700, color: 'var(--app-text-muted)'
      }}>{secondaryLabel}</button>
      }
      </div>
    </div>
  </div>;


// ===========================================================================
// SETTINGS — account rows + notification toggles + log out.
// ===========================================================================
const ToggleRow = ({ icon, label, sub, value, onChange }) =>
<button onClick={() => onChange(!value)} style={{
  all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%',
  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0'
}}>
    <div style={{
    width: 38, height: 38, borderRadius: 11, flexShrink: 0,
    background: 'var(--app-icon-chip-bg)', border: '1px solid var(--app-card-border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  }}>
      <Icon name={icon} size={16} color="#FCA311" />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--app-text)' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--app-text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
    <div style={{
    width: 44, height: 26, borderRadius: 9999, flexShrink: 0, padding: 3,
    background: value ? 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' : 'var(--app-surface-hover)',
    display: 'flex', justifyContent: value ? 'flex-end' : 'flex-start',
    transition: 'all .2s ease'
  }}>
      <div style={{ width: 20, height: 20, borderRadius: 9999, background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}></div>
    </div>
  </button>;


const LinkRow = ({ icon, label, onClick, danger }) =>
<button onClick={onClick} style={{
  all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%',
  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0'
}}>
    <div style={{
    width: 38, height: 38, borderRadius: 11, flexShrink: 0,
    background: danger ? 'rgba(255,99,72,0.10)' : 'var(--app-icon-chip-bg)',
    border: `1px solid ${danger ? 'rgba(255,99,72,0.25)' : 'var(--app-card-border)'}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  }}>
      <Icon name={icon} size={16} color={danger ? '#ff6348' : '#FCA311'} />
    </div>
    <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: danger ? '#ff6348' : 'var(--app-text)' }}>{label}</span>
    {!danger && <Icon name="chev-right" size={16} color="var(--app-text-faint)" />}
  </button>;


const Divider = () => <div style={{ height: 1, background: 'var(--app-divider)' }}></div>;

// ===========================================================================
// NOTIFICATIONS — three rows, each with an inline-editable subtitle value that
// mirrors Explore's zip/radius affordance (dotted-underline accent token).
//  • Push  : "Event reminders & RSVPs  [#]•[unit]"  (number + min/hr toggle)
//  • Nearby: "New events within [##] miles"          (radius number)
//  • Digest: "A [day] roundup email"                 (day-of-week picker)
// Disabled-when-off greys + freezes the value. A fit-gate (no interests) FORCES
// Push + Nearby off and LOCKS them with an "Add interests" link; Digest is the
// fallback for fit-less users and is never gated.
// ===========================================================================
const _NOTIF_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Inline day picker — a small in-place popover (NOT a modal); a backdrop closes it.
const _DayPopover = ({ day, onPick, onClose }) => (
  <React.Fragment>
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40 }}></div>
    <div style={{
      position: 'absolute', top: '150%', left: 0, zIndex: 41, minWidth: 150,
      background: '#0e1626', border: '1px solid var(--app-card-border)', borderRadius: 12,
      boxShadow: '0 16px 40px rgba(0,0,0,0.5)', padding: 6, display: 'flex', flexDirection: 'column', gap: 2,
    }}>
      {_NOTIF_DAYS.map((d) => (
        <button key={d} onClick={() => onPick(d)} style={{
          all: 'unset', cursor: 'pointer', padding: '7px 10px', borderRadius: 8, fontSize: 12.5, fontWeight: 700,
          color: d === day ? '#FCA311' : 'var(--app-text-muted)',
          background: d === day ? 'rgba(252,163,17,0.12)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        }}>
          {d}{d === day && <Icon name="check" size={12} color="#FCA311" />}
        </button>
      ))}
    </div>
  </React.Fragment>
);

// One notifications row. The toggle is its OWN hit target so tapping an inline
// value never flips the switch. `gated` = fit-locked: forced off, switch swapped
// for a locked pill, subtitle swapped for the "Add interests" link.
const NotifRow = ({ icon, label, on, gated, onToggle, onAddInterests, footer, children }) => {
  const displayOn = gated ? false : on;
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0' }}>
      <div style={{
        width: 38, height: 38, borderRadius: 11, flexShrink: 0,
        background: 'var(--app-icon-chip-bg)',
        border: '1px solid var(--app-card-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={16} color={gated ? 'var(--app-text-faint)' : '#FCA311'} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: gated ? 'var(--app-text-muted)' : 'var(--app-text)' }}>{label}</div>
        {gated ? (
          <button onClick={onAddInterests} style={{
            all: 'unset', cursor: 'pointer', marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 11.5, fontWeight: 800, color: '#FCA311',
          }}>
            <Icon name="lock" size={11} color="#FCA311" />
            Add interests to enable
            <span style={{ fontWeight: 900 }}>→</span>
          </button>
        ) : (
          <div style={{ fontSize: 11.5, color: 'var(--app-text-muted)', marginTop: 3, display: 'flex', alignItems: 'center', flexWrap: 'wrap', lineHeight: 1.5 }}>{children}</div>
        )}
        {footer}
      </div>
      {gated ? (
        <div title="Add interests to enable" style={{
          width: 44, height: 26, borderRadius: 9999, flexShrink: 0, boxSizing: 'border-box',
          background: 'var(--app-icon-chip-bg)', border: '1px dashed var(--app-border-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'not-allowed',
        }}>
          <Icon name="lock" size={12} color="var(--app-text-faint)" />
        </div>
      ) : (
        <button onClick={onToggle} aria-pressed={displayOn} style={{
          all: 'unset', cursor: 'pointer', width: 44, height: 26, borderRadius: 9999, flexShrink: 0, padding: 3, boxSizing: 'border-box',
          background: displayOn ? 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' : 'rgba(255,255,255,0.12)',
          display: 'flex', justifyContent: displayOn ? 'flex-end' : 'flex-start', transition: 'all .2s ease',
        }}>
          <div style={{ width: 20, height: 20, borderRadius: 9999, background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}></div>
        </button>
      )}
    </div>
  );
};

// 24h "HH:MM" → "9:00 PM". Used by the Quiet-hours row subtitle + pickers.
const _fmt12 = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number);
  const ap = h < 12 ? 'AM' : 'PM';
  let hh = h % 12; if (hh === 0) hh = 12;
  return `${hh}:${String(m).padStart(2, '0')} ${ap}`;
};
const NotifSection = ({ hasFit, onAddInterests,
  prefs = { push: true, nearby: true, digest: true, pushNum: 1, pushUnit: 'hr', radius: 25, day: 'Friday' },
  onChange = () => {}, onOpenQuiet }) => {
  const { push, nearby, digest, pushNum, pushUnit, radius, day } = prefs;
  const [editing, setEditing] = React.useState(null); // 'push' | 'radius' | null
  const [temp, setTemp] = React.useState('');
  const [dayOpen, setDayOpen] = React.useState(false);

  const pushGated = !hasFit;
  const nearbyGated = !hasFit;
  const pushEditable = push && !pushGated;
  const nearbyEditable = nearby && !nearbyGated;

  const beginPush = () => { if (!pushEditable) return; setTemp(String(pushNum)); setEditing('push'); };
  const commitPush = () => { let n = parseInt(temp, 10); if (isNaN(n) || n < 1) n = pushNum; n = Math.max(1, Math.min(999, n)); onChange({ pushNum: n }); setEditing(null); };
  const beginRadius = () => { if (!nearbyEditable) return; setTemp(String(radius)); setEditing('radius'); };
  const commitRadius = () => { let n = parseInt(temp, 10); if (isNaN(n)) n = radius; n = Math.max(1, Math.min(100, n)); onChange({ radius: n }); setEditing(null); };
  const toggleUnit = () => { if (!pushEditable) return; onChange({ pushUnit: pushUnit === 'hr' ? 'min' : 'hr' }); };

  const dottedBtn = { all: 'unset', cursor: 'pointer', color: '#FCA311', fontWeight: 800, borderBottom: '1.5px dotted rgba(252,163,17,0.6)', lineHeight: 1.2 };
  const greyVal = { color: 'var(--app-text-faint)', fontWeight: 800 };
  const numInput = { background: 'rgba(252,163,17,0.12)', border: '1px solid rgba(252,163,17,0.45)', borderRadius: 7, padding: '0 5px', color: '#FCA311', fontFamily: 'Inter', fontSize: 11.5, fontWeight: 800, outline: 'none', appearance: 'textfield', MozAppearance: 'textfield' };
  const sp = (w) => <span style={{ width: w, display: 'inline-block' }}></span>;

  // Subordinate supporting link under Push's frequency field — muted accent,
  // smaller + thinner underline than the editable value, so it reads as a link
  // rather than a primary control. Entry point to the Quiet hours screen.
  const quietLink = (
    <button onClick={onOpenQuiet} style={{
      all: 'unset', cursor: 'pointer', marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 700, color: 'rgba(252,163,17,0.80)',
      borderBottom: '1px solid rgba(252,163,17,0.30)', lineHeight: 1.3, paddingBottom: 1,
    }}>
      <Icon name="moon" size={11} color="rgba(252,163,17,0.80)" />
      Quiet hours
    </button>
  );

  const pushSub = (
    <React.Fragment>
      <span>Event reminders &amp; RSVPs</span>{sp(10)}
      {!pushEditable
        ? <span style={greyVal}>{pushNum}&#8226;{pushUnit}</span>
        : <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            {editing === 'push'
              ? <input autoFocus type="text" inputMode="numeric" value={temp}
                  onChange={(e) => setTemp(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                  onBlur={commitPush} onKeyDown={(e) => { if (e.key === 'Enter') commitPush(); }}
                  style={{ ...numInput, width: 30 }} />
              : <button onClick={beginPush} style={dottedBtn}>{pushNum}</button>}
            <span style={{ color: 'rgba(252,163,17,0.7)', fontWeight: 900, margin: '0 4px' }}>&#8226;</span>
            <button onClick={toggleUnit} style={dottedBtn}>{pushUnit}</button>
          </span>}
    </React.Fragment>
  );

  const nearbySub = (
    <React.Fragment>
      <span>New events within</span>{sp(5)}
      {!nearbyEditable
        ? <span style={greyVal}>{radius}</span>
        : (editing === 'radius'
            ? <input autoFocus type="text" inputMode="numeric" value={temp}
                onChange={(e) => setTemp(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                onBlur={commitRadius} onKeyDown={(e) => { if (e.key === 'Enter') commitRadius(); }}
                style={{ ...numInput, width: 34 }} />
            : <button onClick={beginRadius} style={dottedBtn}>{radius}</button>)}
      {sp(5)}<span>miles</span>
    </React.Fragment>
  );

  const digestSub = (
    <React.Fragment>
      <span>A</span>{sp(5)}
      {!digest
        ? <span style={greyVal}>{day}</span>
        : <span style={{ position: 'relative', display: 'inline-block' }}>
            <button onClick={() => setDayOpen((o) => !o)} style={dottedBtn}>{day}</button>
            {dayOpen && <_DayPopover day={day} onPick={(d) => { onChange({ day: d }); setDayOpen(false); }} onClose={() => setDayOpen(false)} />}
          </span>}
      {sp(5)}<span>roundup email</span>
    </React.Fragment>
  );

  return (
    <div style={{ marginTop: 6, marginBottom: 18 }}>
      <NotifRow icon="bell" label="Push notifications" on={push} gated={pushGated}
        onToggle={() => { setEditing(null); onChange({ push: !push }); }} onAddInterests={onAddInterests}
        footer={quietLink}>
        {pushSub}
      </NotifRow>
      <Divider />
      <NotifRow icon="pin" label="Nearby events" on={nearby} gated={nearbyGated}
        onToggle={() => { setEditing(null); onChange({ nearby: !nearby }); }} onAddInterests={onAddInterests}>
        {nearbySub}
      </NotifRow>
      <Divider />
      <NotifRow icon="mail" label="Weekly digest" on={digest} gated={false}
        onToggle={() => { setDayOpen(false); onChange({ digest: !digest }); }}>
        {digestSub}
      </NotifRow>
    </div>
  );
};

// ===========================================================================
// QUIET HOURS \u2014 design-only surface (no firing/scheduling here).
//  Part 1: an editable start/end window (native time pickers, 9PM\u20139AM default).
//  Part 2: a single-select override for reminders of saved events that start
//          inside the window \u2014 Never / Ask each time (default) / Always.
// Both persist via lifted app state (`quiet`) so leave/return keeps the choice.
// ===========================================================================
const QUIET_OVERRIDES = [
  { id: 'never', label: 'Never', desc: 'Reminders for late events are held until quiet hours end.' },
  { id: 'ask', label: 'Ask each time', desc: 'You get a prompt to allow that one reminder.' },
  { id: 'always', label: 'Always', desc: 'Late-event reminders come through even during quiet hours.' },
];

// 24h "HH:MM" <-> {h12, min, mer}. Custom stepper picker (native <input type=time>
// with opacity:0 gave no visible affordance and never opened reliably in-frame).
const _to12 = (hhmm) => { const [h, m] = String(hhmm).split(':').map(Number); return { h12: (h % 12) || 12, min: m, mer: h < 12 ? 'AM' : 'PM' }; };
const _to24 = ({ h12, min, mer }) => { let h = h12 % 12; if (mer === 'PM') h += 12; return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`; };

const _stepBtn = { all: 'unset', cursor: 'pointer', width: 40, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, color: '#FCA311', fontSize: 11, background: 'var(--app-icon-chip-bg)', border: '1px solid var(--app-card-border)' };
const _WheelCol = ({ value, onUp, onDown }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
    <button onClick={onUp} style={_stepBtn}>&#9650;</button>
    <div style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 26, color: 'var(--app-text)', width: 46, textAlign: 'center' }}>{value}</div>
    <button onClick={onDown} style={_stepBtn}>&#9660;</button>
  </div>
);

// In-place time picker popover (NOT a modal); a fixed backdrop closes it. Each
// adjustment commits live via onChange so the value persists in lifted state.
// Positioned at the field's left edge, then clamped so it never overflows the
// phone screen (shifts left for the END field; flips upward if it'd clip bottom).
const _TimePopover = ({ hhmm, onChange, onClose }) => {
  const t = _to12(hhmm);
  const set = (patch) => onChange(_to24({ ...t, ...patch }));
  const ref = React.useRef(null);
  const [pos, setPos] = React.useState({ dx: 0, up: false });
  React.useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    // Nearest clipping ancestor = the phone screen (overflow:hidden, ~390px).
    let screen = el.parentElement;
    while (screen && getComputedStyle(screen).overflow !== 'hidden') screen = screen.parentElement;
    const clip = screen ? screen.getBoundingClientRect() : { left: 0, right: window.innerWidth, bottom: window.innerHeight, width: window.innerWidth };
    const field = el.offsetParent ? el.offsetParent.getBoundingClientRect() : el.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const scale = (clip.width / 390) || 1;
    const m = 12 * scale;
    // Horizontal: shift into view (works from the current, un-shifted left:0 base).
    let dxS = 0;
    if (r.right > clip.right - m) dxS = (clip.right - m) - r.right;
    if (r.left + dxS < clip.left + m) dxS = (clip.left + m) - r.left;
    // Vertical: project the downward placement from the field; flip up if it clips.
    const downBottom = field.bottom + 8 * scale + r.height;
    const up = downBottom > clip.bottom - m;
    const dx = dxS / scale;
    setPos((p) => (Math.abs(p.dx - dx) > 0.5 || p.up !== up ? { dx, up } : p));
  }, []); // anchor ONCE on open; stepping values must not re-position it
  const vertical = pos.up ? { bottom: 'calc(100% + 8px)' } : { top: 'calc(100% + 8px)' };
  return (
    <React.Fragment>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40 }}></div>
      <div ref={ref} style={{
        position: 'absolute', left: 0, zIndex: 41, ...vertical,
        transform: `translateX(${pos.dx}px)`,
        background: '#0e1626', border: '1px solid var(--app-card-border)', borderRadius: 16,
        boxShadow: '0 16px 40px rgba(0,0,0,0.5)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <_WheelCol value={String(t.h12)} onUp={() => set({ h12: t.h12 === 12 ? 1 : t.h12 + 1 })} onDown={() => set({ h12: t.h12 === 1 ? 12 : t.h12 - 1 })} />
        <span style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 24, color: 'rgba(238,240,255,0.5)' }}>:</span>
        <_WheelCol value={String(t.min).padStart(2, '0')} onUp={() => set({ min: (t.min + 5) % 60 })} onDown={() => set({ min: (t.min + 55) % 60 })} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 6 }}>
          {['AM', 'PM'].map((mm) => (
            <button key={mm} onClick={() => set({ mer: mm })} style={{
              all: 'unset', cursor: 'pointer', padding: '9px 14px', borderRadius: 10, fontFamily: 'Montserrat', fontWeight: 900, fontSize: 13, textAlign: 'center',
              color: t.mer === mm ? '#14213D' : 'var(--app-text-muted)',
              background: t.mer === mm ? 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' : 'rgba(255,255,255,0.05)',
            }}>{mm}</button>
          ))}
        </div>
      </div>
    </React.Fragment>
  );
};

// Time field \u2014 tap to open the stepper popover in place.
const _TimePick = ({ label, value, open, onOpen, onChange, onClose }) => (
  <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--app-text-faint)', marginBottom: 8 }}>{label}</div>
    <button onClick={onOpen} style={{
      all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%',
      display: 'flex', alignItems: 'center', gap: 10,
      background: open ? 'rgba(252,163,17,0.10)' : 'rgba(255,255,255,0.04)',
      border: open ? '1px solid rgba(252,163,17,0.45)' : '1px solid rgba(255,255,255,0.10)', borderRadius: 14, padding: '13px 14px',
    }}>
      <Icon name="clock" size={16} color="#FCA311" />
      <span style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 16, letterSpacing: '-0.01em', color: 'var(--app-text)' }}>{_fmt12(value)}</span>
    </button>
    {open && <_TimePopover hhmm={value} onChange={onChange} onClose={onClose} />}
  </div>
);

const _OverrideOption = ({ opt, selected, onSelect }) => (
  <button onClick={onSelect} aria-pressed={selected} style={{
    all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%',
    display: 'flex', alignItems: 'flex-start', gap: 12, padding: 15, marginBottom: 10, borderRadius: 16,
    background: selected ? 'rgba(252,163,17,0.10)' : 'rgba(255,255,255,0.03)',
    border: selected ? '1.5px solid rgba(252,163,17,0.45)' : '1px solid rgba(255,255,255,0.08)',
    transition: 'all .15s ease',
  }}>
    <span style={{
      width: 20, height: 20, borderRadius: 9999, flexShrink: 0, marginTop: 1, boxSizing: 'border-box',
      border: selected ? '2px solid #FCA311' : '2px solid rgba(255,255,255,0.28)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {selected && <span style={{ width: 10, height: 10, borderRadius: 9999, background: '#FCA311' }}></span>}
    </span>
    <span style={{ flex: 1, minWidth: 0 }}>
      <span style={{ display: 'block', fontSize: 14, fontWeight: 800, color: selected ? '#fff' : 'rgba(238,240,255,0.90)' }}>{opt.label}</span>
      <span style={{ display: 'block', fontSize: 12, color: 'var(--app-text-muted)', marginTop: 3, lineHeight: 1.45 }}>{opt.desc}</span>
    </span>
  </button>
);

const QuietHoursScreen = ({ onBack, quiet = { start: '21:00', end: '09:00', override: 'ask' }, onChange = () => {} }) => {
  const [openPicker, setOpenPicker] = React.useState(null); // 'start' | 'end' | null
  return (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
    <StatusBar />
    <SubHeader crumb="Settings · Quiet hours" onBack={onBack} />
    <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 60px' }}>
      <h1 style={{ fontFamily: 'Montserrat', fontSize: 28, fontWeight: 900, letterSpacing: '-0.01em', margin: '0 0 8px', color: 'var(--app-text)' }}>Quiet hours</h1>
      <p style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--app-text-muted)', margin: '0 0 24px', maxWidth: 320 }}>Set a window where notifications stay silent.</p>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
        <_TimePick label="Start" value={quiet.start} open={openPicker === 'start'}
          onOpen={() => setOpenPicker('start')} onClose={() => setOpenPicker(null)} onChange={(v) => onChange({ start: v })} />
        <div style={{ height: 48, display: 'flex', alignItems: 'center', color: 'var(--app-text-faint)' }}>
          <Icon name="chev-right" size={18} color="var(--app-text-faint)" />
        </div>
        <_TimePick label="End" value={quiet.end} open={openPicker === 'end'}
          onOpen={() => setOpenPicker('end')} onClose={() => setOpenPicker(null)} onChange={(v) => onChange({ end: v })} />
      </div>
      <p style={{ fontSize: 12.5, color: 'var(--app-text-muted)', margin: '12px 0 0', display: 'flex', alignItems: 'center', gap: 7 }}>
        <Icon name="moon" size={13} color="#FCA311" />
        Notifications stay silent during these hours.
      </p>

      <div style={{ height: 1, background: 'var(--app-card-bg)', margin: '28px 0 22px' }}></div>

      <Eyebrow>Late-night event alerts</Eyebrow>
      <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--app-text-muted)', margin: '10px 0 16px', maxWidth: 330 }}>Some events you save start during quiet hours. Choose what happens when a reminder for one falls in this window.</p>

      {QUIET_OVERRIDES.map((opt) => (
        <_OverrideOption key={opt.id} opt={opt} selected={quiet.override === opt.id} onSelect={() => onChange({ override: opt.id })} />
      ))}
    </div>
  </div>
  );
};

// ===========================================================================
// PRIVACY — permission toggles (plain-language subtitles, no "cookies"),
// a Your Data section (download / delete, prototype-only), and two Legal
// cards. Delete opens an in-place confirm dialog with Cancel / Delete —
// no real deletion happens.
// ===========================================================================
const PrivacyScreen = ({ onBack, privacy = { location: true, analytics: false }, onChange = () => {} }) => {
  const [downloaded, setDownloaded] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const handleDownload = () => {
    setDownloaded(true);
    window.clearTimeout(handleDownload._t);
    handleDownload._t = window.setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowX: 'hidden', position: 'relative' }}>
      <StatusBar />
      <SubHeader crumb="Settings · Privacy" onBack={onBack} />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 60px' }}>
        <h1 style={{ fontFamily: 'Montserrat', fontSize: 28, fontWeight: 900, letterSpacing: '-0.01em', margin: '0 0 22px', color: 'var(--app-text)' }}>Privacy</h1>

        <Eyebrow>Permissions</Eyebrow>
        <div style={{ marginTop: 6, marginBottom: 24 }}>
          <ToggleRow icon="pin" label="Location"
            sub="Powers your distance-ranked feed — “what’s near me.” Used live, never stored."
            value={privacy.location} onChange={(v) => onChange({ location: v })} />
          <Divider />
          <ToggleRow icon="bolt" label="Usage analytics"
            sub="Anonymous stats that improve Sparked — and help local organizers see what their community loves."
            value={privacy.analytics} onChange={(v) => onChange({ analytics: v })} />
        </div>

        <Eyebrow>Your data</Eyebrow>
        <div style={{ marginTop: 6, marginBottom: 8 }}>
          <button onClick={handleDownload} style={{
            all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%',
            display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0'
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11, flexShrink: 0,
              background: 'var(--app-icon-chip-bg)', border: '1px solid var(--app-card-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Icon name="download" size={16} color="#FCA311" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--app-text)' }}>Download my data</div>
              <div style={{ fontSize: 11, color: 'var(--app-text-muted)', marginTop: 2 }}>Get a copy of everything we have.</div>
            </div>
            <Icon name="chev-right" size={16} color="var(--app-text-faint)" />
          </button>
          {downloaded && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, margin: '2px 0 10px 52px',
              fontSize: 11.5, fontWeight: 700, color: '#7ee787',
            }}>
              <Icon name="check" size={13} color="#7ee787" />
              We’ll email your data export shortly.
            </div>
          )}
          <Divider />
          <button onClick={() => setConfirmOpen(true)} style={{
            all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%',
            display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0'
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11, flexShrink: 0,
              background: 'rgba(255,99,72,0.10)', border: '1px solid rgba(255,99,72,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Icon name="trash" size={16} color="#ff6348" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#ff6348' }}>Delete account & data</div>
              <div style={{ fontSize: 11, color: 'var(--app-text-muted)', marginTop: 2 }}>Erases your account and everything tied to it.</div>
            </div>
            <Icon name="chev-right" size={16} color="var(--app-text-faint)" />
          </button>
        </div>

        <Eyebrow>Legal</Eyebrow>
        <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
          <button onClick={() => {}} style={{
            all: 'unset', boxSizing: 'border-box', cursor: 'pointer', flex: 1,
            background: 'var(--app-card-bg)', border: '1px solid var(--app-card-border)',
            borderRadius: 16, padding: '18px 14px', display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <Icon name="text" size={18} color="#FCA311" />
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--app-text)' }}>Terms of Service</span>
          </button>
          <button onClick={() => {}} style={{
            all: 'unset', boxSizing: 'border-box', cursor: 'pointer', flex: 1,
            background: 'var(--app-card-bg)', border: '1px solid var(--app-card-border)',
            borderRadius: 16, padding: '18px 14px', display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <Icon name="shield" size={18} color="#FCA311" />
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--app-text)' }}>Privacy Policy</span>
          </button>
        </div>
      </div>

      {confirmOpen && (
        <React.Fragment>
          <div onClick={() => setConfirmOpen(false)} style={{
            position: 'absolute', inset: 0, background: 'rgba(6,10,20,0.65)', zIndex: 40,
          }}></div>
          <div style={{
            position: 'absolute', left: 24, right: 24, bottom: 40, zIndex: 41,
            background: '#101b30', border: '1px solid var(--app-card-border)', borderRadius: 20,
            padding: 22, boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, marginBottom: 14,
              background: 'rgba(255,99,72,0.12)', border: '1px solid rgba(255,99,72,0.30)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Icon name="trash" size={18} color="#ff6348" />
            </div>
            <div style={{ fontFamily: 'Montserrat', fontSize: 18, fontWeight: 900, color: 'var(--app-text)', marginBottom: 8 }}>Delete account & data?</div>
            <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--app-text-muted)', margin: '0 0 20px' }}>This permanently erases your account and everything tied to it. This can’t be undone.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmOpen(false)} style={{
                all: 'unset', boxSizing: 'border-box', cursor: 'pointer', flex: 1, textAlign: 'center',
                padding: '13px 0', borderRadius: 9999, border: '1px solid var(--app-border-strong)',
                fontSize: 13.5, fontWeight: 800, color: 'var(--app-text)',
              }}>Cancel</button>
              <button onClick={() => setConfirmOpen(false)} style={{
                all: 'unset', boxSizing: 'border-box', cursor: 'pointer', flex: 1, textAlign: 'center',
                padding: '13px 0', borderRadius: 9999, background: '#ff6348',
                fontSize: 13.5, fontWeight: 800, color: 'var(--app-text)',
              }}>Delete</button>
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
};

// ===========================================================================
// FEEDBACK — mobile adaptation of the desktop feedback form: a two-option
// type select (gold-outline when selected) + message textarea + gradient
// send CTA. Prototype-only: send shows a brief confirmation, then clears.
// ===========================================================================
const _FeedbackTypeOption = ({ label, active, onClick }) =>
<button onClick={onClick} style={{
  all: 'unset', boxSizing: 'border-box', cursor: 'pointer', flex: 1, textAlign: 'center',
  padding: '13px 0', borderRadius: 12,
  border: active ? '1.5px solid #FCA311' : '1px solid rgba(255,255,255,0.12)',
  background: active ? 'rgba(252,163,17,0.10)' : 'rgba(255,255,255,0.03)',
  color: active ? '#FCA311' : 'var(--app-text-muted)',
  fontSize: 13.5, fontWeight: 800,
}}>{label}</button>;

const FeedbackScreen = ({ onBack }) => {
  const [type, setType] = React.useState('suggestion');
  const [message, setMessage] = React.useState('');
  const [sent, setSent] = React.useState(false);

  const handleSend = () => {
    if (!message.trim()) return;
    setSent(true);
    setMessage('');
    window.clearTimeout(handleSend._t);
    handleSend._t = window.setTimeout(() => setSent(false), 3000);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      <StatusBar />
      <SubHeader crumb="Settings · Feedback" onBack={onBack} />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 60px' }}>
        <h1 style={{ fontFamily: 'Montserrat', fontSize: 28, fontWeight: 900, letterSpacing: '-0.01em', margin: '0 0 8px', color: 'var(--app-text)' }}>Feedback</h1>
        <p style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--app-text-muted)', margin: '0 0 24px', maxWidth: 320 }}>Help us improve Sparked by sharing your thoughts or reporting issues.</p>

        <Field label="Feedback type">
          <div style={{ display: 'flex', gap: 10 }}>
            <_FeedbackTypeOption label="Suggestion" active={type === 'suggestion'} onClick={() => setType('suggestion')} />
            <_FeedbackTypeOption label="Issue" active={type === 'issue'} onClick={() => setType('issue')} />
          </div>
        </Field>

        <Field label="Your message">
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5}
            placeholder="Tell us your ideas or suggestions…"
            style={{ ...inputStyle, minHeight: 120, resize: 'none', lineHeight: 1.5, fontFamily: 'Inter' }}></textarea>
        </Field>

        <div style={{ marginTop: 8 }}>
          <SparkButton size="lg" onClick={handleSend}>Send Feedback</SparkButton>
        </div>

        {sent && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, justifyContent: 'center',
            fontSize: 12.5, fontWeight: 700, color: '#7ee787',
          }}>
            <Icon name="check" size={14} color="#7ee787" />
            Thanks — your feedback was sent.
          </div>
        )}
      </div>
    </div>
  );
};

// ===========================================================================
// APPEARANCE — System / Dark / Light, three-option single-select. Applies
// app-wide immediately via the ThemeContext CSS vars set at PhoneFrame.
// System follows the device's prefers-color-scheme.
// ===========================================================================
const _APPEARANCE_OPTIONS = [
  { id: 'system', label: 'System', sub: 'Match your device setting', icon: 'monitor' },
  { id: 'dark', label: 'Dark', sub: 'Deep night, always on', icon: 'moon' },
  { id: 'light', label: 'Light', sub: 'Bright surfaces, flat wordmark', icon: 'sparkles' },
];
const AppearanceScreen = ({ onBack, mode = 'system', onChange = () => {} }) => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
    <StatusBar />
    <SubHeader crumb="Settings · Appearance" onBack={onBack} />
    <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 60px' }}>
      <h1 style={{ fontFamily: 'Montserrat', fontSize: 28, fontWeight: 900, letterSpacing: '-0.01em', margin: '0 0 8px', color: 'var(--app-text)' }}>Appearance</h1>
      <p style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--app-text-muted)', margin: '0 0 24px', maxWidth: 320 }}>Choose how Sparked looks on this device.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {_APPEARANCE_OPTIONS.map((opt) => {
          const selected = mode === opt.id;
          return (
            <button key={opt.id} onClick={() => onChange(opt.id)} style={{
              all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%',
              display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16,
              background: selected ? 'rgba(252,163,17,0.10)' : 'var(--app-card-bg)',
              border: selected ? '1.5px solid #FCA311' : '1px solid var(--app-card-border)',
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                background: 'var(--app-icon-chip-bg)', border: '1px solid var(--app-card-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Icon name={opt.icon} size={16} color={selected ? '#FCA311' : 'var(--app-text-muted)'} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: selected ? '#FCA311' : 'var(--app-text)' }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: 'var(--app-text-muted)', marginTop: 2 }}>{opt.sub}</div>
              </div>
              {selected && <Icon name="check" size={16} color="#FCA311" />}
            </button>
          );
        })}
      </div>
    </div>
  </div>
);

const SettingsScreen = ({ onBack, onEditProfile, onLogout, onInterests, interests = [], notif, onNotifChange, quiet = { start: '21:00', end: '09:00', override: 'ask' }, onQuietHours, onPrivacy, onFeedback, onAppearance }) => {
  const hasFit = interests.length > 0;
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      <StatusBar />
      <SubHeader crumb="Me · Settings" onBack={onBack} />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 60px' }}>
        <h1 style={{ fontFamily: 'Montserrat', fontSize: 28, fontWeight: 900, letterSpacing: '-0.01em', margin: '0 0 22px', color: 'var(--app-text)' }}>Settings</h1>

        {/* Profile row */}
        <button onClick={onEditProfile} style={{
          all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%',
          display: 'flex', alignItems: 'center', gap: 14, padding: 16, marginBottom: 22,
          background: 'var(--app-card-bg)', border: '1px solid var(--app-card-border)', borderRadius: 20
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 9999, flexShrink: 0,
            background: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#14213D', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 20
          }}>JC</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 17, color: 'var(--app-text)' }}>Jordan Chen</div>
            <div style={{ fontSize: 12, color: 'var(--app-text-muted)', marginTop: 2 }}>Edit profile</div>
          </div>
          <Icon name="edit" size={16} color="#FCA311" />
        </button>

        <Eyebrow>Notifications</Eyebrow>
        <NotifSection hasFit={hasFit} onAddInterests={onInterests || (() => {})} prefs={notif} onChange={onNotifChange}
          onOpenQuiet={onQuietHours || (() => {})} />

        <Eyebrow>Account</Eyebrow>
        <div style={{ marginTop: 6, marginBottom: 18 }}>
          <LinkRow icon="sliders" label="Interests & blocks" onClick={onInterests || (() => {})} />
          <Divider />
          <LinkRow icon="shield" label="Privacy" onClick={onPrivacy || (() => {})} />
          <Divider />
          <LinkRow icon="globe" label="Language & region" onClick={() => {}} />
          <Divider />
          <LinkRow icon="palette" label="Appearance" onClick={onAppearance || (() => {})} />
        </div>

        <Eyebrow>Support</Eyebrow>
        <div style={{ marginTop: 6, marginBottom: 18 }}>
          <LinkRow icon="heart" label="Help & feedback" onClick={onFeedback || (() => {})} />
        </div>

        <Divider />
        <LinkRow icon="logout" label="Log out" danger onClick={onLogout} />

        <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--app-text-hint)', marginTop: 20, letterSpacing: '0.10em' }}>
          Sparked v1.0 · Phoenix, AZ
        </div>
      </div>
    </div>);

};

// ===========================================================================
// INTERESTS & BLOCKS — the editable home for profile taxonomy.
// Reuses the onboarding chip (window.OnbChip) as the spec of record, but over
// the FULLER canonical category list (the same one Create Event uses). A
// category is Interested, Blocked, or Neither — never two at once, so each
// section only offers categories the other section hasn't claimed.
// ===========================================================================
const CATEGORY_ICONS = {
  Curbside: 'pin',
  Markets: 'store', Music: 'mic', Art: 'palette', Food: 'food',
  Community: 'users', 'Pop-Ups': 'sparkles', Outdoors: 'tent', Family: 'heart',
  Wellness: 'leaf', Nightlife: 'moon', Sports: 'dumbbell', Tech: 'monitor',
};

const _ibGrid = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 };
const _ibGridSingle = { display: 'grid', gridTemplateColumns: '1fr', gap: 10 };

// Undecided pill — neutral tile carrying BOTH affordances: a check (→ I'm into)
// and a minus (→ Not for me). Mirrors OnbChip's unselected look.
const _UndecidedChip = ({ id, icon, onInterest, onBlock }) => (
  <div style={{
    boxSizing: 'border-box', width: '100%', display: 'flex', alignItems: 'center', gap: 10,
    padding: '13px 14px', borderRadius: 18,
    border: '1.5px solid rgba(255,255,255,0.10)', background: 'var(--app-icon-chip-bg)',
  }}>
    <span style={{
      width: 28, height: 28, borderRadius: 9, flexShrink: 0,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--app-icon-chip-bg)',
    }}>
      <Icon name={icon} size={15} color="#FCA311" />
    </span>
    <span style={{
      flex: 1, minWidth: 0, fontFamily: 'Montserrat', fontWeight: 900, fontSize: 13,
      letterSpacing: '-0.01em', color: 'var(--app-text-muted)',
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    }}>{id}</span>
    <span style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
      <button onClick={onInterest} aria-label={`Add ${id} to interests`} style={{
        all: 'unset', cursor: 'pointer', width: 26, height: 26, borderRadius: 9999,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        border: '1.5px solid rgba(252,163,17,0.45)', background: 'rgba(252,163,17,0.10)',
      }}>
        <Icon name="check" size={12} color="#FCA311" />
      </button>
      <button onClick={onBlock} aria-label={`Block ${id}`} style={{
        all: 'unset', cursor: 'pointer', width: 26, height: 26, borderRadius: 9999,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        border: '1.5px solid rgba(255,99,72,0.45)', background: 'rgba(255,99,72,0.10)',
      }}>
        <Icon name="minus" size={12} color="#ff6348" />
      </button>
    </span>
  </div>
);

// A section that peeks `cap` pills and reveals the rest behind a Show more / less
// toggle. The toggle appears only when the list exceeds the cap. Holds its own
// expand state so each section expands independently.
const _PeekSection = ({ eyebrow, eyebrowColor, count, items, cap, renderItem, emptyNode, gridStyle }) => {
  const [open, setOpen] = React.useState(false);
  const hidden = items.length - cap;
  const shown = open ? items : items.slice(0, cap);
  const sectionHead = { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '0 0 12px' };
  return (
    <div style={{ marginTop: 30 }}>
      <div style={sectionHead}>
        <Eyebrow color={eyebrowColor}>{eyebrow}</Eyebrow>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--app-text-faint)' }}>{count}</span>
      </div>
      {items.length === 0 ? emptyNode : (
        <React.Fragment>
          <div style={gridStyle || _ibGrid}>{shown.map(renderItem)}</div>
          {hidden > 0 && (
            <button onClick={() => setOpen((o) => !o)} style={{
              all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
              marginTop: 14, fontSize: 12, fontWeight: 800, color: '#FCA311',
            }}>
              {open ? 'Show less' : `Show more (${hidden})`}
            </button>
          )}
        </React.Fragment>
      )}
    </div>
  );
};

const InterestsBlocksScreen = ({ interests = [], blocks = [], onInterestsChange, onBlocksChange, onBack }) => {
  const Chip = window.OnbChip;
  const interestSet = new Set(interests);
  const blockSet = new Set(blocks);
  // Exactly-one-bucket partition, all in canonical taxonomy order.
  const intoList = CREATE_CATEGORIES.filter((c) => interestSet.has(c));
  const blockedList = CREATE_CATEGORIES.filter((c) => blockSet.has(c));
  const undecidedList = CREATE_CATEGORIES.filter((c) => !interestSet.has(c) && !blockSet.has(c));

  const addInterest = (id) => { onBlocksChange((b) => b.filter((x) => x !== id)); onInterestsChange((i) => [...i.filter((x) => x !== id), id]); };
  const removeInterest = (id) => onInterestsChange((i) => i.filter((x) => x !== id));
  const addBlock = (id) => { onInterestsChange((i) => i.filter((x) => x !== id)); onBlocksChange((b) => [...b.filter((x) => x !== id), id]); };
  const removeBlock = (id) => onBlocksChange((b) => b.filter((x) => x !== id));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      <StatusBar />
      <SubHeader crumb="Settings · Interests & blocks" onBack={onBack} />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 60px' }}>
        <h1 style={{ fontFamily: 'Montserrat', fontSize: 28, fontWeight: 900, letterSpacing: '-0.01em', margin: '0 0 8px', color: 'var(--app-text)' }}>Interests &amp; blocks</h1>
        <p style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--app-text-muted)', margin: '0 0 6px', maxWidth: 320 }}>Tune what shapes your feed. Every category sits in one bucket — into it, undecided, or blocked.</p>

        {/* 1 — I'm into (always shown; empty → prompt) */}
        <_PeekSection
          eyebrow="I’m into" count={`${intoList.length} selected`}
          items={intoList} cap={5}
          renderItem={(c) =>
            <Chip key={c} id={c} icon={CATEGORY_ICONS[c] || 'sparkles'}
              mode="interest" selected onClick={() => removeInterest(c)} />
          }
          emptyNode={<p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(238,240,255,0.5)', margin: 0 }}>Tap a category below to start tuning your feed.</p>}
        />

        {/* 2 — Undecided (hidden when empty) */}
        {undecidedList.length > 0 && (
          <_PeekSection
            eyebrow="Undecided" count={`${undecidedList.length} undecided`}
            items={undecidedList} cap={6} gridStyle={_ibGridSingle}
            renderItem={(c) =>
              <_UndecidedChip key={c} id={c} icon={CATEGORY_ICONS[c] || 'sparkles'}
                onInterest={() => addInterest(c)} onBlock={() => addBlock(c)} />
            }
          />
        )}

        {/* 3 — Not for me (hidden when empty) */}
        {blockedList.length > 0 && (
          <_PeekSection
            eyebrow="Not for me" eyebrowColor="#ff8a72" count={`${blockedList.length} blocked`}
            items={blockedList} cap={3}
            renderItem={(c) =>
              <Chip key={c} id={c} icon={CATEGORY_ICONS[c] || 'sparkles'}
                mode="block" selected onClick={() => removeBlock(c)} />
            }
          />
        )}
      </div>
    </div>);

};

// ===========================================================================
// EDIT PROFILE — simple form sub-screen.
// ===========================================================================
const EditProfileScreen = ({ onBack, onSave, onGoWorkspace }) => {
  const [name, setName] = React.useState('Jordan Chen');
  const [bio, setBio] = React.useState('Always chasing the next First Friday.');
  const [city, setCity] = React.useState('Phoenix, AZ');
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      <StatusBar />
      <SubHeader crumb="Settings · Profile" onBack={onBack} />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 40px' }}>
        <h1 style={{ fontFamily: 'Montserrat', fontSize: 26, fontWeight: 900, letterSpacing: '-0.01em', margin: '0 0 6px', color: 'var(--app-text)' }}>Edit Profile</h1>
        <p style={{ fontSize: 12.5, color: 'var(--app-text-muted)', lineHeight: 1.5, margin: '0 0 22px' }}>Your personal info — how you appear as an attendee.</p>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 88, height: 88, borderRadius: 9999,
              background: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#14213D', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 32
            }}>JC</div>
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 30, height: 30, borderRadius: 9999, background: 'var(--app-bg)',
              border: '2px solid var(--app-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{ width: '100%', height: '100%', borderRadius: 9999, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="image" size={14} color="#FCA311" />
              </div>
            </div>
          </div>
        </div>

        <Field label="Name"><TextField value={name} onChange={setName} icon="user" /></Field>
        <Field label="City"><TextField value={city} onChange={setCity} icon="pin" /></Field>
        <Field label="Bio">
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
          style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}></textarea>
        </Field>

        <div style={{ marginTop: 8 }}>
          <SparkButton size="lg" onClick={onSave}>Save Changes</SparkButton>
        </div>

        <button onClick={onGoWorkspace} style={{
          all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'block', width: '100%',
          textAlign: 'center', marginTop: 16, fontSize: 12.5, fontWeight: 600, color: 'var(--app-text-muted)',
        }}>
          Looking for your organizer page? <span style={{ color: '#FCA311', fontWeight: 800 }}>Go to Workspace →</span>
        </button>
      </div>
    </div>);

};

// ===========================================================================
// PLANS & PRICING — renders the three canonical tiers (Pop-up / Standard /
// Plus) straight from PRICING_TIERS, plus the Enterprise (Backstage) card.
// Nothing here hardcodes a tier name, price, or feature — it all reads from
// the canonical source. Prices show as ONE clean band total, never per-day.
// ===========================================================================

// Each tier carries its own checkmark color — the three semantic states:
// green = free (Pop-up), amber = paid base (Standard), coral = premium (Plus).
const _TIER_CHECK = { popup: '#4ade80', standard: '#FCA311', plus: '#ff8a72' };

// Band-total strip: the tier's price for each supported duration band, side by
// side. Reads DURATION_BANDS + tier.prices from the canonical source.
const _BandStrip = ({ tier }) =>
<div style={{ display: 'flex', border: '1px solid var(--app-card-border)', borderRadius: 14, overflow: 'hidden', marginBottom: 14, background: 'var(--app-card-bg)' }}>
    {DURATION_BANDS.map((b, i) =>
  <div key={b.id} style={{ flex: 1, padding: '10px 8px', textAlign: 'center', borderLeft: i ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
      <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--app-text-faint)', marginBottom: 4 }}>{b.label}</div>
      <div style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 19, letterSpacing: '-0.02em', color: tier.highlight ? '#ff8a72' : '#fff' }}>${tier.prices[b.id]}</div>
    </div>
  )}
  </div>;


const PricingScreen = ({ onBack, onGetStarted, desktop }) => {
  const renderFeatures = (tier) => tier.features.map((f) =>
  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 7 }}>
      <Icon name="check" size={13} color={_TIER_CHECK[tier.id]} />
      <span style={{ fontSize: 12.5, color: 'var(--app-text-muted)', lineHeight: 1.4 }}>{f}</span>
    </div>);

  // ---- DESKTOP (\u22651024px) \u2014 Pop-up / Standard / Plus side by side, read
  // straight from canonical PRICING_TIERS. Feature lists are padded with
  // invisible spacer rows up to the longest tier's count so bullet rows (and
  // the CTA below them) line up across columns \u2014 no feature text is added
  // or reordered, only blank alignment filler.
  if (desktop) {
    const maxFeatures = Math.max(...PRICING_TIERS.map((t) => t.features.length));
    const FEATURE_ROW_H = 29;
    return (
      <div style={{ minHeight: '100%', boxSizing: 'border-box', background: 'var(--app-bg)', color: 'var(--app-text)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '40px 40px 80px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <button onClick={onBack} aria-label="Back" style={{ all: 'unset', cursor: 'pointer', width: 38, height: 38, borderRadius: 12, background: 'var(--app-icon-chip-bg)', border: '1px solid var(--app-card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ display: 'flex', transform: 'rotate(180deg)' }}><Icon name="chev-right" size={16} color="var(--app-text)" /></span>
            </button>
            <div>
              <h1 style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 26, letterSpacing: '-0.02em', margin: 0, color: 'var(--app-text)' }}>Simple, honest pricing.</h1>
              <p style={{ fontSize: 13, color: 'var(--app-text-muted)', margin: '6px 0 0', lineHeight: 1.5 }}>Browsing is always free. Curbside posts are free. Paid tiers are one flat total per event — pick the reach you need.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, alignItems: 'stretch' }}>
            {PRICING_TIERS.map((tier) => (
              <div key={tier.id} style={{
                background: tier.highlight ? 'rgba(255,99,72,0.07)' : 'var(--app-card-bg)',
                border: `1.5px solid ${tier.highlight ? 'rgba(255,99,72,0.45)' : tier.free ? 'rgba(74,222,128,0.30)' : 'rgba(252,163,17,0.32)'}`,
                borderRadius: 22, padding: 22, position: 'relative', display: 'flex', flexDirection: 'column',
              }}>
                <span style={{ position: 'absolute', top: 18, right: 18, fontSize: 9, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: tier.free ? '#4ade80' : tier.highlight ? '#ff8a72' : '#FCA311', background: tier.free ? 'rgba(74,222,128,0.14)' : 'var(--app-icon-chip-bg)', border: tier.free ? '1px solid rgba(74,222,128,0.35)' : 'none', borderRadius: 6, padding: '3px 8px' }}>{tier.free ? 'Free' : tier.highlight ? 'Most reach' : 'Most popular'}</span>

                <div style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 14, color: 'var(--app-text-muted)', letterSpacing: '-0.01em', marginBottom: tier.free ? 6 : 12 }}>{tier.name}</div>

                {tier.free ?
                <React.Fragment>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 32, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--app-green)' }}>Free</span>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--app-text-muted)' }}>Single-day only</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--app-text-faint)', marginBottom: 12 }}>{tier.limit}</div>
                  </React.Fragment> :
                <_BandStrip tier={tier} />}

                <p style={{ fontSize: 12.5, color: 'var(--app-text-muted)', lineHeight: 1.5, margin: '0 0 14px' }}>{tier.desc}</p>

                {/* Alignment spacer \u2014 keeps the feature list's first row at the
                    same y across columns whether or not this tier has the
                    "Everything in X, plus" lead-in. */}
                {tier.inheritsFrom ?
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, paddingBottom: 10, marginBottom: 3, borderBottom: '1px solid var(--app-divider)' }}>
                    <Icon name="check" size={13} color="var(--app-text-faint)" />
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--app-text-muted)', lineHeight: 1.4 }}>Everything in {tier.inheritsFrom}, plus</span>
                  </div> :
                <div style={{ height: 40 }} aria-hidden="true"></div>}

                <div>
                  {renderFeatures(tier)}
                  {Array.from({ length: maxFeatures - tier.features.length }).map((_, i) => (
                    <div key={'sp' + i} style={{ height: FEATURE_ROW_H }} aria-hidden="true"></div>
                  ))}
                </div>

                <div style={{ flex: 1 }}></div>

                {!tier.free &&
                <button onClick={onGetStarted} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', marginTop: 14, background: tier.highlight ? 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' : 'var(--app-icon-chip-bg)', border: tier.highlight ? 'none' : '1px solid var(--app-card-border)', borderRadius: 14, padding: '12px 18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, color: tier.highlight ? '#14213D' : 'var(--app-text)', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 14, letterSpacing: '-0.01em', boxShadow: tier.highlight ? '0 6px 22px rgba(255,95,78,0.22)' : 'none' }}>
                    {tier.highlight && <Icon name="fire" size={15} color="#14213D" />}
                    {tier.highlight ? 'Start Plus' : 'Choose Standard'}
                  </button>}
                {tier.free &&
                <button onClick={onGetStarted} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', marginTop: 14, background: 'rgba(74,222,128,0.10)', border: '1px solid rgba(74,222,128,0.35)', borderRadius: 14, padding: '12px 18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--app-green)', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 14, letterSpacing: '-0.01em' }}>
                    Post a Curbside
                  </button>}
              </div>
            ))}
          </div>

          {/* Enterprise / early-access \u2014 slim full-width bar at desktop width. */}
          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 20, background: 'var(--app-card-bg)', border: `1.5px solid ${ENTERPRISE_TIER.border}`, borderRadius: 18, padding: '16px 22px' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 14, color: 'var(--app-text)', letterSpacing: '-0.01em' }}>{ENTERPRISE_TIER.name}</span>
                <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: ENTERPRISE_TIER.tagColor, background: 'var(--app-icon-chip-bg)', borderRadius: 6, padding: '3px 8px' }}>{ENTERPRISE_TIER.tag}</span>
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--app-text-muted)', lineHeight: 1.5, margin: '4px 0 0' }}>{ENTERPRISE_TIER.desc}</p>
            </div>
            <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '4px 18px' }}>
              {ENTERPRISE_TIER.features.map((f) => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="check" size={12} color="#FCA311" />
                  <span style={{ fontSize: 11.5, color: 'var(--app-text-muted)', whiteSpace: 'nowrap' }}>{f}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
              <span style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 15, letterSpacing: '-0.02em', color: 'var(--app-text)' }}>{ENTERPRISE_TIER.price}</span>
              <button onClick={onGetStarted} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', background: 'var(--app-icon-chip-bg)', border: '1px solid var(--app-card-border)', borderRadius: 12, padding: '11px 18px', color: 'var(--app-text)', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 13, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                Join waitlist
              </button>
            </div>
          </div>

          <p style={{ fontSize: 11, color: 'var(--app-text-hint)', lineHeight: 1.65, textAlign: 'center', marginTop: 24 }}>Paid tiers are a one-time charge per event — you pay once at checkout, never per day. All plans include HTTPS event pages and mobile-optimized listings.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      <StatusBar />
      <SubHeader crumb="Plans &amp; Pricing" onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 48px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: -40, left: -60, width: 230, height: 230, borderRadius: '50%', background: 'rgba(255,99,72,0.16)', filter: 'blur(70px)', pointerEvents: 'none' }} />
        <h1 style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 26, letterSpacing: '-0.02em', lineHeight: 1.05, margin: '8px 0 8px', color: 'var(--app-text)', position: 'relative' }}>Simple, honest pricing.</h1>
        <p style={{ fontSize: 13.5, color: 'var(--app-text-muted)', lineHeight: 1.55, margin: '0 0 24px', position: 'relative' }}>Browsing is always free. Curbside posts are free. Paid tiers are one flat total per event — pick the reach you need.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {PRICING_TIERS.map((tier) =>
          <div key={tier.id} style={{ background: tier.highlight ? 'rgba(255,99,72,0.07)' : 'rgba(255,255,255,0.03)', border: `1.5px solid ${tier.highlight ? 'rgba(255,99,72,0.45)' : tier.free ? 'rgba(74,222,128,0.30)' : 'rgba(252,163,17,0.32)'}`, borderRadius: 22, padding: 20, position: 'relative' }}>
              {/* status pill — Pop-up uses the green semantic pill (never gradient) */}
              <span style={{ position: 'absolute', top: 16, right: 16, fontSize: 9, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: tier.free ? '#4ade80' : tier.highlight ? '#ff8a72' : '#FCA311', background: tier.free ? 'rgba(74,222,128,0.14)' : 'rgba(255,255,255,0.05)', border: tier.free ? '1px solid rgba(74,222,128,0.35)' : 'none', borderRadius: 6, padding: '3px 8px' }}>{tier.free ? 'Free' : tier.highlight ? 'Most reach' : 'Most popular'}</span>

              <div style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 13, color: 'var(--app-text-muted)', letterSpacing: '-0.01em', marginBottom: tier.free ? 4 : 10 }}>{tier.name}</div>

              {tier.free ?
              <React.Fragment>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 30, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--app-green)' }}>Free</span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--app-text-muted)' }}>Single-day only</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--app-text-faint)', marginBottom: 12 }}>{tier.limit}</div>
                </React.Fragment> :
              <_BandStrip tier={tier} />}

              <p style={{ fontSize: 12.5, color: 'var(--app-text-muted)', lineHeight: 1.5, margin: '0 0 14px' }}>{tier.desc}</p>

              {/* additive "Everything in X, plus" lead-in for inheriting tiers */}
              {tier.inheritsFrom &&
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, paddingBottom: 10, marginBottom: 3, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <Icon name="check" size={13} color="var(--app-text-faint)" />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--app-text-muted)', lineHeight: 1.4 }}>Everything in {tier.inheritsFrom}, plus</span>
                </div>}

              {renderFeatures(tier)}

              {!tier.free &&
              <button onClick={onGetStarted} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', marginTop: 14, background: tier.highlight ? 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' : 'rgba(255,255,255,0.06)', border: tier.highlight ? 'none' : '1px solid rgba(255,255,255,0.14)', borderRadius: 14, padding: '12px 18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, color: tier.highlight ? '#14213D' : '#fff', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 14, letterSpacing: '-0.01em', boxShadow: tier.highlight ? '0 6px 22px rgba(255,95,78,0.22)' : 'none' }}>
                  {tier.highlight && <Icon name="fire" size={15} color="#14213D" />}
                  {tier.highlight ? 'Start Plus' : 'Choose Standard'}
                </button>}
              {tier.free &&
              <button onClick={onGetStarted} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', marginTop: 14, background: 'rgba(74,222,128,0.10)', border: '1px solid rgba(74,222,128,0.35)', borderRadius: 14, padding: '12px 18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--app-green)', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 14, letterSpacing: '-0.01em' }}>
                  Post a Curbside
                </button>}
            </div>
          )}

          {/* Enterprise / early-access — kept unchanged */}
          <div style={{ background: 'var(--app-card-bg)', border: `1.5px solid ${ENTERPRISE_TIER.border}`, borderRadius: 22, padding: 20, position: 'relative' }}>
            <span style={{ position: 'absolute', top: 16, right: 16, fontSize: 9, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: ENTERPRISE_TIER.tagColor, background: 'var(--app-icon-chip-bg)', borderRadius: 6, padding: '3px 8px' }}>{ENTERPRISE_TIER.tag}</span>
            <div style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 13, color: 'var(--app-text-muted)', letterSpacing: '-0.01em', marginBottom: 4 }}>{ENTERPRISE_TIER.name}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 10 }}>
              <span style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 15, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--app-text)' }}>{ENTERPRISE_TIER.price}</span>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--app-text-muted)', lineHeight: 1.5, margin: '0 0 14px' }}>{ENTERPRISE_TIER.desc}</p>
            {ENTERPRISE_TIER.features.map((f) =>
            <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 7 }}>
                <Icon name="check" size={13} color="#FCA311" />
                <span style={{ fontSize: 12.5, color: 'var(--app-text-muted)', lineHeight: 1.4 }}>{f}</span>
              </div>
            )}
            <button onClick={onGetStarted} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', marginTop: 14, background: 'var(--app-card-bg)', border: '1px solid var(--app-card-border)', borderRadius: 14, padding: '12px 18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--app-text)', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 14, letterSpacing: '-0.01em' }}>
              Join waitlist
            </button>
          </div>
        </div>

        <p style={{ fontSize: 11, color: 'var(--app-text-hint)', lineHeight: 1.65, textAlign: 'center', marginTop: 24 }}>Paid tiers are a one-time charge per event — you pay once at checkout, never per day. All plans include HTTPS event pages and mobile-optimized listings.</p>
      </div>
    </div>);

};


// ===========================================================================
// CREATE ENTRY FORK — the new front door to creation. Two choices: a free
// single-day Pop-up (its own mini form) or a full Event (the existing 4-step
// wizard, unchanged). Prices/limits read from the canonical PRICING_TIERS.
// ===========================================================================
const CreateForkScreen = ({ onBack, onPickEvent, onPickPopup, desktop }) => {
  const popupTier = _tierById('popup');
  const eventFrom = _tierById('standard').prices.single; // cheapest paid band

  const card = {
    all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'block', width: '100%',
    borderRadius: 22, padding: 20, position: 'relative', overflow: 'hidden'
  };
  const kicker = { fontFamily: 'Montserrat', fontWeight: 900, fontSize: 22, letterSpacing: '-0.02em', color: 'var(--app-text)', margin: '0 0 6px' };
  const copy = { fontSize: 13, color: 'var(--app-text-muted)', lineHeight: 1.5, margin: '0 0 12px' };
  const subline = { display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 800, letterSpacing: '0.02em', color: 'var(--app-text-faint)' };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      {!desktop && <StatusBar />}
      <SubHeader crumb="List an event" onBack={onBack} />
      <div style={{ flex: 1, overflow: 'auto', overflowX: 'hidden', padding: desktop ? '40px 24px 60px' : '0 24px 28px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: -40, right: -50, width: 210, height: 210, borderRadius: '50%', background: 'rgba(255,99,72,0.14)', filter: 'blur(70px)', pointerEvents: 'none' }} />
        <div style={desktop ? { maxWidth: 640, margin: '0 auto' } : undefined}>
        <h1 style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 27, letterSpacing: '-0.02em', lineHeight: 1.05, margin: '6px 0 6px', color: 'var(--app-text)', position: 'relative' }}>What are you posting?</h1>
        <p style={{ fontSize: 13.5, color: 'var(--app-text-muted)', lineHeight: 1.55, margin: '0 0 22px', position: 'relative' }}>Two ways to get on the local feed — pick the one that fits.</p>

        <div style={{ display: 'flex', flexDirection: desktop ? 'row' : 'column', gap: 14, alignItems: 'stretch' }}>
          {/* POP-UP — free */}
          <button onClick={onPickPopup} style={{ ...card, ...(desktop ? { flex: 1 } : {}), background: 'rgba(74,222,128,0.06)', boxShadow: 'inset 0 0 0 1.5px rgba(74,222,128,0.32)' }}>
            <span style={{ position: 'absolute', top: 18, right: 18, fontSize: 9, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--app-green)', background: 'rgba(74,222,128,0.14)', border: '1px solid rgba(74,222,128,0.35)', borderRadius: 6, padding: '3px 8px' }}>Free</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.30)' }}>
                <Icon name="pin" size={19} color="#4ade80" />
              </span>
              <h2 style={{ ...kicker, margin: 0 }}>Curbside</h2>
            </div>
            <p style={copy}>{popupTier.desc}</p>
            <div style={subline}>
              <Icon name="cal" size={13} color="var(--app-text-faint)" />
              <span>Single-day · {popupTier.limit}</span>
            </div>
          </button>

          {/* EVENT — paid wizard */}
          <button onClick={onPickEvent} style={{ ...card, ...(desktop ? { flex: 1 } : {}), background: 'var(--app-card-bg)', boxShadow: 'inset 0 0 0 1.5px rgba(252,163,17,0.30)' }}>
            <span style={{ position: 'absolute', top: 18, right: 18, fontSize: 12, fontWeight: 900, letterSpacing: '-0.01em', color: '#FCA311', background: 'rgba(252,163,17,0.10)', border: '1px solid rgba(252,163,17,0.32)', borderRadius: 8, padding: '4px 10px', fontFamily: 'Montserrat' }}>from ${eventFrom}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(252,163,17,0.12)', border: '1px solid rgba(252,163,17,0.30)' }}>
                <Icon name="sparkles" size={19} color="#FCA311" />
              </span>
              <h2 style={{ ...kicker, margin: 0 }}>Event</h2>
            </div>
            <p style={copy}>A full listing on the local feed — categories, schedule, venue, photos. For businesses and organizers.</p>
            <div style={subline}>
              <Icon name="cal" size={13} color="var(--app-text-faint)" />
              <span>Standard or Plus · multi-day available</span>
            </div>
          </button>
        </div>
        </div>
      </div>
    </div>);

};

// ===========================================================================
// POP-UP MINI FORM — one screen, free, no tier step, no checkout. Posts an
// event straight to the feed as a normal EventStub (1 photo, one category).
// ===========================================================================
// Single striped photo slot — reuses the app's fill-a-placeholder pattern.
const _PopupPhotoSlot = ({ filled, onToggle }) => {
  const slot = { width: '100%', height: 132, borderRadius: 16, position: 'relative', overflow: 'hidden', boxSizing: 'border-box' };
  if (filled) {
    return (
      <div style={{ ...slot, background: 'repeating-linear-gradient(135deg,#3a2d24,#3a2d24 7px,#46362b 7px,#46362b 14px)', border: '1px solid var(--app-card-border)' }}>
        <button onClick={onToggle} aria-label="Remove photo" style={{ all: 'unset', cursor: 'pointer', position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 9999, background: 'rgba(7,11,20,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="x" size={12} color="#fff" />
        </button>
        <span style={{ position: 'absolute', bottom: 8, left: 10, fontSize: 9, fontFamily: 'monospace', color: 'var(--app-text-muted)' }}>photo 1</span>
      </div>);

  }
  return (
    <button onClick={onToggle} style={{ ...slot, all: 'unset', cursor: 'pointer', border: '1px dashed rgba(255,255,255,0.20)', background: 'linear-gradient(135deg, rgba(255,95,78,0.08), rgba(255,202,58,0.05))', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <Icon name="image" size={22} color="#FCA311" />
      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--app-text-muted)' }}>Add one photo</span>
    </button>);

};

const CreatePopupScreen = ({ onBack, onPost, desktop }) => {
  const [photo, setPhoto] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [desc, setDesc] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [date, setDate] = React.useState(todayLocalYMD());
  const [timeOn, setTimeOn] = React.useState(false);
  const [time, setTime] = React.useState('18:00');

  const canPost = !!(title.trim() && address.trim());

  const post = () => {
    if (!canPost) return;
    const startTime = timeOn ? time : '';
    const displayDate = new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    onPost({
      id: 'popup_' + Date.now(),
      title: title.trim(),
      tags: ['Curbside'],
      date: displayDate,
      time: startTime ? _fmtTime(startTime) : 'All day',
      location: address.trim(),
      address: address.trim(),
      desc: desc.trim(),
      organizer: 'You',
      gradient: photo ?
        'linear-gradient(135deg,#4a2f1a,#9c5a28 60%,#ffca3a)' :
        'linear-gradient(135deg,#26384b,#4a627e 60%,#8fa9c4)',
      price: 0,
      startISO: _parsePreviewISO(date, startTime),
      saved: false, live: false, isPopup: true, photos: photo ? 1 : 0
    });
  };

  const sectionLabelStyle = { fontFamily: 'Montserrat', fontWeight: 900, fontSize: 20, letterSpacing: '-0.01em', color: 'var(--app-text)', margin: '0 0 4px' };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      {!desktop && <StatusBar />}
      <SubHeader crumb="New Curbside post" onBack={onBack} right={<span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--app-green)', background: 'rgba(74,222,128,0.14)', border: '1px solid rgba(74,222,128,0.35)', borderRadius: 6, padding: '3px 8px' }}>Free</span>} />

      <div style={{ flex: 1, overflow: 'auto', padding: desktop ? '32px 24px 40px' : '2px 24px 24px' }}>
        <div style={desktop ? { maxWidth: 560, margin: '0 auto' } : undefined}>
        <h2 style={sectionLabelStyle}>Quick post</h2>
        <p style={{ fontSize: 12.5, color: 'var(--app-text-muted)', lineHeight: 1.5, margin: '0 0 18px' }}>The essentials only. Your pop-up goes straight to the local feed.</p>

        <Field label="Photo" hint="Optional">
          <_PopupPhotoSlot filled={photo} onToggle={() => setPhoto((p) => !p)} />
        </Field>

        <Field label="Title">
          <TextField value={title} onChange={setTitle} placeholder="e.g. Corner Yard Sale" icon="text" />
        </Field>

        <Field label="Description">
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What is it? Anything people should know before they show up." rows={3}
            style={{ ...inputStyle, minHeight: 84, lineHeight: 1.5, resize: 'none', fontFamily: 'Inter' }} />
        </Field>

        <Field label="Address">
          <TextField value={address} onChange={setAddress} placeholder="Street address" icon="pin" />
        </Field>

        <Field label="Date" hint="Single day only">
          <_DateField value={date} onChange={setDate} label="On" min={todayLocalYMD()} />
        </Field>

        <Field label="Start time" hint="Optional">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setTimeOn((o) => !o)} aria-label="Toggle start time" style={{ all: 'unset', cursor: 'pointer', flexShrink: 0, width: 46, height: 27, borderRadius: 9999, padding: 3, background: timeOn ? 'linear-gradient(135deg,#ff8c38,#ffca3a)' : 'rgba(255,255,255,0.10)', transition: 'background .18s ease', display: 'flex', alignItems: 'center' }}>
              <span style={{ width: 21, height: 21, borderRadius: '50%', background: '#fff', transform: timeOn ? 'translateX(19px)' : 'translateX(0)', transition: 'transform .18s ease', boxShadow: '0 2px 5px rgba(0,0,0,0.35)' }}></span>
            </button>
            {timeOn ?
            <_TimePicker value={time} onChange={setTime} /> :
            <span style={{ fontSize: 12.5, color: 'var(--app-text-faint)', fontWeight: 600 }}>All-day pop-up</span>}
          </div>
        </Field>
        </div>
      </div>

      <div style={{ flexShrink: 0, padding: '14px 24px 22px', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(10,15,26,0.6)' }}>
        <div style={desktop ? { maxWidth: 560, margin: '0 auto' } : undefined}>
        <button onClick={post} disabled={!canPost} style={{
          all: 'unset', boxSizing: 'border-box', cursor: canPost ? 'pointer' : 'not-allowed', width: '100%', padding: '16px 22px', borderRadius: 16, textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 16, letterSpacing: '-0.01em',
          ...(canPost ?
            { backgroundImage: 'linear-gradient(135deg,#ff5f4e 0%,#ff8c38 50%,#ffca3a 100%)', color: '#14213D', boxShadow: '0 10px 26px -8px rgba(255,95,78,0.55)' } :
            { background: 'var(--app-card-bg)', color: 'var(--app-text-hint)' })
        }}>Post it — free</button>
        <p style={{ fontSize: 11, color: 'var(--app-text-faint)', textAlign: 'center', margin: '10px 0 0' }}>No checkout · expires after your date</p>
        </div>
      </div>
    </div>);

};

Object.assign(window, {
  Field, TextField, SubHeader, inputStyle,
  AuthScreen, CreateEventScreen, CreateForkScreen, CreatePopupScreen, CheckoutScreen, ConfirmScreen,
  SettingsScreen, EditProfileScreen, InterestsBlocksScreen, CATEGORY_ICONS, ToggleRow, LinkRow, Divider,
  QuietHoursScreen,
  PricingScreen, PRICING_TIERS
});
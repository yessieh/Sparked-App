// Sparked — new-user onboarding flow.
// Three optional steps after signup: pick interests → block categories →
// confirm + feed preview. Picks shape the Explore feed downstream.
//
// Design note: deliberately NOT a clone of the reference mock. We lead with
// icon chips in the Sparked vocabulary, a single thin gradient progress rail,
// Montserrat display headers, and a real (filtered) feed preview on confirm.
// The spark gradient is reserved for selection state + the primary CTA only.

// Canonical interest set (mirrors INTERESTS in Screens.jsx) + an icon each.
const ONB_INTERESTS = [
  { id: 'Curbside',  icon: 'pin' },
  { id: 'Markets',   icon: 'store' },
  { id: 'Music',     icon: 'mic' },
  { id: 'Art',       icon: 'palette' },
  { id: 'Food',      icon: 'food' },
  { id: 'Community', icon: 'users' },
  { id: 'Pop-Ups',   icon: 'sparkles' },
  { id: 'Outdoors',  icon: 'tent' },
  { id: 'Family',    icon: 'heart' },
];
const ICON_FOR = ONB_INTERESTS.reduce((m, x) => (m[x.id] = x.icon, m), {});

// ---- Thin 3-segment progress rail -----------------------------------------
const StepRail = ({ step }) => (
  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
    {[0, 1, 2].map(i => (
      <div key={i} style={{
        height: 4, borderRadius: 9999, flex: i === step ? 2.4 : 1,
        background: i <= step ? 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' : 'var(--app-card-border)',
        transition: 'all .3s ease',
      }}></div>
    ))}
  </div>
);

// ---- A single selectable chip ----------------------------------------------
// mode: 'interest' (gold accent) | 'block' (coral accent). Both use a
// border-highlight treatment when selected (no heavy full-gradient fill).
const OnbChip = ({ id, icon, selected, mode, onClick }) => {
  const isBlock = mode === 'block';
  const accent = isBlock ? '#ff6348' : '#FCA311';
  const tint   = isBlock ? 'rgba(255,99,72,0.10)' : 'rgba(252,163,17,0.10)';
  const tileBg = isBlock ? 'rgba(255,99,72,0.16)' : 'rgba(252,163,17,0.16)';
  return (
    <button onClick={onClick} style={{
      all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%',
      display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px',
      borderRadius: 18,
      border: `1.5px solid ${selected ? accent : 'var(--app-card-border)'}`,
      background: selected ? tint : 'rgba(255,255,255,0.04)',
      transition: 'background .15s ease, border-color .15s ease',
    }}>
      <span style={{
        width: 28, height: 28, borderRadius: 9, flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: selected ? tileBg : 'var(--app-icon-chip-bg)',
      }}>
        <Icon name={icon} size={15} color={selected ? accent : '#FCA311'} />
      </span>
      <span style={{
        flex: 1, minWidth: 0, fontFamily: 'Montserrat', fontWeight: 900, fontSize: 13,
        letterSpacing: '-0.01em',
        color: selected ? '#fff' : 'var(--app-text-muted)',
        // Selected chips reserve room for the filled bubble — truncate so the
        // label never slides under it. Unselected chips show the full word.
        ...(selected ? { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } : null),
      }}>{id}</span>
      <span style={{
        width: 18, height: 18, borderRadius: 9999, flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        border: selected ? 'none' : '1.5px solid var(--app-border-strong)',
        background: selected ? accent : 'transparent',
      }}>
        {selected && <Icon name={isBlock ? 'minus' : 'check'} size={11} color="#14213D" />}
      </span>
    </button>
  );
};

// Shared scaffold: status bar, header, scrollable chip grid, pinned footer.
const OnbScaffold = ({ step, eyebrow, title, sub, children, footer }) => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
    <StatusBar />
    <div style={{ padding: '4px 28px 0' }}>
      <div style={{ marginBottom: 18 }}><SparkLogo size={20} /></div>
      <StepRail step={step} />
    </div>
    <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px 16px', boxSizing: 'border-box' }}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 style={{
        fontFamily: 'Montserrat', fontSize: 30, fontWeight: 900, letterSpacing: '-0.02em',
        lineHeight: 1.05, margin: '10px 0 8px', color: 'var(--app-text)',
      }}>{title}</h1>
      <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--app-text-muted)', margin: '0 0 22px', maxWidth: 320 }}>{sub}</p>
      {children}
    </div>
    <div style={{
      flexShrink: 0, padding: '16px 24px 28px',
      borderTop: '1px solid var(--app-divider)',
      background: 'linear-gradient(to top, rgba(20,33,61,0.6), transparent)',
    }}>{footer}</div>
  </div>
);

// Full-width ghost (skip) button.
const GhostButton = ({ children, onClick }) => (
  <button onClick={onClick} style={{
    all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', textAlign: 'center',
    padding: '12px 0', marginTop: 10, fontSize: 13, fontWeight: 800,
    color: 'var(--app-text-muted)',
  }}>{children}</button>
);

// Full-width version of the spark primary button.
const PrimaryFull = ({ children, icon, onClick }) => (
  <button onClick={onClick} style={{
    all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%',
    backgroundImage: 'linear-gradient(135deg,#ff5f4e 0%,#ff8c38 50%,#ffca3a 100%)',
    color: '#14213D', fontWeight: 900, fontSize: 15, whiteSpace: 'nowrap',
    padding: '16px 24px', borderRadius: 18,
    boxShadow: '0 8px 24px rgba(255,95,78,0.28)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
  }}>{children}{icon && <Icon name={icon} size={16} color="#14213D" />}</button>
);

// ===========================================================================
// STEP 1 — What are you into?  (multi-select interests)
// ===========================================================================
const OnbInterestsScreen = ({ value, onChange, onNext, onSkip }) => {
  const toggle = (id) => onChange(value.includes(id) ? value.filter(x => x !== id) : [...value, id]);
  return (
    <OnbScaffold
      step={0}
      eyebrow="Step 1 of 3"
      title="What are you into?"
      sub="Pick everything that sounds like you — your feed will be tuned to match. You can change this anytime."
      footer={<>
        <PrimaryFull icon="thumbs-up" onClick={onNext}>Looks good</PrimaryFull>
        <GhostButton onClick={onSkip}>Skip for now</GhostButton>
      </>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        {ONB_INTERESTS.map(it => (
          <OnbChip key={it.id} id={it.id} icon={it.icon}
            mode="interest" selected={value.includes(it.id)} onClick={() => toggle(it.id)} />
        ))}
      </div>
    </OnbScaffold>
  );
};

// ===========================================================================
// STEP 2 — Anything to block?  (these categories are hidden from the feed)
// ===========================================================================
const OnbBlockScreen = ({ value, onChange, interests, onNext, onSkip }) => {
  const toggle = (id) => onChange(value.includes(id) ? value.filter(x => x !== id) : [...value, id]);
  // Anything picked as an interest is removed from the block list — you can't
  // block what you're into. (Also drop any stale blocks that are now interests.)
  const interestSet = new Set(interests);
  const list = ONB_INTERESTS.filter(it => !interestSet.has(it.id));
  React.useEffect(() => {
    if (value.some(id => interestSet.has(id))) {
      onChange(value.filter(id => !interestSet.has(id)));
    }
  }, [interests]);
  return (
    <OnbScaffold
      step={1}
      eyebrow="Step 2 of 3"
      title="Anything to block?"
      sub="These won't appear in your feed — handy for crowds or scenes that aren't your thing. Optional, and reversible."
      footer={<>
        <PrimaryFull icon="fire" onClick={onNext}>Set up my feed</PrimaryFull>
        <GhostButton onClick={onSkip}>No blocks, skip</GhostButton>
      </>}
    >
      {list.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
          {list.map(it => (
            <OnbChip key={it.id} id={it.id} icon={it.icon}
              mode="block" selected={value.includes(it.id)} onClick={() => toggle(it.id)} />
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center', padding: '32px 20px',
          border: '1px dashed var(--app-border-strong)', borderRadius: 18,
          color: 'var(--app-text-muted)', fontSize: 13, lineHeight: 1.5, fontWeight: 600,
        }}>
          You're into all of them — nothing left to block. Tap “Set up my feed” to continue.
        </div>
      )}
      {value.length > 0 && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 18,
          fontSize: 12, fontWeight: 800, color: '#ff8a72',
        }}>
          <Icon name="ban" size={13} color="#ff8a72" />
          {value.length} blocked · tap to toggle
        </div>
      )}
    </OnbScaffold>
  );
};

// Mock "distance from you" per event id — lets the radius actually filter
// the preview so editing the radius visibly changes which events appear.
const EVENT_MILES = { 1: 1.2, 2: 3.8, 3: 6.5, 4: 12.0 };
const milesFor = (e) => EVENT_MILES[e.id] != null ? EVENT_MILES[e.id] : 9.9;

// A single preview row that slides in on mount. Animates TRANSFORM ONLY —
// opacity stays 1 so the resting state is always visible even if the
// animation is throttled (backgrounded tab). No JS-timer visibility gate,
// which previously left rows stuck at opacity:0 in throttled contexts.
const FeedRow = ({ children }) => (
  <div className="onb-feed-row">{children}</div>
);

// Inline-editable value with a dotted underline affordance.
const EditableField = ({ editing, value, onStart, onChange, onCommit, width, suffix, numeric }) => {
  if (editing) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'baseline' }}>
        <input
          autoFocus
          type="text"
          inputMode={numeric ? 'numeric' : 'text'}
          value={value}
          onChange={(e) => onChange(numeric ? e.target.value.replace(/[^0-9]/g, '') : e.target.value)}
          onBlur={onCommit}
          onKeyDown={(e) => { if (e.key === 'Enter') onCommit(); }}
          style={{
            width, background: 'rgba(252,163,17,0.12)', border: '1px solid rgba(252,163,17,0.45)',
            borderRadius: 8, padding: '2px 8px', color: '#FCA311',
            fontFamily: 'Inter', fontSize: 13.5, fontWeight: 800, outline: 'none',
            appearance: 'textfield', MozAppearance: 'textfield',
          }}
        />
        {suffix && <span style={{ color: '#FCA311', fontWeight: 800 }}>{suffix}</span>}
      </span>
    );
  }
  return (
    <button onClick={onStart} style={{
      all: 'unset', cursor: 'pointer', color: '#FCA311', fontWeight: 800,
      borderBottom: '1.5px dotted rgba(252,163,17,0.6)', lineHeight: 1.2,
    }}>{value}{suffix}</button>
  );
};

// ===========================================================================
// STEP 3 — Applying preferences. A transient page: the feed fills in by
// proximity while the header fades + collapses up, then it hands off to
// Explore (3–5s). Skippable, and tapping the location pauses the hand-off
// so the town / radius can be edited.
// ===========================================================================
const OnbConfirmScreen = ({ interests, blocks, town = 'Phoenix', radius = 25,
                            onTownChange, onRadiusChange, onStart, onBack }) => {
  const blockedSet = new Set(blocks);
  const matches = SAMPLE_EVENTS.filter(e => !e.tags.some(t => blockedSet.has(t)));
  const hiddenByBlock = SAMPLE_EVENTS.filter(e => e.tags.some(t => blockedSet.has(t)));
  // Within the chosen radius, nearest first.
  const inRadius = matches
    .filter(e => milesFor(e) <= radius)
    .sort((a, b) => milesFor(a) - milesFor(b));

  const [visibleCount, setVisibleCount] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [editing, setEditing] = React.useState(null); // 'town' | 'radius' | null
  const [tempTown, setTempTown] = React.useState(town);
  const [tempRadius, setTempRadius] = React.useState(String(radius));

  const onStartRef = React.useRef(onStart);
  onStartRef.current = onStart;
  const timers = React.useRef([]);
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  // Auto-build + hand-off sequence (~4.2s). Cancelled if the user pauses
  // (e.g. taps the location to edit) — then they advance manually.
  React.useEffect(() => {
    if (paused) { clearTimers(); return; }
    const T = (ms, fn) => timers.current.push(setTimeout(fn, ms));
    T(450,  () => setVisibleCount(1));
    T(1100, () => setVisibleCount(2));
    T(1750, () => setVisibleCount(3));
    T(2400, () => setVisibleCount(4));
    T(4200, () => onStartRef.current && onStartRef.current());
    return clearTimers;
  }, [paused]);

  const pause = () => { if (!paused) setPaused(true); };
  const beginEditTown = () => { pause(); setTempTown(town); setEditing('town'); };
  const beginEditRadius = () => { pause(); setTempRadius(String(radius)); setEditing('radius'); };
  const commitTown = () => { const v = (tempTown || '').trim(); if (v && onTownChange) onTownChange(v); setEditing(null); };
  const commitRadius = () => {
    let nVal = parseInt(tempRadius, 10);
    if (isNaN(nVal)) nVal = radius;
    nVal = Math.max(1, Math.min(100, nVal));
    if (onRadiusChange) onRadiusChange(nVal);
    setEditing(null);
  };

  const shown = paused ? inRadius : inRadius.slice(0, visibleCount);
  const handOff = () => { clearTimers(); onStartRef.current && onStartRef.current(); };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      <StatusBar />
      <div style={{ padding: '4px 28px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}><StepRail step={2} /></div>
        <button onClick={handOff} style={{
          all: 'unset', cursor: 'pointer', marginLeft: 14, fontSize: 11, fontWeight: 900,
          letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--app-text-faint)',
        }}>Skip</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 16px', boxSizing: 'border-box' }}>
        {/* Top block — stays put as the feed fills in below it (no early fade) */}
        <div>
          <div style={{ textAlign: 'center', padding: '14px 0 18px' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 9999, margin: '0 auto 16px',
              background: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 12px 32px rgba(255,95,78,0.32)',
            }}>
              <Icon name="fire" size={30} color="#14213D" />
            </div>
            <h1 style={{ fontFamily: 'Montserrat', fontSize: 25, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1, margin: '0 0 12px', color: 'var(--app-text)' }}>
              Your preferences<br />are being applied
            </h1>
            {/* Editable location line */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, color: 'var(--app-text-muted)', fontWeight: 600 }}>
              <Icon name="pin" size={14} color="#FCA311" />
              <span>Near</span>
              <EditableField
                editing={editing === 'town'} value={editing === 'town' ? tempTown : town}
                onStart={beginEditTown} onChange={setTempTown} onCommit={commitTown} width={94}
              />
              <span style={{ color: 'var(--app-text-faint)' }}>•</span>
              <EditableField
                editing={editing === 'radius'} value={editing === 'radius' ? tempRadius : radius}
                onStart={beginEditRadius} onChange={setTempRadius} onCommit={commitRadius}
                width={44} suffix="MI" numeric
              />
            </div>
          </div>

          {/* Picks summary chips */}
          {interests.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <Eyebrow>You're into</Eyebrow>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 10 }}>
                {interests.map(id => (
                  <span key={id} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 9999,
                    background: 'rgba(252,163,17,0.10)', border: '1px solid rgba(252,163,17,0.28)',
                    fontSize: 12, fontWeight: 800, color: '#FCA311',
                  }}>
                    <Icon name={ICON_FOR[id] || 'sparkles'} size={12} color="#FCA311" />
                    {id}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Feed preview — fills in by proximity */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Eyebrow>Your feed · preview</Eyebrow>
          <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--app-text-faint)' }}>
            {shown.length} within {radius}MI
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {shown.map(e => (
            <FeedRow key={e.id}>
              <div style={{
                display: 'flex', gap: 13, alignItems: 'center', padding: 12, minWidth: 0,
                background: 'var(--app-card-bg)', border: '1px solid var(--app-card-border)', borderRadius: 18,
              }}>
                <div style={{ width: 52, height: 52, borderRadius: 13, background: e.gradient, flexShrink: 0 }}></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 14, color: 'var(--app-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--app-text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{milesFor(e)} mi · {e.location}</div>
                  <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
                    {e.tags.slice(0, 2).map(t => (
                      <span key={t} style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#FCA311', background: 'rgba(252,163,17,0.12)', borderRadius: 6, padding: '2px 7px' }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </FeedRow>
          ))}

          {/* Blocked-category row, shown once the feed has populated */}
          {(paused || visibleCount >= 3) && hiddenByBlock.slice(0, 1).map(e => (
            <FeedRow key={'blk-' + e.id}>
              <div style={{
                display: 'flex', gap: 13, alignItems: 'center', padding: 12, minWidth: 0,
                background: 'var(--app-card-bg)', border: '1px dashed var(--app-card-border)', borderRadius: 18, opacity: 0.55,
              }}>
                <div style={{ width: 52, height: 52, borderRadius: 13, background: 'var(--app-icon-chip-bg)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="ban" size={18} color="rgba(255,138,114,0.8)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 14, color: 'var(--app-text-muted)' }}>Blocked category hidden</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,138,114,0.85)', marginTop: 2 }}>
                    {e.tags.filter(t => blockedSet.has(t)).join(', ')} · not shown in feed
                  </div>
                </div>
              </div>
            </FeedRow>
          ))}
        </div>
      </div>

      <div style={{ flexShrink: 0, padding: '16px 24px 28px', borderTop: '1px solid var(--app-divider)', background: 'linear-gradient(to top, rgba(20,33,61,0.6), transparent)' }}>
        <PrimaryFull icon="arrow" onClick={handOff}>Start exploring</PrimaryFull>
        <GhostButton onClick={onBack}>Adjust my picks</GhostButton>
      </div>
    </div>
  );
};

Object.assign(window, {
  ONB_INTERESTS, ICON_FOR, EVENT_MILES, milesFor,
  OnbInterestsScreen, OnbBlockScreen, OnbConfirmScreen,
  OnbChip, StepRail, FeedRow, EditableField,
});

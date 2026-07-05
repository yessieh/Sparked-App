// Sparked — Filter Finder (MVP)
// A lightweight in-Explore "find a filter" surface. No separate page, no
// cross-type event results: the magnifying glass expands an inline field that
// fuzzy-matches text against the app's FILTER SET only (interests, price
// tiers, when presets, distance). Selecting a match applies that filter and
// returns to the feed — the same outcome as tapping a category tile.
//
// New filters become searchable just by being added to the registry the
// ExploreScreen builds from these preset lists — label + type + apply-action.
//
// Pure helpers + presentational components live here; the stateful registry
// (apply actions + live counts) is assembled inside ExploreScreen, which owns
// the filter state.

// --- Preset filter sets (the searchable registry, minus apply/count) --------
const PRICE_PRESETS = [
  { id: 'free', label: 'Free',      test: (p) => p === 0 },
  { id: 'u10',  label: 'Under $10', test: (p) => p < 10 },
  { id: 'u20',  label: 'Under $20', test: (p) => p < 20 },
];

// days = [offsetFromToday_start, offsetFromToday_end]
const WHEN_PRESETS = [
  { id: 'today', label: 'Today',     days: [0, 0] },
  { id: 'tom',   label: 'Tomorrow',  days: [1, 1] },
  { id: 'week',  label: 'This week', days: [0, 6] },
];

const DIST_PRESETS = [
  { id: 'd5',  label: 'Within 5 mi',  mi: 5 },
  { id: 'd10', label: 'Within 10 mi', mi: 10 },
  { id: 'd25', label: 'Within 25 mi', mi: 25 },
];

// --- Date helpers (local, YMD string compare) -------------------------------
const ffYMD = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const ffAddDays = (n) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); return d; };
const ffEventYMD = (e) => (e.startISO ? ffYMD(new Date(e.startISO)) : null);
const ffInWhen = (e, w) => {
  const y = ffEventYMD(e); if (!y) return false;
  return y >= ffYMD(ffAddDays(w.days[0])) && y <= ffYMD(ffAddDays(w.days[1]));
};

// --- Matcher: EXACT substring against the visible label only ----------------
// A filter matches if-and-only-if its displayed label contains the typed text
// as a case-insensitive substring. No keywords, no synonyms, no fuzzy/edit
// distance. Results sort by where the match starts (prefix matches first).
function ffMatch(query, registry) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];
  return registry
    .map((f) => { const at = f.label.toLowerCase().indexOf(q); return at >= 0 ? { f, at } : null; })
    .filter(Boolean)
    .sort((a, b) => a.at - b.at || a.f.label.length - b.f.label.length);
}

// --- Presentational pieces --------------------------------------------------
// Label with ONLY the contiguous matched substring lifted into the spark accent.
const Highlight = ({ text, query }) => {
  const q = (query || '').trim();
  if (!q) return <span>{text}</span>;
  const at = text.toLowerCase().indexOf(q.toLowerCase());
  if (at < 0) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, at)}
      <span style={{ color: '#FCA311', fontWeight: 900 }}>{text.slice(at, at + q.length)}</span>
      {text.slice(at + q.length)}
    </span>
  );
};

// One match row: icon · highlighted name + "Type filter · N nearby" · Apply.
const FilterMatchRow = ({ match, query, onApply }) => {
  const { f } = match;
  return (
    <button onClick={onApply} style={{
      all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%',
      display: 'flex', alignItems: 'center', gap: 13, padding: '11px 12px',
      borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 11, flexShrink: 0,
        background: 'rgba(252,163,17,0.10)', border: '1px solid rgba(252,163,17,0.22)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={f.icon} size={17} color="#FCA311" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: 15, color: '#fff', letterSpacing: '-0.01em' }}>
          <Highlight text={f.label} query={query} />
        </div>
        <div style={{ fontSize: 11.5, color: 'rgba(238,240,255,0.50)', fontWeight: 600, marginTop: 2 }}>
          {f.type} filter · {f.count} nearby
        </div>
      </div>
      <span style={{
        flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5,
        fontFamily: 'Montserrat', fontWeight: 900, fontSize: 12, color: '#14213D',
        padding: '7px 12px', borderRadius: 9999,
        background: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
      }}>
        Apply
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </span>
    </button>
  );
};

// Empty-state "Browse by Interest" tile.
const InterestTile = ({ label, icon, onClick }) => (
  <button onClick={onClick} style={{
    all: 'unset', boxSizing: 'border-box', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 12, padding: 15,
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18,
  }}>
    <div style={{
      width: 38, height: 38, borderRadius: 11, flexShrink: 0,
      background: 'rgba(252,163,17,0.10)', border: '1px solid rgba(252,163,17,0.25)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon name={icon} size={16} color="#FCA311" />
    </div>
    <span style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 14, color: '#fff' }}>{label}</span>
  </button>
);

// Empty-state "Recent" chip — seeds the query.
const RecentChip = ({ label, onClick }) => (
  <button onClick={onClick} style={{
    display: 'inline-flex', alignItems: 'center', gap: 7,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 9999, padding: '8px 14px', cursor: 'pointer',
    color: 'rgba(238,240,255,0.78)', fontSize: 12.5, fontWeight: 700,
  }}>
    <Icon name="clock" size={12} color="rgba(238,240,255,0.45)" />
    {label}
  </button>
);

// Active non-interest filter, shown on the feed as a removable spark pill.
const ActiveFilterPill = ({ label, onRemove }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 7,
    background: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
    color: '#14213D', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 12.5,
    padding: '7px 8px 7px 13px', borderRadius: 9999,
  }}>
    {label}
    <button onClick={onRemove} aria-label={`Remove ${label}`} style={{
      all: 'unset', cursor: 'pointer', width: 18, height: 18, borderRadius: 9999,
      background: 'rgba(20,33,61,0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
    </button>
  </span>
);

Object.assign(window, {
  PRICE_PRESETS, WHEN_PRESETS, DIST_PRESETS,
  ffYMD, ffAddDays, ffEventYMD, ffInWhen, ffMatch,
  Highlight, FilterMatchRow, InterestTile, RecentChip, ActiveFilterPill,
});

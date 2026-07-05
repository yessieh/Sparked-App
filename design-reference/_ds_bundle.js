/* @ds-bundle: {"format":4,"namespace":"SparkedDesignSystem_019e09","components":[{"name":"EventStub","sourcePath":"components/EventStub/EventStub.tsx"},{"name":"SparkedLogo","sourcePath":"source/SparkedLogo.tsx"}],"sourceHashes":{"components/EventStub/EventStub.tsx":"ed565001158c","mockups/design-canvas.jsx":"fb642362a04d","mockups/feedback.jsx":"6a031a7f3df3","mockups/landings/faq.js":"713eafa78d57","mockups/shared.jsx":"e017ff25c258","mockups/variations.jsx":"f053a02e728a","source/SparkedLogo.tsx":"f5301230f416","ui_kits/mobile-app/AppScreens.jsx":"60afdd2ecbf2","ui_kits/mobile-app/Components.jsx":"8301478f35fe","ui_kits/mobile-app/FilterFinder.jsx":"a31a40d59aca","ui_kits/mobile-app/Onboarding.jsx":"1ed70d6a044f","ui_kits/mobile-app/Screens.jsx":"2da7c43ba5c5","ui_kits/mobile-app/event-stub.jsx":"ca7ec583179d"},"inlinedExternals":[],"unexposedExports":[{"name":"eventCountdown","sourcePath":"components/EventStub/EventStub.tsx"}]} */

(() => {

const __ds_ns = (window.SparkedDesignSystem_019e09 = window.SparkedDesignSystem_019e09 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/EventStub/EventStub.tsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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

const STUB_STRIPE = 'linear-gradient(180deg,#ff6348,#FCA311,#F7B731)';
const twoTags = tags => (tags || []).slice(0, 2).join(' · ').toUpperCase();
const timeStr = d => {
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return m ? `${h}:${String(m).padStart(2, '0')}${ap}` : `${h}${ap}`;
};
const shortDate = d => {
  const mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
  return `${wd} ${mo} ${d.getDate()}`;
};

/**
 * Derive the countdown shown in the utility column.
 *  • Same-day events tick hourly; inside the final hour → "less than an hour".
 *  • Future events count whole days ("2 Days", "1 Day").
 *  • Anything already started reads "Now / Happening".
 */
function eventCountdown(startISO) {
  if (!startISO) return {
    value: '—',
    label: '',
    sub: ''
  };
  const start = new Date(startISO).getTime();
  const diff = start - Date.now();
  if (diff <= 0) return {
    value: 'Now',
    label: 'Happening',
    sub: '',
    live: true
  };
  const mins = diff / 60000;
  const sd = new Date(startISO);
  const nd = new Date();
  const sameDay = sd.getFullYear() === nd.getFullYear() && sd.getMonth() === nd.getMonth() && sd.getDate() === nd.getDate();
  if (sameDay) {
    if (mins < 60) return {
      value: '<1h',
      label: 'Starts in',
      sub: 'less than an hour',
      urgent: true
    };
    return {
      value: Math.floor(mins / 60) + 'h',
      label: 'Starts in',
      sub: timeStr(sd)
    };
  }
  const days = Math.ceil(diff / 86400000);
  return {
    value: String(days),
    label: days === 1 ? 'Day' : 'Days',
    sub: shortDate(sd)
  };
}
const SIcon = ({
  name,
  size = 13,
  color = 'currentColor',
  fill = 'none'
}) => {
  const p = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill,
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
  };
  switch (name) {
    case 'cal':
      return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("rect", {
        x: "3",
        y: "4",
        width: "18",
        height: "18",
        rx: "2"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M16 2v4M8 2v4M3 10h18"
      }));
    case 'clock':
      return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "10"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M12 6v6l4 2"
      }));
    case 'pin':
      return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("path", {
        d: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "10",
        r: "3"
      }));
    case 'bookmark':
      return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("path", {
        d: "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
      }));
    case 'bookmark-fill':
      return /*#__PURE__*/React.createElement("svg", _extends({}, p, {
        fill: color
      }), /*#__PURE__*/React.createElement("path", {
        d: "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
      }));
    case 'share':
      return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("circle", {
        cx: "18",
        cy: "5",
        r: "3"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "6",
        cy: "12",
        r: "3"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "18",
        cy: "19",
        r: "3"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "8.59",
        y1: "13.51",
        x2: "15.42",
        y2: "17.49"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "15.41",
        y1: "6.51",
        x2: "8.59",
        y2: "10.49"
      }));
    case 'check':
      return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("path", {
        d: "M20 6 9 17l-5-5"
      }));
    default:
      return null;
  }
};
const Perf = () => /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'relative',
    width: 2,
    alignSelf: 'stretch',
    margin: '12px 0',
    display: 'flex',
    justifyContent: 'center'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    width: 0,
    borderLeft: '2px dotted rgba(238,240,255,0.22)',
    height: '100%'
  }
}), /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    top: -18,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 14,
    height: 14,
    borderRadius: '50%',
    background: '#14213D'
  }
}), /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    bottom: -18,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 14,
    height: 14,
    borderRadius: '50%',
    background: '#14213D'
  }
}));
const UtilCol = ({
  cd,
  center,
  children
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    width: 84,
    flexShrink: 0,
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: center ? 'center' : 'space-between',
    gap: 12,
    textAlign: 'center'
  }
}, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'Montserrat',
    fontWeight: 900,
    fontSize: cd.urgent ? 15 : 22,
    lineHeight: 1,
    color: cd.live ? '#ff6348' : '#FCA311'
  }
}, cd.value), /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 8,
    fontWeight: 900,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'rgba(238,240,255,0.45)',
    marginTop: 5,
    lineHeight: 1.3,
    whiteSpace: 'nowrap'
  }
}, cd.label), cd.sub ? /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 8,
    color: 'rgba(238,240,255,0.40)',
    marginTop: 4,
    lineHeight: 1.2,
    whiteSpace: 'nowrap'
  }
}, cd.sub) : null), children);
const MetaLine = ({
  icon,
  iconColor,
  children
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    minWidth: 0
  }
}, /*#__PURE__*/React.createElement(SIcon, {
  name: icon,
  size: 12,
  color: iconColor
}), /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 11.5,
    color: 'rgba(238,240,255,0.60)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  }
}, children));
const CatPill = ({
  tags,
  style
}) => /*#__PURE__*/React.createElement("span", {
  style: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 9px',
    borderRadius: 9999,
    background: 'rgba(15,26,48,0.72)',
    backdropFilter: 'blur(6px)',
    border: '1px solid rgba(252,163,17,0.30)',
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: '0.14em',
    color: '#FCA311',
    whiteSpace: 'nowrap',
    ...style
  }
}, twoTags(tags));
const PriceChip = ({
  price,
  style
}) => /*#__PURE__*/React.createElement("span", {
  style: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: 9999,
    background: 'rgba(15,26,48,0.72)',
    backdropFilter: 'blur(6px)',
    border: '1px solid rgba(255,255,255,0.16)',
    fontSize: 11,
    fontWeight: 800,
    color: '#fff',
    ...style
  }
}, !price ? 'Free' : '$' + price);
const StatusChip = ({
  going,
  saved
}) => {
  if (!going && !saved) return null;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '4px 9px',
      borderRadius: 9999,
      background: 'rgba(252,163,17,0.12)',
      border: '1px solid rgba(252,163,17,0.32)',
      fontSize: 10.5,
      fontWeight: 800,
      color: '#FCA311'
    }
  }, /*#__PURE__*/React.createElement(SIcon, {
    name: going ? 'check' : 'bookmark-fill',
    size: 11,
    color: "#FCA311"
  }), going ? 'Going' : 'Saved');
};
const stubBtn = active => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  borderRadius: 9,
  cursor: 'pointer',
  padding: 0,
  background: active ? 'rgba(252,163,17,0.14)' : 'rgba(255,255,255,0.07)',
  border: `1px solid ${active ? 'rgba(252,163,17,0.35)' : 'rgba(255,255,255,0.12)'}`
});
const EventStub = ({
  event,
  variant = 'photo',
  onTap,
  onSave,
  onShare
}) => {
  // Live tick — re-render each minute so the countdown stays accurate
  // (covers the hourly cadence and the final-hour "less than an hour" flip).
  const [, force] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => force(t => t + 1), 60000);
    return () => clearInterval(id);
  }, []);
  const [saved, setSaved] = React.useState(!!event.saved);
  const cd = eventCountdown(event.startISO);
  const shell = {
    display: 'flex',
    alignItems: 'stretch',
    width: '100%',
    textAlign: 'left',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(238,240,255,0.10)',
    borderRadius: 24,
    overflow: 'hidden',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(0,0,0,0.20)'
  };
  const stripe = /*#__PURE__*/React.createElement("div", {
    style: {
      width: 5,
      flexShrink: 0,
      background: STUB_STRIPE
    }
  });
  if (variant === 'compact') {
    return /*#__PURE__*/React.createElement("div", {
      onClick: onTap,
      style: shell
    }, stripe, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0,
        padding: '13px 15px'
      }
    }, /*#__PURE__*/React.createElement(CatPill, {
      tags: event.tags
    }), /*#__PURE__*/React.createElement("h3", {
      style: {
        fontFamily: 'Montserrat',
        fontWeight: 900,
        fontSize: 16,
        letterSpacing: '-0.01em',
        margin: '9px 0 0',
        lineHeight: 1.15,
        color: '#eef0ff',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, event.title), /*#__PURE__*/React.createElement(MetaLine, {
      icon: "clock",
      iconColor: "#ff6348"
    }, event.time), /*#__PURE__*/React.createElement(MetaLine, {
      icon: "pin",
      iconColor: "#FCA311"
    }, event.location), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        marginTop: 10
      }
    }, /*#__PURE__*/React.createElement(StatusChip, {
      going: event.going,
      saved: saved
    }), typeof event.rsvps === 'number' ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: 'rgba(238,240,255,0.45)'
      }
    }, event.rsvps, " RSVPs") : null)), /*#__PURE__*/React.createElement(Perf, null), /*#__PURE__*/React.createElement(UtilCol, {
      cd: cd,
      center: true
    }, /*#__PURE__*/React.createElement("button", {
      onClick: e => {
        e.stopPropagation();
        setSaved(s => !s);
        onSave && onSave(event);
      },
      "aria-label": saved ? 'Saved' : 'Save',
      style: stubBtn(saved)
    }, /*#__PURE__*/React.createElement(SIcon, {
      name: saved ? 'bookmark-fill' : 'bookmark',
      size: 13,
      color: saved ? '#FCA311' : '#fff'
    }))));
  }
  return /*#__PURE__*/React.createElement("div", {
    onClick: onTap,
    style: shell
  }, stripe, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 150,
      position: 'relative',
      background: event.gradient || 'linear-gradient(135deg,#5b3220,#a8551d 60%,#e09c3a)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(to top, rgba(20,33,61,0.78), transparent 60%)'
    }
  }), /*#__PURE__*/React.createElement(CatPill, {
    tags: event.tags,
    style: {
      position: 'absolute',
      top: 12,
      left: 12
    }
  }), /*#__PURE__*/React.createElement(PriceChip, {
    price: event.price,
    style: {
      position: 'absolute',
      top: 12,
      right: 12
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'stretch'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      padding: '13px 15px'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 18,
      letterSpacing: '-0.01em',
      margin: 0,
      lineHeight: 1.12,
      color: '#eef0ff',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, event.title), /*#__PURE__*/React.createElement(MetaLine, {
    icon: "cal",
    iconColor: "#ff6348"
  }, event.date, " \xB7 ", event.time), /*#__PURE__*/React.createElement(MetaLine, {
    icon: "pin",
    iconColor: "#FCA311"
  }, event.location, typeof event.mi === 'number' ? ` · ${event.mi} mi` : '')), /*#__PURE__*/React.createElement(Perf, null), /*#__PURE__*/React.createElement(UtilCol, {
    cd: cd
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      setSaved(s => !s);
      onSave && onSave(event);
    },
    "aria-label": saved ? 'Saved' : 'Save',
    style: stubBtn(saved)
  }, /*#__PURE__*/React.createElement(SIcon, {
    name: saved ? 'bookmark-fill' : 'bookmark',
    size: 13,
    color: saved ? '#FCA311' : '#fff'
  })), /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      onShare && onShare(event);
    },
    "aria-label": "Share",
    style: stubBtn(false)
  }, /*#__PURE__*/React.createElement(SIcon, {
    name: "share",
    size: 13,
    color: "#fff"
  })))))));
};
Object.assign(__ds_scope, { eventCountdown, EventStub, __ds_default_components_EventStub_EventStub_25wbop: EventStub });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/EventStub/EventStub.tsx", error: String((e && e.message) || e) }); }

// mockups/design-canvas.jsx
try { (() => {
// DesignCanvas.jsx — Figma-ish design canvas wrapper
// Warm gray grid bg + Sections + Artboards + PostIt notes.
// Artboards are reorderable (grip-drag), deletable, labels/titles are
// inline-editable, and any artboard can be opened in a fullscreen focus
// overlay (←/→/Esc). State persists to a .design-canvas.state.json sidecar
// via the host bridge. No assets, no deps.
//
// Usage:
//   <DesignCanvas>
//     <DCSection id="onboarding" title="Onboarding" subtitle="First-run variants">
//       <DCArtboard id="a" label="A · Dusk" width={260} height={480}>…</DCArtboard>
//       <DCArtboard id="b" label="B · Minimal" width={260} height={480}>…</DCArtboard>
//     </DCSection>
//   </DesignCanvas>

const DC = {
  bg: '#f0eee9',
  grid: 'rgba(0,0,0,0.06)',
  label: 'rgba(60,50,40,0.7)',
  title: 'rgba(40,30,20,0.85)',
  subtitle: 'rgba(60,50,40,0.6)',
  postitBg: '#fef4a8',
  postitText: '#5a4a2a',
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'
};

// One-time CSS injection (classes are dc-prefixed so they don't collide with
// the hosted design's own styles).
if (typeof document !== 'undefined' && !document.getElementById('dc-styles')) {
  const s = document.createElement('style');
  s.id = 'dc-styles';
  s.textContent = ['.dc-editable{cursor:text;outline:none;white-space:nowrap;border-radius:3px;padding:0 2px;margin:0 -2px}', '.dc-editable:focus{background:#fff;box-shadow:0 0 0 1.5px #c96442}', '[data-dc-slot]{transition:transform .18s cubic-bezier(.2,.7,.3,1)}', '[data-dc-slot].dc-dragging{transition:none;z-index:10;pointer-events:none}', '[data-dc-slot].dc-dragging .dc-card{box-shadow:0 12px 40px rgba(0,0,0,.25),0 0 0 2px #c96442;transform:scale(1.02)}',
  // isolation:isolate contains artboard content's z-indexes so a
  // z-indexed child (sticky navbar etc.) can't paint over .dc-header or
  // the .dc-menu popover that drops into the top of the card.
  '.dc-card{isolation:isolate;transition:box-shadow .15s,transform .15s}', '.dc-card *{scrollbar-width:none}', '.dc-card *::-webkit-scrollbar{display:none}',
  // Per-artboard header: grip + label on the left, delete/expand on the
  // right. Single flex row; when the artboard's on-screen width is too
  // narrow for both the label yields (ellipsis, then hidden entirely below
  // ~4ch via the container query) and the buttons stay on the row.
  '.dc-header{position:absolute;bottom:100%;left:-4px;margin-bottom:calc(4px * var(--dc-inv-zoom,1));z-index:2;', '  display:flex;align-items:center;container-type:inline-size}', '.dc-labelrow{display:flex;align-items:center;gap:4px;height:24px;flex:1 1 auto;min-width:0}', '.dc-grip{flex:0 0 auto;cursor:grab;display:flex;align-items:center;padding:5px 4px;border-radius:4px;transition:background .12s,opacity .12s}', '.dc-grip:hover{background:rgba(0,0,0,.08)}', '.dc-grip:active{cursor:grabbing}', '.dc-labeltext{flex:1 1 auto;min-width:0;cursor:pointer;border-radius:4px;padding:3px 6px;', '  display:flex;align-items:center;transition:background .12s;overflow:hidden}',
  // Below ~4ch of label room: hide the label entirely, and drop the grip to
  // hover-only (same reveal rule as .dc-btns) so a narrow header is clean
  // until the card is moused.
  '@container (max-width: 110px){', '  .dc-labeltext{display:none}', '  .dc-grip{opacity:0}', '  [data-dc-slot]:hover .dc-grip{opacity:1}', '}', '.dc-labeltext:hover{background:rgba(0,0,0,.05)}', '.dc-labeltext .dc-editable{overflow:hidden;text-overflow:ellipsis;max-width:100%}', '.dc-labeltext .dc-editable:focus{overflow:visible;text-overflow:clip}', '.dc-btns{flex:0 0 auto;margin-left:auto;display:flex;gap:2px;opacity:0;transition:opacity .12s}', '[data-dc-slot]:hover .dc-btns,.dc-btns:has(.dc-menu){opacity:1}', '.dc-expand,.dc-kebab{width:22px;height:22px;border-radius:5px;border:none;cursor:pointer;padding:0;', '  background:transparent;color:rgba(60,50,40,.7);display:flex;align-items:center;justify-content:center;', '  font:inherit;transition:background .12s,color .12s}', '.dc-expand:hover,.dc-kebab:hover{background:rgba(0,0,0,.06);color:#2a251f}',
  // Slot hosting an open menu floats above later siblings (which otherwise
  // paint on top — same z-index:auto, later DOM order) so the popup isn't
  // clipped by the next card.
  '[data-dc-slot]:has(.dc-menu){z-index:10}', '.dc-menu{position:absolute;top:100%;right:0;margin-top:4px;background:#fff;border-radius:8px;', '  box-shadow:0 8px 28px rgba(0,0,0,.18),0 0 0 1px rgba(0,0,0,.05);padding:4px;min-width:160px;z-index:10}', '.dc-menu button{display:block;width:100%;padding:7px 10px;border:0;background:transparent;', '  border-radius:5px;font-family:inherit;font-size:13px;font-weight:500;line-height:1.2;', '  color:#29261b;cursor:pointer;text-align:left;transition:background .12s;white-space:nowrap}', '.dc-menu button:hover{background:rgba(0,0,0,.05)}', '.dc-menu hr{border:0;border-top:1px solid rgba(0,0,0,.08);margin:4px 2px}', '.dc-menu .dc-danger{color:#c96442}', '.dc-menu .dc-danger:hover{background:rgba(201,100,66,.1)}',
  // Chrome (titles / labels / buttons) counter-scales against the viewport
  // zoom so it stays a constant on-screen size. --dc-inv-zoom is set by
  // DCViewport on every transform update and inherits to all descendants —
  // any overlay inside the world (e.g. a TweaksPanel on an artboard) can use
  // it the same way.
  //
  // The header uses transform:scale (out-of-flow, so layout impact doesn't
  // matter) with its world-space width set to card-width / inv-zoom so that
  // after counter-scaling its on-screen width exactly matches the card's —
  // that's what lets the container query + text-overflow behave against the
  // card's visible edge at every zoom level.
  //
  // The section head uses CSS zoom instead of transform so its layout box
  // grows with the counter-scale, pushing the card row down — otherwise the
  // constant-screen-size title would overflow into the (shrinking) world-
  // space gap and overlap the artboard headers at low zoom.
  '.dc-header{width:calc((100% + 4px) / var(--dc-inv-zoom,1));', '  transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom left}', '.dc-sectionhead{zoom:var(--dc-inv-zoom,1)}'].join('\n');
  document.head.appendChild(s);
}
const DCCtx = React.createContext(null);

// Recursively unwrap React.Fragment so <>…</> grouping doesn't hide
// DCSection/DCArtboard children from the type-based walks below.
function dcFlatten(children) {
  const out = [];
  React.Children.forEach(children, c => {
    if (c && c.type === React.Fragment) out.push(...dcFlatten(c.props.children));else out.push(c);
  });
  return out;
}

// ─────────────────────────────────────────────────────────────
// DesignCanvas — stateful wrapper around the pan/zoom viewport.
// Owns runtime state (per-section order, renamed titles/labels, hidden
// artboards, focused artboard). Order/titles/labels/hidden persist to a
// .design-canvas.state.json
// sidecar next to the HTML. Reads go via plain fetch() so the saved
// arrangement is visible anywhere the HTML + sidecar are served together
// (omelette preview, direct link, downloaded zip). Writes go through the
// host's window.omelette bridge — editing requires the omelette runtime.
// Focus is ephemeral.
// ─────────────────────────────────────────────────────────────
const DC_STATE_FILE = '.design-canvas.state.json';
function DesignCanvas({
  children,
  minScale,
  maxScale,
  style
}) {
  const [state, setState] = React.useState({
    sections: {},
    focus: null
  });
  // Hold rendering until the sidecar read settles so the saved order/titles
  // appear on first paint (no source-order flash). didRead gates writes until
  // the read settles so the empty initial state can't clobber a slow read;
  // skipNextWrite suppresses the one echo-write that would otherwise follow
  // hydration.
  const [ready, setReady] = React.useState(false);
  const didRead = React.useRef(false);
  const skipNextWrite = React.useRef(false);
  React.useEffect(() => {
    let off = false;
    fetch('./' + DC_STATE_FILE).then(r => r.ok ? r.json() : null).then(saved => {
      if (off || !saved || !saved.sections) return;
      skipNextWrite.current = true;
      setState(s => ({
        ...s,
        sections: saved.sections
      }));
    }).catch(() => {}).finally(() => {
      didRead.current = true;
      if (!off) setReady(true);
    });
    const t = setTimeout(() => {
      if (!off) setReady(true);
    }, 150);
    return () => {
      off = true;
      clearTimeout(t);
    };
  }, []);
  React.useEffect(() => {
    if (!didRead.current) return;
    if (skipNextWrite.current) {
      skipNextWrite.current = false;
      return;
    }
    const t = setTimeout(() => {
      window.omelette?.writeFile(DC_STATE_FILE, JSON.stringify({
        sections: state.sections
      })).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [state.sections]);

  // Build registries synchronously from children so FocusOverlay can read
  // them in the same render. Fragments are flattened; wrapping in other
  // elements still opts out of focus/reorder.
  const registry = {}; // slotId -> { sectionId, artboard }
  const sectionMeta = {}; // sectionId -> { title, subtitle, slotIds[] }
  const sectionOrder = [];
  dcFlatten(children).forEach(sec => {
    if (!sec || sec.type !== DCSection) return;
    const sid = sec.props.id ?? sec.props.title;
    if (!sid) return;
    sectionOrder.push(sid);
    const persisted = state.sections[sid] || {};
    const abs = [];
    dcFlatten(sec.props.children).forEach(ab => {
      if (!ab || ab.type !== DCArtboard) return;
      const aid = ab.props.id ?? ab.props.label;
      if (aid) abs.push([aid, ab]);
    });
    // hidden is scoped to one source revision — when the agent regenerates
    // (artboard-ID set changes), prior deletes don't apply to new content.
    const srcKey = abs.map(([k]) => k).join('\x1f');
    const hidden = persisted.srcKey === srcKey ? persisted.hidden || [] : [];
    const srcIds = [];
    abs.forEach(([aid, ab]) => {
      if (hidden.includes(aid)) return;
      registry[`${sid}/${aid}`] = {
        sectionId: sid,
        artboard: ab
      };
      srcIds.push(aid);
    });
    const kept = (persisted.order || []).filter(k => srcIds.includes(k));
    sectionMeta[sid] = {
      title: persisted.title ?? sec.props.title,
      subtitle: sec.props.subtitle,
      slotIds: [...kept, ...srcIds.filter(k => !kept.includes(k))]
    };
  });
  const api = React.useMemo(() => ({
    state,
    section: id => state.sections[id] || {},
    patchSection: (id, p) => setState(s => ({
      ...s,
      sections: {
        ...s.sections,
        [id]: {
          ...s.sections[id],
          ...(typeof p === 'function' ? p(s.sections[id] || {}) : p)
        }
      }
    })),
    setFocus: slotId => setState(s => ({
      ...s,
      focus: slotId
    }))
  }), [state]);

  // Esc exits focus; any outside pointerdown commits an in-progress rename.
  React.useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') api.setFocus(null);
    };
    const onPd = e => {
      const ae = document.activeElement;
      if (ae && ae.isContentEditable && !ae.contains(e.target)) ae.blur();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPd, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPd, true);
    };
  }, [api]);
  return /*#__PURE__*/React.createElement(DCCtx.Provider, {
    value: api
  }, /*#__PURE__*/React.createElement(DCViewport, {
    minScale: minScale,
    maxScale: maxScale,
    style: style
  }, ready && children), state.focus && registry[state.focus] && /*#__PURE__*/React.createElement(DCFocusOverlay, {
    entry: registry[state.focus],
    sectionMeta: sectionMeta,
    sectionOrder: sectionOrder
  }));
}

// ─────────────────────────────────────────────────────────────
// DCViewport — transform-based pan/zoom (internal)
//
// Input mapping (Figma-style):
//   • trackpad pinch  → zoom   (ctrlKey wheel; Safari gesture* events)
//   • trackpad scroll → pan    (two-finger)
//   • mouse wheel     → zoom   (notched; distinguished from trackpad scroll)
//   • middle-drag / primary-drag-on-bg → pan
//
// Transform state lives in a ref and is written straight to the DOM
// (translate3d + will-change) so wheel ticks don't go through React —
// keeps pans at 60fps on dense canvases.
// ─────────────────────────────────────────────────────────────
function DCViewport({
  children,
  minScale = 0.1,
  maxScale = 8,
  style = {}
}) {
  const vpRef = React.useRef(null);
  const worldRef = React.useRef(null);
  const tf = React.useRef({
    x: 0,
    y: 0,
    scale: 1
  });
  // Persist viewport across reloads so the user lands back where they were
  // after an agent edit or browser refresh. The sandbox origin is already
  // per-project; pathname keeps multiple canvas files in one project apart.
  const tfKey = 'dc-viewport:' + location.pathname;
  const saveT = React.useRef(0);
  const lastPostedScale = React.useRef();
  const apply = React.useCallback(() => {
    const {
      x,
      y,
      scale
    } = tf.current;
    const el = worldRef.current;
    if (!el) return;
    el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    // Exposed for zoom-invariant chrome (labels, buttons, TweaksPanel).
    el.style.setProperty('--dc-inv-zoom', String(1 / scale));
    // Keep the host toolbar's % readout in sync with the canvas scale. Pan
    // ticks leave scale unchanged — skip the cross-frame post for those.
    if (lastPostedScale.current !== scale) {
      lastPostedScale.current = scale;
      window.parent.postMessage({
        type: '__dc_zoom',
        scale
      }, '*');
    }
    clearTimeout(saveT.current);
    saveT.current = setTimeout(() => {
      try {
        localStorage.setItem(tfKey, JSON.stringify(tf.current));
      } catch {}
    }, 200);
  }, [tfKey]);
  React.useLayoutEffect(() => {
    const flush = () => {
      clearTimeout(saveT.current);
      try {
        localStorage.setItem(tfKey, JSON.stringify(tf.current));
      } catch {}
    };
    try {
      const s = JSON.parse(localStorage.getItem(tfKey) || 'null');
      if (s && Number.isFinite(s.x) && Number.isFinite(s.y) && Number.isFinite(s.scale)) {
        tf.current = {
          x: s.x,
          y: s.y,
          scale: Math.min(maxScale, Math.max(minScale, s.scale))
        };
        apply();
      }
    } catch {}
    // Flush on pagehide and unmount so a reload within the 200ms debounce
    // window doesn't drop the last pan/zoom.
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, []);
  React.useEffect(() => {
    const vp = vpRef.current;
    if (!vp) return;
    const zoomAt = (cx, cy, factor) => {
      const r = vp.getBoundingClientRect();
      const px = cx - r.left,
        py = cy - r.top;
      const t = tf.current;
      const next = Math.min(maxScale, Math.max(minScale, t.scale * factor));
      const k = next / t.scale;
      // --dc-inv-zoom consumers (.dc-sectionhead's CSS zoom, each section's
      // marginBottom) reflow on every scale change, vertically shifting the
      // world layout — so a world point mathematically pinned under the cursor
      // drifts as you zoom (content creeps up on zoom-in, down on zoom-out).
      // Anchor the DOM element under the cursor instead: record its screen Y,
      // apply the transform + --dc-inv-zoom, then cancel whatever vertical
      // drift the reflow introduced so it stays put on screen.
      let marker = null,
        markerY0 = 0;
      if (k !== 1) {
        const hit = document.elementFromPoint(cx, cy);
        marker = hit && hit.closest ? hit.closest('[data-dc-slot],[data-dc-section]') : null;
        if (marker) markerY0 = marker.getBoundingClientRect().top;
      }
      // keep the world point under the cursor fixed
      t.x = px - (px - t.x) * k;
      t.y = py - (py - t.y) * k;
      t.scale = next;
      apply();
      if (marker) {
        // A pure zoom around (cx, cy) maps screen Y → cy + (Y - cy) * k. Any
        // departure after the --dc-inv-zoom reflow is the layout drift.
        const drift = marker.getBoundingClientRect().top - (cy + (markerY0 - cy) * k);
        if (Math.abs(drift) > 0.1) {
          t.y -= drift;
          apply();
        }
      }
    };

    // Mouse-wheel vs trackpad-scroll heuristic. A physical wheel sends
    // line-mode deltas (Firefox) or large integer pixel deltas with no X
    // component (Chrome/Safari, typically multiples of 100/120). Trackpad
    // two-finger scroll sends small/fractional pixel deltas, often with
    // non-zero deltaX. ctrlKey is set by the browser for trackpad pinch.
    const isMouseWheel = e => e.deltaMode !== 0 || e.deltaX === 0 && Number.isInteger(e.deltaY) && Math.abs(e.deltaY) >= 40;
    const onWheel = e => {
      e.preventDefault();
      if (isGesturing) return; // Safari: gesture* owns the pinch — discard concurrent wheels
      if ((e.ctrlKey || e.metaKey) && !isMouseWheel(e)) {
        // trackpad pinch, or ctrl/cmd + smooth-scroll mouse. Notched
        // wheels fall through to the fixed-step branch below.
        zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.01));
      } else if (isMouseWheel(e)) {
        // notched mouse wheel — fixed-ratio step per click
        zoomAt(e.clientX, e.clientY, Math.exp(-Math.sign(e.deltaY) * 0.18));
      } else {
        // trackpad two-finger scroll — pan
        tf.current.x -= e.deltaX;
        tf.current.y -= e.deltaY;
        apply();
      }
    };

    // Safari sends native gesture* events for trackpad pinch with a smooth
    // e.scale; preferring these over the ctrl+wheel fallback gives a much
    // better feel there. No-ops on other browsers. Safari also fires
    // ctrlKey wheel events during the same pinch — isGesturing makes
    // onWheel drop those entirely so they neither zoom nor pan.
    let gsBase = 1;
    let isGesturing = false;
    const onGestureStart = e => {
      e.preventDefault();
      isGesturing = true;
      gsBase = tf.current.scale;
    };
    const onGestureChange = e => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, gsBase * e.scale / tf.current.scale);
    };
    const onGestureEnd = e => {
      e.preventDefault();
      isGesturing = false;
    };

    // Drag-pan: middle button anywhere, or primary button on canvas
    // background (anything that isn't an artboard or an inline editor).
    let drag = null;
    const onPointerDown = e => {
      const onBg = !e.target.closest('[data-dc-slot], .dc-editable');
      if (!(e.button === 1 || e.button === 0 && onBg)) return;
      e.preventDefault();
      vp.setPointerCapture(e.pointerId);
      drag = {
        id: e.pointerId,
        lx: e.clientX,
        ly: e.clientY
      };
      vp.style.cursor = 'grabbing';
    };
    const onPointerMove = e => {
      if (!drag || e.pointerId !== drag.id) return;
      tf.current.x += e.clientX - drag.lx;
      tf.current.y += e.clientY - drag.ly;
      drag.lx = e.clientX;
      drag.ly = e.clientY;
      apply();
    };
    const onPointerUp = e => {
      if (!drag || e.pointerId !== drag.id) return;
      vp.releasePointerCapture(e.pointerId);
      drag = null;
      vp.style.cursor = '';
    };

    // Host-driven zoom (toolbar % menu). Zooms around viewport centre so the
    // visible midpoint stays fixed — matching the host's iframe-zoom feel.
    const onHostMsg = e => {
      const d = e.data;
      if (d && d.type === '__dc_set_zoom' && typeof d.scale === 'number') {
        const r = vp.getBoundingClientRect();
        zoomAt(r.left + r.width / 2, r.top + r.height / 2, d.scale / tf.current.scale);
      } else if (d && d.type === '__dc_probe') {
        // Host's [readyGen] reset asks whether a canvas is present; it
        // fires on the iframe's native 'load', which for canvases with
        // images/fonts is after our mount-time announce, so re-announce.
        // Clear the pan-tick guard so apply() re-posts the current scale
        // even if it's unchanged — the host just reset dcScale to 1.
        window.parent.postMessage({
          type: '__dc_present'
        }, '*');
        lastPostedScale.current = undefined;
        apply();
      }
    };
    window.addEventListener('message', onHostMsg);
    // Announce canvas mode so the host toolbar proxies its % control here
    // instead of scaling the iframe element (which would just shrink the
    // viewport window of an infinite canvas). The apply() that follows emits
    // the initial __dc_zoom so the toolbar % is correct before first pinch.
    // lastPostedScale reset mirrors the __dc_probe handler: the layout
    // effect's restore-path apply() may already have posted the restored
    // scale (before __dc_present), so clear the guard to re-post it in order.
    window.parent.postMessage({
      type: '__dc_present'
    }, '*');
    lastPostedScale.current = undefined;
    apply();
    vp.addEventListener('wheel', onWheel, {
      passive: false
    });
    vp.addEventListener('gesturestart', onGestureStart, {
      passive: false
    });
    vp.addEventListener('gesturechange', onGestureChange, {
      passive: false
    });
    vp.addEventListener('gestureend', onGestureEnd, {
      passive: false
    });
    vp.addEventListener('pointerdown', onPointerDown);
    vp.addEventListener('pointermove', onPointerMove);
    vp.addEventListener('pointerup', onPointerUp);
    vp.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('message', onHostMsg);
      vp.removeEventListener('wheel', onWheel);
      vp.removeEventListener('gesturestart', onGestureStart);
      vp.removeEventListener('gesturechange', onGestureChange);
      vp.removeEventListener('gestureend', onGestureEnd);
      vp.removeEventListener('pointerdown', onPointerDown);
      vp.removeEventListener('pointermove', onPointerMove);
      vp.removeEventListener('pointerup', onPointerUp);
      vp.removeEventListener('pointercancel', onPointerUp);
    };
  }, [apply, minScale, maxScale]);
  const gridSvg = `url("data:image/svg+xml,%3Csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M120 0H0v120' fill='none' stroke='${encodeURIComponent(DC.grid)}' stroke-width='1'/%3E%3C/svg%3E")`;
  return /*#__PURE__*/React.createElement("div", {
    ref: vpRef,
    className: "design-canvas",
    style: {
      height: '100vh',
      width: '100vw',
      background: DC.bg,
      overflow: 'hidden',
      overscrollBehavior: 'none',
      touchAction: 'none',
      position: 'relative',
      fontFamily: DC.font,
      boxSizing: 'border-box',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: worldRef,
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      transformOrigin: '0 0',
      willChange: 'transform',
      width: 'max-content',
      minWidth: '100%',
      minHeight: '100%',
      padding: '60px 0 80px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: -6000,
      backgroundImage: gridSvg,
      backgroundSize: '120px 120px',
      pointerEvents: 'none',
      zIndex: -1
    }
  }), children));
}

// ─────────────────────────────────────────────────────────────
// DCSection — editable title + h-row of artboards in persisted order
// ─────────────────────────────────────────────────────────────
function DCSection({
  id,
  title,
  subtitle,
  children,
  gap = 48
}) {
  const ctx = React.useContext(DCCtx);
  const sid = id ?? title;
  const all = React.Children.toArray(dcFlatten(children));
  const artboards = all.filter(c => c && c.type === DCArtboard);
  const rest = all.filter(c => !(c && c.type === DCArtboard));
  const sec = ctx && sid && ctx.section(sid) || {};
  // Must match DesignCanvas's srcKey computation exactly (it filters falsy
  // IDs), or onDelete persists a srcKey that DesignCanvas never recognizes.
  const allIds = artboards.map(a => a.props.id ?? a.props.label).filter(Boolean);
  const srcKey = allIds.join('\x1f');
  const hidden = sec.srcKey === srcKey ? sec.hidden || [] : [];
  const srcOrder = allIds.filter(k => !hidden.includes(k));
  const order = React.useMemo(() => {
    const kept = (sec.order || []).filter(k => srcOrder.includes(k));
    return [...kept, ...srcOrder.filter(k => !kept.includes(k))];
  }, [sec.order, srcOrder.join('|')]);
  const byId = Object.fromEntries(artboards.map(a => [a.props.id ?? a.props.label, a]));

  // marginBottom counter-scales so the on-screen gap between sections stays
  // constant — otherwise at low zoom the (world-space) gap collapses while
  // the screen-constant sectionhead below it doesn't, and the title reads as
  // belonging to the section above. paddingBottom below is just enough for
  // the 24px artboard-header (abs-positioned above each card) plus ~8px, so
  // the title sits tight against its own row at every zoom.
  return /*#__PURE__*/React.createElement("div", {
    "data-dc-section": sid,
    style: {
      marginBottom: 'calc(80px * var(--dc-inv-zoom, 1))',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 60px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "dc-sectionhead",
    style: {
      paddingBottom: 36
    }
  }, /*#__PURE__*/React.createElement(DCEditable, {
    tag: "div",
    value: sec.title ?? title,
    onChange: v => ctx && sid && ctx.patchSection(sid, {
      title: v
    }),
    style: {
      fontSize: 28,
      fontWeight: 600,
      color: DC.title,
      letterSpacing: -0.4,
      marginBottom: 6,
      display: 'inline-block'
    }
  }), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      color: DC.subtitle
    }
  }, subtitle))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap,
      padding: '0 60px',
      alignItems: 'flex-start',
      width: 'max-content'
    }
  }, order.map(k => /*#__PURE__*/React.createElement(DCArtboardFrame, {
    key: k,
    sectionId: sid,
    artboard: byId[k],
    order: order,
    label: (sec.labels || {})[k] ?? byId[k].props.label,
    onRename: v => ctx && ctx.patchSection(sid, x => ({
      labels: {
        ...x.labels,
        [k]: v
      }
    })),
    onReorder: next => ctx && ctx.patchSection(sid, {
      order: next
    }),
    onDelete: () => ctx && ctx.patchSection(sid, x => ({
      hidden: [...(x.srcKey === srcKey ? x.hidden || [] : []), k],
      srcKey
    })),
    onFocus: () => ctx && ctx.setFocus(`${sid}/${k}`)
  }))), rest);
}

// DCArtboard — marker; rendered by DCArtboardFrame via DCSection.
function DCArtboard() {
  return null;
}

// Per-artboard export (kind: 'png' | 'html'). Both paths share the same
// self-contained clone: computed styles baked in, @font-face / <img> /
// inline-style background-image urls inlined as data URIs. PNG wraps the
// clone in foreignObject→canvas at 3× the artboard's natural width×height
// (same pipeline the host uses for page captures); HTML wraps it in a
// minimal standalone document. Both are independent of viewport zoom.
async function dcExport(node, w, h, name, kind) {
  try {
    await document.fonts.ready;
  } catch {}
  const toDataURL = url => fetch(url).then(r => r.blob()).then(b => new Promise(res => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = () => res(url);
    fr.readAsDataURL(b);
  })).catch(() => url);

  // Collect @font-face rules. ss.cssRules throws SecurityError on
  // cross-origin sheets (e.g. fonts.googleapis.com) — in that case fetch
  // the CSS text directly (those endpoints send ACAO:*) and regex-extract
  // the blocks. @import and @media/@supports are walked so nested
  // @font-face rules aren't missed.
  const fontRules = [],
    pending = [],
    seen = new Set();
  const scrapeCss = href => {
    if (seen.has(href)) return;
    seen.add(href);
    pending.push(fetch(href).then(r => r.text()).then(css => {
      for (const m of css.match(/@font-face\s*{[^}]*}/g) || []) fontRules.push({
        css: m,
        base: href
      });
      for (const m of css.matchAll(/@import\s+(?:url\()?['"]?([^'")\s;]+)/g)) scrapeCss(new URL(m[1], href).href);
    }).catch(() => {}));
  };
  const walk = (rules, base) => {
    for (const r of rules) {
      if (r.type === CSSRule.FONT_FACE_RULE) fontRules.push({
        css: r.cssText,
        base
      });else if (r.type === CSSRule.IMPORT_RULE && r.styleSheet) {
        const ibase = r.styleSheet.href || base;
        try {
          walk(r.styleSheet.cssRules, ibase);
        } catch {
          scrapeCss(ibase);
        }
      } else if (r.cssRules) walk(r.cssRules, base);
    }
  };
  for (const ss of document.styleSheets) {
    const base = ss.href || location.href;
    try {
      walk(ss.cssRules, base);
    } catch {
      if (ss.href) scrapeCss(ss.href);
    }
  }
  while (pending.length) await pending.shift();
  const fontCss = (await Promise.all(fontRules.map(async rule => {
    let out = rule.css,
      m;
    const re = /url\((['"]?)([^'")]+)\1\)/g;
    while (m = re.exec(rule.css)) {
      if (m[2].indexOf('data:') === 0) continue;
      let abs;
      try {
        abs = new URL(m[2], rule.base).href;
      } catch {
        continue;
      }
      out = out.split(m[0]).join('url("' + (await toDataURL(abs)) + '")');
    }
    return out;
  }))).join('\n');
  const cloneStyled = src => {
    if (src.nodeType === 8 || src.nodeType === 1 && src.tagName === 'SCRIPT') return document.createTextNode('');
    const dst = src.cloneNode(false);
    if (src.nodeType === 1) {
      const cs = getComputedStyle(src);
      let txt = '';
      for (let i = 0; i < cs.length; i++) txt += cs[i] + ':' + cs.getPropertyValue(cs[i]) + ';';
      dst.setAttribute('style', txt + 'animation:none;transition:none;');
      if (src.tagName === 'CANVAS') try {
        const im = document.createElement('img');
        im.src = src.toDataURL();
        im.setAttribute('style', txt);
        return im;
      } catch {}
    }
    for (let c = src.firstChild; c; c = c.nextSibling) dst.appendChild(cloneStyled(c));
    return dst;
  };
  const clone = cloneStyled(node);
  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  // Drop the card's own shadow/radius so the export is a flush w×h rect;
  // the artboard's own background (if any) is already in the computed style.
  clone.style.boxShadow = 'none';
  clone.style.borderRadius = '0';
  const jobs = [];
  clone.querySelectorAll('img').forEach(el => {
    const s = el.getAttribute('src');
    if (s && s.indexOf('data:') !== 0) jobs.push(toDataURL(el.src).then(d => el.setAttribute('src', d)));
  });
  [clone, ...clone.querySelectorAll('*')].forEach(el => {
    const bg = el.style.backgroundImage;
    if (!bg) return;
    let m;
    const re = /url\(["']?([^"')]+)["']?\)/g;
    while (m = re.exec(bg)) {
      const tok = m[0],
        url = m[1];
      if (url.indexOf('data:') === 0) continue;
      jobs.push(toDataURL(url).then(d => {
        el.style.backgroundImage = el.style.backgroundImage.split(tok).join('url("' + d + '")');
      }));
    }
  });
  await Promise.all(jobs);
  const xml = new XMLSerializer().serializeToString(clone);
  const save = (blob, ext) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name + '.' + ext;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  if (kind === 'html') {
    const html = '<!doctype html><html><head><meta charset="utf-8"><title>' + name + '</title>' + (fontCss ? '<style>' + fontCss + '</style>' : '') + '</head><body style="margin:0">' + xml + '</body></html>';
    return save(new Blob([html], {
      type: 'text/html'
    }), 'html');
  }

  // PNG: the SVG's own width/height must be the output resolution — an
  // <img>-loaded SVG rasterizes at its intrinsic size, so sizing it at 1×
  // and ctx.scale()-ing up would just upscale a 1× bitmap. viewBox maps the
  // w×h foreignObject onto the px·w × px·h SVG canvas so the browser renders
  // the HTML at full resolution.
  const px = 3;
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w * px + '" height="' + h * px + '" viewBox="0 0 ' + w + ' ' + h + '"><foreignObject width="' + w + '" height="' + h + '">' + (fontCss ? '<style><![CDATA[' + fontCss + ']]></style>' : '') + xml + '</foreignObject></svg>';
  const img = new Image();
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = () => rej(new Error('svg load failed'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
  const cv = document.createElement('canvas');
  cv.width = w * px;
  cv.height = h * px;
  cv.getContext('2d').drawImage(img, 0, 0);
  cv.toBlob(blob => save(blob, 'png'), 'image/png');
}
function DCArtboardFrame({
  sectionId,
  artboard,
  label,
  order,
  onRename,
  onReorder,
  onFocus,
  onDelete
}) {
  const {
    id: rawId,
    label: rawLabel,
    width = 260,
    height = 480,
    children,
    style = {}
  } = artboard.props;
  const id = rawId ?? rawLabel;
  const ref = React.useRef(null);
  const cardRef = React.useRef(null);
  const menuRef = React.useRef(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);

  // ⋯ menu: close on any outside pointerdown. Two-click delete lives inside
  // the menu — first click arms the row, second commits; closing disarms.
  React.useEffect(() => {
    if (!menuOpen) {
      setConfirming(false);
      return;
    }
    const off = e => {
      if (!menuRef.current || !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('pointerdown', off, true);
    return () => document.removeEventListener('pointerdown', off, true);
  }, [menuOpen]);
  const doExport = kind => {
    setMenuOpen(false);
    if (!cardRef.current) return;
    const name = String(label || id || 'artboard').replace(/[^\w\s.-]+/g, '_');
    dcExport(cardRef.current, width, height, name, kind).catch(e => console.error('[design-canvas] export failed:', e));
  };

  // Live drag-reorder: dragged card sticks to cursor; siblings slide into
  // their would-be slots in real time via transforms. DOM order only
  // changes on drop.
  const onGripDown = e => {
    e.preventDefault();
    e.stopPropagation();
    const me = ref.current;
    // translateX is applied in local (pre-scale) space but pointer deltas and
    // getBoundingClientRect().left are screen-space — divide by the viewport's
    // current scale so the dragged card tracks the cursor at any zoom level.
    const scale = me.getBoundingClientRect().width / me.offsetWidth || 1;
    const peers = Array.from(document.querySelectorAll(`[data-dc-section="${sectionId}"] [data-dc-slot]`));
    const homes = peers.map(el => ({
      el,
      id: el.dataset.dcSlot,
      x: el.getBoundingClientRect().left
    }));
    const slotXs = homes.map(h => h.x);
    const startIdx = order.indexOf(id);
    const startX = e.clientX;
    let liveOrder = order.slice();
    me.classList.add('dc-dragging');
    const layout = () => {
      for (const h of homes) {
        if (h.id === id) continue;
        const slot = liveOrder.indexOf(h.id);
        h.el.style.transform = `translateX(${(slotXs[slot] - h.x) / scale}px)`;
      }
    };
    const move = ev => {
      const dx = ev.clientX - startX;
      me.style.transform = `translateX(${dx / scale}px)`;
      const cur = homes[startIdx].x + dx;
      let nearest = 0,
        best = Infinity;
      for (let i = 0; i < slotXs.length; i++) {
        const d = Math.abs(slotXs[i] - cur);
        if (d < best) {
          best = d;
          nearest = i;
        }
      }
      if (liveOrder.indexOf(id) !== nearest) {
        liveOrder = order.filter(k => k !== id);
        liveOrder.splice(nearest, 0, id);
        layout();
      }
    };
    const up = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      const finalSlot = liveOrder.indexOf(id);
      me.classList.remove('dc-dragging');
      me.style.transform = `translateX(${(slotXs[finalSlot] - homes[startIdx].x) / scale}px)`;
      // After the settle transition, kill transitions + clear transforms +
      // commit the reorder in the same frame so there's no visual snap-back.
      setTimeout(() => {
        for (const h of homes) {
          h.el.style.transition = 'none';
          h.el.style.transform = '';
        }
        if (liveOrder.join('|') !== order.join('|')) onReorder(liveOrder);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          for (const h of homes) h.el.style.transition = '';
        }));
      }, 180);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    "data-dc-slot": id,
    style: {
      position: 'relative',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "dc-header",
    style: {
      color: DC.label
    },
    onPointerDown: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "dc-labelrow"
  }, /*#__PURE__*/React.createElement("div", {
    className: "dc-grip",
    onPointerDown: onGripDown,
    title: "Drag to reorder"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "9",
    height: "13",
    viewBox: "0 0 9 13",
    fill: "currentColor"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "2",
    cy: "2",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "7",
    cy: "2",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "2",
    cy: "6.5",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "7",
    cy: "6.5",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "2",
    cy: "11",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "7",
    cy: "11",
    r: "1.1"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "dc-labeltext",
    onClick: onFocus,
    title: "Click to focus"
  }, /*#__PURE__*/React.createElement(DCEditable, {
    value: label,
    onChange: onRename,
    onClick: e => e.stopPropagation(),
    style: {
      fontSize: 15,
      fontWeight: 500,
      color: DC.label,
      lineHeight: 1
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "dc-btns"
  }, /*#__PURE__*/React.createElement("div", {
    ref: menuRef,
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "dc-kebab",
    title: "More",
    onClick: () => setMenuOpen(o => !o)
  }, /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 12 12",
    fill: "currentColor"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "2.5",
    cy: "6",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "6",
    cy: "6",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "9.5",
    cy: "6",
    r: "1.1"
  }))), menuOpen && /*#__PURE__*/React.createElement("div", {
    className: "dc-menu",
    onPointerDown: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => doExport('png')
  }, "Download PNG"), /*#__PURE__*/React.createElement("button", {
    onClick: () => doExport('html')
  }, "Download HTML"), /*#__PURE__*/React.createElement("hr", null), /*#__PURE__*/React.createElement("button", {
    className: "dc-danger",
    onClick: () => {
      if (confirming) {
        setMenuOpen(false);
        onDelete();
      } else setConfirming(true);
    }
  }, confirming ? 'Click again to delete' : 'Delete'))), /*#__PURE__*/React.createElement("button", {
    className: "dc-expand",
    onClick: onFocus,
    title: "Focus"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 12 12",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M7 1h4v4M5 11H1V7M11 1L7.5 4.5M1 11l3.5-3.5"
  }))))), /*#__PURE__*/React.createElement("div", {
    ref: cardRef,
    className: "dc-card",
    style: {
      borderRadius: 2,
      boxShadow: '0 1px 3px rgba(0,0,0,.08),0 4px 16px rgba(0,0,0,.06)',
      overflow: 'hidden',
      width,
      height,
      background: '#fff',
      ...style
    }
  }, children || /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#bbb',
      fontSize: 13,
      fontFamily: DC.font
    }
  }, id)));
}

// Inline rename — commits on blur or Enter.
function DCEditable({
  value,
  onChange,
  style,
  tag = 'span',
  onClick
}) {
  const T = tag;
  return /*#__PURE__*/React.createElement(T, {
    className: "dc-editable",
    contentEditable: true,
    suppressContentEditableWarning: true,
    onClick: onClick,
    onPointerDown: e => e.stopPropagation(),
    onBlur: e => onChange && onChange(e.currentTarget.textContent),
    onKeyDown: e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.currentTarget.blur();
      }
    },
    style: style
  }, value);
}

// ─────────────────────────────────────────────────────────────
// Focus mode — overlay one artboard; ←/→ within section, ↑/↓ across
// sections, Esc or backdrop click to exit.
// ─────────────────────────────────────────────────────────────
function DCFocusOverlay({
  entry,
  sectionMeta,
  sectionOrder
}) {
  const ctx = React.useContext(DCCtx);
  const {
    sectionId,
    artboard
  } = entry;
  const sec = ctx.section(sectionId);
  const meta = sectionMeta[sectionId];
  const peers = meta.slotIds;
  const aid = artboard.props.id ?? artboard.props.label;
  const idx = peers.indexOf(aid);
  const secIdx = sectionOrder.indexOf(sectionId);
  const go = d => {
    const n = peers[(idx + d + peers.length) % peers.length];
    if (n) ctx.setFocus(`${sectionId}/${n}`);
  };
  const goSection = d => {
    // Sections whose artboards are all deleted have slotIds:[] — step past
    // them to the next non-empty section so ↑/↓ doesn't dead-end.
    const n = sectionOrder.length;
    for (let i = 1; i < n; i++) {
      const ns = sectionOrder[((secIdx + d * i) % n + n) % n];
      const first = sectionMeta[ns] && sectionMeta[ns].slotIds[0];
      if (first) {
        ctx.setFocus(`${ns}/${first}`);
        return;
      }
    }
  };
  React.useEffect(() => {
    const k = e => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(-1);
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        go(1);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        goSection(-1);
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        goSection(1);
      }
    };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  });
  const {
    width = 260,
    height = 480,
    children
  } = artboard.props;
  const [vp, setVp] = React.useState({
    w: window.innerWidth,
    h: window.innerHeight
  });
  React.useEffect(() => {
    const r = () => setVp({
      w: window.innerWidth,
      h: window.innerHeight
    });
    window.addEventListener('resize', r);
    return () => window.removeEventListener('resize', r);
  }, []);
  const scale = Math.max(0.1, Math.min((vp.w - 200) / width, (vp.h - 260) / height, 2));
  const [ddOpen, setDd] = React.useState(false);
  const Arrow = ({
    dir,
    onClick
  }) => /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      onClick();
    },
    style: {
      position: 'absolute',
      top: '50%',
      [dir]: 28,
      transform: 'translateY(-50%)',
      border: 'none',
      background: 'rgba(255,255,255,.08)',
      color: 'rgba(255,255,255,.9)',
      width: 44,
      height: 44,
      borderRadius: 22,
      fontSize: 18,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background .15s'
    },
    onMouseEnter: e => e.currentTarget.style.background = 'rgba(255,255,255,.18)',
    onMouseLeave: e => e.currentTarget.style.background = 'rgba(255,255,255,.08)'
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 18 18",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: dir === 'left' ? 'M11 3L5 9l6 6' : 'M7 3l6 6-6 6'
  })));

  // Portal to body so position:fixed is the real viewport regardless of any
  // transform on DesignCanvas's ancestors (including the canvas zoom itself).
  return ReactDOM.createPortal(/*#__PURE__*/React.createElement("div", {
    onClick: () => ctx.setFocus(null),
    onWheel: e => e.preventDefault(),
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'rgba(24,20,16,.6)',
      backdropFilter: 'blur(14px)',
      fontFamily: DC.font,
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 72,
      display: 'flex',
      alignItems: 'flex-start',
      padding: '16px 20px 0',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setDd(o => !o),
    style: {
      border: 'none',
      background: 'transparent',
      color: '#fff',
      cursor: 'pointer',
      padding: '6px 8px',
      borderRadius: 6,
      textAlign: 'left',
      fontFamily: 'inherit'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18,
      fontWeight: 600,
      letterSpacing: -0.3
    }
  }, meta.title), /*#__PURE__*/React.createElement("svg", {
    width: "11",
    height: "11",
    viewBox: "0 0 11 11",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    style: {
      opacity: .7
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2 4l3.5 3.5L9 4"
  }))), meta.subtitle && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 13,
      opacity: .6,
      fontWeight: 400,
      marginTop: 2
    }
  }, meta.subtitle)), ddOpen && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: '100%',
      left: 0,
      marginTop: 4,
      background: '#2a251f',
      borderRadius: 8,
      boxShadow: '0 8px 32px rgba(0,0,0,.4)',
      padding: 4,
      minWidth: 200,
      zIndex: 10
    }
  }, sectionOrder.filter(sid => sectionMeta[sid].slotIds.length).map(sid => /*#__PURE__*/React.createElement("button", {
    key: sid,
    onClick: () => {
      setDd(false);
      const f = sectionMeta[sid].slotIds[0];
      if (f) ctx.setFocus(`${sid}/${f}`);
    },
    style: {
      display: 'block',
      width: '100%',
      textAlign: 'left',
      border: 'none',
      cursor: 'pointer',
      background: sid === sectionId ? 'rgba(255,255,255,.1)' : 'transparent',
      color: '#fff',
      padding: '8px 12px',
      borderRadius: 5,
      fontSize: 14,
      fontWeight: sid === sectionId ? 600 : 400,
      fontFamily: 'inherit'
    }
  }, sectionMeta[sid].title)))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => ctx.setFocus(null),
    onMouseEnter: e => e.currentTarget.style.background = 'rgba(255,255,255,.12)',
    onMouseLeave: e => e.currentTarget.style.background = 'transparent',
    style: {
      border: 'none',
      background: 'transparent',
      color: 'rgba(255,255,255,.7)',
      width: 32,
      height: 32,
      borderRadius: 16,
      fontSize: 20,
      cursor: 'pointer',
      lineHeight: 1,
      transition: 'background .12s'
    }
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 64,
      bottom: 56,
      left: 100,
      right: 100,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: width * scale,
      height: height * scale,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width,
      height,
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
      background: '#fff',
      borderRadius: 2,
      overflow: 'hidden',
      boxShadow: '0 20px 80px rgba(0,0,0,.4)'
    }
  }, children || /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#bbb'
    }
  }, aid))), /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      fontSize: 14,
      fontWeight: 500,
      opacity: .85,
      textAlign: 'center'
    }
  }, (sec.labels || {})[aid] ?? artboard.props.label, /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: .5,
      marginLeft: 10,
      fontVariantNumeric: 'tabular-nums'
    }
  }, idx + 1, " / ", peers.length))), /*#__PURE__*/React.createElement(Arrow, {
    dir: "left",
    onClick: () => go(-1)
  }), /*#__PURE__*/React.createElement(Arrow, {
    dir: "right",
    onClick: () => go(1)
  }), /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      position: 'absolute',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: 8
    }
  }, peers.map((p, i) => /*#__PURE__*/React.createElement("button", {
    key: p,
    onClick: () => ctx.setFocus(`${sectionId}/${p}`),
    style: {
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      width: 6,
      height: 6,
      borderRadius: 3,
      background: i === idx ? '#fff' : 'rgba(255,255,255,.3)'
    }
  })))), document.body);
}

// ─────────────────────────────────────────────────────────────
// Post-it — absolute-positioned sticky note
// ─────────────────────────────────────────────────────────────
function DCPostIt({
  children,
  top,
  left,
  right,
  bottom,
  rotate = -2,
  width = 180
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top,
      left,
      right,
      bottom,
      width,
      background: DC.postitBg,
      padding: '14px 16px',
      fontFamily: '"Comic Sans MS", "Marker Felt", "Segoe Print", cursive',
      fontSize: 14,
      lineHeight: 1.4,
      color: DC.postitText,
      boxShadow: '0 2px 8px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
      transform: `rotate(${rotate}deg)`,
      zIndex: 5
    }
  }, children);
}
Object.assign(window, {
  DesignCanvas,
  DCSection,
  DCArtboard,
  DCPostIt
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "mockups/design-canvas.jsx", error: String((e && e.message) || e) }); }

// mockups/feedback.jsx
try { (() => {
// Feedback artboards:
//  - AuthCurrent  : visual recreation of /login (cropped for one phone width)
//  - AuthSuggested: what I'd ship instead
//  - MobileBefore : current LandingPage on a 280-wide phone (problems visible)
//  - MobileAfter  : same content reorganized mobile-first
//  - VisualNotes  : honest visual-design observations + tiny demos

// =============================================================
// AUTH - current state (recreated, scaled for 280-wide phone)
// =============================================================
const AuthCurrent = () => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 180,
    height: 180,
    borderRadius: '50%',
    background: 'rgba(255,99,72,0.20)',
    filter: 'blur(60px)'
  }
}), /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    bottom: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: '50%',
    background: 'rgba(247,183,49,0.12)',
    filter: 'blur(80px)'
  }
}), /*#__PURE__*/React.createElement(PStatus, null), /*#__PURE__*/React.createElement("div", {
  style: {
    padding: '4px 18px 14px',
    flexShrink: 0
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 9,
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.20em',
    color: 'rgba(238,240,255,0.50)'
  }
}, "\u2190 Back to Sparked")), /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1,
    overflow: 'hidden',
    padding: '0 18px 14px',
    position: 'relative'
  }
}, /*#__PURE__*/React.createElement("h1", {
  style: {
    fontFamily: 'Montserrat',
    fontSize: 26,
    fontWeight: 900,
    lineHeight: 1.0,
    letterSpacing: '-0.01em',
    margin: 0,
    backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  }
}, "Welcome back - ", /*#__PURE__*/React.createElement("br", null), "let's spark."), /*#__PURE__*/React.createElement("p", {
  style: {
    fontSize: 11.5,
    color: 'rgba(238,240,255,0.60)',
    margin: '8px 0 16px',
    fontWeight: 700
  }
}, "Your local scene is waiting for you."), /*#__PURE__*/React.createElement("div", {
  style: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 18,
    padding: 14
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    padding: 1,
    background: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
    borderRadius: 13,
    boxShadow: '0 6px 22px rgba(255,95,78,0.24)',
    marginBottom: 12
  }
}, /*#__PURE__*/React.createElement("button", {
  style: {
    background: '#14213D',
    color: '#fff',
    fontWeight: 900,
    fontSize: 12,
    padding: '10px 14px',
    borderRadius: 12,
    border: 'none',
    width: '100%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer'
  }
}, /*#__PURE__*/React.createElement("svg", {
  width: "14",
  height: "14",
  viewBox: "0 0 24 24"
}, /*#__PURE__*/React.createElement("path", {
  d: "M22 12c0-.8-.1-1.4-.2-2H12v4h5.6c-.2 1.3-1 2.3-2.1 3v2.5h3.4c2-1.8 3.1-4.5 3.1-7.5z",
  fill: "#4285F4"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 22c2.8 0 5.2-.9 6.9-2.5l-3.4-2.6c-.9.6-2 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.6v2.7C4.3 19.7 7.9 22 12 22z",
  fill: "#34A853"
}), /*#__PURE__*/React.createElement("path", {
  d: "M6.2 13.6c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V6.9H2.6C2 8.4 1.6 10.2 1.6 12s.4 3.6 1 5.1l3.6-2.7z",
  fill: "#FBBC04"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 5.6c1.5 0 2.9.5 4 1.5l3-3C17.2 2.5 14.8 1.5 12 1.5 7.9 1.5 4.3 3.8 2.6 6.9l3.6 2.7c.8-2.5 3.1-4 5.8-4z",
  fill: "#EA4335"
})), "Continue with Google")), /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    margin: '10px 0'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1,
    height: 1,
    background: 'linear-gradient(to right, transparent, rgba(252,163,17,0.25), transparent)'
  }
}), /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 8,
    fontWeight: 900,
    color: 'rgba(238,240,255,0.50)',
    letterSpacing: '0.20em'
  }
}, "OR"), /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1,
    height: 1,
    background: 'linear-gradient(to right, transparent, rgba(252,163,17,0.25), transparent)'
  }
})), /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 9,
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.25em',
    color: '#FCA311',
    display: 'block',
    marginBottom: 6
  }
}, "Email Address"), /*#__PURE__*/React.createElement("input", {
  placeholder: "you@domain.com",
  style: {
    width: '100%',
    background: 'rgba(20,33,61,0.30)',
    border: '1px solid rgba(238,240,255,0.15)',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: 10,
    fontSize: 11,
    marginBottom: 10,
    outline: 'none'
  }
}), /*#__PURE__*/React.createElement("div", {
  style: {
    padding: 1,
    background: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
    borderRadius: 13,
    boxShadow: '0 6px 22px rgba(255,95,78,0.24)'
  }
}, /*#__PURE__*/React.createElement("button", {
  style: {
    background: '#14213D',
    fontWeight: 900,
    fontSize: 12,
    padding: '10px 14px',
    borderRadius: 12,
    border: 'none',
    width: '100%',
    cursor: 'pointer'
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  }
}, "Send magic link"))))));

// =============================================================
// AUTH - suggested redesign
// =============================================================
const AuthSuggested = () => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    inset: 0
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    inset: 0,
    background: EVENTS[0].grad,
    opacity: 0.7
  }
}), /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, #14213D 38%, rgba(20,33,61,0.85) 65%, transparent 100%)'
  }
})), /*#__PURE__*/React.createElement(PStatus, null), /*#__PURE__*/React.createElement("div", {
  style: {
    padding: '4px 18px 8px',
    flexShrink: 0,
    position: 'relative',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
}, /*#__PURE__*/React.createElement(SparkLogoMini, {
  size: 16
}), /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 9,
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.20em',
    color: 'rgba(255,255,255,0.65)'
  }
}, "Skip")), /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1,
    position: 'relative',
    padding: '0 18px 14px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    gap: 6
  }
}, /*#__PURE__*/React.createElement(Eye, {
  color: "#ffca3a",
  size: 8
}, "Tonight at 7:30pm"), /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'Montserrat',
    fontSize: 17,
    fontWeight: 900,
    color: '#fff',
    letterSpacing: '-0.01em',
    lineHeight: 1.05
  }
}, "Sunset Songwriters Round"), /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 9.5,
    color: 'rgba(255,255,255,0.75)'
  }
}, "The Rebel Lounge \xB7 0.4 mi")), /*#__PURE__*/React.createElement("div", {
  style: {
    background: 'rgba(15,26,48,0.85)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 20,
    padding: 14
  }
}, /*#__PURE__*/React.createElement("h2", {
  style: {
    fontFamily: 'Montserrat',
    fontSize: 18,
    fontWeight: 900,
    lineHeight: 1.05,
    letterSpacing: '-0.01em',
    margin: '0 0 4px',
    color: '#fff'
  }
}, "Your city. ", /*#__PURE__*/React.createElement("span", {
  style: {
    backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  }
}, "Your preferences.")), /*#__PURE__*/React.createElement("p", {
  style: {
    fontSize: 10.5,
    color: 'rgba(238,240,255,0.65)',
    margin: '0 0 12px',
    lineHeight: 1.45,
    fontWeight: 500
  }
}, "Sign in to jump straight to the markets, music, and pop-ups you actually care about."), /*#__PURE__*/React.createElement(PrimaryCTA, {
  size: "md"
}, /*#__PURE__*/React.createElement("svg", {
  width: "14",
  height: "14",
  viewBox: "0 0 24 24",
  style: {
    marginRight: 2
  }
}, /*#__PURE__*/React.createElement("path", {
  d: "M22 12c0-.8-.1-1.4-.2-2H12v4h5.6c-.2 1.3-1 2.3-2.1 3v2.5h3.4c2-1.8 3.1-4.5 3.1-7.5z",
  fill: "#fff"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 22c2.8 0 5.2-.9 6.9-2.5l-3.4-2.6c-.9.6-2 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.6v2.7C4.3 19.7 7.9 22 12 22z",
  fill: "#fff",
  opacity: ".75"
}), /*#__PURE__*/React.createElement("path", {
  d: "M6.2 13.6c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V6.9H2.6C2 8.4 1.6 10.2 1.6 12s.4 3.6 1 5.1l3.6-2.7z",
  fill: "#fff",
  opacity: ".55"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 5.6c1.5 0 2.9.5 4 1.5l3-3C17.2 2.5 14.8 1.5 12 1.5 7.9 1.5 4.3 3.8 2.6 6.9l3.6 2.7c.8-2.5 3.1-4 5.8-4z",
  fill: "#fff",
  opacity: ".85"
})), "Continue with Google"), /*#__PURE__*/React.createElement("div", {
  style: {
    marginTop: 6,
    textAlign: 'center'
  }
}, /*#__PURE__*/React.createElement("button", {
  style: {
    background: 'transparent',
    color: 'rgba(255,255,255,0.65)',
    fontWeight: 600,
    fontSize: 10.5,
    padding: '8px 14px',
    border: 'none',
    cursor: 'pointer'
  }
}, "or send a magic link")))));

// =============================================================
// MOBILE BEFORE - current desktop landing crushed to 280
// =============================================================
const MobileBefore = () => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PStatus, null), /*#__PURE__*/React.createElement("div", {
  style: {
    padding: '4px 14px 8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0
  }
}, /*#__PURE__*/React.createElement(SparkLogoMini, {
  size: 16
}), /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    gap: 4
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 8.5,
    fontWeight: 900,
    color: 'rgba(255,255,255,0.7)'
  }
}, "Log In"), /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 8.5,
    fontWeight: 900,
    color: '#14213D',
    background: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
    padding: '4px 8px',
    borderRadius: 9
  }
}, "List an Event"))), /*#__PURE__*/React.createElement("div", {
  style: {
    padding: '0 14px 8px',
    flexShrink: 0,
    display: 'flex',
    gap: 4,
    overflowX: 'hidden',
    flexWrap: 'wrap'
  }
}, ['Near Phoenix · 25mi', 'Live Music', 'Markets', 'Art Walks', 'Pop-Ups'].map(l => /*#__PURE__*/React.createElement("span", {
  key: l,
  style: {
    fontSize: 7.5,
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    padding: '3px 7px',
    borderRadius: 9999,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.10)',
    color: 'rgba(238,240,255,0.85)',
    whiteSpace: 'nowrap'
  }
}, l))), /*#__PURE__*/React.createElement("div", {
  style: {
    padding: '4px 14px 12px',
    flexShrink: 0
  }
}, /*#__PURE__*/React.createElement("h1", {
  style: {
    fontFamily: 'Montserrat',
    fontSize: 30,
    fontWeight: 900,
    lineHeight: 0.92,
    letterSpacing: '-0.02em',
    margin: 0
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    display: 'block',
    color: '#fff'
  }
}, "YOUR CITY."), /*#__PURE__*/React.createElement("span", {
  style: {
    display: 'block',
    backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  }
}, "YOUR EVENTS."), /*#__PURE__*/React.createElement("span", {
  style: {
    display: 'block',
    color: '#414657'
  }
}, "NO ALGORITHM."))), /*#__PURE__*/React.createElement("div", {
  style: {
    padding: '0 14px',
    flexShrink: 0
  }
}, /*#__PURE__*/React.createElement("p", {
  style: {
    fontSize: 10,
    color: 'rgba(238,240,255,0.60)',
    lineHeight: 1.45,
    margin: '0 0 10px'
  }
}, "Sparked helps you discover and publish local events by distance, not by feed."), /*#__PURE__*/React.createElement(PrimaryCTA, {
  size: "md"
}, "List Your First Event In Minutes"), /*#__PURE__*/React.createElement("div", {
  style: {
    textAlign: 'center',
    fontSize: 8,
    color: 'rgba(255,255,255,0.25)',
    margin: '6px 0'
  }
}, "or"), /*#__PURE__*/React.createElement(OutlineCTA, null, "Browse Local Events \xB7 FREE")), /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1,
    overflow: 'hidden',
    padding: '10px 14px 14px',
    display: 'flex',
    alignItems: 'flex-end'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 16,
    padding: 10
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 6
  }
}, /*#__PURE__*/React.createElement(Eye, {
  size: 7.5
}, "TODAY"), /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 7.5,
    fontWeight: 900,
    color: 'rgba(238,240,255,0.5)',
    letterSpacing: '0.20em'
  }
}, "DOWNTOWN ARTS")), /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'Montserrat',
    fontSize: 13,
    fontWeight: 900,
    color: '#fff'
  }
}, "Art Walk Downtown"))));

// =============================================================
// MOBILE AFTER - same copy, mobile-optimized layout
// =============================================================
const MobileAfter = () => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PStatus, null), /*#__PURE__*/React.createElement("div", {
  style: {
    padding: '4px 18px 10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0
  }
}, /*#__PURE__*/React.createElement(SparkLogoMini, {
  size: 18
}), /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 10.5,
    fontWeight: 800,
    color: 'rgba(255,255,255,0.7)'
  }
}, "Log in")), /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1,
    overflow: 'hidden',
    padding: '0 18px 14px',
    position: 'relative'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    top: -20,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: '50%',
    background: 'rgba(255,99,72,0.20)',
    filter: 'blur(60px)'
  }
}), /*#__PURE__*/React.createElement("h1", {
  style: {
    fontFamily: 'Montserrat',
    fontSize: 38,
    fontWeight: 900,
    lineHeight: 0.95,
    letterSpacing: '-0.02em',
    margin: '6px 0 10px'
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    display: 'block',
    color: '#fff'
  }
}, "YOUR CITY."), /*#__PURE__*/React.createElement("span", {
  style: {
    display: 'block',
    backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  }
}, "YOUR EVENTS."), /*#__PURE__*/React.createElement("span", {
  style: {
    display: 'block',
    color: '#5a6378'
  }
}, "NO ALGORITHM.")), /*#__PURE__*/React.createElement("p", {
  style: {
    fontSize: 11,
    color: 'rgba(238,240,255,0.65)',
    lineHeight: 1.45,
    margin: '0 0 12px'
  }
}, "Sparked helps you discover and publish local events by distance, not by feed."), /*#__PURE__*/React.createElement("div", {
  style: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 14,
    padding: 10,
    marginBottom: 12
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6
  }
}, /*#__PURE__*/React.createElement(LiveDot, {
  size: 6
}), /*#__PURE__*/React.createElement(Eye, {
  size: 8.5
}, "47 events \xB7 5mi radius")), /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    gap: 5
  }
}, EVENTS.slice(0, 3).map(e => /*#__PURE__*/React.createElement("div", {
  key: e.id,
  style: {
    flex: '1 1 0',
    minWidth: 0,
    height: 44,
    borderRadius: 8,
    background: e.grad,
    position: 'relative'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent 60%)'
  }
}), /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    bottom: 3,
    left: 5,
    right: 5,
    color: '#fff',
    fontSize: 7,
    fontWeight: 900,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  }
}, e.name))))), /*#__PURE__*/React.createElement(PrimaryCTA, {
  size: "md"
}, "List Your First Event In Minutes"), /*#__PURE__*/React.createElement("div", {
  style: {
    textAlign: 'center',
    fontSize: 9,
    color: 'rgba(255,255,255,0.30)',
    margin: '6px 0',
    letterSpacing: '0.08em'
  }
}, "or"), /*#__PURE__*/React.createElement(OutlineCTA, null, "Browse Local Events", /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 8.5,
    fontWeight: 900,
    letterSpacing: '0.18em',
    backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginLeft: 4
  }
}, "FREE"))));

// =============================================================
// VISUAL REDESIGN - applies all the visual feedback in one go.
// Gradient restraint (logo + CTA only), fixed "NO ALGORITHM." contrast,
// real event imagery peeking into the hero, "For organizers" demoted
// to a header link per the separate-page recommendation.
// =============================================================
const VisualRedesign = () => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    inset: 0,
    background: EVENTS[2].grad,
    opacity: 0.85
  }
}), /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, #14213D 0%, rgba(20,33,61,0.65) 55%, transparent 100%)'
  }
})), /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    top: 200,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: '50%',
    background: 'rgba(247,183,49,0.14)',
    filter: 'blur(80px)'
  }
}), /*#__PURE__*/React.createElement(PStatus, null), /*#__PURE__*/React.createElement("div", {
  style: {
    padding: '4px 18px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
    position: 'relative'
  }
}, /*#__PURE__*/React.createElement(SparkLogoMini, {
  size: 18
}), /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    alignItems: 'center',
    gap: 14
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 10,
    fontWeight: 800,
    color: 'rgba(255,255,255,0.75)'
  }
}, "For organizers \u2192"), /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 10,
    fontWeight: 800,
    color: 'rgba(255,255,255,0.55)'
  }
}, "Log in"))), /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1,
    overflow: 'hidden',
    padding: '4px 18px 14px',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column'
  }
}, /*#__PURE__*/React.createElement(Eye, null, "Tonight in Phoenix"), /*#__PURE__*/React.createElement("h1", {
  style: {
    fontFamily: 'Montserrat',
    fontSize: 40,
    fontWeight: 900,
    lineHeight: 0.92,
    letterSpacing: '-0.02em',
    margin: '8px 0 12px'
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    display: 'block',
    color: '#fff'
  }
}, "YOUR CITY."), /*#__PURE__*/React.createElement("span", {
  style: {
    display: 'block',
    color: '#fff'
  }
}, "YOUR EVENTS."), /*#__PURE__*/React.createElement("span", {
  style: {
    display: 'block',
    color: '#5a6378'
  }
}, "NO ALGORITHM.")), /*#__PURE__*/React.createElement("p", {
  style: {
    fontSize: 11.5,
    color: 'rgba(238,240,255,0.65)',
    lineHeight: 1.5,
    margin: '0 0 14px',
    maxWidth: '32ch'
  }
}, "Sparked helps you discover and publish local events by distance, not by feed."), /*#__PURE__*/React.createElement("div", {
  style: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10
  }
}, /*#__PURE__*/React.createElement(LiveDot, {
  size: 6
}), /*#__PURE__*/React.createElement(Eye, {
  size: 9
}, "47 events \xB7 5 miles")), /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    gap: 6
  }
}, EVENTS.slice(0, 3).map(e => /*#__PURE__*/React.createElement("div", {
  key: e.id,
  style: {
    flex: '1 1 0',
    minWidth: 0,
    height: 70,
    borderRadius: 10,
    background: e.grad,
    position: 'relative',
    overflow: 'hidden'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent 55%)'
  }
}), /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    bottom: 5,
    left: 6,
    right: 6,
    color: '#fff',
    fontSize: 7.5,
    fontWeight: 900,
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  }
}, e.name), /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    top: 5,
    right: 6,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 7,
    fontWeight: 800,
    letterSpacing: '0.05em'
  }
}, e.dist))))), /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1
  }
}), /*#__PURE__*/React.createElement(PrimaryCTA, {
  size: "lg"
}, "Browse Local Events"), /*#__PURE__*/React.createElement("p", {
  style: {
    fontSize: 10,
    color: 'rgba(238,240,255,0.5)',
    textAlign: 'center',
    margin: '8px 0 0'
  }
}, "Free \xB7 No login required")));
Object.assign(window, {
  AuthCurrent,
  AuthSuggested,
  MobileBefore,
  MobileAfter,
  VisualRedesign
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "mockups/feedback.jsx", error: String((e && e.message) || e) }); }

// mockups/landings/faq.js
try { (() => {
// Sparked landings — shared FAQ accordion.
// Single source of content + behavior for every /landing funnel variant.
// Usage on any page: include the shared stylesheet (../_shared.css already
// loaded), add one mount point, and load this script:
//   <div data-faq-mount></div>
//   <script src="../faq.js" defer></script>
// It replaces the mount div with a fully-built <section class="faq-section">
// (title + accordion), so content/behavior only ever lives here.
(function () {
  var FAQ_ITEMS = [{
    q: 'What does it cost to post?',
    a: 'Community member Curbside posts are free — 3 every 100 days. Standard events are $5 (single-day), $12 (2–4 days), or $20 (5+ days). Plus events are $15 / $29 / $49 and add a 10-photo gallery, paid-entry display, and a site map with vendor pins.'
  }, {
    q: "What's the difference between a Curbside post and an Event?",
    a: 'Curbside posts are for casual community posts — yard sales, free pickup items, block celebrations. One photo, a description, an address, one day. Events are full listings for businesses and organizers: categories, schedules, venues, photo galleries.'
  }, {
    q: 'Is this a subscription?',
    a: "No. You pay once per event. That's it."
  }, {
    q: 'Do you sell tickets?',
    a: 'No — Sparked is where people find your event. You can display your entry fee, but admission is handled by you at the door or through your own ticketing.'
  }, {
    q: 'How does the feed decide what to show?',
    a: "Distance. Events near you show first — no algorithm, no paid placement. You can't buy a higher spot in the feed, and neither can anyone else."
  }, {
    q: 'What if I cancel my event?',
    a: 'Cancel 72+ hours before your event: full refund. Less than 72 hours: 50%. Same-day: no refund. Attendees see your event marked as cancelled.'
  }, {
    q: 'Do attendees pay anything?',
    a: 'No. Browsing, bookmarking, and RSVPing are free — no account needed to browse.'
  }, {
    q: 'What do you do with my data?',
    a: 'As little as possible. Location is used live to rank your feed and never stored. Analytics are off by default. You can download or delete everything in Settings → Privacy.'
  }, {
    q: 'Can my team manage our events?',
    a: 'Teams and roles are coming. Today each workspace has one owner, and business handoff is supported.'
  }, {
    q: 'How do I report a problem event?',
    a: 'Every event has a Report option — flagged events are reviewed and removed if they break the rules.'
  }];
  function renderFAQ(mount) {
    var section = document.createElement('section');
    section.className = 'faq-section';
    section.setAttribute('aria-labelledby', 'faq-h');
    var shell = document.createElement('div');
    shell.className = 'shell';
    var title = document.createElement('h2');
    title.className = 'faq-title';
    title.id = 'faq-h';
    title.textContent = 'Questions? We have answers.';
    shell.appendChild(title);
    var list = document.createElement('div');
    list.className = 'faq-list';
    FAQ_ITEMS.forEach(function (item, i) {
      var row = document.createElement('div');
      row.className = 'faq-item';
      var qId = 'faq-q-' + i,
        aId = 'faq-a-' + i;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'faq-q';
      btn.id = qId;
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', aId);
      btn.innerHTML = '<span>' + item.q + '</span>' + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
      var aWrap = document.createElement('div');
      aWrap.className = 'faq-a-wrap';
      var aInner = document.createElement('div');
      aInner.className = 'faq-a-inner';
      var aP = document.createElement('p');
      aP.className = 'faq-a';
      aP.id = aId;
      aP.setAttribute('role', 'region');
      aP.setAttribute('aria-labelledby', qId);
      aP.textContent = item.a;
      aInner.appendChild(aP);
      aWrap.appendChild(aInner);
      btn.addEventListener('click', function () {
        var willOpen = !row.classList.contains('open');
        list.querySelectorAll('.faq-item.open').forEach(function (openRow) {
          openRow.classList.remove('open');
          openRow.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
        });
        if (willOpen) {
          row.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
      row.appendChild(btn);
      row.appendChild(aWrap);
      list.appendChild(row);
    });
    shell.appendChild(list);
    section.appendChild(shell);
    mount.replaceWith(section);
  }
  function init() {
    document.querySelectorAll('[data-faq-mount]').forEach(renderFAQ);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "mockups/landings/faq.js", error: String((e && e.message) || e) }); }

// mockups/shared.jsx
try { (() => {
// Shared primitives for Sparked landing-page mockups.
// Phone frame ~280×600 (scaled to feel like a real device in the canvas).
// Each variation renders inside a Phone, no external scroll logic.

const Phone = ({
  children,
  label
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    width: 340,
    height: 720,
    borderRadius: 44,
    padding: 8,
    background: '#0a0a0a',
    boxShadow: '0 16px 50px rgba(0,0,0,0.32), 0 2px 6px rgba(0,0,0,0.18)',
    position: 'relative'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
    overflow: 'hidden',
    background: '#14213D',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column'
  }
}, children), /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    top: 14,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 96,
    height: 26,
    background: '#000',
    borderRadius: 9999,
    zIndex: 5
  }
}));
const PStatus = ({
  tint = 'light'
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    height: 36,
    padding: '12px 22px 0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
    color: tint === 'dark' ? '#14213D' : '#fff',
    fontSize: 11,
    fontWeight: 700,
    fontFamily: 'Inter, sans-serif'
  }
}, /*#__PURE__*/React.createElement("span", null, "9:41"), /*#__PURE__*/React.createElement("span", {
  style: {
    display: 'inline-flex',
    gap: 4,
    alignItems: 'center'
  }
}, /*#__PURE__*/React.createElement("svg", {
  width: "12",
  height: "9",
  viewBox: "0 0 16 11",
  fill: tint === 'dark' ? '#14213D' : 'white'
}, /*#__PURE__*/React.createElement("rect", {
  x: "0",
  y: "7",
  width: "3",
  height: "4"
}), /*#__PURE__*/React.createElement("rect", {
  x: "4",
  y: "5",
  width: "3",
  height: "6"
}), /*#__PURE__*/React.createElement("rect", {
  x: "8",
  y: "2",
  width: "3",
  height: "9"
}), /*#__PURE__*/React.createElement("rect", {
  x: "12",
  y: "0",
  width: "3",
  height: "11"
})), /*#__PURE__*/React.createElement("svg", {
  width: "18",
  height: "9",
  viewBox: "0 0 24 11",
  fill: "none",
  stroke: tint === 'dark' ? '#14213D' : 'white',
  strokeWidth: "1"
}, /*#__PURE__*/React.createElement("rect", {
  x: "1",
  y: "1",
  width: "20",
  height: "9",
  rx: "2"
}))));
const SparkWord = ({
  size = 18,
  gradient = true,
  color = '#fff'
}) => /*#__PURE__*/React.createElement("span", {
  style: {
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 900,
    fontSize: size,
    letterSpacing: '-0.01em',
    lineHeight: 1,
    ...(gradient ? {
      backgroundImage: 'linear-gradient(135deg,#ff5f4e 0%,#ff8c38 50%,#ffca3a 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    } : {
      color
    })
  }
}, "Sparked");
const SparkLogoMini = ({
  size = 22
}) => {
  const w = Math.round(size * 0.74);
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: w,
    height: size,
    viewBox: "0 0 56 76",
    fill: "none",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "tfb",
    x1: "0",
    y1: "1",
    x2: "0",
    y2: "0"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#ff5f4e"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#ff8c38"
  })), /*#__PURE__*/React.createElement("linearGradient", {
    id: "tft",
    x1: "0",
    y1: "1",
    x2: "0",
    y2: "0"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#ff8c38"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#ffca3a"
  }))), /*#__PURE__*/React.createElement("path", {
    d: "M28 68 C16 58 8 46 10 32 C12 20 20 12 28 10 C24 16 22 24 24 32 C26 40 32 44 32 52 C32 60 30 66 28 68Z",
    fill: "url(#tfb)"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M28 8 C38 16 46 26 44 38 C42 50 34 58 28 60 C32 54 34 46 32 38 C30 30 24 26 24 18 C24 12 26 9 28 8Z",
    fill: "url(#tft)",
    opacity: "0.9"
  })), /*#__PURE__*/React.createElement(SparkWord, {
    size: Math.round(size * 0.62)
  }));
};
const PrimaryCTA = ({
  children,
  onClick,
  full = true,
  size = 'md'
}) => {
  const padding = size === 'lg' ? '14px 22px' : '12px 18px';
  const fs = size === 'lg' ? 14 : 13;
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
      color: '#14213D',
      fontWeight: 900,
      fontSize: fs,
      padding,
      borderRadius: 14,
      border: 'none',
      cursor: 'pointer',
      boxShadow: '0 6px 22px rgba(255,95,78,0.24)',
      width: full ? '100%' : 'auto',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8
    }
  }, children);
};
const OutlineCTA = ({
  children,
  onClick,
  full = true
}) => /*#__PURE__*/React.createElement("button", {
  onClick: onClick,
  style: {
    background: 'rgba(255,255,255,0.05)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.20)',
    fontWeight: 800,
    fontSize: 13,
    padding: '11px 18px',
    borderRadius: 14,
    cursor: 'pointer',
    width: full ? '100%' : 'auto',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  }
}, children);
const TextLink = ({
  children,
  color = '#F7B731'
}) => /*#__PURE__*/React.createElement("span", {
  style: {
    color,
    fontWeight: 800,
    fontSize: 11,
    cursor: 'pointer'
  }
}, children);
const Eye = ({
  children,
  color = '#FCA311',
  size = 9
}) => /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: size,
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.20em',
    color
  }
}, children);
const TinyPill = ({
  children,
  active
}) => /*#__PURE__*/React.createElement("span", {
  style: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 9px',
    borderRadius: 9999,
    fontFamily: 'Inter, sans-serif',
    fontWeight: 900,
    fontSize: 8.5,
    textTransform: 'uppercase',
    letterSpacing: '0.18em',
    color: active ? '#14213D' : 'rgba(238,240,255,0.65)',
    background: active ? 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' : 'rgba(255,255,255,0.05)',
    border: active ? 'none' : '1px solid rgba(255,255,255,0.10)',
    whiteSpace: 'nowrap'
  }
}, children);
const LiveDot = ({
  size = 8
}) => /*#__PURE__*/React.createElement("span", {
  style: {
    width: size,
    height: size,
    background: '#ff5f4e',
    borderRadius: 9999,
    display: 'inline-block',
    boxShadow: `0 0 0 ${size / 2}px rgba(255,95,78,0.35), 0 0 12px rgba(255,95,78,0.6)`
  }
});

// ===== iconography (Lucide-style stroke icons, hand-traced)
const I = ({
  name,
  size = 14,
  color = 'currentColor',
  strokeWidth = 2
}) => {
  const p = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
  };
  switch (name) {
    case 'pin':
      return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("path", {
        d: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "10",
        r: "3"
      }));
    case 'cal':
      return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("rect", {
        x: "3",
        y: "4",
        width: "18",
        height: "18",
        rx: "2"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M16 2v4M8 2v4M3 10h18"
      }));
    case 'clock':
      return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "10"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M12 6v6l4 2"
      }));
    case 'search':
      return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("circle", {
        cx: "11",
        cy: "11",
        r: "8"
      }), /*#__PURE__*/React.createElement("path", {
        d: "m21 21-4.3-4.3"
      }));
    case 'plus':
      return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("path", {
        d: "M5 12h14M12 5v14"
      }));
    case 'arrow':
      return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("path", {
        d: "M5 12h14M13 5l7 7-7 7"
      }));
    case 'arrow-down':
      return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("path", {
        d: "M12 5v14M5 13l7 7 7-7"
      }));
    case 'sparkles':
      return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("path", {
        d: "M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"
      }));
    case 'mic':
      return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("rect", {
        x: "9",
        y: "3",
        width: "6",
        height: "12",
        rx: "3"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M5 11a7 7 0 0 0 14 0M12 18v3"
      }));
    case 'palette':
      return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("path", {
        d: "M12 22a10 10 0 1 1 0-20c5 0 9 3 9 7 0 3-3 4-5 4h-2a2 2 0 0 0 0 4 2 2 0 0 1-2 5z"
      }));
    case 'store':
      return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("path", {
        d: "M3 9 4 4h16l1 5M3 9v11h18V9M3 9h18M9 14h6"
      }));
    case 'tent':
      return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("path", {
        d: "M3 20 12 4l9 16M9 20v-4h6v4"
      }));
    case 'map':
      return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("polygon", {
        points: "3 6 9 4 15 6 21 4 21 18 15 20 9 18 3 20"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "9",
        y1: "4",
        x2: "9",
        y2: "18"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "15",
        y1: "6",
        x2: "15",
        y2: "20"
      }));
    case 'compass':
      return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "10"
      }), /*#__PURE__*/React.createElement("polygon", {
        points: "16 8 14 14 8 16 10 10"
      }));
    case 'flame':
      return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("path", {
        d: "M14 4c0 6-4 4-4 9a4 4 0 0 0 8 0c0-4-4-4-4-9z"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M9 11c-2 2-2 6 1 8"
      }));
    case 'megaphone':
      return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("path", {
        d: "M3 11v2l16 6V5L3 11z"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M3 11h2v2H3z"
      }));
    case 'check':
      return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("path", {
        d: "M20 6 9 17l-5-5"
      }));
    case 'user':
      return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "7",
        r: "4"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M4 21v-1a8 8 0 0 1 16 0v1"
      }));
    case 'eye':
      return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("path", {
        d: "M2 12s4-8 10-8 10 8 10 8-4 8-10 8S2 12 2 12z"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "3"
      }));
    case 'heart':
      return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("path", {
        d: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      }));
    default:
      return null;
  }
};

// Sample event seed used across variations so the "feel" is consistent
const EVENTS = [{
  id: 1,
  name: 'Sunset Songwriters Round',
  loc: 'The Rebel Lounge',
  dist: '0.4 mi',
  time: 'Tonight · 7:30pm',
  tags: ['Music', 'Live'],
  live: true,
  grad: 'linear-gradient(135deg,#3a1a3e,#7a2a6a 55%,#ff8c38)'
}, {
  id: 2,
  name: 'Roosevelt Saturday Market',
  loc: 'Roosevelt Park',
  dist: '1.2 mi',
  time: 'Sat 8:00am',
  tags: ['Markets', 'Food'],
  live: false,
  grad: 'linear-gradient(135deg,#1d4d2c,#3a8e5c 55%,#a8d68b)'
}, {
  id: 3,
  name: 'First Friday Art Walk',
  loc: 'Roosevelt Row',
  dist: '0.8 mi',
  time: 'Fri 6:00pm',
  tags: ['Art', 'Community'],
  live: false,
  grad: 'linear-gradient(135deg,#5b3220,#a8551d 55%,#e09c3a)'
}, {
  id: 4,
  name: 'Phx Print Fair',
  loc: 'Warehouse 23',
  dist: '2.1 mi',
  time: 'Sun 11:00am',
  tags: ['Art', 'Markets'],
  live: false,
  grad: 'linear-gradient(135deg,#26384b,#5d7a98 55%,#ffca3a)'
}, {
  id: 5,
  name: 'Bike-In Movie: Goonies',
  loc: 'Civic Space Park',
  dist: '1.5 mi',
  time: 'Sat 8:30pm',
  tags: ['Family', 'Outdoor'],
  live: false,
  grad: 'linear-gradient(135deg,#1a2b4a,#3a5a8c 55%,#ff8c38)'
}];
Object.assign(window, {
  Phone,
  PStatus,
  SparkWord,
  SparkLogoMini,
  PrimaryCTA,
  OutlineCTA,
  TextLink,
  Eye,
  TinyPill,
  LiveDot,
  I,
  EVENTS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "mockups/shared.jsx", error: String((e && e.message) || e) }); }

// mockups/variations.jsx
try { (() => {
// Five mobile-first landing variations for Sparked.
// Each Variation* is a Phone interior - no scaling; the canvas handles that.

// ------ V1 : DISCOVERY FIRST ----------------------------------------
// Lead with proximity + a live count, browse is the primary action,
// organizer entry is a quiet secondary line at the bottom.
const V1 = () => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PStatus, null), /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    top: -40,
    left: -40,
    width: 180,
    height: 180,
    borderRadius: '50%',
    background: 'rgba(255,99,72,0.30)',
    filter: 'blur(60px)'
  }
}), /*#__PURE__*/React.createElement("div", {
  style: {
    padding: '4px 18px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0
  }
}, /*#__PURE__*/React.createElement(SparkLogoMini, {
  size: 18
}), /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 10,
    fontWeight: 800,
    color: 'rgba(255,255,255,0.7)'
  }
}, "Log in")), /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1,
    overflow: 'hidden',
    padding: '4px 18px 14px',
    position: 'relative'
  }
}, /*#__PURE__*/React.createElement(Eye, null, "Tonight in Phoenix"), /*#__PURE__*/React.createElement("h1", {
  style: {
    fontFamily: 'Montserrat',
    fontSize: 28,
    fontWeight: 900,
    lineHeight: 1.0,
    letterSpacing: '-0.01em',
    margin: '8px 0 14px',
    color: '#fff'
  }
}, "47 events ", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
  style: {
    backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  }
}, "within 5 miles.")), /*#__PURE__*/React.createElement("p", {
  style: {
    fontSize: 11.5,
    color: 'rgba(238,240,255,0.6)',
    lineHeight: 1.5,
    margin: '0 0 14px'
  }
}, "Skip the algorithm. See what's actually near you right now."), /*#__PURE__*/React.createElement("div", {
  style: {
    height: 200,
    borderRadius: 18,
    position: 'relative',
    overflow: 'hidden',
    background: 'radial-gradient(circle at 40% 30%, #243a64 0%, #0f1a30 70%)',
    border: '1px solid rgba(255,255,255,0.08)',
    marginBottom: 14
  }
}, [...Array(6)].map((_, i) => /*#__PURE__*/React.createElement("div", {
  key: 'h' + i,
  style: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: `${15 + i * 15}%`,
    height: 1,
    background: 'rgba(255,255,255,0.04)'
  }
})), [...Array(5)].map((_, i) => /*#__PURE__*/React.createElement("div", {
  key: 'v' + i,
  style: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: `${15 + i * 18}%`,
    width: 1,
    background: 'rgba(255,255,255,0.04)'
  }
})), [{
  l: 25,
  t: 30,
  n: 8,
  c: '#ff5f4e'
}, {
  l: 55,
  t: 48,
  n: 14,
  c: '#FCA311'
}, {
  l: 35,
  t: 65,
  n: 5,
  c: '#ffca3a'
}, {
  l: 72,
  t: 25,
  n: 3,
  c: '#ff8c38'
}, {
  l: 78,
  t: 70,
  n: 17,
  c: '#ff5f4e'
}].map((pin, i) => /*#__PURE__*/React.createElement("div", {
  key: i,
  style: {
    position: 'absolute',
    left: `${pin.l}%`,
    top: `${pin.t}%`,
    transform: 'translate(-50%,-50%)',
    background: pin.c,
    color: '#14213D',
    fontFamily: 'Montserrat',
    fontWeight: 900,
    fontSize: 10,
    width: 22 + pin.n * 0.6,
    height: 22 + pin.n * 0.6,
    borderRadius: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 0 0 3px ${pin.c}40, 0 0 14px ${pin.c}80`
  }
}, pin.n)), /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    left: '50%',
    top: '52%',
    transform: 'translate(-50%,-50%)'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    width: 14,
    height: 14,
    background: '#3b82f6',
    borderRadius: 9999,
    boxShadow: '0 0 0 4px rgba(59,130,246,0.30)'
  }
}))), /*#__PURE__*/React.createElement(PrimaryCTA, {
  size: "lg"
}, "Browse Local Events ", /*#__PURE__*/React.createElement(I, {
  name: "arrow",
  size: 14,
  color: "#14213D"
}))), /*#__PURE__*/React.createElement("div", {
  style: {
    padding: '12px 18px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(15,26,48,0.6)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0
  }
}, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 10.5,
    fontWeight: 700,
    color: '#fff'
  }
}, "Run events?"), /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 9,
    color: 'rgba(238,240,255,0.55)'
  }
}, "Reach the people next door.")), /*#__PURE__*/React.createElement(TextLink, null, "List an event \u2192")));

// ------ V2 : TONIGHT'S PICK (single hero card) ----------------------
// Magazine-cover treatment: one curated event fills the viewport.
// Swipe-down indicator hints at the feed below.
const V2 = () => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    inset: 0,
    background: EVENTS[0].grad
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, #14213D 18%, rgba(20,33,61,0.50) 55%, transparent 100%)'
  }
})), /*#__PURE__*/React.createElement(PStatus, null), /*#__PURE__*/React.createElement("div", {
  style: {
    padding: '6px 18px 0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    flexShrink: 0
  }
}, /*#__PURE__*/React.createElement(SparkLogoMini, {
  size: 18
}), /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 10,
    fontWeight: 800,
    color: 'rgba(255,255,255,0.8)'
  }
}, "Skip")), /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1,
    padding: '14px 18px 0',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column'
  }
}, /*#__PURE__*/React.createElement(Eye, {
  color: "#ffca3a"
}, "Editor's Pick \xB7 Tonight"), /*#__PURE__*/React.createElement("div", {
  style: {
    marginTop: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 6
  }
}, /*#__PURE__*/React.createElement(LiveDot, {
  size: 7
}), /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: '0.20em',
    color: '#fff',
    textTransform: 'uppercase'
  }
}, "Live in 1h 20m")), /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1
  }
}), /*#__PURE__*/React.createElement("h1", {
  style: {
    fontFamily: 'Montserrat',
    fontSize: 36,
    fontWeight: 900,
    lineHeight: 0.95,
    letterSpacing: '-0.02em',
    margin: '0 0 12px',
    color: '#fff'
  }
}, EVENTS[0].name), /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    marginBottom: 4
  }
}, /*#__PURE__*/React.createElement(I, {
  name: "pin",
  size: 11,
  color: "#FCA311"
}), /*#__PURE__*/React.createElement("span", null, EVENTS[0].loc, " \xB7 ", EVENTS[0].dist)), /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    marginBottom: 16
  }
}, /*#__PURE__*/React.createElement(I, {
  name: "clock",
  size: 11,
  color: "#ff5f4e"
}), /*#__PURE__*/React.createElement("span", null, EVENTS[0].time)), /*#__PURE__*/React.createElement(PrimaryCTA, {
  size: "lg"
}, "Open in Sparked"), /*#__PURE__*/React.createElement("div", {
  style: {
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 10
  }
}, /*#__PURE__*/React.createElement(I, {
  name: "arrow-down",
  size: 16,
  color: "rgba(255,255,255,0.6)"
}), /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: 800,
    letterSpacing: '0.20em',
    textTransform: 'uppercase',
    marginTop: 2
  }
}, "46 more nearby"))));

// ------ V3 : THIS WEEK, NEAR YOU --------------------------------
// Anti-algorithm positioning. Eyebrow carries "No algorithm" microcopy,
// flat H1 (no gradient), swipeable strip of real events, category index
// for "this week." Brand color lives only on the logo + final CTA.
const V3 = () => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PStatus, null), /*#__PURE__*/React.createElement("div", {
  style: {
    padding: '6px 18px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0
  }
}, /*#__PURE__*/React.createElement(SparkLogoMini, {
  size: 18
}), /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 10,
    fontWeight: 800,
    color: 'rgba(255,255,255,0.7)'
  }
}, "Log in")), /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1,
    overflow: 'auto',
    padding: '0 18px 14px'
  }
}, /*#__PURE__*/React.createElement(Eye, null, "Tonight in Phoenix \xB7 No algorithm"), /*#__PURE__*/React.createElement("h1", {
  style: {
    fontFamily: 'Montserrat',
    fontSize: 30,
    fontWeight: 900,
    lineHeight: 0.95,
    letterSpacing: '-0.01em',
    margin: '8px 0 8px',
    color: '#fff'
  }
}, "YOUR CITY.", /*#__PURE__*/React.createElement("br", null), "YOUR EVENTS."), /*#__PURE__*/React.createElement("p", {
  style: {
    fontSize: 11.5,
    color: 'rgba(238,240,255,0.65)',
    lineHeight: 1.5,
    margin: '0 0 14px'
  }
}, "Skip the algorithm. See what's actually going on near you this week."), /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    gap: 10,
    overflowX: 'auto',
    scrollSnapType: 'x mandatory',
    scrollPaddingLeft: 18,
    margin: '0 -18px 16px',
    padding: '0 18px',
    scrollbarWidth: 'none'
  }
}, EVENTS.map(e => /*#__PURE__*/React.createElement("div", {
  key: e.id,
  style: {
    flex: '0 0 auto',
    width: 158,
    scrollSnapAlign: 'start',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    overflow: 'hidden'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    height: 96,
    background: e.grad,
    position: 'relative'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(20,33,61,0.65), transparent 55%)'
  }
}), e.live && /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    top: 8,
    left: 8
  }
}, /*#__PURE__*/React.createElement(LiveDot, {
  size: 6
})), /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    top: 8,
    right: 8,
    background: 'rgba(15,26,48,0.70)',
    backdropFilter: 'blur(6px)',
    border: '1px solid rgba(255,255,255,0.10)',
    padding: '2px 7px',
    borderRadius: 9999,
    fontSize: 8,
    fontWeight: 900,
    color: '#fff',
    letterSpacing: '0.10em'
  }
}, e.dist)), /*#__PURE__*/React.createElement("div", {
  style: {
    padding: '10px 11px 11px'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'Montserrat',
    fontWeight: 900,
    fontSize: 12,
    color: '#fff',
    letterSpacing: '-0.01em',
    lineHeight: 1.15,
    marginBottom: 4,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  }
}, e.name), /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 9.5,
    color: 'rgba(238,240,255,0.55)'
  }
}, e.time))))), /*#__PURE__*/React.createElement(Eye, null, "This week"), /*#__PURE__*/React.createElement("div", {
  style: {
    marginTop: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 0
  }
}, [{
  icon: 'mic',
  label: 'Live music',
  count: 12
}, {
  icon: 'store',
  label: 'Markets & makers',
  count: 8
}, {
  icon: 'palette',
  label: 'Art & galleries',
  count: 14
}, {
  icon: 'tent',
  label: 'Pop-ups & outdoor',
  count: 7
}].map((row, i) => /*#__PURE__*/React.createElement("div", {
  key: row.label,
  style: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 0',
    borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    width: 28,
    height: 28,
    borderRadius: 9,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(252,163,17,0.10)',
    color: '#FCA311',
    border: '1px solid rgba(252,163,17,0.25)'
  }
}, /*#__PURE__*/React.createElement(I, {
  name: row.icon,
  size: 14
})), /*#__PURE__*/React.createElement("span", {
  style: {
    flex: 1,
    color: '#fff',
    fontWeight: 700,
    fontSize: 12
  }
}, row.label), /*#__PURE__*/React.createElement("span", {
  style: {
    fontFamily: 'Montserrat',
    fontWeight: 900,
    fontSize: 14,
    color: '#F7B731'
  }
}, row.count), /*#__PURE__*/React.createElement(I, {
  name: "arrow",
  size: 11,
  color: "rgba(255,255,255,0.4)"
}))))), /*#__PURE__*/React.createElement("div", {
  style: {
    padding: '10px 18px 14px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    flexShrink: 0
  }
}, /*#__PURE__*/React.createElement(PrimaryCTA, {
  size: "md"
}, "Start browsing")));

// ------ V4 : LIVE NOW (social / stories) ------------------------------
// Horizontal stories row up top, vertical feed below.
const V4 = () => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PStatus, null), /*#__PURE__*/React.createElement("div", {
  style: {
    padding: '6px 18px 8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0
  }
}, /*#__PURE__*/React.createElement(SparkLogoMini, {
  size: 18
}), /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 10,
    fontWeight: 800,
    color: 'rgba(255,255,255,0.7)'
  }
}, "Log in")), /*#__PURE__*/React.createElement("div", {
  style: {
    padding: '4px 12px 12px',
    flexShrink: 0
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    gap: 10,
    overflowX: 'auto'
  }
}, [{
  name: 'The Rebel',
  live: true,
  c: '#7a2a6a'
}, {
  name: 'Roosevelt',
  live: true,
  c: '#3a8e5c'
}, {
  name: 'WrhseArts',
  live: false,
  c: '#a8551d'
}, {
  name: 'Print Soc.',
  live: false,
  c: '#5d7a98'
}, {
  name: 'CivicPark',
  live: false,
  c: '#3a5a8c'
}].map(s => /*#__PURE__*/React.createElement("div", {
  key: s.name,
  style: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    padding: 2,
    background: s.live ? 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' : 'rgba(255,255,255,0.10)'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
    background: s.c,
    border: '2px solid #14213D'
  }
})), /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 8.5,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: 700,
    maxWidth: 56,
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  }
}, s.name))))), /*#__PURE__*/React.createElement("div", {
  style: {
    padding: '0 18px 12px',
    flexShrink: 0
  }
}, /*#__PURE__*/React.createElement("h1", {
  style: {
    fontFamily: 'Montserrat',
    fontSize: 24,
    fontWeight: 900,
    lineHeight: 1.0,
    letterSpacing: '-0.01em',
    margin: 0,
    color: '#fff'
  }
}, "Happening ", /*#__PURE__*/React.createElement("span", {
  style: {
    backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  }
}, "now.")), /*#__PURE__*/React.createElement("p", {
  style: {
    fontSize: 11,
    color: 'rgba(238,240,255,0.6)',
    margin: '4px 0 0'
  }
}, "From your neighbors, not an algorithm.")), /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1,
    overflow: 'hidden',
    padding: '0 14px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  }
}, EVENTS.slice(0, 2).map(e => /*#__PURE__*/React.createElement("div", {
  key: e.id,
  style: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 10,
    display: 'flex',
    gap: 10,
    alignItems: 'center'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    width: 54,
    height: 54,
    borderRadius: 11,
    background: e.grad,
    flexShrink: 0,
    position: 'relative'
  }
}, e.live && /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    top: 4,
    right: 4
  }
}, /*#__PURE__*/React.createElement(LiveDot, {
  size: 5
}))), /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1,
    minWidth: 0
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'Montserrat',
    fontWeight: 900,
    color: '#fff',
    fontSize: 12,
    marginBottom: 3,
    letterSpacing: '-0.01em',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  }
}, e.name), /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 9.5,
    color: 'rgba(238,240,255,0.6)'
  }
}, e.time, " \xB7 ", e.dist))))), /*#__PURE__*/React.createElement("div", {
  style: {
    padding: '10px 14px 14px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(15,26,48,0.85)',
    backdropFilter: 'blur(8px)',
    flexShrink: 0
  }
}, /*#__PURE__*/React.createElement(PrimaryCTA, {
  size: "md"
}, "See all 47 events")));

// ------ V5 : TWO DOORS (explicit audience split) ----------------------
// Upper half - consumer (browse). Lower half - organizer (list).
// Both surfaced, no hierarchy ambiguity.
const V5 = () => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PStatus, null), /*#__PURE__*/React.createElement("div", {
  style: {
    padding: '6px 18px 12px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0
  }
}, /*#__PURE__*/React.createElement(SparkLogoMini, {
  size: 18
})), /*#__PURE__*/React.createElement("div", {
  style: {
    margin: '0 14px 8px',
    borderRadius: 18,
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 130,
    height: 130,
    borderRadius: '50%',
    background: 'rgba(255,99,72,0.20)',
    filter: 'blur(40px)'
  }
}), /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    background: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)'
  }
}), /*#__PURE__*/React.createElement(Eye, {
  color: "#ffca3a"
}, "For neighbors"), /*#__PURE__*/React.createElement("h2", {
  style: {
    fontFamily: 'Montserrat',
    fontSize: 22,
    fontWeight: 900,
    lineHeight: 1.0,
    letterSpacing: '-0.01em',
    margin: '8px 0 6px',
    color: '#fff'
  }
}, "Find what's ", /*#__PURE__*/React.createElement("br", null), "near you."), /*#__PURE__*/React.createElement("p", {
  style: {
    fontSize: 10.5,
    color: 'rgba(238,240,255,0.60)',
    lineHeight: 1.5,
    margin: '0 0 14px'
  }
}, "47 local events this week. No login, no algorithm."), /*#__PURE__*/React.createElement("div", {
  style: {
    marginTop: 'auto'
  }
}, /*#__PURE__*/React.createElement(PrimaryCTA, {
  size: "md"
}, "Browse near me ", /*#__PURE__*/React.createElement(I, {
  name: "arrow",
  size: 12,
  color: "#14213D"
})))), /*#__PURE__*/React.createElement("div", {
  style: {
    margin: '0 14px 14px',
    borderRadius: 18,
    padding: 14,
    background: '#0f1a30',
    border: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    width: 30,
    height: 30,
    borderRadius: 8,
    background: 'rgba(252,163,17,0.10)',
    border: '1px solid rgba(252,163,17,0.30)',
    color: '#FCA311',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
}, /*#__PURE__*/React.createElement(I, {
  name: "megaphone",
  size: 14
})), /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1,
    minWidth: 0
  }
}, /*#__PURE__*/React.createElement(Eye, null, "For organizers"), /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'Montserrat',
    color: '#fff',
    fontWeight: 900,
    fontSize: 13,
    marginTop: 2,
    letterSpacing: '-0.01em'
  }
}, "Reach your block."))), /*#__PURE__*/React.createElement(OutlineCTA, null, "List an event \u2014 free to start")));
Object.assign(window, {
  V1,
  V2,
  V3,
  V4,
  V5
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "mockups/variations.jsx", error: String((e && e.message) || e) }); }

// source/SparkedLogo.tsx
try { (() => {
const TwinFlamesIcon = ({
  size
}) => {
  const aspectRatio = 56 / 76;
  const width = Math.round(size * aspectRatio);
  return /*#__PURE__*/React.createElement("svg", {
    width: width,
    height: size,
    viewBox: "0 0 56 76",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "tf-base",
    x1: "0",
    y1: "1",
    x2: "0",
    y2: "0",
    gradientUnits: "objectBoundingBox"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#ff5f4e"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#ff8c38"
  })), /*#__PURE__*/React.createElement("linearGradient", {
    id: "tf-tip",
    x1: "0",
    y1: "1",
    x2: "0",
    y2: "0",
    gradientUnits: "objectBoundingBox"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#ff8c38"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#ffca3a"
  }))), /*#__PURE__*/React.createElement("path", {
    d: "M28 68\r C16 58 8 46 10 32\r C12 20 20 12 28 10\r C24 16 22 24 24 32\r C26 40 32 44 32 52\r C32 60 30 66 28 68Z",
    fill: "url(#tf-base)"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M28 8\r C38 16 46 26 44 38\r C42 50 34 58 28 60\r C32 54 34 46 32 38\r C30 30 24 26 24 18\r C24 12 26 9 28 8Z",
    fill: "url(#tf-tip)",
    opacity: 0.9
  }));
};
const Wordmark = ({
  mode,
  fontSize
}) => {
  const style = {
    fontFamily: "'Montserrat', sans-serif",
    fontSize,
    fontWeight: 900,
    letterSpacing: '-0.01em',
    lineHeight: 1,
    ...(mode === 'dark' ? {
      background: 'linear-gradient(135deg, #ff5f4e 0%, #ff8c38 50%, #ffca3a 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    } : {
      color: '#14213D'
    })
  };
  return /*#__PURE__*/React.createElement("span", {
    style: style
  }, "Sparked");
};
const SparkedLogo = ({
  mode = 'dark',
  variant = 'lockup',
  size = 32,
  className
}) => {
  const containerStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: Math.round(size * 0.3),
    lineHeight: 1
  };
  if (variant === 'icon') {
    return /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex'
      },
      className: className
    }, /*#__PURE__*/React.createElement(TwinFlamesIcon, {
      size: size,
      mode: mode
    }));
  }
  return /*#__PURE__*/React.createElement("span", {
    style: containerStyle,
    className: className
  }, /*#__PURE__*/React.createElement(TwinFlamesIcon, {
    size: size,
    mode: mode
  }), /*#__PURE__*/React.createElement(Wordmark, {
    mode: mode,
    fontSize: Math.round(size * 0.6)
  }));
};
Object.assign(__ds_scope, { SparkedLogo, __ds_default_source_SparkedLogo_1xaqnc0: SparkedLogo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "source/SparkedLogo.tsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile-app/AppScreens.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Sparked — additional app screens for the full clickable prototype.
// Auth, Search, Create Event, Settings, and an RSVP confirmation.
// Expects React + Components.jsx + Screens.jsx symbols in scope (via window).

// ---- Small form primitives -------------------------------------------------

const Field = ({
  label,
  hint,
  children
}) => /*#__PURE__*/React.createElement("label", {
  style: {
    display: 'block',
    marginBottom: 16
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8
  }
}, /*#__PURE__*/React.createElement(Eyebrow, null, label), hint && /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 10,
    color: 'var(--app-text-hint, rgba(238,240,255,0.40))',
    fontWeight: 700
  }
}, hint)), children);
const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'var(--app-icon-chip-bg, rgba(255,255,255,0.04))',
  border: '1px solid var(--app-card-border, rgba(255,255,255,0.12))',
  borderRadius: 14,
  padding: '14px 16px',
  color: 'var(--app-text, #eef0ff)',
  fontFamily: 'Inter',
  fontSize: 14,
  fontWeight: 600,
  outline: 'none'
};
const TextField = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  icon
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'relative'
  }
}, icon && /*#__PURE__*/React.createElement("span", {
  style: {
    position: 'absolute',
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)'
  }
}, /*#__PURE__*/React.createElement(Icon, {
  name: icon,
  size: 16,
  color: "var(--app-text-muted, rgba(238,240,255,0.45))"
})), /*#__PURE__*/React.createElement("input", {
  type: type,
  value: value,
  placeholder: placeholder,
  onChange: e => onChange && onChange(e.target.value),
  style: {
    ...inputStyle,
    paddingLeft: icon ? 42 : 16
  }
}));

// Sub-screen header with a back chevron + eyebrow crumb.
const SubHeader = ({
  crumb,
  onBack,
  right
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    padding: '4px 24px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12
  }
}, /*#__PURE__*/React.createElement("button", {
  onClick: onBack,
  "aria-label": "Back",
  style: {
    background: 'var(--app-icon-chip-bg, rgba(255,255,255,0.05))',
    border: '1px solid var(--app-card-border, rgba(255,255,255,0.10))',
    color: 'var(--app-text, #fff)',
    width: 36,
    height: 36,
    borderRadius: 10,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  }
}, /*#__PURE__*/React.createElement(Icon, {
  name: "chev-left",
  size: 16,
  color: "currentColor"
})), /*#__PURE__*/React.createElement(Eyebrow, null, crumb), /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1
  }
}), right);

// ===========================================================================
// AUTH — login / signup toggle. Google SSO + email. "Browse as guest" exit.
// ===========================================================================
const AuthScreen = ({
  mode = 'signup',
  onAuth,
  onBrowse,
  onBack
}) => {
  const [tab, setTab] = React.useState(mode); // 'signup' | 'login'
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');
  const isSignup = tab === 'signup';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      overflow: 'auto',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: -60,
      right: -80,
      width: 260,
      height: 260,
      borderRadius: '50%',
      background: 'rgba(255,99,72,0.22)',
      filter: 'blur(85px)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px 24px 40px',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    "aria-label": "Back",
    style: {
      background: 'var(--app-icon-chip-bg)',
      border: '1px solid var(--app-card-border)',
      color: 'var(--app-text)',
      width: 36,
      height: 36,
      borderRadius: 10,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chev-left",
    size: 16,
    color: "#fff"
  })), /*#__PURE__*/React.createElement(SparkLogo, {
    size: 26
  }), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'Montserrat',
      fontSize: 30,
      fontWeight: 900,
      letterSpacing: '-0.01em',
      lineHeight: 1.05,
      margin: '22px 0 6px',
      color: 'var(--app-text)'
    }
  }, isSignup ? 'Join your city.' : 'Welcome back.'), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: 'var(--app-text-muted)',
      margin: '0 0 24px',
      lineHeight: 1.5
    }
  }, isSignup ? 'Discover and publish local events — no algorithm, just your neighborhood.' : 'Pick up where you left off.'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      padding: 6,
      borderRadius: 14,
      background: 'var(--app-icon-chip-bg)',
      border: '1px solid var(--app-card-border)',
      marginBottom: 22
    }
  }, [['signup', 'Sign Up'], ['login', 'Log In']].map(([id, label]) => /*#__PURE__*/React.createElement("button", {
    key: id,
    onClick: () => setTab(id),
    style: {
      flex: 1,
      padding: '10px 0',
      borderRadius: 10,
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'Inter',
      fontWeight: 900,
      fontSize: 12,
      letterSpacing: '0.10em',
      textTransform: 'uppercase',
      background: tab === id ? 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' : 'transparent',
      color: tab === id ? '#14213D' : 'var(--app-text-muted)',
      transition: 'all .2s ease'
    }
  }, label))), /*#__PURE__*/React.createElement("button", {
    onClick: () => onAuth(tab),
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      width: '100%',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      background: '#fff',
      color: '#14213D',
      fontWeight: 800,
      fontSize: 14,
      padding: '13px 18px',
      borderRadius: 14,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "assets/google-g.svg",
    width: "18",
    height: "18",
    alt: ""
  }), "Continue with Google"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      margin: '0 0 16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 1,
      background: 'rgba(255,255,255,0.08)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 900,
      letterSpacing: '0.18em',
      color: 'var(--app-text-hint)'
    }
  }, "OR"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 1,
      background: 'rgba(255,255,255,0.08)'
    }
  })), isSignup && /*#__PURE__*/React.createElement(Field, {
    label: "Full name"
  }, /*#__PURE__*/React.createElement(TextField, {
    value: '',
    onChange: () => {},
    placeholder: "Jordan Chen",
    icon: "user"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Email"
  }, /*#__PURE__*/React.createElement(TextField, {
    value: email,
    onChange: setEmail,
    placeholder: "you@email.com",
    type: "email",
    icon: "mail"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Password"
  }, /*#__PURE__*/React.createElement(TextField, {
    value: pw,
    onChange: setPw,
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    type: "password",
    icon: "lock"
  })), /*#__PURE__*/React.createElement(SparkButton, {
    size: "lg",
    onClick: () => onAuth(tab)
  }, isSignup ? 'Create Account' : 'Log In'), /*#__PURE__*/React.createElement("button", {
    onClick: onBrowse,
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      width: '100%',
      textAlign: 'center',
      marginTop: 18,
      fontSize: 13,
      fontWeight: 700,
      color: 'var(--app-text-muted)'
    }
  }, "Skip \u2014 browse as guest")));
};

// ===========================================================================
// CREATE EVENT — single scrollable form → publish → success state.
// ===========================================================================
const CREATE_CATEGORIES = ['Curbside', 'Markets', 'Music', 'Art', 'Food', 'Community', 'Pop-Ups', 'Outdoors', 'Family', 'Wellness', 'Nightlife', 'Sports', 'Tech'];
// Paid-event wizard picker excludes Curbside — that category is reserved for
// free Curbside posts, which are auto-tagged and never run through this picker.
const EVENT_CATEGORIES = CREATE_CATEGORIES.filter(c => c !== 'Curbside');

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
const DURATION_BANDS = [{
  id: 'single',
  label: 'Single-day'
}, {
  id: 'multi',
  label: '2–4 days'
}, {
  id: 'extended',
  label: '5+ days'
}];
const PRICING_TIERS = [{
  id: 'popup',
  name: 'Curbside',
  free: true,
  bands: ['single'],
  inWizard: false,
  desc: 'Yard sales, free pickup items, block celebrations. One photo, a description, and an address.',
  photos: 1,
  features: ['1 photo', 'Description & address', 'One category'],
  limit: '3 free posts every 100 days'
}, {
  id: 'standard',
  name: 'Standard',
  bands: ['single', 'multi', 'extended'],
  inWizard: true,
  prices: {
    single: 5,
    multi: 12,
    extended: 20
  },
  desc: 'A clean, linkable event page on the local feed — with your social links. Everything you need to get the word out.',
  photos: 3,
  features: ['Up to 3 photos', 'Clean, linkable event page', 'Social links', 'Shows on the distance feed', 'Any event duration']
}, {
  id: 'plus',
  name: 'Plus',
  bands: ['single', 'multi', 'extended'],
  inWizard: true,
  highlight: true,
  prices: {
    single: 15,
    multi: 29,
    extended: 49
  },
  desc: 'Unlocks a 10-photo gallery, paid entry, and a site map with vendor pins — for events that need the extra reach.',
  photos: 10,
  inheritsFrom: 'Standard',
  features: ['10-photo gallery', 'Paid entry', 'Interactive site map with vendor pins']
}];

// Enterprise / early-access tier — shown on the Pricing screen unchanged. Not
// band-priced and not part of the transactional canonical flow.
const ENTERPRISE_TIER = {
  id: 'backstage',
  name: 'Backstage',
  price: 'Coming soon',
  tag: 'Early access',
  tagColor: 'var(--app-text-faint)',
  desc: 'Built for venues, festivals, and recurring event operators.',
  features: ['Everything in Plus', 'Custom branding on event pages', 'Bulk event creation & management', 'Dedicated organizer support', 'Venue profile & calendar page'],
  border: 'rgba(255,255,255,0.12)'
};
const _tierById = id => PRICING_TIERS.find(t => t.id === id);
const _eventDays = (start, end) => {
  if (!start) return 1;
  const a = new Date(start + 'T00:00:00');
  const b = new Date((end || start) + 'T00:00:00');
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
};
const _durationBand = days => days <= 1 ? 'single' : days <= 4 ? 'multi' : 'extended';
const _bandLabel = days => days <= 1 ? 'Single-day event' : `${days}-day event`;
const _bandName = days => ({
  single: 'Single day',
  multi: 'Multi-day',
  extended: 'Extended'
})[_durationBand(days)];
const _eventPrice = (tier, days) => _tierById(tier).prices[_durationBand(days)];

// Custom-category screening. Reject hate/harmful submissions outright; the
// list is deliberately blunt — substring match, case-insensitive.
const CATEGORY_BLOCKLIST = ['hate', 'nazi', 'racist', 'slur', 'kill', 'terror', 'bomb', 'porn', 'drugs', 'weapon', 'gun', 'assault'];
const _isBlocked = s => {
  const v = s.toLowerCase();
  return CATEGORY_BLOCKLIST.some(b => v.includes(b));
};
const CREATE_STEPS = ['Basics', 'When & Where', 'Details', 'Review'];

// Parse the free-text time field into an hour/min so the preview countdown is
// real. Falls back to 7:00pm when nothing parses.
function _parsePreviewISO(ymd, timeStr) {
  if (!ymd) return null;
  const [y, m, d] = ymd.split('-').map(Number);
  let hr = 19,
    min = 0;
  const tm = (timeStr || '').match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (tm) {
    hr = parseInt(tm[1], 10);
    min = tm[2] ? parseInt(tm[2], 10) : 0;
    const ap = (tm[3] || '').toLowerCase();
    if (ap === 'pm' && hr < 12) hr += 12;
    if (ap === 'am' && hr === 12) hr = 0;
  }
  return new Date(y, m - 1, d, hr, min, 0, 0).toISOString();
}

// Collapsible live preview pinned above the form. Expanded → the full-glory
// EventStub (photo variant). Collapsed → a one-line ticket bar that still
// updates live. Reuses the canonical EventStub — no new card.
const _PreviewRail = ({
  event,
  open,
  onToggle
}) => {
  const cd = window.eventCountdown ? window.eventCountdown(event.startISO) : {
    value: '—'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 18,
      border: '1px solid var(--app-card-border)',
      background: 'var(--app-card-bg)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onToggle,
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 12px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 4,
      height: 26,
      borderRadius: 9999,
      background: 'linear-gradient(180deg,#ff6348,#FCA311,#F7B731)',
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 9,
      fontWeight: 900,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: 'var(--app-text-faint)'
    }
  }, "Live preview"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 13,
      color: 'var(--app-text)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, event.title)), !open && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 15,
      color: '#FCA311',
      flexShrink: 0
    }
  }, cd.value), /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      transform: open ? 'rotate(180deg)' : 'none',
      transition: 'transform .2s ease',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chev-right",
    size: 15,
    color: "var(--app-text-faint)"
  }))), open && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '2px 12px 14px'
    }
  }, /*#__PURE__*/React.createElement(EventStub, {
    variant: "photo",
    event: event,
    hidePrice: true,
    onTap: () => {}
  })));
};

// Minimal rich-text editor — Bold, Italic, bullet list only. Uncontrolled:
// we seed innerHTML once on mount and never re-feed it, so the caret never
// jumps while typing. Emits HTML on input.
const _RichText = ({
  html,
  onChange,
  placeholder
}) => {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (html || '')) ref.current.innerHTML = html || '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const exec = cmd => {
    document.execCommand(cmd, false, null);
    if (ref.current) onChange(ref.current.innerHTML);
    ref.current && ref.current.focus();
  };
  const Tool = ({
    cmd,
    label,
    style
  }) => /*#__PURE__*/React.createElement("button", {
    type: "button",
    onMouseDown: e => {
      e.preventDefault();
      exec(cmd);
    },
    style: {
      all: 'unset',
      cursor: 'pointer',
      minWidth: 30,
      height: 30,
      padding: '0 8px',
      borderRadius: 8,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--app-icon-chip-bg)',
      border: '1px solid var(--app-card-border)',
      color: 'var(--app-text)',
      fontSize: 13,
      ...style
    }
  }, label);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(Tool, {
    cmd: "bold",
    label: "B",
    style: {
      fontWeight: 900
    }
  }), /*#__PURE__*/React.createElement(Tool, {
    cmd: "italic",
    label: "I",
    style: {
      fontStyle: 'italic',
      fontFamily: 'Georgia, serif'
    }
  }), /*#__PURE__*/React.createElement(Tool, {
    cmd: "insertUnorderedList",
    label: /*#__PURE__*/React.createElement(Icon, {
      name: "list",
      size: 14,
      color: "var(--app-text)"
    })
  })), /*#__PURE__*/React.createElement("div", {
    ref: ref,
    contentEditable: true,
    suppressContentEditableWarning: true,
    onInput: e => onChange(e.currentTarget.innerHTML),
    "data-ph": placeholder,
    style: {
      ...inputStyle,
      minHeight: 96,
      lineHeight: 1.5,
      textAlign: 'left',
      cursor: 'text',
      overflowWrap: 'anywhere'
    }
  }, "fsdfasdfasd\xA0 d awdfwe dwlwd wd w edkjn awdkmnf wkjwnd test thing"));
};

// Dedicated create-flow date range — reliably editable, no discovery/zip UI.
// Tapping anywhere on a field opens the native picker (showPicker fallback to
// focus). Kept separate from the shared discovery DateRangeBar on purpose.
const _DateField = ({
  value,
  onChange,
  label,
  min
}) => {
  const ref = React.useRef(null);
  const open = () => {
    const el = ref.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch (e) {
      el.focus();
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    onClick: open,
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      background: 'var(--app-icon-chip-bg)',
      border: '1px solid var(--app-card-border)',
      borderRadius: 14,
      padding: '12px 14px',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "cal",
    size: 15,
    color: "#F7B731"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      fontWeight: 900,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--app-text-faint)'
    }
  }, label), /*#__PURE__*/React.createElement("input", {
    ref: ref,
    type: "date",
    value: value,
    min: min,
    onChange: e => onChange(e.target.value),
    style: {
      background: 'transparent',
      border: 'none',
      outline: 'none',
      padding: 0,
      marginTop: 2,
      color: 'var(--app-text)',
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 700,
      colorScheme: 'dark',
      width: '100%',
      minWidth: 0
    }
  })));
};
const _DateRangeField = ({
  start,
  end,
  onStart,
  onEnd
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  }
}, /*#__PURE__*/React.createElement(_DateField, {
  value: start,
  onChange: onStart,
  label: "Starts"
}), /*#__PURE__*/React.createElement(Icon, {
  name: "arrow",
  size: 14,
  color: "var(--app-text-faint)"
}), /*#__PURE__*/React.createElement(_DateField, {
  value: end,
  onChange: onEnd,
  label: "Ends",
  min: start
}));
const CreateEventScreen = ({
  onBack,
  onCheckout,
  desktop
}) => {
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
  const [socials, setSocials] = React.useState({
    instagram: '',
    twitter: '',
    facebook: '',
    website: ''
  });
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
  React.useEffect(() => {
    setPreviewOpen(step === 0);
  }, [step]);
  // Plus-only fields shouldn't silently carry into a Standard checkout.
  React.useEffect(() => {
    if (!isPlus) {
      setEntryFeeOn(false);
      setGallery(g => g.slice(0, 3));
    }
  }, [isPlus]);
  const toggleCat = c => setCats(a => {
    if (a.includes(c)) return a.filter(x => x !== c);
    const next = [...a, c];
    if (next.length >= 4 && !catWarnedRef.current) {
      catWarnedRef.current = true;
      setCatWarn(true);
    }
    return next;
  });
  const addCustom = () => {
    const raw = customCat.trim();
    if (!raw) return;
    if (_isBlocked(raw)) {
      setCustError('That category isn’t allowed.');
      return;
    }
    const canon = EVENT_CATEGORIES.find(c => c.toLowerCase() === raw.toLowerCase()) || raw;
    if (cats.some(c => c.toLowerCase() === canon.toLowerCase())) {
      setCustError('Already added.');
      setCustomCat('');
      return;
    }
    setCats(a => {
      const next = [...a, canon];
      if (next.length >= 4 && !catWarnedRef.current) {
        catWarnedRef.current = true;
        setCatWarn(true);
      }
      return next;
    });
    setCustomCat('');
    setCustError('');
  };
  const suggestions = customCat.trim() ? EVENT_CATEGORIES.filter(c => c.toLowerCase().includes(customCat.toLowerCase()) && !cats.some(x => x.toLowerCase() === c.toLowerCase())).slice(0, 4) : [];
  const previewEvent = {
    id: 'preview',
    title: title.trim() || 'Your event title',
    tags: cats.length ? cats : ['Event'],
    date: start ? new Date(start + 'T00:00:00').toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }) : 'Add a date',
    time: startTime ? _fmtTime(startTime) + (endTime ? ' – ' + _fmtTime(endTime) : '') : 'Add a time',
    location: venueName.trim() || address.trim() || 'Add a venue',
    price: isPlus && entryFeeOn ? Number(entryFee) || 0 : 0,
    startISO: _parsePreviewISO(start, startTime)
  };
  const canPublish = !!(title.trim() && start && (venueName.trim() || address.trim()));
  const missing = [!title.trim() && 'title', !start && 'date', !(venueName.trim() || address.trim()) && 'venue'].filter(Boolean);
  const goNext = () => setStep(s => Math.min(CREATE_STEPS.length - 1, s + 1));
  const goBack = () => step === 0 ? onBack() : setStep(s => s - 1);
  const publish = () => canPublish && onCheckout({
    title: title.trim() || 'Your Event',
    tier,
    days,
    price,
    bandName: _bandName(days),
    bandLabel: _bandLabel(days)
  });
  const sectionLabelStyle = {
    fontFamily: 'Montserrat',
    fontWeight: 900,
    fontSize: 20,
    letterSpacing: '-0.01em',
    color: 'var(--app-text)',
    margin: '0 0 16px'
  };
  const plusProps = {
    isPlus,
    entryFeeOn,
    setEntryFeeOn,
    entryFee,
    setEntryFee,
    amenities,
    setAmenities,
    vendors,
    setVendors,
    vName,
    setVName,
    vType,
    setVType,
    socials,
    setSocials,
    mapOpen,
    setMapOpen,
    amenQuery,
    setAmenQuery,
    vLogo,
    setVLogo
  };

  // ---- DESKTOP (≥1024px) — two-column shell: form left, sticky live
  // preview right. Site map & vendors expands full-width below when open.
  // Same state/components/validation as mobile; layout only.
  if (desktop) {
    const stepTitles = ['Basics', 'When & Where', 'Details', 'Review'];
    return /*#__PURE__*/React.createElement("div", {
      style: {
        minHeight: '100%',
        boxSizing: 'border-box',
        background: 'var(--app-bg)',
        color: 'var(--app-text)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: 1180,
        margin: '0 auto',
        padding: '40px 40px 80px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: goBack,
      "aria-label": "Back",
      style: {
        all: 'unset',
        cursor: 'pointer',
        width: 38,
        height: 38,
        borderRadius: 12,
        background: 'var(--app-icon-chip-bg)',
        border: '1px solid var(--app-card-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'flex',
        transform: 'rotate(180deg)'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "chev-right",
      size: 16,
      color: "var(--app-text)"
    }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 900,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--app-text-faint)'
      }
    }, "Create \xB7 Step ", step + 1, " of ", CREATE_STEPS.length), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'Montserrat',
        fontWeight: 900,
        fontSize: 22,
        color: 'var(--app-text)',
        marginTop: 2
      }
    }, stepTitles[step]))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 6,
        marginBottom: 32
      }
    }, CREATE_STEPS.map((s, i) => /*#__PURE__*/React.createElement("div", {
      key: s,
      style: {
        flex: 1,
        height: 4,
        borderRadius: 9999,
        background: i <= step ? 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' : 'var(--app-divider)',
        transition: 'background .2s ease'
      }
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1.6fr 1fr',
        gap: 44,
        alignItems: 'start'
      }
    }, /*#__PURE__*/React.createElement("div", null, step === 0 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
      style: sectionLabelStyle
    }, "Basics"), /*#__PURE__*/React.createElement(Field, {
      label: "Event title"
    }, /*#__PURE__*/React.createElement(TextField, {
      value: title,
      onChange: setTitle,
      placeholder: "e.g. Sunset Songwriters Round",
      icon: "text"
    })), /*#__PURE__*/React.createElement(Field, {
      label: "Categories",
      hint: `${cats.length} selected`
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8
      }
    }, cats.filter(c => !EVENT_CATEGORIES.includes(c)).map(c => /*#__PURE__*/React.createElement(_Pill, {
      key: c,
      active: true,
      label: c,
      onClick: () => toggleCat(c),
      removable: true
    })), EVENT_CATEGORIES.map(c => /*#__PURE__*/React.createElement(_Pill, {
      key: c,
      active: cats.includes(c),
      label: c,
      onClick: () => toggleCat(c)
    }))), catWarn && /*#__PURE__*/React.createElement("div", {
      onAnimationEnd: () => setCatWarn(false),
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 6,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '11px 13px',
        borderRadius: 12,
        background: 'rgba(28,24,18,0.97)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(252,163,17,0.45)',
        boxShadow: '0 14px 32px -10px rgba(0,0,0,0.65)',
        fontSize: 11.5,
        color: '#FCA311',
        fontWeight: 700,
        lineHeight: 1.4,
        animation: 'ceFadeWarn 4.2s ease forwards'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "sparkles",
      size: 13,
      color: "#FCA311"
    }), /*#__PURE__*/React.createElement("span", null, "Most events use 2\u20133 categories. More may crowd your card.")))), /*#__PURE__*/React.createElement(Field, {
      label: "Add your own",
      hint: "Optional"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative'
      },
      onKeyDown: e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addCustom();
        }
      }
    }, /*#__PURE__*/React.createElement(TextField, {
      value: customCat,
      onChange: v => {
        setCustomCat(v);
        setCustError('');
      },
      placeholder: "Type a category, press Enter",
      icon: "plus"
    })), suggestions.length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 8
      }
    }, suggestions.map(s => /*#__PURE__*/React.createElement(_Pill, {
      key: s,
      label: s,
      onClick: () => {
        toggleCat(s);
        setCustomCat('');
      },
      subtle: true
    }))), customCat.trim() && /*#__PURE__*/React.createElement("button", {
      onClick: addCustom,
      style: {
        all: 'unset',
        cursor: 'pointer',
        marginTop: 8,
        fontSize: 12,
        fontWeight: 800,
        color: '#FCA311'
      }
    }, "+ Add \u201C", customCat.trim(), "\u201D"), custError && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 8,
        fontSize: 11.5,
        fontWeight: 700,
        color: '#ff8a72'
      }
    }, custError)), /*#__PURE__*/React.createElement(Field, {
      label: "Cover image",
      hint: "Optional"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setCover(c => !c),
      style: {
        all: 'unset',
        boxSizing: 'border-box',
        cursor: 'pointer',
        width: '100%',
        height: 130,
        borderRadius: 18,
        border: cover ? '1px solid rgba(252,163,17,0.45)' : '1px dashed rgba(255,255,255,0.18)',
        background: cover ? 'linear-gradient(135deg,#5b3220,#a8551d 60%,#e09c3a)' : 'linear-gradient(135deg, rgba(255,95,78,0.10), rgba(255,202,58,0.06))',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        position: 'relative',
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "image",
      size: 22,
      color: cover ? '#14213D' : '#FCA311'
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 800,
        color: cover ? '#14213D' : 'var(--app-text-muted)'
      }
    }, cover ? 'Cover added · tap to remove' : 'Add a cover image'), !cover && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: 'var(--app-text-faint)'
      }
    }, "Recommended 1200\xD7600")))), step === 1 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
      style: sectionLabelStyle
    }, "When & Where"), /*#__PURE__*/React.createElement(Field, {
      label: "Date range",
      hint: _bandLabel(days)
    }, /*#__PURE__*/React.createElement(_DateRangeField, {
      start: start,
      end: end,
      onStart: v => {
        setStart(v);
        if (v > end) setEnd(v);
      },
      onEnd: setEnd
    })), /*#__PURE__*/React.createElement(Field, {
      label: "Time",
      hint: "Start \u2192 end"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }
    }, [['Start', startTime, setStartTime], ['End', endTime, setEndTime]].map(([lbl, val, set]) => /*#__PURE__*/React.createElement("div", {
      key: lbl,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 38,
        flexShrink: 0,
        fontSize: 10,
        fontWeight: 900,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--app-text-faint)'
      }
    }, lbl), /*#__PURE__*/React.createElement(_TimePicker, {
      value: val,
      onChange: set
    }))))), /*#__PURE__*/React.createElement(Field, {
      label: "Venue name"
    }, /*#__PURE__*/React.createElement(TextField, {
      value: venueName,
      onChange: setVenueName,
      placeholder: "e.g. The Lola Loft",
      icon: "store"
    })), /*#__PURE__*/React.createElement(Field, {
      label: "Street address"
    }, /*#__PURE__*/React.createElement(TextField, {
      value: address,
      onChange: setAddress,
      placeholder: "123 Roosevelt St, Phoenix",
      icon: "pin"
    }))), step === 2 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
      style: sectionLabelStyle
    }, "Details"), /*#__PURE__*/React.createElement(Field, {
      label: "Tier",
      hint: "Per-event \xB7 pay once"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }
    }, PRICING_TIERS.filter(t => t.inWizard).map(t => {
      const sel = tier === t.id;
      const tp = _eventPrice(t.id, days);
      return /*#__PURE__*/React.createElement("button", {
        key: t.id,
        onClick: () => setTier(t.id),
        style: {
          all: 'unset',
          boxSizing: 'border-box',
          cursor: 'pointer',
          width: '100%',
          padding: 16,
          borderRadius: 16,
          border: `1.5px solid ${sel ? t.id === 'plus' ? 'rgba(255,99,72,0.45)' : 'rgba(252,163,17,0.40)' : 'rgba(255,255,255,0.10)'}`,
          background: sel ? t.id === 'plus' ? 'rgba(255,99,72,0.08)' : 'rgba(252,163,17,0.07)' : 'rgba(255,255,255,0.03)'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontFamily: 'Montserrat',
          fontWeight: 900,
          fontSize: 16,
          color: sel ? '#FCA311' : '#fff'
        }
      }, t.name), t.id === 'plus' && /*#__PURE__*/React.createElement(Icon, {
        name: "sparkles",
        size: 13,
        color: "#FCA311"
      }), /*#__PURE__*/React.createElement("span", {
        style: {
          flex: 1
        }
      }), /*#__PURE__*/React.createElement("span", {
        style: {
          fontFamily: 'Montserrat',
          fontWeight: 900,
          fontSize: 18,
          color: 'var(--app-text)'
        }
      }, "$", tp), /*#__PURE__*/React.createElement("span", {
        style: {
          width: 20,
          height: 20,
          borderRadius: 9999,
          flexShrink: 0,
          border: `2px solid ${sel ? '#FCA311' : 'rgba(255,255,255,0.25)'}`,
          background: sel ? '#FCA311' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }
      }, sel && /*#__PURE__*/React.createElement(Icon, {
        name: "check",
        size: 11,
        color: "#14213D"
      }))), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12,
          color: 'var(--app-text-muted)',
          marginTop: 6,
          lineHeight: 1.45
        }
      }, t.desc), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 10.5,
          fontWeight: 800,
          letterSpacing: '0.04em',
          color: 'var(--app-text-faint)',
          marginTop: 8
        }
      }, _bandName(days), " \xB7 ", _bandLabel(days), " \xB7 $", tp, " total"));
    }))), /*#__PURE__*/React.createElement(Field, {
      label: "Photo gallery",
      hint: `${gallery.length} / ${maxPhotos}`
    }, /*#__PURE__*/React.createElement(_GalleryGrid, {
      gallery: gallery,
      max: maxPhotos,
      onChange: setGallery
    }), !isPlus && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--app-text-faint)',
        marginTop: 8
      }
    }, "Standard fits ", maxPhotos, " photos. Plus unlocks up to ", _tierById('plus').photos, ".")), /*#__PURE__*/React.createElement(Field, {
      label: "Description"
    }, /*#__PURE__*/React.createElement(_RichText, {
      html: desc,
      onChange: setDesc,
      placeholder: "What should people know? Vendors, lineup, parking\u2026"
    })), /*#__PURE__*/React.createElement(_PlusDetails, _extends({}, plusProps, {
      section: "main"
    }))), step === 3 && /*#__PURE__*/React.createElement(_ReviewStep, {
      previewEvent,
      title,
      start,
      end,
      days,
      startTime,
      endTime,
      venueName,
      address,
      desc,
      cats,
      tier,
      price,
      isPlus,
      entryFeeOn,
      entryFee,
      amenities,
      vendors,
      socials,
      canPublish,
      missing
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'sticky',
        top: 24
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        fontWeight: 900,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: 'var(--app-text-faint)',
        marginBottom: 10
      }
    }, "Live preview"), /*#__PURE__*/React.createElement(EventStub, {
      variant: "photo",
      event: previewEvent,
      priceInBody: true,
      onTap: () => {}
    }))), step === 2 && isPlus && mapOpen && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 32
      }
    }, /*#__PURE__*/React.createElement(_PlusDetails, _extends({}, plusProps, {
      section: "mapBody"
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 12,
        marginTop: 40,
        maxWidth: 480
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: goBack,
      style: {
        all: 'unset',
        boxSizing: 'border-box',
        cursor: 'pointer',
        padding: '16px 26px',
        borderRadius: 16,
        background: 'var(--app-icon-chip-bg)',
        border: '1px solid var(--app-card-border)',
        color: 'var(--app-text)',
        fontFamily: 'Montserrat',
        fontWeight: 800,
        fontSize: 14,
        textAlign: 'center'
      }
    }, step === 0 ? 'Cancel' : 'Back'), step < CREATE_STEPS.length - 1 ? /*#__PURE__*/React.createElement("button", {
      onClick: goNext,
      style: {
        all: 'unset',
        boxSizing: 'border-box',
        cursor: 'pointer',
        flex: 1,
        padding: '16px 26px',
        borderRadius: 16,
        backgroundImage: 'linear-gradient(135deg,#ff5f4e 0%,#ff8c38 50%,#ffca3a 100%)',
        color: '#14213D',
        fontFamily: 'Montserrat',
        fontWeight: 900,
        fontSize: 15,
        textAlign: 'center',
        boxShadow: '0 10px 26px -8px rgba(255,95,78,0.55)'
      }
    }, "Continue") : /*#__PURE__*/React.createElement("button", {
      onClick: publish,
      disabled: !canPublish,
      style: {
        all: 'unset',
        boxSizing: 'border-box',
        cursor: canPublish ? 'pointer' : 'not-allowed',
        flex: 1,
        padding: '16px 26px',
        borderRadius: 16,
        textAlign: 'center',
        fontFamily: 'Montserrat',
        fontWeight: 900,
        fontSize: 15,
        ...(canPublish ? {
          backgroundImage: 'linear-gradient(135deg,#ff5f4e 0%,#ff8c38 50%,#ffca3a 100%)',
          color: '#14213D',
          boxShadow: '0 10px 26px -8px rgba(255,95,78,0.55)'
        } : {
          background: 'var(--app-card-bg)',
          color: 'var(--app-text-hint)'
        })
      }
    }, "Continue to payment"))));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement(SubHeader, {
    crumb: `Create · Step ${step + 1} of ${CREATE_STEPS.length}`,
    onBack: goBack
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 24px 14px',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      marginBottom: 16
    }
  }, CREATE_STEPS.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: s,
    style: {
      flex: 1,
      height: 4,
      borderRadius: 9999,
      background: i <= step ? 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' : 'rgba(255,255,255,0.10)',
      transition: 'background .2s ease'
    }
  }))), step < 3 && /*#__PURE__*/React.createElement(_PreviewRail, {
    event: previewEvent,
    open: previewOpen,
    onToggle: () => setPreviewOpen(o => !o)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: '6px 24px 28px'
    }
  }, step === 0 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: sectionLabelStyle
  }, "Basics"), /*#__PURE__*/React.createElement(Field, {
    label: "Event title"
  }, /*#__PURE__*/React.createElement(TextField, {
    value: title,
    onChange: setTitle,
    placeholder: "e.g. Sunset Songwriters Round",
    icon: "text"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Categories",
    hint: `${cats.length} selected`
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8
    }
  }, cats.filter(c => !EVENT_CATEGORIES.includes(c)).map(c => /*#__PURE__*/React.createElement(_Pill, {
    key: c,
    active: true,
    label: c,
    onClick: () => toggleCat(c),
    removable: true
  })), EVENT_CATEGORIES.map(c => /*#__PURE__*/React.createElement(_Pill, {
    key: c,
    active: cats.includes(c),
    label: c,
    onClick: () => toggleCat(c)
  }))), catWarn && /*#__PURE__*/React.createElement("div", {
    onAnimationEnd: () => setCatWarn(false),
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 6,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '11px 13px',
      borderRadius: 12,
      background: 'rgba(28,24,18,0.97)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(252,163,17,0.45)',
      boxShadow: '0 14px 32px -10px rgba(0,0,0,0.65)',
      fontSize: 11.5,
      color: '#FCA311',
      fontWeight: 700,
      lineHeight: 1.4,
      animation: 'ceFadeWarn 4.2s ease forwards'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkles",
    size: 13,
    color: "#FCA311"
  }), /*#__PURE__*/React.createElement("span", null, "Most events use 2\u20133 categories. More may crowd your card.")))), /*#__PURE__*/React.createElement(Field, {
    label: "Add your own",
    hint: "Optional"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    },
    onKeyDown: e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addCustom();
      }
    }
  }, /*#__PURE__*/React.createElement(TextField, {
    value: customCat,
    onChange: v => {
      setCustomCat(v);
      setCustError('');
    },
    placeholder: "Type a category, press Enter",
    icon: "plus"
  })), suggestions.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 8
    }
  }, suggestions.map(s => /*#__PURE__*/React.createElement(_Pill, {
    key: s,
    label: s,
    onClick: () => {
      toggleCat(s);
      setCustomCat('');
    },
    subtle: true
  }))), customCat.trim() && /*#__PURE__*/React.createElement("button", {
    onClick: addCustom,
    style: {
      all: 'unset',
      cursor: 'pointer',
      marginTop: 8,
      fontSize: 12,
      fontWeight: 800,
      color: '#FCA311'
    }
  }, "+ Add \u201C", customCat.trim(), "\u201D"), custError && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      fontSize: 11.5,
      fontWeight: 700,
      color: '#ff8a72'
    }
  }, custError)), /*#__PURE__*/React.createElement(Field, {
    label: "Cover image",
    hint: "Optional"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setCover(c => !c),
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      width: '100%',
      height: 130,
      borderRadius: 18,
      border: cover ? '1px solid rgba(252,163,17,0.45)' : '1px dashed rgba(255,255,255,0.18)',
      background: cover ? 'linear-gradient(135deg,#5b3220,#a8551d 60%,#e09c3a)' : 'linear-gradient(135deg, rgba(255,95,78,0.10), rgba(255,202,58,0.06))',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      position: 'relative',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "image",
    size: 22,
    color: cover ? '#14213D' : '#FCA311'
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 800,
      color: cover ? '#14213D' : 'var(--app-text-muted)'
    }
  }, cover ? 'Cover added · tap to remove' : 'Add a cover image'), !cover && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: 'var(--app-text-faint)'
    }
  }, "Recommended 1200\xD7600")))), step === 1 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: sectionLabelStyle
  }, "When & Where"), /*#__PURE__*/React.createElement(Field, {
    label: "Date range",
    hint: _bandLabel(days)
  }, /*#__PURE__*/React.createElement(_DateRangeField, {
    start: start,
    end: end,
    onStart: v => {
      setStart(v);
      if (v > end) setEnd(v);
    },
    onEnd: setEnd
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Time",
    hint: "Start \u2192 end"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, [['Start', startTime, setStartTime], ['End', endTime, setEndTime]].map(([lbl, val, set]) => /*#__PURE__*/React.createElement("div", {
    key: lbl,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 38,
      flexShrink: 0,
      fontSize: 10,
      fontWeight: 900,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--app-text-faint)'
    }
  }, lbl), /*#__PURE__*/React.createElement(_TimePicker, {
    value: val,
    onChange: set
  }))))), /*#__PURE__*/React.createElement(Field, {
    label: "Venue name"
  }, /*#__PURE__*/React.createElement(TextField, {
    value: venueName,
    onChange: setVenueName,
    placeholder: "e.g. The Lola Loft",
    icon: "store"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Street address"
  }, /*#__PURE__*/React.createElement(TextField, {
    value: address,
    onChange: setAddress,
    placeholder: "123 Roosevelt St, Phoenix",
    icon: "pin"
  }))), step === 2 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: sectionLabelStyle
  }, "Details"), /*#__PURE__*/React.createElement(Field, {
    label: "Tier",
    hint: "Per-event \xB7 pay once"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, PRICING_TIERS.filter(t => t.inWizard).map(t => {
    const sel = tier === t.id;
    const tp = _eventPrice(t.id, days);
    return /*#__PURE__*/React.createElement("button", {
      key: t.id,
      onClick: () => setTier(t.id),
      style: {
        all: 'unset',
        boxSizing: 'border-box',
        cursor: 'pointer',
        width: '100%',
        padding: 16,
        borderRadius: 16,
        border: `1.5px solid ${sel ? t.id === 'plus' ? 'rgba(255,99,72,0.45)' : 'rgba(252,163,17,0.40)' : 'rgba(255,255,255,0.10)'}`,
        background: sel ? t.id === 'plus' ? 'rgba(255,99,72,0.08)' : 'rgba(252,163,17,0.07)' : 'rgba(255,255,255,0.03)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'Montserrat',
        fontWeight: 900,
        fontSize: 16,
        color: sel ? '#FCA311' : '#fff'
      }
    }, t.name), t.id === 'plus' && /*#__PURE__*/React.createElement(Icon, {
      name: "sparkles",
      size: 13,
      color: "#FCA311"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'Montserrat',
        fontWeight: 900,
        fontSize: 18,
        color: 'var(--app-text)'
      }
    }, "$", tp), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 20,
        height: 20,
        borderRadius: 9999,
        flexShrink: 0,
        border: `2px solid ${sel ? '#FCA311' : 'rgba(255,255,255,0.25)'}`,
        background: sel ? '#FCA311' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, sel && /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 11,
      color: "#14213D"
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--app-text-muted)',
        marginTop: 6,
        lineHeight: 1.45
      }
    }, t.desc), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        fontWeight: 800,
        letterSpacing: '0.04em',
        color: 'var(--app-text-faint)',
        marginTop: 8
      }
    }, _bandName(days), " \xB7 ", _bandLabel(days), " \xB7 $", tp, " total"));
  }))), /*#__PURE__*/React.createElement(Field, {
    label: "Photo gallery",
    hint: `${gallery.length} / ${maxPhotos}`
  }, /*#__PURE__*/React.createElement(_GalleryGrid, {
    gallery: gallery,
    max: maxPhotos,
    onChange: setGallery
  }), !isPlus && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--app-text-faint)',
      marginTop: 8
    }
  }, "Standard fits ", maxPhotos, " photos. Plus unlocks up to ", _tierById('plus').photos, ".")), /*#__PURE__*/React.createElement(Field, {
    label: "Description"
  }, /*#__PURE__*/React.createElement(_RichText, {
    html: desc,
    onChange: setDesc,
    placeholder: "What should people know? Vendors, lineup, parking\u2026"
  })), /*#__PURE__*/React.createElement(_PlusDetails, _extends({}, plusProps, {
    section: "all"
  }))), step === 3 && /*#__PURE__*/React.createElement(_ReviewStep, {
    previewEvent,
    title,
    start,
    end,
    days,
    startTime,
    endTime,
    venueName,
    address,
    desc,
    cats,
    tier,
    price,
    isPlus,
    entryFeeOn,
    entryFee,
    amenities,
    vendors,
    socials,
    canPublish,
    missing
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      padding: '14px 24px calc(14px + env(safe-area-inset-bottom))',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      background: 'rgba(20,33,61,0.55)',
      display: 'flex',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: goBack,
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      padding: '16px 22px',
      borderRadius: 16,
      background: 'var(--app-icon-chip-bg)',
      border: '1px solid var(--app-card-border)',
      color: 'var(--app-text)',
      fontFamily: 'Montserrat',
      fontWeight: 800,
      fontSize: 14,
      textAlign: 'center'
    }
  }, step === 0 ? 'Cancel' : 'Back'), step < CREATE_STEPS.length - 1 ? /*#__PURE__*/React.createElement("button", {
    onClick: goNext,
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      flex: 1,
      padding: '16px 22px',
      borderRadius: 16,
      backgroundImage: 'linear-gradient(135deg,#ff5f4e 0%,#ff8c38 50%,#ffca3a 100%)',
      color: '#14213D',
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 15,
      textAlign: 'center',
      boxShadow: '0 10px 26px -8px rgba(255,95,78,0.55)'
    }
  }, "Continue") : /*#__PURE__*/React.createElement("button", {
    onClick: publish,
    disabled: !canPublish,
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: canPublish ? 'pointer' : 'not-allowed',
      flex: 1,
      padding: '16px 22px',
      borderRadius: 16,
      textAlign: 'center',
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 15,
      ...(canPublish ? {
        backgroundImage: 'linear-gradient(135deg,#ff5f4e 0%,#ff8c38 50%,#ffca3a 100%)',
        color: '#14213D',
        boxShadow: '0 10px 26px -8px rgba(255,95,78,0.55)'
      } : {
        background: 'var(--app-card-bg)',
        color: 'var(--app-text-hint)'
      })
    }
  }, "Continue to payment")));
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
const _Pill = ({
  label,
  active,
  onClick,
  removable,
  subtle
}) => /*#__PURE__*/React.createElement("button", {
  onClick: onClick,
  style: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: 9999,
    cursor: 'pointer',
    boxSizing: 'border-box',
    border: 'none',
    fontFamily: 'Inter',
    fontWeight: 800,
    fontSize: 12,
    boxShadow: active ? 'none' : subtle ? 'inset 0 0 0 1px rgba(252,163,17,0.30)' : 'inset 0 0 0 1px rgba(255,255,255,0.12)',
    background: active ? 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' : subtle ? 'rgba(252,163,17,0.08)' : 'rgba(255,255,255,0.04)',
    color: active ? '#14213D' : subtle ? '#FCA311' : 'var(--app-text-muted)',
    transition: 'all .15s ease'
  }
}, label, removable && active && /*#__PURE__*/React.createElement(Icon, {
  name: "x",
  size: 11,
  color: "#14213D"
}));

// Modern time entry — segmented hour : minute with an AM/PM toggle. No native
// column-wheel; type or step, reads cleaner. Value is 24h "HH:MM".
const _TimePicker = ({
  value,
  onChange
}) => {
  const [h24, m] = (value || '19:00').split(':').map(Number);
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 || 12;
  const [editing, setEditing] = React.useState(null); // highlight only the segment being edited
  const emit = (nh12, nm, nap) => {
    let H = nh12 % 12;
    if (nap === 'PM') H += 12;
    onChange(`${String(H).padStart(2, '0')}:${String(nm).padStart(2, '0')}`);
  };
  const setHour = v => {
    let n = parseInt(v.replace(/\D/g, ''), 10);
    if (isNaN(n)) n = 12;
    n = Math.max(1, Math.min(12, n));
    emit(n, m, ampm);
  };
  const setMin = v => {
    let n = parseInt(v.replace(/\D/g, ''), 10);
    if (isNaN(n)) n = 0;
    n = Math.max(0, Math.min(59, n));
    emit(h12, n, ampm);
  };
  const segBox = on => ({
    borderRadius: 7,
    padding: '2px 2px',
    background: on ? 'linear-gradient(135deg,#ff8c38,#ffca3a)' : 'transparent',
    transition: 'background .15s ease'
  });
  const segInput = on => ({
    width: 30,
    textAlign: 'center',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: on ? '#14213D' : 'var(--app-text-muted)',
    fontFamily: 'Montserrat',
    fontWeight: 900,
    fontSize: 17,
    padding: 0,
    MozAppearance: 'textfield'
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      background: 'var(--app-icon-chip-bg)',
      border: '1px solid var(--app-card-border)',
      borderRadius: 14,
      padding: '9px 12px'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "clock",
    size: 15,
    color: "var(--app-text-faint)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      flex: 1,
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: segBox(editing === 'hour')
  }, /*#__PURE__*/React.createElement("input", {
    inputMode: "numeric",
    value: String(h12),
    onChange: e => setHour(e.target.value),
    onFocus: e => {
      setEditing('hour');
      e.target.select();
    },
    onBlur: () => setEditing(null),
    style: segInput(editing === 'hour')
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 17,
      color: 'var(--app-text-faint)'
    }
  }, ":"), /*#__PURE__*/React.createElement("span", {
    style: segBox(editing === 'min')
  }, /*#__PURE__*/React.createElement("input", {
    inputMode: "numeric",
    value: String(m).padStart(2, '0'),
    onChange: e => setMin(e.target.value),
    onFocus: e => {
      setEditing('min');
      e.target.select();
    },
    onBlur: () => setEditing(null),
    style: segInput(editing === 'min')
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 3,
      padding: 3,
      borderRadius: 9,
      background: 'rgba(0,0,0,0.22)'
    }
  }, ['AM', 'PM'].map(p => /*#__PURE__*/React.createElement("button", {
    key: p,
    onClick: () => emit(h12, m, p),
    style: {
      all: 'unset',
      cursor: 'pointer',
      padding: '4px 9px',
      borderRadius: 6,
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 11,
      color: ampm === p ? '#14213D' : 'var(--app-text-muted)',
      background: ampm === p ? 'linear-gradient(135deg,#ff8c38,#ffca3a)' : 'transparent'
    }
  }, p))));
};

// Photo gallery slots — striped placeholders the user "fills"; capped by tier.
const _GalleryGrid = ({
  gallery,
  max,
  onChange
}) => {
  const add = () => onChange([...gallery, gallery.length]);
  const remove = i => onChange(gallery.filter((_, idx) => idx !== i));
  const slot = {
    borderRadius: 12,
    height: 78,
    position: 'relative',
    overflow: 'hidden'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 8
    }
  }, gallery.map((g, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      ...slot,
      background: 'repeating-linear-gradient(135deg,#3a2d24,#3a2d24 6px,#46362b 6px,#46362b 12px)',
      border: '1px solid var(--app-card-border)'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => remove(i),
    "aria-label": "Remove",
    style: {
      all: 'unset',
      cursor: 'pointer',
      position: 'absolute',
      top: 5,
      right: 5,
      width: 20,
      height: 20,
      borderRadius: 9999,
      background: 'rgba(7,11,20,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 11,
    color: "#fff"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      bottom: 5,
      left: 6,
      fontSize: 8,
      fontFamily: 'monospace',
      color: 'rgba(238,240,255,0.5)'
    }
  }, "photo ", i + 1))), gallery.length < max && /*#__PURE__*/React.createElement("button", {
    onClick: add,
    style: {
      ...slot,
      all: 'unset',
      cursor: 'pointer',
      boxSizing: 'border-box',
      border: '1px dashed rgba(255,255,255,0.20)',
      background: 'var(--app-card-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 18,
    color: "#FCA311"
  })));
};
const SITE_AMENITIES = ['Restrooms', 'Parking', 'Food', 'Entry', 'Stage', 'First Aid', 'ATM', 'Accessible'];
const SOCIAL_FIELDS = [['instagram', 'Instagram', 'ig'], ['twitter', 'Twitter / X', 'x'], ['facebook', 'Facebook', 'fb'], ['website', 'Website', 'globe']];

// Plus-only details: paid entry, site map. Socials are available from Standard
// up — rendered unconditionally below the (possibly locked) Plus section.
const _PlusDetails = ({
  isPlus,
  entryFeeOn,
  setEntryFeeOn,
  entryFee,
  setEntryFee,
  amenities,
  setAmenities,
  vendors,
  setVendors,
  vName,
  setVName,
  vType,
  setVType,
  socials,
  setSocials,
  mapOpen,
  setMapOpen,
  amenQuery,
  setAmenQuery,
  vLogo,
  setVLogo,
  section = 'all'
}) => {
  // `section` lets the desktop layout split this component across two spots:
  // 'main' renders everything except the map's expanded body (which desktop
  // instead renders full-width below the two-column grid, via 'mapBody').
  // Mobile always uses the default 'all', identical to the original layout.
  const socialsField = /*#__PURE__*/React.createElement(Field, {
    label: "Socials",
    hint: "Shown on card when present"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, SOCIAL_FIELDS.map(([key, label]) => /*#__PURE__*/React.createElement("input", {
    key: key,
    value: socials[key],
    onChange: e => setSocials(s => ({
      ...s,
      [key]: e.target.value
    })),
    placeholder: label + ' link',
    style: {
      ...inputStyle,
      padding: '11px 14px'
    }
  }))));
  if (!isPlus) {
    if (section === 'mapBody') return null;
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 8,
        marginBottom: 20,
        padding: 16,
        borderRadius: 16,
        border: '1px dashed rgba(255,255,255,0.14)',
        background: 'var(--app-card-bg)',
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "lock",
      size: 16,
      color: "var(--app-text-faint)"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        color: 'var(--app-text-muted)',
        lineHeight: 1.4
      }
    }, "Paid entry & site map unlock with the ", /*#__PURE__*/React.createElement("b", {
      style: {
        color: '#FCA311'
      }
    }, "Plus"), " tier.")), socialsField);
  }
  const toggleAmenity = a => setAmenities(arr => arr.includes(a) ? arr.filter(x => x !== a) : [...arr, a]);
  const addAmenity = () => {
    const v = amenQuery.trim();
    if (!v) return;
    const canon = SITE_AMENITIES.find(a => a.toLowerCase() === v.toLowerCase()) || v;
    if (!amenities.some(a => a.toLowerCase() === canon.toLowerCase())) setAmenities(arr => [...arr, canon]);
    setAmenQuery('');
  };
  const amenSuggestions = amenQuery.trim() ? SITE_AMENITIES.filter(a => a.toLowerCase().includes(amenQuery.toLowerCase()) && !amenities.some(x => x.toLowerCase() === a.toLowerCase())).slice(0, 4) : [];
  const customAmenities = amenities.filter(a => !SITE_AMENITIES.includes(a));
  const addVendor = () => {
    if (!vName.trim()) return;
    setVendors(v => [...v, {
      name: vName.trim(),
      type: vType.trim() || 'Vendor',
      logo: vLogo
    }]);
    setVName('');
    setVType('');
    setVLogo(false);
  };
  const sub = {
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--app-text-faint)'
  };
  const stepBtn = {
    all: 'unset',
    cursor: 'pointer',
    width: 30,
    height: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FCA311',
    fontFamily: 'Montserrat',
    fontWeight: 900,
    fontSize: 18,
    background: 'var(--app-icon-chip-bg)'
  };
  const bumpFee = d => setEntryFee(v => String(Math.max(0, (parseInt(v, 10) || 0) + d)));
  const mapBodyInner = /*#__PURE__*/React.createElement("div", {
    style: {
      padding: section === 'mapBody' ? 0 : '0 16px 18px'
    }
  }, section !== 'mapBody' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 9,
      padding: '10px 12px',
      borderRadius: 12,
      background: 'rgba(252,163,17,0.08)',
      border: '1px solid rgba(252,163,17,0.22)',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "monitor",
    size: 14,
    color: "#FCA311"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: '#ffd9a0',
      lineHeight: 1.45
    }
  }, "These tools work best on desktop \u2014 finish on a computer anytime.")), /*#__PURE__*/React.createElement("button", {
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      width: '100%',
      height: 100,
      borderRadius: 14,
      border: '1px dashed rgba(255,255,255,0.18)',
      background: 'repeating-linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0.03) 8px,rgba(255,255,255,0.05) 8px,rgba(255,255,255,0.05) 16px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "map",
    size: 20,
    color: "#FCA311"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 800,
      color: 'rgba(238,240,255,0.6)'
    }
  }, "Upload site map image")), /*#__PURE__*/React.createElement("div", {
    style: {
      ...sub,
      margin: '16px 0 8px'
    }
  }, "Amenity markers"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8
    }
  }, SITE_AMENITIES.map(a => /*#__PURE__*/React.createElement(_Pill, {
    key: a,
    active: amenities.includes(a),
    label: a,
    onClick: () => toggleAmenity(a)
  })), customAmenities.map(a => /*#__PURE__*/React.createElement(_Pill, {
    key: a,
    active: true,
    label: a,
    onClick: () => toggleAmenity(a),
    removable: true
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      marginTop: 10
    },
    onKeyDown: e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addAmenity();
      }
    }
  }, /*#__PURE__*/React.createElement(TextField, {
    value: amenQuery,
    onChange: setAmenQuery,
    placeholder: "Add an amenity",
    icon: "plus"
  })), amenSuggestions.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 8
    }
  }, amenSuggestions.map(s => /*#__PURE__*/React.createElement(_Pill, {
    key: s,
    label: s,
    onClick: () => {
      toggleAmenity(s);
      setAmenQuery('');
    },
    subtle: true
  }))), amenQuery.trim() && /*#__PURE__*/React.createElement("button", {
    onClick: addAmenity,
    style: {
      all: 'unset',
      cursor: 'pointer',
      marginTop: 8,
      fontSize: 12,
      fontWeight: 800,
      color: '#FCA311'
    }
  }, "+ Add \u201C", amenQuery.trim(), "\u201D"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...sub,
      margin: '18px 0 8px'
    }
  }, "Vendors"), vendors.map((v, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      padding: '8px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 9,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 12,
      color: '#FCA311',
      ...(v.logo ? {
        background: 'repeating-linear-gradient(135deg,#3a2d24,#3a2d24 4px,#46362b 4px,#46362b 8px)',
        border: '1px solid var(--app-card-border)'
      } : {
        background: 'rgba(252,163,17,0.12)',
        border: '1px solid rgba(252,163,17,0.28)'
      })
    }
  }, v.logo ? /*#__PURE__*/React.createElement(Icon, {
    name: "image",
    size: 13,
    color: "rgba(238,240,255,0.6)"
  }) : v.name[0].toUpperCase()), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      fontSize: 13,
      fontWeight: 700,
      color: 'var(--app-text)'
    }
  }, v.name), /*#__PURE__*/React.createElement("button", {
    onClick: () => setVendors(arr => arr.filter((_, idx) => idx !== i)),
    "aria-label": "Remove vendor",
    style: {
      all: 'unset',
      cursor: 'pointer',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 13,
    color: "var(--app-text-faint)"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 40,
      marginTop: 3,
      fontSize: 11,
      fontWeight: 600,
      color: 'rgba(238,240,255,0.5)'
    }
  }, v.type))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 8,
      alignItems: 'stretch'
    },
    onKeyDown: e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addVendor();
      }
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setVLogo(l => !l),
    "aria-label": "Add vendor logo",
    style: {
      all: 'unset',
      cursor: 'pointer',
      width: 42,
      flexShrink: 0,
      borderRadius: 12,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      ...(vLogo ? {
        background: 'rgba(252,163,17,0.16)',
        border: '1px solid rgba(252,163,17,0.4)'
      } : {
        background: 'var(--app-icon-chip-bg)',
        border: '1px dashed rgba(255,255,255,0.2)'
      })
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: vLogo ? 'check' : 'image',
    size: 15,
    color: "#FCA311"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 7,
      fontWeight: 800,
      color: 'rgba(238,240,255,0.5)'
    }
  }, "logo")), /*#__PURE__*/React.createElement("input", {
    value: vName,
    onChange: e => setVName(e.target.value),
    placeholder: "Vendor name",
    style: {
      ...inputStyle,
      padding: '10px 12px',
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: vType,
    onChange: e => setVType(e.target.value),
    placeholder: "Type",
    style: {
      ...inputStyle,
      padding: '10px 12px',
      width: 80
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: addVendor,
    style: {
      all: 'unset',
      cursor: 'pointer',
      width: 42,
      flexShrink: 0,
      borderRadius: 12,
      background: 'rgba(252,163,17,0.14)',
      border: '1px solid rgba(252,163,17,0.32)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 16,
    color: "#FCA311"
  }))));
  if (section === 'mapBody') {
    return mapOpen ? /*#__PURE__*/React.createElement("div", {
      style: {
        borderRadius: 16,
        border: '1px solid var(--app-card-border)',
        background: 'var(--app-card-bg)',
        padding: '18px 20px 20px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "map",
      size: 16,
      color: "#FCA311"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'Montserrat',
        fontWeight: 900,
        fontSize: 15,
        color: 'var(--app-text)'
      }
    }, "Site map & vendors")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--app-text-muted)',
        marginBottom: 16
      }
    }, amenities.length, " amenities \xB7 ", vendors.length, " vendors"), mapBodyInner) : null;
  }
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Field, {
    label: "Entry fee",
    hint: "Plus"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 14,
      border: '1px solid var(--app-card-border)',
      background: 'var(--app-icon-chip-bg)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '13px 14px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 14,
      fontWeight: 700,
      color: 'var(--app-text)'
    }
  }, entryFeeOn ? 'Paid entry' : 'Free entry'), /*#__PURE__*/React.createElement("button", {
    onClick: () => setEntryFeeOn(v => !v),
    "aria-label": "Toggle paid entry",
    style: {
      all: 'unset',
      cursor: 'pointer',
      flexShrink: 0,
      width: 46,
      height: 28,
      borderRadius: 9999,
      padding: 3,
      boxSizing: 'border-box',
      background: entryFeeOn ? 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' : 'rgba(255,255,255,0.14)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: entryFeeOn ? 'flex-end' : 'flex-start',
      transition: 'all .2s ease'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 22,
      height: 22,
      borderRadius: 9999,
      background: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
    }
  }))), entryFeeOn && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 14px',
      borderTop: '1px solid rgba(255,255,255,0.08)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: 'rgba(238,240,255,0.6)'
    }
  }, "Amount per person"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto',
      display: 'inline-flex',
      alignItems: 'center',
      background: 'rgba(0,0,0,0.2)',
      border: '1px solid var(--app-card-border)',
      borderRadius: 10,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => bumpFee(-1),
    "aria-label": "Decrease",
    style: stepBtn
  }, "\u2013"), /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      padding: '4px 8px',
      margin: '4px 2px',
      borderRadius: 7,
      background: 'var(--app-card-bg)',
      cursor: 'text'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#FCA311',
      fontWeight: 900,
      fontSize: 13
    }
  }, "$"), /*#__PURE__*/React.createElement("input", {
    inputMode: "numeric",
    pattern: "[0-9]*",
    value: entryFee,
    onChange: e => setEntryFee(e.target.value.replace(/\D/g, '')),
    onFocus: e => e.target.select(),
    onBlur: e => {
      if (e.target.value === '') setEntryFee('0');
    },
    style: {
      width: 42,
      textAlign: 'center',
      background: 'transparent',
      border: 'none',
      outline: 'none',
      color: 'var(--app-text)',
      fontFamily: 'Inter',
      fontSize: 15,
      fontWeight: 800
    }
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => bumpFee(1),
    "aria-label": "Increase",
    style: stepBtn
  }, "+"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 16,
      borderRadius: 16,
      border: '1px solid var(--app-card-border)',
      background: 'var(--app-card-bg)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setMapOpen(o => !o),
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 11,
      padding: '14px 16px'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "map",
    size: 17,
    color: "#FCA311"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 14,
      color: 'var(--app-text)'
    }
  }, "Site map & vendors"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 11,
      color: 'rgba(238,240,255,0.5)',
      marginTop: 1
    }
  }, amenities.length, " amenities \xB7 ", vendors.length, " vendors")), /*#__PURE__*/React.createElement("span", {
    style: {
      ...sub,
      color: '#FCA311',
      flexShrink: 0
    }
  }, "Plus"), /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      transform: mapOpen ? 'rotate(90deg)' : 'none',
      transition: 'transform .2s ease',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chev-right",
    size: 16,
    color: "var(--app-text-faint)"
  }))), section === 'all' && mapOpen && mapBodyInner), socialsField);
};

// Review — full-glory stub with Card/Map toggle, detail overview, Plus
// callout, and ONE clean price line. Publish lives in the footer.
const _ReviewStep = ({
  previewEvent,
  start,
  end,
  days,
  startTime,
  endTime,
  venueName,
  address,
  desc,
  cats,
  tier,
  price,
  isPlus,
  entryFeeOn,
  entryFee,
  amenities,
  vendors,
  socials,
  canPublish,
  missing
}) => {
  const [view, setView] = React.useState('card');
  const tierName = isPlus ? 'Plus' : 'Standard';
  const dateLabel = start === end ? new Date(start + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }) : `${start} → ${end}`;
  const timeLabel = _fmtTime(startTime) + (endTime ? ' – ' + _fmtTime(endTime) : '');
  const activeSocials = SOCIAL_FIELDS.filter(([k]) => (socials[k] || '').trim());
  const rows = [['When', `${dateLabel} · ${timeLabel}`], ['Where', venueName.trim() && address.trim() ? `${venueName.trim()} · ${address.trim()}` : venueName.trim() || address.trim() || '—'], ['Entry', isPlus && entryFeeOn ? `$${Number(entryFee) || 0} per person` : 'Free entry'], ['Price', `$${price} · ${tierName} · ${_bandLabel(days)}`]];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 20,
      letterSpacing: '-0.01em',
      color: 'var(--app-text)',
      margin: '0 0 16px'
    }
  }, "Review"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      gap: 4,
      padding: 4,
      borderRadius: 12,
      background: 'var(--app-icon-chip-bg)',
      border: '1px solid var(--app-card-border)',
      marginBottom: 14
    }
  }, [['card', 'Card'], ['map', 'Map']].map(([id, lbl]) => /*#__PURE__*/React.createElement("button", {
    key: id,
    onClick: () => setView(id),
    style: {
      all: 'unset',
      cursor: 'pointer',
      padding: '7px 18px',
      borderRadius: 9,
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 12,
      color: view === id ? '#14213D' : 'rgba(238,240,255,0.6)',
      background: view === id ? 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' : 'transparent'
    }
  }, lbl))), view === 'card' ? /*#__PURE__*/React.createElement(EventStub, {
    variant: "photo",
    event: previewEvent,
    priceInBody: true,
    onTap: () => {}
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 200,
      borderRadius: 18,
      overflow: 'hidden',
      border: '1px solid var(--app-card-border)',
      background: 'repeating-linear-gradient(0deg,#16233f,#16233f 22px,#1a2a49 22px,#1a2a49 44px), repeating-linear-gradient(90deg,transparent,transparent 22px,rgba(255,255,255,0.04) 22px,rgba(255,255,255,0.04) 44px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: '46%',
      left: '50%',
      transform: 'translate(-50%,-100%)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "pin",
    size: 34,
    color: "#ff6348"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 12,
      left: 12,
      right: 12,
      padding: '10px 12px',
      borderRadius: 12,
      background: 'rgba(7,11,20,0.78)',
      backdropFilter: 'blur(6px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 13,
      color: 'var(--app-text)'
    }
  }, venueName.trim() || 'Your venue'), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'rgba(238,240,255,0.6)',
      marginTop: 2
    }
  }, address.trim() || 'Map location'))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      background: 'var(--app-card-bg)',
      border: '1px solid var(--app-card-border)',
      borderRadius: 18,
      overflow: 'hidden',
      marginTop: 16
    }
  }, rows.map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: 'flex',
      gap: 12,
      padding: '13px 16px',
      background: 'rgba(255,255,255,0.015)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 900,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--app-text-faint)',
      width: 64,
      flexShrink: 0,
      paddingTop: 2
    }
  }, k), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: k === 'Price' ? 800 : 600,
      color: k === 'Price' ? '#FCA311' : 'var(--app-text)',
      lineHeight: 1.4,
      minWidth: 0
    }
  }, v)))), desc.trim() && desc.replace(/<[^>]*>/g, '').trim() && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--app-text-muted)',
      lineHeight: 1.55,
      margin: '14px 2px 0'
    },
    dangerouslySetInnerHTML: {
      __html: desc
    }
  }), isPlus && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      padding: 16,
      borderRadius: 16,
      background: 'rgba(255,99,72,0.07)',
      border: '1px solid rgba(255,99,72,0.30)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkles",
    size: 15,
    color: "#ff8a72"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 13,
      color: '#ff8a72',
      letterSpacing: '0.02em'
    }
  }, "Plus features active")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 7
    }
  }, entryFeeOn && /*#__PURE__*/React.createElement(_Chip, {
    label: `Paid entry · $${Number(entryFee) || 0}`
  }), amenities.length > 0 && /*#__PURE__*/React.createElement(_Chip, {
    label: `Site map · ${amenities.length} amenities`
  }), vendors.length > 0 && /*#__PURE__*/React.createElement(_Chip, {
    label: `${vendors.length} vendor${vendors.length > 1 ? 's' : ''}`
  }), activeSocials.map(([k, lbl]) => /*#__PURE__*/React.createElement(_Chip, {
    key: k,
    label: lbl,
    icon: "globe"
  })), !entryFeeOn && amenities.length === 0 && vendors.length === 0 && activeSocials.length === 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'rgba(238,240,255,0.5)'
    }
  }, "Add details on the previous step to use them."))), !canPublish && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginTop: 16,
      padding: '11px 14px',
      borderRadius: 12,
      background: 'rgba(255,99,72,0.08)',
      border: '1px solid rgba(255,99,72,0.30)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "pin",
    size: 13,
    color: "#ff8a72"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: '#ffb5a3'
    }
  }, "Add ", missing.join(', '), " to publish.")));
};
const _Chip = ({
  label,
  icon
}) => /*#__PURE__*/React.createElement("span", {
  style: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '6px 11px',
    borderRadius: 9999,
    background: 'var(--app-icon-chip-bg)',
    border: '1px solid var(--app-card-border)',
    fontSize: 11.5,
    fontWeight: 700,
    color: 'var(--app-text)'
  }
}, icon && /*#__PURE__*/React.createElement(Icon, {
  name: icon,
  size: 12,
  color: "#FCA311"
}), label);

// ===========================================================================
// CHECKOUT — Stripe-style screen. Order summary → card fields → mock pay →
// success. No real charge; production wires the real PSP.
// ===========================================================================
// Payment-brand marks — recognizable wordmarks (not pixel-copied logos).
const _PayMark = ({
  id
}) => {
  if (id === 'applepay') return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "13",
    height: "16",
    viewBox: "0 0 17 20",
    fill: "#fff",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M11.2 3.2c.6-.8 1-1.8.9-2.9-.9 0-2 .6-2.6 1.3-.6.7-1.1 1.7-.9 2.7 1 .1 2-.5 2.6-1.1zM12.1 5.2c-1.4-.1-2.6.8-3.3.8-.7 0-1.7-.8-2.8-.7-1.5 0-2.8.9-3.6 2.2-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.7 2.1 1.1 0 1.5-.7 2.8-.7 1.3 0 1.6.7 2.8.7 1.2 0 1.9-1 2.6-2.1.8-1.2 1.2-2.3 1.2-2.4-.1 0-2.3-.9-2.3-3.4 0-2.1 1.7-3.1 1.8-3.1-1-1.5-2.5-1.6-3-1.7z"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 700,
      fontSize: 13,
      color: 'var(--app-text)'
    }
  }, "Pay"));
  if (id === 'googlepay') return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "15",
    height: "15",
    viewBox: "0 0 48 48",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    fill: "#EA4335",
    d: "M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
  }), /*#__PURE__*/React.createElement("path", {
    fill: "#4285F4",
    d: "M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
  }), /*#__PURE__*/React.createElement("path", {
    fill: "#FBBC05",
    d: "M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
  }), /*#__PURE__*/React.createElement("path", {
    fill: "#34A853",
    d: "M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 600,
      fontSize: 13,
      color: 'var(--app-text)'
    }
  }, "Pay"));
  if (id === 'link') return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 18,
      height: 18,
      borderRadius: 5,
      background: '#00D66F',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "11",
    height: "11",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#053d24",
    strokeWidth: "3",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M7 6l6 6-6 6M13 6l5 6-5 6"
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 800,
      fontSize: 13,
      color: '#00D66F'
    }
  }, "Link"));
  return null;
};
const CheckoutScreen = ({
  order,
  onBack,
  onPaid,
  desktop
}) => {
  const [method, setMethod] = React.useState('card');
  const [card, setCard] = React.useState('');
  const [exp, setExp] = React.useState('');
  const [cvc, setCvc] = React.useState('');
  const [name, setName] = React.useState('');
  const [paying, setPaying] = React.useState(false);
  const cardValid = card.replace(/\s/g, '').length >= 15 && exp.length >= 4 && cvc.length >= 3 && name.trim();
  const valid = method === 'card' ? cardValid : true;
  const payLabel = {
    card: 'Pay to publish',
    applepay: 'Pay with Apple Pay',
    googlepay: 'Pay with Google Pay',
    link: 'Pay with Link'
  }[method];
  const pay = () => {
    if (!valid || paying) return;
    setPaying(true);
    setTimeout(() => onPaid(), 1400);
  };
  const fmtCard = v => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const fmtExp = v => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d;
  };
  const lbl = {
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--app-text-faint)',
    marginBottom: 6,
    display: 'block'
  };
  const fieldBox = {
    ...inputStyle,
    padding: '13px 14px'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden'
    }
  }, !desktop && /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement(SubHeader, {
    crumb: "Checkout \xB7 Secure payment",
    onBack: onBack
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: desktop ? '40px 24px 60px' : '4px 24px 28px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: desktop ? {
      maxWidth: 560,
      margin: '0 auto'
    } : undefined
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 26,
      letterSpacing: '-0.01em',
      margin: '0 0 18px',
      color: 'var(--app-text)'
    }
  }, "Pay to publish"), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 18,
      borderRadius: 18,
      background: 'var(--app-card-bg)',
      border: '1px solid var(--app-card-border)',
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 900,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: 'var(--app-text-faint)',
      marginBottom: 10
    }
  }, "Order summary"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 15,
      color: 'var(--app-text)'
    }
  }, order.title)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: 13,
      color: 'var(--app-text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", null, order.tier === 'plus' ? 'Plus' : 'Standard', " \xB7 ", order.bandLabel), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 800,
      color: 'var(--app-text)'
    }
  }, "$", order.price, ".00")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: 'rgba(255,255,255,0.08)',
      margin: '14px 0'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 800,
      color: 'var(--app-text)'
    }
  }, "Total due today"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 22,
      color: '#FCA311'
    }
  }, "$", order.price, ".00")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: 'var(--app-text-faint)',
      marginTop: 8
    }
  }, "One-time charge \xB7 not a subscription")), /*#__PURE__*/React.createElement("div", {
    style: {
      ...lbl,
      marginBottom: 8
    }
  }, "Payment method"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 8,
      marginBottom: 18
    }
  }, [['applepay', 'Apple Pay', ' Pay'], ['googlepay', 'Google Pay', 'G Pay'], ['link', 'Link', 'Link'], ['card', 'Card', null]].map(([id, label, wordmark]) => {
    const sel = method === id;
    return /*#__PURE__*/React.createElement("button", {
      key: id,
      onClick: () => setMethod(id),
      style: {
        all: 'unset',
        boxSizing: 'border-box',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '13px 14px',
        borderRadius: 13,
        border: `1.5px solid ${sel ? 'rgba(252,163,17,0.5)' : 'rgba(255,255,255,0.1)'}`,
        background: sel ? 'rgba(252,163,17,0.08)' : 'rgba(255,255,255,0.03)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 16,
        height: 16,
        borderRadius: 9999,
        flexShrink: 0,
        border: `2px solid ${sel ? '#FCA311' : 'rgba(255,255,255,0.25)'}`,
        background: sel ? '#FCA311' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, sel && /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 9,
      color: "#14213D"
    })), id === 'card' ? /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 7
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "creditcard",
      size: 16,
      color: "var(--app-text)"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'Montserrat',
        fontWeight: 800,
        fontSize: 13,
        color: 'var(--app-text)'
      }
    }, "Card")) : /*#__PURE__*/React.createElement(_PayMark, {
      id: id
    }));
  })), method === 'card' ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Card number"), /*#__PURE__*/React.createElement("input", {
    value: card,
    onChange: e => setCard(fmtCard(e.target.value)),
    inputMode: "numeric",
    placeholder: "4242 4242 4242 4242",
    style: fieldBox
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      margin: '14px 0'
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Expiry"), /*#__PURE__*/React.createElement("input", {
    value: exp,
    onChange: e => setExp(fmtExp(e.target.value)),
    inputMode: "numeric",
    placeholder: "MM/YY",
    style: fieldBox
  })), /*#__PURE__*/React.createElement("label", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "CVC"), /*#__PURE__*/React.createElement("input", {
    value: cvc,
    onChange: e => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4)),
    inputMode: "numeric",
    placeholder: "123",
    style: fieldBox
  }))), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("span", {
    style: lbl
  }, "Name on card"), /*#__PURE__*/React.createElement("input", {
    value: name,
    onChange: e => setName(e.target.value),
    placeholder: "Jordan Chen",
    style: fieldBox
  }))) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 11,
      padding: '16px 16px',
      borderRadius: 14,
      background: 'var(--app-card-bg)',
      border: '1px solid rgba(255,255,255,0.1)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 16,
    color: "#4ade80"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: 'rgba(238,240,255,0.7)',
      lineHeight: 1.4
    }
  }, "You\u2019ll confirm with ", payLabel.replace('Pay with ', ''), " on the next tap. No card details needed.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      marginTop: 18,
      fontSize: 11,
      color: 'var(--app-text-faint)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "lock",
    size: 12,
    color: "var(--app-text-faint)"
  }), "Payments are encrypted \xB7 test mode"))), /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      padding: '14px 24px calc(14px + env(safe-area-inset-bottom))',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      background: 'rgba(20,33,61,0.55)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: desktop ? {
      maxWidth: 560,
      margin: '0 auto'
    } : undefined
  }, /*#__PURE__*/React.createElement("button", {
    onClick: pay,
    disabled: !valid || paying,
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: valid && !paying ? 'pointer' : 'not-allowed',
      width: '100%',
      padding: '17px 22px',
      borderRadius: 16,
      textAlign: 'center',
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 15,
      ...(valid && !paying ? {
        backgroundImage: 'linear-gradient(135deg,#ff5f4e 0%,#ff8c38 50%,#ffca3a 100%)',
        color: '#14213D',
        boxShadow: '0 10px 26px -8px rgba(255,95,78,0.55)'
      } : {
        background: 'var(--app-card-bg)',
        color: 'rgba(238,240,255,0.4)'
      })
    }
  }, paying ? 'Processing…' : `${payLabel} · $${order.price}.00`))));
};

// Generic success/confirmation screen — used for publish + RSVP.
const ConfirmScreen = ({
  icon = 'check',
  title,
  body,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    height: '100%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column'
  }
}, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    top: '20%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 240,
    height: 240,
    borderRadius: '50%',
    background: 'rgba(255,99,72,0.20)',
    filter: 'blur(90px)',
    pointerEvents: 'none'
  }
}), /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 32px',
    position: 'relative',
    textAlign: 'center'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    width: 84,
    height: 84,
    borderRadius: 9999,
    marginBottom: 26,
    background: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 14px 40px rgba(255,95,78,0.35)'
  }
}, /*#__PURE__*/React.createElement(Icon, {
  name: icon,
  size: 38,
  color: "#14213D"
})), /*#__PURE__*/React.createElement("h1", {
  style: {
    fontFamily: 'Montserrat',
    fontSize: 28,
    fontWeight: 900,
    letterSpacing: '-0.01em',
    lineHeight: 1.1,
    margin: '0 0 12px',
    color: 'var(--app-text)'
  }
}, title), /*#__PURE__*/React.createElement("p", {
  style: {
    fontSize: 14,
    color: 'var(--app-text-muted)',
    lineHeight: 1.6,
    margin: '0 0 32px',
    maxWidth: 280
  }
}, body), /*#__PURE__*/React.createElement("div", {
  style: {
    width: '100%',
    maxWidth: 300
  }
}, /*#__PURE__*/React.createElement(SparkButton, {
  size: "lg",
  onClick: onPrimary
}, primaryLabel), secondaryLabel && /*#__PURE__*/React.createElement("button", {
  onClick: onSecondary,
  style: {
    all: 'unset',
    boxSizing: 'border-box',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--app-text-muted)'
  }
}, secondaryLabel))));

// ===========================================================================
// SETTINGS — account rows + notification toggles + log out.
// ===========================================================================
const ToggleRow = ({
  icon,
  label,
  sub,
  value,
  onChange
}) => /*#__PURE__*/React.createElement("button", {
  onClick: () => onChange(!value),
  style: {
    all: 'unset',
    boxSizing: 'border-box',
    cursor: 'pointer',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 0'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    width: 38,
    height: 38,
    borderRadius: 11,
    flexShrink: 0,
    background: 'var(--app-icon-chip-bg)',
    border: '1px solid var(--app-card-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
}, /*#__PURE__*/React.createElement(Icon, {
  name: icon,
  size: 16,
  color: "#FCA311"
})), /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1,
    minWidth: 0
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--app-text)'
  }
}, label), sub && /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 11,
    color: 'var(--app-text-muted)',
    marginTop: 2
  }
}, sub)), /*#__PURE__*/React.createElement("div", {
  style: {
    width: 44,
    height: 26,
    borderRadius: 9999,
    flexShrink: 0,
    padding: 3,
    background: value ? 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' : 'var(--app-surface-hover)',
    display: 'flex',
    justifyContent: value ? 'flex-end' : 'flex-start',
    transition: 'all .2s ease'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    width: 20,
    height: 20,
    borderRadius: 9999,
    background: '#fff',
    boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
  }
})));
const LinkRow = ({
  icon,
  label,
  onClick,
  danger
}) => /*#__PURE__*/React.createElement("button", {
  onClick: onClick,
  style: {
    all: 'unset',
    boxSizing: 'border-box',
    cursor: 'pointer',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 0'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    width: 38,
    height: 38,
    borderRadius: 11,
    flexShrink: 0,
    background: danger ? 'rgba(255,99,72,0.10)' : 'var(--app-icon-chip-bg)',
    border: `1px solid ${danger ? 'rgba(255,99,72,0.25)' : 'var(--app-card-border)'}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
}, /*#__PURE__*/React.createElement(Icon, {
  name: icon,
  size: 16,
  color: danger ? '#ff6348' : '#FCA311'
})), /*#__PURE__*/React.createElement("span", {
  style: {
    flex: 1,
    fontSize: 14,
    fontWeight: 700,
    color: danger ? '#ff6348' : 'var(--app-text)'
  }
}, label), !danger && /*#__PURE__*/React.createElement(Icon, {
  name: "chev-right",
  size: 16,
  color: "var(--app-text-faint)"
}));
const Divider = () => /*#__PURE__*/React.createElement("div", {
  style: {
    height: 1,
    background: 'var(--app-divider)'
  }
});

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
const _DayPopover = ({
  day,
  onPick,
  onClose
}) => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
  onClick: onClose,
  style: {
    position: 'fixed',
    inset: 0,
    zIndex: 40
  }
}), /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    top: '150%',
    left: 0,
    zIndex: 41,
    minWidth: 150,
    background: '#0e1626',
    border: '1px solid var(--app-card-border)',
    borderRadius: 12,
    boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
    padding: 6,
    display: 'flex',
    flexDirection: 'column',
    gap: 2
  }
}, _NOTIF_DAYS.map(d => /*#__PURE__*/React.createElement("button", {
  key: d,
  onClick: () => onPick(d),
  style: {
    all: 'unset',
    cursor: 'pointer',
    padding: '7px 10px',
    borderRadius: 8,
    fontSize: 12.5,
    fontWeight: 700,
    color: d === day ? '#FCA311' : 'var(--app-text-muted)',
    background: d === day ? 'rgba(252,163,17,0.12)' : 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10
  }
}, d, d === day && /*#__PURE__*/React.createElement(Icon, {
  name: "check",
  size: 12,
  color: "#FCA311"
})))));

// One notifications row. The toggle is its OWN hit target so tapping an inline
// value never flips the switch. `gated` = fit-locked: forced off, switch swapped
// for a locked pill, subtitle swapped for the "Add interests" link.
const NotifRow = ({
  icon,
  label,
  on,
  gated,
  onToggle,
  onAddInterests,
  footer,
  children
}) => {
  const displayOn = gated ? false : on;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '14px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 11,
      flexShrink: 0,
      background: 'var(--app-icon-chip-bg)',
      border: '1px solid var(--app-card-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 16,
    color: gated ? 'var(--app-text-faint)' : '#FCA311'
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: gated ? 'var(--app-text-muted)' : 'var(--app-text)'
    }
  }, label), gated ? /*#__PURE__*/React.createElement("button", {
    onClick: onAddInterests,
    style: {
      all: 'unset',
      cursor: 'pointer',
      marginTop: 4,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 11.5,
      fontWeight: 800,
      color: '#FCA311'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "lock",
    size: 11,
    color: "#FCA311"
  }), "Add interests to enable", /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 900
    }
  }, "\u2192")) : /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--app-text-muted)',
      marginTop: 3,
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      lineHeight: 1.5
    }
  }, children), footer), gated ? /*#__PURE__*/React.createElement("div", {
    title: "Add interests to enable",
    style: {
      width: 44,
      height: 26,
      borderRadius: 9999,
      flexShrink: 0,
      boxSizing: 'border-box',
      background: 'var(--app-icon-chip-bg)',
      border: '1px dashed var(--app-border-soft)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'not-allowed'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "lock",
    size: 12,
    color: "var(--app-text-faint)"
  })) : /*#__PURE__*/React.createElement("button", {
    onClick: onToggle,
    "aria-pressed": displayOn,
    style: {
      all: 'unset',
      cursor: 'pointer',
      width: 44,
      height: 26,
      borderRadius: 9999,
      flexShrink: 0,
      padding: 3,
      boxSizing: 'border-box',
      background: displayOn ? 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' : 'rgba(255,255,255,0.12)',
      display: 'flex',
      justifyContent: displayOn ? 'flex-end' : 'flex-start',
      transition: 'all .2s ease'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 20,
      height: 20,
      borderRadius: 9999,
      background: '#fff',
      boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
    }
  })));
};

// 24h "HH:MM" → "9:00 PM". Used by the Quiet-hours row subtitle + pickers.
const _fmt12 = hhmm => {
  const [h, m] = String(hhmm).split(':').map(Number);
  const ap = h < 12 ? 'AM' : 'PM';
  let hh = h % 12;
  if (hh === 0) hh = 12;
  return `${hh}:${String(m).padStart(2, '0')} ${ap}`;
};
const NotifSection = ({
  hasFit,
  onAddInterests,
  prefs = {
    push: true,
    nearby: true,
    digest: true,
    pushNum: 1,
    pushUnit: 'hr',
    radius: 25,
    day: 'Friday'
  },
  onChange = () => {},
  onOpenQuiet
}) => {
  const {
    push,
    nearby,
    digest,
    pushNum,
    pushUnit,
    radius,
    day
  } = prefs;
  const [editing, setEditing] = React.useState(null); // 'push' | 'radius' | null
  const [temp, setTemp] = React.useState('');
  const [dayOpen, setDayOpen] = React.useState(false);
  const pushGated = !hasFit;
  const nearbyGated = !hasFit;
  const pushEditable = push && !pushGated;
  const nearbyEditable = nearby && !nearbyGated;
  const beginPush = () => {
    if (!pushEditable) return;
    setTemp(String(pushNum));
    setEditing('push');
  };
  const commitPush = () => {
    let n = parseInt(temp, 10);
    if (isNaN(n) || n < 1) n = pushNum;
    n = Math.max(1, Math.min(999, n));
    onChange({
      pushNum: n
    });
    setEditing(null);
  };
  const beginRadius = () => {
    if (!nearbyEditable) return;
    setTemp(String(radius));
    setEditing('radius');
  };
  const commitRadius = () => {
    let n = parseInt(temp, 10);
    if (isNaN(n)) n = radius;
    n = Math.max(1, Math.min(100, n));
    onChange({
      radius: n
    });
    setEditing(null);
  };
  const toggleUnit = () => {
    if (!pushEditable) return;
    onChange({
      pushUnit: pushUnit === 'hr' ? 'min' : 'hr'
    });
  };
  const dottedBtn = {
    all: 'unset',
    cursor: 'pointer',
    color: '#FCA311',
    fontWeight: 800,
    borderBottom: '1.5px dotted rgba(252,163,17,0.6)',
    lineHeight: 1.2
  };
  const greyVal = {
    color: 'var(--app-text-faint)',
    fontWeight: 800
  };
  const numInput = {
    background: 'rgba(252,163,17,0.12)',
    border: '1px solid rgba(252,163,17,0.45)',
    borderRadius: 7,
    padding: '0 5px',
    color: '#FCA311',
    fontFamily: 'Inter',
    fontSize: 11.5,
    fontWeight: 800,
    outline: 'none',
    appearance: 'textfield',
    MozAppearance: 'textfield'
  };
  const sp = w => /*#__PURE__*/React.createElement("span", {
    style: {
      width: w,
      display: 'inline-block'
    }
  });

  // Subordinate supporting link under Push's frequency field — muted accent,
  // smaller + thinner underline than the editable value, so it reads as a link
  // rather than a primary control. Entry point to the Quiet hours screen.
  const quietLink = /*#__PURE__*/React.createElement("button", {
    onClick: onOpenQuiet,
    style: {
      all: 'unset',
      cursor: 'pointer',
      marginTop: 6,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      fontSize: 11,
      fontWeight: 700,
      color: 'rgba(252,163,17,0.80)',
      borderBottom: '1px solid rgba(252,163,17,0.30)',
      lineHeight: 1.3,
      paddingBottom: 1
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "moon",
    size: 11,
    color: "rgba(252,163,17,0.80)"
  }), "Quiet hours");
  const pushSub = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", null, "Event reminders & RSVPs"), sp(10), !pushEditable ? /*#__PURE__*/React.createElement("span", {
    style: greyVal
  }, pushNum, "\u2022", pushUnit) : /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center'
    }
  }, editing === 'push' ? /*#__PURE__*/React.createElement("input", {
    autoFocus: true,
    type: "text",
    inputMode: "numeric",
    value: temp,
    onChange: e => setTemp(e.target.value.replace(/[^0-9]/g, '').slice(0, 3)),
    onBlur: commitPush,
    onKeyDown: e => {
      if (e.key === 'Enter') commitPush();
    },
    style: {
      ...numInput,
      width: 30
    }
  }) : /*#__PURE__*/React.createElement("button", {
    onClick: beginPush,
    style: dottedBtn
  }, pushNum), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'rgba(252,163,17,0.7)',
      fontWeight: 900,
      margin: '0 4px'
    }
  }, "\u2022"), /*#__PURE__*/React.createElement("button", {
    onClick: toggleUnit,
    style: dottedBtn
  }, pushUnit)));
  const nearbySub = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", null, "New events within"), sp(5), !nearbyEditable ? /*#__PURE__*/React.createElement("span", {
    style: greyVal
  }, radius) : editing === 'radius' ? /*#__PURE__*/React.createElement("input", {
    autoFocus: true,
    type: "text",
    inputMode: "numeric",
    value: temp,
    onChange: e => setTemp(e.target.value.replace(/[^0-9]/g, '').slice(0, 3)),
    onBlur: commitRadius,
    onKeyDown: e => {
      if (e.key === 'Enter') commitRadius();
    },
    style: {
      ...numInput,
      width: 34
    }
  }) : /*#__PURE__*/React.createElement("button", {
    onClick: beginRadius,
    style: dottedBtn
  }, radius), sp(5), /*#__PURE__*/React.createElement("span", null, "miles"));
  const digestSub = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", null, "A"), sp(5), !digest ? /*#__PURE__*/React.createElement("span", {
    style: greyVal
  }, day) : /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'inline-block'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setDayOpen(o => !o),
    style: dottedBtn
  }, day), dayOpen && /*#__PURE__*/React.createElement(_DayPopover, {
    day: day,
    onPick: d => {
      onChange({
        day: d
      });
      setDayOpen(false);
    },
    onClose: () => setDayOpen(false)
  })), sp(5), /*#__PURE__*/React.createElement("span", null, "roundup email"));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(NotifRow, {
    icon: "bell",
    label: "Push notifications",
    on: push,
    gated: pushGated,
    onToggle: () => {
      setEditing(null);
      onChange({
        push: !push
      });
    },
    onAddInterests: onAddInterests,
    footer: quietLink
  }, pushSub), /*#__PURE__*/React.createElement(Divider, null), /*#__PURE__*/React.createElement(NotifRow, {
    icon: "pin",
    label: "Nearby events",
    on: nearby,
    gated: nearbyGated,
    onToggle: () => {
      setEditing(null);
      onChange({
        nearby: !nearby
      });
    },
    onAddInterests: onAddInterests
  }, nearbySub), /*#__PURE__*/React.createElement(Divider, null), /*#__PURE__*/React.createElement(NotifRow, {
    icon: "mail",
    label: "Weekly digest",
    on: digest,
    gated: false,
    onToggle: () => {
      setDayOpen(false);
      onChange({
        digest: !digest
      });
    }
  }, digestSub));
};

// ===========================================================================
// QUIET HOURS \u2014 design-only surface (no firing/scheduling here).
//  Part 1: an editable start/end window (native time pickers, 9PM\u20139AM default).
//  Part 2: a single-select override for reminders of saved events that start
//          inside the window \u2014 Never / Ask each time (default) / Always.
// Both persist via lifted app state (`quiet`) so leave/return keeps the choice.
// ===========================================================================
const QUIET_OVERRIDES = [{
  id: 'never',
  label: 'Never',
  desc: 'Reminders for late events are held until quiet hours end.'
}, {
  id: 'ask',
  label: 'Ask each time',
  desc: 'You get a prompt to allow that one reminder.'
}, {
  id: 'always',
  label: 'Always',
  desc: 'Late-event reminders come through even during quiet hours.'
}];

// 24h "HH:MM" <-> {h12, min, mer}. Custom stepper picker (native <input type=time>
// with opacity:0 gave no visible affordance and never opened reliably in-frame).
const _to12 = hhmm => {
  const [h, m] = String(hhmm).split(':').map(Number);
  return {
    h12: h % 12 || 12,
    min: m,
    mer: h < 12 ? 'AM' : 'PM'
  };
};
const _to24 = ({
  h12,
  min,
  mer
}) => {
  let h = h12 % 12;
  if (mer === 'PM') h += 12;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
};
const _stepBtn = {
  all: 'unset',
  cursor: 'pointer',
  width: 40,
  height: 26,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 8,
  color: '#FCA311',
  fontSize: 11,
  background: 'var(--app-icon-chip-bg)',
  border: '1px solid var(--app-card-border)'
};
const _WheelCol = ({
  value,
  onUp,
  onDown
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6
  }
}, /*#__PURE__*/React.createElement("button", {
  onClick: onUp,
  style: _stepBtn
}, "\u25B2"), /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'Montserrat',
    fontWeight: 900,
    fontSize: 26,
    color: 'var(--app-text)',
    width: 46,
    textAlign: 'center'
  }
}, value), /*#__PURE__*/React.createElement("button", {
  onClick: onDown,
  style: _stepBtn
}, "\u25BC"));

// In-place time picker popover (NOT a modal); a fixed backdrop closes it. Each
// adjustment commits live via onChange so the value persists in lifted state.
// Positioned at the field's left edge, then clamped so it never overflows the
// phone screen (shifts left for the END field; flips upward if it'd clip bottom).
const _TimePopover = ({
  hhmm,
  onChange,
  onClose
}) => {
  const t = _to12(hhmm);
  const set = patch => onChange(_to24({
    ...t,
    ...patch
  }));
  const ref = React.useRef(null);
  const [pos, setPos] = React.useState({
    dx: 0,
    up: false
  });
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Nearest clipping ancestor = the phone screen (overflow:hidden, ~390px).
    let screen = el.parentElement;
    while (screen && getComputedStyle(screen).overflow !== 'hidden') screen = screen.parentElement;
    const clip = screen ? screen.getBoundingClientRect() : {
      left: 0,
      right: window.innerWidth,
      bottom: window.innerHeight,
      width: window.innerWidth
    };
    const field = el.offsetParent ? el.offsetParent.getBoundingClientRect() : el.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const scale = clip.width / 390 || 1;
    const m = 12 * scale;
    // Horizontal: shift into view (works from the current, un-shifted left:0 base).
    let dxS = 0;
    if (r.right > clip.right - m) dxS = clip.right - m - r.right;
    if (r.left + dxS < clip.left + m) dxS = clip.left + m - r.left;
    // Vertical: project the downward placement from the field; flip up if it clips.
    const downBottom = field.bottom + 8 * scale + r.height;
    const up = downBottom > clip.bottom - m;
    const dx = dxS / scale;
    setPos(p => Math.abs(p.dx - dx) > 0.5 || p.up !== up ? {
      dx,
      up
    } : p);
  }, []); // anchor ONCE on open; stepping values must not re-position it
  const vertical = pos.up ? {
    bottom: 'calc(100% + 8px)'
  } : {
    top: 'calc(100% + 8px)'
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 40
    }
  }), /*#__PURE__*/React.createElement("div", {
    ref: ref,
    style: {
      position: 'absolute',
      left: 0,
      zIndex: 41,
      ...vertical,
      transform: `translateX(${pos.dx}px)`,
      background: '#0e1626',
      border: '1px solid var(--app-card-border)',
      borderRadius: 16,
      boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
      padding: '16px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(_WheelCol, {
    value: String(t.h12),
    onUp: () => set({
      h12: t.h12 === 12 ? 1 : t.h12 + 1
    }),
    onDown: () => set({
      h12: t.h12 === 1 ? 12 : t.h12 - 1
    })
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 24,
      color: 'rgba(238,240,255,0.5)'
    }
  }, ":"), /*#__PURE__*/React.createElement(_WheelCol, {
    value: String(t.min).padStart(2, '0'),
    onUp: () => set({
      min: (t.min + 5) % 60
    }),
    onDown: () => set({
      min: (t.min + 55) % 60
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      marginLeft: 6
    }
  }, ['AM', 'PM'].map(mm => /*#__PURE__*/React.createElement("button", {
    key: mm,
    onClick: () => set({
      mer: mm
    }),
    style: {
      all: 'unset',
      cursor: 'pointer',
      padding: '9px 14px',
      borderRadius: 10,
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 13,
      textAlign: 'center',
      color: t.mer === mm ? '#14213D' : 'var(--app-text-muted)',
      background: t.mer === mm ? 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' : 'rgba(255,255,255,0.05)'
    }
  }, mm)))));
};

// Time field \u2014 tap to open the stepper popover in place.
const _TimePick = ({
  label,
  value,
  open,
  onOpen,
  onChange,
  onClose
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1,
    minWidth: 0,
    position: 'relative'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: 'var(--app-text-faint)',
    marginBottom: 8
  }
}, label), /*#__PURE__*/React.createElement("button", {
  onClick: onOpen,
  style: {
    all: 'unset',
    boxSizing: 'border-box',
    cursor: 'pointer',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: open ? 'rgba(252,163,17,0.10)' : 'rgba(255,255,255,0.04)',
    border: open ? '1px solid rgba(252,163,17,0.45)' : '1px solid rgba(255,255,255,0.10)',
    borderRadius: 14,
    padding: '13px 14px'
  }
}, /*#__PURE__*/React.createElement(Icon, {
  name: "clock",
  size: 16,
  color: "#FCA311"
}), /*#__PURE__*/React.createElement("span", {
  style: {
    fontFamily: 'Montserrat',
    fontWeight: 900,
    fontSize: 16,
    letterSpacing: '-0.01em',
    color: 'var(--app-text)'
  }
}, _fmt12(value))), open && /*#__PURE__*/React.createElement(_TimePopover, {
  hhmm: value,
  onChange: onChange,
  onClose: onClose
}));
const _OverrideOption = ({
  opt,
  selected,
  onSelect
}) => /*#__PURE__*/React.createElement("button", {
  onClick: onSelect,
  "aria-pressed": selected,
  style: {
    all: 'unset',
    boxSizing: 'border-box',
    cursor: 'pointer',
    width: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: 15,
    marginBottom: 10,
    borderRadius: 16,
    background: selected ? 'rgba(252,163,17,0.10)' : 'rgba(255,255,255,0.03)',
    border: selected ? '1.5px solid rgba(252,163,17,0.45)' : '1px solid rgba(255,255,255,0.08)',
    transition: 'all .15s ease'
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    width: 20,
    height: 20,
    borderRadius: 9999,
    flexShrink: 0,
    marginTop: 1,
    boxSizing: 'border-box',
    border: selected ? '2px solid #FCA311' : '2px solid rgba(255,255,255,0.28)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
}, selected && /*#__PURE__*/React.createElement("span", {
  style: {
    width: 10,
    height: 10,
    borderRadius: 9999,
    background: '#FCA311'
  }
})), /*#__PURE__*/React.createElement("span", {
  style: {
    flex: 1,
    minWidth: 0
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    display: 'block',
    fontSize: 14,
    fontWeight: 800,
    color: selected ? '#fff' : 'rgba(238,240,255,0.90)'
  }
}, opt.label), /*#__PURE__*/React.createElement("span", {
  style: {
    display: 'block',
    fontSize: 12,
    color: 'var(--app-text-muted)',
    marginTop: 3,
    lineHeight: 1.45
  }
}, opt.desc)));
const QuietHoursScreen = ({
  onBack,
  quiet = {
    start: '21:00',
    end: '09:00',
    override: 'ask'
  },
  onChange = () => {}
}) => {
  const [openPicker, setOpenPicker] = React.useState(null); // 'start' | 'end' | null
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement(SubHeader, {
    crumb: "Settings \xB7 Quiet hours",
    onBack: onBack
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: '0 24px 60px'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'Montserrat',
      fontSize: 28,
      fontWeight: 900,
      letterSpacing: '-0.01em',
      margin: '0 0 8px',
      color: 'var(--app-text)'
    }
  }, "Quiet hours"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13.5,
      lineHeight: 1.5,
      color: 'var(--app-text-muted)',
      margin: '0 0 24px',
      maxWidth: 320
    }
  }, "Set a window where notifications stay silent."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(_TimePick, {
    label: "Start",
    value: quiet.start,
    open: openPicker === 'start',
    onOpen: () => setOpenPicker('start'),
    onClose: () => setOpenPicker(null),
    onChange: v => onChange({
      start: v
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 48,
      display: 'flex',
      alignItems: 'center',
      color: 'var(--app-text-faint)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chev-right",
    size: 18,
    color: "var(--app-text-faint)"
  })), /*#__PURE__*/React.createElement(_TimePick, {
    label: "End",
    value: quiet.end,
    open: openPicker === 'end',
    onOpen: () => setOpenPicker('end'),
    onClose: () => setOpenPicker(null),
    onChange: v => onChange({
      end: v
    })
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12.5,
      color: 'var(--app-text-muted)',
      margin: '12px 0 0',
      display: 'flex',
      alignItems: 'center',
      gap: 7
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "moon",
    size: 13,
    color: "#FCA311"
  }), "Notifications stay silent during these hours."), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: 'var(--app-card-bg)',
      margin: '28px 0 22px'
    }
  }), /*#__PURE__*/React.createElement(Eyebrow, null, "Late-night event alerts"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      lineHeight: 1.5,
      color: 'var(--app-text-muted)',
      margin: '10px 0 16px',
      maxWidth: 330
    }
  }, "Some events you save start during quiet hours. Choose what happens when a reminder for one falls in this window."), QUIET_OVERRIDES.map(opt => /*#__PURE__*/React.createElement(_OverrideOption, {
    key: opt.id,
    opt: opt,
    selected: quiet.override === opt.id,
    onSelect: () => onChange({
      override: opt.id
    })
  }))));
};

// ===========================================================================
// PRIVACY — permission toggles (plain-language subtitles, no "cookies"),
// a Your Data section (download / delete, prototype-only), and two Legal
// cards. Delete opens an in-place confirm dialog with Cancel / Delete —
// no real deletion happens.
// ===========================================================================
const PrivacyScreen = ({
  onBack,
  privacy = {
    location: true,
    analytics: false
  },
  onChange = () => {}
}) => {
  const [downloaded, setDownloaded] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const handleDownload = () => {
    setDownloaded(true);
    window.clearTimeout(handleDownload._t);
    handleDownload._t = window.setTimeout(() => setDownloaded(false), 3000);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement(SubHeader, {
    crumb: "Settings \xB7 Privacy",
    onBack: onBack
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: '0 24px 60px'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'Montserrat',
      fontSize: 28,
      fontWeight: 900,
      letterSpacing: '-0.01em',
      margin: '0 0 22px',
      color: 'var(--app-text)'
    }
  }, "Privacy"), /*#__PURE__*/React.createElement(Eyebrow, null, "Permissions"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement(ToggleRow, {
    icon: "pin",
    label: "Location",
    sub: "Powers your distance-ranked feed \u2014 \u201Cwhat\u2019s near me.\u201D Used live, never stored.",
    value: privacy.location,
    onChange: v => onChange({
      location: v
    })
  }), /*#__PURE__*/React.createElement(Divider, null), /*#__PURE__*/React.createElement(ToggleRow, {
    icon: "bolt",
    label: "Usage analytics",
    sub: "Anonymous stats that improve Sparked \u2014 and help local organizers see what their community loves.",
    value: privacy.analytics,
    onChange: v => onChange({
      analytics: v
    })
  })), /*#__PURE__*/React.createElement(Eyebrow, null, "Your data"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: handleDownload,
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '14px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 11,
      flexShrink: 0,
      background: 'var(--app-icon-chip-bg)',
      border: '1px solid var(--app-card-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "download",
    size: 16,
    color: "#FCA311"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: 'var(--app-text)'
    }
  }, "Download my data"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--app-text-muted)',
      marginTop: 2
    }
  }, "Get a copy of everything we have.")), /*#__PURE__*/React.createElement(Icon, {
    name: "chev-right",
    size: 16,
    color: "var(--app-text-faint)"
  })), downloaded && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      margin: '2px 0 10px 52px',
      fontSize: 11.5,
      fontWeight: 700,
      color: '#7ee787'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 13,
    color: "#7ee787"
  }), "We\u2019ll email your data export shortly."), /*#__PURE__*/React.createElement(Divider, null), /*#__PURE__*/React.createElement("button", {
    onClick: () => setConfirmOpen(true),
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '14px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 11,
      flexShrink: 0,
      background: 'rgba(255,99,72,0.10)',
      border: '1px solid rgba(255,99,72,0.25)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trash",
    size: 16,
    color: "#ff6348"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: '#ff6348'
    }
  }, "Delete account & data"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--app-text-muted)',
      marginTop: 2
    }
  }, "Erases your account and everything tied to it.")), /*#__PURE__*/React.createElement(Icon, {
    name: "chev-right",
    size: 16,
    color: "var(--app-text-faint)"
  }))), /*#__PURE__*/React.createElement(Eyebrow, null, "Legal"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {},
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      flex: 1,
      background: 'var(--app-card-bg)',
      border: '1px solid var(--app-card-border)',
      borderRadius: 16,
      padding: '18px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "text",
    size: 18,
    color: "#FCA311"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 800,
      color: 'var(--app-text)'
    }
  }, "Terms of Service")), /*#__PURE__*/React.createElement("button", {
    onClick: () => {},
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      flex: 1,
      background: 'var(--app-card-bg)',
      border: '1px solid var(--app-card-border)',
      borderRadius: 16,
      padding: '18px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "shield",
    size: 18,
    color: "#FCA311"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 800,
      color: 'var(--app-text)'
    }
  }, "Privacy Policy")))), confirmOpen && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    onClick: () => setConfirmOpen(false),
    style: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(6,10,20,0.65)',
      zIndex: 40
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 24,
      right: 24,
      bottom: 40,
      zIndex: 41,
      background: '#101b30',
      border: '1px solid var(--app-card-border)',
      borderRadius: 20,
      padding: 22,
      boxShadow: '0 24px 60px rgba(0,0,0,0.5)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 12,
      marginBottom: 14,
      background: 'rgba(255,99,72,0.12)',
      border: '1px solid rgba(255,99,72,0.30)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trash",
    size: 18,
    color: "#ff6348"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Montserrat',
      fontSize: 18,
      fontWeight: 900,
      color: 'var(--app-text)',
      marginBottom: 8
    }
  }, "Delete account & data?"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      lineHeight: 1.5,
      color: 'var(--app-text-muted)',
      margin: '0 0 20px'
    }
  }, "This permanently erases your account and everything tied to it. This can\u2019t be undone."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setConfirmOpen(false),
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      flex: 1,
      textAlign: 'center',
      padding: '13px 0',
      borderRadius: 9999,
      border: '1px solid var(--app-border-strong)',
      fontSize: 13.5,
      fontWeight: 800,
      color: 'var(--app-text)'
    }
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setConfirmOpen(false),
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      flex: 1,
      textAlign: 'center',
      padding: '13px 0',
      borderRadius: 9999,
      background: '#ff6348',
      fontSize: 13.5,
      fontWeight: 800,
      color: 'var(--app-text)'
    }
  }, "Delete")))));
};

// ===========================================================================
// FEEDBACK — mobile adaptation of the desktop feedback form: a two-option
// type select (gold-outline when selected) + message textarea + gradient
// send CTA. Prototype-only: send shows a brief confirmation, then clears.
// ===========================================================================
const _FeedbackTypeOption = ({
  label,
  active,
  onClick
}) => /*#__PURE__*/React.createElement("button", {
  onClick: onClick,
  style: {
    all: 'unset',
    boxSizing: 'border-box',
    cursor: 'pointer',
    flex: 1,
    textAlign: 'center',
    padding: '13px 0',
    borderRadius: 12,
    border: active ? '1.5px solid #FCA311' : '1px solid rgba(255,255,255,0.12)',
    background: active ? 'rgba(252,163,17,0.10)' : 'rgba(255,255,255,0.03)',
    color: active ? '#FCA311' : 'var(--app-text-muted)',
    fontSize: 13.5,
    fontWeight: 800
  }
}, label);
const FeedbackScreen = ({
  onBack
}) => {
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
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement(SubHeader, {
    crumb: "Settings \xB7 Feedback",
    onBack: onBack
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: '0 24px 60px'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'Montserrat',
      fontSize: 28,
      fontWeight: 900,
      letterSpacing: '-0.01em',
      margin: '0 0 8px',
      color: 'var(--app-text)'
    }
  }, "Feedback"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13.5,
      lineHeight: 1.5,
      color: 'var(--app-text-muted)',
      margin: '0 0 24px',
      maxWidth: 320
    }
  }, "Help us improve Sparked by sharing your thoughts or reporting issues."), /*#__PURE__*/React.createElement(Field, {
    label: "Feedback type"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(_FeedbackTypeOption, {
    label: "Suggestion",
    active: type === 'suggestion',
    onClick: () => setType('suggestion')
  }), /*#__PURE__*/React.createElement(_FeedbackTypeOption, {
    label: "Issue",
    active: type === 'issue',
    onClick: () => setType('issue')
  }))), /*#__PURE__*/React.createElement(Field, {
    label: "Your message"
  }, /*#__PURE__*/React.createElement("textarea", {
    value: message,
    onChange: e => setMessage(e.target.value),
    rows: 5,
    placeholder: "Tell us your ideas or suggestions\u2026",
    style: {
      ...inputStyle,
      minHeight: 120,
      resize: 'none',
      lineHeight: 1.5,
      fontFamily: 'Inter'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(SparkButton, {
    size: "lg",
    onClick: handleSend
  }, "Send Feedback")), sent && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginTop: 14,
      justifyContent: 'center',
      fontSize: 12.5,
      fontWeight: 700,
      color: '#7ee787'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 14,
    color: "#7ee787"
  }), "Thanks \u2014 your feedback was sent.")));
};

// ===========================================================================
// APPEARANCE — System / Dark / Light, three-option single-select. Applies
// app-wide immediately via the ThemeContext CSS vars set at PhoneFrame.
// System follows the device's prefers-color-scheme.
// ===========================================================================
const _APPEARANCE_OPTIONS = [{
  id: 'system',
  label: 'System',
  sub: 'Match your device setting',
  icon: 'monitor'
}, {
  id: 'dark',
  label: 'Dark',
  sub: 'Deep night, always on',
  icon: 'moon'
}, {
  id: 'light',
  label: 'Light',
  sub: 'Bright surfaces, flat wordmark',
  icon: 'sparkles'
}];
const AppearanceScreen = ({
  onBack,
  mode = 'system',
  onChange = () => {}
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflowX: 'hidden'
  }
}, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement(SubHeader, {
  crumb: "Settings \xB7 Appearance",
  onBack: onBack
}), /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1,
    overflow: 'auto',
    padding: '0 24px 60px'
  }
}, /*#__PURE__*/React.createElement("h1", {
  style: {
    fontFamily: 'Montserrat',
    fontSize: 28,
    fontWeight: 900,
    letterSpacing: '-0.01em',
    margin: '0 0 8px',
    color: 'var(--app-text)'
  }
}, "Appearance"), /*#__PURE__*/React.createElement("p", {
  style: {
    fontSize: 13.5,
    lineHeight: 1.5,
    color: 'var(--app-text-muted)',
    margin: '0 0 24px',
    maxWidth: 320
  }
}, "Choose how Sparked looks on this device."), /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  }
}, _APPEARANCE_OPTIONS.map(opt => {
  const selected = mode === opt.id;
  return /*#__PURE__*/React.createElement("button", {
    key: opt.id,
    onClick: () => onChange(opt.id),
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: 16,
      borderRadius: 16,
      background: selected ? 'rgba(252,163,17,0.10)' : 'var(--app-card-bg)',
      border: selected ? '1.5px solid #FCA311' : '1px solid var(--app-card-border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 11,
      flexShrink: 0,
      background: 'var(--app-icon-chip-bg)',
      border: '1px solid var(--app-card-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: opt.icon,
    size: 16,
    color: selected ? '#FCA311' : 'var(--app-text-muted)'
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: selected ? '#FCA311' : 'var(--app-text)'
    }
  }, opt.label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--app-text-muted)',
      marginTop: 2
    }
  }, opt.sub)), selected && /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 16,
    color: "#FCA311"
  }));
}))));
const SettingsScreen = ({
  onBack,
  onEditProfile,
  onLogout,
  onInterests,
  interests = [],
  notif,
  onNotifChange,
  quiet = {
    start: '21:00',
    end: '09:00',
    override: 'ask'
  },
  onQuietHours,
  onPrivacy,
  onFeedback,
  onAppearance
}) => {
  const hasFit = interests.length > 0;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement(SubHeader, {
    crumb: "Me \xB7 Settings",
    onBack: onBack
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: '0 24px 60px'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'Montserrat',
      fontSize: 28,
      fontWeight: 900,
      letterSpacing: '-0.01em',
      margin: '0 0 22px',
      color: 'var(--app-text)'
    }
  }, "Settings"), /*#__PURE__*/React.createElement("button", {
    onClick: onEditProfile,
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: 16,
      marginBottom: 22,
      background: 'var(--app-card-bg)',
      border: '1px solid var(--app-card-border)',
      borderRadius: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 52,
      height: 52,
      borderRadius: 9999,
      flexShrink: 0,
      background: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#14213D',
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 20
    }
  }, "JC"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 17,
      color: 'var(--app-text)'
    }
  }, "Jordan Chen"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--app-text-muted)',
      marginTop: 2
    }
  }, "Edit profile")), /*#__PURE__*/React.createElement(Icon, {
    name: "edit",
    size: 16,
    color: "#FCA311"
  })), /*#__PURE__*/React.createElement(Eyebrow, null, "Notifications"), /*#__PURE__*/React.createElement(NotifSection, {
    hasFit: hasFit,
    onAddInterests: onInterests || (() => {}),
    prefs: notif,
    onChange: onNotifChange,
    onOpenQuiet: onQuietHours || (() => {})
  }), /*#__PURE__*/React.createElement(Eyebrow, null, "Account"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(LinkRow, {
    icon: "sliders",
    label: "Interests & blocks",
    onClick: onInterests || (() => {})
  }), /*#__PURE__*/React.createElement(Divider, null), /*#__PURE__*/React.createElement(LinkRow, {
    icon: "shield",
    label: "Privacy",
    onClick: onPrivacy || (() => {})
  }), /*#__PURE__*/React.createElement(Divider, null), /*#__PURE__*/React.createElement(LinkRow, {
    icon: "globe",
    label: "Language & region",
    onClick: () => {}
  }), /*#__PURE__*/React.createElement(Divider, null), /*#__PURE__*/React.createElement(LinkRow, {
    icon: "palette",
    label: "Appearance",
    onClick: onAppearance || (() => {})
  })), /*#__PURE__*/React.createElement(Eyebrow, null, "Support"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(LinkRow, {
    icon: "heart",
    label: "Help & feedback",
    onClick: onFeedback || (() => {})
  })), /*#__PURE__*/React.createElement(Divider, null), /*#__PURE__*/React.createElement(LinkRow, {
    icon: "logout",
    label: "Log out",
    danger: true,
    onClick: onLogout
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      fontSize: 10,
      color: 'var(--app-text-hint)',
      marginTop: 20,
      letterSpacing: '0.10em'
    }
  }, "Sparked v1.0 \xB7 Phoenix, AZ")));
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
  Markets: 'store',
  Music: 'mic',
  Art: 'palette',
  Food: 'food',
  Community: 'users',
  'Pop-Ups': 'sparkles',
  Outdoors: 'tent',
  Family: 'heart',
  Wellness: 'leaf',
  Nightlife: 'moon',
  Sports: 'dumbbell',
  Tech: 'monitor'
};
const _ibGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10
};
const _ibGridSingle = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: 10
};

// Undecided pill — neutral tile carrying BOTH affordances: a check (→ I'm into)
// and a minus (→ Not for me). Mirrors OnbChip's unselected look.
const _UndecidedChip = ({
  id,
  icon,
  onInterest,
  onBlock
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    boxSizing: 'border-box',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '13px 14px',
    borderRadius: 18,
    border: '1.5px solid rgba(255,255,255,0.10)',
    background: 'var(--app-icon-chip-bg)'
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    width: 28,
    height: 28,
    borderRadius: 9,
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--app-icon-chip-bg)'
  }
}, /*#__PURE__*/React.createElement(Icon, {
  name: icon,
  size: 15,
  color: "#FCA311"
})), /*#__PURE__*/React.createElement("span", {
  style: {
    flex: 1,
    minWidth: 0,
    fontFamily: 'Montserrat',
    fontWeight: 900,
    fontSize: 13,
    letterSpacing: '-0.01em',
    color: 'var(--app-text-muted)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  }
}, id), /*#__PURE__*/React.createElement("span", {
  style: {
    display: 'flex',
    gap: 6,
    flexShrink: 0
  }
}, /*#__PURE__*/React.createElement("button", {
  onClick: onInterest,
  "aria-label": `Add ${id} to interests`,
  style: {
    all: 'unset',
    cursor: 'pointer',
    width: 26,
    height: 26,
    borderRadius: 9999,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1.5px solid rgba(252,163,17,0.45)',
    background: 'rgba(252,163,17,0.10)'
  }
}, /*#__PURE__*/React.createElement(Icon, {
  name: "check",
  size: 12,
  color: "#FCA311"
})), /*#__PURE__*/React.createElement("button", {
  onClick: onBlock,
  "aria-label": `Block ${id}`,
  style: {
    all: 'unset',
    cursor: 'pointer',
    width: 26,
    height: 26,
    borderRadius: 9999,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1.5px solid rgba(255,99,72,0.45)',
    background: 'rgba(255,99,72,0.10)'
  }
}, /*#__PURE__*/React.createElement(Icon, {
  name: "minus",
  size: 12,
  color: "#ff6348"
}))));

// A section that peeks `cap` pills and reveals the rest behind a Show more / less
// toggle. The toggle appears only when the list exceeds the cap. Holds its own
// expand state so each section expands independently.
const _PeekSection = ({
  eyebrow,
  eyebrowColor,
  count,
  items,
  cap,
  renderItem,
  emptyNode,
  gridStyle
}) => {
  const [open, setOpen] = React.useState(false);
  const hidden = items.length - cap;
  const shown = open ? items : items.slice(0, cap);
  const sectionHead = {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    margin: '0 0 12px'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 30
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: sectionHead
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    color: eyebrowColor
  }, eyebrow), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 800,
      color: 'var(--app-text-faint)'
    }
  }, count)), items.length === 0 ? emptyNode : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: gridStyle || _ibGrid
  }, shown.map(renderItem)), hidden > 0 && /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpen(o => !o),
    style: {
      all: 'unset',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      marginTop: 14,
      fontSize: 12,
      fontWeight: 800,
      color: '#FCA311'
    }
  }, open ? 'Show less' : `Show more (${hidden})`)));
};
const InterestsBlocksScreen = ({
  interests = [],
  blocks = [],
  onInterestsChange,
  onBlocksChange,
  onBack
}) => {
  const Chip = window.OnbChip;
  const interestSet = new Set(interests);
  const blockSet = new Set(blocks);
  // Exactly-one-bucket partition, all in canonical taxonomy order.
  const intoList = CREATE_CATEGORIES.filter(c => interestSet.has(c));
  const blockedList = CREATE_CATEGORIES.filter(c => blockSet.has(c));
  const undecidedList = CREATE_CATEGORIES.filter(c => !interestSet.has(c) && !blockSet.has(c));
  const addInterest = id => {
    onBlocksChange(b => b.filter(x => x !== id));
    onInterestsChange(i => [...i.filter(x => x !== id), id]);
  };
  const removeInterest = id => onInterestsChange(i => i.filter(x => x !== id));
  const addBlock = id => {
    onInterestsChange(i => i.filter(x => x !== id));
    onBlocksChange(b => [...b.filter(x => x !== id), id]);
  };
  const removeBlock = id => onBlocksChange(b => b.filter(x => x !== id));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement(SubHeader, {
    crumb: "Settings \xB7 Interests & blocks",
    onBack: onBack
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: '0 24px 60px'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'Montserrat',
      fontSize: 28,
      fontWeight: 900,
      letterSpacing: '-0.01em',
      margin: '0 0 8px',
      color: 'var(--app-text)'
    }
  }, "Interests & blocks"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13.5,
      lineHeight: 1.5,
      color: 'var(--app-text-muted)',
      margin: '0 0 6px',
      maxWidth: 320
    }
  }, "Tune what shapes your feed. Every category sits in one bucket \u2014 into it, undecided, or blocked."), /*#__PURE__*/React.createElement(_PeekSection, {
    eyebrow: "I\u2019m into",
    count: `${intoList.length} selected`,
    items: intoList,
    cap: 5,
    renderItem: c => /*#__PURE__*/React.createElement(Chip, {
      key: c,
      id: c,
      icon: CATEGORY_ICONS[c] || 'sparkles',
      mode: "interest",
      selected: true,
      onClick: () => removeInterest(c)
    }),
    emptyNode: /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: 'rgba(238,240,255,0.5)',
        margin: 0
      }
    }, "Tap a category below to start tuning your feed.")
  }), undecidedList.length > 0 && /*#__PURE__*/React.createElement(_PeekSection, {
    eyebrow: "Undecided",
    count: `${undecidedList.length} undecided`,
    items: undecidedList,
    cap: 6,
    gridStyle: _ibGridSingle,
    renderItem: c => /*#__PURE__*/React.createElement(_UndecidedChip, {
      key: c,
      id: c,
      icon: CATEGORY_ICONS[c] || 'sparkles',
      onInterest: () => addInterest(c),
      onBlock: () => addBlock(c)
    })
  }), blockedList.length > 0 && /*#__PURE__*/React.createElement(_PeekSection, {
    eyebrow: "Not for me",
    eyebrowColor: "#ff8a72",
    count: `${blockedList.length} blocked`,
    items: blockedList,
    cap: 3,
    renderItem: c => /*#__PURE__*/React.createElement(Chip, {
      key: c,
      id: c,
      icon: CATEGORY_ICONS[c] || 'sparkles',
      mode: "block",
      selected: true,
      onClick: () => removeBlock(c)
    })
  })));
};

// ===========================================================================
// EDIT PROFILE — simple form sub-screen.
// ===========================================================================
const EditProfileScreen = ({
  onBack,
  onSave,
  onGoWorkspace
}) => {
  const [name, setName] = React.useState('Jordan Chen');
  const [bio, setBio] = React.useState('Always chasing the next First Friday.');
  const [city, setCity] = React.useState('Phoenix, AZ');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement(SubHeader, {
    crumb: "Settings \xB7 Profile",
    onBack: onBack
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: '0 24px 40px'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'Montserrat',
      fontSize: 26,
      fontWeight: 900,
      letterSpacing: '-0.01em',
      margin: '0 0 6px',
      color: 'var(--app-text)'
    }
  }, "Edit Profile"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12.5,
      color: 'var(--app-text-muted)',
      lineHeight: 1.5,
      margin: '0 0 22px'
    }
  }, "Your personal info \u2014 how you appear as an attendee."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 88,
      height: 88,
      borderRadius: 9999,
      background: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#14213D',
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 32
    }
  }, "JC"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 30,
      height: 30,
      borderRadius: 9999,
      background: 'var(--app-bg)',
      border: '2px solid var(--app-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      borderRadius: 9999,
      background: 'rgba(255,255,255,0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "image",
    size: 14,
    color: "#FCA311"
  }))))), /*#__PURE__*/React.createElement(Field, {
    label: "Name"
  }, /*#__PURE__*/React.createElement(TextField, {
    value: name,
    onChange: setName,
    icon: "user"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "City"
  }, /*#__PURE__*/React.createElement(TextField, {
    value: city,
    onChange: setCity,
    icon: "pin"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Bio"
  }, /*#__PURE__*/React.createElement("textarea", {
    value: bio,
    onChange: e => setBio(e.target.value),
    rows: 3,
    style: {
      ...inputStyle,
      resize: 'none',
      lineHeight: 1.5
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(SparkButton, {
    size: "lg",
    onClick: onSave
  }, "Save Changes")), /*#__PURE__*/React.createElement("button", {
    onClick: onGoWorkspace,
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      display: 'block',
      width: '100%',
      textAlign: 'center',
      marginTop: 16,
      fontSize: 12.5,
      fontWeight: 600,
      color: 'var(--app-text-muted)'
    }
  }, "Looking for your organizer page? ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#FCA311',
      fontWeight: 800
    }
  }, "Go to Workspace \u2192"))));
};

// ===========================================================================
// PLANS & PRICING — renders the three canonical tiers (Pop-up / Standard /
// Plus) straight from PRICING_TIERS, plus the Enterprise (Backstage) card.
// Nothing here hardcodes a tier name, price, or feature — it all reads from
// the canonical source. Prices show as ONE clean band total, never per-day.
// ===========================================================================

// Each tier carries its own checkmark color — the three semantic states:
// green = free (Pop-up), amber = paid base (Standard), coral = premium (Plus).
const _TIER_CHECK = {
  popup: '#4ade80',
  standard: '#FCA311',
  plus: '#ff8a72'
};

// Band-total strip: the tier's price for each supported duration band, side by
// side. Reads DURATION_BANDS + tier.prices from the canonical source.
const _BandStrip = ({
  tier
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    border: '1px solid var(--app-card-border)',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
    background: 'var(--app-card-bg)'
  }
}, DURATION_BANDS.map((b, i) => /*#__PURE__*/React.createElement("div", {
  key: b.id,
  style: {
    flex: 1,
    padding: '10px 8px',
    textAlign: 'center',
    borderLeft: i ? '1px solid rgba(255,255,255,0.08)' : 'none'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 9.5,
    fontWeight: 800,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: 'var(--app-text-faint)',
    marginBottom: 4
  }
}, b.label), /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'Montserrat',
    fontWeight: 900,
    fontSize: 19,
    letterSpacing: '-0.02em',
    color: tier.highlight ? '#ff8a72' : '#fff'
  }
}, "$", tier.prices[b.id]))));
const PricingScreen = ({
  onBack,
  onGetStarted,
  desktop
}) => {
  const renderFeatures = tier => tier.features.map(f => /*#__PURE__*/React.createElement("div", {
    key: f,
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 9,
      marginBottom: 7
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 13,
    color: _TIER_CHECK[tier.id]
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: 'var(--app-text-muted)',
      lineHeight: 1.4
    }
  }, f)));

  // ---- DESKTOP (\u22651024px) \u2014 Pop-up / Standard / Plus side by side, read
  // straight from canonical PRICING_TIERS. Feature lists are padded with
  // invisible spacer rows up to the longest tier's count so bullet rows (and
  // the CTA below them) line up across columns \u2014 no feature text is added
  // or reordered, only blank alignment filler.
  if (desktop) {
    const maxFeatures = Math.max(...PRICING_TIERS.map(t => t.features.length));
    const FEATURE_ROW_H = 29;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        minHeight: '100%',
        boxSizing: 'border-box',
        background: 'var(--app-bg)',
        color: 'var(--app-text)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: 1180,
        margin: '0 auto',
        padding: '40px 40px 80px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: onBack,
      "aria-label": "Back",
      style: {
        all: 'unset',
        cursor: 'pointer',
        width: 38,
        height: 38,
        borderRadius: 12,
        background: 'var(--app-icon-chip-bg)',
        border: '1px solid var(--app-card-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'flex',
        transform: 'rotate(180deg)'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "chev-right",
      size: 16,
      color: "var(--app-text)"
    }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
      style: {
        fontFamily: 'Montserrat',
        fontWeight: 900,
        fontSize: 26,
        letterSpacing: '-0.02em',
        margin: 0,
        color: 'var(--app-text)'
      }
    }, "Simple, honest pricing."), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 13,
        color: 'var(--app-text-muted)',
        margin: '6px 0 0',
        lineHeight: 1.5
      }
    }, "Browsing is always free. Curbside posts are free. Paid tiers are one flat total per event \u2014 pick the reach you need."))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 20,
        alignItems: 'stretch'
      }
    }, PRICING_TIERS.map(tier => /*#__PURE__*/React.createElement("div", {
      key: tier.id,
      style: {
        background: tier.highlight ? 'rgba(255,99,72,0.07)' : 'var(--app-card-bg)',
        border: `1.5px solid ${tier.highlight ? 'rgba(255,99,72,0.45)' : tier.free ? 'rgba(74,222,128,0.30)' : 'rgba(252,163,17,0.32)'}`,
        borderRadius: 22,
        padding: 22,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        top: 18,
        right: 18,
        fontSize: 9,
        fontWeight: 900,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: tier.free ? '#4ade80' : tier.highlight ? '#ff8a72' : '#FCA311',
        background: tier.free ? 'rgba(74,222,128,0.14)' : 'var(--app-icon-chip-bg)',
        border: tier.free ? '1px solid rgba(74,222,128,0.35)' : 'none',
        borderRadius: 6,
        padding: '3px 8px'
      }
    }, tier.free ? 'Free' : tier.highlight ? 'Most reach' : 'Most popular'), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'Montserrat',
        fontWeight: 900,
        fontSize: 14,
        color: 'var(--app-text-muted)',
        letterSpacing: '-0.01em',
        marginBottom: tier.free ? 6 : 12
      }
    }, tier.name), tier.free ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
        marginBottom: 4
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'Montserrat',
        fontWeight: 900,
        fontSize: 32,
        letterSpacing: '-0.02em',
        lineHeight: 1,
        color: 'var(--app-green)'
      }
    }, "Free"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11.5,
        fontWeight: 700,
        color: 'var(--app-text-muted)'
      }
    }, "Single-day only")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--app-text-faint)',
        marginBottom: 12
      }
    }, tier.limit)) : /*#__PURE__*/React.createElement(_BandStrip, {
      tier: tier
    }), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 12.5,
        color: 'var(--app-text-muted)',
        lineHeight: 1.5,
        margin: '0 0 14px'
      }
    }, tier.desc), tier.inheritsFrom ? /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        paddingBottom: 10,
        marginBottom: 3,
        borderBottom: '1px solid var(--app-divider)'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 13,
      color: "var(--app-text-faint)"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 700,
        color: 'var(--app-text-muted)',
        lineHeight: 1.4
      }
    }, "Everything in ", tier.inheritsFrom, ", plus")) : /*#__PURE__*/React.createElement("div", {
      style: {
        height: 40
      },
      "aria-hidden": "true"
    }), /*#__PURE__*/React.createElement("div", null, renderFeatures(tier), Array.from({
      length: maxFeatures - tier.features.length
    }).map((_, i) => /*#__PURE__*/React.createElement("div", {
      key: 'sp' + i,
      style: {
        height: FEATURE_ROW_H
      },
      "aria-hidden": "true"
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }), !tier.free && /*#__PURE__*/React.createElement("button", {
      onClick: onGetStarted,
      style: {
        all: 'unset',
        boxSizing: 'border-box',
        cursor: 'pointer',
        width: '100%',
        marginTop: 14,
        background: tier.highlight ? 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' : 'var(--app-icon-chip-bg)',
        border: tier.highlight ? 'none' : '1px solid var(--app-card-border)',
        borderRadius: 14,
        padding: '12px 18px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        color: tier.highlight ? '#14213D' : 'var(--app-text)',
        fontFamily: 'Montserrat',
        fontWeight: 900,
        fontSize: 14,
        letterSpacing: '-0.01em',
        boxShadow: tier.highlight ? '0 6px 22px rgba(255,95,78,0.22)' : 'none'
      }
    }, tier.highlight && /*#__PURE__*/React.createElement(Icon, {
      name: "fire",
      size: 15,
      color: "#14213D"
    }), tier.highlight ? 'Start Plus' : 'Choose Standard'), tier.free && /*#__PURE__*/React.createElement("button", {
      onClick: onGetStarted,
      style: {
        all: 'unset',
        boxSizing: 'border-box',
        cursor: 'pointer',
        width: '100%',
        marginTop: 14,
        background: 'rgba(74,222,128,0.10)',
        border: '1px solid rgba(74,222,128,0.35)',
        borderRadius: 14,
        padding: '12px 18px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--app-green)',
        fontFamily: 'Montserrat',
        fontWeight: 900,
        fontSize: 14,
        letterSpacing: '-0.01em'
      }
    }, "Post a Curbside")))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        background: 'var(--app-card-bg)',
        border: `1.5px solid ${ENTERPRISE_TIER.border}`,
        borderRadius: 18,
        padding: '16px 22px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'Montserrat',
        fontWeight: 900,
        fontSize: 14,
        color: 'var(--app-text)',
        letterSpacing: '-0.01em'
      }
    }, ENTERPRISE_TIER.name), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        fontWeight: 900,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: ENTERPRISE_TIER.tagColor,
        background: 'var(--app-icon-chip-bg)',
        borderRadius: 6,
        padding: '3px 8px'
      }
    }, ENTERPRISE_TIER.tag)), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 12.5,
        color: 'var(--app-text-muted)',
        lineHeight: 1.5,
        margin: '4px 0 0'
      }
    }, ENTERPRISE_TIER.desc)), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px 18px'
      }
    }, ENTERPRISE_TIER.features.map(f => /*#__PURE__*/React.createElement("div", {
      key: f,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 12,
      color: "#FCA311"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11.5,
        color: 'var(--app-text-muted)',
        whiteSpace: 'nowrap'
      }
    }, f)))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'Montserrat',
        fontWeight: 900,
        fontSize: 15,
        letterSpacing: '-0.02em',
        color: 'var(--app-text)'
      }
    }, ENTERPRISE_TIER.price), /*#__PURE__*/React.createElement("button", {
      onClick: onGetStarted,
      style: {
        all: 'unset',
        boxSizing: 'border-box',
        cursor: 'pointer',
        background: 'var(--app-icon-chip-bg)',
        border: '1px solid var(--app-card-border)',
        borderRadius: 12,
        padding: '11px 18px',
        color: 'var(--app-text)',
        fontFamily: 'Montserrat',
        fontWeight: 900,
        fontSize: 13,
        letterSpacing: '-0.01em',
        whiteSpace: 'nowrap'
      }
    }, "Join waitlist"))), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 11,
        color: 'var(--app-text-hint)',
        lineHeight: 1.65,
        textAlign: 'center',
        marginTop: 24
      }
    }, "Paid tiers are a one-time charge per event \u2014 you pay once at checkout, never per day. All plans include HTTPS event pages and mobile-optimized listings.")));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement(SubHeader, {
    crumb: "Plans & Pricing",
    onBack: onBack
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '0 20px 48px',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: -40,
      left: -60,
      width: 230,
      height: 230,
      borderRadius: '50%',
      background: 'rgba(255,99,72,0.16)',
      filter: 'blur(70px)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 26,
      letterSpacing: '-0.02em',
      lineHeight: 1.05,
      margin: '8px 0 8px',
      color: 'var(--app-text)',
      position: 'relative'
    }
  }, "Simple, honest pricing."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13.5,
      color: 'var(--app-text-muted)',
      lineHeight: 1.55,
      margin: '0 0 24px',
      position: 'relative'
    }
  }, "Browsing is always free. Curbside posts are free. Paid tiers are one flat total per event \u2014 pick the reach you need."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, PRICING_TIERS.map(tier => /*#__PURE__*/React.createElement("div", {
    key: tier.id,
    style: {
      background: tier.highlight ? 'rgba(255,99,72,0.07)' : 'rgba(255,255,255,0.03)',
      border: `1.5px solid ${tier.highlight ? 'rgba(255,99,72,0.45)' : tier.free ? 'rgba(74,222,128,0.30)' : 'rgba(252,163,17,0.32)'}`,
      borderRadius: 22,
      padding: 20,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 16,
      right: 16,
      fontSize: 9,
      fontWeight: 900,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: tier.free ? '#4ade80' : tier.highlight ? '#ff8a72' : '#FCA311',
      background: tier.free ? 'rgba(74,222,128,0.14)' : 'rgba(255,255,255,0.05)',
      border: tier.free ? '1px solid rgba(74,222,128,0.35)' : 'none',
      borderRadius: 6,
      padding: '3px 8px'
    }
  }, tier.free ? 'Free' : tier.highlight ? 'Most reach' : 'Most popular'), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 13,
      color: 'var(--app-text-muted)',
      letterSpacing: '-0.01em',
      marginBottom: tier.free ? 4 : 10
    }
  }, tier.name), tier.free ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 8,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 30,
      letterSpacing: '-0.02em',
      lineHeight: 1,
      color: 'var(--app-green)'
    }
  }, "Free"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: 'var(--app-text-muted)'
    }
  }, "Single-day only")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--app-text-faint)',
      marginBottom: 12
    }
  }, tier.limit)) : /*#__PURE__*/React.createElement(_BandStrip, {
    tier: tier
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12.5,
      color: 'var(--app-text-muted)',
      lineHeight: 1.5,
      margin: '0 0 14px'
    }
  }, tier.desc), tier.inheritsFrom && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      paddingBottom: 10,
      marginBottom: 3,
      borderBottom: '1px solid rgba(255,255,255,0.08)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 13,
    color: "var(--app-text-faint)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: 'var(--app-text-muted)',
      lineHeight: 1.4
    }
  }, "Everything in ", tier.inheritsFrom, ", plus")), renderFeatures(tier), !tier.free && /*#__PURE__*/React.createElement("button", {
    onClick: onGetStarted,
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      width: '100%',
      marginTop: 14,
      background: tier.highlight ? 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' : 'rgba(255,255,255,0.06)',
      border: tier.highlight ? 'none' : '1px solid rgba(255,255,255,0.14)',
      borderRadius: 14,
      padding: '12px 18px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      color: tier.highlight ? '#14213D' : '#fff',
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 14,
      letterSpacing: '-0.01em',
      boxShadow: tier.highlight ? '0 6px 22px rgba(255,95,78,0.22)' : 'none'
    }
  }, tier.highlight && /*#__PURE__*/React.createElement(Icon, {
    name: "fire",
    size: 15,
    color: "#14213D"
  }), tier.highlight ? 'Start Plus' : 'Choose Standard'), tier.free && /*#__PURE__*/React.createElement("button", {
    onClick: onGetStarted,
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      width: '100%',
      marginTop: 14,
      background: 'rgba(74,222,128,0.10)',
      border: '1px solid rgba(74,222,128,0.35)',
      borderRadius: 14,
      padding: '12px 18px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--app-green)',
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 14,
      letterSpacing: '-0.01em'
    }
  }, "Post a Curbside"))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--app-card-bg)',
      border: `1.5px solid ${ENTERPRISE_TIER.border}`,
      borderRadius: 22,
      padding: 20,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 16,
      right: 16,
      fontSize: 9,
      fontWeight: 900,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: ENTERPRISE_TIER.tagColor,
      background: 'var(--app-icon-chip-bg)',
      borderRadius: 6,
      padding: '3px 8px'
    }
  }, ENTERPRISE_TIER.tag), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 13,
      color: 'var(--app-text-muted)',
      letterSpacing: '-0.01em',
      marginBottom: 4
    }
  }, ENTERPRISE_TIER.name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 3,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 15,
      letterSpacing: '-0.02em',
      lineHeight: 1,
      color: 'var(--app-text)'
    }
  }, ENTERPRISE_TIER.price)), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12.5,
      color: 'var(--app-text-muted)',
      lineHeight: 1.5,
      margin: '0 0 14px'
    }
  }, ENTERPRISE_TIER.desc), ENTERPRISE_TIER.features.map(f => /*#__PURE__*/React.createElement("div", {
    key: f,
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 9,
      marginBottom: 7
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 13,
    color: "#FCA311"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: 'var(--app-text-muted)',
      lineHeight: 1.4
    }
  }, f))), /*#__PURE__*/React.createElement("button", {
    onClick: onGetStarted,
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      width: '100%',
      marginTop: 14,
      background: 'var(--app-card-bg)',
      border: '1px solid var(--app-card-border)',
      borderRadius: 14,
      padding: '12px 18px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--app-text)',
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 14,
      letterSpacing: '-0.01em'
    }
  }, "Join waitlist"))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11,
      color: 'var(--app-text-hint)',
      lineHeight: 1.65,
      textAlign: 'center',
      marginTop: 24
    }
  }, "Paid tiers are a one-time charge per event \u2014 you pay once at checkout, never per day. All plans include HTTPS event pages and mobile-optimized listings.")));
};

// ===========================================================================
// CREATE ENTRY FORK — the new front door to creation. Two choices: a free
// single-day Pop-up (its own mini form) or a full Event (the existing 4-step
// wizard, unchanged). Prices/limits read from the canonical PRICING_TIERS.
// ===========================================================================
const CreateForkScreen = ({
  onBack,
  onPickEvent,
  onPickPopup,
  desktop
}) => {
  const popupTier = _tierById('popup');
  const eventFrom = _tierById('standard').prices.single; // cheapest paid band

  const card = {
    all: 'unset',
    boxSizing: 'border-box',
    cursor: 'pointer',
    display: 'block',
    width: '100%',
    borderRadius: 22,
    padding: 20,
    position: 'relative',
    overflow: 'hidden'
  };
  const kicker = {
    fontFamily: 'Montserrat',
    fontWeight: 900,
    fontSize: 22,
    letterSpacing: '-0.02em',
    color: 'var(--app-text)',
    margin: '0 0 6px'
  };
  const copy = {
    fontSize: 13,
    color: 'var(--app-text-muted)',
    lineHeight: 1.5,
    margin: '0 0 12px'
  };
  const subline = {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.02em',
    color: 'var(--app-text-faint)'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden'
    }
  }, !desktop && /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement(SubHeader, {
    crumb: "List an event",
    onBack: onBack
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      overflowX: 'hidden',
      padding: desktop ? '40px 24px 60px' : '0 24px 28px',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: -40,
      right: -50,
      width: 210,
      height: 210,
      borderRadius: '50%',
      background: 'rgba(255,99,72,0.14)',
      filter: 'blur(70px)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: desktop ? {
      maxWidth: 640,
      margin: '0 auto'
    } : undefined
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 27,
      letterSpacing: '-0.02em',
      lineHeight: 1.05,
      margin: '6px 0 6px',
      color: 'var(--app-text)',
      position: 'relative'
    }
  }, "What are you posting?"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13.5,
      color: 'var(--app-text-muted)',
      lineHeight: 1.55,
      margin: '0 0 22px',
      position: 'relative'
    }
  }, "Two ways to get on the local feed \u2014 pick the one that fits."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: desktop ? 'row' : 'column',
      gap: 14,
      alignItems: 'stretch'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onPickPopup,
    style: {
      ...card,
      ...(desktop ? {
        flex: 1
      } : {}),
      background: 'rgba(74,222,128,0.06)',
      boxShadow: 'inset 0 0 0 1.5px rgba(74,222,128,0.32)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 18,
      right: 18,
      fontSize: 9,
      fontWeight: 900,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--app-green)',
      background: 'rgba(74,222,128,0.14)',
      border: '1px solid rgba(74,222,128,0.35)',
      borderRadius: 6,
      padding: '3px 8px'
    }
  }, "Free"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 12,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(74,222,128,0.12)',
      border: '1px solid rgba(74,222,128,0.30)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "pin",
    size: 19,
    color: "#4ade80"
  })), /*#__PURE__*/React.createElement("h2", {
    style: {
      ...kicker,
      margin: 0
    }
  }, "Curbside")), /*#__PURE__*/React.createElement("p", {
    style: copy
  }, popupTier.desc), /*#__PURE__*/React.createElement("div", {
    style: subline
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "cal",
    size: 13,
    color: "var(--app-text-faint)"
  }), /*#__PURE__*/React.createElement("span", null, "Single-day \xB7 ", popupTier.limit))), /*#__PURE__*/React.createElement("button", {
    onClick: onPickEvent,
    style: {
      ...card,
      ...(desktop ? {
        flex: 1
      } : {}),
      background: 'var(--app-card-bg)',
      boxShadow: 'inset 0 0 0 1.5px rgba(252,163,17,0.30)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 18,
      right: 18,
      fontSize: 12,
      fontWeight: 900,
      letterSpacing: '-0.01em',
      color: '#FCA311',
      background: 'rgba(252,163,17,0.10)',
      border: '1px solid rgba(252,163,17,0.32)',
      borderRadius: 8,
      padding: '4px 10px',
      fontFamily: 'Montserrat'
    }
  }, "from $", eventFrom), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 12,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(252,163,17,0.12)',
      border: '1px solid rgba(252,163,17,0.30)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkles",
    size: 19,
    color: "#FCA311"
  })), /*#__PURE__*/React.createElement("h2", {
    style: {
      ...kicker,
      margin: 0
    }
  }, "Event")), /*#__PURE__*/React.createElement("p", {
    style: copy
  }, "A full listing on the local feed \u2014 categories, schedule, venue, photos. For businesses and organizers."), /*#__PURE__*/React.createElement("div", {
    style: subline
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "cal",
    size: 13,
    color: "var(--app-text-faint)"
  }), /*#__PURE__*/React.createElement("span", null, "Standard or Plus \xB7 multi-day available")))))));
};

// ===========================================================================
// POP-UP MINI FORM — one screen, free, no tier step, no checkout. Posts an
// event straight to the feed as a normal EventStub (1 photo, one category).
// ===========================================================================
// Single striped photo slot — reuses the app's fill-a-placeholder pattern.
const _PopupPhotoSlot = ({
  filled,
  onToggle
}) => {
  const slot = {
    width: '100%',
    height: 132,
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
    boxSizing: 'border-box'
  };
  if (filled) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        ...slot,
        background: 'repeating-linear-gradient(135deg,#3a2d24,#3a2d24 7px,#46362b 7px,#46362b 14px)',
        border: '1px solid var(--app-card-border)'
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: onToggle,
      "aria-label": "Remove photo",
      style: {
        all: 'unset',
        cursor: 'pointer',
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 9999,
        background: 'rgba(7,11,20,0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "x",
      size: 12,
      color: "#fff"
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        bottom: 8,
        left: 10,
        fontSize: 9,
        fontFamily: 'monospace',
        color: 'var(--app-text-muted)'
      }
    }, "photo 1"));
  }
  return /*#__PURE__*/React.createElement("button", {
    onClick: onToggle,
    style: {
      ...slot,
      all: 'unset',
      cursor: 'pointer',
      border: '1px dashed rgba(255,255,255,0.20)',
      background: 'linear-gradient(135deg, rgba(255,95,78,0.08), rgba(255,202,58,0.05))',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "image",
    size: 22,
    color: "#FCA311"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 800,
      color: 'var(--app-text-muted)'
    }
  }, "Add one photo"));
};
const CreatePopupScreen = ({
  onBack,
  onPost,
  desktop
}) => {
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
    const displayDate = new Date(date + 'T00:00:00').toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
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
      gradient: photo ? 'linear-gradient(135deg,#4a2f1a,#9c5a28 60%,#ffca3a)' : 'linear-gradient(135deg,#26384b,#4a627e 60%,#8fa9c4)',
      price: 0,
      startISO: _parsePreviewISO(date, startTime),
      saved: false,
      live: false,
      isPopup: true,
      photos: photo ? 1 : 0
    });
  };
  const sectionLabelStyle = {
    fontFamily: 'Montserrat',
    fontWeight: 900,
    fontSize: 20,
    letterSpacing: '-0.01em',
    color: 'var(--app-text)',
    margin: '0 0 4px'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden'
    }
  }, !desktop && /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement(SubHeader, {
    crumb: "New Curbside post",
    onBack: onBack,
    right: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        fontWeight: 900,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--app-green)',
        background: 'rgba(74,222,128,0.14)',
        border: '1px solid rgba(74,222,128,0.35)',
        borderRadius: 6,
        padding: '3px 8px'
      }
    }, "Free")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: desktop ? '32px 24px 40px' : '2px 24px 24px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: desktop ? {
      maxWidth: 560,
      margin: '0 auto'
    } : undefined
  }, /*#__PURE__*/React.createElement("h2", {
    style: sectionLabelStyle
  }, "Quick post"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12.5,
      color: 'var(--app-text-muted)',
      lineHeight: 1.5,
      margin: '0 0 18px'
    }
  }, "The essentials only. Your pop-up goes straight to the local feed."), /*#__PURE__*/React.createElement(Field, {
    label: "Photo",
    hint: "Optional"
  }, /*#__PURE__*/React.createElement(_PopupPhotoSlot, {
    filled: photo,
    onToggle: () => setPhoto(p => !p)
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Title"
  }, /*#__PURE__*/React.createElement(TextField, {
    value: title,
    onChange: setTitle,
    placeholder: "e.g. Corner Yard Sale",
    icon: "text"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Description"
  }, /*#__PURE__*/React.createElement("textarea", {
    value: desc,
    onChange: e => setDesc(e.target.value),
    placeholder: "What is it? Anything people should know before they show up.",
    rows: 3,
    style: {
      ...inputStyle,
      minHeight: 84,
      lineHeight: 1.5,
      resize: 'none',
      fontFamily: 'Inter'
    }
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Address"
  }, /*#__PURE__*/React.createElement(TextField, {
    value: address,
    onChange: setAddress,
    placeholder: "Street address",
    icon: "pin"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Date",
    hint: "Single day only"
  }, /*#__PURE__*/React.createElement(_DateField, {
    value: date,
    onChange: setDate,
    label: "On",
    min: todayLocalYMD()
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Start time",
    hint: "Optional"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setTimeOn(o => !o),
    "aria-label": "Toggle start time",
    style: {
      all: 'unset',
      cursor: 'pointer',
      flexShrink: 0,
      width: 46,
      height: 27,
      borderRadius: 9999,
      padding: 3,
      background: timeOn ? 'linear-gradient(135deg,#ff8c38,#ffca3a)' : 'rgba(255,255,255,0.10)',
      transition: 'background .18s ease',
      display: 'flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 21,
      height: 21,
      borderRadius: '50%',
      background: '#fff',
      transform: timeOn ? 'translateX(19px)' : 'translateX(0)',
      transition: 'transform .18s ease',
      boxShadow: '0 2px 5px rgba(0,0,0,0.35)'
    }
  })), timeOn ? /*#__PURE__*/React.createElement(_TimePicker, {
    value: time,
    onChange: setTime
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: 'var(--app-text-faint)',
      fontWeight: 600
    }
  }, "All-day pop-up"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      padding: '14px 24px 22px',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      background: 'rgba(10,15,26,0.6)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: desktop ? {
      maxWidth: 560,
      margin: '0 auto'
    } : undefined
  }, /*#__PURE__*/React.createElement("button", {
    onClick: post,
    disabled: !canPost,
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: canPost ? 'pointer' : 'not-allowed',
      width: '100%',
      padding: '16px 22px',
      borderRadius: 16,
      textAlign: 'center',
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 16,
      letterSpacing: '-0.01em',
      ...(canPost ? {
        backgroundImage: 'linear-gradient(135deg,#ff5f4e 0%,#ff8c38 50%,#ffca3a 100%)',
        color: '#14213D',
        boxShadow: '0 10px 26px -8px rgba(255,95,78,0.55)'
      } : {
        background: 'var(--app-card-bg)',
        color: 'var(--app-text-hint)'
      })
    }
  }, "Post it \u2014 free"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11,
      color: 'var(--app-text-faint)',
      textAlign: 'center',
      margin: '10px 0 0'
    }
  }, "No checkout \xB7 expires after your date"))));
};
Object.assign(window, {
  Field,
  TextField,
  SubHeader,
  inputStyle,
  AuthScreen,
  CreateEventScreen,
  CreateForkScreen,
  CreatePopupScreen,
  CheckoutScreen,
  ConfirmScreen,
  SettingsScreen,
  EditProfileScreen,
  InterestsBlocksScreen,
  CATEGORY_ICONS,
  ToggleRow,
  LinkRow,
  Divider,
  QuietHoursScreen,
  PricingScreen,
  PRICING_TIERS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile-app/AppScreens.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile-app/Components.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
    '--app-green': '#4ade80'
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
    '--app-green': '#16a34a'
  }
};
const SparkLogo = ({
  size = 38
}) => {
  const theme = React.useContext(ThemeContext);
  const isLight = theme === 'light';
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "assets/sparked-icon.svg",
    width: size * 0.74,
    height: size,
    alt: ""
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'Montserrat, sans-serif',
      fontWeight: 900,
      fontSize: size * 0.74,
      letterSpacing: '-0.01em',
      lineHeight: 1,
      ...(isLight ? {
        color: '#14213D'
      } : {
        backgroundImage: 'linear-gradient(135deg,#ff5f4e 0%,#ff8c38 50%,#ffca3a 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      })
    }
  }, "Sparked"));
};
const SparkButton = ({
  children,
  onClick,
  size = 'md',
  kind = 'primary',
  icon
}) => {
  const sizes = {
    sm: {
      padding: '10px 18px',
      fontSize: 13,
      radius: 12
    },
    md: {
      padding: '14px 24px',
      fontSize: 14,
      radius: 16
    },
    lg: {
      padding: '18px 32px',
      fontSize: 16,
      radius: 20
    }
  };
  const s = sizes[size];
  if (kind === 'primary') {
    return /*#__PURE__*/React.createElement("button", {
      onClick: onClick,
      style: {
        backgroundImage: 'linear-gradient(135deg,#ff5f4e 0%,#ff8c38 50%,#ffca3a 100%)',
        color: '#14213D',
        fontWeight: 900,
        fontSize: s.fontSize,
        padding: s.padding,
        borderRadius: s.radius,
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 6px 22px rgba(255,95,78,0.24)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10
      }
    }, children, icon);
  }
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      background: 'var(--app-card-bg)',
      color: 'var(--app-text)',
      border: '2px solid var(--app-border-strong)',
      fontWeight: 900,
      fontSize: s.fontSize,
      padding: s.padding,
      borderRadius: s.radius,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10
    }
  }, children, icon);
};
const Eyebrow = ({
  children,
  color = '#FCA311'
}) => /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 10,
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.20em',
    color
  }
}, children);
const InterestPill = ({
  children,
  active,
  onClick
}) => /*#__PURE__*/React.createElement("button", {
  onClick: onClick,
  style: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 16px',
    borderRadius: 9999,
    fontFamily: 'Inter',
    fontWeight: 900,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.20em',
    border: '1px solid var(--app-card-border)',
    color: active ? '#14213D' : 'var(--app-text-muted)',
    background: active ? 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' : 'transparent',
    transform: active ? 'scale(1.05)' : 'scale(1)',
    transition: 'all .2s ease',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: active ? '0 6px 18px rgba(255,99,72,0.25)' : 'none'
  }
}, children);

// Pulsating red dot that "breathes" — replaces the old LIVE pill.
// Keyframes live in index.html (sparked-breathe).
const LiveDot = ({
  size = 9
}) => /*#__PURE__*/React.createElement("span", {
  className: "sparked-live-dot",
  "aria-label": "Live",
  style: {
    width: size,
    height: size
  }
});
// Back-compat alias so any older call sites still render something.
const LiveBadge = LiveDot;
const Tag = ({
  children
}) => /*#__PURE__*/React.createElement("span", {
  style: {
    display: 'inline-flex',
    padding: '3px 10px',
    borderRadius: 9999,
    fontWeight: 900,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.18em',
    backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
    color: '#14213D'
  }
}, children);

// Small ghost icon button used in card headers (bookmark, share, etc.)
const CardIconButton = ({
  icon,
  active,
  accent = '#FCA311',
  label,
  onClick
}) => /*#__PURE__*/React.createElement("button", {
  "aria-label": label,
  onClick: e => {
    e.stopPropagation();
    onClick && onClick();
  },
  style: {
    background: active ? 'rgba(252,163,17,0.12)' : 'var(--app-card-bg)',
    border: `1px solid ${active ? 'rgba(252,163,17,0.35)' : 'var(--app-card-border)'}`,
    width: 34,
    height: 34,
    borderRadius: 11,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: active ? accent : 'var(--app-text-muted)',
    flexShrink: 0
  }
}, /*#__PURE__*/React.createElement(Icon, {
  name: icon,
  size: 15,
  color: "currentColor"
}));
const EventCard = ({
  event,
  onTap,
  onSave,
  onShare
}) => /*#__PURE__*/React.createElement("div", {
  onClick: onTap,
  style: {
    background: 'var(--app-card-bg)',
    border: '1px solid var(--app-card-border)',
    borderRadius: 28,
    overflow: 'hidden',
    cursor: 'pointer',
    boxShadow: '0 4px 24px rgba(0,0,0,0.20)'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    height: 184,
    position: 'relative',
    background: event.gradient || 'linear-gradient(135deg,#5b3220,#a8551d 60%,#e09c3a)'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(20,33,61,0.85), transparent)'
  }
}), event.live && /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    top: 16,
    right: 18,
    zIndex: 2,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
    borderRadius: 9999,
    background: 'rgba(20,33,61,0.55)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.10)'
  }
}, /*#__PURE__*/React.createElement(LiveDot, null))), /*#__PURE__*/React.createElement("div", {
  style: {
    padding: 24
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12
  }
}, /*#__PURE__*/React.createElement("h3", {
  style: {
    fontFamily: 'Montserrat',
    fontSize: 22,
    fontWeight: 900,
    letterSpacing: '-0.01em',
    margin: 0,
    lineHeight: 1.1,
    color: 'var(--app-text)',
    flex: 1,
    minWidth: 0
  }
}, event.title), /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    gap: 6
  }
}, /*#__PURE__*/React.createElement(CardIconButton, {
  icon: event.saved ? 'bookmark-fill' : 'bookmark',
  active: event.saved,
  label: event.saved ? 'Saved' : 'Save',
  onClick: onSave
}), /*#__PURE__*/React.createElement(CardIconButton, {
  icon: "share",
  label: "Share",
  onClick: onShare
}))), /*#__PURE__*/React.createElement(MetaRow, {
  icon: "cal",
  iconColor: "#ff6348"
}, event.date), /*#__PURE__*/React.createElement(MetaRow, {
  icon: "clock",
  iconColor: "#ff6348"
}, event.time), /*#__PURE__*/React.createElement(MetaRow, {
  icon: "pin",
  iconColor: "#FCA311"
}, event.location), /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    gap: 6,
    marginTop: 14,
    flexWrap: 'wrap'
  }
}, event.tags.map(t => /*#__PURE__*/React.createElement(Tag, {
  key: t
}, t)))));
const Icon = ({
  name,
  size = 14,
  color = 'currentColor'
}) => {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
  };
  switch (name) {
    case 'cal':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("rect", {
        x: "3",
        y: "4",
        width: "18",
        height: "18",
        rx: "2"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M16 2v4M8 2v4M3 10h18"
      }));
    case 'clock':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "10"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M12 6v6l4 2"
      }));
    case 'pin':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("path", {
        d: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "10",
        r: "3"
      }));
    case 'search':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("circle", {
        cx: "11",
        cy: "11",
        r: "8"
      }), /*#__PURE__*/React.createElement("path", {
        d: "m21 21-4.3-4.3"
      }));
    case 'plus':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("path", {
        d: "M5 12h14M12 5v14"
      }));
    case 'user':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "7",
        r: "4"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M4 21v-1a8 8 0 0 1 16 0v1"
      }));
    case 'home':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("path", {
        d: "M3 9.5 12 3l9 6.5V21H3V9.5Z"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M9 21V12h6v9"
      }));
    case 'list':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("line", {
        x1: "8",
        y1: "6",
        x2: "21",
        y2: "6"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "8",
        y1: "12",
        x2: "21",
        y2: "12"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "8",
        y1: "18",
        x2: "21",
        y2: "18"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "4",
        cy: "6",
        r: "1"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "4",
        cy: "12",
        r: "1"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "4",
        cy: "18",
        r: "1"
      }));
    case 'map':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("polygon", {
        points: "3 6 9 4 15 6 21 4 21 18 15 20 9 18 3 20"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "9",
        y1: "4",
        x2: "9",
        y2: "18"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "15",
        y1: "6",
        x2: "15",
        y2: "20"
      }));
    case 'check':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("path", {
        d: "M20 6 9 17l-5-5"
      }));
    case 'arrow':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("path", {
        d: "M5 12h14M13 5l7 7-7 7"
      }));
    case 'sparkles':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("path", {
        d: "M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"
      }));
    case 'mic':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("rect", {
        x: "9",
        y: "3",
        width: "6",
        height: "12",
        rx: "3"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M5 11a7 7 0 0 0 14 0M12 18v3"
      }));
    case 'palette':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("path", {
        d: "M12 22a10 10 0 1 1 0-20c5 0 9 3 9 7 0 3-3 4-5 4h-2a2 2 0 0 0 0 4 2 2 0 0 1-2 5z"
      }));
    case 'store':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("path", {
        d: "M3 9 4 4h16l1 5M3 9v11h18V9M3 9h18M9 14h6"
      }));
    case 'tent':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("path", {
        d: "M3 20 12 4l9 16M9 20v-4h6v4"
      }));
    case 'bookmark':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("path", {
        d: "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
      }));
    case 'bookmark-fill':
      return /*#__PURE__*/React.createElement("svg", _extends({}, props, {
        fill: color
      }), /*#__PURE__*/React.createElement("path", {
        d: "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
      }));
    case 'share':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("circle", {
        cx: "18",
        cy: "5",
        r: "3"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "6",
        cy: "12",
        r: "3"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "18",
        cy: "19",
        r: "3"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "8.59",
        y1: "13.51",
        x2: "15.42",
        y2: "17.49"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "15.41",
        y1: "6.51",
        x2: "8.59",
        y2: "10.49"
      }));
    case 'lock':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("rect", {
        x: "3",
        y: "11",
        width: "18",
        height: "11",
        rx: "2",
        ry: "2"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M7 11V7a5 5 0 0 1 10 0v4"
      }));
    case 'chev-right':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("path", {
        d: "M9 18l6-6-6-6"
      }));
    case 'gear':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "3"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
      }));
    case 'chev-left':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("path", {
        d: "M15 18l-6-6 6-6"
      }));
    case 'x':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("path", {
        d: "M18 6 6 18M6 6l12 12"
      }));
    case 'mail':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("rect", {
        x: "2",
        y: "4",
        width: "20",
        height: "16",
        rx: "2"
      }), /*#__PURE__*/React.createElement("path", {
        d: "m22 7-10 6L2 7"
      }));
    case 'bell':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("path", {
        d: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
      }));
    case 'image':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("rect", {
        x: "3",
        y: "3",
        width: "18",
        height: "18",
        rx: "2"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "9",
        cy: "9",
        r: "2"
      }), /*#__PURE__*/React.createElement("path", {
        d: "m21 15-5-5L5 21"
      }));
    case 'edit':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("path", {
        d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"
      }));
    case 'ticket':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("path", {
        d: "M3 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M13 5v14"
      }));
    case 'logout':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("path", {
        d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
      }));
    case 'globe':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "10"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20"
      }));
    case 'shield':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("path", {
        d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      }));
    case 'heart':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("path", {
        d: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"
      }));
    case 'star':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("polygon", {
        points: "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
      }));
    case 'text':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("path", {
        d: "M4 7V5h16v2M9 19h6M12 5v14"
      }));
    case 'food':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("path", {
        d: "M4 3v7a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3M6 3v18M18 3c-1.7 1.2-2.5 3.3-2.5 6 0 2 1 3 2.5 3v9"
      }));
    case 'users':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("circle", {
        cx: "9",
        cy: "7",
        r: "3"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M3 21v-1a6 6 0 0 1 12 0v1"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M16 3.6a3 3 0 0 1 0 6.8M21 21v-1a6 6 0 0 0-4-5.7"
      }));
    case 'minus':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("path", {
        d: "M5 12h14"
      }));
    case 'monitor':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("rect", {
        x: "2",
        y: "3",
        width: "20",
        height: "14",
        rx: "2"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M8 21h8M12 17v4"
      }));
    case 'creditcard':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("rect", {
        x: "2",
        y: "5",
        width: "20",
        height: "14",
        rx: "2.5"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M2 10h20M6 15h4"
      }));
    case 'ban':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "9"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M5.6 5.6l12.8 12.8"
      }));
    case 'bolt':
      return /*#__PURE__*/React.createElement("svg", _extends({}, props, {
        fill: color,
        stroke: "none"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12z"
      }));
    case 'thumbs-up':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("path", {
        d: "M7 10v12"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88z"
      }));
    case 'fire':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("path", {
        d: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
      }));
    case 'leaf':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("path", {
        d: "M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M2 21c0-3 1.85-5.36 5.08-6"
      }));
    case 'moon':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("path", {
        d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"
      }));
    case 'dumbbell':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("path", {
        d: "M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"
      }));
    case 'download':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("path", {
        d: "M12 3v12"
      }), /*#__PURE__*/React.createElement("path", {
        d: "m7 10 5 5 5-5"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M5 21h14"
      }));
    case 'trash':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("path", {
        d: "M3 6h18"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M10 11v6M14 11v6"
      }));
    case 'sliders':
      return /*#__PURE__*/React.createElement("svg", props, /*#__PURE__*/React.createElement("line", {
        x1: "21",
        y1: "4",
        x2: "14",
        y2: "4"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "10",
        y1: "4",
        x2: "3",
        y2: "4"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "21",
        y1: "12",
        x2: "12",
        y2: "12"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "8",
        y1: "12",
        x2: "3",
        y2: "12"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "21",
        y1: "20",
        x2: "16",
        y2: "20"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "12",
        y1: "20",
        x2: "3",
        y2: "20"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "14",
        y1: "2",
        x2: "14",
        y2: "6"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "8",
        y1: "10",
        x2: "8",
        y2: "14"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "16",
        y1: "18",
        x2: "16",
        y2: "22"
      }));
    default:
      return null;
  }
};
const MetaRow = ({
  icon,
  iconColor,
  children
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    fontSize: 13,
    color: 'var(--app-text-muted)',
    marginBottom: 6
  }
}, /*#__PURE__*/React.createElement(Icon, {
  name: icon,
  color: iconColor
}), /*#__PURE__*/React.createElement("span", null, children));
const PhoneFrame = ({
  children,
  label,
  theme = 'dark'
}) => /*#__PURE__*/React.createElement(ThemeContext.Provider, {
  value: theme
}, /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    width: 390,
    height: 844,
    borderRadius: 56,
    padding: 8,
    background: '#000',
    boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
    position: 'relative'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    ...APP_THEME_VARS[theme],
    width: '100%',
    height: '100%',
    borderRadius: 48,
    overflow: 'hidden',
    background: 'var(--app-bg)',
    color: 'var(--app-text)',
    position: 'relative'
  }
}, children), /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    top: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 122,
    height: 32,
    background: '#000',
    borderRadius: 9999,
    zIndex: 5
  }
})), label && /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 10,
    fontWeight: 900,
    color: 'var(--app-text-muted, rgba(238,240,255,0.50))',
    textTransform: 'uppercase',
    letterSpacing: '0.25em'
  }
}, label)));
const StatusBar = () => /*#__PURE__*/React.createElement("div", {
  style: {
    height: 50,
    padding: '14px 28px 0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: 'var(--app-text, #fff)',
    fontSize: 14,
    fontWeight: 700,
    fontFamily: 'Inter'
  }
}, /*#__PURE__*/React.createElement("span", null, "9:41"), /*#__PURE__*/React.createElement("span", {
  style: {
    display: 'inline-flex',
    gap: 6,
    alignItems: 'center'
  }
}, /*#__PURE__*/React.createElement("svg", {
  width: "16",
  height: "11",
  viewBox: "0 0 16 11",
  fill: "currentColor"
}, /*#__PURE__*/React.createElement("rect", {
  x: "0",
  y: "7",
  width: "3",
  height: "4"
}), /*#__PURE__*/React.createElement("rect", {
  x: "4",
  y: "5",
  width: "3",
  height: "6"
}), /*#__PURE__*/React.createElement("rect", {
  x: "8",
  y: "2",
  width: "3",
  height: "9"
}), /*#__PURE__*/React.createElement("rect", {
  x: "12",
  y: "0",
  width: "3",
  height: "11"
})), /*#__PURE__*/React.createElement("svg", {
  width: "24",
  height: "11",
  viewBox: "0 0 24 11",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1"
}, /*#__PURE__*/React.createElement("rect", {
  x: "1",
  y: "1",
  width: "20",
  height: "9",
  rx: "2"
}), /*#__PURE__*/React.createElement("rect", {
  x: "2",
  y: "2",
  width: "14",
  height: "7",
  rx: "1",
  fill: "currentColor"
}))));

// Two-tab bar — Explore | Me. No gradient FAB; the "Create Event" CTA
// lives inside Me → Workspace per the locked-in design decision.
const TabBar = ({
  active,
  onChange
}) => {
  const tabs = [{
    id: 'home',
    label: 'Explore',
    icon: 'home'
  }, {
    id: 'profile',
    label: 'Me',
    icon: 'user'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'var(--app-tabbar-bg)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--app-divider)',
      padding: '14px 48px 32px',
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, tabs.map(t => {
    const isActive = active === t.id;
    return /*#__PURE__*/React.createElement("button", {
      key: t.id,
      onClick: () => onChange(t.id),
      style: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        color: isActive ? '#FCA311' : 'var(--app-text-faint)'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: t.icon,
      size: 24
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        fontWeight: 900,
        letterSpacing: '0.12em',
        textTransform: 'uppercase'
      }
    }, t.label));
  }));
};
Object.assign(window, {
  SparkLogo,
  SparkButton,
  Eyebrow,
  InterestPill,
  LiveBadge,
  LiveDot,
  Tag,
  EventCard,
  CardIconButton,
  Icon,
  MetaRow,
  PhoneFrame,
  StatusBar,
  TabBar,
  ThemeContext,
  APP_THEME_VARS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile-app/Components.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile-app/FilterFinder.jsx
try { (() => {
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
const PRICE_PRESETS = [{
  id: 'free',
  label: 'Free',
  test: p => p === 0
}, {
  id: 'u10',
  label: 'Under $10',
  test: p => p < 10
}, {
  id: 'u20',
  label: 'Under $20',
  test: p => p < 20
}];

// days = [offsetFromToday_start, offsetFromToday_end]
const WHEN_PRESETS = [{
  id: 'today',
  label: 'Today',
  days: [0, 0]
}, {
  id: 'tom',
  label: 'Tomorrow',
  days: [1, 1]
}, {
  id: 'week',
  label: 'This week',
  days: [0, 6]
}];
const DIST_PRESETS = [{
  id: 'd5',
  label: 'Within 5 mi',
  mi: 5
}, {
  id: 'd10',
  label: 'Within 10 mi',
  mi: 10
}, {
  id: 'd25',
  label: 'Within 25 mi',
  mi: 25
}];

// --- Date helpers (local, YMD string compare) -------------------------------
const ffYMD = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const ffAddDays = n => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
};
const ffEventYMD = e => e.startISO ? ffYMD(new Date(e.startISO)) : null;
const ffInWhen = (e, w) => {
  const y = ffEventYMD(e);
  if (!y) return false;
  return y >= ffYMD(ffAddDays(w.days[0])) && y <= ffYMD(ffAddDays(w.days[1]));
};

// --- Matcher: EXACT substring against the visible label only ----------------
// A filter matches if-and-only-if its displayed label contains the typed text
// as a case-insensitive substring. No keywords, no synonyms, no fuzzy/edit
// distance. Results sort by where the match starts (prefix matches first).
function ffMatch(query, registry) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];
  return registry.map(f => {
    const at = f.label.toLowerCase().indexOf(q);
    return at >= 0 ? {
      f,
      at
    } : null;
  }).filter(Boolean).sort((a, b) => a.at - b.at || a.f.label.length - b.f.label.length);
}

// --- Presentational pieces --------------------------------------------------
// Label with ONLY the contiguous matched substring lifted into the spark accent.
const Highlight = ({
  text,
  query
}) => {
  const q = (query || '').trim();
  if (!q) return /*#__PURE__*/React.createElement("span", null, text);
  const at = text.toLowerCase().indexOf(q.toLowerCase());
  if (at < 0) return /*#__PURE__*/React.createElement("span", null, text);
  return /*#__PURE__*/React.createElement("span", null, text.slice(0, at), /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#FCA311',
      fontWeight: 900
    }
  }, text.slice(at, at + q.length)), text.slice(at + q.length));
};

// One match row: icon · highlighted name + "Type filter · N nearby" · Apply.
const FilterMatchRow = ({
  match,
  query,
  onApply
}) => {
  const {
    f
  } = match;
  return /*#__PURE__*/React.createElement("button", {
    onClick: onApply,
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 13,
      padding: '11px 12px',
      borderRadius: 14,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 11,
      flexShrink: 0,
      background: 'rgba(252,163,17,0.10)',
      border: '1px solid rgba(252,163,17,0.22)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: f.icon,
    size: 17,
    color: "#FCA311"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 800,
      fontSize: 15,
      color: '#fff',
      letterSpacing: '-0.01em'
    }
  }, /*#__PURE__*/React.createElement(Highlight, {
    text: f.label,
    query: query
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'rgba(238,240,255,0.50)',
      fontWeight: 600,
      marginTop: 2
    }
  }, f.type, " filter \xB7 ", f.count, " nearby")), /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 12,
      color: '#14213D',
      padding: '7px 12px',
      borderRadius: 9999,
      background: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)'
    }
  }, "Apply", /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#14213D",
    strokeWidth: "3",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M5 12h14M13 6l6 6-6 6"
  }))));
};

// Empty-state "Browse by Interest" tile.
const InterestTile = ({
  label,
  icon,
  onClick
}) => /*#__PURE__*/React.createElement("button", {
  onClick: onClick,
  style: {
    all: 'unset',
    boxSizing: 'border-box',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 15,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 18
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    width: 38,
    height: 38,
    borderRadius: 11,
    flexShrink: 0,
    background: 'rgba(252,163,17,0.10)',
    border: '1px solid rgba(252,163,17,0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
}, /*#__PURE__*/React.createElement(Icon, {
  name: icon,
  size: 16,
  color: "#FCA311"
})), /*#__PURE__*/React.createElement("span", {
  style: {
    fontFamily: 'Montserrat',
    fontWeight: 900,
    fontSize: 14,
    color: '#fff'
  }
}, label));

// Empty-state "Recent" chip — seeds the query.
const RecentChip = ({
  label,
  onClick
}) => /*#__PURE__*/React.createElement("button", {
  onClick: onClick,
  style: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 9999,
    padding: '8px 14px',
    cursor: 'pointer',
    color: 'rgba(238,240,255,0.78)',
    fontSize: 12.5,
    fontWeight: 700
  }
}, /*#__PURE__*/React.createElement(Icon, {
  name: "clock",
  size: 12,
  color: "rgba(238,240,255,0.45)"
}), label);

// Active non-interest filter, shown on the feed as a removable spark pill.
const ActiveFilterPill = ({
  label,
  onRemove
}) => /*#__PURE__*/React.createElement("span", {
  style: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    background: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
    color: '#14213D',
    fontFamily: 'Montserrat',
    fontWeight: 900,
    fontSize: 12.5,
    padding: '7px 8px 7px 13px',
    borderRadius: 9999
  }
}, label, /*#__PURE__*/React.createElement("button", {
  onClick: onRemove,
  "aria-label": `Remove ${label}`,
  style: {
    all: 'unset',
    cursor: 'pointer',
    width: 18,
    height: 18,
    borderRadius: 9999,
    background: 'rgba(20,33,61,0.22)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
}, /*#__PURE__*/React.createElement("svg", {
  width: "11",
  height: "11",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "#14213D",
  strokeWidth: "3",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M18 6 6 18M6 6l12 12"
}))));
Object.assign(window, {
  PRICE_PRESETS,
  WHEN_PRESETS,
  DIST_PRESETS,
  ffYMD,
  ffAddDays,
  ffEventYMD,
  ffInWhen,
  ffMatch,
  Highlight,
  FilterMatchRow,
  InterestTile,
  RecentChip,
  ActiveFilterPill
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile-app/FilterFinder.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile-app/Onboarding.jsx
try { (() => {
// Sparked — new-user onboarding flow.
// Three optional steps after signup: pick interests → block categories →
// confirm + feed preview. Picks shape the Explore feed downstream.
//
// Design note: deliberately NOT a clone of the reference mock. We lead with
// icon chips in the Sparked vocabulary, a single thin gradient progress rail,
// Montserrat display headers, and a real (filtered) feed preview on confirm.
// The spark gradient is reserved for selection state + the primary CTA only.

// Canonical interest set (mirrors INTERESTS in Screens.jsx) + an icon each.
const ONB_INTERESTS = [{
  id: 'Curbside',
  icon: 'pin'
}, {
  id: 'Markets',
  icon: 'store'
}, {
  id: 'Music',
  icon: 'mic'
}, {
  id: 'Art',
  icon: 'palette'
}, {
  id: 'Food',
  icon: 'food'
}, {
  id: 'Community',
  icon: 'users'
}, {
  id: 'Pop-Ups',
  icon: 'sparkles'
}, {
  id: 'Outdoors',
  icon: 'tent'
}, {
  id: 'Family',
  icon: 'heart'
}];
const ICON_FOR = ONB_INTERESTS.reduce((m, x) => (m[x.id] = x.icon, m), {});

// ---- Thin 3-segment progress rail -----------------------------------------
const StepRail = ({
  step
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    gap: 6,
    alignItems: 'center'
  }
}, [0, 1, 2].map(i => /*#__PURE__*/React.createElement("div", {
  key: i,
  style: {
    height: 4,
    borderRadius: 9999,
    flex: i === step ? 2.4 : 1,
    background: i <= step ? 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' : 'var(--app-card-border)',
    transition: 'all .3s ease'
  }
})));

// ---- A single selectable chip ----------------------------------------------
// mode: 'interest' (gold accent) | 'block' (coral accent). Both use a
// border-highlight treatment when selected (no heavy full-gradient fill).
const OnbChip = ({
  id,
  icon,
  selected,
  mode,
  onClick
}) => {
  const isBlock = mode === 'block';
  const accent = isBlock ? '#ff6348' : '#FCA311';
  const tint = isBlock ? 'rgba(255,99,72,0.10)' : 'rgba(252,163,17,0.10)';
  const tileBg = isBlock ? 'rgba(255,99,72,0.16)' : 'rgba(252,163,17,0.16)';
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '13px 14px',
      borderRadius: 18,
      border: `1.5px solid ${selected ? accent : 'var(--app-card-border)'}`,
      background: selected ? tint : 'rgba(255,255,255,0.04)',
      transition: 'background .15s ease, border-color .15s ease'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 28,
      height: 28,
      borderRadius: 9,
      flexShrink: 0,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: selected ? tileBg : 'var(--app-icon-chip-bg)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 15,
    color: selected ? accent : '#FCA311'
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 13,
      letterSpacing: '-0.01em',
      color: selected ? '#fff' : 'var(--app-text-muted)',
      // Selected chips reserve room for the filled bubble — truncate so the
      // label never slides under it. Unselected chips show the full word.
      ...(selected ? {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      } : null)
    }
  }, id), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 18,
      height: 18,
      borderRadius: 9999,
      flexShrink: 0,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: selected ? 'none' : '1.5px solid var(--app-border-strong)',
      background: selected ? accent : 'transparent'
    }
  }, selected && /*#__PURE__*/React.createElement(Icon, {
    name: isBlock ? 'minus' : 'check',
    size: 11,
    color: "#14213D"
  })));
};

// Shared scaffold: status bar, header, scrollable chip grid, pinned footer.
const OnbScaffold = ({
  step,
  eyebrow,
  title,
  sub,
  children,
  footer
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflowX: 'hidden'
  }
}, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement("div", {
  style: {
    padding: '4px 28px 0'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    marginBottom: 18
  }
}, /*#__PURE__*/React.createElement(SparkLogo, {
  size: 20
})), /*#__PURE__*/React.createElement(StepRail, {
  step: step
})), /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1,
    overflowY: 'auto',
    padding: '22px 24px 16px',
    boxSizing: 'border-box'
  }
}, /*#__PURE__*/React.createElement(Eyebrow, null, eyebrow), /*#__PURE__*/React.createElement("h1", {
  style: {
    fontFamily: 'Montserrat',
    fontSize: 30,
    fontWeight: 900,
    letterSpacing: '-0.02em',
    lineHeight: 1.05,
    margin: '10px 0 8px',
    color: 'var(--app-text)'
  }
}, title), /*#__PURE__*/React.createElement("p", {
  style: {
    fontSize: 14,
    lineHeight: 1.5,
    color: 'var(--app-text-muted)',
    margin: '0 0 22px',
    maxWidth: 320
  }
}, sub), children), /*#__PURE__*/React.createElement("div", {
  style: {
    flexShrink: 0,
    padding: '16px 24px 28px',
    borderTop: '1px solid var(--app-divider)',
    background: 'linear-gradient(to top, rgba(20,33,61,0.6), transparent)'
  }
}, footer));

// Full-width ghost (skip) button.
const GhostButton = ({
  children,
  onClick
}) => /*#__PURE__*/React.createElement("button", {
  onClick: onClick,
  style: {
    all: 'unset',
    boxSizing: 'border-box',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'center',
    padding: '12px 0',
    marginTop: 10,
    fontSize: 13,
    fontWeight: 800,
    color: 'var(--app-text-muted)'
  }
}, children);

// Full-width version of the spark primary button.
const PrimaryFull = ({
  children,
  icon,
  onClick
}) => /*#__PURE__*/React.createElement("button", {
  onClick: onClick,
  style: {
    all: 'unset',
    boxSizing: 'border-box',
    cursor: 'pointer',
    width: '100%',
    backgroundImage: 'linear-gradient(135deg,#ff5f4e 0%,#ff8c38 50%,#ffca3a 100%)',
    color: '#14213D',
    fontWeight: 900,
    fontSize: 15,
    whiteSpace: 'nowrap',
    padding: '16px 24px',
    borderRadius: 18,
    boxShadow: '0 8px 24px rgba(255,95,78,0.28)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9
  }
}, children, icon && /*#__PURE__*/React.createElement(Icon, {
  name: icon,
  size: 16,
  color: "#14213D"
}));

// ===========================================================================
// STEP 1 — What are you into?  (multi-select interests)
// ===========================================================================
const OnbInterestsScreen = ({
  value,
  onChange,
  onNext,
  onSkip
}) => {
  const toggle = id => onChange(value.includes(id) ? value.filter(x => x !== id) : [...value, id]);
  return /*#__PURE__*/React.createElement(OnbScaffold, {
    step: 0,
    eyebrow: "Step 1 of 3",
    title: "What are you into?",
    sub: "Pick everything that sounds like you \u2014 your feed will be tuned to match. You can change this anytime.",
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PrimaryFull, {
      icon: "thumbs-up",
      onClick: onNext
    }, "Looks good"), /*#__PURE__*/React.createElement(GhostButton, {
      onClick: onSkip
    }, "Skip for now"))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: 10
    }
  }, ONB_INTERESTS.map(it => /*#__PURE__*/React.createElement(OnbChip, {
    key: it.id,
    id: it.id,
    icon: it.icon,
    mode: "interest",
    selected: value.includes(it.id),
    onClick: () => toggle(it.id)
  }))));
};

// ===========================================================================
// STEP 2 — Anything to block?  (these categories are hidden from the feed)
// ===========================================================================
const OnbBlockScreen = ({
  value,
  onChange,
  interests,
  onNext,
  onSkip
}) => {
  const toggle = id => onChange(value.includes(id) ? value.filter(x => x !== id) : [...value, id]);
  // Anything picked as an interest is removed from the block list — you can't
  // block what you're into. (Also drop any stale blocks that are now interests.)
  const interestSet = new Set(interests);
  const list = ONB_INTERESTS.filter(it => !interestSet.has(it.id));
  React.useEffect(() => {
    if (value.some(id => interestSet.has(id))) {
      onChange(value.filter(id => !interestSet.has(id)));
    }
  }, [interests]);
  return /*#__PURE__*/React.createElement(OnbScaffold, {
    step: 1,
    eyebrow: "Step 2 of 3",
    title: "Anything to block?",
    sub: "These won't appear in your feed \u2014 handy for crowds or scenes that aren't your thing. Optional, and reversible.",
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PrimaryFull, {
      icon: "fire",
      onClick: onNext
    }, "Set up my feed"), /*#__PURE__*/React.createElement(GhostButton, {
      onClick: onSkip
    }, "No blocks, skip"))
  }, list.length > 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: 10
    }
  }, list.map(it => /*#__PURE__*/React.createElement(OnbChip, {
    key: it.id,
    id: it.id,
    icon: it.icon,
    mode: "block",
    selected: value.includes(it.id),
    onClick: () => toggle(it.id)
  }))) : /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '32px 20px',
      border: '1px dashed var(--app-border-strong)',
      borderRadius: 18,
      color: 'var(--app-text-muted)',
      fontSize: 13,
      lineHeight: 1.5,
      fontWeight: 600
    }
  }, "You're into all of them \u2014 nothing left to block. Tap \u201CSet up my feed\u201D to continue."), value.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      marginTop: 18,
      fontSize: 12,
      fontWeight: 800,
      color: '#ff8a72'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "ban",
    size: 13,
    color: "#ff8a72"
  }), value.length, " blocked \xB7 tap to toggle"));
};

// Mock "distance from you" per event id — lets the radius actually filter
// the preview so editing the radius visibly changes which events appear.
const EVENT_MILES = {
  1: 1.2,
  2: 3.8,
  3: 6.5,
  4: 12.0
};
const milesFor = e => EVENT_MILES[e.id] != null ? EVENT_MILES[e.id] : 9.9;

// A single preview row that slides in on mount. Animates TRANSFORM ONLY —
// opacity stays 1 so the resting state is always visible even if the
// animation is throttled (backgrounded tab). No JS-timer visibility gate,
// which previously left rows stuck at opacity:0 in throttled contexts.
const FeedRow = ({
  children
}) => /*#__PURE__*/React.createElement("div", {
  className: "onb-feed-row"
}, children);

// Inline-editable value with a dotted underline affordance.
const EditableField = ({
  editing,
  value,
  onStart,
  onChange,
  onCommit,
  width,
  suffix,
  numeric
}) => {
  if (editing) {
    return /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'baseline'
      }
    }, /*#__PURE__*/React.createElement("input", {
      autoFocus: true,
      type: "text",
      inputMode: numeric ? 'numeric' : 'text',
      value: value,
      onChange: e => onChange(numeric ? e.target.value.replace(/[^0-9]/g, '') : e.target.value),
      onBlur: onCommit,
      onKeyDown: e => {
        if (e.key === 'Enter') onCommit();
      },
      style: {
        width,
        background: 'rgba(252,163,17,0.12)',
        border: '1px solid rgba(252,163,17,0.45)',
        borderRadius: 8,
        padding: '2px 8px',
        color: '#FCA311',
        fontFamily: 'Inter',
        fontSize: 13.5,
        fontWeight: 800,
        outline: 'none',
        appearance: 'textfield',
        MozAppearance: 'textfield'
      }
    }), suffix && /*#__PURE__*/React.createElement("span", {
      style: {
        color: '#FCA311',
        fontWeight: 800
      }
    }, suffix));
  }
  return /*#__PURE__*/React.createElement("button", {
    onClick: onStart,
    style: {
      all: 'unset',
      cursor: 'pointer',
      color: '#FCA311',
      fontWeight: 800,
      borderBottom: '1.5px dotted rgba(252,163,17,0.6)',
      lineHeight: 1.2
    }
  }, value, suffix);
};

// ===========================================================================
// STEP 3 — Applying preferences. A transient page: the feed fills in by
// proximity while the header fades + collapses up, then it hands off to
// Explore (3–5s). Skippable, and tapping the location pauses the hand-off
// so the town / radius can be edited.
// ===========================================================================
const OnbConfirmScreen = ({
  interests,
  blocks,
  town = 'Phoenix',
  radius = 25,
  onTownChange,
  onRadiusChange,
  onStart,
  onBack
}) => {
  const blockedSet = new Set(blocks);
  const matches = SAMPLE_EVENTS.filter(e => !e.tags.some(t => blockedSet.has(t)));
  const hiddenByBlock = SAMPLE_EVENTS.filter(e => e.tags.some(t => blockedSet.has(t)));
  // Within the chosen radius, nearest first.
  const inRadius = matches.filter(e => milesFor(e) <= radius).sort((a, b) => milesFor(a) - milesFor(b));
  const [visibleCount, setVisibleCount] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [editing, setEditing] = React.useState(null); // 'town' | 'radius' | null
  const [tempTown, setTempTown] = React.useState(town);
  const [tempRadius, setTempRadius] = React.useState(String(radius));
  const onStartRef = React.useRef(onStart);
  onStartRef.current = onStart;
  const timers = React.useRef([]);
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // Auto-build + hand-off sequence (~4.2s). Cancelled if the user pauses
  // (e.g. taps the location to edit) — then they advance manually.
  React.useEffect(() => {
    if (paused) {
      clearTimers();
      return;
    }
    const T = (ms, fn) => timers.current.push(setTimeout(fn, ms));
    T(450, () => setVisibleCount(1));
    T(1100, () => setVisibleCount(2));
    T(1750, () => setVisibleCount(3));
    T(2400, () => setVisibleCount(4));
    T(4200, () => onStartRef.current && onStartRef.current());
    return clearTimers;
  }, [paused]);
  const pause = () => {
    if (!paused) setPaused(true);
  };
  const beginEditTown = () => {
    pause();
    setTempTown(town);
    setEditing('town');
  };
  const beginEditRadius = () => {
    pause();
    setTempRadius(String(radius));
    setEditing('radius');
  };
  const commitTown = () => {
    const v = (tempTown || '').trim();
    if (v && onTownChange) onTownChange(v);
    setEditing(null);
  };
  const commitRadius = () => {
    let nVal = parseInt(tempRadius, 10);
    if (isNaN(nVal)) nVal = radius;
    nVal = Math.max(1, Math.min(100, nVal));
    if (onRadiusChange) onRadiusChange(nVal);
    setEditing(null);
  };
  const shown = paused ? inRadius : inRadius.slice(0, visibleCount);
  const handOff = () => {
    clearTimers();
    onStartRef.current && onStartRef.current();
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px 28px 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(StepRail, {
    step: 2
  })), /*#__PURE__*/React.createElement("button", {
    onClick: handOff,
    style: {
      all: 'unset',
      cursor: 'pointer',
      marginLeft: 14,
      fontSize: 11,
      fontWeight: 900,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--app-text-faint)'
    }
  }, "Skip")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '8px 24px 16px',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '14px 0 18px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: 9999,
      margin: '0 auto 16px',
      background: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 12px 32px rgba(255,95,78,0.32)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fire",
    size: 30,
    color: "#14213D"
  })), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'Montserrat',
      fontSize: 25,
      fontWeight: 900,
      letterSpacing: '-0.02em',
      lineHeight: 1.1,
      margin: '0 0 12px',
      color: 'var(--app-text)'
    }
  }, "Your preferences", /*#__PURE__*/React.createElement("br", null), "are being applied"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      fontSize: 13.5,
      color: 'var(--app-text-muted)',
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "pin",
    size: 14,
    color: "#FCA311"
  }), /*#__PURE__*/React.createElement("span", null, "Near"), /*#__PURE__*/React.createElement(EditableField, {
    editing: editing === 'town',
    value: editing === 'town' ? tempTown : town,
    onStart: beginEditTown,
    onChange: setTempTown,
    onCommit: commitTown,
    width: 94
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--app-text-faint)'
    }
  }, "\u2022"), /*#__PURE__*/React.createElement(EditableField, {
    editing: editing === 'radius',
    value: editing === 'radius' ? tempRadius : radius,
    onStart: beginEditRadius,
    onChange: setTempRadius,
    onCommit: commitRadius,
    width: 44,
    suffix: "MI",
    numeric: true
  }))), interests.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "You're into"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 7,
      marginTop: 10
    }
  }, interests.map(id => /*#__PURE__*/React.createElement("span", {
    key: id,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '6px 12px',
      borderRadius: 9999,
      background: 'rgba(252,163,17,0.10)',
      border: '1px solid rgba(252,163,17,0.28)',
      fontSize: 12,
      fontWeight: 800,
      color: '#FCA311'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: ICON_FOR[id] || 'sparkles',
    size: 12,
    color: "#FCA311"
  }), id))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Your feed \xB7 preview"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 800,
      color: 'var(--app-text-faint)'
    }
  }, shown.length, " within ", radius, "MI")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, shown.map(e => /*#__PURE__*/React.createElement(FeedRow, {
    key: e.id
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 13,
      alignItems: 'center',
      padding: 12,
      minWidth: 0,
      background: 'var(--app-card-bg)',
      border: '1px solid var(--app-card-border)',
      borderRadius: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 52,
      height: 52,
      borderRadius: 13,
      background: e.gradient,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 14,
      color: 'var(--app-text)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, e.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--app-text-muted)',
      marginTop: 2,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, milesFor(e), " mi \xB7 ", e.location), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 5,
      marginTop: 6
    }
  }, e.tags.slice(0, 2).map(t => /*#__PURE__*/React.createElement("span", {
    key: t,
    style: {
      fontSize: 9,
      fontWeight: 900,
      letterSpacing: '0.10em',
      textTransform: 'uppercase',
      color: '#FCA311',
      background: 'rgba(252,163,17,0.12)',
      borderRadius: 6,
      padding: '2px 7px'
    }
  }, t))))))), (paused || visibleCount >= 3) && hiddenByBlock.slice(0, 1).map(e => /*#__PURE__*/React.createElement(FeedRow, {
    key: 'blk-' + e.id
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 13,
      alignItems: 'center',
      padding: 12,
      minWidth: 0,
      background: 'var(--app-card-bg)',
      border: '1px dashed var(--app-card-border)',
      borderRadius: 18,
      opacity: 0.55
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 52,
      height: 52,
      borderRadius: 13,
      background: 'var(--app-icon-chip-bg)',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "ban",
    size: 18,
    color: "rgba(255,138,114,0.8)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 14,
      color: 'var(--app-text-muted)'
    }
  }, "Blocked category hidden"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'rgba(255,138,114,0.85)',
      marginTop: 2
    }
  }, e.tags.filter(t => blockedSet.has(t)).join(', '), " \xB7 not shown in feed"))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      padding: '16px 24px 28px',
      borderTop: '1px solid var(--app-divider)',
      background: 'linear-gradient(to top, rgba(20,33,61,0.6), transparent)'
    }
  }, /*#__PURE__*/React.createElement(PrimaryFull, {
    icon: "arrow",
    onClick: handOff
  }, "Start exploring"), /*#__PURE__*/React.createElement(GhostButton, {
    onClick: onBack
  }, "Adjust my picks")));
};
Object.assign(window, {
  ONB_INTERESTS,
  ICON_FOR,
  EVENT_MILES,
  milesFor,
  OnbInterestsScreen,
  OnbBlockScreen,
  OnbConfirmScreen,
  OnbChip,
  StepRail,
  FeedRow,
  EditableField
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile-app/Onboarding.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile-app/Screens.jsx
try { (() => {
// Sparked screens - Landing, Explore feed, Event detail, Me (Saved / Workspace / Backstage).

// Real start timestamps so EventStub's countdown is accurate + live. Computed
// relative to "now" at load: today-relative for live events, day-offset for the rest.
function _todayPlusHoursISO(hrs) {
  return new Date(Date.now() + hrs * 3600000).toISOString();
}
function _futureISO(daysFromNow, h, m) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(h, m || 0, 0, 0);
  return d.toISOString();
}
const SAMPLE_EVENTS = [{
  id: 1,
  title: 'Art Walk Downtown',
  date: 'Today, May 8',
  time: '6:00 – 9:00pm',
  location: 'Downtown Arts District',
  tags: ['Art', 'Music', 'Community'],
  live: true,
  saved: true,
  gradient: 'linear-gradient(135deg,#5b3220,#a8551d 60%,#e09c3a)',
  photos: ['linear-gradient(135deg,#5b3220,#a8551d 60%,#e09c3a)', 'linear-gradient(160deg,#3a1f12,#8a4a22 55%,#ffb24d)', 'linear-gradient(120deg,#46271a,#b5642a 60%,#ffd56b)'],
  address: '215 E Roosevelt St, Phoenix, AZ 85004',
  desc: 'A curated stroll past 14 galleries, three live murals in progress, and four open-air sets from local artists. Ends with a community fire pit at the courtyard.',
  organizer: 'Downtown Arts Coalition',
  tier: 'Plus',
  rsvps: 84,
  startISO: _todayPlusHoursISO(4),
  price: 0,
  mi: 1.2,
  going: true
}, {
  id: 2,
  title: 'Saturday Farmers Market',
  date: 'Sat, May 10',
  time: '8:00am – 1:00pm',
  location: 'Roosevelt Park',
  tags: ['Markets', 'Food'],
  live: false,
  saved: false,
  gradient: 'linear-gradient(135deg,#1d4d2c,#3a8e5c 60%,#a8d68b)',
  address: '9802 N 7th St, Phoenix, AZ 85020',
  desc: '40+ vendors, 12 farms, live folk music, breakfast tacos, and a kids corner.',
  organizer: 'Roosevelt Park Association',
  tier: 'Standard',
  rsvps: 42,
  startISO: _futureISO(2, 8),
  price: 5,
  mi: 3.8
}, {
  id: 3,
  title: 'Sunset Songwriters Round',
  date: 'Fri, May 9',
  time: '7:30 – 10:00pm',
  location: 'The Rebel Lounge',
  tags: ['Music', 'Live'],
  live: false,
  saved: true,
  gradient: 'linear-gradient(135deg,#3a1a3e,#7a2a6a 60%,#ff8c38)',
  address: '1019 E Indian School Rd, Phoenix, AZ 85014',
  desc: 'Four local writers, one mic, no opening act. $12 cover at the door.',
  organizer: 'Rebel Lounge',
  tier: 'Standard',
  rsvps: 20,
  startISO: _futureISO(1, 19, 30),
  price: 12,
  mi: 6.5
}, {
  id: 4,
  title: 'Pop-Up Print Fair',
  date: 'Sun, May 11',
  time: '11:00am – 5:00pm',
  location: 'Phestival Warehouse',
  tags: ['Art', 'Markets', 'Pop-Ups'],
  live: false,
  saved: false,
  gradient: 'linear-gradient(135deg,#26384b,#5d7a98 60%,#ffca3a)',
  desc: '22 printmakers, screenprinting demos every hour, and a free poster for the first 100.',
  organizer: 'Print Society AZ',
  tier: 'Plus',
  rsvps: 31,
  startISO: _futureISO(3, 11),
  price: 0,
  mi: 12
},
// --- Farther-out events (beyond the 25mi default) — these surface ONLY in the
// search-results "Just past your radius" overflow; they never appear in the
// strict browse feed or in the finder's in-radius counts. ---
{
  id: 5,
  title: 'Gilbert Night Market',
  date: 'Fri, May 16',
  time: '5:00 – 10:00pm',
  location: 'Gilbert Heritage District',
  tags: ['Markets', 'Food'],
  live: false,
  saved: false,
  gradient: 'linear-gradient(135deg,#2a3a24,#5a7a3a 60%,#cfe08b)',
  address: '45 W Page Ave, Gilbert, AZ 85233',
  desc: 'Open-air night market: 60 makers, food trucks, and a beer garden.',
  organizer: 'Gilbert Maker Collective',
  tier: 'Standard',
  rsvps: 58,
  startISO: _futureISO(1, 17),
  price: 0,
  mi: 28
}, {
  id: 6,
  title: 'Cave Creek Pop-Up Market',
  date: 'Sun, May 18',
  time: '10:00am – 4:00pm',
  location: 'Cave Creek Town Center',
  tags: ['Markets', 'Pop-Ups', 'Art'],
  live: false,
  saved: false,
  gradient: 'linear-gradient(135deg,#4a2f1a,#9c5a28 60%,#ffca3a)',
  address: '6140 E Cave Creek Rd, Cave Creek, AZ 85331',
  desc: 'A roaming maker market: ceramics, leather, and desert botanicals.',
  organizer: 'Desert Makers Guild',
  tier: 'Plus',
  rsvps: 24,
  startISO: _futureISO(5, 10),
  price: 0,
  mi: 32
}, {
  id: 7,
  title: 'Desert Amphitheater Night',
  date: 'Sat, May 17',
  time: '7:00 – 11:00pm',
  location: 'Far East Mesa',
  tags: ['Music', 'Outdoors'],
  live: false,
  saved: false,
  gradient: 'linear-gradient(135deg,#2a1a3e,#6a2a7a 60%,#ff8c38)',
  address: '2700 N Ellsworth Rd, Mesa, AZ 85207',
  desc: 'Three touring acts under the stars, gates at 6. Lawn seating.',
  organizer: 'Mesa Live',
  tier: 'Plus',
  rsvps: 140,
  startISO: _futureISO(4, 19),
  price: 18,
  mi: 34
},
// --- Test fixtures for radius overflow (distances from zip 85001) ---
// In-radius (≤25mi): exercise the strict browse feed.
{
  id: 8,
  title: 'Riverside Food Trucks',
  date: 'Thu, May 15',
  time: '5:00 – 9:00pm',
  location: 'Rio Salado Riverfront',
  tags: ['Food'],
  live: false,
  saved: false,
  gradient: 'linear-gradient(135deg,#3a2a14,#9c7a28 60%,#ffd56b)',
  address: '80 W Rio Salado Pkwy, Tempe, AZ 85281',
  desc: 'A dozen food trucks along the water, plus live acoustic sets.',
  organizer: 'Valley Eats',
  tier: 'Standard',
  rsvps: 72,
  startISO: _futureISO(2, 17),
  price: 0,
  mi: 4
}, {
  id: 9,
  title: 'Indie Film Night',
  date: 'Wed, May 14',
  time: '7:30 – 10:00pm',
  location: 'Roosevelt Row Cinema',
  tags: ['Art'],
  live: false,
  saved: false,
  gradient: 'linear-gradient(135deg,#241a3a,#5a3a7a 60%,#c89bff)',
  address: '1212 N 2nd St, Phoenix, AZ 85004',
  desc: 'Four short films from local directors, Q&A after the screening.',
  organizer: 'Phoenix Film Co-op',
  tier: 'Plus',
  rsvps: 44,
  startISO: _futureISO(1, 19, 30),
  price: 8,
  mi: 18
},
// Just past radius (25–37.5mi): surface in the overflow section.
{
  id: 10,
  title: 'Desert Sky Music Fest',
  date: 'Sat, May 17',
  time: '4:00 – 11:00pm',
  location: 'North Scottsdale Fields',
  tags: ['Music'],
  live: false,
  saved: false,
  gradient: 'linear-gradient(135deg,#2a1a3e,#7a2a6a 60%,#ff8c38)',
  address: '17900 N Hayden Rd, Scottsdale, AZ 85255',
  desc: 'Two stages, eight acts, food and craft vendors all afternoon.',
  organizer: 'Desert Sky Presents',
  tier: 'Plus',
  rsvps: 210,
  startISO: _futureISO(4, 16),
  price: 25,
  mi: 31
}, {
  id: 11,
  title: 'Highlands Art Fair',
  date: 'Sun, May 18',
  time: '9:00am – 3:00pm',
  location: 'Anthem Community Park',
  tags: ['Art'],
  live: false,
  saved: false,
  gradient: 'linear-gradient(135deg,#3a1f12,#8a4a22 55%,#ffb24d)',
  address: '41703 N Gavilan Peak Pkwy, Anthem, AZ 85086',
  desc: 'Juried fine-art fair: painters, printmakers, and sculptors.',
  organizer: 'Highlands Arts Council',
  tier: 'Standard',
  rsvps: 63,
  startISO: _futureISO(5, 9),
  price: 0,
  mi: 34
}, {
  id: 12,
  title: 'Mountain Town Market',
  date: 'Sat, May 17',
  time: '8:00am – 1:00pm',
  location: 'Cave Creek Foothills',
  tags: ['Markets'],
  live: false,
  saved: false,
  gradient: 'linear-gradient(135deg,#2a3a24,#5a7a3a 60%,#cfe08b)',
  address: '6710 E Cave Creek Rd, Cave Creek, AZ 85331',
  desc: 'Foothills farmers market: produce, honey, and handmade goods.',
  organizer: 'Mountain Town Collective',
  tier: 'Standard',
  rsvps: 38,
  startISO: _futureISO(4, 8),
  price: 0,
  mi: 36
},
// Beyond expansion (>37.5mi): must never appear, even in overflow.
{
  id: 13,
  title: 'Far Valley Rodeo',
  date: 'Sat, May 17',
  time: '6:00 – 10:00pm',
  location: 'Wickenburg Arena',
  tags: ['Outdoors'],
  live: false,
  saved: false,
  gradient: 'linear-gradient(135deg,#3a2414,#8a5a28 60%,#e0a85a)',
  address: '935 Constellation Rd, Wickenburg, AZ 85390',
  desc: 'Bull riding, barrel racing, and a chuckwagon dinner.',
  organizer: 'Wickenburg Rodeo Assn',
  tier: 'Standard',
  rsvps: 95,
  startISO: _futureISO(4, 18),
  price: 15,
  mi: 52
}];

// Workspace listings include a past, locked event so the lock state is visible.
const ORGANIZER_LISTINGS = [{
  ...SAMPLE_EVENTS[0],
  past: false
}, {
  ...SAMPLE_EVENTS[1],
  past: false
}, {
  id: 99,
  title: 'First Friday · April',
  date: 'Fri, Apr 4',
  tier: 'Plus',
  past: true,
  rsvps: 312,
  gradient: 'linear-gradient(135deg,#1a2b4a,#3a5a8c 55%,#ff8c38)'
}];
const INTERESTS = ['Curbside', 'Markets', 'Music', 'Art', 'Food', 'Community', 'Pop-Ups', 'Outdoors', 'Family'];

// Workspaces the signed-in host belongs to. One seeded by default — so the
// multi-workspace picker stays dormant and Workspace opens straight in. Stats
// mirror the Workspace surface (live · RSVPs · reach). A non-host has zero.
const WORKSPACES = [{
  id: 'ws_aurora',
  name: 'Aurora Collective',
  initials: 'AC',
  gradient: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
  live: 2,
  rsvps: 146,
  reach: '2.1k',
  // Public-profile fields — consumer-facing only, nothing tier/economics related.
  bio: 'Independent arts programming for downtown Phoenix — markets, walks, and late-night sets.',
  location: 'Phoenix, AZ',
  website: 'auroracollective.co',
  socials: {
    instagram: '@auroracollective',
    twitter: '@auroracollective',
    facebook: 'Aurora Collective'
  },
  eventIds: [1, 2],
  pastEvents: [{
    id: 'ws_past_1',
    title: 'First Friday · April',
    time: '6:00 – 10:00pm',
    location: 'Downtown Arts District',
    tags: ['Art', 'Music'],
    gradient: 'linear-gradient(135deg,#1a2b4a,#3a5a8c 55%,#ff8c38)',
    rsvps: 312,
    price: 0,
    startISO: _futureISO(-40, 18)
  }, {
    id: 'ws_past_2',
    title: 'Winter Night Market',
    time: '5:00 – 9:00pm',
    location: 'Roosevelt Park',
    tags: ['Markets', 'Community'],
    gradient: 'linear-gradient(135deg,#2b1a3a,#6a3a8c 55%,#ffca3a)',
    rsvps: 198,
    price: 0,
    startISO: _futureISO(-96, 17)
  }]
}];
const _wsStatLine = ws => `${ws.live} live · ${ws.rsvps} RSVPs · ${ws.reach} reach`;

// Local YYYY-MM-DD (matches the codebase's getLocalYYYYMMDD utility)
const todayLocalYMD = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Brand-styled <input type="date"> pill. Native picker on tap — the right
// pattern for mobile. Mirrors the desktop ExploreDateAndViewControls layout:
// two date inputs separated by an arrow, both default to today.
const DateInputPill = ({
  value,
  onChange,
  ariaLabel
}) => /*#__PURE__*/React.createElement("label", {
  style: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: 'var(--app-card-bg)',
    border: '1px solid var(--app-card-border)',
    borderRadius: 12,
    padding: '8px 10px',
    cursor: 'pointer',
    flex: 1,
    minWidth: 0
  }
}, /*#__PURE__*/React.createElement(Icon, {
  name: "cal",
  size: 13,
  color: "#F7B731"
}), /*#__PURE__*/React.createElement("input", {
  type: "date",
  value: value,
  "aria-label": ariaLabel,
  onChange: e => onChange(e.target.value),
  style: {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    padding: 0,
    color: 'var(--app-text)',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 700,
    colorScheme: 'dark',
    width: '100%',
    minWidth: 0,
    appearance: 'none',
    WebkitAppearance: 'none'
  }
}));

// Date-range bar — twin date inputs with arrow between, plus ZIP attribution.
// Recreates the desktop's date-and-view controls pattern in mobile form.
const DateRangeBar = ({
  start,
  end,
  onStartChange,
  onEndChange,
  zip = '85001',
  onZipChange,
  radius = 25,
  onRadiusChange
}) => {
  const [editing, setEditing] = React.useState(null); // 'zip' | 'radius' | null
  const [tempZip, setTempZip] = React.useState(zip);
  const [tempRadius, setTempRadius] = React.useState(String(radius));
  const beginZip = () => {
    setTempZip(zip);
    setEditing('zip');
  };
  const beginRadius = () => {
    setTempRadius(String(radius));
    setEditing('radius');
  };
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
    background: 'rgba(247,183,49,0.14)',
    border: '1px solid rgba(247,183,49,0.45)',
    borderRadius: 6,
    padding: '1px 5px',
    color: '#F7B731',
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: '0.10em',
    fontFamily: 'inherit',
    outline: 'none',
    appearance: 'textfield',
    MozAppearance: 'textfield'
  };
  const editLink = {
    all: 'unset',
    cursor: 'pointer',
    color: '#F7B731',
    letterSpacing: '0.10em',
    borderBottom: '1.5px dotted rgba(247,183,49,0.55)',
    lineHeight: 1.15
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: 6,
      borderRadius: 16,
      background: 'var(--app-card-bg)',
      border: '1px solid var(--app-card-border)'
    }
  }, /*#__PURE__*/React.createElement(DateInputPill, {
    value: start,
    onChange: onStartChange,
    ariaLabel: "Start date"
  }), /*#__PURE__*/React.createElement(Icon, {
    name: "arrow",
    size: 14,
    color: "var(--app-text-faint)"
  }), /*#__PURE__*/React.createElement(DateInputPill, {
    value: end,
    onChange: onEndChange,
    ariaLabel: "End date"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '0 6px',
      fontSize: 10,
      fontWeight: 900,
      letterSpacing: '0.22em',
      textTransform: 'uppercase',
      color: 'var(--app-text-faint)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "pin",
    size: 10,
    color: "#F7B731"
  }), /*#__PURE__*/React.createElement("span", null, "Showing events near"), editing === 'zip' ? /*#__PURE__*/React.createElement("input", {
    autoFocus: true,
    type: "text",
    inputMode: "numeric",
    maxLength: 5,
    value: tempZip,
    onChange: e => setTempZip(e.target.value.replace(/[^0-9]/g, '').slice(0, 5)),
    onBlur: commitZip,
    onKeyDown: e => {
      if (e.key === 'Enter') commitZip();
    },
    style: {
      ...editInput,
      width: 50
    }
  }) : /*#__PURE__*/React.createElement("button", {
    onClick: beginZip,
    style: editLink
  }, zip), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'rgba(247,183,49,0.55)'
    }
  }, "\u2022"), editing === 'radius' ? /*#__PURE__*/React.createElement("input", {
    autoFocus: true,
    type: "text",
    inputMode: "numeric",
    maxLength: 3,
    value: tempRadius,
    onChange: e => setTempRadius(e.target.value.replace(/[^0-9]/g, '').slice(0, 3)),
    onBlur: commitRadius,
    onKeyDown: e => {
      if (e.key === 'Enter') commitRadius();
    },
    style: {
      ...editInput,
      width: 36
    }
  }) : /*#__PURE__*/React.createElement("button", {
    onClick: beginRadius,
    style: editLink
  }, radius, "MI")));
};

// YYYY-MM-DD for the coming Sunday (never same-day; Sundays get +7).
const getNextSunday = () => {
  const d = new Date();
  const offset = 7 - d.getDay() || 7;
  const sun = new Date(d.getTime() + offset * 86400000);
  return `${sun.getFullYear()}-${String(sun.getMonth() + 1).padStart(2, '0')}-${String(sun.getDate()).padStart(2, '0')}`;
};

// Interest id → Icon name (mirrors ONB_INTERESTS from Onboarding.jsx).
const INTEREST_ICON_MAP = {
  Curbside: 'pin',
  Markets: 'store',
  Music: 'mic',
  Art: 'palette',
  Food: 'sparkles',
  Community: 'heart',
  'Pop-Ups': 'sparkles',
  Outdoors: 'tent',
  Family: 'heart'
};
const LandingScreen = ({
  onSignup,
  onBrowse,
  onBrowseToday,
  onBrowseWithInterest,
  onLogin,
  onPricing,
  onEventTap
}) => {
  // Shuffle interests randomly on every mount so the pill order varies each visit.
  const shuffled = React.useMemo(() => [...INTERESTS].sort(() => Math.random() - 0.5), []);
  const preview = SAMPLE_EVENTS[0];
  // Editable location (mirrors the Feed Ready screen). Defaults Phoenix / 25MI.
  const [town, setTown] = React.useState('Phoenix');
  const [radius, setRadius] = React.useState(25);
  const [editing, setEditing] = React.useState(null); // 'town' | 'radius' | null
  const [tempTown, setTempTown] = React.useState('Phoenix');
  const [tempRadius, setTempRadius] = React.useState('25');
  const beginEditTown = () => {
    setTempTown(town);
    setEditing('town');
  };
  const beginEditRadius = () => {
    setTempRadius(String(radius));
    setEditing('radius');
  };
  const commitTown = () => {
    const v = (tempTown || '').trim();
    if (v) setTown(v);
    setEditing(null);
  };
  const commitRadius = () => {
    let n = parseInt(tempRadius, 10);
    if (isNaN(n)) n = radius;
    n = Math.max(1, Math.min(100, n));
    setRadius(n);
    setEditing(null);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: -50,
      left: -70,
      width: 270,
      height: 270,
      borderRadius: '50%',
      background: 'rgba(255,99,72,0.22)',
      filter: 'blur(80px)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 80,
      right: -70,
      width: 220,
      height: 220,
      borderRadius: '50%',
      background: 'rgba(247,183,49,0.13)',
      filter: 'blur(75px)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '4px 20px 10px',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(SparkLogo, {
    size: 24
  }), /*#__PURE__*/React.createElement("button", {
    onClick: onLogin,
    style: {
      background: 'none',
      border: '1px solid var(--app-border-strong)',
      borderRadius: 9999,
      padding: '7px 16px',
      color: 'var(--app-text-muted)',
      fontSize: 12,
      fontWeight: 800,
      cursor: 'pointer',
      letterSpacing: '0.02em'
    }
  }, "Log In")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 20px 12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      fontSize: 13.5,
      color: 'var(--app-text-muted)',
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "pin",
    size: 14,
    color: "#FCA311"
  }), /*#__PURE__*/React.createElement("span", null, "Near"), /*#__PURE__*/React.createElement(EditableField, {
    editing: editing === 'town',
    value: editing === 'town' ? tempTown : town,
    onStart: beginEditTown,
    onChange: setTempTown,
    onCommit: commitTown,
    width: 94
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'rgba(252,163,17,0.7)',
      fontWeight: 800
    }
  }, "\u2022"), /*#__PURE__*/React.createElement(EditableField, {
    editing: editing === 'radius',
    value: editing === 'radius' ? tempRadius : radius,
    onStart: beginEditRadius,
    onChange: setTempRadius,
    onCommit: commitRadius,
    width: 44,
    suffix: "MI",
    numeric: true
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      overflowX: 'auto',
      scrollbarWidth: 'none',
      padding: '0 0 16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      padding: '0 20px',
      width: 'max-content'
    }
  }, shuffled.map(id => /*#__PURE__*/React.createElement("button", {
    key: id,
    onClick: () => onBrowseWithInterest && onBrowseWithInterest(id),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      background: 'var(--app-icon-chip-bg)',
      border: '1px solid var(--app-card-border)',
      borderRadius: 9999,
      padding: '7px 14px',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      color: 'var(--app-text-muted)',
      fontSize: 12,
      fontWeight: 800,
      transition: 'background .15s ease, border-color .15s ease'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: INTEREST_ICON_MAP[id] || 'sparkles',
    size: 12,
    color: "#FCA311"
  }), id)))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 24px',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 50,
      letterSpacing: '-0.02em',
      lineHeight: 0.92,
      margin: '0 0 18px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      color: 'var(--app-text)'
    }
  }, "YOUR CITY."), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    }
  }, "YOUR"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    }
  }, "EVENTS."), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      color: 'var(--app-text-hint)'
    }
  }, "NO"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      color: 'var(--app-text-hint)'
    }
  }, "ALGORITHM.")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: 'var(--app-text-muted)',
      lineHeight: 1.55,
      margin: '0 0 24px',
      maxWidth: 290
    }
  }, "Sparked helps you discover and publish local events by distance, not by feed.")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'linear-gradient(160deg, rgba(255,95,78,0.20) 0%, rgba(255,140,56,0.11) 38%, rgba(255,255,255,0.03) 78%)',
      borderRadius: 22,
      padding: 20,
      border: '1px solid rgba(252,163,17,0.35)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      marginBottom: 8,
      flexWrap: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "pin",
    size: 11,
    color: "#FCA311"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 900,
      textTransform: 'uppercase',
      letterSpacing: '0.20em',
      color: '#FCA311',
      whiteSpace: 'nowrap'
    }
  }, "Going out")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 20,
      color: 'var(--app-text)',
      letterSpacing: '-0.01em',
      lineHeight: 1.15,
      marginBottom: 8
    }
  }, "Find something tonight"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: 'var(--app-text-muted)',
      margin: '0 0 16px',
      lineHeight: 1.5
    }
  }, "Real events near you, ranked by distance. No account needed to look."), /*#__PURE__*/React.createElement("button", {
    onClick: onBrowseToday,
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      width: '100%',
      background: '#fff',
      borderRadius: 14,
      padding: '13px 18px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#14213D',
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 14,
      letterSpacing: '-0.01em',
      boxShadow: '0 6px 20px rgba(0,0,0,0.25)'
    }
  }, "Browse Local Events"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      textAlign: 'center',
      fontSize: 10,
      color: 'var(--app-text-hint)',
      fontWeight: 700,
      letterSpacing: '0.08em'
    }
  }, "No login \xB7 no algorithm \xB7 just what's near you")), /*#__PURE__*/React.createElement("button", {
    onClick: onBrowseToday,
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      width: '100%',
      background: 'var(--app-icon-chip-bg)',
      border: '1px solid var(--app-card-border)',
      borderRadius: 16,
      padding: '13px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(LiveDot, {
    size: 8
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 12.5,
      fontWeight: 800,
      color: 'var(--app-text)'
    }
  }, SAMPLE_EVENTS.length, " events near Phoenix right now"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 11,
      color: 'var(--app-text-muted)',
      marginTop: 2,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, "Closest: ", preview.title, " \xB7 1.2 mi \xB7 tonight")), /*#__PURE__*/React.createElement(Icon, {
    name: "chev-right",
    size: 15,
    color: "var(--app-text-faint)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--app-card-bg)',
      borderRadius: 22,
      padding: 20,
      border: '1px solid var(--app-card-border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      marginBottom: 8,
      flexWrap: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkles",
    size: 11,
    color: "#FCA311"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 900,
      textTransform: 'uppercase',
      letterSpacing: '0.20em',
      color: '#FCA311',
      whiteSpace: 'nowrap'
    }
  }, "Hosting something")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 20,
      color: 'var(--app-text)',
      letterSpacing: '-0.01em',
      lineHeight: 1.15,
      marginBottom: 8
    }
  }, "Put your event on the map"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: 'var(--app-text-muted)',
      margin: '0 0 16px',
      lineHeight: 1.5
    }
  }, "Publish in minutes and reach the neighborhood around your venue."), /*#__PURE__*/React.createElement("button", {
    onClick: onSignup,
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      width: '100%',
      background: '#fff',
      borderRadius: 14,
      padding: '13px 18px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#14213D',
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 14,
      letterSpacing: '-0.01em',
      boxShadow: '0 6px 20px rgba(0,0,0,0.25)'
    }
  }, "List Your First Event"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 20px 0'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onEventTap && onEventTap(preview),
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      width: '100%',
      background: 'var(--app-card-bg)',
      border: '1px solid var(--app-card-border)',
      borderRadius: 20,
      padding: 16,
      display: 'block'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: 'rgba(252,163,17,0.12)',
      border: '1px solid rgba(252,163,17,0.28)',
      borderRadius: 9999,
      padding: '4px 10px',
      fontSize: 9,
      fontWeight: 900,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: '#FCA311'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fire",
    size: 9,
    color: "#FCA311"
  }), " Tue \xB7 Tonight"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 900,
      color: 'var(--app-text-muted)'
    }
  }, "1.2 mi")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 18,
      color: 'var(--app-text)',
      letterSpacing: '-0.01em',
      marginBottom: 8
    }
  }, preview.title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      fontSize: 12,
      color: 'var(--app-text-muted)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "clock",
    size: 12,
    color: "var(--app-text-faint)"
  }), preview.time), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      fontSize: 12,
      color: 'var(--app-text-muted)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "pin",
    size: 12,
    color: "var(--app-text-faint)"
  }), preview.location)))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '36px 24px 0',
      marginTop: 16,
      position: 'relative',
      paddingTop: '44px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '1px',
      background: 'linear-gradient(90deg, transparent 0%, rgba(252,163,17,0.50) 50%, transparent 100%)'
    }
  }), /*#__PURE__*/React.createElement(Eyebrow, null, "About Sparked"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 26,
      letterSpacing: '-0.02em',
      lineHeight: 1.1,
      margin: '10px 0 14px',
      color: 'var(--app-text)'
    }
  }, "Built for local discovery,", /*#__PURE__*/React.createElement("br", null), "not", ' ', /*#__PURE__*/React.createElement("span", {
    style: {
      backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    }
  }, "feed fatigue.")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13.5,
      color: 'var(--app-text-muted)',
      lineHeight: 1.6,
      margin: '0 0 24px'
    }
  }, "Organizers, local businesses, and neighbors publish quickly \u2014 and attendees browse what's actually near them without fighting an engagement algorithm.")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--app-card-bg)',
      border: '1.5px solid rgba(252,163,17,0.40)',
      borderRadius: 22,
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 42,
      height: 42,
      borderRadius: 13,
      marginBottom: 14,
      background: 'rgba(252,163,17,0.10)',
      border: '1px solid rgba(252,163,17,0.22)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 20,
    color: "#FCA311"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 18,
      color: 'var(--app-text)',
      letterSpacing: '-0.01em',
      marginBottom: 12
    }
  }, "Event Browsing"), ["Events ranked by distance — what's nearby shows first", 'Filter by category, date, and radius', 'No login required to browse'].map(item => /*#__PURE__*/React.createElement("div", {
    key: item,
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 13,
    color: "#FCA311"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--app-text-muted)',
      lineHeight: 1.4
    }
  }, item)))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--app-card-bg)',
      border: '1.5px solid rgba(252,163,17,0.40)',
      borderRadius: 22,
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 42,
      height: 42,
      borderRadius: 13,
      marginBottom: 14,
      background: 'rgba(252,163,17,0.10)',
      border: '1px solid rgba(252,163,17,0.22)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "ticket",
    size: 20,
    color: "#FCA311"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 18,
      color: 'var(--app-text)',
      letterSpacing: '-0.01em',
      marginBottom: 12
    }
  }, "Event Hosting"), ['Publish your event in minutes — no design skills needed', 'Every listing gets a clean, linkable event page', 'Share to social, email, or embed on your website'].map(item => /*#__PURE__*/React.createElement("div", {
    key: item,
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 13,
    color: "#FCA311"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--app-text-muted)',
      lineHeight: 1.4
    }
  }, item))), /*#__PURE__*/React.createElement("button", {
    onClick: onPricing,
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      width: '100%',
      marginTop: 8,
      background: 'var(--app-card-bg)',
      border: '1px solid var(--app-card-border)',
      borderRadius: 14,
      padding: '13px 18px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      color: 'var(--app-text)',
      fontWeight: 800,
      fontSize: 14
    }
  }, "See plans & pricing", /*#__PURE__*/React.createElement(Icon, {
    name: "chev-right",
    size: 15,
    color: "#FCA311"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '36px 24px 44px',
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(SparkLogo, {
    size: 18
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11,
      color: 'var(--app-text-hint)',
      lineHeight: 1.7,
      margin: 0
    }
  }, "By continuing you agree to our", ' ', /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--app-text-muted)',
      textDecoration: 'underline',
      cursor: 'pointer'
    }
  }, "Terms of Service"), ' ', "and", ' ', /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--app-text-muted)',
      textDecoration: 'underline',
      cursor: 'pointer'
    }
  }, "Privacy Policy"), ". I confirm I am at least 13 years old."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 10,
      color: 'var(--app-text-hint)',
      margin: '8px 0 0'
    }
  }, "\xA9 2026 Sparked. All rights reserved.")));
};

// Three browsing modes for the Explore screen: list, map, time-ranked.
const VIEW_LABELS = {
  list: 'This week · 4 events',
  map: 'Near you · 4 pins',
  time: 'Time-ranked · 4 events'
};
const ViewSwitcher = ({
  value,
  onChange
}) => {
  const options = [{
    id: 'list',
    icon: 'list'
  }, {
    id: 'map',
    icon: 'map'
  }, {
    id: 'time',
    icon: 'clock'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      gap: 6,
      padding: 6,
      borderRadius: 14,
      background: 'var(--app-tabbar-bg)',
      border: '1px solid var(--app-card-border)',
      backdropFilter: 'blur(8px)'
    }
  }, options.map(o => {
    const isActive = value === o.id;
    return /*#__PURE__*/React.createElement("button", {
      key: o.id,
      onClick: () => onChange(o.id),
      "aria-label": o.id,
      style: {
        width: 36,
        height: 32,
        borderRadius: 10,
        border: 'none',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isActive ? 'linear-gradient(135deg,#ffca3a 0%,#FCA311 100%)' : 'transparent',
        boxShadow: isActive ? '0 4px 14px rgba(252,163,17,0.35)' : 'none',
        transition: 'background .2s ease, box-shadow .2s ease'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: o.icon,
      size: 16,
      color: isActive ? '#14213D' : 'var(--app-text-muted)'
    }));
  }));
};

// Compact row for the time-ranked view — time leads, then title + location.
const TimeRow = ({
  event,
  onTap
}) => /*#__PURE__*/React.createElement("div", {
  onClick: onTap,
  style: {
    display: 'flex',
    gap: 14,
    alignItems: 'center',
    cursor: 'pointer',
    padding: '12px 14px',
    background: 'var(--app-card-bg)',
    border: '1px solid var(--app-card-border)',
    borderRadius: 20
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    width: 56,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,99,72,0.10)',
    border: '1px solid rgba(255,99,72,0.25)',
    borderRadius: 14,
    padding: '8px 4px'
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    fontFamily: 'Montserrat',
    fontSize: 18,
    fontWeight: 900,
    color: '#ff6348',
    lineHeight: 1
  }
}, event.time.split(' ')[0].replace(/[^0-9:apm]/gi, '').replace(':00', '')), /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 9,
    fontWeight: 900,
    color: 'rgba(255,99,72,0.85)',
    textTransform: 'uppercase',
    letterSpacing: '0.18em',
    marginTop: 2
  }
}, event.time.toLowerCase().includes('am') ? 'AM' : 'PM')), /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1,
    minWidth: 0
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    fontFamily: 'Montserrat',
    fontWeight: 900,
    color: 'var(--app-text)',
    fontSize: 15,
    lineHeight: 1.15
  }
}, event.title), event.live && /*#__PURE__*/React.createElement(LiveDot, {
  size: 7
})), /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 12,
    color: 'var(--app-text-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: 6
  }
}, /*#__PURE__*/React.createElement(Icon, {
  name: "pin",
  size: 11,
  color: "#FCA311"
}), event.location)), /*#__PURE__*/React.createElement("div", {
  style: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: event.gradient,
    flexShrink: 0
  }
}));

// Time-ranked view — groups events into temporal buckets.
const TimeView = ({
  events,
  onSelect
}) => {
  const groups = [{
    label: 'Happening now',
    items: events.filter(e => e.live)
  }, {
    label: 'Later tonight',
    items: events.filter(e => /tonight|today/i.test(e.date) && !e.live)
  }, {
    label: 'This weekend',
    items: events.filter(e => /sat|sun/i.test(e.date))
  }, {
    label: 'Next week',
    items: events.filter(e => /^fri|fri,/i.test(e.date) && !/this/i.test(e.date))
  }].filter(g => g.items.length);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 22
    }
  }, groups.map(g => /*#__PURE__*/React.createElement("div", {
    key: g.label
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, g.label), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 1,
      background: 'linear-gradient(to right, rgba(252,163,17,0.30), transparent)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: 'var(--app-text-faint)'
    }
  }, g.items.length)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, g.items.map(e => /*#__PURE__*/React.createElement(TimeRow, {
    key: e.id,
    event: e,
    onTap: () => onSelect(e)
  }))))));
};

// Map view — stylized navy map with gradient pins and a sheet of nearby events.
const MapView = ({
  events,
  onSelect
}) => {
  // Hand-placed pin positions so the layout looks intentional.
  const pins = [{
    x: '28%',
    y: '22%'
  }, {
    x: '64%',
    y: '34%'
  }, {
    x: '42%',
    y: '58%'
  }, {
    x: '74%',
    y: '70%'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      borderRadius: 24,
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.08)',
      background: '#0c1528',
      boxShadow: '0 4px 24px rgba(0,0,0,0.30)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 320,
      backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(255,99,72,0.12), transparent 50%),' + 'radial-gradient(circle at 75% 70%, rgba(247,183,49,0.10), transparent 55%),' + 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),' + 'linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
      backgroundSize: 'auto, auto, 32px 32px, 32px 32px'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "100%",
    height: "100%",
    viewBox: "0 0 100 100",
    preserveAspectRatio: "none",
    style: {
      position: 'absolute',
      inset: 0,
      opacity: 0.18
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M0,55 Q40,40 60,55 T100,50",
    stroke: "white",
    strokeWidth: "0.6",
    fill: "none"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M30,0 Q35,40 25,70 T20,100",
    stroke: "white",
    strokeWidth: "0.4",
    fill: "none"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M65,0 Q70,30 80,55 T85,100",
    stroke: "white",
    strokeWidth: "0.4",
    fill: "none"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%,-50%)',
      width: 14,
      height: 14,
      borderRadius: 9999,
      background: '#3a86ff',
      boxShadow: '0 0 0 6px rgba(58,134,255,0.20), 0 0 0 14px rgba(58,134,255,0.08)'
    }
  }), events.map((e, i) => {
    const pos = pins[i % pins.length];
    return /*#__PURE__*/React.createElement("button", {
      key: e.id,
      onClick: () => onSelect(e),
      style: {
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        transform: 'translate(-50%,-100%)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 32,
        height: 32,
        borderRadius: '50% 50% 50% 0',
        transform: 'rotate(-45deg)',
        backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
        boxShadow: '0 4px 14px rgba(255,99,72,0.45)',
        border: '2px solid rgba(255,255,255,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, e.live && /*#__PURE__*/React.createElement("span", {
      style: {
        transform: 'rotate(45deg)',
        display: 'inline-flex'
      }
    }, /*#__PURE__*/React.createElement(LiveDot, {
      size: 7
    }))));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(15,26,48,0.75)',
      backdropFilter: 'blur(10px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 56,
      height: 56,
      borderRadius: 14,
      background: events[0].gradient,
      flexShrink: 0,
      position: 'relative'
    }
  }, events[0].live && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 6,
      right: 6
    }
  }, /*#__PURE__*/React.createElement(LiveDot, {
    size: 7
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      color: '#fff',
      fontSize: 14
    }
  }, events[0].title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'rgba(238,240,255,0.55)',
      marginTop: 2
    }
  }, events[0].location)), /*#__PURE__*/React.createElement("button", {
    onClick: () => onSelect(events[0]),
    style: {
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.10)',
      color: '#FCA311',
      fontWeight: 900,
      fontSize: 11,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      padding: '8px 12px',
      borderRadius: 10,
      cursor: 'pointer'
    }
  }, "View \u2192")));
};

// Recents seed the finder query — filter terms, not event names (MVP is a
// filter finder, so recents are filters you reached for before).
const FINDER_RECENTS = ['Free', 'Music', 'This week', 'Within 5 mi'];
// Interest tiles shown in the empty state (those with events nearby).
const FINDER_TILES = ['Markets', 'Music', 'Art', 'Food'];
const ExploreScreen = ({
  onSelect,
  onCreate,
  onTab,
  initialInterests,
  initialStart,
  initialEnd,
  initialRadius,
  initialZip,
  blocked = [],
  userEvents = []
}) => {
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
  const [whenLabel, setWhenLabel] = React.useState(null); // applied When preset label | null
  const [distLabel, setDistLabel] = React.useState(null); // applied Distance preset label | null
  // A finder "Apply" opens a DISTINCT search-results view (separate from the
  // browse feed). null = browsing; otherwise { type, label, test, effRadius }.
  const [searchResult, setSearchResult] = React.useState(null);
  const toggle = i => setActive(a => a.includes(i) ? a.filter(x => x !== i) : [...a, i]);

  // Blocked categories never appear in the feed (set in onboarding).
  const blockedSet = new Set(blocked);
  const base = SAMPLE_EVENTS.filter(e => !e.tags.some(t => blockedSet.has(t)));
  const within = (e, miMax) => e.mi == null || e.mi <= miMax;
  const closeSearch = () => {
    setSearchOpen(false);
    setQ('');
  };

  // --- Apply actions: a finder match opens the DISTINCT search-results view.
  // The browse feed's own filter state is intentionally NOT touched, so
  // browsing stays strictly in-radius. effRadius drives the overflow math:
  // the user's preferred radius for most filters, the chosen mileage for a
  // Distance filter. ---
  const openResult = sr => {
    setSearchResult(sr);
    closeSearch();
  };
  const applyInterest = i => openResult({
    type: 'Interest',
    label: i,
    test: e => e.tags.includes(i),
    effRadius: radius
  });
  const applyPrice = p => openResult({
    type: 'Price',
    label: p.label,
    test: e => p.test(e.price),
    effRadius: radius
  });
  const applyWhen = w => openResult({
    type: 'When',
    label: w.label,
    test: e => ffInWhen(e, w),
    effRadius: radius
  });
  const applyDist = d => openResult({
    type: 'Distance',
    label: d.label,
    test: () => true,
    effRadius: d.mi
  });

  // --- Filter registry: label + type + icon + live count + apply-action ------
  // Adding a filter here makes it instantly searchable. Every `count` is
  // computed LIVE from the current event list — the number of events that
  // would remain if this filter were applied (honoring the active radius).
  const registry = [...INTERESTS.map(i => ({
    id: 'int-' + i,
    type: 'Interest',
    label: i,
    icon: INTEREST_ICON_MAP[i] || 'store',
    count: base.filter(e => e.tags.includes(i) && within(e, radius)).length,
    apply: () => applyInterest(i)
  })), ...PRICE_PRESETS.map(p => ({
    id: 'price-' + p.id,
    type: 'Price',
    label: p.label,
    icon: 'ticket',
    count: base.filter(e => p.test(e.price) && within(e, radius)).length,
    apply: () => applyPrice(p)
  })), ...WHEN_PRESETS.map(w => ({
    id: 'when-' + w.id,
    type: 'When',
    label: w.label,
    icon: 'cal',
    count: base.filter(e => ffInWhen(e, w) && within(e, radius)).length,
    apply: () => applyWhen(w)
  })), ...DIST_PRESETS.map(d => ({
    id: 'dist-' + d.id,
    type: 'Distance',
    label: d.label,
    icon: 'pin',
    count: base.filter(e => within(e, d.mi)).length,
    apply: () => applyDist(d)
  }))];
  const matches = ffMatch(q, registry);

  // --- Feed: respects active interests, price, distance, and any When preset -
  // The user's freshly-posted pop-ups are pinned on top, unfiltered — they're
  // the poster's own listings, so they always show in the browse feed.
  const feed = [...userEvents, ...base.filter(e => {
    const interestOk = active.length === 0 || e.tags.some(t => active.includes(t));
    const priceOk = !priceFilter || priceFilter.test(e.price);
    const distOk = within(e, radius);
    const whenOk = !whenLabel || (() => {
      const y = ffEventYMD(e);
      return y && y >= start && y <= end;
    })();
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
    const overflow = matching.filter(e => e.mi != null && e.mi > sr.effRadius && e.mi <= cap).sort((a, b) => a.mi - b.mi);
    srData = {
      sr,
      inRadius,
      cap,
      overflow,
      showOverflow: inRadius.length < 3 && overflow.length > 0
    };
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden',
      position: 'relative',
      background: 'var(--app-bg)'
    }
  }, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px 20px 0',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      minHeight: 44
    }
  }, searchResult && /*#__PURE__*/React.createElement("button", {
    onClick: () => setSearchResult(null),
    "aria-label": "Back to browse",
    style: {
      background: 'var(--app-icon-chip-bg, rgba(255,255,255,0.06))',
      border: '1px solid var(--app-card-border, rgba(255,255,255,0.12))',
      borderRadius: 10,
      padding: 8,
      cursor: 'pointer',
      display: 'flex',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "15",
    height: "15",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "var(--app-text, #fff)",
    strokeWidth: "2.6",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M15 18l-6-6 6-6"
  }))), /*#__PURE__*/React.createElement(SparkLogo, {
    size: 22
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => searchOpen ? closeSearch() : setSearchOpen(true),
    "aria-label": "Find a filter",
    style: {
      background: searchOpen ? 'linear-gradient(135deg,#ff8c38,#ffca3a)' : 'var(--app-icon-chip-bg, rgba(255,255,255,0.06))',
      border: searchOpen ? '1px solid rgba(255,140,56,0.5)' : '1px solid var(--app-card-border, rgba(255,255,255,0.12))',
      borderRadius: 12,
      padding: 10,
      cursor: 'pointer',
      flexShrink: 0,
      transition: 'background .2s ease'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 16,
    color: searchOpen ? '#14213D' : 'var(--app-text, #fff)'
  }))), searchResult ?
  /*#__PURE__*/
  // ===== SEARCH RESULTS — distinct view; the browse feed is not rendered here =====
  React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 20px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      fontSize: 11.5,
      fontWeight: 900,
      letterSpacing: '0.13em',
      textTransform: 'uppercase',
      color: 'rgba(238,240,255,0.50)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "pin",
    size: 13,
    color: "#FCA311"
  }), "Showing events near ", zip, " \xB7 ", srData.sr.effRadius, "mi"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      marginTop: 11,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(ActiveFilterPill, {
    label: srData.sr.label,
    onRemove: () => setSearchResult(null)
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: 'rgba(238,240,255,0.45)'
    }
  }, srData.sr.type, " filter"))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: '16px 20px 100px'
    }
  }, srData.inRadius.length === 0 && srData.overflow.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '48px 20px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 52,
      height: 52,
      borderRadius: 15,
      margin: '0 auto 14px',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.10)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "pin",
    size: 20,
    color: "rgba(238,240,255,0.40)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 15,
      color: '#fff',
      marginBottom: 6
    }
  }, "No events within ", Math.round(srData.cap * 10) / 10, " mi"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'rgba(238,240,255,0.50)',
      lineHeight: 1.5
    }
  }, "Try widening your radius to see more of \u201C", srData.sr.label, ".\u201D")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 800,
      letterSpacing: '0.04em',
      color: 'rgba(238,240,255,0.55)',
      marginBottom: 14
    }
  }, "Within your radius \xB7 ", srData.inRadius.length, " event", srData.inRadius.length === 1 ? '' : 's'), srData.inRadius.length > 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, srData.inRadius.map(e => /*#__PURE__*/React.createElement(EventStub, {
    variant: "photo",
    key: e.id,
    event: e,
    onTap: () => onSelect(e)
  }))) : /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'rgba(238,240,255,0.50)',
      lineHeight: 1.5
    }
  }, "Nothing within ", srData.sr.effRadius, " mi \u2014 but there's a little more just past it."), srData.showOverflow && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      margin: '26px 0 14px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 1,
      background: 'rgba(255,255,255,0.10)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 900,
      letterSpacing: '0.13em',
      textTransform: 'uppercase',
      color: 'rgba(238,240,255,0.55)'
    }
  }, "Just past your radius"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 1,
      background: 'rgba(255,255,255,0.10)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 11,
      padding: '13px 14px',
      borderRadius: 16,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      lineHeight: 0,
      marginTop: 1
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "clock",
    size: 16,
    color: "#FCA311"
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 12.5,
      lineHeight: 1.5,
      color: 'rgba(238,240,255,0.65)'
    }
  }, "Only ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: '#fff'
    }
  }, srData.inRadius.length), " within ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: '#FCA311'
    }
  }, srData.sr.effRadius, " mi"), ". Here ", srData.overflow.length === 1 ? 'is' : 'are', " ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: '#FCA311'
    }
  }, srData.overflow.length, " more"), " a little farther out, so you don't miss something good.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, srData.overflow.map(e => /*#__PURE__*/React.createElement(EventStub, {
    variant: "photo",
    key: e.id,
    event: e,
    onTap: () => onSelect(e),
    pastRadius: Math.round(e.mi - srData.sr.effRadius)
  }))))))) :
  /*#__PURE__*/
  // ===== EXPLORE FEED (browse) — unchanged; the finder overlays on top of it =====
  React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 20px 0'
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Explore Interests"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      overflowX: 'auto',
      padding: '12px 0 4px',
      scrollbarWidth: 'none'
    }
  }, INTERESTS.map(i => /*#__PURE__*/React.createElement(InterestPill, {
    key: i,
    active: active.includes(i),
    onClick: () => toggle(i)
  }, i)))), hasActiveExtras && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 20px 0',
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8
    }
  }, priceFilter && /*#__PURE__*/React.createElement(ActiveFilterPill, {
    label: priceFilter.label,
    onRemove: () => setPriceFilter(null)
  }), whenLabel && /*#__PURE__*/React.createElement(ActiveFilterPill, {
    label: whenLabel,
    onRemove: () => {
      setWhenLabel(null);
      setStart(todayLocalYMD());
      setEnd(todayLocalYMD());
    }
  }), distLabel && /*#__PURE__*/React.createElement(ActiveFilterPill, {
    label: distLabel,
    onRemove: () => {
      setDistLabel(null);
      setRadius(25);
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 20px 0'
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "When"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(DateRangeBar, {
    start: start,
    end: end,
    onStartChange: setStart,
    onEndChange: setEnd,
    zip: zip,
    onZipChange: setZip,
    radius: radius,
    onRadiusChange: setRadius
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 20px 0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'rgba(238,240,255,0.55)',
      fontWeight: 700
    }
  }, view === 'map' ? `Near you · ${feed.length} pin${feed.length === 1 ? '' : 's'}` : view === 'time' ? `Time-ranked · ${feed.length} event${feed.length === 1 ? '' : 's'}` : `${whenLabel || 'This week'} · ${feed.length} event${feed.length === 1 ? '' : 's'}`), /*#__PURE__*/React.createElement(ViewSwitcher, {
    value: view,
    onChange: setView
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: '16px 20px 100px'
    }
  }, view === 'list' && (feed.length > 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, feed.map(e => /*#__PURE__*/React.createElement(EventStub, {
    variant: "photo",
    key: e.id,
    event: e,
    onTap: () => onSelect(e)
  }))) : /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '40px 18px',
      color: 'rgba(238,240,255,0.50)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 15,
      color: 'var(--app-text)',
      marginBottom: 6
    }
  }, "Nothing matches those filters"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      lineHeight: 1.5
    }
  }, "Loosen a filter above to see more events nearby."))), view === 'map' && /*#__PURE__*/React.createElement(MapView, {
    events: feed,
    onSelect: onSelect
  }), view === 'time' && /*#__PURE__*/React.createElement(TimeView, {
    events: feed,
    onSelect: onSelect
  }))), searchOpen && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 50,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 40
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: closeSearch,
    style: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(13,21,37,0.6)',
      cursor: 'pointer'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      maxHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#14213D',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '0 0 22px 22px',
      boxShadow: '0 24px 50px -12px rgba(0,0,0,0.55)',
      animation: 'ffPanelDrop .26s ease'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px 12px',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,140,56,0.40)',
      borderRadius: 13,
      padding: '10px 13px'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 15,
    color: "rgba(238,240,255,0.50)"
  }), /*#__PURE__*/React.createElement("input", {
    autoFocus: true,
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Find a filter \u2014 Free, Music, This week\u2026",
    style: {
      flex: 1,
      minWidth: 0,
      background: 'none',
      border: 'none',
      outline: 'none',
      color: '#eef0ff',
      fontSize: 13.5,
      fontWeight: 600,
      fontFamily: 'inherit'
    }
  }), q && /*#__PURE__*/React.createElement("button", {
    onClick: () => setQ(''),
    "aria-label": "Clear",
    style: {
      background: 'rgba(255,255,255,0.10)',
      border: 'none',
      borderRadius: 9999,
      width: 20,
      height: 20,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 11,
    color: "#fff"
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: closeSearch,
    style: {
      background: 'none',
      border: 'none',
      color: '#ffca3a',
      fontWeight: 800,
      fontSize: 13,
      cursor: 'pointer',
      flexShrink: 0
    }
  }, "Cancel")), /*#__PURE__*/React.createElement("div", {
    style: {
      overflowY: 'auto',
      padding: '2px 18px 20px'
    }
  }, !q.trim() ? /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'rgba(31,44,72,0.72)',
      border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: 18,
      padding: 16,
      boxShadow: '0 8px 24px -10px rgba(0,0,0,0.4)'
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Recent"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      margin: '12px 0 24px'
    }
  }, FINDER_RECENTS.map(r => /*#__PURE__*/React.createElement(RecentChip, {
    key: r,
    label: r,
    onClick: () => setQ(r)
  }))), /*#__PURE__*/React.createElement(Eyebrow, null, "Browse by Interest"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10,
      marginTop: 12
    }
  }, FINDER_TILES.map(label => /*#__PURE__*/React.createElement(InterestTile, {
    key: label,
    label: label,
    icon: INTEREST_ICON_MAP[label] || 'store',
    onClick: () => applyInterest(label)
  })))) : matches.length > 0 ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'rgba(238,240,255,0.45)',
      fontWeight: 800,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      margin: '6px 0 12px'
    }
  }, "Matching filters"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, matches.map(m => /*#__PURE__*/React.createElement(FilterMatchRow, {
    key: m.f.id,
    match: m,
    query: q,
    onApply: m.f.apply
  })))) : /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '34px 18px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      borderRadius: 14,
      margin: '0 auto 12px',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.10)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 19,
    color: "rgba(238,240,255,0.40)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 14.5,
      color: '#fff',
      marginBottom: 6
    }
  }, "No filters match \u201C", q.trim(), "\u201D"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'rgba(238,240,255,0.50)',
      lineHeight: 1.5
    }
  }, "Try an interest, a price like \u201CFree\u201D, a day, or a distance."))))), /*#__PURE__*/React.createElement(TabBar, {
    active: "home",
    onChange: t => onTab && onTab(t)
  }));
};

// Photo hero — swipeable 1–3 image gallery. A single photo renders as a
// static hero with no controls; multiples get page dots, a counter, and a
// thumbnail strip (active thumb ringed in gold). Images are gradient panels
// in this prototype, but the gallery treats them as photos.
const PhotoHero = ({
  event
}) => {
  const photos = event.photos && event.photos.length ? event.photos : [event.gradient];
  const multi = photos.length > 1;
  const [idx, setIdx] = React.useState(0);
  const scrollerRef = React.useRef(null);
  const onScroll = e => {
    const w = e.target.clientWidth || 1;
    const i = Math.round(e.target.scrollLeft / w);
    if (i !== idx) setIdx(i);
  };
  const goTo = i => {
    const el = scrollerRef.current;
    if (!el) return;
    // behavior:'smooth' is unreliable inside the transform-scaled phone frame,
    // so animate scrollLeft by hand for a dependable, smooth jump.
    const start = el.scrollLeft;
    const end = i * el.clientWidth;
    if (Math.abs(end - start) < 1) return;
    const t0 = performance.now();
    const dur = 320;
    const ease = t => 1 - Math.pow(1 - t, 3);
    const step = now => {
      const t = Math.min(1, (now - t0) / dur);
      el.scrollLeft = start + (end - start) * ease(t);
      if (t < 1) requestAnimationFrame(step);else setIdx(i);
    };
    requestAnimationFrame(step);
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 280,
      marginTop: -54,
      position: 'relative',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: scrollerRef,
    onScroll: multi ? onScroll : undefined,
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      overflowX: multi ? 'auto' : 'hidden',
      overflowY: 'hidden',
      scrollSnapType: 'x mandatory',
      scrollbarWidth: 'none',
      WebkitOverflowScrolling: 'touch'
    }
  }, photos.map((g, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: '0 0 100%',
      width: '100%',
      height: '100%',
      background: g,
      scrollSnapAlign: 'start'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(to top, #14213D 0%, transparent 60%)',
      pointerEvents: 'none'
    }
  }), event.live && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 24,
      left: 24,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 10px 6px 8px',
      borderRadius: 9999,
      background: 'rgba(15,26,48,0.55)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.10)'
    }
  }, /*#__PURE__*/React.createElement(LiveDot, null), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 900,
      letterSpacing: '0.22em',
      color: '#fff'
    }
  }, "NOW")), multi && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 18,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, photos.map((_, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => goTo(i),
    "aria-label": `Photo ${i + 1}`,
    style: {
      height: 6,
      width: i === idx ? 20 : 6,
      borderRadius: 9999,
      border: 'none',
      cursor: 'pointer',
      padding: 0,
      background: i === idx ? 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' : 'rgba(255,255,255,0.45)',
      transition: 'width .25s ease'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 16,
      right: 16,
      padding: '4px 9px',
      borderRadius: 9999,
      fontSize: 11,
      fontWeight: 800,
      color: '#fff',
      background: 'rgba(15,26,48,0.62)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.12)',
      letterSpacing: '0.02em'
    }
  }, idx + 1, "/", photos.length))));
};
const EventDetailScreen = ({
  event,
  onBack,
  onRSVP,
  onOrganizerTap,
  desktop
}) => {
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
  React.useEffect(() => {
    const id = setInterval(() => _tick(t => t + 1), 60000);
    return () => clearInterval(id);
  }, []);
  const handleShare = () => {
    setShareToast(true);
    window.setTimeout(() => setShareToast(false), 1800);
  };
  // Countdown shown in the ticket's right-hand stub.
  const cd = (() => {
    if (!event.startISO) return {
      big: '—',
      label: '',
      sub: ''
    };
    const diff = new Date(event.startISO).getTime() - Date.now();
    if (diff <= 0) return {
      big: 'Now',
      label: 'Happening',
      sub: '',
      live: true
    };
    const totalMin = Math.floor(diff / 60000);
    if (totalMin >= 1440) {
      const d = Math.ceil(diff / 86400000);
      return {
        big: String(d),
        label: d === 1 ? 'Day' : 'Days',
        sub: ''
      };
    }
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h >= 1) return {
      big: h + 'h',
      label: 'Starts in',
      sub: m > 0 ? m + ' min' : 'on time'
    };
    return {
      big: m + 'm',
      label: 'Starts in',
      sub: 'soon'
    };
  })();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      overflow: 'auto',
      overflowX: 'hidden',
      position: 'relative',
      background: desktop ? 'var(--app-bg)' : undefined
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: desktop ? {
      maxWidth: 640,
      margin: '0 auto'
    } : undefined
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 10
    }
  }, !desktop && /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 20px 12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    "aria-label": "Back",
    style: {
      background: 'rgba(15,26,48,0.85)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.12)',
      color: '#fff',
      width: 40,
      height: 40,
      borderRadius: 12,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "white",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M19 12H5M12 19l-7-7 7-7"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setSaved(s => !s),
    "aria-label": saved ? 'Saved' : 'Save',
    style: {
      background: saved ? 'rgba(252,163,17,0.12)' : 'rgba(15,26,48,0.85)',
      backdropFilter: 'blur(8px)',
      border: `1px solid ${saved ? 'rgba(252,163,17,0.35)' : 'rgba(255,255,255,0.12)'}`,
      color: saved ? '#FCA311' : '#fff',
      width: 40,
      height: 40,
      borderRadius: 12,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: saved ? 'bookmark-fill' : 'bookmark',
    size: 16,
    color: saved ? '#FCA311' : '#fff'
  })), /*#__PURE__*/React.createElement("button", {
    onClick: handleShare,
    "aria-label": "Share",
    style: {
      background: 'rgba(15,26,48,0.85)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.12)',
      color: '#fff',
      width: 40,
      height: 40,
      borderRadius: 12,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "share",
    size: 16,
    color: "#fff"
  }))))), /*#__PURE__*/React.createElement(PhotoHero, {
    event: event
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 24px 60px',
      marginTop: 16,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      marginBottom: 14
    }
  }, event.tags.map(t => /*#__PURE__*/React.createElement(Tag, {
    key: t
  }, t))), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'Montserrat',
      fontSize: 32,
      fontWeight: 900,
      letterSpacing: '-0.01em',
      lineHeight: 1.05,
      margin: '0 0 18px',
      color: 'var(--app-text)'
    }
  }, event.title), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'stretch',
      background: 'var(--app-card-bg)',
      border: '1px solid var(--app-card-border)',
      borderRadius: 20,
      overflow: 'hidden',
      marginBottom: 22,
      boxShadow: '0 10px 32px rgba(0,0,0,0.24)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 5,
      flexShrink: 0,
      background: 'linear-gradient(180deg,#ff6348,#ff8c38,#ffca3a)'
    }
  }), "        ", /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      padding: '17px 14px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 11
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 11,
      fontSize: 13.5
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "cal",
    size: 15,
    color: "#ff6348"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--app-text-muted)',
      fontWeight: 600
    }
  }, event.date)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 11,
      fontSize: 13.5
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "clock",
    size: 15,
    color: "#ff6348"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--app-text-muted)',
      fontWeight: 600
    }
  }, event.time)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 11,
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: 1,
      flexShrink: 0,
      lineHeight: 0
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "pin",
    size: 15,
    color: "#FCA311"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--app-text-muted)',
      fontWeight: 600,
      lineHeight: 1.35
    }
  }, event.location, typeof event.mi === 'number' ? /*#__PURE__*/React.createElement("span", {
    style: {
      whiteSpace: 'nowrap'
    }
  }, ' · ', event.mi, "\xA0mi") : ''))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: 2,
      alignSelf: 'stretch',
      margin: '15px 0',
      display: 'flex',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 0,
      height: '100%',
      borderLeft: '2px dotted var(--app-text-hint)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: -15,
      left: '50%',
      width: 14,
      height: 14,
      borderRadius: '50%',
      background: 'var(--app-bg)',
      transform: 'translate(-50%,-50%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: -15,
      left: '50%',
      width: 14,
      height: 14,
      borderRadius: '50%',
      background: 'var(--app-bg)',
      transform: 'translate(-50%,50%)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 84,
      flexShrink: 0,
      padding: '16px 8px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 30,
      lineHeight: 1,
      color: cd.live ? '#ff6348' : '#ffca3a'
    }
  }, cd.big), cd.label && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8.5,
      fontWeight: 900,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--app-text-muted)',
      marginTop: 7,
      whiteSpace: 'nowrap'
    }
  }, cd.label), cd.sub && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: 'var(--app-text-faint)',
      marginTop: 4,
      whiteSpace: 'nowrap'
    }
  }, cd.sub))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15,
      fontWeight: 500,
      color: 'var(--app-text-muted)',
      lineHeight: 1.6,
      margin: '32px 0 22px'
    }
  }, event.desc), event.address && /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid var(--app-divider)',
      paddingTop: 18,
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    color: "#F7B731"
  }, "Location"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 12,
      flexShrink: 0,
      background: 'rgba(252,163,17,0.14)',
      border: '1px solid rgba(252,163,17,0.28)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "pin",
    size: 16,
    color: "#FCA311"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      color: 'var(--app-text)',
      fontSize: 14,
      letterSpacing: '-0.01em'
    }
  }, event.location), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--app-text-muted)',
      marginTop: 3,
      lineHeight: 1.45
    }
  }, event.address), /*#__PURE__*/React.createElement("a", {
    href: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent((event.location ? event.location + ', ' : '') + event.address)}`,
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      marginTop: 9,
      fontSize: 12.5,
      fontWeight: 800,
      color: '#FCA311',
      cursor: 'pointer',
      textDecoration: 'none'
    }
  }, "Get directions", /*#__PURE__*/React.createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#FCA311",
    strokeWidth: "2.6",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M5 12h14M13 6l6 6-6 6"
  })))))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid var(--app-divider)',
      paddingTop: 18,
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    color: "#F7B731"
  }, "Organizer"), /*#__PURE__*/React.createElement("button", {
    onClick: () => onOrganizerTap && onOrganizerTap(event),
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: onOrganizerTap ? 'pointer' : 'default',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginTop: 12,
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 9999,
      flexShrink: 0,
      background: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 14px rgba(255,95,78,0.30)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkles",
    size: 17,
    color: "#14213D"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      color: 'var(--app-text)',
      fontSize: 15,
      letterSpacing: '-0.01em',
      flex: 1
    }
  }, event.organizer), onOrganizerTap && /*#__PURE__*/React.createElement(Icon, {
    name: "chev-right",
    size: 16,
    color: "var(--app-text-faint)"
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: () => onRSVP ? onRSVP(event) : alert('RSVP recorded'),
    style: {
      width: '100%',
      backgroundImage: 'linear-gradient(135deg,#ff5f4e 0%,#ff8c38 50%,#ffca3a 100%)',
      border: 'none',
      color: '#14213D',
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 16,
      letterSpacing: '-0.01em',
      padding: '17px 20px',
      borderRadius: 16,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      boxShadow: '0 12px 30px -8px rgba(255,95,78,0.55)'
    }
  }, "I'm Going"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setReportOpen(true),
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      fontSize: 12.5,
      fontWeight: 600,
      color: 'var(--app-text-faint)'
    }
  }, "Report this event")))), shareToast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '50%',
      bottom: 24,
      transform: 'translateX(-50%)',
      zIndex: 20,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      background: 'rgba(15,26,48,0.92)',
      border: '1px solid rgba(252,163,17,0.35)',
      backdropFilter: 'blur(12px)',
      padding: '12px 18px',
      borderRadius: 9999,
      boxShadow: '0 12px 28px rgba(0,0,0,0.35)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 14,
    color: "#FCA311"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 900,
      color: '#fff',
      letterSpacing: '0.02em'
    }
  }, "Link copied")), reportOpen && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    onClick: () => setReportOpen(false),
    style: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(6,10,20,0.65)',
      zIndex: 40
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 41,
      background: 'var(--app-bg)',
      borderTop: '1px solid var(--app-card-border)',
      borderRadius: '24px 24px 0 0',
      padding: '20px 24px 28px',
      boxShadow: '0 -20px 60px rgba(0,0,0,0.45)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 4,
      borderRadius: 9999,
      background: 'var(--app-card-border)',
      margin: '0 auto 18px'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Montserrat',
      fontSize: 18,
      fontWeight: 900,
      color: 'var(--app-text)',
      marginBottom: 16
    }
  }, "Report this event"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      marginBottom: 16
    }
  }, REPORT_REASONS.map(r => /*#__PURE__*/React.createElement("button", {
    key: r,
    onClick: () => setReportReason(r),
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 14px',
      borderRadius: 12,
      background: reportReason === r ? 'rgba(252,163,17,0.10)' : 'var(--app-card-bg)',
      border: `1px solid ${reportReason === r ? 'rgba(252,163,17,0.40)' : 'var(--app-card-border)'}`
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 18,
      height: 18,
      borderRadius: 9999,
      flexShrink: 0,
      border: `2px solid ${reportReason === r ? '#FCA311' : 'var(--app-border-strong)'}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, reportReason === r && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: 9999,
      background: '#FCA311'
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 600,
      color: 'var(--app-text)'
    }
  }, r)))), /*#__PURE__*/React.createElement("textarea", {
    value: reportDetails,
    onChange: e => setReportDetails(e.target.value),
    placeholder: "Add details (optional)",
    style: {
      width: '100%',
      minHeight: 70,
      boxSizing: 'border-box',
      resize: 'none',
      background: 'var(--app-card-bg)',
      border: '1px solid var(--app-card-border)',
      borderRadius: 12,
      padding: '11px 13px',
      fontSize: 13,
      fontFamily: 'Inter',
      color: 'var(--app-text)',
      marginBottom: 18
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: handleSubmitReport,
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      width: '100%',
      textAlign: 'center',
      background: 'var(--app-icon-chip-bg)',
      border: '1px solid var(--app-border-strong)',
      borderRadius: 14,
      padding: '14px 18px',
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 14.5,
      color: 'var(--app-text)'
    }
  }, "Submit report"))), reportToast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '50%',
      bottom: 24,
      transform: 'translateX(-50%)',
      zIndex: 50,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      background: 'rgba(15,26,48,0.92)',
      border: '1px solid rgba(252,163,17,0.35)',
      backdropFilter: 'blur(12px)',
      padding: '12px 18px',
      borderRadius: 9999,
      boxShadow: '0 12px 28px rgba(0,0,0,0.35)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 14,
    color: "#FCA311"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 900,
      color: '#fff',
      letterSpacing: '0.02em'
    }
  }, "Thanks \u2014 we'll review this event.")));
};

// =============================================================
// ME SCREEN — top-level for the Me tab. Profile header + Saved card
// + Workspace card. Both cards drill into their own screens.
// =============================================================
// What an account unlocks — shown on the logged-out Me tab.
const ME_UNLOCKS = [{
  icon: 'bookmark-fill',
  title: 'Save events',
  sub: 'Bookmark anything and find it again in one tap.'
}, {
  icon: 'list',
  title: 'Keep your filters',
  sub: 'Your feed remembers the categories you’re into.'
}, {
  icon: 'sparkles',
  title: 'Host events',
  sub: 'Publish and manage your own nights out.'
}];

// Logged-out Me — a signup invitation in place of the profile shell. Browsing,
// event detail, and share links stay open to anonymous users; only saving,
// filter persistence, and hosting live behind an account.
const MeSignupPrompt = ({
  onSignup,
  onLogin,
  onTab
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflowX: 'hidden'
  }
}, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement("div", {
  style: {
    padding: '4px 24px 8px',
    display: 'flex',
    alignItems: 'center'
  }
}, /*#__PURE__*/React.createElement(SparkLogo, {
  size: 22
})), /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1,
    overflow: 'auto',
    padding: '8px 24px 100px',
    display: 'flex',
    flexDirection: 'column'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    marginTop: 16
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    width: 56,
    height: 56,
    borderRadius: 16,
    background: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 6px 22px rgba(255,95,78,0.24)'
  }
}, /*#__PURE__*/React.createElement(Icon, {
  name: "bookmark-fill",
  size: 24,
  color: "#14213D"
})), /*#__PURE__*/React.createElement("h1", {
  style: {
    fontFamily: 'Montserrat',
    fontSize: 30,
    fontWeight: 900,
    letterSpacing: '-0.01em',
    lineHeight: 1.04,
    margin: '20px 0 0',
    color: '#fff'
  }
}, "Make Sparked yours"), /*#__PURE__*/React.createElement("p", {
  style: {
    fontSize: 14,
    color: 'rgba(238,240,255,0.60)',
    lineHeight: 1.5,
    margin: '10px 0 0',
    maxWidth: 300
  }
}, "Browsing is always free. An account just lets you keep what you find \u2014 and run your own nights out.")), /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    marginTop: 24
  }
}, ME_UNLOCKS.map(u => /*#__PURE__*/React.createElement("div", {
  key: u.title,
  style: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 13,
    padding: '12px 0'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    width: 38,
    height: 38,
    flexShrink: 0,
    borderRadius: 11,
    background: 'rgba(252,163,17,0.10)',
    border: '1px solid rgba(252,163,17,0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
}, /*#__PURE__*/React.createElement(Icon, {
  name: u.icon,
  size: 17,
  color: "#FCA311"
})), /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1,
    minWidth: 0,
    paddingTop: 1
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'Montserrat',
    fontWeight: 900,
    fontSize: 15,
    letterSpacing: '-0.01em',
    color: '#fff'
  }
}, u.title), /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 12.5,
    color: 'rgba(238,240,255,0.50)',
    marginTop: 2,
    lineHeight: 1.4
  }
}, u.sub))))), /*#__PURE__*/React.createElement("div", {
  style: {
    marginTop: 'auto',
    paddingTop: 26,
    display: 'flex',
    flexDirection: 'column',
    gap: 11
  }
}, /*#__PURE__*/React.createElement("button", {
  onClick: onSignup,
  style: {
    width: '100%',
    backgroundImage: 'linear-gradient(135deg,#ff5f4e 0%,#ff8c38 50%,#ffca3a 100%)',
    border: 'none',
    color: '#14213D',
    fontFamily: 'Montserrat',
    fontWeight: 900,
    fontSize: 16,
    letterSpacing: '-0.01em',
    padding: '16px 20px',
    borderRadius: 16,
    cursor: 'pointer',
    boxShadow: '0 12px 30px -8px rgba(255,95,78,0.55)'
  }
}, "Create free account"), /*#__PURE__*/React.createElement("button", {
  onClick: onLogin,
  style: {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#fff',
    fontFamily: 'Montserrat',
    fontWeight: 800,
    fontSize: 14,
    padding: '14px 20px',
    borderRadius: 16,
    cursor: 'pointer'
  }
}, "Log in"), /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 4,
    fontSize: 11.5,
    color: 'rgba(238,240,255,0.42)'
  }
}, /*#__PURE__*/React.createElement(Icon, {
  name: "search",
  size: 12,
  color: "rgba(238,240,255,0.42)"
}), "Keep browsing Explore without an account."))), /*#__PURE__*/React.createElement(TabBar, {
  active: "profile",
  onChange: t => onTab && onTab(t)
}));
const MeScreen = ({
  onOpenSaved,
  onOpenWorkspace,
  onCreateFirst,
  onSettings,
  onTab,
  signedIn = true,
  onSignup,
  onLogin,
  workspaces = WORKSPACES
}) => {
  if (!signedIn) return /*#__PURE__*/React.createElement(MeSignupPrompt, {
    onSignup: onSignup,
    onLogin: onLogin,
    onTab: onTab
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px 24px 16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(SparkLogo, {
    size: 22
  }), /*#__PURE__*/React.createElement("button", {
    onClick: onSettings,
    "aria-label": "Settings",
    style: {
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 12,
      padding: 10,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "gear",
    size: 16,
    color: "#fff"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: '0 24px 100px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      marginBottom: 28,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: 9999,
      flexShrink: 0,
      background: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#14213D',
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 24,
      letterSpacing: '-0.01em',
      boxShadow: '0 6px 22px rgba(255,95,78,0.24)'
    }
  }, "JC"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      color: '#fff',
      fontSize: 20,
      letterSpacing: '-0.01em',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, "Jordan Chen"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'rgba(238,240,255,0.55)',
      marginTop: 2,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, "Phoenix, AZ \xB7 Member since 2026"))), /*#__PURE__*/React.createElement("button", {
    onClick: onOpenSaved,
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      display: 'block',
      width: '100%',
      cursor: 'pointer',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 22,
      padding: 18,
      marginBottom: 30
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 12,
      background: 'rgba(252,163,17,0.10)',
      border: '1px solid rgba(252,163,17,0.25)',
      color: '#FCA311',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bookmark-fill",
    size: 18,
    color: "#FCA311"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      color: '#fff',
      fontSize: 16,
      letterSpacing: '-0.01em'
    }
  }, "Saved"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'rgba(238,240,255,0.55)',
      marginTop: 2
    }
  }, "2 events \xB7 1 happening this week")), /*#__PURE__*/React.createElement(Icon, {
    name: "chev-right",
    size: 16,
    color: "rgba(238,240,255,0.45)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      marginTop: 14
    }
  }, SAMPLE_EVENTS.filter(e => e.saved).slice(0, 3).map(e => /*#__PURE__*/React.createElement("div", {
    key: e.id,
    style: {
      flex: 1,
      height: 38,
      borderRadius: 8,
      background: e.gradient
    }
  })))), workspaces && workspaces.length > 0 ? /*#__PURE__*/React.createElement("button", {
    onClick: onOpenWorkspace,
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      display: 'block',
      width: '100%',
      cursor: 'pointer',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 22,
      padding: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 12,
      background: 'rgba(255,99,72,0.10)',
      border: '1px solid rgba(255,99,72,0.25)',
      color: '#ff6348',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkles",
    size: 18,
    color: "#ff6348"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      color: '#fff',
      fontSize: 16,
      letterSpacing: '-0.01em'
    }
  }, "Workspace"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'rgba(238,240,255,0.55)',
      marginTop: 2
    }
  }, _wsStatLine(workspaces[0]))), /*#__PURE__*/React.createElement(Icon, {
    name: "chev-right",
    size: 16,
    color: "rgba(238,240,255,0.45)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      fontSize: 11.5,
      color: 'rgba(238,240,255,0.45)',
      lineHeight: 1.5
    }
  }, "Create + manage your events. Backstage preview inside.")) : /*#__PURE__*/React.createElement("button", {
    onClick: onCreateFirst,
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      display: 'block',
      width: '100%',
      cursor: 'pointer',
      background: 'rgba(255,140,56,0.04)',
      border: '1.5px dashed rgba(255,140,56,0.50)',
      borderRadius: 22,
      padding: '22px 18px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 17,
      letterSpacing: '-0.01em',
      backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      color: 'transparent'
    }
  }, "+ Create your first event"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'rgba(238,240,255,0.55)',
      marginTop: 7,
      lineHeight: 1.45,
      maxWidth: 260,
      marginLeft: 'auto',
      marginRight: 'auto'
    }
  }, "Host your own events and reach people nearby."))), /*#__PURE__*/React.createElement(TabBar, {
    active: "profile",
    onChange: t => onTab && onTab(t)
  }));
};

// =============================================================
// SAVED SCREEN — events the user has bookmarked.
// =============================================================
const SavedScreen = ({
  onBack,
  onSelect,
  onTab
}) => {
  const savedEvents = SAMPLE_EVENTS.filter(e => e.saved);

  // Group saved events by WHEN they happen — the ticket-stub language read as a
  // timeline. Tonight = today; This Weekend = the coming Sat/Sun; Coming Up =
  // everything later. A section renders only when it holds events.
  const _now = new Date();
  const _dow = _now.getDay(); // 0 Sun … 6 Sat
  const _satOffset = (6 - _dow + 7) % 7; // days until the coming Saturday (0 if today)
  const _satStart = new Date(_now);
  _satStart.setDate(_now.getDate() + _satOffset);
  _satStart.setHours(0, 0, 0, 0);
  const _sunEnd = new Date(_satStart);
  _sunEnd.setDate(_satStart.getDate() + 1);
  _sunEnd.setHours(23, 59, 59, 999);
  const _sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const _bucketOf = e => {
    if (!e.startISO) return 'coming';
    const s = new Date(e.startISO);
    if (_sameDay(s, _now)) return 'tonight';
    const t = s.getTime();
    if (t >= _satStart.getTime() && t <= _sunEnd.getTime()) return 'weekend';
    return 'coming';
  };
  const _groups = {
    tonight: [],
    weekend: [],
    coming: []
  };
  savedEvents.forEach(e => _groups[_bucketOf(e)].push(e));
  const sections = [{
    key: 'tonight',
    label: 'Tonight',
    items: _groups.tonight
  }, {
    key: 'weekend',
    label: 'This Weekend',
    items: _groups.weekend
  }, {
    key: 'coming',
    label: 'Coming Up',
    items: _groups.coming
  }].filter(s => s.items.length);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px 24px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    "aria-label": "Back",
    style: {
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.10)',
      color: '#fff',
      width: 36,
      height: 36,
      borderRadius: 10,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "white",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M19 12H5M12 19l-7-7 7-7"
  }))), /*#__PURE__*/React.createElement(Eyebrow, null, "Me \xB7 Saved")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: '0 24px 100px'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'Montserrat',
      fontSize: 28,
      fontWeight: 900,
      letterSpacing: '-0.01em',
      lineHeight: 1.05,
      margin: '0 0 6px',
      color: '#fff'
    }
  }, "Saved"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: 'rgba(238,240,255,0.55)',
      margin: '0 0 22px'
    }
  }, savedEvents.length === 0 ? "Bookmark events from the feed to see them here." : `${savedEvents.length} ${savedEvents.length === 1 ? 'event' : 'events'}, sorted by when they happen.`), savedEvents.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px dashed rgba(255,255,255,0.12)',
      borderRadius: 18,
      padding: '28px 18px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bookmark",
    size: 22,
    color: "rgba(238,240,255,0.35)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'rgba(238,240,255,0.45)',
      marginTop: 10,
      lineHeight: 1.5
    }
  }, "Tap the bookmark icon on any event to save it.")) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 26
    }
  }, sections.map(sec => /*#__PURE__*/React.createElement("div", {
    key: sec.key
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      margin: '0 0 13px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 13,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: '#FCA311',
      whiteSpace: 'nowrap'
    }
  }, sec.label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 800,
      color: 'rgba(238,240,255,0.40)'
    }
  }, sec.items.length), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: 'linear-gradient(to right, rgba(252,163,17,0.25), transparent)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, sec.items.map(e => /*#__PURE__*/React.createElement(EventStub, {
    variant: "compact",
    key: e.id,
    event: e,
    onTap: () => onSelect(e)
  }))))))), /*#__PURE__*/React.createElement(TabBar, {
    active: "profile",
    onChange: t => onTab && onTab(t)
  }));
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
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 22,
      overflow: 'hidden',
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpen(!open),
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      width: '100%',
      padding: '16px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 10,
      background: 'rgba(255,99,72,0.10)',
      border: '1px solid rgba(255,99,72,0.25)',
      color: '#ff6348',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkles",
    size: 15,
    color: "#ff6348"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      color: '#fff',
      fontSize: 14,
      letterSpacing: '-0.01em'
    }
  }, "Backstage"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 8.5,
      fontWeight: 900,
      letterSpacing: '0.20em',
      textTransform: 'uppercase',
      color: '#FCA311',
      background: 'rgba(252,163,17,0.10)',
      border: '1px solid rgba(252,163,17,0.30)',
      padding: '2px 7px',
      borderRadius: 9999
    }
  }, "Coming soon")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'rgba(238,240,255,0.55)',
      marginTop: 2
    }
  }, "New event tools - vendor maps + AR navigation")), /*#__PURE__*/React.createElement(Icon, {
    name: "chev-right",
    size: 14,
    color: "rgba(238,240,255,0.45)"
  })), open && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 18px 18px',
      borderTop: '1px solid rgba(255,255,255,0.06)'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: 'rgba(238,240,255,0.70)',
      lineHeight: 1.6,
      margin: '14px 0 14px'
    }
  }, "We're building more ways to make every event easier to navigate. Vendors maintain their own profiles, drop a pin on the site map, and your attendees can follow an AR arrow straight to the booth they want."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 5,
      marginBottom: 16
    }
  }, ['Vendor profiles', 'AR booth navigation', 'Live booth updates'].map(f => /*#__PURE__*/React.createElement("span", {
    key: f,
    style: {
      fontSize: 8.5,
      fontWeight: 900,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: 'rgba(238,240,255,0.75)',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.10)',
      padding: '4px 9px',
      borderRadius: 9999
    }
  }, f))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9.5,
      fontWeight: 900,
      letterSpacing: '0.20em',
      textTransform: 'uppercase',
      color: '#FCA311',
      marginBottom: 10
    }
  }, "Help shape it"), /*#__PURE__*/React.createElement(BackstageCheckbox, {
    checked: interested,
    onChange: setInterested,
    label: "I'm interested in Backstage",
    sub: "Track demand and waitlist position"
  }), /*#__PURE__*/React.createElement(BackstageCheckbox, {
    checked: beta,
    onChange: setBeta,
    label: "I'd like to beta test",
    sub: "Pilot Backstage with your next event"
  })));
};
const BackstageCheckbox = ({
  checked,
  onChange,
  label,
  sub
}) => /*#__PURE__*/React.createElement("button", {
  onClick: () => onChange(!checked),
  style: {
    all: 'unset',
    boxSizing: 'border-box',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '10px 0',
    width: '100%'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    width: 22,
    height: 22,
    borderRadius: 7,
    flexShrink: 0,
    background: checked ? 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' : 'rgba(255,255,255,0.04)',
    border: `1px solid ${checked ? 'transparent' : 'rgba(255,255,255,0.20)'}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1
  }
}, checked && /*#__PURE__*/React.createElement(Icon, {
  name: "check",
  size: 14,
  color: "#14213D"
})), /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1,
    minWidth: 0
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 12.5,
    fontWeight: 700,
    color: '#fff'
  }
}, label), /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 11,
    color: 'rgba(238,240,255,0.50)',
    marginTop: 2
  }
}, sub)));
const WorkspaceScreen = ({
  onBack,
  onCreate,
  onEditProfile,
  onViewProfile,
  onSelectEvent,
  onTab,
  desktop
}) => {
  const stats = [{
    label: 'Live now',
    value: '2',
    color: '#ff6348'
  }, {
    label: 'This week',
    value: '4',
    color: '#FCA311'
  }, {
    label: 'Total RSVPs',
    value: '146',
    color: '#F7B731'
  }, {
    label: 'Reach',
    value: '2.1k',
    color: '#FCA311'
  }];
  if (desktop) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        minHeight: '100%',
        boxSizing: 'border-box',
        background: 'var(--app-bg)',
        color: 'var(--app-text)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: 1180,
        margin: '0 auto',
        padding: '40px 40px 80px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        marginBottom: 28
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: onBack,
      "aria-label": "Back",
      style: {
        all: 'unset',
        cursor: 'pointer',
        width: 38,
        height: 38,
        borderRadius: 12,
        background: 'var(--app-icon-chip-bg)',
        border: '1px solid var(--app-card-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M19 12H5M12 19l-7-7 7-7"
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("h1", {
      style: {
        fontFamily: 'Montserrat',
        fontSize: 26,
        fontWeight: 900,
        letterSpacing: '-0.01em',
        margin: 0,
        color: 'var(--app-text)'
      }
    }, "Your Workspace"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 12.5,
        color: 'var(--app-text-muted)',
        margin: '4px 0 0'
      }
    }, "Create, manage, and track every event you run.")), /*#__PURE__*/React.createElement("button", {
      onClick: onEditProfile,
      style: {
        all: 'unset',
        boxSizing: 'border-box',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '11px 18px',
        borderRadius: 12,
        background: 'var(--app-icon-chip-bg)',
        border: '1px solid var(--app-card-border)',
        color: 'var(--app-text)',
        fontWeight: 700,
        fontSize: 13,
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "edit",
      size: 14,
      color: "#FCA311"
    }), "Edit profile"), /*#__PURE__*/React.createElement("button", {
      onClick: onViewProfile,
      style: {
        all: 'unset',
        boxSizing: 'border-box',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '11px 18px',
        borderRadius: 12,
        background: 'var(--app-icon-chip-bg)',
        border: '1px solid var(--app-card-border)',
        color: 'var(--app-text)',
        fontWeight: 700,
        fontSize: 13,
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "user",
      size: 14,
      color: "#FCA311"
    }), "View profile"), /*#__PURE__*/React.createElement("button", {
      onClick: onCreate,
      style: {
        all: 'unset',
        cursor: 'pointer',
        boxSizing: 'border-box',
        flexShrink: 0,
        backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
        color: '#14213D',
        fontWeight: 900,
        fontSize: 13.5,
        padding: '13px 20px',
        borderRadius: 12,
        boxShadow: '0 6px 22px rgba(255,95,78,0.24)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "plus",
      size: 16,
      color: "#14213D"
    }), "Create Event")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 14,
        marginBottom: 32
      }
    }, stats.map(s => /*#__PURE__*/React.createElement("div", {
      key: s.label,
      style: {
        background: 'var(--app-card-bg)',
        border: '1px solid var(--app-card-border)',
        borderRadius: 18,
        padding: 20
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'Montserrat',
        fontSize: 32,
        fontWeight: 900,
        color: s.color,
        lineHeight: 1
      }
    }, s.value), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        fontWeight: 900,
        color: 'var(--app-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.18em',
        marginTop: 8
      }
    }, s.label)))), /*#__PURE__*/React.createElement(Eyebrow, null, "Your Listings"), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 12,
        borderRadius: 18,
        border: '1px solid var(--app-card-border)',
        background: 'var(--app-card-bg)',
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1.8fr 1fr 0.8fr 0.8fr 1fr',
        gap: 12,
        padding: '12px 18px',
        borderBottom: '1px solid var(--app-divider)'
      }
    }, ['Event', 'Date', 'Tier', 'RSVPs', 'Status'].map(h => /*#__PURE__*/React.createElement("div", {
      key: h,
      style: {
        fontSize: 10,
        fontWeight: 900,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--app-text-faint)'
      }
    }, h))), ORGANIZER_LISTINGS.map(e => /*#__PURE__*/React.createElement("div", {
      key: e.id,
      onClick: () => onSelectEvent && onSelectEvent(e),
      style: {
        display: 'grid',
        gridTemplateColumns: '1.8fr 1fr 0.8fr 0.8fr 1fr',
        gap: 12,
        padding: '14px 18px',
        alignItems: 'center',
        cursor: 'pointer',
        borderBottom: '1px solid var(--app-divider)',
        opacity: e.past ? 0.65 : 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 34,
        height: 34,
        borderRadius: 9,
        background: e.gradient,
        flexShrink: 0
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'Montserrat',
        fontWeight: 800,
        color: 'var(--app-text)',
        fontSize: 13.5,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, e.title), e.live && /*#__PURE__*/React.createElement(LiveDot, null)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: 'var(--app-text-muted)'
      }
    }, e.date), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: 'var(--app-text-muted)'
      }
    }, e.tier), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: 'var(--app-text-muted)'
      }
    }, typeof e.rsvps === 'number' ? e.rsvps : '—'), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 800,
        color: e.past ? 'var(--app-text-faint)' : e.live ? '#ff6348' : 'var(--app-green)'
      }
    }, e.past ? 'Past' : e.live ? 'Live' : 'Upcoming')))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 32
      }
    }, /*#__PURE__*/React.createElement(BackstageDemo, null))));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px 24px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    "aria-label": "Back",
    style: {
      background: 'var(--app-icon-chip-bg)',
      border: '1px solid var(--app-card-border)',
      color: 'var(--app-text)',
      width: 36,
      height: 36,
      borderRadius: 10,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "white",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M19 12H5M12 19l-7-7 7-7"
  }))), /*#__PURE__*/React.createElement(Eyebrow, null, "Me \xB7 Workspace")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: '0 24px 100px'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'Montserrat',
      fontSize: 28,
      fontWeight: 900,
      letterSpacing: '-0.01em',
      lineHeight: 1.05,
      margin: '0 0 6px',
      color: 'var(--app-text)'
    }
  }, "Your Workspace"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: 'var(--app-text-muted)',
      margin: '0 0 18px',
      lineHeight: 1.5
    }
  }, "Create, manage, and track every event you run."), /*#__PURE__*/React.createElement("button", {
    onClick: onCreate,
    style: {
      all: 'unset',
      cursor: 'pointer',
      boxSizing: 'border-box',
      width: '100%',
      backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
      color: '#14213D',
      fontWeight: 900,
      fontSize: 14,
      padding: '14px 18px',
      borderRadius: 14,
      boxShadow: '0 6px 22px rgba(255,95,78,0.24)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 16,
    color: "#14213D"
  }), /*#__PURE__*/React.createElement("span", null, "Create Event")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12,
      marginBottom: 22
    }
  }, stats.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.label,
    style: {
      background: 'var(--app-card-bg)',
      border: '1px solid var(--app-card-border)',
      borderRadius: 18,
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Montserrat',
      fontSize: 28,
      fontWeight: 900,
      color: s.color,
      lineHeight: 1
    }
  }, s.value), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 900,
      color: 'var(--app-text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.18em',
      marginTop: 6
    }
  }, s.label)))), /*#__PURE__*/React.createElement(Eyebrow, null, "Public Profile"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      marginTop: 12,
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onEditProfile,
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '13px 14px',
      background: 'var(--app-card-bg)',
      border: '1px solid var(--app-card-border)',
      borderRadius: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 34,
      height: 34,
      borderRadius: 10,
      flexShrink: 0,
      background: 'var(--app-icon-chip-bg)',
      border: '1px solid var(--app-card-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "edit",
    size: 14,
    color: "#FCA311"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 13.5,
      fontWeight: 700,
      color: 'var(--app-text)'
    }
  }, "Edit public profile"), /*#__PURE__*/React.createElement(Icon, {
    name: "chev-right",
    size: 15,
    color: "var(--app-text-faint)"
  })), /*#__PURE__*/React.createElement("button", {
    onClick: onViewProfile,
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '13px 14px',
      background: 'var(--app-card-bg)',
      border: '1px solid var(--app-card-border)',
      borderRadius: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 34,
      height: 34,
      borderRadius: 10,
      flexShrink: 0,
      background: 'var(--app-icon-chip-bg)',
      border: '1px solid var(--app-card-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "user",
    size: 15,
    color: "#FCA311"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 13.5,
      fontWeight: 700,
      color: 'var(--app-text)'
    }
  }, "View public profile"), /*#__PURE__*/React.createElement(Icon, {
    name: "chev-right",
    size: 15,
    color: "var(--app-text-faint)"
  }))), /*#__PURE__*/React.createElement(Eyebrow, null, "Your Listings"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, ORGANIZER_LISTINGS.map(e => /*#__PURE__*/React.createElement("div", {
    key: e.id,
    style: {
      display: 'flex',
      gap: 14,
      padding: 12,
      alignItems: 'center',
      minWidth: 0,
      background: 'var(--app-card-bg)',
      border: '1px solid var(--app-card-border)',
      borderRadius: 18,
      opacity: e.past ? 0.78 : 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 60,
      height: 60,
      borderRadius: 14,
      background: e.gradient,
      flexShrink: 0,
      position: 'relative'
    }
  }, e.past && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 14,
      background: 'rgba(20,33,61,0.55)',
      backdropFilter: 'blur(2px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "lock",
    size: 18,
    color: "#fff"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      color: 'var(--app-text)',
      fontSize: 14,
      marginBottom: 4,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, e.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--app-text-muted)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, e.date, " \xB7 ", e.tier, typeof e.rsvps === 'number' && /*#__PURE__*/React.createElement("span", null, " \xB7 ", e.rsvps, " RSVPs")), e.past && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: 'rgba(255,99,72,0.85)',
      marginTop: 4,
      display: 'flex',
      alignItems: 'center',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "lock",
    size: 10,
    color: "rgba(255,99,72,0.85)"
  }), /*#__PURE__*/React.createElement("span", null, "Locked \xB7 event has passed"))), e.live && /*#__PURE__*/React.createElement(LiveDot, null)))), /*#__PURE__*/React.createElement(BackstageDemo, null)), /*#__PURE__*/React.createElement(TabBar, {
    active: "profile",
    onChange: t => onTab && onTab(t)
  }));
};

// =============================================================
// WORKSPACE PICKER — shown only when a host belongs to 2+ workspaces.
// One row per workspace (logo · name · stats) + a Create button. With one
// workspace seeded this stays dormant: Workspace opens straight in.
// =============================================================
const WorkspacePickerScreen = ({
  workspaces = WORKSPACES,
  onPick,
  onCreate,
  onBack,
  onTab
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflowX: 'hidden'
  }
}, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement("div", {
  style: {
    padding: '4px 24px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12
  }
}, /*#__PURE__*/React.createElement("button", {
  onClick: onBack,
  "aria-label": "Back",
  style: {
    background: 'var(--app-icon-chip-bg)',
    border: '1px solid var(--app-card-border)',
    color: 'var(--app-text)',
    width: 36,
    height: 36,
    borderRadius: 10,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
}, /*#__PURE__*/React.createElement("svg", {
  width: "16",
  height: "16",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "white",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M19 12H5M12 19l-7-7 7-7"
}))), /*#__PURE__*/React.createElement(Eyebrow, null, "Me \xB7 Workspaces")), /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1,
    overflow: 'auto',
    padding: '0 24px 100px'
  }
}, /*#__PURE__*/React.createElement("h1", {
  style: {
    fontFamily: 'Montserrat',
    fontSize: 28,
    fontWeight: 900,
    letterSpacing: '-0.01em',
    lineHeight: 1.05,
    margin: '0 0 6px',
    color: 'var(--app-text)'
  }
}, "Your Workspaces"), /*#__PURE__*/React.createElement("p", {
  style: {
    fontSize: 13,
    color: 'var(--app-text-muted)',
    margin: '0 0 20px',
    lineHeight: 1.5
  }
}, "Pick a workspace to manage."), /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  }
}, workspaces.map(ws => /*#__PURE__*/React.createElement("button", {
  key: ws.id,
  onClick: () => onPick(ws),
  style: {
    all: 'unset',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    cursor: 'pointer',
    background: 'var(--app-card-bg)',
    border: '1px solid var(--app-card-border)',
    borderRadius: 18,
    padding: 16
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    width: 46,
    height: 46,
    borderRadius: 13,
    flexShrink: 0,
    backgroundImage: ws.gradient,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Montserrat',
    fontWeight: 900,
    fontSize: 16,
    color: '#14213D',
    letterSpacing: '-0.02em'
  }
}, ws.initials), /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1,
    minWidth: 0
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'Montserrat',
    fontWeight: 900,
    color: 'var(--app-text)',
    fontSize: 15,
    letterSpacing: '-0.01em'
  }
}, ws.name), /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 12,
    color: 'var(--app-text-muted)',
    marginTop: 2
  }
}, _wsStatLine(ws))), /*#__PURE__*/React.createElement(Icon, {
  name: "chev-right",
  size: 16,
  color: "var(--app-text-faint)"
}))), /*#__PURE__*/React.createElement("button", {
  onClick: onCreate,
  style: {
    all: 'unset',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    cursor: 'pointer',
    background: 'rgba(255,140,56,0.04)',
    border: '1.5px dashed rgba(255,140,56,0.50)',
    borderRadius: 18,
    padding: '16px 18px',
    marginTop: 2
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    fontFamily: 'Montserrat',
    fontWeight: 900,
    fontSize: 14.5,
    letterSpacing: '-0.01em',
    backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: 'transparent'
  }
}, "+ Create a workspace")))), /*#__PURE__*/React.createElement(TabBar, {
  active: "profile",
  onChange: t => onTab && onTab(t)
}));

// =============================================================
// ORGANIZER PROFILE — public, workspace-owned profile page. Viewable by
// guests (anonymous-browse applies, no account needed). Consumer-facing
// only: no tier badges, publish fees, or host economics anywhere here.
// =============================================================
const OrganizerProfileScreen = ({
  workspace = WORKSPACES[0],
  onBack,
  onSelect,
  onTab,
  desktop
}) => {
  const [pastOpen, setPastOpen] = React.useState(false);
  const upcoming = SAMPLE_EVENTS.filter(e => (workspace.eventIds || []).includes(e.id)).slice().sort((a, b) => new Date(a.startISO) - new Date(b.startISO));
  const past = workspace.pastEvents || [];
  const links = [workspace.website && {
    key: 'website',
    label: workspace.website
  }, workspace.socials?.instagram && {
    key: 'instagram',
    label: workspace.socials.instagram
  }, workspace.socials?.twitter && {
    key: 'twitter',
    label: workspace.socials.twitter
  }, workspace.socials?.facebook && {
    key: 'facebook',
    label: workspace.socials.facebook
  }].filter(Boolean);
  if (desktop) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        minHeight: '100%',
        boxSizing: 'border-box',
        background: 'var(--app-bg)',
        color: 'var(--app-text)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: 720,
        margin: '0 auto',
        padding: '40px 40px 80px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 28
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: onBack,
      "aria-label": "Back",
      style: {
        all: 'unset',
        cursor: 'pointer',
        width: 38,
        height: 38,
        borderRadius: 12,
        background: 'var(--app-card-bg)',
        border: '1px solid var(--app-card-border)',
        color: 'var(--app-text)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M19 12H5M12 19l-7-7 7-7"
    }))), /*#__PURE__*/React.createElement(Eyebrow, null, "Organizer Profile")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 22,
        marginBottom: 30
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 84,
        height: 84,
        borderRadius: 9999,
        flexShrink: 0,
        backgroundImage: workspace.gradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Montserrat',
        fontWeight: 900,
        fontSize: 28,
        color: '#14213D',
        letterSpacing: '-0.02em',
        boxShadow: '0 6px 22px rgba(255,95,78,0.24)'
      }
    }, workspace.initials), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0,
        paddingTop: 4
      }
    }, /*#__PURE__*/React.createElement("h1", {
      style: {
        fontFamily: 'Montserrat',
        fontSize: 26,
        fontWeight: 900,
        letterSpacing: '-0.01em',
        lineHeight: 1.08,
        margin: '0 0 8px',
        color: 'var(--app-text)'
      }
    }, workspace.name), workspace.bio && /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 13.5,
        color: 'var(--app-text-muted)',
        lineHeight: 1.55,
        margin: '0 0 10px'
      }
    }, workspace.bio), workspace.location && /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        marginBottom: 12
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "pin",
      size: 13,
      color: "#FCA311"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 700,
        color: 'var(--app-text-muted)'
      }
    }, workspace.location)), links.length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8
      }
    }, links.map(l => /*#__PURE__*/React.createElement("a", {
      key: l.key,
      href: "#",
      onClick: e => e.preventDefault(),
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        textDecoration: 'none',
        padding: '8px 14px',
        borderRadius: 9999,
        border: '1px solid var(--app-border-strong)',
        background: 'transparent'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "globe",
      size: 13,
      color: "var(--app-text-muted)"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 700,
        color: 'var(--app-text)'
      }
    }, l.label)))))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        margin: '0 0 14px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'Montserrat',
        fontWeight: 900,
        fontSize: 13,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: '#FCA311',
        whiteSpace: 'nowrap'
      }
    }, "Upcoming Events"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 800,
        color: 'var(--app-text-faint)'
      }
    }, upcoming.length), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        height: 1,
        background: 'linear-gradient(to right, rgba(252,163,17,0.25), transparent)'
      }
    })), upcoming.length > 0 ? /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
        marginBottom: 30
      }
    }, upcoming.map(e => /*#__PURE__*/React.createElement(EventStub, {
      variant: "compact",
      key: e.id,
      event: e,
      onTap: () => onSelect && onSelect(e)
    }))) : /*#__PURE__*/React.createElement("div", {
      style: {
        border: '1px dashed var(--app-card-border)',
        borderRadius: 18,
        padding: '22px 18px',
        textAlign: 'center',
        marginBottom: 30
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--app-text-faint)',
        lineHeight: 1.5
      }
    }, "No upcoming events right now \u2014 check back soon.")), /*#__PURE__*/React.createElement("div", {
      style: {
        borderRadius: 18,
        border: '1px solid var(--app-card-border)',
        background: 'var(--app-card-bg)',
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setPastOpen(o => !o),
      style: {
        all: 'unset',
        boxSizing: 'border-box',
        cursor: 'pointer',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '14px 16px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        fontFamily: 'Montserrat',
        fontWeight: 900,
        fontSize: 13,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        color: 'var(--app-text)'
      }
    }, "Past Events"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 800,
        color: 'var(--app-text-faint)'
      }
    }, past.length), /*#__PURE__*/React.createElement("span", {
      style: {
        transform: pastOpen ? 'rotate(90deg)' : 'none',
        transition: 'transform .2s ease',
        display: 'flex'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "chev-right",
      size: 15,
      color: "var(--app-text-faint)"
    }))), pastOpen && /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '0 16px 18px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16
      }
    }, past.length > 0 ? past.map(e => /*#__PURE__*/React.createElement(EventStub, {
      variant: "compact",
      key: e.id,
      event: e,
      onTap: () => onSelect && onSelect(e)
    })) : /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--app-text-faint)'
      }
    }, "No past events yet.")))));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px 24px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    "aria-label": "Back",
    style: {
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.10)',
      color: '#fff',
      width: 36,
      height: 36,
      borderRadius: 10,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "white",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M19 12H5M12 19l-7-7 7-7"
  }))), /*#__PURE__*/React.createElement(Eyebrow, null, "Organizer Profile")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: '0 24px 100px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 72,
      height: 72,
      borderRadius: 9999,
      flexShrink: 0,
      backgroundImage: workspace.gradient,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 24,
      color: '#14213D',
      letterSpacing: '-0.02em',
      boxShadow: '0 6px 22px rgba(255,95,78,0.24)',
      marginBottom: 16
    }
  }, workspace.initials), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'Montserrat',
      fontSize: 26,
      fontWeight: 900,
      letterSpacing: '-0.01em',
      lineHeight: 1.08,
      margin: '0 0 8px',
      color: '#fff'
    }
  }, workspace.name), workspace.bio && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13.5,
      color: 'rgba(238,240,255,0.65)',
      lineHeight: 1.55,
      margin: '0 0 10px'
    }
  }, workspace.bio), workspace.location && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "pin",
    size: 13,
    color: "#FCA311"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: 'rgba(238,240,255,0.55)'
    }
  }, workspace.location)), links.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 28
    }
  }, links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l.key,
    href: "#",
    onClick: e => e.preventDefault(),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      textDecoration: 'none',
      padding: '8px 14px',
      borderRadius: 9999,
      border: '1px solid rgba(255,255,255,0.18)',
      background: 'transparent'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "globe",
    size: 13,
    color: "rgba(238,240,255,0.70)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: 'rgba(238,240,255,0.80)'
    }
  }, l.label)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      margin: '0 0 13px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 13,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: '#FCA311',
      whiteSpace: 'nowrap'
    }
  }, "Upcoming Events"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 800,
      color: 'rgba(238,240,255,0.40)'
    }
  }, upcoming.length), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: 'linear-gradient(to right, rgba(252,163,17,0.25), transparent)'
    }
  })), upcoming.length > 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      marginBottom: 30
    }
  }, upcoming.map(e => /*#__PURE__*/React.createElement(EventStub, {
    variant: "compact",
    key: e.id,
    event: e,
    onTap: () => onSelect && onSelect(e)
  }))) : /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px dashed rgba(255,255,255,0.12)',
      borderRadius: 18,
      padding: '22px 18px',
      textAlign: 'center',
      marginBottom: 30
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'rgba(238,240,255,0.45)',
      lineHeight: 1.5
    }
  }, "No upcoming events right now \u2014 check back soon.")), /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 18,
      border: '1px solid rgba(255,255,255,0.08)',
      background: 'rgba(255,255,255,0.02)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setPastOpen(o => !o),
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '14px 16px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 13,
      letterSpacing: '0.10em',
      textTransform: 'uppercase',
      color: '#fff'
    }
  }, "Past Events"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 800,
      color: 'rgba(238,240,255,0.40)'
    }
  }, past.length), /*#__PURE__*/React.createElement("span", {
    style: {
      transform: pastOpen ? 'rotate(90deg)' : 'none',
      transition: 'transform .2s ease',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chev-right",
    size: 15,
    color: "rgba(238,240,255,0.45)"
  }))), pastOpen && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, past.length > 0 ? past.map(e => /*#__PURE__*/React.createElement(EventStub, {
    variant: "compact",
    key: e.id,
    event: e,
    onTap: () => onSelect && onSelect(e)
  })) : /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'rgba(238,240,255,0.45)'
    }
  }, "No past events yet.")))), /*#__PURE__*/React.createElement(TabBar, {
    active: "profile",
    onChange: t => onTab && onTab(t)
  }));
};

// =============================================================
// EDIT PUBLIC PROFILE — Workspace-housed editor for the fields that render
// on the public Organizer Profile: logo, name, bio, website, socials.
// Every field patches workspace state directly, so changes are live the
// moment the public profile is (re)opened. Nothing here touches the
// personal Edit Profile, events, or pricing.
// =============================================================
const EditOrganizerProfileScreen = ({
  workspace = WORKSPACES[0],
  onBack,
  onChange,
  onPreview,
  onTab
}) => {
  const setField = (key, val) => onChange({
    [key]: val
  });
  const setSocial = (key, val) => onChange(w => ({
    socials: {
      ...(w.socials || {}),
      [key]: val
    }
  }));
  const label = {
    display: 'block',
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'rgba(238,240,255,0.45)',
    marginBottom: 8
  };
  const input = {
    width: '100%',
    boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: '12px 14px',
    color: '#eef0ff',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: 600,
    outline: 'none'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px 24px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    "aria-label": "Back",
    style: {
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.10)',
      color: '#fff',
      width: 36,
      height: 36,
      borderRadius: 10,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "white",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M19 12H5M12 19l-7-7 7-7"
  }))), /*#__PURE__*/React.createElement(Eyebrow, null, "Workspace \xB7 Public Profile")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: '0 24px 40px'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'Montserrat',
      fontSize: 26,
      fontWeight: 900,
      letterSpacing: '-0.01em',
      margin: '0 0 6px',
      color: '#fff'
    }
  }, "Edit Public Profile"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12.5,
      color: 'rgba(238,240,255,0.55)',
      lineHeight: 1.5,
      margin: '0 0 4px'
    }
  }, "Your organizer page \u2014 what the public sees."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12.5,
      color: 'rgba(238,240,255,0.55)',
      lineHeight: 1.5,
      margin: '0 0 22px'
    }
  }, "Changes here update your public Organizer Profile immediately."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: 26
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 88,
      height: 88,
      borderRadius: 9999,
      backgroundImage: workspace.gradient,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#14213D',
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 30
    }
  }, workspace.initials), /*#__PURE__*/React.createElement("button", {
    "aria-label": "Change logo",
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 30,
      height: 30,
      borderRadius: 9999,
      background: '#14213D',
      border: '2px solid #14213D',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      borderRadius: 9999,
      background: 'rgba(255,255,255,0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "image",
    size: 14,
    color: "#FCA311"
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: label
  }, "Workspace name"), /*#__PURE__*/React.createElement("input", {
    style: input,
    value: workspace.name || '',
    onChange: e => setField('name', e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: label
  }, "Bio"), /*#__PURE__*/React.createElement("textarea", {
    style: {
      ...input,
      resize: 'none',
      lineHeight: 1.5
    },
    rows: 3,
    value: workspace.bio || '',
    onChange: e => setField('bio', e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: label
  }, "Website"), /*#__PURE__*/React.createElement("input", {
    style: input,
    placeholder: "yoursite.com",
    value: workspace.website || '',
    onChange: e => setField('website', e.target.value)
  })), /*#__PURE__*/React.createElement("span", {
    style: label
  }, "Social links"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("input", {
    style: input,
    placeholder: "Instagram",
    value: workspace.socials?.instagram || '',
    onChange: e => setSocial('instagram', e.target.value)
  }), /*#__PURE__*/React.createElement("input", {
    style: input,
    placeholder: "Twitter / X",
    value: workspace.socials?.twitter || '',
    onChange: e => setSocial('twitter', e.target.value)
  }), /*#__PURE__*/React.createElement("input", {
    style: input,
    placeholder: "Facebook",
    value: workspace.socials?.facebook || '',
    onChange: e => setSocial('facebook', e.target.value)
  })), /*#__PURE__*/React.createElement("button", {
    onClick: onPreview,
    style: {
      all: 'unset',
      boxSizing: 'border-box',
      cursor: 'pointer',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: '13px 18px',
      borderRadius: 14,
      border: '1px solid rgba(252,163,17,0.40)',
      background: 'rgba(252,163,17,0.08)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "user",
    size: 14,
    color: "#FCA311"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 800,
      color: '#FCA311'
    }
  }, "Preview public profile"))), /*#__PURE__*/React.createElement(TabBar, {
    active: "profile",
    onChange: t => onTab && onTab(t)
  }));
};
Object.assign(window, {
  LandingScreen,
  ExploreScreen,
  EventDetailScreen,
  WorkspaceScreen,
  WorkspacePickerScreen,
  MeScreen,
  SavedScreen,
  BackstageDemo,
  WORKSPACES,
  OrganizerProfileScreen,
  EditOrganizerProfileScreen,
  // Exposed for the demo walkthrough so it can pin Explore to a specific view.
  SAMPLE_EVENTS,
  INTERESTS,
  VIEW_LABELS,
  ViewSwitcher,
  MapView,
  TimeView,
  DateRangeBar,
  DateInputPill,
  todayLocalYMD
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile-app/Screens.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile-app/event-stub.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
  Markets: '#2dd4bf',
  Music: '#f472b6',
  Art: '#a78bfa',
  Food: '#fbbf24',
  Community: '#fb923c',
  'Pop-Ups': '#38bdf8',
  Outdoors: '#84cc16',
  Family: '#fb7185',
  Live: '#ff6348'
};
function _catColor(tags) {
  for (const t of tags || []) {
    if (CATEGORY_COLOR[t]) return CATEGORY_COLOR[t];
  }
  return '#FCA311';
}
function _twoTags(tags) {
  return (tags || []).slice(0, 2).join(' · ').toUpperCase();
}
function _timeStr(d) {
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return m ? `${h}:${String(m).padStart(2, '0')}${ap}` : `${h}${ap}`;
}
function _shortDate(d) {
  const mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
  return `${wd} ${mo} ${d.getDate()}`;
}

// Derive the countdown shown in the utility column.
//  • Same-day events tick hourly; inside the final hour → "less than an hour".
//  • Future events count whole days ("2 Days", "1 Day").
//  • Anything already started reads "Now / Happening".
function eventCountdown(startISO) {
  if (!startISO) return {
    value: '—',
    label: '',
    sub: ''
  };
  const start = new Date(startISO).getTime();
  const diff = start - Date.now();
  if (diff <= 0) return {
    value: 'Now',
    label: 'Happening',
    sub: '',
    live: true
  };
  const mins = diff / 60000;
  const sd = new Date(startISO);
  const nd = new Date();
  const sameDay = sd.getFullYear() === nd.getFullYear() && sd.getMonth() === nd.getMonth() && sd.getDate() === nd.getDate();
  if (sameDay) {
    if (mins < 60) return {
      value: '<1h',
      label: 'Starts in',
      sub: 'less than an hour',
      urgent: true
    };
    return {
      value: Math.floor(mins / 60) + 'h',
      label: 'Starts in',
      sub: _timeStr(sd)
    };
  }
  const days = Math.ceil(diff / 86400000);
  return {
    value: String(days),
    label: days === 1 ? 'Day' : 'Days',
    sub: _shortDate(sd)
  };
}
const _SIcon = ({
  name,
  size = 13,
  color = 'currentColor',
  fill = 'none'
}) => {
  const p = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill,
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
  };
  switch (name) {
    case 'cal':
      return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("rect", {
        x: "3",
        y: "4",
        width: "18",
        height: "18",
        rx: "2"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M16 2v4M8 2v4M3 10h18"
      }));
    case 'clock':
      return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "10"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M12 6v6l4 2"
      }));
    case 'pin':
      return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("path", {
        d: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "10",
        r: "3"
      }));
    case 'bookmark':
      return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("path", {
        d: "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
      }));
    case 'bookmark-fill':
      return /*#__PURE__*/React.createElement("svg", _extends({}, p, {
        fill: color
      }), /*#__PURE__*/React.createElement("path", {
        d: "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
      }));
    case 'share':
      return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("circle", {
        cx: "18",
        cy: "5",
        r: "3"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "6",
        cy: "12",
        r: "3"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "18",
        cy: "19",
        r: "3"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "8.59",
        y1: "13.51",
        x2: "15.42",
        y2: "17.49"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "15.41",
        y1: "6.51",
        x2: "8.59",
        y2: "10.49"
      }));
    case 'check':
      return /*#__PURE__*/React.createElement("svg", p, /*#__PURE__*/React.createElement("path", {
        d: "M20 6 9 17l-5-5"
      }));
    default:
      return null;
  }
};

// Perforated vertical divider with ticket notches top & bottom.
const _Perf = () => /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'relative',
    width: 2,
    alignSelf: 'stretch',
    margin: '12px 0',
    display: 'flex',
    justifyContent: 'center'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    width: 0,
    borderLeft: '2px dotted var(--app-text-hint, rgba(238,240,255,0.22))',
    height: '100%'
  }
}), /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    top: -18,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 14,
    height: 14,
    borderRadius: '50%',
    background: 'var(--app-bg)'
  }
}), /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    bottom: -18,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 14,
    height: 14,
    borderRadius: '50%',
    background: 'var(--app-bg)'
  }
}));
const _UtilCol = ({
  cd,
  center,
  gradient,
  children
}) => {
  // Countdown numeral: spark gradient on compact (Saved) stubs, solid amber on
  // the photo stub. Live ('Now') always burns coral.
  const bigStyle = {
    fontFamily: 'Montserrat',
    fontWeight: 900,
    fontSize: cd.urgent ? 15 : 22,
    lineHeight: 1
  };
  if (gradient && !cd.live) {
    Object.assign(bigStyle, {
      backgroundImage: STUB_SPARK,
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      color: 'transparent'
    });
  } else {
    bigStyle.color = cd.live ? '#ff6348' : '#FCA311';
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 84,
      flexShrink: 0,
      padding: '12px 8px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: center ? 'center' : 'space-between',
      gap: 12,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: bigStyle
  }, cd.value), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8,
      fontWeight: 900,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--app-text-faint)',
      marginTop: 5,
      lineHeight: 1.3,
      whiteSpace: 'nowrap'
    }
  }, cd.label), cd.sub && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8,
      color: 'var(--app-text-faint)',
      marginTop: 4,
      lineHeight: 1.2,
      whiteSpace: 'nowrap'
    }
  }, cd.sub)), children);
};
const _MetaLine = ({
  icon,
  iconColor,
  children
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    minWidth: 0
  }
}, /*#__PURE__*/React.createElement(_SIcon, {
  name: icon,
  size: 12,
  color: iconColor
}), /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 11.5,
    color: 'var(--app-text-muted)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  }
}, children));

// Up to `max` category badges, then a "+N" overflow chip so the card never
// visually breaks no matter how many categories an organizer selects.
const _CatPill = ({
  tags,
  max = 3,
  style
}) => {
  const list = (tags || []).filter(Boolean);
  const shown = list.slice(0, max);
  const extra = list.length - shown.length;
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 9px',
    borderRadius: 9999,
    background: 'rgba(15,26,48,0.72)',
    backdropFilter: 'blur(6px)',
    border: '1px solid rgba(252,163,17,0.30)',
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: '0.14em',
    color: '#FCA311',
    whiteSpace: 'nowrap'
  };
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      ...style
    }
  }, shown.map((t, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: base
  }, String(t).toUpperCase())), extra > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      ...base,
      color: '#eef0ff',
      border: '1px solid rgba(255,255,255,0.20)',
      letterSpacing: '0.04em'
    }
  }, "+", extra));
};
const _PriceChip = ({
  price,
  style,
  hide
}) => hide ? null : /*#__PURE__*/React.createElement("span", {
  style: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: 9999,
    background: 'rgba(15,26,48,0.72)',
    backdropFilter: 'blur(6px)',
    border: '1px solid rgba(255,255,255,0.16)',
    fontSize: 11,
    fontWeight: 800,
    color: '#fff',
    ...style
  }
}, !price ? 'Free' : '$' + price);
const _StatusChip = ({
  going,
  saved
}) => {
  if (!going && !saved) return null;
  // Going burns green (#4ade80, committed). Saved is a muted, unfilled state.
  const c = going ? '#4ade80' : 'rgba(238,240,255,0.62)';
  const bg = going ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.05)';
  const bd = going ? 'rgba(74,222,128,0.36)' : 'rgba(238,240,255,0.16)';
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '4px 9px',
      borderRadius: 9999,
      background: bg,
      border: `1px solid ${bd}`,
      fontSize: 10.5,
      fontWeight: 800,
      color: c
    }
  }, /*#__PURE__*/React.createElement(_SIcon, {
    name: going ? 'check' : 'bookmark-fill',
    size: 11,
    color: c
  }), going ? 'Going' : 'Saved');
};
function _stubBtn(active) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 9,
    cursor: 'pointer',
    padding: 0,
    background: active ? 'rgba(252,163,17,0.14)' : 'rgba(255,255,255,0.07)',
    border: `1px solid ${active ? 'rgba(252,163,17,0.35)' : 'rgba(255,255,255,0.12)'}`
  };
}
const EventStubCard = ({
  event,
  variant = 'photo',
  onTap,
  onSave,
  onShare,
  pastRadius = null,
  hidePrice = false,
  priceInBody = false
}) => {
  // Live tick — re-render each minute so the countdown stays accurate
  // (covers the hourly cadence and the final-hour "less than an hour" flip).
  const [, force] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => force(t => t + 1), 60000);
    return () => clearInterval(id);
  }, []);
  const [saved, setSaved] = React.useState(!!event.saved);
  const cd = eventCountdown(event.startISO);
  // Overflow ("just past your radius") cards reuse this exact stub but step
  // back: the whole card is desaturated + dimmed and the stripe goes muted.
  const stepped = pastRadius != null;
  const shell = {
    display: 'flex',
    alignItems: 'stretch',
    width: '100%',
    textAlign: 'left',
    background: 'var(--app-card-bg)',
    border: '1px solid var(--app-card-border)',
    borderRadius: 24,
    overflow: 'hidden',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(0,0,0,0.20)',
    opacity: stepped ? 0.82 : 1,
    filter: stepped ? 'saturate(0.55)' : 'none'
  };
  const stripe = /*#__PURE__*/React.createElement("div", {
    style: {
      width: 5,
      flexShrink: 0,
      background: stepped ? 'linear-gradient(180deg,#5b5650,#6a6358,#5b5650)' : STUB_STRIPE
    }
  });
  if (variant === 'compact') {
    return /*#__PURE__*/React.createElement("div", {
      onClick: onTap,
      style: shell
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 5,
        flexShrink: 0,
        background: _catColor(event.tags)
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0,
        padding: '13px 15px'
      }
    }, /*#__PURE__*/React.createElement(_CatPill, {
      tags: event.tags
    }), /*#__PURE__*/React.createElement("h3", {
      style: {
        fontFamily: 'Montserrat',
        fontWeight: 900,
        fontSize: 16,
        letterSpacing: '-0.01em',
        margin: '9px 0 0',
        lineHeight: 1.15,
        color: 'var(--app-text)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, event.title), /*#__PURE__*/React.createElement(_MetaLine, {
      icon: "clock",
      iconColor: "#ff6348"
    }, event.time), /*#__PURE__*/React.createElement(_MetaLine, {
      icon: "pin",
      iconColor: "#FCA311"
    }, event.location), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        marginTop: 10
      }
    }, /*#__PURE__*/React.createElement(_StatusChip, {
      going: event.going,
      saved: saved
    }), typeof event.rsvps === 'number' && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: 'var(--app-text-faint)'
      }
    }, event.rsvps, " RSVPs"))), /*#__PURE__*/React.createElement(_Perf, null), /*#__PURE__*/React.createElement(_UtilCol, {
      cd: cd,
      center: true,
      gradient: true
    }, /*#__PURE__*/React.createElement("button", {
      onClick: e => {
        e.stopPropagation();
        setSaved(s => !s);
        onSave && onSave(event);
      },
      "aria-label": saved ? 'Saved' : 'Save',
      style: _stubBtn(saved)
    }, /*#__PURE__*/React.createElement(_SIcon, {
      name: saved ? 'bookmark-fill' : 'bookmark',
      size: 13,
      color: saved ? '#FCA311' : '#fff'
    }))));
  }
  return /*#__PURE__*/React.createElement("div", {
    onClick: onTap,
    style: shell
  }, stripe, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 150,
      position: 'relative',
      background: event.gradient || 'linear-gradient(135deg,#5b3220,#a8551d 60%,#e09c3a)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(to top, rgba(20,33,61,0.78), transparent 60%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 12,
      left: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(_CatPill, {
    tags: event.tags
  }), stepped && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
      padding: '4px 9px 4px 7px',
      borderRadius: 9999,
      background: 'linear-gradient(135deg,#ff8c38,#ffca3a)',
      color: '#14213D',
      fontSize: 9.5,
      fontWeight: 900,
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement(_SIcon, {
    name: "pin",
    size: 10,
    color: "#14213D"
  }), "+", pastRadius, " mi")), /*#__PURE__*/React.createElement(_PriceChip, {
    price: event.price,
    hide: hidePrice || priceInBody,
    style: {
      position: 'absolute',
      top: 12,
      right: 12
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'stretch'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      padding: '13px 15px'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'Montserrat',
      fontWeight: 900,
      fontSize: 18,
      letterSpacing: '-0.01em',
      margin: 0,
      lineHeight: 1.12,
      color: 'var(--app-text)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, event.title), /*#__PURE__*/React.createElement(_MetaLine, {
    icon: "cal",
    iconColor: "#ff6348"
  }, event.date, " \xB7 ", event.time), /*#__PURE__*/React.createElement(_MetaLine, {
    icon: "pin",
    iconColor: "#FCA311"
  }, event.location, typeof event.mi === 'number' ? ` · ${event.mi} mi` : ''), priceInBody && (event.price ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 12,
      height: 12,
      flexShrink: 0,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter',
      fontWeight: 600,
      fontSize: 13,
      lineHeight: 1,
      color: 'var(--app-green)'
    }
  }, "$"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 600,
      color: 'var(--app-text)',
      whiteSpace: 'nowrap',
      flexShrink: 0
    }
  }, event.price, " per person")) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      marginTop: 6,
      padding: '5px 12px',
      borderRadius: 999,
      background: 'rgba(74,222,128,0.14)',
      border: '1px solid rgba(74,222,128,0.35)'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "var(--app-green)",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M4 9.5V7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2.5a2.5 2.5 0 0 0 0 5V17a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2.5a2.5 2.5 0 0 0 0-5Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M14.5 6v12",
    strokeDasharray: "2 2.5"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: 'var(--app-green)',
      whiteSpace: 'nowrap',
      flexShrink: 0
    }
  }, "Free")))), /*#__PURE__*/React.createElement(_Perf, null), /*#__PURE__*/React.createElement(_UtilCol, {
    cd: cd
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      setSaved(s => !s);
      onSave && onSave(event);
    },
    "aria-label": saved ? 'Saved' : 'Save',
    style: _stubBtn(saved)
  }, /*#__PURE__*/React.createElement(_SIcon, {
    name: saved ? 'bookmark-fill' : 'bookmark',
    size: 13,
    color: saved ? '#FCA311' : '#fff'
  })), /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      onShare && onShare(event);
    },
    "aria-label": "Share",
    style: _stubBtn(false)
  }, /*#__PURE__*/React.createElement(_SIcon, {
    name: "share",
    size: 13,
    color: "#fff"
  })))))));
};

// Expose under the runtime-global name the screens reference. The canonical,
// typed component lives at components/EventStub/EventStub.tsx (DS registry);
// this is its Babel-runtime twin for the in-page prototype.
window.EventStub = EventStubCard;
window.eventCountdown = eventCountdown;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile-app/event-stub.jsx", error: String((e && e.message) || e) }); }

__ds_ns.EventStub = __ds_scope.EventStub;

__ds_ns.SparkedLogo = __ds_scope.SparkedLogo;

})();

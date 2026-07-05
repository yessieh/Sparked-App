// Five mobile-first landing variations for Sparked.
// Each Variation* is a Phone interior - no scaling; the canvas handles that.

// ------ V1 : DISCOVERY FIRST ----------------------------------------
// Lead with proximity + a live count, browse is the primary action,
// organizer entry is a quiet secondary line at the bottom.
const V1 = () => (
  <>
    <PStatus />
    {/* glow */}
    <div style={{ position: 'absolute', top: -40, left: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,99,72,0.30)', filter: 'blur(60px)' }}></div>
    <div style={{ padding: '4px 18px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
      <SparkLogoMini size={18} />
      <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>Log in</span>
    </div>

    <div style={{ flex: 1, overflow: 'hidden', padding: '4px 18px 14px', position: 'relative' }}>
      <Eye>Tonight in Phoenix</Eye>
      <h1 style={{
        fontFamily: 'Montserrat', fontSize: 28, fontWeight: 900,
        lineHeight: 1.0, letterSpacing: '-0.01em', margin: '8px 0 14px', color: '#fff',
      }}>
        47 events <br/>
        <span style={{ backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>within 5 miles.</span>
      </h1>
      <p style={{ fontSize: 11.5, color: 'rgba(238,240,255,0.6)', lineHeight: 1.5, margin: '0 0 14px' }}>
        Skip the algorithm. See what's actually near you right now.
      </p>

      {/* faux map */}
      <div style={{
        height: 200, borderRadius: 18, position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(circle at 40% 30%, #243a64 0%, #0f1a30 70%)',
        border: '1px solid rgba(255,255,255,0.08)', marginBottom: 14,
      }}>
        {/* grid lines */}
        {[...Array(6)].map((_,i)=><div key={'h'+i} style={{ position:'absolute', left:0, right:0, top:`${15+i*15}%`, height:1, background:'rgba(255,255,255,0.04)' }}/>)}
        {[...Array(5)].map((_,i)=><div key={'v'+i} style={{ position:'absolute', top:0, bottom:0, left:`${15+i*18}%`, width:1, background:'rgba(255,255,255,0.04)' }}/>)}
        {/* pins */}
        {[
          { l:25, t:30, n:8, c:'#ff5f4e' },
          { l:55, t:48, n:14, c:'#FCA311' },
          { l:35, t:65, n:5, c:'#ffca3a' },
          { l:72, t:25, n:3, c:'#ff8c38' },
          { l:78, t:70, n:17, c:'#ff5f4e' },
        ].map((pin,i)=>(
          <div key={i} style={{
            position: 'absolute', left: `${pin.l}%`, top: `${pin.t}%`, transform: 'translate(-50%,-50%)',
            background: pin.c, color: '#14213D', fontFamily: 'Montserrat', fontWeight: 900, fontSize: 10,
            width: 22 + pin.n*0.6, height: 22 + pin.n*0.6, borderRadius: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 0 3px ${pin.c}40, 0 0 14px ${pin.c}80`,
          }}>{pin.n}</div>
        ))}
        {/* current loc */}
        <div style={{ position:'absolute', left:'50%', top:'52%', transform:'translate(-50%,-50%)' }}>
          <div style={{ width:14, height:14, background:'#3b82f6', borderRadius:9999, boxShadow:'0 0 0 4px rgba(59,130,246,0.30)' }}></div>
        </div>
      </div>

      <PrimaryCTA size="lg">Browse Local Events <I name="arrow" size={14} color="#14213D" /></PrimaryCTA>
    </div>

    <div style={{
      padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.05)',
      background: 'rgba(15,26,48,0.6)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
    }}>
      <div>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: '#fff' }}>Run events?</div>
        <div style={{ fontSize: 9, color: 'rgba(238,240,255,0.55)' }}>Reach the people next door.</div>
      </div>
      <TextLink>List an event →</TextLink>
    </div>
  </>
);

// ------ V2 : TONIGHT'S PICK (single hero card) ----------------------
// Magazine-cover treatment: one curated event fills the viewport.
// Swipe-down indicator hints at the feed below.
const V2 = () => (
  <>
    <div style={{ position: 'absolute', inset: 0, background: EVENTS[0].grad }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #14213D 18%, rgba(20,33,61,0.50) 55%, transparent 100%)' }}></div>
    </div>
    <PStatus />
    <div style={{ padding: '6px 18px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', flexShrink: 0 }}>
      <SparkLogoMini size={18} />
      <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.8)' }}>Skip</span>
    </div>

    <div style={{ flex: 1, padding: '14px 18px 0', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <Eye color="#ffca3a">Editor's Pick · Tonight</Eye>
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <LiveDot size={7}/>
        <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.20em', color: '#fff', textTransform: 'uppercase' }}>Live in 1h 20m</span>
      </div>
      <div style={{ flex: 1 }}></div>
      <h1 style={{
        fontFamily: 'Montserrat', fontSize: 36, fontWeight: 900,
        lineHeight: 0.95, letterSpacing: '-0.02em', margin: '0 0 12px', color: '#fff',
      }}>{EVENTS[0].name}</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.85)', fontSize: 11, marginBottom: 4 }}>
        <I name="pin" size={11} color="#FCA311" /><span>{EVENTS[0].loc} · {EVENTS[0].dist}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.85)', fontSize: 11, marginBottom: 16 }}>
        <I name="clock" size={11} color="#ff5f4e" /><span>{EVENTS[0].time}</span>
      </div>
      <PrimaryCTA size="lg">Open in Sparked</PrimaryCTA>
      <div style={{ textAlign: 'center', marginTop: 12, marginBottom: 10 }}>
        <I name="arrow-down" size={16} color="rgba(255,255,255,0.6)" />
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: 800, letterSpacing: '0.20em', textTransform: 'uppercase', marginTop: 2 }}>46 more nearby</div>
      </div>
    </div>
  </>
);

// ------ V3 : THIS WEEK, NEAR YOU --------------------------------
// Anti-algorithm positioning. Eyebrow carries "No algorithm" microcopy,
// flat H1 (no gradient), swipeable strip of real events, category index
// for "this week." Brand color lives only on the logo + final CTA.
const V3 = () => (
  <>
    <PStatus />
    <div style={{ padding: '6px 18px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
      <SparkLogoMini size={18} />
      <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>Log in</span>
    </div>

    <div style={{ flex: 1, overflow: 'auto', padding: '0 18px 14px' }}>
      {/* Eyebrow with locked-in "No algorithm" placement */}
      <Eye>Tonight in Phoenix · No algorithm</Eye>

      {/* Flat H1 - no gradient. Brand color is reserved for the CTA. */}
      <h1 style={{
        fontFamily: 'Montserrat', fontSize: 30, fontWeight: 900,
        lineHeight: 0.95, letterSpacing: '-0.01em', margin: '8px 0 8px', color: '#fff',
      }}>
        YOUR CITY.<br/>YOUR EVENTS.
      </h1>
      <p style={{ fontSize: 11.5, color: 'rgba(238,240,255,0.65)', lineHeight: 1.5, margin: '0 0 14px' }}>
        Skip the algorithm. See what's actually going on near you this week.
      </p>

      {/* Swipeable strip - horizontal scroll with snap, peeking tiles */}
      <div style={{
        display: 'flex', gap: 10, overflowX: 'auto',
        scrollSnapType: 'x mandatory', scrollPaddingLeft: 18,
        margin: '0 -18px 16px', padding: '0 18px',
        scrollbarWidth: 'none',
      }}>
        {EVENTS.map(e => (
          <div key={e.id} style={{
            flex: '0 0 auto', width: 158, scrollSnapAlign: 'start',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14, overflow: 'hidden',
          }}>
            <div style={{ height: 96, background: e.grad, position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(20,33,61,0.65), transparent 55%)' }}></div>
              {e.live && (
                <div style={{ position: 'absolute', top: 8, left: 8 }}>
                  <LiveDot size={6}/>
                </div>
              )}
              <div style={{
                position: 'absolute', top: 8, right: 8,
                background: 'rgba(15,26,48,0.70)', backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255,255,255,0.10)',
                padding: '2px 7px', borderRadius: 9999,
                fontSize: 8, fontWeight: 900, color: '#fff', letterSpacing: '0.10em',
              }}>{e.dist}</div>
            </div>
            <div style={{ padding: '10px 11px 11px' }}>
              <div style={{
                fontFamily: 'Montserrat', fontWeight: 900, fontSize: 12, color: '#fff',
                letterSpacing: '-0.01em', lineHeight: 1.15, marginBottom: 4,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>{e.name}</div>
              <div style={{ fontSize: 9.5, color: 'rgba(238,240,255,0.55)' }}>{e.time}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Category index - keep, this is what V3 brings */}
      <Eye>This week</Eye>
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 0 }}>
        {[
          { icon: 'mic', label: 'Live music', count: 12 },
          { icon: 'store', label: 'Markets & makers', count: 8 },
          { icon: 'palette', label: 'Art & galleries', count: 14 },
          { icon: 'tent', label: 'Pop-ups & outdoor', count: 7 },
        ].map((row, i) => (
          <div key={row.label} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(252,163,17,0.10)', color: '#FCA311',
              border: '1px solid rgba(252,163,17,0.25)',
            }}><I name={row.icon} size={14}/></div>
            <span style={{ flex: 1, color: '#fff', fontWeight: 700, fontSize: 12 }}>{row.label}</span>
            <span style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 14, color: '#F7B731' }}>{row.count}</span>
            <I name="arrow" size={11} color="rgba(255,255,255,0.4)"/>
          </div>
        ))}
      </div>
    </div>

    <div style={{ padding: '10px 18px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
      <PrimaryCTA size="md">Start browsing</PrimaryCTA>
    </div>
  </>
);

// ------ V4 : LIVE NOW (social / stories) ------------------------------
// Horizontal stories row up top, vertical feed below.
const V4 = () => (
  <>
    <PStatus />
    <div style={{ padding: '6px 18px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
      <SparkLogoMini size={18} />
      <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>Log in</span>
    </div>

    {/* stories row */}
    <div style={{ padding: '4px 12px 12px', flexShrink: 0 }}>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
        {[
          { name: 'The Rebel', live: true, c: '#7a2a6a' },
          { name: 'Roosevelt', live: true, c: '#3a8e5c' },
          { name: 'WrhseArts', live: false, c: '#a8551d' },
          { name: 'Print Soc.', live: false, c: '#5d7a98' },
          { name: 'CivicPark', live: false, c: '#3a5a8c' },
        ].map(s => (
          <div key={s.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 9999, padding: 2,
              background: s.live ? 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' : 'rgba(255,255,255,0.10)',
            }}>
              <div style={{ width: '100%', height: '100%', borderRadius: 9999, background: s.c, border: '2px solid #14213D' }}></div>
            </div>
            <span style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.7)', fontWeight: 700, maxWidth: 56, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
          </div>
        ))}
      </div>
    </div>

    {/* hero text */}
    <div style={{ padding: '0 18px 12px', flexShrink: 0 }}>
      <h1 style={{
        fontFamily: 'Montserrat', fontSize: 24, fontWeight: 900,
        lineHeight: 1.0, letterSpacing: '-0.01em', margin: 0, color: '#fff',
      }}>
        Happening <span style={{ backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>now.</span>
      </h1>
      <p style={{ fontSize: 11, color: 'rgba(238,240,255,0.6)', margin: '4px 0 0' }}>
        From your neighbors, not an algorithm.
      </p>
    </div>

    {/* feed */}
    <div style={{ flex: 1, overflow: 'hidden', padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {EVENTS.slice(0,2).map(e => (
        <div key={e.id} style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14, padding: 10, display: 'flex', gap: 10, alignItems: 'center',
        }}>
          <div style={{ width: 54, height: 54, borderRadius: 11, background: e.grad, flexShrink: 0, position: 'relative' }}>
            {e.live && <div style={{ position: 'absolute', top: 4, right: 4 }}><LiveDot size={5}/></div>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Montserrat', fontWeight: 900, color: '#fff', fontSize: 12, marginBottom: 3, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</div>
            <div style={{ fontSize: 9.5, color: 'rgba(238,240,255,0.6)' }}>{e.time} · {e.dist}</div>
          </div>
        </div>
      ))}
    </div>

    {/* sticky CTA */}
    <div style={{
      padding: '10px 14px 14px', borderTop: '1px solid rgba(255,255,255,0.05)',
      background: 'rgba(15,26,48,0.85)', backdropFilter: 'blur(8px)', flexShrink: 0,
    }}>
      <PrimaryCTA size="md">See all 47 events</PrimaryCTA>
    </div>
  </>
);

// ------ V5 : TWO DOORS (explicit audience split) ----------------------
// Upper half - consumer (browse). Lower half - organizer (list).
// Both surfaced, no hierarchy ambiguity.
const V5 = () => (
  <>
    <PStatus />
    <div style={{ padding: '6px 18px 12px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
      <SparkLogoMini size={18} />
    </div>

    {/* Consumer door */}
    <div style={{
      margin: '0 14px 8px', borderRadius: 18, padding: 18, position: 'relative', overflow: 'hidden',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      flex: 1, display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ position: 'absolute', top: -30, right: -20, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,99,72,0.20)', filter: 'blur(40px)' }}></div>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)' }}></div>
      <Eye color="#ffca3a">For neighbors</Eye>
      <h2 style={{
        fontFamily: 'Montserrat', fontSize: 22, fontWeight: 900,
        lineHeight: 1.0, letterSpacing: '-0.01em', margin: '8px 0 6px', color: '#fff',
      }}>Find what's <br/>near you.</h2>
      <p style={{ fontSize: 10.5, color: 'rgba(238,240,255,0.60)', lineHeight: 1.5, margin: '0 0 14px' }}>
        47 local events this week. No login, no algorithm.
      </p>
      <div style={{ marginTop: 'auto' }}>
        <PrimaryCTA size="md">Browse near me <I name="arrow" size={12} color="#14213D"/></PrimaryCTA>
      </div>
    </div>

    {/* Organizer door */}
    <div style={{
      margin: '0 14px 14px', borderRadius: 18, padding: 14,
      background: '#0f1a30', border: '1px solid rgba(255,255,255,0.08)',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, background: 'rgba(252,163,17,0.10)',
          border: '1px solid rgba(252,163,17,0.30)', color: '#FCA311',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><I name="megaphone" size={14}/></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Eye>For organizers</Eye>
          <div style={{ fontFamily: 'Montserrat', color: '#fff', fontWeight: 900, fontSize: 13, marginTop: 2, letterSpacing: '-0.01em' }}>Reach your block.</div>
        </div>
      </div>
      <OutlineCTA>List an event — free to start</OutlineCTA>
    </div>
  </>
);

Object.assign(window, { V1, V2, V3, V4, V5 });

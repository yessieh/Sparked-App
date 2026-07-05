// Feedback artboards:
//  - AuthCurrent  : visual recreation of /login (cropped for one phone width)
//  - AuthSuggested: what I'd ship instead
//  - MobileBefore : current LandingPage on a 280-wide phone (problems visible)
//  - MobileAfter  : same content reorganized mobile-first
//  - VisualNotes  : honest visual-design observations + tiny demos

// =============================================================
// AUTH - current state (recreated, scaled for 280-wide phone)
// =============================================================
const AuthCurrent = () => (
  <>
    <div style={{ position: 'absolute', top: -50, left: -50, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,99,72,0.20)', filter: 'blur(60px)' }}></div>
    <div style={{ position: 'absolute', bottom: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(247,183,49,0.12)', filter: 'blur(80px)' }}></div>
    <PStatus />
    <div style={{ padding: '4px 18px 14px', flexShrink: 0 }}>
      <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.20em', color: 'rgba(238,240,255,0.50)' }}>← Back to Sparked</span>
    </div>
    <div style={{ flex: 1, overflow: 'hidden', padding: '0 18px 14px', position: 'relative' }}>
      <h1 style={{
        fontFamily: 'Montserrat', fontSize: 26, fontWeight: 900,
        lineHeight: 1.0, letterSpacing: '-0.01em', margin: 0,
        backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>Welcome back - <br/>let's spark.</h1>
      <p style={{ fontSize: 11.5, color: 'rgba(238,240,255,0.60)', margin: '8px 0 16px', fontWeight: 700 }}>
        Your local scene is waiting for you.
      </p>

      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 18, padding: 14,
      }}>
        {/* Google btn - gradient stroke */}
        <div style={{
          padding: 1, background: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
          borderRadius: 13, boxShadow: '0 6px 22px rgba(255,95,78,0.24)', marginBottom: 12,
        }}>
          <button style={{
            background: '#14213D', color: '#fff', fontWeight: 900, fontSize: 12,
            padding: '10px 14px', borderRadius: 12, border: 'none', width: '100%',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24"><path d="M22 12c0-.8-.1-1.4-.2-2H12v4h5.6c-.2 1.3-1 2.3-2.1 3v2.5h3.4c2-1.8 3.1-4.5 3.1-7.5z" fill="#4285F4"/><path d="M12 22c2.8 0 5.2-.9 6.9-2.5l-3.4-2.6c-.9.6-2 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.6v2.7C4.3 19.7 7.9 22 12 22z" fill="#34A853"/><path d="M6.2 13.6c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V6.9H2.6C2 8.4 1.6 10.2 1.6 12s.4 3.6 1 5.1l3.6-2.7z" fill="#FBBC04"/><path d="M12 5.6c1.5 0 2.9.5 4 1.5l3-3C17.2 2.5 14.8 1.5 12 1.5 7.9 1.5 4.3 3.8 2.6 6.9l3.6 2.7c.8-2.5 3.1-4 5.8-4z" fill="#EA4335"/></svg>
            Continue with Google
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '10px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, rgba(252,163,17,0.25), transparent)' }}></div>
          <span style={{ fontSize: 8, fontWeight: 900, color: 'rgba(238,240,255,0.50)', letterSpacing: '0.20em' }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, rgba(252,163,17,0.25), transparent)' }}></div>
        </div>
        <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#FCA311', display: 'block', marginBottom: 6 }}>Email Address</span>
        <input placeholder="you@domain.com" style={{
          width: '100%', background: 'rgba(20,33,61,0.30)', border: '1px solid rgba(238,240,255,0.15)',
          color: '#fff', padding: '8px 12px', borderRadius: 10, fontSize: 11, marginBottom: 10, outline: 'none',
        }}/>
        <div style={{
          padding: 1, background: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)',
          borderRadius: 13, boxShadow: '0 6px 22px rgba(255,95,78,0.24)',
        }}>
          <button style={{
            background: '#14213D', fontWeight: 900, fontSize: 12,
            padding: '10px 14px', borderRadius: 12, border: 'none', width: '100%',
            cursor: 'pointer',
          }}>
            <span style={{ backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Send magic link
            </span>
          </button>
        </div>
      </div>
    </div>
  </>
);

// =============================================================
// AUTH - suggested redesign
// =============================================================
const AuthSuggested = () => (
  <>
    {/* product peek - full-bleed event card faded at top */}
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', inset: 0, background: EVENTS[0].grad, opacity: 0.7 }}></div>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #14213D 38%, rgba(20,33,61,0.85) 65%, transparent 100%)' }}></div>
    </div>
    <PStatus />
    <div style={{ padding: '4px 18px 8px', flexShrink: 0, position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <SparkLogoMini size={16} />
      <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.20em', color: 'rgba(255,255,255,0.65)' }}>Skip</span>
    </div>

    <div style={{ flex: 1, position: 'relative', padding: '0 18px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      {/* peek of event */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 6 }}>
        <Eye color="#ffca3a" size={8}>Tonight at 7:30pm</Eye>
        <div style={{ fontFamily: 'Montserrat', fontSize: 17, fontWeight: 900, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.05 }}>
          Sunset Songwriters Round
        </div>
        <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.75)' }}>The Rebel Lounge · 0.4 mi</div>
      </div>

      <div style={{
        background: 'rgba(15,26,48,0.85)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.10)', borderRadius: 20, padding: 14,
      }}>
        <h2 style={{ fontFamily: 'Montserrat', fontSize: 18, fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.01em', margin: '0 0 4px', color: '#fff' }}>
          Your city. <span style={{ backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Your preferences.</span>
        </h2>
        <p style={{ fontSize: 10.5, color: 'rgba(238,240,255,0.65)', margin: '0 0 12px', lineHeight: 1.45, fontWeight: 500 }}>
          Sign in to jump straight to the markets, music, and pop-ups you actually care about.
        </p>
        <PrimaryCTA size="md">
          <svg width="14" height="14" viewBox="0 0 24 24" style={{ marginRight: 2 }}><path d="M22 12c0-.8-.1-1.4-.2-2H12v4h5.6c-.2 1.3-1 2.3-2.1 3v2.5h3.4c2-1.8 3.1-4.5 3.1-7.5z" fill="#fff"/><path d="M12 22c2.8 0 5.2-.9 6.9-2.5l-3.4-2.6c-.9.6-2 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.6v2.7C4.3 19.7 7.9 22 12 22z" fill="#fff" opacity=".75"/><path d="M6.2 13.6c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V6.9H2.6C2 8.4 1.6 10.2 1.6 12s.4 3.6 1 5.1l3.6-2.7z" fill="#fff" opacity=".55"/><path d="M12 5.6c1.5 0 2.9.5 4 1.5l3-3C17.2 2.5 14.8 1.5 12 1.5 7.9 1.5 4.3 3.8 2.6 6.9l3.6 2.7c.8-2.5 3.1-4 5.8-4z" fill="#fff" opacity=".85"/></svg>
          Continue with Google
        </PrimaryCTA>
        <div style={{ marginTop: 6, textAlign: 'center' }}>
          <button style={{
            background: 'transparent', color: 'rgba(255,255,255,0.65)', fontWeight: 600, fontSize: 10.5,
            padding: '8px 14px', border: 'none', cursor: 'pointer',
          }}>
            or send a magic link
          </button>
        </div>
      </div>
    </div>
  </>
);

// =============================================================
// MOBILE BEFORE - current desktop landing crushed to 280
// =============================================================
const MobileBefore = () => (
  <>
    <PStatus />
    <div style={{ padding: '4px 14px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
      <SparkLogoMini size={16}/>
      <div style={{ display: 'flex', gap: 4 }}>
        <span style={{ fontSize: 8.5, fontWeight: 900, color: 'rgba(255,255,255,0.7)' }}>Log In</span>
        <span style={{ fontSize: 8.5, fontWeight: 900, color: '#14213D', background: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)', padding: '4px 8px', borderRadius: 9 }}>List an Event</span>
      </div>
    </div>

    {/* pills overflow */}
    <div style={{ padding: '0 14px 8px', flexShrink: 0, display: 'flex', gap: 4, overflowX: 'hidden', flexWrap: 'wrap' }}>
      {['Near Phoenix · 25mi','Live Music','Markets','Art Walks','Pop-Ups'].map(l=>(
        <span key={l} style={{
          fontSize: 7.5, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em',
          padding: '3px 7px', borderRadius: 9999, background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(238,240,255,0.85)', whiteSpace: 'nowrap',
        }}>{l}</span>
      ))}
    </div>

    {/* H1 cramped */}
    <div style={{ padding: '4px 14px 12px', flexShrink: 0 }}>
      <h1 style={{
        fontFamily: 'Montserrat', fontSize: 30, fontWeight: 900,
        lineHeight: 0.92, letterSpacing: '-0.02em', margin: 0,
      }}>
        <span style={{ display: 'block', color: '#fff' }}>YOUR CITY.</span>
        <span style={{ display: 'block', backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>YOUR EVENTS.</span>
        <span style={{ display: 'block', color: '#414657' }}>NO ALGORITHM.</span>
      </h1>
    </div>

    <div style={{ padding: '0 14px', flexShrink: 0 }}>
      <p style={{ fontSize: 10, color: 'rgba(238,240,255,0.60)', lineHeight: 1.45, margin: '0 0 10px' }}>
        Sparked helps you discover and publish local events by distance, not by feed.
      </p>
      {/* primary CTA (organizer) */}
      <PrimaryCTA size="md">List Your First Event In Minutes</PrimaryCTA>
      <div style={{ textAlign: 'center', fontSize: 8, color: 'rgba(255,255,255,0.25)', margin: '6px 0' }}>or</div>
      <OutlineCTA>Browse Local Events · FREE</OutlineCTA>
    </div>

    {/* preview card peeks below */}
    <div style={{ flex: 1, overflow: 'hidden', padding: '10px 14px 14px', display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 16, padding: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <Eye size={7.5}>TODAY</Eye>
          <span style={{ fontSize: 7.5, fontWeight: 900, color: 'rgba(238,240,255,0.5)', letterSpacing: '0.20em' }}>DOWNTOWN ARTS</span>
        </div>
        <div style={{ fontFamily: 'Montserrat', fontSize: 13, fontWeight: 900, color: '#fff' }}>Art Walk Downtown</div>
      </div>
    </div>
  </>
);

// =============================================================
// MOBILE AFTER - same copy, mobile-optimized layout
// =============================================================
const MobileAfter = () => (
  <>
    <PStatus />
    {/* Header: logo + single Log in link. "List an Event" pill is removed. */}
    <div style={{ padding: '4px 18px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
      <SparkLogoMini size={18}/>
      <span style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>Log in</span>
    </div>

    <div style={{ flex: 1, overflow: 'hidden', padding: '0 18px 14px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: -20, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,99,72,0.20)', filter: 'blur(60px)' }}></div>

      {/* H1: all three original lines, tight scale, fixed contrast on line 3 */}
      <h1 style={{
        fontFamily: 'Montserrat', fontSize: 38, fontWeight: 900,
        lineHeight: 0.95, letterSpacing: '-0.02em', margin: '6px 0 10px',
      }}>
        <span style={{ display: 'block', color: '#fff' }}>YOUR CITY.</span>
        <span style={{ display: 'block', backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>YOUR EVENTS.</span>
        <span style={{ display: 'block', color: '#5a6378' }}>NO ALGORITHM.</span>
      </h1>

      <p style={{ fontSize: 11, color: 'rgba(238,240,255,0.65)', lineHeight: 1.45, margin: '0 0 12px' }}>
        Sparked helps you discover and publish local events by distance, not by feed.
      </p>

      {/* Live snapshot - proves the proximity claim above the fold */}
      <div style={{
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 14, padding: 10, marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <LiveDot size={6}/>
          <Eye size={8.5}>47 events · 5mi radius</Eye>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {EVENTS.slice(0,3).map(e=>(
            <div key={e.id} style={{ flex: '1 1 0', minWidth: 0, height: 44, borderRadius: 8, background: e.grad, position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent 60%)' }}></div>
              <div style={{ position: 'absolute', bottom: 3, left: 5, right: 5, color: '#fff', fontSize: 7, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Both original CTAs, original hierarchy preserved */}
      <PrimaryCTA size="md">List Your First Event In Minutes</PrimaryCTA>
      <div style={{ textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.30)', margin: '6px 0', letterSpacing: '0.08em' }}>or</div>
      <OutlineCTA>
        Browse Local Events
        <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: '0.18em', backgroundImage: 'linear-gradient(135deg,#ff5f4e,#ff8c38,#ffca3a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginLeft: 4 }}>FREE</span>
      </OutlineCTA>
    </div>
  </>
);

// =============================================================
// VISUAL REDESIGN - applies all the visual feedback in one go.
// Gradient restraint (logo + CTA only), fixed "NO ALGORITHM." contrast,
// real event imagery peeking into the hero, "For organizers" demoted
// to a header link per the separate-page recommendation.
// =============================================================
const VisualRedesign = () => (
  <>
    {/* Full-bleed event imagery at the top, fading into navy.
        This is the "real event peeks in" treatment - replaces the
        all-text-and-gradient hero on the current landing. */}
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280 }}>
      <div style={{ position: 'absolute', inset: 0, background: EVENTS[2].grad, opacity: 0.85 }}></div>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #14213D 0%, rgba(20,33,61,0.65) 55%, transparent 100%)' }}></div>
    </div>

    {/* Ambient warm glow - the only decorative gradient use (matches brand atmosphere) */}
    <div style={{ position: 'absolute', top: 200, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(247,183,49,0.14)', filter: 'blur(80px)' }}></div>

    <PStatus />

    {/* Header: logo (gradient #1), small "For organizers" link, Log in.
        No "List an Event" pill - organizer entry lives on /for-organizers. */}
    <div style={{ padding: '4px 18px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, position: 'relative' }}>
      <SparkLogoMini size={18}/>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>For organizers →</span>
        <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.55)' }}>Log in</span>
      </div>
    </div>

    <div style={{ flex: 1, overflow: 'hidden', padding: '4px 18px 14px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <Eye>Tonight in Phoenix</Eye>

      {/* H1: original three-line copy. Lines 1 + 2 flat white (NO gradient on line 2).
          Line 3 contrast bumped from #414657 (1.3:1) to #5a6378 (3.1:1) - passes WCAG large text. */}
      <h1 style={{
        fontFamily: 'Montserrat', fontSize: 40, fontWeight: 900,
        lineHeight: 0.92, letterSpacing: '-0.02em', margin: '8px 0 12px',
      }}>
        <span style={{ display: 'block', color: '#fff' }}>YOUR CITY.</span>
        <span style={{ display: 'block', color: '#fff' }}>YOUR EVENTS.</span>
        <span style={{ display: 'block', color: '#5a6378' }}>NO ALGORITHM.</span>
      </h1>

      <p style={{ fontSize: 11.5, color: 'rgba(238,240,255,0.65)', lineHeight: 1.5, margin: '0 0 14px', maxWidth: '32ch' }}>
        Sparked helps you discover and publish local events by distance, not by feed.
      </p>

      {/* Live snapshot: three real events as photo-textured tiles.
          This is "real event imagery peeks in" applied at hero scale. */}
      <div style={{
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 16, padding: 12, marginBottom: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <LiveDot size={6}/>
          <Eye size={9}>47 events · 5 miles</Eye>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {EVENTS.slice(0,3).map(e=>(
            <div key={e.id} style={{ flex: '1 1 0', minWidth: 0, height: 70, borderRadius: 10, background: e.grad, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent 55%)' }}></div>
              <div style={{ position: 'absolute', bottom: 5, left: 6, right: 6, color: '#fff', fontSize: 7.5, fontWeight: 900, letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {e.name}
              </div>
              <div style={{ position: 'absolute', top: 5, right: 6, color: 'rgba(255,255,255,0.85)', fontSize: 7, fontWeight: 800, letterSpacing: '0.05em' }}>
                {e.dist}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Spacer - pushes CTA to bottom */}
      <div style={{ flex: 1 }}></div>

      {/* Primary CTA (gradient #2, the LAST gradient use). Consumer-first - browse, not list. */}
      <PrimaryCTA size="lg">Browse Local Events</PrimaryCTA>
      <p style={{ fontSize: 10, color: 'rgba(238,240,255,0.5)', textAlign: 'center', margin: '8px 0 0' }}>
        Free · No login required
      </p>
    </div>
  </>
);

Object.assign(window, { AuthCurrent, AuthSuggested, MobileBefore, MobileAfter, VisualRedesign });

// ---------------------------------------------------------------
// MARKETING LANDING PAGE — Linktree-style color-block sections.
// All animation is plain CSS (keyframes + transitions), no libs.
// The "hero video" is a CSS scene loop: three mock profile cards
// cross-fading on a timer — cinematic feel, zero video assets.
// ---------------------------------------------------------------
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

const TICKER = ['gaming', 'Formula 1', 'Tokyo', 'street food', 'AI scaling', 'photography',
  'fermentation', 'speedrunning', 'night trains', 'powerlifting', 'synthesizers', 'birdwatching']

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="ld">
      {/* Floating pill navbar */}
      <div className="ld-nav-wrap">
        <nav className="ld-nav">
          <Link to="/" className="brand"><Logo size={28} /><span>Digital Directory</span></Link>
          <div className={`ld-nav-links ${menuOpen ? 'open' : ''}`}>
            <a href="#search" onClick={() => setMenuOpen(false)}>Search</a>
            <a href="#profiles" onClick={() => setMenuOpen(false)}>Profiles</a>
            <a href="#travel" onClick={() => setMenuOpen(false)}>Travel</a>
            <a href="#notes" onClick={() => setMenuOpen(false)}>Notes</a>
          </div>
          <div className="ld-nav-cta">
            <Link className="ld-btn ld-btn-ghost" to="/login">Log in</Link>
            <Link className="ld-btn ld-btn-dark" to="/login">Sign up free</Link>
          </div>
          <button className={`ld-burger ${menuOpen ? 'open' : ''}`} aria-label="Menu"
            aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            <span /><span />
          </button>
        </nav>
      </div>

      {/* 1. Hero — lime */}
      <section className="ld-section ld-lime">
        <div className="ld-wrap ld-two">
          <div>
            <h1 className="ld-h ld-h-xl">Everyone interesting. One simple directory.</h1>
            <p className="ld-p">
              Build a profile that's actually you — hobbies, work, travels, projects, photos and
              blogs — and get found for any of it. One search box across everything.
            </p>
            <div className="ld-cta-row">
              <Link className="ld-btn ld-btn-dark ld-btn-lg" to="/login">Claim your profile</Link>
              <Link className="ld-btn ld-btn-light ld-btn-lg" to="/discover">Explore first</Link>
            </div>
          </div>
          <div className="ld-scene" aria-hidden="true">
            <div className="ld-scene-card" style={{ '--r': '-4deg' }}>
              <div className="ld-mock-head"><span className="ld-mock-avatar" style={{ background: '#2665d6' }}>M</span>
                <div><strong>Marek B.</strong><small>street photographer</small></div></div>
              <div className="ld-mock-chips"><span>photography</span><span>Tokyo</span><span>film</span></div>
              <div className="ld-mock-photos"><i style={{ background: '#94a3b8' }} /><i style={{ background: '#475569' }} /><i style={{ background: '#cbd5e1' }} /></div>
            </div>
            <div className="ld-scene-card" style={{ '--r': '3deg', animationDelay: '3s' }}>
              <div className="ld-mock-head"><span className="ld-mock-avatar" style={{ background: '#780016' }}>A</span>
                <div><strong>Amara D.</strong><small>race strategy analyst</small></div></div>
              <div className="ld-mock-chips"><span>Formula 1</span><span>sim racing</span></div>
              <div className="ld-mock-lines"><i style={{ width: '82%' }} /><i style={{ width: '64%' }} /><i style={{ width: '73%' }} /></div>
            </div>
            <div className="ld-scene-card" style={{ '--r': '-2deg', animationDelay: '6s' }}>
              <div className="ld-mock-head"><span className="ld-mock-avatar" style={{ background: '#1e1b4b' }}>K</span>
                <div><strong>Kenji P.</strong><small>slow traveler</small></div></div>
              <div className="ld-mock-chips"><span>street food</span><span>night trains</span></div>
              <div className="ld-mock-map"><i style={{ left: '18%', top: '38%' }} /><i style={{ left: '55%', top: '25%' }} /><i style={{ left: '74%', top: '60%' }} /></div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Marquee strip */}
      <div className="ld-ticker" aria-hidden="true">
        <div className="ld-ticker-track">
          {[...TICKER, ...TICKER].map((t, i) => <span key={i}>{t}</span>)}
        </div>
      </div>

      {/* 3. Search — deep blue */}
      <section id="search" className="ld-section ld-blue">
        <div className="ld-wrap ld-two">
          <div>
            <h2 className="ld-h">Search people like you search the web.</h2>
            <p className="ld-p">
              Full-text search across every profile, ranked by relevance — with typo tolerance.
              Someone who blogs about Formula 1 shows up for "Formula 1". It just works.
            </p>
          </div>
          <div className="ld-search-demo" aria-hidden="true">
            <span className="ld-search-icon">⌕</span>
            <div className="ld-roller">
              <ul>
                <li>Formula 1</li><li>fermentation</li><li>Tokyo</li><li>AI scaling</li><li>Formula 1</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Profiles — off-white */}
      <section id="profiles" className="ld-section ld-paper">
        <div className="ld-wrap ld-two ld-rev">
          <div>
            <h2 className="ld-h">A profile with more than a job title.</h2>
            <p className="ld-p">
              Hobbies as colorful chips. Work as a timeline. Projects as cards with live links.
              The whole person, one page.
            </p>
          </div>
          <div className="ld-mock-profile" aria-hidden="true">
            <div className="ld-mock-chips ld-big"><span style={{ background: '#fdf2c8', color: '#7a5b00' }}>chess</span>
              <span style={{ background: '#dcefe0', color: '#14532d' }}>bouldering</span>
              <span style={{ background: '#e3e8fd', color: '#3730a3' }}>synthesizers</span></div>
            <div className="ld-mock-lines"><i style={{ width: '90%' }} /><i style={{ width: '70%' }} /><i style={{ width: '80%' }} /></div>
          </div>
        </div>
      </section>

      {/* 5. Travel map — maroon */}
      <section id="travel" className="ld-section ld-maroon">
        <div className="ld-wrap ld-two">
          <div>
            <h2 className="ld-h">Pin your world.</h2>
            <p className="ld-p">
              Click cities on a real world map to build your travel story — and find people
              who've been where you're going next.
            </p>
          </div>
          <div className="ld-mock-bigmap" aria-hidden="true">
            <i style={{ left: '22%', top: '35%' }} /><i style={{ left: '48%', top: '28%' }} />
            <i style={{ left: '70%', top: '42%' }} /><i style={{ left: '35%', top: '62%' }} />
            <i style={{ left: '82%', top: '66%' }} /><i style={{ left: '58%', top: '55%' }} />
          </div>
        </div>
      </section>

      {/* 6. Notes — sage */}
      <section id="notes" className="ld-section ld-sage">
        <div className="ld-wrap ld-two ld-rev">
          <div>
            <h2 className="ld-h">Write it down. Get found for it.</h2>
            <p className="ld-p">
              Blog posts and photo galleries live right on your profile — and every word you
              write becomes searchable. Writing about hiking makes you discoverable for hiking.
            </p>
          </div>
          <div className="ld-mock-notes" aria-hidden="true">
            <div className="ld-note" style={{ '--r': '-2deg' }}><strong>Night trains are the best way to travel</strong><i /><i style={{ width: '75%' }} /></div>
            <div className="ld-note" style={{ '--r': '2deg' }}><strong>My live rig, explained</strong><i /><i style={{ width: '60%' }} /></div>
          </div>
        </div>
      </section>

      {/* 7. Free — lime again */}
      <section className="ld-section ld-lime">
        <div className="ld-wrap" style={{ textAlign: 'center' }}>
          <h2 className="ld-h">Free. No ads. No algorithm.</h2>
          <p className="ld-p" style={{ margin: '0 auto 1.5rem', maxWidth: 520 }}>
            A directory, not a feed. People find you because they searched for what you love —
            not because an algorithm decided.
          </p>
          <Link className="ld-btn ld-btn-dark ld-btn-lg" to="/discover">See who's here</Link>
        </div>
      </section>

      {/* 8. Final CTA — near-black */}
      <section className="ld-section ld-ink">
        <div className="ld-wrap" style={{ textAlign: 'center' }}>
          <h2 className="ld-h ld-h-xl">Ready to be found?</h2>
          <div className="ld-cta-row" style={{ justifyContent: 'center' }}>
            <Link className="ld-btn ld-btn-lime ld-btn-lg" to="/login">Create your profile</Link>
          </div>
          <p className="ld-foot">Digital Directory · Built by Revanth Gowda</p>
        </div>
      </section>
    </div>
  )
}

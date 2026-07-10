// ---------------------------------------------------------------
// PUBLIC PROFILE PAGE — the "Digital Garden" view at /u/:username
// LESSON: useParams() reads the :username segment from the URL.
// Sections: cinematic hero -> jobs timeline -> project cards ->
// media lightbox gallery -> travel map -> blog masonry ("notepad").
// Subtle scroll animations via IntersectionObserver (.reveal).
// ---------------------------------------------------------------
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../supabaseClient'

function hueFor(str) {
  let h = 0
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) % 360
  return h
}

export default function UserProfilePage() {
  const { username } = useParams()
  const [profile, setProfile] = useState(null)
  const [data, setData] = useState(null)
  const [lightbox, setLightbox] = useState(null)
  const [copied, setCopied] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setProfile(null); setData(null); setNotFound(false)
      const { data: p, error } = await supabase
        .from('profiles').select('*').eq('username', username).single()
      if (cancelled) return
      if (error || !p) { setNotFound(true); return }
      setProfile(p)
      const [hobbies, jobs, travels, projects, blogs, media] = await Promise.all([
        supabase.from('hobbies').select('*').eq('user_id', p.id),
        supabase.from('jobs').select('*').eq('user_id', p.id).order('created_at'),
        supabase.from('travels').select('*').eq('user_id', p.id),
        supabase.from('projects').select('*').eq('user_id', p.id),
        supabase.from('blogs').select('*').eq('user_id', p.id).order('created_at', { ascending: false }),
        supabase.from('media').select('*').eq('user_id', p.id).order('created_at', { ascending: false }),
      ])
      if (cancelled) return
      setData({
        hobbies: hobbies.data ?? [], jobs: jobs.data ?? [], travels: travels.data ?? [],
        projects: projects.data ?? [], blogs: blogs.data ?? [], media: media.data ?? [],
      })
    }
    load()
    return () => { cancelled = true }
  }, [username])

  // Scroll-reveal: sections fade up when they enter the viewport
  useEffect(() => {
    if (!data) return
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('visible')),
      { threshold: 0.08 }
    )
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [data])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setLightbox(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (notFound) return (
    <div className="card">
      <p>No profile named <strong>@{username}</strong>.</p>
      <Link className="link-btn" to="/">← Back to Discover</Link>
    </div>
  )
  if (!profile || !data) return (
    <div aria-busy="true" aria-label="Loading profile">
      <div className="skeleton" style={{ height: 260, borderRadius: 24, marginBottom: '1rem' }} />
      <div className="skeleton" style={{ height: 90, marginBottom: '1rem' }} />
      <div className="skeleton" style={{ height: 180 }} />
    </div>
  )

  const name = profile.full_name || profile.username
  const initial = name.charAt(0).toUpperCase()
  const cover = data.media.find((m) => m.kind === 'image')?.url
  const pinned = data.travels.filter((t) => t.lat != null && t.lng != null)

  function share() {
    navigator.clipboard?.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const jump = (id) => (e) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div>
      {/* 1. Hero */}
      <section className="profile-hero"
        style={cover ? { backgroundImage: `url(${cover})` } : undefined}>
        {profile.avatar_url
          ? <img src={profile.avatar_url} alt="" className="avatar avatar-lg hero-avatar" />
          : <div className="avatar avatar-lg avatar-fallback hero-avatar">{initial}</div>}
        <h1 className="hero-name">{name}</h1>
        <p className="hero-handle">@{profile.username}</p>
        {profile.bio && <p className="hero-bio">{profile.bio}</p>}
        <div className="hero-cta">
          {data.projects.length > 0 && <button onClick={jump('work')}>View my work</button>}
          {pinned.length > 0 && <button className="ghost" onClick={jump('map')}>Where I've been</button>}
          <button className="ghost" onClick={share}>{copied ? 'Link copied ✓' : 'Share profile'}</button>
        </div>
      </section>

      {/* Section jump nav */}
      <nav className="filter-row profile-nav">
        {data.jobs.length > 0 && <a className="filter" href="#journey" onClick={jump('journey')}>Journey</a>}
        {data.projects.length > 0 && <a className="filter" href="#work" onClick={jump('work')}>Projects</a>}
        {data.media.length > 0 && <a className="filter" href="#media" onClick={jump('media')}>Media</a>}
        {pinned.length > 0 && <a className="filter" href="#map" onClick={jump('map')}>Travel map</a>}
        {data.blogs.length > 0 && <a className="filter" href="#notes" onClick={jump('notes')}>Notes</a>}
      </nav>

      {/* Hobbies as chips, right under the hero */}
      {data.hobbies.length > 0 && (
        <div className="card reveal">
          <h2 className="section-label">Into</h2>
          <div className="chip-row" style={{ margin: 0 }}>
            {data.hobbies.map((h) => (
              <span key={h.id} className="chip" style={{ '--h': hueFor(h.name) }}
                title={h.detail || undefined}>
                <span className="chip-dot" />{h.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 2a. Journey — vertical timeline of jobs */}
      {data.jobs.length > 0 && (
        <section id="journey" className="card reveal">
          <h2 className="section-label">Journey</h2>
          <div className="timeline">
            {data.jobs.map((j) => (
              <div key={j.id} className="timeline-item">
                <div className="row-main">{j.title}</div>
                {j.company && <div className="timeline-company">{j.company}</div>}
                {j.detail && <div className="row-sub">{j.detail}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2b. Projects grid */}
      {data.projects.length > 0 && (
        <section id="work" className="card reveal">
          <h2 className="section-label">Projects</h2>
          <div className="project-grid" style={{ margin: 0 }}>
            {data.projects.map((p) => {
              let host = null
              try { host = p.url ? new URL(p.url.startsWith('http') ? p.url : `https://${p.url}`).hostname : null } catch { /* ignore */ }
              return (
                <div key={p.id} className="project-card">
                  <div className="project-head">
                    {host && <img className="favicon" alt=""
                      src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`} />}
                    <strong>{p.name}</strong>
                  </div>
                  {p.detail && <p className="muted">{p.detail}</p>}
                  {host && (
                    <a className="project-link" target="_blank" rel="noreferrer"
                      href={p.url.startsWith('http') ? p.url : `https://${p.url}`}>{host} ↗</a>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* 3. Creative lens — lightbox media gallery */}
      {data.media.length > 0 && (
        <section id="media" className="card reveal">
          <h2 className="section-label">Photos & videos</h2>
          <div className="gallery" style={{ marginTop: 0 }}>
            {data.media.map((m) => (
              <div key={m.id} className="gallery-item zoomable" onClick={() => setLightbox(m)}>
                {m.kind === 'image'
                  ? <img src={m.url} alt="" loading="lazy" />
                  : <video src={m.url} preload="metadata" muted />}
                {m.kind === 'video' && <span className="play-badge">▶</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Travel map (read-only) */}
      {pinned.length > 0 && (
        <section id="map" className="card reveal">
          <h2 className="section-label">Travel map · {pinned.length} places</h2>
          <MapContainer center={[22, 20]} zoom={2} minZoom={2} className="map" scrollWheelZoom={false}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {pinned.map((t) => (
              <CircleMarker key={t.id} center={[t.lat, t.lng]} radius={7}
                pathOptions={{ color: '#ffffff', weight: 1.5, fillColor: '#6366f1', fillOpacity: 0.95 }}>
                <Tooltip direction="top" offset={[0, -6]}>
                  <strong>{t.place}</strong>{t.detail ? ` — ${t.detail}` : ''}
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </section>
      )}

      {/* 4. Digital notepad — masonry blog grid */}
      {data.blogs.length > 0 && (
        <section id="notes" className="card reveal">
          <h2 className="section-label">Notes</h2>
          <div className="notes">
            {data.blogs.map((b) => <NoteCard key={b.id} post={b} />)}
          </div>
        </section>
      )}

      <div className="reveal" style={{ textAlign: 'center', margin: '2rem 0' }}>
        <Link className="link-btn" to="/">← Back to Discover</Link>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)} role="dialog" aria-label="Media viewer">
          {lightbox.kind === 'image'
            ? <img src={lightbox.url} alt="" onClick={(e) => e.stopPropagation()} />
            : <video src={lightbox.url} controls autoPlay onClick={(e) => e.stopPropagation()} />}
        </div>
      )}
    </div>
  )
}

function NoteCard({ post }) {
  const [open, setOpen] = useState(false)
  const date = new Date(post.created_at).toLocaleDateString(undefined,
    { year: 'numeric', month: 'short', day: 'numeric' })
  return (
    <article className="note-card" onClick={() => setOpen(!open)}>
      <h3>{post.title}</h3>
      <p className="meta">{date}</p>
      <p className={open ? '' : 'clamp'}>{post.content}</p>
      <span className="link-btn">{open ? 'Show less' : 'Read more'}</span>
    </article>
  )
}

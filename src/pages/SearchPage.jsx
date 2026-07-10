// ---------------------------------------------------------------
// The Discover page is now a proper landing experience:
//   - hero with gradient headline + rounded hero search
//   - one-tap suggestion chips (seed queries)
//   - "Newest members" grid when nothing is searched
//   - source filter pills + result cards while searching
// ---------------------------------------------------------------
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const SOURCES = ['all', 'profile', 'hobbies', 'jobs', 'travel', 'projects', 'blogs']
const SUGGESTIONS = ['gaming', 'engineer', 'Tokyo', 'chess', 'react', 'photography']

export default function SearchPage() {
  const [term, setTerm] = useState('')
  const [results, setResults] = useState([])
  const [filter, setFilter] = useState('all')
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState(null)
  const [members, setMembers] = useState([])

  const active = term.trim().length >= 2

  // Newest members for the browse/landing state — loaded once
  useEffect(() => {
    supabase.from('profiles')
      .select('id, username, full_name, bio, avatar_url')
      .order('created_at', { ascending: false })
      .limit(8)
      .then(({ data }) => setMembers(data ?? []))
  }, [])

  useEffect(() => {
    if (!active) { setResults([]); setFilter('all'); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      const { data, error } = await supabase.rpc('search_directory', { term })
      if (error) setError(error.message)
      else { setError(null); setResults(data) }
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [term, active])

  const visible = filter === 'all'
    ? results
    : results.filter((r) => r.matched_in.includes(filter))

  return (
    <div>
      <section className="hero">
        <h1 className="hero-title">Find your people</h1>
        <p className="hero-sub">
          Search the community by hobbies, work, cities, projects — or anything in their blogs.
        </p>
        <input
          className="search-input hero-search"
          placeholder="Try “gaming”, “react developer”, “Tokyo”…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          autoFocus
        />
        {!active && (
          <div className="suggest-row">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" className="filter" onClick={() => setTerm(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
      </section>

      {active ? (
        <div className="card">
          {results.length > 0 && (
            <div className="filter-row">
              {SOURCES.map((src) => (
                <button key={src} type="button"
                  className={`filter ${filter === src ? 'active' : ''}`}
                  onClick={() => setFilter(src)}>
                  {src === 'all' ? 'All' : src}
                </button>
              ))}
            </div>
          )}

          {searching && <p className="muted">Searching…</p>}
          {error && <p className="error">{error}</p>}
          {!searching && visible.length === 0 && (
            <p className="muted">
              {results.length > 0 ? 'No matches in this category.' : 'No matches. Try another word.'}
            </p>
          )}

          {visible.map((r) => <ResultCard key={r.id} result={r} />)}
        </div>
      ) : (
        members.length > 0 && (
          <section className="card">
            <h2 className="section-label">Newest members</h2>
            <div className="member-grid">
              {members.map((m) => <MemberCard key={m.id} member={m} onFind={setTerm} />)}
            </div>
          </section>
        )
      )}
    </div>
  )
}

function MemberCard({ member, onFind }) {
  const name = member.full_name || member.username || 'New member'
  const initial = name.charAt(0).toUpperCase()
  return (
    <div className="member-card"
      onClick={() => member.username && onFind(member.username)}
      title={member.username ? `Search @${member.username}` : undefined}>
      {member.avatar_url
        ? <img src={member.avatar_url} alt="" className="avatar avatar-md" />
        : <div className="avatar avatar-md avatar-fallback">{initial}</div>}
      <div className="row-main">{name}</div>
      {member.bio && <div className="row-sub clamp-1">{member.bio}</div>}
    </div>
  )
}

function ResultCard({ result }) {
  const [open, setOpen] = useState(false)
  const [details, setDetails] = useState(null)
  const initial = (result.full_name || result.username || '?').charAt(0).toUpperCase()

  async function toggle() {
    if (!open && !details) {
      const [hobbies, jobs, travels, projects, blogs, media] = await Promise.all([
        supabase.from('hobbies').select('*').eq('user_id', result.id),
        supabase.from('jobs').select('*').eq('user_id', result.id),
        supabase.from('travels').select('*').eq('user_id', result.id),
        supabase.from('projects').select('*').eq('user_id', result.id),
        supabase.from('blogs').select('id, title').eq('user_id', result.id),
        supabase.from('media').select('*').eq('user_id', result.id)
          .eq('kind', 'image').limit(4),
      ])
      setDetails({
        photos: media.data ?? [],
        sections: {
          Hobbies: (hobbies.data ?? []).map((h) => [h.name, h.detail]),
          Jobs: (jobs.data ?? []).map((j) => [j.title, [j.company, j.detail].filter(Boolean).join(', ')]),
          Travel: (travels.data ?? []).map((t) => [t.place, t.detail]),
          Projects: (projects.data ?? []).map((p) => [p.name, [p.detail, p.url].filter(Boolean).join(' · ')]),
          Blogs: (blogs.data ?? []).map((b) => [b.title, null]),
        },
      })
    }
    setOpen(!open)
  }

  return (
    <div className="result-card" onClick={toggle}>
      <div className="result-head">
        <div className="result-id">
          {result.avatar_url
            ? <img src={result.avatar_url} alt="" className="avatar" />
            : <div className="avatar avatar-fallback">{initial}</div>}
          <div>
            <strong>{result.full_name || result.username || 'Unnamed user'}</strong>
            {result.username && <span className="muted"> @{result.username}</span>}
            {result.bio && <div className="muted">{result.bio}</div>}
          </div>
        </div>
        <div className="badges">
          {result.matched_in.map((m) => (
            <span key={m} className="badge">{m}</span>
          ))}
        </div>
      </div>

      {open && details && (
        <div className="result-details">
          {details.photos.length > 0 && (
            <div className="mini-gallery">
              {details.photos.map((p) => (
                <img key={p.id} src={p.url} alt="" loading="lazy" />
              ))}
            </div>
          )}
          {Object.entries(details.sections).map(([section, rows]) =>
            rows.length > 0 && (
              <div key={section} className="detail-group">
                <span className="detail-label">{section}</span>
                <div className="pill-row">
                  {rows.map(([main, extra], i) => (
                    <span key={i} className="pill" title={extra || undefined}>
                      {main}
                    </span>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}
      <div className="meta">{open ? '▲ collapse' : '▼ view full profile'}</div>
    </div>
  )
}

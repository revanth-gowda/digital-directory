// ---------------------------------------------------------------
// Phase 5 updates: results show avatars, a 'blogs' badge can
// appear (blog text is searchable now), and expanded cards show
// photos, blog titles and the full profile.
// ---------------------------------------------------------------
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function SearchPage() {
  const [term, setTerm] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (term.trim().length < 2) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      const { data, error } = await supabase.rpc('search_directory', { term })
      if (error) setError(error.message)
      else { setError(null); setResults(data) }
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [term])

  return (
    <div className="card">
      <h2>Discover people</h2>
      <input
        className="search-input"
        placeholder="Search hobbies, jobs, places, projects, blogs…"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        autoFocus
      />

      {searching && <p className="muted">Searching…</p>}
      {error && <p className="error">{error}</p>}
      {!searching && term.trim().length >= 2 && results.length === 0 && (
        <p className="muted">No matches. Try another word.</p>
      )}

      {results.map((r) => <ResultCard key={r.id} result={r} />)}
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
              <div key={section}>
                <strong>{section}:</strong>{' '}
                {rows.map(([main, extra], i) => (
                  <span key={i}>
                    {main}{extra ? ` (${extra})` : ''}{i < rows.length - 1 ? ' · ' : ''}
                  </span>
                ))}
              </div>
            )
          )}
        </div>
      )}
      <div className="muted small-text">{open ? '▲ collapse' : '▼ view full profile'}</div>
    </div>
  )
}

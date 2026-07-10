// ---------------------------------------------------------------
// LESSON 1: DEBOUNCING. We don't fire a query on every keystroke —
// we wait 300ms after the user STOPS typing. The useEffect below
// starts a timer; if the term changes first, the cleanup function
// cancels it. Standard pattern in every real search box.
//
// LESSON 2: RPC. supabase.rpc() calls the search_directory SQL
// function like an API endpoint. Heavy lifting stays in the
// database, close to the data — the browser just renders results.
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
    return () => clearTimeout(timer) // cancel if user keeps typing
  }, [term])

  return (
    <div className="card">
      <h2>Discover people</h2>
      <input
        placeholder="Try: gaming, engineer, Bangalore, chess…"
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

// ---------------------------------------------------------------
// LESSON 3: LAZY LOADING. The full profile (hobbies, jobs, travel,
// projects) is only fetched when someone clicks a card — not for
// all 20 results upfront. Promise.all runs the 4 queries in
// parallel instead of one-after-another.
// ---------------------------------------------------------------
function ResultCard({ result }) {
  const [open, setOpen] = useState(false)
  const [details, setDetails] = useState(null)

  async function toggle() {
    if (!open && !details) {
      const [hobbies, jobs, travels, projects] = await Promise.all([
        supabase.from('hobbies').select('*').eq('user_id', result.id),
        supabase.from('jobs').select('*').eq('user_id', result.id),
        supabase.from('travels').select('*').eq('user_id', result.id),
        supabase.from('projects').select('*').eq('user_id', result.id),
      ])
      setDetails({
        Hobbies: (hobbies.data ?? []).map((h) => [h.name, h.detail]),
        Jobs: (jobs.data ?? []).map((j) => [j.title, [j.company, j.detail].filter(Boolean).join(', ')]),
        Travel: (travels.data ?? []).map((t) => [t.place, t.detail]),
        Projects: (projects.data ?? []).map((p) => [p.name, [p.detail, p.url].filter(Boolean).join(' · ')]),
      })
    }
    setOpen(!open)
  }

  return (
    <div className="result-card" onClick={toggle}>
      <div className="result-head">
        <div>
          <strong>{result.full_name || result.username || 'Unnamed user'}</strong>
          {result.username && <span className="muted"> @{result.username}</span>}
          {result.bio && <div className="muted">{result.bio}</div>}
        </div>
        <div>
          {result.matched_in.map((m) => (
            <span key={m} className="badge">{m}</span>
          ))}
        </div>
      </div>

      {open && details && (
        <div className="result-details">
          {Object.entries(details).map(([section, rows]) =>
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

// ---------------------------------------------------------------
// Discover page, Linktree-style: a bold color-block hero with an
// oversized headline + pill search, then ALL members with lazy
// loading.
// LESSON: PAGINATION. .range(from, to) fetches one page at a time;
// { count: 'exact' } returns the total so we know when to stop.
// An IntersectionObserver watches an invisible "sentinel" div at
// the bottom — when it scrolls into view, we load the next page.
// ---------------------------------------------------------------
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const SOURCES = ['all', 'profile', 'hobbies', 'jobs', 'travel', 'projects', 'blogs']
const SUGGESTIONS = ['gaming', 'Formula 1', 'Tokyo', 'photography', 'AI', 'street food']
const PAGE_SIZE = 12

export default function SearchPage() {
  const [term, setTerm] = useState('')
  const [results, setResults] = useState([])
  const [filter, setFilter] = useState('all')
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState(null)
  const [members, setMembers] = useState([])
  const [total, setTotal] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const sentinelRef = useRef(null)

  const active = term.trim().length >= 2

  const loadMembers = useCallback(async (from) => {
    setLoadingMore(true)
    const { data, count } = await supabase
      .from('profiles')
      .select('id, username, full_name, bio, avatar_url', { count: 'exact' })
      .not('username', 'is', null)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)
    setMembers((prev) => from === 0 ? (data ?? []) : [...prev, ...(data ?? [])])
    if (count != null) setTotal(count)
    setLoadingMore(false)
  }, [])

  useEffect(() => { loadMembers(0) }, [loadMembers])

  // Infinite scroll: when the sentinel becomes visible, fetch more
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || active) return
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loadingMore && total != null && members.length < total) {
        loadMembers(members.length)
      }
    }, { rootMargin: '300px' })
    io.observe(el)
    return () => io.disconnect()
  }, [members, total, loadingMore, active, loadMembers])

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
      <section className="hero-banner">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <h1 className="hb-title">Everyone interesting.<br />One simple directory.</h1>
        <p className="hb-sub">
          Real people, rich profiles. Search by hobbies, work, cities, projects — or anything in their blogs.
        </p>
        <input
          className="hb-search"
          placeholder="Try “Formula 1”, “photography”, “Tokyo”…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          autoFocus
        />
        {!active && (
          <div className="suggest-row">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" className="hb-chip" onClick={() => setTerm(s)}>
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
        <section className="card">
          <h2 className="section-label">
            Members{total != null && ` · ${members.length} of ${total}`}
          </h2>
          <div className="member-grid">
            {members.map((m) => <MemberCard key={m.id} member={m} />)}
          </div>
          <div ref={sentinelRef} />
          {loadingMore && <p className="muted" style={{ textAlign: 'center' }}>Loading more…</p>}
          {total != null && members.length < total && !loadingMore && (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button className="secondary" onClick={() => loadMembers(members.length)}>
                Show more members
              </button>
            </div>
          )}
          {total != null && members.length >= total && total > PAGE_SIZE && (
            <p className="meta" style={{ textAlign: 'center' }}>That's everyone — {total} members.</p>
          )}
        </section>
      )}
    </div>
  )
}

function MemberCard({ member }) {
  const navigate = useNavigate()
  const name = member.full_name || member.username || 'New member'
  const initial = name.charAt(0).toUpperCase()
  return (
    <div className="member-card"
      onClick={() => member.username && navigate(`/u/${member.username}`)}
      title={member.username ? `View @${member.username}` : undefined}>
      {member.avatar_url
        ? <img src={member.avatar_url} alt="" className="avatar avatar-md" />
        : <div className="avatar avatar-md avatar-fallback">{initial}</div>}
      <div className="row-main">{name}</div>
      {member.bio && <div className="row-sub clamp-1">{member.bio}</div>}
    </div>
  )
}

function ResultCard({ result }) {
  const navigate = useNavigate()
  const initial = (result.full_name || result.username || '?').charAt(0).toUpperCase()
  const canOpen = !!result.username
  return (
    <div className="result-card" onClick={() => canOpen && navigate(`/u/${result.username}`)}>
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
      <div className="meta">{canOpen ? 'View profile →' : 'No public username yet'}</div>
    </div>
  )
}

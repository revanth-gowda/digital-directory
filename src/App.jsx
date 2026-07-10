// ---------------------------------------------------------------
// Phase 4 update: REAL ROUTING. Our page-switching state is now
// replaced by URLs:
//   /         -> Discover (search)
//   /profile  -> My profile
// Why it matters: users can bookmark, share links, and use the
// back button. NavLink knows which route is active and styles
// itself (see the className function).
// ---------------------------------------------------------------
import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import AuthPage from './pages/AuthPage'
import ProfilePage from './pages/ProfilePage'
import SearchPage from './pages/SearchPage'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (loading) return <div className="container">Loading…</div>
  if (!session) return <AuthPage />

  return (
    <div className="page">
      <header className="topbar">
        <h1>Digital Directory</h1>
        <nav>
          <NavLink to="/" end className={({ isActive }) => isActive ? 'navlink active' : 'navlink'}>
            Discover
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => isActive ? 'navlink active' : 'navlink'}>
            My profile
          </NavLink>
          <button className="secondary" onClick={() => supabase.auth.signOut()}>
            Sign out
          </button>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/profile" element={<ProfilePage session={session} />} />
        {/* Unknown URL? Send them home. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

// ---------------------------------------------------------------
// PHASE 6: PUBLIC BROWSING. Login is no longer a gate in front of
// the app — it's just a page (/login). Anyone can browse Discover
// and view profiles; only /profile (create/edit) requires a
// session.
// LESSON: route guards. <Navigate> redirects declaratively:
//   /profile without a session -> /login
//   /login with a session      -> /profile
// ---------------------------------------------------------------
import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import { supabase } from './supabaseClient'
import AuthPage from './pages/AuthPage'
import ProfilePage from './pages/ProfilePage'
import SearchPage from './pages/SearchPage'
import LandingPage from './pages/LandingPage'
import UserProfilePage from './pages/UserProfilePage'
import { SunIcon, MoonIcon } from './components/Icons'
import Logo from './components/Logo'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') ?? 'system')

  const isDark = theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const resolved = theme === 'system' ? (mq.matches ? 'dark' : 'light') : theme
      document.documentElement.dataset.theme = resolved
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])

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

  function toggleTheme() {
    const next = isDark ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
  }

  const { pathname } = useLocation()
  const isLanding = !session && pathname === '/'

  if (loading) return <div className="container">Loading…</div>

  // The marketing landing renders full-bleed, without the app chrome
  if (isLanding) return <LandingPage />

  return (
    <div className="page">
      <header className="topbar">
        <NavLink to="/" className="brand" aria-label="Digital Directory home">
          <Logo size={30} />
          <span>Digital Directory</span>
        </NavLink>
        <nav>
          <NavLink to="/discover" className={({ isActive }) => isActive ? 'navlink active' : 'navlink'}>
            Discover
          </NavLink>
          {session && (
            <NavLink to="/profile" className={({ isActive }) => isActive ? 'navlink active' : 'navlink'}>
              My profile
            </NavLink>
          )}
          <button className="secondary theme-btn" onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}>
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
          {session ? (
            <button className="secondary" onClick={() => supabase.auth.signOut()}>
              Sign out
            </button>
          ) : (
            <NavLink to="/login" className="navlink cta">Log in</NavLink>
          )}
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Navigate to="/discover" replace />} />
        <Route path="/discover" element={<SearchPage />} />
        <Route path="/u/:username" element={<UserProfilePage />} />
        <Route path="/login"
          element={session ? <Navigate to="/profile" replace /> : <AuthPage />} />
        <Route path="/profile"
          element={session ? <ProfilePage session={session} /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <footer className="footer">
        Digital Directory - find your people · Built by Revanth Gowda
      </footer>
    </div>
  )
}

// ---------------------------------------------------------------
// LESSON: DARK MODE done properly.
// 1. The choice lives in localStorage ('light' | 'dark'), falling
//    back to the OS preference (prefers-color-scheme) when unset.
// 2. We set data-theme="dark" on <html>; CSS variables do ALL the
//    restyling. Zero component changes needed — that's the payoff
//    of a token-based design system.
// 3. We listen for OS theme changes so 'system' users follow along.
// ---------------------------------------------------------------
import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import AuthPage from './pages/AuthPage'
import ProfilePage from './pages/ProfilePage'
import SearchPage from './pages/SearchPage'
import { SunIcon, MoonIcon } from './components/Icons'

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

  if (loading) return <div className="container">Loading…</div>
  if (!session) return <AuthPage />

  return (
    <div className="page">
      <header className="topbar">
        <h1 className="brand"><span className="brand-dot" />Digital Directory</h1>
        <nav>
          <NavLink to="/" end className={({ isActive }) => isActive ? 'navlink active' : 'navlink'}>
            Discover
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => isActive ? 'navlink active' : 'navlink'}>
            My profile
          </NavLink>
          <button className="secondary theme-btn" onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}>
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
          <button className="secondary" onClick={() => supabase.auth.signOut()}>
            Sign out
          </button>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/profile" element={<ProfilePage session={session} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <footer className="footer">
        Digital Directory — find your people · Built with React & Supabase
      </footer>
    </div>
  )
}

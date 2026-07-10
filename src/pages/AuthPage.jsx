// ---------------------------------------------------------------
// Phase 5: redesigned as a split layout — brand panel + form.
// The auth LOGIC is untouched. Design changes shouldn't touch
// logic; if they do, the component is doing too much.
// ---------------------------------------------------------------
import { useState } from 'react'
import { supabase } from '../supabaseClient'
import Logo from '../components/Logo'

export default function AuthPage() {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    const { error } = mode === 'signup'
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else if (mode === 'signup') {
      setMessage({ type: 'success', text: 'Check your email for a confirmation link!' })
    }
    setBusy(false)
  }

  return (
    <div className="auth-layout">
      <div className="auth-brand">
        <div>
          <Logo size={56} />
          <h1>Digital Directory</h1>
          <p>Rich profiles. Real people. Find anyone by what they love,
             where they've been, and what they've built.</p>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-card">
          <h2>{mode === 'signin' ? 'Welcome back' : 'Create your profile'}</h2>
          <form onSubmit={handleSubmit}>
            <label>Email</label>
            <input type="email" name="email" autoComplete="email" value={email} required
              onChange={(e) => setEmail(e.target.value)} />
            <label>Password</label>
            <input type="password" name="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password} required minLength={6}
              onChange={(e) => setPassword(e.target.value)} />
            <button type="submit" disabled={busy} className="full-width">
              {mode === 'signin' ? 'Sign in' : 'Sign up'}
            </button>
          </form>
          <button className="link-btn"
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage(null) }}>
            {mode === 'signin' ? 'New here? Create an account' : 'Have an account? Sign in'}
          </button>
          {message && <p className={message.type}>{message.text}</p>}
        </div>
      </div>
    </div>
  )
}

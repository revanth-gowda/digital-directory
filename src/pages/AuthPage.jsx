// ---------------------------------------------------------------
// LESSON: A form in React. Every input's value lives in state
// ("controlled inputs"), and submitting calls Supabase Auth.
//
// Supabase handles the hard parts you should NEVER build yourself
// as a beginner: password hashing, session tokens, email verification.
// ---------------------------------------------------------------
import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function AuthPage() {
  const [mode, setMode] = useState('signin')   // 'signin' or 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState(null) // { type: 'error'|'success', text }
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault() // stop the browser doing a full-page form submit
    setBusy(true)
    setMessage(null)

    // Same form, two behaviors, picked by `mode`
    const { error } = mode === 'signup'
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else if (mode === 'signup') {
      setMessage({ type: 'success', text: 'Check your email for a confirmation link!' })
    }
    // On successful sign-in we do nothing here: App.jsx's
    // onAuthStateChange listener fires and swaps the screen. Clean!
    setBusy(false)
  }

  return (
    <div className="container">
      <h1>{mode === 'signin' ? 'Sign in' : 'Create account'}</h1>

      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input type="email" value={email} required
          onChange={(e) => setEmail(e.target.value)} />

        <label>Password</label>
        <input type="password" value={password} required minLength={6}
          onChange={(e) => setPassword(e.target.value)} />

        <button type="submit" disabled={busy}>
          {mode === 'signin' ? 'Sign in' : 'Sign up'}
        </button>
        <button type="button" className="secondary"
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage(null) }}>
          {mode === 'signin' ? 'Need an account?' : 'Have an account?'}
        </button>
      </form>

      {message && <p className={message.type}>{message.text}</p>}
    </div>
  )
}

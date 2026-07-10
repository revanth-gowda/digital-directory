// ---------------------------------------------------------------
// LESSON: Composition. This page = a basic-info form + four
// ListSection components, each configured differently via props.
// Notice how little code 4 full CRUD sections take once the
// logic lives in ONE reusable component.
// ---------------------------------------------------------------
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import ListSection from '../components/ListSection'

export default function ProfilePage({ session }) {
  const user = session.user
  const [profile, setProfile] = useState({ username: '', full_name: '', bio: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  // Load the profile row our Phase 1 trigger created at sign-up
  useEffect(() => {
    supabase
      .from('profiles')
      .select('username, full_name, bio')
      .eq('id', user.id)
      .single() // we expect exactly one row
      .then(({ data, error }) => {
        if (data) setProfile({
          username: data.username ?? '',
          full_name: data.full_name ?? '',
          bio: data.bio ?? '',
        })
        if (error) setMessage({ type: 'error', text: error.message })
      })
  }, [user.id])

  async function saveProfile(e) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    // UPDATE profiles SET ... WHERE id = user.id
    // RLS guarantees we can only update our own row.
    const { error } = await supabase.from('profiles').update(profile).eq('id', user.id)
    setMessage(error
      ? { type: 'error', text: error.message }
      : { type: 'success', text: 'Profile saved!' })
    setSaving(false)
  }

  // Helper: update one field of the profile object in state
  const set = (field) => (e) => setProfile({ ...profile, [field]: e.target.value })

  return (
    <div>
      <form onSubmit={saveProfile} className="card">
        <h2>Basic info</h2>
        <label>Username (unique, shown in search)</label>
        <input value={profile.username} onChange={set('username')} required />
        <label>Full name</label>
        <input value={profile.full_name} onChange={set('full_name')} />
        <label>Bio</label>
        <input value={profile.bio} onChange={set('bio')} placeholder="One line about you" />
        <button type="submit" disabled={saving}>Save</button>
        {message && <p className={message.type}>{message.text}</p>}
      </form>

      <div className="card">
        <ListSection
          title="Hobbies" table="hobbies" userId={user.id}
          fields={[
            { name: 'name', label: 'Hobby (e.g. chess)', required: true },
            { name: 'detail', label: 'Detail (optional)' },
          ]}
        />
        <ListSection
          title="Jobs" table="jobs" userId={user.id}
          fields={[
            { name: 'title', label: 'Job title', required: true },
            { name: 'company', label: 'Company' },
            { name: 'detail', label: 'Detail (years, highlights)' },
          ]}
        />
        <ListSection
          title="Travel" table="travels" userId={user.id}
          fields={[
            { name: 'place', label: 'Place (e.g. Tokyo, Japan)', required: true },
            { name: 'detail', label: 'Detail (when, what)' },
          ]}
        />
        <ListSection
          title="Projects" table="projects" userId={user.id}
          fields={[
            { name: 'name', label: 'Project name', required: true },
            { name: 'detail', label: 'What it does / tech' },
            { name: 'url', label: 'Link (optional)' },
          ]}
        />
      </div>
    </div>
  )
}

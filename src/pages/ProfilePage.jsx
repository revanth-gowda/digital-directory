// ---------------------------------------------------------------
// Phase 5: the profile is now a rich page — avatar, media gallery,
// blog, interactive travel map — yet still just composed sections.
// Each feature lives in its own component. That's the architecture
// lesson: pages stay thin, components do the work.
// ---------------------------------------------------------------
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import ListSection from '../components/ListSection'
import MediaGallery from '../components/MediaGallery'
import BlogSection from '../components/BlogSection'
import TravelMap from '../components/TravelMap'

export default function ProfilePage({ session }) {
  const user = session.user
  const [profile, setProfile] = useState({ username: '', full_name: '', bio: '', avatar_url: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('username, full_name, bio, avatar_url')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (data) setProfile({
          username: data.username ?? '',
          full_name: data.full_name ?? '',
          bio: data.bio ?? '',
          avatar_url: data.avatar_url ?? '',
        })
        if (error) setMessage({ type: 'error', text: error.message })
      })
  }, [user.id])

  async function saveProfile(e) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    const { avatar_url, ...fields } = profile // avatar saves separately
    const { error } = await supabase.from('profiles').update(fields).eq('id', user.id)
    setMessage(error
      ? { type: 'error', text: error.message }
      : { type: 'success', text: 'Profile saved!' })
    setSaving(false)
  }

  // Avatar = same upload pattern as MediaGallery, then store the
  // URL on the profiles row. upsert:true overwrites the old one.
  async function uploadAvatar(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const path = `${user.id}/avatar`
    const { error: upErr } = await supabase.storage.from('media')
      .upload(path, file, { upsert: true })
    if (upErr) { setMessage({ type: 'error', text: upErr.message }); return }
    const { data } = supabase.storage.from('media').getPublicUrl(path)
    // Add a timestamp so the browser doesn't show a cached old avatar
    const avatar_url = `${data.publicUrl}?v=${Date.now()}`
    const { error } = await supabase.from('profiles').update({ avatar_url }).eq('id', user.id)
    if (error) setMessage({ type: 'error', text: error.message })
    else setProfile({ ...profile, avatar_url })
  }

  const set = (field) => (e) => setProfile({ ...profile, [field]: e.target.value })
  const initial = (profile.full_name || profile.username || '?').charAt(0).toUpperCase()

  return (
    <div className="narrow">
      <form onSubmit={saveProfile} className="card">
        <div className="profile-head">
          <label className="avatar-upload" title="Change photo">
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="Your avatar" className="avatar avatar-lg" />
              : <div className="avatar avatar-lg avatar-fallback">{initial}</div>}
            <span className="avatar-overlay">Change Avatar</span>
            <input type="file" accept="image/*" hidden onChange={uploadAvatar} />
          </label>
          <div className="profile-head-fields">
            <label>Username (unique, shown in search)</label>
            <input value={profile.username} onChange={set('username')} required />
            <label>Full name</label>
            <input value={profile.full_name} onChange={set('full_name')} />
          </div>
        </div>
        <label>Bio</label>
        <input value={profile.bio} onChange={set('bio')} placeholder="One line about you" />
        <button type="submit" disabled={saving}>Save</button>
        {message && <p className={message.type}>{message.text}</p>}
      </form>

      <div className="card"><MediaGallery userId={user.id} /></div>
      <div className="card"><BlogSection userId={user.id} /></div>
      <div className="card"><TravelMap userId={user.id} /></div>

      <div className="card">
        <ListSection
          title="Hobbies" table="hobbies" userId={user.id} variant="pills"
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
          title="Projects" table="projects" userId={user.id} variant="cards"
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

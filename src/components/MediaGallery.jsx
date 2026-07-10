// ---------------------------------------------------------------
// LESSON: FILE UPLOADS. Three steps, always in this order:
//   1. upload the file to Storage (path starts with the user's id
//      so storage RLS accepts it)
//   2. get its public URL
//   3. save a row in the media table so we can list/delete later
// ---------------------------------------------------------------
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const MAX_VIDEO_MB = 25

export default function MediaGallery({ userId }) {
  const [items, setItems] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase.from('media').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setItems(data ?? []))
  }, [userId])

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const kind = file.type.startsWith('video') ? 'video' : 'image'
    if (kind === 'video' && file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setError(`Keep videos under ${MAX_VIDEO_MB} MB (short clips only)`)
      return
    }
    setBusy(true)
    setError(null)

    // Sanitize the filename; prefix with a timestamp to avoid clashes
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${userId}/${Date.now()}-${safeName}`

    const { error: upErr } = await supabase.storage.from('media').upload(path, file)
    if (upErr) { setError(upErr.message); setBusy(false); return }

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(path)

    const { data, error: dbErr } = await supabase
      .from('media')
      .insert({ user_id: userId, kind, url: urlData.publicUrl, path })
      .select()
    if (dbErr) setError(dbErr.message)
    else setItems([...data, ...items])
    setBusy(false)
    e.target.value = '' // allow re-selecting the same file
  }

  async function handleDelete(item) {
    // Delete the FILE first, then the database row
    await supabase.storage.from('media').remove([item.path])
    const { error } = await supabase.from('media').delete().eq('id', item.id)
    if (error) setError(error.message)
    else setItems(items.filter((i) => i.id !== item.id))
  }

  return (
    <section className="list-section">
      <div className="section-head">
        <h2>Photos & videos</h2>
        <label className={`btn file-btn ${busy ? 'disabled' : ''}`}>
          {busy ? 'Uploading…' : '+ Upload'}
          <input type="file" accept="image/*,video/*" hidden
            onChange={handleUpload} disabled={busy} />
        </label>
      </div>

      {items.length === 0 && <p className="muted">Show off a photo or a short clip.</p>}
      {error && <p className="error">{error}</p>}

      <div className="gallery">
        {items.map((item) => (
          <div key={item.id} className="gallery-item">
            {item.kind === 'image'
              ? <img src={item.url} alt={item.caption ?? 'uploaded image'} loading="lazy" />
              : <video src={item.url} controls preload="metadata" />}
            <button className="gallery-delete" title="Delete"
              onClick={() => handleDelete(item)}>×</button>
          </div>
        ))}
      </div>
    </section>
  )
}

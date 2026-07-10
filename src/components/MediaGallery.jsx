// ---------------------------------------------------------------
// Upload flow unchanged (Storage -> URL -> table row). New in v2:
// a drag & drop zone replaces the native file input. The real
// <input type="file"> still exists — hidden — and a ref forwards
// clicks to it. Drag events: preventDefault on dragOver is what
// makes a div a valid drop target.
// ---------------------------------------------------------------
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { CloudUploadIcon } from './Icons'

const MAX_VIDEO_MB = 25

export default function MediaGallery({ userId }) {
  const [items, setItems] = useState([])
  const [busy, setBusy] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    supabase.from('media').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setItems(data ?? []))
  }, [userId])

  async function uploadFile(file) {
    const kind = file.type.startsWith('video') ? 'video' : 'image'
    if (!file.type.startsWith('image') && !file.type.startsWith('video')) {
      setError('Only images and videos are supported')
      return
    }
    if (kind === 'video' && file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setError(`Keep videos under ${MAX_VIDEO_MB} MB (short clips only)`)
      return
    }
    setBusy(true)
    setError(null)

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
  }

  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && !busy) uploadFile(file)
  }

  async function handleDelete(item) {
    await supabase.storage.from('media').remove([item.path])
    const { error } = await supabase.from('media').delete().eq('id', item.id)
    if (error) setError(error.message)
    else setItems(items.filter((i) => i.id !== item.id))
  }

  return (
    <section className="list-section">
      <h2>Photos & videos</h2>

      <div
        className={`dropzone ${dragOver ? 'drag-over' : ''} ${busy ? 'disabled' : ''}`}
        role="button" tabIndex={0}
        aria-label="Upload an image or video"
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && !busy && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <span className="dz-icon"><CloudUploadIcon /></span>
        <p><strong>{busy ? 'Uploading…' : 'Click to upload'}</strong>{!busy && ' or drag & drop'}</p>
        <p className="meta">Images, or videos up to {MAX_VIDEO_MB} MB</p>
        <input ref={inputRef} type="file" accept="image/*,video/*" hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) uploadFile(file)
            e.target.value = ''
          }}
          disabled={busy} />
      </div>

      {error && <p className="error">{error}</p>}

      <div className="gallery">
        {items.map((item) => (
          <div key={item.id} className="gallery-item">
            {item.kind === 'image'
              ? <img src={item.url} alt={item.caption ?? 'uploaded image'} loading="lazy" />
              : <video src={item.url} controls preload="metadata" />}
            <button className="gallery-delete" title="Delete" aria-label="Delete media"
              onClick={() => handleDelete(item)}>×</button>
          </div>
        ))}
      </div>
    </section>
  )
}

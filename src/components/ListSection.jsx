// ---------------------------------------------------------------
// LESSON: VARIANTS. One component, three visual treatments,
// chosen by a `variant` prop:
//   'rows'  - Read.cv-style two-line list (jobs)
//   'pills' - Polywork-style colored chips (hobbies)
//   'cards' - Peerlist-style project cards (projects)
// The data logic (load/add/delete) is identical for all three —
// only the render changes. This is why the logic and the
// presentation are kept in separate functions.
// ---------------------------------------------------------------
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { TrashIcon } from './Icons'

// Deterministic hue from a string, so "gaming" is always the same
// color for every user — feels intentional, costs nothing.
function hueFor(str) {
  let h = 0
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) % 360
  return h
}

function hostOf(url) {
  try { return new URL(url.startsWith('http') ? url : `https://${url}`).hostname }
  catch { return null }
}

export default function ListSection({ title, table, fields, userId, variant = 'rows' }) {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
      if (error) setError(error.message)
      else setItems(data)
    }
    load()
  }, [table, userId])

  async function handleAdd(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { data, error } = await supabase
      .from(table)
      .insert({ ...form, user_id: userId })
      .select()
    if (error) setError(error.message)
    else {
      setItems([...items, ...data])
      setForm({})
    }
    setBusy(false)
  }

  async function handleDelete(id) {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) setError(error.message)
    else setItems(items.filter((item) => item.id !== id))
  }

  const primary = fields[0].name

  return (
    <section className="list-section">
      <h2>{title}</h2>

      {items.length === 0 && <p className="muted">Nothing added yet.</p>}

      {variant === 'pills' && (
        <div className="chip-row">
          {items.map((item) => {
            const h = hueFor(item[primary] ?? '')
            return (
              <span key={item.id} className="chip" title={item.detail || undefined}
                style={{ '--h': h }}>
                <span className="chip-dot" />
                {item[primary]}
                <button type="button" className="chip-x" aria-label={`Delete ${item[primary]}`}
                  onClick={() => handleDelete(item.id)}>×</button>
              </span>
            )
          })}
        </div>
      )}

      {variant === 'cards' && (
        <div className="project-grid">
          {items.map((item) => {
            const host = item.url ? hostOf(item.url) : null
            return (
              <div key={item.id} className="project-card">
                <div className="project-head">
                  {host && (
                    <img className="favicon" alt=""
                      src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`} />
                  )}
                  <strong>{item[primary]}</strong>
                </div>
                {item.detail && <p className="muted">{item.detail}</p>}
                {host && (
                  <a className="project-link" href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                    target="_blank" rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}>
                    {host} ↗
                  </a>
                )}
                <button className="icon-btn" aria-label={`Delete ${item[primary]}`}
                  onClick={() => handleDelete(item.id)}>
                  <TrashIcon />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {variant === 'rows' && (
        <ul>
          {items.map((item) => {
            const sub = fields.slice(1).map((f) => item[f.name]).filter(Boolean).join(' · ')
            return (
              <li key={item.id} className="list-row">
                <div>
                  <div className="row-main">{item[primary]}</div>
                  {sub && <div className="row-sub">{sub}</div>}
                </div>
                <button className="icon-btn" aria-label={`Delete ${item[primary]}`}
                  onClick={() => handleDelete(item.id)}>
                  <TrashIcon />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <form onSubmit={handleAdd} className="row">
        {fields.map((f) => (
          <input
            key={f.name}
            placeholder={f.label}
            required={f.required}
            value={form[f.name] ?? ''}
            onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
          />
        ))}
        <button type="submit" disabled={busy}>Add</button>
      </form>

      {error && <p className="error">{error}</p>}
    </section>
  )
}

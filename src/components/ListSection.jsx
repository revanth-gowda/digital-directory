// ---------------------------------------------------------------
// LESSON: A REUSABLE component — the biggest idea in React.
// This ONE component powers hobbies, jobs, travels AND projects.
// What makes each different? PROPS: the config we pass in.
//
// Props used here:
//   title  - heading text, e.g. "Hobbies"
//   table  - which Supabase table to read/write
//   fields - which inputs to show, e.g. [{ name: 'name', label: 'Hobby' }]
//   userId - whose rows to load and who owns new rows
// ---------------------------------------------------------------
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function ListSection({ title, table, fields, userId }) {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({})   // one object holds all input values
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  // Load this user's rows when the component appears
  useEffect(() => {
    async function load() {
      // SQL equivalent: SELECT * FROM <table> WHERE user_id = <userId>
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
    // Insert the form values + who owns the row.
    // .select() makes Supabase return the new row (with its DB-made id)
    const { data, error } = await supabase
      .from(table)
      .insert({ ...form, user_id: userId })
      .select()
    if (error) {
      setError(error.message)
    } else {
      setItems([...items, ...data]) // add new row to UI without a reload
      setForm({})                   // clear inputs
    }
    setBusy(false)
  }

  async function handleDelete(id) {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) setError(error.message)
    else setItems(items.filter((item) => item.id !== id)) // remove from UI
  }

  return (
    <section className="list-section">
      <h2>{title}</h2>

      {items.length === 0 && <p className="muted">Nothing added yet.</p>}

      <ul>
        {items.map((item) => (
          // LESSON: key={} lets React track list items efficiently
          <li key={item.id}>
            <div>
              <strong>{item[fields[0].name]}</strong>
              {fields.slice(1).map((f) =>
                item[f.name] ? <span key={f.name} className="muted"> — {item[f.name]}</span> : null
              )}
            </div>
            <button className="danger small" onClick={() => handleDelete(item.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>

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

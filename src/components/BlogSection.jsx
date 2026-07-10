// ---------------------------------------------------------------
// LESSON: Nothing new here technically — it's the ListSection
// pattern with a textarea. Notice how fast features get built
// once you know the pattern: state -> insert -> update state.
// Blog text is automatically searchable (the fts column in
// phase5.sql), so writing posts makes users MORE discoverable.
// ---------------------------------------------------------------
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function BlogSection({ userId }) {
  const [posts, setPosts] = useState([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [writing, setWriting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase.from('blogs').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setPosts(data ?? []))
  }, [userId])

  async function publish(e) {
    e.preventDefault()
    setBusy(true)
    const { data, error } = await supabase
      .from('blogs')
      .insert({ user_id: userId, title, content })
      .select()
    if (error) setError(error.message)
    else {
      setPosts([...data, ...posts])
      setTitle(''); setContent(''); setWriting(false)
    }
    setBusy(false)
  }

  async function remove(id) {
    const { error } = await supabase.from('blogs').delete().eq('id', id)
    if (!error) setPosts(posts.filter((p) => p.id !== id))
  }

  return (
    <section className="list-section">
      <div className="section-head">
        <h2>Blog</h2>
        {!writing && <button className="btn" onClick={() => setWriting(true)}>+ Write a post</button>}
      </div>

      {writing && (
        <form onSubmit={publish} className="blog-editor">
          <input placeholder="Post title" value={title} required
            onChange={(e) => setTitle(e.target.value)} />
          <textarea placeholder="Your story… (this text becomes searchable!)"
            value={content} required rows={6}
            onChange={(e) => setContent(e.target.value)} />
          <div className="row">
            <button type="submit" disabled={busy}>Publish</button>
            <button type="button" className="secondary" onClick={() => setWriting(false)}>Cancel</button>
          </div>
        </form>
      )}
      {error && <p className="error">{error}</p>}
      {posts.length === 0 && !writing && <p className="muted">No posts yet.</p>}

      {posts.map((post) => (
        <BlogPost key={post.id} post={post} onDelete={() => remove(post.id)} />
      ))}
    </section>
  )
}

function BlogPost({ post, onDelete }) {
  const [open, setOpen] = useState(false)
  const date = new Date(post.created_at).toLocaleDateString(undefined,
    { year: 'numeric', month: 'short', day: 'numeric' })
  return (
    <article className="blog-post">
      <div className="section-head">
        <h3 onClick={() => setOpen(!open)}>{post.title}</h3>
        <button className="danger small" onClick={onDelete}>Delete</button>
      </div>
      <p className="muted small-text">{date}</p>
      <p className={open ? '' : 'clamp'}>{post.content}</p>
      <button className="link-btn" onClick={() => setOpen(!open)}>
        {open ? 'Show less' : 'Read more'}
      </button>
    </article>
  )
}

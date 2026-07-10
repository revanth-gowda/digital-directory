// ---------------------------------------------------------------
// TRAVEL MAP v2: major cities are shown as clickable dots.
// Gray dot = a city you can add. Indigo dot = somewhere you've been.
// Click a gray city -> confirm form appears pre-filled -> saved.
//
// LESSON: CircleMarker draws pure SVG circles — no image files —
// which is why this version is more reliable than v1's icon-based
// markers (bundlers often lose Leaflet's default icon images).
// ---------------------------------------------------------------
import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../supabaseClient'
import { CITIES } from '../data/cities'

const VISITED = '#4f46e5'
const UNVISITED = '#94a3b8'

// A city counts as visited if a saved pin is within ~0.3 degrees
function findVisit(city, travels) {
  return travels.find((t) =>
    t.lat != null &&
    Math.abs(t.lat - city.lat) < 0.3 &&
    Math.abs(t.lng - city.lng) < 0.3
  )
}

export default function TravelMap({ userId }) {
  const [travels, setTravels] = useState([])
  const [draft, setDraft] = useState(null)   // a CITY object while confirming
  const [detail, setDetail] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase.from('travels').select('*').eq('user_id', userId)
      .order('created_at', { ascending: true })
      .then(({ data }) => setTravels(data ?? []))
  }, [userId])

  async function save(e) {
    e.preventDefault()
    const { data, error } = await supabase
      .from('travels')
      .insert({
        user_id: userId,
        place: `${draft.name}, ${draft.country}`,
        detail: detail || null,
        lat: draft.lat,
        lng: draft.lng,
      })
      .select()
    if (error) setError(error.message)
    else {
      setTravels([...travels, ...data])
      setDraft(null)
      setDetail('')
    }
  }

  async function remove(id) {
    const { error } = await supabase.from('travels').delete().eq('id', id)
    if (!error) setTravels(travels.filter((t) => t.id !== id))
  }

  const pinned = travels.filter((t) => t.lat != null && t.lng != null)

  return (
    <section className="list-section">
      <div className="section-head">
        <h2>Travel map</h2>
        <span className="muted small-text">Click a city dot to mark it as visited</span>
      </div>

      <MapContainer center={[22, 20]} zoom={2} minZoom={2} className="map" scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Layer 1: every major city as a clickable gray dot */}
        {CITIES.map((city) => {
          const visited = !!findVisit(city, travels)
          const selected = draft && draft.name === city.name
          return (
            <CircleMarker
              key={`${city.name}-${city.country}`}
              center={[city.lat, city.lng]}
              radius={visited ? 7 : selected ? 8 : 5}
              pathOptions={{
                color: '#ffffff',
                weight: 1.5,
                fillColor: visited || selected ? VISITED : UNVISITED,
                fillOpacity: visited || selected ? 0.95 : 0.75,
              }}
              eventHandlers={{
                click: () => {
                  if (!visited) { setDraft(city); setError(null) }
                },
              }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                <strong>{city.name}</strong>, {city.country}
                {visited ? ' ✓ visited' : ' — click to add'}
              </Tooltip>
            </CircleMarker>
          )
        })}

        {/* Layer 2: saved pins that aren't one of our listed cities
            (e.g. added in the old version) still show up */}
        {pinned
          .filter((t) => !CITIES.some((c) => findVisit(c, [t])))
          .map((t) => (
            <CircleMarker
              key={t.id}
              center={[t.lat, t.lng]}
              radius={7}
              pathOptions={{ color: '#ffffff', weight: 1.5, fillColor: VISITED, fillOpacity: 0.95 }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                <strong>{t.place}</strong>{t.detail ? ` — ${t.detail}` : ''}
              </Tooltip>
            </CircleMarker>
          ))}
      </MapContainer>

      <div className="map-legend muted small-text">
        <span className="dot" style={{ background: UNVISITED }} /> city — click to add
        <span className="dot" style={{ background: VISITED }} /> visited
      </div>

      {draft && (
        <form onSubmit={save} className="row map-form">
          <span className="map-adding">Add <strong>{draft.name}, {draft.country}</strong>?</span>
          <input placeholder="Detail — when, what (optional)" autoFocus
            value={detail} onChange={(e) => setDetail(e.target.value)} />
          <button type="submit">Mark as visited</button>
          <button type="button" className="secondary"
            onClick={() => { setDraft(null); setDetail('') }}>Cancel</button>
        </form>
      )}
      {error && <p className="error">{error}</p>}

      <ul className="travel-list">
        {travels.map((t) => (
          <li key={t.id}>
            <div>
              <strong>{t.place}</strong>
              {t.detail && <span className="muted"> — {t.detail}</span>}
            </div>
            <button className="danger small" onClick={() => remove(t.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </section>
  )
}

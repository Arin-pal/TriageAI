import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './CommanderDashboard.css'

const COLOR_HEX = {
  RED:    '#ff3b3b',
  YELLOW: '#f5c518',
  GREEN:  '#2ddd6e',
  BLACK:  '#444444',
}

// Auto-fits the map viewport once on first load when patient GPS data arrives.
// hasFittedRef prevents the map snapping back every 5-second poll.
function FitBounds({ patients }) {
  const map = useMap()
  const hasFittedRef = useRef(false)

  useEffect(() => {
    if (hasFittedRef.current) return
    const valid = patients.filter(p => p.lat && p.lng)
    if (valid.length > 0) {
      map.fitBounds(valid.map(p => [p.lat, p.lng]), { padding: [50, 50], maxZoom: 17 })
      hasFittedRef.current = true
    }
  }, [patients, map])

  return null
}

// Offsets patients that share the same GPS location so map pins don't stack.
// Uses the golden angle (~137.5°) to spread duplicates in a natural spiral.
function spreadOverlappingPatients(patients) {
  const spread = 0.00005 // ~5 metres
  const seen = {}

  return patients.map(p => {
    if (!p.lat || !p.lng) return p

    const key = p.lat.toFixed(4) + ',' + p.lng.toFixed(4)
    if (!seen[key]) seen[key] = 0
    const count = seen[key]
    seen[key]++

    if (count === 0) return p // first patient stays at original position

    // Subsequent patients spiral outward using the golden angle
    const angle = (count * 137.5) * (Math.PI / 180)
    return {
      ...p,
      lat: p.lat + spread * Math.cos(angle),
      lng: p.lng + spread * Math.sin(angle),
    }
  })
}

export default function CommanderDashboard() {
  const [patients, setPatients] = useState([])
  const [lastSynced, setLastSynced] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedPatientId, setSelectedPatientId] = useState(null)
  const markerRefs = useRef({})

  // Always co-located: the Vite app and the Express server run on the same laptop.
  // window.location.hostname gives the correct IP on any device, zero config required.
  const SERVER_URL = `https://${window.location.hostname}:3000`

  const fetchData = async () => {
    setIsRefreshing(true)
    setError(null)
    try {
      const res = await fetch(`${SERVER_URL}/patients`)
      if (!res.ok) throw new Error('Failed to fetch from laptop server')
      const data = await res.json()
      setPatients(data)
      setLastSynced(new Date())
    } catch (err) {
      console.error('Commander sync failed:', err)
      setError('Cannot connect to Laptop Server. Is it running?')
      // Fallback to local storage if server is down (for testing on same device)
      const localPatients = JSON.parse(localStorage.getItem('triage_patients') || '[]')
      if (localPatients.length > 0) setPatients(localPatients)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
    if (!autoRefresh) return
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [autoRefresh])

  const handleClearAll = async () => {
    if (!window.confirm('CRITICAL: Delete all data from the central server? This cannot be undone.')) return
    
    try {
      await fetch(`${SERVER_URL}/patients`, { method: 'DELETE' })
      localStorage.removeItem('triage_patients')
      setPatients([])
    } catch (err) {
      alert('Failed to clear server data.')
    }
  }

  const counts = patients.reduce((acc, p) => {
    const color = (p.color || 'UNKNOWN').toUpperCase()
    acc[color] = (acc[color] || 0) + 1
    return acc
  }, { RED: 0, YELLOW: 0, GREEN: 0, BLACK: 0 })

  // Priority sort: RED → YELLOW → GREEN → BLACK → unknown
  const PRIORITY_ORDER = { RED: 0, YELLOW: 1, GREEN: 2, BLACK: 3 }
  const priorityPatients = [...patients].sort((a, b) => {
    const aP = PRIORITY_ORDER[(a.color || '').toUpperCase()] ?? 4
    const bP = PRIORITY_ORDER[(b.color || '').toUpperCase()] ?? 4
    return aP - bP
  })

  // Spread overlapping pins so stacked patients are all visible on the map
  const spreadPatients = spreadOverlappingPatients(patients)

  const handleCardClick = (patient) => {
    setSelectedPatientId(patient.id)
    const marker = markerRefs.current[patient.id]
    if (marker) {
      marker.openPopup()
    }
  }

  return (
    <div className="commander-dashboard" style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <header className="commander-header" style={{ flexShrink: 0 }}>
        <div className="header-left">
          <Link to="/" className="back-link">← Exit</Link>
          <h1>Commander <span className="badge">Control</span></h1>
        </div>

        <div className="commander-stats">
          <div className="stat-box red"><span>RED</span> {counts.RED}</div>
          <div className="stat-box yellow"><span>YEL</span> {counts.YELLOW}</div>
          <div className="stat-box green"><span>GRN</span> {counts.GREEN}</div>
          <div className="stat-box black"><span>BLK</span> {counts.BLACK}</div>
        </div>

        <div className="header-actions">
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh (5s)
          </label>
          <span className={`sync-status ${isRefreshing ? 'syncing' : ''}`}>
            {error ? '❌ Server Offline' : `Last sync: ${lastSynced?.toLocaleTimeString() || 'Never'}`}
          </span>
          <button className="btn-icon" onClick={fetchData} title="Refresh Now">🔄</button>
        </div>
      </header>

      {/* ── Body (fills remaining height) ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>

        {/* ── Top 65%: map + patient cards side by side ── */}
        <div style={{ flex: '0 0 65%', display: 'flex', minHeight: 0, overflow: 'hidden' }}>

          {/* Map */}
          <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
            <MapContainer
              center={[21.0951, 79.0700]}
              zoom={5}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitBounds patients={patients} />
              {spreadPatients.filter(p => p.lat && p.lng).map(p => (
                <CircleMarker
                  key={p.id}
                  ref={(ref) => { if (ref) markerRefs.current[p.id] = ref }}
                  center={[p.lat, p.lng]}
                  radius={12}
                  pathOptions={{
                    color: COLOR_HEX[p.color] || '#888',
                    fillColor: COLOR_HEX[p.color] || '#888',
                    fillOpacity: 0.85,
                    weight: 2,
                  }}
                >
                  <Popup maxWidth={300}>
                    <div style={{ width: '280px', fontFamily: 'sans-serif' }}>
                      {p.photo && (
                        <img
                          src={p.photo}
                          alt="Patient"
                          style={{
                            width: '100%',
                            height: '160px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            marginBottom: '10px'
                          }}
                        />
                      )}
                      <div style={{
                        background: COLOR_HEX[p.color] || '#888',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        display: 'inline-block',
                        marginBottom: '8px'
                      }}>
                        {p.color}
                      </div>
                      {p.action && (
                        <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '6px' }}>
                          {p.action}
                        </div>
                      )}
                      {p.transcript && p.transcript.trim() && (
                        <div style={{
                          fontSize: '12px',
                          color: '#555',
                          marginBottom: '6px',
                          fontStyle: 'italic',
                          borderLeft: '3px solid #ddd',
                          paddingLeft: '8px'
                        }}>
                          {p.transcript.trim()}
                        </div>
                      )}
                      {p.reasoning && (
                        <div style={{ fontSize: '12px', color: '#444', marginBottom: '6px' }}>
                          {p.reasoning}
                        </div>
                      )}
                      <div style={{ fontSize: '11px', color: '#999', borderTop: '1px solid #eee', paddingTop: '6px' }}>
                        📍 {p.lat?.toFixed(5)}, {p.lng?.toFixed(5)}<br/>
                        🕐 {p.timestamp ? new Date(p.timestamp).toLocaleTimeString() : 'Unknown time'}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>

          {/* Patient cards panel */}
          <div style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', borderLeft: '1px solid #222', overflow: 'hidden' }}>
            {/* Action bar */}
            <div style={{ flexShrink: 0, display: 'flex', gap: '8px', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid #222' }}>
              <button
                onClick={() => { window.location.href = `https://${window.location.hostname}:3000/export/csv` }}
                style={{ padding: '6px 12px', background: '#2ddd6e', color: '#000', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                📥 CSV
              </button>
              <button className="btn-danger-text" onClick={handleClearAll}>Clear All</button>
            </div>

            {/* Scrollable cards */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {patients.length === 0 ? (
                <div className="empty-state" style={{ padding: '20px', textAlign: 'center', color: '#555', fontSize: '13px' }}>
                  No patients yet.<br/>Monitoring network…
                </div>
              ) : (
                patients.map(p => (
                  <div
                    key={p.id}
                    className={`patient-card border-${p.color?.toLowerCase()}`}
                    onClick={() => handleCardClick(p)}
                    style={{
                      marginBottom: '8px',
                      cursor: 'pointer',
                      outline: selectedPatientId === p.id ? '2px solid white' : '2px solid transparent',
                      borderRadius: '6px',
                    }}
                  >
                    <div className="card-top">
                      <span className={`tag bg-${p.color?.toLowerCase()}`}>{p.color}</span>
                      <span className="time">{formatTimeAgo(p.timestamp)}</span>
                    </div>
                    <h3 className="card-title">{p.action || 'Assessment Pending'}</h3>
                    <p className="card-reason">{p.reasoning}</p>
                    <div className="card-footer">
                      <span className="location">📍 {p.lat != null && p.lng != null ? p.lat.toFixed(4) + ', ' + p.lng.toFixed(4) : 'No GPS'}</span>
                      <span className="source">📡 {p.mode?.toUpperCase()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Bottom 35%: priority queue ── */}
        <div style={{ flex: '0 0 35%', display: 'flex', flexDirection: 'column', borderTop: '2px solid #222', minHeight: 0, overflow: 'hidden' }}>
          <div style={{ flexShrink: 0, padding: '8px 16px 6px', borderBottom: '1px solid #222' }}>
            <span style={{ color: '#ff3b3b', fontWeight: 900, fontSize: '18px', letterSpacing: '2px' }}>
              PRIORITY QUEUE
            </span>
            <span style={{ color: '#444', fontSize: '13px', marginLeft: '12px' }}>
              {patients.length} patient{patients.length !== 1 ? 's' : ''} · sorted by severity
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {priorityPatients.length === 0 ? (
              <div style={{ padding: '16px', color: '#444', fontSize: '13px', fontStyle: 'italic' }}>
                No patients reported yet. Monitoring local network…
              </div>
            ) : (
              priorityPatients.map(p => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 14px',
                    borderLeft: `4px solid ${COLOR_HEX[p.color?.toUpperCase()] || '#444'}`,
                    borderBottom: '1px solid #111',
                    background: '#0d0d0d',
                  }}
                >
                  <span style={{
                    background: COLOR_HEX[p.color?.toUpperCase()] || '#444',
                    color: p.color?.toUpperCase() === 'YELLOW' ? '#000' : '#fff',
                    padding: '2px 7px',
                    borderRadius: '3px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    minWidth: '42px',
                    textAlign: 'center',
                    flexShrink: 0,
                  }}>
                    {(p.color || '???').substring(0, 3).toUpperCase()}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#eee', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.action || 'Assessment Pending'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#555', marginTop: '1px' }}>
                      📍 {p.lat != null && p.lng != null ? `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}` : 'No GPS'}
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', color: '#555', flexShrink: 0 }}>
                    {formatTimeAgo(p.timestamp)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Unknown'
  const diff = Date.now() - timestamp
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}s`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m`
  return `${Math.floor(min / 60)}h`
}

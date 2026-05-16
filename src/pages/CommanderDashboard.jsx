import { useState, useEffect } from 'react'
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

// Auto-fits the map viewport to the bounding box of all patients with GPS
function FitBounds({ patients }) {
  const map = useMap()
  useEffect(() => {
    const valid = patients.filter(p => p.lat && p.lng)
    if (valid.length > 0) {
      map.fitBounds(valid.map(p => [p.lat, p.lng]), { padding: [50, 50], maxZoom: 17 })
    }
  }, [patients, map])
  return null
}

export default function CommanderDashboard() {
  const [patients, setPatients] = useState([])
  const [volunteers, setVolunteers] = useState([])
  const [lastSynced, setLastSynced] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Always co-located: the Vite app and the Express server run on the same laptop.
  // window.location.hostname gives the correct IP on any device, zero config required.
  const SERVER_URL = `https://${window.location.hostname}:3000`

  const assignVolunteer = async (patientId, volunteerId) => {
    try {
      await fetch(`${SERVER_URL}/patients/${patientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedVolunteerId: volunteerId }),
      })
      fetchData()
    } catch (e) {
      console.error('Failed to assign volunteer:', e)
    }
  }

  const fetchData = async () => {
    setIsRefreshing(true)
    setError(null)
    try {
      const [pRes, vRes] = await Promise.all([
        fetch(`${SERVER_URL}/patients`),
        fetch(`${SERVER_URL}/volunteers`)
      ])

      if (!pRes.ok || !vRes.ok) throw new Error('Failed to fetch from laptop server')

      const pData = await pRes.json()
      const vData = await vRes.json()

      setPatients(pData)
      setVolunteers(vData)
      setLastSynced(new Date())
    } catch (err) {
      console.error('Commander sync failed:', err)
      setError('Cannot connect to Laptop Server. Is it running?')
      
      // Fallback to local storage if server is down (for testing on same device)
      const localPatients = JSON.parse(localStorage.getItem('triage_patients') || '[]')
      const localVolunteers = JSON.parse(localStorage.getItem('volunteers') || '[]')
      if (localPatients.length > 0) setPatients(localPatients)
      if (localVolunteers.length > 0) setVolunteers(localVolunteers)
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
      localStorage.removeItem('volunteers')
      setPatients([])
      setVolunteers([])
    } catch (err) {
      alert('Failed to clear server data.')
    }
  }

  const counts = patients.reduce((acc, p) => {
    const color = (p.color || 'UNKNOWN').toUpperCase()
    acc[color] = (acc[color] || 0) + 1
    return acc
  }, { RED: 0, YELLOW: 0, GREEN: 0, BLACK: 0 })

  return (
    <div className="commander-dashboard">
      <header className="commander-header">
        <div className="header-left">
          <Link to="/" className="back-link">← Exit</Link>
          <h1>Commander <span className="badge">Control</span></h1>
        </div>

        <div className="commander-stats">
          <div className="stat-box red"><span>RED</span> {counts.RED}</div>
          <div className="stat-box yellow"><span>YEL</span> {counts.YELLOW}</div>
          <div className="stat-box green"><span>GRN</span> {counts.GREEN}</div>
          <div className="stat-box black"><span>BLK</span> {counts.BLACK}</div>
          <div className="stat-box volunteers"><span>VOL</span> {volunteers.length}</div>
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

      <main className="commander-main">
        {/* Leaflet map — auto-refreshes as patients state updates every 5s */}
        <MapContainer
          center={[21.0951, 79.0700]}
          zoom={5}
          style={{
            height: '400px',
            width: '100%',
            marginBottom: '20px',
            borderRadius: '8px',
            border: '1px solid #333',
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds patients={patients} />
          {patients.filter(p => p.lat && p.lng).map(p => (
            <CircleMarker
              key={p.id}
              center={[p.lat, p.lng]}
              radius={12}
              pathOptions={{
                color: COLOR_HEX[p.color] || '#888',
                fillColor: COLOR_HEX[p.color] || '#888',
                fillOpacity: 0.85,
                weight: 2,
              }}
            >
              <Popup>
                <div style={{ minWidth: '180px' }}>
                  <strong style={{ color: COLOR_HEX[p.color] || '#888' }}>{p.color}</strong><br />
                  <span style={{ fontSize: '13px' }}>
                    {p.transcript
                      ? p.transcript.substring(0, 80) + (p.transcript.length > 80 ? '…' : '')
                      : 'No description'}
                  </span><br />
                  <small style={{ color: '#666' }}>
                    {p.timestamp ? new Date(p.timestamp).toLocaleTimeString() : 'No time'}
                  </small>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        <section className="dashboard-section">
          <div className="section-header">
            <h2>Incident Map & Patients</h2>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={() => {
                  window.location.href = `https://${window.location.hostname}:3000/export/csv`
                }}
                style={{
                  padding: '8px 16px',
                  background: '#2ddd6e',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                📥 Download CSV
              </button>
              <button className="btn-danger-text" onClick={handleClearAll}>Clear All Data</button>
            </div>
          </div>

          <div className="patient-grid">
            {patients.length === 0 ? (
              <div className="empty-state">No patients reported yet. Monitoring local network...</div>
            ) : (
              patients.map(p => (
                <div key={p.id} className={`patient-card border-${p.color?.toLowerCase()}`}>
                  <div className="card-top">
                    <span className={`tag bg-${p.color?.toLowerCase()}`}>{p.color}</span>
                    <span className="time">{formatTimeAgo(p.timestamp)}</span>
                  </div>
                  <h3 className="card-title">{p.action || 'Assessment Pending'}</h3>
                  <p className="card-reason">{p.reasoning}</p>
                  <div className="card-footer">
                    <span className="location">📍 {p.lat?.toFixed(4)}, {p.lng?.toFixed(4)}</span>
                    <span className="source">📡 Source: {p.mode?.toUpperCase()}</span>
                  </div>
                  <select
                    value={p.assignedVolunteerId || ''}
                    onChange={(e) => assignVolunteer(p.id, e.target.value)}
                    style={{
                      width: '100%',
                      marginTop: '10px',
                      background: '#111',
                      color: 'white',
                      border: '1px solid #444',
                      padding: '8px',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">— Assign volunteer —</option>
                    {volunteers.map(v => (
                      <option key={v.id} value={v.id}>
                        Vol-{v.id?.substring(0, 4)} ({(v.skills || []).join(', ') || 'No skills listed'})
                      </option>
                    ))}
                  </select>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="dashboard-section volunteers-section">
          <div className="section-header">
            <h2>Active Volunteers</h2>
          </div>
          <div className="volunteers-list">
            {volunteers.length === 0 ? (
              <div className="empty-state">No volunteers checked in.</div>
            ) : (
              volunteers.map(v => (
                <div key={v.id} className="volunteer-row">
                  <div className="vol-info">
                    <span className="vol-id">#{v.id?.substring(0,4)}</span>
                    <div className="vol-skills">
                      {(v.skills || []).map(s => <span key={s} className="skill-chip">{s}</span>)}
                    </div>
                  </div>
                  <div className="vol-loc">📍 {v.lat?.toFixed(4)}, {v.lng?.toFixed(4)}</div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
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

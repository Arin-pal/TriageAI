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

export default function CommanderDashboard() {
  const [patients, setPatients] = useState([])
  const [lastSynced, setLastSynced] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

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

        <section className="dashboard-section">
          <div className="section-header">
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
                    <span className="location">📍 {p.lat != null && p.lng != null ? p.lat.toFixed(4) + ', ' + p.lng.toFixed(4) : 'No GPS'}</span>
                    <span className="source">📡 Source: {p.mode?.toUpperCase()}</span>
                  </div>
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

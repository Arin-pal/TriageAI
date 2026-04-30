import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './CommanderDashboard.css'

export default function CommanderDashboard() {
  const [patients, setPatients] = useState([])
  const [volunteers, setVolunteers] = useState([])
  const [lastSynced, setLastSynced] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const laptopIp = localStorage.getItem('laptop_ip') || 'localhost'
  const SERVER_URL = `http://${laptopIp}:3000`

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
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

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
          <span className={`sync-status ${isRefreshing ? 'syncing' : ''}`}>
            {error ? '❌ Server Offline' : `Last sync: ${lastSynced?.toLocaleTimeString() || 'Never'}`}
          </span>
          <button className="btn-icon" onClick={fetchData} title="Refresh Now">🔄</button>
        </div>
      </header>

      <main className="commander-main">
        <section className="dashboard-section">
          <div className="section-header">
            <h2>Incident Map & Patients</h2>
            <button className="btn-danger-text" onClick={handleClearAll}>Clear All Data</button>
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

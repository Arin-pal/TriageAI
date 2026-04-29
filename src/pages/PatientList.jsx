import { useState, useEffect } from 'react'
import WorkerHeader from '../components/WorkerHeader'
import WorkerBottomNav from '../components/WorkerBottomNav'
import { getAllPatients, getPatientCounts, clearAllPatients } from '../utils/patientStore'
import './PatientList.css'

function timeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} days ago`;
}

export default function PatientList() {
  const [patients, setPatients] = useState([])
  const [counts, setCounts] = useState({ RED: 0, YELLOW: 0, GREEN: 0, BLACK: 0 })

  const loadData = () => {
    setPatients(getAllPatients())
    setCounts(getPatientCounts())
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleClear = () => {
    if (patients.length === 0) return
    const confirmed = window.confirm(`Delete all ${patients.length} patient records? This cannot be undone.`)
    if (confirmed) {
      clearAllPatients()
      loadData()
    }
  }

  // Pull to refresh tracking
  const [pullDistance, setPullDistance] = useState(0)
  const [startY, setStartY] = useState(null)

  const handleTouchStart = (e) => {
    // Only engage pull-to-refresh if we are at the absolute top of the scroll
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY)
    }
  }

  const handleTouchMove = (e) => {
    if (startY !== null) {
      const y = e.touches[0].clientY
      const dist = y - startY
      // Only allow pulling down, not pushing up past 0
      if (dist > 0) {
        setPullDistance(Math.min(dist, 100)) // Max visual pull of 100px
      }
    }
  }

  const handleTouchEnd = () => {
    if (pullDistance > 60) {
      loadData() // Threshold met, refresh data
    }
    setStartY(null)
    setPullDistance(0)
  }

  return (
    <div 
      className="worker-page-container patient-list-page"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <WorkerHeader />

      <main className="patient-list-main page-enter">
        {pullDistance > 0 && (
          <div className="pull-refresh-indicator" style={{ height: pullDistance }}>
            {pullDistance > 60 ? 'Release to refresh' : 'Pull to refresh...'}
          </div>
        )}

        {/* Top Summary Bar */}
        <div className="summary-bar">
          <div className="summary-item red-bg">RED: {counts.RED || 0}</div>
          <div className="summary-item yellow-bg">YELLOW: {counts.YELLOW || 0}</div>
          <div className="summary-item green-bg">GREEN: {counts.GREEN || 0}</div>
          <div className="summary-item black-bg">BLACK: {counts.BLACK || 0}</div>
        </div>

        {/* Patient Cards List */}
        <div className="patients-container">
          {patients.length === 0 ? (
            <div className="empty-state">No patients assessed yet.</div>
          ) : (
            patients.map(p => {
              const colorKey = (p.color || 'UNKNOWN').toLowerCase()
              return (
                <div key={p.id} className={`patient-card border-${colorKey}`}>
                  <div className="card-header">
                    <span className={`color-badge badge-${colorKey}`}>
                      {p.color || 'UNKNOWN'}
                    </span>
                    <span className="time-elapsed">{timeAgo(p.timestamp)}</span>
                  </div>
                  
                  <h3 className="card-action">{p.action}</h3>
                  <p className="card-reasoning">{p.reasoning}</p>
                  
                  <div className="card-footer">
                    <span className="gps-text">
                      {p.lat && p.lng 
                        ? `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}` 
                        : "No GPS"}
                    </span>
                    <span className={`mode-badge mode-${(p.mode || 'ai').toLowerCase()}`}>
                      {(p.mode || 'AI').toUpperCase()}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Clear Data Button */}
        {patients.length > 0 && (
          <button className="btn btn-full clear-all-btn" onClick={handleClear}>
            Clear All Patients
          </button>
        )}
      </main>

      <WorkerBottomNav />
    </div>
  )
}

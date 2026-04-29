import { NavLink } from 'react-router-dom'
import './WorkerBottomNav.css'

export default function WorkerBottomNav() {
  // Attempt to read patient count from localStorage for the badge
  const storedPatients = localStorage.getItem('triage_patients')
  let patientCount = 0
  try {
    if (storedPatients) {
      patientCount = JSON.parse(storedPatients).length
    }
  } catch (e) {
    // Ignore parse error
  }

  return (
    <nav className="worker-bottom-nav">
      <NavLink 
        to="/worker/triage" 
        className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
      >
        <span className="nav-icon" aria-hidden="true">📷</span>
        <span className="nav-label">Triage</span>
      </NavLink>

      <NavLink 
        to="/worker/patients" 
        className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
      >
        <div className="icon-wrapper">
          <span className="nav-icon" aria-hidden="true">📋</span>
          {patientCount > 0 && <span className="nav-badge">{patientCount}</span>}
        </div>
        <span className="nav-label">Patients</span>
      </NavLink>

      <NavLink 
        to="/settings" 
        className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
      >
        <span className="nav-icon" aria-hidden="true">⚙️</span>
        <span className="nav-label">Settings</span>
      </NavLink>
    </nav>
  )
}

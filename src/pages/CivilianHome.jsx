import { useNavigate } from 'react-router-dom'
import './CivilianHome.css'

export default function CivilianHome() {
  const navigate = useNavigate()

  return (
    <div className="civilian-page-container page-enter">
      <header className="civilian-header">
        <button 
          className="back-btn" 
          onClick={() => navigate('/')}
          aria-label="Go back"
        >
          ← Back
        </button>
      </header>

      <main className="civilian-main">
        <h1 className="civilian-title">Civilian Portal</h1>
        <p className="civilian-subtitle">How can you assist today?</p>
        
        <div className="civilian-cards">
          <button 
            className="civilian-card" 
            onClick={() => navigate('/civilian/report')}
          >
            <div className="card-icon" aria-hidden="true">⚠️</div>
            <h2>I found someone injured</h2>
            <p>Report their location to responders</p>
          </button>

          <button 
            className="civilian-card" 
            onClick={() => navigate('/civilian/help')}
          >
            <div className="card-icon" aria-hidden="true">✋</div>
            <h2>I want to help</h2>
            <p>Tell us what you can do</p>
          </button>
        </div>
      </main>
    </div>
  )
}

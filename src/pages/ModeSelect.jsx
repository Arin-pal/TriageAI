import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './ModeSelect.css'

export default function ModeSelect() {
  const navigate = useNavigate()

  useEffect(() => {
    if (localStorage.getItem('setup_complete') !== 'true') {
      navigate('/setup', { replace: true })
    }
  }, [navigate])

  const handleSelectMode = (mode, path) => {
    localStorage.setItem('user_mode', mode)
    navigate(path)
  }

  const isLaptop = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

  return (
    <main className="mode-select-page page-enter">
      <header className="mode-select-header">
        <h1 className="logo-text">TriageAI</h1>
      </header>

      <section className="mode-cards-container">
        <button 
          className="mode-card responder-card" 
          onClick={() => handleSelectMode('responder', '/worker')}
          aria-label="I am a Responder. Trained medical worker."
        >
          <span className="card-icon" aria-hidden="true">🩺</span>
          <h2 className="card-title">I am a Responder</h2>
          <p className="card-subtitle">Trained medical worker</p>
        </button>

        <button 
          className="mode-card civilian-card" 
          onClick={() => handleSelectMode('civilian', '/civilian')}
          aria-label="I want to help. Civilian volunteer."
        >
          <span className="card-icon" aria-hidden="true">🤝</span>
          <h2 className="card-title">I want to help</h2>
          <p className="card-subtitle">Civilian volunteer</p>
        </button>

        {isLaptop && (
          <button 
            className="mode-card commander-card" 
            onClick={() => handleSelectMode('commander', '/commander')}
            aria-label="Incident Commander. Monitor operations."
          >
            <span className="card-icon" aria-hidden="true">📡</span>
            <h2 className="card-title">Incident Commander</h2>
            <p className="card-subtitle">Monitor operations</p>
          </button>
        )}
      </section>

      <footer className="mode-select-footer">
        <p>TriageAI — Works fully offline</p>
      </footer>
    </main>
  )
}

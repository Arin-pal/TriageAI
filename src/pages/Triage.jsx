import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import OfflineBanner from '../components/OfflineBanner'
import './Triage.css'

const SEVERITY_OPTIONS = ['Mild', 'Moderate', 'Severe', 'Critical']

export default function Triage() {
  const navigate = useNavigate()
  const [symptoms, setSymptoms] = useState('')
  const [severity, setSeverity] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!symptoms.trim() || !severity) return
    setLoading(true)
    // Simulate async AI processing
    setTimeout(() => {
      navigate('/results', { state: { symptoms, severity } })
    }, 1800)
  }

  return (
    <main className="triage-page page-enter">
      <OfflineBanner />

      <header className="triage-header">
        <Link to="/" className="back-link" aria-label="Back to home">← Back</Link>
        <h1 className="triage-title">Symptom Assessment</h1>
      </header>

      <form className="triage-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="symptoms-input" className="form-label">
            Describe your symptoms
          </label>
          <textarea
            id="symptoms-input"
            className="form-textarea"
            placeholder="e.g. Chest pain, shortness of breath, dizziness for the past 2 hours…"
            value={symptoms}
            onChange={e => setSymptoms(e.target.value)}
            rows={5}
            required
            aria-required="true"
          />
        </div>

        <div className="form-group">
          <p className="form-label">Perceived severity</p>
          <div className="severity-grid" role="radiogroup" aria-label="Severity level">
            {SEVERITY_OPTIONS.map(opt => (
              <label
                key={opt}
                className={`severity-chip ${severity === opt ? 'active' : ''} severity-${opt.toLowerCase()}`}
              >
                <input
                  type="radio"
                  name="severity"
                  value={opt}
                  checked={severity === opt}
                  onChange={() => setSeverity(opt)}
                  className="sr-only"
                />
                {opt}
              </label>
            ))}
          </div>
        </div>

        <button
          id="submit-triage-btn"
          type="submit"
          className="btn btn-primary btn-full"
          disabled={loading || !symptoms.trim() || !severity}
        >
          {loading ? (
            <><span className="pulse-ring" style={{ width: 22, height: 22 }} />Analysing…</>
          ) : 'Get AI Assessment →'}
        </button>
      </form>
    </main>
  )
}

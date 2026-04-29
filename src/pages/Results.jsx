import { useLocation, Link } from 'react-router-dom'
import OfflineBanner from '../components/OfflineBanner'
import './Results.css'

const ADVICE = {
  Mild:     { label: 'Self-care',      color: '#22c55e', icon: '🟢', text: 'Your symptoms appear mild. Rest, stay hydrated, and monitor for changes. No immediate medical attention required.' },
  Moderate: { label: 'See a Doctor',   color: '#f59e0b', icon: '🟡', text: 'Your symptoms warrant a visit to your GP or urgent care clinic within 24 hours.' },
  Severe:   { label: 'Urgent Care',    color: '#f97316', icon: '🟠', text: 'Please seek urgent medical attention promptly. Go to an emergency department or call your local emergency number.' },
  Critical: { label: 'Call Emergency', color: '#ef4444', icon: '🔴', text: 'Call emergency services (999 / 112 / 911) immediately. Do not drive yourself.' },
}

export default function Results() {
  const { state } = useLocation()
  const { symptoms = '—', severity = 'Mild' } = state || {}
  const advice = ADVICE[severity] || ADVICE.Mild

  return (
    <main className="results-page page-enter">
      <OfflineBanner />

      <header className="results-header">
        <Link to="/triage" className="back-link">← Reassess</Link>
        <h1 className="results-title">Your Assessment</h1>
      </header>

      <section className="results-body">
        {/* Verdict card */}
        <article className="verdict-card card" style={{ '--verdict-color': advice.color }}>
          <span className="verdict-icon">{advice.icon}</span>
          <div>
            <p className="verdict-tag">Recommendation</p>
            <h2 className="verdict-label" style={{ color: advice.color }}>{advice.label}</h2>
          </div>
        </article>

        <p className="advice-text">{advice.text}</p>

        {/* Submitted symptoms */}
        <div className="card symptoms-card">
          <p className="symptoms-heading">Reported Symptoms</p>
          <p className="symptoms-text">{symptoms}</p>
          <span className="severity-badge" style={{ background: advice.color + '22', color: advice.color }}>
            {severity}
          </span>
        </div>

        <div className="results-actions">
          <Link to="/" id="home-btn" className="btn btn-outline btn-full">← Back to Home</Link>
          <Link to="/triage" id="retriage-btn" className="btn btn-primary btn-full">Start New Triage</Link>
        </div>

        <p className="disclaimer">
          ⚠️ This is AI-generated guidance only. Always consult a licensed medical professional.
        </p>
      </section>
    </main>
  )
}

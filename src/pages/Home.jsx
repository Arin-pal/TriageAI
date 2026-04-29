import { Link } from 'react-router-dom'
import OfflineBanner from '../components/OfflineBanner'
import './Home.css'

export default function Home() {
  return (
    <main className="home page-enter">
      <OfflineBanner />

      {/* Hero */}
      <section className="home-hero">
        <div className="hero-badge">AI-Powered</div>
        <h1 className="hero-title">
          Triage<span className="brand">AI</span>
        </h1>
        <p className="hero-sub">
          Describe your symptoms and receive an AI-guided triage assessment in seconds.
        </p>

        <div className="hero-actions">
          <Link to="/triage" id="start-triage-btn" className="btn btn-primary btn-full">
            Start Triage →
          </Link>
        </div>
      </section>

      {/* Feature cards */}
      <section className="home-features">
        {[
          { icon: '⚡', title: 'Real-time Analysis', desc: 'Instant AI assessment of your symptoms' },
          { icon: '📴', title: 'Works Offline',      desc: 'Cached app shell runs without connectivity' },
          { icon: '🔒', title: 'Private & Secure',   desc: 'Your data never leaves your device' },
        ].map(({ icon, title, desc }) => (
          <article key={title} className="feature-card card">
            <span className="feature-icon" aria-hidden="true">{icon}</span>
            <h2 className="feature-title">{title}</h2>
            <p className="feature-desc">{desc}</p>
          </article>
        ))}
      </section>

      <p className="disclaimer">
        ⚠️ TriageAI is an informational tool only. Always consult a qualified healthcare professional in an emergency.
      </p>
    </main>
  )
}

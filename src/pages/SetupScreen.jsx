import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './SetupScreen.css'

// On localhost: connect directly to Ollama (no proxy needed).
// On a network IP: use the Vite proxy to avoid Safari mixed-content blocks.
// NOTE: /ollama-proxy only works in dev mode (npm run dev).
const DEFAULT_OLLAMA_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:11434'
  : window.location.origin + '/ollama-proxy'

const SERVER_HEALTH_URL = `https://${window.location.hostname}:3000/health`

export default function SetupScreen() {
  const navigate = useNavigate()
  const [ollamaUrl, setOllamaUrl] = useState(
    localStorage.getItem('ollama_url') || DEFAULT_OLLAMA_URL
  )
  const [connStatus, setConnStatus] = useState('idle') // idle | testing | success | fail
  const [connMessage, setConnMessage] = useState('')
  const [certAuthorized, setCertAuthorized] = useState(
    !!localStorage.getItem('cert_accepted')
  )

  // Skip to "/" if setup is already complete
  useEffect(() => {
    if (localStorage.getItem('setup_complete') === 'true') {
      navigate('/', { replace: true })
    }
  }, [navigate])

  const handleCertAuthorized = () => {
    localStorage.setItem('cert_accepted', 'true')
    setCertAuthorized(true)
  }

  const handleUrlChange = (e) => {
    const val = e.target.value
    setOllamaUrl(val)
    localStorage.setItem('ollama_url', val)
    setConnStatus('idle')
  }

  const testConnection = async () => {
    setConnStatus('testing')
    setConnMessage('')
    try {
      const url = ollamaUrl.trim() || DEFAULT_OLLAMA_URL
      const response = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(5000) })
      if (response.ok) {
        setConnStatus('success')
        setConnMessage('Gemma AI Ready')
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (err) {
      setConnStatus('fail')
      setConnMessage('Make sure Ollama is running on the connected laptop')
    }
  }

  const finishSetup = () => {
    localStorage.setItem('setup_complete', 'true')
    navigate('/', { replace: true })
  }

  return (
    <main className="setup-page page-enter">
      <header className="setup-header">
        <h1 className="setup-title">Initial Setup</h1>
        <p className="setup-subtitle">Connect to the AI to activate triage.</p>
      </header>

      <section className="setup-steps">

        {/* Step 1: Certificate — shown until authorized */}
        {!certAuthorized && (
          <div className="setup-step card">
            <div className="step-header">
              <span className="step-number">1</span>
              <h2>One-time security setup needed</h2>
            </div>
            <p className="step-desc">
              Your browser needs to authorize the local server certificate once before connecting.
            </p>
            <div className="setup-btn-row">
              <button
                className="btn btn-outline btn-full"
                onClick={() => window.open(SERVER_HEALTH_URL, '_blank')}
              >
                Tap here to authorize →
              </button>
            </div>
            <p className="setup-url-hint" style={{ marginTop: '12px' }}>
              In the new tab, tap <strong>Advanced → Proceed</strong>. Then come back and tap the button below.
            </p>
            <div className="setup-btn-row" style={{ marginTop: '8px' }}>
              <button
                className="btn btn-primary btn-full"
                onClick={handleCertAuthorized}
              >
                I've authorized it — continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Connect to AI — shown only after cert is authorized */}
        {certAuthorized && (
        <div className={`setup-step card ${connStatus === 'success' ? 'step-complete' : ''}`}>
          <div className="step-header">
            <span className="step-number">1</span>
            <h2>Connect to AI</h2>
            {connStatus === 'success' && <span className="step-check">✅</span>}
          </div>

          <p className="step-desc">
            TriageAI uses Ollama running on the paramedic laptop. Enter the server address and verify the connection.
          </p>

          <div className="setup-url-row">
            <label className="setup-url-label" htmlFor="ollama-url-input">Ollama Server URL</label>
            <input
              id="ollama-url-input"
              type="url"
              className="setup-url-input"
              value={ollamaUrl}
              onChange={handleUrlChange}
              placeholder="http://localhost:11434"
              spellCheck={false}
              autoCapitalize="none"
            />
            <p className="setup-url-hint">
              Default is auto-detected. Only change if Ollama runs on a different machine.
            </p>
          </div>

          {connStatus === 'success' ? (
            <div className="conn-result conn-success">
              <span className="conn-icon">✅</span>
              <span>{connMessage}</span>
            </div>
          ) : connStatus === 'fail' ? (
            <div className="conn-result conn-fail">
              <span className="conn-icon">❌</span>
              <span>{connMessage}</span>
            </div>
          ) : null}

          <div className="setup-btn-row">
            <button
              className="btn btn-outline btn-full"
              onClick={testConnection}
              disabled={connStatus === 'testing'}
            >
              {connStatus === 'testing' ? 'Testing…' : connStatus === 'fail' ? 'Retry Connection' : 'Test Connection'}
            </button>

            {connStatus === 'success' && (
              <button className="btn btn-primary btn-full mt-3" onClick={finishSetup}>
                Enter TriageAI →
              </button>
            )}
          </div>
        </div>
        )}

      </section>
    </main>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './SetupScreen.css'

const DEFAULT_OLLAMA_URL = window.location.origin + '/ollama-proxy'

export default function SetupScreen() {
  const navigate = useNavigate()
  const [isStandalone, setIsStandalone] = useState(false)
  const [ollamaUrl, setOllamaUrl] = useState(
    localStorage.getItem('ollama_url') || DEFAULT_OLLAMA_URL
  )
  const [connStatus, setConnStatus] = useState('idle') // idle | testing | success | fail
  const [connMessage, setConnMessage] = useState('')

  // Skip to "/" if setup is already complete
  useEffect(() => {
    if (localStorage.getItem('setup_complete') === 'true') {
      navigate('/', { replace: true })
    }
  }, [navigate])

  useEffect(() => {
    const mql = window.matchMedia('(display-mode: standalone)')
    setIsStandalone(mql.matches)
    const handler = (e) => setIsStandalone(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

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
        <p className="setup-subtitle">Follow these steps to activate AI triage.</p>
      </header>

      <section className="setup-steps">
        {/* Step 1: Install */}
        <div className={`setup-step card ${isStandalone ? 'step-complete' : ''}`}>
          <div className="step-header">
            <span className="step-number">1</span>
            <h2>Install App</h2>
            {isStandalone && <span className="step-check">✅</span>}
          </div>
          <p className="step-desc">
            Tap your browser menu → <strong>Add to Home Screen</strong>. This ensures the app works perfectly offline.
          </p>
        </div>

        {/* Step 2: Connect to AI */}
        <div className={`setup-step card ${connStatus === 'success' ? 'step-complete' : ''}`}>
          <div className="step-header">
            <span className="step-number">2</span>
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
              Leave this as the default auto-detected proxy URL.
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
      </section>
    </main>
  )
}

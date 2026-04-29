import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './SetupScreen.css'

const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/llm_inference/gemma_2b_en/int8/1/gemma_2b_en.bin'
const EXPECTED_SIZE = 800 * 1024 * 1024 // Fallback if no Content-Length

export default function SetupScreen() {
  const navigate = useNavigate()
  const [isStandalone, setIsStandalone] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)

  // Skip to "/" if setup is already complete
  useEffect(() => {
    if (localStorage.getItem('setup_complete') === 'true') {
      navigate('/', { replace: true })
    }
  }, [navigate])

  // Track standalone display mode
  useEffect(() => {
    const mql = window.matchMedia('(display-mode: standalone)')
    setIsStandalone(mql.matches)
    const handler = (e) => setIsStandalone(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  const startDownload = async () => {
    if (isDownloading) return
    setIsDownloading(true)
    try {
      const cache = await caches.open('triageai-models')
      const cached = await cache.match(MODEL_URL)
      
      if (cached) {
        setDownloadProgress(100)
        finishSetup()
        return
      }

      const response = await fetch(MODEL_URL)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      
      const contentLengthHeader = response.headers.get('Content-Length')
      const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : EXPECTED_SIZE
      
      let receivedBytes = 0
      const reader = response.body.getReader()
      const chunks = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        chunks.push(value)
        receivedBytes += value.length
        
        // Cap at 99 until fully processed
        const progress = Math.min(99, Math.round((receivedBytes / totalBytes) * 100))
        setDownloadProgress(progress)
      }

      // Save to cache API
      const blob = new Blob(chunks)
      await cache.put(MODEL_URL, new Response(blob))
      
      setDownloadProgress(100)
      finishSetup()
    } catch (err) {
      console.error('Download failed', err)
      alert('Failed to download model. Check connection and try again.')
      setIsDownloading(false)
      setDownloadProgress(0)
    }
  }

  const finishSetup = () => {
    localStorage.setItem('setup_complete', 'true')
    window.dispatchEvent(new Event('setup_complete'))
    setTimeout(() => {
      navigate('/', { replace: true })
    }, 600)
  }

  return (
    <main className="setup-page page-enter">
      <header className="setup-header">
        <h1 className="setup-title">Initial Setup</h1>
        <p className="setup-subtitle">Complete these steps to use TriageAI offline.</p>
      </header>

      <section className="setup-steps">
        {/* Step 1 */}
        <div className={`setup-step card ${isStandalone ? 'step-complete' : ''}`}>
          <div className="step-header">
            <span className="step-number">1</span>
            <h2>Install App</h2>
            {isStandalone && <span className="step-check" aria-hidden="true">✅</span>}
          </div>
          <p className="step-desc">
            Tap your browser menu → <strong>Add to Home Screen</strong>
          </p>
          {isStandalone && <p className="step-success">App installed successfully.</p>}
        </div>

        {/* Step 2 */}
        <div className={`setup-step card ${downloadProgress === 100 ? 'step-complete' : ''}`}>
          <div className="step-header">
            <span className="step-number">2</span>
            <h2>Download AI Model</h2>
            {downloadProgress === 100 && <span className="step-check" aria-hidden="true">✅</span>}
          </div>
          <p className="step-desc">
            TriageAI uses a lightweight local AI model to process symptoms without an internet connection.
          </p>
          
          <div className="download-action">
            {downloadProgress > 0 ? (
              <div className="progress-container">
                <div className="progress-bar-bg">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
                <span className="progress-text">{downloadProgress}%</span>
              </div>
            ) : (
              <button 
                className="btn btn-primary btn-full" 
                onClick={startDownload}
                disabled={isDownloading}
              >
                Download Gemma AI (800MB)
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

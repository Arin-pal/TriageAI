import { useState, useEffect } from 'react'
import WorkerHeader from '../components/WorkerHeader'
import WorkerBottomNav from '../components/WorkerBottomNav'
import { getAllPatients, clearAllPatients } from '../utils/patientStore'
import './Settings.css'

export default function Settings() {
  const [language, setLanguage] = useState(localStorage.getItem('app_language') || 'en-US')
  const [patientCount, setPatientCount] = useState(0)
  const [storageUsage, setStorageUsage] = useState('0 KB')
  const [ollamaUrl, setOllamaUrl] = useState(
    localStorage.getItem('ollama_url') || `http://${window.location.hostname}:11434`
  )
  const [aiConnStatus, setAiConnStatus] = useState('idle') // idle | testing | success | fail

  useEffect(() => {
    const patients = getAllPatients()
    setPatientCount(patients.length)

    let total = 0
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += (localStorage[key].length + key.length) * 2
      }
    }
    setStorageUsage((total / 1024).toFixed(2) + ' KB')
  }, [])

  const handleLanguageChange = (e) => {
    const val = e.target.value
    setLanguage(val)
    localStorage.setItem('app_language', val)
  }

  const handleOllamaUrlChange = (e) => {
    setOllamaUrl(e.target.value)
    localStorage.setItem('ollama_url', e.target.value)
    setAiConnStatus('idle')
  }

  const handleTestOllama = async () => {
    setAiConnStatus('testing')
    try {
      const url = ollamaUrl.trim() || `http://${window.location.hostname}:11434`
      const response = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(5000) })
      setAiConnStatus(response.ok ? 'success' : 'fail')
    } catch {
      setAiConnStatus('fail')
    }
  }

  const handleClearData = () => {
    const conf = window.confirm('Are you sure you want to clear all patient data? This cannot be undone.')
    if (conf) {
      clearAllPatients()
      setPatientCount(0)

      let total = 0
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += (localStorage[key].length + key.length) * 2
        }
      }
      setStorageUsage((total / 1024).toFixed(2) + ' KB')
    }
  }

  return (
    <div className="worker-page-container settings-page">
      <WorkerHeader />

      <main className="settings-main page-enter">
        <h1 className="settings-title">Settings</h1>

        {/* 1. Language */}
        <section className="settings-section">
          <h2>Language</h2>
          <p className="settings-desc">Select voice language for Text-to-Speech protocol playback.</p>
          <select className="settings-select" value={language} onChange={handleLanguageChange}>
            <option value="en-US">English</option>
            <option value="hi-IN">Hindi</option>
            <option value="ar-SA">Arabic</option>
            <option value="tr-TR">Turkish</option>
            <option value="fr-FR">French</option>
          </select>
        </section>

        {/* 2. AI Server */}
        <section className="settings-section">
          <h2>AI Server</h2>
          <p className="settings-desc">TriageAI runs inference via Ollama on the paramedic laptop. Point phones here when on a hotspot.</p>
          <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: 0, border: 'none', marginTop: '12px' }}>
            <span style={{ marginBottom: '8px' }}>Ollama Server URL:</span>
            <input
              type="url"
              className="settings-select"
              style={{ fontFamily: 'monospace', width: '100%', boxSizing: 'border-box' }}
              placeholder="http://localhost:11434"
              value={ollamaUrl}
              onChange={handleOllamaUrlChange}
            />
            <p className="settings-desc" style={{ marginTop: '6px', fontSize: '0.8rem' }}>
              Default is auto-detected. Only change if Ollama runs on a different machine.
            </p>
          </div>
          {aiConnStatus === 'success' && (
            <p style={{ color: 'var(--color-success)', fontWeight: 600, margin: '8px 0' }}>✅ Connected — Gemma AI Ready</p>
          )}
          {aiConnStatus === 'fail' && (
            <p style={{ color: 'var(--color-danger)', fontWeight: 600, margin: '8px 0' }}>❌ Cannot reach Ollama — check the server</p>
          )}
          <button className="btn btn-outline btn-full mt-3" onClick={handleTestOllama} disabled={aiConnStatus === 'testing'}>
            {aiConnStatus === 'testing' ? 'Testing…' : 'Test Connection'}
          </button>
        </section>

        {/* 3. Storage */}
        <section className="settings-section">
          <h2>Storage</h2>
          <div className="settings-row">
            <span>Saved Patients:</span>
            <span>{patientCount}</span>
          </div>
          <div className="settings-row">
            <span>Local Data Usage:</span>
            <span>{storageUsage}</span>
          </div>
          <button className="btn btn-danger btn-full mt-3" onClick={handleClearData} disabled={patientCount === 0}>
            Clear all patient data
          </button>
        </section>

        {/* 4. About */}
        <section className="settings-section about-section">
          <div className="about-content">
            <p className="version-text">TriageAI v1.0.0</p>
            <p>Works fully offline — no internet required</p>
            <p>Built for Gemma 4 Good Hackathon</p>
          </div>
        </section>

      </main>

      <WorkerBottomNav />
    </div>
  )
}

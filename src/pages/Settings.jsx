import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyzePatient } from '../ai/triageEngine'
import WorkerHeader from '../components/WorkerHeader'
import WorkerBottomNav from '../components/WorkerBottomNav'
import { getAllPatients, clearAllPatients } from '../utils/patientStore'
import './Settings.css'

export default function Settings() {
  const navigate = useNavigate()
  // AI is always ready via Ollama — no loading state needed
  
  const [language, setLanguage] = useState(localStorage.getItem('app_language') || 'en-US')
  const [patientCount, setPatientCount] = useState(0)
  const [storageUsage, setStorageUsage] = useState('0 KB')
  const [userMode, setUserMode] = useState(localStorage.getItem('user_mode') || 'worker')
  const [laptopIp, setLaptopIp] = useState(localStorage.getItem('laptop_ip') || '')
  const [ollamaUrl, setOllamaUrl] = useState(localStorage.getItem('ollama_url') || window.location.origin + '/ollama-proxy')
  const [aiConnStatus, setAiConnStatus] = useState('idle') // idle | testing | success | fail
  const [clickCount, setClickCount] = useState(0)
  const [demoMode, setDemoMode] = useState(localStorage.getItem('demo_mode') === 'true')
  const [isTesting, setIsTesting] = useState(false)

  useEffect(() => {
    // Load patient count
    const patients = getAllPatients()
    setPatientCount(patients.length)

    // Calculate raw localStorage size estimation
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

  const handleIpChange = (e) => {
    setLaptopIp(e.target.value)
    localStorage.setItem('laptop_ip', e.target.value)
  }

  const handleOllamaUrlChange = (e) => {
    setOllamaUrl(e.target.value)
    localStorage.setItem('ollama_url', e.target.value)
    setAiConnStatus('idle')
  }

  const handleTestOllama = async () => {
    setAiConnStatus('testing')
    try {
      const url = ollamaUrl.trim() || window.location.origin + '/ollama-proxy'
      const response = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(5000) })
      setAiConnStatus(response.ok ? 'success' : 'fail')
    } catch {
      setAiConnStatus('fail')
    }
  }

  const handleVersionClick = () => {
    if (clickCount >= 4) {
      setDemoMode(true)
      localStorage.setItem('demo_mode', 'true')
      
      // Inject 6 fake patients near Mumbai (Gateway of India area)
      const fakePatients = [
        { id: crypto.randomUUID(), color: 'RED', action: 'Immediate tourniquet', reasoning: 'Severe bleeding', transcript: 'Bleeding heavily from the leg', timestamp: Date.now() - 1000 * 60 * 5, lat: 18.9220, lng: 72.8346, mode: 'ai' },
        { id: crypto.randomUUID(), color: 'YELLOW', action: 'Splint and monitor', reasoning: 'Fractured radius', transcript: 'My arm hurts really bad', timestamp: Date.now() - 1000 * 60 * 15, lat: 18.9225, lng: 72.8340, mode: 'ai' },
        { id: crypto.randomUUID(), color: 'GREEN', action: 'Bandage and direct to green zone', reasoning: 'Minor lacerations', transcript: 'I cut my hand on glass', timestamp: Date.now() - 1000 * 60 * 45, lat: 18.9215, lng: 72.8350, mode: 'manual' },
        { id: crypto.randomUUID(), color: 'BLACK', action: 'Do not resuscitate, move on', reasoning: 'Unsurvivable head trauma', transcript: 'Unresponsive, pulseless', timestamp: Date.now() - 1000 * 60 * 60, lat: 18.9230, lng: 72.8335, mode: 'ai' },
        { id: crypto.randomUUID(), color: 'RED', action: 'Airway management immediately', reasoning: 'Inadequate respiration rate', transcript: 'Gasping for air, cyanotic', timestamp: Date.now() - 1000 * 60 * 90, lat: 18.9210, lng: 72.8330, mode: 'ai' },
        { id: crypto.randomUUID(), color: 'GREEN', action: 'Provide water and rest', reasoning: 'Fatigued but ambulatory', transcript: 'I am so tired and thirsty', timestamp: Date.now() - 1000 * 60 * 120, lat: 18.9240, lng: 72.8360, mode: 'manual' }
      ]
      const existing = JSON.parse(localStorage.getItem('triage_patients') || '[]')
      localStorage.setItem('triage_patients', JSON.stringify([...fakePatients, ...existing]))
      
      alert('Demo Mode Unlocked! Fake data loaded.')
      setClickCount(0)
      window.location.reload()
    } else {
      setClickCount(c => c + 1)
    }
  }
  
  const handleTestFullFlow = async () => {
    setIsTesting(true)
    const testTranscript = "Adult male, unconscious, not breathing normally, bleeding from head"
    
    try {
      const result = await analyzePatient(testTranscript)
      navigate('/worker/result', { 
        state: { 
          result, 
          transcript: testTranscript,
          manualMode: false 
        } 
      })
    } catch (err) {
      console.error('Test flow failed:', err)
      alert('AI Analysis failed during test.')
    } finally {
      setIsTesting(false)
    }
  }

  const disableDemoMode = () => {
    setDemoMode(false)
    localStorage.removeItem('demo_mode')
    window.location.reload()
  }

  const handleSwitchMode = () => {
    navigate('/')
  }

  const handleClearData = () => {
    const conf = window.confirm('Are you sure you want to clear all patient data? This cannot be undone.')
    if (conf) {
      clearAllPatients()
      setPatientCount(0)
      
      // Recalculate storage footprint
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
              Leave this as the default auto-detected proxy URL.
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

        {/* 3. User Mode */}
        <section className="settings-section">
          <h2>User Mode</h2>
          <div className="settings-row">
            <span>Current Identity:</span>
            <span style={{ fontWeight: 800 }}>{userMode.charAt(0).toUpperCase() + userMode.slice(1)}</span>
          </div>
          <button className="btn btn-outline btn-full mt-3" onClick={handleSwitchMode}>
            Switch mode
          </button>
        </section>

        {/* 4. Storage */}
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

        {/* 6. Diagnostics */}
        <section className="settings-section">
          <h2>Diagnostics</h2>
          <p className="settings-desc">Verify AI performance with a pre-set emergency scenario.</p>
          <button 
            className="btn btn-outline btn-full mt-3" 
            onClick={handleTestFullFlow}
            disabled={isTesting}
          >
            {isTesting ? 'Analyzing…' : 'Test Full Flow (AI Scenario)'}
          </button>
        </section>

        {/* 5. Laptop Sync */}
        <section className="settings-section">
          <h2>Laptop Sync</h2>
          <p className="settings-desc">Enter the local IP address of the Commander laptop to automatically sync data over the local network.</p>
          <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: 0, border: 'none', marginTop: '12px' }}>
            <span style={{ marginBottom: '8px' }}>Laptop IP Address:</span>
            <input 
              type="text" 
              className="settings-select" 
              style={{ fontFamily: 'monospace' }}
              placeholder="e.g. 192.168.1.100" 
              value={laptopIp} 
              onChange={handleIpChange}
            />
          </div>
        </section>

        {/* 6. About */}
        <section className="settings-section about-section">
          <div className="about-content">
            <p className="version-text" onClick={handleVersionClick} style={{ cursor: 'pointer' }}>TriageAI v1.0.0</p>
            {demoMode && (
              <button 
                className="btn btn-outline" 
                style={{ borderColor: 'var(--color-warning)', color: 'var(--color-warning)', padding: '6px 12px', fontSize: '0.9rem', marginBottom: '16px' }} 
                onClick={disableDemoMode}
              >
                Disable Demo Mode
              </button>
            )}
            <p>Works fully offline — no internet required</p>
            <p>Built for Gemma 4 Good Hackathon</p>
          </div>
        </section>

      </main>

      {/* Settings technically acts as a primary tab in the worker flow */}
      <WorkerBottomNav />
    </div>
  )
}

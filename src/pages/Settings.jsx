import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAI } from '../context/AIContext'
import WorkerHeader from '../components/WorkerHeader'
import WorkerBottomNav from '../components/WorkerBottomNav'
import { getAllPatients, clearAllPatients } from '../utils/patientStore'
import './Settings.css'

export default function Settings() {
  const navigate = useNavigate()
  const { isModelLoaded, isModelLoading } = useAI()
  
  const [language, setLanguage] = useState(localStorage.getItem('app_language') || 'en-US')
  const [patientCount, setPatientCount] = useState(0)
  const [storageUsage, setStorageUsage] = useState('0 KB')
  const [userMode, setUserMode] = useState(localStorage.getItem('user_mode') || 'worker')
  const [laptopIp, setLaptopIp] = useState(localStorage.getItem('laptop_ip') || '')
  const [clickCount, setClickCount] = useState(0)
  const [demoMode, setDemoMode] = useState(localStorage.getItem('demo_mode') === 'true')

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

  const handleRedownload = async () => {
    const conf = window.confirm('This will wipe the cached 800MB AI model and require re-downloading. Are you sure?')
    if (conf) {
      try {
        const cacheNames = await caches.keys()
        for (const name of cacheNames) {
          await caches.delete(name)
        }
      } catch (err) {
        console.warn('Cache clear error:', err)
      }
      localStorage.removeItem('setup_complete')
      window.location.href = '/setup'
    }
  }

  const handleVersionClick = () => {
    if (clickCount >= 4) {
      setDemoMode(true)
      localStorage.setItem('demo_mode', 'true')
      alert('Demo Mode Unlocked! Camera & AI will be bypassed.')
      setClickCount(0)
    } else {
      setClickCount(c => c + 1)
    }
  }

  const disableDemoMode = () => {
    setDemoMode(false)
    localStorage.removeItem('demo_mode')
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

        {/* 2. AI Model */}
        <section className="settings-section">
          <h2>AI Model</h2>
          <div className="settings-row">
            <span>Engine Status:</span>
            <span className={isModelLoaded ? 'status-ready' : 'status-loading'}>
              {isModelLoaded ? 'Loaded & Ready' : (isModelLoading ? 'Initializing...' : 'Offline')}
            </span>
          </div>
          <div className="settings-row">
            <span>Storage Size:</span>
            <span style={{ color: 'var(--color-text-muted)' }}>~800 MB</span>
          </div>
          <button className="btn btn-outline btn-full mt-3" onClick={handleRedownload}>
            Re-download AI Model
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

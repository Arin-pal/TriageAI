import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import WorkerHeader from '../components/WorkerHeader'
import WorkerBottomNav from '../components/WorkerBottomNav'
import { savePatient } from '../utils/patientStore'
import './ResultScreen.css'

const COLOR_MAP = {
  RED:    { hex: '#CC0000', vibrate: [300, 100, 300, 100, 300] },
  YELLOW: { hex: '#E6A817', vibrate: [200, 100, 200] },
  GREEN:  { hex: '#1A7A1A', vibrate: [100] },
  BLACK:  { hex: '#222222', vibrate: [] },
  UNKNOWN: { hex: '#444444', vibrate: [] },
  ERROR:  { hex: '#444444', vibrate: [] },
}

export default function ResultScreen() {
  const { state } = useLocation()
  const navigate = useNavigate()
  
  const manualMode = state?.manualMode || false
  const defaultResult = {
    color: 'UNKNOWN',
    action: 'Assess patient manually.',
    reasoning: 'Automated triage protocol unavailable.',
    confidence: 'low'
  }
  const result = state?.result || defaultResult
  
  const colorKey = result.color?.toUpperCase() || 'UNKNOWN'
  const colorData = COLOR_MAP[colorKey] || COLOR_MAP.UNKNOWN

  const [isFlashing, setIsFlashing] = useState(true)

  useEffect(() => {
    let mounted = true

    // 1 & 2. Flash screen & Vibrate
    if ('vibrate' in navigator && colorData.vibrate.length > 0) {
      navigator.vibrate(colorData.vibrate)
    }

    const timer = setTimeout(() => {
      if (mounted) setIsFlashing(false)
    }, 800)

    // 4. Read action text aloud
    const synth = window.speechSynthesis
    if (synth && result.action) {
      const utterance = new SpeechSynthesisUtterance(result.action)
      utterance.lang = localStorage.getItem('app_language') || 'en-US'
      synth.speak(utterance)
    }

    return () => {
      mounted = false
      clearTimeout(timer)
      if (synth) synth.cancel()
    }
  }, [colorData, result.action])

  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    let lat = null
    let lng = null

    // 1 & 2. Get GPS via navigator.geolocation (5 sec timeout)
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 10000
          })
        })
        lat = position.coords.latitude
        lng = position.coords.longitude
      } catch (err) {
        console.warn('GPS failed or timed out:', err)
      }
    }

    // 3. Call savePatient() with all data
    savePatient({
      color: result.color,
      action: result.action,
      reasoning: result.reasoning,
      transcript: state?.transcript || '',
      lat,
      lng,
      mode: manualMode ? 'manual' : 'ai'
    })
    
    // 4. Navigate back to /worker/triage
    navigate('/worker/triage', { replace: true })
  }

  const handleDiscard = () => {
    navigate('/worker/triage', { replace: true })
  }

  return (
    <div className="worker-page-container result-screen">
      <WorkerHeader />
      
      {/* 1. Fullscreen Flash Overlay */}
      {isFlashing && (
        <div 
          className="flash-overlay" 
          style={{ backgroundColor: colorData.hex }}
        />
      )}

      <main className="result-main page-enter">
        {/* 5. Manual Mode Badge */}
        {manualMode && (
          <div className="manual-badge">MANUAL PROTOCOL</div>
        )}

        {/* 3. Output Text */}
        <div className="result-content" style={{ '--result-color': colorData.hex }}>
          <h1 className="result-color-text">
            {colorKey}
          </h1>
          <p className="result-action-text">{result.action}</p>
          <p className="result-reasoning-text">{result.reasoning}</p>
        </div>

        <div className="result-actions">
          {manualMode ? (
            <button 
              className="btn btn-primary btn-full result-btn-save" 
              onClick={() => navigate('/worker/manual', { 
                replace: true,
                state: { transcript: state?.transcript || '' }
              })}
            >
              Start Manual Protocol
            </button>
          ) : (
            <>
              <button 
                className="btn btn-primary btn-full result-btn-save" 
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save & Next Patient'}
              </button>
              <button 
                className="btn btn-outline btn-full result-btn-discard" 
                onClick={handleDiscard}
              >
                Discard
              </button>
            </>
          )}
        </div>
      </main>

      <WorkerBottomNav />
    </div>
  )
}

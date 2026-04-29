import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { savePatient } from '../utils/patientStore'
import './ReportInjured.css'

export default function ReportInjured() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [answers, setAnswers] = useState([])
  const [resultColor, setResultColor] = useState(null)

  const handleAnswer = async (answer) => {
    const newAnswers = [...answers, answer]
    setAnswers(newAnswers)

    if (step < 3) {
      setStep(step + 1)
    } else {
      // All 3 questions answered
      setStep(4) // Move to loading state
      
      // Determine color: Any NO -> RED, All YES -> YELLOW
      const hasNo = newAnswers.includes('NO')
      const color = hasNo ? 'RED' : 'YELLOW'
      setResultColor(color)

      // Get GPS location
      let lat = null
      let lng = null
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
          console.warn('Civilian GPS failed or timed out:', err)
        }
      }

      // Save to global store
      savePatient({
        color,
        action: 'Civilian Report',
        reasoning: `Conscious: ${newAnswers[0]}, Breathing: ${newAnswers[1]}, Bleeding Badly: ${newAnswers[2]}`,
        lat,
        lng,
        mode: 'civilian-report'
      })

      // Move to confirmation
      setStep(5)
    }
  }

  const handleReset = () => {
    setStep(1)
    setAnswers([])
    setResultColor(null)
  }

  if (step === 5) {
    return (
      <div className="civilian-report-container confirmation-screen page-enter">
        <h1 className="confirmation-title">Report sent</h1>
        <p className="confirmation-subtitle">A responder has been notified</p>
        
        <div className={`large-color-circle circle-${resultColor.toLowerCase()}`}>
          {resultColor}
        </div>
        
        <p className="stay-safe-text">Stay with the patient if it is safe to do so</p>
        
        <div className="confirmation-actions">
          <button className="btn btn-primary btn-full" onClick={handleReset}>
            Report another person
          </button>
          <button className="btn btn-outline btn-full" onClick={() => navigate('/civilian')}>
            Go back home
          </button>
        </div>
      </div>
    )
  }

  if (step === 4) {
    return (
      <div className="civilian-report-container submitting-screen page-enter">
        <div className="spinner"></div>
        <h2>Locating and sending report...</h2>
      </div>
    )
  }

  return (
    <div className="civilian-report-container report-question-page page-enter">
      <header className="report-header">
        <button 
          className="report-back-btn" 
          onClick={() => navigate('/civilian')}
          aria-label="Cancel"
        >
          ← Cancel
        </button>
        <div className="progress-dots">
          <span className={`dot ${step >= 1 ? 'active' : ''}`}></span>
          <span className={`dot ${step >= 2 ? 'active' : ''}`}></span>
          <span className={`dot ${step >= 3 ? 'active' : ''}`}></span>
        </div>
      </header>

      <main className="report-main">
        {step === 1 && <h1 className="report-question">Are they conscious?</h1>}
        {step === 2 && <h1 className="report-question">Are they breathing?</h1>}
        {step === 3 && <h1 className="report-question">Are they bleeding badly?</h1>}
      </main>

      <div className="report-actions">
        <button className="report-btn report-btn-yes" onClick={() => handleAnswer('YES')}>YES</button>
        <button className="report-btn report-btn-no" onClick={() => handleAnswer('NO')}>NO</button>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import WorkerHeader from '../components/WorkerHeader'
import './ManualTriage.css'

export default function ManualTriage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [step, setStep] = useState(1)
  const [countdown, setCountdown] = useState(0)

  const transcript = state?.transcript || ''

  useEffect(() => {
    let timer
    if (step === 2.1 && countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [step, countdown])

  const finalize = (color, reasoning) => {
    const actionMap = {
      GREEN: "Direct to safe collection area",
      RED: "Immediate life-saving intervention needed",
      YELLOW: "Delay treatment, monitor condition",
      BLACK: "Expectant, no CPR, palliative care"
    }
    
    navigate('/worker/result', { 
      replace: true,
      state: { 
        result: {
          color,
          action: actionMap[color],
          reasoning,
          confidence: 'high'
        },
        transcript,
        manualMode: false // Reset manual mode since we just completed it
      } 
    })
  }

  const handleYes = () => {
    if (step === 1) finalize('GREEN', 'Patient is walking (minor injuries).')
    else if (step === 2) setStep(3)
    else if (step === 2.1) finalize('RED', 'Patient required airway repositioning to breathe.')
    else if (step === 3) setStep(4)
    else if (step === 4) finalize('YELLOW', 'Patient follows commands and is stable.')
  }

  const handleNo = () => {
    if (step === 1) setStep(2)
    else if (step === 2) {
      setStep(2.1)
      setCountdown(10)
    }
    else if (step === 2.1) finalize('BLACK', 'Patient is not breathing after airway repositioning.')
    else if (step === 3) finalize('RED', 'Abnormal breathing rate indicates critical condition.')
    else if (step === 4) finalize('RED', 'Cannot follow commands, indicating altered mental status.')
  }

  return (
    <div className="worker-page-container manual-triage-page">
      <header className="report-header" style={{ width: '100%', padding: '16px 20px', display: 'flex', borderBottom: '1px solid #333' }}>
        <button 
          className="report-back-btn" 
          onClick={() => navigate('/worker/triage')}
          style={{ background: 'transparent', border: 'none', color: '#a0a0a0', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
        >
          ← Cancel Protocol
        </button>
      </header>
      
      <main className="manual-triage-main page-enter">
        <div className="manual-question-container">
          {step === 1 && <h1 className="manual-question">Is the patient walking?</h1>}
          
          {step === 2 && <h1 className="manual-question">Is the patient breathing?</h1>}
          
          {step === 2.1 && (
            <>
              <h2 className="manual-instruction">Reposition the airway</h2>
              {countdown > 0 ? (
                <div className="manual-timer">{countdown}s</div>
              ) : (
                <h1 className="manual-question">Breathing now?</h1>
              )}
            </>
          )}
          
          {step === 3 && (
            <>
              <h1 className="manual-question">Is breathing rate normal?</h1>
              <p className="manual-subtext">(Not too fast, not too slow)</p>
            </>
          )}
          
          {step === 4 && <h1 className="manual-question">Can patient follow simple commands?</h1>}
        </div>

        {!(step === 2.1 && countdown > 0) && (
          <div className="manual-actions">
            <button className="manual-btn manual-btn-yes" onClick={handleYes}>YES</button>
            <button className="manual-btn manual-btn-no" onClick={handleNo}>NO</button>
          </div>
        )}
      </main>
    </div>
  )
}

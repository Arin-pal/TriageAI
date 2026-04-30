import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './DemoWalkthrough.css'

const DEMO_SCENES = [
  {
    title: 'Offline Launch',
    caption: 'TriageAI boots instantly as an installed PWA, requiring absolutely no internet connection.',
    screen: 'splash'
  },
  {
    title: 'On-Device AI Setup',
    caption: 'On first launch, it downloads the 800MB quantized Gemma E2B model directly to browser Cache Storage.',
    screen: 'setup'
  },
  {
    title: 'Dual Interface',
    caption: 'Supports both professional first responders and civilians who want to report injuries or volunteer.',
    screen: 'mode'
  },
  {
    title: 'Multimodal Triage',
    caption: 'The responder points the camera and speaks. The app uses Speech-to-Text to transcribe the injuries.',
    screen: 'triage'
  },
  {
    title: 'Local Inference',
    caption: 'The MediaPipe Engine runs inference locally. Strict parameters force it to adhere to the START protocol.',
    screen: 'analyze'
  },
  {
    title: 'Immediate Result',
    caption: 'The AI maps the patient to a triage category (RED), vibrating the device and reading instructions aloud.',
    screen: 'result'
  },
  {
    title: 'Commander Sync',
    caption: 'Data saves locally and automatically syncs to the Commander Laptop Dashboard over the local ad-hoc network.',
    screen: 'list'
  }
]

export default function DemoWalkthrough() {
  const [step, setStep] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (step >= DEMO_SCENES.length) {
      navigate('/')
      return
    }
    const timer = setTimeout(() => {
      setStep(s => s + 1)
    }, 4000)
    return () => clearTimeout(timer)
  }, [step, navigate])

  if (step >= DEMO_SCENES.length) return null

  const scene = DEMO_SCENES[step]

  return (
    <div className="demo-walkthrough">
      {/* Caption Overlay */}
      <div className="demo-caption-bar">
        <h2>{scene.title}</h2>
        <p>{scene.caption}</p>
        <div className="demo-progress">
          <div className="demo-progress-fill" key={step} style={{ animation: 'fillBar 4s linear forwards' }}></div>
        </div>
      </div>

      {/* Screen Render */}
      <div className="demo-screen-container">
        {scene.screen === 'splash' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: '#0a0a0a' }}>
            <h1 style={{ fontSize: '3.5rem', color: '#CC0000', margin: 0, fontWeight: 900 }}>TriageAI</h1>
          </div>
        )}
        
        {scene.screen === 'setup' && (
          <div style={{ padding: '24px', backgroundColor: '#0a0a0a', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h2>Gemma AI Model</h2>
            <div style={{ width: '100%', height: '8px', background: '#333', borderRadius: '4px', margin: '24px 0', overflow: 'hidden' }}>
              <div style={{ width: '60%', height: '100%', background: '#CC0000' }}></div>
            </div>
            <p>Downloading: 480MB / 800MB</p>
          </div>
        )}

        {scene.screen === 'mode' && (
          <div style={{ padding: '24px', backgroundColor: '#0a0a0a', height: '100%', display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>
            <div style={{ background: '#1a1a1a', padding: '32px', borderRadius: '12px', border: '1px solid #CC0000' }}>
              <h2 style={{ color: '#CC0000' }}>I am a Responder</h2>
            </div>
            <div style={{ background: '#1a1a1a', padding: '32px', borderRadius: '12px', border: '1px solid #0055CC' }}>
              <h2 style={{ color: '#0055CC' }}>I am a Civilian</h2>
            </div>
          </div>
        )}

        {scene.screen === 'triage' && (
          <div style={{ backgroundColor: '#111', height: '100%', position: 'relative' }}>
            <div style={{ position: 'absolute', bottom: '120px', left: '20px', right: '20px', background: 'rgba(0,0,0,0.8)', padding: '12px', borderRadius: '8px' }}>
              <p>Male approximately 40 years old, not breathing normally, large wound on left leg, unconscious...</p>
            </div>
            <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', display: 'flex', gap: '16px' }}>
               <div style={{ flex: 1, background: '#CC0000', padding: '16px', textAlign: 'center', borderRadius: '8px', fontWeight: 'bold' }}>Analyze Patient</div>
            </div>
          </div>
        )}

        {scene.screen === 'analyze' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '4px solid #CC0000', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
            <h3 style={{ marginTop: '24px' }}>Analyzing patient...</h3>
            <p style={{ color: '#aaa', marginTop: '8px' }}>Running local Gemma E2B inference</p>
          </div>
        )}

        {scene.screen === 'result' && (
          <div style={{ backgroundColor: '#CC0000', height: '100%', display: 'flex', flexDirection: 'column', padding: '24px' }}>
            <h1 style={{ fontSize: '4rem', marginTop: '40px', fontWeight: '900' }}>RED</h1>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '20px' }}>Control bleeding, airway management now</p>
            <p style={{ marginTop: '20px', opacity: 0.8 }}>Unconscious with respiratory compromise</p>
            <div style={{ marginTop: 'auto', background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold' }}>Save & Next Patient</div>
          </div>
        )}

        {scene.screen === 'list' && (
          <div style={{ backgroundColor: '#0a0a0a', height: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <span style={{ background: '#CC0000', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>RED 3</span>
              <span style={{ background: '#E6A817', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', color: 'black' }}>YELLOW 1</span>
            </div>
            <div style={{ background: '#1a1a1a', borderLeft: '6px solid #CC0000', padding: '16px', borderRadius: '8px', marginBottom: '12px' }}>
              <h4>Control bleeding, airway management now</h4>
              <p style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '4px' }}>Unconscious with respiratory compromise</p>
            </div>
            <div style={{ background: '#1a1a1a', borderLeft: '6px solid #E6A817', padding: '16px', borderRadius: '8px' }}>
              <h4>Splint and monitor</h4>
              <p style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '4px' }}>Fractured radius</p>
            </div>
            <div style={{ background: '#1A7A1A', padding: '8px', textAlign: 'center', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', marginTop: '24px' }}>
              Laptop Connected
            </div>
          </div>
        )}
      </div>

      <button className="demo-skip" onClick={() => navigate('/')}>End Walkthrough</button>
    </div>
  )
}

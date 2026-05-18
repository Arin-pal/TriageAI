import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import WorkerHeader from '../components/WorkerHeader'
import WorkerBottomNav from '../components/WorkerBottomNav'
import CameraPermission from '../components/CameraPermission'
import { useAI } from '../context/AIContext'
import { analyzePatient } from '../ai/triageEngine'
import './TriageScreen.css'

export default function TriageScreen() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const recognitionRef = useRef(null)
  const finalTranscriptRef = useRef('')
  const navigate = useNavigate()
  const { isModelLoaded } = useAI()

  const [hasPermission, setHasPermission] = useState(false)
  const activeStreamRef = useRef(null)

  const [capturedImage, setCapturedImage] = useState(null)
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [showResumeHint, setShowResumeHint] = useState(false)
  // wasListeningRef is needed because onend is registered once at mount —
  // reading isListening state there would always return its stale initial value.
  const wasListeningRef = useRef(false)
  
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeSeconds, setAnalyzeSeconds] = useState(0)
  const analyzeTimerRef = useRef(null)

  const isDemoMode = localStorage.getItem('demo_mode') === 'true'

  // Request Wake Lock to prevent screen sleep during triage
  useEffect(() => {
    let wakeLock = null
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen')
        }
      } catch (err) {
        console.warn('Wake Lock error:', err)
      }
    }
    requestWakeLock()
    return () => {
      if (wakeLock) {
        wakeLock.release().catch(console.warn)
      }
    }
  }, [])

  // Initialize camera
  useEffect(() => {
    if (isDemoMode) {
      setHasPermission(true)
    }

    return () => {
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [isDemoMode])

  const handleCameraGranted = (stream) => {
    activeStreamRef.current = stream
    setHasPermission(true)
    // The video element might not be rendered yet, so we use a small timeout or just let a standard useEffect pick up the stream. 
    // Since we transition state to hasPermission=true, the video will mount on next render.
  }

  // Bind stream to video once it renders
  useEffect(() => {
    if (hasPermission && videoRef.current && activeStreamRef.current && !isDemoMode) {
      videoRef.current.srcObject = activeStreamRef.current
    }
  }, [hasPermission, isDemoMode])

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition()

      recognition.continuous = true
      recognition.interimResults = true

      recognition.onresult = (event) => {
        let interimTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscriptRef.current += t + ' '
          } else {
            interimTranscript += t
          }
        }
        setTranscript(finalTranscriptRef.current + interimTranscript)
      }

      // Each call to recognition.start() resets event.results to an empty array.
      // finalTranscriptRef is synced to the displayed transcript in toggleMic
      // before start(), so onresult always builds on the correct baseline.
      recognition.onstart = () => {}

      recognition.onend = () => {
        if (wasListeningRef.current) {
          // Browser auto-stopped mid-session — show hint so user knows to tap mic again
          setShowResumeHint(true)
          setTimeout(() => setShowResumeHint(false), 3000)
        }
        setIsListening(false)
      }

      recognition.onerror = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }
  }, [])

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      setCapturedImage(dataUrl)
    }
  }

  const toggleMic = () => {
    if (!recognitionRef.current) return

    if (isListening) {
      // User manually stopping
      wasListeningRef.current = false
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      // User starting (or resuming) recording.
      // Sync the ref to whatever is currently displayed — this is the critical fix.
      // Each new recognition session resets event.results, so onresult must rebuild
      // from this baseline rather than from an empty string.
      wasListeningRef.current = true
      setShowResumeHint(false)
      finalTranscriptRef.current = transcript ? transcript + ' ' : ''
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const cancelAnalysis = () => {
    if (analyzeTimerRef.current) {
      clearInterval(analyzeTimerRef.current)
      analyzeTimerRef.current = null
    }
    setIsAnalyzing(false)
    setAnalyzeSeconds(0)
    // The AbortSignal.timeout in triageEngine.js will let the in-flight fetch
    // resolve or expire on its own — we just stop showing the overlay.
  }

  const handleAnalyze = async () => {
    if (!isModelLoaded) {
      navigate('/worker/result', { state: { manualMode: true, transcript } })
      return
    }

    setIsAnalyzing(true)
    setAnalyzeSeconds(0)

    analyzeTimerRef.current = setInterval(() => {
      setAnalyzeSeconds(s => s + 1)
    }, 1000)

    // Strip the data URL prefix so only the raw base64 string is sent to Ollama
    const imageBase64 = capturedImage
      ? capturedImage.replace(/^data:image\/\w+;base64,/, '')
      : null

    try {
      const result = await analyzePatient(transcript, imageBase64)
      clearInterval(analyzeTimerRef.current)
      analyzeTimerRef.current = null
      if (!result || result.color === 'ERROR') {
        navigate('/worker/result', { state: { manualMode: true, transcript } })
        return
      }
      navigate('/worker/result', { state: { result, transcript } })
    } catch (err) {
      console.error('AI Analysis threw an error:', err)
      clearInterval(analyzeTimerRef.current)
      analyzeTimerRef.current = null
      navigate('/worker/result', { state: { manualMode: true, transcript } })
    }
  }

  const handleDemoAnalyze = () => {
    setIsAnalyzing(true)
    setAnalyzeSeconds(0)
    const timer = setInterval(() => setAnalyzeSeconds(s => s + 1), 1000)
    
    // Simulate fake processing time for demo (4 seconds)
    setTimeout(() => {
      clearInterval(timer)
      navigate('/worker/result', { 
        state: { 
          result: {
            color: 'RED',
            action: 'Control bleeding, airway management now',
            reasoning: 'Unconscious with respiratory compromise',
            confidence: 'high'
          },
          transcript: 'Male approximately 40 years old, not breathing normally, large wound on left leg, unconscious',
          manualMode: false
        }
      })
    }, 4000)
  }

  const isReady = capturedImage && transcript

  return (
    <div className="worker-page-container">
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>

      {/* Pulsing recording banner — fixed so it's always visible regardless of scroll */}
      {isListening && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: 0,
          right: 0,
          background: 'red',
          color: 'white',
          padding: '16px',
          textAlign: 'center',
          fontSize: '20px',
          fontWeight: 'bold',
          animation: 'pulse 1s infinite',
          zIndex: 9999,
        }}>
          🎤 RECORDING... Tap mic to stop
        </div>
      )}

      {/* Full-screen resume overlay — appears when browser auto-stops the session */}
      {showResumeHint && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'orange',
          color: 'white',
          padding: '32px',
          borderRadius: '16px',
          fontSize: '24px',
          fontWeight: 'bold',
          textAlign: 'center',
          zIndex: 10000,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
          Recording paused<br />
          <button
            onClick={() => { setShowResumeHint(false); toggleMic() }}
            style={{
              marginTop: '16px',
              padding: '16px 32px',
              fontSize: '20px',
              background: 'white',
              color: 'orange',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            TAP TO RESUME 🎤
          </button>
        </div>
      )}

      <WorkerHeader />
      
      {!hasPermission ? (
        <CameraPermission onGranted={handleCameraGranted} />
      ) : (
        <main className="camera-main page-enter">
        <div className="camera-view">
          {/* Live rear camera feed or Demo Block */}
          {isDemoMode ? (
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#333', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                 <div style={{ fontSize: '5rem' }}>🧍</div>
                 <div style={{ marginTop: '16px', fontSize: '1.2rem', color: '#fff', fontWeight: 'bold' }}>Simulated Patient Image</div>
              </div>
            </div>
          ) : (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="video-feed"
            />
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Captured image thumbnail */}
          {capturedImage && (
            <div className="thumbnail-container" style={{ position: 'relative' }}>
              <img src={capturedImage} alt="Captured patient" className="thumbnail-img" />
              <div style={{
                position: 'absolute',
                bottom: '4px',
                left: '4px',
                background: 'rgba(0,0,0,0.7)',
                color: 'white',
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '4px',
              }}>
                🤖 AI vision
              </div>
            </div>
          )}

          {/* Live Transcript text — editable so users can correct speech errors */}
          {(transcript || isDemoMode) && (
            <div className="transcript-overlay">
              {isDemoMode ? (
                <p>Male approximately 40 years old, not breathing normally, large wound on left leg, unconscious</p>
              ) : (
                <textarea
                  value={transcript}
                  onChange={(e) => {
                    setTranscript(e.target.value)
                    // Keep ref in sync so tapping Resume doesn't overwrite manual edits
                    finalTranscriptRef.current = e.target.value
                  }}
                  placeholder="Speak or type patient description..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              )}
            </div>
          )}

          {/* Ready Banner */}
          {((isReady && !isAnalyzing && !isDemoMode) || isDemoMode) && (
            <div className="ready-banner">
              Ready to Analyze ✓
            </div>
          )}

          {/* Bottom Controls / Analyze Button */}
          {isDemoMode ? (
            <div className="analyze-action-container">
              <button className="analyze-btn" style={{ background: 'var(--color-warning)', color: '#000' }} onClick={handleDemoAnalyze}>
                Simulate Patient
              </button>
            </div>
          ) : !isReady ? (
            <div className="camera-controls">
              <button
                className={`mic-btn ${isListening ? 'listening' : ''}`}
                onClick={toggleMic}
                aria-label={isListening ? "Stop listening" : "Start listening"}
              >
                🎤
              </button>

              <button
                className="capture-btn"
                onClick={capturePhoto}
                aria-label="Capture Photo"
              >
                <div className="capture-btn-inner"></div>
              </button>

              <div className="spacer-btn"></div>
            </div>
          ) : (
            <div className="analyze-action-container">
              <button className="analyze-btn" onClick={handleAnalyze}>
                Analyze Patient
              </button>
            </div>
          )}
        </div>

        {/* Fullscreen Loading Overlay */}
        {isAnalyzing && (
          <div className="analysis-overlay">
            <div className="analysis-pulse-circle"></div>
            <p className="analysis-text">Analyzing patient...</p>
            <p className="analysis-timer">{analyzeSeconds}s</p>
            <button
              onClick={cancelAnalysis}
              style={{
                marginTop: '24px',
                padding: '12px 32px',
                background: 'transparent',
                color: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </main>
      )}

      <WorkerBottomNav />
    </div>
  )
}

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

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const handleCameraGranted = (stream) => {
    activeStreamRef.current = stream
    setHasPermission(true)
  }

  // Bind stream to video once it renders
  useEffect(() => {
    if (hasPermission && videoRef.current && activeStreamRef.current) {
      videoRef.current.srcObject = activeStreamRef.current
    }
  }, [hasPermission])

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
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')

    // Resize to max 400px wide, preserving aspect ratio
    const maxWidth = 400
    const scale = Math.min(1, maxWidth / video.videoWidth)
    canvas.width = video.videoWidth * scale
    canvas.height = video.videoHeight * scale

    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Compress to 60% JPEG quality (~50KB vs ~2MB at full res)
    const imageData = canvas.toDataURL('image/jpeg', 0.6)
    setCapturedImage(imageData)
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
      navigate('/worker/result', { state: { manualMode: true, transcript, photo: capturedImage } })
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
        navigate('/worker/result', { state: { manualMode: true, transcript, photo: capturedImage } })
        return
      }
      navigate('/worker/result', { state: { result, transcript, photo: capturedImage } })
    } catch (err) {
      console.error('AI Analysis threw an error:', err)
      clearInterval(analyzeTimerRef.current)
      analyzeTimerRef.current = null
      navigate('/worker/result', { state: { manualMode: true, transcript, photo: capturedImage } })
    }
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
            {/* Live rear camera feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="video-feed"
            />
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

            {/* Ready Banner */}
            {isReady && !isAnalyzing && (
              <div className="ready-banner">
                Ready to Analyze ✓
              </div>
            )}

            {/* Bottom Controls / Analyze Button */}
            {!isReady ? (
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

          {/* Transcript — always visible below the camera, never overlapped by the recording banner */}
          <div style={{ padding: '12px 16px 0' }}>
            <textarea
              value={transcript}
              onChange={(e) => {
                setTranscript(e.target.value)
                // Keep ref in sync so tapping Resume doesn't overwrite manual edits
                finalTranscriptRef.current = e.target.value
              }}
              placeholder="Speak or type patient description..."
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '12px',
                fontSize: '16px',
                background: '#1a1a1a',
                color: '#ffffff',
                border: '1px solid #444',
                borderRadius: '8px',
                fontFamily: 'inherit',
                resize: 'vertical',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
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

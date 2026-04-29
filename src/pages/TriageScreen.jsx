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
  const navigate = useNavigate()
  const { isModelLoaded } = useAI()

  const [hasPermission, setHasPermission] = useState(false)
  const activeStreamRef = useRef(null)

  const [capturedImage, setCapturedImage] = useState(null)
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeSeconds, setAnalyzeSeconds] = useState(0)

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
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true

      recognition.onresult = (event) => {
        let currentTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript
        }
        setTranscript(currentTranscript)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error)
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
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.")
      return
    }
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      setTranscript('')
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const handleAnalyze = async () => {
    if (!isModelLoaded) {
      navigate('/worker/result', { state: { manualMode: true, transcript } })
      return
    }

    setIsAnalyzing(true)
    setAnalyzeSeconds(0)

    const timer = setInterval(() => {
      setAnalyzeSeconds(s => s + 1)
    }, 1000)

    try {
      const result = await analyzePatient(transcript)
      clearInterval(timer)
      navigate('/worker/result', { state: { result, transcript } })
    } catch (err) {
      console.error('AI Analysis threw an error:', err)
      clearInterval(timer)
      navigate('/worker/result', { state: { manualMode: true, transcript } })
    }
  }

  const handleDemoAnalyze = () => {
    setIsAnalyzing(true)
    setAnalyzeSeconds(0)
    const timer = setInterval(() => setAnalyzeSeconds(s => s + 1), 1000)
    
    // Simulate fake processing time for demo
    setTimeout(() => {
      clearInterval(timer)
      navigate('/worker/result', { 
        state: { 
          result: {
            color: 'RED',
            action: 'Apply tourniquet immediately',
            reasoning: 'Patient has severe bleeding from the leg and requires immediate life-saving intervention.',
            confidence: 'high'
          },
          transcript: 'Patient has severe bleeding from the leg and is breathing very fast.',
          manualMode: false
        }
      })
    }, 1500)
  }

  const isReady = capturedImage && transcript

  return (
    <div className="worker-page-container">
      <WorkerHeader />
      
      {!hasPermission ? (
        <CameraPermission onGranted={handleCameraGranted} />
      ) : (
        <main className="camera-main page-enter">
        <div className="camera-view">
          {/* Live rear camera feed or Demo Block */}
          {isDemoMode ? (
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🎭</div>
              <h2 style={{ color: 'var(--color-warning)', margin: '0 0 8px' }}>DEMO MODE ACTIVE</h2>
              <p style={{ color: 'var(--color-text-muted)' }}>Camera & AI are bypassed.</p>
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
            <div className="thumbnail-container">
              <img src={capturedImage} alt="Captured patient" className="thumbnail-img" />
            </div>
          )}

          {/* Live Transcript text */}
          {transcript && (
            <div className="transcript-overlay">
              <p>{transcript}</p>
            </div>
          )}

          {/* Ready Banner */}
          {isReady && !isAnalyzing && !isDemoMode && (
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
          </div>
        )}
      </main>
      )}

      <WorkerBottomNav />
    </div>
  )
}

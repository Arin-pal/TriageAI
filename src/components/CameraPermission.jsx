import { useState } from 'react'
import './CameraPermission.css'

export default function CameraPermission({ onGranted }) {
  const [denied, setDenied] = useState(false)

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      // Keep track of stream or stop it? The prompt says "stores the stream, then proceeds"
      // But TriageScreen initializes its own stream. It might be better to just pass the stream to onGranted or just stop it.
      // Wait, prompt: "calls getUserMedia first, stores the stream, then proceeds."
      onGranted(stream)
    } catch (err) {
      console.error('Camera permission denied:', err)
      setDenied(true)
    }
  }

  return (
    <div className="camera-permission-container page-enter">
      <div className="camera-permission-card">
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📷</div>
        <h2 style={{ marginBottom: '12px', fontWeight: '800' }}>Camera Access</h2>
        
        {!denied ? (
          <>
            <p style={{ marginBottom: '24px', color: 'var(--color-text-muted)' }}>
              TriageAI requires camera access to visually assess patients during triage. Please allow access to continue.
            </p>
            <button className="btn btn-primary btn-full" onClick={requestPermission} style={{ height: '56px', fontSize: '1.1rem' }}>
              Allow Camera
            </button>
          </>
        ) : (
          <div className="camera-denied-box">
            <p style={{ color: 'var(--color-danger)', fontWeight: 'bold', marginBottom: '12px' }}>
              Access Denied
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Camera access is required for triage. Go to Chrome Settings → Site Settings → Camera → Allow this site
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

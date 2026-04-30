import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAI } from '../context/AIContext'
import { checkLaptopConnection } from '../utils/syncManager'
import './WorkerHeader.css'

export default function WorkerHeader() {
  const { isModelLoaded, isModelLoading, modelError } = useAI()
  const [laptopConnected, setLaptopConnected] = useState(false)

  useEffect(() => {
    let mounted = true
    const check = async () => {
      const ok = await checkLaptopConnection()
      if (mounted) setLaptopConnected(ok)
    }
    
    check()
    const interval = setInterval(check, 30000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return (
    <header className="worker-header">
      <Link to="/worker" className="worker-header-title">
        TriageAI
      </Link>
      
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {laptopConnected && (
          <div className="ai-status-pill" style={{ border: '1px solid rgba(26, 122, 26, 0.4)', color: 'var(--color-success)', background: 'rgba(26, 122, 26, 0.1)' }}>
            <span className="status-dot green" aria-hidden="true"></span>
            <span>Laptop connected</span>
          </div>
        )}
        
        <div className="ai-status-pill">
          {modelError ? (
            <Link to="/worker/manual" style={{display:'flex', gap:'8px', alignItems:'center', textDecoration:'none', color:'inherit'}}>
              <span className="status-dot red" aria-hidden="true"></span>
              <span>AI Offline — Manual Mode</span>
            </Link>
          ) : isModelLoading ? (
            <>
              <span className="status-dot yellow pulse" aria-hidden="true"></span>
              <span>Loading AI...</span>
            </>
          ) : isModelLoaded ? (
            <>
              <span className="status-dot green" aria-hidden="true"></span>
              <span>AI Ready</span>
            </>
          ) : (
            <>
              <span className="status-dot yellow" aria-hidden="true"></span>
              <span>Waiting...</span>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

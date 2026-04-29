import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import ModeSelect from './pages/ModeSelect'
import WorkerHome from './pages/WorkerHome'
import TriageScreen from './pages/TriageScreen'
import ResultScreen from './pages/ResultScreen'
import ManualTriage from './pages/ManualTriage'
import PatientList from './pages/PatientList'
import CivilianHome from './pages/CivilianHome'
import ReportInjured from './pages/ReportInjured'
import OfferHelp from './pages/OfferHelp'
import SetupScreen from './pages/SetupScreen'
import Settings from './pages/Settings'

export default function App() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handleOffline = () => setIsOffline(true)
    const handleOnline = () => setIsOffline(false)

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (showSplash) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', backgroundColor: '#0a0a0a', flexDirection: 'column' }}>
        <style>
          {`@keyframes heartbeat {
              0% { transform: scale(1); opacity: 0.8; }
              50% { transform: scale(1.05); opacity: 1; }
              100% { transform: scale(1); opacity: 0.8; }
            }`}
        </style>
        <h1 style={{ fontSize: '3.5rem', color: '#CC0000', margin: 0, fontWeight: 900, fontFamily: 'system-ui, -apple-system, sans-serif', animation: 'heartbeat 1.5s infinite ease-in-out' }}>
          TriageAI
        </h1>
      </div>
    )
  }

  return (
    <>
      {isOffline && (
        <div style={{ backgroundColor: '#444', color: 'white', textAlign: 'center', padding: '4px', fontSize: '13px', fontWeight: 600, zIndex: 99999, position: 'relative' }}>
          Offline — all features still work
        </div>
      )}
      <Routes>
        <Route path="/" element={<ModeSelect />} />
        <Route path="/worker" element={<WorkerHome />} />
        <Route path="/worker/triage" element={<TriageScreen />} />
        <Route path="/worker/result" element={<ResultScreen />} />
        <Route path="/worker/manual" element={<ManualTriage />} />
        <Route path="/worker/patients" element={<PatientList />} />
        <Route path="/civilian" element={<CivilianHome />} />
        <Route path="/civilian/report" element={<ReportInjured />} />
        <Route path="/civilian/help" element={<OfferHelp />} />
        <Route path="/setup" element={<SetupScreen />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </>
  )
}

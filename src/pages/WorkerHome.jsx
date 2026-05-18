import { Navigate } from 'react-router-dom'

export default function WorkerHome() {
  // Guard: send to setup if first-run
  if (localStorage.getItem('setup_complete') !== 'true') {
    return <Navigate to="/setup" replace />
  }

  // Stamp the user mode so Settings can display it
  localStorage.setItem('user_mode', 'responder')

  return <Navigate to="/worker/triage" replace />
}

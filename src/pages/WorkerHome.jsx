import { Navigate } from 'react-router-dom'

export default function WorkerHome() {
  // WorkerHome immediately redirects to the default tab: Triage
  return <Navigate to="/worker/triage" replace />
}

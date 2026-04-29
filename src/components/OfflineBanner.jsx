import { useOnlineStatus } from '../hooks/useOnlineStatus'

export default function OfflineBanner() {
  const { isOnline } = useOnlineStatus()
  if (isOnline) return null
  return (
    <div className="offline-banner" role="alert" aria-live="assertive">
      📡 You are offline — TriageAI is running from cache
    </div>
  )
}

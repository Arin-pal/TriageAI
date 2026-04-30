import { createContext, useContext, useState, useEffect } from 'react'

const AIContext = createContext()

export function AIProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false)
  const [isModelLoading, setIsModelLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    
    const checkConnection = async () => {
      const url = localStorage.getItem('ollama_url') || window.location.origin + '/ollama-proxy'
      try {
        const response = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(3000) })
        if (mounted) {
          setIsConnected(response.ok)
          setIsModelLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setIsConnected(false)
          setIsModelLoading(false)
        }
      }
    }

    checkConnection()
    const interval = setInterval(checkConnection, 30000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return (
    <AIContext.Provider value={{ 
      isModelLoaded: isConnected, 
      isModelLoading, 
      modelError: !isConnected && !isModelLoading 
    }}>
      {children}
    </AIContext.Provider>
  )
}

export function useAI() {
  return useContext(AIContext)
}

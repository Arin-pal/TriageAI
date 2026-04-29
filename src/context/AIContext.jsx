import { createContext, useContext, useState, useEffect } from 'react'
import { initModel } from '../ai/triageEngine'

const AIContext = createContext()

export function AIProvider({ children }) {
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [isModelLoading, setIsModelLoading] = useState(true) // Start assuming we need to load
  const [modelError, setModelError] = useState(false)

  useEffect(() => {
    let mounted = true
    
    async function load() {
      // Don't try loading if setup isn't complete yet
      if (localStorage.getItem('setup_complete') !== 'true') {
        if (mounted) setIsModelLoading(false)
        return
      }

      try {
        await initModel()
        if (mounted) {
          setIsModelLoaded(true)
          setIsModelLoading(false)
          setModelError(false)
        }
      } catch (err) {
        console.error('Failed to init AI model:', err)
        if (mounted) {
          setModelError(true)
          setIsModelLoading(false)
        }
      }
    }

    load()

    // Listen for custom event in case setup finishes during the same session
    const handleSetupDone = () => {
      setIsModelLoading(true)
      load()
    }
    window.addEventListener('setup_complete', handleSetupDone)

    return () => {
      mounted = false
      window.removeEventListener('setup_complete', handleSetupDone)
    }
  }, [])

  return (
    <AIContext.Provider value={{ isModelLoaded, isModelLoading, modelError }}>
      {children}
    </AIContext.Provider>
  )
}

export function useAI() {
  return useContext(AIContext)
}

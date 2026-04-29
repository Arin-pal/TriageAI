import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AIProvider } from './context/AIContext'
import './index.css'
import App from './App.jsx'

// Register service worker via vite-plugin-pwa (auto-registered)
// The PWA plugin injects the registration script automatically.

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AIProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AIProvider>
  </StrictMode>,
)

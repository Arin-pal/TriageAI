import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './OfferHelp.css'

const SKILLS = [
  'Carry people', 'First aid',
  'Translate', 'Drive/transport',
  'Find supplies', 'Follow instructions'
]

export default function OfferHelp() {
  const navigate = useNavigate()
  const [selectedSkills, setSelectedSkills] = useState([])
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [volunteerRecord, setVolunteerRecord] = useState(null)
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false)

  const toggleSkill = (skill) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
  }

  const fetchGPS = async () => {
    let lat = null
    let lng = null
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 10000
          })
        })
        lat = position.coords.latitude
        lng = position.coords.longitude
      } catch (err) {
        console.warn('GPS failed:', err)
      }
    }
    return { lat, lng }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    const { lat, lng } = await fetchGPS()

    const newVolunteer = {
      id: crypto.randomUUID(),
      skills: selectedSkills,
      note,
      lat,
      lng,
      timestamp: Date.now(),
      status: 'available'
    }

    const existing = JSON.parse(localStorage.getItem('volunteers') || '[]')
    existing.push(newVolunteer)
    localStorage.setItem('volunteers', JSON.stringify(existing))

    setVolunteerRecord(newVolunteer)
    setIsSubmitting(false)
    setIsConfirmed(true)
  }

  const handleUpdateLocation = async () => {
    if (!volunteerRecord) return
    setIsUpdatingLocation(true)
    
    const { lat, lng } = await fetchGPS()
    
    const updatedRecord = { ...volunteerRecord, lat, lng }
    setVolunteerRecord(updatedRecord)

    const existing = JSON.parse(localStorage.getItem('volunteers') || '[]')
    const updatedList = existing.map(v => v.id === updatedRecord.id ? updatedRecord : v)
    localStorage.setItem('volunteers', JSON.stringify(updatedList))
    
    setIsUpdatingLocation(false)
  }

  if (isConfirmed) {
    return (
      <div className="civilian-help-container confirmation-screen page-enter">
        <header className="help-header">
          <button className="help-back-btn" onClick={() => navigate('/civilian')}>
            ← Back Home
          </button>
        </header>

        <main className="help-confirmation-main">
          <div className="check-circle">✓</div>
          <h1 className="confirmation-title">Thank you</h1>
          <p className="confirmation-subtitle">A responder will find you</p>
          
          <div className="stay-where-you-are-box">
            <h2>Stay where you are</h2>
            <p>Your location has been logged securely.</p>
            <div className="gps-display">
              {volunteerRecord.lat && volunteerRecord.lng ? (
                <>
                  <span>LAT: {volunteerRecord.lat.toFixed(5)}</span>
                  <span>LNG: {volunteerRecord.lng.toFixed(5)}</span>
                </>
              ) : (
                <span className="no-gps">No GPS Location Available</span>
              )}
            </div>
          </div>
        </main>

        <div className="help-actions">
          <button 
            className="btn btn-outline btn-full update-location-btn" 
            onClick={handleUpdateLocation}
            disabled={isUpdatingLocation}
          >
            {isUpdatingLocation ? 'Updating...' : "I've moved — update my location"}
          </button>
        </div>
      </div>
    )
  }

  if (isSubmitting) {
    return (
      <div className="civilian-help-container submitting-screen page-enter">
        <div className="spinner"></div>
        <h2>Registering your skills...</h2>
      </div>
    )
  }

  return (
    <div className="civilian-help-container page-enter">
      <header className="help-header">
        <button className="help-back-btn" onClick={() => navigate('/civilian')}>
          ← Cancel
        </button>
        <h1 className="help-title">Offer Help</h1>
      </header>

      <main className="help-main">
        <p className="help-instruction">Select all that apply:</p>
        
        <div className="skills-grid">
          {SKILLS.map(skill => (
            <button 
              key={skill}
              className={`skill-btn ${selectedSkills.includes(skill) ? 'selected' : ''}`}
              onClick={() => toggleSkill(skill)}
            >
              {skill}
            </button>
          ))}
        </div>

        <div className="note-section">
          <label htmlFor="volunteer-note" className="note-label">Anything else? (optional)</label>
          <textarea 
            id="volunteer-note"
            className="note-textarea"
            placeholder="E.g. I have a truck, I am a nurse..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </main>

      <div className="help-actions">
        {/* Enable if at least one skill or a note is provided */}
        <button 
          className="btn btn-full ready-btn" 
          onClick={handleSubmit}
          disabled={selectedSkills.length === 0 && note.trim() === ''}
        >
          I'm Ready to Help
        </button>
      </div>
    </div>
  )
}

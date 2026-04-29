const STORAGE_KEY = 'triage_patients'
import { pushPatientToLaptop } from './syncManager'

export function savePatient(patientData) {
  const existing = getAllPatients()
  const newPatient = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    lat: null,
    lng: null,
    transcript: '',
    mode: 'ai',
    ...patientData
  }
  existing.push(newPatient)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
  
  // Background fire-and-forget sync to laptop server
  pushPatientToLaptop(newPatient)
  
  return newPatient
}

export function getAllPatients() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    const parsed = JSON.parse(data)
    // Sort descending by timestamp
    return parsed.sort((a, b) => b.timestamp - a.timestamp)
  } catch (err) {
    console.error('Failed to parse patients:', err)
    return []
  }
}

export function clearAllPatients() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
}

export function getPatientCounts() {
  const patients = getAllPatients()
  const counts = { RED: 0, YELLOW: 0, GREEN: 0, BLACK: 0 }
  
  patients.forEach(p => {
    const color = (p.color || '').toUpperCase()
    if (counts[color] !== undefined) {
      counts[color]++
    }
  })
  
  return counts
}

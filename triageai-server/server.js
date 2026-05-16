const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const os = require('os')
const https = require('https')

function getLocalIP() {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address
    }
  }
  return 'localhost'
}

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

const PATIENTS_FILE = path.join(__dirname, 'patients.json')
const VOLUNTEERS_FILE = path.join(__dirname, 'volunteers.json')

// Initialize DB files if they don't exist
if (!fs.existsSync(PATIENTS_FILE)) fs.writeFileSync(PATIENTS_FILE, JSON.stringify([]))
if (!fs.existsSync(VOLUNTEERS_FILE)) fs.writeFileSync(VOLUNTEERS_FILE, JSON.stringify([]))

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (err) {
    return []
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

app.post('/patients', (req, res) => {
  const { transcript, lat, lng, color, mode } = req.body

  // NOTE: triage runs client-side on each phone and calls Ollama directly.
  // This endpoint only receives the completed result after the AI has decided.
  // Images are never stored server-side — the payload contains text fields only.
  console.log('=== PATIENT RECORD RECEIVED ===')
  console.log('Time      :', new Date().toLocaleTimeString())
  console.log('Color     :', color || 'UNKNOWN')
  console.log('Mode      :', mode || 'unknown')
  console.log('Transcript:', transcript ? transcript.substring(0, 100) + (transcript.length > 100 ? '…' : '') : '(none)')
  console.log('Transcript length:', transcript ? transcript.length + ' chars' : '0')
  console.log('GPS       :', (lat != null && lng != null) ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'NO GPS')
  console.log('Image     : not stored server-side (processed on-device)')
  console.log('===============================')

  const patients = readJson(PATIENTS_FILE)
  patients.push(req.body)
  writeJson(PATIENTS_FILE, patients)
  res.json({ success: true })
})

app.post('/volunteers', (req, res) => {
  const volunteers = readJson(VOLUNTEERS_FILE)
  volunteers.push(req.body)
  writeJson(VOLUNTEERS_FILE, volunteers)
  res.json({ success: true })
})

app.get('/patients', (req, res) => {
  const patients = readJson(PATIENTS_FILE)
  patients.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
  res.json(patients)
})

app.get('/volunteers', (req, res) => {
  const volunteers = readJson(VOLUNTEERS_FILE)
  const available = volunteers.filter(v => v.status === 'available')
  res.json(available)
})

app.delete('/patients', (req, res) => {
  writeJson(PATIENTS_FILE, [])
  res.json({ success: true })
})

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})


app.patch('/patients/:id', (req, res) => {
  const patients = readJson(PATIENTS_FILE) || []
  const patient = patients.find(p => p.id === req.params.id)

  if (!patient) {
    return res.status(404).json({ success: false, error: 'Patient not found' })
  }

  if (req.body.assignedVolunteerId !== undefined) {
    patient.assignedVolunteerId = req.body.assignedVolunteerId
  }

  writeJson(PATIENTS_FILE, patients)
  console.log('Patient', req.params.id, 'assigned to volunteer', req.body.assignedVolunteerId)
  res.json({ success: true, patient })
})

app.get('/export/csv', (req, res) => {
  const patients = readJson(PATIENTS_FILE) || []

  let csv = 'id,color,mode,transcript,latitude,longitude,timestamp\n'

  patients.forEach(p => {
    const transcript = (p.transcript || '').replace(/"/g, '""').replace(/\n/g, ' ')
    csv += [
      p.id || '',
      p.color || '',
      p.mode || '',
      `"${transcript}"`,
      p.lat || '',
      p.lng || '',
      p.timestamp || ''
    ].join(',') + '\n'
  })

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename=triage-patients.csv')
  res.send(csv)
})

const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'cert.pem')),
}

https.createServer(httpsOptions, app).listen(PORT, '0.0.0.0', () => {
  console.log('TriageAI Server running (HTTPS)')
  console.log('Local IP:     ', getLocalIP())
  console.log('Phones connect to: https://' + getLocalIP() + ':' + PORT)
  console.log('NOTE: Accept the certificate warning in your browser once.')
})

const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const os = require('os')

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

app.listen(PORT, '0.0.0.0', () => {
  console.log('TriageAI Server running')
  const nets = os.networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`Local IP: ${net.address}`)
        console.log(`Phones should connect to: http://${net.address}:${PORT}`)
      }
    }
  }
})

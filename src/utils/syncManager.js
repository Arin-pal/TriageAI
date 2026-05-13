// Resolve laptop IP from explicit setting, or extract host from the Ollama URL
// so users only need to configure one field in Settings.
function getLaptopIP() {
  const ip = localStorage.getItem('laptop_ip')
  if (ip) return ip

  const ollamaUrl = localStorage.getItem('ollama_url')
  if (ollamaUrl) {
    const match = ollamaUrl.match(/https?:\/\/([^:/]+)/)
    if (match) return match[1]
  }
  return null
}

export async function checkLaptopConnection() {
  const ip = getLaptopIP()
  if (!ip) return false

  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 2000)
    const res = await fetch(`http://${ip}:3000/health`, {
      signal: controller.signal
    })
    clearTimeout(id)
    return res.ok
  } catch (err) {
    return false
  }
}

export async function pushPatientToLaptop(patient) {
  const ip = getLaptopIP()
  if (!ip) {
    console.warn('No laptop IP configured, patient not synced')
    return false
  }

  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 2000)

    const response = await fetch(`http://${ip}:3000/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patient),
      signal: controller.signal
    })
    clearTimeout(id)

    if (response.ok) {
      console.log('✅ Patient synced to laptop')
      return true
    }
    return false
  } catch (err) {
    console.warn('Sync to laptop failed:', err)
    return false
  }
}

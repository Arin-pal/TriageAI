// The phone loads this app FROM the laptop, so the laptop's IP
// is always the hostname in the current page URL. This never goes stale
// and requires zero configuration, even when the network changes.
function getLaptopIP() {
  return window.location.hostname
}

export async function checkLaptopConnection() {
  const ip = getLaptopIP()
  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 2000)
    const res = await fetch(`https://${ip}:3000/health`, {
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
  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 2000)

    const response = await fetch(`https://${ip}:3000/patients`, {
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

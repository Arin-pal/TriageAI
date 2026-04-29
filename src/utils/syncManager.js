export async function checkLaptopConnection() {
  const ip = localStorage.getItem('laptop_ip')
  if (!ip) return false
  
  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 2000)
    
    // Expects a simple health endpoint to verify connectivity
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
  const ip = localStorage.getItem('laptop_ip')
  if (!ip) return false

  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 2000)
    
    await fetch(`http://${ip}:3000/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patient),
      signal: controller.signal
    })
    clearTimeout(id)
    return true
  } catch (err) {
    console.warn('Sync to laptop failed silently:', err)
    return false
  }
}

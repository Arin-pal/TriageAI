export const isModelLoaded = true;


export async function analyzePatient(transcript, imageBase64) {
  const langCode = localStorage.getItem('app_language') || 'en-US';
  const langMap = {
    'en-US': 'English',
    'hi-IN': 'Hindi',
    'ar-SA': 'Arabic',
    'tr-TR': 'Turkish',
    'fr-FR': 'French'
  };
  const langName = langMap[langCode] || 'English';

  const prompt = `You are a medical triage assistant.
Analyze the patient description and classify using 
START triage protocol.

Patient description: ${transcript}

Classify into exactly one category using START triage protocol:
GREEN - Walking wounded. Minor injuries, ambulatory, can follow commands. Breathing normally, no life threat.
YELLOW - Serious but stable. Injured and cannot walk but breathing normally (rate 8-30), pulse present, capillary refill ≤2s. Can wait up to 1 hour.
RED - Life-threatening but SURVIVABLE with immediate intervention. Breathing only after airway repositioning, respiratory rate >30 or <8, capillary refill >2 seconds, or altered mental status. Has a pulse.
BLACK - Deceased or unsurvivable. No breathing after airway repositioning, no pulse, or injuries incompatible with life. Do not use resources.

Important rules:
- If patient is walking and talking → GREEN
- If patient says they are fine or has minor cuts/bruises → GREEN
- 'No pulse' or 'pulseless' → BLACK (never RED)
- Only use RED for patients who have a pulse but need immediate airway or bleeding intervention
- When unsure between RED and YELLOW → choose YELLOW
- IMPORTANT: The 'action' and 'reasoning' fields must be translated to ${langName}. The 'color' must remain in English.

Respond ONLY with valid JSON in this exact format: {"color":"RED|YELLOW|GREEN|BLACK","action":"short action text","reasoning":"short reason","confidence":"high|medium|low"}
No explanation, no markdown, no reasoning chain. JSON only:`;

  const body = {
    model: 'gemma4:e4b',
    prompt: prompt,
    stream: false,
    think: false,
    format: 'json',
    options: {
      temperature: 0.1,
      num_predict: 150
    }
  };

  if (imageBase64) {
    body.images = [imageBase64];
  }

  try {
    // On localhost: connect directly to Ollama. On a network IP: use Vite proxy to avoid Safari mixed-content.
    // NOTE: /ollama-proxy only works in dev mode (npm run dev).
    const defaultUrl = window.location.hostname === 'localhost'
      ? 'http://localhost:11434'
      : window.location.origin + '/ollama-proxy'
    const ollamaUrl = localStorage.getItem('ollama_url') || defaultUrl;

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(45000)
    });

    if (!response.ok) throw new Error('Ollama request failed');

    const data = await response.json();
    const text = data.response.trim();

    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) throw new Error('No JSON in response: ' + text);

    const result = JSON.parse(jsonMatch[0]);

    const validColors = ['RED','YELLOW','GREEN','BLACK'];
    if (!validColors.includes(result.color?.toUpperCase())) {
      result.color = 'YELLOW';
    }
    result.color = result.color.toUpperCase();

    return result;

  } catch (error) {
    const isTimeout = error.name === 'TimeoutError' || error.name === 'AbortError'
    console.error('Ollama error:', error);
    return {
      color: 'ERROR',
      action: isTimeout ? 'AI timeout — use manual protocol' : 'Use manual protocol now',
      reasoning: isTimeout
        ? 'Ollama did not respond in 45 seconds'
        : 'AI unavailable: ' + error.message,
      confidence: 'low'
    };
  }
}

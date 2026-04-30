const OLLAMA_URL = localStorage.getItem('ollama_url') 
  || 'http://192.168.137.1:11434';

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

Classify into exactly one category:
GREEN - Patient is walking, talking, and conscious with minor or no injuries. Can help themselves.
YELLOW - Patient is injured but stable. Breathing normally, has a pulse, can follow commands. Not immediate danger.
RED - Patient has life threatening injuries but CAN survive with immediate treatment. Unconscious, not breathing normally, severe bleeding, no pulse.
BLACK - Patient is deceased or has unsurvivable injuries. Do not use resources.

Important rules:
- If patient says they are fine or okay → GREEN
- If patient is walking and talking → GREEN  
- If patient has minor cuts or bruises → GREEN
- Only use RED for genuinely life threatening situations
- When unsure between RED and YELLOW → choose YELLOW
- IMPORTANT: The 'action' and 'reasoning' fields must be translated to ${langName}. The 'color' must remain in English.

Return ONLY this JSON, nothing else:
{"color":"GREEN","action":"specific instruction max 10 words","reasoning":"one sentence","confidence":"high"}

JSON:`;

  const body = {
    model: 'gemma3:4b',
    prompt: prompt,
    stream: false,
    options: {
      temperature: 0.1,
      num_predict: 150
    }
  };

  if (imageBase64) {
    body.images = [imageBase64];
  }

  try {
    const ollamaUrl = localStorage.getItem('ollama_url') || window.location.origin + '/ollama-proxy';
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
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
    console.error('Ollama error:', error);
    return {
      color: 'ERROR',
      action: 'Use manual protocol now',
      reasoning: 'AI unavailable: ' + error.message,
      confidence: 'low'
    };
  }
}

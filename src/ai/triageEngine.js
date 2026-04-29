import { FilesetResolver, LlmInference } from '@mediapipe/tasks-genai'

export let isModelLoaded = false
let llmInference = null

const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/llm_inference/gemma_2b_en/int8/1/gemma_2b_en.bin'

export async function initModel() {
  if (isModelLoaded) return

  // Load the model from Cache API
  const cache = await caches.open('triageai-models')
  const cachedResponse = await cache.match(MODEL_URL)

  if (!cachedResponse) {
    throw new Error('AI Model not found in cache. Setup was not completed.')
  }

  // Convert to object URL to avoid excessive RAM overhead
  const modelBlob = await cachedResponse.blob()
  const blobUrl = URL.createObjectURL(modelBlob)
  
  const startTime = Date.now()

  try {
    // Resolve WASM binaries
    const genaiFileset = await FilesetResolver.forGenAiTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai/wasm'
    )

    // Initialize Gemma
    llmInference = await LlmInference.createFromOptions(genaiFileset, {
      baseOptions: {
        modelAssetPath: blobUrl,
      },
      maxTokens: 200,
      topK: 1,
      temperature: 0.1,
      randomSeed: 1,
    })

    // Warmup call to prevent first-run latency
    await llmInference.generateResponse('Return this JSON: {color: GREEN, action: test}')

    const loadTime = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`Model loaded in ${loadTime}s`)

    isModelLoaded = true
  } finally {
    // Clean up the object URL to free memory
    URL.revokeObjectURL(blobUrl)
  }
}

export async function analyzePatient(transcript) {
  if (!isModelLoaded || !llmInference) {
    throw new Error('Model is not initialized yet.')
  }

  const systemPrompt = `You are a triage assistant. Output JSON only. No other text.

Rules:
- If patient is walking and talking: {"color":"GREEN","action":"Walking wounded, move to green area","reasoning":"Patient ambulatory","confidence":"high"}
- If patient is not breathing after airway repositioned: {"color":"BLACK","action":"Do not resuscitate, move on","reasoning":"Unsurvivable","confidence":"high"}  
- If breathing over 30 per minute or under 10: {"color":"RED","action":"[specific action for this patient]","reasoning":"Respiratory compromise","confidence":"high"}
- If no radial pulse or capillary refill over 2 seconds: {"color":"RED","action":"[specific action]","reasoning":"Circulatory compromise","confidence":"high"}
- If cannot follow commands: {"color":"RED","action":"[specific action]","reasoning":"Altered mental status","confidence":"high"}
- Otherwise: {"color":"YELLOW","action":"[specific action]","reasoning":"Stable","confidence":"medium"}

Patient description: ${transcript}

Respond with JSON only:`

  // Format using Gemma's turn-based chat template
  const formattedPrompt = `<start_of_turn>user\n${systemPrompt}<end_of_turn>\n<start_of_turn>model\n`

  try {
    const response = await llmInference.generateResponse(formattedPrompt)

    // Clean up any markdown code blocks or whitespace the model might output
    const jsonStr = response.replace(/```json/gi, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(jsonStr)

    // Ensure it has all required fields just to be safe
    return {
      color: parsed.color || 'ERROR',
      action: parsed.action || 'Check manually',
      reasoning: parsed.reasoning || 'AI returned incomplete data',
      confidence: parsed.confidence || 'low'
    }
  } catch (error) {
    console.error('AI parse failed or model generation error:', error)
    return {
      color: 'ERROR',
      action: 'Use manual protocol now',
      reasoning: 'AI parse failed',
      confidence: 'low'
    }
  }
}

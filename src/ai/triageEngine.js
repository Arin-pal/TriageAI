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
      maxTokens: 256,
      topK: 1,
    })

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

  const systemPrompt = `You are a medical triage assistant in a disaster zone. 
Follow the START protocol strictly. The responder will 
describe a patient. Return ONLY this JSON, nothing else:
{
  "color": "RED" or "YELLOW" or "GREEN" or "BLACK",
  "action": "maximum 10 words telling responder what to do",
  "reasoning": "one sentence clinical explanation",
  "confidence": "high" or "medium" or "low"
}
RED = life threatening but survivable, treat immediately.
YELLOW = serious but stable, can wait.
GREEN = minor injuries, walking wounded.
BLACK = deceased or unsurvivable injuries.`

  const userPrompt = `Patient description: ${transcript}`

  // Format using Gemma's turn-based chat template
  const formattedPrompt = `<start_of_turn>user\n${systemPrompt}\n\n${userPrompt}<end_of_turn>\n<start_of_turn>model\n`

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

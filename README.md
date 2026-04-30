# TriageAI

**An AI-Powered Medical Triage Assistant for Mass Casualty Events**

TriageAI is an offline-capable Progressive Web App (PWA) designed to aid emergency responders in classifying patients during mass casualty events using the standard START protocol. It utilizes on-device AI inference to function perfectly without any internet access.

## How to Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
   The app will run locally over HTTPS. Note: It requires a secure context (HTTPS) or `localhost` to access device hardware like the camera and microphone.

## How to Deploy

To create a production-ready static build:
```bash
npm run build
```
This generates the optimized bundle in the `dist/` directory, complete with Service Workers and caching policies required for a fully offline PWA installation.

## How to Set Up the Laptop Server

The TriageAI system includes an optional Commander Dashboard for incident commanders to monitor realtime patient data across a local network without relying on cloud infrastructure.

1. Navigate to the server directory:
   ```bash
   cd triageai-server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the server:
   ```bash
   node server.js
   ```
4. Access the dashboard by opening `http://<laptop-ip>:3000/commander.html` in a web browser.
5. In the TriageAI mobile app, go to Settings and enter the Laptop IP Address to synchronize data.

## Gemma 4 Features Utilized

- **On-device inference (Gemma E2B):** TriageAI leverages the powerful MediaPipe Tasks GenAI API to run a 2B-parameter Gemma model fully on-device, meaning zero latency from cloud roundtrips and 100% offline functionality.
- **Multimodal input (vision + voice):** Combines visual data from the device camera with the Web Speech API to provide the LLM with comprehensive multimodal contextual understanding of the patient's state.
- **Reasoning mode (START protocol):** Uses strict few-shot prompting to force the LLM into a rigid analytical reasoning flow that enforces the global START (Simple Triage and Rapid Treatment) medical protocol.
- **Multilingual output:** Integrates text-to-speech feedback, supporting multiple languages out of the box (English, Hindi, Arabic, Turkish, French) to guide responders natively.

## Hackathon Tracks

TriageAI is entering the following tracks:
- **Health and Sciences** (Primary)
- **Global Resilience**
- **Safety**
- **Technical Excellence**

# TriageAI

**AI-Powered Medical Triage for Mass Casualty Events**

TriageAI is an offline-capable Progressive Web App (PWA) that helps emergency responders rapidly classify patients during mass casualty events using the standard START triage protocol. A paramedic points their phone camera at a patient, describes injuries by voice, and receives an immediate AI-generated triage colour — RED, YELLOW, GREEN, or BLACK — with spoken instructions.

Inference runs on a laptop over a local WiFi hotspot via [Ollama](https://ollama.com) running **Gemma 4 E4B** — no cloud, no internet required.

---

## Architecture

```
Phone (PWA)                         Laptop
┌───────────────────────┐           ┌──────────────────────────────┐
│  Camera + Mic          │  WiFi    │  Ollama  (gemma4:e4b)         │
│  Speech-to-Text        │ ──────▶  │  Express server  :3000        │
│  analyzePatient()      │ ◀──────  │  patients.json               │
│  Result + TTS          │          │  React /commander (Leaflet)  │
└───────────────────────┘           └──────────────────────────────┘
```

- **Phones** run the React PWA, capture image + voice, send to Ollama, display result
- **Laptop** runs Ollama for inference and the Express server for data sync
- **Commander dashboard** polls the Express server every 5 s and renders a live Leaflet map

---

## Quick Start

### 1 — Laptop setup

```bash
# Install Ollama from https://ollama.com, then pull the model:
ollama pull gemma4:e4b

# Start the triage data server:
cd triageai-server
npm install
node server.js
# Prints the local IP on startup, e.g. https://192.168.1.10:3000
```

> **Certificate note:** The backend uses a self-signed certificate (`key.pem` / `cert.pem` in `triageai-server/`). The first time any device opens `https://<laptop-ip>:3000/health` in a browser, click through the certificate warning once — subsequent requests from that device will succeed silently.

### 2 — Frontend (development)

```bash
npm install
npm run dev
# Serves over HTTPS on port 5174 — required for camera + mic APIs
```

### 3 — Connect phones

1. Join the laptop's WiFi hotspot on each phone
2. Open `https://<laptop-ip>:5174` in Chrome (accept the Vite dev-cert warning once)
3. Go to **Settings → Ollama Server URL** and set `http://<laptop-ip>:11434`
4. Tap **Test Connection** — should show "Gemma AI Ready"

> The app derives the laptop IP automatically from the page URL — no separate "Laptop IP" field needs to be configured.

### 4 — Commander dashboard

Open `https://<laptop-ip>:5174/commander` in any browser on the same network (accept the cert warning once). The commander view includes a live Leaflet map and CSV export.

---

## Production Build

```bash
npm run build
# Output in dist/ — serve over HTTPS (required for camera/mic)
```

> **Note:** The Vite dev proxy (`/ollama-proxy`) is only available in dev mode. In production builds, phones must point directly to `http://<laptop-ip>:11434` in **Settings → Ollama Server URL**.

---

## Features

| Feature | Detail |
|---|---|
| **Multimodal AI triage** | Photo + voice transcript sent to Gemma 4 E4B via Ollama |
| **START protocol enforcement** | Strict prompt forces RED / YELLOW / GREEN / BLACK output |
| **Spoken result** | Web Speech API reads the action instruction aloud |
| **Haptic feedback** | Vibration pattern differs per triage colour |
| **Editable transcript** | Paramedic can correct speech-to-text before submitting |
| **Continuous speech** | Auto-detects browser pause and prompts to resume |
| **Commander map** | Live Leaflet map with colour-coded patient markers |
| **CSV export** | Download full incident log from commander dashboard |
| **Offline PWA** | Installs to home screen, works without internet after setup |
| **Multilingual TTS** | English, Hindi, Arabic, Turkish, French |
| **Demo mode** | Hidden unlock (tap version 5×) injects sample patients |

---

## Project Structure

```
├── src/
│   ├── ai/triageEngine.js        # Ollama API call, prompt, JSON parsing
│   ├── pages/
│   │   ├── TriageScreen.jsx      # Camera + mic + capture + analyze
│   │   ├── ResultScreen.jsx      # Triage result, TTS, GPS save
│   │   ├── CommanderDashboard.jsx# React commander view with Leaflet map
│   │   ├── PatientList.jsx       # Phone-side patient log
│   │   └── Settings.jsx          # Ollama URL, language, laptop IP
│   └── utils/
│       ├── patientStore.js       # localStorage + server sync
│       └── syncManager.js        # pushPatientToLaptop (derives laptop IP from window.location.hostname)
├── triageai-server/
│   ├── server.js                 # Express: /patients /volunteers /health /export/csv /patients/:id
│   ├── key.pem / cert.pem        # Self-signed TLS certificate (HTTPS on :3000)
│   └── patients.json             # Persistent patient store (JSON file)
└── public/                       # PWA assets
```

---

## Gemma 4 Features Used

- **Gemma 4 E4B (edge-optimised 4B):** Runs on a laptop GPU/CPU via Ollama. Fits in ~9.6 GB, designed for edge deployment
- **Multimodal vision + text:** Image base64 and voice transcript both sent in the same request (`body.images` + `body.prompt`)
- **JSON-constrained output:** `format: 'json'` and `think: false` force deterministic structured output
- **Multilingual reasoning:** Prompt instructs the model to translate `action` and `reasoning` fields into the paramedic's configured language while keeping `color` in English

---

## Hackathon Tracks

- **Health and Sciences** (primary)
- **Global Resilience**
- **Safety**
- **Technical Excellence**

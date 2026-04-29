# TriageAI

AI-powered medical triage Progressive Web App built with React + Vite.

## Stack

| Tool | Purpose |
|------|---------|
| React 18 | UI framework |
| React Router DOM v6 | Client-side routing |
| Vite 6 | Build tool & dev server |
| vite-plugin-pwa | PWA manifest + Workbox service worker |

## Getting Started

> Node.js 18+ required.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview production build locally
```

## PWA / Install on Android Chrome

1. Run `npm run build && npm run preview` (or deploy to HTTPS).
2. Open in Chrome on Android → tap **Add to Home Screen** in the browser menu.
3. The app installs as a standalone PWA with theme colour `#CC0000`.

## Offline Support

`vite-plugin-pwa` generates a Workbox service worker that:

- **Pre-caches** all built JS/CSS/HTML/assets on install.
- **Cache-First** for fonts and static assets.
- **Network-First** for API calls with cached fallback.
- Displays an offline banner when connectivity is lost.

## PWA Config Summary

| Field | Value |
|-------|-------|
| name | TriageAI |
| short_name | TriageAI |
| theme_color | `#CC0000` |
| background_color | `#0a0a0a` |
| display | standalone |
| orientation | portrait |
| start_url | / |

## Project Structure

```
src/
  components/
    OfflineBanner.jsx   # Shown when offline
  hooks/
    useOnlineStatus.js  # navigator.onLine listener
  pages/
    Home.jsx / .css
    Triage.jsx / .css
    Results.jsx / .css
    NotFound.jsx
  App.jsx               # Routes
  main.jsx              # Entry point
  index.css             # Design system

sw.js                   # Custom SW reference (Workbox auto-generates in dist/)
vite.config.js          # Vite + PWA config
```

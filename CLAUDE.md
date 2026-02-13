# Running Dashboard — CLAUDE.md

## Project
Personal running dashboard pulling live data from Strava API.
Flask backend + React frontend (single-page, inline styles).
**Live demo**: https://ai-run-partner.onrender.com

## Stack
- Backend: Python 3.9+, Flask, requests, gunicorn
- Frontend: React 18 (single .jsx, inline styles, Babel in-browser, no build step)
- Auth: Strava OAuth 2.0 (tokens stored server-side in JSON file)
- AI: Claude API (Sonnet) via direct HTTP — coaching messages
- Weather: OpenWeatherMap One Call API 3.0
- Maps: Leaflet.js (CartoDB Voyager + Esri Satellite tiles)
- Deploy: Render (Procfile + gunicorn)

## Key Files
- `app.py` — Flask routes (OAuth, API endpoints, assistant, static serving)
- `strava_client.py` — Strava API wrapper + data transforms
- `weather_client.py` — OpenWeatherMap client (hourly + 48h forecast)
- `assistant_client.py` — Claude API coaching messages (mode detection, caching, context)
- `config.py` — Environment variables + constants
- `static/app.jsx` — **LIVE frontend** — ALL UI edits go here
- `running-dashboard-wireframe.jsx` — Reference only — NEVER edit
- `templates/index.html` — HTML shell + CDN links + APP_MODE injection
- `running-dashboard-design-decisions.md` — Design log

## Critical Rules
- `static/app.jsx` is the LIVE frontend — ALL UI edits go here
- `running-dashboard-wireframe.jsx` is REFERENCE ONLY — never edit
- `templates/index.html` — only touch to add script/link tags, not UI
- Demo mode (hardcoded data) stays functional as fallback — never remove it
- Backend response JSON MUST match wireframe constant shapes exactly
- Run type tagging remains manual (Strava `workout_type` only partially maps)
- Shoe max mileage is user-configured (default 300mi), not from Strava
- `goalMi` is user-configured, not from Strava
- `suffer_score` (Relative Effort) can be null — show "—" if missing
- All distances from Strava are in meters — convert to miles
- Rate limit: 100 requests / 15 min — cache responses for 5 min minimum

## Completed Phases
1. ✅ **Phase 1: Strava API Integration** — OAuth, profile, activities, weeks, settings
2. ✅ **Phase 2: Frontend Polish** — Theme system, route maps, activity cards, splits
3. ✅ **Phase 3: Weather + Shoes** — OpenWeatherMap, shoe tracker, favorites
4. ✅ **Phase 4: AI Assistant** — Claude API coaching, mode detection, caching, context
5. ✅ **Deployment** — Render, APP_MODE, timezone fix, demo mode

## Remaining Polish
- Demo polylines — current routes are geometric; replace with road-traced GPX
- Map cleanup — loading placeholder, error states for missing tiles
- Loading animation — skeleton screens for initial page load

## APP_MODE System
Environment variable `APP_MODE` controls frontend behavior:
- `development` (default) — DEMO/LIVE toggle visible, for local testing
- `personal` — starts in live mode, no toggle, straight to Strava auth
- `demo` — starts in demo mode, no toggle, info banner shown
- URL override: `?mode=personal` or `?mode=demo` overrides server APP_MODE

## Environment Variables
```
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
FLASK_SECRET_KEY=
REDIRECT_URI=http://localhost:5000/auth/callback
OPENWEATHER_API_KEY=
ANTHROPIC_API_KEY=
APP_MODE=development
```

## Pre-Deploy Checklist
- [x] `.env` not committed (`.gitignore` confirmed)
- [x] `Procfile` present: `web: gunicorn app:app`
- [x] `requirements.txt` has all deps
- [x] Test locally: `flask run --debug`
- [x] OAuth callback URL matches environment (localhost vs Render URL)
- [x] Favicon path correct
- [x] Demo mode works without Strava auth
- [x] Weather timezone uses America/Los_Angeles (not server UTC)
- [x] APP_MODE injectable via env var or URL param

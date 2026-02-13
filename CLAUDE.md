# Running Dashboard — CLAUDE.md

## Project
Personal running dashboard pulling live data from Strava API.
Flask backend + React frontend (single-page, inline styles).

## Stack
- Backend: Python 3.11+, Flask, requests
- Frontend: React (single .jsx artifact, inline styles, no build step)
- Auth: Strava OAuth 2.0 (tokens stored server-side in JSON file)
- Deploy: Render (Procfile + gunicorn)

## Key Files
- `app.py` — Flask routes (OAuth, API endpoints, static serving)
- `strava_client.py` — Strava API wrapper + data transforms
- `config.py` — Environment variables + constants
- `running-dashboard-wireframe.jsx` — React frontend (reference)
- `running-dashboard-design-decisions.md` — Design log
- `phase1-strava-api-plan.md` — Full Phase 1 spec

## Critical
- static/app.jsx is the LIVE frontend file — ALL UI edits go here
- running-dashboard-wireframe.jsx is a REFERENCE ONLY — never edit it

## Slash Commands
- `/explore` — Read this file + design-decisions.md + wireframe.jsx + phase1 plan
- `/plan` — Review current phase, identify the next unfinished step
- `/execute` — Implement the current step, test locally with `flask run`
- `/review` — Run the app, verify data renders, check for bugs
- `/peer-review` — Critique code quality, error handling, edge cases
- `/update-docs` — Update design-decisions.md and this file with what changed

## Pre-Deploy Checklist
- [ ] `.env` not committed (`.gitignore` confirmed)
- [ ] `Procfile` present: `web: gunicorn app:app`
- [ ] `requirements.txt` has all deps
- [ ] Test locally: `flask run --debug`
- [ ] OAuth callback URL matches environment (localhost vs Render URL)
- [ ] Favicon path correct
- [ ] Demo mode toggle works without Strava auth

## Current Phase
**Phase 1: Strava API Integration**

Steps:
1. ✅ Project scaffold
2. ⬜ Strava OAuth flow — test with real credentials
3. ⬜ strava_client.py — API calls + transforms
4. ⬜ Backend routes — /api/profile, /api/activities, /api/weeks, /api/settings
5. ⬜ Frontend integration — useEffect fetching, loading states, demo fallback
6. ⬜ Testing + polish

## Critical Rules
- Backend response JSON MUST match wireframe constant shapes exactly
- Demo mode (hardcoded data) stays functional as fallback — never remove it
- Run type tagging remains manual (Strava `workout_type` only partially maps)
- Shoe max mileage is user-configured (default 300mi), not from Strava
- `goalMi` is user-configured, not from Strava
- `suffer_score` (Relative Effort) can be null — show "—" if missing
- All distances from Strava are in meters — convert to miles
- Check athlete's `measurement_preference` for splits (metric vs imperial)
- Rate limit: 100 requests / 15 min — cache responses for 5 min minimum

## Environment Variables
```
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
FLASK_SECRET_KEY=
REDIRECT_URI=http://localhost:5000/auth/callback
```

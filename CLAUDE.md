# AI Run Partner — CLAUDE.md

## Project
Personal running dashboard pulling live data from Strava API.
Flask backend + React frontend (single-page, inline styles).
**Live demo**: https://ai-run-partner.onrender.com
**Repo**: https://github.com/raoulkahn/running-dashboard

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
4. ✅ **Phase 4: AI Assistant** — Claude Sonnet API coaching, mode detection (pre_run/post_run/rest_day/evening_no_run), caching, safety guardrails, weather-aware planning, 48hr forecast context
5. ✅ **Phase 5: Deployment** — Render, APP_MODE (demo/personal/development), URL param override, timezone fix, OG meta tags + og:image

## Post-Launch Polish (Completed)
- App renamed from "Running Dashboard" to "AI Run Partner"
- Theme system: 15 themes (5 dark, 5 mid-tone pastel, 5 light), two-tone complementary accent colors
- Neutral theme picker: white background, horizontal color rectangles (tint + accent), accent-colored selection border + checkmark, stays open for previewing
- Real Strava polylines for demo maps (replaced synthetic data)
- Demo data: DJ Run profile, 16 shoes (show 7 default), activity notes/descriptions
- Hover animations (.card-hover), loading skeleton shimmer, day bubble tooltips
- Staggered fade-slide-in on page load, progress bar fill animation
- Weekly goal edit works in demo mode (state-only, no POST)
- Expanded map 30% larger, green start marker restored
- Splits: show 8 visible, hide last split if < 0.1 miles
- Demo info banner (dismissable)
- Past weeks day bubbles use accent color (matching current week)
- Peer review fixes: divide-by-zero guards, null split handling, stale state cleanup, unused state removed

## Backlog

### Cross-Training Activity Support (MVP)
- Stop filtering out non-run activities from Strava API responses
- Display rides and strength training entries on the main page alongside runs
- Card layout per activity type: runs (existing), rides (distance/calories/time), strength (duration/notes from description field)
- Add cross-training "types" similar to run types — strength categories (e.g., Chest & Arms, Back & Shoulders, Legs) with note fields for context
- AI assistant awareness: pass all activity types into build_context() so it can suggest what's missing (e.g., "no upper body this week"). Keep suggestions conservative — these are reminders, not plans
- Personal/live environment only for now
- Branching strategy TBD — will develop on feature branch, main stays stable for public demo

### AI Eval Framework / Scenario Stress Tester (Detailed Scope)

Build order and estimates:

1. **Scenario Generator (~half day)** — Script that generates 100-200+ scenario combinations as JSON. Input variables: day of week, time of day, runs logged today (0/1/2+), total miles today, total miles this week, weekly mileage goal, run types planned, run types completed, most recent run (date/distance/pace), weather today (temp/rain%/wind), weather tomorrow, days remaining in week. Mix of manual edge cases and random generation.

2. **Test Runner (~few hours)** — Loop that takes each scenario, formats it the same way build_context() does, sends through the actual AI assistant prompt, collects responses.

3. **Rule Evaluator (~few hours)** — Second Claude API call per scenario. Grades each message against these rules:
   - If run logged today → never suggest another run
   - If remaining days have bad weather → don't push weekly goal
   - Never reference a run older than 3 days
   - Never guilt-trip about missed mileage
   - Never suggest more than 15 miles in one day unless recently done
   - If goal hit → suggest rest/cross-training, not more running
   - Opening line is one sentence with today's activity and weekly progress
   - Multiple runs today → reference total only
   - Max 3 bullets, each actionable and non-obvious
   - No filler (sleep, hydration, stretching, pace analysis, generic encouragement)
   - No emojis
   - Correct day/date awareness, no contradictions
   - Every 3 days without weighing in, remind to weigh in if bullet space allows
   Returns structured pass/fail per rule.

4. **Results Dashboard (~half day to day)** — Shows overall pass rate, failures grouped by rule, click into failure to see scenario + message + violation.

5. **Re-run Capability (~couple hours)** — Change prompt, re-run all scenarios, compare before/after pass rates with timestamps.

Total estimate: 2-3 days. API cost: ~400 Claude API calls per run (200 scenarios × 2 calls), a few dollars on Sonnet per run. Personal/dev environment only. Future-proof: placeholder variables for strength training and cycling activity types. Also serves as portfolio piece demonstrating AI quality assurance and eval methodology.

### Weekly Goal Celebration Animation
- When weekly mileage goal is reached, trigger a celebration animation in the weekly goal progress bar area (confetti, fireworks, or similar effect)
- Bar should visually animate filling to 100% before the celebration triggers
- Personal and demo app

### Other
- Past weeks hover animation (not working)
- Save Plan button disabled until changes made
- Weather widget individual row cards (Figma style)
- Background gradient more visible
- V2: multi-user auth, Cycling/Zwift support
- Mobile responsive design
- Custom theme color picker

## Development Rules
Before building any new feature or substantial change, always assess and communicate:
- Which app(s) it affects (personal only, demo only, or both)
- Merge risks if the feature branch diverges significantly from main
- Whether it should be personal-only first or rolled out to both apps
- Any shared code (routing, assistant_client, CSS/layout) that could break the other environment

This applies to all feature discussions, not just implementation.

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

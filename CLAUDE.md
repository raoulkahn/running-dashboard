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
- All distances from Strava are in meters — convert to miles
- Rate limit: 100 requests / 15 min — cache responses for 5 min minimum
- **NEVER push to main or production without explicit user instruction** — always wait for the user to say "push"
- Feature branches for development, main stays stable for production

## Completed Phases
1. ✅ **Phase 1: Strava API Integration** — OAuth, profile, activities, weeks, settings
2. ✅ **Phase 2: Frontend Polish** — Theme system, route maps, activity cards, splits
3. ✅ **Phase 3: Weather + Shoes** — OpenWeatherMap, shoe tracker, favorites
4. ✅ **Phase 4: AI Assistant** — Claude Sonnet API coaching, mode detection (pre_run/post_run/rest_day/evening_no_run), caching, safety guardrails, weather-aware planning, 48hr forecast context
5. ✅ **Phase 5: Deployment** — Render, APP_MODE (demo/personal/development), URL param override, timezone fix, OG meta tags + og:image

## Post-Launch Polish (Completed)
- App renamed from "Running Dashboard" to "AI Run Partner"
- Theme system: 12 themes (5 dark, 3 mid-tone pastel, 4 light), two-tone complementary accent colors
- Settings panel: cog icon opens single-column modal (300px) with 2-column theme grid, Activity Display toggle (Compact/Expanded), Notes on/off toggle
- Neutral theme picker: white background, 2-column grid of color rectangles (tint + accent), accent-colored selection border + checkmark, stays open for previewing, click outside to close
- Real Strava polylines for demo maps (replaced synthetic data)
- Demo data: DJ Run profile, 16 shoes (show 4 default), activity notes/descriptions, HR/cadence data for all 5 activities
- Profile card: Strava avatar (left), name+location (center), VO2 gauge (right), top-aligned; demo mode shows placeholder user icon
- Page subtitle: "Live Fitness Data from Strava and Garmin" (connected state)
- Notes feature: CRUD notes system with sidebar display, dedicated edit modal (add/edit/delete with confirmation), 3 default example notes, localStorage persistence, toggle on/off from settings
- Activity card compact mode: hides splits+map by default, per-card "Show Splits and Map" expand, localStorage persistence, auto-scroll on mode toggle
- Theme persistence via localStorage (survives page refresh, fallback to "ocean" if saved theme removed)
- Smooth theme transitions: global CSS `*{transition}` for color/background/border at 1.8s
- Loading skeleton shimmer, demo info banner (dismissable)
- Weekly goal edit works in demo mode (state-only, no POST)
- Expanded map 30% larger, green start marker restored
- Splits: show 8 visible, hide last split if < 0.1 miles
- Past weeks day bubbles use accent color (matching current week)
- Peer review fixes: divide-by-zero guards, null split handling, stale state cleanup, unused state removed

## AI Assistant Polish (Completed)
- Full system prompt rewrite: casual running buddy tone, max 3 actionable bullets
- Mode detection: pre_run, post_run, rest_day, evening_no_run
- Day awareness: explicit day-of-week context, correct "tomorrow" references
- ONE RUN PER DAY: explicit "RAN TODAY" field in context, never suggest more running after a run
- 3-day recency rule: never reference specific past runs older than 3 days
- Mileage honesty: no guilt-tripping, no "tackle/make up/salvage" language
- Weather-aware: rain tomorrow = rest day, don't push running in bad weather, hourly rain window awareness (suggest dry windows instead of writing off full day)
- Rain grammar: "X% chance of rain" not "X% rain chance"; 100% = "rain all day"
- Weigh-in reminders on Mon/Thu/Sun if bullet space allows
- Multiple runs in a day: reference total daily mileage only, don't call any a "warm-up"
- Week boundaries: Mon-Sun separation in build_context(), correct current vs previous week
- Timezone fix: ZoneInfo("America/Los_Angeles") in detect_mode() and build_context()
- Bullet rendering: AI assistant message parsed from plain text into `<ul><li>` elements
- Assistant cache (assistant_cache.json) with TTL per mode

## Visual Polish & Animations (Completed)
- Page load animations: `settleIn` keyframe for sections (staggered fade + slight overshoot), `dayBounce` for weekly day boxes (staggered left-to-right scale bounce)
- VO2 max gauge: SVG arc fill animation on page load via stroke-dasharray/dashoffset
- Shoe progress bars: staggered fill animation (80ms between each shoe)
- Weekly goal + run plan progress bars use green (#06d6a0, matching VO2 ring) across all themes
- Dark theme cards: soft borders rgba(255,255,255,0.06), gradient background (card2 → card)
- Three-tier hover system:
  - **Immediate only** (dock-day, weather-row): background-color darken, no delayed shift
  - **Small elements** (item-hover — run plan items, shoe rows, weather rows): immediate background darken + delayed shift right (translateX(3px), 0.6s ease after 0.4s delay)
  - **Big containers** (card-hover — AI assistant, weather, weekly goal, run plan, shoes, profile, activity cards): immediate brightness + shadow + delayed shift up (translateY(-2px), 0.6s ease after 0.4s delay)
- Light theme hover: darkening instead of brightening (brightness 0.95, rgba(0,0,0,0.07-0.08))
- DockDay hover fix: animation fill-mode no longer locks transform after page-load bounce completes
- Tooltips fade in with opacity transition (0.2s), always rendered in DOM
- Strava CTA flash fix: gated by `statusChecked` state
- Pulse icon (header): spin animation on hover
- VO2 max: read-only display (value from Garmin via user_settings.json, no user editing)
- VO2 value loaded from /api/activities response on each page load
- Removed themes: Dusk, Ember, Sunset Light (12 themes remain)
- Run plan hides 0-target run types from main page display
- Activity card stats: 4x2 grid (Distance, Pace, Moving Time, Elevation / Calories, Avg HR, Max HR, Avg Cadence)
- Heart rate + cadence from Strava API: avg_hr, max_hr, avg_cadence (cadence × 2 for actual spm) in strava_client.py
- Relative Effort removed from activity cards

## Backlog

### Cross-Training Activity Support (MVP)
- Stop filtering out non-run activities from Strava API responses
- Display rides and strength training entries on the main page alongside runs
- Card layout per activity type: runs (existing), rides (distance/calories/time), strength (duration/notes from description field)
- Add cross-training "types" similar to run types — strength categories (e.g., Chest & Arms, Back & Shoulders, Legs) with note fields for context
- AI assistant awareness: pass all activity types into build_context() so it can suggest what's missing (e.g., "no upper body this week"). Keep suggestions conservative — these are reminders, not plans
- Personal/live environment only for now
- Develop on feature branch, main stays stable for production

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

### Demo Mode AI Message Formatting
- Update the demo's hardcoded AI assistant message to match the new format: 1-2 sentence opening line + bulleted list of suggestions
- Keep it consistent with the personal/live AI assistant output style

### Settings Panel & Layout Customization (Partially Complete)
- ~~Collapsible activity cards~~ — DONE: compact/expanded toggle in settings with per-card expand
- Reorderable right sidebar: allow user to set vertical order of Weather, Weekly Run Plan, and Shoes sections via settings panel or drag-and-drop
- Store all preferences in localStorage
- Personal and demo app

### UX Review Checkpoints
- At key development milestones, seek UI/UX feedback from multiple AI tools (Figma Make, ChatGPT, Gemini) to uncover issues or improvements we may have missed
- Use screenshots of current state for each review
- Incorporate into the development workflow as a recurring checkpoint, not a one-time thing

### Other
- Save Plan button disabled until changes made
- Weather widget individual row cards (Figma style)
- Background gradient more visible
- V2: multi-user auth, Cycling/Zwift support
- Mobile responsive design
- Custom theme color picker

## Development Rules
- **Never push to main without explicit user instruction**
- Use feature branches for development; main stays stable for production
- Before building any new feature or substantial change, assess and communicate:
  - Which app(s) it affects (personal only, demo only, or both)
  - Merge risks if the feature branch diverges significantly from main
  - Whether it should be personal-only first or rolled out to both apps
  - Any shared code (routing, assistant_client, CSS/layout) that could break the other environment
- This applies to all feature discussions, not just implementation.

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

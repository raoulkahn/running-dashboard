# Running Dashboard — Design Decisions

## Architecture

### Single-file React frontend (static/app.jsx)
- No build step — Babel compiles JSX in-browser via CDN
- All styles are inline (no CSS files)
- Keeps deployment simple: Flask serves one HTML shell + one JSX file
- Tradeoff: larger single file (~900 lines), but easy to iterate

### Flask backend as API proxy
- Frontend never talks to Strava directly — all API calls go through Flask
- Tokens stored server-side (tokens.json) — never exposed to browser
- Strava rate limit (100 req/15 min) managed via 5-min in-memory cache

### File-based persistence (JSON files)
- Single-user personal app — no database needed
- `tokens.json` — OAuth tokens
- `user_settings.json` — preferences (weekly goal, shoe max miles, VO2, favorites)
- `run_types.json` — manual run type tags keyed by activity ID
- `geo_cache.json` — Nominatim reverse geocode results (persistent across restarts)
- `assistant_cache.json` — Claude API response cache (mode-specific TTL)

---

## Frontend Decisions

### Theme system (10 themes: 5 dark + 5 light)
- Every theme defines: `accent`, `accent2`, `bg` (gradient), `card`, `card2`, `border`, `input`, `text`, `dim`, `dimBright`, `swatch`
- Dark themes: Ocean (default), Strava, Forest, Midnight, Slate
- Light themes: Minimal Gray, Ocean Light, Forest Light, Sunset Light, Strava Light
- All UI text reads from `t.text`, `t.dim`, `t.dimBright` — no hardcoded colors
- Background uses CSS gradient string (`bg` field) — subtle depth
- Theme picker has Dark/Light separator labels
- Strava dark theme uses neutral dark surfaces (#141418) — only accents are orange
- Top-level components (ShoeIcon, MapPinIcon, Gauge) accept color props since `t` isn't in scope
- `B` constant only holds accent palette colors (green, cyan, gold, coral, lavender)
- Original 7-theme backup preserved as comment block in app.jsx

### APP_MODE system
- `APP_MODE` env var controls frontend behavior: `development`, `personal`, `demo`
- URL `?mode=` parameter overrides server value (parsed client-side)
- `development`: DEMO/LIVE toggle visible, starts in demo mode
- `personal`: No toggle, starts in live mode, straight to Strava auth
- `demo`: No toggle, starts in demo mode, shows info banner
- Server injects `window.__APP_MODE__` via Jinja2 template in index.html
- Demo mode: fetches live weather + AI assistant, but skips Strava and all POST calls

### Demo info banner
- Shows when `demoMode` is true (any mode that starts in or toggles to demo)
- Positioned in left column only (above AI Assistant, below header)
- Dismissable per session (React state, reappears on refresh)
- Subtle accent-tinted background, 14px text at 85% opacity

### RunTypePill three-state logic
- **This week's activities**: Fully interactive dropdown (editable)
- **Older activities with a type**: Static colored pill (read-only)
- **Older activities with no type**: Hidden (no empty pill clutter)
- Week boundary: Monday 00:00 to Sunday 23:59, computed from current date
- `start_date_local` from Strava has `Z` suffix but represents local time — must `.replace("Z","")` before parsing in JS to avoid UTC offset
- RunTypePill dropdown z-index: 500 (above route maps)

### Run types (7 types, alphabetical)
- Easy Long Run, Easy Run, Interval Run, Long Run, Progressive Run, Standard Run, Tempo Run
- "Tempo Run" uses theme accent color (special); others use fixed colors from B palette
- "Standard Run" uses hardcoded #8494a7 (not theme-dependent)
- Old types (e.g. "Easy Standard Run") still render via `rtColor` fallback to `t.dim`
- PLAN_DEFAULTS includes all 7 types; types with count:0 appear in edit modal but not plan display

### Weekly Run Plan
- Counts computed dynamically from `acts` state filtered to current week
- `runTypeCounts` IIFE recalculates on every render — no stale data
- Plan notes (pace/distance targets) shown below each type name in plan section
- Overall progress bar shows percentage of planned activities completed

### Weekly Goal (inline edit)
- Separate from Weekly Run Plan — different card section
- "Edit" link if goal exists, "+ Set Weekly Goal" if no goal
- Inline number input with Save/Cancel
- Saving goal triggers AI assistant refresh (?refresh=1) since coaching context changed
- Demo mode: edit UI works but no POST call — state only

### Route maps (Leaflet.js)
- **Card map**: Full-width x 300px, non-interactive, click opens fullscreen
- **Fullscreen modal**: Fully interactive (zoom/pan/scroll), Standard/Satellite tile toggle
- Route line: Always Strava orange (#FC4C02) regardless of theme or tile type
- Start marker: Green circle (same as Strava)
- Finish marker: Black & white checkered circle (canvas-generated, Strava style)
- Tiles: CartoDB Voyager (standard) — muted grey roads don't clash with orange route
- Satellite: Esri World Imagery
- Map container uses wrapper div with `overflow:hidden` + `borderRadius` to prevent white corner bleed
- Background color `#e8e0d8` matches Voyager tile tone for seamless loading
- Polyline decoded from Google Encoded Polyline format (Strava's `summary_polyline`)
- Demo mode includes 3 polylines in Concord/Pleasant Hill/Walnut Creek area:
  - Iron Horse Trail out-and-back (65 points, ~6.5mi)
  - Downtown Concord neighborhood grid loop (55 points, ~4.5mi)
  - Long multi-turn route through Monument/Treat/Ygnacio/Contra Costa (134 points, ~13mi)
- If no polyline data: shows MapPinIcon placeholder

### Activity cards
- Date line format: "9:42 AM · Feb 8 · Device · Shoe · Concord, California"
- City from reverse geocoding via Nominatim (cached in geo_cache.json)
- Strava's `location_city` field is deprecated/null — must use `start_latlng` + geocoding
- Notes section: collapsed with "Show more" / "Show less" toggle
- Splits table: scrollable when > 8 splits, partial final split shown at reduced opacity

### Weather widget
- Day headers use `accent2` color with dynamic day names (THURSDAY, FRIDAY, etc.)
- Two locations: Concord / Danville toggle
- Period logic: Before 6 PM shows today's next 12 hours; after 6 PM shows tomorrow 6 AM–6 PM
- Weather data includes `dayOffset` field for grouping hours by day
- Timezone: Uses `America/Los_Angeles` for all time calculations (not server UTC)
- Fade gradient at bottom when scrollable

---

## AI Assistant (Phase 4)

### Architecture
- `assistant_client.py` — standalone module, no Strava dependency
- Direct HTTP to Claude Messages API (requests library, not anthropic SDK)
- Model: `claude-sonnet-4-20250514`, max_tokens: 200, temperature: 0.7
- File-based cache (`assistant_cache.json`) with mode-specific TTLs

### Mode detection
- `pre_run`: No run today, before 8 PM, plan has items remaining
- `post_run`: Activity found with today's date
- `rest_day`: Plan has 0 total items for today
- `evening_no_run`: No run today, after 8 PM

### Cache strategy
- `pre_run`: 2 hour TTL
- `post_run` / `rest_day` / `evening_no_run`: Rest of day (invalidate on date change)
- Mode change invalidates cache
- `?refresh=1` param deletes cache file for forced regeneration

### Context sent to Claude
- Day of week + remaining days in training week (Mon–Sun)
- Weekly mileage vs goal (explicit `goal_mi` from user_settings.json, not cached)
- Remaining plan items
- Most recent activity (title, distance, time, pace)
- Today's weather summary (temp range, wind, rain %, conditions)
- Tomorrow's weather summary (same format, from 48h forecast)

### System prompt rules
- **Mode rules**: Pre-run focuses on what to run; post-run on recovery; rest day on preview; evening on tomorrow
- **Safety rules**: No 15+ mile suggestions without precedent, no unrealistic catch-up, gradual return after gaps, weather empathy, injury prevention
- **Weather-aware planning**: Use 48h forecast to suggest shifting runs between days
- **Post-goal completion**: Celebrate then suggest recovery/cross-training, don't push more running
- No emojis, concise, reference actual numbers

### Demo mode assistant
- Frontend sends `?demo=1` param
- Backend uses hardcoded demo activities/week/plan context (skips Strava)
- Weather fetched live in both modes
- Falls back to hardcoded text if API call fails

---

## Backend Decisions

### Reverse geocoding (Nominatim)
- Free API, no key required — but needs User-Agent header
- Rate limited to 1 req/sec — we cache aggressively
- Coordinates rounded to 3 decimals (~111m) for deduplication
- Results persisted to `geo_cache.json` — survives server restarts
- Loaded into memory on import — fast lookups after first request

### Run type merging
- `run_types.json` stores user-assigned types keyed by activity ID string
- `/api/activities` endpoint merges saved types onto activity objects before returning
- Cache cleared after type change so next fetch picks up new data

### Date formatting
- `format_date()` outputs "7:24 AM · Feb 8" (time first)
- Uses `%-I` and `%-d` for no-padding (macOS/Linux strftime)

### Weather timezone fix
- Render servers run in UTC — `datetime.now()` returns wrong local time
- All weather time filtering uses `datetime.now(LOCAL_TZ)` and `datetime.fromtimestamp(ts, tz=LOCAL_TZ)`
- `LOCAL_TZ = ZoneInfo("America/Los_Angeles")` — hardcoded since both locations are in California
- Affects: hourly forecast period selection (6 PM cutoff), 12-hour window, 48h today/tomorrow boundaries

### Template rendering
- `index.html` served via `render_template()` (not `send_from_directory`)
- Jinja2 injects `window.__APP_MODE__` as inline script before app.jsx loads
- No other template logic — keeps HTML minimal

---

## Deployment (Render)

### Configuration
- `Procfile`: `web: gunicorn app:app`
- Environment variables set in Render dashboard (not committed)
- `APP_MODE=demo` on Render for public demo
- `REDIRECT_URI` set to Render URL for OAuth callback

### Timezone handling
- Server runs in UTC — all time-sensitive code explicitly uses `America/Los_Angeles`
- Weather filtering, assistant day-of-week context both use local timezone

---

## Lessons Learned

### Edit the right file
- `running-dashboard-wireframe.jsx` is reference only — changes there don't render
- All UI work must go to `static/app.jsx`
- `templates/index.html` is CDN links only — never add UI there

### Strava date timezone quirk
- `start_date_local` includes `Z` suffix but is actually local time
- JS `new Date("...Z")` parses as UTC, causing week-boundary mismatches
- Fix: `.replace("Z","")` before any date comparison

### Assistant goal context bug
- `get_current_week_summary` caches goalMi from first caller (might use default 50)
- `build_context` had hardcoded fallback of 50
- Fix: pass `goal_mi` explicitly from user_settings.json through the entire chain

### Assistant day-of-week confusion
- Context only said "Days left in week: 2" — Claude said "kick off your week" on Friday
- Fix: explicitly state "Today is Friday. The training week runs Monday through Sunday. There are 3 days remaining."

### Theme migration strategy
- Global replace B.text→t.text, B.dimBright→t.dimBright, B.dim→t.dim (in that order to avoid substring conflicts)
- Then surgically fix top-level components where `t` isn't in scope
- `bg` changed from flat color to gradient string — broke one usage as CSS color stop

### Keep fixes simple
- When user says "the fix is simple" — trust them and implement directly
- Don't over-analyze React re-render chains when the bug is a string parse issue

### Map tile selection matters
- Dark tiles (CartoDB Dark) make routes invisible
- Standard OSM tiles have orange highways that clash with Strava orange routes
- CartoDB Positron is too washed out
- CartoDB Voyager is the sweet spot — muted colors, good contrast with orange route

### .env append without newline
- `echo "KEY=value" >> .env` can concatenate with previous line if file doesn't end with newline
- Always verify .env contents after appending

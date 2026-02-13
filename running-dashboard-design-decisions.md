# Running Dashboard — Design Decisions

## Architecture

### Single-file React frontend (static/app.jsx)
- No build step — Babel compiles JSX in-browser via CDN
- All styles are inline (no CSS files)
- Keeps deployment simple: Flask serves one HTML shell + one JSX file
- Tradeoff: larger single file (~850 lines), but easy to iterate

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

---

## Frontend Decisions

### Theme system (7 themes, dual accent)
- Every theme has `accent` (primary) and `accent2` (secondary complement)
- Background uses CSS gradient (`bgGrad`) instead of flat color — subtle depth
- Card, border, input, surface colors all shift per theme — each feels like a different environment
- Color palette restricted to: blues, greys, greens, orange. No yellow/red/pink.
- "Ocean" is default (blue/cyan). "Strava" theme uses official Strava orange (#FC4C02).
- Original themes saved as comment block at top of app.jsx for revert safety
- `accent2` used for: weather day headers, AI assistant card glow, past weeks dots, profile location

### RunTypePill three-state logic
- **This week's activities**: Fully interactive dropdown (editable)
- **Older activities with a type**: Static colored pill (read-only)
- **Older activities with no type**: Hidden (no empty pill clutter)
- Week boundary: Monday 00:00 to Sunday 23:59, computed from current date
- `start_date_local` from Strava has `Z` suffix but represents local time — must `.replace("Z","")` before parsing in JS to avoid UTC offset

### Run types (7 types, alphabetical)
- Easy Long Run, Easy Run, Interval Run, Long Run, Progressive Run, Standard Run, Tempo Run
- "Tempo Run" uses theme accent color (special); others use fixed colors from B palette
- Old types (e.g. "Easy Standard Run") still render via `rtColor` fallback to `B.dim`
- PLAN_DEFAULTS includes all 7 types; types with count:0 appear in edit modal but not plan display

### Weekly Run Plan
- Counts computed dynamically from `acts` state filtered to current week
- `runTypeCounts` IIFE recalculates on every render — no stale data
- Plan notes (pace/distance targets) shown below each type name in plan section
- Overall progress bar shows percentage of planned activities completed

### Route maps (Leaflet.js)
- **Small map** (collapsed card): 140x120px, non-interactive, shows route thumbnail
- **Large map** (expanded card): Full-width x 250px, non-interactive, click opens fullscreen
- **Fullscreen modal**: Fully interactive (zoom/pan/scroll), Standard/Satellite tile toggle
- Route line: Always Strava orange (#FC4C02) regardless of theme or tile type
- Start marker: Green circle (same as Strava)
- Finish marker: Black & white checkered circle (canvas-generated, Strava style)
- Tiles: CartoDB Voyager (standard) — muted grey roads don't clash with orange route
- Satellite: Esri World Imagery
- Map container uses wrapper div with `overflow:hidden` + `borderRadius` to prevent white corner bleed
- Background color `#e6e5e3` matches Voyager tile grey for seamless loading
- Polyline decoded from Google Encoded Polyline format (Strava's `summary_polyline`)
- Demo mode includes 3 hardcoded polylines (loop, trail, small loop) around Concord CA
- If no polyline data: shows MapPinIcon placeholder

### Activity cards
- Date line format: "9:42 AM · Feb 8 · Concord, CA" (time first, then date, then city)
- City from reverse geocoding via Nominatim (cached in geo_cache.json)
- Strava's `location_city` field is deprecated/null — must use `start_latlng` + geocoding

### Weather widget
- Day headers use `accent2` color with dynamic day names (THURSDAY, FRIDAY, etc.)
- Two locations: Concord / Danville toggle
- Period logic: Before 6 PM shows today's next 12 hours; after 6 PM shows tomorrow 6 AM–6 PM
- Weather data includes `dayOffset` field for grouping hours by day

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

### Keep fixes simple
- When user says "the fix is simple" — trust them and implement directly
- Don't over-analyze React re-render chains when the bug is a string parse issue

### Map tile selection matters
- Dark tiles (CartoDB Dark) make routes invisible
- Standard OSM tiles have orange highways that clash with Strava orange routes
- CartoDB Positron is too washed out
- CartoDB Voyager is the sweet spot — muted colors, good contrast with orange route

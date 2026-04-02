# AI Run Partner → AI Fitness Partner — Production Plan

## Context

**Current state:** Flask + React app deployed on Render at https://ai-run-partner.onrender.com/. Strava OAuth is fully wired. All persistence is file-based JSON on Render's ephemeral filesystem (wiped on every deploy/restart). No database, no admin auth. Weekly Run Plan resets on every page reload. Notes are localStorage only.

**Goal:** Turn this into a real personal fitness dashboard with live Strava data visible to all visitors, admin-only editing, and a foundation for AI coaching features.

**Database:** Supabase (free tier, Postgres with pgvector built-in). Keeps the door open for semantic search and AI features. Use GitHub Actions keepalive cron (2x/week) to prevent 7-day inactivity pause.

---

## Architecture Overview

### Two App States

| | Not Logged In (Visitors) | Logged In (Admin — just you) |
|---|---|---|
| **Strava data** | Real cached data (read-only) | Real cached data (read/write) |
| **AI Assistant** | Interactive demo (sandboxed, sample context) | Full context, can modify plan |
| **Notes** | Visible, read-only | Editable |
| **Weekly Run Plan** | Visible, read-only | Editable, AI can modify |
| **Weekly Goal** | Visible, read-only | Editable |
| **Run type tags** | Visible, read-only | Editable |
| **Shoe tracking** | Visible (from Strava gear API) | Same |
| **Theme/layout** | Stored in localStorage (isolated) | Stored in Supabase (persists across devices) |
| **VO2 Max** | Displayed | Manually editable |
| **Login UI** | No visible login link | Access via `/gate` (obscure URL) |

### Data Flow

```
Strava API  ──→  Flask server (auto-refresh token)  ──→  Supabase (cached activities)
                                                              ↓
                                                      All visitors see real data
```

---

## Phase A — Database + Admin Login

**Goal:** Replace ephemeral file storage with Supabase. Add admin auth. This unblocks everything else.

### A1. Provision Supabase
- Create free Supabase project
- Set up GitHub Actions keepalive cron (ping DB 2x/week)
- Add Supabase connection string as `DATABASE_URL` env var on Render

### A2. Database Schema
Migrate all JSON files to Supabase:

```
settings (key TEXT PRIMARY KEY, value JSONB)
  → replaces user_settings.json (goalMi, shoeMaxMiles, vo2, favoriteShoes)
  → stores weekly_plan (currently in-memory only — fix this)
  → stores notes (currently localStorage only)
  → stores admin theme preference

run_types (activity_id TEXT PRIMARY KEY, run_type TEXT)
  → replaces run_types.json

strava_tokens (id INT PRIMARY KEY, access_token TEXT, refresh_token TEXT, expires_at INT)
  → replaces tokens.json

assistant_cache (id INT PRIMARY KEY, message TEXT, timestamp INT)
  → replaces assistant_cache.json (optional — could stay in-memory)

chat_history (id SERIAL, role TEXT, content TEXT, created_at TIMESTAMP, is_demo BOOLEAN)
  → for future AI chat feature
```

### A3. Admin Authentication
- Add `ADMIN_PASSWORD` env var on Render
- Create `/gate` route: POST form, compare password to env var
- Set `session["admin"] = True` with 30-day expiry (Flask already has `secret_key`)
- Create `/api/status` endpoint returning `{ isAdmin: true/false }`
- Add `@require_admin` decorator to all POST endpoints (`/api/settings`, `/api/activities/<id>/runtype`, etc.)

### A4. Frontend Auth Gating
- Fetch `isAdmin` from `/api/status` on app load
- Hide edit UI (Edit links on Notes, Weekly Run Plan, Weekly Goal, run type tags) when not admin
- Theme/layout toggles remain visible to all — stored in localStorage for visitors, Supabase for admin

### A5. Fix Weekly Run Plan Persistence
- Add POST `/api/plan` endpoint (admin-only) to save plan to Supabase
- Load plan from Supabase on page load (currently resets every reload)
- Same for Notes — move from localStorage to Supabase, read-only for visitors

---

## Phase B — Live Strava Data for All Visitors

**Goal:** Everyone sees your real, fresh Strava data. No more demo-only mode.

### B1. Migrate Token Storage
- Swap `save_tokens()` / `load_tokens()` in `strava_client.py` to read/write from Supabase instead of `tokens.json`
- This is the single most impactful change — fixes the deploy-wipe problem

### B2. One-Time Strava Re-Auth
- After deploying the DB migration, log in as admin and trigger Strava OAuth once
- Refresh token gets stored in Supabase — persists across deploys
- Verify `REDIRECT_URI` env var on Render matches `https://ai-run-partner.onrender.com/auth/callback`
- Verify Strava app settings at strava.com/settings/api has `ai-run-partner.onrender.com` as callback domain

### B3. Cache Strategy
- Keep existing 5-min in-memory cache for API responses
- On cache miss, fetch from Strava API and serve
- Token auto-refresh already implemented — just needs to write to Supabase instead of file
- **No background scheduler needed initially** — activities refresh on page visits
- Add Render cron job later if needed for always-fresh data

### B4. Remove Demo Data Dependency
- Currently demo mode is hardcoded activities in `app.jsx`
- Keep demo mode as fallback only if Strava token is missing/expired
- Default behavior: serve real cached Strava data to everyone

---

## Phase C — Polish & Testing

### C1. Theme Isolation
- Visitors: theme stored in localStorage (already works this way)
- Admin: theme preference also written to Supabase on change, so it persists across devices
- Verify no crossover between visitor and admin theme state

### C2. End-to-End Testing
- Test visitor experience: real data visible, no edit UI, theme/layout works
- Test admin experience: `/gate` login, edit Notes/Plan/Goal, changes persist across deploys
- Test Strava token refresh survives deploy
- Test Supabase keepalive cron fires correctly

### C3. Geo Cache & Assistant Cache
- `geo_cache.json` and `assistant_cache.json` can stay in-memory (rebuilt on restart)
- Not critical to persist — they're just performance caches

---

## Phase D — AI Chat Interface (Future)

**Goal:** Interactive AI coaching for both admin and demo users.

### D1. Chat UI
- Add chat interface to dashboard (expandable panel or dedicated section)
- Admin: full context from real Strava data, plan, goals, history
- Demo: sandboxed with sample data, guardrails to prevent plan modifications

### D2. AI Context & Memory
- Chat history stored in `chat_history` table in Supabase
- AI receives context: current weekly plan, recent activities, goals, weather
- pgvector embeddings for semantic search over training history (e.g., "find similar workouts")

### D3. Plan Modification via Chat
- Admin only: AI can propose changes to weekly plan
- User confirms before changes are applied
- Example: "I'm not feeling well, can I skip today and run 14 miles tomorrow?"
- AI updates plan in Supabase after confirmation

### D4. Demo Guardrails
- Demo AI operates on sample data only
- Cannot modify any real data
- Shows visitors what the AI can do without affecting admin state
- Rate limit demo AI calls to control costs

---

## Phase E — Future Features (Backlog)

- **Zwift/cycling view:** Filter and display virtual rides from Strava (already comes through as activities with `sport_type`)
- **Garmin VO2 Max API:** Use `python-garminconnect` library for automated VO2 max sync (currently manual entry)
- **Weightlifting parsing:** AI reads title/description from Strava weightlifting activities to extract exercises, sets, reps
- **Custom domain:** Purchase and configure `ai-fitness-partner.com` if desired
- **Shoe rotation tracking:** Strava gear API provides `gear_id` per activity + total distance per shoe — build mileage alerts

---

## Risks & Gotchas

| Risk | Mitigation |
|---|---|
| Supabase free tier pauses after 7 days inactivity | GitHub Actions cron pings DB 2x/week |
| First deploy after migration has no Strava token | Re-auth once via admin login + Strava OAuth |
| Strava OAuth callback URL mismatch | Verify both Render env var AND strava.com/settings/api |
| POST endpoints accessible without auth | `@require_admin` decorator on all write endpoints |
| Render dyno restart clears in-memory cache | Expected — cache rebuilds on next page visit from Strava API |

---

## Build Order (Today)

1. Provision Supabase project + add `DATABASE_URL` to Render
2. Add `psycopg2-binary` to `requirements.txt`
3. Create schema (settings, run_types, strava_tokens, chat_history)
4. Migrate `strava_client.py` token storage to Supabase
5. Migrate `user_settings.json` and `run_types.json` to Supabase
6. Add `/gate` admin login + `@require_admin` decorator
7. Frontend: fetch `isAdmin`, gate edit UI
8. Fix Weekly Run Plan persistence (POST to Supabase)
9. Re-auth with Strava from production
10. Test both states end to end
11. Set up GitHub Actions Supabase keepalive cron

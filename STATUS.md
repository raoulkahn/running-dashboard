# AI Run Partner — Project Status

**Last updated:** 2026-04-03

---

## Current State

- **Production is stable on file-based storage** (DB disabled via `is_available()` returning `False` in `db.py`)
- **All Supabase/DB code is intact but disabled** — re-enable by reverting one line in `db.py` `is_available()`
- **Supabase connectivity from Render is unresolved** — options: Render Postgres ($7/mo), Supabase US-West region, or keep file-based
- **Admin auth at `/go` works** (session-based, no DB needed)
- **Coach Lisa Phase 1-3 is live** (backend endpoint, input UI, response cards)
- **Strava token stored in `tokens.json`** on Render's ephemeral filesystem — wiped on every deploy, need to re-auth at `/go` after each deploy
- **`APP_MODE=personal`** on Render (no demo toggle)
- **All env vars confirmed set:** `DATABASE_URL`, `ADMIN_PASSWORD`, `FLASK_SECRET_KEY`, `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `REDIRECT_URI`, `OPENWEATHER_API_KEY`, `ANTHROPIC_API_KEY`, `APP_MODE`

---

## Remaining Work (priority order)

1. **Coach Lisa Phase 4: Agent actions** — checkboxes, confirm/cancel, widget updates, undo (no DB needed)
2. **Remove left border accent on Coach Lisa response cards**
3. **Add quick prompt pills to Coach Lisa**
4. **Wire "Apply to today's plan" button** to POST `/api/plan`
5. **Fix duplicate loading spinner + "Thinking..." text** — pick one
6. **Loading animations for skeleton states** (spinner + message replacing static gray bars)
7. **Coach Lisa Phase 5: Demo rate limiting** — blocked until DB connectivity resolved
8. **Resolve Supabase connectivity from Render** (options: Render Postgres $7/mo, Supabase US-West, or keep file-based)
9. **Set up GitHub Actions keepalive cron for Supabase** (if staying on Supabase)
10. **Reset Supabase password** (exposed in conversation)

---

## Backlog

- Update info banner text for logged-out visitors
- Placeholder text for Coach Lisa input ("Ask Coach Lisa a question..." instead of plan-specific)
- Coach Lisa avatar
- Impact line in Coach Lisa responses
- Analytics integration (GoatCounter or similar)
- Responsive design for mobile
- TestFlight iOS app via Capacitor or React Native
- Garmin VO2 max via python-garminconnect (decided to keep manual for now)
- Zwift/cycling view
- Weightlifting parsing from Strava descriptions
- Case study page update
- Post-mortem document finalization

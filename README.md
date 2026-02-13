# Running Dashboard

Personal running dashboard powered by the Strava API. Displays weekly mileage goals, activity feed with splits, shoe rotation tracking, weather, performance predictions, and an AI assistant.

## Stack
- **Backend**: Python / Flask
- **Frontend**: React (single-file, inline styles)
- **Data**: Strava API (OAuth 2.0)
- **Deploy**: Render

## Setup

1. **Clone and install**
   ```bash
   git clone https://github.com/raoulkahn/running-dashboard.git
   cd running-dashboard
   pip install -r requirements.txt
   ```

2. **Configure Strava API**
   - Go to [Strava API Settings](https://www.strava.com/settings/api)
   - Create an application (or use existing)
   - Set Authorization Callback Domain to `localhost`
   - Copy `.env.example` to `.env` and fill in your credentials:
     ```bash
     cp .env.example .env
     ```

3. **Run locally**
   ```bash
   flask run --debug
   ```
   Open http://localhost:5000 and click "Connect with Strava"

## Development Phases
- ✅ Wireframe (React artifact with hardcoded data)
- 🔲 Phase 1: Strava API integration (activities, splits, shoes, weekly mileage)
- 🔲 Phase 2: Weather API
- 🔲 Phase 3: Performance predictions
- 🔲 Phase 4: AI Assistant via Claude API
- 🔲 Phase 5: Deployment
- 🔲 Phase 6: V2 — Cycling / Zwift support

## License
Personal project — not intended for redistribution.

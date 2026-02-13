"""
Running Dashboard — Flask Backend
Handles Strava OAuth, API proxy, and user settings.
"""

import json
import os
import requests
from flask import Flask, redirect, request, jsonify, session, send_from_directory, render_template
from config import (
    STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_AUTH_URL,
    STRAVA_TOKEN_URL, STRAVA_SCOPES, REDIRECT_URI, FLASK_SECRET_KEY,
    DEFAULT_WEEKLY_GOAL, DEFAULT_SHOE_MAX_MILES, APP_MODE,
)
import strava_client
import weather_client
import assistant_client

app = Flask(__name__, static_folder="static", template_folder="templates")
app.secret_key = FLASK_SECRET_KEY

# User settings file (single-user personal app)
SETTINGS_FILE = "user_settings.json"


def load_settings():
    if os.path.exists(SETTINGS_FILE):
        with open(SETTINGS_FILE, "r") as f:
            return json.load(f)
    return {
        "goalMi": DEFAULT_WEEKLY_GOAL,
        "shoeMaxMiles": DEFAULT_SHOE_MAX_MILES,
        "vo2": 52,
    }


def save_settings(settings):
    with open(SETTINGS_FILE, "w") as f:
        json.dump(settings, f, indent=2)


# ---------------------------------------------------------------------------
# OAuth Routes
# ---------------------------------------------------------------------------
@app.route("/auth/strava")
def auth_strava():
    """Redirect user to Strava OAuth authorization page."""
    params = {
        "client_id": STRAVA_CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": STRAVA_SCOPES,
        "approval_prompt": "auto",
    }
    url = f"{STRAVA_AUTH_URL}?{'&'.join(f'{k}={v}' for k, v in params.items())}"
    return redirect(url)


@app.route("/auth/callback")
def auth_callback():
    """Handle Strava OAuth callback — exchange code for tokens."""
    code = request.args.get("code")
    error = request.args.get("error")

    if error:
        return jsonify({"error": f"Strava auth denied: {error}"}), 400

    if not code:
        return jsonify({"error": "No authorization code received"}), 400

    # Exchange code for tokens
    try:
        resp = requests.post(STRAVA_TOKEN_URL, data={
            "client_id": STRAVA_CLIENT_ID,
            "client_secret": STRAVA_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
        })
        resp.raise_for_status()
        token_data = resp.json()

        # Save tokens (includes access_token, refresh_token, expires_at, athlete)
        strava_client.save_tokens(token_data)

        # Clear cache so fresh data loads
        strava_client.cache_clear()

        return redirect("/")
    except Exception as e:
        return jsonify({"error": f"Token exchange failed: {str(e)}"}), 500


@app.route("/auth/disconnect")
def auth_disconnect():
    """Remove stored tokens (disconnect from Strava)."""
    if os.path.exists(strava_client.TOKEN_FILE):
        os.remove(strava_client.TOKEN_FILE)
    strava_client.cache_clear()
    return redirect("/")


# ---------------------------------------------------------------------------
# API Routes
# ---------------------------------------------------------------------------
@app.route("/api/status")
def api_status():
    """Check if user is authenticated with Strava."""
    tokens = strava_client.load_tokens()
    connected = tokens is not None and "access_token" in tokens
    return jsonify({
        "connected": connected,
        "settings": load_settings(),
    })


@app.route("/api/profile")
def api_profile():
    """Athlete profile + shoes + YTD stats."""
    try:
        profile = strava_client.get_profile()

        # Apply user shoe max settings
        settings = load_settings()
        shoe_maxes = settings.get("shoeMaxMiles", {})
        if isinstance(shoe_maxes, dict):
            for shoe in profile["shoes"]:
                shoe["max"] = shoe_maxes.get(shoe["id"], DEFAULT_SHOE_MAX_MILES)

        return jsonify(profile)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/activities")
def api_activities():
    """Recent activities with details + current week summary."""
    try:
        settings = load_settings()

        # Recent runs (always has content)
        count = request.args.get("count", 10, type=int)
        page = request.args.get("page", 1, type=int)
        activities = strava_client.get_recent_activities(count=count, page=page)

        # Merge user-assigned run types from run_types.json
        saved_types = load_run_types()
        for act in activities:
            key = str(act.get("id", ""))
            if key in saved_types:
                act["runType"] = saved_types[key]

        # Current week summary (day bubbles, total, goal)
        week = strava_client.get_current_week_summary(
            goal_miles=settings.get("goalMi", DEFAULT_WEEKLY_GOAL)
        )

        return jsonify({
            "activities": activities,
            "weekDays": week["weekDays"],
            "totalMi": week["totalMi"],
            "goalMi": week["goalMi"],
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/weeks")
def api_weeks():
    """Past weeks summaries."""
    try:
        count = request.args.get("count", 3, type=int)
        data = strava_client.get_past_weeks(count=count)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/refresh")
def api_refresh():
    """Force cache clear and refetch."""
    strava_client.cache_clear()
    return jsonify({"status": "cache cleared"})


@app.route("/api/weather")
def api_weather():
    """Hourly weather forecast for running hours."""
    try:
        location = request.args.get("location", "concord")
        data = weather_client.get_hourly_forecast(location=location)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/assistant")
def api_assistant():
    """AI coaching message via Claude API."""
    try:
        # If refresh=1, clear cached assistant message
        if request.args.get("refresh"):
            import assistant_client as ac
            if os.path.exists(ac.CACHE_FILE):
                os.remove(ac.CACHE_FILE)

        is_demo = request.args.get("demo")

        if is_demo:
            # Demo mode — use hardcoded context, skip Strava calls
            activities = [
                {"id": 1, "title": "Morning Long Run", "start_date_local": "2026-02-11T07:24:00",
                 "distance": "13.3 mi", "time": "1h 42m", "pace": "7:42 /mi", "runType": "Easy Long Run"},
                {"id": 2, "title": "Easy Recovery Run", "start_date_local": "2026-02-10T06:15:00",
                 "distance": "8.1 mi", "time": "1h 8m", "pace": "8:24 /mi"},
                {"id": 3, "title": "Tempo Run", "start_date_local": "2026-02-09T05:45:00",
                 "distance": "4.8 mi", "time": "35m", "pace": "7:18 /mi", "runType": "Tempo Run"},
            ]
            week = {"totalMi": 26.2, "goalMi": 50}
            goal = 50
            plan = [
                {"type": "Easy Long Run", "count": 0},
                {"type": "Easy Run", "count": 1},
                {"type": "Interval Run", "count": 1},
                {"type": "Tempo Run", "count": 0},
            ]
            profile = {"name": "Raoul Kahn", "city": "Concord", "state": "CA"}
        else:
            # Live mode — gather context from Strava
            settings = load_settings()
            goal = settings.get("goalMi", DEFAULT_WEEKLY_GOAL)

            activities = strava_client.get_recent_activities(count=10)
            saved_types = load_run_types()
            for act in activities:
                key = str(act.get("id", ""))
                if key in saved_types:
                    act["runType"] = saved_types[key]

            week = strava_client.get_current_week_summary(goal_miles=goal)

            # Profile — best effort
            profile = None
            try:
                profile = strava_client.get_profile()
            except Exception:
                pass

            # Plan — read from settings if saved, else use None
            plan = settings.get("plan")

        # Weather — 48h forecast for assistant context (works in both modes)
        weather = None
        try:
            weather = weather_client.get_48h_forecast(location="concord")
        except Exception:
            pass

        result = assistant_client.get_coaching_message(
            activities=activities,
            week_summary=week,
            weather=weather,
            plan=plan,
            profile=profile,
            goal_mi=goal,
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/settings", methods=["GET", "POST"])
def api_settings():
    """Read/write user preferences."""
    if request.method == "GET":
        return jsonify(load_settings())

    data = request.get_json()
    settings = load_settings()
    # Merge incoming with existing
    for key in ["goalMi", "vo2", "shoeMaxMiles", "favoriteShoes"]:
        if key in data:
            settings[key] = data[key]
    save_settings(settings)
    return jsonify(settings)


# ---------------------------------------------------------------------------
# Run type tagging (persisted per activity)
# ---------------------------------------------------------------------------
RUN_TYPES_FILE = "run_types.json"


def load_run_types():
    if os.path.exists(RUN_TYPES_FILE):
        with open(RUN_TYPES_FILE, "r") as f:
            return json.load(f)
    return {}


def save_run_types(data):
    with open(RUN_TYPES_FILE, "w") as f:
        json.dump(data, f, indent=2)


@app.route("/api/activities/<int:activity_id>/runtype", methods=["POST"])
def set_run_type(activity_id):
    """Save user-assigned run type for an activity."""
    data = request.get_json()
    run_type = data.get("runType")

    types = load_run_types()
    types[str(activity_id)] = run_type
    save_run_types(types)

    # Clear activity cache so it picks up the new type
    strava_client.cache_clear()

    return jsonify({"status": "ok", "activityId": activity_id, "runType": run_type})


# ---------------------------------------------------------------------------
# Static / Frontend serving
# ---------------------------------------------------------------------------
@app.route("/")
def index():
    return render_template("index.html", app_mode=APP_MODE)


@app.route("/static/<path:path>")
def serve_static(path):
    return send_from_directory("static", path)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    app.run(debug=True, port=5000)

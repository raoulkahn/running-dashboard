"""
Strava API client with data transforms.
All public functions return data shaped to match the wireframe's constants.
"""

import time
import json
import os
import requests
from datetime import datetime, timedelta
from config import (
    STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_TOKEN_URL,
    STRAVA_API_BASE, DEFAULT_SHOE_MAX_MILES, CACHE_TTL_SECONDS
)

# ---------------------------------------------------------------------------
# Token storage (file-based — fine for single-user personal app)
# ---------------------------------------------------------------------------
TOKEN_FILE = "tokens.json"


def save_tokens(token_data):
    """Persist tokens to disk."""
    with open(TOKEN_FILE, "w") as f:
        json.dump(token_data, f)


def load_tokens():
    """Load tokens from disk. Returns None if not found."""
    if not os.path.exists(TOKEN_FILE):
        return None
    with open(TOKEN_FILE, "r") as f:
        return json.load(f)


def get_valid_token():
    """Return a valid access token, refreshing if expired. Returns None if not authed."""
    tokens = load_tokens()
    if not tokens:
        return None

    # Refresh if expired (with 60s buffer)
    if tokens.get("expires_at", 0) < time.time() + 60:
        try:
            resp = requests.post(STRAVA_TOKEN_URL, data={
                "client_id": STRAVA_CLIENT_ID,
                "client_secret": STRAVA_CLIENT_SECRET,
                "grant_type": "refresh_token",
                "refresh_token": tokens["refresh_token"],
            })
            resp.raise_for_status()
            new_tokens = resp.json()
            # Merge — keep athlete info if present
            tokens.update({
                "access_token": new_tokens["access_token"],
                "refresh_token": new_tokens["refresh_token"],
                "expires_at": new_tokens["expires_at"],
            })
            save_tokens(tokens)
        except Exception as e:
            print(f"Token refresh failed: {e}")
            return None

    return tokens["access_token"]


# ---------------------------------------------------------------------------
# Simple in-memory cache
# ---------------------------------------------------------------------------
_cache = {}


def cached(key, ttl=CACHE_TTL_SECONDS):
    """Decorator-style cache check. Returns (hit, data)."""
    entry = _cache.get(key)
    if entry and time.time() - entry["ts"] < ttl:
        return True, entry["data"]
    return False, None


def cache_set(key, data):
    _cache[key] = {"data": data, "ts": time.time()}


def cache_clear():
    _cache.clear()


# ---------------------------------------------------------------------------
# API helpers
# ---------------------------------------------------------------------------
def _api_get(endpoint, params=None):
    """Make authenticated GET to Strava API."""
    token = get_valid_token()
    if not token:
        raise Exception("Not authenticated with Strava")
    resp = requests.get(
        f"{STRAVA_API_BASE}{endpoint}",
        headers={"Authorization": f"Bearer {token}"},
        params=params or {},
    )
    resp.raise_for_status()
    return resp.json()


# ---------------------------------------------------------------------------
# Reverse geocoding (Nominatim — free, no key)
# ---------------------------------------------------------------------------
_geo_cache = {}  # persistent per-process cache keyed by rounded lat/lng
GEO_FILE = "geo_cache.json"


def _load_geo_cache():
    global _geo_cache
    if os.path.exists(GEO_FILE):
        with open(GEO_FILE, "r") as f:
            _geo_cache = json.load(f)


def _save_geo_cache():
    with open(GEO_FILE, "w") as f:
        json.dump(_geo_cache, f, indent=2)


# Load on import
_load_geo_cache()


def reverse_geocode(lat, lng):
    """Reverse geocode lat/lng to 'City, State' string via Nominatim."""
    # Round to 3 decimals (~111m) to deduplicate nearby starts
    key = f"{round(lat, 3)},{round(lng, 3)}"
    if key in _geo_cache:
        return _geo_cache[key]

    try:
        resp = requests.get(
            "https://nominatim.openstreetmap.org/reverse",
            params={"lat": lat, "lon": lng, "format": "json", "zoom": 10},
            headers={"User-Agent": "RunningDashboard/1.0"},
            timeout=5,
        )
        resp.raise_for_status()
        data = resp.json()
        addr = data.get("address", {})
        city = addr.get("city") or addr.get("town") or addr.get("village") or ""
        state = addr.get("state", "")
        result = ", ".join(filter(None, [city, state])) or None
    except Exception:
        result = None

    _geo_cache[key] = result
    _save_geo_cache()
    return result


# ---------------------------------------------------------------------------
# Unit conversions
# ---------------------------------------------------------------------------
def meters_to_miles(m):
    return round(m * 0.000621371, 1)


def meters_to_feet(m):
    return round(m * 3.28084)


def seconds_to_pace(seconds_per_meter):
    """Convert speed (m/s as 1/speed) to pace string like '7:42'."""
    if not seconds_per_meter or seconds_per_meter == 0:
        return "—"
    secs_per_mile = 1609.34 / seconds_per_meter
    mins = int(secs_per_mile // 60)
    secs = int(secs_per_mile % 60)
    return f"{mins}:{secs:02d}"


def speed_to_pace(meters_per_sec):
    """Convert m/s to pace string like '7:42 /mi'."""
    if not meters_per_sec or meters_per_sec == 0:
        return "—"
    secs_per_mile = 1609.34 / meters_per_sec
    mins = int(secs_per_mile // 60)
    secs = int(secs_per_mile % 60)
    return f"{mins}:{secs:02d} /mi"


def format_duration(seconds):
    """Format seconds to '1h 42m' or '35m'."""
    if not seconds:
        return "—"
    hours = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    if hours > 0:
        return f"{hours}h {mins:02d}m"
    return f"{mins}m"


def format_date(iso_string):
    """'2026-02-08T07:24:00Z' → '7:24 AM · Feb 8'."""
    dt = datetime.fromisoformat(iso_string.replace("Z", "+00:00"))
    return dt.strftime("%-I:%M %p · %b %-d")


# ---------------------------------------------------------------------------
# Strava workout_type → wireframe run type mapping
# ---------------------------------------------------------------------------
WORKOUT_TYPE_MAP = {
    0: None,                # Default — no type
    1: None,                # Race (could add to RUN_TYPES later)
    2: "Easy Long Run",     # Long Run
    3: "Tempo Run",         # Workout (structured effort)
}


def map_run_type(workout_type):
    """Map Strava workout_type int to wireframe run type string."""
    if workout_type is None:
        return None
    return WORKOUT_TYPE_MAP.get(workout_type, None)


# ---------------------------------------------------------------------------
# Data fetch + transform functions
# ---------------------------------------------------------------------------
def get_profile():
    """
    Fetch athlete profile + stats + shoes.
    Returns shape matching wireframe Profile card + ALL_SHOES.
    """
    hit, data = cached("profile")
    if hit:
        return data

    athlete = _api_get("/athlete")
    athlete_id = athlete["id"]
    stats = _api_get(f"/athletes/{athlete_id}/stats")

    # YTD miles
    ytd = stats.get("ytd_run_totals", {})
    ytd_miles = meters_to_miles(ytd.get("distance", 0))

    # Shoes — Strava returns distance in meters
    shoes = []
    for s in athlete.get("shoes", []):
        shoes.append({
            "id": s["id"],
            "name": s["name"],
            "miles": meters_to_miles(s.get("distance", 0)),
            "max": DEFAULT_SHOE_MAX_MILES,  # user-configurable, not from Strava
        })
    # Sort by miles descending (most used first)
    shoes.sort(key=lambda x: x["miles"], reverse=True)

    result = {
        "name": f"{athlete.get('firstname', '')} {athlete.get('lastname', '')}".strip(),
        "city": athlete.get("city", ""),
        "state": athlete.get("state", ""),
        "avatar": athlete.get("profile_medium", ""),
        "ytd_miles": ytd_miles,
        "shoes": shoes,
        "measurement_preference": athlete.get("measurement_preference", "feet"),
    }

    cache_set("profile", result)
    return result


def get_activities_for_week(week_start, week_end):
    """
    Fetch activities within a date range.
    Returns list of activity summaries (no splits — those need detail calls).
    """
    after = int(week_start.timestamp())
    before = int(week_end.timestamp())

    activities = _api_get("/athlete/activities", params={
        "after": after,
        "before": before,
        "per_page": 50,
    })

    # Filter to runs only (type=Run or sport_type=Run)
    runs = [a for a in activities if a.get("type") == "Run" or a.get("sport_type") == "Run"]
    return runs


def _get_city(activity):
    """Extract city from start_latlng via reverse geocoding."""
    latlng = activity.get("start_latlng")
    if not latlng or len(latlng) < 2:
        return None
    return reverse_geocode(latlng[0], latlng[1])


def get_activity_detail(activity_id):
    """
    Fetch full activity detail including splits.
    Returns wireframe-shaped activity dict.
    """
    cache_key = f"activity_{activity_id}"
    hit, data = cached(cache_key, ttl=600)  # 10 min for individual activities
    if hit:
        return data

    a = _api_get(f"/activities/{activity_id}")

    # Build splits from splits_standard (imperial) or splits_metric
    raw_splits = a.get("splits_standard", []) or a.get("splits_metric", [])
    splits = []
    for s in raw_splits:
        split_num = s.get("split", len(splits) + 1)
        avg_speed = s.get("average_speed", 0)
        elev_diff = s.get("elevation_difference", 0)
        elev_ft = meters_to_feet(elev_diff) if elev_diff else 0
        elev_str = f"{'+' if elev_ft >= 0 else ''}{elev_ft}ft"
        if elev_ft < 0:
            elev_str = f"{elev_ft}ft"

        splits.append({
            "m": split_num,
            "p": seconds_to_pace(avg_speed),
            "e": elev_str,
            "dist": s.get("distance", 0),
            "moving_time": s.get("moving_time", 0),
        })

    # Gear name
    gear = a.get("gear", {})
    shoe_name = gear.get("name", "Unknown") if gear else "Unknown"

    result = {
        "id": a["id"],
        "title": a.get("name", "Run"),
        "description": a.get("description") or None,
        "date": format_date(a.get("start_date_local", "")),
        "distance": f"{meters_to_miles(a.get('distance', 0))} mi",
        "distance_raw": meters_to_miles(a.get("distance", 0)),
        "pace": speed_to_pace(a.get("average_speed", 0)),
        "time": format_duration(a.get("moving_time", 0)),
        "elev": f"{meters_to_feet(a.get('total_elevation_gain', 0))} ft",
        "shoe": shoe_name,
        "device": a.get("device_name") or None,
        "runType": map_run_type(a.get("workout_type")),
        "sport": "run",
        "splits": splits,
        "cal": a.get("calories", 0) or 0,
        "eff": a.get("suffer_score") or None,  # Can be null
        "avg_hr": round(a["average_heartrate"]) if a.get("has_heartrate") and a.get("average_heartrate") else None,
        "max_hr": round(a["max_heartrate"]) if a.get("has_heartrate") and a.get("max_heartrate") else None,
        "avg_cadence": round(a["average_cadence"] * 2) if a.get("average_cadence") else None,
        "start_date_local": a.get("start_date_local", ""),
        "polyline": (a.get("map") or {}).get("summary_polyline") or None,
        "city": _get_city(a),
    }

    cache_set(cache_key, result)
    return result


def get_recent_activities(count=10, page=1):
    """
    Fetch the most recent N runs with full details (splits, calories, etc).
    Always returns content regardless of what week it is.
    Supports pagination via page param (1-indexed).
    """
    cache_key = f"recent_{count}_p{page}"
    hit, data = cached(cache_key)
    if hit:
        return data

    # Fetch recent activities (Strava returns newest first by default)
    # Request extra to account for non-run activities being filtered out
    raw = _api_get("/athlete/activities", params={
        "per_page": count * 2,
        "page": page,
    })

    # Filter to runs only
    runs = [a for a in raw if a.get("type") == "Run" or a.get("sport_type") == "Run"]
    runs = runs[:count]

    # Fetch full details for each
    activities = []
    for r in runs:
        try:
            detail = get_activity_detail(r["id"])
            activities.append(detail)
        except Exception as e:
            print(f"Failed to fetch detail for activity {r['id']}: {e}")

    cache_set(cache_key, activities)
    return activities


def get_current_week_summary(goal_miles=None):
    """
    Fetch current week's summary: day bubbles, total miles, goal.
    Separate from activity feed so the feed always has content.
    """
    from config import DEFAULT_WEEKLY_GOAL

    hit, data = cached("current_week_summary")
    if hit:
        return data

    goal = goal_miles or DEFAULT_WEEKLY_GOAL

    # Calculate current week boundaries (Monday–Sunday)
    today = datetime.now()
    monday = today - timedelta(days=today.weekday())
    monday = monday.replace(hour=0, minute=0, second=0, microsecond=0)
    sunday = monday + timedelta(days=6, hours=23, minutes=59, seconds=59)

    # Fetch activity list for the week
    raw_activities = get_activities_for_week(monday, sunday)

    # Build weekDays array from summary data (no detail calls needed)
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    week_days = []
    for i in range(7):
        day_date = monday + timedelta(days=i)
        day_miles = 0
        day_sport = None
        for a in raw_activities:
            try:
                a_date = datetime.fromisoformat(
                    a.get("start_date_local", "").replace("Z", "+00:00")
                )
                if a_date.date() == day_date.date():
                    day_miles += meters_to_miles(a.get("distance", 0))
                    day_sport = "run"
            except (ValueError, KeyError):
                pass

        week_days.append({
            "day": day_names[i],
            "date": day_date.day,
            "miles": round(day_miles, 1),
            "sport": day_sport if day_miles > 0 else None,
            "today": day_date.date() == today.date(),
        })

    total_mi = round(sum(d["miles"] for d in week_days), 1)

    result = {
        "weekDays": week_days,
        "totalMi": total_mi,
        "goalMi": goal,
    }

    cache_set("current_week_summary", result)
    return result


def get_past_weeks(count=3):
    """
    Fetch past N weeks summaries.
    Returns shape matching wireframe PAST_WEEKS constant.
    """
    hit, data = cached("past_weeks")
    if hit:
        return data

    today = datetime.now()
    current_monday = today - timedelta(days=today.weekday())
    current_monday = current_monday.replace(hour=0, minute=0, second=0, microsecond=0)

    weeks = []
    for w in range(1, count + 1):
        week_start = current_monday - timedelta(weeks=w)
        week_end = week_start + timedelta(days=6, hours=23, minutes=59, seconds=59)

        raw_activities = get_activities_for_week(week_start, week_end)

        # Group by day
        day_abbrevs = ["M", "T", "W", "Th", "F", "Sa", "Su"]
        days = []
        total_miles = 0
        total_seconds = 0

        for i in range(7):
            day_date = week_start + timedelta(days=i)
            day_miles = 0
            for a in raw_activities:
                try:
                    a_date = datetime.fromisoformat(
                        a.get("start_date_local", "").replace("Z", "+00:00")
                    )
                    if a_date.date() == day_date.date():
                        mi = meters_to_miles(a.get("distance", 0))
                        day_miles += mi
                        total_seconds += a.get("moving_time", 0)
                except (ValueError, KeyError):
                    pass

            day_miles = round(day_miles, 1)
            total_miles += day_miles
            days.append({"d": day_abbrevs[i], "mi": day_miles})

        # Format label: "Jan 27 – Feb 2"
        label = f"{week_start.strftime('%b %-d')} – {week_end.strftime('%b %-d')}"

        weeks.append({
            "label": label,
            "miles": round(total_miles, 1),
            "time": format_duration(total_seconds),
            "days": days,
        })

    result = {"weeks": weeks}
    cache_set("past_weeks", result)
    return result

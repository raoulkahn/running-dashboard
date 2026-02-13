"""
OpenWeatherMap client for running-hour forecasts.
Uses One Call API 3.0 (/data/3.0/onecall) for true hourly data.
Returns data shaped to match the wireframe WEATHER constant.
"""

import time
import requests
from datetime import datetime, timedelta
from config import OPENWEATHER_API_KEY

# ---------------------------------------------------------------------------
# Locations
# ---------------------------------------------------------------------------
LOCATIONS = {
    "concord": {"lat": 37.978, "lon": -122.031, "name": "Concord"},
    "danville": {"lat": 37.822, "lon": -121.999, "name": "Danville"},
}

# ---------------------------------------------------------------------------
# Simple in-memory cache (30 min TTL for weather)
# ---------------------------------------------------------------------------
WEATHER_CACHE_TTL = 1800  # 30 minutes

_cache = {}


def _cached(key):
    entry = _cache.get(key)
    if entry and time.time() - entry["ts"] < WEATHER_CACHE_TTL:
        return True, entry["data"]
    return False, None


def _cache_set(key, data):
    _cache[key] = {"data": data, "ts": time.time()}


# ---------------------------------------------------------------------------
# Weather condition code mapping
# ---------------------------------------------------------------------------
def _map_weather_type(condition_id):
    """Map OpenWeatherMap condition code to 'sun' or 'cloud'."""
    if condition_id == 800:
        return "sun"
    if 801 <= condition_id <= 802:
        return "sun"  # few/scattered clouds — still sunny enough
    return "cloud"  # 803-804 overcast, rain, snow, etc.


def _format_hour(hour):
    """Format 24h int to '9 AM' / '12 PM' style."""
    if hour == 0:
        return "12 AM"
    if hour < 12:
        return f"{hour} AM"
    if hour == 12:
        return "12 PM"
    return f"{hour - 12} PM"


# ---------------------------------------------------------------------------
# Fetch + transform
# ---------------------------------------------------------------------------
def get_hourly_forecast(location="concord"):
    """
    Fetch forecast from OpenWeatherMap One Call API 3.0.

    Logic:
    - Before 6 PM: return the next 12 hours from now.
    - At/after 6 PM: return tomorrow 6 AM – 6 PM.

    Returns dict:
      {
        "period": "today" | "tomorrow",
        "hours": [{ time, temp, rain, wind, type }, ...]
      }
    """
    loc_key = location.lower()
    cache_key = f"weather_{loc_key}"

    hit, data = _cached(cache_key)
    if hit:
        return data

    loc = LOCATIONS.get(loc_key)
    if not loc:
        raise ValueError(f"Unknown location: {location}")

    if not OPENWEATHER_API_KEY:
        raise Exception("OPENWEATHER_API_KEY not configured")

    resp = requests.get(
        "https://api.openweathermap.org/data/3.0/onecall",
        params={
            "lat": loc["lat"],
            "lon": loc["lon"],
            "exclude": "minutely,daily,alerts",
            "appid": OPENWEATHER_API_KEY,
            "units": "imperial",
        },
        timeout=10,
    )
    resp.raise_for_status()
    raw = resp.json()

    now = datetime.now()
    hourly = raw.get("hourly", [])
    hours = []

    if now.hour >= 18:
        # Evening — show tomorrow 6 AM – 6 PM
        period = "tomorrow"
        tomorrow = now.date() + timedelta(days=1)
        for item in hourly:
            dt = datetime.fromtimestamp(item["dt"])
            if dt.date() != tomorrow:
                continue
            if dt.hour < 6 or dt.hour > 18:
                continue
            hours.append(_format_item(item, dt))
    else:
        # Daytime — show next 12 hours from now
        period = "today"
        cutoff = now + timedelta(hours=12)
        for item in hourly:
            dt = datetime.fromtimestamp(item["dt"])
            if dt < now:
                continue
            if dt > cutoff:
                break
            hours.append(_format_item(item, dt))

    result = {"period": period, "hours": hours}
    _cache_set(cache_key, result)
    return result


def get_48h_forecast(location="concord"):
    """
    Fetch today + tomorrow weather for AI assistant context.
    Returns list of hour dicts with dayOffset (0=today, 1=tomorrow).
    """
    cache_key = f"weather_48h_{location.lower()}"
    hit, data = _cached(cache_key)
    if hit:
        return data

    loc = LOCATIONS.get(location.lower())
    if not loc or not OPENWEATHER_API_KEY:
        return []

    try:
        resp = requests.get(
            "https://api.openweathermap.org/data/3.0/onecall",
            params={
                "lat": loc["lat"],
                "lon": loc["lon"],
                "exclude": "minutely,daily,alerts",
                "appid": OPENWEATHER_API_KEY,
                "units": "imperial",
            },
            timeout=10,
        )
        resp.raise_for_status()
        raw = resp.json()
    except Exception:
        return []

    now = datetime.now()
    today = now.date()
    tomorrow = today + timedelta(days=1)
    hours = []

    for item in raw.get("hourly", []):
        dt = datetime.fromtimestamp(item["dt"])
        if dt.date() == today and dt >= now:
            hours.append(_format_item(item, dt, day_offset=0))
        elif dt.date() == tomorrow and 6 <= dt.hour <= 18:
            hours.append(_format_item(item, dt, day_offset=1))

    _cache_set(cache_key, hours)
    return hours


def _format_item(item, dt, day_offset=0):
    """Transform a single One Call hourly item to wireframe shape."""
    temp = round(item.get("temp", 0))
    pop = item.get("pop", 0)
    rain_pct = f"{round(pop * 100)}%"
    wind = f"{round(item.get('wind_speed', 0))} mph"
    weather_list = item.get("weather", [])
    condition_id = weather_list[0]["id"] if weather_list else 800

    return {
        "time": _format_hour(dt.hour),
        "temp": temp,
        "rain": rain_pct,
        "wind": wind,
        "type": _map_weather_type(condition_id),
        "dayOffset": day_offset,
    }

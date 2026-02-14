"""
AI Assistant client — generates coaching messages via Claude API.
Detects run mode (pre_run, post_run, rest_day, evening_no_run),
gathers context, and returns cached or fresh coaching insights.
"""

import json
import os
import time
import requests
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from config import ANTHROPIC_API_KEY

_TZ = ZoneInfo("America/Los_Angeles")

CACHE_FILE = "assistant_cache.json"
CLAUDE_MODEL = "claude-sonnet-4-20250514"
MAX_TOKENS = 200
TEMPERATURE = 0.7

# Cache TTL by mode (seconds)
CACHE_TTL = {
    "pre_run": 7200,       # 2 hours
    "post_run": 86400,     # rest of day (effectively)
    "rest_day": 86400,
    "evening_no_run": 86400,
}

SYSTEM_PROMPT = """You are a casual running buddy giving a quick check-in on a personal running dashboard.

FORMAT:
- One opening sentence about the day and week. If multiple runs logged today, reference total daily mileage only — don't list individually or call any a "warm-up." Don't sound like they just finished.
- Then 1-3 bullets using "- " prefix. Every bullet must be actionable and non-obvious. Nothing after the bullets.
- No emojis.

DAY AWARENESS:
- The context tells you what day it is (e.g. "Today is Saturday"). Use it. If you say "tomorrow" and today is Saturday, tomorrow is Sunday. Never contradict yourself — don't say "rest tomorrow" then suggest running on the same day.

NEVER MENTION:
- Sleep, hydration, refueling, stretching, foam rolling, "listen to your body"
- Generic encouragement ("great job", "keep it up", "you're on track")
- Pace analysis or fitness commentary — the user can see their own numbers
- NEVER reference any specific past run by distance or name if it was more than 3 days ago. No exceptions. No "your 20-miler last week", no "that long run is still in your legs." Only reference runs from the last 3 days.

ONE RUN PER DAY:
- The context includes a "RAN TODAY" field. If it says "Yes", the user has already run today. NEVER suggest running more today — no "consider a longer run today", no "get miles in today if you're feeling good", no splits, no shakeouts. Today is done. This overrides everything else.

WEEK BOUNDARIES:
- "This week's runs" = current Mon-Sun. "Previous-week run" = last week. Never mix them up.

WEATHER:
- Reference specific temps, rain chance, wind when relevant.
- Rain tomorrow = rest day. Don't push running in bad weather to hit mileage.
- Only suggest "get miles in today" if no run logged today AND tomorrow is bad.

MILEAGE — BE HONEST:
- If the user already ran today and remaining days have bad weather, do NOT mention how many miles are left. The dashboard already shows that. Just suggest rest and move on.
- If the weekly goal is clearly out of reach, say "lighter week, that's fine" and move on. Don't manufacture a plan to squeeze in miles.
- Never frame remaining mileage as something to "tackle", "make up", or "salvage." Missing weekly mileage is not a failure.
- Never guilt-trip about missed miles. It's fine.
- Never suggest more than 15 miles in one day unless they've recently done that distance.

WEIGH-IN REMINDER:
- If today is Monday, Thursday, or Sunday and there are fewer than 3 bullets, add one: "Good day to step on the scale and check in."

GOAL COMPLETE:
- Weekly goal hit + all run types done: note briefly, suggest strength or cycling (Zwift). No more running.
- Goal hit but some types remain: mention what's left without pressure."""


def _load_cache():
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    return {}


def _save_cache(data):
    with open(CACHE_FILE, "w") as f:
        json.dump(data, f, indent=2)


def detect_mode(activities, plan=None):
    """
    Determine coaching mode based on today's activities and plan.
    activities: list of activity dicts with start_date_local
    plan: list of plan items with type and count (optional)
    """
    now = datetime.now(_TZ)
    today_str = now.strftime("%Y-%m-%d")

    has_run_today = False
    for a in (activities or []):
        sdl = a.get("start_date_local", "")
        if sdl and sdl[:10] == today_str:
            has_run_today = True
            break

    if has_run_today:
        return "post_run"

    # Check if today is a rest day in the plan
    if plan:
        total_planned = sum(p.get("count", 0) for p in plan)
        if total_planned == 0:
            return "rest_day"

    if now.hour >= 20:
        return "evening_no_run"

    return "pre_run"


def _is_cache_valid(cache, mode, activities):
    """Check if cached message is still valid."""
    if not cache or "timestamp" not in cache:
        return False

    cached_mode = cache.get("mode")
    cached_ts = cache.get("timestamp", 0)
    now = time.time()

    # If mode changed, invalidate
    if cached_mode != mode:
        return False

    # If a new activity appeared (post_run detected but cache was pre_run)
    if mode == "post_run" and cached_mode != "post_run":
        return False

    # Check TTL
    ttl = CACHE_TTL.get(mode, 7200)

    # For day-long caches, check if it's still the same day
    if ttl >= 86400:
        cached_date = datetime.fromtimestamp(cached_ts).date()
        today = datetime.now().date()
        if cached_date != today:
            return False
        return True

    return (now - cached_ts) < ttl


def build_context(activities, week_summary, weather, plan, profile, goal_mi=None):
    """Build context string for the Claude prompt."""
    now = datetime.now(_TZ)
    day_name = now.strftime("%A")
    time_str = now.strftime("%-I:%M %p")

    # Explicit day-of-week context so Claude understands week position
    dow = now.weekday()  # 0=Mon, 6=Sun
    day_names_full = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    remaining_days = [day_names_full[i] for i in range(dow, 7)]
    days_left = len(remaining_days)
    parts = [
        f"Today is {day_name}, {time_str}.",
        f"The training week runs Monday through Sunday. "
        f"There {'is' if days_left == 1 else 'are'} {days_left} day{'s' if days_left != 1 else ''} "
        f"remaining in the week ({', '.join(remaining_days)})."
    ]

    # Weekly mileage vs goal — use explicit goal_mi from settings, not cached week summary
    if week_summary:
        total = week_summary.get("totalMi", 0)
        goal = goal_mi if goal_mi is not None else week_summary.get("goalMi", 50)
        remaining_mi = round(max(goal - total, 0), 1)
        parts.append(f"Weekly mileage: {total} of {goal} mi goal ({remaining_mi} mi remaining)")

    # Plan items remaining
    if plan:
        remaining = []
        for p in plan:
            if p.get("count", 0) > 0:
                remaining.append(f"{p['type']} (×{p['count']})")
        if remaining:
            parts.append(f"Remaining plan items: {', '.join(remaining)}")

    # Split activities into this week vs previous using Mon-Sun boundaries
    if activities and len(activities) > 0:
        monday = (now - timedelta(days=now.weekday())).date()  # date only, no tz issues
        this_week_acts = []
        prev_acts = []
        for a in activities:
            sdl = a.get("start_date_local", "")
            if sdl:
                try:
                    act_date = datetime.strptime(sdl[:10], "%Y-%m-%d").date()
                    if act_date >= monday:
                        this_week_acts.append(a)
                    else:
                        prev_acts.append(a)
                except ValueError:
                    prev_acts.append(a)
            else:
                prev_acts.append(a)

        # Flag today's runs explicitly
        today_str = now.strftime("%Y-%m-%d")
        today_acts = [a for a in this_week_acts if a.get("start_date_local", "")[:10] == today_str]
        if today_acts:
            today_mi = sum(float(a.get("distance", "0").replace(" mi", "")) for a in today_acts)
            parts.append(f"RAN TODAY: Yes — {round(today_mi, 1)} mi already logged today. Today's running is DONE. Do not suggest more running today.")
        else:
            parts.append("RAN TODAY: No — no run logged yet today.")

        if this_week_acts:
            runs_desc = "; ".join(
                f"{a.get('title', 'Run')} ({a.get('distance', '?')}, {a.get('pace', '?')})"
                for a in this_week_acts[:5]
            )
            parts.append(f"This week's runs: {runs_desc}")
        else:
            parts.append("No runs yet this week.")

        if prev_acts:
            a = prev_acts[0]
            sdl = a.get("start_date_local", "")
            date_label = ""
            if sdl:
                try:
                    date_label = f" on {datetime.strptime(sdl[:10], '%Y-%m-%d').strftime('%A %b %-d')}"
                except ValueError:
                    pass
            parts.append(
                f"Most recent previous-week run: {a.get('title', 'Run')} — "
                f"{a.get('distance', '?')} in {a.get('time', '?')} "
                f"at {a.get('pace', '?')} pace{date_label}"
            )

    # Weather summary — split into today (dayOffset=0) and tomorrow (dayOffset=1)
    if weather and len(weather) > 0:
        today_hours = [h for h in weather if h.get("dayOffset", 0) == 0]
        tomorrow_hours = [h for h in weather if h.get("dayOffset", 0) == 1]

        def _summarize_hours(hours, label):
            if not hours:
                return None
            mid = None
            for h in hours:
                t_str = h.get("time", "")
                if "11" in t_str or "12" in t_str:
                    mid = h
                    break
            if not mid:
                mid = hours[len(hours) // 2] if len(hours) > 1 else hours[0]
            temps = [h.get("temp", 0) for h in hours]
            low, high = min(temps), max(temps)
            rain_vals = [int(h.get("rain", "0%").replace("%", "")) for h in hours]
            max_rain = max(rain_vals) if rain_vals else 0
            return (
                f"{label} weather: {low}–{high}°F, "
                f"wind {mid.get('wind', '?')}, "
                f"rain up to {max_rain}%, "
                f"{'sunny' if mid.get('type') == 'sun' else 'cloudy'}"
            )

        today_summary = _summarize_hours(today_hours, "Today's")
        tomorrow_summary = _summarize_hours(tomorrow_hours, "Tomorrow's")
        if today_summary:
            parts.append(today_summary)
        if tomorrow_summary:
            parts.append(tomorrow_summary)

    return "\n".join(parts)


def get_coaching_message(activities, week_summary, weather, plan, profile, goal_mi=None):
    """
    Get or generate a coaching message.
    Returns dict: { "message": str, "mode": str }
    """
    if not ANTHROPIC_API_KEY:
        return {
            "message": "AI Assistant requires an Anthropic API key. Add ANTHROPIC_API_KEY to your .env file.",
            "mode": "error",
        }

    mode = detect_mode(activities, plan)
    cache = _load_cache()

    # Check cache validity
    if _is_cache_valid(cache, mode, activities):
        return {"message": cache["message"], "mode": cache["mode"]}

    # Build context and call Claude
    context = build_context(activities, week_summary, weather, plan, profile, goal_mi=goal_mi)
    user_msg = f"Mode: {mode}\n\nContext:\n{context}"

    try:
        resp = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": CLAUDE_MODEL,
                "max_tokens": MAX_TOKENS,
                "temperature": TEMPERATURE,
                "system": SYSTEM_PROMPT,
                "messages": [{"role": "user", "content": user_msg}],
            },
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()

        message = ""
        for block in data.get("content", []):
            if block.get("type") == "text":
                message += block["text"]

        if not message:
            raise Exception("Empty response from Claude")

        # Cache the result
        cache_data = {
            "message": message,
            "mode": mode,
            "timestamp": time.time(),
        }
        _save_cache(cache_data)

        return {"message": message, "mode": mode}

    except Exception as e:
        print(f"Assistant API error: {e}")
        # Return a fallback if cache exists (even if expired)
        if cache and "message" in cache:
            return {"message": cache["message"], "mode": cache.get("mode", mode)}
        return {
            "message": "Unable to generate coaching insight right now. Check back soon.",
            "mode": "error",
        }

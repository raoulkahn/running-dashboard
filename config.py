import os
from dotenv import load_dotenv

load_dotenv()

# Strava OAuth
STRAVA_CLIENT_ID = os.getenv("STRAVA_CLIENT_ID")
STRAVA_CLIENT_SECRET = os.getenv("STRAVA_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI", "http://localhost:5000/auth/callback")
FLASK_SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "dev-secret-change-me")

STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize"
STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token"
STRAVA_API_BASE = "https://www.strava.com/api/v3"
STRAVA_SCOPES = "read,activity:read_all,profile:read_all"

# OpenWeatherMap
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

# Anthropic (Claude AI Assistant)
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

# App mode: "personal", "demo", "development"
APP_MODE = os.getenv("APP_MODE", "development")

# Defaults
DEFAULT_SHOE_MAX_MILES = 300
DEFAULT_WEEKLY_GOAL = 50
CACHE_TTL_SECONDS = 300  # 5 minutes
ACTIVITIES_PER_PAGE = 30
WEEKS_TO_FETCH = 4  # current + 3 past

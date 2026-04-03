"""
Database module — Supabase/Postgres via psycopg3.
Provides connection pooling, schema init, and CRUD helpers.
Gracefully no-ops when DATABASE_URL is not set (local dev / demo mode).
"""

import json
import os
from urllib.parse import urlparse, unquote

DATABASE_URL = os.getenv("DATABASE_URL")

_pool = None


def _parse_db_url(url):
    """Parse DATABASE_URL into psycopg3 keyword conninfo string.
    Avoids passing raw URI to the pool, which breaks on special
    characters in passwords (common with Supabase)."""
    parsed = urlparse(url)
    host = unquote(parsed.hostname or "")
    port = str(parsed.port or 5432)
    user = unquote(parsed.username or "postgres")
    password = unquote(parsed.password or "")
    dbname = unquote(parsed.path.lstrip("/") or "postgres")
    # Escape single quotes in password for conninfo format
    password = password.replace("'", "\\'")
    return f"host={host} port={port} user={user} password='{password}' dbname={dbname} connect_timeout=5"


def _get_pool():
    """Lazy-init connection pool."""
    global _pool
    if _pool is not None:
        return _pool
    if not DATABASE_URL:
        return None
    try:
        from psycopg_pool import ConnectionPool
        conninfo = _parse_db_url(DATABASE_URL)
        _pool = ConnectionPool(
            conninfo,
            min_size=0,           # don't require connections at startup
            max_size=5,
            open=False,           # non-blocking — don't connect during init
            max_lifetime=120,     # recycle connections every 2 min (prevents stale SSL)
            max_idle=60,          # close idle connections after 60s
            reconnect_timeout=5,  # don't spend forever retrying failed connections
        )
        _pool.open(wait=False)    # start pool in background, don't block
        return _pool
    except Exception as e:
        print(f"[db] Failed to create connection pool: {e}")
        return None


def _conn():
    """Get a connection from the pool. Returns None if no DB."""
    pool = _get_pool()
    if not pool:
        return None
    try:
        return pool.getconn(timeout=3)  # fail fast, don't hang gunicorn workers
    except Exception as e:
        print(f"[db] Failed to get connection: {e}")
        return None


def _put(conn):
    """Return a connection to the pool."""
    pool = _get_pool()
    if pool and conn:
        try:
            pool.putconn(conn)
        except Exception:
            pass


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------
def init_db():
    """Create tables if they don't exist. Safe to call on every startup."""
    conn = _conn()
    if not conn:
        print("[db] No DATABASE_URL — running without database")
        return False
    try:
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                key   TEXT PRIMARY KEY,
                value JSONB NOT NULL DEFAULT '{}'::jsonb
            );
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS strava_tokens (
                id          INTEGER PRIMARY KEY DEFAULT 1,
                token_data  JSONB NOT NULL,
                updated_at  TIMESTAMP DEFAULT now()
            );
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS run_types (
                activity_id TEXT PRIMARY KEY,
                run_type    TEXT NOT NULL
            );
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS chat_history (
                id         SERIAL PRIMARY KEY,
                role       TEXT NOT NULL,
                content    TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT now(),
                is_demo    BOOLEAN DEFAULT FALSE
            );
        """)
        conn.commit()
        cur.close()
        print("[db] Schema initialized")
        return True
    except Exception as e:
        print(f"[db] Schema init failed: {e}")
        conn.rollback()
        return False
    finally:
        _put(conn)


# ---------------------------------------------------------------------------
# Settings helpers (key/value JSONB store)
# ---------------------------------------------------------------------------
def db_get_setting(key):
    """Get a setting value by key. Returns None if not found or no DB."""
    conn = _conn()
    if not conn:
        return None
    try:
        cur = conn.cursor()
        cur.execute("SELECT value FROM settings WHERE key = %s", (key,))
        row = cur.fetchone()
        cur.close()
        return row[0] if row else None
    except Exception as e:
        print(f"[db] get_setting({key}) failed: {e}")
        return None
    finally:
        _put(conn)


def db_set_setting(key, value):
    """Upsert a setting. value should be a dict/list (stored as JSONB)."""
    conn = _conn()
    if not conn:
        return False
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO settings (key, value)
            VALUES (%s, %s::jsonb)
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        """, (key, json.dumps(value)))
        conn.commit()
        cur.close()
        return True
    except Exception as e:
        print(f"[db] set_setting({key}) failed: {e}")
        conn.rollback()
        return False
    finally:
        _put(conn)


# ---------------------------------------------------------------------------
# Strava token helpers
# ---------------------------------------------------------------------------
def db_get_token():
    """Load Strava token data from DB. Returns dict or None."""
    conn = _conn()
    if not conn:
        return None
    try:
        cur = conn.cursor()
        cur.execute("SELECT token_data FROM strava_tokens WHERE id = 1")
        row = cur.fetchone()
        cur.close()
        return row[0] if row else None
    except Exception as e:
        print(f"[db] get_token failed: {e}")
        return None
    finally:
        _put(conn)


def db_save_token(token_data):
    """Save Strava token data to DB (upsert row id=1)."""
    conn = _conn()
    if not conn:
        return False
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO strava_tokens (id, token_data, updated_at)
            VALUES (1, %s::jsonb, now())
            ON CONFLICT (id) DO UPDATE
                SET token_data = EXCLUDED.token_data,
                    updated_at = now()
        """, (json.dumps(token_data),))
        conn.commit()
        cur.close()
        return True
    except Exception as e:
        print(f"[db] save_token failed: {e}")
        conn.rollback()
        return False
    finally:
        _put(conn)


# ---------------------------------------------------------------------------
# Run types helpers
# ---------------------------------------------------------------------------
def db_get_run_types():
    """Load all run types as {activity_id: run_type} dict."""
    conn = _conn()
    if not conn:
        return None
    try:
        cur = conn.cursor()
        cur.execute("SELECT activity_id, run_type FROM run_types")
        rows = cur.fetchall()
        cur.close()
        return {r[0]: r[1] for r in rows}
    except Exception as e:
        print(f"[db] get_run_types failed: {e}")
        return None
    finally:
        _put(conn)


def db_save_run_type(activity_id, run_type):
    """Upsert a single run type."""
    conn = _conn()
    if not conn:
        return False
    try:
        cur = conn.cursor()
        if run_type is None:
            cur.execute("DELETE FROM run_types WHERE activity_id = %s", (str(activity_id),))
        else:
            cur.execute("""
                INSERT INTO run_types (activity_id, run_type)
                VALUES (%s, %s)
                ON CONFLICT (activity_id) DO UPDATE SET run_type = EXCLUDED.run_type
            """, (str(activity_id), run_type))
        conn.commit()
        cur.close()
        return True
    except Exception as e:
        print(f"[db] save_run_type({activity_id}) failed: {e}")
        conn.rollback()
        return False
    finally:
        _put(conn)


# ---------------------------------------------------------------------------
# Coach rate limiting (monthly counter for guest users)
# ---------------------------------------------------------------------------
def db_get_coach_usage():
    """Get current month's guest coach usage. Returns {"count": N, "month": "2026-04"} or None."""
    return db_get_setting("coach_usage")


def db_increment_coach_usage():
    """Increment guest coach usage for current month. Resets if month changed. Returns new count."""
    from datetime import datetime
    current_month = datetime.now().strftime("%Y-%m")
    usage = db_get_setting("coach_usage")
    if usage and usage.get("month") == current_month:
        new_count = usage.get("count", 0) + 1
    else:
        new_count = 1
    db_set_setting("coach_usage", {"count": new_count, "month": current_month})
    return new_count


# ---------------------------------------------------------------------------
# Convenience: check if DB is available
# ---------------------------------------------------------------------------
def is_available():
    """Return True if DATABASE_URL is set and pool can connect."""
    return _get_pool() is not None

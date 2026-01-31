#!/usr/bin/env python3
"""
x-proxy.py — Local HTTP proxy for posting tweets via X's internal API.

Runs a Flask server on port 19877. Uses undetected-chromedriver to authenticate
with X/Twitter and saves session cookies for reuse.

Usage:
    pip install -r requirements.txt
    python x-proxy.py

Endpoints:
    POST /tweet   — {"text": "tweet content"} → {"ok": true, "id": "..."}
    GET  /status   — Health check and auth status
"""

import json
import os
import pickle
import sys
import time
import hashlib
import logging
from pathlib import Path
from threading import Lock

from flask import Flask, request, jsonify

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("x-proxy")

app = Flask(__name__)

COOKIE_FILE = Path(__file__).parent / ".x_cookies.pkl"
BEARER_TOKEN = "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA"
CSRF_TOKEN = None
AUTH_COOKIES = None
SESSION_LOCK = Lock()


def _generate_csrf():
    """Generate a random CSRF token."""
    return hashlib.md5(os.urandom(32)).hexdigest()


def _load_cookies():
    """Load saved cookies from disk."""
    global AUTH_COOKIES, CSRF_TOKEN
    if COOKIE_FILE.exists():
        try:
            with open(COOKIE_FILE, "rb") as f:
                data = pickle.load(f)
                AUTH_COOKIES = data.get("cookies")
                CSRF_TOKEN = data.get("csrf_token")
                log.info("Loaded saved cookies from %s", COOKIE_FILE)
                return True
        except Exception as e:
            log.warning("Failed to load cookies: %s", e)
    return False


def _save_cookies(cookies, csrf):
    """Save cookies to disk for reuse."""
    with open(COOKIE_FILE, "wb") as f:
        pickle.dump({"cookies": cookies, "csrf_token": csrf}, f)
    log.info("Saved cookies to %s", COOKIE_FILE)


def _login_with_browser():
    """Open a browser for the user to log into X, then capture cookies."""
    global AUTH_COOKIES, CSRF_TOKEN

    try:
        import undetected_chromedriver as uc
    except ImportError:
        log.error("undetected-chromedriver not installed. Run: pip install undetected-chromedriver")
        return False

    log.info("Opening browser for X login...")
    log.info("Please log into your X/Twitter account in the browser window.")

    options = uc.ChromeOptions()
    options.add_argument("--no-first-run")
    options.add_argument("--no-service-autorun")

    driver = uc.Chrome(options=options)
    driver.get("https://x.com/login")

    log.info("Waiting for login... (navigate to your home feed when done)")
    log.info("The script will detect login automatically.")

    # Poll until we see auth cookies (ct0 = CSRF token from X)
    max_wait = 300  # 5 minutes
    start = time.time()
    logged_in = False

    while time.time() - start < max_wait:
        try:
            cookies = driver.get_cookies()
            cookie_dict = {c["name"]: c["value"] for c in cookies}

            if "ct0" in cookie_dict and "auth_token" in cookie_dict:
                CSRF_TOKEN = cookie_dict["ct0"]
                AUTH_COOKIES = cookie_dict
                _save_cookies(AUTH_COOKIES, CSRF_TOKEN)
                logged_in = True
                log.info("Login detected! Cookies saved.")
                break
        except Exception:
            pass

        time.sleep(2)

    try:
        driver.quit()
    except Exception:
        pass

    if not logged_in:
        log.error("Login timed out after %d seconds.", max_wait)

    return logged_in


def _build_headers():
    """Build headers for X's internal API."""
    if not AUTH_COOKIES or not CSRF_TOKEN:
        return None

    cookie_str = "; ".join(f"{k}={v}" for k, v in AUTH_COOKIES.items())

    return {
        "Authorization": f"Bearer {BEARER_TOKEN}",
        "Content-Type": "application/json",
        "X-Csrf-Token": CSRF_TOKEN,
        "Cookie": cookie_str,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "X-Twitter-Active-User": "yes",
        "X-Twitter-Auth-Type": "OAuth2Session",
        "X-Twitter-Client-Language": "en",
    }


def _post_tweet(text):
    """Post a tweet using X's internal GraphQL API."""
    import requests

    headers = _build_headers()
    if not headers:
        return {"ok": False, "error": "Not authenticated. Restart proxy to log in."}

    # X's CreateTweet GraphQL endpoint
    url = "https://x.com/i/api/graphql/oB-5XsHNAbjvARJEc8CZFw/CreateTweet"

    payload = {
        "variables": {
            "tweet_text": text,
            "dark_request": False,
            "media": {"media_entities": [], "possibly_sensitive": False},
            "semantic_annotation_ids": [],
        },
        "features": {
            "communities_web_enable_tweet_community_results_fetch": True,
            "c9s_tweet_anatomy_moderator_badge_enabled": True,
            "tweetypie_unmention_optimization_enabled": True,
            "responsive_web_edit_tweet_api_enabled": True,
            "graphql_is_translatable_rweb_tweet_is_translatable_enabled": True,
            "view_counts_everywhere_api_enabled": True,
            "longform_notetweets_consumption_enabled": True,
            "responsive_web_twitter_article_tweet_consumption_enabled": True,
            "tweet_awards_web_tipping_enabled": False,
            "creator_subscriptions_quote_tweet_preview_enabled": False,
            "longform_notetweets_rich_text_read_enabled": True,
            "longform_notetweets_inline_media_enabled": True,
            "articles_preview_enabled": True,
            "rweb_video_timestamps_enabled": True,
            "rweb_tipjar_consumption_enabled": True,
            "responsive_web_graphql_exclude_directive_enabled": True,
            "verified_phone_label_enabled": False,
            "freedom_of_speech_not_reach_fetch_enabled": True,
            "standardized_nudges_misinfo": True,
            "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": True,
            "responsive_web_graphql_skip_user_profile_image_extensions_enabled": False,
            "responsive_web_graphql_timeline_navigation_enabled": True,
            "responsive_web_enhance_cards_enabled": False,
        },
        "queryId": "oB-5XsHNAbjvARJEc8CZFw",
    }

    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=30)

        if resp.status_code == 200:
            data = resp.json()
            try:
                result = data["data"]["create_tweet"]["tweet_results"]["result"]
                tweet_id = result.get("rest_id", "unknown")
                return {"ok": True, "id": tweet_id}
            except (KeyError, TypeError):
                return {"ok": True, "id": "unknown", "raw": data}
        elif resp.status_code == 403:
            return {"ok": False, "error": "Forbidden — cookies may have expired. Restart proxy."}
        else:
            return {
                "ok": False,
                "error": f"HTTP {resp.status_code}: {resp.text[:500]}",
            }
    except requests.exceptions.RequestException as e:
        return {"ok": False, "error": str(e)}


@app.route("/tweet", methods=["POST"])
def tweet():
    """Post a tweet."""
    data = request.get_json(force=True, silent=True)
    if not data or "text" not in data:
        return jsonify({"ok": False, "error": "Missing 'text' in JSON body"}), 400

    text = data["text"].strip()
    if not text:
        return jsonify({"ok": False, "error": "Tweet text cannot be empty"}), 400

    if len(text) > 280:
        return jsonify({"ok": False, "error": f"Tweet too long ({len(text)} chars, max 280)"}), 400

    with SESSION_LOCK:
        result = _post_tweet(text)

    status_code = 200 if result["ok"] else 500
    return jsonify(result), status_code


@app.route("/status", methods=["GET"])
def status():
    """Check proxy status."""
    if AUTH_COOKIES and CSRF_TOKEN:
        return jsonify({"ok": True, "logged_in": True, "account": "@MoltXAgent"})
    else:
        return jsonify({"ok": False, "logged_in": False, "error": "Not authenticated"})


@app.route("/", methods=["GET"])
def index():
    """Root endpoint."""
    return jsonify({
        "service": "x-proxy",
        "version": "1.0.0",
        "endpoints": {
            "POST /tweet": "Post a tweet (JSON body: {\"text\": \"...\"})",
            "GET /status": "Check auth status",
        },
    })


def main():
    port = int(os.environ.get("X_PROXY_PORT", 19877))

    # Try loading saved cookies first
    if not _load_cookies():
        log.info("No saved cookies found. Starting browser login flow...")
        if not _login_with_browser():
            log.error("Failed to authenticate. Exiting.")
            sys.exit(1)

    # Verify cookies are present
    if not AUTH_COOKIES or not CSRF_TOKEN:
        log.error("No valid authentication. Exiting.")
        sys.exit(1)

    log.info("Starting x-proxy on port %d", port)
    log.info("POST http://localhost:%d/tweet  — Post a tweet", port)
    log.info("GET  http://localhost:%d/status  — Check status", port)

    app.run(host="127.0.0.1", port=port, debug=False)


if __name__ == "__main__":
    main()

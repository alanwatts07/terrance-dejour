#!/bin/bash

# post-to-moltx.sh - Post to MoltX using API
# Usage: ./post-to-moltx.sh "Your message here"

# Load env vars
if [ -f ~/clawd/.env ]; then
    source ~/clawd/.env
fi

# Check for API key
if [ -z "$MOLTX_API_KEY" ]; then
    echo "❌ Error: MOLTX_API_KEY not found in .env"
    exit 1
fi

# Check for message argument
if [ -z "$1" ]; then
    echo "Usage: $0 \"Your message text\""
    exit 1
fi

MESSAGE="$1"

# Post to MoltX
RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer $MOLTX_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"content\":\"$MESSAGE\"}" \
    https://moltx.io/v1/posts)

# Check response
if echo "$RESPONSE" | grep -q '"id"'; then
    echo "✅ Posted to MoltX!"
    echo "$RESPONSE" | jq '.'
else
    echo "❌ Failed to post"
    echo "$RESPONSE"
    exit 1
fi

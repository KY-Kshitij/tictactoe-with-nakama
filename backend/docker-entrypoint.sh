#!/bin/sh
set -e

if [ "$1" = "migrate" ] || [ "$1" = "healthcheck" ]; then
  exec /nakama/nakama "$@"
fi

CORS_ALLOW_ORIGIN="${CORS_ALLOW_ORIGIN:-http://localhost:3000}"
CORS_ALLOW_CREDENTIALS="${CORS_ALLOW_CREDENTIALS:-true}"
CORS_PREFLIGHT_MAX_AGE="${CORS_PREFLIGHT_MAX_AGE:-86400}"
CORS_ALLOW_HEADERS="${CORS_ALLOW_HEADERS:-Authorization,Content-Type,Accept,Origin,X-Requested-With}"
CORS_ALLOW_METHODS="${CORS_ALLOW_METHODS:-GET,POST,PUT,DELETE,OPTIONS}"

if [ "$CORS_ALLOW_ORIGIN" = "*" ] && [ "$CORS_ALLOW_CREDENTIALS" = "true" ]; then
  echo "Error: CORS_ALLOW_ORIGIN cannot be set to wildcard (*) when CORS_ALLOW_CREDENTIALS=true."
  exit 1
fi

exec /nakama/nakama \
  --socket.response_headers "Access-Control-Allow-Origin=${CORS_ALLOW_ORIGIN}" \
  --socket.response_headers "Access-Control-Allow-Headers=${CORS_ALLOW_HEADERS}" \
  --socket.response_headers "Access-Control-Allow-Methods=${CORS_ALLOW_METHODS}" \
  --socket.response_headers "Access-Control-Allow-Credentials=${CORS_ALLOW_CREDENTIALS}" \
  --socket.response_headers "Access-Control-Max-Age=${CORS_PREFLIGHT_MAX_AGE}" \
  "$@"

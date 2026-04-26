#!/bin/sh
set -e

if [ "$1" = "migrate" ] || [ "$1" = "healthcheck" ]; then
  exec /nakama/nakama "$@"
fi

CORS_ALLOW_ORIGIN="${CORS_ALLOW_ORIGIN:-*}"

exec /nakama/nakama \
  --socket.response_headers "Access-Control-Allow-Origin=${CORS_ALLOW_ORIGIN}" \
  --socket.response_headers "Access-Control-Allow-Headers=Authorization,Content-Type,Accept,Origin,X-Requested-With" \
  --socket.response_headers "Access-Control-Allow-Methods=GET,POST,PUT,DELETE,OPTIONS" \
  --socket.response_headers "Access-Control-Allow-Credentials=true" \
  "$@"

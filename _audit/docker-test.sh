#!/usr/bin/env bash
# Run the CI smoke gate INSIDE the official Playwright container — a real
# containerized E2E: a Linux Chromium drives the deck (incl. the offline
# standalone test). Proves the deck/gate are host-independent.
#
# Prereq: docker daemon running; vendor/ + standalone built on the host.
set -euo pipefail
PROJ="$(cd "$(dirname "$0")/.." && pwd)"
docker run --rm \
  -v "$PROJ":/work \
  -w /work/_audit \
  -e PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
  mcr.microsoft.com/playwright:v1.60.0-jammy \
  node ci-gate.mjs

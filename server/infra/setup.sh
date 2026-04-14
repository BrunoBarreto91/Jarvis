#!/bin/bash
# ─── Jarvis — n8n Infrastructure Setup ───────────────────────────────────────
# Provisions n8n on an EC2 instance with Docker.
# Prerequisites: Docker and Docker Compose installed on the target machine.
#
# Usage:
#   1. Copy .env.example to .env and fill in your credentials
#   2. Run: bash setup.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

echo "╔══════════════════════════════════════╗"
echo "║   Jarvis — n8n Infrastructure Setup  ║"
echo "╚══════════════════════════════════════╝"

# Validate required environment variables
if [ ! -f .env ]; then
    echo "❌ .env file not found. Copy .env.example to .env and configure it."
    exit 1
fi

source .env

REQUIRED_VARS=(DB_MYSQLDB_HOST DB_MYSQLDB_PASSWORD WEBHOOK_URL)
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var:-}" ]; then
        echo "❌ Missing required variable: $var"
        exit 1
    fi
done

echo "→ Starting n8n via Docker Compose..."
docker compose up -d

echo ""
echo "✅ n8n is running at: ${WEBHOOK_URL}"
echo "   Dashboard: http://$(hostname -I | awk '{print $1}'):5678"

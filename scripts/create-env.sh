#!/usr/bin/env bash
# create-env.sh

# === Edit these hardcoded values before running ===
SPRING_DATASOURCE_URL="jdbc:postgresql://aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&preferQueryMode=simple&prepareThreshold=0"
SPRING_DATASOURCE_USERNAME="postgres.pylhwbcmavnjfczwribo"
SPRING_DATASOURCE_PASSWORD="ESgrupo204-"

DB_HOST="aws-1-us-east-2.pooler.supabase.com"
DB_PORT="6543"
DB_NAME="postgres"
DB_USER="postgres.pylhwbcmavnjfczwribo"
DB_PASS="ESgrupo204-"

SUPABASE_URL=https://pylhwbcmavnjfczwribo.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5bGh3YmNtYXZuamZjendyaWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTgwODkzNiwiZXhwIjoyMDc1Mzg0OTM2fQ.JYy4I0c_cZLlS2bRGnPDHXDuSh9R9rkwIZZGQiw97oY

# ================================================

## Determine backend directory and target .env path
# This script is in scripts/, so repo root is one level up, and slms-backend is at ../slms-backend
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/../slms-backend"

if [ ! -d "$BACKEND_DIR" ]; then
  echo "Error: slms-backend directory not found at $BACKEND_DIR" >&2
  exit 1
fi

BACKEND_DIR="$(cd "$BACKEND_DIR" && pwd)"
ENV_PATH="$BACKEND_DIR/.env"
echo "Creating .env at: $ENV_PATH"
cat > "$ENV_PATH" <<EOF
SPRING_DATASOURCE_URL=$SPRING_DATASOURCE_URL
SPRING_DATASOURCE_USERNAME=$SPRING_DATASOURCE_USERNAME
SPRING_DATASOURCE_PASSWORD=$SPRING_DATASOURCE_PASSWORD

DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASS=$DB_PASS
EOF


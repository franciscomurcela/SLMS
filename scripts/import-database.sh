#!/bin/bash
# ============================================
# SLMS Database Import Script
# ============================================
set -e

# Configuration
DUMP_FILE="${1:-../migrations/slms_db_backup_latest.sql}"
CONTAINER_NAME="${2:-slms-db}"
DB_USER="${3:-slms_user}"
DB_NAME="${4:-slms_db}"

# Check if dump file exists
if [ ! -f "$DUMP_FILE" ]; then
    echo "ERROR: Dump file not found: $DUMP_FILE"
    echo "Usage: ./import-database.sh <dump_file.sql> [container] [user] [database]"
    exit 1
fi

# Check if container is running
if ! docker ps --filter "name=$CONTAINER_NAME" --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo "ERROR: Container '$CONTAINER_NAME' is not running!"
    echo "Start it with: docker compose up -d"
    exit 1
fi

# Execute import
echo "Importing $DUMP_FILE to $CONTAINER_NAME/$DB_NAME..."
docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$DUMP_FILE"

# Success
TABLE_COUNT=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';")
echo "✓ Import completed: $TABLE_COUNT tables in database"

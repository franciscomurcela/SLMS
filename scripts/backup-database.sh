#!/bin/bash
# ============================================
# SLMS Database Backup Script
# ============================================
set -e

# Configuration
CONTAINER_NAME="${1:-slms-db}"
DB_USER="${2:-slms_user}"
DB_NAME="${3:-slms_db}"
OUTPUT_DIR="slms-backend/config/migrations"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="$OUTPUT_DIR/slms_db_backup_$TIMESTAMP.sql"

# Check if container is running
if ! docker ps --filter "name=$CONTAINER_NAME" --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo "ERROR: Container '$CONTAINER_NAME' is not running!"
    echo "Start it with: docker compose up -d"
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Execute pg_dump
echo "Creating backup from $CONTAINER_NAME/$DB_NAME..."
docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists --column-inserts > "$OUTPUT_FILE"

# Verify backup was created
if [ ! -f "$OUTPUT_FILE" ] || [ ! -s "$OUTPUT_FILE" ]; then
    echo "ERROR: Backup file was not created or is empty!"
    exit 1
fi

# Success
FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
echo "✓ Backup created: $OUTPUT_FILE ($FILE_SIZE)"
echo "To restore: docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME < $OUTPUT_FILE"

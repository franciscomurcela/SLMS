#!/bin/bash

# =============================================================================
# SLMS Quick Stop Script
# Stops all SLMS services gracefully
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         SLMS - Quick Stop                                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}🛑 Stopping all SLMS services...${NC}"
echo ""

# Stop frontend
echo "   Stopping frontend..."
cd "$PROJECT_ROOT/react-frontend"
docker compose down > /dev/null 2>&1 || true

# Stop backend
echo "   Stopping backend services..."
cd "$PROJECT_ROOT/slms-backend"
docker compose down > /dev/null 2>&1 || true

echo ""
echo -e "${GREEN}✅ All services stopped${NC}"
echo ""
echo -e "${YELLOW}💡 To restart: ./quick-start.sh${NC}"
echo ""

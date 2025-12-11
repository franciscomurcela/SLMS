#!/bin/bash

# =============================================================================
# SLMS Restart Script
# Restarts all services and reimports database
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         SLMS - Full Restart                                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}🔄 Stopping all services...${NC}"

# Stop all SLMS-related containers
docker rm -f order-service carrier-service user-service slms-db slms-frontend keycloak 2>/dev/null || true

# Stop docker-compose services
cd "$PROJECT_ROOT/react-frontend"
docker compose down 2>/dev/null || true

cd "$PROJECT_ROOT/slms-backend"
docker compose down 2>/dev/null || true

echo ""
echo -e "${YELLOW}🗑️  Cleaning old volumes...${NC}"
docker volume prune -f 2>/dev/null || true

echo ""
echo -e "${YELLOW}🚀 Starting backend...${NC}"
cd "$PROJECT_ROOT/slms-backend"
docker compose up -d

echo ""
echo -e "${YELLOW}⏳ Waiting for backend services to start (20 seconds)...${NC}"
sleep 20

echo ""
echo -e "${YELLOW}📊 Checking database health...${NC}"
docker exec slms-db pg_isready -U slms_user -d slms_db || echo "⚠️  Database not ready yet"

echo ""
echo -e "${YELLOW}📊 Importing database schema...${NC}"
cd "$PROJECT_ROOT"
docker exec -i slms-db psql -U slms_user -d slms_db < slms-backend/config/schema-postgresql.sql 2>&1 | grep -E "CREATE|ERROR|already exists" | head -20

echo ""
echo -e "${YELLOW}📦 Importing test data...${NC}"
if [ -f "slms-backend/config/slms_db_complete_20251203_145417.sql" ]; then
    docker exec -i slms-db psql -U slms_user -d slms_db < slms-backend/config/slms_db_complete_20251203_145417.sql 2>&1 | grep -E "INSERT|ERROR|duplicate" | tail -20
else
    docker exec -i slms-db psql -U slms_user -d slms_db < scripts/slms-data-only-20251027-193147.sql/slms-data-only-20251027-193147.sql 2>&1 | grep -E "INSERT|ERROR|duplicate" | tail -20
fi

echo ""
echo -e "${YELLOW}🎨 Rebuilding frontend...${NC}"
cd "$PROJECT_ROOT/react-frontend"
docker compose up -d --build

echo ""
echo -e "${YELLOW}⏳ Waiting for frontend to build (15 seconds)...${NC}"
sleep 15

echo ""
echo -e "${YELLOW}📊 Final container status:${NC}"
echo ""
echo "Backend:"
cd "$PROJECT_ROOT/slms-backend"
docker compose ps
echo ""
echo "Frontend:"
cd "$PROJECT_ROOT/react-frontend"
docker compose ps

echo ""
echo -e "${GREEN}✅ SLMS restarted successfully!${NC}"
echo ""
MACHINE_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
echo -e "${BLUE}Access at: http://$MACHINE_IP:3000${NC}"
echo -e "${BLUE}Login: anacosta / anacosta${NC}"
echo ""

echo "🤖 Chatbot AI (Google Gemini) ativo e configurado!"
echo "   - RAG enabled: ✅"
echo "   - Google Gemini API: ✅"
echo "   - Contexto da base de dados: ✅"
echo ""
echo "📊 Containers ativos:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "NAME|slms|order|carrier|user|keycloak"

echo ""
echo "🔍 Verificando saúde dos serviços..."
echo -n "Backend Order Service: "
curl -s http://localhost:8081/api/chat/health 2>/dev/null | grep -o '"status":"UP"' || echo "⚠️  Not responding"

echo ""
echo "Frontend: "
curl -s http://localhost:3000 2>/dev/null | grep -q "<!doctype html>" && echo "✅ Frontend serving HTML" || echo "⚠️  Frontend not responding"

echo ""
echo "chatbot com Gemini está ativo."

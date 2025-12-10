#!/bin/bash

# =============================================================================
# SLMS Quick Start Script
# Configures and starts the entire SLMS system with one command
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         SLMS - Quick Start Setup                           ║${NC}"
echo -e "${BLUE}║    Shipping & Logistics Management System                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# =============================================================================
# STEP 0: Pre-flight Checks
# =============================================================================
echo -e "${YELLOW}📋 Step 0/6: Pre-flight checks...${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed!${NC}"
    echo "   Please install Docker first: https://docs.docker.com/engine/install/"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker daemon is not running!${NC}"
    echo "   Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not available!${NC}"
    echo "   Please install Docker Compose plugin."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed!${NC}"
    echo "   Please install Node.js 20.x: https://nodejs.org/"
    exit 1
fi

# Check Node version (should be 18+)
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version is too old (v$NODE_VERSION)${NC}"
    echo "   Please install Node.js 18.x or higher"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met!${NC}"
echo "   - Docker: $(docker --version)"
echo "   - Docker Compose: $(docker compose version)"
echo "   - Node.js: $(node --version)"
echo "   - npm: $(npm --version)"
echo ""

# =============================================================================
# STEP 1: Create Environment Variables
# =============================================================================
echo -e "${YELLOW}📝 Step 1/6: Creating environment files...${NC}"

# Development API Keys (Academic Project - Safe to commit)
# These are test keys for academic/development purposes only
GEMINI_API_KEY_DEV="AIzaSyAGZEBK5Lthm2Qgashe5WkYjEqD5ezaTF0"
FLAGSMITH_KEY_DEV="ser.kB7GgG6NJjE5a5FkZEqbMa"
GOOGLE_MAPS_KEY_DEV="AIzaSyCG_JDgiiP-R90J5ro08ndAnaxLz0804WA"

# Create backend .env if it doesn't exist
if [ ! -f "$PROJECT_ROOT/slms-backend/.env" ]; then
    cat > "$PROJECT_ROOT/slms-backend/.env" << EOF
# PostgreSQL Configuration
POSTGRES_DB=slms_db
POSTGRES_USER=slms_user
POSTGRES_PASSWORD=slms_password
POSTGRES_HOST=slms-db
POSTGRES_PORT=5432

# Spring Datasource
SPRING_DATASOURCE_URL=jdbc:postgresql://slms-db:5432/slms_db
SPRING_DATASOURCE_USERNAME=slms_user
SPRING_DATASOURCE_PASSWORD=slms_password

# Keycloak Database
KEYCLOAK_DB_URL=jdbc:postgresql://keycloak-db:5432/keycloak
KEYCLOAK_DB_USERNAME=keycloak
KEYCLOAK_DB_PASSWORD=keycloak

# Gemini AI (Development Key - Academic Project)
GEMINI_API_KEY=$GEMINI_API_KEY_DEV
EOF
    echo -e "${GREEN}✅ Created slms-backend/.env (with Gemini API key)${NC}"
else
    echo -e "${BLUE}ℹ️  slms-backend/.env already exists${NC}"
fi

# Create frontend .env if it doesn't exist
if [ ! -f "$PROJECT_ROOT/react-frontend/frontend/.env" ]; then
    cat > "$PROJECT_ROOT/react-frontend/frontend/.env" << EOF
# Flagsmith Configuration (Development Key)
VITE_FLAGSMITH_ENVIRONMENT_KEY=$FLAGSMITH_KEY_DEV

# Google Maps Configuration
VITE_GOOGLE_MAPS_API_KEY=$GOOGLE_MAPS_KEY_DEV
EOF
    echo -e "${GREEN}✅ Created react-frontend/frontend/.env (with all API keys)${NC}"
else
    echo -e "${BLUE}ℹ️  react-frontend/frontend/.env already exists${NC}"
fi

echo ""

# =============================================================================
# STEP 2: Create Docker Network
# =============================================================================
echo -e "${YELLOW}🌐 Step 2/6: Creating Docker network...${NC}"

if ! docker network inspect rede-obs &> /dev/null; then
    docker network create rede-obs
    echo -e "${GREEN}✅ Created 'rede-obs' network${NC}"
else
    echo -e "${BLUE}ℹ️  Network 'rede-obs' already exists${NC}"
fi

echo ""

# =============================================================================
# STEP 3: Start Backend Services
# =============================================================================
echo -e "${YELLOW}🐳 Step 3/6: Starting backend services...${NC}"

cd "$PROJECT_ROOT/slms-backend"
docker compose up -d --build

echo -e "${GREEN}✅ Backend services started${NC}"
echo ""

# Wait for services to initialize
echo -e "${YELLOW}⏳ Waiting for services to initialize (30 seconds)...${NC}"
sleep 30

# Check database health
echo -e "${YELLOW}🔍 Checking database health...${NC}"
for i in {1..15}; do
    if docker exec slms-db pg_isready -U slms_user -d slms_db > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Database is ready${NC}"
        break
    fi
    if [ $i -eq 15 ]; then
        echo -e "${RED}⚠️  Database took longer than expected to start${NC}"
        echo "   Continuing anyway..."
    fi
    sleep 2
done

echo ""

# =============================================================================
# STEP 4: Initialize Database
# =============================================================================
echo -e "${YELLOW}💾 Step 4/6: Initializing database...${NC}"

cd "$PROJECT_ROOT"

# Import complete database backup (schema + data)
DB_BACKUP="migrations/slms_db_backup_20251203_171050.sql"

if [ -f "$DB_BACKUP" ]; then
    echo "   Importing database (schema + data)..."
    docker exec -i slms-db psql -U slms_user -d slms_db < "$DB_BACKUP" > /dev/null 2>&1 || echo "   (Database may already exist)"
    
    # Verify database has data
    USER_COUNT=$(docker exec slms-db psql -U slms_user -d slms_db -t -c "SELECT COUNT(*) FROM \"Users\";" 2>/dev/null | tr -d ' ' || echo "0")
    if [ "$USER_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ Database initialized ($USER_COUNT users found)${NC}"
    else
        echo -e "${YELLOW}⚠️  Database import completed but no users found${NC}"
    fi
else
    echo -e "${RED}❌ Database backup not found: $DB_BACKUP${NC}"
    echo "   Database will be empty - application may not work correctly"
fi

echo ""

# =============================================================================
# STEP 5: Install Frontend Dependencies and Start Frontend
# =============================================================================
echo -e "${YELLOW}📦 Step 5/6: Setting up frontend...${NC}"

cd "$PROJECT_ROOT/react-frontend/frontend"

# Install npm dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "   Installing npm packages (this may take a few minutes)..."
    npm install --silent > /dev/null 2>&1
    echo -e "${GREEN}✅ npm packages installed${NC}"
else
    echo -e "${BLUE}ℹ️  node_modules already exists, skipping npm install${NC}"
fi

# Start frontend container
cd "$PROJECT_ROOT/react-frontend"
docker compose up -d --build

echo -e "${GREEN}✅ Frontend service started${NC}"
echo ""

echo -e "${YELLOW}⏳ Waiting for frontend to build (20 seconds)...${NC}"
sleep 20

echo ""

# =============================================================================
# STEP 6: Display Status and Access Information
# =============================================================================
echo -e "${YELLOW}📊 Step 6/6: Checking service status...${NC}"
echo ""

echo "Backend services:"
cd "$PROJECT_ROOT/slms-backend"
docker compose ps

echo ""
echo "Frontend service:"
cd "$PROJECT_ROOT/react-frontend"
docker compose ps

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║  ${GREEN}✅ SLMS System Started Successfully!${BLUE}                  ║${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get machine IP
MACHINE_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")

echo -e "${GREEN}🌐 Access the application:${NC}"
echo ""
echo "   Frontend (Main App):   http://$MACHINE_IP:3000"
echo "   Keycloak Admin:        http://$MACHINE_IP:8083/auth/admin"
echo "                          (Username: admin, Password: admin)"
echo ""

echo -e "${GREEN}🔌 Backend Services:${NC}"
echo ""
echo "   User Service:          http://$MACHINE_IP:8082"
echo "   Order Service:         http://$MACHINE_IP:8081"
echo "   Carrier Service:       http://$MACHINE_IP:8080"
echo ""

echo -e "${GREEN}👤 Test Users (Username / Password):${NC}"
echo ""
echo "   Customer:              anacosta / anacosta"
echo "   Driver:                marionunes / marionunes"
echo "   Warehouse Staff:       ricardocastro / ricardocastro"
echo "   Logistics Manager:     fabiofigueiredo / fabiofigueiredo"
echo ""

echo -e "${GREEN}🔍 Test Tracking ID:${NC}"
echo ""
echo "   d0d1fdf3-5e2f-420f-87ac-0396833b0aca"
echo ""

echo -e "${YELLOW}💡 Useful Commands:${NC}"
echo ""
echo "   Stop all services:     ./quick-stop.sh"
echo "   Restart services:      ./restart.sh"
echo "   View logs:             docker logs <container-name>"
echo ""

echo -e "${YELLOW}📖 For detailed information, see CLEAN_SERVER_SETUP.md${NC}"
echo ""

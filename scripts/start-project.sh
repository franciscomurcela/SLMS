#!/usr/bin/env bash#!/usr/bin/env bash

# start-project.sh - Starts the entire SLMS project with local PostgreSQL# start-project.sh - Starts the entire SLMS project



set -e  # Exit on errorset -e  # Exit on error



SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

BACKEND_DIR="$PROJECT_ROOT/slms-backend"BACKEND_DIR="$PROJECT_ROOT/slms-backend"

FRONTEND_DOCKER_DIR="$PROJECT_ROOT/react-frontend"FRONTEND_DIR="$PROJECT_ROOT/react-frontend/frontend"

FRONTEND_DOCKER_DIR="$PROJECT_ROOT/react-frontend"

echo "🚀 Starting SLMS Project (Local PostgreSQL)..."

echo "=============================================="echo "🚀 Starting SLMS Project..."

echo "================================"

# Step 1: Create .env file with local PostgreSQL configuration

echo ""# Step 1: Create .env file

echo "📝 Step 1: Creating .env file..."echo ""

bash "$SCRIPT_DIR/create-env.sh"echo "📝 Step 1: Creating .env file..."

bash "$SCRIPT_DIR/create-env.sh"

# Step 2: Start Backend Docker containers (databases + services)

echo ""# Step 2: Start Docker containers

echo "🐳 Step 2: Starting Backend services..."echo ""

cd "$BACKEND_DIR"echo "🐳 Step 2: Starting Backend Docker containers..."

docker compose up -dcd "$BACKEND_DIR"

docker compose --env-file .env up -d

echo ""

echo "⏳ Waiting for services to initialize..."echo ""

echo "   - PostgreSQL databases starting..."echo "⏳ Waiting for backend services to start (15 seconds)..."

sleep 5sleep 15



# Check database health# Step 3: Start Frontend Docker container

echo "   - Checking database health..."echo ""

for i in {1..12}; doecho "🎨 Step 3: Starting Frontend Docker container..."

    if docker exec slms-db pg_isready -U slms_user -d slms_db > /dev/null 2>&1; thencd "$FRONTEND_DOCKER_DIR"

        echo "   ✅ slms-db is ready"docker compose up -d --build

        break

    fiecho ""

    if [ $i -eq 12 ]; thenecho "⏳ Waiting for frontend to build and start (10 seconds)..."

        echo "   ⚠️  slms-db took longer than expected to start"sleep 10

    fi

    sleep 2# Step 4: Check Docker status

doneecho ""

echo "📊 Docker container status:"

sleep 5echo ""

echo "   - Backend services initializing..."echo "Backend services:"

sleep 10cd "$BACKEND_DIR"

docker compose ps

# Step 3: Start Frontend Docker containerecho ""

echo ""echo "Frontend service:"

echo "🎨 Step 3: Starting Frontend..."cd "$FRONTEND_DOCKER_DIR"

cd "$FRONTEND_DOCKER_DIR"docker compose ps

docker compose up -d

# Step 4: Install frontend dependencies (if needed)

echo ""echo ""

echo "⏳ Waiting for frontend to start..."echo "📦 Step 5: Checking frontend dependencies..."

sleep 8cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then

# Step 4: Check Docker status    echo "Installing npm packages..."

echo ""    npm install

echo "📊 Container Status:"else

echo ""    echo "✅ node_modules already exists"

echo "Backend:"fi

cd "$BACKEND_DIR"

docker compose ps# Step 5: Final instructions

echo ""

echo ""echo "================================"

echo "Frontend:"echo "✅ SLMS Project started successfully!"

cd "$FRONTEND_DOCKER_DIR"echo ""

docker compose psecho "🌐 Backend Services:"

echo "  - Keycloak:        http://localhost:8083"

# Step 5: Database infoecho "  - User Service:    http://localhost:8082"

echo ""echo "  - Order Service:   http://localhost:8081"

echo "📊 Database Information:"echo "  - Carrier Service: http://localhost:8080"

echo "   - slms-db (main):     PostgreSQL 15-alpine on port 5432"echo ""

echo "   - keycloak-db:        PostgreSQL 15 on port 5433"echo "🎨 Frontend Service:"

echo "   - Tables imported:    Users, Orders, Shipments, Driver, Carrier, etc."echo "  - Production Build: http://localhost:3000"

echo "  - (Accessible via university network/VPN)"

# Step 6: Final instructionsecho ""

echo ""echo "� Next steps:"

echo "=============================================="echo "  1. Configure Keycloak: http://localhost:8083/admin (admin/admin)"

echo "✅ SLMS Project Started Successfully!"echo "  2. Access frontend: http://<machine-ip>:3000"

echo ""echo ""

echo "🌐 Services:"echo "💡 Tip: Get machine IP with: hostname -I | awk '{print \$1}'"

echo "  - Frontend:        http://localhost:3000"echo ""

echo "  - Keycloak:        http://localhost:8083"echo "🛑 To stop all services, run:"

echo "  - User Service:    http://localhost:8082"echo "   cd $BACKEND_DIR && docker compose down"

echo "  - Order Service:   http://localhost:8081"echo "   cd $FRONTEND_DOCKER_DIR && docker compose down"

echo "  - Carrier Service: http://localhost:8080"echo ""

echo ""
echo "🗄️  Databases:"
echo "  - slms-db:         localhost:5432 (slms_user/slms_password/slms_db)"
echo "  - keycloak-db:     localhost:5433 (keycloak/keycloak/keycloak)"
echo ""
echo "👤 Test Users (Username / Password / Role):"
echo "  - ricardocastro  / 12345678 / Warehouse_Staff"
echo "  - marionunes     / 12345678 / Driver"
echo "  - lucaspereira   / 12345678 / Driver"
echo ""
echo "🔧 Admin Access:"
echo "  - Keycloak Admin:  http://localhost:8083/admin (admin/admin)"
echo ""
echo "💡 Remote Access:"
echo "  - Get server IP: hostname -I | awk '{print \$1}'"
echo "  - Access via:    http://<server-ip>:3000"
echo "  - Note: Chrome flags needed for HTTP Keycloak (see README.md)"
echo ""
echo "🛑 To stop all services:"
echo "   cd $BACKEND_DIR && docker compose down"
echo "   cd $FRONTEND_DOCKER_DIR && docker compose down"
echo ""
echo "📖 For troubleshooting, see README.md"
echo ""

#!/usr/bin/env bash
# start-project.sh - Starts the entire SLMS project

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/slms-backend"
FRONTEND_DIR="$PROJECT_ROOT/react-frontend/frontend"
FRONTEND_DOCKER_DIR="$PROJECT_ROOT/react-frontend"

echo "🚀 Starting SLMS Project..."
echo "================================"

# Step 1: Create .env file
echo ""
echo "📝 Step 1: Creating .env file..."
bash "$SCRIPT_DIR/create-env.sh"

# Step 2: Start Docker containers
echo ""
echo "🐳 Step 2: Starting Backend Docker containers..."
cd "$BACKEND_DIR"
docker compose --env-file .env up -d

echo ""
echo "⏳ Waiting for backend services to start (15 seconds)..."
sleep 15

# Step 3: Start Frontend Docker container
echo ""
echo "🎨 Step 3: Starting Frontend Docker container..."
cd "$FRONTEND_DOCKER_DIR"
docker compose up -d --build

echo ""
echo "⏳ Waiting for frontend to build and start (10 seconds)..."
sleep 10

# Step 4: Check Docker status
echo ""
echo "📊 Docker container status:"
echo ""
echo "Backend services:"
cd "$BACKEND_DIR"
docker compose ps
echo ""
echo "Frontend service:"
cd "$FRONTEND_DOCKER_DIR"
docker compose ps

# Step 4: Install frontend dependencies (if needed)
echo ""
echo "📦 Step 5: Checking frontend dependencies..."
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    echo "Installing npm packages..."
    npm install
else
    echo "✅ node_modules already exists"
fi

# Step 5: Final instructions
echo ""
echo "================================"
echo "✅ SLMS Project started successfully!"
echo ""
echo "🌐 Backend Services:"
echo "  - Keycloak:        http://localhost:8083"
echo "  - User Service:    http://localhost:8082"
echo "  - Order Service:   http://localhost:8081"
echo "  - Carrier Service: http://localhost:8080"
echo ""
echo "🎨 Frontend Service:"
echo "  - Production Build: http://localhost:3000"
echo "  - (Accessible via university network/VPN)"
echo ""
echo "� Next steps:"
echo "  1. Configure Keycloak: http://localhost:8083/admin (admin/admin)"
echo "  2. Access frontend: http://<machine-ip>:3000"
echo ""
echo "💡 Tip: Get machine IP with: hostname -I | awk '{print \$1}'"
echo ""
echo "🛑 To stop all services, run:"
echo "   cd $BACKEND_DIR && docker compose down"
echo "   cd $FRONTEND_DOCKER_DIR && docker compose down"
echo ""

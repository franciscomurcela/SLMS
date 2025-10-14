#!/usr/bin/env bash
# start-project.sh - Starts the entire SLMS project

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/slms-backend"
FRONTEND_DIR="$PROJECT_ROOT/react-frontend/frontend"

echo "🚀 Starting SLMS Project..."
echo "================================"

# Step 1: Create .env file
echo ""
echo "📝 Step 1: Creating .env file..."
bash "$SCRIPT_DIR/create-env.sh"

# Step 2: Start Docker containers
echo ""
echo "🐳 Step 2: Starting Docker containers..."
cd "$BACKEND_DIR"
docker compose --env-file .env up -d

echo ""
echo "⏳ Waiting for services to start (15 seconds)..."
sleep 15

# Step 3: Check Docker status
echo ""
echo "📊 Docker container status:"
docker compose ps

# Step 4: Install frontend dependencies (if needed)
echo ""
echo "📦 Step 3: Checking frontend dependencies..."
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    echo "Installing npm packages..."
    npm install
else
    echo "✅ node_modules already exists"
fi

# Step 5: Instructions to start frontend
echo ""
echo "================================"
echo "✅ Backend started successfully!"
echo ""
echo "🌐 Services:"
echo "  - Keycloak:        http://localhost:8083"
echo "  - User Service:    http://localhost:8082"
echo "  - Carrier Service: http://localhost:8080"
echo ""
echo "📋 Next steps:"
echo "  1. Configure Keycloak (see SETUP.md section 1.3)"
echo "  2. Start frontend:"
echo "     cd react-frontend/frontend"
echo "     npm run dev"
echo ""
echo "🔑 Keycloak admin: http://localhost:8083/admin (admin/admin)"
echo ""

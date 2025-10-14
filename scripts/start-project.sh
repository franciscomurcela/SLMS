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
echo "  - Order Service:   http://localhost:8081"
echo "  - Carrier Service: http://localhost:8080"
echo ""
echo "📋 Next step: Configure Keycloak (see SETUP.md section 1.3)"
echo ""
echo "🔑 Keycloak admin: http://localhost:8083/admin (admin/admin)"
echo ""
echo "🚀 Starting frontend in new terminal..."
sleep 2

# Start frontend in new terminal (works on Linux/Mac)
if command -v gnome-terminal &> /dev/null; then
    gnome-terminal -- bash -c "cd '$FRONTEND_DIR' && echo '🌐 Starting frontend...' && npm run dev; exec bash"
elif command -v xterm &> /dev/null; then
    xterm -e "cd '$FRONTEND_DIR' && echo '🌐 Starting frontend...' && npm run dev; bash" &
elif [[ "$OSTYPE" == "darwin"* ]]; then
    osascript -e "tell application \"Terminal\" to do script \"cd '$FRONTEND_DIR' && echo '🌐 Starting frontend...' && npm run dev\""
else
    echo "⚠️  Could not detect terminal. Start frontend manually:"
    echo "   cd react-frontend/frontend"
    echo "   npm run dev"
fi

echo ""
echo "✅ Setup complete!"
echo "📱 Frontend will be available at: http://localhost:5173"
echo ""

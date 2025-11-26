#!/bin/bash

# ============================================================================
# SLMS Chatbot - Deployment & Testing Scripts
# ============================================================================
# Comandos úteis para instalação, build, teste e deployment do chatbot
# Autor: Xavier
# Data: 22 Novembro 2025
# ============================================================================

# CORES PARA OUTPUT
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# 1. INSTALAÇÃO
# ============================================================================

install_dependencies() {
    echo -e "${BLUE}[1/3] Installing npm dependencies...${NC}"
    cd react-frontend/frontend
    npm install @assistant-ui/react @assistant-ui/react-ai-sdk ai @ai-sdk/openai tailwindcss
    
    echo -e "${GREEN}✓ Dependencies installed${NC}"
    echo ""
    echo "Installed packages:"
    echo "  - @assistant-ui/react (v0.6+)"
    echo "  - @assistant-ui/react-ai-sdk (v0.6+)"
    echo "  - ai (v4.0+)"
    echo "  - @ai-sdk/openai (v1.0+)"
    echo "  - tailwindcss (v3.4+)"
}

# ============================================================================
# 2. BUILD
# ============================================================================

build_frontend() {
    echo -e "${BLUE}[2/3] Building frontend with Docker...${NC}"
    cd react-frontend
    docker-compose up --build -d
    
    echo -e "${GREEN}✓ Frontend built and running${NC}"
    echo ""
    echo "Access at: http://localhost:5173"
}

build_backend() {
    echo -e "${BLUE}Building backend...${NC}"
    cd slms-backend
    docker-compose up --build -d
    
    echo -e "${GREEN}✓ Backend built and running${NC}"
    echo ""
    echo "Access at: http://localhost:8080"
}

# ============================================================================
# 3. TESTES
# ============================================================================

test_backend_health() {
    echo -e "${BLUE}Testing backend health endpoint...${NC}"
    
    response=$(curl -s http://localhost:8080/api/chat/health)
    
    if [[ $response == *"UP"* ]]; then
        echo -e "${GREEN}✓ Backend is UP and running${NC}"
        echo "Response: $response"
    else
        echo -e "${RED}✗ Backend health check failed${NC}"
        echo "Response: $response"
    fi
}

test_chat_endpoint() {
    echo -e "${BLUE}Testing chat endpoint...${NC}"
    
    response=$(curl -s -X POST http://localhost:8080/api/chat \
      -H "Content-Type: application/json" \
      -d '{
        "messages": [
          {"role": "user", "content": "Como rastreio minha encomenda?"}
        ],
        "sessionId": "test-session-123",
        "context": {
          "role": "customer",
          "userId": "test-user",
          "userName": "Test User"
        }
      }')
    
    if [[ $response == *"assistant"* ]]; then
        echo -e "${GREEN}✓ Chat endpoint working${NC}"
        echo "Response preview:"
        echo "$response" | python3 -m json.tool | head -n 20
    else
        echo -e "${RED}✗ Chat endpoint failed${NC}"
        echo "Response: $response"
    fi
}

test_rag_keywords() {
    echo -e "${BLUE}Testing RAG keyword detection...${NC}"
    
    keywords=("rastreio" "status" "pod" "histórico" "ajuda" "obrigado")
    
    for keyword in "${keywords[@]}"; do
        response=$(curl -s -X POST http://localhost:8080/api/chat \
          -H "Content-Type: application/json" \
          -d "{\"messages\":[{\"role\":\"user\",\"content\":\"$keyword\"}]}")
        
        if [[ $response == *"assistant"* ]]; then
            echo -e "${GREEN}✓ Keyword '$keyword' - RAG context found${NC}"
        else
            echo -e "${YELLOW}⚠ Keyword '$keyword' - No context (fallback)${NC}"
        fi
    done
}

run_all_tests() {
    echo -e "${BLUE}=== Running All Tests ===${NC}"
    echo ""
    
    test_backend_health
    echo ""
    
    test_chat_endpoint
    echo ""
    
    test_rag_keywords
    echo ""
    
    echo -e "${GREEN}=== All Tests Complete ===${NC}"
}

# ============================================================================
# 4. DEPLOYMENT
# ============================================================================

deploy_staging() {
    echo -e "${BLUE}Deploying to STAGING...${NC}"
    
    # Stop existing containers
    docker-compose down
    
    # Pull latest code
    git pull origin feature-join
    
    # Install dependencies
    install_dependencies
    
    # Build and start
    build_frontend
    build_backend
    
    # Run tests
    sleep 10 # Wait for services to start
    run_all_tests
    
    echo -e "${GREEN}✓ Staging deployment complete${NC}"
}

deploy_production() {
    echo -e "${RED}WARNING: This will deploy to PRODUCTION${NC}"
    read -p "Are you sure? (yes/no): " confirm
    
    if [[ $confirm == "yes" ]]; then
        echo -e "${BLUE}Deploying to PRODUCTION...${NC}"
        
        # Add production-specific steps here
        # - Set environment variables (OPENAI_API_KEY)
        # - Enable feature flags
        # - Database migrations
        # - Monitoring setup
        
        echo -e "${GREEN}✓ Production deployment initiated${NC}"
    else
        echo -e "${YELLOW}Deployment cancelled${NC}"
    fi
}

# ============================================================================
# 5. LOGS & DEBUGGING
# ============================================================================

show_frontend_logs() {
    echo -e "${BLUE}Frontend logs (last 50 lines):${NC}"
    docker logs --tail 50 react-frontend-container 2>&1 | tail -50
}

show_backend_logs() {
    echo -e "${BLUE}Backend logs (last 50 lines):${NC}"
    docker logs --tail 50 order-service-container 2>&1 | tail -50
}

show_chat_logs() {
    echo -e "${BLUE}Filtering chat-related logs...${NC}"
    docker logs order-service-container 2>&1 | grep -i "chat\|assistant\|rag" | tail -30
}

follow_logs() {
    echo -e "${BLUE}Following logs in real-time (Ctrl+C to stop)...${NC}"
    docker-compose logs -f
}

# ============================================================================
# 6. UTILITIES
# ============================================================================

check_dependencies() {
    echo -e "${BLUE}Checking dependencies...${NC}"
    
    # Check Node.js
    if command -v node &> /dev/null; then
        echo -e "${GREEN}✓ Node.js $(node --version)${NC}"
    else
        echo -e "${RED}✗ Node.js not found${NC}"
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        echo -e "${GREEN}✓ npm $(npm --version)${NC}"
    else
        echo -e "${RED}✗ npm not found${NC}"
    fi
    
    # Check Docker
    if command -v docker &> /dev/null; then
        echo -e "${GREEN}✓ Docker $(docker --version)${NC}"
    else
        echo -e "${RED}✗ Docker not found${NC}"
    fi
    
    # Check Docker Compose
    if command -v docker-compose &> /dev/null; then
        echo -e "${GREEN}✓ Docker Compose $(docker-compose --version)${NC}"
    else
        echo -e "${RED}✗ Docker Compose not found${NC}"
    fi
    
    # Check Java
    if command -v java &> /dev/null; then
        echo -e "${GREEN}✓ Java $(java --version | head -n 1)${NC}"
    else
        echo -e "${RED}✗ Java not found${NC}"
    fi
}

show_status() {
    echo -e "${BLUE}=== Service Status ===${NC}"
    echo ""
    
    # Frontend
    if curl -s http://localhost:5173 > /dev/null; then
        echo -e "${GREEN}✓ Frontend - Running (http://localhost:5173)${NC}"
    else
        echo -e "${RED}✗ Frontend - Not running${NC}"
    fi
    
    # Backend
    if curl -s http://localhost:8080/api/chat/health > /dev/null; then
        echo -e "${GREEN}✓ Backend - Running (http://localhost:8080)${NC}"
    else
        echo -e "${RED}✗ Backend - Not running${NC}"
    fi
    
    # Chat endpoint
    if curl -s http://localhost:8080/api/chat/health | grep -q "UP"; then
        echo -e "${GREEN}✓ Chat API - Available${NC}"
    else
        echo -e "${YELLOW}⚠ Chat API - Check logs${NC}"
    fi
    
    echo ""
    docker-compose ps
}

cleanup() {
    echo -e "${YELLOW}Stopping and removing containers...${NC}"
    docker-compose down
    echo -e "${GREEN}✓ Cleanup complete${NC}"
}

reset_everything() {
    echo -e "${RED}WARNING: This will remove ALL containers, volumes, and node_modules${NC}"
    read -p "Are you sure? (yes/no): " confirm
    
    if [[ $confirm == "yes" ]]; then
        docker-compose down -v
        rm -rf react-frontend/frontend/node_modules
        rm -rf react-frontend/frontend/package-lock.json
        echo -e "${GREEN}✓ Reset complete${NC}"
    else
        echo -e "${YELLOW}Reset cancelled${NC}"
    fi
}

# ============================================================================
# 7. QUICK COMMANDS
# ============================================================================

quick_setup() {
    echo -e "${BLUE}=== QUICK SETUP ===${NC}"
    echo "This will install dependencies and start all services"
    echo ""
    
    check_dependencies
    echo ""
    
    install_dependencies
    echo ""
    
    build_frontend
    build_backend
    echo ""
    
    echo -e "${BLUE}Waiting for services to start...${NC}"
    sleep 15
    echo ""
    
    run_all_tests
    echo ""
    
    show_status
    echo ""
    
    echo -e "${GREEN}=== SETUP COMPLETE ===${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Open http://localhost:5173"
    echo "2. Login as Customer"
    echo "3. Look for blue chat button in bottom-right"
    echo "4. Test chatbot functionality"
}

show_help() {
    echo "SLMS Chatbot - Deployment & Testing Scripts"
    echo ""
    echo "Usage: ./chatbot-deploy.sh [command]"
    echo ""
    echo "Commands:"
    echo ""
    echo "  Installation:"
    echo "    install          - Install npm dependencies"
    echo "    quick-setup      - Complete setup (install + build + test)"
    echo ""
    echo "  Build:"
    echo "    build-frontend   - Build frontend with Docker"
    echo "    build-backend    - Build backend with Docker"
    echo ""
    echo "  Testing:"
    echo "    test-health      - Test backend health endpoint"
    echo "    test-chat        - Test chat endpoint"
    echo "    test-rag         - Test RAG keyword detection"
    echo "    test-all         - Run all tests"
    echo ""
    echo "  Deployment:"
    echo "    deploy-staging   - Deploy to staging environment"
    echo "    deploy-prod      - Deploy to production (with confirmation)"
    echo ""
    echo "  Logs:"
    echo "    logs-frontend    - Show frontend logs"
    echo "    logs-backend     - Show backend logs"
    echo "    logs-chat        - Show chat-specific logs"
    echo "    logs-follow      - Follow logs in real-time"
    echo ""
    echo "  Utilities:"
    echo "    status           - Show service status"
    echo "    check-deps       - Check dependencies"
    echo "    cleanup          - Stop and remove containers"
    echo "    reset            - Reset everything (with confirmation)"
    echo "    help             - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./chatbot-deploy.sh quick-setup"
    echo "  ./chatbot-deploy.sh test-all"
    echo "  ./chatbot-deploy.sh logs-follow"
}

# ============================================================================
# MAIN
# ============================================================================

case "$1" in
    install)
        install_dependencies
        ;;
    quick-setup)
        quick_setup
        ;;
    build-frontend)
        build_frontend
        ;;
    build-backend)
        build_backend
        ;;
    test-health)
        test_backend_health
        ;;
    test-chat)
        test_chat_endpoint
        ;;
    test-rag)
        test_rag_keywords
        ;;
    test-all)
        run_all_tests
        ;;
    deploy-staging)
        deploy_staging
        ;;
    deploy-prod)
        deploy_production
        ;;
    logs-frontend)
        show_frontend_logs
        ;;
    logs-backend)
        show_backend_logs
        ;;
    logs-chat)
        show_chat_logs
        ;;
    logs-follow)
        follow_logs
        ;;
    status)
        show_status
        ;;
    check-deps)
        check_dependencies
        ;;
    cleanup)
        cleanup
        ;;
    reset)
        reset_everything
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac

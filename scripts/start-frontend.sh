#!/bin/bash
# Frontend Startup Script for Linux/macOS
# This script installs dependencies and starts the React development server

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  SLMS Frontend Startup Script${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Get the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/react-frontend/frontend"

# Check if Node.js is installed
echo -e "${YELLOW}[1/4] Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: Node.js is not installed or not in PATH${NC}"
    echo -e "${RED}Please install Node.js from https://nodejs.org/${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}Node.js version: $NODE_VERSION${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}ERROR: npm is not installed or not in PATH${NC}"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo -e "${GREEN}npm version: $NPM_VERSION${NC}"
echo ""

# Navigate to frontend directory
echo -e "${YELLOW}[2/4] Navigating to frontend directory...${NC}"
if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}ERROR: Frontend directory not found at $FRONTEND_DIR${NC}"
    exit 1
fi

cd "$FRONTEND_DIR"
echo -e "${GREEN}Current directory: $FRONTEND_DIR${NC}"
echo ""

# Check if node_modules exists
echo -e "${YELLOW}[3/4] Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}node_modules not found. Installing dependencies...${NC}"
    echo -e "${YELLOW}This may take a few minutes on first run...${NC}"
    echo ""
    
    if npm install; then
        echo ""
        echo -e "${GREEN}Dependencies installed successfully${NC}"
    else
        echo -e "${RED}ERROR: Failed to install dependencies${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}Dependencies already installed${NC}"
    
    # Check if package.json has changed
    if [ -f "package.json" ] && [ -f "package-lock.json" ]; then
        if [ "package.json" -nt "package-lock.json" ]; then
            echo -e "${YELLOW}package.json has been updated. Reinstalling dependencies...${NC}"
            if npm install; then
                echo -e "${GREEN}Dependencies updated successfully${NC}"
            else
                echo -e "${YELLOW}WARNING: Failed to update dependencies${NC}"
                echo -e "${YELLOW}Continuing with existing dependencies...${NC}"
            fi
        fi
    fi
fi

echo ""

# Start development server
echo -e "${YELLOW}[4/4] Starting development server...${NC}"
echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Frontend will be available at:${NC}"
echo -e "${GREEN}  http://localhost:5173${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""

npm run dev

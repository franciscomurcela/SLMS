#!/bin/bash

# =============================================================================
# SLMS Complete Setup Script for Ubuntu Server 24.04.3 LTS
# This script installs ALL dependencies on a CLEAN server and starts the system
# =============================================================================
#
# USAGE (on a clean Ubuntu Server 24.04.3 LTS):
#
# Option 1 - If repository is already cloned:
#   cd group-project-es2526_204
#   chmod +x setup-from-scratch.sh
#   ./setup-from-scratch.sh
#
# Option 2 - Clone and run (requires Git to be installed first):
#   sudo apt update && sudo apt install -y git
#   git clone https://github.com/detiuaveiro/group-project-es2526_204.git
#   cd group-project-es2526_204
#   chmod +x setup-from-scratch.sh
#   ./setup-from-scratch.sh
#
# This script will:
# 1. Update system packages
# 2. Install Docker and Docker Compose
# 3. Install Node.js 20.x and npm
# 4. Run quick-start.sh to start all services
#
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║     SLMS - Complete Setup from Scratch                     ║${NC}"
echo -e "${BLUE}║     Ubuntu Server 24.04.3 LTS                              ║${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}⚠️  This script will install:${NC}"
echo "   - Docker & Docker Compose"
echo "   - Node.js 20.x & npm"
echo "   - SLMS Application (all services)"
echo ""
echo -e "${CYAN}📊 Estimated time: 5-10 minutes${NC}"
echo ""

# Check if running as root (not recommended)
if [ "$EUID" -eq 0 ]; then 
    echo -e "${RED}❌ Please do not run this script as root!${NC}"
    echo "   Run as a regular user with sudo privileges."
    exit 1
fi

# Check if sudo is available
if ! command -v sudo &> /dev/null; then
    echo -e "${RED}❌ sudo is not installed!${NC}"
    echo "   Please install sudo first: apt install sudo"
    exit 1
fi

# Verify Ubuntu version
if [ -f /etc/os-release ]; then
    . /etc/os-release
    if [[ "$VERSION_ID" != "24.04" ]]; then
        echo -e "${YELLOW}⚠️  Warning: This script is designed for Ubuntu 24.04.3 LTS${NC}"
        echo "   Your version: $PRETTY_NAME"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

echo ""
read -p "Press Enter to start installation or Ctrl+C to cancel..."
echo ""

# =============================================================================
# STEP 1: Update System
# =============================================================================
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Step 1/4: Updating System Packages                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

sudo apt update
sudo apt upgrade -y
sudo apt install -y curl wget ca-certificates gnupg lsb-release software-properties-common apt-transport-https

echo -e "${GREEN}✅ System updated successfully${NC}"
echo ""

# =============================================================================
# STEP 2: Install Docker
# =============================================================================
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Step 2/4: Installing Docker                               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker already installed: $(docker --version)${NC}"
else
    # Remove old versions
    sudo apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

    # Add Docker's official GPG key
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    # Add Docker repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker Engine
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    echo -e "${GREEN}✅ Docker installed: $(docker --version)${NC}"
fi

# Add current user to docker group
if ! groups $USER | grep -q docker; then
    echo "   Adding user '$USER' to docker group..."
    sudo usermod -aG docker $USER
    echo -e "${YELLOW}⚠️  User added to docker group${NC}"
    echo -e "${YELLOW}   For the group change to take effect, you have 2 options:${NC}"
    echo -e "${YELLOW}   1. Log out and log back in (recommended)${NC}"
    echo -e "${YELLOW}   2. Run: newgrp docker (temporary for this session)${NC}"
    echo ""
    echo -e "${YELLOW}   This script will continue using 'sudo docker' for now...${NC}"
    echo ""
    DOCKER_CMD="sudo docker"
    USE_SUDO=true
else
    echo -e "${GREEN}✅ User already in docker group${NC}"
    DOCKER_CMD="docker"
    USE_SUDO=false
fi

# Start Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Verify Docker is running
if ! $DOCKER_CMD info &> /dev/null; then
    echo -e "${RED}❌ Docker daemon is not running!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker Compose installed: $($DOCKER_CMD compose version)${NC}"
echo ""

# =============================================================================
# STEP 3: Install Node.js 20.x
# =============================================================================
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Step 3/4: Installing Node.js 20.x                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 18 ]; then
        echo -e "${GREEN}✅ Node.js already installed: $(node --version)${NC}"
        NODE_ALREADY_INSTALLED=true
    else
        echo -e "${YELLOW}⚠️  Node.js version too old (v$NODE_VERSION), installing 20.x...${NC}"
        sudo apt remove -y nodejs npm 2>/dev/null || true
        NODE_ALREADY_INSTALLED=false
    fi
else
    NODE_ALREADY_INSTALLED=false
fi

if [ "$NODE_ALREADY_INSTALLED" = false ]; then
    # Install Node.js 20.x from NodeSource
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs

    echo -e "${GREEN}✅ Node.js installed: $(node --version)${NC}"
    echo -e "${GREEN}✅ npm installed: $(npm --version)${NC}"
fi

echo ""

# =============================================================================
# STEP 5: Clone Repository
# =============================================================================
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Step 5/6: Cloning SLMS Repository                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

PROJECT_DIR="$HOME/group-project-es2526_204"

if [ -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}⚠️  Repository already exists at $PROJECT_DIR${NC}"
    read -p "Do you want to delete and re-clone? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$PROJECT_DIR"
        git clone https://github.com/detiuaveiro/group-project-es2526_204.git "$PROJECT_DIR"
        echo -e "${GREEN}✅ Repository re-cloned successfully${NC}"
    else
        echo -e "${BLUE}ℹ️  Using existing repository${NC}"
    fi
else
    echo "   Cloning from GitHub..."
    git clone https://github.com/detiuaveiro/group-project-es2526_204.git "$PROJECT_DIR"
    echo -e "${GREEN}✅ Repository cloned successfully${NC}"
fi

cd "$PROJECT_DIR"
echo "   Working directory: $PROJECT_DIR"
echo ""

# =============================================================================
# STEP 4: Run Quick Start
# =============================================================================
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Step 4/4: Starting SLMS Application                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Make scripts executable
chmod +x quick-start.sh quick-stop.sh restart.sh 2>/dev/null || true

echo -e "${YELLOW}🚀 Running quick-start.sh...${NC}"
echo ""

# If user needs newgrp docker, modify docker commands temporarily
if [ "$USE_SUDO" = true ]; then
    echo -e "${YELLOW}⚠️  Note: Docker commands will use sudo (user not in docker group yet)${NC}"
    echo "   After this installation, please log out and log back in to use docker without sudo."
    echo ""
    
    # Create a wrapper script that uses sudo for docker
    cat > /tmp/docker-wrapper.sh << 'EOF'
#!/bin/bash
sudo docker "$@"
EOF
    chmod +x /tmp/docker-wrapper.sh
    
    # Temporarily add to PATH
    export PATH="/tmp:$PATH"
fi

# Run quick-start.sh
bash quick-start.sh

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║  ${GREEN}✅ SLMS Installation Complete!${BLUE}                         ║${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get machine IP
MACHINE_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")

echo -e "${GREEN}🌐 Access Points:${NC}"
echo ""
echo "   Frontend:       http://$MACHINE_IP:3000"
echo "   Keycloak Admin: http://$MACHINE_IP:8083/auth/admin"
echo ""

echo -e "${GREEN}👤 Test Login:${NC}"
echo ""
echo "   Username: anacosta"
echo "   Password: anacosta"
echo ""

echo -e "${YELLOW}📚 Important Notes:${NC}"
echo ""
if [ "$USE_SUDO" = true ]; then
    echo -e "   ${RED}⚠️  IMPORTANT: To use docker without sudo:${NC}"
    echo "      1. Log out from this session"
    echo "      2. Log back in"
    echo "      3. Verify with: docker ps"
    echo ""
fi
echo "   📖 Full documentation: README.md"
echo "   🛑 Stop services: ./quick-stop.sh"
echo "   🔄 Restart services: ./restart.sh"
echo ""

echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}   Installation completed successfully! 🎉${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

#!/bin/bash
# ========================================
# Script: Setup Permissions
# Description: Da permissoes de execucao a todos os scripts
# ========================================

echo "========================================"
echo "  Setting up script permissions..."
echo "========================================"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Make all .sh files executable
echo "Making .sh files executable..."
chmod +x "$SCRIPT_DIR"/*.sh

if [ $? -eq 0 ]; then
    echo "[OK] Permissions set successfully!"
else
    echo "[ERROR] Failed to set permissions"
    exit 1
fi

echo ""
echo "Scripts with execute permissions:"
ls -l "$SCRIPT_DIR"/*.sh | awk '{print "  " $1 " " $9}'
echo ""
echo "========================================"
echo "[SUCCESS] Setup complete!"
echo "========================================"
echo ""

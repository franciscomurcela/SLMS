#!/usr/bin/env bash
# open-ports.sh - Open necessary ports for SLMS services

set -e

echo "🔓 Opening ports for SLMS services..."
echo "=========================================="
echo ""

# Check if ufw is installed
if ! command -v ufw &> /dev/null; then
    echo "⚠️  UFW (firewall) not found. Skipping..."
    exit 0
fi

# Check if ufw is active
if ! sudo ufw status | grep -q "Status: active"; then
    echo "⚠️  UFW is not active. Enable it? (y/n)"
    read -p "> " enable_ufw
    if [[ $enable_ufw == "y" ]]; then
        sudo ufw enable
    else
        echo "Skipping firewall configuration."
        exit 0
    fi
fi

echo "📝 Opening ports..."

# Frontend
sudo ufw allow 80/tcp comment 'SLMS Frontend HTTP'
sudo ufw allow 443/tcp comment 'SLMS Frontend HTTPS'
sudo ufw allow 3000/tcp comment 'SLMS Frontend Docker'

# Backend Services
sudo ufw allow 8080/tcp comment 'SLMS Carrier Service'
sudo ufw allow 8081/tcp comment 'SLMS Order Service'
sudo ufw allow 8082/tcp comment 'SLMS User Service'
sudo ufw allow 8083/tcp comment 'SLMS Keycloak'

echo ""
echo "✅ Ports opened successfully!"
echo ""
echo "📊 Current firewall status:"
sudo ufw status numbered

echo ""
echo "🌐 Services accessible on:"
echo "   - Frontend:        http://192.168.160.9:3000"
echo "   - Keycloak:        http://192.168.160.9:8083"
echo "   - User Service:    http://192.168.160.9:8082"
echo "   - Order Service:   http://192.168.160.9:8081"
echo "   - Carrier Service: http://192.168.160.9:8080"
echo ""

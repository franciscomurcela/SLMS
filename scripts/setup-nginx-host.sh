#!/usr/bin/env bash
# setup-nginx-host.sh - Configure NGINX reverse proxy on host machine

set -e

echo "🔧 Setting up NGINX reverse proxy on host..."
echo "=========================================="
echo ""

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "📦 NGINX not found. Installing..."
    sudo apt update
    sudo apt install -y nginx
else
    echo "✅ NGINX already installed"
fi

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
NGINX_CONFIG="$PROJECT_ROOT/nginx-host-config/slms.conf"

# Copy configuration
echo ""
echo "📝 Installing NGINX configuration..."
sudo cp "$NGINX_CONFIG" /etc/nginx/sites-available/slms

# Create symlink
if [ -f /etc/nginx/sites-enabled/slms ]; then
    echo "⚠️  Symlink already exists, removing old one..."
    sudo rm /etc/nginx/sites-enabled/slms
fi

sudo ln -s /etc/nginx/sites-available/slms /etc/nginx/sites-enabled/slms

# Disable default site (optional)
if [ -f /etc/nginx/sites-enabled/default ]; then
    echo "🔧 Disabling default nginx site..."
    sudo rm /etc/nginx/sites-enabled/default
fi

# Test configuration
echo ""
echo "🧪 Testing NGINX configuration..."
sudo nginx -t

# Restart nginx
echo ""
echo "🔄 Restarting NGINX..."
sudo systemctl restart nginx
sudo systemctl enable nginx

echo ""
echo "✅ NGINX configured successfully!"
echo ""
echo "🌐 Your application is now accessible at:"
echo "   - http://192.168.160.9/"
echo "   - http://deti-engsoft-09.ua.pt/"
echo ""
echo "📝 Note: For HTTPS, you need to:"
echo "   1. Obtain SSL certificates (Let's Encrypt recommended)"
echo "   2. Uncomment SSL lines in /etc/nginx/sites-available/slms"
echo "   3. Restart nginx: sudo systemctl restart nginx"
echo ""

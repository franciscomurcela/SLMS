#!/bin/bash
# Script para corrigir o proxy do Keycloak no Nginx

echo "🔧 Corrigindo configuração do proxy Keycloak..."

# Detectar qual usar: 127.0.0.1 ou IP da interface
HOST_IP="127.0.0.1"

# Testar se conseguimos aceder ao Keycloak via 127.0.0.1
if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8083/ 2>/dev/null | grep -q "200\|303"; then
    echo "✅ Keycloak acessível via 127.0.0.1:8083"
    HOST_IP="127.0.0.1"
else
    # Tentar obter o IP da interface principal
    MAIN_IP=$(ip route get 1 | awk '{print $7; exit}')
    if [ -n "$MAIN_IP" ]; then
        echo "🔍 Tentando via IP da interface: $MAIN_IP"
        if curl -s -o /dev/null -w "%{http_code}" http://$MAIN_IP:8083/ 2>/dev/null | grep -q "200\|303"; then
            HOST_IP="$MAIN_IP"
            echo "✅ Keycloak acessível via $HOST_IP:8083"
        fi
    fi
fi

echo "📝 Usando upstream: $HOST_IP:8083"
echo ""

# Criar configuração corrigida
sudo tee /etc/nginx/sites-available/slms > /dev/null << EOF
# SLMS - HTTPS Configuration (Fixed Keycloak Proxy)

upstream frontend {
    server 127.0.0.1:3000;
}

upstream keycloak {
    server $HOST_IP:8083;
}

upstream user_service {
    server 127.0.0.1:8082;
}

upstream order_service {
    server 127.0.0.1:8081;
}

upstream carrier_service {
    server 127.0.0.1:8080;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name 192.168.160.9 deti-engsoft-09.ua.pt;
    return 301 https://\$host\$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name 192.168.160.9 deti-engsoft-09.ua.pt;

    # SSL
    ssl_certificate /etc/nginx/certs/nginx-selfsigned.crt;
    ssl_certificate_key /etc/nginx/certs/nginx-selfsigned.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Buffers
    proxy_buffer_size 128k;
    proxy_buffers 4 256k;
    proxy_busy_buffers_size 256k;
    client_max_body_size 50M;

    # Logs
    access_log /var/log/nginx/slms_https_access.log;
    error_log /var/log/nginx/slms_https_error.log;

    # Keycloak - CRITICAL: Must preserve trailing slash and redirect properly
    location /auth/ {
        proxy_pass http://keycloak/;
        
        # Essential headers
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port 443;
        
        # Keycloak needs this for proper path handling
        proxy_set_header X-Forwarded-Prefix /auth;
        
        # Handle redirects from Keycloak
        proxy_redirect http://$HOST_IP:8083/ /auth/;
        proxy_redirect http://localhost:8083/ /auth/;
        proxy_redirect http://127.0.0.1:8083/ /auth/;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts (Keycloak can be slow on first request)
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        
        # Cookies
        proxy_cookie_path / /;
        proxy_cookie_flags ~ secure samesite=lax;
    }

    # User Service
    location /api/users/ {
        proxy_pass http://user_service/api/users/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Authorization \$http_authorization;
        proxy_pass_header Authorization;
    }

    # Order Service
    location /api/orders/ {
        proxy_pass http://order_service/api/orders/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Authorization \$http_authorization;
        proxy_pass_header Authorization;
    }

    # Shipments
    location /api/shipments/ {
        proxy_pass http://order_service/api/shipments/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Authorization \$http_authorization;
        proxy_pass_header Authorization;
    }

    # Carrier Service
    location /carriers/ {
        proxy_pass http://carrier_service/carriers/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Authorization \$http_authorization;
        proxy_pass_header Authorization;
    }

    # Frontend
    location / {
        proxy_pass http://frontend/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Health check
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
EOF

echo "✅ Configuração atualizada"
echo ""

# Testar e recarregar
echo "🧪 Testando configuração..."
if sudo nginx -t; then
    echo "✅ Configuração válida!"
    sudo systemctl reload nginx
    
    echo ""
    echo "🔄 Nginx recarregado!"
    echo ""
    echo "🧪 Testando proxy agora..."
    sleep 2
    
    # Testar o proxy
    RESULT=$(curl -k -s -o /dev/null -w "%{http_code}" https://localhost/auth/ 2>/dev/null)
    if [ "$RESULT" = "200" ] || [ "$RESULT" = "303" ] || [ "$RESULT" = "301" ]; then
        echo "✅ Proxy /auth/ funcionando! (HTTP $RESULT)"
    else
        echo "⚠️  Proxy retornou: HTTP $RESULT"
        echo "   Verifique: curl -k https://localhost/auth/"
    fi
    
else
    echo "❌ Erro na configuração!"
    sudo nginx -t
    exit 1
fi

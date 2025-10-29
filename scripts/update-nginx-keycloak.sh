#!/bin/bash
# Configuração Nginx para Keycloak SEM path /auth/ no container

sudo tee /etc/nginx/sites-available/slms > /dev/null << 'EOF'
# SLMS - HTTPS Configuration

upstream frontend {
    server 127.0.0.1:3000;
}

upstream keycloak {
    server 127.0.0.1:8083;
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
    return 301 https://$host$request_uri;
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

    # Keycloak - Rewrite /auth/ to root path
    location /auth/ {
        rewrite ^/auth/(.*) /$1 break;
        proxy_pass http://keycloak/;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port 443;
        
        # Handle Keycloak redirects
        proxy_redirect / /auth/;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        
        # Cookies
        proxy_cookie_path / /auth/;
    }

    # User Service
    location /api/users/ {
        proxy_pass http://user_service/api/users/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Authorization $http_authorization;
        proxy_pass_header Authorization;
    }

    # Order Service
    location /api/orders/ {
        proxy_pass http://order_service/api/orders/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Authorization $http_authorization;
        proxy_pass_header Authorization;
    }

    # Shipments
    location /api/shipments/ {
        proxy_pass http://order_service/api/shipments/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Authorization $http_authorization;
        proxy_pass_header Authorization;
    }

    # Carrier Service
    location /carriers/ {
        proxy_pass http://carrier_service/carriers/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Authorization $http_authorization;
        proxy_pass_header Authorization;
    }

    # Frontend
    location / {
        proxy_pass http://frontend/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

echo "✅ Configuração atualizada"

# Testar e recarregar
if sudo nginx -t; then
    echo "✅ Configuração válida"
    sudo systemctl reload nginx
    echo "🔄 Nginx recarregado"
else
    echo "❌ Erro na configuração"
    sudo nginx -t
    exit 1
fi

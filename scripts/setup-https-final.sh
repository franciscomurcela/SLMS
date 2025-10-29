#!/bin/bash
# Script para configurar HTTPS no Nginx com os certificados existentes

set -e

echo "🔒 Configurando HTTPS para SLMS..."

PROJECT_DIR=~/rep/group-project-es2526_204

# 1. Mover certificados para nginx-host-config se ainda estiverem em scripts/
if [ -f "$PROJECT_DIR/scripts/nginx-selfsigned.crt" ]; then
    echo "📦 Movendo certificados para nginx-host-config..."
    mv $PROJECT_DIR/scripts/nginx-selfsigned.crt $PROJECT_DIR/nginx-host-config/
    mv $PROJECT_DIR/scripts/nginx-selfsigned.key $PROJECT_DIR/nginx-host-config/
fi

# 2. Verificar se os certificados existem
if [ ! -f "$PROJECT_DIR/nginx-host-config/nginx-selfsigned.crt" ]; then
    echo "❌ Erro: Certificado não encontrado em nginx-host-config/"
    exit 1
fi

# 3. Criar diretório no sistema
echo "📁 Criando /etc/nginx/certs..."
sudo mkdir -p /etc/nginx/certs

# 4. Copiar certificados
echo "📋 Copiando certificados..."
sudo cp $PROJECT_DIR/nginx-host-config/nginx-selfsigned.crt /etc/nginx/certs/
sudo cp $PROJECT_DIR/nginx-host-config/nginx-selfsigned.key /etc/nginx/certs/

# 5. Permissões
echo "🔒 Ajustando permissões..."
sudo chmod 644 /etc/nginx/certs/nginx-selfsigned.crt
sudo chmod 600 /etc/nginx/certs/nginx-selfsigned.key

# 6. Criar configuração HTTPS
echo "⚙️  Criando configuração HTTPS..."
sudo tee /etc/nginx/sites-available/slms > /dev/null << 'EOF'
# SLMS - HTTPS Configuration

upstream frontend {
    server localhost:3000;
}

upstream keycloak {
    server localhost:8083;
}

upstream user_service {
    server localhost:8082;
}

upstream order_service {
    server localhost:8081;
}

upstream carrier_service {
    server localhost:8080;
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

    # Keycloak
    location /auth/ {
        proxy_pass http://keycloak/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port 443;
        proxy_set_header X-Forwarded-Prefix /auth;
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        
        proxy_cookie_path / /;
        proxy_cookie_flags ~ secure samesite=lax;
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

# 7. Ativar site
echo "🔗 Ativando site..."
sudo ln -sf /etc/nginx/sites-available/slms /etc/nginx/sites-enabled/slms

# 8. Remover default se existir
if [ -L /etc/nginx/sites-enabled/default ]; then
    sudo rm /etc/nginx/sites-enabled/default
fi

# 9. Testar e recarregar
echo "🧪 Testando configuração..."
if sudo nginx -t; then
    echo "✅ Configuração válida!"
    sudo systemctl reload nginx
    
    echo ""
    echo "✨ HTTPS CONFIGURADO COM SUCESSO!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🌐 HTTP:  http://192.168.160.9  → redireciona para HTTPS"
    echo "🔒 HTTPS: https://192.168.160.9"
    echo ""
    echo "⚠️  AVISO DE CERTIFICADO AUTO-ASSINADO:"
    echo "   O navegador vai mostrar um aviso de segurança."
    echo "   Clique em 'Avançado' e depois 'Prosseguir'"
    echo ""
else
    echo "❌ Erro na configuração!"
    sudo nginx -t
    exit 1
fi

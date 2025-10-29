#!/bin/bash#!/bin/bash

# Corrigir configuração Nginx para Keycloak com HTTPS# Corrigir configuração Nginx para Keycloak



sudo tee /etc/nginx/sites-available/slms > /dev/null << 'EOF'sudo tee /etc/nginx/sites-available/slms > /dev/null << 'EOF'

# SLMS - HTTPS Configuration (Fixed Keycloak)# SLMS - HTTPS Configuration (Fixed Keycloak)



upstream frontend {upstream frontend {

    server 127.0.0.1:3000;    server 127.0.0.1:3000;

}}



upstream keycloak {upstream keycloak {

    server 127.0.0.1:8083;    server 127.0.0.1:8083;

}}



upstream user_service {upstream user_service {

    server 127.0.0.1:8082;    server 127.0.0.1:8082;

}}



upstream order_service {upstream order_service {

    server 127.0.0.1:8081;    server 127.0.0.1:8081;

}}



upstream carrier_service {upstream carrier_service {

    server 127.0.0.1:8080;    server 127.0.0.1:8080;

}}



# Redirect HTTP to HTTPS# Redirect HTTP to HTTPS

server {server {

    listen 80;    listen 80;

    server_name 192.168.160.9 deti-engsoft-09.ua.pt;    server_name 192.168.160.9 deti-engsoft-09.ua.pt;

    return 301 https://$host$request_uri;    return 301 https://$host$request_uri;

}}



# HTTPS Server# HTTPS Server

server {server {

    listen 443 ssl http2;    listen 443 ssl http2;

    server_name 192.168.160.9 deti-engsoft-09.ua.pt;    server_name 192.168.160.9 deti-engsoft-09.ua.pt;



    # SSL    # SSL

    ssl_certificate /etc/nginx/certs/nginx-selfsigned.crt;    ssl_certificate /etc/nginx/certs/nginx-selfsigned.crt;

    ssl_certificate_key /etc/nginx/certs/nginx-selfsigned.key;    ssl_certificate_key /etc/nginx/certs/nginx-selfsigned.key;

    ssl_protocols TLSv1.2 TLSv1.3;    ssl_protocols TLSv1.2 TLSv1.3;

    ssl_ciphers HIGH:!aNULL:!MD5;    ssl_ciphers HIGH:!aNULL:!MD5;



    # Buffers    # Buffers

    proxy_buffer_size 128k;    proxy_buffer_size 128k;

    proxy_buffers 4 256k;    proxy_buffers 4 256k;

    proxy_busy_buffers_size 256k;    proxy_busy_buffers_size 256k;

    client_max_body_size 50M;    client_max_body_size 50M;



    # Logs    # Logs

    access_log /var/log/nginx/slms_https_access.log;    access_log /var/log/nginx/slms_https_access.log;

    error_log /var/log/nginx/slms_https_error.log;    error_log /var/log/nginx/slms_https_error.log;



    # Keycloak - Simple proxy to /auth path    # Keycloak - Simple proxy without rewrite

    location /auth {    location /auth/ {

        proxy_pass http://keycloak/auth;        proxy_pass http://keycloak/;

                

        proxy_set_header Host $host;        proxy_set_header Host $host;

        proxy_set_header X-Real-IP $remote_addr;        proxy_set_header X-Real-IP $remote_addr;

        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        proxy_set_header X-Forwarded-Proto https;        proxy_set_header X-Forwarded-Proto https;

        proxy_set_header X-Forwarded-Host $host;        proxy_set_header X-Forwarded-Host $host;

        proxy_set_header X-Forwarded-Port 443;        proxy_set_header X-Forwarded-Port 443;

                

        # WebSocket support        # WebSocket support

        proxy_http_version 1.1;        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;        proxy_set_header Upgrade $http_upgrade;

        proxy_set_header Connection "upgrade";        proxy_set_header Connection "upgrade";

                

        # Timeouts        # Timeouts

        proxy_connect_timeout 300s;        proxy_connect_timeout 300s;

        proxy_send_timeout 300s;        proxy_send_timeout 300s;

        proxy_read_timeout 300s;        proxy_read_timeout 300s;

                

        # Don't buffer for streaming responses        # Preserve request method (important for POST)

        proxy_buffering off;        proxy_method $request_method;

    }        

        # Don't buffer for streaming responses

    # User Service        proxy_buffering off;

    location /api/users/ {    }

        proxy_pass http://user_service/api/users/;

        proxy_set_header Host $host;    # User Service

        proxy_set_header X-Real-IP $remote_addr;    location /api/users/ {

        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;        proxy_pass http://user_service/api/users/;

        proxy_set_header X-Forwarded-Proto https;        proxy_set_header Host $host;

        proxy_set_header Authorization $http_authorization;        proxy_set_header X-Real-IP $remote_addr;

        proxy_pass_header Authorization;        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

    }        proxy_set_header X-Forwarded-Proto https;

        proxy_set_header Authorization $http_authorization;

    # Order Service        proxy_pass_header Authorization;

    location /api/orders/ {    }

        proxy_pass http://order_service/api/orders/;

        proxy_set_header Host $host;    # Order Service

        proxy_set_header X-Real-IP $remote_addr;    location /api/orders/ {

        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;        proxy_pass http://order_service/api/orders/;

        proxy_set_header X-Forwarded-Proto https;        proxy_set_header Host $host;

        proxy_set_header Authorization $http_authorization;        proxy_set_header X-Real-IP $remote_addr;

        proxy_pass_header Authorization;        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

    }        proxy_set_header X-Forwarded-Proto https;

        proxy_set_header Authorization $http_authorization;

    # Shipments        proxy_pass_header Authorization;

    location /api/shipments/ {    }

        proxy_pass http://order_service/api/shipments/;

        proxy_set_header Host $host;    # Shipments

        proxy_set_header X-Real-IP $remote_addr;    location /api/shipments/ {

        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;        proxy_pass http://order_service/api/shipments/;

        proxy_set_header X-Forwarded-Proto https;        proxy_set_header Host $host;

        proxy_set_header Authorization $http_authorization;        proxy_set_header X-Real-IP $remote_addr;

        proxy_pass_header Authorization;        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

    }        proxy_set_header X-Forwarded-Proto https;

        proxy_set_header Authorization $http_authorization;

    # Carrier Service        proxy_pass_header Authorization;

    location /carriers/ {    }

        proxy_pass http://carrier_service/carriers/;

        proxy_set_header Host $host;    # Carrier Service

        proxy_set_header X-Real-IP $remote_addr;    location /carriers/ {

        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;        proxy_pass http://carrier_service/carriers/;

        proxy_set_header X-Forwarded-Proto https;        proxy_set_header Host $host;

        proxy_set_header Authorization $http_authorization;        proxy_set_header X-Real-IP $remote_addr;

        proxy_pass_header Authorization;        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

    }        proxy_set_header X-Forwarded-Proto https;

        proxy_set_header Authorization $http_authorization;

    # Frontend        proxy_pass_header Authorization;

    location / {    }

        proxy_pass http://frontend/;

        proxy_set_header Host $host;    # Frontend

        proxy_set_header X-Real-IP $remote_addr;    location / {

        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;        proxy_pass http://frontend/;

        proxy_set_header X-Forwarded-Proto https;        proxy_set_header Host $host;

                proxy_set_header X-Real-IP $remote_addr;

        proxy_http_version 1.1;        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        proxy_set_header Upgrade $http_upgrade;        proxy_set_header X-Forwarded-Proto https;

        proxy_set_header Connection "upgrade";        

    }        proxy_http_version 1.1;

}        proxy_set_header Upgrade $http_upgrade;

EOF        proxy_set_header Connection "upgrade";

    }

echo "✅ Configuração corrigida!"}

EOF

if sudo nginx -t; then

    sudo systemctl reload nginxecho "✅ Configuração corrigida"

    echo "🔄 Nginx recarregado com sucesso!"

    echo ""if sudo nginx -t; then

    echo "🧪 Testando..."    sudo systemctl reload nginx

    sleep 2    echo "✅ Nginx recarregado!"

    RESULT=$(curl -k -s -o /dev/null -w "%{http_code}" https://localhost/auth/ 2>/dev/null)else

    echo "   Resposta: HTTP $RESULT"    echo "❌ Erro!"

    if [ "$RESULT" = "200" ] || [ "$RESULT" = "303" ]; then    sudo nginx -t

        echo "   ✅ Keycloak acessível!"fi

    fi
else
    echo "❌ Erro na configuração!"
    sudo nginx -t
    exit 1
fi

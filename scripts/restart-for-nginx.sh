#!/bin/bash

# Script para reiniciar os serviços após configurar Nginx
# Este script:
# 1. Para todos os containers
# 2. Rebuilda o frontend com as novas configurações
# 3. Reinicia o backend com as novas variáveis de ambiente
# 4. Mostra os logs para debug

set -e

echo "🔄 Parando frontend..."
cd react-frontend
docker-compose down
docker rm -f slms-frontend 2>/dev/null || true

echo ""
echo "🔄 Parando backend..."
cd ../slms-backend
docker-compose down

echo ""
echo "🏗️  Building frontend com novas configurações..."
cd ../react-frontend/frontend
npm run build

echo ""
echo "🐳 Building frontend container..."
cd ..
docker-compose build --no-cache frontend

echo ""
echo "🚀 Iniciando backend..."
cd ../slms-backend
docker-compose up -d

echo ""
echo "⏳ Aguardando Keycloak iniciar (30 segundos)..."
sleep 30

echo ""
echo "🚀 Iniciando frontend..."
cd ../react-frontend
docker-compose up -d

echo ""
echo "✅ Todos os serviços iniciados!"
echo ""
echo "📋 Status dos containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🌐 Acesso:"
echo "   Frontend: http://192.168.160.9/"
echo "   Keycloak: http://192.168.160.9/auth/"
echo ""
echo "📝 Para ver logs:"
echo "   Frontend: docker logs -f slms-frontend"
echo "   Keycloak: docker logs -f keycloak"
echo "   User Service: docker logs -f user-service"


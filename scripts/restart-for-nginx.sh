#!/bin/bash

# Script simplificado para reiniciar os serviços após configurar Nginx
# Build do frontend é feito dentro do container Docker (multi-stage build)

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
echo "🐳 Rebuilding frontend container (build automático)..."
cd ../react-frontend
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


#!/bin/bash

# Script de reinicialização completa do sistema SLMS
# Baseado no runtutorial.txt

set -e  # Exit on error

echo "🔄 Parando todos os serviços..."
cd /home/xavier/MECT/group-project-es2526_204/react-frontend
docker-compose down 2>/dev/null || true

cd /home/xavier/MECT/group-project-es2526_204/slms-backend
docker-compose down 2>/dev/null || true

echo ""
echo "🚀 Iniciando backend..."
docker-compose up --build -d

echo ""
echo "⏳ Aguardando serviços do backend iniciarem (15s)..."
sleep 15

echo ""
echo "📊 Importando schema da base de dados..."
cd /home/xavier/MECT/group-project-es2526_204
docker exec -i slms-db psql -U slms_user -d slms_db < slms-backend/config/schema-postgresql.sql

echo ""
echo "📦 Importando dados de teste..."
docker exec -i slms-db psql -U slms_user -d slms_db < scripts/slms-data-only-20251027-193147.sql/slms-data-only-20251027-193147.sql 2>&1 | grep -E "INSERT|ERROR" | tail -10

echo ""
echo "🎨 Iniciando frontend..."
cd /home/xavier/MECT/group-project-es2526_204/react-frontend
docker-compose up --build -d

echo ""
echo "⏳ Aguardando frontend iniciar (10s)..."
sleep 10

echo ""
echo "✅ Sistema reiniciado com sucesso!"
echo ""
echo "🌐 Acesse: http://localhost:3000"
echo "👤 Login: anacosta / password"
echo "📦 Teste tracking IDs:"
echo "   - Order ID: 3d88f621-9667-4da9-8920-f85f21907195"
echo "   - Tracking ID: d0d1fdf3-5e2f-420f-87ac-0396833b0aca"
echo ""
echo "📊 Containers ativos:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "NAME|slms|order|carrier|user|keycloak"

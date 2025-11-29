#!/bin/bash

# Script de reinicialização completa do sistema SLMS
# Baseado no runtutorial.txt

set -e  # Exit on error

echo "🔄 Parando todos os serviços..."
cd react-frontend
docker-compose down 2>/dev/null || true

cd ..
cd slms-backend
docker-compose down 2>/dev/null || true

echo ""
echo "🚀 Iniciando backend..."
docker-compose up --build -d

echo ""
echo "⏳ Aguardando serviços do backend iniciarem (15s)..."
sleep 15

echo ""
echo "🗑️  Limpando base de dados..."
cd ..
docker exec -i slms-db psql -U slms_user -d slms_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO slms_user; GRANT ALL ON SCHEMA public TO public;"

echo ""
echo "📊 Importando dump completo da base de dados (schema + dados)..."
docker exec -i slms-db psql -U slms_user -d slms_db -c "SET client_encoding TO 'UTF8';" < slms-backend/slms_db_backup_20251126_182859.sql docker exec -i slms-db psql -U slms_user -d slms_db"

echo ""
echo "🎨 Iniciando frontend..."
cd react-frontend
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

#!/bin/bash
# Quick restart - apenas reinicia os containers sem rebuild

cd ~/rep/group-project-es2526_204

echo "🔄 Parando containers..."
cd slms-backend && docker-compose down && cd ..
cd react-frontend && docker-compose down && cd ..

echo "🚀 Iniciando backend..."
cd slms-backend && docker-compose up -d && cd ..

echo "⏳ Aguardando 30 segundos..."
sleep 30

echo "🚀 Iniciando frontend..."
cd react-frontend && docker-compose up -d && cd ..

echo "✅ Pronto!"
docker ps --format "table {{.Names}}\t{{.Status}}"

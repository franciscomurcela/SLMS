#!/bin/bash
# Script para reimportar o Keycloak realm automaticamente
# Uso: ./scripts/reimport-keycloak.sh

set -e

echo "====================================="
echo "Keycloak Realm Reimport Script"
echo "====================================="
echo ""

# Verifica se estamos no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Erro: Execute este script a partir do diretório slms-backend"
    exit 1
fi

# Verifica se o realm file existe
if [ ! -f "keycloak-init/ESg204-realm.json" ]; then
    echo "❌ Erro: Arquivo ESg204-realm.json não encontrado em keycloak-init/"
    exit 1
fi

echo "📋 Passo 1: Parando containers do Keycloak..."
docker-compose stop keycloak keycloak-db

echo ""
echo "📋 Passo 2: Removendo containers..."
docker-compose rm -f keycloak keycloak-db

echo ""
echo "🗑️  Passo 3: Removendo volumes antigos..."
docker volume rm slms-backend_keycloak-pgdata -f 2>/dev/null || true
docker volume rm slms-backend_keycloak-data -f 2>/dev/null || true

echo ""
echo "🚀 Passo 4: Iniciando Keycloak com nova configuração..."
docker-compose up -d keycloak

echo ""
echo "⏳ Aguardando Keycloak inicializar (30 segundos)..."
sleep 30

echo ""
echo "📊 Verificando logs de importação..."
docker logs keycloak --tail 20 | grep -i "imported\|Import finished" || echo "Verifique os logs manualmente se necessário"

echo ""
echo "✅ Reimportação concluída!"
echo ""
echo "🔗 Keycloak disponível em: http://localhost:8083"
echo "👤 Admin: admin / admin"
echo "🏢 Realm: ESg204"
echo ""

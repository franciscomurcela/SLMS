#!/bin/bash
# setup-local-database.sh
# EXECUTE ESTE SCRIPT NO SERVIDOR (deti-engsoft-09)

set -e

if [ -z "$1" ]; then
    echo "❌ Erro: Especifica o ficheiro SQL comprimido"
    echo ""
    echo "   Uso: ./setup-local-database.sh /tmp/slms-data.sql.gz"
    echo ""
    exit 1
fi

SQL_FILE="$1"

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Erro: Ficheiro não encontrado: $SQL_FILE"
    exit 1
fi

echo "🚀 Configurando PostgreSQL Local para SLMS"
echo "============================================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# 1. Configurar .env para usar BD local
echo "📝 Passo 1/5: Configurando .env para PostgreSQL local..."
cd "$PROJECT_ROOT/slms-backend"

if [ ! -f .env ]; then
    cp .env.example .env 2>/dev/null || true
fi

cat > .env << 'EOF'
# PostgreSQL Local Configuration
SPRING_DATASOURCE_URL=jdbc:postgresql://slms-db:5432/slms_db
SPRING_DATASOURCE_USERNAME=slms_user
SPRING_DATASOURCE_PASSWORD=slms_password

# Supabase (desabilitado - usando local)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# HikariCP connection pool
SPRING_DATASOURCE_HIKARI_MINIMUM_IDLE=2
SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE=10
SPRING_DATASOURCE_HIKARI_IDLE_TIMEOUT=30000
SPRING_DATASOURCE_HIKARI_MAX_LIFETIME=600000
SPRING_DATASOURCE_HIKARI_CONNECTION_TIMEOUT=20000
EOF

echo "   ✅ .env configurado"
echo ""

# 2. Parar containers existentes
echo "🛑 Passo 2/5: Parando containers existentes..."
docker compose down
cd "$PROJECT_ROOT/react-frontend"
docker compose down
cd "$PROJECT_ROOT/slms-backend"
echo "   ✅ Containers parados"
echo ""

# 3. Remover volume antigo se existir
echo "🗑️  Passo 3/5: Limpando volumes antigos..."
docker volume rm slms-backend_slms-db-data 2>/dev/null || true
echo "   ✅ Volumes limpos"
echo ""

# 4. Subir apenas PostgreSQL
echo "🐘 Passo 4/5: Iniciando PostgreSQL..."
docker compose up -d slms-db

echo "   ⏳ Aguardando PostgreSQL ficar pronto (30 segundos)..."
sleep 30

# Verificar se está saudável
if docker compose ps slms-db | grep -q "healthy"; then
    echo "   ✅ PostgreSQL está pronto"
else
    echo "   ⚠️  PostgreSQL ainda não está healthy, aguardando mais 15s..."
    sleep 15
fi
echo ""

# 5. Importar dados
echo "📥 Passo 5/5: Importando dados do Supabase..."

# Descomprimir se for .gz
if [[ "$SQL_FILE" == *.gz ]]; then
    echo "   🗜️  Descomprimindo..."
    UNCOMPRESSED_FILE="/tmp/slms-import-$(date +%s).sql"
    gunzip -c "$SQL_FILE" > "$UNCOMPRESSED_FILE"
    SQL_FILE="$UNCOMPRESSED_FILE"
fi

echo "   📊 Importando schema e dados..."
docker compose exec -T slms-db psql -U slms_user -d slms_db < "$SQL_FILE"

if [ $? -eq 0 ]; then
    echo "   ✅ Dados importados com sucesso!"
else
    echo "   ❌ Erro ao importar dados"
    exit 1
fi

# Limpar ficheiro temporário
rm -f "$SQL_FILE" 2>/dev/null || true

echo ""
echo "🎉 PostgreSQL local configurado com sucesso!"
echo ""
echo "🚀 Iniciando todos os serviços..."
docker compose up -d

echo ""
echo "⏳ Aguardando serviços iniciarem (30 segundos)..."
sleep 30

echo ""
echo "📊 Status dos containers:"
docker compose ps

echo ""
echo "✅ SETUP COMPLETO!"
echo ""
echo "🌐 Acede à aplicação:"
echo "   http://192.168.160.9:3000"
echo ""
echo "🔍 Verificar logs:"
echo "   docker compose logs -f [service-name]"
echo ""

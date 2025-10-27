#!/bin/bash
# export-supabase-data.sh
# EXECUTE ESTE SCRIPT NO TEU PC (com acesso ao Supabase)

set -e

echo "🔄 Exportando dados do Supabase para PostgreSQL local..."
echo "============================================================"
echo ""

# Verificar se pg_dump está instalado
if ! command -v pg_dump &> /dev/null; then
    echo "❌ Erro: pg_dump não encontrado!"
    echo ""
    echo "📦 Instala PostgreSQL client:"
    echo "   Ubuntu/Debian: sudo apt install postgresql-client"
    echo "   macOS: brew install postgresql"
    echo "   Windows: https://www.postgresql.org/download/windows/"
    exit 1
fi

# Pedir URL do Supabase
echo "🔑 Credenciais do Supabase"
echo ""
read -p "Cole o Supabase Database URL (postgresql://...): " SUPABASE_URL

if [ -z "$SUPABASE_URL" ]; then
    echo "❌ URL não pode estar vazio!"
    exit 1
fi

OUTPUT_FILE="slms-data-$(date +%Y%m%d-%H%M%S).sql"

echo ""
echo "📊 Exportando dados das tabelas:"
echo "   ✓ Users"
echo "   ✓ Carrier"
echo "   ✓ Driver"
echo "   ✓ Customer"
echo "   ✓ Csr"
echo "   ✓ LogisticsManager"
echo "   ✓ WarehouseStaff"
echo "   ✓ Shipments"
echo "   ✓ Orders"
echo ""

# Fazer dump completo (schema + data)
pg_dump "$SUPABASE_URL" \
  --schema=public \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --table='public."Users"' \
  --table='public."Carrier"' \
  --table='public."Driver"' \
  --table='public."Costumer"' \
  --table='public."Csr"' \
  --table='public."LogisticsManager"' \
  --table='public."WarehouseStaff"' \
  --table='public."Shipments"' \
  --table='public."Orders"' \
  > "$OUTPUT_FILE" 2>&1

if [ $? -eq 0 ]; then
    # Comprimir
    echo "🗜️  Comprimindo..."
    gzip "$OUTPUT_FILE"
    OUTPUT_FILE="${OUTPUT_FILE}.gz"
    
    FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    
    echo ""
    echo "✅ Export completo!"
    echo ""
    echo "📦 Ficheiro criado: $OUTPUT_FILE"
    echo "📏 Tamanho: $FILE_SIZE"
    echo ""
    echo "📤 PRÓXIMOS PASSOS:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "1️⃣  Faz commit e push das alterações:"
    echo "    git add ."
    echo "    git commit -m 'Setup PostgreSQL local'"
    echo "    git push"
    echo ""
    echo "2️⃣  Transfere o ficheiro para o servidor:"
    echo "    scp $OUTPUT_FILE user@deti-engsoft-09.ua.pt:/tmp/"
    echo ""
    echo "3️⃣  No servidor, executa:"
    echo "    cd ~/rep/group-project-es2526_204"
    echo "    git pull"
    echo "    cd scripts"
    echo "    ./setup-local-database.sh /tmp/$OUTPUT_FILE"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo ""
    echo "❌ Erro ao exportar dados!"
    echo "   Verifica se o URL está correto e se tens acesso à BD"
    exit 1
fi

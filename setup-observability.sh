#!/bin/bash

# Script de Setup Rápido - Observabilidade Frontend
# Este script configura e inicia todos os componentes necessários para observabilidade

set -e  # Exit on error

echo "🔭 Setup de Observabilidade - Frontend + Backend"
echo "================================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para printar com cor
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# 1. Verificar Docker
echo "1. Verificando Docker..."
if ! command -v docker &> /dev/null; then
    print_error "Docker não encontrado. Por favor, instale o Docker primeiro."
    exit 1
fi
print_success "Docker instalado"

# 2. Criar rede de observabilidade
echo ""
echo "2. Criando rede de observabilidade..."
if docker network inspect rede-obs &> /dev/null; then
    print_warning "Rede 'rede-obs' já existe"
else
    docker network create rede-obs
    print_success "Rede 'rede-obs' criada"
fi

# 3. Criar rede do backend
echo ""
echo "3. Verificando rede do backend..."
if docker network inspect slms-backend_slms-network &> /dev/null; then
    print_success "Rede 'slms-backend_slms-network' já existe"
else
    print_warning "Rede do backend não encontrada. Será criada ao iniciar o backend."
fi

# 4. Iniciar stack de observabilidade
echo ""
echo "4. Iniciando stack de observabilidade (Grafana, Tempo, Loki, Prometheus, OTel Collector)..."
cd observability
docker-compose up -d
cd ..

# Esperar inicialização
echo "   Aguardando inicialização dos serviços..."
sleep 10

# Verificar serviços
SERVICES=("otel-collector" "grafana" "tempo" "loki" "prometheus")
for service in "${SERVICES[@]}"; do
    if docker ps --format '{{.Names}}' | grep -q "^${service}$"; then
        print_success "$service está rodando"
    else
        print_error "$service NÃO está rodando"
    fi
done

# 5. Iniciar backend
echo ""
echo "5. Iniciando backend (microserviços)..."
cd slms-backend
docker-compose up -d
cd ..

echo "   Aguardando inicialização dos microserviços..."
sleep 15

# 6. Instalar dependências do frontend (se necessário)
echo ""
echo "6. Verificando dependências do frontend..."
cd react-frontend/frontend
if [ ! -d "node_modules" ]; then
    echo "   Instalando dependências..."
    npm install --legacy-peer-deps
    print_success "Dependências instaladas"
else
    print_success "Dependências já instaladas"
fi
cd ../..

# 7. Build e iniciar frontend
echo ""
echo "7. Iniciando frontend com observabilidade..."
cd react-frontend
docker-compose up --build -d
cd ..

echo "   Aguardando inicialização do frontend..."
sleep 10

# 8. Verificar logs do frontend
echo ""
echo "8. Verificando inicialização da observabilidade no frontend..."
if docker logs slms-frontend 2>&1 | grep -q "OpenTelemetry Frontend iniciado com sucesso"; then
    print_success "OpenTelemetry inicializado no frontend"
else
    print_warning "Não foi possível confirmar a inicialização do OpenTelemetry"
    echo "   Verifique os logs: docker logs slms-frontend"
fi

# 9. Resumo final
echo ""
echo "================================================"
echo "✅ Setup Concluído!"
echo "================================================"
echo ""
echo "🌐 Acesso aos Serviços:"
echo "   Frontend:    http://localhost"
echo "   Grafana:     http://localhost:3000"
echo "   Prometheus:  http://localhost:9090"
echo ""
echo "📊 Verificar Telemetria:"
echo "   1. Acesse http://localhost e interaja com a aplicação"
echo "   2. Abra http://localhost:3000 (Grafana)"
echo "   3. Vá para Explore > Tempo"
echo "   4. Procure por: service.name=\"frontend-react\""
echo ""
echo "🐛 Debug:"
echo "   docker logs -f slms-frontend      # Logs do frontend"
echo "   docker logs -f otel-collector     # Logs do collector"
echo "   docker ps --filter 'network=rede-obs'  # Containers na rede de observabilidade"
echo ""
echo "📖 Documentação:"
echo "   docs/observability.md"
echo "   react-frontend/frontend/OBSERVABILITY_TEST.md"
echo ""

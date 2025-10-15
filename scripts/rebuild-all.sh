#!/bin/bash
# ========================================
# Script: Rebuild All Services
# Description: Para, reconstrói (sem cache) e inicia todos os containers
# ========================================

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  SLMS - Rebuild All Services${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Navegar para o diretório do backend
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")/slms-backend"

if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}❌ Erro: Diretório slms-backend não encontrado!${NC}"
    exit 1
fi

cd "$BACKEND_DIR"
echo -e "${GRAY}📂 Diretório: $BACKEND_DIR${NC}"
echo ""

# Step 1: Parar todos os containers
echo -e "${YELLOW}[1/3] 🛑 Parando todos os containers...${NC}"
docker-compose down
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Aviso: Alguns containers podem não estar a correr${NC}"
else
    echo -e "${GREEN}✅ Containers parados com sucesso!${NC}"
fi
echo ""

# Step 2: Rebuild sem cache
echo -e "${YELLOW}[2/3] 🔨 Reconstruindo todos os serviços (sem cache)...${NC}"
echo -e "${GRAY}⏳ Isto pode demorar alguns minutos...${NC}"
echo ""

docker-compose build --no-cache

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao reconstruir os serviços!${NC}"
    echo -e "${YELLOW}Verifique os logs acima para mais detalhes.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Build completado com sucesso!${NC}"
fi
echo ""

# Step 3: Iniciar todos os containers
echo -e "${YELLOW}[3/3] 🚀 Iniciando todos os containers...${NC}"
docker-compose up -d

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao iniciar os containers!${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Containers iniciados com sucesso!${NC}"
fi
echo ""

# Verificar status dos containers
echo -e "${CYAN}📊 Status dos containers:${NC}"
docker-compose ps
echo ""

# Aguardar alguns segundos para os serviços iniciarem
echo -e "${GRAY}⏳ Aguardando serviços iniciarem (15 segundos)...${NC}"
sleep 15

# Verificar logs de erro
echo ""
echo -e "${CYAN}🔍 Verificando logs recentes...${NC}"
echo ""

services=("keycloak" "carrier-service" "order-service" "user-service")
for service in "${services[@]}"; do
    echo -e "${YELLOW}--- $service ---${NC}"
    docker logs $service --tail 5 2>&1 | tail -n 5
    echo ""
done

echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}✅ Rebuild completo!${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "${CYAN}🌐 Serviços disponíveis:${NC}"
echo -e "  - Keycloak: http://localhost:8083"
echo -e "  - Carrier Service: http://localhost:8080"
echo -e "  - Order Service: http://localhost:8081"
echo -e "  - User Service: http://localhost:8082"
echo ""
echo -e "${GRAY}💡 Para ver logs de um serviço específico:${NC}"
echo -e "${GRAY}   docker logs <service-name> -f${NC}"
echo ""

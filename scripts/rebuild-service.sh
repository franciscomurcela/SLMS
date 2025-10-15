#!/bin/bash
# ========================================
# Script: Rebuild Single Service
# Description: Para, reconstrói (sem cache) e inicia um serviço específico
# Usage: ./rebuild-service.sh <service-name>
# Example: ./rebuild-service.sh order-service
# ========================================

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Check if service name is provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Erro: Nome do serviço não fornecido!${NC}"
    echo -e "${YELLOW}Uso: ./rebuild-service.sh <service-name>${NC}"
    echo -e "${GRAY}Exemplo: ./rebuild-service.sh order-service${NC}"
    exit 1
fi

SERVICE_NAME=$1

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  SLMS - Rebuild Service: $SERVICE_NAME${NC}"
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

# Step 1: Parar o serviço
echo -e "${YELLOW}[1/3] 🛑 Parando $SERVICE_NAME...${NC}"
docker-compose stop $SERVICE_NAME
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Aviso: Serviço pode não estar a correr${NC}"
else
    echo -e "${GREEN}✅ Serviço parado!${NC}"
fi
echo ""

# Step 2: Rebuild sem cache
echo -e "${YELLOW}[2/3] 🔨 Reconstruindo $SERVICE_NAME (sem cache)...${NC}"
docker-compose build --no-cache $SERVICE_NAME

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao reconstruir o serviço!${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Build completado!${NC}"
fi
echo ""

# Step 3: Iniciar o serviço
echo -e "${YELLOW}[3/3] 🚀 Iniciando $SERVICE_NAME...${NC}"
docker-compose up -d $SERVICE_NAME

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao iniciar o serviço!${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Serviço iniciado!${NC}"
fi
echo ""

# Aguardar alguns segundos
echo -e "${GRAY}⏳ Aguardando serviço iniciar (10 segundos)...${NC}"
sleep 10

# Verificar logs
echo ""
echo -e "${CYAN}🔍 Logs recentes de $SERVICE_NAME:${NC}"
docker logs $SERVICE_NAME --tail 20
echo ""

echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}✅ Rebuild de $SERVICE_NAME completo!${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "${GRAY}💡 Para ver logs em tempo real:${NC}"
echo -e "${GRAY}   docker logs $SERVICE_NAME -f${NC}"
echo ""

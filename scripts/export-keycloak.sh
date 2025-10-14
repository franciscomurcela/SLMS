#!/bin/bash

# Export Keycloak Realm Configuration
# This script exports the ESg204 realm configuration including users and roles

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}🔐 Exportando configuração do Keycloak...${NC}"

# Step 1: Create temporary export directory in container
echo -e "\n${YELLOW}📁 Criando diretório temporário...${NC}"
docker exec keycloak mkdir -p /tmp/keycloak-export

# Step 2: Export realm with users
echo -e "\n${YELLOW}📤 Exportando realm ESg204...${NC}"
docker exec keycloak /opt/keycloak/bin/kc.sh export \
    --dir /tmp/keycloak-export \
    --realm ESg204 \
    --users realm_file

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao exportar realm!${NC}"
    exit 1
fi

# Step 3: Copy exported file to project
echo -e "\n${YELLOW}📋 Copiando ficheiro para o projeto...${NC}"
docker cp keycloak:/tmp/keycloak-export/ESg204-realm.json slms-backend/keycloak-init/ESg204-realm.json

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao copiar ficheiro!${NC}"
    exit 1
fi

# Step 4: Clean up temporary directory
echo -e "\n${YELLOW}🧹 Limpando ficheiros temporários...${NC}"
docker exec keycloak rm -rf /tmp/keycloak-export

# Step 5: Show file info
echo -e "\n${GREEN}✅ Export concluído com sucesso!${NC}"
echo -e "\n${CYAN}Informações do ficheiro:${NC}"
ls -lh slms-backend/keycloak-init/ESg204-realm.json

# Step 6: Show git status
echo -e "\n${CYAN}Estado no Git:${NC}"
git status slms-backend/keycloak-init/ESg204-realm.json

echo -e "\n${YELLOW}📝 Próximos passos:${NC}"
echo "1. Rever as mudanças: git diff slms-backend/keycloak-init/ESg204-realm.json"
echo "2. Adicionar ao stage: git add slms-backend/keycloak-init/ESg204-realm.json"
echo "3. Commit: git commit -m 'feat: update Keycloak realm with user roles configuration'"
echo "4. Push: git push origin user-roles"
echo ""

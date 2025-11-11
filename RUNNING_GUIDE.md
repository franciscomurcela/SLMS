# 🚀 Guia de Execução do Projeto

Este guia explica como executar o projeto **SLMS (Shipping & Logistics Management System)** tanto localmente (desenvolvimento) como na cloud Azure (produção).

---

## 📋 Índice

1. [Pré-requisitos](#-pré-requisitos)
2. [Execução Local (Desenvolvimento)](#-execução-local-desenvolvimento)
3. [Deploy na Cloud Azure](#-deploy-na-cloud-azure)
4. [Variáveis de Ambiente](#-variáveis-de-ambiente)
5. [Troubleshooting](#-troubleshooting)

---

## 🛠️ Pré-requisitos

### **Para Desenvolvimento Local:**
- ✅ Docker Desktop instalado e a correr
- ✅ Node.js 20+ e npm
- ✅ Git
- ✅ Editor de código (VS Code recomendado)

### **Para Deploy na Cloud:**
- ✅ Conta Azure ativa
- ✅ Azure CLI instalado
- ✅ Terraform 1.6.0+
- ✅ Acesso ao repositório GitHub

---

## 💻 Execução Local (Desenvolvimento)

### **1. Clone do Repositório**
```bash
git clone https://github.com/detiuaveiro/group-project-es2526_204.git
cd group-project-es2526_204
git checkout migration-merge
```

### **2. Configurar Variáveis de Ambiente**

#### **2.1. Frontend**
```bash
cd react-frontend/frontend
cp .env.example .env.local
```

Editar `.env.local` com as tuas chaves:
```bash
# Keycloak (local Docker)
VITE_KEYCLOAK_URL=http://localhost:8083/auth

# Backend (local Docker)
VITE_BACKEND_URL=http://localhost

# Google Maps API Key (obter em: https://console.cloud.google.com/google/maps-apis/)
VITE_GOOGLE_MAPS_API_KEY=sua_google_maps_api_key_aqui

# Flagsmith (Feature Flags)
VITE_FLAGSMITH_ENVIRONMENT_KEY=sua_flagsmith_key_aqui
```

#### **2.2. Backend**
```bash
cd ../../slms-backend
cp .env.example .env
```

Editar `.env` com as credenciais da BD local:
```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:54322/postgres
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=postgres

DB_HOST=localhost
DB_PORT=54322
DB_NAME=postgres
DB_USER=postgres
DB_PASS=postgres
```

### **3. Iniciar Serviços Backend (Docker Compose)**

#### **3.1. Base de Dados (Supabase)**
```bash
cd slms-backend/authentication_service
docker-compose -f docker-compose.supabase.yml up -d
```

Verificar se a BD está online:
```bash
docker ps | grep supabase
```

#### **3.2. Keycloak (Autenticação)**
```bash
cd slms-backend/authentication_service
docker-compose -f docker-compose.keycloak.yml up -d
```

Aceder ao Keycloak Admin Console:
- URL: http://localhost:8083/auth/admin
- User: `admin`
- Password: `admin`

#### **3.3. Microserviços Backend**
```bash
# User Service (porta 8082)
cd slms-backend/user_service
./mvnw spring-boot:run

# Carrier Service (porta 8080)
cd slms-backend/carrier_service/carrier_service
./mvnw spring-boot:run

# Order Service (porta 8081)
cd slms-backend/order_service/demo
./mvnw spring-boot:run
```

**Dica:** Abrir 3 terminais separados para cada serviço

### **4. Iniciar Frontend**
```bash
cd react-frontend/frontend
npm install
npm run dev
```

Frontend disponível em: **http://localhost:5173**

### **5. Testar o Sistema**

1. **Aceder ao Frontend:** http://localhost:5173
2. **Login:**
   - Criar utilizador ou usar existente
   - Realm: `ESg204`
3. **Funcionalidades:**
   - Gestão de carriers
   - Gestão de encomendas
   - Rotas de entrega (Google Maps)
   - Cargo manifest para drivers

---

## ☁️ Deploy na Cloud Azure

### **1. Configurar Terraform**

#### **1.1. Criar terraform.tfvars**
```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Editar `terraform.tfvars`:
```hcl
db_password            = "SuaPasswordSegura123!"
runner_admin_password  = "OutraPasswordSegura456!"
google_maps_api_key    = "sua_google_maps_api_key_aqui"
```

**⚠️ IMPORTANTE:** Nunca commitar este ficheiro! Já está no `.gitignore`

#### **1.2. Configurar GitHub Secrets**
No repositório GitHub, ir a **Settings → Secrets and variables → Actions** e adicionar:

| Secret Name | Descrição | Exemplo |
|-------------|-----------|---------|
| `TF_VAR_DB_PASSWORD` | Password do PostgreSQL | `SuaPasswordSegura123!` |
| `TF_VAR_RUNNER_ADMIN_PASSWORD` | Password da VM runner | `OutraPasswordSegura456!` |
| `TF_VAR_GOOGLE_MAPS_API_KEY` | Google Maps API Key | `AIzaSy...` |
| `AZURE_SUBSCRIPTION_ID` | ID da subscription Azure | `12345678-...` |
| `ACR_NAME` | Nome do Container Registry | `slmsacrhw30bk` |
| `RESOURCE_GROUP` | Nome do resource group | `slms-rg-hw30bk` |

### **2. Deploy Automático via CI/CD**

#### **2.1. Fazer Push para a Branch**
```bash
git add .
git commit -m "feat: Add new features"
git push origin migration-merge
```

#### **2.2. Workflow Automático**
O GitHub Actions executará automaticamente:

1. **CI (Continuous Integration):**
   - Build do backend (Java 17/21)
   - Testes unitários
   - Build do frontend (React + TypeScript)
   - Geração de relatórios Allure

2. **CD (Continuous Deployment):**
   - Build das Docker images
   - Push para Azure Container Registry
   - Terraform apply (provisioning de infraestrutura)
   - Deploy dos Container Apps

#### **2.3. Verificar Deploy**
- **GitHub Actions:** https://github.com/detiuaveiro/group-project-es2526_204/actions
- **Frontend URL:** https://slms-frontend.calmglacier-aaa99a56.francecentral.azurecontainerapps.io
- **Keycloak URL:** https://slms-keycloak.calmglacier-aaa99a56.francecentral.azurecontainerapps.io/auth

### **3. Deploy Manual (Alternativo)**

#### **3.1. Login no Azure**
```bash
az login
az account set --subscription <SUBSCRIPTION_ID>
```

#### **3.2. Build e Push Docker Images**
```bash
# Login no ACR
az acr login --name slmsacrhw30bk

# Build e push backend
cd slms-backend/user_service
docker build -t slmsacrhw30bk.azurecr.io/slms-backend:latest .
docker push slmsacrhw30bk.azurecr.io/slms-backend:latest

# Build e push carrier service
cd ../carrier_service/carrier_service
docker build -t slmsacrhw30bk.azurecr.io/slms-carrier-service:latest .
docker push slmsacrhw30bk.azurecr.io/slms-carrier-service:latest

# Build e push order service
cd ../order_service/demo
docker build -t slmsacrhw30bk.azurecr.io/slms-order-service:latest .
docker push slmsacrhw30bk.azurecr.io/slms-order-service:latest

# Build e push frontend
cd ../../../react-frontend/frontend
docker build -t slmsacrhw30bk.azurecr.io/slms-frontend:latest .
docker push slmsacrhw30bk.azurecr.io/slms-frontend:latest
```

#### **3.3. Terraform Apply**
```bash
cd terraform
terraform init
terraform plan
terraform apply -auto-approve
```

#### **3.4. Obter URLs dos Serviços**
```bash
terraform output frontend_url_https
terraform output keycloak_url
```

---

## 🔧 Variáveis de Ambiente

### **Frontend (.env.local para local)**

| Variável | Obrigatória | Descrição | Local | Cloud |
|----------|-------------|-----------|-------|-------|
| `VITE_KEYCLOAK_URL` | Sim | URL do Keycloak | `http://localhost:8083/auth` | Auto (default cloud) |
| `VITE_BACKEND_URL` | Não | URL do backend | `http://localhost` | Auto (nginx proxy) |
| `VITE_GOOGLE_MAPS_API_KEY` | Sim* | Google Maps API Key | Definir em `.env.local` | Via Terraform |
| `VITE_FLAGSMITH_ENVIRONMENT_KEY` | Sim | Flagsmith Feature Flags | Definir em `.env.local` | Via Terraform |

**\* Obrigatória** apenas se quiser usar a funcionalidade de rotas de entrega

### **Backend (.env para local)**

| Variável | Obrigatória | Descrição | Local | Cloud |
|----------|-------------|-----------|-------|-------|
| `SPRING_DATASOURCE_URL` | Sim | JDBC URL PostgreSQL | `jdbc:postgresql://localhost:54322/postgres` | Via Azure |
| `SPRING_DATASOURCE_USERNAME` | Sim | Username da BD | `postgres` | Via Terraform |
| `SPRING_DATASOURCE_PASSWORD` | Sim | Password da BD | `postgres` | Via Terraform secret |

### **Terraform (terraform.tfvars para cloud)**

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `db_password` | Sim | Password do PostgreSQL Azure |
| `runner_admin_password` | Sim | Password da VM do GitHub Runner |
| `google_maps_api_key` | Não | Google Maps API Key (feature opcional) |
| `image_tag` | Não | Tag Docker (default: `latest`) |

---

## 🐛 Troubleshooting

### **Problema: Frontend não carrega (infinite loading)**
**Solução:**
1. Verificar se Keycloak está online: `docker ps | grep keycloak`
2. Verificar URL do Keycloak em `.env.local`
3. Limpar cache do browser (Ctrl+Shift+Del)

### **Problema: Erro 502 Bad Gateway**
**Solução:**
1. Verificar se todos os microserviços estão a correr
2. Verificar portas: 8080 (carrier), 8081 (order), 8082 (user)
3. Verificar logs: `docker logs <container_id>`

### **Problema: Google Maps não carrega**
**Solução:**
1. Verificar se `VITE_GOOGLE_MAPS_API_KEY` está configurada
2. Verificar se Google Maps API está ativada no Google Cloud Console
3. Verificar se billing está configurado (necessário para Google Maps)

### **Problema: Terraform apply falha**
**Solução:**
1. Verificar se já fez `az login`
2. Verificar se subscription está correta
3. Verificar quotas do Azure: `az vm list-usage --location francecentral`

### **Problema: CD Pipeline falha**
**Solução:**
1. Verificar se todos os GitHub Secrets estão configurados
2. Verificar logs no GitHub Actions
3. Verificar se runner da VM está online

### **Problema: Base de dados não inicia**
**Solução:**
```bash
# Parar todos os containers
docker-compose down -v

# Remover volumes antigos
docker volume prune

# Iniciar novamente
docker-compose -f docker-compose.supabase.yml up -d
```

---

## 📚 Documentação Adicional

- **Keycloak Setup:** `slms-backend/authentication_service/README.md`
- **Terraform Guide:** `terraform/README.md`
- **Frontend Testing:** `react-frontend/frontend/TESTING.md`
- **Allure Reports:** `slms-backend/README-ALLURE.md`

---

## 🎯 Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                        │
│  localhost:5173 (local) / Azure Container App (cloud)       │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
│   User       │ │  Carrier   │ │   Order    │
│  Service     │ │  Service   │ │  Service   │
│  :8082       │ │   :8080    │ │   :8081    │
└───────┬──────┘ └─────┬──────┘ └─────┬──────┘
        │               │               │
        └───────────────┼───────────────┘
                        │
                ┌───────▼────────┐
                │   PostgreSQL   │
                │  (Supabase)    │
                │    :54322      │
                └────────────────┘

              ┌─────────────────┐
              │    Keycloak     │
              │  (Auth Server)  │
              │     :8083       │
              └─────────────────┘
```

---

## 👥 Equipa & Contactos

- **Grupo:** ES2526_204
- **Repositório:** https://github.com/detiuaveiro/group-project-es2526_204
- **Branch Principal:** `migration-merge`

---

**Última atualização:** 11 de Novembro de 2025

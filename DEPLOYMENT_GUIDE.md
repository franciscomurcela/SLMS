# 🚀 SLMS Deployment Guide - Azure with Terraform

## 📋 Overview

Este projeto agora utiliza **Terraform** para deployment automatizado na Azure, com CI/CD totalmente integrado através de GitHub Actions.

## 🏗️ Arquitetura de CI/CD

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Repository                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌────────────────┐
│   CI.yml     │ │ deploy.yml   │ │   cd.yml       │
│              │ │              │ │                │
│ • Tests      │ │ • Docker     │ │ • Local Dev    │
│ • Lint       │ │ • Terraform  │ │ • Allure       │
│ • Allure     │ │ • Azure      │ │ (Manual only)  │
└──────┬───────┘ └──────┬───────┘ └────────────────┘
       │                │
       │ Success        │
       └────────►───────┘
                │
                ▼
        ┌───────────────────┐
        │   204_runner      │
        │   (Azure VM)      │
        │                   │
        │ • Managed ID      │
        │ • Docker          │
        │ • Terraform       │
        │ • Azure CLI       │
        └─────────┬─────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │   Azure Resources   │
        │                     │
        │ • ACR               │
        │ • Container Apps    │
        │ • PostgreSQL        │
        │ • Storage           │
        │ • Keycloak          │
        └─────────────────────┘
```

## 🔄 Workflows Explicados

### 1️⃣ **CI Workflow** (`ci.yml`)

**Trigger:** Push/PR em qualquer branch  
**Runner:** `self-hosted` (qualquer runner disponível)

**Responsabilidades:**
- ✅ Executar testes unitários (backend + frontend)
- ✅ Executar testes E2E (Cypress)
- ✅ Lint e análise estática (Checkstyle, ESLint)
- ✅ Gerar relatórios Allure
- ✅ Upload de artefactos (allure-results)

**Java Strategy:**
```yaml
matrix:
  java: [17, 21]
```
- Java 17: user_service, carrier_service
- Java 21: order_service

**Output:** ✅ Testes passaram → Dispara deploy.yml

---

### 2️⃣ **Deploy Workflow** (`deploy.yml`) - **PRINCIPAL**

**Trigger:**  
- Automaticamente após CI passar (branches: `cd-test`, `master`)
- Manualmente via workflow_dispatch

**Runner:** `[self-hosted, 204_runner]` (VM Azure específica)

**Responsabilidades:**

#### Fase 1: Build & Push Docker Images
```bash
🏗️ Build slms-backend (user_service)
🏗️ Build slms-carrier-service
🏗️ Build slms-order-service  
🏗️ Build slms-frontend
📤 Push para ACR (Azure Container Registry)
```

#### Fase 2: Terraform Deploy
```bash
🔐 Login Azure (Managed Identity)
📋 Terraform init
📋 Terraform plan
✅ Terraform apply (provisiona/atualiza infraestrutura)
```

#### Fase 3: Outputs
```bash
🌐 Frontend URL: https://slms-frontend.xxx.azurecontainerapps.io
🔑 Keycloak URL: https://slms-keycloak.xxx.azurecontainerapps.io
```

**Autenticação:**
- ✅ **Managed Identity** (sem passwords!)
- ✅ Permissions: Contributor + AcrPush
- ✅ Automático via `az login --identity`

---

### 3️⃣ **CD Workflow** (`cd.yml`) - **LEGACY**

**Trigger:** Apenas manual (`workflow_dispatch`)  
**Runner:** `self-hosted` (desenvolvimento local)

**Responsabilidades:**
- 🐳 Deploy local com docker-compose
- 📊 Container Allure para visualização de testes
- 🔧 Desenvolvimento e debugging

**Nota:** Este workflow **NÃO** é mais usado para production! Apenas para desenvolvimento local.

---

## 🎯 Fluxo Completo de Deployment

### Cenário: Push para branch `cd-test`

```
1. Developer faz push
   git push origin cd-test

2. CI Workflow inicia automaticamente
   ├─ Backend tests (Java 17 + 21)
   ├─ Frontend tests (unit + E2E)
   ├─ Lint & Static Analysis
   └─ ✅ Success → Upload Allure artifacts

3. Deploy Workflow dispara automaticamente
   ├─ 🔐 Azure login (Managed Identity)
   ├─ 🏗️  Build Docker images (4 serviços)
   ├─ 📤 Push to ACR
   ├─ 📋 Terraform plan
   ├─ ✅ Terraform apply
   └─ 🌐 Output: Frontend URL

4. Infraestrutura Azure atualizada
   ├─ Container Apps restart com novas imagens
   ├─ Database migrations (se necessário)
   └─ ✅ Deployment completo!

5. Verificação
   ├─ Aceder ao Frontend URL
   ├─ Verificar logs: az containerapp logs
   └─ Testar funcionalidades
```

---

## 🔧 Setup Inicial

### 1. Configurar Secrets no GitHub

Acede a: `Settings → Secrets and variables → Actions`

**Secrets necessários:**
```
ACR_NAME                    = Nome do Azure Container Registry
RESOURCE_GROUP              = slms-rg
TF_VAR_DB_PASSWORD          = Password segura para PostgreSQL
TF_VAR_RUNNER_ADMIN_PASSWORD= Password segura para VM admin
```

### 2. Configurar Runner Azure (204_runner)

O teu colega já configurou este runner! Ele tem:
- ✅ Docker instalado
- ✅ Azure CLI instalado
- ✅ Terraform instalado
- ✅ Managed Identity configurada
- ✅ Permissions: Contributor + AcrPush
- ✅ Label: `204_runner`

**Para verificar:**
```bash
# SSH na VM
ssh azureuser@<RUNNER_PUBLIC_IP>

# Verificar instalações
docker --version
az --version
terraform --version

# Verificar Managed Identity
az login --identity
az account show
```

### 3. Inicializar Terraform (Primeira Vez)

```bash
cd terraform

# Copiar template de variáveis
cp terraform.tfvars.example terraform.tfvars

# Editar com valores reais (NÃO commitar!)
nano terraform.tfvars

# Inicializar Terraform
terraform init

# Ver plano
terraform plan

# Aplicar (primeira vez pode ser manual)
terraform apply
```

---

## 📊 Monitoring & Debugging

### Ver Logs das Container Apps

```bash
# Frontend
az containerapp logs show \
  --name slms-frontend \
  --resource-group slms-rg \
  --follow

# Backend (user_service)
az containerapp logs show \
  --name slms-backend \
  --resource-group slms-rg \
  --follow

# Carrier Service
az containerapp logs show \
  --name slms-carrier-service \
  --resource-group slms-rg \
  --follow
```

### Ver Estado do Terraform

```bash
cd terraform
terraform show
terraform state list
terraform output
```

### Ver Relatórios Allure Localmente

```bash
# Iniciar container Allure (após CI executar)
cd slms-backend
docker-compose -f docker-compose.allure.yml up -d

# Aceder a http://localhost:8080
```

---

## 🐛 Troubleshooting

### Problema: Deploy falha com "Image not found"

**Causa:** ACR ainda não tem a imagem  
**Solução:**
```bash
# Verificar imagens no ACR
az acr repository list --name <ACR_NAME>

# Rebuild manualmente se necessário
cd slms-backend/user_service
docker build -t <ACR_NAME>.azurecr.io/slms-backend:latest .
az acr login --name <ACR_NAME> --identity
docker push <ACR_NAME>.azurecr.io/slms-backend:latest
```

### Problema: Terraform state lock

**Causa:** Deployment anterior não terminou corretamente  
**Solução:**
```bash
cd terraform
terraform force-unlock <LOCK_ID>
```

### Problema: Managed Identity sem permissões

**Causa:** Role assignments não configuradas  
**Solução:**
```bash
# Obter Principal ID da VM
PRINCIPAL_ID=$(az vm identity show \
  --name slms-runner-vm \
  --resource-group slms-rg \
  --query principalId -o tsv)

# Adicionar Contributor
az role assignment create \
  --assignee $PRINCIPAL_ID \
  --role Contributor \
  --scope /subscriptions/<SUB_ID>/resourceGroups/slms-rg

# Adicionar AcrPush
az role assignment create \
  --assignee $PRINCIPAL_ID \
  --role AcrPush \
  --scope /subscriptions/<SUB_ID>/resourceGroups/slms-rg/providers/Microsoft.ContainerRegistry/registries/<ACR_NAME>
```

### Problema: Container App não inicia

**Causa:** Variáveis de ambiente incorretas ou imagem com erro  
**Solução:**
```bash
# Ver revisões
az containerapp revision list \
  --name slms-backend \
  --resource-group slms-rg

# Ver detalhes da última revisão
az containerapp revision show \
  --name slms-backend--<REVISION> \
  --resource-group slms-rg

# Ver logs para debug
az containerapp logs show \
  --name slms-backend \
  --resource-group slms-rg \
  --tail 100
```

---

## 🔐 Segurança

### O que está protegido:

✅ **Passwords nunca em código**
- DB password → GitHub Secret → Container App Secret
- ACR credentials → Managed automaticamente pelo Terraform

✅ **Managed Identity**
- VM runner não precisa de credentials
- Autenticação automática com Azure

✅ **Network Security**
- Backend/Services são internos (sem acesso público)
- Apenas Frontend e Keycloak expostos
- PostgreSQL firewall configurado

✅ **Terraform State**
- `.gitignore` configurado
- State files **nunca** em Git
- Considerar usar Azure Storage backend para state partilhado

---

## 📚 Estrutura de Branches

```
master (main)
├─ cd-test              ← Branch atual (teu trabalho)
│  └─ CI/CD completo com Terraform
│
└─ local-setup          ← Branch do colega
   └─ Terraform + Runner Azure
```

**Estratégia de merge:**
1. Testar completamente em `cd-test`
2. Criar PR para `master`
3. Após aprovação → merge
4. `master` é a fonte de verdade para production

---

## ✅ Checklist de Deployment

Antes de fazer push:

- [ ] Testes locais passam
- [ ] `.env` files não estão commitados
- [ ] `terraform.tfvars` não está commitado
- [ ] Secrets estão configurados no GitHub
- [ ] Runner 204_runner está online
- [ ] Branch está atualizada com base

Após push:

- [ ] CI passa todos os testes
- [ ] Deploy workflow completa sem erros
- [ ] Frontend URL está acessível
- [ ] Backend APIs respondem
- [ ] Keycloak está funcional
- [ ] Logs não mostram erros críticos

---

## 🎓 Recursos Adicionais

- 📖 [Terraform README](./terraform/README.md) - Documentação detalhada do Terraform
- 📖 [Azure Container Apps Docs](https://learn.microsoft.com/en-us/azure/container-apps/)
- 📖 [GitHub Actions Self-hosted Runners](https://docs.github.com/en/actions/hosting-your-own-runners)
- 📖 [IaC Best Practices](./ES_07_IaC.pdf) - Slides da cadeira

---

## 👥 Equipa

- **CI/CD & Allure:** Tu (branch `cd-test`)
- **Terraform & Azure Runner:** Teu colega (branch `local-setup`)
- **Integration:** Ambos (este guia!)

---

**Última atualização:** 8 Novembro 2025  
**Versões:** Terraform 1.6.0 | Azure CLI 2.x | Docker 24.x

# CD Workflow - Azure Deployment Pipeline

## 📋 Visão Geral

O workflow **CD (Continuous Deployment)** automatiza a construção, teste e deployment de toda a infraestrutura e aplicações no Azure. É acionado automaticamente quando há um push para as branches `cd-test` ou `main`.

---

## 🚀 Fluxo Completo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. PUSH para cd-test / main                                 │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. wait-for-ci: Espera CI completar (30 minutos max)       │
│    - Valida que todos os testes passaram                     │
│    - Se CI falhar → CD falha                                 │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. build-and-deploy-azure: Executa no Runner 204            │
│    (Ubuntu Linux self-hosted runner com Azure CLI/Docker)    │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
         ┌─────────────┴────────────────────────────────────┐
         │                                                   │
    A. CONSTRUIR & PUSH IMAGENS               B. TERRAFORM
         │                                                   │
    ┌────┴─────┐                           ┌──────────────────────┐
    │           │                           │                      │
    ↓           ↓                           ↓                      ↓
┌─────────┐ ┌─────────┐            ┌────────────┐      ┌──────────────┐
│Backend  │ │Carrier  │ ...        │Init State  │      │Plan: 4 apps  │
│Service  │ │Service  │            │from Azure  │      │to deploy     │
└────┬────┘ └────┬────┘            └────────────┘      └──────────────┘
     │            │                         ↓                    ↓
     └────┬───────┘                   ┌──────────────────────────────┐
          │                           │ Apply: Cria/atualiza todos   │
          ↓                           │ - Container Apps             │
      ACR Push                        │ - Databases                  │
    (slmsacrhw30bk)                  │ - Storage                    │
                                     │ - Logs                       │
                                     └──────────────────────────────┘
                       ↓
         ┌─────────────────────────────────────┐
         │ SUCCESS: Outputs com URLs dos apps  │
         └─────────────────────────────────────┘
```

---

## 🔐 Fase 1: Autenticação & Validação

### 1.1 Verificar Runner
```bash
echo "🔍 Runner Name: $RUNNER_NAME"
echo "🔍 Runner OS: $RUNNER_OS"
```
- Valida que está no runner correto (`es2526-204`)
- Verifica Azure CLI, Docker e Terraform instalados
- **Por quê?** O CD precisa dessas ferramentas

### 1.2 Login Azure (Managed Identity)
```bash
az login --identity
az acr login --name slmsacrhw30bk
```
- Usa Managed Identity do runner (sem credenciais expostas)
- Autentica no novo ACR
- **Por quê?** Segurança - credenciais não ficam em texto

---

## 🏗️ Fase 2: Build & Push Docker Images

### 2.1 Backend (user_service)
```bash
cd slms-backend/user_service
docker build -t slmsacrhw30bk.azurecr.io/slms-backend:${{ github.sha }} .
docker push slmsacrhw30bk.azurecr.io/slms-backend:${{ github.sha }}
```

**O que acontece:**
- Build: Maven compila o código Java com `mvn clean package`
- Multi-stage: Resultado é uma imagem otimizada (~500MB)
- Tag: usa o commit SHA (ex: `1b85a62c5839460b069f43a558fac14c9a2b95cd`)
- Push: envia para Azure Container Registry

**Por quê tag = commit SHA?**
- Rastreabilidade: cada imagem está ligada a um commit específico
- Versioning: fácil rollback se necessário
- Deployment: Terraform usa esta tag para saber qual imagem usar

### 2.2 Carrier Service, Order Service, Frontend
Mesmo processo, mas com Dockerfiles diferentes:
- **Carrier**: Maven + Java 17
- **Order**: Maven + Java 21  
- **Frontend**: Node 20 + React + Nginx

**Diagrama de Tempos:**
```
Backend:    ████████ 1-2 min (compile Java)
Carrier:    ███████ 1-2 min (compile Java)
Order:      ████████ 2-3 min (compile Java 21)
Frontend:   ███████████████ 8-10 min (npm install + build)
            ==========================================
            TOTAL: ~15-20 minutos
```

---

## 🏛️ Fase 3: Terraform - Infraestrutura como Código

### O que é Terraform?

**Terraform** é uma ferramenta que descreve infraestrutura em código (IaC). Em vez de clicares no Azure Portal, declaras o que queres no ficheiro `main.tf`:

```hcl
resource "azurerm_container_app" "backend" {
  name                = "slms-backend"
  resource_group_name = azurerm_resource_group.rg.name
  # ... mais configurações
}
```

### 3.1 Terraform Init
```bash
cd terraform
terraform init
```

**O que faz:**
- Descarrega os providers (azurerm, random, time)
- Conecta ao backend de state no Azure Storage
- Valida a configuração

**State = Base de dados do Terraform:**
```
Azure Storage Account: tfstateslms204
  └─ Container: tfstate
     └─ Ficheiro: slms.tfstate (JSON)
        └─ Registo de TODOS os recursos criados
```

**Por quê state remoto?**
- Multiple runners podem fazer apply em paralelo
- Sem perder sincronização
- Backup automático no Azure

### 3.2 Terraform Plan
```bash
terraform plan
```

**Saída típica:**
```
Plan: 4 to add, 0 to change, 0 to destroy.

Changes to Outputs:
  ~ backend_internal_url = "..." -> (known after apply)
  ~ frontend_url_https = "..." -> (known after apply)
```

**O que significa:**
- `4 to add`: vai criar 4 Container Apps (backend, carrier, order, frontend)
- `0 to change`: nenhum recurso existente será modificado
- `0 to destroy`: nenhum recurso será deletado

### 3.3 Terraform Apply
```bash
terraform apply -auto-approve
```

**O que acontece (sequência):**

1. **Cria Container App Environment** (1-2 minutos)
   - Precisa estar pronto antes dos apps

2. **Inicia time_sleep (15 segundos)**
   - Aguarda propagação no Azure
   - Evita race conditions

3. **Cria 4 Container Apps em paralelo** (5-10 minutos)
   ```
   azurerm_container_app.backend:      Criando...
   azurerm_container_app.carrier:      Criando...
   azurerm_container_app.order:        Criando...
   azurerm_container_app.frontend:     Criando...
   ```

4. **Cada Container App:**
   - Recebe a imagem Docker do ACR
   - Configura variáveis de ambiente
   - Abre ingress (porta 443 HTTPS)
   - Conecta à rede virtual

5. **Atualiza Outputs**
   ```
   Outputs:
     frontend_url_https = "https://slms-frontend.calmglacier-aaa99a56.francecentral.azurecontainerapps.io"
     keycloak_url = "https://slms-keycloak.calmglacier-aaa99a56.francecentral.azurecontainerapps.io/auth"
   ```

### 3.4 Recursos criados pelo Terraform

```
┌─ Resource Group: slms-rg
│  ├─ Container App Environment: slms-container-env
│  ├─ Container Apps:
│  │  ├─ slms-backend (porta 8081)
│  │  ├─ slms-carrier-service (porta 8080)
│  │  ├─ slms-order-service (porta 8080)
│  │  └─ slms-frontend (porta 80/443)
│  ├─ PostgreSQL: slms-postgresql-w4g0rt
│  ├─ Storage: slmsstoragesli7k5
│  ├─ Azure Container Registry: slmsacrhw30bk
│  └─ Log Analytics: slms-logs-7s3ogf
└─ Virtual Network: slms-vnet
```

### 3.5 Networking (configurado pelo Terraform)

```
┌─ Azure Virtual Network (slms-vnet)
│  └─ Subnet (slms-subnet / 10.0.0.0/24)
│     └─ Container App Environment
│        ├─ slms-backend (10.0.0.x)
│        ├─ slms-carrier-service (10.0.0.y)
│        ├─ slms-order-service (10.0.0.z)
│        └─ slms-frontend (10.0.0.w)
│           └─ Expõe ingress público (HTTPS)
│
└─ DNS interno: Container Apps convertem nomes
   ├─ slms-carrier-service → 10.0.0.y (DNS resolver)
   ├─ slms-order-service → 10.0.0.z
   └─ slms-user-service → 10.0.0.x (keycloak)
```

**Por quê isto é importante?**
- Frontend (nginx) consegue contactar backend por nome
- Tráfego interno não sai da rede virtual (seguro)
- Apenas frontend tem ingress público

---

## 📊 Variáveis do Terraform

| Variável | Valor | Origem | Propósito |
|----------|-------|--------|----------|
| `TF_VAR_image_tag` | `${{ github.sha }}` | GitHub Actions | Tag das imagens Docker (commit SHA) |
| `TF_VAR_db_password` | `${{ secrets.TF_VAR_DB_PASSWORD }}` | GitHub Secrets | Password do PostgreSQL |
| `TF_VAR_runner_admin_password` | `${{ secrets.TF_VAR_RUNNER_ADMIN_PASSWORD }}` | GitHub Secrets | Password do runner |

**Como o Terraform usa a image_tag:**
```hcl
resource "azurerm_container_app" "backend" {
  template {
    container {
      image = "${azurerm_container_registry.acr.login_server}/slms-backend:${var.image_tag}"
      # Exemplo real:
      # slmsacrhw30bk.azurecr.io/slms-backend:1b85a62c5839460b069f43a558fac14c9a2b95cd
    }
  }
}
```

---

## 🔄 Fase 4: Pós-Deploy

### 4.1 Obter URLs dos serviços
```bash
terraform output -raw frontend_url_https
terraform output -raw keycloak_url
```

**Outputs gerados:**
```
FRONTEND_URL=https://slms-frontend.calmglacier-aaa99a56.francecentral.azurecontainerapps.io
KEYCLOAK_URL=https://slms-keycloak.calmglacier-aaa99a56.francecentral.azurecontainerapps.io/auth
```

### 4.2 Download de Artifacts (Allure Reports)
- Tenta fazer download dos resultados de testes do CI
- **Problema atual:** não está a encontrar (workflows separados)

### 4.3 Comentário no Commit
```markdown
## ✅ Azure Deployment success

**Frontend URL:** https://slms-frontend.calmglacier-aaa99a56.francecentral.azurecontainerapps.io
**Keycloak URL:** https://slms-keycloak.../auth
**Commit:** 1b85a62c5839460b069f43a558fac14c9a2b95cd
**Branch:** cd-test
```

---

## ⏱️ Timeline Típico

```
00:00 - Push para cd-test
00:05 - CI workflow completa (testes passaram)
00:10 - CD workflow inicia
00:15 - Login Azure + build backend (2 min)
00:17 - Build carrier + order (2 min cada)
00:21 - Build frontend (9 min - npm install é lento)
00:30 - Push de todas as 4 imagens para ACR (2 min)
00:32 - Terraform init (1 min)
00:33 - Terraform plan (1 min)
00:34 - Terraform apply inicia
00:36 - Container Apps a serem criadas (5-10 min)
00:45 - Deploy completo ✅
```

---

## 🐛 Troubleshooting

### Erro: "ACR login failed"
- ❌ Secret `ACR_NAME` desatualizado
- ✅ Solução: Atualizar secret no GitHub com nome do novo ACR

### Erro: "Image not found in ACR"
- ❌ Imagens não foram feitas push
- ✅ Solução: Verificar se o build concluiu com sucesso

### Erro: "Container App already exists"
- ❌ Terraform state desincronizado com Azure
- ✅ Solução: `terraform import` ou deletar o app e re-criar

### Erro: "Provisioning failed"
- ❌ Imagem tem erros de runtime (ex: aplicação não arranca)
- ✅ Solução: Verificar logs com `az containerapp logs show`

---

## 📝 Ficheiros Importantes

```
├── .github/workflows/cd.yml          # Este workflow
├── terraform/
│  ├── main.tf                        # Definição dos recursos
│  ├── variables.tf                   # Variáveis do Terraform
│  ├── outputs.tf                     # Outputs (URLs, etc)
│  └── terraform.tfvars              # Valores concretos
├── slms-backend/user_service/Dockerfile
├── slms-backend/carrier_service/carrier_service/Dockerfile
├── slms-backend/order_service/demo/Dockerfile
└── react-frontend/frontend/Dockerfile
```

---

## 🎯 Resumo Final

| Fase | Tempo | Responsabilidade | Output |
|------|-------|------------------|--------|
| Wait for CI | 0-30 min | CI passa testes | ✅ Testes validados |
| Build & Push Images | 15-20 min | Docker build | 4 imagens no ACR |
| Terraform Init | 1-2 min | Setup state | State sincronizado |
| Terraform Plan | 1-2 min | Validação | Plan aprovado |
| Terraform Apply | 10-15 min | Deployment | Infraestrutura criada |
| **TOTAL** | **~45 minutos** | **Fully automated** | **Production ready** ✅ |


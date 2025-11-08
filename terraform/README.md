# 🚀 Terraform Infrastructure - SLMS Azure Deployment

## 📋 Visão Geral

Esta configuração Terraform provisiona toda a infraestrutura necessária para o SLMS (Shipping & Logistics Management System) na Azure, incluindo:

- **Azure Container Registry (ACR)** - Para armazenar imagens Docker
- **Azure Container Apps** - Para hospedar os microserviços
- **PostgreSQL Flexible Server** - Base de dados
- **Log Analytics Workspace** - Monitorização e logs
- **Storage Account** - Armazenamento de ficheiros
- **VM Runner** - Self-hosted GitHub Actions runner com Managed Identity

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                     Azure Resource Group                     │
│                         (slms-rg)                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐  ┌──────────────────┐                 │
│  │  Container Apps │  │   PostgreSQL     │                 │
│  │   Environment   │  │ Flexible Server  │                 │
│  └────────┬────────┘  └────────┬─────────┘                 │
│           │                     │                            │
│  ┌────────▼─────────────────────▼────────┐                 │
│  │        Container Apps:                 │                 │
│  │  • slms-frontend (Nginx)               │                 │
│  │  • slms-backend (Spring Boot)          │                 │
│  │  • slms-carrier-service                │                 │
│  │  • slms-order-service                  │                 │
│  │  • slms-keycloak (Auth)                │                 │
│  └────────────────────────────────────────┘                 │
│                                                               │
│  ┌───────────────────┐  ┌──────────────────┐               │
│  │ Container Registry│  │  Storage Account │               │
│  │      (ACR)        │  │   (Blob/Files)   │               │
│  └───────────────────┘  └──────────────────┘               │
│                                                               │
│  ┌────────────────────────────────────────┐                 │
│  │         VM Runner Stack                │                 │
│  │  ┌──────────────────────────────┐     │                 │
│  │  │  Linux VM (GitHub Runner)    │     │                 │
│  │  │  • Docker                     │     │                 │
│  │  │  • Azure CLI                  │     │                 │
│  │  │  • Terraform                  │     │                 │
│  │  │  • System Managed Identity    │     │                 │
│  │  └──────────────────────────────┘     │                 │
│  │  ┌──────────┐  ┌────────────────┐    │                 │
│  │  │  VNet    │  │  Public IP     │    │                 │
│  │  │  Subnet  │  │  (Static)      │    │                 │
│  │  └──────────┘  └────────────────┘    │                 │
│  └────────────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Estrutura de Ficheiros

```
terraform/
├── main.tf                    # Configuração principal dos recursos
├── variables.tf               # Definição de variáveis
├── outputs.tf                 # Outputs do Terraform
├── terraform.tfvars.example   # Template de variáveis (NÃO commitar o real!)
├── terraform.tfvars           # Valores das variáveis (GIT IGNORED!)
└── README.md                  # Esta documentação
```

## 🔧 Configuração Inicial

### 1. Pré-requisitos

- [Terraform](https://www.terraform.io/downloads) >= 1.6.0
- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
- Conta Azure com permissões adequadas
- GitHub repository com acesso aos secrets

### 2. Configurar Variáveis

Copia o ficheiro de exemplo e preenche os valores:

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edita `terraform.tfvars`:

```hcl
db_password             = "SUA_PASSWORD_SEGURA_POSTGRESQL"
runner_admin_password   = "SUA_PASSWORD_SEGURA_VM"
```

⚠️ **IMPORTANTE**: O ficheiro `terraform.tfvars` está no `.gitignore` - NUNCA faças commit dele!

### 3. Autenticar no Azure

```bash
az login
az account show
az account set --subscription "TUA_SUBSCRIPTION_ID"
```

## 🚀 Deployment

### Inicializar Terraform

```bash
cd terraform
terraform init
```

### Visualizar Plano

```bash
terraform plan
```

### Aplicar Configuração

```bash
terraform apply
```

Revê as alterações e confirma com `yes`.

### Verificar Outputs

Após deployment bem-sucedido:

```bash
terraform output
```

Outputs disponíveis:
- `frontend_url_https` - URL do frontend
- `backend_fqdn` - FQDN do backend
- `keycloak_url` - URL do Keycloak
- `acr_login_server` - ACR login server
- `db_host` - PostgreSQL host
- `runner_public_ip` - IP público da VM runner

## 🔄 GitHub Actions Integration

### Workflow: `deploy.yml`

Este workflow é **automaticamente disparado** após o CI passar com sucesso.

**Fluxo:**
1. ✅ CI executa testes
2. ✅ CI passa → Dispara `deploy.yml`
3. 🔐 Runner 204_runner autentica com Managed Identity
4. 🏗️ Build das imagens Docker (backend, carrier, order, frontend)
5. 📤 Push para ACR
6. 🌍 Terraform apply (provisiona/atualiza infraestrutura)
7. ✅ Deployment completo!

**Secrets Necessários no GitHub:**
- `ACR_NAME` - Nome do Azure Container Registry
- `RESOURCE_GROUP` - Nome do Resource Group
- `TF_VAR_DB_PASSWORD` - Password da base de dados
- `TF_VAR_RUNNER_ADMIN_PASSWORD` - Password do admin da VM

### Managed Identity

A VM runner usa **System-Assigned Managed Identity** com:
- **Contributor** no Resource Group
- **AcrPush** no Container Registry

Isto significa que **NÃO são necessárias credenciais** no runner - a autenticação é automática via:
```bash
az login --identity
az acr login --name $ACR_NAME --identity
```

## 📊 Monitorização

### Logs das Container Apps

```bash
# Ver logs do frontend
az containerapp logs show \
  --name slms-frontend \
  --resource-group slms-rg \
  --follow

# Ver logs do backend
az containerapp logs show \
  --name slms-backend \
  --resource-group slms-rg \
  --follow
```

### Log Analytics

Acede ao portal Azure → Log Analytics Workspace → Logs

Query exemplo:
```kusto
ContainerAppConsoleLogs_CL
| where ContainerAppName_s == "slms-frontend"
| order by TimeGenerated desc
| take 100
```

## 🛠️ Manutenção

### Atualizar Infraestrutura

```bash
# Fazer alterações em main.tf
terraform plan
terraform apply
```

### Destruir Recursos (⚠️ CUIDADO!)

```bash
terraform destroy
```

### Ver Estado Atual

```bash
terraform show
terraform state list
```

## 🔐 Segurança

### Secrets Management

- ✅ Passwords armazenadas como **secrets** nas Container Apps
- ✅ ACR credentials geridas automaticamente
- ✅ Managed Identity para autenticação sem passwords
- ✅ PostgreSQL apenas acessível via Azure services

### Network Security

- ✅ Backend/Services são **internos** (não expostos publicamente)
- ✅ Apenas Frontend e Keycloak têm ingress externo
- ✅ PostgreSQL com firewall configurado
- ✅ NSG na VM runner (apenas SSH permitido)

## 📝 Variáveis de Ambiente

### Container Apps

As seguintes variáveis são automaticamente injetadas:

**Backend:**
- `DB_URL` - Connection string PostgreSQL
- `DB_USERNAME` / `DB_PASSWORD` - Credenciais DB
- `SPRING_PROFILES_ACTIVE=prod`

**Carrier/Order Services:**
- Configurações de DB
- `KEYCLOAK_JWK_SET_URI` - Keycloak endpoint
- `KEYCLOAK_ISSUER_URI` - Issuer URI

**Frontend:**
- `API_URL` - URL do backend

## 🐛 Troubleshooting

### Erro: "Resource already exists"

```bash
# Importar recurso existente
terraform import azurerm_resource_group.rg /subscriptions/SUB_ID/resourceGroups/slms-rg
```

### Erro: "Managed Identity não tem permissões"

Verifica role assignments:
```bash
az role assignment list --assignee PRINCIPAL_ID
```

### Container App não inicia

```bash
# Ver revisões
az containerapp revision list \
  --name slms-backend \
  --resource-group slms-rg

# Ver detalhes da revisão
az containerapp revision show \
  --name slms-backend--REVISION \
  --resource-group slms-rg
```

## 📚 Recursos Adicionais

- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/)
- [PostgreSQL Flexible Server](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/)
- [Managed Identities](https://learn.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/)

## 👥 Suporte

Para questões ou problemas:
1. Verifica os logs das Container Apps
2. Verifica o GitHub Actions workflow
3. Consulta a documentação Azure
4. Contacta a equipa de DevOps

---

**Última atualização:** Novembro 2025
**Versão Terraform:** 1.6.0
**Azure Provider:** ~> 3.0

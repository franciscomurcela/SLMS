# 🚀 Migração para Terraform Completo (True IaC)

## 📋 Estado Atual vs Objetivo

### ❌ Estado Atual (Híbrido)
```
Data Sources (só leitura):
- Resource Group
- Container App Environment
- 5x Container Apps (backend, carrier, order, keycloak, frontend)
- VNet, Subnet, Public IP, NSG

Terraform Managed:
- PostgreSQL
- Storage Account
- Log Analytics
- ACR
```

### ✅ Objetivo (True IaC)
```
Terraform Managed (tudo):
- Resource Group
- Container App Environment
- 5x Container Apps
- VNet, Subnet, Public IP, NSG
- PostgreSQL
- Storage Account
- Log Analytics
- ACR
```

---

## 🎯 Estratégia: Import + Convert

Vamos **importar** os recursos existentes para o Terraform state sem recriá-los!

---

## 📝 PASSO 1: Backup do Estado Atual

```bash
# Fazer backup do state atual
cd terraform
terraform state pull > backup-state-$(date +%Y%m%d-%H%M%S).json

# Criar snapshot do resource group no Azure
az group export \
  --name slms-rg \
  --output json > azure-rg-snapshot.json
```

---

## 📝 PASSO 2: Converter Resource Group

### 2.1. Modificar main.tf

```hcl
# ANTES:
data "azurerm_resource_group" "rg" {
  name = "slms-rg"
}

# DEPOIS:
resource "azurerm_resource_group" "rg" {
  name     = "slms-rg"
  location = "francecentral"
  
  tags = {
    Environment = "Production"
    ManagedBy   = "Terraform"
    Project     = "SLMS"
  }
}
```

### 2.2. Importar para o Terraform

```bash
terraform import azurerm_resource_group.rg /subscriptions/edb0834e-b174-415e-b0f4-360b0f79d8d7/resourceGroups/slms-rg
```

### 2.3. Atualizar referências

Procurar e substituir em TODOS os ficheiros:
```
data.azurerm_resource_group.rg → azurerm_resource_group.rg
```

---

## 📝 PASSO 3: Converter Container App Environment

### 3.1. Modificar main.tf

```hcl
# DESCOMENTAR e AJUSTAR:
resource "azurerm_container_app_environment" "env" {
  name                       = "slms-container-env"
  resource_group_name        = azurerm_resource_group.rg.name
  location                   = azurerm_resource_group.rg.location
  log_analytics_workspace_id = azurerm_log_analytics_workspace.logs.id
  
  tags = {
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}

# REMOVER:
# data "azurerm_container_app_environment" "env" { ... }
```

### 3.2. Importar

```bash
terraform import azurerm_container_app_environment.env \
  /subscriptions/edb0834e-b174-415e-b0f4-360b0f79d8d7/resourceGroups/slms-rg/providers/Microsoft.App/managedEnvironments/slms-container-env
```

### 3.3. Atualizar referências

```
data.azurerm_container_app_environment.env → azurerm_container_app_environment.env
```

---

## 📝 PASSO 4: Converter Container Apps

### 4.1. Obter configuração atual de uma Container App

```bash
# Ver configuração completa do backend
az containerapp show \
  --name slms-backend \
  --resource-group slms-rg \
  --output json > backend-config.json
```

### 4.2. Criar resource block (exemplo: Backend)

```hcl
resource "azurerm_container_app" "backend" {
  name                         = "slms-backend"
  container_app_environment_id = azurerm_container_app_environment.env.id
  resource_group_name          = azurerm_resource_group.rg.name
  revision_mode                = "Single"

  template {
    container {
      name   = "backend"
      image  = "${azurerm_container_registry.acr.login_server}/slms-backend:latest"
      cpu    = 0.5
      memory = "1Gi"

      env {
        name  = "DATABASE_URL"
        value = "postgresql://${azurerm_postgresql_flexible_server.db.fqdn}:5432/slms"
      }
      
      env {
        name        = "DATABASE_PASSWORD"
        secret_name = "db-password"
      }
    }

    min_replicas = 1
    max_replicas = 3
  }

  secret {
    name  = "db-password"
    value = var.db_password
  }

  ingress {
    external_enabled = false  # Internal only
    target_port      = 8080
    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  tags = {
    Service     = "Backend"
    ManagedBy   = "Terraform"
    Environment = "Production"
  }
}
```

### 4.3. Importar Backend

```bash
terraform import azurerm_container_app.backend \
  /subscriptions/edb0834e-b174-415e-b0f4-360b0f79d8d7/resourceGroups/slms-rg/providers/Microsoft.App/containerApps/slms-backend
```

### 4.4. Repetir para outros serviços

```bash
# Carrier Service
terraform import azurerm_container_app.carrier_service \
  /subscriptions/.../containerApps/slms-carrier-service

# Order Service
terraform import azurerm_container_app.order_service \
  /subscriptions/.../containerApps/slms-order-service

# Keycloak
terraform import azurerm_container_app.keycloak \
  /subscriptions/.../containerApps/slms-keycloak

# Frontend
terraform import azurerm_container_app.frontend \
  /subscriptions/.../containerApps/slms-frontend
```

---

## 📝 PASSO 5: Converter Networking (Opcional - complexo)

⚠️ **NOTA**: VM e networking são complexos. Recomendo deixar como `data` por enquanto.

Se quiseres mesmo converter:

### 5.1. VNet
```bash
terraform import azurerm_virtual_network.vnet \
  /subscriptions/.../virtualNetworks/slms-vnet
```

### 5.2. Subnet
```bash
terraform import azurerm_subnet.subnet \
  /subscriptions/.../virtualNetworks/slms-vnet/subnets/slms-subnet
```

### 5.3. Public IP
```bash
terraform import azurerm_public_ip.runner_ip \
  /subscriptions/.../publicIPAddresses/slms-runner-ip
```

---

## 📝 PASSO 6: Adicionar Auto-Update no CD

Depois de tudo importado, adiciona ao workflow:

```yaml
- name: Update Container Apps com novas imagens
  run: |
    echo "🔄 Atualizando Container Apps com novas imagens..."
    cd terraform
    
    # Atualizar variável de imagem no Terraform
    export TF_VAR_image_tag="${{ github.sha }}"
    
    # Aplicar mudanças (Terraform vai atualizar só as imagens)
    terraform apply -auto-approve \
      -target=azurerm_container_app.backend \
      -target=azurerm_container_app.carrier_service \
      -target=azurerm_container_app.order_service \
      -target=azurerm_container_app.frontend
```

E no main.tf:

```hcl
variable "image_tag" {
  description = "Tag da imagem Docker a usar"
  type        = string
  default     = "latest"
}

resource "azurerm_container_app" "backend" {
  # ...
  template {
    container {
      image = "${azurerm_container_registry.acr.login_server}/slms-backend:${var.image_tag}"
      # ...
    }
  }
}
```

---

## ✅ PASSO 7: Validar

```bash
# Verificar que tudo está no state
terraform state list

# Fazer plan - não deve querer mudar nada!
terraform plan

# Resultado esperado:
# "No changes. Your infrastructure matches the configuration."
```

---

## 🎯 ORDEM DE EXECUÇÃO RECOMENDADA

```
1. Resource Group       ✅ (mais fácil)
2. Container App Env    ✅ (médio)
3. Container Apps       ⚠️  (requer configuração detalhada)
4. Networking           ⚠️  (complexo, opcional)
```

---

## ⚠️ CUIDADOS IMPORTANTES

1. **Sempre fazer backup do state antes de qualquer import**
2. **Testar com `terraform plan` depois de cada import**
3. **Não fazer `terraform apply` até ter certeza que o plan está correto**
4. **Se algo correr mal**: `terraform state pull > backup.json` e restaurar

---

## 🚨 SE ALGO CORRER MAL

### Restaurar state
```bash
# Restaurar de backup
terraform state push backup-state-YYYYMMDD-HHMMSS.json
```

### Remover recurso do state (sem deletar no Azure)
```bash
terraform state rm azurerm_container_app.backend
```

### Recriar state do zero
```bash
# ÚLTIMO RECURSO - só se tudo falhar
rm terraform.tfstate*
terraform init -reconfigure
# Começar imports do zero
```

---

## 📚 Documentação Útil

- [Terraform Import](https://developer.hashicorp.com/terraform/cli/import)
- [Azure Container Apps Terraform](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/container_app)
- [Terraform State Management](https://developer.hashicorp.com/terraform/language/state)

---

## 🎯 Próximos Passos

Queres que comece com o **Passo 2** (Resource Group)? É o mais simples e seguro para começar!

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
  
  # Remote State Backend - guarda o state persistentemente no Azure Storage
  backend "azurerm" {
    resource_group_name  = "tfstate-rg"
    storage_account_name = "tfstateslms204"   # walter white
    container_name       = "tfstate"
    key                  = "slms.tfstate"
    use_azuread_auth     = true  # Usa Managed Identity para autenticar
  }
}

provider "azurerm" {
  features {}
}

# Resource Group - Gerido pelo Terraform
resource "azurerm_resource_group" "rg" {
  name     = "slms-rg"
  location = "francecentral"
  
  tags = {
    Environment = "Production"
    ManagedBy   = "Terraform"
    Project     = "SLMS"
  }
}

# Generate unique suffixes for each resource to avoid conflicts and race conditions
resource "random_string" "acr_suffix" {
  length  = 6
  special = false
  upper   = false
}

resource "random_string" "db_suffix" {
  length  = 6
  special = false
  upper   = false
}

resource "random_string" "storage_suffix" {
  length  = 6
  special = false
  upper   = false
}

resource "random_string" "logs_suffix" {
  length  = 6
  special = false
  upper   = false
}

# Storage Account (para Blob Storage)
resource "azurerm_storage_account" "storage" {
  name                     = "slmsstorage${random_string.storage_suffix.result}"
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

# Azure Container Registry
resource "azurerm_container_registry" "acr" {
  name                = "slmsacr${random_string.acr_suffix.result}"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "Basic"
  admin_enabled       = true
}

# PostgreSQL Flexible Server
resource "azurerm_postgresql_flexible_server" "db" {
  name                   = "slms-postgresql-${random_string.db_suffix.result}"
  resource_group_name    = azurerm_resource_group.rg.name
  location               = azurerm_resource_group.rg.location
  version                = "15"
  administrator_login    = "slmsadmin"
  administrator_password = var.db_password
  storage_mb             = 32768
  sku_name               = "B_Standard_B1ms"

  lifecycle {
    prevent_destroy = false
    # IMPORTANTE: Ignorar mudanças na zona porque o Azure define automaticamente
    ignore_changes = [zone]
  }
}

# PostgreSQL Firewall Rule (permitir acesso do Azure)
resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_azure" {
  name             = "allow-azure-services"
  server_id        = azurerm_postgresql_flexible_server.db.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

# PostgreSQL Database
resource "azurerm_postgresql_flexible_server_database" "slms_db" {
  name      = "slms_database"
  server_id = azurerm_postgresql_flexible_server.db.id
  collation = "en_US.utf8"
  charset   = "UTF8"
}

# Container App Environment (existente - deixar como data source)
# NOTA: Não converter para resource porque requer log_analytics_workspace_id
# que força replacement (destroy + create), o que deletaria todas as Container Apps!
data "azurerm_container_app_environment" "env" {
  name                = "slms-container-env"
  resource_group_name = azurerm_resource_group.rg.name
  depends_on          = [time_sleep.wait_for_env]
}

# Log Analytics Workspace (necessário para Container Apps)
resource "azurerm_log_analytics_workspace" "logs" {
  name                = "slms-logs-${random_string.logs_suffix.result}"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

# Wait for Container App Environment to be available
# This prevents race conditions when fetching the existing environment
resource "time_sleep" "wait_for_env" {
  depends_on = [azurerm_resource_group.rg]
  create_duration = "15s"
}

# Container Apps (usando recursos existentes como data sources)
# Backend - Gerido pelo Terraform
resource "azurerm_container_app" "backend" {
  name                         = "slms-backend"
  container_app_environment_id = data.azurerm_container_app_environment.env.id
  resource_group_name          = azurerm_resource_group.rg.name
  revision_mode                = "Single"

  template {
    container {
      name   = "backend"
      image  = "${azurerm_container_registry.acr.login_server}/slms-backend:${var.image_tag}"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "DB_URL"
        value = "jdbc:postgresql://${azurerm_postgresql_flexible_server.db.fqdn}:5432/${azurerm_postgresql_flexible_server_database.slms_db.name}"
      }
      
      env {
        name  = "DB_USERNAME"
        value = "slmsadmin"
      }
      
      env {
        name        = "DB_PASSWORD"
        secret_name = "db-password"
      }
      
      env {
        name  = "SPRING_PROFILES_ACTIVE"
        value = "prod"
      }
    }

    min_replicas = 1
    max_replicas = 2
  }

  secret {
    name  = "db-password"
    value = var.db_password
  }
  
  secret {
    name  = "acr-password"
    value = azurerm_container_registry.acr.admin_password
  }

  registry {
    server               = azurerm_container_registry.acr.login_server
    username             = azurerm_container_registry.acr.admin_username
    password_secret_name = "acr-password"
  }

  ingress {
    external_enabled = false  # Internal only
    target_port      = 8082  # Backend runs on port 8082
    
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

# Carrier Service
resource "azurerm_container_app" "carrier_service" {
  name                         = "slms-carrier-service"
  container_app_environment_id = data.azurerm_container_app_environment.env.id
  resource_group_name          = azurerm_resource_group.rg.name
  revision_mode                = "Single"

  template {
    container {
      name   = "carrier-service"
      image  = "${azurerm_container_registry.acr.login_server}/slms-carrier-service:${var.image_tag}"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "SPRING_APPLICATION_NAME"
        value = "carrier_service"
      }

      env {
        name  = "SERVER_PORT"
        value = "8080"
      }

      env {
        name  = "SPRING_DATASOURCE_URL"
        value = "jdbc:postgresql://${azurerm_postgresql_flexible_server.db.fqdn}:5432/${azurerm_postgresql_flexible_server_database.slms_db.name}"
      }

      env {
        name  = "SPRING_DATASOURCE_USERNAME"
        value = "slmsadmin"
      }

      env {
        name        = "SPRING_DATASOURCE_PASSWORD"
        secret_name = "db-password"
      }

      env {
        name  = "SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE"
        value = "3"
      }

      env {
        name  = "SPRING_DATASOURCE_HIKARI_MINIMUM_IDLE"
        value = "1"
      }

      env {
        name  = "KEYCLOAK_JWK_SET_URI"
        value = "https://slms-keycloak.calmglacier-aaa99a56.francecentral.azurecontainerapps.io/auth/realms/ESg204/protocol/openid-connect/certs"
      }

      env {
        name  = "KEYCLOAK_ISSUER_URI"
        value = "https://slms-keycloak.calmglacier-aaa99a56.francecentral.azurecontainerapps.io/auth/realms/ESg204"
      }
    }

    min_replicas = 1
    max_replicas = 2
  }

  secret {
    name  = "db-password"
    value = var.db_password
  }
  
  secret {
    name  = "acr-password"
    value = azurerm_container_registry.acr.admin_password
  }

  registry {
    server               = azurerm_container_registry.acr.login_server
    username             = azurerm_container_registry.acr.admin_username
    password_secret_name = "acr-password"
  }

  ingress {
    external_enabled = false
    target_port      = 8080
    
    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  tags = {
    Service     = "CarrierService"
    ManagedBy   = "Terraform"
    Environment = "Production"
  }
}

# Order Service
resource "azurerm_container_app" "order_service" {
  name                         = "slms-order-service"
  container_app_environment_id = data.azurerm_container_app_environment.env.id
  resource_group_name          = azurerm_resource_group.rg.name
  revision_mode                = "Single"

  template {
    container {
      name   = "order-service"
      image  = "${azurerm_container_registry.acr.login_server}/slms-order-service:${var.image_tag}"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "SPRING_APPLICATION_NAME"
        value = "order_service"
      }

      env {
        name  = "SPRING_DATASOURCE_URL"
        value = "jdbc:postgresql://${azurerm_postgresql_flexible_server.db.fqdn}:5432/${azurerm_postgresql_flexible_server_database.slms_db.name}"
      }

      env {
        name  = "SPRING_DATASOURCE_USERNAME"
        value = "slmsadmin"
      }

      env {
        name        = "SPRING_DATASOURCE_PASSWORD"
        secret_name = "db-password"
      }

      env {
        name  = "SPRING_JPA_HIBERNATE_DDL_AUTO"
        value = "none"
      }

      env {
        name  = "SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE"
        value = "3"
      }

      env {
        name  = "SPRING_DATASOURCE_HIKARI_MINIMUM_IDLE"
        value = "1"
      }

      env {
        name  = "KEYCLOAK_JWK_SET_URI"
        value = "https://slms-keycloak.calmglacier-aaa99a56.francecentral.azurecontainerapps.io/auth/realms/ESg204/protocol/openid-connect/certs"
      }

      env {
        name  = "KEYCLOAK_ISSUER_URI"
        value = "https://slms-keycloak.calmglacier-aaa99a56.francecentral.azurecontainerapps.io/auth/realms/ESg204"
      }
    }

    min_replicas = 1
    max_replicas = 2
  }

  secret {
    name  = "db-password"
    value = var.db_password
  }
  
  secret {
    name  = "acr-password"
    value = azurerm_container_registry.acr.admin_password
  }

  registry {
    server               = azurerm_container_registry.acr.login_server
    username             = azurerm_container_registry.acr.admin_username
    password_secret_name = "acr-password"
  }

  ingress {
    external_enabled = false
    target_port      = 8080
    
    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  tags = {
    Service     = "OrderService"
    ManagedBy   = "Terraform"
    Environment = "Production"
  }
}

# Keycloak (existente)
data "azurerm_container_app" "keycloak" {
  name                = "slms-keycloak"
  resource_group_name = azurerm_resource_group.rg.name
}

# Frontend
resource "azurerm_container_app" "frontend" {
  name                         = "slms-frontend"
  container_app_environment_id = data.azurerm_container_app_environment.env.id
  resource_group_name          = azurerm_resource_group.rg.name
  revision_mode                = "Single"

  template {
    container {
      name   = "frontend"
      image  = "${azurerm_container_registry.acr.login_server}/slms-frontend:${var.image_tag}"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "API_URL"
        value = "https://slms-backend.internal.calmglacier-aaa99a56.francecentral.azurecontainerapps.io"
      }
    }

    min_replicas = 1
    max_replicas = 2
  }
  
  secret {
    name  = "acr-password"
    value = azurerm_container_registry.acr.admin_password
  }

  registry {
    server               = azurerm_container_registry.acr.login_server
    username             = azurerm_container_registry.acr.admin_username
    password_secret_name = "acr-password"
  }

  ingress {
    external_enabled = true  # Publicly accessible
    target_port      = 80
    
    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  tags = {
    Service     = "Frontend"
    ManagedBy   = "Terraform"
    Environment = "Production"
  }
}

# ==========================================
# VM Runner Stack (Self-Hosted GitHub Runner)
# ==========================================
# NOTA: VM e recursos de rede já foram criados manualmente
# Usando data sources para referenciar recursos existentes

# Virtual Network (existente)
data "azurerm_virtual_network" "vnet" {
  name                = "slms-vnet"
  resource_group_name = azurerm_resource_group.rg.name
}

# Subnet (existente)
data "azurerm_subnet" "subnet" {
  name                 = "slms-subnet"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = data.azurerm_virtual_network.vnet.name
}

# Public IP (existente)
data "azurerm_public_ip" "runner_ip" {
  name                = "slms-runner-ip"
  resource_group_name = azurerm_resource_group.rg.name
}

# Network Security Group (existente)
data "azurerm_network_security_group" "nsg" {
  name                = "slms-runner-nsg"
  resource_group_name = azurerm_resource_group.rg.name
}




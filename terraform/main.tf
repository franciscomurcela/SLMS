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

# Resource Group (existente)
data "azurerm_resource_group" "rg" {
  name = "slms-rg"
}

# Storage Account (para Blob Storage)
resource "azurerm_storage_account" "storage" {
  name                     = "slmsstorage${random_string.suffix.result}"
  resource_group_name      = data.azurerm_resource_group.rg.name
  location                 = data.azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

# Azure Container Registry
resource "azurerm_container_registry" "acr" {
  name                = "slmsacr${random_string.suffix.result}"
  resource_group_name = data.azurerm_resource_group.rg.name
  location            = data.azurerm_resource_group.rg.location
  sku                 = "Basic"
  admin_enabled       = true
}

# PostgreSQL Flexible Server
resource "azurerm_postgresql_flexible_server" "db" {
  name                   = "slms-postgresql-${random_string.suffix.result}"
  resource_group_name    = data.azurerm_resource_group.rg.name
  location               = data.azurerm_resource_group.rg.location
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

# Container App Environment (já existe - criado manualmente)
# Comentado para evitar conflito
/*
resource "azurerm_container_app_environment" "env" {
  name                       = "slms-container-env"
  resource_group_name        = data.azurerm_resource_group.rg.name
  location                   = data.azurerm_resource_group.rg.location
  log_analytics_workspace_id = azurerm_log_analytics_workspace.logs.id
}
*/

# Usar o Container App Environment existente
data "azurerm_container_app_environment" "env" {
  name                = "slms-container-env"
  resource_group_name = data.azurerm_resource_group.rg.name
}

# Log Analytics Workspace (necessário para Container Apps)
resource "azurerm_log_analytics_workspace" "logs" {
  name                = "slms-logs-${random_string.suffix.result}"
  resource_group_name = data.azurerm_resource_group.rg.name
  location            = data.azurerm_resource_group.rg.location
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

# Container Apps (usando recursos existentes como data sources)
# Backend (existente)
data "azurerm_container_app" "backend" {
  name                = "slms-backend"
  resource_group_name = data.azurerm_resource_group.rg.name
}

# Carrier Service (existente)
data "azurerm_container_app" "carrier_service" {
  name                = "slms-carrier-service"
  resource_group_name = data.azurerm_resource_group.rg.name
}

# Order Service (existente)
data "azurerm_container_app" "order_service" {
  name                = "slms-order-service"
  resource_group_name = data.azurerm_resource_group.rg.name
}

# Keycloak (existente)
data "azurerm_container_app" "keycloak" {
  name                = "slms-keycloak"
  resource_group_name = data.azurerm_resource_group.rg.name
}

# Frontend (existente)
data "azurerm_container_app" "frontend" {
  name                = "slms-frontend"
  resource_group_name = data.azurerm_resource_group.rg.name
}

# ==========================================
# VM Runner Stack (Self-Hosted GitHub Runner)
# ==========================================
# NOTA: VM e recursos de rede já foram criados manualmente
# Usando data sources para referenciar recursos existentes

# Virtual Network (existente)
data "azurerm_virtual_network" "vnet" {
  name                = "slms-vnet"
  resource_group_name = data.azurerm_resource_group.rg.name
}

# Subnet (existente)
data "azurerm_subnet" "subnet" {
  name                 = "slms-subnet"
  resource_group_name  = data.azurerm_resource_group.rg.name
  virtual_network_name = data.azurerm_virtual_network.vnet.name
}

# Public IP (existente)
data "azurerm_public_ip" "runner_ip" {
  name                = "slms-runner-ip"
  resource_group_name = data.azurerm_resource_group.rg.name
}

# Network Security Group (existente)
data "azurerm_network_security_group" "nsg" {
  name                = "slms-runner-nsg"
  resource_group_name = data.azurerm_resource_group.rg.name
}




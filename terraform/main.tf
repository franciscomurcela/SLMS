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
    storage_account_name = "tfstateslms204"  # Atualizado para o nome correto
    container_name       = "tfstate"
    key                  = "slms.tfstate"
    use_azuread_auth     = true  # Usa Managed Identity para autenticar
  }
}

provider "azurerm" {
  features {}
}

# Resource Group
resource "azurerm_resource_group" "rg" {
  name     = "slms-rg"
  location = "francecentral"  # France Central (Paris) - Próximo de Portugal, geralmente permitido
}

# Storage Account (para Blob Storage)
resource "azurerm_storage_account" "storage" {
  name                     = "slmsstorage${random_string.suffix.result}"
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
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
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "Basic"
  admin_enabled       = true
}

# PostgreSQL Flexible Server
resource "azurerm_postgresql_flexible_server" "db" {
  name                   = "slms-postgresql-${random_string.suffix.result}"
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

# Container App Environment
resource "azurerm_container_app_environment" "env" {
  name                       = "slms-container-env"
  resource_group_name        = azurerm_resource_group.rg.name
  location                   = azurerm_resource_group.rg.location
  log_analytics_workspace_id = azurerm_log_analytics_workspace.logs.id
}

# Log Analytics Workspace (necessário para Container Apps)
resource "azurerm_log_analytics_workspace" "logs" {
  name                = "slms-logs-${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

# Container App - Backend (Spring Boot)
resource "azurerm_container_app" "backend" {
  name                         = "slms-backend"
  container_app_environment_id = azurerm_container_app_environment.env.id
  resource_group_name          = azurerm_resource_group.rg.name
  revision_mode                = "Single"

  template {
    container {
      name   = "backend"
      image  = "${azurerm_container_registry.acr.login_server}/slms-backend:latest"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "DB_URL"
        value = "jdbc:postgresql://${azurerm_postgresql_flexible_server.db.fqdn}:5432/${azurerm_postgresql_flexible_server_database.slms_db.name}"
      }

      env {
        name  = "DB_USERNAME"
        value = azurerm_postgresql_flexible_server.db.administrator_login
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

  registry {
    server               = azurerm_container_registry.acr.login_server
    username             = azurerm_container_registry.acr.admin_username
    password_secret_name = "acr-password"
  }

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.acr.admin_password
  }

  ingress {
    external_enabled = false
    target_port      = 8080
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }
}

# Container App - Carrier Service (porta 8080)
resource "azurerm_container_app" "carrier_service" {
  name                         = "slms-carrier-service"
  container_app_environment_id = azurerm_container_app_environment.env.id
  resource_group_name          = azurerm_resource_group.rg.name
  revision_mode                = "Single"

  template {
    container {
      name   = "carrier-service"
      image  = "${azurerm_container_registry.acr.login_server}/slms-carrier-service:latest"
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
        value = azurerm_postgresql_flexible_server.db.administrator_login
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
        value = "https://${azurerm_container_app.keycloak.ingress[0].fqdn}/auth/realms/ESg204/protocol/openid-connect/certs"
      }

      env {
        name  = "KEYCLOAK_ISSUER_URI"
        value = "https://${azurerm_container_app.keycloak.ingress[0].fqdn}/auth/realms/ESg204"
      }
    }

    min_replicas = 1
    max_replicas = 2
  }

  secret {
    name  = "db-password"
    value = var.db_password
  }

  registry {
    server               = azurerm_container_registry.acr.login_server
    username             = azurerm_container_registry.acr.admin_username
    password_secret_name = "acr-password"
  }

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.acr.admin_password
  }

  ingress {
    external_enabled = false
    target_port      = 8080
    transport        = "http"
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  depends_on = [azurerm_container_app.keycloak]
}

# Container App - Order Service (porta 8080 interno)
resource "azurerm_container_app" "order_service" {
  name                         = "slms-order-service"
  container_app_environment_id = azurerm_container_app_environment.env.id
  resource_group_name          = azurerm_resource_group.rg.name
  revision_mode                = "Single"

  template {
    container {
      name   = "order-service"
      image  = "${azurerm_container_registry.acr.login_server}/slms-order-service:latest"
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
        value = azurerm_postgresql_flexible_server.db.administrator_login
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
        value = "https://${azurerm_container_app.keycloak.ingress[0].fqdn}/auth/realms/ESg204/protocol/openid-connect/certs"
      }

      env {
        name  = "KEYCLOAK_ISSUER_URI"
        value = "https://${azurerm_container_app.keycloak.ingress[0].fqdn}/auth/realms/ESg204"
      }
    }

    min_replicas = 1
    max_replicas = 2
  }

  secret {
    name  = "db-password"
    value = var.db_password
  }

  registry {
    server               = azurerm_container_registry.acr.login_server
    username             = azurerm_container_registry.acr.admin_username
    password_secret_name = "acr-password"
  }

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.acr.admin_password
  }

  ingress {
    external_enabled = false
    target_port      = 8080
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  depends_on = [azurerm_container_app.keycloak]
}

# Container App - Keycloak (Authentication)
resource "azurerm_container_app" "keycloak" {
  name                         = "slms-keycloak"
  container_app_environment_id = azurerm_container_app_environment.env.id
  resource_group_name          = azurerm_resource_group.rg.name
  revision_mode                = "Single"

  template {
    container {
      name   = "keycloak"
      image  = "quay.io/keycloak/keycloak:23.0"
      cpu    = 0.5
      memory = "1Gi"

      args = ["start-dev"]

      env {
        name  = "KC_DB"
        value = "postgres"
      }

      env {
        name  = "KC_DB_URL_HOST"
        value = azurerm_postgresql_flexible_server.db.fqdn
      }

      env {
        name  = "KC_DB_URL_PORT"
        value = "5432"
      }

      env {
        name  = "KC_DB_URL_DATABASE"
        value = azurerm_postgresql_flexible_server_database.slms_db.name
      }

      env {
        name  = "KC_DB_USERNAME"
        value = azurerm_postgresql_flexible_server.db.administrator_login
      }

      env {
        name        = "KC_DB_PASSWORD"
        secret_name = "db-password"
      }

      env {
        name  = "KEYCLOAK_ADMIN"
        value = "admin"
      }

      env {
        name        = "KEYCLOAK_ADMIN_PASSWORD"
        secret_name = "keycloak-admin-password"
      }

      env {
        name  = "KC_HOSTNAME_STRICT"
        value = "false"
      }

      env {
        name  = "KC_HTTP_ENABLED"
        value = "true"
      }

      env {
        name  = "KC_PROXY"
        value = "edge"
      }

      env {
        name  = "KC_HTTP_RELATIVE_PATH"
        value = "/auth"
      }

      env {
        name  = "KC_HOSTNAME_STRICT_HTTPS"
        value = "false"
      }
    }

    min_replicas = 1
    max_replicas = 1
  }

  secret {
    name  = "db-password"
    value = var.db_password
  }

  secret {
    name  = "keycloak-admin-password"
    value = "admin"
  }

  ingress {
    external_enabled = true
    target_port      = 8080
    transport        = "http"
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  # Também precisamos de outputs para o FQDN interno quando disponível
  # O Azure Container Apps cria automaticamente DNS interno para comunicação entre apps
}

# Container App - Frontend (Nginx)
resource "azurerm_container_app" "frontend" {
  name                         = "slms-frontend"
  container_app_environment_id = azurerm_container_app_environment.env.id
  resource_group_name          = azurerm_resource_group.rg.name
  revision_mode                = "Single"

  template {
    container {
      name   = "frontend"
      image  = "${azurerm_container_registry.acr.login_server}/slms-frontend:latest"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "API_URL"
        value = "https://${azurerm_container_app.backend.ingress[0].fqdn}"
      }
    }

    min_replicas = 1
    max_replicas = 2
  }

  registry {
    server               = azurerm_container_registry.acr.login_server
    username             = azurerm_container_registry.acr.admin_username
    password_secret_name = "acr-password"
  }

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.acr.admin_password
  }

  ingress {
    external_enabled = true
    target_port      = 80
    transport        = "auto"
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }
}

# ==========================================
# VM Runner Stack (Self-Hosted GitHub Runner)
# ==========================================

# Virtual Network
resource "azurerm_virtual_network" "vnet" {
  name                = "slms-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
}

# Subnet
resource "azurerm_subnet" "subnet" {
  name                 = "slms-subnet"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.1.0/24"]
}

# Public IP (estático)
resource "azurerm_public_ip" "runner_ip" {
  name                = "slms-runner-ip"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

# Network Security Group
resource "azurerm_network_security_group" "nsg" {
  name                = "slms-runner-nsg"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  security_rule {
    name                       = "SSH"
    priority                   = 1001
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

# Network Interface
resource "azurerm_network_interface" "runner_nic" {
  name                = "slms-runner-nic"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.subnet.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.runner_ip.id
  }
}

# Associate NSG with NIC
resource "azurerm_network_interface_security_group_association" "nsg_assoc" {
  network_interface_id      = azurerm_network_interface.runner_nic.id
  network_security_group_id = azurerm_network_security_group.nsg.id
}

# Linux Virtual Machine (GitHub Runner)
resource "azurerm_linux_virtual_machine" "vm_runner" {
  name                = "slms-runner-vm"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  size                = "Standard_B2s"  # 2 vCPUs, 4GB RAM (antes: Standard_B1s com 1GB)
  admin_username      = "azureuser"
  admin_password      = var.runner_admin_password

  disable_password_authentication = false

  network_interface_ids = [
    azurerm_network_interface.runner_nic.id,
  ]

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }

  # IMPORTANTE: System-Assigned Managed Identity
  identity {
    type = "SystemAssigned"
  }

  # Custom data para instalar dependências necessárias
  custom_data = base64encode(<<-EOF
    #!/bin/bash
    set -e
    
    # Atualizar sistema
    apt-get update
    apt-get upgrade -y
    
    # Instalar Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker azureuser
    
    # Instalar Azure CLI
    curl -sL https://aka.ms/InstallAzureCLIDeb | bash
    
    # Instalar Terraform
    wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | tee /usr/share/keyrings/hashicorp-archive-keyring.gpg
    echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | tee /etc/apt/sources.list.d/hashicorp.list
    apt-get update
    apt-get install -y terraform
    
    # Instalar Git
    apt-get install -y git
    
    echo "VM setup complete!" > /var/log/vm-setup.log
  EOF
  )
}

# IMPORTANTE: Role Assignment - Contributor no Resource Group
resource "azurerm_role_assignment" "vm_contributor" {
  scope                = azurerm_resource_group.rg.id
  role_definition_name = "Contributor"
  principal_id         = azurerm_linux_virtual_machine.vm_runner.identity[0].principal_id
}

# Role Assignment adicional - AcrPush (para push de imagens)
resource "azurerm_role_assignment" "vm_acr_push" {
  scope                = azurerm_container_registry.acr.id
  role_definition_name = "AcrPush"
  principal_id         = azurerm_linux_virtual_machine.vm_runner.identity[0].principal_id
}

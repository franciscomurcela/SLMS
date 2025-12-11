terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
  
  # Remote State Backend
  backend "azurerm" {
    resource_group_name  = "tfstate-rg"
    storage_account_name = "tfstateslms204"
    container_name       = "tfstate"
    key                  = "slms.tfstate"
    use_azuread_auth     = true
  }
}

provider "azurerm" {
  features {}
}

# Resource Group
resource "azurerm_resource_group" "rg" {
  name     = "slms-rg"
  location = "francecentral"
  
  tags = {
    Environment = "Production"
    ManagedBy   = "Terraform"
    Project     = "SLMS"
  }
}

# Generate unique suffixes
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

# Storage Account
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
    ignore_changes = [zone]
  }
}

# PostgreSQL Firewall Rule
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

# Container App Environment (Data Source)
data "azurerm_container_app_environment" "env" {
  name                = "slms-container-env"
  resource_group_name = azurerm_resource_group.rg.name
  depends_on          = [time_sleep.wait_for_env]
}

# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "logs" {
  name                = "slms-logs-${random_string.logs_suffix.result}"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

# Wait for Environment
resource "time_sleep" "wait_for_env" {
  depends_on = [azurerm_resource_group.rg]
  create_duration = "15s"
}

# ========================================================
# CONTAINER APPS
# ========================================================

# Backend (User Service)
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

      # Configuração OpenTelemetry
      env {
        name  = "OTEL_EXPORTER_OTLP_ENDPOINT"
        value = var.otel_exporter_endpoint
      }
      
      env {
        name  = "OTEL_TRACES_SAMPLER"
        value = "always_on"
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
    target_port      = 8082
    
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

      # Configuração OpenTelemetry
      env {
        name  = "OTEL_EXPORTER_OTLP_ENDPOINT"
        value = var.otel_exporter_endpoint
      }
      
      env {
        name  = "OTEL_TRACES_SAMPLER"
        value = "always_on"
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

      # Configuração OpenTelemetry
      env {
        name  = "OTEL_EXPORTER_OTLP_ENDPOINT"
        value = var.otel_exporter_endpoint
      }
      
      env {
        name  = "OTEL_TRACES_SAMPLER"
        value = "always_on"
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

# Notification Service
resource "azurerm_container_app" "notification_service" {
  name                         = "slms-notification-service"
  container_app_environment_id = data.azurerm_container_app_environment.env.id
  resource_group_name          = azurerm_resource_group.rg.name
  revision_mode                = "Single"

  template {
    container {
      name   = "notification-service"
      image  = "${azurerm_container_registry.acr.login_server}/slms-notification-service:${var.image_tag}"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "SPRING_APPLICATION_NAME"
        value = "notification_service"
      }

      env {
        name  = "SERVER_PORT"
        value = "8084"
      }

      env {
        name  = "DATABASE_URL"
        value = "jdbc:postgresql://${azurerm_postgresql_flexible_server.db.fqdn}:5432/${azurerm_postgresql_flexible_server_database.slms_db.name}"
      }

      env {
        name  = "DATABASE_USERNAME"
        value = "slmsadmin"
      }

      env {
        name        = "DATABASE_PASSWORD"
        secret_name = "db-password"
      }

      env {
        name  = "KEYCLOAK_JWK_SET_URI"
        value = "https://slms-keycloak.calmglacier-aaa99a56.francecentral.azurecontainerapps.io/auth/realms/ESg204/protocol/openid-connect/certs"
      }

      env {
        name  = "KEYCLOAK_ISSUER_URI"
        value = "https://slms-keycloak.calmglacier-aaa99a56.francecentral.azurecontainerapps.io/auth/realms/ESg204"
      }

      # Configuração OpenTelemetry
      env {
        name  = "OTEL_EXPORTER_OTLP_ENDPOINT"
        value = var.otel_exporter_endpoint
      }
      
      env {
        name  = "OTEL_TRACES_SAMPLER"
        value = "always_on"
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
    target_port      = 8084
    
    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  tags = {
    Service     = "NotificationService"
    ManagedBy   = "Terraform"
    Environment = "Production"
  }
}

# Keycloak
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

      env {
        name  = "VITE_GOOGLE_MAPS_API_KEY"
        value = var.google_maps_api_key
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
    external_enabled = true
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

# VM Runner Data Sources
data "azurerm_virtual_network" "vnet" {
  name                = "slms-vnet"
  resource_group_name = azurerm_resource_group.rg.name
}

data "azurerm_subnet" "subnet" {
  name                 = "slms-subnet"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = data.azurerm_virtual_network.vnet.name
}

data "azurerm_public_ip" "runner_ip" {
  name                = "slms-runner-ip"
  resource_group_name = azurerm_resource_group.rg.name
}

data "azurerm_network_security_group" "nsg" {
  name                = "slms-runner-nsg"
  resource_group_name = azurerm_resource_group.rg.name
}

# ========================================================
# MONITORIZAÇÃO (Azure Application Insights - Web Tests)
# ========================================================

# Referência ao Application Insights existente
data "azurerm_application_insights" "slms_observability" {
  name                = "slms-observability"
  resource_group_name = azurerm_resource_group.rg.name
}

# 1. Health Check - User Service (Porta 8082)
resource "azurerm_application_insights_web_test" "health_user" {
  name                    = "HealthCheck-UserService-TF"
  location                = azurerm_resource_group.rg.location
  resource_group_name     = azurerm_resource_group.rg.name
  application_insights_id = data.azurerm_application_insights.slms_observability.id
  kind                    = "ping"
  frequency               = 300
  timeout                 = 60
  enabled                 = true
  geo_locations           = ["us-tx-sn1-azr", "us-il-ch1-azr"]

  configuration = <<XML
<WebTest Name="user-health" Id="d8559510-3a51-4694-8253-293127695b01" Enabled="True" CssProjectStructure="" CssIteration="" Timeout="60" WorkItemIds="" xmlns="http://microsoft.com/schemas/VisualStudio/TeamTest/2010">
  <Items>
    <Request Method="GET" Guid="a8559510-3a51-4694-8253-293127695b01" Version="1.1" Url="http://${data.azurerm_public_ip.runner_ip.ip_address}:8082/user/health" ThinkTime="0" Timeout="60" ParseDependentRequests="False" FollowRedirects="True" RecordResult="True" Cache="False" ResponseTimeGoal="0" Encoding="utf-8" ExpectedHttpStatusCode="200" ExpectedResponseUrl="" ReportingName="" IgnoreHttpStatusCode="False" />
  </Items>
</WebTest>
XML
}

# 2. Health Check - Order Service (Porta 8081)
resource "azurerm_application_insights_web_test" "health_order" {
  name                    = "HealthCheck-OrderService-TF"
  location                = azurerm_resource_group.rg.location
  resource_group_name     = azurerm_resource_group.rg.name
  application_insights_id = data.azurerm_application_insights.slms_observability.id
  kind                    = "ping"
  frequency               = 300
  timeout                 = 60
  enabled                 = true
  geo_locations           = ["us-tx-sn1-azr", "us-il-ch1-azr"]

  configuration = <<XML
<WebTest Name="order-health" Id="e8559510-3a51-4694-8253-293127695b02" Enabled="True" CssProjectStructure="" CssIteration="" Timeout="60" WorkItemIds="" xmlns="http://microsoft.com/schemas/VisualStudio/TeamTest/2010">
  <Items>
    <Request Method="GET" Guid="b8559510-3a51-4694-8253-293127695b02" Version="1.1" Url="http://${data.azurerm_public_ip.runner_ip.ip_address}:8081/actuator/health" ThinkTime="0" Timeout="60" ParseDependentRequests="False" FollowRedirects="True" RecordResult="True" Cache="False" ResponseTimeGoal="0" Encoding="utf-8" ExpectedHttpStatusCode="200" ExpectedResponseUrl="" ReportingName="" IgnoreHttpStatusCode="False" />
  </Items>
</WebTest>
XML
}

# 3. Health Check - Carrier Service (Porta 8080)
resource "azurerm_application_insights_web_test" "health_carrier" {
  name                    = "HealthCheck-CarrierService-TF"
  location                = azurerm_resource_group.rg.location
  resource_group_name     = azurerm_resource_group.rg.name
  application_insights_id = data.azurerm_application_insights.slms_observability.id
  kind                    = "ping"
  frequency               = 300
  timeout                 = 60
  enabled                 = true
  geo_locations           = ["us-tx-sn1-azr", "us-il-ch1-azr"]

  configuration = <<XML
<WebTest Name="carrier-health" Id="f8559510-3a51-4694-8253-293127695b03" Enabled="True" CssProjectStructure="" CssIteration="" Timeout="60" WorkItemIds="" xmlns="http://microsoft.com/schemas/VisualStudio/TeamTest/2010">
  <Items>
    <Request Method="GET" Guid="c8559510-3a51-4694-8253-293127695b03" Version="1.1" Url="http://${data.azurerm_public_ip.runner_ip.ip_address}:8080/actuator/health" ThinkTime="0" Timeout="60" ParseDependentRequests="False" FollowRedirects="True" RecordResult="True" Cache="False" ResponseTimeGoal="0" Encoding="utf-8" ExpectedHttpStatusCode="200" ExpectedResponseUrl="" ReportingName="" IgnoreHttpStatusCode="False" />
  </Items>
</WebTest>
XML
}

# 4. Health Check - Notification Service (Porta 8084)
resource "azurerm_application_insights_web_test" "health_notification" {
  name                    = "HealthCheck-NotificationService-TF"
  location                = azurerm_resource_group.rg.location
  resource_group_name     = azurerm_resource_group.rg.name
  application_insights_id = data.azurerm_application_insights.slms_observability.id
  kind                    = "ping"
  frequency               = 300
  timeout                 = 60
  enabled                 = true
  geo_locations           = ["us-tx-sn1-azr", "us-il-ch1-azr"]

  configuration = <<XML
<WebTest Name="notification-health" Id="g8559510-3a51-4694-8253-293127695b04" Enabled="True" CssProjectStructure="" CssIteration="" Timeout="60" WorkItemIds="" xmlns="http://microsoft.com/schemas/VisualStudio/TeamTest/2010">
  <Items>
    <Request Method="GET" Guid="d8559510-3a51-4694-8253-293127695b04" Version="1.1" Url="http://${data.azurerm_public_ip.runner_ip.ip_address}:8084/actuator/health" ThinkTime="0" Timeout="60" ParseDependentRequests="False" FollowRedirects="True" RecordResult="True" Cache="False" ResponseTimeGoal="0" Encoding="utf-8" ExpectedHttpStatusCode="200" ExpectedResponseUrl="" ReportingName="" IgnoreHttpStatusCode="False" />
  </Items>
</WebTest>
XML
}
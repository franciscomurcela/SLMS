output "frontend_url_https" {
  description = "URL HTTPS pública do Frontend (Container App)"
  value       = "https://${azurerm_container_app.frontend.ingress[0].fqdn}"
}

output "backend_internal_url" {
  description = "URL interna do Backend (apenas acessível dentro do Azure)"
  value       = "https://${azurerm_container_app.backend.ingress[0].fqdn}"
}

output "runner_vm_public_ip" {
  description = "IP público da VM do GitHub Runner (usar para SSH)"
  value       = data.azurerm_public_ip.runner_ip.ip_address
}

output "acr_login_server" {
  description = "URL do Azure Container Registry"
  value       = azurerm_container_registry.acr.login_server
}

output "acr_admin_username" {
  description = "Username do ACR (para login)"
  value       = azurerm_container_registry.acr.admin_username
  sensitive   = true
}

output "acr_admin_password" {
  description = "Password do ACR (para login)"
  value       = azurerm_container_registry.acr.admin_password
  sensitive   = true
}

output "postgresql_fqdn" {
  description = "FQDN do PostgreSQL Server"
  value       = azurerm_postgresql_flexible_server.db.fqdn
}

output "resource_group_name" {
  description = "Nome do Resource Group criado"
  value       = azurerm_resource_group.rg.name
}

output "vm_runner_ssh_command" {
  description = "Comando para conectar à VM via SSH"
  value       = "ssh azureuser@${data.azurerm_public_ip.runner_ip.ip_address}"
}

# Microservices URLs
output "keycloak_url" {
  description = "URL público do Keycloak"
  value       = "https://${data.azurerm_container_app.keycloak.ingress[0].fqdn}/auth"
}

output "keycloak_internal_url" {
  description = "URL interno do Keycloak (para comunicação entre Container Apps)"
  value       = "http://${data.azurerm_container_app.keycloak.ingress[0].fqdn}:8080/auth"
}

output "carrier_service_internal_url" {
  description = "URL interno do Carrier Service"
  value       = "https://${azurerm_container_app.carrier_service.ingress[0].fqdn}"
}

output "order_service_internal_url" {
  description = "URL interno do Order Service"
  value       = "https://${azurerm_container_app.order_service.ingress[0].fqdn}"
}


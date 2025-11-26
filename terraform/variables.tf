variable "db_password" {
  description = "Password para o PostgreSQL Database"
  type        = string
  sensitive   = true
}

variable "runner_admin_password" {
  description = "Password para o utilizador admin da VM do GitHub Runner"
  type        = string
  sensitive   = true
}

variable "image_tag" {
  description = "Tag da imagem Docker (normalmente o commit SHA do GitHub)"
  type        = string
  default     = "latest"
}

variable "google_maps_api_key" {
  description = "Google Maps API Key para funcionalidade de rotas de entrega"
  type        = string
  sensitive   = true
  default     = ""  # Optional - feature will be disabled if not provided
}

variable "otel_exporter_endpoint" {
  description = "Endpoint do OpenTelemetry Collector (IP Publico da VM)"
  type        = string
  # Podes definir um default se quiseres testar localmente, mas não é obrigatório
  default     = "http://localhost:4318" 
}

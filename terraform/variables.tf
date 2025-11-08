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

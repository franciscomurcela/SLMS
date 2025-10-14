# start-project.ps1 - Starts the entire SLMS project (Windows)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $ProjectRoot "slms-backend"
$FrontendDir = Join-Path $ProjectRoot "react-frontend\frontend"

Write-Host "🚀 Starting SLMS Project..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Step 1: Create .env file
Write-Host ""
Write-Host "📝 Step 1: Creating .env file..." -ForegroundColor Yellow

# Create .env content
$EnvPath = Join-Path $BackendDir ".env"
$EnvContent = @"
# Supabase Configuration
SUPABASE_URL=https://pylhwbcmavnjfczwribo.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5bGh3YmNtYXZuamZjendyaWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTgwODkzNiwiZXhwIjoyMDc1Mzg0OTM2fQ.JYy4I0c_cZLlS2bRGnPDHXDuSh9R9rkwIZZGQiw97oY

# Carrier Service Database
SPRING_DATASOURCE_URL=jdbc:postgresql://aws-0-eu-central-1.pooler.supabase.com:6543/postgres
SPRING_DATASOURCE_USERNAME=postgres.pylhwbcmavnjfczwribo
SPRING_DATASOURCE_PASSWORD=ES204SLMS2024

# Database Connection Details (legacy)
DB_HOST=aws-0-eu-central-1.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.pylhwbcmavnjfczwribo
DB_PASS=ES204SLMS2024
"@

Set-Content -Path $EnvPath -Value $EnvContent
Write-Host "✅ .env file created successfully!" -ForegroundColor Green
Write-Host "📁 Location: $EnvPath" -ForegroundColor Gray

# Step 2: Start Docker containers
Write-Host ""
Write-Host "🐳 Step 2: Starting Docker containers..." -ForegroundColor Yellow
Set-Location $BackendDir
docker compose --env-file .env up -d

Write-Host ""
Write-Host "⏳ Waiting for services to start (15 seconds)..." -ForegroundColor Gray
Start-Sleep -Seconds 15

# Step 3: Check Docker status
Write-Host ""
Write-Host "📊 Docker container status:" -ForegroundColor Cyan
docker compose ps

# Step 4: Check frontend dependencies
Write-Host ""
Write-Host "📦 Step 3: Checking frontend dependencies..." -ForegroundColor Yellow
Set-Location $FrontendDir

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm packages..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "✅ node_modules already exists" -ForegroundColor Green
}

# Final instructions
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Backend started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Services:" -ForegroundColor Cyan
Write-Host "  - Keycloak:        http://localhost:8083"
Write-Host "  - User Service:    http://localhost:8082"
Write-Host "  - Carrier Service: http://localhost:8080"
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Configure Keycloak (see SETUP.md section 1.3)"
Write-Host "  2. Start frontend:"
Write-Host "     cd react-frontend\frontend"
Write-Host "     npm run dev"
Write-Host ""
Write-Host "🔑 Keycloak admin: http://localhost:8083/admin (admin/admin)" -ForegroundColor Cyan
Write-Host ""

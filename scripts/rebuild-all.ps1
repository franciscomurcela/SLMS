# ========================================
# Script: Rebuild All Services
# Description: Para, reconstrói (sem cache) e inicia todos os containers
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SLMS - Rebuild All Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navegar para o diretório do backend
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path (Split-Path -Parent $scriptDir) "slms-backend"

if (-not (Test-Path $backendDir)) {
    Write-Host "[ERROR] Diretorio slms-backend nao encontrado!" -ForegroundColor Red
    exit 1
}

Set-Location $backendDir
Write-Host "[INFO] Diretorio: $backendDir" -ForegroundColor Gray
Write-Host ""

# Step 1: Parar todos os containers
Write-Host "[1/3] Parando todos os containers..." -ForegroundColor Yellow
docker-compose down
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARNING] Alguns containers podem nao estar a correr" -ForegroundColor Yellow
} else {
    Write-Host "[OK] Containers parados com sucesso!" -ForegroundColor Green
}
Write-Host ""

# Step 2: Rebuild sem cache
Write-Host "[2/3] Reconstruindo todos os servicos (sem cache)..." -ForegroundColor Yellow
Write-Host "[WAIT] Isto pode demorar alguns minutos..." -ForegroundColor Gray
Write-Host ""

docker-compose build --no-cache

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Erro ao reconstruir os servicos!" -ForegroundColor Red
    Write-Host "Verifique os logs acima para mais detalhes." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "[OK] Build completado com sucesso!" -ForegroundColor Green
}
Write-Host ""

# Step 3: Iniciar todos os containers
Write-Host "[3/3] Iniciando todos os containers..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Erro ao iniciar os containers!" -ForegroundColor Red
    exit 1
} else {
    Write-Host "[OK] Containers iniciados com sucesso!" -ForegroundColor Green
}
Write-Host ""

# Verificar status dos containers
Write-Host "[INFO] Status dos containers:" -ForegroundColor Cyan
docker-compose ps
Write-Host ""

# Aguardar alguns segundos para os serviços iniciarem
Write-Host "[WAIT] Aguardando servicos iniciarem (15 segundos)..." -ForegroundColor Gray
Start-Sleep -Seconds 15

# Verificar logs de erro
Write-Host ""
Write-Host "[INFO] Verificando logs recentes..." -ForegroundColor Cyan
Write-Host ""

$services = @("keycloak", "carrier-service", "order-service", "user-service")
foreach ($service in $services) {
    Write-Host "--- $service ---" -ForegroundColor Yellow
    docker logs $service --tail 5 2>&1 | Select-Object -Last 5
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] Rebuild completo!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[INFO] Servicos disponiveis:" -ForegroundColor Cyan
Write-Host "  - Keycloak: http://localhost:8083" -ForegroundColor White
Write-Host "  - Carrier Service: http://localhost:8080" -ForegroundColor White
Write-Host "  - Order Service: http://localhost:8081" -ForegroundColor White
Write-Host "  - User Service: http://localhost:8082" -ForegroundColor White
Write-Host ""
Write-Host "[TIP] Para ver logs de um servico especifico:" -ForegroundColor Gray
Write-Host "   docker logs <service-name> -f" -ForegroundColor Gray
Write-Host ""

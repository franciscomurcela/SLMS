# ========================================
# Script: Rebuild Single Service
# Description: Para, reconstrói (sem cache) e inicia um serviço específico
# Usage: .\rebuild-service.ps1 <service-name>
# Example: .\rebuild-service.ps1 order-service
# ========================================

param(
    [Parameter(Mandatory=$true)]
    [string]$ServiceName
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SLMS - Rebuild Service: $ServiceName" -ForegroundColor Cyan
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

# Step 1: Parar o serviço
Write-Host "[1/3] Parando $ServiceName..." -ForegroundColor Yellow
docker-compose stop $ServiceName
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARNING] Servico pode nao estar a correr" -ForegroundColor Yellow
} else {
    Write-Host "[OK] Servico parado!" -ForegroundColor Green
}
Write-Host ""

# Step 2: Rebuild sem cache
Write-Host "[2/3] Reconstruindo $ServiceName (sem cache)..." -ForegroundColor Yellow
docker-compose build --no-cache $ServiceName

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Erro ao reconstruir o servico!" -ForegroundColor Red
    exit 1
} else {
    Write-Host "[OK] Build completado!" -ForegroundColor Green
}
Write-Host ""

# Step 3: Iniciar o serviço
Write-Host "[3/3] Iniciando $ServiceName..." -ForegroundColor Yellow
docker-compose up -d $ServiceName

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Erro ao iniciar o servico!" -ForegroundColor Red
    exit 1
} else {
    Write-Host "[OK] Servico iniciado!" -ForegroundColor Green
}
Write-Host ""

# Aguardar alguns segundos
Write-Host "[WAIT] Aguardando servico iniciar (10 segundos)..." -ForegroundColor Gray
Start-Sleep -Seconds 10

# Verificar logs
Write-Host ""
Write-Host "[INFO] Logs recentes de ${ServiceName}:" -ForegroundColor Cyan
docker logs $ServiceName --tail 20
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] Rebuild de ${ServiceName} completo!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[TIP] Para ver logs em tempo real:" -ForegroundColor Gray
Write-Host "   docker logs $ServiceName -f" -ForegroundColor Gray
Write-Host ""

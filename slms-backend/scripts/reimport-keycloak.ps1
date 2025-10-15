# Script para reimportar o Keycloak realm automaticamente
# Uso: .\scripts\reimport-keycloak.ps1

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Keycloak Realm Reimport Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# Verifica se estamos no diretório correto
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "❌ Erro: Execute este script a partir do diretório slms-backend" -ForegroundColor Red
    exit 1
}

# Verifica se o realm file existe
if (-not (Test-Path "keycloak-init/ESg204-realm.json")) {
    Write-Host "❌ Erro: Arquivo ESg204-realm.json não encontrado em keycloak-init/" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Passo 1: Parando containers do Keycloak..." -ForegroundColor Yellow
docker-compose stop keycloak keycloak-db

Write-Host ""
Write-Host "📋 Passo 2: Removendo containers..." -ForegroundColor Yellow
docker-compose rm -f keycloak keycloak-db

Write-Host ""
Write-Host "🗑️  Passo 3: Removendo volumes antigos..." -ForegroundColor Yellow
docker volume rm slms-backend_keycloak-pgdata -f 2>$null
docker volume rm slms-backend_keycloak-data -f 2>$null

Write-Host ""
Write-Host "🚀 Passo 4: Iniciando Keycloak com nova configuração..." -ForegroundColor Yellow
docker-compose up -d keycloak

Write-Host ""
Write-Host "⏳ Aguardando Keycloak inicializar (30 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host ""
Write-Host "📊 Verificando logs de importação..." -ForegroundColor Yellow
docker logs keycloak --tail 20 | Select-String -Pattern "imported|Import finished"

Write-Host ""
Write-Host "✅ Reimportação concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Keycloak disponível em: http://localhost:8083" -ForegroundColor Cyan
Write-Host "👤 Admin: admin / admin" -ForegroundColor Cyan
Write-Host "🏢 Realm: ESg204" -ForegroundColor Cyan
Write-Host ""

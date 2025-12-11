#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Switch between local and cloud nginx configurations
.DESCRIPTION
    This script switches the nginx configuration between local Docker Compose
    and Azure cloud deployments by copying the appropriate nginx config file.
.PARAMETER Environment
    The target environment: "local" or "cloud"
.EXAMPLE
    .\switch-environment.ps1 local
    .\switch-environment.ps1 cloud
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("local", "cloud")]
    [string]$Environment
)

$frontendDir = Join-Path $PSScriptRoot "frontend"
$dockerfilePath = Join-Path $frontendDir "Dockerfile"

Write-Host "🔧 Switching to $Environment environment..." -ForegroundColor Cyan

if ($Environment -eq "local") {
    # Update Dockerfile to use nginx.local.conf
    $dockerfileContent = Get-Content $dockerfilePath -Raw
    $dockerfileContent = $dockerfileContent -replace 'COPY nginx\.azure\.conf', 'COPY nginx.local.conf'
    $dockerfileContent | Set-Content $dockerfilePath -NoNewline
    
    Write-Host "✅ Configured for LOCAL development" -ForegroundColor Green
    Write-Host "   - Using nginx.local.conf" -ForegroundColor Gray
    Write-Host "   - Backend services: localhost:808x" -ForegroundColor Gray
    Write-Host "   - Keycloak: localhost:8083/auth" -ForegroundColor Gray
}
elseif ($Environment -eq "cloud") {
    # Update Dockerfile to use nginx.azure.conf
    $dockerfileContent = Get-Content $dockerfilePath -Raw
    $dockerfileContent = $dockerfileContent -replace 'COPY nginx\.local\.conf', 'COPY nginx.azure.conf'
    $dockerfileContent | Set-Content $dockerfilePath -NoNewline
    
    Write-Host "✅ Configured for CLOUD (Azure) deployment" -ForegroundColor Green
    Write-Host "   - Using nginx.azure.conf" -ForegroundColor Gray
    Write-Host "   - Backend services: Azure Container Apps" -ForegroundColor Gray
}

Write-Host "`n📦 Next steps:" -ForegroundColor Yellow
Write-Host "   1. docker-compose build frontend" -ForegroundColor White
Write-Host "   2. docker-compose up -d frontend" -ForegroundColor White
Write-Host "   3. Open http://localhost" -ForegroundColor White

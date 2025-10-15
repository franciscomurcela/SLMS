# ========================================
# Script: Setup Permissions (Windows)
# Description: Configura as permissoes dos scripts bash para o Git
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setting up script permissions..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "[INFO] Updating Git file modes for .sh files..." -ForegroundColor Yellow

# Get all .sh files in scripts directory
$shFiles = Get-ChildItem -Path $scriptDir -Filter "*.sh"

foreach ($file in $shFiles) {
    $relativePath = "scripts/$($file.Name)"
    Write-Host "  - $relativePath" -ForegroundColor Gray
    
    # Update Git index to mark as executable
    git update-index --chmod=+x $relativePath 2>$null
}

Write-Host ""
Write-Host "[INFO] Verificando permissoes..." -ForegroundColor Yellow

# Check git ls-files to see permissions
git ls-files -s scripts/*.sh | ForEach-Object {
    if ($_ -match "100755") {
        Write-Host "  [OK] $($_ -replace '.*scripts/', 'scripts/')" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] $($_ -replace '.*scripts/', 'scripts/') - may need permissions" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] Setup complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[INFO] Proximos passos:" -ForegroundColor Yellow
Write-Host "  1. Faz commit das mudancas:" -ForegroundColor Gray
Write-Host "     git add scripts/*.sh" -ForegroundColor Gray
Write-Host "     git commit -m 'fix: add execute permissions to scripts'" -ForegroundColor Gray
Write-Host "  2. Faz push:" -ForegroundColor Gray
Write-Host "     git push" -ForegroundColor Gray
Write-Host ""
Write-Host "[TIP] A equipa nao vai precisar de chmod depois do pull!" -ForegroundColor Cyan
Write-Host ""

# Export Keycloak Realm Configuration
# This script exports the ESg204 realm configuration including users and roles

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Exportando configuração do Keycloak" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create temporary export directory in container
Write-Host "[1/5] Criando diretório temporário..." -ForegroundColor Yellow
docker exec keycloak mkdir -p /tmp/keycloak-export

# Step 2: Export realm with users
Write-Host "[2/5] Exportando realm ESg204..." -ForegroundColor Yellow
docker exec keycloak /opt/keycloak/bin/kc.sh export `
    --dir /tmp/keycloak-export `
    --realm ESg204 `
    --users realm_file

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha ao exportar realm!" -ForegroundColor Red
    exit 1
}

# Step 3: Copy exported file to project
Write-Host "[3/5] Copiando ficheiro para o projeto..." -ForegroundColor Yellow
docker cp keycloak:/tmp/keycloak-export/ESg204-realm.json slms-backend/keycloak-init/ESg204-realm.json

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha ao copiar ficheiro!" -ForegroundColor Red
    exit 1
}

# Step 4: Clean up temporary directory
Write-Host "[4/5] Limpando ficheiros temporários..." -ForegroundColor Yellow
docker exec keycloak rm -rf /tmp/keycloak-export

# Step 5: Show file info
Write-Host "[5/5] Export concluído com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "Informações do ficheiro:" -ForegroundColor Cyan
Get-ChildItem slms-backend/keycloak-init/ESg204-realm.json | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize

# Step 6: Show git status
Write-Host "Estado no Git:" -ForegroundColor Cyan
git status slms-backend/keycloak-init/ESg204-realm.json

Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Rever as mudanças: git diff slms-backend/keycloak-init/ESg204-realm.json"
Write-Host "2. Adicionar ao stage: git add slms-backend/keycloak-init/ESg204-realm.json"
Write-Host "3. Commit: git commit -m 'feat: update Keycloak realm with user roles configuration'"
Write-Host "4. Push: git push origin <branch-name>"
Write-Host ""

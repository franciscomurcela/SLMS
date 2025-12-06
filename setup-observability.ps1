# Script de Setup Rápido - Observabilidade Frontend
# Este script configura e inicia todos os componentes necessários para observabilidade

$ErrorActionPreference = "Stop"

Write-Host "🔭 Setup de Observabilidade - Frontend + Backend" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Função para printar com cor
function Write-Success {
    param($Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

# 1. Verificar Docker
Write-Host "1. Verificando Docker..."
try {
    docker --version | Out-Null
    Write-Success "Docker instalado"
} catch {
    Write-Error "Docker não encontrado. Por favor, instale o Docker primeiro."
    exit 1
}

# 2. Criar rede de observabilidade
Write-Host ""
Write-Host "2. Criando rede de observabilidade..."
$networkExists = docker network ls --format "{{.Name}}" | Select-String -Pattern "^rede-obs$"
if ($networkExists) {
    Write-Warning "Rede 'rede-obs' já existe"
} else {
    docker network create rede-obs
    Write-Success "Rede 'rede-obs' criada"
}

# 3. Criar rede do backend
Write-Host ""
Write-Host "3. Verificando rede do backend..."
$backendNetwork = docker network ls --format "{{.Name}}" | Select-String -Pattern "slms-backend_slms-network"
if ($backendNetwork) {
    Write-Success "Rede 'slms-backend_slms-network' já existe"
} else {
    Write-Warning "Rede do backend não encontrada. Será criada ao iniciar o backend."
}

# 4. Iniciar stack de observabilidade
Write-Host ""
Write-Host "4. Iniciando stack de observabilidade (Grafana, Tempo, Loki, Prometheus, OTel Collector)..."
Set-Location observability
docker-compose up -d
Set-Location ..

# Esperar inicialização
Write-Host "   Aguardando inicialização dos serviços..."
Start-Sleep -Seconds 10

# Verificar serviços
$services = @("otel-collector", "grafana", "tempo", "loki", "prometheus")
foreach ($service in $services) {
    $running = docker ps --format "{{.Names}}" | Select-String -Pattern "^$service$"
    if ($running) {
        Write-Success "$service está rodando"
    } else {
        Write-Error "$service NÃO está rodando"
    }
}

# 5. Iniciar backend
Write-Host ""
Write-Host "5. Iniciando backend (microserviços)..."
Set-Location slms-backend
docker-compose up -d
Set-Location ..

Write-Host "   Aguardando inicialização dos microserviços..."
Start-Sleep -Seconds 15

# 6. Instalar dependências do frontend (se necessário)
Write-Host ""
Write-Host "6. Verificando dependências do frontend..."
Set-Location react-frontend\frontend
if (-not (Test-Path "node_modules")) {
    Write-Host "   Instalando dependências..."
    npm install --legacy-peer-deps
    Write-Success "Dependências instaladas"
} else {
    Write-Success "Dependências já instaladas"
}
Set-Location ..\..

# 7. Build e iniciar frontend
Write-Host ""
Write-Host "7. Iniciando frontend com observabilidade..."
Set-Location react-frontend
docker-compose up --build -d
Set-Location ..

Write-Host "   Aguardando inicialização do frontend..."
Start-Sleep -Seconds 10

# 8. Verificar logs do frontend
Write-Host ""
Write-Host "8. Verificando inicialização da observabilidade no frontend..."
$logs = docker logs slms-frontend 2>&1 | Select-String -Pattern "OpenTelemetry Frontend iniciado com sucesso"
if ($logs) {
    Write-Success "OpenTelemetry inicializado no frontend"
} else {
    Write-Warning "Não foi possível confirmar a inicialização do OpenTelemetry"
    Write-Host "   Verifique os logs: docker logs slms-frontend"
}

# 9. Resumo final
Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "✅ Setup Concluído!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Acesso aos Serviços:"
Write-Host "   Frontend:    http://localhost"
Write-Host "   Grafana:     http://localhost:3000"
Write-Host "   Prometheus:  http://localhost:9090"
Write-Host ""
Write-Host "📊 Verificar Telemetria:"
Write-Host "   1. Acesse http://localhost e interaja com a aplicação"
Write-Host "   2. Abra http://localhost:3000 (Grafana)"
Write-Host "   3. Vá para Explore > Tempo"
Write-Host '   4. Procure por: service.name="frontend-react"'
Write-Host ""
Write-Host "🐛 Debug:"
Write-Host "   docker logs -f slms-frontend      # Logs do frontend"
Write-Host "   docker logs -f otel-collector     # Logs do collector"
Write-Host "   docker ps --filter 'network=rede-obs'  # Containers na rede de observabilidade"
Write-Host ""
Write-Host "📖 Documentação:"
Write-Host "   docs\observability.md"
Write-Host "   react-frontend\frontend\OBSERVABILITY_TEST.md"
Write-Host ""

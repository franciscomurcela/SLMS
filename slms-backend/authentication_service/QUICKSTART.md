# Quick Start - Keycloak Local Authentication

Este guia rápido permite levantar o Keycloak e começar a testar em minutos.

## Passo 1: Iniciar Keycloak

```powershell
# Na pasta authentication_service
cd slms-backend\authentication_service
docker compose -f docker-compose.keycloak.yml up -d
```

## Passo 2: Configurar Automaticamente (Recomendado)

```powershell
# Aguardar ~30 segundos e depois executar
.\scripts\setup-keycloak.ps1
```

O script cria:
- Realm `ESg204`
- Client `frontend` (public, PKCE)
- User `testuser` / password `testpass`

## Passo 3: Testar Obtenção de Token

```powershell
$body = @{
    client_id = 'frontend'
    grant_type = 'password'
    username = 'testuser'
    password = 'testpass'
    scope = 'openid profile email'
}
$response = Invoke-RestMethod -Method Post -Uri 'http://localhost:8081/realms/ESg204/protocol/openid-connect/token' -Body $body
$token = $response.access_token
Write-Host "Token obtido: $token"
```

## Passo 4: Testar Backend (se já estiver a correr)

```powershell
# Chamar endpoint protegido
Invoke-RestMethod -Method Get -Uri 'http://localhost:8080/whoami' -Headers @{ Authorization = "Bearer $token" }
```

## Admin Console

- URL: http://localhost:8081
- User: `admin`
- Pass: `admin`

## Parar Keycloak

```powershell
docker compose -f docker-compose.keycloak.yml down
```

## Limpar Tudo (Remove volumes)

```powershell
docker compose -f docker-compose.keycloak.yml down -v
```

Para mais detalhes, consulte [README.md](README.md)

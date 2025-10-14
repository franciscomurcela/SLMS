# Authentication Service - Keycloak Integration

Este serviço fornece autenticação centralizada usando Keycloak local integrado com o backend Spring Boot (Opção 2).

## Arquitetura (Opção 2)

- **Keycloak**: Roda localmente em Docker (não precisa ser exposto publicamente)
- **Backend**: Valida tokens JWT do Keycloak como Resource Server
- **Supabase**: Permanece na cloud; backend acessa com service-role key
- **Frontend**: Autentica diretamente contra Keycloak local via PKCE

## Pré-requisitos

- Docker Desktop instalado e a correr
- PowerShell 5.1+
- Variáveis de ambiente configuradas (ver `.env` na raiz do backend)

## Quick Start

### 1. Iniciar Keycloak

```powershell
# Na pasta authentication_service
cd slms-backend\authentication_service
docker compose -f docker-compose.keycloak.yml up -d
```

Aguarde ~30 segundos até o Keycloak estar pronto. Verifique com:
```powershell
docker compose -f docker-compose.keycloak.yml logs -f keycloak
```

### 2. Aceder à Admin Console

- URL: http://localhost:8081
- Username: `admin`
- Password: `admin`

### 3. Configurar Realm e Client (Manual)

#### Criar Realm
1. No dropdown superior esquerdo, clique "Create Realm"
2. Nome: `ESg204`
3. Enabled: ON
4. Save

#### Criar Client para Frontend
1. No realm `ESg204`, vá a Clients → Create Client
2. **General Settings**:
   - Client type: `OpenID Connect`
   - Client ID: `frontend`
3. **Capability config**:
   - Client authentication: OFF (public client)
   - Authorization: OFF
   - Standard flow: ON
   - Direct access grants: OFF
4. **Login settings**:
   - Valid redirect URIs: `http://localhost:5173/*`
   - Web origins: `http://localhost:5173`
5. Save

#### Criar Client para Backend (opcional, se precisar de confidential client)
1. Clients → Create Client
2. Client ID: `backend-service`
3. Client authentication: ON (confidential)
4. Save e anote o Client Secret no tab Credentials

### 4. Criar Utilizador de Teste

1. No realm `ESg204`, vá a Users → Add user
2. Username: `testuser`
3. Email: `test@example.com`
4. Save
5. Na tab **Credentials**, defina password:
   - Password: `testpass`
   - Temporary: OFF
6. Save

### 5. Configurar Backend para Validar Tokens

O backend já está configurado (ver `slms-backend/src/main/java/pt/ua/slms/security/SecurityConfig.java`).

Certifique-se que `application.properties` tem:
```properties
spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:8081/realms/ESg204
```

### 6. Testar Fluxo Completo

#### Obter Token (dev/test rápido via password grant)
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
Write-Host "Access Token: $token"
```

#### Chamar Backend Protegido
```powershell
# Assumindo backend em http://localhost:8080
Invoke-RestMethod -Method Get -Uri 'http://localhost:8080/whoami' -Headers @{ Authorization = "Bearer $token" }
```

## Configuração Automática (Script PowerShell)

Para automatizar a criação do realm e client via API, use o script fornecido:

```powershell
.\scripts\setup-keycloak.ps1
```

Este script:
- Aguarda Keycloak ficar ready
- Obtém admin token
- Cria realm `ESg204`
- Cria client `frontend` (public)
- Cria utilizador `testuser`

## Estrutura de Ficheiros

```
authentication_service/
├── docker-compose.keycloak.yml    # Keycloak + Postgres com volumes
├── README.md                       # Este ficheiro
├── keycloak-init/                  # (Opcional) Realm exports para import automático
└── scripts/
    └── setup-keycloak.ps1          # Script de configuração automática
```

## Volumes e Persistência

- `keycloak-pgdata`: Dados do Postgres (realm config, users, etc.)
- `keycloak-data`: Dados do Keycloak (themes, providers)

Para limpar tudo e recomeçar:
```powershell
docker compose -f docker-compose.keycloak.yml down -v
```

## Troubleshooting

### Keycloak não inicia
- Verifique logs: `docker compose -f docker-compose.keycloak.yml logs keycloak`
- Garanta que porta 8081 está livre

### "Invalid redirect_uri"
- Certifique-se que Valid Redirect URIs no client inclui o URI exato usado pelo frontend
- Use wildcard `http://localhost:5173/*` para desenvolvimento

### Backend não valida token
- Verifique que `issuer-uri` no `application.properties` está correto
- Teste o endpoint .well-known: `http://localhost:8081/realms/ESg204/.well-known/openid-configuration`

## Próximos Passos

1. Integrar frontend com Keycloak (PKCE flow)
2. Adicionar roles/groups e mapeá-los no backend
3. Configurar refresh tokens
4. (Produção) Expor Keycloak com TLS via Cloudflare Tunnel ou similar

## Referências

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [Spring Security OAuth2 Resource Server](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/)
- [PKCE Flow](https://oauth.net/2/pkce/)

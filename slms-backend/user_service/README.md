# User Service

Microserviço dedicado para **autenticação e gestão de utilizadores** no sistema SLMS.

## 📋 Responsabilidades

Este serviço é responsável por:

1. ✅ **Validar tokens JWT** do Keycloak em todos os pedidos
2. ✅ **Sincronizar utilizadores** automaticamente com Supabase
3. ✅ **Fornecer endpoints de utilizador** (`/user/whoami`, `/user/profile`)
4. ✅ **Centralizar autenticação** para todos os microserviços

## 🏗️ Arquitetura

```
Frontend (Keycloak login via PKCE)
    ↓ JWT Token
User Service (port 8082)
    ↓ Valida JWT contra Keycloak JWKS
    ↓ UserSyncFilter intercepta pedido
    ↓ UserSyncService
    ↓ Cria/Atualiza utilizador no Supabase
Supabase (Users table)
```

### Separação de Responsabilidades

- **authentication_service**: Keycloak em Docker (OAuth2 server)
- **user_service** ⭐: Valida tokens + sincroniza users (este serviço)
- **carrier_service**: Lógica de negócio de carriers (não lida com auth)
- **order_service**: Lógica de negócio de orders (não lida com auth)

## 🚀 Como Executar

### Pré-requisitos

1. Keycloak a correr (porta 8083)
2. Supabase configurado com tabela `Users`
3. Java 17+
4. Maven 3.6+

### 1. Configure Variáveis de Ambiente

Crie `.env` na raiz do `user_service`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Compile e Execute

```bash
cd slms-backend/user_service
mvn clean install
mvn spring-boot:run
```

O serviço estará disponível em: **http://localhost:8082**

## 📡 Endpoints

### `GET /user/whoami` (🔒 Autenticado)

Retorna informação do utilizador autenticado extraída do JWT.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Resposta:**
```json
{
  "sub": "8b9d8679-b64f-4a53-a774-af356f9889c8",
  "email": "test@example.com",
  "preferred_username": "testuser",
  "email_verified": false,
  "message": "User authenticated successfully",
  "service": "user_service"
}
```

### `GET /user/profile` (🔒 Autenticado)

Retorna perfil do utilizador.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Resposta:**
```json
{
  "keycloak_id": "8b9d8679-b64f-4a53-a774-af356f9889c8",
  "email": "test@example.com",
  "username": "testuser",
  "email_verified": false,
  "note": "User data synchronized with Supabase"
}
```

### `GET /actuator/health` (🌐 Público)

Health check do serviço.

**Resposta:**
```json
{
  "status": "UP"
}
```

## 🔧 Configuração

### `application.properties`

```properties
spring.application.name=user_service
server.port=8082

# Keycloak JWT validation
spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:8083/realms/ESg204

# Supabase
supabase.url=${SUPABASE_URL}
supabase.service-role-key=${SUPABASE_SERVICE_ROLE_KEY}

# Logging
logging.level.es204.user_service=INFO
logging.level.es204.user_service.sync=DEBUG
```

## 🔐 Segurança

### SecurityConfig

- **OAuth2 Resource Server**: Valida JWT contra Keycloak JWKS
- **Endpoints protegidos**: Todos os `/user/**` requerem autenticação
- **UserSyncFilter**: Sincroniza utilizador após autenticação bem-sucedida

### Fluxo de Autenticação

1. Frontend envia pedido com `Authorization: Bearer <token>`
2. Spring Security valida token contra Keycloak
3. Se válido, `UserSyncFilter` extrai claims (`sub`, `email`, `preferred_username`)
4. `UserSyncService` verifica se utilizador existe no Supabase
5. Se não existir → cria; Se existir → atualiza `last_login`
6. Pedido continua para o controller

## 🗄️ Integração com Supabase

### Tabela `Users`

O serviço assume que a tabela `Users` tem:

```sql
CREATE TABLE public."Users" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255),
  email varchar(100),
  keycloak_id uuid UNIQUE,
  last_login timestamp without time zone DEFAULT (now() AT TIME ZONE 'utc')
);

CREATE INDEX idx_users_keycloak_id ON public."Users"(keycloak_id);
```

### UserSyncService

- **findUserByKeycloakId**: Query Supabase por `keycloak_id`
- **createUser**: `POST /rest/v1/Users` com dados do JWT
- **updateLastLogin**: `PATCH /rest/v1/Users` atualiza timestamp

## 🧪 Testar

### 1. Via cURL

```bash
# Obter token do Keycloak (substitua credenciais)
TOKEN=$(curl -X POST http://localhost:8083/realms/ESg204/protocol/openid-connect/token \
  -d "client_id=frontend" \
  -d "username=testuser" \
  -d "password=testpass" \
  -d "grant_type=password" | jq -r '.access_token')

# Chamar /user/whoami
curl -H "Authorization: Bearer $TOKEN" http://localhost:8082/user/whoami
```

### 2. Via Frontend

Navegue para `http://localhost:5173/auth-test` e clique em "Testar chamada ao Backend".

**Nota**: Atualize o `BACKEND_URL` no frontend para:
```typescript
export const BACKEND_URL = 'http://localhost:8082';
```

## 📂 Estrutura do Código

```
user_service/
├── pom.xml
├── Dockerfile
├── docker-compose.yml
├── .env
└── src/main/
    ├── java/es204/user_service/
    │   ├── UserServiceApplication.java    # Main class
    │   ├── config/
    │   │   └── SecurityConfig.java         # Spring Security + OAuth2
    │   ├── controller/
    │   │   └── UserController.java         # REST endpoints
    │   ├── model/
    │   │   └── UserDTO.java                # DTO para tabela Users
    │   └── sync/
    │       ├── UserSyncService.java        # Sincroniza com Supabase
    │       └── UserSyncFilter.java         # Intercepta pedidos autenticados
    └── resources/
        └── application.properties          # Configuração
```

## 🔄 Integração com Outros Serviços

### Como outros microserviços devem usar este serviço

Os outros microserviços (carrier_service, order_service, etc.) **NÃO precisam** de validar tokens JWT. Podem:

**Opção 1: API Gateway Pattern**
- Todos os pedidos passam pelo `user_service` primeiro
- `user_service` valida token e adiciona header `X-User-Id`
- Outros serviços confiam no header

**Opção 2: Service-to-Service Communication**
- Outros serviços chamam `/user/whoami` com o token
- Obtêm `keycloak_id` para usar nas suas queries

**Opção 3: Shared JWT Validation (atual no carrier_service)**
- Cada serviço valida JWT independentemente
- ⚠️ Duplicação de código (não recomendado)

## 🛠️ Troubleshooting

### Token inválido (401)

**Problema**: `401 Unauthorized`

**Soluções**:
1. Verifique se Keycloak está a correr em `http://localhost:8083`
2. Teste o JWKS endpoint:
   ```bash
   curl http://localhost:8083/realms/ESg204/protocol/openid-connect/certs
   ```
3. Verifique se `issuer-uri` está correto no `application.properties`

### Utilizador não é criado no Supabase

**Problema**: JWT valida mas utilizador não aparece no Supabase

**Soluções**:
1. Verifique logs do serviço (nível DEBUG):
   ```
   logging.level.es204.user_service.sync=DEBUG
   ```
2. Verifique se `SUPABASE_SERVICE_ROLE_KEY` está correto
3. Teste manualmente:
   ```bash
   curl -H "apikey: $SUPABASE_KEY" \
        -H "Authorization: Bearer $SUPABASE_KEY" \
        https://your-project.supabase.co/rest/v1/Users
   ```

### CORS error

**Problema**: Frontend não consegue chamar o serviço

**Solução**: Verifique `@CrossOrigin` em `UserController`:
```java
@CrossOrigin(origins = "http://localhost:5173")
```

## 📚 Documentação Relacionada

- [Keycloak Setup](../authentication_service/README.md)
- [Supabase Migration](../config/supabase-migrations/001_add_last_login.sql)

## 🎯 Próximos Passos

1. ✅ Criar `user_service` separado (feito)
2. 🔄 Implementar API Gateway pattern
3. 🔄 Adicionar cache Redis para utilizadores
4. 🔄 Adicionar endpoints de gestão de roles
5. 🔄 Implementar rate limiting por utilizador
6. 🔄 Adicionar métricas de autenticação (Prometheus)

---

**Porta**: 8082  
**Autor**: ES2526_204  
**Última atualização**: Outubro 2025

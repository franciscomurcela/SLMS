# User Auto-Sync com Keycloak + Supabase

## 📋 Visão Geral

Este sistema sincroniza automaticamente utilizadores autenticados pelo Keycloak com a base de dados Supabase. Quando um utilizador faz login no frontend via Keycloak e faz um pedido ao backend, o sistema:

1. ✅ **Verifica** se o utilizador existe no Supabase (pela `keycloak_id`)
2. ✅ **Cria** o utilizador se não existir
3. ✅ **Atualiza** o campo `last_login` se já existir

## 🏗️ Arquitetura

```
Frontend (Keycloak login)
    ↓ JWT Token
Backend (Spring Boot)
    ↓ UserSyncFilter intercepta pedido
    ↓ Extrai claims do JWT (sub, email, preferred_username)
    ↓ UserSyncService
    ↓ Verifica/Cria/Atualiza utilizador
Supabase (Users table)
```

## 📦 Componentes Criados

### 1. `UserDTO.java`
DTO (Data Transfer Object) que mapeia para a tabela `Users` do Supabase.

**Campos:**
- `id` (UUID) - PK gerada pelo Supabase
- `keycloak_id` (UUID) - ID do utilizador no Keycloak (do claim `sub`)
- `name` (String) - Nome do utilizador
- `email` (String) - Email do utilizador
- `last_login` (Instant) - Última data/hora de login

### 2. `UserSyncService.java`
Serviço que comunica com a API REST do Supabase.

**Métodos:**
- `syncUser()` - Ponto de entrada: sincroniza utilizador (cria ou atualiza)
- `findUserByKeycloakId()` - Procura utilizador pelo `keycloak_id`
- `createUser()` - Cria novo utilizador no Supabase
- `updateLastLogin()` - Atualiza timestamp do último login

### 3. `UserSyncFilter.java`
Filtro Spring que intercepta **todos os pedidos autenticados**.

**Funcionamento:**
1. Verifica se o pedido está autenticado (JWT presente)
2. Extrai claims do token JWT (`sub`, `email`, `preferred_username`)
3. Chama `UserSyncService.syncUser()`
4. Continua com o pedido (não bloqueia mesmo se der erro)

### 4. `SecurityConfig.java` (atualizado)
Configuração Spring Security com:
- OAuth2 Resource Server (validação JWT)
- UserSyncFilter registado após autenticação
- Endpoints públicos (`/carriers`, `/actuator/health`)

## 🗄️ Migração de Base de Dados

Execute o seguinte SQL no Supabase:

```sql
-- Add last_login column to Users table
ALTER TABLE public.Users 
ADD COLUMN IF NOT EXISTS last_login timestamp without time zone DEFAULT (now() AT TIME ZONE 'utc');

-- Create index on keycloak_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_keycloak_id ON public.Users(keycloak_id);

-- Comment
COMMENT ON COLUMN public.Users.last_login IS 'Last time the user logged in via Keycloak';
```

## ⚙️ Configuração

### `application.properties` ou `.env`

```properties
# Keycloak (para validar tokens JWT)
spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:8081/realms/ESg204

# Supabase (para guardar utilizadores)
supabase.url=https://your-project.supabase.co
supabase.service-role-key=your-service-role-key-here
```

### Variáveis de Ambiente (recomendado)

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 🚀 Como Funciona

### Fluxo de Autenticação Completo

1. **Frontend**: Utilizador clica "Login com Keycloak"
   ```typescript
   keycloak.login(); // Redireciona para Keycloak
   ```

2. **Keycloak**: Utilizador autentica (testuser/testpass)
   - Keycloak emite JWT token com claims:
     - `sub`: "8b9d8679-b64f-4a53-a774-af356f9889c8"
     - `email`: "test@example.com"
     - `preferred_username`: "testuser"

3. **Frontend**: Recebe token e guarda no contexto
   ```typescript
   const token = keycloak.token;
   ```

4. **Frontend**: Faz pedido ao backend com token
   ```typescript
   fetch('http://localhost:8080/api/orders', {
     headers: {
       'Authorization': `Bearer ${token}`
     }
   });
   ```

5. **Backend**: `UserSyncFilter` intercepta o pedido
   - Extrai JWT do header `Authorization`
   - Valida token contra Keycloak JWKS
   - Extrai claims (`sub`, `email`, `preferred_username`)

6. **Backend**: `UserSyncService.syncUser()`
   - Faz query ao Supabase: `GET /rest/v1/Users?keycloak_id=eq.{sub}`
   - Se não existir → `POST /rest/v1/Users` (cria utilizador)
   - Se existir → `PATCH /rest/v1/Users?id=eq.{id}` (atualiza `last_login`)

7. **Backend**: Continua processamento do pedido original
   - O utilizador está agora garantido no Supabase
   - Controller pode fazer queries com `user_id`

## 🧪 Testar

### 1. Execute a migração SQL no Supabase

No Supabase Dashboard:
- SQL Editor → New Query → Cole o SQL acima → Run

### 2. Configure variáveis de ambiente

Crie `.env` na raiz do projeto:
```bash
SUPABASE_URL=https://xyzabc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1Ni...
```

### 3. Inicie o backend

```bash
cd slms-backend/carrier_service/carrier_service
mvn spring-boot:run
```

### 4. Teste no frontend

```bash
cd react-frontend/frontend
npm run dev
```

- Navegue para http://localhost:5173
- Clique "Login com Keycloak"
- Autentique com `testuser` / `testpass`
- Vá para http://localhost:5173/auth-test
- Clique "Testar chamada ao Backend"

### 5. Verifique no Supabase

No Supabase → Table Editor → Users:
- Deve ver o utilizador criado automaticamente
- `keycloak_id` = "8b9d8679-b64f-4a53-a774-af356f9889c8"
- `email` = "test@example.com"
- `name` = "testuser"
- `last_login` = timestamp atual

## 📊 Logs

No backend, verá logs como:

```
DEBUG es204.carrier_service.user.UserSyncFilter - User synced: keycloak_id=8b9d8679-b64f-4a53-a774-af356f9889c8, email=test@example.com
INFO  es204.carrier_service.user.UserSyncService - User with keycloak_id 8b9d8679-b64f-4a53-a774-af356f9889c8 not found, creating new user
INFO  es204.carrier_service.user.UserSyncService - User created successfully with id: a1b2c3d4-...
```

## 🔒 Segurança

- ✅ JWT é validado contra Keycloak JWKS
- ✅ Supabase usa service-role key (apenas backend tem acesso)
- ✅ Frontend nunca tem acesso direto ao Supabase
- ✅ UserSyncFilter não bloqueia pedido se der erro (graceful degradation)

## 🛠️ Troubleshooting

### Erro: "User not found" mas não cria
- Verifique se `SUPABASE_SERVICE_ROLE_KEY` está correto
- Verifique se a tabela `Users` existe
- Verifique se a coluna `keycloak_id` aceita UUID

### Erro: CORS ao chamar backend
- Verifique se `WebConfig` permite origem do frontend
- Adicione `@CrossOrigin(origins = "http://localhost:5173")` no controller

### Token inválido
- Verifique se `spring.security.oauth2.resourceserver.jwt.issuer-uri` está correto
- Deve ser: `http://localhost:8081/realms/ESg204`

## 📚 Próximos Passos

1. Adicionar roles do Keycloak aos claims
2. Mapear roles para tabelas (`Driver`, `LogisticsManager`, etc.)
3. Adicionar endpoint `/user/profile` para ver perfil
4. Adicionar testes unitários para `UserSyncService`

## 🎉 Conclusão

O sistema agora cria utilizadores automaticamente no Supabase quando fazem login via Keycloak! Não é necessário endpoint de registo separado. 🚀

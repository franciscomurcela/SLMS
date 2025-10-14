# SLMS - Shipping & Logistics Management System

Sistema de gestão de logística e envios com autenticação Keycloak e base de dados Supabase.

---
## 📋 Pré-requisitos

- **Docker** e **Docker Compose** instalados
- **Node.js** (v18 ou superior) e **npm**
- **Java 17** ou superior
- **Maven** 3.6+
- **PowerShell** (Windows) ou **Bash** (Linux/Mac)

---

## 🚀 Quick Start

### 1️⃣ Setup Inicial

#### Configure as Variáveis de Ambiente

Execute o script de setup para criar os ficheiros `.env`:

**Windows (PowerShell):**
```powershell
.\scripts\create-env.sh
```

**Linux/Mac (Bash):**
```bash
chmod +x scripts/create-env.sh
./scripts/create-env.sh
```

Depois, **edite os ficheiros `.env` criados** e preencha as variáveis do Supabase:
- `slms-backend/carrier_service/carrier_service/.env`
- `slms-backend/authentication_service/.env`

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 2️⃣ Inicie os Serviços

#### A. Authentication Service (Keycloak)

O Keycloak é necessário para autenticação OAuth2/OIDC.

```powershell
cd slms-backend/authentication_service
docker compose -f docker-compose.keycloak.yml up -d
```

**Aguarde ~30 segundos** para o Keycloak inicializar, depois configure o realm:

```powershell
cd scripts
.\setup-keycloak.ps1
```

O script cria:
- ✅ Realm `ESg204`
- ✅ Client `frontend` (público, PKCE habilitado)
- ✅ Utilizador de teste: `testuser` / `testpass`

**Keycloak Admin Console:** http://localhost:8081
- Username: `admin`
- Password: `admin`

#### B. Carrier Service (Backend Spring Boot)

O carrier_service é o backend principal que valida tokens JWT e sincroniza utilizadores com o Supabase.

```powershell
cd slms-backend/carrier_service/carrier_service
mvn clean install
mvn spring-boot:run
```

O serviço estará disponível em: **http://localhost:8080**

**Endpoints disponíveis:**
- `GET /carriers` - Lista carriers (público)
- `GET /db/test` - Testa conexão à BD (público)
- `GET /actuator/health` - Health check (público)

---

### 3️⃣ Inicie o Frontend

O frontend React usa Keycloak para autenticação via PKCE.

```powershell
cd react-frontend/frontend
npm install
npm run dev
```

Aceda ao frontend em: **http://localhost:5173**

---

## 🧪 Testar o Sistema

### 1. Teste de Autenticação

1. Vá para **http://localhost:5173**
2. Clique em **"Login com Keycloak"**
3. Autentique com:
   - Username: `testuser`
   - Password: `testpass`
4. Deve ser redirecionado de volta ao frontend autenticado

### 2. Teste de Sincronização de Utilizadores

1. Após login, navegue para **http://localhost:5173/auth-test**
2. Clique em **"Testar chamada ao Backend (/user/whoami)"**
3. Deve ver:
   - ✅ Token JWT válido
   - ✅ Informação do utilizador
   - ✅ Resposta do backend

### 3. Verifique no Supabase

No **Supabase Dashboard** → **Table Editor** → **Users**:
- Deve ver o utilizador `testuser` criado automaticamente
- `keycloak_id` = UUID do Keycloak
- `email` = "test@example.com"
- `last_login` = timestamp atual

---

## 📂 Estrutura do Projeto

```
group-project-es2526_204/
├── react-frontend/frontend/          # Frontend React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── PageLogin.tsx         # Página de login
│   │   │   ├── AuthTest.tsx          # Página de teste de autenticação
│   │   │   └── ProtectedRoute.tsx    # Guard para rotas protegidas
│   │   ├── context/
│   │   │   └── KeycloakContext.tsx   # Context Provider do Keycloak
│   │   └── config/
│   │       └── keycloak.config.ts    # Configuração do Keycloak
│   └── package.json
│
├── slms-backend/
│   ├── authentication_service/       # Serviço de autenticação (Keycloak)
│   │   ├── docker-compose.keycloak.yml
│   │   ├── scripts/
│   │   │   └── setup-keycloak.ps1    # Script de setup do Keycloak
│   │   ├── README.md
│   │   └── QUICKSTART.md
│   │
│   ├── carrier_service/carrier_service/  # Backend Spring Boot
│   │   ├── src/main/java/es204/carrier_service/
│   │   │   ├── SecurityConfig.java   # Spring Security + OAuth2
│   │   │   └── user/
│   │   │       ├── UserSyncService.java
│   │   │       ├── UserSyncFilter.java
│   │   │       └── UserDTO.java
│   │   ├── pom.xml
│   │   └── USER_SYNC_README.md
│   │
│   └── config/
│       └── supabase-migrations/
│           └── 001_add_last_login.sql
│
├── scripts/
│   └── create-env.sh
│
└── README.md
```

---

## 🔧 Comandos Úteis

### Parar os Serviços

**Keycloak:**
```powershell
cd slms-backend/authentication_service
docker compose -f docker-compose.keycloak.yml down
```

**Backend:** Pressione `Ctrl+C` no terminal

**Frontend:** Pressione `Ctrl+C` no terminal

### Ver Logs

**Keycloak:**
```powershell
docker compose -f docker-compose.keycloak.yml logs -f keycloak
```


## 🔐 Utilizadores de Teste

### Keycloak Admin
- URL: http://localhost:8081
- Username: `admin`
- Password: `admin`

### Aplicação
- Username: `testuser`
- Password: `testpass`
- Email: `test@example.com`

---

## 🛠️ Troubleshooting

### Keycloak não inicia
```powershell
docker compose -f docker-compose.keycloak.yml down -v
docker compose -f docker-compose.keycloak.yml up -d


## 📚 Documentação Adicional

- **Keycloak Setup**: `slms-backend/authentication_service/README.md`
- **User Sync System**: `slms-backend/carrier_service/carrier_service/USER_SYNC_README.md`

---

## 🚀 Start Rápido (TL;DR)

```powershell
# 1. Setup
.\scripts\create-env.sh
# (Edite os .env com credenciais do Supabase)

# 2. Keycloak
cd slms-backend\authentication_service
docker compose -f docker-compose.keycloak.yml up -d
cd scripts
.\setup-keycloak.ps1

# 3. Execute migração SQL no Supabase Dashboard

# 4. Backend
cd slms-backend\carrier_service\carrier_service
mvn spring-boot:run

# 5. Frontend (outro terminal)
cd react-frontend\frontend
npm install
npm run dev

# 6. Aceda a http://localhost:5173 e login com testuser/testpass
```

🎉 **Sistema pronto!**

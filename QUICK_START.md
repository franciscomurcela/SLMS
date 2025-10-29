# 🚀 Guia Rápido - Configurar Nginx para Porta 80

## ✅ Alterações Feitas

1. **Frontend** - URLs agora usam paths relativos (`/auth`, `/api`)
2. **Backend** - Keycloak configurado com path `/auth`
3. **Nginx** - Configuração de cookies com SameSite=Lax
4. **Componentes** - Todos os hardcoded URLs removidos

## 📝 Passos para Aplicar (Windows PowerShell)

### 1️⃣ Parar containers atuais
```powershell
cd C:\Users\Asus\Documents\GitHub\group-project-es2526_204\slms-backend
docker-compose down

cd ..\react-frontend
docker-compose down
```

### 2️⃣ Rebuild do Frontend
```powershell
cd C:\Users\Asus\Documents\GitHub\group-project-es2526_204\react-frontend\frontend

# Instalar dependências (se necessário)
npm install

# Build da aplicação
npm run build

cd ..
docker-compose build --no-cache frontend
```

### 3️⃣ Iniciar Backend (aguardar Keycloak)
```powershell
cd C:\Users\Asus\Documents\GitHub\group-project-es2526_204\slms-backend
docker-compose up -d

# Acompanhar logs do Keycloak
docker logs -f keycloak
```
👉 **Aguarde ver**: `Keycloak ... started in ...` (pressione `Ctrl+C` depois)

### 4️⃣ Iniciar Frontend
```powershell
cd C:\Users\Asus\Documents\GitHub\group-project-es2526_204\react-frontend
docker-compose up -d
```

### 5️⃣ Verificar Status
```powershell
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Deve mostrar:
- ✅ `slms-frontend` - 0.0.0.0:3000->80/tcp
- ✅ `keycloak` - 0.0.0.0:8083->8080/tcp
- ✅ `user-service` - 0.0.0.0:8082->8082/tcp
- ✅ `carrier-service` - 0.0.0.0:8080->8080/tcp
- ✅ `order-service` - 0.0.0.0:8081->8080/tcp
- ✅ `slms-db` - 0.0.0.0:5432->5432/tcp

### 6️⃣ Verificar Nginx
```bash
# No WSL ou Git Bash
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl status nginx
```

## 🌐 Testar a Aplicação

### No Chrome (SEM flags desativadas!):

1. Aceder: **http://192.168.160.9/**
2. Fazer login com utilizador de teste
3. Verificar que funciona corretamente

### URLs Corretas:
- 🏠 Frontend: http://192.168.160.9/
- 🔐 Keycloak: http://192.168.160.9/auth/
- 📊 API: http://192.168.160.9/api/...
- 🚚 Carriers: http://192.168.160.9/carriers/

## 🐛 Debug (se algo não funcionar)

### Ver logs:
```powershell
# Frontend
docker logs slms-frontend

# Keycloak
docker logs keycloak

# User Service
docker logs user-service

# Nginx (no Linux/WSL)
sudo tail -f /var/log/nginx/slms_error.log
```

### Testar endpoints individualmente:
```powershell
# Keycloak
curl http://192.168.160.9/auth/realms/ESg204

# Frontend
curl http://192.168.160.9/

# API Health
curl http://192.168.160.9/health
```

### Reiniciar containers específicos:
```powershell
# Reiniciar frontend
docker restart slms-frontend

# Reiniciar keycloak
docker restart keycloak

# Reiniciar todos os backend services
cd C:\Users\Asus\Documents\GitHub\group-project-es2526_204\slms-backend
docker-compose restart
```

## ⚠️ Notas Importantes

1. **SEMPRE** usar `http://192.168.160.9/` (sem porta)
2. **NUNCA** usar `http://192.168.160.9:3000/`
3. **NÃO** usar `localhost` ou `127.0.0.1`
4. **Aguardar** ±30 segundos após iniciar o Keycloak antes de iniciar o frontend
5. Se der erro 502 Bad Gateway, verificar se todos os containers estão rodando

## 🎯 Troubleshooting Específico

### ❌ Erro: "Failed to fetch" no login
**Causa**: Keycloak não está acessível
**Solução**:
```powershell
docker logs keycloak
docker restart keycloak
```

### ❌ Erro: CORS
**Causa**: Nginx não está a fazer proxy corretamente
**Solução**: Verificar se Nginx está a correr e recarregar configuração

### ❌ Erro: Cookies não salvam
**Causa**: Acesso incorreto (usando porta ou localhost)
**Solução**: Usar **apenas** `http://192.168.160.9/`

### ❌ Erro: 502 Bad Gateway
**Causa**: Container não está a responder
**Solução**:
```powershell
docker ps -a  # Ver containers parados
docker logs <container-name>  # Ver erro específico
docker restart <container-name>
```

## 📚 Arquivos Modificados

- ✅ `react-frontend/frontend/src/config/keycloak.config.ts`
- ✅ `react-frontend/frontend/src/config/api.config.ts` (NOVO)
- ✅ `react-frontend/frontend/src/components/CarriersPanel.tsx`
- ✅ `react-frontend/frontend/src/components/LogisticsManager.tsx`
- ✅ `react-frontend/frontend/src/components/PageProcessOrder.tsx`
- ✅ `react-frontend/frontend/src/components/OrdersPanel.tsx`
- ✅ `slms-backend/docker-compose.yml`
- ✅ `nginx-host-config/slms-single-origin.conf`


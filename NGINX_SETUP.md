# Configuração do Nginx para Acesso na Porta 80

## 📋 Resumo das Alterações

Para fazer o projeto funcionar em `http://192.168.160.9/` (porta 80) sem precisar desativar as flags do Chrome, foram feitas as seguintes alterações:

### 1. **Frontend - Configuração do Keycloak**
- **Arquivo**: `react-frontend/frontend/src/config/keycloak.config.ts`
- **Mudança**: URLs agora usam paths relativos através do Nginx
  - Keycloak: `http://192.168.160.9/auth` (em vez de `:8083`)
  - Backend: `http://192.168.160.9/api` (em vez de `:8082`)

### 2. **Backend - Docker Compose**
- **Arquivo**: `slms-backend/docker-compose.yml`
- **Mudanças no Keycloak**:
  - Adicionado `KC_HTTP_RELATIVE_PATH: '/auth'`
  - Configurado `KC_HOSTNAME_URL` e `KC_HOSTNAME_ADMIN_URL` para usar `/auth`
  
- **Mudanças nos Services (user-service, carrier-service)**:
  - `KEYCLOAK_JWK_SET_URI`: `http://keycloak:8080/auth/realms/...`
  - `KEYCLOAK_ISSUER_URI`: `http://192.168.160.9/auth/realms/ESg204`

### 3. **Nginx - Proxy Configuration**
- **Arquivo**: `nginx-host-config/slms-single-origin.conf`
- **Adicionado**: Configuração de cookies para SameSite=Lax

## 🚀 Como Aplicar as Mudanças

### Opção 1: Script Automático (Recomendado)
```bash
cd /c/Users/Asus/Documents/GitHub/group-project-es2526_204
bash scripts/restart-for-nginx.sh
```

### Opção 2: Passo a Passo Manual

1. **Parar todos os containers**
```bash
cd slms-backend
docker-compose down

cd ../react-frontend
docker-compose down
```

2. **Rebuild do Frontend**
```bash
cd react-frontend/frontend
npm run build

cd ..
docker-compose build --no-cache frontend
```

3. **Iniciar Backend**
```bash
cd ../slms-backend
docker-compose up -d
```

4. **Aguardar Keycloak iniciar (±30 segundos)**
```bash
docker logs -f keycloak
# Aguarde ver: "Keycloak ... started"
# Pressione Ctrl+C quando ver isso
```

5. **Iniciar Frontend**
```bash
cd ../react-frontend
docker-compose up -d
```

## 🔍 Verificação

### 1. Verificar containers em execução:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Deve mostrar:
- `slms-frontend` - porta 3000
- `keycloak` - porta 8083
- `user-service` - porta 8082
- `carrier-service` - porta 8080
- `order-service` - porta 8081
- `slms-db` - porta 5432
- `keycloak-db` - porta 5433

### 2. Verificar Nginx:
```bash
sudo nginx -t
sudo systemctl status nginx
```

### 3. Testar URLs:

**No navegador (Chrome sem flags especiais):**
- Frontend: http://192.168.160.9/
- Keycloak: http://192.168.160.9/auth/
- Health Check: http://192.168.160.9/health

### 4. Verificar Logs em Caso de Erro:

```bash
# Frontend
docker logs -f slms-frontend

# Keycloak
docker logs -f keycloak

# User Service
docker logs -f user-service

# Nginx
sudo tail -f /var/log/nginx/slms_error.log
```

## 🐛 Troubleshooting

### Problema: "Failed to fetch" no login
**Solução**: Verificar se Keycloak está acessível:
```bash
curl -I http://192.168.160.9/auth/realms/ESg204
```
Deve retornar `200 OK`

### Problema: CORS errors
**Solução**: Verificar se Nginx está configurado corretamente:
```bash
curl -I http://192.168.160.9/api/users/whoami
```

### Problema: Cookies não funcionam
**Verificar**:
1. Acesso deve ser por `http://192.168.160.9/` (sem porta)
2. Não usar `localhost` ou `127.0.0.1`
3. Verificar nas DevTools > Application > Cookies se aparecem cookies do Keycloak

### Problema: Keycloak não inicia
**Verificar database**:
```bash
docker logs keycloak-db
docker exec -it keycloak-db psql -U keycloak -d keycloak -c "\dt"
```

## 📌 Notas Importantes

1. **Sempre use** `http://192.168.160.9/` (sem porta) no navegador
2. **Não use** `http://192.168.160.9:3000/`
3. **SameSite Cookies**: Como está em HTTP, os cookies funcionam com `SameSite=Lax`
4. **Rede Universitária**: Se houver firewall, pode ser necessário pedir ao IT para liberar a porta 80

## 🔐 URLs Corretas

| Serviço | URL Antiga (porta) | URL Nova (Nginx) |
|---------|-------------------|------------------|
| Frontend | `http://192.168.160.9:3000/` | `http://192.168.160.9/` |
| Keycloak | `http://192.168.160.9:8083/` | `http://192.168.160.9/auth/` |
| User API | `http://192.168.160.9:8082/api/users/` | `http://192.168.160.9/api/users/` |
| Orders API | `http://192.168.160.9:8081/api/orders/` | `http://192.168.160.9/api/orders/` |
| Carriers API | `http://192.168.160.9:8080/carriers/` | `http://192.168.160.9/carriers/` |


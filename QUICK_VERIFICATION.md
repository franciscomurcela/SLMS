# Quick Verification Commands - Frontend Observability

## 🔍 Verificação Rápida do Estado Atual

### 1. Verificar se todos os containers estão rodando
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "slms-frontend|otel-collector|grafana|tempo|loki|prometheus"
```

### 2. Verificar redes do frontend
```bash
docker inspect slms-frontend --format='{{range $key, $value := .NetworkSettings.Networks}}{{$key}} {{end}}'
```
**Esperado:** `slms-network rede-obs` (ou similar)

### 3. Verificar se OTel está inicializado no frontend
```bash
docker logs slms-frontend 2>&1 | grep -i "opentelemetry"
```
**Esperado:** `🔭 OpenTelemetry Frontend iniciado com sucesso`

### 4. Verificar se collector está recebendo traces
```bash
docker logs otel-collector --tail 50 | grep -i "trace"
```

### 5. Testar endpoint de traces manualmente
```bash
curl -v -X POST http://localhost/v1/traces \
  -H "Content-Type: application/json" \
  -d '{"resourceSpans":[]}'
```
**Esperado:** HTTP 200 ou 400 (não deve ser 404 ou CORS error)

---

## 🚀 Comandos de Restart (se algo não funcionar)

### Restart completo do frontend (rebuild)
```bash
cd react-frontend
docker-compose down
docker-compose up --build -d
cd ..
```

### Restart apenas do frontend (sem rebuild)
```bash
docker-compose -f react-frontend/docker-compose.yml restart frontend
```

### Restart do stack de observabilidade
```bash
cd observability
docker-compose restart
cd ..
```

### Restart do OTel Collector apenas
```bash
docker-compose -f observability/docker-compose.yml restart otel-collector
```

---

## 🔧 Comandos de Debug

### Ver logs em tempo real (frontend)
```bash
docker logs -f slms-frontend
```

### Ver logs em tempo real (OTel Collector)
```bash
docker logs -f otel-collector
```

### Ver últimas 100 linhas de logs
```bash
docker logs --tail 100 slms-frontend
docker logs --tail 100 otel-collector
```

### Entrar no container do frontend (debug avançado)
```bash
docker exec -it slms-frontend /bin/sh
```

### Verificar conectividade do frontend para o collector
```bash
docker exec slms-frontend wget -O- http://otel-collector:4318/v1/traces
```

---

## 📊 Verificar Traces no Grafana (via CLI)

### Listar traces recentes no Tempo
```bash
curl -s http://localhost:3200/api/search | jq '.'
```

### Buscar traces do frontend
```bash
curl -s "http://localhost:3200/api/search?tags=service.name%3Dfrontend-react" | jq '.'
```

---

## 🧹 Limpeza (se precisar recomeçar do zero)

### Parar e remover todos os containers
```bash
cd observability && docker-compose down && cd ..
cd slms-backend && docker-compose down && cd ..
cd react-frontend && docker-compose down && cd ..
```

### Remover volumes (⚠️ apaga dados persistidos)
```bash
docker volume rm $(docker volume ls -q | grep -E "loki-data|grafana-data|tempo-data")
```

### Recriar rede de observabilidade
```bash
docker network rm rede-obs
docker network create rede-obs
```

---

## 📱 Validação no Browser

### 1. Abrir DevTools
1. Acesse http://localhost
2. Pressione F12 (DevTools)
3. Vá para a aba **Console**

### 2. Verificar inicialização do OTel
Procure por:
```
🔭 OpenTelemetry Frontend iniciado com sucesso em: /v1/traces
```

### 3. Verificar requisições de telemetria
1. Vá para a aba **Network**
2. Filtre por "traces"
3. Interaja com a aplicação (clique em botões, navegue)
4. Deve aparecer requisições `POST /v1/traces` com status `200`

### 4. Verificar se não há erros de CORS
No console, **NÃO** deve aparecer:
```
Access to fetch at 'http://...' has been blocked by CORS policy
```

---

## 🎯 Verificação Final (Checklist)

Execute estes comandos em ordem:

```bash
# 1. Containers rodando?
echo "=== Containers Rodando ==="
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "slms-frontend|otel"

# 2. Frontend na rede certa?
echo -e "\n=== Redes do Frontend ==="
docker inspect slms-frontend --format='{{range $key, $value := .NetworkSettings.Networks}}{{$key}} {{end}}'

# 3. OTel inicializado?
echo -e "\n=== Inicialização OTel ==="
docker logs slms-frontend 2>&1 | grep "OpenTelemetry"

# 4. Endpoint respondendo?
echo -e "\n=== Teste Endpoint ==="
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" -X POST http://localhost/v1/traces \
  -H "Content-Type: application/json" \
  -d '{"resourceSpans":[]}'

# 5. Collector recebendo dados?
echo -e "\n=== Logs do Collector (últimas 10 linhas) ==="
docker logs otel-collector --tail 10

echo -e "\n=== ✅ Verificação Completa ==="
```

**Se todos os passos acima passarem, a observabilidade está funcionando!**

---

## 🆘 Se Ainda Não Funcionar

### 1. Reinstalar dependências do frontend
```bash
cd react-frontend/frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
cd ../..
```

### 2. Rebuild completo (sem cache)
```bash
cd react-frontend
docker-compose build --no-cache frontend
docker-compose up -d
cd ..
```

### 3. Verificar se porta 4318 está sendo usada por outro processo
```bash
# Linux/Mac
sudo lsof -i :4318

# Windows (PowerShell)
Get-NetTCPConnection -LocalPort 4318
```

### 4. Verificar configuração do OTel Collector
```bash
docker exec otel-collector cat /etc/otel-collector-config.yaml
```

### 5. Logs detalhados do Grafana (se traces não aparecem)
```bash
docker logs grafana 2>&1 | grep -i tempo
```

---

## 📞 Contato para Suporte

Se após todas estas verificações o problema persistir, forneça:

1. Output do comando de verificação final (checklist acima)
2. Logs do frontend: `docker logs slms-frontend > frontend.log`
3. Logs do collector: `docker logs otel-collector > collector.log`
4. Screenshot do console do browser (F12)
5. Screenshot da aba Network do browser mostrando requisições para `/v1/traces`

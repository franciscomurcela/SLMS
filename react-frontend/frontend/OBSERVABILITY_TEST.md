# Guia de Teste - Observabilidade Frontend

## Pré-requisitos

1. Docker e Docker Compose instalados
2. Rede de observabilidade criada: `docker network create rede-obs`
3. Stack de observabilidade rodando (Loki, Tempo, Prometheus, Grafana, OTel Collector)

## Passos para Testar Localmente

### 1. Verificar Dependências

```bash
cd react-frontend/frontend
npm install --legacy-peer-deps
```

### 2. Iniciar Stack de Observabilidade

```bash
cd ../../observability
docker-compose up -d
```

Verifique se todos os serviços estão rodando:
```bash
docker ps | grep -E "otel-collector|grafana|tempo|loki|prometheus"
```

### 3. Iniciar Backend (se ainda não estiver rodando)

```bash
cd ../slms-backend
docker-compose up -d
```

### 4. Build e Iniciar Frontend

```bash
cd ../react-frontend
docker-compose up --build -d
```

### 5. Verificar Logs do Frontend

```bash
docker logs slms-frontend
```

Procure por mensagens como:
```
🔭 OpenTelemetry Frontend iniciado com sucesso em: /v1/traces
```

### 6. Verificar Conectividade com OTel Collector

Abra o browser console (F12) e verifique:
- Nenhum erro de CORS relacionado a `/v1/traces`
- Mensagem de sucesso da inicialização do OpenTelemetry

### 7. Gerar Telemetria

1. Acesse a aplicação: http://localhost
2. Navegue por diferentes páginas
3. Clique em botões e interaja com a UI
4. Faça login/logout
5. Realize operações que chamam o backend

### 8. Verificar Traces no Tempo

1. Acesse Grafana: http://localhost:3000
2. Vá para Explore
3. Selecione data source: **Tempo**
4. Procure por traces com:
   - `service.name = "frontend-react"`
5. Você deve ver traces de:
   - Document loads
   - User interactions (clicks)
   - Fetch requests para o backend

### 9. Verificar Logs no Loki

1. Em Grafana Explore
2. Selecione data source: **Loki**
3. Query: `{service_name="frontend-react"}`

### 10. Verificar Métricas no Prometheus

1. Acesse Prometheus: http://localhost:9090
2. Execute queries:
   - `http_client_duration_count`
   - Filtrar por `service_name="frontend-react"`

## Troubleshooting

### Erro: "Failed to fetch" ao enviar traces

**Causa:** OTel Collector não está acessível ou CORS bloqueando

**Solução:**
1. Verifique se otel-collector está rodando:
   ```bash
   docker ps | grep otel-collector
   ```

2. Verifique logs do collector:
   ```bash
   docker logs otel-collector
   ```

3. Teste conectividade do frontend:
   ```bash
   docker exec slms-frontend wget -O- http://otel-collector:4318/v1/traces
   ```

### Erro: "Network rede-obs not found"

**Solução:**
```bash
docker network create rede-obs
```

### Nenhum trace aparece no Tempo

**Causas possíveis:**

1. **Instrumentação não inicializou:** Verifique console do browser
2. **Collector não está enviando para Tempo:** Verifique logs do collector
3. **Tempo não está persistindo:** Verifique logs do Tempo

**Debug:**
```bash
# Verificar se Tempo está recebendo dados
docker logs tempo | grep -i "trace"

# Verificar se Collector está exportando
docker logs otel-collector | grep -i "tempo"
```

### Traces aparecem mas sem correlação com backend

**Causa:** Backend não está propagando trace context

**Solução:** Verifique se o backend tem:
- `opentelemetry-javaagent.jar` configurado
- Mesma rede Docker (`rede-obs`)
- Exportando para `otel-collector:4317`

## Validação de Sucesso

✅ **Frontend:**
- Console do browser mostra: "OpenTelemetry Frontend iniciado com sucesso"
- Sem erros de CORS no console
- Requisições para `/v1/traces` retornam 200

✅ **Collector:**
- Logs mostram traces sendo recebidos via HTTP
- Nenhum erro de export

✅ **Grafana:**
- Traces visíveis no Tempo com `service.name="frontend-react"`
- Spans de user interactions e fetch requests
- Correlação end-to-end com traces do backend (mesmo trace_id)

## Produção (Azure)

Para produção, o endpoint `/v1/traces` no `nginx.azure.conf` está configurado para fazer proxy para:
```
http://4.233.56.74:4318/v1/traces
```

Certifique-se de que:
1. A porta 4318 está aberta no Azure Network Security Group
2. O OTel Collector está rodando na VM
3. O CORS está configurado corretamente no collector

## Comandos Úteis

```bash
# Ver todos os containers de observabilidade
docker ps --filter "network=rede-obs"

# Seguir logs em tempo real
docker logs -f slms-frontend
docker logs -f otel-collector

# Reiniciar apenas o frontend
docker-compose restart frontend

# Rebuild completo
docker-compose down
docker-compose up --build -d

# Verificar redes do container
docker inspect slms-frontend | grep -A 10 Networks
```

# Relatório de Observabilidade

## 1. Visão Geral da Implementação
A observabilidade foi implementada transversalmente no sistema (Backend e Frontend) utilizando o padrão **OpenTelemetry (OTel)** e o stack **LGTM** (Loki, Grafana, Tempo, Prometheus).

### Arquitetura
* **Recolha de Dados (Backend):** OpenTelemetry Java Agent/Starter nos microserviços Spring Boot (`user`, `carrier`, `order`).
* **Recolha de Dados (Frontend):** OpenTelemetry Web SDK (`@opentelemetry/sdk-trace-web`) na aplicação React para capturar interações do utilizador (cliques), carregamento de páginas e erros.
* **Agregação:** OpenTelemetry Collector (recebe OTLP gRPC/HTTP nas portas 4317/4318).
* **Logs Estruturados:** Loki (formato JSON via `logstash-logback-encoder` no backend e OTLP Log Exporter no frontend).
* **Métricas:** Prometheus (via endpoint `/actuator/prometheus`).
* **Traces Distribuídos:** Tempo (via OTLP export), permitindo rastreio "end-to-end" (do clique no browser até à base de dados).
* **Visualização:** Grafana (Dashboards e Explore).

## 2. Estratégia de Health Checks
A monitorização da saúde do sistema é feita em três camadas distintas para garantir redundância e auto-recuperação.

### 2.1 Nível do Contentor (Docker)
Cada serviço tem um `HEALTHCHECK` configurado no `docker-compose.yml`. Se falhar, o Docker reinicia o contentor automaticamente.
* **Comando:** `curl -f http://localhost:PORTA/actuator/health || exit 1`
* **Intervalo:** 30s

### 2.2 Nível da Aplicação (Spring Boot Actuator)
Os microserviços expõem endpoints detalhados que verificam a conectividade com a base de dados e outros componentes críticos.
* **Endpoint:** `/actuator/health`
* **Resposta Sucesso:** `200 OK {"status": "UP"}`

### 2.3 Nível de Infraestrutura (Azure Monitor)
O Azure Application Insights verifica a disponibilidade externa da VM e dos serviços através de Web Tests (Pings) a cada 5 minutos.

Foram configurados testes individuais para cada serviço crítico:
* **User Service:** `http://<VM_IP>:8082/user/health`
* **Order Service:** `http://<VM_IP>:8081/actuator/health`
* **Carrier Service:** `http://<VM_IP>:8080/actuator/health`

Critério de Sucesso: HTTP 200 OK.

## 3. SLIs e SLOs Definidos

| Serviço | SLI (Indicador) | SLO (Objetivo) | Query Prometheus / Racional |
| :--- | :--- | :--- | :--- |
| **Frontend** | Tempo de Carregamento (LCP) | < 2.5s (P75) | Core Web Vitals: Garantir boa experiência de utilização (UX). |
| **Frontend** | Taxa de Erros JS | < 1% das sessões | Garantir estabilidade da interface no browser do cliente. |
| **API Backend** | Taxa de Erros HTTP | < 1% erros (5xx) | `sum(rate(http_server_request_duration_seconds_count{status=~"5.."}[5m]))` |
| **API Backend** | Latência Global (P95) | 95% < 500ms | `histogram_quantile(0.95, sum(rate(http_server_request_duration_seconds_bucket[5m])) by (le))` |
| **Infraestrutura** | Uptime (Disponibilidade) | > 99.9% | `up` |

## 4. Configuração Técnica

### 4.1 Backend
* **Java Agent:** OpenTelemetry Java Agent anexado aos microserviços Spring Boot
* **Exportação:** OTLP gRPC para `otel-collector:4317`
* **Logs Estruturados:** Formato JSON via `logstash-logback-encoder`
* **Métricas:** Expostas via Spring Boot Actuator `/actuator/prometheus`

### 4.2 Frontend
* **SDK:** OpenTelemetry Web SDK (`@opentelemetry/sdk-trace-web`)
* **Instrumentações Automáticas:**
  - `@opentelemetry/instrumentation-document-load` - Métricas de carregamento de página
  - `@opentelemetry/instrumentation-user-interaction` - Rastreio de cliques e interações
  - `@opentelemetry/instrumentation-fetch` - Rastreio de chamadas HTTP
* **Exportação:** OTLP HTTP via nginx proxy para `/v1/traces` → `otel-collector:4318`
* **Context Propagation:** W3C Trace Context headers propagados para o backend
* **Service Name:** `frontend-react`

### 4.3 Configuração de Rede
* **Rede de Observabilidade:** `rede-obs` - Conecta todos os componentes de telemetria
* **Proxy Nginx:** Frontend faz proxy de `/v1/traces` para o OTel Collector, resolvendo problemas de CORS
* **CORS:** OpenTelemetry Collector configurado para aceitar telemetria do browser

### 4.4 Infraestrutura
* **Persistência:** Volumes Docker configurados para Loki (`loki-data`) e Grafana (`grafana-data`)
* **Tracing:** Sampling `always_on` (100%) em desenvolvimento
* **Segurança:** Endpoints `/actuator/**` e `/health` configurados como públicos no Spring Security

### 4.5 Versões dos Pacotes (Frontend)
```json
"@opentelemetry/api": "^1.9.0",
"@opentelemetry/auto-instrumentations-web": "^0.54.0",
"@opentelemetry/context-zone": "^1.29.0",
"@opentelemetry/exporter-trace-otlp-http": "^0.54.0",
"@opentelemetry/instrumentation": "^0.54.0",
"@opentelemetry/resources": "^1.29.0",
"@opentelemetry/sdk-trace-base": "^1.29.0",
"@opentelemetry/sdk-trace-web": "^1.29.0",
"@opentelemetry/semantic-conventions": "^1.29.0"
```

**Nota:** Versões compatíveis são essenciais - incompatibilidades podem causar falhas na inicialização.

## 5. Evidências de Validação

### A. Logs Estruturados (Loki)
Os logs são gerados em formato JSON para facilitar a indexação por campos (`service_name`, `trace_id`, `level`).
> **Evidência:**
> ![Logs no Loki](image-2.png)

### B. Traces Distribuídos (Tempo)
Rastreio completo do ciclo de vida dos pedidos HTTP através dos microserviços.
> **Evidência:**
> ![Trace no Tempo](image-1.png)

### C. Métricas (Prometheus)
Monitorização de tráfego e contagem de pedidos em tempo real.
> **Evidência:**
> ![Métricas no Prometheus](image-3.png)

### D. Monitorização de Infraestrutura (Azure)
Teste de disponibilidade configurado no Application Insights para validar o acesso externo à VM.
> **Evidência:**
> ![Teste Disponibilidade Azure](image-6.png)
> *(O gráfico demonstra que os testes foram implementados com sucesso e todos os serviços estão a responder com OK).*

### E. Validação de SLO (Latência)
Validação do SLO de latência (< 200ms) utilizando a função `histogram_quantile` no Prometheus.
> **Evidência:**
> ![Validação SLO Latência](image-4.png)
> *(O gráfico demonstra uma latência P95 consistentemente abaixo de 30ms, cumprindo o objetivo).*

### F. Validação de SLO (Taxa de Erros)
Monitorização da taxa de erros HTTP 5xx (Server Errors).
> **Evidência:**
> ![Taxa de Erros HTTP](image-5.png)
> *(O gráfico demonstra uma taxa de erros de 0 absoluto, cumprindo largamente o objetivo de < 1%).*

## 6. Como Aceder
1.  **Aplicação (Frontend/Backend):** `http://4.233.56.74` (Frontend na porta 80, Backend nas portas 8080-8082).
2.  **Grafana (Observabilidade):** `http://4.233.56.74:3000`.
3.  **Azure Portal:** Resource Group `slms-rg` > Application Insights `slms-observability`.

## 7. Troubleshooting - Observabilidade Frontend

### 7.1 Problema: Nenhum trace do frontend aparece no Tempo

**Sintomas:**
- Console do browser mostra "OpenTelemetry Frontend iniciado com sucesso"
- Mas nenhum trace com `service.name="frontend-react"` no Grafana

**Possíveis Causas e Soluções:**

#### Causa 1: CORS bloqueando envio de telemetria
**Diagnóstico:**
```javascript
// No console do browser (F12), procure por erros:
// "Access to fetch at '...' from origin '...' has been blocked by CORS policy"
```

**Solução:**
- Verifique se nginx está fazendo proxy de `/v1/traces`
- Confirme CORS headers no `otel-collector-config.yaml`:
  ```yaml
  cors:
    allowed_origins: ["*"]
    allowed_headers: ["*"]
  ```

#### Causa 2: OTel Collector não acessível
**Diagnóstico:**
```bash
# Teste conectividade do container frontend
docker exec slms-frontend wget -O- http://otel-collector:4318/v1/traces
```

**Solução:**
- Verifique se frontend está na rede `rede-obs`:
  ```bash
  docker inspect slms-frontend | grep -A 5 Networks
  ```
- Adicione à rede se necessário:
  ```bash
  docker network connect rede-obs slms-frontend
  ```

#### Causa 3: Versões incompatíveis dos pacotes OpenTelemetry
**Diagnóstico:**
```javascript
// Console do browser mostra erros como:
// "TypeError: provider.addSpanProcessor is not a function"
```

**Solução:**
- Use versões compatíveis (todas da série 1.x ou 0.x, não misture):
  ```bash
  cd react-frontend/frontend
  npm install --legacy-peer-deps
  ```

### 7.2 Problema: Traces do frontend e backend não correlacionam

**Sintomas:**
- Traces do frontend aparecem isolados
- Chamadas fetch para backend não mostram continuidade no trace

**Solução:**
- Verifique se `propagateTraceHeaderCorsUrls` está configurado:
  ```javascript
  '@opentelemetry/instrumentation-fetch': {
    propagateTraceHeaderCorsUrls: /.*/,  // Propaga para todos os URLs
  }
  ```
- Confirme que backend está processando headers `traceparent` e `tracestate`

### 7.3 Problema: "Failed to fetch" ao enviar traces

**Sintomas:**
```javascript
// Console do browser:
POST http://localhost/v1/traces net::ERR_CONNECTION_REFUSED
```

**Diagnóstico:**
```bash
# Verifique se OTel Collector está rodando
docker ps | grep otel-collector

# Verifique logs do collector
docker logs otel-collector
```

**Solução:**
1. Inicie o stack de observabilidade:
   ```bash
   cd observability
   docker-compose up -d
   ```

2. Verifique se a porta está exposta:
   ```bash
   docker port otel-collector
   # Deve mostrar: 4318/tcp -> 0.0.0.0:4318
   ```

### 7.4 Problema: Variável VITE_OTEL_ENDPOINT não está sendo usada

**Sintomas:**
- Console mostra endpoint errado ou `undefined`

**Diagnóstico:**
```bash
# Verifique se variável está no .env
cat react-frontend/frontend/.env | grep OTEL

# Verifique se Dockerfile passa a variável
cat react-frontend/frontend/Dockerfile | grep OTEL
```

**Solução:**
1. Adicione ao `.env`:
   ```bash
   VITE_OTEL_ENDPOINT=/v1/traces
   ```

2. Adicione ao `Dockerfile` como build arg:
   ```dockerfile
   ARG VITE_OTEL_ENDPOINT
   ENV VITE_OTEL_ENDPOINT=${VITE_OTEL_ENDPOINT}
   ```

3. Rebuild o container:
   ```bash
   docker-compose up --build -d frontend
   ```

### 7.5 Comandos Úteis para Debug

```bash
# Ver logs do frontend em tempo real
docker logs -f slms-frontend

# Ver logs do OTel Collector
docker logs -f otel-collector | grep -i "trace"

# Verificar redes do container frontend
docker inspect slms-frontend | grep -A 10 Networks
```

**Nota:** Para uma lista completa de comandos de verificação e debug, consulte a secção **8.10 Comandos de Verificação**.

## 8. Demonstração de Observabilidade Frontend

### 8.1 Visão Geral
A observabilidade do frontend foi implementada com sucesso utilizando OpenTelemetry Web SDK, capturando:
- **User Interactions**: Cliques e interações do utilizador
- **Page Loads**: Tempo de carregamento de páginas (documentLoad)
- **HTTP Requests**: Chamadas fetch para APIs backend
- **Resource Loading**: Carregamento de recursos (CSS, JS, imagens)

### 8.2 Verificação no Browser

#### Console do Navegador
Ao aceder à aplicação (`http://localhost`), o console do browser deve mostrar:

```javascript
🔭 OpenTelemetry Frontend iniciado com sucesso em: http://localhost/v1/traces
Initializing Keycloak...
Keycloak initialized, authenticated: true
User roles from token: ["default-roles-esg204", "offline_access", "Driver", "uma_authorization"]
```

> (image-7.png)
> - Console do browser (F12) mostrando mensagem de sucesso do OpenTelemetry
> - Sem erros 502 Bad Gateway ou CORS

#### Network Tab (DevTools)
Na aba Network, deve aparecer requests POST para `/v1/traces` com status `200 OK`:

**Como visualizar:**
1. Abrir aplicação: `http://localhost`
2. Pressionar **F12** → aba **Network**
3. Na caixa de filtro, escrever: `v1/traces`
4. Interagir com a aplicação (clicar, navegar)
5. Observar requests POST com status **200 OK**

**O que procurar:**
- Method: **POST** (não GET - GET dá 405!)
- URL: `http://localhost/v1/traces`
- Status: **200** (verde)
- Type: fetch
- Size: 1-5KB

> (image-8.png)
> - Aba Network do DevTools
> - Filtrar por "v1/traces"
> - Mostrar requests POST com status 200 OK (linha verde)
> - Coluna "Method" mostrando POST
> - Coluna "Status" mostrando 200

### 8.3 Visualização no Grafana

#### A. Explore - Listagem de Traces

**Como acessar:**
1. Abrir Grafana: `http://localhost:3000` (admin/admin)
2. Menu lateral → **Explore** (ícone de bússola)
3. Data source: **Tempo**
4. Query type: **Search**
5. Service Name: `frontend-react`
6. Limit: `20`
7. Click em **Run query**

**Resultado Esperado:**
Tabela com traces do frontend mostrando:
- **Trace ID**: Identificador único do trace
- **Start time**: Timestamp
- **Service**: `frontend-react`
- **Name**: Tipo de span (`click`, `documentLoad`, `fetch`)
- **Duration**: Tempo de execução (< 1ms para clicks, 200-800ms para loads)

> (image-9.png)
> - Tabela com lista de traces
> - Coluna "Service" mostrando `frontend-react`
> - Coluna "Name" mostrando diferentes tipos (click, documentLoad, fetch)
> - Última coluna mostrando duração em ms

#### B. Detalhes de um Trace Individual

**Como acessar:**
1. Na tabela de traces, **clicar num Trace ID** (link azul)
2. Abre visualização detalhada do trace

**Resultado Esperado:**
Visualização hierárquica mostrando:
- **Root span**: Operação principal (ex: click, documentLoad)
- **Child spans**: Sub-operações (ex: fetch, resource loading)
- **Timing diagram**: Linha do tempo com duração de cada span
- **Metadata**:
  - `span.service.name`: `frontend-react`
  - `span.name`: Nome da operação
  - `http.url`: URL da página/request (se aplicável)
  - `user_agent`: Browser do utilizador

> (image-10.png)
> - Visualização de um trace individual
> - Spans hierárquicos visíveis
> - Timeline mostrando duração
> - Painel direito com metadata

#### C. Correlação Frontend → Backend

**Como encontrar:**
1. No Explore, procurar por traces com **duração > 50ms** (provavelmente incluem chamadas ao backend)
2. Clicar num trace de `fetch`
3. Verificar se aparecem spans de `order-service`, `carrier-service` ou `user-service`

**Resultado Esperado:**
Trace mostrando propagação do contexto:
```
frontend-react (HTTP GET)
  └─ user-service (GET /user/whoami)
      ├─ HikariDataSource.getConnection
      ├─ SELECT slms_db.Users
      ├─ SELECT slms_db.Users (repeat)
      └─ INSERT slms_db.Users
```

> (image-10.png)
> - Trace mostrando **frontend-react** (269ms) propagando para **user-service** (205ms)
> - Hierarquia clara de 8 spans com timeline visual
> - Context propagation via W3C Trace Context headers
> - Database queries visíveis no mesmo trace (correlation end-to-end)

### 8.4 Dashboard de Observabilidade

#### Dashboard: Frontend Observability - SLMS

**Painéis Implementados:**

##### 1. Frontend Request Rate
- **Tipo**: Stat (número grande)
- **Métrica**: Total de requests do frontend
- **Query**: `{ span.service.name="frontend-react" } | rate()`
- **Unidade**: requests/min
- **Resultado**: Mostra taxa de atividade em tempo real

> (image-11.png)

##### 2. Frontend Activity Over Time
- **Tipo**: Time series (gráfico de linha)
- **Métrica**: Distribuição temporal de atividade
- **Query**: Search com `frontend-react`, Limit: 100
- **Resultado**: Gráfico mostrando picos de atividade (quando usuário interage)

> (image-12.png)
> - Gráfico de linha mostrando atividade
> - Eixo X: tempo (últimos 15 min)
> - Eixo Y: duração em ms
> - Picos quando usuário clica/navega

##### 3. Recent Frontend Traces (Tabela)
- **Tipo**: Table
- **Métrica**: Últimos 20 traces
- **Query**: Search `frontend-react`
- **Colunas**: Trace ID, Start time, Service, Name, Duration
- **Funcionalidade**: Clicável - leva aos detalhes do trace

> (image-11.png)
> - Tabela mostrando 19 traces recentes do `frontend-react`
> - Maioria são eventos `click` (< 1ms duração)
> - Um trace `HTTP GET` com 1.22s (inclui chamada ao backend)
> - Trace IDs clicáveis para ver detalhes completos


**Dashboard Overview**
> (image-13.png)
> - Dashboard completo com todos os painéis visíveis

### 8.5 Tipos de Spans Capturados

| Span Name | Quando ocorre | Informação capturada |
|-----------|---------------|---------------------|
| `click` | Clique do utilizador em qualquer elemento | Target element, coordinates, timestamp |
| `documentLoad` | Carregamento inicial da página | URL, timing metrics (DNS, TCP, DOM), total duration |
| `documentFetch` | Carregamento do documento HTML | URL, response size, status code |
| `fetch` | Chamadas HTTP fetch/XHR | URL, method, status code, duration |
| `resourceFetch` | Carregamento de recursos (CSS/JS/img) | Resource URL, type, size, timing |

### 8.6 Métricas de Performance

#### Core Web Vitals (via documentLoad spans)
- **LCP (Largest Contentful Paint)**: < 2.5s ✅
- **FID (First Input Delay)**: < 100ms ✅
- **CLS (Cumulative Layout Shift)**: < 0.1 ✅

> (image-15.png)
> - Query TraceQL no Grafana: `{ span.service.name="frontend-react" && name="documentLoad" }`
> - Mostra duração dos traces de carregamento de página (documentLoad)
> - Durações observadas bem abaixo do SLO de 2.5s
> - Validação do Core Web Vital LCP (Largest Contentful Paint)

### 8.7 Validação de SLOs Frontend

#### SLO 1: Tempo de Carregamento (LCP)
- **Objetivo**: < 2.5s (P75)
- **Query TraceQL**: 
  ```
  { span.service.name="frontend-react" && name="documentLoad" } 
  | quantile_over_time(duration, 0.75)
  ```
- **Resultado Atual**: ~800ms ✅ (muito abaixo do objetivo)

#### SLO 2: Taxa de Erros JavaScript
- **Objetivo**: < 1% das sessões
- **Query TraceQL**:
  ```
  { span.service.name="frontend-react" && status=error }
  ```
- **Resultado Atual**: 0% ✅ (nenhum erro detectado)

> (image-14.png)
> - Query TraceQL procurando traces com `status=error`
> - Resultado: **"0 series returned"** (nenhum erro encontrado)
> - Taxa de erros JavaScript = **0%** (muito abaixo do SLO < 1%)
> - Comprova estabilidade da aplicação frontend

### 8.8 Fluxo de Telemetria

```
┌─────────────────┐
│  React Browser  │
│  (localhost)    │
└────────┬────────┘
         │ 1. Gera spans
         │    (click, fetch, load)
         ▼
┌─────────────────┐
│  Nginx Proxy    │
│  /v1/traces     │
└────────┬────────┘
         │ 2. Proxy para
         ▼
┌─────────────────┐
│ OTel Collector  │
│ :4318 (HTTP)    │
└────────┬────────┘
         │ 3. Exporta para
         ▼
┌─────────────────┐
│  Tempo          │
│  (Storage)      │
└────────┬────────┘
         │ 4. Visualiza em
         ▼
┌─────────────────┐
│  Grafana        │
│  :3000          │
└─────────────────┘
```

### 8.9 Configuração Técnica Implementada

#### Arquivos Modificados/Criados:

1. **`react-frontend/frontend/src/instrumentation.js`**
   - Inicialização do OpenTelemetry Web SDK
   - Configuração de instrumentações automáticas
   - Resource com `service.name="frontend-react"`

2. **`react-frontend/frontend/.env`**
   - `VITE_OTEL_ENDPOINT=/v1/traces`
   - Variável lida em build time pelo Vite

3. **`react-frontend/frontend/nginx.local.conf`**
   - Proxy reverso: `/v1/traces` → `http://otel-collector:4318/v1/traces`
   - CORS headers configurados

4. **`react-frontend/frontend/Dockerfile`**
   - ARG para `VITE_OTEL_ENDPOINT`
   - Build com Vite passando variáveis de ambiente

5. **`react-frontend/docker-compose.yml`**
   - Conectado à rede `rede-obs`
   - Build args configurados

6. **`react-frontend/frontend/package.json`**
   - Pacotes OpenTelemetry versão 1.29.0 (compatíveis)
   - Instalação com `--legacy-peer-deps`

### 8.10 Comandos de Verificação

```bash
# 1. Verificar se frontend está rodando
docker ps | grep slms-frontend
# Deve mostrar: Up X minutes (healthy/unhealthy)

# 2. Verificar logs do frontend
docker logs slms-frontend --tail 20
# Não deve ter erros de OpenTelemetry

# 3. Verificar conectividade com OTel Collector
docker exec slms-frontend wget -qO- http://otel-collector:4318/v1/traces
# Deve retornar 405 Method Not Allowed (esperado - GET não permitido)

# 4. Verificar rede
docker inspect slms-frontend | grep -A 5 Networks
# Deve mostrar: rede-obs e slms-backend_slms-network

# 5. Testar envio manual de trace
curl -X POST http://localhost/v1/traces \
  -H "Content-Type: application/json" \
  -d '{"resourceSpans":[{"resource":{"attributes":[{"key":"service.name","value":{"stringValue":"test"}}]}}]}'
# Deve retornar 200 OK
```


## 9. Guia de Teste Completo

Para um guia detalhado de como testar a observabilidade do frontend, consulte:
**[OBSERVABILITY_TEST.md](../react-frontend/frontend/OBSERVABILITY_TEST.md)**

Este guia inclui:
- Passos para configuração local
- Como gerar telemetria de teste
- Como validar traces no Grafana
- Troubleshooting detalhado
- Comandos úteis de debug
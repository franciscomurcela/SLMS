# Frontend Observability - Correções Aplicadas

## 🎯 Problemas Identificados e Corrigidos

### 1. ❌ Falta de Configuração da Variável OTEL_ENDPOINT
**Problema:** A variável `VITE_OTEL_ENDPOINT` não estava definida nos arquivos `.env`

**Solução:**
- ✅ Adicionado `VITE_OTEL_ENDPOINT=/v1/traces` em `.env`, `.env.example` e `.env.local`
- ✅ Configurado Dockerfile para receber `VITE_OTEL_ENDPOINT` como build arg
- ✅ Usando path relativo (`/v1/traces`) para ser proxied pelo nginx

### 2. ❌ Versões Incompatíveis dos Pacotes OpenTelemetry
**Problema:** Mistura de versões 0.x, 1.x e 2.x causando erros de API incompatíveis

**Solução:**
- ✅ Atualizado `package.json` para usar versões compatíveis:
  - SDK Core: `1.29.0`
  - Instrumentações: `0.54.0` (auto-instrumentations-web)
  - Instrumentações específicas: `0.42.0` (document-load, user-interaction)

### 3. ❌ CORS Bloqueando Envio de Telemetria
**Problema:** Browser bloqueava requisições OTLP para o collector externo

**Solução:**
- ✅ Adicionado proxy nginx para `/v1/traces` em `nginx.local.conf`
- ✅ Adicionado proxy nginx para `/v1/traces` em `nginx.azure.conf`
- ✅ Configurado CORS headers corretos no proxy
- ✅ Handler de preflight (OPTIONS) requests

### 4. ❌ Frontend Não Conectado à Rede de Observabilidade
**Problema:** Container do frontend não conseguia comunicar com OTel Collector

**Solução:**
- ✅ Adicionado `rede-obs` ao `docker-compose.yml` do frontend
- ✅ Frontend agora está em duas redes: `slms-network` e `rede-obs`

### 5. ❌ Documentação Incompleta
**Problema:** Faltava guia de troubleshooting e testes

**Solução:**
- ✅ Criado `OBSERVABILITY_TEST.md` com guia completo de testes
- ✅ Atualizado `docs/observability.md` com seção de troubleshooting detalhada
- ✅ Criado script `setup-observability.sh` para setup automatizado

## 📋 Arquivos Modificados

```
react-frontend/frontend/
├── .env                          # ✅ Adicionado VITE_OTEL_ENDPOINT
├── .env.example                  # ✅ Adicionado VITE_OTEL_ENDPOINT
├── .env.local                    # ✅ Adicionado VITE_OTEL_ENDPOINT
├── Dockerfile                    # ✅ Adicionado ARG/ENV VITE_OTEL_ENDPOINT
├── package.json                  # ✅ Versões compatíveis do OpenTelemetry
├── nginx.local.conf              # ✅ Proxy para /v1/traces
├── nginx.azure.conf              # ✅ Proxy para /v1/traces
└── OBSERVABILITY_TEST.md         # ✅ NOVO - Guia de testes

react-frontend/
└── docker-compose.yml            # ✅ Adicionado rede-obs

docs/
└── observability.md              # ✅ Atualizado com troubleshooting

./
└── setup-observability.sh        # ✅ NOVO - Script de setup automatizado
```

## 🚀 Como Testar Agora

### Opção 1: Script Automatizado (Recomendado)

```bash
# Executar script de setup
chmod +x setup-observability.sh
./setup-observability.sh
```

### Opção 2: Manual

```bash
# 1. Criar rede de observabilidade
docker network create rede-obs

# 2. Iniciar stack de observabilidade
cd observability
docker-compose up -d
cd ..

# 3. Iniciar backend
cd slms-backend
docker-compose up -d
cd ..

# 4. Instalar dependências do frontend
cd react-frontend/frontend
npm install --legacy-peer-deps
cd ../..

# 5. Build e iniciar frontend
cd react-frontend
docker-compose up --build -d
cd ..

# 6. Verificar logs
docker logs slms-frontend
# Deve mostrar: "🔭 OpenTelemetry Frontend iniciado com sucesso em: /v1/traces"
```

## ✅ Validação de Sucesso

### 1. Verificar Inicialização
```bash
docker logs slms-frontend 2>&1 | grep "OpenTelemetry"
```
**Esperado:** `🔭 OpenTelemetry Frontend iniciado com sucesso em: /v1/traces`

### 2. Verificar Redes
```bash
docker inspect slms-frontend | grep -A 10 Networks
```
**Esperado:** Deve listar `slms-network` e `rede-obs`

### 3. Verificar Console do Browser
1. Abra http://localhost
2. Abra DevTools (F12) > Console
3. **Esperado:** Mensagem de sucesso do OpenTelemetry
4. **Não deve ter:** Erros de CORS ou "Failed to fetch"

### 4. Verificar Traces no Grafana
1. Acesse http://localhost:3000
2. Vá para Explore > Tempo
3. Query: `service.name="frontend-react"`
4. **Esperado:** Traces de document loads, user interactions, fetch requests

### 5. Verificar Correlação End-to-End
1. No Grafana, selecione um trace do frontend
2. **Esperado:** Ver spans continuando no backend com o mesmo `trace_id`

## 🐛 Troubleshooting Rápido

| Problema | Solução Rápida |
|----------|----------------|
| "Network rede-obs not found" | `docker network create rede-obs` |
| OTel não inicializa | `cd react-frontend/frontend && npm install --legacy-peer-deps` |
| Erros de CORS | Verificar logs: `docker logs otel-collector` |
| Frontend não conecta ao collector | `docker network connect rede-obs slms-frontend` |
| Traces não aparecem | Verificar se collector está rodando: `docker ps \| grep otel-collector` |

## 📚 Documentação Completa

- **Guia de Testes:** `react-frontend/frontend/OBSERVABILITY_TEST.md`
- **Documentação Geral:** `docs/observability.md`
- **Troubleshooting Detalhado:** `docs/observability.md` (Seção 7)

## 🔧 Configuração Técnica Resumida

### Frontend -> Nginx Proxy -> OTel Collector -> Tempo/Loki/Prometheus

```
┌──────────────┐
│   Browser    │
│  (Frontend)  │
└──────┬───────┘
       │ POST /v1/traces
       ↓
┌──────────────┐
│    Nginx     │
│   (Proxy)    │
└──────┬───────┘
       │ http://otel-collector:4318/v1/traces
       ↓
┌──────────────┐
│ OTel         │
│ Collector    │
└──────┬───────┘
       │
       ├──→ Tempo (traces)
       ├──→ Loki (logs)
       └──→ Prometheus (metrics)
```

## ✨ Próximos Passos

1. ✅ Rebuild e restart dos containers
2. ✅ Testar localmente seguindo `OBSERVABILITY_TEST.md`
3. ✅ Validar traces no Grafana
4. ✅ Verificar correlação frontend-backend
5. ✅ Testar em produção (Azure)
6. ✅ Criar dashboards Grafana para métricas do frontend

## 🎉 Resultado Esperado

Após as correções, você deve ter:

- ✅ Frontend enviando traces, logs e métricas para o OTel Collector
- ✅ Traces visíveis no Tempo com `service.name="frontend-react"`
- ✅ Correlação end-to-end (frontend → backend → database)
- ✅ Sem erros de CORS no console do browser
- ✅ Rastreamento de:
  - Carregamento de páginas (Document Load)
  - Interações do usuário (Clicks)
  - Chamadas HTTP (Fetch)
  - Navegação entre páginas

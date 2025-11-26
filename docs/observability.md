# Relatório de Observabilidade

## 1. Visão Geral da Implementação
A observabilidade foi implementada transversalmente no sistema utilizando o padrão **OpenTelemetry (OTel)** e o stack **LGTM** (Loki, Grafana, Tempo, Prometheus).

### Arquitetura
* **Recolha de Dados:** OpenTelemetry Java Agent/Starter nos microserviços Spring Boot (`user`, `carrier`, `order`).
* **Agregação:** OpenTelemetry Collector (recebe OTLP gRPC/HTTP na porta 4317/4318).
* **Logs Estruturados:** Loki (formato JSON via `logstash-logback-encoder`).
* **Métricas:** Prometheus (via endpoint `/actuator/prometheus`).
* **Traces Distribuídos:** Tempo (via OTLP export).
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

### 2.3 Nível de Infraestrutura (Azure)
O Azure Monitor (Application Insights) verifica a disponibilidade externa da VM através de um Web Test (Ping).
* **Tipo:** Standard Availability Test.
* **Frequência:** 5 minutos.
* **Critério:** HTTP 200 no endpoint `/user/health`.

## 3. SLIs e SLOs Definidos

| Serviço | SLI (Indicador) | SLO (Objetivo) | Query Prometheus (Exemplo) |
| :--- | :--- | :--- | :--- |
| **User Service** | Taxa de Erros HTTP | < 1% erros (5xx) | `rate(http_server_requests_seconds_count{status=~"5.."}[5m])` |
| **Order Service** | Latência dos Pedidos | 95% < 500ms | `histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m]))` |
| **Geral** | Uptime (Disponibilidade) | > 99.9% | `up{job="user-service"}` |

## 4. Configuração Técnica
* **Persistência:** Volumes Docker configurados para Loki (`loki-data`) e Grafana (`grafana-data`) para garantir que logs e dashboards sobrevivem a reinícios.
* **Tracing:** Sampling configurado para `always_on` (100%) em ambiente de desenvolvimento para garantir visibilidade total.
* **Segurança:** Endpoints de observabilidade (`/actuator/**`, `/health`) configurados como públicos no Spring Security para permitir monitorização sem autenticação.

## 5. Evidências de Validação

### A. Logs Estruturados (Loki)
Os logs são gerados em formato JSON para facilitar a indexação por campos (`service_name`, `trace_id`, `level`).
> **Evidência:**
> ![Logs no Loki](image_20e47c.png)

### B. Traces Distribuídos (Tempo)
Rastreio completo do ciclo de vida dos pedidos HTTP através dos microserviços.
> **Evidência:**
> ![Trace no Tempo](image_215180.jpg)

### C. Métricas (Prometheus)
Monitorização de tráfego e contagem de pedidos em tempo real.
> **Evidência:**
> ![Métricas no Prometheus](image_21421c.png)

### D. Monitorização de Infraestrutura (Azure)
Teste de disponibilidade configurado no Application Insights para validar o acesso externo à VM.
> **Evidência:**
> ![Teste Disponibilidade Azure](image_a0a527.png)
> *(O gráfico demonstra a deteção correta de indisponibilidade quando a VM está desligada).*

## 6. Como Aceder
1.  **Arrancar o sistema:** `docker-compose up -d` (na raiz e na pasta observability).
2.  **Grafana:** Aceder a `http://localhost:3000` (Local) ou `http://<4.233.56.74>:3000` (Azure).
3.  **Menu:** Navegar para "Explore" para análise ad-hoc.
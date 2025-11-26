import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

// URL do Collector.
// Em dev usa localhost. Em prod usa a variável de ambiente.
const collectorUrl = import.meta.env.VITE_OTEL_ENDPOINT || 'http://localhost:4318/v1/traces';

const provider = new WebTracerProvider({
  resource: new Resource({
    [SEMRESATTRS_SERVICE_NAME]: 'frontend-react',
  }),
});

// Configura o exportador (envia dados para o Collector via HTTP)
const exporter = new OTLPTraceExporter({
  url: collectorUrl,
});

// Processador em Batch (para performance)
provider.addSpanProcessor(new BatchSpanProcessor(exporter));

provider.register({
  contextManager: new ZoneContextManager(),
});

// Regista as instrumentações automáticas (Cliques, Fetch, Load)
registerInstrumentations({
  tracerProvider: provider,
  instrumentations: [
    getWebAutoInstrumentations({
      '@opentelemetry/instrumentation-user-interaction': {
        enabled: true, // Regista cliques
      },
      '@opentelemetry/instrumentation-document-load': {
        enabled: true, // Regista tempo de load da página
      },
      '@opentelemetry/instrumentation-fetch': {
        enabled: true, // Liga o frontend ao backend nos traces
        propagateTraceHeaderCorsUrls: /.*/, // Envia headers de trace para o backend
        clearTimingResources: true,
      },
    }),
  ],
});

console.log("🔭 OpenTelemetry Frontend Ativo! A enviar para:", collectorUrl);
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { ZoneContextManager } from '@opentelemetry/context-zone';
// MUDANÇA 1: Usar resourceFromAttributes em vez de Resource
import { resourceFromAttributes } from '@opentelemetry/resources';
// MUDANÇA 2: Usar ATTR_SERVICE_NAME (padrão mais recente)
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

// URL do Collector.
// Em dev usa localhost. Em prod usa a variável de ambiente injetada no build.
const collectorUrl = import.meta.env.VITE_OTEL_ENDPOINT || 'http://localhost:4318/v1/traces';

// MUDANÇA 3: Criar o provider usando a função helper
const provider = new WebTracerProvider({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'frontend-react',
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

// Regista as instrumentações automáticas
registerInstrumentations({
  tracerProvider: provider,
  instrumentations: [
    getWebAutoInstrumentations({
      '@opentelemetry/instrumentation-user-interaction': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-document-load': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-fetch': {
        enabled: true,
        propagateTraceHeaderCorsUrls: /.*/,
        clearTimingResources: true,
      },
    }),
  ],
});

console.log("🔭 OpenTelemetry Frontend Ativo! A enviar para:", collectorUrl);
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

try {
  // URL do Collector - construir URL completa para o browser
  const collectorUrl = import.meta.env.VITE_OTEL_ENDPOINT || `${window.location.origin}/v1/traces`;

  const provider = new WebTracerProvider({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: 'frontend-react',
    }),
  });

  // Configura o exportador
  const exporter = new OTLPTraceExporter({
    url: collectorUrl,
  });

  // Adiciona o processador (com verificação de segurança)
  if (typeof provider.addSpanProcessor === 'function') {
    provider.addSpanProcessor(new BatchSpanProcessor(exporter));
  }

  provider.register({
    contextManager: new ZoneContextManager(),
  });

  // Regista as instrumentações automáticas
  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      getWebAutoInstrumentations({
        '@opentelemetry/instrumentation-user-interaction': { enabled: true },
        '@opentelemetry/instrumentation-document-load': { enabled: true },
        '@opentelemetry/instrumentation-fetch': {
          enabled: true,
          propagateTraceHeaderCorsUrls: /.*/,
          clearTimingResources: true,
        },
      }),
    ],
  });

  console.log("🔭 OpenTelemetry Frontend iniciado com sucesso em:", collectorUrl);

} catch (error) {
  console.error("⚠️ Falha ao iniciar OpenTelemetry (A App vai continuar a funcionar):", error);
}
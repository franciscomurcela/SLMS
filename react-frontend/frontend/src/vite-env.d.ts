/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FLAGSMITH_ENVIRONMENT_KEY: string
  readonly VITE_GOOGLE_MAPS_API_KEY: string
  readonly VITE_ORDER_SERVICE_URL: string
  readonly VITE_USER_SERVICE_URL: string
  readonly VITE_CARRIER_SERVICE_URL: string
  readonly VITE_KEYCLOAK_URL: string
  readonly VITE_OTEL_ENDPOINT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module "*.svg" {
  const content: string;
  export default content;
}
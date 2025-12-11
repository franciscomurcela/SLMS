// Keycloak configuration
// Use environment variable or fallback to relative path (proxied by nginx)
const getKeycloakUrl = () => {
  // VITE_KEYCLOAK_URL can be:
  // - Local: /auth (nginx proxies to localhost:8083/auth)
  // - Cloud: https://slms-keycloak.calmglacier-aaa99a56.francecentral.azurecontainerapps.io/auth
  return import.meta.env.VITE_KEYCLOAK_URL || '/auth';
};

export const keycloakConfig = {
  url: getKeycloakUrl(),
  realm: 'ESg204',
  clientId: 'frontend',
};

export const keycloakInitOptions = {
  onLoad: undefined,
  checkLoginIframe: false,
  silentCheckSsoRedirectUri: undefined,
  responseMode: 'fragment' as const,
  checkLoginIframeInterval: undefined,
};
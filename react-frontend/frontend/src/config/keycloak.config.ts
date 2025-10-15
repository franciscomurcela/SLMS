// Keycloak configuration
export const keycloakConfig = {
  url: 'http://localhost:8083',
  realm: 'ESg204',
  clientId: 'frontend',
};

export const keycloakInitOptions = {
  // Don't auto-login, just check if there's an existing session
  onLoad: 'check-sso' as const,
  pkceMethod: 'S256' as const,
  checkLoginIframe: false,
  // Disable silent check SSO to avoid CORS issues
  silentCheckSsoRedirectUri: undefined,
  // Enable response mode to handle callback properly
  responseMode: 'fragment' as const,
};

// Backend API base URL - user_service handles authentication
export const BACKEND_URL = 'http://localhost:8082';

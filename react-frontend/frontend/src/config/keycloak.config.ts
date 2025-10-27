// Keycloak configuration
// Dynamic URL based on window location for remote access compatibility
const getKeycloakUrl = () => {
  // If accessing via remote IP, use that IP for Keycloak too
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `http://${window.location.hostname}:8083`;
  }
  return 'http://localhost:8083';
};

export const keycloakConfig = {
  url: getKeycloakUrl(),
  realm: 'ESg204',
  clientId: 'frontend',
};

export const keycloakInitOptions = {
  // Don't auto-login, just check if there's an existing session
  onLoad: 'check-sso' as const,
  // IMPORTANTE: Remover PKCE para funcionar sem HTTPS
  // pkceMethod: 'S256' as const,  // Comentado - requer HTTPS
  checkLoginIframe: false,
  // Disable silent check SSO to avoid CORS issues
  silentCheckSsoRedirectUri: undefined,
  // Enable response mode to handle callback properly
  responseMode: 'fragment' as const,
};

// Backend API base URL - user_service handles authentication
const getBackendUrl = () => {
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `http://${window.location.hostname}:8082`;
  }
  return 'http://localhost:8082';
};

export const BACKEND_URL = getBackendUrl();

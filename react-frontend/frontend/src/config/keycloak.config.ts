// Keycloak configuration
// Use same-origin URL through Nginx proxy to avoid CORS and secure context issues
const getKeycloakUrl = () => {
  // Always use relative path /auth when behind Nginx
  // This makes it same-origin and works without HTTPS
  return `${window.location.protocol}//${window.location.host}/auth`;
};

export const keycloakConfig = {
  url: getKeycloakUrl(),
  realm: 'ESg204',
  clientId: 'frontend',
};

export const keycloakInitOptions = {
  // Allow if authenticated, don't force login
  // This prevents redirect loop while still checking for existing sessions
  onLoad: 'allow-if-authenticated' as const,
  checkLoginIframe: false,
  // Disable silent check SSO to avoid CORS issues
  silentCheckSsoRedirectUri: undefined,
  // Enable response mode to handle callback properly
  responseMode: 'fragment' as const,
  // Disable iframe checking completely to avoid timeouts
  checkLoginIframeInterval: undefined,
};

// Backend API base URL - user_service handles authentication
// Use same-origin URL through Nginx proxy
const getBackendUrl = () => {
  // Always use relative path /api when behind Nginx
  return `${window.location.protocol}//${window.location.host}/api`;
};

export const BACKEND_URL = getBackendUrl();

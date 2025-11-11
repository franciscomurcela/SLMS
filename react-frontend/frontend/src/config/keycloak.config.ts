// Keycloak configuration
// Point directly to Keycloak public URL with /auth path
const getKeycloakUrl = () => {
  // Use Keycloak FQDN directly (not same-origin anymore)
  return 'https://slms-keycloak.calmglacier-aaa99a56.francecentral.azurecontainerapps.io/auth';
};

export const keycloakConfig = {
  url: getKeycloakUrl(),
  realm: 'ESg204',
  clientId: 'frontend',
};

export const keycloakInitOptions = {
  // Don't force login - let page load without authentication
  // User can manually login if needed
  onLoad: undefined,
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

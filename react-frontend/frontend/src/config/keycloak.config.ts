// Keycloak configuration
// Use local Keycloak instance
const getKeycloakUrl = () => {
  // Always use local Keycloak on port 8083
  return 'http://localhost:8083/auth';
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

// Backend API base URL - adapts to environment
const getBackendUrl = () => {
  const isDevelopment = window.location.hostname === 'localhost' && 
                       (window.location.port === '3000' || window.location.port === '5173');
  
  if (isDevelopment) {
    // In development, services run on direct ports
    return 'http://localhost'; // Will use :8080, :8081, :8082 as needed
  } else {
    // In production, use nginx proxy
    return `${window.location.protocol}//${window.location.host}/api`;
  }
};

export const BACKEND_URL = getBackendUrl();

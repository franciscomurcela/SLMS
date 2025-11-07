// Keycloak configuration
// Adapts to current environment automatically
const getKeycloakUrl = () => {
  // Check if we're in development (localhost:3000 or localhost:5173)
  const isDevelopment = window.location.hostname === 'localhost' && 
                       (window.location.port === '3000' || window.location.port === '5173');
  
  if (isDevelopment) {
    // In development, Keycloak runs directly on localhost:8083
    return 'http://localhost:8083/auth';
  } else {
    // In production, use nginx proxy path
    return `${window.location.protocol}//${window.location.host}/auth`;
  }
};

export const keycloakConfig = {
  url: getKeycloakUrl(),
  realm: 'ESg204',
  clientId: 'frontend',
};

export const keycloakInitOptions = {
  // Don't auto-login, just check if there's an existing session
  onLoad: 'check-sso' as const,
  checkLoginIframe: false,
  // Disable silent check SSO to avoid CORS issues
  silentCheckSsoRedirectUri: undefined,
  // Enable response mode to handle callback properly
  responseMode: 'fragment' as const,
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

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
  onLoad: undefined,
  checkLoginIframe: false,
  silentCheckSsoRedirectUri: undefined,
  responseMode: 'fragment' as const,
  checkLoginIframeInterval: undefined,
};
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
  onLoad: undefined,
  checkLoginIframe: false,
  silentCheckSsoRedirectUri: undefined,
  responseMode: 'fragment' as const,
  checkLoginIframeInterval: undefined,
};
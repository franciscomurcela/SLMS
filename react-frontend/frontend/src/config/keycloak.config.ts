// Keycloak configuration
export const keycloakConfig = {
  url: 'http://localhost:8081',
  realm: 'ESg204',
  clientId: 'frontend',
};

export const keycloakInitOptions = {
  onLoad: undefined, // Não fazer login automático - apenas quando o utilizador clicar no botão
  pkceMethod: 'S256' as const,
  checkLoginIframe: false,
};

// Backend API base URL
export const BACKEND_URL = 'http://localhost:8080';

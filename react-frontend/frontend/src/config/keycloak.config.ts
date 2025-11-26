// Keycloak configuration
const getKeycloakUrl = () => {
  // 1. Prioridade: Variável de ambiente (Injetada pelo CD para a VM)
  // É AQUI QUE ELE VAI LER O VALOR QUE DEFINIRES NO CD
  if (import.meta.env.VITE_KEYCLOAK_URL) {
    return import.meta.env.VITE_KEYCLOAK_URL;
  }

  // 2. Desenvolvimento (Localhost)
  const isDevelopment = window.location.hostname === 'localhost' && 
                        (window.location.port === '3000' || window.location.port === '5173');
  
  if (isDevelopment) {
    return 'http://localhost:8083/auth';
  } 
  
  // 3. Fallback (Cloud azure)
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
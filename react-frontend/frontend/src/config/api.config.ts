// API Configuration
// Always use nginx proxy routes (no direct service access)

/**
 * Base URL - always uses current host (nginx proxy handles routing)
 */
export const API_BASE_URL = `${window.location.protocol}//${window.location.host}`;

/**
 * Backend API endpoints through Nginx proxy
 */
export const API_ENDPOINTS = {
  // Carriers API  
  CARRIERS: isDevelopment 
    ? `${API_BASE_URL}:8080/carriers`
    : `https://slms-carrier-service.calmglacier-aaa99a56.francecentral.azurecontainerapps.io/carriers`,
  
  // Orders API - Direct to order service
  ORDERS: isDevelopment 
    ? `${API_BASE_URL}:8081/api/orders`
    : `https://slms-order-service.calmglacier-aaa99a56.francecentral.azurecontainerapps.io/api/orders`,
  SHIPMENTS: isDevelopment 
    ? `${API_BASE_URL}:8081/api/shipments`
    : `https://slms-order-service.calmglacier-aaa99a56.francecentral.azurecontainerapps.io/api/shipments`,
  CONFIRM_DELIVERY: isDevelopment 
    ? `${API_BASE_URL}:8081/api/orders/confirm-delivery`
    : `https://slms-order-service.calmglacier-aaa99a56.francecentral.azurecontainerapps.io/api/orders/confirm-delivery`,
  REPORT_ANOMALY: isDevelopment 
    ? `${API_BASE_URL}:8081/api/orders/report-anomaly`
    : `https://slms-order-service.calmglacier-aaa99a56.francecentral.azurecontainerapps.io/api/orders/report-anomaly`,
  
  // Users API
  USERS: isDevelopment 
    ? `${API_BASE_URL}:8082/user`
    : `https://slms-backend.calmglacier-aaa99a56.francecentral.azurecontainerapps.io/user`,
  WHOAMI: isDevelopment 
    ? `${API_BASE_URL}:8082/user/whoami`
    : `https://slms-backend.calmglacier-aaa99a56.francecentral.azurecontainerapps.io/user/whoami`,
  
  // Auth (Keycloak through nginx proxy)
  AUTH: `${API_BASE_URL}/auth`,
} as const;

/**
 * Helper function to build API URLs
 * @param path - API path (e.g., "/carriers", "/api/orders")
 * @returns Full URL with current host
 */
export const getApiUrl = (path: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
};

/**
 * Default fetch options with common headers
 */
export const defaultFetchOptions = (token?: string): RequestInit => ({
  headers: {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  },
});


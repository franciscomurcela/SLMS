// API Configuration
// Adapts to current environment automatically

/**
 * Determine the current environment and set appropriate base URL
 */
const isDevelopment = window.location.hostname === 'localhost' && 
                     (window.location.port === '3000' || window.location.port === '5173');

/**
 * Base URL for the application
 * - Development: Direct service URLs on localhost
 * - Production: Uses nginx proxy with current host
 */
export const API_BASE_URL = isDevelopment 
  ? 'http://localhost' 
  : `${window.location.protocol}//${window.location.host}`;

/**
 * Backend API endpoints
 * - Development: Direct service ports
 * - Production: Through Nginx proxy
 */
export const API_ENDPOINTS = {
  // Carriers API
  CARRIERS: isDevelopment 
    ? `${API_BASE_URL}:8080/carriers`
    : `${API_BASE_URL}/carriers`,
  
  // Orders API
  ORDERS: isDevelopment 
    ? `${API_BASE_URL}:8081/api/orders`
    : `${API_BASE_URL}/api/orders`,
  SHIPMENTS: isDevelopment 
    ? `${API_BASE_URL}:8081/api/shipments`
    : `${API_BASE_URL}/api/shipments`,
  CONFIRM_DELIVERY: isDevelopment 
    ? `${API_BASE_URL}:8081/api/orders/confirm-delivery`
    : `${API_BASE_URL}/api/orders/confirm-delivery`,
  
  // Users API
  USERS: isDevelopment 
    ? `${API_BASE_URL}:8082/user`
    : `${API_BASE_URL}/user`,
  WHOAMI: isDevelopment 
    ? `${API_BASE_URL}:8082/user/whoami`
    : `${API_BASE_URL}/user/whoami`,
  
  // Auth (Keycloak - port 8083 in development)
  AUTH: isDevelopment 
    ? `${API_BASE_URL}:8083/auth`
    : `${API_BASE_URL}/auth`,
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


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
  CARRIERS: `${API_BASE_URL}/carriers`,
  
  // Orders API  
  ORDERS: `${API_BASE_URL}/api/orders`,
  SHIPMENTS: `${API_BASE_URL}/api/shipments`,
  CONFIRM_DELIVERY: `${API_BASE_URL}/api/orders/confirm-delivery`,
  REPORT_ANOMALY: `${API_BASE_URL}/api/orders/report-anomaly`,
  CREATE_SHIPMENT: `${API_BASE_URL}/api/shipments/create`,
  
  // Users API
  USERS: `${API_BASE_URL}/user`,
  WHOAMI: `${API_BASE_URL}/user/whoami`,
  
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


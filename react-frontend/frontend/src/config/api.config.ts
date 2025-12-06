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
 * Backend API endpoints through Nginx proxy
 * All endpoints use relative paths - nginx will proxy to correct service
 */
export const API_ENDPOINTS = {
  // Carriers API
  CARRIERS: `${API_BASE_URL}/carriers`,
  
  // Orders API - Proxied by nginx to order-service
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


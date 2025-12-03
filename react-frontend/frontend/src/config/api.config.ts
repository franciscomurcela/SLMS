// API Configuration
// Uses environment variables for backend service URLs in production

/**
 * Determine if running in development mode
 */
const isDevelopment = window.location.hostname === 'localhost' && 
                     (window.location.port === '3000' || window.location.port === '5173');

/**
 * Backend service base URLs
 */
const ORDER_SERVICE_URL = import.meta.env.VITE_ORDER_SERVICE_URL || 
  (isDevelopment ? 'http://localhost:8081' : `${window.location.protocol}//${window.location.host}`);

const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || 
  (isDevelopment ? 'http://localhost:8082' : `${window.location.protocol}//${window.location.host}`);

const CARRIER_SERVICE_URL = import.meta.env.VITE_CARRIER_SERVICE_URL || 
  (isDevelopment ? 'http://localhost:8080' : `${window.location.protocol}//${window.location.host}`);

const NOTIFICATION_SERVICE_URL = import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 
  (isDevelopment ? 'http://localhost:8084' : `${window.location.protocol}//${window.location.host}`);

/**
 * Base URL - for auth and other shared services
 */
export const API_BASE_URL = `${window.location.protocol}//${window.location.host}`;

/**
 * Backend API endpoints
 */
export const API_ENDPOINTS = {
  // Carriers API
  CARRIERS: `${CARRIER_SERVICE_URL}/carriers`,
  
  // Orders API  
  ORDERS: `${ORDER_SERVICE_URL}/api/orders`,
  SHIPMENTS: `${ORDER_SERVICE_URL}/api/shipments`,
  CONFIRM_DELIVERY: `${ORDER_SERVICE_URL}/api/orders/confirm-delivery`,
  REPORT_ANOMALY: `${ORDER_SERVICE_URL}/api/orders/report-anomaly`,
  CREATE_SHIPMENT: `${ORDER_SERVICE_URL}/api/shipments/create`,
  PACKING_SLIP: (orderId: string) => `${ORDER_SERVICE_URL}/api/orders/${orderId}/packing-slip`,
  SHIPPING_LABEL: (orderId: string) => `${ORDER_SERVICE_URL}/api/orders/${orderId}/shipping-label`,
  
  // Users API
  USERS: `${USER_SERVICE_URL}/user`,
  WHOAMI: `${USER_SERVICE_URL}/user/whoami`,
  
  // Notifications API
  NOTIFICATIONS: `${NOTIFICATION_SERVICE_URL}/api/notifications`,
  NOTIFICATIONS_UNREAD: `${NOTIFICATION_SERVICE_URL}/api/notifications/unread`,
  NOTIFICATIONS_UNREAD_COUNT: `${NOTIFICATION_SERVICE_URL}/api/notifications/unread/count`,
  NOTIFICATION_MARK_READ: (id: number) => `${NOTIFICATION_SERVICE_URL}/api/notifications/${id}/read`,
  NOTIFICATIONS_MARK_ALL_READ: `${NOTIFICATION_SERVICE_URL}/api/notifications/read-all`,
  
  // Auth (Keycloak - uses same host as frontend or env var)
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


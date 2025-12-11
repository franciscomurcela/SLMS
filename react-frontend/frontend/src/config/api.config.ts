// API Configuration
// Uses environment variables for backend service URLs in production

/**
 * Determine if running in development mode (direct Vite dev server)
 */
const isDevelopment = window.location.hostname === 'localhost' && 
                     (window.location.port === '3000' || window.location.port === '5173');

/**
 * Backend service base URLs
 * - Development (Vite): Direct service URLs with ports
 * - Production/Nginx: Use current host (nginx will proxy based on path)
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
 * Base URL for the application
 */
export const API_BASE_URL = isDevelopment 
  ? 'http://localhost' 
  : `${window.location.protocol}//${window.location.host}`;

/**
 * Backend API endpoints
 * In development: Full URLs with ports (direct to services)
 * In production/nginx: Paths only (nginx proxies based on path)
 */
export const API_ENDPOINTS = {
  // Carriers API
  CARRIERS: isDevelopment ? `${CARRIER_SERVICE_URL}/carriers` : '/carriers',
  
  // Orders API  
  ORDERS: isDevelopment ? `${ORDER_SERVICE_URL}/api/orders` : '/api/orders',
  SHIPMENTS: isDevelopment ? `${ORDER_SERVICE_URL}/api/shipments` : '/api/shipments',
  CONFIRM_DELIVERY: isDevelopment ? `${ORDER_SERVICE_URL}/api/orders/confirm-delivery` : '/api/orders/confirm-delivery',
  REPORT_ANOMALY: isDevelopment ? `${ORDER_SERVICE_URL}/api/orders/report-anomaly` : '/api/orders/report-anomaly',
  CREATE_SHIPMENT: isDevelopment ? `${ORDER_SERVICE_URL}/api/shipments/create` : '/api/shipments/create',
  PACKING_SLIP: (orderId: string) => isDevelopment ? `${ORDER_SERVICE_URL}/api/orders/${orderId}/packing-slip` : `/api/orders/${orderId}/packing-slip`,
  SHIPPING_LABEL: (orderId: string) => isDevelopment ? `${ORDER_SERVICE_URL}/api/orders/${orderId}/shipping-label` : `/api/orders/${orderId}/shipping-label`,
  
  // Users API
  USERS: isDevelopment ? `${USER_SERVICE_URL}/api/users` : '/api/users',
  WHOAMI: isDevelopment ? `${USER_SERVICE_URL}/api/users/whoami` : '/api/users/whoami',
  USER_BY_KEYCLOAK: (keycloakId: string) => isDevelopment ? `${USER_SERVICE_URL}/api/users/by-keycloak/${keycloakId}` : `/api/users/by-keycloak/${keycloakId}`,
  
  // Notifications API
  NOTIFICATIONS: isDevelopment ? `${NOTIFICATION_SERVICE_URL}/api/notifications` : '/api/notifications',
  NOTIFICATIONS_UNREAD: isDevelopment ? `${NOTIFICATION_SERVICE_URL}/api/notifications/unread` : '/api/notifications/unread',
  NOTIFICATIONS_UNREAD_COUNT: isDevelopment ? `${NOTIFICATION_SERVICE_URL}/api/notifications/unread/count` : '/api/notifications/unread/count',
  NOTIFICATION_MARK_READ: (id: number) => isDevelopment ? `${NOTIFICATION_SERVICE_URL}/api/notifications/${id}/read` : `/api/notifications/${id}/read`,
  NOTIFICATIONS_MARK_ALL_READ: isDevelopment ? `${NOTIFICATION_SERVICE_URL}/api/notifications/read-all` : '/api/notifications/read-all',
  
  // Auth (Keycloak)
  AUTH: isDevelopment ? `${API_BASE_URL}/auth` : '/auth',
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


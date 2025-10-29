// API Configuration
// All API calls should use these base URLs to work correctly with Nginx proxy

/**
 * Base URL for the application
 * Uses the current window location to ensure same-origin requests
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
  
  // Users API (note: user-service uses /user/ not /api/users/)
  USERS: `${API_BASE_URL}/user`,
  WHOAMI: `${API_BASE_URL}/user/whoami`,
  
  // Auth
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


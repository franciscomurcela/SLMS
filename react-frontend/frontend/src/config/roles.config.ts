/**
 * Role-based routing configuration
 * Maps user roles to their corresponding dashboard pages
 */

export const ROLE_ROUTES: Record<string, string> = {
  'Customer': '/customer',
  'Logistics_Manager': '/logisticsmanager',
  'Driver': '/driver',
  'Warehouse_Staff': '/warehouse',
} as const;

export const APP_ROLES = {
  CUSTOMER: 'Customer',
  LOGISTICS_MANAGER: 'Logistics_Manager',
  DRIVER: 'Driver',
  WAREHOUSE_STAFF: 'Warehouse_Staff',
} as const;

/**
 * Get the route for a given role
 */
export const getRouteForRole = (role: string): string | undefined => {
  return ROLE_ROUTES[role];
};

/**
 * Check if a role has access to a specific route
 */
export const hasAccessToRoute = (userRoles: string[], route: string): boolean => {
  return userRoles.some(role => ROLE_ROUTES[role] === route);
};

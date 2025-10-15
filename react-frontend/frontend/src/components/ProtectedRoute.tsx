import { Navigate } from 'react-router-dom';
import { useKeycloak } from '../context/KeycloakContext';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  requiredRoles?: string[];
}

/**
 * Component to protect routes based on authentication and roles
 * 
 * Usage:
 * <ProtectedRoute requiredRole="Logistics_Manager">
 *   <LogisticsManagerPage />
 * </ProtectedRoute>
 * 
 * or for multiple roles:
 * <ProtectedRoute requiredRoles={["Driver", "Logistics_Manager"]}>
 *   <DeliveryPage />
 * </ProtectedRoute>
 */
export const ProtectedRoute = ({ 
  children, 
  requiredRole, 
  requiredRoles 
}: ProtectedRouteProps) => {
  const { authenticated, loading, hasRole, roles } = useKeycloak();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="container text-center mt-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">A carregar...</span>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role requirements
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="container text-center mt-5">
        <h3 className="text-danger">Acesso Negado</h3>
        <p>Não tem permissões para aceder a esta página.</p>
        <p className="text-muted">Role necessária: {requiredRole}</p>
        <p className="text-muted">As suas roles: {roles.join(', ') || 'Nenhuma'}</p>
      </div>
    );
  }

  // Check multiple roles (user must have at least one)
  if (requiredRoles && requiredRoles.length > 0) {
    const hasAnyRole = requiredRoles.some(role => hasRole(role));
    if (!hasAnyRole) {
      return (
        <div className="container text-center mt-5">
          <h3 className="text-danger">Acesso Negado</h3>
          <p>Não tem permissões para aceder a esta página.</p>
          <p className="text-muted">Roles necessárias: {requiredRoles.join(', ')}</p>
          <p className="text-muted">As suas roles: {roles.join(', ') || 'Nenhuma'}</p>
        </div>
      );
    }
  }

  // User is authenticated and has required role(s)
  return <>{children}</>;
};


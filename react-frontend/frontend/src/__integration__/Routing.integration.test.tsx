import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { KeycloakContext } from '../context/KeycloakContextDef';
import React from 'react';

/**
 * TESTES DE INTEGRAÇÃO - ROUTING & AUTENTICAÇÃO
 * 
 * Testa a integração entre:
 * - React Router
 * - Keycloak Context
 * - Navigation
 * - Authentication state
 */

const mockKeycloakAuthenticated = {
  keycloak: { token: 'test-token', authenticated: true } as any,
  authenticated: true,
  loading: false,
  login: vi.fn(),
  logout: vi.fn(),
  token: 'test-token',
  userInfo: { sub: 'user123', name: 'Test User' },
  roles: ['customer'],
  hasRole: (role: string) => role === 'customer',
  primaryRole: 'customer' as const,
};

const mockKeycloakUnauthenticated = {
  keycloak: { token: undefined, authenticated: false } as any,
  authenticated: false,
  loading: false,
  login: vi.fn(),
  logout: vi.fn(),
  token: undefined,
  userInfo: null,
  roles: [],
  hasRole: () => false,
  primaryRole: undefined,
};

describe('Integration Tests - Routing & Authentication Context', () => {
  it('renderiza rota pública sem autenticação', () => {
    const HomePage = () => <div>Welcome Home</div>;

    render(
      <MemoryRouter initialEntries={['/']}>
        <KeycloakContext.Provider value={mockKeycloakUnauthenticated}>
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
        </KeycloakContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByText('Welcome Home')).toBeInTheDocument();
  });

  it('renderiza rota quando autenticado', () => {
    const DashboardPage = () => <div>Dashboard Content</div>;

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <KeycloakContext.Provider value={mockKeycloakAuthenticated}>
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </KeycloakContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
  });

  it('contexto de autenticação contém informações corretas', () => {
    const TestComponent = () => {
      const ctx = React.useContext(KeycloakContext);
      if (!ctx) return <div>No Context</div>;
      return (
        <div>
          <div>Authenticated: {ctx.authenticated ? 'Yes' : 'No'}</div>
          <div>Token: {ctx.token || 'None'}</div>
        </div>
      );
    };

    render(
      <MemoryRouter>
        <KeycloakContext.Provider value={mockKeycloakAuthenticated}>
          <TestComponent />
        </KeycloakContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByText('Authenticated: Yes')).toBeInTheDocument();
    expect(screen.getByText(/Token: test-token/)).toBeInTheDocument();
  });
});

describe('Integration Tests - Role-Based Access', () => {
  it('verifica roles no contexto de autenticação', () => {
    const adminContext = {
      ...mockKeycloakAuthenticated,
      roles: ['admin', 'warehouse_staff'],
      hasRole: (role: string) => ['admin', 'warehouse_staff'].includes(role),
      primaryRole: 'admin' as const,
    };

    const RoleComponent = () => {
      const ctx = React.useContext(KeycloakContext);
      if (!ctx) return <div>No Context</div>;
      return (
        <div>
          <div>Has Admin: {ctx.hasRole('admin') ? 'Yes' : 'No'}</div>
          <div>Primary Role: {ctx.primaryRole}</div>
        </div>
      );
    };

    render(
      <MemoryRouter>
        <KeycloakContext.Provider value={adminContext}>
          <RoleComponent />
        </KeycloakContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByText('Has Admin: Yes')).toBeInTheDocument();
    expect(screen.getByText('Primary Role: admin')).toBeInTheDocument();
  });

  it('verifica quando utilizador não tem role específico', () => {
    const customerContext = {
      ...mockKeycloakAuthenticated,
      roles: ['customer'],
      hasRole: (role: string) => role === 'customer',
      primaryRole: 'customer' as const,
    };

    const RoleComponent = () => {
      const ctx = React.useContext(KeycloakContext);
      if (!ctx) return <div>No Context</div>;
      return (
        <div>
          <div>Has Admin: {ctx.hasRole('admin') ? 'Yes' : 'No'}</div>
          <div>Has Customer: {ctx.hasRole('customer') ? 'Yes' : 'No'}</div>
        </div>
      );
    };

    render(
      <MemoryRouter>
        <KeycloakContext.Provider value={customerContext}>
          <RoleComponent />
        </KeycloakContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByText('Has Admin: No')).toBeInTheDocument();
    expect(screen.getByText('Has Customer: Yes')).toBeInTheDocument();
  });
});

describe('Integration Tests - Navigation Flow', () => {
  it('renderiza diferentes páginas com roteamento', () => {
    const HomePage = () => <div>Home Page Content</div>;
    const DashboardPage = () => <div>Dashboard Page Content</div>;

    // Testa rota home
    const { unmount } = render(
      <MemoryRouter initialEntries={['/']}>
        <KeycloakContext.Provider value={mockKeycloakAuthenticated}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </KeycloakContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByText('Home Page Content')).toBeInTheDocument();
    unmount();

    // Testa rota dashboard
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <KeycloakContext.Provider value={mockKeycloakAuthenticated}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </KeycloakContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Page Content')).toBeInTheDocument();
  });

  it('mantém contexto de autenticação entre diferentes rotas', () => {
    function TestComponent() {
      const ctx = React.useContext(KeycloakContext);
      return <div data-testid="auth-context">{ctx ? `User: ${ctx.userInfo?.name}` : 'No Auth'}</div>;
    }

    render(
      <MemoryRouter initialEntries={['/profile']}>
        <KeycloakContext.Provider value={mockKeycloakAuthenticated}>
          <Routes>
            <Route path="/profile" element={<TestComponent />} />
          </Routes>
        </KeycloakContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('auth-context')).toHaveTextContent('User: Test User');
  });
});

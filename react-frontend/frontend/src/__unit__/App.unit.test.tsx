vi.mock('../config/api.config', () => ({
  API_ENDPOINTS: {
    ORDERS: 'http://localhost:8081/api/orders',
    CARRIERS: 'http://localhost:8080/carriers',
  }
}));
import { render, screen, waitFor } from '@testing-library/react';
import OrdersPanel from '../components/OrdersPanel';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, beforeEach, afterEach, vi, expect } from 'vitest';
import { KeycloakContext } from '../context/KeycloakContextDef';

const mockKeycloakContext = {
  keycloak: { token: 'mock-token', authenticated: true } as unknown as import('keycloak-js').default,
  authenticated: true,
  loading: false,
  login: vi.fn(),
  logout: vi.fn(),
  token: 'mock-token',
  userInfo: { sub: 'user1' },
  roles: [],
  hasRole: () => false,
  primaryRole: undefined,
};

describe('OrdersPanel', () => {
  beforeEach(() => {
    // Mock fetch para /api/orders e /carriers
    global.fetch = vi.fn()
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          {
            orderId: 'order1234',
            customerId: 'customer1',
            customerName: 'João Silva',
            carrierId: 'carrier1',
            originAddress: 'Rua A',
            destinationAddress: 'Rua B',
            weight: 2.5,
            status: 'Pending',
            orderDate: '2025-10-29T10:00:00Z',
          }
        ])
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          {
            carrier_id: 'carrier1',
            name: 'Transportadora XPTO',
            avg_cost: 10,
            on_time_rate: 0.95,
            success_rate: 0.99
          }
        ])
      }));
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renderiza pedido na tabela', async () => {
    render(
      <MemoryRouter>
        <KeycloakContext.Provider value={mockKeycloakContext}>
          <OrdersPanel />
        </KeycloakContext.Provider>
      </MemoryRouter>
    );
    // Espera o pedido aparecer na tabela
    await waitFor(() => {
      expect(screen.getByText(/João Silva/)).toBeInTheDocument();
      expect(screen.getByText(/Rua A/)).toBeInTheDocument();
      expect(screen.getByText(/Rua B/)).toBeInTheDocument();
      expect(screen.getByText(/2.50 kg/)).toBeInTheDocument();
      expect(screen.getByText(/Transportadora XPTO/)).toBeInTheDocument();
      // Verifica o status 'Pending' apenas na linha do pedido
      const rows = screen.getAllByRole('row');
      const orderRow = rows.find(row => row.textContent?.includes('João Silva'));
      expect(orderRow).toBeTruthy();
      expect(orderRow?.textContent).toMatch(/Pending/);
    });
  });
});

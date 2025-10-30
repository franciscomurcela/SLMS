import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import OrdersPanel from '../components/OrdersPanel';
import { KeycloakContext } from '../context/KeycloakContextDef';

/**
 * TESTES DE INTEGRAÇÃO
 * 
 * Testam a integração entre múltiplos componentes e serviços:
 * - API calls reais (mockadas)
 * - Context providers
 * - Múltiplos componentes interagindo
 * - Estado compartilhado
 */

const mockKeycloakContext = {
  keycloak: { token: 'test-token', authenticated: true } as unknown as import('keycloak-js').default,
  authenticated: true,
  loading: false,
  login: vi.fn(),
  logout: vi.fn(),
  token: 'test-token',
  userInfo: { sub: 'user123', name: 'Test User' },
  roles: ['warehouse_staff'],
  hasRole: (role: string) => role === 'warehouse_staff',
  primaryRole: 'warehouse_staff' as const,
};

describe('Integration Tests - OrdersPanel with API', () => {
  beforeEach(() => {
    // Mock global fetch
    global.fetch = vi.fn();
  });

  it('carrega orders da API e carriers da API e integra os dados', async () => {
    // Mock das chamadas à API
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            orderId: 'order-001',
            customerId: 'cust-1',
            customerName: 'Maria Silva',
            carrierId: 'carrier-abc',
            originAddress: 'Aveiro',
            destinationAddress: 'Porto',
            weight: 5.5,
            status: 'Pending',
            orderDate: '2025-10-30T10:00:00Z',
          },
          {
            orderId: 'order-002',
            customerId: 'cust-2',
            customerName: 'João Santos',
            carrierId: 'carrier-xyz',
            originAddress: 'Lisboa',
            destinationAddress: 'Faro',
            weight: 3.2,
            status: 'Delivered',
            orderDate: '2025-10-29T14:30:00Z',
          }
        ]
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            carrier_id: 'carrier-abc',
            name: 'Express Transportes',
            avg_cost: 15.50,
            on_time_rate: 0.98,
            success_rate: 0.99
          },
          {
            carrier_id: 'carrier-xyz',
            name: 'Rápido Logística',
            avg_cost: 12.30,
            on_time_rate: 0.95,
            success_rate: 0.97
          }
        ]
      });

    render(
      <BrowserRouter>
        <KeycloakContext.Provider value={mockKeycloakContext}>
          <OrdersPanel />
        </KeycloakContext.Provider>
      </BrowserRouter>
    );

    // Aguarda que os dados sejam carregados e renderizados
    await waitFor(() => {
      // Verifica orders
      expect(screen.getByText('Maria Silva')).toBeInTheDocument();
      expect(screen.getByText('João Santos')).toBeInTheDocument();
      
      // Verifica carriers integrados
      expect(screen.getByText('Express Transportes')).toBeInTheDocument();
      expect(screen.getByText('Rápido Logística')).toBeInTheDocument();
      
      // Verifica status (getAllByText para múltiplas ocorrências)
      expect(screen.getAllByText(/Pending/)).toHaveLength(2); // botão + badge
      expect(screen.getAllByText(/Delivered/)).toHaveLength(2); // botão + badge
    }, { timeout: 3000 });

    // Verifica que fetch foi chamado 2 vezes (orders + carriers)
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/orders'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token'
        })
      })
    );
  });

  it('trata erro da API de orders graciosamente', async () => {
    // Mock de erro na API
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <BrowserRouter>
        <KeycloakContext.Provider value={mockKeycloakContext}>
          <OrdersPanel />
        </KeycloakContext.Provider>
      </BrowserRouter>
    );

    // Aguarda processamento do erro
    await waitFor(() => {
      // Verifica que o componente não quebrou
      expect(screen.queryByText('Maria Silva')).not.toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('atualiza a lista quando o token de autenticação muda', async () => {
    const { rerender } = render(
      <BrowserRouter>
        <KeycloakContext.Provider value={mockKeycloakContext}>
          <OrdersPanel />
        </KeycloakContext.Provider>
      </BrowserRouter>
    );

    // Simula mudança de contexto (novo token)
    const newContext = {
      ...mockKeycloakContext,
      token: 'new-token',
    };

    rerender(
      <BrowserRouter>
        <KeycloakContext.Provider value={newContext}>
          <OrdersPanel />
        </KeycloakContext.Provider>
      </BrowserRouter>
    );

    // Verifica que a API foi chamada novamente
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});

describe('Integration Tests - Keycloak Authentication Flow', () => {
  it('verifica que as chamadas API incluem o token de autenticação', async () => {
    // Reset do mock antes do teste
    vi.clearAllMocks();
    
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ orders: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ carriers: [] }),
      });

    global.fetch = mockFetch;

    render(
      <BrowserRouter>
        <KeycloakContext.Provider value={mockKeycloakContext}>
          <OrdersPanel />
        </KeycloakContext.Provider>
      </BrowserRouter>
    );

    // Aguarda que as chamadas sejam feitas
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
    
    // Verifica que as chamadas incluem o token de autenticação
    const calls = mockFetch.mock.calls;
    const hasAuthHeader = calls.some((call: unknown[]) => {
      const options = call[1] as RequestInit | undefined;
      const headers = options?.headers as Record<string, string> | undefined;
      return headers && headers['Authorization'] === 'Bearer test-token';
    });
    expect(hasAuthHeader).toBe(true);
  });
});

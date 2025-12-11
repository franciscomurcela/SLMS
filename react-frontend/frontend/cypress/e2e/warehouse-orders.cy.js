// cypress/e2e/warehouse-orders.cy.js

// NOTA: Estes testes requerem autenticação Keycloak e backend rodando
// Temporariamente pulados até configurar ambiente de teste completo
describe.skip('Warehouse Orders Page', () => {
  beforeEach(() => {
    // Visita a página principal da lista de pedidos
    cy.visit('/warehouse/orders');
  });

  it('Mostra a tabela de pedidos', () => {
    // Verifica se o título aparece
    cy.contains('Pedidos Recebidos').should('be.visible');

    // Verifica se a tabela está presente
    cy.get('table').should('exist');
  });

  it('Carrega e apresenta dados dos pedidos', () => {
    // Aguarda pela chegada de dados (fetch)
    cy.intercept('GET', '/api/orders').as('getOrders');
    cy.wait('@getOrders');

    // Verifica se pelo menos uma linha foi renderizada
    cy.get('table tbody tr').should('have.length.greaterThan', 0);
  });

  it('Mostra corretamente as colunas principais', () => {
    cy.get('table thead th').contains('ID');
    cy.get('table thead th').contains('Cliente');
    cy.get('table thead th').contains('Estado');
  });

  it('Permite ao Warehouse Staff ver os detalhes de um pedido', () => {
    // Supondo que há um botão "Ver Detalhes"
    cy.get('table tbody tr').first().find('button').contains('Ver').click();

    // Agora deve estar numa página de detalhe
    cy.url().should('include', '/warehouse/orders/');
    cy.contains('Detalhes da Encomenda').should('be.visible');
  });
});

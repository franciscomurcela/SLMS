/// <reference types="cypress" />

describe('Dummy E2E', () => {
  it('abre a página inicial do frontend', () => {
    cy.visit('http://localhost:5173');
    cy.contains('React').should('exist'); // Ajuste o texto conforme o que aparece na sua home
  });
});

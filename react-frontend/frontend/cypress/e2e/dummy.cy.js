/// <reference types="cypress" />

describe('Dummy E2E', () => {
  it('abre a página inicial do frontend', () => {
    cy.visit('http://localhost:3000');
    cy.contains('React').should('exist'); // Ajuste o texto conforme o que aparece na sua home
  });
});

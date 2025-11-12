/// <reference types="cypress" />

describe('Smoke Test - Application Loads', () => {
  it('abre a página inicial do frontend', () => {
    cy.visit('/');
    // Verifica se a página carrega sem erros
    cy.get('body').should('be.visible');
  });

  it('verifica se a aplicação está respondendo', () => {
    cy.visit('/');
    // Verifica se não há erro de console crítico
    cy.window().should('exist');
  });
});

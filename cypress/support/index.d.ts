// cypress/support/index.d.ts
/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to login with email and password
     * @example cy.login()
     * @example cy.login('user@example.com', 'password123')
     */
    login(email?: string, password?: string): Chainable<void>
  }
}

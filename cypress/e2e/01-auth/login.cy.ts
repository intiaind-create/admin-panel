// cypress/e2e/01-auth/login.cy.ts
describe('Login', () => {
    beforeEach(() => {
        cy.visit('/auth/login');
        // Intercept ALL possible login endpoints
        cy.intercept('POST', '**/**auth**/**login**').as('loginRequest');
        cy.intercept('POST', '**/**signin**').as('loginRequest');
    });

    it('should login with valid credentials → dashboard', () => {
        cy.get('[data-cy=email-input]').type('superadmin@keralatech.in');
        cy.get('[data-cy=password-input]').type('Admin@123{enter}');

        // Wait for API OR timeout (one will happen)
        cy.wait('@loginRequest', { timeout: 5000 })
            .its('response.statusCode')
            .should('eq', 200);

        cy.url().should('include', '/dashboard');
        cy.get('[data-cy=dashboard-container]').should('be.visible');
    });

    it('should show client validation errors', () => {
        cy.get('[data-cy=email-input]').type('invalid-email');
        cy.get('[data-cy=login-button]').should('be.disabled');
        cy.get('[data-cy=email-error]').should('contain', 'valid email');
    });

    it('should show server validation errors', () => {
        cy.get('[data-cy=email-input]').type('superadmin@keralatech.in');
        cy.get('[data-cy=password-input]').type('wrong{enter}');

        // Mock failed login
        cy.intercept('POST', '**/**login**', { statusCode: 401 }).as(
            'loginFail'
        );
        cy.wait('@loginFail');

        cy.get('[data-cy=toast-container]').should('be.visible');
    });
});

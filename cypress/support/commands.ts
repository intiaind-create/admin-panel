// cypress/support/commands.ts

Cypress.Commands.add('login', (email?: string, password?: string) => {
  const loginEmail = email || 'superadmin@keralatech.in'
  const loginPassword = password || 'Admin@123'
  
  cy.session([loginEmail, loginPassword], () => {
    cy.visit('/auth/login')
    cy.get('[data-cy=email-input]').clear().type(loginEmail)
    cy.get('[data-cy=password-input]').clear().type(loginPassword)
    cy.get('[data-cy=login-button]').click()
    cy.url().should('include', '/dashboard')
    cy.get('[data-cy=dashboard-container]').should('be.visible')
  })
})

// No export needed

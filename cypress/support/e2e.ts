// cypress/support/e2e.ts
import './commands'

Cypress.on('uncaught:exception', (err, runnable) => {
  return false
})

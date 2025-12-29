describe('Dashboard (After Login)', () => {
  
  beforeEach(() => {
    cy.login()
    cy.visit('/dashboard')
  })

  it('should load dashboard completely without errors', () => {
    cy.get('[data-cy=dashboard-container]').should('be.visible')
    cy.get('[data-cy=stats-loading]').should('not.exist')
    cy.get('[data-cy=dashboard-error]').should('not.exist')
  })

  it('should display task status widget (3 metrics)', () => {
    cy.get('[data-cy=task-status-widget]').should('be.visible')
    cy.get('[data-cy=task-status-widget] .card').should('have.length', 3)
    cy.contains('[data-cy=task-status-widget]', 'Completed Tasks').should('be.visible')
    cy.contains('[data-cy=task-status-widget]', 'Pending Tasks').should('be.visible')
    cy.contains('[data-cy=task-status-widget]', 'In Progress').should('be.visible')
  })

  it('should display navigation cards (4 cards)', () => {
    cy.get('[data-cy=pipeline-nav-card]').should('contain', 'Candidate Pipeline')
    cy.get('[data-cy=executives-nav-card]').should('contain', '75K+')
    cy.get('[data-cy=jobs-nav-card]').should('contain', '3 active')
    cy.get('[data-cy=tasks-nav-card]').should('contain', 'Task Management')
  })

  it('should navigate to pipeline on card click', () => {
    cy.get('[data-cy=pipeline-nav-card]').click()
    cy.url().should('include', '/candidate-pipeline')
    cy.go('back')
    cy.get('[data-cy=dashboard-container]').should('be.visible')
  })

  it('should handle dashboard service error gracefully', () => {
    // Mock API failure for dashboard service
    cy.intercept('GET', '**/api/users/admin/queries/getDashboardSummary**', {
      forceNetworkError: true
    }).as('dashboardError')
    
    cy.visit('/dashboard')
    cy.wait('@dashboardError')
    cy.get('[data-cy=dashboard-error]').should('be.visible')
    cy.get('[data-cy=stats-loading]').should('not.exist')
  })

  it('should show loading state initially', () => {
    cy.visit('/dashboard')
    cy.get('[data-cy=stats-loading]').should('be.visible')
    cy.wait(2000) // Wait for data load
    cy.get('[data-cy=stats-loading]').should('not.exist')
  })
})

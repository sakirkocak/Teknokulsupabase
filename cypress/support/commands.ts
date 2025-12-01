/// <reference types="cypress" />

// Özel Cypress komutları

// Login komutu
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/giris')
  cy.get('input[type="email"]').type(email)
  cy.get('input[type="password"]').type(password)
  cy.get('button[type="submit"]').click()
  cy.url().should('not.include', '/giris')
})

// Logout komutu
Cypress.Commands.add('logout', () => {
  cy.contains('Çıkış Yap').click()
  cy.url().should('eq', Cypress.config().baseUrl + '/')
})

// TypeScript tip tanımları
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      logout(): Chainable<void>
    }
  }
}

export {}


describe('Koçlar Sayfası Testleri', () => {
  beforeEach(() => {
    cy.visit('/koclar')
  })

  it('Koçlar sayfası yüklenmeli', () => {
    cy.get('body').should('be.visible')
    cy.contains('Koç').should('be.visible')
  })

  it('Arama kutusu görünmeli', () => {
    cy.get('input[placeholder*="Ara"]').should('be.visible')
  })

  it('Filtre seçenekleri görünmeli', () => {
    cy.get('select').should('have.length.at.least', 1)
  })

  it('Sayfa responsive olmalı', () => {
    // Mobil görünüm
    cy.viewport('iphone-x')
    cy.get('body').should('be.visible')
    
    // Tablet görünüm
    cy.viewport('ipad-2')
    cy.get('body').should('be.visible')
    
    // Desktop görünüm
    cy.viewport(1280, 720)
    cy.get('body').should('be.visible')
  })
})


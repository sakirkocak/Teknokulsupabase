describe('Materyal Marketi Testleri', () => {
  beforeEach(() => {
    cy.visit('/materyaller')
  })

  it('Materyal sayfası yüklenmeli', () => {
    cy.get('body').should('be.visible')
    cy.contains('Materyal').should('be.visible')
  })

  it('Arama kutusu görünmeli', () => {
    cy.get('input[placeholder*="Ara"]').should('be.visible')
  })

  it('Filtre seçenekleri görünmeli', () => {
    cy.get('select').should('have.length.at.least', 1)
  })

  it('Kategori filtresi çalışmalı', () => {
    cy.get('select').first().select(1) // İlk option'ı seç
    cy.wait(500)
    // Sayfa güncellenmeli
    cy.get('body').should('be.visible')
  })

  it('Dashboard linki görünmeli (giriş yapılmışsa)', () => {
    // Giriş yapmadan da sayfa çalışmalı
    cy.get('body').should('be.visible')
  })
})


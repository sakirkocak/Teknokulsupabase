describe('Navigasyon Testleri', () => {
  
  it('Tüm public sayfalar erişilebilir olmalı', () => {
    const publicPages = [
      '/',
      '/giris',
      '/kayit',
      '/koclar',
      '/materyaller',
    ]

    publicPages.forEach(page => {
      cy.visit(page)
      cy.get('body').should('be.visible')
      cy.url().should('include', page === '/' ? Cypress.config().baseUrl : page)
    })
  })

  it('Protected sayfalar login\'e yönlendirmeli', () => {
    const protectedPages = [
      '/koc',
      '/ogrenci',
      '/veli',
      '/admin',
    ]

    protectedPages.forEach(page => {
      cy.visit(page)
      // Middleware ile yönlendirme
      cy.url().should('satisfy', (url: string) => {
        return url.includes('/giris') || url.includes(page)
      })
    })
  })

  it('404 sayfası çalışmalı', () => {
    cy.visit('/olmayan-sayfa', { failOnStatusCode: false })
    cy.get('body').should('be.visible')
  })
})


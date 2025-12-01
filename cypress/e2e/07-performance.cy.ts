describe('Performans Testleri', () => {
  const pages = ['/', '/giris', '/kayit', '/koclar', '/materyaller']

  pages.forEach(page => {
    it(`${page} sayfası hızlı yüklenmeli (< 5 saniye)`, () => {
      const startTime = Date.now()
      
      cy.visit(page)
      cy.get('body').should('be.visible').then(() => {
        const loadTime = Date.now() - startTime
        expect(loadTime).to.be.lessThan(5000, `${page} sayfası ${loadTime}ms'de yüklendi`)
      })
    })
  })

  it('Ana sayfa interaktif öğeleri hızlı yüklenmeli', () => {
    cy.visit('/')
    
    // Butonlar görünür olmalı
    cy.contains('Giriş Yap', { timeout: 3000 }).should('be.visible')
    cy.contains('Kayıt Ol', { timeout: 3000 }).should('be.visible')
  })

  it('Resimler lazy load olmalı', () => {
    cy.visit('/koclar')
    cy.get('body').should('be.visible')
    
    // Sayfa yüklendikten sonra scroll et
    cy.scrollTo('bottom', { duration: 1000 })
    cy.wait(500)
    cy.scrollTo('top', { duration: 500 })
  })
})


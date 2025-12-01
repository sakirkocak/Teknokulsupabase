describe('Responsive Tasarım Testleri', () => {
  const viewports = [
    { name: 'iPhone X', width: 375, height: 812 },
    { name: 'iPad', width: 768, height: 1024 },
    { name: 'MacBook', width: 1280, height: 800 },
    { name: 'Desktop', width: 1920, height: 1080 },
  ]

  const pages = ['/', '/giris', '/kayit', '/koclar', '/materyaller']

  viewports.forEach(viewport => {
    describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      beforeEach(() => {
        cy.viewport(viewport.width, viewport.height)
      })

      pages.forEach(page => {
        it(`${page} sayfası düzgün görünmeli`, () => {
          cy.visit(page)
          cy.get('body').should('be.visible')
          
          // Yatay scroll olmamalı
          cy.document().then(doc => {
            const body = doc.body
            const html = doc.documentElement
            expect(body.scrollWidth).to.be.at.most(viewport.width + 20)
          })
        })
      })
    })
  })
})


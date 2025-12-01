describe('Ana Sayfa Testleri', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('Ana sayfa yüklenmeli', () => {
    cy.get('body').should('be.visible')
    cy.contains('Teknokul').should('be.visible')
  })

  it('Logo görünmeli', () => {
    cy.get('a').contains('Teknokul').should('be.visible')
  })

  it('Giriş ve Kayıt butonları görünmeli', () => {
    cy.contains('Giriş Yap').should('be.visible')
    cy.contains('Kayıt Ol').should('be.visible')
  })

  it('Giriş sayfasına gidebilmeli', () => {
    cy.contains('Giriş Yap').click()
    cy.url().should('include', '/giris')
  })

  it('Kayıt sayfasına gidebilmeli', () => {
    cy.contains('Kayıt Ol').click()
    cy.url().should('include', '/kayit')
  })

  it('Koçlar sayfasına gidebilmeli', () => {
    cy.contains('Koç Bul').click()
    cy.url().should('include', '/koclar')
  })
})


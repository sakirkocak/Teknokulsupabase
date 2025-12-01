describe('Kimlik Doğrulama Testleri', () => {
  
  describe('Giriş Sayfası', () => {
    beforeEach(() => {
      cy.visit('/giris')
    })

    it('Giriş formu görünmeli', () => {
      cy.get('input[type="email"]').should('be.visible')
      cy.get('input[type="password"]').should('be.visible')
      cy.get('button[type="submit"]').should('be.visible')
    })

    it('Boş form gönderilememeli', () => {
      cy.get('button[type="submit"]').click()
      // HTML5 validation ile form gönderilmez
      cy.url().should('include', '/giris')
    })

    it('Yanlış bilgilerle hata göstermeli', () => {
      cy.get('input[type="email"]').type('yanlis@email.com')
      cy.get('input[type="password"]').type('yanlisparola')
      cy.get('button[type="submit"]').click()
      // Hata mesajı veya aynı sayfada kalma
      cy.url().should('include', '/giris')
    })

    it('Kayıt sayfasına link çalışmalı', () => {
      cy.contains('Hesabınız yok mu').parent().contains('Kayıt ol').click()
      cy.url().should('include', '/kayit')
    })
  })

  describe('Kayıt Sayfası', () => {
    beforeEach(() => {
      cy.visit('/kayit')
    })

    it('Kayıt formu görünmeli', () => {
      cy.get('input[type="text"]').should('be.visible') // Ad Soyad
      cy.get('input[type="email"]').should('be.visible')
      cy.get('input[type="password"]').should('be.visible')
    })

    it('Rol seçenekleri görünmeli', () => {
      cy.contains('Öğrenci').should('be.visible')
      cy.contains('Öğretmen').should('be.visible')
      cy.contains('Veli').should('be.visible')
    })

    it('Giriş sayfasına link çalışmalı', () => {
      cy.contains('Zaten hesabınız var mı').parent().contains('Giriş yap').click()
      cy.url().should('include', '/giris')
    })
  })
})


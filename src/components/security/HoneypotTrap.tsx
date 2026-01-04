'use client'

/**
 * Honeypot Tuzak Bileşeni
 * 
 * Bu bileşen görünmez linkler içerir. Normal kullanıcılar bunları göremez,
 * ancak botlar HTML'i parse ederken bu linkleri bulup takip eder.
 * 
 * Kullanım: Soru bankası ve liste sayfalarına ekleyin.
 */

export function HoneypotTrap() {
  return (
    <>
      {/* CSS ile tamamen gizli - sadece botlar görür */}
      <div 
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          opacity: 0,
          pointerEvents: 'none',
          visibility: 'hidden'
        }}
      >
        {/* Sahte soru linkleri - botları tuzağa çeker */}
        <a href="/api/internal/trap" tabIndex={-1}>Tüm Sorular</a>
        <a href="/api/internal/trap?export=all" tabIndex={-1}>Soruları İndir</a>
        <a href="/api/internal/trap?page=999" tabIndex={-1}>Sonraki Sayfa</a>
        <a href="/api/questions/export" tabIndex={-1}>Export Questions</a>
        <a href="/api/v1/questions/all" tabIndex={-1}>API v1</a>
        
        {/* Sahte form - botlar doldurmaya çalışır */}
        <form action="/api/internal/trap" method="POST">
          <input type="text" name="email" autoComplete="off" />
          <input type="text" name="password" autoComplete="off" />
          <button type="submit">Gönder</button>
        </form>
      </div>
      
      {/* display:none ile gizli - bazı botlar bunu da bulur */}
      <nav style={{ display: 'none' }} aria-hidden="true">
        <a href="/api/internal/trap?source=nav">Gizli Sayfa</a>
        <a href="/sorular/gizli">Tüm Sorular Listesi</a>
      </nav>
    </>
  )
}

/**
 * Honeypot Input - Form tuzağı
 * Botlar bu gizli inputları doldurur, gerçek kullanıcılar görmez
 */
export function HoneypotInput({ name = 'website' }: { name?: string }) {
  return (
    <input
      type="text"
      name={name}
      autoComplete="off"
      tabIndex={-1}
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: '-9999px',
        width: '1px',
        height: '1px',
        opacity: 0,
        overflow: 'hidden'
      }}
    />
  )
}

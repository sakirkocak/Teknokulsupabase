/**
 * Next.js Instrumentation
 * 
 * Bu dosya Next.js sunucusu başlatılırken çalışır.
 * Deprecation uyarılarını bastırmak için kullanılır.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Node.js deprecation uyarılarını bastır
  // DEP0169: url.parse() - Typesense/Supabase kütüphanelerinden geliyor
  // Bu kütüphaneler güncellendiğinde bu satır kaldırılabilir
  if (process.env.NODE_ENV === 'production') {
    // Sadece production'da bastır - development'ta görmek isteyebiliriz
    process.removeAllListeners('warning')
    
    process.on('warning', (warning) => {
      // DEP0169 (url.parse) uyarısını sessizce atla
      if (warning.name === 'DeprecationWarning' && 
          (warning as any).code === 'DEP0169') {
        return // Bastır
      }
      // Diğer uyarıları normal şekilde logla
      console.warn(warning)
    })
  }
}

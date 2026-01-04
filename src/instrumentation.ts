/**
 * Next.js Instrumentation
 * 
 * Bu dosya Next.js sunucusu başlatılırken çalışır.
 * Deprecation uyarılarını bastırmak için kullanılır.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Sadece Node.js runtime'da çalış (Edge runtime'da process.removeAllListeners yok)
  if (typeof process !== 'undefined' && 
      typeof process.removeAllListeners === 'function' &&
      process.env.NODE_ENV === 'production') {
    
    // Node.js deprecation uyarılarını bastır
    // DEP0169: url.parse() - Typesense/Supabase kütüphanelerinden geliyor
    try {
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
    } catch {
      // Edge runtime'da hata verirse sessizce geç
    }
  }
}

/**
 * Resim URL Optimizasyonu
 * Supabase Storage resimlerini transform ederek küçük boyutlu indir
 */

/**
 * Avatar URL'sini optimize et
 * Supabase Storage transform API kullanarak küçük boyutlu resim iste
 * @param url - Orijinal avatar URL'si
 * @param size - İstenen boyut (default: 100px)
 * @returns Optimize edilmiş URL
 */
export function getOptimizedAvatarUrl(url: string | null | undefined, size: number = 100): string | null {
  if (!url) return null
  
  // Supabase Storage URL'si mi kontrol et
  if (url.includes('supabase.co/storage')) {
    // Zaten transform parametresi varsa değiştirme
    if (url.includes('?') && (url.includes('width=') || url.includes('height='))) {
      return url
    }
    
    // Transform parametreleri ekle
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}width=${size}&height=${size}&resize=cover&quality=80`
  }
  
  // Diğer URL'ler için olduğu gibi döndür
  return url
}

/**
 * Genel resim URL optimizasyonu
 * @param url - Orijinal resim URL'si
 * @param width - İstenen genişlik
 * @param height - İstenen yükseklik (opsiyonel)
 * @param quality - Kalite (0-100, default: 80)
 */
export function getOptimizedImageUrl(
  url: string | null | undefined, 
  width: number, 
  height?: number,
  quality: number = 80
): string | null {
  if (!url) return null
  
  // Supabase Storage URL'si mi kontrol et
  if (url.includes('supabase.co/storage')) {
    // Zaten transform parametresi varsa değiştirme
    if (url.includes('?') && url.includes('width=')) {
      return url
    }
    
    const separator = url.includes('?') ? '&' : '?'
    let params = `width=${width}&quality=${quality}`
    if (height) {
      params += `&height=${height}&resize=cover`
    }
    return `${url}${separator}${params}`
  }
  
  return url
}

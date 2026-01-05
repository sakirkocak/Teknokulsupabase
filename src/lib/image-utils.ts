/**
 * Resim URL Optimizasyonu
 * Supabase Storage resimlerini transform ederek küçük boyutlu indir
 */

/**
 * Avatar URL'sini optimize et
 * Supabase Storage transform API kullanarak küçük boyutlu resim iste
 * 
 * ÖNEMLİ: Supabase transform API için URL formatı:
 * /storage/v1/object/public/ → /storage/v1/render/image/public/
 * 
 * @param url - Orijinal avatar URL'si
 * @param size - İstenen boyut (default: 100px)
 * @returns Optimize edilmiş URL
 */
export function getOptimizedAvatarUrl(url: string | null | undefined, size: number = 100): string | null {
  if (!url) return null
  
  // Supabase Storage URL'si mi kontrol et
  if (url.includes('supabase.co/storage')) {
    // Zaten render/image URL'si ise sadece parametreleri güncelle
    if (url.includes('/render/image/')) {
      if (url.includes('width=')) return url
      const separator = url.includes('?') ? '&' : '?'
      return `${url}${separator}width=${size}&height=${size}&resize=cover&quality=75`
    }
    
    // /object/public/ → /render/image/public/ dönüşümü yap
    // Bu Supabase'in image transform API'sini aktifleştirir
    let transformUrl = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
    
    // Transform parametreleri ekle
    const separator = transformUrl.includes('?') ? '&' : '?'
    return `${transformUrl}${separator}width=${size}&height=${size}&resize=cover&quality=75`
  }
  
  // Diğer URL'ler için olduğu gibi döndür
  return url
}

/**
 * Genel resim URL optimizasyonu
 * @param url - Orijinal resim URL'si
 * @param width - İstenen genişlik
 * @param height - İstenen yükseklik (opsiyonel)
 * @param quality - Kalite (0-100, default: 75)
 */
export function getOptimizedImageUrl(
  url: string | null | undefined, 
  width: number, 
  height?: number,
  quality: number = 75
): string | null {
  if (!url) return null
  
  // Supabase Storage URL'si mi kontrol et
  if (url.includes('supabase.co/storage')) {
    // Zaten render/image URL'si ise
    if (url.includes('/render/image/') && url.includes('width=')) {
      return url
    }
    
    // /object/public/ → /render/image/public/ dönüşümü
    let transformUrl = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
    
    const separator = transformUrl.includes('?') ? '&' : '?'
    let params = `width=${width}&quality=${quality}`
    if (height) {
      params += `&height=${height}&resize=cover`
    }
    return `${transformUrl}${separator}${params}`
  }
  
  return url
}

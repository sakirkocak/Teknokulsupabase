/**
 * Client-side görsel sıkıştırma utility'si
 * Canvas API kullanarak görselleri yüklemeden önce sıkıştırır
 */

interface CompressOptions {
  maxWidth?: number      // Maksimum genişlik (px)
  maxHeight?: number     // Maksimum yükseklik (px)
  quality?: number       // JPEG kalitesi (0-1 arası, default: 0.7)
  maxSizeMB?: number     // Maksimum dosya boyutu (MB)
}

const defaultOptions: CompressOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.7,
  maxSizeMB: 1
}

/**
 * Görseli sıkıştırır ve Blob olarak döndürür
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<{ blob: Blob; originalSize: number; compressedSize: number }> {
  const opts = { ...defaultOptions, ...options }
  const originalSize = file.size

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (event) => {
      const img = new Image()
      
      img.onload = () => {
        // Boyut hesaplama
        let { width, height } = img
        const maxWidth = opts.maxWidth!
        const maxHeight = opts.maxHeight!

        // Oranı koruyarak boyutlandır
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        // Canvas oluştur
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas context oluşturulamadı'))
          return
        }

        // Görseli canvas'a çiz
        ctx.drawImage(img, 0, 0, width, height)

        // Sıkıştırılmış görsel oluştur
        let quality = opts.quality!
        
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Görsel sıkıştırılamadı'))
                return
              }

              const maxSizeBytes = opts.maxSizeMB! * 1024 * 1024

              // Eğer hala çok büyükse ve kalite düşürülebiliyorsa tekrar dene
              if (blob.size > maxSizeBytes && quality > 0.3) {
                quality -= 0.1
                tryCompress()
                return
              }

              resolve({
                blob,
                originalSize,
                compressedSize: blob.size
              })
            },
            'image/jpeg',
            quality
          )
        }

        tryCompress()
      }

      img.onerror = () => {
        reject(new Error('Görsel yüklenemedi'))
      }

      img.src = event.target?.result as string
    }

    reader.onerror = () => {
      reject(new Error('Dosya okunamadı'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Birden fazla görseli sıkıştırır
 */
export async function compressImages(
  files: File[],
  options: CompressOptions = {}
): Promise<{ blobs: Blob[]; totalOriginalSize: number; totalCompressedSize: number }> {
  const results = await Promise.all(
    files.map(file => compressImage(file, options))
  )

  return {
    blobs: results.map(r => r.blob),
    totalOriginalSize: results.reduce((sum, r) => sum + r.originalSize, 0),
    totalCompressedSize: results.reduce((sum, r) => sum + r.compressedSize, 0)
  }
}

/**
 * Dosya boyutunu okunabilir formata çevirir
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

/**
 * Sıkıştırma oranını hesaplar
 */
export function calculateCompressionRatio(original: number, compressed: number): number {
  if (original === 0) return 0
  return Math.round((1 - compressed / original) * 100)
}


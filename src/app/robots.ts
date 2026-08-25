import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

/**
 * robots.txt - tek kaynak.
 *
 * NOT: Eskiden public/robots.txt bu dosyayi golgeliyordu (Next.js'te statik
 * dosya kazanir) ve icindeki adres www.teknokul.com.tr'yi gosteriyordu.
 * Statik dosya silindi; kurallar burada birlestirildi.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_URL

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/_next/',
          '/(dashboard)/',
          '/admin/',
          '/koc/',
          '/ogrenci/',
          '/ogretmen/',
          '/veli/',
          '/auth/',
          '/giris',
          '/kayit',
          '/sifre-sifirla',
        ],
        crawlDelay: 1,
      },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap-soru-bankasi.xml`,
    ],
    host: baseUrl,
  }
}

import { NextResponse } from 'next/server'

/**
 * Sitemap Index Route Handler
 * 
 * Next.js'in generateSitemaps() ile otomatik sitemap index oluşturması
 * bazen çalışmıyor. Bu route handler manuel olarak sitemap index döndürür.
 * 
 * Sitemap yapısı:
 * - /sitemap.xml → Bu dosya (sitemap index)
 * - /sitemap/0.xml → Statik sayfalar + ders/sınıf sayfaları + koçlar + PDF bankalar
 * - /sitemap/1.xml → İndeksli soru sayfaları
 */

export async function GET() {
  const baseUrl = 'https://www.teknokul.com.tr'
  
  // Sitemap index XML oluştur
  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap/0.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap/1.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
</sitemapindex>`

  return new NextResponse(sitemapIndex, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=43200',
    },
  })
}

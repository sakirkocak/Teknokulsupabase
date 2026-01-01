/**
 * Soru Bankası Sitemap
 * /sitemap-soru-bankasi.xml
 * 
 * Google'ın soru bankalarını indexlemesi için
 */

import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  
  // Public bankaları getir
  const { data: banks } = await supabase
    .from('question_banks')
    .select('slug, created_at, updated_at')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(1000)  // Max 1000 URL per sitemap
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://teknokul.com.tr'
  
  interface SitemapUrl {
    loc: string
    lastmod?: string
    changefreq: string
    priority: number
  }

  const urls: SitemapUrl[] = [
    // Ana sayfalar
    {
      loc: `${baseUrl}/soru-bankasi/olustur`,
      changefreq: 'daily',
      priority: 0.9
    },
    {
      loc: `${baseUrl}/soru-bankasi/kesif`,
      changefreq: 'hourly',
      priority: 0.8
    },
    // Tüm soru bankaları
    ...(banks || []).map((bank: any) => ({
      loc: `${baseUrl}/soru-bankasi/${bank.slug}`,
      lastmod: bank.updated_at || bank.created_at,
      changefreq: 'monthly',
      priority: 0.7
    }))
  ]
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${new Date(url.lastmod).toISOString().split('T')[0]}</lastmod>` : ''}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`
  
  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  })
}

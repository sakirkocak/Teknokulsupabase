export const dynamic = 'force-dynamic'

export async function GET() {
  const baseUrl = 'https://www.teknokul.com.tr'

  const sitemapUrls = [
    `${baseUrl}/sitemap/0.xml`,
    `${baseUrl}/sitemap/1.xml`,
    `${baseUrl}/sitemap-soru-bankasi.xml`,
  ]

  const today = new Date().toISOString().split('T')[0]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls
  .map(
    (loc) => `  <sitemap>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`
  )
  .join('\n')}
</sitemapindex>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}


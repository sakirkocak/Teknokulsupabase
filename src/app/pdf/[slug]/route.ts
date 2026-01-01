/**
 * PDF Proxy Route
 * /pdf/[slug].pdf → Supabase Storage'dan PDF döndür
 * 
 * Bu sayede URL'ler teknokul.com.tr/pdf/... şeklinde görünür
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    let slug = params.slug
    
    // .pdf uzantısını kaldır (varsa)
    if (slug.endsWith('.pdf')) {
      slug = slug.slice(0, -4)
    }
    
    console.log(`📄 PDF request: ${slug}`)
    
    // Storage'dan PDF'i indir
    const fileName = `${slug}.pdf`
    const { data, error } = await supabase.storage
      .from('question-bank-pdfs')
      .download(fileName)
    
    if (error || !data) {
      console.error('PDF not found:', error)
      return NextResponse.json(
        { error: 'PDF bulunamadı' },
        { status: 404 }
      )
    }
    
    // PDF'i buffer'a çevir
    const buffer = Buffer.from(await data.arrayBuffer())
    
    // Response headers
    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    headers.set('Content-Disposition', `inline; filename="${fileName}"`)
    headers.set('Content-Length', buffer.length.toString())
    // Cache 1 gün
    headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400')
    
    return new NextResponse(buffer, {
      status: 200,
      headers
    })
    
  } catch (error: any) {
    console.error('PDF proxy error:', error)
    return NextResponse.json(
      { error: 'PDF yüklenemedi' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service role client - Storage için RLS bypass
const getServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const pdfFile = formData.get('pdf') as File
    const bankId = formData.get('bankId') as string
    const slug = formData.get('slug') as string
    
    if (!pdfFile || !bankId || !slug) {
      return NextResponse.json({ error: 'PDF, bankId ve slug gerekli' }, { status: 400 })
    }
    
    const supabase = getServiceClient()
    
    // PDF'i buffer'a çevir
    const arrayBuffer = await pdfFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Dosya adı
    const fileName = `${slug}.pdf`
    
    // Supabase Storage'a yükle
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('question-bank-pdfs')
      .upload(fileName, buffer, {
        contentType: 'application/pdf',
        upsert: true // Varsa üzerine yaz
      })
    
    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'PDF yüklenemedi' }, { status: 500 })
    }
    
    // Public URL al
    const { data: urlData } = supabase.storage
      .from('question-bank-pdfs')
      .getPublicUrl(fileName)
    
    const pdfUrl = urlData.publicUrl
    const pdfSizeKb = Math.round(buffer.length / 1024)
    
    // question_banks tablosunu güncelle
    const { error: updateError } = await supabase
      .from('question_banks')
      .update({ 
        pdf_url: pdfUrl,
        pdf_size_kb: pdfSizeKb
      })
      .eq('id', bankId)
    
    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Veritabanı güncellenemedi' }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      pdfUrl,
      pdfSizeKb
    })
    
  } catch (error: any) {
    console.error('Upload PDF error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

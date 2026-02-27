import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Sadece admin' }, { status: 403 })
    }

    const { dataUrl, fileName } = await request.json()

    if (!dataUrl || !fileName) {
      return NextResponse.json({ error: 'dataUrl ve fileName zorunlu' }, { status: 400 })
    }

    // base64 → Buffer
    const matches = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/)
    if (!matches) {
      return NextResponse.json({ error: 'Geçersiz dataUrl formatı' }, { status: 400 })
    }

    const mimeType = matches[1]
    const base64Data = matches[2]
    const buffer = Buffer.from(base64Data, 'base64')

    const { error: uploadError } = await supabase.storage
      .from('publisher-images')
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: true,
      })

    if (uploadError) {
      throw uploadError
    }

    const { data: { publicUrl } } = supabase.storage
      .from('publisher-images')
      .getPublicUrl(fileName)

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error('Upload image error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Yükleme hatası' },
      { status: 500 }
    )
  }
}

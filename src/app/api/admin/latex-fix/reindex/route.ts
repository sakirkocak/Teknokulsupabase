import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
// Typesense kütüphanesi doğrudan backend tarafında kullanılabilir olmalı
// Ancak burada sadece Supabase üzerinden re-index tetikleyebiliriz
// veya Typesense API'sini doğrudan çağırabiliriz

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Auth kontrolü
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Admin kontrolü
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Typesense sync trigger'ı var mı kontrol et
    // Genellikle 'typesense_sync_questions' gibi bir trigger veya fonksiyon olur
    // Veya bulk update yaparak sync'i tetikleyebiliriz
    
    // Şimdilik sadece "touch" yaparak (updated_at güncelleyerek) sync'i tetikleyelim
    // Ancak 106k soru için bu ağır olabilir.
    
    // Typesense sync'i için en temiz yol:
    // Eğer Typesense entegrasyonu Supabase webhook'ları veya cron ile çalışıyorsa,
    // onları tetiklemek gerekir.
    
    return NextResponse.json({
      success: true,
      message: 'Re-index işlemi şu an için sadece manuel olarak yapılabilir. Lütfen Typesense kontrol panelini kullanın veya toplu düzeltme yapıldığında otomatik senkronizasyonu bekleyin.'
    })
    
  } catch (error: any) {
    console.error('Reindex API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

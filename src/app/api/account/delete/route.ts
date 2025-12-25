import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Admin client (service role) - sadece server-side'da kullanılacak
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    
    // Kullanıcı oturumunu doğrula
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      )
    }

    const { confirmation } = await request.json()
    
    // Onay kontrolü
    if (confirmation !== 'HESABIMI SIL') {
      return NextResponse.json(
        { error: 'Lütfen onay metnini doğru girin' },
        { status: 400 }
      )
    }

    const userId = user.id

    // 1. Storage'daki dosyaları sil (avatar vb.)
    try {
      const { data: files } = await supabaseAdmin.storage
        .from('avatars')
        .list(userId)
      
      if (files && files.length > 0) {
        const filePaths = files.map(file => `${userId}/${file.name}`)
        await supabaseAdmin.storage.from('avatars').remove(filePaths)
      }
    } catch (storageError) {
      // Storage hatası kritik değil, devam et
      console.warn('Storage silme hatası:', storageError)
    }

    // 2. Auth kullanıcısını sil (ON DELETE CASCADE ile profiles ve alt tablolar otomatik silinecek)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Hesap silme hatası:', deleteError)
      return NextResponse.json(
        { error: 'Hesap silinirken bir hata oluştu' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Hesabınız başarıyla silindi' 
    })

  } catch (error) {
    console.error('Hesap silme hatası:', error)
    return NextResponse.json(
      { error: 'Beklenmeyen bir hata oluştu' },
      { status: 500 }
    )
  }
}


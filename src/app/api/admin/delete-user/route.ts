import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Supabase Admin Client (service role key ile)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function DELETE(request: NextRequest) {
  try {
    // Auth kontrolü - sadece admin silebilir
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin mi kontrol et
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Sadece adminler kullanıcı silebilir' }, { status: 403 })
    }

    // Silinecek kullanıcı ID'si
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId gerekli' }, { status: 400 })
    }

    // Kendini silmeye çalışıyor mu?
    if (userId === user.id) {
      return NextResponse.json({ error: 'Kendinizi silemezsiniz' }, { status: 400 })
    }

    // Silinecek kullanıcının admin olup olmadığını kontrol et
    const { data: targetUser } = await supabaseAdmin
      .from('profiles')
      .select('role, full_name')
      .eq('id', userId)
      .single()

    if (targetUser?.role === 'admin') {
      return NextResponse.json({ error: 'Admin kullanıcıları silemezsiniz' }, { status: 403 })
    }

    // 1. İlişkili tabloları temizle (Admin client ile RLS bypass)
    await supabaseAdmin.from('student_profiles').delete().eq('user_id', userId)
    await supabaseAdmin.from('teacher_profiles').delete().eq('user_id', userId)
    await supabaseAdmin.from('parent_profiles').delete().eq('user_id', userId)
    await supabaseAdmin.from('notifications').delete().eq('user_id', userId)
    await supabaseAdmin.from('messages').delete().eq('sender_id', userId)
    await supabaseAdmin.from('messages').delete().eq('receiver_id', userId)
    
    // Student points ve ilgili veriler
    const { data: studentProfile } = await supabaseAdmin
      .from('student_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()
    
    if (studentProfile) {
      await supabaseAdmin.from('student_points').delete().eq('student_id', studentProfile.id)
      await supabaseAdmin.from('student_badges').delete().eq('student_id', studentProfile.id)
      await supabaseAdmin.from('activity_logs').delete().eq('student_id', studentProfile.id)
    }

    // 2. Profiles tablosundan sil
    const { error: deleteProfileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (deleteProfileError) {
      console.error('Profil silme hatası:', deleteProfileError)
      return NextResponse.json({ error: 'Profil silinemedi: ' + deleteProfileError.message }, { status: 500 })
    }

    // 3. Auth'dan da sil (Supabase Admin API)
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteAuthError) {
      console.error('Auth silme hatası:', deleteAuthError)
      // Auth silinmese bile profil silindi, devam et
    }

    return NextResponse.json({ 
      success: true, 
      message: `${targetUser?.full_name || 'Kullanıcı'} başarıyla silindi` 
    })

  } catch (error: any) {
    console.error('Kullanıcı silme hatası:', error)
    return NextResponse.json({ error: 'Sunucu hatası: ' + error.message }, { status: 500 })
  }
}


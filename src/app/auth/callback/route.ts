import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  
  // Kayıt sayfasından gelen rol ve sınıf bilgisi
  const roleParam = searchParams.get('role') as 'ogrenci' | 'ogretmen' | 'veli' | null
  const gradeParam = searchParams.get('grade')

  // Hata varsa login sayfasına yönlendir
  if (error) {
    console.error('OAuth hatası:', error, error_description)
    return NextResponse.redirect(`${origin}/giris?error=${encodeURIComponent(error_description || error)}`)
  }

  if (code) {
    const supabase = await createClient()
    
    // Code'u session'a dönüştür
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Session exchange hatası:', exchangeError)
      return NextResponse.redirect(`${origin}/giris?error=${encodeURIComponent(exchangeError.message)}`)
    }

    if (data.user) {
      // Kullanıcının profili var mı kontrol et
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      // Profil yoksa oluştur (ilk kez Google ile giriş yapan kullanıcı)
      if (!profile) {
        // Kayıt sayfasından gelen rol veya varsayılan olarak öğrenci
        const userRole = roleParam || 'ogrenci'
        const userGrade = gradeParam ? parseInt(gradeParam) : 8

        // Yeni kullanıcı için profil oluştur
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0],
            avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture,
            role: userRole,
          })

        if (insertError && !insertError.message.includes('duplicate')) {
          console.error('Profil oluşturma hatası:', insertError)
        }

        // Role göre ek profil oluştur
        if (userRole === 'ogrenci') {
          const { error: studentError } = await supabase
            .from('student_profiles')
            .insert({
              user_id: data.user.id,
              grade: userGrade,
              trust_level: 'new',
            })

          if (studentError && !studentError.message.includes('duplicate')) {
            console.error('Öğrenci profili oluşturma hatası:', studentError)
          }

          // Yeni öğrenciyi profil tamamlama sayfasına yönlendir (Google kayıt izleme için parametre)
          return NextResponse.redirect(`${origin}/ogrenci/profil?welcome=true&google_signup=ogrenci`)
        } else if (userRole === 'ogretmen') {
          const { error: teacherError } = await supabase
            .from('teacher_profiles')
            .insert({
              user_id: data.user.id,
              is_coach: true,
            })

          if (teacherError && !teacherError.message.includes('duplicate')) {
            console.error('Öğretmen profili oluşturma hatası:', teacherError)
          }

          return NextResponse.redirect(`${origin}/koc/profil?welcome=true&google_signup=ogretmen`)
        } else if (userRole === 'veli') {
          const { error: parentError } = await supabase
            .from('parent_profiles')
            .insert({
              user_id: data.user.id,
            })

          if (parentError && !parentError.message.includes('duplicate')) {
            console.error('Veli profili oluşturma hatası:', parentError)
          }

          return NextResponse.redirect(`${origin}/veli?welcome=true&google_signup=veli`)
        }
      }

      // Mevcut kullanıcıyı rolüne göre yönlendir (Google giriş izleme için parametre)
      const routes: Record<string, string> = {
        ogretmen: '/koc',
        ogrenci: '/ogrenci',
        veli: '/veli',
        admin: '/admin',
      }

      const redirectPath = profile?.role ? routes[profile.role] : next
      const separator = redirectPath?.includes('?') ? '&' : '?'
      return NextResponse.redirect(`${origin}${redirectPath || '/'}${separator}google_login=true`)
    }
  }

  // Hata durumunda login sayfasına yönlendir
  return NextResponse.redirect(`${origin}/giris?error=Giriş yapılamadı`)
}


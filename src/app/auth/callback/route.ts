import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

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
        // Yeni kullanıcı için profil oluştur
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0],
            avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture,
            role: 'ogrenci', // Varsayılan rol
          })

        if (insertError && !insertError.message.includes('duplicate')) {
          console.error('Profil oluşturma hatası:', insertError)
        }

        // Öğrenci profili de oluştur
        const { error: studentError } = await supabase
          .from('student_profiles')
          .insert({
            user_id: data.user.id,
            grade: 8, // Varsayılan sınıf
          })

        if (studentError && !studentError.message.includes('duplicate')) {
          console.error('Öğrenci profili oluşturma hatası:', studentError)
        }

        // Yeni kullanıcıyı profil tamamlama sayfasına yönlendir
        return NextResponse.redirect(`${origin}/ogrenci/profil?welcome=true`)
      }

      // Mevcut kullanıcıyı rolüne göre yönlendir
      const routes: Record<string, string> = {
        ogretmen: '/koc',
        ogrenci: '/ogrenci',
        veli: '/veli',
        admin: '/admin',
      }

      const redirectPath = routes[profile.role] || next
      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
  }

  // Hata durumunda login sayfasına yönlendir
  return NextResponse.redirect(`${origin}/giris?error=Giriş yapılamadı`)
}


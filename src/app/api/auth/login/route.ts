import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, logSuspiciousActivity } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // IP adresini al
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || request.headers.get('x-real-ip') 
      || 'unknown'

    // Rate limiting - giriş denemeleri için daha sıkı
    // 10 dakikada 5 deneme
    const rateLimit = checkRateLimit(`login_${ip}`, 5, 10 * 60 * 1000)
    
    if (!rateLimit.allowed) {
      logSuspiciousActivity({
        type: 'rate_limit',
        ip,
        email,
        details: `Login rate limit exceeded. Reset in ${Math.ceil(rateLimit.resetIn / 60000)} minutes`
      })
      
      return NextResponse.json(
        { 
          error: 'Çok fazla giriş denemesi. Lütfen 10 dakika sonra tekrar deneyin.',
          resetIn: rateLimit.resetIn 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(rateLimit.resetIn / 1000).toString(),
          }
        }
      )
    }

    // Supabase ile giriş
    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Hatalı giriş denemesi
      logSuspiciousActivity({
        type: 'suspicious_pattern',
        ip,
        email,
        details: `Failed login attempt: ${error.message}`
      })
      
      return NextResponse.json(
        { error: 'E-posta veya şifre hatalı' },
        { status: 401 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Giriş yapılamadı' },
        { status: 401 }
      )
    }

    // Kullanıcının rolünü al
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    // Yönlendirme URL'si
    const routes: Record<string, string> = {
      admin: '/admin',
      ogretmen: '/koc',
      ogrenci: '/ogrenci',
      veli: '/veli',
    }

    return NextResponse.json({
      success: true,
      redirectTo: routes[profile?.role || 'ogrenci'] || '/ogrenci',
      user: {
        id: data.user.id,
        email: data.user.email,
        role: profile?.role
      }
    })

  } catch (error: any) {
    console.error('Giriş hatası:', error)
    return NextResponse.json(
      { error: error.message || 'Giriş sırasında bir hata oluştu' },
      { status: 500 }
    )
  }
}


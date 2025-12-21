import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { 
  validateEmail, 
  isHoneypotTriggered, 
  isSubmissionTooFast,
  checkRateLimit,
  logSuspiciousActivity,
  calculateSecurityScore
} from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      email, 
      password, 
      fullName, 
      role, 
      grade,
      honeypot, // Honeypot field
      formLoadTime, // Form yüklenme zamanı
      captchaToken // reCAPTCHA token (opsiyonel)
    } = body

    // IP adresini al
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || request.headers.get('x-real-ip') 
      || 'unknown'
    
    const userAgent = request.headers.get('user-agent') || ''

    // 1. HONEYPOT KONTROLÜ (Bot tespiti)
    if (isHoneypotTriggered(honeypot)) {
      logSuspiciousActivity({
        type: 'honeypot',
        ip,
        email,
        details: `Honeypot triggered with value: ${honeypot}`
      })
      
      // Bot'a başarılı gibi görünsün ama işlem yapma
      return NextResponse.json(
        { success: true, message: 'Kayıt başarılı' },
        { status: 200 }
      )
    }

    // 2. RATE LIMITING
    const rateLimit = checkRateLimit(ip, 5, 60 * 60 * 1000) // Saatte 5 kayıt
    
    if (!rateLimit.allowed) {
      logSuspiciousActivity({
        type: 'rate_limit',
        ip,
        email,
        details: `Rate limit exceeded. Reset in ${Math.ceil(rateLimit.resetIn / 60000)} minutes`
      })
      
      return NextResponse.json(
        { 
          error: 'Çok fazla kayıt denemesi. Lütfen bir saat sonra tekrar deneyin.',
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

    // 3. EMAIL DOĞRULAMA (Disposable email kontrolü)
    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      logSuspiciousActivity({
        type: 'disposable_email',
        ip,
        email,
        details: emailValidation.reason
      })
      
      return NextResponse.json(
        { error: emailValidation.reason },
        { status: 400 }
      )
    }

    // 4. HIZ KONTROLÜ (Çok hızlı form doldurma)
    if (formLoadTime && isSubmissionTooFast(formLoadTime, 3)) {
      logSuspiciousActivity({
        type: 'fast_submission',
        ip,
        email,
        details: `Form submitted too fast: ${(Date.now() - formLoadTime) / 1000}s`
      })
      
      // Yine de izin ver ama logla (edge case olabilir)
    }

    // 5. GÜVENLİK SKORU HESAPLA
    const securityScore = calculateSecurityScore({
      email,
      honeypotValue: honeypot,
      formLoadTime,
      userAgent
    })

    if (securityScore < 30) {
      logSuspiciousActivity({
        type: 'suspicious_pattern',
        ip,
        email,
        details: `Low security score: ${securityScore}`
      })
      
      return NextResponse.json(
        { error: 'Kayıt işlemi gerçekleştirilemedi. Lütfen daha sonra tekrar deneyin.' },
        { status: 403 }
      )
    }

    // 6. reCAPTCHA DOĞRULAMA (opsiyonel, token varsa)
    if (captchaToken && process.env.RECAPTCHA_SECRET_KEY) {
      const captchaValid = await verifyCaptcha(captchaToken)
      if (!captchaValid) {
        return NextResponse.json(
          { error: 'Güvenlik doğrulaması başarısız. Lütfen tekrar deneyin.' },
          { status: 400 }
        )
      }
    }

    // 7. SUPABASE KAYIT
    const supabase = await createClient()
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    })

    if (authError) {
      // Zaten kayıtlı kullanıcı
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.' },
          { status: 400 }
        )
      }
      throw authError
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Kullanıcı oluşturulamadı' },
        { status: 500 }
      )
    }

    // 8. PROFİL OLUŞTUR
    // Önce profil var mı kontrol et
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', authData.user.id)
      .single()

    if (!existingProfile) {
      await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: email,
          full_name: fullName,
          role: role,
        })
    }

    // 9. ROL BAZLI EK PROFİL
    if (role === 'ogrenci') {
      const { data: existingStudent } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', authData.user.id)
        .single()

      if (!existingStudent) {
        await supabase
          .from('student_profiles')
          .insert({ 
            user_id: authData.user.id,
            grade: grade || 8,
            trust_level: 'new' // Yeni hesap
          })
      }
    } else if (role === 'ogretmen') {
      const { data: existingTeacher } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', authData.user.id)
        .single()

      if (!existingTeacher) {
        await supabase
          .from('teacher_profiles')
          .insert({ user_id: authData.user.id, is_coach: true })
      }
    } else if (role === 'veli') {
      const { data: existingParent } = await supabase
        .from('parent_profiles')
        .select('id')
        .eq('user_id', authData.user.id)
        .single()

      if (!existingParent) {
        await supabase
          .from('parent_profiles')
          .insert({ user_id: authData.user.id })
      }
    }

    // Başarılı kayıt - yönlendirme URL'sini döndür
    const routes: Record<string, string> = {
      ogretmen: '/koc',
      ogrenci: '/ogrenci',
      veli: '/veli',
    }

    return NextResponse.json({
      success: true,
      redirectTo: routes[role] || '/',
      user: {
        id: authData.user.id,
        email: authData.user.email,
      }
    })

  } catch (error: any) {
    console.error('Kayıt hatası:', error)
    return NextResponse.json(
      { error: error.message || 'Kayıt sırasında bir hata oluştu' },
      { status: 500 }
    )
  }
}

// reCAPTCHA v3 doğrulama
async function verifyCaptcha(token: string): Promise<boolean> {
  if (!process.env.RECAPTCHA_SECRET_KEY) return true
  
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`
    })
    
    const data = await response.json()
    return data.success && data.score >= 0.5
  } catch (error) {
    console.error('reCAPTCHA doğrulama hatası:', error)
    return true // Hata durumunda geç
  }
}


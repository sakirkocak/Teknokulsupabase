import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Bot User-Agent imzaları (inline for Edge Runtime)
const BOT_SIGNATURES = [
  'headlesschrome', 'headless', 'phantomjs', 'selenium', 'webdriver', 'puppeteer', 'playwright',
  'python-requests', 'python-urllib', 'scrapy', 'beautifulsoup', 'httpx', 'aiohttp',
  'node-fetch', 'axios/', 'got/', 'superagent',
  'curl/', 'wget/', 'libwww', 'lwp-trivial',
  'semrush', 'ahref', 'mj12bot', 'dotbot', 'petalbot', 'bytespider',
]

const ALLOWED_BOTS = ['googlebot', 'bingbot', 'yandexbot', 'duckduckbot', 'slurp', 'facebot', 'twitterbot', 'linkedinbot', 'whatsapp', 'telegram']

// In-memory rate limit store (Edge Runtime uyumlu)
const rateLimitStore = new Map<string, { count: number; resetTime: number; blocked: boolean; blockedUntil?: number }>()

function checkBotUserAgent(ua: string | null): { isBot: boolean; blocked: boolean } {
  if (!ua) return { isBot: true, blocked: true }
  const lowerUA = ua.toLowerCase()
  
  // İzin verilen botlar
  for (const allowed of ALLOWED_BOTS) {
    if (lowerUA.includes(allowed)) return { isBot: true, blocked: false }
  }
  
  // Yasaklı botlar
  for (const bot of BOT_SIGNATURES) {
    if (lowerUA.includes(bot)) return { isBot: true, blocked: true }
  }
  
  return { isBot: false, blocked: false }
}

function getClientIP(request: NextRequest): string {
  return request.headers.get('cf-connecting-ip') || 
         request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         request.headers.get('x-real-ip') || 
         'unknown'
}

function checkRateLimit(key: string, maxRequests: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now()
  let entry = rateLimitStore.get(key)
  
  // Engelli mi?
  if (entry?.blocked && entry.blockedUntil && now < entry.blockedUntil) {
    return { allowed: false, remaining: 0 }
  }
  
  // Yeni pencere
  if (!entry || now > entry.resetTime) {
    entry = { count: 1, resetTime: now + windowMs, blocked: false }
    rateLimitStore.set(key, entry)
    return { allowed: true, remaining: maxRequests - 1 }
  }
  
  // Limit aşıldı mı?
  if (entry.count >= maxRequests) {
    entry.blocked = true
    entry.blockedUntil = now + 300000 // 5 dakika engel
    rateLimitStore.set(key, entry)
    return { allowed: false, remaining: 0 }
  }
  
  entry.count++
  rateLimitStore.set(key, entry)
  return { allowed: true, remaining: maxRequests - entry.count }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const userAgent = request.headers.get('user-agent')
  const clientIP = getClientIP(request)
  
  // 1. Bot kontrolü - Sadece API ve soru sayfaları için
  const isQuestionRoute = pathname.includes('/soru-bankasi') || 
                          pathname.includes('/api/search/questions') ||
                          pathname.includes('/api/questions')
  
  if (isQuestionRoute) {
    const botCheck = checkBotUserAgent(userAgent)
    
    if (botCheck.blocked) {
      return new NextResponse(
        JSON.stringify({ error: 'Erişim engellendi', code: 'BOT_DETECTED' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Rate limit - soru endpoint'leri için sıkı limit
    const rateLimitKey = `question:${clientIP}`
    const rateCheck = checkRateLimit(rateLimitKey, 30, 60000) // 1 dakikada 30 istek
    
    if (!rateCheck.allowed) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Çok fazla istek gönderdiniz. Lütfen bekleyin.', 
          code: 'RATE_LIMITED',
          retryAfter: 300
        }),
        { 
          status: 429, 
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': '300',
            'X-RateLimit-Remaining': '0'
          } 
        }
      )
    }
  }
  
  // 2. API rate limit - genel
  if (pathname.startsWith('/api/')) {
    const apiRateLimitKey = `api:${clientIP}`
    const apiRateCheck = checkRateLimit(apiRateLimitKey, 100, 60000) // 1 dakikada 100 istek
    
    if (!apiRateCheck.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Rate limit aşıldı', code: 'RATE_LIMITED' }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } }
      )
    }
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Admin-only rotalar (linki bilen bile erişemez)
  // Not: 404 döndürerek sayfanın varlığını da gizler.
  const adminOnlyPaths = ['/robot-senligi/sonuclar']
  const isAdminOnlyPath = adminOnlyPaths.some(path => pathname.startsWith(path))

  if (isAdminOnlyPath) {
    if (!user) {
      return new NextResponse('Not Found', { status: 404 })
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminProfile?.role !== 'admin') {
      return new NextResponse('Not Found', { status: 404 })
    }

    return response
  }

  // Public rotalar (korumasız)
  const publicPaths = ['/koclar', '/materyaller', '/koc-ol', '/sinav-takvimi']
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  // Auth sayfaları
  const authPaths = ['/giris', '/kayit']
  const isAuthPath = authPaths.some(path => pathname.startsWith(path))

  // Korumalı rotalar
  const protectedPaths = ['/koc', '/ogrenci', '/veli', '/admin']
  const isProtectedPath = !isPublicPath && protectedPaths.some(path => pathname.startsWith(path))

  // Korumalı sayfaya giriş yapmadan erişim
  if (isProtectedPath && !user) {
    return NextResponse.redirect(new URL('/giris', request.url))
  }

  // Giriş yapmış kullanıcı için rol kontrolü
  if (user && (isProtectedPath || isAuthPath)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_suspended, suspension_reason')
      .eq('id', user.id)
      .single()

    // Askıya alınmış kullanıcı kontrolü
    if (profile?.is_suspended) {
      // Sadece bilgilendirme sayfasına yönlendir
      if (!pathname.startsWith('/askiya-alindi')) {
        const suspendUrl = new URL('/askiya-alindi', request.url)
        suspendUrl.searchParams.set('reason', profile.suspension_reason || 'Şüpheli aktivite tespit edildi')
        return NextResponse.redirect(suspendUrl)
      }
      return response
    }

    if (profile) {
      const roleRoutes: Record<string, string> = {
        ogretmen: '/koc',
        ogrenci: '/ogrenci',
        veli: '/veli',
        admin: '/admin',
      }

      const userDashboard = roleRoutes[profile.role] || '/'

      // Auth sayfasına giriş yapmış kullanıcı erişirse
      if (isAuthPath) {
        return NextResponse.redirect(new URL(userDashboard, request.url))
      }

      // Admin sadece /admin'e erişebilir
      if (profile.role === 'admin' && !pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/admin', request.url))
      }

      // Koç sadece /koc'a erişebilir
      if (profile.role === 'ogretmen' && !pathname.startsWith('/koc')) {
        return NextResponse.redirect(new URL('/koc', request.url))
      }

      // Öğrenci sadece /ogrenci'ye erişebilir
      if (profile.role === 'ogrenci' && !pathname.startsWith('/ogrenci')) {
        return NextResponse.redirect(new URL('/ogrenci', request.url))
      }

      // Veli sadece /veli'ye erişebilir
      if (profile.role === 'veli' && !pathname.startsWith('/veli')) {
        return NextResponse.redirect(new URL('/veli', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

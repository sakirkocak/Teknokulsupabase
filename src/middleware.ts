import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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
  const pathname = request.nextUrl.pathname

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

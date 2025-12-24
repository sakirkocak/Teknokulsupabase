'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/useProfile'
import { getInitials } from '@/lib/utils'
import NotificationBell from './NotificationBell'
import { 
  GraduationCap, 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  MessageSquare, 
  Settings,
  LogOut,
  Menu,
  X,
  Brain,
  FileText,
  ChevronDown,
  TrendingUp,
  Target,
  Calendar,
  Send,
  Star,
  HelpCircle,
  BookOpen,
  Trophy,
  Award,
  Swords,
  UserCircle,
  Wand2,
  Volume2,
  Flag,
  Bot
} from 'lucide-react'

type NavItem = {
  label: string
  href: string
  icon: any
}

const navItems: Record<string, NavItem[]> = {
  koc: [
    { label: 'Dashboard', href: '/koc', icon: LayoutDashboard },
    { label: 'Öğrencilerim', href: '/koc/ogrenciler', icon: Users },
    { label: 'Sınıflarım', href: '/koc/siniflarim', icon: BookOpen },
    { label: 'Görevler', href: '/koc/gorevler', icon: ClipboardList },
    { label: 'Öğrenci Denemeleri', href: '/koc/ogrenci-denemeleri', icon: FileText },
    { label: 'Öğrenci Soruları', href: '/koc/ogrenci-sorulari', icon: HelpCircle },
    { label: 'Ödev Sonuçları', href: '/koc/odev-sonuclari', icon: Target },
    { label: 'Değerlendirmeler', href: '/koc/degerlendirmeler', icon: Star },
    { label: 'Kazançlar', href: '/koc/kazanclar', icon: TrendingUp },
    { label: 'Veli Raporları', href: '/koc/veli-raporlari', icon: Send },
    { label: 'Mesajlar', href: '/koc/mesajlar', icon: MessageSquare },
    { label: 'AI Araçları', href: '/koc/ai-araclar', icon: Brain },
    { label: 'Profil', href: '/koc/profil', icon: Settings },
  ],
  ogrenci: [
    { label: 'Dashboard', href: '/ogrenci', icon: LayoutDashboard },
    { label: 'Soru Bankası', href: '/ogrenci/soru-bankasi', icon: GraduationCap },
    { label: 'AI Koç', href: '/ogrenci/ai-koc', icon: Bot },
    { label: 'Başarımlarım', href: '/ogrenci/basarimlar', icon: Award },
    { label: 'Liderlik', href: '/ogrenci/liderlik', icon: Trophy },
    { label: 'Harf Öğrenme', href: '/ogrenci/harf-ogrenme', icon: Volume2 },
    { label: 'Koçum', href: '/ogrenci/kocum', icon: Target },
    { label: 'Sınıflarım', href: '/ogrenci/siniflarim', icon: BookOpen },
    { label: 'Düello', href: '/ogrenci/duello', icon: Swords },
    { label: 'Ödevlerim', href: '/ogrenci/odevler', icon: ClipboardList },
    { label: 'Görevlerim', href: '/ogrenci/gorevler', icon: Calendar },
    { label: 'Denemelerim', href: '/ogrenci/denemeler', icon: FileText },
    { label: 'İlerleme', href: '/ogrenci/ilerleme', icon: TrendingUp },
    { label: 'Değerlendirme', href: '/ogrenci/degerlendirme', icon: Star },
    { label: 'AI Araçları', href: '/ogrenci/ai-araclar', icon: Brain },
    { label: 'Mesajlar', href: '/ogrenci/mesajlar', icon: MessageSquare },
    { label: 'Profil', href: '/ogrenci/profil', icon: Settings },
  ],
  veli: [
    { label: 'Dashboard', href: '/veli', icon: LayoutDashboard },
    { label: 'Raporlar', href: '/veli/raporlar', icon: FileText },
    { label: 'Profil', href: '/veli/profil', icon: Settings },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Kullanıcılar', href: '/admin/kullanicilar', icon: Users },
    { label: 'Koçluklar', href: '/admin/kocluklar', icon: Target },
    { label: 'Soru Yönetimi', href: '/admin/soru-yonetimi', icon: BookOpen },
    { label: 'AI Soru Üretici', href: '/admin/ai-soru-uretici', icon: Wand2 },
    { label: 'Soru Bildirimleri', href: '/admin/soru-bildirimleri', icon: Flag },
    { label: 'Sınav Takvimi', href: '/admin/sinav-takvimi', icon: Calendar },
    { label: 'İçerikler', href: '/admin/icerikler', icon: ClipboardList },
    { label: 'Raporlar', href: '/admin/raporlar', icon: TrendingUp },
    { label: 'Ayarlar', href: '/admin/ayarlar', icon: Settings },
  ],
}

export default function DashboardLayout({ 
  children,
  role = 'ogrenci' 
}: { 
  children: React.ReactNode
  role?: 'koc' | 'ogrenci' | 'veli' | 'admin'
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { profile, loading } = useProfile()

  const items = navItems[role] || navItems.ogrenci

  // Sayfa değiştiğinde menüyü kapat
  useEffect(() => {
    setUserMenuOpen(false)
    setSidebarOpen(false)
  }, [pathname])

  // Dışarı tıklandığında menüyü kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    if (userMenuOpen) {
      // Biraz gecikmeyle ekle, böylece açılışta hemen kapanmaz
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 100)
      return () => {
        clearTimeout(timer)
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [userMenuOpen])

  // ESC tuşuyla menüyü kapat
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setUserMenuOpen(false)
        setSidebarOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const roleLabels: Record<string, string> = {
    koc: 'Koç',
    ogrenci: 'Öğrenci',
    veli: 'Veli',
    admin: 'Admin',
  }

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-surface-100 z-50 transform transition-transform lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-surface-100">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">
                Tekn<span className="text-primary-500">okul</span>
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {items.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== `/${role}` && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-surface-600 hover:bg-surface-50'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-surface-100">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-surface-600 hover:bg-surface-50 rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Çıkış Yap
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-surface-100">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-surface-600 hover:bg-surface-100 rounded-xl"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-4 ml-auto">
              {/* Notifications */}
              {profile?.id && <NotificationBell userId={profile.id} />}

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 p-2 hover:bg-surface-100 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center text-white text-sm font-medium">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full rounded-lg object-cover" />
                    ) : (
                      getInitials(profile?.full_name || 'U')
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-surface-900">
                      {profile?.full_name || 'Yükleniyor...'}
                    </div>
                    <div className="text-xs text-surface-500">{roleLabels[profile?.role || role]}</div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-surface-400 hidden sm:block transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-surface-100 z-50 py-1">
                    <Link
                      href={`/${role}/profil`}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-surface-600 hover:bg-surface-50"
                    >
                      <Settings className="w-4 h-4" />
                      Profil
                    </Link>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        handleLogout()
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Çıkış Yap
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}


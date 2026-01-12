import { Metadata } from 'next'
import Link from 'next/link'
import { 
  Sparkles, Hand, Volume2, Zap, Crown, ArrowRight, 
  Play, Star, Check, ChevronRight, Atom, Triangle,
  BookOpen, Clock, Users, Award
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Jarvis - Holografik Eğitim Sistemi | Teknokul',
  description: 'Türkiye\'nin ilk el hareketiyle kontrol edilen interaktif eğitim deneyimi. Geometri, fizik, kimya ve daha fazlasını 3D olarak öğren!',
  openGraph: {
    title: 'Jarvis - Holografik Eğitim',
    description: 'El hareketleriyle ders çalış, geleceğin eğitimini bugün yaşa!',
    images: ['/images/jarvis-og.png'],
  }
}

export default function JarvisLandingPage() {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-slate-900 to-purple-500/20" />
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px'
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-32">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              Türkiye'de İlk!
            </div>

            {/* Başlık */}
            <h1 className="text-5xl sm:text-7xl font-black text-white mb-6 leading-tight">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Holografik
              </span>
              <br />
              Eğitim Üssü
            </h1>

            {/* Alt başlık */}
            <p className="text-xl sm:text-2xl text-slate-300 max-w-2xl mx-auto mb-10">
              El hareketlerinle 3D şekilleri kontrol et, 
              <span className="text-cyan-400"> yapay zeka </span> 
              destekli asistanla ders çalış.
            </p>

            {/* CTA Butonları */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                href="/demo/interactive-lesson"
                className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-lg shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transition-all"
              >
                <Play className="w-5 h-5" />
                Hemen Dene
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link
                href="/premium"
                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-slate-800 border border-slate-700 text-white font-medium hover:bg-slate-700 transition-all"
              >
                <Crown className="w-5 h-5 text-amber-400" />
                Premium Ol
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {[
                { value: '105K+', label: 'Soru', icon: BookOpen },
                { value: '8', label: 'Ders', icon: Atom },
                { value: '30+', label: '3D Sahne', icon: Triangle },
                { value: '∞', label: 'Etkileşim', icon: Hand },
              ].map((stat, idx) => (
                <div key={idx} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 mb-3">
                    <stat.icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Nasıl Çalışır?
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Jarvis, el hareketlerini algılayarak 3D içeriklerle etkileşim kurmanı sağlar.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Hand,
                title: 'El Takibi',
                description: 'Kameran aracılığıyla el hareketlerin algılanır. Özel donanıma gerek yok!',
                color: 'cyan'
              },
              {
                icon: Atom,
                title: '3D Sahneler',
                description: 'Geometri şekilleri, atom modelleri, kuvvet vektörleri ve daha fazlası 3D olarak önünde.',
                color: 'purple'
              },
              {
                icon: Volume2,
                title: 'Sesli Rehber',
                description: 'TeknoÖğretmen sana adım adım rehberlik eder. "Şimdi elini yukarı kaldır..."',
                color: 'emerald'
              },
            ].map((feature, idx) => (
              <div 
                key={idx}
                className="p-8 rounded-2xl bg-slate-900 border border-slate-700 hover:border-cyan-500/50 transition-colors"
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-${feature.color}-500/10 border border-${feature.color}-500/30 mb-6`}>
                  <feature.icon className={`w-7 h-7 text-${feature.color}-400`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dersler Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Tüm Dersler İçin
            </h2>
            <p className="text-slate-400">
              Sadece matematik değil, tüm dersler için interaktif içerikler
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { name: 'Matematik', icon: '📐', color: 'cyan', scenes: 'Üçgen, Kare, Daire, Grafik' },
              { name: 'Fizik', icon: '⚡', color: 'amber', scenes: 'Kuvvet, Hareket, Devre' },
              { name: 'Kimya', icon: '⚛️', color: 'purple', scenes: 'Atom, Molekül, Tepkime' },
              { name: 'Biyoloji', icon: '🧬', color: 'emerald', scenes: 'Hücre, DNA, Ekosistem' },
              { name: 'Türkçe', icon: '📝', color: 'blue', scenes: 'Paragraf, Cümle Analizi' },
              { name: 'Tarih', icon: '📅', color: 'amber', scenes: 'Zaman Çizelgesi, Harita' },
              { name: 'Coğrafya', icon: '🗺️', color: 'emerald', scenes: 'Bölgeler, İklim' },
              { name: 'İngilizce', icon: '🌍', color: 'violet', scenes: 'Kelime, Gramer' },
            ].map((subject, idx) => (
              <div 
                key={idx}
                className="p-6 rounded-xl bg-slate-800 border border-slate-700 hover:border-cyan-500/50 transition-all hover:scale-105 cursor-pointer"
              >
                <span className="text-3xl mb-3 block">{subject.icon}</span>
                <h3 className="font-bold text-white mb-1">{subject.name}</h3>
                <p className="text-xs text-slate-500">{subject.scenes}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Jarvis'i Aç
            </h2>
            <p className="text-slate-400">
              Ücretsiz dene, beğenirsen premium'a geç
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free */}
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-2">Ücretsiz</h3>
              <p className="text-slate-400 mb-6">Jarvis'i tanımak için</p>
              
              <div className="text-4xl font-bold text-white mb-6">
                ₺0 <span className="text-sm font-normal text-slate-400">/ay</span>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  '3 Jarvis çözüm/gün',
                  '4 temel şekil',
                  'Sesli rehberlik',
                  'El takibi desteği',
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-slate-300">
                    <Check className="w-5 h-5 text-green-400" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/kayit"
                className="block w-full py-3 rounded-xl bg-slate-800 border border-slate-600 text-white font-medium text-center hover:bg-slate-700 transition-colors"
              >
                Ücretsiz Başla
              </Link>
            </div>

            {/* Premium */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 relative overflow-hidden">
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold">
                EN POPÜLER
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                Premium
              </h3>
              <p className="text-slate-400 mb-6">Sınırsız Jarvis deneyimi</p>
              
              <div className="text-4xl font-bold text-white mb-6">
                ₺99 <span className="text-sm font-normal text-slate-400">/ay</span>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  'Sınırsız Jarvis çözüm',
                  'Tüm 30+ 3D sahne',
                  'Öncelikli ses kalitesi',
                  'Gelişmiş el takibi',
                  'Reklamsız deneyim',
                  'Öncelikli destek',
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-white">
                    <Check className="w-5 h-5 text-cyan-400" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/premium"
                className="block w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-center hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
              >
                Premium Ol
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Geleceğin Eğitimini Bugün Yaşa
          </h2>
          <p className="text-xl text-slate-400 mb-10">
            105.000+ soru, 8 ders, sonsuz etkileşim. 
            Sadece ders çalışma, dersi yönet!
          </p>
          
          <Link
            href="/demo/interactive-lesson"
            className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white font-bold text-xl shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all"
          >
            <Sparkles className="w-6 h-6" />
            Jarvis'i Başlat
            <ChevronRight className="w-6 h-6" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© 2026 Teknokul. Tüm hakları saklıdır.</p>
          <p className="mt-2">
            Jarvis, Teknokul'un tescilli markasıdır. El takibi için MediaPipe teknolojisi kullanılmaktadır.
          </p>
        </div>
      </footer>
    </div>
  )
}

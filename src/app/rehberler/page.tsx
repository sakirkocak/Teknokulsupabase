'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  Clock, 
  Brain, 
  Target, 
  GraduationCap,
  ChevronRight,
  Search,
  Menu,
  X,
  Sparkles,
  TrendingUp,
  Award,
  Heart,
  Zap,
  Calendar,
  Users
} from 'lucide-react'

// Kategoriler
const KATEGORILER = [
  { id: 'tumu', ad: 'Tümü', icon: BookOpen },
  { id: 'verimli-calisma', ad: 'Verimli Çalışma', icon: Brain },
  { id: 'sinav-hazirlik', ad: 'Sınav Hazırlık', icon: Target },
  { id: 'motivasyon', ad: 'Motivasyon', icon: Heart },
  { id: 'planlama', ad: 'Planlama', icon: Calendar },
]

// Makaleler (statik, sonra Supabase'den çekilebilir)
const MAKALELER = [
  {
    slug: 'pomodoro-teknigi-ile-verimli-ders-calisma',
    baslik: 'Pomodoro Tekniği ile Verimli Ders Çalışma',
    ozet: '25 dakika odaklanma, 5 dakika mola. Bu basit teknik ile ders çalışma verimliliğinizi %40 artırın.',
    kategori: 'verimli-calisma',
    sure: '8 dk',
    tarih: '2025-01-15',
    resim: '/images/logo.png',
    etiketler: ['pomodoro', 'verimlilik', 'odaklanma'],
    oneCikan: true,
  },
  {
    slug: 'lgs-hazirlik-rehberi-8-sinif',
    baslik: 'LGS\'ye Nasıl Hazırlanılır? 8. Sınıf Rehberi',
    ozet: 'LGS\'de başarılı olmak için adım adım hazırlık rehberi. Hangi konulara ne kadar zaman ayırmalısınız?',
    kategori: 'sinav-hazirlik',
    sure: '12 dk',
    tarih: '2025-01-14',
    resim: '/images/logo.png',
    etiketler: ['LGS', '8. sınıf', 'sınav'],
    oneCikan: true,
  },
  {
    slug: 'yks-calisma-programi-nasil-yapilir',
    baslik: 'YKS Çalışma Programı Nasıl Yapılır?',
    ozet: 'Kendi öğrenme hızınıza uygun, gerçekçi ve sürdürülebilir bir YKS çalışma programı oluşturma rehberi.',
    kategori: 'planlama',
    sure: '10 dk',
    tarih: '2025-01-13',
    resim: '/images/logo.png',
    etiketler: ['YKS', 'planlama', 'program'],
    oneCikan: true,
  },
  {
    slug: 'sinav-kaygisi-nasil-yenilir',
    baslik: 'Sınav Kaygısı Nasıl Yenilir?',
    ozet: 'Sınav öncesi stres ve kaygıyı azaltmak için bilimsel olarak kanıtlanmış 7 etkili yöntem.',
    kategori: 'motivasyon',
    sure: '7 dk',
    tarih: '2025-01-12',
    resim: '/images/logo.png',
    etiketler: ['kaygı', 'stres', 'motivasyon'],
    oneCikan: false,
  },
  {
    slug: 'feynman-teknigi-ile-ogrenme',
    baslik: 'Feynman Tekniği ile Kalıcı Öğrenme',
    ozet: 'Nobel ödüllü fizikçi Richard Feynman\'ın öğrenme tekniği ile konuları gerçekten anlayın ve unutmayın.',
    kategori: 'verimli-calisma',
    sure: '6 dk',
    tarih: '2025-01-11',
    resim: '/images/logo.png',
    etiketler: ['feynman', 'öğrenme', 'teknik'],
    oneCikan: false,
  },
  {
    slug: 'aktif-tekrar-ve-spaced-repetition',
    baslik: 'Aktif Tekrar ve Aralıklı Tekrar Yöntemi',
    ozet: 'Bilimsel araştırmalara göre en etkili ezber ve hatırlama tekniği: Spaced Repetition (Aralıklı Tekrar).',
    kategori: 'verimli-calisma',
    sure: '9 dk',
    tarih: '2025-01-10',
    resim: '/images/logo.png',
    etiketler: ['ezber', 'tekrar', 'hafıza'],
    oneCikan: false,
  },
  {
    slug: 'gunluk-ders-calisma-programi',
    baslik: 'Günlük Ders Çalışma Programı Örneği',
    ozet: 'Sabahtan akşama kadar verimli bir gün geçirmek için örnek ders çalışma programı ve ipuçları.',
    kategori: 'planlama',
    sure: '5 dk',
    tarih: '2025-01-09',
    resim: '/images/logo.png',
    etiketler: ['günlük', 'program', 'rutin'],
    oneCikan: false,
  },
  {
    slug: 'matematik-korkusu-nasil-asilir',
    baslik: 'Matematik Korkusu Nasıl Aşılır?',
    ozet: 'Matematikten korkmayı bırakıp sevmeye başlamak için pratik öneriler ve zihinsel teknikler.',
    kategori: 'motivasyon',
    sure: '8 dk',
    tarih: '2025-01-08',
    resim: '/images/logo.png',
    etiketler: ['matematik', 'korku', 'özgüven'],
    oneCikan: false,
  },
]

export default function RehberlerPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [seciliKategori, setSeciliKategori] = useState('tumu')
  const [aramaMetni, setAramaMetni] = useState('')

  // Filtreleme
  const filtrelenmisler = MAKALELER.filter(makale => {
    const kategoriUygun = seciliKategori === 'tumu' || makale.kategori === seciliKategori
    const aramaUygun = aramaMetni === '' || 
      makale.baslik.toLowerCase().includes(aramaMetni.toLowerCase()) ||
      makale.ozet.toLowerCase().includes(aramaMetni.toLowerCase()) ||
      makale.etiketler.some(e => e.toLowerCase().includes(aramaMetni.toLowerCase()))
    return kategoriUygun && aramaUygun
  })

  const oneCikanlar = MAKALELER.filter(m => m.oneCikan)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Teknokul</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/hizli-coz" className="text-gray-300 hover:text-white transition">Soru Çöz</Link>
              <Link href="/liderlik" className="text-gray-300 hover:text-white transition">Liderlik</Link>
              <Link href="/lgs-puan-hesaplama" className="text-gray-300 hover:text-white transition">LGS Hesaplama</Link>
              <Link href="/yks-puan-hesaplama" className="text-gray-300 hover:text-white transition">YKS Hesaplama</Link>
            </nav>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-slate-800 border-b border-white/10"
          >
            <nav className="px-4 py-4 space-y-3">
              <Link href="/hizli-coz" className="block text-gray-300 hover:text-white">Soru Çöz</Link>
              <Link href="/liderlik" className="block text-gray-300 hover:text-white">Liderlik</Link>
              <Link href="/lgs-puan-hesaplama" className="block text-gray-300 hover:text-white">LGS Hesaplama</Link>
              <Link href="/yks-puan-hesaplama" className="block text-gray-300 hover:text-white">YKS Hesaplama</Link>
            </nav>
          </motion.div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-white transition">Ana Sayfa</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-emerald-400">Rehberler</span>
        </nav>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-4 py-2 rounded-full text-sm mb-4"
          >
            <Sparkles className="w-4 h-4" />
            Ücretsiz Eğitim Rehberleri
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4"
          >
            Verimli Çalışma Rehberleri
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg max-w-2xl mx-auto"
          >
            LGS, YKS ve tüm sınavlara hazırlık için kanıtlanmış çalışma teknikleri, 
            motivasyon ipuçları ve planlama rehberleri.
          </motion.p>
        </div>

        {/* Öne Çıkanlar */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Öne Çıkan Rehberler
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {oneCikanlar.map((makale, index) => (
              <Link
                key={makale.slug}
                href={`/rehberler/${makale.slug}`}
                className="group"
              >
                <motion.article
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 backdrop-blur-sm rounded-2xl border border-emerald-500/30 p-6 h-full
                    hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all"
                >
                  <div className="flex items-center gap-2 text-emerald-400 text-sm mb-3">
                    <Award className="w-4 h-4" />
                    Öne Çıkan
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-300 transition">
                    {makale.baslik}
                  </h3>
                  
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {makale.ozet}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-gray-500 text-sm">
                      <Clock className="w-4 h-4" />
                      {makale.sure}
                    </span>
                    <span className="text-emerald-400 text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                      Oku <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </motion.article>
              </Link>
            ))}
          </div>
        </motion.section>

        {/* Arama ve Filtreler */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          {/* Arama */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rehber ara... (örn: pomodoro, LGS, motivasyon)"
              value={aramaMetni}
              onChange={(e) => setAramaMetni(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
            />
          </div>

          {/* Kategoriler */}
          <div className="flex flex-wrap gap-2">
            {KATEGORILER.map((kategori) => {
              const Icon = kategori.icon
              return (
                <button
                  key={kategori.id}
                  onClick={() => setSeciliKategori(kategori.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${seciliKategori === kategori.id
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {kategori.ad}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Tüm Makaleler */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            Tüm Rehberler
            <span className="text-sm font-normal text-gray-500">({filtrelenmisler.length})</span>
          </h2>

          {filtrelenmisler.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Arama kriterlerinize uygun rehber bulunamadı.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtrelenmisler.map((makale, index) => (
                <Link
                  key={makale.slug}
                  href={`/rehberler/${makale.slug}`}
                  className="group"
                >
                  <motion.article
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-5 h-full
                      hover:bg-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-md">
                        {KATEGORILER.find(k => k.id === makale.kategori)?.ad || makale.kategori}
                      </span>
                      <span className="flex items-center gap-1 text-gray-500 text-xs">
                        <Clock className="w-3 h-3" />
                        {makale.sure}
                      </span>
                    </div>
                    
                    <h3 className="text-white font-semibold mb-2 group-hover:text-emerald-300 transition line-clamp-2">
                      {makale.baslik}
                    </h3>
                    
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                      {makale.ozet}
                    </p>
                    
                    <div className="flex flex-wrap gap-1">
                      {makale.etiketler.slice(0, 3).map((etiket) => (
                        <span
                          key={etiket}
                          className="px-2 py-0.5 bg-white/5 text-gray-500 text-xs rounded"
                        >
                          #{etiket}
                        </span>
                      ))}
                    </div>
                  </motion.article>
                </Link>
              ))}
            </div>
          )}
        </motion.section>

        {/* CTA */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16"
        >
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-3">
              Öğrendiklerini Uygula!
            </h3>
            <p className="text-emerald-100 mb-6 max-w-xl mx-auto">
              Verimli çalışma tekniklerini öğrendin, şimdi binlerce soru çözerek pratiğe dök.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/hizli-coz"
                className="inline-flex items-center justify-center gap-2 bg-white text-emerald-600 px-6 py-3 rounded-xl font-semibold hover:bg-emerald-50 transition"
              >
                <Zap className="w-5 h-5" />
                Soru Çözmeye Başla
              </Link>
              <Link
                href="/kayit"
                className="inline-flex items-center justify-center gap-2 bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-800 transition"
              >
                <Users className="w-5 h-5" />
                Ücretsiz Üye Ol
              </Link>
            </div>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-semibold">Teknokul</span>
            </div>
            
            <nav className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <Link href="/lgs-puan-hesaplama" className="hover:text-white transition">LGS Hesaplama</Link>
              <Link href="/yks-puan-hesaplama" className="hover:text-white transition">YKS Hesaplama</Link>
              <Link href="/yasal/gizlilik" className="hover:text-white transition">Gizlilik</Link>
            </nav>
            
            <p className="text-gray-500 text-sm">
              © 2025 Teknokul. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}


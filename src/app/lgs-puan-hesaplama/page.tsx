'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Calculator, 
  BookOpen, 
  Award, 
  TrendingUp, 
  Share2, 
  RotateCcw,
  ChevronRight,
  GraduationCap,
  Target,
  Sparkles,
  Info,
  ArrowLeft,
  Menu,
  X
} from 'lucide-react'
import { hesaplaLGS, LGSNetler, LGSSonuc, formatPuan, LGS_GECMIS_YILLAR } from '@/lib/exam-calculations'
import { CalculatorSchema, FAQSchema } from '@/components/JsonLdSchema'

// Ders bilgileri - LGS 2025 (Toplam 90 soru)
// Katsayı 4: Ana dersler (toplam puanın %80'i)
// Katsayı 1: Yardımcı dersler (toplam puanın %20'si)
const DERSLER = [
  { key: 'turkce', ad: 'Türkçe', maxSoru: 20, katsayi: 4, renk: 'from-blue-500 to-blue-600', icon: '📖' },
  { key: 'matematik', ad: 'Matematik', maxSoru: 20, katsayi: 4, renk: 'from-purple-500 to-purple-600', icon: '🔢' },
  { key: 'fen', ad: 'Fen Bilimleri', maxSoru: 20, katsayi: 4, renk: 'from-green-500 to-green-600', icon: '🔬' },
  { key: 'inkilap', ad: 'T.C. İnkılap Tarihi', maxSoru: 10, katsayi: 1, renk: 'from-orange-500 to-orange-600', icon: '🏛️' },
  { key: 'din', ad: 'Din Kültürü', maxSoru: 10, katsayi: 1, renk: 'from-teal-500 to-teal-600', icon: '📿' },
  { key: 'ingilizce', ad: 'Yabancı Dil', maxSoru: 10, katsayi: 1, renk: 'from-red-500 to-red-600', icon: '🌐' },
]

// SSS için FAQ Schema
const LGS_FAQS = [
  {
    question: 'LGS puanı nasıl hesaplanır?',
    answer: 'LGS puanı, her dersin netinin katsayısı ile çarpılıp toplanmasıyla hesaplanır. Türkçe, Matematik ve Fen Bilimleri 4 katsayı ile çarpılırken; İnkılap, Din ve Yabancı Dil 1 katsayı ile çarpılır. Yani Matematik neti, Din netinden 4 kat daha değerlidir. Net = Doğru - (Yanlış/3) formülüyle hesaplanır.',
  },
  {
    question: 'LGS\'de hangi dersler daha önemli?',
    answer: 'Matematik, Türkçe ve Fen Bilimleri toplam puanın yaklaşık %80\'ini oluşturur (4 katsayı). İnkılap, Din ve Yabancı Dil ise %20\'sini oluşturur (1 katsayı). Bu yüzden ana derslere öncelik vermelisiniz.',
  },
  {
    question: 'LGS\'de kaç soru var?',
    answer: 'LGS\'de toplam 90 soru bulunmaktadır: Türkçe 20, Matematik 20, Fen Bilimleri 20, T.C. İnkılap Tarihi 10, Din Kültürü 10, Yabancı Dil 10 soru.',
  },
  {
    question: '3 yanlış 1 doğruyu götürür mü?',
    answer: 'Evet, LGS\'de 3 yanlış 1 doğruyu götürür. Net hesabı şöyle yapılır: Net = Doğru Sayısı - (Yanlış Sayısı / 3). Boş bırakılan sorular neti etkilemez.',
  },
]

export default function LGSPuanHesaplamaPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [netler, setNetler] = useState<LGSNetler>({
    turkce: 0,
    matematik: 0,
    fen: 0,
    inkilap: 0,
    din: 0,
    ingilizce: 0,
  })
  const [sonuc, setSonuc] = useState<LGSSonuc | null>(null)
  const [animateResult, setAnimateResult] = useState(false)

  // Her değişiklikte hesapla
  useEffect(() => {
    const result = hesaplaLGS(netler)
    setSonuc(result)
    setAnimateResult(true)
    const timer = setTimeout(() => setAnimateResult(false), 300)
    return () => clearTimeout(timer)
  }, [netler])

  const handleNetChange = (ders: string, value: number) => {
    const maxValue = DERSLER.find(d => d.key === ders)?.maxSoru || 20
    const clampedValue = Math.min(Math.max(0, value), maxValue)
    setNetler(prev => ({ ...prev, [ders]: clampedValue }))
  }

  const handleReset = () => {
    setNetler({
      turkce: 0,
      matematik: 0,
      fen: 0,
      inkilap: 0,
      din: 0,
      ingilizce: 0,
    })
  }

  const handleShare = async () => {
    if (!sonuc) return
    
    const text = `🎯 LGS Puan Hesaplamam:
📊 Toplam Net: ${sonuc.toplamNet}/${sonuc.toplamSoru}
⭐ Tahmini Puan: ${formatPuan(sonuc.tahminiPuan)}
📈 Yüzdelik Dilim: %${sonuc.tahminiYuzdelik}

Hesapla: teknokul.com.tr/lgs-puan-hesaplama`

    if (navigator.share) {
      try {
        await navigator.share({ text })
      } catch {
        navigator.clipboard.writeText(text)
        alert('Sonuçlar panoya kopyalandı!')
      }
    } else {
      navigator.clipboard.writeText(text)
      alert('Sonuçlar panoya kopyalandı!')
    }
  }

  const getPuanRengi = (puan: number) => {
    if (puan >= 450) return 'text-green-500'
    if (puan >= 400) return 'text-blue-500'
    if (puan >= 350) return 'text-yellow-500'
    if (puan >= 300) return 'text-orange-500'
    return 'text-red-500'
  }

  return (
    <>
      {/* JSON-LD Schemas */}
      <CalculatorSchema
        name="LGS Puan Hesaplama Aracı"
        description="2025 LGS sınavı için anlık puan hesaplama. Türkçe, Matematik, Fen, Sosyal, Din ve İngilizce netlerinizi girin, puanınızı ve yüzdelik diliminizi öğrenin."
        url="https://www.teknokul.com.tr/lgs-puan-hesaplama"
      />
      <FAQSchema faqs={LGS_FAQS} />

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
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

              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center space-x-6">
                <Link href="/hizli-coz" className="text-gray-300 hover:text-white transition">
                  Soru Çöz
                </Link>
                <Link href="/liderlik" className="text-gray-300 hover:text-white transition">
                  Liderlik
                </Link>
                <Link href="/yks-puan-hesaplama" className="text-gray-300 hover:text-white transition">
                  YKS Hesaplama
                </Link>
                <Link href="/rehberler" className="text-gray-300 hover:text-white transition">
                  Rehberler
                </Link>
              </nav>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-300 hover:text-white"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden bg-slate-800 border-b border-white/10"
            >
              <nav className="px-4 py-4 space-y-3">
                <Link href="/hizli-coz" className="block text-gray-300 hover:text-white">Soru Çöz</Link>
                <Link href="/liderlik" className="block text-gray-300 hover:text-white">Liderlik</Link>
                <Link href="/yks-puan-hesaplama" className="block text-gray-300 hover:text-white">YKS Hesaplama</Link>
                <Link href="/rehberler" className="block text-gray-300 hover:text-white">Rehberler</Link>
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
            <span className="text-purple-400">LGS Puan Hesaplama</span>
          </nav>

          {/* Hero Section */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 px-4 py-2 rounded-full text-sm mb-4"
            >
              <Sparkles className="w-4 h-4" />
              2025 LGS Güncel Katsayılar
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4"
            >
              LGS Puan Hesaplama
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-lg max-w-2xl mx-auto"
            >
              Netlerinizi girin, tahmini puanınızı ve yüzdelik diliminizi anında öğrenin.
            </motion.p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Sol: Net Girişi */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-400" />
                  Net Girişi
                </h2>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  Sıfırla
                </button>
              </div>

              <div className="space-y-4">
                {DERSLER.map((ders) => (
                  <div key={ders.key} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-gray-300 flex items-center gap-2">
                        <span>{ders.icon}</span>
                        {ders.ad}
                        <span className={`text-xs px-1.5 py-0.5 rounded ${ders.katsayi === 4 ? 'bg-purple-500/30 text-purple-300' : 'bg-gray-500/30 text-gray-400'}`}>
                          x{ders.katsayi}
                        </span>
                      </label>
                      <span className="text-sm text-gray-500">
                        {netler[ders.key as keyof LGSNetler]} / {ders.maxSoru}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max={ders.maxSoru}
                        step="0.25"
                        value={netler[ders.key as keyof LGSNetler]}
                        onChange={(e) => handleNetChange(ders.key, parseFloat(e.target.value))}
                        className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r 
                          [&::-webkit-slider-thumb]:from-purple-500 [&::-webkit-slider-thumb]:to-pink-500
                          [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
                      />
                      <input
                        type="number"
                        min="0"
                        max={ders.maxSoru}
                        step="0.25"
                        value={netler[ders.key as keyof LGSNetler]}
                        onChange={(e) => handleNetChange(ders.key, parseFloat(e.target.value) || 0)}
                        className="w-16 px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-center
                          focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                    </div>
                    
                    {/* Progress bar */}
                    <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full bg-gradient-to-r ${ders.renk}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(netler[ders.key as keyof LGSNetler] / ders.maxSoru) * 100}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Sağ: Sonuçlar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              {/* Ana Sonuç Kartı */}
              <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-purple-400" />
                    Sonuçlarınız
                  </h2>
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1 text-sm text-purple-300 hover:text-purple-200 transition"
                  >
                    <Share2 className="w-4 h-4" />
                    Paylaş
                  </button>
                </div>

                {sonuc && (
                  <div className="space-y-6">
                    {/* Tahmini Puan */}
                    <div className="text-center py-4">
                      <p className="text-gray-400 text-sm mb-1">Tahmini Puan</p>
                      <motion.p
                        key={sonuc.tahminiPuan}
                        initial={animateResult ? { scale: 1.1 } : {}}
                        animate={{ scale: 1 }}
                        className={`text-5xl sm:text-6xl font-bold ${getPuanRengi(sonuc.tahminiPuan)}`}
                      >
                        {formatPuan(sonuc.tahminiPuan)}
                      </motion.p>
                      <p className="text-gray-500 text-sm mt-1">/ 500</p>
                    </div>

                    {/* İstatistikler */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white/5 rounded-xl p-3 text-center">
                        <p className="text-gray-400 text-xs mb-1">Toplam Net</p>
                        <p className="text-2xl font-bold text-white">
                          {sonuc.toplamNet}
                          <span className="text-sm text-gray-500">/{sonuc.toplamSoru}</span>
                        </p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 text-center">
                        <p className="text-gray-400 text-xs mb-1">Başarı</p>
                        <p className="text-2xl font-bold text-white">
                          %{Math.round(sonuc.basariYuzdesi)}
                        </p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 text-center">
                        <p className="text-gray-400 text-xs mb-1">Yüzdelik</p>
                        <p className="text-2xl font-bold text-green-400">
                          %{sonuc.tahminiYuzdelik}
                        </p>
                      </div>
                    </div>

                    {/* Ders Bazlı Puanlar */}
                    <div>
                      <p className="text-gray-400 text-sm mb-3">Ders Bazlı Katkı</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {DERSLER.map((ders) => (
                          <div key={ders.key} className="bg-white/5 rounded-lg p-2 text-center">
                            <span className="text-lg">{ders.icon}</span>
                            <p className="text-white font-semibold">
                              {sonuc.dersBazliPuanlar[ders.key as keyof typeof sonuc.dersBazliPuanlar]}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Geçmiş Yıl Karşılaştırması */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Geçmiş Yıl Verileri
                </h3>
                <div className="space-y-3">
                  {LGS_GECMIS_YILLAR.map((yil) => (
                    <div key={yil.yil} className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">{yil.yil}</span>
                      <div className="flex gap-4 text-gray-300">
                        <span>%1: <strong className="text-green-400">{yil.yuzde1Esik}</strong></span>
                        <span>%5: <strong className="text-blue-400">{yil.yuzde5Esik}</strong></span>
                        <span>Ort: <strong className="text-yellow-400">{yil.ortPuan}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-center">
                <h3 className="text-lg font-bold text-white mb-2">
                  LGS&apos;ye Hazırlan!
                </h3>
                <p className="text-purple-100 text-sm mb-4">
                  Binlerce soru çöz, eksiklerini kapat, sıralamanda yüksel.
                </p>
                <Link
                  href="/kayit"
                  className="inline-flex items-center gap-2 bg-white text-purple-600 px-6 py-3 rounded-xl font-semibold hover:bg-purple-50 transition"
                >
                  Ücretsiz Başla
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </div>

          {/* SSS Bölümü */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-16"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Info className="w-6 h-6 text-purple-400" />
              Sık Sorulan Sorular
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {LGS_FAQS.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-5"
                >
                  <h3 className="text-white font-semibold mb-2">{faq.question}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Disclaimer */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              ⚠️ Bu hesaplama tahmini değerler sunar. Kesin sonuçlar MEB tarafından açıklanır.
            </p>
          </div>
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
                <Link href="/yks-puan-hesaplama" className="hover:text-white transition">YKS Hesaplama</Link>
                <Link href="/rehberler" className="hover:text-white transition">Rehberler</Link>
                <Link href="/yasal/gizlilik" className="hover:text-white transition">Gizlilik</Link>
                <Link href="/yasal/kullanim-kosullari" className="hover:text-white transition">Kullanım</Link>
              </nav>
              
              <p className="text-gray-500 text-sm">
                © 2025 Teknokul. Tüm hakları saklıdır.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}


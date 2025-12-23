'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Calculator, 
  BookOpen, 
  TrendingUp, 
  Share2, 
  RotateCcw,
  ChevronRight,
  GraduationCap,
  Sparkles,
  Info,
  Menu,
  X,
  Beaker,
  FileText,
  Globe,
  Languages
} from 'lucide-react'
import { 
  hesaplaYKS, 
  TYTNetler, 
  AYTNetler, 
  YKSSonuc, 
  YKSPuanTuru,
  formatPuan, 
  formatSiralama,
  YKS_GECMIS_YILLAR 
} from '@/lib/exam-calculations'
import { CalculatorSchema, FAQSchema } from '@/components/JsonLdSchema'

// TYT Dersleri
const TYT_DERSLER = [
  { key: 'turkce', ad: 'Türkçe', maxSoru: 40, icon: '📖' },
  { key: 'sosyal', ad: 'Sosyal Bilimler', maxSoru: 20, icon: '🌍' },
  { key: 'matematik', ad: 'Temel Matematik', maxSoru: 40, icon: '🔢' },
  { key: 'fen', ad: 'Fen Bilimleri', maxSoru: 20, icon: '🔬' },
]

// AYT Dersleri (Puan türüne göre)
const AYT_DERSLER = {
  SAY: [
    { key: 'matematik', ad: 'Matematik', maxSoru: 40, icon: '🔢' },
    { key: 'fizik', ad: 'Fizik', maxSoru: 14, icon: '⚡' },
    { key: 'kimya', ad: 'Kimya', maxSoru: 13, icon: '🧪' },
    { key: 'biyoloji', ad: 'Biyoloji', maxSoru: 13, icon: '🧬' },
  ],
  SOZ: [
    { key: 'edebiyat', ad: 'Türk Dili ve Edebiyatı', maxSoru: 24, icon: '📚' },
    { key: 'tarih1', ad: 'Tarih-1', maxSoru: 10, icon: '🏛️' },
    { key: 'cografya1', ad: 'Coğrafya-1', maxSoru: 6, icon: '🗺️' },
    { key: 'tarih2', ad: 'Tarih-2', maxSoru: 11, icon: '📜' },
    { key: 'cografya2', ad: 'Coğrafya-2', maxSoru: 11, icon: '🌐' },
    { key: 'felsefe', ad: 'Felsefe Grubu', maxSoru: 12, icon: '🤔' },
    { key: 'din', ad: 'Din Kültürü', maxSoru: 6, icon: '📿' },
  ],
  EA: [
    { key: 'matematik', ad: 'Matematik', maxSoru: 40, icon: '🔢' },
    { key: 'edebiyat', ad: 'Türk Dili ve Edebiyatı', maxSoru: 24, icon: '📚' },
    { key: 'tarih1', ad: 'Tarih-1', maxSoru: 10, icon: '🏛️' },
    { key: 'cografya1', ad: 'Coğrafya-1', maxSoru: 6, icon: '🗺️' },
  ],
  DIL: [
    { key: 'ydt', ad: 'Yabancı Dil Testi', maxSoru: 80, icon: '🌐' },
  ],
}

const PUAN_TURLERI: { value: YKSPuanTuru; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'SAY', label: 'Sayısal', icon: Beaker, color: 'from-blue-500 to-cyan-500' },
  { value: 'SOZ', label: 'Sözel', icon: FileText, color: 'from-orange-500 to-red-500' },
  { value: 'EA', label: 'Eşit Ağırlık', icon: Globe, color: 'from-purple-500 to-pink-500' },
  { value: 'DIL', label: 'Dil', icon: Languages, color: 'from-green-500 to-teal-500' },
]

// SSS
const YKS_FAQS = [
  {
    question: 'YKS puanı nasıl hesaplanır?',
    answer: 'YKS puanı şu formülle hesaplanır: Yerleştirme Puanı = (TYT Puanı × 0.4) + (AYT Puanı × 0.6) + OBP Katkısı. TYT %40, AYT %60 katkı sağlar. OBP (Diploma Notu × 5) × 0.12 olarak eklenir.',
  },
  {
    question: '4 yanlış 1 doğruyu götürür mü?',
    answer: 'Evet, YKS\'de 4 yanlış 1 doğruyu götürür. Net hesabı: Net = Doğru - (Yanlış / 4). Bu LGS\'den farklıdır (LGS\'de 3 yanlış 1 doğruyu götürür).',
  },
  {
    question: 'OBP (Diploma notu) nasıl hesaplanır?',
    answer: 'Diploma notunuz (50-100) 5 ile çarpılır → OBP (250-500 arası). Sonra OBP × 0.12 yerleştirme puanınıza eklenir. Örnek: 80 diploma notu → 400 OBP → 48 puan katkı. Önceki yıl yerleşenler için katsayı 0.06\'ya düşer.',
  },
  {
    question: 'TYT ve AYT katkısı nasıl hesaplanır?',
    answer: 'TYT\'de net başına yaklaşık 1.33 puan (Türkçe-Matematik) veya 1.36 puan (Sosyal-Fen) alırsınız. AYT\'de puan türüne göre net başına 2.8-3.3 puan arası değişir. TYT toplam puanın %40\'ını, AYT %60\'ını oluşturur.',
  },
]

export default function YKSPuanHesaplamaPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [puanTuru, setPuanTuru] = useState<YKSPuanTuru>('SAY')
  const [diplomaNotu, setDiplomaNotu] = useState(80)
  const [kirikOBP, setKirikOBP] = useState(false) // Önceki yıl yerleşti mi?
  
  const [tytNetler, setTytNetler] = useState<TYTNetler>({
    turkce: 0,
    sosyal: 0,
    matematik: 0,
    fen: 0,
  })
  
  const [aytNetler, setAytNetler] = useState<AYTNetler>({})
  const [sonuc, setSonuc] = useState<YKSSonuc | null>(null)
  const [animateResult, setAnimateResult] = useState(false)

  // Puan türü değiştiğinde AYT netleri sıfırla
  useEffect(() => {
    setAytNetler({})
  }, [puanTuru])

  // Her değişiklikte hesapla
  useEffect(() => {
    const result = hesaplaYKS(tytNetler, aytNetler, puanTuru, diplomaNotu, kirikOBP)
    setSonuc(result)
    setAnimateResult(true)
    const timer = setTimeout(() => setAnimateResult(false), 300)
    return () => clearTimeout(timer)
  }, [tytNetler, aytNetler, puanTuru, diplomaNotu, kirikOBP])

  const handleTytChange = (ders: string, value: number) => {
    const maxValue = TYT_DERSLER.find(d => d.key === ders)?.maxSoru || 40
    const clampedValue = Math.min(Math.max(0, value), maxValue)
    setTytNetler(prev => ({ ...prev, [ders]: clampedValue }))
  }

  const handleAytChange = (ders: string, value: number) => {
    const dersler = AYT_DERSLER[puanTuru]
    const maxValue = dersler.find(d => d.key === ders)?.maxSoru || 40
    const clampedValue = Math.min(Math.max(0, value), maxValue)
    setAytNetler(prev => ({ ...prev, [ders]: clampedValue }))
  }

  const handleReset = () => {
    setTytNetler({ turkce: 0, sosyal: 0, matematik: 0, fen: 0 })
    setAytNetler({})
    setDiplomaNotu(80)
  }

  const handleShare = async () => {
    if (!sonuc) return
    
    const text = `🎓 YKS Puan Hesaplamam (${puanTuru}):
📊 TYT Ham: ${formatPuan(sonuc.tytPuan)} (×0.4 = ${formatPuan(sonuc.tytKatki)})
📈 AYT Ham: ${formatPuan(sonuc.aytPuan)} (×0.6 = ${formatPuan(sonuc.aytKatki)})
📋 Ham Puan: ${formatPuan(sonuc.hamPuan)}
🎓 OBP Katkısı: +${formatPuan(sonuc.obpKatki)}
⭐ Yerleştirme Puanı: ${formatPuan(sonuc.yerlesmeYKS)}
🏆 Tahmini Sıralama: ${formatSiralama(sonuc.tahminiSiralama)}

Hesapla: teknokul.com.tr/yks-puan-hesaplama`

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
    if (puan >= 350) return 'text-blue-500'
    if (puan >= 250) return 'text-yellow-500'
    if (puan >= 150) return 'text-orange-500'
    return 'text-red-500'
  }

  const currentPuanTuru = PUAN_TURLERI.find(p => p.value === puanTuru)!
  const aytDersler = AYT_DERSLER[puanTuru]

  return (
    <>
      {/* JSON-LD Schemas */}
      <CalculatorSchema
        name="YKS Puan Hesaplama Aracı"
        description="2025 YKS (TYT-AYT) puan hesaplama. Sayısal, Sözel, Eşit Ağırlık ve Dil puan türleri için anlık hesaplama. Diploma notu dahil."
        url="https://www.teknokul.com.tr/yks-puan-hesaplama"
      />
      <FAQSchema faqs={YKS_FAQS} />

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
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
                <Link href="/rehberler" className="text-gray-300 hover:text-white transition">Rehberler</Link>
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
            <span className="text-indigo-400">YKS Puan Hesaplama</span>
          </nav>

          {/* Hero Section */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 px-4 py-2 rounded-full text-sm mb-4"
            >
              <Sparkles className="w-4 h-4" />
              2025 YKS Güncel Katsayılar
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4"
            >
              YKS Puan Hesaplama
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-lg max-w-2xl mx-auto"
            >
              TYT ve AYT netlerinizi girin, puan türünüze göre tahmini puanınızı ve sıralamanızı öğrenin.
            </motion.p>
          </div>

          {/* Puan Türü Seçimi */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-3 mb-8"
          >
            {PUAN_TURLERI.map((tur) => {
              const Icon = tur.icon
              return (
                <button
                  key={tur.value}
                  onClick={() => setPuanTuru(tur.value)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all
                    ${puanTuru === tur.value 
                      ? `bg-gradient-to-r ${tur.color} text-white shadow-lg scale-105` 
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  {tur.label}
                </button>
              )
            })}
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Sol: Net Girişi */}
            <div className="space-y-6">
              {/* TYT Netleri */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-400" />
                    TYT Netleri
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
                  {TYT_DERSLER.map((ders) => (
                    <div key={ders.key}>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-gray-300 flex items-center gap-2">
                          <span>{ders.icon}</span>
                          {ders.ad}
                        </label>
                        <span className="text-sm text-gray-500">
                          {tytNetler[ders.key as keyof TYTNetler]} / {ders.maxSoru}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max={ders.maxSoru}
                          step="0.25"
                          value={tytNetler[ders.key as keyof TYTNetler]}
                          onChange={(e) => handleTytChange(ders.key, parseFloat(e.target.value))}
                          className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r 
                            [&::-webkit-slider-thumb]:from-indigo-500 [&::-webkit-slider-thumb]:to-purple-500
                            [&::-webkit-slider-thumb]:cursor-pointer"
                        />
                        <input
                          type="number"
                          min="0"
                          max={ders.maxSoru}
                          step="0.25"
                          value={tytNetler[ders.key as keyof TYTNetler]}
                          onChange={(e) => handleTytChange(ders.key, parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-center
                            focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* AYT Netleri */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className={`bg-gradient-to-br ${currentPuanTuru.color} bg-opacity-10 backdrop-blur-sm rounded-2xl border border-white/10 p-6`}
              >
                <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
                  <Calculator className="w-5 h-5" />
                  AYT Netleri ({currentPuanTuru.label})
                </h2>

                <div className="space-y-4">
                  {aytDersler.map((ders) => (
                    <div key={ders.key}>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-gray-300 flex items-center gap-2">
                          <span>{ders.icon}</span>
                          {ders.ad}
                        </label>
                        <span className="text-sm text-gray-500">
                          {aytNetler[ders.key as keyof AYTNetler] || 0} / {ders.maxSoru}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max={ders.maxSoru}
                          step="0.25"
                          value={aytNetler[ders.key as keyof AYTNetler] || 0}
                          onChange={(e) => handleAytChange(ders.key, parseFloat(e.target.value))}
                          className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
                            [&::-webkit-slider-thumb]:cursor-pointer"
                        />
                        <input
                          type="number"
                          min="0"
                          max={ders.maxSoru}
                          step="0.25"
                          value={aytNetler[ders.key as keyof AYTNetler] || 0}
                          onChange={(e) => handleAytChange(ders.key, parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-center
                            focus:outline-none focus:ring-2 focus:ring-white/30"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Diploma Notu ve OBP */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6"
              >
                <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                  <GraduationCap className="w-5 h-5 text-yellow-400" />
                  Diploma Notu (OBP)
                </h2>
                
                <div className="flex items-center gap-4 mb-4">
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={diplomaNotu}
                    onChange={(e) => setDiplomaNotu(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-400
                      [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <div className="bg-yellow-500/20 px-4 py-2 rounded-lg">
                    <span className="text-2xl font-bold text-yellow-400">{diplomaNotu}</span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                  <div className="text-gray-400">
                    OBP: <span className="text-white font-medium">{diplomaNotu * 5}</span> | 
                    Katkı: <span className="text-yellow-400 font-medium">+{(diplomaNotu * 5 * (kirikOBP ? 0.06 : 0.12)).toFixed(1)}</span> puan
                  </div>
                  
                  <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={kirikOBP}
                      onChange={(e) => setKirikOBP(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-white/10 text-yellow-500 focus:ring-yellow-500/50"
                    />
                    <span className="text-sm">Geçen yıl yerleştim (Kırık OBP)</span>
                  </label>
                </div>
                
                {kirikOBP && (
                  <p className="text-orange-400 text-xs mt-2">
                    ⚠️ Kırık OBP: Önceki yıl bir programa yerleştiğiniz için OBP katsayınız 0.12 yerine 0.06
                  </p>
                )}
              </motion.div>
            </div>

            {/* Sağ: Sonuçlar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              {/* Ana Sonuç Kartı */}
              <div className={`bg-gradient-to-br ${currentPuanTuru.color} bg-opacity-20 backdrop-blur-sm rounded-2xl border border-white/20 p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    {currentPuanTuru.label} Sonuçları
                  </h2>
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1 text-sm text-white/70 hover:text-white transition"
                  >
                    <Share2 className="w-4 h-4" />
                    Paylaş
                  </button>
                </div>

                {sonuc && (
                  <div className="space-y-6">
                    {/* Yerleşme Puanı */}
                    <div className="text-center py-4">
                      <p className="text-white/70 text-sm mb-1">Yerleştirme Puanı</p>
                      <motion.p
                        key={sonuc.yerlesmeYKS}
                        initial={animateResult ? { scale: 1.1 } : {}}
                        animate={{ scale: 1 }}
                        className={`text-5xl sm:text-6xl font-bold ${getPuanRengi(sonuc.yerlesmeYKS)}`}
                      >
                        {formatPuan(sonuc.yerlesmeYKS)}
                      </motion.p>
                    </div>

                    {/* Detaylı Puanlar */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/10 rounded-xl p-3 text-center">
                        <p className="text-white/60 text-xs mb-1">TYT Ham Puanı</p>
                        <p className="text-xl font-bold text-white">{formatPuan(sonuc.tytPuan)}</p>
                        <p className="text-xs text-indigo-300">×0.4 = {formatPuan(sonuc.tytKatki)}</p>
                      </div>
                      <div className="bg-white/10 rounded-xl p-3 text-center">
                        <p className="text-white/60 text-xs mb-1">AYT Ham Puanı</p>
                        <p className="text-xl font-bold text-white">{formatPuan(sonuc.aytPuan)}</p>
                        <p className="text-xs text-purple-300">×0.6 = {formatPuan(sonuc.aytKatki)}</p>
                      </div>
                      <div className="bg-white/10 rounded-xl p-3 text-center">
                        <p className="text-white/60 text-xs mb-1">Ham Puan</p>
                        <p className="text-xl font-bold text-white">{formatPuan(sonuc.hamPuan)}</p>
                        <p className="text-xs text-gray-400">TYT + AYT katkısı</p>
                      </div>
                      <div className="bg-white/10 rounded-xl p-3 text-center">
                        <p className="text-white/60 text-xs mb-1">OBP Katkısı</p>
                        <p className="text-xl font-bold text-yellow-400">+{formatPuan(sonuc.obpKatki)}</p>
                        <p className="text-xs text-yellow-200/60">{sonuc.obpPuan} × {kirikOBP ? '0.06' : '0.12'}</p>
                      </div>
                    </div>

                    {/* Tahmini Sıralama */}
                    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 text-center border border-green-500/30">
                      <p className="text-white/60 text-xs mb-1">Tahmini Sıralama</p>
                      <p className="text-2xl font-bold text-green-400">{formatSiralama(sonuc.tahminiSiralama)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Geçmiş Yıl Verileri */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  {currentPuanTuru.label} Geçmiş Yıl Verileri
                </h3>
                <div className="space-y-3">
                  {(YKS_GECMIS_YILLAR[puanTuru === 'DIL' ? 'SAY' : puanTuru] || []).map((yil) => (
                    <div key={yil.yil} className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">{yil.yil}</span>
                      <div className="flex gap-3 text-gray-300">
                        <span>İlk 1K: <strong className="text-green-400">{yil.ilk1000Puan}</strong></span>
                        <span>İlk 10K: <strong className="text-blue-400">{yil.ilk10000Puan}</strong></span>
                        <span>İlk 50K: <strong className="text-yellow-400">{yil.ilk50000Puan}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-center">
                <h3 className="text-lg font-bold text-white mb-2">
                  YKS&apos;ye Hazırlan!
                </h3>
                <p className="text-indigo-100 text-sm mb-4">
                  Binlerce soru çöz, eksiklerini kapat, hayalindeki üniversiteye ulaş.
                </p>
                <Link
                  href="/kayit"
                  className="inline-flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition"
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
            transition={{ delay: 0.7 }}
            className="mt-16"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Info className="w-6 h-6 text-indigo-400" />
              Sık Sorulan Sorular
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {YKS_FAQS.map((faq, index) => (
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
              ⚠️ Bu hesaplama tahmini değerler sunar. Kesin sonuçlar ÖSYM tarafından açıklanır.
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
                <Link href="/lgs-puan-hesaplama" className="hover:text-white transition">LGS Hesaplama</Link>
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


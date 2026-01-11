'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Bot, 
  Mic, 
  Monitor, 
  Brain, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Play,
  Sparkles,
  Volume2,
  Target,
  MessageSquare,
  Zap,
  BookOpen,
  ArrowRight,
  Check,
  Star,
  Users,
  Menu,
  X,
  Eye,
  Atom,
  Calculator,
  Layers,
  Headphones,
  GraduationCap,
  Lightbulb,
  Trophy,
  Heart,
  Shield,
  Rocket,
  Coins
} from 'lucide-react'

// Jarvis Özellikleri - Teknoloji isimleri YOK
const jarvisFeatures = [
  {
    icon: Volume2,
    title: "Gerçek İnsan Gibi Konuşur",
    description: "Robotik sesler yerine sıcak, samimi ve doğal bir ses. Sanki gerçek bir öğretmenle konuşuyorsunuz.",
    gradient: "from-cyan-500 to-blue-500",
    bgGradient: "from-cyan-500/10 to-blue-500/10"
  },
  {
    icon: Eye,
    title: "Soruları Görür ve Anlar",
    description: "Görsellerdeki sayı doğrusu, tablo, grafik ve şekilleri analiz eder, size özel açıklama yapar.",
    gradient: "from-purple-500 to-pink-500",
    bgGradient: "from-purple-500/10 to-pink-500/10"
  },
  {
    icon: Calculator,
    title: "Matematikte Asla Yanılmaz",
    description: "Köklü ifadeler, denklemler ve karmaşık hesaplamaları adım adım ve hatasız çözer.",
    gradient: "from-orange-500 to-red-500",
    bgGradient: "from-orange-500/10 to-red-500/10"
  },
  {
    icon: Atom,
    title: "3D Görsellerle Anlatır",
    description: "Atom, hücre, DNA gibi soyut kavramları döndürüp inceleyebileceğiniz 3D modellerle gösterir.",
    gradient: "from-green-500 to-emerald-500",
    bgGradient: "from-green-500/10 to-emerald-500/10"
  },
  {
    icon: MessageSquare,
    title: "Sözünü Kesebilirsin",
    description: "Gerçek bir sohbet gibi! Jarvis konuşurken araya girip yeni soru sorabilirsiniz.",
    gradient: "from-blue-500 to-indigo-500",
    bgGradient: "from-blue-500/10 to-indigo-500/10"
  },
  {
    icon: Layers,
    title: "Deneyerek Öğren",
    description: "Elektrik devreleri, atom yapısı, kuvvetler ve daha fazlası için etkileşimli deneyler.",
    gradient: "from-pink-500 to-rose-500",
    bgGradient: "from-pink-500/10 to-rose-500/10"
  }
]

// Neden Jarvis?
const whyJarvis = [
  {
    icon: Brain,
    title: "Seni Tanır",
    description: "Öğrenme tarzını, güçlü ve zayıf yönlerini analiz eder. Her seferinde sana özel ders anlatır."
  },
  {
    icon: Clock,
    title: "7/24 Yanında",
    description: "Gece yarısı bile olsa, sınav öncesi son dakika bile olsa Jarvis her zaman hazır."
  },
  {
    icon: Heart,
    title: "Sabırlı ve Anlayışlı",
    description: "Aynı soruyu 10 kez sorsan bile sabırla açıklar. Asla yargılamaz, hep destekler."
  },
  {
    icon: Trophy,
    title: "Başarıyı Garantiler",
    description: "Zayıf olduğun konuları tespit eder, o konulara odaklanır. Sınav başarın artar."
  }
]

// Nasıl Kullanılır
const howToUse = [
  {
    step: 1,
    title: "Jarvis'i Çağır",
    description: "Sağ alttaki mavi ikona tıkla veya soru çözerken 'Jarvis'e Sor' butonunu kullan.",
    icon: Bot,
    color: "cyan"
  },
  {
    step: 2,
    title: "Sorunu Anlat",
    description: "Yazarak veya sesli olarak Jarvis'e ne öğrenmek istediğini söyle. Türkçe doğal dilde konuş.",
    icon: MessageSquare,
    color: "blue"
  },
  {
    step: 3,
    title: "Dinle ve İzle",
    description: "Jarvis sesli anlatırken, ekranda görsellerle konuyu pekiştir. 3D modelleri döndür, incele.",
    icon: Monitor,
    color: "purple"
  },
  {
    step: 4,
    title: "Öğrenmeye Devam Et",
    description: "'Daha açık anlat', 'Başka örnek ver' veya 'Bu konuyu baştan anlat' diyerek derinleş.",
    icon: Sparkles,
    color: "pink"
  }
]

// SSS
const faqData = [
  {
    question: "Jarvis kimdir?",
    answer: "Jarvis, Teknokul'un geliştirdiği yapay zeka destekli özel ders asistanıdır. Görsel, işitsel ve etkileşimli öğrenme yöntemlerini bir arada kullanarak size en etkili öğrenme deneyimini sunar."
  },
  {
    question: "Jarvis ile nasıl konuşurum?",
    answer: "İki yöntem var: Yazarak - mesaj kutusuna sorunuzu yazın. Sesli - mikrofon simgesine tıklayın ve Türkçe konuşun. Jarvis sizi anlayacak ve sesli olarak cevap verecektir."
  },
  {
    question: "Jarvis matematik sorularını çözebilir mi?",
    answer: "Evet! Jarvis, köklü ifadeler, denklemler, türev, integral ve karmaşık matematiksel işlemleri hatasız hesaplar. Üstelik her adımı teker teker açıklar, sadece sonucu değil mantığı öğretir."
  },
  {
    question: "3D görseller nasıl çalışıyor?",
    answer: "Jarvis, atom, hücre, DNA, geometrik şekiller gibi kavramları 3D olarak gösterir. Bu modelleri parmağınızla veya mouse ile döndürebilir, yakınlaştırabilir ve farklı açılardan inceleyebilirsiniz."
  },
  {
    question: "Jarvis'in sözünü kesebilir miyim?",
    answer: "Evet! Jarvis konuşurken araya girip yeni soru sorabilirsiniz. Bu, gerçek bir öğretmenle konuşuyormuş gibi doğal bir deneyim sağlar. Beklemek zorunda değilsiniz."
  },
  {
    question: "Hangi dersler için kullanabilirim?",
    answer: "Jarvis; Matematik, Fen Bilimleri, Fizik, Kimya, Biyoloji ve Geometri derslerinde özellikle güçlüdür. Her sınıf seviyesi için uygun içerik sunar, LGS ve YKS hazırlığında yanınızda."
  },
  {
    question: "Kredi sistemi nasıl çalışıyor?",
    answer: "Her Jarvis oturumu belirli miktarda kredi kullanır. Yeni kullanıcılar başlangıç kredisi alır. Kredileriniz bittiğinde yeni kredi paketi satın alabilir veya günlük giriş yaparak bonus kredi kazanabilirsiniz."
  }
]

// FAQ Accordion Component
function FAQItem({ question, answer, isOpen, onClick }: { 
  question: string
  answer: string
  isOpen: boolean
  onClick: () => void 
}) {
  return (
    <motion.div 
      className="border border-cyan-200 dark:border-cyan-800 rounded-2xl overflow-hidden bg-white dark:bg-gray-900"
      initial={false}
    >
      <button
        onClick={onClick}
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors"
      >
        <span className="font-semibold text-gray-900 dark:text-white pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-cyan-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-cyan-500 flex-shrink-0" />
        )}
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <p className="px-6 pb-5 text-gray-600 dark:text-gray-400 leading-relaxed">
          {answer}
        </p>
      </motion.div>
    </motion.div>
  )
}

// Jarvis Avatar Animation
function JarvisHeroAvatar() {
  const [pulse, setPulse] = useState(false)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => !p)
    }, 2000)
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="relative">
      {/* Glow rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`absolute w-64 h-64 rounded-full bg-cyan-500/20 ${pulse ? 'scale-110' : 'scale-100'} transition-transform duration-1000`} />
        <div className={`absolute w-48 h-48 rounded-full bg-cyan-500/30 ${pulse ? 'scale-105' : 'scale-100'} transition-transform duration-1000 delay-100`} />
        <div className={`absolute w-32 h-32 rounded-full bg-cyan-500/40 ${pulse ? 'scale-110' : 'scale-100'} transition-transform duration-1000 delay-200`} />
      </div>
      
      {/* Main avatar */}
      <div className="relative w-32 h-32 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-2xl shadow-cyan-500/50">
        <div className="w-28 h-28 bg-gradient-to-br from-slate-900 to-slate-800 rounded-full flex items-center justify-center border-2 border-cyan-400/50">
          <Bot className="w-14 h-14 text-cyan-400" />
        </div>
        
        {/* Online indicator */}
        <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-slate-900 animate-pulse" />
      </div>
    </div>
  )
}

export default function JarvisPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Tekn<span className="text-cyan-400">okul</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-gray-400 hover:text-cyan-400 transition-colors">
                Ana Sayfa
              </Link>
              <Link href="/hizli-coz" className="text-gray-400 hover:text-cyan-400 transition-colors">
                Soru Çöz
              </Link>
              <Link href="/liderlik" className="text-gray-400 hover:text-cyan-400 transition-colors">
                Liderlik
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link href="/giris" className="px-4 py-2 text-gray-300 hover:text-cyan-400 transition-colors font-medium">
                Giriş Yap
              </Link>
              <Link 
                href="/kayit" 
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
              >
                Hemen Dene
              </Link>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-400"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-t border-cyan-500/20 px-4 py-4 space-y-3">
            <Link href="/" className="block py-2 text-gray-400">Ana Sayfa</Link>
            <Link href="/hizli-coz" className="block py-2 text-gray-400">Soru Çöz</Link>
            <Link href="/liderlik" className="block py-2 text-gray-400">Liderlik</Link>
            <div className="pt-3 border-t border-cyan-500/20 space-y-2">
              <Link href="/giris" className="block py-2 text-gray-300 font-medium">Giriş Yap</Link>
              <Link href="/kayit" className="block py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold text-center">
                Hemen Dene
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-full blur-3xl" />
          
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Avatar */}
            <div className="flex justify-center mb-8">
              <JarvisHeroAvatar />
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-400">Yapay Zeka Özel Ders Asistanı</span>
            </div>

            {/* Main Title */}
            <h1 className="text-6xl md:text-8xl font-black mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                JARVIS
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-4 leading-relaxed">
              Kişisel yapay zeka öğretmenin. 
              <span className="text-cyan-400 font-semibold"> Görür, duyar, anlar ve anlatır.</span>
            </p>
            
            <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
              Sesli konuşabilir, 3D görsellerle öğrenebilir, anlamadığın yerde hemen soru sorabilirsin. 
              Sabırlı, anlayışlı ve her zaman yanında.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                href="/ogrenci"
                className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-cyan-500/30 hover:scale-105 transition-all duration-300"
              >
                <Bot className="w-6 h-6 group-hover:scale-110 transition-transform" />
                Jarvis ile Tanış
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#nasil-kullanilir"
                className="flex items-center gap-2 px-8 py-4 bg-white/5 text-gray-300 rounded-2xl font-semibold text-lg border border-cyan-500/30 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all"
              >
                Nasıl Kullanılır?
                <ChevronDown className="w-5 h-5" />
              </Link>
            </div>

            {/* Stats - Kredi vurgusu */}
            <div className="flex flex-wrap items-center justify-center gap-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                <Coins className="w-5 h-5 text-yellow-400" />
                <span className="text-sm font-medium text-gray-300">3 Kredi ile Başla</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                <Clock className="w-5 h-5 text-cyan-400" />
                <span className="text-sm font-medium text-gray-300">7/24 Erişim</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                <Shield className="w-5 h-5 text-green-400" />
                <span className="text-sm font-medium text-gray-300">Güvenli ve Özel</span>
              </div>
            </div>
          </motion.div>

          {/* Demo Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16 relative"
          >
            <div className="relative bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-3xl p-1">
              <div className="bg-slate-900 rounded-3xl overflow-hidden border border-cyan-500/20">
                {/* Browser mockup */}
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-cyan-500/10">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-slate-700 rounded-lg px-4 py-1.5 text-sm text-gray-400">
                      teknokul.com.tr
                    </div>
                  </div>
                </div>
                
                {/* Preview content */}
                <div className="flex h-[400px]">
                  {/* 3D Preview Area */}
                  <div className="w-1/2 border-r border-cyan-500/10 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 relative">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:30px_30px]" />
                    <div className="relative text-center">
                      <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center animate-pulse">
                        <Atom className="w-16 h-16 text-cyan-400" />
                      </div>
                      <p className="text-cyan-400 text-sm font-medium">3D Görsel Alanı</p>
                      <p className="text-gray-500 text-xs mt-1">Döndür, yakınlaştır, incele</p>
                    </div>
                  </div>
                  
                  {/* Chat Area */}
                  <div className="w-1/2 flex flex-col">
                    <div className="flex-1 p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl rounded-tl-md px-4 py-2 max-w-[85%]">
                          <p className="text-gray-200 text-sm">Merhaba! 👋 Ben Jarvis. Bugün hangi konuyu öğrenmek istersin?</p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl rounded-br-md px-4 py-2">
                          <p className="text-white text-sm">Fotosentezi anlat</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl rounded-tl-md px-4 py-2 max-w-[85%]">
                          <p className="text-gray-200 text-sm">Harika seçim! 🌱 Fotosentez, bitkilerin güneş ışığını enerjiye çevirme sürecidir. Sana şimdi bir yaprak modeli göstereyim...</p>
                          <div className="mt-2 flex items-center gap-2 text-cyan-400 text-xs">
                            <Volume2 className="w-3 h-3 animate-pulse" />
                            Sesli anlatıyor...
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Input */}
                    <div className="p-4 border-t border-cyan-500/10">
                      <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-4 py-3 border border-cyan-500/20">
                        <input 
                          type="text" 
                          placeholder="Jarvis'e sor..." 
                          className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-500"
                          disabled
                        />
                        <Mic className="w-5 h-5 text-cyan-400 cursor-pointer hover:text-cyan-300 transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -top-4 -right-4 bg-slate-800 rounded-2xl shadow-xl p-4 border border-cyan-500/20 hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Doğru Cevap!</div>
                  <div className="text-xs text-gray-400">Adım adım açıkladı</div>
                </div>
              </div>
            </div>
            
            <div className="absolute -bottom-4 -left-4 bg-slate-800 rounded-2xl shadow-xl p-4 border border-cyan-500/20 hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                  <Headphones className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Sesli Asistan</div>
                  <div className="text-xs text-gray-400">Doğal Türkçe konuşur</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="ozellikler" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Jarvis <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Neler Yapabilir?</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Bir öğretmenden beklediğin her şey ve daha fazlası.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jarvisFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`group relative p-6 rounded-2xl bg-gradient-to-br ${feature.bgGradient} border border-white/10 hover:border-cyan-500/30 transition-all duration-300`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Jarvis Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Neden <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Jarvis?</span>
            </h2>
            <p className="text-xl text-gray-400">
              Gerçek bir öğretmen gibi, ama daha fazlası.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyJarvis.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-cyan-500/10 rounded-2xl flex items-center justify-center">
                  <item.icon className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How To Use Section */}
      <section id="nasil-kullanilir" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Nasıl Kullanılır?
            </h2>
            <p className="text-xl text-gray-400">
              4 adımda Jarvis ile öğrenmeye başla
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howToUse.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative"
              >
                {/* Connector */}
                {index < howToUse.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-[60%] w-full h-0.5 bg-gradient-to-r from-cyan-500/50 to-transparent" />
                )}
                
                <div className="relative bg-slate-800/50 rounded-2xl p-6 border border-cyan-500/10 hover:border-cyan-500/30 transition-all">
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {item.step}
                  </div>
                  <div className="w-14 h-14 mx-auto mb-4 bg-cyan-500/10 rounded-2xl flex items-center justify-center">
                    <item.icon className="w-7 h-7 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 text-center">{item.title}</h3>
                  <p className="text-gray-400 text-sm text-center">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Sıkça Sorulan Sorular
            </h2>
            <p className="text-xl text-gray-400">
              Jarvis hakkında merak edilenler
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <FAQItem
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openFAQ === index}
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-700 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Bot className="w-16 h-16 text-white/80 mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Jarvis Seni Bekliyor!
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Yapay zeka destekli özel ders deneyimini şimdi keşfet. 
              Kayıt ol, sorularını sor, öğrenmeye başla.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/kayit"
                className="group flex items-center gap-3 px-8 py-4 bg-white text-cyan-600 rounded-2xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                <Rocket className="w-6 h-6" />
                Hemen Başla
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/giris"
                className="flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur text-white rounded-2xl font-semibold text-lg border-2 border-white/30 hover:bg-white/20 transition-all"
              >
                Giriş Yap
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center justify-center gap-8 mt-12">
              <div className="text-center">
                <div className="text-4xl font-bold text-white">🎓</div>
                <div className="text-white/70 text-sm mt-1">LGS & YKS Hazırlık</div>
              </div>
              <div className="w-px h-12 bg-white/30 hidden sm:block" />
              <div className="text-center">
                <div className="text-4xl font-bold text-white">7/24</div>
                <div className="text-white/70 text-sm">Her An Hazır</div>
              </div>
              <div className="w-px h-12 bg-white/30 hidden sm:block" />
              <div className="text-center">
                <div className="text-4xl font-bold text-white">🎯</div>
                <div className="text-white/70 text-sm">Kişiye Özel</div>
              </div>
              <div className="w-px h-12 bg-white/30 hidden sm:block" />
              <div className="text-center">
                <div className="text-4xl font-bold text-white">💬</div>
                <div className="text-white/70 text-sm">Sesli Sohbet</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-slate-950 border-t border-cyan-500/10 text-center">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">
              Tekn<span className="text-cyan-400">okul</span>
            </span>
          </Link>
          <p className="text-gray-500 text-sm">
            © 2026 Teknokul. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  )
}

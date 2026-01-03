'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  GraduationCap, 
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
  TrendingUp,
  Menu,
  X
} from 'lucide-react'

// FAQ Data
const faqData = [
  {
    question: "TeknoÖğretmen'in sesi neden bu kadar gerçekçi geliyor?",
    answer: "Sistemimizde dünyanın en gelişmiş ses teknolojisi olan ElevenLabs kullanılmaktadır. Bu teknoloji, robotik ve tekdüze seslerin aksine, insan konuşmasındaki vurguları, duyguları ve doğal duraksamaları taklit edebilir. Böylece ders dinlerken bir robotla değil, gerçek bir öğretmenle konuşuyormuş gibi hissedersiniz."
  },
  {
    question: "Akıllı Tahta üzerindeki bilgiler neye göre değişiyor?",
    answer: "Hocamız ders anlatırken, yapay zeka arka planda konuşulanları anlık olarak analiz eder. Gemini 2.0 Flash zekası, anlatılan konunun en kritik noktalarını saniyeler içinde görsel kartlara, formüllere veya şemalara dönüştürerek sol taraftaki panelinize (Akıllı Tahta) yansıtır."
  },
  {
    question: "Bir soruyu yanlış çözdüğümde ne olur?",
    answer: "TeknoÖğretmen sadece \"Yanlış cevap\" demez. 60.000 soruluk dev havuzumuzda bir tarama yaparak, o soruda neden hata yapmış olabileceğinizi analiz eder. Ardından Akıllı Tahta'ya benzer bir örnek getirerek, konuyu o an anlamanızı sağlayacak özel bir açıklama yapar."
  },
  {
    question: "TeknoÖğretmen benim öğrenme geçmişimi hatırlıyor mu?",
    answer: "Evet! Sistemimiz Supabase tabanlı akıllı bir hafızaya sahiptir. Bir sonraki dersinize girdiğinizde, hocanız sizi isminizle karşılar ve \"Dün üslü sayılarda kalmıştık, hadi devam edelim\" diyerek kaldığınız yerden dersi başlatır."
  },
  {
    question: "Bu sistem sınav başarımı nasıl artırır?",
    answer: "Geleneksel yöntemlerin aksine TeknoÖğretmen, sadece doğru cevabı değil, doğru düşünme mantığını öğretmeye odaklanır. Görsel ve işitsel öğrenmeyi birleştiren bu hibrit yapı, bilgilerin kalıcı hafızaya çok daha hızlı yerleşmesini sağlar."
  }
]

// Feature Cards Data
const features = [
  {
    icon: Volume2,
    title: "İnsansı Ses",
    subtitle: "ElevenLabs Teknolojisi",
    description: "Robotik seslerin ötesinde, vurgu yapan, motive eden, samimi bir iletişim kuran gerçek öğretmen deneyimi.",
    gradient: "from-purple-500 to-pink-500",
    bgGradient: "from-purple-500/10 to-pink-500/10"
  },
  {
    icon: Monitor,
    title: "Akıllı Tahta",
    subtitle: "Görsel Öğrenme",
    description: "Ders anlatılırken formüller, kronolojiler ve uyarılar şık kartlar halinde eş zamanlı olarak tahtaya yansır.",
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-500/10 to-cyan-500/10"
  },
  {
    icon: Brain,
    title: "60.000+ Soru",
    subtitle: "Analitik Zeka",
    description: "Hatanın kökenini bulan, benzer sorularla konuyu pekiştiren vektör tabanlı yapay zeka sistemi.",
    gradient: "from-orange-500 to-red-500",
    bgGradient: "from-orange-500/10 to-red-500/10"
  },
  {
    icon: Clock,
    title: "7/24 Erişim",
    subtitle: "Her An Yanınızda",
    description: "Gece yarısı bile olsa, sizi tanıyan ve gelişiminizi takip eden kişisel öğretmeniniz hazır.",
    gradient: "from-green-500 to-emerald-500",
    bgGradient: "from-green-500/10 to-emerald-500/10"
  }
]

// How It Works Steps
const steps = [
  {
    number: "1",
    title: "Dersi Başlat",
    description: "Tek tıkla TeknoÖğretmen'i çağır, seni isminle karşılasın.",
    icon: Play
  },
  {
    number: "2",
    title: "Dinle ve İzle",
    description: "Sesli anlatımı dinlerken Akıllı Tahta'da görsel içerikleri takip et.",
    icon: Monitor
  },
  {
    number: "3",
    title: "Soru Sor",
    description: "Anlamadığın yerde hemen sor, anında kişiselleştirilmiş açıklama al.",
    icon: MessageSquare
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
      className="border border-purple-200 dark:border-purple-800 rounded-2xl overflow-hidden bg-white dark:bg-gray-900"
      initial={false}
    >
      <button
        onClick={onClick}
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
      >
        <span className="font-semibold text-gray-900 dark:text-white pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-purple-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-purple-500 flex-shrink-0" />
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

export default function TeknoOgretmenPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Tekn<span className="text-indigo-500">okul</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-indigo-500 transition-colors">
                Ana Sayfa
              </Link>
              <Link href="/hizli-coz" className="text-gray-600 dark:text-gray-400 hover:text-indigo-500 transition-colors">
                Soru Çöz
              </Link>
              <Link href="/liderlik" className="text-gray-600 dark:text-gray-400 hover:text-indigo-500 transition-colors">
                Liderlik
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link href="/giris" className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-indigo-500 transition-colors font-medium">
                Giriş Yap
              </Link>
              <Link 
                href="/kayit" 
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all"
              >
                Ücretsiz Başla
              </Link>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-400"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-4 space-y-3">
            <Link href="/" className="block py-2 text-gray-600 dark:text-gray-400">Ana Sayfa</Link>
            <Link href="/hizli-coz" className="block py-2 text-gray-600 dark:text-gray-400">Soru Çöz</Link>
            <Link href="/liderlik" className="block py-2 text-gray-600 dark:text-gray-400">Liderlik</Link>
            <div className="pt-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
              <Link href="/giris" className="block py-2 text-gray-700 dark:text-gray-300 font-medium">Giriş Yap</Link>
              <Link href="/kayit" className="block py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white rounded-xl font-semibold text-center">
                Ücretsiz Başla
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Geleceğin Eğitim Teknolojisi</span>
            </div>

            {/* Main Title */}
            <h1 className="text-5xl md:text-7xl font-black mb-6">
              <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
                TeknoÖğretmen
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8 leading-relaxed">
              Dünyanın en gelişmiş yapay zeka modelleriyle güçlendirilmiş, 
              <span className="text-purple-600 font-semibold"> size özel </span> 
              kişisel öğretmeniniz.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                href="/ogrenci"
                className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-purple-500/30 hover:scale-105 transition-all duration-300"
              >
                <Play className="w-6 h-6 group-hover:scale-110 transition-transform" />
                Dersi Başlat
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#ozellikler"
                className="flex items-center gap-2 px-8 py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-semibold text-lg border-2 border-gray-200 dark:border-gray-700 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
              >
                Keşfet
                <ChevronDown className="w-5 h-5" />
              </Link>
            </div>

            {/* Tech Stack Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-md">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Zap className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Gemini 3 Flash</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-md">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <Volume2 className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ElevenLabs TTS</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-md">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                  <Brain className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">RAG Vektör Arama</span>
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
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-2 shadow-2xl shadow-purple-500/20">
              <div className="bg-gray-900 rounded-2xl overflow-hidden">
                {/* Mock Browser Bar */}
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-700 rounded-lg px-4 py-1.5 text-sm text-gray-400">
                      teknokul.com.tr/tekno-ogretmen
                    </div>
                  </div>
                </div>
                
                {/* Mock App UI */}
                <div className="flex h-[400px]">
                  {/* Smart Board Preview */}
                  <div className="w-1/3 border-r border-gray-700 p-4 space-y-3">
                    <div className="text-xs text-purple-400 font-medium mb-2">📋 Akıllı Tahta</div>
                    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-3 border border-purple-500/30">
                      <div className="text-xs text-purple-300 mb-1">📐 Formül</div>
                      <div className="text-white font-mono text-sm">a² + b² = c²</div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-3 border border-blue-500/30">
                      <div className="text-xs text-blue-300 mb-1">📝 Adımlar</div>
                      <div className="text-white text-xs space-y-1">
                        <div>1. Dik kenarları bul</div>
                        <div>2. Karelerini topla</div>
                        <div>3. Karekök al</div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-3 border border-yellow-500/30">
                      <div className="text-xs text-yellow-300 mb-1">💡 İpucu</div>
                      <div className="text-white text-xs">Hipotenüs her zaman en uzun kenardır!</div>
                    </div>
                  </div>
                  
                  {/* Chat Preview */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex-1 p-4 space-y-3">
                      <div className="flex justify-start">
                        <div className="bg-gray-700 rounded-2xl rounded-bl-md px-4 py-2 max-w-[80%]">
                          <p className="text-white text-sm">Merhaba Ahmet! 👋 Bugün Pisagor teoremini öğreneceğiz. Hazır mısın?</p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className="bg-purple-600 rounded-2xl rounded-br-md px-4 py-2">
                          <p className="text-white text-sm">Evet, hazırım hocam!</p>
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-gray-700 rounded-2xl rounded-bl-md px-4 py-2 max-w-[80%]">
                          <p className="text-white text-sm">Harika! Dikdörtgen üçgenlerde, dik kenarların karelerinin toplamı, hipotenüsün karesine eşittir.</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Input */}
                    <div className="p-4 border-t border-gray-700">
                      <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-4 py-3">
                        <input 
                          type="text" 
                          placeholder="Mesajınızı yazın..." 
                          className="flex-1 bg-transparent text-white text-sm outline-none"
                          disabled
                        />
                        <Mic className="w-5 h-5 text-purple-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">Konu Anlaşıldı!</div>
                  <div className="text-xs text-gray-500">+50 XP Kazanıldı</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="ozellikler" className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Neden <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">TeknoÖğretmen</span>?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Geleneksel eğitimde gözden kaçan detaylar, Teknokul'da yapay zekanın dikkatinden kaçmaz.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`group relative p-8 rounded-3xl bg-gradient-to-br ${feature.bgGradient} border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300`}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">{feature.subtitle}</div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-purple-50 to-white dark:from-purple-950/20 dark:to-gray-900">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Nasıl Çalışır?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              3 basit adımda kişisel öğretmeninle tanış
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-full h-0.5 bg-gradient-to-r from-purple-300 to-transparent dark:from-purple-700" />
                )}
                
                <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl text-center">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {step.number}
                  </div>
                  <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 rounded-2xl flex items-center justify-center">
                    <step.icon className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Sıkça Sorulan Sorular
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              TeknoÖğretmen hakkında merak edilenler
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
      <section className="py-20 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 relative overflow-hidden">
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
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Öğrenmeye Hazır mısın?
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              7/24 yanınızda olan, sizi tanıyan ve gelişiminizi her saniye takip eden bir öğretmenle tanışmak için dersi başlatmanız yeterli!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/kayit"
                className="group flex items-center gap-3 px-8 py-4 bg-white text-purple-600 rounded-2xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                <Sparkles className="w-6 h-6" />
                Ücretsiz Başla
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
                <div className="text-4xl font-bold text-white">60.000+</div>
                <div className="text-white/70 text-sm">Soru</div>
              </div>
              <div className="w-px h-12 bg-white/30 hidden sm:block" />
              <div className="text-center">
                <div className="text-4xl font-bold text-white">7/24</div>
                <div className="text-white/70 text-sm">Erişim</div>
              </div>
              <div className="w-px h-12 bg-white/30 hidden sm:block" />
              <div className="text-center">
                <div className="text-4xl font-bold text-white">%100</div>
                <div className="text-white/70 text-sm">Kişiselleştirilmiş</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-center">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">
              Tekn<span className="text-indigo-400">okul</span>
            </span>
          </Link>
          <p className="text-gray-500 text-sm">
            © 2025 Teknokul. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  )
}

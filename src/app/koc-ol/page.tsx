'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  GraduationCap, 
  Users, 
  Brain, 
  TrendingUp, 
  Star, 
  CheckCircle,
  ArrowRight,
  Sparkles,
  Target,
  Trophy,
  BarChart3,
  MessageSquare,
  Calendar,
  Wallet,
  Shield,
  Clock,
  Award,
  Zap,
  BookOpen,
  PieChart,
  UserPlus,
  ChevronRight,
  Play,
  XCircle,
  Check,
  Rocket,
  Heart,
  Globe,
  Laptop,
  BadgeCheck
} from 'lucide-react'

// Geleneksel vs Teknokul karşılaştırması
const comparisons = [
  { traditional: 'Sınırlı öğrenci kapasitesi (5-10 kişi)', teknokul: 'Sınırsız öğrenci yönetimi' },
  { traditional: 'Manuel ödev hazırlama (saatler)', teknokul: 'AI ile saniyeler içinde ödev oluşturma' },
  { traditional: 'Kağıt-kalem takip sistemi', teknokul: 'Otomatik performans raporları' },
  { traditional: 'Velilere tek tek bilgi verme', teknokul: 'Anlık veli bilgilendirme sistemi' },
  { traditional: 'Fiziksel ders zorunluluğu', teknokul: 'Online + offline hibrit model' },
  { traditional: 'Gelir takibi zorluğu', teknokul: 'Şeffaf kazanç takip paneli' },
]

const features = [
  {
    icon: Brain,
    title: 'AI Asistan',
    description: 'Yapay zeka ile saniyeler içinde ödev, sınav ve çalışma planı oluşturun. Öğrenci analizleri otomatik hazırlansın.',
    color: 'from-purple-500 to-violet-600',
    highlight: 'En Popüler'
  },
  {
    icon: Users,
    title: 'Sınıf Yönetimi',
    description: 'Sınırsız sınıf oluşturun, öğrencileri gruplandırın. Toplu ödev atama ve takip sistemi.',
    color: 'from-blue-500 to-indigo-600',
    highlight: null
  },
  {
    icon: BarChart3,
    title: 'Analitik Dashboard',
    description: 'Her öğrencinin güçlü/zayıf yönlerini grafiklerle görün. Haftalık gelişim raporları.',
    color: 'from-emerald-500 to-teal-600',
    highlight: null
  },
  {
    icon: Target,
    title: '10.000+ Soru Bankası',
    description: 'MEB müfredatına uygun, zorluk seviyelerine göre ayrılmış devasa soru havuzu.',
    color: 'from-orange-500 to-amber-600',
    highlight: null
  },
  {
    icon: Trophy,
    title: 'Oyunlaştırma',
    description: 'Liderlik tablosu, rozetler ve ödüllerle öğrenci motivasyonunu zirveye taşıyın.',
    color: 'from-yellow-500 to-amber-600',
    highlight: null
  },
  {
    icon: MessageSquare,
    title: 'İletişim Merkezi',
    description: 'Öğrenci ve velilerle anlık mesajlaşma. Otomatik bildirim sistemi.',
    color: 'from-pink-500 to-rose-600',
    highlight: null
  },
]

const painPoints = [
  {
    icon: Clock,
    problem: 'Ödev hazırlamak saatlerimi alıyor',
    solution: 'AI ile 30 saniyede ödev oluşturun'
  },
  {
    icon: Users,
    problem: 'Çok fazla öğrenciyi takip edemiyorum',
    solution: 'Otomatik performans takibi ve raporlama'
  },
  {
    icon: BarChart3,
    problem: 'Velilere düzenli rapor vermek zor',
    solution: 'Tek tıkla veli raporu gönderme'
  },
  {
    icon: Wallet,
    problem: 'Kazancımı takip etmek karmaşık',
    solution: 'Şeffaf gelir takip paneli'
  },
]

const stats = [
  { value: '500+', label: 'Aktif Koç', icon: Users },
  { value: '10,000+', label: 'Öğrenci', icon: GraduationCap },
  { value: '%95', label: 'Memnuniyet', icon: Heart },
  { value: '1M+', label: 'Çözülen Soru', icon: Target },
]

const testimonials = [
  {
    name: 'Ayşe Yılmaz',
    role: 'Matematik Öğretmeni - 8 yıl deneyim',
    content: 'Teknokul\'a geçmeden önce en fazla 15 öğrenciyle çalışabiliyordum. Şimdi 50\'den fazla öğrencim var ve hepsine kaliteli eğitim verebiliyorum. AI araçları hayatımı değiştirdi!',
    rating: 5,
    students: 52,
    improvement: '%45 başarı artışı'
  },
  {
    name: 'Mehmet Kaya',
    role: 'Fen Bilimleri Koçu - 12 yıl deneyim',
    content: 'Öğrenci takip sistemi inanılmaz. Hangi öğrencim hangi konuda zorlanıyor anında görüyorum. Veliler de çok memnun, düzenli rapor alıyorlar.',
    rating: 5,
    students: 38,
    improvement: '%52 başarı artışı'
  },
  {
    name: 'Zeynep Demir',
    role: 'İngilizce Eğitmeni - 6 yıl deneyim',
    content: 'Liderlik sistemi öğrencilerimin motivasyonunu inanılmaz artırdı. Birbirleriyle yarışıyorlar ve daha çok çalışıyorlar. Harika bir platform!',
    rating: 5,
    students: 45,
    improvement: '%38 başarı artışı'
  },
]

const guarantees = [
  { icon: Shield, text: 'Ücretsiz başlangıç - kredi kartı gerekmez' },
  { icon: BadgeCheck, text: '14 gün içinde memnun kalmazsan iptal' },
  { icon: Zap, text: '7/24 teknik destek' },
  { icon: Globe, text: 'Her cihazdan erişim' },
]

export default function KocOlPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-surface-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">
                Tekn<span className="text-primary-500">okul</span>
              </span>
            </Link>
            
            <div className="flex items-center gap-3">
              <Link href="/giris" className="text-surface-600 hover:text-primary-500 font-medium transition-colors">
                Giriş Yap
              </Link>
              <Link 
                href="/kayit?role=ogretmen" 
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Ücretsiz Başla
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Urgency Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 rounded-full text-sm font-medium mb-6">
                <Rocket className="w-4 h-4" />
                Bu ay 47 yeni koç katıldı - Sen de aramıza katıl!
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-surface-900 mb-6 leading-tight">
                Öğretmenliğini
                <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent"> Süper Güce</span> Dönüştür
              </h1>
              
              <p className="text-xl text-surface-600 mb-8 leading-relaxed max-w-3xl mx-auto">
                <strong>Daha fazla öğrenci, daha az iş yükü, daha yüksek kazanç.</strong> AI destekli araçlarla 
                öğretmenliğinizi ölçeklendirin. Türkiye&apos;nin en gelişmiş eğitim koçluğu platformuna 
                <span className="text-emerald-600 font-semibold"> ücretsiz</span> katılın.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link 
                  href="/kayit?role=ogretmen"
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-semibold text-lg hover:shadow-xl hover:shadow-emerald-500/30 transition-all"
                >
                  <UserPlus className="w-5 h-5" />
                  Ücretsiz Hesap Oluştur
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link 
                  href="#features"
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-surface-200 text-surface-700 rounded-2xl font-semibold text-lg hover:border-emerald-300 hover:bg-emerald-50 transition-all"
                >
                  <Play className="w-5 h-5" />
                  Özellikleri Keşfet
                </Link>
              </div>
              
              {/* Guarantees */}
              <div className="flex flex-wrap justify-center gap-4 mb-12">
                {guarantees.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-surface-600">
                    <item.icon className="w-4 h-4 text-emerald-500" />
                    {item.text}
                  </div>
                ))}
              </div>
            </motion.div>
            
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="bg-white rounded-2xl p-5 shadow-lg shadow-surface-200/50 border border-surface-100"
                >
                  <stat.icon className="w-6 h-6 text-emerald-500 mb-2 mx-auto" />
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-surface-500 text-sm font-medium">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem-Solution Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 mb-4">
              Bu Sorunları Yaşıyor musun?
            </h2>
            <p className="text-lg text-surface-600">
              Teknokul ile hepsinin çözümü var
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {painPoints.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-surface-50 to-white rounded-2xl p-6 border border-surface-100"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-surface-600 line-through mb-3">{item.problem}</p>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      <p className="text-emerald-700 font-semibold">{item.solution}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-surface-900 to-surface-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Geleneksel Öğretmenlik vs Teknokul Koçluğu
            </h2>
            <p className="text-lg text-surface-300">
              Farkı kendin gör
            </p>
          </div>
          
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="grid grid-cols-2">
              <div className="bg-surface-100 p-4 text-center font-bold text-surface-600">
                ❌ Geleneksel
              </div>
              <div className="bg-emerald-500 p-4 text-center font-bold text-white">
                ✅ Teknokul
              </div>
            </div>
            {comparisons.map((item, index) => (
              <div key={index} className="grid grid-cols-2 border-t border-surface-100">
                <div className="p-4 text-surface-600 text-sm md:text-base flex items-center">
                  {item.traditional}
                </div>
                <div className="p-4 bg-emerald-50 text-emerald-700 font-medium text-sm md:text-base flex items-center">
                  {item.teknokul}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 mb-4">
                Seni Bekleyen Süper Güçler
              </h2>
              <p className="text-lg text-surface-600 max-w-2xl mx-auto">
                Rakiplerinin sahip olmadığı araçlarla öğretmenliğini zirveye taşı
              </p>
            </motion.div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-surface-50 hover:bg-white rounded-2xl p-6 border border-surface-100 hover:border-surface-200 hover:shadow-xl transition-all duration-300"
              >
                {feature.highlight && (
                  <div className="absolute -top-3 right-4 px-3 py-1 bg-gradient-to-r from-purple-500 to-violet-600 text-white text-xs font-bold rounded-full">
                    {feature.highlight}
                  </div>
                )}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-surface-900 mb-2">{feature.title}</h3>
                <p className="text-surface-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-surface-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 mb-4">
              Koçlarımızın Başarı Hikayeleri
            </h2>
            <p className="text-lg text-surface-600">
              Gerçek sonuçlar, gerçek insanlar
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-surface-100"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-surface-600 mb-6 italic">&quot;{testimonial.content}&quot;</p>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-6 p-3 bg-emerald-50 rounded-xl">
                  <div className="text-center">
                    <div className="text-xl font-bold text-emerald-600">{testimonial.students}</div>
                    <div className="text-xs text-surface-500">Öğrenci</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-emerald-600">{testimonial.improvement}</div>
                    <div className="text-xs text-surface-500">Başarı Artışı</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold text-surface-900">{testimonial.name}</div>
                    <div className="text-sm text-surface-500">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gradient-to-br from-emerald-500 to-teal-600">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              3 Adımda Başla
            </h2>
            <p className="text-emerald-100 text-lg">
              5 dakikada koçluğa başlayabilirsin
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: 1, title: 'Ücretsiz Kayıt Ol', desc: 'E-posta ve şifre ile anında hesap oluştur', icon: UserPlus },
              { step: 2, title: 'Profilini Oluştur', desc: 'Uzmanlık alanlarını ve deneyimini ekle', icon: BookOpen },
              { step: 3, title: 'Öğrenci Kabul Et', desc: 'Sınıflarını oluştur ve koçluğa başla', icon: Rocket },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-emerald-500" />
                </div>
                <div className="text-4xl font-bold text-white/30 mb-2">{item.step}</div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-emerald-100">{item.desc}</p>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link 
              href="/kayit?role=ogretmen"
              className="inline-flex items-center gap-2 px-10 py-4 bg-white text-emerald-600 rounded-2xl font-semibold text-lg hover:shadow-xl transition-all"
            >
              <UserPlus className="w-5 h-5" />
              Hemen Ücretsiz Başla
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium mb-6">
              <Clock className="w-4 h-4" />
              Sınırlı Süre: İlk 100 koça özel avantajlar
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 mb-6">
              Hâlâ Düşünüyor musun?
            </h2>
            <p className="text-lg text-surface-600 mb-8 max-w-2xl mx-auto">
              Her geçen gün, rakiplerin AI araçlarıyla daha fazla öğrenciye ulaşıyor. 
              <strong> Ücretsiz başla, risk yok.</strong> Beğenmezsen istediğin zaman çık.
            </p>
            
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 mb-8">
              <div className="flex flex-wrap justify-center gap-6 mb-6">
                {[
                  'Kredi kartı gerekmez',
                  'Anında erişim',
                  'Tüm özellikler dahil'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-emerald-700">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
              
              <Link 
                href="/kayit?role=ogretmen"
                className="inline-flex items-center gap-2 px-12 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-bold text-xl hover:shadow-2xl hover:shadow-emerald-500/30 transition-all"
              >
                <UserPlus className="w-6 h-6" />
                Ücretsiz Koç Hesabı Oluştur
                <ArrowRight className="w-6 h-6" />
              </Link>
            </div>
            
            <p className="text-sm text-surface-500">
              500+ öğretmen Teknokul&apos;a güveniyor
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">
                Tekn<span className="text-primary-400">okul</span>
              </span>
            </Link>
            <div className="flex items-center gap-6 text-sm text-surface-400">
              <Link href="/yasal/gizlilik" className="hover:text-white transition-colors">Gizlilik</Link>
              <Link href="/yasal/kullanim-kosullari" className="hover:text-white transition-colors">Kullanım Koşulları</Link>
              <Link href="/yasal/kvkk" className="hover:text-white transition-colors">KVKK</Link>
            </div>
            <p className="text-sm text-surface-400">
              © 2026 Teknokul. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

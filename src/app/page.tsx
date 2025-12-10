'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { stats, testimonials, activityMessages, universities, demoCoaches } from '@/lib/demoData'
import { 
  GraduationCap, 
  Users, 
  Brain, 
  TrendingUp, 
  Star, 
  CheckCircle,
  ArrowRight,
  Sparkles,
  BookOpen,
  Clock,
  Award,
  Play,
  ChevronRight,
  Menu,
  X,
  Quote,
  Zap,
  Target,
  UserPlus,
  FileText,
  Trophy
} from 'lucide-react'

const features = [
  {
    icon: Users,
    title: 'Koç Eşleşmesi',
    description: 'Sana en uygun eğitim koçunu bul, başvur ve kişisel rehberlik al.',
    color: 'text-primary-500',
    bg: 'bg-primary-50',
  },
  {
    icon: Brain,
    title: 'AI Destekli Öneriler',
    description: 'Yapay zeka eksiklerini tespit eder, sana özel öneriler sunar.',
    color: 'text-accent-500',
    bg: 'bg-accent-50',
  },
  {
    icon: TrendingUp,
    title: 'Gelişim Takibi',
    description: 'Deneme sonuçları, görevler ve ilerlemen tek panelde.',
    color: 'text-secondary-500',
    bg: 'bg-secondary-50',
  },
]

// Activity Feed Component
function ActivityFeed() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activityMessages.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'match': return <Users className="w-4 h-4" />
      case 'score': return <TrendingUp className="w-4 h-4" />
      case 'task': return <CheckCircle className="w-4 h-4" />
      case 'register': return <UserPlus className="w-4 h-4" />
      case 'exam': return <FileText className="w-4 h-4" />
      case 'trophy': return <Trophy className="w-4 h-4" />
      case 'message': return <Sparkles className="w-4 h-4" />
      case 'plan': return <Target className="w-4 h-4" />
      default: return <Zap className="w-4 h-4" />
    }
  }

  return (
    <div className="fixed bottom-6 left-6 z-40 hidden lg:block">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-surface-100 p-4 max-w-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white">
              {getIcon(activityMessages[currentIndex].icon)}
            </div>
            <div>
              <p className="text-sm text-surface-900">
                <span className="font-semibold">{activityMessages[currentIndex].name}</span>{' '}
                {activityMessages[currentIndex].action}
              </p>
              <p className="text-xs text-surface-400">{activityMessages[currentIndex].time}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default function HomePage() {
  const [coaches, setCoaches] = useState<any[]>([])
  const [loadingCoaches, setLoadingCoaches] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [testimonialIndex, setTestimonialIndex] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    loadFeaturedCoaches()
  }, [])

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  async function loadFeaturedCoaches() {
    const { data: coachData } = await supabase
      .from('teacher_profiles')
      .select(`
        *,
        profile:profiles!teacher_profiles_user_id_fkey(id, full_name, avatar_url)
      `)
      .eq('is_coach', true)
      .eq('is_listed', true)
      .limit(6)

    if (coachData && coachData.length > 0) {
      const coachesWithReviews = await Promise.all(coachData.map(async (coach) => {
        const { data: reviews } = await supabase
          .from('reviews')
          .select('overall_rating')
          .eq('teacher_id', coach.id)
          .eq('is_approved', true)

        const reviewCount = reviews?.length || 0
        const avgRating = reviewCount > 0
          ? reviews!.reduce((acc, r) => acc + r.overall_rating, 0) / reviewCount
          : 0

        return { ...coach, reviewCount, avgRating }
      }))

      setCoaches(coachesWithReviews)
    } else {
      // Veritabanında koç yoksa demo koçları göster
      setCoaches(demoCoaches.slice(0, 6).map((coach, i) => ({
        id: `demo-${i}`,
        ...coach,
        profile: { full_name: coach.full_name, avatar_url: null },
        avgRating: coach.rating,
        reviewCount: coach.review_count,
        isDemo: true,
      })))
    }
    setLoadingCoaches(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-white">
      {/* Activity Feed */}
      <ActivityFeed />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-surface-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">
                Tekno<span className="text-primary-500">kul</span>
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="/koclar" className="text-surface-600 hover:text-primary-500 font-medium transition-colors">
                Koçlar
              </Link>
              <Link href="/materyaller" className="text-surface-600 hover:text-primary-500 font-medium transition-colors">
                Materyaller
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Link href="/giris" className="btn btn-ghost btn-md">
                Giriş Yap
              </Link>
              <Link href="/kayit" className="btn btn-primary btn-md">
                Ücretsiz Başla
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-surface-600 hover:bg-surface-100 rounded-xl"
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
            className="md:hidden bg-white border-b border-surface-100 px-4 py-4"
          >
            <div className="space-y-3">
              <Link 
                href="/koclar" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-surface-600 hover:bg-surface-50 rounded-xl font-medium"
              >
                Koçlar
              </Link>
              <Link 
                href="/materyaller" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-surface-600 hover:bg-surface-50 rounded-xl font-medium"
              >
                Materyaller
              </Link>
              <div className="pt-3 border-t border-surface-100 space-y-2">
                <Link href="/giris" className="btn btn-ghost btn-md w-full">
                  Giriş Yap
                </Link>
                <Link href="/kayit" className="btn btn-primary btn-md w-full">
                  Ücretsiz Başla
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI Destekli Eğitim Koçluğu
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-surface-900 mb-6 leading-tight">
              Eğitim Yolculuğunda
              <br />
              <span className="text-primary-500">Koçun Yanında</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-surface-600 max-w-2xl mx-auto mb-8">
              Kişisel eğitim koçunla hedeflerine ulaş. AI destekli öneriler, 
              görev takibi ve gelişim raporları ile fark yarat.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/kayit" className="btn btn-primary btn-lg">
                Ücretsiz Başla
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/koclar" className="btn btn-outline btn-lg">
                Koçları Keşfet
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Band */}
      <section className="py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl shadow-xl border border-surface-100 p-6 sm:p-8"
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-surface-500 text-sm sm:text-base mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Coaches */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-surface-900 mb-2">
                Öne Çıkan Koçlar
              </h2>
              <p className="text-surface-600">
                Deneyimli eğitim koçlarımızla tanışın
              </p>
            </div>
            <Link href="/koclar" className="btn btn-outline btn-md hidden sm:flex">
              Tümünü Gör
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          {loadingCoaches ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {coaches.map((coach, index) => (
                <motion.div
                  key={coach.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Link href={coach.isDemo ? '#' : `/koclar/${coach.id}`}>
                    <div className="card group hover:shadow-xl transition-all duration-300 overflow-hidden">
                      {/* Header */}
                      <div className="relative h-32 bg-gradient-to-br from-primary-100 to-accent-100">
                        {coach.video_url && (
                          <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 text-white text-xs rounded-full flex items-center gap-1">
                            <Play className="w-3 h-3" />
                            Video
                          </div>
                        )}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                          <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg overflow-hidden border-4 border-white">
                            {coach.profile?.avatar_url ? (
                              <img src={coach.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              getInitials(coach.profile?.full_name || coach.full_name)
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="pt-12 p-5 text-center">
                        <h3 className="text-lg font-bold text-surface-900 mb-1 group-hover:text-primary-600 transition-colors">
                          {coach.profile?.full_name || coach.full_name}
                        </h3>
                        <p className="text-surface-500 text-sm mb-3 line-clamp-1">
                          {coach.headline || 'Eğitim Koçu'}
                        </p>

                        {/* Specializations */}
                        {coach.specializations && coach.specializations.length > 0 && (
                          <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                            {coach.specializations.slice(0, 2).map((spec: string, i: number) => (
                              <span 
                                key={i}
                                className="px-2 py-0.5 bg-primary-50 text-primary-600 text-xs font-medium rounded-full"
                              >
                                {spec}
                              </span>
                            ))}
                            {coach.specializations.length > 2 && (
                              <span className="px-2 py-0.5 bg-surface-100 text-surface-500 text-xs rounded-full">
                                +{coach.specializations.length - 2}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Stats */}
                        <div className="flex items-center justify-center gap-4 pt-4 border-t border-surface-100">
                          <div className="flex items-center gap-1">
                            <Star className={`w-4 h-4 ${coach.avgRating > 0 ? 'text-yellow-400 fill-yellow-400' : 'text-surface-300'}`} />
                            <span className="font-medium text-surface-900">
                              {coach.avgRating > 0 ? coach.avgRating.toFixed(1) : '-'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-surface-500 text-sm">
                            <Clock className="w-4 h-4" />
                            {coach.experience_years || 0} yıl
                          </div>
                          {(coach.reviewCount || coach.review_count) > 0 && (
                            <div className="flex items-center gap-1 text-surface-500 text-sm">
                              <Users className="w-4 h-4" />
                              {coach.reviewCount || coach.review_count}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Link href="/koclar" className="btn btn-outline btn-md">
              Tüm Koçları Gör
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-surface-900 mb-4">
              Başarı Hikayeleri
            </h2>
            <p className="text-surface-600 max-w-2xl mx-auto">
              Öğrencilerimizin deneyimlerini okuyun
            </p>
          </div>
          
          {/* Testimonial Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {testimonials.slice(0, 3).map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card p-6 bg-white"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                
                <Quote className="w-8 h-8 text-primary-200 mb-3" />
                
                <p className="text-surface-700 mb-4 line-clamp-4">
                  "{testimonial.text}"
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-surface-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {getInitials(testimonial.name)}
                    </div>
                    <div>
                      <div className="font-medium text-surface-900">{testimonial.name}</div>
                      <div className="text-xs text-surface-500">{testimonial.school}</div>
                    </div>
                  </div>
                  <div className="px-2 py-1 bg-green-50 text-green-600 text-xs font-medium rounded-full">
                    {testimonial.improvement}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Scrolling Testimonial */}
          <div className="relative overflow-hidden bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={testimonialIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col sm:flex-row items-center gap-6"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-accent-400 to-accent-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                  {getInitials(testimonials[testimonialIndex].name)}
                </div>
                <div className="text-center sm:text-left flex-1">
                  <p className="text-lg text-surface-700 mb-3">
                    "{testimonials[testimonialIndex].text}"
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-3">
                    <div>
                      <span className="font-semibold text-surface-900">{testimonials[testimonialIndex].name}</span>
                      <span className="text-surface-400 mx-2">•</span>
                      <span className="text-surface-500">{testimonials[testimonialIndex].school}</span>
                    </div>
                    <span className="px-3 py-1 bg-primary-50 text-primary-600 text-sm font-medium rounded-full">
                      {testimonials[testimonialIndex].examType}
                    </span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            
            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTestimonialIndex(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === testimonialIndex ? 'bg-primary-500' : 'bg-surface-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-surface-900 mb-4">
              Neden Teknokul?
            </h2>
            <p className="text-surface-600 max-w-2xl mx-auto">
              Geleneksel eğitimden farklı, kişiselleştirilmiş ve AI destekli bir deneyim
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card p-6 hover:shadow-lg transition-shadow"
              >
                <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-surface-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-surface-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* University Logos */}
      <section className="py-12 px-4 bg-surface-50 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-surface-500 text-sm font-medium">
              Öğrencilerimizin hedeflediği üniversiteler
            </p>
          </div>
          
          {/* Infinite scroll logos */}
          <div className="relative">
            <div className="flex animate-marquee gap-8">
              {[...universities, ...universities].map((uni, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-24 h-16 bg-white rounded-xl shadow-sm border border-surface-100 flex items-center justify-center"
                >
                  <span className="font-bold text-surface-400 text-lg">{uni.abbr}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-surface-900 mb-4">
              Nasıl Çalışır?
            </h2>
            <p className="text-surface-600 max-w-2xl mx-auto">
              3 adımda eğitim koçunla tanış ve gelişimini başlat
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Koçunu Seç', desc: 'İlanları incele, profillerini oku, sana uygun koçu bul.' },
              { step: '2', title: 'Başvuru Yap', desc: 'Tek tıkla başvur, koçunla iletişime geç ve anlaş.' },
              { step: '3', title: 'Gelişmeye Başla', desc: 'Görevleri tamamla, denemelerini yükle, ilerlemeyi takip et.' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-primary-500 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-surface-900 mb-2">{item.title}</h3>
                <p className="text-surface-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="card p-8 sm:p-12 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Hemen Başla, Ücretsiz!
            </h2>
            <p className="text-primary-100 mb-6 max-w-xl mx-auto">
              Koçunu bul, görevlerini tamamla, gelişimini takip et. 
              Tüm özellikler şu an ücretsiz!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/kayit" className="btn bg-white text-primary-600 hover:bg-primary-50 btn-lg">
                Ücretsiz Kayıt Ol
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/koclar" className="btn border-2 border-white text-white hover:bg-white/10 btn-lg">
                Koçları İncele
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-surface-100 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">
                  Tekno<span className="text-primary-500">kul</span>
                </span>
              </Link>
              <p className="text-surface-500 text-sm">
                AI destekli eğitim koçluğu platformu
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-surface-900 mb-4">Platform</h4>
              <ul className="space-y-2 text-surface-600">
                <li><Link href="/koclar" className="hover:text-primary-500">Koçlar</Link></li>
                <li><Link href="/materyaller" className="hover:text-primary-500">Materyaller</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-surface-900 mb-4">Hesap</h4>
              <ul className="space-y-2 text-surface-600">
                <li><Link href="/giris" className="hover:text-primary-500">Giriş Yap</Link></li>
                <li><Link href="/kayit" className="hover:text-primary-500">Kayıt Ol</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-surface-900 mb-4">Roller</h4>
              <ul className="space-y-2 text-surface-600">
                <li><Link href="/kayit?role=ogrenci" className="hover:text-primary-500">Öğrenci Ol</Link></li>
                <li><Link href="/kayit?role=ogretmen" className="hover:text-primary-500">Koç Ol</Link></li>
                <li><Link href="/kayit?role=veli" className="hover:text-primary-500">Veli Ol</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-surface-100 text-center text-surface-500 text-sm">
            © 2024 Teknokul. Tüm hakları saklıdır.
          </div>
        </div>
      </footer>

      {/* Custom styles for marquee animation */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  )
}

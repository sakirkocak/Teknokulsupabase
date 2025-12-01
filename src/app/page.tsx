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
  Sparkles
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

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-white">
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
            
            <div className="flex items-center gap-4">
              <Link href="/giris" className="btn btn-ghost btn-md">
                Giriş Yap
              </Link>
              <Link href="/kayit" className="btn btn-primary btn-md">
                Ücretsiz Başla
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
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
            <Link href="/kayit" className="btn bg-white text-primary-600 hover:bg-primary-50 btn-lg">
              Ücretsiz Kayıt Ol
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-surface-100">
        <div className="max-w-7xl mx-auto text-center text-surface-500 text-sm">
          © 2024 Teknokul. Tüm hakları saklıdır.
        </div>
      </footer>
    </div>
  )
}


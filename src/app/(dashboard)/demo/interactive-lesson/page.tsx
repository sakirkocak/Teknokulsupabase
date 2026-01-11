'use client'

/**
 * 🎓 İnteraktif Ders Demo Sayfası
 * 
 * Three.js ile interaktif geometri dersi prototipi
 */

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { 
  Sparkles, 
  BookOpen, 
  Target, 
  Zap, 
  ArrowRight,
  Triangle,
  Circle,
  Square,
  Hexagon,
  Hand,
  Camera
} from 'lucide-react'
import Link from 'next/link'

// Three.js komponentini dinamik import (SSR devre dışı)
const GeometryLessonPlayer = dynamic(
  () => import('@/components/interactive-lessons/GeometryLessonPlayer'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[700px] bg-slate-900 rounded-2xl flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">3D Sahne Yükleniyor...</p>
        </div>
      </div>
    )
  }
)

// Particle Playground
const ParticlePlayground = dynamic(
  () => import('@/components/interactive-lessons/ParticlePlayground'),
  { ssr: false }
)

// Holographic Lesson - Iron Man Jarvis Style
const HolographicLesson = dynamic(
  () => import('@/components/interactive-lessons/HolographicLesson'),
  { ssr: false }
)

// Touch Screen Lesson - Dokunmatik Ekran Tarzı
const TouchScreenLesson = dynamic(
  () => import('@/components/interactive-lessons/TouchScreenLesson'),
  { ssr: false }
)

// Natural Interaction - Gerçek Hayat Gibi
const NaturalInteractionLesson = dynamic(
  () => import('@/components/interactive-lessons/NaturalInteractionLesson'),
  { ssr: false }
)

// Pro Lesson - Profesyonel El Takibi
const ProLesson = dynamic(
  () => import('@/components/interactive-lessons/ProLesson'),
  { ssr: false }
)

// Jarvis Education - Zero UI
const JarvisEducation = dynamic(
  () => import('@/components/interactive-lessons/JarvisEducation'),
  { ssr: false }
)

// Mevcut ders konuları
const AVAILABLE_LESSONS = [
  {
    id: 'triangle-area',
    title: 'Üçgenin Alanı',
    icon: Triangle,
    subject: 'Geometri',
    grade: '6-7',
    duration: '3 dk',
    description: 'Üçgenin alan formülünü 3D interaktif olarak öğren',
    color: 'from-indigo-500 to-purple-500',
    available: true
  },
  {
    id: 'prism-volume',
    title: 'Prizmanın Hacmi',
    icon: Hexagon,
    subject: 'Geometri',
    grade: '7-8',
    duration: '4 dk',
    description: '3D prizma modeliyle hacim hesaplama',
    color: 'from-emerald-500 to-teal-500',
    available: false
  },
  {
    id: 'circle-area',
    title: 'Dairenin Alanı',
    icon: Circle,
    subject: 'Geometri',
    grade: '6-7',
    duration: '3 dk',
    description: 'Pi sayısı ve daire alanı ilişkisi',
    color: 'from-amber-500 to-orange-500',
    available: false
  },
  {
    id: 'rectangle-area',
    title: 'Dikdörtgenin Alanı',
    icon: Square,
    subject: 'Geometri',
    grade: '5-6',
    duration: '2 dk',
    description: 'Temel alan kavramına giriş',
    color: 'from-pink-500 to-rose-500',
    available: false
  }
]

export default function InteractiveLessonDemo() {
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null)
  const [showPlayer, setShowPlayer] = useState(false)
  const [showParticlePlayground, setShowParticlePlayground] = useState(false)
  const [showHolographicMode, setShowHolographicMode] = useState(false)
  const [showTouchScreenMode, setShowTouchScreenMode] = useState(false)
  const [showNaturalMode, setShowNaturalMode] = useState(false)
  const [showProMode, setShowProMode] = useState(false)
  const [showJarvisMode, setShowJarvisMode] = useState(false)

  const handleStartLesson = (lessonId: string) => {
    setSelectedLesson(lessonId)
    setShowPlayer(true)
  }

  const handleClosePlayer = () => {
    setShowPlayer(false)
    setSelectedLesson(null)
  }

  const handleComplete = () => {
    // Ders tamamlandığında
    console.log('Ders tamamlandı!')
  }

  // Jarvis Mode açıksa
  if (showJarvisMode) {
    return <JarvisEducation onClose={() => setShowJarvisMode(false)} />
  }
  
  // Natural Mode açıksa
  if (showNaturalMode) {
    return <NaturalInteractionLesson onClose={() => setShowNaturalMode(false)} />
  }
  
  // Touch Screen Mode açıksa
  if (showTouchScreenMode) {
    return <TouchScreenLesson onClose={() => setShowTouchScreenMode(false)} />
  }
  
  // Holographic Mode açıksa
  if (showHolographicMode) {
    return <HolographicLesson onClose={() => setShowHolographicMode(false)} />
  }
  
  // Particle Playground açıksa
  if (showParticlePlayground) {
    return <ParticlePlayground onClose={() => setShowParticlePlayground(false)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">İnteraktif Dersler</h1>
                <p className="text-slate-400 text-sm">Three.js Prototipi</p>
              </div>
            </div>
            <Link 
              href="/demo/interactive-solution"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition-colors"
            >
              Video Çözümlere Git →
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Player veya Ders Listesi */}
        {showPlayer ? (
          <div className="space-y-4">
            <button
              onClick={handleClosePlayer}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              ← Ders Listesine Dön
            </button>
            
            <GeometryLessonPlayer
              onComplete={handleComplete}
              onClose={handleClosePlayer}
            />
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded-full mb-4">
                <Zap className="w-4 h-4 text-indigo-400" />
                <span className="text-indigo-300 text-sm font-medium">Yeni Nesil Öğrenme</span>
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">
                3D İnteraktif Konu Anlatımı
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto mb-6">
                Video izlemek yerine, 3D modelleri döndür, manipüle et ve konuyu gerçekten anla.
                Three.js ile oluşturulan bu interaktif dersler sayesinde geometri hiç bu kadar eğlenceli olmamıştı!
              </p>
              
              {/* Ana Butonlar */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center flex-wrap">
                {/* Ana Buton - JARVIS */}
                <button
                  onClick={() => setShowJarvisMode(true)}
                  className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-600 hover:via-blue-600 hover:to-purple-600 rounded-2xl text-white font-bold text-xl transition-all transform hover:scale-105 shadow-2xl shadow-cyan-500/50 border border-cyan-400/30 animate-pulse"
                >
                  <span className="text-3xl">🤖</span>
                  JARVIS
                </button>
                
                <button
                  onClick={() => setShowNaturalMode(true)}
                  className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-2xl text-white font-bold transition-all transform hover:scale-105 shadow-xl"
                >
                  <span className="text-xl">🌟</span>
                  Natural
                </button>
                
                <button
                  onClick={() => setShowParticlePlayground(true)}
                  className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 rounded-2xl text-white font-bold transition-all transform hover:scale-105 shadow-xl"
                >
                  <span className="text-xl">✨</span>
                  Particle
                </button>
              </div>
              <p className="text-cyan-400 text-sm mt-3">
                🤖 Zero UI - Mıknatıs, Pinch, Push/Pull
              </p>
            </div>

            {/* Özellikler */}
            <div className="grid md:grid-cols-4 gap-6 mb-12">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Target className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">İnteraktif 3D</h3>
                <p className="text-slate-400 text-sm">Şekilleri döndür, yakınlaş ve farklı açılardan incele</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Adım Adım Anlatım</h3>
                <p className="text-slate-400 text-sm">Sesli açıklamalar ve görsel ipuçlarıyla kolay öğrenme</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Anlık Hesaplama</h3>
                <p className="text-slate-400 text-sm">Değerleri değiştirince sonuçları canlı olarak gör</p>
              </div>
              <div className="bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 border border-cyan-500/30 rounded-xl p-6 text-center relative overflow-hidden">
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-purple-500 rounded text-[10px] text-white font-bold animate-pulse">JARVIS!</div>
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl">
                  🤖
                </div>
                <h3 className="text-white font-semibold mb-2">🤖 Zero UI</h3>
                <p className="text-slate-400 text-sm">Mıknatıs + Pinch + Push/Pull</p>
              </div>
            </div>

            {/* JARVIS Açıklama */}
            <div className="mb-12 p-6 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-cyan-500/20 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 rounded-2xl flex items-center justify-center flex-shrink-0 text-4xl">
                  🤖
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-bold text-lg mb-2">🤖 JARVIS - Zero UI, Tam Sezgisel</h4>
                  <p className="text-slate-400 text-sm mb-4">
                    Hiçbir buton yok, hiçbir menü yok. Sadece sen ve asistan. Sistem niyetini anlıyor.
                    One Euro Filter ile cam gibi pürüzsüz hareket. İtme/çekme ile doğal navigasyon.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-300 bg-slate-800/50 rounded-lg p-3">
                      <span className="text-2xl">🧲</span>
                      <div>
                        <div className="font-medium text-white">Mıknatıs Efekti</div>
                        <div className="text-xs text-slate-400">Yaklaş, otomatik yapış</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300 bg-slate-800/50 rounded-lg p-3">
                      <span className="text-2xl">🤏</span>
                      <div>
                        <div className="font-medium text-white">Pinch</div>
                        <div className="text-xs text-slate-400">Tut, döndür, ölçekle</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300 bg-slate-800/50 rounded-lg p-3">
                      <span className="text-2xl">👉👈</span>
                      <div>
                        <div className="font-medium text-white">Push / Pull</div>
                        <div className="text-xs text-slate-400">İt = İleri, Çek = Geri</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ders Kartları */}
            <h3 className="text-xl font-bold text-white mb-6">📚 Mevcut Dersler</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {AVAILABLE_LESSONS.map(lesson => {
                const Icon = lesson.icon
                return (
                  <div
                    key={lesson.id}
                    className={`relative bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden group ${
                      lesson.available ? 'cursor-pointer hover:border-indigo-500/50' : 'opacity-60'
                    }`}
                    onClick={() => lesson.available && handleStartLesson(lesson.id)}
                  >
                    {/* Gradient header */}
                    <div className={`h-24 bg-gradient-to-br ${lesson.color} flex items-center justify-center`}>
                      <Icon className="w-12 h-12 text-white/80" />
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300">
                          {lesson.subject}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300">
                          {lesson.grade}. Sınıf
                        </span>
                      </div>
                      <h4 className="text-white font-semibold mb-1">{lesson.title}</h4>
                      <p className="text-slate-400 text-sm mb-3">{lesson.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-xs">⏱️ {lesson.duration}</span>
                        {lesson.available ? (
                          <span className="flex items-center gap-1 text-indigo-400 text-sm font-medium group-hover:gap-2 transition-all">
                            Başla <ArrowRight className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">Yakında</span>
                        )}
                      </div>
                    </div>

                    {/* Yakında badge */}
                    {!lesson.available && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-slate-900/80 rounded text-xs text-slate-400">
                        🚧 Yapım Aşamasında
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Footer Info */}
            <div className="mt-12 p-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">🚀 Prototip Hakkında</h4>
                  <p className="text-slate-400 text-sm">
                    Bu sayfa, Three.js ve React Three Fiber kullanılarak oluşturulmuş bir interaktif ders prototipidir.
                    İlerleyen aşamalarda tüm derslere (Fizik, Kimya, Biyoloji vb.) benzer interaktif içerikler eklenecek.
                    Öğrenciler video izlemek yerine, konuyu "yaşayarak" öğrenecek!
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

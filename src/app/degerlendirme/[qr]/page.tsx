'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot,
  Lightbulb,
  BookOpen,
  Paintbrush,
  Cog,
  Star,
  Check,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Trophy,
  AlertCircle,
  User
} from 'lucide-react'
import Link from 'next/link'

interface Robot {
  id: string
  robot_number: number
  image_url: string | null
}

interface Category {
  id: string
  title: string
  subtitle: string
  icon: typeof Bot
  color: string
  bgColor: string
  criteria: { key: string; label: string; description: string }[]
}

const CATEGORIES: Category[] = [
  {
    id: 'inovatif_tasarim',
    title: '1. En İnovatif Tasarım',
    subtitle: 'Yaratıcılık & Mühendislik',
    icon: Lightbulb,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    criteria: [
      { key: 'malzeme_donusumu', label: 'Malzeme Dönüşümü', description: 'Sıradan atık malzeme şaşırtıcı bir parça olarak kullanılmış mı?' },
      { key: 'cozum_odaklilik', label: 'Çözüm Odaklılık', description: 'Robotun ayakta durması veya parçaların birleşmesi için zekice çözüm var mı?' },
      { key: 'ozgunluk', label: 'Özgünlük', description: 'Tasarım bilinen robot kalıplarının dışına çıkabilmiş mi?' },
    ]
  },
  {
    id: 'en_iyi_hikaye',
    title: '2. En İyi Hikaye',
    subtitle: 'Senaryo & Kimlik',
    icon: BookOpen,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    criteria: [
      { key: 'robot_kunyesi', label: 'Robot Künyesi', description: 'Robotun bir adı, yapım yılı ve üretim yeri gibi detayları var mı?' },
      { key: 'gorev_tanimi', label: 'Görev Tanımı', description: 'Robot ne işe yarıyor? (Örn: "Yaşlılara yardım eden robot")' },
    ]
  },
  {
    id: 'estetik_iscilik',
    title: '3. Estetik ve İşçilik',
    subtitle: 'Görsel Tasarım',
    icon: Paintbrush,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    criteria: [
      { key: 'temiz_iscilik', label: 'Temiz İşçilik', description: 'Silikon/yapıştırıcı izleri, yamuk kesilmiş kartonlar var mı?' },
      { key: 'denge_durus', label: 'Denge ve Duruş', description: 'Robot desteksiz ayakta durabiliyor mu? Parçalar orantılı mı?' },
      { key: 'renk_gorunum', label: 'Renk ve Görünüm', description: 'Boyama yapıldıysa özenli mi? Renkler uyumlu mu?' },
    ]
  },
  {
    id: 'hareketli_robot',
    title: '4. Hareketli Robot',
    subtitle: 'Teknik Mekanizma - Bonus',
    icon: Cog,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    criteria: [
      { key: 'mekanizma_kullanimi', label: 'Mekanizma Kullanımı', description: 'DC motor, basit elektrik devresi veya hidrolik sistem var mı?' },
      { key: 'islevsellik', label: 'İşlevsellik', description: 'Kurulan sistem sorunsuz çalışıyor mu?' },
    ]
  }
]

export default function DegerlendirmePage() {
  const params = useParams()
  const router = useRouter()
  const qrCode = params.qr as string
  
  const [robot, setRobot] = useState<Robot | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [teacherName, setTeacherName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showNameModal, setShowNameModal] = useState(true)
  
  const supabase = createClient()
  const currentCategory = CATEGORIES[currentCategoryIndex]

  useEffect(() => {
    loadRobot()
  }, [qrCode])

  async function loadRobot() {
    const { data, error } = await supabase
      .from('robots')
      .select('*')
      .eq('qr_code', qrCode)
      .single()

    if (error || !data) {
      console.error('❌ Robot bulunamadı:', error)
      setNotFound(true)
      setLoading(false)
      return
    }

    setRobot(data)
    setLoading(false)
  }

  function setScore(criteriaKey: string, score: number) {
    setScores(prev => ({ ...prev, [criteriaKey]: score }))
  }

  function isCategoryComplete(category: Category): boolean {
    return category.criteria.every(c => scores[c.key] !== undefined)
  }

  function canProceed(): boolean {
    return isCategoryComplete(currentCategory)
  }

  async function submitEvaluation() {
    if (!robot || !teacherName.trim()) return
    
    setSubmitting(true)

    try {
      // Her kategori için ayrı kayıt oluştur
      for (const category of CATEGORIES) {
        // Bu kategoride en az bir puan verilmiş mi kontrol et
        const hasScores = category.criteria.some(c => scores[c.key] !== undefined)
        if (!hasScores) continue

        const evaluationData: Record<string, unknown> = {
          robot_id: robot.id,
          teacher_name: teacherName.trim(),
          category: category.id,
        }

        // Kriterleri ekle
        category.criteria.forEach(c => {
          if (scores[c.key] !== undefined) {
            evaluationData[c.key] = scores[c.key]
          }
        })

        const { error } = await supabase
          .from('robot_evaluations')
          .insert(evaluationData)

        if (error) {
          // Duplicate error'ı yoksay
          if (!error.message.includes('duplicate')) {
            console.error('❌ Değerlendirme kaydedilemedi:', error)
          }
        }
      }

      setSubmitted(true)
    } catch (error) {
      console.error('❌ Hata:', error)
      alert('Değerlendirme kaydedilirken bir hata oluştu')
    }

    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-surface-900 mb-2">Robot Bulunamadı</h1>
          <p className="text-surface-600 mb-6">Bu QR kod geçersiz veya robot silinmiş olabilir.</p>
          <Link href="/" className="btn-primary">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-surface-900 mb-2">Teşekkürler!</h1>
          <p className="text-surface-600 mb-6">
            Robot #{robot?.robot_number} için değerlendirmeniz kaydedildi.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/robot-senligi/sonuclar" className="btn-primary flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Sonuçları Gör
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary"
            >
              Yeni Değerlendirme
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-blue-50">
      {/* Teacher Name Modal */}
      <AnimatePresence>
        {showNameModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-primary-600" />
                </div>
                <h2 className="text-xl font-bold text-surface-900">Değerlendirmeye Başla</h2>
                <p className="text-surface-600 mt-1">Robot #{robot?.robot_number} için değerlendirme yapacaksınız</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-surface-700 mb-1">
                  Adınız Soyadınız
                </label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="Örn: Ahmet Yılmaz"
                  className="input w-full"
                  autoFocus
                />
              </div>

              <button
                onClick={() => {
                  if (teacherName.trim()) {
                    setShowNameModal(false)
                  }
                }}
                disabled={!teacherName.trim()}
                className="btn-primary w-full"
              >
                Değerlendirmeye Başla
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {robot?.image_url ? (
                <img
                  src={robot.image_url}
                  alt={`Robot ${robot.robot_number}`}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-surface-100 rounded-lg flex items-center justify-center">
                  <Bot className="w-6 h-6 text-surface-400" />
                </div>
              )}
              <div>
                <h1 className="font-bold text-surface-900">Robot #{robot?.robot_number}</h1>
                <p className="text-sm text-surface-500">Değerlendirici: {teacherName}</p>
              </div>
            </div>
            
            {/* Progress */}
            <div className="text-right">
              <div className="text-sm font-medium text-surface-600">
                {currentCategoryIndex + 1} / {CATEGORIES.length}
              </div>
              <div className="flex gap-1 mt-1">
                {CATEGORIES.map((cat, i) => (
                  <div
                    key={cat.id}
                    className={`w-8 h-1.5 rounded-full transition-colors ${
                      i < currentCategoryIndex
                        ? 'bg-green-500'
                        : i === currentCategoryIndex
                        ? 'bg-primary-500'
                        : 'bg-surface-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCategory.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Category Header */}
            <div className={`card p-6 ${currentCategory.bgColor}`}>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm`}>
                  <currentCategory.icon className={`w-7 h-7 ${currentCategory.color}`} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-surface-900">{currentCategory.title}</h2>
                  <p className="text-surface-600">{currentCategory.subtitle}</p>
                </div>
              </div>
            </div>

            {/* Criteria */}
            <div className="space-y-4">
              {currentCategory.criteria.map((criteria) => (
                <div key={criteria.key} className="card p-5">
                  <div className="mb-3">
                    <h3 className="font-semibold text-surface-900">{criteria.label}</h3>
                    <p className="text-sm text-surface-500">{criteria.description}</p>
                  </div>
                  
                  {/* Star Rating */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                      <button
                        key={score}
                        onClick={() => setScore(criteria.key, score)}
                        className={`p-1 transition-all ${
                          scores[criteria.key] >= score
                            ? 'text-amber-400 scale-110'
                            : 'text-surface-300 hover:text-amber-300'
                        }`}
                      >
                        <Star
                          className="w-6 h-6"
                          fill={scores[criteria.key] >= score ? 'currentColor' : 'none'}
                        />
                      </button>
                    ))}
                    <span className="ml-3 text-lg font-bold text-surface-900">
                      {scores[criteria.key] || '-'}/10
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation - Mobile friendly, buttons on left side */}
            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={() => setCurrentCategoryIndex(i => i - 1)}
                disabled={currentCategoryIndex === 0}
                className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:invisible"
              >
                <ChevronLeft className="w-5 h-5" />
                Önceki
              </button>

              {currentCategoryIndex < CATEGORIES.length - 1 ? (
                <button
                  onClick={() => setCurrentCategoryIndex(i => i + 1)}
                  disabled={!canProceed()}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  Sonraki
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={submitEvaluation}
                  disabled={!canProceed() || submitting}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                  Tamamla
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

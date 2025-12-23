'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { 
  Calendar,
  Clock,
  ArrowLeft,
  GraduationCap,
  BookOpen,
  Briefcase,
  Globe,
  Target,
  Bell,
  ChevronRight,
  Sparkles,
  Zap,
  Timer,
  Star,
  TrendingUp
} from 'lucide-react'

interface ExamDate {
  id: string
  title: string
  description: string | null
  exam_date: string
  exam_type: string
  is_active: boolean
  is_featured: boolean
  featured_order: number
  color: string
  icon: string
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

const iconOptions: Record<string, any> = {
  'graduation-cap': GraduationCap,
  'book-open': BookOpen,
  'briefcase': Briefcase,
  'globe': Globe,
  'target': Target,
  'calendar': Calendar,
}

function getTimeLeft(targetDate: string): TimeLeft {
  const now = new Date().getTime()
  const target = new Date(targetDate).getTime()
  const difference = target - now

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((difference % (1000 * 60)) / 1000),
    total: difference
  }
}

// Big Hero Countdown for main exam
function HeroCountdown({ exam }: { exam: ExamDate }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft(exam.exam_date))
  const IconComponent = iconOptions[exam.icon] || Calendar

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(exam.exam_date))
    }, 1000)
    return () => clearInterval(timer)
  }, [exam.exam_date])

  const isPast = timeLeft.total <= 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-10"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute -top-1/2 -right-1/2 w-full h-full rounded-full opacity-20"
          style={{ background: `radial-gradient(circle, ${exam.color} 0%, transparent 70%)` }}
        />
        <div 
          className="absolute -bottom-1/2 -left-1/2 w-full h-full rounded-full opacity-10"
          style={{ background: `radial-gradient(circle, ${exam.color} 0%, transparent 70%)` }}
        />
        {/* Floating particles */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{ backgroundColor: exam.color, opacity: 0.3 }}
            initial={{ 
              x: `${20 + i * 15}%`, 
              y: `${80}%`,
            }}
            animate={{ 
              y: [null, '-100%'],
              opacity: [0.3, 0]
            }}
            transition={{ 
              duration: 4 + i, 
              repeat: Infinity,
              delay: i * 0.8 
            }}
          />
        ))}
      </div>

      <div className="relative">
        {/* Badge */}
        <div className="flex items-center gap-2 mb-6">
          <div 
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
            style={{ backgroundColor: exam.color + '30', color: exam.color }}
          >
            <Sparkles className="w-4 h-4" />
            En Önemli Sınav
          </div>
        </div>

        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <motion.div 
            className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center shadow-2xl"
            style={{ backgroundColor: exam.color }}
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            <IconComponent className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </motion.div>
          <div>
            <h2 className="text-2xl md:text-4xl font-black text-white mb-1">{exam.title}</h2>
            {exam.description && (
              <p className="text-slate-400 text-sm md:text-base max-w-xl">{exam.description}</p>
            )}
          </div>
        </div>

        {/* Big Countdown */}
        {!isPast ? (
          <div className="grid grid-cols-4 gap-3 md:gap-5 mb-8">
            {[
              { value: timeLeft.days, label: 'GÜN' },
              { value: timeLeft.hours, label: 'SAAT' },
              { value: timeLeft.minutes, label: 'DAKİKA' },
              { value: timeLeft.seconds, label: 'SANİYE' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div 
                  className="rounded-2xl p-3 md:p-5 text-center relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${exam.color}20 0%, ${exam.color}10 100%)`,
                    border: `1px solid ${exam.color}30`
                  }}
                >
                  <motion.div 
                    className="text-3xl md:text-6xl font-black text-white tabular-nums"
                    key={item.value}
                    initial={{ scale: 1.1, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 500 }}
                  >
                    {String(item.value).padStart(2, '0')}
                  </motion.div>
                  <div className="text-[10px] md:text-xs text-slate-400 mt-1 tracking-widest font-semibold">
                    {item.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 mb-8">
            <div className="text-2xl font-bold text-slate-500">Sınav Tamamlandı</div>
          </div>
        )}

        {/* Date Info */}
        <div className="flex flex-wrap items-center gap-4 md:gap-6 text-slate-400">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" style={{ color: exam.color }} />
            <span className="font-medium text-white">
              {new Date(exam.exam_date).toLocaleDateString('tr-TR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" style={{ color: exam.color }} />
            <span className="font-medium text-white">
              {new Date(exam.exam_date).toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Medium card for other featured exams
function FeaturedCard({ exam, index }: { exam: ExamDate, index: number }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft(exam.exam_date))
  const IconComponent = iconOptions[exam.icon] || Calendar

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(exam.exam_date))
    }, 1000)
    return () => clearInterval(timer)
  }, [exam.exam_date])

  const isPast = timeLeft.total <= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl border border-surface-200 p-5 shadow-sm hover:shadow-xl transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
          style={{ backgroundColor: exam.color }}
        >
          <IconComponent className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-surface-900 truncate">{exam.title}</h3>
          <p className="text-sm text-surface-500">
            {new Date(exam.exam_date).toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Mini Countdown */}
      {!isPast ? (
        <div className="grid grid-cols-4 gap-2">
          {[
            { value: timeLeft.days, label: 'Gün' },
            { value: timeLeft.hours, label: 'Saat' },
            { value: timeLeft.minutes, label: 'Dk' },
            { value: timeLeft.seconds, label: 'Sn' },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div 
                className="rounded-lg py-2 font-bold text-lg tabular-nums"
                style={{ backgroundColor: exam.color + '15', color: exam.color }}
              >
                {String(item.value).padStart(2, '0')}
              </div>
              <span className="text-[10px] text-surface-400 font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-3 text-surface-400 text-sm font-medium bg-surface-50 rounded-lg">
          Tamamlandı
        </div>
      )}
    </motion.div>
  )
}

// Compact card for other exams
function ExamListItem({ exam }: { exam: ExamDate }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft(exam.exam_date))
  const IconComponent = iconOptions[exam.icon] || Calendar

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(exam.exam_date))
    }, 60000) // Update every minute for list items
    return () => clearInterval(timer)
  }, [exam.exam_date])

  const isPast = timeLeft.total <= 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={{ x: 4 }}
      className="flex items-center gap-4 p-4 bg-white rounded-xl border border-surface-100 hover:border-surface-200 hover:shadow-sm transition-all"
    >
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: exam.color + '15', color: exam.color }}
      >
        <IconComponent className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-surface-900 text-sm truncate">{exam.title}</h4>
        <div className="flex items-center gap-2 text-xs text-surface-500">
          <span>
            {new Date(exam.exam_date).toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </span>
        </div>
      </div>
      {!isPast ? (
        <div className="text-right shrink-0">
          <div className="font-bold text-sm" style={{ color: exam.color }}>
            {timeLeft.days} gün
          </div>
          <div className="text-xs text-surface-400">
            {timeLeft.hours} saat
          </div>
        </div>
      ) : (
        <div className="text-xs text-surface-400 font-medium">Tamamlandı</div>
      )}
      <ChevronRight className="w-4 h-4 text-surface-300 shrink-0" />
    </motion.div>
  )
}

export default function ExamCalendarPage() {
  const [exams, setExams] = useState<ExamDate[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const supabase = createClient()

  useEffect(() => {
    loadExams()
  }, [])

  async function loadExams() {
    const { data } = await supabase
      .from('exam_dates')
      .select('*')
      .eq('is_active', true)
      .order('exam_date', { ascending: true })

    if (data) {
      setExams(data)
    }
    setLoading(false)
  }

  // Get featured exams sorted by order (only upcoming)
  const featuredExams = exams
    .filter(e => e.is_featured && new Date(e.exam_date).getTime() > Date.now())
    .sort((a, b) => a.featured_order - b.featured_order)

  // Main exam (first featured)
  const mainExam = featuredExams[0]
  
  // Other featured exams
  const otherFeaturedExams = featuredExams.slice(1)

  // Get other exams (not featured)
  const otherExams = exams.filter(e => !e.is_featured && new Date(e.exam_date).getTime() > Date.now())

  // Filter by exam type
  const filteredOtherExams = filter === 'all' 
    ? otherExams 
    : otherExams.filter(e => e.exam_type === filter)

  // Get unique exam types
  const examTypes = Array.from(new Set(otherExams.map(e => e.exam_type)))

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Ana Sayfa
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white">
                2026 Sınav Takvimi
              </h1>
              <p className="text-white/70 text-sm mt-1">
                Tüm sınavlar için canlı geri sayım
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Zap className="w-4 h-4 text-yellow-300" />
              <span className="text-white text-sm font-medium">{exams.filter(e => new Date(e.exam_date) > new Date()).length} Sınav</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : exams.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-surface-300" />
            <h2 className="text-xl font-bold text-surface-900 mb-2">Henüz sınav tarihi eklenmemiş</h2>
            <p className="text-surface-500">Yakında önemli sınav tarihleri burada görünecek.</p>
          </div>
        ) : (
          <>
            {/* Main Featured Exam - Big Countdown */}
            {mainExam && (
              <div className="mb-8">
                <HeroCountdown exam={mainExam} />
              </div>
            )}

            {/* Other Featured Exams */}
            {otherFeaturedExams.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <h2 className="text-lg font-bold text-surface-900">Diğer Önemli Sınavlar</h2>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {otherFeaturedExams.map((exam, index) => (
                    <FeaturedCard key={exam.id} exam={exam} index={index} />
                  ))}
                </div>
              </div>
            )}

            {/* All Other Exams */}
            {otherExams.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-surface-400" />
                    <h2 className="text-lg font-bold text-surface-900">
                      Tüm Sınavlar
                    </h2>
                    <span className="text-sm text-surface-400">({filteredOtherExams.length})</span>
                  </div>
                </div>

                {/* Filter Pills */}
                {examTypes.length > 1 && (
                  <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                    <button
                      onClick={() => setFilter('all')}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                        filter === 'all'
                          ? 'bg-surface-900 text-white'
                          : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                      }`}
                    >
                      Tümü
                    </button>
                    {examTypes.slice(0, 10).map(type => (
                      <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                          filter === type
                            ? 'bg-surface-900 text-white'
                            : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                        }`}
                      >
                        {type.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}

                {/* Exam List */}
                <div className="grid md:grid-cols-2 gap-3">
                  {filteredOtherExams.map((exam) => (
                    <ExamListItem key={exam.id} exam={exam} />
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 text-center"
            >
              <div className="inline-flex flex-col items-center bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-surface-900 mb-2">
                  Sınavlara Hazırlan!
                </h3>
                <p className="text-surface-600 mb-4 max-w-md text-sm">
                  Teknokul ile binlerce soru çöz, koçlardan destek al ve hedefine ulaş!
                </p>
                <Link 
                  href="/kayit" 
                  className="btn bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg"
                >
                  Ücretsiz Başla
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}

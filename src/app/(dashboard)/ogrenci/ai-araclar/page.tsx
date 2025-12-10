'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useStudentProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { 
  Brain,
  Sparkles,
  Target,
  BookOpen,
  Lightbulb,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  X,
  Camera,
  MessageCircle,
  BarChart3,
  Calendar,
  ArrowRight
} from 'lucide-react'

export default function StudentAIToolsPage() {
  const { profile, loading: profileLoading } = useProfile()
  const { studentProfile, loading: studentLoading } = useStudentProfile(profile?.id || '')
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [examStats, setExamStats] = useState<{ count: number, avgNet: number, weakTopics: string[] }>({ count: 0, avgNet: 0, weakTopics: [] })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (studentProfile?.id) {
      loadData()
    }
  }, [studentProfile?.id])

  async function loadData() {
    setLoading(true)

    // AI önerilerini yükle
    const { data: recData } = await supabase
      .from('ai_recommendations')
      .select('*')
      .eq('student_id', studentProfile?.id)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })

    if (recData) {
      setRecommendations(recData)
    }

    // Deneme istatistiklerini yükle
    const { data: examData } = await supabase
      .from('exam_results')
      .select('*')
      .eq('student_id', studentProfile?.id)
      .order('exam_date', { ascending: false })

    if (examData && examData.length > 0) {
      const avgNet = examData.reduce((acc, e) => acc + (e.net_score || 0), 0) / examData.length
      const allWeakTopics = new Set<string>()
      examData.forEach(exam => {
        exam.weak_topics?.forEach((t: string) => allWeakTopics.add(t))
      })

      // Deneme verilerine göre dinamik öneriler
      if (recommendations.length === 0) {
        const dynamicRecs: any[] = []
        
        if (allWeakTopics.size > 0) {
          dynamicRecs.push({
            id: 'weak-topics',
            subject: 'Zayıf Konular',
            priority: 'high',
            message: `${Array.from(allWeakTopics).slice(0, 3).join(', ')} konularına odaklanmalısın.`
          })
        }

        if (examData.length >= 2) {
          const diff = (examData[0].net_score || 0) - (examData[1].net_score || 0)
          if (diff > 0) {
            dynamicRecs.push({
              id: 'progress',
              subject: 'Gelişim',
              priority: 'low',
              message: `Harika! Son denemede ${diff.toFixed(1)} net artış var!`
            })
          }
        }

        setRecommendations(dynamicRecs)
      }

      setExamStats({
        count: examData.length,
        avgNet,
        weakTopics: Array.from(allWeakTopics).slice(0, 5)
      })
    }

    setLoading(false)
  }

  async function dismissRecommendation(id: string) {
    if (id.startsWith('weak') || id.startsWith('progress')) {
      setRecommendations(prev => prev.filter(r => r.id !== id))
      return
    }

    const { error } = await supabase
      .from('ai_recommendations')
      .update({ is_dismissed: true })
      .eq('id', id)

    if (!error) {
      setRecommendations(prev => prev.filter(r => r.id !== id))
    }
  }

  const pageLoading = profileLoading || studentLoading || loading

  if (pageLoading) {
    return (
      <DashboardLayout role="ogrenci">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    )
  }

  const aiTools = [
    {
      name: 'Soru Çözücü',
      description: 'Fotoğraf çek, AI çözsün',
      icon: Camera,
      color: 'from-purple-400 to-purple-600',
      href: '/ogrenci/ai-araclar/soru-cozucu',
      active: true,
    },
    {
      name: 'Konu Anlatımı',
      description: 'Anlamadığın konuyu sor',
      icon: MessageCircle,
      color: 'from-blue-400 to-blue-600',
      href: '/ogrenci/ai-araclar/konu-anlatimi',
      active: true,
    },
    {
      name: 'Deneme Analizi',
      description: 'Sonuçlarını AI analiz etsin',
      icon: BarChart3,
      color: 'from-green-400 to-green-600',
      href: '/ogrenci/denemeler',
      active: true,
    },
    {
      name: 'Çalışma Planı',
      description: 'Kişisel plan oluştur',
      icon: Calendar,
      color: 'from-orange-400 to-orange-600',
      href: '/ogrenci/ai-araclar/calisma-plani',
      active: true,
    },
  ]

  const priorityConfig: Record<string, { color: string; icon: any }> = {
    high: { color: 'bg-red-50 border-red-200 text-red-700', icon: AlertCircle },
    medium: { color: 'bg-yellow-50 border-yellow-200 text-yellow-700', icon: Lightbulb },
    low: { color: 'bg-green-50 border-green-200 text-green-700', icon: CheckCircle },
  }

  return (
    <DashboardLayout role="ogrenci">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-surface-900">AI Araçları</h1>
          <p className="text-surface-500">Yapay zeka destekli öğrenme araçları</p>
        </div>

        {/* AI Recommendations */}
        {recommendations.length > 0 && (
          <div className="card">
            <div className="p-6 border-b border-surface-100 flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-primary-500" />
              <div>
                <h2 className="text-lg font-semibold text-surface-900">AI Önerileri</h2>
                <p className="text-sm text-surface-500">Sana özel geliştirme önerileri</p>
              </div>
            </div>
            <div className="divide-y divide-surface-100">
              {recommendations.map((rec, index) => {
                const config = priorityConfig[rec.priority] || priorityConfig.medium
                const Icon = config.icon

                return (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4"
                  >
                    <div className={`p-4 rounded-xl border ${config.color}`}>
                      <div className="flex items-start gap-3">
                        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium mb-1">
                            {rec.subject || 'Genel Öneri'}
                          </div>
                          <p className="text-sm opacity-90">{rec.message}</p>
                        </div>
                        <button
                          onClick={() => dismissRecommendation(rec.id)}
                          className="p-1 hover:bg-black/10 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* No Data Warning */}
        {examStats.count === 0 && recommendations.length === 0 && (
          <div className="card p-6 border-2 border-dashed border-yellow-300 bg-yellow-50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800 mb-1">Veri Eksikliği</h3>
                <p className="text-sm text-yellow-700 mb-3">
                  AI önerileri için deneme sonuçlarını yükle. Böylece sana özel öneriler sunabiliriz.
                </p>
                <Link href="/ogrenci/denemeler" className="btn btn-primary btn-sm">
                  Deneme Yükle
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* AI Tools Grid */}
        <div>
          <h2 className="text-lg font-semibold text-surface-900 mb-4">Araçlar</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {aiTools.map((tool, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={tool.href}>
                  <div className="card p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                        <tool.icon className="w-7 h-7" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-surface-900 group-hover:text-primary-600 transition-colors">{tool.name}</h3>
                          <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs font-medium rounded-full">
                            Aktif
                          </span>
                        </div>
                        <p className="text-sm text-surface-500 mt-1">{tool.description}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-surface-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Info Card */}
        <div className="card p-6 bg-gradient-to-r from-primary-50 to-accent-50">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Brain className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h3 className="font-semibold text-surface-900 mb-1">AI Nasıl Çalışır?</h3>
              <p className="text-sm text-surface-600">
                AI, deneme sonuçlarını ve görev performansını analiz ederek sana özel 
                öneriler sunar. Daha fazla veri toplandıkça öneriler daha isabetli olur.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

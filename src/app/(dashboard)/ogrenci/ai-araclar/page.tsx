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
  X
} from 'lucide-react'

export default function StudentAIToolsPage() {
  const { profile, loading: profileLoading } = useProfile()
  const { studentProfile, loading: studentLoading } = useStudentProfile(profile?.id || '')
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (studentProfile?.id) {
      loadRecommendations()
    }
  }, [studentProfile?.id])

  async function loadRecommendations() {
    setLoading(true)

    const { data } = await supabase
      .from('ai_recommendations')
      .select('*')
      .eq('student_id', studentProfile?.id)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })

    if (data) {
      setRecommendations(data)
    }

    setLoading(false)
  }

  async function dismissRecommendation(id: string) {
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
      icon: '📸',
      color: 'from-purple-400 to-purple-600',
      href: '#',
      comingSoon: true,
    },
    {
      name: 'Konu Anlatımı',
      description: 'Anlamadığın konuyu sor',
      icon: '📚',
      color: 'from-blue-400 to-blue-600',
      href: '#',
      comingSoon: true,
    },
    {
      name: 'Deneme Analizi',
      description: 'Sonuçlarını AI analiz etsin',
      icon: '📊',
      color: 'from-green-400 to-green-600',
      href: '#',
      comingSoon: true,
    },
    {
      name: 'Çalışma Planı',
      description: 'Kişisel plan oluştur',
      icon: '📅',
      color: 'from-orange-400 to-orange-600',
      href: '#',
      comingSoon: true,
    },
  ]

  const priorityConfig: Record<string, { color: string; icon: any }> = {
    high: { color: 'bg-red-50 border-red-200 text-red-700', icon: AlertCircle },
    medium: { color: 'bg-yellow-50 border-yellow-200 text-yellow-700', icon: Lightbulb },
    low: { color: 'bg-blue-50 border-blue-200 text-blue-700', icon: CheckCircle },
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
                <div className={`card p-6 ${tool.comingSoon ? 'opacity-60' : 'hover:shadow-lg transition-shadow cursor-pointer'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-2xl`}>
                      {tool.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-surface-900">{tool.name}</h3>
                        {tool.comingSoon && (
                          <span className="px-2 py-0.5 bg-surface-100 text-surface-500 text-xs font-medium rounded-full">
                            Yakında
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-surface-500 mt-1">{tool.description}</p>
                    </div>
                  </div>
                </div>
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


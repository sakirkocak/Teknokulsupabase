'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useTeacherProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { motion } from 'framer-motion'
import { 
  Brain,
  Sparkles,
  Send,
  Loader2,
  User,
  AlertCircle,
  Lightbulb,
  CheckCircle
} from 'lucide-react'

export default function CoachAIToolsPage() {
  const { profile, loading: profileLoading } = useProfile()
  const { teacherProfile, loading: teacherLoading } = useTeacherProfile(profile?.id || '')
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [generating, setGenerating] = useState(false)
  const [recommendations, setRecommendations] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (teacherProfile?.id) {
      loadStudents()
    }
  }, [teacherProfile?.id])

  async function loadStudents() {
    const { data } = await supabase
      .from('coaching_relationships')
      .select(`
        student:student_profiles!coaching_relationships_student_id_fkey(
          id,
          profiles:profiles!student_profiles_user_id_fkey(full_name, avatar_url)
        )
      `)
      .eq('coach_id', teacherProfile?.id)
      .eq('status', 'active')

    if (data) {
      setStudents(data.map(d => d.student))
    }
  }

  async function generateRecommendations() {
    if (!selectedStudent) {
      alert('Lütfen bir öğrenci seçin')
      return
    }

    setGenerating(true)
    setRecommendations([])

    // Öğrenci verilerini al
    const { data: exams } = await supabase
      .from('exam_results')
      .select('*')
      .eq('student_id', selectedStudent)
      .eq('status', 'approved')
      .order('exam_date', { ascending: false })
      .limit(5)

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('student_id', selectedStudent)
      .order('created_at', { ascending: false })
      .limit(10)

    // Basit AI analizi (gerçek projede OpenAI API kullanılır)
    const newRecommendations: any[] = []

    // Deneme analizi
    if (exams && exams.length > 0) {
      const avgNet = exams.reduce((acc, e) => acc + (e.net_score || 0), 0) / exams.length
      const lastExam = exams[0]
      
      if (lastExam.total_wrong > lastExam.total_correct * 0.5) {
        newRecommendations.push({
          type: 'exam_analysis',
          priority: 'high',
          subject: 'Deneme Performansı',
          message: `Son denemede yanlış sayısı (${lastExam.total_wrong}) çok yüksek. Yanlış yapılan konuların tekrarını önerin.`,
        })
      }

      if (avgNet < 30) {
        newRecommendations.push({
          type: 'general',
          priority: 'medium',
          subject: 'Genel Performans',
          message: `Ortalama net (${avgNet.toFixed(1)}) düşük. Temel konulara odaklanma önerisi yapın.`,
        })
      }
    } else {
      newRecommendations.push({
        type: 'no_data',
        priority: 'low',
        subject: 'Veri Eksikliği',
        message: 'Henüz onaylı deneme sonucu yok. Öğrenciden deneme sonuçlarını yüklemesini isteyin.',
      })
    }

    // Görev analizi
    if (tasks && tasks.length > 0) {
      const completedTasks = tasks.filter(t => t.status === 'completed')
      const completionRate = (completedTasks.length / tasks.length) * 100

      if (completionRate < 50) {
        newRecommendations.push({
          type: 'task_analysis',
          priority: 'high',
          subject: 'Görev Tamamlama',
          message: `Görev tamamlama oranı %${completionRate.toFixed(0)}. Daha kısa ve motivasyonel görevler atayın.`,
        })
      }
    }

    // Varsayılan öneriler
    if (newRecommendations.length === 0) {
      newRecommendations.push({
        type: 'general',
        priority: 'low',
        subject: 'İyi Gidiyor',
        message: 'Öğrenci genel olarak iyi ilerliyor. Mevcut çalışma temposunu koruyun.',
      })
    }

    setRecommendations(newRecommendations)

    // Önerileri veritabanına kaydet
    for (const rec of newRecommendations) {
      await supabase
        .from('ai_recommendations')
        .insert({
          student_id: selectedStudent,
          recommendation_type: rec.type,
          subject: rec.subject,
          message: rec.message,
          priority: rec.priority,
        })
    }

    setGenerating(false)
  }

  const pageLoading = profileLoading || teacherLoading

  if (pageLoading) {
    return (
      <DashboardLayout role="koc">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    )
  }

  const priorityConfig: Record<string, { color: string; icon: any; label: string }> = {
    high: { color: 'bg-red-50 border-red-200 text-red-700', icon: AlertCircle, label: 'Yüksek Öncelik' },
    medium: { color: 'bg-yellow-50 border-yellow-200 text-yellow-700', icon: Lightbulb, label: 'Orta Öncelik' },
    low: { color: 'bg-blue-50 border-blue-200 text-blue-700', icon: CheckCircle, label: 'Düşük Öncelik' },
  }

  return (
    <DashboardLayout role="koc">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-surface-900">AI Koçluk Araçları</h1>
          <p className="text-surface-500">Öğrencilerin için AI destekli analizler oluştur</p>
        </div>

        {/* Analysis Card */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-surface-900">Öğrenci Analizi</h2>
              <p className="text-sm text-surface-500">Öğrenci performansını analiz et ve öneriler oluştur</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Student Select */}
            <div>
              <label className="label">
                <User className="w-4 h-4 inline mr-1" />
                Öğrenci Seç
              </label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="input"
              >
                <option value="">Öğrenci seçin</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.profiles?.full_name}</option>
                ))}
              </select>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateRecommendations}
              disabled={generating || !selectedStudent}
              className="btn btn-primary btn-lg w-full"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analiz Ediliyor...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Analiz Et ve Öneriler Oluştur
                </>
              )}
            </button>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="card">
            <div className="p-6 border-b border-surface-100">
              <h2 className="text-lg font-semibold text-surface-900">AI Önerileri</h2>
              <p className="text-sm text-surface-500">Öğrenci için oluşturulan öneriler</p>
            </div>
            <div className="divide-y divide-surface-100">
              {recommendations.map((rec, index) => {
                const config = priorityConfig[rec.priority] || priorityConfig.medium
                const Icon = config.icon

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4"
                  >
                    <div className={`p-4 rounded-xl border ${config.color}`}>
                      <div className="flex items-start gap-3">
                        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{rec.subject}</span>
                            <span className="text-xs px-2 py-0.5 bg-white/50 rounded-full">
                              {config.label}
                            </span>
                          </div>
                          <p className="text-sm opacity-90">{rec.message}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* Other Tools */}
        <div>
          <h2 className="text-lg font-semibold text-surface-900 mb-4">Diğer Araçlar</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { name: 'Soru Üretici', desc: 'Konu bazlı soru üret', icon: '📝', comingSoon: true },
              { name: 'Rapor Oluşturucu', desc: 'Veli raporu hazırla', icon: '📊', comingSoon: true },
              { name: 'Plan Asistanı', desc: 'Çalışma planı oluştur', icon: '📅', comingSoon: true },
              { name: 'İçerik Önerisi', desc: 'Kaynak öner', icon: '📚', comingSoon: true },
            ].map((tool, index) => (
              <div key={index} className="card p-4 opacity-60">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-surface-100 rounded-xl flex items-center justify-center text-2xl">
                    {tool.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-surface-900">{tool.name}</span>
                      <span className="px-2 py-0.5 bg-surface-100 text-surface-500 text-xs rounded-full">
                        Yakında
                      </span>
                    </div>
                    <p className="text-sm text-surface-500">{tool.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}


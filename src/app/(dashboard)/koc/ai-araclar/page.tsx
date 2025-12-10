'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useTeacherProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Brain,
  Sparkles,
  Loader2,
  User,
  AlertCircle,
  Lightbulb,
  CheckCircle,
  HelpCircle,
  Calendar,
  FileText,
  Database,
  Archive,
  TrendingUp,
  ArrowRight,
  BarChart3,
  BookOpen,
  Send
} from 'lucide-react'

export default function CoachAIToolsPage() {
  const { profile, loading: profileLoading } = useProfile()
  const { teacherProfile, loading: teacherLoading } = useTeacherProfile(profile?.id || '')
  const [stats, setStats] = useState({
    totalQuestions: 0,
    publicQuestions: 0,
    totalPlans: 0,
    totalReports: 0,
    totalUsage: 0,
  })
  const [recentContent, setRecentContent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (teacherProfile?.id) {
      loadStats()
      loadRecentContent()
    }
  }, [teacherProfile?.id])

  async function loadStats() {
    if (!teacherProfile?.id) return

    try {
      // Soru sayısı
      const { count: questionCount } = await supabase
        .from('ai_questions')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', teacherProfile.id)

      // Herkese açık soru sayısı
      const { count: publicCount } = await supabase
        .from('ai_questions')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', teacherProfile.id)
        .eq('is_public', true)

      // Toplam kullanım
      const { count: usageCount } = await supabase
        .from('ai_usage_stats')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', teacherProfile.id)

      // Plan ve rapor sayısı
      const { data: contentData } = await supabase
        .from('ai_generated_content')
        .select('tool_type')
        .eq('coach_id', teacherProfile.id)

      const plans = contentData?.filter(c => c.tool_type === 'study_plan').length || 0
      const reports = contentData?.filter(c => c.tool_type === 'report').length || 0

      setStats({
        totalQuestions: questionCount || 0,
        publicQuestions: publicCount || 0,
        totalPlans: plans,
        totalReports: reports,
        totalUsage: usageCount || 0,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  async function loadRecentContent() {
    if (!teacherProfile?.id) return
    setLoading(true)

    try {
      const { data: questions } = await supabase
        .from('ai_questions')
        .select('id, subject, topic, created_at')
        .eq('coach_id', teacherProfile.id)
        .order('created_at', { ascending: false })
        .limit(3)

      setRecentContent(questions?.map(q => ({
        type: 'question',
        title: `${q.subject} - ${q.topic}`,
        date: q.created_at,
      })) || [])
    } catch (error) {
      console.error('Error loading recent content:', error)
    } finally {
      setLoading(false)
    }
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

  const tools = [
    { 
      name: 'Soru Üretici', 
      desc: 'AI ile anında soru oluşturun', 
      icon: HelpCircle, 
      href: '/koc/ai-araclar/soru-uretici',
      color: 'from-purple-400 to-purple-600',
      stat: `${stats.totalQuestions} soru üretildi`
    },
    { 
      name: 'Ödev Oluştur', 
      desc: 'Sorulardan ödev hazırlayıp öğrenciye gönderin', 
      icon: Send, 
      href: '/koc/ai-araclar/odev-olustur',
      color: 'from-emerald-400 to-emerald-600',
      stat: 'Sorularınızı ödev olarak gönderin'
    },
    { 
      name: 'Soru Havuzu', 
      desc: 'Diğer koçların sorularını keşfedin', 
      icon: Database, 
      href: '/koc/ai-araclar/soru-havuzu',
      color: 'from-blue-400 to-blue-600',
      stat: `${stats.publicQuestions} soru paylaşıldı`
    },
    { 
      name: 'Plan Asistanı', 
      desc: 'Kişiselleştirilmiş çalışma planı', 
      icon: Calendar, 
      href: '/koc/ai-araclar/plan-asistani',
      color: 'from-green-400 to-green-600',
      stat: `${stats.totalPlans} plan oluşturuldu`
    },
    { 
      name: 'Rapor Oluşturucu', 
      desc: 'Öğrenci ilerleme raporu', 
      icon: FileText, 
      href: '/koc/ai-araclar/rapor-olusturucu',
      color: 'from-orange-400 to-orange-600',
      stat: `${stats.totalReports} rapor oluşturuldu`
    },
  ]

  const quickStats = [
    { label: 'Toplam Soru', value: stats.totalQuestions, icon: HelpCircle, color: 'text-purple-500' },
    { label: 'Havuza Eklenen', value: stats.publicQuestions, icon: Database, color: 'text-blue-500' },
    { label: 'AI Kullanım', value: stats.totalUsage, icon: BarChart3, color: 'text-green-500' },
  ]

  return (
    <DashboardLayout role="koc">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
              <Brain className="w-7 h-7 text-primary-500" />
              AI Koçluk Araçları
            </h1>
            <p className="text-surface-500">Yapay zeka destekli eğitim araçları</p>
          </div>
          <Link href="/koc/ai-araclar/arsiv" className="btn btn-outline">
            <Archive className="w-4 h-4" />
            Arşivim
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          {quickStats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card p-4"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-surface-100 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900">{stat.value}</p>
                  <p className="text-sm text-surface-500">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* AI Tools Grid */}
        <div>
          <h2 className="text-lg font-semibold text-surface-900 mb-4">AI Araçları</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {tools.map((tool, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={tool.href} className="block">
                  <div className="card p-5 hover:shadow-lg transition-all group">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${tool.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <tool.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-surface-900 group-hover:text-primary-600 transition-colors">
                            {tool.name}
                          </h3>
                          <ArrowRight className="w-5 h-5 text-surface-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                        </div>
                        <p className="text-sm text-surface-500 mt-1">{tool.desc}</p>
                        <p className="text-xs text-surface-400 mt-2 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {tool.stat}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Content */}
        {recentContent.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-surface-900">Son Üretilen İçerikler</h2>
              <Link href="/koc/ai-araclar/arsiv" className="text-sm text-primary-600 hover:text-primary-700">
                Tümünü Gör →
              </Link>
            </div>
            <div className="divide-y divide-surface-100">
              {recentContent.map((content, index) => (
                <div key={index} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <HelpCircle className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-surface-700">{content.title}</span>
                  </div>
                  <span className="text-sm text-surface-400">
                    {new Date(content.date).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="card p-6 bg-gradient-to-r from-primary-50 to-blue-50">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-surface-900 mb-2">İpucu</h3>
              <p className="text-sm text-surface-600">
                Oluşturduğunuz soruları <strong>"Havuza Ekle"</strong> seçeneği ile diğer koçlarla paylaşabilirsiniz. 
                Havuzdaki popüler sorular daha fazla görünürlük kazanır!
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

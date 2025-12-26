'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'

import { useProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { 
  Users, 
  Target, 
  TrendingUp, 
  ArrowRight,
  Settings,
  UserCheck,
  BookOpen,
  Activity,
  HelpCircle,
  Sparkles,
  GraduationCap,
  BarChart3
} from 'lucide-react'

interface SubjectStats {
  subject_name: string
  subject_code: string
  question_count: number
  icon: string
  color: string
}

interface GradeStats {
  grade: number
  question_count: number
}

export default function AdminDashboard() {
  const { profile, loading: profileLoading } = useProfile()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalParents: 0,
    activeCoachings: 0,
    totalTasks: 0,
  })
  const [questionStats, setQuestionStats] = useState({
    total: 0,
    bySubject: [] as SubjectStats[],
    byGrade: [] as GradeStats[],
    byDifficulty: { easy: 0, medium: 0, hard: 0, legendary: 0 }
  })
  const supabase = createClient()

  useEffect(() => {
    loadStats()
    loadQuestionStats()
  }, [])

  async function loadStats() {
    // Kullanıcı sayıları
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    const { count: totalTeachers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'ogretmen')

    const { count: totalStudents } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'ogrenci')

    const { count: totalParents } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'veli')

    const { count: activeCoachings } = await supabase
      .from('coaching_relationships')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    const { count: totalTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })

    setStats({
      totalUsers: totalUsers || 0,
      totalTeachers: totalTeachers || 0,
      totalStudents: totalStudents || 0,
      totalParents: totalParents || 0,
      activeCoachings: activeCoachings || 0,
      totalTasks: totalTasks || 0,
    })
  }

  async function loadQuestionStats() {
    try {
      // 🚀 Optimize: Sadece count sorguları - çok daha hızlı!
      
      // Toplam soru sayısı
      const { count: totalQuestions } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      // Zorluk bazlı sayılar (paralel sorgular)
      const [easyRes, mediumRes, hardRes, legendaryRes] = await Promise.all([
        supabase.from('questions').select('*', { count: 'exact', head: true }).eq('difficulty', 'easy').eq('is_active', true),
        supabase.from('questions').select('*', { count: 'exact', head: true }).eq('difficulty', 'medium').eq('is_active', true),
        supabase.from('questions').select('*', { count: 'exact', head: true }).eq('difficulty', 'hard').eq('is_active', true),
        supabase.from('questions').select('*', { count: 'exact', head: true }).eq('difficulty', 'legendary').eq('is_active', true),
      ])

      const difficultyCount = {
        easy: easyRes.count || 0,
        medium: mediumRes.count || 0,
        hard: hardRes.count || 0,
        legendary: legendaryRes.count || 0
      }

      // Ders bazlı soru sayıları - subjects tablosundan
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('id, name, code, icon, color')

      const bySubject: SubjectStats[] = []
      
      if (subjectsData) {
        // Her ders için soru sayısını paralel olarak çek
        const subjectCounts = await Promise.all(
          subjectsData.map(async (subject) => {
            const { count } = await supabase
              .from('questions')
              .select('*, topic:topics!inner(subject_id)', { count: 'exact', head: true })
              .eq('topics.subject_id', subject.id)
              .eq('is_active', true)
            
            return {
              subject_name: subject.name,
              subject_code: subject.code,
              question_count: count || 0,
              icon: subject.icon || '📚',
              color: subject.color || 'blue'
            }
          })
        )
        
        // Soru sayısına göre sırala, 0 olanları filtrele
        bySubject.push(...subjectCounts.filter(s => s.question_count > 0).sort((a, b) => b.question_count - a.question_count))
      }

      // Sınıf bazlı soru sayıları
      const byGrade: GradeStats[] = []
      const gradePromises = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(async (grade) => {
        const { count } = await supabase
          .from('questions')
          .select('*, topic:topics!inner(grade)', { count: 'exact', head: true })
          .eq('topics.grade', grade)
          .eq('is_active', true)
        
        return { grade, question_count: count || 0 }
      })

      const gradeResults = await Promise.all(gradePromises)
      byGrade.push(...gradeResults.filter(g => g.question_count > 0))

      setQuestionStats({
        total: totalQuestions || 0,
        bySubject,
        byGrade,
        byDifficulty: difficultyCount
      })
    } catch (error) {
      console.error('Soru istatistikleri yüklenirken hata:', error)
      // Hata durumunda en azından toplam sayıyı göster
      const { count } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
      setQuestionStats({
        total: count || 0,
        bySubject: [],
        byGrade: [],
        byDifficulty: { easy: 0, medium: 0, hard: 0, legendary: 0 }
      })
    }
  }

  if (profileLoading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 bg-gradient-to-r from-surface-800 to-surface-900 text-white"
        >
          <h1 className="text-2xl font-bold mb-2">
            Admin Panel 🛡️
          </h1>
          <p className="text-surface-300">
            Tüm sistemi buradan yönetebilirsiniz.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Toplam Kullanıcı', value: stats.totalUsers, icon: Users, color: 'text-primary-500', bg: 'bg-primary-50' },
            { label: 'Öğretmen/Koç', value: stats.totalTeachers, icon: UserCheck, color: 'text-accent-500', bg: 'bg-accent-50' },
            { label: 'Öğrenci', value: stats.totalStudents, icon: BookOpen, color: 'text-secondary-500', bg: 'bg-secondary-50' },
            { label: 'Veli', value: stats.totalParents, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
            { label: 'Aktif Koçluk', value: stats.activeCoachings, icon: Target, color: 'text-yellow-500', bg: 'bg-yellow-50' },
            { label: 'Toplam Görev', value: stats.totalTasks, icon: Activity, color: 'text-red-500', bg: 'bg-red-50' },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card p-6"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-surface-900">{stat.value}</div>
                  <div className="text-sm text-surface-500">{stat.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Soru Bankası İstatistikleri */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-surface-900">Soru Bankası</h2>
                <p className="text-sm text-surface-500">Toplam {questionStats.total} soru</p>
              </div>
            </div>
            <Link 
              href="/admin/ai-soru-uretici"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all text-sm font-medium"
            >
              <Sparkles className="w-4 h-4" />
              AI ile Soru Üret
            </Link>
          </div>

          {/* Ders Bazlı İstatistikler */}
          {questionStats.bySubject.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-surface-700 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Ders Bazlı Dağılım
              </h3>
              <div className="grid gap-3">
                {questionStats.bySubject.map((subject, index) => {
                  const percentage = questionStats.total > 0 
                    ? Math.round((subject.question_count / questionStats.total) * 100) 
                    : 0
                  const colorClasses: Record<string, string> = {
                    blue: 'bg-blue-500',
                    red: 'bg-red-500',
                    green: 'bg-green-500',
                    emerald: 'bg-emerald-500',
                    amber: 'bg-amber-500',
                    orange: 'bg-orange-500',
                    purple: 'bg-purple-500',
                    pink: 'bg-pink-500',
                    cyan: 'bg-cyan-500',
                    indigo: 'bg-indigo-500',
                    yellow: 'bg-yellow-500',
                    teal: 'bg-teal-500',
                    lime: 'bg-lime-500',
                    violet: 'bg-violet-500',
                    slate: 'bg-slate-500',
                    sky: 'bg-sky-500',
                    rose: 'bg-rose-500',
                    gray: 'bg-gray-500',
                  }
                  const bgColor = colorClasses[subject.color] || 'bg-primary-500'
                  
                  return (
                    <motion.div
                      key={subject.subject_code}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <span className="text-xl w-8 text-center">{subject.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-surface-700">{subject.subject_name}</span>
                          <span className="text-sm font-bold text-surface-900">{subject.question_count}</span>
                        </div>
                        <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={`h-full ${bgColor} rounded-full`}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-surface-400 w-10 text-right">{percentage}%</span>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-surface-400">
              <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Henüz soru eklenmemiş</p>
              <Link 
                href="/admin/ai-soru-uretici"
                className="text-primary-500 hover:underline text-sm mt-2 inline-block"
              >
                İlk soruyu AI ile oluşturun →
              </Link>
            </div>
          )}

          {/* Sınıf Bazlı İstatistikler */}
          {questionStats.byGrade.length > 0 && (
            <div className="mt-6 pt-6 border-t border-surface-100">
              <h3 className="text-sm font-semibold text-surface-700 flex items-center gap-2 mb-4">
                <GraduationCap className="w-4 h-4" />
                Sınıf Bazlı Dağılım
              </h3>
              <div className="flex flex-wrap gap-2">
                {questionStats.byGrade.map((grade) => (
                  <div
                    key={grade.grade}
                    className="px-3 py-2 bg-surface-50 rounded-xl border border-surface-200 text-center min-w-[80px]"
                  >
                    <div className="text-lg font-bold text-surface-900">{grade.question_count}</div>
                    <div className="text-xs text-surface-500">{grade.grade}. Sınıf</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Zorluk Bazlı İstatistikler */}
          {questionStats.total > 0 && (
            <div className="mt-6 pt-6 border-t border-surface-100">
              <h3 className="text-sm font-semibold text-surface-700 flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4" />
                Zorluk Dağılımı
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { key: 'easy', label: 'Kolay', color: 'bg-green-500', emoji: '🟢' },
                  { key: 'medium', label: 'Orta', color: 'bg-yellow-500', emoji: '🟡' },
                  { key: 'hard', label: 'Zor', color: 'bg-orange-500', emoji: '🟠' },
                  { key: 'legendary', label: 'Efsane', color: 'bg-red-500', emoji: '🔴' },
                ].map((diff) => (
                  <div
                    key={diff.key}
                    className="text-center p-3 bg-surface-50 rounded-xl"
                  >
                    <div className="text-2xl mb-1">{diff.emoji}</div>
                    <div className="text-lg font-bold text-surface-900">
                      {questionStats.byDifficulty[diff.key as keyof typeof questionStats.byDifficulty]}
                    </div>
                    <div className="text-xs text-surface-500">{diff.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick Links */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Kullanıcıları Yönet', href: '/admin/kullanicilar', icon: Users, color: 'from-primary-500 to-primary-600' },
            { label: 'Koçlukları Yönet', href: '/admin/kocluklar', icon: Target, color: 'from-accent-500 to-accent-600' },
            { label: 'AI Soru Üretici', href: '/admin/ai-soru-uretici', icon: Sparkles, color: 'from-purple-500 to-pink-500' },
            { label: 'Sistem Ayarları', href: '/admin/ayarlar', icon: Settings, color: 'from-surface-600 to-surface-800' },
          ].map((link, index) => (
            <Link 
              key={index}
              href={link.href}
              className="card p-6 hover:shadow-lg transition-shadow group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center text-white mb-4`}>
                <link.icon className="w-6 h-6" />
              </div>
              <div className="font-medium text-surface-900 group-hover:text-primary-500 transition-colors flex items-center gap-2">
                {link.label}
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}


'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useStudentProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { motion } from 'framer-motion'
import { 
  Target, 
  ClipboardList, 
  TrendingUp, 
  ArrowRight,
  Brain,
  Sparkles,
  CheckCircle,
  Clock,
  AlertCircle,
  Flame,
  FileText,
  Users,
  Check,
  X,
  Heart,
  Phone,
  Mail,
  Trophy,
  BookOpen
} from 'lucide-react'
import { useGamification } from '@/hooks/useGamification'

export default function StudentDashboard() {
  const { profile, loading: profileLoading } = useProfile()
  const { studentProfile, loading: studentLoading } = useStudentProfile(profile?.id || '')
  const [coach, setCoach] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [examStats, setExamStats] = useState<{ weakTopics: string[], strongTopics: string[], avgNet: number, lastExam: any }>({ weakTopics: [], strongTopics: [], avgNet: 0, lastExam: null })
  const [coachingStatus, setCoachingStatus] = useState<'none' | 'pending' | 'active'>('none')
  const [parentRequests, setParentRequests] = useState<any[]>([])
  const [approvedParents, setApprovedParents] = useState<any[]>([])
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)
  const supabase = createClient()
  
  // Gamification hooks
  const gamification = useGamification(profile?.id || null)

  useEffect(() => {
    if (studentProfile?.id) {
      loadDashboardData()
    }
  }, [studentProfile?.id])

  async function loadDashboardData() {
    if (!studentProfile?.id) return

    // Koç bilgisini yükle
    const { data: relationship } = await supabase
      .from('coaching_relationships')
      .select(`
        *,
        coach:teacher_profiles!coaching_relationships_coach_id_fkey(
          id,
          user_id,
          headline,
          profile:profiles!teacher_profiles_user_id_fkey(full_name, avatar_url)
        )
      `)
      .eq('student_id', studentProfile.id)
      .in('status', ['active', 'pending'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (relationship) {
      setCoachingStatus(relationship.status as any)
      if (relationship.status === 'active' && relationship.coach) {
        setCoach(relationship.coach)
      }
    }

    // Görevleri yükle
    const { data: taskData } = await supabase
      .from('tasks')
      .select('*')
      .eq('student_id', studentProfile.id)
      .order('created_at', { ascending: false })

    if (taskData) {
      setTasks(taskData)
    }

    // AI önerilerini yükle
    const { data: recData } = await supabase
      .from('ai_recommendations')
      .select('*')
      .eq('student_id', studentProfile.id)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })
      .limit(3)

    if (recData) {
      setRecommendations(recData)
    }

    // Bekleyen veli isteklerini yükle
    const { data: parentData } = await supabase
      .from('parent_students')
      .select(`
        id,
        parent_id,
        status,
        created_at,
        parent:parent_profiles!parent_students_parent_id_fkey(
          id,
          user_id,
          profile:profiles!parent_profiles_user_id_fkey(full_name, email, avatar_url)
        )
      `)
      .eq('student_id', studentProfile.id)
      .eq('status', 'pending')

    if (parentData) {
      setParentRequests(parentData)
    }

    // Onaylanmış velileri yükle
    const { data: approvedData } = await supabase
      .from('parent_students')
      .select(`
        id,
        parent_id,
        created_at,
        parent:parent_profiles!parent_students_parent_id_fkey(
          id,
          user_id,
          profile:profiles!parent_profiles_user_id_fkey(full_name, email, avatar_url, phone)
        )
      `)
      .eq('student_id', studentProfile.id)
      .eq('status', 'approved')

    if (approvedData) {
      setApprovedParents(approvedData)
    }

    // Deneme sonuçlarını yükle ve AI önerileri için analiz et
    const { data: examData } = await supabase
      .from('exam_results')
      .select('*')
      .eq('student_id', studentProfile.id)
      .order('exam_date', { ascending: false })

    if (examData && examData.length > 0) {
      // Tüm zayıf ve güçlü konuları topla
      const allWeakTopics = new Set<string>()
      const allStrongTopics = new Set<string>()
      
      examData.forEach(exam => {
        if (exam.weak_topics) {
          exam.weak_topics.forEach((t: string) => allWeakTopics.add(t))
        }
        if (exam.strong_topics) {
          exam.strong_topics.forEach((t: string) => allStrongTopics.add(t))
        }
      })

      // Ortalama net hesapla
      const avgNet = examData.reduce((acc, e) => acc + (e.net_score || 0), 0) / examData.length

      setExamStats({
        weakTopics: Array.from(allWeakTopics).slice(0, 5),
        strongTopics: Array.from(allStrongTopics).slice(0, 5),
        avgNet,
        lastExam: examData[0]
      })

      // Deneme verilerine göre dinamik öneriler oluştur
      const dynamicRecs: any[] = []
      
      // Zayıf konular varsa öneri ekle
      if (allWeakTopics.size > 0) {
        const weakArray = Array.from(allWeakTopics)
        dynamicRecs.push({
          id: 'weak-1',
          subject: 'Zayıf Konular',
          priority: 'high',
          message: `${weakArray.slice(0, 3).join(', ')} konularına daha fazla odaklan.`
        })
      }

      // Son deneme analizi
      const lastExam = examData[0]
      if (lastExam.ai_analysis?.analysis?.recommendations) {
        const aiRecs = lastExam.ai_analysis.analysis.recommendations
        if (Array.isArray(aiRecs) && aiRecs.length > 0) {
          dynamicRecs.push({
            id: 'ai-rec-1',
            subject: 'AI Analizi',
            priority: 'medium',
            message: aiRecs[0]
          })
        }
      }

      // Gelişim önerisi
      if (examData.length >= 2) {
        const lastNet = examData[0].net_score || 0
        const prevNet = examData[1].net_score || 0
        const diff = lastNet - prevNet

        if (diff > 0) {
          dynamicRecs.push({
            id: 'progress-1',
            subject: 'Gelişim',
            priority: 'low',
            message: `Harika! Son denemede ${diff.toFixed(1)} net artış var. Aynı tempoda devam et!`
          })
        } else if (diff < 0) {
          dynamicRecs.push({
            id: 'progress-2',
            subject: 'Dikkat',
            priority: 'high',
            message: `Son denemede ${Math.abs(diff).toFixed(1)} net düşüş var. Eksik konuları gözden geçir.`
          })
        }
      }

      // Motivasyon önerisi
      if (avgNet > 0 && avgNet < 100) {
        dynamicRecs.push({
          id: 'motivation-1',
          subject: 'Motivasyon',
          priority: 'medium',
          message: `Ortalama netin ${avgNet.toFixed(1)}. Düzenli çalışarak daha da yükseltebilirsin!`
        })
      }

      setRecommendations(dynamicRecs)
    }
  }

  async function handleParentRequest(requestId: string, approve: boolean) {
    setProcessingRequest(requestId)
    
    const request = parentRequests.find(r => r.id === requestId)
    if (!request) return

    // İsteği güncelle
    const { error } = await supabase
      .from('parent_students')
      .update({ status: approve ? 'approved' : 'rejected' })
      .eq('id', requestId)

    if (error) {
      alert('Hata: ' + error.message)
    } else {
      // Veliye bildirim gönder
      const parentData = request.parent as any
      const parentUserId = parentData?.user_id
      
      if (parentUserId) {
        await supabase.from('notifications').insert({
          user_id: parentUserId,
          title: approve ? '✅ Veli İsteği Onaylandı' : '❌ Veli İsteği Reddedildi',
          body: approve 
            ? `${profile?.full_name} sizi veli olarak onayladı. Artık gelişimini takip edebilirsiniz.`
            : `${profile?.full_name} veli isteğinizi reddetti.`,
          type: 'parent_response',
        })
      }

      // Listeyi güncelle
      setParentRequests(prev => prev.filter(r => r.id !== requestId))
      
      // Onaylandıysa onaylı veliler listesine ekle
      if (approve) {
        setApprovedParents(prev => [...prev, request])
      }
    }
    
    setProcessingRequest(null)
  }

  const loading = profileLoading || studentLoading
  const pendingTasks = tasks.filter(t => t.status === 'pending')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  if (loading) {
    return (
      <DashboardLayout role="ogrenci">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="ogrenci">
      <div className="space-y-6">
        {/* Progress Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 bg-gradient-to-r from-accent-500 to-accent-600 text-white"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-5 h-5" />
                <span className="text-sm font-medium bg-white/20 px-2 py-0.5 rounded-full">
                  Harika gidiyorsun!
                </span>
              </div>
              <h1 className="text-2xl font-bold mb-1">Merhaba, {profile?.full_name?.split(' ')[0]}! 👋</h1>
              <p className="text-accent-100">
                {pendingTasks.length > 0 
                  ? `${pendingTasks.length} görev tamamlanmayı bekliyor`
                  : coachingStatus === 'pending'
                  ? 'Koçluk başvurun değerlendiriliyor'
                  : coachingStatus === 'active'
                  ? 'Koçunla birlikte ilerliyorsun!'
                  : 'Bir koç bul ve yolculuğuna başla!'
                }
              </p>
            </div>
            {studentProfile?.target_exam && (
              <div className="mt-4 lg:mt-0 text-center lg:text-right">
                <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl">
                  <Target className="w-5 h-5" />
                  <span className="font-medium">{studentProfile.target_exam}</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Bekleyen Veli İstekleri */}
        {parentRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-4 border-2 border-purple-200 bg-purple-50"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-900">Bekleyen Veli İstekleri</h3>
                <p className="text-sm text-purple-600">{parentRequests.length} istek onayınızı bekliyor</p>
              </div>
            </div>
            <div className="space-y-3">
              {parentRequests.map((request) => {
                const parentProfile = request.parent as any
                return (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-white rounded-xl">
                    <div>
                      <div className="font-medium text-surface-900">
                        {parentProfile?.profile?.full_name || 'Bilinmeyen Veli'}
                      </div>
                      <div className="text-sm text-surface-500">
                        {parentProfile?.profile?.email}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleParentRequest(request.id, false)}
                        disabled={processingRequest === request.id}
                        className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-50"
                        title="Reddet"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleParentRequest(request.id, true)}
                        disabled={processingRequest === request.id}
                        className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors disabled:opacity-50"
                        title="Onayla"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Coach */}
            <div className="card">
              <div className="p-6 border-b border-surface-100">
                <h2 className="text-lg font-semibold text-surface-900">Koçum</h2>
              </div>
              {coachingStatus === 'active' && coach ? (
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white text-xl font-medium overflow-hidden">
                      {coach.profile?.avatar_url ? (
                        <img src={coach.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        getInitials(coach.profile?.full_name)
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-lg text-surface-900">{coach.profile?.full_name}</div>
                      <div className="text-sm text-surface-500">{coach.headline}</div>
                    </div>
                    <Link href="/ogrenci/mesajlar" className="btn btn-primary btn-sm">
                      Mesaj Gönder
                    </Link>
                  </div>
                </div>
              ) : coachingStatus === 'pending' ? (
                <div className="p-6">
                  <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-xl">
                    <Clock className="w-6 h-6 text-yellow-500" />
                    <div>
                      <div className="font-medium text-yellow-700">Başvurun değerlendiriliyor</div>
                      <div className="text-sm text-yellow-600">Koç en kısa sürede cevap verecek.</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Target className="w-12 h-12 mx-auto mb-3 text-surface-300" />
                  <p className="text-surface-500 mb-4">Henüz bir koçun yok</p>
                  <Link href="/koclar" className="btn btn-primary btn-sm">
                    Koç Bul
                  </Link>
                </div>
              )}
            </div>

            {/* My Parents */}
            {approvedParents.length > 0 && (
              <div className="card">
                <div className="p-6 border-b border-surface-100">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-500" />
                    <h2 className="text-lg font-semibold text-surface-900">Velim</h2>
                  </div>
                </div>
                <div className="divide-y divide-surface-100">
                  {approvedParents.map((relation) => {
                    const parentData = relation.parent as any
                    const parentProfile = parentData?.profile
                    return (
                      <div key={relation.id} className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center text-white text-lg font-medium overflow-hidden">
                            {parentProfile?.avatar_url ? (
                              <img src={parentProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              getInitials(parentProfile?.full_name)
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-surface-900">{parentProfile?.full_name || 'Veli'}</div>
                            <div className="flex items-center gap-4 mt-1">
                              {parentProfile?.email && (
                                <a href={`mailto:${parentProfile.email}`} className="flex items-center gap-1 text-sm text-surface-500 hover:text-primary-500">
                                  <Mail className="w-4 h-4" />
                                  {parentProfile.email}
                                </a>
                              )}
                              {parentProfile?.phone && (
                                <a href={`tel:${parentProfile.phone}`} className="flex items-center gap-1 text-sm text-surface-500 hover:text-primary-500">
                                  <Phone className="w-4 h-4" />
                                  {parentProfile.phone}
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 px-3 py-1 bg-pink-50 text-pink-600 rounded-full text-sm">
                            <Heart className="w-4 h-4" />
                            Gelişimini takip ediyor
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Tasks */}
            <div className="card">
              <div className="p-6 border-b border-surface-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-surface-900">Görevlerim</h2>
                  <p className="text-sm text-surface-500">Koçunun verdiği görevler</p>
                </div>
                <Link href="/ogrenci/gorevler" className="text-primary-500 text-sm font-medium flex items-center gap-1">
                  Tümünü Gör <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="divide-y divide-surface-100">
                {tasks.length > 0 ? tasks.slice(0, 4).map((task) => (
                  <Link key={task.id} href={`/ogrenci/gorevler/${task.id}`} className="p-4 flex items-center gap-4 hover:bg-surface-50 transition-colors">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      task.status === 'completed' ? 'bg-secondary-50 text-secondary-500' :
                      task.status === 'pending' ? 'bg-yellow-50 text-yellow-500' :
                      'bg-accent-50 text-accent-500'
                    }`}>
                      {task.status === 'completed' ? <CheckCircle className="w-5 h-5" /> :
                       task.status === 'pending' ? <Clock className="w-5 h-5" /> :
                       <ClipboardList className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-surface-900">{task.title}</div>
                      <div className="text-sm text-surface-500">
                        {task.due_date 
                          ? `Son tarih: ${new Date(task.due_date).toLocaleDateString('tr-TR')}`
                          : 'Son tarih belirtilmemiş'
                        }
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-surface-400" />
                  </Link>
                )) : (
                  <div className="p-8 text-center">
                    <ClipboardList className="w-12 h-12 mx-auto mb-3 text-surface-300" />
                    <p className="text-surface-500">
                      {coachingStatus === 'active' 
                        ? 'Henüz görev atanmamış'
                        : 'Koçluk başlayınca görevler burada görünecek'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Gamification Widgets - Basitleştirilmiş */}
            {gamification.initialized && !gamification.loading && (
              <div className="space-y-4">
                {/* XP Card - Basit versiyon */}
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{gamification.level.icon}</span>
                      <div>
                        <div className="text-xs text-purple-200">Seviye {gamification.level.level}</div>
                        <div className="font-bold">{gamification.level.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">{gamification.totalXP}</div>
                      <div className="text-xs text-purple-200">XP</div>
                    </div>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white rounded-full transition-all duration-500"
                      style={{ width: `${gamification.xpProgress.progress}%` }}
                    />
                  </div>
                  <Link href="/ogrenci/basarimlar" className="mt-2 text-xs text-purple-200 hover:text-white block">
                    Başarımlarımı gör →
                  </Link>
                </div>
                
                {/* Streak Card - Basit versiyon */}
                <div className={`rounded-2xl p-4 text-white ${
                  gamification.currentStreak >= 7 
                    ? 'bg-gradient-to-br from-orange-500 to-red-600'
                    : gamification.currentStreak >= 3
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                    : 'bg-gradient-to-br from-gray-500 to-gray-600'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Flame className="w-6 h-6" />
                      <div>
                        <div className="text-xs opacity-80">Günlük Seri</div>
                        <div className="font-bold text-xl">{gamification.currentStreak} gün</div>
                      </div>
                    </div>
                  </div>
                  <Link href="/ogrenci/basarimlar" className="text-xs opacity-80 hover:opacity-100 block">
                    Detayları gör →
                  </Link>
                </div>
              </div>
            )}
            
            {/* GamificationPanel - Basitleştirilmiş */}
            {studentProfile?.id && (
              <div className="card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  <h3 className="font-semibold">Liderlik</h3>
                </div>
                <Link href="/ogrenci/liderlik" className="btn btn-primary btn-sm w-full justify-center">
                  Sıralamayı Gör
                </Link>
              </div>
            )}

            {/* Soru Bankası Hızlı Erişim */}
            <Link href="/ogrenci/soru-bankasi" className="card p-4 flex items-center gap-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Soru Bankası</div>
                <div className="text-sm text-primary-100">Şimdi soru çözmeye başla!</div>
              </div>
              <ArrowRight className="w-5 h-5" />
            </Link>

            {/* AI Recommendations */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-surface-900">AI Önerileri</h3>
                <Sparkles className="w-5 h-5 text-primary-500" />
              </div>
              {recommendations.length > 0 ? (
                <div className="space-y-3">
                  {recommendations.map((rec) => (
                    <div 
                      key={rec.id}
                      className={`p-3 rounded-xl text-sm ${
                        rec.priority === 'high' ? 'bg-red-50 border border-red-200' :
                        rec.priority === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                        'bg-green-50 border border-green-200'
                      }`}
                    >
                      <div className="font-medium mb-1">{rec.subject || 'Genel'}</div>
                      <div className="text-surface-600">{rec.message}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Brain className="w-10 h-10 mx-auto mb-2 text-surface-300" />
                  <p className="text-sm text-surface-500 mb-3">
                    Deneme sonucu yükleyerek AI önerileri al
                  </p>
                  <Link href="/ogrenci/denemeler" className="btn btn-primary btn-sm">
                    Deneme Yükle
                  </Link>
                </div>
              )}
            </div>

            {/* Deneme Özeti */}
            {examStats.lastExam && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-surface-900">Deneme Özeti</h3>
                  <TrendingUp className="w-5 h-5 text-accent-500" />
                </div>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl">
                    <div className="text-3xl font-bold text-primary-600">{examStats.avgNet.toFixed(1)}</div>
                    <div className="text-sm text-surface-500">Ortalama Net</div>
                  </div>
                  
                  {examStats.weakTopics.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-surface-500 mb-2 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-red-500" />
                        Zayıf Konular
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {examStats.weakTopics.map((topic, i) => (
                          <span key={i} className="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded-full">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {examStats.strongTopics.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-surface-500 mb-2 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        Güçlü Konular
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {examStats.strongTopics.map((topic, i) => (
                          <span key={i} className="px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded-full">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <Link 
                    href="/ogrenci/denemeler" 
                    className="flex items-center justify-center gap-2 w-full p-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    Tüm Denemeleri Gör <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="card p-6">
              <h3 className="font-semibold text-surface-900 mb-4">İstatistiklerim</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-accent-500" />
                    <span className="text-surface-600">Toplam Görev</span>
                  </div>
                  <span className="font-bold text-surface-900">{tasks.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary-500" />
                    <span className="text-surface-600">Tamamlanan</span>
                  </div>
                  <span className="font-bold text-surface-900">{completedTasks.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-500" />
                    <span className="text-surface-600">Bekleyen</span>
                  </div>
                  <span className="font-bold text-surface-900">{pendingTasks.length}</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="card p-6">
              <h3 className="font-semibold text-surface-900 mb-4">Hızlı Erişim</h3>
              <div className="space-y-2">
                <Link 
                  href="/ogrenci/denemeler"
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 hover:bg-surface-100 transition-colors"
                >
                  <FileText className="w-5 h-5 text-primary-500" />
                  <span className="font-medium text-surface-900 text-sm">Deneme Sonuçları</span>
                </Link>
                <Link 
                  href="/ogrenci/ai-araclar"
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 hover:bg-surface-100 transition-colors"
                >
                  <Brain className="w-5 h-5 text-purple-500" />
                  <span className="font-medium text-surface-900 text-sm">AI Araçları</span>
                </Link>
                <Link 
                  href="/koclar"
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 hover:bg-surface-100 transition-colors"
                >
                  <Target className="w-5 h-5 text-accent-500" />
                  <span className="font-medium text-surface-900 text-sm">Koçları Keşfet</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

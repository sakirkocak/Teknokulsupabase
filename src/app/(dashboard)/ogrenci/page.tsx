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
  BookOpen,
  BarChart3,
  Zap,
  RefreshCw,
  Award,
  ChevronUp,
  ChevronDown,
  Minus
} from 'lucide-react'
import { useGamification } from '@/hooks/useGamification'

// Typesense Dashboard Data Interface
interface TypesenseDashboardData {
  topicProgress: {
    all: any[]
    weak: any[]
    strong: any[]
    reviewDue: any[]
    subjectMastery: { code: string; name: string; total: number; mastered: number; percentage: number }[]
  }
  leaderboard: {
    myRank: number | null
    totalStudents: number
    nearbyRivals: any[]
    myPoints: number
  }
  recommendedQuestions: any[]
  stats: {
    totalQuestions: number
    totalCorrect: number
    successRate: number
    currentStreak: number
    maxStreak: number
    totalPoints: number
  } | null
}

export default function StudentDashboard() {
  const { profile, loading: profileLoading } = useProfile()
  const { studentProfile, loading: studentLoading } = useStudentProfile(profile?.id || '')
  const [coaches, setCoaches] = useState<any[]>([])
  const [pendingCoach, setPendingCoach] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [coachingStatus, setCoachingStatus] = useState<'none' | 'pending' | 'active'>('none')
  const [parentRequests, setParentRequests] = useState<any[]>([])
  const [approvedParents, setApprovedParents] = useState<any[]>([])
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)
  
  // Typesense Dashboard Data
  const [typesenseData, setTypesenseData] = useState<TypesenseDashboardData | null>(null)
  const [typesenseLoading, setTypesenseLoading] = useState(true)
  
  // AI Koç entegrasyonu - birleşik analiz verileri
  const [aiCoachData, setAiCoachData] = useState<{
    loading: boolean
    weakSubjects: string[]
    strongSubjects: string[]
    avgNet: number
    totalExams: number
    netTrend: 'up' | 'down' | 'stable'
    currentStreak: number
    accuracy: number
    motivationalMessages: string[]
    summary: string
  }>({
    loading: true,
    weakSubjects: [],
    strongSubjects: [],
    avgNet: 0,
    totalExams: 0,
    netTrend: 'stable',
    currentStreak: 0,
    accuracy: 0,
    motivationalMessages: [],
    summary: ''
  })
  
  const supabase = createClient()
  
  // Gamification hooks
  const gamification = useGamification(profile?.id || null)

  useEffect(() => {
    if (studentProfile?.id) {
      loadDashboardData()
      loadTypesenseData()
    }
  }, [studentProfile?.id])

  // Typesense verilerini yükle
  async function loadTypesenseData() {
    try {
      setTypesenseLoading(true)
      const response = await fetch('/api/student-dashboard')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setTypesenseData(result.data)
        }
      }
    } catch (error) {
      console.error('Typesense veri yükleme hatası:', error)
    } finally {
      setTypesenseLoading(false)
    }
  }

  async function loadDashboardData() {
    if (!studentProfile?.id) return

    // Koç bilgilerini yükle (birden fazla koç destekli)
    const { data: relationships } = await supabase
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

    if (relationships && relationships.length > 0) {
      // Aktif koçları ayır
      const activeCoaches = relationships
        .filter(r => r.status === 'active' && r.coach)
        .map(r => r.coach)
      
      // Bekleyen başvuru var mı?
      const pendingRelation = relationships.find(r => r.status === 'pending')
      
      if (activeCoaches.length > 0) {
        setCoaches(activeCoaches)
        setCoachingStatus('active')
      } else if (pendingRelation) {
        setPendingCoach(pendingRelation.coach)
        setCoachingStatus('pending')
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

    // AI Koç'tan birleşik analiz verilerini al (soru bankası + deneme sonuçları)
    try {
      const aiResponse = await fetch('/api/ai-coach/analyze')
      if (aiResponse.ok) {
        const aiData = await aiResponse.json()
        setAiCoachData({
          loading: false,
          weakSubjects: aiData.analysis?.weakSubjects || [],
          strongSubjects: aiData.analysis?.strongSubjects || [],
          avgNet: aiData.examStats?.avgNet || 0,
          totalExams: aiData.examStats?.totalExams || 0,
          netTrend: aiData.examStats?.netTrend || 'stable',
          currentStreak: aiData.stats?.currentStreak || 0,
          accuracy: aiData.stats?.accuracy || 0,
          motivationalMessages: aiData.analysis?.motivationalMessages || [],
          summary: aiData.analysis?.summary || ''
        })
      } else {
        setAiCoachData(prev => ({ ...prev, loading: false }))
      }
    } catch (error) {
      console.error('AI Koç verisi alınamadı:', error)
      setAiCoachData(prev => ({ ...prev, loading: false }))
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
                  ? coaches.length > 1 
                    ? `${coaches.length} koçunla birlikte ilerliyorsun!`
                    : 'Koçunla birlikte ilerliyorsun!'
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
            {/* My Coaches */}
            <div className="card">
              <div className="p-6 border-b border-surface-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-surface-900">
                  {coaches.length > 1 ? 'Koçlarım' : 'Koçum'}
                </h2>
                {coaches.length > 0 && (
                  <Link href="/koclar" className="text-sm text-primary-500 hover:text-primary-600 font-medium">
                    + Koç Ekle
                  </Link>
                )}
              </div>
              {coachingStatus === 'active' && coaches.length > 0 ? (
                <div className="divide-y divide-surface-100">
                  {coaches.map((coach, index) => (
                    <div key={coach.id || index} className="p-6">
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
                  ))}
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
            
            {/* Liderlik Kartı - Typesense ile zenginleştirilmiş */}
            {studentProfile?.id && (
              <div className="card overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-4 text-white">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    <h3 className="font-semibold">Liderlik Tablosu</h3>
                  </div>
                </div>
                <div className="p-4">
                  {typesenseLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full" />
                    </div>
                  ) : typesenseData?.leaderboard?.myRank ? (
                    <div className="space-y-4">
                      {/* Sıralama */}
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            #{typesenseData.leaderboard.myRank}
                          </div>
                          <div>
                            <div className="font-semibold text-surface-900">Sıralaman</div>
                            <div className="text-sm text-surface-500">
                              {typesenseData.leaderboard.totalStudents} öğrenci arasında
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-orange-600">{typesenseData.leaderboard.myPoints}</div>
                          <div className="text-xs text-surface-500">puan</div>
                        </div>
                      </div>

                      {/* Yakın Rakipler */}
                      {typesenseData.leaderboard.nearbyRivals.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-surface-500 mb-2">Yakın Rakiplerin</div>
                          <div className="space-y-1">
                            {typesenseData.leaderboard.nearbyRivals.slice(0, 3).map((rival: any, index: number) => {
                              const isMe = rival.student_id === studentProfile.id
                              const rankDiff = typesenseData!.leaderboard.myRank! - (typesenseData!.leaderboard.myRank! - 2 + index + 1)
                              return (
                                <div 
                                  key={rival.student_id || index}
                                  className={`flex items-center justify-between p-2 rounded-lg ${isMe ? 'bg-primary-50 border border-primary-200' : 'bg-surface-50'}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${isMe ? 'bg-primary-500 text-white' : 'bg-surface-200 text-surface-600'}`}>
                                      {typesenseData!.leaderboard.myRank! - 2 + index + 1}
                                    </span>
                                    <span className={`text-sm ${isMe ? 'font-semibold text-primary-700' : 'text-surface-700'}`}>
                                      {isMe ? 'Sen' : (rival.full_name || rival.student_name)?.split(' ')[0] || 'Öğrenci'}
                                    </span>
                                  </div>
                                  <span className="text-sm font-medium text-surface-600">{rival.total_points} XP</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      <Link href="/ogrenci/liderlik" className="btn btn-primary btn-sm w-full justify-center">
                        Tam Sıralamayı Gör
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Trophy className="w-10 h-10 mx-auto text-surface-300 mb-2" />
                      <p className="text-sm text-surface-500 mb-3">Soru çözerek liderlik tablosuna gir!</p>
                      <Link href="/ogrenci/soru-bankasi" className="btn btn-primary btn-sm">
                        Soru Çöz
                      </Link>
                    </div>
                  )}
                </div>
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

            {/* AI Koç Önerileri - Birleşik Widget (Soru Bankası + Deneme) */}
            <div className="card overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    <h3 className="font-semibold">AI Koç Önerileri</h3>
                  </div>
                  <Sparkles className="w-4 h-4 opacity-80" />
                </div>
                <p className="text-xs text-purple-100 mt-1">Soru bankası + Deneme sonuçları analizi</p>
              </div>
              
              {aiCoachData.loading ? (
                <div className="p-6 flex justify-center">
                  <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {/* Deneme İstatistikleri - Varsa göster */}
                  {aiCoachData.totalExams > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl">
                      <div className="text-center flex-1">
                        <div className="text-2xl font-bold text-primary-600">{aiCoachData.avgNet.toFixed(1)}</div>
                        <div className="text-xs text-surface-500">Ort. Net</div>
                      </div>
                      <div className="w-px h-10 bg-surface-200" />
                      <div className="text-center flex-1">
                        <div className="text-2xl font-bold text-accent-600">%{aiCoachData.accuracy}</div>
                        <div className="text-xs text-surface-500">Başarı</div>
                      </div>
                      <div className="w-px h-10 bg-surface-200" />
                      <div className="text-center flex-1">
                        <div className="flex items-center justify-center gap-1">
                          {aiCoachData.netTrend === 'up' ? (
                            <TrendingUp className="w-5 h-5 text-green-500" />
                          ) : aiCoachData.netTrend === 'down' ? (
                            <TrendingUp className="w-5 h-5 text-red-500 rotate-180" />
                          ) : (
                            <ArrowRight className="w-5 h-5 text-yellow-500" />
                          )}
                        </div>
                        <div className="text-xs text-surface-500">Trend</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Zayıf Konular */}
                  {aiCoachData.weakSubjects.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-medium text-red-700">Odaklanman Gereken Konular</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {aiCoachData.weakSubjects.slice(0, 4).map((topic, i) => (
                          <span key={i} className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Güçlü Konular */}
                  {aiCoachData.strongSubjects.length > 0 && (
                    <div className="p-3 bg-green-50 border border-green-100 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-xs font-medium text-green-700">Güçlü Olduğun Konular</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {aiCoachData.strongSubjects.slice(0, 4).map((topic, i) => (
                          <span key={i} className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Motivasyon Mesajı */}
                  {aiCoachData.motivationalMessages.length > 0 && (
                    <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl">
                      <p className="text-sm text-purple-700">{aiCoachData.motivationalMessages[0]}</p>
                    </div>
                  )}

                  {/* Veri yoksa */}
                  {aiCoachData.weakSubjects.length === 0 && aiCoachData.strongSubjects.length === 0 && aiCoachData.totalExams === 0 && (
                    <div className="text-center py-2">
                      <p className="text-sm text-surface-500 mb-3">
                        Soru çöz veya deneme yükle, AI Koç sana özel öneriler versin!
                      </p>
                    </div>
                  )}

                  {/* AI Koç'a Git Butonu */}
                  <Link 
                    href="/ogrenci/ai-koc" 
                    className="flex items-center justify-center gap-2 w-full p-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-600 hover:to-indigo-700 transition-all"
                  >
                    <Brain className="w-4 h-4" />
                    AI Koç'a Git
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>

            {/* Konu Haritası - Typesense'den */}
            {typesenseData?.topicProgress?.subjectMastery && typesenseData.topicProgress.subjectMastery.length > 0 && (
              <div className="card overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4 text-white">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    <h3 className="font-semibold">Konu Haritam</h3>
                  </div>
                  <p className="text-xs text-emerald-100 mt-1">Derslerdeki hakimiyet durumun</p>
                </div>
                <div className="p-4 space-y-3">
                  {typesenseData.topicProgress.subjectMastery.slice(0, 5).map((subject) => (
                    <div key={subject.code} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-surface-700">{subject.name}</span>
                        <span className={`font-semibold ${
                          subject.percentage >= 70 ? 'text-green-600' :
                          subject.percentage >= 40 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          %{subject.percentage}
                        </span>
                      </div>
                      <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            subject.percentage >= 70 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                            subject.percentage >= 40 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 
                            'bg-gradient-to-r from-red-400 to-red-500'
                          }`}
                          style={{ width: `${subject.percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-surface-400">
                        {subject.mastered}/{subject.total} konu tamamlandı
                      </div>
                    </div>
                  ))}
                  <Link href="/ogrenci/ilerleme" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 mt-2">
                    Detaylı analiz <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}

            {/* Tekrar Zamanı Gelmiş Konular */}
            {typesenseData?.topicProgress?.reviewDue && typesenseData.topicProgress.reviewDue.length > 0 && (
              <div className="card overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5" />
                    <h3 className="font-semibold">Tekrar Zamanı!</h3>
                  </div>
                  <p className="text-xs text-amber-100 mt-1">Unutmamak için tekrar et</p>
                </div>
                <div className="p-4">
                  <div className="space-y-2">
                    {typesenseData.topicProgress.reviewDue.slice(0, 4).map((topic: any) => {
                      const daysOverdue = Math.floor((Date.now() - topic.next_review_at) / (1000 * 60 * 60 * 24))
                      return (
                        <div key={topic.id} className="flex items-center justify-between p-2 bg-amber-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${daysOverdue > 3 ? 'bg-red-500' : 'bg-amber-500'}`} />
                            <span className="text-sm text-surface-700">{topic.main_topic || topic.subject_name}</span>
                          </div>
                          <span className="text-xs text-surface-500">
                            {daysOverdue > 0 ? `${daysOverdue} gün geçti` : 'Bugün'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <Link 
                    href="/ogrenci/soru-bankasi" 
                    className="mt-3 flex items-center justify-center gap-2 w-full p-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:from-amber-600 hover:to-orange-600 transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Şimdi Tekrar Et
                  </Link>
                </div>
              </div>
            )}

            {/* Sana Özel Soru Önerileri */}
            {typesenseData?.recommendedQuestions && typesenseData.recommendedQuestions.length > 0 && (
              <div className="card overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4 text-white">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    <h3 className="font-semibold">Sana Özel Sorular</h3>
                  </div>
                  <p className="text-xs text-blue-100 mt-1">Zayıf konularından seçildi</p>
                </div>
                <div className="p-4">
                  <div className="space-y-2">
                    {typesenseData.recommendedQuestions.slice(0, 3).map((question: any, index: number) => (
                      <Link 
                        key={question.question_id || index}
                        href={`/ogrenci/soru-bankasi?questionId=${question.question_id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium group-hover:bg-blue-500 group-hover:text-white transition-colors">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-surface-700 truncate">
                            {question.subject_name} - {question.main_topic}
                          </div>
                          <div className="text-xs text-surface-400 flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-xs ${
                              question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                              question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              question.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {question.difficulty === 'easy' ? 'Kolay' :
                               question.difficulty === 'medium' ? 'Orta' :
                               question.difficulty === 'hard' ? 'Zor' : 'Efsanevi'}
                            </span>
                            {question.times_answered > 0 && (
                              <span>{question.times_answered} çözüm</span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-surface-400 group-hover:text-blue-500" />
                      </Link>
                    ))}
                  </div>
                  <Link 
                    href="/ogrenci/soru-bankasi" 
                    className="mt-3 flex items-center justify-center gap-2 w-full p-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-600 transition-all"
                  >
                    <Zap className="w-4 h-4" />
                    Tümünü Çöz
                  </Link>
                </div>
              </div>
            )}

            {/* Quick Stats - Zenginleştirilmiş */}
            <div className="card p-6">
              <h3 className="font-semibold text-surface-900 mb-4">İstatistiklerim</h3>
              <div className="space-y-4">
                {/* Typesense'den gelen soru istatistikleri */}
                {typesenseData?.stats && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-500" />
                        <span className="text-surface-600">Çözülen Soru</span>
                      </div>
                      <span className="font-bold text-surface-900">{typesenseData.stats.totalQuestions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-surface-600">Doğru Cevap</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-surface-900">{typesenseData.stats.totalCorrect}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          typesenseData.stats.successRate >= 70 ? 'bg-green-100 text-green-700' :
                          typesenseData.stats.successRate >= 50 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          %{Math.round(typesenseData.stats.successRate)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-500" />
                        <span className="text-surface-600">En Uzun Seri</span>
                      </div>
                      <span className="font-bold text-surface-900">{typesenseData.stats.maxStreak} gün</span>
                    </div>
                    <div className="border-t border-surface-100 my-2" />
                  </>
                )}
                
                {/* Görev istatistikleri */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-accent-500" />
                    <span className="text-surface-600">Toplam Görev</span>
                  </div>
                  <span className="font-bold text-surface-900">{tasks.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-secondary-500" />
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

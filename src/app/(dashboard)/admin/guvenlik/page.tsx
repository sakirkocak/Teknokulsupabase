'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Shield, AlertTriangle, Ban, CheckCircle, 
  RefreshCw, Eye, Clock, Target, Zap,
  TrendingUp, Users, Activity, Search,
  ChevronDown, ChevronUp, X, History,
  Trash2, RotateCcw
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SuspiciousUser {
  user_id: string
  full_name: string
  email: string
  total_questions: number
  total_correct: number
  accuracy_rate: number
  questions_last_hour: number
  avg_answer_time_ms: number
  risk_score: number
  is_suspended: boolean
  suspension_reason: string | null
}

interface HistoricalUser {
  user_id: string
  full_name: string
  email: string
  created_at: string
  total_questions: number
  total_correct: number
  total_points: number
  accuracy_rate: number
  daily_average: number
  days_since_registration: number
  suspicion_reasons: string[]
  risk_level: 'critical' | 'high' | 'medium'
}

interface ActivityDetail {
  hour_bucket: string
  question_count: number
  correct_count: number
  avg_answer_time_ms: number
}

interface HistoricalSummary {
  total_suspicious: number
  critical_count: number
  high_count: number
  medium_count: number
  total_suspicious_questions: number
  total_suspicious_points: number
}

type TabType = 'live' | 'historical'

export default function SecurityPage() {
  const [activeTab, setActiveTab] = useState<TabType>('live')
  
  // Live monitoring state
  const [suspiciousUsers, setSuspiciousUsers] = useState<SuspiciousUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<SuspiciousUser | null>(null)
  const [activityDetails, setActivityDetails] = useState<ActivityDetail[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [hours, setHours] = useState(24)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Historical analysis state
  const [historicalUsers, setHistoricalUsers] = useState<HistoricalUser[]>([])
  const [historicalLoading, setHistoricalLoading] = useState(false)
  const [historicalSummary, setHistoricalSummary] = useState<HistoricalSummary | null>(null)
  const [selectedHistoricalUser, setSelectedHistoricalUser] = useState<HistoricalUser | null>(null)
  const [selectedForBulk, setSelectedForBulk] = useState<Set<string>>(new Set())
  
  const supabase = createClient()

  // ========================================
  // Live Monitoring Functions
  // ========================================
  
  const loadSuspiciousUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_suspicious_users', { p_hours: hours })
      
      if (error) {
        console.error('Error loading suspicious users:', error)
        const { data: fallbackData } = await supabase
          .from('profiles')
          .select(`id, full_name, email, is_suspended, suspension_reason, risk_score`)
          .eq('role', 'ogrenci')
          .or('is_suspended.eq.true,risk_score.gt.50')
          .limit(50)
        
        if (fallbackData) {
          setSuspiciousUsers(fallbackData.map(u => ({
            user_id: u.id,
            full_name: u.full_name || 'İsimsiz',
            email: u.email || '',
            total_questions: 0,
            total_correct: 0,
            accuracy_rate: 0,
            questions_last_hour: 0,
            avg_answer_time_ms: 0,
            risk_score: u.risk_score || 0,
            is_suspended: u.is_suspended || false,
            suspension_reason: u.suspension_reason
          })))
        }
      } else {
        setSuspiciousUsers(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    }
    setLoading(false)
  }

  const loadUserDetails = async (userId: string) => {
    setLoadingDetails(true)
    try {
      const { data, error } = await supabase.rpc('get_user_activity_details', { p_user_id: userId })
      if (!error) setActivityDetails(data || [])
    } catch (error) {
      console.error('Error:', error)
    }
    setLoadingDetails(false)
  }

  const suspendUser = async (userId: string, reason: string) => {
    setActionLoading(userId)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase.rpc('suspend_user', {
        p_user_id: userId,
        p_reason: reason,
        p_admin_id: user?.id
      })
      
      if (error) {
        await supabase.from('profiles').update({
          is_suspended: true,
          suspension_reason: reason,
          suspended_at: new Date().toISOString()
        }).eq('id', userId)
      }
      
      setSuspiciousUsers(prev => prev.map(u => 
        u.user_id === userId ? { ...u, is_suspended: true, suspension_reason: reason } : u
      ))
      
      // Historical listesini de güncelle
      setHistoricalUsers(prev => prev.filter(u => u.user_id !== userId))
    } catch (error) {
      console.error('Suspend error:', error)
    }
    setActionLoading(null)
  }

  const unsuspendUser = async (userId: string) => {
    setActionLoading(userId)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase.rpc('unsuspend_user', {
        p_user_id: userId,
        p_admin_id: user?.id
      })
      
      if (error) {
        await supabase.from('profiles').update({
          is_suspended: false,
          suspension_reason: null,
          suspended_at: null,
          risk_score: 0
        }).eq('id', userId)
      }
      
      setSuspiciousUsers(prev => prev.map(u => 
        u.user_id === userId ? { ...u, is_suspended: false, suspension_reason: null, risk_score: 0 } : u
      ))
    } catch (error) {
      console.error('Unsuspend error:', error)
    }
    setActionLoading(null)
  }

  // ========================================
  // Historical Analysis Functions
  // ========================================

  const loadHistoricalData = async () => {
    setHistoricalLoading(true)
    try {
      // Özet istatistikleri yükle
      const { data: summary, error: summaryError } = await supabase.rpc('get_historical_analysis_summary')
      if (!summaryError && summary && summary.length > 0) {
        setHistoricalSummary(summary[0])
      }
      
      // Şüpheli kullanıcıları yükle
      const { data: users, error: usersError } = await supabase.rpc('get_historical_suspicious_users')
      
      if (usersError) {
        console.error('Historical RPC error:', usersError)
        // Fallback sorgu
        const { data: fallbackData } = await supabase
          .from('profiles')
          .select(`
            id, full_name, email, created_at,
            student_points!inner(total_questions, total_correct, total_points)
          `)
          .eq('role', 'ogrenci')
          .gt('student_points.total_questions', 1000)
          .order('student_points(total_questions)', { ascending: false })
          .limit(50)
        
        if (fallbackData) {
          setHistoricalUsers(fallbackData.map((u: any) => ({
            user_id: u.id,
            full_name: u.full_name || 'İsimsiz',
            email: u.email || '',
            created_at: u.created_at,
            total_questions: u.student_points?.total_questions || 0,
            total_correct: u.student_points?.total_correct || 0,
            total_points: u.student_points?.total_points || 0,
            accuracy_rate: u.student_points?.total_questions > 0 
              ? Math.round((u.student_points.total_correct / u.student_points.total_questions) * 100)
              : 0,
            daily_average: 0,
            days_since_registration: Math.floor((Date.now() - new Date(u.created_at).getTime()) / (1000 * 60 * 60 * 24)),
            suspicion_reasons: ['Yüksek soru sayısı'],
            risk_level: 'medium' as const
          })))
        }
      } else {
        setHistoricalUsers(users || [])
      }
    } catch (error) {
      console.error('Error:', error)
    }
    setHistoricalLoading(false)
  }

  const bulkSuspend = async () => {
    if (selectedForBulk.size === 0) return
    
    const userIds = Array.from(selectedForBulk)
    setActionLoading('bulk')
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase.rpc('bulk_suspend_users', {
        p_user_ids: userIds,
        p_reason: 'Geçmiş analizi - Toplu askıya alma',
        p_admin_id: user?.id
      })
      
      if (error) {
        // Fallback: tek tek askıya al
        for (const userId of userIds) {
          await supabase.from('profiles').update({
            is_suspended: true,
            suspension_reason: 'Geçmiş analizi - Toplu askıya alma',
            suspended_at: new Date().toISOString()
          }).eq('id', userId)
        }
      }
      
      // Listeden kaldır
      setHistoricalUsers(prev => prev.filter(u => !selectedForBulk.has(u.user_id)))
      setSelectedForBulk(new Set())
      
      alert(`${userIds.length} kullanıcı başarıyla askıya alındı`)
    } catch (error) {
      console.error('Bulk suspend error:', error)
      alert('Hata oluştu')
    }
    setActionLoading(null)
  }

  const resetUserPoints = async (userId: string) => {
    if (!confirm('Bu kullanıcının TÜM puanları sıfırlanacak. Emin misiniz?')) return
    
    setActionLoading(userId)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase.rpc('reset_user_points', {
        p_user_id: userId,
        p_admin_id: user?.id,
        p_reason: 'Hile tespiti - Puan sıfırlama'
      })
      
      if (error) {
        // Fallback
        await supabase.from('student_points').update({
          total_points: 0,
          total_questions: 0,
          total_correct: 0,
          total_wrong: 0,
          current_streak: 0,
          max_streak: 0
        }).eq('student_id', userId)
      }
      
      // Listeden kaldır
      setHistoricalUsers(prev => prev.filter(u => u.user_id !== userId))
      alert('Puanlar sıfırlandı')
    } catch (error) {
      console.error('Reset error:', error)
    }
    setActionLoading(null)
  }

  const toggleSelectAll = () => {
    if (selectedForBulk.size === historicalUsers.length) {
      setSelectedForBulk(new Set())
    } else {
      setSelectedForBulk(new Set(historicalUsers.map(u => u.user_id)))
    }
  }

  const toggleSelect = (userId: string) => {
    const newSet = new Set(selectedForBulk)
    if (newSet.has(userId)) {
      newSet.delete(userId)
    } else {
      newSet.add(userId)
    }
    setSelectedForBulk(newSet)
  }

  // ========================================
  // Effects
  // ========================================

  useEffect(() => {
    if (activeTab === 'live') {
      loadSuspiciousUsers()
    } else {
      loadHistoricalData()
    }
  }, [activeTab, hours])

  useEffect(() => {
    if (selectedUser) loadUserDetails(selectedUser.user_id)
  }, [selectedUser])

  // ========================================
  // Helpers
  // ========================================

  const filteredUsers = suspiciousUsers.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-100'
    if (score >= 50) return 'text-orange-600 bg-orange-100'
    if (score >= 30) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  const getRiskLevelColor = (level: string) => {
    if (level === 'critical') return 'text-red-600 bg-red-100'
    if (level === 'high') return 'text-orange-600 bg-orange-100'
    return 'text-yellow-600 bg-yellow-100'
  }

  const getRiskLevelLabel = (level: string) => {
    if (level === 'critical') return 'Kritik'
    if (level === 'high') return 'Yüksek'
    return 'Orta'
  }

  const getSpeedStatus = (avgMs: number) => {
    if (!avgMs || avgMs === 0) return { label: 'Bilinmiyor', color: 'text-gray-500' }
    if (avgMs < 1500) return { label: 'Bot Şüphesi!', color: 'text-red-600' }
    if (avgMs < 2500) return { label: 'Çok Hızlı', color: 'text-orange-600' }
    if (avgMs < 5000) return { label: 'Hızlı', color: 'text-yellow-600' }
    return { label: 'Normal', color: 'text-green-600' }
  }

  const stats = {
    total: suspiciousUsers.length,
    suspended: suspiciousUsers.filter(u => u.is_suspended).length,
    highRisk: suspiciousUsers.filter(u => u.risk_score >= 80).length,
    botSuspect: suspiciousUsers.filter(u => u.avg_answer_time_ms > 0 && u.avg_answer_time_ms < 2000).length
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-red-100 rounded-xl">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Güvenlik Merkezi</h1>
            <p className="text-gray-500">Bot ve şüpheli aktivite tespiti</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('live')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'live'
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          Canlı İzleme
        </button>
        <button
          onClick={() => setActiveTab('historical')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'historical'
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <History className="w-4 h-4" />
          Geçmiş Analizi
        </button>
      </div>

      {activeTab === 'live' ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-sm text-gray-500">Şüpheli Kullanıcı</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Ban className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.suspended}</p>
                  <p className="text-sm text-gray-500">Askıya Alınmış</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.highRisk}</p>
                  <p className="text-sm text-gray-500">Yüksek Risk</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Zap className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.botSuspect}</p>
                  <p className="text-sm text-gray-500">Bot Şüphesi</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="İsim veya email ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <select
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value={1}>Son 1 saat</option>
                <option value={6}>Son 6 saat</option>
                <option value={24}>Son 24 saat</option>
                <option value={72}>Son 3 gün</option>
                <option value={168}>Son 1 hafta</option>
              </select>
              
              <button
                onClick={loadSuspiciousUsers}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Yenile
              </button>
            </div>
          </div>

          {/* Live User List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Kullanıcı</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Risk Skoru</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Soru/Saat</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ort. Süre</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Doğruluk</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Durum</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center">
                        <RefreshCw className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
                        <p className="text-gray-500">Yükleniyor...</p>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center">
                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-gray-500">Şüpheli aktivite bulunamadı</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const speedStatus = getSpeedStatus(user.avg_answer_time_ms)
                      return (
                        <tr key={user.user_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900">{user.full_name}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-lg text-sm font-medium ${getRiskColor(user.risk_score)}`}>
                              {user.risk_score}/100
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={user.questions_last_hour > 50 ? 'text-red-600 font-bold' : ''}>
                              {user.questions_last_hour}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-sm font-medium ${speedStatus.color}`}>
                              {user.avg_answer_time_ms > 0 ? `${(user.avg_answer_time_ms / 1000).toFixed(1)}s` : '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={user.accuracy_rate > 95 ? 'text-orange-600 font-bold' : ''}>
                              %{user.accuracy_rate?.toFixed(0) || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {user.is_suspended ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-lg text-sm">
                                <Ban className="w-3 h-3" /> Askıda
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-sm">
                                <CheckCircle className="w-3 h-3" /> Aktif
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedUser(selectedUser?.user_id === user.user_id ? null : user)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                                title="Detayları Gör"
                              >
                                <Eye className="w-4 h-4 text-gray-600" />
                              </button>
                              
                              {user.is_suspended ? (
                                <button
                                  onClick={() => unsuspendUser(user.user_id)}
                                  disabled={actionLoading === user.user_id}
                                  className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                  {actionLoading === user.user_id ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Kaldır'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => suspendUser(user.user_id, 'Manuel askıya alma - Şüpheli aktivite')}
                                  disabled={actionLoading === user.user_id}
                                  className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                  {actionLoading === user.user_id ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Askıya Al'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Historical Stats */}
          {historicalSummary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{historicalSummary.total_suspicious}</p>
                    <p className="text-sm text-gray-500">Toplam Şüpheli</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Ban className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{historicalSummary.critical_count}</p>
                    <p className="text-sm text-gray-500">Kritik Risk</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Target className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{historicalSummary.total_suspicious_questions.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Şüpheli Soru</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{historicalSummary.total_suspicious_points.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Şüpheli Puan</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          {selectedForBulk.size > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center justify-between">
              <p className="text-red-700 font-medium">
                {selectedForBulk.size} kullanıcı seçildi
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedForBulk(new Set())}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  onClick={bulkSuspend}
                  disabled={actionLoading === 'bulk'}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading === 'bulk' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                  Toplu Askıya Al
                </button>
              </div>
            </div>
          )}

          {/* Refresh Button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={loadHistoricalData}
              disabled={historicalLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${historicalLoading ? 'animate-spin' : ''}`} />
              Analiz Et
            </button>
          </div>

          {/* Historical User List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedForBulk.size === historicalUsers.length && historicalUsers.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Kullanıcı</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Risk</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Toplam Soru</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Doğruluk</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Günlük Ort.</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Sebepler</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historicalLoading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center">
                        <RefreshCw className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
                        <p className="text-gray-500">Geçmiş veriler analiz ediliyor...</p>
                      </td>
                    </tr>
                  ) : historicalUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center">
                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-gray-500">Geçmişte şüpheli aktivite bulunamadı</p>
                      </td>
                    </tr>
                  ) : (
                    historicalUsers.map((user) => (
                      <tr key={user.user_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedForBulk.has(user.user_id)}
                            onChange={() => toggleSelect(user.user_id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">{user.full_name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <p className="text-xs text-gray-400">
                              {user.days_since_registration} gün önce kayıt
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-lg text-sm font-medium ${getRiskLevelColor(user.risk_level)}`}>
                            {getRiskLevelLabel(user.risk_level)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-gray-900">{user.total_questions.toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={user.accuracy_rate > 95 ? 'text-orange-600 font-bold' : ''}>
                            %{user.accuracy_rate}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={user.daily_average > 300 ? 'text-red-600 font-bold' : ''}>
                            {user.daily_average}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {user.suspicion_reasons?.slice(0, 2).map((reason, i) => (
                              <span key={i} className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded">
                                {reason.substring(0, 30)}...
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => suspendUser(user.user_id, 'Geçmiş analizi - Hile tespiti')}
                              disabled={actionLoading === user.user_id}
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50"
                              title="Askıya Al"
                            >
                              {actionLoading === user.user_id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => resetUserPoints(user.user_id)}
                              disabled={actionLoading === user.user_id}
                              className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 disabled:opacity-50"
                              title="Puanları Sıfırla"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedUser.full_name}</h2>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <p className="text-2xl font-bold text-gray-900">{selectedUser.total_questions}</p>
                    <p className="text-sm text-gray-500">Toplam Soru</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <p className="text-2xl font-bold text-gray-900">%{selectedUser.accuracy_rate?.toFixed(0) || 0}</p>
                    <p className="text-sm text-gray-500">Doğruluk</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <p className={`text-2xl font-bold ${getRiskColor(selectedUser.risk_score).split(' ')[0]}`}>
                      {selectedUser.risk_score}
                    </p>
                    <p className="text-sm text-gray-500">Risk Skoru</p>
                  </div>
                </div>

                {selectedUser.suspension_reason && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-700">
                      <strong>Askıya Alma Sebebi:</strong> {selectedUser.suspension_reason}
                    </p>
                  </div>
                )}

                <h3 className="font-semibold text-gray-900 mb-3">Son 7 Günlük Aktivite</h3>
                {loadingDetails ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
                  </div>
                ) : activityDetails.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Aktivite verisi bulunamadı</p>
                ) : (
                  <div className="space-y-2">
                    {activityDetails.slice(0, 24).map((activity, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        <div className="w-32 text-sm text-gray-500">
                          {new Date(activity.hour_bucket).toLocaleString('tr-TR', {
                            month: 'short', day: 'numeric', hour: '2-digit'
                          })}
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                            style={{ width: `${Math.min(100, activity.question_count)}%` }}
                          />
                        </div>
                        <div className="w-20 text-right text-sm">
                          <span className="font-medium">{activity.question_count}</span>
                          <span className="text-gray-400"> soru</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

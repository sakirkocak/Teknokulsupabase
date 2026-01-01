'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { motion, AnimatePresence } from 'framer-motion'
import { getInitials } from '@/lib/utils'
import { 
  Activity, 
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Trophy,
  Target,
  Flame,
  Calendar,
  BookOpen,
  Filter,
  X,
  User,
  TrendingUp,
  Clock
} from 'lucide-react'

interface UserActivity {
  student_id: string
  full_name: string
  avatar_url: string | null
  grade: number
  total_questions: number
  total_correct: number
  total_wrong: number
  total_points: number
  success_rate: number
  max_streak: number
  current_streak: number
  city_name: string | null
  school_name: string | null
  last_activity_at: number | null
}

interface ActivityDetail {
  activity_id: string
  question_id: string | null
  is_correct: boolean
  points: number
  date: string
  created_at: number
  question_text: string | null
  subject_name: string | null
  subject_code: string | null
  main_topic: string | null
  difficulty: string | null
}

interface UserDetailData {
  user: {
    student_id: string
    full_name: string
    avatar_url: string | null
    email: string | null
    grade: number
  } | null
  activities: ActivityDetail[]
  stats: {
    total: number
    correct: number
    wrong: number
    bySubject: { subject_code: string; count: number }[]
    byDate: { date: string; count: number }[]
  } | null
  total: number
}

export default function AdminUserActivitiesPage() {
  const { profile, loading: profileLoading } = useProfile()
  const [users, setUsers] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [sortBy, setSortBy] = useState('total_questions')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const limit = 25

  // Modal state
  const [selectedUser, setSelectedUser] = useState<UserActivity | null>(null)
  const [userDetail, setUserDetail] = useState<UserDetailData | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailPage, setDetailPage] = useState(1)

  useEffect(() => {
    loadUsers()
  }, [page, sortBy, order])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      loadUsers()
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  async function loadUsers() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        order,
        ...(search && { search })
      })
      
      const response = await fetch(`/api/admin/user-activities?${params}`)
      const data = await response.json()
      
      if (data.users) {
        setUsers(data.users)
        setTotal(data.total)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
    setLoading(false)
  }

  async function loadUserDetail(userId: string) {
    setDetailLoading(true)
    try {
      const params = new URLSearchParams({
        userId,
        page: detailPage.toString(),
        limit: '50'
      })
      
      const response = await fetch(`/api/admin/user-activity-detail?${params}`)
      const data = await response.json()
      setUserDetail(data)
    } catch (error) {
      console.error('Error loading user detail:', error)
    }
    setDetailLoading(false)
  }

  function openUserDetail(user: UserActivity) {
    setSelectedUser(user)
    setDetailPage(1)
    loadUserDetail(user.student_id)
  }

  function closeModal() {
    setSelectedUser(null)
    setUserDetail(null)
  }

  function handleSort(field: string) {
    if (sortBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setOrder('desc')
    }
    setPage(1)
  }

  const totalPages = Math.ceil(total / limit)

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
            <Activity className="w-7 h-7 text-primary-500" />
            Kullanıcı Aktiviteleri
          </h1>
          <p className="text-surface-500 mt-1">
            Tüm kullanıcıların soru çözüm istatistiklerini görüntüle
          </p>
        </div>
        <div className="text-sm text-surface-500 bg-surface-100 px-3 py-1.5 rounded-lg">
          Toplam: <span className="font-semibold text-surface-900">{total}</span> kullanıcı
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-surface-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              placeholder="Kullanıcı ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={`${sortBy}-${order}`}
            onChange={(e) => {
              const [field, ord] = e.target.value.split('-')
              setSortBy(field)
              setOrder(ord as 'asc' | 'desc')
              setPage(1)
            }}
            className="px-4 py-2.5 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="total_questions-desc">En Çok Soru Çözen</option>
            <option value="total_questions-asc">En Az Soru Çözen</option>
            <option value="total_correct-desc">En Çok Doğru</option>
            <option value="total_points-desc">En Yüksek Puan</option>
            <option value="max_streak-desc">En Uzun Seri</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-surface-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-50 border-b border-surface-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase">Kullanıcı</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-surface-500 uppercase cursor-pointer hover:text-surface-700" onClick={() => handleSort('total_questions')}>
                  Toplam {sortBy === 'total_questions' && (order === 'desc' ? '↓' : '↑')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-surface-500 uppercase cursor-pointer hover:text-surface-700" onClick={() => handleSort('total_correct')}>
                  Doğru {sortBy === 'total_correct' && (order === 'desc' ? '↓' : '↑')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-surface-500 uppercase">Yanlış</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-surface-500 uppercase">Başarı</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-surface-500 uppercase cursor-pointer hover:text-surface-700" onClick={() => handleSort('total_points')}>
                  Puan {sortBy === 'total_points' && (order === 'desc' ? '↓' : '↑')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-surface-500 uppercase">Seri</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-10 bg-surface-100 rounded-lg w-48" /></td>
                    <td className="px-4 py-3"><div className="h-6 bg-surface-100 rounded w-12 mx-auto" /></td>
                    <td className="px-4 py-3"><div className="h-6 bg-surface-100 rounded w-12 mx-auto" /></td>
                    <td className="px-4 py-3"><div className="h-6 bg-surface-100 rounded w-12 mx-auto" /></td>
                    <td className="px-4 py-3"><div className="h-6 bg-surface-100 rounded w-16 mx-auto" /></td>
                    <td className="px-4 py-3"><div className="h-6 bg-surface-100 rounded w-16 mx-auto" /></td>
                    <td className="px-4 py-3"><div className="h-6 bg-surface-100 rounded w-12 mx-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-surface-500">
                    Kullanıcı bulunamadı
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr 
                    key={user.student_id} 
                    className="hover:bg-surface-50 cursor-pointer transition-colors"
                    onClick={() => openUserDetail(user)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium text-sm">
                            {getInitials(user.full_name)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-surface-900">{user.full_name}</p>
                          <p className="text-xs text-surface-500">
                            {user.grade}. Sınıf {user.school_name && `• ${user.school_name}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-surface-900">{user.total_questions.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-green-600 font-medium">{user.total_correct.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-red-500 font-medium">{user.total_wrong.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.success_rate >= 70 ? 'bg-green-100 text-green-700' :
                        user.success_rate >= 50 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        %{user.success_rate}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-primary-600">{user.total_points.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="font-medium">{user.max_streak}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 bg-surface-50">
            <p className="text-sm text-surface-500">
              {((page - 1) * limit) + 1} - {Math.min(page * limit, total)} / {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-surface-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-surface-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-surface-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 bg-gradient-to-r from-primary-500 to-primary-600">
                <div className="flex items-center gap-4">
                  {selectedUser.avatar_url ? (
                    <img src={selectedUser.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-white" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                      {getInitials(selectedUser.full_name)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedUser.full_name}</h2>
                    <p className="text-white/80 text-sm">{selectedUser.grade}. Sınıf</p>
                  </div>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                {detailLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
                  </div>
                ) : userDetail ? (
                  <div className="p-6 space-y-6">
                    {/* Stats Cards */}
                    {userDetail.stats && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-surface-50 rounded-xl p-4 text-center">
                          <Target className="w-8 h-8 text-primary-500 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-surface-900">{userDetail.stats.total.toLocaleString()}</p>
                          <p className="text-xs text-surface-500">Toplam Soru</p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4 text-center">
                          <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-green-600">{userDetail.stats.correct.toLocaleString()}</p>
                          <p className="text-xs text-surface-500">Doğru</p>
                        </div>
                        <div className="bg-red-50 rounded-xl p-4 text-center">
                          <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-red-600">{userDetail.stats.wrong.toLocaleString()}</p>
                          <p className="text-xs text-surface-500">Yanlış</p>
                        </div>
                        <div className="bg-primary-50 rounded-xl p-4 text-center">
                          <TrendingUp className="w-8 h-8 text-primary-500 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-primary-600">
                            %{userDetail.stats.total > 0 ? Math.round((userDetail.stats.correct / userDetail.stats.total) * 100) : 0}
                          </p>
                          <p className="text-xs text-surface-500">Başarı</p>
                        </div>
                      </div>
                    )}

                    {/* Activity List */}
                    <div>
                      <h3 className="font-semibold text-surface-900 mb-3 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-surface-400" />
                        Son Aktiviteler
                      </h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {userDetail.activities.length === 0 ? (
                          <p className="text-center text-surface-500 py-8">Henüz aktivite yok</p>
                        ) : (
                          userDetail.activities.map((activity) => (
                            <div 
                              key={activity.activity_id}
                              className={`flex items-start gap-3 p-3 rounded-lg border ${
                                activity.is_correct 
                                  ? 'bg-green-50 border-green-200' 
                                  : 'bg-red-50 border-red-200'
                              }`}
                            >
                              <div className={`p-1.5 rounded-full ${activity.is_correct ? 'bg-green-500' : 'bg-red-500'}`}>
                                {activity.is_correct ? (
                                  <CheckCircle className="w-4 h-4 text-white" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-white" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-surface-900 line-clamp-2">
                                  {activity.question_text || 'Soru detayı yüklenemedi'}
                                </p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-surface-500">
                                  {activity.subject_name && (
                                    <span className="bg-surface-200 px-2 py-0.5 rounded">{activity.subject_name}</span>
                                  )}
                                  {activity.difficulty && (
                                    <span className="bg-surface-200 px-2 py-0.5 rounded">{activity.difficulty}</span>
                                  )}
                                  <span>{activity.date}</span>
                                  <span className="font-medium text-primary-600">+{activity.points} XP</span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-20 text-surface-500">
                    Veri yüklenemedi
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

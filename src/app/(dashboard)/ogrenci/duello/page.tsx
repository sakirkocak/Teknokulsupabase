'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { useProfile, useStudentProfile } from '@/hooks/useProfile'
import { getInitials } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Swords, Trophy, Users, Clock, Target, Zap, Crown,
  Play, Check, X, AlertCircle, Search, Send, Shield,
  Flame, Star, Award, ChevronRight, RefreshCw, Trash2
} from 'lucide-react'
import { Duel, DuelStats } from '@/types/database'

interface DuelWithProfiles extends Duel {
  challenger?: {
    id: string
    user_id: string
    profile?: { full_name: string; avatar_url: string | null }
  }
  opponent?: {
    id: string
    user_id: string
    profile?: { full_name: string; avatar_url: string | null }
  }
}

const subjects = [
  { key: 'all', label: 'Karışık', color: 'from-purple-500 to-indigo-500' },
  // Ana Dersler (LGS)
  { key: 'Matematik', label: 'Matematik', color: 'from-blue-500 to-indigo-500' },
  { key: 'Türkçe', label: 'Türkçe', color: 'from-red-500 to-rose-500' },
  { key: 'Fen Bilimleri', label: 'Fen Bilimleri', color: 'from-green-500 to-emerald-500' },
  { key: 'T.C. İnkılap Tarihi ve Atatürkçülük', label: 'İnkılap Tarihi', color: 'from-orange-500 to-amber-500' },
  { key: 'İngilizce', label: 'İngilizce', color: 'from-violet-500 to-purple-500' },
  { key: 'Din Kültürü ve Ahlak Bilgisi', label: 'Din Kültürü', color: 'from-emerald-500 to-teal-500' },
  // Ortaokul Dersleri
  { key: 'Sosyal Bilgiler', label: 'Sosyal Bilgiler', color: 'from-amber-500 to-yellow-500' },
  // Lise Dersleri
  { key: 'Fizik', label: 'Fizik', color: 'from-cyan-500 to-blue-500' },
  { key: 'Kimya', label: 'Kimya', color: 'from-pink-500 to-rose-500' },
  { key: 'Biyoloji', label: 'Biyoloji', color: 'from-lime-500 to-green-500' },
  { key: 'Tarih', label: 'Tarih', color: 'from-yellow-500 to-orange-500' },
  { key: 'Coğrafya', label: 'Coğrafya', color: 'from-teal-500 to-cyan-500' },
  { key: 'Türk Dili ve Edebiyatı', label: 'Edebiyat', color: 'from-indigo-500 to-violet-500' },
  { key: 'Felsefe', label: 'Felsefe', color: 'from-fuchsia-500 to-pink-500' },
]

export default function DuelPage() {
  const { profile } = useProfile()
  const { studentProfile } = useStudentProfile(profile?.id || '')
  
  const [activeTab, setActiveTab] = useState<'lobby' | 'active' | 'history'>('lobby')
  const [myStats, setMyStats] = useState<DuelStats | null>(null)
  const [pendingDuels, setPendingDuels] = useState<DuelWithProfiles[]>([])
  const [activeDuels, setActiveDuels] = useState<DuelWithProfiles[]>([])
  const [completedDuels, setCompletedDuels] = useState<DuelWithProfiles[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const supabase = createClient()

  // Düello silme fonksiyonu
  const deleteDuel = async (duelId: string) => {
    if (!confirm('Bu düelloyu silmek istediğinize emin misiniz?')) return
    
    setDeleting(duelId)
    try {
      const response = await fetch('/api/duel/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duelId, studentId: studentProfile?.id })
      })
      
      if (response.ok) {
        // Listelerden kaldır
        setPendingDuels(prev => prev.filter(d => d.id !== duelId))
        setActiveDuels(prev => prev.filter(d => d.id !== duelId))
        setCompletedDuels(prev => prev.filter(d => d.id !== duelId))
      } else {
        alert('Düello silinemedi')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Bir hata oluştu')
    }
    setDeleting(null)
  }

  useEffect(() => {
    if (studentProfile?.id) {
      loadData()
    }
  }, [studentProfile?.id])

  const loadData = async () => {
    if (!studentProfile?.id) return
    setLoading(true)

    // Düello istatistiklerimi al
    const { data: statsData } = await supabase
      .from('duel_stats')
      .select('*')
      .eq('student_id', studentProfile.id)
      .single()

    if (statsData) setMyStats(statsData)

    // Bekleyen düellolar (bana gelen)
    const { data: pendingData } = await supabase
      .from('duels')
      .select(`
        *,
        challenger:student_profiles!duels_challenger_id_fkey(
          id, user_id,
          profile:profiles!student_profiles_user_id_fkey(full_name, avatar_url)
        )
      `)
      .eq('opponent_id', studentProfile.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (pendingData) setPendingDuels(pendingData)

    // Aktif düellolar
    const { data: activeData } = await supabase
      .from('duels')
      .select(`
        *,
        challenger:student_profiles!duels_challenger_id_fkey(
          id, user_id,
          profile:profiles!student_profiles_user_id_fkey(full_name, avatar_url)
        ),
        opponent:student_profiles!duels_opponent_id_fkey(
          id, user_id,
          profile:profiles!student_profiles_user_id_fkey(full_name, avatar_url)
        )
      `)
      .or(`challenger_id.eq.${studentProfile.id},opponent_id.eq.${studentProfile.id}`)
      .eq('status', 'active') // Aktif düellolar
      .order('created_at', { ascending: false })

    if (activeData) setActiveDuels(activeData)

    // Tamamlanmış düellolar
    const { data: completedData } = await supabase
      .from('duels')
      .select(`
        *,
        challenger:student_profiles!duels_challenger_id_fkey(
          id, user_id,
          profile:profiles!student_profiles_user_id_fkey(full_name, avatar_url)
        ),
        opponent:student_profiles!duels_opponent_id_fkey(
          id, user_id,
          profile:profiles!student_profiles_user_id_fkey(full_name, avatar_url)
        )
      `)
      .or(`challenger_id.eq.${studentProfile.id},opponent_id.eq.${studentProfile.id}`)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(20)

    if (completedData) setCompletedDuels(completedData)

    setLoading(false)
  }

  const searchOpponents = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        avatar_url,
        student_profile:student_profiles!student_profiles_user_id_fkey(id)
      `)
      .eq('role', 'ogrenci')
      .neq('id', profile?.id)
      .ilike('full_name', `%${query}%`)
      .limit(10)

    if (data) {
      setSearchResults(data.filter((d: any) => d.student_profile?.id))
    }
  }

  const createDuel = async (opponentStudentId: string) => {
    if (!studentProfile?.id) return
    setCreating(true)

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 saat geçerli

    const { error } = await supabase
      .from('duels')
      .insert({
        challenger_id: studentProfile.id,
        opponent_id: opponentStudentId,
        subject: selectedSubject === 'all' ? null : selectedSubject,
        question_count: 5,
        expires_at: expiresAt.toISOString(),
      })

    if (!error) {
      setSearchQuery('')
      setSearchResults([])
      loadData()
      setSuccessMessage('🎉 Düello daveti gönderildi! Rakibinin kabul etmesini bekle.')
      // 5 saniye sonra mesajı kaldır
      setTimeout(() => setSuccessMessage(null), 5000)
    } else {
      alert('Hata: ' + error.message)
    }

    setCreating(false)
  }

  const acceptDuel = async (duelId: string) => {
    try {
      const response = await fetch('/api/duel/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duelId, studentId: studentProfile?.id })
      })

      if (response.ok) {
        // Bekleme odasına yönlendir
        window.location.href = `/ogrenci/duello/${duelId}/bekle`
      } else {
        const data = await response.json()
        alert(data.error || 'Düello kabul edilemedi')
      }
    } catch (error) {
      console.error('Accept error:', error)
      alert('Bir hata oluştu')
    }
  }

  const rejectDuel = async (duelId: string) => {
    const { error } = await supabase
      .from('duels')
      .update({
        status: 'cancelled',
      })
      .eq('id', duelId)

    if (!error) {
      loadData()
    }
  }

  const getOpponentInfo = (duel: DuelWithProfiles) => {
    if (duel.challenger_id === studentProfile?.id) {
      return duel.opponent?.profile
    }
    return duel.challenger?.profile
  }

  const getMyScore = (duel: DuelWithProfiles) => {
    if (duel.challenger_id === studentProfile?.id) {
      return duel.challenger_score
    }
    return duel.opponent_score
  }

  const getOpponentScore = (duel: DuelWithProfiles) => {
    if (duel.challenger_id === studentProfile?.id) {
      return duel.opponent_score
    }
    return duel.challenger_score
  }

  const didIWin = (duel: DuelWithProfiles) => {
    return duel.winner_id === studentProfile?.id
  }

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
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-3">
              <Swords className="h-8 w-8 text-red-500" />
              Düello Arenası
            </h1>
            <p className="text-surface-500 mt-1">Arkadaşlarınla yarış, en iyisi ol!</p>
          </div>
          <button
            onClick={loadData}
            className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
          >
            <RefreshCw className="h-5 w-5 text-surface-500" />
          </button>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-4 bg-gradient-to-br from-blue-500/10 to-indigo-500/10"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-surface-900 dark:text-white">
                {myStats?.total_duels || 0}
              </div>
              <div className="text-xs text-surface-500">Toplam Düello</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {myStats?.wins || 0}
              </div>
              <div className="text-xs text-surface-500">Galibiyet</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-4 bg-gradient-to-br from-red-500/10 to-rose-500/10"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">
                {myStats?.losses || 0}
              </div>
              <div className="text-xs text-surface-500">Mağlubiyet</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-4 bg-gradient-to-br from-orange-500/10 to-amber-500/10"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500 flex items-center justify-center gap-1">
                <Flame className="h-5 w-5" />
                {myStats?.win_streak || 0}
              </div>
              <div className="text-xs text-surface-500">Galibiyet Serisi</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card p-4 bg-gradient-to-br from-yellow-500/10 to-amber-500/10"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">
                +{myStats?.total_points_earned || 0}
              </div>
              <div className="text-xs text-surface-500">Kazanılan Puan</div>
            </div>
          </motion.div>
        </div>

        {/* Tab'lar */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('lobby')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'lobby'
                ? 'bg-primary-500 text-white'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200'
            }`}
          >
            <Users className="h-4 w-4" />
            Düello Başlat
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'active'
                ? 'bg-primary-500 text-white'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200'
            }`}
          >
            <Swords className="h-4 w-4" />
            Aktif
            {(pendingDuels.length + activeDuels.length) > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {pendingDuels.length + activeDuels.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-primary-500 text-white'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200'
            }`}
          >
            <Trophy className="h-4 w-4" />
            Geçmiş
          </button>
        </div>

        {/* Düello Başlat */}
        {activeTab === 'lobby' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Ders Seçimi */}
            <div className="card p-6">
              <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
                Düello Konusu
              </h3>
              <div className="flex flex-wrap gap-2">
                {subjects.map((subject) => (
                  <button
                    key={subject.key}
                    onClick={() => setSelectedSubject(subject.key)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedSubject === subject.key
                        ? `bg-gradient-to-r ${subject.color} text-white`
                        : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200'
                    }`}
                  >
                    {subject.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Başarı Mesajı */}
            <AnimatePresence>
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="card p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 mb-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">
                        {successMessage}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Aktif sekmesinden takip edebilirsin.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Rakip Ara */}
            <div className="card p-6">
              <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
                Rakip Bul
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    searchOpponents(e.target.value)
                  }}
                  placeholder="Öğrenci adı ile ara..."
                  className="input pl-10"
                />
              </div>

              {/* Arama Sonuçları */}
              {searchResults.length > 0 && (
                <div className="mt-4 space-y-2">
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                          {result.avatar_url ? (
                            <img src={result.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            getInitials(result.full_name)
                          )}
                        </div>
                        <span className="font-medium text-surface-900 dark:text-white">
                          {result.full_name}
                        </span>
                      </div>
                      <button
                        onClick={() => createDuel(result.student_profile.id)}
                        disabled={creating}
                        className="btn btn-primary btn-sm"
                      >
                        {creating ? (
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-1" />
                            Davet Et
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 && searchResults.length === 0 && (
                <p className="mt-4 text-center text-surface-500">Sonuç bulunamadı</p>
              )}
            </div>

            {/* Bilgi */}
            <div className="card p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-700 dark:text-amber-300">
                  <strong>Düello Kuralları:</strong>
                  <ul className="mt-2 space-y-1">
                    <li>• Her düelloda 5 soru sorulur</li>
                    <li>• Doğru cevap: +2 puan, Yanlış cevap: -1 puan</li>
                    <li>• Kazanan 10 bonus puan alır</li>
                    <li>• Düello daveti 24 saat geçerlidir</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Aktif Düellolar */}
        {activeTab === 'active' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Bekleyen Davetler */}
            {pendingDuels.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-surface-900 dark:text-white">
                  📩 Gelen Davetler
                </h3>
                {pendingDuels.map((duel) => (
                  <div
                    key={duel.id}
                    className="card p-4 border-2 border-amber-500/50 bg-amber-50/50 dark:bg-amber-900/10"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                          {duel.challenger?.profile?.avatar_url ? (
                            <img src={duel.challenger.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            getInitials(duel.challenger?.profile?.full_name || '')
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-surface-900 dark:text-white">
                            {duel.challenger?.profile?.full_name}
                          </div>
                          <div className="text-sm text-surface-500">
                            {duel.subject || 'Karışık'} • {duel.question_count} soru
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => rejectDuel(duel.id)}
                          className="btn bg-red-100 text-red-600 hover:bg-red-200"
                          title="Reddet"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => acceptDuel(duel.id)}
                          className="btn btn-primary"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Kabul Et
                        </button>
                        <button
                          onClick={() => deleteDuel(duel.id)}
                          disabled={deleting === duel.id}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Düelloyu Sil"
                        >
                          {deleting === duel.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Aktif Düellolar */}
            {activeDuels.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-surface-900 dark:text-white">
                  ⚔️ Devam Eden Düellolar
                </h3>
                {activeDuels.map((duel) => {
                  const opponent = getOpponentInfo(duel)
                  return (
                    <div
                      key={duel.id}
                      className="card p-4 border-2 border-primary-500/50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                            {opponent?.avatar_url ? (
                              <img src={opponent.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              getInitials(opponent?.full_name || '')
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-surface-900 dark:text-white">
                              vs {opponent?.full_name}
                            </div>
                            <div className="text-sm text-surface-500">
                              {duel.subject || 'Karışık'} • Soru {duel.current_question + 1}/{duel.question_count}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-500">{getMyScore(duel)}</div>
                            <div className="text-xs text-surface-500">Sen</div>
                          </div>
                          <span className="text-surface-400">-</span>
                          <div className="text-center">
                            <div className="text-lg font-bold text-red-500">{getOpponentScore(duel)}</div>
                            <div className="text-xs text-surface-500">Rakip</div>
                          </div>
                          <Link 
                            href={`/ogrenci/duello/${duel.id}/bekle`} 
                            className="btn btn-primary"
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Hazırlan
                          </Link>
                          <button
                            onClick={() => deleteDuel(duel.id)}
                            disabled={deleting === duel.id}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Düelloyu Sil"
                          >
                            {deleting === duel.id ? (
                              <RefreshCw className="h-5 w-5 animate-spin" />
                            ) : (
                              <Trash2 className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {pendingDuels.length === 0 && activeDuels.length === 0 && (
              <div className="card p-12 text-center">
                <Swords className="h-16 w-16 text-surface-300 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
                  Aktif düello yok
                </h2>
                <p className="text-surface-500">
                  Yeni bir düello başlat veya davet bekle!
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Geçmiş */}
        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {completedDuels.map((duel) => {
              const opponent = getOpponentInfo(duel)
              const won = didIWin(duel)
              const draw = !duel.winner_id

              return (
                <div
                  key={duel.id}
                  className={`card p-4 border-l-4 ${
                    draw ? 'border-l-gray-400' : won ? 'border-l-green-500' : 'border-l-red-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        draw ? 'bg-gray-200 dark:bg-gray-700' : won ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                      }`}>
                        {draw ? (
                          <Shield className="h-5 w-5 text-gray-500" />
                        ) : won ? (
                          <Trophy className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-surface-900 dark:text-white">
                          vs {opponent?.full_name}
                        </div>
                        <div className="text-sm text-surface-500">
                          {duel.subject || 'Karışık'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className={`text-lg font-bold ${won ? 'text-green-500' : draw ? 'text-gray-500' : 'text-surface-500'}`}>
                          {getMyScore(duel)}
                        </div>
                      </div>
                      <span className="text-surface-400">-</span>
                      <div className="text-center">
                        <div className={`text-lg font-bold ${!won && !draw ? 'text-red-500' : 'text-surface-500'}`}>
                          {getOpponentScore(duel)}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        draw 
                          ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          : won 
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {draw ? 'Berabere' : won ? 'Kazandın' : 'Kaybettin'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}

            {completedDuels.length === 0 && (
              <div className="card p-12 text-center">
                <Trophy className="h-16 w-16 text-surface-300 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
                  Henüz düello geçmişi yok
                </h2>
                <p className="text-surface-500">
                  İlk düellonu başlat!
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  )
}


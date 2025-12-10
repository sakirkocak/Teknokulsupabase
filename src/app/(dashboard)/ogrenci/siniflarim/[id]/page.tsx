'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Users, Megaphone, FileText, Download,
  Pin, Trophy, Medal, Award, Crown
} from 'lucide-react'

interface Classroom {
  id: string
  name: string
  description: string
  subject: string
  grade_level: string
  coach: {
    full_name: string
    avatar_url: string | null
  }
}

interface Announcement {
  id: string
  title: string
  content: string
  is_pinned: boolean
  created_at: string
}

interface Material {
  id: string
  title: string
  description: string
  file_url: string
  file_type: string
  download_count: number
  created_at: string
}

interface LeaderboardEntry {
  id: string
  student_id: string
  student_name: string
  avatar_url: string | null
  tasks_completed: number
  avg_score: number
  points: number
  rank: number
}

export default function OgrenciSinifDetayPage() {
  const params = useParams()
  const supabase = createClientComponentClient()

  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [activeTab, setActiveTab] = useState<'announcements' | 'materials' | 'leaderboard'>('announcements')
  const [loading, setLoading] = useState(true)
  const [myRank, setMyRank] = useState<number | null>(null)

  useEffect(() => {
    loadClassroomData()
  }, [params.id])

  async function loadClassroomData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: studentProfile } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      const classroomId = params.id as string

      // Sınıf bilgisi
      const { data: classroomData } = await supabase
        .from('classrooms')
        .select(`
          *,
          coach:teacher_profiles(full_name, avatar_url)
        `)
        .eq('id', classroomId)
        .single()

      if (classroomData) setClassroom(classroomData)

      // Duyurular
      const { data: announcementsData } = await supabase
        .from('classroom_announcements')
        .select('*')
        .eq('classroom_id', classroomId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })

      if (announcementsData) setAnnouncements(announcementsData)

      // Materyaller
      const { data: materialsData } = await supabase
        .from('classroom_materials')
        .select('*')
        .eq('classroom_id', classroomId)
        .order('created_at', { ascending: false })

      if (materialsData) setMaterials(materialsData)

      // Leaderboard
      const weekStart = getWeekStart()
      const { data: leaderboardData } = await supabase
        .from('classroom_leaderboard')
        .select(`
          *,
          student:student_profiles(full_name, avatar_url)
        `)
        .eq('classroom_id', classroomId)
        .eq('week_start', weekStart)
        .order('points', { ascending: false })

      if (leaderboardData) {
        const enriched = leaderboardData.map((entry, index) => ({
          ...entry,
          student_name: entry.student?.full_name || 'Öğrenci',
          avatar_url: entry.student?.avatar_url,
          rank: index + 1
        }))
        setLeaderboard(enriched)

        // Benim sıramı bul
        if (studentProfile) {
          const myEntry = enriched.find(e => e.student_id === studentProfile.id)
          if (myEntry) setMyRank(myEntry.rank)
        }
      }

    } catch (error) {
      console.error('Veri yükleme hatası:', error)
    } finally {
      setLoading(false)
    }
  }

  function getWeekStart(): string {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    const monday = new Date(now.setDate(diff))
    return monday.toISOString().split('T')[0]
  }

  async function handleDownload(material: Material) {
    // İndirme sayısını artır
    await supabase
      .from('classroom_materials')
      .update({ download_count: (material.download_count || 0) + 1 })
      .eq('id', material.id)

    // Dosyayı indir
    window.open(material.file_url, '_blank')
  }

  function getRankIcon(rank: number) {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-gray-500 font-medium">{rank}</span>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!classroom) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Sınıf bulunamadı</p>
        <Link href="/ogrenci/siniflarim" className="text-blue-600 hover:underline mt-2 inline-block">
          Geri dön
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/ogrenci/siniflarim"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{classroom.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {classroom.coach?.avatar_url ? (
                    <img src={classroom.coach.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-500 text-xs">Ö</span>
                  )}
                </div>
                <span className="text-sm text-gray-600">{classroom.coach?.full_name}</span>
              </div>
              {classroom.subject && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                  {classroom.subject}
                </span>
              )}
            </div>
          </div>
        </div>

        {myRank && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-lg">
            <Trophy className="w-5 h-5" />
            <span className="font-medium">Sıralamanız: {myRank}.</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'announcements', label: 'Duyurular', icon: Megaphone, count: announcements.length },
            { id: 'materials', label: 'Materyaller', icon: FileText, count: materials.length },
            { id: 'leaderboard', label: 'Sıralama', icon: Trophy, count: leaderboard.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors
                ${activeTab === tab.id 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count > 0 && (
                <span className={`
                  px-1.5 py-0.5 rounded-full text-xs
                  ${activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
                `}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Duyurular Tab */}
          {activeTab === 'announcements' && (
            <div>
              {announcements.length === 0 ? (
                <div className="text-center py-8">
                  <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Henüz duyuru yok</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((announcement, index) => (
                    <motion.div
                      key={announcement.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-lg ${
                        announcement.is_pinned 
                          ? 'bg-blue-50 border border-blue-200' 
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {announcement.is_pinned && (
                          <Pin className="w-4 h-4 text-blue-500" />
                        )}
                        <h4 className="font-medium text-gray-900">{announcement.title}</h4>
                      </div>
                      <p className="text-gray-600">{announcement.content}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(announcement.created_at).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Materyaller Tab */}
          {activeTab === 'materials' && (
            <div>
              {materials.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Henüz materyal yok</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {materials.map((material, index) => (
                    <motion.div
                      key={material.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 bg-gray-50 rounded-lg flex items-start justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{material.title}</h4>
                          {material.description && (
                            <p className="text-sm text-gray-500">{material.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {material.download_count} indirme
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(material)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div>
              {leaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Henüz sıralama verisi yok</p>
                  <p className="text-sm text-gray-400 mt-1">Görevleri tamamlayarak puan kazanın!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`
                        flex items-center justify-between p-4 rounded-lg
                        ${entry.rank === 1 ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200' :
                          entry.rank === 2 ? 'bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200' :
                          entry.rank === 3 ? 'bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200' :
                          'bg-gray-50'}
                      `}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 flex items-center justify-center">
                          {getRankIcon(entry.rank)}
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {entry.avatar_url ? (
                            <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-gray-500 text-sm font-medium">
                              {entry.student_name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{entry.student_name}</p>
                          <p className="text-sm text-gray-500">
                            {entry.tasks_completed} görev • Ort. {entry.avg_score.toFixed(1)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">{entry.points}</p>
                        <p className="text-xs text-gray-500">puan</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


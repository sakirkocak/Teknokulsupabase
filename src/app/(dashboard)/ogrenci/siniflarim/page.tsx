'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  BookOpen, Users, Megaphone, FileText, ArrowRight,
  UserPlus, Loader2, Check, X
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
  student_count: number
  announcement_count: number
}

export default function OgrenciSiniflarimPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadClassrooms()
  }, [])

  async function loadClassrooms() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: studentProfile } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!studentProfile) return

      // Öğrencinin katıldığı sınıfları getir
      const { data: classroomStudents } = await supabase
        .from('classroom_students')
        .select('classroom_id')
        .eq('student_id', studentProfile.id)
        .eq('status', 'joined')

      if (!classroomStudents || classroomStudents.length === 0) {
        setLoading(false)
        return
      }

      const classroomIds = classroomStudents.map(cs => cs.classroom_id)

      const { data: classroomsData } = await supabase
        .from('classrooms')
        .select(`
          *,
          coach:teacher_profiles(full_name, avatar_url)
        `)
        .in('id', classroomIds)
        .eq('is_active', true)

      if (classroomsData) {
        // Her sınıf için ek veriler
        const enrichedClassrooms = await Promise.all(
          classroomsData.map(async (classroom) => {
            const { count: studentCount } = await supabase
              .from('classroom_students')
              .select('*', { count: 'exact', head: true })
              .eq('classroom_id', classroom.id)
              .eq('status', 'joined')

            const { count: announcementCount } = await supabase
              .from('classroom_announcements')
              .select('*', { count: 'exact', head: true })
              .eq('classroom_id', classroom.id)

            return {
              ...classroom,
              student_count: studentCount || 0,
              announcement_count: announcementCount || 0
            }
          })
        )
        setClassrooms(enrichedClassrooms)
      }
    } catch (error) {
      console.error('Sınıflar yüklenirken hata:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleJoinClassroom() {
    if (!joinCode.trim()) return
    setJoining(true)
    setMessage(null)

    try {
      const response = await fetch('/api/classrooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode: joinCode.toUpperCase() })
      })

      const data = await response.json()

      if (data.error) {
        setMessage({ type: 'error', text: data.error })
      } else {
        setMessage({ type: 'success', text: data.message })
        setJoinCode('')
        loadClassrooms()
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' })
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sınıflarım</h1>
        <p className="text-gray-600 mt-1">Katıldığınız sınıfları görüntüleyin</p>
      </div>

      {/* Join Classroom Card */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Sınıfa Katıl</h2>
            <p className="text-blue-100 text-sm">Öğretmeninizden aldığınız kodu girin</p>
          </div>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Sınıf kodu (örn: ABC123)"
            maxLength={6}
            className="flex-1 px-4 py-3 bg-white/20 border border-white/30 rounded-lg placeholder-white/50 text-white focus:outline-none focus:ring-2 focus:ring-white/50 font-mono tracking-wider uppercase"
          />
          <button
            onClick={handleJoinClassroom}
            disabled={!joinCode.trim() || joining}
            className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {joining ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Katıl'}
          </button>
        </div>

        {message && (
          <div className={`mt-3 flex items-center gap-2 text-sm ${
            message.type === 'success' ? 'text-green-200' : 'text-red-200'
          }`}>
            {message.type === 'success' ? (
              <Check className="w-4 h-4" />
            ) : (
              <X className="w-4 h-4" />
            )}
            {message.text}
          </div>
        )}
      </div>

      {/* Classrooms List */}
      {classrooms.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz sınıfınız yok</h3>
          <p className="text-gray-600">
            Öğretmeninizden aldığınız sınıf kodunu yukarıya girerek bir sınıfa katılabilirsiniz
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classrooms.map((classroom, index) => (
            <motion.div
              key={classroom.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{classroom.name}</h3>
                    {classroom.subject && (
                      <p className="text-sm text-gray-500">{classroom.subject}</p>
                    )}
                  </div>
                  {classroom.grade_level && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                      {classroom.grade_level}
                    </span>
                  )}
                </div>

                {/* Coach Info */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {classroom.coach?.avatar_url ? (
                      <img src={classroom.coach.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-500 text-xs font-medium">
                        {classroom.coach?.full_name?.charAt(0) || 'Ö'}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-600">
                    {classroom.coach?.full_name || 'Öğretmen'}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{classroom.student_count} öğrenci</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Megaphone className="w-4 h-4" />
                    <span>{classroom.announcement_count} duyuru</span>
                  </div>
                </div>
              </div>

              <Link
                href={`/ogrenci/siniflarim/${classroom.id}`}
                className="flex items-center justify-between px-5 py-3 bg-gray-50 border-t border-gray-100 hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">Sınıfa Git</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Users, Plus, BookOpen, Calendar, Copy, Check,
  MoreVertical, Trash2, Settings, ChevronRight
} from 'lucide-react'

interface Classroom {
  id: string
  name: string
  description: string
  subject: string
  grade_level: string
  join_code: string
  is_active: boolean
  created_at: string
  student_count?: number
}

export default function SiniflarimPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadClassrooms()
  }, [])

  async function loadClassrooms() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!teacherProfile) return

      const { data: classroomsData } = await supabase
        .from('classrooms')
        .select('*')
        .eq('coach_id', teacherProfile.id)
        .order('created_at', { ascending: false })

      if (classroomsData) {
        // Her sınıf için öğrenci sayısını al
        const classroomsWithCount = await Promise.all(
          classroomsData.map(async (classroom) => {
            const { count } = await supabase
              .from('classroom_students')
              .select('*', { count: 'exact', head: true })
              .eq('classroom_id', classroom.id)
              .eq('status', 'joined')

            return { ...classroom, student_count: count || 0 }
          })
        )
        setClassrooms(classroomsWithCount)
      }
    } catch (error) {
      console.error('Sınıflar yüklenirken hata:', error)
    } finally {
      setLoading(false)
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  async function deleteClassroom(id: string) {
    if (!confirm('Bu sınıfı silmek istediğinizden emin misiniz?')) return

    await supabase.from('classrooms').delete().eq('id', id)
    setClassrooms(classrooms.filter(c => c.id !== id))
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sınıflarım</h1>
          <p className="text-gray-600 mt-1">Sınıflarınızı yönetin ve öğrencilerinizi takip edin</p>
        </div>
        <Link
          href="/koc/siniflarim/yeni"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Yeni Sınıf
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-lg">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-blue-100 text-sm">Toplam Sınıf</p>
              <p className="text-2xl font-bold">{classrooms.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-emerald-100 text-sm">Toplam Öğrenci</p>
              <p className="text-2xl font-bold">
                {classrooms.reduce((acc, c) => acc + (c.student_count || 0), 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-lg">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-purple-100 text-sm">Aktif Sınıf</p>
              <p className="text-2xl font-bold">
                {classrooms.filter(c => c.is_active).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Classroom List */}
      {classrooms.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz sınıfınız yok</h3>
          <p className="text-gray-600 mb-4">İlk sınıfınızı oluşturarak öğrencilerinizi yönetmeye başlayın</p>
          <Link
            href="/koc/siniflarim/yeni"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Sınıf Oluştur
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classrooms.map((classroom, index) => (
            <motion.div
              key={classroom.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all group"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{classroom.name}</h3>
                    {classroom.subject && (
                      <p className="text-sm text-gray-500">{classroom.subject}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => deleteClassroom(classroom.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {classroom.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{classroom.description}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{classroom.student_count || 0} öğrenci</span>
                  </div>
                  {classroom.grade_level && (
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                      {classroom.grade_level}
                    </span>
                  )}
                </div>

                {/* Join Code */}
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Sınıf Kodu:</span>
                  <code className="font-mono font-bold text-blue-600 tracking-wider">
                    {classroom.join_code}
                  </code>
                  <button
                    onClick={() => copyCode(classroom.join_code)}
                    className="ml-auto p-1.5 hover:bg-gray-200 rounded transition-colors"
                  >
                    {copiedCode === classroom.join_code ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <Link
                href={`/koc/siniflarim/${classroom.id}`}
                className="flex items-center justify-between px-5 py-3 bg-gray-50 border-t border-gray-100 hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">Sınıfı Yönet</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}


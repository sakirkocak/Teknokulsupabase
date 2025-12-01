'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useTeacherProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { motion } from 'framer-motion'
import { 
  Users, 
  Search,
  ArrowRight,
  Plus,
  Calendar,
  ClipboardList
} from 'lucide-react'

export default function CoachStudentsPage() {
  const { profile, loading: profileLoading } = useProfile()
  const { teacherProfile, loading: teacherLoading } = useTeacherProfile(profile?.id || '')
  const [students, setStudents] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (teacherProfile?.id) {
      loadStudents()
    }
  }, [teacherProfile?.id])

  async function loadStudents() {
    const { data } = await supabase
      .from('coaching_relationships')
      .select(`
        *,
        student:student_profiles!coaching_relationships_student_id_fkey(
          id,
          user_id,
          grade_level,
          school_name,
          target_exam,
          profiles:profiles!student_profiles_user_id_fkey(full_name, avatar_url, email)
        )
      `)
      .eq('coach_id', teacherProfile?.id)
      .eq('status', 'active')
      .order('started_at', { ascending: false })

    if (data) {
      setStudents(data.map(r => ({
        ...r.student,
        relationship_id: r.id,
        started_at: r.started_at,
      })))
    }
  }

  const filteredStudents = students.filter(s => 
    !search || s.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  const loading = profileLoading || teacherLoading

  if (loading) {
    return (
      <DashboardLayout role="koc">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="koc">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Öğrencilerim</h1>
            <p className="text-surface-500">Koçluk yaptığın öğrencileri yönet</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Öğrenci ara..."
            className="input pl-12"
          />
        </div>

        {/* Students Grid */}
        {filteredStudents.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((student, index) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="card p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white text-lg font-bold overflow-hidden">
                      {student.profiles?.avatar_url ? (
                        <img src={student.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        getInitials(student.profiles?.full_name)
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-surface-900">{student.profiles?.full_name}</h3>
                      <p className="text-sm text-surface-500">{student.grade_level}</p>
                      {student.target_exam && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-primary-50 text-primary-600 text-xs font-medium rounded-full">
                          {student.target_exam}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    {student.school_name && (
                      <div className="text-surface-600">{student.school_name}</div>
                    )}
                    <div className="flex items-center gap-1 text-surface-500">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {student.started_at 
                          ? `${new Date(student.started_at).toLocaleDateString('tr-TR')}'den beri`
                          : 'Yeni öğrenci'
                        }
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link 
                      href={`/koc/ogrenciler/${student.id}`}
                      className="btn btn-primary btn-sm flex-1"
                    >
                      Detaylar
                    </Link>
                    <Link 
                      href={`/koc/gorevler/yeni?ogrenci=${student.id}`}
                      className="btn btn-outline btn-sm flex-1"
                    >
                      <Plus className="w-4 h-4" />
                      Görev
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-surface-300" />
            <h3 className="text-lg font-medium text-surface-900 mb-2">
              {search ? 'Öğrenci bulunamadı' : 'Henüz öğrencin yok'}
            </h3>
            <p className="text-surface-500 mb-4">
              {search 
                ? 'Arama kriterlerinize uygun öğrenci bulunamadı.'
                : 'Öğrenciler koçlar sayfasından sana başvurabilir.'
              }
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}


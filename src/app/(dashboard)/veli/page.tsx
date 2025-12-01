'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useParentProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { motion } from 'framer-motion'
import { 
  Users, 
  TrendingUp, 
  ArrowRight,
  Target,
  CheckCircle,
  Clock,
  Plus,
  FileText,
  ClipboardList
} from 'lucide-react'

export default function ParentDashboard() {
  const { profile, loading: profileLoading } = useProfile()
  const { parentProfile, loading: parentLoading } = useParentProfile(profile?.id || '')
  const [children, setChildren] = useState<any[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [studentEmail, setStudentEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (parentProfile?.id) {
      loadChildren()
    }
  }, [parentProfile?.id])

  async function loadChildren() {
    const { data } = await supabase
      .from('parent_students')
      .select(`
        *,
        student:student_profiles!parent_students_student_id_fkey(
          id,
          user_id,
          grade_level,
          target_exam,
          school_name,
          profile:profiles!student_profiles_user_id_fkey(full_name, avatar_url, email)
        )
      `)
      .eq('parent_id', parentProfile?.id)
      .eq('status', 'approved')

    if (data) {
      // Her çocuk için görev ve koç bilgisini al
      const childrenWithStats = await Promise.all(data.map(async (d) => {
        const { count: taskCount } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', d.student?.id)

        const { count: completedCount } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', d.student?.id)
          .eq('status', 'completed')

        const { data: coaching } = await supabase
          .from('coaching_relationships')
          .select(`
            coach:teacher_profiles!coaching_relationships_coach_id_fkey(
              profile:profiles!teacher_profiles_user_id_fkey(full_name)
            )
          `)
          .eq('student_id', d.student?.id)
          .eq('status', 'active')
          .single()

        return {
          ...d.student,
          taskCount: taskCount || 0,
          completedCount: completedCount || 0,
          coach: coaching?.coach?.profile?.full_name,
        }
      }))

      setChildren(childrenWithStats)
    }
  }

  async function handleAddChild(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)

    // Öğrenciyi e-posta ile bul
    const { data: studentUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', studentEmail)
      .eq('role', 'ogrenci')
      .single()

    if (!studentUser) {
      alert('Bu e-posta ile kayıtlı öğrenci bulunamadı.')
      setAdding(false)
      return
    }

    // student_profiles'dan id al
    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('user_id', studentUser.id)
      .single()

    if (!studentProfile) {
      alert('Öğrenci profili bulunamadı.')
      setAdding(false)
      return
    }

    // İlişki oluştur
    const { error } = await supabase
      .from('parent_students')
      .insert({
        parent_id: parentProfile?.id,
        student_id: studentProfile.id,
        status: 'approved', // Doğrudan onaylı
      })

    if (error) {
      if (error.code === '23505') {
        alert('Bu öğrenci zaten ekli.')
      } else {
        alert('Hata: ' + error.message)
      }
    } else {
      setShowAddModal(false)
      setStudentEmail('')
      loadChildren()
    }

    setAdding(false)
  }

  const loading = profileLoading || parentLoading

  if (loading) {
    return (
      <DashboardLayout role="veli">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="veli">
      <div className="space-y-6">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 bg-gradient-to-r from-secondary-500 to-secondary-600 text-white"
        >
          <h1 className="text-2xl font-bold mb-2">
            Hoş geldin, {profile?.full_name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-secondary-100">
            {children.length > 0 
              ? `${children.length} çocuğunuzun gelişimini takip edin.`
              : 'Çocuğunuzu ekleyerek gelişimini takip etmeye başlayın.'
            }
          </p>
        </motion.div>

        {/* Children List */}
        <div className="card">
          <div className="p-6 border-b border-surface-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-surface-900">Çocuklarım</h2>
              <p className="text-sm text-surface-500">Kayıtlı öğrenciler</p>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary btn-sm"
            >
              <Plus className="w-4 h-4" />
              Çocuk Ekle
            </button>
          </div>
          <div className="divide-y divide-surface-100">
            {children.length > 0 ? children.map((child, index) => (
              <motion.div 
                key={child.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-14 bg-gradient-to-br from-accent-400 to-accent-600 rounded-xl flex items-center justify-center text-white text-lg font-medium overflow-hidden">
                      {child.profile?.avatar_url ? (
                        <img src={child.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        getInitials(child.profile?.full_name)
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-surface-900">{child.profile?.full_name}</div>
                      <div className="text-sm text-surface-500">
                        {child.grade_level} 
                        {child.school_name && ` • ${child.school_name}`}
                      </div>
                      {child.coach && (
                        <div className="flex items-center gap-1 text-sm text-primary-500 mt-1">
                          <Target className="w-4 h-4" />
                          Koç: {child.coach}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-surface-900 font-bold">
                        <ClipboardList className="w-4 h-4 text-accent-500" />
                        {child.taskCount}
                      </div>
                      <div className="text-xs text-surface-500">Görev</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-secondary-600 font-bold">
                        <CheckCircle className="w-4 h-4" />
                        {child.completedCount}
                      </div>
                      <div className="text-xs text-surface-500">Tamamlanan</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary-500">
                        {child.taskCount > 0 
                          ? Math.round((child.completedCount / child.taskCount) * 100) 
                          : 0}%
                      </div>
                      <div className="text-xs text-surface-500">Başarı</div>
                    </div>
                  </div>

                  <Link 
                    href={`/veli/cocuklar/${child.id}`}
                    className="btn btn-outline btn-sm"
                  >
                    Detaylar
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Progress Bar */}
                {child.taskCount > 0 && (
                  <div className="mt-4">
                    <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-secondary-400 to-secondary-600 rounded-full transition-all"
                        style={{ width: `${(child.completedCount / child.taskCount) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )) : (
              <div className="p-12 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-surface-300" />
                <h3 className="text-lg font-medium text-surface-900 mb-2">Henüz çocuk eklenmemiş</h3>
                <p className="text-surface-500 mb-6">
                  Çocuğunuzun gelişimini takip etmek için hesabını ekleyin.
                </p>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="btn btn-primary btn-md"
                >
                  <Plus className="w-5 h-5" />
                  Çocuk Ekle
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Add Child Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card p-6 w-full max-w-md"
            >
              <h2 className="text-xl font-bold text-surface-900 mb-4">Çocuk Ekle</h2>
              <p className="text-surface-500 text-sm mb-6">
                Çocuğunuzun Teknokul hesabına kayıtlı e-posta adresini girin.
              </p>
              
              <form onSubmit={handleAddChild} className="space-y-4">
                <div>
                  <label className="label">Öğrenci E-posta Adresi</label>
                  <input
                    type="email"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    className="input"
                    placeholder="cocuk@email.com"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn btn-ghost btn-md flex-1"
                  >
                    İptal
                  </button>
                  <button 
                    type="submit"
                    disabled={adding}
                    className="btn btn-primary btn-md flex-1"
                  >
                    {adding ? 'Ekleniyor...' : 'Ekle'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

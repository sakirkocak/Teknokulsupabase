'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useTeacherProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft,
  Loader2,
  Calendar,
  BookOpen,
  User
} from 'lucide-react'
import Link from 'next/link'

export default function NewTaskPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preSelectedStudent = searchParams.get('ogrenci')
  
  const { profile, loading: profileLoading } = useProfile()
  const { teacherProfile, loading: teacherLoading } = useTeacherProfile(profile?.id || '')
  
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    student_id: preSelectedStudent || '',
    title: '',
    description: '',
    type: 'homework',
    due_date: '',
  })
  
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
        student:student_profiles!coaching_relationships_student_id_fkey(
          id,
          profiles:profiles!student_profiles_user_id_fkey(full_name)
        )
      `)
      .eq('coach_id', teacherProfile?.id)
      .eq('status', 'active')

    if (data) {
      setStudents(data.map(d => d.student))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!form.student_id || !form.title) {
      alert('Lütfen öğrenci seçin ve görev başlığı girin.')
      return
    }

    setLoading(true)

    const { error } = await supabase
      .from('tasks')
      .insert({
        coach_id: teacherProfile?.id,
        student_id: form.student_id,
        title: form.title,
        description: form.description || null,
        type: form.type,
        due_date: form.due_date || null,
        status: 'pending',
      })

    if (error) {
      console.error(error)
      alert('Görev oluşturulurken hata oluştu: ' + error.message)
    } else {
      router.push('/koc/gorevler')
    }

    setLoading(false)
  }

  const pageLoading = profileLoading || teacherLoading

  if (pageLoading) {
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
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/koc/gorevler" className="inline-flex items-center gap-2 text-surface-600 hover:text-primary-500 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Görevlere Dön
          </Link>
          <h1 className="text-2xl font-bold text-surface-900">Yeni Görev Oluştur</h1>
          <p className="text-surface-500">Öğrencine yeni bir görev ata</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card p-6 space-y-6">
          {/* Student Select */}
          <div>
            <label className="label">
              <User className="w-4 h-4 inline mr-1" />
              Öğrenci
            </label>
            <select
              value={form.student_id}
              onChange={(e) => setForm({ ...form, student_id: e.target.value })}
              className="input"
              required
            >
              <option value="">Öğrenci seçin</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.profiles?.full_name}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="label">Görev Başlığı</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input"
              placeholder="Örn: Matematik 10 Soru Çöz"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="label">Açıklama (Opsiyonel)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input min-h-[120px]"
              placeholder="Görev detaylarını yazın..."
            />
          </div>

          {/* Type */}
          <div>
            <label className="label">
              <BookOpen className="w-4 h-4 inline mr-1" />
              Görev Türü
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="input"
            >
              <option value="homework">Ödev</option>
              <option value="quiz">Quiz / Test</option>
              <option value="project">Proje</option>
              <option value="daily">Günlük Görev</option>
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="label">
              <Calendar className="w-4 h-4 inline mr-1" />
              Son Tarih (Opsiyonel)
            </label>
            <input
              type="datetime-local"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="input"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Link href="/koc/gorevler" className="btn btn-ghost btn-md flex-1">
              İptal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-md flex-1"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Görev Oluştur'
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}


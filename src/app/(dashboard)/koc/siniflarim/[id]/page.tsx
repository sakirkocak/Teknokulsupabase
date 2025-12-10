'use client'

import { useState, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Users, Copy, Check, Settings, BookOpen,
  Megaphone, FileText, BarChart2, Plus, Upload, X,
  Trash2, Pin, Edit2, Download, Loader2, Send, Trophy,
  Camera, Sparkles, UserPlus
} from 'lucide-react'

interface Classroom {
  id: string
  name: string
  description: string
  subject: string
  grade_level: string
  join_code: string
  is_active: boolean
}

interface Student {
  id: string
  student_id: string | null
  student_name: string
  student_number: string
  status: string
  joined_at: string | null
  profile?: {
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

export default function SinifDetayPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClientComponentClient()

  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [activeTab, setActiveTab] = useState<'students' | 'announcements' | 'materials' | 'tasks'>('students')
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState(false)

  // Modal states
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showAddStudentModal, setShowAddStudentModal] = useState(false)

  // Form states
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', is_pinned: false })
  const [materialForm, setMaterialForm] = useState({ title: '', description: '', file: null as File | null })
  const [taskForm, setTaskForm] = useState({ title: '', description: '', due_date: '', priority: 'medium' })
  const [submitting, setSubmitting] = useState(false)

  // AI Student extraction
  const [extracting, setExtracting] = useState(false)
  const [extractedStudents, setExtractedStudents] = useState<{ number: string; name: string; selected: boolean }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadClassroomData()
  }, [params.id])

  async function loadClassroomData() {
    try {
      const classroomId = params.id as string

      // Sınıf bilgisi
      const { data: classroomData } = await supabase
        .from('classrooms')
        .select('*')
        .eq('id', classroomId)
        .single()

      if (classroomData) setClassroom(classroomData)

      // Öğrenciler
      const { data: studentsData } = await supabase
        .from('classroom_students')
        .select(`
          *,
          profile:student_profiles(avatar_url)
        `)
        .eq('classroom_id', classroomId)
        .order('student_number', { ascending: true })

      if (studentsData) setStudents(studentsData)

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

    } catch (error) {
      console.error('Veri yükleme hatası:', error)
    } finally {
      setLoading(false)
    }
  }

  function copyCode() {
    if (!classroom) return
    navigator.clipboard.writeText(classroom.join_code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  // Duyuru ekleme
  async function handleAddAnnouncement() {
    if (!announcementForm.title || !announcementForm.content) return
    setSubmitting(true)

    try {
      const { data, error } = await supabase
        .from('classroom_announcements')
        .insert({
          classroom_id: params.id,
          title: announcementForm.title,
          content: announcementForm.content,
          is_pinned: announcementForm.is_pinned
        })
        .select()
        .single()

      if (error) throw error

      setAnnouncements([data, ...announcements])
      setShowAnnouncementModal(false)
      setAnnouncementForm({ title: '', content: '', is_pinned: false })

      // Öğrencilere bildirim gönder
      const joinedStudents = students.filter(s => s.student_id && s.status === 'joined')
      if (joinedStudents.length > 0) {
        for (const student of joinedStudents) {
          const { data: studentProfile } = await supabase
            .from('student_profiles')
            .select('user_id')
            .eq('id', student.student_id)
            .single()

          if (studentProfile) {
            await supabase.from('notifications').insert({
              user_id: studentProfile.user_id,
              title: 'Yeni Duyuru',
              message: `${classroom?.name} sınıfında yeni duyuru: ${announcementForm.title}`,
              type: 'announcement'
            })
          }
        }
      }
    } catch (error: any) {
      console.error('Duyuru ekleme hatası:', error)
      alert('Duyuru eklenirken bir hata oluştu')
    } finally {
      setSubmitting(false)
    }
  }

  // Materyal yükleme
  async function handleAddMaterial() {
    if (!materialForm.title || !materialForm.file) return
    setSubmitting(true)

    try {
      // Dosyayı yükle
      const fileName = `${params.id}/${Date.now()}-${materialForm.file.name}`
      const { error: uploadError } = await supabase.storage
        .from('classroom-materials')
        .upload(fileName, materialForm.file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('classroom-materials')
        .getPublicUrl(fileName)

      // Veritabanına kaydet
      const { data, error } = await supabase
        .from('classroom_materials')
        .insert({
          classroom_id: params.id,
          title: materialForm.title,
          description: materialForm.description,
          file_url: publicUrl,
          file_type: materialForm.file.type
        })
        .select()
        .single()

      if (error) throw error

      setMaterials([data, ...materials])
      setShowMaterialModal(false)
      setMaterialForm({ title: '', description: '', file: null })
    } catch (error: any) {
      console.error('Materyal ekleme hatası:', error)
      alert('Materyal eklenirken bir hata oluştu')
    } finally {
      setSubmitting(false)
    }
  }

  // Toplu görev gönderme
  async function handleSendTask() {
    if (!taskForm.title) return
    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!teacherProfile) return

      const joinedStudents = students.filter(s => s.student_id && s.status === 'joined')

      for (const student of joinedStudents) {
        await supabase.from('tasks').insert({
          coach_id: teacherProfile.id,
          student_id: student.student_id,
          classroom_id: params.id,
          title: taskForm.title,
          description: taskForm.description,
          due_date: taskForm.due_date || null,
          priority: taskForm.priority,
          status: 'pending'
        })

        // Bildirim gönder
        const { data: studentProfile } = await supabase
          .from('student_profiles')
          .select('user_id')
          .eq('id', student.student_id)
          .single()

        if (studentProfile) {
          await supabase.from('notifications').insert({
            user_id: studentProfile.user_id,
            title: 'Yeni Görev',
            message: `${classroom?.name} sınıfından yeni görev: ${taskForm.title}`,
            type: 'task'
          })
        }
      }

      setShowTaskModal(false)
      setTaskForm({ title: '', description: '', due_date: '', priority: 'medium' })
      alert(`${joinedStudents.length} öğrenciye görev gönderildi!`)
    } catch (error: any) {
      console.error('Görev gönderme hatası:', error)
      alert('Görev gönderilirken bir hata oluştu')
    } finally {
      setSubmitting(false)
    }
  }

  // AI ile öğrenci çıkarma
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setExtracting(true)

    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = reader.result as string
        
        const response = await fetch('/api/ai/extract-students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, mimeType: file.type })
        })

        const data = await response.json()

        if (data.students && data.students.length > 0) {
          setExtractedStudents(data.students.map((s: any) => ({ ...s, selected: true })))
        } else {
          alert('Görselden öğrenci bulunamadı')
        }
        setExtracting(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Görsel işleme hatası:', error)
      setExtracting(false)
    }
  }

  async function handleAddExtractedStudents() {
    const selected = extractedStudents.filter(s => s.selected && s.name)
    if (selected.length === 0) return

    setSubmitting(true)

    try {
      const { error } = await supabase
        .from('classroom_students')
        .insert(selected.map(s => ({
          classroom_id: params.id,
          student_name: s.name,
          student_number: s.number,
          status: 'pending'
        })))

      if (error) throw error

      await loadClassroomData()
      setShowAddStudentModal(false)
      setExtractedStudents([])
    } catch (error) {
      console.error('Öğrenci ekleme hatası:', error)
      alert('Öğrenciler eklenirken bir hata oluştu')
    } finally {
      setSubmitting(false)
    }
  }

  // Silme işlemleri
  async function deleteAnnouncement(id: string) {
    if (!confirm('Bu duyuruyu silmek istediğinizden emin misiniz?')) return
    await supabase.from('classroom_announcements').delete().eq('id', id)
    setAnnouncements(announcements.filter(a => a.id !== id))
  }

  async function deleteMaterial(id: string) {
    if (!confirm('Bu materyali silmek istediğinizden emin misiniz?')) return
    await supabase.from('classroom_materials').delete().eq('id', id)
    setMaterials(materials.filter(m => m.id !== id))
  }

  async function removeStudent(id: string) {
    if (!confirm('Bu öğrenciyi sınıftan çıkarmak istediğinizden emin misiniz?')) return
    await supabase.from('classroom_students').delete().eq('id', id)
    setStudents(students.filter(s => s.id !== id))
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
        <Link href="/koc/siniflarim" className="text-blue-600 hover:underline mt-2 inline-block">
          Geri dön
        </Link>
      </div>
    )
  }

  const joinedCount = students.filter(s => s.status === 'joined').length
  const pendingCount = students.filter(s => s.status === 'pending').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/koc/siniflarim"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{classroom.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              {classroom.subject && (
                <span className="text-sm text-gray-600">{classroom.subject}</span>
              )}
              {classroom.grade_level && (
                <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">
                  {classroom.grade_level}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href={`/koc/siniflarim/${classroom.id}/istatistikler`}
            className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <BarChart2 className="w-4 h-4" />
            İstatistikler
          </Link>
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
            <span className="text-sm text-blue-600">Kod:</span>
            <code className="font-mono font-bold text-blue-700 tracking-wider">{classroom.join_code}</code>
            <button onClick={copyCode} className="p-1 hover:bg-blue-100 rounded">
              {copiedCode ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-blue-500" />}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{joinedCount}</p>
              <p className="text-sm text-gray-500">Katılan</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <UserPlus className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              <p className="text-sm text-gray-500">Bekleyen</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Megaphone className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{announcements.length}</p>
              <p className="text-sm text-gray-500">Duyuru</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <FileText className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{materials.length}</p>
              <p className="text-sm text-gray-500">Materyal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'students', label: 'Öğrenciler', icon: Users },
            { id: 'announcements', label: 'Duyurular', icon: Megaphone },
            { id: 'materials', label: 'Materyaller', icon: FileText },
            { id: 'tasks', label: 'Toplu Görev', icon: Send },
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
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Öğrenciler Tab */}
          {activeTab === 'students' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Öğrenci Listesi</h3>
                <button
                  onClick={() => setShowAddStudentModal(true)}
                  className="flex items-center gap-2 text-sm bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700"
                >
                  <UserPlus className="w-4 h-4" />
                  Öğrenci Ekle
                </button>
              </div>

              {students.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Henüz öğrenci yok</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Sınıf kodunu ({classroom.join_code}) öğrencilerle paylaşın
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {student.profile?.avatar_url ? (
                            <img src={student.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-gray-500 text-sm font-medium">
                              {student.student_name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{student.student_name}</p>
                          <p className="text-sm text-gray-500">
                            {student.student_number && `No: ${student.student_number} • `}
                            {student.status === 'joined' ? 'Katıldı' : 'Bekliyor'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`
                          px-2 py-1 rounded-full text-xs font-medium
                          ${student.status === 'joined' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-amber-100 text-amber-700'
                          }
                        `}>
                          {student.status === 'joined' ? 'Aktif' : 'Beklemede'}
                        </span>
                        <button
                          onClick={() => removeStudent(student.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Duyurular Tab */}
          {activeTab === 'announcements' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Duyurular</h3>
                <button
                  onClick={() => setShowAnnouncementModal(true)}
                  className="flex items-center gap-2 text-sm bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Duyuru Ekle
                </button>
              </div>

              {announcements.length === 0 ? (
                <div className="text-center py-8">
                  <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Henüz duyuru yok</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {announcement.is_pinned && (
                            <Pin className="w-4 h-4 text-blue-500" />
                          )}
                          <h4 className="font-medium text-gray-900">{announcement.title}</h4>
                        </div>
                        <button
                          onClick={() => deleteAnnouncement(announcement.id)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-gray-600 mt-2">{announcement.content}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(announcement.created_at).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Materyaller Tab */}
          {activeTab === 'materials' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Materyaller</h3>
                <button
                  onClick={() => setShowMaterialModal(true)}
                  className="flex items-center gap-2 text-sm bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700"
                >
                  <Upload className="w-4 h-4" />
                  Materyal Yükle
                </button>
              </div>

              {materials.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Henüz materyal yok</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {materials.map((material) => (
                    <div key={material.id} className="p-4 bg-gray-50 rounded-lg flex items-start justify-between">
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
                      <div className="flex items-center gap-1">
                        <a
                          href={material.file_url}
                          target="_blank"
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => deleteMaterial(material.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Toplu Görev Tab */}
          {activeTab === 'tasks' && (
            <div>
              <div className="max-w-lg">
                <h3 className="font-semibold text-gray-900 mb-4">Sınıfa Toplu Görev Gönder</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Bu görev sınıftaki tüm aktif öğrencilere ({joinedCount} kişi) gönderilecektir.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Görev Başlığı *
                    </label>
                    <input
                      type="text"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Örn: Haftalık alıştırmalar"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Açıklama
                    </label>
                    <textarea
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Görev detayları..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Son Tarih
                      </label>
                      <input
                        type="date"
                        value={taskForm.due_date}
                        onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Öncelik
                      </label>
                      <select
                        value={taskForm.priority}
                        onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="low">Düşük</option>
                        <option value="medium">Orta</option>
                        <option value="high">Yüksek</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleSendTask}
                    disabled={!taskForm.title || joinedCount === 0 || submitting}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        {joinedCount} Öğrenciye Gönder
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Duyuru Modal */}
      <AnimatePresence>
        {showAnnouncementModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAnnouncementModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Yeni Duyuru</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  placeholder="Başlık"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <textarea
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                  placeholder="İçerik"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={announcementForm.is_pinned}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, is_pinned: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Sabitle</span>
                </label>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowAnnouncementModal(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleAddAnnouncement}
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ekle'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Materyal Modal */}
      <AnimatePresence>
        {showMaterialModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowMaterialModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Materyal Yükle</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  value={materialForm.title}
                  onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                  placeholder="Başlık"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <textarea
                  value={materialForm.description}
                  onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                  placeholder="Açıklama (opsiyonel)"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="file"
                  onChange={(e) => setMaterialForm({ ...materialForm, file: e.target.files?.[0] || null })}
                  className="w-full"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowMaterialModal(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleAddMaterial}
                    disabled={submitting || !materialForm.file}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Yükle'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Öğrenci Ekleme Modal */}
      <AnimatePresence>
        {showAddStudentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddStudentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                AI ile Öğrenci Ekle
              </h3>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {extractedStudents.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50"
                >
                  {extracting ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
                      <p className="text-gray-600">AI analiz ediyor...</p>
                    </div>
                  ) : (
                    <>
                      <Camera className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">Öğrenci listesi fotoğrafı yükleyin</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                  {extractedStudents.map((student, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        checked={student.selected}
                        onChange={() => {
                          const updated = [...extractedStudents]
                          updated[i].selected = !updated[i].selected
                          setExtractedStudents(updated)
                        }}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-500 w-6">{student.number}</span>
                      <span className="flex-1">{student.name}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => {
                    setShowAddStudentModal(false)
                    setExtractedStudents([])
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  İptal
                </button>
                {extractedStudents.length > 0 && (
                  <button
                    onClick={handleAddExtractedStudents}
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      `${extractedStudents.filter(s => s.selected).length} Öğrenci Ekle`
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


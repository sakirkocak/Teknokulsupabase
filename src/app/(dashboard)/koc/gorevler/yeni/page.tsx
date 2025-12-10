'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useTeacherProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { compressImage, formatFileSize } from '@/lib/imageCompressor'
import { 
  ArrowLeft,
  Loader2,
  Calendar,
  BookOpen,
  User,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  File,
  Upload,
  Zap
} from 'lucide-react'
import Link from 'next/link'

interface Attachment {
  name: string
  url: string
  type: string
  size: number
}

function NewTaskContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preSelectedStudent = searchParams.get('ogrenci')
  
  const { profile, loading: profileLoading } = useProfile()
  const { teacherProfile, loading: teacherLoading } = useTeacherProfile(profile?.id || '')
  
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [compressionSaved, setCompressionSaved] = useState(0)
  const [form, setForm] = useState({
    student_id: preSelectedStudent || '',
    title: '',
    description: '',
    type: 'homework',
    due_date: '',
  })
  
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  // Dosya yükleme
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    let totalSaved = compressionSaved

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Dosya boyutu kontrolü (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        alert(`"${file.name}" dosyası 20MB'dan büyük, atlandı.`)
        continue
      }

      try {
        let uploadBlob: Blob = file
        let finalSize = file.size
        const isImage = file.type.startsWith('image/')

        // Görsel ise sıkıştır
        if (isImage) {
          const { blob, originalSize, compressedSize } = await compressImage(file, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.8,
            maxSizeMB: 2
          })
          uploadBlob = blob
          finalSize = compressedSize
          totalSaved += (originalSize - compressedSize)
        }

        const fileExt = isImage ? 'jpg' : file.name.split('.').pop()
        const fileName = `${teacherProfile?.id}/${Date.now()}-${i}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('task-attachments')
          .upload(fileName, uploadBlob, {
            contentType: isImage ? 'image/jpeg' : file.type
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          continue
        }

        const { data: urlData } = supabase.storage
          .from('task-attachments')
          .getPublicUrl(fileName)

        setAttachments(prev => [...prev, {
          name: file.name,
          url: urlData.publicUrl,
          type: file.type,
          size: finalSize
        }])
      } catch (error) {
        console.error('Upload error:', error)
      }
    }

    setCompressionSaved(totalSaved)
    setUploading(false)
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Dosya sil
  function removeAttachment(index: number) {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  // Dosya ikonu
  function getFileIcon(type: string) {
    if (type.startsWith('image/')) return ImageIcon
    if (type === 'application/pdf') return FileText
    return File
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!form.student_id || !form.title) {
      alert('Lütfen öğrenci seçin ve görev başlığı girin.')
      return
    }

    setLoading(true)

    // Görevi oluştur
    const { data: taskData, error } = await supabase
      .from('tasks')
      .insert({
        coach_id: teacherProfile?.id,
        student_id: form.student_id,
        title: form.title,
        description: form.description || null,
        type: form.type,
        due_date: form.due_date || null,
        status: 'pending',
        attachments: attachments.length > 0 ? attachments : null,
      })
      .select()
      .single()

    if (error) {
      console.error(error)
      alert('Görev oluşturulurken hata oluştu: ' + error.message)
      setLoading(false)
      return
    }

    // Öğrencinin user_id'sini bul ve bildirim gönder
    const selectedStudent = students.find(s => s.id === form.student_id)
    if (selectedStudent) {
      const { data: studentData } = await supabase
        .from('student_profiles')
        .select('user_id')
        .eq('id', form.student_id)
        .single()

      if (studentData?.user_id) {
        const attachmentText = attachments.length > 0 
          ? ` (${attachments.length} dosya ekli)` 
          : ''
        await supabase.from('notifications').insert({
          user_id: studentData.user_id,
          title: 'Yeni Görev',
          body: `Koçunuz size "${form.title}" başlıklı bir görev gönderdi.${attachmentText}`,
          type: 'info',
          data: { link: `/ogrenci/gorevler/${taskData.id}` }
        })
      }
    }

    router.push('/koc/gorevler')
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

          {/* Attachments */}
          <div>
            <label className="label">
              <Paperclip className="w-4 h-4 inline mr-1" />
              Dosya Ekle (Opsiyonel)
            </label>
            
            {/* Upload Area */}
            <div 
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed border-surface-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-colors ${
                uploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {uploading ? (
                <Loader2 className="w-8 h-8 mx-auto mb-2 text-primary-500 animate-spin" />
              ) : (
                <Upload className="w-8 h-8 mx-auto mb-2 text-surface-400" />
              )}
              <p className="text-surface-600 font-medium">
                {uploading ? 'Yükleniyor...' : 'Dosya yükle'}
              </p>
              <p className="text-sm text-surface-500 mt-1">
                PDF, Görsel, Word vb. (max 20MB)
              </p>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Compression Stats */}
            {compressionSaved > 0 && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-green-500" />
                <span className="text-green-700">
                  Görsel sıkıştırma ile <strong>{formatFileSize(compressionSaved)}</strong> tasarruf edildi
                </span>
              </div>
            )}

            {/* Attached Files List */}
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((file, index) => {
                  const FileIcon = getFileIcon(file.type)
                  return (
                    <div 
                      key={index}
                      className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg group"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        file.type.startsWith('image/') ? 'bg-blue-100 text-blue-600' :
                        file.type === 'application/pdf' ? 'bg-red-100 text-red-600' :
                        'bg-surface-200 text-surface-600'
                      }`}>
                        <FileIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-900 truncate">{file.name}</p>
                        <p className="text-xs text-surface-500">{formatFileSize(file.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="p-1.5 text-surface-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
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
              disabled={loading || uploading}
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

export default function NewTaskPage() {
  return (
    <Suspense fallback={
      <DashboardLayout role="koc">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    }>
      <NewTaskContent />
    </Suspense>
  )
}

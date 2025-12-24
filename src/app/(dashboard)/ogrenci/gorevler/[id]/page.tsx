'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useStudentProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  ClipboardList,
  Calendar,
  Upload,
  Image as ImageIcon,
  Send,
  Loader2,
  X,
  Check,
  MessageSquare,
  Plus,
  Zap,
  Paperclip,
  FileText,
  File,
  Download,
  ExternalLink
} from 'lucide-react'
import { compressImage, formatFileSize, calculateCompressionRatio } from '@/lib/imageCompressor'

interface Attachment {
  name: string
  url: string
  type: string
  size: number
}

interface Task {
  id: string
  title: string
  description: string | null
  type: string
  status: string
  due_date: string | null
  screenshot_url: string | null
  screenshots: string[] | null
  attachments: Attachment[] | null
  student_response: string | null
  coach_feedback: string | null
  score: number | null
  accepted_at: string | null
  submitted_at: string | null
  completed_at: string | null
  created_at: string
  coach_id: string
}

export default function StudentTaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const taskId = params.id as string
  
  const { profile, loading: profileLoading } = useProfile()
  const { studentProfile, loading: studentLoading } = useStudentProfile(profile?.id || '')
  
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [studentNote, setStudentNote] = useState('')
  const [screenshots, setScreenshots] = useState<string[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [compressionStats, setCompressionStats] = useState<{ saved: number; count: number } | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (studentProfile?.id) {
      loadTask()
    }
  }, [studentProfile?.id, taskId])

  async function loadTask() {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('student_id', studentProfile?.id)
      .single()

    if (data) {
      setTask(data)
      setStudentNote(data.student_response || '')
      // Hem eski screenshot_url hem yeni screenshots array'ini kontrol et
      const existingScreenshots = data.screenshots || []
      if (data.screenshot_url && !existingScreenshots.includes(data.screenshot_url)) {
        existingScreenshots.push(data.screenshot_url)
      }
      setScreenshots(existingScreenshots)
    }
    setLoading(false)
  }

  // Görevi kabul et
  async function acceptTask() {
    if (!task) return
    setActionLoading(true)

    const { error } = await supabase
      .from('tasks')
      .update({ 
        status: 'in_progress',
        accepted_at: new Date().toISOString()
      })
      .eq('id', task.id)

    if (!error) {
      // Koça bildirim gönder
      const { data: coachData } = await supabase
        .from('teacher_profiles')
        .select('user_id')
        .eq('id', task.coach_id)
        .single()

      if (coachData?.user_id) {
        await supabase.from('notifications').insert({
          user_id: coachData.user_id,
          title: 'Görev Kabul Edildi',
          body: `${profile?.full_name} "${task.title}" görevini kabul etti.`,
          type: 'success',
          data: { link: `/koc/gorevler/${task.id}` }
        })
      }

      await loadTask()
    }
    setActionLoading(false)
  }

  // Çoklu ekran görüntüsü yükle (sıkıştırma ile)
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0 || !task) return

    setUploading(true)

    const newScreenshots: string[] = [...screenshots]
    let totalOriginal = 0
    let totalCompressed = 0
    let uploadedCount = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Dosya boyutu kontrolü (max 10MB orijinal - sıkıştırılacak)
      if (file.size > 10 * 1024 * 1024) {
        alert(`"${file.name}" dosyası 10MB'dan büyük, atlandı.`)
        continue
      }

      try {
        // Görseli sıkıştır
        const { blob, originalSize, compressedSize } = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.7,
          maxSizeMB: 1
        })

        totalOriginal += originalSize
        totalCompressed += compressedSize

        const fileName = `${task.id}-${Date.now()}-${i}.jpg`
        const filePath = `${studentProfile?.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('task-screenshots')
          .upload(filePath, blob, {
            contentType: 'image/jpeg'
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          continue
        }

        const { data: urlData } = supabase.storage
          .from('task-screenshots')
          .getPublicUrl(filePath)

        newScreenshots.push(urlData.publicUrl)
        uploadedCount++
      } catch (error) {
        console.error('Compression error:', error)
        continue
      }
    }

    // Task'ı güncelle
    await supabase
      .from('tasks')
      .update({ screenshots: newScreenshots })
      .eq('id', task.id)

    setScreenshots(newScreenshots)
    
    // Sıkıştırma istatistiklerini güncelle
    if (uploadedCount > 0) {
      const savedBytes = totalOriginal - totalCompressed
      setCompressionStats({
        saved: savedBytes,
        count: uploadedCount
      })
      
      // 5 saniye sonra istatistikleri gizle
      setTimeout(() => setCompressionStats(null), 5000)
    }
    
    setUploading(false)
    
    // Input'u resetle
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Tek görsel sil
  async function removeScreenshot(urlToRemove: string) {
    if (!task) return
    
    const newScreenshots = screenshots.filter(url => url !== urlToRemove)
    
    await supabase
      .from('tasks')
      .update({ screenshots: newScreenshots })
      .eq('id', task.id)

    setScreenshots(newScreenshots)
  }

  // Görevi teslim et
  async function submitTask() {
    if (!task) return
    // Resim artık opsiyonel - kontrol kaldırıldı

    setActionLoading(true)

    const { error } = await supabase
      .from('tasks')
      .update({ 
        status: 'submitted',
        student_response: studentNote || null,
        submitted_at: new Date().toISOString()
      })
      .eq('id', task.id)

    if (!error) {
      // Koça bildirim gönder
      const { data: coachData } = await supabase
        .from('teacher_profiles')
        .select('user_id')
        .eq('id', task.coach_id)
        .single()

      if (coachData?.user_id) {
        await supabase.from('notifications').insert({
          user_id: coachData.user_id,
          title: 'Görev Teslim Edildi',
          body: `${profile?.full_name} "${task.title}" görevini teslim etti. İncelemenizi bekliyor.`,
          type: 'info',
          data: { link: `/koc/gorevler/${task.id}` }
        })
      }

      await loadTask()
    }
    setActionLoading(false)
  }

  const pageLoading = profileLoading || studentLoading || loading

  if (pageLoading) {
    return (
      <DashboardLayout role="ogrenci">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    )
  }

  if (!task) {
    return (
      <DashboardLayout role="ogrenci">
        <div className="text-center py-12">
          <ClipboardList className="w-16 h-16 mx-auto mb-4 text-surface-300" />
          <h2 className="text-xl font-semibold text-surface-900 mb-2">Görev Bulunamadı</h2>
          <p className="text-surface-500 mb-4">Bu görev mevcut değil veya size ait değil.</p>
          <Link href="/ogrenci/gorevler" className="btn btn-primary btn-md">
            Görevlere Dön
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
    pending: { label: 'Onay Bekliyor', color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: Clock },
    in_progress: { label: 'Devam Ediyor', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: AlertCircle },
    submitted: { label: 'Teslim Edildi', color: 'text-purple-600', bgColor: 'bg-purple-50', icon: ClipboardList },
    completed: { label: 'Tamamlandı', color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle },
  }

  const config = statusConfig[task.status] || statusConfig.pending
  const StatusIcon = config.icon

  return (
    <DashboardLayout role="ogrenci">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link href="/ogrenci/gorevler" className="inline-flex items-center gap-2 text-surface-600 hover:text-primary-500 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Görevlere Dön
          </Link>
        </div>

        {/* Task Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card overflow-hidden"
        >
          {/* Status Banner */}
          <div className={`px-6 py-3 ${config.bgColor} border-b border-surface-100`}>
            <div className="flex items-center gap-2">
              <StatusIcon className={`w-5 h-5 ${config.color}`} />
              <span className={`font-medium ${config.color}`}>{config.label}</span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Title & Type */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-bold text-surface-900">{task.title}</h1>
                <span className="px-3 py-1 bg-surface-100 text-surface-600 text-sm rounded-full capitalize">
                  {task.type}
                </span>
              </div>
              {task.due_date && (
                <div className="flex items-center gap-2 mt-2 text-surface-500">
                  <Calendar className="w-4 h-4" />
                  <span>Son Tarih: {new Date(task.due_date).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {task.description && (
              <div>
                <h3 className="font-medium text-surface-900 mb-2">Açıklama</h3>
                <p className="text-surface-600 whitespace-pre-wrap">{task.description}</p>
              </div>
            )}

            {/* Attachments from Coach */}
            {task.attachments && task.attachments.length > 0 && (
              <div>
                <h3 className="font-medium text-surface-900 mb-3 flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  Koçunuzun Gönderdiği Dosyalar ({task.attachments.length})
                </h3>
                <div className="space-y-2">
                  {task.attachments.map((file, index) => {
                    const isImage = file.type.startsWith('image/')
                    const isPdf = file.type === 'application/pdf'
                    const FileIcon = isImage ? ImageIcon : isPdf ? FileText : File
                    
                    return (
                      <div 
                        key={index}
                        className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg border border-surface-100 hover:border-primary-200 transition-colors group"
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isImage ? 'bg-blue-100 text-blue-600' :
                          isPdf ? 'bg-red-100 text-red-600' :
                          'bg-surface-200 text-surface-600'
                        }`}>
                          <FileIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-surface-900 truncate">{file.name}</p>
                          <p className="text-xs text-surface-500">{formatFileSize(file.size)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {isImage && (
                            <button
                              onClick={() => setSelectedImage(file.url)}
                              className="p-2 text-surface-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                              title="Önizle"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          )}
                          <a
                            href={file.url}
                            download={file.name}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-surface-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                            title="İndir"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Accept Task Button (pending durumunda) */}
            {task.status === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                <Clock className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
                <h3 className="font-semibold text-surface-900 mb-2">Görevi kabul etmeniz bekleniyor</h3>
                <p className="text-surface-600 mb-4">Bu görevi kabul ettiğinizde koçunuza bildirim gönderilecek.</p>
                <button
                  onClick={acceptTask}
                  disabled={actionLoading}
                  className="btn btn-primary btn-md"
                >
                  {actionLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Görevi Kabul Et
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Screenshots Upload (in_progress durumunda) */}
            {(task.status === 'in_progress' || task.status === 'submitted' || task.status === 'completed') && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-surface-900">
                    Ekran Görüntüleri {screenshots.length > 0 ? `(${screenshots.length})` : '(Opsiyonel)'}
                  </h3>
                  {task.status === 'in_progress' && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="btn btn-ghost btn-sm"
                    >
                      {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Görsel Ekle
                        </>
                      )}
                    </button>
                  )}
                </div>
                
                {screenshots.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {screenshots.map((url, index) => (
                      <div 
                        key={index} 
                        className="relative group aspect-video rounded-xl overflow-hidden border border-surface-200"
                      >
                        <img 
                          src={url} 
                          alt={`Ekran görüntüsü ${index + 1}`} 
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setSelectedImage(url)}
                        />
                        {task.status === 'in_progress' && (
                          <button
                            type="button"
                            onClick={() => removeScreenshot(url)}
                            className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors z-10"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {/* Add More Button (in_progress durumunda) */}
                    {task.status === 'in_progress' && (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-video rounded-xl border-2 border-dashed border-surface-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-colors"
                      >
                        {uploading ? (
                          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-8 h-8 text-surface-400 mb-1" />
                            <span className="text-sm text-surface-500">Ekle</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div 
                    onClick={() => task.status === 'in_progress' && fileInputRef.current?.click()}
                    className={`border-2 border-dashed border-surface-300 rounded-xl p-8 text-center ${
                      task.status === 'in_progress' ? 'cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-colors' : ''
                    }`}
                  >
                    {uploading ? (
                      <Loader2 className="w-12 h-12 mx-auto mb-3 text-primary-500 animate-spin" />
                    ) : (
                      <Upload className="w-12 h-12 mx-auto mb-3 text-surface-400" />
                    )}
                    <p className="text-surface-600 font-medium mb-1">
                      {uploading ? 'Yükleniyor...' : 'Ekran görüntüsü yükle (Opsiyonel)'}
                    </p>
                    <p className="text-sm text-surface-500">PNG, JPG (max 5MB) - Birden fazla seçebilirsiniz</p>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Sıkıştırma istatistikleri */}
                {compressionStats && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-sm"
                  >
                    <Zap className="w-4 h-4 text-green-500" />
                    <span className="text-green-700">
                      {compressionStats.count} görsel sıkıştırıldı, <strong>{formatFileSize(compressionStats.saved)}</strong> tasarruf edildi!
                    </span>
                  </motion.div>
                )}
              </div>
            )}

            {/* Student Note (in_progress durumunda) */}
            {task.status === 'in_progress' && (
              <div>
                <label className="font-medium text-surface-900 mb-2 block">
                  Not Ekle (Opsiyonel)
                </label>
                <textarea
                  value={studentNote}
                  onChange={(e) => setStudentNote(e.target.value)}
                  placeholder="Görevle ilgili eklemek istediğiniz bir not varsa yazın..."
                  className="input min-h-[100px]"
                />
              </div>
            )}

            {/* Student Response (submitted/completed durumunda) */}
            {(task.status === 'submitted' || task.status === 'completed') && task.student_response && (
              <div>
                <h3 className="font-medium text-surface-900 mb-2">Notunuz</h3>
                <p className="text-surface-600 bg-surface-50 p-4 rounded-xl">{task.student_response}</p>
              </div>
            )}

            {/* Submit Button (in_progress durumunda) */}
            {task.status === 'in_progress' && (
              <button
                onClick={submitTask}
                disabled={actionLoading}
                className="btn btn-primary btn-lg w-full"
              >
                {actionLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Görevi Teslim Et
                  </>
                )}
              </button>
            )}

            {/* Coach Feedback (completed durumunda) */}
            {task.status === 'completed' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-700 mb-1">Görev Tamamlandı!</h3>
                    {task.score !== null && (
                      <p className="text-green-600 font-medium mb-2">Puan: {task.score}/100</p>
                    )}
                    {task.coach_feedback && (
                      <div className="mt-3">
                        <p className="text-sm text-green-700 font-medium mb-1">Koçunuzun Geri Bildirimi:</p>
                        <p className="text-green-800 bg-white/50 p-3 rounded-lg">{task.coach_feedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Submitted State */}
            {task.status === 'submitted' && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 text-purple-500" />
                <h3 className="font-semibold text-purple-700 mb-1">Görev Teslim Edildi</h3>
                <p className="text-purple-600">Koçunuzun incelemesini bekliyorsunuz.</p>
              </div>
            )}

            {/* Timeline */}
            <div className="border-t border-surface-100 pt-6">
              <h3 className="font-medium text-surface-900 mb-4">Zaman Çizelgesi</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-surface-400" />
                  <span className="text-surface-600">
                    Oluşturuldu: {new Date(task.created_at).toLocaleDateString('tr-TR', {
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
                {task.accepted_at && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-surface-600">
                      Kabul Edildi: {new Date(task.accepted_at).toLocaleDateString('tr-TR', {
                        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
                {task.submitted_at && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-surface-600">
                      Teslim Edildi: {new Date(task.submitted_at).toLocaleDateString('tr-TR', {
                        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
                {task.completed_at && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-surface-600">
                      Tamamlandı: {new Date(task.completed_at).toLocaleDateString('tr-TR', {
                        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Image Modal */}
        {selectedImage && (
          <div 
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={selectedImage} 
              alt="Büyük görüntü" 
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

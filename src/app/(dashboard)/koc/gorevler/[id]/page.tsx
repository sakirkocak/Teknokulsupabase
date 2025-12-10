'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useTeacherProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  ClipboardList,
  Calendar,
  User,
  Star,
  MessageSquare,
  Loader2,
  Check,
  Image as ImageIcon,
  ExternalLink,
  Paperclip,
  FileText,
  File,
  Download
} from 'lucide-react'
import { formatFileSize } from '@/lib/imageCompressor'

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
  student_id: string
  student?: {
    id: string
    user_id: string
    profiles: {
      full_name: string
      avatar_url: string | null
    }
  }
}

export default function CoachTaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const taskId = params.id as string
  
  const { profile, loading: profileLoading } = useProfile()
  const { teacherProfile, loading: teacherLoading } = useTeacherProfile(profile?.id || '')
  
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [score, setScore] = useState<number>(80)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    if (teacherProfile?.id) {
      loadTask()
    }
  }, [teacherProfile?.id, taskId])

  async function loadTask() {
    const { data } = await supabase
      .from('tasks')
      .select(`
        *,
        student:student_profiles!tasks_student_id_fkey(
          id,
          user_id,
          profiles:profiles!student_profiles_user_id_fkey(full_name, avatar_url)
        )
      `)
      .eq('id', taskId)
      .eq('coach_id', teacherProfile?.id)
      .single()

    if (data) {
      setTask(data)
      setFeedback(data.coach_feedback || '')
      setScore(data.score || 80)
    }
    setLoading(false)
  }

  // Görevi onayla ve tamamla
  async function completeTask() {
    if (!task) return
    
    if (!feedback.trim()) {
      alert('Lütfen geri bildirim yazın.')
      return
    }

    setActionLoading(true)

    const { error } = await supabase
      .from('tasks')
      .update({ 
        status: 'completed',
        coach_feedback: feedback,
        score: score,
        completed_at: new Date().toISOString()
      })
      .eq('id', task.id)

    if (!error) {
      // Öğrenciye bildirim gönder
      if (task.student?.user_id) {
        await supabase.from('notifications').insert({
          user_id: task.student.user_id,
          title: 'Ödeviniz İncelendi',
          body: `"${task.title}" ödeviniz incelendi. Koçunuzdan geri bildirim aldınız.`,
          type: 'success',
          data: { link: `/ogrenci/gorevler/${task.id}` }
        })
      }

      // Activity log ekle
      await supabase.from('activity_logs').insert({
        student_id: task.student_id,
        activity_type: 'task_completed',
        subject: task.type,
        task_id: task.id,
        details: {
          title: task.title,
          score: score,
          feedback: feedback
        }
      })

      await loadTask()
    }
    setActionLoading(false)
  }

  const pageLoading = profileLoading || teacherLoading || loading

  if (pageLoading) {
    return (
      <DashboardLayout role="koc">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    )
  }

  if (!task) {
    return (
      <DashboardLayout role="koc">
        <div className="text-center py-12">
          <ClipboardList className="w-16 h-16 mx-auto mb-4 text-surface-300" />
          <h2 className="text-xl font-semibold text-surface-900 mb-2">Görev Bulunamadı</h2>
          <p className="text-surface-500 mb-4">Bu görev mevcut değil veya size ait değil.</p>
          <Link href="/koc/gorevler" className="btn btn-primary btn-md">
            Görevlere Dön
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
    pending: { label: 'Öğrenci Onayı Bekleniyor', color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: Clock },
    in_progress: { label: 'Öğrenci Çalışıyor', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: AlertCircle },
    submitted: { label: 'İnceleme Bekliyor', color: 'text-purple-600', bgColor: 'bg-purple-50', icon: ClipboardList },
    completed: { label: 'Tamamlandı', color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle },
  }

  const config = statusConfig[task.status] || statusConfig.pending
  const StatusIcon = config.icon

  return (
    <DashboardLayout role="koc">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link href="/koc/gorevler" className="inline-flex items-center gap-2 text-surface-600 hover:text-primary-500 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Görevlere Dön
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
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
                        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {task.description && (
                  <div>
                    <h3 className="font-medium text-surface-900 mb-2">Görev Açıklaması</h3>
                    <p className="text-surface-600 whitespace-pre-wrap">{task.description}</p>
                  </div>
                )}

                {/* Attachments */}
                {task.attachments && task.attachments.length > 0 && (
                  <div>
                    <h3 className="font-medium text-surface-900 mb-3 flex items-center gap-2">
                      <Paperclip className="w-4 h-4" />
                      Eklenen Dosyalar ({task.attachments.length})
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {task.attachments.map((file, index) => {
                        const isImage = file.type.startsWith('image/')
                        const isPdf = file.type === 'application/pdf'
                        const FileIcon = isImage ? ImageIcon : isPdf ? FileText : File
                        
                        return (
                          <div 
                            key={index}
                            className="flex items-center gap-2 p-2 bg-surface-50 rounded-lg border border-surface-100"
                          >
                            <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${
                              isImage ? 'bg-blue-100 text-blue-600' :
                              isPdf ? 'bg-red-100 text-red-600' :
                              'bg-surface-200 text-surface-600'
                            }`}>
                              <FileIcon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-surface-900 truncate">{file.name}</p>
                              <p className="text-xs text-surface-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Screenshots */}
                {(() => {
                  // Hem eski screenshot_url hem yeni screenshots array'ini birleştir
                  const allScreenshots: string[] = []
                  if (task.screenshots && task.screenshots.length > 0) {
                    allScreenshots.push(...task.screenshots)
                  }
                  if (task.screenshot_url && !allScreenshots.includes(task.screenshot_url)) {
                    allScreenshots.push(task.screenshot_url)
                  }
                  
                  if (allScreenshots.length === 0) return null
                  
                  return (
                    <div>
                      <h3 className="font-medium text-surface-900 mb-3">
                        Öğrencinin Yüklediği Ekran Görüntüleri ({allScreenshots.length})
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {allScreenshots.map((url, index) => (
                          <div 
                            key={index}
                            className="relative cursor-pointer group aspect-video rounded-xl overflow-hidden border border-surface-200"
                            onClick={() => setSelectedImage(url)}
                          >
                            <img 
                              src={url} 
                              alt={`Ekran görüntüsü ${index + 1}`} 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                              <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                {/* Student Response */}
                {task.student_response && (
                  <div>
                    <h3 className="font-medium text-surface-900 mb-2">Öğrencinin Notu</h3>
                    <p className="text-surface-600 bg-surface-50 p-4 rounded-xl">{task.student_response}</p>
                  </div>
                )}

                {/* Review Form (submitted durumunda) */}
                {task.status === 'submitted' && (
                  <div className="border-t border-surface-100 pt-6 space-y-4">
                    <h3 className="font-semibold text-surface-900">Görevi Değerlendir</h3>
                    
                    {/* Score */}
                    <div>
                      <label className="font-medium text-surface-700 mb-2 block">
                        <Star className="w-4 h-4 inline mr-1 text-yellow-500" />
                        Puan
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={score}
                          onChange={(e) => setScore(parseInt(e.target.value))}
                          className="flex-1 h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                        />
                        <span className="text-2xl font-bold text-primary-500 min-w-[60px] text-right">
                          {score}
                        </span>
                      </div>
                    </div>

                    {/* Feedback */}
                    <div>
                      <label className="font-medium text-surface-700 mb-2 block">
                        <MessageSquare className="w-4 h-4 inline mr-1" />
                        Geri Bildirim
                      </label>
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Öğrenciye geri bildiriminizi yazın..."
                        className="input min-h-[120px]"
                        required
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      onClick={completeTask}
                      disabled={actionLoading || !feedback.trim()}
                      className="btn btn-primary btn-lg w-full"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          Onayla ve Tamamla
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Completed State */}
                {task.status === 'completed' && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-green-700 mb-1">Görev Tamamlandı</h3>
                        {task.score !== null && (
                          <p className="text-green-600 font-medium mb-2">Verilen Puan: {task.score}/100</p>
                        )}
                        {task.coach_feedback && (
                          <div className="mt-3">
                            <p className="text-sm text-green-700 font-medium mb-1">Geri Bildiriminiz:</p>
                            <p className="text-green-800 bg-white/50 p-3 rounded-lg">{task.coach_feedback}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Student Info */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-6"
            >
              <h3 className="font-semibold text-surface-900 mb-4">Öğrenci</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-medium overflow-hidden">
                  {task.student?.profiles?.avatar_url ? (
                    <img src={task.student.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(task.student?.profiles?.full_name)
                  )}
                </div>
                <div>
                  <p className="font-medium text-surface-900">{task.student?.profiles?.full_name}</p>
                  <Link 
                    href={`/koc/ogrenciler/${task.student?.id}`}
                    className="text-sm text-primary-500 hover:text-primary-600"
                  >
                    Profili Görüntüle →
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Timeline */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card p-6"
            >
              <h3 className="font-semibold text-surface-900 mb-4">Zaman Çizelgesi</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-surface-400" />
                    <div className="w-0.5 h-full bg-surface-200 mt-1" />
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium text-surface-900">Oluşturuldu</p>
                    <p className="text-xs text-surface-500">
                      {new Date(task.created_at).toLocaleDateString('tr-TR', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                
                {task.accepted_at && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <div className="w-0.5 h-full bg-surface-200 mt-1" />
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium text-surface-900">Kabul Edildi</p>
                      <p className="text-xs text-surface-500">
                        {new Date(task.accepted_at).toLocaleDateString('tr-TR', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                )}
                
                {task.submitted_at && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <div className="w-0.5 h-full bg-surface-200 mt-1" />
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium text-surface-900">Teslim Edildi</p>
                      <p className="text-xs text-surface-500">
                        {new Date(task.submitted_at).toLocaleDateString('tr-TR', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                )}
                
                {task.completed_at && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-900">Tamamlandı</p>
                      <p className="text-xs text-surface-500">
                        {new Date(task.completed_at).toLocaleDateString('tr-TR', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Image Modal */}
        {selectedImage && (
          <div 
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
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


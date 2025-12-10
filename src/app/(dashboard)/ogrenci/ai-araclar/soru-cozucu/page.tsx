'use client'

export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useStudentProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { 
  Camera, 
  Upload, 
  ArrowLeft, 
  Sparkles, 
  Loader2,
  Image as ImageIcon,
  X,
  CheckCircle,
  Copy,
  RotateCcw,
  Send,
  MessageCircle,
  History,
  Trash2,
  Eye
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

interface SavedQuestion {
  id: string
  image_url: string
  solution: string
  coach_feedback: string | null
  status: 'solved' | 'sent_to_coach' | 'coach_replied'
  created_at: string
}

export default function QuestionSolverPage() {
  const { profile } = useProfile()
  const { studentProfile } = useStudentProfile(profile?.id || '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [solution, setSolution] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [savedQuestions, setSavedQuestions] = useState<SavedQuestion[]>([])
  const [selectedQuestion, setSelectedQuestion] = useState<SavedQuestion | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [coachInfo, setCoachInfo] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (studentProfile?.id) {
      loadData()
    }
  }, [studentProfile?.id])

  async function loadData() {
    // Koç bilgisini al
    const { data: relationship } = await supabase
      .from('coaching_relationships')
      .select(`
        coach:teacher_profiles!coaching_relationships_coach_id_fkey(
          id,
          user_id,
          profile:profiles!teacher_profiles_user_id_fkey(full_name)
        )
      `)
      .eq('student_id', studentProfile?.id)
      .eq('status', 'active')
      .single()

    if (relationship?.coach) {
      setCoachInfo(relationship.coach)
    }

    // Kayıtlı soruları yükle
    const { data: questions } = await supabase
      .from('question_solutions')
      .select('*')
      .eq('student_id', studentProfile?.id)
      .order('created_at', { ascending: false })

    if (questions) {
      setSavedQuestions(questions)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setSolution(null)
      setError(null)
      setUploadedImageUrl(null)
    }
  }

  const handleSolve = async () => {
    if (!selectedFile) return

    setLoading(true)
    setError(null)

    try {
      // Dosyayı base64'e çevir
      const base64 = await fileToBase64(selectedFile)
      
      const response = await fetch('/api/ai/solve-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: base64,
          mimeType: selectedFile.type 
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Çözüm oluşturulamadı')
      }

      const data = await response.json()
      setSolution(data.solution)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleSendToCoach = async () => {
    if (!solution || !selectedFile || !studentProfile?.id || !coachInfo) return

    setSending(true)

    try {
      // Görseli storage'a yükle
      const fileName = `${studentProfile.id}/${Date.now()}_question.jpg`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('question-images')
        .upload(fileName, selectedFile)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('question-images')
        .getPublicUrl(fileName)

      // Veritabanına kaydet
      const { data: questionData, error: insertError } = await supabase
        .from('question_solutions')
        .insert({
          student_id: studentProfile.id,
          coach_id: coachInfo.id,
          image_url: publicUrl,
          solution: solution,
          status: 'sent_to_coach'
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Koça bildirim gönder
      await supabase.from('notifications').insert({
        user_id: coachInfo.user_id,
        title: '📝 Yeni Soru Çözümü',
        body: `${profile?.full_name} bir soru çözümünü sizinle paylaştı ve geri dönüt bekliyor.`,
        type: 'question_shared',
        data: { questionId: questionData.id }
      })

      alert('Soru koçunuza gönderildi!')
      setSavedQuestions(prev => [questionData, ...prev])
      handleReset()
    } catch (err: any) {
      alert('Gönderme hatası: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setSolution(null)
    setError(null)
    setUploadedImageUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCopy = () => {
    if (solution) {
      navigator.clipboard.writeText(solution)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const deleteQuestion = async (id: string) => {
    if (!confirm('Bu soruyu silmek istediğinizden emin misiniz?')) return

    const { error } = await supabase
      .from('question_solutions')
      .delete()
      .eq('id', id)

    if (!error) {
      setSavedQuestions(prev => prev.filter(q => q.id !== id))
      if (selectedQuestion?.id === id) setSelectedQuestion(null)
    }
  }

  return (
    <DashboardLayout role="ogrenci">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/ogrenci/ai-araclar" className="p-2 hover:bg-surface-100 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-surface-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-surface-900">Soru Çözücü</h1>
              <p className="text-surface-500">Sorunun fotoğrafını yükle, AI çözsün</p>
            </div>
          </div>
          {savedQuestions.length > 0 && (
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="btn btn-ghost btn-md"
            >
              <History className="w-5 h-5" />
              Geçmiş ({savedQuestions.length})
            </button>
          )}
        </div>

        {/* History Panel */}
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="card p-4"
          >
            <h3 className="font-semibold text-surface-900 mb-4">Soru Geçmişi</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedQuestions.map((q) => (
                <div 
                  key={q.id} 
                  className={`p-3 border rounded-xl cursor-pointer transition-all hover:shadow-md ${
                    selectedQuestion?.id === q.id ? 'border-primary-500 bg-primary-50' : 'border-surface-200'
                  }`}
                  onClick={() => { setSelectedQuestion(q); setShowHistory(false); }}
                >
                  <div className="flex items-start gap-3">
                    <img src={q.image_url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        q.status === 'coach_replied' ? 'bg-green-100 text-green-700' :
                        q.status === 'sent_to_coach' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-surface-100 text-surface-600'
                      }`}>
                        {q.status === 'coach_replied' ? '✅ Cevaplandı' :
                         q.status === 'sent_to_coach' ? '⏳ Koça Gönderildi' :
                         '📝 Çözüldü'}
                      </div>
                      <p className="text-xs text-surface-400 mt-1">
                        {new Date(q.created_at).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteQuestion(q.id); }}
                      className="p-1 text-surface-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Selected Question from History */}
        {selectedQuestion && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card overflow-hidden"
          >
            <div className="p-4 bg-surface-50 border-b border-surface-100 flex items-center justify-between">
              <h3 className="font-semibold text-surface-900">Soru Detayı</h3>
              <button onClick={() => setSelectedQuestion(null)} className="text-surface-400 hover:text-surface-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-surface-100">
              <div className="p-4">
                <img src={selectedQuestion.image_url} alt="Soru" className="w-full rounded-xl" />
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <h4 className="font-medium text-surface-900 mb-2">AI Çözümü</h4>
                  <div className="prose prose-sm max-w-none bg-surface-50 rounded-xl p-4 math-content">
                    <ReactMarkdown 
                      remarkPlugins={[remarkMath]} 
                      rehypePlugins={[rehypeKatex]}
                    >
                      {selectedQuestion.solution}
                    </ReactMarkdown>
                  </div>
                </div>
                {selectedQuestion.coach_feedback && (
                  <div>
                    <h4 className="font-medium text-surface-900 mb-2 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-primary-500" />
                      Koç Geri Dönütü
                    </h4>
                    <div className="prose prose-sm max-w-none bg-green-50 border border-green-200 rounded-xl p-4 math-content">
                      <ReactMarkdown 
                        remarkPlugins={[remarkMath]} 
                        rehypePlugins={[rehypeKatex]}
                      >
                        {selectedQuestion.coach_feedback}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        {!selectedQuestion && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Upload Section */}
            <div className="card p-6">
              <h2 className="font-semibold text-surface-900 mb-4">Soru Görseli</h2>
              
              {!previewUrl ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-surface-200 rounded-2xl p-12 text-center cursor-pointer hover:border-primary-300 hover:bg-primary-50/50 transition-all"
                >
                  <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-8 h-8 text-primary-500" />
                  </div>
                  <h3 className="font-semibold text-surface-900 mb-2">Soru Fotoğrafı Yükle</h3>
                  <p className="text-sm text-surface-500 mb-4">
                    Çözmek istediğin sorunun fotoğrafını yükle
                  </p>
                  <p className="text-xs text-surface-400">
                    JPG, PNG, HEIC (Max 10MB)
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img 
                      src={previewUrl} 
                      alt="Soru" 
                      className="w-full rounded-xl border border-surface-200"
                    />
                    <button
                      onClick={handleReset}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {!solution && (
                    <button
                      onClick={handleSolve}
                      disabled={loading}
                      className="btn btn-primary btn-lg w-full"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          AI Çözüyor...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          AI ile Çöz
                        </>
                      )}
                    </button>
                  )}

                  {solution && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleReset}
                        className="btn btn-outline btn-md flex-1"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Yeni Soru
                      </button>
                      {coachInfo && (
                        <button
                          onClick={handleSendToCoach}
                          disabled={sending}
                          className="btn btn-primary btn-md flex-1"
                        >
                          {sending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          Koça Gönder
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Solution Section */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-surface-900">Çözüm</h2>
                {solution && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Kopyalandı
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Kopyala
                      </>
                    )}
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-4">
                    <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                  </div>
                  <p className="text-surface-600 font-medium">AI soruyu analiz ediyor...</p>
                  <p className="text-sm text-surface-400 mt-1">Bu birkaç saniye sürebilir</p>
                </div>
              ) : solution ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-center gap-2 text-green-700 font-medium">
                      <CheckCircle className="w-5 h-5" />
                      Çözüm Hazır!
                    </div>
                  </div>
                  <div className="bg-surface-50 rounded-xl p-4 prose prose-sm max-w-none max-h-[400px] overflow-y-auto math-content">
                    <ReactMarkdown 
                      remarkPlugins={[remarkMath]} 
                      rehypePlugins={[rehypeKatex]}
                    >
                      {solution}
                    </ReactMarkdown>
                  </div>
                  {coachInfo && (
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-sm text-blue-700">
                      <MessageCircle className="w-4 h-4 inline mr-2" />
                      Bu çözümü <strong>{coachInfo.profile?.full_name}</strong> koçunuza gönderip geri dönüt alabilirsiniz.
                    </div>
                  )}
                </motion.div>
              ) : error ? (
                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-red-700">{error}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mb-4">
                    <ImageIcon className="w-8 h-8 text-surface-400" />
                  </div>
                  <p className="text-surface-500">
                    Soru fotoğrafı yükle ve AI ile çözümü al
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="card p-6 bg-gradient-to-r from-purple-50 to-blue-50">
          <h3 className="font-semibold text-surface-900 mb-3">İpuçları</h3>
          <ul className="space-y-2 text-sm text-surface-600">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              Sorunun net ve okunaklı olduğundan emin ol
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              Mümkünse sadece bir soru yükle
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              Tüm derslerden sorular desteklenir: Matematik, Fizik, Kimya, Biyoloji, Türkçe, Tarih, Coğrafya ve daha fazlası
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              Çözümü koçunuzla paylaşarak detaylı geri dönüt alabilirsiniz
            </li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  )
}

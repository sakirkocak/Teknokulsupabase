'use client'

export const dynamic = 'force-dynamic'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, ArrowRight, BookOpen, Users, Camera, 
  Upload, X, Check, Loader2, Copy, Sparkles, Edit2, Trash2
} from 'lucide-react'
import Link from 'next/link'

interface Student {
  number: string
  name: string
  selected: boolean
}

export default function YeniSinifPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    grade_level: ''
  })
  const [createdClassroom, setCreatedClassroom] = useState<any>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [extracting, setExtracting] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [copiedCode, setCopiedCode] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router = useRouter()

  const subjects = [
    'Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe', 
    'Edebiyat', 'Tarih', 'Coğrafya', 'İngilizce', 'Geometri', 'Diğer'
  ]

  const gradeLevels = [
    '9. Sınıf', '10. Sınıf', '11. Sınıf', '12. Sınıf', 
    'Mezun', 'Üniversite', 'Diğer'
  ]

  function generateJoinCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  async function handleCreateClassroom() {
    if (!formData.name) return
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Oturum bulunamadı')

      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!teacherProfile) throw new Error('Öğretmen profili bulunamadı')

      const joinCode = generateJoinCode()

      const { data: classroom, error } = await supabase
        .from('classrooms')
        .insert({
          coach_id: teacherProfile.id,
          name: formData.name,
          description: formData.description,
          subject: formData.subject,
          grade_level: formData.grade_level,
          join_code: joinCode
        })
        .select()
        .single()

      if (error) throw error

      setCreatedClassroom(classroom)
      setStep(2)
    } catch (error: any) {
      console.error('Sınıf oluşturma hatası:', error)
      alert('Sınıf oluşturulurken bir hata oluştu: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setExtracting(true)
    setPreviewImage(URL.createObjectURL(file))

    try {
      // Base64'e çevir
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = reader.result as string
        
        const response = await fetch('/api/ai/extract-students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            image: base64,
            mimeType: file.type
          })
        })

        const data = await response.json()

        if (data.error) {
          alert('Öğrenci listesi çıkarılamadı: ' + data.error)
        } else if (data.students && data.students.length > 0) {
          setStudents(data.students.map((s: any) => ({
            ...s,
            selected: true
          })))
        } else {
          alert('Görselden öğrenci bulunamadı')
        }
        setExtracting(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Görsel işleme hatası:', error)
      alert('Görsel işlenirken bir hata oluştu')
      setExtracting(false)
    }
  }

  function toggleStudent(index: number) {
    setStudents(students.map((s, i) => 
      i === index ? { ...s, selected: !s.selected } : s
    ))
  }

  function startEdit(index: number) {
    setEditingIndex(index)
    setEditName(students[index].name)
  }

  function saveEdit(index: number) {
    setStudents(students.map((s, i) => 
      i === index ? { ...s, name: editName } : s
    ))
    setEditingIndex(null)
    setEditName('')
  }

  function removeStudent(index: number) {
    setStudents(students.filter((_, i) => i !== index))
  }

  function addManualStudent() {
    setStudents([...students, {
      number: String(students.length + 1),
      name: '',
      selected: true
    }])
    setEditingIndex(students.length)
    setEditName('')
  }

  async function handleAddStudents() {
    const selectedStudents = students.filter(s => s.selected && s.name)
    if (selectedStudents.length === 0) {
      setStep(3)
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('classroom_students')
        .insert(selectedStudents.map(s => ({
          classroom_id: createdClassroom.id,
          student_name: s.name,
          student_number: s.number,
          status: 'pending'
        })))

      if (error) throw error

      setStep(3)
    } catch (error: any) {
      console.error('Öğrenci ekleme hatası:', error)
      alert('Öğrenciler eklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(createdClassroom.join_code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href="/koc/siniflarim"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yeni Sınıf Oluştur</h1>
          <p className="text-gray-600">Adım {step} / 3</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div className={`
              flex-1 h-2 rounded-full transition-colors
              ${step >= s ? 'bg-blue-600' : 'bg-gray-200'}
            `} />
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Sınıf Bilgileri */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-100 rounded-xl">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Sınıf Bilgileri</h2>
                <p className="text-sm text-gray-600">Sınıfınızın temel bilgilerini girin</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sınıf Adı *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Örn: 11-A Matematik"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Sınıf hakkında kısa bir açıklama..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ders
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seçiniz</option>
                    {subjects.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seviye
                  </label>
                  <select
                    value={formData.grade_level}
                    onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seçiniz</option>
                    {gradeLevels.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={handleCreateClassroom}
                disabled={!formData.name || loading}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Devam Et
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Öğrenci Ekleme */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* AI ile Öğrenci Çıkarma */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">AI ile Öğrenci Ekle</h2>
                  <p className="text-sm text-gray-600">Öğrenci listesi fotoğrafından isimleri otomatik çıkar</p>
                </div>
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {extracting ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                    <p className="text-gray-600">AI öğrenci listesini analiz ediyor...</p>
                  </div>
                ) : previewImage && students.length === 0 ? (
                  <div className="flex flex-col items-center">
                    <img 
                      src={previewImage} 
                      alt="Liste önizleme" 
                      className="max-h-48 rounded-lg mb-4"
                    />
                    <p className="text-gray-600">Analiz ediliyor...</p>
                  </div>
                ) : (
                  <>
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Öğrenci listesi fotoğrafını yükleyin</p>
                    <p className="text-sm text-gray-400">veya sürükleyip bırakın</p>
                  </>
                )}
              </div>
            </div>

            {/* Öğrenci Listesi */}
            {students.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">
                    Bulunan Öğrenciler ({students.filter(s => s.selected).length} seçili)
                  </h3>
                  <button
                    onClick={addManualStudent}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Manuel Ekle
                  </button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {students.map((student, index) => (
                    <div
                      key={index}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg border transition-colors
                        ${student.selected ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}
                      `}
                    >
                      <button
                        onClick={() => toggleStudent(index)}
                        className={`
                          w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                          ${student.selected 
                            ? 'border-blue-600 bg-blue-600 text-white' 
                            : 'border-gray-300 hover:border-gray-400'
                          }
                        `}
                      >
                        {student.selected && <Check className="w-4 h-4" />}
                      </button>

                      {student.number && (
                        <span className="text-sm text-gray-500 w-8">{student.number}</span>
                      )}

                      {editingIndex === index ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={() => saveEdit(index)}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit(index)}
                          autoFocus
                          className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="flex-1 text-gray-900">{student.name || '(İsim giriniz)'}</span>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(index)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeStudent(index)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setStep(3)}
                className="text-gray-600 hover:text-gray-800"
              >
                Atla
              </button>
              <button
                onClick={handleAddStudents}
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {students.filter(s => s.selected).length > 0 
                      ? `${students.filter(s => s.selected).length} Öğrenci Ekle`
                      : 'Devam Et'
                    }
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Tamamlandı */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl border border-gray-200 p-8 text-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Sınıf Oluşturuldu!
            </h2>
            <p className="text-gray-600 mb-8">
              {createdClassroom?.name} sınıfı başarıyla oluşturuldu
            </p>

            {/* Sınıf Kodu */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-8">
              <p className="text-sm text-gray-600 mb-2">Sınıf Katılım Kodu</p>
              <div className="flex items-center justify-center gap-3">
                <code className="text-3xl font-mono font-bold text-blue-600 tracking-[0.3em]">
                  {createdClassroom?.join_code}
                </code>
                <button
                  onClick={copyCode}
                  className="p-2 bg-white rounded-lg shadow-sm hover:shadow transition-shadow"
                >
                  {copiedCode ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-3">
                Bu kodu öğrencilerinizle paylaşarak sınıfa katılmalarını sağlayabilirsiniz
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/koc/siniflarim/${createdClassroom?.id}`}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sınıfı Görüntüle
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/koc/siniflarim"
                className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Sınıf Listesi
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


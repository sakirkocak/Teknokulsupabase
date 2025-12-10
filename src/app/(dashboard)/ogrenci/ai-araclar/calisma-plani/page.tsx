'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useStudentProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Calendar,
  Loader2,
  Sparkles,
  Clock,
  Target,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Download,
  RefreshCw,
  Trash2,
  Eye,
  Plus,
  Coffee,
  Sun,
  Moon,
  Sunset
} from 'lucide-react'

type StudyPlan = {
  id: string
  name: string
  target_exam: string
  target_date: string
  daily_hours: string
  weak_subjects: string[]
  strong_subjects: string[]
  weekly_schedule: WeeklySchedule
  daily_details: DailyDetail[]
  priority_topics: string[]
  tips: string[]
  weekly_goals: WeeklyGoals
  created_at: string
}

type WeeklySchedule = {
  [day: string]: {
    morning: string
    afternoon: string
    evening: string
  }
}

type DailyDetail = {
  day: string
  subjects: { name: string; duration: string; topics: string[]; questions: number }[]
  breaks: string[]
}

type WeeklyGoals = {
  totalQuestions: number
  topics: string[]
  miniExams: number
}

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

const SUBJECTS = [
  'Matematik', 'Geometri', 'Fizik', 'Kimya', 'Biyoloji',
  'Türkçe', 'Edebiyat', 'Tarih', 'Coğrafya', 'Felsefe',
  'Din Kültürü', 'İngilizce'
]

export default function StudyPlanPage() {
  const { profile } = useProfile()
  const { studentProfile } = useStudentProfile(profile?.id || '')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<StudyPlan | null>(null)
  const [savedPlans, setSavedPlans] = useState<StudyPlan[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<StudyPlan | null>(null)
  const [examStats, setExamStats] = useState<any>(null)
  const [form, setForm] = useState({
    name: '',
    targetExam: 'TYT',
    targetDate: '',
    dailyHours: '4',
    weakSubjects: [] as string[],
    strongSubjects: [] as string[],
  })
  const printRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (studentProfile?.id) {
      loadData()
    }
  }, [studentProfile?.id])

  async function loadData() {
    // Deneme istatistiklerini yükle
    const { data: examData } = await supabase
      .from('exam_results')
      .select('*')
      .eq('student_id', studentProfile?.id)
      .order('exam_date', { ascending: false })

    if (examData && examData.length > 0) {
      const avgNet = examData.reduce((acc, e) => acc + (e.net_score || 0), 0) / examData.length
      const allWeakTopics = new Set<string>()
      const allStrongTopics = new Set<string>()
      
      examData.forEach(exam => {
        exam.weak_topics?.forEach((t: string) => allWeakTopics.add(t))
        exam.strong_topics?.forEach((t: string) => allStrongTopics.add(t))
      })

      setExamStats({
        count: examData.length,
        avgNet,
        weakTopics: Array.from(allWeakTopics).slice(0, 5),
        strongTopics: Array.from(allStrongTopics).slice(0, 5),
        lastExam: examData[0]
      })
    }

    // Kaydedilmiş planları yükle
    const { data: plansData } = await supabase
      .from('study_plans')
      .select('*')
      .eq('student_id', studentProfile?.id)
      .order('created_at', { ascending: false })

    if (plansData) {
      setSavedPlans(plansData)
    }
  }

  async function generatePlan() {
    if (!form.name) {
      alert('Lütfen plan adı girin')
      return
    }

    setLoading(true)
    setCurrentPlan(null)

    try {
      const response = await fetch('/api/ai/generate-study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          examStats,
          studentName: profile?.full_name,
          structured: true, // Yapılandırılmış JSON iste
        }),
      })

      if (!response.ok) {
        throw new Error('Plan oluşturulamadı')
      }

      const data = await response.json()
      
      const newPlan: StudyPlan = {
        id: '',
        name: form.name,
        target_exam: form.targetExam,
        target_date: form.targetDate,
        daily_hours: form.dailyHours,
        weak_subjects: form.weakSubjects,
        strong_subjects: form.strongSubjects,
        weekly_schedule: data.weeklySchedule,
        daily_details: data.dailyDetails,
        priority_topics: data.priorityTopics,
        tips: data.tips,
        weekly_goals: data.weeklyGoals,
        created_at: new Date().toISOString(),
      }

      setCurrentPlan(newPlan)
      setShowForm(false)
    } catch (error: any) {
      alert('Hata: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function savePlan() {
    if (!currentPlan || !studentProfile?.id) return

    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('study_plans')
        .insert({
          student_id: studentProfile.id,
          name: currentPlan.name,
          target_exam: currentPlan.target_exam,
          target_date: currentPlan.target_date,
          daily_hours: currentPlan.daily_hours,
          weak_subjects: currentPlan.weak_subjects,
          strong_subjects: currentPlan.strong_subjects,
          weekly_schedule: currentPlan.weekly_schedule,
          daily_details: currentPlan.daily_details,
          priority_topics: currentPlan.priority_topics,
          tips: currentPlan.tips,
          weekly_goals: currentPlan.weekly_goals,
        })
        .select()
        .single()

      if (error) throw error

      setSavedPlans(prev => [data, ...prev])
      setCurrentPlan({ ...currentPlan, id: data.id })
      alert('Plan başarıyla kaydedildi!')
    } catch (error: any) {
      alert('Kaydetme hatası: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  async function deletePlan(planId: string) {
    if (!confirm('Bu planı silmek istediğinizden emin misiniz?')) return

    const { error } = await supabase
      .from('study_plans')
      .delete()
      .eq('id', planId)

    if (!error) {
      setSavedPlans(prev => prev.filter(p => p.id !== planId))
      if (selectedPlan?.id === planId) setSelectedPlan(null)
    }
  }

  function downloadPDF() {
    const plan = selectedPlan || currentPlan
    if (!plan) return

    // Print stilini uygula ve yazdır
    const printContent = document.getElementById('plan-print-content')
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${plan.name} - Çalışma Planı</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: white; color: #1a1a1a; }
          .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #f97316; }
          .header h1 { color: #f97316; font-size: 28px; margin-bottom: 10px; }
          .header p { color: #666; }
          .meta { display: flex; justify-content: space-around; margin-bottom: 30px; padding: 20px; background: #fff7ed; border-radius: 10px; }
          .meta-item { text-align: center; }
          .meta-item strong { display: block; font-size: 18px; color: #f97316; }
          .section { margin-bottom: 25px; }
          .section h2 { color: #1a1a1a; font-size: 18px; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 2px solid #f97316; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 12px; text-align: left; border: 1px solid #e5e5e5; }
          th { background: #f97316; color: white; }
          tr:nth-child(even) { background: #fef3e8; }
          .tag { display: inline-block; padding: 4px 12px; background: #fee2e2; color: #dc2626; border-radius: 20px; margin: 3px; font-size: 12px; }
          .tag.green { background: #dcfce7; color: #16a34a; }
          .tip { padding: 10px 15px; background: #f0fdf4; border-left: 4px solid #22c55e; margin-bottom: 10px; }
          .goals { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
          .goal-card { padding: 15px; background: #fef3e8; border-radius: 10px; text-align: center; }
          .goal-card strong { display: block; font-size: 24px; color: #f97316; }
          .footer { margin-top: 30px; text-align: center; color: #999; font-size: 12px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📚 ${plan.name}</h1>
          <p>Kişiselleştirilmiş Çalışma Planı - Teknokul AI</p>
        </div>
        
        <div class="meta">
          <div class="meta-item">
            <strong>${plan.target_exam}</strong>
            <span>Hedef Sınav</span>
          </div>
          <div class="meta-item">
            <strong>${plan.target_date ? new Date(plan.target_date).toLocaleDateString('tr-TR') : 'Belirtilmedi'}</strong>
            <span>Sınav Tarihi</span>
          </div>
          <div class="meta-item">
            <strong>${plan.daily_hours} Saat</strong>
            <span>Günlük Çalışma</span>
          </div>
        </div>

        <div class="section">
          <h2>📅 Haftalık Program</h2>
          <table>
            <tr>
              <th>Gün</th>
              <th>🌅 Sabah</th>
              <th>☀️ Öğleden Sonra</th>
              <th>🌙 Akşam</th>
            </tr>
            ${plan.weekly_schedule ? Object.entries(plan.weekly_schedule).map(([day, times]: [string, any]) => `
              <tr>
                <td><strong>${day}</strong></td>
                <td>${times.morning || '-'}</td>
                <td>${times.afternoon || '-'}</td>
                <td>${times.evening || '-'}</td>
              </tr>
            `).join('') : ''}
          </table>
        </div>

        <div class="section">
          <h2>🎯 Öncelikli Konular</h2>
          <div>
            ${plan.priority_topics?.map(t => `<span class="tag">${t}</span>`).join('') || '-'}
          </div>
        </div>

        <div class="section">
          <h2>💪 Güçlü Dersler</h2>
          <div>
            ${plan.strong_subjects?.map(s => `<span class="tag green">${s}</span>`).join('') || '-'}
          </div>
        </div>

        <div class="section">
          <h2>💡 Çalışma İpuçları</h2>
          ${plan.tips?.map(tip => `<div class="tip">${tip}</div>`).join('') || ''}
        </div>

        <div class="section">
          <h2>📈 Haftalık Hedefler</h2>
          <div class="goals">
            <div class="goal-card">
              <strong>${plan.weekly_goals?.totalQuestions || 0}</strong>
              <span>Toplam Soru</span>
            </div>
            <div class="goal-card">
              <strong>${plan.weekly_goals?.topics?.length || 0}</strong>
              <span>Tamamlanacak Konu</span>
            </div>
            <div class="goal-card">
              <strong>${plan.weekly_goals?.miniExams || 0}</strong>
              <span>Mini Deneme</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Bu plan ${new Date(plan.created_at).toLocaleDateString('tr-TR')} tarihinde Teknokul AI tarafından oluşturulmuştur.</p>
        </div>
      </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }

  const toggleSubject = (subject: string, type: 'weak' | 'strong') => {
    const key = type === 'weak' ? 'weakSubjects' : 'strongSubjects'
    const otherKey = type === 'weak' ? 'strongSubjects' : 'weakSubjects'
    
    setForm(prev => {
      const current = prev[key]
      const other = prev[otherKey]
      
      // Diğer listeden çıkar
      const newOther = other.filter(s => s !== subject)
      
      // Bu listeye ekle/çıkar (limit yok)
      const newCurrent = current.includes(subject)
        ? current.filter(s => s !== subject)
        : [...current, subject]

      return { 
        ...prev, 
        [key]: newCurrent,
        [otherKey]: newOther
      }
    })
  }

  const displayPlan = selectedPlan || currentPlan

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
              <h1 className="text-2xl font-bold text-surface-900">Çalışma Planı</h1>
              <p className="text-surface-500">AI ile kişiselleştirilmiş çalışma planı oluştur</p>
            </div>
          </div>
          {!showForm && !displayPlan && (
            <button onClick={() => setShowForm(true)} className="btn btn-primary btn-md">
              <Plus className="w-5 h-5" />
              Yeni Plan Oluştur
            </button>
          )}
        </div>

        {/* Saved Plans */}
        {savedPlans.length > 0 && !showForm && !displayPlan && (
          <div className="card p-6">
            <h2 className="font-semibold text-surface-900 mb-4">Kayıtlı Planlarım</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedPlans.map((plan) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border border-surface-200 rounded-xl hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => setSelectedPlan(plan)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-accent-500 rounded-xl flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deletePlan(plan.id); }}
                      className="p-1.5 text-surface-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="font-semibold text-surface-900 mb-1">{plan.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-surface-500">
                    <span className="px-2 py-0.5 bg-primary-50 text-primary-600 rounded-full text-xs">{plan.target_exam}</span>
                    <span>{plan.daily_hours} saat/gün</span>
                  </div>
                  <p className="text-xs text-surface-400 mt-2">
                    {new Date(plan.created_at).toLocaleDateString('tr-TR')}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid lg:grid-cols-2 gap-6"
          >
            <div className="card p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-surface-900">Yeni Plan Oluştur</h2>
                <button onClick={() => setShowForm(false)} className="text-surface-400 hover:text-surface-600">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="label">Plan Adı *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input"
                  placeholder="Örn: TYT Hazırlık Planı"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Hedef Sınav</label>
                  <select
                    value={form.targetExam}
                    onChange={(e) => setForm({ ...form, targetExam: e.target.value })}
                    className="input"
                  >
                    <option value="TYT">TYT</option>
                    <option value="AYT">AYT</option>
                    <option value="LGS">LGS</option>
                    <option value="KPSS">KPSS</option>
                  </select>
                </div>
                <div>
                  <label className="label">Sınav Tarihi</label>
                  <input
                    type="date"
                    value={form.targetDate}
                    onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Günlük Çalışma Süresi</label>
                <select
                  value={form.dailyHours}
                  onChange={(e) => setForm({ ...form, dailyHours: e.target.value })}
                  className="input"
                >
                  {[2,3,4,5,6,7,8,10].map(h => (
                    <option key={h} value={h}>{h} Saat</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  Zayıf Dersler
                </label>
                <div className="flex flex-wrap gap-2">
                  {SUBJECTS.map((subject) => (
                    <button
                      key={subject}
                      onClick={() => toggleSubject(subject, 'weak')}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        form.weakSubjects.includes(subject)
                          ? 'bg-red-500 text-white shadow-md'
                          : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                      }`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Güçlü Dersler
                </label>
                <div className="flex flex-wrap gap-2">
                  {SUBJECTS.map((subject) => (
                    <button
                      key={subject}
                      onClick={() => toggleSubject(subject, 'strong')}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        form.strongSubjects.includes(subject)
                          ? 'bg-green-500 text-white shadow-md'
                          : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                      }`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={generatePlan}
                disabled={loading || !form.name}
                className="btn btn-primary btn-lg w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Plan Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    AI ile Plan Oluştur
                  </>
                )}
              </button>
            </div>

            {/* Info Panel */}
            <div className="space-y-6">
              {examStats && (
                <div className="card p-6">
                  <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary-500" />
                    Deneme Verileriniz
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-surface-50 rounded-xl text-center">
                      <div className="text-2xl font-bold text-primary-600">{examStats.count}</div>
                      <div className="text-sm text-surface-500">Deneme</div>
                    </div>
                    <div className="p-3 bg-surface-50 rounded-xl text-center">
                      <div className="text-2xl font-bold text-accent-600">{examStats.avgNet.toFixed(1)}</div>
                      <div className="text-sm text-surface-500">Ort. Net</div>
                    </div>
                  </div>
                  <p className="text-sm text-surface-500">
                    Bu veriler otomatik olarak planınıza yansıtılacak.
                  </p>
                </div>
              )}

              <div className="card p-6 bg-gradient-to-br from-primary-50 to-accent-50">
                <h3 className="font-semibold text-surface-900 mb-3">Plan Özellikleri</h3>
                <ul className="space-y-3 text-sm text-surface-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    Kişiselleştirilmiş haftalık program
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    Zayıf konulara öncelik
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    PDF olarak indirilebilir
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    Sisteme kaydedilir
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* Display Plan */}
        {displayPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button onClick={() => { setSelectedPlan(null); setCurrentPlan(null); }} className="btn btn-ghost btn-md">
                <ArrowLeft className="w-4 h-4" />
                Geri
              </button>
              {!displayPlan.id && (
                <button onClick={savePlan} disabled={saving} className="btn btn-primary btn-md">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Planı Kaydet
                </button>
              )}
              <button onClick={downloadPDF} className="btn btn-outline btn-md">
                <Download className="w-4 h-4" />
                PDF İndir
              </button>
              <button onClick={() => { setCurrentPlan(null); setSelectedPlan(null); setShowForm(true); }} className="btn btn-ghost btn-md">
                <RefreshCw className="w-4 h-4" />
                Yeni Plan
              </button>
            </div>

            {/* Plan Content */}
            <div id="plan-print-content" className="card overflow-hidden">
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-primary-500 to-accent-500 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <Calendar className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{displayPlan.name}</h2>
                    <p className="text-white/80">Kişiselleştirilmiş Çalışma Planı</p>
                  </div>
                </div>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-3 divide-x divide-surface-100 border-b border-surface-100">
                <div className="p-4 text-center">
                  <div className="text-lg font-bold text-primary-600">{displayPlan.target_exam}</div>
                  <div className="text-sm text-surface-500">Hedef Sınav</div>
                </div>
                <div className="p-4 text-center">
                  <div className="text-lg font-bold text-surface-900">
                    {displayPlan.target_date ? new Date(displayPlan.target_date).toLocaleDateString('tr-TR') : '-'}
                  </div>
                  <div className="text-sm text-surface-500">Sınav Tarihi</div>
                </div>
                <div className="p-4 text-center">
                  <div className="text-lg font-bold text-accent-600">{displayPlan.daily_hours} Saat</div>
                  <div className="text-sm text-surface-500">Günlük Çalışma</div>
                </div>
              </div>

              {/* Weekly Schedule */}
              {displayPlan.weekly_schedule && (
                <div className="p-6 border-b border-surface-100">
                  <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary-500" />
                    Haftalık Program
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-surface-50">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-surface-700">Gün</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-surface-700">
                            <div className="flex items-center gap-1"><Sun className="w-4 h-4 text-yellow-500" /> Sabah</div>
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-surface-700">
                            <div className="flex items-center gap-1"><Sunset className="w-4 h-4 text-orange-500" /> Öğleden Sonra</div>
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-surface-700">
                            <div className="flex items-center gap-1"><Moon className="w-4 h-4 text-indigo-500" /> Akşam</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-100">
                        {Object.entries(displayPlan.weekly_schedule).map(([day, times]: [string, any], i) => (
                          <tr key={day} className={i % 2 === 0 ? 'bg-white' : 'bg-surface-50/50'}>
                            <td className="px-4 py-3 font-medium text-surface-900">{day}</td>
                            <td className="px-4 py-3 text-sm text-surface-600">{times.morning || '-'}</td>
                            <td className="px-4 py-3 text-sm text-surface-600">{times.afternoon || '-'}</td>
                            <td className="px-4 py-3 text-sm text-surface-600">{times.evening || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Priority Topics */}
              {displayPlan.priority_topics && displayPlan.priority_topics.length > 0 && (
                <div className="p-6 border-b border-surface-100">
                  <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    Öncelikli Konular
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {displayPlan.priority_topics.map((topic, i) => (
                      <span key={i} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm font-medium">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Strong Subjects */}
              {displayPlan.strong_subjects && displayPlan.strong_subjects.length > 0 && (
                <div className="p-6 border-b border-surface-100">
                  <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Güçlü Dersler
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {displayPlan.strong_subjects.map((subject, i) => (
                      <span key={i} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips */}
              {displayPlan.tips && displayPlan.tips.length > 0 && (
                <div className="p-6 border-b border-surface-100">
                  <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    Çalışma İpuçları
                  </h3>
                  <div className="space-y-3">
                    {displayPlan.tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-xl">
                        <div className="w-6 h-6 bg-yellow-200 rounded-full flex items-center justify-center flex-shrink-0 text-yellow-700 text-sm font-bold">
                          {i + 1}
                        </div>
                        <p className="text-sm text-surface-700">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Weekly Goals */}
              {displayPlan.weekly_goals && (
                <div className="p-6">
                  <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-accent-500" />
                    Haftalık Hedefler
                  </h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl text-center">
                      <div className="text-3xl font-bold text-primary-600">{displayPlan.weekly_goals.totalQuestions || 0}</div>
                      <div className="text-sm text-primary-700">Toplam Soru</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-accent-50 to-accent-100 rounded-xl text-center">
                      <div className="text-3xl font-bold text-accent-600">{displayPlan.weekly_goals.topics?.length || 0}</div>
                      <div className="text-sm text-accent-700">Tamamlanacak Konu</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-xl text-center">
                      <div className="text-3xl font-bold text-secondary-600">{displayPlan.weekly_goals.miniExams || 0}</div>
                      <div className="text-sm text-secondary-700">Mini Deneme</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!showForm && !displayPlan && savedPlans.length === 0 && (
          <div className="card p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-primary-500" />
            </div>
            <h3 className="text-xl font-semibold text-surface-900 mb-2">Henüz çalışma planın yok</h3>
            <p className="text-surface-500 mb-6 max-w-md mx-auto">
              AI ile kişiselleştirilmiş bir çalışma planı oluştur ve hedeflerine ulaş!
            </p>
            <button onClick={() => setShowForm(true)} className="btn btn-primary btn-lg">
              <Sparkles className="w-5 h-5" />
              İlk Planımı Oluştur
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

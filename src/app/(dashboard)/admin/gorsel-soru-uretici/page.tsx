'use client'

import { useState, useEffect, useRef } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { 
  Shapes, 
  BarChart3, 
  Save, 
  Loader2, 
  CheckCircle, 
  RefreshCw,
  Triangle,
  Square,
  Circle,
  ArrowLeft,
  Sparkles,
  Eye,
  Download,
  Settings2,
  Layers
} from 'lucide-react'
import {
  generateTriangleSVG,
  generateRectangleSVG,
  generateCircleSVG,
  generateCoordinatePlaneSVG,
  generateParallelogramSVG,
  generateFunctionPoints,
  generateChartConfig,
  GEOMETRY_TEMPLATES,
  CHART_TEMPLATES,
  generateRandomVisualQuestion,
  type VisualQuestion
} from '@/lib/visualGenerators'
import Link from 'next/link'

interface GeneratedVisualQuestion extends VisualQuestion {
  id?: string
  saved?: boolean
}

export default function VisualQuestionGeneratorPage() {
  const { profile, loading: profileLoading } = useProfile()
  const [activeTab, setActiveTab] = useState<'geometry' | 'chart'>('geometry')
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedVisualQuestion[]>([])
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState('8')
  const [selectedDifficulty, setSelectedDifficulty] = useState<'kolay' | 'orta' | 'zor'>('orta')
  const [questionCount, setQuestionCount] = useState(5)
  const [previewQuestion, setPreviewQuestion] = useState<GeneratedVisualQuestion | null>(null)
  
  // Geometri parametreleri
  const [geometryType, setGeometryType] = useState<'triangle' | 'rectangle' | 'circle' | 'coordinate' | 'parallelogram'>('triangle')
  const [geometryParams, setGeometryParams] = useState({
    // Üçgen
    triangleA: 6,
    triangleB: 8,
    triangleC: 10,
    // Dikdörtgen
    rectWidth: 8,
    rectHeight: 5,
    // Daire
    circleRadius: 7,
    // Koordinat
    point1X: 2,
    point1Y: 3,
    point2X: 5,
    point2Y: 7,
    // Paralel kenar
    paraBase: 10,
    paraHeight: 6,
    paraSlant: 3
  })
  
  // Grafik parametreleri
  const [chartType, setChartType] = useState<'linear' | 'quadratic' | 'bar'>('linear')
  const [chartParams, setChartParams] = useState({
    // Doğrusal
    linearM: 2,
    linearB: 1,
    // Parabolik
    quadraticA: 1,
    // Bar chart
    barData: '10,15,20,25,30'
  })
  
  const supabase = createClient()

  // Yetki kontrolü
  useEffect(() => {
    if (!profileLoading && profile?.role !== 'admin') {
      window.location.href = '/giris'
    }
  }, [profile, profileLoading])

  // Geometri önizleme
  const getGeometryPreview = () => {
    switch (geometryType) {
      case 'triangle':
        return generateTriangleSVG(
          geometryParams.triangleA,
          geometryParams.triangleB,
          geometryParams.triangleC
        )
      case 'rectangle':
        return generateRectangleSVG(
          geometryParams.rectWidth,
          geometryParams.rectHeight
        )
      case 'circle':
        return generateCircleSVG(
          geometryParams.circleRadius,
          true,
          true
        )
      case 'coordinate':
        return generateCoordinatePlaneSVG({
          type: 'coordinate',
          xRange: [-1, 8],
          yRange: [-1, 10],
          points: [
            { x: geometryParams.point1X, y: geometryParams.point1Y, label: 'A' },
            { x: geometryParams.point2X, y: geometryParams.point2Y, label: 'B' }
          ],
          lines: [{
            start: { x: geometryParams.point1X, y: geometryParams.point1Y },
            end: { x: geometryParams.point2X, y: geometryParams.point2Y }
          }]
        })
      case 'parallelogram':
        return generateParallelogramSVG(
          geometryParams.paraBase,
          geometryParams.paraHeight,
          geometryParams.paraSlant
        )
      default:
        return ''
    }
  }

  // Soru üret
  const generateQuestions = async () => {
    setGenerating(true)
    const questions: GeneratedVisualQuestion[] = []
    
    try {
      for (let i = 0; i < questionCount; i++) {
        const q = generateRandomVisualQuestion(activeTab, selectedDifficulty)
        questions.push({
          ...q,
          id: `temp-${Date.now()}-${i}`,
          saved: false
        })
        // Biraz bekle (UI için)
        await new Promise(r => setTimeout(r, 200))
        setGeneratedQuestions([...questions])
      }
    } catch (error) {
      console.error('Soru üretme hatası:', error)
    } finally {
      setGenerating(false)
    }
  }

  // Tek soru kaydet
  const saveQuestion = async (question: GeneratedVisualQuestion) => {
    setSaving(true)
    try {
      // Önce konuyu bul veya oluştur
      const topicName = question.topic
      let topicId: string | null = null
      
      // Geometri için Matematik, Chart için ilgili derse bağla
      const { data: subjects } = await supabase
        .from('subjects')
        .select('id')
        .eq('name', 'Matematik')
        .single()
      
      if (subjects) {
        const { data: topics } = await supabase
          .from('topics')
          .select('id')
          .eq('subject_id', subjects.id)
          .eq('grade', parseInt(selectedGrade))
          .ilike('main_topic', `%${topicName}%`)
          .limit(1)
        
        if (topics && topics.length > 0) {
          topicId = topics[0].id
        }
      }
      
      // Soruyu kaydet
      const { error } = await supabase.from('questions').insert({
        question_text: question.question_text,
        options: question.options,
        correct_answer: question.correct_answer,
        explanation: question.explanation,
        difficulty: question.difficulty,
        grade: parseInt(selectedGrade),
        topic_id: topicId,
        image_data: question.visual_data,
        image_type: question.visual_type,
        created_by: profile?.id,
        source: 'visual_generator'
      })
      
      if (error) throw error
      
      // Başarılı
      setGeneratedQuestions(prev => 
        prev.map(q => q.id === question.id ? { ...q, saved: true } : q)
      )
    } catch (error) {
      console.error('Kaydetme hatası:', error)
      alert('Soru kaydedilemedi!')
    } finally {
      setSaving(false)
    }
  }

  // Tüm soruları kaydet
  const saveAllQuestions = async () => {
    const unsavedQuestions = generatedQuestions.filter(q => !q.saved)
    for (const q of unsavedQuestions) {
      await saveQuestion(q)
    }
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 to-surface-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin/ai-soru-uretici"
              className="p-2 rounded-lg bg-white shadow hover:shadow-md transition-shadow"
            >
              <ArrowLeft className="w-5 h-5 text-surface-600" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-surface-800 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl text-white">
                  <Shapes className="w-6 h-6" />
                </div>
                Görsel Soru Üretici
              </h1>
              <p className="text-surface-500 mt-1">SVG Geometri ve Grafik tabanlı sorular üretin</p>
            </div>
          </div>
        </div>

        {/* Tab Seçimi */}
        <div className="bg-white rounded-2xl shadow-lg p-2 mb-6 inline-flex">
          <button
            onClick={() => setActiveTab('geometry')}
            className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${
              activeTab === 'geometry'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                : 'text-surface-600 hover:bg-surface-100'
            }`}
          >
            <Shapes className="w-5 h-5" />
            SVG Geometri
          </button>
          <button
            onClick={() => setActiveTab('chart')}
            className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${
              activeTab === 'chart'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                : 'text-surface-600 hover:bg-surface-100'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Grafik/Chart
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sol Panel - Ayarlar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Genel Ayarlar */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-semibold text-surface-800 mb-4 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-surface-400" />
                Genel Ayarlar
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-600 mb-2">Sınıf</label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full px-4 py-2 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    {[5, 6, 7, 8, 9, 10, 11, 12].map(g => (
                      <option key={g} value={g}>{g}. Sınıf</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-surface-600 mb-2">Zorluk</label>
                  <div className="flex gap-2">
                    {(['kolay', 'orta', 'zor'] as const).map(d => (
                      <button
                        key={d}
                        onClick={() => setSelectedDifficulty(d)}
                        className={`flex-1 py-2 rounded-lg font-medium capitalize transition-all ${
                          selectedDifficulty === d
                            ? d === 'kolay' ? 'bg-green-500 text-white' 
                              : d === 'orta' ? 'bg-yellow-500 text-white'
                              : 'bg-red-500 text-white'
                            : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-surface-600 mb-2">Soru Sayısı</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value) || 5)}
                    className="w-full px-4 py-2 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Geometri Ayarları */}
            {activeTab === 'geometry' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="font-semibold text-surface-800 mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-500" />
                  Geometri Türü
                </h3>
                
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { id: 'triangle', icon: Triangle, label: 'Üçgen' },
                    { id: 'rectangle', icon: Square, label: 'Dikdörtgen' },
                    { id: 'circle', icon: Circle, label: 'Daire' },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => setGeometryType(item.id as any)}
                      className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                        geometryType === item.id
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="text-xs">{item.label}</span>
                    </button>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setGeometryType('coordinate')}
                    className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                      geometryType === 'coordinate'
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                    }`}
                  >
                    <span className="text-lg">📍</span>
                    <span className="text-xs">Koordinat</span>
                  </button>
                  <button
                    onClick={() => setGeometryType('parallelogram')}
                    className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                      geometryType === 'parallelogram'
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                    }`}
                  >
                    <span className="text-lg">▱</span>
                    <span className="text-xs">Paralelkenar</span>
                  </button>
                </div>

                {/* Parametre girişleri */}
                <div className="mt-4 space-y-3">
                  {geometryType === 'triangle' && (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-surface-500">a</label>
                          <input
                            type="number"
                            value={geometryParams.triangleA}
                            onChange={(e) => setGeometryParams(p => ({ ...p, triangleA: parseInt(e.target.value) || 6 }))}
                            className="w-full px-2 py-1 text-sm border rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-surface-500">b</label>
                          <input
                            type="number"
                            value={geometryParams.triangleB}
                            onChange={(e) => setGeometryParams(p => ({ ...p, triangleB: parseInt(e.target.value) || 8 }))}
                            className="w-full px-2 py-1 text-sm border rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-surface-500">c</label>
                          <input
                            type="number"
                            value={geometryParams.triangleC}
                            onChange={(e) => setGeometryParams(p => ({ ...p, triangleC: parseInt(e.target.value) || 10 }))}
                            className="w-full px-2 py-1 text-sm border rounded"
                          />
                        </div>
                      </div>
                    </>
                  )}
                  
                  {geometryType === 'rectangle' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-surface-500">En</label>
                        <input
                          type="number"
                          value={geometryParams.rectWidth}
                          onChange={(e) => setGeometryParams(p => ({ ...p, rectWidth: parseInt(e.target.value) || 8 }))}
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-surface-500">Boy</label>
                        <input
                          type="number"
                          value={geometryParams.rectHeight}
                          onChange={(e) => setGeometryParams(p => ({ ...p, rectHeight: parseInt(e.target.value) || 5 }))}
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      </div>
                    </div>
                  )}
                  
                  {geometryType === 'circle' && (
                    <div>
                      <label className="text-xs text-surface-500">Yarıçap</label>
                      <input
                        type="number"
                        value={geometryParams.circleRadius}
                        onChange={(e) => setGeometryParams(p => ({ ...p, circleRadius: parseInt(e.target.value) || 7 }))}
                        className="w-full px-2 py-1 text-sm border rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Grafik Ayarları */}
            {activeTab === 'chart' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="font-semibold text-surface-800 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-500" />
                  Grafik Türü
                </h3>
                
                <div className="space-y-2">
                  {[
                    { id: 'linear', label: 'Doğrusal (y = mx + b)', icon: '📈' },
                    { id: 'quadratic', label: 'Parabolik (y = ax²)', icon: '📉' },
                    { id: 'bar', label: 'Sütun Grafik', icon: '📊' },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => setChartType(item.id as any)}
                      className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                        chartType === item.id
                          ? 'bg-green-500 text-white shadow-lg'
                          : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* Grafik parametreleri */}
                <div className="mt-4 space-y-3">
                  {chartType === 'linear' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-surface-500">Eğim (m)</label>
                        <input
                          type="number"
                          value={chartParams.linearM}
                          onChange={(e) => setChartParams(p => ({ ...p, linearM: parseInt(e.target.value) || 1 }))}
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-surface-500">Kesişim (b)</label>
                        <input
                          type="number"
                          value={chartParams.linearB}
                          onChange={(e) => setChartParams(p => ({ ...p, linearB: parseInt(e.target.value) || 0 }))}
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      </div>
                    </div>
                  )}
                  
                  {chartType === 'quadratic' && (
                    <div>
                      <label className="text-xs text-surface-500">Katsayı (a)</label>
                      <input
                        type="number"
                        value={chartParams.quadraticA}
                        onChange={(e) => setChartParams(p => ({ ...p, quadraticA: parseInt(e.target.value) || 1 }))}
                        className="w-full px-2 py-1 text-sm border rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Üret Butonu */}
            <button
              onClick={generateQuestions}
              disabled={generating}
              className="w-full py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Üretiliyor...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {questionCount} Soru Üret
                </>
              )}
            </button>
          </div>

          {/* Orta Panel - Önizleme */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
              <h3 className="font-semibold text-surface-800 mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-purple-500" />
                Canlı Önizleme
              </h3>
              
              <div className="aspect-square bg-surface-50 rounded-xl flex items-center justify-center overflow-hidden">
                {activeTab === 'geometry' ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: getGeometryPreview() }}
                    className="w-full h-full flex items-center justify-center"
                  />
                ) : (
                  <div className="text-center text-surface-400 p-4">
                    <BarChart3 className="w-16 h-16 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Grafik önizlemesi için<br/>Chart.js gerekli</p>
                  </div>
                )}
              </div>
              
              <div className="mt-4 text-sm text-surface-500">
                <p>
                  {activeTab === 'geometry' 
                    ? `Seçili: ${geometryType === 'triangle' ? 'Üçgen' : geometryType === 'rectangle' ? 'Dikdörtgen' : geometryType === 'circle' ? 'Daire' : geometryType === 'coordinate' ? 'Koordinat Düzlemi' : 'Paralelkenar'}`
                    : `Seçili: ${chartType === 'linear' ? 'Doğrusal Fonksiyon' : chartType === 'quadratic' ? 'Parabolik Fonksiyon' : 'Sütun Grafik'}`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Sağ Panel - Üretilen Sorular */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-surface-800 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-orange-500" />
                  Üretilen Sorular ({generatedQuestions.length})
                </h3>
                
                {generatedQuestions.some(q => !q.saved) && (
                  <button
                    onClick={saveAllQuestions}
                    disabled={saving}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-green-600 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Tümünü Kaydet
                  </button>
                )}
              </div>
              
              {generatedQuestions.length === 0 ? (
                <div className="text-center py-12 text-surface-400">
                  <Shapes className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <p>Henüz soru üretilmedi</p>
                  <p className="text-sm mt-1">Soldan ayarları yapıp &quot;Soru Üret&quot; butonuna tıklayın</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {generatedQuestions.map((q, idx) => (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        q.saved 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-surface-200 bg-white hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-surface-100 text-surface-600">
                              #{idx + 1}
                            </span>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                              q.difficulty === 'kolay' ? 'bg-green-100 text-green-700' :
                              q.difficulty === 'orta' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {q.difficulty}
                            </span>
                            <span className="text-xs text-surface-500">{q.topic}</span>
                          </div>
                          <p className="text-sm text-surface-700 line-clamp-2">{q.question_text}</p>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {q.saved ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <button
                              onClick={() => saveQuestion(q)}
                              disabled={saving}
                              className="p-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Mini önizleme */}
                      {q.visual_type === 'svg' && (
                        <div 
                          className="mt-3 p-2 bg-white rounded-lg border border-surface-100"
                          dangerouslySetInnerHTML={{ 
                            __html: q.visual_data.replace(/width="400"/g, 'width="100%"').replace(/height="400"/g, 'height="150"')
                          }}
                        />
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


/**
 * 📚 JARVIS Konu Anlatım API
 * 
 * Sesli konu anlatımı + Hologram senkronizasyonu
 * RAG ile MEB müfredatı entegrasyonu
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getJarvisSystemPrompt, JARVIS_IDENTITY } from '@/lib/jarvis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

interface TeachRequest {
  topic: string
  grade?: number
  subject?: string
  depth?: 'basic' | 'intermediate' | 'advanced'
  withHologram?: boolean
  language?: string
}

interface HologramScene {
  id: string
  name: string
  timing: number // saniye
  model?: string
  animation?: string
}

interface TeachingSection {
  order: number
  title: string
  content: string
  voiceScript: string
  hologramScene?: HologramScene
  keyPoints: string[]
  duration: number // tahmini saniye
}

interface TeachResponse {
  success: boolean
  topic: string
  title: string
  introduction: string
  sections: TeachingSection[]
  summary: string
  quiz?: Array<{
    question: string
    options: string[]
    correct: number
  }>
  totalDuration: number
  hologramSequence: HologramScene[]
  suggestedSimulation?: string
}

// Konu-Hologram eşleştirme
const TOPIC_HOLOGRAM_MAP: Record<string, string[]> = {
  // Biyoloji
  'fotosentez': ['leaf', 'chloroplast', 'cell'],
  'hücre': ['animal-cell', 'plant-cell', 'cell'],
  'dna': ['dna-helix', 'cell'],
  'sindirim': ['stomach', 'intestine'],
  'solunum': ['lungs', 'heart'],
  'dolaşım': ['heart', 'blood-cell'],
  'sinir': ['brain', 'neuron'],
  
  // Fizik
  'atom': ['atom', 'electron'],
  'molekül': ['molecule', 'atom'],
  'elektrik': ['circuit', 'electron'],
  'manyetizma': ['magnet', 'compass'],
  'ışık': ['prism', 'wave'],
  'ses': ['wave', 'speaker'],
  'kuvvet': ['vector', 'newton'],
  'hareket': ['car', 'ball'],
  'enerji': ['battery', 'sun'],
  
  // Kimya
  'periyodik': ['atom', 'element'],
  'bağ': ['molecule', 'bond'],
  'asit': ['beaker', 'molecule'],
  'baz': ['beaker', 'molecule'],
  
  // Matematik
  'üçgen': ['triangle', 'geometry'],
  'çember': ['circle', 'geometry'],
  'kare': ['square', 'geometry'],
  'dikdörtgen': ['rectangle', 'geometry'],
  'küp': ['cube', 'geometry'],
  'silindir': ['cylinder', 'geometry'],
  'küre': ['sphere', 'geometry'],
  'koordinat': ['grid', 'axis'],
  'fonksiyon': ['graph', 'parabola'],
  'denklem': ['equation', 'balance']
}

// Konu için hologram bul
function getHologramsForTopic(topic: string): string[] {
  const lowerTopic = topic.toLowerCase()
  
  for (const [key, holograms] of Object.entries(TOPIC_HOLOGRAM_MAP)) {
    if (lowerTopic.includes(key)) {
      return holograms
    }
  }
  
  return ['default', 'sparkle']
}

// PhET simülasyonu öner
function suggestSimulation(topic: string): string | null {
  const simulationMap: Record<string, string> = {
    'elektrik': 'circuit-construction-kit-dc',
    'devre': 'circuit-construction-kit-dc',
    'kuvvet': 'forces-and-motion-basics',
    'hareket': 'forces-and-motion-basics',
    'enerji': 'energy-skate-park-basics',
    'atom': 'build-an-atom',
    'asit': 'acid-base-solutions',
    'baz': 'acid-base-solutions',
    'kesir': 'fractions-intro',
    'grafik': 'graphing-lines',
    'fonksiyon': 'function-builder',
    'alan': 'area-builder',
    'dalga': 'wave-on-a-string',
    'sarkaç': 'pendulum-lab',
    'doğal seçilim': 'natural-selection',
    'evrim': 'natural-selection',
    'gen': 'gene-expression-essentials',
    'madde': 'states-of-matter',
    'molekül': 'molecule-shapes'
  }
  
  const lowerTopic = topic.toLowerCase()
  for (const [key, sim] of Object.entries(simulationMap)) {
    if (lowerTopic.includes(key)) {
      return sim
    }
  }
  
  return null
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // =====================================================
    // 🔒 AUTH KONTROLÜ
    // =====================================================
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ 
        error: 'Giriş yapmanız gerekiyor',
        requireAuth: true
      }, { status: 401 })
    }
    
    const body: TeachRequest = await request.json()
    const { 
      topic, 
      grade = 8, 
      subject = 'genel',
      depth = 'intermediate',
      withHologram = true,
      language = 'tr'
    } = body
    
    if (!topic?.trim()) {
      return NextResponse.json({ error: 'Konu gerekli' }, { status: 400 })
    }
    
    // Kullanıcı profili
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, grade')
      .eq('id', user.id)
      .single()
    
    const studentName = profile?.full_name || 'Öğrenci'
    const studentGrade = profile?.grade || grade
    
    console.log(`📚 [JARVIS Teach] User: ${user.id.slice(0, 8)}... Konu: ${topic}`)
    
    // Hologramları belirle
    const holograms = getHologramsForTopic(topic)
    
    // Simülasyon öner
    const suggestedSim = suggestSimulation(topic)
    
    // Gemini modeli
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 4000
      }
    })
    
    // RAG: MEB müfredatından ilgili içerik çek (eğer varsa)
    let curriculumContext = ''
    try {
      const { data: curriculumData } = await supabase
        .from('curriculum_contents')
        .select('content, learning_outcomes')
        .ilike('topic', `%${topic}%`)
        .eq('grade', studentGrade)
        .limit(3)
      
      if (curriculumData && curriculumData.length > 0) {
        curriculumContext = `\n\nMEB MÜFREDATI REFERANSI:\n${curriculumData.map(c => c.content).join('\n')}`
      }
    } catch (e) {
      // Müfredat tablosu yoksa devam et
    }
    
    const teachPrompt = `Sen Jarvis'sin - ${studentName}'in özel ders öğretmeni.

KONU: ${topic}
SINIF: ${studentGrade}. sınıf
DERS: ${subject}
DERİNLİK: ${depth}
HOLOGRAMLAR: ${holograms.join(', ')}
${curriculumContext}

Bu konuyu öğretmek için kapsamlı bir ders planı oluştur. Her bölümde:
1. Öğrenciye doğrudan hitap eden samimi bir anlatım
2. Hologramlarla senkronize görsel açıklamalar
3. Anahtar noktalar ve formüller
4. Tahmini süre (saniye)

JSON formatında yanıt ver:
{
  "title": "Dersin başlığı",
  "introduction": "${studentName}'e hitap eden giriş cümlesi",
  "sections": [
    {
      "order": 1,
      "title": "Bölüm başlığı",
      "content": "Detaylı açıklama (3-4 paragraf)",
      "voiceScript": "Jarvis'in söyleyeceği doğal konuşma metni (TTS için)",
      "hologramScene": {
        "id": "hologram-1",
        "name": "${holograms[0] || 'default'}",
        "timing": 0,
        "animation": "rotate|pulse|highlight"
      },
      "keyPoints": ["Önemli nokta 1", "Önemli nokta 2"],
      "duration": 60
    }
  ],
  "summary": "Konu özeti (2-3 cümle)",
  "quiz": [
    {
      "question": "Test sorusu",
      "options": ["A şıkkı", "B şıkkı", "C şıkkı", "D şıkkı"],
      "correct": 0
    }
  ]
}

ÖNEMLİ:
- Her section'da farklı bir hologram kullan
- voiceScript doğal ve samimi olsun (${studentName} diye hitap et)
- Matematiksel ifadeleri $ arasında LaTeX formatında yaz
- Quiz soruları konuyla ilgili ve seviyeye uygun olsun
- Toplam 4-6 section olsun`

    const result = await model.generateContent(teachPrompt)
    const responseText = result.response.text()
    
    // JSON parse
    let teachData: any
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('JSON bulunamadı')
      teachData = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('JSON parse hatası:', parseError)
      teachData = {
        title: topic,
        introduction: `${studentName}, bugün ${topic} konusunu öğreneceğiz!`,
        sections: [{
          order: 1,
          title: topic,
          content: responseText.slice(0, 1000),
          voiceScript: `${studentName}, şimdi ${topic} konusunu birlikte inceleyelim.`,
          keyPoints: [],
          duration: 120
        }],
        summary: `${topic} konusunu öğrendik.`
      }
    }
    
    // Hologram sekansı oluştur
    const hologramSequence: HologramScene[] = (teachData.sections || []).map((section: any, idx: number) => ({
      id: `hologram-${idx + 1}`,
      name: section.hologramScene?.name || holograms[idx % holograms.length] || 'default',
      timing: (teachData.sections || []).slice(0, idx).reduce((sum: number, s: any) => sum + (s.duration || 60), 0),
      animation: section.hologramScene?.animation || 'rotate'
    }))
    
    // Toplam süre
    const totalDuration = (teachData.sections || []).reduce((sum: number, s: any) => sum + (s.duration || 60), 0)
    
    const response: TeachResponse = {
      success: true,
      topic,
      title: teachData.title || topic,
      introduction: teachData.introduction || '',
      sections: teachData.sections || [],
      summary: teachData.summary || '',
      quiz: teachData.quiz,
      totalDuration,
      hologramSequence,
      suggestedSimulation: suggestedSim || undefined
    }
    
    const duration = Date.now() - startTime
    console.log(`✅ [JARVIS Teach] Ders planı hazır: ${duration}ms, ${response.sections.length} bölüm`)
    
    return NextResponse.json(response)
    
  } catch (error: any) {
    console.error('❌ [JARVIS Teach] Hata:', error.message)
    return NextResponse.json({ 
      error: error.message,
      success: false
    }, { status: 500 })
  }
}

/**
 * GET - Mevcut konular ve hologramlar
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    availableHolograms: Object.keys(TOPIC_HOLOGRAM_MAP),
    features: [
      'Sesli konu anlatımı',
      'Hologram senkronizasyonu',
      'MEB müfredat entegrasyonu (RAG)',
      'PhET simülasyon önerisi',
      'İnteraktif quiz'
    ],
    depthLevels: ['basic', 'intermediate', 'advanced']
  })
}

/**
 * 🤖 JARVIS Soru Analiz API
 * Gemini 3 Flash Preview ile soru analizi + AI Model Seçimi
 * 
 * Input: questionText, subject, options
 * Output: jarvisScene, shape3dParams, voiceScript, steps, recommendedModelId
 */

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { JarvisSceneType, getScenesForSubject, getSceneMetadata } from '@/lib/jarvis/scenes'
import { getAllModels, getModelById, Model3D } from '@/lib/jarvis/model-registry'

export const runtime = 'nodejs'
export const maxDuration = 30

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

interface JarvisAnalyzeRequest {
  questionText: string
  subject: string
  options?: Record<string, string>
  correctAnswer?: string
  explanation?: string
  grade?: number
}

interface JarvisStep {
  order: number
  text: string
  voiceScript: string
  action?: 'show' | 'highlight' | 'animate' | 'quiz'
  params?: Record<string, any>
}

interface JarvisAnalyzeResponse {
  success: boolean
  sceneType: JarvisSceneType
  sceneParams: Record<string, any>
  steps: JarvisStep[]
  voiceIntro: string
  gestureHints: string[]
  metadata: {
    sceneName: string
    sceneIcon: string
    sceneColor: string
    estimatedDuration: number
  }
  // 🎯 AI Model Seçimi
  recommendedModelId: string | null
  modelReason?: string
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body: JarvisAnalyzeRequest = await request.json()
    const { questionText, subject, options, correctAnswer, explanation, grade } = body

    if (!questionText || !subject) {
      return NextResponse.json({ 
        success: false, 
        error: 'questionText ve subject gerekli' 
      }, { status: 400 })
    }

    // Ders için uygun sahneleri al
    const availableScenes = getScenesForSubject(subject)
    
    // 🎯 33 Model Listesini hazırla
    const allModels = getAllModels()
    const modelListForPrompt = allModels.map(m => 
      `- ${m.id}: ${m.name} (${m.category}) - ${m.description}`
    ).join('\n')
    
    // Gemini 3 Flash Preview ile analiz (beyin işi)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3-flash-preview',
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2000,
      }
    })

    const prompt = `Sen bir eğitim içeriği analizcisisin. Verilen soruyu analiz et ve interaktif 3D sahne için parametreleri çıkar.

SORU:
${questionText}

${options ? `ŞIKLAR:\n${Object.entries(options).map(([k, v]) => `${k}) ${v}`).join('\n')}` : ''}
${correctAnswer ? `DOĞRU CEVAP: ${correctAnswer}` : ''}
${explanation ? `AÇIKLAMA: ${explanation}` : ''}

DERS: ${subject}
${grade ? `SINIF: ${grade}. sınıf` : ''}

KULLANILABILIR SAHNELER: ${availableScenes.join(', ')}

🎯 KULLANILABILIR 3D MODELLER (33 adet):
${modelListForPrompt}

GÖREV:
1. Bu soru için en uygun sahne tipini seç
2. Sahne parametrelerini çıkar (örn: üçgen için base, height; daire için radius)
3. Adım adım çözüm oluştur (her adım için sesli anlatım scripti)
4. Her adımda öğrencinin yapacağı el hareketini belirt
5. 🎯 YENİ: Soruyu görsel olarak en iyi temsil edecek 3D modeli seç

JSON formatında yanıt ver:
{
  "sceneType": "triangle|square|circle|atom|timeline|...",
  "sceneParams": {
    // Sahne tipine göre parametreler
    // triangle: { "base": 5, "height": 3 }
    // circle: { "radius": 4 }
    // atom: { "element": "C", "protons": 6, "neutrons": 6, "electrons": 6 }
    // timeline: { "events": [{"year": 1923, "title": "Cumhuriyet"}] }
  },
  "steps": [
    {
      "order": 1,
      "text": "Ekranda gösterilecek metin",
      "voiceScript": "Teknoöğretmen'in söyleyeceği doğal konuşma metni",
      "action": "show|highlight|animate|quiz",
      "params": {} // Adıma özel parametreler
    }
  ],
  "voiceIntro": "Merhaba! Bu soruda birlikte bir üçgenin alanını hesaplayacağız...",
  "recommendedModelId": "model-id-buraya",
  "modelReason": "Bu modeli seçme sebebi (kısa)"
}

ÖNEMLİ:
- voiceScript doğal, samimi ve öğretici olmalı
- Öğrenciye "elini şuraya götür", "pinch yaparak büyüt" gibi yönlendirmeler ekle
- Adımlar kısa ve anlaşılır olmalı (max 3-5 adım)
- recommendedModelId: Listeden en uygun modelin ID'si (örn: "brain", "ferrari", "mosquito")
- Eğer hiçbir model uymuyorsa recommendedModelId: null yaz
- Sadece JSON döndür, başka açıklama ekleme`

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    
    // JSON parse
    let parsed: any
    try {
      // JSON bloğunu çıkar
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('JSON bulunamadı')
      parsed = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('JSON parse hatası:', parseError)
      // Fallback: basit sahne
      parsed = {
        sceneType: availableScenes[0] || 'stepByStep',
        sceneParams: {},
        steps: [{
          order: 1,
          text: 'Çözüm adımları yükleniyor...',
          voiceScript: 'Bu soruyu birlikte çözelim.',
          action: 'show'
        }],
        voiceIntro: 'Merhaba! Şimdi bu soruyu birlikte çözelim.'
      }
    }

    // Sahne metadata'sını al
    const sceneType = parsed.sceneType as JarvisSceneType
    const sceneMeta = getSceneMetadata(sceneType)
    
    // 🎯 AI'ın önerdiği modeli doğrula
    let recommendedModelId = parsed.recommendedModelId || null
    const modelReason = parsed.modelReason || ''
    
    // Model ID'sinin geçerli olduğunu kontrol et
    if (recommendedModelId && !getModelById(recommendedModelId)) {
      console.warn(`⚠️ AI geçersiz model önerdi: ${recommendedModelId}, fallback kullanılacak`)
      recommendedModelId = null
    }

    const response: JarvisAnalyzeResponse = {
      success: true,
      sceneType,
      sceneParams: parsed.sceneParams || {},
      steps: parsed.steps || [],
      voiceIntro: parsed.voiceIntro || 'Merhaba! Bu soruyu birlikte çözelim.',
      gestureHints: sceneMeta.gestures,
      metadata: {
        sceneName: sceneMeta.name,
        sceneIcon: sceneMeta.icon,
        sceneColor: sceneMeta.color,
        estimatedDuration: (parsed.steps?.length || 1) * 15 // Her adım ~15 saniye
      },
      // 🎯 AI Model Seçimi
      recommendedModelId,
      modelReason
    }

    console.log(`✅ Jarvis analiz tamamlandı: ${Date.now() - startTime}ms, sahne: ${sceneType}, model: ${recommendedModelId || 'yok'}`)

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('❌ Jarvis analiz hatası:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Analiz başarısız'
    }, { status: 500 })
  }
}

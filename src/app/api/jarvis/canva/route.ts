/**
 * 🎨 JARVIS Canva API
 * 
 * Canva Connect API ile eğitim materyali oluşturma
 * - İnfografikler
 * - Sertifikalar
 * - Çalışma materyalleri
 * - Flash kartlar
 * 
 * NOT: Canva API entegrasyonu için OAuth 2.0 gerekli
 * Bu dosya mock/placeholder - gerçek entegrasyon için Canva Developer hesabı gerekli
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface CanvaRequest {
  type: 'infographic' | 'certificate' | 'poster' | 'flashcard' | 'mindmap'
  data: {
    title?: string
    topic?: string
    studentName?: string
    score?: number
    date?: string
    keyPoints?: string[]
    content?: string[]
  }
}

interface CanvaResponse {
  success: boolean
  designId?: string
  previewUrl?: string
  editUrl?: string
  downloadUrl?: string
  message?: string
}

// Template ID'leri (Canva'dan alınacak)
const CANVA_TEMPLATES = {
  infographic: {
    education: 'template_infographic_edu_001',
    science: 'template_infographic_sci_001',
    math: 'template_infographic_math_001'
  },
  certificate: {
    achievement: 'template_cert_achievement_001',
    completion: 'template_cert_completion_001',
    excellence: 'template_cert_excellence_001'
  },
  poster: {
    formula: 'template_poster_formula_001',
    summary: 'template_poster_summary_001',
    mindmap: 'template_poster_mindmap_001'
  },
  flashcard: {
    vocab: 'template_flashcard_vocab_001',
    formula: 'template_flashcard_formula_001',
    concept: 'template_flashcard_concept_001'
  }
}

// Mock Canva API çağrısı
async function createCanvaDesign(
  templateId: string,
  variables: Record<string, string>
): Promise<{ designId: string; urls: { preview: string; edit: string; download: string } }> {
  // Gerçek implementasyonda:
  // const canva = new CanvaConnectAPI({ apiKey: process.env.CANVA_API_KEY })
  // const design = await canva.designs.create({ template: templateId, variables })
  // return { designId: design.id, urls: design.urls }
  
  // Mock response
  const mockDesignId = `design_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  
  return {
    designId: mockDesignId,
    urls: {
      preview: `https://canva.com/preview/${mockDesignId}`,
      edit: `https://canva.com/edit/${mockDesignId}`,
      download: `https://canva.com/download/${mockDesignId}`
    }
  }
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
    
    // Canva API key kontrolü
    const canvaApiKey = process.env.CANVA_API_KEY
    if (!canvaApiKey) {
      // Mock mode - gerçek API olmadan çalış
      console.log('⚠️ [JARVIS Canva] API key yok, mock mode aktif')
    }
    
    const body: CanvaRequest = await request.json()
    const { type, data } = body
    
    if (!type || !data) {
      return NextResponse.json({ error: 'type ve data gerekli' }, { status: 400 })
    }
    
    console.log(`🎨 [JARVIS Canva] User: ${user.id.slice(0, 8)}... Tip: ${type}`)
    
    let result: CanvaResponse = { success: false }
    
    switch (type) {
      case 'infographic': {
        // İnfografik oluştur
        const templateId = CANVA_TEMPLATES.infographic.education
        const variables = {
          TITLE: data.title || data.topic || 'Konu Özeti',
          POINT_1: data.keyPoints?.[0] || '',
          POINT_2: data.keyPoints?.[1] || '',
          POINT_3: data.keyPoints?.[2] || '',
          POINT_4: data.keyPoints?.[3] || '',
          POINT_5: data.keyPoints?.[4] || '',
          FOOTER: `${data.studentName || 'Öğrenci'} - ${data.date || new Date().toLocaleDateString('tr-TR')}`
        }
        
        const design = await createCanvaDesign(templateId, variables)
        
        result = {
          success: true,
          designId: design.designId,
          previewUrl: design.urls.preview,
          editUrl: design.urls.edit,
          downloadUrl: design.urls.download,
          message: `${data.topic || 'Konu'} infografiği hazır!`
        }
        break
      }
      
      case 'certificate': {
        // Sertifika oluştur
        const templateId = CANVA_TEMPLATES.certificate.achievement
        const variables = {
          STUDENT_NAME: data.studentName || 'Öğrenci',
          TOPIC: data.topic || 'Konu',
          SCORE: `${data.score || 100}%`,
          DATE: data.date || new Date().toLocaleDateString('tr-TR'),
          ISSUER: 'Jarvis AI Tutor - Teknokul'
        }
        
        const design = await createCanvaDesign(templateId, variables)
        
        result = {
          success: true,
          designId: design.designId,
          previewUrl: design.urls.preview,
          editUrl: design.urls.edit,
          downloadUrl: design.urls.download,
          message: `Tebrikler ${data.studentName}! Sertifikanız hazır.`
        }
        break
      }
      
      case 'poster': {
        // Poster/Özet kartı
        const templateId = CANVA_TEMPLATES.poster.summary
        const variables = {
          TITLE: data.title || data.topic || 'Konu Özeti',
          CONTENT: data.content?.join('\n\n') || data.keyPoints?.join('\n• ') || '',
          FOOTER: `Jarvis AI Tutor | ${new Date().toLocaleDateString('tr-TR')}`
        }
        
        const design = await createCanvaDesign(templateId, variables)
        
        result = {
          success: true,
          designId: design.designId,
          previewUrl: design.urls.preview,
          editUrl: design.urls.edit,
          downloadUrl: design.urls.download,
          message: 'Poster hazır!'
        }
        break
      }
      
      case 'flashcard': {
        // Flash kart seti
        const templateId = CANVA_TEMPLATES.flashcard.concept
        const variables = {
          TITLE: data.title || 'Flash Kart',
          FRONT: data.content?.[0] || data.topic || 'Soru',
          BACK: data.content?.[1] || data.keyPoints?.join('\n') || 'Cevap'
        }
        
        const design = await createCanvaDesign(templateId, variables)
        
        result = {
          success: true,
          designId: design.designId,
          previewUrl: design.urls.preview,
          editUrl: design.urls.edit,
          downloadUrl: design.urls.download,
          message: 'Flash kart hazır!'
        }
        break
      }
      
      case 'mindmap': {
        // Mind map / Kavram haritası
        const templateId = CANVA_TEMPLATES.poster.mindmap
        const variables = {
          CENTER: data.topic || 'Ana Konu',
          BRANCH_1: data.keyPoints?.[0] || '',
          BRANCH_2: data.keyPoints?.[1] || '',
          BRANCH_3: data.keyPoints?.[2] || '',
          BRANCH_4: data.keyPoints?.[3] || '',
          BRANCH_5: data.keyPoints?.[4] || ''
        }
        
        const design = await createCanvaDesign(templateId, variables)
        
        result = {
          success: true,
          designId: design.designId,
          previewUrl: design.urls.preview,
          editUrl: design.urls.edit,
          downloadUrl: design.urls.download,
          message: 'Kavram haritası hazır!'
        }
        break
      }
      
      default:
        result = {
          success: false,
          message: `Bilinmeyen tasarım tipi: ${type}`
        }
    }
    
    // Oluşturulan tasarımı kaydet (isteğe bağlı)
    if (result.success && result.designId) {
      try {
        await supabase.from('jarvis_designs').insert({
          user_id: user.id,
          design_id: result.designId,
          type,
          topic: data.topic,
          preview_url: result.previewUrl,
          created_at: new Date().toISOString()
        })
      } catch (e) {
        // Tablo yoksa geç
      }
    }
    
    const duration = Date.now() - startTime
    console.log(`✅ [JARVIS Canva] Tasarım oluşturuldu: ${duration}ms, ID: ${result.designId}`)
    
    return NextResponse.json({
      ...result,
      duration
    })
    
  } catch (error: any) {
    console.error('❌ [JARVIS Canva] Hata:', error.message)
    return NextResponse.json({ 
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

/**
 * GET - Canva özellikleri ve şablonlar
 */
export async function GET() {
  const hasApiKey = !!process.env.CANVA_API_KEY
  
  return NextResponse.json({
    success: true,
    configured: hasApiKey,
    mode: hasApiKey ? 'live' : 'mock',
    designTypes: [
      {
        type: 'infographic',
        name: 'İnfografik',
        description: 'Konu özetleri ve görsel açıklamalar',
        requiredData: ['topic', 'keyPoints']
      },
      {
        type: 'certificate',
        name: 'Sertifika',
        description: 'Başarı belgeleri ve onay sertifikaları',
        requiredData: ['studentName', 'topic', 'score']
      },
      {
        type: 'poster',
        name: 'Poster',
        description: 'Formül kartları ve özet afişler',
        requiredData: ['title', 'content']
      },
      {
        type: 'flashcard',
        name: 'Flash Kart',
        description: 'Soru-cevap kartları',
        requiredData: ['title', 'content']
      },
      {
        type: 'mindmap',
        name: 'Kavram Haritası',
        description: 'Konu dallanma haritaları',
        requiredData: ['topic', 'keyPoints']
      }
    ],
    templates: CANVA_TEMPLATES
  })
}

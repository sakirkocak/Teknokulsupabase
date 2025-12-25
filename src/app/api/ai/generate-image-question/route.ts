import { NextRequest, NextResponse } from 'next/server'
import { 
  generateImageQuestion, 
  generateCompleteImageQuestion,
  generateEducationalImage,
  Difficulty 
} from '@/lib/gemini'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Görüntü üretimi zaman alabilir

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      grade, 
      subject, 
      topic, 
      imageType, 
      imageDescription, // Artık optional - AI otomatik üretebilir
      difficulty,
      generateImage = true // Görüntü de üretilsin mi
    } = body

    // Validasyon - imageDescription artık zorunlu DEĞİL
    if (!grade || !subject || !topic || !imageType) {
      return NextResponse.json(
        { error: 'Sınıf, ders, konu ve görüntü tipi gerekli' },
        { status: 400 }
      )
    }

    // Görüntülü soru üret
    let question
    
    if (generateImage) {
      // Görüntü ile birlikte üret (imageDescription optional)
      question = await generateCompleteImageQuestion(
        Number(grade),
        subject,
        topic,
        imageType,
        (difficulty || 'medium') as Difficulty,
        imageDescription // undefined olabilir, AI üretecek
      )
    } else {
      // Sadece soru metni ve prompt üret (görüntü yok)
      question = await generateImageQuestion(
        Number(grade),
        subject,
        topic,
        imageType,
        imageDescription, // undefined olabilir, AI üretecek
        (difficulty || 'medium') as Difficulty
      )
    }

    return NextResponse.json({ 
      success: true,
      question 
    })

  } catch (error: any) {
    console.error('Generate image question error:', error)
    return NextResponse.json(
      { error: error.message || 'Görüntülü soru üretme hatası' },
      { status: 500 }
    )
  }
}

// Sadece görüntü üretmek için GET endpoint
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const prompt = searchParams.get('prompt')

    if (!prompt) {
      return NextResponse.json(
        { error: 'Görüntü açıklaması (prompt) gerekli' },
        { status: 400 }
      )
    }

    const imageResult = await generateEducationalImage(prompt)

    if (!imageResult) {
      return NextResponse.json(
        { error: 'Görüntü üretilemedi' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      image: `data:${imageResult.mimeType};base64,${imageResult.base64}`
    })

  } catch (error: any) {
    console.error('Generate image error:', error)
    return NextResponse.json(
      { error: error.message || 'Görüntü üretme hatası' },
      { status: 500 }
    )
  }
}


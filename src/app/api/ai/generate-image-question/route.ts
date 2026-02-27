import { NextRequest, NextResponse } from 'next/server'
import {
  generateImageQuestion,
  generateCompleteImageQuestion,
  generateEducationalImage,
  Difficulty
} from '@/lib/gemini'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      grade,
      subject,
      topic,
      imageType,
      imageDescription,
      difficulty,
      generateImage = true,
      examMode = null,        // TYT | AYT | KPSS | DGS | ALES | null
    } = body

    // examMode varsa grade zorunlu değil
    if (!subject || !topic || !imageType) {
      return NextResponse.json(
        { error: 'Ders, konu ve görüntü tipi gerekli' },
        { status: 400 }
      )
    }

    if (!examMode && !grade) {
      return NextResponse.json(
        { error: 'Sınıf veya sınav modu gerekli' },
        { status: 400 }
      )
    }

    const effectiveGrade = examMode ? 11 : Number(grade) // examMode varsa lise seviyesi

    let question

    if (generateImage) {
      question = await generateCompleteImageQuestion(
        effectiveGrade,
        subject,
        topic,
        imageType,
        (difficulty || 'medium') as Difficulty,
        imageDescription,
        examMode
      )
    } else {
      question = await generateImageQuestion(
        effectiveGrade,
        subject,
        topic,
        imageType,
        imageDescription,
        (difficulty || 'medium') as Difficulty,
        examMode
      )
    }

    return NextResponse.json({ success: true, question })

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
      return NextResponse.json({ error: 'Görüntü açıklaması (prompt) gerekli' }, { status: 400 })
    }

    const imageResult = await generateEducationalImage(prompt)

    if (!imageResult) {
      return NextResponse.json({ error: 'Görüntü üretilemedi' }, { status: 500 })
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

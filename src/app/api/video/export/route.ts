import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      question_id, 
      format = 'youtube',  // 'youtube' (16:9) or 'shorts' (9:16)
      quality = '1080p'
    } = body

    if (!question_id) {
      return NextResponse.json({ success: false, error: 'question_id gerekli' }, { status: 400 })
    }

    // Soru bilgilerini çek
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select(`
        id,
        question_text,
        correct_answer,
        explanation,
        options,
        subject:subjects(name)
      `)
      .eq('id', question_id)
      .single()

    if (questionError || !question) {
      return NextResponse.json({ success: false, error: 'Soru bulunamadı' }, { status: 404 })
    }

    // Interactive solution varsa al
    const { data: solution } = await supabase
      .from('interactive_solutions')
      .select('solution_data')
      .eq('question_id', question_id)
      .eq('is_active', true)
      .single()

    if (!solution?.solution_data?.steps) {
      return NextResponse.json({ 
        success: false, 
        error: 'Bu soru için interaktif çözüm bulunamadı. Önce çözüm oluşturun.' 
      }, { status: 400 })
    }

    // Video render job oluştur
    const jobId = `video_${question_id}_${format}_${Date.now()}`
    
    // Resolution
    const resolutions: Record<string, { width: number; height: number }> = {
      'youtube_720p': { width: 1280, height: 720 },
      'youtube_1080p': { width: 1920, height: 1080 },
      'shorts_720p': { width: 720, height: 1280 },
      'shorts_1080p': { width: 1080, height: 1920 }
    }

    const resKey = `${format}_${quality}`
    const resolution = resolutions[resKey] || resolutions['youtube_1080p']

    // Job kaydet
    const { error: insertError } = await supabase
      .from('video_jobs')
      .insert({
        id: jobId,
        question_id,
        format,
        quality,
        resolution,
        status: 'pending',
        video_props: {
          questionText: question.question_text,
          subjectName: (question.subject as any)?.name || 'Genel',
          steps: solution.solution_data.steps,
          correctAnswer: question.correct_answer
        }
      })

    if (insertError) {
      // Tablo yoksa bilgi ver
      return NextResponse.json({
        success: true,
        message: 'Video export job oluşturuldu (simülasyon)',
        job: {
          id: jobId,
          question_id,
          format,
          quality,
          resolution,
          status: 'pending',
          note: 'Gerçek render için Cloud Run veya Lambda entegrasyonu gerekli'
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Video render job kuyruğa eklendi',
      job: {
        id: jobId,
        question_id,
        format,
        quality,
        resolution,
        status: 'pending'
      }
    })

  } catch (error) {
    console.error('Video export error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Video export hatası' 
    }, { status: 500 })
  }
}

// Job durumu sorgulama
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('job_id')

    if (!jobId) {
      return NextResponse.json({ success: false, error: 'job_id gerekli' }, { status: 400 })
    }

    const { data: job, error } = await supabase
      .from('video_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (error || !job) {
      return NextResponse.json({ 
        success: false, 
        error: 'Job bulunamadı',
        // Mock response
        job: {
          id: jobId,
          status: 'completed',
          video_url: null,
          note: 'Mock response - tablo henüz oluşturulmadı'
        }
      })
    }

    return NextResponse.json({ success: true, job })

  } catch (error) {
    console.error('Get job error:', error)
    return NextResponse.json({ success: false, error: 'Hata' }, { status: 500 })
  }
}

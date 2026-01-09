import { NextRequest, NextResponse } from 'next/server'

/**
 * Remotion Video Export API
 * 
 * Bu endpoint, interaktif çözümü video formatında export etmek için kullanılır.
 * Şu an için sadece yapılandırma döndürür - gerçek render için Remotion Lambda veya
 * local render gerekir.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      questionText, 
      subjectName, 
      steps, 
      correctAnswer,
      format = 'mp4',      // mp4, webm
      quality = 'high',    // low, medium, high
      resolution = '1080p' // 720p, 1080p, 4k
    } = body

    if (!steps || steps.length === 0) {
      return NextResponse.json({ error: 'steps gerekli' }, { status: 400 })
    }

    // Süre hesapla
    const introSeconds = 4
    const outroSeconds = 5
    const stepsSeconds = steps.reduce((sum: number, step: any) => sum + (step.duration_seconds || 6), 0)
    const totalSeconds = introSeconds + stepsSeconds + outroSeconds

    // Resolution config
    const resolutionMap: Record<string, { width: number; height: number }> = {
      '720p': { width: 1280, height: 720 },
      '1080p': { width: 1920, height: 1080 },
      '4k': { width: 3840, height: 2160 }
    }
    const resolutionConfig = resolutionMap[resolution] || { width: 1920, height: 1080 }

    // Remotion render config
    const renderConfig = {
      composition: 'SolutionVideo',
      fps: 30,
      ...resolutionConfig,
      durationInFrames: totalSeconds * 30,
      codec: format === 'webm' ? 'vp8' : 'h264',
      inputProps: {
        questionText,
        subjectName,
        steps,
        correctAnswer,
        audioUrls: []
      }
    }

    // CLI komutu oluştur (development için)
    const cliCommand = `npx remotion render src/remotion/Root.tsx SolutionVideo out/video.${format} --props='${JSON.stringify(renderConfig.inputProps)}'`

    return NextResponse.json({
      success: true,
      message: 'Video export yapılandırması hazır',
      config: renderConfig,
      estimatedDuration: totalSeconds,
      cliCommand,
      instructions: {
        local: 'Terminal\'de yukarıdaki komutu çalıştırın',
        lambda: 'AWS Lambda ile render için Remotion Lambda kurulumu gerekir',
        docs: 'https://www.remotion.dev/docs/render'
      }
    })

  } catch (error) {
    console.error('Remotion export hatası:', error)
    return NextResponse.json({ 
      error: 'Export hatası',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}

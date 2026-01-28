import { NextRequest, NextResponse } from 'next/server'
import { generateStudyPlan } from '@/lib/gemini'
import { withAIProtection } from '@/lib/ai-middleware'

export async function POST(request: NextRequest) {
  try {
    // Auth + Rate limit
    const protection = await withAIProtection(request, 'generate-plan')
    if (!protection.allowed) return protection.response!

    const body = await request.json()
    const { studentName, gradeLevel, targetExam, weakSubjects, strongSubjects, hoursPerDay, weeks } = body

    if (!studentName || !gradeLevel || !targetExam) {
      return NextResponse.json(
        { error: 'Öğrenci bilgileri gerekli' },
        { status: 400 }
      )
    }

    const plan = await generateStudyPlan(
      studentName,
      gradeLevel,
      targetExam,
      weakSubjects || [],
      strongSubjects || [],
      Math.min(hoursPerDay || 4, 16),
      Math.min(weeks || 4, 52)
    )

    return NextResponse.json({ plan })
  } catch (error: any) {
    console.error('Generate plan error:', error)
    return NextResponse.json(
      { error: error.message || 'Plan oluşturma hatası' },
      { status: 500 }
    )
  }
}

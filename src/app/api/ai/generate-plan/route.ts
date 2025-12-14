import { NextRequest, NextResponse } from 'next/server'
import { generateStudyPlan } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
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
      hoursPerDay || 4,
      weeks || 4
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






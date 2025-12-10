import { NextRequest, NextResponse } from 'next/server'
import { generateStudentReport } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentName, gradeLevel, targetExam, performanceData, taskData } = body

    if (!studentName) {
      return NextResponse.json(
        { error: 'Öğrenci bilgileri gerekli' },
        { status: 400 }
      )
    }

    const report = await generateStudentReport(
      studentName,
      gradeLevel || 'Belirtilmemiş',
      targetExam || 'Belirtilmemiş',
      performanceData,
      taskData
    )

    return NextResponse.json({ report })
  } catch (error: any) {
    console.error('Generate report error:', error)
    return NextResponse.json(
      { error: error.message || 'Rapor oluşturma hatası' },
      { status: 500 }
    )
  }
}



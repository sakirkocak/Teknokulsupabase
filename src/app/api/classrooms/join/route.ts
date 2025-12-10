import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Yetkilendirme gerekli' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { joinCode } = body

    if (!joinCode) {
      return NextResponse.json(
        { error: 'Sınıf kodu gerekli' },
        { status: 400 }
      )
    }

    // Öğrenci profilini bul
    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('id, full_name')
      .eq('user_id', user.id)
      .single()

    if (!studentProfile) {
      return NextResponse.json(
        { error: 'Öğrenci profili bulunamadı' },
        { status: 404 }
      )
    }

    // Sınıfı bul
    const { data: classroom, error: classroomError } = await supabase
      .from('classrooms')
      .select('id, name, coach_id')
      .eq('join_code', joinCode.toUpperCase())
      .eq('is_active', true)
      .single()

    if (classroomError || !classroom) {
      return NextResponse.json(
        { error: 'Geçersiz sınıf kodu' },
        { status: 404 }
      )
    }

    // Zaten katılmış mı kontrol et
    const { data: existingStudent } = await supabase
      .from('classroom_students')
      .select('id, status')
      .eq('classroom_id', classroom.id)
      .eq('student_id', studentProfile.id)
      .single()

    if (existingStudent) {
      if (existingStudent.status === 'joined') {
        return NextResponse.json(
          { error: 'Bu sınıfa zaten katıldınız' },
          { status: 400 }
        )
      }
      
      await supabase
        .from('classroom_students')
        .update({ 
          status: 'joined', 
          joined_at: new Date().toISOString() 
        })
        .eq('id', existingStudent.id)

      return NextResponse.json({
        success: true,
        message: `${classroom.name} sınıfına katıldınız!`,
        classroomId: classroom.id
      })
    }

    const { error: insertError } = await supabase
      .from('classroom_students')
      .insert({
        classroom_id: classroom.id,
        student_id: studentProfile.id,
        student_name: studentProfile.full_name,
        status: 'joined',
        joined_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Katılım hatası:', insertError)
      return NextResponse.json(
        { error: 'Sınıfa katılırken bir hata oluştu' },
        { status: 500 }
      )
    }

    const { data: coach } = await supabase
      .from('teacher_profiles')
      .select('user_id')
      .eq('id', classroom.coach_id)
      .single()

    if (coach) {
      await supabase.from('notifications').insert({
        user_id: coach.user_id,
        title: 'Yeni Öğrenci Katıldı',
        message: `${studentProfile.full_name} "${classroom.name}" sınıfına katıldı.`,
        type: 'classroom'
      })
    }

    return NextResponse.json({
      success: true,
      message: `${classroom.name} sınıfına katıldınız!`,
      classroomId: classroom.id
    })

  } catch (error: any) {
    console.error('Sınıf katılım hatası:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}


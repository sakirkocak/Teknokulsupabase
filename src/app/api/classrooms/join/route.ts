import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('API - Auth result:', { user: user?.id, email: user?.email, authError })

    if (!user) {
      return NextResponse.json(
        { error: 'Yetkilendirme gerekli', details: authError?.message },
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
    let { data: studentProfile, error: profileError } = await supabase
      .from('student_profiles')
      .select('id, user_id')
      .eq('user_id', user.id)
      .single()

    console.log('API - Student profile:', { studentProfile, profileError, userId: user.id })

    // Profil yoksa otomatik oluştur
    if (!studentProfile) {
      // Önce profiles'dan ismi al
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      const { data: newProfile, error: createError } = await supabase
        .from('student_profiles')
        .insert({
          user_id: user.id,
          grade_level: '11. Sınıf',
          target_exam: 'TYT'
        })
        .select('id, user_id')
        .single()

      if (createError) {
        console.log('API - Profile create error:', createError)
        return NextResponse.json(
          { error: 'Öğrenci profili oluşturulamadı', details: createError.message },
          { status: 500 }
        )
      }

      console.log('API - Created new profile:', newProfile)
      studentProfile = newProfile
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

    // Kullanıcı adını al
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const studentName = userProfile?.full_name || user.email?.split('@')[0] || 'Öğrenci'

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
        student_name: studentName,
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

    // Öğrenci ismini al
    const { data: studentUser } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const { data: coach } = await supabase
      .from('teacher_profiles')
      .select('user_id')
      .eq('id', classroom.coach_id)
      .single()

    if (coach) {
      await supabase.from('notifications').insert({
        user_id: coach.user_id,
        title: 'Yeni Öğrenci Katıldı',
        message: `${studentUser?.full_name || 'Bir öğrenci'} "${classroom.name}" sınıfına katıldı.`,
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


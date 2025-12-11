import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { findMatchingStudent } from '@/lib/utils'

// Admin client - email confirmation bypass için
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { joinCode, email, password, fullName, existingUserId } = body

    // 1. Sınıfı bul
    const { data: classroom, error: classroomError } = await supabaseAdmin
      .from('classrooms')
      .select('id, name, coach_id')
      .eq('join_code', joinCode)
      .eq('is_active', true)
      .single()

    if (classroomError || !classroom) {
      return NextResponse.json({ error: 'Geçersiz sınıf kodu' }, { status: 404 })
    }

    let userId: string
    let studentName: string

    // 2. Kullanıcı zaten varsa veya yeni kayıt
    if (existingUserId) {
      // Mevcut kullanıcı
      userId = existingUserId
      
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single()
      
      studentName = profile?.full_name || 'Öğrenci'
    } else {
      // Yeni kullanıcı kaydı - EMAIL DOĞRULAMA KAPALI
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Otomatik doğrula
        user_metadata: {
          full_name: fullName
        }
      })

      if (authError) {
        if (authError.message.includes('already')) {
          return NextResponse.json({ error: 'Bu email zaten kayıtlı. Giriş yaparak katılabilirsiniz.' }, { status: 400 })
        }
        return NextResponse.json({ error: authError.message }, { status: 400 })
      }

      userId = authData.user.id
      studentName = fullName

      // Profil oluştur
      await supabaseAdmin.from('profiles').insert({
        id: userId,
        email,
        full_name: fullName,
        role: 'ogrenci'
      })

      // Student profile oluştur
      await supabaseAdmin.from('student_profiles').insert({
        user_id: userId,
        grade_level: '11. Sınıf',
        target_exam: 'TYT'
      })
    }

    // 3. Student profile ID'sini al
    const { data: studentProfile } = await supabaseAdmin
      .from('student_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!studentProfile) {
      // Student profile yoksa oluştur
      const { data: newProfile } = await supabaseAdmin
        .from('student_profiles')
        .insert({
          user_id: userId,
          grade_level: '11. Sınıf',
          target_exam: 'TYT'
        })
        .select('id')
        .single()
      
      if (!newProfile) {
        return NextResponse.json({ error: 'Öğrenci profili oluşturulamadı' }, { status: 500 })
      }
    }

    const studentProfileId = studentProfile?.id || (await supabaseAdmin
      .from('student_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()).data?.id

    // 4. Bekleyenler listesinde eşleşme ara
    const { data: pendingStudents } = await supabaseAdmin
      .from('classroom_students')
      .select('id, student_name')
      .eq('classroom_id', classroom.id)
      .eq('status', 'pending')
      .is('student_id', null)

    const matchedStudent = pendingStudents 
      ? findMatchingStudent(studentName, pendingStudents)
      : null

    // 5. Sınıfa katıl
    if (matchedStudent) {
      // Bekleyen öğrenciyi güncelle
      await supabaseAdmin
        .from('classroom_students')
        .update({
          student_id: studentProfileId,
          status: 'joined',
          joined_at: new Date().toISOString()
        })
        .eq('id', matchedStudent.id)
    } else {
      // Zaten kayıtlı mı kontrol et
      const { data: existing } = await supabaseAdmin
        .from('classroom_students')
        .select('id')
        .eq('classroom_id', classroom.id)
        .eq('student_id', studentProfileId)
        .single()

      if (existing) {
        return NextResponse.json({ 
          success: true, 
          message: 'Zaten bu sınıfta kayıtlısınız',
          classroomName: classroom.name 
        })
      }

      // Yeni kayıt olarak ekle
      await supabaseAdmin
        .from('classroom_students')
        .insert({
          classroom_id: classroom.id,
          student_id: studentProfileId,
          student_name: studentName,
          student_number: '',
          status: 'joined',
          joined_at: new Date().toISOString()
        })
    }

    // 6. Öğretmene bildirim gönder
    const { data: coach } = await supabaseAdmin
      .from('teacher_profiles')
      .select('user_id')
      .eq('id', classroom.coach_id)
      .single()

    if (coach) {
      await supabaseAdmin.from('notifications').insert({
        user_id: coach.user_id,
        title: 'Yeni Öğrenci Katıldı',
        message: `${studentName} "${classroom.name}" sınıfına katıldı`,
        type: 'classroom'
      })
    }

    return NextResponse.json({
      success: true,
      message: matchedStudent 
        ? `Hoş geldiniz! "${matchedStudent.student_name}" olarak eşleştirildiniz.`
        : 'Sınıfa başarıyla katıldınız!',
      classroomName: classroom.name,
      isNewUser: !existingUserId
    })

  } catch (error: any) {
    console.error('Davet linki hatası:', error)
    return NextResponse.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }
}


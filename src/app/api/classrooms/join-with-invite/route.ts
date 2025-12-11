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
      // Yeni kullanıcı kaydı
      console.log('Yeni kullanıcı oluşturuluyor:', { email, fullName })
      
      // Önce admin.createUser dene
      let authData: any = null
      let authError: any = null
      
      try {
        const result = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName
          }
        })
        authData = result.data
        authError = result.error
        console.log('Admin createUser sonucu:', { user: authData?.user?.id, error: authError })
      } catch (e: any) {
        console.error('Admin API exception:', e)
        authError = { message: e.message || 'Admin API hatası' }
      }

      // Admin API başarısız olduysa, normal signUp dene
      if (authError || !authData?.user) {
        console.log('Admin API başarısız, normal signUp deneniyor...')
        
        const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName
            }
          }
        })
        
        console.log('SignUp sonucu:', { user: signUpData?.user?.id, error: signUpError })
        
        if (signUpError) {
          if (signUpError.message.includes('already') || signUpError.message.includes('duplicate')) {
            return NextResponse.json({ error: 'Bu email zaten kayıtlı. Giriş yaparak katılabilirsiniz.' }, { status: 400 })
          }
          return NextResponse.json({ error: `Kayıt hatası: ${signUpError.message}` }, { status: 400 })
        }
        
        if (!signUpData?.user) {
          return NextResponse.json({ error: 'Kullanıcı oluşturulamadı' }, { status: 500 })
        }
        
        authData = signUpData
      }

      userId = authData.user.id
      studentName = fullName

      // Profil kontrolü - trigger zaten oluşturmuş olabilir
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()
      
      if (!existingProfile) {
        const { error: profileError } = await supabaseAdmin.from('profiles').insert({
          id: userId,
          email,
          full_name: fullName,
          role: 'ogrenci'
        })
        
        if (profileError) {
          console.error('Profil oluşturma hatası:', profileError)
        }
      } else {
        // Profil varsa güncelle
        await supabaseAdmin.from('profiles').update({
          full_name: fullName,
          role: 'ogrenci'
        }).eq('id', userId)
      }

      // Student profile kontrolü
      const { data: existingStudentProfile } = await supabaseAdmin
        .from('student_profiles')
        .select('id')
        .eq('user_id', userId)
        .single()
      
      if (!existingStudentProfile) {
        const { error: studentProfileError } = await supabaseAdmin.from('student_profiles').insert({
          user_id: userId,
          grade_level: '11. Sınıf',
          target_exam: 'TYT'
        })
        
        if (studentProfileError) {
          console.error('Öğrenci profili oluşturma hatası:', studentProfileError)
        }
      }
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


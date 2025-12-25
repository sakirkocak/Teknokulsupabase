import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 1. Mevcut kullanıcıyı al
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', authError }, { status: 401 })
    }

    // 2. Profile bilgisi
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // 3. Teacher profile (eğer koç ise)
    const { data: teacherProfile, error: teacherError } = await supabase
      .from('teacher_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // 4. Student profile (eğer öğrenci ise)
    const { data: studentProfile, error: studentError } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // 5. Tüm coaching relationships (admin bakışıyla - RLS bypass)
    // NOT: Bu sadece debug için, normal kullanıcı göremez
    const { data: allRelationships, error: relError } = await supabase
      .from('coaching_relationships')
      .select('*')

    // 6. Bu koçun ilişkileri (eğer koç ise)
    let coachRelationships = null
    if (teacherProfile?.id) {
      const { data, error } = await supabase
        .from('coaching_relationships')
        .select('*')
        .eq('coach_id', teacherProfile.id)
      coachRelationships = { data, error }
    }

    // 7. Bu öğrencinin ilişkileri (eğer öğrenci ise)
    let studentRelationships = null
    if (studentProfile?.id) {
      const { data, error } = await supabase
        .from('coaching_relationships')
        .select('*')
        .eq('student_id', studentProfile.id)
      studentRelationships = { data, error }
    }

    return NextResponse.json({
      user: { id: user.id, email: user.email },
      profile: { data: profile, error: profileError?.message },
      teacherProfile: { data: teacherProfile, error: teacherError?.message },
      studentProfile: { data: studentProfile, error: studentError?.message },
      allRelationships: { 
        data: allRelationships, 
        error: relError?.message,
        count: allRelationships?.length || 0
      },
      coachRelationships,
      studentRelationships,
    })

  } catch (error: any) {
    console.error('Debug API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


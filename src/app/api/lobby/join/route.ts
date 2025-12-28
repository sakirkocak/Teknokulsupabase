import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service role client (RLS bypass)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/lobby/join
 * Lobiye katılma - öğrenci bilgilerini lobby tablosuna ekler
 */
export async function POST(req: NextRequest) {
  try {
    const { studentId, grade, totalPoints, preferredSubject } = await req.json()

    if (!studentId || !grade) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })
    }

    // Öğrenci zaten lobide mi?
    const { data: existing } = await supabase
      .from('duel_lobby')
      .select('id, status')
      .eq('student_id', studentId)
      .single()

    if (existing) {
      // Zaten lobide, last_seen güncelle
      await supabase
        .from('duel_lobby')
        .update({ 
          last_seen: new Date().toISOString(),
          preferred_subject: preferredSubject || null,
          status: 'available'
        })
        .eq('student_id', studentId)

      return NextResponse.json({
        success: true,
        status: 'already_in_lobby',
        message: 'Zaten lobidesisiz'
      })
    }

    // Lobiye ekle
    const { data, error } = await supabase
      .from('duel_lobby')
      .insert({
        student_id: studentId,
        grade,
        total_points: totalPoints || 0,
        preferred_subject: preferredSubject || null,
        status: 'available'
      })
      .select('id')
      .single()

    if (error) {
      console.error('Lobby join error:', error)
      return NextResponse.json({ 
        error: 'Lobiye katılınamadı', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      lobbyId: data.id,
      message: 'Lobiye katıldınız'
    })

  } catch (error) {
    console.error('Lobby join error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

/**
 * GET /api/lobby/join
 * Lobideki oyuncuları listele (Realtime'a fallback)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const currentStudentId = searchParams.get('currentStudentId')
    const gradeFilter = searchParams.get('grade')
    const subjectFilter = searchParams.get('subject')

    let query = supabase
      .from('duel_lobby')
      .select(`
        id,
        student_id,
        grade,
        total_points,
        preferred_subject,
        status,
        joined_at,
        last_seen
      `)
      .eq('status', 'available')
      .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Son 5 dakika aktif
      .order('last_seen', { ascending: false })
      .limit(50)

    // Kendimi hariç tut
    if (currentStudentId) {
      query = query.neq('student_id', currentStudentId)
    }

    // Sınıf filtresi
    if (gradeFilter && gradeFilter !== 'all') {
      query = query.eq('grade', parseInt(gradeFilter))
    }

    // Ders filtresi
    if (subjectFilter && subjectFilter !== 'all') {
      query = query.or(`preferred_subject.eq.${subjectFilter},preferred_subject.is.null`)
    }

    const { data: players, error } = await query

    if (error) {
      console.error('Lobby list error:', error)
      return NextResponse.json({ error: 'Liste alınamadı' }, { status: 500 })
    }

    // Oyuncu isimlerini al
    const studentIds = players?.map(p => p.student_id) || []
    
    if (studentIds.length === 0) {
      return NextResponse.json({ players: [] })
    }

    // Profil bilgilerini al
    const { data: profiles } = await supabase
      .from('student_profiles')
      .select(`
        id,
        user_id,
        grade,
        profile:profiles!student_profiles_user_id_fkey(full_name, avatar_url)
      `)
      .in('id', studentIds)

    // Birleştir
    const playersWithNames = players?.map(player => {
      const profileData = profiles?.find(p => p.id === player.student_id)
      // profile bir array olarak geliyor, ilk elemanı al
      const profile = Array.isArray(profileData?.profile) 
        ? profileData.profile[0] 
        : profileData?.profile
      return {
        ...player,
        fullName: profile?.full_name || 'Oyuncu',
        avatarUrl: profile?.avatar_url
      }
    })

    return NextResponse.json({ players: playersWithNames || [] })

  } catch (error) {
    console.error('Lobby list error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

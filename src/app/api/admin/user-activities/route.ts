import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { typesenseClient, isTypesenseAvailable, COLLECTIONS } from '@/lib/typesense/client'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/user-activities
 * 
 * Tüm kullanıcıların soru çözüm istatistiklerini listeler
 * Typesense leaderboard koleksiyonundan çeker
 */
export async function GET(request: NextRequest) {
  try {
    // Auth kontrolü
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin mi kontrol et
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin yetkisi gerekli' }, { status: 403 })
    }

    // Query params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'total_questions'
    const order = searchParams.get('order') || 'desc'

    // Typesense'den kullanıcı listesi
    if (isTypesenseAvailable()) {
      const result = await typesenseClient
        .collections(COLLECTIONS.LEADERBOARD)
        .documents()
        .search({
          q: search || '*',
          query_by: 'full_name',
          sort_by: `${sortBy}:${order}`,
          page,
          per_page: limit,
          include_fields: 'student_id,full_name,avatar_url,grade,total_questions,total_correct,total_wrong,total_points,max_streak,current_streak,city_name,school_name,last_activity_at'
        })

      const users = (result.hits || []).map((hit: any) => {
        const doc = hit.document
        return {
          student_id: doc.student_id,
          full_name: doc.full_name || 'Anonim',
          avatar_url: doc.avatar_url || null,
          grade: doc.grade || 0,
          total_questions: doc.total_questions || 0,
          total_correct: doc.total_correct || 0,
          total_wrong: doc.total_wrong || 0,
          total_points: doc.total_points || 0,
          success_rate: doc.total_questions > 0 
            ? Math.round((doc.total_correct / doc.total_questions) * 100) 
            : 0,
          max_streak: doc.max_streak || 0,
          current_streak: doc.current_streak || 0,
          city_name: doc.city_name || null,
          school_name: doc.school_name || null,
          last_activity_at: doc.last_activity_at || null
        }
      })

      return NextResponse.json({
        users,
        total: result.found || 0,
        page,
        limit,
        source: 'typesense'
      })
    }

    // Fallback: Supabase
    const { data: users, count } = await supabase
      .from('student_points')
      .select(`
        student_id,
        total_points,
        total_questions,
        total_correct,
        total_wrong,
        max_streak,
        current_streak,
        student_profiles!inner(
          grade,
          profiles:user_id(full_name, avatar_url)
        )
      `, { count: 'exact' })
      .order(sortBy, { ascending: order === 'asc' })
      .range((page - 1) * limit, page * limit - 1)

    return NextResponse.json({
      users: users || [],
      total: count || 0,
      page,
      limit,
      source: 'supabase'
    })

  } catch (error: any) {
    console.error('User activities error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

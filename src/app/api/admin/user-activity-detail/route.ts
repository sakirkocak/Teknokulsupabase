import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { typesenseClient, isTypesenseAvailable, COLLECTIONS } from '@/lib/typesense/client'

export const dynamic = 'force-dynamic'

// Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/admin/user-activity-detail
 * 
 * Bir kullanıcının soru çözüm detaylarını getirir
 * Typesense question_activity + questions koleksiyonlarından
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
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const dateFilter = searchParams.get('date') || ''
    const subjectFilter = searchParams.get('subject') || ''
    const correctFilter = searchParams.get('isCorrect') // 'true', 'false', or null

    if (!userId) {
      return NextResponse.json({ error: 'userId gerekli' }, { status: 400 })
    }

    // Önce kullanıcı bilgisini al
    const { data: userProfile } = await supabaseAdmin
      .from('student_profiles')
      .select(`
        id,
        grade,
        profiles:user_id(full_name, avatar_url, email)
      `)
      .eq('id', userId)
      .single()

    // Typesense'den aktiviteleri al
    if (isTypesenseAvailable()) {
      // Filter oluştur
      const filterParts: string[] = [`student_id:=${userId}`]
      
      if (dateFilter) {
        filterParts.push(`date:=${dateFilter}`)
      }
      if (subjectFilter) {
        filterParts.push(`subject_code:=${subjectFilter}`)
      }
      if (correctFilter !== null && correctFilter !== '') {
        filterParts.push(`is_correct:=${correctFilter}`)
      }

      const result = await typesenseClient
        .collections(COLLECTIONS.QUESTION_ACTIVITY)
        .documents()
        .search({
          q: '*',
          query_by: 'activity_id',
          filter_by: filterParts.join(' && '),
          sort_by: 'created_at:desc',
          page,
          per_page: limit
        })

      // Soru ID'lerini topla
      const questionIds = [...new Set(
        (result.hits || [])
          .map((hit: any) => hit.document?.question_id)
          .filter((id: string) => id && id.length > 0)
      )]

      // Soru detaylarını al (Typesense'den)
      let questionsMap: Record<string, any> = {}
      
      if (questionIds.length > 0) {
        try {
          const questionsResult = await typesenseClient
            .collections(COLLECTIONS.QUESTIONS)
            .documents()
            .search({
              q: '*',
              query_by: 'question_text',
              filter_by: `question_id:[${questionIds.join(',')}]`,
              per_page: questionIds.length
            })

          questionsMap = (questionsResult.hits || []).reduce((acc: any, hit: any) => {
            const doc = hit.document
            acc[doc.question_id] = {
              question_text: doc.question_text?.substring(0, 200) || '',
              subject_name: doc.subject_name || '',
              subject_code: doc.subject_code || '',
              main_topic: doc.main_topic || '',
              difficulty: doc.difficulty || ''
            }
            return acc
          }, {})
        } catch (e) {
          // Soru detayları alınamazsa devam et
        }
      }

      // Aktiviteleri formatla
      const activities = (result.hits || []).map((hit: any) => {
        const doc = hit.document
        const question = questionsMap[doc.question_id] || {}
        
        return {
          activity_id: doc.activity_id,
          question_id: doc.question_id || null,
          is_correct: doc.is_correct,
          points: doc.points || 0,
          date: doc.date,
          created_at: doc.created_at,
          question_text: question.question_text || null,
          subject_name: question.subject_name || null,
          subject_code: doc.subject_code || question.subject_code || null,
          main_topic: question.main_topic || null,
          difficulty: question.difficulty || null
        }
      })

      // İstatistikler (facet)
      const statsResult = await typesenseClient
        .collections(COLLECTIONS.QUESTION_ACTIVITY)
        .documents()
        .search({
          q: '*',
          query_by: 'activity_id',
          filter_by: `student_id:=${userId}`,
          facet_by: 'is_correct,subject_code,date',
          per_page: 0,
          max_facet_values: 100
        })

      const facets = statsResult.facet_counts || []
      const correctFacet = facets.find((f: any) => f.field_name === 'is_correct')
      const subjectFacet = facets.find((f: any) => f.field_name === 'subject_code')
      const dateFacet = facets.find((f: any) => f.field_name === 'date')

      const stats = {
        total: statsResult.found || 0,
        correct: correctFacet?.counts?.find((c: any) => c.value === 'true')?.count || 0,
        wrong: correctFacet?.counts?.find((c: any) => c.value === 'false')?.count || 0,
        bySubject: (subjectFacet?.counts || []).map((c: any) => ({
          subject_code: c.value,
          count: c.count
        })),
        byDate: (dateFacet?.counts || [])
          .sort((a: any, b: any) => b.value.localeCompare(a.value))
          .slice(0, 30)
          .map((c: any) => ({
            date: c.value,
            count: c.count
          }))
      }

      return NextResponse.json({
        user: userProfile ? {
          student_id: userProfile.id,
          full_name: (userProfile.profiles as any)?.full_name || 'Anonim',
          avatar_url: (userProfile.profiles as any)?.avatar_url || null,
          email: (userProfile.profiles as any)?.email || null,
          grade: userProfile.grade || 0
        } : null,
        activities,
        stats,
        total: result.found || 0,
        page,
        limit,
        source: 'typesense'
      })
    }

    // Fallback: Supabase point_history
    const { data: activities, count } = await supabaseAdmin
      .from('point_history')
      .select('*', { count: 'exact' })
      .eq('student_id', userId)
      .eq('source', 'question')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    return NextResponse.json({
      user: userProfile,
      activities: activities || [],
      stats: null,
      total: count || 0,
      page,
      limit,
      source: 'supabase'
    })

  } catch (error: any) {
    console.error('User activity detail error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

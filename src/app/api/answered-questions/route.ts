import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/answered-questions
 *
 * Returns the list of question IDs that the student has already answered.
 * Called once at session start to enable cross-session dedup.
 *
 * Query params:
 *   topicIds - optional comma-separated topic IDs to filter by
 */
export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get auth token from header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get student profile
    const { data: profile } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ questionIds: [], count: 0 })
    }

    // Parse optional topicIds filter
    const { searchParams } = new URL(req.url)
    const topicIdsParam = searchParams.get('topicIds')

    let query = supabase
      .from('user_answers')
      .select('question_id')
      .eq('student_id', profile.id)

    // If topicIds provided, join with questions to filter
    if (topicIdsParam) {
      const topicIds = topicIdsParam.split(',').filter(Boolean)
      if (topicIds.length > 0) {
        // Get question IDs for those topics first
        const { data: topicQuestions } = await supabase
          .from('questions')
          .select('id')
          .in('topic_id', topicIds)

        if (topicQuestions && topicQuestions.length > 0) {
          const questionIds = topicQuestions.map(q => q.id)
          query = query.in('question_id', questionIds)
        } else {
          return NextResponse.json({ questionIds: [], count: 0 })
        }
      }
    }

    const { data: answers, error } = await query

    if (error) {
      console.error('answered-questions error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Deduplicate question IDs
    const idSet = new Set(answers?.map(a => a.question_id) || [])
    const uniqueIds = Array.from(idSet)

    return NextResponse.json({
      questionIds: uniqueIds,
      count: uniqueIds.length
    })
  } catch (error) {
    console.error('answered-questions API error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}

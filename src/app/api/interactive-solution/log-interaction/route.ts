import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  try {
    const { question_id, interaction_type, interaction_data, step_id } = await request.json()

    // Kullanıcı bilgisini al (varsa)
    let userId: string | null = null
    
    try {
      const cookieStore = await cookies()
      const supabaseAuth = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
            set() {},
            remove() {},
          },
        }
      )
      const { data: { user } } = await supabaseAuth.auth.getUser()
      userId = user?.id || null
    } catch {
      // Auth hatası - anonim kullanıcı
    }

    // Service role ile kaydet
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Solution ID'yi bul
    let solutionId: string | null = null
    if (question_id) {
      const { data: solution } = await supabase
        .from('interactive_solutions')
        .select('id')
        .eq('question_id', question_id)
        .eq('is_active', true)
        .single()
      
      solutionId = solution?.id || null
    }

    // Etkileşimi kaydet
    const { error } = await supabase
      .from('solution_interactions')
      .insert({
        solution_id: solutionId,
        user_id: userId,
        step_id: step_id || null,
        interaction_type: interaction_type || 'view',
        interaction_data: interaction_data || {},
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Interaction log error:', error)
      // Hata olsa bile 200 dön - kritik değil
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Log interaction error:', error)
    return NextResponse.json({ success: false }, { status: 200 }) // Hata olsa bile 200
  }
}

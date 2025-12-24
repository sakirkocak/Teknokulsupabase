import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Aktif AI Koç görevlerini bugün çözülen sorularla senkronize et
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!studentProfile) {
      return NextResponse.json({ error: 'Öğrenci profili bulunamadı' }, { status: 404 })
    }

    // Aktif görevleri al
    const { data: tasks, error: tasksError } = await supabase
      .from('ai_coach_tasks')
      .select('*')
      .eq('student_id', studentProfile.id)
      .eq('status', 'active')

    if (tasksError) throw tasksError

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ message: 'Aktif görev yok', synced: 0 })
    }

    let syncedCount = 0
    let completedCount = 0
    let totalXpEarned = 0

    for (const task of tasks) {
      // Görevin oluşturulduğu günden bugüne kadar çözülen soruları say
      const taskDate = new Date(task.created_at)
      taskDate.setHours(0, 0, 0, 0)

      let query = supabase
        .from('point_history')
        .select('id', { count: 'exact' })
        .eq('student_id', studentProfile.id)
        .eq('source', 'question')
        .gte('created_at', taskDate.toISOString())

      // Ders filtresi varsa uygula
      if (task.subject_code) {
        query = query.or(`subject_code.eq.${task.subject_code},subject_code.ilike.%${task.subject_code}%`)
      }

      const { count } = await query

      const actualCount = count || 0

      // Eğer gerçek sayı mevcut sayıdan farklıysa güncelle
      if (actualCount !== task.current_count) {
        const isCompleted = actualCount >= task.target_count

        if (isCompleted && task.status !== 'completed') {
          // Görevi tamamla
          await supabase
            .from('ai_coach_tasks')
            .update({
              current_count: Math.min(actualCount, task.target_count),
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('id', task.id)

          // XP ver
          const xpEarned = task.xp_reward + (task.bonus_xp || 0)
          totalXpEarned += xpEarned
          completedCount++

          // Point history'e ekle
          await supabase.from('point_history').insert({
            student_id: studentProfile.id,
            points: xpEarned,
            source: 'ai_task'
          })

          // Student points güncelle
          const { data: currentPoints } = await supabase
            .from('student_points')
            .select('total_points')
            .eq('student_id', studentProfile.id)
            .single()

          await supabase
            .from('student_points')
            .update({
              total_points: (currentPoints?.total_points || 0) + xpEarned
            })
            .eq('student_id', studentProfile.id)

        } else {
          // Sadece ilerlemeyi güncelle
          await supabase
            .from('ai_coach_tasks')
            .update({
              current_count: Math.min(actualCount, task.target_count)
            })
            .eq('id', task.id)
        }

        syncedCount++
      }
    }

    // AI Coach stats güncelle
    if (completedCount > 0) {
      await supabase
        .from('ai_coach_stats')
        .upsert({
          student_id: studentProfile.id,
          tasks_completed: completedCount,
          total_xp_earned: totalXpEarned,
          last_interaction: new Date().toISOString()
        }, {
          onConflict: 'student_id'
        })
    }

    return NextResponse.json({
      message: syncedCount > 0 ? 'Görevler senkronize edildi' : 'Görevler zaten güncel',
      synced: syncedCount,
      completed: completedCount,
      xpEarned: totalXpEarned
    })

  } catch (error) {
    console.error('AI Coach sync error:', error)
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateDailyTask } from '@/lib/ai-coach/gemini'
import { getSubjectName } from '@/lib/ai-coach/prompts'

// Aktif görevleri getir
export async function GET(request: NextRequest) {
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
    const { data: tasks, error } = await supabase
      .from('ai_coach_tasks')
      .select('*')
      .eq('student_id', studentProfile.id)
      .in('status', ['active'])
      .order('created_at', { ascending: false })

    if (error) throw error

    // Görevleri formatla
    const formattedTasks = (tasks || []).map(task => ({
      ...task,
      subject_name: task.subject_code ? getSubjectName(task.subject_code) : null,
      progress: task.target_count > 0 
        ? Math.round((task.current_count / task.target_count) * 100)
        : 0,
      is_expired: task.expires_at && new Date(task.expires_at) < new Date()
    }))

    // Tamamlanan görevleri al (son 7 gün)
    const { data: completedTasks } = await supabase
      .from('ai_coach_tasks')
      .select('*')
      .eq('student_id', studentProfile.id)
      .eq('status', 'completed')
      .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('completed_at', { ascending: false })
      .limit(5)

    return NextResponse.json({ 
      tasks: formattedTasks,
      completedTasks: completedTasks || []
    })

  } catch (error) {
    console.error('AI Coach tasks GET error:', error)
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

// Yeni görev oluştur (AI ile)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('id, grade, target_exam')
      .eq('user_id', user.id)
      .single()

    if (!studentProfile) {
      return NextResponse.json({ error: 'Öğrenci profili bulunamadı' }, { status: 404 })
    }

    // Bugün zaten aktif görev var mı kontrol et
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { data: existingTask } = await supabase
      .from('ai_coach_tasks')
      .select('id')
      .eq('student_id', studentProfile.id)
      .eq('status', 'active')
      .gte('created_at', today.toISOString())
      .single()

    if (existingTask) {
      return NextResponse.json(
        { error: 'Bugün için zaten aktif bir göreviniz var' },
        { status: 400 }
      )
    }

    // Öğrenci verilerini al
    const { data: studentStats } = await supabase.rpc('get_student_analysis', {
      p_student_id: studentProfile.id
    })

    const { data: weeklyActivity } = await supabase.rpc('get_weekly_activity', {
      p_student_id: studentProfile.id
    })

    // AI'dan görev al
    const taskData = await generateDailyTask({
      grade: studentProfile.grade,
      targetExam: studentProfile.target_exam,
      stats: studentStats,
      weekly: weeklyActivity
    })

    // Görevi kaydet
    const expiresAt = new Date()
    expiresAt.setHours(23, 59, 59, 999) // Bugün gece yarısı

    const { data: newTask, error: insertError } = await supabase
      .from('ai_coach_tasks')
      .insert({
        student_id: studentProfile.id,
        title: taskData.title,
        description: taskData.description,
        subject_code: taskData.subject_code,
        target_count: taskData.target_count,
        target_accuracy: taskData.target_accuracy,
        xp_reward: taskData.xp_reward,
        bonus_xp: taskData.target_accuracy ? 50 : 0, // Doğruluk hedefi varsa bonus
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json({
      task: {
        ...newTask,
        subject_name: newTask.subject_code ? getSubjectName(newTask.subject_code) : null,
        progress: 0
      }
    })

  } catch (error) {
    console.error('AI Coach tasks POST error:', error)
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

// Görev ilerlemesini güncelle
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { taskId, increment, isCorrect } = await request.json()
    
    if (!taskId) {
      return NextResponse.json({ error: 'Task ID gerekli' }, { status: 400 })
    }

    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!studentProfile) {
      return NextResponse.json({ error: 'Öğrenci profili bulunamadı' }, { status: 404 })
    }

    // Görevi al
    const { data: task, error: taskError } = await supabase
      .from('ai_coach_tasks')
      .select('*')
      .eq('id', taskId)
      .eq('student_id', studentProfile.id)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'Görev bulunamadı' }, { status: 404 })
    }

    if (task.status !== 'active') {
      return NextResponse.json({ error: 'Bu görev artık aktif değil' }, { status: 400 })
    }

    // İlerlemeyi güncelle
    const newCount = task.current_count + (increment || 1)
    const isCompleted = newCount >= task.target_count

    const updateData: any = {
      current_count: newCount
    }

    if (isCompleted) {
      updateData.status = 'completed'
      updateData.completed_at = new Date().toISOString()
    }

    const { data: updatedTask, error: updateError } = await supabase
      .from('ai_coach_tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single()

    if (updateError) throw updateError

    // Görev tamamlandıysa XP ver
    if (isCompleted) {
      let totalXp = task.xp_reward

      // Bonus XP kontrolü (doğruluk hedefi)
      if (task.target_accuracy && task.bonus_xp) {
        // TODO: Doğruluk oranını hesapla ve bonus ver
        totalXp += task.bonus_xp
      }

      // XP kaydet
      await supabase.from('point_history').insert({
        student_id: studentProfile.id,
        points: totalXp,
        source: 'ai_task'
      })

      // Student points güncelle
      await supabase.rpc('increment_student_points', {
        p_student_id: studentProfile.id,
        p_points: totalXp
      })

      // AI Coach stats güncelle
      await supabase
        .from('ai_coach_stats')
        .upsert({
          student_id: studentProfile.id,
          tasks_completed: 1,
          total_xp_earned: totalXp
        }, {
          onConflict: 'student_id'
        })

      // 5 görev rozeti kontrolü
      const { data: stats } = await supabase
        .from('ai_coach_stats')
        .select('tasks_completed')
        .eq('student_id', studentProfile.id)
        .single()

      if (stats?.tasks_completed >= 5) {
        const { data: existingBadge } = await supabase
          .from('user_badges')
          .select('id')
          .eq('student_id', studentProfile.id)
          .eq('badge_id', 'ai_improver')
          .single()

        if (!existingBadge) {
          await supabase.from('user_badges').insert({
            student_id: studentProfile.id,
            badge_id: 'ai_improver'
          })
        }
      }

      return NextResponse.json({
        task: updatedTask,
        completed: true,
        xpEarned: totalXp,
        message: `Tebrikler! Görevi tamamladın ve ${totalXp} XP kazandın! 🎉`
      })
    }

    return NextResponse.json({
      task: updatedTask,
      completed: false,
      progress: Math.round((newCount / task.target_count) * 100)
    })

  } catch (error) {
    console.error('AI Coach tasks PATCH error:', error)
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}


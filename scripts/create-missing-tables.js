const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://cnawnprwdcfmyswqolsu.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuYXducHJ3ZGNmbXlzd3FvbHN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDU3MDAwOCwiZXhwIjoyMDgwMTQ2MDA4fQ.MYGt0HC4AenMP94N3Jt30ojKomtaeFBJuegLyczFNCM'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTables() {
  console.log('🚀 Eksik tabloları oluşturma başlıyor...\n')

  const tables = [
    {
      name: 'notifications',
      check: async () => {
        const { data, error } = await supabase.from('notifications').select('id').limit(1)
        return !error
      },
      create: `Notifications tablosu zaten var veya oluşturulamıyor`
    },
    {
      name: 'classrooms', 
      check: async () => {
        const { data, error } = await supabase.from('classrooms').select('id').limit(1)
        return !error
      }
    },
    {
      name: 'classroom_students',
      check: async () => {
        const { data, error } = await supabase.from('classroom_students').select('id').limit(1)
        return !error
      }
    },
    {
      name: 'assignments',
      check: async () => {
        const { data, error } = await supabase.from('assignments').select('id').limit(1)
        return !error
      }
    },
    {
      name: 'assignment_responses',
      check: async () => {
        const { data, error } = await supabase.from('assignment_responses').select('id').limit(1)
        return !error
      }
    },
    {
      name: 'materials',
      check: async () => {
        const { data, error } = await supabase.from('materials').select('id').limit(1)
        return !error
      }
    },
    {
      name: 'classroom_materials',
      check: async () => {
        const { data, error } = await supabase.from('classroom_materials').select('id').limit(1)
        return !error
      }
    },
    {
      name: 'classroom_announcements',
      check: async () => {
        const { data, error } = await supabase.from('classroom_announcements').select('id').limit(1)
        return !error
      }
    },
    {
      name: 'reviews',
      check: async () => {
        const { data, error } = await supabase.from('reviews').select('id').limit(1)
        return !error
      }
    },
    {
      name: 'messages',
      check: async () => {
        const { data, error } = await supabase.from('messages').select('id').limit(1)
        return !error
      }
    },
    {
      name: 'parent_reports',
      check: async () => {
        const { data, error } = await supabase.from('parent_reports').select('id').limit(1)
        return !error
      }
    },
    {
      name: 'lgs_mock_exams',
      check: async () => {
        const { data, error } = await supabase.from('lgs_mock_exams').select('id').limit(1)
        return !error
      }
    },
    {
      name: 'mock_exam_answers',
      check: async () => {
        const { data, error } = await supabase.from('mock_exam_answers').select('id').limit(1)
        return !error
      }
    },
    {
      name: 'ai_questions',
      check: async () => {
        const { data, error } = await supabase.from('ai_questions').select('id').limit(1)
        return !error
      }
    },
    {
      name: 'lgs_questions',
      check: async () => {
        const { data, error } = await supabase.from('lgs_questions').select('id').limit(1)
        return !error
      }
    },
    {
      name: 'question_solutions',
      check: async () => {
        const { data, error } = await supabase.from('question_solutions').select('id').limit(1)
        return !error
      }
    },
    {
      name: 'ai_usage_stats',
      check: async () => {
        const { data, error } = await supabase.from('ai_usage_stats').select('id').limit(1)
        return !error
      }
    },
    {
      name: 'ai_generated_content',
      check: async () => {
        const { data, error } = await supabase.from('ai_generated_content').select('id').limit(1)
        return !error
      }
    },
    {
      name: 'student_badges',
      check: async () => {
        const { data, error } = await supabase.from('student_badges').select('id').limit(1)
        return !error
      }
    },
    {
      name: 'duels',
      check: async () => {
        const { data, error } = await supabase.from('duels').select('id').limit(1)
        return !error
      }
    },
    {
      name: 'duel_questions',
      check: async () => {
        const { data, error } = await supabase.from('duel_questions').select('id').limit(1)
        return !error
      }
    },
    {
      name: 'duel_answers',
      check: async () => {
        const { data, error } = await supabase.from('duel_answers').select('id').limit(1)
        return !error
      }
    },
    {
      name: 'duel_invitations',
      check: async () => {
        const { data, error } = await supabase.from('duel_invitations').select('id').limit(1)
        return !error
      }
    },
    {
      name: 'question_reports',
      check: async () => {
        const { data, error } = await supabase.from('question_reports').select('id').limit(1)
        return !error
      }
    },
    {
      name: 'user_badges',
      check: async () => {
        const { data, error } = await supabase.from('user_badges').select('id').limit(1)
        return !error
      }
    },
    {
      name: 'challenge_progress',
      check: async () => {
        const { data, error } = await supabase.from('challenge_progress').select('id').limit(1)
        return !error
      }
    },
    {
      name: 'xp_history',
      check: async () => {
        const { data, error } = await supabase.from('xp_history').select('id').limit(1)
        return !error
      }
    },
    {
      name: 'weekly_challenges',
      check: async () => {
        const { data, error } = await supabase.from('weekly_challenges').select('id').limit(1)
        return !error
      }
    },
    {
      name: 'achievement_notifications',
      check: async () => {
        const { data, error } = await supabase.from('achievement_notifications').select('id').limit(1)
        return !error
      }
    }
  ]

  const existing = []
  const missing = []

  for (const table of tables) {
    const exists = await table.check()
    if (exists) {
      existing.push(table.name)
      console.log(`✅ ${table.name} - VAR`)
    } else {
      missing.push(table.name)
      console.log(`❌ ${table.name} - EKSİK`)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`\n📊 SONUÇ:`)
  console.log(`   ✅ Mevcut tablolar: ${existing.length}`)
  console.log(`   ❌ Eksik tablolar: ${missing.length}`)
  
  if (missing.length > 0) {
    console.log(`\n❌ Eksik tablolar:`)
    missing.forEach(t => console.log(`   - ${t}`))
    console.log('\n⚠️  Bu tabloları Supabase Dashboard > SQL Editor\'da manuel oluşturmanız gerekiyor.')
  } else {
    console.log('\n🎉 Tüm tablolar mevcut!')
  }
}

createTables().catch(console.error)


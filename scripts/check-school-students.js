const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkStudents() {
  // Fatih Sultan Mehmet Ortaokulu'nu bul
  const { data: schools } = await supabase
    .from('schools')
    .select('id, name')
    .or('name.ilike.%FATİH SULTAN MEHMET%,name.ilike.%FATIH SULTAN MEHMET%')
  
  console.log('Bulunan Fatih Sultan Mehmet Okulları:')
  console.log(schools)

  if (schools && schools.length > 0) {
    for (const school of schools) {
      console.log(`\n--- ${school.name} ---`)
      
      // Bu okula kayıtlı öğrencileri listele
      const { data: students } = await supabase
        .from('student_profiles')
        .select(`
          id,
          school_id,
          profiles!student_profiles_user_id_fkey(full_name)
        `)
        .eq('school_id', school.id)
      
      console.log(`Öğrenci sayısı: ${students?.length || 0}`)
      students?.forEach(s => {
        console.log(`  - ${s.profiles?.full_name} (ID: ${s.id})`)
      })
    }
  }

  // Hasandağı Ortaokulu'nu da kontrol et
  console.log('\n\n=== HASANDAĞI ORTAOKULU ===')
  const { data: hasandagiSchools } = await supabase
    .from('schools')
    .select('id, name')
    .or('name.ilike.%HASANDAĞI%,name.ilike.%HASANDAGI%')
  
  console.log('Bulunan Hasandağı Okulları:')
  console.log(hasandagiSchools)

  if (hasandagiSchools && hasandagiSchools.length > 0) {
    for (const school of hasandagiSchools) {
      console.log(`\n--- ${school.name} ---`)
      
      const { data: students } = await supabase
        .from('student_profiles')
        .select(`
          id,
          school_id,
          profiles!student_profiles_user_id_fkey(full_name)
        `)
        .eq('school_id', school.id)
      
      console.log(`Öğrenci sayısı: ${students?.length || 0}`)
      students?.forEach(s => {
        console.log(`  - ${s.profiles?.full_name} (ID: ${s.id})`)
      })
    }
  }
}

checkStudents().catch(console.error)


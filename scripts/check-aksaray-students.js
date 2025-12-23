const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkStudents() {
  // Aksaray ilini bul (plaka kodu 68)
  const { data: aksaray } = await supabase
    .from('turkey_cities')
    .select('id, name, plate_code')
    .eq('plate_code', 68)
    .single()
  
  console.log('Aksaray:', aksaray)

  if (!aksaray) {
    console.log('Aksaray bulunamadı!')
    return
  }

  // Aksaray Merkez ilçesini bul
  const { data: merkez } = await supabase
    .from('turkey_districts')
    .select('id, name')
    .eq('city_id', aksaray.id)
    .ilike('name', '%MERKEZ%')
    .single()
  
  console.log('Aksaray Merkez:', merkez)

  if (!merkez) {
    console.log('Merkez ilçe bulunamadı!')
    return
  }

  // Aksaray Merkez'deki tüm okulları listele
  const { data: allSchools } = await supabase
    .from('schools')
    .select('id, name')
    .eq('district_id', merkez.id)
    .order('name')
  
  console.log(`\nAksaray Merkez'deki toplam okul sayısı: ${allSchools?.length || 0}`)

  // Fatih Sultan Mehmet Ortaokulu'nu bul
  const fsmOrtaokulu = allSchools?.find(s => 
    s.name.includes('FATİH SULTAN MEHMET ORTAOKULU') || 
    s.name.includes('FATIH SULTAN MEHMET ORTAOKULU')
  )
  
  console.log('\nFatih Sultan Mehmet Ortaokulu:')
  console.log(fsmOrtaokulu)

  if (fsmOrtaokulu) {
    // Bu okula kayıtlı öğrencileri listele
    const { data: students } = await supabase
      .from('student_profiles')
      .select(`
        id,
        school_id,
        city_id,
        district_id,
        profiles!student_profiles_user_id_fkey(full_name)
      `)
      .eq('school_id', fsmOrtaokulu.id)
    
    console.log(`\n${fsmOrtaokulu.name} Öğrencileri (${students?.length || 0} kişi):`)
    students?.forEach(s => {
      console.log(`  - ${s.profiles?.full_name}`)
      console.log(`    student_profile_id: ${s.id}`)
      console.log(`    school_id: ${s.school_id}`)
    })
  }

  // Hasandağı Ortaokulu'nu bul
  console.log('\n\n=== HASANDAĞI ORTAOKULU ===')
  const hasandagiOrtaokulu = allSchools?.find(s => 
    s.name.includes('HASANDAĞI ORTAOKULU') || 
    s.name.includes('HASANDAGI ORTAOKULU')
  )
  
  console.log('Hasandağı Ortaokulu:')
  console.log(hasandagiOrtaokulu)

  if (hasandagiOrtaokulu) {
    const { data: students } = await supabase
      .from('student_profiles')
      .select(`
        id,
        school_id,
        profiles!student_profiles_user_id_fkey(full_name)
      `)
      .eq('school_id', hasandagiOrtaokulu.id)
    
    console.log(`\n${hasandagiOrtaokulu.name} Öğrencileri (${students?.length || 0} kişi):`)
    students?.forEach(s => {
      console.log(`  - ${s.profiles?.full_name} (ID: ${s.id})`)
    })
  }

  // Gökçe İlkokulu'nu bul
  console.log('\n\n=== GÖKÇE İLKOKULU ===')
  const gokceIlkokulu = allSchools?.find(s => 
    s.name.includes('GÖKÇE İLKOKULU') || 
    s.name.includes('GOKCE ILKOKULU')
  )
  
  console.log('Gökçe İlkokulu:')
  console.log(gokceIlkokulu)

  if (gokceIlkokulu) {
    const { data: students } = await supabase
      .from('student_profiles')
      .select(`
        id,
        school_id,
        profiles!student_profiles_user_id_fkey(full_name)
      `)
      .eq('school_id', gokceIlkokulu.id)
    
    console.log(`\n${gokceIlkokulu.name} Öğrencileri (${students?.length || 0} kişi):`)
    students?.forEach(s => {
      console.log(`  - ${s.profiles?.full_name} (ID: ${s.id})`)
    })
  }

  // Ekranda gördüğümüz öğrencileri arayalım
  console.log('\n\n=== EKRANDA GÖRÜNEN ÖĞRENCİLER ===')
  const names = ['Adem Enes gökbulut', 'Beytullah Temel', 'Ömer Faruk Kulluk Silva', 'Şakir KOÇAK', 'Ayşe Nisa Altınbaş']
  
  for (const name of names) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name')
      .ilike('full_name', `%${name}%`)
      .single()
    
    if (profile) {
      const { data: student } = await supabase
        .from('student_profiles')
        .select(`
          id,
          school_id,
          schools!student_profiles_school_id_fkey(id, name)
        `)
        .eq('user_id', profile.id)
        .single()
      
      console.log(`\n${profile.full_name}:`)
      console.log(`  - school_id: ${student?.school_id}`)
      console.log(`  - school_name: ${student?.schools?.name}`)
    }
  }
}

checkStudents().catch(console.error)

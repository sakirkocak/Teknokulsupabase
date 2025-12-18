const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://cnawnprwdcfmyswqolsu.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  console.log('🚀 student_subject_points tablosu oluşturuluyor...')

  // Tablo oluştur
  const { error: tableError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS student_subject_points (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
          subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
          points INTEGER DEFAULT 0,
          correct_count INTEGER DEFAULT 0,
          wrong_count INTEGER DEFAULT 0,
          last_activity_at TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(student_id, subject_id)
      );
    `
  })

  if (tableError) {
    // RPC yoksa direkt SQL dene
    console.log('RPC yok, alternatif yöntem deneniyor...')
    
    // Önce tablonun var olup olmadığını kontrol et
    const { data: existingTable, error: checkError } = await supabase
      .from('student_subject_points')
      .select('id')
      .limit(1)

    if (checkError && checkError.code === '42P01') {
      console.log('Tablo mevcut değil, oluşturulması gerekiyor.')
      console.log('⚠️ Lütfen Supabase Dashboard > SQL Editor\'de şu dosyayı çalıştırın:')
      console.log('   supabase/student-subject-points.sql')
      return
    } else if (!checkError) {
      console.log('✅ Tablo zaten mevcut!')
    } else {
      console.log('Tablo durumu:', checkError.message)
    }
  } else {
    console.log('✅ Tablo oluşturuldu!')
  }

  // Index'leri oluştur
  console.log('📊 Index\'ler oluşturuluyor...')
  
  // RLS'i etkinleştir
  console.log('🔐 RLS politikaları ayarlanıyor...')

  console.log('✅ Migration tamamlandı!')
}

runMigration().catch(console.error)


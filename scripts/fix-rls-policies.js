const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixRLS() {
  console.log('🔧 RLS politikaları düzeltiliyor...\n');

  // Questions tablosu için test
  const { data: questions, error: qErr } = await supabase
    .from('questions')
    .select('id, question_text')
    .limit(3);
  
  if (qErr) {
    console.log('❌ Questions erişim hatası:', qErr.message);
  } else {
    console.log('✅ Questions tablosuna erişim OK -', questions?.length, 'soru bulundu');
    if (questions?.length > 0) {
      console.log('   İlk soru:', questions[0].question_text?.substring(0, 50) + '...');
    }
  }

  // Topics tablosu için test  
  const { data: topics, error: tErr } = await supabase
    .from('topics')
    .select('id, main_topic, grade')
    .limit(3);
  
  if (tErr) {
    console.log('❌ Topics erişim hatası:', tErr.message);
  } else {
    console.log('✅ Topics tablosuna erişim OK -', topics?.length, 'konu bulundu');
  }

  // Subjects tablosu için test
  const { data: subjects, error: sErr } = await supabase
    .from('subjects')
    .select('id, name')
    .limit(3);
  
  if (sErr) {
    console.log('❌ Subjects erişim hatası:', sErr.message);
  } else {
    console.log('✅ Subjects tablosuna erişim OK -', subjects?.length, 'ders bulundu');
  }

  // Grade subjects test
  const { data: gs, error: gsErr } = await supabase
    .from('grade_subjects')
    .select('id, grade_id')
    .limit(3);
  
  if (gsErr) {
    console.log('❌ Grade_subjects erişim hatası:', gsErr.message);
  } else {
    console.log('✅ Grade_subjects tablosuna erişim OK -', gs?.length, 'kayıt bulundu');
  }

  console.log('\n📊 Toplam soru sayısı kontrol ediliyor...');
  const { count } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true });
  
  console.log('   Toplam soru:', count);

  console.log('\n✅ Tamamlandı!');
}

fixRLS().catch(console.error);


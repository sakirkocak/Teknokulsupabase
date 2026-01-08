/**
 * Engagement-Based SEO Indexing Runner
 * Top 1000 sayfayı indexe açar
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runEngagementIndexing() {
  console.log('🎯 Engagement-Based SEO Indexing başlıyor...\n');

  // 1. Kolonlar zaten Supabase'de manuel eklendi
  console.log('📋 Kolonlar zaten hazır (Supabase\'de eklendi)\n');

  // 2. Toplam soru sayısını al
  const { count: totalQuestions } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true });
  
  console.log(`📊 Toplam soru sayısı: ${totalQuestions}\n`);

  // 3. En çok çözülen soruları al (solve_count'a göre)
  console.log('🔍 En popüler sorular bulunuyor...');
  
  const { data: topQuestions, error: fetchError } = await supabase
    .from('questions')
    .select('id, question_text, solve_count, times_answered, video_status')
    .order('solve_count', { ascending: false, nullsFirst: false })
    .limit(1000);

  if (fetchError) {
    console.error('❌ Soru çekme hatası:', fetchError.message);
    return;
  }

  console.log(`✅ ${topQuestions.length} soru bulundu\n`);

  // 4. Engagement skoru hesapla ve indexle
  console.log('📈 Engagement skorları hesaplanıyor ve indexleniyor...');
  
  let indexed = 0;
  let maxScore = 0;
  let minScore = Infinity;

  for (const q of topQuestions) {
    // Engagement skoru hesapla
    let score = 0;
    score += (q.solve_count || 0) * 3;        // Çözüm sayısı
    score += (q.times_answered || 0) * 2;      // Cevaplama sayısı
    if (q.video_status === 'ready') score += 30;  // Video bonus

    // Güncelle
    const { error: updateError } = await supabase
      .from('questions')
      .update({
        is_indexed: true,
        index_score: score,
        index_reason: 'high_engagement',
        indexed_at: new Date().toISOString()
      })
      .eq('id', q.id);

    if (!updateError) {
      indexed++;
      if (score > maxScore) maxScore = score;
      if (score < minScore) minScore = score;
    }
  }

  console.log(`\n✅ ${indexed} sayfa indexe açıldı!`);
  console.log(`📊 Max skor: ${maxScore}`);
  console.log(`📊 Min skor: ${minScore === Infinity ? 0 : minScore}`);

  // 5. Sonuç özeti
  const { count: indexedCount } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('is_indexed', true);

  console.log(`\n🎉 SONUÇ:`);
  console.log(`   Toplam soru: ${totalQuestions}`);
  console.log(`   Indexli sayfa: ${indexedCount}`);
  console.log(`   Index oranı: ${((indexedCount / totalQuestions) * 100).toFixed(1)}%`);

  // 6. Top 5 göster
  console.log('\n🏆 TOP 5 SAYFA:');
  const { data: top5 } = await supabase
    .from('questions')
    .select('id, question_text, index_score, solve_count')
    .eq('is_indexed', true)
    .order('index_score', { ascending: false })
    .limit(5);

  top5?.forEach((q, i) => {
    console.log(`   ${i+1}. [Skor: ${q.index_score}] ${q.question_text?.substring(0, 60)}...`);
  });

  console.log('\n✅ Engagement-Based SEO Indexing tamamlandı!');
}

runEngagementIndexing().catch(console.error);

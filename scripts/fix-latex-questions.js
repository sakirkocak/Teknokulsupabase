require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Hata: .env.local dosyasında NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY bulunamadı.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DRY_RUN = !process.argv.includes('--execute');

async function fixLatexInText(text) {
  if (!text) return text;
  
  let fixed = text;
  let original = text;

  // 1. Kesinlikle bozuk olan backslash eksiklikleri (fonksiyon isimleri)
  // frac{ -> \frac{
  fixed = fixed.replace(/([^a-zA-Z\\])frac\{/g, '$1\\frac{');
  // sqrt{ -> \sqrt{
  fixed = fixed.replace(/([^a-zA-Z\\])sqrt\{/g, '$1\\sqrt{');
  // text{ -> \text{
  fixed = fixed.replace(/([^a-zA-Z\\])text\{/g, '$1\\text{');
  // begin{ -> \begin{
  fixed = fixed.replace(/([^a-zA-Z\\])begin\{/g, '$1\\begin{');
  // end{ -> \end{
  fixed = fixed.replace(/([^a-zA-Z\\])end\{/g, '$1\\end{');
  
  // 2. Tablo komutları
  // hline -> \hline (sadece tablo bağlamında güvenliyse yapılmalı ama genelde hline kelimesi kullanılmaz)
  fixed = fixed.replace(/([^a-zA-Z\\])hline/g, '$1\\hline');

  // 3. Matematiksel semboller (DİKKAT: Bunlar kelime olarak da geçebilir)
  // times -> \times (sadece sayıların arasında veya boşlukla çevrili ise?)
  // Şimdilik riskli olanları devre dışı bırakıyorum. Sadece kesin olanları düzeltelim.
  // fixed = fixed.replace(/ times /g, ' \\times '); 

  return fixed !== original ? fixed : null;
}

async function main() {
  console.log(`Başlatılıyor... Mod: ${DRY_RUN ? 'DRY RUN (Değişiklik yapılmayacak)' : 'EXECUTE (Veritabanı güncellenecek)'}`);

  // Toplam soru sayısını al
  const { count, error: countError } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Soru sayısı alınamadı:', countError);
    return;
  }

  console.log(`Toplam ${count} soru taranacak.`);

  const BATCH_SIZE = 100;
  let processed = 0;
  let updated = 0;

  for (let i = 0; i < count; i += BATCH_SIZE) {
    const { data: questions, error } = await supabase
      .from('questions')
      .select('id, question_text, explanation')
      .range(i, i + BATCH_SIZE - 1);

    if (error) {
      console.error(`Batch ${i} hatası:`, error);
      continue;
    }

    for (const q of questions) {
      let needsUpdate = false;
      let newText = q.question_text;
      let newExplanation = q.explanation;

      const fixedText = await fixLatexInText(q.question_text);
      if (fixedText) {
        newText = fixedText;
        needsUpdate = true;
      }

      const fixedExplanation = await fixLatexInText(q.explanation);
      if (fixedExplanation) {
        newExplanation = fixedExplanation;
        needsUpdate = true;
      }

      if (needsUpdate) {
        if (DRY_RUN) {
          console.log(`[DRY RUN] Soru ${q.id} düzeltilecek:`);
          if (newText !== q.question_text) {
            console.log(`  - Text değişimi: ...${q.question_text.substring(0, 50)}... -> ...${newText.substring(0, 50)}...`);
          }
        } else {
          const { error: updateError } = await supabase
            .from('questions')
            .update({ 
              question_text: newText,
              explanation: newExplanation
            })
            .eq('id', q.id);

          if (updateError) {
            console.error(`Soru ${q.id} güncellenemedi:`, updateError);
          } else {
            // console.log(`Soru ${q.id} düzeltildi.`);
            updated++;
          }
        }
      }
    }
    
    processed += questions.length;
    process.stdout.write(`\rİşlendi: ${processed}/${count} | Düzeltilen: ${updated}`);
  }

  console.log('\nİşlem tamamlandı.');
}

main().catch(console.error);

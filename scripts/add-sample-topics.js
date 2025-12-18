// Örnek kazanımlar ekle
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function addSampleTopics() {
  console.log('📚 Örnek kazanımlar ekleniyor...\n')

  // Önce subjects tablosundan dersleri al
  const { data: subjects, error: subjectError } = await supabase
    .from('subjects')
    .select('id, name, slug')

  if (subjectError) {
    console.error('Dersler alınamadı:', subjectError)
    return
  }

  console.log('Bulunan dersler:', subjects?.map(s => s.name).join(', '))

  // Ders ID'lerini bul
  const findSubject = (slug) => subjects?.find(s => s.slug === slug)?.id

  const turkce = findSubject('turkce')
  const matematik = findSubject('matematik')
  const fen = findSubject('fen_bilimleri')
  const inkilap = findSubject('inkilap_tarihi')
  const din = findSubject('din_kulturu')
  const ingilizce = findSubject('ingilizce')

  console.log('\nDers ID\'leri:')
  console.log('- Türkçe:', turkce)
  console.log('- Matematik:', matematik)
  console.log('- Fen:', fen)

  if (!matematik) {
    console.error('Matematik dersi bulunamadı!')
    return
  }

  // Örnek kazanımlar - 5. sınıf Matematik
  const sampleTopics = [
    // 5. Sınıf Matematik
    { subject_id: matematik, grade: 5, unit_number: 1, main_topic: 'Doğal Sayılar', sub_topic: 'Milyonluk Sayılar', learning_outcome: 'Milyonluk sayıları okur ve yazar' },
    { subject_id: matematik, grade: 5, unit_number: 1, main_topic: 'Doğal Sayılar', sub_topic: 'Bölünebilme', learning_outcome: 'Bir sayının 2, 3, 5, 9, 10 ile bölünebilirliğini belirler' },
    { subject_id: matematik, grade: 5, unit_number: 2, main_topic: 'Kesirler', sub_topic: 'Kesirleri Sıralama', learning_outcome: 'Kesirleri sıralar ve karşılaştırır' },
    { subject_id: matematik, grade: 5, unit_number: 3, main_topic: 'Ondalık Gösterim', sub_topic: 'Ondalık Sayılar', learning_outcome: 'Ondalık gösterimle işlem yapar' },
    { subject_id: matematik, grade: 5, unit_number: 4, main_topic: 'Yüzdeler', sub_topic: 'Yüzde Kavramı', learning_outcome: 'Yüzde kavramını anlar ve hesaplar' },
    
    // 8. Sınıf Matematik (LGS)
    { subject_id: matematik, grade: 8, unit_number: 1, main_topic: 'Çarpanlar ve Katlar', sub_topic: 'EKOK-EBOB', learning_outcome: 'EKOK ve EBOB problemleri çözer' },
    { subject_id: matematik, grade: 8, unit_number: 2, main_topic: 'Üslü İfadeler', sub_topic: 'Üslü Sayılar', learning_outcome: 'Üslü ifadelerle işlem yapar' },
    { subject_id: matematik, grade: 8, unit_number: 3, main_topic: 'Kareköklü İfadeler', sub_topic: 'Karekök', learning_outcome: 'Kareköklü ifadelerle işlem yapar' },
    { subject_id: matematik, grade: 8, unit_number: 4, main_topic: 'Cebirsel İfadeler', sub_topic: 'Özdeşlikler', learning_outcome: 'Özdeşlikleri kullanır' },
    { subject_id: matematik, grade: 8, unit_number: 5, main_topic: 'Doğrusal Denklemler', sub_topic: 'Birinci Dereceden Denklemler', learning_outcome: 'Birinci dereceden bir bilinmeyenli denklemleri çözer' },
    { subject_id: matematik, grade: 8, unit_number: 6, main_topic: 'Eşitsizlikler', sub_topic: 'Birinci Dereceden Eşitsizlikler', learning_outcome: 'Birinci dereceden bir bilinmeyenli eşitsizlikleri çözer' },
    { subject_id: matematik, grade: 8, unit_number: 7, main_topic: 'Üçgenler', sub_topic: 'Üçgende Açı', learning_outcome: 'Üçgenin iç ve dış açı özelliklerini kullanır' },
    { subject_id: matematik, grade: 8, unit_number: 8, main_topic: 'Dönüşüm Geometrisi', sub_topic: 'Yansıma', learning_outcome: 'Yansımayı açıklar' },
    { subject_id: matematik, grade: 8, unit_number: 9, main_topic: 'Geometrik Cisimler', sub_topic: 'Prizma ve Piramit', learning_outcome: 'Prizma ve piramidin özelliklerini belirler' },
    { subject_id: matematik, grade: 8, unit_number: 10, main_topic: 'Olasılık', sub_topic: 'Olasılık Hesaplama', learning_outcome: 'Basit olayların olma olasılığını hesaplar' },
  ]

  // Türkçe varsa ekle
  if (turkce) {
    sampleTopics.push(
      { subject_id: turkce, grade: 5, unit_number: 1, main_topic: 'Söz Varlığı', sub_topic: 'Kelime Öğrenme', learning_outcome: 'Yeni kelimeler öğrenir ve cümle içinde kullanır' },
      { subject_id: turkce, grade: 5, unit_number: 2, main_topic: 'Dil Bilgisi', sub_topic: 'Sözcük Türleri', learning_outcome: 'Sözcük türlerini ayırt eder' },
      { subject_id: turkce, grade: 8, unit_number: 1, main_topic: 'Söz Varlığı', sub_topic: 'Sözcükte Anlam', learning_outcome: 'Sözcüğün mecaz ve terim anlamını kavrar' },
      { subject_id: turkce, grade: 8, unit_number: 2, main_topic: 'Dil Bilgisi', sub_topic: 'Cümle Ögeleri', learning_outcome: 'Tüm cümle ögelerini belirler' },
      { subject_id: turkce, grade: 8, unit_number: 3, main_topic: 'Anlam Bilgisi', sub_topic: 'Paragraf', learning_outcome: 'Paragrafın ana düşüncesini ve yardımcı düşüncelerini bulur' },
    )
  }

  // Fen varsa ekle
  if (fen) {
    sampleTopics.push(
      { subject_id: fen, grade: 5, unit_number: 1, main_topic: 'Canlılar Dünyası', sub_topic: 'Sindirim Sistemi', learning_outcome: 'Sindirim sistemi organlarını ve görevlerini açıklar' },
      { subject_id: fen, grade: 8, unit_number: 1, main_topic: 'Mevsimler ve İklim', sub_topic: 'Mevsimlerin Oluşumu', learning_outcome: 'Mevsimlerin oluşumunu açıklar' },
      { subject_id: fen, grade: 8, unit_number: 2, main_topic: 'DNA ve Genetik Kod', sub_topic: 'DNA Yapısı', learning_outcome: 'DNA nın yapısını açıklar' },
      { subject_id: fen, grade: 8, unit_number: 3, main_topic: 'Basınç', sub_topic: 'Katı Basıncı', learning_outcome: 'Katı basıncını hesaplar' },
    )
  }

  // Toplu ekle
  const { data, error } = await supabase
    .from('topics')
    .upsert(sampleTopics, { onConflict: 'subject_id,grade,main_topic,sub_topic' })
    .select()

  if (error) {
    console.error('\n❌ Hata:', error.message)
    
    // Tek tek eklemeyi dene
    console.log('\nTek tek ekleme deneniyor...')
    let success = 0
    for (const topic of sampleTopics) {
      const { error: insertError } = await supabase
        .from('topics')
        .insert(topic)
      
      if (!insertError) {
        success++
      }
    }
    console.log(`✅ ${success}/${sampleTopics.length} kazanım eklendi`)
  } else {
    console.log(`\n✅ ${sampleTopics.length} kazanım başarıyla eklendi!`)
  }

  // Sonucu kontrol et
  const { data: count } = await supabase
    .from('topics')
    .select('id', { count: 'exact' })

  console.log(`\n📊 Toplam kazanım sayısı: ${count?.length || 0}`)
}

addSampleTopics()



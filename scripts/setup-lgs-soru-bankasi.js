const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  host: 'aws-1-eu-central-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.cnawnprwdcfmyswqolsu',
  password: 'tofQTPUIRL9cw0Q6',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

// LGS Konu Verileri
const lgsTopics = [
  // =====================================================
  // TÜRKÇE (20 soru)
  // =====================================================
  // Dil Bilgisi
  { subject: 'Türkçe', main_topic: 'Dil Bilgisi', sub_topic: 'Fiilimsiler (İsim-Fiil, Sıfat-Fiil, Zarf-Fiil)', avg_question_count: 2 },
  { subject: 'Türkçe', main_topic: 'Dil Bilgisi', sub_topic: 'Cümlenin Ögeleri', avg_question_count: 2 },
  { subject: 'Türkçe', main_topic: 'Dil Bilgisi', sub_topic: 'Cümle Türleri', avg_question_count: 2 },
  { subject: 'Türkçe', main_topic: 'Dil Bilgisi', sub_topic: 'Fiillerde Çatı', avg_question_count: 1 },
  { subject: 'Türkçe', main_topic: 'Dil Bilgisi', sub_topic: 'Noktalama İşaretleri', avg_question_count: 1 },
  { subject: 'Türkçe', main_topic: 'Dil Bilgisi', sub_topic: 'Yazım Kuralları', avg_question_count: 1 },
  
  // Sözcükte ve Cümlede Anlam
  { subject: 'Türkçe', main_topic: 'Sözcükte Anlam', sub_topic: 'Sözcükte Anlam', avg_question_count: 2 },
  { subject: 'Türkçe', main_topic: 'Cümlede Anlam', sub_topic: 'Cümlede Anlam İlişkileri', avg_question_count: 2 },
  { subject: 'Türkçe', main_topic: 'Cümlede Anlam', sub_topic: 'Cümle Yorumlama', avg_question_count: 1 },
  { subject: 'Türkçe', main_topic: 'Anlatım Bozuklukları', sub_topic: 'Anlatım Bozuklukları', avg_question_count: 1 },
  
  // Metin Türleri ve Söz Sanatları
  { subject: 'Türkçe', main_topic: 'Metin Türleri', sub_topic: 'Fıkra', avg_question_count: 1 },
  { subject: 'Türkçe', main_topic: 'Metin Türleri', sub_topic: 'Makale', avg_question_count: 1 },
  { subject: 'Türkçe', main_topic: 'Metin Türleri', sub_topic: 'Deneme', avg_question_count: 1 },
  { subject: 'Türkçe', main_topic: 'Metin Türleri', sub_topic: 'Roman', avg_question_count: 1 },
  { subject: 'Türkçe', main_topic: 'Metin Türleri', sub_topic: 'Hikâye', avg_question_count: 1 },
  { subject: 'Türkçe', main_topic: 'Söz Sanatları', sub_topic: 'Abartma (Mübalağa)', avg_question_count: 1 },
  { subject: 'Türkçe', main_topic: 'Söz Sanatları', sub_topic: 'Benzetme (Teşbih)', avg_question_count: 1 },
  { subject: 'Türkçe', main_topic: 'Söz Sanatları', sub_topic: 'Kişileştirme (Teşhis)', avg_question_count: 1 },
  { subject: 'Türkçe', main_topic: 'Söz Sanatları', sub_topic: 'Konuşturma (İntak)', avg_question_count: 1 },
  
  // Parçada Anlam
  { subject: 'Türkçe', main_topic: 'Parçada Anlam', sub_topic: 'Paragrafın Anlam Yönü', avg_question_count: 2 },
  { subject: 'Türkçe', main_topic: 'Parçada Anlam', sub_topic: 'Paragrafın Yapı Yönü', avg_question_count: 1 },
  { subject: 'Türkçe', main_topic: 'Parçada Anlam', sub_topic: 'Tablo ve Grafik İnceleme', avg_question_count: 1 },
  { subject: 'Türkçe', main_topic: 'Parçada Anlam', sub_topic: 'Görsel Yorumlama', avg_question_count: 1 },
  { subject: 'Türkçe', main_topic: 'Parçada Anlam', sub_topic: 'Sözel Mantık (Akıl Yürütme)', avg_question_count: 1 },

  // =====================================================
  // MATEMATİK (20 soru)
  // =====================================================
  // Sayılar ve İşlemler
  { subject: 'Matematik', main_topic: 'Sayılar ve İşlemler', sub_topic: 'Çarpanlar ve Katlar', avg_question_count: 2 },
  { subject: 'Matematik', main_topic: 'Sayılar ve İşlemler', sub_topic: 'Üslü İfadeler', avg_question_count: 2 },
  { subject: 'Matematik', main_topic: 'Sayılar ve İşlemler', sub_topic: 'Kareköklü İfadeler', avg_question_count: 2 },
  
  // Cebir
  { subject: 'Matematik', main_topic: 'Cebir', sub_topic: 'Cebirsel İfadeler ve Özdeşlikler', avg_question_count: 2 },
  { subject: 'Matematik', main_topic: 'Cebir', sub_topic: 'Doğrusal Denklemler', avg_question_count: 2 },
  { subject: 'Matematik', main_topic: 'Cebir', sub_topic: 'Eşitsizlikler', avg_question_count: 1 },
  
  // Geometri
  { subject: 'Matematik', main_topic: 'Geometri', sub_topic: 'Üçgenler', avg_question_count: 3 },
  { subject: 'Matematik', main_topic: 'Geometri', sub_topic: 'Eşlik ve Benzerlik', avg_question_count: 2 },
  { subject: 'Matematik', main_topic: 'Geometri', sub_topic: 'Dönüşüm Geometrisi', avg_question_count: 1 },
  { subject: 'Matematik', main_topic: 'Geometri', sub_topic: 'Geometrik Cisimler', avg_question_count: 2 },
  
  // Veri ve Olasılık
  { subject: 'Matematik', main_topic: 'Veri İşleme', sub_topic: 'Veri Analizi', avg_question_count: 1 },
  { subject: 'Matematik', main_topic: 'Olasılık', sub_topic: 'Basit Olasılık', avg_question_count: 2 },

  // =====================================================
  // FEN BİLİMLERİ (20 soru)
  // =====================================================
  { subject: 'Fen Bilimleri', main_topic: 'Mevsimler ve İklimler', sub_topic: 'Mevsimler ve İklimler', avg_question_count: 2 },
  { subject: 'Fen Bilimleri', main_topic: 'DNA ve Genetik Kod', sub_topic: 'DNA ve Genetik Kod', avg_question_count: 3 },
  { subject: 'Fen Bilimleri', main_topic: 'Basınç', sub_topic: 'Basınç', avg_question_count: 2 },
  { subject: 'Fen Bilimleri', main_topic: 'Madde ve Endüstri', sub_topic: 'Periyodik Sistem', avg_question_count: 2 },
  { subject: 'Fen Bilimleri', main_topic: 'Madde ve Endüstri', sub_topic: 'Fiziksel ve Kimyasal Değişimler', avg_question_count: 2 },
  { subject: 'Fen Bilimleri', main_topic: 'Madde ve Endüstri', sub_topic: 'Asitler ve Bazlar', avg_question_count: 2 },
  { subject: 'Fen Bilimleri', main_topic: 'Basit Makineler', sub_topic: 'Basit Makineler', avg_question_count: 2 },
  { subject: 'Fen Bilimleri', main_topic: 'Canlılar ve Enerji İlişkileri', sub_topic: 'Canlılar ve Enerji İlişkileri', avg_question_count: 2 },
  { subject: 'Fen Bilimleri', main_topic: 'Enerji Dönüşümleri', sub_topic: 'Enerji Dönüşümleri ve Çevre Bilimi', avg_question_count: 1 },
  { subject: 'Fen Bilimleri', main_topic: 'Elektrik', sub_topic: 'Elektrik Yükleri ve Elektrik Enerjisi', avg_question_count: 2 },

  // =====================================================
  // T.C. İNKILAP TARİHİ (10 soru)
  // =====================================================
  { subject: 'İnkılap Tarihi', main_topic: 'Bir Kahraman Doğuyor', sub_topic: 'Mustafa Kemal\'in Çocukluğu ve Eğitimi', avg_question_count: 1 },
  { subject: 'İnkılap Tarihi', main_topic: 'Milli Uyanış', sub_topic: 'Bağımsızlık Yolunda Atılan Adımlar', avg_question_count: 2 },
  { subject: 'İnkılap Tarihi', main_topic: 'Milli Mücadele', sub_topic: 'Ya İstiklal Ya Ölüm', avg_question_count: 2 },
  { subject: 'İnkılap Tarihi', main_topic: 'Çağdaş Türkiye', sub_topic: 'Çağdaş Türkiye Yolunda Adımlar', avg_question_count: 1 },
  { subject: 'İnkılap Tarihi', main_topic: 'Demokratikleşme', sub_topic: 'Demokratikleşme Çabaları', avg_question_count: 1 },
  { subject: 'İnkılap Tarihi', main_topic: 'Atatürkçülük', sub_topic: 'Atatürk İlkeleri', avg_question_count: 1 },
  { subject: 'İnkılap Tarihi', main_topic: 'Dış Politika', sub_topic: 'Atatürk Dönemi Türk Dış Politikası', avg_question_count: 1 },
  { subject: 'İnkılap Tarihi', main_topic: 'II. Dünya Savaşı', sub_topic: 'İkinci Dünya Savaşı ve Sonrası', avg_question_count: 1 },

  // =====================================================
  // DİN KÜLTÜRÜ (10 soru)
  // =====================================================
  { subject: 'Din Kültürü', main_topic: 'Kader İnancı', sub_topic: 'Kader ve Kaza İnancı', avg_question_count: 1 },
  { subject: 'Din Kültürü', main_topic: 'Kader İnancı', sub_topic: 'Kader ve Evrendeki Yasalar', avg_question_count: 1 },
  { subject: 'Din Kültürü', main_topic: 'Kader İnancı', sub_topic: 'İnsanın İradesi ve Kader', avg_question_count: 1 },
  { subject: 'Din Kültürü', main_topic: 'Kader İnancı', sub_topic: 'Kaderle İlgili Kavramlar', avg_question_count: 1 },
  { subject: 'Din Kültürü', main_topic: 'Zekat ve Sadaka', sub_topic: 'İslam\'ın Paylaşmaya Verdiği Önem', avg_question_count: 1 },
  { subject: 'Din Kültürü', main_topic: 'Zekat ve Sadaka', sub_topic: 'Zekat ve Sadaka İbadeti', avg_question_count: 1 },
  { subject: 'Din Kültürü', main_topic: 'Zekat ve Sadaka', sub_topic: 'Zekat ve Sadakanın Faydaları', avg_question_count: 1 },
  { subject: 'Din Kültürü', main_topic: 'Din ve Hayat', sub_topic: 'Din, Birey ve Toplum', avg_question_count: 1 },
  { subject: 'Din Kültürü', main_topic: 'Din ve Hayat', sub_topic: 'Dinin Temel Gayesi', avg_question_count: 1 },
  { subject: 'Din Kültürü', main_topic: 'Hz. Muhammed\'in Örnekliği', sub_topic: 'Hz. Muhammed\'in Ahlaki Özellikleri', avg_question_count: 1 },
  { subject: 'Din Kültürü', main_topic: 'Kur\'an-ı Kerim', sub_topic: 'Kur\'an-ı Kerim\'in Temel Özellikleri', avg_question_count: 1 },
  { subject: 'Din Kültürü', main_topic: 'Peygamberler', sub_topic: 'Hz. Musa', avg_question_count: 1 },

  // =====================================================
  // İNGİLİZCE (10 soru)
  // =====================================================
  { subject: 'İngilizce', main_topic: 'Friendship', sub_topic: 'Friendship', avg_question_count: 2 },
  { subject: 'İngilizce', main_topic: 'Teen Life', sub_topic: 'Teen Life', avg_question_count: 1 },
  { subject: 'İngilizce', main_topic: 'In the Kitchen', sub_topic: 'In the Kitchen', avg_question_count: 1 },
  { subject: 'İngilizce', main_topic: 'On the Phone', sub_topic: 'On the Phone', avg_question_count: 1 },
  { subject: 'İngilizce', main_topic: 'The Internet', sub_topic: 'The Internet', avg_question_count: 1 },
  { subject: 'İngilizce', main_topic: 'Adventures', sub_topic: 'Adventures', avg_question_count: 1 },
  { subject: 'İngilizce', main_topic: 'Tourism', sub_topic: 'Tourism', avg_question_count: 1 },
  { subject: 'İngilizce', main_topic: 'Chores', sub_topic: 'Chores', avg_question_count: 1 },
  { subject: 'İngilizce', main_topic: 'Science', sub_topic: 'Science', avg_question_count: 1 },
  { subject: 'İngilizce', main_topic: 'Natural Forces', sub_topic: 'Natural Forces', avg_question_count: 0 },
];

async function setupLgsSoruBankasi() {
  try {
    await client.connect();
    console.log('✅ Veritabanına bağlandı\n');

    // SQL dosyasını oku ve çalıştır
    console.log('📋 Tablolar oluşturuluyor...');
    const sqlPath = path.join(__dirname, '..', 'supabase', 'lgs-soru-bankasi.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // SQL'i parçalara ayır ve çalıştır
    const statements = sql.split(';').filter(s => s.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await client.query(statement);
        } catch (err) {
          // Bazı hatalar normal (örn: zaten var)
          if (!err.message.includes('already exists') && !err.message.includes('duplicate key')) {
            console.log(`⚠️ SQL uyarı: ${err.message.substring(0, 100)}`);
          }
        }
      }
    }
    console.log('✅ Tablolar oluşturuldu\n');

    // Mevcut konuları kontrol et
    const { rows: existingTopics } = await client.query('SELECT COUNT(*) FROM lgs_topics');
    if (parseInt(existingTopics[0].count) > 0) {
      console.log(`ℹ️ Mevcut ${existingTopics[0].count} konu bulundu. Siliniyor...`);
      await client.query('DELETE FROM lgs_topics');
    }

    // Konuları ekle
    console.log('📚 LGS konuları ekleniyor...');
    let addedCount = 0;
    
    for (const topic of lgsTopics) {
      await client.query(
        `INSERT INTO lgs_topics (subject, main_topic, sub_topic, avg_question_count) 
         VALUES ($1, $2, $3, $4)`,
        [topic.subject, topic.main_topic, topic.sub_topic, topic.avg_question_count]
      );
      addedCount++;
    }
    
    console.log(`✅ ${addedCount} konu eklendi\n`);

    // Özet
    const { rows: summary } = await client.query(`
      SELECT subject, COUNT(*) as topic_count, SUM(avg_question_count) as total_questions
      FROM lgs_topics
      GROUP BY subject
      ORDER BY subject
    `);

    console.log('📊 Konu Özeti:');
    console.log('─'.repeat(50));
    let totalTopics = 0;
    let totalQuestions = 0;
    for (const row of summary) {
      console.log(`  ${row.subject}: ${row.topic_count} konu, ~${row.total_questions} soru`);
      totalTopics += parseInt(row.topic_count);
      totalQuestions += parseInt(row.total_questions);
    }
    console.log('─'.repeat(50));
    console.log(`  TOPLAM: ${totalTopics} konu, ~${totalQuestions} soru`);

    console.log('\n🎉 LGS Soru Bankası kurulumu tamamlandı!');

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await client.end();
  }
}

setupLgsSoruBankasi();


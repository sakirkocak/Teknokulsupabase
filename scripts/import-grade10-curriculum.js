// 10. Sınıf Türkiye Yüzyılı Maarif Modeli Müfredat Kazanımları Import Script (2025-2026)
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 10. Sınıf Maarif Modeli - YKS/TYT Hazırlık (5 şıklı sorular!)
const grade10Topics = [
  // ==================== TÜRK DİLİ VE EDEBİYATI (4 Tema) ====================
  // Tema 1: Sözün Ezgisi (Sözlü Kültür)
  { subject: 'Türk Dili ve Edebiyatı', unit: 1, main: 'Sözün Ezgisi', sub: 'Koşuk', outcome: 'İslamiyet öncesi koşuk türünü inceler' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 1, main: 'Sözün Ezgisi', sub: 'Türkü', outcome: 'Halk edebiyatı türkü türünü ve ahengini analiz eder' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 1, main: 'Sözün Ezgisi', sub: 'Koşma', outcome: 'Koşma türünün özelliklerini inceler' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 1, main: 'Sözün Ezgisi', sub: 'Metin üretimi', outcome: 'Masalı film şeridine dönüştürerek çok modlu metin üretir' },
  
  // Tema 2: Kelimelerin Ritmi (Şiir Estetiği)
  { subject: 'Türk Dili ve Edebiyatı', unit: 2, main: 'Kelimelerin Ritmi', sub: 'Gazel', outcome: 'Divan şiiri gazel türünü inceler' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 2, main: 'Kelimelerin Ritmi', sub: 'Saf Şiir', outcome: 'Cumhuriyet dönemi saf şiir anlayışını analiz eder' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 2, main: 'Kelimelerin Ritmi', sub: 'Kaside', outcome: 'Kaside türünün özelliklerini kavrar' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 2, main: 'Kelimelerin Ritmi', sub: 'Podcast hazırlama', outcome: 'Şairlerin edebi kişiliklerini tanıtan podcast hazırlar' },
  
  // Tema 3: Dünden Bugüne (Epik Anlatı)
  { subject: 'Türk Dili ve Edebiyatı', unit: 3, main: 'Dünden Bugüne', sub: 'Destan', outcome: 'Türk destanlarının milli kimlik inşasındaki rolünü irdeler' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 3, main: 'Dünden Bugüne', sub: 'Mesnevi', outcome: 'Mesnevi türünün özelliklerini inceler' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 3, main: 'Dünden Bugüne', sub: 'Halk Hikâyesi', outcome: 'Halk hikâyesi türünün özelliklerini kavrar' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 3, main: 'Dünden Bugüne', sub: 'Modern fabl', outcome: 'Güncel bir sorunu ele alan modern fabl yazar' },
  
  // Tema 4: Nesillerin Mirası (Kültürel Kodlar)
  { subject: 'Türk Dili ve Edebiyatı', unit: 4, main: 'Nesillerin Mirası', sub: 'Dede Korkut', outcome: 'Dede Korkut Hikâyelerini analiz eder' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 4, main: 'Nesillerin Mirası', sub: 'Tanzimat şiiri', outcome: 'Tanzimat dönemi şiirinin özelliklerini inceler' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 4, main: 'Nesillerin Mirası', sub: 'Servetifünun romanı', outcome: 'Servetifünun romanının özelliklerini analiz eder' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 4, main: 'Nesillerin Mirası', sub: 'Dramatizasyon', outcome: 'Dede Korkut hikâyelerini sınıfta canlandırır' },

  // ==================== MATEMATİK (7 Tema) ====================
  { subject: 'Matematik', unit: 1, main: 'Sayılar', sub: 'Reel sayı sistemi', outcome: 'Reel sayı sisteminin aksiyomatik yapısını inceler' },
  { subject: 'Matematik', unit: 1, main: 'Sayılar', sub: 'Sayı kümeleri', outcome: 'Sayı kümeleri arasındaki ilişkileri analiz eder' },
  { subject: 'Matematik', unit: 2, main: 'Fonksiyonlar', sub: 'Fonksiyon kavramı', outcome: 'Fonksiyonu değişimin matematiği olarak kavrar' },
  { subject: 'Matematik', unit: 2, main: 'Fonksiyonlar', sub: 'Günlük hayat modeli', outcome: 'Bağımlı-bağımsız değişken ilişkilerini modelller' },
  { subject: 'Matematik', unit: 2, main: 'Fonksiyonlar', sub: 'Fonksiyon grafikleri', outcome: 'Fonksiyon grafiklerini çizer ve yorumlar' },
  { subject: 'Matematik', unit: 3, main: 'Sayma-Algoritma', sub: 'Permütasyon', outcome: 'Permütasyon hesaplamalarını yapar' },
  { subject: 'Matematik', unit: 3, main: 'Sayma-Algoritma', sub: 'Kombinasyon', outcome: 'Kombinasyon hesaplamalarını yapar' },
  { subject: 'Matematik', unit: 3, main: 'Sayma-Algoritma', sub: 'Algoritmik süreçler', outcome: 'Sayma problemlerinde algoritmik süreçleri uygular' },
  { subject: 'Matematik', unit: 4, main: 'Geometri', sub: 'Katı cisimler', outcome: 'Katı cisimlerin özelliklerini inceler' },
  { subject: 'Matematik', unit: 4, main: 'Geometri', sub: 'Düzlem geometrisi', outcome: 'Düzlem geometrisi problemlerini çözer' },
  { subject: 'Matematik', unit: 4, main: 'Geometri', sub: 'Uzamsal düşünme', outcome: 'Uzamsal düşünme becerilerini geliştirir' },
  { subject: 'Matematik', unit: 5, main: 'Analitik Geometri', sub: 'Doğrunun analitiği', outcome: 'Doğrunun analitik denklemini bulur' },
  { subject: 'Matematik', unit: 5, main: 'Analitik Geometri', sub: 'Koordinat modelleme', outcome: 'Koordinat sisteminde modelleme çalışmaları yapar' },
  { subject: 'Matematik', unit: 6, main: 'İstatistik', sub: 'Veri toplama', outcome: 'Proje tabanlı veri toplama ve düzenleme yapar' },
  { subject: 'Matematik', unit: 6, main: 'İstatistik', sub: 'Veri analizi', outcome: 'Verileri analiz eder ve yorumlar' },
  { subject: 'Matematik', unit: 7, main: 'Olasılık', sub: 'Olasılık kuramı', outcome: 'Olasılık kuramını karar verme aracı olarak kullanır' },

  // ==================== FİZİK (4 Ünite) ====================
  { subject: 'Fizik', unit: 1, main: 'Kuvvet ve Hareket', sub: 'Sabit hızlı hareket', outcome: 'Sabit hızlı hareketi grafik ve denklemlerle analiz eder' },
  { subject: 'Fizik', unit: 1, main: 'Kuvvet ve Hareket', sub: 'İvmeli hareket', outcome: 'İvmeli hareket grafiklerini analiz eder' },
  { subject: 'Fizik', unit: 1, main: 'Kuvvet ve Hareket', sub: 'Atışlar', outcome: 'Serbest düşme ve atış hareketlerini inceler' },
  { subject: 'Fizik', unit: 1, main: 'Kuvvet ve Hareket', sub: 'Newton yasaları', outcome: 'Newton yasalarını deneylerle keşfeder' },
  { subject: 'Fizik', unit: 2, main: 'Enerji', sub: 'Mekanik enerji', outcome: 'Kinetik ve potansiyel enerji kavramlarını inceler' },
  { subject: 'Fizik', unit: 2, main: 'Enerji', sub: 'İş-güç ilişkisi', outcome: 'İş-güç-enerji ilişkisini hesaplar' },
  { subject: 'Fizik', unit: 2, main: 'Enerji', sub: 'Enerji verimliliği', outcome: 'Enerji verimliliği raporları hazırlar' },
  { subject: 'Fizik', unit: 2, main: 'Enerji', sub: 'Yenilenebilir enerji', outcome: 'Yenilenebilir enerji kaynaklarını değerlendirir' },
  { subject: 'Fizik', unit: 3, main: 'Elektrik', sub: 'Devre analizi', outcome: 'Elektrik devrelerini analiz eder' },
  { subject: 'Fizik', unit: 3, main: 'Elektrik', sub: 'Ohm yasası', outcome: 'Ohm yasasını uygular ve hesaplamalar yapar' },
  { subject: 'Fizik', unit: 3, main: 'Elektrik', sub: 'Manyetizma', outcome: 'Manyetizma ve elektromanyetik indüksiyon kavramlarını öğrenir' },
  { subject: 'Fizik', unit: 3, main: 'Elektrik', sub: 'Elektrik güvenliği', outcome: 'Topraklama ve elektrik güvenliğini kavrar' },
  { subject: 'Fizik', unit: 4, main: 'Dalgalar', sub: 'Dalga mekaniği', outcome: 'Dalga mekaniği ve dalga özelliklerini inceler' },
  { subject: 'Fizik', unit: 4, main: 'Dalgalar', sub: 'Ses dalgaları', outcome: 'Ses dalgalarının özelliklerini analiz eder' },
  { subject: 'Fizik', unit: 4, main: 'Dalgalar', sub: 'Deprem dalgaları', outcome: 'Deprem ve rezonans kavramını hayati beceri olarak öğrenir' },
  { subject: 'Fizik', unit: 4, main: 'Dalgalar', sub: 'Yapı tasarımı', outcome: 'Depreme dayanıklı yapı modelleri tasarlar' },

  // ==================== KİMYA (3 Tema) ====================
  { subject: 'Kimya', unit: 1, main: 'Etkileşim', sub: 'Kimyasal tepkimeler', outcome: 'Kimyasal tepkime türlerini inceler' },
  { subject: 'Kimya', unit: 1, main: 'Etkileşim', sub: 'Mol kavramı', outcome: 'Mol kavramını operasyonel araç olarak kullanır' },
  { subject: 'Kimya', unit: 1, main: 'Etkileşim', sub: 'Gaz yasaları', outcome: 'Gaz yasalarını ve ideal gaz denklemini uygular' },
  { subject: 'Kimya', unit: 2, main: 'Çeşitlilik', sub: 'Karışımlar', outcome: 'Karışım türlerini ve çözünme sürecini inceler' },
  { subject: 'Kimya', unit: 2, main: 'Çeşitlilik', sub: 'Asit-Baz-Tuz', outcome: 'Asit, baz ve tuz özelliklerini inceler' },
  { subject: 'Kimya', unit: 2, main: 'Çeşitlilik', sub: 'Koligatif özellikler', outcome: 'Çözeltilerin koligatif özelliklerini günlük hayatla ilişkilendirir' },
  { subject: 'Kimya', unit: 3, main: 'Sürdürülebilirlik', sub: 'Atom ekonomisi', outcome: 'Atom ekonomisi ve yeşil kimya prensiplerini öğrenir' },
  { subject: 'Kimya', unit: 3, main: 'Sürdürülebilirlik', sub: 'Karbon-su ayak izi', outcome: 'Karbon ve su ayak izi kavramlarını hesaplar' },
  { subject: 'Kimya', unit: 3, main: 'Sürdürülebilirlik', sub: 'Çevre kimyası', outcome: 'Sera etkisi ve asit yağmurlarına çözüm önerileri geliştirir' },

  // ==================== BİYOLOJİ (2 Tema) ====================
  { subject: 'Biyoloji', unit: 1, main: 'Enerji', sub: 'Canlılık ve enerji', outcome: 'Canlılarda enerji dönüşümlerini kavrar' },
  { subject: 'Biyoloji', unit: 1, main: 'Enerji', sub: 'Enzimler', outcome: 'Enzimlerin yapısını ve işlevini derinlemesine inceler' },
  { subject: 'Biyoloji', unit: 1, main: 'Enerji', sub: 'Fotosentez', outcome: 'Fotosentez sürecini ve etkileyen faktörleri analiz eder' },
  { subject: 'Biyoloji', unit: 1, main: 'Enerji', sub: 'Kemosentez', outcome: 'Kemosentez sürecini açıklar' },
  { subject: 'Biyoloji', unit: 1, main: 'Enerji', sub: 'Hücresel solunum', outcome: 'Hücresel solunum ve ATP üretimini inceler' },
  { subject: 'Biyoloji', unit: 1, main: 'Enerji', sub: 'Fermantasyon', outcome: 'Fermantasyon sürecini geleneksel biyoteknoloji ile deneyimler' },
  { subject: 'Biyoloji', unit: 2, main: 'Ekoloji', sub: 'Ekosistem', outcome: 'Ekosistem ekolojisinin temel kavramlarını öğrenir' },
  { subject: 'Biyoloji', unit: 2, main: 'Ekoloji', sub: 'Madde döngüleri', outcome: 'Su, karbon, azot döngülerini analiz eder' },
  { subject: 'Biyoloji', unit: 2, main: 'Ekoloji', sub: 'Biyoçeşitlilik', outcome: 'Biyolojik çeşitliliğin önemini kavrar' },
  { subject: 'Biyoloji', unit: 2, main: 'Ekoloji', sub: 'Sürdürülebilirlik projesi', outcome: 'Atık yönetimi ve sürdürülebilirlik projesi geliştirir' },

  // ==================== BİLGİSAYAR BİLİMİ ====================
  { subject: 'Bilişim Teknolojileri', unit: 1, main: 'Etik ve Güvenlik', sub: 'Dijital ayak izi', outcome: 'Dijital ayak izi ve siber zorbalık kavramlarını öğrenir' },
  { subject: 'Bilişim Teknolojileri', unit: 1, main: 'Etik ve Güvenlik', sub: 'Bilgi güvenliği', outcome: 'Bilgi güvenliği ve etik değerleri kavrar' },
  { subject: 'Bilişim Teknolojileri', unit: 2, main: 'Problem Çözme', sub: 'Akış şemaları', outcome: 'Akış şemaları ve sözde kod yazımı yapar' },
  { subject: 'Bilişim Teknolojileri', unit: 2, main: 'Problem Çözme', sub: 'Algoritmalar', outcome: 'Problem çözme algoritmalarını tasarlar' },
  { subject: 'Bilişim Teknolojileri', unit: 3, main: 'Python', sub: 'Değişkenler ve veri tipleri', outcome: 'Python\'da değişkenler ve veri tiplerini kullanır' },
  { subject: 'Bilişim Teknolojileri', unit: 3, main: 'Python', sub: 'Döngüler ve koşullar', outcome: 'Döngüler ve koşul yapılarını uygular' },
  { subject: 'Bilişim Teknolojileri', unit: 3, main: 'Python', sub: 'Fonksiyonlar', outcome: 'Fonksiyon tanımlama ve kullanmayı öğrenir' },
  { subject: 'Bilişim Teknolojileri', unit: 4, main: 'Robotik', sub: 'Yazılım-donanım', outcome: 'Yazılımın donanımla etkileşimini kavrar' },
  { subject: 'Bilişim Teknolojileri', unit: 4, main: 'Robotik', sub: 'Sensörler', outcome: 'Sensör kullanımı ve robotik kodlama yapar' },

  // ==================== TARİH (3 Ünite) ====================
  { subject: 'Tarih', unit: 1, main: 'Türkistan\'dan Türkiye\'ye', sub: 'Malazgirt Zaferi', outcome: 'Malazgirt Zaferi\'nin tarihsel önemini analiz eder' },
  { subject: 'Tarih', unit: 1, main: 'Türkistan\'dan Türkiye\'ye', sub: 'Gönül erleri', outcome: 'Ahmet Yesevi, Mevlana, Hacı Bektaş Veli\'nin rolünü inceler' },
  { subject: 'Tarih', unit: 1, main: 'Türkistan\'dan Türkiye\'ye', sub: 'Ahilik', outcome: 'Ahilik teşkilatını meslek etiği bağlamında öğrenir' },
  { subject: 'Tarih', unit: 2, main: 'Beylikten Devlete', sub: 'Osmanlı kuruluşu', outcome: 'Osmanlı\'nın kuruluş dinamiklerini analiz eder' },
  { subject: 'Tarih', unit: 2, main: 'Beylikten Devlete', sub: 'Gaza ve istimalet', outcome: 'Gaza ruhu ve istimalet politikasını kavrar' },
  { subject: 'Tarih', unit: 2, main: 'Beylikten Devlete', sub: 'İskân politikası', outcome: 'İskân politikasının demografik etkilerini inceler' },
  { subject: 'Tarih', unit: 3, main: 'Cihan Devleti', sub: 'İstanbul\'un fethi', outcome: 'İstanbul\'un fethini ve Fatih\'in vizyonunu analiz eder' },
  { subject: 'Tarih', unit: 3, main: 'Cihan Devleti', sub: 'Klasik çağ', outcome: 'Osmanlı\'nın klasik çağını inceler' },
  { subject: 'Tarih', unit: 3, main: 'Cihan Devleti', sub: 'Avrupa karşılaştırması', outcome: 'Rönesans ve Reform ile Osmanlı\'yı karşılaştırır' },

  // ==================== COĞRAFYA (7 Ünite) ====================
  { subject: 'Coğrafya', unit: 1, main: 'Coğrafya Bilimi', sub: 'Coğrafi bakış', outcome: 'Coğrafi bakış açısını ve alt dalları öğrenir' },
  { subject: 'Coğrafya', unit: 2, main: 'Mekânsal Teknolojiler', sub: 'Harita çizimi', outcome: 'Harita çizimi ve CBS kullanımını uygular' },
  { subject: 'Coğrafya', unit: 2, main: 'Mekânsal Teknolojiler', sub: 'Dijital harita', outcome: 'Kendi yaşam alanının haritasını üretir' },
  { subject: 'Coğrafya', unit: 3, main: 'Doğal Sistemler', sub: 'Levha tektoniği', outcome: 'Levha tektoniği ve iç kuvvetleri inceler' },
  { subject: 'Coğrafya', unit: 3, main: 'Doğal Sistemler', sub: 'Dış kuvvetler', outcome: 'Dış kuvvetlerin yer şekillerine etkisini analiz eder' },
  { subject: 'Coğrafya', unit: 3, main: 'Doğal Sistemler', sub: 'Türkiye jeolojisi', outcome: 'Türkiye\'nin jeolojik yapısını inceler' },
  { subject: 'Coğrafya', unit: 4, main: 'Beşerî Sistemler', sub: 'Nüfus-yerleşme', outcome: 'Nüfus, yerleşme ve göç olaylarını analiz eder' },
  { subject: 'Coğrafya', unit: 5, main: 'Ekonomik Faaliyetler', sub: 'Ekonomik sektörler', outcome: 'Ekonomik sektörleri sınıflandırır ve Türkiye ekonomisini inceler' },
  { subject: 'Coğrafya', unit: 6, main: 'Afetler', sub: 'Afet yönetimi', outcome: 'Afet yönetimi ve dirençli toplum kavramlarını öğrenir' },
  { subject: 'Coğrafya', unit: 7, main: 'Türk Dünyası', sub: 'Kültür ocağı', outcome: 'Türk Dünyası ve kültür ocağı kavramlarını inceler' },
  { subject: 'Coğrafya', unit: 7, main: 'Türk Dünyası', sub: 'Jeopolitik', outcome: 'Türk devletleri arası işbirliği ve jeopolitiği değerlendirir' },

  // ==================== FELSEFE (9 Ünite) ====================
  { subject: 'Felsefe', unit: 1, main: 'Felsefenin Doğası', sub: 'Felsefe nedir?', outcome: 'Felsefenin doğasını ve temel sorularını kavrar' },
  { subject: 'Felsefe', unit: 2, main: 'Mantık', sub: 'Akıl yürütme', outcome: 'Düşünme ve akıl yürütme yöntemlerini öğrenir' },
  { subject: 'Felsefe', unit: 3, main: 'Varlık Felsefesi', sub: 'Varlık problemi', outcome: 'Varlık var mı ve mahiyeti nedir sorularını irdeler' },
  { subject: 'Felsefe', unit: 3, main: 'Varlık Felsefesi', sub: 'Uçan Adam-Cogito', outcome: 'İbni Sina\'nın Uçan Adam ve Descartes\'ın Cogito\'sunu karşılaştırır' },
  { subject: 'Felsefe', unit: 4, main: 'Bilgi Felsefesi', sub: 'Bilgi problemi', outcome: 'Bilgi nedir ve kaynakları nelerdir sorularını analiz eder' },
  { subject: 'Felsefe', unit: 5, main: 'Bilim Felsefesi', sub: 'Bilimin doğası', outcome: 'Bilimin doğasını ve yöntemini sorgular' },
  { subject: 'Felsefe', unit: 6, main: 'Ahlak Felsefesi', sub: 'Etik değerler', outcome: 'Ahlak felsefesinin temel problemlerini inceler' },
  { subject: 'Felsefe', unit: 7, main: 'Din Felsefesi', sub: 'Din ve felsefe', outcome: 'Din felsefesinin temel kavramlarını öğrenir' },
  { subject: 'Felsefe', unit: 8, main: 'Siyaset Felsefesi', sub: 'Devlet ve birey', outcome: 'Siyaset felsefesinin temel sorularını irdeler' },
  { subject: 'Felsefe', unit: 9, main: 'Sanat Felsefesi', sub: 'Estetik', outcome: 'Sanat felsefesi ve estetik kavramlarını inceler' },

  // ==================== DİN KÜLTÜRÜ VE AHLAK BİLGİSİ (5 Ünite) ====================
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 1, main: 'Varlık ve Bilgi', sub: 'Bilgi kaynakları', outcome: 'İslam\'da bilgi kaynaklarını (Sadık Haber, Selim Akıl) öğrenir' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 2, main: 'Allah\'ı Tanımak', sub: 'Esma-i Hüsna', outcome: 'Esma-i Hüsna ve insan hayatındaki yansımalarını kavrar' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 3, main: 'Evrensel Mesajlar', sub: 'Adalet ve barış', outcome: 'İslam\'ın adalet, barış ve özgürlük mesajlarını inceler' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 3, main: 'Evrensel Mesajlar', sub: 'Cihad kavramı', outcome: 'Cihad kavramının barış ve nefisle mücadele boyutunu kavrar' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 4, main: 'Çevre ve Teknoloji', sub: 'Teknoloji etiği', outcome: 'Teknoloji kullanım etiği ve mahremiyeti tartışır' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 4, main: 'Çevre ve Teknoloji', sub: 'Çevre bilinci', outcome: 'İslam perspektifinden çevre bilinci ve israfı inceler' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 5, main: 'İslam Düşüncesi', sub: 'İtikadi mezhepler', outcome: 'İtikadi mezheplerin ortaya çıkışını ve özelliklerini öğrenir' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 5, main: 'İslam Düşüncesi', sub: 'Fıkhi mezhepler', outcome: 'Hanefilik, Şafiilik gibi mezhepleri karşılaştırır' },

  // ==================== İNGİLİZCE (B2.2 Seviyesi) ====================
  { subject: 'İngilizce', unit: 1, main: 'School Life', sub: 'Eğitim sistemleri', outcome: 'Eğitim sistemlerini karşılaştırır ve tartışır' },
  { subject: 'İngilizce', unit: 2, main: 'Classroom Life', sub: 'Öğrenme stilleri', outcome: 'Öğrenme stillerini keşfeder ve tartışır' },
  { subject: 'İngilizce', unit: 3, main: 'Personal Life', sub: 'Sağlıklı yaşam', outcome: 'Sağlıklı yaşam planlaması ve hobiler hakkında konuşur' },
  { subject: 'İngilizce', unit: 4, main: 'Family Life', sub: 'Kuşak çatışması', outcome: 'Kuşak çatışmaları ve aile ilişkilerini tartışır' },
  { subject: 'İngilizce', unit: 5, main: 'Social Life', sub: 'Kent kültürü', outcome: 'Kent kültürü ve sosyal etkinlik planlaması yapar' },
  { subject: 'İngilizce', unit: 6, main: 'Life in the World', sub: 'Medya okuryazarlığı', outcome: 'Medya okuryazarlığı ve kültürlerarası iletişim konuşur' },
  { subject: 'İngilizce', unit: 7, main: 'Global Problems', sub: 'İklim değişikliği', outcome: 'İklim değişikliği ve sürdürülebilirlik konularında münazara yapar' },
  { subject: 'İngilizce', unit: 8, main: 'Future', sub: 'Uzay ve yapay zeka', outcome: 'Geleceğin meslekleri ve yapay zeka hakkında sunum yapar' },

  // ==================== BEDEN EĞİTİMİ VE SPOR ====================
  { subject: 'Beden Eğitimi ve Spor', unit: 1, main: 'Zindelik', sub: 'Yaşam boyu spor', outcome: 'Yaşam boyu spor alışkanlığı geliştirme becerisi kazanır' },
  { subject: 'Beden Eğitimi ve Spor', unit: 2, main: 'Spor Eğitimi', sub: 'Teknik ve taktik', outcome: 'Branşlara özgü teknik ve taktik beceriler geliştirir' },
  { subject: 'Beden Eğitimi ve Spor', unit: 3, main: 'Spor Kültürü', sub: 'Fair Play', outcome: 'Adil oyun ve spor ahlakını içselleştirir' },
  { subject: 'Beden Eğitimi ve Spor', unit: 3, main: 'Spor Kültürü', sub: 'Milli sporcular', outcome: 'Milli sporcuları ve başarılarını tanır' },

  // ==================== GÖRSEL SANATLAR ====================
  { subject: 'Görsel Sanatlar', unit: 1, main: 'Sanata Bakış', sub: 'Sanat felsefesi', outcome: 'Sanat felsefesinin temel kavramlarını inceler' },
  { subject: 'Görsel Sanatlar', unit: 2, main: 'Temel Tasarım', sub: 'Perspektif ve form', outcome: 'Perspektif ve form çalışmaları yapar' },
  { subject: 'Görsel Sanatlar', unit: 3, main: 'Sanat Tarihi', sub: 'Geleneksel sanatlar', outcome: 'Minyatür, ebru gibi geleneksel Türk sanatlarını inceler' },
  { subject: 'Görsel Sanatlar', unit: 4, main: 'Dijital Sanat', sub: 'NFT ve yapay zeka', outcome: 'Dijital sanat, NFT ve yapay zeka ile sanatı inceler' }
];

async function importGrade10Topics() {
  console.log('🎓 10. Sınıf Maarif Modeli Kazanımları Aktarımı Başlıyor...\n');
  console.log('📌 Not: YKS Hazırlık Yılı - Sorular 5 şıklı!\n');
  
  const { data: subjects, error: subjectsError } = await supabase
    .from('subjects')
    .select('id, name');
  
  if (subjectsError) {
    console.error('❌ Dersler alınamadı:', subjectsError.message);
    return;
  }
  
  const subjectMap = {};
  subjects.forEach(s => { subjectMap[s.name] = s.id; });
  
  // Yeni dersleri kontrol et/oluştur
  const newSubjects = [
    { name: 'Felsefe', slug: 'felsefe', code: 'felsefe', category: 'Sosyal Bilimler' }
  ];
  
  for (const subj of newSubjects) {
    if (!subjectMap[subj.name]) {
      const { data: newSubject, error } = await supabase
        .from('subjects')
        .insert({ ...subj, is_active: true })
        .select()
        .single();
      
      if (!error && newSubject) {
        subjectMap[subj.name] = newSubject.id;
        console.log(`✅ ${subj.name} dersi oluşturuldu`);
      }
    }
  }
  
  console.log('📚 Dersler hazır');
  
  const { data: existingTopics } = await supabase
    .from('topics')
    .select('main_topic, sub_topic, subject_id')
    .eq('grade', 10);
  
  const existingSet = new Set(
    (existingTopics || []).map(t => `${t.subject_id}|${t.main_topic}|${t.sub_topic}`)
  );
  
  console.log(`📋 Mevcut 10. sınıf konu sayısı: ${existingSet.size}`);
  
  let added = 0;
  let skipped = 0;
  let errors = [];
  
  for (const topic of grade10Topics) {
    const subjectId = subjectMap[topic.subject];
    
    if (!subjectId) {
      errors.push(`Ders bulunamadı: ${topic.subject}`);
      continue;
    }
    
    const key = `${subjectId}|${topic.main}|${topic.sub}`;
    
    if (existingSet.has(key)) {
      skipped++;
      continue;
    }
    
    const { error } = await supabase
      .from('topics')
      .insert({
        subject_id: subjectId,
        grade: 10,
        unit_number: topic.unit,
        main_topic: topic.main,
        sub_topic: topic.sub,
        learning_outcome: topic.outcome,
        is_active: true
      });
    
    if (error) {
      if (error.message.includes('duplicate')) {
        skipped++;
        existingSet.add(key);
      } else {
        errors.push(`${topic.main}/${topic.sub}: ${error.message}`);
      }
    } else {
      added++;
      existingSet.add(key);
    }
    
    process.stdout.write(`\r⏳ İşleniyor: ${added + skipped + errors.length}/${grade10Topics.length}`);
  }
  
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 10. SINIF MAARİF MODELİ KAZANIMLARI SONUÇ:');
  console.log(`   ✅ Yeni eklenen: ${added}`);
  console.log(`   ⏭️ Zaten mevcut: ${skipped}`);
  console.log(`   📝 Toplam işlenen: ${grade10Topics.length}`);
  
  if (errors.length > 0) {
    console.log(`   ⚠️ Hatalar (${errors.length}):`);
    [...new Set(errors)].slice(0, 5).forEach(e => console.log(`      - ${e}`));
  }
  
  const subjectSummary = {};
  grade10Topics.forEach(t => {
    subjectSummary[t.subject] = (subjectSummary[t.subject] || 0) + 1;
  });
  
  console.log('\n📖 Ders Bazında Dağılım:');
  Object.entries(subjectSummary).sort((a, b) => b[1] - a[1]).forEach(([subject, count]) => {
    console.log(`   ${subject}: ${count} kazanım`);
  });
  
  console.log('\n🎯 YKS/TYT Temel Dersler:');
  const yksTemel = ['Türk Dili ve Edebiyatı', 'Matematik', 'Tarih', 'Coğrafya', 'Felsefe'];
  yksTemel.forEach(s => {
    const count = subjectSummary[s] || 0;
    console.log(`   ${s}: ${count} kazanım`);
  });
  
  console.log('\n🔬 YKS/AYT Fen Dersleri:');
  const aytFen = ['Fizik', 'Kimya', 'Biyoloji'];
  aytFen.forEach(s => {
    const count = subjectSummary[s] || 0;
    console.log(`   ${s}: ${count} kazanım`);
  });
  
  console.log('='.repeat(60));
}

importGrade10Topics()
  .then(() => {
    console.log('\n✅ 10. Sınıf müfredatı aktarımı tamamlandı!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Kritik hata:', err);
    process.exit(1);
  });



// 12. Sınıf Türkiye Yüzyılı Maarif Modeli Müfredat Kazanımları Import Script (2025-2026)
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 12. Sınıf YKS/AYT Final Yılı - 5 şıklı sorular!
const grade12Topics = [
  // ==================== TÜRK DİLİ VE EDEBİYATI ====================
  // Giriş
  { subject: 'Türk Dili ve Edebiyatı', unit: 1, main: 'Giriş', sub: 'Edebiyat-felsefe', outcome: 'Edebiyat-felsefe ilişkisini analiz eder' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 1, main: 'Giriş', sub: 'Edebiyat-psikoloji', outcome: 'Edebiyat-psikoloji/psikiyatri ilişkisini inceler' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 1, main: 'Giriş', sub: 'Dilin değişimi', outcome: 'Dilin tarihsel değişimini kavrar' },
  
  // Hikâye
  { subject: 'Türk Dili ve Edebiyatı', unit: 2, main: 'Hikâye', sub: 'Minimalist hikâye', outcome: 'Küçürek (minimal) hikâye türünü inceler' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 2, main: 'Hikâye', sub: 'Modernist hikâye', outcome: 'Bilinç akışı ve iç çözümleme tekniklerini analiz eder' },
  
  // Şiir
  { subject: 'Türk Dili ve Edebiyatı', unit: 3, main: 'Şiir', sub: 'Saf şiir', outcome: 'Saf şiir anlayışını inceler' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 3, main: 'Şiir', sub: '1980 sonrası şiir', outcome: '1980 sonrası şiirde bireyselleşme ve gelenekten yararlanmayı analiz eder' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 3, main: 'Şiir', sub: 'İmge analizi', outcome: 'Şiirde imge ve kapalı anlatım tekniklerini irdeler' },
  
  // Roman
  { subject: 'Türk Dili ve Edebiyatı', unit: 4, main: 'Roman', sub: 'Postmodern roman', outcome: 'Üstkurmaca, metinlerarasılık ve pastiş tekniklerini analiz eder' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 4, main: 'Roman', sub: 'Büyülü gerçekçilik', outcome: 'Büyülü gerçekçilik anlayışını ve örneklerini inceler' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 4, main: 'Roman', sub: '1980 sonrası roman', outcome: '1980 sonrası Türk romanının evrenselleşme sürecini değerlendirir' },
  
  // Tiyatro
  { subject: 'Türk Dili ve Edebiyatı', unit: 5, main: 'Tiyatro', sub: 'Absürt-epik tiyatro', outcome: 'Absürt ve epik tiyatro örneklerini analiz eder' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 5, main: 'Tiyatro', sub: '1950 sonrası', outcome: '1950 sonrası Türk tiyatrosunun gelişimini inceler' },
  
  // Deneme-Söylev
  { subject: 'Türk Dili ve Edebiyatı', unit: 6, main: 'Deneme-Söylev', sub: 'Deneme yazarları', outcome: 'Cumhuriyet dönemi deneme yazarlarını tanır' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 6, main: 'Deneme-Söylev', sub: 'Nutuk', outcome: 'Nutuk ve retorik sanatını analiz eder' },

  // ==================== MATEMATİK (AYT Kritik - Calculus) ====================
  // Üstel ve Logaritma
  { subject: 'Matematik', unit: 1, main: 'Üstel Fonksiyonlar', sub: 'Üstel büyüme', outcome: 'Üstel büyüme ve azalma modellerini uygular' },
  { subject: 'Matematik', unit: 1, main: 'Üstel Fonksiyonlar', sub: 'e sayısı', outcome: 'Euler sayısı (e) ve doğal logaritmayı kavrar' },
  { subject: 'Matematik', unit: 1, main: 'Logaritma', sub: 'Logaritma kuralları', outcome: 'Logaritma kuralları ve uygulamalarını yapar' },
  { subject: 'Matematik', unit: 1, main: 'Logaritma', sub: 'Gerçek hayat modelleri', outcome: 'pH, Richter ölçeği gibi logaritmik modelleri uygular' },
  
  // Diziler ve Seriler
  { subject: 'Matematik', unit: 2, main: 'Diziler', sub: 'Aritmetik dizi', outcome: 'Aritmetik dizinin genel terim ve toplam formülünü uygular' },
  { subject: 'Matematik', unit: 2, main: 'Diziler', sub: 'Geometrik dizi', outcome: 'Geometrik dizinin genel terim ve toplam formülünü uygular' },
  { subject: 'Matematik', unit: 2, main: 'Diziler', sub: 'Fibonacci', outcome: 'Fibonacci dizisi ve Altın Oranı inceler' },
  
  // Limit
  { subject: 'Matematik', unit: 3, main: 'Limit', sub: 'Limit kavramı', outcome: 'Fonksiyonlarda limit kavramını ve yaklaşma mantığını kavrar' },
  { subject: 'Matematik', unit: 3, main: 'Limit', sub: 'Belirsizlik', outcome: '0/0 belirsizliğinde cebirsel yöntemler uygular' },
  { subject: 'Matematik', unit: 3, main: 'Süreklilik', sub: 'Süreklilik şartları', outcome: 'Fonksiyonun sürekliliğini matematiksel olarak tanımlar' },
  
  // Türev
  { subject: 'Matematik', unit: 4, main: 'Türev', sub: 'Türev tanımı', outcome: 'Türevi teğetin eğimi ve anlık değişim olarak tanımlar' },
  { subject: 'Matematik', unit: 4, main: 'Türev', sub: 'Türev kuralları', outcome: 'Polinom, trigonometrik, üstel fonksiyonların türevini alır' },
  { subject: 'Matematik', unit: 4, main: 'Türev', sub: 'Zincir kuralı', outcome: 'Bileşke fonksiyonlarda zincir kuralını uygular' },
  { subject: 'Matematik', unit: 4, main: 'Türev Uygulamaları', sub: 'Optimizasyon', outcome: 'Türev ile maksimum-minimum problemleri çözer' },
  { subject: 'Matematik', unit: 4, main: 'Türev Uygulamaları', sub: 'Grafik çizimi', outcome: 'Türev yardımıyla fonksiyon grafiklerini çizer' },
  
  // İntegral
  { subject: 'Matematik', unit: 5, main: 'İntegral', sub: 'Riemann toplamı', outcome: 'Eğri altı alanı Riemann toplamı ile kavrar' },
  { subject: 'Matematik', unit: 5, main: 'İntegral', sub: 'Belirsiz integral', outcome: 'Belirsiz integral (antitürev) hesaplar' },
  { subject: 'Matematik', unit: 5, main: 'İntegral', sub: 'Belirli integral', outcome: 'Belirli integral ile eğrisel bölgelerin alanını hesaplar' },

  // ==================== FİZİK (AYT - Modern Fizik) ====================
  // Çembersel Hareket
  { subject: 'Fizik', unit: 1, main: 'Çembersel Hareket', sub: 'Kinematik', outcome: 'Periyot, frekans ve açısal hızı hesaplar' },
  { subject: 'Fizik', unit: 1, main: 'Çembersel Hareket', sub: 'Merkezcil kuvvet', outcome: 'Merkezcil kuvvet ve viraj problemlerini çözer' },
  { subject: 'Fizik', unit: 1, main: 'Kütle Çekimi', sub: 'Kepler yasaları', outcome: 'Gezegen hareketi ve uydu mekaniğini analiz eder' },
  { subject: 'Fizik', unit: 1, main: 'Dönme Hareketi', sub: 'Açısal momentum', outcome: 'Açısal momentumun korunumunu kavrar' },
  
  // Basit Harmonik Hareket
  { subject: 'Fizik', unit: 2, main: 'Harmonik Hareket', sub: 'Yay sarkacı', outcome: 'Yay sarkacının periyodunu ve enerjisini hesaplar' },
  { subject: 'Fizik', unit: 2, main: 'Harmonik Hareket', sub: 'Basit sarkaç', outcome: 'Basit sarkacın periyodunu etkileyen faktörleri analiz eder' },
  
  // Dalga Mekaniği
  { subject: 'Fizik', unit: 3, main: 'Dalga Mekaniği', sub: 'Young deneyi', outcome: 'Işığın dalga doğasını Young deneyi ile kanıtlar' },
  { subject: 'Fizik', unit: 3, main: 'Dalga Mekaniği', sub: 'Girişim-kırınım', outcome: 'Girişim ve kırınım olaylarını analiz eder' },
  { subject: 'Fizik', unit: 3, main: 'Dalga Mekaniği', sub: 'Doppler olayı', outcome: 'Ses ve ışıkta Doppler frekans kaymasını kavrar' },
  
  // Modern Fizik
  { subject: 'Fizik', unit: 4, main: 'Özel Görelilik', sub: 'Einstein teorisi', outcome: 'Zaman genişlemesi ve uzunluk büzülmesini kavrar' },
  { subject: 'Fizik', unit: 4, main: 'Kuantum Fiziği', sub: 'Fotoelektrik olay', outcome: 'Fotoelektrik olay ve Compton saçılmasını analiz eder' },
  { subject: 'Fizik', unit: 4, main: 'Kuantum Fiziği', sub: 'De Broglie hipotezi', outcome: 'Madde dalgaları kavramını kavrar' },
  { subject: 'Fizik', unit: 4, main: 'Teknoloji', sub: 'Lazer-yarı iletken', outcome: 'Lazer, yarı iletken ve nanoteknoloji prensiplerini öğrenir' },
  { subject: 'Fizik', unit: 4, main: 'Teknoloji', sub: 'Tıbbi görüntüleme', outcome: 'MR, tomografi ve ultrason çalışma prensiplerini kavrar' },

  // ==================== KİMYA (AYT - Elektrokimya ve Organik) ====================
  // Elektrokimya
  { subject: 'Kimya', unit: 1, main: 'Elektrokimya', sub: 'Redoks tepkimeleri', outcome: 'İndirgenme-yükseltgenme tepkimelerini denkleştirir' },
  { subject: 'Kimya', unit: 1, main: 'Elektrokimya', sub: 'Galvanik piller', outcome: 'Galvanik pil ve pil potansiyeli hesaplar' },
  { subject: 'Kimya', unit: 1, main: 'Elektrokimya', sub: 'Lityum-iyon pil', outcome: 'Lityum-iyon pillerinin kimyasını inceler' },
  { subject: 'Kimya', unit: 1, main: 'Elektrokimya', sub: 'Elektroliz', outcome: 'Elektroliz ve metal kaplamacılığı kavrar' },
  { subject: 'Kimya', unit: 1, main: 'Elektrokimya', sub: 'Korozyon', outcome: 'Korozyondan korunma yöntemlerini öğrenir' },
  
  // Organik Kimya
  { subject: 'Kimya', unit: 2, main: 'Organik Kimya', sub: 'Karbon allotropları', outcome: 'Elmas, grafit, grafen ve fulleren yapılarını inceler' },
  { subject: 'Kimya', unit: 2, main: 'Organik Kimya', sub: 'Hibritleşme', outcome: 'sp, sp2, sp3 hibritleşmesini ve molekül geometrisini kavrar' },
  { subject: 'Kimya', unit: 2, main: 'Organik Kimya', sub: 'Hidrokarbonlar', outcome: 'Alkan, alken, alkin ve aromatiklerin özelliklerini inceler' },
  { subject: 'Kimya', unit: 2, main: 'Organik Kimya', sub: 'Alkoller-eterler', outcome: 'Alkol ve eter bileşiklerini adlandırır ve özelliklerini kavrar' },
  { subject: 'Kimya', unit: 2, main: 'Organik Kimya', sub: 'Aldehit-keton', outcome: 'Aldehit ve keton bileşiklerini tanır' },
  { subject: 'Kimya', unit: 2, main: 'Organik Kimya', sub: 'Karboksilik asitler', outcome: 'Karboksilik asit ve ester bileşiklerini inceler' },

  // ==================== BİYOLOJİ (AYT - Genetik ve Enerji) ====================
  // Genetik
  { subject: 'Biyoloji', unit: 1, main: 'Moleküler Genetik', sub: 'DNA replikasyonu', outcome: 'DNA replikasyon sürecini detaylandırır' },
  { subject: 'Biyoloji', unit: 1, main: 'Moleküler Genetik', sub: 'Transkripsiyon', outcome: 'DNA\'dan RNA sentezini (transkripsiyon) açıklar' },
  { subject: 'Biyoloji', unit: 1, main: 'Moleküler Genetik', sub: 'Translasyon', outcome: 'Ribozomda protein sentezini (translasyon) kavrar' },
  { subject: 'Biyoloji', unit: 1, main: 'Moleküler Genetik', sub: 'Santral dogma', outcome: 'Santral dogma kavramını ve akışını açıklar' },
  { subject: 'Biyoloji', unit: 1, main: 'Biyoteknoloji', sub: 'Genetik mühendislik', outcome: 'CRISPR, GDO ve klonlama teknolojilerini inceler' },
  
  // Enerji Dönüşümleri
  { subject: 'Biyoloji', unit: 2, main: 'Fotosentez', sub: 'Kloroplast tepkimeleri', outcome: 'Işık ve karbon tepkimelerini detaylandırır' },
  { subject: 'Biyoloji', unit: 2, main: 'Kemosentez', sub: 'İnorganik oksidasyon', outcome: 'Kemosentez sürecini açıklar' },
  { subject: 'Biyoloji', unit: 2, main: 'Hücresel Solunum', sub: 'Glikoliz', outcome: 'Glikoliz evresini analiz eder' },
  { subject: 'Biyoloji', unit: 2, main: 'Hücresel Solunum', sub: 'Krebs döngüsü', outcome: 'Krebs döngüsü ve ara ürünlerini kavrar' },
  { subject: 'Biyoloji', unit: 2, main: 'Hücresel Solunum', sub: 'ETS', outcome: 'Elektron taşıma sistemi ve oksidatif fosforilasyonu inceler' },
  
  // Bitki Biyolojisi
  { subject: 'Biyoloji', unit: 3, main: 'Bitki Anatomisi', sub: 'Bitkisel dokular', outcome: 'Bitkisel dokuları ve organları inceler' },
  { subject: 'Biyoloji', unit: 3, main: 'Bitki Fizyolojisi', sub: 'Su ve mineral taşınması', outcome: 'Kohezyon-gerilim teorisini ve mineral taşınımını kavrar' },
  { subject: 'Biyoloji', unit: 3, main: 'Bitki Fizyolojisi', sub: 'Bitkisel hormonlar', outcome: 'Bitkisel hormonları ve etkilerini öğrenir' },
  { subject: 'Biyoloji', unit: 3, main: 'Bitki Üremesi', sub: 'Eşeyli üreme', outcome: 'Bitkilerde eşeyli üreme ve döllenmeyi açıklar' },

  // ==================== T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK ====================
  { subject: 'Tarih', unit: 1, main: 'Osmanlı Çöküşü', sub: 'Trablusgarp-Balkan', outcome: 'Trablusgarp ve Balkan Savaşlarının jeopolitik sonuçlarını analiz eder' },
  { subject: 'Tarih', unit: 1, main: 'I. Dünya Savaşı', sub: 'Bloklaşma', outcome: 'Bloklaşma ve Osmanlı\'nın savaşa giriş gerekçelerini inceler' },
  { subject: 'Tarih', unit: 2, main: 'Millî Mücadele', sub: 'Kongreler', outcome: 'Erzurum ve Sivas Kongrelerini ulusal irade olarak değerlendirir' },
  { subject: 'Tarih', unit: 2, main: 'Millî Mücadele', sub: 'Sakarya-Büyük Taarruz', outcome: 'Sakarya ve Büyük Taarruz\'un askeri stratejilerini inceler' },
  { subject: 'Tarih', unit: 3, main: 'Atatürk İlkeleri', sub: 'Devrimler', outcome: 'Siyasi, hukuki, eğitim devrimlerini modern ulus-devlet vizyonuyla ilişkilendirir' },
  { subject: 'Tarih', unit: 3, main: 'Atatürk İlkeleri', sub: 'Altı ok', outcome: 'Atatürk ilkelerini toplumsal ihtiyaçlara üretilen çözümler olarak kavrar' },

  // ==================== ÇAĞDAŞ TÜRK VE DÜNYA TARİHİ ====================
  { subject: 'Tarih', unit: 4, main: 'Soğuk Savaş', sub: 'İki kutuplu dünya', outcome: 'NATO, Varşova Paktı ve Türkiye\'nin NATO üyeliğini analiz eder' },
  { subject: 'Tarih', unit: 4, main: 'Soğuk Savaş', sub: 'Kıbrıs Barış Harekatı', outcome: 'Kıbrıs Barış Harekatı\'nın diplomatik ve askeri boyutlarını inceler' },
  { subject: 'Tarih', unit: 5, main: 'Küreselleşme', sub: 'SSCB çözülüşü', outcome: 'SSCB\'nin dağılması ve Türk Cumhuriyetlerini değerlendirir' },
  { subject: 'Tarih', unit: 5, main: 'Küreselleşme', sub: 'Mavi Vatan', outcome: 'Türkiye\'nin jeostratejik konumunu ve Mavi Vatan kavramını inceler' },

  // ==================== SOSYOLOJİ ====================
  { subject: 'Sosyoloji', unit: 1, main: 'Toplumsal Kurumlar', sub: 'Aile-eğitim', outcome: 'Aile ve eğitim kurumlarının işlevlerini ve değişimini analiz eder' },
  { subject: 'Sosyoloji', unit: 1, main: 'Toplumsal Kurumlar', sub: 'Din-ekonomi', outcome: 'Din ve ekonomi kurumlarının toplumsal rolünü inceler' },
  { subject: 'Sosyoloji', unit: 2, main: 'Toplumsal Değişme', sub: 'Modernleşme', outcome: 'Modernleşme ve küreselleşmenin toplumsal etkilerini tartışır' },
  { subject: 'Sosyoloji', unit: 2, main: 'Toplumsal Değişme', sub: 'Kültür emperyalizmi', outcome: 'Kültür emperyalizmi ve popüler kültürü eleştirel değerlendirir' },

  // ==================== MANTIK ====================
  { subject: 'Mantık', unit: 1, main: 'Klasik Mantık', sub: 'Kavram-önerme', outcome: 'Kavram, terim, önerme ve kıyas türlerini öğrenir' },
  { subject: 'Mantık', unit: 1, main: 'Klasik Mantık', sub: 'Mantık ilkeleri', outcome: 'Özdeşlik, çelişmezlik, üçüncü halin imkansızlığını kavrar' },
  { subject: 'Mantık', unit: 2, main: 'Sembolik Mantık', sub: 'Önerme mantığı', outcome: 'Sözel ifadeleri sembolik dile çevirir' },
  { subject: 'Mantık', unit: 2, main: 'Sembolik Mantık', sub: 'Doğruluk çizelgesi', outcome: 'Doğruluk çizelgesi ile geçerliliği denetler' },

  // ==================== DİN KÜLTÜRÜ VE AHLAK BİLGİSİ ====================
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 1, main: 'Güncel Meseleler', sub: 'Tıp etiği', outcome: 'Organ nakli, ötanazi, genetik kopyalamayı İslami perspektiften tartışır' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 1, main: 'Güncel Meseleler', sub: 'Ekonomi', outcome: 'Borsa, kripto para, sigorta konularını dini açıdan inceler' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 2, main: 'Dinler Tarihi', sub: 'Hint dinleri', outcome: 'Hinduizm ve Budizm\'in temel inançlarını inceler' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 2, main: 'Dinler Tarihi', sub: 'Çin dinleri', outcome: 'Taoizm ve Konfüçyanizm\'i kavrar' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 3, main: 'Tasavvuf', sub: 'Tasavvufi yollar', outcome: 'Yesevilik, Mevlevilik, Alevilik-Bektaşilik\'i inceler' },

  // ==================== İNGİLİZCE (B2+) ====================
  { subject: 'İngilizce', unit: 1, main: 'Music', sub: 'Müzik tercihleri', outcome: 'Müzik tercihlerini gerekçelendirerek açıklar' },
  { subject: 'İngilizce', unit: 2, main: 'Friendship', sub: 'Karakter analizi', outcome: 'Kişilik özelliklerini betimler ve analiz eder' },
  { subject: 'İngilizce', unit: 3, main: 'Human Rights', sub: 'Evrensel değerler', outcome: 'İnsan hakları konusunda farkındalık oluşturur ve çözüm önerir' },
  { subject: 'İngilizce', unit: 4, main: 'Psychology', sub: 'Duygusal zeka', outcome: 'Ruh halini tanımlar ve empati kurar' },
  { subject: 'İngilizce', unit: 5, main: 'Alternative Energy', sub: 'Sürdürülebilirlik', outcome: 'Yenilenebilir enerji konusunda tartışır ve çözüm önerir' },
  { subject: 'İngilizce', unit: 6, main: 'Technology', sub: 'Yapay zeka', outcome: 'Teknolojik gelişmeler hakkında röportaj yapar' },

  // ==================== GÖRSEL SANATLAR ====================
  { subject: 'Görsel Sanatlar', unit: 1, main: 'Sanat Akımları', sub: 'Modern akımlar', outcome: 'Empresyonizm, Kübizm, Sürrealizm akımlarını tanır' },
  { subject: 'Görsel Sanatlar', unit: 2, main: 'Sanat Eleştirisi', sub: 'Analiz yöntemleri', outcome: 'Betimleme, çözümleme, yorumlama yöntemlerini kullanarak eser analiz eder' },

  // ==================== MÜZİK ====================
  { subject: 'Müzik', unit: 1, main: 'Türk Müziği', sub: 'Makam ve usul', outcome: 'THM ve TSM makamlarını, usullerini ve çalgılarını tanır' },
  { subject: 'Müzik', unit: 2, main: 'Müzik Formları', sub: 'Geleneksel formlar', outcome: 'Türkü, şarkı, bozlak, zeybek formlarını ayırt eder' },

  // ==================== BEDEN EĞİTİMİ VE SPOR ====================
  { subject: 'Beden Eğitimi ve Spor', unit: 1, main: 'İleri Beceriler', sub: 'Teknik-taktik', outcome: 'Seçili spor dalında ileri düzey teknik ve taktik uygular' },
  { subject: 'Beden Eğitimi ve Spor', unit: 2, main: 'Spor Yönetimi', sub: 'Organizasyon', outcome: 'Spor turnuvası düzenler ve yönetir' },
  { subject: 'Beden Eğitimi ve Spor', unit: 3, main: 'Spor Bilimi', sub: 'Fizyoloji', outcome: 'Sporun anatomi ve fizyoloji üzerindeki etkilerini açıklar' }
];

async function importGrade12Topics() {
  console.log('🎓 12. Sınıf YKS Final Yılı Kazanımları Aktarımı Başlıyor...\n');
  console.log('📌 Not: YKS/AYT Final Yılı - Sorular 5 şıklı!\n');
  
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
    { name: 'Sosyoloji', slug: 'sosyoloji', code: 'sosyoloji', category: 'Sosyal Bilimler' },
    { name: 'Mantık', slug: 'mantik', code: 'mantik', category: 'Sosyal Bilimler' }
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
    .eq('grade', 12);
  
  const existingSet = new Set(
    (existingTopics || []).map(t => `${t.subject_id}|${t.main_topic}|${t.sub_topic}`)
  );
  
  console.log(`📋 Mevcut 12. sınıf konu sayısı: ${existingSet.size}`);
  
  let added = 0;
  let skipped = 0;
  let errors = [];
  
  for (const topic of grade12Topics) {
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
        grade: 12,
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
    
    process.stdout.write(`\r⏳ İşleniyor: ${added + skipped + errors.length}/${grade12Topics.length}`);
  }
  
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 12. SINIF YKS FİNAL YILI KAZANIMLARI SONUÇ:');
  console.log(`   ✅ Yeni eklenen: ${added}`);
  console.log(`   ⏭️ Zaten mevcut: ${skipped}`);
  console.log(`   📝 Toplam işlenen: ${grade12Topics.length}`);
  
  if (errors.length > 0) {
    console.log(`   ⚠️ Hatalar (${errors.length}):`);
    [...new Set(errors)].slice(0, 5).forEach(e => console.log(`      - ${e}`));
  }
  
  const subjectSummary = {};
  grade12Topics.forEach(t => {
    subjectSummary[t.subject] = (subjectSummary[t.subject] || 0) + 1;
  });
  
  console.log('\n📖 Ders Bazında Dağılım:');
  Object.entries(subjectSummary).sort((a, b) => b[1] - a[1]).forEach(([subject, count]) => {
    console.log(`   ${subject}: ${count} kazanım`);
  });
  
  console.log('\n🎯 AYT Matematik-Fen:');
  ['Matematik', 'Fizik', 'Kimya', 'Biyoloji'].forEach(s => {
    console.log(`   ${s}: ${subjectSummary[s] || 0} kazanım`);
  });
  
  console.log('\n📚 AYT Sosyal-Edebiyat:');
  ['Türk Dili ve Edebiyatı', 'Tarih', 'Sosyoloji', 'Mantık'].forEach(s => {
    console.log(`   ${s}: ${subjectSummary[s] || 0} kazanım`);
  });
  
  console.log('='.repeat(60));
}

importGrade12Topics()
  .then(() => {
    console.log('\n✅ 12. Sınıf müfredatı aktarımı tamamlandı!');
    console.log('\n🎉 TÜM MÜFREDAT TAMAMLANDI! (1-12. Sınıf)');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Kritik hata:', err);
    process.exit(1);
  });


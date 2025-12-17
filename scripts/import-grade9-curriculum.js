// 9. Sınıf Türkiye Yüzyılı Maarif Modeli Müfredat Kazanımları Import Script (2025-2026)
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 9. Sınıf Maarif Modeli Müfredatı - Lise Başlangıcı (5 şıklı sorular!)
const grade9Topics = [
  // ==================== TÜRK DİLİ VE EDEBİYATI ====================
  // Tema 1: Sözün İnceliği
  { subject: 'Türk Dili ve Edebiyatı', unit: 1, main: 'Sözün İnceliği', sub: 'Edebi dil', outcome: 'Edebi dilin gündelik dilden farkını analiz eder' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 1, main: 'Sözün İnceliği', sub: 'Söz sanatları', outcome: 'Teşbih, istiare ve mecaz sanatlarını metin içinde tespit eder' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 1, main: 'Sözün İnceliği', sub: 'Ahenk unsurları', outcome: 'Kafiye, redif, aliterasyon ve asonansın metnin duygu dünyasına katkısını analiz eder' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 1, main: 'Sözün İnceliği', sub: 'İmge ve çağrışım', outcome: 'İmge ve çağrışım kavramlarını metinlerde inceler' },
  
  // Tema 2: Anlam Arayışı
  { subject: 'Türk Dili ve Edebiyatı', unit: 2, main: 'Anlam Arayışı', sub: 'Açık ve örtük anlam', outcome: 'Metindeki açık ve örtük anlamları ayırt eder' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 2, main: 'Anlam Arayışı', sub: 'Dönem zihniyeti', outcome: 'Metnin yazıldığı dönemin zihniyetini analiz eder' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 2, main: 'Anlam Arayışı', sub: 'Eleştirel okuma', outcome: 'Metne eleştirel sorular yönelterek derinlemesine analiz yapar' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 2, main: 'Anlam Arayışı', sub: 'Yazar-eser-okur', outcome: 'Yazar, eser ve okur arasındaki ilişkiyi değerlendirir' },
  
  // Tema 3: Anlamın Yapı Taşları (İşlevsel Dil Bilgisi)
  { subject: 'Türk Dili ve Edebiyatı', unit: 3, main: 'Dil Bilgisi', sub: 'Kelime türleri', outcome: 'Kelime türlerinin anlam üzerindeki kurucu etkisini kavrar' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 3, main: 'Dil Bilgisi', sub: 'Cümle bilgisi', outcome: 'Cümle yapılarının metindeki işlevini analiz eder' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 3, main: 'Dil Bilgisi', sub: 'Noktalama', outcome: 'Noktalama işaretlerinin anlam ve ritim üzerindeki etkisini inceler' },
  
  // Tema 4: Dilin Zenginliği
  { subject: 'Türk Dili ve Edebiyatı', unit: 4, main: 'Dilin Zenginliği', sub: 'Türkçenin tarihi', outcome: 'Türk dilinin tarihsel dönemlerini öğrenir' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 4, main: 'Dilin Zenginliği', sub: 'Lehçe ve ağızlar', outcome: 'Türkçe lehçe ve Türkiye Türkçesi ağızlarını tanır' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 4, main: 'Dilin Zenginliği', sub: 'Kültürel miras', outcome: 'Dede Korkut gibi kültürel kök metinleri inceler' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 4, main: 'Dilin Zenginliği', sub: 'Söz varlığı', outcome: 'Atasözleri ve deyimler üzerinden Türk kültürünü analiz eder' },

  // ==================== MATEMATİK (7 Tema) ====================
  // Tema 1: Sayılar
  { subject: 'Matematik', unit: 1, main: 'Sayılar', sub: 'Gerçek sayılar', outcome: 'Gerçek sayı kümelerini ve özelliklerini kavrar' },
  { subject: 'Matematik', unit: 1, main: 'Sayılar', sub: 'Üslü ifadeler', outcome: 'Üslü ifadelerle işlemler yapar ve kuralları uygular' },
  { subject: 'Matematik', unit: 1, main: 'Sayılar', sub: 'Köklü ifadeler', outcome: 'Köklü ifadelerle işlemler yapar' },
  { subject: 'Matematik', unit: 1, main: 'Sayılar', sub: 'Sayısal tahmin', outcome: 'Sayısal tahmin ve işlem stratejileri geliştirir' },
  
  // Tema 2: Nicelikler ve Değişimler
  { subject: 'Matematik', unit: 2, main: 'Fonksiyonlar', sub: 'Fonksiyon kavramı', outcome: 'Fonksiyon kavramını tanır ve örneklendirir' },
  { subject: 'Matematik', unit: 2, main: 'Fonksiyonlar', sub: 'Değişim oranları', outcome: 'Değişim oranlarını yorumlar ve hesaplar' },
  { subject: 'Matematik', unit: 2, main: 'Fonksiyonlar', sub: 'Lineer ilişkiler', outcome: 'Lineer ilişkileri grafikle gösterir ve analiz eder' },
  { subject: 'Matematik', unit: 2, main: 'Denklemler', sub: 'Denklem çözme', outcome: 'Birinci dereceden denklem ve eşitsizlikleri çözer' },
  
  // Tema 3: Algoritma ve Bilişim
  { subject: 'Matematik', unit: 3, main: 'Mantık', sub: 'Önermeler', outcome: 'Önermelerin doğruluk değerlerini belirler' },
  { subject: 'Matematik', unit: 3, main: 'Mantık', sub: 'Mantıksal operatörler', outcome: 'VE, VEYA, DEĞİL operatörlerini kullanır' },
  { subject: 'Matematik', unit: 3, main: 'Algoritma', sub: 'Akış şemaları', outcome: 'Problem çözme için akış şemaları oluşturur' },
  { subject: 'Matematik', unit: 3, main: 'Algoritma', sub: 'Algoritmik düşünme', outcome: 'Problemleri alt problemlere bölerek çözer' },
  
  // Tema 4: Geometrik Şekiller
  { subject: 'Matematik', unit: 4, main: 'Üçgenler', sub: 'Temel kavramlar', outcome: 'Üçgenlerin temel özelliklerini inceler' },
  { subject: 'Matematik', unit: 4, main: 'Üçgenler', sub: 'Geometrik inşalar', outcome: 'Pergel ve cetvel kullanarak geometrik inşalar yapar' },
  { subject: 'Matematik', unit: 4, main: 'Çokgenler', sub: 'Çokgen özellikleri', outcome: 'Çokgenlerin açı ve kenar özelliklerini inceler' },
  
  // Tema 5: Eşlik ve Benzerlik
  { subject: 'Matematik', unit: 5, main: 'Eşlik-Benzerlik', sub: 'Eşlik kavramı', outcome: 'Geometrik nesnelerde eşlik kavramını uygular' },
  { subject: 'Matematik', unit: 5, main: 'Eşlik-Benzerlik', sub: 'Benzerlik', outcome: 'Benzer şekillerin özelliklerini inceler' },
  { subject: 'Matematik', unit: 5, main: 'Eşlik-Benzerlik', sub: 'Tales teoremi', outcome: 'Tales teoremini problem çözümünde kullanır' },
  
  // Tema 6: İstatistiksel Araştırma
  { subject: 'Matematik', unit: 6, main: 'İstatistik', sub: 'Veri toplama', outcome: 'Veri toplama tekniklerini ve örneklem seçimini öğrenir' },
  { subject: 'Matematik', unit: 6, main: 'İstatistik', sub: 'Anket tasarımı', outcome: 'Araştırma için anket tasarlar' },
  { subject: 'Matematik', unit: 6, main: 'İstatistik', sub: 'Veri güvenliği', outcome: 'Veri güvenliği ve etik kullanımı kavrar' },
  
  // Tema 7: Veriden Olasılığa
  { subject: 'Matematik', unit: 7, main: 'Veri Analizi', sub: 'Merkezi eğilim', outcome: 'Aritmetik ortalama, medyan ve mod hesaplar' },
  { subject: 'Matematik', unit: 7, main: 'Veri Analizi', sub: 'Yayılım ölçüleri', outcome: 'Varyans ve standart sapma kavramlarını öğrenir' },
  { subject: 'Matematik', unit: 7, main: 'Olasılık', sub: 'Olasılık hesaplama', outcome: 'Basit olasılık hesaplamalarını yapar ve yorumlar' },

  // ==================== FİZİK (4 Ünite) ====================
  { subject: 'Fizik', unit: 1, main: 'Fizik Bilimi', sub: 'Fiziğin dalları', outcome: 'Fiziğin alt dallarını (mekanik, termodinamik, optik vb.) tanır' },
  { subject: 'Fizik', unit: 1, main: 'Fizik Bilimi', sub: 'Kariyer keşfi', outcome: 'Fizik ile ilişkili mühendislik ve kariyer alanlarını inceler' },
  { subject: 'Fizik', unit: 2, main: 'Kuvvet ve Hareket', sub: 'Newton yasaları', outcome: 'Newton\'un hareket yasalarını günlük hayatla ilişkilendirir' },
  { subject: 'Fizik', unit: 2, main: 'Kuvvet ve Hareket', sub: 'Sürtünme kuvveti', outcome: 'Sürtünme kuvvetinin etkilerini analiz eder' },
  { subject: 'Fizik', unit: 2, main: 'Kuvvet ve Hareket', sub: 'Referans sistemleri', outcome: 'Hareketin göreceliğini ve referans sistemlerini kavrar' },
  { subject: 'Fizik', unit: 3, main: 'Akışkanlar', sub: 'Basınç', outcome: 'Katı, sıvı ve gaz basıncını hesaplar' },
  { subject: 'Fizik', unit: 3, main: 'Akışkanlar', sub: 'Arşimet prensibi', outcome: 'Kaldırma kuvvetini ve Arşimet prensibini uygular' },
  { subject: 'Fizik', unit: 3, main: 'Akışkanlar', sub: 'Uygulamalar', outcome: 'Hidrolik sistemler ve denizcilik uygulamalarını inceler' },
  { subject: 'Fizik', unit: 4, main: 'Enerji', sub: 'Enerji türleri', outcome: 'Enerji türlerini ve dönüşümlerini açıklar' },
  { subject: 'Fizik', unit: 4, main: 'Enerji', sub: 'İş-güç ilişkisi', outcome: 'İş, güç ve enerji ilişkisini hesaplar' },
  { subject: 'Fizik', unit: 4, main: 'Enerji', sub: 'Yenilenebilir enerji', outcome: 'Enerji verimliliği ve yenilenebilir kaynakları değerlendirir' },

  // ==================== KİMYA (3 Tema) ====================
  { subject: 'Kimya', unit: 1, main: 'Etkileşim', sub: 'Atom yapısı', outcome: 'Atom modellerini ve kuantum yaklaşımını inceler' },
  { subject: 'Kimya', unit: 1, main: 'Etkileşim', sub: 'Periyodik tablo', outcome: 'Elementlerin periyodik özelliklerini analiz eder' },
  { subject: 'Kimya', unit: 1, main: 'Etkileşim', sub: 'Kimyasal türler', outcome: 'Kimyasal türler arası etkileşimleri açıklar' },
  { subject: 'Kimya', unit: 1, main: 'Etkileşim', sub: 'Dijital içerik', outcome: 'Orbitaller hakkında dijital içerik (animasyon/sunu) hazırlar' },
  { subject: 'Kimya', unit: 2, main: 'Çeşitlilik', sub: 'Maddenin halleri', outcome: 'Katı, sıvı, gaz ve plazma hallerini inceler' },
  { subject: 'Kimya', unit: 2, main: 'Çeşitlilik', sub: 'Karışımlar', outcome: 'Karışım türlerini ve çözücülerin önemini kavrar' },
  { subject: 'Kimya', unit: 3, main: 'Sürdürülebilirlik', sub: 'Yeşil kimya', outcome: 'Yeşil kimya prensiplerini ve geri dönüşümü öğrenir' },
  { subject: 'Kimya', unit: 3, main: 'Sürdürülebilirlik', sub: 'Karbon ayak izi', outcome: 'Karbon ve su ayak izi kavramlarını inceler' },
  { subject: 'Kimya', unit: 3, main: 'Sürdürülebilirlik', sub: 'Çevre projesi', outcome: 'Çevre sorunlarına kimya bilgisiyle çözüm önerisi geliştirir' },

  // ==================== BİYOLOJİ (2 Tema) ====================
  { subject: 'Biyoloji', unit: 1, main: 'Yaşam', sub: 'Biyolojinin önemi', outcome: 'Biyoloji biliminin tarihsel gelişimini ve önemini kavrar' },
  { subject: 'Biyoloji', unit: 1, main: 'Yaşam', sub: 'Bilim etiği', outcome: 'Bilim etiği ve bilimsel araştırma süreçlerini öğrenir' },
  { subject: 'Biyoloji', unit: 1, main: 'Yaşam', sub: 'Biyoçeşitlilik', outcome: 'Biyolojik çeşitliliğin korunmasının önemini kavrar' },
  { subject: 'Biyoloji', unit: 1, main: 'Yaşam', sub: 'Türk bilim insanları', outcome: 'Aziz Sancar gibi Türk bilim insanlarının katkılarını inceler' },
  { subject: 'Biyoloji', unit: 2, main: 'Organizasyon', sub: 'Hücre yapısı', outcome: 'Prokaryot ve ökaryot hücreleri karşılaştırır' },
  { subject: 'Biyoloji', unit: 2, main: 'Organizasyon', sub: 'Organeller', outcome: 'Hücre organellerinin görevlerini açıklar' },
  { subject: 'Biyoloji', unit: 2, main: 'Organizasyon', sub: 'İnorganik moleküller', outcome: 'Su ve minerallerin canlılık için önemini inceler' },
  { subject: 'Biyoloji', unit: 2, main: 'Organizasyon', sub: 'Organik moleküller', outcome: 'Karbonhidrat, lipit, protein ve nükleik asitleri tanır' },
  { subject: 'Biyoloji', unit: 2, main: 'Organizasyon', sub: 'Enzimler', outcome: 'Enzimlerin yapısını ve işlevlerini açıklar' },
  { subject: 'Biyoloji', unit: 2, main: 'Organizasyon', sub: 'Sağlıklı beslenme', outcome: 'Dengeli beslenme ve metabolik hastalıkları kavrar' },

  // ==================== TARİH (3 Ünite) ====================
  { subject: 'Tarih', unit: 1, main: 'Geçmişin İnşası', sub: 'Tarih nedir?', outcome: 'Tarihsel bilginin nasıl üretildiğini sorgular' },
  { subject: 'Tarih', unit: 1, main: 'Geçmişin İnşası', sub: 'Kaynak analizi', outcome: 'Tarihsel kaynakları eleştirel değerlendirir' },
  { subject: 'Tarih', unit: 1, main: 'Geçmişin İnşası', sub: 'Dijitalleşme', outcome: 'Dijitalleşmenin tarih araştırmalarına etkisini tartışır' },
  { subject: 'Tarih', unit: 2, main: 'Eski Çağ', sub: 'Tarım devrimi', outcome: 'Tarım devrimini ve yerleşik hayata geçişi açıklar' },
  { subject: 'Tarih', unit: 2, main: 'Eski Çağ', sub: 'İlk medeniyetler', outcome: 'Mezopotamya, Mısır ve Anadolu medeniyetlerini inceler' },
  { subject: 'Tarih', unit: 2, main: 'Eski Çağ', sub: 'İlk hukuk kuralları', outcome: 'İnsanlığın ilk yazılı hukuk kurallarını öğrenir' },
  { subject: 'Tarih', unit: 3, main: 'Orta Çağ', sub: 'İslam medeniyeti', outcome: 'İslam medeniyetinin doğuşunu ve yükselişini inceler' },
  { subject: 'Tarih', unit: 3, main: 'Orta Çağ', sub: 'Türklerin İslamiyet\'i kabulü', outcome: 'Türklerin İslamiyet\'i kabul sürecini değerlendirir' },
  { subject: 'Tarih', unit: 3, main: 'Orta Çağ', sub: 'Haçlı Seferleri', outcome: 'Haçlı Seferlerinin nedenlerini ve sonuçlarını analiz eder' },
  { subject: 'Tarih', unit: 3, main: 'Orta Çağ', sub: 'Doğu-Batı etkileşimi', outcome: 'Doğu ve Batı medeniyetlerinin etkileşimini karşılaştırır' },

  // ==================== COĞRAFYA (5 Ünite) ====================
  { subject: 'Coğrafya', unit: 1, main: 'Coğrafya Bilimi', sub: 'Coğrafi bakış', outcome: 'Coğrafi bakış açısını ve coğrafyanın bölümlerini öğrenir' },
  { subject: 'Coğrafya', unit: 2, main: 'Mekânsal Teknolojiler', sub: 'Haritacılık', outcome: 'Haritacılık tarihini ve modern harita türlerini inceler' },
  { subject: 'Coğrafya', unit: 2, main: 'Mekânsal Teknolojiler', sub: 'CBS/GIS', outcome: 'Coğrafi Bilgi Sistemlerini ve Uzaktan Algılamayı tanır' },
  { subject: 'Coğrafya', unit: 3, main: 'Doğal Sistemler', sub: 'Atmosfer', outcome: 'Atmosfer yapısını ve iklim olaylarını analiz eder' },
  { subject: 'Coğrafya', unit: 3, main: 'Doğal Sistemler', sub: 'Litosfer', outcome: 'Yer şekillerini ve levha tektoniğini inceler' },
  { subject: 'Coğrafya', unit: 3, main: 'Doğal Sistemler', sub: 'Hidrosfer', outcome: 'Su döngüsünü ve su kaynaklarını değerlendirir' },
  { subject: 'Coğrafya', unit: 4, main: 'Beşerî Sistemler', sub: 'Nüfus', outcome: 'Nüfusun dağılışını ve göç hareketlerini analiz eder' },
  { subject: 'Coğrafya', unit: 4, main: 'Beşerî Sistemler', sub: 'Yerleşme', outcome: 'Yerleşme dokularını ve şehirleşmeyi inceler' },
  { subject: 'Coğrafya', unit: 5, main: 'Afetler', sub: 'Doğal afetler', outcome: 'Deprem, sel ve heyelan gibi afetleri inceler' },
  { subject: 'Coğrafya', unit: 5, main: 'Afetler', sub: 'Afet bilinci', outcome: 'Afetlere karşı alınacak önlemleri değerlendirir' },
  { subject: 'Coğrafya', unit: 5, main: 'Çevre', sub: 'İklim değişikliği', outcome: 'Küresel iklim değişikliğini ve sürdürülebilirliği tartışır' },

  // ==================== DİN KÜLTÜRÜ VE AHLAK BİLGİSİ (5 Ünite) ====================
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 1, main: 'Allah-İnsan İlişkisi', sub: 'Yaratılış amacı', outcome: 'İnsanın evrendeki konumunu ve yaratılış amacını kavrar' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 1, main: 'Allah-İnsan İlişkisi', sub: 'Dua ve ibadet', outcome: 'Dua ve ibadetin manevi boyutlarını inceler' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 2, main: 'İnanç Esasları', sub: 'Tevhid', outcome: 'Tevhid inancını ve önemini kavrar' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 2, main: 'İnanç Esasları', sub: 'Ahiret inancı', outcome: 'Ahiret inancının bireye ve topluma etkilerini değerlendirir' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 3, main: 'İbadetler', sub: 'Namaz', outcome: 'Namazın manevi ve sosyal boyutlarını inceler' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 3, main: 'İbadetler', sub: 'Oruç ve zekat', outcome: 'Oruç ve zekatın bireysel ve toplumsal etkilerini kavrar' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 4, main: 'Ahlak İlkeleri', sub: 'Güzel ahlak', outcome: 'Güzel ahlak ve erdemleri içselleştirir' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 4, main: 'Ahlak İlkeleri', sub: 'Hak ve sorumluluklar', outcome: 'Hak ve sorumluluklar arasındaki dengeyi kavrar' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 5, main: 'Hz. Muhammed', sub: 'İnsani yönü', outcome: 'Hz. Muhammed\'in insani yönünü ve örnek şahsiyetini tanır' },

  // ==================== İNGİLİZCE (B1.1 Seviyesi) ====================
  { subject: 'İngilizce', unit: 1, main: 'School Life', sub: 'Tanışma', outcome: 'Okul hayatı hakkında tanışma ve sohbet yapar' },
  { subject: 'İngilizce', unit: 1, main: 'School Life', sub: 'Okul kuralları', outcome: 'Okul kuralları ve kulüpler hakkında konuşur' },
  { subject: 'İngilizce', unit: 2, main: 'Classroom Life', sub: 'Sınıf içi iletişim', outcome: 'Sınıf içi yönergeleri anlar ve uygular' },
  { subject: 'İngilizce', unit: 2, main: 'Classroom Life', sub: 'Rica ve izin', outcome: 'Rica ve izin isteme kalıplarını kullanır' },
  { subject: 'İngilizce', unit: 3, main: 'Family Life', sub: 'Aile tanıtımı', outcome: 'Aile bireylerini ve özelliklerini tanıtır' },
  { subject: 'İngilizce', unit: 3, main: 'Family Life', sub: 'Aile ilişkileri', outcome: 'Aile içi ilişkiler hakkında konuşur' },
  { subject: 'İngilizce', unit: 4, main: 'City & Country', sub: 'Yaşam alanları', outcome: 'Şehir ve köy hayatını karşılaştırır' },
  { subject: 'İngilizce', unit: 4, main: 'City & Country', sub: 'Yön tarifi', outcome: 'Yön tarifi yapar ve yol anlatır' },
  { subject: 'İngilizce', unit: 5, main: 'Values', sub: 'Empathy', outcome: 'Empati ve sorumluluk kavramlarını İngilizce ifade eder' },

  // ==================== BEDEN EĞİTİMİ VE SPOR (3 Tema) ====================
  { subject: 'Beden Eğitimi ve Spor', unit: 1, main: 'Zindelik', sub: 'Egzersiz etkileri', outcome: 'Egzersizin fizyolojik ve psikolojik etkilerini açıklar' },
  { subject: 'Beden Eğitimi ve Spor', unit: 1, main: 'Zindelik', sub: 'Isınma-soğuma', outcome: 'Isınma ve soğuma tekniklerini uygular' },
  { subject: 'Beden Eğitimi ve Spor', unit: 1, main: 'Zindelik', sub: 'Bireysel program', outcome: 'Kişisel antrenman programı planlar' },
  { subject: 'Beden Eğitimi ve Spor', unit: 2, main: 'Spor Eğitimi', sub: 'Teknik beceriler', outcome: 'Seçilen spor dalına özgü teknik becerileri geliştirir' },
  { subject: 'Beden Eğitimi ve Spor', unit: 2, main: 'Spor Eğitimi', sub: 'Taktik beceriler', outcome: 'Takım sporlarında taktik beceriler kazanır' },
  { subject: 'Beden Eğitimi ve Spor', unit: 3, main: 'Spor Kültürü', sub: 'Spor tarihi', outcome: 'Sporun tarihsel gelişimini ve olimpiyatları öğrenir' },
  { subject: 'Beden Eğitimi ve Spor', unit: 3, main: 'Spor Kültürü', sub: 'Fair-play', outcome: 'Fair-play ve spor ahlakını içselleştirir' },
  { subject: 'Beden Eğitimi ve Spor', unit: 3, main: 'Sağlık', sub: 'İlk yardım', outcome: 'İlk yardım temel ilkelerini öğrenir' },

  // ==================== GÖRSEL SANATLAR (4 Tema) ====================
  { subject: 'Görsel Sanatlar', unit: 1, main: 'Sanata Bakış', sub: 'Sanat felsefesi', outcome: 'Sanat felsefesinin temel kavramlarını öğrenir' },
  { subject: 'Görsel Sanatlar', unit: 2, main: 'Temel Tasarım', sub: 'Çizgi ve şekil', outcome: 'Temel tasarım ilkelerini ve perspektifi uygular' },
  { subject: 'Görsel Sanatlar', unit: 3, main: 'Sanat Tarihi', sub: 'Sanat akımları', outcome: 'Sanat tarihindeki temel akımları inceler' },
  { subject: 'Görsel Sanatlar', unit: 4, main: 'Dijital Sanat', sub: 'Teknoloji ve sanat', outcome: 'Dijital sanat ve yeni medya uygulamalarını tanır' },

  // ==================== MÜZİK (3 Tema) ====================
  { subject: 'Müzik', unit: 1, main: 'Müzik Dili', sub: 'Nota bilgisi', outcome: 'Temel müzik teorisini ve nota okumayı öğrenir' },
  { subject: 'Müzik', unit: 1, main: 'Müzik Dili', sub: 'İstiklal Marşı', outcome: 'İstiklal Marşı\'nı doğru ve etkili icra eder' },
  { subject: 'Müzik', unit: 2, main: 'Müzik Kültürü', sub: 'Türk müziği', outcome: 'Türk halk ve sanat müziğini tanır' },
  { subject: 'Müzik', unit: 2, main: 'Müzik Kültürü', sub: 'Batı müziği', outcome: 'Batı müziği dönemlerini ve çalgıları inceler' },
  { subject: 'Müzik', unit: 3, main: 'Müziksel Tasarım', sub: 'Ritim ve beste', outcome: 'Ritim kalıpları oluşturur ve basit besteler yapar' },
  { subject: 'Müzik', unit: 3, main: 'Müziksel Tasarım', sub: 'Dijital müzik', outcome: 'Dijital müzik araçlarını tanır ve kullanır' }
];

async function importGrade9Topics() {
  console.log('🎓 9. Sınıf Maarif Modeli Kazanımları Aktarımı Başlıyor...\n');
  console.log('📌 Not: Lise düzeyi - Sorular 5 şıklı olacak!\n');
  
  const { data: subjects, error: subjectsError } = await supabase
    .from('subjects')
    .select('id, name');
  
  if (subjectsError) {
    console.error('❌ Dersler alınamadı:', subjectsError.message);
    return;
  }
  
  const subjectMap = {};
  subjects.forEach(s => { subjectMap[s.name] = s.id; });
  
  // Lise derslerini kontrol et/oluştur
  const newSubjects = [
    { name: 'Türk Dili ve Edebiyatı', slug: 'turk-dili-ve-edebiyati', code: 'tde', category: 'Dil ve Edebiyat' },
    { name: 'Fizik', slug: 'fizik', code: 'fizik', category: 'Fen Bilimleri' },
    { name: 'Kimya', slug: 'kimya', code: 'kimya', category: 'Fen Bilimleri' },
    { name: 'Biyoloji', slug: 'biyoloji', code: 'biyoloji', category: 'Fen Bilimleri' },
    { name: 'Tarih', slug: 'tarih', code: 'tarih', category: 'Sosyal Bilimler' },
    { name: 'Coğrafya', slug: 'cografya', code: 'cografya', category: 'Sosyal Bilimler' }
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
    .eq('grade', 9);
  
  const existingSet = new Set(
    (existingTopics || []).map(t => `${t.subject_id}|${t.main_topic}|${t.sub_topic}`)
  );
  
  console.log(`📋 Mevcut 9. sınıf konu sayısı: ${existingSet.size}`);
  
  let added = 0;
  let skipped = 0;
  let errors = [];
  
  for (const topic of grade9Topics) {
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
        grade: 9,
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
    
    process.stdout.write(`\r⏳ İşleniyor: ${added + skipped + errors.length}/${grade9Topics.length}`);
  }
  
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 9. SINIF MAARİF MODELİ KAZANIMLARI SONUÇ:');
  console.log(`   ✅ Yeni eklenen: ${added}`);
  console.log(`   ⏭️ Zaten mevcut: ${skipped}`);
  console.log(`   📝 Toplam işlenen: ${grade9Topics.length}`);
  
  if (errors.length > 0) {
    console.log(`   ⚠️ Hatalar (${errors.length}):`);
    [...new Set(errors)].slice(0, 5).forEach(e => console.log(`      - ${e}`));
  }
  
  const subjectSummary = {};
  grade9Topics.forEach(t => {
    subjectSummary[t.subject] = (subjectSummary[t.subject] || 0) + 1;
  });
  
  console.log('\n📖 Ders Bazında Dağılım:');
  Object.entries(subjectSummary).sort((a, b) => b[1] - a[1]).forEach(([subject, count]) => {
    console.log(`   ${subject}: ${count} kazanım`);
  });
  
  console.log('\n🎯 YKS/TYT Hazırlık Dersleri:');
  const yksSubjects = ['Türk Dili ve Edebiyatı', 'Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Tarih', 'Coğrafya'];
  yksSubjects.forEach(s => {
    const count = subjectSummary[s] || 0;
    console.log(`   ${s}: ${count} kazanım`);
  });
  
  console.log('='.repeat(60));
}

importGrade9Topics()
  .then(() => {
    console.log('\n✅ 9. Sınıf müfredatı aktarımı tamamlandı!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Kritik hata:', err);
    process.exit(1);
  });


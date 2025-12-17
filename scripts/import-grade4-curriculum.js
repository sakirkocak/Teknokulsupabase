// 4. Sınıf MEB Türkiye Yüzyılı Maarif Modeli Kazanımları Import Script
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 4. Sınıf Müfredatı - Türkiye Yüzyılı Maarif Modeli 2025-2026
const grade4Topics = [
  // ==================== MATEMATİK ====================
  // Tema 1: Sayılar ve Nicelikler (1)
  { subject: 'Matematik', unit: 1, main: 'Sayı Sistemi', sub: 'Altı basamaklı sayılar', outcome: 'Altı basamaklı sayıları okur, yazar ve modeller' },
  { subject: 'Matematik', unit: 1, main: 'Basamak Değeri', sub: 'Bölük kavramı', outcome: 'Sayıları bölük ve basamak olarak ayrıştırır' },
  { subject: 'Matematik', unit: 1, main: 'Örüntü', sub: 'Sayı dizileri', outcome: 'Artan ve azalan sayı dizilerindeki kuralı bulur' },
  { subject: 'Matematik', unit: 1, main: 'Karşılaştırma', sub: 'Sayı sıralaması', outcome: 'Altı basamaklı sayıları karşılaştırır ve sıralar' },
  
  // Tema 2: Sayılar ve Nicelikler (2)
  { subject: 'Matematik', unit: 2, main: 'Kesirler', sub: 'Denk kesirler', outcome: 'Denk kesirleri belirler ve oluşturur' },
  { subject: 'Matematik', unit: 2, main: 'Kesirler', sub: 'Kesir karşılaştırma', outcome: 'Paydaları farklı kesirleri karşılaştırır' },
  { subject: 'Matematik', unit: 2, main: 'Kesirler', sub: 'Kesirlerle işlem', outcome: 'Paydaları eşit kesirlerle toplama ve çıkarma yapar' },
  { subject: 'Matematik', unit: 2, main: 'Ondalık Gösterim', sub: 'Ondalık kesirler', outcome: 'Kesirlerin ondalık gösterimini yapar' },
  { subject: 'Matematik', unit: 2, main: 'Birim Dönüştürme', sub: 'Uzunluk birimleri', outcome: 'mm, cm, m arasında dönüşüm yapar' },
  { subject: 'Matematik', unit: 2, main: 'Birim Dönüştürme', sub: 'Kütle birimleri', outcome: 'g, kg arasında dönüşüm yapar' },
  
  // Tema 3: İşlemlerden Cebirsel Düşünmeye
  { subject: 'Matematik', unit: 3, main: 'Zihinden İşlem', sub: 'Parçalama stratejisi', outcome: 'Sayıları parçalayarak zihinden toplama/çıkarma yapar' },
  { subject: 'Matematik', unit: 3, main: 'Çarpma', sub: 'İki basamaklı çarpma', outcome: 'İki basamaklı sayılarla çarpma yapar' },
  { subject: 'Matematik', unit: 3, main: 'Çarpma', sub: 'Kısa yol çarpma', outcome: '10, 100, 1000 ile kısa yoldan çarpma yapar' },
  { subject: 'Matematik', unit: 3, main: 'Bölme', sub: 'İki basamaklı bölme', outcome: 'İki basamaklı bölenlere bölme yapar' },
  { subject: 'Matematik', unit: 3, main: 'Bölme', sub: 'Kısa yol bölme', outcome: '10, 100, 1000 ile kısa yoldan bölme yapar' },
  { subject: 'Matematik', unit: 3, main: 'Cebirsel Düşünme', sub: 'Eşitlik kavramı', outcome: 'Eşitliğin denge durumu olduğunu kavrar' },
  { subject: 'Matematik', unit: 3, main: 'Cebirsel Düşünme', sub: 'Bilinmeyen bulma', outcome: 'İşlemlerde bilinmeyeni bulur' },
  { subject: 'Matematik', unit: 3, main: 'Problem Çözme', sub: 'Dört işlem problemleri', outcome: 'Dört işlem gerektiren problemleri çözer' },
  
  // Tema 4: Nesnelerin Geometrisi (1)
  { subject: 'Matematik', unit: 4, main: 'Geometrik Cisimler', sub: 'Açınımlar', outcome: 'Geometrik cisimlerin açınımlarını çizer' },
  { subject: 'Matematik', unit: 4, main: '3D Modelleme', sub: 'Cisim oluşturma', outcome: 'Açınımdan 3D cisim oluşturur' },
  { subject: 'Matematik', unit: 4, main: 'Yüzey Alanı', sub: 'Alan tahmini', outcome: 'Geometrik cisimlerin yüzey alanını tahmin eder' },
  
  // Tema 5: Nesnelerin Geometrisi (2)
  { subject: 'Matematik', unit: 5, main: 'Açılar', sub: 'Açı kavramı', outcome: 'Açının dönme miktarı olduğunu kavrar' },
  { subject: 'Matematik', unit: 5, main: 'Açılar', sub: 'Açı ölçme', outcome: 'Açıları derece cinsinden ölçer' },
  { subject: 'Matematik', unit: 5, main: 'Açılar', sub: 'Açı türleri', outcome: 'Dar, dik, geniş ve doğru açıları ayırt eder' },
  
  // Tema 6: Nesnelerin Geometrisi (3)
  { subject: 'Matematik', unit: 6, main: 'Simetri', sub: 'Simetri ekseni', outcome: 'Şekillerde simetri eksenini bulur' },
  { subject: 'Matematik', unit: 6, main: 'Örüntü', sub: 'Geometrik örüntü', outcome: 'Geometrik şekillerle örüntü oluşturur' },
  { subject: 'Matematik', unit: 6, main: 'Kodlama', sub: 'Algoritmik yönerge', outcome: 'Geometrik şekillerle yapı oluşturmak için kod yazar' },
  
  // Tema 7: Olayların Olasılığı ve Veri
  { subject: 'Matematik', unit: 7, main: 'Olasılık', sub: 'Olasılık durumları', outcome: 'Olayları imkansız, olabilir, kesin olarak sınıflar' },
  { subject: 'Matematik', unit: 7, main: 'Veri Toplama', sub: 'Kategorik veri', outcome: 'Kategorik veri toplar ve sıklık tablosu oluşturur' },
  { subject: 'Matematik', unit: 7, main: 'Veri Görselleştirme', sub: 'Sütun grafiği', outcome: 'Verileri sütun grafiğine dönüştürür' },
  { subject: 'Matematik', unit: 7, main: 'Veri Analizi', sub: 'Grafik yorumlama', outcome: 'Grafiklerden veri okur ve yorumlar' },

  // ==================== FEN BİLİMLERİ ====================
  // Ünite 1: Bilime Yolculuk
  { subject: 'Fen Bilimleri', unit: 1, main: 'Bilimsel Metodoloji', sub: 'Bilimsel süreç', outcome: 'Bilimsel araştırma sürecini kavrar' },
  { subject: 'Fen Bilimleri', unit: 1, main: 'Laboratuvar', sub: 'Güvenlik protokolleri', outcome: 'Laboratuvar güvenlik kurallarını uygular' },
  
  // Ünite 2: Sağlıklı Besleniyorum
  { subject: 'Fen Bilimleri', unit: 2, main: 'Beslenme', sub: 'Besin grupları', outcome: 'Besin gruplarını tanır ve dengeli beslenmeyi açıklar' },
  { subject: 'Fen Bilimleri', unit: 2, main: 'Sağlık', sub: 'Zararlı maddeler', outcome: 'Alkol, sigara ve uyuşturucunun zararlarını bilir' },
  
  // Ünite 3: Dünya'mızı Keşfedelim
  { subject: 'Fen Bilimleri', unit: 3, main: 'Jeoloji', sub: 'Yer kabuğu', outcome: 'Yer kabuğunun yapısını inceler' },
  { subject: 'Fen Bilimleri', unit: 3, main: 'Fosiller', sub: 'Fosil oluşumu', outcome: 'Fosillerin nasıl oluştuğunu açıklar' },
  { subject: 'Fen Bilimleri', unit: 3, main: 'Astronomi', sub: 'Gezegen hareketleri', outcome: 'Dünya\'nın hareketlerini açıklar' },
  
  // Ünite 4: Maddenin Değişimi
  { subject: 'Fen Bilimleri', unit: 4, main: 'Madde Özellikleri', sub: 'Ölçülebilir özellikler', outcome: 'Maddenin ölçülebilir özelliklerini tespit eder' },
  { subject: 'Fen Bilimleri', unit: 4, main: 'Hal Değişimi', sub: 'Faz geçişleri', outcome: 'Hal değişim süreçlerini açıklar' },
  { subject: 'Fen Bilimleri', unit: 4, main: 'Karışımlar', sub: 'Sınıflandırma', outcome: 'Saf madde ve karışımı ayırt eder' },
  { subject: 'Fen Bilimleri', unit: 4, main: 'Ayrıştırma', sub: 'Ayırma yöntemleri', outcome: 'Mıknatısla ayırma, süzme ve eleme yöntemlerini uygular' },
  
  // Ünite 5: Mıknatısı Keşfediyorum
  { subject: 'Fen Bilimleri', unit: 5, main: 'Manyetizma', sub: 'Mıknatıs özellikleri', outcome: 'Mıknatısların özelliklerini keşfeder' },
  { subject: 'Fen Bilimleri', unit: 5, main: 'Manyetizma', sub: 'Kutup etkileşimi', outcome: 'Mıknatıs kutuplarının etkileşimini inceler' },
  
  // Ünite 6: Enerji Dedektifleri
  { subject: 'Fen Bilimleri', unit: 6, main: 'Elektrik', sub: 'Devre tasarımı', outcome: 'Basit elektrik devresi kurar' },
  { subject: 'Fen Bilimleri', unit: 6, main: 'Elektrik', sub: 'Hata ayıklama', outcome: 'Devredeki arızaları tespit eder' },
  { subject: 'Fen Bilimleri', unit: 6, main: 'Enerji', sub: 'Verimlilik', outcome: 'Enerji verimliliği kavramını anlar' },
  
  // Ünite 7: Işığın Peşinde
  { subject: 'Fen Bilimleri', unit: 7, main: 'Optik', sub: 'Işık yayılımı', outcome: 'Işığın yayılma özelliklerini inceler' },
  { subject: 'Fen Bilimleri', unit: 7, main: 'Kirlilik', sub: 'Işık kirliliği', outcome: 'Işık kirliliğinin etkilerini açıklar' },
  { subject: 'Fen Bilimleri', unit: 7, main: 'Kirlilik', sub: 'Ses kirliliği', outcome: 'Ses kirliliğinin etkilerini ve önlemlerini açıklar' },
  
  // Ünite 8: Sürdürülebilir Şehirler
  { subject: 'Fen Bilimleri', unit: 8, main: 'Sürdürülebilirlik', sub: 'Kaynak optimizasyonu', outcome: 'Kaynak kullanımını optimize eden çözümler üretir' },
  { subject: 'Fen Bilimleri', unit: 8, main: 'Ekoloji', sub: 'Geri dönüşüm', outcome: 'Geri dönüşüm sistemlerini tasarlar' },
  { subject: 'Fen Bilimleri', unit: 8, main: 'Tasarım', sub: 'Yeşil tasarım', outcome: 'Çevre dostu tasarım projeleri geliştirir' },

  // ==================== SOSYAL BİLGİLER (YENİ - Hayat Bilgisi yerine) ====================
  // 1. Birlikte Yaşamak
  { subject: 'Sosyal Bilgiler', unit: 1, main: 'Kimlik', sub: 'Bireysel kimlik', outcome: 'Kendini tanır ve bireysel özelliklerini ifade eder' },
  { subject: 'Sosyal Bilgiler', unit: 1, main: 'Farklılıklar', sub: 'Kültürel çeşitlilik', outcome: 'Bireysel ve kültürel farklılıklara saygı gösterir' },
  
  // 2. Evimiz Dünya
  { subject: 'Sosyal Bilgiler', unit: 2, main: 'Harita', sub: 'Harita okuma', outcome: 'Harita ve harita anahtarı kullanır' },
  { subject: 'Sosyal Bilgiler', unit: 2, main: 'Coğrafya', sub: 'Konum belirleme', outcome: 'Yön ve konum belirler' },
  { subject: 'Sosyal Bilgiler', unit: 2, main: 'Afet', sub: 'Doğal afetler', outcome: 'Doğal afetlere karşı hazırlıklı olma bilinci kazanır' },
  
  // 3. Ortak Mirasımız
  { subject: 'Sosyal Bilgiler', unit: 3, main: 'Tarih', sub: 'Sözlü tarih', outcome: 'Aile büyüklerinden sözlü tarih derler' },
  { subject: 'Sosyal Bilgiler', unit: 3, main: 'Kültür', sub: 'Kültürel miras', outcome: 'Kültürel miras ögelerini tanır ve korur' },
  { subject: 'Sosyal Bilgiler', unit: 3, main: 'Aile', sub: 'Aile ağacı', outcome: 'Aile ağacı oluşturur' },
  
  // 4. Yaşayan Demokrasimiz
  { subject: 'Sosyal Bilgiler', unit: 4, main: 'Demokrasi', sub: 'Karar alma', outcome: 'Demokratik karar alma süreçlerini anlar' },
  { subject: 'Sosyal Bilgiler', unit: 4, main: 'Katılım', sub: 'Toplumsal katılım', outcome: 'Toplumsal karar süreçlerine katılım önemini kavrar' },
  
  // 5. Hayatımızdaki Ekonomi
  { subject: 'Sosyal Bilgiler', unit: 5, main: 'Ekonomi', sub: 'Bütçe planlama', outcome: 'Basit bütçe planı yapar' },
  { subject: 'Sosyal Bilgiler', unit: 5, main: 'Tüketim', sub: 'Bilinçli tüketim', outcome: 'Bilinçli tüketici davranışları kazanır' },
  { subject: 'Sosyal Bilgiler', unit: 5, main: 'Veri Okuma', sub: 'Grafik yorumlama', outcome: 'Kaynak tüketimi grafiklerini yorumlar' },
  
  // 6. Teknoloji ve Sosyal Bilimler
  { subject: 'Sosyal Bilgiler', unit: 6, main: 'Dijital Güvenlik', sub: 'Çevrimiçi güvenlik', outcome: 'Çevrimiçi ortamda güvenlik kurallarını uygular' },
  { subject: 'Sosyal Bilgiler', unit: 6, main: 'Siber Güvenlik', sub: 'Mahremiyet', outcome: 'Dijital mahremiyet kavramını anlar' },
  { subject: 'Sosyal Bilgiler', unit: 6, main: 'Siber Zorbalık', sub: 'Korunma', outcome: 'Siber zorbalıktan korunma yollarını bilir' },

  // ==================== TÜRKÇE ====================
  { subject: 'Türkçe', unit: 1, main: 'Erdemler', sub: 'Değerler eğitimi', outcome: 'Temel değerleri içselleştirir ve uygular' },
  { subject: 'Türkçe', unit: 2, main: 'Bilim ve Teknoloji', sub: 'Bilimsel okuma', outcome: 'Bilimsel metinleri okur ve anlar' },
  { subject: 'Türkçe', unit: 3, main: 'Demokratik Yaşam', sub: 'Tartışma', outcome: 'Demokratik tartışma kurallarını uygular' },
  { subject: 'Türkçe', unit: 4, main: 'Dinleme', sub: 'Tahmin etme', outcome: 'Görsellerden hareketle içeriği tahmin eder' },
  { subject: 'Türkçe', unit: 4, main: 'Dinleme', sub: 'Ana fikir', outcome: 'Dinlediği metinde ana fikri bulur' },
  { subject: 'Türkçe', unit: 5, main: 'Okuma', sub: 'Akıcı okuma', outcome: 'Akıcı ve anlamlı okuma yapar' },
  { subject: 'Türkçe', unit: 5, main: 'Okuma', sub: 'Metin analizi', outcome: 'Metin türlerini ayırt eder ve analiz eder' },
  { subject: 'Türkçe', unit: 6, main: 'Konuşma', sub: 'Hazırlıklı konuşma', outcome: 'Hazırlıklı konuşma ve sunum yapar' },
  { subject: 'Türkçe', unit: 6, main: 'Konuşma', sub: 'Tartışma', outcome: 'Görüşlerini gerekçelendirerek ifade eder' },
  { subject: 'Türkçe', unit: 7, main: 'Yazma', sub: 'Anlatım türleri', outcome: 'Farklı anlatım türlerinde yazı yazar' },
  { subject: 'Türkçe', unit: 7, main: 'Yazma', sub: 'Yazım kuralları', outcome: 'Yazım ve noktalama kurallarını uygular' },
  { subject: 'Türkçe', unit: 8, main: 'Söz Varlığı', sub: 'Kelime öğrenimi', outcome: 'Söz varlığını zenginleştirir' },

  // ==================== İNGİLİZCE ====================
  { subject: 'İngilizce', unit: 1, main: 'Classroom', sub: 'Sınıf kuralları', outcome: 'Sınıf kurallarını İngilizce ifade eder' },
  { subject: 'İngilizce', unit: 1, main: 'Imperatives', sub: 'Emir cümleleri', outcome: 'Emir cümlelerini anlar ve kullanır' },
  { subject: 'İngilizce', unit: 2, main: 'Countries', sub: 'Ülkeler', outcome: 'Ülke isimlerini İngilizce söyler' },
  { subject: 'İngilizce', unit: 2, main: 'Nationalities', sub: 'Milletler', outcome: 'Milliyet ifadelerini kullanır' },
  { subject: 'İngilizce', unit: 3, main: 'Free Time', sub: 'Boş zaman', outcome: 'Boş zaman aktivitelerini anlatır' },
  { subject: 'İngilizce', unit: 4, main: 'Cartoon Characters', sub: 'Karakterler', outcome: 'Çizgi film karakterlerini tanımlar' },
  { subject: 'İngilizce', unit: 5, main: 'My Day', sub: 'Günlük rutin', outcome: 'Günlük rutinini İngilizce anlatır' },
  { subject: 'İngilizce', unit: 6, main: 'Fun with Science', sub: 'Bilim terimleri', outcome: 'Basit bilim terimlerini İngilizce kullanır' },
  { subject: 'İngilizce', unit: 7, main: 'Jobs', sub: 'Meslekler', outcome: 'Meslekleri İngilizce tanımlar' },
  { subject: 'İngilizce', unit: 8, main: 'My Clothes', sub: 'Giysiler', outcome: 'Giysi isimlerini İngilizce söyler' },
  { subject: 'İngilizce', unit: 9, main: 'My Friends', sub: 'Arkadaşlar', outcome: 'Arkadaşlarını İngilizce tanıtır' },
  { subject: 'İngilizce', unit: 10, main: 'Food and Drinks', sub: 'Yiyecek ve içecek', outcome: 'Yiyecek/içecek isimlerini öğrenir ve sipariş verir' },

  // ==================== DİN KÜLTÜRÜ VE AHLAK BİLGİSİ (YENİ) ====================
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 1, main: 'Günlük Hayat ve Din', sub: 'Dini ifadeler', outcome: 'Günlük hayatta kullanılan dini ifadeleri öğrenir' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 2, main: 'İnanç', sub: 'Allah sevgisi', outcome: 'Allah sevgisini kavrar' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 3, main: 'Ahlaki Değerler', sub: 'Dürüstlük', outcome: 'Dürüstlük değerini içselleştirir' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 3, main: 'Ahlaki Değerler', sub: 'Emanet', outcome: 'Emanet kavramını anlar ve uygular' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 4, main: 'Haklar', sub: 'Hak ve sorumluluk', outcome: 'Dini perspektiften hak ve sorumluluklarını kavrar' },

  // ==================== TRAFİK GÜVENLİĞİ (YENİ) ====================
  { subject: 'Trafik Güvenliği', unit: 1, main: 'Güvenli Adımlar', sub: 'Yaya güvenliği', outcome: 'Yaya olarak trafik kurallarını uygular' },
  { subject: 'Trafik Güvenliği', unit: 2, main: 'Ulaşım Araçları', sub: 'Araç tanıma', outcome: 'Ulaşım araçlarını ve özelliklerini tanır' },
  { subject: 'Trafik Güvenliği', unit: 2, main: 'Ulaşım Araçları', sub: 'Öncelikli araçlar', outcome: 'Geçiş üstünlüğü olan araçları tanır' },
  { subject: 'Trafik Güvenliği', unit: 3, main: 'İlk Yardım', sub: 'Temel ilk yardım', outcome: 'Temel ilk yardım bilgilerini öğrenir' },

  // ==================== GÖRSEL SANATLAR ====================
  { subject: 'Görsel Sanatlar', unit: 1, main: '3D Tasarım', sub: 'Nesne oluşturma', outcome: 'Üç boyutlu nesne oluşturur' },
  { subject: 'Görsel Sanatlar', unit: 2, main: 'Sınıflandırma', sub: 'Doğal/yapay nesne', outcome: 'Doğal ve yapay nesneleri ayırt eder' },
  { subject: 'Görsel Sanatlar', unit: 3, main: 'Renk', sub: 'Renk uyumu', outcome: 'Renk uyumu ve kontrastı kullanır' },
  { subject: 'Görsel Sanatlar', unit: 4, main: 'Kompozisyon', sub: 'Görsel düzenleme', outcome: 'Görsel ögeleri dengeli şekilde düzenler' },

  // ==================== MÜZİK ====================
  { subject: 'Müzik', unit: 1, main: 'Müzik Terimleri', sub: 'Terminoloji', outcome: 'Temel müzik terimlerini kullanır' },
  { subject: 'Müzik', unit: 2, main: 'Ritim', sub: 'Ritim kalıpları', outcome: 'Farklı ritim kalıplarını uygular' },
  { subject: 'Müzik', unit: 3, main: 'Ses', sub: 'Ses ayırt etme', outcome: 'Farklı sesleri ayırt eder' },
  { subject: 'Müzik', unit: 4, main: 'Performans', sub: 'Şarkı söyleme', outcome: 'Şarkıları doğru ritim ve tonlamayla söyler' },

  // ==================== BEDEN EĞİTİMİ VE OYUN ====================
  { subject: 'Beden Eğitimi ve Spor', unit: 1, main: 'Hareket', sub: 'Kuvvet ve hız', outcome: 'Yer değiştirme hareketlerini artan kuvvet ve hızla yapar' },
  { subject: 'Beden Eğitimi ve Spor', unit: 2, main: 'Koordinasyon', sub: 'Hareket koordinasyonu', outcome: 'Karmaşık hareket koordinasyonunu geliştirir' },
  { subject: 'Beden Eğitimi ve Spor', unit: 3, main: 'Takım Oyunları', sub: 'İş birliği', outcome: 'Takım oyunlarında iş birliği yapar' },
  { subject: 'Beden Eğitimi ve Spor', unit: 4, main: 'Strateji', sub: 'Oyun stratejisi', outcome: 'Oyunlarda strateji geliştirir ve uygular' }
];

async function importGrade4Topics() {
  console.log('🎓 4. Sınıf Kazanımları Aktarımı Başlıyor...\n');
  
  const { data: subjects, error: subjectsError } = await supabase
    .from('subjects')
    .select('id, name');
  
  if (subjectsError) {
    console.error('❌ Dersler alınamadı:', subjectsError.message);
    return;
  }
  
  const subjectMap = {};
  subjects.forEach(s => { subjectMap[s.name] = s.id; });
  
  // Yeni dersleri ekle
  const newSubjects = ['Trafik Güvenliği'];
  for (const subName of newSubjects) {
    if (!subjectMap[subName]) {
      console.log(`⚠️ "${subName}" dersi bulunamadı, oluşturuluyor...`);
      const { data: newSubject, error } = await supabase
        .from('subjects')
        .insert({
          name: subName,
          code: subName.toLowerCase().replace(/\s+/g, '-').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g'),
          is_active: true
        })
        .select()
        .single();
      
      if (!error && newSubject) {
        subjectMap[subName] = newSubject.id;
        console.log(`✅ "${subName}" dersi oluşturuldu`);
      }
    }
  }
  
  console.log('📚 Mevcut dersler alındı');
  
  const { data: existingTopics } = await supabase
    .from('topics')
    .select('main_topic, sub_topic, subject_id')
    .eq('grade', 4);
  
  const existingSet = new Set(
    (existingTopics || []).map(t => `${t.subject_id}|${t.main_topic}|${t.sub_topic}`)
  );
  
  console.log(`📋 Mevcut 4. sınıf konu sayısı: ${existingSet.size}`);
  
  let added = 0;
  let skipped = 0;
  let errors = [];
  
  for (const topic of grade4Topics) {
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
        grade: 4,
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
    
    process.stdout.write(`\r⏳ İşleniyor: ${added + skipped + errors.length}/${grade4Topics.length}`);
  }
  
  console.log('\n\n' + '='.repeat(50));
  console.log('📊 4. SINIF KAZANIMLARI SONUÇ:');
  console.log(`   ✅ Yeni eklenen: ${added}`);
  console.log(`   ⏭️ Zaten mevcut: ${skipped}`);
  console.log(`   📝 Toplam işlenen: ${grade4Topics.length}`);
  
  if (errors.length > 0) {
    console.log(`   ⚠️ Hatalar (${errors.length}):`);
    errors.slice(0, 10).forEach(e => console.log(`      - ${e}`));
  }
  
  const subjectSummary = {};
  grade4Topics.forEach(t => {
    subjectSummary[t.subject] = (subjectSummary[t.subject] || 0) + 1;
  });
  
  console.log('\n📖 Ders Bazında Dağılım:');
  Object.entries(subjectSummary).forEach(([subject, count]) => {
    console.log(`   ${subject}: ${count} kazanım`);
  });
  
  console.log('='.repeat(50));
}

importGrade4Topics()
  .then(() => {
    console.log('\n✅ 4. Sınıf müfredatı aktarımı tamamlandı!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Kritik hata:', err);
    process.exit(1);
  });


// 5. Sınıf MEB Türkiye Yüzyılı Maarif Modeli Kazanımları Import Script
// ORTAOKULA GEÇİŞ YILI - Yeni dersler: Bilişim Teknolojileri ve Yazılım
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 5. Sınıf Müfredatı - Türkiye Yüzyılı Maarif Modeli 2025-2026
const grade5Topics = [
  // ==================== TÜRKÇE (6 Tema) ====================
  // Tema 1: Oyun Dünyası
  { subject: 'Türkçe', unit: 1, main: 'Oyun Dünyası', sub: 'Söz varlığı', outcome: 'Oyun temelli etkinliklerle söz varlığını geliştirir' },
  { subject: 'Türkçe', unit: 1, main: 'Oyun Dünyası', sub: 'Yüzey anlam', outcome: 'Metinde yüzey anlamı kavrar' },
  { subject: 'Türkçe', unit: 1, main: 'Oyun Dünyası', sub: 'İş birlikli öğrenme', outcome: 'Grup çalışmalarında iş birliği yapar' },
  
  // Tema 2: Atatürk'ü Tanımak
  { subject: 'Türkçe', unit: 2, main: 'Atatürk', sub: 'Milli Mücadele', outcome: 'Milli Mücadele ile ilgili metinleri okur ve anlar' },
  { subject: 'Türkçe', unit: 2, main: 'Atatürk', sub: 'Vatanseverlik', outcome: 'Vatanseverlik değerini metinler üzerinden kavrar' },
  { subject: 'Türkçe', unit: 2, main: 'Atatürk', sub: 'Liderlik', outcome: 'Liderlik özelliklerini metinlerden çıkarır' },
  
  // Tema 3: Duygularımı Tanıyorum
  { subject: 'Türkçe', unit: 3, main: 'Duygular', sub: 'Duygu yönetimi', outcome: 'Duygu yönetimi ile ilgili metinleri analiz eder' },
  { subject: 'Türkçe', unit: 3, main: 'Duygular', sub: 'Empati', outcome: 'Empati kurma becerisini geliştirir' },
  { subject: 'Türkçe', unit: 3, main: 'Duygular', sub: 'Kendini tanıma', outcome: 'Kendini tanıma ile ilgili metinleri değerlendirir' },
  
  // Tema 4: Geleneklerimiz
  { subject: 'Türkçe', unit: 4, main: 'Gelenekler', sub: 'Kültürel miras', outcome: 'Kültürel mirası tanıtan metinleri okur' },
  { subject: 'Türkçe', unit: 4, main: 'Gelenekler', sub: 'Bayramlaşma', outcome: 'Bayram gelenekleri hakkında hazırlıklı konuşma yapar' },
  { subject: 'Türkçe', unit: 4, main: 'Gelenekler', sub: 'Drama', outcome: 'Gelenek temalı metinleri drama ile canlandırır' },
  
  // Tema 5: İletişim ve Sosyal İlişkiler
  { subject: 'Türkçe', unit: 5, main: 'İletişim', sub: 'Derin anlam', outcome: 'Metnin derin anlamını analiz eder' },
  { subject: 'Türkçe', unit: 5, main: 'İletişim', sub: 'Çıkarım yapma', outcome: 'Metin üzerinde üst düzey çıkarımlar yapar' },
  { subject: 'Türkçe', unit: 5, main: 'İletişim', sub: 'Dijital etik', outcome: 'Dijital ortamlarda iletişim kurallarını öğrenir' },
  { subject: 'Türkçe', unit: 5, main: 'İletişim', sub: 'Mahremiyet', outcome: 'Kişisel mahremiyetin korunmasını kavrar' },
  
  // Tema 6: Sağlıklı Yaşıyorum
  { subject: 'Türkçe', unit: 6, main: 'Sağlık', sub: 'Beslenme', outcome: 'Sağlıklı beslenme konulu metinleri değerlendirir' },
  { subject: 'Türkçe', unit: 6, main: 'Sağlık', sub: 'Bağımlılık', outcome: 'Bağımlılıkla mücadele metinlerini analiz eder' },
  
  // Genel Türkçe Becerileri
  { subject: 'Türkçe', unit: 7, main: 'Okuma', sub: 'Akıcı okuma', outcome: 'Metinleri akıcı ve anlamlı okur' },
  { subject: 'Türkçe', unit: 7, main: 'Yazma', sub: 'Metin oluşturma', outcome: 'Farklı türlerde metin oluşturur' },
  { subject: 'Türkçe', unit: 7, main: 'Dinleme', sub: 'Ana fikir', outcome: 'Dinlediği metinde ana fikri bulur' },
  { subject: 'Türkçe', unit: 7, main: 'Konuşma', sub: 'Hazırlıklı konuşma', outcome: 'Hazırlıklı konuşma ve sunum yapar' },

  // ==================== MATEMATİK (6 Tema) ====================
  // Tema 1: Sayılar ve Nicelikler (1)
  { subject: 'Matematik', unit: 1, main: 'Doğal Sayılar', sub: 'Büyük sayılar', outcome: 'On iki basamaklı sayıları okur ve yazar' },
  { subject: 'Matematik', unit: 1, main: 'Doğal Sayılar', sub: 'Basamak değeri', outcome: 'Sayıların basamak değerlerini analiz eder' },
  { subject: 'Matematik', unit: 1, main: 'Doğal Sayılar', sub: 'Tahmin etme', outcome: 'Günlük hayattaki büyük sayıları tahmin eder' },
  { subject: 'Matematik', unit: 1, main: 'Örüntü', sub: 'Sayı örüntüleri', outcome: 'Sayı dizilerindeki örüntüyü keşfeder' },
  
  // Tema 2: Sayılar ve Nicelikler (2)
  { subject: 'Matematik', unit: 2, main: 'Kesirler', sub: 'Kesir işlemleri', outcome: 'Kesirlerle toplama ve çıkarma yapar' },
  { subject: 'Matematik', unit: 2, main: 'Ondalık Gösterim', sub: 'Dönüşüm', outcome: 'Kesir ve ondalık gösterim arasında dönüşüm yapar' },
  { subject: 'Matematik', unit: 2, main: 'Yüzdeler', sub: 'Yüzde hesaplama', outcome: 'Yüzde kavramını anlar ve hesaplar' },
  { subject: 'Matematik', unit: 2, main: 'Birim Dönüştürme', sub: 'Uzunluk-kütle', outcome: 'Uzunluk ve kütle birimleri arasında dönüşüm yapar' },
  
  // Tema 3: İşlemlerle Cebirsel Düşünme
  { subject: 'Matematik', unit: 3, main: 'Dört İşlem', sub: 'Zihinden işlem', outcome: 'Zihinden işlem stratejileri geliştirir' },
  { subject: 'Matematik', unit: 3, main: 'Dört İşlem', sub: 'Çarpma-bölme', outcome: 'Çok basamaklı çarpma ve bölme yapar' },
  { subject: 'Matematik', unit: 3, main: 'Örüntü', sub: 'Sayı örüntüleri', outcome: 'Sayı örüntülerindeki kuralı bulur' },
  { subject: 'Matematik', unit: 3, main: 'Problem Çözme', sub: 'Dört işlem problemleri', outcome: 'Dört işlem gerektiren problemleri çözer' },
  
  // Tema 4: Geometrik Şekiller
  { subject: 'Matematik', unit: 4, main: 'Temel Kavramlar', sub: 'Nokta-doğru-düzlem', outcome: 'Nokta, doğru, ışın ve doğru parçasını tanır' },
  { subject: 'Matematik', unit: 4, main: 'Açılar', sub: 'Açı ölçme', outcome: 'Açıları ölçer ve sınıflandırır' },
  { subject: 'Matematik', unit: 4, main: 'Çokgenler', sub: 'Çokgen özellikleri', outcome: 'Çokgenlerin özelliklerini inceler' },
  
  // Tema 5: Geometrik Nicelikler
  { subject: 'Matematik', unit: 5, main: 'Uzunluk Ölçme', sub: 'Çevre hesaplama', outcome: 'Düzlemsel şekillerin çevresini hesaplar' },
  { subject: 'Matematik', unit: 5, main: 'Alan Ölçme', sub: 'Alan hesaplama', outcome: 'Birim karelerle alan hesaplar' },
  { subject: 'Matematik', unit: 5, main: 'Zaman', sub: 'Zaman ölçme', outcome: 'Zaman ölçme birimlerini kullanır' },
  
  // Tema 6: İstatistik ve Olasılık
  { subject: 'Matematik', unit: 6, main: 'Veri Toplama', sub: 'Araştırma sorusu', outcome: 'Araştırma sorusu belirler ve veri toplar' },
  { subject: 'Matematik', unit: 6, main: 'Veri Analizi', sub: 'Sıklık tablosu', outcome: 'Çetele ve sıklık tablosu oluşturur' },
  { subject: 'Matematik', unit: 6, main: 'Veri Görselleştirme', sub: 'Sütun grafiği', outcome: 'Verileri sütun grafiğinde gösterir' },
  { subject: 'Matematik', unit: 6, main: 'Veri Yorumlama', sub: 'Grafik okuma', outcome: 'Grafiklerden veri okur ve yorumlar' },

  // ==================== FEN BİLİMLERİ (7 Ünite) ====================
  // Ünite 1: Gökyüzündeki Komşularımız ve Biz (22 saat)
  { subject: 'Fen Bilimleri', unit: 1, main: 'Güneş Sistemi', sub: 'Güneş', outcome: 'Güneş\'in yapısını ve dönme hareketini açıklar' },
  { subject: 'Fen Bilimleri', unit: 1, main: 'Ay', sub: 'Ay evreleri', outcome: 'Ay\'ın evrelerini gözlemleyerek bilimsel çıkarım yapar' },
  { subject: 'Fen Bilimleri', unit: 1, main: 'Ay', sub: 'Model oluşturma', outcome: 'Ay\'ın evrelerini temsil eden bilimsel model oluşturur' },
  { subject: 'Fen Bilimleri', unit: 1, main: 'Ay', sub: 'Dönme-dolanma', outcome: 'Ay\'ın dönme ve dolanma hareketlerini açıklar' },
  
  // Ünite 2: Kuvveti Tanıyalım (24 saat)
  { subject: 'Fen Bilimleri', unit: 2, main: 'Kuvvet', sub: 'Dinamometre', outcome: 'Basit araçlarla dinamometre tasarlar' },
  { subject: 'Fen Bilimleri', unit: 2, main: 'Kuvvet', sub: 'Kuvvet ölçümü', outcome: 'Kuvveti dinamometre ile ölçer' },
  { subject: 'Fen Bilimleri', unit: 2, main: 'Sürtünme', sub: 'Sürtünme kuvveti', outcome: 'Sürtünme kuvvetinin farklı yüzeylerdeki etkisini inceler' },
  { subject: 'Fen Bilimleri', unit: 2, main: 'Sürtünme', sub: 'Günlük hayat', outcome: 'Sürtünmenin hayatı kolaylaştıran ve zorlaştıran yönlerini tartışır' },
  
  // Ünite 3: Canlıların Yapısına Yolculuk (22 saat)
  { subject: 'Fen Bilimleri', unit: 3, main: 'Hücre', sub: 'Bitki-hayvan hücresi', outcome: 'Bitki ve hayvan hücrelerini karşılaştırır' },
  { subject: 'Fen Bilimleri', unit: 3, main: 'Sistemler', sub: 'Organizasyon', outcome: 'Hücre-doku-organ-sistem-organizma hiyerarşisini açıklar' },
  { subject: 'Fen Bilimleri', unit: 3, main: 'Sistemler', sub: 'Canlı sistemleri', outcome: 'Canlılardaki sistemleri ve görevlerini tanır' },
  
  // Ünite 4: Işığın Dünyası (14 saat)
  { subject: 'Fen Bilimleri', unit: 4, main: 'Işık', sub: 'Işık yayılımı', outcome: 'Işığın yayılma özelliklerini keşfeder' },
  { subject: 'Fen Bilimleri', unit: 4, main: 'Gölge', sub: 'Tam gölge', outcome: 'Tam gölgenin oluşumunu etkileyen değişkenleri deney yoluyla keşfeder' },
  { subject: 'Fen Bilimleri', unit: 4, main: 'Gölge', sub: 'Gölge büyüklüğü', outcome: 'Işık kaynağı ve cisim mesafesinin gölge boyutuna etkisini inceler' },
  
  // Ünite 5: Maddenin Doğası (26 saat)
  { subject: 'Fen Bilimleri', unit: 5, main: 'Madde', sub: 'Tanecikli yapı', outcome: 'Maddenin tanecikli yapısını modellerle açıklar' },
  { subject: 'Fen Bilimleri', unit: 5, main: 'Isı ve Sıcaklık', sub: 'Kavram ayrımı', outcome: 'Isı ve sıcaklık kavramları arasındaki farkı açıklar' },
  { subject: 'Fen Bilimleri', unit: 5, main: 'Hal Değişimi', sub: 'Faz geçişleri', outcome: 'Isı etkisiyle maddenin hal değiştirmesini tahmin eder ve deneyle test eder' },
  
  // Ünite 6: Yaşamımızdaki Elektrik (16 saat)
  { subject: 'Fen Bilimleri', unit: 6, main: 'Elektrik Devresi', sub: 'Basit devre', outcome: 'Basit elektrik devresi kurar ve bileşenlerini tanır' },
  { subject: 'Fen Bilimleri', unit: 6, main: 'Değişkenler', sub: 'Kontrollü deney', outcome: 'Ampul parlaklığını etkileyen değişkenleri kontrollü deneyle inceler' },
  { subject: 'Fen Bilimleri', unit: 6, main: 'Hipotez', sub: 'Hipotez kurma', outcome: 'Elektrik devreleri için hipotez kurar ve test eder' },
  
  // Ünite 7: Sürdürülebilir Yaşam ve Geri Dönüşüm (10 saat)
  { subject: 'Fen Bilimleri', unit: 7, main: 'Atık Yönetimi', sub: 'Sınıflandırma', outcome: 'Evsel atıkları geri dönüştürülebilen/dönüştürülemeyen olarak sınıflandırır' },
  { subject: 'Fen Bilimleri', unit: 7, main: 'Proje', sub: 'Farkındalık', outcome: 'Atık yönetimi konusunda farkındalık projesi geliştirir' },
  { subject: 'Fen Bilimleri', unit: 7, main: 'Sürdürülebilirlik', sub: 'Çevre bilinci', outcome: 'Sürdürülebilir yaşam için sorumluluk alır' },

  // ==================== SOSYAL BİLGİLER (6 Öğrenme Alanı) ====================
  // 1. Birlikte Yaşamak
  { subject: 'Sosyal Bilgiler', unit: 1, main: 'Birlikte Yaşamak', sub: 'Gruplar ve roller', outcome: 'Aile, okul ve oyun gruplarındaki rollerini analiz eder' },
  { subject: 'Sosyal Bilgiler', unit: 1, main: 'Birlikte Yaşamak', sub: 'Kültürel saygı', outcome: 'Farklı kültürlere saygı duyar' },
  { subject: 'Sosyal Bilgiler', unit: 1, main: 'Birlikte Yaşamak', sub: 'Hak ve sorumluluk', outcome: 'Rollerin getirdiği hak ve sorumlulukları kavrar' },
  
  // 2. Evimiz Dünya
  { subject: 'Sosyal Bilgiler', unit: 2, main: 'Evimiz Dünya', sub: 'Harita okuma', outcome: 'Yaşadığı ilin konumunu haritada gösterir' },
  { subject: 'Sosyal Bilgiler', unit: 2, main: 'Evimiz Dünya', sub: 'Göreceli konum', outcome: 'Yaşadığı ilin göreceli konumunu belirler' },
  { subject: 'Sosyal Bilgiler', unit: 2, main: 'Evimiz Dünya', sub: 'Doğal afetler', outcome: 'Bölgesinde görülebilecek doğal afetleri tanır' },
  { subject: 'Sosyal Bilgiler', unit: 2, main: 'Evimiz Dünya', sub: 'Afet farkındalığı', outcome: 'Afetlerin etkisini azaltmaya yönelik projeler geliştirir' },
  
  // 3. Ortak Mirasımız
  { subject: 'Sosyal Bilgiler', unit: 3, main: 'Ortak Mirasımız', sub: 'İlk uygarlıklar', outcome: 'Anadolu ve Mezopotamya uygarlıklarını inceler' },
  { subject: 'Sosyal Bilgiler', unit: 3, main: 'Ortak Mirasımız', sub: 'Tarihsel empati', outcome: 'İlk yerleşim yerlerindeki yaşamı empati kurarak değerlendirir' },
  { subject: 'Sosyal Bilgiler', unit: 3, main: 'Ortak Mirasımız', sub: 'Kültürel miras', outcome: 'Somut ve somut olmayan kültürel mirası araştırır' },
  
  // 4. Yaşayan Demokrasimiz
  { subject: 'Sosyal Bilgiler', unit: 4, main: 'Demokrasi', sub: 'Demokrasi ve Cumhuriyet', outcome: 'Demokrasi ve Cumhuriyet kavramları arasındaki ilişkiyi çözümler' },
  { subject: 'Sosyal Bilgiler', unit: 4, main: 'Demokrasi', sub: 'Etkin vatandaşlık', outcome: 'Toplumsal sorunlara duyarlı, etkin vatandaş olmanın önemini kavrar' },
  { subject: 'Sosyal Bilgiler', unit: 4, main: 'Demokrasi', sub: 'Haklar', outcome: 'Haklarını arama ve yasalara uymanın önemini kavrar' },
  
  // 5. Hayatımızdaki Ekonomi
  { subject: 'Sosyal Bilgiler', unit: 5, main: 'Ekonomi', sub: 'İstek ve ihtiyaç', outcome: 'İstek ve ihtiyaç ayrımını yapar' },
  { subject: 'Sosyal Bilgiler', unit: 5, main: 'Ekonomi', sub: 'Bütçe yönetimi', outcome: 'Kişisel veya aile bütçesi planlar' },
  { subject: 'Sosyal Bilgiler', unit: 5, main: 'Ekonomi', sub: 'Ekonomik faaliyetler', outcome: 'Bölgesindeki üretim, dağıtım ve tüketim ağını analiz eder' },
  
  // 6. Teknoloji ve Sosyal Bilimler
  { subject: 'Sosyal Bilgiler', unit: 6, main: 'Teknoloji', sub: 'Toplumsal etki', outcome: 'Teknolojik gelişmelerin sosyalleşme üzerindeki etkilerini tartışır' },
  { subject: 'Sosyal Bilgiler', unit: 6, main: 'Teknoloji', sub: 'Bilgi güvenliği', outcome: 'Sanal ortamda doğru ve güvenilir bilgiye ulaşma stratejileri geliştirir' },

  // ==================== İNGİLİZCE (8 Tema) ====================
  { subject: 'İngilizce', unit: 1, main: 'Classroom Life', sub: 'Sınıf içi iletişim', outcome: 'Sınıf içi yönergeleri anlar ve izin isteme ifadelerini kullanır' },
  { subject: 'İngilizce', unit: 2, main: 'Family Life', sub: 'Aile tanıtımı', outcome: 'Aile bireylerini ve fiziksel özelliklerini tanıtır' },
  { subject: 'İngilizce', unit: 3, main: 'Life in Nature', sub: 'Hayvanlar ve doğa', outcome: 'Hayvanları tanır ve can/can\'t ifadelerini kullanır' },
  { subject: 'İngilizce', unit: 4, main: 'Neighbourhood & City', sub: 'Yer-yön tarifi', outcome: 'Yer-yön tarifi yapar ve prepositions of place kullanır' },
  { subject: 'İngilizce', unit: 5, main: 'Life in the Universe', sub: 'Gelecek planları', outcome: 'Basit düzeyde gelecek planlarından bahseder ve gezegenleri tanır' },
  { subject: 'İngilizce', unit: 6, main: 'Life in the World', sub: 'Ülkeler ve kültürler', outcome: 'Ülkeler, milliyetler ve farklı kültürler hakkında konuşur' },
  { subject: 'İngilizce', unit: 7, main: 'Personal Life', sub: 'Günlük rutin', outcome: 'Günlük rutinlerini, saatleri ve hobilerini anlatır' },
  { subject: 'İngilizce', unit: 8, main: 'School Life', sub: 'Ders programı', outcome: 'Ders programı ve sevilen dersler hakkında fikir beyan eder' },

  // ==================== DİN KÜLTÜRÜ VE AHLAK BİLGİSİ (5 Ünite) ====================
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 1, main: 'Allah İnancı', sub: 'Tevhit', outcome: 'Evrendeki düzeni gözlemleyerek Yaratıcı\'nın varlığına akıl yürütür' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 2, main: 'Namaz', sub: 'Namaz ibadeti', outcome: 'Namaz ibadetinin önemini, kılınışını ve çeşitlerini kavrar' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 2, main: 'Namaz', sub: 'Bireysel ve toplumsal faydalar', outcome: 'Namazın bireysel ve toplumsal faydalarını açıklar' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 3, main: 'Kur\'an-ı Kerim', sub: 'İç düzen', outcome: 'Kur\'an\'ın ayet, sure ve cüz yapısını tanır' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 3, main: 'Kur\'an-ı Kerim', sub: 'Kevser Suresi', outcome: 'Kevser Suresi\'nin anlamını ve mesajlarını açıklar' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 4, main: 'Peygamber Kıssaları', sub: 'Peygamber özellikleri', outcome: 'Peygamberlerin özelliklerini ve görevlerini öğrenir' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 4, main: 'Peygamber Kıssaları', sub: 'Hz. İbrahim', outcome: 'Hz. İbrahim ve Hz. İsmail\'in hayatından dersler çıkarır' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 5, main: 'Dini Motifler', sub: 'Mimari', outcome: 'Dinin kültür ve sanat üzerindeki etkisini fark eder' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 5, main: 'Dini Motifler', sub: 'Sanat', outcome: 'Cami mimarisi ve süsleme sanatlarını inceler' },

  // ==================== BİLİŞİM TEKNOLOJİLERİ VE YAZILIM (YENİ - 6 Tema) ====================
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 1, main: 'Teknoloji ve Yaşam', sub: 'Teknolojinin değişimi', outcome: 'Teknolojinin geçmişten günümüze değişimini analiz eder' },
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 1, main: 'Teknoloji ve Yaşam', sub: 'Ergonomi', outcome: 'Teknoloji kullanımında ergonomiyi uygular' },
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 2, main: 'Dijital Ürün Tasarımı', sub: 'Görsel işleme', outcome: 'Görsel düzenleme programlarıyla tasarım yapar' },
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 2, main: 'Dijital Ürün Tasarımı', sub: 'Sunum hazırlama', outcome: 'Etkili sunum dosyaları oluşturur' },
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 3, main: 'Bilgisayar Ağları', sub: 'Ağ türleri', outcome: 'Ağ türlerini ve internetin çalışma mantığını kavrar' },
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 3, main: 'Bilgisayar Ağları', sub: 'Güvenilir kaynaklar', outcome: 'Güvenilir bilgi kaynaklarına erişim stratejileri geliştirir' },
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 4, main: 'Bilişim Etiği', sub: 'Dijital ayak izi', outcome: 'Dijital ayak izi kavramını anlar ve yönetir' },
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 4, main: 'Siber Güvenlik', sub: 'Şifre güvenliği', outcome: 'Güçlü şifre oluşturma tekniklerini uygular' },
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 4, main: 'Siber Güvenlik', sub: 'Kişisel veriler', outcome: 'Kişisel verilerin gizliliğini koruma stratejileri geliştirir' },
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 4, main: 'Siber Güvenlik', sub: 'Siber zorbalık', outcome: 'Siber zorbalıktan korunma yollarını bilir' },
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 5, main: 'Yapay Zeka', sub: 'YZ tanıma', outcome: 'Yapay zeka kavramını ve günlük hayattaki uygulamalarını tanır' },
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 5, main: 'Yapay Zeka', sub: 'YZ etiği', outcome: 'Yapay zeka etiği üzerine tartışma yapar' },
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 6, main: 'Programlama', sub: 'Algoritma', outcome: 'Günlük problemlerin çözümünü algoritmik adımlarla ifade eder' },
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 6, main: 'Programlama', sub: 'Blok kodlama', outcome: 'Blok tabanlı programlama araçlarıyla yazılım geliştirir' },
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 6, main: 'Programlama', sub: 'Hata ayıklama', outcome: 'Yazılımlarda hata ayıklama (debugging) yapar' },

  // ==================== GÖRSEL SANATLAR (7 Tema) ====================
  { subject: 'Görsel Sanatlar', unit: 1, main: 'Hayat ve Sanat', sub: 'Çevre gözlemi', outcome: 'Doğadaki ve çevredeki güzellikleri fark eder ve sanat yoluyla ifade eder' },
  { subject: 'Görsel Sanatlar', unit: 2, main: 'Sanatın Görsel Dili', sub: 'Tasarım elemanları', outcome: 'Nokta, çizgi, renk, doku, leke gibi temel tasarım elemanlarını kullanır' },
  { subject: 'Görsel Sanatlar', unit: 3, main: 'Sanatçılar', sub: 'Eser inceleme', outcome: 'Türk ve dünya sanatından önemli isimleri ve eserleri inceler' },
  { subject: 'Görsel Sanatlar', unit: 4, main: 'Çizim', sub: 'Gözlem çizimi', outcome: 'Gözlemleyerek çizim yapar ve oran-orantı kullanır' },
  { subject: 'Görsel Sanatlar', unit: 5, main: 'Renk ve Estetik', sub: 'Renk çemberi', outcome: 'Renk çemberi, ana ve ara renkler, zıt renkleri kullanır' },
  { subject: 'Görsel Sanatlar', unit: 5, main: 'Renk ve Estetik', sub: 'Natürmort', outcome: 'Natürmort çalışmalarında renklerin estetik etkisini keşfeder' },
  { subject: 'Görsel Sanatlar', unit: 6, main: 'Milli Değerler', sub: 'Geleneksel sanatlar', outcome: 'Ebru, hat, çini, halı/kilim motiflerini tanır ve inceler' },
  { subject: 'Görsel Sanatlar', unit: 7, main: 'Müze', sub: 'Müze bilinci', outcome: 'Müze bilinci oluşturur ve sanal müze turları yapar' },

  // ==================== MÜZİK ====================
  { subject: 'Müzik', unit: 1, main: 'Milli Marşlar', sub: 'İstiklal Marşı', outcome: 'İstiklal Marşı\'nı doğru ve etkili söyler' },
  { subject: 'Müzik', unit: 1, main: 'Milli Değerler', sub: 'Bayram marşları', outcome: 'Milli bayramlarla ilgili şarkı ve marşları öğrenir' },
  { subject: 'Müzik', unit: 2, main: 'Temel Müzik', sub: 'Nota ve ritim', outcome: 'Ses, nota, ritim ve vuruş kavramlarını öğrenir' },
  { subject: 'Müzik', unit: 3, main: 'Müzik Kültürü', sub: 'Enstrümanlar', outcome: 'Türk halk ve sanat müziği enstrümanlarını tanır' },
  { subject: 'Müzik', unit: 3, main: 'Müzik Kültürü', sub: 'Müzik türleri', outcome: 'Farklı müzik türlerini dinler ve ayırt eder' },
  { subject: 'Müzik', unit: 4, main: 'Yaratıcılık', sub: 'Ritim çalgıları', outcome: 'Basit ritim çalgılarıyla eşlik eder' },
  { subject: 'Müzik', unit: 4, main: 'Yaratıcılık', sub: 'Ezgi oluşturma', outcome: 'Kendi ezgilerini oluşturma denemeleri yapar' },

  // ==================== BEDEN EĞİTİMİ VE SPORUN TEMELLERİ (5 Ünite) ====================
  { subject: 'Beden Eğitimi ve Spor', unit: 1, main: 'Sporun Tarihi', sub: 'Tarihsel gelişim', outcome: 'Sporun tarihsel gelişimini ve olimpiyatları öğrenir' },
  { subject: 'Beden Eğitimi ve Spor', unit: 1, main: 'Sporun Tarihi', sub: 'Temel kavramlar', outcome: 'Temel spor terimlerini kavram haritaları ile öğrenir' },
  { subject: 'Beden Eğitimi ve Spor', unit: 2, main: 'Spor Çeşitliliği', sub: 'Branşlar', outcome: 'Farklı spor branşlarını, kurallarını ve oynanışlarını tanır' },
  { subject: 'Beden Eğitimi ve Spor', unit: 3, main: 'Değerler', sub: 'Fair-play', outcome: 'Fair-play (dürüst oyun) kavramını içselleştirir' },
  { subject: 'Beden Eğitimi ve Spor', unit: 3, main: 'Değerler', sub: 'Takım ruhu', outcome: 'Takım ruhu, liderlik ve iş birliği değerlerini oyunlarla kazanır' },
  { subject: 'Beden Eğitimi ve Spor', unit: 4, main: 'Tesisler', sub: 'Spor alanları', outcome: 'Spor alanlarını, araç ve gereçlerini tanır ve güvenli kullanır' },
  { subject: 'Beden Eğitimi ve Spor', unit: 5, main: 'Zindelik', sub: 'Fiziksel aktivite', outcome: 'Düzenli fiziksel aktivitenin sağlık üzerindeki etkilerini kavrar' }
];

async function importGrade5Topics() {
  console.log('🎓 5. Sınıf Kazanımları Aktarımı Başlıyor...');
  console.log('📌 ORTAOKULA GEÇİŞ YILI - Bilişim Teknolojileri ve Yazılım dersi başlıyor!\n');
  
  const { data: subjects, error: subjectsError } = await supabase
    .from('subjects')
    .select('id, name');
  
  if (subjectsError) {
    console.error('❌ Dersler alınamadı:', subjectsError.message);
    return;
  }
  
  const subjectMap = {};
  subjects.forEach(s => { subjectMap[s.name] = s.id; });
  
  // Yeni ders: Bilişim Teknolojileri ve Yazılım
  const newSubjects = ['Bilişim Teknolojileri ve Yazılım'];
  for (const subName of newSubjects) {
    if (!subjectMap[subName]) {
      console.log(`⚠️ "${subName}" dersi bulunamadı, oluşturuluyor...`);
      const { data: newSubject, error } = await supabase
        .from('subjects')
        .insert({
          name: subName,
          code: 'bilisim-teknolojileri',
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
    .eq('grade', 5);
  
  const existingSet = new Set(
    (existingTopics || []).map(t => `${t.subject_id}|${t.main_topic}|${t.sub_topic}`)
  );
  
  console.log(`📋 Mevcut 5. sınıf konu sayısı: ${existingSet.size}`);
  
  let added = 0;
  let skipped = 0;
  let errors = [];
  
  for (const topic of grade5Topics) {
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
        grade: 5,
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
    
    process.stdout.write(`\r⏳ İşleniyor: ${added + skipped + errors.length}/${grade5Topics.length}`);
  }
  
  console.log('\n\n' + '='.repeat(50));
  console.log('📊 5. SINIF KAZANIMLARI SONUÇ:');
  console.log(`   ✅ Yeni eklenen: ${added}`);
  console.log(`   ⏭️ Zaten mevcut: ${skipped}`);
  console.log(`   📝 Toplam işlenen: ${grade5Topics.length}`);
  
  if (errors.length > 0) {
    console.log(`   ⚠️ Hatalar (${errors.length}):`);
    errors.slice(0, 10).forEach(e => console.log(`      - ${e}`));
  }
  
  const subjectSummary = {};
  grade5Topics.forEach(t => {
    subjectSummary[t.subject] = (subjectSummary[t.subject] || 0) + 1;
  });
  
  console.log('\n📖 Ders Bazında Dağılım:');
  Object.entries(subjectSummary).forEach(([subject, count]) => {
    console.log(`   ${subject}: ${count} kazanım`);
  });
  
  console.log('='.repeat(50));
}

importGrade5Topics()
  .then(() => {
    console.log('\n✅ 5. Sınıf müfredatı aktarımı tamamlandı!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Kritik hata:', err);
    process.exit(1);
  });


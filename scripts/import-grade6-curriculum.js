// 6. Sınıf MEB Türkiye Yüzyılı Maarif Modeli Kazanımları Import Script
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 6. Sınıf Müfredatı - Türkiye Yüzyılı Maarif Modeli 2025-2026
const grade6Topics = [
  // ==================== FEN BİLİMLERİ (7 Ünite) ====================
  // Ünite 1: Güneş Sistemi ve Tutulmalar
  { subject: 'Fen Bilimleri', unit: 1, main: 'Güneş Sistemi', sub: 'Gezegen sınıflandırma', outcome: 'Gezegenleri fiziksel ve yörüngesel niteliklerine göre sınıflandırır' },
  { subject: 'Fen Bilimleri', unit: 1, main: 'Güneş Sistemi', sub: 'Model oluşturma', outcome: 'Güneş sistemiyle ilgili özgün model tasarlar ve geliştirir' },
  { subject: 'Fen Bilimleri', unit: 1, main: 'Tutulmalar', sub: 'Güneş tutulması', outcome: 'Güneş tutulmasının oluşum mekanizmasını model ile açıklar' },
  { subject: 'Fen Bilimleri', unit: 1, main: 'Tutulmalar', sub: 'Ay tutulması', outcome: 'Ay tutulmasının oluşumunu üç boyutlu modellerle tasarlar' },
  
  // Ünite 2: Kuvvetin Etkisinde Hareket
  { subject: 'Fen Bilimleri', unit: 2, main: 'Kuvvet', sub: 'Bileşke kuvvet', outcome: 'Birden fazla kuvvetin yarattığı net kuvveti mantıksal ilişkilerle açıklar' },
  { subject: 'Fen Bilimleri', unit: 2, main: 'Kuvvet', sub: 'Dengeli kuvvetler', outcome: 'Dengeli ve dengelenmemiş kuvvetlerin hareket üzerindeki etkisini deneyle test eder' },
  { subject: 'Fen Bilimleri', unit: 2, main: 'Hareket', sub: 'Sürat ve hız', outcome: 'Sürat ve hız kavramlarını karşılaştırarak bilimsel tanımlarını yapar' },
  { subject: 'Fen Bilimleri', unit: 2, main: 'Hareket', sub: 'Deney tasarımı', outcome: 'Kuvvet-hareket ilişkisi için deney düzeneği tasarlar' },
  
  // Ünite 3: Canlılarda Sistemler
  { subject: 'Fen Bilimleri', unit: 3, main: 'Üreme', sub: 'Eşeyli-eşeysiz üreme', outcome: 'Eşeyli ve eşeysiz üreme mekanizmalarını karşılaştırır' },
  { subject: 'Fen Bilimleri', unit: 3, main: 'Büyüme ve Gelişme', sub: 'Çimlenme', outcome: 'Tohumun çimlenmesine etki eden faktörleri kontrollü deneyle inceler' },
  { subject: 'Fen Bilimleri', unit: 3, main: 'Büyüme ve Gelişme', sub: 'Hipotez kurma', outcome: 'Bitki büyümesine etki eden faktörler için hipotez kurar' },
  { subject: 'Fen Bilimleri', unit: 3, main: 'Ergenlik', sub: 'Psikososyal gelişim', outcome: 'Ergenlik dönemindeki fiziksel ve ruhsal değişimleri değerlendirir' },
  
  // Ünite 4: Işığın Yansıması ve Renkler
  { subject: 'Fen Bilimleri', unit: 4, main: 'Işık', sub: 'Yansıma kuralları', outcome: 'Işığın yansıması kurallarını deneysel verilerle açıklar' },
  { subject: 'Fen Bilimleri', unit: 4, main: 'Işık', sub: 'Gelen-yansıyan ışın', outcome: 'Gelen ışın, yansıyan ışın ve normal arasındaki ilişkiyi kanıtlarla açıklar' },
  { subject: 'Fen Bilimleri', unit: 4, main: 'Güneş Enerjisi', sub: 'Yenilikçi uygulamalar', outcome: 'Güneş enerjisinin teknolojideki yenilikçi uygulamalarını eleştirel düşünerek değerlendirir' },
  
  // Ünite 5: Maddenin Ayırt Edici Özellikleri
  { subject: 'Fen Bilimleri', unit: 5, main: 'Genleşme', sub: 'Isı ve genleşme', outcome: 'Isı etkisiyle maddelerin genleşip büzülmesini günlük gözlemlerle açıklar' },
  { subject: 'Fen Bilimleri', unit: 5, main: 'Yoğunluk', sub: 'Yoğunluk hesaplama', outcome: 'Maddelerin yoğunluğunu hesaplar ve karşılaştırır' },
  { subject: 'Fen Bilimleri', unit: 5, main: 'Yoğunluk', sub: 'Suyun anomalisi', outcome: 'Suyun donduğunda yoğunluğunun azalmasının canlılar için önemini açıklar' },
  
  // Ünite 6: Elektriğin İletimi ve Direnç
  { subject: 'Fen Bilimleri', unit: 6, main: 'Elektrik', sub: 'Değişken analizi', outcome: 'Ampul parlaklığını etkileyen değişkenleri belirleyerek deney tasarlar' },
  { subject: 'Fen Bilimleri', unit: 6, main: 'Elektrik', sub: 'Direnç', outcome: 'İletkenin cinsi, uzunluğu ve kesit alanının dirence etkisini inceler' },
  { subject: 'Fen Bilimleri', unit: 6, main: 'Elektrik', sub: 'Reosta', outcome: 'Reostanın ampul parlaklığı üzerindeki etkisini değerlendirir' },
  
  // Ünite 7: Sürdürülebilir Yaşam ve Etkileşim
  { subject: 'Fen Bilimleri', unit: 7, main: 'Biyoçeşitlilik', sub: 'Tehditler', outcome: 'Biyoçeşitliliği tehdit eden faktörleri araştırma verilerine dayalı analiz eder' },
  { subject: 'Fen Bilimleri', unit: 7, main: 'Çevre Sorunları', sub: 'Problem çözme', outcome: 'Çevre problemini yapılandırır ve veriye dayalı çözüm önerileri geliştirir' },
  { subject: 'Fen Bilimleri', unit: 7, main: 'Sürdürülebilirlik', sub: 'Sosyal sorumluluk', outcome: 'Sürdürülebilir yaşam için sosyal sorumluluk projesi geliştirir' },

  // ==================== BİLİŞİM TEKNOLOJİLERİ VE YAZILIM (6 Tema) ====================
  // Tema 1: Bilişim Teknolojilerinin Hayatımızdaki Yeri
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 1, main: 'Yenilikçi Teknolojiler', sub: 'AR/VR', outcome: 'Artırılmış ve sanal gerçeklik teknolojilerini tanımlar ve sınıflandırır' },
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 1, main: 'Yenilikçi Teknolojiler', sub: 'Giyilebilir teknoloji', outcome: 'Giyilebilir teknolojilerin kullanım alanlarını gruplandırır' },
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 1, main: 'Gelecek Projeksiyonu', sub: 'Toplumsal etki', outcome: 'Teknolojinin gelecekteki toplumsal etkilerini değerlendirir' },
  
  // Tema 2: Dijital Ürün Tasarımı ve Geliştirme
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 2, main: 'Veri Analizi', sub: 'Hesap tablosu', outcome: 'Hesap tablosu programlarıyla veri toplar ve düzenler' },
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 2, main: 'Veri Görselleştirme', sub: 'Grafikler', outcome: 'Verileri grafiklerle görselleştirir ve analiz eder' },
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 2, main: 'Multimedya', sub: 'Ses düzenleme', outcome: 'Ses düzenleme araçlarıyla özgün içerik üretir' },
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 2, main: 'Multimedya', sub: 'Video düzenleme', outcome: 'Video düzenleme araçlarıyla kurgu ve senaryo oluşturur' },
  
  // Tema 3: Bilgisayar Ağları ve İletişim
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 3, main: 'Arama Motorları', sub: 'İleri arama', outcome: 'İleri düzey arama operatörlerini kullanarak bilgiye erişir' },
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 3, main: 'İletişim', sub: 'Senkron/asenkron', outcome: 'Eş zamanlı ve farklı zamanlı iletişim araçlarını sınıflandırır' },
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 3, main: 'E-posta', sub: 'Resmi iletişim', outcome: 'E-postayı resmi ve amaca uygun şekilde kullanır' },
  
  // Tema 4: Bilişim Etiği ve Siber Güvenlik
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 4, main: 'Siber Güvenlik', sub: 'Risk yönetimi', outcome: 'Siber güvenlik risklerini belirler ve önlem alır' },
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 4, main: 'Siber Güvenlik', sub: 'Kimlik hırsızlığı', outcome: 'Kimlik hırsızlığına karşı korunma stratejileri geliştirir' },
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 4, main: 'Telif Hakkı', sub: 'Lisanslama', outcome: 'Creative Commons ve lisans türlerini karşılaştırır' },
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 4, main: 'Telif Hakkı', sub: 'Etik kullanım', outcome: 'Dijital içerik kullanımında hukuki ve etik sınırları kavrar' },
  
  // Tema 5: Yapay Zeka
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 5, main: 'Yapay Zeka', sub: 'Veri ve girdi', outcome: 'Yapay zekanın veri ile nasıl beslendiğini açıklar' },
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 5, main: 'Yapay Zeka', sub: 'Model eğitme', outcome: 'Hazır YZ araçlarıyla basit modeller eğitir ve test eder' },
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 5, main: 'Yapay Zeka', sub: 'Makine öğrenmesi', outcome: 'Makine öğrenmesinin temel mantığını kavrar' },
  
  // Tema 6: Yazılım Tasarımı ve Programlama
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 6, main: 'Programlama', sub: 'Yazılım süreci', outcome: 'Yazılım geliştirme sürecinin tüm adımlarını yönetir' },
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 6, main: 'Programlama', sub: 'Blok kodlama', outcome: 'Scratch/mBlock ile ileri düzey projeler geliştirir' },
  { subject: 'Bilişim Teknolojileri ve Yazılım', unit: 6, main: 'Programlama', sub: 'YZ destekli ürün', outcome: 'Blok tabanlı ortamda YZ eklentileriyle fonksiyonel ürün ortaya koyar' },

  // ==================== MATEMATİK (6 Tema) ====================
  // Tema 1: Sayılar ve Nicelikler (1)
  { subject: 'Matematik', unit: 1, main: 'Üslü İfadeler', sub: 'Üs kavramı', outcome: 'Üslü ifadeleri modellerle keşfeder ve işlem yapar' },
  { subject: 'Matematik', unit: 1, main: 'İşlem Önceliği', sub: 'Dört işlem', outcome: 'İşlem önceliği kurallarını uygular' },
  { subject: 'Matematik', unit: 1, main: 'Bölünebilme', sub: 'Bölünebilme kuralları', outcome: 'Bölünebilme kurallarını keşfeder ve uygular' },
  { subject: 'Matematik', unit: 1, main: 'Çarpanlar', sub: 'EBOB-EKOK', outcome: 'EBOB ve EKOK kavramlarını anlar ve hesaplar' },
  { subject: 'Matematik', unit: 1, main: 'Asal Sayılar', sub: 'Asal çarpanlar', outcome: 'Sayıları asal çarpanlarına ayırır' },
  
  // Tema 2: Sayılar ve Nicelikler (2)
  { subject: 'Matematik', unit: 2, main: 'Kesirler', sub: 'Kesir işlemleri', outcome: 'Kesirlerle dört işlem yapar' },
  { subject: 'Matematik', unit: 2, main: 'Ondalık Gösterim', sub: 'Çözümleme', outcome: 'Ondalık gösterimleri çözümler ve yuvarlar' },
  { subject: 'Matematik', unit: 2, main: 'Ondalık Gösterim', sub: 'Gerçek hayat', outcome: 'Kesir ve ondalık gösterimi gerçek hayat problemlerinde kullanır' },
  
  // Tema 3: İşlemlerle Cebirsel Düşünme
  { subject: 'Matematik', unit: 3, main: 'Cebirsel İfadeler', sub: 'Değişken', outcome: 'Değişken kavramını anlamlandırır ve kullanır' },
  { subject: 'Matematik', unit: 3, main: 'Cebirsel İfadeler', sub: 'Sözel-cebirsel dönüşüm', outcome: 'Sözel durumları cebirsel ifadelere dönüştürür' },
  { subject: 'Matematik', unit: 3, main: 'Örüntü', sub: 'Kural ifadesi', outcome: 'Aritmetik örüntülerin kuralını harfle ifade eder' },
  
  // Tema 4: Geometrik Şekiller
  { subject: 'Matematik', unit: 4, main: 'Açılar', sub: 'Açı türleri', outcome: 'Komşu, tümler, bütünler ve ters açıların özelliklerini keşfeder' },
  { subject: 'Matematik', unit: 4, main: 'Alan', sub: 'Üçgen alanı', outcome: 'Üçgenin alan bağıntısını şekil parçalama ile elde eder' },
  { subject: 'Matematik', unit: 4, main: 'Alan', sub: 'Paralelkenar alanı', outcome: 'Paralelkenarın alan bağıntısını çıkarımsal yöntemle elde eder' },
  
  // Tema 5: Geometrik Nicelikler
  { subject: 'Matematik', unit: 5, main: 'Çember', sub: 'Pi sayısı', outcome: 'Pi sayısı ile çember çevresi arasındaki ilişkiyi keşfeder' },
  { subject: 'Matematik', unit: 5, main: 'Çember', sub: 'Çevre uzunluğu', outcome: 'Çemberin çevre uzunluğunu hesaplar' },
  { subject: 'Matematik', unit: 5, main: 'Hacim', sub: 'Dikdörtgenler prizması', outcome: 'Dikdörtgenler prizmasının hacmini birim küplerle oluşturur' },
  { subject: 'Matematik', unit: 5, main: 'Hacim', sub: 'Birim dönüşümleri', outcome: 'Hacim ölçme birimleri arasında dönüşüm yapar' },
  
  // Tema 6: İstatistik ve Olasılık
  { subject: 'Matematik', unit: 6, main: 'Veri Analizi', sub: 'Araştırma sorusu', outcome: 'İki veri grubunu karşılaştıran araştırma sorusu oluşturur' },
  { subject: 'Matematik', unit: 6, main: 'Veri Analizi', sub: 'Aritmetik ortalama', outcome: 'Aritmetik ortalama ve açıklık kavramlarını kullanır' },
  { subject: 'Matematik', unit: 6, main: 'Olasılık', sub: 'Olasılık kavramı', outcome: 'Bir olayın olma olasılığını 0 ile 1 arasında ifade eder' },
  { subject: 'Matematik', unit: 6, main: 'Olasılık', sub: 'Basit olaylar', outcome: 'Basit olayların olasılık hesaplamalarını yapar' },

  // ==================== TÜRKÇE (6 Tema) ====================
  { subject: 'Türkçe', unit: 1, main: 'Dilimizin Zenginliği', sub: 'Söz varlığı', outcome: 'Türkçenin söz varlığını, deyim ve atasözlerini öğrenir' },
  { subject: 'Türkçe', unit: 1, main: 'Dilimizin Zenginliği', sub: 'Edebi zevk', outcome: 'Edebi metinlerde estetik değerleri fark eder' },
  { subject: 'Türkçe', unit: 2, main: 'Bağımsızlık Yolu', sub: 'Milli Mücadele', outcome: 'Milli Mücadele temalı metinleri analiz eder' },
  { subject: 'Türkçe', unit: 2, main: 'Bağımsızlık Yolu', sub: 'Tarih bilinci', outcome: 'Tarih bilincini metinler üzerinden geliştir' },
  { subject: 'Türkçe', unit: 3, main: 'Farklı Dünyalar', sub: 'Kültürlerarası empati', outcome: 'Farklı kültürlere empati kurarak okur' },
  { subject: 'Türkçe', unit: 3, main: 'Farklı Dünyalar', sub: 'Çocuk dünyası', outcome: 'Çocuk dünyasına ait metinleri yorumlar' },
  { subject: 'Türkçe', unit: 4, main: 'İletişim', sub: 'Toplumsal nezaket', outcome: 'Toplumsal nezaket kurallarını metinlerle öğrenir' },
  { subject: 'Türkçe', unit: 4, main: 'İletişim', sub: 'Etkili iletişim', outcome: 'Etkili iletişim tekniklerini uygular' },
  { subject: 'Türkçe', unit: 5, main: 'Bilim ve Teknoloji', sub: 'Bilimsel metin', outcome: 'Bilimsel metinleri okur ve anlar' },
  { subject: 'Türkçe', unit: 6, main: 'Lider Ruhlar', sub: 'Biyografi', outcome: 'Biyografik metinleri okur ve liderlik özelliklerini çıkarır' },
  
  // Genel Türkçe Becerileri
  { subject: 'Türkçe', unit: 7, main: 'Okuma', sub: 'Eleştirel okuma', outcome: 'Metnin tutarlılığını sorgulayarak eleştirel okur' },
  { subject: 'Türkçe', unit: 7, main: 'Okuma', sub: 'Örtük anlam', outcome: 'Metinlerdeki örtük anlamları çözümler' },
  { subject: 'Türkçe', unit: 7, main: 'Konuşma', sub: 'Topluluk önünde', outcome: 'Topluluk önünde kendini ifade eder ve beden dilini kullanır' },
  { subject: 'Türkçe', unit: 7, main: 'Yazma', sub: 'Metin türleri', outcome: 'Farklı metin türlerinde yazı yazar' },
  { subject: 'Türkçe', unit: 7, main: 'Kültür', sub: 'Kültürel okuryazarlık', outcome: 'Türk kültürüne ait motifleri ve değerleri fark eder' },

  // ==================== SOSYAL BİLGİLER (6 Öğrenme Alanı) ====================
  { subject: 'Sosyal Bilgiler', unit: 1, main: 'Birlikte Yaşamak', sub: 'Toplumsal uyum', outcome: 'Toplumsal uyum için gerekli davranışları sergiler' },
  { subject: 'Sosyal Bilgiler', unit: 2, main: 'Evimiz Dünya', sub: 'Harita okuryazarlığı', outcome: 'İleri düzey harita okuma becerisi kazanır' },
  { subject: 'Sosyal Bilgiler', unit: 2, main: 'Evimiz Dünya', sub: 'Coğrafi özellikler', outcome: 'Türkiye\'nin coğrafi özelliklerini analiz eder' },
  { subject: 'Sosyal Bilgiler', unit: 3, main: 'Ortak Mirasımız', sub: 'Tarihsel empati', outcome: 'Tarihsel olaylara empati kurarak yaklaşır' },
  { subject: 'Sosyal Bilgiler', unit: 3, main: 'Ortak Mirasımız', sub: 'Kanıt kullanma', outcome: 'Tarihsel olayları kanıtlarla destekler' },
  { subject: 'Sosyal Bilgiler', unit: 4, main: 'Yaşayan Demokrasimiz', sub: 'Demokratik değerler', outcome: 'Demokratik değerleri içselleştirir' },
  { subject: 'Sosyal Bilgiler', unit: 4, main: 'Yaşayan Demokrasimiz', sub: 'Vatandaşlık', outcome: 'Etkin vatandaşlık bilinci geliştirir' },
  { subject: 'Sosyal Bilgiler', unit: 5, main: 'Ekonomi', sub: 'Finansal okuryazarlık', outcome: 'Finansal okuryazarlık becerisi kazanır' },
  { subject: 'Sosyal Bilgiler', unit: 5, main: 'Ekonomi', sub: 'Girişimcilik', outcome: 'Girişimcilik kavramını ve önemini kavrar' },
  { subject: 'Sosyal Bilgiler', unit: 6, main: 'Teknoloji', sub: 'Bilgi değerlendirme', outcome: 'Bilgi kaynaklarını eleştirel değerlendirir' },

  // ==================== İNGİLİZCE ====================
  { subject: 'İngilizce', unit: 1, main: 'School Life', sub: 'Okul kuralları', outcome: 'Okul kurallarını İngilizce ifade eder ve mantıksal çıkarım yapar' },
  { subject: 'İngilizce', unit: 2, main: 'Daily Routines', sub: 'Günlük rutin', outcome: 'Günlük rutinlerini detaylı şekilde anlatır' },
  { subject: 'İngilizce', unit: 3, main: 'Hobbies', sub: 'Hobiler', outcome: 'Hobilerini ve ilgi alanlarını İngilizce ifade eder' },
  { subject: 'İngilizce', unit: 4, main: 'Weather', sub: 'Hava durumu', outcome: 'Hava durumunu İngilizce tanımlar ve tahmin yapar' },
  { subject: 'İngilizce', unit: 5, main: 'Comparisons', sub: 'Karşılaştırma', outcome: 'Karşılaştırma yapılarını kullanır' },
  { subject: 'İngilizce', unit: 6, main: 'Health', sub: 'Sağlık', outcome: 'Sağlık ve hastalık ile ilgili ifadeleri kullanır' },
  { subject: 'İngilizce', unit: 7, main: 'Movies', sub: 'Filmler', outcome: 'Film türleri ve tercihlerini İngilizce ifade eder' },
  { subject: 'İngilizce', unit: 8, main: 'Past Events', sub: 'Geçmiş zaman', outcome: 'Geçmişteki olayları Simple Past ile anlatır' },

  // ==================== DİN KÜLTÜRÜ VE AHLAK BİLGİSİ ====================
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 1, main: 'İnanç Esasları', sub: 'Peygamber inancı', outcome: 'Peygamberlere inanmanın önemini kavrar' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 1, main: 'İnanç Esasları', sub: 'İlahi kitaplar', outcome: 'İlahi kitapların özelliklerini öğrenir' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 2, main: 'İbadet', sub: 'Ramazan ve oruç', outcome: 'Ramazan ayının önemini ve orucun hikmetlerini açıklar' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 2, main: 'İbadet', sub: 'Sabır ve irade', outcome: 'Orucun sabır ve irade eğitimine katkısını kavrar' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 3, main: 'Ahlak', sub: 'Ahlaki davranışlar', outcome: 'Temel ahlaki davranışları içselleştirir' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 4, main: 'Hz. Muhammed', sub: 'El-Emin sıfatı', outcome: 'Hz. Muhammed\'in güvenilirlik özelliğini değerlendirir' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 4, main: 'Hz. Muhammed', sub: 'Peygamberlik öncesi', outcome: 'Hz. Muhammed\'in peygamberlik öncesi hayatını öğrenir' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 5, main: 'Kültür ve Sanat', sub: 'Dini motifler', outcome: 'Edebiyat ve mimarideki dini izleri keşfeder' },

  // ==================== GÖRSEL SANATLAR ====================
  { subject: 'Görsel Sanatlar', unit: 1, main: 'Müze ve Kültür', sub: 'Eser inceleme', outcome: 'Sanat eserlerini inceleyerek yorumlar' },
  { subject: 'Görsel Sanatlar', unit: 1, main: 'Müze ve Kültür', sub: 'Koruma bilinci', outcome: 'Sanat eserlerini koruma bilinci kazanır' },
  { subject: 'Görsel Sanatlar', unit: 2, main: 'Sanatın Görsel Dili', sub: 'Tasarım elemanları', outcome: 'Renk, biçim ve doku elemanlarını analitik inceler' },
  { subject: 'Görsel Sanatlar', unit: 3, main: 'Çizim', sub: 'Perspektif', outcome: 'Perspektif tekniklerini kullanarak çizim yapar' },
  { subject: 'Görsel Sanatlar', unit: 4, main: 'Yaratıcılık', sub: 'Özgün tasarım', outcome: 'Özgün görsel tasarımlar oluşturur' },

  // ==================== MÜZİK ====================
  { subject: 'Müzik', unit: 1, main: 'Müzik Dili', sub: 'Nota okuryazarlığı', outcome: 'Birlik, ikilik nota ve susları tanır' },
  { subject: 'Müzik', unit: 1, main: 'Müzik Dili', sub: 'Ritim', outcome: 'Farklı ritim kalıplarını uygular' },
  { subject: 'Müzik', unit: 2, main: 'Milli Değerler', sub: 'İstiklal Marşı', outcome: 'İstiklal Marşı\'nı teknik doğrulukla icra eder' },
  { subject: 'Müzik', unit: 3, main: 'Performans', sub: 'Şarkı söyleme', outcome: 'Şarkıları doğru ton ve ritimlede söyler' },
  { subject: 'Müzik', unit: 4, main: 'Müzik Kültürü', sub: 'Türk müziği', outcome: 'Türk halk ve sanat müziği örneklerini tanır' },

  // ==================== BEDEN EĞİTİMİ VE SPOR ====================
  { subject: 'Beden Eğitimi ve Spor', unit: 1, main: 'Anatomi', sub: 'Vücut sistemleri', outcome: 'İnsan vücudunun temel anatomisini öğrenir' },
  { subject: 'Beden Eğitimi ve Spor', unit: 1, main: 'Anatomi', sub: 'Sporun biyolojik temeli', outcome: 'Sporun biyolojik temellerini kavrar' },
  { subject: 'Beden Eğitimi ve Spor', unit: 2, main: 'Aktif Yaşam', sub: 'Zindelik', outcome: 'Yaşam boyu spor alışkanlığı kazanır' },
  { subject: 'Beden Eğitimi ve Spor', unit: 2, main: 'Aktif Yaşam', sub: 'Fiziksel uygunluk', outcome: 'Fiziksel uygunluk testlerini uygular' },
  { subject: 'Beden Eğitimi ve Spor', unit: 3, main: 'Spor Branşları', sub: 'Takım sporları', outcome: 'Takım sporlarında iş birliği yapar' },
  { subject: 'Beden Eğitimi ve Spor', unit: 3, main: 'Spor Branşları', sub: 'Bireysel sporlar', outcome: 'Bireysel sporlarda teknik geliştirir' }
];

async function importGrade6Topics() {
  console.log('🎓 6. Sınıf Kazanımları Aktarımı Başlıyor...\n');
  
  const { data: subjects, error: subjectsError } = await supabase
    .from('subjects')
    .select('id, name');
  
  if (subjectsError) {
    console.error('❌ Dersler alınamadı:', subjectsError.message);
    return;
  }
  
  const subjectMap = {};
  subjects.forEach(s => { subjectMap[s.name] = s.id; });
  
  console.log('📚 Mevcut dersler alındı');
  
  const { data: existingTopics } = await supabase
    .from('topics')
    .select('main_topic, sub_topic, subject_id')
    .eq('grade', 6);
  
  const existingSet = new Set(
    (existingTopics || []).map(t => `${t.subject_id}|${t.main_topic}|${t.sub_topic}`)
  );
  
  console.log(`📋 Mevcut 6. sınıf konu sayısı: ${existingSet.size}`);
  
  let added = 0;
  let skipped = 0;
  let errors = [];
  
  for (const topic of grade6Topics) {
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
        grade: 6,
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
    
    process.stdout.write(`\r⏳ İşleniyor: ${added + skipped + errors.length}/${grade6Topics.length}`);
  }
  
  console.log('\n\n' + '='.repeat(50));
  console.log('📊 6. SINIF KAZANIMLARI SONUÇ:');
  console.log(`   ✅ Yeni eklenen: ${added}`);
  console.log(`   ⏭️ Zaten mevcut: ${skipped}`);
  console.log(`   📝 Toplam işlenen: ${grade6Topics.length}`);
  
  if (errors.length > 0) {
    console.log(`   ⚠️ Hatalar (${errors.length}):`);
    errors.slice(0, 10).forEach(e => console.log(`      - ${e}`));
  }
  
  const subjectSummary = {};
  grade6Topics.forEach(t => {
    subjectSummary[t.subject] = (subjectSummary[t.subject] || 0) + 1;
  });
  
  console.log('\n📖 Ders Bazında Dağılım:');
  Object.entries(subjectSummary).forEach(([subject, count]) => {
    console.log(`   ${subject}: ${count} kazanım`);
  });
  
  console.log('='.repeat(50));
}

importGrade6Topics()
  .then(() => {
    console.log('\n✅ 6. Sınıf müfredatı aktarımı tamamlandı!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Kritik hata:', err);
    process.exit(1);
  });


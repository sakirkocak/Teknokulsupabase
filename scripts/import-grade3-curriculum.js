// 3. Sınıf MEB Türkiye Yüzyılı Maarif Modeli Kazanımları Import Script
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 3. Sınıf Müfredatı - Türkiye Yüzyılı Maarif Modeli 2025-2026
const grade3Topics = [
  // ==================== MATEMATİK ====================
  // Tema 1: Sayılar ve Nicelikler (1)
  { subject: 'Matematik', unit: 1, main: 'Doğal Sayılar', sub: 'Üç basamaklı sayılar', outcome: '0-999 aralığındaki sayıları okur, yazar ve modeller' },
  { subject: 'Matematik', unit: 1, main: 'Basamak Değeri', sub: 'Yüzler basamağı', outcome: 'Basamak değeri kavramını yüzler basamağına genişletir' },
  { subject: 'Matematik', unit: 1, main: 'Yuvarlama', sub: 'Onluğa yuvarlama', outcome: 'Sayıları en yakın onluğa yuvarlar' },
  { subject: 'Matematik', unit: 1, main: 'Yuvarlama', sub: 'Yüzlüğe yuvarlama', outcome: 'Sayıları en yakın yüzlüğe yuvarlar' },
  { subject: 'Matematik', unit: 1, main: 'Romen Rakamları', sub: '20\'ye kadar', outcome: '20\'ye kadar olan Romen rakamlarını okur ve yazar' },
  
  // Tema 2: Sayılar ve Nicelikler (2) - Kesirler
  { subject: 'Matematik', unit: 2, main: 'Kesirler', sub: 'Kesir kavramı', outcome: 'Kesir kavramını ve gösterimini anlar' },
  { subject: 'Matematik', unit: 2, main: 'Kesirler', sub: 'Birim kesirler', outcome: 'Birim kesirleri tanır ve modeller' },
  { subject: 'Matematik', unit: 2, main: 'Kesirler', sub: 'Kesir karşılaştırma', outcome: 'Paydaları eşit kesirleri karşılaştırır' },
  
  // Tema 3: İşlemlerden Cebirsel Düşünmeye
  { subject: 'Matematik', unit: 3, main: 'Toplama', sub: 'Üç basamaklı toplama', outcome: 'Üç basamaklı sayılarla eldeli toplama yapar' },
  { subject: 'Matematik', unit: 3, main: 'Çıkarma', sub: 'Üç basamaklı çıkarma', outcome: 'Üç basamaklı sayılarla onluk bozarak çıkarma yapar' },
  { subject: 'Matematik', unit: 3, main: 'Zihinden İşlem', sub: 'Toplama stratejileri', outcome: 'Zihinden toplama stratejileri geliştirir' },
  { subject: 'Matematik', unit: 3, main: 'Çarpma', sub: 'Çarpım tablosu', outcome: 'Çarpım tablosunu oluşturur ve kullanır' },
  { subject: 'Matematik', unit: 3, main: 'Çarpma', sub: '10 ve 100 ile çarpma', outcome: '10 ve 100 ile kısa yoldan çarpma yapar' },
  { subject: 'Matematik', unit: 3, main: 'Bölme', sub: 'Gruplama mantığı', outcome: 'Bölme işlemini gruplama ve paylaştırma mantığıyla yapar' },
  { subject: 'Matematik', unit: 3, main: 'Bölme', sub: 'Kalanlı bölme', outcome: 'Kalanlı bölme işlemi yapar' },
  { subject: 'Matematik', unit: 3, main: 'Cebirsel Düşünme', sub: 'Bilinmeyen bulma', outcome: 'İşlemlerde verilmeyen öğeyi bulur' },
  { subject: 'Matematik', unit: 3, main: 'Örüntü', sub: 'Örüntü tanıma', outcome: 'Sayı ve şekil örüntülerini tanır ve devam ettirir' },
  
  // Tema 4: Nesnelerin Geometrisi
  { subject: 'Matematik', unit: 4, main: 'Geometrik Şekiller', sub: '2D şekiller', outcome: 'Üçgen, kare, dikdörtgen, daire özelliklerini inceler' },
  { subject: 'Matematik', unit: 4, main: 'Geometrik Cisimler', sub: '3D cisimler', outcome: 'Küp, prizma gibi 3D cisimleri sınıflandırır' },
  { subject: 'Matematik', unit: 4, main: 'Ölçme', sub: 'Uzunluk', outcome: 'Metre ve santimetre ile uzunluk ölçer' },
  { subject: 'Matematik', unit: 4, main: 'Ölçme', sub: 'Zaman', outcome: 'Analog ve dijital saat okur' },
  { subject: 'Matematik', unit: 4, main: 'Ölçme', sub: 'Tartma', outcome: 'Gram ve kilogram ile kütle ölçer' },
  { subject: 'Matematik', unit: 4, main: 'Ölçme', sub: 'Sıvı ölçme', outcome: 'Litre ile sıvı ölçer' },
  
  // Tema 5: Veriye Dayalı Araştırma
  { subject: 'Matematik', unit: 5, main: 'Veri Toplama', sub: 'Çetele tutma', outcome: 'Veri toplar ve çetele ile kaydeder' },
  { subject: 'Matematik', unit: 5, main: 'Veri Düzenleme', sub: 'Sıklık tablosu', outcome: 'Verileri sıklık tablosuna dönüştürür' },
  { subject: 'Matematik', unit: 5, main: 'Grafik', sub: 'Şekil grafiği', outcome: 'Şekil ve nesne grafiği oluşturur' },
  { subject: 'Matematik', unit: 5, main: 'Veri Analizi', sub: 'Grafik yorumlama', outcome: 'Grafiklerden veri okur ve yorumlar' },
  { subject: 'Matematik', unit: 5, main: 'Problem Çözme', sub: 'Veri problemleri', outcome: 'Grafikten elde edilen verilerle problem çözer' },

  // ==================== TÜRKÇE ====================
  // Tema 1: Erdemler / Değerlerimizle Yaşıyoruz
  { subject: 'Türkçe', unit: 1, main: 'Değerler', sub: 'Saygı ve sevgi', outcome: 'Saygı, sevgi ve dürüstlük değerlerini içselleştirir' },
  { subject: 'Türkçe', unit: 1, main: 'Sosyal Beceriler', sub: 'Etik protokoller', outcome: 'Sosyal etkileşimde etik kuralları uygular' },
  
  // Tema 2: Milli Mücadele ve Atatürk
  { subject: 'Türkçe', unit: 2, main: 'Tarihsel Bilgi', sub: 'Kolektif hafıza', outcome: 'Milli mücadele ve Atatürk hakkında bilgi edinir' },
  { subject: 'Türkçe', unit: 2, main: 'Milli Bilinç', sub: 'Kahramanlarımız', outcome: 'Milli kahramanları tanır ve saygı duyar' },
  
  // Tema 3: Doğa ve Evren
  { subject: 'Türkçe', unit: 3, main: 'Ekolojik Okuryazarlık', sub: 'Çevre terminolojisi', outcome: 'Çevre ve doğa ile ilgili kavramları öğrenir' },
  { subject: 'Türkçe', unit: 3, main: 'Doğa Bilinci', sub: 'Sürdürülebilirlik', outcome: 'Doğayı koruma bilinci kazanır' },
  
  // Tema 4: Bilim ve Teknoloji
  { subject: 'Türkçe', unit: 4, main: 'Teknik Okuryazarlık', sub: 'İcatlar ve keşifler', outcome: 'İcatlar, keşifler ve bilgi teknolojileri kavramlarını öğrenir' },
  { subject: 'Türkçe', unit: 4, main: 'Bilim', sub: 'Bilim yolculuğu', outcome: 'Bilimsel düşünce ve merak kavramlarını geliştirir' },
  
  // Tema 5: Vatandaşlık / Hak ve Sorumluluklar
  { subject: 'Türkçe', unit: 5, main: 'Haklar', sub: 'Temel haklar', outcome: 'Temel hak ve özgürlükleri kavrar' },
  { subject: 'Türkçe', unit: 5, main: 'Sorumluluklar', sub: 'Vatandaşlık', outcome: 'Vatandaşlık sorumluluklarını anlar' },
  
  // Tema 6: Sağlık ve Spor
  { subject: 'Türkçe', unit: 6, main: 'Sağlık', sub: 'Sağlıklı yaşam', outcome: 'Sağlıklı yaşam kavramlarını öğrenir' },
  { subject: 'Türkçe', unit: 6, main: 'Spor', sub: 'Fiziksel aktivite', outcome: 'Spor ve fiziksel aktivitenin önemini kavrar' },
  
  // Tema 7: Milli Kültürümüz
  { subject: 'Türkçe', unit: 7, main: 'Kültürel Miras', sub: 'Sanat verileri', outcome: 'Milli kültür ve sanat değerlerini tanır' },
  { subject: 'Türkçe', unit: 7, main: 'Gelenekler', sub: 'Kültürel ögeler', outcome: 'Geleneksel kültürel ögeleri öğrenir' },
  
  // Tema 8: Çocuk Dünyası
  { subject: 'Türkçe', unit: 8, main: 'Yaratıcılık', sub: 'Hayal gücü', outcome: 'Yaratıcılık ve hayal gücünü geliştirir' },
  { subject: 'Türkçe', unit: 8, main: 'Çocuk Hakları', sub: 'Oyun ve eğlence', outcome: 'Çocuk haklarını ve oyunun önemini kavrar' },
  
  // Türkçe Beceri Alanları
  { subject: 'Türkçe', unit: 9, main: 'Dinleme', sub: 'Aktif dinleme', outcome: 'Dinleme kurallarına uygun olarak dinler' },
  { subject: 'Türkçe', unit: 9, main: 'Dinleme', sub: 'Ana fikir', outcome: 'Dinlediği metinde ana fikri bulur' },
  { subject: 'Türkçe', unit: 9, main: 'Dinleme', sub: 'Tahmin etme', outcome: 'Görsellerden hareketle içeriği tahmin eder' },
  { subject: 'Türkçe', unit: 9, main: 'Okuma', sub: 'Akıcı okuma', outcome: 'Sesli ve sessiz okuma tekniklerini uygular' },
  { subject: 'Türkçe', unit: 9, main: 'Okuma', sub: 'Eş anlamlı', outcome: 'Eş anlamlı kelimeleri tespit eder' },
  { subject: 'Türkçe', unit: 9, main: 'Okuma', sub: 'Zıt anlamlı', outcome: 'Zıt anlamlı kelimeleri tespit eder' },
  { subject: 'Türkçe', unit: 9, main: 'Okuma', sub: 'Metin yapısı', outcome: 'Hikaye unsurlarını (yer, zaman, karakter, olay) belirler' },
  { subject: 'Türkçe', unit: 9, main: 'Konuşma', sub: 'Hazırlıklı konuşma', outcome: 'Sunum yapma ve organize konuşma becerisi kazanır' },
  { subject: 'Türkçe', unit: 9, main: 'Konuşma', sub: 'İletişim kuralları', outcome: 'Göz teması ve hitap şeklini doğru uygular' },
  { subject: 'Türkçe', unit: 9, main: 'Yazma', sub: 'Yazım kuralları', outcome: 'Yazım ve noktalama kurallarını uygular' },
  { subject: 'Türkçe', unit: 9, main: 'Yazma', sub: 'Form doldurma', outcome: 'Formları yönergelerine uygun doldurur' },
  { subject: 'Türkçe', unit: 9, main: 'Yazma', sub: 'Özgün metin', outcome: 'Hikaye, şiir veya bilgilendirici metin yazar' },

  // ==================== FEN BİLİMLERİ (YENİ DERS) ====================
  // Ünite 1: Gezegenimizi Tanıyalım
  { subject: 'Fen Bilimleri', unit: 1, main: 'Dünya', sub: 'Dünya\'nın katmanları', outcome: 'Dünya\'nın hava, su ve kara katmanlarını tanır' },
  { subject: 'Fen Bilimleri', unit: 1, main: 'Dünya', sub: 'Küresel şekil', outcome: 'Dünya\'nın küresel şeklini kavrar' },
  
  // Ünite 2: Beş Duyumuz
  { subject: 'Fen Bilimleri', unit: 2, main: 'Duyu Organları', sub: 'Göz', outcome: 'Gözün yapısını ve görme işlevini öğrenir' },
  { subject: 'Fen Bilimleri', unit: 2, main: 'Duyu Organları', sub: 'Kulak', outcome: 'Kulağın yapısını ve işitme işlevini öğrenir' },
  { subject: 'Fen Bilimleri', unit: 2, main: 'Duyu Organları', sub: 'Deri', outcome: 'Derinin dokunma duyusu işlevini öğrenir' },
  { subject: 'Fen Bilimleri', unit: 2, main: 'Duyu Organları', sub: 'Burun ve dil', outcome: 'Burun ve dilin koklama ve tatma işlevlerini öğrenir' },
  { subject: 'Fen Bilimleri', unit: 2, main: 'Algı', sub: 'Duyu sınırları', outcome: 'Duyu organlarının kapasitelerini ve sınırlarını anlar' },
  
  // Ünite 3: Kuvveti Tanıyalım
  { subject: 'Fen Bilimleri', unit: 3, main: 'Kuvvet', sub: 'İtme ve çekme', outcome: 'İtme ve çekme kuvvetlerini tanır' },
  { subject: 'Fen Bilimleri', unit: 3, main: 'Hareket', sub: 'Hızlanma ve yavaşlama', outcome: 'Hızlanma ve yavaşlama kavramlarını anlar' },
  { subject: 'Fen Bilimleri', unit: 3, main: 'Hareket', sub: 'Yön değiştirme', outcome: 'Kuvvetin yön değiştirmeye etkisini gözlemler' },
  
  // Ünite 4: Maddeyi Tanıyalım
  { subject: 'Fen Bilimleri', unit: 4, main: 'Madde Özellikleri', sub: 'Sert ve yumuşak', outcome: 'Maddelerin sertlik/yumuşaklık özelliklerini sınıflandırır' },
  { subject: 'Fen Bilimleri', unit: 4, main: 'Madde Özellikleri', sub: 'Pürüzlü ve düz', outcome: 'Maddelerin yüzey özelliklerini sınıflandırır' },
  { subject: 'Fen Bilimleri', unit: 4, main: 'Maddenin Halleri', sub: 'Katı, sıvı, gaz', outcome: 'Maddenin üç halini tanır ve örneklendirir' },
  { subject: 'Fen Bilimleri', unit: 4, main: 'Hal Değişimi', sub: 'Erime ve donma', outcome: 'Maddenin hal değişimlerini gözlemler' },
  
  // Ünite 5: Çevremizdeki Işık ve Ses
  { subject: 'Fen Bilimleri', unit: 5, main: 'Işık', sub: 'Işık kaynakları', outcome: 'Doğal ve yapay ışık kaynaklarını tanır' },
  { subject: 'Fen Bilimleri', unit: 5, main: 'Işık', sub: 'Işığın yayılması', outcome: 'Işığın doğrusal yayılımını gözlemler' },
  { subject: 'Fen Bilimleri', unit: 5, main: 'Ses', sub: 'Ses kaynakları', outcome: 'Ses kaynaklarını tanır' },
  { subject: 'Fen Bilimleri', unit: 5, main: 'Ses', sub: 'Ses yayılımı', outcome: 'Sesin farklı ortamlarda yayılımını gözlemler' },
  
  // Ünite 6: Canlılar Dünyası
  { subject: 'Fen Bilimleri', unit: 6, main: 'Canlı ve Cansız', sub: 'Ayrım yapma', outcome: 'Canlı ve cansız varlıkları ayırt eder' },
  { subject: 'Fen Bilimleri', unit: 6, main: 'Yaşam Döngüsü', sub: 'Büyüme ve gelişme', outcome: 'Canlıların yaşam döngülerini inceler' },
  { subject: 'Fen Bilimleri', unit: 6, main: 'Çevre Bilinci', sub: 'Doğa koruma', outcome: 'Çevre koruma bilinci geliştirir' },
  
  // Ünite 7: Elektrikli Araçlar
  { subject: 'Fen Bilimleri', unit: 7, main: 'Elektrik Kaynakları', sub: 'Pil ve batarya', outcome: 'Pil, akü, batarya ve şehir elektriğini tanır' },
  { subject: 'Fen Bilimleri', unit: 7, main: 'Elektrikli Aletler', sub: 'Kullanım amaçları', outcome: 'Elektrikli aletleri kullanım amaçlarına göre sınıflandırır' },
  { subject: 'Fen Bilimleri', unit: 7, main: 'Güvenlik', sub: 'Elektrik güvenliği', outcome: 'Elektriğin güvenli kullanımını öğrenir' },

  // ==================== HAYAT BİLGİSİ ====================
  // Öğrenme Alanı 1: Ben ve Okulum
  { subject: 'Hayat Bilgisi', unit: 1, main: 'Kendini Tanıma', sub: 'Güçlü ve zayıf yönler', outcome: 'Güçlü yönlerini ve geliştirilmesi gereken yönlerini fark eder' },
  { subject: 'Hayat Bilgisi', unit: 1, main: 'Kaynak Yönetimi', sub: 'Okul kaynakları', outcome: 'Okul kaynaklarını verimli kullanır' },
  { subject: 'Hayat Bilgisi', unit: 1, main: 'Sosyal İlişkiler', sub: 'Arkadaşlık ve yardımlaşma', outcome: 'Arkadaşlık ilişkilerinde yardımlaşma bilinci kazanır' },
  
  // Öğrenme Alanı 2: Evimizde Hayat
  { subject: 'Hayat Bilgisi', unit: 2, main: 'Tarihsel Karşılaştırma', sub: 'Nesiller arası', outcome: 'Aile büyüklerinin çocukluğu ile kendi çocukluğunu karşılaştırır' },
  { subject: 'Hayat Bilgisi', unit: 2, main: 'Mekansal Beceri', sub: 'Kroki çizme', outcome: 'Evin konumunu kroki ile çizer' },
  { subject: 'Hayat Bilgisi', unit: 2, main: 'Sorumluluk', sub: 'Ev görevleri', outcome: 'Evdeki sorumluluklarını yerine getirir' },
  
  // Öğrenme Alanı 3: Sağlıklı ve Güvenli Hayat
  { subject: 'Hayat Bilgisi', unit: 3, main: 'Beslenme', sub: 'Dengeli beslenme', outcome: 'Dengeli beslenme ve mevsimsel ürün seçimini öğrenir' },
  { subject: 'Hayat Bilgisi', unit: 3, main: 'Trafik', sub: 'Trafik işaretleri', outcome: 'Trafik işaretlerini okur ve kurallara uyar' },
  { subject: 'Hayat Bilgisi', unit: 3, main: 'Acil Durum', sub: '112 protokolü', outcome: 'Kaza anında 112\'yi aramayı bilir' },
  
  // Öğrenme Alanı 4: Ülkemizde Hayat
  { subject: 'Hayat Bilgisi', unit: 4, main: 'Yönetim', sub: 'Yönetim hiyerarşisi', outcome: 'Muhtar, Kaymakam, Vali hiyerarşisini öğrenir' },
  { subject: 'Hayat Bilgisi', unit: 4, main: 'Cumhuriyet', sub: 'Yönetim biçimi', outcome: 'Cumhuriyet yönetimi ve demokrasiyi anlar' },
  { subject: 'Hayat Bilgisi', unit: 4, main: 'Milli Bilinç', sub: 'Tarihi yerler', outcome: 'Yakın çevresindeki tarihi yerleri tanır' },
  
  // Öğrenme Alanı 5: Doğada Hayat
  { subject: 'Hayat Bilgisi', unit: 5, main: 'Geri Dönüşüm', sub: 'Atık yönetimi', outcome: 'Geri dönüşüm ve atık yönetimini uygular' },
  { subject: 'Hayat Bilgisi', unit: 5, main: 'Ekoloji', sub: 'Döngüsel ekonomi', outcome: 'Doğanın döngüsel yapısını anlar' },

  // ==================== İNGİLİZCE ====================
  // Theme 1: Greeting
  { subject: 'İngilizce', unit: 1, main: 'Tanışma', sub: 'Selamlaşma', outcome: 'Hello, My name is... kalıplarını kullanır' },
  { subject: 'İngilizce', unit: 1, main: 'İletişim', sub: 'Tanışma protokolleri', outcome: 'Tanışma ve selamlaşma protokollerini uygular' },
  
  // Theme 2: My Family
  { subject: 'İngilizce', unit: 2, main: 'Aile', sub: 'Aile ağacı', outcome: 'Aile üyelerini İngilizce tanımlar' },
  { subject: 'İngilizce', unit: 2, main: 'İlişkiler', sub: 'Akrabalık terimleri', outcome: 'Mother, Father, Sister, Brother terimlerini kullanır' },
  
  // Theme 3: People I Love
  { subject: 'İngilizce', unit: 3, main: 'Fiziksel Özellikler', sub: 'Tanımlama', outcome: 'Fiziksel özellikleri İngilizce tanımlar' },
  { subject: 'İngilizce', unit: 3, main: 'Sıfatlar', sub: 'Big/Small, Tall/Short', outcome: 'Temel sıfatları kullanarak kişileri betimler' },
  
  // Theme 4: Feelings
  { subject: 'İngilizce', unit: 4, main: 'Duygular', sub: 'Duygu ifadeleri', outcome: 'Happy, Sad, Angry gibi duyguları ifade eder' },
  { subject: 'İngilizce', unit: 4, main: 'Sorgulama', sub: 'How are you?', outcome: 'Duygu durumu sorma ve cevaplama yapar' },
  
  // Theme 5: Toys and Games
  { subject: 'İngilizce', unit: 5, main: 'Oyuncaklar', sub: 'Sahiplik', outcome: 'I have got... kalıbıyla sahiplik belirtir' },
  { subject: 'İngilizce', unit: 5, main: 'Sayılar', sub: '11-20 arası', outcome: '11-20 arası sayıları İngilizce söyler' },
  
  // Theme 6: My House
  { subject: 'İngilizce', unit: 6, main: 'Ev', sub: 'Mekansal konum', outcome: 'In, On, Under edatlarıyla konum belirtir' },
  { subject: 'İngilizce', unit: 6, main: 'Odalar', sub: 'Ev bölümleri', outcome: 'Evin bölümlerini İngilizce söyler' },
  
  // Theme 7: In My City
  { subject: 'İngilizce', unit: 7, main: 'Şehir', sub: 'Yer isimleri', outcome: 'Hospital, School, Park gibi yerleri İngilizce söyler' },
  { subject: 'İngilizce', unit: 7, main: 'Yön', sub: 'Yer tarifi', outcome: 'Basit yer tarifi yapar' },
  
  // Theme 8: Transportation
  { subject: 'İngilizce', unit: 8, main: 'Ulaşım', sub: 'Araçlar', outcome: 'Car, Bus, Plane gibi ulaşım araçlarını öğrenir' },
  { subject: 'İngilizce', unit: 8, main: 'Tercih', sub: 'Ulaşım tercihi', outcome: 'Ulaşım araçlarıyla ilgili tercih belirtir' },
  
  // Theme 9: Weather
  { subject: 'İngilizce', unit: 9, main: 'Hava Durumu', sub: 'Hava koşulları', outcome: 'Sunny, Rainy, Hot, Cold gibi hava durumu ifadelerini kullanır' },
  { subject: 'İngilizce', unit: 9, main: 'Raporlama', sub: 'Hava raporu', outcome: 'Basit hava durumu raporu yapar' },
  
  // Theme 10: Nature
  { subject: 'İngilizce', unit: 10, main: 'Doğa', sub: 'Hayvanlar', outcome: 'Hayvan isimlerini İngilizce öğrenir' },
  { subject: 'İngilizce', unit: 10, main: 'Tercihler', sub: 'I like / I don\'t like', outcome: 'Sevdiklerini ve sevmediklerini ifade eder' },

  // ==================== GÖRSEL SANATLAR ====================
  { subject: 'Görsel Sanatlar', unit: 1, main: 'Biçimlendirme', sub: 'Geometrik biçimler', outcome: 'İki boyutlu yüzeyde geometrik biçimleri düzenler' },
  { subject: 'Görsel Sanatlar', unit: 1, main: 'Biçimlendirme', sub: 'Organik biçimler', outcome: 'Organik biçimleri tanır ve kullanır' },
  { subject: 'Görsel Sanatlar', unit: 2, main: 'Renk', sub: 'Ana ve ara renkler', outcome: 'Ana ve ara renkleri tanır ve kullanır' },
  { subject: 'Görsel Sanatlar', unit: 2, main: 'Renk', sub: 'Sıcak ve soğuk renkler', outcome: 'Sıcak ve soğuk renkleri ayırt eder' },
  { subject: 'Görsel Sanatlar', unit: 3, main: 'Figür-Mekan', sub: 'Konum ve büyüklük', outcome: 'Nesnelerin boşluktaki konumu ve büyüklük oranlarını inceler' },
  { subject: 'Görsel Sanatlar', unit: 3, main: 'Perspektif', sub: 'Derinlik algısı', outcome: 'Perspektif algısının temellerini kavrar' },

  // ==================== MÜZİK ====================
  { subject: 'Müzik', unit: 1, main: 'Ses', sub: 'Gürültü ve müzik', outcome: 'Gürültü ve müzik arasındaki farkı ayırt eder' },
  { subject: 'Müzik', unit: 1, main: 'Ritim', sub: 'Zamanlama', outcome: 'Belirli bir tempoda hareket eder veya ses üretir' },
  { subject: 'Müzik', unit: 2, main: 'Milli Marşlar', sub: 'İstiklal Marşı', outcome: 'İstiklal Marşı\'nı doğru ve coşkuyla söyler' },
  { subject: 'Müzik', unit: 2, main: 'Repertuvar', sub: 'Belirli gün şarkıları', outcome: 'Belirli gün ve hafta şarkılarını öğrenir' },
  { subject: 'Müzik', unit: 3, main: 'Kültür', sub: 'Ninniler', outcome: 'Ninnileri tanır ve söyler' },
  { subject: 'Müzik', unit: 3, main: 'Dinleme', sub: 'Müzik analizi', outcome: 'Müzik eserlerini dikkatle dinler ve analiz eder' },

  // ==================== BEDEN EĞİTİMİ VE OYUN ====================
  { subject: 'Beden Eğitimi ve Spor', unit: 1, main: 'Hareket', sub: 'Temel hareketler', outcome: 'Koşma, zıplama, sekme gibi temel hareketleri geliştirir' },
  { subject: 'Beden Eğitimi ve Spor', unit: 1, main: 'Koordinasyon', sub: 'El-göz koordinasyonu', outcome: 'El-göz koordinasyonunu geliştirir' },
  { subject: 'Beden Eğitimi ve Spor', unit: 2, main: 'Oyunlar', sub: 'Geleneksel oyunlar', outcome: 'Geleneksel çocuk oyunlarını oynar' },
  { subject: 'Beden Eğitimi ve Spor', unit: 2, main: 'Kurallar', sub: 'Fair play', outcome: 'Adil oyun kurallarını uygular' },
  { subject: 'Beden Eğitimi ve Spor', unit: 3, main: 'Sağlık', sub: 'Aktif yaşam', outcome: 'Aktif yaşamın sağlığa faydalarını anlar' },
  { subject: 'Beden Eğitimi ve Spor', unit: 3, main: 'Takım Çalışması', sub: 'İş birliği', outcome: 'Takım oyunlarında iş birliği yapar' }
];

async function importGrade3Topics() {
  console.log('🎓 3. Sınıf Kazanımları Aktarımı Başlıyor...\n');
  
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
    .eq('grade', 3);
  
  const existingSet = new Set(
    (existingTopics || []).map(t => `${t.subject_id}|${t.main_topic}|${t.sub_topic}`)
  );
  
  console.log(`📋 Mevcut 3. sınıf konu sayısı: ${existingSet.size}`);
  
  let added = 0;
  let skipped = 0;
  let errors = [];
  
  for (const topic of grade3Topics) {
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
        grade: 3,
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
    
    process.stdout.write(`\r⏳ İşleniyor: ${added + skipped + errors.length}/${grade3Topics.length}`);
  }
  
  console.log('\n\n' + '='.repeat(50));
  console.log('📊 3. SINIF KAZANIMLARI SONUÇ:');
  console.log(`   ✅ Yeni eklenen: ${added}`);
  console.log(`   ⏭️ Zaten mevcut: ${skipped}`);
  console.log(`   📝 Toplam işlenen: ${grade3Topics.length}`);
  
  if (errors.length > 0) {
    console.log(`   ⚠️ Hatalar (${errors.length}):`);
    errors.slice(0, 10).forEach(e => console.log(`      - ${e}`));
  }
  
  const subjectSummary = {};
  grade3Topics.forEach(t => {
    subjectSummary[t.subject] = (subjectSummary[t.subject] || 0) + 1;
  });
  
  console.log('\n📖 Ders Bazında Dağılım:');
  Object.entries(subjectSummary).forEach(([subject, count]) => {
    console.log(`   ${subject}: ${count} kazanım`);
  });
  
  console.log('='.repeat(50));
}

importGrade3Topics()
  .then(() => {
    console.log('\n✅ 3. Sınıf müfredatı aktarımı tamamlandı!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Kritik hata:', err);
    process.exit(1);
  });


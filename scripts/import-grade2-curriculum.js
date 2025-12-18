// 2. Sınıf MEB Türkiye Yüzyılı Maarif Modeli Kazanımları Import Script
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 2. Sınıf Müfredatı - Türkiye Yüzyılı Maarif Modeli 2025-2026
const grade2Topics = [
  // ==================== TÜRKÇE ====================
  // Tema 1: Değerlerimizle Varız
  { subject: 'Türkçe', unit: 1, main: 'Değerler', sub: 'Sevgi ve saygı', outcome: 'Sevgi, saygı ve yardımseverlik değerlerini içselleştirir' },
  { subject: 'Türkçe', unit: 1, main: 'Kendini İfade', sub: 'Empati kurma', outcome: 'Kendini ifade etme ve empati kurma becerilerini geliştirir' },
  { subject: 'Türkçe', unit: 1, main: 'Kültür', sub: 'Kültürel kodlar', outcome: 'Kendi kültürel kodlarını tanır' },
  
  // Tema 2: Atatürk ve Çocuk
  { subject: 'Türkçe', unit: 2, main: 'Milli Bilinç', sub: 'Vatanseverlik', outcome: 'Vatanseverlik değerini kavrar' },
  { subject: 'Türkçe', unit: 2, main: 'Tarihsel Empati', sub: 'Çıkarım yapma', outcome: 'Tarihsel figürlerle empati kurarak çıkarım yapar' },
  { subject: 'Türkçe', unit: 2, main: 'Liderlik', sub: 'Atatürk özellikleri', outcome: 'Atatürk\'ün çocuk sevgisi ve liderlik özelliklerini tanır' },
  
  // Tema 3: Doğada Neler Oluyor?
  { subject: 'Türkçe', unit: 3, main: 'Gözlem', sub: 'Doğa gözlemi', outcome: 'Doğada gözlem yaparak neden-sonuç ilişkisi kurar' },
  { subject: 'Türkçe', unit: 3, main: 'Çevre Bilinci', sub: 'Sürdürülebilirlik', outcome: 'Çevre bilinci ve sürdürülebilirlik kavramlarını anlar' },
  { subject: 'Türkçe', unit: 3, main: 'Sorumluluk', sub: 'Temizlik', outcome: 'Çevreye karşı sorumluluk ve temizlik bilinci kazanır' },
  
  // Tema 4: Okuma Serüvenimiz
  { subject: 'Türkçe', unit: 4, main: 'Okuma', sub: 'Okuma stratejileri', outcome: 'Okuma stratejileri geliştirir' },
  { subject: 'Türkçe', unit: 4, main: 'Kütüphane', sub: 'Kitap sevgisi', outcome: 'Kitap sevgisi ve kütüphane kültürü edinir' },
  { subject: 'Türkçe', unit: 4, main: 'Değerler', sub: 'Çalışkanlık ve sabır', outcome: 'Çalışkanlık ve sabır değerlerini kavrar' },
  
  // Tema 5: Yeteneklerimizi Tanıyoruz
  { subject: 'Türkçe', unit: 5, main: 'Kendini Tanıma', sub: 'Bireysel farklılıklar', outcome: 'Bireysel farklılıkların ve yeteneklerin keşfini yapar' },
  { subject: 'Türkçe', unit: 5, main: 'Özgüven', sub: 'Takdir etme', outcome: 'Özgüven ve başkalarını takdir etme becerisi kazanır' },
  
  // Tema 6: Mucit Çocuk
  { subject: 'Türkçe', unit: 6, main: 'Yaratıcılık', sub: 'Yaratıcı düşünme', outcome: 'Yaratıcı düşünme ve problem çözme becerisi geliştirir' },
  { subject: 'Türkçe', unit: 6, main: 'Merak', sub: 'Bilim okuryazarlığı', outcome: 'Merak duygusunu geliştirerek bilim ve teknoloji okuryazarlığına giriş yapar' },
  
  // Tema 7: Kültür Hazinemiz
  { subject: 'Türkçe', unit: 7, main: 'Kültür Okuryazarlığı', sub: 'Gelenekler', outcome: 'Bayramlar, gelenekler ve kültürel miras ögelerini tanır' },
  { subject: 'Türkçe', unit: 7, main: 'Değerler', sub: 'Misafirperverlik', outcome: 'Misafirperverlik ve vefa değerlerini kavrar' },
  
  // Tema 8: Haklarımızı Biliyoruz
  { subject: 'Türkçe', unit: 8, main: 'Haklar', sub: 'Çocuk hakları', outcome: 'Çocuk hakları ve demokrasi kültürünü tanır' },
  { subject: 'Türkçe', unit: 8, main: 'Değerler', sub: 'Adalet ve özgürlük', outcome: 'Adalet ve özgürlük değerlerini kavrar' },
  { subject: 'Türkçe', unit: 8, main: 'Sorumluluk', sub: 'Hak arama', outcome: 'Hak arama ve sorumluluk bilinci geliştirir' },
  
  // Türkçe Beceri Alanları
  { subject: 'Türkçe', unit: 9, main: 'Dinleme/İzleme', sub: 'Tahmin etme', outcome: 'Görsellerden hareketle olayların oluş sırası hakkında tahminlerde bulunur' },
  { subject: 'Türkçe', unit: 9, main: 'Dinleme/İzleme', sub: 'Karakter analizi', outcome: 'Dinlenen metindeki kişilerin benzer ve farklı yönlerini açıklar' },
  { subject: 'Türkçe', unit: 9, main: 'Okuma', sub: 'Metinle etkileşim', outcome: 'Okuyacağı metnin başlığını ve görsellerini inceleyerek içerik hakkında varsayımlar üretir' },
  { subject: 'Türkçe', unit: 9, main: 'Okuma', sub: 'Teknik okuma', outcome: 'Noktalama işaretlerinin işlevine uygun tonlama yaparak okur' },
  { subject: 'Türkçe', unit: 9, main: 'Yazma', sub: 'Araştırma becerisi', outcome: 'Anlamı bilinmeyen sözcükleri belirler ve kaynaklardan araştırır' },
  { subject: 'Türkçe', unit: 9, main: 'Yazma', sub: 'Kurallı yazım', outcome: 'Büyük harflerin ve noktalama işaretlerinin doğru kullanımını yapar' },

  // ==================== MATEMATİK ====================
  // Tema 1-2: Sayılar ve Nicelikler
  { subject: 'Matematik', unit: 1, main: 'Sayılar', sub: '100\'e kadar sayılar', outcome: '100\'e kadar olan doğal sayıları okur ve yazar' },
  { subject: 'Matematik', unit: 1, main: 'Sayılar', sub: 'Sayı hissi', outcome: 'Sayı hissini (number sense) geliştirir' },
  { subject: 'Matematik', unit: 1, main: 'Çözümleme', sub: 'Onluk ve birlik', outcome: 'Sayıların onluk ve birliklerine ayrılmasını farklı yöntemlerle yapar' },
  { subject: 'Matematik', unit: 1, main: 'Kesirler', sub: 'Bütün, yarım, çeyrek', outcome: 'Bütün, yarım ve çeyrek kavramlarını somut materyallerle kavrar' },
  { subject: 'Matematik', unit: 2, main: 'Zaman', sub: 'Saat okuma', outcome: 'Saatleri tam, yarım ve çeyrek olarak okur' },
  { subject: 'Matematik', unit: 2, main: 'Zaman', sub: 'Zaman planlama', outcome: 'Günün bölümlerini planlayarak zaman yönetimi yapar' },
  
  // Tema 3: İşlemlerden Cebirsel Düşünmeye
  { subject: 'Matematik', unit: 3, main: 'Toplama', sub: 'Eldeli toplama', outcome: 'Eldeli toplama işleminin mantığını anlar ve uygular' },
  { subject: 'Matematik', unit: 3, main: 'Çıkarma', sub: 'Onluk bozarak çıkarma', outcome: 'Onluk bozarak çıkarma işlemini somut modellerle yapar' },
  { subject: 'Matematik', unit: 3, main: 'Çarpma', sub: 'Tekrarlı toplama', outcome: 'Çarpma işlemini tekrarlı toplama mantığıyla kavrar' },
  { subject: 'Matematik', unit: 3, main: 'Bölme', sub: 'Gruplandırma', outcome: 'Bölme işlemini gruplandırma ve ardışık çıkarma mantığıyla kavrar' },
  { subject: 'Matematik', unit: 3, main: 'Cebirsel Düşünme', sub: 'Eşitlik kavramı', outcome: 'Eşittir sembolünün denge anlamını kavrar' },
  { subject: 'Matematik', unit: 3, main: 'Problem Çözme', sub: 'Deste ve düzine', outcome: 'Deste ve düzine kavramlarını içeren problemleri çözer' },
  
  // Tema 4-5: Nesnelerin Geometrisi
  { subject: 'Matematik', unit: 4, main: 'Geometrik Cisimler', sub: 'Şekil özellikleri', outcome: 'Geometrik cisimlerin ve şekillerin özelliklerini inceler' },
  { subject: 'Matematik', unit: 4, main: 'Uzamsal İlişkiler', sub: 'Yön ve konum', outcome: 'Yön, konum ve hareket kavramlarını kullanır' },
  { subject: 'Matematik', unit: 5, main: 'Ölçme', sub: 'Tahmin etme', outcome: 'Uzunluk ve kütle ölçümlerinde tahmin yapar' },
  { subject: 'Matematik', unit: 5, main: 'Ölçme', sub: 'Standart birimler', outcome: 'Metre ve kilogram gibi standart birimleri kullanır' },
  { subject: 'Matematik', unit: 5, main: 'Ölçme', sub: 'Karşılaştırma', outcome: 'Tahmin ile gerçek ölçüm sonucunu karşılaştırır' },
  
  // Tema 6: Veriye Dayalı Araştırma
  { subject: 'Matematik', unit: 6, main: 'Veri Okuryazarlığı', sub: 'Araştırma sorusu', outcome: 'Basit araştırma soruları oluşturur' },
  { subject: 'Matematik', unit: 6, main: 'Veri Toplama', sub: 'Çetele tutma', outcome: 'Veri toplar ve çetele tutar' },
  { subject: 'Matematik', unit: 6, main: 'Veri Görselleştirme', sub: 'Grafik oluşturma', outcome: 'Sıklık tablosu, nesne grafiği ve şekil grafiği oluşturur' },
  { subject: 'Matematik', unit: 6, main: 'Veri Analizi', sub: 'Yorum yapma', outcome: 'Grafik ve tabloları yorumlar' },

  // ==================== HAYAT BİLGİSİ ====================
  // Öğrenme Alanı 1: Ben ve Okulum
  { subject: 'Hayat Bilgisi', unit: 1, main: 'Okul Kültürü', sub: 'Okul kuralları', outcome: 'Okul kültürü ve kurallarını uygular' },
  { subject: 'Hayat Bilgisi', unit: 1, main: 'Arkadaşlık', sub: 'Arkadaşlık ilişkileri', outcome: 'Sağlıklı arkadaşlık ilişkileri kurar' },
  
  // Öğrenme Alanı 2: Sağlığım ve Güvenliğim
  { subject: 'Hayat Bilgisi', unit: 2, main: 'Kişisel Bakım', sub: 'Hijyen', outcome: 'Kişisel bakım ve hijyen kurallarını uygular' },
  { subject: 'Hayat Bilgisi', unit: 2, main: 'Beslenme', sub: 'Dengeli beslenme', outcome: 'Dengeli beslenmenin önemini kavrar' },
  { subject: 'Hayat Bilgisi', unit: 2, main: 'Teknoloji', sub: 'Bağımlılıktan korunma', outcome: 'Teknoloji bağımlılığından korunma yollarını bilir' },
  { subject: 'Hayat Bilgisi', unit: 2, main: 'Güvenlik', sub: 'Güvenlik kuralları', outcome: 'Ev ve okul güvenlik kurallarını uygular' },
  
  // Öğrenme Alanı 3: Ailem ve Toplum
  { subject: 'Hayat Bilgisi', unit: 3, main: 'Aile', sub: 'Aile içi roller', outcome: 'Aile içi rolleri ve sorumlulukları anlar' },
  { subject: 'Hayat Bilgisi', unit: 3, main: 'Akrabalık', sub: 'Akrabalık ilişkileri', outcome: 'Akrabalık ilişkilerini tanır' },
  { subject: 'Hayat Bilgisi', unit: 3, main: 'Toplum', sub: 'Komşuluk kültürü', outcome: 'Komşuluk kültürü ve yardımlaşma bilinci kazanır' },
  
  // Öğrenme Alanı 4: Yaşadığım Yer ve Ülkem
  { subject: 'Hayat Bilgisi', unit: 4, main: 'Yerel Tarih', sub: 'Tarihi mekanlar', outcome: 'Yakın çevresindeki tarihi mekanları tanır' },
  { subject: 'Hayat Bilgisi', unit: 4, main: 'Atatürk', sub: 'Atatürk\'ün çocukluğu', outcome: 'Atatürk\'ün çocukluk anıları üzerinden kişilik özelliklerini analiz eder' },
  { subject: 'Hayat Bilgisi', unit: 4, main: 'Bayramlar', sub: 'Milli bayramlar', outcome: 'Milli bayramları coşkuyla kutlar ve önemini kavrar' },
  { subject: 'Hayat Bilgisi', unit: 4, main: 'Bayramlar', sub: 'Dini bayramlar', outcome: 'Dini bayramlarda saygı ve yardımlaşma değerlerini uygular' },
  { subject: 'Hayat Bilgisi', unit: 4, main: 'Milli Semboller', sub: 'Vatanseverlik', outcome: 'Milli sembollere saygı gösterir ve vatanseverlik bilinci kazanır' },
  
  // Öğrenme Alanı 5: Doğa ve Çevre
  { subject: 'Hayat Bilgisi', unit: 5, main: 'Çevre Bilinci', sub: 'Geri dönüşüm', outcome: 'Geri dönüşüm ve çevre koruma bilinci edinir' },
  { subject: 'Hayat Bilgisi', unit: 5, main: 'Canlılar', sub: 'Bitki ve hayvanlar', outcome: 'Bitki ve hayvanları koruma sorumluluğu kazanır' },
  
  // Değerler Eğitimi
  { subject: 'Hayat Bilgisi', unit: 6, main: 'Değerler', sub: 'Adalet', outcome: 'Arkadaşlık ilişkilerinde adil davranma ilkesini uygular' },
  { subject: 'Hayat Bilgisi', unit: 6, main: 'Değerler', sub: 'Farklılıklara saygı', outcome: 'Bireysel farklılıkları zenginlik olarak kabul eder' },
  { subject: 'Hayat Bilgisi', unit: 6, main: 'Değerler', sub: 'Dürüstlük', outcome: 'İkilem durumlarında dürüst davranmayı öğrenir' },

  // ==================== İNGİLİZCE (YENİ DERS) ====================
  // Theme 1: Words
  { subject: 'İngilizce', unit: 1, main: 'Alfabe', sub: 'Phonics', outcome: 'Alfabe seslerini (phonics) tanır ve telaffuz eder' },
  { subject: 'İngilizce', unit: 1, main: 'Kelimeler', sub: 'Temel kelimeler', outcome: 'Temel nesne isimlerini öğrenir' },
  
  // Theme 2: Friends
  { subject: 'İngilizce', unit: 2, main: 'Tanışma', sub: 'Selamlaşma', outcome: 'Hello, What is your name? gibi kalıpları kullanır' },
  { subject: 'İngilizce', unit: 2, main: 'İletişim', sub: 'Nezaket kalıpları', outcome: 'Temel nezaket kalıplarını kullanır' },
  
  // Theme 3: In the Classroom
  { subject: 'İngilizce', unit: 3, main: 'Sınıf', sub: 'Sınıf eşyaları', outcome: 'Sınıf eşyalarının İngilizce isimlerini öğrenir' },
  { subject: 'İngilizce', unit: 3, main: 'Komutlar', sub: 'Temel komutlar', outcome: 'Stand up, sit down, open your book gibi komutları anlar' },
  
  // Theme 4: Numbers & Colours
  { subject: 'İngilizce', unit: 4, main: 'Sayılar', sub: '1-20 arası sayılar', outcome: '1-20 arası sayıları İngilizce söyler' },
  { subject: 'İngilizce', unit: 4, main: 'Renkler', sub: 'Renk isimleri', outcome: 'Renklerin İngilizce isimlerini öğrenir' },
  
  // Theme 5: At the Playground
  { subject: 'İngilizce', unit: 5, main: 'Oyun Parkı', sub: 'Oyun araçları', outcome: 'Oyun parkı araçlarının isimlerini öğrenir' },
  { subject: 'İngilizce', unit: 5, main: 'Hareket', sub: 'Hareket fiilleri', outcome: 'Jump, run, swing gibi hareket fiillerini kullanır' },
  
  // Theme 6: Body Parts
  { subject: 'İngilizce', unit: 6, main: 'Vücut', sub: 'Vücut bölümleri', outcome: 'Head, shoulders, knees, toes gibi vücut bölümlerini öğrenir' },
  
  // Theme 7: Pets / Animals
  { subject: 'İngilizce', unit: 7, main: 'Hayvanlar', sub: 'Evcil hayvanlar', outcome: 'Evcil ve vahşi hayvan isimlerini öğrenir' },
  { subject: 'İngilizce', unit: 7, main: 'Sesler', sub: 'Hayvan sesleri', outcome: 'Hayvan seslerini İngilizce ifade eder' },
  
  // Theme 8: Fruits
  { subject: 'İngilizce', unit: 8, main: 'Meyveler', sub: 'Meyve isimleri', outcome: 'Meyve isimlerini İngilizce öğrenir' },
  { subject: 'İngilizce', unit: 8, main: 'Tercih', sub: 'I like / I don\'t like', outcome: 'I like..., I don\'t like... kalıplarıyla tercih belirtir' },
  
  // Theme 9: School Life
  { subject: 'İngilizce', unit: 9, main: 'Okul', sub: 'Okul rutinleri', outcome: 'Okul rutinlerini İngilizce ifade eder' },
  { subject: 'İngilizce', unit: 9, main: 'Dersler', sub: 'Ders isimleri', outcome: 'Ders isimlerini İngilizce öğrenir' },
  
  // Theme 10: Personal Life
  { subject: 'İngilizce', unit: 10, main: 'Kendini Tanıtma', sub: 'Kişisel bilgiler', outcome: 'Kendini tanıtma ve yaşını söyleme' },
  
  // Theme 11: Family Life
  { subject: 'İngilizce', unit: 11, main: 'Aile', sub: 'Aile bireyleri', outcome: 'Mother, father, sister gibi aile bireylerini öğrenir' },
  
  // Theme 12: Homes & Houses
  { subject: 'İngilizce', unit: 12, main: 'Ev', sub: 'Evin bölümleri', outcome: 'Evin bölümlerini ve eşyaları İngilizce öğrenir' },
  
  // Theme 13: Life in the City
  { subject: 'İngilizce', unit: 13, main: 'Şehir', sub: 'Şehir yaşamı', outcome: 'Basit şehir yaşamı ve ulaşım araçlarını öğrenir' },

  // ==================== GÖRSEL SANATLAR ====================
  // Tema 3: Sanatçılar ve Eserleri
  { subject: 'Görsel Sanatlar', unit: 1, main: 'Sanat Tanıma', sub: 'Sanatçılar', outcome: 'Ünlü Türk ve dünya ressamlarını tanır' },
  { subject: 'Görsel Sanatlar', unit: 1, main: 'Sanat Kavramları', sub: 'Natürmort', outcome: 'Natürmort gibi sanat kavramlarını öğrenir' },
  { subject: 'Görsel Sanatlar', unit: 1, main: 'Sanat Okuryazarlığı', sub: 'Betimleme', outcome: 'Sanat eserlerini betimleme, çözümleme ve yargıda bulunma' },
  
  // Tema 4: Çizim ve Görsel İfade
  { subject: 'Görsel Sanatlar', unit: 2, main: 'Geometrik Formlar', sub: 'Doğadaki şekiller', outcome: 'Doğadaki nesnelerin geometrik formlarını inceler' },
  { subject: 'Görsel Sanatlar', unit: 2, main: 'Çizim', sub: 'Doğa peyzajı', outcome: 'Doğa gözlemleri yaparak kağıda aktarır' },
  { subject: 'Görsel Sanatlar', unit: 2, main: 'Malzeme', sub: 'Grafit kalem', outcome: 'Grafit kalem gibi farklı malzemeleri kullanır' },
  
  // Tema 6: Milli Değerler ve Sanat
  { subject: 'Görsel Sanatlar', unit: 3, main: 'Kültürel Ögeler', sub: 'Kilim motifleri', outcome: 'Kilim motifleri gibi kültürel ögeleri tanır' },
  { subject: 'Görsel Sanatlar', unit: 3, main: 'Geleneksel Sanat', sub: 'Ebru sanatı', outcome: 'Ebru sanatını tanır ve deneyimler' },
  { subject: 'Görsel Sanatlar', unit: 3, main: 'Üretim', sub: 'Özgün ürün', outcome: 'Kültürel değerlerden yola çıkarak özgün ürünler oluşturur' },
  
  // Disiplinlerarası
  { subject: 'Görsel Sanatlar', unit: 4, main: 'Sürdürülebilirlik', sub: 'Atık malzeme', outcome: 'Atık malzemeleri sanat eserine dönüştürür' },
  { subject: 'Görsel Sanatlar', unit: 4, main: 'Sergi', sub: 'Eser sergileme', outcome: 'Çalışmalarını dijital veya fiziksel ortamda sergiler' },
  { subject: 'Görsel Sanatlar', unit: 4, main: 'Takdir', sub: 'Eser değerlendirme', outcome: 'Arkadaşlarının eserlerini takdir eder' },

  // ==================== MÜZİK ====================
  // Tema 1: Müzik Dili
  { subject: 'Müzik', unit: 1, main: 'Müzik Kavramları', sub: 'Sesin özellikleri', outcome: 'Sesin yüksekliği, gürlüğü ve hızını ayırt eder' },
  { subject: 'Müzik', unit: 1, main: 'Notasyon', sub: 'Nota işaretleri', outcome: 'Temel notasyon işaretlerini tanır' },
  { subject: 'Müzik', unit: 1, main: 'Milli Marş', sub: 'İstiklal Marşı', outcome: 'İstiklal Marşı\'nı doğru, gür ve coşkuyla söyler' },
  
  // Tema 2: Koro / Ses Eğitimi
  { subject: 'Müzik', unit: 2, main: 'Koro', sub: 'Birlikte söyleme', outcome: 'Birlikte şarkı söyleme kültürü geliştirir' },
  { subject: 'Müzik', unit: 2, main: 'Ses Sağlığı', sub: 'Doğru nefes', outcome: 'Doğru nefes alma ve diyafram kullanımını öğrenir' },
  { subject: 'Müzik', unit: 2, main: 'Duruş', sub: 'Postür', outcome: 'Doğru duruş (postür) çalışmaları yapar' },
  
  // Tema 3: Ritmik Hareket
  { subject: 'Müzik', unit: 3, main: 'Ritim', sub: 'Ritim kalıpları', outcome: 'Basit ritim kalıplarını ve iki vuruşlu ölçüleri fark eder' },
  { subject: 'Müzik', unit: 3, main: 'Hareket', sub: 'Bedensel eşlik', outcome: 'Müziğin ritmine bedensel hareketlerle eşlik eder' },
  { subject: 'Müzik', unit: 3, main: 'Dinleme', sub: 'Odaklanma', outcome: 'Bir müzik eserini dikkatle dinler ve nüansları ayırt eder' },

  // ==================== BEDEN EĞİTİMİ VE OYUN ====================
  // Tema 1: Hareketimi Geliştiriyorum
  { subject: 'Beden Eğitimi ve Spor', unit: 1, main: 'Yer Değiştirme', sub: 'Koşma ve zıplama', outcome: 'Koşma, zıplama ve sekme hareketlerini geliştirir' },
  { subject: 'Beden Eğitimi ve Spor', unit: 1, main: 'Nesne Kontrolü', sub: 'Top becerileri', outcome: 'Top atma, tutma ve sürme becerilerini geliştirir' },
  { subject: 'Beden Eğitimi ve Spor', unit: 1, main: 'Denge', sub: 'Denge hareketleri', outcome: 'Denge hareketlerini uygular' },
  
  // Tema 2: Oyunun Kurallarını Uyguluyorum
  { subject: 'Beden Eğitimi ve Spor', unit: 2, main: 'Geleneksel Oyunlar', sub: 'Türk oyunları', outcome: 'Yağ Satarım Bal Satarım, Köşe Kapmaca gibi oyunları oynar' },
  { subject: 'Beden Eğitimi ve Spor', unit: 2, main: 'Strateji', sub: 'Strateji geliştirme', outcome: 'Oyunlarda strateji geliştirme becerisi kazanır' },
  { subject: 'Beden Eğitimi ve Spor', unit: 2, main: 'Kurallar', sub: 'Kurallara uyma', outcome: 'Oyun kurallarına uyma bilinci geliştirir' },
  
  // Tema 3: Sağlığım İçin
  { subject: 'Beden Eğitimi ve Spor', unit: 3, main: 'Sağlık', sub: 'Spor ve sağlık', outcome: 'Sporun sağlıkla ilişkisini anlar' },
  { subject: 'Beden Eğitimi ve Spor', unit: 3, main: 'Aktif Yaşam', sub: 'Hareketli yaşam', outcome: 'Hareketli yaşamın önemini kavrar' },
  
  // Değerler
  { subject: 'Beden Eğitimi ve Spor', unit: 4, main: 'Fair Play', sub: 'Adil oyun', outcome: 'Kazanmayı tevazu ile, kaybetmeyi olgunlukla karşılar' },
  { subject: 'Beden Eğitimi ve Spor', unit: 4, main: 'İş Birliği', sub: 'Takım çalışması', outcome: 'Takım oyunlarında iş birliği yapar' },
  { subject: 'Beden Eğitimi ve Spor', unit: 4, main: 'Dürüstlük', sub: 'Hile yapmama', outcome: 'Oyun kurallarına hile yapmadan uyar' },
  { subject: 'Beden Eğitimi ve Spor', unit: 4, main: 'Kültür', sub: 'Geleneksel oyunlar', outcome: 'Geleneksel oyunları öğrenerek kültürel mirası yaşatır' }
];

async function importGrade2Topics() {
  console.log('🎓 2. Sınıf Kazanımları Aktarımı Başlıyor...\n');
  
  // Önce mevcut dersleri al
  const { data: subjects, error: subjectsError } = await supabase
    .from('subjects')
    .select('id, name');
  
  if (subjectsError) {
    console.error('❌ Dersler alınamadı:', subjectsError.message);
    return;
  }
  
  // Ders adı -> id eşleştirmesi
  const subjectMap = {};
  subjects.forEach(s => {
    subjectMap[s.name] = s.id;
  });
  
  console.log('📚 Mevcut dersler alındı');
  
  // Önce 2. sınıf için mevcut konuları kontrol et
  const { data: existingTopics } = await supabase
    .from('topics')
    .select('main_topic, sub_topic, subject_id')
    .eq('grade', 2);
  
  // Mevcut konuları bir Set olarak tut
  const existingSet = new Set(
    (existingTopics || []).map(t => `${t.subject_id}|${t.main_topic}|${t.sub_topic}`)
  );
  
  console.log(`📋 Mevcut 2. sınıf konu sayısı: ${existingSet.size}`);
  
  let added = 0;
  let skipped = 0;
  let errors = [];
  
  for (const topic of grade2Topics) {
    const subjectId = subjectMap[topic.subject];
    
    if (!subjectId) {
      errors.push(`Ders bulunamadı: ${topic.subject}`);
      continue;
    }
    
    const key = `${subjectId}|${topic.main}|${topic.sub}`;
    
    // Zaten varsa atla
    if (existingSet.has(key)) {
      skipped++;
      continue;
    }
    
    const { error } = await supabase
      .from('topics')
      .insert({
        subject_id: subjectId,
        grade: 2,
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
    
    process.stdout.write(`\r⏳ İşleniyor: ${added + skipped + errors.length}/${grade2Topics.length}`);
  }
  
  console.log('\n\n' + '='.repeat(50));
  console.log('📊 2. SINIF KAZANIMLARI SONUÇ:');
  console.log(`   ✅ Yeni eklenen: ${added}`);
  console.log(`   ⏭️ Zaten mevcut: ${skipped}`);
  console.log(`   📝 Toplam işlenen: ${grade2Topics.length}`);
  
  if (errors.length > 0) {
    console.log(`   ⚠️ Hatalar (${errors.length}):`);
    errors.slice(0, 10).forEach(e => console.log(`      - ${e}`));
    if (errors.length > 10) console.log(`      ... ve ${errors.length - 10} hata daha`);
  }
  
  // Özet bilgi
  const subjectSummary = {};
  grade2Topics.forEach(t => {
    subjectSummary[t.subject] = (subjectSummary[t.subject] || 0) + 1;
  });
  
  console.log('\n📖 Ders Bazında Dağılım:');
  Object.entries(subjectSummary).forEach(([subject, count]) => {
    console.log(`   ${subject}: ${count} kazanım`);
  });
  
  console.log('='.repeat(50));
}

importGrade2Topics()
  .then(() => {
    console.log('\n✅ 2. Sınıf müfredatı aktarımı tamamlandı!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Kritik hata:', err);
    process.exit(1);
  });



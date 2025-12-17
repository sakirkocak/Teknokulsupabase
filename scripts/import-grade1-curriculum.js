// 1. Sınıf MEB Türkiye Yüzyılı Maarif Modeli Kazanımları Import Script
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 1. Sınıf Müfredatı - Türkiye Yüzyılı Maarif Modeli 2025-2026
const grade1Topics = [
  // ==================== TÜRKÇE ====================
  // Tema 1: Güzel Davranışlarımız
  { subject: 'Türkçe', unit: 1, main: 'Dinleme ve İzleme', sub: 'Dinleme sürecini yönetme', outcome: 'Öğrenci dinleme sürecini yönetebilir, seslere karşılık gelen harfleri tanır' },
  { subject: 'Türkçe', unit: 1, main: 'Dinleme ve İzleme', sub: 'Tahmin yapma', outcome: 'Görsellerden hareketle dinleyeceği metin hakkında tahminlerde bulunur' },
  { subject: 'Türkçe', unit: 1, main: 'Konuşma', sub: 'Doğru telaffuz', outcome: 'Öğrendiği sesleri ve sözcükleri işitilebilir bir ses düzeyinde ve doğru telaffuzla söyler' },
  { subject: 'Türkçe', unit: 1, main: 'Okuma', sub: 'Harf ve hece tanıma', outcome: 'Harf ve heceleri doğru seslendirir' },
  { subject: 'Türkçe', unit: 1, main: 'Yazma', sub: 'Temel form yazımı', outcome: 'Harflerin temel formlarına uygun yazar' },
  
  // Tema 2: Mustafa Kemal'den Atatürk'e
  { subject: 'Türkçe', unit: 2, main: 'Dinleme ve İzleme', sub: 'Ön bilgiyle karşılaştırma', outcome: 'Dinlediklerini ön bilgileriyle karşılaştırarak olayların gelişimi hakkında çıkarım yapar' },
  { subject: 'Türkçe', unit: 2, main: 'Konuşma', sub: 'Geçiş ifadeleri', outcome: 'Konuşmalarında uygun geçiş ifadelerini (ama, fakat, ancak vb.) kullanır' },
  { subject: 'Türkçe', unit: 2, main: 'Okuma', sub: 'Noktalama işaretleri', outcome: 'Noktalama işaretlerine dikkat ederek okur' },
  { subject: 'Türkçe', unit: 2, main: 'Yazma', sub: 'Büyük harf kullanımı', outcome: 'Büyük harfleri yerinde kullanır' },
  
  // Tema 3: Çevremizde Yaşam
  { subject: 'Türkçe', unit: 3, main: 'Dinleme ve İzleme', sub: 'Metin türü belirleme', outcome: 'Dinlediği metnin türünü belirler' },
  { subject: 'Türkçe', unit: 3, main: 'Konuşma', sub: 'Kendi cümleleriyle anlatma', outcome: 'Dinlediği bir metni kendi cümleleriyle anlatır' },
  { subject: 'Türkçe', unit: 3, main: 'Okuma', sub: 'Kısa metin anlama', outcome: 'Kısa metinleri anlamlandırır' },
  { subject: 'Türkçe', unit: 3, main: 'Yazma', sub: 'Kelime aralığı', outcome: 'Kelimeler arasında uygun boşluk bırakır' },
  
  // Tema 4: Yol Arkadaşımız Kitaplar
  { subject: 'Türkçe', unit: 4, main: 'Okuma', sub: 'Okuma alışkanlığı', outcome: 'Okuma alışkanlığı kazanır ve kütüphane kültürünü tanır' },
  { subject: 'Türkçe', unit: 4, main: 'Okuma', sub: 'Sözcük anlamı', outcome: 'Okuduğu metindeki gerçek, mecaz ve terim anlamlı sözcükleri fark eder' },
  { subject: 'Türkçe', unit: 4, main: 'Yazma', sub: 'Noktalama işaretleri', outcome: 'Nokta, soru işareti ve virgülü doğru kullanır' },
  
  // Tema 5: Yeteneklerimizi Keşfediyoruz
  { subject: 'Türkçe', unit: 5, main: 'Konuşma', sub: 'Kendini ifade etme', outcome: 'Yeteneklerini ve ilgi alanlarını sözlü olarak ifade eder' },
  { subject: 'Türkçe', unit: 5, main: 'Yazma', sub: 'Cümle oluşturma', outcome: 'Anlamlı ve kurallı cümleler oluşturur' },
  
  // Tema 6: Minik Kâşifler
  { subject: 'Türkçe', unit: 6, main: 'Dinleme ve İzleme', sub: 'Sorgulama', outcome: 'Dinledikleri hakkında sorular sorar ve merak duygusunu geliştirir' },
  { subject: 'Türkçe', unit: 6, main: 'Konuşma', sub: 'Bilimsel düşünce', outcome: 'Gözlemlerini ve çıkarımlarını sözlü olarak paylaşır' },
  
  // Tema 7: Atalarımızın İzleri
  { subject: 'Türkçe', unit: 7, main: 'Okuma', sub: 'Kültürel miras', outcome: 'Kültürel miras ve geleneksel değerlerle ilgili metinleri okur' },
  { subject: 'Türkçe', unit: 7, main: 'Yazma', sub: 'Değerler', outcome: 'Ailesi ve kültürü hakkında kısa yazılar yazar' },
  
  // Tema 8: Sorumluluklarımızın Farkındayız
  { subject: 'Türkçe', unit: 8, main: 'Konuşma', sub: 'Sorumluluk bilinci', outcome: 'Bireysel ve toplumsal sorumluluklarını ifade eder' },
  { subject: 'Türkçe', unit: 8, main: 'Yazma', sub: 'Görev listesi', outcome: 'Günlük görevlerini yazılı olarak listeler' },

  // ==================== MATEMATİK ====================
  // Tema 1: Sayılar ve Nicelikler (1)
  { subject: 'Matematik', unit: 1, main: 'Sayılar', sub: '20\'ye kadar sayma', outcome: '20\'ye kadar nesneleri sayar ve rakamları tanır' },
  { subject: 'Matematik', unit: 1, main: 'Sayılar', sub: 'Onluk ve birlik', outcome: 'Onluk ve birlik kavramını anlar' },
  { subject: 'Matematik', unit: 1, main: 'Sayılar', sub: 'Kardinal değer', outcome: 'Sayıların miktar bildirme (kardinal) özelliğini kavrar' },
  { subject: 'Matematik', unit: 1, main: 'Sayılar', sub: 'Ordinal değer', outcome: 'Sayıların sıra bildirme (ordinal) özelliğini kavrar' },
  { subject: 'Matematik', unit: 1, main: 'Ritmik Sayma', sub: 'İleriye sayma', outcome: '100\'e kadar birer, beşer, onar ileriye sayar' },
  { subject: 'Matematik', unit: 1, main: 'Ritmik Sayma', sub: 'İkişer sayma', outcome: '20\'ye kadar ikişer ileriye sayar' },
  { subject: 'Matematik', unit: 1, main: 'Ritmik Sayma', sub: 'Geriye sayma', outcome: '20\'den geriye doğru birer, ikişer sayar' },
  
  // Tema 2: Sayılar ve Nicelikler (2)
  { subject: 'Matematik', unit: 2, main: 'Ölçme', sub: 'Uzunluk ölçme', outcome: 'Standart olmayan birimlerle uzunluk ölçer' },
  { subject: 'Matematik', unit: 2, main: 'Ölçme', sub: 'Kütle karşılaştırma', outcome: 'Nesnelerin kütlelerini karşılaştırır' },
  { subject: 'Matematik', unit: 2, main: 'Ölçme', sub: 'Birim kavramı', outcome: 'Ölçmede birim kullanmanın önemini anlar' },
  
  // Tema 3: Sayılar ve Nicelikler (3) - Paralarımız
  { subject: 'Matematik', unit: 3, main: 'Finansal Okuryazarlık', sub: 'Para tanıma', outcome: '1 TL\'den 200 TL\'ye kadar paraları tanır' },
  { subject: 'Matematik', unit: 3, main: 'Finansal Okuryazarlık', sub: 'Değişim aracı', outcome: 'Paranın bir değişim aracı olduğunu kavrar' },
  { subject: 'Matematik', unit: 3, main: 'Finansal Okuryazarlık', sub: 'Tasarruf', outcome: 'Tasarruf yapmanın önemini anlar' },
  { subject: 'Matematik', unit: 3, main: 'Finansal Okuryazarlık', sub: 'İsraf bilinci', outcome: 'İhtiyaç dışı tüketimin israfa yol açtığını kavrar' },
  
  // Tema 4: İşlemlerden Cebirsel Düşünmeye
  { subject: 'Matematik', unit: 4, main: 'Toplama ve Çıkarma', sub: 'Toplama işlemi', outcome: '20\'ye kadar toplama işlemi yapar' },
  { subject: 'Matematik', unit: 4, main: 'Toplama ve Çıkarma', sub: 'Çıkarma işlemi', outcome: '20\'ye kadar çıkarma işlemi yapar' },
  { subject: 'Matematik', unit: 4, main: 'Cebirsel Düşünme', sub: 'Eşittir kavramı', outcome: '"Eşittir" (=) işaretinin denge sembolü olduğunu anlar' },
  { subject: 'Matematik', unit: 4, main: 'Cebirsel Düşünme', sub: 'Tersine çevrilebilirlik', outcome: 'Toplama ve çıkarmanın birbirinin tersi olduğunu sezer' },
  
  // Tema 5: Nesnelerin Geometrisi (1)
  { subject: 'Matematik', unit: 5, main: 'Uzamsal İlişkiler', sub: 'Yön kavramı', outcome: 'Sağ-sol, ön-arka, yukarı-aşağı yönlerini ayırt eder' },
  { subject: 'Matematik', unit: 5, main: 'Uzamsal İlişkiler', sub: 'Mesafe', outcome: 'Yakın-uzak kavramlarını kullanır' },
  { subject: 'Matematik', unit: 5, main: 'Uzamsal İlişkiler', sub: 'Konum', outcome: 'Nesnelerin birbirine göre konumlarını belirtir' },
  
  // Tema 6: Nesnelerin Geometrisi (2)
  { subject: 'Matematik', unit: 6, main: 'Geometrik Şekiller', sub: 'Şekil tanıma', outcome: 'Kare, dikdörtgen, üçgen ve daireyi tanır' },
  { subject: 'Matematik', unit: 6, main: 'Geometrik Şekiller', sub: 'Şekil oluşturma', outcome: 'Temel geometrik şekilleri çizer ve oluşturur' },
  { subject: 'Matematik', unit: 6, main: 'Geometrik Şekiller', sub: 'Sınıflandırma', outcome: 'Nesneleri şekillerine göre sınıflandırır' },
  
  // Tema 7: Veriye Dayalı Araştırma
  { subject: 'Matematik', unit: 7, main: 'Veri Toplama', sub: 'Araştırma sorusu', outcome: 'Kategorik veriye dayalı basit araştırma soruları oluşturur' },
  { subject: 'Matematik', unit: 7, main: 'Veri Toplama', sub: 'Veri toplama', outcome: 'Sınıf ortamında veri toplar' },
  { subject: 'Matematik', unit: 7, main: 'Veri Görselleştirme', sub: 'Nesne grafiği', outcome: 'Toplanan veriyi nesne grafiği ile gösterir' },
  { subject: 'Matematik', unit: 7, main: 'Veri Görselleştirme', sub: 'Çetele ve tablo', outcome: 'Çetele ve sıklık tablosu oluşturur' },

  // ==================== HAYAT BİLGİSİ ====================
  // Ünite 1: Ben ve Okulum
  { subject: 'Hayat Bilgisi', unit: 1, main: 'Okul Tanıma', sub: 'Okul ortamı', outcome: 'Okul ortamını, çalışanlarını ve kurallarını tanır' },
  { subject: 'Hayat Bilgisi', unit: 1, main: 'Kendini Tanıma', sub: 'Fiziksel özellikler', outcome: 'Fiziksel özelliklerini tanır ve ifade eder' },
  { subject: 'Hayat Bilgisi', unit: 1, main: 'Kendini Tanıma', sub: 'Duygularını ifade etme', outcome: 'Duygularını tanır ve uygun şekilde ifade eder' },
  { subject: 'Hayat Bilgisi', unit: 1, main: 'Okul Kuralları', sub: 'Sınıf kuralları', outcome: 'Sınıf kurallarına uyar ve sorumluluklarını yerine getirir' },
  
  // Ünite 2: Sağlığım ve Güvenliğim
  { subject: 'Hayat Bilgisi', unit: 2, main: 'Kişisel Temizlik', sub: 'Hijyen alışkanlıkları', outcome: 'El yıkama, diş fırçalama gibi temel hijyen alışkanlıklarını uygular' },
  { subject: 'Hayat Bilgisi', unit: 2, main: 'Beslenme', sub: 'Dengeli beslenme', outcome: 'Dengeli ve sağlıklı beslenmenin önemini kavrar' },
  { subject: 'Hayat Bilgisi', unit: 2, main: 'Trafik Güvenliği', sub: 'Emniyet kemeri', outcome: 'Araçta emniyet kemerinin önemini bilir' },
  { subject: 'Hayat Bilgisi', unit: 2, main: 'Trafik Güvenliği', sub: 'Karşıdan karşıya geçiş', outcome: 'Karşıdan karşıya güvenli geçiş kurallarını uygular' },
  { subject: 'Hayat Bilgisi', unit: 2, main: 'Acil Durumlar', sub: '112 kullanımı', outcome: 'Acil durumlarda 1-1-2\'yi araması gerektiğini bilir' },
  
  // Ünite 3: Ailem ve Toplum
  { subject: 'Hayat Bilgisi', unit: 3, main: 'Aile', sub: 'Aile üyeleri', outcome: 'Aile üyelerini ve aile içi rolleri tanır' },
  { subject: 'Hayat Bilgisi', unit: 3, main: 'Sorumluluklar', sub: 'Ev görevleri', outcome: 'Aile içindeki görev ve sorumluluklarını yerine getirir' },
  { subject: 'Hayat Bilgisi', unit: 3, main: 'Nezaket', sub: 'Nezaket kuralları', outcome: 'Lütfen, teşekkür ederim, özür dilerim gibi nezaket ifadelerini kullanır' },
  { subject: 'Hayat Bilgisi', unit: 3, main: 'Sofra Adabı', sub: 'Yemek kuralları', outcome: 'Sofra adabı kurallarını uygular' },
  
  // Ünite 4: Yaşadığım Yer ve Ülkem
  { subject: 'Hayat Bilgisi', unit: 4, main: 'Çevre Tanıma', sub: 'Yaşanılan yer', outcome: 'Yaşadığı yerin özelliklerini tanır' },
  { subject: 'Hayat Bilgisi', unit: 4, main: 'Milli Semboller', sub: 'Türk Bayrağı', outcome: 'Türk Bayrağı\'nın önemini ve ona saygı göstermeyi bilir' },
  { subject: 'Hayat Bilgisi', unit: 4, main: 'Milli Semboller', sub: 'İstiklal Marşı', outcome: 'İstiklal Marşı\'nın önemini kavrar ve saygıyla dinler' },
  { subject: 'Hayat Bilgisi', unit: 4, main: 'Atatürk', sub: 'Atatürk\'ün hayatı', outcome: 'Atatürk\'ün hayatının ana hatlarını bilir' },
  { subject: 'Hayat Bilgisi', unit: 4, main: 'Bayramlar', sub: 'Milli ve dini bayramlar', outcome: 'Milli ve dini bayramları coşkuyla kutlar' },
  
  // Ünite 5: Doğa ve Çevre
  { subject: 'Hayat Bilgisi', unit: 5, main: 'Canlılar', sub: 'Bitki ve hayvanlar', outcome: 'Yakın çevresindeki bitki ve hayvanları tanır' },
  { subject: 'Hayat Bilgisi', unit: 5, main: 'Gökyüzü', sub: 'Güneş, Dünya, Ay', outcome: 'Güneş, Dünya ve Ay modellerini kavrar' },
  { subject: 'Hayat Bilgisi', unit: 5, main: 'Çevre Koruma', sub: 'Geri dönüşüm', outcome: 'Geri dönüşümün önemini anlar ve uygular' },
  { subject: 'Hayat Bilgisi', unit: 5, main: 'Afetler', sub: 'Afet türleri', outcome: 'Temel afet türlerini (deprem, sel vb.) tanır' },
  { subject: 'Hayat Bilgisi', unit: 5, main: 'Afetler', sub: 'Afet davranışları', outcome: 'Afet anında nasıl davranılacağını bilir' },
  
  // Ünite 6: Bilim, Teknoloji ve Sanat
  { subject: 'Hayat Bilgisi', unit: 6, main: 'Merak ve Keşif', sub: 'Sorgulama', outcome: 'Merak duygusunu geliştirerek sorular sorar' },
  { subject: 'Hayat Bilgisi', unit: 6, main: 'Teknoloji', sub: 'Güvenli kullanım', outcome: 'Teknolojik araçları güvenli şekilde kullanır' },
  { subject: 'Hayat Bilgisi', unit: 6, main: 'STEAM', sub: 'Basit deneyler', outcome: 'Balon roket, havalı parmaklar gibi basit STEAM etkinlikleri yapar' },
  { subject: 'Hayat Bilgisi', unit: 6, main: 'Sanat', sub: 'Sanat dalları', outcome: 'Farklı sanat dallarını tanır ve ilgi duyar' },

  // ==================== BEDEN EĞİTİMİ VE OYUN ====================
  // Tema 1: Hareket Ediyorum
  { subject: 'Beden Eğitimi ve Spor', unit: 1, main: 'Yer Değiştirme', sub: 'Koşma', outcome: 'Farklı hızlarda ve yönlerde koşar' },
  { subject: 'Beden Eğitimi ve Spor', unit: 1, main: 'Yer Değiştirme', sub: 'Sıçrama', outcome: 'Tek ve çift ayakla sıçrar' },
  { subject: 'Beden Eğitimi ve Spor', unit: 1, main: 'Dengeleme', sub: 'Denge hareketleri', outcome: 'Statik ve dinamik denge hareketleri yapar' },
  { subject: 'Beden Eğitimi ve Spor', unit: 1, main: 'Nesne Kontrolü', sub: 'Fırlatma ve yakalama', outcome: 'Nesneleri fırlatır ve yakalar' },
  { subject: 'Beden Eğitimi ve Spor', unit: 1, main: 'Temel Hareketler', sub: 'Yuvarlanma', outcome: 'Güvenli şekilde yuvarlanma hareketleri yapar' },
  
  // Tema 2: Oyunu Kuralına Göre Oynuyorum
  { subject: 'Beden Eğitimi ve Spor', unit: 2, main: 'Oyun Kuralları', sub: 'Kural anlama', outcome: 'Oyunun kurallarını anlar ve uygular' },
  { subject: 'Beden Eğitimi ve Spor', unit: 2, main: 'Fair-Play', sub: 'Dürüst oyun', outcome: 'Dürüst oyun (fair-play) anlayışını benimser' },
  { subject: 'Beden Eğitimi ve Spor', unit: 2, main: 'Takım Çalışması', sub: 'İş birliği', outcome: 'Takım içinde iş birliği yapar' },
  { subject: 'Beden Eğitimi ve Spor', unit: 2, main: 'Strateji', sub: 'Basit stratejiler', outcome: 'Oyunlarda basit stratejiler geliştirir' },
  
  // Tema 3: Ritimle Hareket Ediyorum
  { subject: 'Beden Eğitimi ve Spor', unit: 3, main: 'Ritim', sub: 'Müzikle hareket', outcome: 'Hareketleri müzik veya ritimle uyumlandırır' },
  { subject: 'Beden Eğitimi ve Spor', unit: 3, main: 'Koordinasyon', sub: 'El-ayak koordinasyonu', outcome: 'El ve ayak koordinasyonunu geliştirir' },
  { subject: 'Beden Eğitimi ve Spor', unit: 3, main: 'Estetik', sub: 'Estetik algı', outcome: 'Hareket estetiğini kavrar' },
  
  // Tema 4: Fiziksel Aktiviteye Katılıyorum, Sağlıklı Büyüyorum
  { subject: 'Beden Eğitimi ve Spor', unit: 4, main: 'Sağlık', sub: 'Fiziksel aktivite faydaları', outcome: 'Fiziksel aktivitenin sağlığa faydalarını fark eder' },
  { subject: 'Beden Eğitimi ve Spor', unit: 4, main: 'Alışkanlık', sub: 'Düzenli egzersiz', outcome: 'Düzenli egzersiz alışkanlığı kazanır' },
  { subject: 'Beden Eğitimi ve Spor', unit: 4, main: 'Takip', sub: 'Gelişim takibi', outcome: 'Kendi fiziksel gelişimini takip eder' },
  { subject: 'Beden Eğitimi ve Spor', unit: 4, main: 'Öz Güven', sub: 'Karar verme', outcome: 'Öz güven ve karar verme becerilerini geliştirir' },

  // ==================== GÖRSEL SANATLAR ====================
  // Ünite 1: Sanata Bakış
  { subject: 'Görsel Sanatlar', unit: 1, main: 'Sanat Algısı', sub: 'Sanat nedir', outcome: 'Sanatın ne olduğunu keşfeder' },
  { subject: 'Görsel Sanatlar', unit: 1, main: 'Estetik', sub: 'Çevredeki estetik', outcome: 'Çevresindeki estetiği fark eder' },
  
  // Ünite 2: Çizgiden Boyuta
  { subject: 'Görsel Sanatlar', unit: 2, main: 'Tasarım Öğeleri', sub: 'Nokta ve çizgi', outcome: 'Nokta ve çizgiyi tasarımda kullanır' },
  { subject: 'Görsel Sanatlar', unit: 2, main: 'Tasarım Öğeleri', sub: 'Renk kullanımı', outcome: 'Ana ve ara renkleri tanır ve kullanır' },
  { subject: 'Görsel Sanatlar', unit: 2, main: 'Üretim', sub: 'Sanat eseri oluşturma', outcome: 'Temel tasarım öğelerini kullanarak üretim yapar' },
  
  // Ünite 3: Zamanın İzinde Sanat
  { subject: 'Görsel Sanatlar', unit: 3, main: 'Kültürel Miras', sub: 'Tarihi eserler', outcome: 'Kültürel miras eserlerini tanır' },
  { subject: 'Görsel Sanatlar', unit: 3, main: 'İlham', sub: 'Eserlerden ilham alma', outcome: 'Tarihi eserlerden ilham alarak çalışmalar yapar' },
  
  // Ünite 4: Sanat ve Teknoloji Evreni
  { subject: 'Görsel Sanatlar', unit: 4, main: 'Dijital Sanat', sub: 'Teknoloji ve sanat ilişkisi', outcome: 'Dijital araçların sanatla ilişkisini keşfeder' },
  { subject: 'Görsel Sanatlar', unit: 4, main: 'Projeler', sub: '23 Nisan Panosu', outcome: '23 Nisan Panosu gibi projeler yapar' },
  { subject: 'Görsel Sanatlar', unit: 4, main: 'Sergi', sub: 'Mini müze', outcome: 'Sınıf içi mini müze oluşturur' },

  // ==================== MÜZİK ====================
  // Ünite 1: Müzik Dili
  { subject: 'Müzik', unit: 1, main: 'Milli Marş', sub: 'İstiklal Marşı', outcome: 'İstiklal Marşı\'nın anlamını kavrar ve doğru söyler' },
  { subject: 'Müzik', unit: 1, main: 'Müzik Yazısı', sub: 'Sol anahtarı', outcome: 'Sol anahtarını tanır' },
  { subject: 'Müzik', unit: 1, main: 'Müzik Yazısı', sub: 'Nota değerleri', outcome: 'Temel nota değerlerini öğrenir' },
  { subject: 'Müzik', unit: 1, main: 'Ölçü', sub: 'İki vuruşlu ölçü', outcome: 'İki vuruşlu ölçüleri kavrar' },
  
  // Ünite 2: Performans ve Kültür
  { subject: 'Müzik', unit: 2, main: 'Ses Kullanımı', sub: 'Doğru ses kullanımı', outcome: 'Kendi sesini doğru kullanır' },
  { subject: 'Müzik', unit: 2, main: 'Ritim', sub: 'Ritim çalgıları', outcome: 'Ritim çalgılarını doğru kullanır' },
  { subject: 'Müzik', unit: 2, main: 'Müzik Kültürü', sub: 'Türk müziği', outcome: 'Türk müziği eserlerini tanır' },
  { subject: 'Müzik', unit: 2, main: 'Müzik Kültürü', sub: 'Batı müziği', outcome: 'Batı müziği eserlerini tanır' },
  { subject: 'Müzik', unit: 2, main: 'Dinleme', sub: 'Bilinçli dinleyici', outcome: 'Bilinçli bir müzik dinleyicisi olur' }
];

async function importGrade1Topics() {
  console.log('🎓 1. Sınıf Kazanımları Aktarımı Başlıyor...\n');
  
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
  
  // Önce 1. sınıf için mevcut konuları kontrol et
  const { data: existingTopics } = await supabase
    .from('topics')
    .select('main_topic, sub_topic, subject_id')
    .eq('grade', 1);
  
  // Mevcut konuları bir Set olarak tut
  const existingSet = new Set(
    (existingTopics || []).map(t => `${t.subject_id}|${t.main_topic}|${t.sub_topic}`)
  );
  
  console.log(`📋 Mevcut 1. sınıf konu sayısı: ${existingSet.size}`);
  
  let added = 0;
  let skipped = 0;
  let errors = [];
  
  for (const topic of grade1Topics) {
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
        grade: 1,
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
    
    process.stdout.write(`\r⏳ İşleniyor: ${added + skipped + errors.length}/${grade1Topics.length}`);
  }
  
  console.log('\n\n' + '='.repeat(50));
  console.log('📊 1. SINIF KAZANIMLARI SONUÇ:');
  console.log(`   ✅ Yeni eklenen: ${added}`);
  console.log(`   ⏭️ Zaten mevcut: ${skipped}`);
  console.log(`   📝 Toplam işlenen: ${grade1Topics.length}`);
  
  if (errors.length > 0) {
    console.log(`   ⚠️ Hatalar (${errors.length}):`);
    errors.slice(0, 10).forEach(e => console.log(`      - ${e}`));
    if (errors.length > 10) console.log(`      ... ve ${errors.length - 10} hata daha`);
  }
  
  // Özet bilgi
  const subjectSummary = {};
  grade1Topics.forEach(t => {
    subjectSummary[t.subject] = (subjectSummary[t.subject] || 0) + 1;
  });
  
  console.log('\n📖 Ders Bazında Dağılım:');
  Object.entries(subjectSummary).forEach(([subject, count]) => {
    console.log(`   ${subject}: ${count} kazanım`);
  });
  
  console.log('='.repeat(50));
}

importGrade1Topics()
  .then(() => {
    console.log('\n✅ 1. Sınıf müfredatı aktarımı tamamlandı!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Kritik hata:', err);
    process.exit(1);
  });

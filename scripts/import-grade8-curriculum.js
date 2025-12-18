// 8. Sınıf LGS Müfredat Kazanımları Import Script (2025-2026)
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 8. Sınıf LGS Müfredatı - Detaylı Kazanımlar
const grade8Topics = [
  // ==================== TÜRKÇE (LGS: 20 Soru, Katsayı: 4) ====================
  // Sözcükte Anlam
  { subject: 'Türkçe', unit: 1, main: 'Sözcükte Anlam', sub: 'Çok anlamlılık', outcome: 'Gerçek, mecaz, yan ve terim anlamlarını ayırt eder' },
  { subject: 'Türkçe', unit: 1, main: 'Sözcükte Anlam', sub: 'Sözcük ilişkileri', outcome: 'Eş anlamlı, zıt anlamlı ve eş sesli sözcükleri analiz eder' },
  { subject: 'Türkçe', unit: 1, main: 'Sözcükte Anlam', sub: 'Deyimler', outcome: 'Deyimlerin metne kattığı anlamı yorumlar' },
  { subject: 'Türkçe', unit: 1, main: 'Sözcükte Anlam', sub: 'Atasözleri', outcome: 'Atasözlerinin kültürel anlamını kavrar' },
  
  // Cümlede Anlam
  { subject: 'Türkçe', unit: 2, main: 'Cümlede Anlam', sub: 'Neden-sonuç', outcome: 'Cümleler arası neden-sonuç ilişkisini tespit eder' },
  { subject: 'Türkçe', unit: 2, main: 'Cümlede Anlam', sub: 'Öznel-nesnel', outcome: 'Öznel ve nesnel yargıları ayırt eder' },
  { subject: 'Türkçe', unit: 2, main: 'Cümlede Anlam', sub: 'Duygu ifadeleri', outcome: 'Pişmanlık, sitem, varsayım gibi kavramları tespit eder' },
  { subject: 'Türkçe', unit: 2, main: 'Cümlede Anlam', sub: 'Örtük anlam', outcome: 'Cümleden çıkarılabilecek ve çıkarılamayacak yargıları belirler' },
  
  // Paragrafta Anlam
  { subject: 'Türkçe', unit: 3, main: 'Paragraf', sub: 'Ana-yardımcı düşünce', outcome: 'Ana düşünce ve yardımcı düşünceleri tespit eder' },
  { subject: 'Türkçe', unit: 3, main: 'Paragraf', sub: 'Yapı analizi', outcome: 'Giriş, gelişme, sonuç bölümlerini analiz eder' },
  { subject: 'Türkçe', unit: 3, main: 'Paragraf', sub: 'Akışı bozan cümle', outcome: 'Düşünce akışını bozan cümleyi bulur' },
  { subject: 'Türkçe', unit: 3, main: 'Paragraf', sub: 'Anlatım biçimleri', outcome: 'Açıklama, tartışma, öyküleme, betimleme tekniklerini kavrar' },
  { subject: 'Türkçe', unit: 3, main: 'Görsel Okuma', sub: 'Grafik yorumlama', outcome: 'Grafik, tablo ve infografik yorumlama becerisini gösterir' },
  { subject: 'Türkçe', unit: 3, main: 'Sözel Mantık', sub: 'Değişken ilişkileri', outcome: 'Sözel mantık sorularında sıralama ve sınıflama yapar' },
  
  // Dil Bilgisi - Fiilimsiler
  { subject: 'Türkçe', unit: 4, main: 'Fiilimsiler', sub: 'İsim-fiil', outcome: 'İsim-fiil eklerini (-ma, -ış, -mak) tanır ve kullanır' },
  { subject: 'Türkçe', unit: 4, main: 'Fiilimsiler', sub: 'Sıfat-fiil', outcome: 'Sıfat-fiil eklerini (-an, -ası, -mış, -acak, -ar, -maz, -dık) tanır' },
  { subject: 'Türkçe', unit: 4, main: 'Fiilimsiler', sub: 'Zarf-fiil', outcome: 'Zarf-fiil eklerini (-arak, -ıp, -ken, -ınca, -dıkça) tanır' },
  { subject: 'Türkçe', unit: 4, main: 'Fiilimsiler', sub: 'Yan cümlecik', outcome: 'Fiilimsilerin yan cümlecik kurma işlevini analiz eder' },
  
  // Cümlenin Ögeleri
  { subject: 'Türkçe', unit: 5, main: 'Cümle Ögeleri', sub: 'Yüklem-özne', outcome: 'Yüklem ve özneyi (temel ögeler) belirler' },
  { subject: 'Türkçe', unit: 5, main: 'Cümle Ögeleri', sub: 'Nesne', outcome: 'Belirtili ve belirtisiz nesneyi ayırt eder' },
  { subject: 'Türkçe', unit: 5, main: 'Cümle Ögeleri', sub: 'Yer tamlayıcısı', outcome: 'Yer tamlayıcısını (dolaylı tümleç) bulur' },
  { subject: 'Türkçe', unit: 5, main: 'Cümle Ögeleri', sub: 'Zarf tamlayıcısı', outcome: 'Zarf tamlayıcısını belirler' },
  { subject: 'Türkçe', unit: 5, main: 'Cümle Ögeleri', sub: 'Vurgulanan öge', outcome: 'Cümledeki vurgulanan ögeyi belirler' },
  
  // Fiilde Çatı
  { subject: 'Türkçe', unit: 6, main: 'Fiilde Çatı', sub: 'Etken-edilgen', outcome: 'Etken ve edilgen çatılı fiilleri ayırt eder' },
  { subject: 'Türkçe', unit: 6, main: 'Fiilde Çatı', sub: 'Geçişli-geçişsiz', outcome: 'Geçişli ve geçişsiz fiilleri ayırt eder' },
  
  // Cümle Türleri
  { subject: 'Türkçe', unit: 7, main: 'Cümle Türleri', sub: 'Yüklemine göre', outcome: 'İsim ve fiil cümlelerini ayırt eder' },
  { subject: 'Türkçe', unit: 7, main: 'Cümle Türleri', sub: 'Dizilişe göre', outcome: 'Kurallı ve devrik cümleleri ayırt eder' },
  { subject: 'Türkçe', unit: 7, main: 'Cümle Türleri', sub: 'Yapısına göre', outcome: 'Basit, birleşik, sıralı ve bağlı cümleleri ayırt eder' },
  
  // Yazım ve Noktalama
  { subject: 'Türkçe', unit: 8, main: 'Yazım Kuralları', sub: 'Büyük harf', outcome: 'Büyük harflerin kullanım kurallarını uygular' },
  { subject: 'Türkçe', unit: 8, main: 'Yazım Kuralları', sub: 'de/da, ki, mi', outcome: 'de/da, ki ve mi yazımını doğru uygular' },
  { subject: 'Türkçe', unit: 8, main: 'Noktalama', sub: 'Virgül', outcome: 'Virgülün kullanım alanlarını bilir' },
  { subject: 'Türkçe', unit: 8, main: 'Noktalama', sub: 'Diğer işaretler', outcome: 'Noktalı virgül, iki nokta, tırnak işaretini doğru kullanır' },
  
  // Anlatım Bozuklukları
  { subject: 'Türkçe', unit: 9, main: 'Anlatım Bozuklukları', sub: 'Anlamsal', outcome: 'Anlamsal anlatım bozukluklarını tespit eder' },
  { subject: 'Türkçe', unit: 9, main: 'Anlatım Bozuklukları', sub: 'Yapısal', outcome: 'Yapısal anlatım bozukluklarını tespit eder' },
  
  // Metin Türleri ve Söz Sanatları
  { subject: 'Türkçe', unit: 10, main: 'Metin Türleri', sub: 'Gazete türleri', outcome: 'Fıkra, makale, deneme türlerini ayırt eder' },
  { subject: 'Türkçe', unit: 10, main: 'Söz Sanatları', sub: 'Temel sanatlar', outcome: 'Abartma, benzetme, kişileştirme, konuşturma sanatlarını tespit eder' },

  // ==================== MATEMATİK (LGS: 20 Soru, Katsayı: 4) ====================
  // Çarpanlar ve Katlar
  { subject: 'Matematik', unit: 1, main: 'Çarpanlar-Katlar', sub: 'Asal sayılar', outcome: 'Asal sayıları tanır ve sayıları asal çarpanlarına ayırır' },
  { subject: 'Matematik', unit: 1, main: 'Çarpanlar-Katlar', sub: 'EBOB', outcome: 'İki sayının En Büyük Ortak Bölenini hesaplar' },
  { subject: 'Matematik', unit: 1, main: 'Çarpanlar-Katlar', sub: 'EKOK', outcome: 'İki sayının En Küçük Ortak Katını hesaplar' },
  { subject: 'Matematik', unit: 1, main: 'Çarpanlar-Katlar', sub: 'Problem çözme', outcome: 'EBOB-EKOK problemlerini çözer' },
  { subject: 'Matematik', unit: 1, main: 'Çarpanlar-Katlar', sub: 'Aralarında asallık', outcome: 'Aralarında asal sayıları belirler' },
  
  // Üslü İfadeler
  { subject: 'Matematik', unit: 2, main: 'Üslü İfadeler', sub: 'Tam sayı kuvvetleri', outcome: 'Tam sayıların tam sayı kuvvetlerini hesaplar' },
  { subject: 'Matematik', unit: 2, main: 'Üslü İfadeler', sub: 'Üs kuralları', outcome: 'Üslü ifadelerle ilgili temel kuralları uygular' },
  { subject: 'Matematik', unit: 2, main: 'Üslü İfadeler', sub: 'Bilimsel gösterim', outcome: 'Çok büyük ve küçük sayıları bilimsel gösterimle ifade eder' },
  
  // Kareköklü İfadeler
  { subject: 'Matematik', unit: 3, main: 'Karekök', sub: 'Tam kare sayılar', outcome: 'Tam kare sayıları tanır ve karekökleri bulur' },
  { subject: 'Matematik', unit: 3, main: 'Karekök', sub: 'Tahmin etme', outcome: 'Tam kare olmayan sayıların karekökünü tahmin eder' },
  { subject: 'Matematik', unit: 3, main: 'Karekök', sub: 'İşlemler', outcome: 'Kareköklü ifadelerle dört işlem yapar' },
  { subject: 'Matematik', unit: 3, main: 'Karekök', sub: 'Kök içine/dışına', outcome: 'Katsayıyı kök içine alma ve dışına çıkarma yapar' },
  { subject: 'Matematik', unit: 3, main: 'Gerçek Sayılar', sub: 'Rasyonel-irrasyonel', outcome: 'Rasyonel ve irrasyonel sayıları ayırt eder' },
  
  // Veri Analizi
  { subject: 'Matematik', unit: 4, main: 'Veri Analizi', sub: 'Grafik türleri', outcome: 'Sütun, daire ve çizgi grafiği oluşturur' },
  { subject: 'Matematik', unit: 4, main: 'Veri Analizi', sub: 'Grafik dönüşümü', outcome: 'Grafikler arasında dönüşüm yapar' },
  { subject: 'Matematik', unit: 4, main: 'Veri Analizi', sub: 'Yorum ve tahmin', outcome: 'Verilere dayalı yorumlar ve tahminler yapar' },
  
  // Olasılık
  { subject: 'Matematik', unit: 5, main: 'Olasılık', sub: 'Olası durumlar', outcome: 'Bir olaya ait olası durumları belirler' },
  { subject: 'Matematik', unit: 5, main: 'Olasılık', sub: 'Olasılık hesaplama', outcome: 'Basit bir olayın olma olasılığını hesaplar' },
  { subject: 'Matematik', unit: 5, main: 'Olasılık', sub: 'Kesin-imkansız', outcome: 'Kesin olay ve imkansız olay kavramlarını açıklar' },
  
  // Cebirsel İfadeler ve Özdeşlikler
  { subject: 'Matematik', unit: 6, main: 'Cebir', sub: 'Cebirsel çarpma', outcome: 'Cebirsel ifadelerle çarpma işlemi yapar' },
  { subject: 'Matematik', unit: 6, main: 'Özdeşlikler', sub: 'Tam kare özdeşlikleri', outcome: '(a+b)² ve (a-b)² özdeşliklerini uygular' },
  { subject: 'Matematik', unit: 6, main: 'Özdeşlikler', sub: 'İki kare farkı', outcome: 'a²-b² özdeşliğini uygular' },
  { subject: 'Matematik', unit: 6, main: 'Çarpanlara Ayırma', sub: 'Ortak çarpan', outcome: 'Ortak çarpan parantezine alarak çarpanlara ayırır' },
  { subject: 'Matematik', unit: 6, main: 'Çarpanlara Ayırma', sub: 'Özdeşliklerle', outcome: 'Özdeşliklerden yararlanarak çarpanlara ayırır' },
  
  // Doğrusal Denklemler
  { subject: 'Matematik', unit: 7, main: 'Denklemler', sub: 'Koordinat sistemi', outcome: 'Koordinat sistemini tanır ve sıralı ikilileri gösterir' },
  { subject: 'Matematik', unit: 7, main: 'Doğrusal İlişki', sub: 'Denklem yazma', outcome: 'Doğrusal ilişkinin tablosunu ve denklemini (y=mx+n) yazar' },
  { subject: 'Matematik', unit: 7, main: 'Doğrusal İlişki', sub: 'Grafik çizme', outcome: 'Doğrusal denklemlerin grafiklerini çizer' },
  { subject: 'Matematik', unit: 7, main: 'Eğim', sub: 'Eğim hesaplama', outcome: 'Doğrunun eğimini hesaplar ve yorumlar' },
  
  // Eşitsizlikler
  { subject: 'Matematik', unit: 8, main: 'Eşitsizlikler', sub: 'Sayı doğrusunda', outcome: 'Eşitsizlikleri sayı doğrusunda gösterir' },
  { subject: 'Matematik', unit: 8, main: 'Eşitsizlikler', sub: 'Çözme', outcome: 'Birinci dereceden eşitsizlikleri çözer' },
  
  // Üçgenler
  { subject: 'Matematik', unit: 9, main: 'Üçgenler', sub: 'Yardımcı elemanlar', outcome: 'Kenarortay, açıortay ve yüksekliği inşa eder' },
  { subject: 'Matematik', unit: 9, main: 'Üçgenler', sub: 'Üçgen eşitsizliği', outcome: 'Üçgen eşitsizliği ilişkisini kavrar' },
  { subject: 'Matematik', unit: 9, main: 'Üçgenler', sub: 'Pisagor bağıntısı', outcome: 'Dik üçgende Pisagor bağıntısını uygular' },
  
  // Eşlik ve Benzerlik
  { subject: 'Matematik', unit: 10, main: 'Eşlik-Benzerlik', sub: 'Eşlik koşulları', outcome: 'Üçgenlerde eşlik koşullarını belirler' },
  { subject: 'Matematik', unit: 10, main: 'Eşlik-Benzerlik', sub: 'Benzerlik oranı', outcome: 'Benzerlik oranını belirler ve uygular' },
  
  // Dönüşüm Geometrisi
  { subject: 'Matematik', unit: 11, main: 'Dönüşümler', sub: 'Öteleme', outcome: 'Şekillerin öteleme sonucundaki görüntülerini çizer' },
  { subject: 'Matematik', unit: 11, main: 'Dönüşümler', sub: 'Yansıma', outcome: 'Şekillerin yansıma sonucundaki görüntülerini çizer' },
  
  // Geometrik Cisimler
  { subject: 'Matematik', unit: 12, main: 'Cisimler', sub: 'Dik prizma', outcome: 'Dik prizmaların özelliklerini tanır ve açınımını çizer' },
  { subject: 'Matematik', unit: 12, main: 'Cisimler', sub: 'Silindir', outcome: 'Silindirin yüzey alanını ve hacmini hesaplar' },
  { subject: 'Matematik', unit: 12, main: 'Cisimler', sub: 'Koni-piramit', outcome: 'Koni ve piramitlerin temel elemanlarını tanır' },

  // ==================== FEN BİLİMLERİ (LGS: 20 Soru, Katsayı: 4) ====================
  // Ünite 1: Mevsimler ve İklim
  { subject: 'Fen Bilimleri', unit: 1, main: 'Mevsimler', sub: 'Dünya ekseni', outcome: 'Dünyanın eksen eğikliğinin mevsimler üzerindeki etkisini analiz eder' },
  { subject: 'Fen Bilimleri', unit: 1, main: 'Mevsimler', sub: 'Ekinoks-gündönümü', outcome: 'Ekinoks ve gündönümü tarihlerini yorumlar' },
  { subject: 'Fen Bilimleri', unit: 1, main: 'İklim', sub: 'Hava-iklim farkı', outcome: 'İklim ve hava olayları arasındaki farkı kavrar' },
  { subject: 'Fen Bilimleri', unit: 1, main: 'İklim', sub: 'Küresel ısınma', outcome: 'Küresel iklim değişikliğinin nedenlerini ve sonuçlarını tartışır' },
  
  // Ünite 2: DNA ve Genetik Kod
  { subject: 'Fen Bilimleri', unit: 2, main: 'DNA', sub: 'DNA yapısı', outcome: 'DNA\'nın yapısını (nükleotid, gen, kromozom) model üzerinde gösterir' },
  { subject: 'Fen Bilimleri', unit: 2, main: 'Kalıtım', sub: 'Mendel çaprazlama', outcome: 'Mendel\'in çalışmalarından hareketle çaprazlama yapar' },
  { subject: 'Fen Bilimleri', unit: 2, main: 'Kalıtım', sub: 'Cinsiyet belirlenmesi', outcome: 'Cinsiyetin belirlenmesini kavrar' },
  { subject: 'Fen Bilimleri', unit: 2, main: 'Genetik', sub: 'Mutasyon-modifikasyon', outcome: 'Mutasyon ve modifikasyon farkını örneklerle açıklar' },
  { subject: 'Fen Bilimleri', unit: 2, main: 'Evrim', sub: 'Adaptasyon', outcome: 'Adaptasyon ve doğal seçilim kavramlarını ilişkilendirir' },
  { subject: 'Fen Bilimleri', unit: 2, main: 'Biyoteknoloji', sub: 'Genetik mühendisliği', outcome: 'Genetik mühendisliği uygulamalarını değerlendirir' },
  
  // Ünite 3: Basınç
  { subject: 'Fen Bilimleri', unit: 3, main: 'Basınç', sub: 'Katı basıncı', outcome: 'Basıncın kuvvet ve yüzey alanıyla ilişkisini keşfeder' },
  { subject: 'Fen Bilimleri', unit: 3, main: 'Basınç', sub: 'Sıvı basıncı', outcome: 'Sıvı basıncının derinlik ve yoğunlukla ilişkisini analiz eder' },
  { subject: 'Fen Bilimleri', unit: 3, main: 'Basınç', sub: 'Pascal prensibi', outcome: 'Pascal Prensibi ve hidrolik sistemleri açıklar' },
  { subject: 'Fen Bilimleri', unit: 3, main: 'Basınç', sub: 'Gaz basıncı', outcome: 'Açık hava basıncını ve Torricelli deneyini kavrar' },
  
  // Ünite 4: Madde ve Endüstri
  { subject: 'Fen Bilimleri', unit: 4, main: 'Periyodik Tablo', sub: 'Element grupları', outcome: 'Elementleri metal, ametal, yarı metal olarak sınıflandırır' },
  { subject: 'Fen Bilimleri', unit: 4, main: 'Kimyasal Değişim', sub: 'Fiziksel-kimyasal', outcome: 'Fiziksel ve kimyasal değişimleri tanecik yapısıyla ilişkilendirir' },
  { subject: 'Fen Bilimleri', unit: 4, main: 'Tepkimeler', sub: 'Kütlenin korunumu', outcome: 'Kimyasal tepkimelerde kütlenin korunumunu kavrar' },
  { subject: 'Fen Bilimleri', unit: 4, main: 'Asit-Baz', sub: 'pH ve ayraçlar', outcome: 'pH kavramını ve asit-baz ayraçlarını öğrenir' },
  { subject: 'Fen Bilimleri', unit: 4, main: 'Isı', sub: 'Özısı ve hal değişimi', outcome: 'Özısı kavramını ve hal değişim ısısını yorumlar' },
  { subject: 'Fen Bilimleri', unit: 4, main: 'Endüstri', sub: 'Türkiye kimya', outcome: 'Türkiye\'de kimya endüstrisini analiz eder' },
  
  // Ünite 5: Basit Makineler
  { subject: 'Fen Bilimleri', unit: 5, main: 'Basit Makineler', sub: 'Makaralar', outcome: 'Sabit, hareketli makara ve palanga sistemlerini kavrar' },
  { subject: 'Fen Bilimleri', unit: 5, main: 'Basit Makineler', sub: 'Kaldıraçlar', outcome: 'Kaldıraç türlerini ve çalışma prensiplerini açıklar' },
  { subject: 'Fen Bilimleri', unit: 5, main: 'Basit Makineler', sub: 'Eğik düzlem', outcome: 'Eğik düzlem, çıkrık ve vida prensiplerini kavrar' },
  { subject: 'Fen Bilimleri', unit: 5, main: 'Basit Makineler', sub: 'Kuvvet-yol ilişkisi', outcome: 'Kuvvetten kazanç varsa yoldan kayıp olduğunu analiz eder' },
  
  // Ünite 6: Enerji Dönüşümleri ve Çevre
  { subject: 'Fen Bilimleri', unit: 6, main: 'Besin Zinciri', sub: 'Enerji akışı', outcome: 'Üretici-tüketici-ayrıştırıcı ilişkisini ve enerji piramidini kavrar' },
  { subject: 'Fen Bilimleri', unit: 6, main: 'Enerji', sub: 'Fotosentez-solunum', outcome: 'Fotosentez ve solunum süreçlerini kavramsal karşılaştırır' },
  { subject: 'Fen Bilimleri', unit: 6, main: 'Döngüler', sub: 'Madde döngüleri', outcome: 'Su, karbon, oksijen, azot döngülerini açıklar' },
  { subject: 'Fen Bilimleri', unit: 6, main: 'Sürdürülebilirlik', sub: 'Ekolojik ayak izi', outcome: 'Sürdürülebilir kalkınma ve geri dönüşüm farkındalığı geliştirir' },
  
  // Ünite 7: Elektrik
  { subject: 'Fen Bilimleri', unit: 7, main: 'Elektriklenme', sub: 'Elektrik yükleri', outcome: 'Sürtünme, dokunma ve etki ile elektriklenmeyi deneyimler' },
  { subject: 'Fen Bilimleri', unit: 7, main: 'Elektriklenme', sub: 'Elektroskop', outcome: 'Elektroskobu tanır ve topraklama olayını açıklar' },
  { subject: 'Fen Bilimleri', unit: 7, main: 'Enerji', sub: 'Enerji dönüşümü', outcome: 'Elektrik enerjisinin ısı, ışık, harekete dönüşümünü inceler' },
  { subject: 'Fen Bilimleri', unit: 7, main: 'Enerji', sub: 'Güç santralleri', outcome: 'Hidroelektrik, termik, nükleer, rüzgar santrallerini tanır' },

  // ==================== T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK (LGS: 10 Soru) ====================
  { subject: 'T.C. İnkılap Tarihi ve Atatürkçülük', unit: 1, main: 'Atatürk\'ün Hayatı', sub: 'Çocukluk-eğitim', outcome: 'Atatürk\'ün çocukluk ve eğitim hayatını açıklar' },
  { subject: 'T.C. İnkılap Tarihi ve Atatürkçülük', unit: 1, main: 'Atatürk\'ün Hayatı', sub: 'Fikri etkilenme', outcome: 'Atatürk\'ün fikir hayatını etkileyen kişileri tanır' },
  { subject: 'T.C. İnkılap Tarihi ve Atatürkçülük', unit: 2, main: 'I. Dünya Savaşı', sub: 'Nedenler-cepheler', outcome: 'I. Dünya Savaşı\'nın nedenlerini ve Osmanlı cephelerini açıklar' },
  { subject: 'T.C. İnkılap Tarihi ve Atatürkçülük', unit: 2, main: 'Mondros', sub: 'Ateşkes-işgaller', outcome: 'Mondros Ateşkes Antlaşması ve işgalleri değerlendirir' },
  { subject: 'T.C. İnkılap Tarihi ve Atatürkçülük', unit: 2, main: 'Cemiyetler', sub: 'Yararlı-zararlı', outcome: 'Yararlı ve zararlı cemiyetleri ayırt eder' },
  { subject: 'T.C. İnkılap Tarihi ve Atatürkçülük', unit: 2, main: 'Kongreler', sub: 'Amasya-Erzurum-Sivas', outcome: 'Milli Mücadele hazırlık dönemini (genelgeler, kongreler) açıklar' },
  { subject: 'T.C. İnkılap Tarihi ve Atatürkçülük', unit: 2, main: 'TBMM', sub: 'Misak-ı Milli-açılış', outcome: 'Misak-ı Milli ve TBMM\'nin açılışını değerlendirir' },
  { subject: 'T.C. İnkılap Tarihi ve Atatürkçülük', unit: 3, main: 'Kurtuluş Savaşı', sub: 'Cepheler', outcome: 'Doğu, Güney ve Batı cephelerindeki savaşları açıklar' },
  { subject: 'T.C. İnkılap Tarihi ve Atatürkçülük', unit: 3, main: 'Kurtuluş Savaşı', sub: 'Sakarya-Büyük Taarruz', outcome: 'Sakarya Meydan Muharebesi ve Büyük Taarruz\'u analiz eder' },
  { subject: 'T.C. İnkılap Tarihi ve Atatürkçülük', unit: 3, main: 'Barış', sub: 'Mudanya-Lozan', outcome: 'Mudanya Ateşkesi ve Lozan Barış Antlaşması\'nı değerlendirir' },
  { subject: 'T.C. İnkılap Tarihi ve Atatürkçülük', unit: 4, main: 'Atatürk İlkeleri', sub: 'Altı ilke', outcome: 'Atatürk ilkelerini (Cumhuriyetçilik, Milliyetçilik vb.) açıklar' },
  { subject: 'T.C. İnkılap Tarihi ve Atatürkçülük', unit: 4, main: 'İnkılaplar', sub: 'Siyasi-hukuki', outcome: 'Siyasi ve hukuki alanda yapılan inkılapları kavrar' },
  { subject: 'T.C. İnkılap Tarihi ve Atatürkçülük', unit: 4, main: 'İnkılaplar', sub: 'Eğitim-toplumsal', outcome: 'Eğitim ve toplumsal alanda yapılan inkılapları kavrar' },
  { subject: 'T.C. İnkılap Tarihi ve Atatürkçülük', unit: 5, main: 'Demokrasi', sub: 'Çok partili hayat', outcome: 'Çok partili hayata geçiş denemelerini değerlendirir' },
  { subject: 'T.C. İnkılap Tarihi ve Atatürkçülük', unit: 6, main: 'Dış Politika', sub: 'Lozan sorunları', outcome: 'Lozan\'dan kalan sorunların çözümünü analiz eder' },
  { subject: 'T.C. İnkılap Tarihi ve Atatürkçülük', unit: 6, main: 'Dış Politika', sub: 'Antlaşmalar', outcome: 'Montrö, Balkan Antantı, Sadabat Paktı\'nı açıklar' },
  { subject: 'T.C. İnkılap Tarihi ve Atatürkçülük', unit: 7, main: 'Atatürk Sonrası', sub: 'II. Dünya Savaşı', outcome: 'II. Dünya Savaşı\'nda Türkiye\'nin denge politikasını değerlendirir' },

  // ==================== İNGİLİZCE (LGS: 10 Soru) ====================
  { subject: 'İngilizce', unit: 1, main: 'Friendship', sub: 'Teklif kalıpları', outcome: 'Would you like to...? kalıplarıyla teklif yapar' },
  { subject: 'İngilizce', unit: 2, main: 'Teen Life', sub: 'Tercihler', outcome: 'prefer/would rather ile tercih ifade eder' },
  { subject: 'İngilizce', unit: 3, main: 'In the Kitchen', sub: 'Sıralama', outcome: 'Yemek tariflerini first, then, finally ile anlatır' },
  { subject: 'İngilizce', unit: 4, main: 'On the Phone', sub: 'Telefon kalıpları', outcome: 'Telefon görüşmesi kalıplarını kullanır' },
  { subject: 'İngilizce', unit: 5, main: 'The Internet', sub: 'İnternet güvenliği', outcome: 'Güvenli internet kullanımı hakkında konuşur' },
  { subject: 'İngilizce', unit: 6, main: 'Adventures', sub: 'Present Perfect', outcome: 'Present Perfect Tense ile tecrübelerini anlatır' },
  { subject: 'İngilizce', unit: 7, main: 'Tourism', sub: 'Geçmiş zaman', outcome: 'Tatil deneyimlerini geçmiş zamanla anlatır' },
  { subject: 'İngilizce', unit: 8, main: 'Chores', sub: 'Zorunluluk', outcome: 'must/have to/should ile zorunluluk bildirir' },
  { subject: 'İngilizce', unit: 9, main: 'Science', sub: 'Present Continuous', outcome: 'Bilimsel gelişmeler hakkında Present Continuous kullanır' },
  { subject: 'İngilizce', unit: 10, main: 'Natural Forces', sub: 'Gelecek zaman', outcome: 'Doğal afetler hakkında will ile tahmin yapar' },

  // ==================== DİN KÜLTÜRÜ VE AHLAK BİLGİSİ (LGS: 10 Soru) ====================
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 1, main: 'Kader', sub: 'Evrendeki yasalar', outcome: 'Sünnetullah kavramını (fiziksel, biyolojik, toplumsal yasalar) açıklar' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 1, main: 'Kader', sub: 'İnsan iradesi', outcome: 'Külli ve cüzi irade kavramlarını açıklar' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 1, main: 'Kader', sub: 'Tevekkül', outcome: 'Kader, kaza, ecel, rızık, tevekkül kavramlarını kavrar' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 2, main: 'Zekât', sub: 'Paylaşma', outcome: 'Zekât ve sadakanın sosyal boyutunu değerlendirir' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 3, main: 'Din ve Hayat', sub: 'Zarurat-ı Hamse', outcome: 'Dinin temel gayelerini (can, mal, akıl, nesil, din korunması) açıklar' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 4, main: 'Hz. Muhammed', sub: 'Örneklik', outcome: 'Peygamberimizin sıfatları, merhameti ve adaletini kavrar' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 5, main: 'Kur\'an', sub: 'Temel özellikler', outcome: 'Kur\'an\'ın temel özelliklerini ve İslam\'ın kaynaklarını açıklar' },

  // ==================== TEKNOLOJİ VE TASARIM ====================
  { subject: 'Teknoloji ve Tasarım', unit: 1, main: 'Teknoloji Temelleri', sub: 'İcat-buluş-keşif', outcome: 'İcat, buluş ve keşif kavramlarını ayırt eder' },
  { subject: 'Teknoloji ve Tasarım', unit: 1, main: 'Endüstri 4.0', sub: 'Patent ve marka', outcome: 'Fikri mülkiyet hakları ve patent kavramlarını öğrenir' },
  { subject: 'Teknoloji ve Tasarım', unit: 2, main: 'Tasarım Süreci', sub: 'CAD temelleri', outcome: 'Bilgisayar destekli tasarım temellerini öğrenir' },
  { subject: 'Teknoloji ve Tasarım', unit: 2, main: 'Tasarım Süreci', sub: 'Akıllı ürünler', outcome: 'Sensör teknolojileri ve akıllı ürünleri inceler' },
  { subject: 'Teknoloji ve Tasarım', unit: 3, main: 'Ürün Geliştirme', sub: 'Ergonomi-estetik', outcome: 'Ergonomi, estetik ve işlevsellik ilişkisini kavrar' },
  { subject: 'Teknoloji ve Tasarım', unit: 4, main: 'Sürdürülebilirlik', sub: 'Atık yönetimi', outcome: 'Enerji tasarrufu ve sürdürülebilir tasarım projeleri geliştirir' },

  // ==================== GÖRSEL SANATLAR ====================
  { subject: 'Görsel Sanatlar', unit: 1, main: 'Sanat Tarihi', sub: 'Modern akımlar', outcome: 'Fovizm, Kübizm, Pop Art gibi modern sanat akımlarını tanır' },
  { subject: 'Görsel Sanatlar', unit: 2, main: 'Müze Kültürü', sub: 'Kültürel miras', outcome: 'Müzecilik bilinci ve kültürel mirasın korunmasını kavrar' },
  { subject: 'Görsel Sanatlar', unit: 3, main: 'Uygulama', sub: 'Teknikler', outcome: 'Baskı, kolaj ve perspektif teknikleriyle kompozisyon oluşturur' },

  // ==================== MÜZİK ====================
  { subject: 'Müzik', unit: 1, main: 'Yaratıcılık', sub: 'Ritim kalıpları', outcome: 'Basit ritim kalıpları ve şarkı formlarını tanır' },
  { subject: 'Müzik', unit: 2, main: 'Kültür', sub: 'İstiklal Marşı', outcome: 'İstiklal Marşı\'nın tarihi ve doğru icrasını kavrar' },
  { subject: 'Müzik', unit: 2, main: 'Kültür', sub: 'Müzik türleri', outcome: 'Türk Halk Müziği ve Türk Sanat Müziği türlerini ayırt eder' },

  // ==================== BEDEN EĞİTİMİ VE SPOR ====================
  { subject: 'Beden Eğitimi ve Spor', unit: 1, main: 'Takım Sporları', sub: 'Teknik ve taktik', outcome: 'Voleybol, basketbol, hentbol teknik ve taktiklerini geliştirir' },
  { subject: 'Beden Eğitimi ve Spor', unit: 2, main: 'Sağlık', sub: 'İlk yardım', outcome: 'Spor sakatlıklarında ilk yardım bilgisini edinir' },
  { subject: 'Beden Eğitimi ve Spor', unit: 3, main: 'Değerler', sub: 'Fair Play', outcome: 'Adil oyun (Fair Play) ilkelerini benimser' }
];

async function importGrade8Topics() {
  console.log('🎯 8. Sınıf LGS Kazanımları Aktarımı Başlıyor...\n');
  
  const { data: subjects, error: subjectsError } = await supabase
    .from('subjects')
    .select('id, name');
  
  if (subjectsError) {
    console.error('❌ Dersler alınamadı:', subjectsError.message);
    return;
  }
  
  const subjectMap = {};
  subjects.forEach(s => { subjectMap[s.name] = s.id; });
  
  // T.C. İnkılap Tarihi dersi kontrolü
  if (!subjectMap['T.C. İnkılap Tarihi ve Atatürkçülük']) {
    console.log('📝 T.C. İnkılap Tarihi ve Atatürkçülük dersi oluşturuluyor...');
    const { data: newSubject, error } = await supabase
      .from('subjects')
      .insert({
        name: 'T.C. İnkılap Tarihi ve Atatürkçülük',
        slug: 'tc-inkilap-tarihi-ve-ataturkculuk',
        code: 'inkilap-tarihi',
        category: 'Sosyal Bilimler',
        is_active: true
      })
      .select()
      .single();
    
    if (!error && newSubject) {
      subjectMap['T.C. İnkılap Tarihi ve Atatürkçülük'] = newSubject.id;
      console.log('✅ T.C. İnkılap Tarihi ve Atatürkçülük oluşturuldu');
    }
  }
  
  console.log('📚 Mevcut dersler alındı');
  
  const { data: existingTopics } = await supabase
    .from('topics')
    .select('main_topic, sub_topic, subject_id')
    .eq('grade', 8);
  
  const existingSet = new Set(
    (existingTopics || []).map(t => `${t.subject_id}|${t.main_topic}|${t.sub_topic}`)
  );
  
  console.log(`📋 Mevcut 8. sınıf konu sayısı: ${existingSet.size}`);
  
  let added = 0;
  let skipped = 0;
  let errors = [];
  
  for (const topic of grade8Topics) {
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
        grade: 8,
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
    
    process.stdout.write(`\r⏳ İşleniyor: ${added + skipped + errors.length}/${grade8Topics.length}`);
  }
  
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 8. SINIF LGS KAZANIMLARI SONUÇ:');
  console.log(`   ✅ Yeni eklenen: ${added}`);
  console.log(`   ⏭️ Zaten mevcut: ${skipped}`);
  console.log(`   📝 Toplam işlenen: ${grade8Topics.length}`);
  
  if (errors.length > 0) {
    console.log(`   ⚠️ Hatalar (${errors.length}):`);
    [...new Set(errors)].slice(0, 5).forEach(e => console.log(`      - ${e}`));
  }
  
  // LGS Ağırlıklı Özet
  console.log('\n🎯 LGS SORU DAĞILIMI:');
  const lgsDersler = {
    'Türkçe': { soru: 20, katsayi: 4 },
    'Matematik': { soru: 20, katsayi: 4 },
    'Fen Bilimleri': { soru: 20, katsayi: 4 },
    'T.C. İnkılap Tarihi ve Atatürkçülük': { soru: 10, katsayi: 1 },
    'İngilizce': { soru: 10, katsayi: 1 },
    'Din Kültürü ve Ahlak Bilgisi': { soru: 10, katsayi: 1 }
  };
  
  Object.entries(lgsDersler).forEach(([ders, info]) => {
    const kazanimSayisi = grade8Topics.filter(t => t.subject === ders).length;
    console.log(`   ${ders}: ${info.soru} soru (K:${info.katsayi}) - ${kazanimSayisi} kazanım`);
  });
  
  const subjectSummary = {};
  grade8Topics.forEach(t => {
    subjectSummary[t.subject] = (subjectSummary[t.subject] || 0) + 1;
  });
  
  console.log('\n📖 Tüm Derslerin Dağılımı:');
  Object.entries(subjectSummary).forEach(([subject, count]) => {
    console.log(`   ${subject}: ${count} kazanım`);
  });
  
  console.log('='.repeat(60));
}

importGrade8Topics()
  .then(() => {
    console.log('\n✅ 8. Sınıf LGS müfredatı aktarımı tamamlandı!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Kritik hata:', err);
    process.exit(1);
  });



// 7. Sınıf MEB 2025-2026 Müfredat Kazanımları Import Script (Teknoloji Tasarım HARİÇ)
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 7. Sınıf Müfredatı - 2018 Programı + Maarif Modeli Vizyonu
const grade7Topics = [
  // ==================== TÜRKÇE ====================
  // Dil Bilgisi - Fiiller
  { subject: 'Türkçe', unit: 1, main: 'Fiiller', sub: 'Fiil türleri', outcome: 'İş, oluş ve durum fiillerinin anlamsal farklarını ayırt eder' },
  { subject: 'Türkçe', unit: 1, main: 'Fiiller', sub: 'Kip ve kişi', outcome: 'Fiillerin kip ve kişi eklerini ayırt eder' },
  { subject: 'Türkçe', unit: 1, main: 'Fiiller', sub: 'Haber kipleri', outcome: 'Haber (bildirme) kiplerini tanır ve kullanır' },
  { subject: 'Türkçe', unit: 1, main: 'Fiiller', sub: 'Dilek kipleri', outcome: 'Dilek (tasarlama) kiplerini tanır ve kullanır' },
  { subject: 'Türkçe', unit: 1, main: 'Fiiller', sub: 'Zaman kayması', outcome: 'Fiillerde zaman (anlam) kaymasını fark eder' },
  { subject: 'Türkçe', unit: 2, main: 'Ek Fiil', sub: 'Ek eylem', outcome: 'Ek fiilin isim soylu sözcükleri yüklem yaptığını kavrar' },
  { subject: 'Türkçe', unit: 2, main: 'Ek Fiil', sub: 'Birleşik zaman', outcome: 'Ek fiilin fiillere getirilerek birleşik zamanlı fiil oluşturulmasını açıklar' },
  { subject: 'Türkçe', unit: 3, main: 'Zarflar', sub: 'Zarf türleri', outcome: 'Durum, zaman, miktar, yer-yön ve soru zarflarını tanır' },
  { subject: 'Türkçe', unit: 4, main: 'Fiilde Yapı', sub: 'Basit-türemiş-birleşik', outcome: 'Basit, türemiş ve birleşik fiilleri ayırt eder' },
  { subject: 'Türkçe', unit: 4, main: 'Fiilde Yapı', sub: 'Kurallı birleşik fiiller', outcome: 'Yeterlilik, tezlik, sürerlik ve yaklaşma fiillerini kullanır' },
  
  // Okuma ve Anlama
  { subject: 'Türkçe', unit: 5, main: 'Söz Sanatları', sub: 'Kişileştirme', outcome: 'Kişileştirme (teşhis) sanatını tanır' },
  { subject: 'Türkçe', unit: 5, main: 'Söz Sanatları', sub: 'Konuşturma', outcome: 'Konuşturma (intak) sanatını tanır' },
  { subject: 'Türkçe', unit: 5, main: 'Söz Sanatları', sub: 'Karşıtlık', outcome: 'Karşıtlık (tezat) sanatını tanır' },
  { subject: 'Türkçe', unit: 5, main: 'Söz Sanatları', sub: 'Abartma', outcome: 'Abartma (mübalağa) sanatını tanır' },
  { subject: 'Türkçe', unit: 6, main: 'Metin Türleri', sub: 'Söyleşi', outcome: 'Söyleşi metninin yapısal özelliklerini tanır' },
  { subject: 'Türkçe', unit: 6, main: 'Metin Türleri', sub: 'Biyografi', outcome: 'Biyografi ve otobiyografi türlerini ayırt eder' },
  { subject: 'Türkçe', unit: 6, main: 'Metin Türleri', sub: 'Günlük', outcome: 'Günlük türünün özelliklerini tanır' },
  { subject: 'Türkçe', unit: 7, main: 'Paragraf', sub: 'Ana düşünce', outcome: 'Paragrafta ana düşünceyi bulur' },
  { subject: 'Türkçe', unit: 7, main: 'Paragraf', sub: 'Yardımcı düşünceler', outcome: 'Paragrafta yardımcı düşünceleri belirler' },
  { subject: 'Türkçe', unit: 8, main: 'Anlatım Bozuklukları', sub: 'Anlamsal bozukluk', outcome: 'Anlamsal anlatım bozukluklarını tespit eder' },

  // ==================== MATEMATİK ====================
  // 1. Tam Sayılarla İşlemler
  { subject: 'Matematik', unit: 1, main: 'Tam Sayılar', sub: 'Dört işlem', outcome: 'Tam sayılarla toplama, çıkarma, çarpma ve bölme işlemleri yapar' },
  { subject: 'Matematik', unit: 1, main: 'Tam Sayılar', sub: 'Üslü ifadeler', outcome: 'Üslü ifadelerin tam sayı kuvvetlerini hesaplar' },
  { subject: 'Matematik', unit: 1, main: 'Tam Sayılar', sub: 'Parantez önemi', outcome: '(-2)² ile -2² arasındaki farkı kavrar' },
  
  // 2. Rasyonel Sayılar
  { subject: 'Matematik', unit: 2, main: 'Rasyonel Sayılar', sub: 'Tanım ve gösterim', outcome: 'Rasyonel sayıları tanır ve sayı doğrusunda gösterir' },
  { subject: 'Matematik', unit: 2, main: 'Rasyonel Sayılar', sub: 'Ondalık dönüşüm', outcome: 'Ondalık gösterimleri rasyonel sayıya çevirir' },
  { subject: 'Matematik', unit: 2, main: 'Rasyonel Sayılar', sub: 'Devirli ondalık', outcome: 'Devirli ondalık açılımları anlar' },
  { subject: 'Matematik', unit: 2, main: 'Rasyonel Sayılar', sub: 'İşlemler', outcome: 'Rasyonel sayılarla dört işlem yapar' },
  
  // 3. Cebirsel İfadeler
  { subject: 'Matematik', unit: 3, main: 'Cebirsel İfadeler', sub: 'Toplama-çıkarma', outcome: 'Cebirsel ifadelerle toplama ve çıkarma işlemleri yapar' },
  { subject: 'Matematik', unit: 3, main: 'Cebirsel İfadeler', sub: 'Çarpma', outcome: 'Bir doğal sayı ile bir cebirsel ifadeyi çarpar' },
  { subject: 'Matematik', unit: 3, main: 'Örüntüler', sub: 'n. terim', outcome: 'Sayı örüntülerinin kuralını harfle (n. terim) ifade eder' },
  
  // 4. Eşitlik ve Denklem
  { subject: 'Matematik', unit: 4, main: 'Denklemler', sub: 'Birinci derece', outcome: 'Birinci dereceden bir bilinmeyenli denklemleri kurar ve çözer' },
  { subject: 'Matematik', unit: 4, main: 'Denklemler', sub: 'Problem çözme', outcome: 'Gerçek hayat problemlerini denklem kurarak çözer' },
  
  // 5. Oran ve Orantı
  { subject: 'Matematik', unit: 5, main: 'Oran-Orantı', sub: 'Oran kavramı', outcome: 'Oranda çokluklardan biri 1 olduğunda diğerini belirler' },
  { subject: 'Matematik', unit: 5, main: 'Oran-Orantı', sub: 'Doğru orantı', outcome: 'Doğru orantı problemlerini çözer' },
  { subject: 'Matematik', unit: 5, main: 'Oran-Orantı', sub: 'Ters orantı', outcome: 'Ters orantı problemlerini çözer' },
  
  // 6. Yüzdeler
  { subject: 'Matematik', unit: 6, main: 'Yüzdeler', sub: 'Yüzde hesaplama', outcome: 'Bir çokluğun belirtilen yüzdesini bulur' },
  { subject: 'Matematik', unit: 6, main: 'Yüzdeler', sub: 'Artış-azalış', outcome: 'Artış ve azalış yüzdelerini hesaplar' },
  { subject: 'Matematik', unit: 6, main: 'Yüzdeler', sub: 'Kar-zarar', outcome: 'Kar, zarar ve faiz problemlerini çözer' },
  
  // 7. Doğrular ve Açılar
  { subject: 'Matematik', unit: 7, main: 'Açılar', sub: 'Açıortay', outcome: 'Bir açının açıortayını çizer' },
  { subject: 'Matematik', unit: 7, main: 'Açılar', sub: 'Paralel-kesen', outcome: 'İki paralel doğruyla bir kesenin oluşturduğu açıları belirler' },
  { subject: 'Matematik', unit: 7, main: 'Açılar', sub: 'Z-U-M kuralları', outcome: 'Yöndeş, iç ters, dış ters açı ilişkilerini kullanır' },
  
  // 8. Çokgenler ve Daire
  { subject: 'Matematik', unit: 8, main: 'Çokgenler', sub: 'Düzgün çokgenler', outcome: 'Düzgün çokgenlerin iç ve dış açı özelliklerini keşfeder' },
  { subject: 'Matematik', unit: 8, main: 'Daire', sub: 'Daire alanı', outcome: 'Dairenin ve daire diliminin alanını hesaplar' },
  
  // 9. Veri Analizi
  { subject: 'Matematik', unit: 9, main: 'Veri Analizi', sub: 'Grafikler', outcome: 'Çizgi, sütun ve daire grafiği oluşturur ve yorumlar' },
  { subject: 'Matematik', unit: 9, main: 'Veri Analizi', sub: 'Merkezi eğilim', outcome: 'Aritmetik ortalama, ortanca ve tepe değeri yorumlar' },

  // ==================== FEN BİLİMLERİ (7 Ünite) ====================
  // 1. Güneş Sistemi ve Ötesi
  { subject: 'Fen Bilimleri', unit: 1, main: 'Uzay', sub: 'Uzay araştırmaları', outcome: 'Teleskoplar, uydular ve uzay mekiklerini açıklar' },
  { subject: 'Fen Bilimleri', unit: 1, main: 'Uzay', sub: 'Uzay kirliliği', outcome: 'Uzay kirliliğinin nedenlerini ve sonuçlarını tartışır' },
  { subject: 'Fen Bilimleri', unit: 1, main: 'Gök Cisimleri', sub: 'Yıldız oluşumu', outcome: 'Yıldız oluşum süreçlerini (bulutsu, süpernova, kara delik) açıklar' },
  { subject: 'Fen Bilimleri', unit: 1, main: 'Gök Cisimleri', sub: 'Galaksiler', outcome: 'Galaksileri ve evren kavramını açıklar' },
  
  // 2. Hücre ve Bölünmeler
  { subject: 'Fen Bilimleri', unit: 2, main: 'Hücre', sub: 'Bitki-hayvan hücresi', outcome: 'Bitki ve hayvan hücresi arasındaki farkları açıklar' },
  { subject: 'Fen Bilimleri', unit: 2, main: 'Hücre', sub: 'Organeller', outcome: 'Organellerin görevlerini açıklar' },
  { subject: 'Fen Bilimleri', unit: 2, main: 'Bölünme', sub: 'Mitoz', outcome: 'Mitoz bölünmenin canlılar için önemini açıklar' },
  { subject: 'Fen Bilimleri', unit: 2, main: 'Bölünme', sub: 'Mayoz', outcome: 'Mayoz bölünme ve genetik çeşitliliği açıklar' },
  
  // 3. Kuvvet ve Enerji
  { subject: 'Fen Bilimleri', unit: 3, main: 'Kütle-Ağırlık', sub: 'Fark', outcome: 'Kütle ve ağırlık arasındaki farkı açıklar' },
  { subject: 'Fen Bilimleri', unit: 3, main: 'İş ve Enerji', sub: 'Fiziksel iş', outcome: 'Fiziksel anlamda iş yapılabilmesi koşullarını kavrar' },
  { subject: 'Fen Bilimleri', unit: 3, main: 'Enerji', sub: 'Kinetik-potansiyel', outcome: 'Kinetik ve potansiyel enerjinin birbirine dönüşümünü açıklar' },
  { subject: 'Fen Bilimleri', unit: 3, main: 'Enerji', sub: 'Sürtünme etkisi', outcome: 'Sürtünme kuvvetinin kinetik enerji üzerindeki etkisini inceler' },
  
  // 4. Saf Madde ve Karışımlar
  { subject: 'Fen Bilimleri', unit: 4, main: 'Atom', sub: 'Atom modelleri', outcome: 'Atom modellerinin tarihsel gelişimini açıklar' },
  { subject: 'Fen Bilimleri', unit: 4, main: 'Saf Maddeler', sub: 'Elementler', outcome: 'Elementleri ve sembollerini tanır' },
  { subject: 'Fen Bilimleri', unit: 4, main: 'Saf Maddeler', sub: 'Bileşikler', outcome: 'Bileşikleri ve formüllerini tanır' },
  { subject: 'Fen Bilimleri', unit: 4, main: 'Karışımlar', sub: 'Çözünme hızı', outcome: 'Çözünme hızına etki eden faktörleri inceler' },
  { subject: 'Fen Bilimleri', unit: 4, main: 'Karışımlar', sub: 'Ayrıştırma', outcome: 'Damıtma, buharlaştırma gibi ayrıştırma yöntemlerini uygular' },
  
  // 5. Işığın Madde ile Etkileşimi
  { subject: 'Fen Bilimleri', unit: 5, main: 'Işık', sub: 'Soğurulma', outcome: 'Işığın soğurulması ve cisimlerin renkli görünmesini açıklar' },
  { subject: 'Fen Bilimleri', unit: 5, main: 'Aynalar', sub: 'Düz-çukur-tümsek', outcome: 'Düz, çukur ve tümsek aynalarda görüntü oluşumunu açıklar' },
  { subject: 'Fen Bilimleri', unit: 5, main: 'Mercekler', sub: 'Işık kırılması', outcome: 'Işığın kırılmasını ve mercek türlerini açıklar' },
  
  // 6. Canlılarda Üreme
  { subject: 'Fen Bilimleri', unit: 6, main: 'İnsan', sub: 'Üreme sistemi', outcome: 'İnsanda üreme sistemini ve gelişim sürecini açıklar' },
  { subject: 'Fen Bilimleri', unit: 6, main: 'Canlılar', sub: 'Üreme çeşitleri', outcome: 'Eşeyli ve eşeysiz üreme çeşitlerini karşılaştırır' },
  
  // 7. Elektrik Devreleri
  { subject: 'Fen Bilimleri', unit: 7, main: 'Devreler', sub: 'Seri-paralel', outcome: 'Seri ve paralel bağlamayı açıklar ve devre kurar' },
  { subject: 'Fen Bilimleri', unit: 7, main: 'Elektrik', sub: 'Akım-gerilim', outcome: 'Akım ve gerilim ilişkisini (Ohm yasası girişi) kavrar' },

  // ==================== SOSYAL BİLGİLER (7 Ünite) ====================
  { subject: 'Sosyal Bilgiler', unit: 1, main: 'İletişim', sub: 'Etkili iletişim', outcome: 'Etkili dinleme, empati ve ben dili kullanır' },
  { subject: 'Sosyal Bilgiler', unit: 1, main: 'Medya', sub: 'Medya okuryazarlığı', outcome: 'Kitle iletişim araçlarını eleştirel değerlendirir' },
  { subject: 'Sosyal Bilgiler', unit: 2, main: 'Osmanlı', sub: 'Yükseliş dönemi', outcome: 'Osmanlı\'nın beylikten cihan devletine geçişini açıklar' },
  { subject: 'Sosyal Bilgiler', unit: 2, main: 'Osmanlı', sub: 'Kurumlar', outcome: 'Divan-ı Hümayun, Tımar ve Devşirme sistemlerini açıklar' },
  { subject: 'Sosyal Bilgiler', unit: 2, main: 'Avrupa', sub: 'Dönem gelişmeleri', outcome: 'Coğrafi Keşifler, Rönesans, Reform ve Aydınlanma\'yı açıklar' },
  { subject: 'Sosyal Bilgiler', unit: 3, main: 'Nüfus', sub: 'Türkiye nüfusu', outcome: 'Türkiye\'nin nüfus özelliklerini ve piramitlerini yorumlar' },
  { subject: 'Sosyal Bilgiler', unit: 3, main: 'Göç', sub: 'Neden ve sonuçlar', outcome: 'Göçün nedenlerini ve sonuçlarını analiz eder' },
  { subject: 'Sosyal Bilgiler', unit: 4, main: 'Bilim Tarihi', sub: 'Türk-İslam bilginleri', outcome: 'Harezmi, İbn-i Sina, Ali Kuşçu gibi bilginleri tanır' },
  { subject: 'Sosyal Bilgiler', unit: 5, main: 'Ekonomi Tarihi', sub: 'Ahilik-Lonca', outcome: 'Tarih boyunca Türklerde ekonomik teşkilatları açıklar' },
  { subject: 'Sosyal Bilgiler', unit: 6, main: 'Demokrasi', sub: 'Tarihsel gelişim', outcome: 'Demokrasinin tarihsel gelişimini açıklar' },
  { subject: 'Sosyal Bilgiler', unit: 6, main: 'Vatandaşlık', sub: 'Sivil toplum', outcome: 'STK\'ların toplumsal hayattaki rolünü değerlendirir' },
  { subject: 'Sosyal Bilgiler', unit: 7, main: 'Uluslararası', sub: 'Kuruluşlar', outcome: 'BM, NATO, TDT gibi uluslararası kuruluşları tanır' },
  { subject: 'Sosyal Bilgiler', unit: 7, main: 'Küresel Sorunlar', sub: 'İklim ve çevre', outcome: 'Küresel sorunlara çözüm önerileri geliştirir' },

  // ==================== İNGİLİZCE (10 Ünite) ====================
  { subject: 'İngilizce', unit: 1, main: 'Appearance', sub: 'Tasvir', outcome: 'Fiziksel görünüş ve kişilik özelliklerini tasvir eder' },
  { subject: 'İngilizce', unit: 1, main: 'Appearance', sub: 'Comparatives', outcome: 'Karşılaştırma sıfatlarını kullanır' },
  { subject: 'İngilizce', unit: 2, main: 'Sports', sub: 'Spor dalları', outcome: 'Spor türlerini ve sıklık zarflarını kullanır' },
  { subject: 'İngilizce', unit: 3, main: 'Biographies', sub: 'Simple Past', outcome: 'Geçmiş zaman ile biyografi anlatır' },
  { subject: 'İngilizce', unit: 4, main: 'Wild Animals', sub: 'Habitatlar', outcome: 'Vahşi hayvanlar ve yaşam alanlarını anlatır' },
  { subject: 'İngilizce', unit: 5, main: 'Television', sub: 'Tercihler', outcome: 'TV programları hakkında tercih ifade eder' },
  { subject: 'İngilizce', unit: 6, main: 'Celebrations', sub: 'Davet etme', outcome: 'Parti organizasyonu ve davet kalıplarını kullanır' },
  { subject: 'İngilizce', unit: 7, main: 'Dreams', sub: 'Future Tense', outcome: 'Gelecek zaman (will) ile hayallerini anlatır' },
  { subject: 'İngilizce', unit: 8, main: 'Public Buildings', sub: 'Amaç bildirme', outcome: 'Kamu binalarını ve amaç bildirmeyi (to+infinitive) kullanır' },
  { subject: 'İngilizce', unit: 9, main: 'Environment', sub: 'Zorunluluklar', outcome: 'Çevre sorunları hakkında must/have to kullanır' },
  { subject: 'İngilizce', unit: 10, main: 'Planets', sub: 'Superlatives', outcome: 'Gezegenler hakkında superlative kullanır' },

  // ==================== DİN KÜLTÜRÜ VE AHLAK BİLGİSİ ====================
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 1, main: 'İnanç', sub: 'Melek inancı', outcome: 'Meleklerin özelliklerini açıklar' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 1, main: 'İnanç', sub: 'Ahiret inancı', outcome: 'Ahiret hayatının aşamalarını açıklar' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 2, main: 'İbadet', sub: 'Hac', outcome: 'Hac ibadetinin yapılışını ve sembollerini açıklar' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 2, main: 'İbadet', sub: 'Kurban', outcome: 'Kurban ibadetinin sosyal boyutunu değerlendirir' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 3, main: 'Ahlak', sub: 'Ahlaki davranışlar', outcome: 'Adalet, dostluk, dürüstlük değerlerini içselleştirir' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 4, main: 'Hz. Muhammed', sub: 'İnsani yön', outcome: 'Hz. Muhammed\'in beşeri özelliklerini açıklar' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 5, main: 'İslam Düşüncesi', sub: 'İtikadi yorumlar', outcome: 'Maturidilik ve Eşarilik yorumlarını tanır' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 5, main: 'İslam Düşüncesi', sub: 'Fıkhi yorumlar', outcome: 'Hanefilik, Şafiilik gibi mezhepleri tanır' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 5, main: 'İslam Düşüncesi', sub: 'Tasavvufi yorumlar', outcome: 'Mevlevilik, Alevilik-Bektaşilik gibi yorumları tanır' },

  // ==================== GÖRSEL SANATLAR ====================
  { subject: 'Görsel Sanatlar', unit: 1, main: 'Perspektif', sub: 'Tek kaçış noktalı', outcome: 'Perspektif kurallarıyla mekân çizimleri yapar' },
  { subject: 'Görsel Sanatlar', unit: 2, main: 'Kültürel Miras', sub: 'Türk resim sanatı', outcome: 'Türk resim sanatı tarihini ve minyatür sanatını tanır' },
  { subject: 'Görsel Sanatlar', unit: 3, main: 'Teknikler', sub: 'Boyama teknikleri', outcome: 'Sulu boya, guaj ve pastel tekniklerini uygular' },
  { subject: 'Görsel Sanatlar', unit: 3, main: 'Teknikler', sub: 'Baskı teknikleri', outcome: 'Linol ve şablon baskı tekniklerini uygular' },

  // ==================== MÜZİK ====================
  { subject: 'Müzik', unit: 1, main: 'Teori', sub: 'Nota okuma', outcome: 'Temel müzik yazılarını okur' },
  { subject: 'Müzik', unit: 1, main: 'Teori', sub: 'Değiştirici işaretler', outcome: 'Diyez, bemol ve natürel işaretlerini tanır' },
  { subject: 'Müzik', unit: 2, main: 'Kültür', sub: 'Halk müziği', outcome: 'Türk halk müziği türlerini (kırık hava, uzun hava) tanır' },
  { subject: 'Müzik', unit: 2, main: 'Kültür', sub: 'Sanat müziği', outcome: 'Türk sanat müziği makamlarına giriş yapar' },
  { subject: 'Müzik', unit: 3, main: 'Uygulama', sub: 'Çalgı çalma', outcome: 'Blok flüt, melodika veya bağlama çalar' },

  // ==================== BEDEN EĞİTİMİ VE SPOR ====================
  { subject: 'Beden Eğitimi ve Spor', unit: 1, main: 'Takım Sporları', sub: 'Teknik beceriler', outcome: 'Voleybol, basketbol, futbol tekniklerini geliştirir' },
  { subject: 'Beden Eğitimi ve Spor', unit: 2, main: 'Aktif Yaşam', sub: 'Fiziksel uygunluk', outcome: 'Fitness parametrelerini geliştirir' },
  { subject: 'Beden Eğitimi ve Spor', unit: 3, main: 'Değerler', sub: 'Fair-play', outcome: 'Adil oyun ve spor ahlakını içselleştirir' },
  { subject: 'Beden Eğitimi ve Spor', unit: 3, main: 'Kültür', sub: 'Türk sporları', outcome: 'Güreş ve cirit gibi geleneksel sporları tanır' }
];

async function importGrade7Topics() {
  console.log('🎓 7. Sınıf Kazanımları Aktarımı Başlıyor (Teknoloji Tasarım HARİÇ)...\n');
  
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
    .eq('grade', 7);
  
  const existingSet = new Set(
    (existingTopics || []).map(t => `${t.subject_id}|${t.main_topic}|${t.sub_topic}`)
  );
  
  console.log(`📋 Mevcut 7. sınıf konu sayısı: ${existingSet.size}`);
  
  let added = 0;
  let skipped = 0;
  let errors = [];
  
  for (const topic of grade7Topics) {
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
        grade: 7,
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
    
    process.stdout.write(`\r⏳ İşleniyor: ${added + skipped + errors.length}/${grade7Topics.length}`);
  }
  
  console.log('\n\n' + '='.repeat(50));
  console.log('📊 7. SINIF KAZANIMLARI SONUÇ:');
  console.log(`   ✅ Yeni eklenen: ${added}`);
  console.log(`   ⏭️ Zaten mevcut: ${skipped}`);
  console.log(`   📝 Toplam işlenen: ${grade7Topics.length}`);
  
  if (errors.length > 0) {
    console.log(`   ⚠️ Hatalar (${errors.length}):`);
    [...new Set(errors)].slice(0, 5).forEach(e => console.log(`      - ${e}`));
  }
  
  const subjectSummary = {};
  grade7Topics.forEach(t => {
    subjectSummary[t.subject] = (subjectSummary[t.subject] || 0) + 1;
  });
  
  console.log('\n📖 Ders Bazında Dağılım:');
  Object.entries(subjectSummary).forEach(([subject, count]) => {
    console.log(`   ${subject}: ${count} kazanım`);
  });
  
  console.log('='.repeat(50));
}

importGrade7Topics()
  .then(() => {
    console.log('\n✅ 7. Sınıf müfredatı aktarımı tamamlandı!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Kritik hata:', err);
    process.exit(1);
  });


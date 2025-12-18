// 11. Sınıf MEB 2018 Müfredat Kazanımları Import Script (AYT Hazırlık Yılı)
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 11. Sınıf MEB Müfredatı - AYT Hazırlık (5 şıklı sorular!)
const grade11Topics = [
  // ==================== TÜRK DİLİ VE EDEBİYATI (9 Ünite) ====================
  { subject: 'Türk Dili ve Edebiyatı', unit: 1, main: 'Giriş', sub: 'Edebiyat-toplum', outcome: 'Edebiyatın toplumsal değişimlerin aynası olduğunu kavrar' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 1, main: 'Giriş', sub: 'Edebi akımlar', outcome: 'Realizm, Romantizm, Natüralizm, Sembolizm akımlarını analiz eder' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 2, main: 'Hikâye', sub: 'Cumhuriyet hikâyesi', outcome: 'Cumhuriyet dönemi (1923-1960) hikâye türünü inceler' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 2, main: 'Hikâye', sub: 'Olay-durum hikâyesi', outcome: 'Maupassant ve Çehov tarzı hikâyeyi ayırt eder' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 2, main: 'Hikâye', sub: 'Toplumcu gerçekçilik', outcome: 'Toplumcu gerçekçi anlayışın hikâyedeki yansımalarını inceler' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 3, main: 'Şiir', sub: 'Tanzimat şiiri', outcome: 'Tanzimat I. ve II. dönem şiirini inceler' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 3, main: 'Şiir', sub: 'Servetifünun', outcome: 'Servetifünun estetiğini ve temsilcilerini analiz eder' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 3, main: 'Şiir', sub: 'Milli Edebiyat', outcome: 'Milli Edebiyat dönemi şiirinin özelliklerini kavrar' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 3, main: 'Şiir', sub: 'Cumhuriyet şiiri', outcome: 'Beş Hececiler ve Toplumcu Gerçekçileri tanır' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 4, main: 'Makale', sub: 'Makale yazımı', outcome: 'Bilimsel ve edebi makale türünü kavrar ve yazar' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 4, main: 'Makale', sub: 'Kaynak gösterme', outcome: 'Akademik metinlerde kaynak gösterme tekniklerini uygular' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 5, main: 'Sohbet-Fıkra', sub: 'Gazete türleri', outcome: 'Sohbet ve fıkra (köşe yazısı) arasındaki farkları ayırt eder' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 6, main: 'Roman', sub: 'Cumhuriyet romanı', outcome: 'Cumhuriyet dönemi romanını (1923-1980) inceler' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 6, main: 'Roman', sub: 'Modernizm', outcome: 'Bilinç akışı, iç monolog, geriye dönüş tekniklerini analiz eder' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 7, main: 'Tiyatro', sub: 'Cumhuriyet tiyatrosu', outcome: 'Cumhuriyet dönemi Türk tiyatrosunun gelişimini inceler' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 7, main: 'Tiyatro', sub: 'Epik-absürt', outcome: 'Epik ve absürt tiyatro örneklerini analiz eder' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 8, main: 'Eleştiri', sub: 'Eleştiri türü', outcome: 'Sanat eserini nesnel ölçütlerle değerlendirme becerisini kazanır' },
  { subject: 'Türk Dili ve Edebiyatı', unit: 9, main: 'Mülakat-Röportaj', sub: 'Gazetecilik', outcome: 'Mülakat ve röportaj arasındaki farkları kavrar' },

  // ==================== MATEMATİK (AYT Temel - 7 Ana Konu) ====================
  // Trigonometri
  { subject: 'Matematik', unit: 1, main: 'Trigonometri', sub: 'Yönlü açılar', outcome: 'Derece ve radyan dönüşümlerini yapar' },
  { subject: 'Matematik', unit: 1, main: 'Trigonometri', sub: 'Birim çember', outcome: 'Trigonometrik fonksiyonları birim çember üzerinde tanımlar' },
  { subject: 'Matematik', unit: 1, main: 'Trigonometri', sub: 'Sinüs-kosinüs teoremi', outcome: 'Kosinüs ve sinüs teoremini üçgen çözümlerinde uygular' },
  { subject: 'Matematik', unit: 1, main: 'Trigonometri', sub: 'Grafikler', outcome: 'Trigonometrik fonksiyonların periyotlarını ve grafiklerini çizer' },
  { subject: 'Matematik', unit: 1, main: 'Trigonometri', sub: 'Ters fonksiyonlar', outcome: 'arcsin, arccos, arctan fonksiyonlarını kullanır' },
  
  // Analitik Geometri
  { subject: 'Matematik', unit: 2, main: 'Analitik Geometri', sub: 'Nokta analitiği', outcome: 'İki nokta arası uzaklık ve orta nokta hesaplar' },
  { subject: 'Matematik', unit: 2, main: 'Analitik Geometri', sub: 'Doğru denklemi', outcome: 'Eğim kavramını ve doğru denklemini yazar' },
  { subject: 'Matematik', unit: 2, main: 'Analitik Geometri', sub: 'Doğru ilişkileri', outcome: 'Paralellik, diklik şartları ve noktanın doğruya uzaklığını hesaplar' },
  
  // Fonksiyonlar ve Parabol
  { subject: 'Matematik', unit: 3, main: 'Fonksiyonlar', sub: 'Fonksiyon analizi', outcome: 'Fonksiyonun artan/azalanlık, max/min değerlerini inceler' },
  { subject: 'Matematik', unit: 3, main: 'Parabol', sub: 'İkinci derece fonksiyon', outcome: 'Parabolün tepe noktası, simetri ekseni ve grafiğini çizer' },
  { subject: 'Matematik', unit: 3, main: 'Parabol', sub: 'Günlük hayat modelleme', outcome: 'Parabol ile köprü kemeri, atış yörüngesi problemlerini modelller' },
  
  // Denklem-Eşitsizlik
  { subject: 'Matematik', unit: 4, main: 'Denklem Sistemleri', sub: 'İkinci derece', outcome: 'İkinci dereceden iki bilinmeyenli denklem sistemlerini çözer' },
  { subject: 'Matematik', unit: 4, main: 'Eşitsizlikler', sub: 'İşaret tablosu', outcome: 'İkinci derece eşitsizlikleri işaret tablosu ile çözer' },
  { subject: 'Matematik', unit: 4, main: 'Eşitsizlikler', sub: 'Diskriminant', outcome: 'Köklerin varlığı ve işaretini diskriminant ile analiz eder' },
  
  // Çember
  { subject: 'Matematik', unit: 5, main: 'Çember', sub: 'Temel elemanlar', outcome: 'Kiriş, kesen ve teğet kavramlarını inceler' },
  { subject: 'Matematik', unit: 5, main: 'Çember', sub: 'Açılar', outcome: 'Merkez, çevre, teğet-kiriş açılarını hesaplar' },
  { subject: 'Matematik', unit: 5, main: 'Çember', sub: 'Uzunluk bağıntıları', outcome: 'Çemberde kuvvet ve uzunluk bağıntılarını uygular' },
  
  // Uzay Geometri
  { subject: 'Matematik', unit: 6, main: 'Katı Cisimler', sub: 'Silindir-koni', outcome: 'Silindir ve koninin yüzey alanı ve hacmini hesaplar' },
  { subject: 'Matematik', unit: 6, main: 'Katı Cisimler', sub: 'Küre', outcome: 'Kürenin yüzey alanı ve hacmini hesaplar' },
  
  // Olasılık
  { subject: 'Matematik', unit: 7, main: 'Olasılık', sub: 'Koşullu olasılık', outcome: 'Koşullu olasılık kavramını uygular' },
  { subject: 'Matematik', unit: 7, main: 'Olasılık', sub: 'Bağımlı-bağımsız', outcome: 'Bağımlı ve bağımsız olayları ayırt eder' },
  { subject: 'Matematik', unit: 7, main: 'Olasılık', sub: 'Bileşik olaylar', outcome: 'Bileşik olayların olasılığını hesaplar' },

  // ==================== FİZİK (AYT - Mekanik ve Elektrik) ====================
  // Kuvvet ve Hareket
  { subject: 'Fizik', unit: 1, main: 'Vektörler', sub: 'Vektör işlemleri', outcome: 'Vektörleri toplar, bileşenlerine ayırır' },
  { subject: 'Fizik', unit: 1, main: 'Bağıl Hareket', sub: 'Referans sistemleri', outcome: 'Farklı referans sistemlerine göre hızı hesaplar' },
  { subject: 'Fizik', unit: 1, main: 'Newton Yasaları', sub: 'Dinamik', outcome: 'Newton yasalarını eğik düzlem ve bağlı cisimlere uygular' },
  { subject: 'Fizik', unit: 1, main: 'Sabit İvmeli Hareket', sub: 'Düşey atış', outcome: 'Serbest düşme ve düşey atış hareketlerini analiz eder' },
  { subject: 'Fizik', unit: 1, main: 'İki Boyutlu Hareket', sub: 'Atışlar', outcome: 'Yatay ve eğik atış hareketlerini çözer' },
  { subject: 'Fizik', unit: 1, main: 'Enerji', sub: 'İş-enerji teoremi', outcome: 'İş-enerji teoremi ve mekanik enerjinin korunumunu uygular' },
  { subject: 'Fizik', unit: 1, main: 'Momentum', sub: 'İtme ve momentum', outcome: 'Momentumun korunumu yasası ve çarpışmaları analiz eder' },
  { subject: 'Fizik', unit: 1, main: 'Tork', sub: 'Denge', outcome: 'Tork ve denge şartlarını uygular' },
  { subject: 'Fizik', unit: 1, main: 'Basit Makineler', sub: 'Mekanik avantaj', outcome: 'Basit makinelerde mekanik avantaj ve verimi hesaplar' },
  
  // Elektrik ve Manyetizma
  { subject: 'Fizik', unit: 2, main: 'Elektrostatik', sub: 'Coulomb yasası', outcome: 'Coulomb yasasını ve elektrik alanı uygular' },
  { subject: 'Fizik', unit: 2, main: 'Elektrik Potansiyel', sub: 'Potansiyel fark', outcome: 'Elektriksel potansiyel enerji ve potansiyel farkı hesaplar' },
  { subject: 'Fizik', unit: 2, main: 'Sığaçlar', sub: 'Kondansatörler', outcome: 'Sığaçların seri-paralel bağlanmasını ve enerjisini hesaplar' },
  { subject: 'Fizik', unit: 2, main: 'Manyetizma', sub: 'Manyetik alan', outcome: 'Akım geçen telin, halka ve bobinin manyetik alanını hesaplar' },
  { subject: 'Fizik', unit: 2, main: 'Manyetizma', sub: 'Manyetik kuvvet', outcome: 'Akım geçen tele ve yüklü parçacığa etki eden kuvveti hesaplar' },
  { subject: 'Fizik', unit: 2, main: 'İndüksiyon', sub: 'Faraday-Lenz', outcome: 'Elektromanyetik indüksiyon ve Lenz yasasını uygular' },
  { subject: 'Fizik', unit: 2, main: 'Alternatif Akım', sub: 'AC ve transformatör', outcome: 'Alternatif akım ve transformatör çalışma ilkesini kavrar' },

  // ==================== KİMYA (AYT - Termodinamik ve Denge) ====================
  { subject: 'Kimya', unit: 1, main: 'Atom Teorisi', sub: 'Kuantum sayıları', outcome: 'Modern atom teorisi ve kuantum sayılarını kavrar' },
  { subject: 'Kimya', unit: 1, main: 'Atom Teorisi', sub: 'Orbitaller', outcome: 'Aufbau kuralı, Pauli ilkesi ve Hund kuralını uygular' },
  { subject: 'Kimya', unit: 1, main: 'Periyodik Özellikler', sub: 'Atom yarıçapı', outcome: 'Atom yarıçapı, iyonlaşma enerjisi, elektronegatifliği analiz eder' },
  { subject: 'Kimya', unit: 2, main: 'Gazlar', sub: 'İdeal gaz yasası', outcome: 'İdeal gaz yasası ve gaz yasalarını uygular' },
  { subject: 'Kimya', unit: 2, main: 'Gazlar', sub: 'Kinetik teori', outcome: 'Kinetik teori, difüzyon ve efüzyonu (Graham) kavrar' },
  { subject: 'Kimya', unit: 2, main: 'Gazlar', sub: 'Dalton yasası', outcome: 'Gaz karışımları ve Dalton kısmi basınçlar yasasını uygular' },
  { subject: 'Kimya', unit: 3, main: 'Çözeltiler', sub: 'Derişim birimleri', outcome: 'Molarite, molalite, kütlece yüzde, ppm hesaplar' },
  { subject: 'Kimya', unit: 3, main: 'Çözeltiler', sub: 'Koligatif özellikler', outcome: 'Donma noktası alçalması ve kaynama noktası yükselmesini hesaplar' },
  { subject: 'Kimya', unit: 3, main: 'Çözünürlük', sub: 'Çözünürlük faktörleri', outcome: 'Çözünürlüğe etki eden faktörleri analiz eder' },
  { subject: 'Kimya', unit: 4, main: 'Termodinamik', sub: 'Entalpi', outcome: 'Endotermik/ekzotermik tepkimeler ve entalpisi hesaplar' },
  { subject: 'Kimya', unit: 4, main: 'Termodinamik', sub: 'Hess yasası', outcome: 'Hess yasası ile tepkime ısılarını hesaplar' },
  { subject: 'Kimya', unit: 5, main: 'Tepkime Hızı', sub: 'Çarpışma teorisi', outcome: 'Çarpışma teorisi ve aktivasyon enerjisini kavrar' },
  { subject: 'Kimya', unit: 5, main: 'Tepkime Hızı', sub: 'Hız denklemi', outcome: 'Hız denklemi ve hıza etki eden faktörleri analiz eder' },
  { subject: 'Kimya', unit: 6, main: 'Kimyasal Denge', sub: 'Denge sabiti', outcome: 'Kc ve Kp denge sabitlerini hesaplar' },
  { subject: 'Kimya', unit: 6, main: 'Kimyasal Denge', sub: 'Le Chatelier', outcome: 'Le Chatelier ilkesini denge üzerinde uygular' },
  { subject: 'Kimya', unit: 7, main: 'Asit-Baz Dengesi', sub: 'pH-pOH', outcome: 'pH, pOH, Ka ve Kb hesaplamalarını yapar' },
  { subject: 'Kimya', unit: 7, main: 'Asit-Baz Dengesi', sub: 'Tampon çözeltiler', outcome: 'Tampon çözeltiler ve tuzların hidrolizini analiz eder' },
  { subject: 'Kimya', unit: 7, main: 'Asit-Baz Dengesi', sub: 'Çözünürlük çarpımı', outcome: 'Kçç ve çökelti oluşumunu hesaplar' },

  // ==================== BİYOLOJİ (AYT - İnsan Fizyolojisi) ====================
  { subject: 'Biyoloji', unit: 1, main: 'Sinir Sistemi', sub: 'Nöron yapısı', outcome: 'Nöron yapısı, impuls oluşumu ve iletimini açıklar' },
  { subject: 'Biyoloji', unit: 1, main: 'Sinir Sistemi', sub: 'Merkezi sinir sistemi', outcome: 'Beyin ve omurilik yapısını ve işlevlerini inceler' },
  { subject: 'Biyoloji', unit: 1, main: 'Endokrin Sistem', sub: 'Hormonlar', outcome: 'Endokrin bezleri ve hormonlarını öğrenir' },
  { subject: 'Biyoloji', unit: 1, main: 'Endokrin Sistem', sub: 'Feedback', outcome: 'Geri bildirim mekanizmalarını kavrar' },
  { subject: 'Biyoloji', unit: 1, main: 'Duyu Organları', sub: 'Görme-işitme', outcome: 'Göz ve kulak yapısını ve işleyişini inceler' },
  { subject: 'Biyoloji', unit: 2, main: 'Destek-Hareket', sub: 'Kemik ve kas', outcome: 'Kemik dokusu, eklemler ve kas sistemini inceler' },
  { subject: 'Biyoloji', unit: 2, main: 'Destek-Hareket', sub: 'Kasılma fizyolojisi', outcome: 'Kayan iplikler modelini (Huxley) açıklar' },
  { subject: 'Biyoloji', unit: 3, main: 'Sindirim Sistemi', sub: 'Sindirim organları', outcome: 'Sindirim kanalı ve yardımcı organları inceler' },
  { subject: 'Biyoloji', unit: 3, main: 'Sindirim Sistemi', sub: 'Besin emilimi', outcome: 'Mekanik, kimyasal sindirim ve emilimi açıklar' },
  { subject: 'Biyoloji', unit: 4, main: 'Dolaşım Sistemi', sub: 'Kalp ve damarlar', outcome: 'Kalbin yapısı, kan damarları ve dolaşımı inceler' },
  { subject: 'Biyoloji', unit: 4, main: 'Dolaşım Sistemi', sub: 'Kan ve bağışıklık', outcome: 'Kan dokusu, kan grupları ve bağışıklık sistemini kavrar' },
  { subject: 'Biyoloji', unit: 5, main: 'Solunum Sistemi', sub: 'Solunum organları', outcome: 'Akciğerler ve solunum mekanizmasını inceler' },
  { subject: 'Biyoloji', unit: 5, main: 'Solunum Sistemi', sub: 'Gaz taşınması', outcome: 'O2 ve CO2 taşınmasını (hemoglobin, Bohr etkisi) açıklar' },
  { subject: 'Biyoloji', unit: 6, main: 'Boşaltım Sistemi', sub: 'Böbrek yapısı', outcome: 'Böbrek, nefron ve homeostazi ilişkisini inceler' },
  { subject: 'Biyoloji', unit: 7, main: 'Üreme Sistemi', sub: 'Üreme organları', outcome: 'Dişi ve erkek üreme sistemlerini inceler' },
  { subject: 'Biyoloji', unit: 7, main: 'Üreme Sistemi', sub: 'Embriyonik gelişim', outcome: 'Döllenme ve embriyonik gelişim evrelerini açıklar' },
  { subject: 'Biyoloji', unit: 8, main: 'Ekoloji', sub: 'Popülasyon', outcome: 'Popülasyon dinamiği ve taşıma kapasitesini analiz eder' },

  // ==================== TARİH (AYT - Osmanlı Modernleşmesi) ====================
  { subject: 'Tarih', unit: 1, main: 'Diplomatik Tarih', sub: 'Karlofça', outcome: '1699 Karlofça Antlaşması ve toprak kayıplarını analiz eder' },
  { subject: 'Tarih', unit: 1, main: 'Diplomatik Tarih', sub: 'Denge politikası', outcome: 'Osmanlı\'nın denge politikası ve ittifak arayışlarını inceler' },
  { subject: 'Tarih', unit: 2, main: 'Avrupa ve Osmanlı', sub: 'Ekonomik dönüşüm', outcome: 'Merkantilizm ve Coğrafi Keşiflerin Osmanlı\'ya etkisini analiz eder' },
  { subject: 'Tarih', unit: 2, main: 'Avrupa ve Osmanlı', sub: 'İltizam sistemi', outcome: 'Tımar sisteminin bozulması ve iltizam sistemini inceler' },
  { subject: 'Tarih', unit: 3, main: 'Uluslararası İlişkiler', sub: 'Şark meselesi', outcome: 'Şark Meselesi ve Rusya\'nın sıcak deniz politikasını analiz eder' },
  { subject: 'Tarih', unit: 4, main: 'Milliyetçilik', sub: 'Fikir akımları', outcome: 'Osmanlıcılık, İslamcılık, Türkçülük akımlarını kavrar' },
  { subject: 'Tarih', unit: 5, main: 'Tanzimat', sub: 'Modernleşme', outcome: 'Tanzimat ve Islahat fermanlarıyla modernleşmeyi inceler' },
  { subject: 'Tarih', unit: 5, main: 'Sanayi Devrimi', sub: 'Sermaye ve emek', outcome: 'Sanayi Devrimi ve 1838 Balta Limanı Antlaşmasını analiz eder' },
  { subject: 'Tarih', unit: 6, main: 'Kent Yaşamı', sub: 'Sosyal değişim', outcome: 'Modern ordu, bürokrasi ve Pera kültürünü inceler' },

  // ==================== COĞRAFYA (AYT - Ekosistem ve Ekonomi) ====================
  { subject: 'Coğrafya', unit: 1, main: 'Ekosistem', sub: 'Biyoçeşitlilik', outcome: 'Biyoçeşitlilik ve biyomları inceler' },
  { subject: 'Coğrafya', unit: 1, main: 'Ekosistem', sub: 'Madde döngüleri', outcome: 'Karbon, azot, su ve oksijen döngülerini analiz eder' },
  { subject: 'Coğrafya', unit: 2, main: 'Nüfus', sub: 'Nüfus politikaları', outcome: 'Nüfus politikalarını ve Türkiye projeksiyonlarını inceler' },
  { subject: 'Coğrafya', unit: 2, main: 'Yerleşme', sub: 'Şehir fonksiyonları', outcome: 'Şehirlerin fonksiyonel özellikleri ve etki alanlarını analiz eder' },
  { subject: 'Coğrafya', unit: 3, main: 'Türkiye Ekonomisi', sub: 'Tarım ve hayvancılık', outcome: 'Türkiye\'de tarım, hayvancılık ve ormancılığı inceler' },
  { subject: 'Coğrafya', unit: 3, main: 'Türkiye Ekonomisi', sub: 'Enerji ve sanayi', outcome: 'Türkiye\'de madencilik, enerji kaynakları ve sanayiyi analiz eder' },
  { subject: 'Coğrafya', unit: 4, main: 'Kültür Bölgeleri', sub: 'Medeniyetler', outcome: 'İslam, Batı, Latin, Çin kültür bölgelerini inceler' },
  { subject: 'Coğrafya', unit: 5, main: 'Çevre Sorunları', sub: 'Sürdürülebilirlik', outcome: 'Küresel çevre sorunları ve sürdürülebilir kaynak kullanımını tartışır' },

  // ==================== FELSEFE (Felsefe Tarihi) ====================
  { subject: 'Felsefe', unit: 1, main: 'Antik Yunan', sub: 'Doğa filozofları', outcome: 'Arkhe arayışı ve Sokrates-Platon-Aristoteles felsefesini inceler' },
  { subject: 'Felsefe', unit: 2, main: 'Orta Çağ', sub: 'Hristiyan felsefesi', outcome: 'Patristik ve Skolastik felsefeyi (Augustinus, Aquinas) kavrar' },
  { subject: 'Felsefe', unit: 2, main: 'Orta Çağ', sub: 'İslam felsefesi', outcome: 'Farabi, İbn Sina, İbn Rüşd felsefesini inceler' },
  { subject: 'Felsefe', unit: 3, main: 'Rönesans', sub: 'Modern felsefe', outcome: 'Hümanizm ve Descartes ile modern özne inşasını kavrar' },
  { subject: 'Felsefe', unit: 4, main: 'Aydınlanma', sub: 'Kant ve aklın egemenliği', outcome: 'Aydınlanma Çağı ve Kant felsefesini inceler' },
  { subject: 'Felsefe', unit: 5, main: 'Çağdaş Felsefe', sub: 'Varoluşçuluk', outcome: 'Fenomenoloji, varoluşçuluk ve Türkiye\'de felsefeyi inceler' },

  // ==================== DİN KÜLTÜRÜ VE AHLAK BİLGİSİ ====================
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 1, main: 'Ahiret', sub: 'Dünya ve ahiret', outcome: 'Ölüm, kıyamet, yeniden diriliş kavramlarını inceler' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 2, main: 'Hz. Muhammed', sub: 'Beşeri-nebi yönü', outcome: 'Peygamberin beşeri ve nebi yönünü kavrar' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 3, main: 'Kur\'an Kavramları', sub: 'Hidayet-takva', outcome: 'Hidayet, ihsan, ihlas, takva kavramlarını analiz eder' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 4, main: 'İnanç Meseleleri', sub: 'Modern akımlar', outcome: 'Deizm, ateizm, agnostisizm akımlarını ve İslam\'ın cevaplarını inceler' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 5, main: 'Dünya Dinleri', sub: 'Yahudilik', outcome: 'Yahudilik tarihçesi ve inançlarını inceler' },
  { subject: 'Din Kültürü ve Ahlak Bilgisi', unit: 5, main: 'Dünya Dinleri', sub: 'Hristiyanlık', outcome: 'Hristiyanlık ve teslis inancını kavrar' },

  // ==================== İNGİLİZCE (B2 Seviyesi - 10 Tema) ====================
  { subject: 'İngilizce', unit: 1, main: 'Future Jobs', sub: 'Kariyer planlaması', outcome: 'Geleceğin meslekleri ve CV hazırlama konusunda iletişim kurar' },
  { subject: 'İngilizce', unit: 2, main: 'Hobbies & Skills', sub: 'İlgi alanları', outcome: 'Gerunds/infinitives ile ilgi ve yeteneklerini ifade eder' },
  { subject: 'İngilizce', unit: 3, main: 'Hard Times', sub: 'Geçmiş zorluklar', outcome: 'Past tenses ile zorluk hikâyelerini anlatır' },
  { subject: 'İngilizce', unit: 4, main: 'What a Life', sub: 'Biyografiler', outcome: 'Past perfect ile olayları kronolojik sıralar' },
  { subject: 'İngilizce', unit: 5, main: 'Back to the Past', sub: 'Nostalji', outcome: 'Used to ve wish clauses ile pişmanlık ifade eder' },
  { subject: 'İngilizce', unit: 6, main: 'Open Your Heart', sub: 'Tavsiyeler', outcome: 'Reported speech ile başkasının sözünü aktarır' },
  { subject: 'İngilizce', unit: 7, main: 'Facts About Turkey', sub: 'Türkiye tanıtımı', outcome: 'Passive voice ile tanıtım metni yazar' },
  { subject: 'İngilizce', unit: 8, main: 'Sports', sub: 'Spor dalları', outcome: 'Adverbs ve adjectives ile karşılaştırma yapar' },
  { subject: 'İngilizce', unit: 9, main: 'My Friends', sub: 'Arkadaşlık', outcome: 'Relative clauses ile kişileri tanımlar' },
  { subject: 'İngilizce', unit: 10, main: 'Values & Norms', sub: 'Değerler', outcome: 'Modals of deduction ile çıkarım yapar' },

  // ==================== BEDEN EĞİTİMİ VE SPOR ====================
  { subject: 'Beden Eğitimi ve Spor', unit: 1, main: 'Zindelik', sub: 'Fiziksel gelişim', outcome: 'Fiziksel uygunluk ve antrenman programı hazırlar' },
  { subject: 'Beden Eğitimi ve Spor', unit: 2, main: 'Spor Eğitimi', sub: 'Branş becerileri', outcome: 'Seçilen spor dalında ileri teknik beceriler kazanır' },
  { subject: 'Beden Eğitimi ve Spor', unit: 3, main: 'Spor Kültürü', sub: 'Fair play', outcome: 'Spor ahlakı ve olimpik değerleri içselleştirir' }
];

async function importGrade11Topics() {
  console.log('🎓 11. Sınıf AYT Kazanımları Aktarımı Başlıyor...\n');
  console.log('📌 Not: AYT Hazırlık Yılı - Sorular 5 şıklı!\n');
  
  const { data: subjects, error: subjectsError } = await supabase
    .from('subjects')
    .select('id, name');
  
  if (subjectsError) {
    console.error('❌ Dersler alınamadı:', subjectsError.message);
    return;
  }
  
  const subjectMap = {};
  subjects.forEach(s => { subjectMap[s.name] = s.id; });
  
  console.log('📚 Dersler hazır');
  
  const { data: existingTopics } = await supabase
    .from('topics')
    .select('main_topic, sub_topic, subject_id')
    .eq('grade', 11);
  
  const existingSet = new Set(
    (existingTopics || []).map(t => `${t.subject_id}|${t.main_topic}|${t.sub_topic}`)
  );
  
  console.log(`📋 Mevcut 11. sınıf konu sayısı: ${existingSet.size}`);
  
  let added = 0;
  let skipped = 0;
  let errors = [];
  
  for (const topic of grade11Topics) {
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
        grade: 11,
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
    
    process.stdout.write(`\r⏳ İşleniyor: ${added + skipped + errors.length}/${grade11Topics.length}`);
  }
  
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 11. SINIF AYT KAZANIMLARI SONUÇ:');
  console.log(`   ✅ Yeni eklenen: ${added}`);
  console.log(`   ⏭️ Zaten mevcut: ${skipped}`);
  console.log(`   📝 Toplam işlenen: ${grade11Topics.length}`);
  
  if (errors.length > 0) {
    console.log(`   ⚠️ Hatalar (${errors.length}):`);
    [...new Set(errors)].slice(0, 5).forEach(e => console.log(`      - ${e}`));
  }
  
  const subjectSummary = {};
  grade11Topics.forEach(t => {
    subjectSummary[t.subject] = (subjectSummary[t.subject] || 0) + 1;
  });
  
  console.log('\n📖 Ders Bazında Dağılım:');
  Object.entries(subjectSummary).sort((a, b) => b[1] - a[1]).forEach(([subject, count]) => {
    console.log(`   ${subject}: ${count} kazanım`);
  });
  
  console.log('\n🎯 AYT Fen Bilimleri:');
  ['Matematik', 'Fizik', 'Kimya', 'Biyoloji'].forEach(s => {
    console.log(`   ${s}: ${subjectSummary[s] || 0} kazanım`);
  });
  
  console.log('\n📚 AYT Sosyal Bilimler:');
  ['Türk Dili ve Edebiyatı', 'Tarih', 'Coğrafya', 'Felsefe'].forEach(s => {
    console.log(`   ${s}: ${subjectSummary[s] || 0} kazanım`);
  });
  
  console.log('='.repeat(60));
}

importGrade11Topics()
  .then(() => {
    console.log('\n✅ 11. Sınıf müfredatı aktarımı tamamlandı!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Kritik hata:', err);
    process.exit(1);
  });



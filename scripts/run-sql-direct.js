// Supabase'e direkt SQL çalıştır
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function runSQL() {
  console.log('🚀 Supabase SQL çalıştırılıyor...\n')

  // Önce subjects'ten ID'leri alalım
  const subjectsRes = await fetch(`${SUPABASE_URL}/rest/v1/subjects?select=id,name,slug`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`
    }
  })
  const subjects = await subjectsRes.json()
  
  const getSubjectId = (slug) => subjects.find(s => s.slug === slug)?.id

  const turkce = getSubjectId('turkce')
  const matematik = getSubjectId('matematik')
  const hayat_bilgisi = getSubjectId('hayat_bilgisi')
  const fen_bilimleri = getSubjectId('fen_bilimleri')
  const sosyal_bilgiler = getSubjectId('sosyal_bilgiler')
  const inkilap_tarihi = getSubjectId('inkilap_tarihi')
  const din_kulturu = getSubjectId('din_kulturu')
  const ingilizce = getSubjectId('ingilizce')
  const edebiyat = getSubjectId('edebiyat')
  const fizik = getSubjectId('fizik')
  const kimya = getSubjectId('kimya')
  const biyoloji = getSubjectId('biyoloji')
  const tarih = getSubjectId('tarih')
  const cografya = getSubjectId('cografya')
  const felsefe = getSubjectId('felsefe')

  console.log('Ders ID\'leri alındı ✓\n')

  // Tüm kazanımlar
  const allTopics = [
    // =====================================================
    // 1. SINIF KAZANIMLARI
    // =====================================================
    
    // TÜRKÇE 1. Sınıf
    { subject_id: turkce, grade: 1, unit_number: 1, main_topic: 'Dinleme/İzleme', sub_topic: 'Dikkatle Dinleme', learning_outcome: 'Dinlediklerinin/izlediklerinin konusunu belirler' },
    { subject_id: turkce, grade: 1, unit_number: 1, main_topic: 'Dinleme/İzleme', sub_topic: 'Anlama', learning_outcome: 'Dinlediklerinde/izlediklerinde geçen olayların oluş sırasını belirler' },
    { subject_id: turkce, grade: 1, unit_number: 2, main_topic: 'Konuşma', sub_topic: 'Kendini İfade Etme', learning_outcome: 'Duygu ve düşüncelerini sözlü olarak ifade eder' },
    { subject_id: turkce, grade: 1, unit_number: 3, main_topic: 'Okuma', sub_topic: 'Harf Tanıma', learning_outcome: 'Sesleri/harfleri doğru tanır ve seslendirir' },
    { subject_id: turkce, grade: 1, unit_number: 3, main_topic: 'Okuma', sub_topic: 'Hece ve Kelime', learning_outcome: 'Heceleri ve kelimeleri okur' },
    { subject_id: turkce, grade: 1, unit_number: 4, main_topic: 'Yazma', sub_topic: 'Harf Yazma', learning_outcome: 'Harfleri kurallarına uygun yazar' },
    { subject_id: turkce, grade: 1, unit_number: 4, main_topic: 'Yazma', sub_topic: 'Kelime Yazma', learning_outcome: 'Anlamlı kelimeler yazar' },

    // MATEMATİK 1. Sınıf
    { subject_id: matematik, grade: 1, unit_number: 1, main_topic: 'Sayılar', sub_topic: '1-20 Sayıları', learning_outcome: '1-20 arasındaki sayıları okur ve yazar' },
    { subject_id: matematik, grade: 1, unit_number: 1, main_topic: 'Sayılar', sub_topic: 'Sayı Sayma', learning_outcome: 'Nesneleri sayar ve sonucu rakamla ifade eder' },
    { subject_id: matematik, grade: 1, unit_number: 2, main_topic: 'Toplama İşlemi', sub_topic: 'Tek Basamaklı', learning_outcome: 'Toplamı 20yi geçmeyen doğal sayılarla toplama yapar' },
    { subject_id: matematik, grade: 1, unit_number: 3, main_topic: 'Çıkarma İşlemi', sub_topic: 'Tek Basamaklı', learning_outcome: '20ye kadar olan doğal sayılarla çıkarma yapar' },
    { subject_id: matematik, grade: 1, unit_number: 4, main_topic: 'Geometri', sub_topic: 'Şekiller', learning_outcome: 'Geometrik şekilleri tanır (kare, dikdörtgen, üçgen, daire)' },

    // HAYAT BİLGİSİ 1. Sınıf
    { subject_id: hayat_bilgisi, grade: 1, unit_number: 1, main_topic: 'Okulumuzda Hayat', sub_topic: 'Okul Kuralları', learning_outcome: 'Okul kurallarına uyar' },
    { subject_id: hayat_bilgisi, grade: 1, unit_number: 2, main_topic: 'Evimizde Hayat', sub_topic: 'Aile Bireyleri', learning_outcome: 'Aile bireylerini ve görevlerini tanır' },
    { subject_id: hayat_bilgisi, grade: 1, unit_number: 3, main_topic: 'Sağlıklı Hayat', sub_topic: 'Kişisel Temizlik', learning_outcome: 'Kişisel bakım ve temizlik yapar' },

    // =====================================================
    // 2. SINIF KAZANIMLARI
    // =====================================================
    
    { subject_id: turkce, grade: 2, unit_number: 1, main_topic: 'Dinleme/İzleme', sub_topic: 'Anlama', learning_outcome: 'Dinlediklerinin/izlediklerinin ana fikrini belirler' },
    { subject_id: turkce, grade: 2, unit_number: 2, main_topic: 'Okuma', sub_topic: 'Akıcı Okuma', learning_outcome: 'Noktalama işaretlerine dikkat ederek okur' },
    { subject_id: turkce, grade: 2, unit_number: 3, main_topic: 'Yazma', sub_topic: 'Yazım Kuralları', learning_outcome: 'Büyük harflerin kullanıldığı yerleri bilir' },
    
    { subject_id: matematik, grade: 2, unit_number: 1, main_topic: 'Sayılar', sub_topic: '100e Kadar Sayılar', learning_outcome: '100e kadar sayıları okur ve yazar' },
    { subject_id: matematik, grade: 2, unit_number: 2, main_topic: 'Toplama ve Çıkarma', sub_topic: 'İki Basamaklı', learning_outcome: 'İki basamaklı sayılarla toplama ve çıkarma yapar' },
    { subject_id: matematik, grade: 2, unit_number: 3, main_topic: 'Çarpma İşlemi', sub_topic: 'Çarpma Kavramı', learning_outcome: 'Çarpma işleminin anlamını kavrar' },

    { subject_id: ingilizce, grade: 2, unit_number: 1, main_topic: 'Greetings', sub_topic: 'Selamlaşma', learning_outcome: 'Selamlaşma ifadelerini kullanır' },
    { subject_id: ingilizce, grade: 2, unit_number: 2, main_topic: 'Numbers', sub_topic: 'Sayılar 1-20', learning_outcome: '1-20 arası sayıları İngilizce söyler' },
    { subject_id: ingilizce, grade: 2, unit_number: 3, main_topic: 'Colors', sub_topic: 'Renkler', learning_outcome: 'Renkleri İngilizce söyler' },

    // =====================================================
    // 3. SINIF KAZANIMLARI
    // =====================================================
    
    { subject_id: turkce, grade: 3, unit_number: 1, main_topic: 'Okuma', sub_topic: 'Söz Varlığı', learning_outcome: 'Okuduğu metindeki söz varlığını geliştirir' },
    { subject_id: turkce, grade: 3, unit_number: 2, main_topic: 'Yazma', sub_topic: 'Paragraf Yazma', learning_outcome: 'Paragraf yazar' },
    { subject_id: turkce, grade: 3, unit_number: 3, main_topic: 'Dil Bilgisi', sub_topic: 'İsim ve Fiil', learning_outcome: 'İsim ve fiili ayırt eder' },

    { subject_id: matematik, grade: 3, unit_number: 1, main_topic: 'Sayılar', sub_topic: '1000e Kadar Sayılar', learning_outcome: '1000e kadar sayıları okur ve yazar' },
    { subject_id: matematik, grade: 3, unit_number: 2, main_topic: 'Dört İşlem', sub_topic: 'Çarpma', learning_outcome: 'Çarpım tablosunu kullanır' },
    { subject_id: matematik, grade: 3, unit_number: 3, main_topic: 'Kesirler', sub_topic: 'Kesir Kavramı', learning_outcome: 'Basit kesirleri okur ve yazar' },

    { subject_id: fen_bilimleri, grade: 3, unit_number: 1, main_topic: 'Canlılar Dünyası', sub_topic: 'Beş Duyu', learning_outcome: 'Duyu organlarımızı ve işlevlerini açıklar' },
    { subject_id: fen_bilimleri, grade: 3, unit_number: 2, main_topic: 'Kuvvet ve Hareket', sub_topic: 'İtme-Çekme', learning_outcome: 'İtme ve çekmenin hareketlere etkisini açıklar' },
    { subject_id: fen_bilimleri, grade: 3, unit_number: 3, main_topic: 'Madde ve Değişim', sub_topic: 'Maddenin Halleri', learning_outcome: 'Maddenin katı, sıvı ve gaz hallerini ayırt eder' },

    // =====================================================
    // 4. SINIF KAZANIMLARI
    // =====================================================
    
    { subject_id: turkce, grade: 4, unit_number: 1, main_topic: 'Okuma', sub_topic: 'Eleştirel Okuma', learning_outcome: 'Okuduklarını sorgular' },
    { subject_id: turkce, grade: 4, unit_number: 2, main_topic: 'Dil Bilgisi', sub_topic: 'Sıfatlar', learning_outcome: 'Sıfatları tanır ve kullanır' },
    { subject_id: turkce, grade: 4, unit_number: 3, main_topic: 'Dil Bilgisi', sub_topic: 'Zarflar', learning_outcome: 'Zarfları tanır ve kullanır' },

    { subject_id: matematik, grade: 4, unit_number: 1, main_topic: 'Sayılar', sub_topic: 'Çok Basamaklı Sayılar', learning_outcome: '10000e kadar sayıları okur ve yazar' },
    { subject_id: matematik, grade: 4, unit_number: 2, main_topic: 'Kesirler', sub_topic: 'Denk Kesirler', learning_outcome: 'Denk kesirleri belirler' },
    { subject_id: matematik, grade: 4, unit_number: 3, main_topic: 'Ondalık Gösterim', sub_topic: 'Ondalık Kesirler', learning_outcome: 'Ondalık kesirleri okur ve yazar' },
    { subject_id: matematik, grade: 4, unit_number: 4, main_topic: 'Geometri', sub_topic: 'Dörtgenler', learning_outcome: 'Dörtgenleri sınıflandırır' },
    { subject_id: matematik, grade: 4, unit_number: 5, main_topic: 'Ölçme', sub_topic: 'Alan', learning_outcome: 'Dikdörtgen ve karenin alanını hesaplar' },

    { subject_id: fen_bilimleri, grade: 4, unit_number: 1, main_topic: 'Canlılar Dünyası', sub_topic: 'Besin Zinciri', learning_outcome: 'Besin zincirini açıklar' },
    { subject_id: fen_bilimleri, grade: 4, unit_number: 2, main_topic: 'Kuvvet ve Hareket', sub_topic: 'Sürtünme Kuvveti', learning_outcome: 'Sürtünme kuvvetini açıklar' },
    { subject_id: fen_bilimleri, grade: 4, unit_number: 3, main_topic: 'Işık ve Ses', sub_topic: 'Işığın Yansıması', learning_outcome: 'Işığın yansımasını açıklar' },

    { subject_id: sosyal_bilgiler, grade: 4, unit_number: 1, main_topic: 'Birey ve Toplum', sub_topic: 'Kimlik', learning_outcome: 'Kendi kimliğini tanır' },
    { subject_id: sosyal_bilgiler, grade: 4, unit_number: 2, main_topic: 'Kültür ve Miras', sub_topic: 'Kültürel Değerler', learning_outcome: 'Kültürel değerlerimizi tanır' },

    // =====================================================
    // 5. SINIF KAZANIMLARI
    // =====================================================
    
    { subject_id: turkce, grade: 5, unit_number: 1, main_topic: 'Dinleme/İzleme', sub_topic: 'Not Alma', learning_outcome: 'Dinlerken/izlerken not alır' },
    { subject_id: turkce, grade: 5, unit_number: 2, main_topic: 'Okuma', sub_topic: 'Ana Düşünce', learning_outcome: 'Metnin ana düşüncesini belirler' },
    { subject_id: turkce, grade: 5, unit_number: 3, main_topic: 'Yazma', sub_topic: 'Öykü Yazma', learning_outcome: 'Öykü yazar' },
    { subject_id: turkce, grade: 5, unit_number: 4, main_topic: 'Dil Bilgisi', sub_topic: 'Sözcük Türleri', learning_outcome: 'Sözcük türlerini ayırt eder' },
    { subject_id: turkce, grade: 5, unit_number: 5, main_topic: 'Dil Bilgisi', sub_topic: 'Cümle Ögeleri', learning_outcome: 'Cümlenin ögelerini belirler' },

    { subject_id: matematik, grade: 5, unit_number: 1, main_topic: 'Doğal Sayılar', sub_topic: 'Milyonluk Sayılar', learning_outcome: 'Milyonluk sayıları okur ve yazar' },
    { subject_id: matematik, grade: 5, unit_number: 2, main_topic: 'Doğal Sayılar', sub_topic: 'Bölünebilme', learning_outcome: 'Bir sayının 2, 3, 5, 9, 10 ile bölünebilirliğini belirler' },
    { subject_id: matematik, grade: 5, unit_number: 3, main_topic: 'Kesirler', sub_topic: 'Kesirleri Sıralama', learning_outcome: 'Kesirleri sıralar' },
    { subject_id: matematik, grade: 5, unit_number: 4, main_topic: 'Kesirler', sub_topic: 'Kesirlerle İşlem', learning_outcome: 'Kesirlerle toplama ve çıkarma yapar' },
    { subject_id: matematik, grade: 5, unit_number: 5, main_topic: 'Ondalık Gösterim', sub_topic: 'Ondalık Sayılar', learning_outcome: 'Ondalık gösterimle işlem yapar' },
    { subject_id: matematik, grade: 5, unit_number: 6, main_topic: 'Yüzdeler', sub_topic: 'Yüzde Kavramı', learning_outcome: 'Yüzde kavramını anlar' },
    { subject_id: matematik, grade: 5, unit_number: 7, main_topic: 'Geometri', sub_topic: 'Açılar', learning_outcome: 'Açı ölçer ve sınıflandırır' },
    { subject_id: matematik, grade: 5, unit_number: 8, main_topic: 'Geometri', sub_topic: 'Üçgenler', learning_outcome: 'Üçgenleri sınıflandırır' },

    { subject_id: fen_bilimleri, grade: 5, unit_number: 1, main_topic: 'Canlılar Dünyası', sub_topic: 'Sindirim Sistemi', learning_outcome: 'Sindirim sistemi organlarını ve görevlerini açıklar' },
    { subject_id: fen_bilimleri, grade: 5, unit_number: 2, main_topic: 'Canlılar Dünyası', sub_topic: 'Besinler', learning_outcome: 'Besinleri sınıflandırır' },
    { subject_id: fen_bilimleri, grade: 5, unit_number: 3, main_topic: 'Kuvvet ve Hareket', sub_topic: 'Kuvvet ve Sürtünme', learning_outcome: 'Kuvvetin cisimler üzerindeki etkisini açıklar' },
    { subject_id: fen_bilimleri, grade: 5, unit_number: 4, main_topic: 'Madde ve Değişim', sub_topic: 'Maddenin Değişimi', learning_outcome: 'Maddenin hal değişimini açıklar' },
    { subject_id: fen_bilimleri, grade: 5, unit_number: 5, main_topic: 'Elektrik', sub_topic: 'Elektrik Devresi', learning_outcome: 'Basit elektrik devresi kurar' },

    { subject_id: sosyal_bilgiler, grade: 5, unit_number: 1, main_topic: 'Birey ve Toplum', sub_topic: 'Haklar ve Sorumluluklar', learning_outcome: 'Hak ve sorumluluklarını bilir' },
    { subject_id: sosyal_bilgiler, grade: 5, unit_number: 2, main_topic: 'Kültür ve Miras', sub_topic: 'Türk Tarihi', learning_outcome: 'Türk tarihindeki önemli olayları açıklar' },

    // =====================================================
    // 6. SINIF KAZANIMLARI
    // =====================================================
    
    { subject_id: turkce, grade: 6, unit_number: 1, main_topic: 'Okuma', sub_topic: 'Metinler Arası Okuma', learning_outcome: 'Metinleri karşılaştırır' },
    { subject_id: turkce, grade: 6, unit_number: 2, main_topic: 'Dil Bilgisi', sub_topic: 'Fiil Çekimi', learning_outcome: 'Fiilleri kip ve kişiye göre çeker' },
    { subject_id: turkce, grade: 6, unit_number: 3, main_topic: 'Söz Varlığı', sub_topic: 'Deyimler', learning_outcome: 'Deyimleri cümle içinde kullanır' },
    { subject_id: turkce, grade: 6, unit_number: 4, main_topic: 'Söz Varlığı', sub_topic: 'Atasözleri', learning_outcome: 'Atasözlerini yerinde kullanır' },

    { subject_id: matematik, grade: 6, unit_number: 1, main_topic: 'Doğal Sayılar', sub_topic: 'EKOK-EBOB', learning_outcome: 'EKOK ve EBOB hesaplar' },
    { subject_id: matematik, grade: 6, unit_number: 2, main_topic: 'Kesirlerle İşlemler', sub_topic: 'Çarpma', learning_outcome: 'Kesirlerle çarpma yapar' },
    { subject_id: matematik, grade: 6, unit_number: 3, main_topic: 'Kesirlerle İşlemler', sub_topic: 'Bölme', learning_outcome: 'Kesirlerle bölme yapar' },
    { subject_id: matematik, grade: 6, unit_number: 4, main_topic: 'Oran ve Orantı', sub_topic: 'Oran Kavramı', learning_outcome: 'İki çokluğun birbirine oranını belirler' },
    { subject_id: matematik, grade: 6, unit_number: 5, main_topic: 'Oran ve Orantı', sub_topic: 'Doğru Orantı', learning_outcome: 'Doğru orantıyı açıklar' },
    { subject_id: matematik, grade: 6, unit_number: 6, main_topic: 'Cebirsel İfadeler', sub_topic: 'Harfli İfadeler', learning_outcome: 'Harfli ifadeleri anlar' },
    { subject_id: matematik, grade: 6, unit_number: 7, main_topic: 'Geometri', sub_topic: 'Alan Hesaplama', learning_outcome: 'Dörtgenlerin alanını hesaplar' },

    { subject_id: fen_bilimleri, grade: 6, unit_number: 1, main_topic: 'Canlılar Dünyası', sub_topic: 'Hücre', learning_outcome: 'Hücrenin temel yapısını açıklar' },
    { subject_id: fen_bilimleri, grade: 6, unit_number: 2, main_topic: 'Canlılar Dünyası', sub_topic: 'Dolaşım Sistemi', learning_outcome: 'Dolaşım sistemini açıklar' },
    { subject_id: fen_bilimleri, grade: 6, unit_number: 3, main_topic: 'Kuvvet ve Hareket', sub_topic: 'Ağırlık ve Kütle', learning_outcome: 'Ağırlık ve kütle arasındaki farkı açıklar' },
    { subject_id: fen_bilimleri, grade: 6, unit_number: 4, main_topic: 'Madde ve Değişim', sub_topic: 'Fiziksel ve Kimyasal Değişim', learning_outcome: 'Fiziksel ve kimyasal değişimi ayırt eder' },
    { subject_id: fen_bilimleri, grade: 6, unit_number: 5, main_topic: 'Madde ve Değişim', sub_topic: 'Karışımlar', learning_outcome: 'Karışımları sınıflandırır' },

    { subject_id: sosyal_bilgiler, grade: 6, unit_number: 1, main_topic: 'İnsanlar ve Yönetim', sub_topic: 'Demokrasi', learning_outcome: 'Demokrasi kavramını açıklar' },

    // =====================================================
    // 7. SINIF KAZANIMLARI
    // =====================================================
    
    { subject_id: turkce, grade: 7, unit_number: 1, main_topic: 'Okuma', sub_topic: 'Metin Türleri', learning_outcome: 'Metin türlerini ayırt eder' },
    { subject_id: turkce, grade: 7, unit_number: 2, main_topic: 'Dil Bilgisi', sub_topic: 'Cümle Türleri', learning_outcome: 'Cümle türlerini tanır' },
    { subject_id: turkce, grade: 7, unit_number: 3, main_topic: 'Dil Bilgisi', sub_topic: 'Anlatım Bozuklukları', learning_outcome: 'Anlatım bozukluklarını düzeltir' },
    { subject_id: turkce, grade: 7, unit_number: 4, main_topic: 'Söz Varlığı', sub_topic: 'Anlam İlişkileri', learning_outcome: 'Sözcükler arasındaki anlam ilişkilerini açıklar' },

    { subject_id: matematik, grade: 7, unit_number: 1, main_topic: 'Tam Sayılar', sub_topic: 'Tam Sayılarla İşlemler', learning_outcome: 'Tam sayılarla dört işlem yapar' },
    { subject_id: matematik, grade: 7, unit_number: 2, main_topic: 'Rasyonel Sayılar', sub_topic: 'Rasyonel Sayı Kavramı', learning_outcome: 'Rasyonel sayıları tanır' },
    { subject_id: matematik, grade: 7, unit_number: 3, main_topic: 'Rasyonel Sayılar', sub_topic: 'Rasyonel Sayılarla İşlem', learning_outcome: 'Rasyonel sayılarla işlem yapar' },
    { subject_id: matematik, grade: 7, unit_number: 4, main_topic: 'Oran ve Orantı', sub_topic: 'Ters Orantı', learning_outcome: 'Ters orantıyı açıklar' },
    { subject_id: matematik, grade: 7, unit_number: 5, main_topic: 'Oran ve Orantı', sub_topic: 'Yüzde Problemleri', learning_outcome: 'Yüzde problemlerini çözer' },
    { subject_id: matematik, grade: 7, unit_number: 6, main_topic: 'Cebirsel İfadeler', sub_topic: 'Eşitlik ve Denklem', learning_outcome: 'Denklem kurar ve çözer' },
    { subject_id: matematik, grade: 7, unit_number: 7, main_topic: 'Geometri', sub_topic: 'Açıortay-Kenarortay', learning_outcome: 'Açıortay ve kenarortayı açıklar' },
    { subject_id: matematik, grade: 7, unit_number: 8, main_topic: 'Geometri', sub_topic: 'Eşlik ve Benzerlik', learning_outcome: 'Eşlik ve benzerliği açıklar' },
    { subject_id: matematik, grade: 7, unit_number: 9, main_topic: 'Veri Analizi', sub_topic: 'Merkezi Eğilim Ölçüleri', learning_outcome: 'Ortalama, ortanca ve tepe değeri hesaplar' },

    { subject_id: fen_bilimleri, grade: 7, unit_number: 1, main_topic: 'Canlılar Dünyası', sub_topic: 'Solunum Sistemi', learning_outcome: 'Solunum sistemi organlarını ve görevlerini açıklar' },
    { subject_id: fen_bilimleri, grade: 7, unit_number: 2, main_topic: 'Canlılar Dünyası', sub_topic: 'Boşaltım Sistemi', learning_outcome: 'Boşaltım sistemini açıklar' },
    { subject_id: fen_bilimleri, grade: 7, unit_number: 3, main_topic: 'Kuvvet ve Enerji', sub_topic: 'Potansiyel ve Kinetik Enerji', learning_outcome: 'Enerji türlerini ayırt eder' },
    { subject_id: fen_bilimleri, grade: 7, unit_number: 4, main_topic: 'Madde ve Değişim', sub_topic: 'Atom Modeli', learning_outcome: 'Atomun yapısını açıklar' },
    { subject_id: fen_bilimleri, grade: 7, unit_number: 5, main_topic: 'Madde ve Değişim', sub_topic: 'Periyodik Tablo', learning_outcome: 'Periyodik tabloyu inceler' },
    { subject_id: fen_bilimleri, grade: 7, unit_number: 6, main_topic: 'Aynalar', sub_topic: 'Düz ve Küresel Aynalar', learning_outcome: 'Aynalarda görüntü oluşumunu açıklar' },

    // =====================================================
    // 8. SINIF KAZANIMLARI (LGS)
    // =====================================================
    
    // TÜRKÇE 8. Sınıf (LGS)
    { subject_id: turkce, grade: 8, unit_number: 1, main_topic: 'Söz Varlığı', sub_topic: 'Sözcükte Anlam', learning_outcome: 'Sözcüğün mecaz ve terim anlamını kavrar' },
    { subject_id: turkce, grade: 8, unit_number: 1, main_topic: 'Söz Varlığı', sub_topic: 'Sözcükler Arası Anlam', learning_outcome: 'Eş anlamlı, zıt anlamlı, eş sesli sözcükleri tanır' },
    { subject_id: turkce, grade: 8, unit_number: 2, main_topic: 'Dil Bilgisi', sub_topic: 'Sözcük Türleri', learning_outcome: 'Tüm sözcük türlerini ayırt eder' },
    { subject_id: turkce, grade: 8, unit_number: 2, main_topic: 'Dil Bilgisi', sub_topic: 'Cümle Çeşitleri', learning_outcome: 'Yüklemine göre cümle çeşitlerini belirler' },
    { subject_id: turkce, grade: 8, unit_number: 2, main_topic: 'Dil Bilgisi', sub_topic: 'Cümle Ögeleri', learning_outcome: 'Tüm cümle ögelerini belirler' },
    { subject_id: turkce, grade: 8, unit_number: 3, main_topic: 'Anlam Bilgisi', sub_topic: 'Paragraf', learning_outcome: 'Paragrafın ana düşüncesini ve yardımcı düşüncelerini bulur' },
    { subject_id: turkce, grade: 8, unit_number: 3, main_topic: 'Anlam Bilgisi', sub_topic: 'Cümlede Anlam', learning_outcome: 'Cümle anlamını yorumlar' },
    { subject_id: turkce, grade: 8, unit_number: 4, main_topic: 'Yazım Kuralları', sub_topic: 'Yazım', learning_outcome: 'Yazım kurallarını uygular' },
    { subject_id: turkce, grade: 8, unit_number: 4, main_topic: 'Yazım Kuralları', sub_topic: 'Noktalama', learning_outcome: 'Noktalama işaretlerini doğru kullanır' },

    // MATEMATİK 8. Sınıf (LGS)
    { subject_id: matematik, grade: 8, unit_number: 1, main_topic: 'Çarpanlar ve Katlar', sub_topic: 'EKOK-EBOB', learning_outcome: 'EKOK ve EBOB problemleri çözer' },
    { subject_id: matematik, grade: 8, unit_number: 2, main_topic: 'Üslü İfadeler', sub_topic: 'Üslü Sayılar', learning_outcome: 'Üslü ifadelerle işlem yapar' },
    { subject_id: matematik, grade: 8, unit_number: 2, main_topic: 'Üslü İfadeler', sub_topic: 'Bilimsel Gösterim', learning_outcome: 'Sayıları bilimsel gösterimle ifade eder' },
    { subject_id: matematik, grade: 8, unit_number: 3, main_topic: 'Kareköklü İfadeler', sub_topic: 'Karekök', learning_outcome: 'Kareköklü ifadelerle işlem yapar' },
    { subject_id: matematik, grade: 8, unit_number: 4, main_topic: 'Cebirsel İfadeler', sub_topic: 'Özdeşlikler', learning_outcome: 'Özdeşlikleri kullanır' },
    { subject_id: matematik, grade: 8, unit_number: 4, main_topic: 'Cebirsel İfadeler', sub_topic: 'Çarpanlara Ayırma', learning_outcome: 'Cebirsel ifadeleri çarpanlarına ayırır' },
    { subject_id: matematik, grade: 8, unit_number: 5, main_topic: 'Doğrusal Denklemler', sub_topic: 'Birinci Dereceden Denklemler', learning_outcome: 'Birinci dereceden bir bilinmeyenli denklemleri çözer' },
    { subject_id: matematik, grade: 8, unit_number: 5, main_topic: 'Doğrusal Denklemler', sub_topic: 'Denklem Sistemleri', learning_outcome: 'İki bilinmeyenli doğrusal denklem sistemlerini çözer' },
    { subject_id: matematik, grade: 8, unit_number: 6, main_topic: 'Eşitsizlikler', sub_topic: 'Birinci Dereceden Eşitsizlikler', learning_outcome: 'Birinci dereceden bir bilinmeyenli eşitsizlikleri çözer' },
    { subject_id: matematik, grade: 8, unit_number: 7, main_topic: 'Üçgenler', sub_topic: 'Üçgende Açı', learning_outcome: 'Üçgenin iç ve dış açı özelliklerini kullanır' },
    { subject_id: matematik, grade: 8, unit_number: 7, main_topic: 'Üçgenler', sub_topic: 'Üçgende Eşlik ve Benzerlik', learning_outcome: 'Üçgenlerde eşlik ve benzerlik koşullarını kullanır' },
    { subject_id: matematik, grade: 8, unit_number: 8, main_topic: 'Dönüşüm Geometrisi', sub_topic: 'Yansıma', learning_outcome: 'Yansımayı açıklar' },
    { subject_id: matematik, grade: 8, unit_number: 8, main_topic: 'Dönüşüm Geometrisi', sub_topic: 'Öteleme ve Döndürme', learning_outcome: 'Öteleme ve döndürmeyi açıklar' },
    { subject_id: matematik, grade: 8, unit_number: 9, main_topic: 'Geometrik Cisimler', sub_topic: 'Prizma ve Piramit', learning_outcome: 'Prizma ve piramidin özelliklerini belirler' },
    { subject_id: matematik, grade: 8, unit_number: 9, main_topic: 'Geometrik Cisimler', sub_topic: 'Silindir ve Koni', learning_outcome: 'Silindir ve koninin özelliklerini belirler' },
    { subject_id: matematik, grade: 8, unit_number: 10, main_topic: 'Olasılık', sub_topic: 'Olasılık Hesaplama', learning_outcome: 'Basit olayların olma olasılığını hesaplar' },

    // FEN BİLİMLERİ 8. Sınıf (LGS)
    { subject_id: fen_bilimleri, grade: 8, unit_number: 1, main_topic: 'Mevsimler ve İklim', sub_topic: 'Mevsimlerin Oluşumu', learning_outcome: 'Mevsimlerin oluşumunu açıklar' },
    { subject_id: fen_bilimleri, grade: 8, unit_number: 1, main_topic: 'Mevsimler ve İklim', sub_topic: 'İklim ve Hava', learning_outcome: 'İklim ve hava durumu arasındaki farkı açıklar' },
    { subject_id: fen_bilimleri, grade: 8, unit_number: 2, main_topic: 'DNA ve Genetik Kod', sub_topic: 'DNA Yapısı', learning_outcome: 'DNAnın yapısını açıklar' },
    { subject_id: fen_bilimleri, grade: 8, unit_number: 2, main_topic: 'DNA ve Genetik Kod', sub_topic: 'Kalıtım', learning_outcome: 'Kalıtım kavramlarını açıklar' },
    { subject_id: fen_bilimleri, grade: 8, unit_number: 2, main_topic: 'DNA ve Genetik Kod', sub_topic: 'Mutasyon', learning_outcome: 'Mutasyon ve modifikasyonu açıklar' },
    { subject_id: fen_bilimleri, grade: 8, unit_number: 3, main_topic: 'Basınç', sub_topic: 'Katı Basıncı', learning_outcome: 'Katı basıncını hesaplar' },
    { subject_id: fen_bilimleri, grade: 8, unit_number: 3, main_topic: 'Basınç', sub_topic: 'Sıvı Basıncı', learning_outcome: 'Sıvı basıncını açıklar' },
    { subject_id: fen_bilimleri, grade: 8, unit_number: 3, main_topic: 'Basınç', sub_topic: 'Gaz Basıncı', learning_outcome: 'Gaz basıncını açıklar' },
    { subject_id: fen_bilimleri, grade: 8, unit_number: 4, main_topic: 'Madde ve Endüstri', sub_topic: 'Periyodik Sistem', learning_outcome: 'Periyodik sistemdeki grupları tanır' },
    { subject_id: fen_bilimleri, grade: 8, unit_number: 4, main_topic: 'Madde ve Endüstri', sub_topic: 'Kimyasal Tepkimeler', learning_outcome: 'Kimyasal tepkimeleri denkleştirir' },
    { subject_id: fen_bilimleri, grade: 8, unit_number: 4, main_topic: 'Madde ve Endüstri', sub_topic: 'Asit ve Bazlar', learning_outcome: 'Asit ve bazları tanır' },
    { subject_id: fen_bilimleri, grade: 8, unit_number: 5, main_topic: 'Basit Makineler', sub_topic: 'Kaldıraç', learning_outcome: 'Kaldıracı açıklar' },
    { subject_id: fen_bilimleri, grade: 8, unit_number: 5, main_topic: 'Basit Makineler', sub_topic: 'Makara ve Dişli', learning_outcome: 'Makara ve dişli çarklarını açıklar' },
    { subject_id: fen_bilimleri, grade: 8, unit_number: 6, main_topic: 'Enerji Dönüşümleri', sub_topic: 'Enerji Türleri', learning_outcome: 'Enerji dönüşümlerini açıklar' },

    // T.C. İNKILAP TARİHİ 8. Sınıf (LGS)
    { subject_id: inkilap_tarihi, grade: 8, unit_number: 1, main_topic: 'Bir Kahraman Doğuyor', sub_topic: 'Atatürkün Çocukluk ve Eğitim Hayatı', learning_outcome: 'Atatürkün çocukluğunu ve eğitim hayatını tanır' },
    { subject_id: inkilap_tarihi, grade: 8, unit_number: 2, main_topic: 'Millî Uyanış', sub_topic: 'I. Dünya Savaşı', learning_outcome: 'I. Dünya Savaşının nedenlerini ve sonuçlarını açıklar' },
    { subject_id: inkilap_tarihi, grade: 8, unit_number: 2, main_topic: 'Millî Uyanış', sub_topic: 'Mondros Ateşkesi', learning_outcome: 'Mondros Ateşkesinin maddelerini değerlendirir' },
    { subject_id: inkilap_tarihi, grade: 8, unit_number: 3, main_topic: 'Ya İstiklal Ya Ölüm', sub_topic: 'Kuvayı Milliye', learning_outcome: 'Kuvayı Milliye hareketini açıklar' },
    { subject_id: inkilap_tarihi, grade: 8, unit_number: 3, main_topic: 'Ya İstiklal Ya Ölüm', sub_topic: 'TBMMnin Açılışı', learning_outcome: 'TBMMnin açılışını ve önemini açıklar' },
    { subject_id: inkilap_tarihi, grade: 8, unit_number: 4, main_topic: 'Kurtuluş Savaşı', sub_topic: 'Batı Cephesi', learning_outcome: 'Batı Cephesindeki savaşları açıklar' },
    { subject_id: inkilap_tarihi, grade: 8, unit_number: 4, main_topic: 'Kurtuluş Savaşı', sub_topic: 'Büyük Taarruz', learning_outcome: 'Büyük Taarruzu ve sonuçlarını açıklar' },
    { subject_id: inkilap_tarihi, grade: 8, unit_number: 5, main_topic: 'Atatürk İlkeleri', sub_topic: 'Cumhuriyetçilik', learning_outcome: 'Cumhuriyetçilik ilkesini açıklar' },
    { subject_id: inkilap_tarihi, grade: 8, unit_number: 5, main_topic: 'Atatürk İlkeleri', sub_topic: 'Milliyetçilik', learning_outcome: 'Milliyetçilik ilkesini açıklar' },
    { subject_id: inkilap_tarihi, grade: 8, unit_number: 5, main_topic: 'Atatürk İlkeleri', sub_topic: 'Laiklik', learning_outcome: 'Laiklik ilkesini açıklar' },
    { subject_id: inkilap_tarihi, grade: 8, unit_number: 6, main_topic: 'İnkılaplar', sub_topic: 'Siyasi İnkılaplar', learning_outcome: 'Siyasi alanda yapılan inkılapları açıklar' },
    { subject_id: inkilap_tarihi, grade: 8, unit_number: 6, main_topic: 'İnkılaplar', sub_topic: 'Eğitim ve Kültür İnkılapları', learning_outcome: 'Eğitim ve kültür alanındaki inkılapları açıklar' },

    // DİN KÜLTÜRÜ 8. Sınıf (LGS)
    { subject_id: din_kulturu, grade: 8, unit_number: 1, main_topic: 'Kader İnancı', sub_topic: 'Kader ve Kaza', learning_outcome: 'Kader ve kaza kavramlarını açıklar' },
    { subject_id: din_kulturu, grade: 8, unit_number: 2, main_topic: 'Zekât ve Sadaka', sub_topic: 'Zekât', learning_outcome: 'Zekâtın önemini açıklar' },
    { subject_id: din_kulturu, grade: 8, unit_number: 3, main_topic: 'Din ve Hayat', sub_topic: 'Hac ve Umre', learning_outcome: 'Hac ve Umre ibadetlerini tanır' },

    // İNGİLİZCE 8. Sınıf (LGS)
    { subject_id: ingilizce, grade: 8, unit_number: 1, main_topic: 'Friendship', sub_topic: 'Making Friends', learning_outcome: 'Arkadaşlık hakkında konuşur' },
    { subject_id: ingilizce, grade: 8, unit_number: 2, main_topic: 'Teen Life', sub_topic: 'Daily Routines', learning_outcome: 'Günlük rutinleri anlatır' },
    { subject_id: ingilizce, grade: 8, unit_number: 3, main_topic: 'In the Kitchen', sub_topic: 'Cooking', learning_outcome: 'Yemek tarifleri verir' },
    { subject_id: ingilizce, grade: 8, unit_number: 4, main_topic: 'On the Phone', sub_topic: 'Phone Conversations', learning_outcome: 'Telefon konuşmaları yapar' },
    { subject_id: ingilizce, grade: 8, unit_number: 5, main_topic: 'The Internet', sub_topic: 'Online Activities', learning_outcome: 'İnternet aktivitelerini anlatır' },
    { subject_id: ingilizce, grade: 8, unit_number: 6, main_topic: 'Adventures', sub_topic: 'Past Events', learning_outcome: 'Geçmişteki olayları anlatır' },
    { subject_id: ingilizce, grade: 8, unit_number: 7, main_topic: 'Tourism', sub_topic: 'Travel', learning_outcome: 'Seyahat planları yapar' },
    { subject_id: ingilizce, grade: 8, unit_number: 8, main_topic: 'Science', sub_topic: 'Inventions', learning_outcome: 'Bilim ve icatlar hakkında konuşur' },

    // =====================================================
    // 9-12. SINIF KAZANIMLARI (LİSE)
    // =====================================================
    
    // TÜRK DİLİ VE EDEBİYATI 9. Sınıf
    { subject_id: edebiyat, grade: 9, unit_number: 1, main_topic: 'Edebiyat Türleri', sub_topic: 'Şiir', learning_outcome: 'Şiir türlerini ve özelliklerini tanır' },
    { subject_id: edebiyat, grade: 9, unit_number: 1, main_topic: 'Edebiyat Türleri', sub_topic: 'Hikâye', learning_outcome: 'Hikâye türlerini ve özelliklerini tanır' },
    { subject_id: edebiyat, grade: 9, unit_number: 2, main_topic: 'Dil Bilgisi', sub_topic: 'Sözcükte Yapı', learning_outcome: 'Sözcüklerin yapısını çözümler' },
    { subject_id: edebiyat, grade: 9, unit_number: 3, main_topic: 'Edebi Sanatlar', sub_topic: 'Söz Sanatları', learning_outcome: 'Söz sanatlarını tanır ve kullanır' },

    // MATEMATİK 9. Sınıf
    { subject_id: matematik, grade: 9, unit_number: 1, main_topic: 'Mantık', sub_topic: 'Önermeler', learning_outcome: 'Önermeleri tanır ve mantık işlemlerini yapar' },
    { subject_id: matematik, grade: 9, unit_number: 2, main_topic: 'Kümeler', sub_topic: 'Küme Kavramı', learning_outcome: 'Kümeleri gösterir ve alt kümeleri belirler' },
    { subject_id: matematik, grade: 9, unit_number: 2, main_topic: 'Kümeler', sub_topic: 'Küme İşlemleri', learning_outcome: 'Kümelerde birleşim, kesişim ve fark işlemlerini yapar' },
    { subject_id: matematik, grade: 9, unit_number: 3, main_topic: 'Denklemler', sub_topic: 'İkinci Dereceden Denklemler', learning_outcome: 'İkinci dereceden denklemleri çözer' },
    { subject_id: matematik, grade: 9, unit_number: 4, main_topic: 'Üçgenler', sub_topic: 'Üçgende Açı-Kenar Bağıntıları', learning_outcome: 'Üçgende açı-kenar bağıntılarını kullanır' },
    { subject_id: matematik, grade: 9, unit_number: 5, main_topic: 'Veri Analizi', sub_topic: 'Merkezi Eğilim Ölçüleri', learning_outcome: 'Aritmetik ortalama, medyan, mod hesaplar' },

    // FİZİK 9. Sınıf
    { subject_id: fizik, grade: 9, unit_number: 1, main_topic: 'Fizik Bilimine Giriş', sub_topic: 'Fizik ve Hayat', learning_outcome: 'Fiziğin uğraş alanlarını açıklar' },
    { subject_id: fizik, grade: 9, unit_number: 2, main_topic: 'Madde ve Özkütle', sub_topic: 'Özkütle', learning_outcome: 'Özkütle kavramını açıklar ve hesaplar' },
    { subject_id: fizik, grade: 9, unit_number: 3, main_topic: 'Kuvvet ve Hareket', sub_topic: 'Newton Yasaları', learning_outcome: 'Newtonun hareket yasalarını açıklar' },
    { subject_id: fizik, grade: 9, unit_number: 4, main_topic: 'Enerji', sub_topic: 'Kinetik ve Potansiyel Enerji', learning_outcome: 'Enerji türlerini açıklar' },

    // KİMYA 9. Sınıf
    { subject_id: kimya, grade: 9, unit_number: 1, main_topic: 'Kimya Bilimi', sub_topic: 'Kimya ve Günlük Hayat', learning_outcome: 'Kimyanın uğraş alanlarını açıklar' },
    { subject_id: kimya, grade: 9, unit_number: 2, main_topic: 'Atom ve Periyodik Sistem', sub_topic: 'Atom Modelleri', learning_outcome: 'Atom modellerini karşılaştırır' },
    { subject_id: kimya, grade: 9, unit_number: 2, main_topic: 'Atom ve Periyodik Sistem', sub_topic: 'Periyodik Tablo', learning_outcome: 'Periyodik tablodaki düzenliliği açıklar' },
    { subject_id: kimya, grade: 9, unit_number: 3, main_topic: 'Kimyasal Türler Arası Etkileşimler', sub_topic: 'Kimyasal Bağlar', learning_outcome: 'Kimyasal bağ türlerini açıklar' },

    // BİYOLOJİ 9. Sınıf
    { subject_id: biyoloji, grade: 9, unit_number: 1, main_topic: 'Yaşam Bilimi Biyoloji', sub_topic: 'Biyolojinin Temel İlkeleri', learning_outcome: 'Biyolojinin ilkelerini açıklar' },
    { subject_id: biyoloji, grade: 9, unit_number: 2, main_topic: 'Hücre', sub_topic: 'Hücre Zarı', learning_outcome: 'Hücre zarının yapısını ve görevlerini açıklar' },
    { subject_id: biyoloji, grade: 9, unit_number: 2, main_topic: 'Hücre', sub_topic: 'Hücre Organelleri', learning_outcome: 'Hücre organellerini tanır' },
    { subject_id: biyoloji, grade: 9, unit_number: 3, main_topic: 'Canlıların Temel Bileşenleri', sub_topic: 'Organik Bileşikler', learning_outcome: 'Karbonhidrat, yağ, protein, nükleik asitleri açıklar' },

    // 10-12. Sınıf (Özet)
    { subject_id: matematik, grade: 10, unit_number: 1, main_topic: 'Fonksiyonlar', sub_topic: 'Fonksiyon Kavramı', learning_outcome: 'Fonksiyon kavramını tanır' },
    { subject_id: matematik, grade: 10, unit_number: 2, main_topic: 'Polinomlar', sub_topic: 'Polinom Kavramı', learning_outcome: 'Polinom kavramını açıklar' },
    { subject_id: matematik, grade: 10, unit_number: 3, main_topic: 'İkinci Dereceden Denklemler', sub_topic: 'Kök Bulma', learning_outcome: 'İkinci derece denklemin köklerini bulur' },

    { subject_id: matematik, grade: 11, unit_number: 1, main_topic: 'Trigonometri', sub_topic: 'Trigonometrik Fonksiyonlar', learning_outcome: 'Trigonometrik fonksiyonları tanır' },
    { subject_id: matematik, grade: 11, unit_number: 2, main_topic: 'Analitik Geometri', sub_topic: 'Doğru Denklemi', learning_outcome: 'Doğru denklemini yazar' },
    { subject_id: matematik, grade: 11, unit_number: 3, main_topic: 'Diziler', sub_topic: 'Aritmetik Dizi', learning_outcome: 'Aritmetik dizinin genel terimini bulur' },

    { subject_id: matematik, grade: 12, unit_number: 1, main_topic: 'Türev', sub_topic: 'Türev Kavramı', learning_outcome: 'Türev kavramını açıklar' },
    { subject_id: matematik, grade: 12, unit_number: 1, main_topic: 'Türev', sub_topic: 'Türev Kuralları', learning_outcome: 'Türev kurallarını uygular' },
    { subject_id: matematik, grade: 12, unit_number: 2, main_topic: 'İntegral', sub_topic: 'Belirsiz İntegral', learning_outcome: 'Belirsiz integral hesaplar' },
    { subject_id: matematik, grade: 12, unit_number: 2, main_topic: 'İntegral', sub_topic: 'Belirli İntegral', learning_outcome: 'Belirli integral hesaplar' },
    { subject_id: matematik, grade: 12, unit_number: 3, main_topic: 'Olasılık', sub_topic: 'Koşullu Olasılık', learning_outcome: 'Koşullu olasılık hesaplar' },

    { subject_id: fizik, grade: 10, unit_number: 1, main_topic: 'Elektrik ve Manyetizma', sub_topic: 'Elektrik Akımı', learning_outcome: 'Elektrik akımını açıklar' },
    { subject_id: fizik, grade: 11, unit_number: 1, main_topic: 'Kuvvet ve Hareket', sub_topic: 'Düzgün Çembersel Hareket', learning_outcome: 'Düzgün çembersel hareketi açıklar' },
    { subject_id: fizik, grade: 12, unit_number: 1, main_topic: 'Modern Fizik', sub_topic: 'Atom Fiziği', learning_outcome: 'Atom modellerini açıklar' },

    { subject_id: kimya, grade: 10, unit_number: 1, main_topic: 'Asitler ve Bazlar', sub_topic: 'pH Kavramı', learning_outcome: 'pH kavramını açıklar' },
    { subject_id: kimya, grade: 11, unit_number: 1, main_topic: 'Kimyasal Tepkimeler', sub_topic: 'Tepkime Hızı', learning_outcome: 'Tepkime hızını etkileyen faktörleri açıklar' },
    { subject_id: kimya, grade: 12, unit_number: 1, main_topic: 'Organik Kimya', sub_topic: 'Hidrokarbonlar', learning_outcome: 'Hidrokarbonları sınıflandırır' },

    { subject_id: biyoloji, grade: 10, unit_number: 1, main_topic: 'Hücre Bölünmesi', sub_topic: 'Mitoz', learning_outcome: 'Mitoz bölünmeyi açıklar' },
    { subject_id: biyoloji, grade: 10, unit_number: 1, main_topic: 'Hücre Bölünmesi', sub_topic: 'Mayoz', learning_outcome: 'Mayoz bölünmeyi açıklar' },
    { subject_id: biyoloji, grade: 11, unit_number: 1, main_topic: 'İnsan Fizyolojisi', sub_topic: 'Sinir Sistemi', learning_outcome: 'Sinir sisteminin çalışmasını açıklar' },
    { subject_id: biyoloji, grade: 12, unit_number: 1, main_topic: 'Canlılar ve Çevre', sub_topic: 'Ekosistem', learning_outcome: 'Ekosistem kavramını açıklar' },

    { subject_id: tarih, grade: 12, unit_number: 1, main_topic: 'Türk İnkılabı', sub_topic: 'Cumhuriyetin İlanı', learning_outcome: 'Cumhuriyetin ilanını değerlendirir' },
    { subject_id: cografya, grade: 12, unit_number: 1, main_topic: 'Beşeri Coğrafya', sub_topic: 'Nüfus', learning_outcome: 'Nüfus dağılışını açıklar' },
    { subject_id: felsefe, grade: 12, unit_number: 1, main_topic: 'Bilgi Felsefesi', sub_topic: 'Bilgi Türleri', learning_outcome: 'Bilgi türlerini açıklar' },
  ].filter(t => t.subject_id) // null subject_id olanları filtrele

  console.log(`\n📝 Toplam ${allTopics.length} kazanım eklenecek...\n`)

  // Toplu ekle
  let successCount = 0
  const batchSize = 50

  for (let i = 0; i < allTopics.length; i += batchSize) {
    const batch = allTopics.slice(i, i + batchSize)
    
    const res = await fetch(`${SUPABASE_URL}/rest/v1/topics`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(batch)
    })

    if (res.ok) {
      successCount += batch.length
      console.log(`✅ ${successCount}/${allTopics.length} kazanım eklendi`)
    } else {
      const error = await res.text()
      console.log(`⚠️ Batch hatası: ${error}`)
      
      // Tek tek dene
      for (const topic of batch) {
        const singleRes = await fetch(`${SUPABASE_URL}/rest/v1/topics`, {
          method: 'POST',
          headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(topic)
        })
        if (singleRes.ok) successCount++
      }
    }
  }

  console.log(`\n🎉 Toplam ${successCount} kazanım başarıyla eklendi!`)

  // Kontrol
  const countRes = await fetch(`${SUPABASE_URL}/rest/v1/topics?select=id`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`
    }
  })
  const countData = await countRes.json()
  console.log(`📊 Veritabanındaki toplam kazanım: ${countData.length}`)
}

runSQL()


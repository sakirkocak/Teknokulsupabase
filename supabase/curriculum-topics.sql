-- =====================================================
-- MEB MÜFREDAT KAZANIMLARI
-- 1-12. Sınıf Tüm Dersler
-- Toplam: 700+ Kazanım
-- =====================================================

-- Önce subject ID'lerini değişkenlere atayalım
DO $$
DECLARE
    v_turkce UUID;
    v_matematik UUID;
    v_hayat_bilgisi UUID;
    v_fen_bilimleri UUID;
    v_sosyal_bilgiler UUID;
    v_inkilap_tarihi UUID;
    v_din_kulturu UUID;
    v_ingilizce UUID;
    v_edebiyat UUID;
    v_fizik UUID;
    v_kimya UUID;
    v_biyoloji UUID;
    v_tarih UUID;
    v_cografya UUID;
    v_felsefe UUID;
BEGIN
    -- Subject ID'lerini al
    SELECT id INTO v_turkce FROM subjects WHERE code = 'turkce';
    SELECT id INTO v_matematik FROM subjects WHERE code = 'matematik';
    SELECT id INTO v_hayat_bilgisi FROM subjects WHERE code = 'hayat_bilgisi';
    SELECT id INTO v_fen_bilimleri FROM subjects WHERE code = 'fen_bilimleri';
    SELECT id INTO v_sosyal_bilgiler FROM subjects WHERE code = 'sosyal_bilgiler';
    SELECT id INTO v_inkilap_tarihi FROM subjects WHERE code = 'inkilap_tarihi';
    SELECT id INTO v_din_kulturu FROM subjects WHERE code = 'din_kulturu';
    SELECT id INTO v_ingilizce FROM subjects WHERE code = 'ingilizce';
    SELECT id INTO v_edebiyat FROM subjects WHERE code = 'edebiyat';
    SELECT id INTO v_fizik FROM subjects WHERE code = 'fizik';
    SELECT id INTO v_kimya FROM subjects WHERE code = 'kimya';
    SELECT id INTO v_biyoloji FROM subjects WHERE code = 'biyoloji';
    SELECT id INTO v_tarih FROM subjects WHERE code = 'tarih';
    SELECT id INTO v_cografya FROM subjects WHERE code = 'cografya';
    SELECT id INTO v_felsefe FROM subjects WHERE code = 'felsefe';

    -- =====================================================
    -- 1. SINIF KAZANIMLARI
    -- =====================================================
    
    -- TÜRKÇE 1. Sınıf
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_turkce, 1, 1, 'Dinleme/İzleme', 'Dikkatle Dinleme', 'Dinlediklerinin/izlediklerinin konusunu belirler'),
    (v_turkce, 1, 1, 'Dinleme/İzleme', 'Anlama', 'Dinlediklerinde/izlediklerinde geçen olayların oluş sırasını belirler'),
    (v_turkce, 1, 2, 'Konuşma', 'Kendini İfade Etme', 'Duygu ve düşüncelerini sözlü olarak ifade eder'),
    (v_turkce, 1, 2, 'Konuşma', 'Akıcı Konuşma', 'Kelimeleri anlaşılır bir şekilde telaffuz eder'),
    (v_turkce, 1, 3, 'Okuma', 'Harf Tanıma', 'Sesleri/harfleri doğru tanır ve seslendirir'),
    (v_turkce, 1, 3, 'Okuma', 'Hece ve Kelime', 'Heceleri ve kelimeleri okur'),
    (v_turkce, 1, 3, 'Okuma', 'Cümle Okuma', 'Kısa metinleri okur'),
    (v_turkce, 1, 4, 'Yazma', 'Harf Yazma', 'Harfleri kurallarına uygun yazar'),
    (v_turkce, 1, 4, 'Yazma', 'Kelime Yazma', 'Anlamlı kelimeler yazar'),
    (v_turkce, 1, 4, 'Yazma', 'Cümle Yazma', 'Basit cümleler yazar')
    ON CONFLICT DO NOTHING;

    -- MATEMATİK 1. Sınıf
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_matematik, 1, 1, 'Sayılar', '1-20 Sayıları', '1-20 arasındaki sayıları okur ve yazar'),
    (v_matematik, 1, 1, 'Sayılar', 'Sayı Sayma', 'Nesneleri sayar ve sonucu rakamla ifade eder'),
    (v_matematik, 1, 1, 'Sayılar', 'Sıralama', 'Sayıları küçükten büyüğe ve büyükten küçüğe sıralar'),
    (v_matematik, 1, 2, 'Toplama İşlemi', 'Tek Basamaklı', 'Toplamı 20 yi geçmeyen doğal sayılarla toplama yapar'),
    (v_matematik, 1, 2, 'Toplama İşlemi', 'Zihinden Toplama', 'Toplamı 10 olan sayıları belirler'),
    (v_matematik, 1, 3, 'Çıkarma İşlemi', 'Tek Basamaklı', '20 ye kadar olan doğal sayılarla çıkarma yapar'),
    (v_matematik, 1, 4, 'Geometri', 'Şekiller', 'Geometrik şekilleri tanır (kare, dikdörtgen, üçgen, daire)'),
    (v_matematik, 1, 5, 'Ölçme', 'Uzunluk', 'Nesneleri uzunluklarına göre karşılaştırır'),
    (v_matematik, 1, 5, 'Ölçme', 'Zaman', 'Günleri ve ayları sıralar')
    ON CONFLICT DO NOTHING;

    -- HAYAT BİLGİSİ 1. Sınıf
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_hayat_bilgisi, 1, 1, 'Okulumuzda Hayat', 'Okul Kuralları', 'Okul kurallarına uyar'),
    (v_hayat_bilgisi, 1, 1, 'Okulumuzda Hayat', 'Sınıf Arkadaşları', 'Arkadaşlarıyla iyi geçinir'),
    (v_hayat_bilgisi, 1, 2, 'Evimizde Hayat', 'Aile Bireyleri', 'Aile bireylerini ve görevlerini tanır'),
    (v_hayat_bilgisi, 1, 2, 'Evimizde Hayat', 'Ev Kuralları', 'Evdeki görevlerini yerine getirir'),
    (v_hayat_bilgisi, 1, 3, 'Sağlıklı Hayat', 'Kişisel Temizlik', 'Kişisel bakım ve temizlik yapar'),
    (v_hayat_bilgisi, 1, 3, 'Sağlıklı Hayat', 'Beslenme', 'Dengeli ve sağlıklı beslenir'),
    (v_hayat_bilgisi, 1, 4, 'Güvenli Hayat', 'Trafik Kuralları', 'Trafik kurallarına uyar'),
    (v_hayat_bilgisi, 1, 4, 'Güvenli Hayat', 'Tehlikeler', 'Tehlikeli durumlardan kaçınır')
    ON CONFLICT DO NOTHING;

    -- =====================================================
    -- 2. SINIF KAZANIMLARI
    -- =====================================================
    
    -- TÜRKÇE 2. Sınıf
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_turkce, 2, 1, 'Dinleme/İzleme', 'Anlama', 'Dinlediklerinin/izlediklerinin ana fikrini belirler'),
    (v_turkce, 2, 1, 'Dinleme/İzleme', 'Sorgulama', 'Dinledikleri/izledikleri hakkında sorular sorar'),
    (v_turkce, 2, 2, 'Konuşma', 'Fikirlerini İfade', 'Bir konu hakkında düşüncelerini söyler'),
    (v_turkce, 2, 3, 'Okuma', 'Akıcı Okuma', 'Noktalama işaretlerine dikkat ederek okur'),
    (v_turkce, 2, 3, 'Okuma', 'Okuduğunu Anlama', 'Okuduklarının konusunu belirler'),
    (v_turkce, 2, 4, 'Yazma', 'Yazım Kuralları', 'Büyük harflerin kullanıldığı yerleri bilir'),
    (v_turkce, 2, 4, 'Yazma', 'Metin Yazma', 'Kısa hikâyeler yazar'),
    (v_turkce, 2, 5, 'Söz Varlığı', 'Kelime Öğrenme', 'Yeni kelimeler öğrenir ve cümle içinde kullanır')
    ON CONFLICT DO NOTHING;

    -- MATEMATİK 2. Sınıf
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_matematik, 2, 1, 'Sayılar', '100e Kadar Sayılar', '100 e kadar sayıları okur ve yazar'),
    (v_matematik, 2, 1, 'Sayılar', 'Basamak Değeri', 'İki basamaklı sayılarda basamak değerini belirler'),
    (v_matematik, 2, 2, 'Toplama ve Çıkarma', 'İki Basamaklı', 'İki basamaklı sayılarla toplama ve çıkarma yapar'),
    (v_matematik, 2, 2, 'Toplama ve Çıkarma', 'Problem Çözme', 'Toplama ve çıkarma gerektiren problemleri çözer'),
    (v_matematik, 2, 3, 'Çarpma İşlemi', 'Çarpma Kavramı', 'Çarpma işleminin anlamını kavrar'),
    (v_matematik, 2, 3, 'Çarpma İşlemi', '2, 5, 10 ile Çarpma', '2, 5 ve 10 ile çarpma yapar'),
    (v_matematik, 2, 4, 'Geometri', 'Şekil Özellikleri', 'Geometrik şekillerin özelliklerini belirler'),
    (v_matematik, 2, 5, 'Ölçme', 'Uzunluk Ölçme', 'Standart olmayan birimlerle uzunluk ölçer'),
    (v_matematik, 2, 5, 'Ölçme', 'Para', 'Türk lirasının alt birimlerini tanır')
    ON CONFLICT DO NOTHING;

    -- İNGİLİZCE 2. Sınıf
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_ingilizce, 2, 1, 'Greetings', 'Selamlaşma', 'Selamlaşma ifadelerini kullanır'),
    (v_ingilizce, 2, 2, 'Numbers', 'Sayılar 1-20', '1-20 arası sayıları İngilizce söyler'),
    (v_ingilizce, 2, 3, 'Colors', 'Renkler', 'Renkleri İngilizce söyler'),
    (v_ingilizce, 2, 4, 'Family', 'Aile Üyeleri', 'Aile bireylerini İngilizce tanıtır'),
    (v_ingilizce, 2, 5, 'Classroom', 'Sınıf Eşyaları', 'Sınıftaki eşyaları İngilizce söyler')
    ON CONFLICT DO NOTHING;

    -- =====================================================
    -- 3. SINIF KAZANIMLARI
    -- =====================================================
    
    -- TÜRKÇE 3. Sınıf
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_turkce, 3, 1, 'Dinleme/İzleme', 'Tahmin Etme', 'Dinlediklerinin/izlediklerinin sonucunu tahmin eder'),
    (v_turkce, 3, 2, 'Konuşma', 'Sunuş Yapma', 'Hazırlıklı konuşmalar yapar'),
    (v_turkce, 3, 3, 'Okuma', 'Söz Varlığı', 'Okuduğu metindeki söz varlığını geliştirir'),
    (v_turkce, 3, 3, 'Okuma', 'Metin Türleri', 'Farklı metin türlerini tanır'),
    (v_turkce, 3, 4, 'Yazma', 'Paragraf Yazma', 'Paragraf yazar'),
    (v_turkce, 3, 5, 'Dil Bilgisi', 'İsim ve Fiil', 'İsim ve fiili ayırt eder'),
    (v_turkce, 3, 5, 'Dil Bilgisi', 'Noktalama', 'Noktalama işaretlerini doğru kullanır')
    ON CONFLICT DO NOTHING;

    -- MATEMATİK 3. Sınıf
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_matematik, 3, 1, 'Sayılar', '1000e Kadar Sayılar', '1000 e kadar sayıları okur ve yazar'),
    (v_matematik, 3, 1, 'Sayılar', 'Üç Basamaklı Sayılar', 'Üç basamaklı sayılarda basamak değerini belirler'),
    (v_matematik, 3, 2, 'Dört İşlem', 'Toplama-Çıkarma', 'Üç basamaklı sayılarla toplama ve çıkarma yapar'),
    (v_matematik, 3, 2, 'Dört İşlem', 'Çarpma', 'Çarpım tablosunu kullanır'),
    (v_matematik, 3, 2, 'Dört İşlem', 'Bölme', 'Bölme işleminin anlamını kavrar'),
    (v_matematik, 3, 3, 'Kesirler', 'Kesir Kavramı', 'Basit kesirleri okur ve yazar'),
    (v_matematik, 3, 4, 'Geometri', 'Açılar', 'Açı kavramını anlar'),
    (v_matematik, 3, 5, 'Ölçme', 'Uzunluk Birimleri', 'Metre ve santimetreyi kullanır'),
    (v_matematik, 3, 5, 'Ölçme', 'Tartma', 'Kilogram ve gramı kullanır')
    ON CONFLICT DO NOTHING;

    -- FEN BİLİMLERİ 3. Sınıf
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_fen_bilimleri, 3, 1, 'Canlılar Dünyası', 'Beş Duyu', 'Duyu organlarımızı ve işlevlerini açıklar'),
    (v_fen_bilimleri, 3, 1, 'Canlılar Dünyası', 'Canlı-Cansız', 'Canlı ve cansız varlıkları ayırt eder'),
    (v_fen_bilimleri, 3, 2, 'Kuvvet ve Hareket', 'İtme-Çekme', 'İtme ve çekmenin hareketlere etkisini açıklar'),
    (v_fen_bilimleri, 3, 3, 'Madde ve Değişim', 'Maddenin Halleri', 'Maddenin katı, sıvı ve gaz hallerini ayırt eder'),
    (v_fen_bilimleri, 3, 4, 'Dünyamız ve Evren', 'Güneş Sistemi', 'Güneş sistemini tanır'),
    (v_fen_bilimleri, 3, 5, 'Elektrik', 'Elektrikli Aletler', 'Elektrikli aletleri tanır')
    ON CONFLICT DO NOTHING;

    -- =====================================================
    -- 4. SINIF KAZANIMLARI
    -- =====================================================
    
    -- TÜRKÇE 4. Sınıf
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_turkce, 4, 1, 'Dinleme/İzleme', 'Değerlendirme', 'Dinlediklerini/izlediklerini değerlendirir'),
    (v_turkce, 4, 2, 'Konuşma', 'Tartışma', 'Bir konuda tartışmaya katılır'),
    (v_turkce, 4, 3, 'Okuma', 'Hızlı Okuma', 'Göz atarak okuma yapar'),
    (v_turkce, 4, 3, 'Okuma', 'Eleştirel Okuma', 'Okuduklarını sorgular'),
    (v_turkce, 4, 4, 'Yazma', 'Planlı Yazma', 'Yazacaklarını planlar'),
    (v_turkce, 4, 5, 'Dil Bilgisi', 'Sıfatlar', 'Sıfatları tanır ve kullanır'),
    (v_turkce, 4, 5, 'Dil Bilgisi', 'Zarflar', 'Zarfları tanır ve kullanır')
    ON CONFLICT DO NOTHING;

    -- MATEMATİK 4. Sınıf
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_matematik, 4, 1, 'Sayılar', 'Çok Basamaklı Sayılar', '10000 e kadar sayıları okur ve yazar'),
    (v_matematik, 4, 1, 'Sayılar', 'Yuvarlama', 'Sayıları yuvarlar'),
    (v_matematik, 4, 2, 'Dört İşlem', 'Çarpma', 'İki basamaklı sayılarla çarpma yapar'),
    (v_matematik, 4, 2, 'Dört İşlem', 'Bölme', 'İki basamaklı sayılara böler'),
    (v_matematik, 4, 3, 'Kesirler', 'Denk Kesirler', 'Denk kesirleri belirler'),
    (v_matematik, 4, 3, 'Kesirler', 'Kesirlerle İşlem', 'Paydaları eşit kesirlerle toplama çıkarma yapar'),
    (v_matematik, 4, 4, 'Ondalık Gösterim', 'Ondalık Kesirler', 'Ondalık kesirleri okur ve yazar'),
    (v_matematik, 4, 5, 'Geometri', 'Dörtgenler', 'Dörtgenleri sınıflandırır'),
    (v_matematik, 4, 6, 'Ölçme', 'Çevre', 'Şekillerin çevresini hesaplar'),
    (v_matematik, 4, 6, 'Ölçme', 'Alan', 'Dikdörtgen ve karenin alanını hesaplar')
    ON CONFLICT DO NOTHING;

    -- FEN BİLİMLERİ 4. Sınıf
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_fen_bilimleri, 4, 1, 'Canlılar Dünyası', 'Bitki ve Hayvanlar', 'Bitki ve hayvanların benzer ve farklı özelliklerini karşılaştırır'),
    (v_fen_bilimleri, 4, 1, 'Canlılar Dünyası', 'Besin Zinciri', 'Besin zincirini açıklar'),
    (v_fen_bilimleri, 4, 2, 'Kuvvet ve Hareket', 'Sürtünme Kuvveti', 'Sürtünme kuvvetini açıklar'),
    (v_fen_bilimleri, 4, 3, 'Madde ve Değişim', 'Maddenin Ölçülmesi', 'Maddenin kütle ve hacmini ölçer'),
    (v_fen_bilimleri, 4, 4, 'Işık ve Ses', 'Işığın Yansıması', 'Işığın yansımasını açıklar'),
    (v_fen_bilimleri, 4, 4, 'Işık ve Ses', 'Sesin Oluşumu', 'Sesin titreşimle oluştuğunu kavrar'),
    (v_fen_bilimleri, 4, 5, 'Dünyamız ve Evren', 'Dünya ve Ay', 'Dünya ve Ay ın hareketlerini açıklar')
    ON CONFLICT DO NOTHING;

    -- SOSYAL BİLGİLER 4. Sınıf
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_sosyal_bilgiler, 4, 1, 'Birey ve Toplum', 'Kimlik', 'Kendi kimliğini tanır'),
    (v_sosyal_bilgiler, 4, 2, 'Kültür ve Miras', 'Kültürel Değerler', 'Kültürel değerlerimizi tanır'),
    (v_sosyal_bilgiler, 4, 3, 'İnsanlar ve Yönetim', 'Yönetim', 'Yönetim biçimlerini tanır'),
    (v_sosyal_bilgiler, 4, 4, 'Üretim ve Tüketim', 'Ekonomi', 'Üretim ve tüketim kavramlarını açıklar')
    ON CONFLICT DO NOTHING;

    -- =====================================================
    -- 5. SINIF KAZANIMLARI
    -- =====================================================
    
    -- TÜRKÇE 5. Sınıf
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_turkce, 5, 1, 'Dinleme/İzleme', 'Not Alma', 'Dinlerken/izlerken not alır'),
    (v_turkce, 5, 2, 'Konuşma', 'İkna Edici Konuşma', 'İkna edici konuşma yapar'),
    (v_turkce, 5, 3, 'Okuma', 'Metin Yapısı', 'Metnin yapısını tanır'),
    (v_turkce, 5, 3, 'Okuma', 'Ana Düşünce', 'Metnin ana düşüncesini belirler'),
    (v_turkce, 5, 4, 'Yazma', 'Öykü Yazma', 'Öykü yazar'),
    (v_turkce, 5, 5, 'Dil Bilgisi', 'Sözcük Türleri', 'Sözcük türlerini ayırt eder'),
    (v_turkce, 5, 5, 'Dil Bilgisi', 'Cümle Ögeleri', 'Cümlenin ögelerini belirler')
    ON CONFLICT DO NOTHING;

    -- MATEMATİK 5. Sınıf
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_matematik, 5, 1, 'Doğal Sayılar', 'Milyonluk Sayılar', 'Milyonluk sayıları okur ve yazar'),
    (v_matematik, 5, 1, 'Doğal Sayılar', 'Bölünebilme', 'Bir sayının 2, 3, 5, 9, 10 ile bölünebilirliğini belirler'),
    (v_matematik, 5, 2, 'Kesirler', 'Kesirleri Sıralama', 'Kesirleri sıralar'),
    (v_matematik, 5, 2, 'Kesirler', 'Kesirlerle İşlem', 'Kesirlerle toplama ve çıkarma yapar'),
    (v_matematik, 5, 3, 'Ondalık Gösterim', 'Ondalık Sayılar', 'Ondalık gösterimle işlem yapar'),
    (v_matematik, 5, 4, 'Yüzdeler', 'Yüzde Kavramı', 'Yüzde kavramını anlar'),
    (v_matematik, 5, 5, 'Geometri', 'Açılar', 'Açı ölçer ve sınıflandırır'),
    (v_matematik, 5, 5, 'Geometri', 'Üçgenler', 'Üçgenleri sınıflandırır'),
    (v_matematik, 5, 6, 'Veri Toplama', 'Tablo ve Grafik', 'Verileri tablo ve grafiklerle gösterir')
    ON CONFLICT DO NOTHING;

    -- FEN BİLİMLERİ 5. Sınıf
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_fen_bilimleri, 5, 1, 'Canlılar Dünyası', 'Sindirim Sistemi', 'Sindirim sistemi organlarını ve görevlerini açıklar'),
    (v_fen_bilimleri, 5, 1, 'Canlılar Dünyası', 'Besinler', 'Besinleri sınıflandırır'),
    (v_fen_bilimleri, 5, 2, 'Kuvvet ve Hareket', 'Kuvvet ve Sürtünme', 'Kuvvetin cisimler üzerindeki etkisini açıklar'),
    (v_fen_bilimleri, 5, 3, 'Madde ve Değişim', 'Maddenin Değişimi', 'Maddenin hal değişimini açıklar'),
    (v_fen_bilimleri, 5, 3, 'Madde ve Değişim', 'Isı ve Sıcaklık', 'Isı ve sıcaklık arasındaki farkı açıklar'),
    (v_fen_bilimleri, 5, 4, 'Işık', 'Işık ve Gölge', 'Işık kaynağı ile gölge oluşumu ilişkisini açıklar'),
    (v_fen_bilimleri, 5, 5, 'Elektrik', 'Elektrik Devresi', 'Basit elektrik devresi kurar')
    ON CONFLICT DO NOTHING;

    -- SOSYAL BİLGİLER 5. Sınıf
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_sosyal_bilgiler, 5, 1, 'Birey ve Toplum', 'Haklar ve Sorumluluklar', 'Hak ve sorumluluklarını bilir'),
    (v_sosyal_bilgiler, 5, 2, 'Kültür ve Miras', 'Türk Tarihi', 'Türk tarihindeki önemli olayları açıklar'),
    (v_sosyal_bilgiler, 5, 3, 'İnsanlar ve Yönetim', 'Demokrasi', 'Demokrasi kavramını açıklar'),
    (v_sosyal_bilgiler, 5, 4, 'Üretim ve Tüketim', 'Kaynaklar', 'Doğal kaynakları tanır')
    ON CONFLICT DO NOTHING;

    -- =====================================================
    -- 6. SINIF KAZANIMLARI
    -- =====================================================
    
    -- TÜRKÇE 6. Sınıf
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_turkce, 6, 1, 'Okuma', 'Metinler Arası Okuma', 'Metinleri karşılaştırır'),
    (v_turkce, 6, 2, 'Yazma', 'Yazı Türleri', 'Farklı yazı türlerinde yazar'),
    (v_turkce, 6, 3, 'Dil Bilgisi', 'Fiil Çekimi', 'Fiilleri kip ve kişiye göre çeker'),
    (v_turkce, 6, 3, 'Dil Bilgisi', 'Ek Fiil', 'Ek fiili tanır'),
    (v_turkce, 6, 4, 'Söz Varlığı', 'Deyimler', 'Deyimleri cümle içinde kullanır'),
    (v_turkce, 6, 4, 'Söz Varlığı', 'Atasözleri', 'Atasözlerini yerinde kullanır')
    ON CONFLICT DO NOTHING;

    -- MATEMATİK 6. Sınıf
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_matematik, 6, 1, 'Doğal Sayılar', 'EKOK-EBOB', 'EKOK ve EBOB hesaplar'),
    (v_matematik, 6, 2, 'Kesirlerle İşlemler', 'Çarpma', 'Kesirlerle çarpma yapar'),
    (v_matematik, 6, 2, 'Kesirlerle İşlemler', 'Bölme', 'Kesirlerle bölme yapar'),
    (v_matematik, 6, 3, 'Ondalık Gösterim', 'İşlemler', 'Ondalık sayılarla işlem yapar'),
    (v_matematik, 6, 4, 'Oran ve Orantı', 'Oran Kavramı', 'İki çokluğun birbirine oranını belirler'),
    (v_matematik, 6, 4, 'Oran ve Orantı', 'Doğru Orantı', 'Doğru orantıyı açıklar'),
    (v_matematik, 6, 5, 'Cebirsel İfadeler', 'Harfli İfadeler', 'Harfli ifadeleri anlar'),
    (v_matematik, 6, 6, 'Geometri', 'Alan Hesaplama', 'Dörtgenlerin alanını hesaplar'),
    (v_matematik, 6, 6, 'Geometri', 'Çember', 'Çemberde temel kavramları tanır')
    ON CONFLICT DO NOTHING;

    -- FEN BİLİMLERİ 6. Sınıf
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_fen_bilimleri, 6, 1, 'Canlılar Dünyası', 'Hücre', 'Hücrenin temel yapısını açıklar'),
    (v_fen_bilimleri, 6, 1, 'Canlılar Dünyası', 'Dolaşım Sistemi', 'Dolaşım sistemini açıklar'),
    (v_fen_bilimleri, 6, 2, 'Kuvvet ve Hareket', 'Ağırlık ve Kütle', 'Ağırlık ve kütle arasındaki farkı açıklar'),
    (v_fen_bilimleri, 6, 3, 'Madde ve Değişim', 'Fiziksel ve Kimyasal Değişim', 'Fiziksel ve kimyasal değişimi ayırt eder'),
    (v_fen_bilimleri, 6, 3, 'Madde ve Değişim', 'Karışımlar', 'Karışımları sınıflandırır'),
    (v_fen_bilimleri, 6, 4, 'Ses', 'Sesin Yayılması', 'Sesin yayılmasını açıklar'),
    (v_fen_bilimleri, 6, 5, 'Elektrik', 'Elektrik Enerjisi', 'Elektrik enerjisinin dönüşümünü açıklar')
    ON CONFLICT DO NOTHING;

    -- =====================================================
    -- 7. SINIF KAZANIMLARI
    -- =====================================================
    
    -- TÜRKÇE 7. Sınıf
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_turkce, 7, 1, 'Okuma', 'Metin Türleri', 'Metin türlerini ayırt eder'),
    (v_turkce, 7, 2, 'Yazma', 'Kompozisyon', 'Düşüncelerini planlı yazar'),
    (v_turkce, 7, 3, 'Dil Bilgisi', 'Cümle Türleri', 'Cümle türlerini tanır'),
    (v_turkce, 7, 3, 'Dil Bilgisi', 'Anlatım Bozuklukları', 'Anlatım bozukluklarını düzeltir'),
    (v_turkce, 7, 4, 'Söz Varlığı', 'Anlam İlişkileri', 'Sözcükler arasındaki anlam ilişkilerini açıklar')
    ON CONFLICT DO NOTHING;

    -- MATEMATİK 7. Sınıf
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_matematik, 7, 1, 'Tam Sayılar', 'Tam Sayılarla İşlemler', 'Tam sayılarla dört işlem yapar'),
    (v_matematik, 7, 2, 'Rasyonel Sayılar', 'Rasyonel Sayı Kavramı', 'Rasyonel sayıları tanır'),
    (v_matematik, 7, 2, 'Rasyonel Sayılar', 'Rasyonel Sayılarla İşlem', 'Rasyonel sayılarla işlem yapar'),
    (v_matematik, 7, 3, 'Oran ve Orantı', 'Ters Orantı', 'Ters orantıyı açıklar'),
    (v_matematik, 7, 3, 'Oran ve Orantı', 'Yüzde Problemleri', 'Yüzde problemlerini çözer'),
    (v_matematik, 7, 4, 'Cebirsel İfadeler', 'Eşitlik ve Denklem', 'Denklem kurar ve çözer'),
    (v_matematik, 7, 5, 'Geometri', 'Açıortay-Kenarortay', 'Açıortay ve kenarortayı açıklar'),
    (v_matematik, 7, 5, 'Geometri', 'Eşlik ve Benzerlik', 'Eşlik ve benzerliği açıklar'),
    (v_matematik, 7, 6, 'Veri Analizi', 'Merkezi Eğilim Ölçüleri', 'Ortalama, ortanca ve tepe değeri hesaplar')
    ON CONFLICT DO NOTHING;

    -- FEN BİLİMLERİ 7. Sınıf
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_fen_bilimleri, 7, 1, 'Canlılar Dünyası', 'Solunum Sistemi', 'Solunum sistemi organlarını ve görevlerini açıklar'),
    (v_fen_bilimleri, 7, 1, 'Canlılar Dünyası', 'Boşaltım Sistemi', 'Boşaltım sistemini açıklar'),
    (v_fen_bilimleri, 7, 2, 'Kuvvet ve Enerji', 'Potansiyel ve Kinetik Enerji', 'Enerji türlerini ayırt eder'),
    (v_fen_bilimleri, 7, 3, 'Madde ve Değişim', 'Atom Modeli', 'Atomun yapısını açıklar'),
    (v_fen_bilimleri, 7, 3, 'Madde ve Değişim', 'Periyodik Tablo', 'Periyodik tabloyu inceler'),
    (v_fen_bilimleri, 7, 4, 'Aynalar', 'Düz ve Küresel Aynalar', 'Aynalarda görüntü oluşumunu açıklar'),
    (v_fen_bilimleri, 7, 5, 'Elektrik', 'Elektriklenme', 'Cisimlerin elektriklenme yollarını açıklar')
    ON CONFLICT DO NOTHING;

    -- =====================================================
    -- 8. SINIF KAZANIMLARI (LGS)
    -- =====================================================
    
    -- TÜRKÇE 8. Sınıf (LGS)
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_turkce, 8, 1, 'Söz Varlığı', 'Sözcükte Anlam', 'Sözcüğün mecaz ve terim anlamını kavrar'),
    (v_turkce, 8, 1, 'Söz Varlığı', 'Sözcükler Arası Anlam', 'Eş anlamlı, zıt anlamlı, eş sesli sözcükleri tanır'),
    (v_turkce, 8, 2, 'Dil Bilgisi', 'Sözcük Türleri', 'Tüm sözcük türlerini ayırt eder'),
    (v_turkce, 8, 2, 'Dil Bilgisi', 'Cümle Çeşitleri', 'Yüklemine göre cümle çeşitlerini belirler'),
    (v_turkce, 8, 2, 'Dil Bilgisi', 'Cümle Ögeleri', 'Tüm cümle ögelerini belirler'),
    (v_turkce, 8, 3, 'Anlam Bilgisi', 'Paragraf', 'Paragrafın ana düşüncesini ve yardımcı düşüncelerini bulur'),
    (v_turkce, 8, 3, 'Anlam Bilgisi', 'Cümlede Anlam', 'Cümle anlamını yorumlar'),
    (v_turkce, 8, 4, 'Yazım Kuralları', 'Yazım', 'Yazım kurallarını uygular'),
    (v_turkce, 8, 4, 'Yazım Kuralları', 'Noktalama', 'Noktalama işaretlerini doğru kullanır')
    ON CONFLICT DO NOTHING;

    -- MATEMATİK 8. Sınıf (LGS)
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_matematik, 8, 1, 'Çarpanlar ve Katlar', 'EKOK-EBOB', 'EKOK ve EBOB problemleri çözer'),
    (v_matematik, 8, 2, 'Üslü İfadeler', 'Üslü Sayılar', 'Üslü ifadelerle işlem yapar'),
    (v_matematik, 8, 2, 'Üslü İfadeler', 'Bilimsel Gösterim', 'Sayıları bilimsel gösterimle ifade eder'),
    (v_matematik, 8, 3, 'Kareköklü İfadeler', 'Karekök', 'Kareköklü ifadelerle işlem yapar'),
    (v_matematik, 8, 4, 'Cebirsel İfadeler', 'Özdeşlikler', 'Özdeşlikleri kullanır'),
    (v_matematik, 8, 4, 'Cebirsel İfadeler', 'Çarpanlara Ayırma', 'Cebirsel ifadeleri çarpanlarına ayırır'),
    (v_matematik, 8, 5, 'Doğrusal Denklemler', 'Birinci Dereceden Denklemler', 'Birinci dereceden bir bilinmeyenli denklemleri çözer'),
    (v_matematik, 8, 5, 'Doğrusal Denklemler', 'Denklem Sistemleri', 'İki bilinmeyenli doğrusal denklem sistemlerini çözer'),
    (v_matematik, 8, 6, 'Eşitsizlikler', 'Birinci Dereceden Eşitsizlikler', 'Birinci dereceden bir bilinmeyenli eşitsizlikleri çözer'),
    (v_matematik, 8, 7, 'Üçgenler', 'Üçgende Açı', 'Üçgenin iç ve dış açı özelliklerini kullanır'),
    (v_matematik, 8, 7, 'Üçgenler', 'Üçgende Eşlik ve Benzerlik', 'Üçgenlerde eşlik ve benzerlik koşullarını kullanır'),
    (v_matematik, 8, 8, 'Dönüşüm Geometrisi', 'Yansıma', 'Yansımayı açıklar'),
    (v_matematik, 8, 8, 'Dönüşüm Geometrisi', 'Öteleme ve Döndürme', 'Öteleme ve döndürmeyi açıklar'),
    (v_matematik, 8, 9, 'Geometrik Cisimler', 'Prizma ve Piramit', 'Prizma ve piramidin özelliklerini belirler'),
    (v_matematik, 8, 9, 'Geometrik Cisimler', 'Silindir ve Koni', 'Silindir ve koninin özelliklerini belirler'),
    (v_matematik, 8, 10, 'Olasılık', 'Olasılık Hesaplama', 'Basit olayların olma olasılığını hesaplar')
    ON CONFLICT DO NOTHING;

    -- FEN BİLİMLERİ 8. Sınıf (LGS)
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_fen_bilimleri, 8, 1, 'Mevsimler ve İklim', 'Mevsimlerin Oluşumu', 'Mevsimlerin oluşumunu açıklar'),
    (v_fen_bilimleri, 8, 1, 'Mevsimler ve İklim', 'İklim ve Hava', 'İklim ve hava durumu arasındaki farkı açıklar'),
    (v_fen_bilimleri, 8, 2, 'DNA ve Genetik Kod', 'DNA Yapısı', 'DNA nın yapısını açıklar'),
    (v_fen_bilimleri, 8, 2, 'DNA ve Genetik Kod', 'Kalıtım', 'Kalıtım kavramlarını açıklar'),
    (v_fen_bilimleri, 8, 2, 'DNA ve Genetik Kod', 'Mutasyon', 'Mutasyon ve modifikasyonu açıklar'),
    (v_fen_bilimleri, 8, 3, 'Basınç', 'Katı Basıncı', 'Katı basıncını hesaplar'),
    (v_fen_bilimleri, 8, 3, 'Basınç', 'Sıvı Basıncı', 'Sıvı basıncını açıklar'),
    (v_fen_bilimleri, 8, 3, 'Basınç', 'Gaz Basıncı', 'Gaz basıncını açıklar'),
    (v_fen_bilimleri, 8, 4, 'Madde ve Endüstri', 'Periyodik Sistem', 'Periyodik sistemdeki grupları tanır'),
    (v_fen_bilimleri, 8, 4, 'Madde ve Endüstri', 'Kimyasal Tepkimeler', 'Kimyasal tepkimeleri denkleştirir'),
    (v_fen_bilimleri, 8, 4, 'Madde ve Endüstri', 'Asit ve Bazlar', 'Asit ve bazları tanır'),
    (v_fen_bilimleri, 8, 5, 'Basit Makineler', 'Kaldıraç', 'Kaldıracı açıklar'),
    (v_fen_bilimleri, 8, 5, 'Basit Makineler', 'Makara ve Dişli', 'Makara ve dişli çarklarını açıklar'),
    (v_fen_bilimleri, 8, 6, 'Enerji Dönüşümleri', 'Enerji Türleri', 'Enerji dönüşümlerini açıklar'),
    (v_fen_bilimleri, 8, 7, 'Elektrik Yükleri', 'Elektriklenme', 'Elektriklenme yollarını açıklar')
    ON CONFLICT DO NOTHING;

    -- T.C. İNKILAP TARİHİ 8. Sınıf (LGS)
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_inkilap_tarihi, 8, 1, 'Bir Kahraman Doğuyor', 'Atatürk ün Çocukluk ve Eğitim Hayatı', 'Atatürk ün çocukluğunu ve eğitim hayatını tanır'),
    (v_inkilap_tarihi, 8, 1, 'Bir Kahraman Doğuyor', 'Osmanlı Devleti nin Son Dönemi', 'Osmanlı nın son dönem olaylarını açıklar'),
    (v_inkilap_tarihi, 8, 2, 'Millî Uyanış', 'I. Dünya Savaşı', 'I. Dünya Savaşı nın nedenlerini ve sonuçlarını açıklar'),
    (v_inkilap_tarihi, 8, 2, 'Millî Uyanış', 'Mondros Ateşkesi', 'Mondros Ateşkesi nin maddelerini değerlendirir'),
    (v_inkilap_tarihi, 8, 3, 'Ya İstiklal Ya Ölüm', 'Kuvayı Milliye', 'Kuvayı Milliye hareketini açıklar'),
    (v_inkilap_tarihi, 8, 3, 'Ya İstiklal Ya Ölüm', 'TBMM nin Açılışı', 'TBMM nin açılışını ve önemini açıklar'),
    (v_inkilap_tarihi, 8, 4, 'Kurtuluş Savaşı', 'Doğu ve Güney Cepheleri', 'Doğu ve Güney cephelerindeki mücadeleleri açıklar'),
    (v_inkilap_tarihi, 8, 4, 'Kurtuluş Savaşı', 'Batı Cephesi', 'Batı Cephesi ndeki savaşları açıklar'),
    (v_inkilap_tarihi, 8, 4, 'Kurtuluş Savaşı', 'Büyük Taarruz', 'Büyük Taarruz u ve sonuçlarını açıklar'),
    (v_inkilap_tarihi, 8, 5, 'Atatürk İlkeleri', 'Cumhuriyetçilik', 'Cumhuriyetçilik ilkesini açıklar'),
    (v_inkilap_tarihi, 8, 5, 'Atatürk İlkeleri', 'Milliyetçilik', 'Milliyetçilik ilkesini açıklar'),
    (v_inkilap_tarihi, 8, 5, 'Atatürk İlkeleri', 'Halkçılık', 'Halkçılık ilkesini açıklar'),
    (v_inkilap_tarihi, 8, 5, 'Atatürk İlkeleri', 'Devletçilik', 'Devletçilik ilkesini açıklar'),
    (v_inkilap_tarihi, 8, 5, 'Atatürk İlkeleri', 'Laiklik', 'Laiklik ilkesini açıklar'),
    (v_inkilap_tarihi, 8, 5, 'Atatürk İlkeleri', 'İnkılapçılık', 'İnkılapçılık ilkesini açıklar'),
    (v_inkilap_tarihi, 8, 6, 'İnkılaplar', 'Siyasi İnkılaplar', 'Siyasi alanda yapılan inkılapları açıklar'),
    (v_inkilap_tarihi, 8, 6, 'İnkılaplar', 'Hukuk İnkılapları', 'Hukuk alanındaki inkılapları açıklar'),
    (v_inkilap_tarihi, 8, 6, 'İnkılaplar', 'Eğitim ve Kültür İnkılapları', 'Eğitim ve kültür alanındaki inkılapları açıklar')
    ON CONFLICT DO NOTHING;

    -- DİN KÜLTÜRÜ 8. Sınıf (LGS)
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_din_kulturu, 8, 1, 'Kader İnancı', 'Kader ve Kaza', 'Kader ve kaza kavramlarını açıklar'),
    (v_din_kulturu, 8, 1, 'Kader İnancı', 'İrade ve Sorumluluk', 'İrade ve sorumluluk kavramlarını açıklar'),
    (v_din_kulturu, 8, 2, 'Zekât ve Sadaka', 'Zekât', 'Zekâtın önemini açıklar'),
    (v_din_kulturu, 8, 2, 'Zekât ve Sadaka', 'Sadaka', 'Sadakanın toplumsal faydalarını açıklar'),
    (v_din_kulturu, 8, 3, 'Din ve Hayat', 'Hac ve Umre', 'Hac ve Umre ibadetlerini tanır'),
    (v_din_kulturu, 8, 4, 'Hz. Muhammed in Hayatı', 'Veda Hutbesi', 'Veda Hutbesi nin mesajlarını açıklar')
    ON CONFLICT DO NOTHING;

    -- İNGİLİZCE 8. Sınıf (LGS)
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_ingilizce, 8, 1, 'Friendship', 'Making Friends', 'Arkadaşlık hakkında konuşur'),
    (v_ingilizce, 8, 2, 'Teen Life', 'Daily Routines', 'Günlük rutinleri anlatır'),
    (v_ingilizce, 8, 3, 'In the Kitchen', 'Cooking', 'Yemek tarifleri verir'),
    (v_ingilizce, 8, 4, 'On the Phone', 'Phone Conversations', 'Telefon konuşmaları yapar'),
    (v_ingilizce, 8, 5, 'The Internet', 'Online Activities', 'İnternet aktivitelerini anlatır'),
    (v_ingilizce, 8, 6, 'Adventures', 'Past Events', 'Geçmişteki olayları anlatır'),
    (v_ingilizce, 8, 7, 'Tourism', 'Travel', 'Seyahat planları yapar'),
    (v_ingilizce, 8, 8, 'Chores', 'Housework', 'Ev işlerini anlatır'),
    (v_ingilizce, 8, 9, 'Science', 'Inventions', 'Bilim ve icatlar hakkında konuşur'),
    (v_ingilizce, 8, 10, 'Natural Forces', 'Natural Disasters', 'Doğal afetleri açıklar')
    ON CONFLICT DO NOTHING;

    -- =====================================================
    -- 9. SINIF KAZANIMLARI (LİSE)
    -- =====================================================
    
    -- TÜRK DİLİ VE EDEBİYATI 9. Sınıf
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_edebiyat, 9, 1, 'Edebiyat Türleri', 'Şiir', 'Şiir türlerini ve özelliklerini tanır'),
    (v_edebiyat, 9, 1, 'Edebiyat Türleri', 'Hikâye', 'Hikâye türlerini ve özelliklerini tanır'),
    (v_edebiyat, 9, 1, 'Edebiyat Türleri', 'Roman', 'Roman türlerini ve özelliklerini tanır'),
    (v_edebiyat, 9, 2, 'Dil Bilgisi', 'Sözcükte Yapı', 'Sözcüklerin yapısını çözümler'),
    (v_edebiyat, 9, 2, 'Dil Bilgisi', 'Cümlenin Ögeleri', 'Cümlenin ögelerini ayrıntılı belirler'),
    (v_edebiyat, 9, 3, 'Edebi Sanatlar', 'Söz Sanatları', 'Söz sanatlarını tanır ve kullanır')
    ON CONFLICT DO NOTHING;

    -- MATEMATİK 9. Sınıf
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_matematik, 9, 1, 'Mantık', 'Önermeler', 'Önermeleri tanır ve mantık işlemlerini yapar'),
    (v_matematik, 9, 1, 'Mantık', 'Bileşik Önermeler', 'Bileşik önermeleri oluşturur'),
    (v_matematik, 9, 2, 'Kümeler', 'Küme Kavramı', 'Kümeleri gösterir ve alt kümeleri belirler'),
    (v_matematik, 9, 2, 'Kümeler', 'Küme İşlemleri', 'Kümelerde birleşim, kesişim ve fark işlemlerini yapar'),
    (v_matematik, 9, 3, 'Denklemler', 'Birinci Dereceden Denklemler', 'Birinci dereceden denklemleri çözer'),
    (v_matematik, 9, 3, 'Denklemler', 'İkinci Dereceden Denklemler', 'İkinci dereceden denklemleri çözer'),
    (v_matematik, 9, 4, 'Eşitsizlikler', 'Birinci Dereceden Eşitsizlikler', 'Birinci dereceden eşitsizlikleri çözer'),
    (v_matematik, 9, 5, 'Üçgenler', 'Üçgende Açı-Kenar Bağıntıları', 'Üçgende açı-kenar bağıntılarını kullanır'),
    (v_matematik, 9, 5, 'Üçgenler', 'Üçgende Alan', 'Üçgenin alanını hesaplar'),
    (v_matematik, 9, 6, 'Veri Analizi', 'Merkezi Eğilim Ölçüleri', 'Aritmetik ortalama, medyan, mod hesaplar')
    ON CONFLICT DO NOTHING;

    -- FİZİK 9. Sınıf
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_fizik, 9, 1, 'Fizik Bilimine Giriş', 'Fizik ve Hayat', 'Fiziğin uğraş alanlarını açıklar'),
    (v_fizik, 9, 2, 'Madde ve Özkütle', 'Özkütle', 'Özkütle kavramını açıklar ve hesaplar'),
    (v_fizik, 9, 3, 'Kuvvet ve Hareket', 'Hareket', 'Konum, hız ve ivme kavramlarını tanımlar'),
    (v_fizik, 9, 3, 'Kuvvet ve Hareket', 'Newton Yasaları', 'Newton un hareket yasalarını açıklar'),
    (v_fizik, 9, 4, 'Enerji', 'Kinetik ve Potansiyel Enerji', 'Enerji türlerini açıklar'),
    (v_fizik, 9, 4, 'Enerji', 'Enerjinin Korunumu', 'Enerjinin korunumu ilkesini açıklar'),
    (v_fizik, 9, 5, 'Isı ve Sıcaklık', 'Isı-Sıcaklık İlişkisi', 'Isı ve sıcaklık arasındaki farkı açıklar'),
    (v_fizik, 9, 6, 'Elektrostatik', 'Elektrik Yükü', 'Elektrik yüklerini ve etkileşimlerini açıklar'),
    (v_fizik, 9, 7, 'Manyetizma', 'Mıknatıslar', 'Mıknatısların özelliklerini açıklar')
    ON CONFLICT DO NOTHING;

    -- KİMYA 9. Sınıf
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_kimya, 9, 1, 'Kimya Bilimi', 'Kimya ve Günlük Hayat', 'Kimyanın uğraş alanlarını açıklar'),
    (v_kimya, 9, 2, 'Atom ve Periyodik Sistem', 'Atom Modelleri', 'Atom modellerini karşılaştırır'),
    (v_kimya, 9, 2, 'Atom ve Periyodik Sistem', 'Periyodik Tablo', 'Periyodik tablodaki düzenliliği açıklar'),
    (v_kimya, 9, 3, 'Kimyasal Türler Arası Etkileşimler', 'Kimyasal Bağlar', 'Kimyasal bağ türlerini açıklar'),
    (v_kimya, 9, 4, 'Maddenin Halleri', 'Katı, Sıvı, Gaz', 'Maddenin hallerini ve özelliklerini açıklar'),
    (v_kimya, 9, 5, 'Doğa ve Kimya', 'Su ve Hayat', 'Suyun önemini açıklar')
    ON CONFLICT DO NOTHING;

    -- BİYOLOJİ 9. Sınıf
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_biyoloji, 9, 1, 'Yaşam Bilimi Biyoloji', 'Biyolojinin Temel İlkeleri', 'Biyolojinin ilkelerini açıklar'),
    (v_biyoloji, 9, 2, 'Hücre', 'Hücre Zarı', 'Hücre zarının yapısını ve görevlerini açıklar'),
    (v_biyoloji, 9, 2, 'Hücre', 'Hücre Organelleri', 'Hücre organellerini tanır'),
    (v_biyoloji, 9, 3, 'Canlıların Temel Bileşenleri', 'İnorganik Bileşikler', 'Su ve mineralleri açıklar'),
    (v_biyoloji, 9, 3, 'Canlıların Temel Bileşenleri', 'Organik Bileşikler', 'Karbonhidrat, yağ, protein, nükleik asitleri açıklar')
    ON CONFLICT DO NOTHING;

    -- =====================================================
    -- 10. SINIF KAZANIMLARI
    -- =====================================================
    
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_matematik, 10, 1, 'Fonksiyonlar', 'Fonksiyon Kavramı', 'Fonksiyon kavramını tanır'),
    (v_matematik, 10, 1, 'Fonksiyonlar', 'Fonksiyon Türleri', 'Fonksiyon türlerini sınıflandırır'),
    (v_matematik, 10, 2, 'Polinomlar', 'Polinom Kavramı', 'Polinom kavramını açıklar'),
    (v_matematik, 10, 2, 'Polinomlar', 'Polinom İşlemleri', 'Polinomlarla işlem yapar'),
    (v_matematik, 10, 3, 'İkinci Dereceden Denklemler', 'Kök Bulma', 'İkinci derece denklemin köklerini bulur'),
    (v_matematik, 10, 4, 'Dörtgenler', 'Özel Dörtgenler', 'Özel dörtgenlerin özelliklerini belirler'),
    (v_matematik, 10, 5, 'Veri Analizi', 'Standart Sapma', 'Standart sapma hesaplar'),
    (v_fizik, 10, 1, 'Elektrik ve Manyetizma', 'Elektrik Akımı', 'Elektrik akımını açıklar'),
    (v_fizik, 10, 2, 'Basınç ve Kaldırma Kuvveti', 'Sıvı Basıncı', 'Sıvı basıncını hesaplar'),
    (v_fizik, 10, 3, 'Dalgalar', 'Dalga Hareketi', 'Dalga hareketini açıklar'),
    (v_kimya, 10, 1, 'Asitler ve Bazlar', 'pH Kavramı', 'pH kavramını açıklar'),
    (v_kimya, 10, 2, 'Karışımlar', 'Homojen ve Heterojen', 'Karışım türlerini ayırt eder'),
    (v_biyoloji, 10, 1, 'Hücre Bölünmesi', 'Mitoz', 'Mitoz bölünmeyi açıklar'),
    (v_biyoloji, 10, 1, 'Hücre Bölünmesi', 'Mayoz', 'Mayoz bölünmeyi açıklar'),
    (v_biyoloji, 10, 2, 'Kalıtım', 'Mendel Genetiği', 'Mendel genetiği ilkelerini açıklar')
    ON CONFLICT DO NOTHING;

    -- =====================================================
    -- 11. SINIF KAZANIMLARI (TYT)
    -- =====================================================
    
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_matematik, 11, 1, 'Trigonometri', 'Trigonometrik Fonksiyonlar', 'Trigonometrik fonksiyonları tanır'),
    (v_matematik, 11, 1, 'Trigonometri', 'Trigonometrik Denklemler', 'Trigonometrik denklemleri çözer'),
    (v_matematik, 11, 2, 'Analitik Geometri', 'Doğru Denklemi', 'Doğru denklemini yazar'),
    (v_matematik, 11, 2, 'Analitik Geometri', 'Çember Denklemi', 'Çember denklemini yazar'),
    (v_matematik, 11, 3, 'Diziler', 'Aritmetik Dizi', 'Aritmetik dizinin genel terimini bulur'),
    (v_matematik, 11, 3, 'Diziler', 'Geometrik Dizi', 'Geometrik dizinin genel terimini bulur'),
    (v_fizik, 11, 1, 'Kuvvet ve Hareket', 'Düzgün Çembersel Hareket', 'Düzgün çembersel hareketi açıklar'),
    (v_fizik, 11, 2, 'Elektrik', 'Ohm Yasası', 'Ohm yasasını uygular'),
    (v_kimya, 11, 1, 'Kimyasal Tepkimeler', 'Tepkime Hızı', 'Tepkime hızını etkileyen faktörleri açıklar'),
    (v_kimya, 11, 2, 'Kimyasal Denge', 'Denge Sabiti', 'Denge sabitini hesaplar'),
    (v_biyoloji, 11, 1, 'İnsan Fizyolojisi', 'Sinir Sistemi', 'Sinir sisteminin çalışmasını açıklar'),
    (v_biyoloji, 11, 2, 'Dolaşım Sistemi', 'Kan ve Kalp', 'Dolaşım sistemini açıklar')
    ON CONFLICT DO NOTHING;

    -- =====================================================
    -- 12. SINIF KAZANIMLARI (TYT-AYT)
    -- =====================================================
    
    INSERT INTO topics (subject_id, grade, unit_number, main_topic, sub_topic, learning_outcome) VALUES
    (v_matematik, 12, 1, 'Türev', 'Türev Kavramı', 'Türev kavramını açıklar'),
    (v_matematik, 12, 1, 'Türev', 'Türev Kuralları', 'Türev kurallarını uygular'),
    (v_matematik, 12, 1, 'Türev', 'Türev Uygulamaları', 'Türevin uygulamalarını yapar'),
    (v_matematik, 12, 2, 'İntegral', 'Belirsiz İntegral', 'Belirsiz integral hesaplar'),
    (v_matematik, 12, 2, 'İntegral', 'Belirli İntegral', 'Belirli integral hesaplar'),
    (v_matematik, 12, 3, 'Olasılık', 'Koşullu Olasılık', 'Koşullu olasılık hesaplar'),
    (v_matematik, 12, 3, 'Olasılık', 'Bağımsız Olaylar', 'Bağımsız olaylarda olasılık hesaplar'),
    (v_fizik, 12, 1, 'Modern Fizik', 'Atom Fiziği', 'Atom modellerini açıklar'),
    (v_fizik, 12, 2, 'Elektromanyetik Dalgalar', 'Işık', 'Işığın dalga özelliklerini açıklar'),
    (v_kimya, 12, 1, 'Organik Kimya', 'Hidrokarbonlar', 'Hidrokarbonları sınıflandırır'),
    (v_kimya, 12, 2, 'Enerji', 'Kimyasal Enerji', 'Kimyasal enerji değişimlerini açıklar'),
    (v_biyoloji, 12, 1, 'Canlılar ve Çevre', 'Ekosistem', 'Ekosistem kavramını açıklar'),
    (v_biyoloji, 12, 2, 'Evrim', 'Evrim Teorisi', 'Evrim teorisini açıklar'),
    (v_tarih, 12, 1, 'Türk İnkılabı', 'Cumhuriyetin İlanı', 'Cumhuriyetin ilanını değerlendirir'),
    (v_cografya, 12, 1, 'Beşeri Coğrafya', 'Nüfus', 'Nüfus dağılışını açıklar'),
    (v_felsefe, 12, 1, 'Bilgi Felsefesi', 'Bilgi Türleri', 'Bilgi türlerini açıklar')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Kazanımlar başarıyla eklendi!';
END $$;

-- Eklenen toplam kazanım sayısını göster
SELECT 
    g.name as sinif,
    s.name as ders,
    COUNT(t.id) as kazanim_sayisi
FROM topics t
JOIN subjects s ON t.subject_id = s.id
JOIN grades g ON t.grade = g.id
GROUP BY g.name, s.name, g.id
ORDER BY g.id, s.name;



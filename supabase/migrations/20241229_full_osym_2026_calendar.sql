-- ÖSYM 2026 TAM SINAV TAKVİMİ
-- Kaynak: osym.gov.tr/TR,8797/takvim.html (Resmi ÖSYM Takvimi)

DELETE FROM exam_dates;

INSERT INTO exam_dates (title, description, exam_date, exam_type, color, icon, is_active) VALUES

-- OCAK 2026
('e-YDS 2026/1 İngilizce', 'Elektronik Yabancı Dil Sınavı - 1. Dönem (İngilizce)', '2026-01-31 10:00:00+03', 'yds', '#0EA5E9', 'globe', true),

-- ŞUBAT 2026
('e-TEP 2026/1 İngilizce', 'Elektronik İngilizce Yeterlik Sınavı (Electronic-Test of English Proficiency)', '2026-02-14 10:00:00+03', 'yds', '#06B6D4', 'globe', true),

-- MART 2026
('e-YDS 2026/2 İngilizce', 'Elektronik Yabancı Dil Sınavı - 2. Dönem (İngilizce)', '2026-03-01 10:00:00+03', 'yds', '#0EA5E9', 'globe', true),
('MSÜ 2026', 'Millî Savunma Üniversitesi Askerî Öğrenci Aday Belirleme Sınavı', '2026-03-07 10:00:00+03', 'msu', '#1E40AF', 'target', true),
('YÖKDİL 2026/1', 'Yükseköğretim Kurumları Yabancı Dil Sınavı - 1. Dönem', '2026-03-08 10:00:00+03', 'yokdil', '#7C3AED', 'globe', true),
('MEB-EKYS 2026', 'Millî Eğitim Bakanlığı Eğitim Kurumlarına Yönetici Seçme Sınavı', '2026-03-15 10:00:00+03', 'meb', '#F59E0B', 'briefcase', true),
('TUS 2026/1', 'Tıpta Uzmanlık Eğitimi Giriş Sınavı - 1. Dönem', '2026-03-15 10:00:00+03', 'tus', '#DC2626', 'target', true),
('DİB-MBSTS 2026', 'Diyanet İşleri Başkanlığı Mesleki Bilgiler Seviye Tespit Sınavı', '2026-03-29 10:00:00+03', 'dib', '#14B8A6', 'book-open', true),

-- NİSAN 2026
('YDS 2026/1', 'Yabancı Dil Bilgisi Seviye Tespit Sınavı - 1. Dönem', '2026-04-05 10:00:00+03', 'yds', '#0891B2', 'globe', true),
('TR-YÖS 2026/1', 'Türkiye Yurt Dışından Öğrenci Kabul Sınavı - 1. Dönem', '2026-04-12 10:00:00+03', 'yos', '#8B5CF6', 'graduation-cap', true),
('e-YDS 2026/3', 'Elektronik Yabancı Dil Sınavı (Farsça/Yunanca/Bulgarca)', '2026-04-18 10:00:00+03', 'yds', '#0EA5E9', 'globe', true),
('EKPSS 2026', 'Engelli Kamu Personeli Seçme Sınavı', '2026-04-19 10:00:00+03', 'ekpss', '#BE185D', 'briefcase', true),
('e-TEP 2026/2 İngilizce', 'Elektronik İngilizce Yeterlik Sınavı - 2. Dönem', '2026-04-25 10:00:00+03', 'yds', '#06B6D4', 'globe', true),
('HMGS 2026/1', 'Hukuk Mesleklerine Giriş Sınavı - 1. Dönem', '2026-04-26 10:00:00+03', 'hmgs', '#4338CA', 'briefcase', true),
('DUS 2026/1', 'Diş Hekimliğinde Uzmanlık Eğitimi Giriş Sınavı - 1. Dönem', '2026-04-26 10:00:00+03', 'dus', '#E11D48', 'target', true),

-- MAYIS 2026
('YDUS 2026', 'Tıpta Yan Dal Uzmanlık Eğitimi Giriş Sınavı', '2026-05-02 10:00:00+03', 'ydus', '#B91C1C', 'target', true),
('e-YDS 2026/4 İngilizce', 'Elektronik Yabancı Dil Sınavı - 4. Dönem (İngilizce)', '2026-05-02 10:00:00+03', 'yds', '#0EA5E9', 'globe', true),
('e-YDS 2026/5', 'Elektronik Yabancı Dil Sınavı (İspanyolca/İtalyanca)', '2026-05-03 10:00:00+03', 'yds', '#0EA5E9', 'globe', true),
('ALES 2026/1', 'Akademik Personel ve Lisansüstü Eğitimi Giriş Sınavı - 1. Dönem', '2026-05-10 10:00:00+03', 'ales', '#7C3AED', 'graduation-cap', true),
('e-YÖKDİL 2026/1', 'Elektronik YÖKDİL (İngilizce-Sosyal Bilimler)', '2026-05-16 10:00:00+03', 'yokdil', '#A855F7', 'globe', true),
('e-YÖKDİL 2026/2', 'Elektronik YÖKDİL (İngilizce-Sağlık Bilimleri)', '2026-05-17 10:00:00+03', 'yokdil', '#A855F7', 'globe', true),

-- HAZİRAN 2026
('e-YÖKDİL 2026/3', 'Elektronik YÖKDİL (İngilizce-Fen Bilimleri)', '2026-06-06 10:00:00+03', 'yokdil', '#A855F7', 'globe', true),
('LGS 2026', 'Liselere Geçiş Sınavı - 8. sınıf öğrencileri için merkezi sınav (MEB)', '2026-06-07 10:00:00+03', 'lgs', '#10B981', 'graduation-cap', true),
('STS Öğretmenlik 2026', 'Öğretmenlik Meslek Bilgisi Alanında Yurt Dışı Diploma Denkliği Sınavı', '2026-06-13 10:00:00+03', 'sts', '#F97316', 'book-open', true),
('YKS-TYT 2026', 'Temel Yeterlilik Testi - Yükseköğretim Kurumları Sınavı 1. Oturum', '2026-06-20 10:15:00+03', 'yks', '#6366F1', 'book-open', true),
('YKS-AYT 2026', 'Alan Yeterlilik Testi - Yükseköğretim Kurumları Sınavı 2. Oturum', '2026-06-21 10:15:00+03', 'yks', '#8B5CF6', 'book-open', true),
('YKS-YDT 2026', 'Yabancı Dil Testi - Yükseköğretim Kurumları Sınavı 3. Oturum', '2026-06-21 15:45:00+03', 'yks', '#EC4899', 'globe', true),
('e-YDS 2026/6 İngilizce', 'Elektronik Yabancı Dil Sınavı - 6. Dönem (İngilizce)', '2026-06-27 10:00:00+03', 'yds', '#0EA5E9', 'globe', true),
('e-YDS 2026/7', 'Elektronik Yabancı Dil Sınavı (Arapça/Rusça)', '2026-06-28 10:00:00+03', 'yds', '#0EA5E9', 'globe', true),

-- TEMMUZ 2026
('e-YDS 2026/8', 'Elektronik Yabancı Dil Sınavı (Almanca/Fransızca)', '2026-07-04 10:00:00+03', 'yds', '#0EA5E9', 'globe', true),
('MEB-AGS 2026', 'Millî Eğitim Bakanlığı Akademi Giriş Sınavı (AGS + ÖABT)', '2026-07-12 10:00:00+03', 'meb', '#F59E0B', 'book-open', true),
('e-TEP 2026/3 İngilizce', 'Elektronik İngilizce Yeterlik Sınavı - 3. Dönem', '2026-07-18 10:00:00+03', 'yds', '#06B6D4', 'globe', true),
('DGS 2026', 'Dikey Geçiş Sınavı - Ön lisanstan lisansa geçiş', '2026-07-19 10:00:00+03', 'dgs', '#14B8A6', 'graduation-cap', true),
('ALES 2026/2', 'Akademik Personel ve Lisansüstü Eğitimi Giriş Sınavı - 2. Dönem', '2026-07-26 10:00:00+03', 'ales', '#7C3AED', 'graduation-cap', true),

-- AĞUSTOS 2026
('YÖKDİL 2026/2', 'Yükseköğretim Kurumları Yabancı Dil Sınavı - 2. Dönem', '2026-08-02 10:00:00+03', 'yokdil', '#7C3AED', 'globe', true),
('ÖZYES 2026', 'YKS Kapsamında Spor Bilimleri İçin Özel Yetenek Sınavı', '2026-08-15 10:00:00+03', 'yks', '#F97316', 'target', true),
('e-YDS 2026/9 İngilizce', 'Elektronik Yabancı Dil Sınavı - 9. Dönem (İngilizce)', '2026-08-22 10:00:00+03', 'yds', '#0EA5E9', 'globe', true),
('TUS 2026/2', 'Tıpta Uzmanlık Eğitimi Giriş Sınavı - 2. Dönem', '2026-08-23 10:00:00+03', 'tus', '#DC2626', 'target', true),

-- EYLÜL 2026
('İOKBS 2026', 'İlköğretim ve Ortaöğretim Kurumları Bursluluk Sınavı (5-11. sınıflar) - MEB', '2026-09-06 10:00:00+03', 'bursluluk', '#F59E0B', 'target', true),
('KPSS Lisans 2026 GY-GK', 'KPSS Lisans Genel Yetenek - Genel Kültür Oturumu', '2026-09-06 10:00:00+03', 'kpss', '#F97316', 'briefcase', true),
('KPSS Lisans 2026 Alan Bilgisi 1', 'KPSS Lisans Alan Bilgisi Testi - 1. Gün', '2026-09-12 10:00:00+03', 'kpss', '#EA580C', 'briefcase', true),
('KPSS Lisans 2026 Alan Bilgisi 2', 'KPSS Lisans Alan Bilgisi Testi - 2. Gün', '2026-09-13 10:00:00+03', 'kpss', '#EA580C', 'briefcase', true),
('e-YDS 2026/10 İngilizce', 'Elektronik Yabancı Dil Sınavı - 10. Dönem (İngilizce)', '2026-09-26 10:00:00+03', 'yds', '#0EA5E9', 'globe', true),
('HMGS 2026/2', 'Hukuk Mesleklerine Giriş Sınavı - 2. Dönem', '2026-09-27 10:00:00+03', 'hmgs', '#4338CA', 'briefcase', true),
('İYÖS 2026', 'İdari Yargı Ön Sınavı', '2026-09-27 10:00:00+03', 'iyos', '#4338CA', 'briefcase', true),

-- EKİM 2026
('KPSS Ön Lisans 2026', 'KPSS Ön Lisans Oturumu', '2026-10-04 10:00:00+03', 'kpss', '#C2410C', 'briefcase', true),
('TR-YÖS 2026/2', 'Türkiye Yurt Dışından Öğrenci Kabul Sınavı - 2. Dönem', '2026-10-11 10:00:00+03', 'yos', '#8B5CF6', 'graduation-cap', true),
('e-YDS 2026/11', 'Elektronik Yabancı Dil Sınavı (Farsça/İngilizce)', '2026-10-17 10:00:00+03', 'yds', '#0EA5E9', 'globe', true),
('KPSS Ortaöğretim 2026', 'KPSS Ortaöğretim Oturumu', '2026-10-25 10:00:00+03', 'kpss', '#9A3412', 'briefcase', true),

-- KASIM 2026
('DUS 2026/2', 'Diş Hekimliğinde Uzmanlık Eğitimi Giriş Sınavı - 2. Dönem', '2026-11-01 10:00:00+03', 'dus', '#E11D48', 'target', true),
('KPSS DHBT 2026', 'KPSS Din Hizmetleri Alan Bilgisi Testi', '2026-11-01 10:00:00+03', 'kpss', '#14B8A6', 'book-open', true),
('EUS 2026', 'Eczacılıkta Uzmanlık Eğitimi Giriş Sınavı', '2026-11-07 10:00:00+03', 'eus', '#DB2777', 'target', true),
('e-TEP 2026/4 İngilizce', 'Elektronik İngilizce Yeterlik Sınavı - 4. Dönem', '2026-11-14 10:00:00+03', 'yds', '#06B6D4', 'globe', true),
('YDS 2026/2', 'Yabancı Dil Bilgisi Seviye Tespit Sınavı - 2. Dönem', '2026-11-22 10:00:00+03', 'yds', '#0891B2', 'globe', true),
('ALES 2026/3', 'Akademik Personel ve Lisansüstü Eğitimi Giriş Sınavı - 3. Dönem', '2026-11-29 10:00:00+03', 'ales', '#7C3AED', 'graduation-cap', true),

-- ARALIK 2026
('e-YDS 2026/12 İngilizce', 'Elektronik Yabancı Dil Sınavı - 12. Dönem (İngilizce)', '2026-12-19 10:00:00+03', 'yds', '#0EA5E9', 'globe', true);


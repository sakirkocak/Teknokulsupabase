-- ÖSYM 2026 Resmi Sınav Takvimi Güncellemesi
-- Kaynak: osym.gov.tr (14 Kasım 2025 duyurusu)

DELETE FROM exam_dates;

INSERT INTO exam_dates (title, description, exam_date, exam_type, color, icon, is_active) VALUES
  -- e-YDS Sınavları
  ('e-YDS 2026/1 İngilizce', 'Elektronik Yabancı Dil Sınavı - 1. Dönem (İngilizce)', '2026-01-18 10:00:00+03', 'yds', '#0EA5E9', 'globe', true),
  ('e-YDS 2026/2 İngilizce', 'Elektronik Yabancı Dil Sınavı - 2. Dönem (İngilizce)', '2026-04-19 10:00:00+03', 'yds', '#0EA5E9', 'globe', true),
  ('e-YDS 2026/3 İngilizce', 'Elektronik Yabancı Dil Sınavı - 3. Dönem (İngilizce)', '2026-07-12 10:00:00+03', 'yds', '#0EA5E9', 'globe', true),
  ('e-YDS 2026/4 İngilizce', 'Elektronik Yabancı Dil Sınavı - 4. Dönem (İngilizce)', '2026-10-18 10:00:00+03', 'yds', '#0EA5E9', 'globe', true),
  
  -- YDS Sınavları
  ('YDS 2026/1', 'Yabancı Dil Bilgisi Seviye Tespit Sınavı - 1. Dönem', '2026-03-22 10:00:00+03', 'yds', '#06B6D4', 'globe', true),
  ('YDS 2026/2', 'Yabancı Dil Bilgisi Seviye Tespit Sınavı - 2. Dönem', '2026-11-22 10:00:00+03', 'yds', '#06B6D4', 'globe', true),
  
  -- TUS Sınavları
  ('TUS 2026/1', 'Tıpta Uzmanlık Eğitimi Giriş Sınavı - 1. Dönem', '2026-03-29 10:00:00+03', 'tus', '#DC2626', 'target', true),
  ('TUS 2026/2', 'Tıpta Uzmanlık Eğitimi Giriş Sınavı - 2. Dönem', '2026-09-13 10:00:00+03', 'tus', '#DC2626', 'target', true),
  
  -- MSÜ
  ('MSÜ 2026', 'Milli Savunma Üniversitesi Askeri Öğrenci Aday Belirleme Sınavı', '2026-03-08 10:00:00+03', 'msu', '#1E40AF', 'target', true),
  
  -- ALES
  ('ALES 2026/1', 'Akademik Personel ve Lisansüstü Eğitimi Giriş Sınavı - 1. Dönem', '2026-05-03 10:00:00+03', 'ales', '#7C3AED', 'graduation-cap', true),
  ('ALES 2026/2', 'Akademik Personel ve Lisansüstü Eğitimi Giriş Sınavı - 2. Dönem', '2026-11-08 10:00:00+03', 'ales', '#7C3AED', 'graduation-cap', true),
  
  -- LGS (MEB)
  ('LGS 2026', 'Liselere Geçiş Sınavı - 8. sınıf öğrencileri için merkezi sınav', '2026-06-07 10:00:00+03', 'lgs', '#10B981', 'graduation-cap', true),
  
  -- YKS
  ('YKS-TYT 2026', 'Temel Yeterlilik Testi - Yükseköğretim Kurumları Sınavı 1. Oturum', '2026-06-20 10:15:00+03', 'yks', '#6366F1', 'book-open', true),
  ('YKS-AYT 2026', 'Alan Yeterlilik Testi - Yükseköğretim Kurumları Sınavı 2. Oturum', '2026-06-21 10:15:00+03', 'yks', '#8B5CF6', 'book-open', true),
  
  -- DGS
  ('DGS 2026', 'Dikey Geçiş Sınavı - Ön lisanstan lisansa geçiş', '2026-07-12 10:00:00+03', 'dgs', '#14B8A6', 'graduation-cap', true),
  
  -- Bursluluk / İOKBS
  ('İOKBS 2026', 'İlköğretim ve Ortaöğretim Kurumları Bursluluk Sınavı (5-11. sınıflar)', '2026-09-06 10:00:00+03', 'bursluluk', '#F59E0B', 'target', true),
  
  -- KPSS
  ('KPSS Lisans 2026 GY-GK', 'KPSS Lisans Genel Yetenek - Genel Kültür Oturumu', '2026-09-26 10:00:00+03', 'kpss', '#F97316', 'briefcase', true),
  ('KPSS Lisans 2026 Eğitim Bilimleri', 'KPSS Lisans Eğitim Bilimleri Oturumu', '2026-09-27 10:00:00+03', 'kpss', '#EA580C', 'briefcase', true),
  ('KPSS Ön Lisans 2026', 'KPSS Ön Lisans Oturumu', '2026-10-04 10:00:00+03', 'kpss', '#C2410C', 'briefcase', true),
  ('KPSS Ortaöğretim 2026', 'KPSS Ortaöğretim Oturumu', '2026-10-11 10:00:00+03', 'kpss', '#9A3412', 'briefcase', true),
  
  -- EKPSS
  ('EKPSS 2026', 'Engelli Kamu Personeli Seçme Sınavı', '2026-04-26 10:00:00+03', 'ekpss', '#BE185D', 'briefcase', true);


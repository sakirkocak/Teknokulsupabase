-- Mevcut sınavları sil
DELETE FROM exam_dates;

-- 2026 sınavlarını ekle
INSERT INTO exam_dates (title, description, exam_date, exam_type, color, icon, is_active) VALUES
  ('2026 LGS', 'Liselere Geçiş Sınavı - 8. sınıf öğrencileri için merkezi sınav', '2026-06-07 10:00:00+03', 'lgs', '#10B981', 'graduation-cap', true),
  ('2026 Bursluluk Sınavı', 'İOKBS - Özel okullara burslu geçiş sınavı (5, 6, 7, 8, 9, 10 ve 11. sınıflar)', '2026-09-06 10:00:00+03', 'bursluluk', '#F59E0B', 'target', true),
  ('2026 YKS-TYT', 'Temel Yeterlilik Testi - Yükseköğretim Kurumları Sınavı 1. Oturum', '2026-06-20 10:15:00+03', 'yks', '#6366F1', 'book-open', true),
  ('2026 YKS-AYT', 'Alan Yeterlilik Testi - Yükseköğretim Kurumları Sınavı 2. Oturum', '2026-06-21 10:15:00+03', 'yks', '#8B5CF6', 'book-open', true),
  ('2026 YKS-YDT', 'Yabancı Dil Testi - Yükseköğretim Kurumları Sınavı 3. Oturum', '2026-06-21 15:45:00+03', 'yks', '#EC4899', 'globe', true),
  ('2026 KPSS Lisans GY-GK', 'KPSS Lisans Genel Yetenek - Genel Kültür', '2026-07-18 10:15:00+03', 'kpss', '#F97316', 'briefcase', true),
  ('2026 KPSS Eğitim Bilimleri', 'KPSS Eğitim Bilimleri Oturumu', '2026-07-19 10:15:00+03', 'kpss', '#EF4444', 'briefcase', true),
  ('2026 DGS', 'Dikey Geçiş Sınavı - Ön lisanstan lisansa geçiş', '2026-07-05 10:15:00+03', 'dgs', '#14B8A6', 'graduation-cap', true),
  ('2026 ALES/1', 'Akademik Personel ve Lisansüstü Eğitimi Giriş Sınavı - 1. Dönem', '2026-05-10 10:15:00+03', 'ales', '#7C3AED', 'target', true),
  ('2026 ALES/2', 'Akademik Personel ve Lisansüstü Eğitimi Giriş Sınavı - 2. Dönem', '2026-11-08 10:15:00+03', 'ales', '#7C3AED', 'target', true),
  ('2026 YDS/1', 'Yabancı Dil Bilgisi Seviye Tespit Sınavı - 1. Dönem', '2026-03-15 10:15:00+03', 'yds', '#0EA5E9', 'globe', true),
  ('2026 YDS/2', 'Yabancı Dil Bilgisi Seviye Tespit Sınavı - 2. Dönem', '2026-10-18 10:15:00+03', 'yds', '#0EA5E9', 'globe', true);


-- Sınav Takvimi Tablosu
CREATE TABLE IF NOT EXISTS exam_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  exam_date TIMESTAMPTZ NOT NULL,
  exam_type VARCHAR(50) NOT NULL DEFAULT 'lgs', -- lgs, yks, kpss, ales, dgs, yds, etc.
  is_active BOOLEAN DEFAULT true,
  color VARCHAR(20) DEFAULT '#4F46E5', -- Renk kodu
  icon VARCHAR(50) DEFAULT 'calendar', -- İkon adı
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- RLS Politikaları
ALTER TABLE exam_dates ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir
CREATE POLICY "exam_dates_select_policy" ON exam_dates
  FOR SELECT USING (is_active = true);

-- Sadece admin ekleyebilir, güncelleyebilir, silebilir
CREATE POLICY "exam_dates_insert_policy" ON exam_dates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "exam_dates_update_policy" ON exam_dates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "exam_dates_delete_policy" ON exam_dates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Varsayılan sınavlar
INSERT INTO exam_dates (title, description, exam_date, exam_type, color, icon) VALUES
  ('2025 LGS', 'Liselere Geçiş Sınavı - 8. sınıf öğrencileri için merkezi sınav', '2025-06-08 10:00:00+03', 'lgs', '#10B981', 'graduation-cap'),
  ('2025 YKS-TYT', 'Temel Yeterlilik Testi - Yükseköğretim Kurumları Sınavı 1. Oturum', '2025-06-14 10:15:00+03', 'yks', '#6366F1', 'book-open'),
  ('2025 YKS-AYT', 'Alan Yeterlilik Testi - Yükseköğretim Kurumları Sınavı 2. Oturum', '2025-06-15 10:15:00+03', 'yks', '#8B5CF6', 'book-open'),
  ('2025 YKS-YDT', 'Yabancı Dil Testi - Yükseköğretim Kurumları Sınavı 3. Oturum', '2025-06-15 15:45:00+03', 'yks', '#EC4899', 'globe'),
  ('2025 KPSS Lisans GY-GK', 'KPSS Lisans Genel Yetenek - Genel Kültür', '2025-07-19 10:15:00+03', 'kpss', '#F59E0B', 'briefcase'),
  ('2025 KPSS Lisans Eğitim Bilimleri', 'KPSS Eğitim Bilimleri Oturumu', '2025-07-20 10:15:00+03', 'kpss', '#F97316', 'briefcase');

-- İndeks
CREATE INDEX idx_exam_dates_date ON exam_dates(exam_date);
CREATE INDEX idx_exam_dates_type ON exam_dates(exam_type);
CREATE INDEX idx_exam_dates_active ON exam_dates(is_active);


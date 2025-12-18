-- Soru Bildirimleri Tablosu
-- Öğrencilerin hatalı sorular için bildirim göndermesi

CREATE TABLE IF NOT EXISTS question_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_question_reports_status ON question_reports(status);
CREATE INDEX IF NOT EXISTS idx_question_reports_question ON question_reports(question_id);
CREATE INDEX IF NOT EXISTS idx_question_reports_student ON question_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_question_reports_created ON question_reports(created_at DESC);

-- RLS Politikaları
ALTER TABLE question_reports ENABLE ROW LEVEL SECURITY;

-- Öğrenciler kendi bildirimlerini görebilir
CREATE POLICY "Öğrenciler kendi bildirimlerini görebilir" ON question_reports
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM student_profiles WHERE user_id = auth.uid()
    )
  );

-- Öğrenciler bildirim oluşturabilir
CREATE POLICY "Öğrenciler bildirim oluşturabilir" ON question_reports
  FOR INSERT WITH CHECK (
    student_id IN (
      SELECT id FROM student_profiles WHERE user_id = auth.uid()
    )
  );

-- Adminler tüm bildirimleri görebilir
CREATE POLICY "Adminler tüm bildirimleri görebilir" ON question_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Adminler bildirimleri güncelleyebilir
CREATE POLICY "Adminler bildirimleri güncelleyebilir" ON question_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Adminler bildirimleri silebilir
CREATE POLICY "Adminler bildirimleri silebilir" ON question_reports
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Güncelleme tetikleyicisi
CREATE OR REPLACE FUNCTION update_question_report_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_question_report_updated_at
  BEFORE UPDATE ON question_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_question_report_updated_at();


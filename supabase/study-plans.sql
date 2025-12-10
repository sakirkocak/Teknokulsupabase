-- Study Plans tablosu
CREATE TABLE IF NOT EXISTS study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_exam TEXT,
  target_date DATE,
  daily_hours TEXT,
  weak_subjects TEXT[],
  strong_subjects TEXT[],
  weekly_schedule JSONB,
  daily_details JSONB,
  priority_topics TEXT[],
  tips TEXT[],
  weekly_goals JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_study_plans_student_id ON study_plans(student_id);

-- RLS Policies
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;

-- Öğrenci kendi planlarını görebilir
CREATE POLICY "Students can view own plans" ON study_plans
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM student_profiles WHERE user_id = auth.uid()
    )
  );

-- Öğrenci plan oluşturabilir
CREATE POLICY "Students can create plans" ON study_plans
  FOR INSERT
  WITH CHECK (
    student_id IN (
      SELECT id FROM student_profiles WHERE user_id = auth.uid()
    )
  );

-- Öğrenci kendi planlarını güncelleyebilir
CREATE POLICY "Students can update own plans" ON study_plans
  FOR UPDATE
  USING (
    student_id IN (
      SELECT id FROM student_profiles WHERE user_id = auth.uid()
    )
  );

-- Öğrenci kendi planlarını silebilir
CREATE POLICY "Students can delete own plans" ON study_plans
  FOR DELETE
  USING (
    student_id IN (
      SELECT id FROM student_profiles WHERE user_id = auth.uid()
    )
  );

-- Koç, öğrencisinin planlarını görebilir
CREATE POLICY "Coaches can view student plans" ON study_plans
  FOR SELECT
  USING (
    student_id IN (
      SELECT sp.id FROM student_profiles sp
      JOIN coaching_relationships cr ON sp.id = cr.student_id
      JOIN teacher_profiles tp ON cr.coach_id = tp.id
      WHERE tp.user_id = auth.uid() AND cr.status = 'active'
    )
  );


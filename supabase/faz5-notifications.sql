-- FAZ 5: Bildirimler ve Veli Raporları Tabloları

-- Bildirimler tablosu
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info', -- info, success, warning, error
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Veli raporları tablosu
CREATE TABLE IF NOT EXISTS parent_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES parent_profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  report_type TEXT DEFAULT 'weekly', -- weekly, monthly, custom
  title TEXT,
  content JSONB, -- { tasks_completed, exams, notes, recommendations }
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS politikaları
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_reports ENABLE ROW LEVEL SECURITY;

-- Bildirimler: Sadece kendi bildirimlerini görebilir
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Veli raporları: Koç oluşturabilir, veli görebilir
CREATE POLICY "Coaches can create reports" ON parent_reports
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM teacher_profiles WHERE id = coach_id AND user_id = auth.uid())
  );

CREATE POLICY "Parents can view own reports" ON parent_reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM parent_profiles WHERE id = parent_id AND user_id = auth.uid())
  );

CREATE POLICY "Coaches can view sent reports" ON parent_reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM teacher_profiles WHERE id = coach_id AND user_id = auth.uid())
  );

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_parent_reports_parent_id ON parent_reports(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_reports_coach_id ON parent_reports(coach_id);


-- =====================================================
-- BU SQL'İ SUPABASE DASHBOARD > SQL EDITOR'DA ÇALIŞTIRIN
-- =====================================================

-- 1. teacher_profiles'a koçluk kolonları ekle
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS is_coach BOOLEAN DEFAULT true;

-- 2. COACHING_RELATIONSHIPS (Koç-Öğrenci ilişkisi)
CREATE TABLE IF NOT EXISTS coaching_relationships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coach_id UUID NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'ended')),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(coach_id, student_id)
);

-- 3. TASKS (Görevler)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coach_id UUID REFERENCES teacher_profiles(id) ON DELETE SET NULL,
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'homework' CHECK (type IN ('quiz', 'homework', 'project', 'daily')),
    due_date TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'submitted', 'completed')),
    student_response TEXT,
    coach_feedback TEXT,
    score INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. EXAM_RESULTS (Deneme sonuçları)
CREATE TABLE IF NOT EXISTS exam_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    exam_name TEXT NOT NULL,
    exam_date DATE NOT NULL,
    image_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID,
    total_correct INTEGER,
    total_wrong INTEGER,
    total_empty INTEGER,
    net_score DECIMAL(10,2),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ACTIVITY_LOGS (Aktivite kayıtları)
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    subject TEXT,
    correct_count INTEGER DEFAULT 0,
    wrong_count INTEGER DEFAULT 0,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. AI_RECOMMENDATIONS (AI önerileri)
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    recommendation_type TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    is_dismissed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PARENT_STUDENTS (Veli-Öğrenci ilişkisi)
CREATE TABLE IF NOT EXISTS parent_students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID NOT NULL REFERENCES parent_profiles(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(parent_id, student_id)
);

-- =====================================================
-- RLS POLİTİKALARI
-- =====================================================

-- Coaching Relationships
ALTER TABLE coaching_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coaching_select" ON coaching_relationships FOR SELECT USING (true);
CREATE POLICY "coaching_insert" ON coaching_relationships FOR INSERT WITH CHECK (true);
CREATE POLICY "coaching_update" ON coaching_relationships FOR UPDATE USING (true);

-- Tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select" ON tasks FOR SELECT USING (true);
CREATE POLICY "tasks_insert" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "tasks_update" ON tasks FOR UPDATE USING (true);

-- Exam Results
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exam_select" ON exam_results FOR SELECT USING (true);
CREATE POLICY "exam_insert" ON exam_results FOR INSERT WITH CHECK (true);

-- Activity Logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_select" ON activity_logs FOR SELECT USING (true);
CREATE POLICY "activity_insert" ON activity_logs FOR INSERT WITH CHECK (true);

-- AI Recommendations
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_select" ON ai_recommendations FOR SELECT USING (true);
CREATE POLICY "ai_insert" ON ai_recommendations FOR INSERT WITH CHECK (true);

-- Parent Students
ALTER TABLE parent_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parent_students_select" ON parent_students FOR SELECT USING (true);
CREATE POLICY "parent_students_insert" ON parent_students FOR INSERT WITH CHECK (true);

-- TAMAMLANDI!
SELECT 'Tablolar başarıyla oluşturuldu!' as mesaj;


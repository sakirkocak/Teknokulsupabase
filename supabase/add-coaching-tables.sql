-- =====================================================
-- KOÇLUK SİSTEMİ EKSİK TABLOLARI
-- =====================================================

-- teacher_profiles'a is_coach kolonu ekle (yoksa)
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS is_coach BOOLEAN DEFAULT true;
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS subjects TEXT[] DEFAULT '{}';
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 5.00;
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- 1. COACHING_RELATIONSHIPS (Koç-Öğrenci ilişkisi)
CREATE TABLE IF NOT EXISTS coaching_relationships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coach_id UUID NOT NULL,
    student_id UUID NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'ended')),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(coach_id, student_id)
);

-- Foreign key eklemeye çalış (varsa hata vermez)
DO $$ BEGIN
    ALTER TABLE coaching_relationships 
        ADD CONSTRAINT fk_coaching_coach 
        FOREIGN KEY (coach_id) REFERENCES teacher_profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE coaching_relationships 
        ADD CONSTRAINT fk_coaching_student 
        FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. TASKS (Görevler)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coach_id UUID,
    student_id UUID NOT NULL,
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

DO $$ BEGIN
    ALTER TABLE tasks 
        ADD CONSTRAINT fk_tasks_coach 
        FOREIGN KEY (coach_id) REFERENCES teacher_profiles(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE tasks 
        ADD CONSTRAINT fk_tasks_student 
        FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. EXAM_RESULTS (Deneme sonuçları)
CREATE TABLE IF NOT EXISTS exam_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL,
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

DO $$ BEGIN
    ALTER TABLE exam_results 
        ADD CONSTRAINT fk_exam_student 
        FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. ACTIVITY_LOGS (Aktivite kayıtları)
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL,
    activity_type TEXT NOT NULL,
    subject TEXT,
    correct_count INTEGER DEFAULT 0,
    wrong_count INTEGER DEFAULT 0,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
    ALTER TABLE activity_logs 
        ADD CONSTRAINT fk_activity_student 
        FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. AI_RECOMMENDATIONS (AI önerileri)
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL,
    recommendation_type TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    is_dismissed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
    ALTER TABLE ai_recommendations 
        ADD CONSTRAINT fk_ai_rec_student 
        FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6. PARENT_STUDENTS (Veli-Öğrenci ilişkisi)
CREATE TABLE IF NOT EXISTS parent_students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID NOT NULL,
    student_id UUID NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(parent_id, student_id)
);

DO $$ BEGIN
    ALTER TABLE parent_students 
        ADD CONSTRAINT fk_parent_students_parent 
        FOREIGN KEY (parent_id) REFERENCES parent_profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE parent_students 
        ADD CONSTRAINT fk_parent_students_student 
        FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLİTİKALARI
-- =====================================================

-- Coaching Relationships RLS
ALTER TABLE coaching_relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Koçluk ilişkileri ilgili taraflarca görülebilir" ON coaching_relationships;
CREATE POLICY "Koçluk ilişkileri ilgili taraflarca görülebilir"
    ON coaching_relationships FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM teacher_profiles tp WHERE tp.id = coach_id AND tp.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM student_profiles sp WHERE sp.id = student_id AND sp.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Öğrenciler koçluk başvurusu yapabilir" ON coaching_relationships;
CREATE POLICY "Öğrenciler koçluk başvurusu yapabilir"
    ON coaching_relationships FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM student_profiles sp WHERE sp.id = student_id AND sp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Koçlar ilişkiyi güncelleyebilir" ON coaching_relationships;
CREATE POLICY "Koçlar ilişkiyi güncelleyebilir"
    ON coaching_relationships FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM teacher_profiles tp WHERE tp.id = coach_id AND tp.user_id = auth.uid()
        )
    );

-- Tasks RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Görevler ilgili taraflarca görülebilir" ON tasks;
CREATE POLICY "Görevler ilgili taraflarca görülebilir"
    ON tasks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM teacher_profiles tp WHERE tp.id = coach_id AND tp.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM student_profiles sp WHERE sp.id = student_id AND sp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Koçlar görev oluşturabilir" ON tasks;
CREATE POLICY "Koçlar görev oluşturabilir"
    ON tasks FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM teacher_profiles tp WHERE tp.id = coach_id AND tp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Görevler güncellenebilir" ON tasks;
CREATE POLICY "Görevler güncellenebilir"
    ON tasks FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM teacher_profiles tp WHERE tp.id = coach_id AND tp.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM student_profiles sp WHERE sp.id = student_id AND sp.user_id = auth.uid()
        )
    );

-- Exam Results RLS
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deneme sonuçları görülebilir" ON exam_results;
CREATE POLICY "Deneme sonuçları görülebilir"
    ON exam_results FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM student_profiles sp WHERE sp.id = student_id AND sp.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM coaching_relationships cr 
            JOIN teacher_profiles tp ON tp.id = cr.coach_id 
            WHERE cr.student_id = exam_results.student_id 
            AND cr.status = 'active' 
            AND tp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Öğrenciler sonuç yükleyebilir" ON exam_results;
CREATE POLICY "Öğrenciler sonuç yükleyebilir"
    ON exam_results FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM student_profiles sp WHERE sp.id = student_id AND sp.user_id = auth.uid()
        )
    );

-- Activity Logs RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Aktivite kayıtları görülebilir" ON activity_logs;
CREATE POLICY "Aktivite kayıtları görülebilir"
    ON activity_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM student_profiles sp WHERE sp.id = student_id AND sp.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM coaching_relationships cr 
            JOIN teacher_profiles tp ON tp.id = cr.coach_id 
            WHERE cr.student_id = activity_logs.student_id 
            AND cr.status = 'active' 
            AND tp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Öğrenciler aktivite kaydedebilir" ON activity_logs;
CREATE POLICY "Öğrenciler aktivite kaydedebilir"
    ON activity_logs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM student_profiles sp WHERE sp.id = student_id AND sp.user_id = auth.uid()
        )
    );

-- AI Recommendations RLS
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "AI önerileri görülebilir" ON ai_recommendations;
CREATE POLICY "AI önerileri görülebilir"
    ON ai_recommendations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM student_profiles sp WHERE sp.id = student_id AND sp.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM coaching_relationships cr 
            JOIN teacher_profiles tp ON tp.id = cr.coach_id 
            WHERE cr.student_id = ai_recommendations.student_id 
            AND cr.status = 'active' 
            AND tp.user_id = auth.uid()
        )
    );

-- Parent Students RLS
ALTER TABLE parent_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Veli-öğrenci ilişkileri görülebilir" ON parent_students;
CREATE POLICY "Veli-öğrenci ilişkileri görülebilir"
    ON parent_students FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM parent_profiles pp WHERE pp.id = parent_id AND pp.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM student_profiles sp WHERE sp.id = student_id AND sp.user_id = auth.uid()
        )
    );


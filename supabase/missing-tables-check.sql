-- =====================================================
-- EKSİK TABLOLARI KONTROL ET VE OLUŞTUR
-- =====================================================

-- 1. NOTIFICATIONS - Bildirimler
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_select" ON notifications;
CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "notifications_update" ON notifications;
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- 2. CLASSROOMS - Sınıflar
CREATE TABLE IF NOT EXISTS classrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    grade INTEGER,
    subject TEXT,
    class_code VARCHAR(10) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "classrooms_select" ON classrooms;
CREATE POLICY "classrooms_select" ON classrooms FOR SELECT USING (true);
DROP POLICY IF EXISTS "classrooms_insert" ON classrooms;
CREATE POLICY "classrooms_insert" ON classrooms FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "classrooms_update" ON classrooms;
CREATE POLICY "classrooms_update" ON classrooms FOR UPDATE USING (true);

-- 3. CLASSROOM_STUDENTS - Sınıf öğrencileri
CREATE TABLE IF NOT EXISTS classroom_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(classroom_id, student_id)
);

ALTER TABLE classroom_students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "classroom_students_select" ON classroom_students;
CREATE POLICY "classroom_students_select" ON classroom_students FOR SELECT USING (true);
DROP POLICY IF EXISTS "classroom_students_insert" ON classroom_students;
CREATE POLICY "classroom_students_insert" ON classroom_students FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "classroom_students_delete" ON classroom_students;
CREATE POLICY "classroom_students_delete" ON classroom_students FOR DELETE USING (true);

-- 4. ASSIGNMENTS - Ödevler
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teacher_profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    question_ids UUID[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "assignments_select" ON assignments;
CREATE POLICY "assignments_select" ON assignments FOR SELECT USING (true);
DROP POLICY IF EXISTS "assignments_insert" ON assignments;
CREATE POLICY "assignments_insert" ON assignments FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "assignments_update" ON assignments;
CREATE POLICY "assignments_update" ON assignments FOR UPDATE USING (true);

-- 5. ASSIGNMENT_RESPONSES - Ödev cevapları
CREATE TABLE IF NOT EXISTS assignment_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    answers JSONB,
    score INTEGER,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(assignment_id, student_id)
);

ALTER TABLE assignment_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "assignment_responses_select" ON assignment_responses;
CREATE POLICY "assignment_responses_select" ON assignment_responses FOR SELECT USING (true);
DROP POLICY IF EXISTS "assignment_responses_insert" ON assignment_responses;
CREATE POLICY "assignment_responses_insert" ON assignment_responses FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "assignment_responses_update" ON assignment_responses;
CREATE POLICY "assignment_responses_update" ON assignment_responses FOR UPDATE USING (true);

-- 6. MATERIALS - Materyaller
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES teacher_profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    type VARCHAR(50),
    file_url TEXT,
    thumbnail_url TEXT,
    subject TEXT,
    grade INTEGER,
    is_public BOOLEAN DEFAULT FALSE,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "materials_select" ON materials;
CREATE POLICY "materials_select" ON materials FOR SELECT USING (true);
DROP POLICY IF EXISTS "materials_insert" ON materials;
CREATE POLICY "materials_insert" ON materials FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "materials_update" ON materials;
CREATE POLICY "materials_update" ON materials FOR UPDATE USING (true);

-- 7. CLASSROOM_MATERIALS - Sınıf materyalleri
CREATE TABLE IF NOT EXISTS classroom_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(classroom_id, material_id)
);

ALTER TABLE classroom_materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "classroom_materials_select" ON classroom_materials;
CREATE POLICY "classroom_materials_select" ON classroom_materials FOR SELECT USING (true);
DROP POLICY IF EXISTS "classroom_materials_insert" ON classroom_materials;
CREATE POLICY "classroom_materials_insert" ON classroom_materials FOR INSERT TO authenticated WITH CHECK (true);

-- 8. CLASSROOM_ANNOUNCEMENTS - Sınıf duyuruları
CREATE TABLE IF NOT EXISTS classroom_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teacher_profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE classroom_announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "classroom_announcements_select" ON classroom_announcements;
CREATE POLICY "classroom_announcements_select" ON classroom_announcements FOR SELECT USING (true);
DROP POLICY IF EXISTS "classroom_announcements_insert" ON classroom_announcements;
CREATE POLICY "classroom_announcements_insert" ON classroom_announcements FOR INSERT TO authenticated WITH CHECK (true);

-- 9. REVIEWS - Koç değerlendirmeleri
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(coach_id, student_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reviews_select" ON reviews;
CREATE POLICY "reviews_select" ON reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "reviews_insert" ON reviews;
CREATE POLICY "reviews_insert" ON reviews FOR INSERT TO authenticated WITH CHECK (true);

-- 10. MESSAGES - Mesajlar
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "messages_select" ON messages;
CREATE POLICY "messages_select" ON messages FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
);
DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_insert" ON messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
DROP POLICY IF EXISTS "messages_update" ON messages;
CREATE POLICY "messages_update" ON messages FOR UPDATE USING (auth.uid() = receiver_id);

-- 11. PARENT_REPORTS - Veli raporları
CREATE TABLE IF NOT EXISTS parent_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES parent_profiles(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES teacher_profiles(id) ON DELETE SET NULL,
    report_type VARCHAR(50),
    content TEXT,
    period_start DATE,
    period_end DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE parent_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "parent_reports_select" ON parent_reports;
CREATE POLICY "parent_reports_select" ON parent_reports FOR SELECT USING (true);
DROP POLICY IF EXISTS "parent_reports_insert" ON parent_reports;
CREATE POLICY "parent_reports_insert" ON parent_reports FOR INSERT TO authenticated WITH CHECK (true);

-- 12. LGS_MOCK_EXAMS - LGS Deneme sınavları
CREATE TABLE IF NOT EXISTS lgs_mock_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    question_ids UUID[],
    time_limit INTEGER DEFAULT 120,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE lgs_mock_exams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lgs_mock_exams_select" ON lgs_mock_exams;
CREATE POLICY "lgs_mock_exams_select" ON lgs_mock_exams FOR SELECT USING (true);

-- 13. MOCK_EXAM_ANSWERS - Deneme cevapları
CREATE TABLE IF NOT EXISTS mock_exam_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES lgs_mock_exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    answers JSONB,
    score INTEGER,
    correct_count INTEGER,
    wrong_count INTEGER,
    empty_count INTEGER,
    time_spent INTEGER,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_id, student_id)
);

ALTER TABLE mock_exam_answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mock_exam_answers_select" ON mock_exam_answers;
CREATE POLICY "mock_exam_answers_select" ON mock_exam_answers FOR SELECT USING (true);
DROP POLICY IF EXISTS "mock_exam_answers_insert" ON mock_exam_answers;
CREATE POLICY "mock_exam_answers_insert" ON mock_exam_answers FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "mock_exam_answers_update" ON mock_exam_answers;
CREATE POLICY "mock_exam_answers_update" ON mock_exam_answers FOR UPDATE USING (true);

-- 14. AI_QUESTIONS - AI soruları (cache)
CREATE TABLE IF NOT EXISTS ai_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic TEXT,
    subject TEXT,
    grade INTEGER,
    difficulty VARCHAR(20),
    question_text TEXT NOT NULL,
    options JSONB,
    correct_answer VARCHAR(1),
    explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ai_questions_select" ON ai_questions;
CREATE POLICY "ai_questions_select" ON ai_questions FOR SELECT USING (true);
DROP POLICY IF EXISTS "ai_questions_insert" ON ai_questions;
CREATE POLICY "ai_questions_insert" ON ai_questions FOR INSERT TO authenticated WITH CHECK (true);

-- 15. LGS_QUESTIONS - LGS soruları
CREATE TABLE IF NOT EXISTS lgs_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject TEXT NOT NULL,
    topic TEXT,
    question_text TEXT NOT NULL,
    options JSONB,
    correct_answer VARCHAR(1),
    explanation TEXT,
    difficulty VARCHAR(20),
    year INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE lgs_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lgs_questions_select" ON lgs_questions;
CREATE POLICY "lgs_questions_select" ON lgs_questions FOR SELECT USING (true);

-- 16. QUESTION_SOLUTIONS - Soru çözümleri
CREATE TABLE IF NOT EXISTS question_solutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    solution_text TEXT,
    video_url TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE question_solutions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "question_solutions_select" ON question_solutions;
CREATE POLICY "question_solutions_select" ON question_solutions FOR SELECT USING (true);
DROP POLICY IF EXISTS "question_solutions_insert" ON question_solutions;
CREATE POLICY "question_solutions_insert" ON question_solutions FOR INSERT TO authenticated WITH CHECK (true);

-- 17. AI_USAGE_STATS - AI kullanım istatistikleri
CREATE TABLE IF NOT EXISTS ai_usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    feature VARCHAR(50) NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_usage_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ai_usage_stats_select" ON ai_usage_stats;
CREATE POLICY "ai_usage_stats_select" ON ai_usage_stats FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "ai_usage_stats_insert" ON ai_usage_stats;
CREATE POLICY "ai_usage_stats_insert" ON ai_usage_stats FOR INSERT TO authenticated WITH CHECK (true);

-- 18. AI_GENERATED_CONTENT - AI üretilen içerik
CREATE TABLE IF NOT EXISTS ai_generated_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    content_type VARCHAR(50),
    prompt TEXT,
    response TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_generated_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ai_generated_content_select" ON ai_generated_content;
CREATE POLICY "ai_generated_content_select" ON ai_generated_content FOR SELECT USING (true);
DROP POLICY IF EXISTS "ai_generated_content_insert" ON ai_generated_content;
CREATE POLICY "ai_generated_content_insert" ON ai_generated_content FOR INSERT TO authenticated WITH CHECK (true);

-- 19. STUDENT_BADGES - Öğrenci rozetleri (eski sistem)
CREATE TABLE IF NOT EXISTS student_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    badge_type VARCHAR(50) NOT NULL,
    badge_name TEXT,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, badge_type)
);

ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "student_badges_select" ON student_badges;
CREATE POLICY "student_badges_select" ON student_badges FOR SELECT USING (true);
DROP POLICY IF EXISTS "student_badges_insert" ON student_badges;
CREATE POLICY "student_badges_insert" ON student_badges FOR INSERT TO authenticated WITH CHECK (true);

-- =====================================================
-- INDEX'LER
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_classrooms_teacher ON classrooms(teacher_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);

-- =====================================================
-- TAMAMLANDI!
-- =====================================================

SELECT 'Eksik tablolar kontrol edildi ve oluşturuldu!' as message;

-- Tüm tabloları listele
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;


-- =====================================================
-- EKSİK TABLOLARI OLUŞTUR (DÜZELTİLMİŞ VERSİYON)
-- =====================================================

-- 1. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_all" ON notifications;
CREATE POLICY "notifications_all" ON notifications FOR ALL USING (true);

-- 2. CLASSROOMS
CREATE TABLE IF NOT EXISTS classrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID,
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
DROP POLICY IF EXISTS "classrooms_all" ON classrooms;
CREATE POLICY "classrooms_all" ON classrooms FOR ALL USING (true);

-- 3. CLASSROOM_STUDENTS
CREATE TABLE IF NOT EXISTS classroom_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID,
    student_id UUID,
    joined_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE classroom_students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "classroom_students_all" ON classroom_students;
CREATE POLICY "classroom_students_all" ON classroom_students FOR ALL USING (true);

-- 4. ASSIGNMENTS
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID,
    teacher_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    question_ids UUID[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "assignments_all" ON assignments;
CREATE POLICY "assignments_all" ON assignments FOR ALL USING (true);

-- 5. ASSIGNMENT_RESPONSES
CREATE TABLE IF NOT EXISTS assignment_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID,
    student_id UUID,
    answers JSONB,
    score INTEGER,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE assignment_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "assignment_responses_all" ON assignment_responses;
CREATE POLICY "assignment_responses_all" ON assignment_responses FOR ALL USING (true);

-- 6. MATERIALS
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID,
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
DROP POLICY IF EXISTS "materials_all" ON materials;
CREATE POLICY "materials_all" ON materials FOR ALL USING (true);

-- 7. CLASSROOM_MATERIALS
CREATE TABLE IF NOT EXISTS classroom_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID,
    material_id UUID,
    added_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE classroom_materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "classroom_materials_all" ON classroom_materials;
CREATE POLICY "classroom_materials_all" ON classroom_materials FOR ALL USING (true);

-- 8. CLASSROOM_ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS classroom_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID,
    teacher_id UUID,
    title TEXT NOT NULL,
    content TEXT,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE classroom_announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "classroom_announcements_all" ON classroom_announcements;
CREATE POLICY "classroom_announcements_all" ON classroom_announcements FOR ALL USING (true);

-- 9. REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID,
    student_id UUID,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reviews_all" ON reviews;
CREATE POLICY "reviews_all" ON reviews FOR ALL USING (true);

-- 10. MESSAGES
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID,
    receiver_id UUID,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "messages_all" ON messages;
CREATE POLICY "messages_all" ON messages FOR ALL USING (true);

-- 11. PARENT_REPORTS
CREATE TABLE IF NOT EXISTS parent_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID,
    student_id UUID,
    coach_id UUID,
    report_type VARCHAR(50),
    content TEXT,
    period_start DATE,
    period_end DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE parent_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "parent_reports_all" ON parent_reports;
CREATE POLICY "parent_reports_all" ON parent_reports FOR ALL USING (true);

-- 12. LGS_MOCK_EXAMS
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
DROP POLICY IF EXISTS "lgs_mock_exams_all" ON lgs_mock_exams;
CREATE POLICY "lgs_mock_exams_all" ON lgs_mock_exams FOR ALL USING (true);

-- 13. MOCK_EXAM_ANSWERS
CREATE TABLE IF NOT EXISTS mock_exam_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID,
    student_id UUID,
    answers JSONB,
    score INTEGER,
    correct_count INTEGER,
    wrong_count INTEGER,
    empty_count INTEGER,
    time_spent INTEGER,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mock_exam_answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mock_exam_answers_all" ON mock_exam_answers;
CREATE POLICY "mock_exam_answers_all" ON mock_exam_answers FOR ALL USING (true);

-- 14. AI_QUESTIONS
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
DROP POLICY IF EXISTS "ai_questions_all" ON ai_questions;
CREATE POLICY "ai_questions_all" ON ai_questions FOR ALL USING (true);

-- 15. LGS_QUESTIONS
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
DROP POLICY IF EXISTS "lgs_questions_all" ON lgs_questions;
CREATE POLICY "lgs_questions_all" ON lgs_questions FOR ALL USING (true);

-- 16. QUESTION_SOLUTIONS
CREATE TABLE IF NOT EXISTS question_solutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID,
    solution_text TEXT,
    video_url TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE question_solutions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "question_solutions_all" ON question_solutions;
CREATE POLICY "question_solutions_all" ON question_solutions FOR ALL USING (true);

-- 17. AI_USAGE_STATS
CREATE TABLE IF NOT EXISTS ai_usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    feature VARCHAR(50) NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_usage_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ai_usage_stats_all" ON ai_usage_stats;
CREATE POLICY "ai_usage_stats_all" ON ai_usage_stats FOR ALL USING (true);

-- 18. AI_GENERATED_CONTENT
CREATE TABLE IF NOT EXISTS ai_generated_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    content_type VARCHAR(50),
    prompt TEXT,
    response TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_generated_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ai_generated_content_all" ON ai_generated_content;
CREATE POLICY "ai_generated_content_all" ON ai_generated_content FOR ALL USING (true);

-- 19. STUDENT_BADGES
CREATE TABLE IF NOT EXISTS student_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID,
    badge_type VARCHAR(50) NOT NULL,
    badge_name TEXT,
    earned_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "student_badges_all" ON student_badges;
CREATE POLICY "student_badges_all" ON student_badges FOR ALL USING (true);

-- =====================================================
-- INDEX'LER
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_teacher ON classrooms(teacher_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_student_badges_student ON student_badges(student_id);

-- =====================================================
-- TAMAMLANDI!
-- =====================================================

SELECT 'Tüm tablolar başarıyla oluşturuldu!' as message;


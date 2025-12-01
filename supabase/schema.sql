-- =====================================================
-- TEKNOKUL VERİTABANI ŞEMASI
-- Koçluk platformu için gerekli tüm tablolar
-- =====================================================

-- 1. PROFILES (Ana kullanıcı profili)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL CHECK (role IN ('ogrenci', 'ogretmen', 'veli', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TEACHER_PROFILES (Öğretmen/Koç profili)
CREATE TABLE IF NOT EXISTS teacher_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    bio TEXT,
    subjects TEXT[] DEFAULT '{}',
    experience_years INTEGER DEFAULT 0,
    hourly_rate DECIMAL(10,2) DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 5.00,
    total_reviews INTEGER DEFAULT 0,
    is_coach BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STUDENT_PROFILES (Öğrenci profili)
CREATE TABLE IF NOT EXISTS student_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    grade INTEGER,
    target_exam TEXT,
    school TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PARENT_PROFILES (Veli profili)
CREATE TABLE IF NOT EXISTS parent_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PARENT_STUDENTS (Veli-Öğrenci ilişkisi)
CREATE TABLE IF NOT EXISTS parent_students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID REFERENCES parent_profiles(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(parent_id, student_id)
);

-- 6. COACHING_RELATIONSHIPS (Koç-Öğrenci ilişkisi)
CREATE TABLE IF NOT EXISTS coaching_relationships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coach_id UUID REFERENCES teacher_profiles(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'ended')),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(coach_id, student_id)
);

-- 7. TASKS (Görevler)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coach_id UUID REFERENCES teacher_profiles(id) ON DELETE SET NULL,
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE NOT NULL,
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

-- 8. EXAM_RESULTS (Deneme sonuçları)
CREATE TABLE IF NOT EXISTS exam_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE NOT NULL,
    exam_name TEXT NOT NULL,
    exam_date DATE NOT NULL,
    image_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES profiles(id),
    total_correct INTEGER,
    total_wrong INTEGER,
    total_empty INTEGER,
    net_score DECIMAL(10,2),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ACTIVITY_LOGS (Aktivite kayıtları)
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE NOT NULL,
    activity_type TEXT NOT NULL,
    subject TEXT,
    correct_count INTEGER DEFAULT 0,
    wrong_count INTEGER DEFAULT 0,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. SUBJECTS (Dersler)
CREATE TABLE IF NOT EXISTS subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT
);

-- 11. MESSAGES (Mesajlar)
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
    receiver_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. NOTIFICATIONS (Bildirimler)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. AI_RECOMMENDATIONS (AI önerileri)
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE NOT NULL,
    recommendation_type TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    is_dismissed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TRIGGER: Yeni kullanıcı oluşturulduğunda profil oluştur
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    user_name TEXT;
BEGIN
    -- Kullanıcı meta verilerinden rol ve isim al
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'ogrenci');
    user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
    
    -- Ana profil oluştur
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (NEW.id, NEW.email, user_name, user_role);
    
    -- Role göre ek profil oluştur
    IF user_role = 'ogretmen' THEN
        INSERT INTO public.teacher_profiles (user_id, is_coach)
        VALUES (NEW.id, true);
    ELSIF user_role = 'ogrenci' THEN
        INSERT INTO public.student_profiles (user_id)
        VALUES (NEW.id);
    ELSIF user_role = 'veli' THEN
        INSERT INTO public.parent_profiles (user_id)
        VALUES (NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı oluştur (eğer yoksa)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLİTİKALARI
-- =====================================================

-- Profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiller herkes tarafından görülebilir"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Kullanıcılar kendi profilini güncelleyebilir"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Teacher Profiles RLS
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Öğretmen profilleri herkes tarafından görülebilir"
    ON teacher_profiles FOR SELECT
    USING (true);

CREATE POLICY "Öğretmenler kendi profilini güncelleyebilir"
    ON teacher_profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Student Profiles RLS
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Öğrenci profilleri görülebilir"
    ON student_profiles FOR SELECT
    USING (true);

CREATE POLICY "Öğrenciler kendi profilini güncelleyebilir"
    ON student_profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Coaching Relationships RLS
ALTER TABLE coaching_relationships ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Öğrenciler koçluk başvurusu yapabilir"
    ON coaching_relationships FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM student_profiles sp WHERE sp.id = student_id AND sp.user_id = auth.uid()
        )
    );

CREATE POLICY "Koçlar ilişkiyi güncelleyebilir"
    ON coaching_relationships FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM teacher_profiles tp WHERE tp.id = coach_id AND tp.user_id = auth.uid()
        )
    );

-- Tasks RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Koçlar görev oluşturabilir"
    ON tasks FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM teacher_profiles tp WHERE tp.id = coach_id AND tp.user_id = auth.uid()
        )
    );

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

CREATE POLICY "Öğrenciler sonuç yükleyebilir"
    ON exam_results FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM student_profiles sp WHERE sp.id = student_id AND sp.user_id = auth.uid()
        )
    );

-- Messages RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mesajlar ilgili kişilerce görülebilir"
    ON messages FOR SELECT
    USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Kullanıcılar mesaj gönderebilir"
    ON messages FOR INSERT
    WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Mesajlar okundu olarak işaretlenebilir"
    ON messages FOR UPDATE
    USING (receiver_id = auth.uid());

-- Notifications RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bildirimler kullanıcı tarafından görülebilir"
    ON notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Bildirimler okundu olarak işaretlenebilir"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid());

-- AI Recommendations RLS
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

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

-- Activity Logs RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Öğrenciler aktivite kaydedebilir"
    ON activity_logs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM student_profiles sp WHERE sp.id = student_id AND sp.user_id = auth.uid()
        )
    );

-- Subjects herkese açık
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dersler herkes tarafından görülebilir"
    ON subjects FOR SELECT
    USING (true);

-- =====================================================
-- ÖRNEK VERİLER: Dersler
-- =====================================================
INSERT INTO subjects (name, category) VALUES
    ('Matematik', 'Sayısal'),
    ('Fizik', 'Sayısal'),
    ('Kimya', 'Sayısal'),
    ('Biyoloji', 'Sayısal'),
    ('Türkçe', 'Sözel'),
    ('Edebiyat', 'Sözel'),
    ('Tarih', 'Sözel'),
    ('Coğrafya', 'Sözel'),
    ('İngilizce', 'Dil'),
    ('Almanca', 'Dil'),
    ('Felsefe', 'Sözel'),
    ('Geometri', 'Sayısal')
ON CONFLICT (name) DO NOTHING;


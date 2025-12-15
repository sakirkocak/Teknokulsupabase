-- =====================================================
-- TEKNOKUL OYUNLAŞTIRMA SİSTEMİ
-- Liderlik, Rozet, Avatar ve Düello Tabloları
-- =====================================================

-- =====================================================
-- 1. LOKASYON BİLGİLERİ
-- =====================================================

-- Türkiye illeri tablosu
CREATE TABLE IF NOT EXISTS turkey_cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    plate_code INTEGER UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Türkiye ilçeleri tablosu
CREATE TABLE IF NOT EXISTS turkey_districts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID REFERENCES turkey_cities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(city_id, name)
);

-- Okullar tablosu
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    city_id UUID REFERENCES turkey_cities(id),
    district_id UUID REFERENCES turkey_districts(id),
    school_type TEXT CHECK (school_type IN ('ilkokul', 'ortaokul', 'lise', 'kolej')),
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- student_profiles tablosuna yeni alanlar ekle
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS grade INTEGER;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES turkey_cities(id);
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES turkey_districts(id);
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_student_profiles_city ON student_profiles(city_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_district ON student_profiles(district_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_school ON student_profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_grade ON student_profiles(grade);
CREATE INDEX IF NOT EXISTS idx_schools_city ON schools(city_id);
CREATE INDEX IF NOT EXISTS idx_schools_district ON schools(district_id);
CREATE INDEX IF NOT EXISTS idx_turkey_districts_city ON turkey_districts(city_id);

-- =====================================================
-- 2. ROZET SİSTEMİ
-- =====================================================

-- Rozetler tablosu
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL, -- emoji veya icon adı
    category TEXT NOT NULL CHECK (category IN ('streak', 'points', 'subject', 'special', 'rank')),
    requirement_type TEXT NOT NULL, -- total_points, total_correct, max_streak, subject_points, rank
    requirement_value INTEGER NOT NULL,
    requirement_subject TEXT, -- Ders bazlı rozetler için
    tier TEXT CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
    points_reward INTEGER DEFAULT 0, -- Rozet kazanınca verilen bonus puan
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Öğrenci rozetleri
CREATE TABLE IF NOT EXISTS student_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, badge_id)
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_student_badges_student ON student_badges(student_id);
CREATE INDEX IF NOT EXISTS idx_student_badges_badge ON student_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category);

-- =====================================================
-- 3. AVATAR SİSTEMİ
-- =====================================================

-- Avatar öğeleri
CREATE TABLE IF NOT EXISTS avatar_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('head', 'face', 'body', 'accessory', 'background', 'frame')),
    image_url TEXT,
    rarity TEXT CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    unlock_type TEXT NOT NULL CHECK (unlock_type IN ('default', 'points', 'badge', 'streak', 'rank', 'event', 'purchase')),
    unlock_value INTEGER DEFAULT 0, -- points için puan, streak için seri, rank için sıralama
    unlock_badge_id UUID REFERENCES badges(id), -- badge için gerekli rozet
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Öğrenci avatarları
CREATE TABLE IF NOT EXISTS student_avatars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE UNIQUE,
    equipped_head UUID REFERENCES avatar_items(id),
    equipped_face UUID REFERENCES avatar_items(id),
    equipped_body UUID REFERENCES avatar_items(id),
    equipped_accessory UUID REFERENCES avatar_items(id),
    equipped_background UUID REFERENCES avatar_items(id),
    equipped_frame UUID REFERENCES avatar_items(id),
    unlocked_items UUID[] DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_avatar_items_category ON avatar_items(category);
CREATE INDEX IF NOT EXISTS idx_avatar_items_rarity ON avatar_items(rarity);
CREATE INDEX IF NOT EXISTS idx_student_avatars_student ON student_avatars(student_id);

-- =====================================================
-- 4. DÜELLO SİSTEMİ
-- =====================================================

-- Düellolar
CREATE TABLE IF NOT EXISTS duels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenger_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    opponent_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    subject TEXT, -- Null ise karışık
    question_count INTEGER DEFAULT 5,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'expired')),
    challenger_score INTEGER DEFAULT 0,
    opponent_score INTEGER DEFAULT 0,
    challenger_answers JSONB DEFAULT '[]',
    opponent_answers JSONB DEFAULT '[]',
    winner_id UUID REFERENCES student_profiles(id),
    question_ids UUID[] DEFAULT '{}',
    current_question INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Düello istatistikleri
CREATE TABLE IF NOT EXISTS duel_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE UNIQUE,
    total_duels INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    win_streak INTEGER DEFAULT 0,
    max_win_streak INTEGER DEFAULT 0,
    total_points_earned INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_duels_challenger ON duels(challenger_id);
CREATE INDEX IF NOT EXISTS idx_duels_opponent ON duels(opponent_id);
CREATE INDEX IF NOT EXISTS idx_duels_status ON duels(status);
CREATE INDEX IF NOT EXISTS idx_duel_stats_student ON duel_stats(student_id);

-- =====================================================
-- 5. SEZON SİSTEMİ
-- =====================================================

-- Sezonlar
CREATE TABLE IF NOT EXISTS seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    rewards JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sezon sıralaması
CREATE TABLE IF NOT EXISTS season_rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    final_rank INTEGER,
    rewards_claimed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(season_id, student_id)
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_seasons_active ON seasons(is_active);
CREATE INDEX IF NOT EXISTS idx_season_rankings_season ON season_rankings(season_id);
CREATE INDEX IF NOT EXISTS idx_season_rankings_student ON season_rankings(student_id);

-- =====================================================
-- 6. GÜNLÜK GÖREVLER
-- =====================================================

-- Günlük görev tanımları
CREATE TABLE IF NOT EXISTS daily_quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    quest_type TEXT NOT NULL, -- solve_questions, correct_streak, subject_questions, login
    target_value INTEGER NOT NULL,
    target_subject TEXT, -- Ders bazlı görevler için
    points_reward INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Öğrenci günlük görev ilerlemesi
CREATE TABLE IF NOT EXISTS student_daily_quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    quest_id UUID REFERENCES daily_quests(id) ON DELETE CASCADE,
    quest_date DATE DEFAULT CURRENT_DATE,
    current_progress INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    reward_claimed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, quest_id, quest_date)
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_daily_quests_active ON daily_quests(is_active);
CREATE INDEX IF NOT EXISTS idx_student_daily_quests_student ON student_daily_quests(student_id);
CREATE INDEX IF NOT EXISTS idx_student_daily_quests_date ON student_daily_quests(quest_date);

-- =====================================================
-- 7. LİG SİSTEMİ
-- =====================================================

-- Ligler
CREATE TABLE IF NOT EXISTS leagues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    min_points INTEGER NOT NULL,
    max_points INTEGER,
    icon TEXT,
    color TEXT,
    tier INTEGER NOT NULL, -- 1: Bronz, 2: Gümüş, 3: Altın, 4: Platin, 5: Elmas, 6: Efsane
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. RLS POLİTİKALARI
-- =====================================================

-- Turkey Cities RLS
ALTER TABLE turkey_cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "turkey_cities_select" ON turkey_cities FOR SELECT USING (true);

-- Turkey Districts RLS
ALTER TABLE turkey_districts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "turkey_districts_select" ON turkey_districts FOR SELECT USING (true);

-- Schools RLS
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schools_select" ON schools FOR SELECT USING (true);
CREATE POLICY "schools_insert" ON schools FOR INSERT TO authenticated WITH CHECK (true);

-- Badges RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges_select" ON badges FOR SELECT USING (true);

-- Student Badges RLS
ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student_badges_select" ON student_badges FOR SELECT USING (true);
CREATE POLICY "student_badges_insert" ON student_badges FOR INSERT TO authenticated 
    WITH CHECK (EXISTS (SELECT 1 FROM student_profiles sp WHERE sp.id = student_id AND sp.user_id = auth.uid()));

-- Avatar Items RLS
ALTER TABLE avatar_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "avatar_items_select" ON avatar_items FOR SELECT USING (true);

-- Student Avatars RLS
ALTER TABLE student_avatars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student_avatars_select" ON student_avatars FOR SELECT USING (true);
CREATE POLICY "student_avatars_insert" ON student_avatars FOR INSERT TO authenticated 
    WITH CHECK (EXISTS (SELECT 1 FROM student_profiles sp WHERE sp.id = student_id AND sp.user_id = auth.uid()));
CREATE POLICY "student_avatars_update" ON student_avatars FOR UPDATE TO authenticated 
    USING (EXISTS (SELECT 1 FROM student_profiles sp WHERE sp.id = student_id AND sp.user_id = auth.uid()));

-- Duels RLS
ALTER TABLE duels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "duels_select" ON duels FOR SELECT USING (true);
CREATE POLICY "duels_insert" ON duels FOR INSERT TO authenticated 
    WITH CHECK (EXISTS (SELECT 1 FROM student_profiles sp WHERE sp.id = challenger_id AND sp.user_id = auth.uid()));
CREATE POLICY "duels_update" ON duels FOR UPDATE TO authenticated 
    USING (
        EXISTS (SELECT 1 FROM student_profiles sp WHERE sp.id = challenger_id AND sp.user_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM student_profiles sp WHERE sp.id = opponent_id AND sp.user_id = auth.uid())
    );

-- Duel Stats RLS
ALTER TABLE duel_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "duel_stats_select" ON duel_stats FOR SELECT USING (true);
CREATE POLICY "duel_stats_upsert" ON duel_stats FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM student_profiles sp WHERE sp.id = student_id AND sp.user_id = auth.uid()));

-- Seasons RLS
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seasons_select" ON seasons FOR SELECT USING (true);

-- Season Rankings RLS
ALTER TABLE season_rankings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "season_rankings_select" ON season_rankings FOR SELECT USING (true);

-- Daily Quests RLS
ALTER TABLE daily_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_quests_select" ON daily_quests FOR SELECT USING (true);

-- Student Daily Quests RLS
ALTER TABLE student_daily_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student_daily_quests_select" ON student_daily_quests FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM student_profiles sp WHERE sp.id = student_id AND sp.user_id = auth.uid()));
CREATE POLICY "student_daily_quests_insert" ON student_daily_quests FOR INSERT TO authenticated 
    WITH CHECK (EXISTS (SELECT 1 FROM student_profiles sp WHERE sp.id = student_id AND sp.user_id = auth.uid()));
CREATE POLICY "student_daily_quests_update" ON student_daily_quests FOR UPDATE TO authenticated 
    USING (EXISTS (SELECT 1 FROM student_profiles sp WHERE sp.id = student_id AND sp.user_id = auth.uid()));

-- Leagues RLS
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leagues_select" ON leagues FOR SELECT USING (true);

-- =====================================================
-- 9. VARSAYILAN VERİLER
-- =====================================================

-- Türkiye İlleri (81 il)
INSERT INTO turkey_cities (name, plate_code) VALUES
('Adana', 1), ('Adıyaman', 2), ('Afyonkarahisar', 3), ('Ağrı', 4), ('Amasya', 5),
('Ankara', 6), ('Antalya', 7), ('Artvin', 8), ('Aydın', 9), ('Balıkesir', 10),
('Bilecik', 11), ('Bingöl', 12), ('Bitlis', 13), ('Bolu', 14), ('Burdur', 15),
('Bursa', 16), ('Çanakkale', 17), ('Çankırı', 18), ('Çorum', 19), ('Denizli', 20),
('Diyarbakır', 21), ('Edirne', 22), ('Elazığ', 23), ('Erzincan', 24), ('Erzurum', 25),
('Eskişehir', 26), ('Gaziantep', 27), ('Giresun', 28), ('Gümüşhane', 29), ('Hakkari', 30),
('Hatay', 31), ('Isparta', 32), ('Mersin', 33), ('İstanbul', 34), ('İzmir', 35),
('Kars', 36), ('Kastamonu', 37), ('Kayseri', 38), ('Kırklareli', 39), ('Kırşehir', 40),
('Kocaeli', 41), ('Konya', 42), ('Kütahya', 43), ('Malatya', 44), ('Manisa', 45),
('Kahramanmaraş', 46), ('Mardin', 47), ('Muğla', 48), ('Muş', 49), ('Nevşehir', 50),
('Niğde', 51), ('Ordu', 52), ('Rize', 53), ('Sakarya', 54), ('Samsun', 55),
('Siirt', 56), ('Sinop', 57), ('Sivas', 58), ('Tekirdağ', 59), ('Tokat', 60),
('Trabzon', 61), ('Tunceli', 62), ('Şanlıurfa', 63), ('Uşak', 64), ('Van', 65),
('Yozgat', 66), ('Zonguldak', 67), ('Aksaray', 68), ('Bayburt', 69), ('Karaman', 70),
('Kırıkkale', 71), ('Batman', 72), ('Şırnak', 73), ('Bartın', 74), ('Ardahan', 75),
('Iğdır', 76), ('Yalova', 77), ('Karabük', 78), ('Kilis', 79), ('Osmaniye', 80),
('Düzce', 81)
ON CONFLICT (name) DO NOTHING;

-- Ligler
INSERT INTO leagues (name, min_points, max_points, icon, color, tier) VALUES
('Bronz', 0, 499, '🥉', '#CD7F32', 1),
('Gümüş', 500, 1499, '🥈', '#C0C0C0', 2),
('Altın', 1500, 3499, '🥇', '#FFD700', 3),
('Platin', 3500, 6999, '💎', '#E5E4E2', 4),
('Elmas', 7000, 14999, '💠', '#B9F2FF', 5),
('Efsane', 15000, NULL, '👑', '#FF6B6B', 6)
ON CONFLICT DO NOTHING;

-- Rozetler - Streak
INSERT INTO badges (name, description, icon, category, requirement_type, requirement_value, tier, points_reward) VALUES
('İlk Adım', '5 soruyu üst üste doğru cevapla', '🔥', 'streak', 'max_streak', 5, 'bronze', 10),
('Ateşli Başlangıç', '10 soruyu üst üste doğru cevapla', '🔥', 'streak', 'max_streak', 10, 'silver', 25),
('Durdurulamaz', '25 soruyu üst üste doğru cevapla', '⚡', 'streak', 'max_streak', 25, 'gold', 50),
('Efsane Seri', '50 soruyu üst üste doğru cevapla', '💫', 'streak', 'max_streak', 50, 'platinum', 100),
('Tanrısal Seri', '100 soruyu üst üste doğru cevapla', '🌟', 'streak', 'max_streak', 100, 'diamond', 250)
ON CONFLICT DO NOTHING;

-- Rozetler - Puan
INSERT INTO badges (name, description, icon, category, requirement_type, requirement_value, tier, points_reward) VALUES
('Yeni Başlayan', '100 puan topla', '⭐', 'points', 'total_points', 100, 'bronze', 5),
('Çalışkan Öğrenci', '500 puan topla', '⭐', 'points', 'total_points', 500, 'silver', 20),
('Puan Avcısı', '1000 puan topla', '🌟', 'points', 'total_points', 1000, 'gold', 50),
('Puan Ustası', '5000 puan topla', '💫', 'points', 'total_points', 5000, 'platinum', 150),
('Puan Efsanesi', '10000 puan topla', '👑', 'points', 'total_points', 10000, 'diamond', 500)
ON CONFLICT DO NOTHING;

-- Rozetler - Soru Sayısı
INSERT INTO badges (name, description, icon, category, requirement_type, requirement_value, tier, points_reward) VALUES
('Meraklı', '50 soru çöz', '📚', 'special', 'total_questions', 50, 'bronze', 10),
('Araştırmacı', '200 soru çöz', '📖', 'special', 'total_questions', 200, 'silver', 30),
('Bilge', '500 soru çöz', '🎓', 'special', 'total_questions', 500, 'gold', 75),
('Ansiklopedi', '1000 soru çöz', '📕', 'special', 'total_questions', 1000, 'platinum', 200),
('Soru Canavarı', '5000 soru çöz', '🐉', 'special', 'total_questions', 5000, 'diamond', 500)
ON CONFLICT DO NOTHING;

-- Rozetler - Ders Bazlı (Matematik)
INSERT INTO badges (name, description, icon, category, requirement_type, requirement_value, requirement_subject, tier, points_reward) VALUES
('Matematik Öğrencisi', 'Matematikte 100 puan topla', '🔢', 'subject', 'subject_points', 100, 'Matematik', 'bronze', 10),
('Matematik Meraklısı', 'Matematikte 500 puan topla', '➕', 'subject', 'subject_points', 500, 'Matematik', 'silver', 30),
('Matematik Ustası', 'Matematikte 1000 puan topla', '🧮', 'subject', 'subject_points', 1000, 'Matematik', 'gold', 75),
('Matematik Dahisi', 'Matematikte 3000 puan topla', '🏆', 'subject', 'subject_points', 3000, 'Matematik', 'platinum', 200)
ON CONFLICT DO NOTHING;

-- Rozetler - Ders Bazlı (Türkçe)
INSERT INTO badges (name, description, icon, category, requirement_type, requirement_value, requirement_subject, tier, points_reward) VALUES
('Türkçe Öğrencisi', 'Türkçede 100 puan topla', '📝', 'subject', 'subject_points', 100, 'Türkçe', 'bronze', 10),
('Dil Meraklısı', 'Türkçede 500 puan topla', '✍️', 'subject', 'subject_points', 500, 'Türkçe', 'silver', 30),
('Edebiyat Ustası', 'Türkçede 1000 puan topla', '📜', 'subject', 'subject_points', 1000, 'Türkçe', 'gold', 75),
('Söz Ustası', 'Türkçede 3000 puan topla', '🎭', 'subject', 'subject_points', 3000, 'Türkçe', 'platinum', 200)
ON CONFLICT DO NOTHING;

-- Rozetler - Ders Bazlı (Fen)
INSERT INTO badges (name, description, icon, category, requirement_type, requirement_value, requirement_subject, tier, points_reward) VALUES
('Fen Öğrencisi', 'Fen Bilimlerinde 100 puan topla', '🔬', 'subject', 'subject_points', 100, 'Fen Bilimleri', 'bronze', 10),
('Bilim Meraklısı', 'Fen Bilimlerinde 500 puan topla', '🧪', 'subject', 'subject_points', 500, 'Fen Bilimleri', 'silver', 30),
('Bilim İnsanı', 'Fen Bilimlerinde 1000 puan topla', '⚗️', 'subject', 'subject_points', 1000, 'Fen Bilimleri', 'gold', 75),
('Fen Dahisi', 'Fen Bilimlerinde 3000 puan topla', '🧬', 'subject', 'subject_points', 3000, 'Fen Bilimleri', 'platinum', 200)
ON CONFLICT DO NOTHING;

-- Rozetler - Sıralama
INSERT INTO badges (name, description, icon, category, requirement_type, requirement_value, tier, points_reward) VALUES
('Sınıf Lideri', 'Sınıfında 1. ol', '🏅', 'rank', 'class_rank', 1, 'gold', 50),
('Okul Şampiyonu', 'Okulunda 1. ol', '🏆', 'rank', 'school_rank', 1, 'platinum', 100),
('İlçe Yıldızı', 'İlçende 1. ol', '⭐', 'rank', 'district_rank', 1, 'platinum', 200),
('İl Efsanesi', 'İlinde 1. ol', '🌟', 'rank', 'city_rank', 1, 'diamond', 500),
('Türkiye Birincisi', 'Türkiyede 1. ol', '👑', 'rank', 'turkey_rank', 1, 'diamond', 1000)
ON CONFLICT DO NOTHING;

-- Rozetler - Düello
INSERT INTO badges (name, description, icon, category, requirement_type, requirement_value, tier, points_reward) VALUES
('İlk Düello', 'İlk düelloyu kazan', '⚔️', 'special', 'duel_wins', 1, 'bronze', 15),
('Düello Ustası', '10 düello kazan', '🗡️', 'special', 'duel_wins', 10, 'silver', 50),
('Düello Şampiyonu', '50 düello kazan', '🏅', 'special', 'duel_wins', 50, 'gold', 150),
('Yenilmez', '5 düelloyu üst üste kazan', '💪', 'special', 'duel_win_streak', 5, 'gold', 100)
ON CONFLICT DO NOTHING;

-- Günlük Görevler
INSERT INTO daily_quests (name, description, quest_type, target_value, points_reward) VALUES
('Günlük Pratik', '5 soru çöz', 'solve_questions', 5, 10),
('Çalışkan Arı', '15 soru çöz', 'solve_questions', 15, 25),
('Soru Makinesi', '30 soru çöz', 'solve_questions', 30, 50),
('Mükemmel Seri', '3 soruyu üst üste doğru cevapla', 'correct_streak', 3, 15),
('Süper Seri', '10 soruyu üst üste doğru cevapla', 'correct_streak', 10, 40)
ON CONFLICT DO NOTHING;

-- Ders bazlı günlük görevler
INSERT INTO daily_quests (name, description, quest_type, target_value, target_subject, points_reward) VALUES
('Matematik Günü', '5 matematik sorusu çöz', 'subject_questions', 5, 'Matematik', 15),
('Türkçe Günü', '5 Türkçe sorusu çöz', 'subject_questions', 5, 'Türkçe', 15),
('Fen Günü', '5 Fen sorusu çöz', 'subject_questions', 5, 'Fen Bilimleri', 15)
ON CONFLICT DO NOTHING;

-- Avatar Öğeleri - Default
INSERT INTO avatar_items (name, description, category, rarity, unlock_type, unlock_value) VALUES
-- Backgrounds (default)
('Mavi Gökyüzü', 'Varsayılan mavi arka plan', 'background', 'common', 'default', 0),
('Yeşil Orman', 'Huzurlu orman arka planı', 'background', 'common', 'default', 0),
-- Backgrounds (unlock)
('Gece Gökyüzü', 'Yıldızlı gece arka planı', 'background', 'uncommon', 'points', 100),
('Uzay', 'Galaktik uzay arka planı', 'background', 'rare', 'points', 500),
('Altın Parıltı', 'Parlak altın arka plan', 'background', 'epic', 'points', 2000),
('Efsanevi Aura', 'Mistik enerji arka planı', 'background', 'legendary', 'streak', 50),
-- Frames
('Basit Çerçeve', 'Varsayılan çerçeve', 'frame', 'common', 'default', 0),
('Bronz Çerçeve', 'Bronz renkli çerçeve', 'frame', 'uncommon', 'points', 200),
('Gümüş Çerçeve', 'Gümüş renkli çerçeve', 'frame', 'rare', 'points', 750),
('Altın Çerçeve', 'Altın renkli çerçeve', 'frame', 'epic', 'points', 1500),
('Elmas Çerçeve', 'Pırıl pırıl elmas çerçeve', 'frame', 'legendary', 'points', 5000),
-- Accessories
('Gözlük', 'Klasik gözlük', 'accessory', 'common', 'default', 0),
('Güneş Gözlüğü', 'Havalı güneş gözlüğü', 'accessory', 'uncommon', 'points', 150),
('Taç', 'Kraliyet tacı', 'accessory', 'legendary', 'rank', 1)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 10. HİYERARŞİK LİDERLİK VİEW'LARI
-- =====================================================

-- Sınıf Liderliği (aynı okul + aynı sınıf)
CREATE OR REPLACE VIEW leaderboard_by_classroom AS
SELECT 
    sp.id as student_id,
    p.full_name,
    p.avatar_url,
    sp.grade,
    sp.school_id,
    s.name as school_name,
    spt.total_points,
    spt.total_questions,
    spt.total_correct,
    spt.total_wrong,
    spt.max_streak,
    ROUND(CASE WHEN spt.total_questions > 0 THEN (spt.total_correct::DECIMAL / spt.total_questions) * 100 ELSE 0 END, 1) as success_rate,
    ROW_NUMBER() OVER (PARTITION BY sp.school_id, sp.grade ORDER BY spt.total_points DESC) as class_rank
FROM student_profiles sp
JOIN profiles p ON sp.user_id = p.id
JOIN student_points spt ON sp.id = spt.student_id
LEFT JOIN schools s ON sp.school_id = s.id
WHERE spt.total_questions > 0 AND sp.school_id IS NOT NULL AND sp.grade IS NOT NULL;

-- Okul Liderliği
CREATE OR REPLACE VIEW leaderboard_by_school AS
SELECT 
    sp.id as student_id,
    p.full_name,
    p.avatar_url,
    sp.grade,
    sp.school_id,
    s.name as school_name,
    sp.city_id,
    tc.name as city_name,
    sp.district_id,
    td.name as district_name,
    spt.total_points,
    spt.total_questions,
    spt.total_correct,
    spt.max_streak,
    ROUND(CASE WHEN spt.total_questions > 0 THEN (spt.total_correct::DECIMAL / spt.total_questions) * 100 ELSE 0 END, 1) as success_rate,
    ROW_NUMBER() OVER (PARTITION BY sp.school_id ORDER BY spt.total_points DESC) as school_rank
FROM student_profiles sp
JOIN profiles p ON sp.user_id = p.id
JOIN student_points spt ON sp.id = spt.student_id
LEFT JOIN schools s ON sp.school_id = s.id
LEFT JOIN turkey_cities tc ON sp.city_id = tc.id
LEFT JOIN turkey_districts td ON sp.district_id = td.id
WHERE spt.total_questions > 0 AND sp.school_id IS NOT NULL;

-- İlçe Liderliği
CREATE OR REPLACE VIEW leaderboard_by_district AS
SELECT 
    sp.id as student_id,
    p.full_name,
    p.avatar_url,
    sp.grade,
    sp.school_id,
    s.name as school_name,
    sp.district_id,
    td.name as district_name,
    sp.city_id,
    tc.name as city_name,
    spt.total_points,
    spt.total_questions,
    spt.total_correct,
    spt.max_streak,
    ROUND(CASE WHEN spt.total_questions > 0 THEN (spt.total_correct::DECIMAL / spt.total_questions) * 100 ELSE 0 END, 1) as success_rate,
    ROW_NUMBER() OVER (PARTITION BY sp.district_id ORDER BY spt.total_points DESC) as district_rank
FROM student_profiles sp
JOIN profiles p ON sp.user_id = p.id
JOIN student_points spt ON sp.id = spt.student_id
LEFT JOIN schools s ON sp.school_id = s.id
LEFT JOIN turkey_cities tc ON sp.city_id = tc.id
LEFT JOIN turkey_districts td ON sp.district_id = td.id
WHERE spt.total_questions > 0 AND sp.district_id IS NOT NULL;

-- İl Liderliği
CREATE OR REPLACE VIEW leaderboard_by_city AS
SELECT 
    sp.id as student_id,
    p.full_name,
    p.avatar_url,
    sp.grade,
    sp.city_id,
    tc.name as city_name,
    spt.total_points,
    spt.total_questions,
    spt.total_correct,
    spt.max_streak,
    ROUND(CASE WHEN spt.total_questions > 0 THEN (spt.total_correct::DECIMAL / spt.total_questions) * 100 ELSE 0 END, 1) as success_rate,
    ROW_NUMBER() OVER (PARTITION BY sp.city_id ORDER BY spt.total_points DESC) as city_rank
FROM student_profiles sp
JOIN profiles p ON sp.user_id = p.id
JOIN student_points spt ON sp.id = spt.student_id
LEFT JOIN turkey_cities tc ON sp.city_id = tc.id
WHERE spt.total_questions > 0 AND sp.city_id IS NOT NULL;

-- Türkiye Liderliği
CREATE OR REPLACE VIEW leaderboard_turkey AS
SELECT 
    sp.id as student_id,
    p.full_name,
    p.avatar_url,
    sp.grade,
    sp.city_id,
    tc.name as city_name,
    sp.district_id,
    td.name as district_name,
    sp.school_id,
    s.name as school_name,
    spt.total_points,
    spt.total_questions,
    spt.total_correct,
    spt.max_streak,
    ROUND(CASE WHEN spt.total_questions > 0 THEN (spt.total_correct::DECIMAL / spt.total_questions) * 100 ELSE 0 END, 1) as success_rate,
    ROW_NUMBER() OVER (ORDER BY spt.total_points DESC) as turkey_rank
FROM student_profiles sp
JOIN profiles p ON sp.user_id = p.id
JOIN student_points spt ON sp.id = spt.student_id
LEFT JOIN schools s ON sp.school_id = s.id
LEFT JOIN turkey_cities tc ON sp.city_id = tc.id
LEFT JOIN turkey_districts td ON sp.district_id = td.id
WHERE spt.total_questions > 0
ORDER BY spt.total_points DESC
LIMIT 1000;

-- =====================================================
-- 11. ROZET KONTROL FONKSİYONU
-- =====================================================

CREATE OR REPLACE FUNCTION check_and_award_badges(p_student_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_badge RECORD;
    v_awarded INTEGER := 0;
    v_student_points RECORD;
    v_meets_requirement BOOLEAN;
BEGIN
    -- Öğrenci puanlarını al
    SELECT * INTO v_student_points
    FROM student_points
    WHERE student_id = p_student_id;

    IF NOT FOUND THEN
        RETURN 0;
    END IF;

    -- Her rozeti kontrol et
    FOR v_badge IN SELECT * FROM badges WHERE is_active = true LOOP
        -- Zaten kazanılmış mı kontrol et
        IF EXISTS (SELECT 1 FROM student_badges WHERE student_id = p_student_id AND badge_id = v_badge.id) THEN
            CONTINUE;
        END IF;

        v_meets_requirement := false;

        -- Requirement type'a göre kontrol
        CASE v_badge.requirement_type
            WHEN 'total_points' THEN
                v_meets_requirement := v_student_points.total_points >= v_badge.requirement_value;
            WHEN 'total_correct' THEN
                v_meets_requirement := v_student_points.total_correct >= v_badge.requirement_value;
            WHEN 'total_questions' THEN
                v_meets_requirement := v_student_points.total_questions >= v_badge.requirement_value;
            WHEN 'max_streak' THEN
                v_meets_requirement := v_student_points.max_streak >= v_badge.requirement_value;
            WHEN 'subject_points' THEN
                CASE v_badge.requirement_subject
                    WHEN 'Matematik' THEN
                        v_meets_requirement := v_student_points.matematik_points >= v_badge.requirement_value;
                    WHEN 'Türkçe' THEN
                        v_meets_requirement := v_student_points.turkce_points >= v_badge.requirement_value;
                    WHEN 'Fen Bilimleri' THEN
                        v_meets_requirement := v_student_points.fen_points >= v_badge.requirement_value;
                    ELSE
                        v_meets_requirement := false;
                END CASE;
            ELSE
                v_meets_requirement := false;
        END CASE;

        -- Rozeti ver
        IF v_meets_requirement THEN
            INSERT INTO student_badges (student_id, badge_id)
            VALUES (p_student_id, v_badge.id)
            ON CONFLICT DO NOTHING;

            -- Bonus puan ekle
            IF v_badge.points_reward > 0 THEN
                UPDATE student_points
                SET total_points = total_points + v_badge.points_reward,
                    updated_at = NOW()
                WHERE student_id = p_student_id;
            END IF;

            v_awarded := v_awarded + 1;
        END IF;
    END LOOP;

    RETURN v_awarded;
END;
$$;

-- =====================================================
-- 12. LİG BELİRLEME FONKSİYONU
-- =====================================================

CREATE OR REPLACE FUNCTION get_student_league(p_points INTEGER)
RETURNS TABLE(league_id UUID, league_name TEXT, league_icon TEXT, league_color TEXT, league_tier INTEGER)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT l.id, l.name, l.icon, l.color, l.tier
    FROM leagues l
    WHERE l.min_points <= p_points
    AND (l.max_points IS NULL OR l.max_points >= p_points)
    ORDER BY l.tier DESC
    LIMIT 1;
END;
$$;


-- Duels tablosuna eksik kolonları ekle

-- Subject kolonu
ALTER TABLE duels ADD COLUMN IF NOT EXISTS subject TEXT;

-- Question IDs kolonu (eğer yoksa)
ALTER TABLE duels ADD COLUMN IF NOT EXISTS question_ids UUID[] DEFAULT '{}';

-- Current question kolonu
ALTER TABLE duels ADD COLUMN IF NOT EXISTS current_question INTEGER DEFAULT 0;

-- Challenger ve opponent answers kolonları
ALTER TABLE duels ADD COLUMN IF NOT EXISTS challenger_answers JSONB DEFAULT '[]';
ALTER TABLE duels ADD COLUMN IF NOT EXISTS opponent_answers JSONB DEFAULT '[]';

-- Expires at kolonu
ALTER TABLE duels ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Duels tablosunun tüm yapısını kontrol et
-- Eğer tablo yoksa yeniden oluştur
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'duels') THEN
        CREATE TABLE duels (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            challenger_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
            opponent_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
            subject TEXT,
            question_count INTEGER DEFAULT 5,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'expired')),
            challenger_score INTEGER DEFAULT 0,
            opponent_score INTEGER DEFAULT 0,
            challenger_answers JSONB DEFAULT '[]',
            opponent_answers JSONB DEFAULT '[]',
            winner_id UUID REFERENCES student_profiles(id) ON DELETE SET NULL,
            question_ids UUID[] DEFAULT '{}',
            current_question INTEGER DEFAULT 0,
            expires_at TIMESTAMPTZ,
            started_at TIMESTAMPTZ,
            completed_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;
END $$;

-- Duel Stats tablosunu kontrol et
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'duel_stats') THEN
        CREATE TABLE duel_stats (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            student_id UUID NOT NULL UNIQUE REFERENCES student_profiles(id) ON DELETE CASCADE,
            total_duels INTEGER DEFAULT 0,
            wins INTEGER DEFAULT 0,
            losses INTEGER DEFAULT 0,
            draws INTEGER DEFAULT 0,
            win_streak INTEGER DEFAULT 0,
            max_win_streak INTEGER DEFAULT 0,
            total_points_earned INTEGER DEFAULT 0,
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;
END $$;

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_duels_challenger ON duels(challenger_id);
CREATE INDEX IF NOT EXISTS idx_duels_opponent ON duels(opponent_id);
CREATE INDEX IF NOT EXISTS idx_duels_status ON duels(status);
CREATE INDEX IF NOT EXISTS idx_duel_stats_student ON duel_stats(student_id);

-- RLS Politikaları
ALTER TABLE duels ENABLE ROW LEVEL SECURITY;
ALTER TABLE duel_stats ENABLE ROW LEVEL SECURITY;

-- Herkes düelloları okuyabilir
DROP POLICY IF EXISTS "duels_select" ON duels;
CREATE POLICY "duels_select" ON duels FOR SELECT USING (true);

-- Authenticated kullanıcılar düello oluşturabilir
DROP POLICY IF EXISTS "duels_insert" ON duels;
CREATE POLICY "duels_insert" ON duels FOR INSERT TO authenticated WITH CHECK (true);

-- Düelloya dahil olanlar güncelleyebilir
DROP POLICY IF EXISTS "duels_update" ON duels;
CREATE POLICY "duels_update" ON duels FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM student_profiles sp 
        WHERE sp.user_id = auth.uid() 
        AND (sp.id = challenger_id OR sp.id = opponent_id)
    )
);

-- Duel stats
DROP POLICY IF EXISTS "duel_stats_select" ON duel_stats;
CREATE POLICY "duel_stats_select" ON duel_stats FOR SELECT USING (true);

DROP POLICY IF EXISTS "duel_stats_insert" ON duel_stats;
CREATE POLICY "duel_stats_insert" ON duel_stats FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM student_profiles WHERE id = student_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "duel_stats_update" ON duel_stats;
CREATE POLICY "duel_stats_update" ON duel_stats FOR UPDATE USING (
    EXISTS (SELECT 1 FROM student_profiles WHERE id = student_id AND user_id = auth.uid())
);

-- İstatistik kaydı yoksa oluşturan fonksiyon
CREATE OR REPLACE FUNCTION ensure_duel_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Challenger için
    INSERT INTO duel_stats (student_id)
    VALUES (NEW.challenger_id)
    ON CONFLICT (student_id) DO NOTHING;
    
    -- Opponent için
    INSERT INTO duel_stats (student_id)
    VALUES (NEW.opponent_id)
    ON CONFLICT (student_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS ensure_duel_stats_trigger ON duels;
CREATE TRIGGER ensure_duel_stats_trigger
    AFTER INSERT ON duels
    FOR EACH ROW
    EXECUTE FUNCTION ensure_duel_stats();


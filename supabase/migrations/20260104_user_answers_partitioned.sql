-- =====================================================
-- USER_ANSWERS TABLOSU - RANGE PARTITIONING
-- Her soru cevabı ayrı kayıt edilir
-- AI Koç, zayıf konu analizi ve tekrar önerisi için kritik
-- Tahmini: 500M+ satır/yıl
-- =====================================================

-- 1. Ana tablo (partitioned by answered_at)
CREATE TABLE IF NOT EXISTS user_answers (
    id UUID DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    question_id UUID NOT NULL,
    selected_answer CHAR(1) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER,
    answered_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Composite primary key (partition key dahil olmak zorunda)
    PRIMARY KEY (id, answered_at)
) PARTITION BY RANGE (answered_at);

-- 2. 2025 Çeyrek Partitions
CREATE TABLE IF NOT EXISTS user_answers_2025_q1 PARTITION OF user_answers
    FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
    
CREATE TABLE IF NOT EXISTS user_answers_2025_q2 PARTITION OF user_answers
    FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');
    
CREATE TABLE IF NOT EXISTS user_answers_2025_q3 PARTITION OF user_answers
    FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');
    
CREATE TABLE IF NOT EXISTS user_answers_2025_q4 PARTITION OF user_answers
    FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');

-- 3. 2026 Çeyrek Partitions
CREATE TABLE IF NOT EXISTS user_answers_2026_q1 PARTITION OF user_answers
    FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
    
CREATE TABLE IF NOT EXISTS user_answers_2026_q2 PARTITION OF user_answers
    FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');
    
CREATE TABLE IF NOT EXISTS user_answers_2026_q3 PARTITION OF user_answers
    FOR VALUES FROM ('2026-07-01') TO ('2026-10-01');
    
CREATE TABLE IF NOT EXISTS user_answers_2026_q4 PARTITION OF user_answers
    FOR VALUES FROM ('2026-10-01') TO ('2027-01-01');

-- 4. Her partition için student_id index (en sık kullanılan sorgu)
CREATE INDEX IF NOT EXISTS idx_ua_2025_q1_student ON user_answers_2025_q1(student_id, answered_at DESC);
CREATE INDEX IF NOT EXISTS idx_ua_2025_q2_student ON user_answers_2025_q2(student_id, answered_at DESC);
CREATE INDEX IF NOT EXISTS idx_ua_2025_q3_student ON user_answers_2025_q3(student_id, answered_at DESC);
CREATE INDEX IF NOT EXISTS idx_ua_2025_q4_student ON user_answers_2025_q4(student_id, answered_at DESC);
CREATE INDEX IF NOT EXISTS idx_ua_2026_q1_student ON user_answers_2026_q1(student_id, answered_at DESC);
CREATE INDEX IF NOT EXISTS idx_ua_2026_q2_student ON user_answers_2026_q2(student_id, answered_at DESC);
CREATE INDEX IF NOT EXISTS idx_ua_2026_q3_student ON user_answers_2026_q3(student_id, answered_at DESC);
CREATE INDEX IF NOT EXISTS idx_ua_2026_q4_student ON user_answers_2026_q4(student_id, answered_at DESC);

-- 5. question_id index (soru bazlı analiz için)
CREATE INDEX IF NOT EXISTS idx_ua_2025_q1_question ON user_answers_2025_q1(question_id);
CREATE INDEX IF NOT EXISTS idx_ua_2025_q2_question ON user_answers_2025_q2(question_id);
CREATE INDEX IF NOT EXISTS idx_ua_2025_q3_question ON user_answers_2025_q3(question_id);
CREATE INDEX IF NOT EXISTS idx_ua_2025_q4_question ON user_answers_2025_q4(question_id);
CREATE INDEX IF NOT EXISTS idx_ua_2026_q1_question ON user_answers_2026_q1(question_id);
CREATE INDEX IF NOT EXISTS idx_ua_2026_q2_question ON user_answers_2026_q2(question_id);
CREATE INDEX IF NOT EXISTS idx_ua_2026_q3_question ON user_answers_2026_q3(question_id);
CREATE INDEX IF NOT EXISTS idx_ua_2026_q4_question ON user_answers_2026_q4(question_id);

-- 6. RLS Policies
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;

-- Öğrenci kendi cevaplarını görebilir
CREATE POLICY "user_answers_select_own" ON user_answers
FOR SELECT USING (
    student_id IN (
        SELECT id FROM student_profiles WHERE user_id = auth.uid()
    )
);

-- Öğrenci kendi cevaplarını ekleyebilir
CREATE POLICY "user_answers_insert_own" ON user_answers
FOR INSERT WITH CHECK (
    student_id IN (
        SELECT id FROM student_profiles WHERE user_id = auth.uid()
    )
);

-- Koç, öğrencisinin cevaplarını görebilir
CREATE POLICY "user_answers_coach_select" ON user_answers
FOR SELECT USING (
    student_id IN (
        SELECT cr.student_id 
        FROM coaching_relationships cr
        JOIN teacher_profiles tp ON tp.id = cr.coach_id
        WHERE tp.user_id = auth.uid() AND cr.status = 'active'
    )
);

-- =====================================================
-- PARTITION YÖNETİM FONKSİYONLARI
-- =====================================================

-- 7. Yeni çeyrek partition otomatik oluşturma
CREATE OR REPLACE FUNCTION create_next_quarter_partition()
RETURNS void AS $$
DECLARE
    next_quarter_start DATE;
    next_quarter_end DATE;
    partition_name TEXT;
    quarter_num INTEGER;
BEGIN
    -- Bir sonraki çeyreği hesapla
    next_quarter_start := DATE_TRUNC('quarter', CURRENT_DATE + INTERVAL '3 months');
    next_quarter_end := next_quarter_start + INTERVAL '3 months';
    quarter_num := EXTRACT(QUARTER FROM next_quarter_start);
    
    partition_name := 'user_answers_' || TO_CHAR(next_quarter_start, 'YYYY') || '_q' || quarter_num;
    
    -- Partition oluştur
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF user_answers FOR VALUES FROM (%L) TO (%L)',
        partition_name, next_quarter_start, next_quarter_end
    );
    
    -- Student index oluştur
    EXECUTE format(
        'CREATE INDEX IF NOT EXISTS idx_%s_student ON %I(student_id, answered_at DESC)',
        partition_name, partition_name
    );
    
    -- Question index oluştur
    EXECUTE format(
        'CREATE INDEX IF NOT EXISTS idx_%s_question ON %I(question_id)',
        partition_name, partition_name
    );
    
    RAISE NOTICE 'Created partition: %', partition_name;
END;
$$ LANGUAGE plpgsql;

-- 8. Eski partition'ları arşivleme fonksiyonu (opsiyonel)
CREATE OR REPLACE FUNCTION archive_old_partitions(keep_quarters INTEGER DEFAULT 8)
RETURNS INTEGER AS $$
DECLARE
    cutoff_date DATE;
    partition_record RECORD;
    archived_count INTEGER := 0;
BEGIN
    cutoff_date := DATE_TRUNC('quarter', CURRENT_DATE - (keep_quarters * 3 || ' months')::INTERVAL);
    
    -- Eski partition'ları listele (silme işlemi manuel yapılmalı)
    FOR partition_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE tablename LIKE 'user_answers_%'
        AND schemaname = 'public'
    LOOP
        RAISE NOTICE 'Partition found: % (check if older than %)', partition_record.tablename, cutoff_date;
        archived_count := archived_count + 1;
    END LOOP;
    
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_next_quarter_partition() TO authenticated;
GRANT EXECUTE ON FUNCTION archive_old_partitions(INTEGER) TO authenticated;


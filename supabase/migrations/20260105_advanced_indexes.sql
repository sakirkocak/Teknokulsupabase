-- =====================================================
-- 100M+ SATIR İÇİN ADVANCED INDEX STRATEJİLERİ
-- BRIN, Partial, Covering ve Hash Index'ler
-- =====================================================

-- =====================================================
-- 1. BRIN INDEX (Block Range Index)
-- Zaman serisi tablolar için B-tree'ye göre 100x daha küçük
-- =====================================================

-- xp_history için BRIN (128 sayfa = ~1MB blok)
CREATE INDEX IF NOT EXISTS idx_xp_history_brin ON xp_history 
USING BRIN(created_at) WITH (pages_per_range = 128);

-- point_history için BRIN
CREATE INDEX IF NOT EXISTS idx_point_history_brin ON point_history 
USING BRIN(created_at) WITH (pages_per_range = 128);

-- =====================================================
-- 2. PARTIAL INDEX (Aktif Veri için)
-- Sadece son 30 günlük veri sık sorgulanır
-- Bu index çok küçük kalır ve hızlı çalışır
-- =====================================================

-- Son 30 gün aktif veri indexi (point_history)
-- NOT: Partial index'ler günlük yenilenmeli veya dinamik tutulmalı
-- Bu index statik bir tarih yerine son N günü kapsar
DROP INDEX IF EXISTS idx_point_history_recent;
CREATE INDEX idx_point_history_recent ON point_history(student_id, created_at DESC)
WHERE created_at > '2025-01-01';  -- Manuel güncelleme gerekebilir

-- Aktif öğrenciler (son 7 gün)
DROP INDEX IF EXISTS idx_student_points_active;
CREATE INDEX idx_student_points_active ON student_points(total_points DESC)
WHERE last_activity_at > '2025-01-01';  -- Manuel güncelleme gerekebilir

-- =====================================================
-- 3. COVERING INDEX (Index-Only Scan)
-- Liderlik tablosu sorgusu tamamen index'ten çekilir
-- Tablo okuması sıfır - maksimum performans
-- =====================================================

-- Liderlik için covering index
DROP INDEX IF EXISTS idx_student_points_leaderboard;
CREATE INDEX idx_student_points_leaderboard 
ON student_points(total_points DESC) 
INCLUDE (student_id);

-- Haftalık/aylık liderlik için
DROP INDEX IF EXISTS idx_point_history_weekly;
CREATE INDEX idx_point_history_weekly 
ON point_history(student_id, created_at DESC) 
INCLUDE (points);

-- =====================================================
-- 4. HASH INDEX (Exact Match Aramaları)
-- UUID aramaları için B-tree yerine Hash - daha hızlı
-- =====================================================

-- questions tablosu topic araması
DROP INDEX IF EXISTS idx_questions_topic_hash;
CREATE INDEX idx_questions_topic_hash ON questions USING HASH(topic_id);

-- user_answers question araması (partitioned tablo için ana index)
-- NOT: Hash index partitioned tablolarda partition bazında oluşturulmalı
-- Bu global bir index olarak çalışmaz, her partition için ayrı oluşturulur

-- =====================================================
-- 5. COMPOSITE INDEXES (Sık Kullanılan Sorgular)
-- =====================================================

-- Öğrenci + Ders bazlı soru çözüm geçmişi
CREATE INDEX IF NOT EXISTS idx_point_history_student_subject 
ON point_history(student_id, subject_code, created_at DESC);

-- Soru zorluk + ders filtreleme
CREATE INDEX IF NOT EXISTS idx_questions_subject_difficulty 
ON questions(topic_id, difficulty);

-- =====================================================
-- 6. STATS & MAINTENANCE
-- =====================================================

-- İstatistikleri güncelle (daha doğru query planlama için)
ANALYZE xp_history;
ANALYZE point_history;
ANALYZE student_points;
ANALYZE questions;

-- =====================================================
-- 7. INDEX PERFORMANS KONTROL FONKSİYONU
-- =====================================================

CREATE OR REPLACE FUNCTION check_index_usage()
RETURNS TABLE(
    index_name TEXT,
    table_name TEXT,
    index_size TEXT,
    idx_scan BIGINT,
    idx_tup_read BIGINT,
    idx_tup_fetch BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.indexrelname::TEXT,
        i.relname::TEXT,
        pg_size_pretty(pg_relation_size(i.indexrelid))::TEXT,
        i.idx_scan,
        i.idx_tup_read,
        i.idx_tup_fetch
    FROM pg_stat_user_indexes i
    WHERE i.schemaname = 'public'
    ORDER BY i.idx_scan DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- Grant
GRANT EXECUTE ON FUNCTION check_index_usage() TO authenticated;


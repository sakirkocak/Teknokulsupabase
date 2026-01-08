-- =====================================================
-- Teknokul SEO İndeksleme Sistemi
-- 1 Milyon Sayfa için Akıllı İndeks Yönetimi
-- =====================================================

-- 1. Questions tablosuna SEO kolonları ekle
ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_indexed BOOLEAN DEFAULT false;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS index_score INTEGER DEFAULT 0;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS indexed_at TIMESTAMPTZ;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS index_reason TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS seo_description TEXT;

-- 2. İndeks skoru hesaplama fonksiyonu
CREATE OR REPLACE FUNCTION calculate_question_index_score(question_id UUID)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
    q RECORD;
BEGIN
    SELECT 
        q.*,
        COALESCE(q.times_answered, 0) as answer_count,
        COALESCE(q.video_status, 'none') as video_stat,
        COALESCE(q.ai_solution_text, '') as ai_solution
    INTO q
    FROM questions q
    WHERE q.id = question_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Video çözüm var: +50 puan
    IF q.video_stat = 'completed' THEN
        score := score + 50;
    END IF;
    
    -- AI çözüm var: +30 puan
    IF LENGTH(q.ai_solution) > 100 THEN
        score := score + 30;
    END IF;
    
    -- Açıklama var: +10 puan
    IF LENGTH(COALESCE(q.explanation, '')) > 50 THEN
        score := score + 10;
    END IF;
    
    -- Çözüm sayısı > 10: +20 puan
    IF q.answer_count > 10 THEN
        score := score + 20;
    ELSIF q.answer_count > 5 THEN
        score := score + 10;
    END IF;
    
    -- Görsel var: +10 puan
    IF q.question_image_url IS NOT NULL AND q.question_image_url != '' THEN
        score := score + 10;
    END IF;
    
    RETURN score;
END;
$$ LANGUAGE plpgsql;

-- 3. Soru indeks skorunu güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_question_index_status()
RETURNS TRIGGER AS $$
DECLARE
    new_score INTEGER;
    index_threshold INTEGER := 50; -- 50 puan = indeksle
BEGIN
    -- Skoru hesapla
    new_score := calculate_question_index_score(NEW.id);
    
    -- Skoru güncelle
    NEW.index_score := new_score;
    
    -- Eşik değeri geçtiyse indeksle
    IF new_score >= index_threshold AND NOT COALESCE(OLD.is_indexed, false) THEN
        NEW.is_indexed := true;
        NEW.indexed_at := NOW();
        NEW.index_reason := 'auto_score_' || new_score;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger oluştur (UPDATE'lerde çalışsın)
DROP TRIGGER IF EXISTS trigger_update_question_index ON questions;
CREATE TRIGGER trigger_update_question_index
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_question_index_status();

-- 5. Mevcut soruları skorla (batch halinde)
CREATE OR REPLACE FUNCTION batch_calculate_index_scores(batch_size INTEGER DEFAULT 1000)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
    q RECORD;
BEGIN
    FOR q IN 
        SELECT id FROM questions 
        WHERE index_score = 0 OR index_score IS NULL
        LIMIT batch_size
    LOOP
        UPDATE questions 
        SET index_score = calculate_question_index_score(id)
        WHERE id = q.id;
        updated_count := updated_count + 1;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- 6. İndeks istatistikleri view'ı
CREATE OR REPLACE VIEW seo_index_stats AS
SELECT 
    COUNT(*) as total_questions,
    COUNT(*) FILTER (WHERE is_indexed = true) as indexed_questions,
    COUNT(*) FILTER (WHERE is_indexed = false OR is_indexed IS NULL) as noindex_questions,
    ROUND(AVG(index_score)::numeric, 2) as avg_index_score,
    COUNT(*) FILTER (WHERE index_score >= 50) as ready_to_index,
    COUNT(*) FILTER (WHERE video_status = 'completed') as with_video,
    COUNT(*) FILTER (WHERE ai_solution_text IS NOT NULL AND ai_solution_text != '') as with_ai_solution
FROM questions;

-- 7. Performans indexleri
CREATE INDEX IF NOT EXISTS idx_questions_is_indexed ON questions(is_indexed) WHERE is_indexed = true;
CREATE INDEX IF NOT EXISTS idx_questions_index_score ON questions(index_score DESC);
CREATE INDEX IF NOT EXISTS idx_questions_indexed_at ON questions(indexed_at DESC) WHERE indexed_at IS NOT NULL;

-- 8. Manuel indeksleme fonksiyonu (Admin için)
CREATE OR REPLACE FUNCTION manual_index_question(question_id UUID, reason TEXT DEFAULT 'manual')
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE questions
    SET 
        is_indexed = true,
        indexed_at = NOW(),
        index_reason = reason
    WHERE id = question_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 9. Manuel noindex fonksiyonu (Admin için)
CREATE OR REPLACE FUNCTION manual_noindex_question(question_id UUID, reason TEXT DEFAULT 'manual_removed')
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE questions
    SET 
        is_indexed = false,
        indexed_at = NULL,
        index_reason = reason
    WHERE id = question_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 10. İndekslenecek soruları getiren fonksiyon (Sitemap için)
CREATE OR REPLACE FUNCTION get_indexed_questions(
    p_limit INTEGER DEFAULT 50000,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    topic_id UUID,
    subject_name TEXT,
    subject_code TEXT,
    topic_name TEXT,
    grade INTEGER,
    indexed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id,
        q.topic_id,
        s.name as subject_name,
        s.code as subject_code,
        t.main_topic as topic_name,
        t.grade,
        q.indexed_at,
        q.updated_at
    FROM questions q
    JOIN topics t ON q.topic_id = t.id
    JOIN subjects s ON t.subject_id = s.id
    WHERE q.is_indexed = true
    ORDER BY q.indexed_at DESC NULLS LAST
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 11. Topics tablosuna da SEO kolonları ekle
ALTER TABLE topics ADD COLUMN IF NOT EXISTS is_indexed BOOLEAN DEFAULT true;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS indexed_question_count INTEGER DEFAULT 0;

-- 12. Topic için indeksli soru sayısı güncelleme
CREATE OR REPLACE FUNCTION update_topic_indexed_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Eski topic'i güncelle
    IF OLD.topic_id IS NOT NULL THEN
        UPDATE topics 
        SET indexed_question_count = (
            SELECT COUNT(*) FROM questions 
            WHERE topic_id = OLD.topic_id AND is_indexed = true
        )
        WHERE id = OLD.topic_id;
    END IF;
    
    -- Yeni topic'i güncelle
    IF NEW.topic_id IS NOT NULL THEN
        UPDATE topics 
        SET indexed_question_count = (
            SELECT COUNT(*) FROM questions 
            WHERE topic_id = NEW.topic_id AND is_indexed = true
        )
        WHERE id = NEW.topic_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_topic_indexed_count ON questions;
CREATE TRIGGER trigger_update_topic_indexed_count
    AFTER UPDATE OF is_indexed ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_topic_indexed_count();

COMMENT ON COLUMN questions.is_indexed IS 'Google indeksinde görünüp görünmeyeceği';
COMMENT ON COLUMN questions.index_score IS 'SEO kalite skoru (0-100+)';
COMMENT ON COLUMN questions.indexed_at IS 'İndekse alınma tarihi';
COMMENT ON COLUMN questions.index_reason IS 'İndeksleme sebebi (auto_score_X, manual, video_added vb.)';

-- =====================================================
-- AI KOÇ CACHE SİSTEMİ
-- Gemini API çağrılarını azaltmak için cache alanları
-- =====================================================

-- ai_coach_stats tablosuna cache alanları ekle
ALTER TABLE ai_coach_stats 
ADD COLUMN IF NOT EXISTS analysis_summary TEXT,
ADD COLUMN IF NOT EXISTS analysis_updated_at TIMESTAMPTZ;

-- Motivasyon mesajları cache'i
ALTER TABLE ai_coach_stats 
ADD COLUMN IF NOT EXISTS motivational_messages JSONB DEFAULT '[]'::JSONB;

-- Weak/Strong subjects cache'i
ALTER TABLE ai_coach_stats 
ADD COLUMN IF NOT EXISTS cached_weak_subjects JSONB DEFAULT '[]'::JSONB,
ADD COLUMN IF NOT EXISTS cached_strong_subjects JSONB DEFAULT '[]'::JSONB;

COMMENT ON COLUMN ai_coach_stats.analysis_summary IS 'Gemini tarafından oluşturulan analiz özeti (12 saat cache)';
COMMENT ON COLUMN ai_coach_stats.analysis_updated_at IS 'Son analiz güncelleme zamanı';
COMMENT ON COLUMN ai_coach_stats.motivational_messages IS 'Cache''lenmiş motivasyon mesajları';
COMMENT ON COLUMN ai_coach_stats.cached_weak_subjects IS 'Cache''lenmiş zayıf konular';
COMMENT ON COLUMN ai_coach_stats.cached_strong_subjects IS 'Cache''lenmiş güçlü konular';


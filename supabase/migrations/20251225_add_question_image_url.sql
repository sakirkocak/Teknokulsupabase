-- Görüntülü sorular için image_url alanı ekle
-- Bu alan base64 encoded görüntü veya URL tutabilir

-- Questions tablosuna image_url alanı ekle (eğer yoksa)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'questions' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE questions ADD COLUMN image_url TEXT;
        COMMENT ON COLUMN questions.image_url IS 'Soru ile ilişkili görüntü (base64 veya URL)';
    END IF;
END $$;

-- AI tarafından üretildi işareti (eğer yoksa)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'questions' AND column_name = 'is_ai_generated'
    ) THEN
        ALTER TABLE questions ADD COLUMN is_ai_generated BOOLEAN DEFAULT false;
        COMMENT ON COLUMN questions.is_ai_generated IS 'AI tarafından üretilen soru mu?';
    END IF;
END $$;

-- Bloom taksonomisi seviyesi (eğer yoksa)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'questions' AND column_name = 'bloom_level'
    ) THEN
        ALTER TABLE questions ADD COLUMN bloom_level TEXT;
        COMMENT ON COLUMN questions.bloom_level IS 'Bloom taksonomisi seviyesi';
    END IF;
END $$;

-- Görüntülü soruları hızlı bulmak için index
CREATE INDEX IF NOT EXISTS idx_questions_image_url ON questions(image_url) WHERE image_url IS NOT NULL;

-- AI sorularını filtrelemek için index
CREATE INDEX IF NOT EXISTS idx_questions_ai_generated ON questions(is_ai_generated) WHERE is_ai_generated = true;


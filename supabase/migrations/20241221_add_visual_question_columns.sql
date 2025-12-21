-- Görsel Soru Desteği için Kolon Ekleme
-- Bu migration questions tablosuna görsel soru desteği ekler

-- image_data: SVG string veya Chart.js config JSON
-- image_type: 'svg' veya 'chart'
-- source: Sorunun kaynağı (ai_generator, visual_generator, manual)

ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS image_data TEXT,
ADD COLUMN IF NOT EXISTS image_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';

-- Index ekle (opsiyonel, performans için)
CREATE INDEX IF NOT EXISTS idx_questions_image_type ON questions(image_type) WHERE image_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_questions_source ON questions(source);

-- Yorum: Bu kolonlar görsel sorular için kullanılacak
-- image_type = 'svg' -> SVG XML string (geometri şekilleri)
-- image_type = 'chart' -> Chart.js config JSON (grafikler)


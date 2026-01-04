-- Yeni Nesil Sorular için visual_type ve visual_content kolonları
-- Bu kolonlar tablo, grafik, diyagram gibi görsel içerikler için kullanılacak

-- visual_type: 'table', 'chart', 'diagram', 'flowchart', 'pie', 'mixed', 'none'
-- visual_content: HTML/SVG içerik (tablo HTML, grafik SVG vb.)

ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS visual_type TEXT DEFAULT NULL;

ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS visual_content TEXT DEFAULT NULL;

-- İndeks ekle (visual_type üzerinden filtreleme için)
CREATE INDEX IF NOT EXISTS idx_questions_visual_type 
ON questions(visual_type) 
WHERE visual_type IS NOT NULL;

-- Yorum ekle
COMMENT ON COLUMN questions.visual_type IS 'Görsel içerik türü: table, chart, diagram, flowchart, pie, mixed, none';
COMMENT ON COLUMN questions.visual_content IS 'HTML/SVG formatında görsel içerik';

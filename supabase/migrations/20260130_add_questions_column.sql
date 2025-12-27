-- Düello sorularını saklamak için questions kolonu
ALTER TABLE duels ADD COLUMN IF NOT EXISTS questions jsonb DEFAULT '[]';

-- Index ekle (sorgulama için)
CREATE INDEX IF NOT EXISTS idx_duels_questions ON duels USING gin(questions);


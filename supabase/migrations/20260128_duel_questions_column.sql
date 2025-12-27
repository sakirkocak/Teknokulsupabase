-- Duels tablosuna questions JSONB kolonu ekle
-- Bu kolon düello sorularını saklar, böylece iki oyuncu da aynı soruları görür

ALTER TABLE duels ADD COLUMN IF NOT EXISTS questions jsonb DEFAULT '[]';
ALTER TABLE duels ADD COLUMN IF NOT EXISTS correct_answers jsonb DEFAULT '[]';

-- Index ekle
CREATE INDEX IF NOT EXISTS idx_duels_questions ON duels USING GIN (questions);

COMMENT ON COLUMN duels.questions IS 'Düello soruları JSON array formatında';
COMMENT ON COLUMN duels.correct_answers IS 'Doğru cevaplar array formatında';


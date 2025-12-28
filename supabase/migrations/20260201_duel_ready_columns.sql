-- Düello bekleme odası için ready durumları
ALTER TABLE duels ADD COLUMN IF NOT EXISTS challenger_ready boolean DEFAULT false;
ALTER TABLE duels ADD COLUMN IF NOT EXISTS opponent_ready boolean DEFAULT false;

-- Index
CREATE INDEX IF NOT EXISTS idx_duels_ready ON duels(challenger_ready, opponent_ready) WHERE status = 'pending';


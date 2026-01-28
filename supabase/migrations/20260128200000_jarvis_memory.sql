-- =====================================================
-- JARVIS Hafıza Sistemi
-- Oturumlar arası hafıza: konuşma özetleri, tercihler, dönüm noktaları
-- =====================================================

CREATE TABLE IF NOT EXISTS jarvis_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL CHECK (memory_type IN ('conversation_summary', 'preference', 'milestone')),
  content TEXT NOT NULL,
  subject_code TEXT,
  importance INTEGER DEFAULT 3 CHECK (importance BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_jarvis_memory_user ON jarvis_memory(user_id);
CREATE INDEX idx_jarvis_memory_type ON jarvis_memory(user_id, memory_type);
CREATE INDEX idx_jarvis_memory_importance ON jarvis_memory(user_id, importance DESC);
CREATE INDEX idx_jarvis_memory_expires ON jarvis_memory(expires_at) WHERE expires_at IS NOT NULL;

ALTER TABLE jarvis_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own memories" ON jarvis_memory
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memories" ON jarvis_memory
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own memories" ON jarvis_memory
  FOR DELETE USING (auth.uid() = user_id);

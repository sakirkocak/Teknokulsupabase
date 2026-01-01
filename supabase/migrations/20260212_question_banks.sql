-- ========================================================
-- SORU BANKASI PDF SİSTEMİ
-- Kullanıcılar kendi soru bankalarını oluşturabilir
-- ========================================================

-- Question Banks tablosu
CREATE TABLE IF NOT EXISTS question_banks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Temel bilgiler
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  
  -- Oluşturan (nullable - misafirler için)
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_name VARCHAR(100) DEFAULT 'Teknokul Kullanıcısı',
  ip_hash VARCHAR(64),
  
  -- İçerik kriterleri
  grade INT,
  exam_type VARCHAR(20),
  subject_code VARCHAR(10),
  subject_name VARCHAR(50),
  topics TEXT[],
  difficulty VARCHAR(20),
  
  -- Soru bilgileri
  question_count INT NOT NULL CHECK (question_count >= 10 AND question_count <= 200),
  question_ids UUID[],
  
  -- PDF
  pdf_url TEXT,
  pdf_size_kb INT,
  
  -- Yayın durumu
  is_public BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- İstatistikler
  view_count INT DEFAULT 0,
  download_count INT DEFAULT 0,
  
  -- SEO
  meta_title VARCHAR(70),
  meta_description VARCHAR(160),
  
  -- Zaman
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_question_banks_slug ON question_banks(slug);
CREATE INDEX IF NOT EXISTS idx_question_banks_public ON question_banks(is_public, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_banks_user ON question_banks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_banks_grade ON question_banks(grade);
CREATE INDEX IF NOT EXISTS idx_question_banks_subject ON question_banks(subject_code);
CREATE INDEX IF NOT EXISTS idx_question_banks_download ON question_banks(download_count DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_question_banks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_question_banks_updated_at ON question_banks;
CREATE TRIGGER trigger_question_banks_updated_at
  BEFORE UPDATE ON question_banks
  FOR EACH ROW
  EXECUTE FUNCTION update_question_banks_updated_at();

-- RLS Policies
ALTER TABLE question_banks ENABLE ROW LEVEL SECURITY;

-- Herkes public bankaları görebilir
DROP POLICY IF EXISTS "Public banks viewable" ON question_banks;
CREATE POLICY "Public banks viewable"
  ON question_banks FOR SELECT
  USING (is_public = true);

-- Kullanıcılar kendi bankalarını görebilir
DROP POLICY IF EXISTS "Users view own banks" ON question_banks;
CREATE POLICY "Users view own banks"
  ON question_banks FOR SELECT
  USING (auth.uid() = user_id);

-- Herkes banka oluşturabilir
DROP POLICY IF EXISTS "Anyone can create banks" ON question_banks;
CREATE POLICY "Anyone can create banks"
  ON question_banks FOR INSERT
  WITH CHECK (true);

-- Kullanıcılar kendi bankalarını güncelleyebilir
DROP POLICY IF EXISTS "Users update own banks" ON question_banks;
CREATE POLICY "Users update own banks"
  ON question_banks FOR UPDATE
  USING (auth.uid() = user_id);

-- Kullanıcılar kendi bankalarını silebilir
DROP POLICY IF EXISTS "Users delete own banks" ON question_banks;
CREATE POLICY "Users delete own banks"
  ON question_banks FOR DELETE
  USING (auth.uid() = user_id);

-- View count artırma
CREATE OR REPLACE FUNCTION increment_bank_view_count(bank_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE question_banks SET view_count = view_count + 1 WHERE id = bank_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Download count artırma
CREATE OR REPLACE FUNCTION increment_bank_download_count(bank_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE question_banks SET download_count = download_count + 1 WHERE id = bank_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rate limiting tablosu
CREATE TABLE IF NOT EXISTS question_bank_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_hash VARCHAR(64) NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  count INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ip_hash, date)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_date ON question_bank_rate_limits(ip_hash, date);

-- Rate limit kontrolü
CREATE OR REPLACE FUNCTION check_question_bank_rate_limit(
  p_ip_hash VARCHAR(64),
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(allowed BOOLEAN, remaining INT, limit_count INT) AS $$
DECLARE
  v_count INT;
  v_limit INT;
BEGIN
  IF p_user_id IS NULL THEN v_limit := 5; ELSE v_limit := 20; END IF;
  
  SELECT COALESCE(rl.count, 0) INTO v_count
  FROM question_bank_rate_limits rl
  WHERE rl.ip_hash = p_ip_hash AND rl.date = CURRENT_DATE;
  
  IF v_count IS NULL THEN v_count := 0; END IF;
  
  RETURN QUERY SELECT v_count < v_limit, GREATEST(0, v_limit - v_count), v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rate limit artırma
CREATE OR REPLACE FUNCTION increment_question_bank_rate_limit(
  p_ip_hash VARCHAR(64),
  p_user_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO question_bank_rate_limits (ip_hash, user_id, date, count)
  VALUES (p_ip_hash, p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (ip_hash, date) 
  DO UPDATE SET count = question_bank_rate_limits.count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE question_banks IS 'Kullanıcıların oluşturduğu PDF soru bankaları';

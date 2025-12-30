-- =====================================================
-- Anti-Bot Güvenlik Sistemi
-- Hesap askıya alma ve şüpheli aktivite takibi
-- =====================================================

-- 1. profiles tablosuna güvenlik alanları ekle
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_risk_check TIMESTAMPTZ;

-- 2. point_history tablosuna metadata alanı ekle (IP, user agent, cevap süresi)
ALTER TABLE point_history 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 3. Şüpheli aktivite logları tablosu
CREATE TABLE IF NOT EXISTS suspicious_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'rate_limit', 'too_fast', 'high_accuracy_speed', 'bot_detected'
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  risk_score INTEGER DEFAULT 0,
  action_taken TEXT, -- 'warning', 'blocked', 'suspended'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_suspicious_logs_user ON suspicious_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_suspicious_logs_created ON suspicious_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_suspicious_logs_type ON suspicious_activity_logs(activity_type);

-- 4. Quiz session tablosu (server-side soru takibi)
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  questions JSONB NOT NULL, -- [{id, shown_at, token, answered_at}]
  source TEXT DEFAULT 'quiz', -- 'quiz', 'recommended', 'quick_solve'
  total_questions INTEGER DEFAULT 0,
  answered_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user ON quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_expires ON quiz_sessions(expires_at);

-- 5. RPC: Şüpheli kullanıcıları listele (Admin paneli için)
CREATE OR REPLACE FUNCTION get_suspicious_users(p_hours INTEGER DEFAULT 24)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  email TEXT,
  total_questions INTEGER,
  total_correct INTEGER,
  accuracy_rate NUMERIC,
  questions_last_hour INTEGER,
  avg_answer_time_ms NUMERIC,
  risk_score INTEGER,
  is_suspended BOOLEAN,
  suspension_reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH recent_activity AS (
    SELECT 
      ph.student_id,
      COUNT(*) as question_count,
      COUNT(*) FILTER (WHERE ph.description = 'Doğru cevap') as correct_count,
      AVG((ph.metadata->>'answerTimeMs')::numeric) as avg_time
    FROM point_history ph
    WHERE ph.created_at > NOW() - (p_hours || ' hours')::interval
    GROUP BY ph.student_id
  )
  SELECT 
    p.id as user_id,
    p.full_name,
    p.email,
    COALESCE(sp.total_questions, 0)::INTEGER as total_questions,
    COALESCE(sp.total_correct, 0)::INTEGER as total_correct,
    CASE WHEN sp.total_questions > 0 
      THEN ROUND((sp.total_correct::numeric / sp.total_questions) * 100, 1)
      ELSE 0 
    END as accuracy_rate,
    COALESCE(ra.question_count, 0)::INTEGER as questions_last_hour,
    COALESCE(ra.avg_time, 0)::NUMERIC as avg_answer_time_ms,
    COALESCE(p.risk_score, 0)::INTEGER as risk_score,
    COALESCE(p.is_suspended, false) as is_suspended,
    p.suspension_reason
  FROM profiles p
  LEFT JOIN student_points sp ON sp.student_id = p.id
  LEFT JOIN recent_activity ra ON ra.student_id = p.id
  WHERE p.role = 'ogrenci'
    AND (
      -- Kriterlere göre şüpheli olanları getir
      ra.question_count > 50  -- 1 saatte 50+ soru
      OR ra.avg_time < 2000   -- Ortalama 2 saniyeden hızlı
      OR (sp.total_questions > 100 AND (sp.total_correct::numeric / sp.total_questions) > 0.95) -- Yüksek hacim + yüksek doğruluk
      OR p.is_suspended = true
      OR p.risk_score > 50
    )
  ORDER BY ra.question_count DESC NULLS LAST;
END;
$$;

-- 6. RPC: Kullanıcıyı askıya al
CREATE OR REPLACE FUNCTION suspend_user(
  p_user_id UUID,
  p_reason TEXT,
  p_admin_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET 
    is_suspended = true,
    suspension_reason = p_reason,
    suspended_at = NOW(),
    suspended_by = p_admin_id
  WHERE id = p_user_id;
  
  -- Log ekle
  INSERT INTO suspicious_activity_logs (user_id, activity_type, details, action_taken)
  VALUES (
    p_user_id, 
    'manual_suspension', 
    jsonb_build_object('reason', p_reason, 'admin_id', p_admin_id),
    'suspended'
  );
  
  RETURN true;
END;
$$;

-- 7. RPC: Askıyı kaldır
CREATE OR REPLACE FUNCTION unsuspend_user(
  p_user_id UUID,
  p_admin_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET 
    is_suspended = false,
    suspension_reason = NULL,
    suspended_at = NULL,
    suspended_by = NULL,
    risk_score = 0
  WHERE id = p_user_id;
  
  -- Log ekle
  INSERT INTO suspicious_activity_logs (user_id, activity_type, details, action_taken)
  VALUES (
    p_user_id, 
    'unsuspension', 
    jsonb_build_object('admin_id', p_admin_id),
    'unsuspended'
  );
  
  RETURN true;
END;
$$;

-- 8. RPC: Kullanıcı istatistiklerini getir (detaylı analiz)
CREATE OR REPLACE FUNCTION get_user_activity_details(p_user_id UUID)
RETURNS TABLE (
  hour_bucket TIMESTAMPTZ,
  question_count BIGINT,
  correct_count BIGINT,
  avg_answer_time_ms NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date_trunc('hour', ph.created_at) as hour_bucket,
    COUNT(*) as question_count,
    COUNT(*) FILTER (WHERE ph.description = 'Doğru cevap') as correct_count,
    AVG((ph.metadata->>'answerTimeMs')::numeric) as avg_answer_time_ms
  FROM point_history ph
  WHERE ph.student_id = p_user_id
    AND ph.created_at > NOW() - INTERVAL '7 days'
  GROUP BY date_trunc('hour', ph.created_at)
  ORDER BY hour_bucket DESC;
END;
$$;

-- 9. Askıya alınmış kullanıcıların girişini engelle (middleware için)
-- Bu fonksiyon middleware'de kontrol edilecek
CREATE OR REPLACE FUNCTION is_user_suspended(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_suspended BOOLEAN;
BEGIN
  SELECT is_suspended INTO v_suspended
  FROM profiles
  WHERE id = p_user_id;
  
  RETURN COALESCE(v_suspended, false);
END;
$$;

-- 10. Otomatik bot tespiti trigger'ı
-- Her 100 sorudan sonra risk skorunu güncelle
CREATE OR REPLACE FUNCTION update_risk_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_recent_count INTEGER;
  v_avg_time NUMERIC;
  v_accuracy NUMERIC;
  v_new_score INTEGER;
BEGIN
  -- Son 10 dakikadaki aktiviteyi kontrol et
  SELECT 
    COUNT(*),
    AVG((metadata->>'answerTimeMs')::numeric),
    (COUNT(*) FILTER (WHERE description = 'Doğru cevap'))::numeric / NULLIF(COUNT(*), 0) * 100
  INTO v_recent_count, v_avg_time, v_accuracy
  FROM point_history
  WHERE student_id = NEW.student_id
    AND created_at > NOW() - INTERVAL '10 minutes';
  
  -- Risk skorunu hesapla
  v_new_score := 0;
  
  -- 10 dakikada 30+ soru = +40 risk
  IF v_recent_count > 30 THEN
    v_new_score := v_new_score + LEAST(40, (v_recent_count - 30) * 4);
  END IF;
  
  -- Ortalama 2 saniyeden hızlı = +40 risk
  IF v_avg_time IS NOT NULL AND v_avg_time < 2000 THEN
    v_new_score := v_new_score + LEAST(40, ((2000 - v_avg_time) / 50)::integer);
  END IF;
  
  -- %95+ doğruluk + hız = +20 risk
  IF v_accuracy > 95 AND v_avg_time < 3000 THEN
    v_new_score := v_new_score + 20;
  END IF;
  
  -- Risk skorunu güncelle
  IF v_new_score > 0 THEN
    UPDATE profiles 
    SET 
      risk_score = LEAST(100, COALESCE(risk_score, 0) + v_new_score / 10), -- Yavaş artır
      last_risk_check = NOW()
    WHERE id = NEW.student_id;
    
    -- Yüksek risk = otomatik askıya al
    IF v_new_score >= 80 THEN
      UPDATE profiles
      SET 
        is_suspended = true,
        suspension_reason = 'Otomatik tespit - Bot şüphesi (Risk: ' || v_new_score || ')',
        suspended_at = NOW()
      WHERE id = NEW.student_id
        AND is_suspended = false;
      
      -- Log ekle
      INSERT INTO suspicious_activity_logs (user_id, activity_type, details, risk_score, action_taken)
      VALUES (
        NEW.student_id,
        'auto_detection',
        jsonb_build_object(
          'recent_count', v_recent_count,
          'avg_time', v_avg_time,
          'accuracy', v_accuracy
        ),
        v_new_score,
        'suspended'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger'ı oluştur (her 10 kayıtta bir çalışsın - performans için)
DROP TRIGGER IF EXISTS check_risk_score_trigger ON point_history;
CREATE TRIGGER check_risk_score_trigger
AFTER INSERT ON point_history
FOR EACH ROW
WHEN (NEW.id IS NOT NULL AND (SELECT COUNT(*) FROM point_history WHERE student_id = NEW.student_id) % 10 = 0)
EXECUTE FUNCTION update_risk_score();

-- =====================================================
-- Bilgilendirme
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Anti-bot güvenlik sistemi kuruldu!';
  RAISE NOTICE '📊 Yeni tablolar: suspicious_activity_logs, quiz_sessions';
  RAISE NOTICE '🔒 Yeni alanlar: profiles.is_suspended, risk_score';
  RAISE NOTICE '⚡ RPC fonksiyonları: get_suspicious_users, suspend_user, unsuspend_user';
END $$;

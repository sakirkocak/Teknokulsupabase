-- =====================================================
-- Geçmiş Bot/Hile Tespiti
-- Eski verilerdeki şüpheli aktiviteleri analiz eder
-- =====================================================

-- 1. Geçmişte şüpheli aktivite gösteren kullanıcıları tespit et
CREATE OR REPLACE FUNCTION get_historical_suspicious_users()
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ,
  total_questions INTEGER,
  total_correct INTEGER,
  total_points INTEGER,
  accuracy_rate NUMERIC,
  daily_average NUMERIC,
  days_since_registration INTEGER,
  suspicion_reasons TEXT[],
  risk_level TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      p.id,
      p.full_name,
      p.email,
      p.created_at,
      COALESCE(sp.total_questions, 0) as total_questions,
      COALESCE(sp.total_correct, 0) as total_correct,
      COALESCE(sp.total_points, 0) as total_points,
      CASE WHEN sp.total_questions > 0 
        THEN ROUND((sp.total_correct::numeric / sp.total_questions) * 100, 1)
        ELSE 0 
      END as accuracy_rate,
      GREATEST(1, EXTRACT(DAY FROM NOW() - p.created_at))::integer as days_active,
      ROUND(COALESCE(sp.total_questions, 0)::numeric / GREATEST(1, EXTRACT(DAY FROM NOW() - p.created_at)), 1) as daily_avg
    FROM profiles p
    LEFT JOIN student_points sp ON sp.student_id = p.id
    WHERE p.role = 'ogrenci'
  ),
  flagged_users AS (
    SELECT 
      us.*,
      ARRAY_REMOVE(ARRAY[
        -- Kriter 1: Çok yüksek soru sayısı (5000+)
        CASE WHEN us.total_questions > 5000 THEN 'Çok yüksek soru sayısı (' || us.total_questions || ')' END,
        -- Kriter 2: Anormal doğruluk oranı (1000+ soru ve %98+ doğruluk)
        CASE WHEN us.total_questions > 1000 AND us.accuracy_rate > 98 THEN 'Anormal doğruluk (%' || us.accuracy_rate || ')' END,
        -- Kriter 3: Yeni hesap + yüksek hacim (7 gün içinde 1000+ soru)
        CASE WHEN us.days_active <= 7 AND us.total_questions > 1000 THEN 'Yeni hesap + yüksek hacim' END,
        -- Kriter 4: Günlük ortalama çok yüksek (300+)
        CASE WHEN us.daily_avg > 300 THEN 'Günlük ortalama çok yüksek (' || us.daily_avg || ')' END,
        -- Kriter 5: 1 günde 500+ soru çözmüş
        CASE WHEN us.days_active = 1 AND us.total_questions > 500 THEN 'İlk günde 500+ soru' END,
        -- Kriter 6: Mükemmel doğruluk (500+ soru ve %100 doğruluk)
        CASE WHEN us.total_questions > 500 AND us.accuracy_rate = 100 THEN 'Mükemmel doğruluk (%100)' END
      ], NULL) as reasons
    FROM user_stats us
    WHERE 
      us.total_questions > 5000
      OR (us.total_questions > 1000 AND us.accuracy_rate > 98)
      OR (us.days_active <= 7 AND us.total_questions > 1000)
      OR us.daily_avg > 300
      OR (us.days_active = 1 AND us.total_questions > 500)
      OR (us.total_questions > 500 AND us.accuracy_rate = 100)
  )
  SELECT 
    fu.id as user_id,
    fu.full_name,
    fu.email,
    fu.created_at,
    fu.total_questions::INTEGER,
    fu.total_correct::INTEGER,
    fu.total_points::INTEGER,
    fu.accuracy_rate,
    fu.daily_avg as daily_average,
    fu.days_active as days_since_registration,
    fu.reasons as suspicion_reasons,
    CASE 
      WHEN array_length(fu.reasons, 1) >= 3 THEN 'critical'
      WHEN array_length(fu.reasons, 1) = 2 THEN 'high'
      ELSE 'medium'
    END as risk_level
  FROM flagged_users fu
  WHERE array_length(fu.reasons, 1) > 0
  ORDER BY array_length(fu.reasons, 1) DESC, fu.total_questions DESC;
END;
$$;

-- 2. Toplu askıya alma fonksiyonu
CREATE OR REPLACE FUNCTION bulk_suspend_users(
  p_user_ids UUID[],
  p_reason TEXT,
  p_admin_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Kullanıcıları askıya al
  UPDATE profiles
  SET 
    is_suspended = true,
    suspension_reason = p_reason,
    suspended_at = NOW(),
    suspended_by = p_admin_id
  WHERE id = ANY(p_user_ids)
    AND is_suspended = false;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- Log ekle
  INSERT INTO suspicious_activity_logs (user_id, activity_type, details, action_taken)
  SELECT 
    unnest(p_user_ids),
    'bulk_suspension',
    jsonb_build_object('reason', p_reason, 'admin_id', p_admin_id, 'batch_size', array_length(p_user_ids, 1)),
    'suspended';
  
  RETURN v_count;
END;
$$;

-- 3. Puanları sıfırlama fonksiyonu (hile yapanlar için)
CREATE OR REPLACE FUNCTION reset_user_points(
  p_user_id UUID,
  p_admin_id UUID,
  p_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Puanları sıfırla
  UPDATE student_points
  SET 
    total_points = 0,
    total_questions = 0,
    total_correct = 0,
    total_wrong = 0,
    current_streak = 0,
    max_streak = 0,
    updated_at = NOW()
  WHERE student_id = p_user_id;
  
  -- point_history'yi temizle (opsiyonel - audit için tutulabilir)
  -- DELETE FROM point_history WHERE student_id = p_user_id;
  
  -- Log ekle
  INSERT INTO suspicious_activity_logs (user_id, activity_type, details, action_taken)
  VALUES (
    p_user_id,
    'points_reset',
    jsonb_build_object('reason', p_reason, 'admin_id', p_admin_id),
    'points_reset'
  );
  
  RETURN true;
END;
$$;

-- 4. Geçmiş analizi özet istatistikleri
CREATE OR REPLACE FUNCTION get_historical_analysis_summary()
RETURNS TABLE (
  total_suspicious INTEGER,
  critical_count INTEGER,
  high_count INTEGER,
  medium_count INTEGER,
  total_suspicious_questions BIGINT,
  total_suspicious_points BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH suspicious AS (
    SELECT * FROM get_historical_suspicious_users()
  )
  SELECT 
    COUNT(*)::INTEGER as total_suspicious,
    COUNT(*) FILTER (WHERE risk_level = 'critical')::INTEGER as critical_count,
    COUNT(*) FILTER (WHERE risk_level = 'high')::INTEGER as high_count,
    COUNT(*) FILTER (WHERE risk_level = 'medium')::INTEGER as medium_count,
    COALESCE(SUM(total_questions), 0)::BIGINT as total_suspicious_questions,
    COALESCE(SUM(total_points), 0)::BIGINT as total_suspicious_points
  FROM suspicious;
END;
$$;

-- =====================================================
-- Bilgilendirme
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Geçmiş bot tespiti fonksiyonları eklendi!';
  RAISE NOTICE '📊 get_historical_suspicious_users() - Şüpheli kullanıcıları listeler';
  RAISE NOTICE '🚫 bulk_suspend_users() - Toplu askıya alma';
  RAISE NOTICE '🔄 reset_user_points() - Puanları sıfırlama';
  RAISE NOTICE '📈 get_historical_analysis_summary() - Özet istatistikler';
END $$;

-- =====================================================
-- Geçmiş Bot Tespiti - JOIN Düzeltmesi
-- student_points.student_id -> student_profiles.id -> profiles
-- =====================================================

-- 1. Düzeltilmiş geçmiş analizi fonksiyonu
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
      sp.student_id,
      stp.user_id as profile_user_id,
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
    FROM student_points sp
    JOIN student_profiles stp ON stp.id = sp.student_id
    JOIN profiles p ON p.id = stp.user_id
    WHERE p.role = 'ogrenci'
      AND COALESCE(p.is_suspended, false) = false  -- Zaten askıya alınmamış olanlar
  ),
  flagged_users AS (
    SELECT 
      us.*,
      ARRAY_REMOVE(ARRAY[
        -- Kriter 1: Çok yüksek soru sayısı (3000+)
        CASE WHEN us.total_questions > 3000 THEN 'Çok yüksek soru sayısı (' || us.total_questions || ')' END,
        -- Kriter 2: Anormal doğruluk oranı (500+ soru ve %97+ doğruluk)
        CASE WHEN us.total_questions > 500 AND us.accuracy_rate > 97 THEN 'Anormal doğruluk (%' || us.accuracy_rate || ')' END,
        -- Kriter 3: Günlük ortalama çok yüksek (200+)
        CASE WHEN us.daily_avg > 200 THEN 'Günlük ortalama çok yüksek (' || us.daily_avg || ')' END,
        -- Kriter 4: 1 günde 500+ soru çözmüş
        CASE WHEN us.days_active <= 1 AND us.total_questions > 500 THEN 'İlk günde ' || us.total_questions || ' soru' END,
        -- Kriter 5: Yeni hesap + yüksek hacim (3 gün içinde 1000+ soru)
        CASE WHEN us.days_active <= 3 AND us.total_questions > 1000 THEN 'Yeni hesap + yüksek hacim' END,
        -- Kriter 6: Mükemmel doğruluk (200+ soru ve %99+ doğruluk)
        CASE WHEN us.total_questions > 200 AND us.accuracy_rate >= 99 THEN 'Neredeyse mükemmel doğruluk (%' || us.accuracy_rate || ')' END,
        -- Kriter 7: 1000+ soru
        CASE WHEN us.total_questions > 1000 THEN '1000+ soru çözmüş' END
      ], NULL) as reasons
    FROM user_stats us
    WHERE 
      us.total_questions > 3000
      OR (us.total_questions > 500 AND us.accuracy_rate > 97)
      OR us.daily_avg > 200
      OR (us.days_active <= 1 AND us.total_questions > 500)
      OR (us.days_active <= 3 AND us.total_questions > 1000)
      OR (us.total_questions > 200 AND us.accuracy_rate >= 99)
      OR us.total_questions > 1000
  )
  SELECT 
    fu.profile_user_id as user_id,
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
      WHEN array_length(fu.reasons, 1) >= 4 THEN 'critical'
      WHEN array_length(fu.reasons, 1) >= 2 THEN 'high'
      ELSE 'medium'
    END as risk_level
  FROM flagged_users fu
  WHERE array_length(fu.reasons, 1) > 0
  ORDER BY array_length(fu.reasons, 1) DESC, fu.total_questions DESC;
END;
$$;

-- 2. Düzeltilmiş özet istatistikler
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

-- 3. Canlı izleme fonksiyonunu da düzelt
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
    stp.user_id as user_id,
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
  JOIN student_profiles stp ON stp.user_id = p.id
  LEFT JOIN student_points sp ON sp.student_id = stp.id
  LEFT JOIN recent_activity ra ON ra.student_id = stp.id
  WHERE p.role = 'ogrenci'
    AND (
      ra.question_count > 50
      OR ra.avg_time < 2000
      OR (sp.total_questions > 100 AND (sp.total_correct::numeric / NULLIF(sp.total_questions, 0)) > 0.95)
      OR p.is_suspended = true
      OR p.risk_score > 50
    )
  ORDER BY ra.question_count DESC NULLS LAST;
END;
$$;

-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Gecmis bot tespiti fonksiyonlari duzeltildi!';
  RAISE NOTICE 'Join duzeltmesi: student_points -> student_profiles -> profiles';
  RAISE NOTICE 'Kriterler gevsetildi: 1000+ soru, 200+/gun, 97+ dogruluk';
END $$;

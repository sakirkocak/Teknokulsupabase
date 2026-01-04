-- =====================================================
-- ANTİ-SCRAPİNG GÜVENLİK SİSTEMİ
-- Web kazıma ve bot saldırılarına karşı koruma
-- =====================================================

-- 1. Güvenlik logları tablosu
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  path TEXT NOT NULL,
  method TEXT DEFAULT 'GET',
  risk_score INTEGER DEFAULT 0,
  is_blocked BOOLEAN DEFAULT false,
  reasons TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  country_code TEXT,
  request_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_security_logs_ip ON security_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_logs_created ON security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_logs_risk ON security_logs(risk_score);
CREATE INDEX IF NOT EXISTS idx_security_logs_blocked ON security_logs(is_blocked) WHERE is_blocked = true;

-- 2. IP engel listesi (kalıcı engeller için)
CREATE TABLE IF NOT EXISTS blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  blocked_by UUID REFERENCES auth.users(id),
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL = kalıcı engel
  is_active BOOLEAN DEFAULT true,
  request_count_at_block INTEGER DEFAULT 0,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_blocked_ips_active ON blocked_ips(ip_address) WHERE is_active = true;

-- 3. Honeypot tuzak tablosu (bot tespiti için)
CREATE TABLE IF NOT EXISTS honeypot_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  trap_type TEXT NOT NULL, -- 'hidden_link', 'fake_api', 'rapid_access'
  trap_path TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_honeypot_ip ON honeypot_triggers(ip_address);
CREATE INDEX IF NOT EXISTS idx_honeypot_created ON honeypot_triggers(created_at);

-- 4. Rate limit ihlalleri tablosu
CREATE TABLE IF NOT EXISTS rate_limit_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL,
  window_seconds INTEGER NOT NULL,
  max_allowed INTEGER NOT NULL,
  violation_time TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_violations_ip ON rate_limit_violations(ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_violations_time ON rate_limit_violations(violation_time);

-- 5. RPC: IP engelle
CREATE OR REPLACE FUNCTION block_ip(
  p_ip_address TEXT,
  p_reason TEXT,
  p_admin_id UUID DEFAULT NULL,
  p_duration_hours INTEGER DEFAULT NULL -- NULL = kalıcı
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
  v_expires TIMESTAMPTZ;
BEGIN
  -- Süre belirtilmişse hesapla
  IF p_duration_hours IS NOT NULL THEN
    v_expires := NOW() + (p_duration_hours || ' hours')::interval;
  END IF;
  
  -- Mevcut kaydı güncelle veya yeni ekle
  INSERT INTO blocked_ips (ip_address, reason, blocked_by, expires_at, is_active)
  VALUES (p_ip_address, p_reason, p_admin_id, v_expires, true)
  ON CONFLICT (ip_address) 
  DO UPDATE SET 
    reason = p_reason,
    blocked_by = p_admin_id,
    blocked_at = NOW(),
    expires_at = v_expires,
    is_active = true
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- 6. RPC: IP engelini kaldır
CREATE OR REPLACE FUNCTION unblock_ip(p_ip_address TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE blocked_ips
  SET is_active = false
  WHERE ip_address = p_ip_address;
  
  RETURN FOUND;
END;
$$;

-- 7. RPC: IP engelli mi kontrol et
CREATE OR REPLACE FUNCTION is_ip_blocked(p_ip_address TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_blocked BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM blocked_ips
    WHERE ip_address = p_ip_address
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
  ) INTO v_blocked;
  
  RETURN v_blocked;
END;
$$;

-- 8. RPC: Şüpheli IP'leri listele (son 24 saat)
CREATE OR REPLACE FUNCTION get_suspicious_ips(p_hours INTEGER DEFAULT 24)
RETURNS TABLE (
  ip_address TEXT,
  total_requests BIGINT,
  blocked_requests BIGINT,
  avg_risk_score NUMERIC,
  max_risk_score INTEGER,
  first_seen TIMESTAMPTZ,
  last_seen TIMESTAMPTZ,
  is_currently_blocked BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sl.ip_address,
    COUNT(*)::BIGINT as total_requests,
    COUNT(*) FILTER (WHERE sl.is_blocked)::BIGINT as blocked_requests,
    ROUND(AVG(sl.risk_score), 1) as avg_risk_score,
    MAX(sl.risk_score) as max_risk_score,
    MIN(sl.created_at) as first_seen,
    MAX(sl.created_at) as last_seen,
    EXISTS (
      SELECT 1 FROM blocked_ips bi 
      WHERE bi.ip_address = sl.ip_address 
        AND bi.is_active = true
        AND (bi.expires_at IS NULL OR bi.expires_at > NOW())
    ) as is_currently_blocked
  FROM security_logs sl
  WHERE sl.created_at > NOW() - (p_hours || ' hours')::interval
  GROUP BY sl.ip_address
  HAVING COUNT(*) > 50 OR MAX(sl.risk_score) > 30
  ORDER BY COUNT(*) DESC
  LIMIT 100;
END;
$$;

-- 9. RPC: Honeypot tetiklemelerini kontrol et
CREATE OR REPLACE FUNCTION check_honeypot_triggers(p_ip_address TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM honeypot_triggers
  WHERE ip_address = p_ip_address
    AND created_at > NOW() - INTERVAL '24 hours';
  
  RETURN v_count;
END;
$$;

-- 10. Güvenlik log temizleme (30 günden eski)
CREATE OR REPLACE FUNCTION cleanup_security_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM security_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  
  -- Rate limit ihlallerini de temizle
  DELETE FROM rate_limit_violations
  WHERE violation_time < NOW() - INTERVAL '7 days';
  
  RETURN v_deleted;
END;
$$;

-- 11. Süresi dolmuş IP engellerini temizle
CREATE OR REPLACE FUNCTION cleanup_expired_blocks()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE blocked_ips
  SET is_active = false
  WHERE is_active = true
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

-- 12. RLS Politikaları
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE honeypot_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_violations ENABLE ROW LEVEL SECURITY;

-- Sadece adminler görebilir
CREATE POLICY "Admins can view security_logs" ON security_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view blocked_ips" ON blocked_ips
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view honeypot_triggers" ON honeypot_triggers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view rate_limit_violations" ON rate_limit_violations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Service role insert için
CREATE POLICY "Service can insert security_logs" ON security_logs
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Service can insert honeypot_triggers" ON honeypot_triggers
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Service can insert rate_limit_violations" ON rate_limit_violations
  FOR INSERT TO service_role
  WITH CHECK (true);

-- =====================================================
-- Bilgilendirme
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Anti-scraping güvenlik sistemi kuruldu!';
  RAISE NOTICE '📊 Yeni tablolar: security_logs, blocked_ips, honeypot_triggers, rate_limit_violations';
  RAISE NOTICE '🔒 RPC fonksiyonları: block_ip, unblock_ip, is_ip_blocked, get_suspicious_ips';
  RAISE NOTICE '🧹 Temizlik fonksiyonları: cleanup_security_logs, cleanup_expired_blocks';
END $$;

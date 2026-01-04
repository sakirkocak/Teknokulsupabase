-- =====================================================
-- Security Tables RLS Fix
-- Supabase Security Advisor uyarılarını düzelt
-- =====================================================

-- 1. suspicious_activity_logs - RLS aktifleştir
ALTER TABLE public.suspicious_activity_logs ENABLE ROW LEVEL SECURITY;

-- Admin'ler tüm logları görebilir
CREATE POLICY "Admins can view all suspicious logs"
ON public.suspicious_activity_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Service role her şeyi yapabilir (trigger'lar için)
CREATE POLICY "Service role full access on suspicious_logs"
ON public.suspicious_activity_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. quiz_sessions - RLS aktifleştir
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi session'larını görebilir
CREATE POLICY "Users can view own quiz sessions"
ON public.quiz_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Kullanıcılar kendi session'larını oluşturabilir
CREATE POLICY "Users can create own quiz sessions"
ON public.quiz_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi session'larını güncelleyebilir
CREATE POLICY "Users can update own quiz sessions"
ON public.quiz_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Service role full access (trigger'lar için)
CREATE POLICY "Service role full access on quiz_sessions"
ON public.quiz_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. question_bank_rate_limits - RLS aktifleştir
ALTER TABLE public.question_bank_rate_limits ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi rate limit'lerini görebilir
CREATE POLICY "Users can view own rate limits"
ON public.question_bank_rate_limits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Service role full access (rate limiting function için)
CREATE POLICY "Service role full access on rate_limits"
ON public.question_bank_rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- Bilgilendirme
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ RLS aktifleştirildi:';
  RAISE NOTICE '   - suspicious_activity_logs';
  RAISE NOTICE '   - quiz_sessions';
  RAISE NOTICE '   - question_bank_rate_limits';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Policy''ler eklendi:';
  RAISE NOTICE '   - Admin''ler suspicious logs görebilir';
  RAISE NOTICE '   - Kullanıcılar kendi verilerini görebilir';
  RAISE NOTICE '   - Service role full access (trigger''lar için)';
END
$$;

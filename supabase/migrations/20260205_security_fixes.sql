-- ============================================
-- FAZ 3: GÜVENLİK VE RLS YAMASI
-- Tarih: 2025-12-28
-- ============================================

-- ============================================
-- 1. RLS'İ UNUTULAN TABLOLARDA AKTİF ET
-- ============================================

-- Linter tarafından raporlanan tablolar
ALTER TABLE IF EXISTS public.teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.material_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.favorite_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.favorite_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.typesense_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.typesense_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ghost_records ENABLE ROW LEVEL SECURITY;

-- Partition tabloları için RLS
ALTER TABLE IF EXISTS public.user_answers_2025_q1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_answers_2025_q2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_answers_2025_q3 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_answers_2025_q4 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_answers_2026_q1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_answers_2026_q2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_answers_2026_q3 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_answers_2026_q4 ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. SECURITY DEFINER GÖRÜNÜMLERİ GÜVENLİ HALE GETİR
-- ============================================
-- Security Definer (Yönetici yetkisi) yerine 
-- Security Invoker (Sorgulayan kişinin yetkisi) kullan

ALTER VIEW IF EXISTS public.subject_stats_view SET (security_invoker = on);
ALTER VIEW IF EXISTS public.parent_student_relations SET (security_invoker = on);
ALTER VIEW IF EXISTS public.leaderboard_fen SET (security_invoker = on);
ALTER VIEW IF EXISTS public.leaderboard_general SET (security_invoker = on);
ALTER VIEW IF EXISTS public.leaderboard_matematik SET (security_invoker = on);
ALTER VIEW IF EXISTS public.leaderboard_turkce SET (security_invoker = on);
ALTER VIEW IF EXISTS public.grade_subjects_view SET (security_invoker = on);

-- ============================================
-- 3. TEMEL SİSTEM POLİTİKALARI
-- ============================================

-- typesense_sync_log: Sadece service_role erişebilmeli
DROP POLICY IF EXISTS "Service role full access sync log" ON public.typesense_sync_log;
CREATE POLICY "Service role full access sync log" ON public.typesense_sync_log 
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- typesense_config: Sadece service_role erişebilmeli
DROP POLICY IF EXISTS "Service role full access config" ON public.typesense_config;
CREATE POLICY "Service role full access config" ON public.typesense_config 
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ghost_records: Sadece service_role erişebilmeli
DROP POLICY IF EXISTS "Service role full access ghost" ON public.ghost_records;
CREATE POLICY "Service role full access ghost" ON public.ghost_records 
FOR ALL TO service_role USING (true) WITH CHECK (true);

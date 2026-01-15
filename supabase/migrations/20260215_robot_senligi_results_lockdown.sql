-- =====================================================
-- Robot Şenliği Sonuçlar Lockdown
-- - robot_evaluations: sadece admin SELECT edebilsin
-- - anon/authenticated INSERT edebilsin (değerlendirme sayfası çalışsın)
-- - admin UPDATE/DELETE edebilsin (admin paneli temizleme/silme işlemleri)
-- =====================================================

-- 1) RLS aç
ALTER TABLE public.robot_evaluations ENABLE ROW LEVEL SECURITY;

-- 2) Eski policy'leri güvenli şekilde temizle (varsa)
DROP POLICY IF EXISTS "robot_evaluations_select_admin_only" ON public.robot_evaluations;
DROP POLICY IF EXISTS "robot_evaluations_insert_public" ON public.robot_evaluations;
DROP POLICY IF EXISTS "robot_evaluations_admin_update" ON public.robot_evaluations;
DROP POLICY IF EXISTS "robot_evaluations_admin_delete" ON public.robot_evaluations;
DROP POLICY IF EXISTS "robot_evaluations_service_role_all" ON public.robot_evaluations;

-- 3) Admin SELECT (sonuçlar/admin paneli)
CREATE POLICY "robot_evaluations_select_admin_only"
ON public.robot_evaluations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

-- 4) Herkes değerlendirme ekleyebilsin (QR ile gelen öğretmen/jüri kayıtsız olabilir)
CREATE POLICY "robot_evaluations_insert_public"
ON public.robot_evaluations
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 5) Admin update/delete (panelden silme vb.)
CREATE POLICY "robot_evaluations_admin_update"
ON public.robot_evaluations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

CREATE POLICY "robot_evaluations_admin_delete"
ON public.robot_evaluations
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

-- 6) Service role full access (opsiyonel: backend job/maintenance)
CREATE POLICY "robot_evaluations_service_role_all"
ON public.robot_evaluations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Not:
-- robots tablosuna dokunmuyoruz; değerlendirme sayfası robotu qr_code ile bulmaya devam edecek.


-- =====================================================
-- LaTeX Escape Karakterleri Düzeltme Migration
-- Tarih: 27 Aralık 2025
-- Açıklama: AI tarafından üretilen sorulardaki bozuk LaTeX
--           kodlarını düzeltir (backslash escape sorunu)
-- =====================================================

-- Önce kaç soru etkilenecek kontrol edelim (bilgi amaçlı)
DO $$
DECLARE
    affected_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO affected_count
    FROM questions
    WHERE question_text LIKE '%imes%'
       OR question_text LIKE '%\ rac%'
       OR question_text LIKE '%rac{%'
       OR question_text LIKE '%ightarrow%'
       OR question_text LIKE '%ext{%'
       OR explanation LIKE '%imes%'
       OR explanation LIKE '%\ rac%'
       OR explanation LIKE '%rac{%'
       OR explanation LIKE '%ightarrow%'
       OR explanation LIKE '%ext{%';
    
    RAISE NOTICE '🔧 Etkilenecek tahmini soru sayısı: %', affected_count;
END $$;

-- =====================================================
-- QUESTION_TEXT DÜZELTMELERI
-- =====================================================

-- 1. "\ rac" -> "\frac" (boşluk + rac -> \frac)
UPDATE questions SET question_text = REPLACE(question_text, '\ rac', '\frac')
WHERE question_text LIKE '%\ rac%';

-- 2. "rac{" -> "\frac{" (sadece rac ile başlayan frac'ler)
-- NOT: Dikkatli olmalıyız, "rac" kelimesi başka yerlerde geçebilir
-- Bu yüzden sadece "{" ile devam edenleri düzeltiyoruz
UPDATE questions SET question_text = REPLACE(question_text, 'rac{', '\frac{')
WHERE question_text LIKE '%rac{%' AND question_text NOT LIKE '%\frac{%';

-- 3. "imes" -> "\times" (çarpma işareti)
UPDATE questions SET question_text = REPLACE(question_text, 'imes', '\times')
WHERE question_text LIKE '%imes%';

-- 4. "ightarrow" -> "\rightarrow" (sağ ok)
UPDATE questions SET question_text = REPLACE(question_text, 'ightarrow', '\rightarrow')
WHERE question_text LIKE '%ightarrow%';

-- 5. "ext{" -> "\text{" (metin)
UPDATE questions SET question_text = REPLACE(question_text, 'ext{', '\text{')
WHERE question_text LIKE '%ext{%' AND question_text NOT LIKE '%\text{%';

-- 6. "extkJ" -> "\text{kJ}" 
UPDATE questions SET question_text = REPLACE(question_text, 'extkJ', '\text{kJ}')
WHERE question_text LIKE '%extkJ%';

-- 7. "extmol" -> "\text{mol}"
UPDATE questions SET question_text = REPLACE(question_text, 'extmol', '\text{mol}')
WHERE question_text LIKE '%extmol%';

-- 8. "extg" -> "\text{g}"
UPDATE questions SET question_text = REPLACE(question_text, 'extg', '\text{g}')
WHERE question_text LIKE '%extg%';

-- 9. "sqrt{" -> "\sqrt{" (karekök)
UPDATE questions SET question_text = REPLACE(question_text, 'sqrt{', '\sqrt{')
WHERE question_text LIKE '%sqrt{%' AND question_text NOT LIKE '%\sqrt{%';

-- 10. " div " -> " \div " (bölme)
UPDATE questions SET question_text = REPLACE(question_text, ' div ', ' \div ')
WHERE question_text LIKE '% div %';

-- 11. "cdot" -> "\cdot" (nokta çarpım)
UPDATE questions SET question_text = REPLACE(question_text, 'cdot', '\cdot')
WHERE question_text LIKE '%cdot%' AND question_text NOT LIKE '%\cdot%';

-- 12. " pm " -> " \pm " (artı/eksi)
UPDATE questions SET question_text = REPLACE(question_text, ' pm ', ' \pm ')
WHERE question_text LIKE '% pm %';

-- 13. "leq " -> "\leq " (küçük eşit)
UPDATE questions SET question_text = REPLACE(question_text, 'leq ', '\leq ')
WHERE question_text LIKE '%leq %' AND question_text NOT LIKE '%\leq %';

-- 14. "geq " -> "\geq " (büyük eşit)
UPDATE questions SET question_text = REPLACE(question_text, 'geq ', '\geq ')
WHERE question_text LIKE '%geq %' AND question_text NOT LIKE '%\geq %';

-- 15. "neq " -> "\neq " (eşit değil)
UPDATE questions SET question_text = REPLACE(question_text, 'neq ', '\neq ')
WHERE question_text LIKE '%neq %' AND question_text NOT LIKE '%\neq %';

-- 16. "alpha" -> "\alpha"
UPDATE questions SET question_text = REPLACE(question_text, 'alpha', '\alpha')
WHERE question_text LIKE '%alpha%' AND question_text NOT LIKE '%\alpha%';

-- 17. "beta" -> "\beta"
UPDATE questions SET question_text = REPLACE(question_text, 'beta', '\beta')
WHERE question_text LIKE '%beta%' AND question_text NOT LIKE '%\beta%';

-- 18. "pi" tek başına -> "\pi" (dikkat: "pi" kelimesi başka yerlerde geçebilir)
-- Bu risky olduğu için $pi$ formatını hedefliyoruz
UPDATE questions SET question_text = REPLACE(question_text, '$pi$', '$\pi$')
WHERE question_text LIKE '%$pi$%';

-- =====================================================
-- EXPLANATION DÜZELTMELERI (Aynı pattern'ler)
-- =====================================================

UPDATE questions SET explanation = REPLACE(explanation, '\ rac', '\frac')
WHERE explanation LIKE '%\ rac%';

UPDATE questions SET explanation = REPLACE(explanation, 'rac{', '\frac{')
WHERE explanation LIKE '%rac{%' AND explanation NOT LIKE '%\frac{%';

UPDATE questions SET explanation = REPLACE(explanation, 'imes', '\times')
WHERE explanation LIKE '%imes%';

UPDATE questions SET explanation = REPLACE(explanation, 'ightarrow', '\rightarrow')
WHERE explanation LIKE '%ightarrow%';

UPDATE questions SET explanation = REPLACE(explanation, 'ext{', '\text{')
WHERE explanation LIKE '%ext{%' AND explanation NOT LIKE '%\text{%';

UPDATE questions SET explanation = REPLACE(explanation, 'extkJ', '\text{kJ}')
WHERE explanation LIKE '%extkJ%';

UPDATE questions SET explanation = REPLACE(explanation, 'extmol', '\text{mol}')
WHERE explanation LIKE '%extmol%';

UPDATE questions SET explanation = REPLACE(explanation, 'extg', '\text{g}')
WHERE explanation LIKE '%extg%';

UPDATE questions SET explanation = REPLACE(explanation, 'sqrt{', '\sqrt{')
WHERE explanation LIKE '%sqrt{%' AND explanation NOT LIKE '%\sqrt{%';

UPDATE questions SET explanation = REPLACE(explanation, ' div ', ' \div ')
WHERE explanation LIKE '% div %';

UPDATE questions SET explanation = REPLACE(explanation, 'cdot', '\cdot')
WHERE explanation LIKE '%cdot%' AND explanation NOT LIKE '%\cdot%';

UPDATE questions SET explanation = REPLACE(explanation, ' pm ', ' \pm ')
WHERE explanation LIKE '% pm %';

UPDATE questions SET explanation = REPLACE(explanation, 'leq ', '\leq ')
WHERE explanation LIKE '%leq %' AND explanation NOT LIKE '%\leq %';

UPDATE questions SET explanation = REPLACE(explanation, 'geq ', '\geq ')
WHERE explanation LIKE '%geq %' AND explanation NOT LIKE '%\geq %';

UPDATE questions SET explanation = REPLACE(explanation, 'neq ', '\neq ')
WHERE explanation LIKE '%neq %' AND explanation NOT LIKE '%\neq %';

UPDATE questions SET explanation = REPLACE(explanation, 'alpha', '\alpha')
WHERE explanation LIKE '%alpha%' AND explanation NOT LIKE '%\alpha%';

UPDATE questions SET explanation = REPLACE(explanation, 'beta', '\beta')
WHERE explanation LIKE '%beta%' AND explanation NOT LIKE '%\beta%';

UPDATE questions SET explanation = REPLACE(explanation, '$pi$', '$\pi$')
WHERE explanation LIKE '%$pi$%';

-- =====================================================
-- OPTIONS DÜZELTMELERI (JSONB)
-- =====================================================

-- Options alanı JSONB olduğu için biraz farklı yaklaşım
-- Her bir option için güncelleme
UPDATE questions SET options = (
    SELECT jsonb_object_agg(
        key,
        REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
            value::text,
            'imes', '\times'),
            '\ rac', '\frac'),
            'rac{', '\frac{'),
            'ightarrow', '\rightarrow'),
            'ext{', '\text{')
    )
    FROM jsonb_each_text(options)
)
WHERE options::text LIKE '%imes%'
   OR options::text LIKE '%\ rac%'
   OR options::text LIKE '%rac{%'
   OR options::text LIKE '%ightarrow%'
   OR options::text LIKE '%ext{%';

-- =====================================================
-- SONUÇ RAPORU
-- =====================================================

DO $$
DECLARE
    remaining_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_count
    FROM questions
    WHERE question_text LIKE '%imes%'
       OR question_text LIKE '%\ rac%'
       OR question_text LIKE '%ightarrow%'
       OR explanation LIKE '%imes%'
       OR explanation LIKE '%\ rac%'
       OR explanation LIKE '%ightarrow%';
    
    IF remaining_count = 0 THEN
        RAISE NOTICE '✅ Tüm LaTeX hataları düzeltildi!';
    ELSE
        RAISE NOTICE '⚠️ Kalan potansiyel sorunlu kayıt: %', remaining_count;
    END IF;
END $$;


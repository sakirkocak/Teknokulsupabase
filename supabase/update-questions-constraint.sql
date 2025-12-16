-- =====================================================
-- QUESTIONS TABLOSU GÜNCELLEME
-- Lise (9-12. sınıf) için 5 şık (E) desteği
-- =====================================================

-- Mevcut constraint'i kaldır
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_correct_answer_check;

-- Yeni constraint ekle (A, B, C, D, E destekli)
ALTER TABLE questions ADD CONSTRAINT questions_correct_answer_check 
    CHECK (correct_answer IN ('A', 'B', 'C', 'D', 'E'));

-- lgs_questions tablosu için de güncelle (varsa)
ALTER TABLE lgs_questions DROP CONSTRAINT IF EXISTS lgs_questions_correct_answer_check;
ALTER TABLE lgs_questions ADD CONSTRAINT lgs_questions_correct_answer_check 
    CHECK (correct_answer IN ('A', 'B', 'C', 'D', 'E'));

-- Yorum ekle
COMMENT ON TABLE questions IS 'Sorular tablosu - İlkokul/Ortaokul 4 şık (A-D), Lise 5 şık (A-E)';


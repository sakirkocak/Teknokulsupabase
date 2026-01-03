-- =====================================================
-- TÜM DERS BAZLI PUAN KOLONLARINI EKLE
-- student_points tablosuna eksik ders kolonlarını ekler
-- =====================================================

-- Sosyal Bilgiler
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS sosyal_points INTEGER DEFAULT 0;
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS sosyal_correct INTEGER DEFAULT 0;
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS sosyal_wrong INTEGER DEFAULT 0;

-- Hayat Bilgisi
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS hayat_points INTEGER DEFAULT 0;
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS hayat_correct INTEGER DEFAULT 0;
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS hayat_wrong INTEGER DEFAULT 0;

-- Edebiyat
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS edebiyat_points INTEGER DEFAULT 0;
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS edebiyat_correct INTEGER DEFAULT 0;
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS edebiyat_wrong INTEGER DEFAULT 0;

-- Fizik
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS fizik_points INTEGER DEFAULT 0;
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS fizik_correct INTEGER DEFAULT 0;
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS fizik_wrong INTEGER DEFAULT 0;

-- Kimya
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS kimya_points INTEGER DEFAULT 0;
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS kimya_correct INTEGER DEFAULT 0;
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS kimya_wrong INTEGER DEFAULT 0;

-- Biyoloji
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS biyoloji_points INTEGER DEFAULT 0;
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS biyoloji_correct INTEGER DEFAULT 0;
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS biyoloji_wrong INTEGER DEFAULT 0;

-- Tarih
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS tarih_points INTEGER DEFAULT 0;
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS tarih_correct INTEGER DEFAULT 0;
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS tarih_wrong INTEGER DEFAULT 0;

-- Coğrafya
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS cografya_points INTEGER DEFAULT 0;
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS cografya_correct INTEGER DEFAULT 0;
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS cografya_wrong INTEGER DEFAULT 0;

-- Felsefe
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS felsefe_points INTEGER DEFAULT 0;
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS felsefe_correct INTEGER DEFAULT 0;
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS felsefe_wrong INTEGER DEFAULT 0;

-- Görsel Sanatlar
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS gorsel_points INTEGER DEFAULT 0;
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS gorsel_correct INTEGER DEFAULT 0;
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS gorsel_wrong INTEGER DEFAULT 0;

-- Müzik
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS muzik_points INTEGER DEFAULT 0;
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS muzik_correct INTEGER DEFAULT 0;
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS muzik_wrong INTEGER DEFAULT 0;

-- Beden Eğitimi
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS beden_points INTEGER DEFAULT 0;
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS beden_correct INTEGER DEFAULT 0;
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS beden_wrong INTEGER DEFAULT 0;

-- Bilişim
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS bilisim_points INTEGER DEFAULT 0;
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS bilisim_correct INTEGER DEFAULT 0;
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS bilisim_wrong INTEGER DEFAULT 0;

-- Teknoloji ve Tasarım
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS teknoloji_points INTEGER DEFAULT 0;
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS teknoloji_correct INTEGER DEFAULT 0;
ALTER TABLE student_points ADD COLUMN IF NOT EXISTS teknoloji_wrong INTEGER DEFAULT 0;

-- =====================================================
-- INDEX'LER
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_student_points_hayat ON student_points(hayat_points DESC);
CREATE INDEX IF NOT EXISTS idx_student_points_fizik ON student_points(fizik_points DESC);
CREATE INDEX IF NOT EXISTS idx_student_points_kimya ON student_points(kimya_points DESC);
CREATE INDEX IF NOT EXISTS idx_student_points_biyoloji ON student_points(biyoloji_points DESC);
CREATE INDEX IF NOT EXISTS idx_student_points_teknoloji ON student_points(teknoloji_points DESC);

-- =====================================================
-- MEVCUT VERİLERİ TYPESENSE'DEN DOLDUR (Opsiyonel)
-- Bu kısım manuel yapılmalı - typesense-migrate.js çalıştırılmalı
-- =====================================================

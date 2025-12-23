-- Öne çıkan sınavlar için alan ekle
ALTER TABLE exam_dates ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE exam_dates ADD COLUMN IF NOT EXISTS featured_order INTEGER DEFAULT 0;

-- Varsayılan olarak LGS, YKS-TYT, YKS-AYT, KPSS'yi öne çıkar
UPDATE exam_dates SET is_featured = true, featured_order = 1 WHERE title LIKE '%LGS%';
UPDATE exam_dates SET is_featured = true, featured_order = 2 WHERE title LIKE '%YKS-TYT%';
UPDATE exam_dates SET is_featured = true, featured_order = 3 WHERE title LIKE '%YKS-AYT%';
UPDATE exam_dates SET is_featured = true, featured_order = 4 WHERE title LIKE '%KPSS Lisans%GY-GK%';


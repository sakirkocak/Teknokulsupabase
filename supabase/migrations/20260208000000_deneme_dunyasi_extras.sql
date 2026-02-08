-- Deneme Dünyası ek alanlar ve puanlama kuralları seed

-- mock_exams'e question_count ve subjects alanı
ALTER TABLE mock_exams ADD COLUMN IF NOT EXISTS question_count INTEGER DEFAULT 0;
ALTER TABLE mock_exams ADD COLUMN IF NOT EXISTS subjects JSONB DEFAULT '[]';

-- Bursluluk puanlama kuralları seed
INSERT INTO exam_scoring_rules (exam_type, year, base_points, coefficients, description) VALUES
('BURSLULUK_5', 2026, 200, '{"turkce":3,"matematik":3,"fen_bilimleri":3,"sosyal_bilgiler":3}', '5. Sınıf Bursluluk 2026'),
('BURSLULUK_6', 2026, 200, '{"turkce":3,"matematik":3,"fen_bilimleri":3,"sosyal_bilgiler":3}', '6. Sınıf Bursluluk 2026'),
('BURSLULUK_7', 2026, 200, '{"turkce":3,"matematik":3,"fen_bilimleri":3,"sosyal_bilgiler":3}', '7. Sınıf Bursluluk 2026'),
('BURSLULUK_8', 2026, 200, '{"turkce":3,"matematik":3,"fen_bilimleri":3,"sosyal_bilgiler":3}', '8. Sınıf Bursluluk 2026'),
('LGS', 2026, 194.752, '{"turkce":4.348,"matematik":4.2538,"fen_bilimleri":4.348,"inkilap_tarihi":2.174,"din_kulturu":2.174,"ingilizce":2.174}', 'LGS 2026')
ON CONFLICT (exam_type, year) DO NOTHING;

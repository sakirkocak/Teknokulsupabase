-- Deneme Dünyası (Mock Exams) Veritabanı Yapısı

-- 1. Sınav Türleri ve Puanlama Kuralları
-- Her yıl veya dönem değişebilen katsayıları tutar.
CREATE TABLE IF NOT EXISTS exam_scoring_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_type TEXT NOT NULL, -- 'LGS', 'BURSLULUK_5', 'BURSLULUK_6', 'BURSLULUK_LİSE'
    year INTEGER NOT NULL DEFAULT extract(year from now()),
    base_points NUMERIC(10, 4) DEFAULT 0, -- Taban puan (Örn: 194.752)
    coefficients JSONB NOT NULL, -- Ders katsayıları: {"turkce": 4.348, "matematik": 4.2538 ...}
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(exam_type, year)
);

-- 2. Deneme Sınavları (Ana Tablo)
CREATE TABLE IF NOT EXISTS mock_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL, -- "2026 LGS Genel Deneme - 1"
    slug TEXT NOT NULL UNIQUE, -- SEO URL: /deneme-dunyasi/2026-lgs-genel-deneme-1
    description TEXT,
    grade INTEGER NOT NULL CHECK (grade BETWEEN 5 AND 12),
    exam_type TEXT NOT NULL, -- LGS, BURSLULUK, KONU_TARAMA
    duration INTEGER NOT NULL DEFAULT 120, -- Dakika cinsinden süre
    is_active BOOLEAN DEFAULT false,
    start_date TIMESTAMPTZ, -- Opsiyonel: Sınavın aktif olacağı tarih aralığı
    end_date TIMESTAMPTZ,
    
    -- SEO Metadata
    seo_title TEXT,
    seo_desc TEXT,
    
    -- İstatistikler (Cache amaçlı)
    total_attempts INTEGER DEFAULT 0,
    average_score NUMERIC(10, 2) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Deneme Soruları
-- Bir soru birden fazla denemede kullanılabilir mi? Evet.
CREATE TABLE IF NOT EXISTS mock_exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES mock_exams(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE RESTRICT,
    
    subject TEXT NOT NULL, -- 'MATEMATİK', 'FEN BİLİMLERİ' vb.
    question_order INTEGER NOT NULL, -- 1, 2, 3... (Kitapçık sırası)
    
    -- Opsiyonel: Konu/Kazanım bilgisi (Analiz için buraya da kopyalanabilir veya join ile çekilebilir)
    topic_name TEXT, 
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_id, question_order) -- Aynı sınavda aynı sırada iki soru olamaz
);

-- 4. Sınav Sonuçları
-- Hem kayıtlı (user_id) hem kayıtsız (guest_id) kullanıcıları destekler.
CREATE TABLE IF NOT EXISTS mock_exam_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES mock_exams(id) ON DELETE CASCADE,
    
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Kayıtlı kullanıcı
    guest_id TEXT, -- Kayıtsız kullanıcı için Cookie/Fingerprint ID
    student_name TEXT, -- Kayıtsız kullanıcı adını girebilir
    
    -- Sonuç Verileri
    score NUMERIC(10, 4), -- Hesaplanan Puan (Örn: 456.1234)
    total_net NUMERIC(10, 2), -- Toplam Net
    time_taken INTEGER, -- Harcanan süre (saniye)
    
    -- Detaylı Analiz (JSON)
    -- { "1": "A", "2": "C" ... } -> Verilen cevaplar
    answers JSONB, 
    -- { "MATEMATİK": {"dogru": 15, "yanlis": 2, "bos": 3, "net": 14.33}, ... }
    net_breakdown JSONB,
    
    -- Sıralama Bilgisi (Sınav bittiği andaki snapshot)
    rank INTEGER, 
    percentile NUMERIC(5, 2),
    
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Bir kullanıcı aynı sınavı birden fazla çözebilir mi? Evet ise unique constraint koymayız.
    -- Ancak genelde bir sınav bir kere çözülür. Şimdilik kısıtlamıyoruz.
    CONSTRAINT check_user_identity CHECK (user_id IS NOT NULL OR guest_id IS NOT NULL)
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_mock_exams_slug ON mock_exams(slug);
CREATE INDEX IF NOT EXISTS idx_mock_exams_grade_type ON mock_exams(grade, exam_type);
CREATE INDEX IF NOT EXISTS idx_mock_exam_questions_exam_id ON mock_exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_mock_exam_results_exam_score ON mock_exam_results(exam_id, score DESC); -- Sıralama için kritik
CREATE INDEX IF NOT EXISTS idx_mock_exam_results_user ON mock_exam_results(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_exam_results_guest ON mock_exam_results(guest_id);

-- RLS Politikaları
ALTER TABLE mock_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_scoring_rules ENABLE ROW LEVEL SECURITY;

-- Herkes sınavları görebilir
CREATE POLICY "Public exams view" ON mock_exams FOR SELECT USING (is_active = true OR auth.role() = 'service_role');
CREATE POLICY "Public exam questions view" ON mock_exam_questions FOR SELECT USING (true);
CREATE POLICY "Public scoring rules view" ON exam_scoring_rules FOR SELECT USING (true);

-- Sonuçları sadece sahibi görebilir (veya anonim oluşturabilir)
CREATE POLICY "Users view own results" ON mock_exam_results 
    FOR SELECT USING (auth.uid() = user_id OR guest_id = current_setting('request.headers')::json->>'x-guest-id');

CREATE POLICY "Anyone can insert results" ON mock_exam_results 
    FOR INSERT WITH CHECK (true);

-- Admin tüm yetkilere sahiptir (service_role üzerinden)

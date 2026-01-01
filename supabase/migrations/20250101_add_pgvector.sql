-- =====================================================
-- 🧠 PGVECTOR - Semantic Search için Vector Database
-- =====================================================
-- Supabase'de PostgreSQL'e pgvector eklentisi ekleniyor.
-- Bu sayede Typesense'e yük bindirmeden semantic search yapılabilir.

-- 1. pgvector eklentisini etkinleştir
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. questions tablosuna embedding kolonu ekle
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS embedding vector(768);

-- 3. Embedding için index oluştur (hızlı arama için)
-- ivfflat: Approximate Nearest Neighbor (daha hızlı, biraz daha az doğru)
-- lists: 100 = ~45K soru için optimize (sqrt(n) formülü)
CREATE INDEX IF NOT EXISTS questions_embedding_idx 
ON questions 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 4. Semantic search fonksiyonu
CREATE OR REPLACE FUNCTION search_questions_semantic(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_grade int DEFAULT NULL,
  filter_subject_code text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  question_text text,
  difficulty text,
  grade int,
  subject_code text,
  subject_name text,
  main_topic text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    q.question_text,
    q.difficulty,
    t.grade,
    s.code as subject_code,
    s.name as subject_name,
    t.main_topic,
    1 - (q.embedding <=> query_embedding) as similarity
  FROM questions q
  JOIN topics t ON q.topic_id = t.id
  JOIN subjects s ON t.subject_id = s.id
  WHERE 
    q.embedding IS NOT NULL
    AND q.is_active = true
    AND (filter_grade IS NULL OR t.grade = filter_grade)
    AND (filter_subject_code IS NULL OR s.code = filter_subject_code)
    AND 1 - (q.embedding <=> query_embedding) > match_threshold
  ORDER BY q.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 5. Hibrit arama fonksiyonu (text + semantic birleşik)
CREATE OR REPLACE FUNCTION search_questions_hybrid(
  search_query text,
  query_embedding vector(768) DEFAULT NULL,
  match_count int DEFAULT 10,
  filter_grade int DEFAULT NULL,
  filter_subject_code text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  question_text text,
  difficulty text,
  grade int,
  subject_code text,
  subject_name text,
  main_topic text,
  text_rank float,
  semantic_similarity float,
  combined_score float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    q.question_text,
    q.difficulty,
    t.grade,
    s.code as subject_code,
    s.name as subject_name,
    t.main_topic,
    ts_rank(to_tsvector('turkish', q.question_text), plainto_tsquery('turkish', search_query)) as text_rank,
    CASE 
      WHEN query_embedding IS NOT NULL AND q.embedding IS NOT NULL 
      THEN 1 - (q.embedding <=> query_embedding)
      ELSE 0 
    END as semantic_similarity,
    -- Hibrit skor: %60 text match + %40 semantic
    (
      0.6 * ts_rank(to_tsvector('turkish', q.question_text), plainto_tsquery('turkish', search_query)) +
      0.4 * CASE 
        WHEN query_embedding IS NOT NULL AND q.embedding IS NOT NULL 
        THEN 1 - (q.embedding <=> query_embedding)
        ELSE 0 
      END
    ) as combined_score
  FROM questions q
  JOIN topics t ON q.topic_id = t.id
  JOIN subjects s ON t.subject_id = s.id
  WHERE 
    q.is_active = true
    AND (filter_grade IS NULL OR t.grade = filter_grade)
    AND (filter_subject_code IS NULL OR s.code = filter_subject_code)
    AND (
      -- Text match veya semantic match varsa getir
      to_tsvector('turkish', q.question_text) @@ plainto_tsquery('turkish', search_query)
      OR (query_embedding IS NOT NULL AND q.embedding IS NOT NULL AND 1 - (q.embedding <=> query_embedding) > 0.5)
    )
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$;

-- 6. Benzer sorular fonksiyonu
CREATE OR REPLACE FUNCTION get_similar_questions(
  question_id uuid,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  question_text text,
  difficulty text,
  grade int,
  subject_code text,
  main_topic text,
  similarity float
)
LANGUAGE plpgsql
AS $$
DECLARE
  source_embedding vector(768);
BEGIN
  -- Kaynak sorunun embedding'ini al
  SELECT embedding INTO source_embedding 
  FROM questions 
  WHERE questions.id = question_id;
  
  IF source_embedding IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    q.id,
    q.question_text,
    q.difficulty,
    t.grade,
    s.code as subject_code,
    t.main_topic,
    1 - (q.embedding <=> source_embedding) as similarity
  FROM questions q
  JOIN topics t ON q.topic_id = t.id
  JOIN subjects s ON t.subject_id = s.id
  WHERE 
    q.id != question_id
    AND q.embedding IS NOT NULL
    AND q.is_active = true
  ORDER BY q.embedding <=> source_embedding
  LIMIT match_count;
END;
$$;

-- Açıklama
COMMENT ON COLUMN questions.embedding IS '🧠 Semantic Search - Gemini text-embedding-004 ile üretilen 768 boyutlu vektör';
